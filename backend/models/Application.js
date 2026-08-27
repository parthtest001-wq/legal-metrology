// /backend/models/Application.js
// Owned by Module 2. Field names/enums match Master Spec Section 3.4 EXACTLY.

const mongoose = require('mongoose');
const { APPLICATION_STATUS, APPLICATION_TYPE } = require('../../shared/constants');

const { Schema } = mongoose;

const documentSubSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true, // format APP-YYYY-NNNNNN, generated in controller before save
  },
  instrumentId: {
    type: Schema.Types.ObjectId,
    ref: 'Instrument',
    required: true,
  },
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(APPLICATION_TYPE),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(APPLICATION_STATUS),
    default: APPLICATION_STATUS.SUBMITTED,
  },
  preferredGatcId: {
    type: Schema.Types.ObjectId,
    ref: 'GATC',
    required: true,
  },
  assignedLmoId: {
    // set by Module 3
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  scheduledDate: {
    // set by Module 3
    type: Date,
    default: null,
  },
  documents: {
    type: [documentSubSchema],
    default: [],
  },
  remarks: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Keep updatedAt current on every save (spec defines updatedAt explicitly,
// so we do NOT use the mongoose {timestamps:true} shortcut here — that would
// add createdAt too, which is not in the Section 3.4 field table).
applicationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
applicationSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Application', applicationSchema);
