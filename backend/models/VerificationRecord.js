// /backend/models/VerificationRecord.js
// Owned by Module 3 (Verification Scheduling & Workflow).
// Field names, types, and enum values match Master Spec Section 3.5 exactly.
// Enum string values are pulled from /shared/constants.js — never hardcoded here
// beyond the pass/fail literals that constants.js itself does not enumerate
// (the master spec does not add observation/overallResult results to
// shared constants, so 'pass' / 'fail' are defined locally, matching spec text).

const mongoose = require('mongoose');
const { Schema } = mongoose;

const RESULT_VALUES = ['pass', 'fail'];

const ObservationSchema = new Schema(
  {
    parameter: { type: String, required: true },
    expectedValue: { type: String, required: true },
    observedValue: { type: String, required: true },
    result: { type: String, enum: RESULT_VALUES, required: true },
  },
  { _id: false }
);

const VerificationRecordSchema = new Schema(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true, // one record per application, per spec
    },
    lmoId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gatcId: {
      type: Schema.Types.ObjectId,
      ref: 'GATC',
      required: true,
    },
    inspectionDate: {
      type: Date,
      required: true,
    },
    observations: {
      type: [ObservationSchema],
      default: [],
    },
    overallResult: {
      type: String,
      enum: RESULT_VALUES,
      required: true,
    },
    remarks: {
      type: String,
    },
    photos: {
      type: [String], // file URLs under /backend/uploads/applications
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false } // spec lists only `createdAt`, no `updatedAt`, for this model
);

module.exports = mongoose.model('VerificationRecord', VerificationRecordSchema);
