// ============================================================
// AdGame Chiptune Audio Engine
// Web Audio API — procedural SNES-style synthesis
// No external library — all sounds generated from oscillators
// ============================================================

// ── Note frequency table (Hz) ────────────────────────────────────────────────
const N = {
  E2: 82.41, B2: 123.47,
  E3: 164.81, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94, D3: 146.83,
  C4: 261.63, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51,
  _: 0,
};

// BPM = 168 → sixteenth note duration
const BPM   = 168;
const BEAT  = 60 / BPM;
const S16   = BEAT / 4; // sixteenth note in seconds

// ── Music sequence: [freq, duration_in_sixteenths]
// Key: E minor   Total: 64 sixteenth notes (4 bars)

const MELODY = [
  // Bar 1 — driving ascending run
  [N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],  [N.B5,1],[N.A5,1],[N.G5,2],
  [N.B5,1],[N.D6,1],[N.B5,1],[N.A5,1],  [N.G5,2],[N.E5,2],
  // Bar 2 — melodic descent
  [N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],  [N.D5,1],[N.E5,1],[N.G5,2],
  [N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],  [N.E5,4],
  // Bar 3 — heroic climb
  [N.B5,2],[N.A5,1],[N.G5,1],  [N.E5,1],[N.G5,1],[N.A5,1],[N.B5,1],
  [N.D6,1],[N.B5,1],[N.A5,1],[N.G5,1],  [N.B5,4],
  // Bar 4 — resolution
  [N.E5,1],[N.G5,1],[N.A5,1],[N.B5,1],  [N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],
  [N.B4,1],[N.D5,1],[N.E5,1],[N.G5,1],  [N.B5,4],
];

const BASS = [
  // Bar 1
  [N.E3,4], [N.E3,2],[N.B3,2],  [N.G3,4], [N.G3,3],[N.A3,1],
  // Bar 2
  [N.E3,4], [N.D3,4],  [N.E3,8],
  // Bar 3
  [N.E3,4], [N.E3,2],[N.B3,2],  [N.G3,3],[N.A3,1], [N.B3,4],
  // Bar 4
  [N.E3,4], [N.A3,4],  [N.B3,4], [N.E3,4],
];

// Arpeggio chords — one chord per 8 sixteenths (half bar), 8 total
const ARP_CHORDS = [
  [N.E4, N.G4, N.B4],   // Em
  [N.G3, N.B4, N.D5],   // G
  [N.E4, N.G4, N.B4],   // Em
  [N.A3, N.C5, N.E5],   // Am
  [N.E4, N.G4, N.B4],   // Em
  [N.G3, N.B4, N.D5],   // G
  [N.A3, N.C5, N.E5],   // Am
  [N.B3, N.D5, N.Fs5],  // Bm
];

