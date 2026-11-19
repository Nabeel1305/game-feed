// ===================== DRAW + JUICE: the paint jar (2D on purpose: a jar seen side on, like the original drop-and-merge games) =====================
// A glass jar on a shelf against a soft wall. Paint blobs are glossy and round with little faces; WET blobs glisten (a bright
// highlight and a drip), DRY ones go matte, so you can see which will still squash. The blob in hand hangs above the jar with
// a dotted line to where it will land. A squash: the two blobs swell into one, splashing paint of the new colour; chains climb.
// Down the side, the colour chart: every colour on the way to the goal lights up as you make it. The palette: six drops,
// one dries with each drop that leads to no squash, all refill on a squash.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, RINGS = [], POP = new Map();
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.45 + Math.random() * 0.4, t: 0, col, r: 2.5 + Math.random() * 3.5 }); } }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
// the jar on the screen: u pixels per jar unit
function lay(g = G) { const s = S1(), jw = g ? g.jw : 11, jh = (g ? g.line : 10) + 2.4, side = 38 * s, u = Math.min((W - side - 24) / jw, (H * 0.66) / jh), x0 = side + (W - side - jw * u) / 2 + 4, floor = Math.min(H - 60 * s, (118 * s + H - 24 * s) / 2 + jh * u / 2);
  return { s, u, x0, floor, jw, jh, sx: x => x0 + x * u, sy: y => floor - y * u, ux: px => (px - x0) / u, side }; }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; } for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) { t.t += dt; t.y -= dt * 22; } while (TXT.length && TXT[0].t > 1.4) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  for (const r of RINGS) r.t += dt; RINGS = RINGS.filter(r => r.t < r.life); for (const [k, v] of POP) { const n = v + dt * 3.5; if (n >= 1) POP.delete(k); else POP.set(k, n); } }
