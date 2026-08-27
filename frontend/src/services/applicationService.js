// /frontend/src/services/applicationService.js
// Owned by Module 2. Uses the shared Axios instance from services/api.js.

import api from './api';

// payload: {instrumentId, type, preferredGatcId, remarks?}
// documentFiles: array of File objects
export async function createApplication(payload, documentFiles = []) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  documentFiles.forEach((file) => formData.append('documents', file));

  const res = await api.post('/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.application;
}

// filters: {status?, type?, gatcId?, district?, instrumentCategory?, dateFrom?, dateTo?}
export async function listApplications(filters = {}) {
  const res = await api.get('/applications', { params: filters });
  return res.data.data.applications;
}

export async function getApplication(id) {
  const res = await api.get(`/applications/${id}`);
  return res.data.data.application;
}

export async function cancelApplication(id) {
  const res = await api.patch(`/applications/${id}/cancel`);
  return res.data.data.application;
}

// Extension endpoint — see backend/routes/application.routes.js comment.
export async function editApplication(id, payload = {}, newDocumentFiles = []) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  newDocumentFiles.forEach((file) => formData.append('documents', file));

  const res = await api.patch(`/applications/${id}/edit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.application;
}
