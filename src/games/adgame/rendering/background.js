import {
  GAME_WIDTH, GAME_HEIGHT,
  LANE_COUNT, LANE_OFFSET, LANE_WIDTH,
  COLORS, FONT,
} from '../game/constants.js';
import { RAIN_COL_WIDTH, RAIN_GLYPH_SET } from '../game/state.js';

const GLYPH_H = 14;

export function drawBackground(ctx, st) {
  const { frame, rain, scrollSpeed, player, infected, decayVisual } = st;

  // ── Base gradient — black with the faintest green floor ────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  bg.addColorStop(0, COLORS.BG_TOP);
  bg.addColorStop(0.5, COLORS.BG_MID);
  bg.addColorStop(1, COLORS.BG_BOT);
  ctx.fillStyle = bg;
  ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);

  // ── Matrix digital rain ────────────────────────────────────────────────────
  // High waves bleed red through the rain so danger reads at a glance.
  const tintRed   = infected || decayVisual > 0.6;
  const headColor = infected ? '#FF6688' : '#CCFFDD';
  const bodyHue   = tintRed   ? '255, 32,  72' : '0, 255, 65';

  ctx.font = `bold ${GLYPH_H}px ${FONT}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  for (const c of rain) {
    c.y += c.sp * scrollSpeed * 0.55;
    c.mutateTimer -= 1;
    if (c.mutateTimer <= 0) {
      c.mutateTimer = 6 + Math.random() * 18;
      // mutate a single random glyph in the column
      const idx = Math.floor(Math.random() * c.len);
      c.glyphs[idx] = RAIN_GLYPH_SET[Math.floor(Math.random() * RAIN_GLYPH_SET.length)];
    }
    if (c.y - c.len * GLYPH_H > GAME_HEIGHT) {
      c.y = -Math.random() * 80;
      c.sp = 0.6 + Math.random() * 1.6;
      c.brightness = 0.4 + Math.random() * 0.5;
    }

    // Draw column tail-up so the head pixel sits at c.y
    for (let i = 0; i < c.len; i++) {
      const gy = Math.floor(c.y - i * GLYPH_H);
      if (gy < -GLYPH_H || gy > GAME_HEIGHT) continue;
      const t = 1 - i / c.len;             // 1 at head, 0 at tail
      if (i === 0) {
        ctx.fillStyle = headColor;
        ctx.shadowColor = tintRed ? '#FF2D95' : COLORS.GREEN;
        ctx.shadowBlur  = 6;
      } else {
        const alpha = (0.05 + t * 0.85 * c.brightness).toFixed(3);
        ctx.fillStyle = `rgba(${bodyHue}, ${alpha})`;
        ctx.shadowBlur = 0;
      }
      ctx.fillText(c.glyphs[i], c.x, gy);
    }
  }
  ctx.shadowBlur = 0;

  // ── Lane bay: a darker vertical strip behind the playfield ─────────────────
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(LANE_OFFSET, 0, LANE_COUNT * LANE_WIDTH, GAME_HEIGHT);

  // ── Lane dividers (thin neon stripes) ──────────────────────────────────────
  const divColor = infected ? 'rgba(255, 0, 64, 0.35)' : 'rgba(0, 255, 65, 0.25)';
  ctx.strokeStyle = divColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= LANE_COUNT; i++) {
    const x = LANE_OFFSET + i * LANE_WIDTH + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_HEIGHT);
    ctx.stroke();
  }

  // ── Scrolling lane floor lines (sells motion in the lane bay) ──────────────
  const go = (frame * scrollSpeed * 0.45) % 60;
  ctx.strokeStyle = infected ? 'rgba(255, 0, 64, 0.10)' : 'rgba(0, 255, 65, 0.08)';
  for (let y = -60 + go; y < GAME_HEIGHT; y += 60) {
    ctx.beginPath();
    ctx.moveTo(LANE_OFFSET, y);
    ctx.lineTo(LANE_OFFSET + LANE_COUNT * LANE_WIDTH, y);
    ctx.stroke();
  }

  // ── Player lane highlight ──────────────────────────────────────────────────
  const hi = infected ? 'rgba(255, 0, 64, 0.10)' : 'rgba(0, 255, 65, 0.08)';
  ctx.fillStyle = hi;
  ctx.fillRect(LANE_OFFSET + player.lane * LANE_WIDTH, 0, LANE_WIDTH, GAME_HEIGHT);

  // ── Edge fade so the rain bleeds into black at top + bottom ────────────────
  const fade = ctx.createLinearGradient(0, 0, 0, 80);
  fade.addColorStop(0, 'rgba(0,0,0,0.85)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, GAME_WIDTH, 80);

  // High-decay screen noise — keep the existing flavor
  if (decayVisual > 0.8) {
    ctx.globalAlpha = (decayVisual - 0.8) * 0.5 * 0.14;
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? COLORS.RED : COLORS.GREEN;
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
