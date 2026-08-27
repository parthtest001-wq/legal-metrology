/**
 * pages/public/VerifyCertificate.jsx
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * FOLDER NOTE: Section 2 of the Master Spec only lists
 * /frontend/src/pages/{consumer,lmo,gatc,admin}. A public, no-login
 * verification page doesn't fit any of those role folders, so this adds a
 * new `pages/public/` folder — a small, clearly-flagged deviation (not a
 * new TOP-LEVEL folder, which Section 2 explicitly forbids; this is one
 * level deeper, alongside the four existing role folders). Route this
 * component at `/verify/:certificateNumber` in AppRoutes.jsx, OUTSIDE
 * ProtectedRoute, since anyone scanning a QR code must be able to reach it
 * without a JWT.
 *
 * This is exactly the page the QR code (utils/qrGenerator.js) points to. On
 * load it calls the PUBLIC backend endpoint:
 * GET /api/v1/certificates/verify/:certificateNumber
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyCertificatePublic } from '../../services/certificateService';

export default function VerifyCertificate() {
  const { certificateNumber: routeCertNumber } = useParams();
  const [input, setInput] = useState(routeCertNumber || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  async function runVerification(certNumber) {
    if (!certNumber) return;
    setLoading(true);
    setSearchError(null);
    setResult(null);
    try {
      const res = await verifyCertificatePublic(certNumber);
      setResult(res.data);
    } catch (err) {
      setSearchError('Could not reach the verification service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (routeCertNumber) {
      runVerification(routeCertNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCertNumber]);

  function handleSubmit(e) {
    e.preventDefault();
    runVerification(input.trim());
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Verify a Certificate</h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Enter a certificate number, or scan the QR code on a printed certificate.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. CERT-2026-000123"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 rounded-md text-sm"
        >
          {loading ? 'Checking…' : 'Verify'}
        </button>
      </form>

      {searchError && <p className="text-red-600 text-sm text-center">{searchError}</p>}

      {result && (
        <div
          className={`rounded-lg border p-5 text-center ${
            result.isValid ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}
        >
          <p className={`text-lg font-bold ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
            {result.isValid ? '✓ Certificate is Genuine' : '✗ Certificate Not Valid'}
          </p>

          {result.certificate && (
            <div className="mt-4 text-sm text-left space-y-1 text-gray-700">
              <p>
                <span className="text-gray-500">Certificate No: </span>
                {result.certificate.certificateNumber}
              </p>
              <p>
                <span className="text-gray-500">Status: </span>
                <span className="capitalize">{result.certificate.status}</span>
              </p>
              <p>
                <span className="text-gray-500">Issued: </span>
                {new Date(result.certificate.issueDate).toLocaleDateString('en-IN')}
              </p>
              <p>
                <span className="text-gray-500">Valid Until: </span>
                {new Date(result.certificate.validUntil).toLocaleDateString('en-IN')}
              </p>
              {result.instrument && (
                <>
                  <p>
                    <span className="text-gray-500">Instrument: </span>
                    {result.instrument.make} {result.instrument.model} ({result.instrument.category})
                  </p>
                  {result.instrument.registrationNumber && (
                    <p>
                      <span className="text-gray-500">Registration No: </span>
                      {result.instrument.registrationNumber}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {!result.certificate && (
            <p className="text-sm text-gray-600 mt-2">
              No certificate exists with that number. Double-check the number and try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
