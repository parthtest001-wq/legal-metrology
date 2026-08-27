/**
 * Module 6 — Role-based Dashboards, Search & Export
 * /backend/controllers/dashboard.controller.js
 *
 * OWNERSHIP: This file is created and owned by Module 6.
 * It does NOT redefine any model — it only imports and reads from models
 * owned by Modules 1-5 (User, GATC, Instrument, Application,
 * VerificationRecord, Certificate). No writes happen here except read
 * aggregations.
 */

const User = require('../models/User');
const GATC = require('../models/GATC');
const Instrument = require('../models/Instrument');
const Application = require('../models/Application');
const VerificationRecord = require('../models/VerificationRecord');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const { success, error } = require('../utils/apiResponse');
const {
  APPLICATION_STATUS,
  CERTIFICATE_STATUS,
} = require('../../shared/constants');

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + Number(n));
  return d;
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/dashboard/consumer                                     */
/* ------------------------------------------------------------------ */
exports.getConsumerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [instrumentCount, applicationCount, myApplications] =
      await Promise.all([
        Instrument.countDocuments({ ownerId: userId }),
        Application.countDocuments({ applicantId: userId }),
        Application.find({ applicantId: userId }).select('_id status'),
      ]);

    const applicationIds = myApplications.map((a) => a._id);

    const [activeCertificates, expiringSoon, rejectedApplications, recentAlerts] =
      await Promise.all([
        Certificate.countDocuments({
          applicationId: { $in: applicationIds },
          status: CERTIFICATE_STATUS.ACTIVE,
        }),
        Certificate.countDocuments({
          applicationId: { $in: applicationIds },
          status: CERTIFICATE_STATUS.ACTIVE,
          validUntil: { $lte: daysFromNow(30), $gte: new Date() },
        }),
        Application.countDocuments({
          applicantId: userId,
          status: APPLICATION_STATUS.REJECTED,
        }),
        // Reuses Module 5's Notification model — read-only, not modified.
        Notification.find({ userId }).sort({ createdAt: -1 }).limit(5),
      ]);

    return success(res, {
      instrumentCount,
      applicationCount,
      activeCertificates,
      expiringSoon,
      rejectedApplications,
      recentAlerts,
    });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/dashboard/lmo                                          */
/* ------------------------------------------------------------------ */
exports.getLmoDashboard = async (req, res, next) => {
  try {
    const lmoId = req.user.id;

    const [pendingInspections, completedThisMonth, rejectedByLmo, queue] =
      await Promise.all([
        Application.countDocuments({
          assignedLmoId: lmoId,
          status: {
            $in: [APPLICATION_STATUS.SCHEDULED, APPLICATION_STATUS.IN_PROGRESS],
          },
        }),
        VerificationRecord.countDocuments({
          lmoId,
          createdAt: { $gte: startOfMonth() },
        }),
        VerificationRecord.countDocuments({
          lmoId,
          overallResult: 'fail',
          createdAt: { $gte: startOfMonth() },
        }),
        Application.find({
          assignedLmoId: lmoId,
          status: {
            $in: [APPLICATION_STATUS.SCHEDULED, APPLICATION_STATUS.IN_PROGRESS],
          },
        })
          .populate('instrumentId', 'category make model serialNumber')
          .sort({ scheduledDate: 1 })
          .limit(20),
      ]);

    return success(res, {
      pendingInspections,
      completedThisMonth,
      failedThisMonth: rejectedByLmo,
      queue,
    });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/dashboard/gatc                                         */
/* ------------------------------------------------------------------ */
exports.getGatcDashboard = async (req, res, next) => {
  try {
    // req.user.role === 'gatc' users carry gatcId on their User doc (Section 3.1)
    const requester = await User.findById(req.user.id).select('gatcId');
    const gatcId = requester ? requester.gatcId : null;

    if (!gatcId) {
      return error(res, 'No GATC associated with this account', 400, 'NO_GATC');
    }

    const [pendingApplications, lmoWorkloadAgg, certificatesIssued] =
      await Promise.all([
        Application.countDocuments({
          preferredGatcId: gatcId,
          status: APPLICATION_STATUS.SUBMITTED,
        }),
        Application.aggregate([
          {
            $match: {
              preferredGatcId: gatcId,
              assignedLmoId: { $ne: null },
              status: {
                $in: [
                  APPLICATION_STATUS.SCHEDULED,
                  APPLICATION_STATUS.IN_PROGRESS,
                  APPLICATION_STATUS.COMPLETED,
                ],
              },
            },
          },
          { $group: { _id: '$assignedLmoId', count: { $sum: 1 } } },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'lmo',
            },
          },
          { $unwind: '$lmo' },
          {
            $project: {
              _id: 0,
              lmoId: '$_id',
              lmoName: '$lmo.name',
              officerCode: '$lmo.officerCode',
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ]),
        // Certificates tied to this GATC via the Application -> Certificate chain
        Certificate.aggregate([
          {
            $lookup: {
              from: 'applications',
              localField: 'applicationId',
              foreignField: '_id',
              as: 'application',
            },
          },
          { $unwind: '$application' },
          {
            $match: {
              'application.preferredGatcId': gatcId,
              createdAt: { $gte: startOfMonth() },
            },
          },
          { $count: 'total' },
        ]),
      ]);

    return success(res, {
      pendingApplications,
      lmoWorkload: lmoWorkloadAgg,
      certificatesIssued: certificatesIssued[0]?.total || 0,
    });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/dashboard/admin                                        */
/* ------------------------------------------------------------------ */
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalGatcs,
      totalInstruments,
      applicationsByStatusAgg,
      certificatesIssuedThisMonth,
      rejectionsByDistrict,
      pendencyByDistrictCategory,
    ] = await Promise.all([
      User.countDocuments({}),
      GATC.countDocuments({}),
      Instrument.countDocuments({}),
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      Certificate.countDocuments({ createdAt: { $gte: startOfMonth() } }),
      // Enforcement / rejection stats by district (joins Application -> applicant's state/district)
      Application.aggregate([
        { $match: { status: APPLICATION_STATUS.REJECTED } },
        {
          $lookup: {
            from: 'users',
            localField: 'applicantId',
            foreignField: '_id',
            as: 'applicant',
          },
        },
        { $unwind: '$applicant' },
        {
          $group: {
            _id: '$applicant.district',
            rejectedCount: { $sum: 1 },
          },
        },
        { $project: { _id: 0, district: '$_id', rejectedCount: 1 } },
        { $sort: { rejectedCount: -1 } },
      ]),
      // Pendency heatmap: district x instrument category, for non-terminal statuses
      Application.aggregate([
        {
          $match: {
            status: {
              $in: [
                APPLICATION_STATUS.SUBMITTED,
                APPLICATION_STATUS.SCHEDULED,
                APPLICATION_STATUS.IN_PROGRESS,
              ],
            },
          },
        },
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
        {
          $group: {
            _id: {
              district: '$applicant.district',
              category: '$instrument.category',
            },
            pendingCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            district: '$_id.district',
            category: '$_id.category',
            pendingCount: 1,
          },
        },
        { $sort: { pendingCount: -1 } },
      ]),
    ]);

    const applicationsByStatus = applicationsByStatusAgg.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    return success(res, {
      totalUsers,
      totalGatcs,
      totalInstruments,
      applicationsByStatus,
      certificatesIssuedThisMonth,
      // Extra fields beyond the base contract — additive, not a rename of
      // any documented key, per Section 9 ("add to a new file it owns").
      rejectionsByDistrict,
      pendencyHeatmap: pendencyByDistrictCategory,
    });
  } catch (err) {
    next(err);
  }
};
