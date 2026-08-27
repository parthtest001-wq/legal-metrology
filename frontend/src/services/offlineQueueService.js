/**
 * offlineQueueService.js
 * Owned by: Module 7 (Mobile / Field Verification App)
 *
 * New file added inside the existing /frontend/src/services folder, per the
 * Master Spec rule: "If a module needs something not in this spec, it must
 * add it to a new file the module owns, not modify a shared file."
 *
 * Provides an IndexedDB-backed queue for inspection submissions captured
 * while offline (POST /api/v1/verification/:applicationId), so LMOs can keep
 * working at low/no-connectivity sites and have submissions replay
 * automatically once the device reconnects.
 *
 * No shared file (api.js, AuthContext.jsx, any *.controller.js, any model)
 * is modified. This file only calls schedulingService.submitVerification,
 * which is the existing Module 3 service function that hits
 * POST /api/v1/verification/:applicationId.
 */

// MERGE FIX: was `import { submitVerification } from './schedulingService'`.
// Module 3's schedulingService.js has no named `submitVerification` export —
// it's a default-exported object whose method is `recordVerification`, with
// a single options-object signature `(applicationId, { inspectionDate,
// observations, overallResult, remarks, photos })`, not three positional
// args. Both the import and the call below were fixed to match.
import schedulingService from './schedulingService';

const DB_NAME = 'smi_field_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_inspections';

/** @typedef {'pending'|'syncing'|'failed'} QueueItemStatus */

/**
 * @typedef {Object} QueueItem
 * @property {number} id - autoincrement key
 * @property {string} applicationId
 * @property {Object} payload - { inspectionDate, observations, overallResult, remarks }
 * @property {{name:string, type:string, dataUrl:string}[]} photos - base64-encoded photos
 * @property {QueueItemStatus} status
 * @property {number} attempts
 * @property {string} lastError
 * @property {number} createdAt
 */

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('applicationId', 'applicationId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

/** Convert a File (camera capture) to a base64 data URL for IndexedDB storage. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convert a stored base64 data URL back into a File for multipart upload. */
function dataUrlToFile(dataUrl, filename, mimeType) {
  const arr = dataUrl.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mimeType });
}

/**
 * Add a completed inspection form to the offline queue.
 * @param {string} applicationId
 * @param {Object} payload - { inspectionDate, observations, overallResult, remarks }
 * @param {{name:string, type:string, dataUrl:string}[]} photos
 */
export async function enqueueInspection(applicationId, payload, photos = []) {
  const item = {
    applicationId,
    payload,
    photos,
    status: /** @type {QueueItemStatus} */ ('pending'),
    attempts: 0,
    lastError: null,
    createdAt: Date.now(),
  };
  return withStore('readwrite', (store) => store.add(item));
}

/** Return all queued items, newest first. */
export async function getQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.createdAt - a.createdAt));
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingCount() {
  const all = await getQueue();
  return all.filter((i) => i.status === 'pending' || i.status === 'failed').length;
}

async function updateItem(id, patch) {
  return withStore('readwrite', (store) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing) store.put({ ...existing, ...patch });
    };
  });
}

async function removeItem(id) {
  return withStore('readwrite', (store) => store.delete(id));
}

/**
 * Attempt to replay every pending/failed item against the real API.
 * Safe to call repeatedly (e.g. on 'online' event, on an interval, or via a
 * manual "Sync now" button) — items already mid-flight are skipped.
 * @param {(queue: QueueItem[]) => void} [onProgress] - called after each item resolves
 */
export async function trySyncQueue(onProgress) {
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  const queue = await getQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.status === 'syncing') continue;
    await updateItem(item.id, { status: 'syncing' });

    try {
      const files = item.photos.map((p) => dataUrlToFile(p.dataUrl, p.name, p.type));
      // MERGE FIX: schedulingService.recordVerification takes one options
      // object (item.payload's fields plus `photos`), not positional args.
      await schedulingService.recordVerification(item.applicationId, {
        ...item.payload,
        photos: files,
      });
      await removeItem(item.id);
      synced += 1;
    } catch (err) {
      failed += 1;
      await updateItem(item.id, {
        status: 'failed',
        attempts: item.attempts + 1,
        lastError: err?.message || 'Sync failed',
      });
    }

    if (onProgress) onProgress(await getQueue());
  }

  return { synced, failed };
}

/**
 * Wire up automatic sync attempts: on regaining connectivity and on a
 * background interval (in case 'online' fires before the API is truly
 * reachable). Returns an unsubscribe function.
 * @param {(status: {online: boolean, pendingCount: number}) => void} onStatusChange
 */
export function registerAutoSync(onStatusChange) {
  const emit = async () => {
    const pendingCount = await getPendingCount();
    onStatusChange({ online: navigator.onLine, pendingCount });
  };

  const handleOnline = async () => {
    await emit();
    await trySyncQueue(emit);
    await emit();
  };
  const handleOffline = () => emit();

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  const intervalId = window.setInterval(() => {
    if (navigator.onLine) handleOnline();
  }, 60_000);

  emit();

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    window.clearInterval(intervalId);
  };
}
