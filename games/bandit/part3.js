
// ---------- part 3: the view. A camera just behind your jet, a sky, a floor of cloud, two jets, smoke and fire ----------
const SUN = (() => { const v = [-0.55, 0.34, 0.76], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
const HAZE = '#d6e7f4';
const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, F: 370, cx: 195, cy: 370, cyw: 1, syw: 0, cp: 1, sp: 0, cr: 1, sr: 0, orbit: 0 };
const CAMM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, F: 120, cx: 0, cy: 0, cyw: 1, syw: 0, cp: 1, sp: 0, cr: 1, sr: 0 };
let CC = CAM;                                 // the camera being drawn through
function camSet(c) { c.cyw = Math.cos(c.yaw); c.syw = Math.sin(c.yaw); c.cp = Math.cos(c.pitch); c.sp = Math.sin(c.pitch); c.cr = Math.cos(c.roll); c.sr = Math.sin(c.roll); }
let PX = 0, PY = 0, PZ = 0;
function P3(x, y, z) {                        // a place in the sky -> a place on the screen (false if it is behind the camera)
  const c = CC, dx = x - c.x, dy = y - c.y, dz = z - c.z;
  const X = dx * c.cyw - dz * c.syw, Z = dx * c.syw * c.cp + dy * c.sp + dz * c.cyw * c.cp, Y = -dx * c.syw * c.sp + dy * c.cp - dz * c.cyw * c.sp;
  PZ = Z; if (Z < 1) return false;
  const q = c.F / Z; PX = c.cx + (X * c.cr - Y * c.sr) * q; PY = c.cy - (X * c.sr + Y * c.cr) * q; return true;
}
const FX = { shake: 0, kx: 0, ky: 0, flash: 0, red: 0, gold: 0, stop: 0, slow: 0 };

