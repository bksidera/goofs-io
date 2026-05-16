import { CARDS_ENABLED } from './constants.js';
import { gameData } from './state.js';

export function getStageOrder(stageId) {
  const s = gameData.narrative_stages.find(x => x.id === stageId);
  return s ? s.order : 0;
}

export function getStage(stageId) {
  return gameData.narrative_stages.find(x => x.id === stageId);
}

// Geometric series cost for buying `amount` units of `gen` given current `owned`.
export function calculateBulkCost(gen, owned, amount) {
  const s = gen.costScaling;
  const base = gen.baseCost * Math.pow(s, owned);
  if (Math.abs(s - 1) < 1e-9) return Math.floor(base * amount);
  return Math.floor((base * (Math.pow(s, amount) - 1)) / (s - 1));
}

export function calculateCPS(state) {
  let baseCps = 0;
  let globalMultiplier = 1;
  const categoryMultipliers = {};

  state.upgrades.forEach(upgradeId => {
    const u = gameData.upgrades.find(x => x.id === upgradeId);
    if (!u) return;
    const eff = u.effect;
    if (eff.type === 'multiplier' && eff.target === 'global') {
      globalMultiplier *= eff.value;
    } else if (eff.type === 'multiplier' && eff.target === 'generator_category' && eff.category) {
      categoryMultipliers[eff.category] = (categoryMultipliers[eff.category] || 1) * eff.value;
    }
  });

  for (const generatorId in state.generators) {
    const count = state.generators[generatorId];
    const gen = gameData.generators.find(g => g.id === generatorId);
    if (!gen) continue;

    let perUnit = gen.baseRate;
    const category = gen.category || gen.theme?.category;
    const catMult = categoryMultipliers[category];
    if (catMult) perUnit *= catMult;

    state.upgrades.forEach(upgradeId => {
      const u = gameData.upgrades.find(x => x.id === upgradeId);
      if (u && u.effect.type === 'multiplier' && u.effect.target === 'generator' && u.effect.generator_id === generatorId) {
        perUnit *= u.effect.value;
      }
    });

    baseCps += count * perUnit;
  }

  let additiveAutoclick = 0;
  state.upgrades.forEach(upgradeId => {
    const u = gameData.upgrades.find(x => x.id === upgradeId);
    if (u && u.effect.type === 'additive' && u.effect.target === 'autoclick_rate') {
      additiveAutoclick += u.effect.value;
    }
  });

  if (CARDS_ENABLED) {
    state.cards.forEach(card => {
      const cd = gameData.cards?.card_types?.find(c => c.id === card.id);
      if (!cd) return;
      if (cd.effects.type === 'autoclick_rate') {
        additiveAutoclick += cd.effects.base_value * (card.level || 1);
      }
      if (cd.effects.type === 'global_multiplier') {
        globalMultiplier *= cd.effects.base_value * (card.level || 1);
      }
    });
  }

  return baseCps * globalMultiplier + additiveAutoclick;
}

export function calculateClickValue(state) {
  let clickValue = 1;
  let clickMultiplier = 1;

  gameData.upgrades.forEach(u => {
    if (!state.upgrades.includes(u.id)) return;
    if (u.effect.target === 'currency_per_click' && u.effect.type === 'multiplier') {
      clickMultiplier *= u.effect.value;
    }
  });

  return clickValue * clickMultiplier;
}

// During a crash, all income / purchase actions are blocked. The only
// permitted interaction is applyRebootClick (driven by the REBOOT button).
//
// crashMode has two phases:
//   - 'rebooting': player must click REBOOT button N times to fill the bar
//   - 'reinitializing': bar is full, brief interstitial plays, then the
//     stage actually advances via completeReboot()

export const REBOOT_CLICKS_REQUIRED = 25;
export const REINITIALIZING_MS = 1800;

// Stage-1 temperature mechanic (M3a)
export const TEMP_PER_CLICK = 5;     // 20 clicks fills the gauge
export const TEMP_DECAY_PER_SEC = 4; // ~25s to fully decay from boiling
export const TEMP_BOIL_BONUS = 50;   // small reward — meaningful in stage 1, trivial later
export const TEMP_MAX = 100;

export function isCrashed(state) {
  return state.crashMode != null;
}

export function isRebooting(state) {
  return state.crashMode?.phase === 'rebooting';
}

export function isReinitializing(state) {
  return state.crashMode?.phase === 'reinitializing';
}

export function applyManualClick(state) {
  if (isCrashed(state)) return 0;
  const earned = calculateClickValue(state);
  state.currency += earned;
  state.totalEarned += earned;
  // Temperature climbs with each click (capped at TEMP_MAX).
  state.temperature = Math.min(TEMP_MAX, (state.temperature ?? 0) + TEMP_PER_CLICK);
  return earned;
}

export function applyTick(state, tickSeconds, cps) {
  if (isCrashed(state)) return 0;
  const earned = cps * tickSeconds;
  state.currency += earned;
  state.totalEarned += earned;
  // Temperature decays over time (floored at 0).
  state.temperature = Math.max(0, (state.temperature ?? 0) - TEMP_DECAY_PER_SEC * tickSeconds);
  return earned;
}

