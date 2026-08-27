/**
 * alertService.js
 * Owned by: Module 5
 *
 * Uses the single shared Axios instance from services/api.js (Section 6) —
 * does not create its own Axios instance or fetch wrapper.
 */

import api from './api';

const alertService = {
  // GET /api/v1/alerts
  getAlerts: (params = {}) => api.get('/alerts', { params }).then((res) => res.data),

  // PATCH /api/v1/alerts/:id/read
  markAsRead: (id) => api.patch(`/alerts/${id}/read`).then((res) => res.data),

  // GET /api/v1/alerts/expiring-certificates
  getExpiringCertificates: (withinDays = 30) =>
    api.get('/alerts/expiring-certificates', { params: { withinDays } }).then((res) => res.data),

  // POST /api/v1/alerts/trigger-check
  triggerCheck: () => api.post('/alerts/trigger-check').then((res) => res.data),

  // GET /api/v1/alerts/preferences  (extension — see alert.controller.js header)
  getPreferences: () => api.get('/alerts/preferences').then((res) => res.data),

  // PUT /api/v1/alerts/preferences  (extension — see alert.controller.js header)
  updatePreferences: (prefs) => api.put('/alerts/preferences', prefs).then((res) => res.data),
};

export default alertService;
