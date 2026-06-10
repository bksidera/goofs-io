import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { startLevel } from './levels.js';

// Matrix rain — vertical columns of green glyphs that scroll downward.
// Each column owns its own glyph buffer so characters appear to mutate over time.
const RAIN_GLYPHS = '0123456789ABCDEFアカサタナハマヤラワ@#$%&*+=<>?/\\|';
const RAIN_COL_W  = 12;

function makeRain() {
  const cols = Math.ceil(GAME_WIDTH / RAIN_COL_W) + 1;
  return Array.from({ length: cols }, (_, i) => {
    const len = 8 + Math.floor(Math.random() * 14);
    return {
      x:    i * RAIN_COL_W,
      y:    Math.random() * GAME_HEIGHT,
      sp:   0.6 + Math.random() * 1.6,
      len,
      glyphs: Array.from({ length: len }, () => RAIN_GLYPHS[Math.floor(Math.random() * RAIN_GLYPHS.length)]),
      mutateTimer: Math.random() * 200,
      brightness:  0.4 + Math.random() * 0.5,
    };
  });
}

export const RAIN_COL_WIDTH = RAIN_COL_W;
export const RAIN_GLYPH_SET = RAIN_GLYPHS;

// mode: 'campaign' (9 levels + bosses) or 'endless' (INFINITE SCROLL).
export const initState = (mode = 'campaign') => {
  const st = {
    mode,
    player: { lane: 1, power: 100, peakPower: 100, targetPower: 100, displayPower: 100 },

    gates: [],
    particles: [],
    floats: [],
    pops: [],
    trail: [],
    rain: makeRain(),

    // Level flow
    levelIndex: 0,
    levelPhase: 'intro',
    phaseTimer: 0,
    gatesSpawned: 0,
    boss: null,
    elapsed: 0,

    // Run economy
    score: 0,
    lastLevelScore: 0,
    victory: false,
    dead: false,
    usedRevive: false,
    invulnTimer: 0,
    hitStop: 0,

    scrollSpeed: 2.3,
    spawnTimer: 0,

    frame: 0,
    lastTime: performance.now(),
    paused: false,

    shakeX: 0, shakeY: 0, shakeTimer: 0,
    flashAlpha: 0, flashColor: '#fff',

    combo: 0, comboTimer: 0,

    tutIdx: 0, tutTimer: 0, showTut: mode === 'campaign',
    waveMsg: '', waveMsgTimer: 0,
    popCooldown: 0,

    scanOff: 0,
    glitchTimer: 0, glitchOn: false,

    infected: false,
    infectionFlash: 0,
    infectionTextTimer: 0,
    scrambleSeed: 0,

    decayVisual: 0,
  };

  if (mode === 'campaign') {
    startLevel(st, 0);
  } else {
    // Endless throws level-9-grade gates from second one; 100 starting power
    // would be a coin-flip death. Start meatier.
    st.levelPhase = 'running';
    st.player.power = 400;
    st.player.targetPower = 400;
    st.player.displayPower = 400;
    st.player.peakPower = 400;
  }
  return st;
};
