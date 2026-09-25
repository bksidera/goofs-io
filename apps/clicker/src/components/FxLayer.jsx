import { useEffect, useImperativeHandle, useState, forwardRef, useRef } from 'react';

import ClickFX from './ClickFX.jsx';
import FloatingNumber from './FloatingNumber.jsx';

// Owns the lifecycle of ephemeral juice effects (click particles, floating numbers).
// Parent gets a ref and calls `fxRef.current.spawn({ type, x, y, value })`.
// Auto-removes each effect after its lifetime expires.

const LIFETIMES = {
  particles: 600,
  float: 1100,
};

const PARTICLE_COUNT = 7;

// Generates an organic burst of particles around (0,0). Called once per spawn
// so the randomness lives at spawn-time, not in ClickFX's render.
function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 40 + Math.random() * 35;
    return {
      key: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
    };
  });
}

const FxLayer = forwardRef(function FxLayer(_props, ref) {
  const [fx, setFx] = useState([]);
  const nextIdRef = useRef(1);

  useImperativeHandle(ref, () => ({
    spawn({ type, x, y, value, color }) {
      const id = nextIdRef.current++;
      const particles = type === 'particles' ? makeParticles() : null;
      setFx(prev => [...prev, { id, type, x, y, value, color, particles }]);
      const ttl = LIFETIMES[type] ?? 800;
      setTimeout(() => {
        setFx(prev => prev.filter(f => f.id !== id));
      }, ttl);
    },
  }), []);

  // Safety: clear all on unmount to avoid setState-after-unmount via the timeouts.
  useEffect(() => () => setFx([]), []);

  return (
    <div className="clicker-fx-layer">
      {fx.map(f => {
        if (f.type === 'particles') {
          return <ClickFX key={f.id} x={f.x} y={f.y} color={f.color} particles={f.particles} />;
        }
        if (f.type === 'float') {
          return <FloatingNumber key={f.id} x={f.x} y={f.y} value={f.value} />;
        }
        return null;
      })}
    </div>
  );
});

export default FxLayer;
