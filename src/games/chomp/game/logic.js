import {
  TILE,
  TUNNEL_ROW,
  DOG_SPEED,
  GHOST_SPEED,
  FRIGHTENED_SPEED,
  EYES_SPEED,
  TUNNEL_SPEED,
  SPEED_PER_LEVEL,
  MAX_SPEED_SCALE,
  MODE_WAVES,
  FRIGHTENED_SECS_BASE,
  FRIGHTENED_SECS_MIN,
  STEAK_POINTS,
  POWER_POINTS,
  GHOST_POINTS,
  BONE_POINTS_BASE,
  BONE_TRIGGERS,
  BONE_LIFETIME_SECS,
  RELEASE_DELAYS,
  DOG_START,
  HOUSE_CENTER,
  HOUSE_EXIT,
  BONE_POS,
  GHOSTS,
  EXTRA_LIFE_AT,
} from './constants.js';
import { isOpen, tileOf, centerOf, buildSteaks } from './maze.js';
import { chaseTarget, chooseGhostDir, wrapX } from './ghosts.js';

const STILL = { dx: 0, dy: 0 };

export function speedScale(level) {
  return Math.min(MAX_SPEED_SCALE, 1 + (level - 1) * SPEED_PER_LEVEL);
}

export function frightenedSecs(level) {
  return Math.max(FRIGHTENED_SECS_MIN, FRIGHTENED_SECS_BASE - (level - 1) * 0.5);
}

function freshGhosts() {
  return GHOSTS.map(g => ({
    id: g.id,
    color: g.color,
    scatter: g.scatter,
    x: g.start.x,
    y: g.start.y,
    startX: g.start.x,
    startY: g.start.y,
    dir: g.inHouse ? { dx: 0, dy: -1 } : { dx: -1, dy: 0 },
    // 'house' (bobbing inside) → 'leaving' (filing out) → 'active' → 'eyes'
    // (eaten, racing home) → 'entering' (descending into house) → 'house'
    phase: g.inHouse ? 'house' : 'active',
    frightened: false,
    canUseDoor: false,
    releaseAt: RELEASE_DELAYS[g.id],
  }));
}

// Fresh positions for round start (after death or new level).
export function resetPositions(state) {
  state.dog = {
    x: DOG_START.x,
    y: DOG_START.y,
    dir: { dx: -1, dy: 0 },
    nextDir: null,
    mouth: 0, // 0..1 chomp cycle
    moving: false,
  };
  state.ghosts = freshGhosts();
  state.roundTime = 0;
  state.modeIndex = 0;
  state.modeTimer = MODE_WAVES[0].secs;
  state.frightenedTimer = 0;
  state.ghostChain = 0;
  state.bone = null;
}

export function initState(level = 1, score = 0, lives = 3) {
  const state = {
    level,
    score,
    lives,
    steaks: buildSteaks(),
    steaksEaten: 0,
    bonesSpawned: 0,
    extraLifeAwarded: score >= EXTRA_LIFE_AT,
    events: [], // drained by the renderer each frame (eat, death, etc.)
  };
  resetPositions(state);
  return state;
}

function currentMode(state) {
  if (state.frightenedTimer > 0) return 'frightened';
  return MODE_WAVES[state.modeIndex].mode;
}

// ── Movement helpers ──────────────────────────────────────────────────────────

// Advance an entity along its direction by dist, honoring walls and turning
// only at tile centers. Returns true if it actually moved.
function moveEntity(ent, dist, canUseDoor) {
  if (ent.dir.dx === 0 && ent.dir.dy === 0) return false;
  let remaining = dist;
  let moved = false;

  while (remaining > 0.0001) {
    const col = tileOf(ent.x);
    const row = tileOf(ent.y);
    const center = centerOf(col, row);
    const alongX = ent.dir.dx !== 0;
    const pos = alongX ? ent.x : ent.y;
    const cen = alongX ? center.x : center.y;
    const dirSign = alongX ? ent.dir.dx : ent.dir.dy;

    // Distance until we hit this tile's center moving in our direction
    // (negative means we're already past it).
    const toCenter = (cen - pos) * dirSign;

    if (toCenter > 0) {
      // Approach the center (possibly stopping short this frame).
      const step = Math.min(remaining, toCenter);
      ent.x += ent.dir.dx * step;
      ent.y += ent.dir.dy * step;
      remaining -= step;
      moved = true;
      if (remaining <= 0.0001) break;
    }

    // We are at (or past) the tile center — decision point.
    const nextCol = col + ent.dir.dx;
    const nextRow = row + ent.dir.dy;
    if (!isOpen(nextCol, nextRow, canUseDoor)) {
      // Blocked ahead: snap to center and stop.
      ent.x = center.x;
      ent.y = center.y;
      return moved;
    }
    // Continue into the next tile.
    const step = Math.min(remaining, TILE / 2);
    ent.x += ent.dir.dx * step;
    ent.y += ent.dir.dy * step;
    remaining -= step;
    moved = true;
    ent.x = wrapX(ent.x);
  }
  return moved;
}

