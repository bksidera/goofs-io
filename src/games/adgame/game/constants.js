export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const LANE_COUNT = 3;
export const LANE_WIDTH = 90;
export const LANE_OFFSET = (GAME_WIDTH - LANE_COUNT * LANE_WIDTH) / 2;
export const PLAYER_Y = 540;
export const OBJECT_SIZE = 56;          // hit-volume + render footprint for in-lane objects
export const GATE_HEIGHT = OBJECT_SIZE; // legacy alias — collision math still uses it
export const PX = 3;
export const FONT = "'Courier New', monospace";

export const laneX = (lane) => LANE_OFFSET + lane * LANE_WIDTH + LANE_WIDTH / 2;

// ── Palette ───────────────────────────────────────────────────────────────────
// Matrix-era hackerman base; each level tints the world with its own accent.
export const COLORS = {
  GREEN:      '#00FF41',
  GREEN_DIM:  '#00AA22',
  GREEN_DEEP: '#003311',
  GOLD:       '#FFD700',
  GOLD_DEEP:  '#AA7700',
  RED:        '#FF0040',
  RED_DEEP:   '#88001A',
  PINK:       '#FF2D95',
  CYAN:       '#00F0FF',
  PURPLE:     '#CC44FF',
  WHITE:      '#FFFFFF',
  BG_TOP:     '#000000',
  BG_MID:     '#020A04',
  BG_BOT:     '#04140A',
};

// ── The Campaign ──────────────────────────────────────────────────────────────
// 9 levels, each themed as a fake mobile-ad genre. Every field is a tuning
// dial. gateMix values are relative weights (normalized at spawn time).
//
//   goal:       gates spawned before the boss finale triggers
//   decayPct:   % of current power drained per second (kills hoarding)
//   decayFloor: minimum flat drain/sec once decay is active
//   powerCap:   soft ceiling — add/multiply overflow converts to SCORE
//   bossSecs:   length of the CONVERSION EVENT finale
//   popupChance:per-wave-tick chance a popup spawns (0 disables)
export const LEVELS = [
  {
    n: 1, name: 'SPONSORED CONTENT', sponsor: 'Promoted · 4.8★ · Free',
    accent: '#00F0FF', accentDim: '#005A66',
    goal: 16, scrollSpeed: 2.3, spawnInterval: 1050,
    decayPct: 0, decayFloor: 0, powerCap: 600, bossSecs: 8, popupChance: 0,
    gateMix: { add: 0.62, enemy: 0.30, multiply: 0.08, trap: 0, mystery: 0, pctEnemy: 0 },
  },
  {
    n: 2, name: 'HOT SINGLES IN YOUR AREA', sponsor: 'Sponsored · 3.1★ · Free*',
    accent: '#FF2D95', accentDim: '#6B1340',
    goal: 18, scrollSpeed: 2.6, spawnInterval: 980,
    decayPct: 0, decayFloor: 0, powerCap: 900, bossSecs: 9, popupChance: 0.5,
    gateMix: { add: 0.52, enemy: 0.36, multiply: 0.12, trap: 0, mystery: 0, pctEnemy: 0 },
  },
  {
    n: 3, name: 'CRYPTO MINER PRO', sponsor: 'Ad · 4.9★ · Definitely Free',
    accent: '#FFD700', accentDim: '#705C00',
    goal: 20, scrollSpeed: 2.9, spawnInterval: 910,
    decayPct: 0.5, decayFloor: 2, powerCap: 1400, bossSecs: 10, popupChance: 0.5,
    gateMix: { add: 0.42, enemy: 0.34, multiply: 0.14, trap: 0.10, mystery: 0, pctEnemy: 0 },
  },
  {
    n: 4, name: 'BRAIN TRAINER 9000', sponsor: 'Ad · "Scientific" · Free',
    accent: '#CC44FF', accentDim: '#581A70',
    goal: 22, scrollSpeed: 3.25, spawnInterval: 840,
    decayPct: 1.0, decayFloor: 3, powerCap: 2000, bossSecs: 10, popupChance: 0.55,
    gateMix: { add: 0.38, enemy: 0.32, multiply: 0.13, trap: 0.09, mystery: 0.08, pctEnemy: 0 },
  },
  {
    n: 5, name: 'DATA HARVEST', sponsor: 'Ad · We Already Know You',
    accent: '#39FF14', accentDim: '#1A6E0A',
    goal: 24, scrollSpeed: 3.6, spawnInterval: 780,
    decayPct: 1.2, decayFloor: 4, powerCap: 2800, bossSecs: 11, popupChance: 0.6,
    gateMix: { add: 0.38, enemy: 0.28, multiply: 0.12, trap: 0.09, mystery: 0.06, pctEnemy: 0.07 },
  },
  {
    n: 6, name: 'STORAGE ALMOST FULL', sponsor: 'Alert · Act Now · Free Scan',
    accent: '#FF6B47', accentDim: '#702A18',
    goal: 26, scrollSpeed: 3.95, spawnInterval: 715,
    decayPct: 1.6, decayFloor: 5, powerCap: 3800, bossSecs: 11, popupChance: 0.7,
    gateMix: { add: 0.37, enemy: 0.28, multiply: 0.11, trap: 0.10, mystery: 0.07, pctEnemy: 0.07 },
  },
  {
    n: 7, name: 'PROTECT YOUR PRIVACY NOW', sponsor: 'Ad · Trust Us · Free VPN',
    accent: '#4D7CFF', accentDim: '#1F3470',
    goal: 28, scrollSpeed: 4.3, spawnInterval: 655,
    decayPct: 2.0, decayFloor: 6, powerCap: 5000, bossSecs: 12, popupChance: 0.75,
    gateMix: { add: 0.36, enemy: 0.26, multiply: 0.11, trap: 0.12, mystery: 0.07, pctEnemy: 0.08 },
  },
  {
    n: 8, name: 'FINAL SALE ENDS TONIGHT', sponsor: 'Ad · 99% OFF · Hurry',
    accent: '#FF9500', accentDim: '#6E4100',
    goal: 31, scrollSpeed: 4.7, spawnInterval: 590,
    decayPct: 2.4, decayFloor: 7, powerCap: 6500, bossSecs: 13, popupChance: 0.8,
    gateMix: { add: 0.35, enemy: 0.27, multiply: 0.10, trap: 0.12, mystery: 0.07, pctEnemy: 0.09 },
  },
  {
    n: 9, name: 'UNINSTALL.EXE', sponsor: 'System · This Is Not An Ad',
    accent: '#E8E8E8', accentDim: '#555555',
    goal: 34, scrollSpeed: 5.1, spawnInterval: 530,
    decayPct: 3.0, decayFloor: 8, powerCap: 8000, bossSecs: 14, popupChance: 0.85,
    gateMix: { add: 0.34, enemy: 0.28, multiply: 0.10, trap: 0.12, mystery: 0.07, pctEnemy: 0.09 },
  },
];

