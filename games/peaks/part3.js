// ===================== DRAW + JUICE: the card table (2D on purpose: cards read best flat) =====================
// Green felt under a warm lamp, the three peaks of cards, the stock and the pile at the bottom. Cards flip over when they are
// uncovered, fly to the pile when played, and the streak counter grows and glows. A joker shimmers; locked cards wear a
// padlock; the key card has a gold border.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, fly = [], wob = {};
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 2.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 18; } while (TXT.length && TXT[0].t > 1.5) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  for (const f of fly) f.t += dt; fly = fly.filter(f => f.t < 0.3); for (const k2 in wob) { wob[k2] -= dt; if (wob[k2] <= 0) delete wob[k2]; } }
// where everything is
function lay() { const s = S1(), cw = Math.min((W - 8) / 10, 58 * s), ch = cw * 1.78, top = H * 0.2, rowY = r => top + r * ch * 0.52,      // (22 Nov 2026: taller cards, the table was half empty)
  x0 = W / 2 - cw * 4.5;
  const pos = (r, i) => { if (r === 3) return { x: x0 + i * cw, y: rowY(3) }; if (r === 2) return { x: x0 + cw * 0.5 + i * cw, y: rowY(2) }; if (r === 1) { const p = Math.floor(i / 2), j = i % 2; return { x: x0 + cw * (1 + p * 3 + j), y: rowY(1) }; } return { x: x0 + cw * (1.5 + i * 3), y: rowY(0) }; };
  return { s, cw, ch, pos, stock: { x: W * 0.24 - cw * 0.85, y: H * 0.66, w: cw * 1.7, h: ch * 1.45 }, pile: { x: W * 0.54 - cw * 0.85, y: H * 0.66, w: cw * 1.7, h: ch * 1.45 }, undo: { x: W * 0.78 - 30 * s, y: H * 0.74, w: 60 * s, h: 40 * s } }; }
