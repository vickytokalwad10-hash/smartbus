import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import { supabase } from '../../utils/supabaseClient';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const DriverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignedTrip, setAssignedTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedTrip();
  }, [user]);

  const fetchAssignedTrip = async () => {
    setLoading(true);
    try {
      // 1. Try local MongoDB Express API
      try {
        const res = await api.get('/trips/assigned');
        if (res.data && (res.data._id || res.data.id)) {
          setAssignedTrip(res.data);
          setLoading(false);
          return;
        }
      } catch (apiErr) {
        console.warn('MongoDB API /trips/assigned error:', apiErr.message);
      }

      // 2. Try Supabase
      try {
        if (user?.id) {
          const { data, error } = await supabase
            .from('trips')
            .select('*, bus:buses(*), route:routes(*)')
            .eq('driver_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (!error && data) {
            setAssignedTrip(data);
            setLoading(false);
            return;
          }
        }
      } catch (sbErr) {
        console.warn('Supabase trips error:', sbErr.message);
      }

      // 3. Guaranteed Mock / Fallback Trip for Driver Demo
      setAssignedTrip({
        _id: 'demo-trip-42a',
        id: 'demo-trip-42a',
        status: 'scheduled',
        route: {
          route_number: '42A',
          routeNumber: '42A',
          name: 'JD College Campus Express',
          stops: [
            { name: 'Sitabuldi Interchange' },
            { name: 'Jhansi Rani Square' },
            { name: 'Dharampeth Market' },
            { name: 'JD College Main Gate' },
            { name: 'Hostel Block' }
          ]
        },
        bus: {
          bus_number: 'MH-31-FC-4201',
          busNumber: 'MH-31-FC-4201',
          type: 'Diesel',
          capacity: 50,
          current_occupancy: 32,
          currentOccupancy: 32
        }
      });
    } catch (err) {
      console.error('Error fetching assigned trip:', err);
    } finally {
      setLoading(false);
    }
  };

  const tripId = assignedTrip?._id || assignedTrip?.id;
  const routeNumber = assignedTrip?.route?.route_number || assignedTrip?.route?.routeNumber || '42A';
  const routeName = assignedTrip?.route?.name || 'JD College Campus Express';
  const busNumber = assignedTrip?.bus?.bus_number || assignedTrip?.bus?.busNumber || 'MH-31-FC-4201';
  const busType = assignedTrip?.bus?.type || 'Diesel';
  const stops = assignedTrip?.route?.stops || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DriverNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-on-surface">Driver Duty Dashboard</h1>
            <p className="text-xs text-on-surface-variant">Manage today's shift and live bus telemetry</p>
          </div>
          <span className="px-3 py-1 bg-secondary/10 text-secondary font-bold text-xs rounded-full">
            On Duty · Shift Active
          </span>
        </div>

        {/* Main Assigned Trip Card */}
        {loading ? (
          <div className="card p-12 text-center text-xs text-on-surface-variant">
            Loading assigned trip schedule...
          </div>
        ) : assignedTrip ? (
          <div className="card p-8 border-l-8 border-primary space-y-6 bg-surface-container-lowest shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <span className="px-4 py-1.5 bg-primary text-on-primary font-black rounded-xl text-lg inline-block">
                  Route {routeNumber}
                </span>
                <h2 className="text-xl font-bold text-on-surface mt-2">{routeName}</h2>
                <p className="text-xs text-on-surface-variant">
                  Bus Vehicle: <strong className="text-on-surface">{busNumber}</strong> ({busType})
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-xs font-bold text-on-surface-variant block">Shift Schedule</span>
                <p className="text-sm font-black text-primary">08:00 AM - 04:00 PM</p>
                <span className="text-xs font-semibold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                  {assignedTrip.status}
                </span>
              </div>
            </div>

            {/* Key Stops List */}
            <div className="p-4 bg-surface-container-low rounded-xl space-y-2 text-xs">
              <p className="font-bold text-on-surface">Scheduled Stop Sequence:</p>
              <div className="flex flex-wrap gap-2 text-on-surface-variant">
                {stops.length > 0 ? (
                  stops.map((s, idx) => (
                    <span key={idx} className="bg-surface-container px-3 py-1 rounded-full font-semibold">
                      {idx + 1}. {s?.name || s}
                    </span>
                  ))
                ) : (
                  <span>1. Sitabuldi → 2. Dharampeth → 3. JD College Main Gate</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/driver/trip', { state: { tripId } })}
                className="btn-primary flex-1 py-4 text-base font-black flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                {assignedTrip.status === 'in-progress' ? 'Resume Live Trip' : "Start Today's Trip"}
              </button>

              <button
                onClick={() => navigate('/driver/scanner')}
                className="btn-secondary flex-1 py-4 text-base font-black flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">qr_code_scanner</span>
                Open Pass Scanner
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-outline">event_busy</span>
            <h2 className="text-lg font-bold text-on-surface">No Assigned Trips Today</h2>
            <p className="text-xs text-on-surface-variant">You have no active shifts assigned for today. Contact dispatch central for assignment.</p>
            <button onClick={fetchAssignedTrip} className="btn-secondary text-xs">Refresh Schedule</button>
          </div>
        )}

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div onClick={() => navigate('/driver/scanner')} className="card p-6 cursor-pointer hover:shadow-overlay transition-all border-l-4 border-secondary flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-bold text-base">Pass Scanner</h3>
              <p className="text-xs text-on-surface-variant">Validate passenger QR tickets</p>
            </div>
          </div>

          <div onClick={() => navigate('/driver/trip', { state: { tripId } })} className="card p-6 cursor-pointer hover:shadow-overlay transition-all border-l-4 border-tertiary flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">sensors</span>
            </div>
            <div>
              <h3 className="font-bold text-base">Live Telemetry</h3>
              <p className="text-xs text-on-surface-variant">Broadcast GPS & Seat occupancy</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
