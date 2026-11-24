// ===================== DRAW + JUICE: the glasses (2D on purpose: glasses on a shelf, read side on like the originals) =====================
// Tall glass tubes in a row or two, liquids in glossy layers, each colour with a faint mark of its own. A picked glass lifts
// and glows; pouring, it glides over the other, tips, and a stream of colour runs in while the level rises. A glass done
// gets a cork, a sparkle and a chime that climbs with every glass done. Hidden layers are smoky grey with a "?".
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, ANIM = null, CORK = {}, WOB = {}, chip = 0, CHIPTXT = '';
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.5 + Math.random() * 0.4, t: 0, col, r: 2 + Math.random() * 3 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
// where the glasses stand: one row, or two
function lay(g = G) { const s = S1(), n = g ? g.T.length : 6, rows = n > 6 ? 2 : 1, per = Math.ceil(n / rows), tw = Math.min(58 * s, (W - 24) / (per * 1.45)), th = tw * 3.3, gapX = (W - per * tw) / (per + 1);
  const top = 150 * s, rowH = th + 46 * s, y0 = top + Math.max(0, (H - top - 110 * s - rows * rowH) / 2);
  const pos = i => { const r = Math.floor(i / per), k = i % per, inRow = r === rows - 1 ? n - per * (rows - 1) : per, gx = (W - inRow * tw) / (inRow + 1); return { x: gx + k * (tw + gx), y: y0 + r * rowH + 20 * s }; };
  return { s, n, tw, th, pos, lh: (th - tw * 0.55) / CAP, undo: { x: 16 * s, y: H - 70 * s, w: 96 * s, h: 46 * s }, spareB: { x: W - 112 * s, y: H - 70 * s, w: 96 * s, h: 46 * s } }; }
