import { useEffect, useState, useCallback, useRef } from 'react';

import { gameData, initState } from '../game/state.js';
import {
  calculateCPS,
  calculateClickValue,
  applyManualClick,
  applyTick,
  buyGenerator,
  buyUpgrade,
  checkNarrativeUnlocks,
  getStage,
} from '../game/logic.js';
import { formatNumber, FALLBACK_TICK_SECONDS } from '../game/constants.js';
import { useAnimatedNumber } from '../game/useAnimatedNumber.js';
import {
  MILESTONES,
  UPGRADE_PURCHASES,
  GENERATOR_PURCHASES,
  randomFrom,
} from '../copy/banks.js';

import CoreObject from '../components/CoreObject.jsx';
import BuyAmountToggle from '../components/BuyAmountToggle.jsx';
import GeneratorList from '../components/GeneratorList.jsx';
import UpgradeList from '../components/UpgradeList.jsx';
import NarrativePanel from '../components/NarrativePanel.jsx';
import FxLayer from '../components/FxLayer.jsx';
import Toast from '../components/Toast.jsx';

import '../Clicker.css';

// AdGame.exe uses a mutable stateRef + canvas rAF for raw frame performance.
// The clicker is DOM-rendered at 10Hz, so plain useState is the React-idiomatic
// fit. Game logic helpers in game/logic.js mutate a state object passed to
// them, so we always pass them a fresh shallow clone inside setState.
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

const GENERATOR_FLAVOR_CHANCE = 0.3;

export default function ClickerScreen() {
  const [state, setState] = useState(initState);
  const [flashGeneratorId, setFlashGeneratorId] = useState(null);

  const rootRef = useRef(null);
  const fxRef = useRef(null);
  const toastRef = useRef(null);
  const lastMilestoneRef = useRef(-1);

  const tickSeconds = gameData.meta.engine.tick_seconds_recommended ?? FALLBACK_TICK_SECONDS;

  // Smooth currency tween for the big number display.
  const displayedCurrency = useAnimatedNumber(state.currency);

  // ── Helpers (declared first so effects below can reference them) ─────────
  const triggerShake = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    el.classList.remove('clicker-shake');
    // force reflow so the animation re-triggers
    void el.offsetWidth;
    el.classList.add('clicker-shake');
  }, []);

  const clearGeneratorFlash = useCallback(id => {
    setTimeout(() => {
      setFlashGeneratorId(prev => (prev === id ? null : prev));
    }, 600);
  }, []);

  // ── Tick loop ─────────────────────────────────────────────────────────────
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

  // ── Milestone detection (derives from totalEarned) ────────────────────────
  useEffect(() => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      const m = MILESTONES[i];
      if (state.totalEarned >= m.at && lastMilestoneRef.current < i) {
        lastMilestoneRef.current = i;
        toastRef.current?.push({ text: m.line, kind: 'milestone' });
        triggerShake();
        break;
      }
    }
  }, [state.totalEarned, triggerShake]);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = useCallback((event) => {
    // Snapshot the click point from the DOM event before React batches things.
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    setState(prev => {
      const next = cloneState(prev);
      const earned = calculateClickValue(next);
      applyManualClick(next);
      checkNarrativeUnlocks(next);

      // Spawn FX outside of setState? Safe to do here — these refs are stable
      // and only push to internal arrays, no re-entrant setState that would
      // observe `next` mid-commit.
      fxRef.current?.spawn({ type: 'particles', x, y });
      fxRef.current?.spawn({ type: 'float', x, y, value: earned });

      return next;
    });

    triggerShake();
  }, [triggerShake]);

  // ── Buy handlers ──────────────────────────────────────────────────────────
  const handleBuyGen = useCallback(id => {
    setState(prev => {
      const next = cloneState(prev);
      if (!buyGenerator(next, id)) return prev;
      setFlashGeneratorId(id);
      clearGeneratorFlash(id);
      if (Math.random() < GENERATOR_FLAVOR_CHANCE) {
        toastRef.current?.push({ text: randomFrom(GENERATOR_PURCHASES), kind: 'flavor' });
      }
      return next;
    });
  }, [clearGeneratorFlash]);

  const handleBuyUpgrade = useCallback(id => {
    setState(prev => {
      const next = cloneState(prev);
      if (!buyUpgrade(next, id)) return prev;
      toastRef.current?.push({ text: randomFrom(UPGRADE_PURCHASES), kind: 'flavor' });
      return next;
    });
  }, []);

  const handleBuyAmount = useCallback(n => {
    setState(prev => ({ ...prev, buyAmount: n }));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const stage = getStage(state.narrativeStage);
  const cps = calculateCPS(state);
  const currencyName = gameData.meta.theme.currency_name;

  return (
    <div className="clicker-root" ref={rootRef}>
      <div className="clicker-container">
        <div className="clicker-main">
          <h1 className="clicker-currency">
            {formatNumber(Math.floor(displayedCurrency))} {currencyName}
          </h1>
          <p className="clicker-cps">{formatNumber(cps)} / sec</p>

          <CoreObject stage={stage} onClick={handleClick} />

          {/* Pass the stage id as flashKey so NarrativePanel re-flashes on advance. */}
          <NarrativePanel stage={stage} flashKey={state.narrativeStage} />
        </div>

        <div className="clicker-sidebar">
          <h2 className="clicker-section-title">Generators</h2>
          <BuyAmountToggle value={state.buyAmount} onChange={handleBuyAmount} />
          <GeneratorList
            state={state}
            onBuy={handleBuyGen}
            flashId={flashGeneratorId}
          />

          <h2 className="clicker-section-title">Upgrades</h2>
          <UpgradeList state={state} onBuy={handleBuyUpgrade} />
        </div>
      </div>

      <FxLayer ref={fxRef} />
      <Toast ref={toastRef} />
    </div>
  );
}
