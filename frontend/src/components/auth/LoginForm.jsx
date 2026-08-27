import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Generic login form. Role is determined by the server response (user.role),
 * so a single form works for consumer/lmo/gatc/admin — the redirect after
 * login uses whatever role comes back.
 */
export default function LoginForm({ registerLinkTo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Sign In</h1>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
        placeholder="you@example.com"
      />

      <label className="block text-sm font-medium mb-1">Password</label>
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
        placeholder="••••••••"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium disabled:opacity-50"
      >
        {submitting ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-blue-600">
          Forgot password?
        </Link>
        {registerLinkTo && (
          <Link to={registerLinkTo} className="text-blue-600">
            Create an account
          </Link>
        )}
      </div>
    </form>
  );
}
