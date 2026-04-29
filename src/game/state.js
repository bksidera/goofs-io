import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export const initState = () => ({
  player: { lane: 1, power: 100, peakPower: 100, targetPower: 100, displayPower: 100 },

  gates: [],
  particles: [],
  floats: [],
  pops: [],
  trail: [],
  stars: Array.from({ length: 25 }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    sp: 0.3 + Math.random() * 0.7,
    br: 0.1 + Math.random() * 0.25,
  })),

  wave: 1,
  waveGates: 0,
  gatesPerWave: 8,
  scrollSpeed: 2.2,
  spawnTimer: 0,
  spawnInterval: 1100,

  frame: 0,
  lastTime: performance.now(),
  gameOver: false,
  paused: false,

  shakeX: 0, shakeY: 0, shakeTimer: 0,
  flashAlpha: 0, flashColor: '#fff',

  combo: 0, comboTimer: 0,

  tutIdx: 0, tutTimer: 0, showTut: true,
  waveMsg: '', waveMsgTimer: 0,
  popCooldown: 0,

  scanOff: 0,
  glitchTimer: 0, glitchOn: false,

  infected: false,
  infectionFlash: 0,       // green flash when infection cleared
  infectionTextTimer: 0,   // drives text scramble every ~500ms
  scrambleSeed: 0,

  decayRate: 0,
  decayVisual: 0,          // 0-1, used to intensify visuals
});
