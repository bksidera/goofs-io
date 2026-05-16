import { useEffect, useRef, useState } from 'react';

// Smoothly lerps a displayed number toward a target value using rAF.
// Mirrors AdGame.exe's targetPower / displayPower pattern.
// `rate` is the fraction of the gap to close per frame at 60fps (0..1).
export function useAnimatedNumber(target, rate = 0.18) {
  const [display, setDisplay] = useState(target);
  const targetRef = useRef(target);
  const displayRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const step = () => {
      const t = targetRef.current;
      const d = displayRef.current;
      const diff = t - d;
      // Snap close enough to avoid endless tiny updates.
      if (Math.abs(diff) < 0.5) {
        if (d !== t) {
          displayRef.current = t;
          setDisplay(t);
        }
      } else {
        const next = d + diff * rate;
        displayRef.current = next;
        setDisplay(next);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rate]);

  return display;
}
