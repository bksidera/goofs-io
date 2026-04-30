import { OBJECT_SIZE, PX, FONT, COLORS } from '../game/constants.js';
import { drawEnemy } from './enemies.js';

// ── Pixel helpers ────────────────────────────────────────────────────────────
function px(ctx, x, y, color, size = PX) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

function paintRows(ctx, ox, oy, rows, palette) {
  const s = PX;
  for (let ry = 0; ry < rows.length; ry++) {
    const r = rows[ry];
    for (let i = 0; i < r.length; i++) {
      const ch = r[i];
      if (ch === '.') continue;
      const c = palette[ch];
      if (!c) continue;
      px(ctx, ox + i * s, oy + ry * s, c, s);
    }
  }
}

// ── Glyph scramble for infection text overlay ────────────────────────────────
const GLYPHS = '!@#$%^&*<>?/\\|~`';
function scramble(text, seed) {
  return text.split('').map((ch, i) => {
    if (ch === ' ') return ' ';
    return GLYPHS[(seed + i * 7) % GLYPHS.length];
  }).join('');
}

// ── Sprites ──────────────────────────────────────────────────────────────────

// Pixel pistol — green plasma. 12×6 pixel art, points sideways down the lane.
const GUN_PISTOL = [
  '....bbbbbb..',
  '...bMMMMMbb.',
  'bbbbMMMMMMMb',
  'bGGbMMMmmmmb',
  '.bbbbMmmmm..',
  '...bb.bbb...',
];

// Stubby SMG — slightly bigger, two-tone receiver
const GUN_SMG = [
  '..bbbbbbbbb.',
  '.bMMMMMMMMMb',
  'bMMMMMMmmmMb',
  'bGGMMMmmmmmb',
  '.bbbMMmmmm..',
  '....bb.bb...',
];

const GUN_PAL = {
  M: '#3A3A48',  // metal body
  m: '#1F1F28',  // metal shadow
  b: '#0A0A12',  // outline
  G: COLORS.GREEN, // muzzle glow accent
};

