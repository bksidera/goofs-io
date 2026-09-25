export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function randomFrom(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

export function rectHit(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
