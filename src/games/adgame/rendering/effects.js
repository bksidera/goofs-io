import { GAME_WIDTH, GAME_HEIGHT, FONT, COLORS } from '../game/constants.js';

export function drawTrail(ctx, trail, accent = COLORS.GREEN) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const t of trail) {
    if (t.life <= 0) continue;
    ctx.globalAlpha = t.life * 0.16;
    ctx.fillStyle = accent;
    const s = 6 + t.life * 6;
    ctx.fillRect(t.x - s / 2, t.y - s / 2, s, s);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Particles v2: rotating shards with additive blending.
export function drawParticles(ctx, particles) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    const s = p.size * (0.5 + p.life * 0.7);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot ?? 0);
    ctx.fillRect(-s / 2, -s / 2, s * 1.6, s * 0.7);
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Floats v2: outlined, pop-in scale, readable at a glance.
export function drawFloats(ctx, floats) {
  for (const f of floats) {
    const alpha = Math.min(1, f.life * 1.4);
    // Pop-in: oversized for the first beats of its life, settles to 1.
    const popT = Math.max(0, f.life - 0.85) / 0.15;
    const scale = 1 + popT * 0.8;
    const size = (f.big ? 15 : 17) * scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(size)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function drawFlash(ctx, flashAlpha, flashColor) {
  if (flashAlpha <= 0) return;
  ctx.globalAlpha = flashAlpha;
  ctx.fillStyle = flashColor;
  ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);
  ctx.globalAlpha = 1;
}

export function drawInfectionClearFlash(ctx, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = COLORS.GREEN;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.globalAlpha = 1;
}

// Red pulse vignette when power is critically low.
export function drawLowPowerVignette(ctx, displayPower, powerCap, frame) {
  const pct = displayPower / Math.max(1, powerCap);
  if (displayPower > 60 && pct > 0.06) return;
  const pulse = 0.16 + Math.sin(frame * 0.18) * 0.08;
  const grad = ctx.createRadialGradient(
    GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.32,
    GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.72,
  );
  grad.addColorStop(0, 'rgba(255, 0, 64, 0)');
  grad.addColorStop(1, `rgba(255, 0, 64, ${pulse})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

export function drawScanlines(ctx, scanOff, extraIntensity = 0) {
  const base = 0x12;
  const boost = Math.floor(extraIntensity * 0x18);
  const hex = (base + boost).toString(16).padStart(2, '0');
  ctx.fillStyle = `#000000${hex}`;
  for (let y = scanOff; y < GAME_HEIGHT; y += 3) ctx.fillRect(0, y, GAME_WIDTH, 1);
}

export function drawGlitch(ctx) {
  try {
    const sh = 8 + Math.random() * 20;
    const sy = Math.floor(Math.random() * (GAME_HEIGHT - sh));
    const id = ctx.getImageData(0, sy, GAME_WIDTH, sh);
    ctx.putImageData(id, (Math.random() - 0.5) * 14, sy);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = COLORS.GREEN;
    ctx.fillRect(0, sy, GAME_WIDTH, sh / 2);
    ctx.fillStyle = COLORS.PINK;
    ctx.fillRect(0, sy + sh / 2, GAME_WIDTH, sh / 2);
    ctx.globalAlpha = 1;
  } catch { /* tainted canvas guard */ }
}

export function drawInfectionOverlay(ctx, frame) {
  const pulse = 0.04 + Math.sin(frame * 0.12) * 0.02;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#FF0020';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.globalAlpha = 1;
}
