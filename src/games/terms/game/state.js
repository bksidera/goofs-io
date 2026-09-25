import { GAME_WIDTH, GAME_HEIGHT, HEADER_H, FOOTER_H, BUTTON_W, BUTTON_H, MODAL_W, MODAL_H } from './constants.js';
import { getStage } from './campaign.js';
import { randomFrom } from '../utils/helpers.js';
import { MODAL_TITLES, MODAL_BODIES, VENDOR_NAMES } from '../copy/banks.js';

let nextId = 1;
const id = (prefix) => `${prefix}-${nextId++}`;

function makeButton(st, kind, label, x, y, extra = {}) {
  return {
    id: id('btn'),
    kind,
    label,
    baseLabel: label,
    x, y,
    w: BUTTON_W,
    h: BUTTON_H,
    trap: kind === 'accept',
    alive: true,
    vx: 0,
    vy: 0,
    heat: 0,
    ...extra,
  };
}

export function spawnModal(st, opts = {}) {
  const stage = st.stage;
  const aliveCount = st.modals.filter(m => m.alive).length;
  if (!opts.force && aliveCount >= stage.maxModals) return null;
  const tier = opts.tier || 'normal';
  const w = tier === 'small' ? 178 : MODAL_W;
  const h = tier === 'small' ? 104 : MODAL_H;
  const x = opts.x ?? Math.max(10, Math.min(GAME_WIDTH - w - 10, 18 + st.rng() * (GAME_WIDTH - w - 36)));
  const y = opts.y ?? Math.max(88, Math.min(GAME_HEIGHT - h - 80, 96 + st.rng() * 300));
  const modal = {
    id: id('modal'),
    title: opts.title || randomFrom(MODAL_TITLES, st.rng),
    body: opts.body || randomFrom(MODAL_BODIES, st.rng),
    x, y, w, h, tier,
    hydra: !!opts.hydra,
    alive: true,
    age: 0,
  };
  st.modals.push(modal);
  return modal;
}

function makeToggles(st) {
  return VENDOR_NAMES.slice(0, 4 + Math.min(4, st.stageIndex)).map((name, i) => ({
    id: id('toggle'),
    name,
    x: 38,
    y: 156 + i * 35,
    w: 284,
    h: 28,
    on: true,
    rebound: 1.8 + st.rng() * 1.7,
    pulse: st.rng() * 10,
  }));
}

function makeHazards(st) {
  const hazards = [];
  if (!st.stage.patterns.includes('terrain')) return hazards;
  const count = st.stage.boss ? 7 : 4;
  for (let i = 0; i < count; i++) {
    hazards.push({
      id: id('haz'),
      type: 'fineprint',
      x: 18 + st.rng() * 260,
      y: 110 + st.rng() * 390,
      w: 82 + st.rng() * 80,
      h: 12,
      vx: (st.rng() - 0.5) * (0.5 + st.stage.corruption),
      vy: 0.35 + st.rng() * 0.65,
      text: i % 2 ? 'binding arbitration' : 'material changes apply',
    });
  }
  return hazards;
}

export function beginStage(st, stageIndex = st.stageIndex) {
  st.stageIndex = stageIndex;
  st.stage = getStage(st);
  st.phase = 'intro';
  st.phaseTimer = 2.25;
  st.patience = 100;
  st.consent = Math.max(0, st.consent * 0.18);
  st.rejections = 0;
  st.required = st.stage.objective;
  st.timeLeft = st.stage.seconds;
  st.buttons = [];
  st.modals = [];
  st.toggles = st.stage.patterns.includes('toggles') || st.stage.patterns.includes('vendors') ? makeToggles(st) : [];
  st.hazards = makeHazards(st);
  st.particles = [];
  st.notice = st.stage.joke;
  st.resultLine = st.stage.result;
  st.swapTimer = 2.6;
  st.swapTelegraph = 0;
  st.swapActive = 0;
  st.overwriteTimer = 3.2;
  st.overwriteActive = 0;
  st.delayTimer = 0;
  st.modalTimer = 1.4;
  st.vendorTimer = 2.1;
  st.bossHits = 0;
  st.bossPulse = 0;

  const decline = randomFrom(st.stage.declineLabels, st.rng);
  const accept = randomFrom(st.stage.acceptLabels, st.rng);
  st.buttons.push(makeButton(st, 'decline', decline, 34, 500, { primary: true }));
  st.buttons.push(makeButton(st, 'accept', accept, 198, 500, { primary: true }));
  if (st.stage.patterns.includes('confirmshame')) {
    st.buttons.push(makeButton(st, 'accept', 'I prefer the bad version', 70, 438, { w: 220, h: 26, small: true }));
  }
  if (st.stage.boss) {
    st.buttons.push(makeButton(st, 'bossAccept', 'ACCEPT ALL', 72, 252, { w: 216, h: 74, trap: true, boss: true }));
    spawnModal(st, { force: true, title: 'FINAL WARNING', body: 'Find real rejection windows. Do not trust the blue one.', x: 58, y: 98 });
  }
}

export function initState(mode = 'campaign', rng = Math.random) {
  const st = {
    mode,
    rng,
    cursor: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - FOOTER_H - 28, tx: GAME_WIDTH / 2, ty: GAME_HEIGHT - FOOTER_H - 28, vx: 0, vy: 0 },
    keys: {},
    score: 0,
    totalRejections: 0,
    consent: 0,
    patience: 100,
    stageIndex: 0,
    stage: null,
    phase: 'intro',
    phaseTimer: 0,
    elapsed: 0,
    required: 0,
    rejections: 0,
    timeLeft: 0,
    buttons: [],
    modals: [],
    toggles: [],
    hazards: [],
    particles: [],
    notice: '',
    resultLine: '',
    failReason: '',
    dead: false,
    victory: false,
    paused: false,
    frame: 0,
    lastTime: performance.now(),
    swapTimer: 0,
    swapTelegraph: 0,
    swapActive: 0,
    overwriteTimer: 0,
    overwriteActive: 0,
    delayTimer: 0,
    modalTimer: 0,
    vendorTimer: 0,
    bossHits: 0,
    bossPulse: 0,
    shake: 0,
    flash: 0,
    flashColor: '#ffffff',
  };
  beginStage(st, 0);
  return st;
}

export function actionables(st) {
  return {
    buttons: st.buttons.filter(b => b.alive),
    modals: st.modals.filter(m => m.alive),
    toggles: st.toggles,
  };
}
