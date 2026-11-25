
// ===================== THE VIEW: Word Wheel (2D on purpose: a crossword and a wheel of letters read best flat) =====================
// A painted landscape behind (meadow, seaside, autumn woods, mountain lake, starry night); the crossword in the upper half
// on soft tiles; the wheel of letters at the bottom, with the shuffle button on its left and the bulb on its right; the
// word being spelled floats above the wheel; ink drops and the bonus jar at the top.
const FX = { shake: 0, stop: 0, flash: 0, red: 0, wob: 0 }, TXT = [], PARTS = [];
let hint0 = null;
const ui = { drag: null, path: [], fx: 0, fy: 0, pop: {}, flash: null, fly: [] };
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint0 = { txt, t: 0, secs }; }
function burst(x, y, col, n = 12, sp = 160) { if (HEADLESS) return; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8) * k; PARTS.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.6 + Math.random() * 0.4, col, r: (1.5 + Math.random() * 2.5) * k }); } if (PARTS.length > 240) PARTS.splice(0, PARTS.length - 240); }
function fxStep(dt) { FX.shake = Math.max(0, FX.shake - dt * 30); FX.flash = Math.max(0, FX.flash - dt * 2.5); FX.red = Math.max(0, FX.red - dt * 2); FX.wob = Math.max(0, FX.wob - dt * 3);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.5) TXT.shift();
  for (const p of PARTS) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 240 * dt; } for (let i = PARTS.length - 1; i >= 0; i--) if (PARTS[i].t > PARTS[i].life) PARTS.splice(i, 1);
  for (const f of ui.fly) f.t += dt; ui.fly = ui.fly.filter(f => f.t < f.life);
  if (ui.flash) { ui.flash.t += dt; if (ui.flash.t > 0.7) ui.flash = null; }
  if (hint0) { hint0.t += dt; if (hint0.t >= hint0.secs) hint0 = null; } }
function myTile() { if (typeof HEADLESS !== 'undefined' && HEADLESS) return TILES[0]; const id = store.get('tile', 'cream'); return TILES.find(q => q.id === id) || TILES[0]; }
const NUN = 'Nunito, "Barlow Condensed", "Arial Narrow", sans-serif';
// ---------- where everything is on this screen ----------
function lay(g) { g = g || G; const top = (g && g.lesson ? 196 : 104) * k, wheelR = Math.min(W * 0.33, H * 0.17, 150), wy = H - wheelR - Math.max(54, H * 0.07), gridBot = wy - wheelR - 74 * k;
  const rows = g ? g.rows : 5, cols = g ? g.cols : 5, cs = Math.min(48 * k, (W - 36) / cols, (gridBot - top) / rows), gx = W / 2 - cs * cols / 2, gy = top + Math.max(0, (gridBot - top - cs * rows) / 2);
  const n = g ? g.letters.length : 5, lr = Math.min(30 * k, wheelR * (n > 6 ? 0.3 : 0.36)), pts = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * TAU / n; pts.push({ x: W / 2 + Math.cos(a) * wheelR * 0.68, y: wy + Math.sin(a) * wheelR * 0.68 }); }
  return { cs, gx, gy, wx: W / 2, wy, wr: wheelR, lr, pts, shuf: { x: W / 2 - wheelR - 34 * k, y: wy + wheelR * 0.55, r: 24 * k }, bulb: { x: W / 2 + wheelR + 34 * k, y: wy + wheelR * 0.55, r: 24 * k }, wordY: wy - wheelR - 34 * k }; }
