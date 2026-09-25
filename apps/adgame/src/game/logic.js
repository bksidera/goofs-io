import {
  GAME_HEIGHT, GATE_HEIGHT, PLAYER_Y, PX, laneX,
  getLevelConfig, BOSS,
} from './constants.js';
import { clamp, randomFrom } from '../utils/helpers.js';
import {
  MULTIPLY_LINES, TRAP_LINES, MYSTERY_LINES,
} from '../copy/banks.js';
import { spawnGate, resolveMystery } from './spawn.js';
import { startLevel, enterBoss, clearLevel, advanceAfterClear, tickBoss } from './levels.js';

// ── Particle burst helper ────────────────────────────────────────────────────

function burst(st, gx, gy, color, count) {
  for (let i = 0; i < count; i++) {
    st.particles.push({
      x: gx, y: gy,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.5) * 9 - 2,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.4,
      life: 1, color,
      size: PX + Math.random() * PX,
    });
  }
}

// ── Power mutation with cap + overflow→score ─────────────────────────────────

// All upward power changes flow through here. Anything above the level's
// power cap converts to banked score — big numbers still feel big, but
// they can no longer break the difficulty curve.
function gainPower(st, amount, gx, gy) {
  const cfg = getLevelConfig(st);
  const target = st.player.targetPower + amount;
  if (target > cfg.powerCap) {
    const overflow = Math.floor(target - cfg.powerCap);
    st.player.targetPower = cfg.powerCap;
    st.score += overflow;
    st.floats.push({ text: `+${overflow} SCORE`, x: gx, y: gy - 22, vy: -1.8, life: 1.1, color: '#FFFFFF', big: true });
  } else {
    st.player.targetPower = target;
  }
}

function damagePower(st, amount) {
  st.player.targetPower -= amount;
  if (st.player.targetPower <= 0) {
    st.player.targetPower = 0;
    st.dead = true; // GameScreen decides: revive offer or final death
  }
}

// ── Gate effect applicator ───────────────────────────────────────────────────

function applyGateEffect(st, type, value, gx, gy) {
  switch (type) {
    case 'add':
      gainPower(st, value, gx, gy);
      burst(st, gx, gy, '#39FF14', 8);
      st.floats.push({ text: `+${value}`, x: gx, y: gy, vy: -1.5, life: 1, color: '#39FF14' });
      st.combo = 0;
      break;

    case 'multiply': {
      const gained = st.player.targetPower * (value - 1);
      gainPower(st, gained, gx, gy);
      burst(st, gx, gy, '#FFD700', 18);
      st.floats.push({ text: `×${value}!`, x: gx, y: gy, vy: -2, life: 1.2, color: '#FFD700', big: true });
      st.flashAlpha = 0.45; st.flashColor = '#FFD70030';
      st.combo++;
      st.comboTimer = 3000;
      st.hitStop = 70;
      if (st.combo >= 2) {
        st.floats.push({ text: randomFrom(MULTIPLY_LINES), x: laneX(1), y: PLAYER_Y / 2, vy: -1, life: 1.5, color: '#FFD700', big: true });
      }
      break;
    }

    case 'enemy': {
      damagePower(st, value);
      burst(st, gx, gy, '#FF0040', 12);
      st.floats.push({ text: `-${value}`, x: gx, y: gy, vy: -1.5, life: 1, color: '#FF0040' });
      st.shakeTimer = 250; st.flashAlpha = 0.3; st.flashColor = '#FF004040';
      st.combo = 0;
      break;
    }

    case 'pctEnemy': {
      const dmg = Math.max(1, Math.floor(st.player.targetPower * (value / 100)));
      damagePower(st, dmg);
      burst(st, gx, gy, '#CC1133', 14);
      st.floats.push({ text: `-%${value} (${dmg})`, x: gx, y: gy, vy: -1.5, life: 1, color: '#CC1133', big: true });
      st.shakeTimer = 300; st.flashAlpha = 0.35; st.flashColor = '#AA002240';
      st.combo = 0;
      break;
    }

    case 'trap': {
      const lost = st.player.targetPower - Math.max(1, Math.floor(st.player.targetPower / value));
      damagePower(st, lost);
      for (let i = 0; i < 25; i++) {
        st.particles.push({
          x: gx, y: gy,
          vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 3,
          rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.5,
          life: 1, color: i % 2 ? '#FF0040' : '#FF2D95', size: PX + Math.random() * PX,
        });
      }
      st.floats.push({ text: `÷${value}!`, x: gx, y: gy, vy: -2, life: 1.2, color: '#FF0040', big: true });
      st.floats.push({ text: randomFrom(TRAP_LINES), x: laneX(1), y: PLAYER_Y / 2, vy: -1, life: 1.5, color: '#FF2D95', big: true });
      st.shakeTimer = 400; st.flashAlpha = 0.4; st.flashColor = '#FF004055';
      st.glitchOn = true; st.glitchTimer = 500;
      st.hitStop = 90;
      st.combo = 0;
      break;
    }

    default: break;
  }

  st.player.power = st.player.targetPower;
  if (st.player.targetPower > st.player.peakPower) st.player.peakPower = st.player.targetPower;
}

