/**
 * UpcomingRenewals.jsx
 * Owned by: Module 5
 *
 * NOTE: not listed by name in Master Spec Section 9's Module 5 file list
 * (only NotificationBell.jsx is named there), but it lives in the same
 * components/common/ folder Module 5 already owns files in, uses only
 * Module 5's own alertService, and reads Module 4's Certificate data
 * read-only via the existing GET /api/v1/alerts/expiring-certificates
 * endpoint (no new backend route). Safe for Module 6 dashboards to import
 * without modification, same pattern as NotificationBell.
 *
 * Props:
 *   withinDays (number, default 30) — how far ahead to look
 *   title (string, optional) — heading override
 */

import React, { useEffect, useState } from 'react';
import alertService from '../../services/alertService';

function daysLeft(validUntil) {
  const ms = new Date(validUntil).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function urgencyClass(days) {
  if (days <= 7) return 'text-red-600 bg-red-50';
  if (days <= 15) return 'text-amber-600 bg-amber-50';
  return 'text-blue-600 bg-blue-50';
}

export default function UpcomingRenewals({ withinDays = 30, title = 'Upcoming Renewals' }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await alertService.getExpiringCertificates(withinDays);
        if (isMounted) {
          setCertificates(res.data?.certificates || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Could not load upcoming renewals');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [withinDays]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-400">next {withinDays} days</span>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && certificates.length === 0 && (
        <p className="text-sm text-gray-500">Nothing expiring soon.</p>
      )}

      {!loading && !error && certificates.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {certificates.map((cert) => {
            const d = daysLeft(cert.validUntil);
            return (
              <li key={cert._id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{cert.certificateNumber}</p>
                  <p className="text-xs text-gray-500">
                    Expires {new Date(cert.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgencyClass(d)}`}>
                  {d <= 0 ? 'Expired' : `${d}d left`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
