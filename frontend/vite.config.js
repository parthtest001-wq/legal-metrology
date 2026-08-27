import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

// MERGE ADDITION (Module 7): Vite doesn't process /src/service-worker.js by
// default (only /public is copied verbatim), but the Master Spec places the
// service worker under src/ per Section 2/9. This tiny, dependency-free
// plugin emits it to the dist root unbundled on build, exactly where a
// top-level service-worker scope needs it — no vite-plugin-pwa added, so
// Section 1's pinned dependency list is unchanged.
function copyServiceWorkerPlugin() {
  return {
    name: 'copy-field-service-worker',
    closeBundle() {
      copyFileSync(
        resolve(__dirname, 'src/service-worker.js'),
        resolve(__dirname, 'dist/service-worker.js')
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), copyServiceWorkerPlugin()],
  server: {
    port: 5173,
  },
});
