// /frontend/src/pages/gatc/Allocation.jsx
// Owned by Module 3.
// Reuses the same AllocationList component used by the admin page — the
// backend's assignApplication controller already scopes a 'gatc' user to
// applications routed to their own GATC (see scheduling.controller.js).

import AllocationList from '../../components/scheduling/AllocationList';

export default function Allocation() {
  return (
    <div className="p-6">
      <AllocationList />
    </div>
  );
}
