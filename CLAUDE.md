# AdGame.exe

Satirical 3-lane runner web game built with React + Canvas. The joke: it's the game from mobile ads that never actually existed — except now it does.

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — Lint

## Architecture

React manages screen routing and popup overlays (DOM). Canvas handles all game rendering. The game loop lives in `GameScreen.jsx` using `requestAnimationFrame`.

**Critical:** Game state is a mutable ref object (`stateRef.current`), NOT React state. React rerenders would kill frame rate. Only `setPopups` is called from the game loop (to update the popup React overlay).

## File Structure

```
src/
├── AdGame.jsx              # Root: screen router + Centered wrapper
├── screens/
│   ├── LoadingScreen.jsx
│   ├── TitleScreen.jsx
│   ├── GameScreen.jsx      # Game loop, canvas, popup overlay, pause, keyboard, scaling
│   └── DeathScreen.jsx
├── game/
│   ├── constants.js        # All dimensions, colors, wave table, gate probabilities
│   ├── state.js            # initState() factory
│   ├── logic.js            # tickLogic(): gates, collision, decay, wave, particles
│   ├── popups.js           # spawnPopup(), closePopup(), popup tiers
│   └── scoring.js          # calcScore(), getHighScore(), saveHighScore()
├── rendering/
│   ├── player.js           # drawPlayer()
│   ├── enemies.js          # drawEnemy()
│   ├── gates.js            # drawGate() — handles infection visual
│   ├── effects.js          # Particles, floats, flash, glitch, scanlines, trail
│   ├── background.js       # Stars, grid, lane highlights, decay degradation
│   └── hud.js              # Power, wave, combo, decay indicator, tutorial text
├── components/
│   └── Win98Popup.jsx      # All 5 popup tiers: basic, dodger, decoy, splitter, boss
├── copy/
│   └── banks.js            # All text: death lines, wave lines, popup messages, etc.
├── sound/
│   └── audio.js            # ChiptuneEngine — SNES-style Web Audio synthesis + SFX
└── utils/
    └── helpers.js          # randomFrom, clamp, lerp
```

## Key Design Decisions

- **Mutable game state** — `stateRef.current` is mutated directly in the rAF loop. Never put game loop data in React state.
- **Popups are React DOM, not Canvas** — they need real click targets; canvas elements can't be tabbed/clicked reliably.
- **Popup infection** — while any popup is alive, ALL gates deal enemy damage. This is the primary difficulty driver.
- **Power decay** — applied every frame (`targetPower -= decayRate * dt/1000`), always to `targetPower`. Guarantees every run ends.
- **targetPower vs displayPower** — `targetPower` is the real value; `displayPower` lerps toward it for smooth animation. Always modify `targetPower`.
- **Audio lazy init** — Web Audio API requires a user gesture. `audio.init()` is called on first click/touch. Music starts then.
- **Responsive scaling** — CSS `transform: scale()` on the 360×640 container. Canvas and popups scale uniformly.

## Conventions

- Colors defined in `constants.js` — don't hardcode hex values elsewhere
- All tuning values (speeds, intervals, probabilities, decay rates) live in `constants.js`
- New gate types: add to `rollGateType()` in constants, add spawn logic in `logic.js`, add rendering in `gates.js`
- New popup tiers: add to `pickTier()` in `popups.js`, add JSX in `Win98Popup.jsx`
- New copy: add to appropriate array in `copy/banks.js`
- New SFX: add method to `AudioEngine` class in `sound/audio.js`
