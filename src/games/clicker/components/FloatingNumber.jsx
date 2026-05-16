import { formatNumber } from '../game/constants.js';

// A "+N" that drifts upward and fades over ~1s. Mounted briefly by FxLayer.
export default function FloatingNumber({ x, y, value }) {
  return (
    <div
      className="clicker-floating-number"
      style={{ left: x, top: y }}
    >
      +{formatNumber(value)}
    </div>
  );
}
