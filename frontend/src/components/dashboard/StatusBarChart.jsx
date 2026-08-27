/**
 * Module 6 — /frontend/src/components/dashboard/StatusBarChart.jsx
 *
 * Uses `recharts` — a lightweight React-native charting library, chosen
 * for consistency with the React/Vite frontend (Section 1). This is a
 * NEW frontend dependency not listed in the master spec's pinned table;
 * see docs/module-6-assumptions.md for the version to add to
 * /frontend/package.json.
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const STATUS_COLORS = {
  submitted: '#94a3b8',
  scheduled: '#60a5fa',
  in_progress: '#f59e0b',
  completed: '#0d9488',
  rejected: '#ef4444',
  cancelled: '#cbd5e1',
};

const STATUS_LABEL = {
  submitted: 'Submitted',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export default function StatusBarChart({ applicationsByStatus = {} }) {
  const data = Object.entries(applicationsByStatus).map(([status, count]) => ({
    status,
    label: STATUS_LABEL[status] || status,
    count,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        No application data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#64748b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
