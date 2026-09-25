import { COLORS, FONT } from '../game/constants.js';

export function drawHazards(ctx, st) {
  ctx.save();
  ctx.font = `bold 9px ${FONT}`;
  ctx.textAlign = 'left';
  for (const h of st.hazards) {
    ctx.fillStyle = '#FF3B4F28';
    ctx.fillRect(h.x - 4, h.y - 4, h.w + 8, h.h + 8);
    ctx.strokeStyle = '#FF3B4F88';
    ctx.strokeRect(h.x - 4, h.y - 4, h.w + 8, h.h + 8);
    ctx.fillStyle = COLORS.RED;
    ctx.fillText(h.text, h.x, h.y + 9);
  }
  if (st.delayTimer > 0) {
    const w = 238;
    const x = 61;
    const y = 376;
    ctx.fillStyle = '#F4F7F3EE';
    ctx.fillRect(x, y, w, 54);
    ctx.strokeStyle = COLORS.TEAL_DARK;
    ctx.strokeRect(x, y, w, 54);
    ctx.fillStyle = COLORS.INK;
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillText('Saving preferences...', x + 16, y + 22);
    ctx.fillStyle = COLORS.RED;
    ctx.fillRect(x + 16, y + 34, (w - 32) * (st.delayTimer / 1.6), 8);
  }
  ctx.restore();
}
