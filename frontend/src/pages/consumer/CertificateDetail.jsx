/**
 * pages/consumer/CertificateDetail.jsx
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Route: /certificates/:id (see AppRoutes.jsx note in deliverables list).
 * Placed under pages/consumer/ since a consumer viewing their own
 * certificate is the primary use case; the same page component works for
 * lmo/gatc/admin sessions too since the backend authorizes by role.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CertificatePreview from '../../components/certificate/CertificatePreview';
import { getCertificateById } from '../../services/certificateService';

export default function CertificateDetail() {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCertificateById(id)
      .then((res) => {
        if (!cancelled) setCertificate(res.data.certificate);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this certificate. It may not exist, or you may not have access.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="px-4 py-8">
      {loading && <p className="text-center text-gray-500">Loading…</p>}
      {loadError && <p className="text-center text-red-600">{loadError}</p>}
      {!loading && !loadError && <CertificatePreview certificate={certificate} />}
    </div>
  );
}
