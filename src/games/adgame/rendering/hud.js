import { GAME_WIDTH, GAME_HEIGHT, FONT } from '../game/constants.js';
import { clamp } from '../utils/helpers.js';
import { TUTORIAL_LINES } from '../copy/banks.js';

// Power display color: scales with % of the level cap now that one exists.
function powerColor(dp, cap, frame) {
  const pct = dp / Math.max(1, cap);
  if (pct >= 0.999) {
    const hue = (frame * 3) % 360;
    return `hsl(${hue}, 100%, 65%)`; // pinned at cap: rainbow shimmer
  }
  if (pct > 0.6) return '#FFD700';
  if (pct > 0.25) return '#00FF41';
  if (dp < 40) return '#FF0040';
  return '#fff';
}

export function drawHUD(ctx, st, cfg) {
  const { player, combo, showTut, tutIdx, waveMsg, waveMsgTimer, frame } = st;
  const dp = Math.round(player.displayPower);
  const cap = cfg.powerCap;
  const pc = powerColor(dp, cap, frame);

  // ── Power number ───────────────────────────────────────────────────────────
  const fs = dp > 9999 ? 26 : dp > 999 ? 30 : 36;
  ctx.font = `bold ${fs}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = pc; ctx.shadowBlur = 15;
  ctx.fillStyle = pc;
  const atCap = dp >= cap;
  const glitchOff = atCap && frame % 30 < 3 ? (Math.random() - 0.5) * 4 : 0;
  ctx.fillText(dp.toLocaleString(), GAME_WIDTH / 2 + glitchOff, 34);
  ctx.shadowBlur = 0;

  // ── Power bar (the cap makes a bar meaningful) ─────────────────────────────
  const bw = 170;
  const bx = (GAME_WIDTH - bw) / 2;
  const by = 52;
  const pct = clamp(dp / cap, 0, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(bx, by, bw, 6);
  ctx.fillStyle = pc;
  ctx.shadowColor = pc; ctx.shadowBlur = 6;
  ctx.fillRect(bx, by, bw * pct, 6);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, 7);

  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = '#555';
  ctx.textAlign = 'center';
  ctx.fillText(atCap ? 'POWER (MAXED — OVERFLOW → SCORE)' : 'POWER', GAME_WIDTH / 2, by + 14);

  // Decay indicator
  if (cfg.decayPct > 0 && st.levelPhase === 'running') {
    const drain = Math.max(cfg.decayFloor, dp * (cfg.decayPct / 100));
    const drainAlpha = 0.5 + Math.sin(frame * 0.2) * 0.3;
    ctx.globalAlpha = drainAlpha;
    ctx.font = `bold 9px ${FONT}`;
    ctx.fillStyle = '#FF4444';
    ctx.fillText(`▼ ${Math.ceil(drain)}/s`, GAME_WIDTH / 2, by + 26);
    ctx.globalAlpha = 1;
  }

  // ── Level tag (top-left, in the level's accent) ────────────────────────────
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillStyle = cfg.accent;
  ctx.textAlign = 'left';
  ctx.shadowColor = cfg.accent; ctx.shadowBlur = 6;
  ctx.fillText(st.mode === 'endless' ? '∞ SCROLL' : `AD ${cfg.n}/9`, 10, 16);
  ctx.shadowBlur = 0;

  // ── Score (top-right) ──────────────────────────────────────────────────────
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillStyle = '#FF2D95';
  ctx.textAlign = 'right';
  ctx.shadowColor = '#FF2D95'; ctx.shadowBlur = 5;
  ctx.fillText(`SCORE ${st.score.toLocaleString()}`, GAME_WIDTH - 28, 16);
  ctx.shadowBlur = 0;

  // Combo (under score)
  if (combo >= 2) {
    ctx.font = `bold 11px ${FONT}`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 5;
    ctx.fillText(`×${combo} COMBO`, GAME_WIDTH - 10, 32);
    ctx.shadowBlur = 0;
  }

  // Tutorial text
  if (showTut && tutIdx < TUTORIAL_LINES.length) {
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#00F0FF';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.7;
    ctx.fillText(TUTORIAL_LINES[tutIdx], GAME_WIDTH / 2, GAME_HEIGHT - 50);
    ctx.globalAlpha = 1;
  }

  // Wave/level message
  if (waveMsgTimer > 0) {
    ctx.globalAlpha = clamp(waveMsgTimer / 600, 0, 1);
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = cfg.accent;
    ctx.textAlign = 'center';
    ctx.shadowColor = cfg.accent; ctx.shadowBlur = 10;
    ctx.fillText(waveMsg, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Fake ad chrome footer
  ctx.font = `8px ${FONT}`;
  ctx.fillStyle = '#2a2a2a';
  ctx.textAlign = 'left';
  ctx.fillText(`${cfg.sponsor ?? 'Sponsored'}`, 8, GAME_HEIGHT - 8);

  // FTC easter egg
  if (st.score > 5000) {
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'right';
    ctx.fillText('THE FTC WOULD LIKE A WORD', GAME_WIDTH - 8, GAME_HEIGHT - 8);
  }

  // INFECTED label
  if (st.infected) {
    const pulse = 0.6 + Math.sin(frame * 0.2) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.font = `bold 10px ${FONT}`;
    ctx.fillStyle = '#FF0040';
    ctx.textAlign = 'left';
    ctx.fillText('☣ INFECTED', 10, 32);
    ctx.globalAlpha = 1;
  }
}
