import { useEffect, useState, useCallback } from 'react';

import { gameData, initState } from '../game/state.js';
import {
  calculateCPS,
  applyManualClick,
  applyTick,
  buyGenerator,
  buyUpgrade,
  checkNarrativeUnlocks,
  getStage,
} from '../game/logic.js';
import { formatNumber, FALLBACK_TICK_SECONDS } from '../game/constants.js';

import CoreObject from '../components/CoreObject.jsx';
import BuyAmountToggle from '../components/BuyAmountToggle.jsx';
import GeneratorList from '../components/GeneratorList.jsx';
import UpgradeList from '../components/UpgradeList.jsx';
import NarrativePanel from '../components/NarrativePanel.jsx';

import '../Clicker.css';

// AdGame.exe uses a mutable stateRef + canvas rAF — that pattern is for raw frame
// performance. The clicker is DOM-rendered at 10Hz, so plain useState is the
// React-idiomatic fit. Game logic helpers in game/logic.js mutate a state object
// passed to them, so we always pass them a fresh shallow clone inside setState.
function cloneState(s) {
  return {
    ...s,
    generators: { ...s.generators },
    upgrades: [...s.upgrades],
    cards: [...s.cards],
    selectedCards: [...s.selectedCards],
    legacy: { ...s.legacy },
  };
}

export default function ClickerScreen() {
  const [state, setState] = useState(initState);

  const tickSeconds = gameData.meta.engine.tick_seconds_recommended ?? FALLBACK_TICK_SECONDS;

  useEffect(() => {
    const id = setInterval(() => {
      setState(prev => {
        const next = cloneState(prev);
        const cps = calculateCPS(next);
        applyTick(next, tickSeconds, cps);
        checkNarrativeUnlocks(next);
        return next;
      });
    }, tickSeconds * 1000);
    return () => clearInterval(id);
  }, [tickSeconds]);

  const handleClick = useCallback(() => {
    setState(prev => {
      const next = cloneState(prev);
      applyManualClick(next);
      checkNarrativeUnlocks(next);
      return next;
    });
  }, []);

  const handleBuyGen = useCallback(id => {
    setState(prev => {
      const next = cloneState(prev);
      return buyGenerator(next, id) ? next : prev;
    });
  }, []);

  const handleBuyUpgrade = useCallback(id => {
    setState(prev => {
      const next = cloneState(prev);
      return buyUpgrade(next, id) ? next : prev;
    });
  }, []);

  const handleBuyAmount = useCallback(n => {
    setState(prev => ({ ...prev, buyAmount: n }));
  }, []);

  const stage = getStage(state.narrativeStage);
  const cps = calculateCPS(state);
  const currencyName = gameData.meta.theme.currency_name;

  return (
    <div className="clicker-root">
      <div className="clicker-container">
        <div className="clicker-main">
          <h1 className="clicker-currency">
            {formatNumber(Math.floor(state.currency))} {currencyName}
          </h1>
          <p className="clicker-cps">{formatNumber(cps)} / sec</p>

          <CoreObject stage={stage} onClick={handleClick} />

          {/* Pass the stage id as flashKey so NarrativePanel re-flashes on advance. */}
          <NarrativePanel stage={stage} flashKey={state.narrativeStage} />
        </div>

        <div className="clicker-sidebar">
          <h2 className="clicker-section-title">Generators</h2>
          <BuyAmountToggle value={state.buyAmount} onChange={handleBuyAmount} />
          <GeneratorList state={state} onBuy={handleBuyGen} />

          <h2 className="clicker-section-title">Upgrades</h2>
          <UpgradeList state={state} onBuy={handleBuyUpgrade} />
        </div>
      </div>
    </div>
  );
}
