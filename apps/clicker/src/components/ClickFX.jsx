// Renders short-lived particles that fly outward from a click point.
// `particles` is pre-computed by FxLayer so render stays pure.

export default function ClickFX({ x, y, color = '#f2c75c', particles }) {
  return (
    <div className="clicker-fx-cluster" style={{ left: x, top: y }}>
      {particles.map(p => (
        <span
          key={p.key}
          className="clicker-fx-particle"
          style={{
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            background: color,
          }}
        />
      ))}
    </div>
  );
}
