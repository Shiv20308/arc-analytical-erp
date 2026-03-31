import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { dashboardAPI } from '../api';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatDate, statusBadgeClass } from '../utils';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const ov = data?.overview || {};
  const revenueLabels = data?.charts?.monthlyRevenue?.map(m => `${MONTHS[m._id.month-1]} ${m._id.year}`) || [];
  const revenueData = data?.charts?.monthlyRevenue?.map(m => m.revenue) || [];
  const visitStatuses = data?.charts?.visitsByStatus || [];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={ov.totalClients || 0} icon="🏢" color="blue" />
        <StatCard title="Active Contracts" value={ov.activeContracts || 0} icon="📋" color="green" subtitle={`AMC: ${ov.amcCount || 0} | CMC: ${ov.cmcCount || 0}`} />
        <StatCard title="Expiring Soon" value={ov.expiringContracts || 0} icon="⚠️" color="yellow" subtitle="Next 30 days" />
        <StatCard title="Pending Visits" value={ov.pendingVisits || 0} icon="🔧" color="purple" />
        <StatCard title="Quotations (Month)" value={ov.quotationsThisMonth || 0} icon="📄" color="indigo" />
        <StatCard title="Invoices (Month)" value={ov.invoicesThisMonth || 0} icon="🧾" color="teal" />
        <StatCard title="Pending Follow-ups" value={ov.pendingFollowups || 0} icon="📞" color="orange" />
        <StatCard title="Pending POs" value={ov.pendingPOs || 0} icon="📦" color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Revenue (Last 6 Months)</h3>
          {revenueData.length > 0 ? (
            <Bar
              data={{
                labels: revenueLabels,
                datasets: [{ label: 'Revenue (₹)', data: revenueData, backgroundColor: '#3b82f6', borderRadius: 6, borderSkipped: false }]
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => `₹${(v/1000).toFixed(0)}k` } } } }}
            />
          ) : <div className="flex items-center justify-center h-40 text-gray-400">No revenue data yet</div>}
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Visit Status</h3>
          {visitStatuses.length > 0 ? (
            <Doughnut
              data={{
                labels: visitStatuses.map(v => v._id),
                datasets: [{ data: visitStatuses.map(v => v.count), backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6'], borderWidth: 0 }]
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          ) : <div className="flex items-center justify-center h-40 text-gray-400">No visit data yet</div>}
        </div>
      </div>

      {/* Recent Quotations */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="section-title">Recent Quotations</h3>
          <a href="/quotations" className="text-sm text-primary-600 hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-gray-50">
          {data?.recentQuotations?.length > 0 ? data.recentQuotations.map(q => (
            <div key={q._id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{q.quotationNo}</p>
                <p className="text-xs text-gray-500">{q.clientId?.companyName} · {formatDate(q.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(q.totalAmount)}</span>
                <span className={statusBadgeClass(q.status)}>{q.status}</span>
              </div>
            </div>
          )) : (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No quotations yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
