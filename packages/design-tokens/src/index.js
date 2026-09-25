// goofs.io design tokens — JS export.
// Consume in code: import { colors, motion } from '@goofs/design-tokens';
// Consume in CSS: import '@goofs/design-tokens/tokens.css'; then use var(--goofs-*).

// -------- COLORS --------
// Cyberpunk / cypherpunk. Void black + bright terminal accents. No safe grays.
export const colors = {
  // core
  void:      '#08080f', // absolute black-tinted-blue background
  ink:       '#0d0d1a', // one shade up — card surfaces
  fog:       '#1a1a2e', // borders on dark surfaces
  fg:        '#ffffff', // primary text
  fgDim:     '#888899', // secondary text
  fgGhost:   '#3a3a4d', // tertiary / disabled
  hairline:  '#222236', // subtle dividers

  // signal — the studio palette
  matrix:    '#00FF41', // terminal green (Matrix rain, "PLAYABLE" status)
  magenta:   '#FF2D95', // AdGame hot pink accent
  gold:      '#F2C75C', // Clicker warm accent
  cyan:      '#00E5FF', // cypherpunk secondary
  acid:      '#B4FF00', // hazard / accent
  glitch:    '#FF3355', // error / death / danger
  amber:     '#FFB000', // caution / warning

  // named semantic
  bg:        '#08080f',
  surface:   '#0d0d1a',
  border:    '#1a1a2e',
  text:      '#ffffff',
  textDim:   '#888899',
  success:   '#00FF41',
  danger:    '#FF3355',
};

// -------- TYPOGRAPHY --------
// Two-face system: mono for body/UI, display for headings/hero.
export const type = {
  fontMono: `'JetBrains Mono', 'IBM Plex Mono', 'Berkeley Mono', 'Courier New', ui-monospace, monospace`,
  fontDisplay: `'Space Mono', 'JetBrains Mono', 'Courier New', monospace`,

  // scale (rem-based, 16px root)
  size: {
    xs:   '0.6875rem', // 11
    sm:   '0.75rem',   // 12
    base: '0.875rem',  // 14
    md:   '1rem',      // 16
    lg:   '1.25rem',   // 20
    xl:   '1.5rem',    // 24
    xxl:  '2rem',      // 32
    hero: '3rem',      // 48
  },

  weight: {
    regular: 400,
    medium:  500,
    bold:    700,
    black:   900,
  },

  tracking: {
    tight:  '-0.02em',
    normal: '0',
    wide:   '0.08em',
    ultra:  '0.2em',
  },
};

// -------- SPACING --------
// 8px base with a few off-scale finesse values.
export const space = {
  '0':   '0',
  '1':   '0.25rem', // 4
  '2':   '0.5rem',  // 8
  '3':   '0.75rem', // 12
  '4':   '1rem',    // 16
  '5':   '1.5rem',  // 24
  '6':   '2rem',    // 32
  '7':   '2.5rem',  // 40
  '8':   '3rem',    // 48
  '9':   '4rem',    // 64
  '10':  '6rem',    // 96
};

// -------- MOTION --------
// Timing + easings tuned for game-feel + interface polish.
export const motion = {
  duration: {
    instant: '80ms',
    fast:    '120ms',
    base:    '220ms',
    slow:    '480ms',
    epic:    '900ms',
  },
  easing: {
    // punchy entrances, cinematic exits, straight-line motion
    out:    'cubic-bezier(0.16, 1, 0.3, 1)',     // decel — element arrives with weight
    in:     'cubic-bezier(0.7, 0, 0.84, 0)',      // accel — element leaves fast
    inOut:  'cubic-bezier(0.65, 0, 0.35, 1)',     // symmetric — for morphs
    linear: 'linear',
    snap:   'cubic-bezier(0.5, 0, 0.5, 1.5)',     // overshoot — for pop
  },
};

// -------- ELEVATION / GLOW --------
// Cyberpunk uses glow instead of shadow. Two systems: subtle depth + signal glow.
export const glow = {
  soft:   (c = colors.magenta) => `0 0 12px ${c}44`,
  hard:   (c = colors.magenta) => `0 0 24px ${c}88, 0 0 48px ${c}44`,
  inset:  (c = colors.magenta) => `inset 0 0 24px ${c}22`,
  depth:  '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
};

// -------- RADIUS --------
export const radius = {
  none: '0',
  sm:   '2px',
  md:   '4px',
  lg:   '8px',
  full: '9999px',
};

// -------- BREAKPOINTS --------
export const bp = {
  mobile:  '480px',
  tablet:  '768px',
  laptop:  '1024px',
  desktop: '1440px',
};

export default { colors, type, space, motion, glow, radius, bp };
