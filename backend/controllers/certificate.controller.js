/**
 * controllers/certificate.controller.js
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Imports models it does not own (Application, Instrument,
 * VerificationRecord, User, GATC) read-only, per Section 9 boundary list.
 * Never redefines their schemas.
 */

const path = require('path');
const fs = require('fs');

const Certificate = require('../models/Certificate');
const Application = require('../models/Application');
const Instrument = require('../models/Instrument');
const VerificationRecord = require('../models/VerificationRecord');
const User = require('../models/User');
const GATC = require('../models/GATC');

const { success, error } = require('../utils/apiResponse');
const { generateCertificateQr, absolutePathFromUrl } = require('../utils/qrGenerator');
const { generateCertificatePdf } = require('../utils/pdfGenerator');
const { CERTIFICATE_STATUS, APPLICATION_STATUS, INSTRUMENT_STATUS } = require('../../shared/constants');

/**
 * Per-instrument-category validity period, in years.
 *
 * Section 3.6 of the frozen Master Spec states the fixed demo rule:
 * "validUntil = issueDate + 1 year". This map exists so the *mechanism* is
 * category-aware (per the build request), while every category currently
 * resolves to the same value as the frozen spec — CERT_VALIDITY_YEARS from
 * .env (default 1). If category-specific periods are ever wanted, only this
 * map changes; nothing else in the module needs to move. This does not
 * violate the frozen spec today because every category still yields exactly
 * issueDate + 1 year.
 */
function getValidityYears(category) {
  const base = Number(process.env.CERT_VALIDITY_YEARS || 1);
  const CATEGORY_OVERRIDES = {
    // weighing_scale: base,
    // weighbridge: base,
    // taximeter: base,
    // fuel_dispenser: base,
    // water_meter: base,
    // length_measure: base,
    // volume_measure: base,
  };
  return CATEGORY_OVERRIDES[category] ?? base;
}

/**
 * Generates a unique certificate number in the format CERT-YYYY-NNNNNN.
 * NNNNNN is a zero-padded sequential count of certificates issued this
 * calendar year (demo-grade; fine for hackathon scale/single-process).
 */
async function generateCertificateNumber() {
  const year = new Date().getFullYear();
  const prefix = `CERT-${year}-`;
  const countThisYear = await Certificate.countDocuments({
    certificateNumber: { $regex: `^${prefix}` },
  });
  const seq = String(countThisYear + 1).padStart(6, '0');
  return `${prefix}${seq}`;
}

/**
 * POST /api/v1/certificates/:applicationId/generate
 * Role: lmo
 * Auto-generates a certificate from an existing VerificationRecord, ONLY if
 * overallResult === 'pass'. No request body (per Section 4).
 */
