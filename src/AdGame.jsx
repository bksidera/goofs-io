import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// AdGame.exe — CryptoPunk Pixel Art Edition
// ============================================================

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const LANE_COUNT = 3;
const LANE_WIDTH = 90;
const LANE_OFFSET = (GAME_WIDTH - LANE_COUNT * LANE_WIDTH) / 2;
const PLAYER_Y = 540;
const GATE_HEIGHT = 44;
const SCROLL_SPEED_BASE = 2.2;
const SPAWN_INTERVAL_BASE = 1100;
const PX = 3;

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const laneX = (lane) => LANE_OFFSET + lane * LANE_WIDTH + LANE_WIDTH / 2;

// ============================================================
// PIXEL ART RENDERER
// ============================================================
function px(ctx, x, y, color, size = PX) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

function drawPlayer(ctx, cx, cy, frame = 0) {
  const s = PX;
  const ox = cx - 7 * s;
  const oy = cy - 12 * s;
  const hc = "#2D5A27", hd = "#1E3D1A", vc = "#00F0FF", fc = "#D2A77A";
  const bc = "#2D5A27", bc2 = "#4A8A42", lc = "#1E3D1A";

  // Helmet
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy, hd, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + s, hc, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + 2 * s, hc, s);

  // Visor
  ctx.shadowColor = vc; ctx.shadowBlur = 8;
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy + 3 * s, vc, s);
  for (let i = 3; i <= 10; i++) px(ctx, ox + i * s, oy + 4 * s, i % 3 === 0 ? "#fff" : vc, s);
  ctx.shadowBlur = 0;

  // Face
  for (let i = 3; i <= 10; i++) px(ctx, ox + i * s, oy + 5 * s, fc, s);
  for (let i = 4; i <= 9; i++) px(ctx, ox + i * s, oy + 6 * s, fc, s);

  // Body
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy + 7 * s, bc, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + 8 * s, bc, s);
  for (let i = 1; i <= 12; i++) px(ctx, ox + i * s, oy + 9 * s, i >= 5 && i <= 8 ? bc2 : bc, s);
  for (let i = 2; i <= 11; i++) px(ctx, ox + i * s, oy + 10 * s, i >= 5 && i <= 8 ? bc2 : bc, s);

  // Belt
  for (let i = 3; i <= 10; i++) px(ctx, ox + i * s, oy + 11 * s, "#333", s);
  px(ctx, ox + 6 * s, oy + 11 * s, "#FFD700", s);
  px(ctx, ox + 7 * s, oy + 11 * s, "#FFD700", s);

  // Legs
  const bob = Math.sin(frame * 0.15) > 0 ? s : 0;
  for (let i = 3; i <= 5; i++) px(ctx, ox + i * s, oy + 12 * s + bob, lc, s);
  for (let i = 8; i <= 10; i++) px(ctx, ox + i * s, oy + 12 * s - bob, lc, s);
  for (let i = 3; i <= 5; i++) px(ctx, ox + i * s, oy + 13 * s + bob, "#222", s);
  for (let i = 8; i <= 10; i++) px(ctx, ox + i * s, oy + 13 * s - bob, "#222", s);

  // Gun arm
  const gunBob = Math.sin(frame * 0.1) * s * 0.5;
  px(ctx, ox + 12 * s, oy + 7 * s + gunBob, fc, s);
  px(ctx, ox + 13 * s, oy + 7 * s + gunBob, fc, s);
  ctx.shadowColor = "#FF2D95"; ctx.shadowBlur = 4;
  px(ctx, ox + 13 * s, oy + 5 * s + gunBob, "#555", s);
  px(ctx, ox + 13 * s, oy + 6 * s + gunBob, "#555", s);
  px(ctx, ox + 14 * s, oy + 5 * s + gunBob, "#777", s);
  px(ctx, ox + 14 * s, oy + 4 * s + gunBob, "#FF2D95", s);
  ctx.shadowBlur = 0;

  // Antenna
  px(ctx, ox + 10 * s, oy - s, "#555", s);
  px(ctx, ox + 10 * s, oy - 2 * s, "#555", s);
  ctx.shadowColor = "#FF2D95"; ctx.shadowBlur = 6;
  px(ctx, ox + 10 * s, oy - 3 * s, "#FF2D95", s);
  ctx.shadowBlur = 0;
}

