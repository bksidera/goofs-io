import { useEffect, useState, useCallback, useRef } from 'react';

import { gameData, initState } from '../state.js';
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
} from '../logic.js';
import { formatNumber, FALLBACK_TICK_SECONDS } from '../constants.js';
import { useAnimatedNumber } from '../useAnimatedNumber.js';
import { createClickerSave } from '../save.js';
import { createAudioRouter } from '../audio.js';

// TODO: engine-in-transition. The imports below (copy bank + crypto-specific
// mechanics + aftermath) currently reach into arcs/crypto/ directly. When
// ArcScreen learns to consume its `arc` prop for these, delete these direct
// imports and pull them from `arc.copy` / `arc.mechanics` / `arc.Aftermath`.
import {
  MILESTONES,
  UPGRADE_PURCHASES,
  GENERATOR_PURCHASES,
  AIRDROP_LINES,
  AIRDROP_MISSED_LINES,
  OVERDRIVE_LINE,
  randomFrom,
} from '../../arcs/crypto/copy.js';

import CoreObject from '../components/CoreObject.jsx';
import BuyAmountToggle from '../components/BuyAmountToggle.jsx';
import GeneratorList from '../components/GeneratorList.jsx';
import UpgradeList from '../components/UpgradeList.jsx';
import NarrativePanel from '../components/NarrativePanel.jsx';
import FxLayer from '../components/FxLayer.jsx';
import Toast from '../components/Toast.jsx';
import SystemCrashOverlay from '../components/SystemCrashOverlay.jsx';
import TemperatureGauge from '../../arcs/crypto/mechanics/TemperatureGauge.jsx';
import WizardAura from '../../arcs/crypto/mechanics/WizardAura.jsx';
import AirdropEvent from '../../arcs/crypto/mechanics/AirdropEvent.jsx';
import ApocalypseSequence from '../../arcs/crypto/mechanics/ApocalypseSequence.jsx';
import AftermathScreen from '../../arcs/crypto/aftermath.jsx';

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

export default function ArcScreen({ arc }) {
  // `arc` scopes the save key and (eventually) supplies the content bundle.
  // For now the direct imports above still supply data/copy/mechanics from
  // arcs/crypto/. The prop is accepted here so callers already use the target API.
  const arcId = arc?.id ?? 'crypto';

  // Save + audio infra — instantiated once, then referenced via refs.
  const saveRef = useRef(null);
  const audioRef = useRef(null);
  if (!saveRef.current) saveRef.current = createClickerSave(arcId, { initFactory: initState });
  if (!audioRef.current) audioRef.current = createAudioRouter();

  // Initial state: load a persisted run + apply offline accrual, or fresh.
  const [state, setState] = useState(() => {
    const { state: loaded, offlineSeconds } = saveRef.current.load();
    if (offlineSeconds > 0 && loaded.currency !== undefined) {
      const cps = calculateCPS(loaded);
      return {
        ...loaded,
        currency: loaded.currency + cps * offlineSeconds,
        _offlineSeconds: offlineSeconds,
      };
    }
    return loaded;
  });
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

  // ── Persistence ───────────────────────────────────────────────────────────
  // Save on every state change. @goofs/save throttles internally (500ms), so
  // this fires cheaply — a tick-rate change still writes ~2×/sec worst case.
  useEffect(() => {
    if (!saveRef.current || !state) return;
    // Strip the transient _offlineSeconds marker before writing so it doesn't
    // ping-pong between saves.
    const { _offlineSeconds, ...persistable } = state;
    void _offlineSeconds;
    saveRef.current.write(persistable);
  }, [state]);

  // Force-flush pending writes on unload so a tab-close doesn't lose the tick.
  useEffect(() => {
    const flush = () => saveRef.current?.flush();
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  // Toast once for meaningful offline accrual, then clear the marker.
  useEffect(() => {
    const secs = state._offlineSeconds;
    if (!secs || secs < 60) return;
    const label = secs >= 3600
      ? `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
      : `${Math.floor(secs / 60)}m`;
    // Small delay so the toast fires after mount animation.
    const t = setTimeout(() => {
      toastRef.current?.push({
        text: `you were gone ${label}. the machine kept mining.`,
        kind: 'milestone',
      });
    }, 400);
    setState(prev => {
      const { _offlineSeconds, ...rest } = prev;
      void _offlineSeconds;
      return rest;
    });
    return () => clearTimeout(t);
    // Intentionally runs only once, driven by initial state's flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apocalypse trigger ────────────────────────────────────────────────────
  // Entering stage 8 starts the doom clock. The player gets APOCALYPSE_DELAY_MS
  // of ×10 overdrive mania, then the rug pull. They don't know it's coming.
  const inStage8 = getStageOrder(state.narrativeStage) === 8;
  useEffect(() => {
    if (!inStage8 || gamePhase !== 'playing') return;
    toastRef.current?.push({ text: OVERDRIVE_LINE, kind: 'milestone' });
    audioRef.current?.play('apocalypse-warn');
    const id = setTimeout(() => {
      setApocalypseFortune(Math.floor(currencyRef.current));
      setAirdrop(null);
      audioRef.current?.play('apocalypse-start');
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
        audioRef.current?.play('airdrop-catch', { reward });
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

      // Audio dispatch — silent scaffold today, real SFX later.
      audioRef.current?.play(isSteamBuffActive(next) ? 'click-crit' : 'click');
      if (boiled) audioRef.current?.play('stage-transition', { source: 'boil' });

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
          audioRef.current?.play('crash-complete', { stage: advancedStage.id });
          audioRef.current?.play('stage-transition', { to: advancedStage.id });
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
      audioRef.current?.play('buy-generator', { id });
      return next;
    });
  }, [clearGeneratorFlash]);

  const handleBuyUpgrade = useCallback(id => {
    setState(prev => {
      const next = cloneState(prev);
      if (!buyUpgrade(next, id)) return prev;
      toastRef.current?.push({ text: randomFrom(UPGRADE_PURCHASES), kind: 'flavor' });
      audioRef.current?.play('buy-upgrade', { id });
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
