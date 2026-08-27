import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerGatc } from '../../services/authService';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: '',
  state: '',
  district: '',
  gatcDetails: {
    name: '',
    registrationNumber: '',
    address: '',
    state: '',
    district: '',
    contactEmail: '',
    contactPhone: '',
  },
};

export default function RegisterGatcForm() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onGatcChange = (e) =>
    setForm({ ...form, gatcDetails: { ...form.gatcDetails, [e.target.name]: e.target.value } });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await registerGatc(form);
      navigate('/login/gatc');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-semibold mb-4">
        Government Approved Testing Centre (GATC) Registration
      </h1>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <h2 className="font-medium text-sm text-gray-500 uppercase mt-4 mb-2">Primary Contact / Login</h2>
      <Field label="Contact Person Name" name="name" value={form.name} onChange={onChange} required />
      <Field label="Login Email" name="email" type="email" value={form.email} onChange={onChange} required />
      <Field label="Phone" name="phone" value={form.phone} onChange={onChange} required placeholder="10-digit mobile number" />
      <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} required minLength={8} />
      <Field label="Address" name="address" value={form.address} onChange={onChange} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="State" name="state" value={form.state} onChange={onChange} required />
        <Field label="District" name="district" value={form.district} onChange={onChange} required />
      </div>

      <h2 className="font-medium text-sm text-gray-500 uppercase mt-6 mb-2">Testing Centre Details</h2>
      <Field label="Centre Name" name="name" value={form.gatcDetails.name} onChange={onGatcChange} required />
      <Field
        label="Registration Number"
        name="registrationNumber"
        value={form.gatcDetails.registrationNumber}
        onChange={onGatcChange}
        required
        placeholder="Legal Metrology license/registration number"
      />
      <Field label="Centre Address" name="address" value={form.gatcDetails.address} onChange={onGatcChange} required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Centre State" name="state" value={form.gatcDetails.state} onChange={onGatcChange} required />
        <Field label="Centre District" name="district" value={form.gatcDetails.district} onChange={onGatcChange} required />
      </div>
      <Field label="Centre Contact Email (optional)" name="contactEmail" type="email" value={form.gatcDetails.contactEmail} onChange={onGatcChange} />
      <Field label="Centre Contact Phone (optional)" name="contactPhone" value={form.gatcDetails.contactPhone} onChange={onGatcChange} />

      <p className="text-xs text-gray-500 mt-3">
        Your centre will be created with <strong>pending</strong> approval status until an admin
        reviews and approves it.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white rounded py-2 font-medium mt-4 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Register Centre'}
      </button>

      <p className="text-sm mt-4 text-center">
        Already have an account?{' '}
        <Link to="/login/gatc" className="text-blue-600">
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
