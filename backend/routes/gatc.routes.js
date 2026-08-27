const express = require('express');
const { createGatc, listGatcs, approveGatc } = require('../controllers/gatc.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// POST /api/v1/gatc — admin
router.post('/', authenticate, authorize(ROLES.ADMIN), createGatc);

// GET /api/v1/gatc — admin, lmo, consumer
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.LMO, ROLES.CONSUMER), listGatcs);

// PATCH /api/v1/gatc/:id/approve — admin
router.patch('/:id/approve', authenticate, authorize(ROLES.ADMIN), approveGatc);

module.exports = router;
