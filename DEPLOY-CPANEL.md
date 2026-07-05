# Deploying ECHAMELO to GoDaddy cPanel (shared hosting)

> **Read this first.** ECHAMELO is a Next.js app that runs server-side code
> (login/auth, `/api/*` routes, server-rendered pages). It is **not** a static
> site — you cannot drop HTML files in `public_html` and have it work. It needs
> cPanel's **"Setup Node.js App"** feature running **Node 20+**. If your plan
> doesn't have that feature (GoDaddy "Economy" usually doesn't) or only offers
> Node < 20, this app cannot run there and you'll need a VPS or a Node host.

---

## Step 0 — Confirm your plan can run it (do this before anything else)

1. Log in to GoDaddy → **My Products** → your Web Hosting → **cPanel Admin**.
2. In cPanel, look under the **Software** section for **"Setup Node.js App"**.
   - **Not there?** Stop — this plan can't host ECHAMELO. (See "If Node isn't
     available" at the bottom.)
3. Click it → **Create Application** → open the **Node.js version** dropdown.
   - Must offer **20.x or higher**. If the max is 18 or lower, stop — Next.js 16
     won't run.

If you have "Setup Node.js App" **and** Node 20+, continue.

---

## Step 1 — Upload the app

You'll upload `echamelo-deploy.zip` (in the project root). It already contains a
production build; you do **not** run `npm install` or `npm run build` on the
server.

1. cPanel → **File Manager**.
2. Create a folder **outside** `public_html`, e.g. `echamelo-app`
   (so the source isn't web-served directly).
3. Enter `echamelo-app`, click **Upload**, choose `echamelo-deploy.zip`.
4. Back in File Manager, select the zip → **Extract** → into `echamelo-app`.
   You should now see `server.js`, `node_modules/`, `.next/`, `public/`,
   `package.json` inside `echamelo-app`.
   - If you don't see the `.next` folder, enable **Settings → Show Hidden Files
     (dotfiles)** in File Manager and re-check; the extract must include it.

---

## Step 2 — Create the Node.js application

cPanel → **Setup Node.js App** → **Create Application**:

- **Node.js version:** 20+ (highest offered)
- **Application mode:** Production
- **Application root:** `echamelo-app` (the folder from Step 1)
- **Application URL:** your domain (e.g. `echamelo.com.mx`)
- **Application startup file:** `server.js`

Click **Create**. Don't start it yet — set env vars first.

---

## Step 3 — Environment variables

Still on the Node.js App screen, find **Environment variables** and add every
key from `.env.production.example` with your real values. The **SECRET** ones
(service role key, Stripe secret, LiveKit secret, webhook secret, Resend key)
are required at runtime.

> The `NEXT_PUBLIC_*` values are already baked into this build from your
> `.env.local`. To change them (e.g. switch to live Stripe keys) you must
> rebuild locally and re-upload — see "Updating the app" below.

Then click **Save**, then **Restart** / **Start App**.

---

## Step 4 — Point the webhooks & domain

1. **Stripe webhook:** in the Stripe Dashboard → Developers → Webhooks, set the
   endpoint to `https://echamelo.com.mx/api/stripe/webhook` and put the signing
   secret into `STRIPE_WEBHOOK_SECRET` (Step 3), then restart the app.
2. **LiveKit webhook:** point it at `https://echamelo.com.mx/api/livekit/webhook`.
3. **Domain:** if the Node app URL isn't already your main domain, in cPanel map
   the domain/subdomain to the app (the Node.js App URL field usually handles
   this; otherwise use a small `.htaccess` Passenger passthrough — ask if you
   hit this).

Visit `https://echamelo.com.mx` — you should get the login page.

---

## Updating the app later

1. On your computer, in the project folder, run `npm run build`.
2. Re-assemble the bundle (the same steps that produced `echamelo-deploy.zip`):
   copy `.next/standalone/*`, then `.next/static` → `.next/standalone/.next/static`,
   and `public` → `.next/standalone/public`; zip it.
3. In cPanel, delete the old contents of `echamelo-app`, upload + extract the new
   zip, and **Restart** the Node.js app.

---

## If Node isn't available (or too old)

Your shared plan can't run this app. Reliable alternatives, cheapest first:

- **Keep the GoDaddy domain, host the app on a Node host.** You only change DNS
  at GoDaddy to point at the host. Options: Railway, Render, Fly.io, or a small
  VPS (DigitalOcean/Hetzner ~US$5/mo). This is the least-hassle path.
- **Upgrade to a GoDaddy VPS** (root/SSH). Then run the standalone build with
  `pm2` behind nginx — I can give you those steps.

---

## Known limitations on shared cPanel

- Shared hosting has limited RAM/CPU; a busy live auction may be sluggish.
- Passenger occasionally needs a manual **Restart** after a crash.
- Image optimization is disabled (`images.unoptimized`) to avoid needing `sharp`.
- Supabase, LiveKit, and Stripe all run as external services — those are
  unaffected by where this Node app is hosted.
