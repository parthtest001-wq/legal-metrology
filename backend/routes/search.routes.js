/**
 * Module 6 — /backend/routes/search.routes.js
 * Mounted at /api/v1/search by routes/index.js (Section 4).
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { search, exportSearch } = require('../controllers/search.controller');

router.get('/', authenticate, search);
router.get('/export', authenticate, authorize('admin', 'gatc'), exportSearch);

module.exports = router;
