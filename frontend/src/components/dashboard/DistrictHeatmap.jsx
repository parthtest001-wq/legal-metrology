/**
 * Module 6 — /frontend/src/components/dashboard/DistrictHeatmap.jsx
 *
 * Renders admin's pendencyHeatmap ({district, category, pendingCount}[])
 * as a simple CSS-grid heat table — no extra charting dependency needed
 * for this one, keeps the admin bundle lighter.
 */
const CATEGORY_LABEL = {
  weighing_scale: 'Weighing Scale',
  weighbridge: 'Weighbridge',
  taximeter: 'Taximeter',
  fuel_dispenser: 'Fuel Dispenser',
  water_meter: 'Water Meter',
  length_measure: 'Length Measure',
  volume_measure: 'Volume Measure',
};

function heatColor(count, max) {
  if (!max) return '#f1f5f9';
  const ratio = Math.min(count / max, 1);
  // interpolate slate-50 -> amber-600 for pendency intensity
  const r = Math.round(241 + (217 - 241) * ratio);
  const g = Math.round(245 + (119 - 245) * ratio);
  const b = Math.round(249 + (6 - 249) * ratio);
  return `rgb(${r},${g},${b})`;
}

export default function DistrictHeatmap({ pendencyHeatmap = [] }) {
  if (pendencyHeatmap.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-slate-400">
        No pending applications
      </div>
    );
  }

  const districts = [...new Set(pendencyHeatmap.map((r) => r.district))].sort();
  const categories = [...new Set(pendencyHeatmap.map((r) => r.category))].sort();
  const lookup = {};
  let max = 0;
  pendencyHeatmap.forEach((r) => {
    lookup[`${r.district}|${r.category}`] = r.pendingCount;
    if (r.pendingCount > max) max = r.pendingCount;
  });

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-full">
        <thead>
          <tr>
            <th className="text-left p-2 font-medium text-slate-500 sticky left-0 bg-white">
              District
            </th>
            {categories.map((c) => (
              <th key={c} className="p-2 font-medium text-slate-500 whitespace-nowrap">
                {CATEGORY_LABEL[c] || c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {districts.map((d) => (
            <tr key={d}>
              <td className="p-2 font-medium text-slate-700 sticky left-0 bg-white whitespace-nowrap">
                {d}
              </td>
              {categories.map((c) => {
                const count = lookup[`${d}|${c}`] || 0;
                return (
                  <td key={c} className="p-1">
                    <div
                      className="w-14 h-9 flex items-center justify-center rounded font-mono font-medium text-slate-700"
                      style={{ backgroundColor: heatColor(count, max) }}
                      title={`${d} — ${CATEGORY_LABEL[c] || c}: ${count} pending`}
                    >
                      {count || ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
