// CHOMP — a very good boy vs. four ghosts.
// Classic Pac-Man rules; the dots are steaks and the hero is a dog.

export const TILE = 16;
export const COLS = 28;
export const ROWS = 31;
export const BOARD_W = COLS * TILE; // 448
export const BOARD_H = ROWS * TILE; // 496
export const HUD_TOP = 40;
export const HUD_BOTTOM = 40;
export const CANVAS_W = BOARD_W;
export const CANVAS_H = BOARD_H + HUD_TOP + HUD_BOTTOM;

// The classic maze. 28 cols × 31 rows.
// '#' wall · '.' steak · 'o' power steak · '=' ghost-house door · ' ' open
export const MAZE = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '     #.##### ## #####.#     ',
  '     #.##          ##.#     ',
  '     #.## ###==### ##.#     ',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '     #.## ######## ##.#     ',
  '     #.##          ##.#     ',
  '     #.## ######## ##.#     ',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......  .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];

// Speeds in pixels per second (at TILE=16 scale).
export const DOG_SPEED = 130;
export const GHOST_SPEED = 122;
export const FRIGHTENED_SPEED = 80;
export const EYES_SPEED = 260;
export const TUNNEL_SPEED = 70; // ghosts slow in the tunnel row
export const SPEED_PER_LEVEL = 0.04; // +4% per level, capped in logic
export const MAX_SPEED_SCALE = 1.35;

export const TUNNEL_ROW = 14;

// Scatter/chase alternation (seconds), classic level-1 pattern.
export const MODE_WAVES = [
  { mode: 'scatter', secs: 7 },
  { mode: 'chase', secs: 20 },
  { mode: 'scatter', secs: 7 },
  { mode: 'chase', secs: 20 },
  { mode: 'scatter', secs: 5 },
  { mode: 'chase', secs: 20 },
  { mode: 'scatter', secs: 5 },
  { mode: 'chase', secs: Infinity },
];

export const FRIGHTENED_SECS_BASE = 6;
export const FRIGHTENED_SECS_MIN = 1.5;

// Scoring
export const STEAK_POINTS = 10;
export const POWER_POINTS = 50;
export const GHOST_POINTS = [200, 400, 800, 1600];
export const BONE_POINTS_BASE = 100;

// Bone bonus (the fruit) appears at these eaten-counts, for a limited time.
export const BONE_TRIGGERS = [70, 170];
export const BONE_LIFETIME_SECS = 9;

export const STARTING_LIVES = 3;
export const EXTRA_LIFE_AT = 10000;

// Ghost house release delays (seconds after round start).
export const RELEASE_DELAYS = { blinky: 0, pinky: 1, inky: 4, clyde: 7 };

// Pixel positions (centers).
export const DOG_START = { x: 14 * TILE, y: 23 * TILE + TILE / 2 };
export const HOUSE_CENTER = { x: 14 * TILE, y: 14 * TILE + TILE / 2 };
export const HOUSE_EXIT = { x: 14 * TILE, y: 11 * TILE + TILE / 2 };
export const BONE_POS = { x: 14 * TILE, y: 17 * TILE + TILE / 2 };

export const GHOSTS = [
  { id: 'blinky', color: '#ff3b30', scatter: { col: 25, row: 0 },  start: { x: 14 * TILE, y: 11 * TILE + TILE / 2 }, inHouse: false },
  { id: 'pinky',  color: '#ff9ad5', scatter: { col: 2, row: 0 },   start: { x: 14 * TILE, y: 14 * TILE + TILE / 2 }, inHouse: true },
  { id: 'inky',   color: '#4dd2ff', scatter: { col: 27, row: 30 }, start: { x: 12 * TILE, y: 14 * TILE + TILE / 2 }, inHouse: true },
  { id: 'clyde',  color: '#ffb347', scatter: { col: 0, row: 30 },  start: { x: 16 * TILE, y: 14 * TILE + TILE / 2 }, inHouse: true },
];

export const COLORS = {
  wall: '#2230d8',
  wallInner: '#0a0a28',
  door: '#ffb8de',
  bg: '#000000',
  text: '#ffffff',
  score: '#ffd166',
  frightened: '#2244ff',
  frightenedFlash: '#e8e8ff',
  dog: '#d99a4e',
  dogEar: '#9c6a2e',
};

export const HIGHSCORE_KEY = 'chomp_highscore';