// ----- pictures made once: the cloud floor, cloud heaps, soft blobs for smoke, fire and glare -----
let TEX = null;
const TW = 2600;                              // one tile of cloud floor is this many metres across
function soft(size, stops) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, size, size); return c; }
function makeTex() {
  const S = 256, r = rng(4242), g = new Float32Array(S * S);
  for (const [n, amp] of [[4, 1], [8, 0.55], [16, 0.3], [32, 0.16], [64, 0.08]]) {       // noise that joins up at the edges, in five sizes
    const grid = new Float32Array(n * n); for (let i = 0; i < n * n; i++) grid[i] = r();
    const cell = S / n;
    for (let y = 0; y < S; y++) {
      const gy = y / cell, y0 = Math.floor(gy), fy = gy - y0, sy = fy * fy * (3 - 2 * fy), ya = (y0 % n) * n, yb = ((y0 + 1) % n) * n;
      for (let x = 0; x < S; x++) { const gx = x / cell, x0 = Math.floor(gx), fx = gx - x0, sx = fx * fx * (3 - 2 * fx), xa = x0 % n, xb = (x0 + 1) % n; g[y * S + x] += amp * ((grid[ya + xa] * (1 - sx) + grid[ya + xb] * sx) * (1 - sy) + (grid[yb + xa] * (1 - sx) + grid[yb + xb] * sx) * sy); }
    }
  }
  let mn = 9, mx = -9; for (const v of g) { if (v < mn) mn = v; if (v > mx) mx = v; }
  const c0 = document.createElement('canvas'); c0.width = c0.height = S; const x0 = c0.getContext('2d'), im = x0.createImageData(S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, h = (g[i] - mn) / (mx - mn), hs = (g[((y + 3) % S) * S + (x + S - 3) % S] - mn) / (mx - mn);    // the height a little way toward the sun
    const lit = clamp(0.6 + (h - hs) * 6, 0, 1), deep = clamp((0.45 - h) / 0.2, 0, 1) * 0.6;       // slopes that face the sun are bright; hollows are blue
    d[i * 4] = (148 + 107 * lit) * (1 - deep) + 62 * deep; d[i * 4 + 1] = (168 + 87 * lit) * (1 - deep) + 98 * deep; d[i * 4 + 2] = (204 + 51 * lit) * (1 - deep) + 152 * deep; d[i * 4 + 3] = 255;
  }
  x0.putImageData(im, 0, 0);
  const lv = [c0];
  for (const s of [64, 16]) { const c = document.createElement('canvas'); c.width = c.height = s; const q = c.getContext('2d'); q.imageSmoothingQuality = 'high'; q.drawImage(lv[lv.length - 1], 0, 0, s, s); lv.push(c); }
  const heaps = [];
  for (let v = 0; v < 3; v++) {                // heaps of cloud that stand up out of the floor
    const c = document.createElement('canvas'); c.width = 192; c.height = 128; const q = c.getContext('2d'), rr = rng(77 + v * 13);
    for (let i = 0; i < 16; i++) {
      const bx = 34 + rr() * 124, by = 62 + rr() * 34 - Math.sin((bx - 34) / 124 * Math.PI) * 26, br = 20 + rr() * 26, gr = q.createRadialGradient(bx - br * 0.25, by - br * 0.3, br * 0.1, bx, by, br);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(226,236,247,.75)'); gr.addColorStop(1, 'rgba(190,206,228,0)'); q.fillStyle = gr; q.beginPath(); q.arc(bx, by, br, 0, TAU); q.fill();
    }
    const fade = q.createLinearGradient(0, 84, 0, 128); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)'); q.globalCompositeOperation = 'destination-out'; q.fillStyle = fade; q.fillRect(0, 84, 192, 44);
    heaps.push(c);
  }
  TEX = {
    lv, pat: lv.map(c => ctx.createPattern(c, 'repeat')), mpt: [TW / 256, TW / 64, TW / 16], heaps,
    smoke: soft(64, [[0, 'rgba(255,255,255,.9)'], [0.45, 'rgba(250,252,255,.45)'], [1, 'rgba(240,246,255,0)']]),
    dark: soft(64, [[0, 'rgba(52,50,52,.9)'], [0.5, 'rgba(70,68,72,.45)'], [1, 'rgba(90,90,96,0)']]),
    fire: soft(64, [[0, 'rgba(255,246,200,1)'], [0.3, 'rgba(255,180,60,.85)'], [0.7, 'rgba(230,80,20,.35)'], [1, 'rgba(160,30,10,0)']]),
    hot: soft(64, [[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(255,244,210,.95)'], [0.5, 'rgba(255,190,90,.4)'], [1, 'rgba(255,140,40,0)']]),
    burn: soft(64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(190,225,255,.9)'], [0.6, 'rgba(90,150,255,.35)'], [1, 'rgba(60,110,255,0)']]),
    sun: soft(256, [[0, 'rgba(255,255,255,1)'], [0.06, 'rgba(255,252,236,1)'], [0.12, 'rgba(255,240,200,.55)'], [0.4, 'rgba(255,230,180,.16)'], [1, 'rgba(255,225,170,0)']])
  };
}

// ----- the jets: built from flat pieces, turned and lit, far pieces drawn first -----
function loft(m, st, n, col, half) {          // a body: rings of points joined into panels. st = [z, half width, half height, centre height]
  const base = m.V.length, cnt = half ? n + 1 : n;
  for (const s of st) for (let j = 0; j < cnt; j++) { const a = half ? j / n * Math.PI : (j + 0.5) / n * TAU; m.V.push([s[1] * Math.cos(a), s[3] + s[2] * Math.sin(a), s[0]]); }
  for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < (half ? n : cnt); j++) {
    const a = base + i * cnt + j, b = base + i * cnt + (j + 1) % cnt, c = base + (i + 1) * cnt + (j + 1) % cnt, d = base + (i + 1) * cnt + j;
    face(m, [a, d, c, b], typeof col === 'function' ? col(i, j) : col, { cull: true, mid: [0, (st[i][3] + st[i + 1][3]) / 2, (st[i][0] + st[i + 1][0]) / 2] });
  }
  if (!half) { const idx = []; for (let j = 0; j < cnt; j++) idx.push(base + (st.length - 1) * cnt + j); face(m, idx, [40, 42, 48], { cull: true, mid: [0, st[st.length - 1][3], st[st.length - 1][0] + 1] }); }
}
function face(m, idx, col, o) {
  const A = m.V[idx[0]], B = m.V[idx[1]], Cc = m.V[idx[2]];
  let nx = (B[1] - A[1]) * (Cc[2] - A[2]) - (B[2] - A[2]) * (Cc[1] - A[1]), ny = (B[2] - A[2]) * (Cc[0] - A[0]) - (B[0] - A[0]) * (Cc[2] - A[2]), nz = (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]);
  const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  if (o && o.mid) { let cx = 0, cy = 0, cz = 0; for (const i of idx) { cx += m.V[i][0]; cy += m.V[i][1]; cz += m.V[i][2]; } cx /= idx.length; cy /= idx.length; cz /= idx.length; if ((cx - o.mid[0]) * nx + (cy - o.mid[1]) * ny + (cz - o.mid[2]) * nz < 0) { idx = idx.slice().reverse(); nx = -nx; ny = -ny; nz = -nz; } }
  m.F.push({ v: idx, col, n: [nx, ny, nz], cull: !!(o && o.cull), col2: o && o.col2, glass: o && o.glass });
}
function plate(m, pts, col, col2, both) {     // a thin flat piece (wing, fin). both: make its mirror image on the other side too
  const add = ps => { const idx = ps.map(p => m.V.push(p) - 1); face(m, idx, col, { col2: col2 || col }); };
  add(pts); if (both) add(pts.map(p => [-p[0], p[1], p[2]]).reverse());
}
const hexc = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
function buildJet(frame, c1, c2, trim, hero) {
  const m = { V: [], F: [], noz: [], tips: [], len: 19.2 }, A = hexc(c1), B = hexc(c2), T = hexc(trim), GL = hero ? [176, 138, 62] : [34, 44, 60], DK = [58, 62, 70];
  const body = (i, j) => i === 0 ? (hero ? DK : T) : (j >= 4 ? B : A);     // nose cone in its own colour, a darker belly
  loft(m, [[9.6, 0.05, 0.05, 0], [8.1, 0.44, 0.38, 0.02], [6.2, 0.8, 0.66, 0.1], [3.8, 1.14, 0.86, 0.16], [0.4, 1.5, 0.9, 0.1], [-4.2, 1.56, 0.84, 0.04], [-7.4, 1.36, 0.7, 0], [-8.4, 1.16, 0.6, 0]], 8, body);
  const cs = [[7.0, 0.04, 0.04, 0.6], [6.0, 0.4, 0.38, 0.8], [4.6, 0.47, 0.46, 0.92], [3.2, 0.38, 0.32, 0.92], [2.1, 0.08, 0.06, 0.88]], b0 = m.F.length;
  loft(m, cs, 4, GL, true); for (let i = b0; i < m.F.length; i++) m.F[i].glass = 1;
  if (frame === 'twin') {
    plate(m, [[1.45, 0.05, 2.7], [6.7, -0.06, -2.3], [6.7, -0.06, -4.3], [1.45, 0.05, -5.5]], A, B, true);
    plate(m, [[1.3, 0, -6.2], [4.2, 0, -8.6], [4.2, 0, -9.7], [1.3, 0, -9.1]], A, B, true);
    plate(m, [[1.25, 0.7, -4.5], [1.25, 0.7, -8.4], [2.15, 2.65, -8.82], [2.15, 2.65, -6.6]], A, A, true);
    plate(m, [[2.15, 2.65, -6.6], [2.15, 2.65, -8.82], [2.55, 3.5, -9.0], [2.55, 3.5, -7.4]], T, T, true);
    m.noz = [[-0.74, 0, -8.5], [0.74, 0, -8.5]]; m.tips = [[-6.7, -0.06, -3.4], [6.7, -0.06, -3.4]];
  } else if (frame === 'delta') {
    plate(m, [[1.4, 0, 3.4], [7.0, 0, -6.6], [7.0, 0, -7.4], [1.4, 0, -7.7]], A, B, true);
    plate(m, [[1.0, 0.32, 6.3], [3.3, 0.32, 4.7], [3.3, 0.32, 4.0], [1.0, 0.32, 4.4]], B, B, true);
    plate(m, [[0, 0.8, -3.0], [0, 0.8, -8.3], [0, 3.1, -8.8], [0, 3.1, -6.4]], A, A, false);
    plate(m, [[0, 3.1, -6.4], [0, 3.1, -8.8], [0, 4.3, -9.1], [0, 4.3, -7.7]], T, T, false);
    m.noz = [[-0.74, 0, -8.5], [0.74, 0, -8.5]]; m.tips = [[-7.0, 0, -7.0], [7.0, 0, -7.0]];
  } else {
    plate(m, [[1.4, 0, 2.2], [7.5, 0, -4.9], [7.5, 0, -6.3], [1.4, 0, -3.8]], A, B, true);
    plate(m, [[1.2, 0, -6.4], [4.1, 0, -9.2], [4.1, 0, -10.0], [1.2, 0, -8.7]], A, B, true);
    plate(m, [[0, 0.8, -3.8], [0, 0.8, -8.4], [0, 3.4, -9.2], [0, 3.4, -7.2]], A, A, false);
    plate(m, [[0, 3.4, -7.2], [0, 3.4, -9.2], [0, 4.7, -9.7], [0, 4.7, -8.3]], T, T, false);
    m.noz = [[0, 0, -8.5]]; m.tips = [[-7.5, 0, -5.6], [7.5, 0, -5.6]];
  }
  for (const nz of m.noz) { const b0 = m.V.length; loft(m, [[-8.3, 0.66, 0.66, nz[1]], [-9.5, 0.56, 0.56, nz[1]]], 8, [46, 48, 54]); for (let i = b0; i < m.V.length; i++) m.V[i][0] += nz[0]; }
  return m;
}
const MODELS = {};
function modelFor(look) { const key = look.frame + look.paint[0] + look.trim; return MODELS[key] || (MODELS[key] = buildJet(look.frame, look.paint[0], look.paint[1], look.trim, false)); }
let HERO = null;
const SXv = new Float32Array(400), SYv = new Float32Array(400), SZv = new Float32Array(400), WX = new Float32Array(400), WY = new Float32Array(400), WZ = new Float32Array(400);
function jetAxes(j) {
  const cy = Math.cos(j.yaw), sy = Math.sin(j.yaw), cp = Math.cos(j.pitch), sp = Math.sin(j.pitch), cr = Math.cos(j.roll), sr = Math.sin(j.roll);
  // model x (right wing): rolled (right wing down for a right bank), pitched, then turned to the heading
  const rx = cr, ry = -sr, rz = 0, ux = sr, uy = cr, uz = 0;                 // after the roll: right = (cr, -sr, 0), up = (sr, cr, 0), forward = (0, 0, 1)
  const pit = (x, y, z) => [x, y * cp + z * sp, -y * sp + z * cp], yw = v => [v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy];
  return [yw(pit(rx, ry, rz)), yw(pit(ux, uy, uz)), yw(pit(0, 0, 1))];
}
function drawModel(m, j, sc, alpha) {
  const [R, U, Fw] = jetAxes(j), n = m.V.length, c = CC;
  for (let i = 0; i < n; i++) {
    const v = m.V[i], wx = j.x + (v[0] * R[0] + v[1] * U[0] + v[2] * Fw[0]) * sc, wy = j.y + (v[0] * R[1] + v[1] * U[1] + v[2] * Fw[1]) * sc, wz = j.z + (v[0] * R[2] + v[1] * U[2] + v[2] * Fw[2]) * sc;
    WX[i] = wx; WY[i] = wy; WZ[i] = wz;
    if (P3(wx, wy, wz)) { SXv[i] = PX; SYv[i] = PY; SZv[i] = PZ; } else SZv[i] = -1;
  }
  const vis = [];
  for (const f of m.F) {
    let z = 0, ok = true, cx = 0, cy = 0, cz = 0; for (const i of f.v) { if (SZv[i] < 0) { ok = false; break; } z += SZv[i]; cx += WX[i]; cy += WY[i]; cz += WZ[i]; }
    if (!ok) continue;
    const k = f.v.length; cx /= k; cy /= k; cz /= k;
    let nx = f.n[0] * R[0] + f.n[1] * U[0] + f.n[2] * Fw[0], ny = f.n[0] * R[1] + f.n[1] * U[1] + f.n[2] * Fw[1], nz = f.n[0] * R[2] + f.n[1] * U[2] + f.n[2] * Fw[2];
    const toCam = (c.x - cx) * nx + (c.y - cy) * ny + (c.z - cz) * nz; let col = f.col;
    if (toCam < 0) { if (f.cull) continue; nx = -nx; ny = -ny; nz = -nz; col = f.col2 || col; }
    let li = 0.5 + 0.5 * Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]) + 0.1 * Math.max(0, ny);
    if (f.glass) li += 0.5 * Math.pow(Math.max(0, nx * SUN[0] + ny * SUN[1] + nz * SUN[2]), 6);
    vis.push({ z: z / k, f, s: `rgb(${Math.min(255, col[0] * li) | 0},${Math.min(255, col[1] * li) | 0},${Math.min(255, col[2] * li) | 0})` });
  }
  vis.sort((a, b) => b.z - a.z);
  if (alpha != null) ctx.globalAlpha = alpha;
  ctx.lineWidth = 0.7; ctx.lineJoin = 'round';
  for (const q of vis) {
    const v = q.f.v; ctx.beginPath(); ctx.moveTo(SXv[v[0]], SYv[v[0]]); for (let i = 1; i < v.length; i++) ctx.lineTo(SXv[v[i]], SYv[v[i]]); ctx.closePath();
    ctx.fillStyle = q.s; ctx.fill(); ctx.strokeStyle = q.s; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function partPos(j, p, sc) { const [R, U, Fw] = jetAxes(j); return [j.x + (p[0] * R[0] + p[1] * U[0] + p[2] * Fw[0]) * sc, j.y + (p[0] * R[1] + p[1] * U[1] + p[2] * Fw[1]) * sc, j.z + (p[0] * R[2] + p[1] * U[2] + p[2] * Fw[2]) * sc]; }

// ----- smoke, fire, sparks -----
const PT = [];
function puff(x, y, z, vx, vy, vz, life, s0, s1, kind, a) { if (PT.length > 560) PT.splice(0, 40); PT.push({ x, y, z, vx, vy, vz, age: 0, life, s0, s1, kind, a: a == null ? 1 : a }); }
function burst(x, y, z, big) {
  const n = big ? 1 : 0.5;
  puff(x, y, z, 0, 0, 0, 0.2, 30 * n, 70 * n, 3, 1);
  for (let i = 0; i < 14 * n; i++) { const a = Math.random() * TAU, e = Math.random() * 2 - 1, v = 14 + Math.random() * 42; puff(x, y, z, Math.cos(a) * v, e * v, Math.sin(a) * v, 0.45 + Math.random() * 0.5, 7 * n, 26 * n, 2, 0.95); }
  for (let i = 0; i < 16 * n; i++) { const a = Math.random() * TAU, e = Math.random() * 2 - 1, v = 6 + Math.random() * 22; puff(x, y, z, Math.cos(a) * v, e * v + 4, Math.sin(a) * v, 1.3 + Math.random() * 1.4, 9 * n, 42 * n, 1, 0.8); }
  if (big) for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, e = Math.random() * 1.6 - 0.6, v = 60 + Math.random() * 110; puff(x, y, z, Math.cos(a) * v, e * v, Math.sin(a) * v, 0.8 + Math.random() * 0.9, 1.2, 0.6, 4, 1); }
}
const SC_ME = 1, SC_FOE = 2.3;      // he is drawn bigger than life, so a jet half a kilometre off still reads as a jet
function visuals(G, dt, rdt) {                // what trails behind things, frame by frame (never changes the fight)
  const me = G.me, f = G.foe;
  for (const p of PT) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; const dr = p.kind === 4 ? 0.4 : 2.2; p.vx *= 1 - dr * dt; p.vz *= 1 - dr * dt; p.vy = p.kind === 4 ? p.vy - 60 * dt : p.vy * (1 - dr * dt); }
  for (let i = PT.length - 1; i >= 0; i--) if (PT[i].age >= PT[i].life) PT.splice(i, 1);
  if (dt <= 0) return;
  for (const s of G.shots) if (!s.dead) puff(s.x - s.d[0] * 4, s.y - s.d[1] * 4, s.z - s.d[2] * 4, (Math.random() - 0.5) * 3, 1.5, (Math.random() - 0.5) * 3, 1.5, 1.6, 7.5, 0, 0.6);
  for (const fl of G.flares) if (fl.age < 1.9 && Math.random() < 0.6) puff(fl.x, fl.y, fl.z, 0, 3, 0, 0.9, 1, 4.5, 0, 0.35);
  for (const [j, m, sc] of [[me, HERO, SC_ME], [f, f.look ? modelFor(f.look) : HERO, SC_FOE]]) {
    if (!j || !m) continue;
    if (j.alive && j.load > 0.62) for (const t of m.tips) { const p = partPos(j, t, sc); puff(p[0], p[1], p[2], 0, 0, 0, 0.42, 0.5, 1.5, 5, 0.5 * (j.load - 0.4)); }
    const hurtN = j.alive ? (j.hp < j.hpMax * 0.35 ? 0.9 : j.hp < j.hpMax * 0.7 ? 0.4 : 0) : 1;
    if (hurtN > 0 && Math.random() < hurtN) { const p = partPos(j, [0.6, 0.2, -7], sc); puff(p[0], p[1], p[2], (Math.random() - 0.5) * 6, 2, (Math.random() - 0.5) * 6, 1.4, 2.5, 10 + 8 * hurtN, 1, 0.55); }
    if (!j.alive && j.y > 30) { const p = partPos(j, [0, 0, -4], sc); puff(p[0], p[1], p[2], (Math.random() - 0.5) * 8, 4, (Math.random() - 0.5) * 8, 0.5, 5, 13, 2, 0.9); }
  }
}

