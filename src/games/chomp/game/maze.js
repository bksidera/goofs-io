import { MAZE, COLS, ROWS, TILE, TUNNEL_ROW } from './constants.js';

// Parsed once at module load. grid[row][col] is the raw maze character.
export const grid = MAZE.map(row => row.split(''));

if (import.meta.env.DEV) {
  if (grid.length !== ROWS) throw new Error(`Maze has ${grid.length} rows, expected ${ROWS}`);
  grid.forEach((row, i) => {
    if (row.length !== COLS) throw new Error(`Maze row ${i} has ${row.length} cols, expected ${COLS}`);
  });
}

export function charAt(col, row) {
  if (row < 0 || row >= ROWS) return '#';
  // Off the sides: open only on the tunnel row (wrap), wall everywhere else.
  if (col < 0 || col >= COLS) return row === TUNNEL_ROW ? ' ' : '#';
  return grid[row][col];
}

// Walkability. The ghost-house door ('=') only opens for entities flagged
// canUseDoor (ghosts leaving, eyes returning).
export function isOpen(col, row, canUseDoor = false) {
  const ch = charAt(col, row);
  if (ch === '#') return false;
  if (ch === '=') return canUseDoor;
  return true;
}

export function isWallChar(col, row) {
  return charAt(col, row) === '#';
}

export function tileOf(px) {
  return Math.floor(px / TILE);
}

export function centerOf(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

// Fresh steak layout for a new level: Map of "col,row" → 'steak' | 'power'.
export function buildSteaks() {
  const steaks = new Map();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = grid[r][c];
      if (ch === '.') steaks.set(`${c},${r}`, 'steak');
      else if (ch === 'o') steaks.set(`${c},${r}`, 'power');
    }
  }
  return steaks;
}
