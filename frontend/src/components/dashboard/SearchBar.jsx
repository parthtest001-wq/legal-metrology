/**
 * Module 6 — /frontend/src/components/dashboard/SearchBar.jsx
 * Controlled filter bar used by pages/SearchResults.jsx.
 */
const TYPES = [
  { value: 'application', label: 'Applications' },
  { value: 'certificate', label: 'Certificates' },
  { value: 'instrument', label: 'Instruments' },
  { value: 'user', label: 'Users' },
];

const INSTRUMENT_CATEGORIES = [
  'weighing_scale',
  'weighbridge',
  'taximeter',
  'fuel_dispenser',
  'water_meter',
  'length_measure',
  'volume_measure',
];

const APPLICATION_STATUSES = [
  'submitted',
  'scheduled',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
];

export default function SearchBar({ filters, onChange, onSubmit, canExport, onExport }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filters.type}
          onChange={(e) => set('type', e.target.value)}
          className="border border-slate-300 rounded px-3 py-2 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by number, name, email…"
          value={filters.q || ''}
          onChange={(e) => set('q', e.target.value)}
          className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded hover:bg-teal-800 transition-colors"
        >
          Search
        </button>
        {canExport && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onExport('csv')}
              className="text-sm font-medium px-3 py-2 rounded border border-slate-300 hover:bg-slate-50"
            >
              Export CSV
            </button>
            {filters.type === 'certificate' && (
              <button
                type="button"
                onClick={() => onExport('pdf')}
                className="text-sm font-medium px-3 py-2 rounded border border-slate-300 hover:bg-slate-50"
              >
                Print PDF
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {filters.type === 'instrument' && (
          <select
            value={filters.instrumentCategory || ''}
            onChange={(e) => set('instrumentCategory', e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs"
          >
            <option value="">Any category</option>
            {INSTRUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace('_', ' ')}
              </option>
            ))}
          </select>
        )}
        {filters.type === 'application' && (
          <select
            value={filters.status || ''}
            onChange={(e) => set('status', e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs"
          >
            <option value="">Any status</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        )}
        {filters.type === 'certificate' && (
          <input
            type="text"
            placeholder="Certificate number"
            value={filters.certificateNumber || ''}
            onChange={(e) => set('certificateNumber', e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs"
          />
        )}
        {(filters.type === 'application' || filters.type === 'instrument' || filters.type === 'user') && (
          <input
            type="text"
            placeholder="District"
            value={filters.district || ''}
            onChange={(e) => set('district', e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs"
          />
        )}
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => set('dateFrom', e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-xs"
        />
        <span className="text-xs text-slate-400 self-center">to</span>
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => set('dateTo', e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-xs"
        />
      </div>
    </form>
  );
}
