# goofs.io

> weird stuff, playable.

A small games studio's monorepo. Two games under one launcher, each deployed to its own subdomain. Nothing corporate. No accounts. No email capture. No ads in the ads.

## Shape

```
goofs-hub/
├── apps/
│   ├── launcher/    →  goofs.io           (tile grid)
│   ├── adgame/      →  adgame.goofs.io    (endless runner)
│   └── clicker/     →  clicker.goofs.io   (narrative idle)
└── packages/
    ├── design-tokens/   cyberpunk color + type + motion tokens
    ├── save/            namespaced, versioned localStorage helper
    └── ui/              (empty — reserved for shared primitives)
```

Each app is its own Vite build. They do not share bundles. The launcher's tiles are plain `<a href>` links to subdomains. Adding a new game means (1) drop a folder under `apps/`, (2) add it to `apps/launcher/src/registry.js`, (3) point a `VITE_<SLUG>_URL` at its deploy.

## The games

**AdGame.exe** — the game from the mobile ad that doesn't exist. 3-lane endless runner in the Temple Run lineage. Escalating chaos, no ending, high score is the trophy. Popups infect the world. You will lose.

**Crypto Clicker** — a narrative idle game where the arc *is* the mechanic. Nine stages trace the crypto subculture from hobbyist forums through the ICO mania to the moment quantum computing makes it all meaningless — and then something grows back. Built on a reusable **Narrative Clicker Engine** whose first arc is Crypto; alternate arcs (Epochs of Man is next) will drop into `apps/clicker/src/arcs/`.

## Dev

```bash
# workspaces install (Node >= 20.19; check .nvmrc / package.json engines)
npm install

# run one app
npm run dev:launcher    # http://localhost:5173
npm run dev:adgame      # http://localhost:5174
npm run dev:clicker     # http://localhost:5175

# build all
npm run build:all

# preview a production build
npm run preview:launcher
```

The launcher's `.env.development` points its tile links at the localhost ports; `.env.production` points them at the subdomains.

## Deploy

Each app deploys as a separate Vercel project (or your host of choice), rooted at its `apps/<name>` directory. Point:

- `goofs.io` → `apps/launcher` build
- `adgame.goofs.io` → `apps/adgame` build
- `clicker.goofs.io` → `apps/clicker` build

Independent deploys. No shared state, no shared bundle, no cross-app coupling.

## Philosophy

**Pro but punk.** Playdate craft with Devolver attitude. Typography kerned, motion tuned, sound mixed — and copy that has a voice, colors that don't apologize, rough edges left deliberately. Nothing focus-grouped. Nothing sanitized.

**No lifecycle bloat.** No accounts, no login, no leaderboard backend, no cross-game achievements, no cookie banner, no newsletter modal, no analytics beyond a privacy-preserving hit counter. Ever.

**Each game has a defined shape.** AdGame is endless-with-escalation. Clicker is a narrative arc with credits. Both are honest about what they are.

## Roadmap

See `.claude/plans/` (or CLAUDE.md for current focus) for the multi-sprint plan. Short version: cut, restructure, polish, commission art + audio, ship.

## License

Private / all rights reserved for now.
