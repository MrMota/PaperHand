# Deploy: Paperhand

Status: **preflight passed, waiting for your go.** Nothing is live yet. Every account step below is yours:
Claude never buys a domain, enters a card, signs in or pastes a live key.

## 1. Preflight (run 2026-11-07, final code)

| check | command | result |
| --- | --- | --- |
| end-to-end tests | `npx playwright test` | **57 / 57 passed** (twice in a row before this, 52/52) |
| must-haves | `python3 replica/tools/parity.py replica/features.csv` | **29 / 29**, feature score 83.7%, verdict shippable |
| rebrand sweep | `python3 replica/tools/sweep.py . --config replica/brand.json` | **clean** (exit 0) |
| store listing | `python3 replica/tools/listing.py replica/launch/listing.json` | **PASS** (for a later store release) |
| production build | `npm run build` | **passes**, 34 MB `dist/` (26 MB of it is one WebAssembly file, below) |
| contrast | `python3 replica/design/contrast.py replica/design/tokens.json` | **12 pairs OK, 0 AA failures** |
| accessibility | axe scan in e2e on home, templates, editor, landing, privacy, terms | no serious or critical issues |
| open S1 / S2 bugs | `replica/bugs.md` | **none** (7 found, 7 fixed) |

By hand:

| check | result |
| --- | --- |
| privacy policy page | **built**: `#/privacy`, lists every party (host, Hugging Face, Stripe, GitHub). **Fill in the two blanks first** (below). |
| terms page | **built**: `#/terms`. Same two blanks. |
| cookie banner | **not needed**: no cookies; IndexedDB only holds the person's own designs, which is strictly necessary for the app to work |
| account deletion | **n/a** (no accounts). "Delete everything" on the home screen removes all local data (e2e F13-H2). |
| data loss risk | **fixed before deploy**: design files (`.paperhand`), "Back up everything", "Open a design file" (e2e F13). It was a launch blocker in `launch-plan.md`. |
| favicon, titles, OG image | **ours**: interim mark, `Paperhand` / `<design> — Paperhand`, `public/og.png` 1200×630 from a real screenshot |

**Failures found during preflight and fixed in this step:** no privacy/terms pages, no OG image or tags, no way to
back up or move designs. All three are built and tested now.

## 2. Before you say go: three edits

1. **`src/components/Legal.tsx`**: replace `[your contact email]` and `[your name or company]`.
2. **Supporter links** (optional for launch): create them in Stripe (`launch/pricing.md`), then replace
   "Coming soon" in `src/components/About.tsx`. Leaving "Coming soon" is fine for launch.
3. **Name checks** from `brand.md` (trademark, domain, stores, handles). Do this **before** buying the domain.

## 3. Production services

| service | needed? | what to do |
| --- | --- | --- |
| database | **no** | everything is in the visitor's browser |
| env vars | **one** | `VITE_SITE_URL` = your live URL, no trailing slash (e.g. `https://paperhand.app`). Without it the social preview image doesn't show on X, LinkedIn, Slack. See `.env.example`. No secrets exist. |
| Stripe | only for supporter links | Payment Links in **live mode**; no webhook needed (nothing to unlock). Make one real $5 payment yourself and refund it. |
| OAuth | **no** | no sign-in |
| email sending | **no** | the app sends nothing. See the DNS note below so nobody can spoof your domain. |

## 4. Host and domain

**Netlify.** The repo is set up for it (`netlify.toml`: build command, publish dir, cache and security headers).

Why not the others: **Cloudflare Pages caps files at 25 MiB** and the background remover's WebAssembly file is
26 MB. Vercel works too; GitHub Pages works but has no preview URLs or custom headers.

Steps (yours):

1. Netlify → *Add new site* → *Import from Git* → GitHub → `MrMota/pigment`.
2. Production branch: `main` (merge `ccr-199b2d12-rnbdur` into it first). Build settings come from `netlify.toml`.
3. *Site configuration → Environment variables*: add `VITE_SITE_URL`.
4. Deploy. Pull requests now get preview URLs automatically.
5. *Domain management → Add a domain* once you've bought it.

DNS at your registrar (Netlify shows the exact values on the domain screen; **use those** if they differ):

| record | name | value |
| --- | --- | --- |
| A | `@` | `75.2.60.5` (Netlify's load balancer) |
| CNAME | `www` | `<your-site>.netlify.app` |

Canonical host: **apex** (`paperhand.app`), with `www` redirecting to it (set "primary domain" in Netlify).
HTTPS: Netlify issues the certificate automatically; check it after DNS propagates.

Email DNS: Paperhand sends no email. If the domain will **never** send mail, publish these so nobody can send as you:

| record | name | value |
| --- | --- | --- |
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject;` |

If you set up a mailbox on the domain for the contact address, use your mail provider's SPF/DKIM records instead,
and start DMARC at `v=DMARC1; p=none; rua=mailto:you@yourdomain`, tightening to `quarantine` once reports are clean.

**Content-Security-Policy is deliberately not set yet.** The AI background-removal path downloads its model from
Hugging Face (and possibly its CDN hosts) and was never run end to end here, because those hosts were blocked in the build
environment. A wrong CSP would break it silently. After launch, test the AI cut-out live, note the hosts it calls
in the browser's network tab, then add a CSP allowing exactly those.

## 5. Watching it

Consistent with "no tracking": no analytics script, no automatic error reporting in the app.

| what | how |
| --- | --- |
| uptime | a free uptime monitor (e.g. UptimeRobot, Better Stack) on `https://<domain>/` and `https://<domain>/og.png`, alerting your email/phone |
| visits | Netlify's server-side analytics (no script, no cookies), mentioned in the privacy policy as host logs |
| errors | GitHub issues; later an opt-in "Report a problem" link (`launch-plan.md`) |
| deploys | Netlify emails on failed deploys; turn that on |

**First-week checklist, on the live site:**

- [ ] do the core flow yourself: template → edit text → Download PNG (4 clicks)
- [ ] on your phone: the same, plus upload a photo from the camera roll
- [ ] **AI background removal**, both methods, on a real photo. It has never run outside a sandbox. Note how long the first
      model download takes and whether WebGPU or WASM ran.
- [ ] Back up everything → Delete everything → Open the backup (a fresh browser profile is fine)
- [ ] paste the URL into Slack/X/LinkedIn: the OG card shows the image
- [ ] check `https://www.<domain>` redirects to the apex, and HTTP redirects to HTTPS
- [ ] read the uptime monitor and GitHub issues daily

## 6. Mobile

**Not now.** Paperhand is a web app and works in mobile browsers. Store releases need an installable offline build
first (fix X3 in `fixes.md`), then a wrapper: a Trusted Web Activity for Google Play ($25 once, your account), or
Capacitor for the App Store ($99/yr, your account; plain web wrappers risk rejection under Apple's minimum-functionality
rule). The listing is ready in `launch/listing.json`.

## Live URL

_Not deployed yet._ Fill in after your go: `https://` ______________
