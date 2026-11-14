// ===== ENGINE: physics, rules and computer player (no DOM) =====
const BW = 600, BH = 1000, R = 24, N = 11;
const LINE_TOP = 110, LINE_BOT = 890;   // Red's line at top, Orange's line at bottom
const MAXV = 1700, DECEL = 950, DT = 1 / 120, REST = 0.9;
const other = t => (t === 'O' ? 'R' : 'O');

function step(cs, fx) {
  for (const c of cs) {
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > 0) {
      const ns = sp - DECEL * DT;
      if (ns < 4) { c.vx = 0; c.vy = 0; }
      else { const f = ns / sp; c.vx *= f; c.vy *= f; }
      c.x += c.vx * DT; c.y += c.vy * DT;
    }
  }
  const D = 2 * R;
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i];
    for (let j = i + 1; j < cs.length; j++) {
      const b = cs[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= D * D) continue;
      const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d;
      const ov = (D - d) / 2;
      a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
      const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rv > 0) {
        const jj = (1 + REST) / 2 * rv;
        a.vx -= jj * nx; a.vy -= jj * ny; b.vx += jj * nx; b.vy += jj * ny;
        if (fx) fx('hit', rv);
      }
    }
  }
  let any = false;
  for (let i = cs.length - 1; i >= 0; i--) {
    const c = cs[i];
    // Players' legs sit behind each end: a cap completely past a line
    // can't fall off anywhere, it just bumps against the legs and stops.
    if (c.y > LINE_BOT + R || c.y < LINE_TOP - R) {
      const LEG = 0.3;
      if (c.x < R) { c.x = R; if (c.vx < 0) c.vx = -c.vx * LEG; }
      if (c.x > BW - R) { c.x = BW - R; if (c.vx > 0) c.vx = -c.vx * LEG; }
      if (c.y < R) { c.y = R; if (c.vy < 0) c.vy = -c.vy * LEG; }
      if (c.y > BH - R) { c.y = BH - R; if (c.vy > 0) c.vy = -c.vy * LEG; }
    }
    // Off the long sides: the cap is dead.
    if (c.x < 0 || c.x > BW) { cs.splice(i, 1); if (fx) fx('fall', c); continue; }
    // Off an end (rare, since the legs are there): back on the board at that end.
    if (c.y < 0 || c.y > BH) {
      const top = c.y < 0;
      c.vx = 0; c.vy = 0;
      respawnAtEnd(cs, c, top);
      if (fx) fx('respawn', c, top);
      continue;
    }
    if (c.vx !== 0 || c.vy !== 0) any = true;
  }
  return any;
}
function respawnAtEnd(cs, c, top) {
  const ys = top ? [R + 6, R * 3 + 8, LINE_TOP - R - 2] : [BH - R - 6, BH - R * 3 - 8, LINE_BOT + R + 2];
  const x0 = Math.max(R + 6, Math.min(BW - R - 6, c.x));
  for (const y of ys) {
    for (let k = 0; k < 40; k++) {
      const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (R * 0.6);
      const x = x0 + off;
      if (x < R + 6 || x > BW - R - 6) continue;
      if (cs.every(o => o === c || Math.hypot(o.x - x, o.y - y) > 2 * R + 1)) { c.x = x; c.y = y; return; }
    }
  }
  c.x = x0; c.y = ys[0];
}
// After everything stops: caps resting past the enemy's line get captured.
function resolve(cs, fx) {
  // No hiding: a cap resting completely behind its OWN line goes back onto that line.
  for (const c of cs) {
    if (!inOwnEnd(c)) continue;
    const y = c.t === 'O' ? LINE_BOT : LINE_TOP;
    let placed = false;
    for (let k = 0; k < 60 && !placed; k++) {
      const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (R * 0.5);
      const x = Math.max(R + 6, Math.min(BW - R - 6, c.x)) + off;
      if (x < R + 6 || x > BW - R - 6) continue;
      if (cs.every(o => o === c || Math.hypot(o.x - x, o.y - y) > 2 * R + 1)) { c.x = x; c.y = y; placed = true; }
    }
    if (!placed) { c.y = y; }
    if (fx) fx('backToLine', c);
  }
  for (const c of cs.slice()) {
    const inEnemyEnd = (c.t === 'R' && c.y > LINE_BOT) || (c.t === 'O' && c.y < LINE_TOP);
    if (!inEnemyEnd) continue;
    const cap = other(c.t);
    const alive = countT(cap, cs);
    const from = c.t;
    if (alive < N) { c.t = cap; if (fx) fx('convert', c, from); }
    else { cs.splice(cs.indexOf(c), 1); if (fx) fx('remove', c, from); }
  }
}
function countT(t, cs) { let n = 0; for (const c of cs) if (c.t === t) n++; return n; }

