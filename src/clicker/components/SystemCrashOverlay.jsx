import { STAGE_CRASH_LINES, STAGE_LOADING_LINES } from '../copy/banks.js';
import { gameData } from '../game/state.js';

// Two-phase crash overlay:
//   - 'rebooting'      → glitch header + REBOOT button + click progress bar
//   - 'reinitializing' → full bar + animated loader + stage-name reveal
export default function SystemCrashOverlay({ crashMode, onRebootClick }) {
  if (!crashMode) return null;

  const { phase, pendingStage, clicksDone, clicksRequired } = crashMode;
  const progressCells = 20;
  const filled =
    phase === 'reinitializing'
      ? progressCells
      : Math.round((clicksDone / clicksRequired) * progressCells);
  const bar = '█'.repeat(filled) + '░'.repeat(progressCells - filled);

  if (phase === 'reinitializing') {
    const loading = STAGE_LOADING_LINES[pendingStage] ?? 'MOUNTING NEW STAGE';
    const nextStageName =
      gameData.narrative_stages.find(s => s.id === pendingStage)?.theme?.name ?? '';
    return (
      <div className="clicker-crash-overlay" role="dialog" aria-label="System reinitializing">
        <div className="clicker-crash-scanlines" aria-hidden="true" />
        <div className="clicker-crash-content">
          <div className="clicker-crash-header" data-text="REINITIALIZING">REINITIALIZING</div>
          <pre className="clicker-crash-flavor">{loading}<span className="clicker-loader-dots" /></pre>
          <div className="clicker-crash-progress">
            <pre className="clicker-crash-bar">[{bar}]</pre>
            <div className="clicker-crash-count">SYSTEM READY</div>
          </div>
          <pre className="clicker-crash-loading-stage">LOADING: {nextStageName.toUpperCase()}</pre>
        </div>
      </div>
    );
  }

  const flavor = STAGE_CRASH_LINES[pendingStage] ?? 'SYSTEM INTEGRITY COMPROMISED.';
  return (
    <div className="clicker-crash-overlay" role="dialog" aria-label="System crash">
      <div className="clicker-crash-scanlines" aria-hidden="true" />
      <div className="clicker-crash-content">
        <div className="clicker-crash-header" data-text="SYSTEM CRASH">SYSTEM CRASH</div>
        <pre className="clicker-crash-flavor">{flavor}</pre>

        <button
          type="button"
          className="clicker-reboot-btn"
          onClick={onRebootClick}
        >
          ⏻ REBOOT
        </button>

        <div className="clicker-crash-progress">
          <pre className="clicker-crash-bar">[{bar}]</pre>
          <div className="clicker-crash-count">{clicksDone} / {clicksRequired}</div>
        </div>

        <pre className="clicker-crash-hint">PRESS REBOOT REPEATEDLY TO RESTORE SERVICE</pre>
      </div>
    </div>
  );
}
