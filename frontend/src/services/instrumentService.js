// /frontend/src/services/instrumentService.js
// Owned by Module 2. Uses the shared Axios instance from services/api.js —
// never creates its own Axios/fetch wrapper (Section 6 rule).

import api from './api';

// Create a new instrument. `payload` is a plain object of scalar fields;
// `photoFiles` is an array of File objects from an <input type="file multiple">.
export async function createInstrument(payload, photoFiles = []) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  photoFiles.forEach((file) => formData.append('photos', file));

  const res = await api.post('/instruments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.instrument;
}

export async function listInstruments(filters = {}) {
  const res = await api.get('/instruments', { params: filters });
  return res.data.data.instruments;
}

export async function getInstrument(id) {
  const res = await api.get(`/instruments/${id}`);
  return res.data.data.instrument;
}
