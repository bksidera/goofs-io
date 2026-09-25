const HS_KEY = 'adgame_highscore';
const CAMPAIGN_KEY = 'adgame_campaign_cleared';

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

export const isCampaignCleared = () => {
  try { return localStorage.getItem(CAMPAIGN_KEY) === '1'; } catch { return false; }
};

export const saveCampaignCleared = () => {
  try { localStorage.setItem(CAMPAIGN_KEY, '1'); } catch { /* no persistence */ }
};

// Finalize a run: persist high score, unlock endless on victory.
// Returns the summary the death/victory screen renders.
export const finalizeRun = (st) => {
  saveHighScore(st.score);
  if (st.victory) saveCampaignCleared();
  return {
    score: st.score,
    level: st.mode === 'endless' ? Math.floor(st.elapsed) : st.levelIndex + 1,
    peak: Math.floor(st.player.peakPower),
    victory: st.victory,
    mode: st.mode,
  };
};
