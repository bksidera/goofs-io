import { GAME_WIDTH, GAME_HEIGHT, HEADER_H, FOOTER_H, BOSS_REQUIRED_HITS, REJECTION_SCORE, CLEAN_REJECTION_BONUS } from './constants.js';
import { STAGES } from './campaign.js';
import { beginStage, spawnModal } from './state.js';
import { clamp, dist, randomFrom, rectHit } from '../utils/helpers.js';

function addParticles(st, x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    st.particles.push({
      x, y,
      vx: (st.rng() - 0.5) * 5,
      vy: (st.rng() - 0.5) * 5 - 1.5,
      life: 1,
      size: 2 + st.rng() * 4,
      color,
    });
  }
}

export function punish(st, amount, consent, reason) {
  st.patience -= amount;
  st.consent += consent;
  st.shake = Math.max(st.shake, 0.35);
  st.flash = Math.max(st.flash, 0.25);
  st.flashColor = '#FF3B4F';
  if (reason) st.notice = reason;
}

export function rewardRejection(st, x, y, label = 'DECLINED') {
  const timeBonus = Math.max(0, Math.floor(st.timeLeft * 3));
  const cleanBonus = st.consent < 35 ? CLEAN_REJECTION_BONUS : 0;
  st.score += REJECTION_SCORE + timeBonus + cleanBonus;
  st.rejections += 1;
  st.totalRejections += 1;
  st.consent = Math.max(0, st.consent - 7);
  st.notice = `${label}: ${st.rejections}/${st.required === Infinity ? '∞' : st.required}`;
  addParticles(st, x, y, '#4DE1C1', 18);
  st.flash = Math.max(st.flash, 0.15);
  st.flashColor = '#4DE1C1';
}

function completeStage(st) {
  const patienceBonus = Math.floor(st.patience * 12);
  st.score += patienceBonus;
  st.phase = 'clear';
  st.phaseTimer = 2.1;
  st.buttons = [];
  st.modals = [];
  st.notice = st.stage.result;
  st.resultLine = st.stage.result;
}

function failRun(st, reason) {
  st.dead = true;
  st.phase = 'dead';
  st.failReason = reason;
  st.resultLine = reason;
}

export function advanceAfterClear(st) {
  if (st.mode === 'endless') {
    beginStage(st, 0);
    st.consent = 8 + Math.min(55, st.elapsed * 0.05);
    return;
  }
  if (st.stageIndex + 1 >= STAGES.length) {
    st.victory = true;
    st.dead = true;
    st.phase = 'victory';
    return;
  }
  beginStage(st, st.stageIndex + 1);
}

function ensureFairButton(st) {
  if (st.phase !== 'running') return;
  const decline = st.buttons.find(b => b.alive && b.kind === 'decline');
  if (!decline) return;
  decline.x = clamp(decline.x, 16, GAME_WIDTH - decline.w - 16);
  decline.y = clamp(decline.y, HEADER_H + 32, GAME_HEIGHT - FOOTER_H - decline.h - 12);
  const accept = st.buttons.find(b => b.alive && (b.kind === 'accept' || b.kind === 'bossAccept'));
  if (accept && Math.abs(decline.x - accept.x) < 60 && Math.abs(decline.y - accept.y) < 46) {
    decline.x = accept.x < GAME_WIDTH / 2 ? GAME_WIDTH - decline.w - 24 : 24;
  }
}

function tickEvasion(st, dtSecs) {
  const decline = st.buttons.find(b => b.alive && b.kind === 'decline');
  if (!decline) return;
  const center = { x: decline.x + decline.w / 2, y: decline.y + decline.h / 2 };
  const d = dist(st.cursor, center);
  if (d < 86) {
    const awayX = center.x - st.cursor.x;
    const awayY = center.y - st.cursor.y;
    const mag = Math.max(1, Math.hypot(awayX, awayY));
    const speed = 118 + st.stage.corruption * 120;
    decline.x += (awayX / mag) * speed * dtSecs;
    decline.y += (awayY / mag) * speed * dtSecs;
    decline.heat = 1;
  } else {
    decline.heat = Math.max(0, decline.heat - dtSecs * 2);
  }
}

