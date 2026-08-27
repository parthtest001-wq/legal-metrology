import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

// Minimal per-role landing page. Modules 2–6 will replace/extend this with
// their real dashboards (see Master Spec Section 4, dashboard.controller.js).
export default function PlaceholderHome({ roleLabel }) {
  const { user, logout } = useAuth();
  return (
    <div className="max-w-lg mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-2">Welcome, {user?.name}</h1>
      <p className="text-sm text-gray-500 mb-6">{roleLabel} dashboard placeholder — extended by later modules.</p>
      <div className="flex gap-4 text-sm">
        <Link to="/profile" className="text-blue-600">My Profile</Link>
        <button onClick={logout} className="text-red-600">Log out</button>
      </div>
    </div>
  );
}
