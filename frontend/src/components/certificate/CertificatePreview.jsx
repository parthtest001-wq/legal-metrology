/**
 * components/certificate/CertificatePreview.jsx
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Detail/preview view for a single certificate: instrument + validity
 * summary, embedded QR code, and a "Download PDF" action.
 */

import { useState } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import { downloadCertificatePdf } from '../../services/certificateService';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-amber-100 text-amber-700',
  revoked: 'bg-red-100 text-red-700',
};

export default function CertificatePreview({ certificate }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  if (!certificate) return null;

  const statusClass = STATUS_STYLES[certificate.status] || 'bg-gray-100 text-gray-700';

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadCertificatePdf(certificate._id, certificate.certificateNumber);
    } catch (err) {
      setDownloadError('Could not download the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{certificate.certificateNumber}</h2>
          <p className="text-sm text-gray-500">Digital Certificate of Verification</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusClass}`}>
          {certificate.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        <div className="space-y-2 text-sm">
          <Row label="Issue Date" value={new Date(certificate.issueDate).toLocaleDateString('en-IN')} />
          <Row label="Valid Until" value={new Date(certificate.validUntil).toLocaleDateString('en-IN')} />
          <Row label="Application ID" value={String(certificate.applicationId)} />
          <Row label="Instrument ID" value={String(certificate.instrumentId)} />
        </div>

        <div className="flex flex-col items-center gap-3">
          <QRCodeDisplay qrCodeUrl={certificate.qrCodeUrl} />
          <p className="text-xs text-gray-400 text-center">Scan to verify authenticity</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full sm:w-auto self-start bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 rounded-md transition-colors"
        >
          {downloading ? 'Preparing PDF…' : 'Download PDF'}
        </button>
        {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