// ---------- formations ----------
function zone(t) {
  const x0 = R + 10, x1 = BW - R - 10;
  return t === 'O' ? { x0, x1, y0: BH / 2 + R + 10, y1: LINE_BOT - R - 6 }
                   : { x0, x1, y0: LINE_TOP + R + 6, y1: BH / 2 - R - 10 };
}
function rows(t) {
  const out = [], spec = [[4, 60], [4, 135], [3, 210]];
  for (const [n, off] of spec) {
    for (let k = 0; k < n; k++) {
      const x = n === 4 ? 105 + k * 130 : 170 + k * 130;
      const y = t === 'O' ? LINE_BOT - off : LINE_TOP + off;
      out.push({ x, y, vx: 0, vy: 0, t });
    }
  }
  return out;
}
function shuffled(t) {
  const z = zone(t), out = [];
  let tries = 0;
  while (out.length < N && tries < 5000) {
    tries++;
    const x = z.x0 + Math.random() * (z.x1 - z.x0), y = z.y0 + Math.random() * (z.y1 - z.y0);
    if (out.every(o => Math.hypot(o.x - x, o.y - y) > 2 * R + 8)) out.push({ x, y, vx: 0, vy: 0, t });
  }
  return out.length === N ? out : rows(t);
}

// ---------- computer player ----------
function clone(cs) { return cs.map(c => ({ x: c.x, y: c.y, vx: c.vx, vy: c.vy, t: c.t })); }
function simulate(cs, idx, vx, vy) {
  const sc = clone(cs);
  sc[idx].vx = vx; sc[idx].vy = vy;
  let n = 0;
  while (step(sc, null) && n < 3000) n++;
  resolve(sc, null);
  return sc;
}
function inOwnEnd(c) { return (c.t === 'O' && c.y > LINE_BOT + R) || (c.t === 'R' && c.y < LINE_TOP - R); }

// Evaluation weights (tuned by self-play, see train.js)
let WEIGHTS = { mine: 12, theirs: 10, myRisk: 3, theirRisk: 2, myLine: 2, theirLine: 1.5, center: 0 };

function evaluate(cs, me, W) {
  let m = 0, e = 0, v = 0;
  for (const c of cs) {
    const mineCap = c.t === me;
    if (mineCap) m++; else e++;
    const ex = Math.min(c.x, BW - c.x);
    const side = Math.max(0, 1 - ex / (R * 2.5));
    const dLine = c.t === 'R' ? LINE_BOT - c.y : c.y - LINE_TOP;   // distance to the enemy's line
    const line = Math.max(0, 1 - dLine / (R * 3));
    const cen = 1 - Math.abs(c.x - BW / 2) / (BW / 2);
    if (mineCap) v += -W.myRisk * side - W.myLine * line + W.center * cen;
    else v += W.theirRisk * side + W.theirLine * line;
  }
  if (m === 0) return -1e5;
  if (e === 0) return 1e5;
  return v + m * W.mine - e * W.theirs;
}

