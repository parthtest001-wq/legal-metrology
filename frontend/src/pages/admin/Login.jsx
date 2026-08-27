import React from 'react';
import LoginForm from '../../components/auth/LoginForm.jsx';

// Admin accounts are seeded (see /backend/scripts/seedAdmin.js) — no register page.
export default function AdminLogin() {
  return <LoginForm />;
}
