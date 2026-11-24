// ===================== DRAW: the gate in the clouds (2D on purpose) =====================
// Clouds under a sky that turns from dawn gold to noon blue to sunset rose to dusk; the pearly gates above, the glow of Heaven
// beyond them; a crack of fire below; grey mist at either side. The soul's card in the middle: a face, a name, how they died,
// the best deed (gold, with its halos), the worst (red, with its horns), the sealed scrolls. Drag it where it belongs.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null;
const ui = { drag: null, fly: null, bad: null, drop: null, glow: 0 };
const BODY = '"Nunito", "Segoe UI", sans-serif';
function sparks(x, y, n, col, sp = 220, g = 420) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.5, t: 0, col, r: 2 + Math.random() * 3, g }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.98; }
  for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  if (ui.fly) { ui.fly.t += dt; if (ui.fly.t > 0.55) ui.fly = null; } if (ui.bad) { ui.bad.t += dt; if (ui.bad.t > 3) ui.bad = null; }
}
function cardRect() { const top = 128 * k, bot = H - 118 * k; return { x: 16 * k, y: top, w: W - 32 * k, h: Math.min(bot - top, 470 * k) }; }
function bookRect() { const w = 120 * k, h = 52 * k; return { x: W / 2 - w / 2, y: H - h - 22 * k, w, h }; }
function onEvent(G, e) {
  const C = cardRect(), cx = W / 2;
  switch (e.k) {
    case 'soul': sfx.arrive(); ui.enter = 1; break;
    case 'right': { const s = G.last.s; ui.fly = { s, dir: e.dir, t: 0, ok: true }; if (e.dir === 'up') { sfx.heaven(e.n); sparks(cx, 60 * k, 24, '#ffe9a0', 200, -60); } else if (e.dir === 'down') { sfx.hell(); sparks(cx, H - 40 * k, 22, '#ff7a3a', 220, -300); FX.shake = 6; } else { sfx.mist(); sparks(e.dir === 'side' ? W - 20 : 20, H / 2, 14, '#c8ccd4', 120, 0); }
      vibe(HAP.light); break; }
    case 'wrong': ui.fly = { s: G.last.s, dir: e.dir, t: 0, ok: false }; ui.bad = { s: e.s, want: e.want, dir: e.dir, t: 0 }; FX.red = 0.6; FX.shake = 8; sfx.wrong(); say('WRONG GATE', cx, C.y + 30 * k, '#ffb4a8', 26);
      tip('wrong', e.s.deeds.some(d => d.hidden) && !e.s.looked ? 'It was close: the sealed deeds decided it. Look in the Book when the count is near even.' : 'Count every halo against every horn, under today\'s rule.', 3.4); break;
    case 'look': sfx.book(); ui.glow = 1; if (e.n === 0) say('NOTHING HIDDEN', cx, C.y + C.h * 0.75, '#fff', 18); break;
    case 'nolooks': sfx.no(); say('NO LOOKS LEFT TODAY', cx, H - 90 * k, '#ffb4a8', 18); break;
    case 'dusk': sfx.bell(); say(e.left ? `SUNSET: ${e.left} STILL WAITING` : 'SUNSET', cx, H * 0.4, '#ffb4a8', 24); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', cx, H * 0.5, '#ffe08a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, H * 0.5, '#9be3b5', 24); sfx.coin(e.n); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('THE GATE IS YOURS!', cx, H * 0.5, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.8; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
// ---------- the sky ----------
const CLOUDS = []; { const R = rng(77); for (let i = 0; i < 14; i++) CLOUDS.push({ x: R(), y: R(), s: 0.6 + R() * 0.9, v: 0.004 + R() * 0.01, a: 0.25 + R() * 0.35 }); }
function lerpC(a, b, u) { return a.map((v, i) => Math.round(v + (b[i] - v) * u)); }
function skyCols(u) { const K = [[[255, 196, 140], [255, 236, 210]], [[110, 170, 230], [200, 226, 248]], [[90, 150, 220], [190, 220, 245]], [[240, 140, 120], [255, 200, 160]], [[70, 60, 120], [160, 120, 170]]]; const p = clamp(u, 0, 1) * (K.length - 1), i = Math.min(K.length - 2, Math.floor(p)), f = p - i; return [lerpC(K[i][0], K[i + 1][0], f), lerpC(K[i][1], K[i + 1][1], f)]; }
const SKY = { cv: null, key: '' };
function drawSky(G, t) {
  const u = G ? (G.lesson ? 0.3 : G.sun / G.sunLen) : 0.3, key = [W, H, DPR, Math.round(u * 60)].join();
  if (SKY.key !== key) { SKY.key = key; if (!SKY.cv) SKY.cv = document.createElement('canvas'); SKY.cv.width = Math.round(W * DPR); SKY.cv.height = Math.round(H * DPR); const X = SKY.cv.getContext('2d'); X.setTransform(DPR, 0, 0, DPR, 0, 0); skyStatic(X, u); }
  ctx.drawImage(SKY.cv, 0, 0, W, H);
  for (const c of CLOUDS) { const x = ((c.x + t * c.v) % 1.3 - 0.15) * W, y = c.y * H, s = c.s * 70 * k; ctx.fillStyle = `rgba(255,255,255,${c.a})`; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.ellipse(x + (j - 1.5) * s * 0.6, y + Math.sin(j * 2) * s * 0.15, s * 0.55, s * 0.32, 0, 0, TAU); ctx.fill(); } }
  ui.glow = Math.max(0, ui.glow - 0.02);
}
function skyStatic(X, u) {
  const [top, bot] = skyCols(u), g0 = X.createLinearGradient(0, 0, 0, H);
  g0.addColorStop(0, `rgb(${top})`); g0.addColorStop(0.75, `rgb(${bot})`); g0.addColorStop(1, `rgb(${lerpC(bot, [80, 30, 20], 0.5)})`); X.fillStyle = g0; X.fillRect(0, 0, W, H);
  // Heaven's glow beyond the gates
  const gl = X.createRadialGradient(W / 2, 30 * k, 0, W / 2, 30 * k, W * 0.7); gl.addColorStop(0, 'rgba(255,248,210,.88)'); gl.addColorStop(1, 'rgba(255,248,210,0)'); X.fillStyle = gl; X.fillRect(0, 0, W, H * 0.5);
  // the gates
  const gw = W * 0.56, gx = W / 2 - gw / 2, gy = 4 * k, gh = 112 * k; X.strokeStyle = '#e8c868'; X.lineWidth = 3 * k; X.fillStyle = '#f4e6b8';
  for (const sx of [gx, gx + gw - 16 * k]) { X.fillRect(sx, gy + 30 * k, 16 * k, gh - 30 * k); X.beginPath(); X.arc(sx + 8 * k, gy + 30 * k, 9 * k, 0, TAU); X.fill(); }
  X.beginPath(); X.moveTo(gx + 8 * k, gy + 46 * k); X.quadraticCurveTo(W / 2, gy - 4 * k, gx + gw - 8 * k, gy + 46 * k); X.stroke();
  for (let i = 1; i < 9; i++) { const x = gx + 16 * k + i * (gw - 32 * k) / 9, open = (i < 5 ? -1 : 1) * 14 * k; X.beginPath(); X.moveTo(x + open, gy + 44 * k + Math.abs(x - W / 2) * 0.12); X.lineTo(x + open * 1.4, gy + gh); X.stroke(); }
  // fire below, mist at the sides
  const fy = H - 8 * k, fg = X.createRadialGradient(W / 2, H + 30 * k, 0, W / 2, H + 30 * k, W * 0.6); fg.addColorStop(0, 'rgba(255,90,20,.75)'); fg.addColorStop(1, 'rgba(255,60,10,0)'); X.fillStyle = fg; X.fillRect(0, H * 0.7, W, H * 0.3);
  X.strokeStyle = 'rgba(40,10,0,.6)'; X.lineWidth = 3; X.beginPath(); X.moveTo(W * 0.3, fy); for (let i = 0; i <= 10; i++) X.lineTo(W * 0.3 + i * W * 0.04, fy - (i % 2 ? 6 : 0) * k); X.stroke();
  for (const sx of [0, W]) { const mg = X.createRadialGradient(sx, H * 0.5, 0, sx, H * 0.5, 120 * k); mg.addColorStop(0, 'rgba(200,204,212,.7)'); mg.addColorStop(1, 'rgba(200,204,212,0)'); X.fillStyle = mg; X.fillRect(sx ? W - 120 * k : 0, H * 0.3, 120 * k, H * 0.4); }
}
// ---------- the card ----------
function face(s, x, y, sz) {
  const R = rng(s.face), skin = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac', '#5c3a1e'][(R() * 6) | 0], hair = s.age > 70 ? ['#d8d8d8', '#bfbfbf', '#eeeeee'][(R() * 3) | 0] : ['#1b1b1b', '#3b2416', '#6a4224', '#a8742c', '#d9c08a'][(R() * 5) | 0], robe = '#f4f0e6';
  ctx.save(); ctx.beginPath(); ctx.arc(x + sz / 2, y + sz / 2, sz / 2, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(255,240,200,.9)'; ctx.fillRect(x, y, sz, sz);
  ctx.fillStyle = robe; ctx.beginPath(); ctx.ellipse(x + sz / 2, y + sz * 1.05, sz * 0.48, sz * 0.36, 0, 0, TAU); ctx.fill();
  if (s.female) { ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(x + sz / 2, y + sz * 0.5, sz * 0.3, sz * 0.38, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(x + sz / 2, y + sz * 0.47, sz * 0.22, sz * 0.27, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(x + sz / 2, y + sz * 0.28, sz * 0.24, sz * 0.12, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = '#222'; const shifty = s.liar ? Math.sin(performance.now() / 300) * sz * 0.02 : 0; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + sz / 2 + sx * sz * 0.08 + shifty, y + sz * 0.45, sz * 0.025, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#6a3a2a'; ctx.lineWidth = Math.max(1, sz * 0.02); ctx.beginPath(); if (s.liar) { ctx.moveTo(x + sz * 0.44, y + sz * 0.57); ctx.quadraticCurveTo(x + sz * 0.52, y + sz * 0.6, x + sz * 0.58, y + sz * 0.54); } else ctx.arc(x + sz / 2, y + sz * 0.53, sz * 0.07, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore(); ctx.strokeStyle = 'rgba(255,215,120,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + sz / 2, y + 2, sz * 0.28, sz * 0.07, 0, 0, TAU); ctx.stroke();
}
function halo(x, y, s) { ctx.strokeStyle = '#d8a820'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.38, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,170,.9)'; ctx.lineWidth = 1 * k; ctx.stroke(); }
function horn(x, y, s) { ctx.fillStyle = '#b8261a'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y + s * 0.5); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.3, x + s * 0.3, y - s * 0.7); ctx.quadraticCurveTo(x, y - s * 0.1, x + s * 0.4, y + s * 0.5); ctx.closePath(); ctx.fill(); }
function marks(n, good, x, y, sz) { for (let i = 0; i < Math.abs(n); i++) good ? halo(x - i * sz * 2.3, y, sz) : horn(x - i * sz * 1.5, y, sz * 1.4); }
function deedRow(G, d, x, y, w, kind, s) {
  const good = d.w > 0, m = mult(G, d), lit = upLv('lantern') && m > 1, h = 58 * k, forged = d.forged && (s.looked || upLv('quill'));
  ctx.fillStyle = good ? 'rgba(255,236,170,.75)' : 'rgba(120,30,24,.82)'; rrect(x, y, w, h, 10); ctx.fill(); if (lit) { ctx.strokeStyle = '#fff7b0'; ctx.lineWidth = 3; rrect(x, y, w, h, 10); ctx.stroke(); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `800 ${Math.round(10 * k)}px ${BODY}`; ctx.fillStyle = good ? '#8a6a10' : '#ffc8b8'; ctx.fillText(`${kind}  ${KINDS[d.kind]}`, x + 10 * k, y + 7 * k);
  ctx.font = `700 ${Math.round(13.5 * k)}px ${BODY}`; ctx.fillStyle = good ? '#3a2a08' : '#fff'; const lines = wrapText(d.text, w - 24 * k); lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, x + 10 * k, y + 22 * k + i * 16 * k));
  if (d.forged && !forged && s.liar) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(performance.now() / 160); ctx.fillStyle = '#fff'; rrect(x, y, w, h, 10); ctx.fill(); ctx.globalAlpha = 1; }
  if (forged) { ctx.strokeStyle = '#b8261a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 8, y + h / 2); ctx.lineTo(x + w - 8, y + h / 2); ctx.stroke(); ctx.fillStyle = '#b8261a'; ctx.font = `900 ${Math.round(12 * k)}px ${BODY}`; ctx.textAlign = 'right'; ctx.fillText('FORGED', x + w - 10 * k, y + 6 * k); return h; }
  if (m > 1) { ctx.textAlign = 'right'; ctx.font = `900 ${Math.round(12 * k)}px ${BODY}`; ctx.fillStyle = good ? '#8a6a10' : '#ffd36a'; ctx.fillText('×2 TODAY', x + w - 10 * k, y + 6 * k); }
  return h;
}
function drawCard(G, s, C, t) {
  ctx.fillStyle = 'rgba(60,40,20,.14)'; rrect(C.x + 3, C.y + 6, C.w, C.h, 16); ctx.fill(); ctx.fillStyle = '#fbf6e8'; rrect(C.x, C.y, C.w, C.h, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(200,170,90,.8)'; ctx.lineWidth = 2; rrect(C.x + 5, C.y + 5, C.w - 10, C.h - 10, 12); ctx.stroke();
  const p = 16 * k, fs = 64 * k; face(s, C.x + p, C.y + p + 6 * k, fs);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#2a2418'; ctx.font = `${Math.round(21 * k)}px ${TF}`; ctx.fillText(s.name, C.x + p + fs + 12 * k, C.y + p + 8 * k);
  ctx.font = `700 ${Math.round(12 * k)}px ${BODY}`; ctx.fillStyle = '#7a6a50'; wrapText(`Died ${s.cause} ${s.age}`, C.w - fs - p * 2 - 12 * k).slice(0, 2).forEach((l, i) => ctx.fillText(l, C.x + p + fs + 12 * k, C.y + p + 36 * k + i * 15 * k));
  let y = C.y + p + fs + 22 * k; const w = C.w - p * 2;
  ctx.font = `900 ${Math.round(10.5 * k)}px ${BODY}`; ctx.fillStyle = '#a08850'; ctx.fillText('THE BEST THING THEY DID', C.x + p, y); y += 15 * k; y += deedRow(G, s.deeds[0], C.x + p, y, w, 'BEST', s) + 10 * k;
  ctx.font = `900 ${Math.round(10.5 * k)}px ${BODY}`; ctx.fillStyle = '#a08850'; ctx.textAlign = 'left'; ctx.fillText('THE WORST THING THEY DID', C.x + p, y); y += 15 * k; y += deedRow(G, s.deeds[1], C.x + p, y, w, 'WORST', s) + 12 * k;
  const hid = s.deeds.filter(d => d.hidden);
  ctx.textAlign = 'left'; ctx.font = `900 ${Math.round(10.5 * k)}px ${BODY}`; ctx.fillStyle = '#a08850'; ctx.fillText(hid.length ? (s.looked ? 'FROM THE BOOK OF LIFE' : `SEALED IN THE BOOK OF LIFE: ${hid.length}`) : 'NOTHING SEALED IN THE BOOK', C.x + p, y); y += 16 * k;
  if (!s.looked) hid.forEach((d, i) => { const sx = C.x + p + i * 54 * k; ctx.fillStyle = '#e8d8a8'; rrect(sx, y, 46 * k, 30 * k, 6); ctx.fill(); ctx.fillStyle = '#b8261a'; ctx.beginPath(); ctx.arc(sx + 23 * k, y + 15 * k, 7 * k, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe0d8'; ctx.font = `900 ${Math.round(9 * k)}px ${BODY}`; ctx.textAlign = 'center'; ctx.fillText('?', sx + 23 * k, y + 10 * k); ctx.textAlign = 'left'; });
  else hid.forEach((d, i) => { const yy = y + i * 22 * k, good = d.w > 0, m = mult(G, d); ctx.fillStyle = good ? 'rgba(255,236,170,.6)' : 'rgba(120,30,24,.7)'; rrect(C.x + p, yy, w, 19 * k, 5); ctx.fill(); ctx.font = `700 ${Math.round(11 * k)}px ${BODY}`; ctx.fillStyle = good ? '#3a2a08' : '#fff'; ctx.fillText(`${KINDS[d.kind]} ${d.text}${m > 1 ? '  ×2' : ''}`, C.x + p + 6 * k, yy + 3 * k); marks(d.w, good, C.x + p + w - 12 * k, yy + 10 * k, 5 * k); });
  // which way: labels when dragging
  const d = ui.drag; if (d) { const dx = d.x - d.x0, dy = d.y - d.y0, T = 60 * k, up = dy < -T && Math.abs(dy) > Math.abs(dx) * 0.8, dn = dy > T && Math.abs(dy) > Math.abs(dx) * 0.8, sd = !up && !dn && Math.abs(dx) > T;
    ctx.textAlign = 'center'; ctx.font = `${Math.round(26 * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.35)';
    if (up) { ctx.strokeText('HEAVEN', C.x + C.w / 2, C.y - 26 * k); ctx.fillStyle = '#ffe08a'; ctx.fillText('HEAVEN', C.x + C.w / 2, C.y - 26 * k); }
    if (dn) { ctx.strokeText('HELL', C.x + C.w / 2, C.y + C.h + 6 * k); ctx.fillStyle = '#ff8a6a'; ctx.fillText('HELL', C.x + C.w / 2, C.y + C.h + 6 * k); }
    if (sd) { ctx.strokeText('PURGATORY', C.x + C.w / 2, C.y + C.h / 2); ctx.fillStyle = '#e0e4ea'; ctx.fillText('PURGATORY', C.x + C.w / 2, C.y + C.h / 2); } }
}
function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const t = now; drawSky(G, t);
  if (!G) return;
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  const C = cardRect();
  // the soul being judged (dragged with the thumb), the one flying away
  if (G.soul && !ui.fly) { const d = ui.drag, dx = d ? d.x - d.x0 : 0, dy = d ? d.y - d.y0 : 0, en = ui.enter || 0; ui.enter = Math.max(0, en - 0.06); ctx.save(); ctx.translate(dx * 0.85, dy * 0.85 + en * 40 * k); ctx.rotate(dx * 0.0006); ctx.globalAlpha = 1 - en * 0.6; drawCard(G, G.soul, C, t); ctx.restore(); }
  if (ui.fly) { const f = ui.fly, u = easeOut(Math.min(1, f.t / 0.5)), dx = f.dir === 'side' ? (ui.drop && ui.drop.dx < 0 ? -1 : 1) * u * W : 0, dy = f.dir === 'up' ? -u * H * 0.8 : f.dir === 'down' ? u * H * 0.8 : 0;
    ctx.save(); ctx.globalAlpha = 1 - u; ctx.translate(dx, dy); ctx.translate(W / 2, C.y + C.h / 2); ctx.scale(1 - u * 0.4, 1 - u * 0.4); ctx.translate(-W / 2, -(C.y + C.h / 2)); drawCard(G, f.s, C, t); ctx.restore(); }
  ctx.restore();
  hud(G, t);
  // a wrong judgement: what it should have been, and why
  if (ui.bad) { const b = ui.bad, al = Math.min(1, b.t * 4, (3 - b.t) * 2), s = b.s, hid = s.deeds.filter(d => d.hidden); ctx.globalAlpha = Math.max(0, al); const bw = W - 40 * k, bh = 74 * k + hid.length * 16 * k, bx = 20 * k, by = C.y + C.h / 2 - bh / 2;
    ctx.fillStyle = 'rgba(30,16,12,.9)'; rrect(bx, by, bw, bh, 12); ctx.fill(); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffb4a8'; ctx.font = `${Math.round(18 * k)}px ${TF}`; ctx.fillText(`${s.name.split(' ')[0]} belonged in ${({ up: 'HEAVEN', down: 'HELL', side: 'PURGATORY' })[b.want]}`, W / 2, by + 10 * k);
    ctx.font = `700 ${Math.round(12 * k)}px ${BODY}`; ctx.fillStyle = '#fff'; const tot = score(G, s); ctx.fillText(G.rules.some(r => (r.id === 'young' && s.age < 12) || (r.id === 'old' && s.age > 100)) ? 'Today\'s rule sends this soul up.' : `Halos minus horns: ${tot > 0 ? '+' : ''}${tot}${s.liar ? ' (the best deed was forged)' : ''}`, W / 2, by + 38 * k);
    hid.forEach((d, i) => { ctx.fillStyle = d.w > 0 ? '#ffe08a' : '#ff9a8a'; ctx.fillText(`${d.w > 0 ? '+' : '−'}${Math.abs(d.w * mult(G, d))}  ${d.text}`, W / 2, by + 58 * k + i * 16 * k); }); ctx.globalAlpha = 1; }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t2 of TXT) { const al = t2.t < 1 ? 1 : 1 - (t2.t - 1) / 0.5; ctx.globalAlpha = Math.max(0, al); ctx.font = `${Math.round(t2.size * k)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 24); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 24); }
  ctx.globalAlpha = 1;
  if (hint) { const al = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${BODY}`; const lines = wrapText(hint.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(20,16,30,.82)'; rrect(W / 2 - w / 2, H * 0.72 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.72 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.15})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,248,220,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
}
function hud(G, t) {
  const c = G.cfg, x = 14;
  // the souls still waiting today (23 Nov 2026: no rule to count by, no sunset, no wrong gates: just where you send them)
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.font = `800 ${Math.round(12 * k)}px ${BODY}`; ctx.fillStyle = '#3a2a18';
  const waiting = (G.soul ? 1 : 0) + G.queue.length; if (!G.lesson) ctx.fillText(`👥 ${waiting} waiting`, x, 22 * k);
  ctx.textAlign = 'right'; if (!G.lesson) ctx.fillText(`☁ ${G.sent.up}   🔥 ${G.sent.down}   🌫 ${G.sent.side}`, W - 14, 22 * k);
  // the Book
  const B = bookRect(), s = G.soul, can = s && !s.looked && s.deeds.some(d => d.hidden);
  ctx.fillStyle = can ? '#6a3a1a' : 'rgba(80,60,40,.6)'; rrect(B.x, B.y, B.w, B.h, 10); ctx.fill(); ctx.strokeStyle = can ? '#e8c868' : 'rgba(232,200,104,.4)'; ctx.lineWidth = 2.5; rrect(B.x, B.y, B.w, B.h, 10); ctx.stroke();
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff3d0'; ctx.font = `800 ${Math.round(13 * k)}px ${BODY}`; ctx.fillText(`📖 THE BOOK`, B.x + B.w / 2, B.y + B.h * 0.38); ctx.font = `700 ${Math.round(10.5 * k)}px ${BODY}`; ctx.fillStyle = '#e8d8b0'; ctx.fillText(can ? 'tap to read' : 'nothing sealed', B.x + B.w / 2, B.y + B.h * 0.72);
  if (G.lesson) lessonPanel(G);
  else if (G.N <= 3 && G.judged < 2) { ctx.font = `800 ${Math.round(12 * k)}px ${BODY}`; ctx.fillStyle = 'rgba(40,30,20,.75)'; ctx.fillText('↑ HEAVEN   ·   ↓ HELL   ·   ↔ PURGATORY', W / 2, B.y - 14 * k); }
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
