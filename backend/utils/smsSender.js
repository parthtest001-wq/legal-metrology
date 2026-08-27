/**
 * smsSender.js
 * Owned by: Module 5
 *
 * NOTE: Master Spec Section 1 ("Notifications") only names nodemailer +
 * node-cron + the in-app Notification model — no SMS provider is part of
 * the frozen tech stack. Since the task requires an SMS toggle, this file
 * implements SMS as a MOCK-ONLY stub (no real provider, no credentials,
 * no new dependency added to package.json) so it never breaks the demo or
 * conflicts with Section 1. Swap the body of `sendSms` for a real provider
 * (Twilio, MSG91, etc.) post-hackathon if SMS becomes an actual requirement.
 *
 * Config flag:
 *   NOTIFY_SANDBOX=true -> logs + records to in-memory outbox instead of
 *                           attempting any real network call (there is no
 *                           real call path in this file regardless).
 */

const sandboxOutbox = [];

/**
 * sendSms
 * @param {{to: string, message: string}} opts
 * @returns {Promise<{sent: boolean, sandbox: boolean}>}
 */
async function sendSms({ to, message }) {
  const record = { to, message, sentAt: new Date().toISOString() };
  sandboxOutbox.push(record);
  // eslint-disable-next-line no-console
  console.log(`[smsSender:MOCK] Would SMS ${to}: "${message}"`);
  return { sent: false, sandbox: true };
}

function getSandboxOutbox() {
  return sandboxOutbox;
}

module.exports = { sendSms, getSandboxOutbox };
