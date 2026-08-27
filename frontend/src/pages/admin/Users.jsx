// /frontend/src/pages/admin/Users.jsx
// Fills the "admin user management" gap flagged in AppLayout.jsx,
// AppRoutes.jsx, and docs/integration-report.md Section 6 — the backend
// routes (GET/PATCH /api/v1/users) existed with no consuming page. Bare
// content div, no self-wrapped <AppLayout>, matching every other
// non-Module-6 page (e.g. Allocation.jsx) — AppRoutes.jsx wraps it in
// <AppLayout> centrally.

import UserManagementTable from '../../components/admin/UserManagementTable';

export default function Users() {
  return (
    <div>
      <UserManagementTable />
    </div>
  );
}
