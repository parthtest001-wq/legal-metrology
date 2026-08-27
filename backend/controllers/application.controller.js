// /backend/controllers/application.controller.js
// Owned by Module 2.

const mongoose = require('mongoose');
const Application = require('../models/Application');
const Instrument = require('../models/Instrument');
const apiResponse = require('../utils/apiResponse');
const User = require('../models/User');
const { ROLES, APPLICATION_STATUS, APPLICATION_TYPE, INSTRUMENT_STATUS } = require('../../shared/constants');

// ---------------------------------------------------------------------------
// Helper: generate APP-YYYY-NNNNNN, retrying on the rare race where two
// requests land in the same millisecond. Kept local to this controller —
// no new shared file/model needed for a hackathon-scale counter.
// ---------------------------------------------------------------------------
async function generateApplicationNumber() {
  const year = new Date().getFullYear();
  const prefix = `APP-${year}-`;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const countThisYear = await Application.countDocuments({
      applicationNumber: { $regex: `^${prefix}` },
    });
    const next = String(countThisYear + 1 + attempt).padStart(6, '0');
    const candidate = `${prefix}${next}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Application.findOne({ applicationNumber: candidate });
    if (!exists) return candidate;
  }
  // Fallback: timestamp-based suffix, astronomically unlikely to collide.
  return `${prefix}${Date.now().toString().slice(-6)}`;
}

// POST /api/v1/applications — role: consumer
// Body: {instrumentId, type, preferredGatcId} + documents (multipart)
exports.createApplication = async (req, res, next) => {
  try {
    const { instrumentId, type, preferredGatcId, remarks } = req.body;

    if (!instrumentId || !type || !preferredGatcId) {
      return apiResponse.error(
        res,
        'instrumentId, type and preferredGatcId are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!Object.values(APPLICATION_TYPE).includes(type)) {
      return apiResponse.error(
        res,
        `Invalid type. Allowed: ${Object.values(APPLICATION_TYPE).join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(instrumentId)) {
      return apiResponse.error(res, 'Invalid instrumentId', 400, 'VALIDATION_ERROR');
    }

    const instrument = await Instrument.findById(instrumentId);
    if (!instrument) {
      return apiResponse.error(res, 'Instrument not found', 404, 'NOT_FOUND');
    }
    if (String(instrument.ownerId) !== String(req.user.id)) {
      return apiResponse.error(
        res,
        'You can only submit applications for instruments you own',
        403,
        'FORBIDDEN'
      );
    }

    // Prevent duplicate open applications for the same instrument.
    const openStatuses = [
      APPLICATION_STATUS.SUBMITTED,
      APPLICATION_STATUS.SCHEDULED,
      APPLICATION_STATUS.IN_PROGRESS,
    ];
    const openExisting = await Application.findOne({
      instrumentId,
      status: { $in: openStatuses },
    });
    if (openExisting) {
      return apiResponse.error(
        res,
        'This instrument already has an open application in progress',
        409,
        'DUPLICATE_APPLICATION'
      );
    }

    const documents = (req.files || []).map((f) => ({
      url: f.path, // Cloudinary secure URL (multer-storage-cloudinary sets file.path to it)
      type: f.mimetype,
      uploadedAt: new Date(),
    }));

    const applicationNumber = await generateApplicationNumber();

    const application = await Application.create({
      applicationNumber,
      instrumentId,
      applicantId: req.user.id, // auto-filled from logged-in user
      type,
      preferredGatcId,
      documents,
      remarks: remarks || '',
      status: APPLICATION_STATUS.SUBMITTED,
    });

    // Reflect that the instrument now has a verification cycle underway.
    // MERGE FIX: was hardcoded as the string literal 'pending_verification'.
    // Section 3 requires every enum value to come from /shared/constants.js.
    instrument.status = INSTRUMENT_STATUS.PENDING_VERIFICATION;
    await instrument.save();

    return apiResponse.success(res, { application }, 'Application submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/applications
// role: consumer (own), lmo (assigned), gatc (own center), admin (all)
// query: status?, type?, gatcId?
// Extension (Module-2-owned, additive — see DELIVERABLES.md "deviations"):
//   district?, instrumentCategory?, dateFrom?, dateTo?
//   These support the admin/LMO "incoming applications" filter view and are
//   implemented via aggregation ($lookup) rather than new model fields, so
//   the frozen Application/Instrument/User schemas are untouched.
// ---------------------------------------------------------------------------
exports.listApplications = async (req, res, next) => {
  try {
    const { status, type, gatcId, district, instrumentCategory, dateFrom, dateTo } = req.query;

    const match = {};
    if (status) match.status = status;
    if (type) match.type = type;
    if (gatcId) match.preferredGatcId = new mongoose.Types.ObjectId(gatcId);

    if (dateFrom || dateTo) {
      match.submittedAt = {};
      if (dateFrom) match.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) match.submittedAt.$lte = new Date(dateTo);
    }

    // Role-based scoping
    if (req.user.role === ROLES.CONSUMER) {
      match.applicantId = new mongoose.Types.ObjectId(req.user.id);
    } else if (req.user.role === ROLES.LMO) {
      match.assignedLmoId = new mongoose.Types.ObjectId(req.user.id);
    } else if (req.user.role === ROLES.GATC) {
      // GATC users see applications directed at their own center.
      // MERGE FIX: req.user only carries { id, role, name } from the JWT
      // (Section 6) — it never has gatcId. The original code's
      // `if (req.user.gatcId)` was always false, so GATC users saw every
      // application in the system instead of only their own center's. Look
      // the requester's gatcId up from User.js instead, matching the
      // pattern Modules 3 and 6 already use for the same problem.
      const gatcUser = await User.findById(req.user.id).select('gatcId');
      if (gatcUser && gatcUser.gatcId) {
        match.preferredGatcId = new mongoose.Types.ObjectId(gatcUser.gatcId);
      }
    }
    // admin: no extra scoping — sees all

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'instruments',
          localField: 'instrumentId',
          foreignField: '_id',
          as: 'instrument',
        },
      },
      { $unwind: '$instrument' },
      {
        $lookup: {
          from: 'users',
          localField: 'applicantId',
          foreignField: '_id',
          as: 'applicant',
        },
      },
      { $unwind: '$applicant' },
    ];

    if (instrumentCategory) {
      pipeline.push({ $match: { 'instrument.category': instrumentCategory } });
    }
    if (district) {
      pipeline.push({ $match: { 'applicant.district': district } });
    }

    pipeline.push(
      {
        $project: {
          applicationNumber: 1,
          instrumentId: 1,
          applicantId: 1,
          type: 1,
          status: 1,
          preferredGatcId: 1,
          assignedLmoId: 1,
          scheduledDate: 1,
          documents: 1,
          remarks: 1,
          submittedAt: 1,
          updatedAt: 1,
          'instrument.category': 1,
          'instrument.make': 1,
          'instrument.model': 1,
          'instrument.serialNumber': 1,
          'applicant.name': 1,
          'applicant.district': 1,
          'applicant.state': 1,
        },
      },
      { $sort: { submittedAt: -1 } }
    );

    const applications = await Application.aggregate(pipeline);

    return apiResponse.success(res, { applications });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/applications/:id — role: consumer (own), lmo, gatc, admin
