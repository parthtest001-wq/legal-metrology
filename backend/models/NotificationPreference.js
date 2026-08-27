/**
 * NotificationPreference.js
 * Owned by: Module 5 — Validity Tracking & Automated Alerts
 *
 * NOT part of Master Spec Section 3 — the frozen spec's Notification model
 * (3.7) has no delivery-channel toggle fields, and no other module owns
 * "preferences". Per Section 9 ("if a module needs something not in this
 * spec, it must add it to a new file the module owns"), this is a new
 * file/collection that only Module 5 creates and only Module 5 writes to.
 * It does NOT modify User.js or Notification.js.
 */

const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  emailEnabled: {
    type: Boolean,
    default: true,
  },
  smsEnabled: {
    type: Boolean,
    default: false,
  },
  inAppEnabled: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

notificationPreferenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
