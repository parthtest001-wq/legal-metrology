/**
 * mailer.js
 * Owned by: Module 5
 *
 * Wraps nodemailer (per Master Spec Section 1). Runs in SANDBOX MODE by
 * default so the demo works with zero real SMTP credentials.
 *
 * Config flags (add to /backend/.env.example per Section 8 conventions):
 *   NOTIFY_SANDBOX=true        -> if true (or SMTP_USER/SMTP_PASS unset),
 *                                  emails are NOT sent; they are logged and
 *                                  pushed into an in-memory outbox instead.
 *   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS -> already declared in
 *                                  Section 8's .env.example; reused as-is.
 */

const nodemailer = require('nodemailer');

const SANDBOX_MODE =
  String(process.env.NOTIFY_SANDBOX || 'true').toLowerCase() === 'true' ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS;

// In-memory outbox so the demo/tests can assert "an email would have been sent"
// without any external dependency. Cleared on process restart.
const sandboxOutbox = [];

let transporter = null;
function getTransporter() {
  if (SANDBOX_MODE) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * sendEmail
 * @param {{to: string, subject: string, text: string, html?: string}} opts
 * @returns {Promise<{sent: boolean, sandbox: boolean, messageId?: string}>}
 */
async function sendEmail({ to, subject, text, html }) {
  if (SANDBOX_MODE) {
    const record = { to, subject, text, html, sentAt: new Date().toISOString() };
    sandboxOutbox.push(record);
    // eslint-disable-next-line no-console
    console.log(`[mailer:SANDBOX] Would send email to ${to} — "${subject}"`);
    return { sent: false, sandbox: true };
  }

  const tx = getTransporter();
  const info = await tx.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return { sent: true, sandbox: false, messageId: info.messageId };
}

function getSandboxOutbox() {
  return sandboxOutbox;
}

module.exports = { sendEmail, getSandboxOutbox, SANDBOX_MODE };