// Attempt a queued turn for the dog when near a tile center.
function tryDogTurn(dog) {
  if (!dog.nextDir) return;
  const col = tileOf(dog.x);
  const row = tileOf(dog.y);
  const center = centerOf(col, row);
  const near = Math.abs(dog.x - center.x) < 4 && Math.abs(dog.y - center.y) < 4;

  const reversal = dog.nextDir.dx === -dog.dir.dx && dog.nextDir.dy === -dog.dir.dy
    && (dog.dir.dx !== 0 || dog.dir.dy !== 0);

  if (reversal) {
    // Reversals are always allowed instantly (classic).
    dog.dir = dog.nextDir;
    dog.nextDir = null;
    return;
  }

  if (!near) return;
  if (isOpen(col + dog.nextDir.dx, row + dog.nextDir.dy, false)) {
    dog.x = center.x;
    dog.y = center.y;
    dog.dir = dog.nextDir;
    dog.nextDir = null;
  }
}

// ── Ghost phase machine ───────────────────────────────────────────────────────

function tickGhost(state, ghost, dt) {
  const scale = speedScale(state.level);
  const row = tileOf(ghost.y);
  const inTunnel = row === TUNNEL_ROW;

  if (ghost.phase === 'house') {
    // Bob up and down inside the house until released.
    if (state.roundTime >= ghost.releaseAt) {
      ghost.phase = 'leaving';
      ghost.canUseDoor = true;
    } else {
      ghost.y += ghost.dir.dy * 30 * dt;
      if (ghost.y < ghost.startY - 6) ghost.dir = { dx: 0, dy: 1 };
      if (ghost.y > ghost.startY + 6) ghost.dir = { dx: 0, dy: -1 };
      return;
    }
  }

  if (ghost.phase === 'leaving') {
    // File to the house center x, then rise through the door.
    const speed = 60 * dt;
    if (Math.abs(ghost.x - HOUSE_CENTER.x) > 1) {
      ghost.x += Math.sign(HOUSE_CENTER.x - ghost.x) * speed;
    } else if (ghost.y > HOUSE_EXIT.y) {
      ghost.x = HOUSE_CENTER.x;
      ghost.y -= speed;
    } else {
      ghost.y = HOUSE_EXIT.y;
      ghost.phase = 'active';
      ghost.canUseDoor = false;
      ghost.dir = { dx: -1, dy: 0 };
    }
    return;
  }

  if (ghost.phase === 'entering') {
    // Descend from the door into the house, then rejoin the queue briefly.
    const speed = EYES_SPEED * dt;
    if (ghost.y < HOUSE_CENTER.y) {
      ghost.y += speed;
    } else {
      ghost.y = HOUSE_CENTER.y;
      ghost.phase = 'leaving';
      ghost.frightened = false;
    }
    return;
  }

  // 'active' or 'eyes': free-roaming maze movement.
  const isEyes = ghost.phase === 'eyes';
  let speed = isEyes ? EYES_SPEED
    : ghost.frightened ? FRIGHTENED_SPEED
    : inTunnel ? TUNNEL_SPEED
    : GHOST_SPEED * scale;

  // Eyes head for the door; everyone else uses mode targeting.
  let target;
  if (isEyes) {
    target = { col: tileOf(HOUSE_EXIT.x), row: tileOf(HOUSE_EXIT.y) };
    ghost.canUseDoor = true;
    // Arrived at the doorstep → start descending.
    if (Math.abs(ghost.x - HOUSE_EXIT.x) < 3 && Math.abs(ghost.y - HOUSE_EXIT.y) < 3) {
      ghost.x = HOUSE_EXIT.x;
      ghost.y = HOUSE_EXIT.y;
      ghost.phase = 'entering';
      return;
    }
  } else if (currentMode(state) === 'scatter') {
    target = ghost.scatter;
  } else {
    target = chaseTarget(ghost, state);
  }

  // Re-decide direction whenever we're at a tile center.
  const col = tileOf(ghost.x);
  const rowNow = tileOf(ghost.y);
  const center = centerOf(col, rowNow);
  if (Math.abs(ghost.x - center.x) < 1.5 && Math.abs(ghost.y - center.y) < 1.5) {
    ghost.dir = chooseGhostDir(ghost, target, ghost.frightened && !isEyes);
  }

  moveEntity(ghost, speed * dt, ghost.canUseDoor);
  ghost.x = wrapX(ghost.x);
}

