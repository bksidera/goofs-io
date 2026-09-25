import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT } from '../game/constants.js';

function bar(ctx, x, y, w, h, pct, fill, label) {
  ctx.fillStyle = '#00000055';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#FFFFFF55';
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 2, y + 2, Math.max(0, w - 4) * pct, h - 4);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold 9px ${FONT}`;
  ctx.fillText(label, x, y - 4);
}

export function drawHUD(ctx, st) {
  ctx.save();
  ctx.fillStyle = '#07100FEE';
  ctx.fillRect(0, 0, GAME_WIDTH, 74);
  ctx.fillRect(0, GAME_HEIGHT - 62, GAME_WIDTH, 62);

  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.TEAL;
  const stageLabel = st.mode === 'endless' ? 'AUTO-RENEWAL' : `${st.stageIndex + 1}/7 ${st.stage?.name ?? ''}`;
  ctx.fillText(stageLabel, 14, 20);
  ctx.fillStyle = '#FFFFFFAA';
  ctx.fillText(`SCORE ${Math.floor(st.score).toLocaleString()}`, 14, 42);

  bar(ctx, 178, 18, 72, 10, st.patience / 100, COLORS.GOLD, 'PATIENCE');
  bar(ctx, 266, 18, 72, 10, st.consent / 100, COLORS.RED, 'CONSENT');

  ctx.fillStyle = COLORS.TEAL;
  ctx.font = `bold 13px ${FONT}`;
  const req = st.required === Infinity ? '∞' : st.required;
  ctx.fillText(`REJECTIONS ${st.rejections}/${req}`, 14, GAME_HEIGHT - 37);
  ctx.fillStyle = st.timeLeft < 8 ? COLORS.RED : '#FFFFFFAA';
  const time = st.mode === 'endless' ? `${Math.floor(st.elapsed)}s` : `${Math.ceil(st.timeLeft)}s`;
  ctx.fillText(time, 274, GAME_HEIGHT - 37);

  ctx.fillStyle = '#FFFFFF99';
  ctx.font = `10px ${FONT}`;
  const notice = st.notice || 'Decline everything.';
  ctx.fillText(notice.slice(0, 52), 14, GAME_HEIGHT - 15);
  ctx.restore();
}
