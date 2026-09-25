import { useState } from 'react';
import { FONT, COLORS } from '../game/constants.js';
import { DEATH_LINES } from '../copy/banks.js';
import { randomFrom } from '../utils/helpers.js';

/*
 * Death screen — endless-only. There is no win path. Every run ends here.
 * The screen shows the run's stats vs the all-time best and lets you retry
 * or crawl back to the menu.
 *
 * `data` shape (from finalizeRun in game/scoring.js):
 *   { score, secs, peak, runs,
 *     isNewHigh, isNewLongest, isNewPeak,
 *     best: { score, secs, peak } }
 */
export default function DeathScreen({ data, onRetry, onMenu }) {
  // Stable line — picked once, never re-rolled.
  const [line] = useState(() => randomFrom(DEATH_LINES));
  const anyNew = data.isNewHigh || data.isNewLongest || data.isNewPeak;

  return (
    <div style={S.wrap}>
      <div style={S.scanlines} />
      <div style={S.stack}>

        <div style={S.errBanner}>⚠ FATAL ERROR ⚠</div>

        <div style={S.gameOver}>GAME OVER</div>

        <div style={S.line}>{line}</div>

        <div style={S.stats}>
          <StatCell
            label="SCORE"
            value={fmt(data.score)}
            best={fmt(data.best.score)}
            color={COLORS.PINK}
            newBest={data.isNewHigh}
          />
          <StatCell
            label="TIME"
            value={secs(data.secs)}
            best={secs(data.best.secs)}
            color={COLORS.GREEN}
            newBest={data.isNewLongest}
          />
          <StatCell
            label="PEAK"
            value={fmt(data.peak)}
            best={fmt(data.best.peak)}
            color={COLORS.GOLD}
            newBest={data.isNewPeak}
          />
        </div>

        {anyNew && (
          <div style={S.newBestPulse}>
            ★ NEW BEST{newBestLabel(data)} ★
          </div>
        )}

        <button
          onClick={onRetry}
          style={S.retryBtn}
          autoFocus
        >
          RUN IT BACK
        </button>

        {onMenu && (
          <button onClick={onMenu} style={S.menuBtn}>
            MAIN MENU
          </button>
        )}

        <div style={S.footer}>
          run {data.runs.toLocaleString()} · no revives · no refunds · no ads
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, best, color, newBest }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 68 }}>
      <div style={{ color: '#555', fontSize: 9, letterSpacing: 2 }}>{label}</div>
      <div style={{
        color, fontSize: 20, fontWeight: 900, fontFamily: FONT,
        textShadow: `0 0 10px ${color}66`,
      }}>{value}</div>
      <div style={{
        color: newBest ? color : '#333',
        fontSize: 8, letterSpacing: 1, fontFamily: FONT,
        marginTop: 2,
      }}>
        {newBest ? '↑ best' : `best ${best}`}
      </div>
    </div>
  );
}

function newBestLabel(d) {
  const parts = [];
  if (d.isNewHigh)    parts.push(' SCORE');
  if (d.isNewLongest) parts.push(' TIME');
  if (d.isNewPeak)    parts.push(' PEAK');
  return parts.join(' +');
}

function fmt(n) { return typeof n === 'number' ? n.toLocaleString() : n; }
function secs(s) {
  if (!s) return '0s';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}m ${rest.toString().padStart(2, '0')}s`;
}

const S = {
  wrap: {
    width: '100%', height: '100%',
    background: '#000', position: 'relative', overflow: 'hidden',
  },
  scanlines: {
    position: 'absolute', inset: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00000018 2px, #00000018 3px)',
    pointerEvents: 'none', zIndex: 1,
  },
  stack: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', gap: 10, padding: 30, textAlign: 'center',
  },
  errBanner: {
    fontSize: 11, color: COLORS.RED, fontFamily: FONT, letterSpacing: 3,
  },
  gameOver: {
    fontSize: 34, fontWeight: 900, color: COLORS.RED, fontFamily: FONT,
    letterSpacing: -1, lineHeight: 1,
    textShadow: `0 0 20px ${COLORS.RED}66, 3px 3px 0 ${COLORS.RED}33`,
  },
  line: {
    fontSize: 12, color: COLORS.PINK, fontFamily: FONT,
    maxWidth: 280, lineHeight: 1.5, marginTop: 2,
  },
  stats: {
    marginTop: 20,
    display: 'flex', gap: 20, alignItems: 'flex-start',
  },
  newBestPulse: {
    fontSize: 11, color: COLORS.GOLD, fontFamily: FONT,
    letterSpacing: 2,
    textShadow: `0 0 12px ${COLORS.GOLD}88`,
    animation: 'newBestPulse 1.1s ease-in-out infinite',
  },
  retryBtn: {
    marginTop: 20, padding: '13px 40px', fontSize: 17, fontWeight: 900,
    fontFamily: FONT, background: 'transparent', color: COLORS.GREEN,
    border: `2px solid ${COLORS.GREEN}`, cursor: 'pointer', letterSpacing: 3,
    textTransform: 'uppercase',
    boxShadow: `0 0 12px ${COLORS.GREEN}55, inset 0 0 12px ${COLORS.GREEN}20`,
    textShadow: `0 0 8px ${COLORS.GREEN}`,
  },
  menuBtn: {
    padding: '8px 20px', fontSize: 10, fontFamily: FONT,
    background: 'transparent', color: '#666',
    border: '1px solid #333', cursor: 'pointer', letterSpacing: 2,
  },
  footer: {
    fontSize: 9, color: '#333', fontFamily: FONT, letterSpacing: 1,
  },
};
