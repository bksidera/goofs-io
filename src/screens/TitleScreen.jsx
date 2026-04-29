import { useRef, useEffect, useState } from 'react';
import { FONT, GAME_WIDTH, GAME_HEIGHT } from '../game/constants.js';
import { drawPlayer } from '../rendering/player.js';

export default function TitleScreen({ onStart }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(0);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let raf;
    const draw = () => {
      frameRef.current++;
      ctx.clearRect(0, 0, 120, 80);
      drawPlayer(ctx, 60, 50, frameRef.current);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.scanlines} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4, padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#00F0FF', fontFamily: FONT, letterSpacing: 4, opacity: 0.4 }}>
          ⚠️ THIS IS AN AD ⚠️
        </div>

        <canvas
          ref={canvasRef}
          width={120} height={80}
          style={{ imageRendering: 'pixelated', width: 120, height: 80, margin: '8px 0' }}
        />

        <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', fontFamily: FONT, lineHeight: 1, letterSpacing: -1, textShadow: '0 0 20px #FF2D95, 0 0 40px #FF2D95, 3px 3px 0 #FF2D9555' }}>
          AdGame
          <span style={{ color: '#00F0FF', textShadow: '0 0 20px #00F0FF, 0 0 40px #00F0FF, 3px 3px 0 #00F0FF44' }}>
            .exe
          </span>
        </div>

        <div style={{ fontSize: 11, color: '#FFD700', fontFamily: FONT, opacity: 0.7, fontStyle: 'italic', marginTop: 2 }}>
          The game from the ad that doesn't exist.
        </div>
        <div style={{ fontSize: 10, color: '#00F0FF', fontFamily: FONT, opacity: 0.5 }}>
          Except now it does.
        </div>

        <button
          onClick={onStart}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            marginTop: 28, padding: '13px 40px', fontSize: 17, fontWeight: 900,
            fontFamily: FONT, background: btnHover ? '#FF2D9522' : 'transparent',
            color: '#FF2D95', border: '2px solid #FF2D95', cursor: 'pointer',
            letterSpacing: 3, textTransform: 'uppercase',
            boxShadow: btnHover
              ? '0 0 24px #FF2D9560, inset 0 0 20px #FF2D9520'
              : '0 0 12px #FF2D9530, inset 0 0 12px #FF2D9510',
            transition: 'all 0.15s ease',
          }}
        >
          INSTALL NOW
        </button>

        <div style={{ fontSize: 9, color: '#444', fontFamily: FONT }}>(you already did)</div>

        <div style={{ position: 'absolute', bottom: 14, fontSize: 9, color: '#222', fontFamily: FONT }}>
          Level 1 of 9,473 · No IAP · No Ads
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    width: '100%', height: '100%',
    background: '#080816', position: 'relative', overflow: 'hidden',
  },
  scanlines: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00000010 2px, #00000010 3px)',
    pointerEvents: 'none', zIndex: 1,
  },
};