async function generateCertificate(req, res, next) {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return error(res, 'Application not found', 404, 'NOT_FOUND');
    }

    // Only the LMO assigned to this application may issue its certificate.
    if (String(application.assignedLmoId) !== String(req.user.id)) {
      return error(res, 'You are not the assigned LMO for this application', 403, 'FORBIDDEN');
    }

    const verificationRecord = await VerificationRecord.findOne({ applicationId });
    if (!verificationRecord) {
      return error(res, 'No verification record found for this application', 404, 'NOT_FOUND');
    }

    if (verificationRecord.overallResult !== 'pass') {
      return error(
        res,
        'Certificate can only be generated for a verification record with overallResult "pass"',
        400,
        'VALIDATION_ERROR'
      );
    }

    const existing = await Certificate.findOne({ applicationId });
    if (existing) {
      return error(res, 'A certificate already exists for this application', 409, 'CONFLICT');
    }

    const instrument = await Instrument.findById(application.instrumentId);
    if (!instrument) {
      return error(res, 'Instrument not found', 404, 'NOT_FOUND');
    }

    const certificateNumber = await generateCertificateNumber();
    const issueDate = new Date();
    const validityYears = getValidityYears(instrument.category);
    const validUntil = new Date(issueDate);
    validUntil.setFullYear(validUntil.getFullYear() + validityYears);

    // Create the certificate first (without qrCodeUrl/pdfUrl) to get its _id,
    // since the QR payload only needs certificateNumber but the PDF filename
    // convention is keyed off certificateNumber too — _id isn't required for
    // either, but creating first keeps DB state consistent if QR/PDF
    // generation throws.
    let certificate = await Certificate.create({
      certificateNumber,
      applicationId: application._id,
      instrumentId: instrument._id,
      verificationRecordId: verificationRecord._id,
      issueDate,
      validUntil,
      status: CERTIFICATE_STATUS.ACTIVE,
      issuedBy: req.user.id,
    });

    // Generate QR code (encodes public verification URL, see qrGenerator.js)
    const qrCodeUrl = await generateCertificateQr(certificateNumber);
    certificate.qrCodeUrl = qrCodeUrl;
    await certificate.save();

    // Update instrument status to 'verified' — Module 4 does not own
    // Instrument.js's schema, but updating an existing document's field
    // value (not adding a new field) is a normal cross-module write, same
    // as Module 3 setting Application.assignedLmoId.
    // MERGE FIX: was the hardcoded string literal 'verified'; Section 3
    // requires every enum value to be imported from /shared/constants.js.
    instrument.status = INSTRUMENT_STATUS.VERIFIED;
    await instrument.save();

    // Mark the application completed.
    application.status = APPLICATION_STATUS.COMPLETED;
    await application.save();

    return success(res, { certificate }, 'Certificate generated successfully', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/certificates
 * Role: consumer (own), lmo (issued by them), gatc, admin
 *
 * NOT in the frozen Section 4 table — added because the requested "My
 * Certificates" consumer page has no way to list certificates otherwise
 * (Section 4 only defines get-by-id, generate, download, verify, revoke).
 * This is an ADDITIVE extension living entirely inside Module 4's own
 * routes/controller files, per Section 9's rule that a module needing
 * something not in the spec "must add it to a new file the module owns,
 * not modify a shared file." No existing route, model field, or shared
 * file changes. Flagged explicitly in deliverables notes for the
 * integration/merge step to review.
 */
async function listMyCertificates(req, res, next) {
  try {
    const { role, id } = req.user;
    let applicationFilter = {};

    if (role === 'consumer') {
      applicationFilter = { applicantId: id };
    } else if (role === 'lmo') {
      // handled via certificate.issuedBy directly below
    } else if (role === 'gatc' || role === 'admin') {
      // no restriction — gatc/admin may see broader lists; a real
      // implementation would further scope gatc by their own gatcId
    }

    let certificateFilter = {};
    if (role === 'lmo') {
      certificateFilter.issuedBy = id;
    } else if (role === 'consumer') {
      const applications = await Application.find(applicationFilter).select('_id');
      certificateFilter.applicationId = { $in: applications.map((a) => a._id) };
    }

    const certificates = await Certificate.find(certificateFilter).sort({ createdAt: -1 });
    return success(res, { certificates }, 'Certificates fetched');
  } catch (err) {
    next(err);
  }
}

/**
 * Shared authorization check for consumer/lmo/gatc/admin read access to a
 * given certificate, matching the role list in Section 4.
 */
async function assertCanViewCertificate(req, certificate, application) {
  const { role, id } = req.user;
  if (role === 'admin') return true;
  if (role === 'consumer') return String(application.applicantId) === String(id);
  if (role === 'lmo') return String(certificate.issuedBy) === String(id);
  if (role === 'gatc') return true; // gatc scoping handled at query time if needed
  return false;
}

/**
 * GET /api/v1/certificates/:id
 * Role: consumer (own), lmo, gatc, admin
 */
async function getCertificateById(req, res, next) {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return error(res, 'Certificate not found', 404, 'NOT_FOUND');
    }
    const application = await Application.findById(certificate.applicationId);
    if (!application) {
      return error(res, 'Related application not found', 404, 'NOT_FOUND');
    }

    const allowed = await assertCanViewCertificate(req, certificate, application);
    if (!allowed) {
      return error(res, 'You are not authorized to view this certificate', 403, 'FORBIDDEN');
    }

    return success(res, { certificate }, 'Certificate fetched');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/certificates/:id/download
 * Role: consumer (own), lmo, gatc, admin
 * Streams the PDF binary. Generates it on first request if pdfUrl is not
 * yet set (lazy generation keeps issuance fast and avoids PDF work for
 * certificates nobody ever downloads).
 */
async function downloadCertificatePdf(req, res, next) {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return error(res, 'Certificate not found', 404, 'NOT_FOUND');
    }
    const application = await Application.findById(certificate.applicationId);
    if (!application) {
      return error(res, 'Related application not found', 404, 'NOT_FOUND');
    }
    const allowed = await assertCanViewCertificate(req, certificate, application);
    if (!allowed) {
      return error(res, 'You are not authorized to download this certificate', 403, 'FORBIDDEN');
    }

    let pdfPath = certificate.pdfUrl ? absolutePathFromUrl(certificate.pdfUrl) : null;

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      const [instrument, verificationRecord, applicant, lmoUser, gatc] = await Promise.all([
        Instrument.findById(certificate.instrumentId),
        VerificationRecord.findById(certificate.verificationRecordId),
        User.findById(application.applicantId),
        User.findById(certificate.issuedBy),
        // verificationRecord.gatcId is the source of truth for which GATC performed the inspection
        VerificationRecord.findById(certificate.verificationRecordId).then((vr) =>
          vr ? GATC.findById(vr.gatcId) : null
        ),
      ]);

      if (!instrument || !verificationRecord || !applicant || !lmoUser || !gatc) {
        return error(res, 'Could not assemble certificate data for PDF rendering', 500, 'SERVER_ERROR');
      }

      const relativeUrl = await generateCertificatePdf({
        certificate,
        application,
        instrument,
        applicant,
        verificationRecord,
        lmoUser,
        gatc,
      });
      certificate.pdfUrl = relativeUrl;
      await certificate.save();
      pdfPath = absolutePathFromUrl(relativeUrl);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${certificate.certificateNumber}.pdf"`
    );
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/certificates/verify/:certificateNumber
 * PUBLIC — no auth. This is the QR code's underlying data source.
 * Returns only what's needed to confirm authenticity — no applicant PII
 * (name, address, contact info are intentionally excluded).
 */
