import { COLORS } from '../game/constants.js';

export function drawCursor(ctx, st) {
  const { x, y } = st.cursor;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.WHITE;
  ctx.strokeStyle = st.consent > 70 ? COLORS.RED : COLORS.INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 30);
  ctx.lineTo(8, 23);
  ctx.lineTo(14, 37);
  ctx.lineTo(21, 34);
  ctx.lineTo(15, 21);
  ctx.lineTo(25, 21);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = st.consent > 55 ? COLORS.RED : COLORS.TEAL;
  ctx.fillRect(2, 2, 4, 4);
  ctx.restore();
}
