/**
 * Module 6 — /frontend/src/components/dashboard/StatCard.jsx
 */
const TONE = {
  neutral: 'border-slate-200 text-slate-900',
  good: 'border-teal-200 text-teal-800',
  warn: 'border-amber-200 text-amber-800',
  bad: 'border-red-200 text-red-800',
};

export default function StatCard({ label, value, tone = 'neutral', hint }) {
  return (
    <div className={`bg-white rounded-lg border ${TONE[tone]} p-4 shadow-sm`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold font-mono">{value ?? '—'}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
