import {
  TILE, COLS, ROWS, BOARD_W, HUD_TOP, CANVAS_W, CANVAS_H, COLORS,
} from '../game/constants.js';
import { grid, isWallChar } from '../game/maze.js';

// All drawing happens translated down by HUD_TOP so board coords match logic.

export function drawFrame(ctx, state, ui) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawHud(ctx, state, ui);

  ctx.save();
  ctx.translate(0, HUD_TOP);

  drawMaze(ctx, ui.mazeFlash);
  drawSteaks(ctx, state, ui.time);
  if (state.bone) drawBone(ctx, state.bone);
  state.ghosts.forEach(g => drawGhost(ctx, g, state, ui.time));
  drawDog(ctx, state.dog, ui);
  ui.popups.forEach(p => drawPopup(ctx, p));

  ctx.restore();

  if (ui.banner) drawBanner(ctx, ui.banner);
}

// ── Maze ──────────────────────────────────────────────────────────────────────

function drawMaze(ctx, flash) {
  ctx.fillStyle = flash ? '#ffffff' : COLORS.wall;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = grid[r][c];
      if (ch === '#') {
        const x = c * TILE;
        const y = r * TILE;
        // Connected-tube look: core block plus bridges toward wall neighbors.
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, TILE - 6, TILE - 6, 3);
        ctx.fill();
        if (isWallChar(c + 1, r)) ctx.fillRect(x + TILE / 2, y + 3, TILE, TILE - 6);
        if (isWallChar(c, r + 1)) ctx.fillRect(x + 3, y + TILE / 2, TILE - 6, TILE);
      } else if (ch === '=') {
        ctx.fillStyle = COLORS.door;
        ctx.fillRect(c * TILE, r * TILE + TILE / 2 - 2, TILE, 4);
        ctx.fillStyle = flash ? '#ffffff' : COLORS.wall;
      }
    }
  }
}

// ── Steaks ────────────────────────────────────────────────────────────────────