// ── Main tick ─────────────────────────────────────────────────────────────────

// Advances the simulation by dt seconds. Mutates state. Pushes events the
// renderer can react to: {type:'steak'|'power'|'ghost'|'bone'|'death'|'clear'|'extraLife', ...}
export function tick(state, dt) {
  state.roundTime += dt;

  // Mode wave progression (frozen while frightened, classic behavior).
  if (state.frightenedTimer > 0) {
    state.frightenedTimer -= dt;
    if (state.frightenedTimer <= 0) {
      state.frightenedTimer = 0;
      state.ghostChain = 0;
      state.ghosts.forEach(g => { g.frightened = false; });
    }
  } else if (state.modeTimer !== Infinity) {
    state.modeTimer -= dt;
    if (state.modeTimer <= 0) {
      state.modeIndex = Math.min(state.modeIndex + 1, MODE_WAVES.length - 1);
      state.modeTimer = MODE_WAVES[state.modeIndex].secs;
      // Mode flip forces a reversal — the classic "they all turned around" tell.
      state.ghosts.forEach(g => {
        if (g.phase === 'active') g.dir = { dx: -g.dir.dx, dy: -g.dir.dy };
      });
    }
  }

  // Dog movement
  const dog = state.dog;
  tryDogTurn(dog);
  const scale = speedScale(state.level);
  dog.moving = moveEntity(dog, DOG_SPEED * scale * dt, false);
  dog.x = wrapX(dog.x);
  if (dog.moving) {
    dog.mouth = (dog.mouth + dt * 9) % 1; // chomp cycle
  }

  // Eat steaks
  const dogCol = tileOf(dog.x);
  const dogRow = tileOf(dog.y);
  const key = `${dogCol},${dogRow}`;
  const steak = state.steaks.get(key);
  if (steak) {
    const center = centerOf(dogCol, dogRow);
    if (Math.abs(dog.x - center.x) < 7 && Math.abs(dog.y - center.y) < 7) {
      state.steaks.delete(key);
      state.steaksEaten += 1;
      if (steak === 'power') {
        state.score += POWER_POINTS;
        state.frightenedTimer = frightenedSecs(state.level);
        state.ghostChain = 0;
        state.ghosts.forEach(g => {
          if (g.phase === 'active') {
            g.frightened = true;
            g.dir = { dx: -g.dir.dx, dy: -g.dir.dy };
          }
        });
        state.events.push({ type: 'power' });
      } else {
        state.score += STEAK_POINTS;
        state.events.push({ type: 'steak' });
      }

      // Bone bonus triggers
      if (state.bonesSpawned < BONE_TRIGGERS.length && state.steaksEaten === BONE_TRIGGERS[state.bonesSpawned]) {
        state.bone = { x: BONE_POS.x, y: BONE_POS.y, timer: BONE_LIFETIME_SECS };
        state.bonesSpawned += 1;
      }
    }
  }

  // Bone pickup / expiry
  if (state.bone) {
    state.bone.timer -= dt;
    if (state.bone.timer <= 0) {
      state.bone = null;
    } else if (Math.hypot(dog.x - state.bone.x, dog.y - state.bone.y) < 10) {
      const points = BONE_POINTS_BASE * state.level;
      state.score += points;
      state.events.push({ type: 'bone', points, x: state.bone.x, y: state.bone.y });
      state.bone = null;
    }
  }

  // Extra life
  if (!state.extraLifeAwarded && state.score >= EXTRA_LIFE_AT) {
    state.extraLifeAwarded = true;
    state.lives += 1;
    state.events.push({ type: 'extraLife' });
  }

  // Ghosts
  state.ghosts.forEach(g => tickGhost(state, g, dt));

  // Collisions
  for (const g of state.ghosts) {
    if (g.phase !== 'active') continue;
    if (Math.hypot(g.x - dog.x, g.y - dog.y) < 10) {
      if (g.frightened) {
        const points = GHOST_POINTS[Math.min(state.ghostChain, GHOST_POINTS.length - 1)];
        state.ghostChain += 1;
        state.score += points;
        g.phase = 'eyes';
        g.frightened = false;
        state.events.push({ type: 'ghost', points, x: g.x, y: g.y });
      } else {
        state.events.push({ type: 'death' });
        return;
      }
    }
  }

  // Level clear
  if (state.steaks.size === 0) {
    state.events.push({ type: 'clear' });
  }
}
