import { gameData } from '../state.js';
import { formatNumber } from '../constants.js';

/*
 * Always-visible progress bar toward the next narrative stage.
 * Reads unlock thresholds directly from the arc's data.json (currency-typed).
 * Renders nothing on the final stage.
 */
export default function StageProgressBar({ state, currentStageId }) {
  const stages = gameData.narrative_stages;
  const currentIdx = stages.findIndex((s) => s.id === currentStageId);
  if (currentIdx === -1) return null;

  const currentStage = stages[currentIdx];
  const nextStage = stages[currentIdx + 1];

  // Final stage — no "next" to progress toward.
  if (!nextStage) {
    return (
      <div className="clicker-stage-progress">
        <div className="clicker-stage-progress-meta">
          <span className="clicker-stage-progress-label">STAGE {currentIdx + 1}/{stages.length}</span>
          <span className="clicker-stage-progress-value">
            <strong>{currentStage.theme.name}</strong>
          </span>
        </div>
        <div className="clicker-stage-progress-track">
          <div className="clicker-stage-progress-fill" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  const nextThreshold =
    nextStage.unlock_condition?.type === 'currency'
      ? nextStage.unlock_condition.value
      : null;

  const prevThreshold =
    currentStage.unlock_condition?.type === 'currency'
      ? currentStage.unlock_condition.value
      : 0;

  const total = Math.floor(state.totalEarned || 0);
  const span = Math.max(1, (nextThreshold ?? total) - prevThreshold);
  const advance = Math.max(0, total - prevThreshold);
  const pct = Math.min(100, Math.max(0, (advance / span) * 100));

  return (
    <div className="clicker-stage-progress">
      <div className="clicker-stage-progress-meta">
        <span className="clicker-stage-progress-label">
          STAGE {currentIdx + 1}/{stages.length} → {nextStage.theme.name.toUpperCase()}
        </span>
        <span className="clicker-stage-progress-value">
          <strong>{formatNumber(total)}</strong>
          {nextThreshold != null && (
            <>
              {' / '}
              {formatNumber(nextThreshold)}
            </>
          )}
        </span>
      </div>
      <div className="clicker-stage-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="clicker-stage-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