function drawMiniSteak(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#b03a2e';
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.2, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b4ac';
  ctx.beginPath();
  ctx.ellipse(-0.8, -0.4, 1.6, 0.8, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPowerSteak(ctx, x, y, time) {
  const pulse = 1 + Math.sin(time * 6) * 0.12;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.rotate(-0.5);
  // meat
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // fat rim
  ctx.strokeStyle = '#f0d9c2';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 5.2, 0, -0.6, 1.8);
  ctx.stroke();
  // marbling
  ctx.fillStyle = '#e8b4ac';
  ctx.beginPath();
  ctx.ellipse(-1.5, -1, 2.6, 1.2, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSteaks(ctx, state, time) {
  for (const [key, kind] of state.steaks) {
    const [c, r] = key.split(',').map(Number);
    const x = c * TILE + TILE / 2;
    const y = r * TILE + TILE / 2;
    if (kind === 'power') drawPowerSteak(ctx, x, y, time);
    else drawMiniSteak(ctx, x, y);
  }
}

function drawBone(ctx, bone) {
  const blink = bone.timer < 2 && Math.floor(bone.timer * 6) % 2 === 0;
  if (blink) return;
  ctx.save();
  ctx.translate(bone.x, bone.y);
  ctx.rotate(-0.4);
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(-6, -1.8, 12, 3.6);
  for (const sx of [-6, 6]) {
    ctx.beginPath();
    ctx.arc(sx, -2.2, 2.4, 0, Math.PI * 2);
    ctx.arc(sx, 2.2, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── The dog ───────────────────────────────────────────────────────────────────

export function drawDog(ctx, dog, ui) {
  const r = 8.5;
  // Chomp: mouth angle swings 0 → ~50° → 0, exactly like the original wedge.
  let mouthMax = 0.95; // radians, half-angle
  let mouth = Math.abs(Math.sin(dog.mouth * Math.PI * 2)) * mouthMax;
  if (ui.dying != null) {
    // Death: the mouth opens all the way around (classic wipe).
    mouth = Math.min(Math.PI, ui.dying * Math.PI);
  }

  const angle =
    dog.dir.dx === 1 ? 0 :
    dog.dir.dx === -1 ? Math.PI :
    dog.dir.dy === -1 ? -Math.PI / 2 :
    dog.dir.dy === 1 ? Math.PI / 2 : 0;

  ctx.save();
  ctx.translate(dog.x, dog.y);
  ctx.rotate(angle);
  // Keep features upright when facing left.
  if (dog.dir.dx === -1) ctx.scale(1, -1);

  // Head with pac-man mouth wedge.
  ctx.fillStyle = COLORS.dog;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fill();

  if (ui.dying == null || ui.dying < 0.9) {
    // Floppy ear on the back-top of the head.
    ctx.fillStyle = COLORS.dogEar;
    ctx.beginPath();
    ctx.ellipse(-4.5, -6.5, 4, 2.6, -0.7, 0, Math.PI * 2);
    ctx.fill();

    // Eye.
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.arc(1.5, -4, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Snout dot at the top mouth edge.
    ctx.fillStyle = '#3d2b14';
    ctx.beginPath();
    ctx.arc(r - 2.2, -Math.max(2.5, mouth * 5), 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Ghosts ────────────────────────────────────────────────────────────────────

function drawGhost(ctx, ghost, state, time) {
  const x = ghost.x;
  const y = ghost.y;
  const r = 8;
  const eyesOnly = ghost.phase === 'eyes' || ghost.phase === 'entering';

  if (!eyesOnly) {
    let body = ghost.color;
    if (ghost.frightened) {
      const flashing = state.frightenedTimer < 2;
      body = flashing && Math.floor(time * 5) % 2 === 0 ? COLORS.frightenedFlash : COLORS.frightened;
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y - 1, r, Math.PI, 0);
    // Wavy skirt
    const skirtY = y + 7;
    ctx.lineTo(x + r, skirtY);
    const wave = Math.floor(time * 8) % 2 === 0 ? 2 : 0;
    for (let i = 3; i >= -3; i -= 2) {
      ctx.lineTo(x + i * (r / 4), skirtY - 3 + (i % 4 === 3 || i % 4 === -1 ? wave : -wave + 2));
    }
    ctx.lineTo(x - r, skirtY);
    ctx.closePath();
    ctx.fill();
  }

  if (ghost.frightened && !eyesOnly) {
    // Scared face: dot eyes + squiggle mouth.
    ctx.fillStyle = '#f0d9c2';
    ctx.beginPath();
    ctx.arc(x - 3, y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f0d9c2';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 4.5, y + 3.5);
    for (let i = 0; i < 3; i++) {
      ctx.lineTo(x - 3 + i * 3, y + 2);
      ctx.lineTo(x - 1.5 + i * 3, y + 3.5);
    }
    ctx.stroke();
  } else {
    // Classic googly eyes that look toward travel direction.
    const lx = ghost.dir.dx * 1.8;
    const ly = ghost.dir.dy * 1.8;
    for (const ex of [-3.2, 3.2]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x + ex, y - 2, 2.6, 3.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2233dd';
      ctx.beginPath();
      ctx.arc(x + ex + lx, y - 2 + ly, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── HUD / overlays ────────────────────────────────────────────────────────────

function drawHud(ctx, state, ui) {
  ctx.fillStyle = COLORS.score;
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${state.score}`, 10, 24);
  ctx.textAlign = 'right';
  ctx.fillText(`HIGH ${ui.highScore}`, BOARD_W - 10, 24);
  ctx.textAlign = 'center';
  ctx.fillText(`L${state.level}`, BOARD_W / 2, 24);

  // Lives: little dog heads, bottom-left.
  const baseY = CANVAS_H - 20;
  for (let i = 0; i < state.lives - 1; i++) {
    const cx = 18 + i * 24;
    ctx.fillStyle = COLORS.dog;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.arc(cx, baseY, 8, 0.6, Math.PI * 2 - 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.dogEar;
    ctx.beginPath();
    ctx.ellipse(cx - 4, baseY - 6, 3.4, 2.2, -0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPopup(ctx, p) {
  ctx.fillStyle = '#7df9ff';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.globalAlpha = Math.max(0, Math.min(1, p.ttl));
  ctx.fillText(`${p.points}`, p.x, p.y - (1 - p.ttl) * 14);
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, banner) {
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = banner.color ?? '#ffd166';
  ctx.fillText(banner.text, BOARD_W / 2, HUD_TOP + 17 * TILE + 12);
  if (banner.sub) {
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(banner.sub, BOARD_W / 2, HUD_TOP + 17 * TILE + 34);
  }
}