// ── Noise buffer helper ───────────────────────────────────────────────────────
function makeNoiseBuffer(ctx, duration = 0.05) {
  const sr     = ctx.sampleRate;
  const frames = Math.ceil(sr * duration);
  const buf    = ctx.createBuffer(1, frames, sr);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// ── AudioEngine class ────────────────────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx          = null;
    this.masterGain   = null;
    this.musicGain    = null;
    this.sfxGain      = null;
    this.muted        = false;
    this._schedulerTimer = null;
    this._musicStep      = 0;
    this._nextNoteTime   = 0;
    this._melodyIdx      = 0;
    this._melodyTime     = 0;
    this._bassIdx        = 0;
    this._bassTime       = 0;
    this._arpStep        = 0;
    this._arpTime        = 0;
    this._loopDuration   = 64 * S16;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.55;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1.0;
    this.sfxGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.08);
    }
  }

  // ── Low-level note scheduler ──────────────────────────────────────────────

  _osc(freq, startT, durT, gainVal, type = 'square', output = null) {
    if (!this.ctx || !freq) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, startT);
    gain.gain.linearRampToValueAtTime(gainVal, startT + 0.008);
    gain.gain.setValueAtTime(gainVal * 0.7, startT + durT * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, startT + durT + 0.01);
    osc.connect(gain);
    gain.connect(output || this.musicGain);
    osc.start(startT);
    osc.stop(startT + durT + 0.02);
  }

  _schedMelodyNote(startT) {
    const [freq, dur] = MELODY[this._melodyIdx];
    this._osc(freq, startT, dur * S16 * 0.85, 0.18, 'square');
    this._melodyTime += dur * S16;
    this._melodyIdx   = (this._melodyIdx + 1) % MELODY.length;
  }

  _schedBassNote(startT) {
    const [freq, dur] = BASS[this._bassIdx];
    this._osc(freq, startT, dur * S16 * 0.7, 0.12, 'triangle');
    this._bassTime += dur * S16;
    this._bassIdx   = (this._bassIdx + 1) % BASS.length;
  }

  _schedArpNote(startT, step) {
    const chord    = ARP_CHORDS[Math.floor(step / 2) % ARP_CHORDS.length];
    const noteFreq = chord[step % 3];
    this._osc(noteFreq, startT, S16 * 0.5, 0.055, 'square');
  }

  _schedDrum(startT, step16) {
    if (!this.ctx) return;
    const beat = step16 % 16;
    // Kick on beats 0, 8
    if (beat === 0 || beat === 8) {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, startT);
      osc.frequency.exponentialRampToValueAtTime(40, startT + 0.08);
      gain.gain.setValueAtTime(0.35, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.1);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(startT);
      osc.stop(startT + 0.15);
    }
    // Snare on beats 4, 12
    if (beat === 4 || beat === 12) {
      const buf  = makeNoiseBuffer(this.ctx, 0.06);
      const src  = this.ctx.createBufferSource();
      const filt = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      filt.type  = 'bandpass';
      filt.frequency.value = 3000;
      gain.gain.setValueAtTime(0.22, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.06);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(this.musicGain);
      src.start(startT);
      src.stop(startT + 0.08);
    }
    // Hi-hat on every even 16th
    if (step16 % 2 === 0) {
      const buf  = makeNoiseBuffer(this.ctx, 0.02);
      const src  = this.ctx.createBufferSource();
      const filt = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      filt.type  = 'highpass';
      filt.frequency.value = 8000;
      gain.gain.setValueAtTime(0.06, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.02);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(this.musicGain);
      src.start(startT);
      src.stop(startT + 0.03);
    }
  }

  // ── Music scheduler loop ──────────────────────────────────────────────────

  _schedule() {
    if (!this.ctx) return;
    const lookahead = 0.15;
    const now = this.ctx.currentTime;

    // Melody scheduling (variable note lengths)
    while (this._melodyTime < now + lookahead) {
      this._schedMelodyNote(this._melodyTime);
    }

    // Bass scheduling (variable note lengths)
    while (this._bassTime < now + lookahead) {
      this._schedBassNote(this._bassTime);
    }

    // Arp + drums scheduling (fixed 16th-note grid)
    while (this._arpTime < now + lookahead) {
      this._schedArpNote(this._arpTime, this._arpStep);
      this._schedDrum(this._arpTime, this._arpStep);
      this._arpTime += S16;
      this._arpStep  = (this._arpStep + 1) % 64;
    }

    this._schedulerTimer = setTimeout(() => this._schedule(), 25);
  }

  startMusic() {
    if (!this.ctx) return;
    const start = this.ctx.currentTime + 0.05;
    this._melodyTime = start;
    this._bassTime   = start;
    this._arpTime    = start;
    this._melodyIdx  = 0;
    this._bassIdx    = 0;
    this._arpStep    = 0;
    this._schedule();
  }

  stopMusic() {
    if (this._schedulerTimer) clearTimeout(this._schedulerTimer);
    this._schedulerTimer = null;
  }

  // ── SFX ─────────────────────────────────────────────────────────────────

  _sfxOsc(freq, dur, gain, type = 'square') {
    if (!this.ctx || this.muted) return;
    const osc  = this.ctx.createOscillator();
    const g    = this.ctx.createGain();
    osc.type   = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur + 0.01);
  }

  _sfxNoise(dur, gainVal, filterFreq = 4000, filterType = 'bandpass') {
    if (!this.ctx || this.muted) return;
    const buf  = makeNoiseBuffer(this.ctx, dur);
    const src  = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const g    = this.ctx.createGain();
    src.buffer = buf;
    filt.type  = filterType;
    filt.frequency.value = filterFreq;
    g.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.sfxGain);
    src.start();
    src.stop(this.ctx.currentTime + dur + 0.01);
  }

  sfxLaneSwitch() {
    if (!this.ctx || this.muted) return;
    this._sfxOsc(N.E6, 0.05, 0.12);
  }

  sfxAdd() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [N.C5, N.E5, N.G5].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.15, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.1);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.12);
    });
  }

  sfxMultiply() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.22, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.2);
    });
    // Cash register ping
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type  = 'triangle';
    osc.frequency.value = 1200;
    g.gain.setValueAtTime(0.2, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t + 0.25);
    osc.stop(t + 0.6);
  }

  sfxEnemy() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type  = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  sfxPctEnemy() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type  = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  sfxTrap() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    // Record scratch: quick rising then falling pitch noise
    this._sfxNoise(0.08, 0.3, 2000, 'bandpass');
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type  = 'sawtooth';
    osc.frequency.setValueAtTime(600, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    g.gain.setValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t + 0.05);
    osc.stop(t + 0.4);
  }

  sfxMystery() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    // Slot machine spin: 5 rapid ascending bleeps
    [N.C5, N.E5, N.G5, N.B5, N.E6].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.12, t + i * 0.055);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.055 + 0.05);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.055);
      osc.stop(t + i * 0.055 + 0.06);
    });
  }

  sfxPopupAppear() {
    if (!this.ctx || this.muted) return;
    // AIM door-open style: short rising two-tone
    const t = this.ctx.currentTime;
    [[N.A4, 0], [N.D5, 0.09]].forEach(([f, offset]) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.14, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.1);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.12);
    });
  }

  sfxPopupDismiss() {
    if (!this.ctx || this.muted) return;
    this._sfxNoise(0.04, 0.18, 3000, 'highpass');
  }

  sfxPopupDodge() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type  = 'square';
    osc.frequency.setValueAtTime(N.G4, t);
    osc.frequency.exponentialRampToValueAtTime(N.G6 || 1568, t + 0.1);
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  sfxWrongButton() {
    if (!this.ctx || this.muted) return;
    this._sfxOsc(110, 0.18, 0.2, 'sawtooth');
  }

  sfxWaveTransition() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [N.C5, N.D5, N.E5, N.G5, N.C6].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.16, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.14);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.16);
    });
  }

  sfxDeath() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    // Sad trombone descent
    [N.B4, N.A4, N.G4, N.E4, N.D4, N.B3].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'sawtooth';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.22, t + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.13 + 0.2);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.13);
      osc.stop(t + i * 0.13 + 0.22);
    });
  }

  sfxCombo() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type  = 'square';
    osc.frequency.setValueAtTime(N.G5, t);
    osc.frequency.setValueAtTime(N.B5, t + 0.06);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  sfxGameStart() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    // Power-up rising sweep
    [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.C6].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'square';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.14, t + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.14);
    });
  }

  sfxBossPopup() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    // Dramatic alarm sting
    [0, 0.15, 0.30].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type  = 'sawtooth';
      osc.frequency.setValueAtTime(880, t + offset);
      osc.frequency.setValueAtTime(440, t + offset + 0.07);
      g.gain.setValueAtTime(0.25, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.14);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.15);
    });
  }
}

// ── Singleton export ─────────────────────────────────────────────────────────
export const audio = new AudioEngine();
