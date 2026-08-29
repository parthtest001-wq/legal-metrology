/**
 * components/certificate/CertificateCard.jsx
 * Owned by: Module 4 — Digital Certificate Generation
 */

import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-amber-100 text-amber-700',
  revoked: 'bg-red-100 text-red-700',
};

export default function CertificateCard({ certificate }) {
  const statusClass = STATUS_STYLES[certificate.status] || 'bg-gray-100 text-gray-700';

  return (
    <Link
      to={`/consumer/certificates/${certificate._id}`}
      className="block rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow bg-white"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{certificate.certificateNumber}</p>
          <p className="text-sm text-gray-500 mt-1">
            Issued {new Date(certificate.issueDate).toLocaleDateString('en-IN')}
          </p>
          <p className="text-sm text-gray-500">
            Valid until {new Date(certificate.validUntil).toLocaleDateString('en-IN')}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusClass}`}>
          {certificate.status}
        </span>
      </div>
    </Link>
  );
}
