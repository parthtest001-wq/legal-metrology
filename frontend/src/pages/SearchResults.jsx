/**
 * Module 6 — /frontend/src/pages/SearchResults.jsx
 *
 * Sits directly under /pages (not under a role subfolder) since it is a
 * single shared page reused by every role, filtered server-side by the
 * requester's own permissions (Section 4: consumer sees own records,
 * lmo sees assigned, gatc sees own center, admin sees all). This is an
 * additive extension of the pages/ tree, not a restructuring of it.
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/common/AppLayout';
import SearchBar from '../components/dashboard/SearchBar';
import searchService from '../services/searchService';

const COLUMNS = {
  application: [
    ['applicationNumber', 'Application #'],
    ['type', 'Type'],
    ['status', 'Status'],
  ],
  certificate: [
    ['certificateNumber', 'Certificate #'],
    ['status', 'Status'],
    ['validUntil', 'Valid Until'],
  ],
  instrument: [
    ['serialNumber', 'Serial #'],
    ['category', 'Category'],
    ['status', 'Status'],
  ],
  user: [
    ['name', 'Name'],
    ['email', 'Email'],
    ['role', 'Role'],
  ],
};

function cellValue(row, key) {
  const v = row[key];
  if (v === undefined || v === null) return '—';
  if (key === 'validUntil' || key === 'submittedAt') {
    return new Date(v).toLocaleDateString();
  }
  return String(v).replace(/_/g, ' ');
}

export default function SearchResults() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ type: 'application', q: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canExport = user?.role === 'admin' || user?.role === 'gatc';

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchService.search(filters);
      setResults(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      await searchService.exportResults({ ...filters, format });
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const columns = COLUMNS[filters.type] || [];

  return (
    <AppLayout title="Search">
      <div className="space-y-4">
        <SearchBar
          filters={filters}
          onChange={setFilters}
          onSubmit={runSearch}
          canExport={canExport}
          onExport={handleExport}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-slate-400">Searching…</p>}

        {!loading && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  {columns.map(([key, label]) => (
                    <th key={key} className="py-2 px-4">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-sm text-slate-400"
                    >
                      No results yet — run a search above.
                    </td>
                  </tr>
                ) : (
                  results.map((row) => (
                    <tr key={row._id} className="border-b border-slate-100 last:border-0">
                      {columns.map(([key]) => (
                        <td key={key} className="py-2 px-4 font-mono text-xs">
                          {cellValue(row, key)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
