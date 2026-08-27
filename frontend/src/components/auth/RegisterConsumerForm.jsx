import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerConsumer } from '../../services/authService';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
  state: '',
  district: '',
};

export default function RegisterConsumerForm() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerConsumer(form);
      navigate('/login/consumer');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Consumer Registration</h1>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <Field label="Full Name" name="name" value={form.name} onChange={onChange} required />
      <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
      <Field label="Phone" name="phone" value={form.phone} onChange={onChange} required placeholder="10-digit mobile number" />
      <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} required minLength={8} />
      <Field label="Address" name="address" value={form.address} onChange={onChange} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="State" name="state" value={form.state} onChange={onChange} required />
        <Field label="District" name="district" value={form.district} onChange={onChange} required />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium mt-2 disabled:opacity-50"
      >
        {submitting ? 'Creating account...' : 'Register'}
      </button>

      <p className="text-sm mt-4 text-center">
        Already have an account?{' '}
        <Link to="/login/consumer" className="text-blue-600">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Field({ label, name, type = 'text', value, onChange, required, minLength, placeholder }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full border rounded px-3 py-2"
      />
    </div>
  );
}
