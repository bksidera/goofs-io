import { useState, useCallback } from 'react';
import { GAME_WIDTH, GAME_HEIGHT, FONT } from './game/constants.js';
import { LOADING_MSGS } from './copy/banks.js';
import { useEffect } from 'react';

import LoadingScreen from './screens/LoadingScreen.jsx';
import TitleScreen   from './screens/TitleScreen.jsx';
import GameScreen    from './screens/GameScreen.jsx';
import DeathScreen   from './screens/DeathScreen.jsx';

export default function AdGameExe() {
  const [screen,      setScreen]      = useState('loading');
  const [loadingStep, setLoadingStep] = useState(0);
  const [deathData,   setDeathData]   = useState({ score: 0, wave: 1, peak: 100 });

  // Loading sequence
  useEffect(() => {
    if (screen !== 'loading') return;
    const t = setInterval(() => {
      setLoadingStep(s => {
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

  const handleDeath = useCallback((score, wave, peak) => {
    setDeathData({ score, wave, peak });
    setScreen('death');
  }, []);

  const handleRetry = useCallback(() => {
    setScreen('game');
  }, []);

  // Wrap everything in a full-screen dark shell so the bg is always black
  return (
    <div style={{ width: '100vw', height: '100svh', background: '#000', overflow: 'hidden' }}>
      {screen === 'loading' && (
        <Centered><LoadingScreen step={loadingStep} /></Centered>
      )}
      {screen === 'title' && (
        <Centered><TitleScreen onStart={() => setScreen('game')} /></Centered>
      )}
      {screen === 'death' && (
        <Centered><DeathScreen data={deathData} onRetry={handleRetry} /></Centered>
      )}
      {screen === 'game' && (
        <GameScreen onDeath={handleDeath} />
      )}
    </div>
  );
}

// Centers the 360×640 game box with scaling for non-game screens
function Centered({ children }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => setScale(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT));
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: GAME_WIDTH, height: GAME_HEIGHT,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 0 30px #FF2D9520, 0 0 60px #00F0FF10',
      }}>
        {children}
      </div>
    </div>
  );
}