// ── Revive (rewarded-ad continue) ────────────────────────────────────────────

export function reviveRun(st) {
  st.usedRevive = true;
  st.dead = false;
  st.player.targetPower = 100;
  st.player.power = 100;
  st.player.displayPower = 100;
  st.gates = [];
  st.invulnTimer = 1600;
}

// ── Main tick ────────────────────────────────────────────────────────────────

// hooks: { spawnPopup(st, setPopups), spawnStormPopup(st, setPopups), setPopups }
export function tickLogic(st, dt, hooks) {
  if (st.dead || st.paused) return;

  // Hit-stop: brief freeze on big events for impact.
  if (st.hitStop > 0) {
    st.hitStop -= dt;
    return;
  }

  st.frame++;
  const dtSecs = dt / 1000;
  st.elapsed += dtSecs;

  const cfg = getLevelConfig(st);
  st.scrollSpeed = cfg.scrollSpeed;
  st.decayVisual = clamp((cfg.n - 4) / 5, 0, 1);

  // ── Phase machine ──────────────────────────────────────────────────────────
  if (st.levelPhase === 'intro') {
    st.phaseTimer -= dtSecs;
    if (st.phaseTimer <= 0) st.levelPhase = 'running';
    tickVisuals(st, dt);
    return; // world paused during the card
  }

  if (st.levelPhase === 'clear') {
    st.phaseTimer -= dtSecs;
    if (st.phaseTimer <= 0) advanceAfterClear(st);
    tickVisuals(st, dt);
    return;
  }

  if (st.levelPhase === 'boss') {
    const b = st.boss;
    b.popupTimer -= dtSecs;
    if (b.popupTimer <= 0) {
      b.popupTimer = BOSS.POPUP_EVERY;
      hooks.spawnStormPopup?.(st, hooks.setPopups);
    }
    const hit = tickBoss(st, dtSecs, st.player.lane);
    if (hit === 'hit') {
      const dmg = Math.max(10, Math.floor(st.player.targetPower * (BOSS.HIT_PCT / 100)));
      damagePower(st, dmg);
      st.player.power = st.player.targetPower;
      st.floats.push({ text: `-${dmg}`, x: laneX(st.boss.lane), y: PLAYER_Y - 40, vy: -1.5, life: 1, color: '#FF0040', big: true });
      st.shakeTimer = 350; st.flashAlpha = 0.4; st.flashColor = '#FF004050';
      st.invulnTimer = 900;
    }
    if (st.boss && st.boss.timer <= 0 && !st.dead) {
      clearLevel(st);
      hooks.setPopups?.([]);
    }
  }

  // ── Spawning (running phase only) ──────────────────────────────────────────
  if (st.levelPhase === 'running') {
    st.spawnTimer += dt;
    if (st.spawnTimer >= cfg.spawnInterval && st.gatesSpawned < cfg.goal) {
      st.spawnTimer = 0;
      if (spawnGate(st)) {
        st.gatesSpawned++;
        // Popup cadence: every 6th gate, roll the level's popup chance.
        if (st.gatesSpawned % 6 === 0 && Math.random() < cfg.popupChance) {
          hooks.spawnPopup?.(st, hooks.setPopups);
        }
      }
    }

    // Goal reached and screen empty → boss time (campaign only).
    if (st.mode === 'campaign' && st.gatesSpawned >= cfg.goal && st.gates.length === 0) {
      enterBoss(st);
    }
  }

  // ── Decay: percentage of current power — hoarding is impossible ───────────
  // (Running phase only: the boss's threat is its dives, not starvation.)
  if (st.levelPhase === 'running' && cfg.decayPct > 0) {
    const drain = Math.max(cfg.decayFloor, st.player.targetPower * (cfg.decayPct / 100)) * dtSecs;
    st.player.targetPower -= drain;
    st.player.power = st.player.targetPower;
    if (st.player.targetPower <= 0) {
      st.player.targetPower = 0;
      st.dead = true;
      return;
    }
  }

  // ── Timers / ambient visuals ───────────────────────────────────────────────
  tickVisuals(st, dt);
  if (st.invulnTimer > 0) st.invulnTimer -= dt;

  // Infection
  const wasInfected = st.infected;
  st.infected = st.pops.some(p => p.alive);
  if (wasInfected && !st.infected) st.infectionFlash = 1.0;

  st.infectionTextTimer += dt;
  if (st.infectionTextTimer > 500) { st.infectionTextTimer = 0; st.scrambleSeed = Math.floor(Math.random() * 100); }
  st._scrambleActive = st.infectionTextTimer < 120;

  // Display lerp
  const diff = st.player.targetPower - st.player.displayPower;
  st.player.displayPower += diff * 0.1;
  if (Math.abs(diff) < 0.5) st.player.displayPower = st.player.targetPower;

  // Trail
  st.trail.push({ x: laneX(st.player.lane), y: PLAYER_Y, life: 1 });
  if (st.trail.length > 6) st.trail.shift();
  for (const t of st.trail) t.life -= 0.15;

  // ── Gates ──────────────────────────────────────────────────────────────────
  for (const g of st.gates) {
    if (!g.alive) continue;
    g.y += st.scrollSpeed * (dt / 16);

    const hit = g.y + GATE_HEIGHT > PLAYER_Y - 20 && g.y < PLAYER_Y + 10 && g.lane === st.player.lane;
    if (hit && st.invulnTimer <= 0) {
      g.alive = false;
      const gx = laneX(g.lane), gy = PLAYER_Y - 20;

      if (st.infected) {
        const dmg = Math.max(5, Math.floor(10 + cfg.n * 4));
        damagePower(st, dmg);
        st.player.power = st.player.targetPower;
        burst(st, gx, gy, '#FF0040', 10);
        st.floats.push({ text: `INFECTED -${dmg}`, x: gx, y: gy, vy: -1.5, life: 1, color: '#FF0040' });
        st.shakeTimer = 200; st.flashAlpha = 0.25; st.flashColor = '#FF004030';
        if (st.dead) return;
      } else if (g.type === 'mystery') {
        const resolved = resolveMystery(cfg.n);
        st.floats.push({ text: randomFrom(MYSTERY_LINES), x: laneX(1), y: PLAYER_Y / 2, vy: -1, life: 1.2, color: '#CC44FF', big: true });
        applyGateEffect(st, resolved.type, resolved.value, gx, gy);
      } else if (g.type === 'trap') {
        g.revealed = true;
        applyGateEffect(st, 'trap', g.value, gx, gy);
      } else {
        applyGateEffect(st, g.type, g.value, gx, gy);
      }
      if (st.dead) return;
    }

    if (g.y > GAME_HEIGHT + 50) g.alive = false;
  }
  st.gates = st.gates.filter(g => g.alive);

  // Physics tick
  for (const p of st.particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.18;
    p.rot = (p.rot ?? 0) + (p.vrot ?? 0);
    p.life -= 0.028;
  }
  st.particles = st.particles.filter(p => p.life > 0);
  for (const f of st.floats) { f.y += f.vy; f.life -= 0.016; }
  st.floats = st.floats.filter(f => f.life > 0);
}

