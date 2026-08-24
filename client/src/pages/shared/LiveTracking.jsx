import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MapView from '../../components/MapView';
import SeatOccupancyBar from '../../components/SeatOccupancyBar';
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
    // Subscribe to Supabase Realtime Broadcast for live GPS updates
    const channel = supabase.channel('bus_tracking')
      .on('broadcast', { event: 'bus_location_update' }, (payload) => {
        const { busId, lat, lng } = payload.payload;
        setBuses(prevBuses => prevBuses.map(b => {
          if (b.id === busId || b.bus_number === busId) {
            return { ...b, last_location: { lat, lng, updated_at: new Date() } };
          }
          return b;
        }));
      })
      .on('broadcast', { event: 'bus_occupancy_update' }, (payload) => {
        const { busId, current } = payload.payload;
        setBuses(prevBuses => prevBuses.map(b => {
          if (b.id === busId) {
            return { ...b, current_occupancy: current };
          }
          return b;
        }));
      })
      .subscribe();

    fetchInitialData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch from Supabase Postgres
      const [bRes, rRes] = await Promise.all([
        supabase.from('buses').select('*, route:routes(route_number, name), driver:profiles(name)'),
        supabase.from('routes').select('*')
      ]);

      let loadedBuses = bRes.data || [];
      if (loadedBuses.length === 0) {
        // Fallback mock if database is empty
        loadedBuses = [
          { id: 'b1', bus_number: 'MH-31-FC-4201', capacity: 50, current_occupancy: 32, status: 'active', last_location: { lat: 21.1370, lng: 79.0660 } },
          { id: 'b2', bus_number: 'MH-31-EV-1012', capacity: 60, current_occupancy: 18, status: 'active', last_location: { lat: 21.1458, lng: 79.0882 } }
        ];
      }
      setBuses(loadedBuses);
      setRoutes(rRes.data || []);
      if (loadedBuses.length > 0) setSelectedBus(loadedBuses[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBuses = selectedRouteId
    ? buses.filter(b => b.route_id === selectedRouteId || b.route?.id === selectedRouteId)
    : buses;

  const mapBuses = filteredBuses.map(b => ({
    busId: b.id,
    busNumber: b.bus_number,
    lat: b.last_location?.lat || 21.1458,
    lng: b.last_location?.lng || 79.0882,
    current: b.current_occupancy || 0,
    capacity: b.capacity || 50,
    driver: b.driver?.name || 'JD College Driver',
    route: b.route?.route_number || 'JD College Route'
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-surface shadow-sm h-16 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user ? `/${user.role}/dashboard` : '/')}
            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-primary">JD College Live Tracking Map</h1>
            <p className="text-[10px] text-on-surface-variant">Powered by Supabase Realtime</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/10 px-2.5 sm:px-3 py-1 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary status-pulse"></span>
            Supabase Telemetry Active
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
              const found = buses.find(b => b.id === bus.busId || b.bus_number === bus.busNumber);
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
              {routes.map(r => (
                <option key={r.id} value={r.id}>Route {r.route_number} — {r.name}</option>
              ))}
            </select>
          </div>

          {/* Selected Bus Detailed Card */}
          {selectedBus ? (
            <div className="card p-6 border-l-4 border-primary space-y-4 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-primary text-on-primary font-black rounded-lg text-sm">
                    Bus {selectedBus.bus_number}
                  </span>
                  <h3 className="font-bold text-base text-on-surface mt-2">{selectedBus.route?.name || 'JD College Express'}</h3>
                </div>
                <span className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full capitalize">
                  {selectedBus.status || 'Active'}
                </span>
              </div>

              <SeatOccupancyBar current={selectedBus.current_occupancy || 0} capacity={selectedBus.capacity || 50} />

              <div className="space-y-2 pt-2 border-t border-outline-variant/30 text-xs">
                <p className="flex justify-between">
                  <span className="text-on-surface-variant">Driver:</span>
                  <span className="font-bold">{selectedBus.driver?.name || 'JD College Driver'}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-on-surface-variant">Telemetry Protocol:</span>
                  <span className="font-bold text-primary">Supabase WebSockets</span>
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
              {filteredBuses.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBus(b)}
                  className={`card p-4 cursor-pointer border-2 transition-all space-y-2 ${
                    selectedBus?.id === b.id ? 'border-primary bg-primary/5' : 'hover:border-outline-variant'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-primary">{b.bus_number}</span>
                    <span className="text-on-surface-variant">Cap: {b.capacity}</span>
                  </div>
                  <SeatOccupancyBar current={b.current_occupancy || 0} capacity={b.capacity || 50} showText={false} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
