import { LANE_WIDTH, GATE_HEIGHT, PX, FONT, COLORS } from '../game/constants.js';

function px(ctx, x, y, color, size = PX) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

// Returns display color for a gate type (uninfected)
function gateColor(type, revealed) {
  if (type === 'add')                      return COLORS.GREEN;
  if (type === 'enemy')                    return COLORS.RED;
  if (type === 'pctEnemy')                 return '#CC1133';
  if (type === 'mystery')                  return COLORS.PURPLE;
  if (type === 'trap' && revealed)         return COLORS.RED;
  return COLORS.GOLD; // multiply, trap (unrevealed)
}

// Scramble text characters for infection visual
const GLYPHS = '!@#$%^&*<>?/\\|~`';
function scramble(text, seed) {
  return text.split('').map((ch, i) => {
    if (ch === ' ') return ' ';
    return GLYPHS[(seed + i * 7) % GLYPHS.length];
  }).join('');
}

export function drawGate(ctx, cx, cy, text, type, revealed, frame, infected, scrambleActive) {
  const w = LANE_WIDTH - 12, h = GATE_HEIGHT;
  const x = cx - w / 2, y = cy;
  const pulse = 0.6 + Math.sin(frame * 0.08) * 0.3;

  // Infection overrides color to flicker red
  let color;
  if (infected) {
    color = (frame % 8 < 4) ? COLORS.RED : '#FF4060';
  } else {
    color = gateColor(type, revealed);
  }

  // Positional glitch
  const isRevealedTrap = type === 'trap' && revealed;
  const glitchX = isRevealedTrap ? (Math.random() - 0.5) * 4 : 0;
  const eGlitch = (type === 'enemy' && !infected && Math.random() < 0.04) ? (Math.random() - 0.5) * 3 : 0;
  const infGlitch = infected ? (Math.random() - 0.5) * 2 : 0;

  ctx.save();
  ctx.translate(glitchX + eGlitch + infGlitch, 0);

  // Fill
  ctx.fillStyle = color + '18';
  ctx.fillRect(x, y, w, h);

  // Border
  ctx.shadowColor = color;
  ctx.shadowBlur = 10 * pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  if (type === 'multiply' || (type === 'trap' && !revealed) || type === 'mystery') {
    ctx.strokeStyle = color + '44';
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  }
  ctx.shadowBlur = 0;

  // Corner pixels
  const s = PX;
  px(ctx, x + 1,         y + 1,         color + '66', s);
  px(ctx, x + w - s - 1, y + 1,         color + '66', s);
  px(ctx, x + 1,         y + h - s - 1, color + '66', s);
  px(ctx, x + w - s - 1, y + h - s - 1, color + '66', s);

  // Text
  let displayText;
  if (infected && scrambleActive) {
    displayText = scramble(text, frame);
  } else if (isRevealedTrap) {
    displayText = `÷${text.slice(1)}`;
  } else {
    displayText = text;
  }

  ctx.font = `bold 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(displayText, cx, cy + h / 2);
  ctx.shadowBlur = 0;

  ctx.restore();
}