const RED = s => s === 1 || s === 2;
function drawCard(x, y, w, h, c, up, o = {}) { ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; rrect(-w / 2 + 2, -h / 2 + 3, w, h, w * 0.12); ctx.fill();
  if (!up) { ctx.fillStyle = '#7a1a2a'; rrect(-w / 2, -h / 2, w, h, w * 0.12); ctx.fill(); ctx.strokeStyle = '#e8c25a'; ctx.lineWidth = 1.5; rrect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, w * 0.08); ctx.stroke(); ctx.fillStyle = 'rgba(232,194,90,.35)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, -h * 0.3 + i * h * 0.2, w * 0.12, 0, TAU); ctx.fill(); } if (o.lock) { ctx.font = `${Math.round(w * 0.45)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔒', 0, 0); } ctx.restore(); return; }
  ctx.fillStyle = o.dim ? '#d8d4c8' : '#fbf8f0'; rrect(-w / 2, -h / 2, w, h, w * 0.12); ctx.fill(); if (o.key) { ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 3; rrect(-w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3, w * 0.1); ctx.stroke(); }
  if (o.glow) { ctx.strokeStyle = '#7ad08a'; ctx.lineWidth = 2.5; rrect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, w * 0.12); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (c.joker) { ctx.font = `${Math.round(w * 0.6)}px sans-serif`; ctx.fillText('🃏', 0, 0); ctx.restore(); return; }
  ctx.fillStyle = RED(c.s) ? '#c8202a' : '#1a1a22'; ctx.font = `800 ${Math.round(w * 0.42)}px Georgia,serif`; ctx.fillText(RANKS_[c.r], 0, -h * 0.17); ctx.font = `${Math.round(w * 0.42)}px sans-serif`; ctx.fillText(SUITS[c.s], 0, h * 0.2);
  if (o.lock) { ctx.fillStyle = 'rgba(40,30,20,.55)'; rrect(-w / 2, -h / 2, w, h, w * 0.12); ctx.fill(); ctx.font = `${Math.round(w * 0.5)}px sans-serif`; ctx.fillText('🔒', 0, 0); }
  if (o.key) { ctx.font = `${Math.round(w * 0.3)}px sans-serif`; ctx.fillText('🔑', w * 0.25, -h * 0.36); }
  ctx.restore(); }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G, P = PLACES[g ? g.place : 0];
  ctx.fillStyle = P.felt; ctx.fillRect(0, 0, W, H); const lg = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, H * 0.7); lg.addColorStop(0, 'rgba(255,240,200,.22)'); lg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { const ms = new Set(moves(g));
    for (const t of g.tab) { if (t.gone) continue; const p = L.pos(t.r, t.i), up = free(g, t), w2 = wob[g.tab.indexOf(t)] ? Math.sin(now * 60) * 3 : 0; drawCard(p.x + w2, p.y, L.cw - 3, L.ch - 3, t.card, up, { lock: locked(g, t), key: t.key && up, glow: g.lesson && ms.has(t) }); }
    // stock and pile
    const S = L.stock; for (let i = Math.min(4, g.stock.length) - 1; i >= 0; i--) drawCard(S.x + S.w / 2 - i * 2, S.y + S.h / 2 - i * 2, S.w, S.h, {}, false);
    if (!g.stock.length) { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([5, 5]); rrect(S.x, S.y, S.w, S.h, 8); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText(`STOCK ${g.stock.length}`, S.x + S.w / 2, S.y + S.h + 14 * s);
    if (upLv('peek') && g.stock.length) { const nx = g.gift ? { joker: true } : g.stock[0]; drawCard(S.x + S.w / 2, S.y - 22 * s, S.w * 0.6, S.h * 0.6, nx, true, { dim: true }); }
    const Pl = L.pile, tp = top(g); if (g.waste.length > 1) drawCard(Pl.x + Pl.w / 2 - 3, Pl.y + Pl.h / 2 + 2, Pl.w, Pl.h, g.waste[g.waste.length - 2], true, { rot: -0.08 }); drawCard(Pl.x + Pl.w / 2, Pl.y + Pl.h / 2, Pl.w, Pl.h, tp, true);
    for (const f of fly) { const u = f.t / 0.3; drawCard(f.x + (Pl.x + Pl.w / 2 - f.x) * u, f.y + (Pl.y + Pl.h / 2 - f.y) * u - Math.sin(u * Math.PI) * 30, L.cw * (1 + u * 0.3), L.ch * (1 + u * 0.3), f.card, true, { rot: u * 0.3 }); }
    if (g.cfg.undo) { ctx.globalAlpha = g.undos > 0 ? 1 : 0.35; ctx.fillStyle = 'rgba(0,0,0,.4)'; rrect(L.undo.x, L.undo.y, L.undo.w, L.undo.h, 10); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `${Math.round(14 * s)}px ${TF}`; ctx.fillText('UNDO', L.undo.x + L.undo.w / 2, L.undo.y + L.undo.h / 2 + 2); ctx.globalAlpha = 1; }
    hud(g, L); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1.1 ? 1 : 1 - (q.t - 1.1) / 0.4; ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s)}px ${TF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30;
    ctx.fillStyle = 'rgba(10,20,14,.93)'; rrect(W / 2 - ww / 2, H * 0.63 - hh / 2, ww, hh, 10); ctx.fill(); ctx.fillStyle = '#ffe3a0'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.63 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${FX.flash * 0.3})`; ctx.fillRect(0, 0, W, H); } }
function hud(G, L) { const s = L.s; if (G.lesson) { lessonPanel(G); return; }
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `${Math.round(18 * s)}px ${TF}`; ctx.fillText(`${G.score}`, 16, 56 * s); ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(`SCORE · ${G.tab.length - G.cleared} CARDS LEFT`, 16, 76 * s);
  ctx.textAlign = 'right'; const hot = G.streak >= 3; ctx.fillStyle = hot ? '#ffd040' : '#fff'; ctx.font = `${Math.round((hot ? 20 : 15) * s)}px ${TF}`; ctx.fillText(G.streak ? `STREAK ×${G.streak}` : '', W - 16, 58 * s);
  if (G.streak && G.streak < G.cfg.streakJ && !G.gift) { ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(`${G.cfg.streakJ - G.streak} more for a 🃏`, W - 16, 78 * s); } if (G.gift) { ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillStyle = '#ffd040'; ctx.fillText('NEXT CARD: 🃏 JOKER', W - 16, 78 * s); } }
function onEvent(G, e) { const L = lay(), s = L.s;
  switch (e.k) {
    case 'start': say(PLACES[G.place].name.toUpperCase(), W / 2, H * 0.12, '#fff', 18); sfx.shuffle(); if (G.N <= 1) tip('how', 'Tap a face-up card one higher or one lower than the card on the pile.', 3.2); break;
    case 'play': { const t = G.tab[e.idx], p = L.pos(t.r, t.i); fly.push({ x: p.x, y: p.y, card: t.card, t: 0 }); sfx.flip(e.streak); if (e.streak >= 3) say(`×${e.streak}`, p.x, p.y - 20 * s, '#ffd040', 16 + Math.min(10, e.streak)); for (let i = 0; i < 4 + Math.min(10, e.streak); i++) { const a = Math.random() * TAU; PT.push({ x: p.x, y: p.y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 - 120, life: 0.6, t: 0, col: e.streak >= 6 ? '#ffd040' : '#fff', r: 2 }); } break; }
    case 'nofit': wob[e.idx] = 0.25; sfx.no(); break;
    case 'covered': sfx.no(); break;
    case 'locked': sfx.no(); tip('lock', 'Locked: play the gold KEY card 🔑 first.', 3); break;
    case 'unlock': sfx.unlock(); say('UNLOCKED!', W / 2, H * 0.5, '#ffd040', 22); break;
    case 'peak': sfx.peak(e.n); FX.flash = 0.4; say(e.n === 3 ? 'ALL THREE PEAKS!' : 'PEAK CLEARED!', W / 2, H * 0.14, '#ffe08a', 26); vibe(HAP.light); break;
    case 'gift': sfx.gift(); say('JOKER EARNED!', W / 2, H * 0.62, '#ffd040', 24); break;
    case 'draw': sfx.deal(); if (e.joker) say('JOKER!', W / 2, H * 0.62, '#ffd040', 22); break;
    case 'streakend': if (e.n >= 5) say(`RUN OF ${e.n}!`, W / 2, H * 0.62, '#ffe08a', 20); break;
    case 'empty': sfx.no(); break;
    case 'undo': sfx.deal(); break;
    case 'lessonnext': if (e.first) hint = null; say('FIRST, A LESSON', W / 2, H * 0.62, '#ffd36a', 22); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.62, '#ffd0c4', 22); coachMiss(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, H * 0.62, '#ffd36a', 24); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 0.7; sfx.win(); vibe(HAP.best); for (let i = 0; i < 60; i++) { const a = Math.random() * TAU; PT.push({ x: W / 2, y: H * 0.4, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 - 200, life: 1.2, t: 0, col: ['#ffd040', '#ff5a5a', '#5ad0ff', '#fff'][i % 4], r: 3 }); } break;
    case 'lost': sfx.lose(); break;
  } }
function area() { return { x: 0, y: 0, w: W, h: H }; }
