import { GAME_WIDTH, GAME_HEIGHT, HEADER_H, FOOTER_H } from './constants.js';
import { actionables } from './state.js';
import { clamp } from '../utils/helpers.js';
import { advanceAfterClear, applyAction, maybeFail, punish, tickPatterns } from './patterns.js';

function moveCursor(st, dtSecs) {
  const speed = 260;
  let dx = 0;
  let dy = 0;
  if (st.keys.ArrowLeft || st.keys.a) dx -= 1;
  if (st.keys.ArrowRight || st.keys.d) dx += 1;
  if (st.keys.ArrowUp || st.keys.w) dy -= 1;
  if (st.keys.ArrowDown || st.keys.s) dy += 1;
  if (dx || dy) {
    const mag = Math.hypot(dx, dy);
    st.cursor.tx = st.cursor.x + (dx / mag) * speed * dtSecs;
    st.cursor.ty = st.cursor.y + (dy / mag) * speed * dtSecs;
  }
  st.cursor.x += (st.cursor.tx - st.cursor.x) * Math.min(1, dtSecs * 18);
  st.cursor.y += (st.cursor.ty - st.cursor.y) * Math.min(1, dtSecs * 18);
  st.cursor.x = clamp(st.cursor.x, 8, GAME_WIDTH - 8);
  st.cursor.y = clamp(st.cursor.y, HEADER_H + 8, GAME_HEIGHT - FOOTER_H - 8);
}

function tickParticles(st, dtSecs) {
  for (const p of st.particles) {
    p.x += p.vx * dtSecs * 60;
    p.y += p.vy * dtSecs * 60;
    p.vy += 0.11;
    p.life -= dtSecs * 1.8;
  }
  st.particles = st.particles.filter(p => p.life > 0);
}

function tickMovingButtons(st, dtSecs) {
  for (const b of st.buttons) {
    if (!b.alive) continue;
    if (b.vx || b.vy) {
      b.x += b.vx * dtSecs;
      b.y += b.vy * dtSecs;
      if (b.x < 10 || b.x + b.w > GAME_WIDTH - 10) b.vx *= -1;
      if (b.y < HEADER_H + 20 || b.y + b.h > GAME_HEIGHT - FOOTER_H - 10) b.vy *= -1;
      b.x = clamp(b.x, 10, GAME_WIDTH - b.w - 10);
      b.y = clamp(b.y, HEADER_H + 20, GAME_HEIGHT - FOOTER_H - b.h - 10);
    }
  }
  const vendors = st.buttons.filter(b => b.id.startsWith('vendor-') && b.alive);
  if (vendors.length > 6) vendors.slice(0, vendors.length - 6).forEach(b => { b.alive = false; });
  st.buttons = st.buttons.filter(b => b.alive);
  st.modals = st.modals.filter(m => m.alive);
}

export function tickLogic(st, dt, hooks = {}) {
  if (st.dead || st.paused) return;
  const dtSecs = Math.min(dt, 50) / 1000;
  st.frame++;
  st.elapsed += dtSecs;
  st.shake = Math.max(0, st.shake - dtSecs * 1.8);
  st.flash = Math.max(0, st.flash - dtSecs * 1.8);

  moveCursor(st, dtSecs);
  tickParticles(st, dtSecs);

  if (st.phase === 'intro') {
    st.phaseTimer -= dtSecs;
    if (st.phaseTimer <= 0) st.phase = 'running';
    hooks.setOverlay?.(actionables(st));
    return;
  }

  if (st.phase === 'clear') {
    st.phaseTimer -= dtSecs;
    if (st.phaseTimer <= 0) advanceAfterClear(st);
    hooks.setOverlay?.(actionables(st));
    return;
  }

  if (st.phase !== 'running') return;

  st.timeLeft -= dtSecs;
  const pressure = st.mode === 'endless' ? 0.85 + st.elapsed * 0.004 : 0.7 + st.stage.corruption * 1.2;
  st.patience -= dtSecs * pressure;
  st.consent += dtSecs * (0.25 + st.stage.corruption * 0.7 + Math.max(0, st.modals.length - 1) * 0.22);

  tickPatterns(st, dtSecs);
  tickMovingButtons(st, dtSecs);

  if (st.delayTimer > 0 && st.keys.Escape) {
    st.delayTimer = 0;
    st.notice = 'Saving interrupted. Rude, but effective.';
  }

  maybeFail(st);
  hooks.setOverlay?.(actionables(st));
  if (st.dead) hooks.onDone?.();
}

export function setCursorTarget(st, x, y) {
  st.cursor.tx = clamp(x, 8, GAME_WIDTH - 8);
  st.cursor.ty = clamp(y, HEADER_H + 8, GAME_HEIGHT - FOOTER_H - 8);
}

export function pressNearest(st) {
  const candidates = [
    ...st.modals.map(m => ({ type: 'modalClose', id: m.id, x: m.x + m.w - 12, y: m.y + 12 })),
    ...st.buttons.map(b => ({ type: 'button', id: b.id, x: b.x + b.w / 2, y: b.y + b.h / 2 })),
    ...st.toggles.filter(t => t.on).map(t => ({ type: 'toggle', id: t.id, x: t.x + t.w - 20, y: t.y + t.h / 2 })),
  ];
  let best = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = Math.hypot(st.cursor.x - c.x, st.cursor.y - c.y);
    if (d < bestD) { best = c; bestD = d; }
  }
  if (best) applyAction(st, best);
}

export { applyAction, punish };
