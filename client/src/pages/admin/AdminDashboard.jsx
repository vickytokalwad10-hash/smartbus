import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import MapView from '../../components/MapView';
import SeatOccupancyBar from '../../components/SeatOccupancyBar';
import { supabase } from '../../utils/supabaseClient';
import api from '../../utils/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ activePasses: 12450, busesInService: 84, todayRidership: 45200, avgOccupancy: 68 });
  const [buses, setBuses] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const mockChartData = [
    { day: 'Mon', actual: 38000, predicted: 40000 },
    { day: 'Tue', actual: 42000, predicted: 41000 },
    { day: 'Wed', actual: 45000, predicted: 44000 },
    { day: 'Thu', actual: 48000, predicted: 46000 },
    { day: 'Fri', actual: 52000, predicted: 50000 },
    { day: 'Sat', actual: 28000, predicted: 30000 },
    { day: 'Sun', actual: 22000, predicted: 24000 },
  ];

  useEffect(() => {
    fetchDashboardData();

    try {
      const channel = supabase.channel('admin_dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, fetchDashboardData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel).catch(() => {});
      };
    } catch (e) {}
  }, []);

  const fetchDashboardData = async () => {
    try {
      let bData = [], cData = [], activePassCount = null;

      // 1. Try local MongoDB API
      try {
        const [bRes, cRes, pRes] = await Promise.all([
          api.get('/buses'),
          api.get('/complaints'),
          api.get('/passes?status=active')
        ]);
        if (bRes.data) bData = bRes.data;
        if (cRes.data) cData = cRes.data;
        if (pRes.data) activePassCount = pRes.data.length;
      } catch (apiErr) {
        console.warn('API admin dashboard fallback:', apiErr.message);
      }

      // 2. Try Supabase fallback
      if (bData.length === 0 || cData.length === 0) {
        try {
          const [bRes, cRes, pRes] = await Promise.all([
            supabase.from('buses').select('*, route:routes(route_number), driver:profiles(name)'),
            supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(20),
            supabase.from('passes').select('id', { count: 'exact' }).eq('status', 'active')
          ]);
          if (bData.length === 0 && bRes.data) bData = bRes.data;
          if (cData.length === 0 && cRes.data) cData = cRes.data;
          if (activePassCount === null && pRes.count !== null) activePassCount = pRes.count;
        } catch (sbErr) {}
      }

      setBuses(bData);
      setComplaints(cData);
      if (activePassCount !== null) {
        setStats(prev => ({ ...prev, activePasses: activePassCount, busesInService: bData.length }));
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      // 1. Try local MongoDB API
      try {
        await api.patch(`/complaints/${id}`, { status: 'resolved' });
        fetchDashboardData();
        return;
      } catch (apiErr) {
        console.warn('API resolve alert fallback:', apiErr.message);
      }

      await supabase.from('complaints').update({ status: 'resolved', resolved_at: new Date() }).eq('id', id);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const mapBuses = buses.map(b => ({
    busId: b._id || b.id,
    busNumber: b.busNumber || b.bus_number,
    lat: b.lastLocation?.lat || b.last_location?.lat || (21.1458 + (Math.random() - 0.5) * 0.04), // Nagpur center
    lng: b.lastLocation?.lng || b.last_location?.lng || (79.0882 + (Math.random() - 0.5) * 0.04),
    current: b.currentOccupancy || b.current_occupancy || 25,
    capacity: b.capacity || 50,
    driver: b.driver?.name,
    route: b.route?.routeNumber || b.route?.route_number
  }));

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Top App Bar (desktop) */}
        <header className="hidden md:flex sticky top-0 z-30 h-20 px-6 md:px-10 items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <h1 className="text-xl font-bold text-on-surface">Overall Administrative Monitoring</h1>

          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search buses, drivers, routes..."
                className="w-full bg-surface-container-low border-none rounded-full px-4 py-2 pl-10 text-sm focus:ring-2 focus:ring-primary"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center">
                A
              </div>
              <span className="text-xs font-bold">Transit Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-primary space-y-1">
              <p className="text-xs font-bold text-on-surface-variant">Active Bus Passes</p>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-black text-primary">{stats.activePasses?.toLocaleString() || '12,450'}</p>
                <span className="text-xs font-bold text-secondary">Live</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-secondary space-y-1">
              <p className="text-xs font-bold text-on-surface-variant">Buses in Service</p>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-black text-secondary">{stats.busesInService || 84}/90</p>
                <span className="text-xs text-on-surface-variant">93% Fleet Uptime</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-tertiary space-y-1">
              <p className="text-xs font-bold text-on-surface-variant">Today's Ridership</p>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-black text-tertiary">{stats.todayRidership ? `${(stats.todayRidership / 1000).toFixed(1)}k` : '45.2k'}</p>
                <span className="text-xs font-bold text-secondary">↑ 1.8k</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-primary-container space-y-2">
              <p className="text-xs font-bold text-on-surface-variant">Avg Fleet Occupancy</p>
              <div className="space-y-1">
                <p className="text-2xl font-black text-primary-container">{stats.avgOccupancy || 68}%</p>
                <SeatOccupancyBar current={stats.avgOccupancy || 68} capacity={100} showText={false} />
              </div>
            </div>
          </div>

          {/* Main Grid: Map & Alerts */}
          <div className="grid grid-cols-12 gap-6">
            {/* Live Fleet Map */}
            <div className="col-span-12 lg:col-span-8 card p-4 space-y-3">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-base font-bold text-on-surface">Live Fleet Location & Status Map</h2>
                <span className="text-xs font-bold text-secondary flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary status-pulse"></span> Supabase Realtime Active
                </span>
              </div>
              <div className="w-full h-[350px] lg:h-[420px]">
                <MapView buses={mapBuses} height="100%" />
              </div>
            </div>

            {/* Quick Alerts Panel */}
            <div className="col-span-12 lg:col-span-4 card p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold">Quick Incident Alerts</h2>
                  <span className="bg-error text-on-error text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    {complaints.filter(c => c.status === 'open').length} Open
                  </span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {complaints.map(c => {
                    const cId = c._id || c.id;
                    return (
                      <div key={cId} className="p-3 bg-surface-container-low rounded-xl border-l-4 border-error space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-error uppercase">{c.type || 'Incident'}</span>
                          <span className="text-[10px] text-on-surface-variant">{new Date(c.createdAt || c.created_at || Date.now()).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs font-semibold text-on-surface line-clamp-2">{c.description}</p>
                        {c.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolveAlert(cId)}
                            className="text-[11px] text-primary font-bold hover:underline block pt-1"
                          >
                            Mark Resolved ✓
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {complaints.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-8">No open system alerts.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Demand Trends Chart */}
            <div className="col-span-12 card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold">Ridership Demand Trends</h2>
                  <p className="text-xs text-on-surface-variant">Actual vs AI-Predicted Ridership Volume (Current Week)</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" style={{ fontSize: '12px' }} />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="actual" name="Actual Ridership" stroke="#003fb1" fill="#003fb1" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="predicted" name="AI Predicted" stroke="#006c49" strokeDasharray="5 5" fill="#006c49" fillOpacity={0.05} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
