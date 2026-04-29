import { GAME_WIDTH, GAME_HEIGHT, FONT } from '../game/constants.js';

export function drawTrail(ctx, trail) {
  for (const t of trail) {
    if (t.life <= 0) continue;
    ctx.globalAlpha = t.life * 0.12;
    ctx.fillStyle = '#FF2D95';
    ctx.fillRect(t.x - 4, t.y - 4, 8, 8);
  }
  ctx.globalAlpha = 1;
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

export function drawFloats(ctx, floats) {
  for (const f of floats) {
    ctx.globalAlpha = Math.min(1, f.life * 1.4);
    ctx.fillStyle = f.color;
    ctx.font = f.big ? `bold 13px ${FONT}` : `bold 16px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 8;
    ctx.fillText(f.text, f.x, f.y);
    ctx.shadowBlur = 0;
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
  ctx.fillStyle = '#39FF14';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.globalAlpha = 1;
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
    ctx.fillStyle = '#FF2D95';
    ctx.fillRect(0, sy, GAME_WIDTH, sh / 2);
    ctx.fillStyle = '#00F0FF';
    ctx.fillRect(0, sy + sh / 2, GAME_WIDTH, sh / 2);
    ctx.globalAlpha = 1;
  } catch { /* tainted canvas guard */ }
}

export function drawInfectionOverlay(ctx, frame) {
  // Subtle red CRT static tint over lanes
  const pulse = 0.04 + Math.sin(frame * 0.12) * 0.02;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#FF0020';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.globalAlpha = 1;
}

export function drawMuzzleFlash(ctx, playerLaneX, frame) {
  if (frame % 12 >= 3) return;
  const mx = playerLaneX + 14 * 3 - 7 * 3;
  const my = 540 - 12 * 3 + 3 * 3;  // PLAYER_Y and PX inlined to avoid circular import
  ctx.shadowColor = '#FF2D95'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#FF2D95'; ctx.fillRect(mx + 14 * 3, my, 3 * 2, 3);
  ctx.fillStyle = '#fff';     ctx.fillRect(mx + 14 * 3, my + 3, 3, 3);
  ctx.shadowBlur = 0;
}
