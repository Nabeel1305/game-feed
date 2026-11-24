// ===================== THE VIEW: Memory Lane (2D: a clean card, big things, nothing else to look at) =====================
// One scene card in the middle of the screen, drawn in its theme (a desk, a tea tray, windows in a street, a shop shelf, a
// picnic blanket, a rock pool). Above it what to remember; below it the answers (a grid of things, the tray of things to put
// back, GOT IT, NEXT). After each answer two small cards side by side: what was there, and your answer, with rings.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null;
const ui = { drag: null, pop: {} };
const EMO = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
function sparks(x, y, n, col, sp = 220) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, t: 0, col, r: 2 + Math.random() * 2 }); } if (PT.length > 200) PT.splice(0, PT.length - 200); }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.8) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.vx *= 0.98; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.2) TXT.shift(); for (const k2 in ui.pop) { ui.pop[k2] -= dt * 4; if (ui.pop[k2] <= 0) delete ui.pop[k2]; }
  if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; } }
const TYPE_ICON = { which: '👀', place: '📍', order: '🎵', missing: '❓', changed: '🔍' };
function onEvent(G, e) { const L = lay(G);
  switch (e.k) {
    case 'round': sfx.card(); if (G.round && !G.lesson && G.N >= 4) tip('t_' + e.type, { missing: "New: WHAT'S MISSING? Remember everything: one thing will be gone.", changed: 'New: WHAT CHANGED? Remember everything: one thing will be different (or two will swap places).', place: 'Remember WHERE each thing is.', order: 'Remember the ORDER they light up.', which: 'Remember WHICH things are there.' }[e.type], 3); break;
    case 'show': sfx.open(); break;
    case 'cover': sfx.cover(); vibe(HAP.tick); break;
    case 'ask': sfx.ask(); break;
    case 'note': { sfx.note(e.i, e.ok === false); if (e.ok !== false) ui.pop['s' + (G.round.items[e.i] ? G.round.items[e.i].slot : 0)] = 1; break; }
    case 'pick': sfx.pick(); vibe(HAP.tick); break;
    case 'unpick': sfx.unpick(); break;
    case 'grab': sfx.pick(); break;
    case 'drop': sfx.drop(); vibe(HAP.tick); break;
    case 'answer': { const good = e.score >= 0.999; good ? sfx.right(G.scores.length) : e.score > 0 ? sfx.half() : sfx.wrong(); vibe(HAP.light); if (good) { sparks(W / 2, L.card.y + L.card.s / 2, 22, '#ffd36a'); FX.flash = 0.6; }
      say(good ? ['PERFECT!', 'SPOT ON!', 'YES!', 'SHARP!'][G.scores.length % 4] : e.score > 0 ? `${Math.round(e.score * 100)}%` : 'NOT QUITE', W / 2, L.card.y - 4 * k, good ? '#ffd36a' : '#ffd0c4', 26); if (e.bonus) say(`+${e.bonus} QUICK`, W / 2, L.card.y + 26 * k, '#9be3b5', 16); break; }
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', W / 2, H * 0.45, '#ffd36a', 24); sfx.ask(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.42, '#9be3b5', 24); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU KNOW IT. NOW PLAY!', W / 2, H * 0.42, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 1; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;
  } }
