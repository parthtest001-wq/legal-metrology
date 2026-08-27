// /frontend/src/components/application/StatusBadge.jsx
// Owned by Module 2. Renders using the EXACT status strings from
// /frontend/src/constants/sharedConstants.js (synced copy of Section 7).

import PropTypes from 'prop-types';
import sharedConstants from '../../constants/sharedConstants';

const { APPLICATION_STATUS } = sharedConstants;

// Maps each frozen enum value to a label + color. No status string is
// invented here — every key matches Section 7 exactly.
const STATUS_STYLES = {
  [APPLICATION_STATUS.SUBMITTED]: {
    label: 'Submitted',
    className: 'bg-slate-100 text-slate-700 ring-slate-300',
  },
  [APPLICATION_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    className: 'bg-sky-50 text-sky-700 ring-sky-300',
  },
  [APPLICATION_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    className: 'bg-amber-50 text-amber-700 ring-amber-300',
  },
  [APPLICATION_STATUS.COMPLETED]: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: 'Rejected',
    className: 'bg-rose-50 text-rose-700 ring-rose-300',
  },
  [APPLICATION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-zinc-100 text-zinc-500 ring-zinc-300',
  },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600 ring-gray-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {style.label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
