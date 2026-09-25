// Central registry of every game in the goofs.io hub.
// Add a new game by dropping its folder into src/games/<slug>/ and adding an
// entry here. App.jsx auto-generates the home card and the route from this.
//
// Entry shape:
//   slug:        URL path segment (also the folder name)
//   title:       Display name on the card
//   description: One-paragraph blurb on the card
//   tags:        Small chips under the description (3 max looks best)
//   badge:       Status pill top-right of the card (PLAYABLE / ALPHA / WIP)
//   color:       Hex accent — bleeds into card border, title, tags, glow
//   component:   The mounted React component (must be the game's top-level export)

import AdGame from './adgame/AdGame.jsx';
import Clicker from './clicker/Clicker.jsx';

export const games = [
  {
    slug: 'adgame',
    title: 'AdGame.exe',
    description:
      "The game from the mobile ad that doesn't exist. Except now it does. Survive the gates. Dodge the popups. Trust nothing.",
    tags: ['runner', 'endless', 'no ads'],
    badge: 'PLAYABLE',
    color: '#FF2D95',
    component: AdGame,
  },
  {
    slug: 'clicker',
    title: 'Crypto Clicker',
    description:
      'Mine the bubble. Survive the apocalypse. A satirical idle arc where the only real value is the experience of having lived through it all.',
    tags: ['idle', 'satire', 'narrative'],
    badge: 'ALPHA',
    color: '#F2C75C',
    component: Clicker,
  },
];