// ----- the camera -----
function camFollow(G, rdt, snap) {
  const me = G.me, t = snap ? 1 : Math.min(1, 6 * rdt);
  if (G.phase === 'home') CAM.orbit = 0.75 * Math.sin(performance.now() / 5200); else CAM.orbit += (0 - CAM.orbit) * Math.min(1, 3 * rdt);
  CAM.yaw = wrapA(CAM.yaw + wrapA(me.yaw + CAM.orbit - CAM.yaw) * t); CAM.pitch += (me.pitch * 0.9 - CAM.pitch) * t; CAM.roll += (me.roll * 0.5 - CAM.roll) * (snap ? 1 : Math.min(1, 4.5 * rdt));
  const cp = Math.cos(CAM.pitch), back = 34, up = 11;
  CAM.x = me.x - Math.sin(CAM.yaw) * cp * back; CAM.y = me.y - Math.sin(CAM.pitch) * back + up; CAM.z = me.z - Math.cos(CAM.yaw) * cp * back;
  FX.shake = Math.max(0, FX.shake - rdt * 26); FX.kx *= Math.pow(0.0008, rdt); FX.ky *= Math.pow(0.0008, rdt);
  CAM.F = Math.min(W, H * 0.62) * 0.95; CAM.cx = W / 2 + FX.kx + (Math.random() - 0.5) * FX.shake; CAM.cy = H * 0.44 + FX.ky + (Math.random() - 0.5) * FX.shake; camSet(CAM);
}