function drawEnemy(ctx, cx, cy, variant = 0, frame = 0) {
  const s = PX;
  const ox = cx - 6 * s;
  const oy = cy - 6 * s;
  const palettes = [
    { main: "#FF0040", dark: "#AA0030", eye: "#fff" },
    { main: "#CC0033", dark: "#880022", eye: "#FFD700" },
    { main: "#FF1050", dark: "#BB0040", eye: "#00F0FF" },
  ];
  const c = palettes[variant % 3];
  const bob = Math.sin(frame * 0.2 + variant) * s * 0.5;

  for (let i = 2; i <= 9; i++) px(ctx, ox + i * s, oy + bob, c.dark, s);
  for (let i = 1; i <= 10; i++) px(ctx, ox + i * s, oy + s + bob, c.main, s);
  for (let i = 1; i <= 10; i++) px(ctx, ox + i * s, oy + 2 * s + bob, c.main, s);
  for (let i = 1; i <= 10; i++) px(ctx, ox + i * s, oy + 3 * s + bob, c.main, s);
  for (let i = 2; i <= 9; i++) px(ctx, ox + i * s, oy + 4 * s + bob, c.main, s);
  for (let i = 3; i <= 8; i++) px(ctx, ox + i * s, oy + 5 * s + bob, c.dark, s);

  // Mohawk
  px(ctx, ox + 4 * s, oy - s + bob, c.eye, s);
  px(ctx, ox + 5 * s, oy - s + bob, c.eye, s);
  px(ctx, ox + 6 * s, oy - s + bob, c.eye, s);
  px(ctx, ox + 5 * s, oy - 2 * s + bob, c.eye, s);

  // Eyes
  ctx.shadowColor = c.eye; ctx.shadowBlur = 4;
  px(ctx, ox + 3 * s, oy + 2 * s + bob, c.eye, s);
  px(ctx, ox + 4 * s, oy + 2 * s + bob, "#000", s);
  px(ctx, ox + 7 * s, oy + 2 * s + bob, c.eye, s);
  px(ctx, ox + 8 * s, oy + 2 * s + bob, "#000", s);
  ctx.shadowBlur = 0;

  // Brows
  px(ctx, ox + 2 * s, oy + s + bob, "#000", s);
  px(ctx, ox + 3 * s, oy + s + bob, "#000", s);
  px(ctx, ox + 7 * s, oy + s + bob, "#000", s);
  px(ctx, ox + 9 * s, oy + s + bob, "#000", s);

  // Mouth
  for (let i = 4; i <= 7; i++) px(ctx, ox + i * s, oy + 4 * s + bob, "#000", s);
}

