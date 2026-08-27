/**
 * FieldPhotoCapture.jsx
 * Owned by: Module 7
 * Location matches Master Spec §9: components/application/, namespaced Field*.jsx
 *
 * Lets an LMO capture supporting photos with the device camera (or pick from
 * gallery as a fallback) for a verification observation. Uses the native
 * <input type="file" capture="environment"> approach — no extra npm
 * dependency required, works inside any mobile browser / installed PWA.
 */
import { useCallback, useRef, useState } from 'react';
import { fileToDataUrl } from '../../services/offlineQueueService';

/**
 * @param {{ photos: Array<{id:string,name:string,type:string,dataUrl:string,file:File}>,
 *           onChange: (photos: Array) => void, maxPhotos?: number }} props
 */
export default function FieldPhotoCapture({ photos, onChange, maxPhotos = 6 }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  const handleFiles = useCallback(
    async (fileList) => {
      setError('');
      const incoming = Array.from(fileList || []);
      if (photos.length + incoming.length > maxPhotos) {
        setError(`You can attach at most ${maxPhotos} photos.`);
        return;
      }
      const additions = await Promise.all(
        incoming.map(async (file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: file.type || 'image/jpeg',
          dataUrl: await fileToDataUrl(file),
          file,
        }))
      );
      onChange([...photos, ...additions]);
    },
    [photos, onChange, maxPhotos]
  );

  const removePhoto = (id) => onChange(photos.filter((p) => p.id !== id));

  return (
    <div className="field-photo-capture">
      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((p) => (
          <div key={p.id} className="relative w-20 h-20 rounded overflow-hidden border">
            <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(p.id)}
              aria-label={`Remove ${p.name}`}
              className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
        disabled={photos.length >= maxPhotos}
      >
        📷 Capture Photo
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
