/**
 * Module 6 — /frontend/src/pages/lmo/Dashboard.jsx
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import dashboardService from '../../services/dashboardService';

export default function LmoDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getLmoDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Inspection Dashboard">
      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Pending Inspections" value={data.pendingInspections} tone="warn" />
            <StatCard label="Completed This Month" value={data.completedThisMonth} tone="good" />
            <StatCard label="Failed This Month" value={data.failedThisMonth} tone={data.failedThisMonth > 0 ? 'bad' : 'neutral'} />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Upcoming in Queue
            </h2>
            {data.queue?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4">Instrument</th>
                    <th className="py-2 pr-4">Scheduled</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.queue.map((app) => (
                    <tr key={app._id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">
                        {app.instrumentId?.category} · {app.instrumentId?.serialNumber}
                      </td>
                      <td className="py-2 pr-4">
                        {app.scheduledDate
                          ? new Date(app.scheduledDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-2 pr-4 capitalize">{app.status.replace('_', ' ')}</td>
                      <td className="py-2 text-right">
                        <Link
                          to={`/lmo/verification/${app._id}`}
                          className="text-teal-700 text-xs font-medium hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-400">Queue is empty.</p>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
