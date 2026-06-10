// Central registry of every game in the goofs.io hub.
// Adding a new game: drop its folder into src/games/<slug>/, then add an
// entry here. App.jsx auto-generates the home card and the route from this.
//
// Each entry shape:
//   slug:        URL path segment (also doubles as the folder name)
//   title:       Display name on the card
//   description: One-paragraph blurb on the card
//   tags:        Array of small chips under the description (3 max looks best)
//   badge:       Status pill in the top-right of the card (PLAYABLE / ALPHA / WIP)
//   color:       Hex accent — bleeds into card border, title, tags, glow
//   component:   The mounted React component (must be the game's top-level export)

import AdGame from './adgame/AdGame.jsx';
import Clicker from './clicker/Clicker.jsx';
import Chomp from './chomp/Chomp.jsx';

export const games = [
  {
    slug: 'adgame',
    title: 'AdGame.exe',
    description:
      "The game from the mobile ad that doesn't exist. Except now it does. Survive the gates. Dodge the popups. Trust nothing.",
    tags: ['runner', 'free', 'no ads'],
    badge: 'PLAYABLE',
    color: '#FF2D95',
    component: AdGame,
  },
  {
    slug: 'clicker',
    title: 'Crypto Clicker',
    description:
      'Mine the bubble. Survive the apocalypse. A satirical idle game where the only real value is the experience of having lived through it all.',
    tags: ['idle', 'satire', 'wip'],
    badge: 'ALPHA',
    color: '#F2C75C',
    component: Clicker,
  },
  {
    slug: 'chomp',
    title: 'CHOMP',
    description:
      'A very good boy vs. four ghosts. Eat every steak in the maze. The big steaks bite back. You know this game — but now it has a dog.',
    tags: ['arcade', 'maze', 'steak'],
    badge: 'PLAYABLE',
    color: '#D99A4E',
    component: Chomp,
  },
];