function area() { return { x: 0, y: 0, w: W, h: H }; }
// ---------- the layout (used for drawing and for touches) ----------
function lay(G) { const r = G && G.round, top = (G && G.lesson ? 150 : 104) * k, s = Math.min(W - 28, H * 0.47), card = { x: (W - s) / 2, y: top, s }, pad = s * 0.08, below = top + s + 14 * k;
  const out = { card, pad, below, slots: [], opts: [], tray: [], btn: null };
  if (!r) return out; const g = r.grid, cell = (s - 2 * pad) / Math.max(g.cols, g.rows), cw = (s - 2 * pad) / g.cols, ch = (s - 2 * pad) / g.rows; out.cell = Math.min(cw, ch);
  r.slots.forEach(sl => out.slots.push({ x: card.x + pad + sl.x * (s - 2 * pad), y: card.y + pad + sl.y * (s - 2 * pad), r: Math.min(cw, ch) * 0.42 }));
  const n2 = r.opts ? r.opts.length : r.type === 'place' ? r.items.length : 0;
  if (n2) { const per = n2 <= 4 ? n2 : n2 <= 8 ? 4 : 5, rows = Math.ceil(n2 / per), bw = Math.min(84 * k, (W - 24 - (per - 1) * 8 * k) / per), bh = Math.min(bw, (H - below - 86 * k - (rows - 1) * 8 * k) / rows);
    for (let i = 0; i < n2; i++) { const row = Math.floor(i / per), inRow = Math.min(per, n2 - row * per), c = i % per, x0 = (W - inRow * bw - (inRow - 1) * 8 * k) / 2; const q = { x: x0 + c * (bw + 8 * k), y: below + row * (bh + 8 * k), w: bw, h: bh }; (r.opts ? out.opts : out.tray).push(q); } }
  const by = H - 74 * k; out.btn = { x: W / 2 - 100 * k, y: by, w: 200 * k, h: 54 * k };
  out.review = { a: { x: 12, y: top + 30 * k, s: (W - 36) / 2 }, b: { x: 24 + (W - 36) / 2, y: top + 30 * k, s: (W - 36) / 2 } };
  return out; }
// the touch: what it means now (part5 calls this)
function touchAt(G, x, y, kind) { if (!G || !G.round || G.over) return; const r = G.round, L = lay(G), inR = (q, p = 6) => q && x >= q.x - p && x <= q.x + q.w + p && y >= q.y - p && y <= q.y + q.h + p;
  const slotAt = () => { let b = null, bd = 1e9; L.slots.forEach((s, i) => { const d = Math.hypot(s.x - x, s.y - y); if (d < Math.max(s.r * 1.25, 26 * k) && d < bd) { bd = d; b = i; } }); return b; };
  if (kind === 'up') { if (ui.drag) { const d = ui.drag; ui.drag = null; const s = slotAt(); if (s != null) place(G, d.k, s); else if (Math.hypot(x - d.x0, y - d.y0) < 12 * k) {} else { r.sel = null; } } return; }
  if (r.phase === 'brief' || r.phase === 'review') { cont(G); return; }
  if (r.phase === 'show') { if (inR(L.btn)) cont(G); return; }
  if (r.phase !== 'ask') return;
  if (r.opts) { const k2 = L.opts.findIndex(q => inR(q)); if (k2 >= 0) choose(G, k2); return; }
  if (r.type === 'place') { const t2 = L.tray.findIndex((q, i) => inR(q) && r.placed[i] == null); if (t2 >= 0) { grab(G, t2); ui.drag = { k: t2, x0: x, y0: y, x, y }; return; }
    const s = slotAt(); if (s != null) { if (r.sel != null) place(G, r.sel, s); else { const k3 = Object.keys(r.placed).find(q => r.placed[q] === s); if (k3 != null) { delete r.placed[k3]; grab(G, +k3); ui.drag = { k: +k3, x0: x, y0: y, x, y }; } } } return; }
  const s = slotAt(); if (s != null) tapSlot(G, s); }
