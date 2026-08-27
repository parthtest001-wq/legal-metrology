// /frontend/src/services/schedulingService.js
// Owned by Module 3. Imports the shared Axios instance from api.js
// (owned by Module 1) — does not create its own Axios instance or fetch wrapper.

import api from './api';

const schedulingService = {
  // Admin/GATC: assign a submitted application to an LMO with a scheduled date
  assignApplication: (applicationId, { assignedLmoId, scheduledDate }) =>
    api
      .patch(`/scheduling/applications/${applicationId}/assign`, {
        assignedLmoId,
        scheduledDate,
      })
      .then((res) => res.data),

  // LMO (self) / admin: get an LMO's allocated inspection queue
  getLmoQueue: (lmoId, { date } = {}) =>
    api
      .get(`/scheduling/lmo/${lmoId}/queue`, { params: { date } })
      .then((res) => res.data),

  // LMO / GATC / admin: move an application through a manual status transition
  updateApplicationStatus: (applicationId, status) =>
    api
      .patch(`/scheduling/applications/${applicationId}/status`, { status })
      .then((res) => res.data),

  // LMO: submit inspection observations and result.
  // photos is an array of File objects (optional).
  recordVerification: (applicationId, { inspectionDate, observations, overallResult, remarks, photos }) => {
    const form = new FormData();
    form.append('inspectionDate', inspectionDate);
    form.append('observations', JSON.stringify(observations || []));
    form.append('overallResult', overallResult);
    if (remarks) form.append('remarks', remarks);
    (photos || []).forEach((file) => form.append('photos', file));

    return api
      .post(`/verification/${applicationId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  // consumer (own) / lmo / gatc / admin: fetch a verification record
  getVerification: (applicationId) =>
    api.get(`/verification/${applicationId}`).then((res) => res.data),
};

export default schedulingService;
