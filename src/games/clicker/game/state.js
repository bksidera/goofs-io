import gameData from '../data/gameData.json';

export { gameData };

export function initState() {
  const startingCurrency = gameData.meta.engine.currency_start;
  return {
    currency: startingCurrency,
    totalEarned: startingCurrency,
    generators: {},
    upgrades: [],
    achievements: [],
    cards: [],
    selectedCards: [],
    legacy: {
      completions: 0,
      bonus: 0,
    },
    narrativeStage: 'stage1',
    buyAmount: 1,
    // When non-null, the game is paused in a system-crash reboot screen.
    // Shape: { phase, pendingStage, clicksDone, clicksRequired }
    crashMode: null,
    // Stage-1 mechanic. 0-100; fills on clicks, decays at idle. Boils at 100.
    // Survives past stage 1 but the gauge only renders during stage 1.
    temperature: 0,
  };
}
