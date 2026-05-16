import { TEMP_MAX } from '../game/logic.js';

// Stage-1 only. A horizontal heat gauge that fills as the player clicks.
// At 100, fires the boil bonus (handled by the parent screen).
// Briefly flashes red when boiling — driven by the `boiling` prop.
export default function TemperatureGauge({ temperature, boiling }) {
  const pct = Math.min(100, ((temperature ?? 0) / TEMP_MAX) * 100);
  return (
    <div className={`clicker-temp-gauge${boiling ? ' boiling' : ''}`}>
      <div className="clicker-temp-label">HEAT</div>
      <div className="clicker-temp-track">
        <div className="clicker-temp-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="clicker-temp-value">{Math.floor(pct)}°</div>
    </div>
  );
}
