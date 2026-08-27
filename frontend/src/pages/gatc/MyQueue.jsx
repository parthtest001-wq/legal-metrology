// /frontend/src/pages/gatc/MyQueue.jsx
// Owned by Module 3.
//
// NOTE: The API Contract (Section 4) only defines a queue endpoint scoped to
// a single LMO (`GET /scheduling/lmo/:lmoId/queue`) — there is no GATC-scoped
// queue route in Module 3's contract, and Module 3 may not invent one outside
// this spec. A GATC's "queue" is therefore assembled here from Module 2's
// existing `GET /api/v1/applications?gatcId=&status=` endpoint, which already
// supports "gatc (own center)" as an authorized caller.

import { useEffect, useState } from 'react';
// MERGE FIX: same applicationService import/method-name/return-shape bug as
// components/scheduling/AllocationList.jsx — see that file's merge-fix note.
import { listApplications } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';
import StatusTimeline from '../../components/scheduling/StatusTimeline';

export default function GatcMyQueuePage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        // MERGE FIX: listApplications() already returns the unwrapped array.
        const result = await listApplications({
          gatcId: user.gatcId,
          status: 'scheduled',
        });
        setApplications(result || []);
      } catch (err) {
        setErrorMsg(err?.response?.data?.message || 'Failed to load center queue.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.gatcId]);

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (errorMsg) return <div className="p-6 text-red-600">{errorMsg}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Center Inspection Queue</h1>
      {applications.length === 0 && <p className="text-gray-500">Nothing scheduled.</p>}
      {applications.map((app) => (
        <div key={app._id} className="border rounded p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{app.applicationNumber}</span>
            <span className="text-gray-500">
              LMO: {app.assignedLmoId?.name || 'Unassigned'}
            </span>
          </div>
          <StatusTimeline status={app.status} />
        </div>
      ))}
    </div>
  );
}
