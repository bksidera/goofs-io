import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants.js';
import { initState } from '../game/state.js';
import { applyAction, pressNearest, setCursorTarget, tickLogic } from '../game/logic.js';
import { finalizeRun } from '../game/scoring.js';
import { drawBackground } from '../rendering/background.js';
import { drawHazards } from '../rendering/hazards.js';
import { drawEffects } from '../rendering/effects.js';
import { drawCursor } from '../rendering/cursor.js';
import { drawHUD } from '../rendering/hud.js';
import ConsentButton from '../components/ConsentButton.jsx';
import LegalModal from '../components/LegalModal.jsx';
import ToggleRow from '../components/ToggleRow.jsx';
import ContractCard from '../components/ContractCard.jsx';

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

export default function GameScreen({ mode, onDone }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const overlayTickRef = useRef(0);
  const scale = useGameScale();
  const [overlay, setOverlay] = useState({ buttons: [], modals: [], toggles: [], swapActive: false, overwriteActive: false });
  const [phaseSnap, setPhaseSnap] = useState({ phase: 'intro', stage: null, score: 0, paused: false });

  const finish = useCallback(() => {
    const st = stateRef.current;
    if (!st) return;
    onDone(finalizeRun(st));
  }, [onDone]);

  const syncOverlay = useCallback((snap) => {
    overlayTickRef.current++;
    if (overlayTickRef.current % 3 === 0) setOverlay({
      buttons: [...snap.buttons],
      modals: [...snap.modals],
      toggles: [...snap.toggles],
      swapActive: !!stateRef.current?.swapTelegraph || !!stateRef.current?.swapActive,
      overwriteActive: !!stateRef.current?.overwriteActive,
    });
    const st = stateRef.current;
    if (st && (st.phase !== phaseSnap.phase || st.paused !== phaseSnap.paused || st.stage !== phaseSnap.stage)) {
      setPhaseSnap({ phase: st.phase, stage: st.stage, score: st.score, paused: st.paused });
    }
  }, [phaseSnap.phase, phaseSnap.paused, phaseSnap.stage]);

  const draw = useCallback(() => {
    const st = stateRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!st || !ctx) return;
    const shake = st.shake > 0 ? (Math.random() - 0.5) * 8 * st.shake : 0;
    ctx.save();
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.translate(shake, -shake);
    drawBackground(ctx, st);
    drawHazards(ctx, st);
    drawEffects(ctx, st);
    drawCursor(ctx, st);
    ctx.restore();
    drawHUD(ctx, st);
  }, []);

  useEffect(() => {
    stateRef.current = initState(mode);
    stateRef.current.lastTime = performance.now();
    const frame = (time) => {
      const st = stateRef.current;
      if (!st) return;
      const dt = Math.min(time - st.lastTime, 50);
      st.lastTime = time;
      if (!st.paused) tickLogic(st, dt, { setOverlay: syncOverlay, onDone: finish });
      draw();
      if (st.dead) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, finish, mode, syncOverlay]);

  const toGamePoint = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const handlePointer = useCallback((e) => {
    const st = stateRef.current;
    if (!st) return;
    const p = toGamePoint(e);
    setCursorTarget(st, p.x, p.y);
  }, [toGamePoint]);

  const handleAction = useCallback((action) => {
    const st = stateRef.current;
    if (!st) return;
    applyAction(st, action);
    setOverlay({
      buttons: [...st.buttons.filter(b => b.alive)],
      modals: [...st.modals.filter(m => m.alive)],
      toggles: [...st.toggles],
      swapActive: !!st.swapTelegraph || !!st.swapActive,
      overwriteActive: !!st.overwriteActive,
    });
  }, []);

  const togglePause = useCallback(() => {
    const st = stateRef.current;
    if (!st || st.dead) return;
    st.paused = !st.paused;
    if (!st.paused) st.lastTime = performance.now();
    setPhaseSnap({ phase: st.phase, stage: st.stage, score: st.score, paused: st.paused });
  }, []);

  useEffect(() => {
    const down = (e) => {
      const st = stateRef.current;
      if (!st) return;
      if (e.key === 'Escape') { togglePause(); return; }
      if (e.key === ' ') { e.preventDefault(); pressNearest(st); return; }
      st.keys[e.key] = true;
    };
    const up = (e) => {
      const st = stateRef.current;
      if (st) st.keys[e.key] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [togglePause]);

  const cardVisible = phaseSnap.stage && (phaseSnap.phase === 'intro' || phaseSnap.phase === 'clear');

  return (
    <div className="terms-shell">
      <div
        className="terms-box game"
        style={{ transform: `scale(${scale})` }}
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
      >
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} />

        {overlay.toggles.map(t => <ToggleRow key={t.id} toggle={t} onAction={handleAction} />)}
        {overlay.buttons.map(b => (
          <ConsentButton
            key={b.id}
            button={b}
            swapActive={overlay.swapActive}
            overwriteActive={overlay.overwriteActive}
            onAction={handleAction}
          />
        ))}
        {overlay.modals.map(m => <LegalModal key={m.id} modal={m} onAction={handleAction} />)}

        {cardVisible && <ContractCard stage={phaseSnap.stage} phase={phaseSnap.phase} score={phaseSnap.score} />}

        <button className="terms-pause" onClick={(e) => { e.stopPropagation(); togglePause(); }}>
          {phaseSnap.paused ? '▶' : 'Ⅱ'}
        </button>
        {phaseSnap.paused && (
          <div className="terms-pause-overlay">
            <div>AGREEMENT PAUSED</div>
            <button onClick={togglePause}>Resume</button>
            <button onClick={finish}>Quit</button>
          </div>
        )}
      </div>
    </div>
  );
}
