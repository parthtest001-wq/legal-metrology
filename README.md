# Online Verification System for Weighing & Measuring Instruments

**A digital Legal Metrology platform** — the government system that governs
how weighing scales, weighbridges, taximeters, fuel dispensers, water
meters, and other measuring instruments get officially inspected,
verified, and certified in India.

This project replaces a paper-based, walk-in verification process with an
end-to-end digital workflow: an instrument owner applies online, a
government officer inspects and records the result, and a tamper-evident
digital certificate — publicly verifiable by anyone via QR code — is
issued automatically.

**Live demo:** `https://legal-metrology.vercel.app/`
**API base:** `https://legal-metrology-backend-9w4m.onrender.com`

---

## Table of contents

- [The problem this solves](#the-problem-this-solves)
- [Who uses it](#who-uses-it--the-four-roles)
- [How it works end-to-end](#how-it-works-end-to-end)
- [Certificate verification](#public-certificate-verification)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Running it locally](#running-it-locally)
- [Deployment](#deployment)
- [API overview](#api-overview)
- [Data model](#data-model)
- [Security](#security)
- [Known limitations & next steps](#known-limitations--next-steps)

---

## The problem this solves

Under India's Legal Metrology Act, every commercial weighing/measuring
instrument must be periodically inspected and certified by a government
officer — otherwise it's illegal to use for trade. Today this is largely a
manual, in-person, paper-certificate process: hard to track, hard to
audit, and easy to forge.

This system digitizes the whole lifecycle:

- Consumers apply for verification online instead of visiting an office.
- Applications are routed to a testing centre and assigned to an officer.
- The officer's inspection result is recorded digitally, on-site — even
  **offline**, in areas with poor connectivity (see the Field PWA below).
- A pass automatically generates a certificate with a **QR code that
  anyone can scan to verify authenticity**, no login required.
- The system proactively tracks certificate expiry and reminds owners to
  re-verify before their certificate lapses.

## Who uses it — the four roles

| Role | Real-world identity | What they do in the system |
|---|---|---|
| **Consumer** | Shop owner, dealer, or individual who owns an instrument | Registers instruments, submits applications, tracks status, views/downloads certificates |
| **LMO** (Legal Metrology Officer) | Government inspecting officer | Views their assigned queue, performs inspections (in-office or in the field), records pass/fail results |
| **GATC** (Govt. Approved Testing Centre) | A licensed testing facility | Receives applications routed to it, assigns them to officers |
| **Admin** | System administrator | Approves new testing centres, manages user accounts, oversees the whole system |

Consumer, LMO, and GATC accounts are self-registered (GATC accounts require
admin approval before they're active). Admin accounts are deliberately
**not** self-registrable — they're created via a one-time seed script,
since granting admin access should never be a public form.

## How it works end-to-end

```
1. Consumer registers an instrument
        ↓
2. Consumer submits a verification application, choosing a testing centre
        ↓  status: submitted
3. The GATC (or admin) assigns an officer and a date
        ↓  status: scheduled
4. Work begins on the scheduled date
        ↓  status: in_progress
5. The officer inspects the instrument and records a result
        ↓
   ┌─────────────┴─────────────┐
   ▼                           ▼
 PASS                        FAIL
   │                           │
   ▼                           ▼
6. Certificate auto-generated   status: rejected
   (certificate number, QR code,
   1-year validity)
   status: completed
        ↓
7. Consumer can view/download the certificate anytime.
   Anyone can verify it publicly via its QR code — no login needed.
        ↓
8. As the certificate nears expiry, the system automatically
   notifies the consumer (in-app + email/SMS) to re-verify.
```

Every status transition above is enforced by a **central state machine**
(`backend/utils/stateMachine.js`) — controllers can't set an application to
an arbitrary status; only legally valid transitions are allowed
(e.g. you can't jump straight from `submitted` to `completed`).

### Field Verification PWA

Officers often inspect instruments at a shop or site with poor or no
internet connectivity. The LMO portal is a **Progressive Web App** with:
- A service worker that caches the app shell for offline use
- An offline inspection queue: results recorded without connectivity are
  stored locally and **automatically synced** once the officer is back
  online — including generating the certificate retroactively on sync.

## Public certificate verification

The single feature that makes this trustworthy to a third party (a
customer, another inspector, an auditor) rather than just the two parties
involved:

- Every certificate carries a **QR code** encoding a link to
  `/verify/:certificateNumber`.
- Scanning it hits a **public, unauthenticated** API endpoint
  (`GET /api/v1/certificates/verify/:certificateNumber`).
- The response confirms validity (`active` / `expired` / `revoked`) and
  shows basic instrument details (category, make, model) — but
  **deliberately never exposes the owner's name, address, or contact
  info.** It proves the certificate is real without leaking who holds it.

## Tech stack

**Frontend**
- React 18 + Vite
- React Router v6 (role-based protected routes)
- Tailwind CSS
- Axios
- Recharts (dashboard charts)
- Progressive Web App (service worker, offline queue) for the field LMO flow

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication + bcrypt password hashing
- Cloudinary (instrument photos & documents — no files touch the server's own disk)
- node-cron (daily certificate-expiry scan)
- PDF generation (pdfkit) + QR code generation for certificates

**Infrastructure**
- Frontend deployed on **Vercel**
- Backend deployed on **Render**
- Database on **MongoDB Atlas**

## Architecture

```
┌─────────────┐        HTTPS / JSON         ┌──────────────┐
│   Frontend   │ ───────────────────────────▶│   Backend    │
│ React + Vite │◀─────────────────────────── │ Node/Express │
│  (Vercel)    │      JWT bearer auth         │  (Render)    │
└─────────────┘                              └──────┬───────┘
                                                     │
                              ┌──────────────────────┼───────────────────┐
                              ▼                      ▼                   ▼
                        ┌───────────┐        ┌──────────────┐   ┌───────────────┐
                        │ MongoDB   │        │  Cloudinary   │   │  node-cron    │
                        │  Atlas    │        │ (file storage)│   │ (daily alert  │
                        │           │        │               │   │  scan)        │
                        └───────────┘        └──────────────┘   └───────────────┘
```

Every request to a protected route flows through the same pipeline:

```
Request → CORS/JSON parsing → JWT auth → role authorization
        → (route-specific validation) → controller → response envelope
        → (on error) → centralized error handler
```

Every API response — success or failure — follows one fixed shape, so the
frontend never has to guess:

```json
{ "success": true, "data": { ... }, "message": "OK", "error": null }
```

## Project structure

```
├── backend/
│   ├── server.js              # App entry point
│   ├── config/                # Env config, DB connection
│   ├── models/                # Mongoose schemas
│   │   ├── User.js             # All 4 roles, one collection
│   │   ├── GATC.js
│   │   ├── Instrument.js
│   │   ├── Application.js
│   │   ├── VerificationRecord.js
│   │   ├── Certificate.js
│   │   ├── Notification.js
│   │   └── NotificationPreference.js
│   ├── controllers/            # Business logic, one file per feature
│   ├── routes/                 # URL → controller + role rules
│   ├── middleware/             # Auth, validation, error handling, uploads
│   ├── utils/                  # State machine, QR/PDF generation, cron, email/SMS
│   └── scripts/seedAdmin.js    # One-time admin account creation
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Route-level pages, grouped by role
│   │   │   ├── public/           # Landing page, certificate verification
│   │   │   ├── consumer/
│   │   │   ├── lmo/
│   │   │   ├── gatc/
│   │   │   └── admin/
│   │   ├── components/          # Reusable UI, grouped by feature
│   │   ├── services/            # API client + one service module per resource
│   │   ├── routes/               # Route definitions + role-based route guards
│   │   └── service-worker.js    # Offline support for the field LMO flow
│   └── ...
│
└── shared/constants.js         # Roles, statuses — shared vocabulary for both apps
```

## Running it locally

### Prerequisites
- Node.js ≥ 20, npm ≥ 10
- A MongoDB connection (local, or a free MongoDB Atlas cluster)
- A free Cloudinary account (for file uploads)

### 1. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

`backend/.env`:
```env
PORT=5000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any long random string>
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=<from your Cloudinary dashboard>
CLOUDINARY_API_KEY=<from your Cloudinary dashboard>
CLOUDINARY_API_SECRET=<from your Cloudinary dashboard>
FRONTEND_URL=http://localhost:5173
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<choose a password>
SEED_ADMIN_PHONE=<a 10-digit number, e.g. 9876543210>
```

`frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Seed an admin account
Admin accounts can't self-register — this is the only way to create one:
```bash
cd backend
npm run seed:admin
```

### 4. Run both apps
```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```
Visit the frontend URL Vite prints (usually `http://localhost:5173`).

## Deployment

- **Backend → Render:** root directory `backend`, build command
  `npm install`, start command `npm start`. Set the same environment
  variables as above (with `NODE_ENV=production` and `FRONTEND_URL`
  pointing at your live Vercel domain).
- **Frontend → Vercel:** root directory `frontend`, framework preset
  **Vite**. Set `VITE_API_BASE_URL` to your live Render backend's
  `/api/v1` URL.
- **Database → MongoDB Atlas:** free-tier (M0) cluster works fine for a
  demo; add `0.0.0.0/0` to Network Access since Render's outbound IPs are
  dynamic.

Both platforms auto-redeploy on every push to `main`.

## API overview

Base URL: `/api/v1`. 🔒 = requires a JWT (`Authorization: Bearer <token>`).

| Area | Endpoints |
|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` 🔒, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| **Users** | `GET /users` 🔒, `PUT /users/:id` 🔒, `PATCH /users/:id/status` 🔒 |
| **GATC** | `POST /gatc` 🔒 (admin), `GET /gatc` 🔒, `PATCH /gatc/:id/approve` 🔒 (admin) |
| **Instruments** | `POST /instruments` 🔒, `GET /instruments` 🔒, `GET /instruments/:id` 🔒 |
| **Applications** | `POST /applications` 🔒, `GET /applications` 🔒, `GET /applications/:id` 🔒, `PATCH /applications/:id/cancel` 🔒, `PATCH /applications/:id/edit` 🔒 |
| **Scheduling** | `PATCH /scheduling/applications/:id/assign` 🔒, `GET /scheduling/lmo/:lmoId/queue` 🔒, `PATCH /scheduling/applications/:id/status` 🔒 |
| **Verification** | `POST /verification/:applicationId` 🔒, `GET /verification/:applicationId` 🔒 |
| **Certificates** | `POST /certificates/:applicationId/generate` 🔒, `GET /certificates/verify/:certificateNumber` **(public)**, `GET /certificates` 🔒, `GET /certificates/:id` 🔒, `GET /certificates/:id/download` 🔒, `PATCH /certificates/:id/revoke` 🔒 |
| **Alerts** | `GET /alerts` 🔒, `PATCH /alerts/:id/read` 🔒, `GET /alerts/expiring-certificates` 🔒, `GET/PUT /alerts/preferences` 🔒 |
| **Dashboards** | `GET /dashboard/consumer` 🔒, `/lmo` 🔒, `/gatc` 🔒, `/admin` 🔒 — one summary endpoint per role |
| **Search** | `GET /search` 🔒, `GET /search/export` 🔒 (admin, gatc) |

## Data model

Eight core collections, all in MongoDB:

- **User** — a single collection for all four roles (differentiated by a
  `role` field), with role-specific required fields enforced conditionally
  (e.g. `officerCode` only required for LMOs).
- **GATC** — testing centre profile + admin approval status.
- **Instrument** — the physical device under verification.
- **Application** — links a consumer, instrument, and GATC; carries the
  status that drives the whole workflow.
- **VerificationRecord** — the officer's actual inspection data.
- **Certificate** — one-to-one with a completed, passed application;
  carries a unique certificate number (`CERT-<year>-<sequence>`), issue
  date, 1-year validity, and QR code URL.
- **Notification** / **NotificationPreference** — expiry alerts and
  per-user delivery preferences (in-app / email / SMS).

## Security

- Passwords hashed with **bcrypt**; plaintext never stored or logged.
- **JWT**-based auth on every protected route; tokens carry only
  `{ id, role, name }` — never sensitive data.
- **Role-based authorization** enforced server-side on every route, not
  just hidden in the UI.
- File uploads go straight to **Cloudinary**, never touching the app
  server's own disk.
- Public certificate verification is the one deliberately open endpoint,
  and it's engineered to reveal only what's needed to prove authenticity —
  never the owner's personal details.

## Known limitations & next steps

Being upfront about where this stands as a prototype:

- Certificate validity is currently a fixed 1 year for every instrument
  category, though the code is structured (a category → validity-years
  map) so category-specific periods can be added without restructuring.
- Validation is currently thorough on auth routes; other modules validate
  directly in their controllers rather than through the shared validation
  middleware.
- Admin-created GATC records (via the admin panel) create a testing-centre
  profile only — a login account is created only via the public GATC
  self-registration flow. Unifying these into one path is a natural next
  step.
- Render's free tier spins down on inactivity, so the very first request
  after idle time can take 30–60 seconds — worth knowing when demoing live.
