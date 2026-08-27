// /backend/models/Instrument.js
// Owned by Module 2. Field names/enums match Master Spec Section 3.3 EXACTLY.
// Enum values are imported from /shared/constants.js — never hardcoded.

const mongoose = require('mongoose');
const { INSTRUMENT_CATEGORY, INSTRUMENT_STATUS } = require('../../shared/constants');

const { Schema } = mongoose;

const instrumentSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(INSTRUMENT_CATEGORY),
      required: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'litre', 'metre', 'tonne'],
    },
    manufacturingYear: {
      type: Number,
    },
    registrationNumber: {
      // system-generated on first verification (Module 3/4 concern) — left
      // null until a certificate cycle assigns it. Module 2 never sets this.
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: Object.values(INSTRUMENT_STATUS),
      default: INSTRUMENT_STATUS.REGISTERED,
    },
    photos: {
      type: [String], // file URLs under /backend/uploads/instruments
      default: [],
    },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

module.exports = mongoose.model('Instrument', instrumentSchema);
