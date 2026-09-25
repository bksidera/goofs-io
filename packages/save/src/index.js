// @goofs/save — tiny, namespaced, versioned localStorage save utility.
//
// Usage:
//   const save = createSave({
//     key: 'goofs:adgame',
//     version: 2,
//     defaults: { highScore: 0, longestRun: 0 },
//     migrate: (state, fromVersion) => {
//       if (fromVersion === 1) state.longestRun = 0;
//       return state;
//     },
//   });
//
//   const state = save.load();          // returns migrated state or defaults
//   save.write(nextState);              // throttled by default; instant if flush()
//   save.write(nextState, { flush: true });
//   save.clear();                       // nuke the entry
//
// Storage shape on disk: { v: <version>, s: <state>, t: <writtenAt> }
// A key that doesn't exist yet, or that fails to parse, returns `defaults`
// verbatim (never mutated) so callers can clone as they please.

const DEFAULT_THROTTLE_MS = 500;

export function createSave({
  key,
  version = 1,
  defaults = {},
  migrate = (s) => s,
  throttleMs = DEFAULT_THROTTLE_MS,
} = {}) {
  if (!key) throw new Error('@goofs/save: key is required');

  const storage = safeStorage();
  let pending = null;
  let timerId = null;

  function load() {
    if (!storage) return clone(defaults);
    try {
      const raw = storage.getItem(key);
      if (!raw) return clone(defaults);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return clone(defaults);
      let state = parsed.s ?? {};
      const from = parsed.v ?? 0;
      if (from !== version) state = migrate(state, from) ?? state;
      return { ...clone(defaults), ...state };
    } catch {
      return clone(defaults);
    }
  }

  function flushNow() {
    if (!storage || pending === null) return;
    const state = pending;
    pending = null;
    if (timerId) { clearTimeout(timerId); timerId = null; }
    try {
      storage.setItem(key, JSON.stringify({ v: version, s: state, t: Date.now() }));
    } catch {
      /* quota / private-mode / disabled — silently no-op */
    }
  }

  function write(state, { flush = false } = {}) {
    pending = state;
    if (flush) return flushNow();
    if (timerId) return; // already scheduled
    timerId = setTimeout(flushNow, throttleMs);
  }

  function clear() {
    if (!storage) return;
    if (timerId) { clearTimeout(timerId); timerId = null; }
    pending = null;
    try { storage.removeItem(key); } catch { /* ignore */ }
  }

  // Return everything a caller might want.
  return { load, write, flush: flushNow, clear, key, version };
}

function safeStorage() {
  try {
    const s = window.localStorage;
    const probe = '__goofs_probe__';
    s.setItem(probe, probe);
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function clone(x) {
  return JSON.parse(JSON.stringify(x));
}
