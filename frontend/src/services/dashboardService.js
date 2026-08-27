/**
 * Module 6 — /frontend/src/services/dashboardService.js
 * Imports the single shared Axios instance from services/api.js
 * (Section 6). Does NOT create its own Axios instance or fetch wrapper.
 */
import api from './api';

const dashboardService = {
  getConsumerDashboard: () => api.get('/dashboard/consumer').then((r) => r.data.data),
  getLmoDashboard: () => api.get('/dashboard/lmo').then((r) => r.data.data),
  getGatcDashboard: () => api.get('/dashboard/gatc').then((r) => r.data.data),
  getAdminDashboard: () => api.get('/dashboard/admin').then((r) => r.data.data),
};

export default dashboardService;
