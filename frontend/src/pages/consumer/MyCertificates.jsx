/**
 * pages/consumer/MyCertificates.jsx
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Lists all certificates belonging to the logged-in consumer, via the
 * additive GET /api/v1/certificates endpoint (see certificateService.js).
 */

import { useEffect, useState } from 'react';
import CertificateCard from '../../components/certificate/CertificateCard';
import { listMyCertificates } from '../../services/certificateService';

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listMyCertificates()
      .then((res) => {
        if (!cancelled) setCertificates(res.data.certificates || []);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load your certificates.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Certificates</h1>

      {loading && <p className="text-gray-500">Loading…</p>}
      {loadError && <p className="text-red-600">{loadError}</p>}

      {!loading && !loadError && certificates.length === 0 && (
        <p className="text-gray-500">
          You don't have any certificates yet. Once your instrument passes verification, its
          certificate will appear here.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <CertificateCard key={cert._id} certificate={cert} />
        ))}
      </div>
    </div>
  );
}