function candidates(cs, me, rand) {
  const out = [], mine = [], foes = [];
  cs.forEach((c, i) => { if (c.t === me) mine.push(i); else foes.push(c); });
  const toMyEnd = me === 'O' ? 1 : -1;   // pushing a foe this way drives it toward my line
  for (const i of mine) {
    const c = cs[i];
    for (const o of foes) {
      const dx = o.x - c.x, dy = o.y - c.y, d = Math.hypot(dx, dy) || 1;
      const dirs = [[-1, 0], [1, 0], [0, toMyEnd], [dx / d, dy / d]];
      for (const [px, py] of dirs) {
        const ax = o.x - px * 2 * R, ay = o.y - py * 2 * R;
        const sx = ax - c.x, sy = ay - c.y, sl = Math.hypot(sx, sy);
        if (sl < 1) continue;
        const ux = sx / sl, uy = sy / sl;
        if (ux * px + uy * py < 0.3) continue;
        for (const pw of [0.45, 0.65, 0.85, 1]) out.push([i, ux * pw * MAXV, uy * pw * MAXV]);
      }
    }
  }
  for (let k = 0; k < 40 && mine.length; k++) {
    const a = rand() * Math.PI * 2, pw = 0.25 + rand() * 0.75;
    out.push([mine[(rand() * mine.length) | 0], Math.cos(a) * pw * MAXV, Math.sin(a) * pw * MAXV]);
  }
  return out;
}
function shuffleArr(a, rand) {
  for (let k = a.length - 1; k > 0; k--) { const j = (rand() * (k + 1)) | 0; const t = a[k]; a[k] = a[j]; a[j] = t; }
  return a;
}

// n: shots considered, ang/pow: aiming error (radians / fraction), wild: chance of a careless shot,
// ply: 1 = also predicts the opponent's best reply to its top `top` shots, using `reply` replies each.
const LEVELS = {
  beginner:     { label: 'Beginner',     n: 12,  ang: 0.22,  pow: 0.30, wild: 0.35, ply: 0 },
  amateur:      { label: 'Amateur',      n: 60,  ang: 0.08,  pow: 0.12, wild: 0.08, ply: 0 },
  professional: { label: 'Professional', n: 300, ang: 0.02,  pow: 0.04, wild: 0,    ply: 0 },
  legendary:    { label: 'Legendary',    n: 500, ang: 0.004, pow: 0.01, wild: 0,    ply: 1, top: 8, reply: 120 }
};

function* planGen(cs, me, L, W, rand = Math.random) {
  const all = candidates(cs, me, rand);
  const cands = shuffleArr(all.slice(), rand).slice(0, L.n);
  const scored = [];
  for (const cd of cands) {
    const res = simulate(cs, cd[0], cd[1], cd[2]);
    scored.push([evaluate(res, me, W) + rand() * 0.3, cd, res]);
    yield;
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b[0] - a[0]);
  let best = scored[0];
  if (L.ply && best[0] < 5e4) {
    const opp = other(me);
    let bestV = -Infinity;
    for (const s of scored.slice(0, L.top)) {
      if (s[0] >= 5e4) { best = s; break; }
      const rc = shuffleArr(candidates(s[2], opp, rand), rand).slice(0, L.reply);
      let oppBest = -Infinity, oppState = null;
      for (const r of rc) {
        const rs = simulate(s[2], r[0], r[1], r[2]);
        const ov = evaluate(rs, opp, W);
        if (ov > oppBest) { oppBest = ov; oppState = rs; }
        yield;
      }
      const v = oppState ? 0.6 * evaluate(oppState, me, W) + 0.4 * s[0] : s[0];
      if (v > bestV) { bestV = v; best = s; }
    }
  }
  let cd = best[1];
  if (L.wild && rand() < L.wild) cd = all[(rand() * all.length) | 0] || cd;
  const ang = (rand() - 0.5) * L.ang, pf = 1 + (rand() - 0.5) * L.pow;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  let vx = (cd[1] * ca - cd[2] * sa) * pf, vy = (cd[1] * sa + cd[2] * ca) * pf;
  const sp = Math.hypot(vx, vy);
  if (sp > MAXV) { vx *= MAXV / sp; vy *= MAXV / sp; }
  return { idx: cd[0], vx, vy };
}
function plan(cs, me, L, W, rand) {
  const g = planGen(cs, me, L, W, rand);
  let r; do { r = g.next(); } while (!r.done);
  return r.value;
}
// ===== END ENGINE =====
