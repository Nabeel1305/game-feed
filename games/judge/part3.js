// ===================== DRAW + JUICE: the courtroom (2D on purpose: papers and words read best flat) =====================
// The top of the screen is the court seen from the bench: oak panelling, the scales of justice over the dock, the defendant
// standing in the dock (looking down; head up and relieved, or slumped, as you sentence), and the public gallery behind,
// who react to every sentence (nods, gasps at a harsh one, boos at a soft one, a puzzled murmur at nonsense). The gavel comes
// down on every sentence. The case file and the sentence box below are the page's own (part1), filled in here.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, gavelT = 9, galT = 9, gal = 'nod', bgC = null;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2); gavelT += dt; galT += dt;
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.6) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// the case file: who, what, the things that make it worse or better, the victim, the law
function renderCase(G) { if (HEADLESS || !G || !G.case) return; const K = G.case, c = G.cfg, st = lessonNow(G), guide = upLv('book');
  const w = d => guide ? ` <small>(${Math.abs(d) >= 9 ? 'big' : Math.abs(d) >= 6 ? 'real' : 'small'})</small>` : '';
  const ch = K.facts.map(f => `<span class="chip ${f.d > 0 ? 'agg' : 'mit'}">${f.d > 0 ? '⚠' : '✓'} ${esc(f.t)}${w(f.d)}</span>`).join('');
  const lo = Math.max(1, K.centre - K.facts.reduce((a, f) => a + f.d, 0)), off = OFF.find(o => o.id === K.off);
  $('caseCard').innerHTML = (st ? `<div class="lesson">LESSON · ${st.title} · ${G.lesson.n} of ${st.need}<br><span style="font-weight:600">${esc(st.how)}</span></div>` : '')
    + `<h3>R v ${esc(K.who)}</h3><div class="off">${esc(K.name)}${K.complex ? ' · a hard case' : ''}</div><div class="meta">${K.age}, ${esc(K.job)} · ${esc(K.plea)}${c.free ? '' : ` · case ${Math.min(c.cases, G.done.length + 1)} of ${c.cases}`}</div>`
    + `<p>${esc(K.first)} ${esc(K.what)}.</p>` + (ch ? `<div>${ch}</div>` : '<div class="chip mit" style="opacity:.7">Nothing special either way</div>')
    + (K.victim ? `<p class="vic">${esc(K.victim)}</p>` : '')
    + `<div class="law">⚖ Maximum: ${K.mand ? 'life imprisonment is mandatory' : K.max === Infinity ? 'life imprisonment' : K.max === 0 ? 'no prison (fine or community order)' : fmtM(K.max) + ' in prison'}${K.money && K.loss ? ` · the victim lost £${K.loss.toLocaleString()}` : ''}${K.drive ? ' · a driving ban is usual' : ''}`
    + (upLv('clerk') ? `<br>Usual for a first offender: ${rangeWords(off.c - off.w * 0.6, off.c + off.w * 0.6)}` : '') + '</div>';
  $('caseCard').scrollTop = 0; $('sentText').value = ''; setPhase('write'); }
