// Golden-cookie-style random event. A parachute drifts down the screen at a
// random x position; catch it before it lands for a CPS-scaled windfall.
// The parent owns scheduling and reward logic — this component just renders
// the falling target and reports clicks. `drop` is { id, x } or null.
export default function AirdropEvent({ drop, onCatch }) {
  if (!drop) return null;
  return (
    <button
      type="button"
      className="clicker-airdrop"
      style={{ left: `${drop.x}%` }}
      onClick={() => onCatch(drop.id)}
      aria-label="Catch the airdrop"
    >
      🪂
    </button>
  );
}
