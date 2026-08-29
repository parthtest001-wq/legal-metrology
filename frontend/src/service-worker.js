/**
 * service-worker.js
 * Owned by: Module 7
 * Location matches Master Spec §9: /frontend/src/service-worker.js
 *
 * Responsibilities:
 *  1. Cache the built app shell (JS/CSS/HTML) at install time so the PWA is
 *     installable and opens offline.
 *  2. Network-first, cache-fallback for GET /api/v1/* reads (queue list,
 *     application detail) so an LMO can reopen a previously-viewed screen
 *     with no signal.
 *  3. Never intercept or cache non-GET requests (POST /api/v1/verification,
 *     login, etc.) — those are handled by offlineQueueService.js in-page,
 *     not by the service worker, keeping this file simple and avoiding any
 *     divergence from the API Contract (§4) response envelope (§5).
 *
 * This file does not touch server.js, any route file, or any controller —
 * it only runs in the browser.
 */

const CACHE_VERSION = 'smi-field-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Vite emits hashed asset filenames at build time; the build step should
// inject the generated list here (e.g. via a small plugin) or this file can
// rely on runtime caching only. Precaching the shell entry points below is
// the minimum needed for "Add to Home Screen" + offline shell.
const APP_SHELL_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .catch((err) => {
        // If precaching fails (e.g. offline at the exact moment the SW
        // registers), don't let it silently abort installation — log it so
        // it's at least visible in DevTools, and let skipWaiting proceed so
        // the SW can still activate and try caching on subsequent fetches.
        console.error('[service-worker] App shell precache failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('smi-field-') && key !== APP_SHELL_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isApiGet(request) {
  return request.method === 'GET' && new URL(request.url).pathname.startsWith('/api/v1/');
}

function isAppShellRequest(request) {
  return request.method === 'GET' && request.mode === 'navigate';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever cache-manage GET requests. All POST/PATCH/PUT (including the
  // verification submission) pass straight through to the network; failures
  // there are handled by offlineQueueService.js, not this file.
  if (request.method !== 'GET') return;

  if (isApiGet(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (isAppShellRequest(request)) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches
      .match(request)
      .then((cached) => cached || fetch(request))
      .catch(() => {
        // Neither a cached copy nor the network came through — this is the
        // gap that produced the unhandled "TypeError: Failed to fetch".
        // There's nothing meaningful to serve for an arbitrary static
        // asset here, so respond with a real (if empty) Response instead
        // of letting the fetch handler's promise reject.
        return new Response('', { status: 504, statusText: 'Offline and not cached' });
      })
  );
});

// Optional: if the browser supports Background Sync, ask to be woken up on
// reconnect. The page itself (offlineQueueService.registerAutoSync) already
// covers this via the 'online' event + a 60s interval while the app is
// open, so this is a best-effort enhancement for when the PWA is closed.
self.addEventListener('sync', (event) => {
  if (event.tag === 'smi-field-sync-inspections') {
    // The service worker cannot access IndexedDB app logic directly here
    // without duplicating offlineQueueService; instead it notifies any open
    // client to run the real sync, keeping the sync logic in one place.
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SMI_TRY_SYNC' }));
      })
    );
  }
});