// ---------- drawing ----------
const THEME_BG = {
  desk: (x, y, s) => { const g = ctx.createLinearGradient(x, y, x, y + s); g.addColorStop(0, '#c8955e'); g.addColorStop(1, '#a8743e'); ctx.fillStyle = g; rrect(x, y, s, s, 22 * k); ctx.fill(); ctx.strokeStyle = 'rgba(90,50,20,.25)'; ctx.lineWidth = 2; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + 10, y + i * s / 6); ctx.lineTo(x + s - 10, y + i * s / 6 + 4); ctx.stroke(); } },
  tray: (x, y, s) => { ctx.fillStyle = '#f4ead8'; rrect(x, y, s, s, 22 * k); ctx.fill(); ctx.fillStyle = '#d0d6dc'; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s / 2, s * 0.47, s * 0.47, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8ecef'; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s / 2, s * 0.43, s * 0.43, 0, 0, TAU); ctx.fill(); },
  windows: (x, y, s) => { ctx.fillStyle = '#d8846a'; rrect(x, y, s, s, 22 * k); ctx.fill(); ctx.fillStyle = 'rgba(120,50,30,.25)'; for (let r2 = 0; r2 < 16; r2++) for (let c = 0; c < 8; c++) ctx.fillRect(x + c * s / 8 + (r2 % 2) * s / 16 + 2, y + r2 * s / 16 + 2, s / 8 - 4, s / 16 - 4); },
  shelf: (x, y, s) => { ctx.fillStyle = '#7ab0c8'; rrect(x, y, s, s, 22 * k); ctx.fill(); },
  picnic: (x, y, s) => { ctx.fillStyle = '#fff4f0'; rrect(x, y, s, s, 22 * k); ctx.fill(); ctx.save(); rrect(x, y, s, s, 22 * k); ctx.clip(); ctx.fillStyle = 'rgba(230,80,80,.35)'; for (let i = 0; i < 8; i++) { ctx.fillRect(x + i * s / 8, y, s / 16, s); ctx.fillRect(x, y + i * s / 8, s, s / 16); } ctx.restore(); },
  pool: (x, y, s) => { ctx.fillStyle = '#e8d8a8'; rrect(x, y, s, s, 22 * k); ctx.fill(); const g = ctx.createRadialGradient(x + s / 2, y + s / 2, s * 0.1, x + s / 2, y + s / 2, s * 0.5); g.addColorStop(0, '#7ad8e8'); g.addColorStop(1, '#3a98c8'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s / 2, s * 0.45, s * 0.44, 0, 0, TAU); ctx.fill(); },
};
function sceneBox(r, x, y, s, cells) { const th = r.theme.id; (THEME_BG[th] || THEME_BG.desk)(x, y, s);
  if (th === 'windows' || th === 'shelf') { const pad = s * 0.08; cells.forEach(c => { if (th === 'windows') { ctx.fillStyle = '#2a3a58'; rrect(c.x - c.r * 1.05, c.y - c.r * 1.05, c.r * 2.1, c.r * 2.1, 6); ctx.fill(); ctx.fillStyle = '#ffe9a8'; rrect(c.x - c.r * 0.95, c.y - c.r * 0.95, c.r * 1.9, c.r * 1.9, 5); ctx.fill(); }
    else { ctx.fillStyle = '#5a3a22'; ctx.fillRect(c.x - c.r * 1.3, c.y + c.r * 0.82, c.r * 2.6, 6 * k); } }); } }
