
// ---------- the view: a camera close behind your own chariot ----------
const CAM = { x: 0, z: 0, h: 3.3, th: 0, c: 1, s: 0, F: 400, hor: 300, roll: 0, back: 5.6, dl: 0, kick: 0, wide: 0, mx: 0, mz: 6 };
const FX = { shake: 0, stop: 0, slow: 0, flash: 0, gold: 0 };
const NEAR = 0.6, HW = 2.3, HT = 9.2, SD = 9, HS = 1.35, STOA = 2.8;    // near plane; outer wall height, top of the stands, depth of the stands, barrier height, colonnade height
let SX = 0, SY = 0, SC = 0;
function P3(x, y, z) {                      // a point in the arena -> the screen (SX, SY) and its scale SC in pixels per metre; false if behind the camera
  const dx = x - CAM.x, dz = z - CAM.z, zc = dx * CAM.c + dz * CAM.s; if (zc < NEAR) { SC = 0; return false; }
  SC = CAM.F / zc; SX = W / 2 + (dx * CAM.s - dz * CAM.c) * SC; SY = CAM.hor - (y - CAM.h) * SC; return true;
}
const depth = (x, z) => (x - CAM.x) * CAM.c + (z - CAM.z) * CAM.s;
const Q = new Float32Array(72), CB = new Float32Array(72), CL = new Float32Array(78);
function q4(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) { Q[0] = x1; Q[1] = y1; Q[2] = z1; Q[3] = x2; Q[4] = y2; Q[5] = z2; Q[6] = x3; Q[7] = y3; Q[8] = z3; Q[9] = x4; Q[10] = y4; Q[11] = z4; }
function poly3(pts, n, fill) {              // fill a flat polygon given in arena coordinates, cut off cleanly where it passes behind the camera
  let behind = 0;
  for (let i = 0; i < n; i++) { const dx = pts[i * 3] - CAM.x, dz = pts[i * 3 + 2] - CAM.z, zc = dx * CAM.c + dz * CAM.s; CB[i * 3] = dx * CAM.s - dz * CAM.c; CB[i * 3 + 1] = pts[i * 3 + 1] - CAM.h; CB[i * 3 + 2] = zc; if (zc < NEAR) behind++; }
  if (behind === n) return false;
  let src = CB, m = n;
  if (behind) {
    m = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, az = CB[i * 3 + 2], bz = CB[j * 3 + 2], ain = az >= NEAR, bin = bz >= NEAR;
      if (ain) { CL[m * 3] = CB[i * 3]; CL[m * 3 + 1] = CB[i * 3 + 1]; CL[m * 3 + 2] = az; m++; }
      if (ain !== bin) { const t = (NEAR - az) / (bz - az); CL[m * 3] = CB[i * 3] + (CB[j * 3] - CB[i * 3]) * t; CL[m * 3 + 1] = CB[i * 3 + 1] + (CB[j * 3 + 1] - CB[i * 3 + 1]) * t; CL[m * 3 + 2] = NEAR; m++; }
    }
    if (m < 3) return false; src = CL;
  }
  ctx.beginPath();
  for (let i = 0; i < m; i++) { const z = src[i * 3 + 2], sx = W / 2 + CAM.F * src[i * 3] / z, sy = CAM.hor - CAM.F * src[i * 3 + 1] / z; if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  return true;
}
// ---------- a picture painted on the stands so that it stays put ----------
// The patch is cut into upright strips at fixed places on the stands themselves, each strip so short that perspective barely changes across it.
// So the crowd is nailed to its seats: it cannot slide, stretch or hang over the wall as the camera moves.
let MA = 1, MB = 0, MC = 0, MD = 1, ME = 0, MF = 0, MS = 1, STRIPS = 0;      // the canvas transform the arena is drawn under (set once a frame); strips drawn this frame
const TB = new Float32Array(5 * 66);
function texQ(img, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz) {   // A top-left, B top-right, C bottom-left, D bottom-right, in arena coordinates
  const cc = CAM.c, cs = CAM.s, F = CAM.F, hx = W / 2, hy = CAM.hor, ZN = 1.4, M = 60, TOL = 2;
  // the four corners as the camera sees them: across, up, away
  let X = ax - CAM.x, Z = az - CAM.z; const aX = X * cs - Z * cc, aZ = X * cc + Z * cs, aY = ay - CAM.h;
  X = bx - CAM.x; Z = bz - CAM.z; const bX = X * cs - Z * cc, bZ = X * cc + Z * cs, bY = by - CAM.h;
  X = cx - CAM.x; Z = cz - CAM.z; const cX = X * cs - Z * cc, cZ = X * cc + Z * cs, cY = cy - CAM.h;
  X = dx - CAM.x; Z = dz - CAM.z; const dX = X * cs - Z * cc, dZ = X * cc + Z * cs, dY = dy - CAM.h;
  // keep the part in front of the camera (t runs along the patch, 0 at A/C, 1 at B/D)
  let t0 = 0, t1 = 1, q = bZ - aZ;
  if (q > 1e-6) t0 = Math.max(t0, (ZN - aZ) / q); else if (q < -1e-6) t1 = Math.min(t1, (ZN - aZ) / q); else if (aZ < ZN) return;
  q = dZ - cZ; if (q > 1e-6) t0 = Math.max(t0, (ZN - cZ) / q); else if (q < -1e-6) t1 = Math.min(t1, (ZN - cZ) / q); else if (cZ < ZN) return;
  if (t1 - t0 < 0.002) return;
  // its two ends on the screen
  let z = aZ + (bZ - aZ) * t0; const lTx = hx + F * (aX + (bX - aX) * t0) / z, lTy = hy - F * (aY + (bY - aY) * t0) / z, zLt = z;
  z = cZ + (dZ - cZ) * t0; const lBx = hx + F * (cX + (dX - cX) * t0) / z, lBy = hy - F * (cY + (dY - cY) * t0) / z, zL = (zLt + z) / 2;
  z = aZ + (bZ - aZ) * t1; const rTx = hx + F * (aX + (bX - aX) * t1) / z, rTy = hy - F * (aY + (bY - aY) * t1) / z, zRt = z;
  z = cZ + (dZ - cZ) * t1; const rBx = hx + F * (cX + (dX - cX) * t1) / z, rBy = hy - F * (cY + (dY - cY) * t1) / z, zR = (zRt + z) / 2;
  if ((lTx < -M && lBx < -M && rTx < -M && rBx < -M) || (lTx > W + M && lBx > W + M && rTx > W + M && rBx > W + M)) return;
  // the part of its height that is on the screen (f runs down the patch, 0 at the top edge, 1 at the bottom edge)
  let f0 = 1, f1 = 0;
  for (let e = 0; e < 2; e++) {
    const y0 = e ? rTy : lTy, y1 = e ? rBy : lBy, dy2 = y1 - y0; let a0 = 0, a1 = 1;
    if (Math.abs(dy2) < 1e-6) { if (y0 < -M || y0 > H + M) continue; }
    else { const u = (-M - y0) / dy2, v = (H + M - y0) / dy2; a0 = Math.max(0, Math.min(u, v)); a1 = Math.min(1, Math.max(u, v)); if (a1 <= a0) continue; }
    if (a0 < f0) f0 = a0; if (a1 > f1) f1 = a1;
  }
  if (f1 - f0 < 0.004) return;
  // how many strips: enough that the picture is never more than a couple of pixels out at a cut
  const lLen = Math.hypot(lBx - lTx, lBy - lTy) * (f1 - f0), rLen = Math.hypot(rBx - rTx, rBy - rTy) * (f1 - f0), len = Math.max(lLen, rLen, 4);
  const ex = ((rBx - lBx) - (rTx - lTx)) * (f1 - f0), ey = ((rBy - lBy) - (rTy - lTy)) * (f1 - f0), ratio = zL > zR ? zL / zR : zR / zL;
  let n = Math.max(Math.ceil(Math.log(ratio) / Math.log(1 + 2 * TOL / len)), Math.ceil(Math.hypot(ex, ey) / (2 * TOL)), 1); if (n > 64) n = 64;
  // the cuts: evenly spaced in "how much smaller it looks", so near strips are short and far strips long
  const geo = n > 1 && Math.abs(zR - zL) > 0.01, iw = img.width, ih = img.height, sy = f0 * ih, sh = (f1 - f0) * ih, rip = img.rip;
  for (let k = 0; k <= n; k++) {
    const u = geo ? (zL * Math.pow(zR / zL, k / n) - zL) / (zR - zL) : k / n, t = t0 + (t1 - t0) * u;
    let zz = aZ + (bZ - aZ) * t; const tx = hx + F * (aX + (bX - aX) * t) / zz, ty = hy - F * (aY + (bY - aY) * t) / zz;
    zz = cZ + (dZ - cZ) * t; const bx2 = hx + F * (cX + (dX - cX) * t) / zz, by2 = hy - F * (cY + (dY - cY) * t) / zz;
    TB[k * 5] = tx + (bx2 - tx) * f0; TB[k * 5 + 1] = ty + (by2 - ty) * f0; TB[k * 5 + 2] = tx + (bx2 - tx) * f1; TB[k * 5 + 3] = ty + (by2 - ty) * f1; TB[k * 5 + 4] = t;
  }
  let drew = 0;
  for (let k = 0; k < n; k++) {
    const o = k * 5, Ax = TB[o], Ay = TB[o + 1], Cx = TB[o + 2], Cy = TB[o + 3], Bx = TB[o + 5], By = TB[o + 6], Dx = TB[o + 7], Dy = TB[o + 8];
    if ((Ax < -M && Bx < -M && Cx < -M && Dx < -M) || (Ax > W + M && Bx > W + M && Cx > W + M && Dx > W + M)) continue;
    // the best-fitting slanted rectangle for this strip, a hair oversize so no gap can open between neighbours
    let Ex = ((Bx - Ax) + (Dx - Cx)) / 2, Ey = ((By - Ay) + (Dy - Cy)) / 2, Vx = ((Cx - Ax) + (Dx - Bx)) / 2, Vy = ((Cy - Ay) + (Dy - By)) / 2;
    const el = Math.hypot(Ex, Ey), vl = Math.hypot(Vx, Vy); if (el < 0.05 || vl < 0.05) continue;
    const er = Math.hypot((Dx - Cx) - (Bx - Ax), (Dy - Cy) - (By - Ay)) / 2;     // how far this strip's true corners stray from the slanted rectangle: overlap by that much, so no wedge of bare stone can show
    const fe = 1 + 1.5 / el, fv = 1 + (1 + er) / vl; Ex *= fe; Ey *= fe; Vx *= fv; Vy *= fv;
    const Ox = (Ax + Bx + Cx + Dx) / 4 - (Ex + Vx) / 2, Oy = (Ay + By + Cy + Dy) / 4 - (Ey + Vy) / 2;
    ctx.setTransform(MA * Ex + MC * Ey, MB * Ex + MD * Ey, MA * Vx + MC * Vy, MB * Vx + MD * Vy, MA * Ox + MC * Oy + ME, MB * Ox + MD * Oy + MF);
    const sx = TB[o + 4] * iw, sw = (TB[o + 9] - TB[o + 4]) * iw;
    let im = img, ku = 1, kv = 1;           // draw from the copy whose dots are about the size of the screen's
    if (rip) { const a = clamp(Math.round(Math.log2(sw / (el * MS))), 0, rip.length - 1), b = clamp(Math.round(Math.log2(sh / (vl * MS))), 0, rip[0].length - 1); im = rip[a][b]; ku = im.width / iw; kv = im.height / ih; }
    ctx.drawImage(im, sx * ku, sy * kv, sw * ku, sh * kv, 0, 0, 1, 1); drew++;
  }
  if (drew) { ctx.setTransform(MA, MB, MC, MD, ME, MF); STRIPS += drew; }
}
function camFollow(R, dt, snap) {
  const T = R.T, me = R.me, s = sOf(T, me.p);
  let dth = trackAt(T, s + 5 + me.v * 0.12, 0).th - CAM.th; dth -= Math.round(dth / 6.2832) * 6.2832;      // look a little ahead, into the turn
  CAM.th += snap ? dth : dth * Math.min(1, dt * 7);
  CAM.dl += (me.d - CAM.dl) * (snap ? 1 : Math.min(1, dt * 5));
  trackAt(T, s, lerp(me.d, CAM.dl, 0.6));
  let beside = me.warn ? 1 : 0;              // someone level with you: the view pulls back and widens so you can see the chariot beside yours
  if (!beside && R.phase !== 'finish') for (const o of R.cars) { if (o === me || (o.st !== 'run' && o.st !== 'grid')) continue; let dp = o.p - me.p; dp -= Math.round(dp / T.L) * T.L; if (Math.abs(dp) < 6.5 && Math.abs(o.d - me.d) < 8.5) { beside = 1; break; } }
  CAM.wide += (beside - CAM.wide) * (snap ? 1 : Math.min(1, dt * (beside ? 3 : 1.3)));
  CAM.back = 5.3 + 0.9 * (me.v / PH.vTop) + CAM.kick * 0.9 + 3 * CAM.wide;
  CAM.c = Math.cos(CAM.th); CAM.s = Math.sin(CAM.th);
  let x = TP.x - CAM.back * CAM.c, z = TP.z - CAM.back * CAM.s;
  // keep the camera inside the arena and off the barrier
  const cx = clamp(x, -T.Ls / 2, T.Ls / 2), dd = Math.hypot(x - cx, z), ro = T.Rc + T.hw - 0.9, ri = T.rIn + 0.9;
  if (dd > ro) { x = cx + (x - cx) * ro / dd; z = z * ro / dd; } else if (dd < ri && dd > 0.01) { x = cx + (x - cx) * ri / dd; z = z * ri / dd; }
  CAM.x = x; CAM.z = z; CAM.h = 3.3 + 0.6 * CAM.wide; CAM.F = Math.min(W, H * 0.62) * 1.05 * (1 - 0.05 * CAM.kick) * (1 - 0.1 * CAM.wide); CAM.hor = H * 0.36;
  const rollT = -clamp(me.lat * 0.0055 + me.vd * 0.004, -0.075, 0.075) * (me.st === 'wreck' ? 0 : 1);
  CAM.roll += (rollT - CAM.roll) * (snap ? 1 : Math.min(1, dt * 5));
  CAM.kick = Math.max(0, CAM.kick - dt * 1.7);
}
function camOrbit(R, t) {                   // the home screen: a slow walk around your team on the starting line
  const T = R.T, me = R.me; trackAt(T, sOf(T, me.p) + 1.4, me.d);
  const a = -2.5 + Math.sin(t * 0.12) * 0.5, rad = 9.5;
  CAM.th = a + Math.PI; CAM.c = Math.cos(CAM.th); CAM.s = Math.sin(CAM.th);
  let x = TP.x + Math.cos(a) * rad, z = TP.z + Math.sin(a) * rad; const cx = clamp(x, -T.Ls / 2, T.Ls / 2), dd = Math.hypot(x - cx, z), ro = T.Rc + T.hw - 0.9;
  if (dd > ro) { x = cx + (x - cx) * ro / dd; z = z * ro / dd; }
  CAM.x = x; CAM.z = z; CAM.h = 3.0; CAM.F = Math.min(W, H * 0.62) * 1.0; CAM.hor = H * 0.4; CAM.roll = 0;
}