// If temperature has reached TEMP_MAX, reset to 0 and award the boil bonus.
// Returns the bonus amount (or 0 if no boil this tick).
export function checkTemperatureBoil(state) {
  if (isCrashed(state)) return 0;
  if ((state.temperature ?? 0) < TEMP_MAX) return 0;
  state.temperature = 0;
  state.currency += TEMP_BOIL_BONUS;
  state.totalEarned += TEMP_BOIL_BONUS;
  return TEMP_BOIL_BONUS;
}

export function buyGenerator(state, generatorId) {
  if (isCrashed(state)) return false;
  const gen = gameData.generators.find(g => g.id === generatorId);
  if (!gen) return false;
  const owned = state.generators[generatorId] || 0;
  const cost = calculateBulkCost(gen, owned, state.buyAmount);
  if (state.currency < cost) return false;
  state.currency -= cost;
  state.generators[generatorId] = owned + state.buyAmount;
  return true;
}

export function buyUpgrade(state, upgradeId) {
  if (isCrashed(state)) return false;
  const u = gameData.upgrades.find(x => x.id === upgradeId);
  if (!u) return false;
  if (state.upgrades.includes(upgradeId)) return false;
  if (state.currency < u.cost) return false;
  state.currency -= u.cost;
  state.upgrades.push(upgradeId);
  return true;
}

// Detects whether a stage should advance. Instead of changing narrativeStage
// directly, it triggers crashMode — the player must REBOOT through the crash
// to actually enter the new stage.
// Returns the pending next-stage object if a crash was triggered, else null.
export function checkNarrativeUnlocks(state) {
  if (isCrashed(state)) return null;
  const current = getStage(state.narrativeStage);
  if (!current) return null;
  const next = gameData.narrative_stages.find(s => s.order === current.order + 1);
  if (!next) return null;

  const cond = next.unlock_condition;
  let unlocked = false;
  if (cond.type === 'currency' && state.totalEarned >= cond.value) unlocked = true;
  else if (cond.type === 'auto') unlocked = true;
  if (!unlocked) return null;

  state.crashMode = {
    phase: 'rebooting',
    pendingStage: next.id,
    clicksDone: 0,
    clicksRequired: REBOOT_CLICKS_REQUIRED,
  };
  return next;
}

// Player click while in crash mode. Increments the reboot counter and, when
// the bar fills, transitions crashMode into 'reinitializing' (without yet
// advancing the stage). Returns the new phase if it changed, else null.
export function applyRebootClick(state) {
  if (!isRebooting(state)) return null;
  const clicksDone = state.crashMode.clicksDone + 1;
  if (clicksDone >= state.crashMode.clicksRequired) {
    state.crashMode = { ...state.crashMode, clicksDone, phase: 'reinitializing' };
    return 'reinitializing';
  }
  state.crashMode = { ...state.crashMode, clicksDone };
  return null;
}

// Finalizes a stage advance after the reinitializing interstitial completes.
// Returns the now-active stage object so callers can fire celebration FX.
export function completeReboot(state) {
  if (!isReinitializing(state)) return null;
  const next = getStage(state.crashMode.pendingStage);
  state.narrativeStage = state.crashMode.pendingStage;
  state.crashMode = null;
  return next;
}

export function visibleGenerators(state) {
  const order = getStageOrder(state.narrativeStage);
  return gameData.generators.filter(g => {
    if (g.unlock_condition.type !== 'narrative_stage') return true;
    const s = getStage(g.unlock_condition.value);
    return s && s.order <= order;
  });
}

// Auto-derives a short, mechanically accurate label from an upgrade's effect.
// Goal: every upgrade card displays exactly what it does, no ambiguity.
export function describeEffect(effect) {
  if (!effect) return '';
  const { type, target, value } = effect;

  if (type === 'multiplier') {
    if (target === 'global')             return `×${value} GLOBAL`;
    if (target === 'currency_per_click') return `×${value} CLICK`;
    if (target === 'generator_category' && effect.category) {
      const pct = Math.round((value - 1) * 100);
      return `+${pct}% ${effect.category.toUpperCase()}`;
    }
    if (target === 'generator' && effect.generator_id) {
      const gen = gameData.generators.find(g => g.id === effect.generator_id);
      const name = gen?.theme?.name?.toUpperCase() ?? effect.generator_id.toUpperCase();
      return `×${value} ${name}`;
    }
    return `×${value}`;
  }

  if (type === 'additive') {
    if (target === 'autoclick_rate') return `+${value}/s AUTO`;
    if (target === 'legacy_bonus')   return `+${Math.round(value * 100)}% LEGACY (NEXT RUN)`;
    return `+${value}`;
  }

  return '';
}

export function visibleUpgrades(state) {
  const order = getStageOrder(state.narrativeStage);
  return gameData.upgrades.filter(u => {
    if (state.upgrades.includes(u.id)) return false;
    if (u.unlock_condition.type !== 'narrative_stage') return true;
    const s = getStage(u.unlock_condition.value);
    return s && s.order <= order;
  });
}
