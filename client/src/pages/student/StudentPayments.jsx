import React, { useEffect, useState } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const STATUS_CHIP = {
  success: 'bg-secondary-container text-secondary',
  paid: 'bg-secondary-container text-secondary',
  completed: 'bg-secondary-container text-secondary',
  pending: 'bg-tertiary-container text-tertiary',
  failed: 'bg-error-container text-error',
  refunded: 'bg-surface-container text-on-surface-variant',
};

const STATUS_ICON = {
  success: 'check_circle',
  paid: 'check_circle',
  completed: 'check_circle',
  pending: 'schedule',
  failed: 'cancel',
  refunded: 'undo',
};

const FILTER_TABS = ['All', 'Pass Purchase', 'Journey'];

function getType(payment) {
  const desc = (payment.description || payment.type || '').toLowerCase();
  if (desc.includes('pass') || desc.includes('renew') || desc.includes('apply')) return 'Pass Purchase';
  if (desc.includes('journey') || desc.includes('ride') || desc.includes('trip')) return 'Journey';
  return 'Other';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Fallback mock data
const MOCK_PAYMENTS = [
  { id: 'm1', created_at: '2024-07-20', description: 'Monthly Pass Purchase', route: 'Route 42', amount: 250, method: 'UPI', status: 'success' },
  { id: 'm2', created_at: '2024-07-19', description: 'Journey', route: 'Route 42', amount: 9, method: 'Wallet', status: 'success' },
];

export default function StudentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        const list = Array.isArray(data) ? data : [];
        if (list.length === 0) {
          setUseMock(true);
          setPayments(MOCK_PAYMENTS);
        } else {
          setPayments(list);
        }
      } catch {
        setUseMock(true);
        setPayments(MOCK_PAYMENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [user]);

  const filtered = payments.filter((p) => {
    if (activeTab === 'All') return true;
    return getType(p) === activeTab;
  });

  const totalSpent = payments
    .filter((p) => ['success', 'paid', 'completed'].includes(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const activePasses = payments.filter(
    (p) => getType(p) === 'Pass Purchase' && ['success', 'paid', 'completed'].includes(p.status)
  ).length;

  const lastPayment = payments.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )[0];

  const lastPaymentDate = formatDate(lastPayment?.created_at);

  const handleDownloadReceipt = (payment) => {
    const content = `SmartBus Receipt\n\nTransaction ID: ${payment.id}\nDate: ${formatDate(payment.created_at)}\nType: ${getType(payment)}\nRoute: ${payment.route || '—'}\nAmount: ₹${payment.amount}\nMethod: ${payment.method || payment.paymentMethod || '—'}\nStatus: ${payment.status}\n\nThank you for using SmartBus!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartbus-receipt-${payment.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex bg-background min-h-screen">
      <StudentSidebar />
      <main className="w-full md:ml-[260px] lg:ml-[280px] min-h-screen p-4 sm:p-6 md:p-10 pt-20 md:pt-10 pb-24 md:pb-10 bg-surface-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">Payment History</h1>
            <p className="text-body-lg text-on-surface-variant mt-1">
              {useMock
                ? 'Showing sample data (no API connection)'
                : 'All your SmartBus transactions in one place.'}
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-all text-label-md text-on-surface">
            <span className="material-symbols-outlined text-base">download</span>
            Export CSV
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">
              progress_activity
            </span>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    currency_rupee
                  </span>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Total Spent</p>
                  <p className="text-title-xl font-bold text-on-surface">₹{totalSpent.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-2xl">
                    card_membership
                  </span>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Pass Purchases</p>
                  <p className="text-title-xl font-bold text-on-surface">{activePasses}</p>
                </div>
              </div>

              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-2xl">
                    calendar_today
                  </span>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">Last Payment</p>
                  <p className="text-title-lg font-bold text-on-surface">{lastPaymentDate}</p>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-5 border-b border-outline-variant">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-label-lg font-medium border-b-2 transition-all -mb-px ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
                  }`}
                >
                  {tab}
                  {tab !== 'All' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-surface-container text-label-sm text-on-surface-variant">
                      {payments.filter((p) => getType(p) === tab).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-on-surface-variant text-5xl">
                    receipt_long
                  </span>
                </div>
                <h3 className="text-title-lg font-semibold text-on-surface mb-2">
                  No Payments Found
                </h3>
                <p className="text-body-md text-on-surface-variant text-center max-w-sm">
                  {activeTab === 'All'
                    ? 'You have no payment records yet.'
                    : `No "${activeTab}" transactions found.`}
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Route</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((payment, i) => {
                        const date = formatDate(payment.created_at);
                        const type = getType(payment);
                        const status = (payment.status || 'success').toLowerCase();
                        const method = payment.method || payment.paymentMethod || '—';
                        const route = payment.route || payment.routeName || '—';
                        const chipClass = STATUS_CHIP[status] || STATUS_CHIP.pending;
                        const chipIcon = STATUS_ICON[status] || 'help';

                        return (
                          <tr
                            key={payment.id || i}
                            className="hover:bg-surface-container-low transition-colors"
                          >
                            <td className="text-body-sm text-on-surface-variant whitespace-nowrap">
                              {date}
                            </td>
                            <td>
                              <span className="text-body-sm font-medium text-on-surface">
                                {type}
                              </span>
                            </td>
                            <td className="text-body-sm text-on-surface">{route}</td>
                            <td className="text-body-md font-semibold text-on-surface whitespace-nowrap">
                              ₹{(payment.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span className="flex items-center gap-1.5 text-body-sm text-on-surface">
                                <span className="material-symbols-outlined text-base text-on-surface-variant">
                                  {method.toLowerCase().includes('upi')
                                    ? 'smartphone'
                                    : method.toLowerCase().includes('card')
                                    ? 'credit_card'
                                    : 'account_balance_wallet'}
                                </span>
                                {method}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`chip ${chipClass} flex items-center gap-1 w-fit`}
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {chipIcon}
                                </span>
                                <span className="capitalize">{status}</span>
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleDownloadReceipt(payment)}
                                className="flex items-center gap-1.5 text-label-sm text-primary hover:text-primary/80 hover:underline transition-all px-2 py-1 rounded-lg hover:bg-primary-container/30"
                                title="Download Receipt"
                              >
                                <span className="material-symbols-outlined text-base">
                                  receipt
                                </span>
                                Receipt
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                <div className="px-6 py-3 border-t border-outline-variant flex items-center justify-between">
                  <span className="text-body-sm text-on-surface-variant">
                    Showing {filtered.length} of {payments.length} transactions
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    Total:{' '}
                    <strong className="text-on-surface">
                      ₹
                      {filtered
                        .filter((p) => ['success', 'paid'].includes(p.status))
                        .reduce((sum, p) => sum + (p.amount || 0), 0)
                        .toLocaleString('en-IN')}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
