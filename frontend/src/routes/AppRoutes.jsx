import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Module 1 — auth, profile, placeholders (kept as fallback only; replaced
// as the per-role landing route by Module 6's real dashboards below)
import ConsumerLogin from '../pages/consumer/Login.jsx';
import ConsumerRegister from '../pages/consumer/Register.jsx';
import LmoLogin from '../pages/lmo/Login.jsx';
import LmoRegister from '../pages/lmo/Register.jsx';
import GatcLogin from '../pages/gatc/Login.jsx';
import GatcRegister from '../pages/gatc/Register.jsx';
import AdminLogin from '../pages/admin/Login.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import Profile from '../pages/Profile.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppLayout from '../components/common/AppLayout.jsx';

// Module 2 — application & instrument management
import NewApplication from '../pages/consumer/NewApplication.jsx';
import MyApplications from '../pages/consumer/MyApplications.jsx';
import ApplicationDetail from '../pages/consumer/ApplicationDetail.jsx';

// Module 3 — scheduling / allocation / manual verification
import AdminAllocation from '../pages/admin/Allocation.jsx';
import GatcAllocation from '../pages/gatc/Allocation.jsx';
import GatcMyQueuePage from '../pages/gatc/MyQueue.jsx';
import LmoMyQueuePage from '../pages/lmo/MyQueue.jsx';
import RecordInspection from '../pages/lmo/RecordInspection.jsx';

// Module 4 — certificates
import MyCertificates from '../pages/consumer/MyCertificates.jsx';
import CertificateDetail from '../pages/consumer/CertificateDetail.jsx';
import VerifyCertificate from '../pages/public/VerifyCertificate.jsx';

// Module 6 — dashboards & search (these self-wrap in <AppLayout>, see note
// below — do not wrap them in AppLayout again here)
import ConsumerDashboard from '../pages/consumer/Dashboard.jsx';
import LmoDashboard from '../pages/lmo/Dashboard.jsx';
import GatcDashboard from '../pages/gatc/Dashboard.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import SearchResults from '../pages/SearchResults.jsx';

// Admin user & GATC management — fills the known gap flagged below and in
// AppLayout.jsx / docs/integration-report.md Section 6 (backend routes
// existed, no consuming page). Bare content, wrapped via withLayout like
// every other non-Module-6 admin page.
import AdminUsers from '../pages/admin/Users.jsx';
import AdminGatcs from '../pages/admin/Gatcs.jsx';

// Module 7 — mobile/field verification PWA
import FieldQueue from '../pages/lmo/FieldQueue.jsx';
import FieldInspection from '../pages/lmo/FieldInspection.jsx';

/**
 * AppLayout convention (merge decision made during integration, Section 10
 * routing-merge pass): Module 6's 5 pages (4 dashboards + SearchResults)
 * already import and render <AppLayout> themselves. Every other module's
 * page (2, 3, 4, 7) was built as bare content with no nav shell at all —
 * none of them imported AppLayout, so wiring them in unwrapped would have
 * left every non-dashboard screen with no header, no logout button, and no
 * way to navigate elsewhere. Rather than edit 10+ page files to add their
 * own <AppLayout>, this file wraps each of THEIR routes in <AppLayout> once,
 * centrally, here. Module 6's 5 pages are routed bare so they are never
 * double-wrapped (which would have rendered two stacked headers/nav rails).
 */
const withLayout = (title, element) => <AppLayout title={title}>{element}</AppLayout>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login/consumer" replace />} />

      {/* --- Public: auth (Module 1) --- */}
      <Route path="/login/consumer" element={<ConsumerLogin />} />
      <Route path="/register/consumer" element={<ConsumerRegister />} />
      <Route path="/login/lmo" element={<LmoLogin />} />
      <Route path="/register/lmo" element={<LmoRegister />} />
      <Route path="/login/gatc" element={<GatcLogin />} />
      <Route path="/register/gatc" element={<GatcRegister />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ForgotPassword />} />
      <Route path="/login" element={<Navigate to="/login/consumer" replace />} />

      {/* --- Public: certificate verification (Module 4) — no JWT, reached
           by scanning a certificate's QR code --- */}
      <Route path="/verify/:certificateNumber" element={<VerifyCertificate />} />
      <Route path="/verify" element={<VerifyCertificate />} />

      {/* --- Protected: any authenticated role (Module 1) --- */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>{withLayout('My Profile', <Profile />)}</ProtectedRoute>
        }
      />

      {/* --- Protected: shared search & export, gated server-side by role
           (Module 6) — self-wraps in AppLayout, routed bare --- */}
      <Route
        path="/search"
        element={
          <ProtectedRoute allowedRoles={['consumer', 'lmo', 'gatc', 'admin']}>
            <SearchResults />
          </ProtectedRoute>
        }
      />

      {/* --- Consumer (Modules 2, 4, 6) --- */}
      <Route path="/consumer" element={<Navigate to="/consumer/dashboard" replace />} />
      <Route
        path="/consumer/dashboard"
        element={<ProtectedRoute allowedRoles={['consumer']}><ConsumerDashboard /></ProtectedRoute>}
      />
      <Route
        path="/consumer/applications"
        element={<ProtectedRoute allowedRoles={['consumer']}>{withLayout('My Applications', <MyApplications />)}</ProtectedRoute>}
      />
      <Route
        path="/consumer/applications/new"
        element={<ProtectedRoute allowedRoles={['consumer']}>{withLayout('New Application', <NewApplication />)}</ProtectedRoute>}
      />
      <Route
        path="/consumer/applications/:id"
        element={<ProtectedRoute allowedRoles={['consumer']}>{withLayout('Application Detail', <ApplicationDetail />)}</ProtectedRoute>}
      />
      <Route
        path="/consumer/certificates"
        element={<ProtectedRoute allowedRoles={['consumer']}>{withLayout('My Certificates', <MyCertificates />)}</ProtectedRoute>}
      />
      <Route
        path="/consumer/certificates/:id"
        element={<ProtectedRoute allowedRoles={['consumer']}>{withLayout('Certificate Detail', <CertificateDetail />)}</ProtectedRoute>}
      />

      {/* --- LMO (Modules 3, 6, 7) --- */}
      <Route path="/lmo" element={<Navigate to="/lmo/dashboard" replace />} />
      <Route
        path="/lmo/dashboard"
        element={<ProtectedRoute allowedRoles={['lmo']}><LmoDashboard /></ProtectedRoute>}
      />
      <Route
        path="/lmo/queue"
        element={<ProtectedRoute allowedRoles={['lmo']}>{withLayout('Inspection Queue', <LmoMyQueuePage />)}</ProtectedRoute>}
      />
      <Route
        path="/lmo/verification/:applicationId"
        element={<ProtectedRoute allowedRoles={['lmo']}>{withLayout('Record Inspection', <RecordInspection />)}</ProtectedRoute>}
      />
      {/* Module 7's PWA field-mode screens — same underlying workflow as
          /lmo/queue and /lmo/verification/:id above, built offline-first
          for on-site use. Kept as separate routes rather than replacing
          Module 3's desktop screens, since the master spec doesn't say to
          retire the desktop flow and both call the same backend endpoints. */}
      <Route
        path="/lmo/field"
        element={<ProtectedRoute allowedRoles={['lmo']}>{withLayout('Field Queue', <FieldQueue />)}</ProtectedRoute>}
      />
      <Route
        path="/lmo/field/:applicationId"
        element={<ProtectedRoute allowedRoles={['lmo']}>{withLayout('Field Inspection', <FieldInspection />)}</ProtectedRoute>}
      />

      {/* --- GATC (Modules 3, 6) --- */}
      <Route path="/gatc" element={<Navigate to="/gatc/dashboard" replace />} />
      <Route
        path="/gatc/dashboard"
        element={<ProtectedRoute allowedRoles={['gatc']}><GatcDashboard /></ProtectedRoute>}
      />
      <Route
        path="/gatc/allocation"
        element={<ProtectedRoute allowedRoles={['gatc']}>{withLayout('Allocate Applications', <GatcAllocation />)}</ProtectedRoute>}
      />
      <Route
        path="/gatc/queue"
        element={<ProtectedRoute allowedRoles={['gatc']}>{withLayout('Scheduled Queue', <GatcMyQueuePage />)}</ProtectedRoute>}
      />

      {/* --- Admin (Modules 1, 3, 6) --- */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin/allocation"
        element={<ProtectedRoute allowedRoles={['admin']}>{withLayout('Allocate Applications', <AdminAllocation />)}</ProtectedRoute>}
      />
      <Route
        path="/admin/users"
        element={<ProtectedRoute allowedRoles={['admin']}>{withLayout('User Management', <AdminUsers />)}</ProtectedRoute>}
      />
      <Route
        path="/admin/gatcs"
        element={<ProtectedRoute allowedRoles={['admin']}>{withLayout('GATC Approval', <AdminGatcs />)}</ProtectedRoute>}
      />
      {/*
        GAP CLOSED: AppLayout's admin nav originally linked to /admin/users
        and /admin/gatcs, but no module had built a frontend page for
        either — Module 1 shipped the backend routes (GET/PATCH /users,
        GET/POST /gatc, PATCH /gatc/:id/approve) with no consuming UI. Added
        pages/admin/Users.jsx and pages/admin/Gatcs.jsx (+ their
        components/admin/* tables and services/userService.js,
        services/gatcService.js) and restored both nav links in
        AppLayout.jsx. Same still-open gaps remain for consumer's
        /consumer/instruments (Module 2 deliberately built no standalone
        instrument-list page — instrument fields are collected inline on
        NewApplication.jsx) and gatc's /gatc/workload (the lmoWorkload data
        already renders inside GatcDashboard; no separate page exists).
      */}

      <Route path="*" element={<Navigate to="/login/consumer" replace />} />
    </Routes>
  );
}
