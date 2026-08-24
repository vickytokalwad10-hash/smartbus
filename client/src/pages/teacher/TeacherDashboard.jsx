import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherNavbar from '../../components/TeacherNavbar';
import PassStatusChip from '../../components/PassStatusChip';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [frequentRoutes, setFrequentRoutes] = useState([]);
  const [activePass, setActivePass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, passesRes] = await Promise.all([
          api.get('/routes/frequent'),
          api.get('/passes/mine')
        ]);
        setFrequentRoutes(routesRes.data || []);
        const found = (passesRes.data || []).find(p => p.status === 'active');
        setActivePass(found || (passesRes.data || [])[0] || null);
      } catch (err) {
        console.error('Error fetching teacher dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/teacher/routes?query=${encodeURIComponent(search.trim())}`);
    }
  };

  const teacherName = user?.name || 'Prof. Rajesh Kulkarni';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TeacherNavbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10 space-y-6 sm:space-y-8">
        {/* Header Hero Banner */}
        <section className="bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl p-5 sm:p-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              JD College Faculty Portal
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">
              Welcome, {teacherName}!
            </h1>
            <p className="text-body-md text-on-primary/80">
              Manage your faculty bus pass, search college transit routes, and track JD College buses in real-time.
            </p>

            {/* Main Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl bg-white p-2 rounded-xl shadow-md">
              <div className="flex-1 flex items-center gap-2 px-3">
                <span className="material-symbols-outlined text-outline">search</span>
                <input
                  type="text"
                  placeholder="Enter destination or route number (e.g. Route 42A)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-on-surface text-sm border-none focus:outline-none placeholder:text-outline"
                />
              </div>
              <button type="submit" className="btn-primary py-2 px-6">
                Search Routes
              </button>
            </form>
          </div>
          <div className="absolute right-6 bottom-0 opacity-15 hidden lg:block">
            <span className="material-symbols-outlined text-[200px]">school</span>
          </div>
        </section>

        {/* Action CTAs & Current Pass */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4 flex flex-col justify-between">
            <div className="card p-6 border-l-4 border-primary hover:shadow-overlay transition-all cursor-pointer" onClick={() => navigate('/teacher/buy-pass')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Buy Faculty Bus Pass</h3>
                  <p className="text-xs text-on-surface-variant">30% Faculty concession auto-applied</p>
                </div>
              </div>
            </div>

            <div className="card p-6 border-l-4 border-secondary hover:shadow-overlay transition-all cursor-pointer" onClick={() => navigate('/track')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">location_on</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Track Live Bus</h3>
                  <p className="text-xs text-on-surface-variant">View bus location & seat availability</p>
                </div>
              </div>
            </div>

            <div className="card p-6 border-l-4 border-tertiary hover:shadow-overlay transition-all cursor-pointer" onClick={() => navigate('/teacher/profile')}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Faculty Profile & Pass</h3>
                  <p className="text-xs text-on-surface-variant">View digital QR pass & payments</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Pass Card */}
          <div className="lg:col-span-2 card p-6 flex flex-col justify-between relative overflow-hidden bg-surface-container-lowest">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Faculty Pass Status</h2>
                <p className="text-xs text-on-surface-variant">JD College Official Faculty Pass</p>
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
                    {activePass.passType === 'teacher' ? 'Faculty Pass' : activePass.duration + ' Pass'} · {activePass.passId}
                  </span>
                  <h3 className="text-2xl font-black">{activePass.route?.name || 'JD College Campus Express'}</h3>
                  <p className="text-xs opacity-80">
                    Stops: {activePass.boardingPoint} → {activePass.destinationStop}
                  </p>
                  <p className="text-xs font-semibold mt-2">
                    Valid until: {new Date(activePass.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <button onClick={() => navigate('/teacher/profile')} className="btn-secondary bg-white text-primary border-white hover:bg-surface-container-low font-bold text-xs whitespace-nowrap">
                  View Digital QR Pass
                </button>
              </div>
            ) : (
              <div className="py-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2">confirmation_number</span>
                <p className="text-sm font-bold text-on-surface mb-1">No Active Faculty Pass Found</p>
                <p className="text-xs text-on-surface-variant mb-4">Apply for your faculty bus pass to get 30% discount on college bus routes.</p>
                <button onClick={() => navigate('/teacher/buy-pass')} className="btn-primary text-xs">
                  Apply for Faculty Pass
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Frequent Routes Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">JD College Bus Routes</h2>
              <p className="text-xs text-on-surface-variant">Daily campus shuttles for faculty & students</p>
            </div>
            <button onClick={() => navigate('/teacher/routes')} className="text-xs font-bold text-primary hover:underline">
              View All Routes →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {frequentRoutes.map(route => (
              <div key={route._id} className="card p-5 hover:shadow-overlay transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-primary text-on-primary font-black rounded-lg text-sm">
                      Route {route.routeNumber}
                    </span>
                    <span className="text-xs text-secondary font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span> Active
                    </span>
                  </div>
                  <h3 className="font-bold text-on-surface text-base truncate">{route.name}</h3>
                  <p className="text-xs text-on-surface-variant truncate">
                    {route.stops?.length || 5} Stops · {route.frequency || 'Every 15 mins'}
                  </p>
                </div>

                <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                  <span className="text-sm font-black text-primary">₹{route.baseFare || 20}</span>
                  <button onClick={() => navigate(`/track?route=${route._id}`)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Track Live <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;
