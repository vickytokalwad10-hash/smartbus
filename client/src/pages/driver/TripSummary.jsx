import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DriverNavbar from '../../components/DriverNavbar';
import api from '../../utils/api';

const TripSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tripId = location.state?.tripId;
  const initialPassengerCount = location.state?.passengerCount || 38;

  const [trip, setTrip] = useState(null);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tripId) {
      api.get(`/trips/${tripId}`).then(res => setTrip(res.data)).catch(console.error);
    }
  }, [tripId]);

  const handleEndTrip = async () => {
    setLoading(true);
    try {
      if (tripId) {
        await api.post(`/trips/${tripId}/end`, {
          passengerCount: initialPassengerCount,
          distanceCovered: 14.2
        });
      }
      setEnded(true);
    } catch (err) {
      console.error('Error ending trip:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DriverNavbar />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10 space-y-6 sm:space-y-8">
        {ended ? (
          <div className="card p-10 text-center space-y-6 bg-surface-container-lowest">
            <div className="w-20 h-20 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mx-auto text-4xl font-bold">
              ✓
            </div>
            <div>
              <h1 className="text-3xl font-black text-on-surface">Shift Completed Successfully!</h1>
              <p className="text-sm text-on-surface-variant mt-1">Trip record finalized & logged into SmartBus AI system.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-surface-container-low p-6 rounded-2xl max-w-md mx-auto text-center">
              <div>
                <p className="text-2xl font-black text-primary">{initialPassengerCount}</p>
                <p className="text-xs text-on-surface-variant">Passengers</p>
              </div>
              <div>
                <p className="text-2xl font-black text-secondary">14.2 km</p>
                <p className="text-xs text-on-surface-variant">Distance</p>
              </div>
              <div>
                <p className="text-2xl font-black text-tertiary">45 min</p>
                <p className="text-xs text-on-surface-variant">Duration</p>
              </div>
            </div>

            <button onClick={() => navigate('/driver/dashboard')} className="btn-primary py-3 px-8">
              Return to Driver Dashboard
            </button>
          </div>
        ) : (
          <div className="card p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-black text-on-surface">End Shift / Trip Summary</h1>
              <p className="text-xs text-on-surface-variant">Review trip metrics before submitting final log</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-on-surface-variant">Assigned Route</p>
                  <p className="text-lg font-black">{trip?.route?.name || 'Route 42A — University Express'}</p>
                </div>
                <span className="px-3 py-1 bg-primary text-on-primary font-black rounded-lg text-sm">
                  Bus {trip?.bus?.busNumber || 'MH-01-AB-4201'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-surface-container rounded-xl text-center">
                  <p className="text-xs text-on-surface-variant">Total Riders</p>
                  <p className="text-2xl font-black text-primary">{initialPassengerCount}</p>
                </div>
                <div className="p-4 bg-surface-container rounded-xl text-center">
                  <p className="text-xs text-on-surface-variant">Passes Scanned</p>
                  <p className="text-2xl font-black text-secondary">{trip?.scannedPasses?.length || 12}</p>
                </div>
                <div className="p-4 bg-surface-container rounded-xl text-center">
                  <p className="text-xs text-on-surface-variant">Est. Distance</p>
                  <p className="text-2xl font-black text-tertiary">14.2 km</p>
                </div>
                <div className="p-4 bg-surface-container rounded-xl text-center">
                  <p className="text-xs text-on-surface-variant">Stops Served</p>
                  <p className="text-2xl font-black text-on-surface">5 / 5</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
              <button onClick={() => navigate('/driver/trip')} className="btn-secondary">
                Back to Live Trip
              </button>

              <button onClick={handleEndTrip} disabled={loading} className="btn-primary py-3 px-8 bg-error hover:bg-error-container">
                {loading ? 'Finalizing...' : 'Confirm & End Trip'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TripSummary;
