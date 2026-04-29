import {
  GAME_WIDTH, GAME_HEIGHT, GATE_HEIGHT, PLAYER_Y, PX, laneX,
  getWaveConfig, rollGateType, rollPctValue,
} from './constants.js';
import { clamp, randomFrom } from '../utils/helpers.js';
import {
  MULTIPLY_LINES, TRAP_LINES, WAVE_LINES, MYSTERY_LINES,
} from '../copy/banks.js';
import { calcScore, saveHighScore } from './scoring.js';

// ── Spawn ────────────────────────────────────────────────────────────────────

export function spawnGate(st) {
  const lane = Math.floor(Math.random() * 3);
  if (st.gates.some(g => g.lane === lane && g.y < 70)) return;

  const type = rollGateType(st.wave);
  let value, display;

  if (type === 'trap') {
    value   = randomFrom([2, 3, 5]);
    display = `×${value}`;
  } else if (type === 'multiply') {
    const pool = st.wave < 4 ? [2] : [2, 2, 3, 3, 5];
    value   = randomFrom(pool);
    display = `×${value}`;
  } else if (type === 'enemy') {
    const b = 8 + st.wave * 4;
    value   = Math.floor(b + Math.random() * b * 0.4);
    display = `-${value}`;
  } else if (type === 'pctEnemy') {
    value   = rollPctValue(st.wave);
    display = `-%${value}`;
  } else if (type === 'mystery') {
    value   = 0;
    display = '???';
  } else {
    const b = 8 + st.wave * 3;
    value   = Math.floor(b + Math.random() * b * 0.5);
    display = `+${value}`;
  }

  st.gates.push({
    lane, type, value, display,
    y: -GATE_HEIGHT,
    revealed: false,
    alive: true,
    variant: Math.floor(Math.random() * 3),
  });
}

// ── Mystery resolution ───────────────────────────────────────────────────────

function resolveMysterType() {
  const r = Math.random();
  if (r < 0.30) return 'enemy';
  if (r < 0.55) return 'add';
  if (r < 0.75) return 'multiply';
  if (r < 0.90) return 'trap';
  return 'pctEnemy';
}

// ── Particle burst helper ────────────────────────────────────────────────────

function burst(st, gx, gy, color, count) {
  for (let i = 0; i < count; i++) {
    st.particles.push({
      x: gx, y: gy,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.5) * 9 - 2,
      life: 1, color,
      size: PX + Math.random() * PX,
    });
  }
}

// ── Gate effect applicator ───────────────────────────────────────────────────

