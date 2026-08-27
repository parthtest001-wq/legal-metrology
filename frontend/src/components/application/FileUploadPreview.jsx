// /frontend/src/components/application/FileUploadPreview.jsx
// Owned by Module 2. Generic multi-file picker with thumbnail preview,
// reused by both the instrument-photo step and the documents step of the
// New Application form.

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const ACCEPTED = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_FILES = 5;
const MAX_SIZE_MB = 5;

export default function FileUploadPreview({ label, hint, files, onChange }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const urls = files.map((file) =>
      file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    );
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  function handlePick(e) {
    const picked = Array.from(e.target.files || []);
    const combined = [...files, ...picked];

    if (combined.length > MAX_FILES) {
      setError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    const tooLarge = picked.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      setError(`"${tooLarge.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
      return;
    }

    setError('');
    onChange(combined);
    e.target.value = ''; // allow re-picking the same file name
  }

  function removeAt(index) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        <span className="text-xs text-slate-400">
          {files.length}/{MAX_FILES}
        </span>
      </div>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700"
      >
        <span aria-hidden>⬆</span>
        Click to upload photos or PDF documents
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={handlePick}
        className="hidden"
      />

      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              {previews[i] ? (
                <img src={previews[i]} alt={file.name} className="h-24 w-full object-cover" />
              ) : (
                <div className="flex h-24 w-full flex-col items-center justify-center bg-slate-100 text-slate-500">
                  <span className="text-lg">📄</span>
                  <span className="px-1 text-[10px]">PDF</span>
                </div>
              )}
              <p className="truncate px-2 py-1 text-[11px] text-slate-600">{file.name}</p>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

FileUploadPreview.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  files: PropTypes.arrayOf(PropTypes.instanceOf(File)).isRequired,
  onChange: PropTypes.func.isRequired,
};
