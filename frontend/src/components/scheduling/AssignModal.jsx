// /frontend/src/components/scheduling/AssignModal.jsx
// Owned by Module 3.

import { useState } from 'react';
import schedulingService from '../../services/schedulingService';

/**
 * Props:
 *  - application: the Application document being assigned
 *  - lmoOptions: [{ _id, name, officerCode }] — list of LMO users to assign to
 *    (fetched by the parent page via GET /api/v1/users?role=lmo, owned by Module 1)
 *  - onClose: () => void
 *  - onAssigned: (updatedApplication) => void
 */
export default function AssignModal({ application, lmoOptions, onClose, onAssigned }) {
  const [assignedLmoId, setAssignedLmoId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedLmoId || !scheduledDate) {
      setErrorMsg('Please select an LMO and a scheduled date.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const result = await schedulingService.assignApplication(application._id, {
        assignedLmoId,
        scheduledDate,
      });
      if (result.success) {
        onAssigned(result.data.application);
        onClose();
      } else {
        setErrorMsg(result.message || 'Assignment failed.');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Assignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-1">Assign Application</h2>
        <p className="text-sm text-gray-500 mb-4">
          {application.applicationNumber} — {application.type.replace('_', ' ')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assign to LMO</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={assignedLmoId}
              onChange={(e) => setAssignedLmoId(e.target.value)}
            >
              <option value="">Select an LMO…</option>
              {lmoOptions.map((lmo) => (
                <option key={lmo._id} value={lmo._id}>
                  {lmo.name} {lmo.officerCode ? `(${lmo.officerCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scheduled Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border text-gray-700"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
