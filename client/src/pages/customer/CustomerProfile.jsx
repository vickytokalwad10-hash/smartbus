import { useState, useEffect } from 'react';
import CustomerNavbar from '../../components/CustomerNavbar';
import PassStatusChip from '../../components/PassStatusChip';
import QRCodeCard from '../../components/QRCodeCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';

const CustomerProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('passes'); // 'passes' | 'history' | 'complaints'
  const [passes, setPasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Complaint modal state
  const [showModal, setShowModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintType, setComplaintType] = useState('complaint');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    let loadedPasses = [];
    let loadedPayments = [];
    let loadedComplaints = [];

    // 1. Try Express + MongoDB API first
    try {
      const [pRes, payRes, compRes] = await Promise.allSettled([
        api.get('/passes/mine'),
        api.get('/payments/mine'),
        api.get('/complaints/mine')
      ]);

      if (pRes.status === 'fulfilled' && Array.isArray(pRes.value.data)) loadedPasses = pRes.value.data;
      if (payRes.status === 'fulfilled' && Array.isArray(payRes.value.data)) loadedPayments = payRes.value.data;
      if (compRes.status === 'fulfilled' && Array.isArray(compRes.value.data)) loadedComplaints = compRes.value.data;
    } catch (apiErr) {
      console.warn('API error in CustomerProfile, attempting Supabase fallback:', apiErr.message);
    }

    // 2. Fallback to Supabase
    if (loadedPasses.length === 0 && loadedPayments.length === 0 && loadedComplaints.length === 0) {
      try {
        const [pRes, payRes, compRes] = await Promise.all([
          supabase.from('passes').select('*, route:routes(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('complaints').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);
        if (pRes.data) loadedPasses = pRes.data;
        if (payRes.data) loadedPayments = payRes.data;
        if (compRes.data) loadedComplaints = compRes.data;
      } catch (err) {
        console.warn('Supabase fallback error:', err.message);
      }
    }

    setPasses(loadedPasses);
    setPayments(loadedPayments);
    setComplaints(loadedComplaints);
    if (loadedPasses.length > 0) setSelectedPass(loadedPasses[0]);
    setLoading(false);
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim() || !user) return;

    try {
      await api.post('/complaints', {
        type: complaintType,
        subject: complaintType === 'delay' ? 'Bus Delay Report' : complaintType === 'incident' ? 'Safety / Driver Issue' : 'Customer Feedback',
        description: complaintText
      });
      setComplaintText('');
      setShowModal(false);
      fetchData();
      return;
    } catch (apiErr) {
      console.warn('API complaint submission error, trying Supabase fallback:', apiErr.message);
    }

    try {
      await supabase.from('complaints').insert([{ type: complaintType, description: complaintText, user_id: user.id }]);
      setComplaintText('');
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error submitting complaint:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomerNavbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8">
        {/* User Info Header */}
        <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-surface-container-low to-surface-container">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary text-on-primary font-black text-2xl flex items-center justify-center shadow-md">
              {user?.name?.[0] || 'C'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-on-surface">{user?.name || 'Commuter User'}</h1>
              <p className="text-xs text-on-surface-variant">{user?.email} · {user?.phone || 'No phone registered'}</p>
              <span className="inline-block mt-1 px-3 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full capitalize">
                Role: {user?.role || 'Customer'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowModal(true)} className="btn-secondary text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">report_problem</span> Submit Complaint / Feedback
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/30 gap-6 overflow-x-auto pb-1">
          {[
            { id: 'passes', label: `My Passes (${passes.length})` },
            { id: 'history', label: `Payment History (${payments.length})` },
            { id: 'complaints', label: `Support Tickets (${complaints.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Passes */}
        {activeTab === 'passes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* QRCode Preview Column */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold">Selected Pass QR Code</h2>
              {selectedPass ? (
                <QRCodeCard pass={selectedPass} />
              ) : (
                <div className="card p-8 text-center text-xs text-on-surface-variant">
                  Select a pass from the list to view its digital QR code.
                </div>
              )}
            </div>

            {/* Pass List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold">All Saved Passes</h2>
              {loading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Loading passes...</div>
              ) : passes.length > 0 ? (
                <div className="space-y-4">
                  {passes.map(p => {
                    const passId = p.passId || p.pass_id || p._id || p.id;
                    const rawId = p._id || p.id;
                    const routeName = p.route?.name || (p.route?.routeNumber ? `Route ${p.route.routeNumber}` : 'All City Routes');
                    const boarding = p.boardingPoint || p.boarding_point || 'Nagpur';
                    const destination = p.destinationStop || p.destination_stop || 'Campus';
                    const createdAt = p.createdAt || p.created_at;
                    const validUntil = p.validUntil || p.valid_until;
                    const isSelected = (selectedPass?._id || selectedPass?.id) === rawId;
                    const remainingTaps = p.totalTaps != null ? Math.max(0, p.totalTaps - (p.usedTaps || 0)) : null;

                    return (
                      <div
                        key={rawId}
                        onClick={() => setSelectedPass(p)}
                        className={`card p-5 cursor-pointer border-2 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-outline-variant'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-primary text-lg">{passId}</span>
                            <PassStatusChip status={p.status} />
                          </div>
                          <p className="text-sm font-bold text-on-surface">{routeName}</p>
                          <p className="text-xs text-on-surface-variant">
                            Stops: {boarding} → {destination}
                          </p>
                          {remainingTaps !== null && (
                            <p className="text-xs font-bold text-secondary">
                              Tap Balance: {remainingTaps} / {p.totalTaps} taps
                              {p.rolloverTapsIn > 0 && ` (+${p.rolloverTapsIn} rollover)`}
                            </p>
                          )}
                          <p className="text-xs text-on-surface-variant">
                            Valid: {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'} to {validUntil ? new Date(validUntil).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>

                        <div className="text-right space-y-1">
                          <p className="text-lg font-black text-on-surface">₹{p.amount}</p>
                          <span className="text-xs font-bold text-primary block">Click to view QR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card p-10 text-center text-xs text-on-surface-variant">No passes found.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Payment History */}
        {activeTab === 'history' && (
          <div className="card overflow-hidden">
            <div className="p-4 bg-surface-container-low font-bold text-sm">Transaction Logs</div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => {
                    const rawId = pay._id || pay.id || '';
                    const dateVal = pay.createdAt || pay.created_at;
                    return (
                      <tr key={rawId}>
                        <td>{dateVal ? new Date(dateVal).toLocaleString() : 'N/A'}</td>
                        <td className="font-mono text-xs">{pay.transactionId || rawId.substr(0, 8)}</td>
                        <td>{pay.description || 'Bus Pass Purchase'}</td>
                        <td>{pay.method || 'UPI'}</td>
                        <td className="font-bold text-primary">₹{pay.amount}</td>
                        <td>
                          <span className="px-2 py-0.5 bg-secondary/10 text-secondary font-bold text-xs rounded-full">
                            {pay.status || 'success'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Complaints */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Support Tickets & Delay Reports</h2>
              <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
                + New Ticket
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaints.map(c => {
                const rawId = c._id || c.id;
                const dateVal = c.createdAt || c.created_at;
                return (
                  <div key={rawId} className="card p-5 border-l-4 border-tertiary space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">
                        {c.type || 'Complaint'}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'resolved' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                      }`}>
                        {c.status || 'open'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-on-surface">{c.description}</p>
                    <p className="text-[11px] text-on-surface-variant">Submitted on: {dateVal ? new Date(dateVal).toLocaleString() : 'N/A'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* New Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">Submit Complaint / Feedback</h3>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Issue Category</label>
                <select value={complaintType} onChange={(e) => setComplaintType(e.target.value)} className="input-field">
                  <option value="complaint">Service Complaint</option>
                  <option value="delay">Bus Delay Report</option>
                  <option value="incident">Safety / Driver Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <textarea
                  rows="4"
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe your issue or feedback in detail..."
                  className="input-field"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile;
