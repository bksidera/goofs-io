const HS_KEY = 'terms_highscore';
const CLEAR_KEY = 'terms_campaign_cleared';

export function getHighScore() {
  try { return parseInt(localStorage.getItem(HS_KEY) || '0', 10); } catch { return 0; }
}

export function saveHighScore(score) {
  try {
    const current = getHighScore();
    if (score > current) localStorage.setItem(HS_KEY, String(score));
    return Math.max(score, current);
  } catch {
    return score;
  }
}

export function isCampaignCleared() {
  try { return localStorage.getItem(CLEAR_KEY) === '1'; } catch { return false; }
}

export function saveCampaignCleared() {
  try { localStorage.setItem(CLEAR_KEY, '1'); } catch { /* persistence optional */ }
}

export function finalizeRun(st) {
  const score = Math.max(0, Math.floor(st.score));
  saveHighScore(score);
  if (st.victory) saveCampaignCleared();
  return {
    score,
    stage: st.mode === 'endless' ? 'Auto-Renewal' : st.stage.name,
    stageNumber: st.mode === 'endless' ? Math.floor(st.elapsed) : st.stageIndex + 1,
    rejections: st.totalRejections,
    victory: st.victory,
    mode: st.mode,
    reason: st.failReason,
    punchline: st.resultLine,
  };
}
