import { STAGE_CRASH_LINES } from '../copy/banks.js';

// Renders the full-screen crash + reboot prompt. Pure: takes crashMode +
// onRebootClick, displays glitch UI, calls back on each REBOOT click.
export default function SystemCrashOverlay({ crashMode, onRebootClick }) {
  if (!crashMode) return null;

  const { pendingStage, clicksDone, clicksRequired } = crashMode;
  const flavor = STAGE_CRASH_LINES[pendingStage] ?? 'SYSTEM INTEGRITY COMPROMISED.';
  const progressCells = 20;
  const filled = Math.round((clicksDone / clicksRequired) * progressCells);
  const bar = '█'.repeat(filled) + '░'.repeat(progressCells - filled);

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
