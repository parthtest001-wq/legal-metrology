const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GATC = require('../models/GATC');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');
const { ROLES, GATC_APPROVAL_STATUS } = require('../../shared/constants');
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require('../config/env');

function signToken(user) {
  // JWT payload shape — Master Spec Section 6, exact.
  return jwt.sign(
    { id: user._id.toString(), role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/v1/auth/register
 * Body: {name, email, phone, password, role, address, state, district, gatcDetails?}
 * Admin accounts are seeded, not self-registered.
 */
async function register(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      address,
      state,
      district,
      officerCode,
      gatcDetails,
    } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      throw new ApiError('Invalid role', 400, 'VALIDATION_ERROR', [
        { field: 'role', issue: 'must be one of consumer, lmo, gatc' },
      ]);
    }

    if (role === ROLES.ADMIN) {
      throw new ApiError(
        'Admin accounts are seeded by the system and cannot self-register',
        403,
        'FORBIDDEN'
      );
    }

    if (role === ROLES.LMO && !officerCode) {
      throw new ApiError('officerCode is required for LMO registration', 400, 'VALIDATION_ERROR', [
        { field: 'officerCode', issue: 'required for role lmo' },
      ]);
    }

    let gatcId;
    if (role === ROLES.GATC) {
      if (
        !gatcDetails ||
        !gatcDetails.name ||
        !gatcDetails.registrationNumber ||
        !gatcDetails.address ||
        !gatcDetails.state ||
        !gatcDetails.district
      ) {
        throw new ApiError(
          'gatcDetails (name, registrationNumber, address, state, district) is required for GATC registration',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Create the GATC record (pending admin approval) and link the user to it.
      const gatc = await GATC.create({
        name: gatcDetails.name,
        registrationNumber: gatcDetails.registrationNumber,
        address: gatcDetails.address,
        state: gatcDetails.state,
        district: gatcDetails.district,
        contactEmail: gatcDetails.contactEmail || email,
        contactPhone: gatcDetails.contactPhone || phone,
        approvalStatus: GATC_APPROVAL_STATUS.PENDING,
      });
      gatcId = gatc._id;
    }

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: password, // hashed by the pre-save hook
      role,
      address,
      state,
      district,
      officerCode: role === ROLES.LMO ? officerCode : undefined,
      gatcId,
    });

    return success(res, { user: user.toSafeJSON() }, 'Registration successful', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/login
 * Body: {email, password}
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user) {
      throw new ApiError('Invalid email or password', 401, 'AUTH_INVALID');
    }
    if (!user.isActive) {
      throw new ApiError('This account has been deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    const match = await user.comparePassword(password);
    if (!match) {
      throw new ApiError('Invalid email or password', 401, 'AUTH_INVALID');
    }

    const token = signToken(user);
    return success(res, { token, user: user.toSafeJSON() }, 'Login successful');
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/auth/me
 */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError('User not found', 404, 'NOT_FOUND');
    return success(res, { user: user.toSafeJSON() }, 'OK');
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/forgot-password
 * Body: {email}
 *
 * NOTE: This route is not enumerated in Master Spec Section 4's table. It is
 * an addition owned entirely by Module 1's auth.routes.js/auth.controller.js
 * to satisfy the requested password-reset flow. Flagged in the response's
 * assumptions section for the api-contract.md update before merge.
 *
 * Module 5 owns utils/mailer.js; since that module doesn't exist yet in this
 * session, the reset link is logged to the console (and returned in the
 * response body ONLY when NODE_ENV !== 'production') instead of emailed.
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });

    // Always respond success-shaped to avoid leaking which emails are registered.
    if (!user) {
      return success(res, {}, 'If that email is registered, a reset link has been sent');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;

    // Stub for Module 5's real mailer.
    // eslint-disable-next-line no-console
    console.log(`[auth] Password reset link for ${user.email}: ${resetLink}`);

    const data = NODE_ENV !== 'production' ? { resetToken: rawToken, resetLink } : {};
    return success(res, data, 'If that email is registered, a reset link has been sent');
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/reset-password
 * Body: {email, token, newPassword}
 * See note on forgot-password re: this route's status relative to Section 4.
 */
async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      throw new ApiError('email, token, and newPassword are required', 400, 'VALIDATION_ERROR');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpires');

    if (!user) {
      throw new ApiError('Reset token is invalid or has expired', 400, 'TOKEN_INVALID');
    }

    user.passwordHash = newPassword; // re-hashed by pre-save hook
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    return success(res, {}, 'Password has been reset successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me, forgotPassword, resetPassword };
