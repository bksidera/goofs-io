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
// Matrix-era hackerman: green is the main voice; gold is reward; red is danger;
// magenta is reserved for "the popups infected your reality" moments.
export const COLORS = {
  GREEN:      '#00FF41',  // primary Matrix green
  GREEN_DIM:  '#00AA22',
  GREEN_DEEP: '#003311',
  GOLD:       '#FFD700',
  GOLD_DEEP:  '#AA7700',
  RED:        '#FF0040',
  RED_DEEP:   '#88001A',
  PINK:       '#FF2D95',  // hackerman shades + popup vibes
  CYAN:       '#00F0FF',  // accents only
  PURPLE:     '#CC44FF',  // mystery
  WHITE:      '#FFFFFF',
  BG_TOP:     '#000000',
  BG_MID:     '#020A04',
  BG_BOT:     '#04140A',
};

// Wave progression — index 0 = wave 1, index 11 = wave 12+
export const WAVE_TABLE = [
  { gatesPerWave: 8,  scrollSpeed: 2.20, spawnInterval: 1100, decay: 0  },
  { gatesPerWave: 9,  scrollSpeed: 2.55, spawnInterval: 1035, decay: 0  },
  { gatesPerWave: 10, scrollSpeed: 2.90, spawnInterval:  970, decay: 0  },
  { gatesPerWave: 11, scrollSpeed: 3.25, spawnInterval:  905, decay: 2  },
  { gatesPerWave: 12, scrollSpeed: 3.60, spawnInterval:  840, decay: 3  },
  { gatesPerWave: 13, scrollSpeed: 3.95, spawnInterval:  775, decay: 5  },
  { gatesPerWave: 14, scrollSpeed: 4.30, spawnInterval:  710, decay: 7  },
  { gatesPerWave: 15, scrollSpeed: 4.65, spawnInterval:  645, decay: 10 },
  { gatesPerWave: 16, scrollSpeed: 5.00, spawnInterval:  580, decay: 14 },
  { gatesPerWave: 17, scrollSpeed: 5.00, spawnInterval:  540, decay: 18 },
  { gatesPerWave: 18, scrollSpeed: 5.00, spawnInterval:  520, decay: 22 },
  { gatesPerWave: 20, scrollSpeed: 5.00, spawnInterval:  500, decay: 25 },
];

export const getWaveConfig = (wave) =>
  WAVE_TABLE[Math.min(wave - 1, WAVE_TABLE.length - 1)];

// Returns an object type string based on wave-scaled probabilities
export const rollGateType = (wave) => {
  const trap     = wave >= 5 ? Math.min(0.08 + (wave - 5) * 0.015, 0.18) : 0;
  const mystery  = wave >= 6 ? Math.min(0.05 + (wave - 6) * 0.012, 0.10) : 0;
  const pct      = wave >= 7 ? Math.min(0.05 + (wave - 7) * 0.012, 0.12) : 0;
  const multiply = Math.min(0.15 + (wave - 1) * 0.004, 0.22);
  const enemy    = Math.min(0.30 + (wave - 1) * 0.022, 0.50);
  const add      = Math.max(0.50 - (wave - 1) * 0.025, 0.18);
  const total    = trap + mystery + pct + multiply + enemy + add;
  const scale    = 1 / total;

  const r = Math.random();
  let a = 0;
  if ((a += trap     * scale) > r) return 'trap';
  if ((a += mystery  * scale) > r) return 'mystery';
  if ((a += pct      * scale) > r) return 'pctEnemy';
  if ((a += multiply * scale) > r) return 'multiply';
  if ((a += add      * scale) > r) return 'add';
  return 'enemy';
};

// Percentage enemy — N% of current power subtracted
export const rollPctValue = (wave) => {
  const base = Math.min(10 + (wave - 7) * 2.5, 22);
  return Math.max(5, Math.floor(base + (Math.random() - 0.5) * 6));
};
