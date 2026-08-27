/**
 * Module 6 — /frontend/src/components/common/AppLayout.jsx
 *
 * NEW FILE owned by Module 6, added into the shared components/common
 * folder (Section 9 rule: new files belong to the module that adds them).
 * This does NOT modify NotificationBell.jsx (Module 5) or AuthContext.jsx
 * (Module 1) — both are imported as-is.
 *
 * Design: a quiet "official register" shell — deep slate header/rail so
 * the certificate/status colors (verified green, pending amber, rejected
 * red) used throughout the dashboards read clearly against it; a thin
 * teal rule under the header stands in for the seal/stamp motif of a
 * physical verification certificate without being literal about it.
 * Instrument/application/certificate numbers render in a monospace
 * utility face, matching the register-book, serial-number feel of the
 * domain.
 */
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

// MERGE FIX (Section 10 routing pass): every `to` below now points at a
// route that actually resolves to a real page in AppRoutes.jsx. Removed:
// consumer "My Instruments" (Module 2 never built a standalone instrument
// list — fields are collected inline on NewApplication), and gatc "LMO
// Workload" as its own page (that data already renders inside
// GatcDashboard). Relabeled gatc's "Applications" -> "Allocation" and "LMO
// Workload" -> "Queue" to match the real page titles at /gatc/allocation
// and /gatc/queue. These remain flagged as known gaps in the integration
// report, not silently dropped.
//
// ADMIN UI ADDITION: admin's "Users" and "GATCs" links were originally
// removed for the same reason (backend routes existed, no frontend page) —
// now restored, pointing at the new pages/admin/Users.jsx and
// pages/admin/Gatcs.jsx.
const MENU_BY_ROLE = {
  consumer: [
    { label: 'Dashboard', to: '/consumer/dashboard' },
    { label: 'My Applications', to: '/consumer/applications' },
    { label: 'Certificates', to: '/consumer/certificates' },
    { label: 'Search', to: '/search' },
  ],
  lmo: [
    { label: 'Dashboard', to: '/lmo/dashboard' },
    { label: 'Inspection Queue', to: '/lmo/queue' },
    { label: 'Field Mode', to: '/lmo/field' },
    { label: 'Search', to: '/search' },
  ],
  gatc: [
    { label: 'Dashboard', to: '/gatc/dashboard' },
    { label: 'Allocation', to: '/gatc/allocation' },
    { label: 'Queue', to: '/gatc/queue' },
    { label: 'Search', to: '/search' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Allocation', to: '/admin/allocation' },
    { label: 'Users', to: '/admin/users' },
    { label: 'GATCs', to: '/admin/gatcs' },
    { label: 'Search & Export', to: '/search' },
  ],
};

const ROLE_LABEL = {
  consumer: 'Consumer',
  lmo: 'Legal Metrology Officer',
  gatc: 'GATC',
  admin: 'Administrator',
};

export default function AppLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const menu = MENU_BY_ROLE[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-slate-100 border-b-2 border-teal-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-200"
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <span className="font-semibold tracking-tight text-base sm:text-lg">
              Legal Metrology Verification System
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-slate-400">
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        <nav
          className={`${
            navOpen ? 'block' : 'hidden'
          } md:block w-full md:w-56 shrink-0 bg-white border-r border-slate-200 md:min-h-[calc(100vh-4rem)] px-3 py-4`}
        >
          <ul className="space-y-1">
            {menu.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 border-l-2 border-teal-500'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 px-4 sm:px-6 py-6 min-w-0">
          {title && (
            <h1 className="text-xl font-semibold text-slate-900 mb-5 tracking-tight">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