function setPhase(p) { const w = p === 'write'; $('sentText').classList.toggle('hidden', !w); $('sentRow').classList.toggle('hidden', !w); $('readBack').classList.toggle('hidden', w); $('readRow').classList.toggle('hidden', w || p === 'wait'); $('passBtn').disabled = false; }
// how the game reacts
function onEvent(G, e) { const cx = W / 2, top = sceneH();
  switch (e.k) {
    case 'start': if (!G.cfg.free) say(`${PLACES[G.place].name.toUpperCase()}`, cx, top * 0.55, '#ffe3a0', 18); sfx.rise(); break;
    case 'case': renderCase(G); sfx.paper(); break;
    case 'gavel': gavelT = 0; galT = 0; gal = e.gal; FX.shake = 6; sfx.gavel(); vibe(HAP.light); setTimeout(() => sfx.gallery(e.gal), 220);
      say({ nod: 'The gallery nods.', gasp: 'A gasp from the gallery.', boo: 'Boos from the gallery.', puzzled: 'Puzzled murmurs.', horror: 'Uproar!' }[e.gal], cx, top * 0.78, e.gal === 'nod' ? '#ccf2d4' : '#ffd0c4', 15);
      setPhase('wait'); $('readBack').innerHTML = '<b>Sentence passed.</b> ' + esc(G.done.length ? G.done[G.done.length - 1].read : ''); break;
    case 'lessonnext': if (e.first) hint = null; sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, cx, top * 0.5, '#9be3b5', 22); sfx.coin(e.n); break;
    case 'lessonmiss': say('THE COUNCIL SAYS:', cx, top * 0.42, '#ffd0c4', 16); hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('NOW, YOUR COURT.', cx, top * 0.5, '#ffd36a', 22); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'council': sfx.council(); break;
    case 'won': FX.flash = 0.6; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  }
}
const sceneH = () => H * 0.34;
function area() { return { x: 0, y: 0, w: W, h: sceneH() }; }
// the still parts of the court, drawn once per size into an offscreen canvas (LESSONS: no shadowBlur, cache the background)
function courtBg() { const w = Math.round(W * DPR), h = Math.round(sceneH() * DPR); if (bgC && bgC.width === w && bgC.height === h) return bgC; bgC = document.createElement('canvas'); bgC.width = w; bgC.height = h; const g = bgC.getContext('2d'); g.scale(DPR, DPR); const SH = sceneH();
  const gr = g.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#3a2414'); gr.addColorStop(1, '#5a3a20'); g.fillStyle = gr; g.fillRect(0, 0, W, SH);
  for (let x = 0; x < W; x += 52) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, 0, 3, SH); g.strokeStyle = 'rgba(255,220,170,.08)'; g.strokeRect(x + 10, SH * 0.12, 32, SH * 0.3); }
  g.fillStyle = '#2a1a0e'; g.fillRect(0, SH * 0.5, W, SH * 0.5); g.fillStyle = 'rgba(255,220,170,.06)'; g.fillRect(0, SH * 0.5, W, 3);
  // the scales of justice, gilt, over the dock
  const cx = W / 2, cy = SH * 0.17, s = Math.min(W, 500) / 390; g.strokeStyle = '#d8a84a'; g.fillStyle = '#d8a84a'; g.lineWidth = 3 * s;
  g.beginPath(); g.moveTo(cx, cy - 16 * s); g.lineTo(cx, cy + 22 * s); g.moveTo(cx - 34 * s, cy - 8 * s); g.lineTo(cx + 34 * s, cy - 8 * s); g.stroke();
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 34 * s, cy - 8 * s); g.lineTo(cx + sx * 26 * s, cy + 8 * s); g.moveTo(cx + sx * 34 * s, cy - 8 * s); g.lineTo(cx + sx * 42 * s, cy + 8 * s); g.stroke(); g.beginPath(); g.ellipse(cx + sx * 34 * s, cy + 9 * s, 10 * s, 3.5 * s, 0, 0, Math.PI); g.fill(); }
  g.beginPath(); g.arc(cx, cy - 18 * s, 4 * s, 0, TAU); g.fill(); g.fillRect(cx - 12 * s, cy + 22 * s, 24 * s, 4 * s);
  return bgC; }
