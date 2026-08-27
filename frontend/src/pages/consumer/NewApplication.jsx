// /frontend/src/pages/consumer/NewApplication.jsx
// Owned by Module 2.

import NewApplicationForm from '../../components/application/NewApplicationForm';

export default function NewApplication() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-6 max-w-2xl">
        <h1 className="text-xl font-bold text-slate-900">New verification application</h1>
        <p className="mt-1 text-sm text-slate-500">
          Register your instrument and submit it for legal metrology verification.
        </p>
      </div>
      <NewApplicationForm />
    </div>
  );
}
