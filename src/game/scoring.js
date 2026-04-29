const HS_KEY = 'adgame_highscore';

export const calcScore = (peakPower, wave) => Math.floor(peakPower * wave);

export const getHighScore = () => {
  try { return parseInt(localStorage.getItem(HS_KEY) || '0', 10); } catch { return 0; }
};

export const saveHighScore = (score) => {
  try {
    const current = getHighScore();
    if (score > current) localStorage.setItem(HS_KEY, String(score));
    return Math.max(score, current);
  } catch { return score; }
};
