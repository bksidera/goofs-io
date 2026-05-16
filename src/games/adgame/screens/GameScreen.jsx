import { useState, useEffect, useRef, useCallback } from 'react';

import { GAME_WIDTH, GAME_HEIGHT, laneX, FONT } from '../game/constants.js';
import { initState }   from '../game/state.js';
import { tickLogic }   from '../game/logic.js';
import { spawnPopup, closePopup, decoyButtonPressed } from '../game/popups.js';

import { drawBackground }  from '../rendering/background.js';
import { drawPlayer }      from '../rendering/player.js';
import { drawGate }        from '../rendering/gates.js';
import {
  drawTrail, drawParticles, drawFloats, drawFlash,
  drawInfectionClearFlash, drawScanlines, drawGlitch,
  drawInfectionOverlay,
} from '../rendering/effects.js';
import { drawHUD } from '../rendering/hud.js';

import Win98Popup from '../components/Win98Popup.jsx';
import { audio }  from '../sound/audio.js';

// ── Responsive scale ──────────────────────────────────────────────────────────
function useGameScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => setScale(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  return scale;
}

// ── Pause overlay ─────────────────────────────────────────────────────────────
function PauseOverlay({ wave, power, onResume, onQuit, muted, onToggleMute }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 300,
      background: '#000000ee',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{ fontSize: 11, color: '#00FF41', fontFamily: FONT, letterSpacing: 4, opacity: 0.7 }}>SYSTEM HALTED</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: FONT, textShadow: '0 0 20px #00FF41' }}>PAUSED</div>
      <div style={{ display: 'flex', gap: 22, fontSize: 11, fontFamily: FONT, marginBottom: 8 }}>
        {[['WAVE', wave, '#00FF41'], ['POWER', Math.floor(power), '#FFD700']].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ color: '#555', fontSize: 9 }}>{l}</div>
            <div style={{ color: c, fontSize: 22, fontWeight: 900 }}>{typeof v === 'number' ? v.toLocaleString() : v}</div>
          </div>
        ))}
      </div>
      <button onClick={onResume}      style={{ ...S.pauseBtn, borderColor: '#39FF14', color: '#39FF14' }}>RESUME</button>
      <button onClick={onToggleMute}  style={{ ...S.pauseBtn, fontSize: 13, padding: '8px 24px' }}>{muted ? '🔇 UNMUTE' : '🔊 MUTE'}</button>
      <button onClick={onQuit}        style={{ ...S.pauseBtn, borderColor: '#FF0040', color: '#FF0040', fontSize: 12, padding: '8px 24px' }}>QUIT RUN</button>
    </div>
  );
}

