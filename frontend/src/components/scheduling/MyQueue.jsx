// /frontend/src/components/scheduling/MyQueue.jsx
// Owned by Module 3.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import schedulingService from '../../services/schedulingService';
import { useAuth } from '../../context/AuthContext'; // owned by Module 1

export default function MyQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await schedulingService.getLmoQueue(user.id, { date: dateFilter || undefined });
      setApplications(result.data.applications || []);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Inspection Queue</h1>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-500">Loading queue…</p>}
      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      {!loading && !errorMsg && applications.length === 0 && (
        <p className="text-gray-500">No inspections allocated{dateFilter ? ' for this date' : ''}.</p>
      )}

      <div className="grid gap-3">
        {applications.map((app) => (
          <div key={app._id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{app.applicationNumber}</p>
              <p className="text-sm text-gray-600">
                {app.instrumentId?.category?.replace('_', ' ')} — {app.instrumentId?.make}{' '}
                {app.instrumentId?.model}
              </p>
              <p className="text-sm text-gray-500">
                Applicant: {app.applicantId?.name} · Scheduled:{' '}
                {new Date(app.scheduledDate).toLocaleDateString()}
              </p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gray-100">
                {app.status.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={() => navigate(`/lmo/verification/${app._id}`)}
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
            >
              Record Inspection
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