function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#1a120c'; ctx.fillRect(0, 0, W, H);
  const SH = sceneH(); ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  ctx.drawImage(courtBg(), 0, 0, W, SH); const t = now, s = Math.min(W, 500) / 390, g = G;
  // the public gallery: a row of heads behind a rail, reacting
  for (let i = 0; i < 9; i++) { const x = W * (0.06 + i * 0.11), base = SH * 0.5, r = 11 * s, react = galT < 2.2 ? gal : 'idle', ph = i * 1.7;
    let dy = Math.sin(t * 1.3 + ph) * 1.5; if (react === 'nod') dy += Math.sin(galT * 12 + ph) * 3 * Math.max(0, 1 - galT / 2); if (react === 'gasp' || react === 'horror') dy -= 6 * Math.max(0, 1 - galT / 2); if (react === 'boo') dy += Math.sin(galT * 20 + ph) * 2;
    ctx.fillStyle = ['#c69a7a', '#8a5a3a', '#f0c8a8', '#5a3a2a', '#d8a888'][i % 5]; ctx.beginPath(); ctx.arc(x, base - r + dy, r, 0, TAU); ctx.fill(); ctx.fillStyle = ['#3a3a5a', '#5a2a2a', '#2a4a3a', '#4a3a2a'][i % 4]; rrect(x - r * 1.3, base + dy * 0.3, r * 2.6, r * 2, 6); ctx.fill();
    if (galT < 2.2 && (react === 'boo' || react === 'horror') && i % 3 === 0) { ctx.fillStyle = '#ffb4a8'; ctx.font = `800 ${Math.round(11 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(react === 'boo' ? 'BOO!' : '!!', x, base - r * 2.6 + dy); } }
  ctx.fillStyle = '#4a2e18'; ctx.fillRect(0, SH * 0.5 + 18 * s, W, 8 * s);
  // the dock and the defendant
  const dx = W / 2, dy0 = SH * 0.95; ctx.fillStyle = '#6a4424'; rrect(dx - 70 * s, dy0 - 30 * s, 140 * s, 34 * s, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,220,170,.12)'; ctx.fillRect(dx - 70 * s, dy0 - 30 * s, 140 * s, 3);
  if (g && g.case) { const after = gavelT < 1.6, slump = after && gal !== 'nod' && gal !== 'puzzled' ? 1 : 0, lift = after && gal === 'nod' ? 1 : 0, by = dy0 - 30 * s + slump * 4 * s - lift * 2 * s;
    ctx.fillStyle = '#2c3446'; rrect(dx - 26 * s, by - 34 * s, 52 * s, 40 * s, 12); ctx.fill(); ctx.fillStyle = '#e0b898'; ctx.beginPath(); ctx.arc(dx, by - 46 * s + slump * 5 * s, 14 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(dx, by - 50 * s + slump * 5 * s, 14 * s, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#ffe3a0'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(g.case.who.toUpperCase(), dx, dy0 - 12 * s); }
  // the gavel, top right: comes down on each sentence
  { const gx = W - 52 * s, gy = SH * 0.2, a = gavelT < 0.12 ? -0.9 + gavelT / 0.12 * 1.3 : gavelT < 0.5 ? 0.4 - (gavelT - 0.12) * 1.2 : -0.06; ctx.save(); ctx.translate(gx, gy + 26 * s); ctx.fillStyle = '#5a3218'; rrect(-20 * s, 18 * s, 40 * s, 9 * s, 3); ctx.fill(); ctx.rotate(a);
    ctx.fillStyle = '#8a5428'; ctx.fillRect(-3 * s, -40 * s, 6 * s, 40 * s); ctx.fillStyle = '#6a3a18'; rrect(-15 * s, -52 * s, 30 * s, 16 * s, 4); ctx.fill(); ctx.restore(); if (gavelT < 0.2) sparks(gx, gy + 44 * s, 1, '#ffd36a', 120); }
  for (const p of PT) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  if (g) hud(g);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const q of TXT) { const a = q.t < 1.2 ? 1 : 1 - (q.t - 1.2) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(q.size * s)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(q.txt, q.x, q.y - q.t * 10); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y - q.t * 10); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = Math.min(W - 20, Math.max(...lines.map(l => ctx.measureText(l).width)) + 24);
    ctx.fillStyle = 'rgba(20,12,6,.92)'; rrect(W / 2 - ww / 2, SH * 0.36 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, SH * 0.36 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); }
}
function hud(G) { const c = G.cfg, s = Math.min(W, 500) / 390; if (G.lesson) return; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(20,12,6,.65)'; rrect(8, 44 * s, 132 * s, 30 * s, 10); ctx.fill(); ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.textAlign = 'left'; ctx.fillStyle = '#ffe3a0';
  ctx.fillText(c.free ? 'FREE BENCH · no council' : `CASE ${Math.min(c.cases, G.done.length + 1)} OF ${c.cases} · PASS ${c.pass}`, 16, 59 * s);
  if (!c.free) for (let i = 0; i < c.cases; i++) { ctx.fillStyle = i < G.done.length ? '#e8b85a' : 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(W - 20 - (c.cases - 1 - i) * 14 * s, 59 * s, 4.5 * s, 0, TAU); ctx.fill(); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel() {}
