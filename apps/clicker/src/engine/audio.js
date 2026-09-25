// Audio event router — game logic dispatches semantic events; this layer
// decides what sound plays and manages the Web Audio graph.
//
// SILENT SCAFFOLDING for now. The commissioned SFX + music beds land in
// arcs/<arcId>/audio/ later. Until then, this is a no-op that logs in dev
// so you can see what event points are firing without any browser sound.
//
// Event vocabulary (keep this stable — arcs and mechanics dispatch these):
//   click               user clicked the core object
//   click-crit          click with steam buff / overdrive multiplier
//   buy-generator       any generator purchased (opts.tier for weight)
//   buy-upgrade         any upgrade purchased
//   airdrop-spawn       golden-cookie appeared on screen
//   airdrop-catch       user caught the airdrop in time
//   airdrop-miss        airdrop faded without a catch
//   stage-transition    arc phase advanced (opts.from, opts.to)
//   crash-start         system-crash cutscene began
//   crash-reboot-click  each reboot click landed
//   crash-complete      reinit finished, gameplay resumes
//   apocalypse-warn     the countdown began
//   apocalypse-start    the actual cutscene began
//   apocalypse-drain    currency being zeroed out
//   apocalypse-end      cutscene ended, aftermath about to load
//   aftermath-enter     aftermath screen mounted
//   aftermath-reveal    prose line revealed

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export function createAudioRouter({ enabled = true, debug = DEV } = {}) {
  // Lazy AudioContext — Web Audio requires a user gesture on iOS.
  // When we bring in real SFX, unlock on first play() call.
  let ctx = null;
  let unlocked = false;

  function unlock() {
    if (unlocked || !enabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ctx = new Ctx();
      unlocked = true;
    } catch { /* ignore */ }
  }

  function play(event, opts = {}) {
    if (!enabled) return;
    unlock();
    if (debug) {
      console.debug(`[audio] ${event}`, opts);
    }
    // No actual playback yet — TODO: wire commissioned SFX per event.
  }

  return {
    play,
    unlock,
    get context() { return ctx; },
    get isUnlocked() { return unlocked; },
  };
}