// ---------- painted once per venue: the far scenery, the crowd, the walls ----------
const PANOS = {};
function buildPano(V) {
  if (PANOS[V.name]) return PANOS[V.name];
  const PW = 1280, B = 220, c = document.createElement('canvas'); c.width = PW; c.height = B;
  const g = c.getContext('2d'), r = rng(V.name.charCodeAt(0) * 131 + V.name.charCodeAt(1) * 17 + V.name.length), TAU = 6.2832, f = V.feat;
  const wrap = fn => { for (const ox of [-PW, 0, PW]) { g.save(); g.translate(ox, 0); fn(); g.restore(); } };
  const sx = V.sun[0] * PW, sy = B - 26 - V.sun[1] * 175;
  wrap(() => { const rg = g.createRadialGradient(sx, sy, 0, sx, sy, 130); rg.addColorStop(0, V.sun[2]); rg.addColorStop(0.1, V.sun[2]); rg.addColorStop(0.14, 'rgba(255,244,214,.5)'); rg.addColorStop(1, 'rgba(255,244,214,0)'); g.fillStyle = rg; g.fillRect(sx - 130, sy - 130, 260, 260); });
  g.fillStyle = 'rgba(255,255,255,.42)';
  for (let i = 0; i < 9; i++) { const x = r() * PW, y = 18 + r() * 95, w = 40 + r() * 70; wrap(() => { g.beginPath(); g.ellipse(x, y, w, 5, 0, 0, TAU); g.ellipse(x + w * 0.3, y - 5, w * 0.5, 6, 0, 0, TAU); g.fill(); }); }
  const ridge = (amp, fr, sharp, win) => { const ph = fr.map(() => r() * TAU); return x => { let v = 0, ws = 0; for (let i = 0; i < fr.length; i++) { const w = 1 / (i + 1), s = Math.sin(x / PW * TAU * fr[i] + ph[i]); v += w * (sharp ? 1 - Math.abs(s) : 0.5 + 0.5 * s); ws += w; } return amp * v / ws * (win ? win(x) : 1); }; };
  const layer = (h, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, B); for (let x = 0; x <= PW; x += 4) g.lineTo(x, B - h(x)); g.lineTo(PW, B); g.fill(); };
  const gap = (c0, half) => x => { let d = Math.abs(x / PW - c0); d = Math.min(d, 1 - d); return clamp((d - half) / 0.07, 0, 1); };   // 0 inside a sector of the horizon, 1 outside it
  const sea = () => { const sg = g.createLinearGradient(0, B - 30, 0, B); sg.addColorStop(0, mix(V.sky[2], '#2f78a8', 0.6)); sg.addColorStop(1, '#27628f'); g.fillStyle = sg; g.fillRect(0, B - 30, PW, 30); g.fillStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 60; i++) g.fillRect(r() * PW, B - 27 + r() * 24, 5 + r() * 14, 1); };
  const temple = (x, y, w, cols = 6) => { const h = w * 0.42, cw = w / (cols * 2 - 1); g.fillStyle = '#cdbf9f'; g.fillRect(x - w / 2 - 3, y - 3, w + 6, 3); g.fillStyle = 'rgba(60,45,30,.55)'; g.fillRect(x - w / 2, y - 3 - h, w, h);
    g.fillStyle = '#f0e8d6'; for (let i = 0; i < cols; i++) g.fillRect(x - w / 2 + i * cw * 2, y - 3 - h, cw, h); g.fillRect(x - w / 2 - 2, y - h - 8, w + 4, 5);
    g.fillStyle = '#e2d6bb'; g.beginPath(); g.moveTo(x - w / 2 - 3, y - h - 8); g.lineTo(x, y - h - 8 - w * 0.16); g.lineTo(x + w / 2 + 3, y - h - 8); g.fill(); };
  const cypress = (x, y, h) => { g.fillStyle = '#24492f'; g.beginPath(); g.ellipse(x, y - h / 2, h * 0.14, h / 2, 0, 0, TAU); g.fill(); };
  const pine = (x, y, h) => { g.fillStyle = '#4a3a22'; g.fillRect(x - 1, y - h * 0.5, 2, h * 0.5); g.fillStyle = '#2f6b45'; g.beginPath(); g.ellipse(x, y - h * 0.7, h * 0.42, h * 0.3, 0, 0, TAU); g.fill(); };
  const palm = (x, y, h) => { g.strokeStyle = '#5a4424'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - h * 0.5, x + 1, y - h); g.stroke(); g.strokeStyle = '#3f7a3a'; g.lineWidth = 1.6; for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6; g.beginPath(); g.moveTo(x + 1, y - h); g.quadraticCurveTo(x + 1 + Math.cos(a) * h * 0.25, y - h - 5 + Math.sin(a) * 4, x + 1 + Math.cos(a) * h * 0.42, y - h + 4 + Math.abs(Math.sin(a)) * -2 + 5); g.stroke(); } };
  const ship = (x, y, w) => { g.fillStyle = '#3a2618'; g.beginPath(); g.moveTo(x - w / 2, y - 4); g.quadraticCurveTo(x, y + 4, x + w / 2, y - 6); g.lineTo(x + w / 2, y - 2); g.quadraticCurveTo(x, y + 6, x - w / 2, y); g.fill(); g.fillRect(x - 0.5, y - 16, 1.2, 16); g.fillStyle = '#e8dcc0'; g.fillRect(x - 6, y - 15, 12, 6); };
  const tower = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x - w / 2, y - h, w, h); for (let i = 0; i < 3; i++) g.fillRect(x - w / 2 + i * w / 2.5, y - h - 3, w / 5, 3); };
  const scatter = (fn, h, cnt, lo, hi, on) => { for (let i = 0; i < cnt; i++) { const x = r() * PW, hh = lo + r() * (hi - lo); if (on && on(x) < 0.5) continue; fn(x, B - h(x) * (0.45 + r() * 0.5), hh); } };
  const far = V.far, hill = V.hill;
  if (f === 'temple') { layer(ridge(100, [2, 5, 9, 17]), far); const h2 = ridge(54, [3, 7, 13, 23]); layer(h2, hill); scatter(pine, h2, 46, 9, 17); temple(PW * 0.3, B - h2(PW * 0.3) + 6, 92); temple(PW * 0.36, B - h2(PW * 0.36) + 5, 36, 4); }
  else if (f === 'cliffs') { layer(ridge(185, [2, 3, 7, 11], true), far); const h2 = ridge(84, [4, 9, 15], true); layer(h2, hill); scatter(cypress, h2, 26, 12, 22); temple(PW * 0.72, B - h2(PW * 0.72) + 5, 70); }
  else if (f === 'sea') { layer(ridge(60, [3, 7, 12]), far); sea(); const w = gap(0.55, 0.17), h2 = ridge(50, [2, 6, 11, 19], false, w); layer(h2, hill); scatter(pine, h2, 60, 10, 18, w); for (let i = 0; i < 7; i++) ship(PW * (0.42 + r() * 0.26), B - 6 - r() * 18, 22 + r() * 10); temple(PW * 0.18, B - h2(PW * 0.18) + 5, 64); }
  else if (f === 'cypress') { layer(ridge(74, [2, 5, 8, 15]), far); const h2 = ridge(58, [3, 6, 11, 21]); layer(h2, hill); scatter(cypress, h2, 70, 12, 26); g.fillStyle = '#efe6d2'; for (let i = 0; i < 3; i++) g.fillRect(PW * 0.42 + i * 12, B - h2(PW * 0.42) - 26, 5, 34); g.fillRect(PW * 0.42 - 2, B - h2(PW * 0.42) - 30, 34, 4); }
  else if (f === 'acropolis') { layer(ridge(80, [2, 4, 9, 14]), far); const h2 = ridge(26, [5, 9, 17]); layer(h2, hill); g.fillStyle = '#e8dcc0'; for (let i = 0; i < 150; i++) { const x = r() * PW; g.fillRect(x, B - h2(x) - 2 - r() * 6, 5 + r() * 7, 5 + r() * 5); }
    const ax = PW * 0.36; g.fillStyle = '#9a8468'; g.beginPath(); g.moveTo(ax - 150, B - 14); g.lineTo(ax - 112, B - 72); g.lineTo(ax + 108, B - 78); g.lineTo(ax + 150, B - 14); g.fill(); g.fillStyle = '#b8a482'; g.fillRect(ax - 112, B - 80, 220, 8); temple(ax + 14, B - 78, 104, 8); temple(ax - 70, B - 78, 34, 4); scatter(cypress, h2, 20, 10, 18); }
  else if (f === 'peaks') { const h1 = ridge(160, [2, 5, 7, 13], true); layer(h1, far); g.fillStyle = '#f4f2f6'; for (let x = 0; x < PW;) { if (h1(x) <= 98) { x += 2; continue; } const x0 = x; g.beginPath(); g.moveTo(x, B - h1(x)); for (; x < PW && h1(x) > 98; x += 2) g.lineTo(x, B - h1(x)); for (let xx = x; xx >= x0; xx -= 2) { const h = h1(xx); g.lineTo(xx, B - h + Math.min(30, (h - 98) * 0.8) * (0.7 + 0.3 * Math.sin(xx * 0.45))); } g.fill(); } const h2 = ridge(60, [3, 8, 14, 22]); layer(h2, hill); scatter(cypress, h2, 34, 12, 22); }
  else if (f === 'walls') { layer(ridge(64, [2, 5, 9]), far); const h2 = ridge(30, [3, 7, 15]); layer(h2, hill); const y = B - 22; g.fillStyle = '#c9b48c'; g.fillRect(PW * 0.16, y - 24, PW * 0.38, 26); for (let x = PW * 0.16; x < PW * 0.54; x += 9) g.fillRect(x, y - 28, 5, 4); for (let i = 0; i < 7; i++) tower(PW * (0.17 + i * 0.06), y + 2, 22, 44, '#b8a27a'); g.fillStyle = '#3a2a1a'; g.fillRect(PW * 0.35 - 7, y - 16, 14, 18); scatter(pine, h2, 30, 9, 15); }
  else if (f === 'volcano') { layer(ridge(46, [3, 7, 11]), far); const ex = PW * 0.6; g.fillStyle = mix(far, '#6a5a6a', 0.5); g.beginPath(); g.moveTo(ex - 230, B); g.quadraticCurveTo(ex - 80, B - 60, ex - 18, B - 168); g.lineTo(ex + 16, B - 168); g.quadraticCurveTo(ex + 90, B - 60, ex + 240, B); g.fill(); g.fillStyle = '#f2eef2'; g.beginPath(); g.moveTo(ex - 18, B - 168); g.lineTo(ex + 16, B - 168); g.lineTo(ex + 34, B - 138); g.lineTo(ex + 8, B - 146); g.lineTo(ex - 10, B - 136); g.lineTo(ex - 34, B - 140); g.fill();
    g.fillStyle = 'rgba(120,115,125,.5)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(ex + i * 16, B - 176 - i * 5, 14 + i * 5, 8 + i * 2, 0, 0, TAU); g.fill(); } sea(); const w = gap(0.6, 0.2), h2 = ridge(46, [2, 6, 13], false, w); layer(h2, hill); scatter(pine, h2, 40, 9, 16, w); temple(PW * 0.2, B - h2(PW * 0.2) + 5, 70); for (let i = 0; i < 5; i++) ship(PW * (0.48 + r() * 0.24), B - 6 - r() * 16, 22 + r() * 8); }
  else if (f === 'colossus') { layer(ridge(50, [3, 8, 13]), far); sea(); const w = gap(0.5, 0.13), h2 = ridge(44, [2, 5, 11], false, w); layer(h2, hill); scatter(pine, h2, 40, 9, 16, w); for (let i = 0; i < 5; i++) ship(PW * (0.4 + r() * 0.2), B - 5 - r() * 14, 20 + r() * 9);
    const cx2 = PW * 0.5, y = B - 22; g.fillStyle = '#d8ceb8'; g.fillRect(cx2 - 16, y - 16, 32, 18); g.fillStyle = '#a8763a'; g.fillRect(cx2 - 9, y - 70, 7, 56); g.fillRect(cx2 + 2, y - 70, 7, 56); g.fillRect(cx2 - 12, y - 112, 24, 46); g.beginPath(); g.arc(cx2, y - 121, 9, 0, TAU); g.fill();
    g.strokeStyle = '#a8763a'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx2 + 10, y - 106); g.lineTo(cx2 + 26, y - 138); g.moveTo(cx2 - 10, y - 104); g.lineTo(cx2 - 20, y - 78); g.stroke(); g.strokeStyle = '#e9c46a'; g.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6; g.beginPath(); g.moveTo(cx2 + Math.cos(a) * 10, y - 121 + Math.sin(a) * 10); g.lineTo(cx2 + Math.cos(a) * 17, y - 121 + Math.sin(a) * 17); g.stroke(); } g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(cx2 + 27, y - 142, 5, 0, TAU); g.fill(); }
  else if (f === 'pharos') { layer(ridge(40, [3, 7, 12]), far); sea(); const w = gap(0.42, 0.1), h2 = ridge(24, [2, 6, 13], false, w); layer(h2, hill); g.fillStyle = '#ecdcb8'; for (let i = 0; i < 120; i++) { const x = r() * PW; if (w(x) > 0.5) g.fillRect(x, B - h2(x) - 3 - r() * 7, 6 + r() * 9, 6 + r() * 6); } scatter(palm, h2, 34, 16, 28, w);
    const px = PW * 0.42, y = B - 24; g.fillStyle = '#b8a888'; g.fillRect(px - 34, y - 4, 68, 8); g.fillStyle = '#efe6d0'; g.fillRect(px - 15, y - 70, 30, 68); g.fillStyle = '#e2d6ba'; g.fillRect(px - 10, y - 108, 20, 40); g.fillStyle = '#efe6d0'; g.fillRect(px - 6, y - 128, 12, 22); g.fillStyle = '#d0c2a2'; g.fillRect(px - 18, y - 72, 36, 4); g.fillRect(px - 13, y - 110, 26, 3);
    const fg = g.createRadialGradient(px, y - 134, 0, px, y - 134, 26); fg.addColorStop(0, 'rgba(255,230,150,1)'); fg.addColorStop(0.3, 'rgba(255,170,70,.7)'); fg.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = fg; g.fillRect(px - 26, y - 160, 52, 52); for (let i = 0; i < 3; i++) ship(PW * (0.36 + r() * 0.12), B - 5 - r() * 12, 20); }
  else if (f === 'dunes') { layer(ridge(44, [2, 5, 9]), far); const h2 = ridge(28, [3, 8, 14]); layer(h2, hill); layer(ridge(14, [4, 11, 19]), mix(hill, '#ffffff', 0.18)); scatter(palm, h2, 26, 16, 30); g.fillStyle = '#a88a5a'; g.beginPath(); g.moveTo(PW * 0.62, B - 20); g.lineTo(PW * 0.64, B - 62); g.lineTo(PW * 0.69, B - 66); g.lineTo(PW * 0.72, B - 20); g.fill(); temple(PW * 0.24, B - h2(PW * 0.24) + 4, 66); }
  else if (f === 'troy') { layer(ridge(74, [2, 5, 9, 14]), far); sea(); const w = gap(0.7, 0.15), h2 = ridge(40, [2, 5, 12], false, w); layer(h2, hill); for (let i = 0; i < 9; i++) ship(PW * (0.59 + i * 0.026), B - 4 - (i % 2) * 5, 26);
    const tx = PW * 0.3, y = B - h2(tx) + 8; g.fillStyle = '#b09a78'; g.beginPath(); g.moveTo(tx - 120, y); g.lineTo(tx - 96, y - 40); g.lineTo(tx + 96, y - 40); g.lineTo(tx + 120, y); g.fill(); for (let x = tx - 96; x < tx + 96; x += 9) g.fillRect(x, y - 44, 5, 4); for (const ox of [-90, -30, 40, 90]) tower(tx + ox, y - 30, 20, 30, '#a08a68'); temple(tx, y - 40, 60, 5); g.fillStyle = '#3a2a1a'; g.fillRect(tx + 4, y - 22, 14, 22); }
  else { const wv = x => 0.3 + 0.7 * (1 - gap(0.5, 0.07)(x)), h1 = ridge(215, [1, 2, 5, 9], true, wv); layer(h1, far); layer(x => h1(x) * 0.86 - 10, mix(far, '#ffffff', 0.35)); layer(ridge(60, [3, 7, 12], true), hill);
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 26; i++) { const x = r() * PW, y = B - 40 - r() * 90, w = 50 + r() * 90; wrap(() => { g.beginPath(); g.ellipse(x, y, w, 9, 0, 0, TAU); g.ellipse(x + w * 0.3, y - 7, w * 0.5, 9, 0, 0, TAU); g.fill(); }); }
    let bx = 0, bh = 0; for (let x = 0; x < PW; x += 4) if (h1(x) > bh) { bh = h1(x); bx = x; } g.save(); g.globalAlpha = 0.9; temple(bx, B - bh + 10, 50); g.restore(); }
  const hz = g.createLinearGradient(0, B - 46, 0, B); hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(1, V.sky[2]); g.globalAlpha = 0.55; g.fillStyle = hz; g.fillRect(0, B - 46, PW, 46); g.globalAlpha = 1;
  return PANOS[V.name] = c;
}
const STOA_DARK = '#4a3a2e', STOA_ROOF = '#b5532f';
function ripmap(base, nw, nh) {             // smaller copies of a picture, each half the size across and/or down
  const lv = [];
  for (let a = 0; a < nw; a++) { lv.push([]); for (let b = 0; b < nh; b++) {
    if (!a && !b) { lv[0].push(base); continue; }
    const src = b ? lv[a][b - 1] : lv[a - 1][0], c = document.createElement('canvas'); c.width = Math.max(1, base.width >> a); c.height = Math.max(1, base.height >> b);
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, c.width, c.height); lv[a].push(c); } }
  base.rip = lv; return base;
}
function stoaTex(V) {                       // the row of columns along the top of the stands, in front of deep shade
  const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d'); g.scale(2, 2);
  g.fillStyle = STOA_DARK; g.fillRect(0, 0, 64, 16);
  for (let x = 6; x < 64; x += 16) { g.fillStyle = V.wall; g.fillRect(x, 0, 4, 16); g.fillRect(x - 1, 0, 6, 1.5); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x + 3, 1.5, 1, 14.5); }
  return ripmap(c, 5, 3);
}
function crowdTex(seed) {                   // a patch of the stands: rows of spectators on stone steps. One still picture: the crowd keeps its seats.
  const c = document.createElement('canvas'); c.width = 192; c.height = 128; const g = c.getContext('2d'), r = rng(seed); g.scale(2, 2);
  const cols = ['#f1ebdd', '#e7dcc4', '#c96f4a', '#8a3b2a', '#3d6b8c', '#d9b25a', '#7a8f5a', '#b98a6a', '#efe6d2', '#9a5a7a', '#f4efe4'], skin = ['#e0ac69', '#c68642', '#f1c27d', '#8d5524'];
  for (let row = 0; row < 8; row++) {
    const y = row * 8; g.fillStyle = row & 1 ? '#b3a78f' : '#c2b69e'; g.fillRect(0, y, 96, 8); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, y + 7, 96, 1);
    for (let x = (row & 1) * 3; x < 94; x += 6) { const a = r(), d = r(), e = r(); if (a < 0.1) continue;
      g.fillStyle = cols[(d * cols.length) | 0]; g.fillRect(x, y + 3, 5, 5); g.fillStyle = skin[(e * 4) | 0]; g.fillRect(x + 1, y, 3, 3); }
  }
  let avg = '#b0977c';                     // the colour of the crowd from far away, for the stone under the picture
  try { const d = g.getImageData(0, 0, 192, 128).data; let R2 = 0, G2 = 0, B2 = 0; for (let i = 0; i < d.length; i += 16) { R2 += d[i]; G2 += d[i + 1]; B2 += d[i + 2]; } const m = d.length / 16; avg = `rgb(${Math.round(R2 / m)},${Math.round(G2 / m)},${Math.round(B2 / m)})`; } catch (e) {}
  c.avg = avg; return ripmap(c, 6, 5);
}
let TEX = null;
function buildArena(R) {
  const T = R.T, V = R.V, ns = Math.round(T.Ls / 5), nt = 12, n = 2 * (ns + nt);
  if (!TEX) TEX = { crowd: crowdTex(7) };
  const F32 = () => new Float32Array(n + 1);
  const A = { n, ns, nt, ix: F32(), iz: F32(), ox: F32(), oz: F32(), tx: F32(), tz: F32(), dz: new Float32Array(n), ord: [], cWall: [], cRed: [], cKey: [], cEnt: [], cFar: [], items: [], srt: [], mons: [], pano: buildPano(V), stoa: stoaTex(V), spCol: shade(V.wall, 0.9), spRed: shade('#a23b2a', 0.92), spKey: shade('#1f3a5f', 0.95), spTop: shade(V.wall, 1.02), haze: V.sky[2] };
  for (let i = 0; i <= n; i++) {
    const j = i % n, s = j < ns ? j * T.Ls / ns : j < ns + nt ? T.Ls + (j - ns) * T.tl / nt : j < 2 * ns + nt ? T.Ls + T.tl + (j - ns - nt) * T.Ls / ns : 2 * T.Ls + T.tl + (j - 2 * ns - nt) * T.tl / nt;
    trackAt(T, s, -T.hw); A.ix[i] = TP.x; A.iz[i] = TP.z; trackAt(T, s, T.hw); A.ox[i] = TP.x; A.oz[i] = TP.z; trackAt(T, s, T.hw + SD); A.tx[i] = TP.x; A.tz[i] = TP.z;
  }
  const sa = 6.2832 * (1 - V.sun[0]), sxx = Math.cos(sa), szz = Math.sin(sa);
  for (let i = 0; i < n; i++) {             // each stretch of wall catches the sun a little differently; its colours are worked out once
    const nx = A.ix[i] - A.ox[i], nz = A.iz[i] - A.oz[i], l = Math.hypot(nx, nz) || 1, lit = 0.84 + 0.16 * Math.max(0, (nx * sxx + nz * szz) / l);
    A.cWall.push(shade(V.wall, lit)); A.cRed.push(shade('#a23b2a', lit)); A.cKey.push(shade('#1f3a5f', lit)); A.cEnt.push(shade(V.wall, lit * 0.98)); A.cFar.push(shade(mix(STOA_DARK, V.wall, 0.3), lit));
  }
  for (let i = 0; i < 420; i++) A.items.push({ z: 0, k: 0, i: 0 });
  const kinds = V.feat === 'pharos' ? ['obel', 'tripod', 'col', 'altar'] : ['col', 'tripod', 'statue', 'altar'];
  let ki = 0; for (let x = -T.Ls / 2 + 8; x <= T.Ls / 2 - 8; x += 13) A.mons.push({ x, z: 0, y: HS, kind: kinds[ki++ % 4] });
  A.mons.push({ x: T.Ls / 2 + T.rIn * 0.3, z: 0, y: HS, kind: 'post' }, { x: -T.Ls / 2 - T.rIn * 0.3, z: 0, y: HS, kind: 'post' });
  const a = trackAt(T, T.s0 - 0.35, -T.hw), ax = a.x, az = a.z, b = trackAt(T, T.s0 - 0.35, T.hw), bx = b.x, bz = b.z;
  A.line = [ax, az, bx, bz, bx + 0.7, bz, ax + 0.7, az];
  return A;
}

