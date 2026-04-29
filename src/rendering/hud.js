import { GAME_WIDTH, GAME_HEIGHT, FONT } from '../game/constants.js';
import { clamp } from '../utils/helpers.js';
import { TUTORIAL_LINES } from '../copy/banks.js';

// Power display color: white → cyan → gold → rainbow shimmer → glitch
function powerColor(dp, frame) {
  if (dp > 100000) {
    const hue = (frame * 3) % 360;
    return `hsl(${hue}, 100%, 65%)`;
  }
  if (dp > 10000) return '#FFD700';
  if (dp > 1000)  return '#FFD700';
  if (dp > 200)   return '#00F0FF';
  if (dp < 30)    return '#FF0040';
  return '#fff';
}

export function drawHUD(ctx, st) {
  const { player, wave, combo, showTut, tutIdx, waveMsg, waveMsgTimer, decayRate, frame } = st;
  const dp = Math.round(player.displayPower);
  const pc = powerColor(dp, frame);

  // Power number
  const fs = dp > 99999 ? 22 : dp > 9999 ? 26 : dp > 999 ? 30 : 36;
  ctx.font = `bold ${fs}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = pc; ctx.shadowBlur = 15;
  ctx.fillStyle = pc;

  // Glitch offset at extreme power
  const glitchOff = dp > 100000 && frame % 30 < 3 ? (Math.random() - 0.5) * 4 : 0;
  ctx.fillText(dp.toLocaleString(), GAME_WIDTH / 2 + glitchOff, 38);
  ctx.shadowBlur = 0;

  ctx.font = `9px ${FONT}`;
  ctx.fillStyle = '#555';
  ctx.fillText('POWER', GAME_WIDTH / 2, 56);

  // Decay indicator (wave 4+)
  if (decayRate > 0) {
    const drainAlpha = 0.5 + Math.sin(frame * 0.2) * 0.3;
    ctx.globalAlpha = drainAlpha;
    ctx.font = `bold 9px ${FONT}`;
    ctx.fillStyle = '#FF4444';
    ctx.textAlign = 'center';
    ctx.fillText(`▼ ${decayRate}/s`, GAME_WIDTH / 2, 68);
    ctx.globalAlpha = 1;
  }

  // Wave (top-left)
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillStyle = '#FF2D95';
  ctx.textAlign = 'left';
  ctx.fillText(`WAVE ${wave}`, 10, 16);

  // Combo (top-right)
  if (combo >= 2) {
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 5;
    ctx.fillText(`×${combo} COMBO`, GAME_WIDTH - 10, 16);
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

  // Wave message
  if (waveMsgTimer > 0) {
    ctx.globalAlpha = clamp(waveMsgTimer / 600, 0, 1);
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = '#FF2D95';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF2D95'; ctx.shadowBlur = 10;
    ctx.fillText(waveMsg, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // FTC easter egg
  if (dp > 1000) {
    ctx.font = `8px ${FONT}`;
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
