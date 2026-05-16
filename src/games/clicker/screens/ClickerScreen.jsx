import { useEffect, useState, useCallback, useRef } from 'react';

import { gameData, initState } from '../game/state.js';
import {
  calculateCPS,
  calculateClickValue,
  applyManualClick,
  applyTick,
  applyRebootClick,
  completeReboot,
  buyGenerator,
  buyUpgrade,
  checkNarrativeUnlocks,
  checkTemperatureBoil,
  getStage,
  getStageOrder,
  isCrashed,
  isRebooting,
  REINITIALIZING_MS,
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
import SystemCrashOverlay from '../components/SystemCrashOverlay.jsx';
import TemperatureGauge from '../components/TemperatureGauge.jsx';
import WizardAura from '../components/WizardAura.jsx';

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
  const [boiling, setBoiling] = useState(false);

  const rootRef = useRef(null);
  const fxRef = useRef(null);
  const toastRef = useRef(null);
  const lastMilestoneRef = useRef(-1);
  const boilTimeoutRef = useRef(null);

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

  const flashBoiling = useCallback(() => {
    setBoiling(true);
    if (boilTimeoutRef.current) clearTimeout(boilTimeoutRef.current);
    boilTimeoutRef.current = setTimeout(() => setBoiling(false), 900);
  }, []);

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleClick = useCallback((event) => {
    // Snapshot the click point from the DOM event before React batches things.
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    setState(prev => {
      // During a crash, the glass click is inert. UI also disables it visually.
      if (isCrashed(prev)) return prev;
      const next = cloneState(prev);
      const earned = calculateClickValue(next);
      applyManualClick(next);
      const boilBonus = checkTemperatureBoil(next);
      checkNarrativeUnlocks(next);

      // Spawn FX outside of setState? Safe to do here — these refs are stable
      // and only push to internal arrays, no re-entrant setState that would
      // observe `next` mid-commit.
      fxRef.current?.spawn({ type: 'particles', x, y });
      fxRef.current?.spawn({ type: 'float', x, y, value: earned });

      if (boilBonus > 0) {
        fxRef.current?.spawn({ type: 'float', x, y: y - 40, value: boilBonus });
        toastRef.current?.push({ text: 'BOILING. STEAM ECONOMY ENGAGED.', kind: 'flavor' });
        flashBoiling();
      }

      return next;
    });

    triggerShake();
  }, [triggerShake, flashBoiling]);

  // Cleanup the boil timeout on unmount
  useEffect(() => () => {
    if (boilTimeoutRef.current) clearTimeout(boilTimeoutRef.current);
  }, []);

  // ── Reboot click (during system crash) ────────────────────────────────────
  const handleRebootClick = useCallback((event) => {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    setState(prev => {
      // Only active during the rebooting phase; reinitializing phase ignores clicks.
      if (!isRebooting(prev)) return prev;
      const next = cloneState(prev);
      applyRebootClick(next);
      // Green particles to keep the crash visually distinct from gold clicks.
      fxRef.current?.spawn({ type: 'particles', x, y, color: '#39FF14' });
      return next;
    });

    triggerShake();
  }, [triggerShake]);

  // ── Reinitializing → completion transition ───────────────────────────────
  // When crashMode flips to 'reinitializing', wait REINITIALIZING_MS then
  // finalize the stage advance and fire the celebratory milestone toast.
  useEffect(() => {
    if (state.crashMode?.phase !== 'reinitializing') return;
    const timeoutId = setTimeout(() => {
      setState(prev => {
        if (prev.crashMode?.phase !== 'reinitializing') return prev;
        const next = cloneState(prev);
        const advancedStage = completeReboot(next);
        if (advancedStage) {
          toastRef.current?.push({
            text: `SYSTEM RESTORED. ENTERING: ${advancedStage.theme.name.toUpperCase()}`,
            kind: 'milestone',
          });
        }
        return next;
      });
    }, REINITIALIZING_MS);
    return () => clearTimeout(timeoutId);
  }, [state.crashMode?.phase]);

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
  const stageOrder = getStageOrder(state.narrativeStage);
  const cps = calculateCPS(state);
  const currencyName = gameData.meta.theme.currency_name;
  const showTempGauge = stageOrder === 1;
  const showWizardAura = stageOrder >= 2;

  return (
    <div className="clicker-root" ref={rootRef}>
      <div className="clicker-container">
        <div className="clicker-main">
          <h1 className="clicker-currency">
            {formatNumber(Math.floor(displayedCurrency))} {currencyName}
          </h1>
          <p className="clicker-cps">{formatNumber(cps)} / sec</p>

          <div className="clicker-core-wrap">
            {showWizardAura && <WizardAura />}
            <CoreObject stage={stage} onClick={handleClick} />
          </div>

          {showTempGauge && (
            <TemperatureGauge temperature={state.temperature} boiling={boiling} />
          )}

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
      <SystemCrashOverlay crashMode={state.crashMode} onRebootClick={handleRebootClick} />
    </div>
  );
}
