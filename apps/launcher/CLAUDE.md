# apps/launcher — goofs.io

The tile-grid launcher. Deploys to the apex domain. Static React page; no router, no game code.

## Structure

```
src/
├── main.jsx            React root; imports @goofs/design-tokens/tokens.css
├── App.jsx             Home page — logo, tile grid, footer
├── App.module.css      All layout + hover/focus styling
├── MatrixRain.jsx      Subtle background canvas (opacity 0.14)
├── registry.js         Tile roster; URLs come from VITE_*_URL env vars
└── index.css           Base reset + scrollbar/selection/focus-visible
```

## Adding a game tile

Edit [src/registry.js](src/registry.js) and add an entry:

```js
{
  slug: 'newgame',
  title: 'New Game',
  tagline: 'one-liner under the title',
  description: 'paragraph blurb',
  tags: ['tag1', 'tag2', 'tag3'],
  badge: 'ALPHA',                        // PLAYABLE | ALPHA | WIP
  color: 'var(--goofs-cyan)',
  accentHex: '#00E5FF',
  url: env.VITE_NEWGAME_URL || 'https://newgame.goofs.io',
}
```

Then set `VITE_NEWGAME_URL` in `.env.production` (subdomain) and `.env.development` (local port).

## Conventions

- Use design tokens (`var(--goofs-*)`) — never hard-code hex.
- Every interactive element needs a visible `:focus-visible` state (base rule in `index.css` provides a matrix-green outline; card also styles focus explicitly).
- Copy is deadpan, cypherpunk. No emoji. No hype. Never "delight," "empower," "value."
- Matrix rain respects `prefers-reduced-motion` — stays as a static frame.
