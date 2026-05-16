import { FONT, COLORS } from '../game/constants.js';
import { LOADING_MSGS } from '../copy/banks.js';

export default function LoadingScreen({ step }) {
  return (
    <div style={S.wrap}>
      <div style={S.scanlines} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, padding: 40 }}>
        <div style={{ fontSize: 11, color: COLORS.GREEN, fontFamily: FONT, letterSpacing: 3, opacity: 0.7 }}>
          INITIALIZING AdGame.exe
        </div>
        <div style={{ width: '65%', height: 6, background: '#001a08', border: `1px solid ${COLORS.GREEN_DEEP}`, overflow: 'hidden' }}>
          <div style={{
            width: `${((step + 1) / LOADING_MSGS.length) * 100}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${COLORS.GREEN}, ${COLORS.PINK})`,
            transition: 'width 0.3s',
            boxShadow: `0 0 8px ${COLORS.GREEN}`,
          }} />
        </div>
        <div style={{ fontSize: 15, color: COLORS.GREEN, fontFamily: FONT, textAlign: 'center', textShadow: `0 0 10px ${COLORS.GREEN}` }}>
          {LOADING_MSGS[step]}
        </div>
        <div style={{ fontSize: 9, color: '#2a2a2a', fontFamily: FONT, marginTop: 20 }}>
          v1.0.0 — not_a_virus.exe
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
