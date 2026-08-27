/**
 * FieldQueueList.jsx
 * Owned by: Module 7
 * Location matches Master Spec §9: components/scheduling/, namespaced Field*.jsx
 *
 * Renders the LMO's assigned-inspection queue from
 * GET /api/v1/scheduling/lmo/:lmoId/queue (Module 3, exposed via the
 * existing schedulingService.js — no new backend route, no new service file
 * beyond what Module 3 already owns).
 *
 * Offline-first: the last successful response is cached in localStorage so
 * the queue is still browsable with no connectivity; a banner explains the
 * data may be stale.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// MERGE FIX: was `import { getLmoQueue } from '../../services/schedulingService'`.
// schedulingService.js (Module 3) has no named exports — only a default
// export object — and the method returns the full response envelope
// ({ success, data: { applications }, message, error }), not a bare
// { applications } shape. Matches the pattern components/scheduling/MyQueue.jsx
// already uses correctly.
import schedulingService from '../../services/schedulingService';

const CACHE_KEY = 'smi_field_queue_cache';

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveCache(applications) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ applications, cachedAt: Date.now() })
    );
  } catch {
    /* storage full or unavailable — degrade silently, cache is best-effort */
  }
}

/** @param {{ lmoId: string, date?: string }} props */
export default function FieldQueueList({ lmoId, date }) {
  const [applications, setApplications] = useState([]);
  const [stale, setStale] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMsg('');
      const cache = loadCache();
      if (cache) {
        setApplications(cache.applications);
        setCachedAt(cache.cachedAt);
        setStale(true);
      }

      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      try {
        // MERGE FIX: unwrap result.data.applications, not `{ applications }`
        // destructured straight off the response.
        const result = await schedulingService.getLmoQueue(lmoId, { date });
        const fresh = result.data.applications;
        if (cancelled) return;
        setApplications(fresh);
        setStale(false);
        saveCache(fresh);
      } catch (err) {
        if (!cache) setErrorMsg('Could not load your queue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lmoId, date]);

  if (loading && applications.length === 0) return <p>Loading queue…</p>;
  if (errorMsg) return <p className="text-red-600">{errorMsg}</p>;

  return (
    <div className="field-queue-list">
      {stale && (
        <p className="text-amber-600 text-sm mb-2">
          Showing cached data{cachedAt ? ` from ${new Date(cachedAt).toLocaleString()}` : ''} — offline.
        </p>
      )}
      {applications.length === 0 ? (
        <p className="text-gray-500">No inspections assigned.</p>
      ) : (
        <ul className="divide-y">
          {applications.map((app) => (
            <li key={app._id} className="py-3">
              <Link to={`/lmo/field/${app._id}`} className="block">
                <div className="flex justify-between">
                  <span className="font-medium">{app.applicationNumber}</span>
                  <span className="text-sm text-gray-500">{app.status}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {app.instrumentId?.category} · {app.instrumentId?.make} {app.instrumentId?.model}
                </div>
                {app.scheduledDate && (
                  <div className="text-xs text-gray-400">
                    Scheduled: {new Date(app.scheduledDate).toLocaleString()}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
