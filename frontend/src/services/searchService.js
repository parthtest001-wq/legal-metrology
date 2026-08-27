/**
 * Module 6 — /frontend/src/services/searchService.js
 * Imports the shared Axios instance from services/api.js (Section 6).
 */
import api from './api';

const searchService = {
  /**
   * @param {object} params { q, type, instrumentCategory, district,
   *   status, dateFrom, dateTo, certificateNumber }
   */
  search: (params) => api.get('/search', { params }).then((r) => r.data.data.results),

  /**
   * Triggers a file download for CSV/PDF export.
   * @param {object} params same as search() plus { format: 'csv'|'pdf' }
   */
  exportResults: async (params) => {
    const response = await api.get('/search/export', {
      params,
      responseType: 'blob',
    });
    const contentType = response.headers['content-type'] || '';
    const ext = contentType.includes('pdf') ? 'pdf' : 'csv';
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${params.type}-export.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default searchService;
