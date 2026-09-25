import { useCallback, useState } from 'react';
import './Terms.css';

import TitleScreen from './screens/TitleScreen.jsx';
import GameScreen from './screens/GameScreen.jsx';
import ResultScreen from './screens/ResultScreen.jsx';

export default function Terms() {
  const [screen, setScreen] = useState('title');
  const [mode, setMode] = useState('campaign');
  const [result, setResult] = useState(null);

  const start = useCallback((nextMode = 'campaign') => {
    setMode(nextMode);
    setScreen('game');
  }, []);

  const finish = useCallback((summary) => {
    setResult(summary);
    setScreen('result');
  }, []);

  return (
    <div className="terms-root">
      {screen === 'title' && <TitleScreen onStart={start} />}
      {screen === 'game' && <GameScreen mode={mode} onDone={finish} />}
      {screen === 'result' && (
        <ResultScreen
          result={result}
          onRetry={() => start(result?.mode || mode)}
          onMenu={() => setScreen('title')}
        />
      )}
    </div>
  );
}
