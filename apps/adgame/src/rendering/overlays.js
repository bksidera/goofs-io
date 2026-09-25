import { GAME_WIDTH, GAME_HEIGHT, FONT, BOSS, laneX } from '../game/constants.js';

// ── Level intro / clear cards (fake ad interstitial framing) ─────────────────

export function drawLevelCard(ctx, st, cfg) {
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const cx = GAME_WIDTH / 2;
  ctx.textAlign = 'center';

  if (st.levelPhase === 'intro') {
    ctx.fillStyle = '#666';
    ctx.font = `10px ${FONT}`;
    ctx.fillText(st.mode === 'endless' ? 'BONUS MODE' : `AD ${cfg.n} OF 9`, cx, 230);

    ctx.fillStyle = cfg.accent;
    ctx.font = `bold 21px ${FONT}`;
    ctx.shadowColor = cfg.accent;
    ctx.shadowBlur = 16;
    ctx.fillText(cfg.name, cx, 270);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#888';
    ctx.font = `italic 11px ${FONT}`;
    ctx.fillText(cfg.sponsor, cx, 296);

    ctx.fillStyle = '#444';
    ctx.font = `10px ${FONT}`;
    ctx.fillText('▶ YOUR AD BEGINS SHORTLY', cx, 360);
  } else {
    // clear card
    ctx.fillStyle = '#39FF14';
    ctx.font = `bold 24px ${FONT}`;
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 16;
    ctx.fillText('AD WATCHED ✓', cx, 250);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(`+${st.lastLevelScore.toLocaleString()} SCORE`, cx, 286);

    ctx.fillStyle = '#888';
    ctx.font = `11px ${FONT}`;
    ctx.fillText(`PEAK POWER ${Math.floor(st.player.peakPower).toLocaleString()}`, cx, 312);

    ctx.fillStyle = '#444';
    ctx.font = `10px ${FONT}`;
    ctx.fillText('LOADING NEXT AD…', cx, 360);
  }
}

// ── Boss: the CONVERSION EVENT mega-drone ────────────────────────────────────

export function drawBoss(ctx, st, frame, accent) {
  const b = st.boss;
  if (!b) return;

  // Warning banner
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF0040';
  ctx.font = `bold 13px ${FONT}`;
  const blink = Math.floor(frame / 14) % 2 === 0;
  if (blink) {
    ctx.shadowColor = '#FF0040';
    ctx.shadowBlur = 12;
    ctx.fillText('⚠ CONVERSION EVENT ⚠', GAME_WIDTH / 2, 64);
    ctx.shadowBlur = 0;
  }
  // Survive timer
  ctx.fillStyle = '#fff';
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText(`SURVIVE ${Math.max(0, b.timer).toFixed(1)}s`, GAME_WIDTH / 2, 80);

  // Telegraph: warning column on the locked lane
  if (b.phase === 'telegraph') {
    const x = laneX(b.lane);
    const pulse = 0.25 + 0.2 * Math.sin(frame * 0.5);
    ctx.fillStyle = `rgba(255, 0, 64, ${pulse})`;
    ctx.fillRect(x - 38, 90, 76, GAME_HEIGHT - 90);
    ctx.strokeStyle = '#FF0040';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 38, 90, 76, GAME_HEIGHT - 90);
    ctx.setLineDash([]);
  }

  // The drone body
  const dx = b.phase === 'dive' ? laneX(b.lane) : b.x;
  const dy = b.phase === 'dive' ? b.diveY : BOSS.Y_HOVER + Math.sin(frame * 0.08) * 6;

  ctx.save();
  ctx.translate(dx, dy);

  // Glow
  ctx.shadowColor = '#FF0040';
  ctx.shadowBlur = 22;

  // Hull
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Armor plates
  ctx.fillStyle = '#2e2e3a';
  ctx.fillRect(-26, -7, 52, 7);

  // Rotors
  const rotorSpin = (frame * 0.9) % (Math.PI * 2);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  for (const rx of [-30, 30]) {
    ctx.beginPath();
    ctx.moveTo(rx - 10 * Math.cos(rotorSpin), -12 - 3 * Math.sin(rotorSpin));
    ctx.lineTo(rx + 10 * Math.cos(rotorSpin), -12 + 3 * Math.sin(rotorSpin));
    ctx.stroke();
  }

  // Eye — tracks, burns red during telegraph/dive
  const eyeColor = b.phase === 'hover' ? accent : '#FF0040';
  ctx.fillStyle = eyeColor;
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(0, 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Level progress bar (running phase) ───────────────────────────────────────

export function drawLevelProgress(ctx, st, cfg) {
  if (st.mode === 'endless') return;
  const pct = Math.min(1, st.gatesSpawned / cfg.goal);
  const w = 150;
  const x = (GAME_WIDTH - w) / 2;
  const y = 30;

  ctx.fillStyle = '#111';
  ctx.fillRect(x, y, w, 5);
  ctx.fillStyle = cfg.accent;
  ctx.fillRect(x, y, w * pct, 5);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 0.5, y - 0.5, w + 1, 6);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#666';
  ctx.font = `9px ${FONT}`;
  ctx.fillText(`AD ${cfg.n}/9 — ${Math.floor(pct * 100)}% WATCHED`, GAME_WIDTH / 2, y + 16);
}