function drawItem(it, x, y, r, a = 1, sc = 1) { if (!it) return; ctx.globalAlpha = a; ctx.fillStyle = PLATES[it.c] || PLATES[0]; ctx.beginPath(); ctx.arc(x, y, r * 0.92 * sc, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2; ctx.stroke();
  const px = Math.round(r * 1.12 * sc * DPR), spr = emoSprite(FAM[it.f][it.v][0], px); ctx.drawImage(spr, x - spr.width / DPR / 2, y + r * 0.06 - spr.height / DPR / 2, spr.width / DPR, spr.height / DPR); ctx.globalAlpha = 1; }
const EMO_CACHE = new Map();      // each emoji drawn once per size, then copied (emoji text is slow to draw on phones)
function emoSprite(e, px) { px = Math.max(8, px - px % 2); const key = e + '|' + px; let c = EMO_CACHE.get(key); if (c) return c; c = document.createElement('canvas'); c.width = c.height = Math.ceil(px * 1.35); const g = c.getContext('2d'); g.font = `${px}px ${EMO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, c.width / 2, c.height / 2); if (EMO_CACHE.size > 400) EMO_CACHE.clear(); EMO_CACHE.set(key, c); return c; }
function ring(x, y, r, col, w = 4) { ctx.strokeStyle = col; ctx.lineWidth = w * k; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
function miniScene(r, box, which) { const s = box.s, pad = s * 0.08, cells = r.slots.map(sl => ({ x: box.x + pad + sl.x * (s - 2 * pad), y: box.y + pad + sl.y * (s - 2 * pad), r: (s - 2 * pad) / Math.max(r.grid.cols, r.grid.rows) * 0.4 }));
  sceneBox(r, box.x, box.y, s, cells);
  cells.forEach((c, i) => { const orig = r.slots[i].it;
    if (which === 'orig') { if (r.type === 'changed') drawItem(orig, c.x, c.y, c.r); else drawItem(orig, c.x, c.y, c.r, r.type === 'missing' && orig === r.gone ? 1 : 1);
      if (r.type === 'missing' && orig === r.gone) ring(c.x, c.y, c.r * 1.1, '#ffd36a'); if (r.type === 'changed' && r.changed.includes(i)) ring(c.x, c.y, c.r * 1.1, '#ffd36a');
      if (r.type === 'order' && orig) { const n = r.seq.indexOf(orig) + 1; badge(c.x + c.r * 0.7, c.y - c.r * 0.7, n, '#ffd36a'); } }
    else { // your answer
      if (r.type === 'place') { const k2 = Object.keys(r.placed).find(q => r.placed[q] === i); if (k2 != null) { const it = r.items[k2], ok = it.slot === i; drawItem(it, c.x, c.y, c.r); ring(c.x, c.y, c.r * 1.1, ok ? '#8fe0ab' : '#ff6a5a'); } else if (orig) { ctx.setLineDash([4, 4]); ring(c.x, c.y, c.r, 'rgba(255,90,80,.8)', 2); ctx.setLineDash([]); } }
      else if (r.type === 'changed') { drawItem(r.after[i], c.x, c.y, c.r); if (r.ans === i) ring(c.x, c.y, c.r * 1.1, r.changed.includes(i) ? '#8fe0ab' : '#ff6a5a'); }
      else if (r.type === 'missing') { drawItem(orig === r.gone ? null : orig, c.x, c.y, c.r); if (orig === r.gone) { const o = r.opts[r.ans]; if (o) { drawItem(o.it, c.x, c.y, c.r, 0.9); ring(c.x, c.y, c.r * 1.1, o.yes ? '#8fe0ab' : '#ff6a5a'); } } }
      else if (r.type === 'order') { drawItem(orig, c.x, c.y, c.r, 0.6); const n = r.picks.indexOf(i); if (n >= 0) badge(c.x + c.r * 0.7, c.y - c.r * 0.7, n + 1, r.wrongAt === n ? '#ff6a5a' : '#8fe0ab'); } } });
  if (which === 'you' && r.type === 'which') { const chosen = r.opts.filter(o => o.on); const per = Math.ceil(Math.sqrt(chosen.length)), cs = (s - 2 * pad) / Math.max(per, 1); ctx.fillStyle = 'rgba(16,20,31,.55)'; rrect(box.x, box.y, s, s, 22 * k); ctx.fill();
    chosen.forEach((o, i) => { const x = box.x + pad + (i % per + 0.5) * cs, y = box.y + pad + (Math.floor(i / per) + 0.5) * cs; drawItem(o.it, x, y, cs * 0.38); ring(x, y, cs * 0.42, o.yes ? '#8fe0ab' : '#ff6a5a'); }); } }
function badge(x, y, n, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 11 * k, 0, TAU); ctx.fill(); ctx.fillStyle = '#10141f'; ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n, x, y + 1); }
function button(q, txt, col = '#f2b84b', on = true) { ctx.globalAlpha = on ? 1 : 0.45; ctx.fillStyle = col; rrect(q.x, q.y, q.w, q.h, 14 * k); ctx.fill(); ctx.fillStyle = '#1d1204'; ctx.font = `600 ${Math.round(20 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, q.x + q.w / 2, q.y + q.h / 2 + 1); ctx.globalAlpha = 1; }
let IG = null; function idleG() { if (!IG || IG.over || IG.t > 60) { IG = newGame(6 + ((Math.random() * 10) | 0), { seed: (Math.random() * 1e6) | 0, mini: true }); IG.mem = {}; } honest(IG, { react: 0.6, acc: 0.95 }, IG.mem); step(IG, 1 / 60); IG.ev.length = 0; return IG; }
function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const g0 = ctx.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#1c2440'); g0.addColorStop(1, '#10141f'); ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(255,255,255,${0.03 + 0.02 * Math.sin(now * 0.6 + i)})`; ctx.beginPath(); ctx.arc((i * 97) % W, (i * 173 + now * 8) % H, 30 + (i * 13) % 40, 0, TAU); ctx.fill(); }
  const g = G || (!$('ovHome').classList.contains('hidden') ? idleG() : null); if (!g || !g.round) return;
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  const r = g.round, L = lay(g), c = L.card;
  if (r.phase === 'review') { const a = L.review.a, b = L.review.b; ctx.font = `600 ${Math.round(15 * k)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9b8'; ctx.fillText('WHAT WAS THERE', a.x + a.s / 2, a.y - 14 * k); ctx.fillText('YOUR ANSWER', b.x + b.s / 2, b.y - 14 * k);
    miniScene(r, a, 'orig'); miniScene(r, b, 'you');
    const pct = Math.round(r.score * 100); ctx.font = `600 ${Math.round(30 * k)}px ${TF}`; ctx.fillStyle = r.score >= 0.999 ? '#ffd36a' : '#ffd0c4'; ctx.fillText(r.score >= 0.999 ? 'ALL RIGHT!' : r.type === 'order' ? `${r.picks.length - (r.wrongAt != null ? 1 : 0)} OF ${r.n} IN ORDER` : `${pct}% RIGHT`, W / 2, a.y + a.s + 40 * k);
    ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; const why = reviewWhy(r); wrapText(why, W - 40).forEach((l, i) => ctx.fillText(l, W / 2, a.y + a.s + 74 * k + i * 18 * k));
    button(L.btn, g.ri + 1 >= g.cfg.rounds && !g.lesson ? 'SEE THE RESULT ›' : 'NEXT ›'); }
  else {
    // the card: the scene, or the curtain over it
    const cells = L.slots.map((p, i) => ({ x: p.x, y: p.y, r: p.r })); sceneBox(r, c.x, c.y, c.s, cells);
    const covered = r.phase === 'brief' || r.phase === 'cover' || (r.phase === 'ask' && (r.type === 'which'));
    if (r.phase === 'show') { cells.forEach((p, i) => { const it = r.slots[i].it; if (!it) return; if (r.type === 'order') { const lit = r.seq[r.lit] === it, pop = ui.pop['s' + i] || 0; drawItem(it, p.x, p.y, p.r, lit ? 1 : 0.28, 1 + 0.18 * Math.round(pop * 4) / 4); if (lit) ring(p.x, p.y, p.r * 1.12, '#ffd36a', 5); } else drawItem(it, p.x, p.y, p.r); });
      const f = r.type === 'order' ? 0 : 1 - r.t / r.view; if (r.type !== 'order') { ctx.fillStyle = 'rgba(255,255,255,.25)'; rrect(c.x + 20, c.y + c.s - 14 * k, c.s - 40, 6 * k, 3 * k); ctx.fill(); ctx.fillStyle = '#ffd36a'; rrect(c.x + 20, c.y + c.s - 14 * k, (c.s - 40) * clamp(f, 0, 1), 6 * k, 3 * k); ctx.fill(); }
      ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.textAlign = 'center'; wrapText(r.story, W - 40).forEach((l, i) => ctx.fillText(l, W / 2, L.below + 14 * k + i * 19 * k));
      if (r.type !== 'order') button(L.btn, 'GOT IT', '#f2b84b', r.t > 0.6); else { ctx.font = `600 ${Math.round(18 * k)}px ${TF}`; ctx.fillStyle = '#ffe9b8'; ctx.fillText(`WATCH: ${Math.min(r.n, r.lit + 1)} OF ${r.n}`, W / 2, L.btn.y + L.btn.h / 2); } }
    if (r.phase === 'ask') {
      if (r.type === 'place') cells.forEach((p, i) => { const k2 = Object.keys(r.placed).find(q => r.placed[q] === i); if (k2 != null && !(ui.drag && ui.drag.k === +k2)) drawItem(r.items[k2], p.x, p.y, p.r); else { ctx.setLineDash([6, 5]); ring(p.x, p.y, p.r * 0.92, 'rgba(255,255,255,.7)', 2.5); ctx.setLineDash([]); } });
      if (r.type === 'order') cells.forEach((p, i) => { const it = r.slots[i].it, n = r.picks.indexOf(i), pop = ui.pop['s' + i] || 0; drawItem(it, p.x, p.y, p.r, 1, 1 + 0.15 * Math.round(pop * 4) / 4); if (n >= 0) badge(p.x + p.r * 0.7, p.y - p.r * 0.7, n + 1, '#ffd36a'); });
      if (r.type === 'missing') cells.forEach((p, i) => { const it = r.slots[i].it; if (it && it !== r.gone) drawItem(it, p.x, p.y, p.r); else if (it === r.gone) { ctx.setLineDash([6, 5]); ring(p.x, p.y, p.r * 0.92, 'rgba(255,255,255,.8)', 2.5); ctx.setLineDash([]); ctx.font = `600 ${Math.round(p.r)}px ${TF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('?', p.x, p.y); } });
      if (r.type === 'changed') cells.forEach((p, i) => drawItem(r.after[i], p.x, p.y, p.r));
      // the answers below the card
      if (r.opts) L.opts.forEach((q, i) => { const o = r.opts[i]; ctx.fillStyle = o.on ? '#ffd36a' : 'rgba(255,255,255,.12)'; rrect(q.x, q.y, q.w, q.h, 14 * k); ctx.fill(); drawItem(o.it, q.x + q.w / 2, q.y + q.h / 2, Math.min(q.w, q.h) * 0.4); });
      if (r.type === 'place') L.tray.forEach((q, i) => { const done = r.placed[i] != null; ctx.fillStyle = r.sel === i ? '#ffd36a' : 'rgba(255,255,255,.12)'; rrect(q.x, q.y, q.w, q.h, 14 * k); ctx.fill(); if (!done && !(ui.drag && ui.drag.k === i)) drawItem(r.items[i], q.x + q.w / 2, q.y + q.h / 2, Math.min(q.w, q.h) * 0.4); });
      const say2 = r.type === 'which' ? `TAP THE ${r.n} YOU SAW · ${r.opts.filter(o => o.on).length} OF ${r.n}` : r.type === 'place' ? 'DRAG EACH ONE TO ITS PLACE' : r.type === 'order' ? `TAP THEM IN ORDER · ${r.picks.length} OF ${r.n}` : r.type === 'missing' ? 'WHICH ONE IS MISSING?' : 'TAP THE ONE THAT CHANGED';
      ctx.font = `600 ${Math.round(17 * k)}px ${TF}`; ctx.fillStyle = '#ffe9b8'; ctx.textAlign = 'center'; ctx.fillText(say2, W / 2, r.opts || r.type === 'place' ? H - 34 * k : L.below + 26 * k);
      if (ui.drag) { const d = ui.drag; drawItem(r.items[d.k], d.x, d.y - 30 * k, L.cell * 0.42, 0.95, 1.1); } }
    if (covered) { const f = r.phase === 'cover' ? clamp(r.t / 0.4, 0, 1) : 1; ctx.save(); rrect(c.x, c.y, c.s, c.s, 22 * k); ctx.clip(); ctx.fillStyle = '#3a2a5a'; ctx.fillRect(c.x, c.y, c.s, c.s * f); ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 10; i++) ctx.fillRect(c.x + i * c.s / 10, c.y, c.s / 20, c.s * f); ctx.restore();
      if (r.phase === 'brief') { ctx.font = `${Math.round(54 * k)}px ${EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(TYPE_ICON[r.type], W / 2, c.y + c.s * 0.34); ctx.font = `600 ${Math.round(24 * k)}px ${TF}`; ctx.fillStyle = '#ffe9b8'; ctx.fillText(TYPE_ASK[r.type], W / 2, c.y + c.s * 0.56); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(`then: ${TYPE_NAME[r.type]}`, W / 2, c.y + c.s * 0.66); ctx.fillText('TAP TO LOOK NOW', W / 2, c.y + c.s * 0.84); } } }
  for (const p of PT) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * k, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  if (G) hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of TXT) { const a = t.t < 0.8 ? 1 : 1 - (t.t - 0.8) / 0.4; ctx.globalAlpha = Math.max(0, a); const sc = t.t < 0.12 ? 1.25 - t.t / 0.12 * 0.25 : 1; ctx.font = `600 ${Math.round(t.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(t.txt, t.x, t.y - t.t * 24); ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y - t.t * 24); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(15 * k)}px ${BC}`; const lines = wrapText(hint.txt, W - 70), lh = 19 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, hy = H * 0.5;
    ctx.fillStyle = 'rgba(10,12,24,.92)'; rrect(W / 2 - w / 2, hy - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,200,${FX.flash * 0.18})`; ctx.fillRect(0, 0, W, H); } }
