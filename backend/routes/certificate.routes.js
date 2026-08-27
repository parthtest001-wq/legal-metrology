/**
 * routes/certificate.routes.js
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * All paths match Section 4 of the Master Spec exactly. Mounted once, at
 * `/api/v1/certificates`, from /backend/routes/index.js (additive edit —
 * see deliverables notes; index.js itself belongs to no single module).
 *
 * Uses the shared authenticate/authorize middleware from
 * /backend/middleware/auth.middleware.js — no custom JWT logic here.
 */

const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  generateCertificate,
  listMyCertificates,
  getCertificateById,
  downloadCertificatePdf,
  verifyCertificatePublic,
  revokeCertificate,
} = require('../controllers/certificate.controller');

// POST /api/v1/certificates/:applicationId/generate — lmo
router.post(
  '/:applicationId/generate',
  authenticate,
  authorize('lmo'),
  generateCertificate
);

// GET /api/v1/certificates/verify/:certificateNumber — PUBLIC
// NOTE: registered before '/:id' so 'verify' is never captured as an :id param.
router.get('/verify/:certificateNumber', verifyCertificatePublic);

// GET /api/v1/certificates — consumer (own), lmo (issued), gatc, admin
// ADDITIVE — not in the frozen Section 4 table. See controller comment on
// listMyCertificates for rationale. Registered before '/:id' for the same
// reason as 'verify' above (an empty path segment can't collide with :id,
// but keeping list/verify grouped together above the :id routes keeps
// intent obvious to future readers).
router.get(
  '/',
  authenticate,
  authorize('consumer', 'lmo', 'gatc', 'admin'),
  listMyCertificates
);

// GET /api/v1/certificates/:id — consumer (own), lmo, gatc, admin
router.get(
  '/:id',
  authenticate,
  authorize('consumer', 'lmo', 'gatc', 'admin'),
  getCertificateById
);

// GET /api/v1/certificates/:id/download — consumer (own), lmo, gatc, admin
router.get(
  '/:id/download',
  authenticate,
  authorize('consumer', 'lmo', 'gatc', 'admin'),
  downloadCertificatePdf
);

// PATCH /api/v1/certificates/:id/revoke — admin
router.patch(
  '/:id/revoke',
  authenticate,
  authorize('admin'),
  revokeCertificate
);

module.exports = router;
