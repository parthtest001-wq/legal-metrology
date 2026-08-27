require('dotenv').config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Warning: ${name} is not set and has no fallback.`);
  }
  return val;
}

module.exports = {
  PORT: required('PORT', 5000),
  MONGO_URI: required('MONGO_URI', 'mongodb://localhost:27017/legal_metrology'),
  JWT_SECRET: required('JWT_SECRET', 'replace_with_real_secret'),
  JWT_EXPIRES_IN: required('JWT_EXPIRES_IN', '7d'),
  NODE_ENV: required('NODE_ENV', 'development'),
  CLOUDINARY_CLOUD_NAME: required('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: required('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: required('CLOUDINARY_API_SECRET'),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  CERT_VALIDITY_YEARS: required('CERT_VALIDITY_YEARS', 1),
  FRONTEND_URL: required('FRONTEND_URL', 'http://localhost:5173'),
};
