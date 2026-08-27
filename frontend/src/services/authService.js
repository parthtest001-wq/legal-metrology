import api, { TOKEN_KEY } from './api';

export async function registerConsumer(payload) {
  const { data } = await api.post('/auth/register', { ...payload, role: 'consumer' });
  return data.data;
}

export async function registerLmo(payload) {
  const { data } = await api.post('/auth/register', { ...payload, role: 'lmo' });
  return data.data;
}

export async function registerGatc(payload) {
  const { data } = await api.post('/auth/register', { ...payload, role: 'gatc' });
  return data.data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  if (data.data?.token) {
    localStorage.setItem(TOKEN_KEY, data.data.token);
  }
  return data.data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}

export async function updateProfile(userId, payload) {
  const { data } = await api.put(`/users/${userId}`, payload);
  return data.data.user;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data.data;
}

export async function resetPassword(email, token, newPassword) {
  const { data } = await api.post('/auth/reset-password', { email, token, newPassword });
  return data.data;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
