import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// --- Module 7 addition: PWA service worker registration ---
// MERGE NOTE: this was documented by Module 7 as a required additive change
// to this shared file but had never actually been applied anywhere — without
// it, /src/service-worker.js (however correctly it's emitted to dist root by
// the vite.config.js plugin) is never registered, so none of Module 7's
// offline caching or Background Sync ever activates in a real browser.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Registration failure (e.g. unsupported browser) is non-fatal —
      // the app still works online without offline caching.
    });
  });

  // Relay the service worker's Background Sync wake-up to the real sync
  // logic, which lives in offlineQueueService.js (kept in one place).
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SMI_TRY_SYNC') {
      import('./services/offlineQueueService').then((m) => m.trySyncQueue());
    }
  });
}
