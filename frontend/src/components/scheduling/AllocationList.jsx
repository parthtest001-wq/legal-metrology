// /frontend/src/components/scheduling/AllocationList.jsx
// Owned by Module 3.
// Reads pending applications via applicationService (owned by Module 2) and
// LMO users via userService/authService (owned by Module 1) — consumes, does
// not redefine, either service.

import { useEffect, useState } from 'react';
// MERGE FIX: was `import applicationService from '../../services/applicationService'`
// (a default import) then called `applicationService.getApplications(filter)`.
// Module 2's applicationService.js has no default export — only named
// exports — and the real function is `listApplications`, which already
// returns the unwrapped `applications` array (not an axios-shaped
// `{ data: { applications } }` response). Both the import style and the
// method name were wrong; this would have thrown
// "applicationService.getApplications is not a function" at runtime.
import { listApplications } from '../../services/applicationService';
import api from '../../services/api';
import AssignModal from './AssignModal';
import { useAuth } from '../../context/AuthContext'; // owned by Module 1

export default function AllocationList() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [lmoOptions, setLmoOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [assigningApp, setAssigningApp] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // A 'gatc' user only allocates applications routed to their own center;
      // the backend also enforces this, but scoping the query here avoids
      // showing (and then getting a 403 on) applications for other centers.
      const filter = { status: 'submitted' };
      if (user.role === 'gatc' && user.gatcId) {
        filter.gatcId = user.gatcId;
      }

      // MERGE FIX: listApplications() already returns the unwrapped array
      // (see applicationService.js), not an axios response to dig into.
      const [applicationsResult, usersRes] = await Promise.all([
        listApplications(filter),
        api.get('/users', { params: { role: 'lmo' } }),
      ]);
      setApplications(applicationsResult || []);
      setLmoOptions(usersRes.data.data.users || []);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssigned = (updatedApplication) => {
    // The assigned application moves out of 'submitted' — drop it from this list.
    setApplications((prev) => prev.filter((a) => a._id !== updatedApplication._id));
  };

  if (loading) return <p className="text-gray-500">Loading pending applications…</p>;
  if (errorMsg) return <p className="text-red-600">{errorMsg}</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Pending Allocation</h1>

      {applications.length === 0 ? (
        <p className="text-gray-500">No submitted applications awaiting allocation.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Application #</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Preferred GATC</th>
                <th className="text-left px-4 py-2">Submitted</th>
                <th className="text-left px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} className="border-t">
                  <td className="px-4 py-2">{app.applicationNumber}</td>
                  <td className="px-4 py-2">{app.type.replace('_', ' ')}</td>
                  <td className="px-4 py-2">{app.preferredGatcId?.name || '—'}</td>
                  <td className="px-4 py-2">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setAssigningApp(app)}
                      className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                    >
                      Assign to LMO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assigningApp && (
        <AssignModal
          application={assigningApp}
          lmoOptions={lmoOptions}
          onClose={() => setAssigningApp(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}