exports.getApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('instrumentId')
      .populate('applicantId', 'name email phone district state')
      .populate('preferredGatcId', 'name district state');

    if (!application) {
      return apiResponse.error(res, 'Application not found', 404, 'NOT_FOUND');
    }

    const isOwner = String(application.applicantId._id) === String(req.user.id);
    const isAssignedLmo =
      application.assignedLmoId && String(application.assignedLmoId) === String(req.user.id);

    if (req.user.role === ROLES.CONSUMER && !isOwner) {
      return apiResponse.error(res, 'Not authorized to view this application', 403, 'FORBIDDEN');
    }
    if (req.user.role === ROLES.LMO && !isAssignedLmo) {
      return apiResponse.error(res, 'Not authorized to view this application', 403, 'FORBIDDEN');
    }
    if (req.user.role === ROLES.GATC) {
      // MERGE FIX: same req.user.gatcId problem as listApplications above —
      // look it up from User.js rather than trusting a JWT field that was
      // never signed into the token.
      const gatcUser = await User.findById(req.user.id).select('gatcId');
      if (
        !gatcUser ||
        !gatcUser.gatcId ||
        String(application.preferredGatcId._id) !== String(gatcUser.gatcId)
      ) {
        return apiResponse.error(res, 'Not authorized to view this application', 403, 'FORBIDDEN');
      }
    }

    return apiResponse.success(res, { application });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/applications/:id/cancel — role: consumer (own, if status === 'submitted')
exports.cancelApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return apiResponse.error(res, 'Application not found', 404, 'NOT_FOUND');
    }
    if (String(application.applicantId) !== String(req.user.id)) {
      return apiResponse.error(res, 'Not authorized to cancel this application', 403, 'FORBIDDEN');
    }
    if (application.status !== APPLICATION_STATUS.SUBMITTED) {
      return apiResponse.error(
        res,
        'Only applications still in "submitted" status can be cancelled',
        409,
        'INVALID_STATE'
      );
    }

    application.status = APPLICATION_STATUS.CANCELLED;
    await application.save();

    return apiResponse.success(res, { application }, 'Application cancelled successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/applications/:id/edit — role: consumer (own, before scheduled)
// NOT in the Section 4 API Contract table — added as a Module-2-owned
// extension per Section 2's rule ("if a module needs something not in this
// spec, it must add it to a new file the module owns"). Flag for master-spec
// sync before merge. See DELIVERABLES.md.
// ---------------------------------------------------------------------------
exports.editApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return apiResponse.error(res, 'Application not found', 404, 'NOT_FOUND');
    }
    if (String(application.applicantId) !== String(req.user.id)) {
      return apiResponse.error(res, 'Not authorized to edit this application', 403, 'FORBIDDEN');
    }
    if (application.status !== APPLICATION_STATUS.SUBMITTED) {
      return apiResponse.error(
        res,
        'Application can only be edited while still in "submitted" status (i.e. before scheduling)',
        409,
        'INVALID_STATE'
      );
    }

    const { preferredGatcId, remarks, type } = req.body;
    if (preferredGatcId) application.preferredGatcId = preferredGatcId;
    if (remarks !== undefined) application.remarks = remarks;
    if (type) {
      if (!Object.values(APPLICATION_TYPE).includes(type)) {
        return apiResponse.error(res, 'Invalid type', 400, 'VALIDATION_ERROR');
      }
      application.type = type;
    }

    // Allow adding more supporting documents on edit.
    const newDocs = (req.files || []).map((f) => ({
      url: f.path, // Cloudinary secure URL
      type: f.mimetype,
      uploadedAt: new Date(),
    }));
    if (newDocs.length) {
      application.documents = [...application.documents, ...newDocs];
    }

    await application.save();

    return apiResponse.success(res, { application }, 'Application updated successfully');
  } catch (err) {
    next(err);
  }
};