function letterAt(x, y) { const L = lay(); let best = -1, bd = 1e9; L.pts.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < L.lr * 1.15 && d < bd) { bd = d; best = i; } }); return best; }
function btnAt(x, y) { const L = lay(); if (Math.hypot(x - L.shuf.x, y - L.shuf.y) < L.shuf.r * 1.4) return 'shuffle'; if (Math.hypot(x - L.bulb.x, y - L.bulb.y) < L.bulb.r * 1.4) return 'hint'; return null; }
// ---------- the painted background (made once per place and size) ----------
let BG = null;
function paintBG(place) { const key = place + ':' + W + 'x' + H + ':' + DPR; if (BG && BG.key === key) return BG.c; const c = document.createElement('canvas'); c.width = Math.ceil(W * DPR); c.height = Math.ceil(H * DPR); const x = c.getContext('2d'); x.scale(DPR, DPR);
  const P = PLACES[place], gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P.sky[0]); gr.addColorStop(0.7, P.sky[1]); x.fillStyle = gr; x.fillRect(0, 0, W, H); const R = rng(place * 97 + 3);
  if (place === 4) { for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; x.beginPath(); x.arc(R() * W, R() * H * 0.6, R() * 1.4 + 0.3, 0, TAU); x.fill(); } x.fillStyle = '#fff8dc'; x.beginPath(); x.arc(W * 0.78, H * 0.12, 22, 0, TAU); x.fill(); }
  else { x.fillStyle = 'rgba(255,250,230,.9)'; x.beginPath(); x.arc(W * 0.8, H * 0.14, 30, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 4; i++) { const cx = R() * W, cy = H * (0.08 + R() * 0.2); for (let j = 0; j < 4; j++) { x.beginPath(); x.ellipse(cx + j * 16 - 24, cy + Math.sin(j) * 4, 22, 12, 0, 0, TAU); x.fill(); } } }
  P.hill.forEach((col, i) => { x.fillStyle = col; x.beginPath(); const base = H * (0.62 + i * 0.12); x.moveTo(0, H); x.lineTo(0, base); for (let xx = 0; xx <= W; xx += 8) x.lineTo(xx, base - Math.sin(xx / W * (3 + i) * Math.PI + i * 1.7 + place) * H * 0.04 - Math.sin(xx / 37 + i) * 4); x.lineTo(W, H); x.fill();
    if (i === 1 && place !== 1) for (let t = 0; t < 7; t++) { const tx = R() * W, ty = base - 8; x.fillStyle = place === 2 ? ['#d8602a', '#e8a03a', '#b8402a'][t % 3] : place === 4 ? '#18203a' : '#3a7a4a'; x.beginPath(); x.moveTo(tx, ty - 34); x.lineTo(tx - 13, ty + 2); x.lineTo(tx + 13, ty + 2); x.fill(); x.fillStyle = '#5a3a2a'; x.fillRect(tx - 2, ty, 4, 7); } });
  if (place === 1) { x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 20; i++) x.fillRect(R() * W, H * (0.66 + R() * 0.1), 14 + R() * 20, 2); }
  x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(0, 0, W, H); BG = { key, c }; return c; }
