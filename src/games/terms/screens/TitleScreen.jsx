import { useEffect, useRef, useState } from 'react';
import { GAME_WIDTH, GAME_HEIGHT, FONT, COLORS } from '../game/constants.js';
import { getHighScore, isCampaignCleared } from '../game/scoring.js';
import { TITLE_LINES } from '../copy/banks.js';

export default function TitleScreen({ onStart }) {
  const canvasRef = useRef(null);
  const [highScore] = useState(() => getHighScore());
  const [unlocked] = useState(() => isCampaignCleared());
  const [line] = useState(() => TITLE_LINES[Math.floor(Math.random() * TITLE_LINES.length)]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame++;
      ctx.fillStyle = '#07100F';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#F4F7F312';
      for (let i = 0; i < 18; i++) {
        const y = 70 + i * 25;
        const x = 28 + Math.sin(frame * 0.018 + i) * 16;
        ctx.fillRect(x, y, 300 - (i % 4) * 40, 8);
      }
      ctx.strokeStyle = '#4DE1C155';
      ctx.strokeRect(22, 64, GAME_WIDTH - 44, 440);
      ctx.fillStyle = '#FF3B4F22';
      ctx.fillRect(198 + Math.sin(frame * 0.03) * 14, 418, 128, 38);
      ctx.fillStyle = '#4DE1C133';
      ctx.fillRect(34 + Math.cos(frame * 0.027) * 18, 418, 128, 38);
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = COLORS.TEAL;
      ctx.fillText('Reject All', 60, 442);
      ctx.fillStyle = COLORS.RED;
      ctx.fillText('Accept All', 226, 442);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="terms-shell">
      <div className="terms-box title">
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} />
        <div className="terms-title-layer">
          <div className="terms-title-kicker">PREFERENCE CENTER</div>
          <h1>Terms & Conditions</h1>
          <p>{line}</p>
          <button className="terms-start" onClick={() => onStart('campaign')}>Decline Campaign</button>
          {unlocked && (
            <button className="terms-secondary" onClick={() => onStart('endless')}>Auto-Renewal</button>
          )}
          <div className="terms-title-score">BEST {highScore.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
