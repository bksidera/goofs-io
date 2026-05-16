// Phase 1: cards system disabled. Flip to true in Phase 2.
export const CARDS_ENABLED = false;

// Tick rate driven by gameData.meta.engine.tick_seconds_recommended (0.1s = 10Hz).
// Override here if needed without re-deriving from JSON.
export const FALLBACK_TICK_SECONDS = 0.1;

export function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}
