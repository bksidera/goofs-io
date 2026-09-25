import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants.js';

export function drawEffects(ctx, st) {
  for (const p of st.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (st.stage?.patterns.includes('magnet')) {
    const a = 0.08 + st.consent / 1000;
    const r = 70 + Math.sin(st.frame * 0.05) * 8;
    const g = ctx.createRadialGradient(GAME_WIDTH / 2, 290, 10, GAME_WIDTH / 2, 290, r);
    g.addColorStop(0, `rgba(255, 59, 79, ${a})`);
    g.addColorStop(1, 'rgba(255, 59, 79, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, 290, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (st.flash > 0) {
    ctx.fillStyle = `${st.flashColor}${Math.floor(st.flash * 140).toString(16).padStart(2, '0')}`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}
