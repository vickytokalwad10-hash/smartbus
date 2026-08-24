import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import PassStatusChip from '../../components/PassStatusChip';
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
      let query = supabase.from('passes').select('*, user:profiles(*), route:routes(*)').order('created_at', { ascending: false });
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setPasses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await supabase.from('passes').update({ status }).eq('id', id);
      fetchPasses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-30 h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <h1 className="text-base sm:text-xl font-bold text-on-surface">Transit Passes</h1>
        </header>

        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Status Filter Tabs */}
          <div className="flex overflow-x-auto border-b border-outline-variant/30 gap-4 sm:gap-6 pb-1">
            {['all', 'active', 'pending', 'expired', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
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
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Valid Until</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map(p => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs font-bold text-primary">{p.pass_id}</td>
                      <td className="font-bold">{p.user?.name || 'User'}</td>
                      <td>
                        <span className="capitalize text-xs font-semibold text-on-surface-variant">
                          {p.user?.role || 'customer'}
                        </span>
                      </td>
                      <td>Route {p.route?.route_number || 'All'}</td>
                      <td className="capitalize">{p.duration}</td>
                      <td className="font-bold text-primary">₹{p.amount}</td>
                      <td>
                        <PassStatusChip status={p.status} />
                      </td>
                      <td>{new Date(p.valid_until).toLocaleDateString()}</td>
                      <td className="space-x-2">
                        {p.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'active')}
                              className="px-3 py-1 bg-secondary text-white rounded font-bold text-xs hover:bg-secondary-container"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'rejected')}
                              className="px-3 py-1 bg-error text-white rounded font-bold text-xs hover:bg-error-container"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {p.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'expired')}
                            className="px-2 py-1 bg-outline-variant/30 text-on-surface-variant rounded text-xs"
                          >
                            Expire
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
