import { useEffect, useState, useCallback, useRef } from 'react';

import { gameData, initState } from '../game/state.js';
import {
  calculateCPS,
  calculateClickValue,
  applyManualClick,
  applyTick,
  applyRebootClick,
  applyAirdropCatch,
  completeReboot,
  buyGenerator,
  buyUpgrade,
  checkNarrativeUnlocks,
  checkTemperatureBoil,
  getStage,
  getStageOrder,
  isCrashed,
  isRebooting,
  isSteamBuffActive,
  steamBuffRemainingMs,
  APOCALYPSE_DELAY_MS,
  REINITIALIZING_MS,
  STEAM_BUFF_MULTIPLIER,
  STEAM_BUFF_DURATION_MS,
} from '../game/logic.js';
import { formatNumber, FALLBACK_TICK_SECONDS } from '../game/constants.js';
import { useAnimatedNumber } from '../game/useAnimatedNumber.js';
import {
  MILESTONES,
  UPGRADE_PURCHASES,
  GENERATOR_PURCHASES,
  AIRDROP_LINES,
  AIRDROP_MISSED_LINES,
  OVERDRIVE_LINE,
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
import AirdropEvent from '../components/AirdropEvent.jsx';
import ApocalypseSequence from '../components/ApocalypseSequence.jsx';
import AftermathScreen from './AftermathScreen.jsx';

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
    stats: { ...s.stats },
  };
}

const GENERATOR_FLAVOR_CHANCE = 0.3;

// Airdrop event timing (golden-cookie pattern): random gap, short window.
const AIRDROP_MIN_GAP_MS = 40000;
const AIRDROP_MAX_GAP_MS = 80000;
const AIRDROP_LIFETIME_MS = 7500;

