import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../game/constants.js';

export function drawBackground(ctx, st) {
  const c = st.stage?.corruption ?? 0;
  const g = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  g.addColorStop(0, c < 0.5 ? '#EAF4EF' : '#0A1413');
  g.addColorStop(1, c < 0.5 ? '#C9DCD5' : '#050807');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = c < 0.45 ? '#FFFFFFAA' : '#FFFFFF10';
  for (let y = 96; y < 560; y += 26) {
    const off = Math.sin(st.frame * 0.02 + y) * c * 18;
    ctx.fillRect(26 + off, y, 308 - c * 70, 8);
  }

  ctx.strokeStyle = c < 0.5 ? '#9EBBB3' : '#4DE1C144';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 88, GAME_WIDTH - 36, 466);

  ctx.font = `bold 12px ${FONT}`;
  ctx.fillStyle = c < 0.5 ? COLORS.INK : '#BFFFEF';
  ctx.textAlign = 'left';
  ctx.fillText('PREFERENCE CENTER', 28, 108);

  if (c > 0.25) {
    ctx.fillStyle = `rgba(255, 59, 79, ${0.04 + c * 0.08})`;
    for (let i = 0; i < 6; i++) {
      const x = (i * 73 + st.frame * (0.3 + c)) % (GAME_WIDTH + 80) - 80;
      ctx.fillRect(x, 120 + i * 62, 150, 18);
    }
  }

  if (c > 0.4) {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.12 + c * 0.12})`;
    for (let y = 0; y < GAME_HEIGHT; y += 3) ctx.fillRect(0, y, GAME_WIDTH, 1);
  }
}
