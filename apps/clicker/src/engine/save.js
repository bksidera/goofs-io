// Clicker save layer — arc-scoped, versioned, offline-accrual-aware.
// Backed by @goofs/save (namespaced localStorage + throttled writes).
//
// Storage key pattern: 'goofs:clicker:<arcId>' — each arc gets its own slot
// so playing Crypto doesn't stomp on a future Epochs run.

import { createSave } from '@goofs/save';

const SAVE_VERSION = 1;

// Offline accrual cap — how many hours of CPS to grant on return.
// Prevents "left it running for 3 weeks → skip to endgame."
const OFFLINE_CAP_HOURS = 8;

export function createClickerSave(arcId, { initFactory }) {
  const store = createSave({
    key: `goofs:clicker:${arcId}`,
    version: SAVE_VERSION,
    defaults: null,
    migrate: (state, from) => {
      // v0 → v1 is a no-op; documented here so the shape is explicit.
      // If we bump SAVE_VERSION, add a branch here.
      void from;
      return state;
    },
  });

  return {
    /**
     * Load the persisted run, or return a fresh state if none exists.
     * `initFactory` must return a valid initial state (typically initState).
     */
    load() {
      const persisted = store.load();
      if (!persisted) return { state: initFactory(), offlineSeconds: 0 };

      // Offline accrual — measured from the last save.
      const now = Date.now();
      const lastAt = persisted._savedAt ?? now;
      const secondsAway = Math.min(
        Math.max(0, Math.floor((now - lastAt) / 1000)),
        OFFLINE_CAP_HOURS * 3600
      );

      const { _savedAt, ...rest } = persisted;
      return { state: rest, offlineSeconds: secondsAway };
    },

    /** Write the current state. Throttled by @goofs/save. */
    write(state) {
      store.write({ ...state, _savedAt: Date.now() });
    },

    /** Force-flush pending writes (e.g. on beforeunload). */
    flush() {
      store.flush();
    },

    /** Wipe the arc's save (prestige reset, dev, or user request). */
    clear() {
      store.clear();
    },

    /** Constants exposed for the UI ("welcome back" message tuning). */
    OFFLINE_CAP_HOURS,
  };
}
