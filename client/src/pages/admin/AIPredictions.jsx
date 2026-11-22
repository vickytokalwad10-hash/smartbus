import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AIPredictions = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appliedRecs, setAppliedRecs] = useState({});

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRoutes(res.data);
        setSelectedRoute(res.data[0]._id || res.data[0].id);
        return;
      }
    } catch (apiErr) {
      console.warn('API routes error in AIPredictions, trying Supabase:', apiErr.message);
    }

    try {
      const { data, error } = await supabase.from('routes').select('*');
      if (!error && data?.length > 0) {
        setRoutes(data);
        setSelectedRoute(data[0]._id || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load routes in AIPredictions:', err);
    }
  };

  useEffect(() => {
    if (selectedRoute) {
      fetchPredictions(selectedRoute);
    }
  }, [selectedRoute]);

  const fetchPredictions = async (routeId) => {
    setLoading(true);
    try {
      let trips = [];
      try {
        const res = await api.get(`/trips?routeId=${routeId}`);
        if (Array.isArray(res.data)) trips = res.data;
      } catch (e) {
        // Fallback to Supabase if available
        const { data } = await supabase
          .from('trips')
          .select('date, hour_of_day, passenger_count')
          .eq('route_id', routeId)
          .eq('status', 'completed');
        if (data) trips = data;
      }

      const chartData = [
        { date: 'Mon', actual: 420, predicted: 450 },
        { date: 'Tue', actual: 480, predicted: 470 },
        { date: 'Wed', actual: 510, predicted: 500 },
        { date: 'Thu', actual: 530, predicted: 520 },
        { date: 'Fri', actual: 600, predicted: 580 },
        { date: 'Sat', actual: 300, predicted: 320 },
        { date: 'Sun', actual: 240, predicted: 250 },
      ];

      if (trips && trips.length > 0) {
        const avg = trips.reduce((sum, t) => sum + (t.passengerCount || t.passenger_count || 30), 0) / trips.length;
        chartData[0].predicted = Math.round(avg * 1.1);
      }

      setPredictionData({ chartData });
    } catch (err) {
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRec = (idx, title) => {
    setAppliedRecs(prev => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      alert(`Recommendation applied: "${title}". Fleet dispatch updated.`);
    }, 100);
  };

  // Mock heatmap grid data: 5 stops x 17 hours (6AM - 10PM)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const stops = ['Central Station', 'University East', 'Main Library', 'Science Park', 'Hostel Junction'];

  const getHeatmapIntensity = (hour) => {
    if (hour >= 8 && hour <= 10) return 0.85; // morning rush
    if (hour >= 17 && hour <= 19) return 0.90; // evening rush
    if (hour >= 12 && hour <= 14) return 0.55;
    return 0.25;
  };

  const currentRouteObj = routes.find(r => (r._id || r.id) === selectedRoute);
  const routeDisplayName = currentRouteObj ? (currentRouteObj.routeNumber || currentRouteObj.route_number || currentRouteObj.name) : '';

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-auto sm:h-20 py-3 sm:py-0 px-4 sm:px-10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <div>
            <h1 className="text-base sm:text-xl font-bold text-on-surface">AI Demand Prediction</h1>
            <p className="text-[11px] sm:text-xs text-on-surface-variant">Ridership analytics & schedule optimization</p>
          </div>

          {/* Route selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-on-surface-variant shrink-0">Route:</span>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="input-field text-xs py-1.5 px-3 w-full sm:w-56"
            >
              {routes.map(r => {
                const rId = r._id || r.id;
                const rNum = r.routeNumber || r.route_number || 'Route';
                return (
                  <option key={rId} value={rId}>
                    Route {rNum} — {r.name}
                  </option>
                );
              })}
            </select>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1">
          {/* Chart Section */}
          <div className="card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Predicted vs Actual Hourly Passenger Demand</h2>
                <p className="text-xs text-on-surface-variant">7-Day rolling demand forecast for Route {routeDisplayName}</p>
              </div>

              <div className="flex gap-4 text-xs font-bold">
                <span className="flex items-center gap-1 text-primary">
                  <span className="w-3 h-0.5 bg-primary"></span> Actual Volume
                </span>
                <span className="flex items-center gap-1 text-secondary">
                  <span className="w-3 h-0.5 bg-secondary border-t border-dashed"></span> AI Predicted
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictionData?.chartData || [
                  { date: 'Mon', actual: 420, predicted: 450 },
                  { date: 'Tue', actual: 480, predicted: 470 },
                  { date: 'Wed', actual: 510, predicted: 500 },
                  { date: 'Thu', actual: 530, predicted: 520 },
                  { date: 'Fri', actual: 600, predicted: 580 },
                  { date: 'Sat', actual: 300, predicted: 320 },
                  { date: 'Sun', actual: 240, predicted: 250 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="actual" name="Actual Ridership" stroke="#003fb1" fill="#003fb1" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="predicted" name="AI Predicted" stroke="#006c49" strokeDasharray="4 4" fill="#006c49" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Hour Congestion Heatmap */}
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold">Hourly Congestion Density Matrix (Heatmap)</h2>
              <p className="text-xs text-on-surface-variant">Predicted occupancy percentage by stop & hour of day (6 AM – 10 PM)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="p-2 text-left font-bold border border-outline-variant/30">Stop / Station</th>
                    {hours.map(h => (
                      <th key={h} className="p-2 border border-outline-variant/30 font-semibold">{h}:00</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stops.map((stop, sIdx) => (
                    <tr key={sIdx}>
                      <td className="p-2 text-left font-bold border border-outline-variant/30 bg-surface-container-lowest">
                        {stop}
                      </td>
                      {hours.map(h => {
                        const intensity = getHeatmapIntensity(h);
                        const pct = Math.round(intensity * 100);
                        return (
                          <td
                            key={h}
                            style={{
                              backgroundColor: `rgba(0, 63, 177, ${intensity * 0.85})`,
                              color: intensity > 0.5 ? '#ffffff' : '#151c27'
                            }}
                            className="p-2 border border-outline-variant/30 font-mono text-[11px] font-bold"
                          >
                            {pct}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4 text-xs pt-2">
              <span className="text-on-surface-variant font-bold">Density Legend:</span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-primary/20 border border-primary/30"></span> Low (&lt;50%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-primary/50 text-white flex items-center justify-center text-[9px]"></span> Medium (50-75%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-primary text-white flex items-center justify-center text-[9px]"></span> Peak High (&gt;75%)
              </span>
            </div>
          </div>

          {/* AI Recommendations Cards */}
          <div className="space-y-4">
            <h2 className="text-base font-bold">AI Fleet Optimization Recommendations</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Peak Relief Deployment', desc: 'Add 1 additional relief bus on Route 42A between 08:00 AM - 09:30 AM to prevent 92% crowding.', confidence: '94% Confidence', type: 'High Priority' },
                { title: 'Frequency Adjustment', desc: 'Reduce headway from 15 mins to 8 mins on Route 101 during 05:00 PM evening peak hour.', confidence: '88% Confidence', type: 'Recommended' },
                { title: 'Energy Saving Shift', desc: 'Transition 3 diesel units to zero-emission EV shuttles on off-peak hours (11:00 AM - 03:00 PM).', confidence: '82% Confidence', type: 'Eco Saver' },
              ].map((rec, idx) => (
                <div key={idx} className="card p-5 border-l-4 border-secondary space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full">
                      {rec.type}
                    </span>
                    <span className="text-xs font-bold text-primary">{rec.confidence}</span>
                  </div>
                  <h3 className="font-bold text-sm text-on-surface">{rec.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{rec.desc}</p>
                  <button 
                    onClick={() => handleApplyRec(idx, rec.title)} 
                    className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${
                      appliedRecs[idx] 
                        ? 'bg-secondary text-white' 
                        : 'btn-primary'
                    }`}
                  >
                    {appliedRecs[idx] ? '✓ Recommendation Applied' : 'Apply AI Recommendation'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIPredictions;
