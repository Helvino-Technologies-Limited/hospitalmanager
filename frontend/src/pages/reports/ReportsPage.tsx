import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { reportApi } from '../../api/services';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [tab, setTab] = useState<'financial' | 'patients'>('financial');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const api = tab === 'financial' ? reportApi.financial : reportApi.patients;
      const { data } = await api(startDate, endDate);
      setReport(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const chartData = report ? [
    { name: 'Revenue', value: Number(report.totalRevenue || 0) },
    { name: 'Payments', value: Number(report.totalPayments || 0) },
    { name: 'Expenses', value: Number(report.totalExpenses || 0) },
    { name: 'Net Income', value: Number(report.netIncome || 0) },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setTab('financial')} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'financial' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Financial</button>
            <button onClick={() => setTab('patients')} className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'patients' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Patients</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={loadReport} disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>

        {report && tab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: report.totalRevenue, color: 'text-blue-600' },
                { label: 'Total Payments', value: report.totalPayments, color: 'text-green-600' },
                { label: 'Total Expenses', value: report.totalExpenses, color: 'text-red-600' },
                { label: 'Net Income', value: report.netIncome, color: 'text-purple-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>KES {Number(value || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number | undefined) => [`KES ${(v ?? 0).toLocaleString()}`, '']} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {report && tab === 'patients' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">New Patients</p>
              <p className="text-3xl font-bold text-primary-600">{String(report.newPatients || 0)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Total Visits</p>
              <p className="text-3xl font-bold text-teal-600">{String(report.totalVisits || 0)}</p>
            </div>
          </div>
        )}

        {!report && !loading && (
          <div className="text-center py-12 text-gray-400">
            <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select date range and click Generate Report</p>
          </div>
        )}
      </div>
    </div>
  );
}