// ---------- a blob ----------
function blob(x, y, r, t, o = {}) { ctx.save(); ctx.translate(x, y); const sq = o.sq || 0, pop = o.pop != null ? 0.6 + 0.4 * easeOutBack(o.pop) : 1; ctx.scale((1 + sq * 0.14) * pop, (1 - sq * 0.14) * pop); ctx.translate(0, sq * r * 0.1);
  if (t < 0) { const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r); g.addColorStop(0, '#b8b4ae'); g.addColorStop(1, '#5a5650'); ctx.fillStyle = g; ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, rr = r * (0.9 + 0.1 * Math.sin(k * 2.7)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,36,30,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.2); ctx.lineTo(r * 0.05, r * 0.1); ctx.lineTo(r * 0.3, -r * 0.3); ctx.stroke(); ctx.restore(); return; }
  const T = TIERS[t], wet = o.wet > 0, dry = !wet && !o.held;
  let fill; if (t === 10) { fill = ctx.createConicGradient ? ctx.createConicGradient(o.now || 0, 0, 0) : null; if (fill) ['#ff4a4a', '#ffd83a', '#3ac85a', '#4ab8ff', '#9a5aff', '#ff6ac8', '#ff4a4a'].forEach((c, i, a) => fill.addColorStop(i / (a.length - 1), c)); else fill = '#ff6ac8'; }
  else { fill = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05); fill.addColorStop(0, shade(T.c, dry ? 1.15 : 1.4)); fill.addColorStop(0.6, dry ? shade(T.c, 0.92) : T.c); fill.addColorStop(1, shade(T.c, dry ? 0.62 : 0.7)); }
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.lineWidth = Math.max(1, r * 0.05); ctx.strokeStyle = t === 10 ? 'rgba(255,255,255,.7)' : shade(T.c, 0.55); ctx.stroke();
  // shine: big and bright while wet, faint when dry
  ctx.fillStyle = `rgba(255,255,255,${dry ? 0.18 : 0.62})`; ctx.beginPath(); ctx.ellipse(-r * 0.34, -r * 0.42, r * 0.3, r * 0.17, -0.6, 0, TAU); ctx.fill();
  if (!dry) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.5, r * 0.07, 0, TAU); ctx.fill(); if (wet && r > 0.3) { ctx.fillStyle = t === 10 ? '#ff6ac8' : T.c; ctx.beginPath(); ctx.ellipse(r * 0.15, r * 0.98, r * 0.12, r * 0.2 * (0.6 + 0.4 * Math.min(1, o.wet)), 0, 0, TAU); ctx.fill(); } }
  // a face
  if (r > 9) { const ey = -r * 0.08, ex = r * 0.28, er = Math.max(1.6, r * 0.12), look = o.look || 0; ctx.fillStyle = '#fff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * ex, ey, er * 1.25, 0, TAU); ctx.fill(); } ctx.fillStyle = '#2a1a1a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * ex + look * er * 0.4, ey + er * 0.15, er * 0.75, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#2a1a1a'; ctx.lineWidth = Math.max(1.2, r * 0.06); ctx.beginPath(); if (o.happy) ctx.arc(0, r * 0.18, r * 0.2, 0.1, Math.PI - 0.1); else ctx.arc(0, r * 0.12, r * 0.14, 0.25, Math.PI - 0.25); ctx.stroke();
    if (o.happy || wet) { ctx.fillStyle = 'rgba(255,120,140,.45)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.48, r * 0.12, r * 0.12, r * 0.07, 0, 0, TAU); ctx.fill(); } } }
  ctx.restore(); }
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = v => Math.round(clamp(k > 1 ? v + (255 - v) * (k - 1) : v * k, 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
// ---------- the picture ----------
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const g = G, L = lay(g), s = L.s, P = PLACES[g ? g.place : 0];
  const rk = W + 'x' + H + ':' + DPR + ':' + (g ? g.place + ':' + g.jw + ':' + g.line : ''); if (draw.rk !== rk) { draw.rk = rk; paintBack(P, L, g); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(draw.oc, 0, 0); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.save(); if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  if (g) { const u = L.u, jx0 = L.sx(0), jx1 = L.sx(g.jw), jy = L.sy(g.line);
    // the line
    const dg = g.danger > 0; ctx.setLineDash([8, 6]); ctx.strokeStyle = dg ? `rgba(255,60,60,${0.6 + 0.4 * Math.sin(now * 14)})` : 'rgba(120,90,140,.5)'; ctx.lineWidth = dg ? 3 : 2; ctx.beginPath(); ctx.moveTo(jx0, jy); ctx.lineTo(jx1, jy); ctx.stroke(); ctx.setLineDash([]);
    if (dg) { const p = clamp(g.danger / 2.5, 0, 1); ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(jx1 - 16 * s, jy - 18 * s, 11 * s, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.stroke(); }
    // where the blob in hand will land
    const t0 = g.queue[0], r0 = radOf(t0), ax = L.sx(g.aim), hy = L.sy(g.line + 1.2);
    if (!g.over && !g.done && g.wait <= 0) { const Ld = landing(g, g.aim, r0); ctx.strokeStyle = 'rgba(90,60,110,.35)'; ctx.lineWidth = 2; ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.moveTo(ax, hy + r0 * u); ctx.lineTo(ax, L.sy(Ld.y)); ctx.stroke(); ctx.setLineDash([]);
      if (Ld.hit && Ld.hit.t === t0 && t0 >= 0) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(L.sx(Ld.hit.x), L.sy(Ld.hit.y), Ld.hit.r * u + 4, 0, TAU); ctx.stroke(); }
      if (g.cool <= 0) blob(ax, hy, r0 * u, t0, { held: true, now, look: 0 }); }
    // the blobs
    for (const b of g.b) { const p = POP.get(b.id); blob(L.sx(b.x), L.sy(b.y), b.r * u, b.t, { sq: b.sq, wet: b.wet, pop: p, now, happy: p != null, look: clamp((g.aim - b.x) / 4, -1, 1) }); }
    for (const r of RINGS) { const q = r.t / r.life; ctx.strokeStyle = r.col; ctx.globalAlpha = 1 - q; ctx.lineWidth = 6 * (1 - q) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, r.r + q * r.r * 1.4, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    // the jar's glass in front
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(jx0 - 3, L.sy(L.jh)); ctx.lineTo(jx0 - 3, L.floor + 3); ctx.lineTo(jx1 + 3, L.floor + 3); ctx.lineTo(jx1 + 3, L.sy(L.jh)); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(jx0 + 6, L.sy(L.jh) + 10, 7 * s, L.jh * u - 30);
    hud(g, L, now); }
  for (const p of PT) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 1 ? 1 : 1 - (q.t - 1) / 0.4, pop = 1 + 0.25 * Math.max(0, 1 - q.t * 6); ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s * pop)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(60,30,70,.55)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30, hy = H * 0.5;
    ctx.fillStyle = 'rgba(60,30,70,.92)'; rrect(W / 2 - ww / 2, hy - hh / 2, ww, hh, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, hy - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,60,${FX.red * 0.2})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function paintBack(P, L, g) { const oc = draw.oc || (draw.oc = document.createElement('canvas')); oc.width = cv.width; oc.height = cv.height; const o = oc.getContext('2d'); o.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bg = o.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, P.wall[0]); bg.addColorStop(1, P.wall[1]); o.fillStyle = bg; o.fillRect(0, 0, W, H);
  const R0 = rng(31); for (let i = 0; i < 18; i++) { o.fillStyle = TIERS[(R0() * 10) | 0].c + '22'; o.beginPath(); o.arc(R0() * W, R0() * H * 0.8, 6 + R0() * 26, 0, TAU); o.fill(); }
  o.fillStyle = '#b88a5a'; o.fillRect(0, L.floor + 6, W, 16 * L.s); o.fillStyle = '#8a6040'; o.fillRect(0, L.floor + 6 + 16 * L.s, W, H); o.fillStyle = 'rgba(0,0,0,.15)'; o.fillRect(0, L.floor + 6, W, 3);
  if (!g) return; const jx0 = L.sx(0), jx1 = L.sx(g.jw), top = L.sy(L.jh); o.fillStyle = 'rgba(220,240,255,.28)'; o.beginPath(); o.roundRect(jx0 - 3, top, jx1 - jx0 + 6, L.floor - top + 6, [4, 4, 18, 18]); o.fill(); o.strokeStyle = 'rgba(150,170,200,.45)'; o.lineWidth = 2; o.stroke();
  o.fillStyle = 'rgba(0,0,0,.12)'; o.beginPath(); o.ellipse((jx0 + jx1) / 2, L.floor + 8, (jx1 - jx0) / 2 + 8, 6, 0, 0, TAU); o.fill(); }
// ---------- the side and the top: the colour chart, the palette, the paint, what is next ----------
function hud(G, L, now) { const s = L.s, c = G.cfg;
  // colour chart down the left: every colour up to the goal, lit once made
  const n = c.goal + 1, ch = Math.min(26 * s, (L.floor - 120 * s) / n); for (let t = 0; t < n; t++) { const y = L.floor - 8 - t * ch - ch / 2, x = 20 * s, lit = G.made >= t || t <= c.spawnTop - 1, goal = t === c.goal;
    ctx.globalAlpha = lit ? 1 : 0.28; blob(x, y, ch * 0.4, t, { held: true, now }); ctx.globalAlpha = 1; if (goal) { ctx.strokeStyle = G.made >= t ? '#2a9a4a' : '#ff6aa8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, ch * 0.5, 0, TAU); ctx.stroke(); ctx.fillStyle = '#5a2a6a'; ctx.font = `${Math.round(11 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('GOAL', x, y - ch * 0.75); } }
  if (G.lesson) { lessonPanel(G, L); return; }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5a2a6a'; ctx.font = `${Math.round(17 * s)}px ${TF}`; ctx.fillText(`Make a ${TIERS[c.goal].n.toUpperCase()}`, 14, 52 * s);
  ctx.font = `700 ${Math.round(12 * s)}px ${BC}`; ctx.fillStyle = 'rgba(90,40,100,.75)'; ctx.fillText(`Score ${G.score.toLocaleString()} · paint ${G.drops}`, 14, 74 * s);
  // the palette: six drops
  const px = 14, py = 96 * s; for (let k = 0; k < c.dry; k++) { const dry = k >= c.dry - G.dry, x = px + k * 20 * s; ctx.fillStyle = dry ? 'rgba(120,100,110,.35)' : TIERS[k % 10].c; ctx.beginPath(); ctx.moveTo(x + 8 * s, py - 9 * s); ctx.quadraticCurveTo(x + 15 * s, py + 2 * s, x + 8 * s, py + 7 * s); ctx.quadraticCurveTo(x + 1 * s, py + 2 * s, x + 8 * s, py - 9 * s); ctx.fill(); }
  ctx.font = `700 ${Math.round(10 * s)}px ${BC}`; ctx.fillStyle = G.dry >= c.dry - 2 ? '#e83a4a' : 'rgba(90,40,100,.6)'; ctx.fillText(G.dry >= c.dry - 2 ? 'SQUASH SOON!' : 'PALETTE', px + c.dry * 20 * s + 4, py);
  // next
  const nx = W - 34 * s, ny = 58 * s; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(nx, ny, 22 * s, 0, TAU); ctx.fill(); blob(nx, ny, Math.min(17 * s, radOf(G.queue[1]) * L.u * 0.7), G.queue[1], { held: true, now }); ctx.fillStyle = '#5a2a6a'; ctx.font = `700 ${Math.round(10 * s)}px ${BC}`; ctx.textAlign = 'center'; ctx.fillText('NEXT', nx, ny + 30 * s);
  if (G.shakes > 0) { const b = shakeBtn(); ctx.fillStyle = 'rgba(255,255,255,.7)'; rrect(b.x, b.y, b.w, b.h, 12); ctx.fill(); ctx.fillStyle = '#5a2a6a'; ctx.font = `${Math.round(13 * s)}px ${TF}`; ctx.fillText('SHAKE', b.x + b.w / 2, b.y + b.h / 2); } }
function shakeBtn() { const s = S1(); return { x: W - 84 * s, y: 100 * s, w: 70 * s, h: 30 * s }; }
function lessonPanel(G, L) { const D = G.lesson, st = D.steps[D.i], s = L.s, x = 10 + L.side, w = W - 20 - L.side, y = 44 * s; ctx.save(); ctx.font = `700 ${Math.round(13 * s)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 42 * s + lines.length * 17 * s;
  ctx.fillStyle = 'rgba(60,30,70,.92)'; rrect(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = '#ffd83a'; ctx.lineWidth = 2; rrect(x, y, w, h, 14); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd83a'; ctx.font = `${Math.round(15 * s)}px ${TF}`; ctx.fillText(st.title + (st.need > 1 ? `  ${D.n} / ${st.need}` : ''), x + 12, y + 9 * s);
  ctx.font = `700 ${Math.round(13 * s)}px ${BC}`; ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 32 * s + i * 17 * s)); ctx.restore(); }
// ---------- what each happening looks like ----------
function onEvent(G, e) { const L = lay(G), s = L.s;
  switch (e.k) {
    case 'start': say(`Make a ${TIERS[G.cfg.goal].n}!`, W / 2, H * 0.36, TIERS[G.cfg.goal].c, 30); sfx.start(); if (G.N <= 1) tip('how', 'Slide to aim, let go to drop. Wet paint squashes into its own colour.', 3.2); break;
    case 'drop': sfx.plop(e.t); break;
    case 'squash': { const x = L.sx(e.x), y = L.sy(e.y), T = TIERS[Math.min(10, e.t)]; const nb = G.b[G.b.length - 1]; if (nb) POP.set(nb.id, 0);
      sparks(x, y, 10 + e.t * 2, T.c, (140 + e.t * 20) * s); RINGS.push({ x, y, r: T.r * L.u, t: 0, life: 0.45, col: T.c }); sfx.squash(e.t, e.chain); vibe(e.t >= 5 ? HAP.light : HAP.tick);
      if (e.t >= 3 || e.chain >= 2) say(e.chain >= 2 ? `${T.n.toUpperCase()}! ×${e.chain}` : `${T.n.toUpperCase()}!`, x, y - T.r * L.u - 12, T.c === '#ffffff' ? '#ff6ac8' : shade(T.c, 0.85), 16 + e.t * 1.5 + e.chain * 2); if (e.t >= 6) FX.shake = 4 + e.t; break; }
    case 'masterpiece': FX.flash = 1; FX.shake = 14; say('MASTERPIECE!', W / 2, H * 0.4, '#ff6ac8', 36); sfx.goal(); break;
    case 'crack': sparks(L.sx(e.x), L.sy(e.y), 12, '#8a8680', 180 * s); sfx.crack(); break;
    case 'dry': sfx.dry(e.n, e.of); if (e.n === 1) tip('dry', 'A drop that squashes nothing dries one paint drop of your palette. Squash to refill it!', 3.4); break;
    case 'refill': sfx.refill(); break;
    case 'dried': say('THE PAINT DRIED UP', W / 2, H * 0.4, '#8a5a6a', 26); break;
    case 'warn': sfx.warn(); tip('line', 'Over the line! Squash something quick, or the jar spills.', 2.6); break;
    case 'spill': FX.red = 1; FX.shake = 10; say('IT SPILLED!', W / 2, H * 0.4, '#e83a4a', 30); break;
    case 'empty': say('OUT OF PAINT', W / 2, H * 0.4, '#8a5a6a', 26); break;
    case 'goal': FX.flash = 0.7; sfx.goal(); vibe(HAP.best); say(`${TIERS[e.t].n.toUpperCase()}! DONE!`, W / 2, H * 0.36, TIERS[e.t].c, 34); for (let i = 0; i < 50; i++) { const a = Math.random() * TAU; PT.push({ x: W / 2, y: H * 0.4, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320 - 160, life: 1.2, t: 0, col: TIERS[i % 10].c, r: 4 }); } break;
    case 'shake': FX.shake = 16; sfx.shake(); break;
    case 'lessonok': if (!e.quiet) say(`${e.n} / ${e.need}`, W / 2, H * 0.4, '#3ac85a', 26); break;
    case 'lessonmiss': hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('LOVELY!', W / 2, H * 0.4, '#ff6ac8', 32); sfx.goal(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': sfx.lose(); break;
  } }