async function verifyCertificatePublic(req, res, next) {
  try {
    const { certificateNumber } = req.params;
    const certificate = await Certificate.findOne({ certificateNumber });

    if (!certificate) {
      return success(
        res,
        { isValid: false, certificate: null, instrument: null },
        'No certificate found with this number'
      );
    }

    const instrument = await Instrument.findById(certificate.instrumentId);
    const now = new Date();
    const isExpiredByDate = certificate.validUntil < now;
    const isValid = certificate.status === CERTIFICATE_STATUS.ACTIVE && !isExpiredByDate;

    // Deliberately minimal, non-PII payload for public consumption.
    const publicCertificate = {
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      validUntil: certificate.validUntil,
      status: isExpiredByDate && certificate.status === CERTIFICATE_STATUS.ACTIVE
        ? CERTIFICATE_STATUS.EXPIRED
        : certificate.status,
    };

    const publicInstrument = instrument
      ? {
          category: instrument.category,
          make: instrument.make,
          model: instrument.model,
          registrationNumber: instrument.registrationNumber,
        }
      : null;

    return success(res, { isValid, certificate: publicCertificate, instrument: publicInstrument }, 'Verification result');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/certificates/:id/revoke
 * Role: admin
 * Body: { reason }
 */
async function revokeCertificate(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) {
      return error(res, 'reason is required', 400, 'VALIDATION_ERROR');
    }

    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return error(res, 'Certificate not found', 404, 'NOT_FOUND');
    }

    certificate.status = CERTIFICATE_STATUS.REVOKED;
    certificate.revocationReason = reason;
    await certificate.save();

    return success(res, { certificate }, 'Certificate revoked');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateCertificate,
  listMyCertificates,
  getCertificateById,
  downloadCertificatePdf,
  verifyCertificatePublic,
  revokeCertificate,
};
