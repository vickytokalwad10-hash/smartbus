import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MapView from '../../components/MapView';
import SeatOccupancyBar from '../../components/SeatOccupancyBar';
import api from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const LiveTracking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedRouteParam = searchParams.get('route');

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(selectedRouteParam || '');
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Setup Supabase Realtime channel if available
    let channel = null;
    try {
      channel = supabase.channel('bus_tracking')
        .on('broadcast', { event: 'bus_location_update' }, (payload) => {
          const { busId, lat, lng } = payload.payload;
          setBuses(prevBuses => prevBuses.map(b => {
            const rawId = b._id || b.id;
            const bNum = b.busNumber || b.bus_number;
            if (rawId === busId || bNum === busId) {
              return { 
                ...b, 
                lastLocation: { lat, lng, updatedAt: new Date() },
                last_location: { lat, lng, updated_at: new Date() }
              };
            }
            return b;
          }));
        })
        .on('broadcast', { event: 'bus_occupancy_update' }, (payload) => {
          const { busId, current } = payload.payload;
          setBuses(prevBuses => prevBuses.map(b => {
            const rawId = b._id || b.id;
            if (rawId === busId) {
              return { ...b, currentOccupancy: current, current_occupancy: current };
            }
            return b;
          }));
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription skipped:', e.message);
    }

    fetchInitialData();

    // Periodic telemetry polling fallback every 15s to keep live positions refreshed
    const interval = setInterval(() => {
      fetchBusesOnly();
    }, 15000);

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
      clearInterval(interval);
    };
  }, []);

  const fetchBusesOnly = async () => {
    try {
      const res = await api.get('/buses');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setBuses(res.data);
      }
    } catch (e) {
      // ignore periodic poll errors
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    let loadedBuses = [];
    let loadedRoutes = [];

    // 1. Try Express + MongoDB API first
    try {
      const [bRes, rRes] = await Promise.allSettled([
        api.get('/buses'),
        api.get('/routes')
      ]);

      if (bRes.status === 'fulfilled' && Array.isArray(bRes.value.data) && bRes.value.data.length > 0) {
        loadedBuses = bRes.value.data;
      }
      if (rRes.status === 'fulfilled' && Array.isArray(rRes.value.data) && rRes.value.data.length > 0) {
        loadedRoutes = rRes.value.data;
      }
    } catch (apiErr) {
      console.warn('API error in LiveTracking, trying Supabase fallback:', apiErr.message);
    }

    // 2. Try Supabase fallback if empty
    if (loadedBuses.length === 0 || loadedRoutes.length === 0) {
      try {
        const [bRes, rRes] = await Promise.all([
          supabase.from('buses').select('*, route:routes(route_number, name), driver:profiles(name)'),
          supabase.from('routes').select('*')
        ]);
        if (loadedBuses.length === 0 && bRes.data?.length > 0) loadedBuses = bRes.data;
        if (loadedRoutes.length === 0 && rRes.data?.length > 0) loadedRoutes = rRes.data;
      } catch (err) {
        console.warn('Supabase fallback also unavailable:', err.message);
      }
    }

    // 3. Sensible fallback if no fleet exists yet
    if (loadedBuses.length === 0) {
      loadedBuses = [
        { _id: 'b1', id: 'b1', busNumber: 'MH-31-FC-4201', bus_number: 'MH-31-FC-4201', capacity: 50, currentOccupancy: 32, current_occupancy: 32, status: 'active', lastLocation: { lat: 21.1370, lng: 79.0660 } },
        { _id: 'b2', id: 'b2', busNumber: 'MH-31-EV-1012', bus_number: 'MH-31-EV-1012', capacity: 60, currentOccupancy: 18, current_occupancy: 18, status: 'active', lastLocation: { lat: 21.1458, lng: 79.0882 } }
      ];
    }

    setBuses(loadedBuses);
    setRoutes(loadedRoutes);
    if (loadedBuses.length > 0) setSelectedBus(loadedBuses[0]);
    setLoading(false);
  };

  const filteredBuses = selectedRouteId
    ? buses.filter(b => {
        const rId = b.routeId || b.route_id || (typeof b.route === 'object' ? (b.route?._id || b.route?.id) : b.route);
        return rId === selectedRouteId;
      })
    : buses;

  const mapBuses = filteredBuses.map(b => {
    const rawId = b._id || b.id;
    const bNumber = b.busNumber || b.bus_number || 'JD Bus';
    const loc = b.lastLocation || b.last_location || {};
    const lat = loc.lat || 21.1458;
    const lng = loc.lng || 79.0882;
    const curr = b.currentOccupancy ?? b.current_occupancy ?? 0;
    const cap = b.capacity || 50;
    const driverName = b.driver?.name || (typeof b.driver === 'string' ? b.driver : 'JD College Driver');
    const routeName = b.route?.routeNumber || b.route?.route_number ? `Route ${b.route?.routeNumber || b.route?.route_number}` : (b.route?.name || 'Nagpur Transit');

    return {
      busId: rawId,
      busNumber: bNumber,
      lat,
      lng,
      current: curr,
      capacity: cap,
      driver: driverName,
      route: routeName
    };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-surface shadow-sm h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(user ? `/${user.role}/dashboard` : '/')}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-sm sm:text-lg font-black text-primary">JD College Live GPS Fleet</h1>
            <p className="text-[10px] text-on-surface-variant">Live telemetry & active bus tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={fetchInitialData}
            className="text-xs px-2.5 py-1 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-all font-semibold flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">refresh</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <span className="flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/10 px-2.5 sm:px-3 py-1 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary status-pulse"></span>
            <span className="hidden sm:inline">Telemetry</span> Active
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3">
        {/* Left Map Area */}
        <div className="lg:col-span-2 relative h-[45vh] sm:h-[55vh] lg:h-[calc(100vh-64px)]">
          <MapView
            center={[21.1458, 79.0882]}
            buses={mapBuses}
            height="100%"
            onBusClick={(bus) => {
              const found = buses.find(b => (b._id || b.id) === bus.busId || (b.busNumber || b.bus_number) === bus.busNumber);
              if (found) setSelectedBus(found);
            }}
          />
        </div>

        {/* Right Info Sidebar */}
        <div className="lg:col-span-1 bg-surface-container-lowest border-t lg:border-t-0 lg:border-l border-outline-variant/30 p-4 sm:p-6 overflow-y-auto min-h-[50vh] lg:h-[calc(100vh-64px)] space-y-6">
          {/* Route Filter Dropdown */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1">Filter by Route</label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="input-field"
            >
              <option value="">All Nagpur Routes</option>
              {routes.map(r => {
                const rId = r._id || r.id;
                const rNum = r.routeNumber || r.route_number || '';
                return (
                  <option key={rId} value={rId}>
                    {rNum ? `Route ${rNum} — ` : ''}{r.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selected Bus Detailed Card */}
          {selectedBus ? (
            <div className="card p-6 border-l-4 border-primary space-y-4 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-primary text-on-primary font-black rounded-lg text-sm">
                    Bus {selectedBus.busNumber || selectedBus.bus_number}
                  </span>
                  <h3 className="font-bold text-base text-on-surface mt-2">
                    {selectedBus.route?.name || 'JD College Transit Express'}
                  </h3>
                </div>
                <span className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full capitalize">
                  {selectedBus.status || 'Active'}
                </span>
              </div>

              <SeatOccupancyBar
                current={selectedBus.currentOccupancy ?? selectedBus.current_occupancy ?? 0}
                capacity={selectedBus.capacity || 50}
              />

              <div className="space-y-2 pt-2 border-t border-outline-variant/30 text-xs">
                <p className="flex justify-between">
                  <span className="text-on-surface-variant">Driver:</span>
                  <span className="font-bold">
                    {selectedBus.driver?.name || (typeof selectedBus.driver === 'string' ? selectedBus.driver : 'JD College Driver')}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-on-surface-variant">Telemetry Status:</span>
                  <span className="font-bold text-primary">Live GPS Sync</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center text-xs text-on-surface-variant">
              Click any bus marker on the map to inspect live ETA and occupancy details.
            </div>
          )}

          {/* All Buses in Filter */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Active Nagpur Fleet ({filteredBuses.length})
            </h3>

            <div className="space-y-3">
              {filteredBuses.map(b => {
                const bId = b._id || b.id;
                const bNum = b.busNumber || b.bus_number;
                const occ = b.currentOccupancy ?? b.current_occupancy ?? 0;
                const isSelected = (selectedBus?._id || selectedBus?.id) === bId;

                return (
                  <div
                    key={bId}
                    onClick={() => setSelectedBus(b)}
                    className={`card p-4 cursor-pointer border-2 transition-all space-y-2 ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:border-outline-variant'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-primary">{bNum}</span>
                      <span className="text-on-surface-variant">Cap: {b.capacity || 50}</span>
                    </div>
                    <SeatOccupancyBar current={occ} capacity={b.capacity || 50} showText={false} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
