// Headless smoke/balance checks for Terms & Conditions.
// Run: node src/games/terms/sim/balance.mjs

import { initState } from '../game/state.js';
import { tickLogic } from '../game/logic.js';
import { applyAction } from '../game/patterns.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function chooseAction(st, profile) {
  if (profile === 'idle') return null;
  const modal = st.modals.find(m => m.alive);
  if (modal) return { type: 'modalClose', id: modal.id };
  const toggle = st.toggles.find(t => t.on);
  if (toggle && profile !== 'focused') return { type: 'toggle', id: toggle.id };
  const decline = st.buttons.find(b => b.alive && b.kind === 'decline');
  if (decline) return { type: 'button', id: decline.id };
  return null;
}

function run(profile, mode = 'campaign', seed = 1, maxSecs = 900) {
  const st = initState(mode, rng(seed));
  const hooks = { setOverlay: () => {} };
  const dt = 16.67;
  let clickTimer = 0;
  let time = 0;
  while (!st.dead && time < maxSecs * 1000) {
    tickLogic(st, dt, hooks);
    time += dt;
    clickTimer -= dt;
    if (st.phase === 'running' && clickTimer <= 0) {
      const action = chooseAction(st, profile);
      if (action) applyAction(st, action);
      clickTimer = profile === 'cautious' ? 360 : 620;
    }
  }
  return {
    outcome: st.victory ? 'victory' : st.dead ? 'death' : 'timeout',
    stage: st.stageIndex + 1,
    score: Math.floor(st.score),
    rejections: st.totalRejections,
    secs: Math.round(time / 1000),
  };
}

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    failures++;
  }
}

console.log('— idle profile: must fail —');
for (let i = 1; i <= 3; i++) {
  const r = run('idle', 'campaign', i, 180);
  console.log(`  trial ${i}: ${r.outcome} at stage ${r.stage} after ${r.secs}s`);
  assert(r.outcome === 'death', `idle fails trial ${i}`);
}

console.log('\n— cautious profile: must clear campaign deterministically —');
{
  const r = run('cautious', 'campaign', 42, 900);
  console.log(`  result: ${r.outcome} at stage ${r.stage} after ${r.secs}s score ${r.score}`);
  assert(r.outcome === 'victory', 'cautious clears campaign');
  assert(r.rejections >= 30, `cautious rejects enough clauses (${r.rejections})`);
}

console.log('\n— focused profile: reaches midgame —');
{
  const r = run('focused', 'campaign', 11, 360);
  console.log(`  result: ${r.outcome} at stage ${r.stage} after ${r.secs}s`);
  assert(r.stage >= 4 || r.outcome === 'victory', 'focused reaches stage 4+');
}

console.log('\n— endless profile: eventually fails —');
{
  const r = run('cautious', 'endless', 99, 900);
  console.log(`  result: ${r.outcome} after ${r.secs}s score ${r.score}`);
  assert(r.outcome === 'death', 'endless eventually fails');
}

console.log(failures === 0 ? '\nALL TERMS ASSERTIONS PASSED' : `\n${failures} ASSERTION(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
