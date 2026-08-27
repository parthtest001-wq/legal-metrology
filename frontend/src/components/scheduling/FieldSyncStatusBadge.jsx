/**
 * FieldSyncStatusBadge.jsx
 * Owned by: Module 7
 * Location matches Master Spec §9: components/scheduling/, namespaced Field*.jsx
 *
 * The "Sync/Offline status indicator" screen element from the brief. Shows
 * whether the device is online, how many inspections are queued locally,
 * and lets the LMO trigger a manual sync. Wraps offlineQueueService, which
 * this module also owns.
 */
import { useEffect, useState } from 'react';
import { registerAutoSync, trySyncQueue, getPendingCount } from '../../services/offlineQueueService';

export default function FieldSyncStatusBadge() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = registerAutoSync(({ online: isOnline, pendingCount: count }) => {
      setOnline(isOnline);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await trySyncQueue();
    setPendingCount(await getPendingCount());
    setSyncing(false);
  };

  return (
    <div
      className={`field-sync-status flex items-center gap-2 text-sm px-3 py-2 rounded ${
        online ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
      }`}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${online ? 'bg-green-500' : 'bg-amber-500'}`} />
      <span>{online ? 'Online' : 'Offline'}</span>
      {pendingCount > 0 && (
        <>
          <span>·</span>
          <span>{pendingCount} pending</span>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={!online || syncing}
            className="ml-auto underline disabled:no-underline disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </>
      )}
    </div>
  );
}
