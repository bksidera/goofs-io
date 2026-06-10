import { useEffect, useRef, useState, useCallback } from 'react';

import {
  CANVAS_W, CANVAS_H, STARTING_LIVES, HIGHSCORE_KEY,
} from '../game/constants.js';
import { initState, resetPositions, tick } from '../game/logic.js';
import { drawFrame } from '../rendering/draw.js';

// Phases: 'title' → 'ready' (2s) → 'playing' ⇄ 'dying' (1.6s) → 'ready' | 'gameover'
//                                  'playing' → 'clear' (2s maze flash) → 'ready' next level

const KEY_DIRS = {
  ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 },
  w: { dx: 0, dy: -1 }, s: { dx: 0, dy: 1 }, a: { dx: -1, dy: 0 }, d: { dx: 1, dy: 0 },
};

function loadHighScore() {
  try {
    return Number(localStorage.getItem(HIGHSCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(HIGHSCORE_KEY, String(score));
  } catch {
    /* private mode etc. — high score just won't persist */
  }
}

export default function GameScreen() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const uiRef = useRef({
    phase: 'title',
    phaseTimer: 0,
    time: 0,
    popups: [],
    mazeFlash: false,
    dying: null,
    highScore: loadHighScore(),
    banner: null,
  });
  const animRef = useRef(null);
  const touchRef = useRef(null);
  const [, setRenderTick] = useState(0); // only used to re-render the wrapper on phase changes

  const startRun = useCallback(() => {
    stateRef.current = initState(1, 0, STARTING_LIVES);
    const ui = uiRef.current;
    ui.phase = 'ready';
    ui.phaseTimer = 2;
    ui.popups = [];
    ui.dying = null;
    ui.mazeFlash = false;
    setRenderTick(t => t + 1);
  }, []);

  // Input
  useEffect(() => {
    const onKey = e => {
      const ui = uiRef.current;
      if (ui.phase === 'title' || ui.phase === 'gameover') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startRun();
        }
        return;
      }
      const dir = KEY_DIRS[e.key];
      if (dir && stateRef.current) {
        e.preventDefault();
        stateRef.current.dog.nextDir = dir;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startRun]);

  // Touch: swipe to steer, tap to start.
  const onTouchStart = useCallback(e => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(e => {
    const ui = uiRef.current;
    if (ui.phase === 'title' || ui.phase === 'gameover') {
      startRun();
      return;
    }
    const start = touchRef.current;
    if (!start || !stateRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    stateRef.current.dog.nextDir = Math.abs(dx) > Math.abs(dy)
      ? { dx: Math.sign(dx), dy: 0 }
      : { dx: 0, dy: Math.sign(dy) };
  }, [startRun]);

  // Main loop
  useEffect(() => {
    let last = performance.now();

    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ui = uiRef.current;
      const state = stateRef.current;
      ui.time += dt;

      // Phase machinery
      if (ui.phase === 'ready') {
        ui.phaseTimer -= dt;
        ui.banner = { text: 'READY!', color: '#ffd166' };
        if (ui.phaseTimer <= 0) {
          ui.phase = 'playing';
          ui.banner = null;
        }
      } else if (ui.phase === 'playing' && state) {
        tick(state, dt);

        // popups age
        ui.popups.forEach(p => { p.ttl -= dt; });
        ui.popups = ui.popups.filter(p => p.ttl > 0);

        // drain events
        for (const ev of state.events) {
          if (ev.type === 'ghost' || ev.type === 'bone') {
            ui.popups.push({ x: ev.x, y: ev.y, points: ev.points, ttl: 1 });
          } else if (ev.type === 'death') {
            ui.phase = 'dying';
            ui.phaseTimer = 1.6;
            ui.dying = 0;
          } else if (ev.type === 'clear') {
            ui.phase = 'clear';
            ui.phaseTimer = 2;
          }
        }
        state.events.length = 0;

        if (state.score > ui.highScore) {
          ui.highScore = state.score;
        }
      } else if (ui.phase === 'dying' && state) {
        ui.phaseTimer -= dt;
        ui.dying = Math.min(1, 1 - ui.phaseTimer / 1.6);
        if (ui.phaseTimer <= 0) {
          ui.dying = null;
          state.lives -= 1;
          if (state.lives <= 0) {
            ui.phase = 'gameover';
            saveHighScore(ui.highScore);
            setRenderTick(t => t + 1);
          } else {
            resetPositions(state);
            ui.phase = 'ready';
            ui.phaseTimer = 2;
          }
        }
      } else if (ui.phase === 'clear' && state) {
        ui.phaseTimer -= dt;
        ui.mazeFlash = Math.floor(ui.phaseTimer * 6) % 2 === 0;
        if (ui.phaseTimer <= 0) {
          ui.mazeFlash = false;
          const next = initState(state.level + 1, state.score, state.lives);
          stateRef.current = next;
          ui.phase = 'ready';
          ui.phaseTimer = 2;
        }
      }

      // Render
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        if (ui.phase === 'title' || ui.phase === 'gameover') {
          drawTitleOrGameOver(ctx, ui, state);
        } else if (state) {
          drawFrame(ctx, state, ui);
        }
      }

      animRef.current = requestAnimationFrame(frame);
    };

    animRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Expose a debug handle in dev so automated tests can poke the sim.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__chomp = { stateRef, uiRef, startRun };
    return () => { delete window.__chomp; };
  }, [startRun]);

  return (
    <div className="chomp-root">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="chomp-canvas"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
    </div>
  );
}

// Title + game-over share a canvas-drawn card so everything stays in one
// crisp pixel surface.
function drawTitleOrGameOver(ctx, ui, state) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';

  const cx = CANVAS_W / 2;
  const isOver = ui.phase === 'gameover';

  ctx.fillStyle = '#d99a4e';
  ctx.font = 'bold 46px "Courier New", monospace';
  ctx.fillText('CHOMP', cx, 170);

  ctx.fillStyle = '#888';
  ctx.font = '13px "Courier New", monospace';
  ctx.fillText('a very good boy vs. four ghosts', cx, 198);

  if (isOver && state) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('GAME OVER', cx, 260);
    ctx.fillStyle = '#ffd166';
    ctx.font = '15px "Courier New", monospace';
    ctx.fillText(`SCORE ${state.score}   ·   LEVEL ${state.level}`, cx, 292);
  }

  ctx.fillStyle = '#ffd166';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText(`HIGH SCORE ${ui.highScore}`, cx, isOver ? 330 : 270);

  const blink = Math.floor(ui.time * 2) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(isOver ? 'PRESS SPACE / TAP TO RETRY' : 'PRESS SPACE / TAP TO START', cx, 400);
  }

  ctx.fillStyle = '#555';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('ARROWS / WASD / SWIPE TO MOVE', cx, 440);
  ctx.fillText('EAT THE STEAKS. AVOID THE GHOSTS. BIG STEAKS BITE BACK.', cx, 460);
}
