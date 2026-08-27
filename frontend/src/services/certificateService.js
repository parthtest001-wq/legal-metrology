/**
 * services/certificateService.js
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Imports the SHARED Axios instance from services/api.js (owned by Module 1
 * / shared infra) — this file creates no Axios instance or fetch wrapper of
 * its own, per Section 6.
 */

import api from './api';

const BASE = '/certificates';

/**
 * LMO action: generate a certificate for an application whose verification
 * record already has overallResult === 'pass'.
 */
export function generateCertificate(applicationId) {
  return api.post(`${BASE}/${applicationId}/generate`).then((res) => res.data);
}

/**
 * List certificates visible to the current user (own certs for a consumer,
 * issued certs for an lmo, etc). ADDITIVE endpoint — see backend
 * certificate.controller.js `listMyCertificates` for rationale; not in the
 * frozen Section 4 table.
 */
export function listMyCertificates() {
  return api.get(BASE).then((res) => res.data);
}

/**
 * Fetch a single certificate by its Mongo _id.
 */
export function getCertificateById(certificateId) {
  return api.get(`${BASE}/${certificateId}`).then((res) => res.data);
}

/**
 * Download the certificate PDF as a Blob and trigger a browser download.
 * Requires auth (consumer/lmo/gatc/admin) — uses the shared Axios instance
 * so the Authorization header is attached automatically.
 */
export async function downloadCertificatePdf(certificateId, certificateNumber) {
  const response = await api.get(`${BASE}/${certificateId}/download`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${certificateNumber || 'certificate'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * PUBLIC verification lookup — no auth header required. Still goes through
 * the shared `api` instance; the interceptor simply won't find a token to
 * attach for an unauthenticated visitor, which is fine since this route
 * doesn't require one.
 */
export function verifyCertificatePublic(certificateNumber) {
  return api.get(`${BASE}/verify/${certificateNumber}`).then((res) => res.data);
}

/**
 * Admin action: revoke a certificate with a reason.
 */
export function revokeCertificate(certificateId, reason) {
  return api.patch(`${BASE}/${certificateId}/revoke`, { reason }).then((res) => res.data);
}

export default {
  generateCertificate,
  listMyCertificates,
  getCertificateById,
  downloadCertificatePdf,
  verifyCertificatePublic,
  revokeCertificate,
};
