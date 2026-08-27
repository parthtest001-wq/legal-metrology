const GATC = require('../models/GATC');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');
const { GATC_APPROVAL_STATUS } = require('../../shared/constants');

/**
 * POST /api/v1/gatc
 * Role: admin
 */
async function createGatc(req, res, next) {
  try {
    const { name, registrationNumber, address, state, district, contactEmail, contactPhone } =
      req.body;

    const gatc = await GATC.create({
      name,
      registrationNumber,
      address,
      state,
      district,
      contactEmail,
      contactPhone,
    });

    return success(res, { gatc }, 'GATC created', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/gatc
 * Role: admin, lmo, consumer
 * Query: state?, approvalStatus?
 */
async function listGatcs(req, res, next) {
  try {
    const { state, approvalStatus } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const gatcs = await GATC.find(filter).sort({ createdAt: -1 });
    return success(res, { gatcs }, 'OK');
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/gatc/:id/approve
 * Role: admin
 * Body: {approvalStatus}
 */
async function approveGatc(req, res, next) {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!Object.values(GATC_APPROVAL_STATUS).includes(approvalStatus)) {
      throw new ApiError('Invalid approvalStatus', 400, 'VALIDATION_ERROR', [
        { field: 'approvalStatus', issue: 'must be pending, approved, or suspended' },
      ]);
    }

    const gatc = await GATC.findByIdAndUpdate(
      id,
      { approvalStatus, approvedBy: req.user.id },
      { new: true }
    );

    if (!gatc) throw new ApiError('GATC not found', 404, 'NOT_FOUND');

    return success(res, { gatc }, 'GATC status updated');
  } catch (err) {
    return next(err);
  }
}

module.exports = { createGatc, listGatcs, approveGatc };
