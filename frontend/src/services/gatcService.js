// /frontend/src/services/gatcService.js
// Admin GATC-management UI support. Uses the shared Axios instance from
// services/api.js (Section 6) — does not create its own instance. Backend
// routes consumed here (GET /gatc, POST /gatc, PATCH /gatc/:id/approve)
// already exist in backend/routes/gatc.routes.js /
// controllers/gatc.controller.js; this file only adds the missing frontend
// consumer for them.

import api from './api';

// filters: {state?, approvalStatus?}
export async function listGatcs(filters = {}) {
  const res = await api.get('/gatc', { params: filters });
  return res.data.data.gatcs;
}

// payload: {name, registrationNumber, address, state, district, contactEmail?, contactPhone?}
export async function createGatc(payload) {
  const res = await api.post('/gatc', payload);
  return res.data.data.gatc;
}

// approvalStatus: 'pending' | 'approved' | 'suspended'
export async function setGatcApprovalStatus(id, approvalStatus) {
  const res = await api.patch(`/gatc/${id}/approve`, { approvalStatus });
  return res.data.data.gatc;
}

export default { listGatcs, createGatc, setGatcApprovalStatus };
