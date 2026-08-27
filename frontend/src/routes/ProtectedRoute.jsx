import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Usage:
 *   <ProtectedRoute allowedRoles={['admin', 'gatc']}>
 *     <SomePage />
 *   </ProtectedRoute>
 *
 * - Not authenticated -> redirect to /login (remembers the attempted location).
 * - Authenticated but wrong role -> redirect to that role's own dashboard/home.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return children;
}
