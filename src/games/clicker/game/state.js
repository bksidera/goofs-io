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
    // Shape: { pendingStage: 'stageN', clicksDone: 0, clicksRequired: 50 }
    crashMode: null,
  };
}
