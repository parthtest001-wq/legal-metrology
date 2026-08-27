// /frontend/src/components/scheduling/InspectionForm.jsx
// Owned by Module 3.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import schedulingService from '../../services/schedulingService';

const emptyObservation = () => ({ parameter: '', expectedValue: '', observedValue: '', result: 'pass' });

export default function InspectionForm() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState([emptyObservation()]);
  const [overallResult, setOverallResult] = useState('pass');
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const updateObservation = (index, field, value) => {
    setObservations((prev) =>
      prev.map((obs, i) => (i === index ? { ...obs, [field]: value } : obs))
    );
  };

  const addObservation = () => setObservations((prev) => [...prev, emptyObservation()]);
  const removeObservation = (index) =>
    setObservations((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const incomplete = observations.some(
      (o) => !o.parameter || !o.expectedValue || !o.observedValue
    );
    if (incomplete) {
      setErrorMsg('Every observation row needs a parameter, expected value, and observed value.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await schedulingService.recordVerification(applicationId, {
        inspectionDate,
        observations,
        overallResult,
        remarks,
        photos,
      });
      if (result.success) {
        navigate(-1);
      } else {
        setErrorMsg(result.message || 'Failed to record inspection.');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to record inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Record Inspection</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Inspection Date</label>
        <input
          type="date"
          className="border rounded px-3 py-2 w-full"
          value={inspectionDate}
          onChange={(e) => setInspectionDate(e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Observations</label>
          <button type="button" onClick={addObservation} className="text-sm text-blue-600">
            + Add row
          </button>
        </div>

        <div className="space-y-2">
          {observations.map((obs, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-3 border rounded px-2 py-1 text-sm"
                placeholder="Parameter"
                value={obs.parameter}
                onChange={(e) => updateObservation(i, 'parameter', e.target.value)}
              />
              <input
                className="col-span-3 border rounded px-2 py-1 text-sm"
                placeholder="Expected value"
                value={obs.expectedValue}
                onChange={(e) => updateObservation(i, 'expectedValue', e.target.value)}
              />
              <input
                className="col-span-3 border rounded px-2 py-1 text-sm"
                placeholder="Observed value"
                value={obs.observedValue}
                onChange={(e) => updateObservation(i, 'observedValue', e.target.value)}
              />
              <select
                className="col-span-2 border rounded px-2 py-1 text-sm"
                value={obs.result}
                onChange={(e) => updateObservation(i, 'result', e.target.value)}
              >
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
              <button
                type="button"
                onClick={() => removeObservation(i)}
                className="col-span-1 text-red-500 text-sm"
                disabled={observations.length === 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Overall Result</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={overallResult}
          onChange={(e) => setOverallResult(e.target.value)}
        >
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Remarks</label>
        <textarea
          className="border rounded px-3 py-2 w-full"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Photos</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setPhotos(Array.from(e.target.files))}
        />
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit Inspection'}
      </button>
    </form>
  );
}
