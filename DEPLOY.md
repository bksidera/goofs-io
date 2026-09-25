# Deploy

Three Vercel projects, one per app, each pointed at its own subdomain.

## First-time setup (per app)

For each of `apps/launcher`, `apps/adgame`, `apps/clicker`:

1. **New Project** on Vercel → connect this repo (`goofs-io`).
2. **Root Directory**: `apps/<name>` (this is the key setting for a monorepo).
3. **Framework Preset**: Vite (auto-detected).
4. **Build & Output** (leave defaults):
   - Install command: `npm install` (Vercel handles workspaces from the repo root automatically)
   - Build command: `npm run build`
   - Output directory: `dist`
5. **Node version**: 22 (or ≥20.19). Set via project settings → General → Node.js Version, or by keeping `.nvmrc` at the repo root (already committed).
6. **Domain**:
   - launcher → `goofs.io` (apex) + `www.goofs.io` redirect
   - adgame → `adgame.goofs.io`
   - clicker → `clicker.goofs.io`
7. **Environment Variables** (launcher only):
   - `VITE_ADGAME_URL` = `https://adgame.goofs.io`
   - `VITE_CLICKER_URL` = `https://clicker.goofs.io`
   - Applies to Production (Preview inherits or overrides as needed).

## DNS

Point the apex `goofs.io` A/ALIAS record + `adgame` and `clicker` CNAMEs at Vercel's provided targets (Vercel gives you the exact records after adding each domain).

## Deploys

Every push to `main` triggers three parallel deploys (one per Vercel project). Preview deploys fire on every PR branch. No CI setup required beyond that.

## Rollback

Vercel keeps every deploy. Rollback = Promote a previous deployment from the project's Deployments tab.

## Local dev vs prod parity

- `.env.development` in `apps/launcher/` points tile links at `localhost:5174` / `:5175`.
- `.env.production` in `apps/launcher/` points them at the subdomains.
- Games have no env-dependent config today.
