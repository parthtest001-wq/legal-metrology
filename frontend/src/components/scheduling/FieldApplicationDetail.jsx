/**
 * FieldApplicationDetail.jsx
 * Owned by: Module 7
 * Location matches Master Spec §9: components/scheduling/, namespaced Field*.jsx
 *
 * "Inspection Detail" screen content. Fetches the application via the
 * existing applicationService.getApplication (GET /api/v1/applications/:id,
 * owned by Module 2) and shows instrument + applicant context before the LMO
 * opens the Record Observation form. Caches the last-viewed application in
 * localStorage for offline viewing, same pattern as FieldQueueList.
 */
import { useEffect, useState } from 'react';
// MERGE FIX: was `import { getApplicationById } from '../../services/applicationService'`.
// Module 2's applicationService.js exports `getApplication` (no "ById"
// suffix), and it already returns the unwrapped application object directly
// — not `{ application }`. Both the import name and the destructuring below
// were wrong.
import { getApplication } from '../../services/applicationService';

const cacheKey = (id) => `smi_field_application_cache_${id}`;

/** @param {{ applicationId: string, children?: React.ReactNode }} props */
export default function FieldApplicationDetail({ applicationId, children }) {
  const [application, setApplication] = useState(null);
  const [stale, setStale] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = localStorage.getItem(cacheKey(applicationId));
      if (cached) {
        setApplication(JSON.parse(cached));
        setStale(true);
      }

      if (!navigator.onLine) return;

      try {
        // MERGE FIX: getApplication() already returns the application
        // object itself, not `{ application }`.
        const fresh = await getApplication(applicationId);
        if (cancelled) return;
        setApplication(fresh);
        setStale(false);
        localStorage.setItem(cacheKey(applicationId), JSON.stringify(fresh));
      } catch {
        if (!cached) setErrorMsg('Could not load this application.');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (errorMsg) return <p className="text-red-600">{errorMsg}</p>;
  if (!application) return <p>Loading application…</p>;

  const { applicationNumber, type, status, scheduledDate, instrumentId, applicantId } = application;

  return (
    <div className="field-application-detail space-y-3">
      {stale && (
        <p className="text-amber-600 text-sm">Showing cached details — offline.</p>
      )}
      <div>
        <h2 className="text-lg font-semibold">{applicationNumber}</h2>
        <p className="text-sm text-gray-500">{type} · status: {status}</p>
        {scheduledDate && (
          <p className="text-sm text-gray-500">
            Scheduled: {new Date(scheduledDate).toLocaleString()}
          </p>
        )}
      </div>

      {instrumentId && (
        <div className="border rounded p-3">
          <h3 className="font-medium mb-1">Instrument</h3>
          <p className="text-sm">{instrumentId.category} — {instrumentId.make} {instrumentId.model}</p>
          <p className="text-sm text-gray-500">Serial: {instrumentId.serialNumber}</p>
          {instrumentId.capacity && (
            <p className="text-sm text-gray-500">
              Capacity: {instrumentId.capacity} {instrumentId.unit}
            </p>
          )}
        </div>
      )}

      {applicantId && (
        <div className="border rounded p-3">
          <h3 className="font-medium mb-1">Applicant</h3>
          <p className="text-sm">{applicantId.name}</p>
          <p className="text-sm text-gray-500">{applicantId.phone}</p>
        </div>
      )}

      {children}
    </div>
  );
}
