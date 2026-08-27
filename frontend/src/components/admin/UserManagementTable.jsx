// /frontend/src/components/admin/UserManagementTable.jsx
// Frontend consumer for the backend's admin-only user-management routes
// (GET /api/v1/users, PATCH /api/v1/users/:id/status), which shipped with
// Module 1 but had no consuming page — see AppLayout.jsx's and
// AppRoutes.jsx's "known gap" comments and docs/integration-report.md
// Section 6. Reads users via userService (this file's only new service)
// and the current admin's own id via AuthContext (owned by Module 1) —
// consumes, does not redefine, either.

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import sharedConstants from '../../constants/sharedConstants';

const { ROLES } = sharedConstants;

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: ROLES.CONSUMER, label: 'Consumer' },
  { value: ROLES.LMO, label: 'LMO' },
  { value: ROLES.GATC, label: 'GATC' },
  { value: ROLES.ADMIN, label: 'Admin' },
];

export default function UserManagementTable() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const filter = {};
      if (roleFilter) filter.role = roleFilter;
      if (stateFilter.trim()) filter.state = stateFilter.trim();
      const result = await userService.listUsers(filter);
      setUsers(result || []);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleToggleActive = async (targetUser) => {
    setUpdatingId(targetUser._id);
    setErrorMsg('');
    try {
      const updated = await userService.setUserStatus(targetUser._id, !targetUser.isActive);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
          <input
            type="text"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            placeholder="e.g. Maharashtra"
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={loadUsers}
          className="text-sm px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800"
        >
          Apply filters
        </button>
      </div>

      {errorMsg && <p className="text-red-600 text-sm mb-3">{errorMsg}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-400">No users match these filters.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">District / State</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;
                return (
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 font-mono">{u.phone}</td>
                    <td className="px-4 py-2 capitalize">{u.role}</td>
                    <td className="px-4 py-2">
                      {u.district}, {u.state}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive
                            ? 'bg-teal-50 text-teal-800'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isActive ? 'bg-teal-500' : 'bg-red-500'
                          }`}
                        />
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={isSelf || updatingId === u._id}
                        title={isSelf ? "You can't change your own status" : undefined}
                        className={`text-xs px-3 py-1 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.isActive
                            ? 'border-red-200 text-red-700 hover:bg-red-50'
                            : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                        }`}
                      >
                        {updatingId === u._id
                          ? 'Saving…'
                          : u.isActive
                          ? 'Suspend'
                          : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
