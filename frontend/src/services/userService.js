// /frontend/src/services/userService.js
// Admin user-management UI support. Uses the shared Axios instance from
// services/api.js (Section 6) — does not create its own instance. Backend
// routes consumed here (GET /users, PATCH /users/:id/status) already exist
// in backend/routes/user.routes.js / controllers/user.controller.js; this
// file only adds the missing frontend consumer for them.

import api from './api';

// filters: {role?, state?}
export async function listUsers(filters = {}) {
  const res = await api.get('/users', { params: filters });
  return res.data.data.users;
}

export async function setUserStatus(id, isActive) {
  const res = await api.patch(`/users/${id}/status`, { isActive });
  return res.data.data.user;
}

export default { listUsers, setUserStatus };
