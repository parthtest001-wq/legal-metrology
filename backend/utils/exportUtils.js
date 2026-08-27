/**
 * Module 6 — Role-based Dashboards, Search & Export
 * /backend/utils/exportUtils.js
 *
 * NEW FILE owned by Module 6. Per Section 9 rule: "If a module needs
 * something not in this spec, it must add it to a new file the module
 * owns, not modify a shared file." /backend/utils/ already has files
 * owned by Modules 4/5 (qrGenerator.js, pdfGenerator.js, mailer.js,
 * cronJobs.js) — this file is additive, does not touch those.
 *
 * No new npm dependency was introduced for CSV (hand-rolled serializer,
 * demo-grade, avoids escaping edge-case libraries). PDF list export
 * reuses `pdfkit`, already pinned in Section 1 (same package Module 4
 * uses for certificates, imported independently here).
 */

const PDFDocument = require('pdfkit');

const FIELD_MAP = {
  instrument: [
    ['serialNumber', 'Serial Number'],
    ['registrationNumber', 'Registration Number'],
    ['category', 'Category'],
    ['make', 'Make'],
    ['model', 'Model'],
    ['status', 'Status'],
    ['unit', 'Unit'],
    ['manufacturingYear', 'Mfg Year'],
  ],
  application: [
    ['applicationNumber', 'Application Number'],
    ['type', 'Type'],
    ['status', 'Status'],
    ['scheduledDate', 'Scheduled Date'],
    ['submittedAt', 'Submitted At'],
  ],
  certificate: [
    ['certificateNumber', 'Certificate Number'],
    ['status', 'Status'],
    ['issueDate', 'Issue Date'],
    ['validUntil', 'Valid Until'],
  ],
  user: [
    ['name', 'Name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['role', 'Role'],
    ['state', 'State'],
    ['district', 'District'],
  ],
};

function escapeCsvValue(value) {
  if (value === undefined || value === null) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {'instrument'|'application'|'certificate'|'user'} type
 * @param {Array<object>} docs mongoose documents (or plain objects)
 * @returns {string} CSV text
 */
function toCsv(type, docs) {
  const fields = FIELD_MAP[type];
  if (!fields) throw new Error(`No CSV field map for type "${type}"`);

  const header = fields.map(([, label]) => escapeCsvValue(label)).join(',');
  const rows = docs.map((doc) =>
    fields
      .map(([key]) => escapeCsvValue(doc[key]))
      .join(',')
  );
  return [header, ...rows].join('\n');
}

/**
 * Builds a printable PDF listing of certificates (for GATC/admin
 * "print certificate list" use case). Returns an in-memory PDFDocument;
 * caller pipes it to the response.
 */
function buildCertificateListPdf(certificates) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.fontSize(16).text('Certificate List', { align: 'center' });
  doc.moveDown();
  doc.fontSize(9).fillColor('#555').text(
    `Generated: ${new Date().toLocaleString()} | Total records: ${certificates.length}`,
    { align: 'center' }
  );
  doc.moveDown(1.5);

  const colX = [40, 160, 320, 400, 480];
  const headerY = doc.y;
  doc.fontSize(10).fillColor('#000');
  doc.text('Certificate No.', colX[0], headerY, { width: 115 });
  doc.text('Instrument', colX[1], headerY, { width: 155 });
  doc.text('Status', colX[2], headerY, { width: 75 });
  doc.text('Issue Date', colX[3], headerY, { width: 75 });
  doc.text('Valid Until', colX[4], headerY, { width: 75 });
  doc.moveDown(0.5);
  doc
    .moveTo(40, doc.y)
    .lineTo(555, doc.y)
    .strokeColor('#ccc')
    .stroke();
  doc.moveDown(0.3);

  certificates.forEach((cert) => {
    const y = doc.y;
    if (y > 760) {
      doc.addPage();
    }
    const rowY = doc.y;
    const instrumentLabel = cert.instrumentId
      ? `${cert.instrumentId.category || ''} ${cert.instrumentId.make || ''} ${cert.instrumentId.model || ''}`.trim()
      : '-';
    doc.fontSize(9);
    doc.text(cert.certificateNumber || '-', colX[0], rowY, { width: 115 });
    doc.text(instrumentLabel || '-', colX[1], rowY, { width: 155 });
    doc.text(cert.status || '-', colX[2], rowY, { width: 75 });
    doc.text(
      cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : '-',
      colX[3],
      rowY,
      { width: 75 }
    );
    doc.text(
      cert.validUntil ? new Date(cert.validUntil).toLocaleDateString() : '-',
      colX[4],
      rowY,
      { width: 75 }
    );
    doc.moveDown(0.6);
  });

  return doc;
}

module.exports = { toCsv, buildCertificateListPdf };
