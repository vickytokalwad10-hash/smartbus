import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import SeatOccupancyBar from '../../components/SeatOccupancyBar';
import { supabase } from '../../utils/supabaseClient';

const TripInProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripId = location.state?.tripId;

  const [trip, setTrip] = useState(null);
  const [occupancy, setOccupancy] = useState(0);
  const [capacity, setCapacity] = useState(50);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayReason, setDelayReason] = useState('traffic');
  const [delayNotes, setDelayNotes] = useState('');

  const channelRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    // Supabase Channel setup
    channelRef.current = supabase.channel('bus_tracking', {
      config: { broadcast: { self: true } }
    });
    channelRef.current.subscribe();

    fetchTripDetails();

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const fetchTripDetails = async () => {
    try {
      let data = null;
      if (tripId) {
        const res = await supabase.from('trips').select('*, bus:buses(*), route:routes(*)').eq('id', tripId).single();
        data = res.data;
      } else {
        const res = await supabase.from('trips').select('*, bus:buses(*), route:routes(*)').eq('status', 'in-progress').limit(1).single();
        data = res.data;
      }

      if (data) {
        setTrip(data);
        setOccupancy(data.bus?.current_occupancy || 15);
        setCapacity(data.bus?.capacity || 50);
        setCurrentStopIndex(data.current_stop || 0);

        if (data.bus?.id) {
          startGpsTracking(data.bus.id, data.route?.id, data.id);
        }
      }
    } catch (err) {
      console.error('Error loading trip:', err);
    }
  };

  const startGpsTracking = (busId, routeId, tripIdVal) => {
    if ('geolocation' in navigator) {
      setIsBroadcasting(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          
          // Broadcast to Supabase Realtime
          if (channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'bus_location_update',
              payload: { busId, lat, lng, routeId, tripId: tripIdVal }
            });
          }

          // Optionally update DB
          supabase.from('buses').update({ last_location: { lat, lng, updated_at: new Date() } }).eq('id', busId).then();
        },
        (err) => console.warn('GPS watch error:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
  };

  const handleOccupancyChange = (delta) => {
    const newCount = Math.max(0, Math.min(capacity, occupancy + delta));
    setOccupancy(newCount);
    if (trip?.bus?.id && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'bus_occupancy_update',
        payload: { busId: trip.bus.id, current: newCount, capacity, routeId: trip.route?.id }
      });
      // Update DB
      supabase.from('buses').update({ current_occupancy: newCount }).eq('id', trip.bus.id).then();
    }
  };

  const handleAdvanceStop = async () => {
    if (!trip) return;
    try {
      const nextIndex = currentStopIndex + 1;
      await supabase.from('trips').update({ current_stop: nextIndex }).eq('id', trip.id);
      setCurrentStopIndex(nextIndex);
    } catch (err) {
      console.error('Error advancing stop:', err);
    }
  };

  const handleReportDelay = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('complaints').insert([{
        type: 'delay',
        reason: delayReason,
        description: `Driver Report: Delay due to ${delayReason}. ${delayNotes}`,
        bus_id: trip?.bus?.id,
        route_id: trip?.route?.id,
        user_id: trip?.driver_id
      }]);
      setShowDelayModal(false);
      setDelayNotes('');
      alert('Delay report submitted to control central.');
    } catch (err) {
      console.error('Error submitting delay report:', err);
    }
  };

  const stops = trip?.route?.stops || [
    { name: 'Central Terminal', order: 1 },
    { name: 'University East Gate', order: 2 },
    { name: 'Science Park', order: 3 },
    { name: 'Hostel Junction', order: 4 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DriverNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10 space-y-6">
        {/* Top Live Status Bar */}
        <div className="card p-4 bg-surface-container-lowest flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-l-4 border-secondary">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-secondary status-pulse"></span>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-wider">
                {isBroadcasting ? 'GPS Telemetry Active' : 'Trip In Progress'}
              </p>
              <p className="text-sm font-black text-on-surface">
                Bus {trip?.bus?.bus_number || 'MH-01-AB-4201'} · Route {trip?.route?.route_number || '42A'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => navigate('/driver/scanner')} className="btn-secondary flex-1 sm:flex-none text-xs py-2 px-3 sm:px-4 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span> Scan
            </button>
            <button onClick={() => navigate('/driver/summary', { state: { tripId: trip?.id, passengerCount: occupancy } })} className="btn-primary flex-1 sm:flex-none text-xs py-2 px-3 sm:px-4">
              End Trip
            </button>
          </div>
        </div>

        {/* Main 2-Column Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seat Occupancy Controls */}
          <div className="card p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-on-surface">Seat Occupancy Counter</h2>
              <p className="text-xs text-on-surface-variant">Update live passenger count for passengers & admin</p>
            </div>

            <SeatOccupancyBar current={occupancy} capacity={capacity} />

            <div className="flex items-center justify-center gap-6 py-4">
              <button
                onClick={() => handleOccupancyChange(-1)}
                className="w-16 h-16 rounded-2xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-black text-3xl shadow-sm flex items-center justify-center active:scale-95 transition-transform"
              >
                -
              </button>

              <div className="text-center min-w-[100px]">
                <span className="text-4xl font-black text-primary">{occupancy}</span>
                <span className="text-xs text-on-surface-variant block mt-1">/ {capacity} Seats</span>
              </div>

              <button
                onClick={() => handleOccupancyChange(1)}
                className="w-16 h-16 rounded-2xl bg-primary text-on-primary font-black text-3xl shadow-md flex items-center justify-center active:scale-95 transition-transform"
              >
                +
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[+5, +10, -5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleOccupancyChange(val)}
                  className="py-2 bg-surface-container-low text-on-surface-variant font-bold text-xs rounded-lg hover:bg-surface-container"
                >
                  {val > 0 ? `+${val}` : val} Passengers
                </button>
              ))}
            </div>
          </div>

          {/* Stop Progress */}
          <div className="card p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-black text-on-surface">Route Stop Sequence</h2>
              <p className="text-xs text-on-surface-variant">Mark arrival at stops to notify waiting passengers</p>
            </div>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/50">
              {stops.map((stop, idx) => {
                const isPassed = idx < currentStopIndex;
                const isCurrent = idx === currentStopIndex;
                return (
                  <div key={idx} className="flex items-center gap-4 relative z-10 pl-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      isPassed ? 'bg-secondary border-secondary text-white' :
                      isCurrent ? 'bg-primary border-primary text-white status-pulse' :
                      'bg-surface-container-lowest border-outline text-outline'
                    }`}>
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isCurrent ? 'text-primary' : isPassed ? 'text-on-surface-variant line-through opacity-70' : 'text-on-surface'}`}>
                        {stop.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAdvanceStop}
              disabled={currentStopIndex >= stops.length - 1}
              className="btn-primary w-full py-4 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">location_on</span>
              {currentStopIndex >= stops.length - 1 ? 'Terminal Stop Reached' : `Arrived at Stop ${currentStopIndex + 1}`}
            </button>
          </div>
        </div>

        {/* Bottom Quick Incident Bar */}
        <div className="flex justify-between items-center bg-error/5 p-4 rounded-xl border border-error/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error">warning</span>
            <span className="text-xs font-bold text-error">Traffic breakdown or delay?</span>
          </div>
          <button onClick={() => setShowDelayModal(true)} className="px-4 py-2 bg-error text-on-error text-xs font-bold rounded-lg hover:bg-error-container">
            Report Incident / Delay
          </button>
        </div>
      </main>

      {/* Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">Report Route Delay</h3>
            <form onSubmit={handleReportDelay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Reason for Delay</label>
                <select value={delayReason} onChange={(e) => setDelayReason(e.target.value)} className="input-field">
                  <option value="traffic">Heavy Traffic Congestion</option>
                  <option value="breakdown">Vehicle Mechanical Issue</option>
                  <option value="accident">Road Obstruction / Accident</option>
                  <option value="weather">Severe Weather</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Additional Notes</label>
                <textarea
                  rows="3"
                  value={delayNotes}
                  onChange={(e) => setDelayNotes(e.target.value)}
                  placeholder="Estimated delay time and notes..."
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowDelayModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs bg-error hover:bg-error-container">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripInProgress;
