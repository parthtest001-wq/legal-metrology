/**
 * Notification.js
 * Owned by: Module 5 — Validity Tracking & Automated Alerts
 * Schema fields match Master Spec Section 3.7 EXACTLY. Do not add fields here —
 * if Module 5 needs more persisted data (e.g. delivery channel preferences),
 * it goes in a new file this module owns (see NotificationPreference.js).
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../../shared/constants');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPE), // expiry_alert | application_update | schedule_alert | general
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedEntityType: {
    type: String,
    enum: ['application', 'certificate', 'instrument'],
    default: null,
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Helpful for the daily cron job to avoid sending duplicate expiry reminders
// for the same certificate + day-bucket. Not a spec field — just an index.
notificationSchema.index({ relatedEntityType: 1, relatedEntityId: 1, type: 1, createdAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
