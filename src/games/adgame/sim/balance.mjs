// Headless balance simulation for AdGame.exe v2.
// Proves the difficulty model: AFK always dies, a skilled greedy player can't
// exceed the power cap, and a cautious player can clear the campaign.
//
// Run: node src/games/adgame/sim/balance.mjs

import { initState } from '../game/state.js';
import { tickLogic, reviveRun } from '../game/logic.js';
import { getLevelConfig, PLAYER_Y } from '../game/constants.js';

const noop = () => {};
const hooks = { spawnPopup: noop, spawnStormPopup: noop, setPopups: noop };

const HARMFUL = new Set(['enemy', 'pctEnemy', 'trap']);

// What's coming at the player in each lane (nearest gate in the decision
// window)? Window starts at 180 — roughly the anticipation a human gets from
// watching gates descend.
function laneThreats(st) {
  const lanes = [null, null, null];
  for (const g of st.gates) {
    if (!g.alive) continue;
    if (g.y < 180 || g.y > PLAYER_Y) continue;
    if (!lanes[g.lane] || g.y > lanes[g.lane].y) lanes[g.lane] = g;
  }
  return lanes;
}

function chooseLane(st, profile) {
  const cur = st.player.lane;

  // Boss telegraph/dive: get out of the locked lane.
  if (st.boss && (st.boss.phase === 'telegraph' || st.boss.phase === 'dive')) {
    if (st.boss.lane === cur && profile !== 'afk') {
      return cur === 0 ? 1 : cur === 2 ? 1 : (st.boss.lane === 0 ? 2 : 0);
    }
    return cur;
  }

  if (profile === 'afk') return cur;

  const lanes = laneThreats(st);
  const reachable = [cur, cur - 1, cur + 1].filter(l => l >= 0 && l <= 2);

  let best = cur;
  let bestScore = -Infinity;
  for (const l of reachable) {
    const g = lanes[l];
    let score = 0;
    if (!g) {
      score = 10; // empty lane is safe
    } else if (HARMFUL.has(g.type) || g.type === 'mystery') {
      score = -100 + (PLAYER_Y - g.y); // danger: farther away = less bad
    } else if (g.type === 'multiply') {
      score = profile === 'greedy' ? 200 : (g.y > 480 ? -20 : 5);
    } else if (g.type === 'add') {
      score = 100;
    }
    if (l !== cur) score -= 1; // mild inertia
    if (score > bestScore) { bestScore = score; best = l; }
  }
  return best;
}

function runOnce(profile, mode = 'campaign', maxSecs = 1800, useRevive = false) {
  const st = initState(mode);
  const dt = 16.67;
  let t = 0;
  let capViolated = false;

  while (t < maxSecs * 1000) {
    st.player.lane = chooseLane(st, profile);
    tickLogic(st, dt, hooks);
    t += dt;

    const cap = getLevelConfig(st).powerCap;
    if (st.player.targetPower > cap + 1) capViolated = true;

    if (st.dead) {
      // Players get one rewarded-ad revive per campaign run; the bot uses it.
      if (useRevive && !st.victory && !st.usedRevive && mode === 'campaign') {
        reviveRun(st);
        continue;
      }
      return {
        outcome: st.victory ? 'victory' : 'death',
        secs: Math.round(t / 1000),
        level: st.levelIndex + 1,
        score: st.score,
        capViolated,
      };
    }
  }
  return { outcome: 'timeout', secs: maxSecs, level: st.levelIndex + 1, score: st.score, capViolated };
}

// ── Trials ───────────────────────────────────────────────────────────────────

const TRIALS = 5;
let failures = 0;

function assert(cond, msg) {
  if (!cond) { console.error(`  ✗ FAIL: ${msg}`); failures++; }
  else console.log(`  ✓ ${msg}`);
}

console.log('— AFK profile (campaign): must always die —');
for (let i = 0; i < TRIALS; i++) {
  const r = runOnce('afk');
  console.log(`  trial ${i + 1}: ${r.outcome} at level ${r.level} after ${r.secs}s (score ${r.score})`);
  assert(r.outcome === 'death', `AFK dies (trial ${i + 1})`);
}

// Stochastic game: assert the clear RATE for a careful player (with their
// one revive), not per-trial perfection. Late-game deaths are intended
// tension, not bugs.
console.log('\n— Cautious profile + revive (campaign): ≥60% clear rate over 10 —');
{
  let wins = 0;
  let reachedLate = 0;
  for (let i = 0; i < 10; i++) {
    const r = runOnce('cautious', 'campaign', 1800, true);
    if (r.outcome === 'victory') wins++;
    if (r.level >= 6 || r.outcome === 'victory') reachedLate++;
    console.log(`  trial ${i + 1}: ${r.outcome} at level ${r.level} after ${r.secs}s (score ${r.score})`);
  }
  assert(wins >= 6, `Cautious clear rate ≥60% (got ${wins}/10)`);
  assert(reachedLate >= 8, `Cautious reaches L6+ in ≥80% of runs (got ${reachedLate}/10)`);
}

console.log('\n— Greedy profile (campaign): cap never exceeded —');
for (let i = 0; i < TRIALS; i++) {
  const r = runOnce('greedy');
  console.log(`  trial ${i + 1}: ${r.outcome} at level ${r.level} after ${r.secs}s (score ${r.score})`);
  assert(!r.capViolated, `Greedy never exceeds power cap (trial ${i + 1})`);
}

console.log('\n— Greedy profile (ENDLESS): must die within 20 min —');
for (let i = 0; i < 3; i++) {
  const r = runOnce('greedy', 'endless', 1200);
  console.log(`  trial ${i + 1}: ${r.outcome} after ${r.secs}s (score ${r.score})`);
  assert(r.outcome === 'death', `Endless greedy eventually dies (trial ${i + 1})`);
}

console.log(failures === 0 ? '\nALL BALANCE ASSERTIONS PASSED' : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
