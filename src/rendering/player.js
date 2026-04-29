import { PX } from '../game/constants.js';

function px(ctx, x, y, color, size = PX) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

export function drawPlayer(ctx, cx, cy, frame = 0) {
  const s = PX;
  const ox = cx - 7 * s;
  const oy = cy - 12 * s;
  const hc = '#2D5A27', hd = '#1E3D1A', vc = '#00F0FF', fc = '#D2A77A';
  const bc = '#2D5A27', bc2 = '#4A8A42', lc = '#1E3D1A';

  // Helmet
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy, hd, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + s, hc, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + 2 * s, hc, s);

  // Visor
  ctx.shadowColor = vc; ctx.shadowBlur = 8;
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy + 3 * s, vc, s);
  for (let i = 3; i <= 10; i++) px(ctx, ox + i * s, oy + 4 * s, i % 3 === 0 ? '#fff' : vc, s);
  ctx.shadowBlur = 0;

  // Face
  for (let i = 3; i <= 10; i++) px(ctx, ox + i * s, oy + 5 * s, fc, s);
  for (let i = 4; i <= 9;  i++) px(ctx, ox + i * s, oy + 6 * s, fc, s);

  // Body
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy + 7 * s, bc, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + 8 * s, bc, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + 9 * s, i >= 5 && i <= 8 ? bc2 : bc, s);
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy + 10 * s, i >= 5 && i <= 8 ? bc2 : bc, s);

  // Belt
  for (let i = 3; i <= 10; i++) px(ctx, ox + i * s, oy + 11 * s, '#333', s);
  px(ctx, ox + 6 * s, oy + 11 * s, '#FFD700', s);
  px(ctx, ox + 7 * s, oy + 11 * s, '#FFD700', s);

  // Legs (walking bob)
  const bob = Math.sin(frame * 0.15) > 0 ? s : 0;
  for (let i = 3; i <= 5; i++) px(ctx, ox + i * s, oy + 12 * s + bob, lc, s);
  for (let i = 8; i <= 10; i++) px(ctx, ox + i * s, oy + 12 * s - bob, lc, s);
  for (let i = 3; i <= 5; i++) px(ctx, ox + i * s, oy + 13 * s + bob, '#222', s);
  for (let i = 8; i <= 10; i++) px(ctx, ox + i * s, oy + 13 * s - bob, '#222', s);

  // Gun arm
  const gunBob = Math.sin(frame * 0.1) * s * 0.5;
  px(ctx, ox + 12 * s, oy + 7 * s + gunBob, fc, s);
  px(ctx, ox + 13 * s, oy + 7 * s + gunBob, fc, s);
  ctx.shadowColor = '#FF2D95'; ctx.shadowBlur = 4;
  px(ctx, ox + 13 * s, oy + 5 * s + gunBob, '#555', s);
  px(ctx, ox + 13 * s, oy + 6 * s + gunBob, '#555', s);
  px(ctx, ox + 14 * s, oy + 5 * s + gunBob, '#777', s);
  px(ctx, ox + 14 * s, oy + 4 * s + gunBob, '#FF2D95', s);
  ctx.shadowBlur = 0;

  // Antenna
  px(ctx, ox + 10 * s, oy - s, '#555', s);
  px(ctx, ox + 10 * s, oy - 2 * s, '#555', s);
  ctx.shadowColor = '#FF2D95'; ctx.shadowBlur = 6;
  px(ctx, ox + 10 * s, oy - 3 * s, '#FF2D95', s);
  ctx.shadowBlur = 0;
}
