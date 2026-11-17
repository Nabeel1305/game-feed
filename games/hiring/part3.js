// ===================== DRAW: the hiring desk, flat and readable (2D on purpose) =====================
// A wooden desk under a warm lamp. The three open jobs are cards pinned along the top, each with what it needs. The CV in the
// middle is a real-looking sheet: a photo, name, age, where they live, experience, certificates with their dates, driving,
// languages, when they can work, and a line about themselves. Drag it onto a job or into the bin. Right: a stamp and it flies
// into the tray. Wrong: it shakes, the card shows what was missing.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null;
const ui = { drag: null, cvY: 0, fly: null, bad: null, hover: null };
const BODY = '"Nunito", "Segoe UI", sans-serif';
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 3 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.6) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 4); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.vx *= 0.98; }
  for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.4) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  ui.cvY = Math.max(0, ui.cvY - dt * 4); if (ui.fly) { ui.fly.t += dt; if (ui.fly.t > 0.5) ui.fly = null; } if (ui.bad) { ui.bad.t += dt; if (ui.bad.t > 2.2) ui.bad = null; }
}
// where things are
function layout(G) {
  const top = 50 * k, gap = 8 * k, cw = (W - 24 - gap * 2) / 3; ctx.font = `600 ${Math.round(10.5 * k)}px ${BODY}`;
  let jh = 0; const cards = G.jobs.map((j, i) => { const lines = []; j.needs.forEach(n => wrapText('• ' + NEEDS[n.k].say(n, n), cw - 12 * k).forEach(l => lines.push(l))); jh = Math.max(jh, 30 * k + lines.length * 13.5 * k + 8 * k); return { x: 12 + i * (cw + gap), y: top, w: cw, lines, job: j }; });
  cards.forEach(c2 => c2.h = jh);
  const binH = 64 * k, bin = { x: W / 2 - 70 * k, y: H - binH - 14 * k, w: 140 * k, h: binH };
  const lp = G.lesson ? 112 * k : 0, py = top + jh + 14 * k, paper = { x: 18 * k, y: py, w: W - 36 * k, h: Math.min(bin.y - py - 14 * k - lp, 410 * k) };
  return { cards, bin, paper, lessonY: bin.y - lp - 6 * k, lessonH: lp - 8 * k };
}
function onEvent(G, e) {
  const Ly = layout(G);
  switch (e.k) {
    case 'cv': ui.cvY = 1; sfx.paper(); break;
    case 'right': { const tg = e.to < 0 ? Ly.bin : Ly.cards[e.to]; ui.fly = { cv: ui.last, to: tg, t: 0, stamp: e.to < 0 ? 'NO' : 'HIRED', from: ui.drop || { x: W / 2, y: Ly.paper.y + Ly.paper.h / 2 } }; sparks(tg.x + tg.w / 2, tg.y + tg.h / 2, 12 + Math.min(10, e.n * 2), e.to < 0 ? '#c9b8a0' : '#9be3b5'); if (e.to < 0) sfx.bin(); else sfx.stamp(e.n); vibe(HAP.light);
      if (e.n >= 3) say(`${e.n} RIGHT IN A ROW`, W / 2, Ly.paper.y + 20 * k, '#ffe08a', 18); break; }
    case 'wrong': FX.red = 0.5; FX.shake = 8; sfx.wrong(); ui.bad = { to: e.to, why: e.why, fit: e.fit, t: 0 }; say(e.to < 0 ? 'THEY FIT A JOB!' : 'WRONG JOB', W / 2, Ly.paper.y + 26 * k, '#ffb4a8', 22);
      tip('wrong', e.to < 0 ? 'Before the bin, check each job: does the CV have everything one of them asks for?' : 'The CV must have everything that job asks for', 3); break;
    case 'left': FX.red = 0.4; sfx.wrong(); say(`${e.name.toUpperCase()} GAVE UP WAITING`, W / 2, Ly.paper.y + 26 * k, '#ffb4a8', 18); tip('wait', 'Later candidates will not wait for ever: read, then decide', 3); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', W / 2, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('THE DESK IS YOURS!', W / 2, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 1; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const fmtDate = d => `${d.d} ${MON[d.m - 1]} ${d.y}`;
function face(cv, x, y, s) {
  const R = rng(cv.face), skin = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#ffdbac', '#5c3a1e'][(R() * 6) | 0], hair = ['#1b1b1b', '#3b2416', '#6a4224', '#a8742c', '#d9c08a', '#7a7a7a'][(R() * 6) | 0], shirt = `hsl(${(R() * 360) | 0},40%,${40 + R() * 25}%)`;
  ctx.save(); ctx.beginPath(); rrect(x, y, s, s * 1.2, 4); ctx.clip(); ctx.fillStyle = `hsl(${200 + R() * 40},25%,82%)`; ctx.fillRect(x, y, s, s * 1.2);
  ctx.fillStyle = shirt; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 1.25, s * 0.5, s * 0.38, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = skin; ctx.fillRect(x + s * 0.42, y + s * 0.7, s * 0.16, s * 0.2);
  if (cv.female && R() < 0.8) { ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.55, s * 0.32, s * 0.42, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.5, s * 0.24, s * 0.29, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.3, s * 0.26, s * 0.14, 0, Math.PI, TAU); ctx.fill(); if (!cv.female && R() < 0.3) { ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.66, s * 0.2, s * 0.1, 0, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = '#222'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s / 2 + sx * s * 0.09, y + s * 0.48, s * 0.025, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#6a3a2a'; ctx.lineWidth = Math.max(1, s * 0.02); ctx.beginPath(); ctx.arc(x + s / 2, y + s * 0.56, s * 0.08, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
}
// the CV sheet itself
function paperLines(cv) {
  const L = [];
  L.push(['h', 'EXPERIENCE']); for (const w of cv.work) L.push(['t', `${w.as} · ${w.yrs} year${w.yrs > 1 ? 's' : ''}`]);
  L.push(['h', 'CERTIFICATES']); if (!cv.certs.length) L.push(['t', 'None']); for (const c2 of cv.certs) L.push(['t', `${c2.name}, until ${fmtDate(c2.until)}`, !dateGE(c2.until, TODAY)]);
  L.push(['h', 'DRIVING']); L.push(['t', cv.licence ? `Full licence · ${cv.points} point${cv.points === 1 ? '' : 's'}` : 'No licence']);
  L.push(['h', 'LANGUAGES']); L.push(['t', cv.langs.join(', ')]);
  L.push(['h', 'CAN WORK']); L.push(['t', ['Weekdays'].concat(cv.avail.map(a => a[0].toUpperCase() + a.slice(1))).join(', ')]);
  return L;
}
function drawCV(G, cv, x, y, w, h, rot = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; rrect(2, 6, w, h, 4); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.12)'; rrect(-1, 3, w + 2, h + 2, 5); ctx.fill(); ctx.fillStyle = '#fbf8f0'; rrect(0, 0, w, h, 4); ctx.fill();      // a drawn shadow: a blurred one cost a slow phone a third of its time
  ctx.fillStyle = '#3a5a7a'; ctx.fillRect(0, 0, w, 5 * k);
  const ps = Math.min(64 * k, w * 0.2); face(cv, 12 * k, 14 * k, ps);
  const tx = 22 * k + ps; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#1e2a36'; ctx.font = `700 ${Math.round(19 * k)}px ${TF}`; ctx.fillText(cv.name, tx, 14 * k);
  ctx.font = `600 ${Math.round(12 * k)}px ${BODY}`; ctx.fillStyle = '#4a5560'; ctx.fillText(`Born ${MON[cv.bornM - 1]} ${cv.born} · age ${ageOf(cv)}`, tx, 40 * k); ctx.fillText(`Lives ${cv.km} km away`, tx, 56 * k);
  let ly = 14 * k + ps * 1.2 + 10 * k; const lh = Math.min(17 * k, (h - ly - 30 * k) / 12);
  for (const [kind, txt, warn] of paperLines(cv)) { if (kind === 'h') { ly += lh * 0.25; ctx.font = `800 ${Math.round(10 * k)}px ${BODY}`; ctx.fillStyle = '#3a5a7a'; ctx.fillText(txt, 14 * k, ly); ly += lh * 0.8; }
    else { ctx.font = `600 ${Math.round(13 * k)}px ${BODY}`; ctx.fillStyle = '#20262c'; ctx.fillText(txt, 22 * k, ly); ly += lh; } }
  ctx.font = `italic 600 ${Math.round(12 * k)}px ${BODY}`; ctx.fillStyle = '#6a6a6a'; ctx.fillText(`"${cv.about}"`, 14 * k, Math.min(h - 22 * k, ly + 4 * k));
  ctx.restore();
}
function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // the desk under a warm lamp
  const g0 = ctx.createRadialGradient(W * 0.5, H * 0.35, 40, W * 0.5, H * 0.45, H * 0.8); g0.addColorStop(0, '#8a5a34'); g0.addColorStop(1, '#2e1a0e'); ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.08; for (let i = 0; i < 26; i++) { ctx.fillStyle = i % 2 ? '#000' : '#fff'; ctx.fillRect(0, i * H / 26 + Math.sin(i * 7) * 6, W, 2 + (i % 3)); } ctx.globalAlpha = 1;
  const g = G || idleG(); const Ly = layout(g);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  // the jobs
  Ly.cards.forEach((c2, i) => { const hov = ui.hover === i, bad = ui.bad && ui.bad.to === i && ui.bad.t < 1.2, good = ui.bad && ui.bad.fit && ui.bad.fit[0] === i && ui.bad.t < 2;
    ctx.save(); ctx.translate(c2.x + c2.w / 2, c2.y + c2.h / 2); ctx.rotate((i - 1) * 0.012); ctx.translate(-c2.w / 2, -c2.h / 2);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; rrect(1, 3, c2.w, c2.h, 5); ctx.fill(); ctx.fillStyle = bad ? '#ffd8d0' : hov ? '#fff6c8' : good ? '#d8f5dc' : '#f4ecd6'; rrect(0, 0, c2.w, c2.h, 5); ctx.fill(); ctx.shadowColor = 'transparent';
    if (hov) { ctx.strokeStyle = '#e8a83a'; ctx.lineWidth = 3; rrect(0, 0, c2.w, c2.h, 5); ctx.stroke(); }
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(c2.w / 2, 6 * k, 4 * k, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1e2a36'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = `700 ${Math.round(13 * k)}px ${TF}`; ctx.fillText(c2.job.name, 6 * k, 12 * k);
    ctx.font = `600 ${Math.round(10.5 * k)}px ${BODY}`; ctx.fillStyle = '#33404c'; c2.lines.forEach((l, j) => ctx.fillText(l, 6 * k, 30 * k + j * 13.5 * k));
    if (bad && ui.bad.why) { ctx.fillStyle = '#c0392b'; ctx.font = `800 ${Math.round(10 * k)}px ${BODY}`; ctx.fillText(ui.bad.why.toUpperCase(), 6 * k, c2.h - 14 * k); }
    ctx.restore(); });
  // the bin
  const b = Ly.bin, hb = ui.hover === -1; ctx.fillStyle = hb ? '#6a6a6a' : '#4a4a4a'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x + b.w * 0.88, b.y + b.h); ctx.lineTo(b.x + b.w * 0.12, b.y + b.h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = hb ? '#e8a83a' : '#2a2a2a'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#ddd'; ctx.font = `800 ${Math.round(12 * k)}px ${BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BIN · FITS NONE', b.x + b.w / 2, b.y + b.h / 2);
  if (ui.bad && ui.bad.to === -1 && ui.bad.t < 1.5) { ctx.fillStyle = '#ffb4a8'; ctx.fillText(ui.bad.why.toUpperCase(), b.x + b.w / 2, b.y - 12 * k); }
  // the CV: arriving, dragged, or flying away
  const P = Ly.paper;
  if (g.cv) { ui.last = g.cv; const d = ui.drag; let x = P.x, y = P.y + ui.cvY * ui.cvY * H * 0.6, rot = 0, s = 1;
    if (d && d.moved) { x = P.x + (d.x - d.x0); y = P.y + (d.y - d.y0); rot = (d.x - d.x0) / W * 0.25; s = 0.85; }
    const w = P.w * s, h = P.h * s; drawCV(g, g.cv, x + (P.w - w) / 2, y + (P.h - h) / 2, w, h, rot);
    // a candidate who will not wait for ever
    if (g.cfg.patience && !g.lesson) { const u = 1 - g.wait / g.cfg.patience; ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(P.x, P.y - 9 * k, P.w, 5 * k, 2); ctx.fill(); ctx.fillStyle = u > 0.5 ? '#6cbf6c' : u > 0.25 ? '#e8b04a' : '#d9534f'; rrect(P.x, P.y - 9 * k, P.w * Math.max(0, u), 5 * k, 2); ctx.fill(); } }
  if (ui.fly && ui.fly.cv) { const f = ui.fly, u = easeOut(Math.min(1, f.t / 0.45)), tx = f.to.x + f.to.w / 2, ty = f.to.y + f.to.h / 2, sc = 1 - u * 0.85, w = P.w * sc, h = P.h * sc, cx = lerp(f.from.x, tx, u), cy = lerp(f.from.y, ty, u);
    drawCV(g, f.cv, cx - w / 2, cy - h / 2, w, h, u * (f.stamp === 'NO' ? 2 : 0.4), 1 - u * 0.3);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.2); ctx.globalAlpha = 1 - u * 0.5; ctx.strokeStyle = f.stamp === 'NO' ? '#8a8a8a' : '#2e8b57'; ctx.lineWidth = 4 * sc; ctx.font = `800 ${Math.round(34 * k * sc)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeText(f.stamp, 0, 0); ctx.restore(); }
  for (const p of PT) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * k, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.restore();
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of TXT) { const a = t.t < 1.0 ? 1 : 1 - (t.t - 1.0) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t.size * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.txt, t.x, t.y - t.t * 26); ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y - t.t * 26); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, hh = lines.length * lh + 16 * k, ww = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30;
    ctx.fillStyle = 'rgba(0,0,0,.72)'; rrect(W / 2 - ww / 2, H * 0.55 - hh / 2, ww, hh, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.55 - hh / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
let IG = null; function idleG() { if (!IG) { IG = newGame(Math.max(3, store.get('level', 1) | 0), { seed: 7 }); nextCV(IG); } return IG; }
function hud(G) {
  const c = G.cfg;
  ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = '#f4e6c8';
  ctx.textAlign = 'right'; ctx.fillText(`TODAY: ${fmtDate(TODAY).toUpperCase()}`, W - 14, 24 * k);
  if (!G.lesson) { ctx.textAlign = 'left'; ctx.fillText(`CV ${Math.min(G.done + 1, c.cvs)} OF ${c.cvs}`, 14, 24 * k); ctx.fillStyle = '#ff8a7a'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillText('♥'.repeat(Math.max(0, G.lives)) + '♡'.repeat(Math.max(0, c.lives - G.lives)), 82 * k, 24 * k); }
  else lessonPanel(G);
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {      // the lesson on now, over the CV's lower half
  const D = G.lesson, st = D.steps[D.i], x = 16, w = W - 32; ctx.save();
  const Ly = layout(G); ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), y = Ly.lessonY, h = Ly.lessonH;
  ctx.fillStyle = 'rgba(0,0,0,.8)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 24 * k);
  ctx.font = `700 ${Math.round(12.5 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.88)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 44 * k + i * 15 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
