// /backend/routes/index.js
// Mounted once in server.js as `app.use('/api/v1', routes)`.
// Each module's route file is mounted exactly once, at the prefix in
// Master Spec Section 4. Edited additively across all 7 module merges —
// no module's mount line was overwritten by another's.

const express = require('express');

const authRoutes = require('./auth.routes');           // Module 1
const userRoutes = require('./user.routes');            // Module 1
const gatcRoutes = require('./gatc.routes');             // Module 1
const instrumentRoutes = require('./instrument.routes'); // Module 2
const applicationRoutes = require('./application.routes'); // Module 2
const schedulingRoutes = require('./scheduling.routes'); // Module 3
const verificationRoutes = require('./verification.routes'); // Module 3
const certificateRoutes = require('./certificate.routes'); // Module 4
const alertRoutes = require('./alert.routes');           // Module 5
const dashboardRoutes = require('./dashboard.routes');   // Module 6
const searchRoutes = require('./search.routes');         // Module 6
// Module 7 adds no backend routes — frontend/PWA only.

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/gatc', gatcRoutes);
router.use('/instruments', instrumentRoutes);
router.use('/applications', applicationRoutes);
router.use('/scheduling', schedulingRoutes);
router.use('/verification', verificationRoutes);
router.use('/certificates', certificateRoutes);
router.use('/alerts', alertRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/search', searchRoutes);

module.exports = router;