// ----- sky and cloud floor, drawn with the horizon level and then turned by the bank -----
function drawSky(c, rad, floorTex) {
  ctx.save(); ctx.translate(c.cx, c.cy); ctx.rotate(-c.roll);
  const F = c.F, yh = F * Math.tan(c.pitch), sky = ctx.createLinearGradient(0, yh, 0, yh - F * 1.5);
  sky.addColorStop(0, '#cfe4f5'); sky.addColorStop(0.1, '#a9cdee'); sky.addColorStop(0.36, '#5f9be0'); sky.addColorStop(0.7, '#2a66bd'); sky.addColorStop(1, '#123f8c');
  ctx.fillStyle = sky; ctx.fillRect(-rad, -rad, rad * 2, rad + yh + 1);
  ctx.fillStyle = HAZE; ctx.fillRect(-rad, yh, rad * 2, rad - yh + 1);
  const h = Math.max(40, c.y);
  if (floorTex && TEX) {
    const rx = c.cyw, rz = -c.syw, fx = c.syw, fz = c.cyw, tp = Math.tan(c.pitch);
    let y = yh + 1.2;
    while (y < rad) {
      const a = Math.atan(y / F) - c.pitch, stepY = clamp((y - yh) * 0.05 * QUAL, 1.2 * QUAL, 5 * QUAL);
      if (a > 0.004) {
        const D = h / Math.tan(a), Z = D * c.cp - h * c.sp;
        if (Z > 1 && D < 60000) {
          const s = Z / F, ca = Math.cos(c.pitch + a), g = F * h / ((D * D + h * h) * ca * ca), lv = s > TEX.mpt[1] * 0.9 ? 2 : s > TEX.mpt[0] * 1.6 ? 1 : 0, mpt = TEX.mpt[lv];
          const X0 = ((c.x + fx * D) % TW + TW) % TW, Z0 = ((c.z + fz * D) % TW + TW) % TW, p = TEX.pat[lv];
          p.setTransform(new DOMMatrix([mpt * rx / s, -mpt * fx * g, mpt * rz / s, -mpt * fz * g, -(X0 * rx + Z0 * rz) / s, y + (X0 * fx + Z0 * fz) * g]));
          ctx.fillStyle = p; ctx.fillRect(-rad, y, rad * 2, stepY + 0.7);
        }
      }
      y += stepY;
    }
  } else { const fl = ctx.createLinearGradient(0, yh, 0, yh + F); fl.addColorStop(0, HAZE); fl.addColorStop(1, '#b9cfe6'); ctx.fillStyle = fl; ctx.fillRect(-rad, yh, rad * 2, rad - yh + 1); }
  const hz = ctx.createLinearGradient(0, yh, 0, yh + F * 0.42); hz.addColorStop(0, 'rgba(214,231,244,1)'); hz.addColorStop(0.25, 'rgba(214,231,244,.72)'); hz.addColorStop(1, 'rgba(214,231,244,0)');
  ctx.fillStyle = hz; ctx.fillRect(-rad, yh - 1, rad * 2, F * 0.42 + 1);
  ctx.restore();
}

