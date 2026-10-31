// Procedural winding-road centreline for ADIBA CHASE.
// The path is defined by a smooth curvature profile k(s) (1/metres) along distance s.
//   heading  θ(s) = ∫ k ds      lateral offset c(s) = ∫ sin θ ds
// Curvature blocks use a sin² bump, so every curve eases in/out of a straight with
// continuous curvature (no sudden kinks). The game logic stays on straight lanes; the
// renderer bends the world with rel(sPlayer, a): the lateral offset of the road `a`
// metres ahead, relative to the player's own tangent.

export const BEND_N = 10;      // samples handed to the shader
export const BEND_STEP = 16;   // metres between samples (covers 0..144 m)
export const MAX_K = 0.0065;   // tightest allowed curvature (radius ≈ 154 m)

export class RoadPath {
  constructor(rand = Math.random) {
    this.rand = rand;
    this.ds = 2;
    this.reset();
  }
  reset() {
    this.s0 = 0;            // distance of the first stored sample
    this.th = [0];          // heading samples
    this.c = [0];           // lateral offset samples
    this.queue = [];        // pending curvature blocks {len,A}
    this.lastType = '';
    this.sign = this.rand() < 0.5 ? -1 : 1;
    this.stats = { blocks: 0, left: 0, right: 0, sharp: 0, types: {} };
    this._straight(150);    // always start on a straight so the first seconds are calm
  }
  get sEnd() { return this.s0 + (this.th.length - 1) * this.ds; }

  _straight(len) { this.queue.push({ len, A: 0 }); }
  _bump(len, A) { this.queue.push({ len, A }); }
  _pickSign() {
    const th = this.th[this.th.length - 1];
    if (Math.abs(th) > 0.55) return -Math.sign(th);   // steer back toward straight
    this.sign = this.rand() < 0.7 ? -this.sign : this.sign; // prefer alternating left/right
    return this.sign;
  }
  _r(a, b) { return a + this.rand() * (b - a); }
  _planNext() {
    let w = [['straight', .20], ['gentle', .27], ['long', .14], ['sbend', .15], ['serpentine', .14], ['sharp', .10]];
    if (this.lastType === 'sharp') w = w.filter(x => x[0] !== 'sharp' && x[0] !== 'serpentine');
    let tot = w.reduce((a, b) => a + b[1], 0), r = this.rand() * tot, type = w[0][0];
    for (const [t, p] of w) { if ((r -= p) <= 0) { type = t; break; } }
    const sg = this._pickSign();
    this.stats.types[type] = (this.stats.types[type] || 0) + 1;
    if (type === 'straight') this._straight(this._r(60, 160));
    else if (type === 'gentle') this._bump(this._r(120, 220), sg * this._r(.0018, .0034));
    else if (type === 'long') this._bump(this._r(260, 380), sg * this._r(.0014, .0026));
    else if (type === 'sbend') { const L = this._r(110, 150), A = this._r(.0024, .0036); this._bump(L, sg * A); this._bump(L, -sg * A); }
    else if (type === 'serpentine') { const n = 3 + Math.floor(this.rand() * 3), L = this._r(90, 120), A = this._r(.0028, .0038); for (let i = 0; i < n; i++) this._bump(L, sg * A * (i % 2 ? -1 : 1)); }
    else if (type === 'sharp') { this._bump(this._r(70, 100), sg * this._r(.0052, MAX_K)); this.stats.sharp++; }
    if (type !== 'straight') this._straight(this._r(25, 70)); // breathing room between curve groups
    this.lastType = type;
    this.stats.blocks++;
  }
  // make sure samples exist up to distance s
  ensure(s) {
    while (this.sEnd < s) {
      if (!this.queue.length) this._planNext();
      const b = this.queue.shift();
      const n = Math.max(1, Math.round(b.len / this.ds));
      if (b.A > 0) this.stats.right++; else if (b.A < 0) this.stats.left++;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, bump = Math.sin(Math.PI * u), k = b.A * bump * bump;
        const th = this.th[this.th.length - 1] + k * this.ds;
        this.th.push(th);
        this.c.push(this.c[this.c.length - 1] + Math.sin(th) * this.ds);
      }
    }
  }
  // drop samples far behind the player
  trim(sPlayer) {
    const drop = Math.floor((sPlayer - 60 - this.s0) / this.ds);
    if (drop > 300) { this.th.splice(0, drop); this.c.splice(0, drop); this.s0 += drop * this.ds; }
  }
  _lerp(arr, s) {
    let f = (s - this.s0) / this.ds;
    if (f < 0) f = 0;
    const i = Math.min(Math.floor(f), arr.length - 2), t = f - i;
    return arr[i] + (arr[i + 1] - arr[i]) * t;
  }
  theta(s) { this.ensure(s + 2); return this._lerp(this.th, s); }
  cAt(s) { this.ensure(s + 2); return this._lerp(this.c, s); }
  // lateral offset of the road `a` metres ahead, measured from the player's tangent
  rel(sPlayer, a) {
    this.ensure(sPlayer + a + 4);
    return this._lerp(this.c, sPlayer + a) - this._lerp(this.c, sPlayer) - this._lerp(this.th, sPlayer) * a;
  }
  // curvature near s (for tests / camera)
  kAt(s) { this.ensure(s + 4); const e = 2; return (this.theta(s + e) - this.theta(s - e)) / (2 * e); }
  // fill shader samples
  fill(sPlayer, out) {
    this.ensure(sPlayer + BEND_N * BEND_STEP + 8);
    for (let i = 0; i < BEND_N; i++) out[i] = this.rel(sPlayer, i * BEND_STEP);
    this.trim(sPlayer);
    return out;
  }
}

// JS reference of the shader's Catmull-Rom lookup (used by tests)
export function bendJS(u, z, playerZ = 4) {
  const a = Math.abs(playerZ - z);
  const f = Math.min(a / BEND_STEP, BEND_N - 1.001);
  const i = Math.floor(f), t = f - i;
  const p0 = u[Math.max(i - 1, 0)], p1 = u[i], p2 = u[i + 1], p3 = u[Math.min(i + 2, BEND_N - 1)];
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}
