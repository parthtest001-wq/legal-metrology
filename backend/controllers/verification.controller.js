// /backend/controllers/verification.controller.js
// Owned by Module 3.

const VerificationRecord = require('../models/VerificationRecord');
const Application = require('../models/Application');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const { ROLES } = require('../../shared/constants');
const stateMachine = require('../utils/stateMachine');

const RESULT_VALUES = ['pass', 'fail'];

/**
 * POST /api/v1/verification/:applicationId
 * Role: lmo
 * Body: { inspectionDate, observations: [], overallResult, remarks } + photos (multipart)
 */
exports.recordVerification = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { inspectionDate, observations, overallResult, remarks } = req.body;

    if (!inspectionDate || !overallResult) {
      return error(res, 'inspectionDate and overallResult are required', 400, 'VALIDATION_ERROR');
    }
    if (!RESULT_VALUES.includes(overallResult)) {
      return error(res, `overallResult must be one of: ${RESULT_VALUES.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return error(res, 'Application not found', 404, 'NOT_FOUND');
    }

    if (String(application.assignedLmoId) !== req.user.id) {
      return error(res, 'Not authorized to record verification for this application', 403, 'FORBIDDEN');
    }

    if (!stateMachine.canRecordVerification(application.status)) {
      return error(
        res,
        `Cannot record a verification for an application in status '${application.status}'`,
        409,
        'INVALID_STATE_TRANSITION'
      );
    }

    const existing = await VerificationRecord.findOne({ applicationId });
    if (existing) {
      return error(res, 'A verification record already exists for this application', 409, 'DUPLICATE_RECORD');
    }

    // observations may arrive as a JSON string when sent via multipart/form-data
    let parsedObservations = observations;
    if (typeof observations === 'string') {
      try {
        parsedObservations = JSON.parse(observations);
      } catch {
        return error(res, 'observations must be valid JSON', 400, 'VALIDATION_ERROR');
      }
    }
    if (parsedObservations && !Array.isArray(parsedObservations)) {
      return error(res, 'observations must be an array', 400, 'VALIDATION_ERROR');
    }
    for (const obs of parsedObservations || []) {
      if (!obs.parameter || !obs.expectedValue || !obs.observedValue || !RESULT_VALUES.includes(obs.result)) {
        return error(
          res,
          'Each observation requires parameter, expectedValue, observedValue, and a valid result',
          400,
          'VALIDATION_ERROR'
        );
      }
    }

    const lmoUser = await User.findById(req.user.id).select('gatcId');
    // LMO users are not required to carry a gatcId in Section 3.1 (only role
    // 'gatc' users are). The GATC for the record instead comes from the
    // application's preferredGatcId, which is how the inspection was routed.
    const gatcId = application.preferredGatcId;

    // Files now go straight to Cloudinary (see upload.middleware.js);
    // f.path is the Cloudinary secure URL.
    const photos = (req.files || []).map((f) => f.path);

    const verificationRecord = await VerificationRecord.create({
      applicationId,
      lmoId: req.user.id,
      gatcId,
      inspectionDate: new Date(inspectionDate),
      observations: parsedObservations || [],
      overallResult,
      remarks,
      photos,
    });

    const nextStatus = stateMachine.statusForResult(overallResult);
    if (nextStatus) {
      application.status = nextStatus;
      application.updatedAt = new Date();
      await application.save();
    }

    return success(res, { verificationRecord }, 'Verification recorded', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/verification/:applicationId
 * Roles: consumer (own), lmo, gatc, admin
 */
exports.getVerification = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const verificationRecord = await VerificationRecord.findOne({ applicationId })
      .populate('lmoId', 'name officerCode')
      .populate('gatcId', 'name registrationNumber');

    if (!verificationRecord) {
      return error(res, 'Verification record not found', 404, 'NOT_FOUND');
    }

    if (req.user.role === ROLES.CONSUMER) {
      const application = await Application.findById(applicationId).select('applicantId');
      if (!application || String(application.applicantId) !== req.user.id) {
        return error(res, 'Not authorized to view this verification record', 403, 'FORBIDDEN');
      }
    }

    return success(res, { verificationRecord }, 'Verification record retrieved');
  } catch (err) {
    next(err);
  }
};