let QUAL = 1;                                 // 1 = finest cloud floor; a phone that cannot keep up gets a coarser one (see frame())
const ITEMS = [];
function drawParticle(p) {
  const t = p.age / p.life, s = (p.s0 + (p.s1 - p.s0) * t) * CC.F / PZ; if (s < 0.4) return;
  const a = p.a * Math.pow(1 - t, 1.3) * clamp((PZ - 12) / 60, 0, 1); if (a < 0.01) return;      // anything right in front of the camera fades, so it never hides the fight
  if (p.kind === 4) { const x1 = PX, y1 = PY; if (!P3(p.x - p.vx * 0.035, p.y - p.vy * 0.035, p.z - p.vz * 0.035)) return; ctx.globalAlpha = a; ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = Math.max(1, s); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(PX, PY); ctx.stroke(); ctx.globalAlpha = 1; return; }
  const img = p.kind === 0 || p.kind === 5 ? TEX.smoke : p.kind === 1 ? TEX.dark : p.kind === 2 ? TEX.fire : TEX.hot, add = p.kind === 2 || p.kind === 3;
  if (add) ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a; ctx.drawImage(img, PX - s, PY - s, s * 2, s * 2); ctx.globalAlpha = 1;
  if (add) ctx.globalCompositeOperation = 'source-over';
}
function glow(img, x, y, z, size, a) { if (!P3(x, y, z)) return; const s = size * CC.F / PZ; if (s < 0.5) return; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(img, PX - s, PY - s, s * 2, s * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
function drawJetItem(j, m, sc, now) {
  drawModel(m, j, sc);
  const fw = fwdOf(j), seen = (CC.x - j.x) * fw[0] + (CC.y - j.y) * fw[1] + (CC.z - j.z) * fw[2] < 0;      // the burn only shows from behind
  if (j.alive && seen) for (const nz of m.noz) {       // the engines: a blue-white burn that stretches when it is working hard
    const thr = 0.55 + 0.45 * clamp((j.v - 150) / 150, 0, 1), fl = 0.85 + 0.15 * Math.sin(now * 61 + nz[0] * 9);
    for (let q = 0; q < 3; q++) { const p = partPos(j, [nz[0], nz[1], -9.3 - q * 1.5 * thr], sc); glow(q === 0 ? TEX.hot : TEX.burn, p[0], p[1], p[2], (1.25 - q * 0.3) * sc * fl, (0.9 - q * 0.25) * thr); }
  }
}
function collect(G, mirror) {
  ITEMS.length = 0;
  const me = G.me, f = G.foe;
  if (!mirror && TEX) {                        // heaps of cloud standing on the floor, on a grid that goes on for ever
    const cell = 950, n = 5, cx0 = Math.floor(CC.x / cell), cz0 = Math.floor(CC.z / cell);
    for (let ix = -n; ix <= n; ix++) for (let iz = -n; iz <= n; iz++) {
      const gx = cx0 + ix, gz = cz0 + iz, hsh = Math.abs(Math.sin(gx * 127.1 + gz * 311.7) * 43758.5453) % 1; if (hsh > 0.42) continue;
      const hx = (gx + 0.2 + 0.6 * ((hsh * 7.13) % 1)) * cell, hz = (gz + 0.2 + 0.6 * ((hsh * 13.7) % 1)) * cell, w = 300 + 380 * ((hsh * 3.3) % 1);
      if (!P3(hx, w * 0.2, hz)) continue;
      const d = PZ, far = clamp((n * cell - 300 - Math.hypot(hx - CC.x, hz - CC.z)) / 900, 0, 1), near = clamp((d - 120) / 300, 0, 1); if (far * near < 0.02) continue;
      ITEMS.push({ z: d, k: 0, x: PX, y: PY, w: w * CC.F / d, a: far * near * 0.92, v: Math.floor(hsh * 30) % 3 });
    }
  }
  for (const p of PT) if (P3(p.x, p.y, p.z)) ITEMS.push({ z: PZ, k: 1, p, x: PX, y: PY });
  if (!mirror && P3(me.x, me.y, me.z)) ITEMS.push({ z: PZ, k: 2, j: me, m: HERO, sc: SC_ME });
  if (f && f.look && (f.alive || f.y > 0) && P3(f.x, f.y, f.z)) ITEMS.push({ z: PZ, k: 2, j: f, m: modelFor(f.look), sc: mirror ? SC_FOE * 1.5 : SC_FOE });
  for (const s of G.shots) if (!s.dead && P3(s.x, s.y, s.z)) ITEMS.push({ z: PZ - 2, k: 3, s });
  for (const fl of G.flares) if (fl.age < 2 && P3(fl.x, fl.y, fl.z)) ITEMS.push({ z: PZ - 1, k: 4, fl });
  ITEMS.sort((a, b) => b.z - a.z);
}
function drawItems(now, mirror) {
  for (const it of ITEMS) {
    if (it.k === 0) { const img = TEX.heaps[it.v], w = it.w, hh = w * 0.67; ctx.globalAlpha = it.a; ctx.drawImage(img, it.x - w / 2, it.y - hh * 0.72, w, hh); ctx.globalAlpha = 1; }
    else if (it.k === 1) { PX = it.x; PY = it.y; PZ = it.z; drawParticle(it.p); }
    else if (it.k === 2) drawJetItem(it.j, it.m, it.sc, now);
    else if (it.k === 3) { const s = it.s; glow(TEX.hot, s.x, s.y, s.z, mirror ? 9 : 3.2, 1); glow(TEX.fire, s.x - s.d[0] * 5, s.y - s.d[1] * 5, s.z - s.d[2] * 5, mirror ? 7 : 2.6, 0.8); }
    else { const fl = it.fl, q = 1 - fl.age / 2, fk = 0.75 + 0.25 * Math.sin(now * 70 + fl.x); glow(TEX.hot, fl.x, fl.y, fl.z, 5 * fk * (0.5 + 0.5 * q), Math.min(1, q * 1.6) * (mirror ? 0.8 : 1)); glow(TEX.fire, fl.x, fl.y, fl.z, 11 * fk * q, (mirror ? 0.3 : 0.55) * q); }
  }
}
function drawWorld(G, now) {
  if (!TEX) makeTex();
  CC = CAM; const rad = Math.hypot(W, H) * 0.62 + 30;
  drawSky(CAM, rad, true);
  if (P3(CAM.x + SUN[0] * 1e5, CAM.y + SUN[1] * 1e5, CAM.z + SUN[2] * 1e5)) { const s = CAM.F * 0.62; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.85; ctx.drawImage(TEX.sun, PX - s, PY - s, s * 2, s * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  collect(G, false); drawItems(now, false);
}
// the mirror: what is behind you, left and right the way a mirror shows them
function drawMirror(G, now, x, y, w, h, hot) {
  const me = G.me;
  const f = G.foe, aim = f.alive && me.r && me.r.off > 1.7 ? f : (G.threat || f), dx = aim.x - me.x, dy = aim.y - me.y - 2.5, dz = aim.z - me.z, dd = Math.hypot(dx, dy, dz) || 1;      // it looks straight at him (or at his missile), so he is always in it
  CAMM.x = me.x; CAMM.y = me.y + 2.5; CAMM.z = me.z; CAMM.yaw = Math.atan2(dx, dz); CAMM.pitch = clamp(Math.asin(clamp(dy / dd, -1, 1)), -0.6, 0.6); CAMM.roll = 0; CAMM.F = w * 1.9; CAMM.cx = w / 2; CAMM.cy = h * 0.5; camSet(CAMM);
  ctx.save(); rrect(x, y, w, h, 12 * k); ctx.clip(); ctx.translate(x + w, y); ctx.scale(-1, 1);
  CC = CAMM; drawSky(CAMM, w, false); collect(G, true); drawItems(now, true);
  const th = G.threat; if (th && P3(th.x, th.y, th.z)) { const r = (7 + 3 * Math.sin(now * 24)) * k; ctx.strokeStyle = '#ff3b2e'; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.arc(PX, PY, r, 0, TAU); ctx.stroke(); }      // his missile, ringed so it cannot be missed
  CC = CAM;
  ctx.restore();
  ctx.lineWidth = 2.5 * k; ctx.strokeStyle = hot ? `rgba(255,${70 + 60 * Math.sin(now * 20)},60,.95)` : 'rgba(238,244,251,.55)'; rrect(x, y, w, h, 12 * k); ctx.stroke();
}
