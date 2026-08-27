/**
 * Module 6 — /frontend/src/pages/gatc/Dashboard.jsx
 */
import { useEffect, useState } from 'react';
import AppLayout from '../../components/common/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import PerformanceTable from '../../components/dashboard/PerformanceTable';
import dashboardService from '../../services/dashboardService';

export default function GatcDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    dashboardService
      .getGatcDashboard()
      .then(setData)
      .catch((e) => setErr(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="GATC Dashboard">
      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Pending Applications" value={data.pendingApplications} tone="warn" />
            <StatCard label="Certificates Issued This Month" value={data.certificatesIssued} tone="good" />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              LMO Workload
            </h2>
            <PerformanceTable rows={data.lmoWorkload} emptyText="No LMOs assigned yet." />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