// ── Main GameScreen ───────────────────────────────────────────────────────────
export default function GameScreen({ onDeath }) {
  const canvasRef  = useRef(null);
  const stateRef   = useRef(null);
  const animRef    = useRef(null);
  const touchRef   = useRef(null);
  const audioReady = useRef(false);
  const scale      = useGameScale();

  const [popups,    setPopups]    = useState([]);
  const [paused,    setPaused]    = useState(false);
  const [muted,     setMuted]     = useState(false);
  const [pauseSnap, setPauseSnap] = useState({ wave: 1, power: 100 });

  // Keep muted in a ref so togglePause closure always has the latest value
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // ── Audio init ────────────────────────────────────────────────────────────
  const initAudio = useCallback(() => {
    if (audioReady.current) { audio.resume(); return; }
    audioReady.current = true;
    audio.init();
    audio.startMusic();
    audio.sfxGameStart();
  }, []);

  // ── Input ─────────────────────────────────────────────────────────────────
  const movePlayer = useCallback((dir) => {
    const st = stateRef.current;
    if (!st || st.gameOver || st.paused) return;
    const next = st.player.lane + dir;
    if (next < 0 || next > 2) return;
    st.player.lane = next;
    audio.sfxLaneSwitch();
  }, []);

  const handleClick = useCallback((e) => {
    initAudio();
    const st = stateRef.current;
    if (!st || st.gameOver || st.paused) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / scale;
    const t    = GAME_WIDTH / 3;
    if (x < t)        movePlayer(-1);
    else if (x > t * 2) movePlayer(1);
  }, [initAudio, movePlayer, scale]);

  const handleTouchStart = useCallback((e) => {
    initAudio();
    touchRef.current = e.touches[0].clientX;
  }, [initAudio]);

  const handleTouchEnd = useCallback((e) => {
    const st = stateRef.current;
    if (!st || !touchRef.current) return;
    const ex = e.changedTouches[0].clientX;
    const d  = ex - touchRef.current;
    if (Math.abs(d) > 30) {
      movePlayer(d < 0 ? -1 : 1);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (ex - rect.left) / scale;
      const t = GAME_WIDTH / 3;
      if (x < t)        movePlayer(-1);
      else if (x > t * 2) movePlayer(1);
    }
    touchRef.current = null;
  }, [movePlayer, scale]);

  // ── Game loop (defined before togglePause which calls it) ─────────────────
  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const loop = (time) => {
      const st = stateRef.current;
      if (!st || st.gameOver || st.paused) return;
      const dt = Math.min(time - st.lastTime, 50);
      st.lastTime = time;

      tickLogic(st, dt, spawnPopup, onDeath, setPopups);
      if (st.gameOver) { audio.stopMusic(); audio.sfxDeath(); return; }

      ctx.save();
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.translate(st.shakeX, st.shakeY);

      drawBackground(ctx, st);

      const scramble = st._scrambleActive || false;
      for (const g of st.gates) {
        if (!g.alive) continue;
        drawGate(ctx, laneX(g.lane), g.y, g.display, g.type, g.revealed, st.frame, st.infected, scramble, g.variant);
      }

      if (st.infected) drawInfectionOverlay(ctx, st.frame);
      drawTrail(ctx, st.trail);
      drawPlayer(ctx, laneX(st.player.lane), 540, st.frame);
      drawParticles(ctx, st.particles);
      drawFloats(ctx, st.floats);
      drawFlash(ctx, st.flashAlpha, st.flashColor);
      drawInfectionClearFlash(ctx, st.infectionFlash);
      drawScanlines(ctx, st.scanOff, st.decayVisual);
      if (st.glitchOn) drawGlitch(ctx);

      ctx.restore();
      drawHUD(ctx, st);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
  }, [onDeath]);

  // ── Pause (defined after startLoop) ──────────────────────────────────────
  const togglePause = useCallback(() => {
    const st = stateRef.current;
    if (!st || st.gameOver) return;
    const nowPaused = !st.paused;
    st.paused = nowPaused;
    if (nowPaused) {
      setPauseSnap({ wave: st.wave, power: st.player.targetPower });
      setPaused(true);
      audio.setMuted(true);
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    } else {
      setPaused(false);
      audio.setMuted(mutedRef.current);
      st.lastTime = performance.now();
      startLoop();
    }
  }, [startLoop]);

  const handleQuit = useCallback(() => {
    const st = stateRef.current;
    if (st) st.gameOver = true;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    audio.stopMusic();
    setPaused(false);
    onDeath(0, 1, 0);
  }, [onDeath]);

  const handleToggleMute = useCallback(() => {
    const next = !mutedRef.current;
    setMuted(next);
    audio.setMuted(next);
  }, []);

  // ── Keyboard (defined after togglePause) ──────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { togglePause(); return; }
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') movePlayer(-1);
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause, movePlayer]);

  // ── Popup handlers ────────────────────────────────────────────────────────
  const handleClosePopup = useCallback((id) => {
    const st = stateRef.current;
    if (!st) return;
    audio.sfxPopupDismiss();
    closePopup(st, id, setPopups);
  }, []);

  const handleDecoyBtn = useCallback((id) => {
    const st = stateRef.current;
    if (!st) return;
    decoyButtonPressed(st, id, setPopups);
  }, []);

  // ── Tab visibility pause ──────────────────────────────────────────────────
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        const st = stateRef.current;
        if (st && !st.paused && !st.gameOver) togglePause();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [togglePause]);

  // ── Mount ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = initState();
    startLoop();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      audio.stopMusic();
    };
  }, [startLoop]);

  return (
    <div style={{
      width: '100vw', height: '100svh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000', overflow: 'hidden',
    }}>
      <div
        style={{
          position: 'relative',
          width: GAME_WIDTH, height: GAME_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          boxShadow: '0 0 30px #00FF4130, 0 0 60px #FF2D9510, inset 0 0 50px #000000aa',
          borderRadius: 4,
          overflow: 'hidden',
          cursor: 'pointer',
          touchAction: 'none',
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH} height={GAME_HEIGHT}
          style={{ display: 'block', width: GAME_WIDTH, height: GAME_HEIGHT, imageRendering: 'pixelated' }}
        />

        {popups.map(p => (
          <Win98Popup
            key={p.id}
            popup={p}
            onClose={() => handleClosePopup(p.id)}
            onDecoyBtn={() => handleDecoyBtn(p.id)}
          />
        ))}

        <button
          onClick={e => { e.stopPropagation(); initAudio(); togglePause(); }}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 50,
            background: 'transparent', border: '1px solid #333',
            color: '#555', fontSize: 14, cursor: 'pointer', padding: '2px 6px',
            fontFamily: FONT, lineHeight: 1,
          }}
        >⏸</button>

        {paused && (
          <PauseOverlay
            wave={pauseSnap.wave}
            power={pauseSnap.power}
            onResume={togglePause}
            onQuit={handleQuit}
            muted={muted}
            onToggleMute={handleToggleMute}
          />
        )}
      </div>
    </div>
  );
}

const S = {
  pauseBtn: {
    padding: '12px 36px', fontSize: 15, fontWeight: 900,
    fontFamily: FONT, background: 'transparent', color: '#00FF41',
    border: '2px solid #00FF41', cursor: 'pointer', letterSpacing: 3,
    textTransform: 'uppercase',
    boxShadow: '0 0 8px #00FF4133',
    textShadow: '0 0 6px #00FF41',
  },
};
