/**
 * utils/qrGenerator.js
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Generates a QR code PNG file for a certificate and saves it under
 * /backend/uploads/certificates, per Section 2 folder structure.
 *
 * ASSUMPTION (documented — see deliverables notes):
 * Section 4 labels `GET /api/v1/certificates/verify/:certificateNumber` as
 * "the QR code target". We encode the FRONTEND verification page URL
 * (`${FRONTEND_URL}/verify/:certificateNumber`) rather than the raw API URL,
 * because a phone camera scanning a QR code that points straight at a JSON
 * API endpoint gives the end user an unreadable blob, not a verification
 * result. The frontend "Verify Certificate" page (public, no login) then
 * calls that exact API endpoint on load. This preserves the documented
 * endpoint as the actual source of truth for verification while making the
 * QR code usable by a real person. No new env var is needed since
 * FRONTEND_URL already exists in /backend/.env.example.
 */

const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const UPLOAD_SUBDIR = path.join(__dirname, '..', 'uploads', 'certificates');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_SUBDIR)) {
    fs.mkdirSync(UPLOAD_SUBDIR, { recursive: true });
  }
}

/**
 * Generates a QR code PNG encoding the public verification URL for a
 * certificate, saves it to disk, and returns the relative URL to store on
 * the Certificate document's `qrCodeUrl` field.
 *
 * @param {string} certificateNumber e.g. "CERT-2026-000123"
 * @returns {Promise<string>} relative URL, e.g. "/uploads/certificates/CERT-2026-000123-qr.png"
 */
async function generateCertificateQr(certificateNumber) {
  ensureUploadDir();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify/${certificateNumber}`;

  const fileName = `${certificateNumber}-qr.png`;
  const filePath = path.join(UPLOAD_SUBDIR, fileName);

  await QRCode.toFile(filePath, verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
  });

  // Relative URL served statically by server.js (see server.js snippet in
  // deliverables notes: app.use('/uploads', express.static(...)))
  return `/uploads/certificates/${fileName}`;
}

/**
 * Absolute disk path for a given relative /uploads/certificates/... URL.
 * Used internally by pdfGenerator.js to embed the QR image in the PDF.
 */
function absolutePathFromUrl(relativeUrl) {
  const fileName = path.basename(relativeUrl);
  return path.join(UPLOAD_SUBDIR, fileName);
}

module.exports = { generateCertificateQr, absolutePathFromUrl, UPLOAD_SUBDIR };
