import { PX } from '../game/constants.js';

// Hackerman: hoodie up, oversized pink shades, fingerless gloves on outstretched hands.
// Self-serious meme energy — the "guy at a toy laptop in front of green code rain."
//
// 14 columns × 18 rows at 3px each = 42 × 54px sprite.
// Origin (cx, cy) = bottom-center anchor (the player's feet sit at cy).

function px(ctx, x, y, color, size = PX) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

// Bit-row painter: each character in `row` paints one PX cell.
// '.' = transparent, otherwise looked up in the palette.
function row(ctx, ox, oy, ry, str, palette) {
  const s = PX;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '.') continue;
    const c = palette[ch];
    if (!c) continue;
    px(ctx, ox + i * s, oy + ry * s, c, s);
  }
}

const PAL = {
  H: '#0A0A0A',  // hoodie shadow
  h: '#1F1F1F',  // hoodie base
  d: '#2E2E2E',  // hoodie highlight
  S: '#FFAACC',  // pink shades frame
  L: '#FF66AA',  // shades lens
  G: '#FFFFFF',  // shades glare
  F: '#D9A484',  // skin
  f: '#A9784F',  // skin shadow
  M: '#7A4A2A',  // mouth
  X: '#000000',  // outline accents (smirk, neck)
  K: '#0F0F0F',  // glove
};

// Two-frame run cycle for the arms (the "hacking" motion ends up reading as a typing/run hybrid)
const SPRITE_A = [
  '..............',
  '....HHHHHH....',
  '...HhhhhhhH...',
  '..HhddddddhH..',
  '..Hhd....dhH..',
  '..HhFFFFFFhH..',
  '..HSLLGLLLSH..',  // shades w/ glare
  '..HSLLLLLLSH..',
  '..Hhf.MM.fhH..',  // smirk
  '...HhffffhH...',
  '..HhhddddhhH..',
  '.HhhdddddhhhH.',
  '.HhddddddddhH.',
  '.HhdK....KdhH.',  // arms out, gloves
  '.HhKK....KKhH.',
  '..HhhhddhhhH..',
  '..Hhh....hhH..',
  '..XXX....XXX..',
];

const SPRITE_B = [
  '..............',
  '....HHHHHH....',
  '...HhhhhhhH...',
  '..HhddddddhH..',
  '..Hhd....dhH..',
  '..HhFFFFFFhH..',
  '..HSLLLLGLSH..',  // glare moves
  '..HSLLLLLLSH..',
  '..Hhf.MM.fhH..',
  '...HhffffhH...',
  '..HhhddddhhH..',
  '.HhhdddddhhhH.',
  '.HhddddddddhH.',
  '..HhKddddKhH..',  // arms tucked
  '..HhKKddKKhH..',
  '..HhhhddhhhH..',
  '..Hhh....hhH..',
  '..XXX....XXX..',
];

export function drawPlayer(ctx, cx, cy, frame = 0) {
  const s    = PX;
  const w    = 14 * s;
  const h    = 18 * s;
  const ox   = Math.floor(cx - w / 2);
  const oy   = Math.floor(cy - h);
  const tick = Math.floor(frame / 8) % 2;
  const sprite = tick === 0 ? SPRITE_A : SPRITE_B;

  // Subtle green floor-glow under the player (sells "standing in the cyberspace lane")
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
  grad.addColorStop(0, 'rgba(0, 255, 65, 0.35)');
  grad.addColorStop(1, 'rgba(0, 255, 65, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - 28, cy - 8, 56, 16);
  ctx.restore();

  // Body bob — 1px up/down
  const bob = Math.sin(frame * 0.18) > 0 ? -s : 0;

  for (let ry = 0; ry < sprite.length; ry++) {
    row(ctx, ox, oy + bob, ry, sprite[ry], PAL);
  }

  // Glow on the pink shades — the meme's whole identity is on his face
  ctx.save();
  ctx.shadowColor = '#FF66AA';
  ctx.shadowBlur  = 6;
  px(ctx, ox + 6 * s, oy + 6 * s + bob, '#FFFFFF', s);  // single glare pixel pulse
  ctx.restore();
}
