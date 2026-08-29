/**
 * pages/public/LandingPage.jsx
 *
 * The site's front door. Replaces the old `/` → `/login/consumer` redirect.
 * Gives every role a clearly labelled entry point (consumer, LMO, GATC,
 * admin) and surfaces the public certificate-verification tool — the one
 * action anyone can take here without an account — as the page's centerpiece.
 *
 * No new backend calls: the verification form simply forwards to the
 * existing public route at /verify/:certificateNumber.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const COUNTERS = [
  {
    role: 'consumer',
    label: 'Consumer',
    who: 'Instrument owners — shops, dealers, individuals',
    does: 'Register an instrument, submit it for verification, and track your certificate.',
  },
  {
    role: 'lmo',
    label: 'Legal Metrology Officer',
    who: 'Government inspecting officers',
    does: 'Review your assigned queue and record verification results in the field.',
  },
  {
    role: 'gatc',
    label: 'Testing Centre',
    who: 'Government-approved testing centres (GATC)',
    does: 'Manage incoming applications and testing workload at your centre.',
  },
  {
    role: 'admin',
    label: 'Administrator',
    who: 'System administrators',
    does: 'Approve testing centres, manage accounts, and oversee the system.',
  },
];

const STEPS = [
  { n: '01', title: 'Register', body: 'Add the instrument you need verified — its make, model, and category.' },
  { n: '02', title: 'Apply', body: 'Submit a verification application and choose a nearby testing centre.' },
  { n: '03', title: 'Inspect', body: 'An officer verifies the instrument on the scheduled date.' },
  { n: '04', title: 'Certify', body: 'A certificate is issued, carrying a QR code anyone can check.' },
];

function SealMark({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const r1 = 56, r2 = i % 6 === 0 ? 50 : 53;
        const x1 = 60 + r1 * Math.cos(angle), y1 = 60 + r1 * Math.sin(angle);
        const x2 = 60 + r2 * Math.cos(angle), y2 = 60 + r2 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" />;
      })}
      <g className="seal-needle" style={{ transformOrigin: '60px 60px' }}>
        <line x1="60" y1="60" x2="60" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="60" r="4" fill="currentColor" />
      </g>
      <path d="M42 62 L54 74 L80 46" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="seal-check" />
    </svg>
  );
}

export default function LandingPage() {
  const [certInput, setCertInput] = useState('');
  const navigate = useNavigate();

  function handleVerify(e) {
    e.preventDefault();
    const trimmed = certInput.trim();
    if (trimmed) navigate(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      <style>{`
        .seal-needle { animation: settle 2.4s ease-out 0.2s both; }
        .seal-check { stroke-dasharray: 60; stroke-dashoffset: 60; animation: draw 0.6s ease-out 1.4s both; }
        @keyframes settle { 0% { transform: rotate(-70deg); } 70% { transform: rotate(8deg); } 100% { transform: rotate(0deg); } }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .seal-needle, .seal-check { animation: none !important; stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Top bar */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-seal/70">
            Legal Metrology &middot; Online Verification System
          </span>
          <nav className="flex items-center gap-6 font-mono text-[12px] uppercase tracking-wide">
            <Link to="/verify" className="text-seal hover:text-brass transition-colors">Verify a certificate</Link>
            <Link to="/login/consumer" className="text-seal hover:text-brass transition-colors">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-grid-fine bg-[length:28px_28px]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-brass">
              Weights &amp; measures, on the record
            </p>
            <h1 className="mt-4 font-display text-[2.75rem] font-medium leading-[1.05] tracking-tight text-seal sm:text-6xl">
              Every measure,
              <br />
              <span className="italic">verified.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">
              The official system for registering, testing, and certifying weighing
              and measuring instruments — from application to a certificate anyone
              can check.
            </p>

            <form onSubmit={handleVerify} className="mt-10 max-w-md">
              <label htmlFor="cert-lookup" className="font-mono text-[11px] uppercase tracking-wide text-ink/60">
                Check a certificate
              </label>
              <div className="mt-2 flex items-stretch border border-seal/30 bg-white/70 focus-within:border-seal">
                <input
                  id="cert-lookup"
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  placeholder="e.g. LM-2026-004821"
                  className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-seal px-5 font-mono text-[12px] uppercase tracking-wide text-paper transition-colors hover:bg-brass"
                >
                  Verify
                </button>
              </div>
              <p className="mt-2 text-xs text-ink/50">No account needed — anyone can confirm a certificate is genuine.</p>
            </form>
          </div>

          <div className="flex justify-center md:justify-end">
            <SealMark className="h-48 w-48 text-seal md:h-64 md:w-64" />
          </div>
        </div>
      </section>

      {/* Counters — role entry points */}
      <section className="border-t border-line bg-white/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-ink/50">Sign in as</h2>
          <div className="mt-6 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {COUNTERS.map((c) => (
              <div key={c.role} className="flex flex-col justify-between bg-paper p-6">
                <div>
                  <h3 className="font-display text-xl font-medium text-seal">{c.label}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-brass">{c.who}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{c.does}</p>
                </div>
                <div className="mt-6 flex items-center gap-4 font-mono text-[12px] uppercase tracking-wide">
                  <Link to={`/login/${c.role}`} className="text-seal hover:text-brass transition-colors">
                    Sign in
                  </Link>
                  {c.role !== 'admin' && (
                    <Link to={`/register/${c.role}`} className="text-ink/50 hover:text-brass transition-colors">
                      Register
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-ink/50">How verification works</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="border-l-2 border-brass/40 pl-4">
                <span className="font-mono text-xs text-brass">{s.n}</span>
                <h3 className="mt-1 font-display text-lg font-medium text-seal">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-ink/50">
          Online Verification System for Weighing &amp; Measuring Instruments — Legal Metrology.
        </div>
      </footer>
    </div>
  );
}