function applyGateEffect(st, type, value, gx, gy, onDeath) {
  switch (type) {
    case 'add':
      st.player.targetPower += value;
      burst(st, gx, gy, '#39FF14', 8);
      st.floats.push({ text: `+${value}`, x: gx, y: gy, vy: -1.5, life: 1, color: '#39FF14' });
      st.combo = 0;
      break;

    case 'multiply':
      st.player.targetPower *= value;
      burst(st, gx, gy, '#FFD700', 18);
      st.floats.push({ text: `×${value}!`, x: gx, y: gy, vy: -2, life: 1.2, color: '#FFD700', big: true });
      st.flashAlpha = 0.45; st.flashColor = '#FFD70030';
      st.combo++;
      st.comboTimer = 3000;
      if (st.combo >= 2) {
        st.floats.push({ text: randomFrom(MULTIPLY_LINES), x: laneX(1), y: PLAYER_Y / 2, vy: -1, life: 1.5, color: '#FFD700', big: true });
      }
      break;

    case 'enemy': {
      st.player.targetPower -= value;
      burst(st, gx, gy, '#FF0040', 12);
      st.floats.push({ text: `-${value}`, x: gx, y: gy, vy: -1.5, life: 1, color: '#FF0040' });
      st.shakeTimer = 250; st.flashAlpha = 0.3; st.flashColor = '#FF004040';
      st.combo = 0;
      break;
    }

    case 'pctEnemy': {
      const dmg = Math.max(1, Math.floor(st.player.targetPower * (value / 100)));
      st.player.targetPower -= dmg;
      burst(st, gx, gy, '#CC1133', 14);
      st.floats.push({ text: `-%${value} (${dmg})`, x: gx, y: gy, vy: -1.5, life: 1, color: '#CC1133', big: true });
      st.shakeTimer = 300; st.flashAlpha = 0.35; st.flashColor = '#AA002240';
      st.combo = 0;
      break;
    }

    case 'trap': {
      const actual = Math.max(1, Math.floor(st.player.targetPower / value));
      st.player.targetPower = actual;
      for (let i = 0; i < 25; i++) {
        st.particles.push({ x: gx, y: gy, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 3, life: 1, color: i % 2 ? '#FF0040' : '#FF2D95', size: PX + Math.random() * PX });
      }
      st.floats.push({ text: `÷${value}!`, x: gx, y: gy, vy: -2, life: 1.2, color: '#FF0040', big: true });
      st.floats.push({ text: randomFrom(TRAP_LINES), x: laneX(1), y: PLAYER_Y / 2, vy: -1, life: 1.5, color: '#FF2D95', big: true });
      st.shakeTimer = 400; st.flashAlpha = 0.4; st.flashColor = '#FF004055';
      st.glitchOn = true; st.glitchTimer = 500;
      st.combo = 0;
      break;
    }

    default: break;
  }

  st.player.power = st.player.targetPower;
  if (st.player.targetPower > st.player.peakPower) st.player.peakPower = st.player.targetPower;

  if (st.player.targetPower <= 0) {
    st.player.targetPower = 0;
    st.gameOver = true;
    const score = calcScore(Math.floor(st.player.peakPower), st.wave);
    saveHighScore(score);
    onDeath(score, st.wave, Math.floor(st.player.peakPower));
  }
}

// ── Main tick ────────────────────────────────────────────────────────────────

