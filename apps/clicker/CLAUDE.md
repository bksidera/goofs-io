# apps/clicker — Crypto Clicker

A **narrative idle game**. The clicker mechanic is the delivery vehicle for an 8-stage arc; the arc *is* the game. First arc = Crypto. The ending — quantum compute cracks bitcoin, everything zeros out, and something grows back from the ruin — is the payload. Everything before it earns that landing.

## Architecture: engine + arc

```
src/
├── main.jsx                       React root
├── Clicker.jsx                    thin composer: <ArcScreen arc={cryptoArc} />
├── engine/                        theme-agnostic — reusable Narrative Clicker Engine
│   ├── logic.js                   tick, CPS math, click value, purchase resolvers
│   ├── state.js                   initState (currently reads crypto data.json)
│   ├── constants.js               formatNumber, tick timing, misc
│   ├── useAnimatedNumber.js       rAF tween for the big currency display
│   ├── save.js                    @goofs/save wrapper + offline accrual
│   ├── audio.js                   event router; silent scaffold today
│   ├── screens/ArcScreen.jsx      the game shell — tick loop, event dispatch, UI orchestration
│   └── components/                theme-agnostic UI primitives
│       BuyAmountToggle, GeneratorList, UpgradeList, NarrativePanel,
│       CoreObject, ClickFX, FloatingNumber, FxLayer, SystemCrashOverlay, Toast
└── arcs/
    └── crypto/                    everything crypto-specific
        ├── index.js               bundles data + copy + mechanics + Aftermath into one export
        ├── data.json              stages, generators, upgrades, thresholds
        ├── copy.js                all text (milestones, quips, phase-crash lines, aftermath prose)
        ├── theme.css              per-stage palettes + typography (scoped to .clicker-root)
        ├── aftermath.jsx          the post-collapse scene (currently the SVG dawn/tree)
        └── mechanics/             arc-specific gameplay hooks
            TemperatureGauge, WizardAura, ApocalypseSequence, AirdropEvent
```

**The split is imperfect today.** ArcScreen still reaches into `arcs/crypto/` directly via imports (marked `TODO`). The `arc` prop is accepted (used for save-key scoping) — promoting the rest of the crypto-specific data to be consumed via `arc.*` is the next refactor when Epochs of Man arrives.

## The arc

Stages 1→8 gated by `totalEarned` thresholds, each advance triggers a **system crash** (25 REBOOT clicks + reinit), then unlocks new visual/mechanical world. Stage 8 is a 35s "diamond overdrive" cutscene, then the **quantum apocalypse**: currency drains to zero, screen goes black, and Aftermath loads.

Stages (see `arcs/crypto/data.json` for content):
1. Glass in Castle          hobbyist forum era
2. Bitcoin Wizard Jesus     early adopter mystique
3. CryptoKitty              ICO mania / NFT summer
4. ETH Rocks                Ethereum + gas wars
5. Dancing Vitalik          mainstream awareness
6. Miami Flamethrower       celebrity / luxury phase
7. Diamond Hands            institutional / late cycle
8. Quantum Apocalypse       AI-driven quantum compute cracks bitcoin's keys
→ **Aftermath**              return to nature; something grows

The aftermath is the whole point. Content polish is disproportionately weighted toward the last two beats.

## Save

`@goofs/save` — key `goofs:clicker:<arcId>` (each arc gets its own slot). Schema v1. Throttled writes (500ms) via the save layer. Offline accrual: on return, currency += CPS × secondsAway (capped at 8h). `beforeunload` / `pagehide` flush pending writes.

## Audio

`engine/audio.js` — event router. Today it's silent (dev console logs). Event vocabulary documented in that file — dispatch points wired in ArcScreen for: `click`, `click-crit`, `buy-generator`, `buy-upgrade`, `crash-complete`, `stage-transition`, `apocalypse-warn`, `apocalypse-start`, `airdrop-catch`. When SFX are commissioned, wire them here — no game-logic file needs to change.

## Conventions

- Every string is in `arcs/crypto/copy.js` (or `data.json`). Never inline copy in a component.
- Every color is in `arcs/crypto/theme.css` custom properties or `@goofs/design-tokens`. No inline hex.
- Adding a new mechanic to the crypto arc: create `arcs/crypto/mechanics/YourThing.jsx`, wire it in `ArcScreen` (until the `arc.mechanics` prop is threaded), and gate it on `getStageOrder(state.narrativeStage) === N`.
- Adding a new arc (Epochs of Man, etc.): create `arcs/<name>/{index.js, data.json, copy.js, theme.css, aftermath.jsx, mechanics/}` following the crypto layout. Mount it via a picker or route in `Clicker.jsx`.

## Follow-up work

- Promote the crypto-specific imports out of `engine/screens/ArcScreen.jsx` behind the `arc` prop
- Copy read-pass by a comedy/games writer (crypto voice sharpening)
- Commissioned music (8 stage beds + apocalypse score + aftermath ambient)
- Commissioned SFX pass
- Commissioned illustration for stage 8 + aftermath (the payoff scenes)
- Polish the apocalypse sequence timing/drama
- Prestige loop (currently `legacy.completions` is bumped but nothing consumes `legacy.bonus`)
- Second arc: Epochs of Man
