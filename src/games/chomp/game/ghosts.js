import { TILE, COLS } from './constants.js';
import { isOpen, tileOf } from './maze.js';

const DIRS = [
  { dx: 0, dy: -1, name: 'up' },
  { dx: -1, dy: 0, name: 'left' },
  { dx: 0, dy: 1, name: 'down' },
  { dx: 1, dy: 0, name: 'right' },
]; // classic tie-break priority: up > left > down > right

// Per-personality target tile while chasing. This is the heart of authentic
// Pac-Man ghost behavior — each ghost hunts differently.
export function chaseTarget(ghost, state) {
  const dogCol = tileOf(state.dog.x);
  const dogRow = tileOf(state.dog.y);
  const d = state.dog.dir;

  switch (ghost.id) {
    case 'blinky':
      // Red: targets the dog's tile directly.
      return { col: dogCol, row: dogRow };
    case 'pinky': {
      // Pink: ambushes 4 tiles ahead of the dog's snout
      // (faithfully reproduces the famous up-direction overflow bug).
      let col = dogCol + d.dx * 4;
      let row = dogRow + d.dy * 4;
      if (d.dy === -1) col -= 4;
      return { col, row };
    }
    case 'inky': {
      // Cyan: takes the point 2 ahead of the dog, then doubles the vector
      // from Blinky to that point. Chaos by committee.
      const blinky = state.ghosts.find(g => g.id === 'blinky');
      let ax = dogCol + d.dx * 2;
      let ay = dogRow + d.dy * 2;
      if (d.dy === -1) ax -= 2;
      const bCol = tileOf(blinky.x);
      const bRow = tileOf(blinky.y);
      return { col: ax + (ax - bCol), row: ay + (ay - bRow) };
    }
    case 'clyde': {
      // Orange: chases like Blinky until within 8 tiles, then loses his
      // nerve and retreats to his corner.
      const dist = Math.hypot(dogCol - tileOf(ghost.x), dogRow - tileOf(ghost.y));
      return dist > 8 ? { col: dogCol, row: dogRow } : ghost.scatter;
    }
    default:
      return { col: dogCol, row: dogRow };
  }
}

// Choose the ghost's direction at a tile center. Ghosts never reverse
// (except on mode changes, handled by the caller flipping ghost.dir).
export function chooseGhostDir(ghost, target, frightened, rng = Math.random) {
  const col = tileOf(ghost.x);
  const row = tileOf(ghost.y);
  const options = DIRS.filter(d => {
    if (d.dx === -ghost.dir.dx && d.dy === -ghost.dir.dy) return false; // no reversing
    return isOpen(col + d.dx, row + d.dy, ghost.canUseDoor);
  });

  if (options.length === 0) {
    // Dead end (only possible in the house) — reverse.
    return { dx: -ghost.dir.dx, dy: -ghost.dir.dy };
  }

  if (frightened) {
    return options[Math.floor(rng() * options.length)];
  }

  let best = options[0];
  let bestDist = Infinity;
  for (const d of options) {
    const dist = Math.hypot(col + d.dx - target.col, row + d.dy - target.row);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

// Wrap horizontal position through the tunnel.
export function wrapX(x) {
  const width = COLS * TILE;
  if (x < -TILE / 2) return x + width + TILE;
  if (x > width + TILE / 2) return x - width - TILE;
  return x;
}
