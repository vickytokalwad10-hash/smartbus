import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SeatOccupancyBar from './SeatOccupancyBar';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom pulsing bus marker
const createBusIcon = (color = '#003fb1', label = '') => L.divIcon({
  className: '',
  html: `
    <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
      <div style="
        background:${color}; color:white; padding:4px 8px; border-radius:8px;
        font-size:11px; font-weight:700; font-family:Inter,sans-serif;
        box-shadow:0 4px 12px rgba(0,0,0,0.3); display:flex; align-items:center; gap:4px;
        white-space:nowrap;
      ">
        <span style="font-family:'Material Symbols Outlined';font-size:14px;">directions_bus</span>
        ${label}
      </div>
      <div style="
        width:12px; height:12px; background:${color}; border-radius:50%;
        border:2px solid white; margin-top:2px; position:relative;
        box-shadow:0 0 0 0 ${color}40;
        animation: busping 2s cubic-bezier(0,0,0.2,1) infinite;
      "></div>
    </div>
    <style>
      @keyframes busping {
        0% { box-shadow: 0 0 0 0 ${color}60; }
        70% { box-shadow: 0 0 0 10px ${color}00; }
        100% { box-shadow: 0 0 0 0 ${color}00; }
      }
    </style>
  `,
  iconSize: [80, 50],
  iconAnchor: [40, 50],
  popupAnchor: [0, -52],
});

const createStopIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#003fb1;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Fly-to helper component
const FlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 14, { duration: 1 }); }, [center]);
  return null;
};

const MapView = ({
  buses = [],           // [{ busId, busNumber, lat, lng, current, capacity, status }]
  stops = [],           // [{ name, lat, lng, order }]
  routePath = [],       // [[lat,lng], ...]
  center = [21.1458, 79.0882], // Default to Nagpur Sitabuldi
  zoom = 13,
  height = '500px',
  flyTo = null,
  onBusClick = null,
}) => {
  const getBusColor = (bus) => {
    const pct = bus.capacity > 0 ? (bus.current / bus.capacity) * 100 : 0;
    if (pct >= 90) return '#ba1a1a'; // red
    if (pct >= 60) return '#694100'; // amber
    return '#006c49'; // teal
  };

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {/* Route polyline */}
        {routePath.length > 1 && (
          <Polyline positions={routePath} color="#003fb1" weight={3} opacity={0.7} dashArray="8 4" />
        )}

        {/* Bus markers */}
        {buses.map((bus) => (
          <Marker
            key={bus.busId || bus._id}
            position={[bus.lat || 21.1458, bus.lng || 79.0882]}
            icon={createBusIcon(getBusColor(bus), bus.busNumber)}
            eventHandlers={{ click: () => onBusClick && onBusClick(bus) }}
          >
            <Popup>
              <div className="space-y-2 min-w-[180px]">
                <p className="font-bold text-sm text-primary">{bus.busNumber}</p>
                {bus.driver && <p className="text-xs text-on-surface-variant">Driver: {bus.driver}</p>}
                {bus.route && <p className="text-xs text-on-surface-variant">Route: {bus.route}</p>}
                <SeatOccupancyBar current={bus.current || 0} capacity={bus.capacity || 50} />
                {bus.eta && <p className="text-xs text-on-surface-variant mt-1">ETA: {bus.eta}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Stop markers */}
        {stops.map((stop, i) => (
          <Marker key={i} position={[stop.lat, stop.lng]} icon={createStopIcon()}>
            <Popup>
              <p className="text-xs font-semibold">{stop.name}</p>
              <p className="text-xs text-on-surface-variant">Stop {stop.order}</p>
            </Popup>
          </Marker>
        ))}

        {flyTo && <FlyTo center={flyTo} />}
      </MapContainer>
    </div>
  );
};

export default MapView;
