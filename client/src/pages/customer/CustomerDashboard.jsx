import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import PassStatusChip from '../../components/PassStatusChip';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [frequentRoutes, setFrequentRoutes] = useState([]);
  const [activePass, setActivePass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    let loadedRoutes = [];
    let loadedPasses = [];

    // 1. Try Express + MongoDB API first
    try {
      const [rRes, pRes] = await Promise.allSettled([
        api.get('/routes'),
        api.get('/passes/mine')
      ]);

      if (rRes.status === 'fulfilled' && Array.isArray(rRes.value.data)) {
        loadedRoutes = rRes.value.data.slice(0, 4);
      }
      if (pRes.status === 'fulfilled' && Array.isArray(pRes.value.data)) {
        loadedPasses = pRes.value.data;
      }
    } catch (apiErr) {
      console.warn('API error in CustomerDashboard, attempting Supabase fallback:', apiErr.message);
    }

    // 2. Fallback to Supabase if empty
    if (loadedRoutes.length === 0 || loadedPasses.length === 0) {
      try {
        const [routesRes, passesRes] = await Promise.all([
          supabase.from('routes').select('*').limit(4),
          supabase.from('passes').select('*, route:routes(*)').eq('user_id', user?.id).order('created_at', { ascending: false })
        ]);
        if (loadedRoutes.length === 0 && routesRes.data) loadedRoutes = routesRes.data;
        if (loadedPasses.length === 0 && passesRes.data) loadedPasses = passesRes.data;
      } catch (err) {
        console.warn('Supabase fallback error in CustomerDashboard:', err.message);
      }
    }

    setFrequentRoutes(loadedRoutes);
    const found = loadedPasses.find(p => p.status === 'active') || loadedPasses[0] || null;
    setActivePass(found);
    setLoading(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/customer/routes?query=${encodeURIComponent(search.trim())}`);
    }
  };

  const passId = activePass?.passId || activePass?.pass_id;
  const routeName = activePass?.route?.name || (activePass?.route?.routeNumber ? `Route ${activePass.route.routeNumber}` : 'All City Routes');
  const validUntil = activePass?.validUntil || activePass?.valid_until;
  const boarding = activePass?.boardingPoint || activePass?.boarding_point || 'Nagpur Central';
  const destination = activePass?.destinationStop || activePass?.destination_stop || 'Campus';
  const remainingTaps = activePass?.totalTaps != null ? Math.max(0, activePass.totalTaps - (activePass.usedTaps || 0)) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomerNavbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8">
        {/* Header Hero Banner */}
        <section className="bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name || 'Commuter'}!
            </h1>
            <p className="text-xs sm:text-sm text-on-primary/80">
              Where are you heading today? Find routes, track buses in real-time, and manage digital tickets.
            </p>

            {/* Main Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl bg-white p-2 rounded-xl shadow-md">
              <div className="flex-1 flex items-center gap-2 px-3">
                <span className="material-symbols-outlined text-outline">search</span>
                <input
                  type="text"
                  placeholder="Enter destination or route number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-on-surface text-xs sm:text-sm border-none focus:outline-none placeholder:text-outline"
                />
              </div>
              <button type="submit" className="btn-primary py-2 px-4 sm:px-6 text-xs sm:text-sm">
                Search
              </button>
            </form>
          </div>
          <div className="absolute right-6 bottom-0 opacity-15 hidden lg:block">
            <span className="material-symbols-outlined text-[200px]">directions_bus</span>
          </div>
        </section>

        {/* Action CTAs & Current Pass */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
            <div className="card p-6 border-l-4 border-primary hover:shadow-overlay transition-all cursor-pointer" onClick={() => navigate('/customer/buy-pass')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Buy New Bus Pass</h3>
                  <p className="text-xs text-on-surface-variant">Daily, Weekly, Monthly or Annual options</p>
                </div>
              </div>
            </div>

            <div className="card p-6 border-l-4 border-secondary hover:shadow-overlay transition-all cursor-pointer" onClick={() => navigate('/track')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">location_on</span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Track Live Bus</h3>
                  <p className="text-xs text-on-surface-variant">View bus locations & seat occupancy</p>
                </div>
              </div>
            </div>

            <div className="card p-6 border-l-4 border-tertiary hover:shadow-overlay transition-all cursor-pointer" onClick={() => navigate('/customer/profile')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">history</span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">My Passes & History</h3>
                  <p className="text-xs text-on-surface-variant">View saved tickets and transaction history</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Pass Card */}
          <div className="lg:col-span-2 card p-6 flex flex-col justify-between relative overflow-hidden bg-surface-container-lowest">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-on-surface">Active Pass Status</h2>
                <p className="text-xs text-on-surface-variant">Your current pass for commuter travel</p>
              </div>
              {activePass && <PassStatusChip status={activePass.status} />}
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-on-surface-variant">Loading pass status...</p>
              </div>
            ) : activePass ? (
              <div className="bg-gradient-to-r from-primary to-surface-tint rounded-xl p-6 text-on-primary flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                    {activePass.duration} Pass · {passId}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black">{routeName}</h3>
                  <p className="text-xs opacity-80">
                    Stops: {boarding} → {destination}
                  </p>
                  {remainingTaps !== null && (
                    <p className="text-xs font-bold text-secondary-container">
                      Tap Balance: {remainingTaps} / {activePass.totalTaps} taps
                      {activePass.rolloverTapsIn > 0 && ` (+${activePass.rolloverTapsIn} rolled over)`}
                    </p>
                  )}
                  <p className="text-xs font-semibold mt-1">
                    Valid until: {validUntil ? new Date(validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>

                <button onClick={() => navigate('/customer/profile')} className="btn-secondary bg-white text-primary border-white hover:bg-surface-container-low font-bold text-xs whitespace-nowrap">
                  View Digital QR Pass
                </button>
              </div>
            ) : (
              <div className="py-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">confirmation_number</span>
                <p className="text-sm font-bold text-on-surface mb-1">No Active Pass Found</p>
                <p className="text-xs text-on-surface-variant mb-4">Get a bus pass to save up to 40% on daily commute fares.</p>
                <button onClick={() => navigate('/customer/buy-pass')} className="btn-primary text-xs">
                  Buy Bus Pass Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Frequent Routes Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Popular Routes</h2>
              <p className="text-xs text-on-surface-variant">Frequently travelled urban bus corridors</p>
            </div>
            <button onClick={() => navigate('/customer/routes')} className="text-xs font-bold text-primary hover:underline">
              View All Routes →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {frequentRoutes.map(route => {
              const rId = route._id || route.id;
              const rNum = route.routeNumber || route.route_number || 'Route';
              const rFare = route.baseFare || route.base_fare || 20;

              return (
                <div key={rId} className="card p-5 hover:shadow-overlay transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-primary text-on-primary font-black rounded-lg text-sm">
                        Route {rNum}
                      </span>
                      <span className="text-xs text-secondary font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span> Active
                      </span>
                    </div>
                    <h3 className="font-bold text-on-surface text-base">{route.name}</h3>
                    <p className="text-xs text-on-surface-variant">
                      {route.stops?.length || 5} Stops · {route.frequency || 'Every 15 mins'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="text-sm font-black text-primary">₹{rFare}</span>
                    <button onClick={() => navigate(`/track?route=${rId}`)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      Track Live <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default CustomerDashboard;
