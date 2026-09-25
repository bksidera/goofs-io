import { GATE_HEIGHT, getLevelConfig } from './constants.js';
import { randomFrom } from '../utils/helpers.js';

// Gate factory. All gate creation flows through here so the level's gateMix
// is the single source of truth for what spawns. rng is injectable for the
// balance simulation.

export function rollGateType(gateMix, rng = Math.random) {
  const entries = Object.entries(gateMix).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [type, w] of entries) {
    r -= w;
    if (r <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

// Value formulas scale with level number, not unbounded wave count.
export function rollGateValue(type, levelN, rng = Math.random) {
  switch (type) {
    case 'add': {
      const b = 14 + levelN * 9;
      return Math.floor(b + rng() * b * 0.5);
    }
    case 'enemy': {
      const b = 10 + levelN * 6;
      return Math.floor(b + rng() * b * 0.4);
    }
    case 'pctEnemy':
      return Math.max(6, Math.min(25, Math.floor(8 + levelN * 1.6 + (rng() - 0.5) * 6)));
    case 'multiply':
      return 2; // ×2 only — the ×3/×5 era is what made v1 unloseable
    case 'trap':
      return randomFrom([2, 3]);
    default:
      return 0;
  }
}

export function displayFor(type, value) {
  switch (type) {
    case 'add':      return `+${value}`;
    case 'enemy':    return `-${value}`;
    case 'pctEnemy': return `-%${value}`;
    case 'multiply': return `×${value}`;
    case 'trap':     return `×${value}`; // lies, like the ad it is
    default:         return '???';
  }
}

const HARMFUL_TYPES = new Set(['enemy', 'pctEnemy', 'trap', 'mystery']);

export function spawnGate(st, rng = Math.random) {
  const lane = Math.floor(rng() * 3);
  if (st.gates.some(g => g.lane === lane && g.y < 70)) return false;

  const cfg = getLevelConfig(st);
  let type = rollGateType(cfg.gateMix, rng);

  // Fairness rule: never complete an inescapable wall. If the two other
  // lanes both have harmful gates in the recent spawn cohort, this lane
  // must offer an escape route.
  if (HARMFUL_TYPES.has(type)) {
    const cohortHarmfulLanes = new Set(
      st.gates.filter(g => g.alive && g.y < 150 && HARMFUL_TYPES.has(g.type)).map(g => g.lane)
    );
    cohortHarmfulLanes.delete(lane);
    if (cohortHarmfulLanes.size >= 2) type = 'add';
  }

  const value = rollGateValue(type, cfg.n, rng);

  st.gates.push({
    lane, type, value,
    display: displayFor(type, value),
    y: -GATE_HEIGHT,
    revealed: false,
    alive: true,
    variant: Math.floor(rng() * 3),
    // Trap tell: a per-gate phase offset so flicker timing isn't synchronized.
    tellPhase: rng() * Math.PI * 2,
  });
  return true;
}

// Mystery gates resolve on contact.
export function resolveMystery(levelN, rng = Math.random) {
  const r = rng();
  let type;
  if (r < 0.30) type = 'enemy';
  else if (r < 0.58) type = 'add';
  else if (r < 0.78) type = 'multiply';
  else if (r < 0.92) type = 'trap';
  else type = 'pctEnemy';
  return { type, value: rollGateValue(type, levelN, rng) };
}
