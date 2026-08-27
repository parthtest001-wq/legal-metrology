# Online Verification System for Weighing and Measuring Instruments

Merged monorepo of all 7 module deliverables (Auth, Application/Instrument
Management, Scheduling/Verification, Certificate Generation, Validity
Tracking & Alerts, Dashboards/Search/Export, Field Verification PWA)
against the frozen Master Spec. See `docs/integration-report.md` for the
full merge log — every model dedup decision, route fix, and bug caught
during integration.

## 1. Prerequisites

- Node.js >= 20
- npm >= 10
- MongoDB running locally (or a connection string to a hosted instance),
  e.g. `mongod --dbpath ./data` on `mongodb://localhost:27017`
- (Optional) a real SMTP account, if you want Module 5's expiry emails to
  actually send instead of running in sandbox/log-only mode

## 2. Install

```bash
# from the repo root
cd backend && npm install
cd ../frontend && npm install
```

## 3. Environment setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` as needed:
- `MONGO_URI` — point at your MongoDB instance
- `JWT_SECRET` — replace with a real secret before any non-local use
- `SMTP_USER` / `SMTP_PASS` — leave blank to keep Module 5 in sandbox mode
  (emails are logged, not sent); fill in for real delivery and set
  `NOTIFY_SANDBOX=false`
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_PHONE` — used
  only by the admin-seeding script below

`frontend/.env` only needs `VITE_API_BASE_URL` — defaults to
`http://localhost:5000/api/v1`, matching the backend's default `PORT=5000`.

## 4. Seed an admin user

```bash
cd backend
npm run seed:admin
```

Creates (or updates) one `admin`-role user from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` / `SEED_ADMIN_PHONE` in `.env` (falls back to
`admin@legalmetrology.gov.in` / `ChangeMe123!` / `9999999999` if unset).
Log in at `/login/admin`.

## 5. Run

Two terminals:

```bash
# terminal 1 — backend, http://localhost:5000
cd backend
npm run dev

# terminal 2 — frontend, http://localhost:5173
cd frontend
npm run dev
```

The backend also starts Module 5's daily expiry-check cron job at boot
(`registerCronJobs()` in `server.js`) — certificates within 30 days of
`validUntil` get an alert automatically, once a day. You can also fire it
manually any time via `POST /api/v1/alerts/trigger-check` (admin-only).

### Field/PWA mode (Module 7)

`npm run build && npm run preview` in `/frontend` is the more realistic way
to try offline mode — the service worker only takes over a proper build
(see `vite.config.js`'s `copyServiceWorkerPlugin`). In plain `npm run dev`
the app still works, just without offline caching.

## 6. Smoke test — full end-to-end flow

Use two browser profiles/tabs (or one incognito) so a consumer session and
an LMO/GATC/admin session don't collide.

1. **Register** — `/register/consumer` → sign up as a consumer.
2. **Submit an application** — log in at `/login/consumer` → New
   Application → fill instrument details + pick a GATC → submit. Confirm
   it appears under **My Applications** with status `submitted`.
3. **Approve a GATC** (one-time, if none exist yet) — log in as admin
   (`/login/admin`, seeded above) → **Users** / **GATCs** in the admin nav →
   on the GATCs page, find the self-registered GATC (status `pending`) and
   click **Approve**. (The admin User/GATC management UI was a known gap in
   earlier builds — see `docs/integration-report.md` — and has since been
   added at `/admin/users` and `/admin/gatcs`.)
4. **Schedule** — log in as that GATC (`/login/gatc`) or admin → Allocation
   page → assign the application to an LMO with a scheduled date. Confirm
   the application moves to `scheduled` and shows up on that LMO's queue.
5. **Inspect** — log in as the assigned LMO (`/login/lmo`) → Inspection
   Queue → open the application → Record Inspection → enter observations,
   overall result `pass`, submit (with or without photos). Confirm status
   moves to `completed` and the instrument's status flips to `verified`.
   (Or try the same flow at `/lmo/field` for the offline-capable PWA path.)
6. **Certificate generated with QR** — as the consumer, open **My
   Certificates** → the new certificate should have a PDF and a QR code
   pointing at `/verify/:certificateNumber`.
7. **Verify via public link** — log out entirely (or use a private window)
   and open the certificate's `/verify/:certificateNumber` URL. It should
   resolve with no login required and show `active`/valid.
8. **Expiry alert fires** — as admin, `POST /api/v1/alerts/trigger-check`
   manually rather than waiting for the daily cron; confirm a notification
   appears for certificates nearing `validUntil` (or temporarily set
   `CERT_VALIDITY_YEARS` very low / adjust a test certificate's
   `validUntil` in Mongo to be within 30 days, then re-run the check).

If all 8 steps complete, the merged system's core loop (register → apply →
schedule → inspect → certify → verify → alert) is working end to end.