function drawGate(ctx, cx, cy, text, type, revealed, frame) {
  const w = LANE_WIDTH - 12, h = GATE_HEIGHT;
  const x = cx - w / 2, y = cy;
  const pulse = 0.6 + Math.sin(frame * 0.08) * 0.3;
  let color;

  if (type === "add") color = "#39FF14";
  else if (type === "enemy") color = "#FF0040";
  else if (type === "trap" && revealed) color = "#FF0040";
  else color = "#FFD700";

  const glitchX = (type === "trap" && revealed) ? (Math.random() - 0.5) * 4 : 0;
  const eGlitch = type === "enemy" && Math.random() < 0.04 ? (Math.random() - 0.5) * 3 : 0;

  ctx.save();
  ctx.translate(glitchX + eGlitch, 0);

  // Fill
  ctx.fillStyle = color + "18";
  ctx.fillRect(x, y, w, h);

  // Border
  ctx.shadowColor = color;
  ctx.shadowBlur = 10 * pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  if (type === "multiply" || (type === "trap" && !revealed)) {
    ctx.strokeStyle = color + "44";
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  }
  ctx.shadowBlur = 0;

  // Corner pixels
  const s = PX;
  px(ctx, x + 1, y + 1, color + "66", s);
  px(ctx, x + w - s - 1, y + 1, color + "66", s);
  px(ctx, x + 1, y + h - s - 1, color + "66", s);
  px(ctx, x + w - s - 1, y + h - s - 1, color + "66", s);

  // Text
  const displayText = (type === "trap" && revealed) ? `÷${text.slice(1)}` : text;
  ctx.font = `bold 18px 'Courier New', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(displayText, cx, cy + h / 2);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ============================================================
// COPY BANKS
// ============================================================
const DEATH_LINES = [
  "DOWNLOAD THE REAL GAME — oh wait, this IS the real game",
  "Game Over. Unlike other mobile games, we actually mean it.",
  "You died. No loot boxes can save you here.",
  "RETRY? It's free. We know that's suspicious.",
  "Your final score has been reported to the authorities.",
  "GAME OVER. No microtransactions to continue.",
  "In other games, that run would cost $4.99.",
  "Error: player.skill not found",
  "YOU DIED. No $2.99 revive. Just shame.",
  "Your power went to zero. Just like our marketing budget.",
  "Have you tried being better at fake games?",
];

const MULTIPLY_LINES = [
  "JUST LIKE THE AD PROMISED", "Is this even legal?",
  "THE AD WASN'T LYING (for once)", "Dopamine deployed ✓", "SATISFACTION GUARANTEED*",
];

const TRAP_LINES = [
  "lol you trusted a mobile ad", "THE AD LIED. SHOCKING.",
  "Bamboozled. Hoodwinked.", "Trust issues: activated",
  "That's what you get for optimism",
];

const TUTORIAL_LINES = [
  "← TAP LEFT / RIGHT →",
  "Green = good. Red = bad. Gold = ???",
  "Yes, this actually works.",
  "This is real gameplay. Not a redirect.",
];

const WAVE_LINES = [
  "Wave {n}. Still not a scam.", "Wave {n}. No paywall detected.",
  "Wave {n}. The ad continues.", "Wave {n} of ∞.",
  "Wave {n}. Still free. Still confused.", "Wave {n}. Sponsored by nobody.",
];

const POPUP_MESSAGES = [
  { title: "⚠️ VIRUS DETECTED", body: "Your device has 47 viruses.\nAlso you're about to hit a wall.", btn: "OK" },
  { title: "🎉 CONGRATULATIONS!", body: "You are the 1,000,000th player!\nClick to claim your prize!", btn: "CLAIM" },
  { title: "💾 SYSTEM ALERT", body: "DOWNLOADING MORE RAM...\n████████░░ 78%", btn: "Cancel" },
  { title: "🔥 HOT SINGLES", body: "HOT SINGLES IN YOUR LANE\nClick to meet them!", btn: "Meet Now" },
  { title: "⚠️ WARNING", body: "Fun.exe has stopped responding.", btn: "Close" },
  { title: "🛡️ ANTIVIRUS", body: "YOUR ANTIVIRUS HAS A VIRUS.", btn: "Help" },
  { title: "📧 NEW EMAIL", body: "FWD: FWD: FWD: FREE POWER\n(definitely not a scam)", btn: "Open" },
  { title: "💀 MAINFRAME", body: "MAINFRAME BREACHED.\nHackers are stealing your score.", btn: "Panic" },
  { title: "🔧 SYSTEM32", body: "SYSTEM32 DELETED.\nJust kidding. Or are we?", btn: "😰" },
  { title: "📞 MISSED CALL", body: "Your mom called.\nShe reached Wave 12.", btn: "Hang Up" },
  { title: "🤖 CLIPPY", body: "It looks like you're trying\nto survive. Would you like\nhelp with that?", btn: "No" },
  { title: "💜 BONZI BUDDY", body: "Hello! I'm Bonzi!\nLet me help you by\nblocking your screen!", btn: "Please No" },
];

const LOADING_MSGS = [
  "THIS IS AN AD.", "But like... a real one.", "Installing trust issues...",
  "Buffering dopamine...", "Deploying pixel punks...", "PLAY NOW →",
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AdGameExe() {
  const [screen, setScreen] = useState("loading");
  const [loadingStep, setLoadingStep] = useState(0);
  const [deathData, setDeathData] = useState({ score: 0, wave: 1, peak: 100 });

  useEffect(() => {
    if (screen !== "loading") return;
    const t = setInterval(() => {
      setLoadingStep((s) => {
        if (s >= LOADING_MSGS.length - 1) { clearInterval(t); setTimeout(() => setScreen("title"), 500); return s; }
        return s + 1;
      });
    }, 450);
    return () => clearInterval(t);
  }, [screen]);

  const handleDeath = useCallback((score, wave, peak) => {
    setDeathData({ score, wave, peak });
    setScreen("death");
  }, []);

  if (screen === "loading") return <LoadingScreen step={loadingStep} />;
  if (screen === "title") return <TitleScreen onStart={() => setScreen("game")} />;
  if (screen === "death") return <DeathScreen data={deathData} onRetry={() => setScreen("game")} />;
  return <GameScreen onDeath={handleDeath} />;
}

// ============================================================
// SCREENS
// ============================================================
const FONT = "'Courier New', monospace";

function LoadingScreen({ step }) {
  return (
    <div style={S.wrap}>
      <div style={S.scanlines} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, padding: 40 }}>
        <div style={{ fontSize: 11, color: "#00F0FF", fontFamily: FONT, letterSpacing: 3, opacity: 0.5 }}>INITIALIZING AdGame.exe</div>
        <div style={{ width: "65%", height: 6, background: "#1a1a3e", border: "1px solid #333", overflow: "hidden" }}>
          <div style={{ width: `${((step + 1) / LOADING_MSGS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #FF2D95, #00F0FF)", transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 15, color: "#FF2D95", fontFamily: FONT, textAlign: "center", textShadow: "0 0 10px #FF2D9555" }}>{LOADING_MSGS[step]}</div>
        <div style={{ fontSize: 9, color: "#2a2a2a", fontFamily: FONT, marginTop: 20 }}>v0.1.0 — not_a_virus.exe</div>
      </div>
    </div>
  );
}

function TitleScreen({ onStart }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    let raf;
    const draw = () => {
      frameRef.current++;
      ctx.clearRect(0, 0, 120, 80);
      drawPlayer(ctx, 60, 50, frameRef.current);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.scanlines} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 4, padding: 30, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#00F0FF", fontFamily: FONT, letterSpacing: 4, opacity: 0.4 }}>⚠️ THIS IS AN AD ⚠️</div>
        <canvas ref={canvasRef} width={120} height={80} style={{ imageRendering: "pixelated", width: 120, height: 80, margin: "8px 0" }} />
        <div style={{ fontSize: 42, fontWeight: 900, color: "#fff", fontFamily: FONT, textShadow: "0 0 20px #FF2D95, 0 0 40px #FF2D95, 3px 3px 0 #FF2D9555", lineHeight: 1, letterSpacing: -1 }}>
          AdGame<span style={{ color: "#00F0FF", textShadow: "0 0 20px #00F0FF, 0 0 40px #00F0FF, 3px 3px 0 #00F0FF44" }}>.exe</span>
        </div>
        <div style={{ fontSize: 11, color: "#FFD700", fontFamily: FONT, opacity: 0.7, fontStyle: "italic", marginTop: 2 }}>The game from the ad that doesn't exist.</div>
        <div style={{ fontSize: 10, color: "#00F0FF", fontFamily: FONT, opacity: 0.5 }}>Except now it does.</div>
        <button onClick={onStart} style={S.btn}>INSTALL NOW</button>
        <div style={{ fontSize: 9, color: "#444", fontFamily: FONT }}>(you already did)</div>
        <div style={{ position: "absolute", bottom: 14, fontSize: 9, color: "#222", fontFamily: FONT }}>Level 1 of 9,473 · No IAP · No Ads</div>
      </div>
    </div>
  );
}

