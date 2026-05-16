import { useRef, useEffect, useState } from 'react';
import { FONT, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../game/constants.js';
import { drawPlayer } from '../rendering/player.js';

// Mini Matrix rain just for the title screen — same idea as in-game, smaller cast.
const TITLE_RAIN_GLYPHS = '0123456789ABCDEFアカサタナハマヤラワ';
function buildRain(w, h) {
  const colW = 12;
  const cols = Math.ceil(w / colW) + 1;
  return Array.from({ length: cols }, (_, i) => {
    const len = 6 + Math.floor(Math.random() * 12);
    return {
      x: i * colW,
      y: Math.random() * h,
      sp: 0.6 + Math.random() * 1.4,
      len,
      glyphs: Array.from({ length: len }, () =>
        TITLE_RAIN_GLYPHS[Math.floor(Math.random() * TITLE_RAIN_GLYPHS.length)]
      ),
      mut: Math.random() * 60,
      br: 0.4 + Math.random() * 0.5,
    };
  });
}

export default function TitleScreen({ onStart }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(0);
  const rainRef   = useRef(null);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    rainRef.current = buildRain(GAME_WIDTH, GAME_HEIGHT);
    let raf;
    const draw = () => {
      frameRef.current++;
      // bg
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      // rain
      ctx.font = `bold 14px ${FONT}`;
      ctx.textBaseline = 'top';
      for (const c of rainRef.current) {
        c.y += c.sp * 1.0;
        c.mut -= 1;
        if (c.mut <= 0) {
          c.mut = 8 + Math.random() * 16;
          c.glyphs[Math.floor(Math.random() * c.len)] =
            TITLE_RAIN_GLYPHS[Math.floor(Math.random() * TITLE_RAIN_GLYPHS.length)];
        }
        if (c.y - c.len * 14 > GAME_HEIGHT) {
          c.y = -Math.random() * 60;
          c.br = 0.4 + Math.random() * 0.5;
        }
        for (let i = 0; i < c.len; i++) {
          const gy = Math.floor(c.y - i * 14);
          if (gy < -14 || gy > GAME_HEIGHT) continue;
          const t = 1 - i / c.len;
          if (i === 0) {
            ctx.fillStyle = '#CCFFDD';
            ctx.shadowColor = COLORS.GREEN;
            ctx.shadowBlur = 6;
          } else {
            const a = (0.05 + t * 0.85 * c.br).toFixed(3);
            ctx.fillStyle = `rgba(0, 255, 65, ${a})`;
            ctx.shadowBlur = 0;
          }
          ctx.fillText(c.glyphs[i], c.x, gy);
        }
      }
      ctx.shadowBlur = 0;

      // dim overlay so the UI stays readable
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // hackerman portrait floating in the middle
      drawPlayer(ctx, GAME_WIDTH / 2, 280, frameRef.current);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={S.wrap}>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH} height={GAME_HEIGHT}
        style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated', width: GAME_WIDTH, height: GAME_HEIGHT }}
      />
      <div style={S.scanlines} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', gap: 4, padding: '40px 30px 30px', textAlign: 'center', zIndex: 2 }}>
        <div style={{ fontSize: 10, color: COLORS.GREEN, fontFamily: FONT, letterSpacing: 4, opacity: 0.7 }}>
          ⚠ THIS IS AN AD ⚠
        </div>

        {/* spacer where the canvas portrait sits */}
        <div style={{ height: 200 }} />

        <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1, letterSpacing: -1, textShadow: `0 0 18px ${COLORS.GREEN}, 0 0 38px ${COLORS.GREEN}, 3px 3px 0 #00AA22aa` }}>
          AdGame
          <span style={{ color: COLORS.PINK, textShadow: `0 0 18px ${COLORS.PINK}, 0 0 36px ${COLORS.PINK}, 3px 3px 0 #FF2D9555` }}>
            .exe
          </span>
        </div>

        <div style={{ fontSize: 11, color: COLORS.GOLD, fontFamily: FONT, opacity: 0.85, fontStyle: 'italic', marginTop: 4 }}>
          The game from the ad that doesn't exist.
        </div>
        <div style={{ fontSize: 10, color: COLORS.GREEN, fontFamily: FONT, opacity: 0.6 }}>
          Except now it does.
        </div>

        <button
          onClick={onStart}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            marginTop: 28, padding: '13px 40px', fontSize: 17, fontWeight: 900,
            fontFamily: FONT,
            background: btnHover ? `${COLORS.GREEN}22` : 'transparent',
            color: COLORS.GREEN,
            border: `2px solid ${COLORS.GREEN}`,
            cursor: 'pointer',
            letterSpacing: 3, textTransform: 'uppercase',
            boxShadow: btnHover
              ? `0 0 24px ${COLORS.GREEN}88, inset 0 0 20px ${COLORS.GREEN}30`
              : `0 0 12px ${COLORS.GREEN}55, inset 0 0 12px ${COLORS.GREEN}20`,
            transition: 'all 0.15s ease',
            textShadow: `0 0 10px ${COLORS.GREEN}`,
          }}
        >
          INSTALL NOW
        </button>

        <div style={{ fontSize: 9, color: '#444', fontFamily: FONT }}>(you already did)</div>

        <div style={{ position: 'absolute', bottom: 14, fontSize: 9, color: '#333', fontFamily: FONT }}>
          Level 1 of 9,473 · No IAP · No Ads
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    width: '100%', height: '100%',
    background: '#000', position: 'relative', overflow: 'hidden',
  },
  scanlines: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00000018 2px, #00000018 3px)',
    pointerEvents: 'none', zIndex: 1,
  },
};
