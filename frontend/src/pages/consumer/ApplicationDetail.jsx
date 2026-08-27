// /frontend/src/pages/consumer/ApplicationDetail.jsx
// Owned by Module 2.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cancelApplication, getApplication } from '../../services/applicationService';
import StatusBadge from '../../components/application/StatusBadge';
import sharedConstants from '../../constants/sharedConstants';

const { APPLICATION_STATUS } = sharedConstants;

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  function load() {
    setLoading(true);
    getApplication(id)
      .then(setApplication)
      .catch(() => setError('Could not load this application.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleCancel() {
    if (!window.confirm('Withdraw this application? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await cancelApplication(id);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not cancel this application.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <CenteredMessage text="Loading…" />;
  if (error) return <CenteredMessage text={error} tone="error" />;
  if (!application) return null;

  const instrument = application.instrumentId;
  const applicant = application.applicantId;
  const gatc = application.preferredGatcId;
  const canModify = application.status === APPLICATION_STATUS.SUBMITTED;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate(-1)} className="mb-4 text-sm text-slate-500 hover:underline">
          ← Back
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">{application.applicationNumber}</h1>
              <p className="text-sm text-slate-500">
                Submitted {new Date(application.submittedAt).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={application.status} />
          </div>

          <Section title="Instrument">
            <Grid>
              <Item label="Category" value={instrument?.category?.replace(/_/g, ' ')} />
              <Item label="Make / Model" value={`${instrument?.make || ''} ${instrument?.model || ''}`} />
              <Item label="Serial number" value={instrument?.serialNumber} />
              <Item label="Instrument status" value={instrument?.status?.replace(/_/g, ' ')} />
            </Grid>
          </Section>

          <Section title="Application">
            <Grid>
              <Item label="Type" value={application.type.replace(/_/g, ' ')} />
              <Item label="Preferred GATC" value={gatc?.name} />
              <Item label="Assigned LMO" value={application.assignedLmoId ? 'Assigned' : 'Not yet assigned'} />
              <Item
                label="Scheduled date"
                value={application.scheduledDate ? new Date(application.scheduledDate).toLocaleDateString() : '—'}
              />
            </Grid>
          </Section>

          <Section title="Applicant">
            <Grid>
              <Item label="Name" value={applicant?.name} />
              <Item label="District / State" value={`${applicant?.district || ''}, ${applicant?.state || ''}`} />
            </Grid>
          </Section>

          {application.documents?.length > 0 && (
            <Section title="Documents">
              <ul className="flex flex-wrap gap-2">
                {application.documents.map((doc, i) => (
                  <li key={i}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-teal-700 hover:bg-teal-50"
                    >
                      Document {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {application.remarks && (
            <Section title="Remarks">
              <p className="text-sm text-slate-600">{application.remarks}</p>
            </Section>
          )}

          {canModify && (
            <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                {cancelling ? 'Withdrawing…' : 'Withdraw application'}
              </button>
              <p className="self-center text-xs text-slate-400">
                You can withdraw or edit this application until it is scheduled.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function Item({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  );
}

function CenteredMessage({ text, tone = 'default' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className={`text-sm ${tone === 'error' ? 'text-rose-600' : 'text-slate-400'}`}>{text}</p>
    </div>
  );
}
