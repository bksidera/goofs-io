import { GAME_WIDTH, GAME_HEIGHT, LANE_COUNT, LANE_OFFSET, LANE_WIDTH, COLORS } from '../game/constants.js';

export function drawBackground(ctx, st) {
  const { frame, scrollSpeed, stars, player, infected, decayVisual } = st;

  // BG gradient — shifts warmer as decay increases
  const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  if (decayVisual > 0.5) {
    const t = (decayVisual - 0.5) * 2;
    bg.addColorStop(0, `rgb(${Math.floor(8 + t * 20)}, 8, 22)`);
    bg.addColorStop(0.5, `rgb(${Math.floor(15 + t * 20)}, 12, 35)`);
    bg.addColorStop(1, `rgb(${Math.floor(22 + t * 18)}, 16, 48)`);
  } else {
    bg.addColorStop(0, COLORS.BG_TOP);
    bg.addColorStop(0.5, COLORS.BG_MID);
    bg.addColorStop(1, COLORS.BG_BOT);
  }
  ctx.fillStyle = bg;
  ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);

  // Stars — dim with high decay
  const starAlphaScale = 1 - decayVisual * 0.6;
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.br * starAlphaScale})`;
    ctx.fillRect(s.x, s.y, 2, 2);
  }

  // Vertical lane dividers
  const gridColor = infected ? '#FF002005' : '#ffffff05';
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= LANE_COUNT; i++) {
    const x = LANE_OFFSET + i * LANE_WIDTH;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke();
  }

  // Scrolling horizontal grid
  const go = (frame * scrollSpeed * 0.3) % 50;
  const hGridColor = infected ? '#FF002003' : '#ffffff03';
  ctx.strokeStyle = hGridColor;
  for (let y = -50 + go; y < GAME_HEIGHT; y += 50) {
    ctx.beginPath();
    ctx.moveTo(LANE_OFFSET, y);
    ctx.lineTo(LANE_OFFSET + LANE_COUNT * LANE_WIDTH, y);
    ctx.stroke();
  }

  // Lane highlight (player's current lane)
  const highlightColor = infected ? '#FF002008' : '#FF2D9506';
  ctx.fillStyle = highlightColor;
  ctx.fillRect(LANE_OFFSET + player.lane * LANE_WIDTH, 0, LANE_WIDTH, GAME_HEIGHT);

  // Decay screen noise (wave 10+)
  if (decayVisual > 0.8) {
    const noiseAlpha = (decayVisual - 0.8) * 0.5 * 0.12;
    ctx.globalAlpha = noiseAlpha;
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#FF2D95' : '#00F0FF';
      ctx.fillRect(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT,
        Math.random() * 4 + 1,
        1,
      );
    }
    ctx.globalAlpha = 1;
  }
}
