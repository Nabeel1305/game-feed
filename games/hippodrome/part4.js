
// ---------- the view: a camera close behind your own chariot ----------
const CAM = { x: 0, z: 0, h: 3.3, th: 0, c: 1, s: 0, F: 400, hor: 300, roll: 0, back: 5.6, dl: 0, kick: 0 };
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
function tex4(img, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz) {     // paint a picture onto a wall: A top-left, B top-right, C bottom-left, D bottom-right
  if (!P3(ax, ay, az) || SC * 4 > CAM.F) return; const x0 = SX, y0 = SY, s0 = SC; if (!P3(bx, by, bz) || SC * 4 > CAM.F) return; const x1 = SX, y1 = SY, rt = s0 / SC;
  if (rt > 3 || rt < 0.33 || !P3(dx, dy, dz)) return; const x3 = SX, y3 = SY; if (!P3(cx, cy, cz)) return;
  const w = img.width, h = img.height; ctx.save();
  if (rt > 1.5 || rt < 0.67) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x3, y3); ctx.lineTo(SX, SY); ctx.closePath(); ctx.clip(); }   // strong perspective: keep the picture inside its own wall
  ctx.transform((x1 - x0) / w, (y1 - y0) / w, (SX - x0) / h, (SY - y0) / h, x0, y0); ctx.drawImage(img, 0, 0); ctx.restore();
}
function camFollow(R, dt, snap) {
  const T = R.T, me = R.me, s = sOf(T, me.p);
  let dth = trackAt(T, s + 5 + me.v * 0.12, 0).th - CAM.th; dth -= Math.round(dth / 6.2832) * 6.2832;      // look a little ahead, into the turn
  CAM.th += snap ? dth : dth * Math.min(1, dt * 7);
  CAM.dl += (me.d - CAM.dl) * (snap ? 1 : Math.min(1, dt * 5));
  trackAt(T, s, lerp(me.d, CAM.dl, 0.6));
  CAM.back = 5.3 + 0.9 * (me.v / PH.vTop) + CAM.kick * 0.9;
  CAM.c = Math.cos(CAM.th); CAM.s = Math.sin(CAM.th);
  let x = TP.x - CAM.back * CAM.c, z = TP.z - CAM.back * CAM.s;
  // keep the camera inside the arena and off the barrier
  const cx = clamp(x, -T.Ls / 2, T.Ls / 2), dd = Math.hypot(x - cx, z), ro = T.Rc + T.hw - 0.9, ri = T.rIn + 0.9;
  if (dd > ro) { x = cx + (x - cx) * ro / dd; z = z * ro / dd; } else if (dd < ri && dd > 0.01) { x = cx + (x - cx) * ri / dd; z = z * ri / dd; }
  CAM.x = x; CAM.z = z; CAM.h = 3.3; CAM.F = Math.min(W, H * 0.62) * 1.05 * (1 - 0.05 * CAM.kick); CAM.hor = H * 0.36;
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
function crowdTex(seed, cheer) {            // a patch of the stands: rows of spectators on stone steps
  const c = document.createElement('canvas'); c.width = 96; c.height = 64; const g = c.getContext('2d'), r = rng(seed);
  const cols = ['#f1ebdd', '#e7dcc4', '#c96f4a', '#8a3b2a', '#3d6b8c', '#d9b25a', '#7a8f5a', '#b98a6a', '#efe6d2', '#9a5a7a', '#f4efe4'], skin = ['#e0ac69', '#c68642', '#f1c27d', '#8d5524'];
  for (let row = 0; row < 8; row++) {
    const y = row * 8; g.fillStyle = row & 1 ? '#b3a78f' : '#c2b69e'; g.fillRect(0, y, 96, 8); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, y + 7, 96, 1);
    for (let x = (row & 1) * 3; x < 94; x += 6) { const a = r(), b = r(), d = r(), e = r(); if (a < 0.1) continue; const up = cheer && b < 0.65 ? 1 : 0;
      g.fillStyle = cols[(d * cols.length) | 0]; g.fillRect(x, y + 3 - up, 5, 5 + up); g.fillStyle = skin[(e * 4) | 0]; g.fillRect(x + 1, y - up, 3, 3);
      if (up) { g.fillRect(x - 1, y - 2, 1, 4); g.fillRect(x + 5, y - 2, 1, 4); } }
  }
  return c;
}
function wallTex(V) {                       // the marble wall with a painted band and a Greek key
  const c = document.createElement('canvas'); c.width = 80; c.height = 36; const g = c.getContext('2d');
  g.fillStyle = V.wall; g.fillRect(0, 0, 80, 36); g.fillStyle = 'rgba(0,0,0,.07)'; for (let i = 0; i < 3; i++) g.fillRect(0, i * 8 + 7, 80, 1); for (let i = 0; i < 4; i++) g.fillRect(i * 20 + (i & 1) * 6, 0, 1, 16);
  g.fillStyle = '#a23b2a'; g.fillRect(0, 20, 80, 16); g.fillStyle = shade(V.wall, 0.94); g.fillRect(0, 16, 80, 4);
  g.strokeStyle = '#1f3a5f'; g.lineWidth = 1; for (let x = 0; x < 80; x += 10) { g.beginPath(); g.moveTo(x, 19.5); g.lineTo(x + 8, 19.5); g.lineTo(x + 8, 16.5); g.lineTo(x + 3, 16.5); g.lineTo(x + 3, 18); g.lineTo(x + 6, 18); g.stroke(); }
  return c;
}
function stoaTex(V) {                       // the colonnade along the top of the stands, under a tiled roof
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d');
  g.fillStyle = '#4a3a2e'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#b5532f'; g.fillRect(0, 0, 64, 6); g.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 0; x < 64; x += 4) g.fillRect(x, 0, 1, 6);
  g.fillStyle = V.wall; g.fillRect(0, 6, 64, 5); for (let x = 3; x < 64; x += 16) { g.fillRect(x, 11, 5, 21); g.fillRect(x - 1, 11, 7, 2); } g.fillStyle = 'rgba(0,0,0,.15)'; for (let x = 6; x < 64; x += 16) g.fillRect(x, 13, 2, 19);
  return c;
}
let TEX = null;
function buildArena(R) {
  const T = R.T, V = R.V, ns = Math.round(T.Ls / 5), nt = 12, n = 2 * (ns + nt);
  if (!TEX) TEX = { crowd: [crowdTex(7, 0), crowdTex(7, 1)] };
  const F32 = () => new Float32Array(n + 1);
  const A = { n, ns, nt, ix: F32(), iz: F32(), ox: F32(), oz: F32(), tx: F32(), tz: F32(), dz: new Float32Array(n), ord: [], wallCol: [], items: [], srt: [], mons: [], pano: buildPano(V), wall: wallTex(V), stoa: stoaTex(V), spCol: shade(V.wall, 0.9), spTop: shade(V.wall, 1.02), haze: V.sky[2] };
  for (let i = 0; i <= n; i++) {
    const j = i % n, s = j < ns ? j * T.Ls / ns : j < ns + nt ? T.Ls + (j - ns) * T.tl / nt : j < 2 * ns + nt ? T.Ls + T.tl + (j - ns - nt) * T.Ls / ns : 2 * T.Ls + T.tl + (j - 2 * ns - nt) * T.tl / nt;
    trackAt(T, s, -T.hw); A.ix[i] = TP.x; A.iz[i] = TP.z; trackAt(T, s, T.hw); A.ox[i] = TP.x; A.oz[i] = TP.z; trackAt(T, s, T.hw + SD); A.tx[i] = TP.x; A.tz[i] = TP.z;
  }
  const sa = 6.2832 * (1 - V.sun[0]), sxx = Math.cos(sa), szz = Math.sin(sa);
  for (let i = 0; i < n; i++) { const nx = A.ix[i] - A.ox[i], nz = A.iz[i] - A.oz[i], l = Math.hypot(nx, nz) || 1; A.wallCol.push(0.8 + 0.2 * Math.max(0, (nx * sxx + nz * szz) / l)); }
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
  const crowd = TEX.crowd[R.crowd > 0.55 && Math.sin(now * 13) > 0 ? 1 : 0], wc = V.wall;
  for (const i of ord) {
    const j = i + 1, zc = A.dz[i], x1 = A.ox[i], z1 = A.oz[i], x2 = A.ox[j], z2 = A.oz[j], u1 = A.tx[i], w1 = A.tz[i], u2 = A.tx[j], w2 = A.tz[j], top = HT + STOA;
    q4(x1, 0, z1, x2, 0, z2, x2, HW, z2, x1, HW, z1); poly3(Q, 4, shade(wc, A.wallCol[i]));
    q4(x1, HW, z1, x2, HW, z2, u2, HT, w2, u1, HT, w1); poly3(Q, 4, '#b9ad96');
    q4(u1, HT, w1, u2, HT, w2, u2, top, w2, u1, top, w1); poly3(Q, 4, '#5a463a');
    if (zc < 150) { tex4(A.wall, x1, HW, z1, x2, HW, z2, x1, 0, z1, x2, 0, z2); tex4(crowd, u1, HT, w1, u2, HT, w2, x1, HW, z1, x2, HW, z2); tex4(A.stoa, u1, top, w1, u2, top, w2, u1, HT, w1, u2, HT, w2); }
    else if (zc < 260) tex4(crowd, u1, HT, w1, u2, HT, w2, x1, HW, z1, x2, HW, z2);
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
  for (let i = 0; i < R.cars.length; i++) { const c = R.cars[i]; trackAt(T, sOf(T, c.p), c.d); c.wx = TP.x; c.wz = TP.z; add(depth(TP.x, TP.z), 4, i); }
  add(depth((L[0] + L[2]) / 2, (L[1] + L[3]) / 2), 5, 0);
  const srt = A.srt; srt.length = ni; for (let i = 0; i < ni; i++) srt[i] = it[i];
  srt.sort((p, q) => q.z - p.z);
  for (let q = 0; q < ni; q++) {
    const o = srt[q], i = o.i;
    if (o.k === 0) { const j = i + 1; q4(A.ix[i], 0, A.iz[i], A.ix[j], 0, A.iz[j], A.ix[j], HS, A.iz[j], A.ix[i], HS, A.iz[i]); poly3(Q, 4, A.spCol); if (o.z < 90) tex4(A.wall, A.ix[i], HS, A.iz[i], A.ix[j], HS, A.iz[j], A.ix[i], 0, A.iz[i], A.ix[j], 0, A.iz[j]); }
    else if (o.k === 1) { const xa = A.ix[i], xb = A.ix[i + 1]; q4(xa, HS, -rI, xb, HS, -rI, xb, HS, rI, xa, HS, rI); poly3(Q, 4, A.spTop); }
    else if (o.k === 2) { const i0 = i ? 2 * ns + nt : ns; for (let j = 0; j <= nt; j++) { Q[j * 3] = A.ix[i0 + j]; Q[j * 3 + 1] = HS; Q[j * 3 + 2] = A.iz[i0 + j]; } poly3(Q, nt + 1, A.spTop); }
    else if (o.k === 3) drawMon(A.mons[i], R, now);
    else if (o.k === 4) drawRig(R.cars[i], R);
    else {                                 // two tall poles with pennants mark the line
      for (const e of [0, 2]) if (P3(L[e], 0, L[e + 1])) { const x = SX, y = SY, s2 = SC, hg = 7.5 * s2, wv = Math.sin(now * 5 + e) * 0.3 * s2; ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = Math.max(1.5, 0.2 * s2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - hg); ctx.stroke();
        ctx.fillStyle = '#8f1d1a'; ctx.beginPath(); ctx.moveTo(x, y - hg); ctx.lineTo(x + (e ? -2.6 : 2.6) * s2, y - hg + 0.6 * s2 + wv); ctx.lineTo(x, y - hg + 1.3 * s2); ctx.fill(); ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(x, y - hg, Math.max(1.5, 0.28 * s2), 0, 6.2832); ctx.fill(); }
    }
  }
  // dust and sparks
  for (const p of R.parts) {
    if (!P3(p.x, p.y, p.z)) continue; const u = p.t / p.life;
    if (p.k) { ctx.globalAlpha = 1 - u; ctx.fillStyle = p.col; const s = Math.max(1.5, p.s0 * SC); ctx.fillRect(SX - s / 2, SY - s / 2, s, s); }
    else { ctx.globalAlpha = p.a * (1 - u); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(SX, SY, Math.min(52 * k, lerp(p.s0, p.s1, u) * SC), 0, 6.2832); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
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
  const px = c.wx, pz = c.wz, T = R.T, wk = c.st === 'wreck' ? c.wt : 0, z0 = depth(px, pz);
  if (z0 < -5 || z0 > 330) return;
  const th = trackAt(T, sOf(T, c.p), c.d).th + Math.atan2(c.vd, Math.max(6, c.v)) * 0.9 + (wk ? Math.min(1.2, wk * 2.5) * (c.d > 0 ? -1 : 1) : 0);
  const ct = Math.cos(th), st = Math.sin(th), far = z0 > 80, mid = z0 > 34, mine = c.me;
  if (!c.cD) { c.cD = c.coats.map(x => shade(x, 0.62)); c.cL = c.coats.map(x => shade(x, 1.13)); c.colD = shade(c.col, 0.78); }
  const P = (f, u, r) => P3(px + f * ct + r * st, u, pz + f * st - r * ct);
  const seg = (f1, u1, r1, f2, u2, r2, w, col) => { if (!P(f1, u1, r1)) return; const x1 = SX, y1 = SY, s1 = SC; if (!P(f2, u2, r2)) return; ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.7, w * (s1 + SC) * 0.5); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(SX, SY); ctx.stroke(); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const near = mine || R.phase === 'home' ? 1 : clamp((z0 - 1.6) / 3, 0.1, 1);       // a rival right behind you, close to the camera, turns ghostly so it never hides your own team
  ctx.globalAlpha = near * (c.ghost > 0 && c.ghost < 90 && Math.sin(c.ghost * 28) > 0 ? 0.45 : 1);
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
  const tA = wk ? Math.min(3.0, wk * 7) * (c.d > 0 ? -1 : 1) : -(c.slide * 0.09 + c.tip * 0.6), tc = Math.cos(tA), ts = Math.sin(tA), hop = wk ? Math.sin(Math.min(1, wk * 1.5) * Math.PI) * 1.0 : 0;
  const B = (f, u, r) => P(f, 0.5 + (u - 0.5) * tc - r * ts + hop, (u - 0.5) * ts + r * tc);       // the car itself can tip
  const segB = (f1, u1, r1, f2, u2, r2, w, col) => { if (!B(f1, u1, r1)) return; const x1 = SX, y1 = SY, s1 = SC; if (!B(f2, u2, r2)) return; ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.7, w * (s1 + SC) * 0.5); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(SX, SY); ctx.stroke(); };
  const quadB = (a, b2, c2, d2, col) => { if (!B(a[0], a[1], a[2])) return; ctx.beginPath(); ctx.moveTo(SX, SY); if (!B(b2[0], b2[1], b2[2])) return; ctx.lineTo(SX, SY); if (!B(c2[0], c2[1], c2[2])) return; ctx.lineTo(SX, SY); if (!B(d2[0], d2[1], d2[2])) return; ctx.lineTo(SX, SY); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
  const facing = ct * CAM.c + st * CAM.s;
  const car = () => {
    const wood = '#6b4a2a', brz = '#b08d57', skin = '#d9a066', lean = -c.u * 0.17, pull = reined ? 0.14 : 0, wt = c.whipT;
    if (far) { segB(0, 0.95, -0.55, 0, 0.95, 0.55, 0.85, c.col); segB(0.1, 1.2, 0, 0.15, 2.0, 0, 0.42, '#f4eddc'); return; }
    for (const sd of [-1, 1]) {                    // wheels, four spokes each
      const wx = sd * 0.98; ctx.beginPath(); let ok = true;
      for (let j = 0; j <= 10; j++) { const a = j / 10 * 6.2832; if (!B(Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5, wx)) { ok = false; break; } if (j) ctx.lineTo(SX, SY); else ctx.moveTo(SX, SY); }
      if (ok) { ctx.strokeStyle = '#4a3320'; ctx.lineWidth = Math.max(1, 0.1 * SC); ctx.stroke(); }
      if (!mid) for (let j = 0; j < 2; j++) { const a = c.wheel + j * 1.5708, cs2 = Math.cos(a) * 0.46, sn = Math.sin(a) * 0.46; segB(cs2, 0.5 + sn, wx, -cs2, 0.5 - sn, wx, 0.05, brz); }
    }
    segB(0, 0.5, -0.98, 0, 0.5, 0.98, 0.1, wood);
    segB(0.55, 0.62, 0, 2.42, 1.08, 0, 0.07, wood);
    quadB([-0.42, 0.58, -0.62], [0.58, 0.58, -0.5], [0.58, 0.58, 0.5], [-0.42, 0.58, 0.62], '#5a3d22');
    for (let j = 0; j < 4; j++) { const a = RAIL[j], b2 = RAIL[j + 1]; quadB([a[0], 0.58, a[1]], [b2[0], 0.58, b2[1]], [b2[0], b2[2], b2[1]], [a[0], a[2], a[1]], j === 1 || j === 2 ? c.col : c.colD); segB(a[0], a[2], a[1], b2[0], b2[2], b2[1], 0.06, c.col2); }
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
  if (facing >= 0) { horses(); car(); } else { car(); horses(); }
  ctx.globalAlpha = 1;
  if (!mine && !far && R.phase !== 'home' && z0 > 3 && P(0.2, 3.0, 0) && SX > 6 && SX < W - 6) {      // who is that?
    const fs = clamp(SC * 0.42, 9, 13) * k; ctx.font = `800 ${fs}px Nunito, sans-serif`; ctx.textAlign = 'center';
    const tw = ctx.measureText(c.name).width + fs * 1.4; SX = clamp(SX, tw / 2 + 4, W - tw / 2 - 4); ctx.fillStyle = 'rgba(10,16,28,.55)'; rrect(SX - tw / 2, SY - fs * 1.05, tw, fs * 1.4, fs * 0.5); ctx.fill();
    ctx.fillStyle = c.col; ctx.beginPath(); ctx.arc(SX - tw / 2 + fs * 0.6, SY - fs * 0.35, fs * 0.3, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(c.name, SX + fs * 0.35, SY);
  }
}
const RIGSH = [[-0.7, -1.15], [-0.7, 1.15], [1.2, 1.75], [3.5, 1.5], [3.5, -1.5], [1.2, -1.75]];
const RAIL = [[-0.05, -0.64, 1.0], [0.42, -0.52, 1.22], [0.64, 0, 1.32], [0.42, 0.52, 1.22], [-0.05, 0.64, 1.0]];
function dust(R, x, z, n, big) { for (let i = 0; i < n && R.parts.length < 150; i++) R.parts.push({ k: 0, x: x + (Math.random() - 0.5) * 1.6, y: 0.2, z: z + (Math.random() - 0.5) * 1.6, vx: (Math.random() - 0.5) * 2, vy: 0.6 + Math.random() * 1.4, vz: (Math.random() - 0.5) * 2, t: 0, life: 0.6 + Math.random() * 0.6, s0: 0.3, s1: big ? 1.7 : 1.0, col: R.V.sand[2], a: big ? 0.36 : 0.22 }); }
function sparks(R, x, y, z, n) { for (let i = 0; i < n && R.parts.length < 170; i++) R.parts.push({ k: 1, x, y, z, vx: (Math.random() - 0.5) * 7, vy: 1 + Math.random() * 5, vz: (Math.random() - 0.5) * 7, t: 0, life: 0.25 + Math.random() * 0.3, s0: 0.07, col: Math.random() < 0.5 ? '#ffe9a0' : '#ffb03a' }); }
