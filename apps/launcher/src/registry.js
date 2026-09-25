// The launcher's tile roster. Each entry becomes one card that links to
// its game under goofs.io/<slug> (Vercel rewrites in vercel.json proxy to
// the game's own project). In dev the tile points at the game's local
// dev-server port via VITE_*_URL.
//
// Adding a game: (1) create apps/<slug>/, (2) add an entry here, (3) add
// a rewrite in apps/launcher/vercel.json, (4) set base '/<slug>/' in the
// game's vite.config.js.

const env = import.meta.env;

export const games = [
  {
    slug: 'adgame',
    title: 'AdGame.exe',
    tagline: 'you will lose. how long can you last.',
    description:
      "The game from the mobile ad that doesn't exist. Except now it does. Endless. Dodge the popups. Trust nothing.",
    tags: ['runner', 'endless', 'no ads'],
    badge: 'PLAYABLE',
    color: 'var(--goofs-magenta)',
    accentHex: '#FF2D95',
    url: env.VITE_ADGAME_URL || '/adgame',
  },
  {
    slug: 'clicker',
    title: 'Crypto Clicker',
    tagline: 'the numbers went up. then they went to zero. something grew.',
    description:
      'Mine the bubble. Survive the apocalypse. A satirical arc where the only real value is the experience of having lived through it all.',
    tags: ['idle', 'satire', 'narrative'],
    badge: 'ALPHA',
    color: 'var(--goofs-gold)',
    accentHex: '#F2C75C',
    url: env.VITE_CLICKER_URL || '/clicker',
  },
];
