import { useState, useEffect } from 'react';
import { audio } from '../sound/audio.js';

const WIN98_FONT = "'Courier New', monospace";

// ── Shared Win98 title bar ────────────────────────────────────────────────────
function TitleBar({ title, onClose }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #000080, #1084d0)',
      color: '#fff', padding: '3px 4px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontWeight: 'bold', fontSize: 11, fontFamily: WIN98_FONT,
      userSelect: 'none',
    }}>
      <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
        {title}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{
          background: '#C0C0C0', border: '1px outset #fff',
          width: 16, height: 14, fontSize: 10, fontWeight: 'bold',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 0, color: '#000', flexShrink: 0,
        }}
      >✕</button>
    </div>
  );
}

// ── Base Win98 window shell ───────────────────────────────────────────────────
function Win98Window({ x, y, width = 210, title, children, onClose, extra }) {
  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: 'absolute', left: x, top: y, width,
      background: '#C0C0C0', border: '2px outset #dfdfdf',
      boxShadow: '2px 2px 0 #000, inset 1px 1px 0 #fff',
      fontFamily: WIN98_FONT, fontSize: 11, zIndex: 100,
      transition: 'left 0.1s ease-out, top 0.1s ease-out',
      userSelect: 'none', imageRendering: 'auto',
    }}>
      <TitleBar title={title} onClose={onClose} />
      {children}
      {extra}
    </div>
  );
}

// ── Basic popup ───────────────────────────────────────────────────────────────
function BasicPopup({ popup, onClose }) {
  return (
    <Win98Window x={popup.x} y={popup.y} title={popup.title} onClose={onClose}>
      <div style={{ padding: '10px 10px 6px', color: '#000', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
        {popup.body}
      </div>
      <div style={{ padding: '4px 10px 8px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={e => { e.stopPropagation(); onClose(); }} style={S.btn98}>
          {popup.btn}
        </button>
      </div>
    </Win98Window>
  );
}

// ── Dodger popup (Basic that dodges when X is clicked) ───────────────────────
// Dodging is handled by popups.js / closePopup — same JSX as Basic
const DodgerPopup = BasicPopup;

// ── Decoy popup (extra buttons that spawn new Basic popups) ──────────────────
function DecoyPopup({ popup, onClose, onDecoyBtn }) {
  return (
    <Win98Window x={popup.x} y={popup.y} title={popup.title} onClose={onClose}>
      <div style={{ padding: '10px 10px 6px', color: '#000', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
        {popup.body}
      </div>
      <div style={{ padding: '4px 10px 8px', display: 'flex', justifyContent: 'center', gap: 6 }}>
        {['OK', 'Cancel', 'Maybe'].map(label => (
          <button key={label} onClick={e => { e.stopPropagation(); audio.sfxWrongButton(); onDecoyBtn(); }} style={S.btn98}>
            {label}
          </button>
        ))}
      </div>
    </Win98Window>
  );
}

// ── Splitter popup (closing it spawns 2 Basic popups) ────────────────────────
function SplitterPopup({ popup, onClose }) {
  return (
    <Win98Window x={popup.x} y={popup.y} title="⚠️ CRITICAL ERROR" onClose={onClose}>
      <div style={{ padding: '10px 10px 6px', color: '#000', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
        {'CRITICAL FAILURE\nClosing this will spawn\n2 additional dialogs.'}
      </div>
      <div style={{ padding: '4px 10px 8px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={e => { e.stopPropagation(); onClose(); }} style={{ ...S.btn98, background: '#ffaaaa' }}>
          Close Anyway
        </button>
      </div>
    </Win98Window>
  );
}

// ── Boss popup (full-screen fake desktop) ────────────────────────────────────
const BOSS_WINDOWS = [
  { title: 'NOT THIS ONE', body: 'Wrong window.\nKeep looking.' },
  { title: 'NOPE', body: "Still wrong.\nYou're not even close." },
  { title: 'lol no', body: "Absolutely not.\nTry the other one." },
  { title: 'CLOSE ME TO WIN', body: 'JK this one does nothing.\nGood luck.' },
];

function BossPopup({ onClose }) {
  const [correctIdx] = useState(() => Math.floor(Math.random() * 5));
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => { audio.sfxBossPopup(); }, []);

  const allWindows = [
    ...BOSS_WINDOWS,
    { title: '⚠️ FINAL WARNING', body: 'This is the one.\nClose this window\nto stop the infection.' },
  ];

  const positions = [
    { x: 20,  y: 60  },
    { x: 140, y: 40  },
    { x: 60,  y: 200 },
    { x: 180, y: 180 },
    { x: 100, y: 320 },
  ];

  const handleClose = (idx) => {
    audio.sfxPopupDismiss();
    if (idx === correctIdx) {
      onClose();
    } else {
      audio.sfxWrongButton();
      setDismissed(prev => [...prev, idx]);
    }
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: '#008080',
        backgroundImage: 'repeating-linear-gradient(45deg, #007070 0px, #007070 1px, transparent 0px, transparent 50%)',
        backgroundSize: '10px 10px',
      }}
    >
      <div style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        fontFamily: WIN98_FONT, fontSize: 10, color: '#fff', opacity: 0.7,
        whiteSpace: 'nowrap',
      }}>
        FIND THE REAL CLOSE BUTTON
      </div>

      {allWindows.map((w, idx) => {
        if (dismissed.includes(idx)) return null;
        const pos = positions[idx] || { x: 50, y: 100 };
        const isCorrect = idx === correctIdx;
        return (
          <div key={idx} onClick={e => e.stopPropagation()} style={{
            position: 'absolute', left: pos.x, top: pos.y, width: 170,
            background: '#C0C0C0', border: `2px outset ${isCorrect ? '#ffffaa' : '#dfdfdf'}`,
            boxShadow: isCorrect ? '0 0 8px #ffff00, 2px 2px 0 #000' : '2px 2px 0 #000',
            fontFamily: WIN98_FONT, fontSize: 11, userSelect: 'none',
          }}>
            <div style={{
              background: isCorrect
                ? 'linear-gradient(90deg, #800000, #cc2200)'
                : 'linear-gradient(90deg, #000080, #1084d0)',
              color: '#fff', padding: '3px 4px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontWeight: 'bold', fontSize: 11,
            }}>
              <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {w.title}
              </span>
              <button onClick={() => handleClose(idx)} style={{
                background: '#C0C0C0', border: '1px outset #fff',
                width: 16, height: 14, fontSize: 10, fontWeight: 'bold',
                cursor: 'pointer', padding: 0, color: '#000', flexShrink: 0,
              }}>✕</button>
            </div>
            <div style={{ padding: '8px', color: '#000', whiteSpace: 'pre-line', fontSize: 10, lineHeight: 1.4 }}>
              {w.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Win98Popup({ popup, onClose, onDecoyBtn }) {
  if (popup.tier === 'boss') return <BossPopup onClose={onClose} />;
  if (popup.tier === 'splitter') return <SplitterPopup popup={popup} onClose={onClose} />;
  if (popup.tier === 'decoy') return <DecoyPopup popup={popup} onClose={onClose} onDecoyBtn={onDecoyBtn} />;
  // basic + dodger share the same JSX — dodging logic is in popups.js
  return <BasicPopup popup={popup} onClose={onClose} />;
}

const S = {
  btn98: {
    background: '#C0C0C0', border: '2px outset #fff',
    padding: '2px 14px', fontSize: 11, cursor: 'pointer',
    fontFamily: WIN98_FONT, color: '#000',
  },
};
