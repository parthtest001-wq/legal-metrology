/**
 * utils/pdfGenerator.js
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Renders a printable certificate PDF (instrument details, applicant,
 * LMO/GATC, validity dates, embedded QR code image) and saves it under
 * /backend/uploads/certificates, per Section 2 folder structure.
 *
 * Expects fully-populated Mongoose documents (application, instrument,
 * verificationRecord, lmoUser, gatc, certificate) so it never has to query
 * models it does not own — the controller is responsible for populate().
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { UPLOAD_SUBDIR, absolutePathFromUrl } = require('./qrGenerator');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_SUBDIR)) {
    fs.mkdirSync(UPLOAD_SUBDIR, { recursive: true });
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * @param {Object} ctx
 * @param {Object} ctx.certificate   Certificate doc (has certificateNumber, issueDate, validUntil, qrCodeUrl)
 * @param {Object} ctx.application   Application doc (has applicationNumber)
 * @param {Object} ctx.instrument    Instrument doc (category, make, model, serialNumber, registrationNumber, unit, capacity)
 * @param {Object} ctx.applicant     User doc (name, address, state, district) — the consumer who owns the instrument
 * @param {Object} ctx.verificationRecord VerificationRecord doc (inspectionDate, overallResult, remarks)
 * @param {Object} ctx.lmoUser       User doc (name, officerCode) — who issued the certificate
 * @param {Object} ctx.gatc          GATC doc (name, registrationNumber, address)
 * @returns {Promise<string>} relative URL to the saved PDF, e.g. "/uploads/certificates/CERT-2026-000123.pdf"
 */
function generateCertificatePdf(ctx) {
  const { certificate, application, instrument, applicant, verificationRecord, lmoUser, gatc } = ctx;

  ensureUploadDir();

  const fileName = `${certificate.certificateNumber}.pdf`;
  const filePath = path.join(UPLOAD_SUBDIR, fileName);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // ---- Header ----
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF VERIFICATION', { align: 'center' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Legal Metrology Act, 2009 — Online Verification System', { align: 'center' });
      doc.moveDown(1.5);

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Certificate No: ${certificate.certificateNumber}`, { align: 'center' });
      doc.moveDown(1.5);

      // ---- Instrument details ----
      doc.font('Helvetica-Bold').fontSize(12).text('Instrument Details');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Category: ${instrument.category}`);
      doc.text(`Make / Model: ${instrument.make} / ${instrument.model}`);
      doc.text(`Serial Number: ${instrument.serialNumber}`);
      if (instrument.registrationNumber) {
        doc.text(`Registration Number: ${instrument.registrationNumber}`);
      }
      if (instrument.capacity != null) {
        doc.text(`Capacity: ${instrument.capacity} ${instrument.unit || ''}`);
      }
      doc.moveDown(1);

      // ---- Applicant details ----
      doc.font('Helvetica-Bold').fontSize(12).text('Applicant / Owner Details');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Name: ${applicant.name}`);
      if (applicant.address) doc.text(`Address: ${applicant.address}`);
      doc.text(`State / District: ${applicant.state} / ${applicant.district}`);
      doc.text(`Application No: ${application.applicationNumber}`);
      doc.moveDown(1);

      // ---- Verification / LMO / GATC details ----
      doc.font('Helvetica-Bold').fontSize(12).text('Verification Details');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Inspection Date: ${formatDate(verificationRecord.inspectionDate)}`);
      doc.text(`Result: ${verificationRecord.overallResult.toUpperCase()}`);
      doc.text(`Verifying LMO: ${lmoUser.name}${lmoUser.officerCode ? ` (${lmoUser.officerCode})` : ''}`);
      doc.text(`GATC: ${gatc.name} — ${gatc.registrationNumber}`);
      doc.text(`GATC Address: ${gatc.address}`);
      doc.moveDown(1);

      // ---- Validity ----
      doc.font('Helvetica-Bold').fontSize(12).text('Validity');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Issue Date: ${formatDate(certificate.issueDate)}`);
      doc.text(`Valid Until: ${formatDate(certificate.validUntil)}`);
      doc.moveDown(1.5);

      // ---- QR code ----
      if (certificate.qrCodeUrl) {
        try {
          const qrPath = absolutePathFromUrl(certificate.qrCodeUrl);
          if (fs.existsSync(qrPath)) {
            doc.font('Helvetica-Bold').fontSize(10).text('Scan to verify authenticity:');
            doc.moveDown(0.3);
            doc.image(qrPath, { width: 120 });
          }
        } catch (e) {
          // Non-fatal: certificate is still valid without the embedded image.
        }
      }

      doc.moveDown(2);
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .text(
          'This is a system-generated certificate. Verify authenticity at the QR code link or via the public verification endpoint.',
          { align: 'center' }
        );

      doc.end();

      stream.on('finish', () => resolve(`/uploads/certificates/${fileName}`));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePdf };
