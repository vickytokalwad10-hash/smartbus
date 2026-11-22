import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      // 1. Try Express + MongoDB API
      const res = await api.get('/complaints');
      if (Array.isArray(res.data)) {
        setComplaints(res.data);
        return;
      }
    } catch (apiErr) {
      console.warn('API complaints error, falling back to Supabase:', apiErr.message);
    }

    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*, user:profiles(*)')
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      setComplaints(data || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/complaints/${id}`, { status });
      fetchComplaints();
      return;
    } catch (apiErr) {
      console.warn('API complaint status update error, attempting Supabase fallback:', apiErr.message);
    }

    try {
      const payload = { status };
      if (status === 'resolved') payload.resolved_at = new Date();
      await supabase.from('complaints').update(payload).eq('id', id);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update complaint status:', err);
    }
  };

  const filtered = complaints.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-30 h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <h1 className="text-base sm:text-xl font-bold text-on-surface">Incident Complaints</h1>
          <button
            onClick={fetchComplaints}
            className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-all font-semibold"
          >
            ↻ Refresh
          </button>
        </header>

        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-outline-variant/30 gap-4 sm:gap-6 pb-1">
            {['all', 'open', 'in-progress', 'resolved'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                  filter === f ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                }`}
              >
                {f} ({complaints.filter(c => f === 'all' || c.status === f).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="card p-12 text-center text-xs text-on-surface-variant">
              Loading complaints and incident reports...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(c => {
                const rawId = c._id || c.id;
                const dateVal = c.createdAt || c.created_at;
                const subject = c.subject || c.type || 'Incident Report';
                const userObj = c.user;

                return (
                  <div key={rawId} className="card p-6 space-y-4 border-l-4 border-error flex flex-col justify-between shadow-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-0.5 bg-error/10 text-error font-black text-xs uppercase rounded">
                          {subject}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          c.status === 'resolved' ? 'bg-secondary/10 text-secondary' :
                          c.status === 'in-progress' ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-on-surface">{c.description}</h3>
                      <p className="text-xs text-on-surface-variant">
                        Submitted by:{' '}
                        <strong>
                          {typeof userObj === 'object' && userObj ? userObj.name || userObj.email : 'Passenger'}
                        </strong>
                        {typeof userObj === 'object' && userObj?.email && ` (${userObj.email})`}
                      </p>
                      {c.bus && (
                        <p className="text-xs text-on-surface-variant">
                          Bus: <span className="font-semibold">{c.bus.busNumber || c.bus}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-outline">
                        Date: {dateVal ? new Date(dateVal).toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/30 flex gap-2 justify-end">
                      {c.status !== 'in-progress' && c.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(rawId, 'in-progress')}
                          className="px-3 py-1.5 bg-tertiary text-white rounded font-bold text-xs hover:bg-tertiary-container transition-all"
                        >
                          Mark In-Progress
                        </button>
                      )}
                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(rawId, 'resolved')}
                          className="px-3 py-1.5 bg-secondary text-white rounded font-bold text-xs hover:bg-secondary-container transition-all"
                        >
                          Mark Resolved ✓
                        </button>
                      )}
                      {c.status === 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(rawId, 'open')}
                          className="px-2.5 py-1 text-xs border border-outline-variant/30 text-on-surface-variant hover:text-error hover:border-error transition-all rounded font-semibold"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-2 card p-12 text-center text-xs text-on-surface-variant">
                  No incident tickets in this view.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Complaints;