// ---------- what each happening looks and sounds like ----------
function onEvent(G, e) { const L = lay(G), cx = W / 2;
  switch (e.k) {
    case 'start': case 'page0': ui.path = []; ui.pop = {}; if (e.k === 'start') { say(`LEVEL ${G.N}`, cx, H * 0.24, '#fff', 30); sfx.start(); if (G.N <= 1) tip('how', 'Put your thumb on a letter and slide through the others. Lift to try the word.', 3.6); } break;
    case 'found': { const q = G.words[e.i]; q.cells.forEach(([r, c], j) => { ui.pop[r + ',' + c] = -j * 0.06; }); sfx.found(e.w.length, e.streak); const p = q.cells[Math.floor(q.cells.length / 2)];
        const x = L.gx + (p[1] + 0.5) * L.cs, y = L.gy + (p[0] + 0.5) * L.cs; if (e.how === 'spell') { burst(x, y, '#ffe08a', 10 + e.w.length * 2, 150); if (e.streak >= 3) say(['', '', '', 'NICE!', 'GREAT!', 'SUPERB!', 'AMAZING!'][Math.min(6, e.streak)], cx, L.wordY - 30 * k, '#ffd040', 22); }
        if (e.long) { say('THE LONG ONE!', cx, H * 0.3, '#ffd040', 24); FX.flash = 0.3; } vibe(HAP.light); } break;
    case 'bonus': sfx.bonus(); ui.fly.push({ txt: e.w.toUpperCase(), x0: W / 2, y0: L.wordY, x1: 30 * k, y1: 80 * k, t: 0, life: 0.8 }); say('BONUS +1 🪙', cx, L.wordY - 30 * k, '#9ae6ff', 18); tip('bonus', 'A bonus word: real, but not in the crossword. A coin! Ten fill the jar.', 3); break;
    case 'jar': sfx.jar(); say('JAR FULL! +20 🪙', cx, H * 0.3, '#ffd040', 24); FX.flash = 0.3; break;
    case 'again': sfx.again(); ui.flash = { col: 'rgba(200,200,200,.9)', t: 0, txt: e.bonus ? 'already a bonus' : 'already found' }; break;
    case 'spill': sfx.spill(); FX.wob = 1; FX.red = 0.5; ui.flash = { col: 'rgba(255,120,120,.95)', t: 0, txt: 'not a word' }; vibe(HAP.fail); burst(W - 30 * k - (G.ink) * 18 * k, 60 * k, '#2a3a8a', 10, 90); if (G.ink === 1) tip('ink', 'One drop of ink left! Only real words now.', 2.6); break;
    case 'dry': sfx.lose(); say('OUT OF INK', cx, H * 0.36, '#ff9a9a', 26); break;
    case 'short': break;
    case 'hint': sfx.hint(); ui.pop[e.r + ',' + e.c] = 0; { const x = L.gx + (e.c + 0.5) * L.cs, y = L.gy + (e.r + 0.5) * L.cs; burst(x, y, '#fff2a0', 10, 100); } break;
    case 'broke': sfx.no(); say(e.lesson ? 'No more hints in this lesson' : 'Not enough coins', cx, L.wordY - 30 * k, '#ffb0a0', 16); break;
    case 'shuffle': sfx.shuffle(); FX.wob = 0.4; break;
    case 'page': sfx.goal(); FX.flash = 0.5; say('PAGE DONE!', cx, H * 0.3, '#ffd040', 32); vibe(HAP.best); break;
    case 'lessonnext': if (e.first) hint0 = null; say('FIRST, A LESSON', cx, H * 0.22, '#ffe08a', 20); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('YOU\'VE GOT IT!', cx, H * 0.3, '#ffe08a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': sfx.win(); break;
    case 'lost': break;
  } }
// ---------- every frame ----------
function draw(now, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const g = G; ctx.drawImage(paintBG(g ? g.place : placeOf(Math.max(1, store.get('level', 1) | 0))), 0, 0, W, H);
  if (!g) return; const L = lay(g), T = myTile(), sh = FX.shake ? (Math.random() - 0.5) * FX.shake : 0;
  for (const key in ui.pop) ui.pop[key] += dt;
  // the crossword
  const cellOf = new Map(); for (const q of g.words) q.cells.forEach(([r, c], j) => cellOf.set(r + ',' + c, q.w[j]));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const [key, ch] of cellOf) { const [r, c] = key.split(',').map(Number), x = L.gx + c * L.cs, y = L.gy + r * L.cs, on = g.shown.has(key), p = ui.pop[key], s = p == null || p < 0 ? 1 : p < 0.25 ? 1 + Math.sin(p / 0.25 * Math.PI) * 0.18 : 1, m = 2;
    ctx.save(); ctx.translate(x + L.cs / 2, y + L.cs / 2); ctx.scale(s, s);
    ctx.fillStyle = on ? T.col : 'rgba(255,255,255,.42)'; rrect(-L.cs / 2 + m, -L.cs / 2 + m, L.cs - m * 2, L.cs - m * 2, 7 * k); ctx.fill(); if (!on) { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (on && (p == null || p >= 0)) { ctx.fillStyle = T.ink; ctx.font = `400 ${Math.round(L.cs * 0.6)}px ${TF}`; ctx.fillText(ch.toUpperCase(), 0, 2); } ctx.restore(); }
  // the top: level, place, ink and the jar
  ctx.font = `700 ${Math.round(12 * k)}px ${NUN}`; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(30,30,50,.75)'; if (g.place === 4) ctx.fillStyle = 'rgba(255,255,255,.8)';
  ctx.fillText(g.lesson ? `LESSON ${g.N} OF 3` : `LEVEL ${g.N} · ${PLACES[g.place].name.toUpperCase()}`, 14, 64 * k);
  for (let i = 0; i < g.inkMax; i++) { const x = W - 22 * k - i * 18 * k, y = 64 * k, on = i < g.ink; ctx.fillStyle = on ? '#2a3a8a' : 'rgba(42,58,138,.18)'; ctx.beginPath(); ctx.moveTo(x, y - 9 * k); ctx.quadraticCurveTo(x + 7 * k, y, x, y + 6 * k); ctx.quadraticCurveTo(x - 7 * k, y, x, y - 9 * k); ctx.fill(); }
  { const jx = 14, jy = 78 * k, jw = 26 * k, jh = 30 * k, f = (g.jar | 0) / JAR(); ctx.fillStyle = 'rgba(255,255,255,.5)'; rrect(jx, jy, jw, jh, 6 * k); ctx.fill(); ctx.fillStyle = '#ffd040'; rrect(jx + 2, jy + jh - 2 - (jh - 4) * f, jw - 4, (jh - 4) * f, 4 * k); ctx.fill(); ctx.strokeStyle = 'rgba(60,60,90,.5)'; ctx.lineWidth = 1.5; rrect(jx, jy, jw, jh, 6 * k); ctx.stroke();
    ctx.fillStyle = 'rgba(30,30,50,.75)'; if (g.place === 4) ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 ${Math.round(11 * k)}px ${NUN}`; ctx.fillText(`${g.bonus.length} bonus · 🪙 ${Math.max(0, g.bank - g.spent) + g.coins}`, jx + jw + 8, jy + jh / 2); }
  // the wheel
  const wob = FX.wob ? Math.sin(now * 40) * FX.wob * 8 * k : 0;
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(L.wx + wob, L.wy, L.wr, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.stroke();
  if (ui.path.length) { ctx.strokeStyle = 'rgba(255,140,60,.85)'; ctx.lineWidth = 8 * k; ctx.beginPath(); ui.path.forEach((i, j) => { const p = L.pts[i]; if (j) ctx.lineTo(p.x + wob, p.y); else ctx.moveTo(p.x + wob, p.y); }); if (ui.drag) ctx.lineTo(ui.fx, ui.fy); ctx.stroke(); }
  g.letters.forEach((ch, i) => { const p = L.pts[i], sel = ui.path.includes(i); ctx.fillStyle = sel ? '#ff8c3c' : 'rgba(255,255,255,0)'; ctx.beginPath(); ctx.arc(p.x + wob, p.y, L.lr, 0, TAU); ctx.fill();
    ctx.fillStyle = sel ? '#fff' : '#3a3a5a'; ctx.font = `400 ${Math.round(L.lr * 1.25)}px ${TF}`; ctx.fillText(ch.toUpperCase(), p.x + wob, p.y + 2); });
  // the buttons
  for (const [b, icon, lab] of [[L.shuf, '⟳', ''], [L.bulb, '💡', g.lesson ? (g.hints >= 2 ? '0' : 'free') : `${HINT()}`]]) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a5a'; ctx.font = `700 ${Math.round(b.r * 1.0)}px ${NUN}`; ctx.fillText(icon, b.x, b.y + 1);
    if (lab) { ctx.font = `800 ${Math.round(10 * k)}px ${NUN}`; ctx.fillStyle = '#fff'; const w = ctx.measureText(lab).width + 10; ctx.fillStyle = '#ff8c3c'; rrect(b.x - w / 2, b.y + b.r - 6, w, 14 * k, 7 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(lab, b.x, b.y + b.r + 1); } }
  // the word being spelled (or the last try's verdict)
  const cur = ui.path.map(i => g.letters[i]).join('').toUpperCase();
  if (cur) { ctx.font = `400 ${Math.round(24 * k)}px ${TF}`; const w = ctx.measureText(cur).width + 26 * k; ctx.fillStyle = '#ff8c3c'; rrect(W / 2 - w / 2, L.wordY - 18 * k, w, 36 * k, 18 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(cur, W / 2, L.wordY + 1); }
  else if (ui.flash) { ctx.globalAlpha = Math.max(0, 1 - ui.flash.t / 0.7); ctx.font = `700 ${Math.round(14 * k)}px ${NUN}`; const w = ctx.measureText(ui.flash.txt).width + 24; ctx.fillStyle = ui.flash.col; rrect(W / 2 - w / 2 + sh, L.wordY - 14 * k, w, 28 * k, 14 * k); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(ui.flash.txt, W / 2 + sh, L.wordY); ctx.globalAlpha = 1; }
  for (const f of ui.fly) { const t = f.t / f.life, e = t * t * (3 - 2 * t); ctx.globalAlpha = 1 - t * 0.6; ctx.font = `400 ${Math.round(18 * k * (1 - t * 0.5))}px ${TF}`; ctx.fillStyle = '#9ae6ff'; ctx.fillText(f.txt, lerp(f.x0, f.x1, e), lerp(f.y0, f.y1, e) - Math.sin(t * Math.PI) * 40 * k); ctx.globalAlpha = 1; }
  if (g.lesson) lessonPanel(g);
  for (const p of PARTS) { ctx.globalAlpha = Math.max(0, 1 - p.t / p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  for (const t2 of TXT) { const al = t2.t < 1 ? 1 : 1 - (t2.t - 1) / 0.5; ctx.globalAlpha = Math.max(0, al); const sc = t2.t < 0.12 ? 1.3 - t2.t / 0.12 * 0.3 : 1; ctx.font = `400 ${Math.round(t2.size * k * sc)}px ${TF}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,30,60,.55)'; ctx.strokeText(t2.txt, t2.x, t2.y - t2.t * 16); ctx.fillStyle = t2.col; ctx.fillText(t2.txt, t2.x, t2.y - t2.t * 16); }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  if (hint0) { const al = Math.min(1, hint0.t / 0.2, (hint0.secs - hint0.t) / 0.4); ctx.globalAlpha = Math.max(0, al); ctx.font = `700 ${Math.round(14 * k)}px ${NUN}`; const lines = wrapText(hint0.txt, W - 70), lh = 18 * k, h = lines.length * lh + 16 * k, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 30, y0 = L.wordY - 70 * k;
    ctx.fillStyle = 'rgba(40,36,70,.9)'; rrect(W / 2 - w / 2, y0 - h / 2, w, h, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 - h / 2 + 8 * k + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,90,90,${FX.red * 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,250,235,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) { coachPanel(G); }
