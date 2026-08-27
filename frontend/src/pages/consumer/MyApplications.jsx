// /frontend/src/pages/consumer/MyApplications.jsx
// Owned by Module 2. Works for any role calling GET /api/v1/applications —
// the backend scopes results (own / assigned / center / all) by req.user.role,
// so this same table can be reused verbatim by lmo/gatc/admin dashboards.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listApplications } from '../../services/applicationService';
import StatusBadge from '../../components/application/StatusBadge';
import sharedConstants from '../../constants/sharedConstants';

const { APPLICATION_STATUS, APPLICATION_TYPE } = sharedConstants;

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    listApplications({
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    })
      .then(setApplications)
      .catch(() => setError('Could not load applications. Please try again.'))
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter]);

  const isEmpty = useMemo(() => !loading && applications.length === 0, [loading, applications]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My applications</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track the status of every verification application you've submitted.
            </p>
          </div>
          <Link
            to="/applications/new"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
          >
            + New application
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {Object.values(APPLICATION_STATUS).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All types</option>
            {Object.values(APPLICATION_TYPE).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Application #</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-rose-600">
                    {error}
                  </td>
                </tr>
              )}
              {isEmpty && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No applications yet. Start by submitting a new one.
                  </td>
                </tr>
              )}
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{app.applicationNumber}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {app.instrument
                      ? `${app.instrument.make} ${app.instrument.model}`
                      : app.instrumentId?.make
                      ? `${app.instrumentId.make} ${app.instrumentId.model}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {app.type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/applications/${app._id}`} className="text-teal-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
