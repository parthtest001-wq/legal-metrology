# Deploy this app for free — step by step

This gets you a live URL using: **MongoDB Atlas** (database) + **Cloudinary**
(photo/file storage) + **Render** (backend) + **Vercel** (frontend). All
free, no credit card needed.

Config files are already included: `render.yaml` (backend) and
`frontend/vercel.json` (frontend), so both hosts auto-detect the right
settings — you mostly just click through and paste in a few values.

---

## 0. Install these first (one-time, on your computer)

- **Node.js** (v20+): https://nodejs.org — download, install, click through
- **Git**: https://git-scm.com/downloads
- (Optional) **VS Code**: https://code.visualstudio.com

Check they installed correctly:
```bash
node -v
git --version
```

## 1. Create free accounts

- GitHub: https://github.com/join
- MongoDB Atlas: https://mongodb.com/cloud/atlas/register
- Cloudinary: https://cloudinary.com/users/register/free
- Render: https://render.com (sign up with GitHub)
- Vercel: https://vercel.com (sign up with GitHub)

## 2. Push this project to GitHub

Unzip this project, open a terminal inside the folder, then:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/legal-metrology.git
git push -u origin main
```

(Create the empty `legal-metrology` repo on GitHub first via "New repository".)

## 3. Database — MongoDB Atlas

1. Build a Database → **M0 Free** tier → any nearby region → Create
2. Create a database username + password (save them)
3. Network Access → Add IP Address → **Allow Access from Anywhere**
4. Connect → Drivers → copy the connection string:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/legal_metrology`
   (put your real password in, keep `/legal_metrology` as the db name)

## 4. File storage — Cloudinary

Instrument photos, application documents, and inspection photos upload
straight to Cloudinary instead of local disk, so they survive redeploys.

1. Log in to https://cloudinary.com/console
2. On the Dashboard home page, copy these three values:
   - **Cloud name**
   - **API Key**
   - **API Secret** (click "reveal" if it's hidden)
3. Keep this tab open — you'll paste these into Render in the next step.

The free tier gives 25 GB storage / 25 GB monthly bandwidth, which is
plenty for a demo.

## 5. Backend — Render

1. Render dashboard → **New +** → **Blueprint** → select your repo
   (Render will read `render.yaml` automatically and pre-fill most settings)
2. It will ask for the values marked `sync: false` — fill in:
   - `MONGO_URI` → the Atlas connection string from step 3
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
     → the three values from step 4
   - `FRONTEND_URL` → leave blank for now, you'll add it in step 7
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_PHONE` → your choice, or leave blank to use defaults
3. Deploy. When it's live, copy the URL, e.g. `https://legal-metrology-backend.onrender.com`

*(No blueprint option? Use "New +" → "Web Service" instead, and manually
set Root Directory = `backend`, Build Command = `npm install`,
Start Command = `npm start`, then add the same env vars by hand.)*

## 6. Frontend — Vercel

1. Vercel dashboard → **Add New** → **Project** → select your repo
2. Root Directory → Edit → choose `frontend` (Vercel will then pick up
   `frontend/vercel.json` automatically)
3. Add environment variable:
   `VITE_API_BASE_URL` = `https://legal-metrology-backend.onrender.com/api/v1`
   (your Render URL from step 5, with `/api/v1` on the end)
4. Deploy. Copy your live URL, e.g. `https://legal-metrology.vercel.app`

## 7. Connect the two

Back in Render → your backend service → Environment → set
`FRONTEND_URL` to your Vercel URL from step 6 → save (auto-redeploys).
This is required for CORS to allow your frontend to call the backend.

## 8. Create your admin login

Render → your service → **Shell** tab → run:
```bash
npm run seed:admin
```

Then visit your Vercel URL — the app is live.

---

## Known free-tier limits

- **Render free tier sleeps after 15 min idle** — first request after
  sleeping takes ~30–50s to wake up. Fine for demos/testing.
- **Instrument photos, application documents, and inspection photos are
  stored on Cloudinary**, so they persist across Render redeploys (Render's
  free tier has no persistent disk). Cloudinary's free tier caps out at
  25 GB storage / 25 GB bandwidth per month.
- **Certificate PDFs and QR codes are still generated on Render's local
  disk** and are wiped on redeploy — they're regenerated automatically the
  next time they're requested, so this is only a mild cold-start delay, not
  data loss. Fine for a demo; ask if you want these moved to Cloudinary too.
- Real expiry-alert emails need real `SMTP_USER`/`SMTP_PASS` (e.g. a
  Gmail app password). Left unset, `NOTIFY_SANDBOX=true` just logs them
  instead of sending — no setup needed for a demo.
