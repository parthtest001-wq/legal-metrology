// /backend/controllers/instrument.controller.js
// Owned by Module 2.

const Instrument = require('../models/Instrument');
const apiResponse = require('../utils/apiResponse');
const { ROLES, INSTRUMENT_CATEGORY } = require('../../shared/constants');

// POST /api/v1/instruments — role: consumer
// Body: {category, make, model, serialNumber, capacity, unit, manufacturingYear}
// + photo files (multipart, field "photos")
exports.createInstrument = async (req, res, next) => {
  try {
    const { category, make, model, serialNumber, capacity, unit, manufacturingYear } =
      req.body;

    if (!category || !make || !model || !serialNumber) {
      return apiResponse.error(
        res,
        'category, make, model and serialNumber are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!Object.values(INSTRUMENT_CATEGORY).includes(category)) {
      return apiResponse.error(
        res,
        `Invalid category. Allowed: ${Object.values(INSTRUMENT_CATEGORY).join(', ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    const existing = await Instrument.findOne({ serialNumber });
    if (existing) {
      return apiResponse.error(
        res,
        'An instrument with this serial number already exists',
        409,
        'DUPLICATE_SERIAL_NUMBER'
      );
    }

    const photos = (req.files || []).map((f) => f.path); // Cloudinary secure URL

    const instrument = await Instrument.create({
      ownerId: req.user.id,
      category,
      make,
      model,
      serialNumber,
      capacity: capacity !== undefined ? Number(capacity) : undefined,
      unit,
      manufacturingYear: manufacturingYear ? Number(manufacturingYear) : undefined,
      photos,
    });

    return apiResponse.success(res, { instrument }, 'Instrument registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/instruments — role: consumer (own), admin, lmo
// query: ownerId?, category?, status?
exports.listInstruments = async (req, res, next) => {
  try {
    const { ownerId, category, status } = req.query;
    const filter = {};

    if (req.user.role === ROLES.CONSUMER) {
      // Consumers may only ever see their own instruments, regardless of
      // what ownerId they pass in the query string.
      filter.ownerId = req.user.id;
    } else if (ownerId) {
      filter.ownerId = ownerId;
    }

    if (category) filter.category = category;
    if (status) filter.status = status;

    const instruments = await Instrument.find(filter).sort({ createdAt: -1 });

    return apiResponse.success(res, { instruments });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/instruments/:id — role: consumer (own), admin, lmo, gatc
exports.getInstrument = async (req, res, next) => {
  try {
    const instrument = await Instrument.findById(req.params.id);
    if (!instrument) {
      return apiResponse.error(res, 'Instrument not found', 404, 'NOT_FOUND');
    }

    if (
      req.user.role === ROLES.CONSUMER &&
      String(instrument.ownerId) !== String(req.user.id)
    ) {
      return apiResponse.error(res, 'Not authorized to view this instrument', 403, 'FORBIDDEN');
    }

    return apiResponse.success(res, { instrument });
  } catch (err) {
    next(err);
  }
};
