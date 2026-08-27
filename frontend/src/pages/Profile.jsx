import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updateProfile } from '../services/authService';

// A single Profile page shared across all roles (not enumerated per-role in
// Master Spec Section 9 — the task's "basic profile page" requirement is
// satisfied generically here since profile fields are identical for every role).
export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const updated = await updateProfile(user._id, form);
      setUser(updated);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-4">My Profile</h1>
      {message && <p className="text-sm mb-3">{message}</p>}

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Email (fixed)</label>
        <input type="email" value={user.email} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Role (fixed)</label>
        <input type="text" value={user.role} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input name="name" value={form.name} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Address</label>
        <input name="address" value={form.address} onChange={onChange} className="w-full border rounded px-3 py-2" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
