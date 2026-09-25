import { useState, useEffect } from 'react';
import { FONT } from '../game/constants.js';

// The irony peak: a fake rewarded ad inside the game that is itself a fake ad.
// The "ads" promote goofs.io's own games. The X doesn't work until the
// countdown ends, because of course it doesn't.

const HOUSE_ADS = [
  {
    title: 'CHOMP',
    tagline: 'A very good boy vs. four ghosts',
    cta: 'PLAY FREE — NO STEAKS REQUIRED*',
    art: '🐕🥩👻',
    color: '#D99A4E',
  },
  {
    title: 'CRYPTO CLICKER',
    tagline: 'Mine the bubble. Survive the apocalypse.',
    cta: 'NUMBER GOES UP (THEN TO ZERO)',
    art: '💧🍷💎',
    color: '#F2C75C',
  },
];

const AD_SECS = 5;

export default function ReviveAd({ onAccept, onDecline }) {
  const [phase, setPhase] = useState('offer'); // 'offer' → 'watching'
  const [secsLeft, setSecsLeft] = useState(AD_SECS);
  const [xShake, setXShake] = useState(false);
  const [ad] = useState(() => HOUSE_ADS[Math.floor(Math.random() * HOUSE_ADS.length)]);

  useEffect(() => {
    if (phase !== 'watching') return;
    const id = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleX = () => {
    if (secsLeft > 0) {
      // The X is decorative until the ad is done. A proud industry tradition.
      setXShake(true);
      setTimeout(() => setXShake(false), 350);
    } else {
      onAccept();
    }
  };

  if (phase === 'offer') {
    return (
      <div style={S.backdrop}>
        <div style={S.offerBox}>
          <div style={{ fontSize: 11, color: '#FF0040', fontFamily: FONT, letterSpacing: 3 }}>
            ⚠ SIGNAL LOST ⚠
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: FONT, margin: '6px 0' }}>
            YOU DIED
          </div>
          <div style={{ fontSize: 11, color: '#999', fontFamily: FONT, lineHeight: 1.6, maxWidth: 240 }}>
            But what if… you didn't?
          </div>

          <button onClick={() => setPhase('watching')} style={S.watchBtn}>
            ▶ WATCH AN AD TO CONTINUE
          </button>
          <div style={{ fontSize: 9, color: '#555', fontFamily: FONT }}>
            (yes, an ad inside the ad)
          </div>

          <button onClick={onDecline} style={S.declineBtn}>
            ACCEPT DEATH
          </button>
        </div>
      </div>
    );
  }

  // watching phase — the fake unskippable house ad
  return (
    <div style={S.backdrop}>
      <div style={{ ...S.adBox, borderColor: ad.color }}>
        {/* fake ad chrome */}
        <div style={S.adChrome}>
          <span style={{ fontSize: 9, color: '#777', fontFamily: FONT }}>
            Ad · {secsLeft > 0 ? `Reward in ${secsLeft}s` : 'Reward ready!'}
          </span>
          <button
            onClick={handleX}
            style={{
              ...S.adX,
              color: secsLeft > 0 ? '#444' : '#fff',
              borderColor: secsLeft > 0 ? '#333' : '#fff',
              transform: xShake ? 'translateX(3px)' : 'none',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: 44, margin: '18px 0 6px', letterSpacing: 6 }}>{ad.art}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: ad.color, fontFamily: FONT, textShadow: `0 0 16px ${ad.color}66` }}>
          {ad.title}
        </div>
        <div style={{ fontSize: 11, color: '#aaa', fontFamily: FONT, fontStyle: 'italic', margin: '6px 0 14px' }}>
          {ad.tagline}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 900, color: '#000', fontFamily: FONT,
          background: ad.color, padding: '10px 18px', letterSpacing: 1,
        }}>
          {ad.cta}
        </div>
        <div style={{ fontSize: 8, color: '#444', fontFamily: FONT, marginTop: 12 }}>
          *both games are on this very website. the ad worked.
        </div>

        {/* progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: '#222' }}>
          <div style={{
            height: '100%', background: ad.color,
            width: `${((AD_SECS - secsLeft) / AD_SECS) * 100}%`,
            transition: 'width 1s linear',
          }} />
        </div>
      </div>

      {secsLeft === 0 && (
        <button onClick={onAccept} style={S.claimBtn}>
          CLAIM REVIVE ✓
        </button>
      )}
    </div>
  );
}

const S = {
  backdrop: {
    position: 'absolute', inset: 0, zIndex: 400,
    background: '#000000f2',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  offerBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    textAlign: 'center', padding: 30,
  },
  watchBtn: {
    marginTop: 14, padding: '14px 26px', fontSize: 14, fontWeight: 900,
    fontFamily: FONT, background: '#39FF14', color: '#000',
    border: 'none', cursor: 'pointer', letterSpacing: 2,
  },
  declineBtn: {
    marginTop: 14, padding: '8px 20px', fontSize: 10,
    fontFamily: FONT, background: 'transparent', color: '#666',
    border: '1px solid #333', cursor: 'pointer', letterSpacing: 2,
  },
  adBox: {
    position: 'relative', width: 280, paddingBottom: 24,
    background: '#0a0a12', border: '2px solid',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', overflow: 'hidden',
  },
  adChrome: {
    width: '100%', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '6px 8px', boxSizing: 'border-box',
    background: '#111',
  },
  adX: {
    background: 'transparent', border: '1px solid',
    fontSize: 12, cursor: 'pointer', padding: '1px 6px',
    fontFamily: FONT, transition: 'transform 0.1s',
  },
  claimBtn: {
    padding: '12px 30px', fontSize: 14, fontWeight: 900,
    fontFamily: FONT, background: '#39FF14', color: '#000',
    border: 'none', cursor: 'pointer', letterSpacing: 2,
  },
};
