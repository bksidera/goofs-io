// Phase 1: cards system disabled. Flip to true in Phase 2.
export const CARDS_ENABLED = false;

// PACING: revisit late-game ×100 affordability after M3 mechanics land.
// Symptom: x100 of late-tier generators looks unreachable mid-game (~26T cited
// during M1 playtest). Don't tune in M2 — the income shape changes when
// staking (3e) and forging (3f) come online, so re-evaluate then.
// Things to check: do stacked global multipliers cross the late-game cost
// curve? Does generator8.baseRate need a bigger jump vs generator7? Should
// upgrade7 (or a new stage-7 upgrade) become a ×100 global rather than ×10
// click?

// Tick rate driven by gameData.meta.engine.tick_seconds_recommended (0.1s = 10Hz).
// Override here if needed without re-deriving from JSON.
export const FALLBACK_TICK_SECONDS = 0.1;

export function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}
