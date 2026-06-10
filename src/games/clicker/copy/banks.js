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

// System crash flavor text — shown on the reboot overlay. Keyed by the
// destination stage (the stage you're rebooting INTO).
export const STAGE_CRASH_LINES = {
  stage2: 'DIVINE_INTERVENTION.EXE NOT FOUND. INITIATING WIZARD PROTOCOL.',
  stage3: 'CAT.WAV CORRUPTED ALL FILES. AUTOMATION WAS A SIDE EFFECT.',
  stage4: 'COMMODITY DETECTED. WEIGHT VECTOR EXCEEDS PARSEC THRESHOLD.',
  stage5: 'MERGING TIMELINES. PLEASE DO NOT TURN OFF YOUR ETHEREUM.',
  stage6: 'GOODWILL.LOCATION.MIAMI VERIFIED. FLAMETHROWER ARMED.',
  stage7: 'PRESSURE THRESHOLD EXCEEDED. CRYSTALLIZATION IMMINENT.',
  stage8: 'QUANTUM ANOMALY DETECTED. ENCRYPTION INTEGRITY: 0%. PRAY.',
};

// Reinitializing-phase subtext — shown briefly after the REBOOT bar fills,
// before the new stage actually loads. Keyed by destination stage.
export const STAGE_LOADING_LINES = {
  stage2: 'INVOKING WIZARD SUBROUTINES',
  stage3: 'INSTALLING CHAOS DRIVER',
  stage4: 'ALLOCATING ROCK MEMORY',
  stage5: 'MERGING CHAIN STATE',
  stage6: 'IGNITING HEAT SOURCE',
  stage7: 'COMPRESSING CARBON LATTICE',
  stage8: 'BREAKING ENCRYPTION (PLEASE WAIT)',
};

// Airdrop catch toasts (golden-cookie-style random event).
export const AIRDROP_LINES = [
  'AIRDROP CLAIMED. DEFINITELY NOT A HONEYPOT.',
  'FREE MONEY. NO STRINGS. PROBABLY.',
  'YOU WERE EARLY FOR ONCE.',
  'GAS FEES WAIVED. MIRACLE CONFIRMED.',
  'AN ANONYMOUS WHALE SMILES UPON YOU.',
  'IT FELL OFF A TRUCK. A BLOCKCHAIN TRUCK.',
];

// Missed-airdrop lines (it drifted away unclicked).
export const AIRDROP_MISSED_LINES = [
  'AIRDROP MISSED. NGMI.',
  'IT WENT TO SOMEONE WHO "BELIEVED HARDER."',
  'YOU HESITATED. THE WHALE DID NOT.',
];

// Stage-8 entry — the mania before the end.
export const OVERDRIVE_LINE = '💎 DIAMOND OVERDRIVE — ×10 EVERYTHING. NOTHING CAN GO WRONG.';

// The aftermath. Shown one line at a time over the painterly scene.
export const AFTERMATH_LINES = [
  'After all the clamor for fame and fortune and the frantic pursuit of invented value, we find peace in accepting the imperfect beauty of what endures.',
  'The true value was never in the accumulation, but in the experience of having lived through it all.',
];

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
