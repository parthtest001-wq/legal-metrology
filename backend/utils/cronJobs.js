/**
 * cronJobs.js
 * Owned by: Module 5
 *
 * Daily job: scans Certificate (owned by Module 4, imported read-only —
 * this file never redefines or writes new fields onto it) for certificates
 * whose validUntil falls at one of the reminder thresholds, and creates a
 * Notification (+ dispatches email/SMS per the user's NotificationPreference)
 * for the certificate's owner.
 *
 * Reminder thresholds are fixed for the hackathon demo: 30 / 15 / 7 / 0 days.
 * Runs once daily at 06:00 server time. Also exported as a plain function so
 * POST /api/v1/alerts/trigger-check (admin) can run it on demand.
 */

const cron = require('node-cron');
const Certificate = require('../models/Certificate'); // Module 4 — read-only import
const Instrument = require('../models/Instrument'); // Module 2 — read-only import
const User = require('../models/User'); // Module 1 — read-only import
const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const { sendEmail } = require('./mailer');
const { sendSms } = require('./smsSender');
const { NOTIFICATION_TYPE, CERTIFICATE_STATUS } = require('../../shared/constants');

const REMINDER_THRESHOLDS_DAYS = [30, 15, 7, 0];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(a, b) {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
}

/**
 * Has a notification already been created for this certificate at this
 * specific threshold? We tag the title with the threshold so we can check
 * without adding any new field to Notification.js.
 */
async function alreadyNotified(certificateId, thresholdDays) {
  const tag = thresholdLabel(thresholdDays);
  const existing = await Notification.findOne({
    relatedEntityType: 'certificate',
    relatedEntityId: certificateId,
    type: NOTIFICATION_TYPE.EXPIRY_ALERT,
    title: tag,
  }).lean();
  return Boolean(existing);
}

function thresholdLabel(thresholdDays) {
  return thresholdDays === 0
    ? 'Certificate Expired'
    : `Certificate Expiring in ${thresholdDays} Days`;
}

async function dispatchForUser(user, notification) {
  let prefs = await NotificationPreference.findOne({ userId: user._id }).lean();
  if (!prefs) {
    prefs = { emailEnabled: true, smsEnabled: false, inAppEnabled: true };
  }

  // in-app: the Notification doc itself already satisfies this (created by caller)
  if (prefs.emailEnabled && user.email) {
    await sendEmail({
      to: user.email,
      subject: notification.title,
      text: notification.message,
    });
  }
  if (prefs.smsEnabled && user.phone) {
    await sendSms({ to: user.phone, message: `${notification.title}: ${notification.message}` });
  }
}

/**
 * Core scan — creates Notification docs for every (certificate, threshold)
 * pair due today that hasn't already been notified. Returns count created.
 */
async function runExpiryCheck() {
  const now = new Date();
  let created = 0;

  const activeCerts = await Certificate.find({ status: CERTIFICATE_STATUS.ACTIVE }).lean();

  for (const cert of activeCerts) {
    const daysLeft = daysBetween(new Date(cert.validUntil), now);

    // If daysLeft has just crossed a threshold (or gone negative for the
    // "expired" bucket), fire that threshold's reminder exactly once.
    for (const threshold of REMINDER_THRESHOLDS_DAYS) {
      const isDue = threshold === 0 ? daysLeft <= 0 : daysLeft === threshold;
      if (!isDue) continue;

      // eslint-disable-next-line no-await-in-loop
      if (await alreadyNotified(cert._id, threshold)) continue;

      // eslint-disable-next-line no-await-in-loop
      const instrument = await Instrument.findById(cert.instrumentId).lean();
      // eslint-disable-next-line no-await-in-loop
      const owner = instrument ? await User.findById(instrument.ownerId).lean() : null;
      if (!owner) continue;

      const title = thresholdLabel(threshold);
      const message =
        threshold === 0
          ? `Certificate ${cert.certificateNumber} has expired. Please apply for re-verification.`
          : `Certificate ${cert.certificateNumber} expires on ${new Date(
              cert.validUntil
            ).toDateString()} (${threshold} day(s) from now). Please schedule re-verification.`;

      // eslint-disable-next-line no-await-in-loop
      const notification = await Notification.create({
        userId: owner._id,
        type: NOTIFICATION_TYPE.EXPIRY_ALERT,
        title,
        message,
        relatedEntityType: 'certificate',
        relatedEntityId: cert._id,
      });

      // eslint-disable-next-line no-await-in-loop
      await dispatchForUser(owner, notification);
      created += 1;
    }
  }

  return created;
}

/**
 * Registers the daily cron job. Called once from server.js at boot.
 * Schedule: 06:00 every day, server-local time.
 */
function registerCronJobs() {
  cron.schedule('0 6 * * *', async () => {
    try {
      const created = await runExpiryCheck();
      // eslint-disable-next-line no-console
      console.log(`[cronJobs] Daily expiry check complete — ${created} notification(s) created.`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cronJobs] Daily expiry check failed:', err);
    }
  });
}

module.exports = { registerCronJobs, runExpiryCheck, REMINDER_THRESHOLDS_DAYS };
