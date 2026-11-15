
// ===================== PART 5: drawing the boarding fight (the places) =====================
// You stand on their deck. Everything is set out in feet-on-the-floor terms: across (X), up from the floor (Y) and how far away (d, 1 = sword's length).
// The eye line is the horizon; things twice as far are half the size. Each place is painted once, then swayed as the ship rolls.
let hurtFlash = 0;
const SC = { key: '', cv: null, mx: 0, my: 0 };
function scenePaint(G) {
  const F = G.fight, key = F.stage + '|' + (F.navy ? 1 : 0) + '|' + G.seed + '|' + W + 'x' + H + '|' + DPR;
  if (SC.key === key) return; SC.key = key;
  const mx = Math.ceil(W * 0.05), my = Math.ceil(H * 0.035), c = SC.cv || document.createElement('canvas'), q = Math.min(DPR, 2);
  c.width = Math.round((W + mx * 2) * q); c.height = Math.round((H + my * 2) * q); SC.cv = c; SC.mx = mx; SC.my = my;
  const g = c.getContext('2d'); g.setTransform(q, 0, 0, q, 0, 0); g.clearRect(0, 0, W + mx * 2, H + my * 2); g.translate(mx, my); g.lineCap = 'butt'; g.lineJoin = 'round';
  const f = fu(), cx = W / 2, ye = H * FIGHT.EYE, R = rng(G.seed + F.stage * 77), FL = 465;
  const P = (X, Y, d) => [cx + X * f / d, ye + (FL - Y) * f / d];
  const quad = (pts, fill) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); };
  const line = (a, b, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
  const lg = (x0, y0, x1, y1, stops) => { const r = g.createLinearGradient(x0, y0, x1, y1); for (const s of stops) r.addColorStop(s[0], s[1]); return r; };
  const X0 = -mx, X1 = W + mx, Y0 = -my, Y1 = H + my;
  g.fillStyle = '#20150c'; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);      // nothing is left unpainted
  // a floor of planks running away from you
  const floor = (near, far, half, c0, c1, seam, gap) => {
    const a = P(-half, 0, near), b = P(half, 0, near), cc = P(half, 0, far), d = P(-half, 0, far);
    quad([a, b, cc, d], lg(0, d[1], 0, Y1, [[0, c1], [1, c0]]));
    g.save(); g.beginPath(); g.rect(X0, d[1], X1 - X0, Y1 - d[1]); g.clip();
    for (let X = -half * 3; X <= half * 3; X += gap) { const p = P(X, 0, far), n = P(X, 0, 0.55); line(p, n, 1.1, seam); }
    for (let i = 0; i < 46; i++) { const X = (Math.floor(R() * (half * 6 / gap)) - half * 3 / gap) * gap, dd = 0.7 + R() * (far - 0.7), p0 = P(X, 0, dd), p1 = P(X + gap, 0, dd); line(p0, p1, Math.max(0.6, 1.6 / dd), seam); }      // plank ends
    g.restore();
  };
  const barrel = (X, d, hgt = 105, wid = 70) => { const a = P(X - wid / 2, 0, d), b = P(X + wid / 2, hgt, d), w = b[0] - a[0], h = a[1] - b[1], gr = lg(a[0], 0, b[0], 0, [[0, '#3a2414'], [0.3, '#7a5230'], [0.55, '#8f6238'], [1, '#2c1a0e']]);
    g.fillStyle = gr; g.beginPath(); g.moveTo(a[0] + w * 0.08, a[1]); g.quadraticCurveTo(a[0] - w * 0.08, a[1] - h / 2, a[0] + w * 0.08, b[1]); g.lineTo(b[0] - w * 0.08, b[1]); g.quadraticCurveTo(b[0] + w * 0.08, a[1] - h / 2, b[0] - w * 0.08, a[1]); g.closePath(); g.fill();
    g.fillStyle = '#5a3c22'; g.beginPath(); g.ellipse(a[0] + w / 2, b[1], w * 0.42, h * 0.07, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(20,18,16,.8)'; g.lineWidth = Math.max(1, h * 0.035); for (const u of [0.18, 0.4, 0.62, 0.84]) { g.beginPath(); g.moveTo(a[0] + w * 0.02, a[1] - h * u); g.quadraticCurveTo(a[0] + w / 2, a[1] - h * u + h * 0.05, b[0] - w * 0.02, a[1] - h * u); g.stroke(); } };
  const crate = (X, d, wid = 90, hgt = 80, col = '#7a5a36') => { const a = P(X - wid / 2, 0, d), b = P(X + wid / 2, hgt, d), t = P(X - wid / 2 + 14, hgt, d + 0.22), t2 = P(X + wid / 2 + 14, hgt, d + 0.22);
    quad([[a[0], b[1]], [b[0], b[1]], t2, t], shade(col, 1.25)); g.fillStyle = lg(a[0], 0, b[0], 0, [[0, shade(col, 1.05)], [1, shade(col, 0.6)]]); g.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
    g.strokeStyle = 'rgba(30,18,8,.55)'; g.lineWidth = 1.2; g.strokeRect(a[0] + 2, b[1] + 2, b[0] - a[0] - 4, a[1] - b[1] - 4); line([a[0] + 2, b[1] + 2], [b[0] - 2, a[1] - 2], 1.2, 'rgba(30,18,8,.4)'); };
  const gun = (X, d, sd) => {      // a great gun on its carriage, muzzle toward the side
    const a = P(X, 0, d), s = f / d; g.fillStyle = '#4a321c'; g.fillRect(a[0] - 34 * s, a[1] - 34 * s, 68 * s, 30 * s); g.fillStyle = '#231609'; for (const q of [-24, 24]) { g.beginPath(); g.arc(a[0] + q * s, a[1] - 9 * s, 10 * s, 0, TAU); g.fill(); }
    g.fillStyle = lg(0, a[1] - 62 * s, 0, a[1] - 30 * s, [[0, '#4b4d50'], [0.5, '#1c1d1f'], [1, '#0c0c0d']]); g.beginPath(); g.moveTo(a[0] - sd * 44 * s, a[1] - 60 * s); g.lineTo(a[0] + sd * 62 * s, a[1] - 55 * s); g.lineTo(a[0] + sd * 62 * s, a[1] - 37 * s); g.lineTo(a[0] - sd * 44 * s, a[1] - 30 * s); g.closePath(); g.fill();
    g.fillStyle = '#0c0c0d'; g.beginPath(); g.arc(a[0] - sd * 46 * s, a[1] - 45 * s, 8 * s, 0, TAU); g.fill(); };
  const grime = (n, x0, y0, x1, y1, col) => { g.fillStyle = col; for (let i = 0; i < n; i++) g.fillRect(x0 + R() * (x1 - x0), y0 + R() * (y1 - y0), 1 + R() * 14, 1); };

  if (F.stage === 0) {
    // ---- on deck: sky, the sea beyond the rail, planking, the mast and its shrouds, the quarterdeck and the cabin door ----
    g.fillStyle = lg(0, Y0, 0, ye, [[0, '#3f86c2'], [0.55, '#8fc3e3'], [1, '#dcedf0']]); g.fillRect(X0, Y0, X1 - X0, ye - Y0 + 1);
    for (let i = 0; i < 7; i++) { const x = X0 + R() * (X1 - X0), y = ye * (0.15 + R() * 0.7), w = (60 + R() * 110) * f; g.fillStyle = `rgba(255,255,255,${0.35 + R() * 0.3})`; for (let j = 0; j < 5; j++) { g.beginPath(); g.ellipse(x + (j - 2) * w * 0.2, y + (R() - 0.5) * 8, w * (0.2 + R() * 0.14), (10 + R() * 9) * f, 0, 0, TAU); g.fill(); } }
    g.fillStyle = lg(0, ye, 0, ye + 130 * f, [[0, '#2f7f95'], [1, '#12506a']]); g.fillRect(X0, ye, X1 - X0, 140 * f);
    g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 40; i++) { const y = ye + 3 + R() * 110 * f; g.fillRect(X0 + R() * (X1 - X0), y, (6 + R() * 26) * (0.4 + (y - ye) / (110 * f)), 1.2); }
    // your own ship lying alongside to the left: her dark sails over the rail
    g.fillStyle = lg(X0, 0, cx - 60 * f, 0, [[0, '#2d1517'], [1, '#55272a']]); g.beginPath(); g.moveTo(X0, ye - 250 * f); g.quadraticCurveTo(cx - 240 * f, ye - 290 * f, cx - 150 * f, ye - 210 * f); g.quadraticCurveTo(cx - 175 * f, ye - 80 * f, cx - 160 * f, ye + 26 * f); g.lineTo(X0, ye + 40 * f); g.closePath(); g.fill();
    line([cx - 152 * f, Y0], [cx - 158 * f, ye + 60 * f], 5 * f, '#2a1b10'); g.fillStyle = '#0c0c0e'; g.fillRect(cx - 150 * f, ye - 330 * f, 54 * f, 30 * f); g.fillStyle = '#e8e2d0'; g.beginPath(); g.arc(cx - 124 * f, ye - 317 * f, 6 * f, 0, TAU); g.fill(); g.fillRect(cx - 132 * f, ye - 309 * f, 16 * f, 2.4 * f);
    floor(0.5, 4.6, 330, '#b08a5c', '#8d6c47', 'rgba(52,32,14,.5)', 44);
    // the quarterdeck's front, with the door to the captain's cabin
    const wy0 = P(0, 0, 4.6)[1], wy1 = P(0, 320, 4.6)[1], wl = P(-330, 0, 4.6)[0], wr = P(330, 0, 4.6)[0];
    g.fillStyle = lg(0, wy1, 0, wy0, [[0, '#6f4d2c'], [1, '#4a3019']]); g.fillRect(wl, wy1, wr - wl, wy0 - wy1);
    g.strokeStyle = 'rgba(25,14,6,.5)'; g.lineWidth = 1; for (let y = wy1 + 4; y < wy0; y += 5) { g.beginPath(); g.moveTo(wl, y); g.lineTo(wr, y); g.stroke(); }
    const dw = 34 * f / 4.6 * 2.2, dx = cx - dw / 2; g.fillStyle = '#1d120a'; g.beginPath(); g.moveTo(dx, wy0); g.lineTo(dx, wy1 + 16); g.quadraticCurveTo(cx, wy1 + 2, dx + dw, wy1 + 16); g.lineTo(dx + dw, wy0); g.closePath(); g.fill(); g.fillStyle = '#d9a640'; g.beginPath(); g.arc(dx + dw - 4, (wy0 + wy1) / 2 + 6, 1.6, 0, TAU); g.fill();
    for (const sd of [-1, 1]) { g.fillStyle = '#9fd0e0'; g.fillRect(cx + sd * 58 * f / 2.2 - 7, wy1 + 18, 14, 13); g.strokeStyle = '#3a2412'; g.lineWidth = 1.4; g.strokeRect(cx + sd * 58 * f / 2.2 - 7, wy1 + 18, 14, 13); line([cx + sd * 58 * f / 2.2, wy1 + 18], [cx + sd * 58 * f / 2.2, wy1 + 31], 1, '#3a2412');
      for (let i = 0; i < 7; i++) { const y = wy0 - i * (wy0 - wy1) / 7, x = cx + sd * (118 * f / 2.2 + i * 2.4); line([x - 9, y], [x + 9, y], 2, '#7a5632'); } }      // the two ladders up
    g.fillStyle = '#7d5a34'; g.fillRect(wl, wy1 - 3, wr - wl, 4); for (let x = wl + 4; x < wr; x += 9) line([x, wy1 - 3], [x, wy1 - 17], 1.6, '#6a4a2a'); g.fillRect(wl, wy1 - 19, wr - wl, 3);
    line([cx + 40, wy1 - 19], [cx + 46, wy1 - 92 * f], 2, '#2a1b10'); g.fillStyle = F.navy ? '#b3271f' : '#2f6a4a'; g.beginPath(); g.moveTo(cx + 46, wy1 - 92 * f); g.quadraticCurveTo(cx + 66, wy1 - 96 * f, cx + 84, wy1 - 88 * f); g.lineTo(cx + 84, wy1 - 66 * f); g.quadraticCurveTo(cx + 66, wy1 - 74 * f, cx + 45, wy1 - 68 * f); g.closePath(); g.fill();
    // bulwarks down both sides
    for (const sd of [-1, 1]) {
      const n0 = P(sd * 330, 0, 0.5), n1 = P(sd * 330, 112, 0.5), f0 = P(sd * 330, 0, 4.6), f1 = P(sd * 330, 112, 4.6);
      quad([n0, n1, f1, f0], lg(n0[0], 0, f0[0], 0, sd < 0 ? [[0, '#3f2a17'], [1, '#6a4a2b']] : [[0, '#2f1e10'], [1, '#553a20']]));
      for (const u of [0.25, 0.5, 0.75]) line(P(sd * 330, 112 * u, 0.5), P(sd * 330, 112 * u, 4.6), 1, 'rgba(20,12,5,.45)');
      line(n1, f1, 7 * f, '#8a643a'); line([n1[0], n1[1] + 3 * f], [f1[0], f1[1] + 1], 2, 'rgba(30,18,8,.5)');
      for (const d of [1.0, 1.5, 2.1, 2.9, 3.8]) { const a = P(sd * 330, 0, d), b = P(sd * 330, 112, d); line(a, b, 5 * f / d, '#4a321b'); }
      if (F.navy) { gun(sd * 268, 1.45, sd); gun(sd * 268, 2.5, sd); gun(sd * 268, 3.7, sd); }
      // shrouds and ratlines running up to the masthead
      const top = [cx + sd * 30 * f, Y0 - 60]; g.strokeStyle = 'rgba(28,20,12,.9)';
      const feet = [2.25, 2.5, 2.75, 3.0, 3.25].map(d => P(sd * 330, 112, d)); for (const p of feet) { g.lineWidth = 2.2; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(top[0], top[1]); g.stroke(); }
      g.lineWidth = 1; for (let u = 0.06; u < 0.9; u += 0.055) { const a = [lerp(feet[0][0], top[0], u), lerp(feet[0][1], top[1], u)], b = [lerp(feet[4][0], top[0], u), lerp(feet[4][1], top[1], u)]; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    }
    // the mainmast, the sail above, a hatch, some cargo
    const mb = P(-36, 0, 2.9), mw = 46 * f / 2.9; g.fillStyle = lg(mb[0] - mw / 2, 0, mb[0] + mw / 2, 0, [[0, '#3c2614'], [0.35, '#8a6238'], [0.6, '#74502c'], [1, '#2a190c']]); g.fillRect(mb[0] - mw / 2, Y0, mw, mb[1] - Y0);
    g.fillStyle = 'rgba(15,12,10,.75)'; for (const y of [mb[1] - 40 * f, mb[1] - 150 * f, mb[1] - 290 * f]) g.fillRect(mb[0] - mw / 2 - 1, y, mw + 2, 4);
    g.fillStyle = '#5a3d22'; g.fillRect(mb[0] - mw * 1.5, mb[1] - 34 * f / 2.9 * 2, mw * 3, 5); for (const q of [-1.2, -0.4, 0.4, 1.2]) line([mb[0] + q * mw, mb[1] - 34 * f / 2.9 * 2], [mb[0] + q * mw, mb[1] - 3], 2, '#5a3d22');
    g.fillStyle = lg(0, Y0, 0, 70 * f, [[0, '#f3ead2'], [1, '#cfc3a2']]); g.beginPath(); g.moveTo(X0, Y0); g.lineTo(X1, Y0); g.lineTo(X1, 30 * f); g.quadraticCurveTo(cx, 96 * f, X0, 34 * f); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(90,75,50,.35)'; g.lineWidth = 1; for (let x = X0 + 20; x < X1; x += 46 * f) { g.beginPath(); g.moveTo(x, Y0); g.lineTo(x + (x - cx) * 0.03, 60 * f); g.stroke(); }
    for (const sd of [-1, 1]) line([cx + sd * (W / 2 + mx - 6), 30 * f], P(sd * 330, 112, 1.9), 1.6, 'rgba(30,22,12,.85)');
    const h0 = P(-70, 0, 1.75), h1 = P(70, 0, 1.75), h2 = P(70, 0, 2.2), h3 = P(-70, 0, 2.2); quad([h0, h1, h2, h3], '#22160b'); g.strokeStyle = 'rgba(150,115,70,.7)'; g.lineWidth = 1.2; for (let u = 0.1; u < 1; u += 0.16) { line([lerp(h0[0], h1[0], u), h0[1]], [lerp(h3[0], h2[0], u), h3[1]], 1.2, 'rgba(150,115,70,.7)'); } for (const u of [0.33, 0.66]) line([lerp(h0[0], h3[0], u), lerp(h0[1], h3[1], u)], [lerp(h1[0], h2[0], u), lerp(h1[1], h2[1], u)], 1.2, 'rgba(150,115,70,.7)');
    barrel(232, 2.7); barrel(290, 3.0, 100, 66); barrel(250, 3.3, 96, 64); crate(-250, 3.3, 96, 84); if (!F.navy) { crate(-240, 2.5, 110, 92, '#86633c'); crate(-262, 2.52, 80, 150, '#6f5230'); barrel(-180, 3.6); }
    // long shadows of the rigging across the planks, and a little dirt
    g.fillStyle = 'rgba(30,20,10,.16)'; for (let i = 0; i < 5; i++) { const d = 0.8 + i * 0.7, a = P(-330, 0, d), b = P(330, 0, d + 0.5), w = 14 * f / d; quad([a, [a[0], a[1] + w], [b[0], b[1] + w], b], 'rgba(30,20,10,.14)'); }
    grime(120, X0, P(0, 0, 4.6)[1], X1, Y1, 'rgba(40,26,12,.14)');
  } else if (F.stage === 1) {
    // ---- below deck: beams overhead, lanterns, the guns at their ports (navy) or the cargo (merchant), the ladder and its shaft of daylight ----
    g.fillStyle = '#120c07'; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    floor(0.5, 5.2, 300, '#6a4a2c', '#2c1c0f', 'rgba(14,8,3,.6)', 40);
    const CE = 560;      // the deck overhead, just above your head
    { const a = P(-300, CE, 0.5), b = P(300, CE, 0.5), cc = P(300, CE, 5.2), d = P(-300, CE, 5.2); quad([a, b, cc, d], lg(0, Y0, 0, d[1], [[0, '#3a2715'], [1, '#170f08']]));
      for (let X = -900; X <= 900; X += 40) line(P(X, CE, 5.2), P(X, CE, 0.5), 1, 'rgba(8,5,2,.55)'); }
    // far bulkhead with a door
    const b0 = P(-300, 0, 5.2), b1 = P(300, CE, 5.2); g.fillStyle = lg(0, b1[1], 0, b0[1], [[0, '#2a1b0e'], [1, '#1b1109']]); g.fillRect(b0[0], b1[1], b1[0] - b0[0], b0[1] - b1[1]);
    g.fillStyle = '#0d0805'; g.fillRect(cx - 9 * f, b1[1] + 8 * f, 18 * f, b0[1] - b1[1] - 8 * f); g.fillStyle = '#d9a640'; g.fillRect(cx + 5 * f, (b0[1] + b1[1]) / 2 + 6, 1.6, 1.6);
    // the ship's sides, ribbed, with ports
    for (const sd of [-1, 1]) {
      const n0 = P(sd * 300, 0, 0.5), n1 = P(sd * 300, CE, 0.5), f0 = P(sd * 300, 0, 5.2), f1 = P(sd * 300, CE, 5.2);
      quad([n0, n1, f1, f0], lg(n0[0], 0, f0[0], 0, [[0, '#2a1a0d'], [1, '#3d2916']]));
      for (const u of [0.2, 0.4, 0.6, 0.8]) line(P(sd * 300, CE * u, 0.5), P(sd * 300, CE * u, 5.2), 1, 'rgba(8,5,2,.5)');
      for (const d of [0.9, 1.35, 1.9, 2.6, 3.4, 4.3]) { const a = P(sd * 300, 0, d), b = P(sd * 300, CE, d); line(a, b, 16 * f / d, '#1d1209'); line([a[0] - sd * 5 * f / d, a[1]], [b[0] - sd * 5 * f / d, b[1]], 2 * f / d, 'rgba(120,85,50,.35)'); }
      for (const d of F.navy ? [1.12, 1.62, 2.25, 3.0, 3.85] : [1.62, 3.0]) {
        const p0 = P(sd * 300, 185, d - 0.12), p1 = P(sd * 300, 300, d - 0.12), p2 = P(sd * 300, 300, d + 0.12), p3 = P(sd * 300, 185, d + 0.12);
        if (F.navy) { quad([p0, p1, p2, p3], lg(0, p1[1], 0, p0[1], [[0, '#cfe9f2'], [0.5, '#9fd0e0'], [0.52, '#3a8aa0'], [1, '#2a6f86']]));
          const l0 = P(sd * 285, 0, d - 0.1), l1 = P(sd * 285, 0, d + 0.14), l2 = P(sd * 70, 0, d + 0.34), l3 = P(sd * 70, 0, d - 0.02); quad([l0, l1, l2, l3], 'rgba(255,236,190,.09)');      // daylight on the planks
          gun(sd * 232, d, sd); }
        else quad([p0, p1, p2, p3], '#120b06');
      }
      if (!F.navy) { barrel(sd * 236, 1.2, 118, 78); barrel(sd * 250, 1.9, 112, 74); barrel(sd * 200, 2.15, 108, 70); crate(sd * 232, 2.75, 120, 96); crate(sd * 236, 2.76, 84, 170, '#6b4e2d'); crate(sd * 226, 3.6, 130, 110, '#82603a'); barrel(sd * 150, 4.2);
        for (let i = 0; i < 3; i++) { const a = P(sd * (170 + i * 34), 0, 1.5 + i * 0.03), s = f / 1.5; g.fillStyle = ['#b9a37a', '#a8926a', '#c4ae86'][i]; g.beginPath(); g.ellipse(a[0], a[1] - 22 * s, 34 * s, 24 * s, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(60,45,25,.5)'; g.fillRect(a[0] - 3 * s, a[1] - 46 * s, 6 * s, 8 * s); } }
    }
    // beams across
    for (const d of [0.95, 1.4, 2.0, 2.75, 3.6, 4.6]) { const a = P(-300, CE, d), b = P(300, CE, d), hh = 44 * f / d; g.fillStyle = lg(0, a[1], 0, a[1] + hh, [[0, '#1a1009'], [0.75, '#3b2714'], [1, '#553a1f']]); g.fillRect(a[0], a[1], b[0] - a[0], hh); }
    // the ladder up, and the daylight coming down it
    const la = P(120, 0, 3.3), lb = P(150, CE, 3.9), lw = 60 * f / 3.5; quad([[la[0] - lw, la[1]], [la[0] + lw, la[1]], [lb[0] + lw * 0.8, lb[1]], [lb[0] - lw * 0.8, lb[1]]], 'rgba(255,238,200,.13)');
    line([la[0] - lw * 0.6, la[1]], [lb[0] - lw * 0.5, lb[1]], 3, '#4a321b'); line([la[0] + lw * 0.6, la[1]], [lb[0] + lw * 0.5, lb[1]], 3, '#4a321b'); for (let u = 0.08; u < 1; u += 0.13) line([lerp(la[0] - lw * 0.6, lb[0] - lw * 0.5, u), lerp(la[1], lb[1], u)], [lerp(la[0] + lw * 0.6, lb[0] + lw * 0.5, u), lerp(la[1], lb[1], u)], 2.4, '#6a4a2a');
    quad([[la[0] - lw * 2.2, la[1] + 14 * f], [la[0] + lw * 2.4, la[1] + 14 * f], [la[0] + lw, la[1] - 6], [la[0] - lw, la[1] - 6]], 'rgba(255,238,200,.12)');
    grime(140, X0, P(0, 0, 5.2)[1], X1, Y1, 'rgba(0,0,0,.2)');
  } else {
    // ---- the captain's cabin: the great stern windows, his table and charts, a sea chest ----
    g.fillStyle = '#1b120b'; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    floor(0.5, 3.4, 300, '#7a5632', '#4a321b', 'rgba(20,11,4,.55)', 40);
    const CE = 600;
    { const a = P(-300, CE, 0.5), b = P(300, CE, 0.5), cc = P(300, CE, 3.4), d = P(-300, CE, 3.4); quad([a, b, cc, d], lg(0, Y0, 0, d[1], [[0, '#4a321b'], [1, '#2a1b0e']]));
      for (const d2 of [1.1, 1.8, 2.7]) { const p = P(-300, CE, d2), q2 = P(300, CE, d2), hh = 40 * f / d2; g.fillStyle = lg(0, p[1], 0, p[1] + hh, [[0, '#24160b'], [1, '#5a3d21']]); g.fillRect(p[0], p[1], q2[0] - p[0], hh); } }
    // the stern: a wall of windows, sea and sky beyond
    const w0 = P(-300, 0, 3.4), w1 = P(300, CE, 3.4); g.fillStyle = '#3a2614'; g.fillRect(w0[0], w1[1], w1[0] - w0[0], w0[1] - w1[1]);
    const sill = P(0, 150, 3.4)[1], head = P(0, 520, 3.4)[1], ww = (w1[0] - w0[0]);
    for (let i = 0; i < 5; i++) { const x = w0[0] + ww * (0.04 + i * 0.188), w = ww * 0.165; g.fillStyle = lg(0, head, 0, sill, [[0, '#bfe2f2'], [0.62, '#eaf6f5'], [0.63, '#4a9ab0'], [1, '#2f7b93']]); g.beginPath(); g.moveTo(x, sill); g.lineTo(x, head + 8); g.quadraticCurveTo(x + w / 2, head - 6, x + w, head + 8); g.lineTo(x + w, sill); g.closePath(); g.fill();
      g.strokeStyle = '#2a1a0c'; g.lineWidth = 1.6; for (const u of [0.33, 0.66]) { g.beginPath(); g.moveTo(x + w * u, head + 2); g.lineTo(x + w * u, sill); g.stroke(); } for (const u of [0.25, 0.5, 0.75]) { g.beginPath(); g.moveTo(x, lerp(head, sill, u)); g.lineTo(x + w, lerp(head, sill, u)); g.stroke(); } }
    g.fillStyle = '#5a3d21'; g.fillRect(w0[0], sill, ww, 5); g.fillStyle = lg(0, sill + 5, 0, w0[1], [[0, '#4a3019'], [1, '#2f1e0f']]); g.fillRect(w0[0], sill + 5, ww, w0[1] - sill - 5);      // the locker seat under them
    for (const sd of [-1, 1]) { g.fillStyle = lg(0, head, 0, sill, [[0, '#7a1f1c'], [1, '#4a1210']]); const x = sd < 0 ? w0[0] : w1[0] - ww * 0.05; g.beginPath(); g.moveTo(x, head - 8); g.lineTo(x + ww * 0.05, head - 8); g.quadraticCurveTo(x + ww * (sd < 0 ? 0.03 : 0.02), (head + sill) / 2, x + ww * 0.05, sill + 4); g.lineTo(x, sill + 4); g.closePath(); g.fill(); }
    // panelled sides
    for (const sd of [-1, 1]) { const n0 = P(sd * 300, 0, 0.5), n1 = P(sd * 300, CE, 0.5), f0 = P(sd * 300, 0, 3.4), f1 = P(sd * 300, CE, 3.4); quad([n0, n1, f1, f0], lg(n0[0], 0, f0[0], 0, [[0, '#3a2513'], [1, '#5c3f22']]));
      for (const d of [0.8, 1.2, 1.7, 2.3, 3.0]) line(P(sd * 300, 0, d), P(sd * 300, CE, d), 3 * f / d, 'rgba(20,11,4,.6)'); for (const u of [0.22, 0.6]) line(P(sd * 300, CE * u, 0.5), P(sd * 300, CE * u, 3.4), 2, 'rgba(20,11,4,.5)'); }
    // light from the windows across the floor, and a rug
    quad([P(-250, 0, 3.3), P(250, 0, 3.3), P(330, 0, 1.3), P(-330, 0, 1.3)], 'rgba(255,240,205,.1)');
    const r0 = P(-150, 0, 2.6), r1 = P(150, 0, 2.6), r2 = P(150, 0, 1.25), r3 = P(-150, 0, 1.25); quad([r0, r1, r2, r3], '#6d1d1b'); quad([P(-128, 0, 2.5), P(128, 0, 2.5), P(128, 0, 1.32), P(-128, 0, 1.32)], '#8a2b24'); quad([P(-96, 0, 2.36), P(96, 0, 2.36), P(96, 0, 1.42), P(-96, 0, 1.42)], '#7a2420');
    g.strokeStyle = 'rgba(228,190,110,.6)'; g.lineWidth = 1.4; const rq = [P(-112, 0, 2.43), P(112, 0, 2.43), P(112, 0, 1.37), P(-112, 0, 1.37)]; g.beginPath(); g.moveTo(rq[0][0], rq[0][1]); for (const p of rq) g.lineTo(p[0], p[1]); g.closePath(); g.stroke();
    // his table: charts, a candle, a decanter
    { const d = 2.5, a = P(105, 175, d - 0.25), b = P(285, 175, d - 0.25), cc = P(285, 175, d + 0.2), dd = P(105, 175, d + 0.2); quad([a, b, cc, dd], '#6a4827'); const fa = P(105, 150, d - 0.25), fb = P(285, 150, d - 0.25); quad([a, b, fb, fa], '#3a2513');
      for (const X of [118, 272]) line(P(X, 150, d - 0.25), P(X, 0, d - 0.25), 5 * f / d, '#2f1d0e');
      const p0 = P(140, 176, d - 0.15), p1 = P(225, 176, d - 0.18), p2 = P(232, 176, d + 0.1), p3 = P(150, 176, d + 0.12); quad([p0, p1, p2, p3], '#e9dcb4'); line([lerp(p0[0], p1[0], 0.2), lerp(p0[1], p3[1], 0.5)], [lerp(p0[0], p1[0], 0.85), lerp(p0[1], p3[1], 0.4)], 1, 'rgba(120,70,30,.7)');
      const cn = P(258, 176, d); g.fillStyle = '#e8dcc0'; g.fillRect(cn[0] - 1.6, cn[1] - 15 * f / d * 2, 3.2, 15 * f / d * 2); g.fillStyle = '#ffd98a'; g.beginPath(); g.ellipse(cn[0], cn[1] - 15 * f / d * 2 - 3, 2, 4, 0, 0, TAU); g.fill(); g.drawImage(soft(64, [[0, 'rgba(255,214,140,.5)'], [1, 'rgba(255,180,80,0)']]), cn[0] - 26, cn[1] - 15 * f / d * 2 - 28, 52, 52); }
    // the chest: open, and full
    { const d = 2.0, a = P(-285, 0, d), b = P(-165, 78, d), w = b[0] - a[0], h = a[1] - b[1]; g.fillStyle = lg(a[0], 0, b[0], 0, [[0, '#3a2412'], [0.5, '#70481f'], [1, '#2c1a0c']]); g.fillRect(a[0], b[1], w, h);
      g.fillStyle = '#e9b949'; g.beginPath(); g.ellipse(a[0] + w / 2, b[1] + 1, w * 0.45, h * 0.2, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#fff1b8'; for (let i = 0; i < 12; i++) g.fillRect(a[0] + w * (0.12 + R() * 0.76), b[1] - h * 0.16 * R(), 2, 1.6);
      g.fillStyle = '#4a2f16'; g.beginPath(); g.moveTo(a[0], b[1]); g.lineTo(a[0] + w * 0.06, b[1] - h * 0.95); g.quadraticCurveTo(a[0] + w / 2, b[1] - h * 1.2, a[0] + w * 0.94, b[1] - h * 0.95); g.lineTo(b[0], b[1]); g.lineTo(b[0] - w * 0.06, b[1] - h * 0.05); g.lineTo(a[0] + w * 0.06, b[1] - h * 0.05); g.closePath(); g.fill();
      g.fillStyle = '#c99a3a'; for (const u of [0.18, 0.82]) g.fillRect(a[0] + w * u - 2, b[1], 4, h); g.fillRect(a[0] + w / 2 - 4, b[1] + h * 0.2, 8, 9); }
    barrel(-250, 2.9, 96, 62); crate(260, 1.75, 80, 66, '#5a3d21');
    grime(90, X0, P(0, 0, 3.4)[1], X1, Y1, 'rgba(0,0,0,.14)');
  }
  // the edges of your sight fall away a little
  const vg = g.createRadialGradient(cx, H * 0.46, H * 0.3, cx, H * 0.46, H * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, F.stage === 0 ? 'rgba(10,20,30,.38)' : 'rgba(0,0,0,.62)'); g.fillStyle = vg; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
}
