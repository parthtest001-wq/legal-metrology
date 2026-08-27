/**
 * Module 6 — /frontend/src/pages/admin/Dashboard.jsx
 */
import { useEffect, useState } from 'react';
import AppLayout from '../../components/common/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import StatusBarChart from '../../components/dashboard/StatusBarChart';
import DistrictHeatmap from '../../components/dashboard/DistrictHeatmap';
import dashboardService from '../../services/dashboardService';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getAdminDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="System Overview">
      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={data.totalUsers} />
            <StatCard label="Total GATCs" value={data.totalGatcs} />
            <StatCard label="Total Instruments" value={data.totalInstruments} />
            <StatCard
              label="Certificates This Month"
              value={data.certificatesIssuedThisMonth}
              tone="good"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">
                Applications by Status
              </h2>
              <StatusBarChart applicationsByStatus={data.applicationsByStatus} />
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">
                Rejections by District
              </h2>
              {data.rejectionsByDistrict?.length ? (
                <ul className="space-y-2">
                  {data.rejectionsByDistrict.map((r) => (
                    <li
                      key={r.district}
                      className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0"
                    >
                      <span className="text-slate-700">{r.district}</span>
                      <span className="font-mono text-red-600">{r.rejectedCount}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No rejections recorded.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Pendency Heatmap — District × Instrument Category
            </h2>
            <DistrictHeatmap pendencyHeatmap={data.pendencyHeatmap} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
