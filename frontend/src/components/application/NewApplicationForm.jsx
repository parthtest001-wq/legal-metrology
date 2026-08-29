// /frontend/src/components/application/NewApplicationForm.jsx
// Owned by Module 2. Multi-step flow:
//   1. Instrument details  2. Documents/photo upload  3. Review  4. Submit
//
// On submit it creates the Instrument (POST /api/v1/instruments) and then
// the Application (POST /api/v1/applications) referencing it, per the
// Section 4 contract — these are two separate resources/endpoints, so the
// form performs two sequential calls rather than inventing a combined route.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { createInstrument } from '../../services/instrumentService';
import { createApplication } from '../../services/applicationService';
import FileUploadPreview from './FileUploadPreview';
import sharedConstants from '../../constants/sharedConstants';

const { INSTRUMENT_CATEGORY, APPLICATION_TYPE } = sharedConstants;

const STEPS = ['Instrument details', 'Documents', 'Review & submit'];

const emptyForm = {
  category: '',
  make: '',
  model: '',
  serialNumber: '',
  capacity: '',
  unit: '',
  manufacturingYear: '',
  applicationType: APPLICATION_TYPE.NEW_VERIFICATION,
  preferredGatcId: '',
};

export default function NewApplicationForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [gatcs, setGatcs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // GATC list comes from Module 1's endpoint (GET /api/v1/gatc) — read-only
  // usage of a shared resource, no local redefinition of that model/route.
  useEffect(() => {
    api
      .get('/gatc', { params: { approvalStatus: 'approved' } })
      .then((res) => setGatcs(res.data.data.gatcs || []))
      .catch(() => setGatcs([]));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep1() {
    return (
      form.category &&
      form.make.trim() &&
      form.model.trim() &&
      form.serialNumber.trim() &&
      form.preferredGatcId
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const instrument = await createInstrument(
        {
          category: form.category,
          make: form.make,
          model: form.model,
          serialNumber: form.serialNumber,
          capacity: form.capacity,
          unit: form.unit,
          manufacturingYear: form.manufacturingYear,
        },
        photos
      );

      const application = await createApplication(
        {
          instrumentId: instrument._id,
          type: form.applicationType,
          preferredGatcId: form.preferredGatcId,
        },
        documents
      );

      navigate(`/consumer/applications/${application._id}`);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || 'Something went wrong while submitting. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  i <= step ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`mt-1 whitespace-nowrap text-[11px] ${
                  i === step ? 'font-semibold text-slate-800' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${i < step ? 'bg-teal-700' : 'bg-slate-200'}`} />
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-800">Instrument category *</label>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="">Select category</option>
                  {Object.values(INSTRUMENT_CATEGORY).map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <Field label="Make *" value={form.make} onChange={(v) => update('make', v)} />
              <Field label="Model *" value={form.model} onChange={(v) => update('model', v)} />
              <Field
                label="Serial number *"
                value={form.serialNumber}
                onChange={(v) => update('serialNumber', v)}
              />
              <Field
                label="Capacity"
                type="number"
                value={form.capacity}
                onChange={(v) => update('capacity', v)}
              />
              <div>
                <label className="text-sm font-medium text-slate-800">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => update('unit', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                >
                  <option value="">Select unit</option>
                  {['kg', 'g', 'litre', 'metre', 'tonne'].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Manufacturing year"
                type="number"
                value={form.manufacturingYear}
                onChange={(v) => update('manufacturingYear', v)}
              />
            </div>

            <hr className="my-2 border-slate-100" />

            <div>
              <label className="text-sm font-medium text-slate-800">Application type *</label>
              <div className="mt-2 flex gap-3">
                {Object.values(APPLICATION_TYPE).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => update('applicationType', t)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      form.applicationType === t
                        ? 'border-teal-700 bg-teal-50 text-teal-800'
                        : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {t.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-800">Preferred GATC *</label>
              <select
                value={form.preferredGatcId}
                onChange={(e) => update('preferredGatcId', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="">Select a verification center</option>
                {gatcs.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} — {g.district}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <FileUploadPreview
              label="Instrument photos"
              hint="Clear photos of the instrument and its nameplate/serial number."
              files={photos}
              onChange={setPhotos}
            />
            <FileUploadPreview
              label="Supporting documents"
              hint="Purchase invoice, previous certificate (for re-verification), ID proof, etc."
              files={documents}
              onChange={setDocuments}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-sm">
            <ReviewRow label="Category" value={form.category.replace(/_/g, ' ')} />
            <ReviewRow label="Make / Model" value={`${form.make} / ${form.model}`} />
            <ReviewRow label="Serial number" value={form.serialNumber} />
            <ReviewRow label="Capacity" value={form.capacity ? `${form.capacity} ${form.unit || ''}` : '—'} />
            <ReviewRow label="Application type" value={form.applicationType.replace(/_/g, ' ')} />
            <ReviewRow
              label="Preferred GATC"
              value={gatcs.find((g) => g._id === form.preferredGatcId)?.name || '—'}
            />
            <ReviewRow label="Instrument photos" value={`${photos.length} file(s)`} />
            <ReviewRow label="Supporting documents" value={`${documents.length} file(s)`} />

            {submitError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {submitError}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 disabled:opacity-0"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={step === 0 && !validateStep1()}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-800">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
      />
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
