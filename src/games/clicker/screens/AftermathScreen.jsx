import { useEffect, useState } from 'react';
import { formatNumber } from '../game/constants.js';
import { AFTERMATH_LINES } from '../copy/banks.js';

// The ending. Not playable — a quiet scene the player sits with.
// Painterly SVG placeholder (real art can swap in later): dawn light over
// desolation, a chipped glass, a mask, and one small green tree — the only
// saturated thing left.
function AftermathArt() {
  return (
    <svg
      className="clicker-aftermath-art"
      viewBox="0 0 1000 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aftermath-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3f52" />
          <stop offset="55%" stopColor="#8a7a6d" />
          <stop offset="78%" stopColor="#c9a279" />
          <stop offset="100%" stopColor="#e0bb8e" />
        </linearGradient>
        <linearGradient id="aftermath-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a5048" />
          <stop offset="100%" stopColor="#36302b" />
        </linearGradient>
        <radialGradient id="aftermath-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f5dcae" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f5dcae" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky + low dawn sun */}
      <rect width="1000" height="360" fill="url(#aftermath-sky)" />
      <circle cx="720" cy="330" r="130" fill="url(#aftermath-sun)" />

      {/* ground */}
      <rect y="340" width="1000" height="160" fill="url(#aftermath-ground)" />
      <path d="M0 345 Q 250 330 500 342 T 1000 338 V 360 H 0 Z" fill="#4a423a" opacity="0.7" />

      {/* distant ruins — faded silhouettes */}
      <g fill="#3d3a45" opacity="0.45">
        <rect x="80" y="280" width="34" height="62" />
        <rect x="130" y="300" width="22" height="42" />
        <rect x="840" y="288" width="40" height="54" />
        <rect x="905" y="305" width="18" height="37" />
      </g>

      {/* the chipped glass — center, worn but whole */}
      <g transform="translate(470, 352)">
        <path
          d="M0 0 L6 46 Q 30 56 54 46 L60 0 L52 0 L30 6 L8 0 Z"
          fill="#b8c4c9"
          opacity="0.85"
        />
        {/* chip */}
        <path d="M48 0 L60 0 L55 9 Z" fill="#36302b" />
        {/* faint shine */}
        <path d="M10 6 L14 40 L20 42 L15 7 Z" fill="#e8f0f2" opacity="0.5" />
      </g>

      {/* the mask, resting beside the glass */}
      <g transform="translate(560, 388) rotate(12)">
        <ellipse cx="0" cy="0" rx="26" ry="34" fill="#c9b896" opacity="0.9" />
        <ellipse cx="-9" cy="-7" rx="5" ry="7" fill="#36302b" />
        <ellipse cx="9" cy="-7" rx="5" ry="7" fill="#36302b" />
        <path d="M-9 14 Q 0 20 9 14" stroke="#36302b" strokeWidth="2.5" fill="none" />
      </g>

      {/* the tree — small, distant, the only saturated color */}
      <g transform="translate(255, 305)">
        <rect x="-2.5" y="14" width="5" height="26" fill="#5a4632" />
        <circle cx="0" cy="6" r="17" fill="#3f9d4e" />
        <circle cx="-11" cy="13" r="11" fill="#46ad57" />
        <circle cx="11" cy="13" r="11" fill="#379147" />
      </g>
    </svg>
  );
}

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

export default function AftermathScreen({ stats, currencyName, runNumber, onPlayAgain }) {
  // Lines fade in one at a time, then the epitaph, then the buttons.
  const [revealed, setRevealed] = useState(0);
  // The run ended when this screen mounted — snapshot once.
  const [endedAt] = useState(() => Date.now());

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setRevealed(1), 1800),
      setTimeout(() => setRevealed(2), 5300),
      setTimeout(() => setRevealed(3), 8200),
    ];
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const runTime = formatDuration(endedAt - (stats?.startedAt ?? endedAt));
  const peak = formatNumber(Math.floor(stats?.peakCurrency ?? 0));
  const clicks = (stats?.totalClicks ?? 0).toLocaleString();

  const epitaph = [
    `Peak fortune: ${peak} ${currencyName}`,
    `Clicks of honest labor: ${clicks}`,
    `Time before the end: ${runTime}`,
    `Final balance: 0`,
  ];

  const copyEpitaph = () => {
    const text = [
      'I survived the entire crypto cycle. goofs.io/clicker',
      ...epitaph,
    ].join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="clicker-aftermath">
      <AftermathArt />

      <div className="clicker-aftermath-content">
        {AFTERMATH_LINES.map((line, i) => (
          <p
            key={i}
            className={`clicker-aftermath-line${revealed > i ? ' visible' : ''}`}
          >
            {line}
          </p>
        ))}

        <div className={`clicker-aftermath-epitaph${revealed > 2 ? ' visible' : ''}`}>
          {epitaph.map(line => (
            <div key={line}>{line}</div>
          ))}

          <div className="clicker-aftermath-actions">
            <button type="button" className="clicker-aftermath-btn" onClick={onPlayAgain}>
              {runNumber > 1 ? `BEGIN AGAIN (RUN ${runNumber})` : 'BEGIN AGAIN'}
            </button>
            <button type="button" className="clicker-aftermath-btn subtle" onClick={copyEpitaph}>
              COPY EPITAPH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
