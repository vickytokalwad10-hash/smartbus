import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import PassStatusChip from '../../components/PassStatusChip';
import api from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';

const AdminPasses = () => {
  const [passes, setPasses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
  }, [filter]);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      // 1. Try Express + MongoDB API first
      const endpoint = filter !== 'all' ? `/passes?status=${filter}` : '/passes';
      const res = await api.get(endpoint);
      if (Array.isArray(res.data)) {
        setPasses(res.data);
        return;
      }
    } catch (apiErr) {
      console.warn('Express passes API unavailable, falling back to Supabase:', apiErr.message);
    }

    // 2. Fallback to Supabase if configured
    try {
      let query = supabase.from('passes').select('*, user:profiles(*), route:routes(*)').order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setPasses(data || []);
    } catch (err) {
      console.error('Passes fetch failed:', err);
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/passes/${id}`, { status });
      fetchPasses();
      return;
    } catch (apiErr) {
      console.warn('API pass status update failed, attempting Supabase fallback:', apiErr.message);
    }

    try {
      await supabase.from('passes').update({ status }).eq('id', id);
      fetchPasses();
    } catch (err) {
      console.error('Failed to update pass status:', err);
    }
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-30 h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <h1 className="text-base sm:text-xl font-bold text-on-surface">Transit Passes Management</h1>
          <button
            onClick={fetchPasses}
            className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary transition-all font-semibold"
          >
            ↻ Refresh
          </button>
        </header>

        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Status Filter Tabs */}
          <div className="flex overflow-x-auto border-b border-outline-variant/30 gap-4 sm:gap-6 pb-1">
            {['all', 'active', 'pending', 'expired', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  filter === f ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                }`}
              >
                {f} Passes
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Pass ID</th>
                    <th>Passenger</th>
                    <th>Role</th>
                    <th>Route</th>
                    <th>Duration</th>
                    <th>Taps Left</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Valid Until</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-8 text-on-surface-variant text-sm">
                        Loading transit passes...
                      </td>
                    </tr>
                  ) : passes.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-8 text-on-surface-variant text-sm">
                        No passes found for filter "{filter}".
                      </td>
                    </tr>
                  ) : (
                    passes.map(p => {
                      const passId = p.passId || p.pass_id || p._id || p.id;
                      const rawId = p._id || p.id;
                      const validUntilDate = p.validUntil || p.valid_until;
                      const remainingTaps = p.totalTaps != null ? Math.max(0, p.totalTaps - (p.usedTaps || 0)) : null;

                      return (
                        <tr key={rawId}>
                          <td className="font-mono text-xs font-bold text-primary">{passId}</td>
                          <td className="font-bold text-on-surface">
                            {p.user?.name || (typeof p.user === 'string' ? p.user : 'Passenger')}
                            {p.boardingPoint && (
                              <div className="text-[11px] text-on-surface-variant font-normal">
                                {p.boardingPoint} → {p.destinationStop || 'Campus'}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">
                              {p.user?.role || p.passType || 'student'}
                            </span>
                          </td>
                          <td>
                            <span className="font-semibold text-xs">
                              {p.route?.routeNumber || p.route?.route_number ? `Route ${p.route?.routeNumber || p.route?.route_number}` : (p.route?.name || 'All Routes')}
                            </span>
                          </td>
                          <td className="capitalize text-xs">{p.duration}</td>
                          <td className="text-xs">
                            {remainingTaps !== null ? (
                              <span className="font-mono font-bold text-secondary">
                                {remainingTaps} / {p.totalTaps}
                                {p.rolloverTapsIn > 0 && (
                                  <span className="ml-1 text-[10px] text-primary bg-primary/10 px-1 py-0.5 rounded">
                                    +{p.rolloverTapsIn} roll
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant text-[11px]">Unlimited</span>
                            )}
                          </td>
                          <td className="font-bold text-primary text-xs">₹{p.amount}</td>
                          <td>
                            <PassStatusChip status={p.status} />
                          </td>
                          <td className="text-xs text-on-surface-variant">
                            {validUntilDate ? new Date(validUntilDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="space-x-1.5 whitespace-nowrap">
                            {p.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(rawId, 'active')}
                                  className="px-2.5 py-1 bg-secondary text-white rounded font-bold text-xs hover:bg-secondary-container transition-all"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(rawId, 'rejected')}
                                  className="px-2.5 py-1 bg-error text-white rounded font-bold text-xs hover:bg-error-container transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {p.status === 'active' && (
                              <button
                                onClick={() => handleUpdateStatus(rawId, 'expired')}
                                className="px-2 py-1 bg-outline-variant/30 text-on-surface-variant rounded text-xs hover:bg-error/20 hover:text-error transition-all font-semibold"
                              >
                                Expire
                              </button>
                            )}
                            {(p.status === 'expired' || p.status === 'rejected') && (
                              <button
                                onClick={() => handleUpdateStatus(rawId, 'active')}
                                className="px-2 py-1 bg-primary/10 text-primary rounded text-xs hover:bg-primary hover:text-white transition-all font-semibold"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPasses;