function tickLabelSwap(st, dtSecs) {
  if (!st.stage.patterns.includes('labelSwap')) return;
  st.swapTimer -= dtSecs;
  if (st.swapActive > 0) {
    st.swapActive -= dtSecs;
    if (st.swapActive <= 0) {
      for (const b of st.buttons) b.label = b.baseLabel;
      st.swapTimer = 3.5 + st.rng() * 2.5;
      st.notice = 'Labels restored. Nothing suspicious happened.';
    }
    return;
  }
  if (st.swapTelegraph > 0) {
    st.swapTelegraph -= dtSecs;
    if (st.swapTelegraph <= 0) {
      const decline = st.buttons.find(b => b.alive && b.kind === 'decline');
      const accept = st.buttons.find(b => b.alive && b.kind === 'accept');
      if (decline && accept) {
        const a = decline.label;
        decline.label = accept.label;
        accept.label = a;
        st.swapActive = 0.7;
        st.notice = 'Labels are currently experiencing optimization.';
      }
    }
    return;
  }
  if (st.swapTimer <= 0) {
    st.swapTelegraph = 0.48;
    st.notice = 'Label swap detected. Wait for truth to stop flickering.';
  }
}

function tickOverwrite(st, dtSecs) {
  if (!st.stage.patterns.includes('labelOverwrite')) return;
  st.overwriteTimer -= dtSecs;
  if (st.overwriteActive > 0) {
    st.overwriteActive -= dtSecs;
    if (st.overwriteActive <= 0) {
      for (const b of st.buttons) b.label = b.baseLabel;
      st.overwriteTimer = 4.5 + st.rng() * 2;
      st.notice = 'Button identity restored.';
    }
    return;
  }
  if (st.overwriteTimer <= 0) {
    for (const b of st.buttons) b.label = 'ACCEPT';
    st.overwriteActive = 0.9;
    st.notice = 'Hostile label overwrite. Do not click.';
  }
}

function tickToggles(st, dtSecs) {
  if (!st.toggles.length) return;
  for (const t of st.toggles) {
    t.pulse += dtSecs;
    if (!t.on) {
      t.rebound -= dtSecs;
      if (t.rebound <= 0) {
        t.on = true;
        t.rebound = 1.4 + st.rng() * 2.2;
        st.consent += 3.5;
        st.notice = `${t.name} remembered it loves personalization.`;
      }
    }
  }
}

function tickModalStack(st, dtSecs) {
  if (!st.stage.patterns.includes('modalStack') && !st.stage.boss) return;
  st.modalTimer -= dtSecs;
  const cadence = st.stage.boss ? 2.8 : 4.5 - st.stage.corruption * 1.5;
  if (st.modalTimer <= 0) {
    spawnModal(st, { hydra: st.stage.patterns.includes('hydra') && st.rng() < 0.55 });
    st.modalTimer = cadence + st.rng() * 1.8;
  }
  for (const m of st.modals) m.age += dtSecs;
}

function tickDelay(st, dtSecs) {
  if (!st.stage.patterns.includes('delay')) return;
  if (st.delayTimer <= 0 && st.rng() < dtSecs * 0.12) {
    st.delayTimer = 1.6;
    st.notice = 'Saving preferences... please remain vulnerable.';
  }
  if (st.delayTimer > 0) {
    st.delayTimer -= dtSecs;
    st.patience -= dtSecs * 2.8;
    st.consent += dtSecs * 1.3;
  }
}

function tickVendors(st, dtSecs) {
  if (!st.stage.patterns.includes('vendors')) return;
  st.vendorTimer -= dtSecs;
  if (st.vendorTimer > 0) return;
  st.vendorTimer = 2.5 + st.rng() * 2;
  const label = randomFrom(st.stage.acceptLabels, st.rng);
  st.buttons.push({
    id: `vendor-${Math.floor(st.rng() * 999999)}`,
    kind: 'accept',
    label,
    baseLabel: label,
    x: 24 + st.rng() * 190,
    y: 132 + st.rng() * 330,
    w: 118,
    h: 32,
    trap: true,
    alive: true,
    vx: (st.rng() - 0.5) * 24,
    vy: (st.rng() - 0.5) * 24,
    small: true,
  });
}

function tickMagnet(st, dtSecs) {
  if (!st.stage.patterns.includes('magnet')) return;
  const accept = st.buttons.find(b => b.alive && (b.kind === 'accept' || b.kind === 'bossAccept'));
  if (!accept) return;
  const center = { x: accept.x + accept.w / 2, y: accept.y + accept.h / 2 };
  const pull = (0.24 + st.consent / 240) * dtSecs;
  st.cursor.x += (center.x - st.cursor.x) * pull;
  st.cursor.y += (center.y - st.cursor.y) * pull;
}

