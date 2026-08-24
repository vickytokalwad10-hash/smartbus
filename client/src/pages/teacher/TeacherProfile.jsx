import { useState, useEffect } from 'react';
import TeacherNavbar from '../../components/TeacherNavbar';
import PassStatusChip from '../../components/PassStatusChip';
import QRCodeCard from '../../components/QRCodeCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const TeacherProfile = () => {
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, payRes, compRes] = await Promise.all([
        api.get('/passes/mine'),
        api.get('/payments/mine'),
        api.get('/complaints/mine')
      ]);
      setPasses(pRes.data || []);
      setPayments(payRes.data || []);
      setComplaints(compRes.data || []);
      if (pRes.data?.length > 0) setSelectedPass(pRes.data[0]);
    } catch (err) {
      console.error('Error fetching teacher profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    try {
      await api.post('/complaints', { type: complaintType, description: complaintText });
      setComplaintText('');
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const teacherName = user?.name || 'Prof. Rajesh Kulkarni';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TeacherNavbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-10 pb-24 md:pb-10 space-y-6 sm:space-y-8">
        {/* User Info Header */}
        <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-surface-container-low to-surface-container">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary text-on-primary font-black text-2xl flex items-center justify-center shadow-md">
              {teacherName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-black text-on-surface">{teacherName}</h1>
              <p className="text-xs text-on-surface-variant">
                {user?.email || 'teacher@jdcoem.ac.in'} · ID: {user?.employeeId || 'JDC-FAC-101'}
              </p>
              <span className="inline-block mt-1 px-3 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full capitalize">
                Role: Faculty Member (JD College)
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowModal(true)} className="btn-secondary text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">report_problem</span> Feedback / Request
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/30 gap-6">
          {[
            { id: 'passes', label: `Faculty Passes (${passes.length})` },
            { id: 'history', label: `Payment Receipts (${payments.length})` },
            { id: 'complaints', label: `Support Tickets (${complaints.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${
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
              <h2 className="text-lg font-bold">Selected Faculty QR Pass</h2>
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
              <h2 className="text-lg font-bold">All Saved Faculty Passes</h2>
              {loading ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">Loading passes...</div>
              ) : passes.length > 0 ? (
                <div className="space-y-4">
                  {passes.map(p => (
                    <div
                      key={p._id}
                      onClick={() => setSelectedPass(p)}
                      className={`card p-5 cursor-pointer border-2 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        selectedPass?._id === p._id ? 'border-primary bg-primary/5' : 'hover:border-outline-variant'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-primary text-lg">{p.passId}</span>
                          <PassStatusChip status={p.status} />
                        </div>
                        <p className="text-sm font-bold text-on-surface">{p.route?.name || 'JD College Campus Express'}</p>
                        <p className="text-xs text-on-surface-variant">
                          Stops: {p.boardingPoint} → {p.destinationStop}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Valid: {new Date(p.validFrom).toLocaleDateString()} to {new Date(p.validUntil).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-lg font-black text-on-surface">₹{p.amount}</p>
                        <span className="text-xs font-bold text-primary block">Click to view QR</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-10 text-center text-xs text-on-surface-variant">No faculty passes found.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Payment History */}
        {activeTab === 'history' && (
          <div className="card overflow-hidden">
            <div className="p-4 bg-surface-container-low font-bold text-sm">Faculty Transaction Receipts</div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay._id}>
                      <td>{new Date(pay.createdAt).toLocaleString()}</td>
                      <td className="font-mono text-xs">{pay.transactionId || pay._id.substr(0,8)}</td>
                      <td>{pay.description}</td>
                      <td>{pay.method}</td>
                      <td className="font-bold text-primary">₹{pay.amount}</td>
                      <td>
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary font-bold text-xs rounded-full">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Complaints */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Faculty Requests & Feedback</h2>
              <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
                + New Ticket
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaints.map(c => (
                <div key={c._id} className="card p-5 border-l-4 border-tertiary space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 px-2 py-0.5 rounded">
                      {c.type}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'resolved' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{c.description}</p>
                  <p className="text-[11px] text-on-surface-variant">Submitted on: {new Date(c.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* New Complaint / Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold">Submit Faculty Request / Feedback</h3>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Category</label>
                <select value={complaintType} onChange={(e) => setComplaintType(e.target.value)} className="input-field">
                  <option value="complaint">Service Request</option>
                  <option value="delay">Bus Delay Report</option>
                  <option value="incident">Route / Timing Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <textarea
                  rows="4"
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe your request or feedback in detail..."
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

export default TeacherProfile;
