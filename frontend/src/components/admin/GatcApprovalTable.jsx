// /frontend/src/components/admin/GatcApprovalTable.jsx
// Frontend consumer for the backend's admin-only GATC routes
// (GET /api/v1/gatc, POST /api/v1/gatc, PATCH /api/v1/gatc/:id/approve),
// which shipped with Module 1 but had no consuming admin page — see
// AppLayout.jsx's and AppRoutes.jsx's "known gap" comments and
// docs/integration-report.md Section 6. GATCs self-register via
// /register/gatc (creating a `pending` GATC record — see
// auth.controller.js's register()); this is where an admin actually acts
// on that queue.

import { useEffect, useState } from 'react';
import gatcService from '../../services/gatcService';
import sharedConstants from '../../constants/sharedConstants';

const { GATC_APPROVAL_STATUS } = sharedConstants;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: GATC_APPROVAL_STATUS.PENDING, label: 'Pending' },
  { value: GATC_APPROVAL_STATUS.APPROVED, label: 'Approved' },
  { value: GATC_APPROVAL_STATUS.SUSPENDED, label: 'Suspended' },
];

const STATUS_TONE = {
  [GATC_APPROVAL_STATUS.PENDING]: 'bg-amber-50 text-amber-800',
  [GATC_APPROVAL_STATUS.APPROVED]: 'bg-teal-50 text-teal-800',
  [GATC_APPROVAL_STATUS.SUSPENDED]: 'bg-red-50 text-red-700',
};

const EMPTY_FORM = {
  name: '',
  registrationNumber: '',
  address: '',
  state: '',
  district: '',
  contactEmail: '',
  contactPhone: '',
};

export default function GatcApprovalTable() {
  const [gatcs, setGatcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const loadGatcs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const filter = {};
      if (statusFilter) filter.approvalStatus = statusFilter;
      const result = await gatcService.listGatcs(filter);
      setGatcs(result || []);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load GATCs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGatcs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSetStatus = async (gatc, approvalStatus) => {
    setUpdatingId(gatc._id);
    setErrorMsg('');
    try {
      const updated = await gatcService.setGatcApprovalStatus(gatc._id, approvalStatus);
      setGatcs((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update GATC status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFormChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.registrationNumber || !form.address || !form.state || !form.district) {
      setFormError('Name, registration number, address, state, and district are required.');
      return;
    }
    setCreating(true);
    try {
      const created = await gatcService.createGatc(form);
      setGatcs((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create GATC.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Approval status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="text-sm px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800"
        >
          {showAddForm ? 'Cancel' : '+ Add GATC'}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-lg p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={handleFormChange('name')}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Registration number"
            value={form.registrationNumber}
            onChange={handleFormChange('registrationNumber')}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Address"
            value={form.address}
            onChange={handleFormChange('address')}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm sm:col-span-2"
          />
          <input
            type="text"
            placeholder="State"
            value={form.state}
            onChange={handleFormChange('state')}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="District"
            value={form.district}
            onChange={handleFormChange('district')}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <input
            type="email"
            placeholder="Contact email (optional)"
            value={form.contactEmail}
            onChange={handleFormChange('contactEmail')}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Contact phone (optional)"
            value={form.contactPhone}
            onChange={handleFormChange('contactPhone')}
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          />
          {formError && <p className="text-red-600 text-sm sm:col-span-2">{formError}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="text-sm px-4 py-1.5 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create GATC'}
            </button>
          </div>
        </form>
      )}

      {errorMsg && <p className="text-red-600 text-sm mb-3">{errorMsg}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading GATCs…</p>
      ) : gatcs.length === 0 ? (
        <p className="text-sm text-slate-400">No GATCs match this filter.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">
                  Registration #
                </th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">
                  District / State
                </th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Contact</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-2 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {gatcs.map((g) => (
                <tr key={g._id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{g.name}</td>
                  <td className="px-4 py-2 font-mono">{g.registrationNumber}</td>
                  <td className="px-4 py-2">
                    {g.district}, {g.state}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {g.contactEmail || g.contactPhone || '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_TONE[g.approvalStatus] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {g.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {g.approvalStatus !== GATC_APPROVAL_STATUS.APPROVED && (
                        <button
                          onClick={() => handleSetStatus(g, GATC_APPROVAL_STATUS.APPROVED)}
                          disabled={updatingId === g._id}
                          className="text-xs px-3 py-1 rounded border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                        >
                          {updatingId === g._id ? '…' : 'Approve'}
                        </button>
                      )}
                      {g.approvalStatus !== GATC_APPROVAL_STATUS.SUSPENDED && (
                        <button
                          onClick={() => handleSetStatus(g, GATC_APPROVAL_STATUS.SUSPENDED)}
                          disabled={updatingId === g._id}
                          className="text-xs px-3 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
                        >
                          {updatingId === g._id ? '…' : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
