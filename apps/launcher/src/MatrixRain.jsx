import { useEffect, useRef } from 'react';

/*
 * Subtle Matrix rain background for the launcher.
 * Runs on a canvas at low opacity — texture, not content.
 * Respects prefers-reduced-motion (no animation, still renders a static grid).
 */

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ01#$@%&+=-';
const FONT_SIZE = 14;
const COLOR = '#00FF41';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export default function MatrixRain({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let cols = 0;
    let drops = [];
    let raf = 0;
    let running = true;

    function resize() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(w / FONT_SIZE);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    }

    function step() {
      if (!running) return;
      // dark trail — fades old glyphs
      ctx.fillStyle = 'rgba(8, 8, 15, 0.08)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      ctx.fillStyle = COLOR;
      ctx.font = `${FONT_SIZE}px ${'JetBrains Mono, Courier New, monospace'}`;

      for (let i = 0; i < cols; i++) {
        const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;
        ctx.fillText(g, x, y);
        drops[i] += 1;
        if (y > canvas.offsetHeight && Math.random() > 0.972) drops[i] = 0;
      }
      raf = requestAnimationFrame(step);
    }

    function staticFrame() {
      ctx.fillStyle = 'rgba(8, 8, 15, 1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      ctx.fillStyle = COLOR;
      ctx.font = `${FONT_SIZE}px monospace`;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 4; j++) {
          const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          ctx.fillText(g, i * FONT_SIZE, (j * 30 + 20));
        }
      }
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      staticFrame();
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