function drawGun(ctx, cx, cy, frame, variant) {
  const s = PX;
  const sprite = variant % 2 === 0 ? GUN_PISTOL : GUN_SMG;
  const w = sprite[0].length * s;
  const h = sprite.length * s;
  const ox = Math.floor(cx - w / 2);
  const oy = Math.floor(cy - h / 2);

  // Floor halo so it reads as "collectible"
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
  grad.addColorStop(0, 'rgba(0, 255, 65, 0.35)');
  grad.addColorStop(1, 'rgba(0, 255, 65, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - 30, cy - 18, 60, 36);
  ctx.restore();

  // Idle bob + slow rotation feel via vertical hover offset
  const hover = Math.sin(frame * 0.12 + cx) * 1.5;

  ctx.save();
  ctx.shadowColor = COLORS.GREEN;
  ctx.shadowBlur = 8;
  paintRows(ctx, ox, oy + hover, sprite, GUN_PAL);
  ctx.shadowBlur = 0;

  // Muzzle flash spark
  if (frame % 20 < 4) {
    ctx.shadowColor = COLORS.GREEN; ctx.shadowBlur = 6;
    px(ctx, ox - 2 * s, oy + 3 * s + hover, '#CCFFDD', s);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// Golden data cube — pulsing, glowing, the chef's kiss reward
function drawCube(ctx, cx, cy, frame) {
  const s = PX;
  const pulse = 0.7 + Math.sin(frame * 0.18) * 0.3;
  const wobble = Math.sin(frame * 0.1) * 1.5;

  // Floor halo
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 32);
  grad.addColorStop(0, `rgba(255, 215, 0, ${0.45 * pulse})`);
  grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - 34, cy - 22, 68, 44);
  ctx.restore();

  // Cube body — 14×12 grid, all rows exactly 14 cells
  const rows = [
    '...bbbbbbbb...',
    '..bGGGGGGGGb..',
    '.bGYYYYYYYYGb.',
    'bGYHYYYYYYHYGb',
    'bGYHYYYYYYHYGb',
    'bGYYYYYYYYYYGb',
    'bGYYYHYYHYYYGb',
    'bGYYYHHHHYYYGb',
    'bGYYYYYYYYYYGb',
    '.bGYYYYYYYYGb.',
    '..bGGGGGGGGb..',
    '...bbbbbbbb...',
  ];
  const pal = {
    G: '#FFE680',  // bright highlight
    Y: COLORS.GOLD,
    H: '#FFFFFF',  // glare highlights
    b: '#7A5A00',  // outline
  };
  const w = rows[0].length * s;
  const h = rows.length * s;
  const ox = Math.floor(cx - w / 2);
  const oy = Math.floor(cy - h / 2 + wobble);

  ctx.save();
  ctx.shadowColor = COLORS.GOLD;
  ctx.shadowBlur = 14 * pulse;
  paintRows(ctx, ox, oy, rows, pal);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Sparkle dots — orbit
  const sparkleAngle = frame * 0.06;
  for (let k = 0; k < 3; k++) {
    const a = sparkleAngle + (k * Math.PI * 2) / 3;
    const sx = cx + Math.cos(a) * 22;
    const sy = cy + Math.sin(a) * 22;
    ctx.save();
    ctx.shadowColor = COLORS.GOLD; ctx.shadowBlur = 6;
    px(ctx, sx, sy, '#FFFFFF', 2);
    ctx.restore();
  }
}

// Trap revealed — bomb / skull. Only seen for one frame at collision.
function drawBomb(ctx, cx, cy, frame) {
  const s = PX;
  const flicker = frame % 6 < 3 ? '#FF4060' : COLORS.RED;
  const rows = [
    '....rrrrrr....',
    '...rRRRRRRr...',
    '..rRwwRRwwRr..',
    '..rRwXRRXwRr..',  // skull eyes
    '..rRRRRRRRRr..',
    '..rRRwwwwRRr..',  // teeth
    '..rRwXwXwXRr..',
    '...rRRRRRRr...',
    '....rrrrrr....',
  ];
  const pal = {
    R: flicker,
    r: '#660018',
    w: '#FFFFFF',
    X: '#000000',
  };
  const w = rows[0].length * s;
  const h = rows.length * s;
  const ox = Math.floor(cx - w / 2);
  const oy = Math.floor(cy - h / 2);
  ctx.save();
  ctx.shadowColor = COLORS.RED; ctx.shadowBlur = 16;
  paintRows(ctx, ox, oy, rows, pal);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// Mystery — glitching ?-box
function drawMystery(ctx, cx, cy, frame) {
  const s = PX;
  const tick = Math.floor(frame / 4) % 4;
  const symbols = ['?', '?', '!', '?'];
  const ch = symbols[tick];
  const wobble = Math.sin(frame * 0.2) * 1;
  const jitter = (frame % 9 === 0) ? (Math.random() - 0.5) * 4 : 0;

  // Box body
  const rows = [
    'bbbbbbbbbbbb',
    'bPPPPPPPPPPb',
    'bPPPPPPPPPPb',
    'bPPPPPPPPPPb',
    'bPPPPPPPPPPb',
    'bPPPPPPPPPPb',
    'bPPPPPPPPPPb',
    'bPPPPPPPPPPb',
    'bPPPPPPPPPPb',
    'bbbbbbbbbbbb',
  ];
  const pal = { P: '#3A1B5C', b: COLORS.PURPLE };
  const w = rows[0].length * s;
  const h = rows.length * s;
  const ox = Math.floor(cx - w / 2 + jitter);
  const oy = Math.floor(cy - h / 2 + wobble);

  ctx.save();
  ctx.shadowColor = COLORS.PURPLE; ctx.shadowBlur = 12;
  paintRows(ctx, ox, oy, rows, pal);
  ctx.shadowBlur = 0;

  // Big ? glyph
  ctx.font = `bold 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = COLORS.PURPLE; ctx.shadowBlur = 8;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(ch, cx + jitter, cy + wobble);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Value badge ──────────────────────────────────────────────────────────────
// Small floating tag below the object so the player can plan.
function drawValueBadge(ctx, cx, cyBottom, text, color) {
  ctx.save();
  ctx.font = `bold 11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  const w = ctx.measureText(text).width + 8;
  ctx.fillRect(cx - w / 2, cyBottom + 2, w, 14);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - w / 2 + 0.5, cyBottom + 2.5, w - 1, 13);
  ctx.shadowColor = color; ctx.shadowBlur = 4;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cyBottom + 4);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Public dispatcher ────────────────────────────────────────────────────────
//
// Single entry point used by GameScreen. Dispatches by object type and renders
// the corresponding sprite + value badge. Mirrors the old drawGate signature
// so the call site barely changes.
//
//   ctx, cx        — lane center x
//   yTop           — object top-edge y (matches g.y in logic)
//   text           — "+42", "×3", "-12", "?", etc.
//   type           — 'add' | 'multiply' | 'enemy' | 'pctEnemy' | 'trap' | 'mystery'
//   revealed       — trap-only flag; show as bomb when true
//   frame          — global frame counter (for animation)
//   infected       — if true, every object reads as danger
//   scrambleActive — overlay scrambled text on infected objects
//   variant        — small int for sprite variation (gun style, drone palette, etc.)

export function drawGate(ctx, cx, yTop, text, type, revealed, frame, infected, scrambleActive, variant = 0) {
  const cy = yTop + OBJECT_SIZE / 2;

  // Render sprite per type
  if (type === 'enemy' || type === 'pctEnemy') {
    drawEnemy(ctx, cx, cy, type === 'pctEnemy' ? 2 : variant, frame);
  } else if (type === 'add') {
    drawGun(ctx, cx, cy, frame, variant);
  } else if (type === 'multiply') {
    drawCube(ctx, cx, cy, frame);
  } else if (type === 'trap') {
    if (revealed) drawBomb(ctx, cx, cy, frame);
    else          drawCube(ctx, cx, cy, frame);   // identical to multiply until hit
  } else if (type === 'mystery') {
    drawMystery(ctx, cx, cy, frame);
  }

  // Value badge below the sprite
  let badgeText = text;
  let badgeColor = COLORS.GREEN;
  if (type === 'add')              badgeColor = COLORS.GREEN;
  else if (type === 'multiply')    badgeColor = COLORS.GOLD;
  else if (type === 'trap')        badgeColor = revealed ? COLORS.RED : COLORS.GOLD; // lies until hit
  else if (type === 'enemy')       badgeColor = COLORS.RED;
  else if (type === 'pctEnemy')    badgeColor = COLORS.RED;
  else if (type === 'mystery')     badgeColor = COLORS.PURPLE;

  // Trap shows ×N (same as multiply) until reveal — reveal is too brief to draw
  if (type === 'trap' && !revealed) badgeText = `×${String(text).replace(/^[×÷]/, '')}`;

  if (infected && scrambleActive) {
    badgeText = scramble(String(badgeText), frame);
    badgeColor = COLORS.RED;
  }

  drawValueBadge(ctx, cx, yTop + OBJECT_SIZE - 4, badgeText, badgeColor);
}
