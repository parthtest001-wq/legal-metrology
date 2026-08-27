// /backend/controllers/scheduling.controller.js
// Owned by Module 3.
// Reads/updates Application docs (owned by Module 2) — does not redefine its schema.

const Application = require('../models/Application');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const { ROLES, APPLICATION_STATUS } = require('../../shared/constants');
const stateMachine = require('../utils/stateMachine');

/**
 * PATCH /api/v1/scheduling/applications/:id/assign
 * Roles: gatc, admin
 * Body: { assignedLmoId, scheduledDate }
 * submitted -> scheduled
 */
exports.assignApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedLmoId, scheduledDate } = req.body;

    if (!assignedLmoId || !scheduledDate) {
      return error(res, 'assignedLmoId and scheduledDate are required', 400, 'VALIDATION_ERROR');
    }

    const application = await Application.findById(id);
    if (!application) {
      return error(res, 'Application not found', 404, 'NOT_FOUND');
    }

    // A gatc user may only assign applications routed to their own GATC.
    if (req.user.role === ROLES.GATC) {
      const gatcUser = await User.findById(req.user.id).select('gatcId');
      if (
        !gatcUser ||
        !gatcUser.gatcId ||
        gatcUser.gatcId.toString() !== application.preferredGatcId.toString()
      ) {
        return error(res, 'Not authorized to assign this application', 403, 'FORBIDDEN');
      }
    }

    if (!stateMachine.canAssign(application.status)) {
      return error(
        res,
        `Cannot assign an application in status '${application.status}'`,
        409,
        'INVALID_STATE_TRANSITION'
      );
    }

    const lmo = await User.findOne({ _id: assignedLmoId, role: ROLES.LMO });
    if (!lmo) {
      return error(res, 'assignedLmoId does not reference a valid LMO user', 400, 'VALIDATION_ERROR');
    }

    application.assignedLmoId = assignedLmoId;
    application.scheduledDate = new Date(scheduledDate);
    application.status = stateMachine.ASSIGN_TO; // -> 'scheduled'
    application.updatedAt = new Date();
    await application.save();

    return success(res, { application }, 'Application assigned and scheduled');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/scheduling/lmo/:lmoId/queue
 * Roles: lmo (self), admin
 * Query: date?
 */
exports.getLmoQueue = async (req, res, next) => {
  try {
    const { lmoId } = req.params;
    const { date } = req.query;

    if (req.user.role === ROLES.LMO && req.user.id !== lmoId) {
      return error(res, 'Not authorized to view another LMO queue', 403, 'FORBIDDEN');
    }

    const filter = { assignedLmoId: lmoId };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.scheduledDate = { $gte: start, $lte: end };
    }

    const applications = await Application.find(filter)
      .sort({ scheduledDate: 1 })
      .populate('instrumentId')
      .populate('applicantId', 'name phone email')
      .populate('preferredGatcId', 'name address');

    return success(res, { applications }, 'Queue retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/scheduling/applications/:id/status
 * Roles: lmo, gatc, admin
 * Body: { status }
 * Enforces the manual-transition table in stateMachine.js.
 */
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(APPLICATION_STATUS).includes(status)) {
      return error(res, 'A valid status value is required', 400, 'VALIDATION_ERROR');
    }

    const application = await Application.findById(id);
    if (!application) {
      return error(res, 'Application not found', 404, 'NOT_FOUND');
    }

    if (req.user.role === ROLES.LMO && String(application.assignedLmoId) !== req.user.id) {
      return error(res, 'Not authorized to update this application', 403, 'FORBIDDEN');
    }

    if (!stateMachine.canTransition(application.status, status)) {
      return error(
        res,
        `Cannot transition application from '${application.status}' to '${status}'`,
        409,
        'INVALID_STATE_TRANSITION'
      );
    }

    application.status = status;
    application.updatedAt = new Date();
    await application.save();

    return success(res, { application }, 'Application status updated');
  } catch (err) {
    next(err);
  }
};
