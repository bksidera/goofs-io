import { LEVELS, BOSS, getLevelConfig } from './constants.js';

// Level flow state machine. Phases:
//   'intro'   → level title card (~2.2s), world paused
//   'running' → normal gate gameplay until cfg.goal gates have spawned and
//               the screen has drained of live gates
//   'boss'    → the CONVERSION EVENT: mega-drone dives + popup storm for
//               cfg.bossSecs; survive it to clear
//   'clear'   → "AD WATCHED ✓" card (~2.4s), score banked, then next intro
// Campaign ends in victory after level 9's clear. Endless mode never leaves
// 'running' (its decay curve guarantees death instead).

export const INTRO_SECS = 2.2;
export const CLEAR_SECS = 2.4;

export function startLevel(st, levelIndex) {
  st.levelIndex = levelIndex;
  st.levelPhase = 'intro';
  st.phaseTimer = INTRO_SECS;
  st.gatesSpawned = 0;
  st.gates = [];
  st.boss = null;
  // The core anti-snowball rule: power resets every level.
  st.player.targetPower = 100;
  st.player.power = 100;
  st.player.displayPower = 100;
  st.player.peakPower = 100;
}

export function enterBoss(st) {
  st.levelPhase = 'boss';
  const cfg = getLevelConfig(st);
  st.boss = {
    timer: cfg.bossSecs,
    phase: 'hover',
    cycleTimer: BOSS.HOVER_SECS,
    x: 180,
    lane: 1,
    diveY: -40,
    hits: 0,
    popupTimer: BOSS.POPUP_EVERY,
  };
}

// Banks the level score and moves to the clear card.
export function clearLevel(st) {
  const cfg = getLevelConfig(st);
  const levelScore = Math.floor(st.player.peakPower) * cfg.n + 250 * cfg.n;
  st.score += levelScore;
  st.lastLevelScore = levelScore;
  st.levelPhase = 'clear';
  st.phaseTimer = CLEAR_SECS;
  st.boss = null;
  st.gates = [];
  st.pops = [];
}

// Advance out of the clear card: next level, or campaign victory.
export function advanceAfterClear(st) {
  if (st.levelIndex + 1 >= LEVELS.length) {
    st.victory = true;
    st.dead = true; // routes to the end screen; victory flag distinguishes it
    return;
  }
  startLevel(st, st.levelIndex + 1);
}

// Boss tick. Returns 'hit' if the player got tagged this frame.
export function tickBoss(st, dtSecs, playerLane) {
  const b = st.boss;
  if (!b) return null;
  let result = null;

  b.timer -= dtSecs;
  b.cycleTimer -= dtSecs;

  if (b.phase === 'hover') {
    // Drift toward the player's lane.
    const targetX = 90 + playerLane * 90;
    b.x += (targetX - b.x) * Math.min(1, dtSecs * 4);
    if (b.cycleTimer <= 0) {
      b.phase = 'telegraph';
      b.cycleTimer = BOSS.TELEGRAPH_SECS;
      b.lane = playerLane; // lock-on
    }
  } else if (b.phase === 'telegraph') {
    if (b.cycleTimer <= 0) {
      b.phase = 'dive';
      b.cycleTimer = BOSS.DIVE_SECS;
      b.diveY = -40;
    }
  } else if (b.phase === 'dive') {
    b.diveY += (700 / BOSS.DIVE_SECS) * dtSecs;
    if (b.diveY > 500 && b.diveY < 600 && playerLane === b.lane && st.invulnTimer <= 0) {
      result = 'hit';
      b.hits += 1;
    }
    if (b.cycleTimer <= 0) {
      b.phase = 'hover';
      b.cycleTimer = BOSS.HOVER_SECS;
    }
  }

  return result;
}
