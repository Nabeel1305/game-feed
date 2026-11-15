
// ===================== PART 6: drawing the boarding fight (the people, your blade and pistol, the bar) =====================
const INP = { tip: null };
const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function seg(a, b, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
function poly(pts, fill) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
// a blade from hand to tip. kind: cutlass, sabre, axe. w = its width at the hilt, big = how much it swells as it comes at you
function blade2(h, t, w, kind, red, big = 0) {
  const dx = t[0] - h[0], dy = t[1] - h[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux, ww = w * (1 + big * 0.9);
  if (kind === 'axe') {
    seg(h, t, w * 0.55, '#6a4a2a'); const a = lp(h, t, 0.8), e = [a[0] + nx * ww * 2.6, a[1] + ny * ww * 2.6]; const gr = ctx.createLinearGradient(a[0], a[1], e[0], e[1]); gr.addColorStop(0, red ? '#b3271f' : '#5d666e'); gr.addColorStop(1, red ? '#ffd0c0' : '#e9eef2');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a[0] - ux * ww * 0.7, a[1] - uy * ww * 0.7); ctx.quadraticCurveTo(a[0] + nx * ww * 1.2 - ux * ww * 1.9, a[1] + ny * ww * 1.2 - uy * ww * 1.9, e[0] - ux * ww * 1.5, e[1] - uy * ww * 1.5); ctx.quadraticCurveTo(e[0] + nx * ww * 0.5, e[1] + ny * ww * 0.5, e[0] + ux * ww * 1.5, e[1] + uy * ww * 1.5); ctx.quadraticCurveTo(a[0] + nx * ww * 1.2 + ux * ww * 1.9, a[1] + ny * ww * 1.2 + uy * ww * 1.9, a[0] + ux * ww * 0.7, a[1] + uy * ww * 0.7); ctx.closePath(); ctx.fill(); return;
  }
  const curve = kind === 'cutlass' ? 0.11 : 0.05, bw = kind === 'cutlass' ? ww : ww * 0.7, b0 = [h[0] + ux * w * 0.9, h[1] + uy * w * 0.9];
  const gr = ctx.createLinearGradient(b0[0] - nx * bw, b0[1] - ny * bw, b0[0] + nx * bw, b0[1] + ny * bw);
  if (red) { gr.addColorStop(0, '#8f1d16'); gr.addColorStop(0.45, '#ff6a4a'); gr.addColorStop(0.6, '#ffe0d0'); gr.addColorStop(1, '#c2362a'); } else { gr.addColorStop(0, '#6f7a84'); gr.addColorStop(0.42, '#c9d2d9'); gr.addColorStop(0.55, '#ffffff'); gr.addColorStop(1, '#8d98a2'); }
  const mid = [(b0[0] + t[0]) / 2 + nx * len * curve, (b0[1] + t[1]) / 2 + ny * len * curve], tw = bw * (1 + big * 0.7);
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(b0[0] - nx * bw * 0.5, b0[1] - ny * bw * 0.5); ctx.quadraticCurveTo(mid[0] - nx * tw * 0.55, mid[1] - ny * tw * 0.55, t[0], t[1]);
  ctx.quadraticCurveTo(mid[0] + nx * tw * 0.75 + ux * len * 0.12, mid[1] + ny * tw * 0.75 + uy * len * 0.12, b0[0] + nx * bw * 0.5, b0[1] + ny * bw * 0.5); ctx.closePath(); ctx.fill();
  // hilt: guard and knuckle bow in brass, a dark grip
  seg([h[0] - ux * w * 1.3, h[1] - uy * w * 1.3], [h[0] + ux * w * 0.5, h[1] + uy * w * 0.5], w * 0.62, '#2e2118');
  seg([b0[0] - nx * w * 1.25, b0[1] - ny * w * 1.25], [b0[0] + nx * w * 1.25, b0[1] + ny * w * 1.25], w * 0.42, '#c9a24a');
  ctx.strokeStyle = '#b8902e'; ctx.lineWidth = w * 0.3; ctx.beginPath(); ctx.moveTo(b0[0] + nx * w * 1.2, b0[1] + ny * w * 1.2); ctx.quadraticCurveTo(h[0] + nx * w * 1.7 - ux * w * 0.6, h[1] + ny * w * 1.7 - uy * w * 0.6, h[0] - ux * w * 1.4, h[1] - uy * w * 1.4); ctx.stroke();
}
// ---------- the two crews fighting behind him ----------
function mini(x, y, h, o) {      // a small figure: feet at x,y; h tall; o: coat, skin, hat, face (1 = looks right), arm (angle of the sword arm), down, up (hands up)
  const fc = o.face, hw = h * 0.085;
  ctx.save(); ctx.translate(x, y); if (o.down) { ctx.rotate(fc * -1.45); ctx.translate(0, -h * 0.04); }
  ctx.lineCap = 'round';
  seg([-hw * 0.9, 0], [-hw * 0.4, -h * 0.47], hw * 1.25, o.legs); seg([hw * 1.1, 0], [hw * 0.4, -h * 0.47], hw * 1.25, o.legs);
  seg([0, -h * 0.47], [fc * hw * 0.3, -h * 0.8], hw * 2.5, o.coat);
  ctx.fillStyle = o.skin; ctx.beginPath(); ctx.arc(fc * hw * 0.5, -h * 0.9, hw * 1.02, 0, TAU); ctx.fill();
  ctx.fillStyle = o.hat; ctx.beginPath(); ctx.arc(fc * hw * 0.5, -h * 0.93, hw * 1.08, Math.PI, TAU); ctx.fill(); if (o.brim) ctx.fillRect(fc * hw * 0.5 - hw * 1.7, -h * 0.945, hw * 3.4, hw * 0.4);
  const sh = [fc * hw * 0.6, -h * 0.76];
  if (o.up) { seg(sh, [sh[0] + hw * 2.2, sh[1] - hw * 3], hw * 0.95, o.coat); seg([-fc * hw * 0.2, -h * 0.76], [-fc * hw * 0.2 - hw * 2.2, sh[1] - hw * 3], hw * 0.95, o.coat); }
  else { const a = o.arm, hd = [sh[0] + fc * Math.cos(a) * hw * 3.3, sh[1] - Math.sin(a) * hw * 3.3]; seg(sh, hd, hw * 0.95, o.coat); if (!o.down) seg(hd, [hd[0] + fc * Math.cos(a + 0.5) * hw * 4.6, hd[1] - Math.sin(a + 0.5) * hw * 4.6], hw * 0.42, '#dfe6ea'); }
  ctx.restore();
}
function drawCrew(G, F) {
  if (F.stage === 2) return;
  const f = fu(), ye = H * FIGHT.EYE, adv = (F.shown - 0.5) * 2, won = F.phase === 'won', lost = F.phase === 'lost';
  const theirs = F.navy ? { coat: '#b3271f', legs: '#e9e3d2', hat: '#17140f', skin: '#e0b48c', brim: true } : { coat: '#c9c0a8', legs: '#4a4034', hat: '#7a5a36', skin: '#d8a678', brim: false };
  const ours = { coat: '#3a2a26', legs: '#2a2420', hat: '#a8322a', skin: '#c9966a', brim: false };
  const pairs = [[-262, 2.6, 0.3], [250, 3.0, 0.55], [-168, 3.6, 0.78], [150, 4.2, 0.9]];
  for (let i = pairs.length - 1; i >= 0; i--) {
    const [X, d, th] = pairs[i], s = f / d, y = ye + 465 * s, x = W / 2 + X * s + adv * 26 * s * (X < 0 ? 1 : -1) * 0, h = 440 * s, ph = VT * (5.2 + i * 0.9) + i * 2.3, gap = 44 * s;
    const tDown = adv > th || won, oDown = adv < -th || lost, dark = F.stage === 1 ? 0.6 : 0.88;
    ctx.globalAlpha = dark;
    mini(x - gap, y, h, Object.assign({ face: 1, arm: oDown ? 0 : tDown ? 1.5 + Math.sin(ph * 0.6) * 0.25 : 0.5 + Math.sin(ph) * 0.75, down: oDown }, ours));
    mini(x + gap, y, h * 1.02, Object.assign({ face: -1, arm: tDown ? 0 : oDown ? 1.4 : 0.5 + Math.sin(ph + 1.9) * 0.75, down: tDown && !won, up: won }, theirs));
    ctx.globalAlpha = 1;
    if (!tDown && !oDown && Math.sin(ph) > 0.93 && Math.random() < 0.3) { fx({ k: 'flash', w: 0, x: x + (Math.random() - 0.5) * 6, y: y - h * 0.78, life: 0.1, r0: 2, r1: 9 * s * 2 }); if (gate('clink', 380)) sfx.clink(1 / d); }
  }
}
// ---------- the man in front of you ----------
function drawMan(G, F, m) {
  const g = manGeo(F), L = m.look, bw = L.build, A = m.atk, os = m.os, ot = m.ot, c = YOU();
  if (os === 'down' && ot > 0.9) return;
  let tilt = m.lean * 0.22, ls = 1, sink = 0, alpha = 1;
  if (os === 'stagger') tilt += -0.13 * Math.sin(Math.min(1, ot / 0.2) * Math.PI / 2) * (1 - clamp((ot - m.stag + 0.2) / 0.2, 0, 1));
  if (os === 'hurt') ls = 0.975; if (os === 'strike') ls = 1 + 0.07 * Math.min(1, ot / 0.1); if (os === 'windup' && A) ls = 1 + 0.02 * Math.min(1, ot / A.wind);
  if (os === 'yield') { sink = Math.min(1, ot / 0.5) * 34; tilt += 0.05; }
  const s = g.s, X = v => g.x + v * s, Y = v => g.ey + (v + sink) * s, hipX = X(0), hipY = Y(205), ct = Math.cos(tilt) * ls, st = Math.sin(tilt) * ls;
  const up = (vx, vy) => { const dx = vx * s, dy = (vy - 205) * s; return [hipX + dx * ct - dy * st, hipY + dx * st + dy * ct]; };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (os === 'down') { const u = ot / 0.9; ctx.translate(hipX, Y(465)); ctx.rotate(m.fall * u * u * 1.25); ctx.translate(-hipX, -Y(465) + u * u * 90 * s); alpha = 1 - clamp((u - 0.6) / 0.4, 0, 1); ctx.globalAlpha = alpha; }
  if (m.z < 1 && os === 'enter') ctx.globalAlpha = clamp((m.z - 0.45) / 0.2, 0, 1);
  // his shadow on the planks
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(X(0), g.ey + 468 * s, 98 * s * bw, 15 * s, 0, 0, TAU); ctx.fill();
  // legs: breeches to the knee, then stockings or sea-boots
  const step = Math.sin(F.t * 2.2 + m.ph) * 3, boots = L.breeches && !(m.type === 'marine' || m.type === 'officer' || m.type === 'ncapt');
  for (const sd of [-1, 1]) { const hip = [X(sd * 21 * bw), Y(208)], knee = [X(sd * (31 * bw + step * sd * 0.4)), Y(338)], foot = [X(sd * 43 * bw), g.ey + 460 * s];
    seg(knee, foot, 31 * s, boots ? '#2a1e16' : '#e6dfcc'); if (boots) seg(lp(knee, foot, 0.02), lp(knee, foot, 0.1), 37 * s, '#3a2a1e');
    seg(hip, knee, 47 * s * bw, sd < 0 ? L.breeches : shade(L.breeches, 0.78));
    ctx.fillStyle = '#1c1410'; ctx.beginPath(); ctx.ellipse(foot[0] + sd * 7 * s, foot[1] + 3 * s, 25 * s, 10 * s, 0, 0, TAU); ctx.fill(); if (!boots) { ctx.fillStyle = '#c9a24a'; ctx.fillRect(foot[0] + sd * 4 * s - 4 * s, foot[1] - 3 * s, 8 * s, 5 * s); } }
  // the body
  const coat = L.coat || L.shirt, hem = L.coat ? 264 : 214;
  const body = [up(-16, 36), up(-61 * bw, 47), up(-55 * bw, 96), up(-44 * bw, 190), up(-53 * bw, hem), up(53 * bw, hem), up(44 * bw, 190), up(55 * bw, 96), up(61 * bw, 47), up(16, 36)];
  const a0 = up(-62 * bw, 120), a1 = up(62 * bw, 120), bg = ctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1]); bg.addColorStop(0, shade(coat, 1.14)); bg.addColorStop(0.45, coat); bg.addColorStop(1, shade(coat, 0.6));
  poly(body, bg);
  if (L.coat) {      // an open coat: waistcoat and shirt down the middle, the facings turned back
    poly([up(-12, 38), up(12, 38), up(19, 200), up(-19, 200)], m.type === 'mcapt' ? '#d8ccb0' : '#efe9da');
    seg(up(0, 60), up(0, 196), 1.6 * s, 'rgba(60,50,30,.5)');
    ctx.strokeStyle = L.trim; ctx.lineWidth = 4.5 * s; for (const sd of [-1, 1]) { ctx.beginPath(); const p0 = up(sd * 13, 38), p1 = up(sd * 33 * bw, 118), p2 = up(sd * 20, 200), p3 = up(sd * 24 * bw, hem); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.stroke(); }
    if (L.epaul || m.type === 'mcapt') { ctx.fillStyle = L.trim; for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const p = up(sd * (27 + 2 * i) * bw, 76 + i * 30); ctx.beginPath(); ctx.arc(p[0], p[1], 3.4 * s, 0, TAU); ctx.fill(); } }
    if (L.belt) { seg(up(-55 * bw, 52), up(36 * bw, 196), 12 * s, '#f2ead8'); seg(up(55 * bw, 52), up(-36 * bw, 196), 12 * s, '#e3dac6'); const p = up(0, 122); ctx.fillStyle = '#d6b048'; ctx.fillRect(p[0] - 9 * s, p[1] - 11 * s, 18 * s, 22 * s); }
    if (L.epaul) for (const sd of [-1, 1]) { const p = up(sd * 56 * bw, 46); ctx.fillStyle = '#e2b84a'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 19 * s, 8 * s, tilt + sd * 0.2, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b8902e'; ctx.lineWidth = 2 * s; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(p[0] + i * 6 * s, p[1] + 4 * s); ctx.lineTo(p[0] + i * 7 * s + sd * 3 * s, p[1] + 15 * s); ctx.stroke(); } }
  } else {
    if (L.stripes) { ctx.strokeStyle = 'rgba(40,70,120,.55)'; ctx.lineWidth = 5 * s; for (let y = 62; y < 190; y += 18) { const p0 = up(-(54 - (y - 60) * 0.07) * bw, y), p1 = up((54 - (y - 60) * 0.07) * bw, y); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); } }
    poly([up(-9, 38), up(9, 38), up(0, 104)], shade(L.skin, 0.86));      // an open collar
    if (L.vest) { poly([up(-61 * bw, 47), up(-20, 42), up(-24, 196), up(-44 * bw, 190), up(-55 * bw, 96)], L.vest); poly([up(61 * bw, 47), up(20, 42), up(24, 196), up(44 * bw, 190), up(55 * bw, 96)], shade(L.vest, 0.7)); }
  }
  if (L.sashC) { seg(up(-44 * bw, 192), up(44 * bw, 192), 19 * s, L.sashC); seg(up(-30 * bw, 200), up(-40 * bw, 250), 9 * s, shade(L.sashC, 0.8)); } else { seg(up(-44 * bw, 192), up(44 * bw, 192), 12 * s, '#2a1e16'); const p = up(0, 192); ctx.fillStyle = '#c9a24a'; ctx.fillRect(p[0] - 8 * s, p[1] - 7 * s, 16 * s, 14 * s); }
  if (m.hitT < 0.16) { ctx.globalAlpha = alpha * 0.55 * (1 - m.hitT / 0.16); poly(body, '#fff'); ctx.globalAlpha = alpha; }
  // neck and head
  poly([up(-14, 18), up(14, 18), up(16, 42), up(-16, 42)], shade(L.skin, 0.78));
  const hc = up(0, -4), hr = 25 * s * ls;
  ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(tilt + (os === 'yield' ? 0 : 0)); ctx.scale(hr / 25, hr / 25);
  const dark = shade(L.hair, 0.8);
  if (L.wig) { ctx.fillStyle = '#e9e6dc'; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(sd * 27, -6 + i * 12, 8, 0, TAU); ctx.fill(); } }
  else if (L.hat !== 'shako' && L.hat !== 'bicorne') { ctx.fillStyle = L.hair; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 20, -18); ctx.quadraticCurveTo(sd * 34, 4, sd * 27, 30); ctx.lineTo(sd * 19, 22); ctx.closePath(); ctx.fill(); } }
  ctx.fillStyle = shade(L.skin, 0.9); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 25, -1, 5.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(0, 0, 24, 27, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(40,20,10,.16)'; ctx.beginPath(); ctx.ellipse(9, 2, 15, 25, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
  if (L.beard) { ctx.globalAlpha = alpha * (L.beard === 2 ? 1 : 0.34); ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.quadraticCurveTo(-24, 28, -10, 34 + (L.beard === 2 ? 6 : 0)); ctx.quadraticCurveTo(0, 40 + (L.beard === 2 ? 8 : 0), 10, 34 + (L.beard === 2 ? 6 : 0)); ctx.quadraticCurveTo(24, 28, 24, 0); ctx.quadraticCurveTo(16, 12, 0, 13); ctx.quadraticCurveTo(-16, 12, -24, 0); ctx.closePath(); ctx.fill(); ctx.globalAlpha = alpha; }
  const shout = (os === 'strike' || (os === 'windup' && A && ot > A.wind * 0.5)), eyeY = os === 'yield' ? -1 : -5;
  ctx.strokeStyle = dark; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-16, -14); ctx.lineTo(-4, -9); ctx.moveTo(16, -14); ctx.lineTo(4, -9); ctx.stroke();
  if (os === 'hurt' || os === 'stagger') { ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-13, -5); ctx.lineTo(-6, -3); ctx.moveTo(13, -5); ctx.lineTo(6, -3); ctx.stroke(); }
  else { ctx.fillStyle = '#16100c'; ctx.beginPath(); ctx.arc(-9, eyeY, 2.5, 0, TAU); ctx.arc(9, eyeY, 2.5, 0, TAU); ctx.fill(); }
  if (L.patch) { ctx.fillStyle = '#0e0c0a'; ctx.beginPath(); ctx.ellipse(9, -5, 7, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#0e0c0a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-23, -14); ctx.lineTo(24, -3); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(60,30,15,.35)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(-2, 6); ctx.lineTo(2, 7); ctx.stroke();
  if (L.scar) { ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, -17); ctx.lineTo(-15, 4); ctx.stroke(); }
  if (shout) { ctx.fillStyle = '#3a1410'; ctx.beginPath(); ctx.ellipse(0, 16, 7, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8e2d0'; ctx.fillRect(-5, 11.5, 10, 2.4); } else { ctx.strokeStyle = '#4a2218'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-7, 16); ctx.quadraticCurveTo(0, os === 'yield' ? 18 : 13, 7, 16); ctx.stroke(); }
  if (L.beard || m.capt) { ctx.strokeStyle = L.hair; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-1, 10); ctx.quadraticCurveTo(-7, 9, -12, 13); ctx.moveTo(1, 10); ctx.quadraticCurveTo(7, 9, 12, 13); ctx.stroke(); }
  if (L.ring) { ctx.fillStyle = '#e9b949'; ctx.beginPath(); ctx.arc(-26, 6, 2.6, 0, TAU); ctx.fill(); }
  // hats
  const hat = L.hat;
  if (hat === 'bandana') { ctx.fillStyle = L.hatC; ctx.beginPath(); ctx.moveTo(-26, -9); ctx.quadraticCurveTo(-24, -40, 0, -40); ctx.quadraticCurveTo(24, -40, 26, -9); ctx.quadraticCurveTo(0, -19, -26, -9); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(27, -9, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = L.hatC; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(28, -8); ctx.lineTo(38, 12); ctx.moveTo(28, -8); ctx.lineTo(31, 17); ctx.stroke(); }
  else if (hat === 'cap') { ctx.fillStyle = L.hatC; ctx.beginPath(); ctx.moveTo(-25, -10); ctx.quadraticCurveTo(-25, -44, 0, -46); ctx.quadraticCurveTo(25, -44, 25, -10); ctx.closePath(); ctx.fill(); ctx.fillStyle = shade(L.hatC, 0.7); ctx.fillRect(-26, -17, 52, 8); }
  else if (hat === 'straw') { ctx.fillStyle = '#cfae5e'; ctx.beginPath(); ctx.moveTo(-21, -20); ctx.quadraticCurveTo(-18, -46, 0, -46); ctx.quadraticCurveTo(18, -46, 21, -20); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#dcbd70'; ctx.beginPath(); ctx.ellipse(0, -19, 47, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a3a2a'; ctx.fillRect(-20, -27, 40, 5); }
  else if (hat === 'tricorne') { ctx.fillStyle = '#1c1612'; ctx.beginPath(); ctx.moveTo(-47, -19); ctx.lineTo(-35, -41); ctx.lineTo(-12, -35); ctx.lineTo(0, -46); ctx.lineTo(12, -35); ctx.lineTo(35, -41); ctx.lineTo(47, -19); ctx.quadraticCurveTo(22, -12, 0, -9); ctx.quadraticCurveTo(-22, -12, -47, -19); ctx.closePath(); ctx.fill();
    if (m.capt) { ctx.strokeStyle = L.trim; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-47, -19); ctx.quadraticCurveTo(-22, -12, 0, -9); ctx.quadraticCurveTo(22, -12, 47, -19); ctx.stroke(); } }
  else if (hat === 'bicorne') { ctx.fillStyle = '#15130f'; ctx.beginPath(); ctx.moveTo(-55, -11); ctx.quadraticCurveTo(-36, -66, 0, -63); ctx.quadraticCurveTo(36, -66, 55, -11); ctx.quadraticCurveTo(0, -30, -55, -11); ctx.closePath(); ctx.fill(); ctx.strokeStyle = L.trim; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-55, -11); ctx.quadraticCurveTo(-36, -66, 0, -63); ctx.quadraticCurveTo(36, -66, 55, -11); ctx.stroke(); ctx.fillStyle = L.trim; ctx.beginPath(); ctx.arc(0, -42, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.arc(0, -42, 2.8, 0, TAU); ctx.fill(); }
  else if (hat === 'shako') { ctx.fillStyle = '#17140f'; ctx.beginPath(); ctx.moveTo(-21, -17); ctx.lineTo(-24, -66); ctx.lineTo(24, -66); ctx.lineTo(21, -17); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -66, 24, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#d6b048'; ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(9, -40); ctx.lineTo(0, -28); ctx.lineTo(-9, -40); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f4f1e8'; ctx.beginPath(); ctx.ellipse(0, -79, 6, 12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#0e0c0a'; ctx.beginPath(); ctx.moveTo(-23, -18); ctx.quadraticCurveTo(0, -6, 23, -18); ctx.lineTo(21, -22); ctx.lineTo(-21, -22); ctx.closePath(); ctx.fill(); }
  else { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(-24, -8); ctx.quadraticCurveTo(-26, -34, 0, -33); ctx.quadraticCurveTo(26, -34, 24, -8); ctx.quadraticCurveTo(10, -22, -24, -8); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // arms and the blade: where his hands are depends on what he is doing
  const gH = up(-36 + Math.sin(F.t * 1.7 + m.ph) * 3, 152), gT = up(34 + Math.sin(F.t * 1.3 + m.ph) * 6, 20), chest = up(0, 100);
  let hand = gH, tip = gT, off = up(66, 198), big = 0, red = false, pistol = 0, drop = false;
  if ((os === 'windup' || os === 'strike') && A) {
    const p = os === 'windup' ? easeOut(Math.min(1, ot / Math.max(0.15, A.wind * 0.7))) : 1, q = os === 'strike' ? Math.min(1, ot / 0.1) : 0; red = A.kind === 'heavy';
    if (A.kind === 'cut' || A.kind === 'heavy') {
      const dx = A.sx - c.x, dy = A.sy - c.y, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, rh = [chest[0] + ux * 66 * s, chest[1] + uy * 60 * s - 12 * s], rt = [rh[0] + ux * 132 * s - uy * 22 * s, rh[1] + uy * 132 * s + ux * 22 * s];
      hand = lp(m.fromH || gH, rh, p); tip = lp(m.fromT || gT, rt, p);
      if (q) { const tp = [lerp(A.sx, c.x, q), lerp(A.sy, c.y, q)]; tip = lp(rt, tp, easeOut(q)); hand = lp(rh, [lerp(chest[0], c.x, 0.3), lerp(chest[1], c.y, 0.3) + 30 * s], q); big = q * 1.5; }
      if (red) off = lp(off, [hand[0] + 14 * s, hand[1] + 10 * s], p);
    } else if (A.kind === 'thrust') {
      const rh = up(-50, 126), rt = lp(rh, [A.px, A.py], 0.2); hand = lp(m.fromH || gH, rh, p); tip = lp(m.fromT || gT, rt, p);
      if (q) { tip = lp(rt, [A.px, A.py], easeOut(q)); hand = lp(rh, lp(chest, [A.px, A.py], 0.42), q); big = q * 1.3; }
    } else { hand = lp(m.fromH || gH, up(-78, 204), p); tip = lp(m.fromT || gT, up(-128, 262), p); off = lp(off, up(14, 78), p); pistol = p; }
  } else {
    let tH = gH, tT = gT;
    if (os === 'stagger') { tH = up(-98, 74); tT = up(-158, -24); off = lp(off, up(98, 112), Math.min(1, ot / 0.15)); }
    else if (os === 'hurt') { tH = up(-44, 164); tT = up(44, 64); }
    else if (os === 'block') { tH = [m.bx + 36 * s, m.by + 24 * s]; tT = [m.bx - 44 * s, m.by - 40 * s]; }
    else if (os === 'yield') { tH = up(-80, -4); off = lp(off, up(80, -4), Math.min(1, ot / 0.35)); drop = true; }
    const b = easeOut(Math.min(1, ot / (os === 'block' ? 0.08 : 0.24))); hand = lp(m.fromH || gH, tH, b); tip = lp(m.fromT || gT, tT, b);
  }
  if (m.drawOs !== os + (A ? A.kind + A.chain + A.feinted : '')) { m.drawOs = os + (A ? A.kind + A.chain + A.feinted : ''); m.fromH = m.prevH || gH; m.fromT = m.prevT || gT; }
  m.prevH = hand; m.prevT = tip;
  const sleeve = L.coat || L.shirt;
  const arm = (S, Hd, sd, col) => { const dx = Hd[0] - S[0], dy = Hd[1] - S[1], d = Math.hypot(dx, dy) || 1, Lr = 80 * s * ls, hh = d < 2 * Lr ? Math.sqrt(Lr * Lr - d * d / 4) : 0; let nx = -dy / d, ny = dx / d; if (nx * sd + ny * 0.7 < 0) { nx = -nx; ny = -ny; }
    const E = [S[0] + dx / 2 + nx * hh * 0.8, S[1] + dy / 2 + ny * hh * 0.8]; seg(S, E, 31 * s * bw, col); seg(E, Hd, 25 * s * bw, shade(col, 0.92)); if (L.coat) seg(lp(E, Hd, 0.78), lp(E, Hd, 0.93), 28 * s * bw, L.trim); ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(Hd[0], Hd[1], 12.5 * s * ls, 0, TAU); ctx.fill(); };
  arm(up(58 * bw, 60), off, 1, shade(sleeve, 0.72));
  if (pistol > 0) {      // his pistol, levelled at you: you look down its barrel
    const r = (7 + 5 * pistol) * s; ctx.fillStyle = '#3a2817'; ctx.beginPath(); ctx.ellipse(off[0] + 6 * s, off[1] + 12 * s, 11 * s, 17 * s, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8f979d'; ctx.beginPath(); ctx.arc(off[0], off[1] - 4 * s, r * 1.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(off[0], off[1] - 4 * s, r * 0.85, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(off[0] - r * 0.2, off[1] - 4 * s - r * 2.1, r * 0.4, r * 0.7);
  }
  if (!drop) {
    if (red) { const mid = lp(hand, tip, 0.55), r = 70 * s * (1 + big); ctx.globalAlpha = alpha * 0.8; ctx.drawImage(SPR.fire, mid[0] - r, mid[1] - r, r * 2, r * 2); ctx.globalAlpha = alpha; }
    blade2(hand, tip, 11 * s * ls, L.sword, red, big);
    if (os === 'windup' && A && A.kind !== 'shot') { const gl = lp(hand, tip, 0.8), r = 16 * s * (0.6 + 0.4 * Math.sin(F.t * 30)); ctx.globalAlpha = alpha * 0.9; ctx.drawImage(SPR.flash, gl[0] - r, gl[1] - r, r * 2, r * 2); ctx.globalAlpha = alpha; }
  } else { const p = [X(-70), g.ey + 452 * s]; blade2(p, [p[0] + 118 * s, p[1] + 14 * s], 9 * s, L.sword === 'axe' ? 'axe' : L.sword, false, 0); }
  arm(up(-58 * bw, 60), hand, -1, sleeve);
  if (os === 'stagger') {      // off balance: this is your moment
    const pu = 0.5 + 0.5 * Math.sin(F.t * 16), cc = g.chest; ctx.strokeStyle = `rgba(255,214,102,${0.55 + 0.4 * pu})`; ctx.lineWidth = 3.5 * s; ctx.beginPath(); ctx.arc(cc.x, cc.y, cc.r * (0.75 + 0.12 * pu), 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3 * s; for (let i = 0; i < 3; i++) { const a = F.t * 6 + i * 2.1; ctx.beginPath(); ctx.arc(hc[0] + Math.cos(a) * 30 * s, hc[1] - 44 * s + Math.sin(a) * 7 * s, 4 * s, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}
// the path of his blow, so that you can read it: white = coming, gold = block now, bright = a clean block
function drawTell(G, F) {
  const m = F.man; if (!m || !(m.os === 'windup' || m.os === 'strike') || !m.atk) return;
  const A = m.atk, c = G.cfg, f = fu(), tl = m.os === 'windup' ? A.wind - m.ot + 0.1 : 0.1 - m.ot, now = tl <= c.parryWin, best = tl <= c.parryWin * 0.38, p = m.os === 'windup' ? clamp(m.ot / A.wind, 0, 1) : 1;
  const col = A.kind === 'heavy' || A.kind === 'shot' ? '255,70,50' : best ? '255,255,235' : now ? '255,206,90' : '235,240,245', a = (0.22 + 0.5 * p) * (best ? 1.25 : 1);
  ctx.lineCap = 'round';
  if (A.kind === 'cut' || A.kind === 'heavy') {
    const e = [lerp(A.sx, A.ex, 0.47), lerp(A.sy, A.ey, 0.47)], s0 = [lerp(A.sx, A.ex, 0.03), lerp(A.sy, A.ey, 0.03)];
    ctx.strokeStyle = `rgba(${col},${a * 0.4})`; ctx.lineWidth = (A.kind === 'heavy' ? 30 : 20) * f; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
    ctx.strokeStyle = `rgba(${col},${Math.min(1, a * 1.25)})`; ctx.lineWidth = (A.kind === 'heavy' ? 7 : 4.5) * f; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
    const ux = (A.ex - A.sx), uy = (A.ey - A.sy), n = Math.hypot(ux, uy) || 1, dx = ux / n, dy = uy / n, hx = e[0], hy = e[1], q = 13 * f; ctx.fillStyle = `rgba(${col},${Math.min(1, a * 1.25)})`; ctx.beginPath(); ctx.moveTo(hx + dx * q * 1.5, hy + dy * q * 1.5); ctx.lineTo(hx - dy * q, hy + dx * q); ctx.lineTo(hx + dy * q, hy - dx * q); ctx.closePath(); ctx.fill();
  } else if (A.kind === 'thrust') {
    const r = (16 + 34 * (1 - p)) * f; ctx.strokeStyle = `rgba(${col},${Math.min(1, a * 1.3)})`; ctx.lineWidth = 4 * f; ctx.beginPath(); ctx.arc(A.px, A.py, r, 0, TAU); ctx.stroke(); ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.arc(A.px, A.py, 5 * f, 0, TAU); ctx.fill();
  } else { const g = manGeo(F), r = (14 + 60 * (1 - p)) * f, x = g.x + 14 * g.s, y = g.ey + 74 * g.s; ctx.strokeStyle = `rgba(${col},${0.5 + 0.5 * p})`; ctx.lineWidth = 4 * f; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
}
// ---------- your own blade and pistol ----------
const TRAIL = [];
function pistolBtn() { return { x: W - 58 * k, y: H - 74 * k, r: 40 * k }; }
function drawMine(G, F) {
  const f = fu(), dip = F.dodge ? Math.sin(Math.min(1, F.dodge.t / 0.5) * Math.PI) : 0, w = 13 * f;
  let h = [W * 0.77 + Math.sin(VT * 1.1) * 3 * f, H * 0.96 + dip * H * 0.08], t = [W * 0.55 + Math.sin(VT * 1.3) * 6 * f, H * 0.6 + Math.cos(VT * 1.1) * 5 * f + dip * H * 0.14], big = 0.6;
  const away = F.aim || F.reloading;
  if (away) { h = [W * 1.02, H * 1.04]; t = [W * 0.86, H * 0.8]; }
  else if (F.pAnim) { const A = F.pAnim, p = A.t / A.dur;
    if (A.kind === 'stab') { const q = p < 0.4 ? easeOut(p / 0.4) : 1 - easeOut((p - 0.4) / 0.6); t = lp(t, [A.ax, A.ay], q); h = lp(h, [lerp(h[0], A.ax, 0.42), lerp(h[1], A.ay, 0.3)], q); big = 0.6 - q * 0.35; }
    else if (A.kind === 'slice') { const q = p < 0.5 ? easeOut(p / 0.5) : 1, r = p < 0.5 ? 0 : easeOut((p - 0.5) / 0.5), cur = lp([A.ax, A.ay], [A.bx + (A.bx - A.ax) * 0.18, A.by + (A.by - A.ay) * 0.18], q); t = lp(cur, t, r); h = lp([lerp(h[0], cur[0], 0.3), lerp(h[1], cur[1], 0.16) + H * 0.03], h, r); }
    else { const q = Math.min(1, p / 0.25); t = lp(t, [A.bx, A.by], q); h = lp(h, [A.ax + (A.ax - A.bx) * 0.35, A.ay + (A.ay - A.by) * 0.35 + H * 0.02], q * 0.75); } }
  else if (INP.tip) { t = [INP.tip.x, INP.tip.y]; h = [lerp(h[0], t[0], 0.22) + (t[0] < W / 2 ? W * 0.06 : 0), lerp(h[1], t[1], 0.12) + H * 0.04]; }
  if (F.pStun > 0) { t[0] += (Math.random() - 0.5) * 14 * f; t[1] += (Math.random() - 0.5) * 14 * f; }
  TRAIL.push(t); if (TRAIL.length > 7) TRAIL.shift();
  if (!away && TRAIL.length > 2) { ctx.lineCap = 'round'; for (let i = 1; i < TRAIL.length; i++) { const d = Math.hypot(TRAIL[i][0] - TRAIL[i - 1][0], TRAIL[i][1] - TRAIL[i - 1][1]); if (d < 3) continue; ctx.strokeStyle = `rgba(255,255,255,${0.06 * i})`; ctx.lineWidth = w * 1.6 * (i / TRAIL.length); ctx.beginPath(); ctx.moveTo(TRAIL[i - 1][0], TRAIL[i - 1][1]); ctx.lineTo(TRAIL[i][0], TRAIL[i][1]); ctx.stroke(); } }
  if (F.chain >= 2 && !away) { const mid = lp(h, t, 0.6), r = 60 * f * Math.min(1.6, 0.8 + F.chain * 0.12); ctx.globalAlpha = Math.min(0.9, 0.3 + F.chain * 0.1); ctx.drawImage(SPR.glow, mid[0] - r, mid[1] - r, r * 2, r * 2); ctx.globalAlpha = 1; }
  blade2(h, t, w, 'cutlass', false, big);
  ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.ellipse(h[0], h[1], w * 1.75, w * 1.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let i = -1; i <= 1; i++) ctx.fillRect(h[0] - w * 1.3, h[1] + i * w * 0.5 - 1, w * 2.6, 2);
  // the pistol
  if (F.aim) {
    const p = aimAt(F), g = manGeo(F), m = F.man, d = c => Math.hypot(p.x - c.x, p.y - c.y), live = m && m.os !== 'down' && m.os !== 'yield' && m.z >= 0.8;
    const on = live ? (d(g.head) <= g.head.r || d(g.chest) <= g.chest.r * 0.62 ? 2 : d(g.chest) <= g.chest.r || d(g.belly) <= g.belly.r ? 1 : 0) : 0, col = on === 2 ? '255,214,102' : on === 1 ? '255,255,255' : '255,120,100';
    const sh = [W * 0.2, H * 1.06], grip = lp(sh, [p.x, p.y], 0.6), muz = lp(sh, [p.x, p.y], 0.82), rise = Math.min(1, F.aim.t / 0.25), dy = (1 - rise) * H * 0.2;
    ctx.lineCap = 'round'; seg([sh[0], sh[1] + dy], [grip[0], grip[1] + dy], 46 * f, '#2e221c'); seg(lp(sh, grip, 0.8), [grip[0], grip[1] + dy], 40 * f, '#c9966a');
    seg([grip[0] + 8 * f, grip[1] + 26 * f + dy], [grip[0], grip[1] + dy], 22 * f, '#5a3a1e');
    const bx = muz[0] - grip[0], by = muz[1] - grip[1], bl = Math.hypot(bx, by) || 1, nx = -by / bl, ny = bx / bl; ctx.fillStyle = '#4a5157'; ctx.beginPath(); ctx.moveTo(grip[0] + nx * 11 * f, grip[1] + ny * 11 * f + dy); ctx.lineTo(muz[0] + nx * 7 * f, muz[1] + ny * 7 * f + dy); ctx.lineTo(muz[0] - nx * 7 * f, muz[1] - ny * 7 * f + dy); ctx.lineTo(grip[0] - nx * 11 * f, grip[1] - ny * 11 * f + dy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0c0c0d'; ctx.beginPath(); ctx.arc(muz[0], muz[1] + dy, 6 * f, 0, TAU); ctx.fill(); ctx.fillStyle = '#c9a24a'; ctx.fillRect(grip[0] - 4 * f, grip[1] - 16 * f + dy, 8 * f, 10 * f);
    const R = p.A + 13 * f; ctx.strokeStyle = `rgba(${col},.95)`; ctx.lineWidth = 2.5 * f; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.stroke(); ctx.beginPath(); for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(p.x + ax * R * 0.6, p.y + ay * R * 0.6); ctx.lineTo(p.x + ax * (R + 8 * f), p.y + ay * (R + 8 * f)); } ctx.stroke(); ctx.fillStyle = `rgba(${col},1)`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.6 * f, 0, TAU); ctx.fill();
  } else if (F.reloading) {
    const u = F.reload / FIGHT.RELOAD, cx = W * 0.5, cy = H * 0.9, ram = Math.abs(Math.sin(u * Math.PI * 6)); ctx.lineCap = 'round';
    seg([cx - 30 * f, cy + 70 * f], [cx - 8 * f, cy + 18 * f], 40 * f, '#c9966a'); seg([cx - 8 * f, cy + 30 * f], [cx, cy], 22 * f, '#5a3a1e'); seg([cx, cy], [cx + 16 * f, cy - 96 * f], 15 * f, '#4a5157');
    seg([cx + 17 * f, cy - 100 * f - ram * 60 * f], [cx + 26 * f, cy - 170 * f - ram * 60 * f], 4 * f, '#8a643a'); seg([cx + 70 * f, cy + 60 * f], [cx + 26 * f, cy - 170 * f - ram * 60 * f + 40 * f], 30 * f, '#c9966a');
  }
}
// ---------- the bar, the pistol button, hints ----------
function hudFight(G, F) {
  const x0 = 46 * k, wB = W - 92 * k, y = 54, hB = 13, u = clamp(F.shown, 0, 1), f = fu();
  ctx.fillStyle = 'rgba(3,10,14,.6)'; rrect(x0 - 3, y - 3, wB + 6, hB + 6, 6); ctx.fill();
  const gy = ctx.createLinearGradient(0, y, 0, y + hB); gy.addColorStop(0, '#ffd978'); gy.addColorStop(1, '#c98f24'); ctx.fillStyle = gy; ctx.fillRect(x0, y, wB * u, hB);
  const gr = ctx.createLinearGradient(0, y, 0, y + hB); gr.addColorStop(0, F.navy ? '#e0564a' : '#7fae8e'); gr.addColorStop(1, F.navy ? '#8f1f18' : '#2f6a4a'); ctx.fillStyle = gr; ctx.fillRect(x0 + wB * u, y, wB * (1 - u), hB);
  ctx.fillStyle = '#fff'; ctx.fillRect(x0 + wB * u - 1.5, y - 3, 3, hB + 6); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x0 + wB / 2 - 0.5, y, 1, hB);
  // the two flags at its ends
  ctx.fillStyle = '#0c0c0e'; ctx.fillRect(x0 - 30 * k, y - 4, 22 * k, 16); ctx.fillStyle = '#e8e2d0'; ctx.beginPath(); ctx.arc(x0 - 19 * k, y + 2.5, 3.2, 0, TAU); ctx.fill(); ctx.fillRect(x0 - 24 * k, y + 7, 10 * k, 1.6);
  ctx.fillStyle = F.navy ? '#b3271f' : '#2f6a4a'; ctx.fillRect(x0 + wB + 8 * k, y - 4, 22 * k, 16); ctx.fillStyle = F.navy ? '#f2ead8' : '#f0e6c8'; ctx.fillRect(x0 + wB + 8 * k, y - 4, 9 * k, 7);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(3,10,14,.7)';
  const lab = `${STAGE_N[F.stage]}  ·  ${F.stage + 1} OF 3`; ctx.strokeText(lab, W / 2, y + hB + 14); ctx.fillText(lab, W / 2, y + hB + 14);
  // pistol
  const B = pistolBtn(), can = F.loaded, rel = !F.loaded && G.shots > 0;
  ctx.fillStyle = F.aim ? 'rgba(233,185,73,.4)' : 'rgba(3,10,14,.5)'; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = can ? '#e9b949' : rel ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, 0, TAU); ctx.stroke();
  if (F.reloading) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(B.x, B.y, B.r, -Math.PI / 2, -Math.PI / 2 + TAU * F.reload / FIGHT.RELOAD); ctx.stroke(); }
  const ic = can ? '#f4ecd8' : 'rgba(255,255,255,.4)'; ctx.lineCap = 'round'; seg([B.x - 15 * k, B.y - 5 * k], [B.x + 16 * k, B.y - 5 * k], 6 * k, ic); seg([B.x - 13 * k, B.y - 3 * k], [B.x - 18 * k, B.y + 11 * k], 8 * k, ic); seg([B.x - 6 * k, B.y - 10 * k], [B.x - 2 * k, B.y - 13 * k], 3 * k, ic);
  ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = can ? '#e9b949' : rel ? '#fff' : 'rgba(255,255,255,.4)'; ctx.fillText(can ? 'PISTOL' : rel ? (F.reloading ? 'LOADING' : 'HOLD: RELOAD') : 'EMPTY', B.x, B.y + 23 * k);
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i < G.shots ? '#1a1a1c' : 'rgba(255,255,255,.14)'; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(B.x - 12 * k + i * 12 * k, B.y - B.r - 9 * k, 4.2 * k, 0, TAU); ctx.fill(); ctx.stroke(); }
}
function hintDraw() {
  if (!hint) return; const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); if (a <= 0) { hint = null; return; }
  ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; let fs = 17 * k; ctx.font = `700 ${Math.round(fs)}px ${BC}`; let tw = ctx.measureText(hint.txt).width; if (tw > W - 44 * k) { fs *= (W - 44 * k) / tw; ctx.font = `700 ${Math.round(fs)}px ${BC}`; tw = W - 44 * k; } const w = tw + 26 * k, y = hint.y || H * 0.8;
  ctx.fillStyle = 'rgba(3,10,14,.72)'; rrect(W / 2 - w / 2, y - 17 * k, w, 34 * k, 10 * k); ctx.fill(); ctx.fillStyle = '#ffe9b0'; ctx.fillText(hint.txt, W / 2, y); ctx.globalAlpha = 1;
}
let VIG = null;
function vignette() { if (hurtFlash <= 0.01) return; if (!VIG) { VIG = document.createElement('canvas'); VIG.width = VIG.height = 128; const g = VIG.getContext('2d'), r = g.createRadialGradient(64, 64, 34, 64, 64, 90); r.addColorStop(0, 'rgba(200,20,10,0)'); r.addColorStop(1, 'rgba(200,20,10,.6)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); } ctx.globalAlpha = Math.min(1, hurtFlash); ctx.drawImage(VIG, 0, 0, W, H); ctx.globalAlpha = 1; }
function drawFight(G) {
  sprites(); scenePaint(G);
  const F = G.fight, f = fu(), ye = H * FIGHT.EYE, roll = Math.sin(VT * 0.62) * 0.011 + Math.sin(VT * 1.07) * 0.004, bob = Math.sin(VT * 0.8) * 4 * f, dip = F.dodge ? Math.sin(Math.min(1, F.dodge.t / 0.5) * Math.PI) : 0;
  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake, sc = 1.012 - dip * 0.035, plain = QUAL < 0.8;      // a phone that has eased off gets the roll as a slide only: a turned picture is slower to lay down
  ctx.save(); if (plain) ctx.translate(Math.round(sx + roll * 500), Math.round(bob + dip * H * 0.075 + sy)); else { ctx.translate(W / 2 + sx, ye + bob + dip * H * 0.075 + sy); ctx.rotate(roll); ctx.scale(sc, sc); ctx.translate(-W / 2, -ye); }
  if (DBG.noBack) { ctx.fillStyle = '#6a4a2c'; ctx.fillRect(-20, -20, W + 40, H + 40); } else ctx.drawImage(SC.cv, -SC.mx, -SC.my, W + SC.mx * 2, H + SC.my * 2);
  if (F.stage === 1) for (const [X, d, ph] of [[-150, 1.45, 0], [170, 2.5, 2]]) { const s = f / d, x = W / 2 + X * s + Math.sin(VT * 1.3 + ph) * 10 * s, y = ye - 20 * s, fl = 0.85 + 0.15 * Math.sin(VT * 9 + ph * 3); ctx.strokeStyle = '#1a1009'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(W / 2 + X * s, ye - 95 * s); ctx.lineTo(x, y - 20 * s); ctx.stroke(); ctx.globalAlpha = 0.9 * fl; ctx.drawImage(SPR.glow, x - 150 * s, y - 150 * s, 300 * s, 300 * s); ctx.globalAlpha = 1; ctx.fillStyle = '#2a1b0e'; ctx.fillRect(x - 11 * s, y - 22 * s, 22 * s, 6 * s); ctx.fillRect(x - 11 * s, y + 16 * s, 22 * s, 5 * s); ctx.fillStyle = '#ffe2a0'; ctx.fillRect(x - 8 * s, y - 16 * s, 16 * s, 32 * s); ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.ellipse(x, y + 2 * s, 3.5 * s, 8 * s, 0, 0, TAU); ctx.fill(); }
  if (!DBG.noCrew) drawCrew(G, F);
  if (F.man && !DBG.noMan) drawMan(G, F, F.man);
  drawTell(G, F);
  fxDraw(false);
  ctx.restore();
  drawMine(G, F); hudFight(G, F); txtDraw();
}
// what one moment of the boarding fight looks and sounds like
function fightEvent(G, e) {
  const F = G.fight, f = fu(), g = F && F.man ? manGeo(F) : { x: W / 2, ey: H * FIGHT.EYE, s: f, chest: { x: W / 2, y: H * 0.4, r: 40 } }, c = YOU(), N = G.N;
  const sparks = (x, y, n, col) => { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (120 + Math.random() * 360) * f; fx({ k: 'line', w: 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.18 + Math.random() * 0.25, r0: 2.4 * f, r1: 0.6, col, g: 700 * f, drag: 3 }); } fx({ k: 'flash', w: 0, x, y, life: 0.12, r0: 10 * f, r1: 46 * f }); };
  switch (e.k) {
    case 'stage': setBanner(STAGE_N[e.i].replace('THE ', 'The ').replace("CAPTAIN'S CABIN", "captain's cabin").replace('ON DECK', 'On deck').replace('BELOW DECK', 'Below deck'), e.i === 2 ? F.capt : 'Aboard the ' + F.ship, 1.5); sfx.stage(e.i); TRAIL.length = 0; break;
    case 'man': if (F.stage < 2) sfx.step(); if (F.men === 1 && F.stage === 0) tip('slice', 'Swipe across him to slice. Tap him to stab.', 3.2); break;
    case 'windup': sfx.tell(e.kind, e.wind);
      if (e.kind === 'cut') tip('block', 'Swipe across his blade to block', 2.4); else if (e.kind === 'thrust') tip('thrust', 'Swipe through the ring to block', 2.4); else if (e.kind === 'heavy') tip('heavy', 'Red blow! Pull down to dodge', 2.4, true); else tip('shot', 'He takes aim! Pull down to dodge', 2.4, true); break;
    case 'feint': sfx.feint(); break;
    case 'strike': sfx.swish(0.7); if (e.kind === 'shot') { const x = g.x + 14 * g.s, y = g.ey + 70 * g.s; fx({ k: 'flash', w: 0, x, y, life: 0.14, r0: 20 * f, r1: 120 * f }); for (let i = 0; i < 5; i++) fx({ k: 'smoke', w: 0, x: x + (Math.random() - 0.5) * 30 * f, y: y + (Math.random() - 0.5) * 20 * f, vx: (Math.random() - 0.5) * 60, vy: -30 - Math.random() * 50, life: 1 + Math.random() * 0.6, r0: 20 * f, r1: 90 * f, a0: 0.7 }); sfx.pistol(0.8); } break;
    case 'guard': sfx.swish(0.9); if (e.heavy) say("CAN'T BLOCK THAT", W / 2, H * 0.62, '#ff9a8a', 20); break;
    case 'parry': { const x = e.x == null ? c.x : e.x, y = e.y == null ? c.y - 60 * f : e.y; sparks(x, y, e.perfect ? 16 : 8, e.perfect ? '#fff3c4' : '#ffd166'); sfx.clang(e.perfect, e.chain); shake = Math.min(12, shake + (e.perfect ? 7 : 4)); hitstop = e.perfect ? 0.1 : 0.045; vibe(e.perfect ? HAP.sharp : HAP.light);
      say(e.perfect ? 'CLEAN BLOCK!' : 'BLOCKED', x, y - 26 * f, e.perfect ? '#fff3c4' : '#ffd166', e.perfect ? 26 : 20); if (e.chain >= 2) say('×' + e.chain, x + 64 * f, y - 4 * f, '#ffd166', 22);
      if (e.perfect) tip('rip', 'He is off balance: stab him!', 2.2); break; }
    case 'hurt': shake = Math.min(18, shake + 12); hurtFlash = 0.85; hitstop = 0.06; sfx.hurt(e.kind); duck(0.4, 400);
      say(e.kind === 'heavy' || e.kind === 'shot' ? 'DODGE THAT ONE' : e.caught ? 'CAUGHT SWINGING' : e.tooEarly ? 'TOO EARLY' : e.missed ? 'MISSED THE BLOCK' : 'HIT', W / 2, H * 0.66, '#ff8a7a', 22); break;
    case 'dodged': say('DODGED', W / 2, H * 0.66, '#bfe8ff', 22); sfx.swish(1.2); if (e.kind === 'heavy') tip('rip', 'He is off balance: stab him!', 2.2); break;
    case 'dodge': sfx.dodge(); vibe(HAP.tick); break;
    case 'swing': sfx.swish(e.kind === 'stab' ? 1.5 : 1); break;
    case 'cut': { const x = e.x, y = e.y;
      if (e.kind === 'ball') { sparks(x, y, 10, '#ffd9a0'); }
      else { const a = e.kind === 'stab' ? Math.random() * TAU : e.ang, L = (e.kind === 'stab' ? 22 : 74) * f; fx({ k: 'line', w: 0, x: x + Math.cos(a) * L, y: y + Math.sin(a) * L, vx: Math.cos(a) * L * 40, vy: Math.sin(a) * L * 40, life: 0.2, r0: (e.rip ? 9 : 6) * f, r1: 1, col: '#ffffff' }); sparks(x, y, e.rip ? 9 : 4, '#ffe9c0'); for (let i = 0; i < 4; i++) fx({ k: 'chip', w: 0, x, y, vx: (Math.random() - 0.5) * 300 * f, vy: (-80 - Math.random() * 200) * f, g: 900 * f, life: 0.5, r0: 4 * f, r1: 2 * f, col: F.man && (F.man.look.coat || F.man.look.shirt) || '#ccc', vr: 20 }); }
      sfx.cut(e.kind, e.rip); hitstop = Math.max(hitstop, e.rip ? 0.11 : e.kind === 'ball' ? 0.12 : 0.05); shake = Math.min(12, shake + (e.rip ? 7 : 3)); vibe(e.rip ? HAP.sharp : HAP.light);
      if (e.rip) say('RIPOSTE!', x, y - 44 * f, '#ffd166', 28); else if (e.trade && e.kind !== 'ball') say('GLANCING', x, y - 40 * f, '#d8dee2', 16); break; }
    case 'blocked': sparks(e.x, e.y, 6, '#cfd8dc'); sfx.clank(); say(e.counter ? 'HE TURNS IT: LOOK OUT!' : 'HE TURNS IT', e.x, e.y - 40 * f, '#cfd8dc', 18); if (e.counter) tip('spam', 'Mix your blows: he reads the same one twice', 2.6); break;
    case 'evaded': say('HE SLIPS IT', g.x, g.chest.y - 60 * f, '#cfd8dc', 18); break;
    case 'whiff': break;
    case 'down': sfx.down(); sfx.cheer(0.45); vibe(HAP.thud); say('DOWN!', g.x, g.chest.y - 80 * f, '#ffd166', 30); hitstop = Math.max(hitstop, 0.09); break;
    case 'stagewon': setBanner(e.i === 2 ? 'He yields!' : e.i === 1 ? (F.navy ? 'The gun deck is yours' : 'The hold is yours') : 'The deck is yours', e.i === 2 ? 'The ' + F.ship + ' is yours' : '', 1.8, '#ffd166'); sfx.cheer(e.i === 2 ? 1.3 : 0.9); sfx.won(e.i); duck(0.5, 900); vibe(HAP.best); hitstop = 0.16; break;
    case 'broken': setBanner('Your crew breaks', 'They are driven back to the boats', 1.6, '#ff9a8a'); sfx.lost(); duck(0.7, 1500); break;
    case 'raise': sfx.cock(); break;
    case 'lower': break;
    case 'spoiled': say('SHOT SPOILED', W / 2, H * 0.72, '#ff9a8a', 18); break;
    case 'shot': { fx({ k: 'flash', w: 0, x: e.x, y: e.y + 40 * f, life: 0.16, r0: 30 * f, r1: 170 * f }); for (let i = 0; i < 7; i++) fx({ k: 'smoke', w: 0, x: W * 0.36 + (Math.random() - 0.5) * 90 * f, y: H * 0.62 + (Math.random() - 0.5) * 60 * f, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 70, life: 1.2 + Math.random() * 0.8, r0: 30 * f, r1: 130 * f, a0: 0.75 });
      sfx.pistol(1); shake = 16; hitstop = 0.1; vibe(HAP.heavy); duck(0.6, 700);
      say(e.res === 'head' ? 'HEAD SHOT!' : e.res === 'heart' ? 'THROUGH THE HEART!' : e.res === 'body' ? 'WINGED HIM' : 'MISSED', e.x, e.y - 50 * f, e.res === 'miss' ? '#ff9a8a' : '#ffd166', e.res === 'miss' ? 20 : 26); break; }
    case 'reload': sfx.ram(); break;
    case 'loaded': sfx.cock(); say('LOADED', pistolBtn().x - 20 * k, pistolBtn().y - 70 * k, '#ffd166', 18); vibe(HAP.light); break;
  }
}
// a hint, shown the first few times its moment comes up (and always in the first three expeditions)
function tip(key, txt, secs, low) {
  const seen = store.get('tips', {}), n = seen[key] || 0; if (n >= 3 && !(LIVE && LIVE.N <= 2 && n < 6)) return;
  if (hint && hint.t < 0.9 && hint.key !== key) return;
  if (!hint || hint.key !== key) { seen[key] = n + 1; store.set('tips', seen); }
  hint = { key, txt, t: hint && hint.key === key ? Math.min(hint.t, 0.2) : 0, secs, y: low ? H * 0.74 : H * 0.8 };
}
