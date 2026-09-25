import { useState } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants.js';
import { getHighScore } from '../game/scoring.js';
import { FAIL_LINES, WIN_LINES } from '../copy/banks.js';

export default function ResultScreen({ result, onRetry, onMenu }) {
  const victory = !!result?.victory;
  const pool = victory ? WIN_LINES : FAIL_LINES;
  const [line] = useState(() => result?.punchline || pool[Math.floor(Math.random() * pool.length)]);
  const high = getHighScore();

  return (
    <div className="terms-shell">
      <div className={`terms-box result ${victory ? 'victory' : ''}`} style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        <div className="terms-result-panel">
          <div className="terms-title-kicker">{victory ? 'CAMPAIGN COMPLETE' : 'CONSENT ACQUIRED'}</div>
          <h1>{victory ? 'Declined Everything' : 'Terms Accepted'}</h1>
          <p>{line}</p>
          <div className="terms-result-stats">
            <div><span>SCORE</span><strong>{(result?.score || 0).toLocaleString()}</strong></div>
            <div><span>REJECTED</span><strong>{result?.rejections || 0}</strong></div>
            <div><span>{result?.mode === 'endless' ? 'SECONDS' : 'STAGE'}</span><strong>{result?.stageNumber || 1}</strong></div>
          </div>
          <div className="terms-title-score">BEST {high.toLocaleString()}</div>
          <button className="terms-start" onClick={onRetry}>Try Again</button>
          <button className="terms-secondary" onClick={onMenu}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}