function DeathScreen({ data, onRetry }) {
  const line = randomFrom(DEATH_LINES);
  return (
    <div style={S.wrap}>
      <div style={S.scanlines} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, padding: 30, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#FF0040", fontFamily: FONT, letterSpacing: 3 }}>⚠️ FATAL ERROR ⚠️</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#FF0040", fontFamily: FONT, textShadow: "0 0 20px #FF004055, 3px 3px 0 #FF004033" }}>GAME OVER</div>
        <div style={{ fontSize: 12, color: "#FF2D95", fontFamily: FONT, maxWidth: 270, lineHeight: 1.5 }}>{line}</div>
        <div style={{ marginTop: 14, display: "flex", gap: 22, fontSize: 11, fontFamily: FONT }}>
          {[["WAVE", data.wave, "#00F0FF"], ["PEAK", data.peak, "#FFD700"], ["SCORE", data.score, "#FF2D95"]].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ color: "#555", fontSize: 9 }}>{l}</div>
              <div style={{ color: c, fontSize: 20, fontWeight: 900, textShadow: `0 0 8px ${c}44` }}>{typeof v === "number" ? v.toLocaleString() : v}</div>
            </div>
          ))}
        </div>
        <button onClick={onRetry} style={{ ...S.btn, borderColor: "#39FF14", color: "#39FF14", marginTop: 20 }}>RETRY (FREE)</button>
        <div style={{ fontSize: 9, color: "#333", fontFamily: FONT }}>No in-app purchases were harmed in the making of this score</div>
      </div>
    </div>
  );
}