export function tickLogic(st, dt, spawnPopup, onDeath, setPopups) {
  if (st.gameOver || st.paused) return;

  st.frame++;

  const cfg = getWaveConfig(st.wave);
  st.scrollSpeed   = cfg.scrollSpeed;
  st.spawnInterval = cfg.spawnInterval;
  st.decayRate     = cfg.decay;

  st.decayVisual = clamp((st.wave - 5) / 7, 0, 1);

  // Spawn
  st.spawnTimer += dt;
  if (st.spawnTimer >= st.spawnInterval) {
    st.spawnTimer = 0;
    spawnGate(st);
    st.waveGates++;
  }

  // Wave advance
  if (st.waveGates >= cfg.gatesPerWave) {
    st.wave++;
    st.waveGates = 0;
    st.waveMsg = randomFrom(WAVE_LINES).replace('{n}', st.wave);
    st.waveMsgTimer = 2200;
    spawnPopup(st, setPopups);
  }

  // Tutorial cycling
  if (st.showTut) {
    st.tutTimer += dt;
    if (st.tutTimer > 2200) { st.tutTimer = 0; st.tutIdx++; if (st.tutIdx >= 4) st.showTut = false; }
  }

  // Countdown timers
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

  // Glitch
  st.scanOff = (st.scanOff + dt * 0.03) % 3;
  const glitchChance = 0.02 + st.decayVisual * 0.06;
  st.glitchTimer -= dt;
  if (st.glitchTimer <= 0) {
    st.glitchOn    = Math.random() < glitchChance;
    st.glitchTimer = st.glitchOn ? 40 + Math.random() * 80 : 600 + Math.random() * 2000;
  }

  // Infection
  const wasInfected = st.infected;
  st.infected = st.pops.some(p => p.alive);
  if (wasInfected && !st.infected) st.infectionFlash = 1.0;

  // Text scramble cadence
  st.infectionTextTimer += dt;
  if (st.infectionTextTimer > 500) { st.infectionTextTimer = 0; st.scrambleSeed = Math.floor(Math.random() * 100); }
  st._scrambleActive = st.infectionTextTimer < 120;

  // Decay
  if (st.decayRate > 0) {
    st.player.targetPower -= st.decayRate * (dt / 1000);
    st.player.power = st.player.targetPower;
    if (st.player.targetPower <= 0) {
      st.player.targetPower = 0;
      st.gameOver = true;
      const score = calcScore(Math.floor(st.player.peakPower), st.wave);
      saveHighScore(score);
      onDeath(score, st.wave, Math.floor(st.player.peakPower));
      return;
    }
  }

  // Display lerp
  const diff = st.player.targetPower - st.player.displayPower;
  st.player.displayPower += diff * 0.1;
  if (Math.abs(diff) < 0.5) st.player.displayPower = st.player.targetPower;

  // Trail
  st.trail.push({ x: laneX(st.player.lane), y: PLAYER_Y, life: 1 });
  if (st.trail.length > 6) st.trail.shift();
  for (const t of st.trail) t.life -= 0.15;

  // Gates
  for (const g of st.gates) {
    if (!g.alive) continue;
    g.y += st.scrollSpeed * (dt / 16);

    const hit = g.y + GATE_HEIGHT > PLAYER_Y - 20 && g.y < PLAYER_Y + 10 && g.lane === st.player.lane;
    if (hit) {
      g.alive = false;
      const gx = laneX(g.lane), gy = PLAYER_Y - 20;

      if (st.infected) {
        const dmg = Math.max(5, Math.floor(10 + st.wave * 3));
        st.player.targetPower -= dmg;
        st.player.power = st.player.targetPower;
        burst(st, gx, gy, '#FF0040', 10);
        st.floats.push({ text: `INFECTED -${dmg}`, x: gx, y: gy, vy: -1.5, life: 1, color: '#FF0040' });
        st.shakeTimer = 200; st.flashAlpha = 0.25; st.flashColor = '#FF004030';
        if (st.player.targetPower > st.player.peakPower) st.player.peakPower = st.player.targetPower;
        if (st.player.targetPower <= 0) {
          st.player.targetPower = 0;
          st.gameOver = true;
          const score = calcScore(Math.floor(st.player.peakPower), st.wave);
          saveHighScore(score);
          onDeath(score, st.wave, Math.floor(st.player.peakPower));
          return;
        }
      } else if (g.type === 'mystery') {
        const resolved      = resolveMysterType();
        const resolvedValue = resolved === 'multiply' ? randomFrom([2, 3])
          : resolved === 'add'      ? Math.floor(10 + st.wave * 3)
          : resolved === 'enemy'    ? Math.floor(12 + st.wave * 4)
          : resolved === 'pctEnemy' ? rollPctValue(st.wave)
          : randomFrom([2, 3]);
        st.floats.push({ text: randomFrom(MYSTERY_LINES), x: laneX(1), y: PLAYER_Y / 2, vy: -1, life: 1.2, color: '#CC44FF', big: true });
        applyGateEffect(st, resolved, resolvedValue, gx, gy, onDeath);
      } else if (g.type === 'trap') {
        g.revealed = true;
        applyGateEffect(st, 'trap', g.value, gx, gy, onDeath);
      } else {
        applyGateEffect(st, g.type, g.value, gx, gy, onDeath);
      }
    }

    if (g.y > GAME_HEIGHT + 50) g.alive = false;
  }
  st.gates = st.gates.filter(g => g.alive);

  // Physics tick
  for (const p of st.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.028; }
  st.particles = st.particles.filter(p => p.life > 0);
  for (const f of st.floats) { f.y += f.vy; f.life -= 0.016; }
  st.floats = st.floats.filter(f => f.life > 0);
  for (const s of st.stars) {
    s.y += s.sp * st.scrollSpeed * (dt / 16);
    if (s.y > GAME_HEIGHT) { s.y = -2; s.x = Math.random() * GAME_WIDTH; }
  }
}

