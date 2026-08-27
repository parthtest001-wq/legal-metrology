const express = require('express');
const { updateUser, listUsers, setUserStatus } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { ROLES } = require('../../shared/constants');

const router = express.Router();

// PUT /api/v1/users/:id — self or admin (self-check happens in controller)
router.put('/:id', authenticate, updateUser);

// GET /api/v1/users — admin
// MERGE FIX (Section 10 integration pass): Section 4's table lists this route
// as "admin" only, but Module 3's Allocation UI (AllocationList.jsx) calls
// GET /api/v1/users?role=lmo to populate the "assign to LMO" dropdown for
// BOTH admin and gatc users (the assign endpoint itself is authorize('gatc',
// 'admin')). With the frozen admin-only restriction, every gatc user hit a
// 403 the moment they tried to load the Allocation page. Extended to admin +
// gatc; a gatc caller only ever needs the role=lmo listing for this flow.
// Flag this for the master-spec Section 4 table update.
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.GATC), listUsers);

// PATCH /api/v1/users/:id/status — admin
router.patch('/:id/status', authenticate, authorize(ROLES.ADMIN), setUserStatus);

module.exports = router;
