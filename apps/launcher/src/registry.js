// The launcher's tile roster. Each entry becomes one card that links out to
// its own subdomain (or localhost port in dev, via VITE_*_URL env vars).
//
// Adding a game: (1) create apps/<slug>/, (2) add an entry here, (3) deploy
// the app to <slug>.goofs.io, (4) set VITE_<SLUG>_URL in .env.production.

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
    url: env.VITE_ADGAME_URL || 'https://adgame.goofs.io',
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
    url: env.VITE_CLICKER_URL || 'https://clicker.goofs.io',
  },
];
