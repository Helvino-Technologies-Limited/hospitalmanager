import { useEffect, useState } from 'react';
import { Users, CalendarDays, CreditCard, BedDouble, FlaskConical, AlertTriangle, TrendingUp } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import type { Dashboard } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then((r) => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Patients Today', value: data?.patientsToday ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Appointments', value: data?.appointmentsToday ?? 0, icon: CalendarDays, color: 'bg-purple-50 text-purple-600' },
    { label: "Today's Revenue", value: `KES ${(data?.revenueToday ?? 0).toLocaleString()}`, icon: CreditCard, color: 'bg-green-50 text-green-600' },
    { label: 'Bed Occupancy', value: `${data?.bedOccupancyRate ?? 0}%`, icon: BedDouble, color: 'bg-orange-50 text-orange-600' },
  ];

  const revenueData = [
    { name: 'Mon', revenue: 45000 }, { name: 'Tue', revenue: 52000 },
    { name: 'Wed', revenue: 48000 }, { name: 'Thu', revenue: 61000 },
    { name: 'Fri', revenue: 55000 }, { name: 'Sat', revenue: 32000 },
    { name: 'Sun', revenue: 28000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Revenue This Week</h2>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" /> +12.5%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number | undefined) => [`KES ${(v ?? 0).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{data?.lowStockDrugs?.length ?? 0} Low Stock Drugs</p>
                <p className="text-xs text-red-600 mt-0.5">Reorder needed</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <FlaskConical className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{data?.pendingLabOrders ?? 0} Pending Lab Orders</p>
                <p className="text-xs text-yellow-600 mt-0.5">Awaiting processing</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <BedDouble className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">{data?.availableBeds ?? 0} Available Beds</p>
                <p className="text-xs text-blue-600 mt-0.5">of {data?.totalBeds ?? 0} total</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Revenue</h3>
            <div className="text-2xl font-bold text-gray-900">KES {(data?.revenueThisMonth ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
