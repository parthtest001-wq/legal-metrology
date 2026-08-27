/**
 * Module 6 — /frontend/src/components/dashboard/PerformanceTable.jsx
 * Renders the GATC dashboard's lmoWorkload rows: [{lmoId, lmoName,
 * officerCode, count}]
 */
export default function PerformanceTable({ rows = [], emptyText = 'No data yet' }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">{emptyText}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <th className="py-2 pr-4">Officer</th>
          <th className="py-2 pr-4">Code</th>
          <th className="py-2 text-right">Assigned / Completed</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.lmoId} className="border-b border-slate-100 last:border-0">
            <td className="py-2 pr-4 font-medium text-slate-800">{row.lmoName}</td>
            <td className="py-2 pr-4 font-mono text-slate-500">{row.officerCode || '—'}</td>
            <td className="py-2 text-right font-mono">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
