// AdGame save layer. Powered by @goofs/save (namespaced, versioned).
// Storage key: 'goofs:adgame'
//
// Schema v2:
//   highScore:      largest raw score across all runs
//   longestRunSecs: longest single-run duration in whole seconds
//   peakPower:      highest instantaneous power reached across all runs
//   runs:           total runs completed (deaths)
//   lastRun:        { score, secs, peak, at }  — most recent run for the "you just" line

import { createSave } from '@goofs/save';

const store = createSave({
  key: 'goofs:adgame',
  version: 2,
  defaults: {
    highScore: 0,
    longestRunSecs: 0,
    peakPower: 0,
    runs: 0,
    lastRun: null,
  },
  migrate: (state, from) => {
    // v0/v1 → v2: previous keys were plain localStorage adgame_highscore /
    // adgame_campaign_cleared. Bring the highscore forward best-effort.
    if (from < 2) {
      try {
        const legacyHs = parseInt(window.localStorage.getItem('adgame_highscore') || '0', 10);
        if (legacyHs > (state.highScore ?? 0)) state.highScore = legacyHs;
      } catch { /* ignore */ }
    }
    return state;
  },
});

export const loadStats = () => store.load();

// Finalize a run — merge the fresh run into best-of-all-time and persist.
// Returns the summary the death screen renders.
export const finalizeRun = (st) => {
  const prev = store.load();
  const secs = Math.floor(st.elapsed || 0);
  const peak = Math.floor(st.player?.peakPower || 0);
  const score = Math.floor(st.score || 0);

  const next = {
    highScore:      Math.max(prev.highScore, score),
    longestRunSecs: Math.max(prev.longestRunSecs, secs),
    peakPower:      Math.max(prev.peakPower, peak),
    runs:           (prev.runs || 0) + 1,
    lastRun:        { score, secs, peak, at: Date.now() },
  };
  store.write(next, { flush: true });

  return {
    score,
    secs,
    peak,
    runs: next.runs,
    isNewHigh: score > prev.highScore,
    isNewLongest: secs > prev.longestRunSecs,
    isNewPeak: peak > prev.peakPower,
    best: { score: next.highScore, secs: next.longestRunSecs, peak: next.peakPower },
  };
};

// Legacy exports kept so old imports don't crash during the transition.
// These will be removed once every call site is migrated.
export const getHighScore = () => store.load().highScore;
export const saveHighScore = (s) => {
  const state = store.load();
  if (s > state.highScore) store.write({ ...state, highScore: s }, { flush: true });
  return Math.max(s, state.highScore);
};
export const isCampaignCleared = () => false; // endless-only now
export const saveCampaignCleared = () => {};
