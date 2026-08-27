import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../services/authService';

export default function ForgotPasswordForm() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email');

  if (tokenFromUrl) {
    return <ResetStep initialEmail={emailFromUrl || ''} initialToken={tokenFromUrl} />;
  }
  return <RequestStep />;
}

function RequestStep() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setMessage('If that email is registered, a reset link has been sent.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Forgot Password</h1>
      {message && <p className="text-sm mb-3">{message}</p>}
      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}

function ResetStep({ initialEmail, initialToken }) {
  const [email, setEmail] = useState(initialEmail);
  const [token] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(email, token, newPassword);
      setMessage('Password reset. Redirecting to login...');
      setTimeout(() => navigate('/login/consumer'), 1500);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
      {message && <p className="text-sm mb-3">{message}</p>}
      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <label className="block text-sm font-medium mb-1">New Password</label>
      <input
        type="password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {submitting ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