// ============================================================
// GAME SCREEN
// ============================================================
function GameScreen({ onDeath }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const touchRef = useRef(null);
  const [popups, setPopups] = useState([]);

  const init = useCallback(() => ({
    player: { lane: 1, power: 100, peakPower: 100, targetPower: 100, displayPower: 100 },
    gates: [], particles: [], floats: [], pops: [],
    wave: 1, waveGates: 0, gatesPerWave: 8,
    scrollSpeed: SCROLL_SPEED_BASE, spawnTimer: 0, spawnInterval: SPAWN_INTERVAL_BASE,
    frame: 0, lastTime: performance.now(), gameOver: false,
    shakeX: 0, shakeY: 0, shakeTimer: 0,
    flashAlpha: 0, flashColor: "#fff",
    combo: 0, comboTimer: 0,
    tutIdx: 0, tutTimer: 0, showTut: true,
    waveMsg: "", waveMsgTimer: 0, popCooldown: 0,
    scanOff: 0, glitchTimer: 0, glitchOn: false,
    trail: [],
    stars: Array.from({ length: 25 }, () => ({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, sp: 0.3 + Math.random() * 0.7, br: 0.1 + Math.random() * 0.25 })),
  }), []);

  const spawn = useCallback((st) => {
    const lane = Math.floor(Math.random() * 3);
    if (st.gates.some(g => g.lane === lane && g.y < 70)) return;
    const w = st.wave, roll = Math.random();
    const tC = w >= 5 ? Math.min(0.08 + (w - 5) * 0.015, 0.18) : 0;
    const mC = Math.min(0.15 + w * 0.008, 0.22);
    const eC = Math.min(0.3 + w * 0.025, 0.5);
    let type, value, display;
    if (roll < tC) { type = "trap"; value = [2, 3, 5][Math.floor(Math.random() * 3)]; display = `×${value}`; }
    else if (roll < tC + mC) { type = "multiply"; const m = w < 4 ? [2] : [2, 2, 3, 3, 5]; value = m[Math.floor(Math.random() * m.length)]; display = `×${value}`; }
    else if (roll < tC + mC + eC) { type = "enemy"; const b = 8 + w * 4; value = Math.floor(b + Math.random() * b * 0.4); display = `-${value}`; }
    else { type = "add"; const b = 8 + w * 3; value = Math.floor(b + Math.random() * b * 0.5); display = `+${value}`; }
    st.gates.push({ lane, type, value, display, y: -GATE_HEIGHT, revealed: false, alive: true, variant: Math.floor(Math.random() * 3) });
  }, []);

  const spawnPop = useCallback((st) => {
    if (st.wave < 4 || st.pops.length >= 2 || st.popCooldown > 0 || Math.random() > 0.35) return;
    const msg = randomFrom(POPUP_MESSAGES);
    const id = Date.now() + Math.random();
    st.pops.push({ id, ...msg, x: 15 + Math.random() * (GAME_WIDTH - 240), y: 70 + Math.random() * 200, dodges: 0, maxDodges: st.wave >= 6 ? Math.min(st.wave - 4, 4) : 0, alive: true });
    st.popCooldown = 4000 + Math.random() * 3000;
    setPopups([...st.pops.filter(p => p.alive)]);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    stateRef.current = init();

    const loop = (time) => {
      const st = stateRef.current;
      if (!st || st.gameOver) return;
      const dt = Math.min(time - st.lastTime, 50);
      st.lastTime = time; st.frame++;

      st.scrollSpeed = SCROLL_SPEED_BASE + (st.wave - 1) * 0.35;
      st.spawnInterval = Math.max(500, SPAWN_INTERVAL_BASE - st.wave * 65);
      st.spawnTimer += dt;
      if (st.spawnTimer >= st.spawnInterval) { st.spawnTimer = 0; spawn(st); st.waveGates++; }
      if (st.waveGates >= st.gatesPerWave) {
        st.wave++; st.waveGates = 0; st.gatesPerWave = Math.min(8 + st.wave, 20);
        st.waveMsg = randomFrom(WAVE_LINES).replace("{n}", st.wave); st.waveMsgTimer = 2200;
        spawnPop(st);
      }

      if (st.showTut) { st.tutTimer += dt; if (st.tutTimer > 2200) { st.tutTimer = 0; st.tutIdx++; if (st.tutIdx >= TUTORIAL_LINES.length) st.showTut = false; } }
      if (st.waveMsgTimer > 0) st.waveMsgTimer -= dt;
      if (st.popCooldown > 0) st.popCooldown -= dt;
      if (st.shakeTimer > 0) { st.shakeTimer -= dt; const i = st.shakeTimer / 300; st.shakeX = (Math.random() - 0.5) * 10 * i; st.shakeY = (Math.random() - 0.5) * 10 * i; } else { st.shakeX = 0; st.shakeY = 0; }
      if (st.flashAlpha > 0) st.flashAlpha -= dt * 0.004;
      if (st.comboTimer > 0) { st.comboTimer -= dt; if (st.comboTimer <= 0) st.combo = 0; }
      st.scanOff = (st.scanOff + dt * 0.03) % 3;
      st.glitchTimer -= dt;
      if (st.glitchTimer <= 0) { st.glitchOn = Math.random() < 0.02; st.glitchTimer = st.glitchOn ? 40 + Math.random() * 80 : 800 + Math.random() * 2500; }

      const diff = st.player.targetPower - st.player.displayPower;
      st.player.displayPower += diff * 0.1;
      if (Math.abs(diff) < 0.5) st.player.displayPower = st.player.targetPower;

      st.trail.push({ x: laneX(st.player.lane), y: PLAYER_Y, life: 1 });
      if (st.trail.length > 6) st.trail.shift();
      for (const t of st.trail) t.life -= 0.15;

      // Gates
      for (const g of st.gates) {
        if (!g.alive) continue;
        g.y += st.scrollSpeed * (dt / 16);
        if (g.y + GATE_HEIGHT > PLAYER_Y - 20 && g.y < PLAYER_Y + 10 && g.lane === st.player.lane) {
          g.alive = false;
          const gx = laneX(g.lane), gy = PLAYER_Y - 20;
          if (g.type === "add") {
            st.player.targetPower += g.value; st.player.power = st.player.targetPower;
            for (let i = 0; i < 8; i++) st.particles.push({ x: gx, y: gy, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7 - 2, life: 1, color: "#39FF14", size: PX + Math.random() * PX });
            st.floats.push({ text: `+${g.value}`, x: gx, y: gy, vy: -1.5, life: 1, color: "#39FF14" });
            st.combo = 0;
          } else if (g.type === "multiply") {
            st.player.targetPower *= g.value; st.player.power = st.player.targetPower;
            for (let i = 0; i < 18; i++) st.particles.push({ x: gx, y: gy, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9 - 3, life: 1, color: "#FFD700", size: PX + Math.random() * PX * 1.5 });
            st.floats.push({ text: `×${g.value}!`, x: gx, y: gy, vy: -2, life: 1.2, color: "#FFD700", big: true });
            st.flashAlpha = 0.45; st.flashColor = "#FFD70030";
            st.combo++; st.comboTimer = 3000;
            if (st.combo >= 2) st.floats.push({ text: randomFrom(MULTIPLY_LINES), x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 - 60, vy: -1, life: 1.5, color: "#FFD700", big: true });
          } else if (g.type === "enemy") {
            st.player.targetPower -= g.value; st.player.power = st.player.targetPower;
            for (let i = 0; i < 12; i++) st.particles.push({ x: gx, y: gy, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2, life: 1, color: "#FF0040", size: PX + Math.random() * PX });
            st.floats.push({ text: `-${g.value}`, x: gx, y: gy, vy: -1.5, life: 1, color: "#FF0040" });
            st.shakeTimer = 250; st.flashAlpha = 0.3; st.flashColor = "#FF004040"; st.combo = 0;
          } else if (g.type === "trap") {
            g.revealed = true;
            const actual = Math.max(1, Math.floor(st.player.targetPower / g.value));
            st.player.targetPower = actual; st.player.power = st.player.targetPower;
            for (let i = 0; i < 25; i++) st.particles.push({ x: gx, y: gy, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 - 3, life: 1, color: i % 2 ? "#FF0040" : "#FF2D95", size: PX + Math.random() * PX });
            st.floats.push({ text: `÷${g.value}!`, x: gx, y: gy, vy: -2, life: 1.2, color: "#FF0040", big: true });
            st.floats.push({ text: randomFrom(TRAP_LINES), x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, vy: -1, life: 1.5, color: "#FF2D95", big: true });
            st.shakeTimer = 400; st.flashAlpha = 0.4; st.flashColor = "#FF004055"; st.glitchOn = true; st.glitchTimer = 500; st.combo = 0;
          }
          if (st.player.targetPower > st.player.peakPower) st.player.peakPower = st.player.targetPower;
          if (st.player.targetPower <= 0) { st.player.targetPower = 0; st.gameOver = true; onDeath(Math.floor(st.player.peakPower * st.wave), st.wave, Math.floor(st.player.peakPower)); return; }
        }
        if (g.y > GAME_HEIGHT + 50) g.alive = false;
      }
      st.gates = st.gates.filter(g => g.alive);

      for (const p of st.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.028; }
      st.particles = st.particles.filter(p => p.life > 0);
      for (const f of st.floats) { f.y += f.vy; f.life -= 0.016; }
      st.floats = st.floats.filter(f => f.life > 0);
      for (const s2 of st.stars) { s2.y += s2.sp * st.scrollSpeed * (dt / 16); if (s2.y > GAME_HEIGHT) { s2.y = -2; s2.x = Math.random() * GAME_WIDTH; } }

      // === RENDER ===
      ctx.save();
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.translate(st.shakeX, st.shakeY);

      // BG
      const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      bg.addColorStop(0, "#080816"); bg.addColorStop(0.5, "#0F0F23"); bg.addColorStop(1, "#161630");
      ctx.fillStyle = bg; ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);

      // Stars
      for (const s2 of st.stars) { ctx.fillStyle = `rgba(255,255,255,${s2.br})`; ctx.fillRect(s2.x, s2.y, PX - 1, PX - 1); }

      // Grid
      ctx.strokeStyle = "#ffffff05"; ctx.lineWidth = 1;
      for (let i = 0; i <= LANE_COUNT; i++) { const x = LANE_OFFSET + i * LANE_WIDTH; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GAME_HEIGHT); ctx.stroke(); }
      const go = (st.frame * st.scrollSpeed * 0.3) % 50;
      ctx.strokeStyle = "#ffffff03";
      for (let y = -50 + go; y < GAME_HEIGHT; y += 50) { ctx.beginPath(); ctx.moveTo(LANE_OFFSET, y); ctx.lineTo(LANE_OFFSET + LANE_COUNT * LANE_WIDTH, y); ctx.stroke(); }

      // Lane highlight
      ctx.fillStyle = "#FF2D9506"; ctx.fillRect(LANE_OFFSET + st.player.lane * LANE_WIDTH, 0, LANE_WIDTH, GAME_HEIGHT);

      // Gates + enemies
      for (const g of st.gates) {
        if (!g.alive) continue;
        drawGate(ctx, laneX(g.lane), g.y, g.display, g.type, g.revealed, st.frame);
        if (g.type === "enemy") drawEnemy(ctx, laneX(g.lane), g.y + GATE_HEIGHT + 16, g.variant, st.frame);
      }

      // Trail
      for (const t of st.trail) { if (t.life <= 0) continue; ctx.globalAlpha = t.life * 0.12; ctx.fillStyle = "#FF2D95"; ctx.fillRect(t.x - 4, t.y - 4, 8, 8); }
      ctx.globalAlpha = 1;

      // Player
      drawPlayer(ctx, laneX(st.player.lane), PLAYER_Y, st.frame);

      // Muzzle flash (random)
      if (st.frame % 12 < 3) {
        const mx = laneX(st.player.lane) + 14 * PX - 7 * PX;
        const my = PLAYER_Y - 12 * PX + PX * 3;
        ctx.shadowColor = "#FF2D95"; ctx.shadowBlur = 12;
        ctx.fillStyle = "#FF2D95"; ctx.fillRect(mx + 14 * PX, my, PX * 2, PX);
        ctx.fillStyle = "#fff"; ctx.fillRect(mx + 14 * PX, my + PX, PX, PX);
        ctx.shadowBlur = 0;
      }

      // Particles
      for (const p of st.particles) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size); }
      ctx.globalAlpha = 1;

      // Floats
      for (const f of st.floats) {
        ctx.globalAlpha = Math.min(1, f.life * 1.4);
        ctx.fillStyle = f.color;
        ctx.font = f.big ? `bold 13px ${FONT}` : `bold 16px ${FONT}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = f.color; ctx.shadowBlur = 8;
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Flash
      if (st.flashAlpha > 0) { ctx.globalAlpha = st.flashAlpha; ctx.fillStyle = st.flashColor; ctx.fillRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20); ctx.globalAlpha = 1; }

      // Scanlines
      ctx.fillStyle = "#00000012";
      for (let y = st.scanOff; y < GAME_HEIGHT; y += 3) ctx.fillRect(0, y, GAME_WIDTH, 1);

      // Glitch
      if (st.glitchOn) {
        try {
          const sh = 8 + Math.random() * 20;
          const sy = Math.floor(Math.random() * (GAME_HEIGHT - sh));
          const id = ctx.getImageData(0, sy, GAME_WIDTH, sh);
          ctx.putImageData(id, (Math.random() - 0.5) * 14, sy);
          // Color channel shift
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = "#FF2D95";
          ctx.fillRect(0, sy, GAME_WIDTH, sh / 2);
          ctx.fillStyle = "#00F0FF";
          ctx.fillRect(0, sy + sh / 2, GAME_WIDTH, sh / 2);
          ctx.globalAlpha = 1;
        } catch (e) { /* */ }
      }

      ctx.restore();

      // === HUD ===
      const dp = Math.round(st.player.displayPower);
      const pc = dp > 1000 ? "#FFD700" : dp > 200 ? "#00F0FF" : dp < 30 ? "#FF0040" : "#fff";
      const fs = dp > 99999 ? 22 : dp > 9999 ? 26 : dp > 999 ? 30 : 36;
      ctx.font = `bold ${fs}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = pc; ctx.shadowBlur = 15; ctx.fillStyle = pc;
      ctx.fillText(dp.toLocaleString(), GAME_WIDTH / 2, 38); ctx.shadowBlur = 0;
      ctx.font = `9px ${FONT}`; ctx.fillStyle = "#555"; ctx.fillText("POWER", GAME_WIDTH / 2, 56);
      ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = "#FF2D95"; ctx.textAlign = "left";
      ctx.fillText(`WAVE ${st.wave}`, 10, 16);
      if (st.combo >= 2) { ctx.font = `bold 12px ${FONT}`; ctx.fillStyle = "#FFD700"; ctx.textAlign = "right"; ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 5; ctx.fillText(`×${st.combo} COMBO`, GAME_WIDTH - 10, 16); ctx.shadowBlur = 0; }
      if (st.showTut && st.tutIdx < TUTORIAL_LINES.length) { ctx.font = `12px ${FONT}`; ctx.fillStyle = "#00F0FF"; ctx.textAlign = "center"; ctx.globalAlpha = 0.7; ctx.fillText(TUTORIAL_LINES[st.tutIdx], GAME_WIDTH / 2, GAME_HEIGHT - 50); ctx.globalAlpha = 1; }
      if (st.waveMsgTimer > 0) { ctx.globalAlpha = clamp(st.waveMsgTimer / 600, 0, 1); ctx.font = `bold 14px ${FONT}`; ctx.fillStyle = "#FF2D95"; ctx.textAlign = "center"; ctx.shadowColor = "#FF2D95"; ctx.shadowBlur = 10; ctx.fillText(st.waveMsg, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100); ctx.shadowBlur = 0; ctx.globalAlpha = 1; }
      if (dp > 1000) { ctx.font = `8px ${FONT}`; ctx.fillStyle = "#1a1a1a"; ctx.textAlign = "right"; ctx.fillText("THE FTC WOULD LIKE A WORD", GAME_WIDTH - 8, GAME_HEIGHT - 8); }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [init, spawn, spawnPop, onDeath]);

  const handleInput = useCallback((cx, rect) => {
    const st = stateRef.current;
    if (!st || st.gameOver) return;
    const x = cx - rect.left;
    const t = rect.width / 3;
    if (x < t) st.player.lane = Math.max(0, st.player.lane - 1);
    else if (x > t * 2) st.player.lane = Math.min(2, st.player.lane + 1);
  }, []);

  const onClick = useCallback((e) => handleInput(e.clientX, e.currentTarget.getBoundingClientRect()), [handleInput]);
  const onTS = useCallback((e) => { touchRef.current = e.touches[0].clientX; }, []);
  const onTE = useCallback((e) => {
    const st = stateRef.current;
    if (!st || !touchRef.current) return;
    const ex = e.changedTouches[0].clientX;
    const d = ex - touchRef.current;
    if (Math.abs(d) > 30) { if (d < 0) st.player.lane = Math.max(0, st.player.lane - 1); else st.player.lane = Math.min(2, st.player.lane + 1); }
    else handleInput(ex, e.currentTarget.getBoundingClientRect());
    touchRef.current = null;
  }, [handleInput]);

  const closePop = useCallback((id) => {
    const st = stateRef.current;
    if (!st) return;
    const p = st.pops.find(p2 => p2.id === id);
    if (!p) return;
    if (p.dodges < p.maxDodges && Math.random() > 0.35) {
      p.x = clamp(p.x + (Math.random() - 0.5) * 80, 10, GAME_WIDTH - 230);
      p.y = clamp(p.y + (Math.random() - 0.5) * 80, 60, GAME_HEIGHT - 200);
      p.dodges++;
    } else { p.alive = false; st.pops = st.pops.filter(p2 => p2.alive); }
    setPopups([...st.pops.filter(p2 => p2.alive)]);
  }, []);

  return (
    <div style={S.wrap}>
      <div style={{ position: "relative", width: GAME_WIDTH, height: GAME_HEIGHT, cursor: "pointer", touchAction: "none" }}
        onClick={onClick} onTouchStart={onTS} onTouchEnd={onTE}>
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} style={{ display: "block", width: GAME_WIDTH, height: GAME_HEIGHT, imageRendering: "pixelated" }} />
        {popups.map((p) => <Win98Popup key={p.id} popup={p} onClose={() => closePop(p.id)} />)}
      </div>
    </div>
  );
}