// Visual-only timers that should advance even during intro/clear cards.
function tickVisuals(st, dt) {
  if (st.waveMsgTimer > 0)   st.waveMsgTimer  -= dt;
  if (st.popCooldown > 0)    st.popCooldown   -= dt;
  if (st.infectionFlash > 0) st.infectionFlash -= dt * 0.003;
  if (st.comboTimer > 0) { st.comboTimer -= dt; if (st.comboTimer <= 0) st.combo = 0; }
  if (st.flashAlpha > 0)     st.flashAlpha   -= dt * 0.004;

  if (st.shakeTimer > 0) {
    st.shakeTimer -= dt;
    const i = st.shakeTimer / 300;
    st.shakeX = (Math.random() - 0.5) * 10 * i;
    st.shakeY = (Math.random() - 0.5) * 10 * i;
  } else { st.shakeX = 0; st.shakeY = 0; }

  st.scanOff = (st.scanOff + dt * 0.03) % 3;
  const glitchChance = 0.02 + st.decayVisual * 0.06;
  st.glitchTimer -= dt;
  if (st.glitchTimer <= 0) {
    st.glitchOn    = Math.random() < glitchChance;
    st.glitchTimer = st.glitchOn ? 40 + Math.random() * 80 : 600 + Math.random() * 2000;
  }

  if (st.showTut) {
    st.tutTimer += dt;
    if (st.tutTimer > 2200) { st.tutTimer = 0; st.tutIdx++; if (st.tutIdx >= 4) st.showTut = false; }
  }
}

export { startLevel };