// INFINITE SCROLL (endless mode, unlocked by clearing the campaign).
// Decay grows without bound over time, so every endless run ends eventually.
export function endlessConfig(elapsedSecs) {
  const base = LEVELS[LEVELS.length - 1];
  return {
    ...base,
    n: 10,
    name: 'INFINITE SCROLL',
    sponsor: 'Ad · ∞★ · You Cannot Win',
    accent: '#00FF41', accentDim: '#0A4A14',
    goal: Infinity,
    scrollSpeed: Math.min(6.0, 4.6 + elapsedSecs * 0.01),
    spawnInterval: Math.max(480, 620 - elapsedSecs * 1.2),
    decayPct: 2.0 + elapsedSecs * 0.05,      // unbounded — the house always wins
    decayFloor: 8 + elapsedSecs * 0.12,      // floor also grows: no equilibrium farming

    powerCap: 9999,
    bossSecs: 0,
    popupChance: 0.8,
  };
}

export const getLevelConfig = (st) =>
  st.mode === 'endless' ? endlessConfig(st.elapsed) : LEVELS[st.levelIndex];

// ── Boss (CONVERSION EVENT) tuning ───────────────────────────────────────────
export const BOSS = {
  HOVER_SECS: 0.9,
  TELEGRAPH_SECS: 0.55,
  DIVE_SECS: 0.45,
  HIT_PCT: 35,          // % of current power lost on a dive hit
  POPUP_EVERY: 2.5,     // popup storm cadence (secs)
  Y_HOVER: 90,
};

export const REVIVE_POWER = 100;
export const INVULN_MS = 1600;
