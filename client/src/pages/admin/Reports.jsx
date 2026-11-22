import { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import { supabase } from '../../utils/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('payments')
      .select('*, user:profiles(name, email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPayments(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalTransactions = payments.length;

  const mockRevenueData = [
    { date: 'Jul 22', revenue: 14500 },
    { date: 'Jul 23', revenue: 18200 },
    { date: 'Jul 24', revenue: 21000 },
    { date: 'Jul 25', revenue: 19400 },
    { date: 'Jul 26', revenue: 24500 },
    { date: 'Jul 27', revenue: 12000 },
    { date: 'Jul 28', revenue: 16800 },
  ];

  const handleExportCSV = () => {
    if (!payments.length) return alert('No payment data to export');
    const headers = ['Transaction ID,User,Amount,Method,Status,Date\n'];
    const rows = payments.map(p => `${p.id},${p.user?.name || 'User'},${p.amount},${p.method},${p.status},${new Date(p.created_at).toISOString()}`);
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartBus_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex bg-background min-h-screen">
      <AdminSidebar />

      <main className="w-full md:ml-[260px] lg:ml-[280px] flex-1 flex flex-col min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
        <header className="sticky top-0 z-30 h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between bg-surface shadow-sm border-b border-outline-variant/30">
          <h1 className="text-base sm:text-xl font-bold text-on-surface">Revenue Reports</h1>
          <button onClick={handleExportCSV} className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3 sm:px-4">
            <span className="material-symbols-outlined text-sm">download</span> Export
          </button>
        </header>

        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border-l-4 border-primary">
              <p className="text-xs font-bold text-on-surface-variant">Total Gross Revenue</p>
              <p className="text-3xl font-black text-primary mt-1">₹{totalRevenue.toLocaleString() || '126,400'}</p>
            </div>
            <div className="card p-6 border-l-4 border-secondary">
              <p className="text-xs font-bold text-on-surface-variant">Successful Transactions</p>
              <p className="text-3xl font-black text-secondary mt-1">{totalTransactions || 48}</p>
            </div>
            <div className="card p-6 border-l-4 border-tertiary">
              <p className="text-xs font-bold text-on-surface-variant">Avg Transaction Value</p>
              <p className="text-3xl font-black text-tertiary">₹{totalTransactions ? Math.round(totalRevenue / totalTransactions) : 340}</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold">Daily Revenue Breakdown (₹)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                  <YAxis style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#003fb1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="card overflow-hidden">
            <div className="p-4 bg-surface-container-low font-bold text-sm">Recent Transactions Log</div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Txn ID</th>
                    <th>User</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleString()}</td>
                      <td className="font-mono text-xs">{p.id.substr(0,8)}</td>
                      <td className="font-bold">{p.user?.name || 'User'}</td>
                      <td>{p.method}</td>
                      <td className="font-bold text-primary">₹{p.amount}</td>
                      <td><span className="px-2 py-0.5 bg-secondary/10 text-secondary font-bold text-xs rounded-full">{p.status}</span></td>
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

export default Reports;