export default function ClickerScreen() {
  const [state, setState] = useState(initState);
  const [flashGeneratorId, setFlashGeneratorId] = useState(null);
  const [boiling, setBoiling] = useState(false);
  // 'playing' → 'apocalypse' (cutscene) → 'aftermath' (ending screen)
  const [gamePhase, setGamePhase] = useState('playing');
  const [airdrop, setAirdrop] = useState(null);
  // Fortune snapshot taken the instant the apocalypse fires — the drain
  // animation counts down from this.
  const [apocalypseFortune, setApocalypseFortune] = useState(0);

  const rootRef = useRef(null);
  const fxRef = useRef(null);
  const toastRef = useRef(null);
  const lastMilestoneRef = useRef(-1);
  const boilTimeoutRef = useRef(null);
  // Live currency mirror so the apocalypse timeout can snapshot the fortune
  // at fire time without a stale closure.
  const currencyRef = useRef(0);
  const airdropIdRef = useRef(1);

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

  // ── Tick loop (paused during apocalypse/aftermath) ────────────────────────
  useEffect(() => {
    if (gamePhase !== 'playing') return;
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
  }, [tickSeconds, gamePhase]);

  // Keep the currency mirror fresh for the apocalypse snapshot.
  useEffect(() => {
    currencyRef.current = state.currency;
  }, [state.currency]);

  // ── Apocalypse trigger ────────────────────────────────────────────────────
  // Entering stage 8 starts the doom clock. The player gets APOCALYPSE_DELAY_MS
  // of ×10 overdrive mania, then the rug pull. They don't know it's coming.
  const inStage8 = getStageOrder(state.narrativeStage) === 8;
  useEffect(() => {
    if (!inStage8 || gamePhase !== 'playing') return;
    toastRef.current?.push({ text: OVERDRIVE_LINE, kind: 'milestone' });
    const id = setTimeout(() => {
      setApocalypseFortune(Math.floor(currencyRef.current));
      setAirdrop(null);
      setGamePhase('apocalypse');
    }, APOCALYPSE_DELAY_MS);
    return () => clearTimeout(id);
  }, [inStage8, gamePhase]);

  // ── Airdrop scheduler (golden-cookie random event) ────────────────────────
  // Random gaps; only during normal play from stage 2 onward; drop expires
  // unclicked after AIRDROP_LIFETIME_MS with a taunt.
  const airdropsEligible = gamePhase === 'playing' && getStageOrder(state.narrativeStage) >= 2 && !isCrashed(state);
  useEffect(() => {
    if (!airdropsEligible) return;
    let expireId = null;
    const gap = AIRDROP_MIN_GAP_MS + Math.random() * (AIRDROP_MAX_GAP_MS - AIRDROP_MIN_GAP_MS);
    const spawnId = setTimeout(() => {
      const id = airdropIdRef.current++;
      setAirdrop({ id, x: 8 + Math.random() * 80 });
      expireId = setTimeout(() => {
        setAirdrop(prev => {
          if (prev?.id === id) {
            toastRef.current?.push({ text: randomFrom(AIRDROP_MISSED_LINES), kind: 'flavor' });
            return null;
          }
          return prev;
        });
      }, AIRDROP_LIFETIME_MS);
    }, gap);
    return () => {
      clearTimeout(spawnId);
      if (expireId) clearTimeout(expireId);
    };
    // Re-arms after each drop resolves (airdrop → null changes the dep below).
  }, [airdropsEligible, airdrop]);

  const handleAirdropCatch = useCallback(() => {
    setAirdrop(null);
    setState(prev => {
      const next = cloneState(prev);
      const reward = applyAirdropCatch(next);
      if (reward > 0) {
        toastRef.current?.push({
          text: `🪂 +${formatNumber(reward)} — ${randomFrom(AIRDROP_LINES)}`,
          kind: 'milestone',
        });
      }
      return next;
    });
    triggerShake();
  }, [triggerShake]);

  // ── Play again (prestige-lite) ────────────────────────────────────────────
  const handlePlayAgain = useCallback(() => {
    lastMilestoneRef.current = -1;
    setAirdrop(null);
    setState(prev => {
      const fresh = initState();
      fresh.legacy = { ...prev.legacy, completions: prev.legacy.completions + 1 };
      return fresh;
    });
    setGamePhase('playing');
  }, []);

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
      const boiled = checkTemperatureBoil(next);
      checkNarrativeUnlocks(next);

      // Spawn FX outside of setState? Safe to do here — these refs are stable
      // and only push to internal arrays, no re-entrant setState that would
      // observe `next` mid-commit.
      fxRef.current?.spawn({ type: 'particles', x, y });
      fxRef.current?.spawn({ type: 'float', x, y, value: earned });

      if (boiled) {
        const seconds = Math.round(STEAM_BUFF_DURATION_MS / 1000);
        toastRef.current?.push({
          text: `⚡ STEAM ENGAGED — ${STEAM_BUFF_MULTIPLIER}× CLICKS / ${seconds}s`,
          kind: 'milestone',
        });
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
  const steamActive = isSteamBuffActive(state);
  const steamRemainingMs = steamBuffRemainingMs(state);
  const steamRemainingSec = steamActive ? Math.ceil(steamRemainingMs / 1000) : 0;

  // ── Ending branches ───────────────────────────────────────────────────────
  if (gamePhase === 'aftermath') {
    return (
      <AftermathScreen
        stats={state.stats}
        currencyName={currencyName}
        runNumber={state.legacy.completions + 1}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <div className={`clicker-root stage-bg-${stageOrder}`} ref={rootRef}>
      <div className="clicker-container">
        <div className="clicker-main">
          <h1 className="clicker-currency">
            {formatNumber(Math.floor(displayedCurrency))} {currencyName}
          </h1>
          <p className="clicker-cps">{formatNumber(cps)} / sec</p>
          <p className="clicker-stats-line">
            lifetime {formatNumber(Math.floor(state.totalEarned))} · {state.stats.totalClicks.toLocaleString()} clicks
            {state.legacy.completions > 0 && ` · run ${state.legacy.completions + 1}`}
          </p>

          <div className="clicker-core-wrap">
            {showWizardAura && <WizardAura />}
            <CoreObject stage={stage} onClick={handleClick} buffed={steamActive} />
            {steamActive && (
              <div className="clicker-steam-badge" aria-live="polite">
                ⚡ STEAM ×{STEAM_BUFF_MULTIPLIER} — {steamRemainingSec}s
              </div>
            )}
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
      <AirdropEvent drop={airdrop} onCatch={handleAirdropCatch} />
      {gamePhase === 'apocalypse' && (
        <ApocalypseSequence
          finalCurrency={apocalypseFortune}
          currencyName={currencyName}
          onComplete={() => setGamePhase('aftermath')}
        />
      )}
    </div>
  );
}
