/**
 * Module 6 — Role-based Dashboards, Search & Export
 * /backend/controllers/search.controller.js
 *
 * OWNERSHIP: Module 6. Imports Application/Certificate/Instrument/User
 * models read-only. Does not redefine any schema.
 */

const Application = require('../models/Application');
const Certificate = require('../models/Certificate');
const Instrument = require('../models/Instrument');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const { toCsv, buildCertificateListPdf } = require('../utils/exportUtils');

const SEARCHABLE_TYPES = ['instrument', 'application', 'certificate', 'user'];

/**
 * Builds a Mongo filter shared by both /search and /search/export from the
 * common query params: instrumentCategory, district, status, dateFrom,
 * dateTo, certificateNumber, q.
 */
async function buildFilter(type, query) {
  const {
    q,
    instrumentCategory,
    district,
    status,
    dateFrom,
    dateTo,
    certificateNumber,
  } = query;

  const dateRange = {};
  if (dateFrom) dateRange.$gte = new Date(dateFrom);
  if (dateTo) dateRange.$lte = new Date(dateTo);

  if (type === 'application') {
    const filter = {};
    if (status) filter.status = status;
    if (Object.keys(dateRange).length) filter.submittedAt = dateRange;
    if (q) filter.applicationNumber = { $regex: q, $options: 'i' };

    if (instrumentCategory || district) {
      const instrumentQuery = {};
      if (instrumentCategory) instrumentQuery.category = instrumentCategory;
      const instrumentIds = await Instrument.find(instrumentQuery).select('_id');
      filter.instrumentId = { $in: instrumentIds.map((i) => i._id) };
    }

    if (district) {
      const usersInDistrict = await User.find({ district }).select('_id');
      const ids = usersInDistrict.map((u) => u._id);
      filter.applicantId = filter.applicantId
        ? { $in: filter.applicantId.$in.filter((id) => ids.includes(id)) }
        : { $in: ids };
    }
    return filter;
  }

  if (type === 'certificate') {
    const filter = {};
    if (status) filter.status = status;
    if (certificateNumber)
      filter.certificateNumber = { $regex: certificateNumber, $options: 'i' };
    if (q && !certificateNumber)
      filter.certificateNumber = { $regex: q, $options: 'i' };
    if (Object.keys(dateRange).length) filter.issueDate = dateRange;
    return filter;
  }

  if (type === 'instrument') {
    const filter = {};
    if (instrumentCategory) filter.category = instrumentCategory;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { serialNumber: { $regex: q, $options: 'i' } },
        { registrationNumber: { $regex: q, $options: 'i' } },
        { make: { $regex: q, $options: 'i' } },
        { model: { $regex: q, $options: 'i' } },
      ];
    }
    if (district) {
      const usersInDistrict = await User.find({ district }).select('_id');
      filter.ownerId = { $in: usersInDistrict.map((u) => u._id) };
    }
    return filter;
  }

  if (type === 'user') {
    const filter = {};
    if (district) filter.district = district;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }
    return filter;
  }

  return {};
}

/** Restricts a raw filter according to the requester's role/ownership. */
function scopeToRole(type, filter, user) {
  if (user.role === 'admin') return filter;

  if (type === 'application') {
    if (user.role === 'consumer') return { ...filter, applicantId: user.id };
    if (user.role === 'lmo') return { ...filter, assignedLmoId: user.id };
    // gatc scoping is applied by caller after fetching gatcId
  }
  if (type === 'instrument' && user.role === 'consumer') {
    return { ...filter, ownerId: user.id };
  }
  return filter;
}

async function runSearch(type, query, user) {
  let filter = await buildFilter(type, query);
  filter = scopeToRole(type, filter, user);

  if (type === 'application' && user.role === 'gatc') {
    const requester = await User.findById(user.id).select('gatcId');
    filter.preferredGatcId = requester?.gatcId;
  }

  const models = {
    instrument: Instrument,
    application: Application,
    certificate: Certificate,
    user: User,
  };

  const Model = models[type];
  let cursor = Model.find(filter).limit(200).sort({ createdAt: -1 });

  if (type === 'application') {
    cursor = cursor
      .populate('instrumentId', 'category make model serialNumber')
      .populate('applicantId', 'name district state');
  }
  if (type === 'certificate') {
    cursor = cursor.populate('instrumentId', 'category make model serialNumber');
  }
  if (type === 'user') {
    cursor = cursor.select('-passwordHash');
  }

  return cursor;
}

/* ------------------------------------------------------------------ */
/* GET /api/v1/search                                                  */
/* ------------------------------------------------------------------ */
exports.search = async (req, res, next) => {
  try {
    const { type } = req.query;
    if (!type || !SEARCHABLE_TYPES.includes(type)) {
      return error(
        res,
        `type must be one of: ${SEARCHABLE_TYPES.join(', ')}`,
        400,
        'INVALID_TYPE'
      );
    }
    if ((type === 'user' || type === 'instrument') &&
        !['admin', 'gatc', 'lmo'].includes(req.user.role) &&
        type === 'user') {
      return error(res, 'Not authorized to search users', 403, 'FORBIDDEN');
    }

    const results = await runSearch(type, req.query, req.user);
    return success(res, { results });
  } catch (err) {
    next(err);
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/v1/search/export  (admin, gatc)                            */
/* ------------------------------------------------------------------ */
exports.exportSearch = async (req, res, next) => {
  try {
    const { type, format = 'csv' } = req.query;
    if (!type || !SEARCHABLE_TYPES.includes(type)) {
      return error(
        res,
        `type must be one of: ${SEARCHABLE_TYPES.join(', ')}`,
        400,
        'INVALID_TYPE'
      );
    }

    const results = await runSearch(type, req.query, req.user);

    if (format === 'pdf') {
      if (type !== 'certificate') {
        return error(
          res,
          'PDF export is only supported for type=certificate',
          400,
          'UNSUPPORTED_FORMAT'
        );
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="certificate-list.pdf"'
      );
      const doc = buildCertificateListPdf(results);
      doc.pipe(res);
      doc.end();
      return;
    }

    // default: csv
    const csv = toCsv(type, results);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type}-export.csv"`
    );
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};
