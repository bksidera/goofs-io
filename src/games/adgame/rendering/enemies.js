import { PX } from '../game/constants.js';

// Sentinel drone: round chassis, single red glowing eye, two rotors flanking,
// short antenna up top, turret slung underneath. Faces the player.
//
// 16 cells wide × 11 cells tall sprite (rotors live outside the sprite grid).
// Origin (cx, cy) is the drone's geometric center.

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

const PALETTES = [
  { body: '#3A3A48', shade: '#222230', rim: '#5A5A70', eye: '#FF0040', glow: '#FF6688', accent: '#00F0FF' },
  { body: '#48383A', shade: '#2A1E20', rim: '#6A4A50', eye: '#FF2040', glow: '#FF8899', accent: '#FFD700' },
  { body: '#5A2030', shade: '#3A1018', rim: '#80303A', eye: '#FF0040', glow: '#FF6688', accent: '#FF2D95' },
];

// 16 cells wide. Center is between cells 7 and 8.
// E = eye well   T = turret slot (drawn separately so glow stacks)
const CHASSIS = [
  '....DDDDDDDD....',
  '...DddddddddD...',
  '..DddbbbbbbbdD..',
  '.DdbbbbbbbbbbdD.',
  'DdbbsEEEEEEsbbdD',  // eye row (E placeholders, painted later)
  'DdbbsEEEEEEsbbdD',
  'DdbbbbbbbbbbbbdD',
  'DdbbbbsbbsbbbbdD',  // mid detail
  '.DdbbbbbbbbbbdD.',
  '..DdbbbTTbbbdD..',  // turret notch
  '...DDdddddddDD..',
];

export function drawEnemy(ctx, cx, cy, variant = 0, frame = 0) {
  const s = PX;
  const p = PALETTES[variant % 3];
  const w = 16 * s;
  const h = 11 * s;
  const ox = Math.floor(cx - w / 2);
  const oy = Math.floor(cy - h / 2);
  const bob = Math.sin(frame * 0.22 + variant) * s * 0.5;

  // Underbelly shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h / 2 + 4, 16, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Spinning rotor blurs — flanking the chassis
  const rotorPhase = (frame * 0.7) % 4;
  ctx.fillStyle = 'rgba(220, 240, 255, 0.5)';
  for (let i = 0; i < 6; i++) {
    const off = (i * 2 - 5) * s;
    ctx.fillRect(ox - 4 * s + off + rotorPhase, oy + 3 * s + bob, s, 1);
    ctx.fillRect(ox + 16 * s + off - rotorPhase, oy + 3 * s + bob, s, 1);
  }

  // Rotor mounts
  px(ctx, ox - 2 * s, oy + 3 * s + bob, p.shade, s);
  px(ctx, ox - s,     oy + 3 * s + bob, p.rim,   s);
  px(ctx, ox + 16 * s, oy + 3 * s + bob, p.shade, s);
  px(ctx, ox + 17 * s, oy + 3 * s + bob, p.rim,   s);

  // Antenna with blinking accent dot (centered above chassis)
  const antX = ox + 8 * s;
  px(ctx, antX, oy - 2 * s + bob, p.shade, s);
  px(ctx, antX, oy - s + bob, p.rim, s);
  if (frame % 30 < 15) {
    ctx.shadowColor = p.accent; ctx.shadowBlur = 6;
    px(ctx, antX, oy - 3 * s + bob, p.accent, s);
    ctx.shadowBlur = 0;
  }

  // Chassis (E and T are placeholders → ignored by paintRows)
  const pal = { D: p.shade, d: p.rim, b: p.body, s: p.shade };
  paintRows(ctx, ox, oy + bob, CHASSIS, pal);

  // Eye — pulsing glow, centered on cells 6-9 of row 4-5
  const pulse = 0.7 + Math.sin(frame * 0.3) * 0.3;
  ctx.save();
  ctx.shadowColor = p.glow;
  ctx.shadowBlur = 10 * pulse;
  px(ctx, ox + 6 * s, oy + 4 * s + bob, p.eye, s);
  px(ctx, ox + 7 * s, oy + 4 * s + bob, p.eye, s);
  px(ctx, ox + 8 * s, oy + 4 * s + bob, p.eye, s);
  px(ctx, ox + 9 * s, oy + 4 * s + bob, p.eye, s);
  px(ctx, ox + 6 * s, oy + 5 * s + bob, p.glow, s);
  px(ctx, ox + 7 * s, oy + 5 * s + bob, '#FFFFFF', s);
  px(ctx, ox + 8 * s, oy + 5 * s + bob, '#FFFFFF', s);
  px(ctx, ox + 9 * s, oy + 5 * s + bob, p.glow, s);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Turret barrel — sticks out the bottom, centered
  px(ctx, ox + 7 * s, oy + 9 * s + bob, p.shade, s);
  px(ctx, ox + 8 * s, oy + 9 * s + bob, p.shade, s);
  px(ctx, ox + 7 * s, oy + 10 * s + bob, p.rim, s);
  px(ctx, ox + 8 * s, oy + 10 * s + bob, p.rim, s);
  px(ctx, ox + 7 * s, oy + 11 * s + bob, '#000', s);
  px(ctx, ox + 8 * s, oy + 11 * s + bob, '#000', s);

  // Targeting laser dot — only on % enemies (variant 2)
  if (variant % 3 === 2) {
    const tx = ox + 7 * s + s / 2;
    const ty = oy + 12 * s + bob;
    ctx.fillStyle = 'rgba(255, 0, 64, 0.35)';
    ctx.fillRect(tx, ty, 1, 80);
    ctx.shadowColor = p.eye; ctx.shadowBlur = 6;
    ctx.fillStyle = p.eye;
    ctx.fillRect(tx - 1, ty + 80, 3, 3);
    ctx.shadowBlur = 0;
  }
}
