# apps/adgame — AdGame.exe

3-lane endless runner. React manages screen routing; a single canvas + `requestAnimationFrame` handles all in-game rendering. Game state is mutated on a ref, NOT React state — React rerenders would kill frame rate.

## Shape

The game is **endless**. There is no win screen, no credits, no level cap. The point is *how long you can survive* — chaos escalates until you die. Score = your best composite of duration and peak power.

## Structure

```
src/
├── main.jsx                boot; imports @goofs/design-tokens/tokens.css
├── AdGame.jsx              screen router (loading / title / game / death)
├── index.css               reset + touch-action / user-select for game
├── screens/
│   ├── LoadingScreen.jsx   nostalgia beat before title
│   ├── TitleScreen.jsx     single "INSTALL NOW" button + stats row
│   ├── GameScreen.jsx      canvas + rAF loop + input; owns the game
│   └── DeathScreen.jsx     score/time/peak vs all-time best; punk copy
├── game/
│   ├── constants.js        dimensions, palette, wave table, gate probabilities
│   ├── state.js            initState('endless') factory
│   ├── logic.js            tick logic — gates, collision, decay, waves
│   ├── spawn.js            spawn density curves
│   ├── levels.js           (dormant) — legacy level campaign engine
│   ├── popups.js           spawn/close popups; infection state
│   └── scoring.js          @goofs/save-backed persistence
├── rendering/              draw helpers per entity type
├── components/Win98Popup.jsx  the DOM overlay popups
├── copy/banks.js           DEATH_LINES, WAVE_LINES, POPUP_MESSAGES, etc.
├── sound/audio.js          ChiptuneEngine — Web Audio SFX
├── sim/balance.mjs         offline balance sim / assertions
└── utils/helpers.js
```

## Key rules

- **Game state is a mutable ref** (`stateRef.current`). Never put game loop data in React state.
- **Popups are React DOM**, not canvas. They need real click targets, keyboard tab, focus.
- **Popup infection**: while any popup is alive, ALL gates deal enemy damage. This is the primary difficulty driver — keep it.
- **Power decay** every frame (`targetPower -= decayRate * dt/1000`), always to `targetPower`. Guarantees every run ends.
- **targetPower vs displayPower** — `targetPower` is the real value; `displayPower` lerps toward it for smooth animation. Always modify `targetPower`.
- **Audio lazy init** — Web Audio requires a user gesture. `audio.init()` on first tap.
- **Responsive scaling** — CSS `transform: scale()` on the 360×640 container.

## Save

Powered by `@goofs/save` (key `goofs:adgame`, schema v2). Tracks `highScore`, `longestRunSecs`, `peakPower`, `runs`, `lastRun`. Migrates the legacy `adgame_highscore` localStorage key on first load.

## Conventions

- Colors defined in `game/constants.js` — don't hardcode hex.
- Tuning values (speeds, intervals, probabilities, decay) live in `game/constants.js`.
- New gate type: (1) add to `rollGateType()` in constants, (2) spawn logic in `logic.js` or `spawn.js`, (3) rendering in `rendering/gates.js`.
- New popup tier: (1) add to `pickTier()` in `game/popups.js`, (2) JSX in `components/Win98Popup.jsx`.
- New SFX: add method to `AudioEngine` in `sound/audio.js`; call it from the appropriate game logic hook.

## Follow-up work

- Difficulty scaling explicitly with peak power (inverted-idle: more power → more chaos)
- Difficulty scaling with elapsed time (independent axis)
- Commissioned pixel art for player + enemies + gates + popup icons
- Commissioned chip/synthwave music with dynamic layering
- Sound designer pass on SFX
- Mobile touch tuning + 60fps profiling
