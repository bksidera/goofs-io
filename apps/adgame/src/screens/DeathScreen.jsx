import { useState } from 'react';
import { FONT, COLORS } from '../game/constants.js';
import { DEATH_LINES, VICTORY_LINES } from '../copy/banks.js';
import { randomFrom } from '../utils/helpers.js';
import { getHighScore } from '../game/scoring.js';

export default function DeathScreen({ data, onRetry, onMenu }) {
  const victory = data.victory;
  // Stable line — picked once on mount, never re-rolled
  const [line] = useState(() => randomFrom(victory ? VICTORY_LINES : DEATH_LINES));
  const highScore = getHighScore();
  const isNewBest = data.score >= highScore;

  const headColor = victory ? COLORS.GOLD : COLORS.RED;
  const levelLabel = data.mode === 'endless'
    ? `${data.level}s` // endless reports survival seconds
    : `${data.level}/9`;

  return (
    <div style={S.wrap}>
      <div style={S.scanlines} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, padding: 30, textAlign: 'center' }}>

        <div style={{ fontSize: 11, color: headColor, fontFamily: FONT, letterSpacing: 3 }}>
          {victory ? '★ CAMPAIGN COMPLETE ★' : '⚠ FATAL ERROR ⚠'}
        </div>

        <div style={{ fontSize: 30, fontWeight: 900, color: headColor, fontFamily: FONT, textShadow: `0 0 20px ${headColor}55, 3px 3px 0 ${headColor}33` }}>
          {victory ? 'ALL ADS WATCHED' : 'GAME OVER'}
        </div>

        <div style={{ fontSize: 12, color: COLORS.PINK, fontFamily: FONT, maxWidth: 270, lineHeight: 1.5 }}>
          {line}
        </div>

        {victory && (
          <div style={{ fontSize: 10, color: COLORS.GREEN, fontFamily: FONT, letterSpacing: 1 }}>
            INFINITE SCROLL MODE UNLOCKED
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', gap: 22, fontSize: 11, fontFamily: FONT }}>
          {[
            [data.mode === 'endless' ? 'SURVIVED' : 'AD', levelLabel, COLORS.GREEN],
            ['PEAK',  data.peak,  COLORS.GOLD],
            ['SCORE', data.score, COLORS.PINK],
          ].map(([label, val, color]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: 9 }}>{label}</div>
              <div style={{ color, fontSize: 20, fontWeight: 900, textShadow: `0 0 8px ${color}55` }}>
                {typeof val === 'number' ? val.toLocaleString() : val}
              </div>
            </div>
          ))}
        </div>

        {isNewBest && (
          <div style={{ fontSize: 11, color: COLORS.GOLD, fontFamily: FONT, letterSpacing: 2, textShadow: `0 0 10px ${COLORS.GOLD}66` }}>
            ★ NEW BEST ★
          </div>
        )}

        {!isNewBest && (
          <div style={{ fontSize: 9, color: '#333', fontFamily: FONT }}>
            BEST: {highScore.toLocaleString()}
          </div>
        )}

        <button
          onClick={onRetry}
          style={{
            marginTop: 20, padding: '13px 40px', fontSize: 17, fontWeight: 900,
            fontFamily: FONT, background: 'transparent', color: COLORS.GREEN,
            border: `2px solid ${COLORS.GREEN}`, cursor: 'pointer', letterSpacing: 3,
            textTransform: 'uppercase',
            boxShadow: `0 0 12px ${COLORS.GREEN}55, inset 0 0 12px ${COLORS.GREEN}20`,
            textShadow: `0 0 8px ${COLORS.GREEN}`,
          }}
        >
          {victory ? 'RUN IT BACK' : 'RETRY (FREE)'}
        </button>

        {onMenu && (
          <button
            onClick={onMenu}
            style={{
              padding: '8px 20px', fontSize: 10, fontFamily: FONT,
              background: 'transparent', color: '#666',
              border: '1px solid #333', cursor: 'pointer', letterSpacing: 2,
            }}
          >
            MAIN MENU
          </button>
        )}

        <div style={{ fontSize: 9, color: '#333', fontFamily: FONT }}>
          No in-app purchases were harmed in the making of this score
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
