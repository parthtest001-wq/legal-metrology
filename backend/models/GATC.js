const mongoose = require('mongoose');
const { GATC_APPROVAL_STATUS } = require('../../shared/constants');

const { Schema } = mongoose;

const GATCSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    approvalStatus: {
      type: String,
      enum: Object.values(GATC_APPROVAL_STATUS),
      default: GATC_APPROVAL_STATUS.PENDING,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GATC', GATCSchema);
