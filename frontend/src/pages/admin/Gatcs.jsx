// /frontend/src/pages/admin/Gatcs.jsx
// Fills the "admin GATC approval" gap flagged in AppLayout.jsx,
// AppRoutes.jsx, and docs/integration-report.md Section 6 — the backend
// routes (GET/POST /api/v1/gatc, PATCH /api/v1/gatc/:id/approve) existed
// with no consuming page, leaving self-registered GATCs stuck `pending`
// forever with no UI to approve them. Bare content div, no self-wrapped
// <AppLayout>, matching every other non-Module-6 page (e.g. Allocation.jsx)
// — AppRoutes.jsx wraps it in <AppLayout> centrally.

import GatcApprovalTable from '../../components/admin/GatcApprovalTable';

export default function Gatcs() {
  return (
    <div>
      <GatcApprovalTable />
    </div>
  );
}
