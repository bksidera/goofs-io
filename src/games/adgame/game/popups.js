import { GAME_WIDTH, GAME_HEIGHT, getLevelConfig } from './constants.js';
import { randomFrom, clamp } from '../utils/helpers.js';
import { POPUP_MESSAGES } from '../copy/banks.js';

// ── Tier selection (by level number, 1-10) ───────────────────────────────────

function pickTier(levelN) {
  if (levelN >= 9) return Math.random() < 0.15 ? 'boss'     : pickTier(levelN - 3);
  if (levelN >= 7) return Math.random() < 0.28 ? 'splitter' : pickTier(levelN - 2);
  if (levelN >= 5) return Math.random() < 0.32 ? 'decoy'    : 'dodger';
  if (levelN >= 3) return Math.random() < 0.45 ? 'dodger'   : 'basic';
  return 'basic';
}

// ── Spawn ────────────────────────────────────────────────────────────────────

export function spawnPopup(st, setPopups) {
  if (st.pops.length >= 2) return;
  if (st.popCooldown > 0) return;

  const levelN = getLevelConfig(st).n;
  const tier = pickTier(levelN);
  const msg  = randomFrom(POPUP_MESSAGES);
  const id   = Date.now() + Math.random();

  const x = tier === 'boss' ? 0 : clamp(15 + Math.random() * (GAME_WIDTH - 240), 10, GAME_WIDTH - 220);
  const y = tier === 'boss' ? 0 : clamp(70 + Math.random() * 200, 60, GAME_HEIGHT - 210);

  const maxDodges = tier === 'dodger' ? Math.min(levelN - 2, 4) : 0;

  st.pops.push({ id, ...msg, x, y, tier, dodges: 0, maxDodges, alive: true });
  st.popCooldown = 4000 + Math.random() * 3000;
  setPopups([...st.pops.filter(p => p.alive)]);
}

export function spawnBasicPopup(st, setPopups) {
  if (st.pops.filter(p => p.alive).length >= 3) return;
  const msg = randomFrom(POPUP_MESSAGES);
  const id  = Date.now() + Math.random();
  const x   = clamp(15 + Math.random() * (GAME_WIDTH - 240), 10, GAME_WIDTH - 220);
  const y   = clamp(70 + Math.random() * 200, 60, GAME_HEIGHT - 210);
  st.pops.push({ id, ...msg, x, y, tier: 'basic', dodges: 0, maxDodges: 0, alive: true });
  setPopups([...st.pops.filter(p => p.alive)]);
}

// Boss-phase popup storm: ignores cooldown and chance gates.
export function spawnStormPopup(st, setPopups) {
  spawnBasicPopup(st, setPopups);
}

// ── Close ────────────────────────────────────────────────────────────────────

export function closePopup(st, id, setPopups) {
  const p = st.pops.find(p2 => p2.id === id);
  if (!p) return;

  if (p.tier === 'dodger' && p.dodges < p.maxDodges && Math.random() > 0.35) {
    p.x = clamp(p.x + (Math.random() - 0.5) * 80, 10, GAME_WIDTH - 230);
    p.y = clamp(p.y + (Math.random() - 0.5) * 80, 60, GAME_HEIGHT - 200);
    p.dodges++;
    setPopups([...st.pops.filter(p2 => p2.alive)]);
    return;
  }

  if (p.tier === 'splitter') {
    p.alive = false;
    st.pops = st.pops.filter(p2 => p2.alive);
    spawnBasicPopup(st, setPopups);
    spawnBasicPopup(st, setPopups);
    return;
  }

  p.alive = false;
  // Closing a popup is worth score — dodge bonus.
  st.score += 25;
  st.pops = st.pops.filter(p2 => p2.alive);
  setPopups([...st.pops.filter(p2 => p2.alive)]);
}

export function decoyButtonPressed(st, id, setPopups) {
  spawnBasicPopup(st, setPopups);
}
