# goofs-hub — repo instructions

npm workspaces monorepo. Two games (AdGame, Clicker) + a launcher + shared packages, each `apps/*` deploying to its own subdomain.

## Commands

- `npm install` — root install (hoists workspace deps)
- `npm run dev:launcher` — goofs.io launcher on :5173
- `npm run dev:adgame` — AdGame.exe on :5174
- `npm run dev:clicker` — Crypto Clicker on :5175
- `npm run build:all` — build every workspace
- `npm run lint` — lint apps + packages
- Node **>= 20.19** required (Vite 8)

## Layout

```
apps/
  launcher/           goofs.io — tile grid; tiles are <a> links to subdomains
  adgame/             adgame.goofs.io — endless runner (React + Canvas)
  clicker/            clicker.goofs.io — narrative idle (React + DOM)
packages/
  design-tokens/      color / type / motion tokens (JS + CSS custom props)
  save/               createSave({ key, version, migrate }) — versioned localStorage
  ui/                 EMPTY placeholder; add here only when 2 apps concretely share
```

## Architectural boundaries — do not cross

- **Games do not import from each other.** AdGame does not import from Clicker or vice versa.
- **Games do not share game logic through `packages/ui`.** AdGame is Canvas + React; Clicker is DOM + React. Different problems.
- **The launcher does not import game components.** Tiles link out to subdomains.
- Both games consume `@goofs/design-tokens` and `@goofs/save`. Adding another shared package requires a real need in two apps.

## Deploy

Each app is a separate Vercel (or equivalent) project rooted at `apps/<name>`. Root deploy at `goofs.io`, games at `<slug>.goofs.io`. Launcher's `.env.production` sets `VITE_ADGAME_URL` / `VITE_CLICKER_URL` to the subdomains; `.env.development` points at local ports.

## Per-app conventions

Each `apps/<name>/` has its own `CLAUDE.md` with details specific to that codebase:
- [apps/launcher/CLAUDE.md](apps/launcher/CLAUDE.md)
- [apps/adgame/CLAUDE.md](apps/adgame/CLAUDE.md)
- [apps/clicker/CLAUDE.md](apps/clicker/CLAUDE.md)

## Design vibe

**Pro but punk.** Playdate/Panic craft + Devolver attitude. See design tokens in [packages/design-tokens/src/tokens.css](packages/design-tokens/src/tokens.css). Never use raw hex; always reference `var(--goofs-*)` (or `colors.*` from JS import).

## Git

Feature work happens on branches; **main is the deploy branch**. Preserve any WIP that gets scrapped on an `archive/*` branch before deleting — see `archive/pre-refactor-2026-09-25` for the pattern.

## Plan

Current multi-sprint plan lives at `.claude/plans/ok-what-i-want-structured-lecun.md`. Short version: cut to two games, monorepo, launcher polish, AdGame endless redirect, Clicker narrative + save + audio scaffolding — DONE. Next: commissioned art, commissioned music, difficulty tuning, apocalypse sequence polish, aftermath cinematography.
