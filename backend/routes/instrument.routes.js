// /backend/routes/instrument.routes.js
// Owned by Module 2. Mounted at /api/v1/instruments (see routes/index.js).

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadInstrumentPhotos } = require('../middleware/upload.middleware');
const { ROLES } = require('../../shared/constants');
const instrumentController = require('../controllers/instrument.controller');

const router = express.Router();

// POST /api/v1/instruments — consumer
router.post(
  '/',
  authenticate,
  authorize(ROLES.CONSUMER),
  uploadInstrumentPhotos,
  instrumentController.createInstrument
);

// GET /api/v1/instruments — consumer (own), admin, lmo
router.get(
  '/',
  authenticate,
  authorize(ROLES.CONSUMER, ROLES.ADMIN, ROLES.LMO),
  instrumentController.listInstruments
);

// GET /api/v1/instruments/:id — consumer (own), admin, lmo, gatc
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.CONSUMER, ROLES.ADMIN, ROLES.LMO, ROLES.GATC),
  instrumentController.getInstrument
);

module.exports = router;
