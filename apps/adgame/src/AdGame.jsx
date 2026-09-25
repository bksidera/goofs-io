import { useState, useCallback, useEffect } from 'react';
import { GAME_WIDTH, GAME_HEIGHT } from './game/constants.js';
import { LOADING_MSGS } from './copy/banks.js';

import LoadingScreen from './screens/LoadingScreen.jsx';
import TitleScreen   from './screens/TitleScreen.jsx';
import GameScreen    from './screens/GameScreen.jsx';
import DeathScreen   from './screens/DeathScreen.jsx';

/*
 * AdGame.exe — endless runner. There is no win screen; the game's shape is
 * survive-until-you-can't. Every run reports back to DeathScreen, which
 * shows the score, longest / peak / high-score deltas, and hands you back
 * to Title. No mode picker: endless is the only mode.
 */
export default function AdGame() {
  const [screen,      setScreen]      = useState('loading');
  const [loadingStep, setLoadingStep] = useState(0);
  const [deathData,   setDeathData]   = useState(null);

  // Boot sequence — a beat of nostalgia, then the game.
  useEffect(() => {
    if (screen !== 'loading') return;
    const t = setInterval(() => {
      setLoadingStep((s) => {
        if (s >= LOADING_MSGS.length - 1) {
          clearInterval(t);
          setTimeout(() => setScreen('title'), 500);
          return s;
        }
        return s + 1;
      });
    }, 450);
    return () => clearInterval(t);
  }, [screen]);

  const handleDeath = useCallback((summary) => {
    setDeathData(summary);
    setScreen('death');
  }, []);

  const handleStart = useCallback(() => setScreen('game'), []);
  const handleRetry = useCallback(() => setScreen('game'), []);
  const handleMenu  = useCallback(() => setScreen('title'), []);

  return (
    <div style={rootStyle}>
      {screen === 'loading' && (
        <Centered><LoadingScreen step={loadingStep} /></Centered>
      )}
      {screen === 'title' && (
        <Centered><TitleScreen onStart={handleStart} /></Centered>
      )}
      {screen === 'death' && (
        <Centered>
          <DeathScreen data={deathData} onRetry={handleRetry} onMenu={handleMenu} />
        </Centered>
      )}
      {screen === 'game' && (
        <GameScreen onDeath={handleDeath} mode="endless" />
      )}
    </div>
  );
}

// Center + scale the 360×640 game box for non-game screens.
function Centered({ children }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () =>
      setScale(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return (
    <div style={centeredWrapStyle}>
      <div
        style={{
          ...centeredBoxStyle,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const rootStyle = {
  width: '100vw',
  height: '100svh',
  background: '#000',
  overflow: 'hidden',
};

const centeredWrapStyle = {
  width: '100vw',
  height: '100svh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const centeredBoxStyle = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  transformOrigin: 'center center',
  position: 'relative',
  borderRadius: 4,
  overflow: 'hidden',
  boxShadow: '0 0 30px #00FF4130, 0 0 60px #FF2D9510',
};
