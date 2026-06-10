import { useEffect, useState, useRef } from 'react';
import { formatNumber } from '../game/constants.js';

// The rug pull. A full-screen, non-interactive cutscene that plays once the
// quantum apocalypse triggers. Phases advance on a fixed schedule; when the
// final phase completes the parent is told via onComplete and swaps to the
// aftermath screen.
//
// Phase schedule (ms are cumulative from mount):
//   freeze   0     – screen locks under a dark overlay, mid-animation
//   message  800   – "QUANTUM DECRYPTION COMPLETE." plain monospace. Silence.
//   drain    3300  – the player's fortune visibly counts down to zero
//   static   5300  – glitch noise swallows the screen
//   black    6800  – nothing. five seconds of nothing.
//   (done)   9800  – onComplete fires
const PHASES = [
  { name: 'freeze', at: 0 },
  { name: 'message', at: 800 },
  { name: 'drain', at: 3300 },
  { name: 'static', at: 5300 },
  { name: 'black', at: 6800 },
  { name: 'done', at: 9800 },
];

const DRAIN_DURATION_MS = 1800;

export default function ApocalypseSequence({ finalCurrency, currencyName, onComplete }) {
  const [phase, setPhase] = useState('freeze');
  const [drainValue, setDrainValue] = useState(finalCurrency);
  const rafRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Phase scheduler
  useEffect(() => {
    const timeouts = PHASES.slice(1).map(p =>
      setTimeout(() => {
        if (p.name === 'done') {
          onCompleteRef.current?.();
        } else {
          setPhase(p.name);
        }
      }, p.at)
    );
    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Drain animation — fortune counts down to zero, fast and accelerating.
  useEffect(() => {
    if (phase !== 'drain') return;
    const start = performance.now();
    const from = finalCurrency;
    const step = now => {
      const t = Math.min(1, (now - start) / DRAIN_DURATION_MS);
      // ease-in: slow at first, then everything goes at once. Like a rug pull.
      const eased = t * t * t;
      const value = Math.max(0, Math.floor(from * (1 - eased)));
      setDrainValue(value);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, finalCurrency]);

  return (
    <div className={`clicker-apocalypse phase-${phase}`} role="dialog" aria-label="The end">
      {(phase === 'freeze') && <div className="clicker-apoc-dim" />}

      {phase === 'message' && (
        <div className="clicker-apoc-message">QUANTUM DECRYPTION COMPLETE.</div>
      )}

      {phase === 'drain' && (
        <div className="clicker-apoc-drain">
          <div className="clicker-apoc-drain-number">
            {formatNumber(drainValue)} {currencyName}
          </div>
          <div className="clicker-apoc-drain-sub">encryption integrity: 0%</div>
        </div>
      )}

      {phase === 'static' && <div className="clicker-apoc-static" />}

      {phase === 'black' && <div className="clicker-apoc-black" />}
    </div>
  );
}
