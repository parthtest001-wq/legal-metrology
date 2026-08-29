// /backend/scripts/seedAdmin.js
// Run with `npm run seed:admin`. Creates one admin account if none exists.
// Admin accounts are intentionally NOT exposed via /api/v1/auth/register.

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../../shared/constants');

async function seed() {
  await connectDB();

  const existing = await User.findOne({ role: ROLES.ADMIN });
  if (existing) {
    console.log(`[seed] Admin already exists: ${existing.email}`);
    await mongoose.connection.close();
    return;
  }

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@legalmetrology.gov.in';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const admin = await User.create({
    name: 'System Administrator',
    email,
    phone: process.env.SEED_ADMIN_PHONE || '1111111111',
    passwordHash: password,
    role: ROLES.ADMIN,
    state: 'NA',
    district: 'NA',
  });

  console.log(`[seed] Admin created: ${admin.email} (change the password after first login)`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
