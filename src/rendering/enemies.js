import { PX } from '../game/constants.js';

function px(ctx, x, y, color, size = PX) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

export function drawEnemy(ctx, cx, cy, variant = 0, frame = 0) {
  const s = PX;
  const ox = cx - 6 * s;
  const oy = cy - 6 * s;
  const palettes = [
    { main: '#FF0040', dark: '#AA0030', eye: '#fff' },
    { main: '#CC0033', dark: '#880022', eye: '#FFD700' },
    { main: '#FF1050', dark: '#BB0040', eye: '#00F0FF' },
  ];
  const c = palettes[variant % 3];
  const bob = Math.sin(frame * 0.2 + variant) * s * 0.5;

  for (let i = 2; i <= 9; i++)  px(ctx, ox + i * s, oy + bob, c.dark, s);
  for (let i = 1; i <= 10; i++) px(ctx, ox + i * s, oy + s + bob, c.main, s);
  for (let i = 1; i <= 10; i++) px(ctx, ox + i * s, oy + 2 * s + bob, c.main, s);
  for (let i = 1; i <= 10; i++) px(ctx, ox + i * s, oy + 3 * s + bob, c.main, s);
  for (let i = 2; i <= 9; i++)  px(ctx, ox + i * s, oy + 4 * s + bob, c.main, s);
  for (let i = 3; i <= 8; i++)  px(ctx, ox + i * s, oy + 5 * s + bob, c.dark, s);

  // Mohawk
  px(ctx, ox + 4 * s, oy - s + bob, c.eye, s);
  px(ctx, ox + 5 * s, oy - s + bob, c.eye, s);
  px(ctx, ox + 6 * s, oy - s + bob, c.eye, s);
  px(ctx, ox + 5 * s, oy - 2 * s + bob, c.eye, s);

  // Eyes
  ctx.shadowColor = c.eye; ctx.shadowBlur = 4;
  px(ctx, ox + 3 * s, oy + 2 * s + bob, c.eye, s);
  px(ctx, ox + 4 * s, oy + 2 * s + bob, '#000', s);
  px(ctx, ox + 7 * s, oy + 2 * s + bob, c.eye, s);
  px(ctx, ox + 8 * s, oy + 2 * s + bob, '#000', s);
  ctx.shadowBlur = 0;

  // Brows
  px(ctx, ox + 2 * s, oy + s + bob, '#000', s);
  px(ctx, ox + 3 * s, oy + s + bob, '#000', s);
  px(ctx, ox + 7 * s, oy + s + bob, '#000', s);
  px(ctx, ox + 9 * s, oy + s + bob, '#000', s);

  // Mouth
  for (let i = 4; i <= 7; i++) px(ctx, ox + i * s, oy + 4 * s + bob, '#000', s);
}
