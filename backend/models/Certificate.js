/**
 * models/Certificate.js
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Schema matches Master Spec Section 3.6 EXACTLY. Do not add fields here —
 * if another module needs a computed value, it computes it in its own
 * controller/service (see Master Spec Section 3, closing note).
 */

const mongoose = require('mongoose');
const { CERTIFICATE_STATUS } = require('../../shared/constants');

const { Schema } = mongoose;

const certificateSchema = new Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true, // format CERT-YYYY-NNNNNN, see utils/certificateNumber logic in controller
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true, // one certificate per application
    },
    instrumentId: {
      type: Schema.Types.ObjectId,
      ref: 'Instrument',
      required: true,
    },
    verificationRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'VerificationRecord',
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true, // issueDate + validity period, see Section 3.6 note
    },
    qrCodeUrl: {
      type: String, // file URL under /backend/uploads/certificates
      default: null,
    },
    pdfUrl: {
      type: String, // file URL under /backend/uploads/certificates
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(CERTIFICATE_STATUS),
      default: CERTIFICATE_STATUS.ACTIVE,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // role 'lmo'
      required: true,
    },
    // Not in the frozen spec's field table, but required to support the
    // admin revoke action from Section 4 (`PATCH /certificates/:id/revoke`
    // body: { reason }). Kept optional/nullable so it never blocks the
    // documented fields above from being the source of truth.
    revocationReason: {
      type: String,
      default: null,
    },
  },
  {
    // Spec lists only createdAt for this model (no updatedAt in Section 3.6's
    // table) — timestamps: true would add updatedAt too, which is harmless
    // and used internally by revoke, but createdAt is the field other
    // modules should rely on per Section 3.
    timestamps: true,
  }
);

module.exports = mongoose.model('Certificate', certificateSchema);