function reviewWhy(r) { if (r.score >= 0.999) return { which: () => 'Every one you chose was there.', place: () => 'Every thing back in its place.', order: () => 'The whole sequence, in order.', missing: () => `The ${itemName(r.gone)} was missing.`, changed: () => r.kind === 'swap' ? 'Those two swapped places.' : `The ${itemName(r.slots[r.changed[0]].it)} became the ${itemName(r.newIt)}.` }[r.type]();
  if (r.type === 'which') { const miss = r.opts.filter(o => o.on && !o.yes).map(o => itemName(o.it)); return miss.length ? `Not there: ${miss.join(', ')} (ringed red). Look-alikes catch you out: check colours and shapes.` : ''; }
  if (r.type === 'place') return 'Red rings: in the wrong place. Dashed: where something should have gone.';
  if (r.type === 'order') return `Number ${r.wrongAt + 1} was the ${itemName(r.seq[r.wrongAt])}. Say the things to yourself as they light up.`;
  if (r.type === 'missing') return `The ${itemName(r.gone)} was missing (ringed on the left).`;
  return r.kind === 'swap' ? 'Two things swapped places (ringed on the left).' : `The ${itemName(r.slots[r.changed[0]].it)} became the ${itemName(r.newIt)}.`; }
function hud(G) { const x = 16, y = 54 * k;
  if (G.lesson) { lessonPanel(G); return; }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `600 ${Math.round(17 * k)}px ${TF}`; ctx.fillStyle = '#ffe9b8'; ctx.fillText(`LEVEL ${G.N}${G.cfg.boss ? ' · ALL FIVE' : ''}`, x, y);
  ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; const r = G.round; ctx.fillText(r ? `${TYPE_NAME[r.type]}${G.cfg.timed ? ' · TIMED' : ''}${G.cfg.view !== 1 && store.get('view', 1) > 1 ? ' · RELAXED' : ''}` : '', x, y + 20 * k);
  for (let i = 0; i < G.cfg.rounds; i++) { const s = G.scores[i], cx = W - 24 - (G.cfg.rounds - 1 - i) * 22 * k, cy = y; ctx.beginPath(); ctx.arc(cx, cy, 8 * k, 0, TAU); if (s != null) { ctx.fillStyle = s >= 0.999 ? '#8fe0ab' : s >= 0.5 ? '#ffd36a' : '#ff8a7a'; ctx.fill(); } else { ctx.strokeStyle = i === G.ri ? '#fff' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke(); } }
  const acc = G.scores.length ? G.scores.reduce((a, b) => a + b, 0) / G.scores.length : 1; ctx.textAlign = 'right'; ctx.fillStyle = acc >= G.cfg.pass ? '#9be3b5' : '#ffb4a8'; ctx.fillText(G.scores.length ? `${Math.round(acc * 100)}% · NEED ${Math.round(G.cfg.pass * 100)}%` : `NEED ${Math.round(G.cfg.pass * 100)}%`, W - 16, y + 20 * k); }
const WRAP = new Map(); function wrapText(t, w) { const key = ctx.font + '|' + w + '|' + t, c = WRAP.get(key); if (c) return c; const res = wrapText0(t, w); if (WRAP.size > 300) WRAP.clear(); WRAP.set(key, res); return res; }
function wrapText0(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
