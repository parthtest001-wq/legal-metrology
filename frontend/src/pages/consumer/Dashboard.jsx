/**
 * Module 6 — /frontend/src/pages/consumer/Dashboard.jsx
 * Reuses AppLayout (Module 6, wraps NotificationBell from Module 5) and
 * dashboardService (Module 6). Does not redefine any Module 1-5 file.
 */
import { useEffect, useState } from 'react';
import AppLayout from '../../components/common/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import dashboardService from '../../services/dashboardService';

export default function ConsumerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    dashboardService
      .getConsumerDashboard()
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="My Dashboard">
      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="My Instruments" value={data.instrumentCount} />
            <StatCard label="Applications" value={data.applicationCount} />
            <StatCard
              label="Active Certificates"
              value={data.activeCertificates}
              tone="good"
            />
            <StatCard
              label="Renewing within 30 days"
              value={data.expiringSoon}
              tone={data.expiringSoon > 0 ? 'warn' : 'neutral'}
            />
          </div>

          {data.rejectedApplications > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {data.rejectedApplications} of your applications were rejected. Check
              your Applications page for remarks from the inspecting officer.
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Recent Notifications
            </h2>
            {/* Module 5 owns notification rendering elsewhere (NotificationBell);
                here we just list the same recentAlerts payload the API returns
                so the dashboard has an at-a-glance feed without re-implementing
                Module 5's component logic. */}
            {data.recentAlerts?.length ? (
              <ul className="space-y-2">
                {data.recentAlerts.map((n) => (
                  <li key={n._id} className="text-sm flex justify-between border-b border-slate-100 pb-2 last:border-0">
                    <span className={n.isRead ? 'text-slate-500' : 'text-slate-800 font-medium'}>
                      {n.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
