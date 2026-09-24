import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import PassStatusChip from '../../components/PassStatusChip';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activePass, setActivePass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPass();
  }, []);

  const fetchPass = async () => {
    try {
      const { data, error } = await supabase
        .from('passes')
        .select('*, route:routes(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      const found = (data || []).find(p => p.status === 'active') || (data || [])[0];
      setActivePass(found || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const studentName = user?.name || 'Aarav Sharma';
  const collegeName = user?.collegeName || 'VNIT Nagpur';

  return (
    <div className="flex bg-background min-h-screen">
      <StudentSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 p-4 sm:p-6 md:p-10 pt-20 md:pt-10 pb-24 md:pb-10 space-y-6 sm:space-y-8 min-h-screen">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">Namaste, {studentName}!</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">Welcome back to your JD College transit dashboard.</p>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-surface-container-lowest p-2 pr-5 rounded-full shadow-sm">
            <div className="w-10 h-10 rounded-full bg-primary-container text-primary-fixed-dim font-black flex items-center justify-center text-lg">
              {studentName[0]}
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface leading-tight">{studentName}</p>
              <p className="text-[11px] text-on-surface-variant">{collegeName}</p>
            </div>
          </div>
        </header>

        {/* Dashboard Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main Card: Current Active Pass */}
          <section className="col-span-12 lg:col-span-8 card p-6 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl relative overflow-hidden shadow-lg flex flex-col justify-between space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold opacity-80 uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  Student Concession Transit Pass
                </span>
                <h2 className="text-2xl font-black mt-3">{studentName}</h2>
                <p className="text-xs opacity-90">{collegeName} · ID: {user?.studentId || 'STU-8821'}</p>
              </div>

              {activePass && <PassStatusChip status={activePass.status} />}
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs opacity-80">Loading pass details...</div>
            ) : activePass ? (
              <div className="space-y-4 pt-2 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="opacity-70 block">Registered Route:</span>
                    <span className="font-bold text-sm">{activePass.route?.name || 'VNIT Campus Express (Route 42A)'}</span>
                  </div>
                  <div>
                    <span className="opacity-70 block">Boarding / Stop:</span>
                    <span className="font-bold text-sm">{activePass.boarding_point || 'Sitabuldi'} → {activePass.destination_stop || 'VNIT Gate'}</span>
                  </div>
                  <div>
                    <span className="opacity-70 block">Pass ID:</span>
                    <span className="font-mono font-bold text-sm">{activePass.pass_id}</span>
                  </div>
                  <div>
                    <span className="opacity-70 block">Valid Until:</span>
                    <span className="font-bold text-sm">{new Date(activePass.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {activePass.rollover_days_in > 0 && (
                  <div className="mt-3 bg-white/20 p-2 rounded-lg text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">redeem</span>
                    Rollover Balance: {activePass.rollover_days_in} days carried forward from your previous pass!
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <button onClick={() => navigate('/student/pass')} className="btn-secondary bg-white text-primary border-white hover:bg-surface-container-low text-xs font-bold">
                    View Digital Pass & QR Code
                  </button>

                  <button onClick={() => navigate('/student/renew')} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-xs font-bold">
                    Renew Pass
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm font-semibold">No active student pass found.</p>
                <button onClick={() => navigate('/student/renew')} className="btn-secondary bg-white text-primary border-white text-xs font-bold">
                  Apply for Student Pass (50% Concession)
                </button>
              </div>
            )}
          </section>

          {/* Quick Actions Column */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div onClick={() => navigate('/track')} className="card p-6 border-l-4 border-primary cursor-pointer hover:shadow-overlay transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">directions_bus</span>
                </div>
                <span className="text-xs font-bold text-primary">Live</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">Track Nagpur Bus</h3>
              <p className="text-xs text-on-surface-variant">Real-time GPS tracking for Sitabuldi, VNIT & MIHAN routes</p>
            </div>

            <div onClick={() => navigate('/student/payments')} className="card p-6 border-l-4 border-secondary cursor-pointer hover:shadow-overlay transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <span className="text-xs font-bold text-secondary">50% Off</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">Payment History</h3>
              <p className="text-xs text-on-surface-variant">View transactions & download fee receipts</p>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="col-span-12 card overflow-hidden">
            <div className="p-4 bg-surface-container-low font-bold text-sm flex justify-between items-center">
              <span>Recent Travel Activity (Nagpur Routes)</span>
              <button onClick={() => navigate('/student/payments')} className="text-xs text-primary font-bold hover:underline">
                View Full History
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Route</th>
                    <th>Tap Location</th>
                    <th>Concession Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Today, 08:15 AM</td>
                    <td className="font-bold text-primary">Route 42A</td>
                    <td>Sitabuldi → VNIT Gate</td>
                    <td className="font-bold text-secondary">₹10 (50% Off)</td>
                    <td><span className="px-2 py-0.5 bg-secondary/10 text-secondary font-bold text-xs rounded-full">Success</span></td>
                  </tr>
                  <tr>
                    <td>Yesterday, 05:30 PM</td>
                    <td className="font-bold text-primary">Route 42A</td>
                    <td>VNIT Gate → Dharampeth</td>
                    <td className="font-bold text-secondary">₹10 (50% Off)</td>
                    <td><span className="px-2 py-0.5 bg-secondary/10 text-secondary font-bold text-xs rounded-full">Success</span></td>
                  </tr>
                  <tr>
                    <td>26 Jul 2026, 09:00 AM</td>
                    <td className="font-bold text-primary">Route 101</td>
                    <td>Nagpur Railway Stn → Sitabuldi</td>
                    <td className="font-bold text-secondary">₹12.50 (50% Off)</td>
                    <td><span className="px-2 py-0.5 bg-secondary/10 text-secondary font-bold text-xs rounded-full">Success</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
