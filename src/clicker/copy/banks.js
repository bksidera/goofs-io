// Flavor text banks for the clicker.
// Mirrors AdGame.exe's copy/banks.js convention — all player-facing text lives here.

// Milestone celebrations — keyed by `totalEarned` threshold.
// Order matters: rendered when totalEarned first crosses the threshold.
export const MILESTONES = [
  { at: 1_000,         line: 'FIRST GRAND. CRYPTO TWITTER WELCOMES YOU.' },
  { at: 10_000,        line: 'TEN GRAND. YOU EXPLAIN THIS TO YOUR PARENTS BADLY.' },
  { at: 100_000,       line: 'SIX FIGURES. YOU CONSIDER A LAMBO ON FINANCING.' },
  { at: 1_000_000,     line: 'A MILLION COINS. YOU TWEET "GM" UNIRONICALLY.' },
  { at: 10_000_000,    line: 'TEN MIL. YOU CHANGE YOUR PFP TO LASER EYES.' },
  { at: 100_000_000,   line: 'NINE FIGURES. YOU BUY A CONFERENCE TICKET TO MIAMI.' },
  { at: 1_000_000_000, line: 'A BILLION. YOU ARE A "THOUGHT LEADER" NOW.' },
];

// Random flavor text shown on upgrade purchase. Pulled at random.
export const UPGRADE_PURCHASES = [
  'THE PROPHECY IS FULFILLED.',
  'BUY THE DIP.',
  'WAGMI.',
  'NUMBER GO UP.',
  'THIS IS THE WAY.',
  'IT IS WRITTEN.',
  'CHAINLINK NODE OPERATORS HATE THIS TRICK.',
  'YOUR BAGS ARE HEAVIER NOW.',
  'BULLISH.',
  'FEW UNDERSTAND.',
];

// Flavor text shown on generator purchase. Lighter touch — not every buy gets one.
export const GENERATOR_PURCHASES = [
  'STACKING SATS.',
  'ANOTHER ONE.',
  'MORE COWBELL.',
  'TOUCHING GRASS POSTPONED.',
  'OPSEC: COMPROMISED.',
];

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