// ============================================================
// WIN98 POPUP
// ============================================================
function Win98Popup({ popup, onClose }) {
  return (
    <div onClick={(e) => e.stopPropagation()} style={{
      position: "absolute", left: popup.x, top: popup.y, width: 210,
      background: "#C0C0C0", border: "2px outset #dfdfdf",
      boxShadow: "2px 2px 0 #000, inset 1px 1px 0 #fff",
      fontFamily: FONT, fontSize: 11, zIndex: 100,
      transition: "left 0.1s ease-out, top 0.1s ease-out", userSelect: "none", imageRendering: "auto",
    }}>
      <div style={{ background: "linear-gradient(90deg, #000080, #1084d0)", color: "#fff", padding: "3px 4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", fontSize: 11 }}>
        <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 }}>{popup.title}</span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
          background: "#C0C0C0", border: "1px outset #fff", width: 16, height: 14, fontSize: 10,
          fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0, color: "#000", flexShrink: 0,
        }}>✕</button>
      </div>
      <div style={{ padding: "10px 10px 6px", color: "#000", whiteSpace: "pre-line", lineHeight: 1.4 }}>{popup.body}</div>
      <div style={{ padding: "4px 10px 8px", display: "flex", justifyContent: "center" }}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
          background: "#C0C0C0", border: "2px outset #fff", padding: "2px 18px",
          fontSize: 11, cursor: "pointer", fontFamily: FONT, color: "#000",
        }}>{popup.btn}</button>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const S = {
  wrap: {
    width: GAME_WIDTH, height: GAME_HEIGHT, margin: "0 auto",
    background: "#080816", position: "relative", overflow: "hidden", borderRadius: 4,
    boxShadow: "0 0 30px #FF2D9520, 0 0 60px #00F0FF10, inset 0 0 40px #00000088",
  },
  scanlines: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, #00000010 2px, #00000010 3px)",
    pointerEvents: "none", zIndex: 1,
  },
  btn: {
    marginTop: 28, padding: "13px 40px", fontSize: 17, fontWeight: 900,
    fontFamily: FONT, background: "transparent", color: "#FF2D95",
    border: "2px solid #FF2D95", cursor: "pointer", letterSpacing: 3,
    textTransform: "uppercase", boxShadow: "0 0 12px #FF2D9530, inset 0 0 12px #FF2D9510",
    transition: "all 0.15s ease", imageRendering: "auto",
  },
};
