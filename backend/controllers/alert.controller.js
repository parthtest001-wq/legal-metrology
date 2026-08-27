/**
 * alert.controller.js
 * Owned by: Module 5
 *
 * Implements the Module 5 rows of Master Spec Section 4 exactly:
 *   GET   /api/v1/alerts
 *   PATCH /api/v1/alerts/:id/read
 *   GET   /api/v1/alerts/expiring-certificates
 *   POST  /api/v1/alerts/trigger-check
 *
 * Plus two additional endpoints NOT in the frozen Section 4 table, needed
 * for the "manage notification preferences" requirement. These are called
 * out clearly in this module's deliverables/assumptions doc:
 *   GET /api/v1/alerts/preferences
 *   PUT /api/v1/alerts/preferences
 *
 * All responses use the standard envelope from utils/apiResponse.js.
 * Controllers never res.json() directly and never write their own
 * try/catch-and-format logic — errors go through next(err) to the shared
 * error.middleware.js.
 */

const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const Certificate = require('../models/Certificate'); // Module 4, read-only
const User = require('../models/User'); // Module 1, read-only
const { success } = require('../utils/apiResponse');
const { runExpiryCheck } = require('../utils/cronJobs');
const { CERTIFICATE_STATUS } = require('../../shared/constants');

/**
 * GET /api/v1/alerts
 * Any authenticated user — returns their own notifications.
 * Query: isRead?, type?
 */
async function getAlerts(req, res, next) {
  try {
    const filter = { userId: req.user.id };
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
    if (req.query.type) filter.type = req.query.type;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).lean();
    return success(res, { notifications }, 'Notifications fetched successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/alerts/:id/read
 * Owner only.
 */
async function markAsRead(req, res, next) {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notification) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      return next(err);
    }
    notification.isRead = true;
    await notification.save();
    return success(res, { notification }, 'Notification marked as read');
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/alerts/expiring-certificates
 * admin, gatc — query: withinDays?
 */
async function getExpiringCertificates(req, res, next) {
  try {
    const withinDays = Number(req.query.withinDays) || 30;
    const now = new Date();
    const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

    const filter = {
      status: CERTIFICATE_STATUS.ACTIVE,
      validUntil: { $gte: now, $lte: cutoff },
    };

    // gatc role only sees their own center's certificates
    if (req.user.role === 'gatc') {
      // MERGE FIX: req.user only carries { id, role, name } from the JWT
      // (Section 6) — req.user.gatcId was always undefined, so the populate
      // `match` below matched nothing and every gatc user always got an
      // empty list. Look the requester's own gatcId up from User.js first,
      // matching the pattern Modules 2/3/6 use for the same lookup.
      const requester = await User.findById(req.user.id).select('gatcId');
      const gatcId = requester ? requester.gatcId : null;

      // Certificate has no direct gatcId; join via issuedBy's gatcId is out
      // of scope for this read-only model — Module 4/6 own that join logic.
      // For a gatc-scoped view we filter by issuedBy belonging to a user
      // whose gatcId matches, resolved via a light populate.
      const certificates = await Certificate.find(filter)
        .populate({ path: 'issuedBy', select: 'gatcId', match: { gatcId } })
        .lean();
      const scoped = certificates.filter((c) => c.issuedBy);
      return success(res, { certificates: scoped }, 'Expiring certificates fetched successfully');
    }

    const certificates = await Certificate.find(filter).lean();
    return success(res, { certificates }, 'Expiring certificates fetched successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/alerts/trigger-check
 * admin only — manual trigger of the same logic the cron job runs daily.
 */
async function triggerCheck(req, res, next) {
  try {
    const notificationsCreated = await runExpiryCheck();
    return success(res, { notificationsCreated }, 'Expiry check completed');
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/alerts/preferences
 * Any authenticated user — returns their own preferences (creates defaults
 * on first read so the frontend always has something to render).
 *
 * NOTE: not in the frozen Section 4 table — see file header.
 */
async function getPreferences(req, res, next) {
  try {
    let prefs = await NotificationPreference.findOne({ userId: req.user.id });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId: req.user.id });
    }
    return success(res, { preferences: prefs }, 'Notification preferences fetched successfully');
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/alerts/preferences
 * Body: {emailEnabled?, smsEnabled?, inAppEnabled?}
 *
 * NOTE: not in the frozen Section 4 table — see file header.
 */
async function updatePreferences(req, res, next) {
  try {
    const { emailEnabled, smsEnabled, inAppEnabled } = req.body;
    const update = {};
    if (emailEnabled !== undefined) update.emailEnabled = Boolean(emailEnabled);
    if (smsEnabled !== undefined) update.smsEnabled = Boolean(smsEnabled);
    if (inAppEnabled !== undefined) update.inAppEnabled = Boolean(inAppEnabled);

    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId: req.user.id },
      { $set: update, $setOnInsert: { userId: req.user.id } },
      { new: true, upsert: true }
    );
    return success(res, { preferences: prefs }, 'Notification preferences updated successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAlerts,
  markAsRead,
  getExpiringCertificates,
  triggerCheck,
  getPreferences,
  updatePreferences,
};
