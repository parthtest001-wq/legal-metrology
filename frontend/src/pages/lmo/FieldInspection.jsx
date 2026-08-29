/**
 * pages/lmo/FieldInspection.jsx
 * Owned by: Module 7 (see placement note in FieldQueue.jsx)
 *
 * Combines the "Inspection Detail" and "Record Observation" screens: shows
 * application/instrument context, then the observation form. After a
 * successful submit (online or queued offline) it shows a confirmation and
 * a link back to the queue.
 */
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import FieldApplicationDetail from '../../components/scheduling/FieldApplicationDetail';
import FieldInspectionForm from '../../components/application/FieldInspectionForm';
import FieldSyncStatusBadge from '../../components/scheduling/FieldSyncStatusBadge';

export default function FieldInspection() {
  const { applicationId } = useParams();
  const [submittedMode, setSubmittedMode] = useState(null); // 'online' | 'offline' | null
  const [certificateId, setCertificateId] = useState(null);

  return (
    <div className="field-inspection-page max-w-2xl mx-auto p-4 space-y-4">
      <FieldSyncStatusBadge />

      {submittedMode ? (
        <div className="border rounded p-4 space-y-2">
          <p className="font-medium">
            {submittedMode === 'online'
              ? '✅ Inspection submitted.'
              : '📥 Offline — inspection queued and will sync automatically.'}
          </p>
          {submittedMode === 'online' && certificateId && (
            <Link to={`/lmo/certificates/${certificateId}`} className="text-blue-600 underline text-sm block">
              View certificate &amp; QR code
            </Link>
          )}
          {submittedMode === 'offline' && (
            <p className="text-sm text-gray-500">
              If this inspection passes, its certificate will be generated once it syncs.
            </p>
          )}
          <Link to="/lmo/field" className="text-blue-600 underline text-sm">
            Back to My Queue
          </Link>
        </div>
      ) : (
        <FieldApplicationDetail applicationId={applicationId}>
          <FieldInspectionForm
            applicationId={applicationId}
            onSubmitted={(mode, certId) => {
              setSubmittedMode(mode);
              setCertificateId(certId || null);
            }}
          />
        </FieldApplicationDetail>
      )}
    </div>
  );
}
