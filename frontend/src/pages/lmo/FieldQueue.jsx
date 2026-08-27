/**
 * pages/lmo/FieldQueue.jsx
 * Owned by: Module 7
 *
 * NOTE ON PLACEMENT: Master Spec §9's boundary list for Module 7 names only
 * components/manifest/service-worker/vite.config as "Creates". It does not
 * explicitly list a pages/ addition. However §2's folder structure already
 * gives every role a /pages/<role> folder, and the brief for this build asks
 * for routable "Core screens" (My Queue, Inspection Detail, Record
 * Observation). Adding thin page files under the existing pages/lmo/ folder
 * — which only compose the Field* components above — stays inside the
 * frozen folder tree and invents no new top-level folder or shared file.
 * This is called out explicitly in the Assumptions section of this
 * deliverable.
 */
// MERGE FIX: was `import { useContext } from 'react'; import AuthContext
// from '../../context/AuthContext'; useContext(AuthContext)`. Module 1's
// AuthContext.jsx has no default export — the context object itself is a
// module-local const; only `AuthProvider` and `useAuth` are exported. The
// default import resolved to `undefined`, and useContext(undefined) throws
// at render time. Switched to the same `useAuth()` hook every other module
// (1, 3, 6) already uses correctly.
import { useAuth } from '../../context/AuthContext';
import FieldQueueList from '../../components/scheduling/FieldQueueList';
import FieldSyncStatusBadge from '../../components/scheduling/FieldSyncStatusBadge';

export default function FieldQueue() {
  const { user } = useAuth();

  return (
    <div className="field-queue-page max-w-2xl mx-auto p-4 space-y-4">
      <FieldSyncStatusBadge />
      <h1 className="text-xl font-semibold">My Queue</h1>
      {user && <FieldQueueList lmoId={user.id} />}
    </div>
  );
}
