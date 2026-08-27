const express = require('express');
const cors = require('cors');
const path = require('path');

const { PORT, NODE_ENV } = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes/index');
const errorMiddleware = require('./middleware/error.middleware');
const { registerCronJobs } = require('./utils/cronJobs'); // Module 5

const app = express();

// --- Core middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static serving for server-generated certificate assets (QR codes / PDFs).
// Instrument photos, application documents, and verification photos are no
// longer written here — they upload straight to Cloudinary (see
// middleware/upload.middleware.js) so they survive Render redeploys.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', env: NODE_ENV }, message: 'OK', error: null });
});

// --- API routes (single mount point per Section 10) ---
app.use('/api/v1', routes);

// --- 404 fallback ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Route not found',
    error: { code: 'NOT_FOUND', details: null },
  });
});

// --- Centralized error handler — MUST be registered last ---
app.use(errorMiddleware);

async function start() {
  await connectDB(); // the ONLY mongoose.connect call in the codebase
  // MERGE ADDITION: Module 5's daily expiry-check cron job was built and
  // exported (registerCronJobs) but never wired up anywhere — no module
  // owns server.js, so nothing called it. Module 5's own deliverables doc
  // flags this exact line as required at merge time. Without it, expiry
  // alerts only ever fire via the manual POST /api/v1/alerts/trigger-check
  // endpoint, never automatically.
  registerCronJobs();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Listening on port ${PORT} (${NODE_ENV})`);
  });
}

start();

module.exports = app;
