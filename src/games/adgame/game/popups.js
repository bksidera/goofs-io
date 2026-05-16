import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { randomFrom, clamp } from '../utils/helpers.js';
import { POPUP_MESSAGES } from '../copy/banks.js';

// ── Tier selection ───────────────────────────────────────────────────────────

function pickTier(wave) {
  if (wave >= 12) return Math.random() < 0.12 ? 'boss'     : pickTier(wave - 4);
  if (wave >= 10) return Math.random() < 0.25 ? 'splitter' : pickTier(wave - 2);
  if (wave >= 8)  return Math.random() < 0.30 ? 'decoy'    : (wave >= 5 ? 'dodger' : 'basic');
  if (wave >= 5)  return Math.random() < 0.40 ? 'dodger'   : 'basic';
  return 'basic';
}

// ── Spawn ────────────────────────────────────────────────────────────────────

export function spawnPopup(st, setPopups) {
  if (st.wave < 3) return;
  if (st.pops.length >= 2) return;
  if (st.popCooldown > 0) return;
  if (Math.random() > 0.40) return;

  const tier = pickTier(st.wave);
  const msg  = randomFrom(POPUP_MESSAGES);
  const id   = Date.now() + Math.random();

  // Boss popup: different position (centered)
  const x = tier === 'boss' ? 0 : clamp(15 + Math.random() * (GAME_WIDTH - 240), 10, GAME_WIDTH - 220);
  const y = tier === 'boss' ? 0 : clamp(70 + Math.random() * 200, 60, GAME_HEIGHT - 210);

  const maxDodges = tier === 'dodger' ? Math.min(st.wave - 4, 4) : 0;

  st.pops.push({ id, ...msg, x, y, tier, dodges: 0, maxDodges, alive: true });
  st.popCooldown = 4000 + Math.random() * 3000;
  setPopups([...st.pops.filter(p => p.alive)]);
}

export function spawnBasicPopup(st, setPopups) {
  if (st.pops.filter(p => p.alive).length >= 3) return; // brief 3-cap for splitter
  const msg = randomFrom(POPUP_MESSAGES);
  const id  = Date.now() + Math.random();
  const x   = clamp(15 + Math.random() * (GAME_WIDTH - 240), 10, GAME_WIDTH - 220);
  const y   = clamp(70 + Math.random() * 200, 60, GAME_HEIGHT - 210);
  st.pops.push({ id, ...msg, x, y, tier: 'basic', dodges: 0, maxDodges: 0, alive: true });
  setPopups([...st.pops.filter(p => p.alive)]);
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
  st.pops = st.pops.filter(p2 => p2.alive);
  setPopups([...st.pops.filter(p2 => p2.alive)]);
}

export function decoyButtonPressed(st, id, setPopups) {
  spawnBasicPopup(st, setPopups);
}
