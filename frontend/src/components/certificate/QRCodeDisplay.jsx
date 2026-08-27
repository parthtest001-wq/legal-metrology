/**
 * components/certificate/QRCodeDisplay.jsx
 * Owned by: Module 4 — Digital Certificate Generation
 *
 * Renders the certificate's QR code image. The image itself is generated
 * server-side (utils/qrGenerator.js) and served statically from
 * /backend/uploads/certificates — this component just points an <img> at it.
 */

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(
  '/api/v1',
  ''
);

export default function QRCodeDisplay({ qrCodeUrl, size = 160 }) {
  if (!qrCodeUrl) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 text-gray-400 text-sm rounded-md border border-dashed border-gray-300"
        style={{ width: size, height: size }}
      >
        QR pending
      </div>
    );
  }

  const src = qrCodeUrl.startsWith('http') ? qrCodeUrl : `${API_ORIGIN}${qrCodeUrl}`;

  return (
    <img
      src={src}
      alt="Certificate verification QR code"
      width={size}
      height={size}
      className="rounded-md border border-gray-200 bg-white p-2"
    />
  );
}