// ---------- the arena, drawn every frame ----------
function drawWorld(R) {
  if (!R.A) R.A = buildArena(R);
  const A = R.A, V = R.V, T = R.T, n = A.n, F = CAM.F, hor = CAM.hor, now = performance.now() / 1000;
  ctx.save();
  ctx.translate(W / 2, hor); ctx.rotate(CAM.roll); ctx.translate(-W / 2, -hor);
  if (FX.shake > 0.2) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  // sky, and the far scenery that swings round as you turn
  let g = ctx.createLinearGradient(0, hor - H * 0.5, 0, hor); g.addColorStop(0, V.sky[0]); g.addColorStop(0.6, V.sky[1]); g.addColorStop(1, V.sky[2]);
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, hor + H + 2);
  const pw = 6.2832 * F, ps = pw / A.pano.width, ph = A.pano.height * ps; let th = CAM.th % 6.2832; if (th < 0) th += 6.2832;
  const x0 = W / 2 - pw * (1 - th / 6.2832);
  for (let q = -1; q <= 1; q++) { const x = x0 + q * pw; if (x < W * 1.6 && x + pw > -W * 0.6) ctx.drawImage(A.pano, x, hor - ph + 1, pw, ph); }
  if (R.eagle) { const ex = ((now * 26) % (W * 2.4)) - W * 0.7, ey = hor - H * 0.27 + Math.sin(now * 0.7) * 12, fl = Math.sin(now * 5) * 5; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex - 11, ey - fl); ctx.quadraticCurveTo(ex - 4, ey - 2, ex, ey); ctx.quadraticCurveTo(ex + 4, ey - 2, ex + 11, ey - fl); ctx.stroke(); }
  // the sand
  g = ctx.createLinearGradient(0, hor, 0, H); g.addColorStop(0, V.sand[2]); g.addColorStop(0.3, V.sand[0]); g.addColorStop(1, V.sand[1]);
  ctx.fillStyle = g; ctx.fillRect(-W, hor, W * 3, H * 2);
  for (let i = 0; i < n; i++) { const j = i + 1; q4(A.ix[i], 0, A.iz[i], A.ox[i], 0, A.oz[i], A.ox[j], 0, A.oz[j], A.ix[j], 0, A.iz[j]); poly3(Q, 4, i & 1 ? V.sand[0] : V.sand[1]); }
  const L = A.line; q4(L[0], 0.01, L[1], L[2], 0.01, L[3], L[4], 0.01, L[5], L[6], 0.01, L[7]); poly3(Q, 4, 'rgba(255,255,255,.85)');
  if (R.hint && R.phase !== 'home') {      // learning levels: where to rein in, and the tight way round the post
    for (let tn = 0; tn < 2; tn++) {
      const s1 = tn ? 2 * T.Ls + T.tl : T.Ls, a = trackAt(T, s1 - 24, -T.hw), ax = a.x, az = a.z, b = trackAt(T, s1 - 24, T.hw), bx = b.x, bz = b.z, c2 = trackAt(T, s1 - 3, T.hw), cx = c2.x, cz = c2.z, d2 = trackAt(T, s1 - 3, -T.hw);
      q4(ax, 0.01, az, bx, 0.01, bz, cx, 0.01, cz, d2.x, 0.01, d2.z); poly3(Q, 4, `rgba(190,45,30,${0.11 * R.hint})`);
      ctx.fillStyle = `rgba(250,205,90,${0.42 * R.hint})`;
      for (let j = 0; j <= 18; j++) { trackAt(T, s1 - 8 + j * (T.tl + 16) / 18, T.dMin + 1.0); if (P3(TP.x, 0.02, TP.z) && SC > 2.5) { ctx.beginPath(); ctx.ellipse(SX, SY, 0.3 * SC, 0.12 * SC, 0, 0, 6.2832); ctx.fill(); } }
    }
  }
  // the outer wall, the stands and the crowd, far to near
  const ord = A.ord; ord.length = 0;
  for (let i = 0; i < n; i++) { const zc = depth((A.ox[i] + A.ox[i + 1]) / 2, (A.oz[i] + A.oz[i + 1]) / 2); A.dz[i] = zc; if (zc > -14) ord.push(i); }
  ord.sort((p, q) => A.dz[q] - A.dz[p]);
  const crowd = TEX.crowd, m0 = ctx.getTransform(); MA = m0.a; MB = m0.b; MC = m0.c; MD = m0.d; ME = m0.e; MF = m0.f; MS = Math.hypot(MA, MB); STRIPS = 0;
  const band = (xa, za, xb, zb, y0, y1, col) => { q4(xa, y0, za, xb, y0, zb, xb, y1, zb, xa, y1, za); poly3(Q, 4, col); };
  for (const i of ord) {
    const j = i + 1, zc = A.dz[i], x1 = A.ox[i], z1 = A.oz[i], x2 = A.ox[j], z2 = A.oz[j], u1 = A.tx[i], w1 = A.tz[i], u2 = A.tx[j], w2 = A.tz[j], top = HT + STOA;
    // flat shapes run a hair long at both ends (about a pixel and a half), so no seam shows where two stretches of wall meet
    const e = Math.max(0.01, 1.5 * Math.max(zc, 2) / F) / (Math.hypot(x2 - x1, z2 - z1) || 1);
    const X1 = x1 - (x2 - x1) * e, Z1 = z1 - (z2 - z1) * e, X2 = x2 + (x2 - x1) * e, Z2 = z2 + (z2 - z1) * e, U1 = u1 - (u2 - u1) * e, W1 = w1 - (w2 - w1) * e, U2 = u2 + (u2 - u1) * e, W2 = w2 + (w2 - w1) * e;
    const g = e * 1.8, X3 = x1 - (x2 - x1) * g, Z3 = z1 - (z2 - z1) * g, X4 = x2 + (x2 - x1) * g, Z4 = z2 + (z2 - z1) * g, U3 = u1 - (u2 - u1) * g, W3 = w1 - (w2 - w1) * g, U4 = u2 + (u2 - u1) * g, W4 = w2 + (w2 - w1) * g;   // bands painted over the marble run a little longer still, so the marble never peeps out at their ends
    // the crowd on its steps: stone the colour of a distant crowd, then the picture pinned on top of it
    q4(X1, HW, Z1, X2, HW, Z2, U2, HT, W2, U1, HT, W1); poly3(Q, 4, crowd.avg);
    texQ(crowd, u1, HT, w1, u2, HT, w2, x1, HW, z1, x2, HW, z2);
    // the wall below: marble, a dark key line, a red band along its foot. Flat shapes, so every edge is exact from any angle.
    band(X1, Z1, X2, Z2, HW * 0.4, HW, A.cWall[i]); band(X3, Z3, X4, Z4, 0, HW * 0.44, A.cRed[i]); if (zc < 110) band(X3, Z3, X4, Z4, HW * 0.47, HW * 0.53, A.cKey[i]);
    // the colonnade above: white columns in front of deep shade (a pinned picture), then a marble beam and a tiled roof (flat shapes)
    band(U1, W1, U2, W2, HT, top, A.cFar[i]); texQ(A.stoa, u1, HT + STOA * 0.66, w1, u2, HT + STOA * 0.66, w2, u1, HT, w1, u2, HT, w2);
    band(U3, W3, U4, W4, HT + STOA * 0.66, HT + STOA * 0.82, A.cEnt[i]); band(U3, W3, U4, W4, HT + STOA * 0.82, top, STOA_ROOF);
    if (zc > 70) { q4(x1, 0, z1, x2, 0, z2, u2, top, w2, u1, top, w1); ctx.globalAlpha = Math.min(0.5, (zc - 70) / 420); poly3(Q, 4, A.haze); ctx.globalAlpha = 1; }
    if (i % 5 === 0 && zc < 170 && P3(u1, top, w1)) {      // a pennant on the roof
      const bx = SX, by = SY, s = SC, wv = Math.sin(now * 5 + i) * 0.25 * s; ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = Math.max(1, 0.08 * s); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by - 2.6 * s); ctx.stroke();
      ctx.fillStyle = R.cars[(i / 5) % R.cars.length | 0].col; ctx.beginPath(); ctx.moveTo(bx, by - 2.6 * s); ctx.lineTo(bx + 1.5 * s, by - 2.2 * s + wv); ctx.lineTo(bx, by - 1.8 * s); ctx.fill();
    }
  }
  // everything standing on the sand, sorted far to near: the barrier, its monuments, the posts, the banner, the chariots
  const it = A.items; let ni = 0;
  const add = (z, kd, idx) => { if (z > -8 && z < 340 && ni < it.length) { const o = it[ni++]; o.z = z; o.k = kd; o.i = idx; } };
  const ns = A.ns, nt = A.nt, rI = T.rIn;
  for (let i = 0; i < n; i++) {
    const turn = (i >= ns && i < ns + nt) || i >= 2 * ns + nt, mx = (A.ix[i] + A.ix[i + 1]) / 2, mz = (A.iz[i] + A.iz[i + 1]) / 2;
    let vis;
    if (!turn) vis = i < ns ? CAM.z < -rI : CAM.z > rI;
    else { const ccx = i < ns + nt ? T.Ls / 2 : -T.Ls / 2; vis = (CAM.x - mx) * (mx - ccx) + (CAM.z - mz) * mz > 0; }
    if (vis) add(depth(mx, mz), 0, i);
    if (i < ns) add(depth(mx, 0), 1, i);
  }
  add(depth(T.Ls / 2 + rI * 0.45, 0), 2, 0); add(depth(-T.Ls / 2 - rI * 0.45, 0), 2, 1);
  for (let i = 0; i < A.mons.length; i++) add(depth(A.mons[i].x, A.mons[i].z) - 1.2, 3, i);
  for (let i = 0; i < R.cars.length; i++) { const c = R.cars[i]; trackAt(T, sOf(T, c.p), c.d); c.wx = TP.x; c.wz = TP.z; add(depth(TP.x, TP.z), 4, i); if (c.me) { CAM.mz = depth(TP.x, TP.z); CAM.mx = (TP.x - CAM.x) * CAM.s - (TP.z - CAM.z) * CAM.c; } }
  add(depth((L[0] + L[2]) / 2, (L[1] + L[3]) / 2), 5, 0);
  for (let i = 0; i < R.loose.length; i++) { const o = R.loose[i]; if (o.team) { trackAt(T, sOf(T, o.p), o.d); o.wx = TP.x; o.wz = TP.z; } add(depth(o.wx, o.wz), 6, i); }
  const srt = A.srt; srt.length = ni; for (let i = 0; i < ni; i++) srt[i] = it[i];
  srt.sort((p, q) => q.z - p.z);
  for (let q = 0; q < ni; q++) {
    const o = srt[q], i = o.i;
    if (o.k === 0) {                        // a stretch of the barrier's wall: marble, a key line, a red band along its foot (flat shapes, a hair long at both ends)
      const j = i + 1, e = Math.max(0.01, 1.5 * Math.max(o.z, 2) / F) / (Math.hypot(A.ix[j] - A.ix[i], A.iz[j] - A.iz[i]) || 1), xa = A.ix[i] - (A.ix[j] - A.ix[i]) * e, za = A.iz[i] - (A.iz[j] - A.iz[i]) * e, xb = A.ix[j] + (A.ix[j] - A.ix[i]) * e, zb = A.iz[j] + (A.iz[j] - A.iz[i]) * e;
      const g = e * 0.8, xc = xa - (A.ix[j] - A.ix[i]) * g, zc2 = za - (A.iz[j] - A.iz[i]) * g, xd = xb + (A.ix[j] - A.ix[i]) * g, zd = zb + (A.iz[j] - A.iz[i]) * g;
      band(xa, za, xb, zb, HS * 0.4, HS, A.spCol); band(xc, zc2, xd, zd, 0, HS * 0.44, A.spRed); if (o.z < 110) band(xc, zc2, xd, zd, HS * 0.5, HS * 0.58, A.spKey);
    }
    else if (o.k === 1) { const e = Math.max(0.01, 1.5 * Math.max(o.z, 2) / F), xa = A.ix[i] - Math.sign(A.ix[i + 1] - A.ix[i]) * e, xb = A.ix[i + 1] + Math.sign(A.ix[i + 1] - A.ix[i]) * e; q4(xa, HS, -rI, xb, HS, -rI, xb, HS, rI, xa, HS, rI); poly3(Q, 4, A.spTop); }
    else if (o.k === 2) { const i0 = i ? 2 * ns + nt : ns; for (let j = 0; j <= nt; j++) { Q[j * 3] = A.ix[i0 + j]; Q[j * 3 + 1] = HS; Q[j * 3 + 2] = A.iz[i0 + j]; } poly3(Q, nt + 1, A.spTop); }
    else if (o.k === 3) drawMon(A.mons[i], R, now);
    else if (o.k === 4) drawRig(R.cars[i], R);
    else if (o.k === 6) { const lo = R.loose[i]; if (lo.team) drawRig(lo, R); else drawWheel(lo); }
    else {                                 // two tall poles with pennants mark the line
      for (const e of [0, 2]) if (P3(L[e], 0, L[e + 1])) { const x = SX, y = SY, s2 = SC, hg = 7.5 * s2, wv = Math.sin(now * 5 + e) * 0.3 * s2; ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(1.5, 0.2 * s2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - hg); ctx.stroke();
        ctx.fillStyle = '#8f1d1a'; ctx.beginPath(); ctx.moveTo(x, y - hg); ctx.lineTo(x + (e ? -2.6 : 2.6) * s2, y - hg + 0.6 * s2 + wv); ctx.lineTo(x, y - hg + 1.3 * s2); ctx.fill(); ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(x, y - hg, Math.max(1.5, 0.28 * s2), 0, 6.2832); ctx.fill(); }
    }
  }
  // dust and sparks
  for (const p of R.parts) {
    if (!P3(p.x, p.y, p.z)) continue; const u = p.t / p.life;
    if (p.k === 2) { if (SC > 110) continue; const s = Math.min(46 * k, Math.max(2, p.s0 * SC)); ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1; ctx.fillStyle = p.col; ctx.save(); ctx.translate(SX, SY); ctx.rotate(p.r + p.vr * p.t); ctx.fillRect(-s / 2, -s * 0.14, s, s * 0.28); ctx.restore(); }     // a plank, spinning
    else if (p.k) { ctx.globalAlpha = 1 - u; ctx.fillStyle = p.col; const s = Math.max(1.5, p.s0 * SC); ctx.fillRect(SX - s / 2, SY - s / 2, s, s); }
    else { ctx.globalAlpha = p.a * (1 - u); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(SX, SY, Math.min(52 * k, lerp(p.s0, p.s1, u) * SC), 0, 6.2832); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  if (R.floats.length) {                     // what each blow cost, floating up from the chariot that took it
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(26,13,6,.8)';
    for (const f of R.floats) { if (!P3(f.x, f.y + f.t * 1.8, f.z)) continue; const fs = clamp(SC * 0.75, 15, 30) * k * (f.t < 0.1 ? 1.5 - 5 * f.t : 1); ctx.globalAlpha = f.t > 0.7 ? (1 - f.t) / 0.3 : 1; ctx.font = `${Math.round(fs)}px ${GK}`; ctx.lineWidth = fs * 0.16; ctx.strokeText(f.text, SX, SY); ctx.fillStyle = f.col; ctx.fillText(f.text, SX, SY); }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawWheel(o) {                      // a wheel that has come off, bowling away across the sand
  if (!P3(o.wx, o.y, o.wz)) return; const r = 0.5 * SC; if (r < 1 || SX < -40 || SX > W + 40) return;
  ctx.globalAlpha = o.t > 2.4 ? Math.max(0, (3 - o.t) / 0.6) : 1; ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1, 0.1 * SC); ctx.beginPath(); ctx.ellipse(SX, SY, r * (0.35 + 0.65 * Math.abs(Math.cos(o.face))), r, 0, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = '#b08d57'; ctx.lineWidth = Math.max(0.7, 0.05 * SC); ctx.beginPath(); for (let j = 0; j < 2; j++) { const a = o.spin + j * 1.5708, cx = Math.cos(a) * r * (0.35 + 0.65 * Math.abs(Math.cos(o.face))), cy = Math.sin(a) * r; ctx.moveTo(SX - cx, SY - cy); ctx.lineTo(SX + cx, SY + cy); } ctx.stroke(); ctx.globalAlpha = 1;
}
function planks(R, x, y, z, n, cols) { for (let i = 0; i < n && R.parts.length < 230; i++) R.parts.push({ k: 2, x: x + (Math.random() - 0.5), y: y + Math.random() * 0.6, z: z + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 9, vy: 2.5 + Math.random() * 6, vz: (Math.random() - 0.5) * 9, t: 0, life: 0.7 + Math.random() * 0.7, s0: 0.3 + Math.random() * 0.45, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 16, col: cols[(Math.random() * cols.length) | 0] }); }
function float(R, c, text, col) { if (c.wx != null) R.floats.push({ x: c.wx, y: 2.7, z: c.wz, text, col, t: 0 }); }
function breakUp(R, c) {                     // a chariot comes apart: planks, dust, a wheel bowling off, and the team running free
  if (c.wx == null) return;
  planks(R, c.wx, 0.8, c.wz, 26, ['#6b4a2a', '#5a3d22', c.col, c.colD || c.col, '#8a6a3a']); dust(R, c.wx, c.wz, 16, true); sparks(R, c.wx, 0.8, c.wz, 14);
  const T = R.T, th = trackAt(T, sOf(T, c.p), c.d).th, side = c.dSide || (c.d > 0 ? -1 : 1), sp = Math.max(6, c.v * 0.7);
  R.loose.push({ wx: c.wx, wz: c.wz, y: 0.5, vx: Math.cos(th) * sp + Math.sin(th) * side * 3, vz: Math.sin(th) * sp - Math.cos(th) * side * 3, vy: 5, spin: 0, face: Math.random() * 3, t: 0 });
  R.loose.push({ team: 1, p: c.p + 0.6, d: c.d, dT: clamp(c.d - side * 2.5, T.dMin + 1.5, T.dMax - 1.5), v: Math.max(c.v, 10), vd: 0, coats: c.coats, cD: c.cD, cL: c.cL, col: c.col, colD: c.colD, col2: c.col2, gal: c.gal, wheel: 0, st: 'run', whipT: 9, b: 0, auto: 0, u: 0, slide: 0, tip: 0, ghost: 0, str: 1, strMax: 1, hurtT: 9, rm: 0, name: '', t: 0 });
}
function drawMon(m, R, now) {               // what stands on the barrier: columns, tripods, statues, altars, and the turning posts
  if (!P3(m.x, m.y, m.z)) return; const s = SC, x = SX, y = SY; if (x < -90 || x > W + 90 || s < 0.9) return;
  const mar = R.V.wall, dk = shade(mar, 0.74), brz = '#b08d57', brd = '#7a5f36';
  const col = (h, w) => { ctx.fillStyle = mar; ctx.fillRect(x - w * 0.7 * s, y - 0.18 * s, w * 1.4 * s, 0.18 * s); ctx.beginPath(); ctx.moveTo(x - w / 2 * s, y - 0.18 * s); ctx.lineTo(x - w * 0.42 * s, y - h * s); ctx.lineTo(x + w * 0.42 * s, y - h * s); ctx.lineTo(x + w / 2 * s, y - 0.18 * s); ctx.fill();
    ctx.fillStyle = dk; ctx.fillRect(x + w * 0.12 * s, y - h * s, w * 0.3 * s, (h - 0.18) * s); ctx.fillStyle = mar; ctx.fillRect(x - w * 0.72 * s, y - (h + 0.22) * s, w * 1.44 * s, 0.24 * s); };
  const k2 = m.kind;
  if (k2 === 'col') { col(3.6, 0.6); ctx.fillStyle = brz; ctx.beginPath(); ctx.arc(x, y - 4.15 * s, 0.34 * s, 0, 6.2832); ctx.fill(); }
  else if (k2 === 'statue') {
    col(2.2, 0.8); const b = y - 2.4 * s; ctx.fillStyle = brz; ctx.fillRect(x - 0.22 * s, b - 1.25 * s, 0.44 * s, 1.25 * s); ctx.beginPath(); ctx.arc(x, b - 1.45 * s, 0.2 * s, 0, 6.2832); ctx.fill();
    ctx.fillStyle = brd; ctx.beginPath(); ctx.moveTo(x - 0.2 * s, b - 1.1 * s); ctx.lineTo(x - 0.95 * s, b - 1.7 * s); ctx.lineTo(x - 0.3 * s, b - 0.6 * s); ctx.moveTo(x + 0.2 * s, b - 1.1 * s); ctx.lineTo(x + 0.95 * s, b - 1.7 * s); ctx.lineTo(x + 0.3 * s, b - 0.6 * s); ctx.fill();   // Nike's wings
    ctx.strokeStyle = brz; ctx.lineWidth = Math.max(1, 0.1 * s); ctx.beginPath(); ctx.moveTo(x + 0.18 * s, b - 1.15 * s); ctx.lineTo(x + 0.5 * s, b - 1.85 * s); ctx.stroke();
  } else if (k2 === 'tripod') {
    ctx.strokeStyle = brz; ctx.lineWidth = Math.max(1, 0.09 * s); ctx.beginPath(); for (const o of [-0.45, 0, 0.45]) { ctx.moveTo(x + o * s, y); ctx.lineTo(x + o * 0.75 * s, y - 1.35 * s); } ctx.stroke();
    ctx.fillStyle = brz; ctx.beginPath(); ctx.ellipse(x, y - 1.4 * s, 0.55 * s, 0.3 * s, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = brd; ctx.fillRect(x - 0.58 * s, y - 1.46 * s, 1.16 * s, 0.1 * s);
  } else if (k2 === 'altar') {
    ctx.fillStyle = mar; ctx.fillRect(x - 0.6 * s, y - 0.95 * s, 1.2 * s, 0.95 * s); ctx.fillStyle = dk; ctx.fillRect(x + 0.2 * s, y - 0.95 * s, 0.4 * s, 0.95 * s); ctx.fillStyle = mar; ctx.fillRect(x - 0.7 * s, y - 1.08 * s, 1.4 * s, 0.14 * s);
    const fl = 0.55 + 0.12 * Math.sin(now * 11 + m.x); ctx.fillStyle = 'rgba(255,150,40,.9)'; ctx.beginPath(); ctx.moveTo(x - 0.25 * s, y - 1.08 * s); ctx.quadraticCurveTo(x - 0.1 * s, y - (1.08 + fl) * s, x + Math.sin(now * 7) * 0.08 * s, y - (1.15 + fl * 1.4) * s); ctx.quadraticCurveTo(x + 0.15 * s, y - (1.08 + fl) * s, x + 0.25 * s, y - 1.08 * s); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,140,.9)'; ctx.beginPath(); ctx.ellipse(x, y - 1.22 * s, 0.1 * s, 0.2 * s, 0, 0, 6.2832); ctx.fill();
  } else if (k2 === 'obel') {
    ctx.fillStyle = '#c9a56a'; ctx.beginPath(); ctx.moveTo(x - 0.4 * s, y); ctx.lineTo(x - 0.24 * s, y - 5 * s); ctx.lineTo(x, y - 5.5 * s); ctx.lineTo(x + 0.24 * s, y - 5 * s); ctx.lineTo(x + 0.4 * s, y); ctx.fill(); ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.moveTo(x - 0.24 * s, y - 5 * s); ctx.lineTo(x, y - 5.5 * s); ctx.lineTo(x + 0.24 * s, y - 5 * s); ctx.fill();
  } else {                                 // the turning post: a tall pillar with a red band and a bronze top
    for (const o of [-0.95, 0.95, 0]) { const h = o ? 3.3 : 5.4, w = o ? 0.5 : 0.8, xx = x + o * s; ctx.fillStyle = mar; ctx.beginPath(); ctx.moveTo(xx - w / 2 * s, y); ctx.lineTo(xx - w * 0.3 * s, y - h * s); ctx.lineTo(xx + w * 0.3 * s, y - h * s); ctx.lineTo(xx + w / 2 * s, y); ctx.fill();
      ctx.fillStyle = dk; ctx.beginPath(); ctx.moveTo(xx + w * 0.12 * s, y); ctx.lineTo(xx + w * 0.08 * s, y - h * s); ctx.lineTo(xx + w * 0.3 * s, y - h * s); ctx.lineTo(xx + w / 2 * s, y); ctx.fill();
      ctx.fillStyle = '#a23b2a'; ctx.fillRect(xx - w * 0.42 * s, y - h * 0.62 * s, w * 0.84 * s, 0.3 * s); ctx.fillStyle = brz; ctx.beginPath(); ctx.ellipse(xx, y - (h + 0.25) * s, w * 0.36 * s, 0.42 * s, 0, 0, 6.2832); ctx.fill(); }
  }
}

// ---------- a chariot and its four horses, built from simple solid shapes so it reads from any side ----------
function drawRig(c, R) {
  const px = c.wx, pz = c.wz, T = R.T, out = c.st === 'out', wk = c.st === 'wreck' ? c.wt : out ? c.outT : 0, z0 = depth(px, pz);
  if (z0 < -5 || z0 > 330 || (out && c.outT > 4.2)) return;
  const stg = out ? 2 : c.str >= c.strMax * 0.67 ? 0 : c.str >= c.strMax * 0.34 ? 1 : 2, ds = c.dSide || 1, fl = c.hurtT < 0.16 ? 1 - c.hurtT / 0.16 : 0;     // how battered it is (0 sound, 1 damaged, 2 failing), which side took it, and the flash of a fresh blow
  const th = trackAt(T, sOf(T, c.p), c.d).th + Math.atan2(c.vd, Math.max(6, c.v)) * 0.9 + (wk ? Math.min(1.2, wk * 2.5) * (c.d > 0 ? -1 : 1) : 0);
  const ct = Math.cos(th), st = Math.sin(th), far = z0 > 80, mid = z0 > 34, mine = c.me;
  if (!c.cD) { c.cD = c.coats.map(x => shade(x, 0.62)); c.cL = c.coats.map(x => shade(x, 1.13)); c.colD = shade(c.col, 0.78); }
  const P = (f, u, r) => P3(px + f * ct + r * st, u, pz + f * st - r * ct);
  const seg = (f1, u1, r1, f2, u2, r2, w, col) => { if (!P(f1, u1, r1)) return; const x1 = SX, y1 = SY, s1 = SC; if (!P(f2, u2, r2)) return; ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.7, w * (s1 + SC) * 0.5); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(SX, SY); ctx.stroke(); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  let near = 1;                              // a rival between the camera and your own team turns ghostly so it never hides you; one off to the side stays solid, so you can see it coming
  if (!mine && R.phase !== 'home') { near = clamp((z0 - 1.6) / 3, 0.1, 1); if (z0 < CAM.mz - 0.8) near = Math.min(near, Math.max(0.07, clamp((Math.abs((px - CAM.x) * CAM.s - (pz - CAM.z) * CAM.c - CAM.mx) - 1.3) / 2.2, 0, 1))); }
  const al = near * (c.ghost > 0 && c.ghost < 90 && Math.sin(c.ghost * 28) > 0 ? 0.45 : 1) * (out ? clamp(4.2 - c.outT, 0, 1) : c.team ? clamp(4.2 - c.t, 0, 1) : 1);
  ctx.globalAlpha = al;
  let qi = 0; for (const fr of RIGSH) { Q[qi++] = px + fr[0] * ct + fr[1] * st; Q[qi++] = 0.02; Q[qi++] = pz + fr[0] * st - fr[1] * ct; }
  poly3(Q, 6, 'rgba(40,25,10,.3)');
  const sf = clamp(c.v / 13, 0.1, 1), reined = c.b > 0.3 || c.auto > 0, up = reined ? 0.13 : 0, rearing = c.st === 'grid' && c.jump && R.phase === 'race' ? Math.sin(Math.min(1, R.t / 0.9) * Math.PI) : 0;
  const horse = i => {
    const hr = (i - 1.5) * 0.86, coat = c.coats[i], dk = c.cD[i], g2 = (c.gal + i * 0.13) * 6.2832, bob = Math.sin(g2) * 0.06 * sf + rearing * 0.5, nb = Math.sin(g2 + 0.9) * 0.1 * sf + up + rearing * 0.9;
    if (far) { seg(1.12, 1.32, hr, 2.45, 1.4, hr, 0.62, coat); seg(2.45, 1.5, hr, 2.95, 2.0, hr, 0.3, coat); return; }
    for (const sd of mid ? [0] : [-0.14, 0.14]) {
      const a1 = g2 + (sd > 0 ? 0.5 : 0), a2 = g2 + 2.4 + (sd > 0 ? 0.5 : 0);
      seg(1.25, 1.0 + bob * 0.3, hr + sd, 1.15 + Math.sin(a1) * 0.6 * sf, 0.06 + Math.max(0, Math.cos(a1)) * 0.3 * sf, hr + sd, 0.13, dk);
      seg(2.3, 1.0 + bob, hr + sd, 2.4 + Math.sin(a2) * 0.65 * sf + rearing * 0.3, 0.06 + Math.max(0, Math.cos(a2)) * 0.32 * sf + rearing * 0.8, hr + sd, 0.13, dk);
    }
    seg(1.08, 1.42 + bob * 0.3, hr, 0.82 - 0.22 * sf, 1.08 + 0.26 * sf, hr + Math.sin(g2 * 0.5) * 0.08, 0.13, dk);
    seg(1.12, 1.3 + bob * 0.3, hr, 2.42, 1.37 + bob, hr, 0.62, coat);
    if (!mid) seg(1.3, 1.5 + bob * 0.4, hr, 2.3, 1.56 + bob, hr, 0.2, c.cL[i]);
    seg(2.42, 1.48 + bob, hr, 2.94, 1.98 + nb, hr, 0.34, coat);
    if (!mid) seg(2.4, 1.68 + bob, hr, 2.86, 2.12 + nb, hr, 0.1, dk);
    seg(2.94, 1.98 + nb, hr, 3.3, 1.78 + nb, hr, 0.24, coat);
    if (!mid) seg(1.9, 1.63 + bob * 0.7, hr - 0.2, 1.9, 1.63 + bob * 0.7, hr + 0.2, 0.2, c.col);          // a cloth in the team colour
  };
  const tA = wk ? Math.min(3.0, wk * 7) * (c.d > 0 ? -1 : 1) : -(c.slide * 0.09 + c.tip * 0.6) + (stg === 2 ? ds * 0.16 + Math.sin(c.wheel * 1.3) * 0.045 : stg === 1 ? ds * 0.09 + Math.sin(c.wheel * 1.1) * 0.015 : 0) + (c.rm === 1 ? -c.rmS * 0.13 * Math.min(1, c.rmT / 0.25) : c.rm === 2 ? c.rmS * 0.2 : 0);   // tipping in a slide; a damaged chariot sags to its hurt side and a failing one shudders; a rough driver leans away to wind up, then into the swing
  const tc = Math.cos(tA), ts = Math.sin(tA), hop = wk ? Math.sin(Math.min(1, wk * 1.5) * Math.PI) * (out ? 1.3 : 1.0) : 0;
  const B = (f, u, r) => P(f, 0.5 + (u - 0.5) * tc - r * ts + hop, (u - 0.5) * ts + r * tc);       // the car itself can tip
  const segB = (f1, u1, r1, f2, u2, r2, w, col) => { if (!B(f1, u1, r1)) return; const x1 = SX, y1 = SY, s1 = SC; if (!B(f2, u2, r2)) return; ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.7, w * (s1 + SC) * 0.5); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(SX, SY); ctx.stroke(); };
  const quadB = (a, b2, c2, d2, col) => { if (!B(a[0], a[1], a[2])) return; ctx.beginPath(); ctx.moveTo(SX, SY); if (!B(b2[0], b2[1], b2[2])) return; ctx.lineTo(SX, SY); if (!B(c2[0], c2[1], c2[2])) return; ctx.lineTo(SX, SY); if (!B(d2[0], d2[1], d2[2])) return; ctx.lineTo(SX, SY); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
  const facing = ct * CAM.c + st * CAM.s;
  const car = () => {
    const wood = '#6b4a2a', brz = '#b08d57', skin = '#d9a066', lean = -c.u * 0.17, pull = reined ? 0.14 : 0, wt = c.whipT;
    if (far) { segB(0, 0.95, -0.55, 0, 0.95, 0.55, 0.85, c.col); segB(0.1, 1.2, 0, 0.15, 2.0, 0, 0.42, '#f4eddc'); return; }
    for (const sd of [-1, 1]) {                    // wheels, four spokes each. A damaged one wobbles and has lost a spoke; a broken chariot has lost the wheel
      if (out && sd === ds) continue;
      const wx = sd * 0.98, wob = stg && sd === ds && !out ? (stg === 2 ? 0.3 : 0.11) * Math.sin(c.wheel * 0.8) : 0; ctx.beginPath(); let ok = true;
      for (let j = 0; j <= 10; j++) { const a = j / 10 * 6.2832; if (!B(Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5, wx + wob * Math.sin(a))) { ok = false; break; } if (j) ctx.lineTo(SX, SY); else ctx.moveTo(SX, SY); }
      if (ok) { ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1, 0.1 * SC); ctx.stroke(); }
      if (!mid) for (let j = 0; j < (wob && stg === 2 ? 1 : 2); j++) { const a = c.wheel + j * 1.5708, cs2 = Math.cos(a) * 0.46, sn = Math.sin(a) * 0.46; segB(cs2, 0.5 + sn, wx + wob * sn * 2, -cs2, 0.5 - sn, wx - wob * sn * 2, 0.05, brz); }
    }
    segB(0, 0.5, -0.98, 0, 0.5, 0.98, 0.1, wood);
    segB(0.55, 0.62, 0, 2.42, 1.08, 0, 0.07, wood);
    quadB([-0.42, 0.58, -0.62], [0.58, 0.58, -0.5], [0.58, 0.58, 0.5], [-0.42, 0.58, 0.62], '#5a3d22');
    const pc = fl ? mix(c.col, '#ffffff', fl * 0.8) : c.col;
    for (let j = 0; j < 4; j++) {                  // the rail in four panels. A battered chariot has panels snapped off short on the side that took the blows
      const a = RAIL[j], b2 = RAIL[j + 1], hurtSide = (j < 2) === (ds < 0), snap = stg === 2 ? hurtSide : stg === 1 ? j === (ds < 0 ? 0 : 3) : false;
      const ha = snap ? 0.58 + (a[2] - 0.58) * (j & 1 ? 0.7 : 0.4) : a[2], hb = snap ? 0.58 + (b2[2] - 0.58) * (j & 1 ? 0.35 : 0.75) : b2[2];
      quadB([a[0], 0.58, a[1]], [b2[0], 0.58, b2[1]], [b2[0], hb, b2[1]], [a[0], ha, a[1]], fl ? pc : snap ? (j === 1 || j === 2 ? '#8a6a3e' : '#6e5230') : j === 1 || j === 2 ? c.col : c.colD);      // a snapped panel shows bare wood
      if (!snap) segB(a[0], a[2], a[1], b2[0], b2[2], b2[1], 0.06, c.col2);
      else if (!mid) { segB(a[0], ha, a[1], a[0] + 0.03, ha + 0.24, a[1] * 1.04, 0.035, '#8a6a3a'); segB(b2[0], hb, b2[1], b2[0] - 0.02, hb + 0.17, b2[1] * 1.03, 0.03, '#6b4a2a'); }     // splinters
      if (stg && !snap && !mid && (j === 1 || j === 2)) {     // cracks across the panels that are still whole
        const t1 = j === 1 ? 0.35 : 0.6, x = t => lerp(a[0], b2[0], t) - 0.015, r = t => lerp(a[1], b2[1], t) * 0.985, top = lerp(a[2], b2[2], t1);
        segB(x(t1), top, r(t1), x(t1 + 0.14), top - 0.25, r(t1 + 0.14), 0.03, 'rgba(28,14,8,.85)'); segB(x(t1 + 0.14), top - 0.25, r(t1 + 0.14), x(t1 + 0.02), top - 0.48, r(t1 + 0.02), 0.03, 'rgba(28,14,8,.85)');
      }
    }
    if (stg === 2 && !out && !mid) segB(-0.35, 0.56, ds * 0.45, -1.75, 0.07 + 0.06 * Math.abs(Math.sin(c.wheel * 1.7)), ds * 0.8, 0.09, '#7a5a36');     // a failing chariot drags a broken plank
    if (out && wk > 0.4) {                         // the driver thrown clear, down on the sand
      const sd2 = -ds; seg(-1.7, 0.17, sd2 * 1.5, -0.7, 0.2, sd2 * 1.9, 0.36, '#e9e0cc'); seg(-1.25, 0.2, sd2 * 1.6, -0.9, 0.22, sd2 * 2.0, 0.1, c.col);
      if (P(-0.5, 0.22, sd2 * 2.0)) { ctx.fillStyle = '#2a1b12'; ctx.beginPath(); ctx.arc(SX, SY, Math.max(1, 0.14 * SC), 0, 6.2832); ctx.fill(); }
      return;
    }
    let rx = 0.5 - pull * 1.6, ry = 1.5 + pull, rr = 0.17;
    if (wt < 0.3) { const u = wt / 0.3, k1 = u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7; rx = lerp(rx, 0.75, k1); ry = lerp(ry, 2.25, k1); rr = lerp(rr, 0.3, k1); }
    if (!mid) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.75; for (const i of [0, 1, 2, 3]) seg(0.5 - pull * 1.6, 1.5 + pull, i < 2 ? -0.17 : 0.17, 2.9, 1.92 + up, (i - 1.5) * 0.86, 0.025, '#3a2a1a'); ctx.globalAlpha = ga; }
    // the driver, in a long white chiton with a sash in the team colour
    segB(0.06, 0.62, lean * 0.2, 0.1 - pull * 0.5, 1.42, lean * 0.6, 0.42, '#e9e0cc');
    segB(0.1 - pull * 0.5, 1.42, lean * 0.6, 0.16 - pull, 1.92, lean, 0.46, '#f4eddc');
    segB(0.0 - pull * 0.6, 1.5, lean * 0.7 - 0.2, 0.04 - pull * 0.9, 1.9, lean + 0.2, 0.1, c.col);
    const hx = 0.2 - pull, hy = 2.17, head = (df, col, rad) => { if (B(hx + df, hy + (df ? 0.04 : 0), lean)) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(SX, SY, Math.max(1, rad * SC), 0, 6.2832); ctx.fill(); } };
    if (facing >= 0) { head(0, skin, 0.145); head(-0.05, '#2a1b12', 0.135); } else { head(-0.05, '#2a1b12', 0.135); head(0, skin, 0.145); }
    if (c.boss || mine) segB(hx + 0.02, hy + 0.14, lean, hx - 0.26, hy + 0.2, lean, 0.09, c.col2);                 // a crest
    segB(0.14 - pull, 1.86, lean - 0.24, 0.5 - pull * 1.6, 1.5 + pull, -0.17, 0.11, skin);
    segB(0.14 - pull, 1.86, lean + 0.24, rx, ry, rr, 0.11, skin);
    if (wt < 0.3 && B(rx, ry, rr)) {               // the whip, and the crack over the horses' backs
      const x1 = SX, y1 = SY, u = wt / 0.3; if (P(1.3 + u * 0.8, 3.0 - u * 1.2, 0.3)) { const x2 = SX, y2 = SY; if (P(2.2 + u * 0.9, 2.75 - u * 0.75, 0.1)) { ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1, 0.035 * SC); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x2, y2, SX, SY); ctx.stroke();
        if (wt > 0.02 && wt < 0.13) { const s = SC * (c.lastQ === 2 ? 0.55 : 0.32); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c.lastQ === 2 ? 'rgba(255,225,130,.95)' : 'rgba(255,255,255,.8)'; ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = j * 0.7854, rd = j & 1 ? s * 0.35 : s; ctx.lineTo(SX + Math.cos(a) * rd, SY + Math.sin(a) * rd); } ctx.fill(); ctx.restore(); } } }
    }
  };
  const horses = () => { const rd = st * CAM.c - ct * CAM.s; if (rd > 0) for (let i = 3; i >= 0; i--) horse(i); else for (let i = 0; i < 4; i++) horse(i); if (!far) seg(2.42, 1.5, -1.4, 2.42, 1.5, 1.4, 0.07, '#6b4a2a'); };
  if (c.team) horses(); else if (out) car(); else if (facing >= 0) { horses(); car(); } else { car(); horses(); }
  ctx.globalAlpha = 1;
  if (!mine && !c.team && !out && !far && R.phase !== 'home' && z0 > 3 && P(0.2, 3.0, 0) && SX > 6 && SX < W - 6) {      // who is that?
    const fs = clamp(SC * 0.42, 9, 13) * k; ctx.font = `800 ${fs}px Nunito, sans-serif`; ctx.textAlign = 'center';
    const tw = ctx.measureText(c.name).width + fs * 1.4; SX = clamp(SX, tw / 2 + 4, W - tw / 2 - 4); ctx.fillStyle = 'rgba(10,16,28,.55)'; rrect(SX - tw / 2, SY - fs * 1.05, tw, fs * 1.4, fs * 0.5); ctx.fill();
    ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(SX - tw / 2 + fs * 0.6, SY - fs * 0.35, fs * 0.3, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(c.name, SX + fs * 0.35, SY);
    if (c.str < c.strMax) {                        // how much more its chariot can take, once it has taken something
      const bw = tw - fs * 0.7, f = c.str / c.strMax, by = SY + fs * 0.5; ctx.fillStyle = 'rgba(10,16,28,.6)'; rrect(SX - bw / 2, by, bw, fs * 0.34, fs * 0.17); ctx.fill();
      ctx.fillStyle = f > 0.66 ? '#9fe0a8' : f > 0.33 ? '#f2c14e' : '#ff5a3c'; rrect(SX - bw / 2, by, Math.max(fs * 0.34, bw * f), fs * 0.34, fs * 0.17); ctx.fill();
    }
    if (c.rm === 1 || c.rm === 2) {                // winding up to ram you: a red mark over its name
      const pu = 1 + 0.25 * Math.sin(performance.now() / 45), rx = SX, ry = SY - fs * 2.0; ctx.fillStyle = '#e0301e'; ctx.beginPath(); ctx.arc(rx, ry, fs * 0.72 * pu, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `900 ${fs * 1.15}px Nunito, sans-serif`; ctx.fillText('!', rx, ry + fs * 0.4);
    }
  }
}
const RIGSH = [[-0.7, -1.15], [-0.7, 1.15], [1.2, 1.75], [3.5, 1.5], [3.5, -1.5], [1.2, -1.75]];
const RAIL = [[-0.05, -0.64, 1.0], [0.42, -0.52, 1.22], [0.64, 0, 1.32], [0.42, 0.52, 1.22], [-0.05, 0.64, 1.0]];
function dust(R, x, z, n, big) { for (let i = 0; i < n && R.parts.length < 150; i++) R.parts.push({ k: 0, x: x + (Math.random() - 0.5) * 1.6, y: 0.2, z: z + (Math.random() - 0.5) * 1.6, vx: (Math.random() - 0.5) * 2, vy: 0.6 + Math.random() * 1.4, vz: (Math.random() - 0.5) * 2, t: 0, life: 0.6 + Math.random() * 0.6, s0: 0.3, s1: big ? 1.7 : 1.0, col: R.V.sand[2], a: big ? 0.36 : 0.22 }); }
function sparks(R, x, y, z, n) { for (let i = 0; i < n && R.parts.length < 170; i++) R.parts.push({ k: 1, x, y, z, vx: (Math.random() - 0.5) * 7, vy: 1 + Math.random() * 5, vz: (Math.random() - 0.5) * 7, t: 0, life: 0.25 + Math.random() * 0.3, s0: 0.07, col: Math.random() < 0.5 ? '#ffe9a0' : '#ffb03a' }); }
