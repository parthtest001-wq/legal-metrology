# Integration Report — 7-Module Merge

## 1. Folder merge

All 7 modules' files laid out into the single tree from Master Spec
Section 2. **No file path collisions** — every module wrote to its own
model/controller/route filenames, and the two files that needed disentangling
were an artifact of a messy zip, not a real collision:

- Module 3's zip contained a flat, duplicate copy of several page files
  (`Allocation.jsx`, `MyQueue.jsx`, etc.) at its zip root *and* a correctly
  nested copy under `mnt/user-data/outputs/module-3/frontend/src/pages/...`
  (leftover from wherever that module's files were originally generated).
  The nested, correctly-pathed versions were used; the flat duplicates were
  the same content minus the folder structure and were discarded.

## 2. Model deduplication

8 model files, no duplicate ownership:

| Model | Owner | Notes |
|---|---|---|
| `User.js`, `GATC.js` | Module 1 | unchanged |
| `Instrument.js`, `Application.js` | Module 2 | unchanged |
| `VerificationRecord.js` | Module 3 | unchanged |
| `Certificate.js` | Module 4 | unchanged |
| `Notification.js` | Module 5 | unchanged |
| `NotificationPreference.js` | Module 5 | **not in Section 3's model list** — an additive new file Module 5 owns outright (per-user email/SMS toggles). Not a duplicate of anything; kept. |

No two modules redefined the same model. No field was renamed or dropped.

## 3. Route merge

`backend/routes/index.js` mounts all 11 route files, each at its exact
Section 4 prefix, each exactly once — see the checklist result below for the
verification grep. One route's **authorization** (not its path) needed
correcting:

- `GET /api/v1/users` was `authorize(admin)` only per Section 4's table, but
  Module 3's Allocation UI calls it (filtered `?role=lmo`) for **both**
  admin and gatc users to populate the "assign to LMO" dropdown — the
  `assignApplication` endpoint itself already accepts gatc callers. Extended
  to `authorize(admin, gatc)`. Flagged for the Section 4 table.

## 4. Middleware consistency

Every protected route uses the single `authenticate`/`authorize` pair from
Module 1's `auth.middleware.js` — grepped for `jwt.verify` outside that file
and found nothing. No module re-implemented its own auth check.

## 5. Response format consistency

Every controller goes through `apiResponse.js`'s `success()`/`error()`
helpers — grepped for raw `res.json(`/`res.status().json(` outside that
file; the only hit was a comment in `alert.controller.js`'s docstring, not
real code.

## 6. Frontend routing merge

`AppRoutes.jsx` was rebuilt as a real merge of all 7 modules' pages (see the
file itself for the full route table). Two structural decisions:

- **AppLayout wrapping**: Module 6's 5 pages (4 dashboards + `SearchResults`)
  already import and self-wrap in `<AppLayout>`. No other module's page did
  (Modules 2/3/4/7 built bare content divs with no nav shell at all). Rather
  than edit 10+ files to add their own `<AppLayout>`, every non-Module-6
  route wraps its element in `<AppLayout>` centrally in `AppRoutes.jsx`;
  Module 6's 5 routes are left bare so they're never double-wrapped.
- **`allowedRoles` vs `roles`**: Module 1's real `ProtectedRoute` component
  takes a prop called `allowedRoles`. Every other module's own
  integration-snippet docs (Modules 3, 6, 7 — `app-routes-snippet.md`,
  `PATCH_INSTRUCTIONS.md`, `module7-integration-snippets.md`) instead wrote
  `<ProtectedRoute roles={[...]}>`. Passing an unrecognized prop silently
  disables the role check entirely (any authenticated user passes), so this
  would have been a real access-control hole if any snippet had been
  copy-pasted verbatim. `AppRoutes.jsx` uses `allowedRoles` everywhere.

**Known gaps** (nav links removed, not silently dropped, from
`AppLayout.jsx` — pointing them at a route with no page would be worse than
naming the gap): no module built a frontend page for admin user management
(`GET`/`PATCH /users` exist as backend routes only), admin GATC approval
(`PATCH /gatc/:id/approve` — backend only), a standalone consumer instrument
list (Module 2 deliberately collects instrument fields inline on
`NewApplication.jsx`), or a standalone GATC "workload" view (that data
already renders inside `GatcDashboard`).

**Post-merge addition — admin user/GATC management UI:** the two admin
gaps above (user management, GATC approval) are now closed. Added:
`frontend/src/services/userService.js` and `gatcService.js` (thin wrappers
over the existing, unchanged `GET/PATCH /users` and `GET/POST /gatc`,
`PATCH /gatc/:id/approve` routes — no backend changes were needed);
`frontend/src/components/admin/UserManagementTable.jsx` (role/state
filters, active/suspend toggle, self-deactivation disabled) and
`GatcApprovalTable.jsx` (approval-status filter, approve/suspend actions,
plus a form for the previously-unused `POST /gatc` admin-create endpoint);
`frontend/src/pages/admin/Users.jsx` and `Gatcs.jsx` (bare content, same
convention as `Allocation.jsx`); wired into `AppRoutes.jsx` at
`/admin/users` and `/admin/gatcs` via the existing `withLayout` helper; and
the two nav links restored in `AppLayout.jsx`'s admin menu. The consumer
instrument-list and GATC-workload gaps remain open (out of scope — no
backend route exists for either).

## 7. Dependency merge

`backend/package.json` — every module used Section 1's pinned versions
exactly; no conflicts, nothing to resolve.

