const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../../shared/constants');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    address: { type: String },
    state: { type: String, required: true },
    district: { type: String, required: true },
    gatcId: {
      type: Schema.Types.ObjectId,
      ref: 'GATC',
      required: function () {
        return this.role === ROLES.GATC;
      },
    },
    officerCode: {
      type: String,
      required: function () {
        return this.role === ROLES.LMO;
      },
    },
    isActive: { type: Boolean, default: true },

    // --- Additions owned by Module 1 (User.js), not enumerated in Section 3.1's
    // table but required to implement the password-reset flow requested for
    // this module. See end-of-response assumptions for merge traceability. ---
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true } // createdAt / updatedAt
);

UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
