// /backend/middleware/upload.middleware.js
// Owned by Module 2. Cloud storage via Cloudinary (multer-storage-cloudinary).
// Files are uploaded straight to Cloudinary — nothing is written to local
// disk, so uploads survive Render redeploys (free tier has no persistent disk).

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require('../config/env');

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE_MB = 5;

// Cloudinary folder per upload type, mirroring the old local subfolders
// (instruments / applications) so records stay organized in the dashboard.
function makeStorage(folder) {
  return new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder: `legal-metrology/${folder}`,
      // PDFs (e.g. scanned documents) must upload as 'raw' resource_type;
      // images upload as 'image' so Cloudinary can transform/optimize them.
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    }),
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME.join(', ')}`
      )
    );
  }
  cb(null, true);
}

// Used by POST /api/v1/instruments — field name "photos", up to 5 files
const uploadInstrumentPhotos = multer({
  storage: makeStorage('instruments'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).array('photos', 5);

// Used by POST /api/v1/applications — field name "documents", up to 5 files
const uploadApplicationDocuments = multer({
  storage: makeStorage('applications'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).array('documents', 5);

// MERGE FIX: Module 3's verification.routes.js imports this whole module as
// `upload` and calls `upload.array('photos', 10)` — but this file only ever
// exported two purpose-bound middlewares (uploadInstrumentPhotos,
// uploadApplicationDocuments), neither of which has an `.array()` method.
// That crashed at route-registration time (`upload.array is not a
// function`), taking the whole server down at boot. VerificationRecord.photos
// (Section 3.5) is grouped under the same Cloudinary "applications" folder
// as Application.documents, using the field name Module 3's frontend already
// sends ("photos", up to 10 files).
const uploadVerificationPhotos = multer({
  storage: makeStorage('applications'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).array('photos', 10);

// Wrap multer calls so Multer/Cloudinary errors flow through the
// centralized error.middleware.js instead of crashing the request
// (Section 5 rule).
function wrap(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  };
}

module.exports = {
  uploadInstrumentPhotos: wrap(uploadInstrumentPhotos),
  uploadApplicationDocuments: wrap(uploadApplicationDocuments),
  uploadVerificationPhotos: wrap(uploadVerificationPhotos),
};
