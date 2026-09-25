// Stage 2+ ambient effect — gold motes drift upward from below the core
// object, signaling the passive-income / "magic internet money" vibe.
// Positions and delays are precomputed (lint-safe; no Math.random in render).
// Pure CSS animation handles the drift + fade.

const MOTES = [
  { left: '8%',  delay: '0s',   dur: '5.4s' },
  { left: '18%', delay: '2.1s', dur: '6.2s' },
  { left: '32%', delay: '0.9s', dur: '5.0s' },
  { left: '45%', delay: '3.3s', dur: '5.8s' },
  { left: '58%', delay: '1.7s', dur: '6.5s' },
  { left: '72%', delay: '4.0s', dur: '5.2s' },
  { left: '85%', delay: '2.8s', dur: '6.0s' },
  { left: '92%', delay: '1.2s', dur: '5.6s' },
];

export default function WizardAura() {
  return (
    <div className="clicker-wizard-aura" aria-hidden="true">
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="clicker-wizard-mote"
          style={{ left: m.left, animationDelay: m.delay, animationDuration: m.dur }}
        />
      ))}
    </div>
  );
}