`frontend/package.json` — one addition: Module 6's `recharts@^2.12.7`
(documented in its own `PATCH_INSTRUCTIONS.md` as "not in the Section 1
pinned table"). Module 7 deliberately added zero new dependencies (a
hand-written, dependency-free Vite plugin instead of `vite-plugin-pwa`).

## 8. Env variable merge

Consolidated `backend/.env.example` — added three vars that were used but
undeclared: `NOTIFY_SANDBOX` (Module 5's mailer), `SEED_ADMIN_EMAIL`,
`SEED_ADMIN_PASSWORD`, `SEED_ADMIN_PHONE` (Module 1's `seedAdmin.js`).
`frontend/.env.example` needed no changes — its one var (`VITE_API_BASE_URL`)
was already declared.

## 9. Database connection

Exactly one `mongoose.connect` call, in `backend/config/db.js`, called once
from `server.js` at boot. `seedAdmin.js` only *closes* the shared connection
after its one-off script runs; it never opens its own.

## 10. Integration checklist — run explicitly

| # | Check | Result | Fix (if any) |
|---|---|---|---|
| 1 | Duplicate model definitions | **Pass** | n/a — see Section 2 above |
| 2 | Mismatched field names | **Pass** | n/a |
| 3 | Conflicting route prefixes | **Pass** | n/a — 11 distinct prefixes, `index.js` edited additively |
| 4 | Missing middleware imports (`jwt.verify` outside `auth.middleware.js`) | **Pass** | n/a |
| 5 | Conflicting `package.json` versions | **Pass** | n/a — every module used Section 1's pinned versions |
| 6 | Multiple DB connections | **Pass** | n/a |
| 7 | Inconsistent response envelopes | **Pass** | n/a (one docstring mention, not real code) |
| 8 | Shared constants drift | **Pass** | `sharedConstants.js` is byte-identical (modulo the expected CJS→ESM format conversion) to what `sync-constants.js` would generate from the current `constants.js` |
| 9 | Uploads folder path mismatches | **Pass** | all three subfolders (`instruments`, `applications`, `certificates`) present under the one canonical `backend/uploads/`; no module wrote its own local `uploads/` |
| 10 | Env vars used but undeclared | **Fail → Fixed** | added `NOTIFY_SANDBOX`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_PHONE` to `.env.example` |

## Bugs found and fixed during merge (beyond the checklist's own items)

These aren't covered by name in Section 10's table but are the same class of
problem — a module built correctly in isolation, against an assumption about
a shared file that turned out not to hold once the real file showed up:

1. **`req.user.gatcId` is always `undefined`** — the JWT payload (Section 6)
   only signs `{ id, role, name }`. Modules 2 (`application.controller.js`,
   both `listApplications` and `getApplication`) and 5
   (`alert.controller.js`) trusted `req.user.gatcId` directly. Fixed by
   looking the caller's `gatcId` up from `User.js`, matching the pattern
   Modules 3 and 6 already used correctly for the same problem.
2. **`upload.array('photos', 10)` crashed the server at boot** — Module 3's
   `verification.routes.js` called `.array()` directly on Module 2's
   `upload.middleware.js` export, which only ever exposed two purpose-bound
   middlewares plus `urlFor`, no generic uploader. Added
   `uploadVerificationPhotos` to `upload.middleware.js` and pointed the route
   at it.
3. **Hardcoded status literals bypassing `shared/constants.js`** — `'pending_verification'`
   in Module 2's `application.controller.js` and `'verified'` in Module 4's
   `certificate.controller.js`. Both now import and use
   `INSTRUMENT_STATUS.*`.
4. **Frontend `applicationService`/`schedulingService` import mismatches** —
   both are default-exported objects with no named exports, but several
   consuming files (Module 3's `AllocationList.jsx` and `pages/gatc/MyQueue.jsx`;
   Module 7's `offlineQueueService.js`, `FieldInspectionForm.jsx`,
   `FieldQueueList.jsx`, `FieldApplicationDetail.jsx`) used named imports
   with names that don't exist on those modules (`getApplications`,
   `getApplicationById`, `getLmoQueue`, `submitVerification`) and, in most
   cases, also assumed the wrong response shape (destructuring a raw axios
   response instead of the already-unwrapped value these services actually
   return). All six call sites fixed to the real export style, method name,
   and return shape.
5. **`FieldQueue.jsx` imported a default export that doesn't exist** —
   `import AuthContext from '../../context/AuthContext'` then
   `useContext(AuthContext)`; `AuthContext.jsx` only exports `useAuth` and
   `AuthProvider` (named), never the context object itself. Switched to
   `useAuth()`, same as every other page.
6. **Module 5's cron job was built but never wired up** — `cronJobs.js`
   exported `registerCronJobs()`, and Module 5's own deliverables doc
   flagged the exact `server.js` line needed, but no module owns
   `server.js`, so nothing had called it yet. Added the call.
7. **Module 7's PWA wiring (service worker registration, manifest link,
   Vite build plugin) was fully written and documented but never actually
   applied** to the three shared files it touches — `main.jsx`,
   `vite.config.js`, `index.html`. Applied all three: the Vite plugin that
   emits `service-worker.js` to the build root, the registration call in
   `main.jsx`, and a `<link rel="manifest">` tag (missing even from Module
   7's own snippet doc — without it no browser would ever discover
   `manifest.json`).

## 11–12. Final output

See the repository tree for full file contents. Files that needed no change
during merge are listed as such in the file-by-file breakdown; every file
that needed a fix has a `// MERGE FIX` or `// MERGE ADDITION` comment at the
change site, in place, explaining what was wrong and why. Root `README.md`
covers install, env setup, admin seeding, running both servers, and an
8-step smoke test of the full register → apply → schedule → inspect →
certify → verify → alert flow.
