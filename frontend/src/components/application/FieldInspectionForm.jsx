/**
 * FieldInspectionForm.jsx
 * Owned by: Module 7
 * Location matches Master Spec §9: components/application/, namespaced Field*.jsx
 *
 * Implements the "Record Observation" screen content: a dynamic observations
 * table (parameter / expectedValue / observedValue / result), overall
 * result, remarks, and camera-captured supporting photos — matching the
 * VerificationRecord shape from Master Spec §3.5 and the request body of
 * POST /api/v1/verification/:applicationId from §4 (Module 3).
 *
 * Online  -> calls schedulingService.submitVerification() directly.
 * Offline -> calls offlineQueueService.enqueueInspection() and lets the
 *            Sync/Offline indicator (FieldSyncStatusBadge) replay it later.
 *
 * This component does not redefine VerificationRecord or touch Module 3's
 * controller/model — it only builds the exact request body §4 specifies.
 */
import { useState } from 'react';
import FieldPhotoCapture from './FieldPhotoCapture';
// MERGE FIX: same schedulingService bug as offlineQueueService.js — no
// named `submitVerification` export exists; the real (default-exported)
// method is `recordVerification`, taking one options object.
import schedulingService from '../../services/schedulingService';
import { generateCertificate } from '../../services/certificateService';
import { enqueueInspection } from '../../services/offlineQueueService';

const RESULT_OPTIONS = ['pass', 'fail'];

function emptyObservation() {
  return { parameter: '', expectedValue: '', observedValue: '', result: 'pass' };
}

/**
 * @param {{ applicationId: string, onSubmitted: (mode: 'online'|'offline') => void }} props
 */
export default function FieldInspectionForm({ applicationId, onSubmitted }) {
  const [inspectionDate] = useState(() => new Date().toISOString());
  const [observations, setObservations] = useState([emptyObservation()]);
  const [overallResult, setOverallResult] = useState('pass');
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const updateObservation = (idx, field, value) => {
    setObservations((prev) =>
      prev.map((obs, i) => (i === idx ? { ...obs, [field]: value } : obs))
    );
  };

  const addObservationRow = () => setObservations((prev) => [...prev, emptyObservation()]);
  const removeObservationRow = (idx) =>
    setObservations((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (observations.some((o) => !o.parameter || !o.observedValue)) {
      setErrorMsg('Every observation needs a parameter and an observed value.');
      return;
    }

    const payload = {
      inspectionDate,
      observations,
      overallResult,
      remarks,
    };

    setSubmitting(true);
    try {
      if (navigator.onLine) {
        const files = photos.map((p) => p.file);
        // MERGE FIX: recordVerification takes the payload fields plus
        // `photos` in a single object, not three positional args.
        await schedulingService.recordVerification(applicationId, { ...payload, photos: files });
        let certificateId = null;
        if (overallResult === 'pass') {
          try {
            const certRes = await generateCertificate(applicationId);
            certificateId = certRes?.data?.certificate?._id || null;
          } catch {
            // Verification itself succeeded; surface the cert gap via
            // onSubmitted rather than blocking the confirmation screen.
          }
        }
        onSubmitted('online', certificateId);
      } else {
        await enqueueInspection(
          applicationId,
          payload,
          photos.map(({ name, type, dataUrl }) => ({ name, type, dataUrl }))
        );
        onSubmitted('offline');
      }
    } catch (err) {
      // Network hiccups mid-submit (common in the field) fall back to the
      // offline queue instead of losing the LMO's work.
      if (!navigator.onLine || err?.code === 'ERR_NETWORK') {
        await enqueueInspection(
          applicationId,
          payload,
          photos.map(({ name, type, dataUrl }) => ({ name, type, dataUrl }))
        );
        onSubmitted('offline');
      } else {
        setErrorMsg(err?.response?.data?.message || 'Submission failed. Please retry.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="field-inspection-form space-y-4">
      <h2 className="text-lg font-semibold">Record Observation</h2>
      <p className="text-sm text-gray-500">
        Inspection date: {new Date(inspectionDate).toLocaleString()}
      </p>

      <div className="space-y-3">
        {observations.map((obs, idx) => (
          <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center border-b pb-2">
            <input
              className="border rounded px-2 py-1 col-span-2 sm:col-span-1"
              placeholder="Parameter"
              value={obs.parameter}
              onChange={(e) => updateObservation(idx, 'parameter', e.target.value)}
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Expected value"
              value={obs.expectedValue}
              onChange={(e) => updateObservation(idx, 'expectedValue', e.target.value)}
            />
            <input
              className="border rounded px-2 py-1"
              placeholder="Observed value"
              value={obs.observedValue}
              onChange={(e) => updateObservation(idx, 'observedValue', e.target.value)}
            />
            <select
              className="border rounded px-2 py-1"
              value={obs.result}
              onChange={(e) => updateObservation(idx, 'result', e.target.value)}
            >
              {RESULT_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeObservationRow(idx)}
              className="text-red-600 text-sm"
              disabled={observations.length === 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addObservationRow} className="text-blue-600 text-sm">
          + Add observation
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Overall result</label>
        <select
          className="border rounded px-2 py-1"
          value={overallResult}
          onChange={(e) => setOverallResult(e.target.value)}
        >
          {RESULT_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Remarks</label>
        <textarea
          className="border rounded px-2 py-1 w-full"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Supporting photos</label>
        <FieldPhotoCapture photos={photos} onChange={setPhotos} />
      </div>

      {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}
      {!navigator.onLine && (
        <p className="text-amber-600 text-sm">
          You're offline — this submission will be queued and synced automatically.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto px-4 py-2 rounded bg-green-700 text-white disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Inspection'}
      </button>
    </form>
  );
}