function tickHazards(st, dtSecs) {
  for (const h of st.hazards) {
    h.x += h.vx * dtSecs * 60;
    h.y += h.vy * dtSecs * 60;
    if (h.y > GAME_HEIGHT - FOOTER_H) h.y = HEADER_H + 18;
    if (h.x < 10 || h.x + h.w > GAME_WIDTH - 10) h.vx *= -1;
    if (rectHit(st.cursor.x, st.cursor.y, h)) {
      punish(st, dtSecs * 11, dtSecs * 4, 'Fine print contact. Patience is not a legal defense.');
    }
  }
}

function tickBoss(st, dtSecs) {
  if (!st.stage.boss) return;
  st.bossPulse += dtSecs;
  const boss = st.buttons.find(b => b.alive && b.kind === 'bossAccept');
  if (boss) {
    const scale = 1 + Math.sin(st.bossPulse * 4) * 0.04 + st.consent / 850;
    boss.w = 216 * scale;
    boss.h = 74 * scale;
    boss.x = GAME_WIDTH / 2 - boss.w / 2;
    boss.y = 252 - (boss.h - 74) / 2;
  }
}

export function tickPatterns(st, dtSecs) {
  if (st.stage.patterns.includes('evasion')) tickEvasion(st, dtSecs);
  tickLabelSwap(st, dtSecs);
  tickOverwrite(st, dtSecs);
  tickToggles(st, dtSecs);
  tickModalStack(st, dtSecs);
  tickDelay(st, dtSecs);
  tickVendors(st, dtSecs);
  tickMagnet(st, dtSecs);
  tickHazards(st, dtSecs);
  tickBoss(st, dtSecs);
  ensureFairButton(st);
}

export function applyAction(st, action) {
  if (st.dead || st.paused || st.phase !== 'running') return;
  if (action.type === 'button') {
    const b = st.buttons.find(btn => btn.id === action.id && btn.alive);
    if (!b) return;
    const x = b.x + b.w / 2;
    const y = b.y + b.h / 2;
    if (b.kind === 'decline') {
      rewardRejection(st, x, y);
      b.x = 24 + st.rng() * (GAME_WIDTH - b.w - 48);
      b.y = 190 + st.rng() * 290;
      b.baseLabel = randomFrom(st.stage.declineLabels, st.rng);
      b.label = b.baseLabel;
    } else {
      punish(st, b.kind === 'bossAccept' ? 45 : 22, b.kind === 'bossAccept' ? 40 : 18, 'That was legally binding. The button is thrilled.');
      addParticles(st, x, y, '#FF3B4F', 16);
    }
  }

  if (action.type === 'modalClose') {
    const m = st.modals.find(modal => modal.id === action.id && modal.alive);
    if (!m) return;
    m.alive = false;
    rewardRejection(st, m.x + m.w - 16, m.y + 14, 'WINDOW CLOSED');
    if (m.hydra) {
      spawnModal(st, { tier: 'small', force: true, x: clamp(m.x - 20, 8, GAME_WIDTH - 188), y: clamp(m.y + 22, 90, GAME_HEIGHT - 190) });
      spawnModal(st, { tier: 'small', force: true, x: clamp(m.x + 86, 8, GAME_WIDTH - 188), y: clamp(m.y + 54, 90, GAME_HEIGHT - 190) });
      st.notice = 'Hydra popup split. Legally normal.';
    }
  }

  if (action.type === 'toggle') {
    const t = st.toggles.find(toggle => toggle.id === action.id);
    if (!t || !t.on) return;
    t.on = false;
    t.rebound = 1.8 + st.rng() * 2.2;
    rewardRejection(st, t.x + t.w - 22, t.y + t.h / 2, 'VENDOR OFF');
  }

  if (st.stage.boss && st.bossHits < BOSS_REQUIRED_HITS) {
    st.bossHits = Math.min(BOSS_REQUIRED_HITS, st.rejections);
  }
  if (st.rejections >= st.required) completeStage(st);
}

export function maybeFail(st) {
  if (st.dead) return;
  if (st.patience <= 0) failRun(st, 'Patience depleted. The preference center wins by attrition.');
  else if (st.consent >= 100) failRun(st, 'Consent reached 100%. Your preferences have been optimized away.');
  else if (st.timeLeft <= 0 && st.mode !== 'endless') failRun(st, 'The countdown expired and renewed your choices for you.');
}