function glassAt(x, y) { const L = lay(); for (let i = 0; i < L.n; i++) { const p = L.pos(i); if (x > p.x - 12 && x < p.x + L.tw + 12 && y > p.y - 30 && y < p.y + L.th + 16) return i; } return -1; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2); chip = Math.max(0, chip - dt);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 20; } while (TXT.length && TXT[0].t > 1.4) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  if (ANIM) { ANIM.t += dt; if (ANIM.t >= ANIM.life) ANIM = null; } for (const k in CORK) CORK[k] = Math.min(1, CORK[k] + dt * 4); for (const k in WOB) { WOB[k] -= dt; if (WOB[k] <= 0) delete WOB[k]; } }
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = v => Math.round(clamp(k > 1 ? v + (255 - v) * (k - 1) : v * k, 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
function tubePath(x, y, w, h) { const r = w / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h - r); ctx.arc(x + r, y + h - r, r, Math.PI, 0, true); ctx.lineTo(x + w, y); }
// one glass: its liquids from the bottom; `grow` makes the top n layers rise (the pour arriving)
function drawGlass(G, i, x, y, L, o = {}) { const w = L.tw, h = L.th, t = G.T[i], cap = G.caps[i], lh = cap === CAP ? L.lh : L.lh, hh = cap === CAP ? h : L.lh * cap + w * 0.55; const yT = y + (h - hh);
  ctx.save(); if (o.rot) { ctx.translate(x + w / 2, yT); ctx.rotate(o.rot); ctx.translate(-(x + w / 2), -yT); }
  // the liquids, clipped to the glass
  ctx.save(); tubePath(x + 3, yT, w - 6, hh - 3); ctx.closePath(); ctx.clip(); const base = y + h - 3;
  const show = o.show != null ? o.show : t.length; for (let k = 0; k < show; k++) { let f = 1; if (o.grow && k >= show - o.grow.n) f = o.grow.f; const y1 = base - (k + 1) * lh + (1 - f) * lh, hid = G.hide[i][k];
    const col = hid ? '#5a5a66' : LIQ[t[k]]; const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, shade(col, 0.82)); gr.addColorStop(0.35, shade(col, 1.15)); gr.addColorStop(1, shade(col, 0.72)); ctx.fillStyle = gr; ctx.fillRect(x, y1, w, lh * f + 1);
    if (k === show - 1) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y1, w, 3); }
    ctx.fillStyle = hid ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.45)'; ctx.font = `${Math.round(lh * 0.42)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (f > 0.6) ctx.fillText(hid ? '?' : SYM[t[k]], x + w / 2, y1 + lh / 2); }
  ctx.restore();
  // the glass itself
  tubePath(x, yT, w, hh); ctx.strokeStyle = o.sel ? '#ffe08a' : 'rgba(255,255,255,.85)'; ctx.lineWidth = o.sel ? 4 : 2.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + w * 0.18, yT + 8, w * 0.1, hh - w * 0.7); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - 3, yT - 3, w + 6, 4);
  // a cork when it is done
  if (G.done[i]) { const c = CORK[i] != null ? CORK[i] : 1, cy = yT - 14 + (1 - easeOut(c)) * -40; ctx.fillStyle = '#c8945a'; rrect(x + w * 0.15, cy, w * 0.7, 16, 4); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + w * 0.15, cy + 11, w * 0.7, 3); }
  ctx.restore(); }
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const g = G, L = lay(g), s = L.s, P = PLACES[g ? g.place : 0];
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, P.bg[0]); bg.addColorStop(1, P.bg[1]); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { const A = ANIM;
    for (let i = 0; i < g.T.length; i++) { const p = L.pos(i); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(p.x + L.tw / 2, p.y + L.th + 6, L.tw * 0.7, 6, 0, 0, TAU); ctx.fill(); }
    for (let i = 0; i < g.T.length; i++) { if (A && A.a === i) continue; const p = L.pos(i); let y = p.y; if (g.sel === i) y -= 22 * s; const wob = WOB[i] ? Math.sin(WOB[i] * 50) * WOB[i] * 14 : 0;
      const grow = A && A.b === i ? { n: A.n, f: clamp((A.t - A.life * 0.3) / (A.life * 0.55), 0, 1) } : null; drawGlass(g, i, p.x + wob, y, L, { sel: g.sel === i, grow }); }
    // the glass that is pouring: glides over, tips, pours
    if (A) { const pa = L.pos(A.a), pb = L.pos(A.b), u = A.t / A.life, go = easeOut(clamp(u / 0.3, 0, 1)), back = easeOut(clamp((u - 0.85) / 0.15, 0, 1)), side = pa.x >= pb.x ? 1 : -1;
      // the glass turns about its mouth: the mouth comes to rest just above the other glass's mouth, its bottom tips up and away
      const mx = pb.x + L.tw / 2 + side * L.tw * 0.18, my = pb.y - 16 * s, x0 = pa.x, y0 = pa.y - 22 * s, x = lerp(lerp(x0, mx - L.tw / 2, go), x0, back), y = lerp(lerp(y0, my, go), pa.y, back), rot = -side * 1.15 * (go - back);
      drawGlass(g, A.a, x, y, L, { rot });
      if (u > 0.3 && u < 0.85) { const sx = x + L.tw / 2, sy = y + 2, ex = pb.x + L.tw / 2, ey = pb.y + L.th - 4 - g.T[A.b].length * L.lh * 0.5, wob = Math.sin(now * 30) * 1.5;
        ctx.strokeStyle = LIQ[A.c]; ctx.lineWidth = 6 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(ex + wob, sy + 6, ex + wob, Math.max(sy + 8, ey)); ctx.stroke(); ctx.lineCap = 'butt'; } }
    hud(g, L, now); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  const dark = g && g.place === 3; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1 ? 1 : 1 - (q.t - 1) / 0.4, pop = 1 + 0.25 * Math.max(0, 1 - q.t * 6); ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s * pop)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = dark ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.85)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30, hy = H - 120 * s;
    ctx.fillStyle = 'rgba(30,40,60,.92)'; rrect(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function hud(G, L, now) { const s = L.s, dark = G.place === 3, ink = dark ? '#f0eaff' : '#2a3a5a', soft = dark ? 'rgba(240,234,255,.7)' : 'rgba(42,58,90,.65)';
  if (G.lesson) lessonPanel(G, L); else {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = G.moves <= 3 ? '#e83a4a' : ink; ctx.font = `${Math.round(40 * s)}px ${TF}`; ctx.fillText(G.moves, W / 2, 66 * s); ctx.font = `700 ${Math.round(11 * s)}px ${BC}`; ctx.fillStyle = soft; ctx.fillText('MOVES', W / 2, 92 * s);
    ctx.textAlign = 'left'; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.fillStyle = ink; ctx.fillText(`Level ${G.N}`, 16, 56 * s); ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillStyle = soft; ctx.fillText(`${G.done.filter(Boolean).length} of ${G.cfg.K} sorted`, 16, 76 * s);
    ctx.textAlign = 'right'; ctx.fillText(`best in ${G.par}`, W - 16, 76 * s);
    if (G.fumble >= 1) { ctx.textAlign = 'center'; ctx.fillStyle = chip > 0 ? '#e83a4a' : soft; ctx.fillText(chip > 0 ? CHIPTXT : `Next wrong pour costs ${G.fumble} move${G.fumble > 1 ? 's' : ''}`, W / 2, 112 * s); } }
  const btn = (b, txt, on) => { ctx.globalAlpha = on ? 1 : 0.35; ctx.fillStyle = dark ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.75)'; rrect(b.x, b.y, b.w, b.h, 14); ctx.fill(); ctx.fillStyle = ink; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, b.x + b.w / 2, b.y + b.h / 2); ctx.globalAlpha = 1; };
  if (G.undos > 0 || G.hist.length) btn(L.undo, `↶ UNDO ${G.undos}`, G.undos > 0 && G.hist.length > 0); if (G.spare > 0) btn(L.spareB, '+ GLASS', true); }
function lessonPanel(G, L) { coachPanel(G); }
function onEvent(G, e) { const L = lay(G), s = L.s, dark = G.place === 3, ink = dark ? '#ffe08a' : '#2a5aaa';
  switch (e.k) {
    case 'start': say(`Level ${G.N}`, W / 2, H * 0.12 + 40 * s, ink, 22); sfx.start(); CORK = {}; ANIM = null; if (G.N <= 1) tip('how', 'Tap a glass, then another to pour into it.', 3); break;
    case 'pick': sfx.clink(1); break;
    case 'put': sfx.clink(0.6); break;
    case 'nothing': sfx.clink(0.4); break;
    case 'pour': ANIM = { a: e.a, b: e.b, n: e.n, c: e.c, t: 0, life: G.pt }; sfx.pour(e.n); if (e.rev) setTimeout(() => sfx.reveal(), 300); break;
    case 'full': { const p = L.pos(e.i); CORK[e.i] = 0; setTimeout(() => { sparks(p.x + L.tw / 2, p.y, 18, LIQ[e.c], 200 * s); sfx.full(e.n); vibe(HAP.light); }, 380); say(e.n >= G.cfg.K ? '' : ['', 'Nice!', 'Lovely!', 'Great!', 'Super!', 'Brilliant!', 'Wonderful!', 'Superb!', 'Amazing!', 'Fantastic!'][Math.min(9, e.n)], p.x + L.tw / 2, p.y - 30 * s, LIQ[e.c], 20); break; }
    case 'nope': WOB[e.b] = 0.3; sfx.nope(); if (e.cost) { chip = 1.2; CHIPTXT = `−${e.cost} MOVE${e.cost > 1 ? 'S' : ''}`; say(CHIPTXT, W / 2, 130 * s, '#e83a4a', 20); } else if (!G.lesson) tip('nope', 'It only pours onto the same colour, or into an empty glass. Another wrong pour soon after costs a move.', 3.4); break;
    case 'undo': sfx.undo(); ANIM = null; break;
    case 'spare': sfx.full(1); say('+1 GLASS', W / 2, H * 0.5, ink, 24); break;
    case 'stuck': if (e.end) say('NO POURS LEFT', W / 2, H * 0.45, '#e83a4a', 26); else tip('stuck', 'No pours left! Tap UNDO to take one back.', 3); break;
    case 'sorted': FX.flash = 0.6; sfx.win(); vibe(HAP.best); for (let i = 0; i < 60; i++) { const a = Math.random() * TAU; PT.push({ x: W / 2, y: H * 0.45, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320 - 160, life: 1.2, t: 0, col: LIQ[i % LIQ.length], r: 3.5 }); } say('ALL SORTED!', W / 2, H * 0.4, ink, 34); break;
    case 'lessonmiss': coachMiss(); sfx.nope(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', W / 2, H * 0.4, ink, 30); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'lost': sfx.lose(); break;
  } }
