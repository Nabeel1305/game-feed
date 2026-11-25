
// ===================== DRAW (1 of 2): the house cut open, its pipes and parts =====================
// 2D on purpose: a house cut open like a doll's house shows every pipe, valve and tap at once, which is the whole puzzle
// (where is it really wrong?). Clean flat drawing: wallpapered rooms, wooden floors, cold pipes blue, hot pipes red, drains
// grey, water moving along the pipes (slow when the pressure is low, none when there is no water). The fault shows itself:
// drips, a puddle, spray, a rising flood, stink lines, a frosted pipe, a cold radiator, a jumping pressure needle.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null;
const SHORT = { ksink: 'Sink', basin: 'Basin', wc: 'Toilet', shower: 'Shower', heater: 'Boiler', rad: 'Radiator', main: 'Stopcock', prv: 'Valve', wm: 'Washer', otap: 'Tap', vent: 'Vent', sewer: 'Drain', pipe: 'Pipe' };
const NU = 'Nunito, "Barlow Condensed", "Arial Narrow", sans-serif';
function sparks(x, y, n, col, sp = 200) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.45 + Math.random() * 0.35, t: 0, col, r: 2 + Math.random() * 2.5, g: 520 }); } if (PT.length > 420) PT.splice(0, PT.length - 420); }
function drops(x, y, n, sp = 120) { for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.4, t: 0, col: '#7cc8ff', r: 1.6 + Math.random() * 2, g: 700 }); } }
function say(txt, x, y, col = '#fff', size = 22) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 3.2) { if (HEADLESS || !(G && G.lesson)) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
// ---------- where everything is on the screen ----------
function lay() { const s = S1(), top = 66 * s, sheetH = Math.round(clamp(H * 0.4, 250 * s, 340 * s)), sy = H - sheetH, aH = sy - top - 6;
  const bw = Math.min(W - 10, aH / 1.02), bh = bw * 1.02, bx = (W - bw) / 2, by = top + Math.max(0, (aH - bh) * 0.5);
  return { s, top, sheetH, sy, bx, by, bw, bh, X: u => bx + u * bw, Y: v => by + v * bh }; }
const floorOf = (id, y) => id === 'vent' ? 0.2 : (id === 'otap' || id === 'sewer') ? 0.885 : y < 0.52 ? 0.515 : 0.875;
// ---------- small things ----------
function fillR(x, y, w, h, r, col) { ctx.fillStyle = col; rrect(x, y, w, h, r); ctx.fill(); }
function circ(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function line(pts, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
// ---------- the parts, drawn at (x, y) with size u (about the height of the part) ----------
// st: what is wrong with it, for the look of it (frozen, cold, burst...)
function drawPart(id, x, y, u, st = {}, now = 0) { ctx.save(); ctx.translate(x, y); const k = u / 40;
  ctx.scale(k, k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const steel = '#c9d3dc', dark = '#5a6672', white = '#f6f8fa', brass = '#d9a441';
  switch (id) {
    case 'ksink': fillR(-26, -2, 52, 22, 3, '#c98d55'); fillR(-26, -4, 52, 5, 2, '#e8dccb'); fillR(-15, -4, 26, 6, 2, '#9aa6b2'); fillR(-20, 3, 18, 15, 2, '#b07a46'); fillR(2, 3, 18, 15, 2, '#b07a46'); circ(-4, 10, 1.4, '#6a4a2a'); circ(6, 10, 1.4, '#6a4a2a');
      line([[4, -4], [4, -20], [-6, -20], [-6, -14]], steel, 3.2); fillR(1, -9, 7, 3, 1.5, dark); break;
    case 'basin': fillR(-14, -6, 28, 8, 4, white); ctx.strokeStyle = '#c8d0d8'; ctx.lineWidth = 1.2; rrect(-14, -6, 28, 8, 4); ctx.stroke(); fillR(-4, 2, 8, 18, 2, white); line([[0, -6], [0, -14], [-6, -14]], steel, 2.6); fillR(-17, -34, 34, 22, 3, '#dfeaf2'); ctx.strokeStyle = '#a8b8c4'; ctx.lineWidth = 1.5; rrect(-17, -34, 34, 22, 3); ctx.stroke(); break;
    case 'wc': fillR(-6, -24, 18, 14, 2, white); ctx.strokeStyle = '#c8d0d8'; ctx.lineWidth = 1.2; rrect(-6, -24, 18, 14, 2); ctx.stroke(); fillR(-14, -10, 26, 6, 3, white); ctx.beginPath(); ctx.moveTo(-12, -4); ctx.quadraticCurveTo(-10, 12, 2, 14); ctx.lineTo(8, 20); ctx.lineTo(-6, 20); ctx.lineTo(-4, 14); ctx.quadraticCurveTo(-14, 8, -14, -4); ctx.closePath(); ctx.fillStyle = white; ctx.fill(); ctx.stroke(); fillR(-2, -27, 8, 3, 1.5, steel); break;
    case 'shower': fillR(-18, 14, 36, 6, 2, white); line([[12, 14], [12, -28], [2, -32]], steel, 2.4); fillR(-6, -36, 12, 5, 2.5, steel); fillR(9, -6, 6, 6, 3, dark); ctx.globalAlpha = 0.35; fillR(-18, -30, 36, 44, 2, '#bfe4ff'); ctx.globalAlpha = 1;
      if (!st.weak) for (let i = 0; i < 5; i++) { const yy = ((now * 60 + i * 9) % 40) - 28; ctx.globalAlpha = st.on ? 0.7 : 0; line([[-4 + i * 2, yy], [-4 + i * 2, yy + 5]], '#7cc8ff', 1.2); } ctx.globalAlpha = 1; break;
    case 'heater': fillR(-14, -22, 28, 40, 3, white); ctx.strokeStyle = '#c8d0d8'; ctx.lineWidth = 1.2; rrect(-14, -22, 28, 40, 3); ctx.stroke(); fillR(-8, -2, 16, 10, 2, '#2a3038');
      if (!st.out) { const fl = 0.7 + 0.3 * Math.sin(now * 14); ctx.fillStyle = '#4aa8ff'; ctx.beginPath(); ctx.ellipse(0, 6 - 3 * fl, 3, 4 * fl, 0, 0, TAU); ctx.fill(); }
      circ(0, -12, 5, '#eef2f6'); ctx.strokeStyle = dark; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -12, 5, 0, TAU); ctx.stroke(); { const a = -Math.PI * 0.9 + (st.low ? 0.3 : 1.1) * Math.PI * 0.8; line([[0, -12], [Math.cos(a) * 4, -12 + Math.sin(a) * 4]], '#d03a3a', 1.2); }
      line([[-8, 18], [-8, 24]], '#d04a3a', 3); line([[8, 18], [8, 24]], '#3a8ad0', 3); break;
    case 'rad': for (let i = 0; i < 6; i++) { const g = ctx.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, st.cold ? '#bcd4ea' : '#f4e2d8'); g.addColorStop(0.5, st.cold ? '#e8eef4' : '#f8ece4'); g.addColorStop(1, '#f6e6dc'); ctx.fillStyle = g; rrect(-21 + i * 7, -12, 6, 26, 2.5); ctx.fill(); }
      ctx.strokeStyle = '#c8b8ac'; ctx.lineWidth = 0.8; for (let i = 0; i < 6; i++) { rrect(-21 + i * 7, -12, 6, 26, 2.5); ctx.stroke(); } fillR(19, -14, 5, 4, 1, brass); fillR(-25, 10, 5, 5, 1, st.shut ? '#c03030' : brass); break;
    case 'main': line([[-24, 8], [24, 8]], '#3a8ad0', 5); circ(-8, 0, 9, '#f2f2ee'); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-8, 0, 9, 0, TAU); ctx.stroke(); { const a = now * (st.flow || 0) * 5; line([[-8, 0], [-8 + Math.cos(a) * 6, Math.sin(a) * 6]], '#d03a3a', 1.4); } fillR(-12, -12, 8, 4, 1, dark);
      fillR(10, 3, 8, 10, 2, brass); line([[14, 3], [14, -6]], dark, 2); fillR(st.shut ? 6 : 8, -10, st.shut ? 16 : 12, 5, 2.5, '#d83a3a'); if (st.ice) { ctx.globalAlpha = 0.85; fillR(-24, 4, 22, 8, 3, '#e0f4ff'); ctx.globalAlpha = 1; } break;
    case 'prv': line([[-22, 8], [22, 8]], '#3a8ad0', 5); fillR(-8, 0, 16, 16, 3, brass); fillR(-5, -10, 10, 11, 2, '#c08a30'); circ(0, -16, 7, '#f2f2ee'); ctx.strokeStyle = dark; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -16, 7, 0, TAU); ctx.stroke();
      { const v = st.hi ? 0.95 : st.lo ? 0.12 : 0.5, a = Math.PI * (0.8 + v * 1.4) + (st.hi ? Math.sin(now * 30) * 0.08 : 0); line([[0, -16], [Math.cos(a) * 5.5, -16 + Math.sin(a) * 5.5]], '#d03a3a', 1.3); } break;
    case 'wm': fillR(-18, -22, 36, 42, 3, white); ctx.strokeStyle = '#c8d0d8'; ctx.lineWidth = 1.2; rrect(-18, -22, 36, 42, 3); ctx.stroke(); fillR(-18, -22, 36, 8, 3, '#e4e9ee'); circ(0, 2, 12, '#9aa6b2'); circ(0, 2, 9, st.full ? '#6aa8d8' : '#3a4450'); circ(10, -18, 2, '#5ad86a'); line([[18, -16], [26, -16], [26, -28]], st.split ? '#9aa' : '#8a96a2', 2.4); break;
    case 'otap': fillR(-6, -8, 12, 10, 2, brass); line([[0, -8], [0, -14]], dark, 2); fillR(-6, -17, 12, 4, 2, '#d83a3a'); line([[-6, -2], [-12, 6]], brass, 3.5); if (st.ice) { ctx.globalAlpha = 0.85; fillR(-10, -10, 16, 14, 4, '#e0f4ff'); ctx.globalAlpha = 1; } break;
    case 'vent': line([[0, 18], [0, -14]], '#8a96a2', 6); fillR(-7, -20, 14, 6, 2, '#5a6672'); if (st.nest) { ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.ellipse(0, -21, 9, 4, 0, Math.PI, 0); ctx.fill(); for (let i = 0; i < 6; i++) line([[-8 + i * 3, -21], [-6 + i * 3, -25]], '#6a4018', 0.8); } break;
    case 'sewer': ctx.fillStyle = '#4a5058'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2a3038'; ctx.lineWidth = 1; for (let i = -2; i <= 2; i++) line([[i * 5, -4], [i * 5, 4]], '#2a3038', 0.8); break;
    case 'pipe': line([[-26, 0], [-4, 0]], '#3a8ad0', 6); line([[4, 0], [26, 0]], '#3a8ad0', 6); if (st.fixed) line([[-6, 0], [6, 0]], '#d9a441', 6); break;
  }
  ctx.restore(); }
// ---------- the house: drawn once per job into its own picture ----------
const HOUSE = { key: '', oc: null };
function houseState(G) { const J = G.job; if (!J) return {}; const c = J.call, id = c.job.id, st = {}, si = J.si, cz = c.cause, todo = s => J.steps.slice(si).some(q => q[1] === s);
  // what each part looks like right now, from what is still wrong
  st.flow = (id === 'nowater' && si === 0) ? 0 : (cz.weak && si === 0) ? 0.35 : (J.flooding ? 1.6 : 1);
  st.mainShut = J.steps.some(q => q[1] === 'Shut off') && J.si >= 1 && J.steps.findIndex(q => q[1] === 'Shut off') < J.si;
  if (id === 'nowater' && si === 0 && cz.cold) st.ice = true; if (id === 'nowater' && si === 0 && !cz.cold) st.mainShutFault = true;
  if (cz.at === 'prv' && si === 0) st.prv = id === 'bang' ? 'hi' : 'lo'; if (id === 'nohot' && todo('Light pilot')) st.pilotOut = true; if (id === 'boiler' && si === 0) st.boilerLow = true;
  if (id === 'radcold' && si === 0) st.radCold = true; if (id === 'radcold' && todo('Set valve')) st.radShut = true; if (id === 'smell' && si === 0) st.nest = true; if (id === 'otapfrozen' && si === 0) st.otapIce = true;
  if ((id === 'wmflood') && si < 2) st.wmSplit = true; if (id === 'wmdrain' && si === 0) st.wmFull = true; if (id === 'burst') st.pipeFixed = si >= 2;
  return st; }
function partState(G, id, now) { const S = houseState(G), J = G.job; const o = {};
  if (id === 'main') { o.flow = S.mainShut ? 0 : S.flow; o.shut = S.mainShut || S.mainShutFault; o.ice = S.ice; }
  if (id === 'prv') { o.hi = S.prv === 'hi'; o.lo = S.prv === 'lo'; } if (id === 'heater') { o.out = S.pilotOut; o.low = S.boilerLow; } if (id === 'rad') { o.cold = S.radCold; o.shut = S.radShut; }
  if (id === 'vent') o.nest = S.nest; if (id === 'otap') o.ice = S.otapIce; if (id === 'wm') { o.split = S.wmSplit; o.full = S.wmFull; } if (id === 'pipe') o.fixed = S.pipeFixed;
  if (id === 'shower') { o.weak = J && J.call.cause.weak && J.si === 0; o.on = J && J.call.job.id === 'lowpress'; }
  return o; }
function paintHouse(G, L) { const J = G.job, c = J.call, key = [c.id, W, H, DPR, J.si].join(':'); if (HOUSE.key === key) return; HOUSE.key = key;
  const oc = HOUSE.oc || (HOUSE.oc = document.createElement('canvas')); oc.width = cv.width; oc.height = cv.height; const o = oc.getContext('2d'), save = ctx; o.setTransform(DPR, 0, 0, DPR, 0, 0);
  _ctx = o; houseBody(G, L, c); }
let _ctx = null;
function houseBody(G, L, c) { const o = _ctx, X = L.X, Y = L.Y, m = c.mirror, mx = u => m ? 0.96 - u : u, h = c.hue;
  const P = PLACES[G.place]; const sky = o.createLinearGradient(0, L.top, 0, L.Y(0.9)); sky.addColorStop(0, P.sky[0]); sky.addColorStop(1, P.sky[1]); o.fillStyle = sky; o.fillRect(0, L.top - 10, W, L.Y(0.885) - L.top + 10);
  // far hills and the garden
  o.fillStyle = '#9cc890'; o.beginPath(); o.moveTo(0, L.Y(0.8)); for (let i = 0; i <= 8; i++) o.quadraticCurveTo(W * (i + 0.5) / 8, L.Y(0.72 + 0.03 * Math.sin(i * 2.1 + c.id)), W * (i + 1) / 8, L.Y(0.8)); o.lineTo(W, L.Y(0.9)); o.lineTo(0, L.Y(0.9)); o.fill();
  o.fillStyle = '#6aa85a'; o.fillRect(0, L.Y(0.885), W, L.Y(0.92) - L.Y(0.885)); o.fillStyle = '#8a6a4a'; o.fillRect(0, L.Y(0.92), W, L.sy - L.Y(0.92) + 4);
  o.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 40; i++) { const xx = (i * 97.3 + c.id * 13) % W, yy = L.Y(0.94) + ((i * 53) % 40) * L.s; o.fillRect(xx, yy, 3, 2); }
  // walls and roof
  const wl = X(0.04), wr = X(0.92); o.fillStyle = '#e9e1d4'; o.fillRect(wl - 5, Y(0.2), wr - wl + 10, Y(0.885) - Y(0.2));
  o.fillStyle = ['#b5523a', '#5a6a7a', '#7a4a3a', '#3a5a6a'][c.style]; o.beginPath(); o.moveTo(X(0.0), Y(0.215)); o.lineTo(X(0.48), Y(0.0)); o.lineTo(X(0.96), Y(0.215)); o.closePath(); o.fill();
  o.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 1; i < 6; i++) { o.fillRect(X(0.02 + i * 0.02), Y(0.215 - i * 0.035), X(0.94 - i * 0.04) - X(0.02 + i * 0.04), 1.2); }
  o.fillStyle = '#f2e8d8'; o.beginPath(); o.moveTo(X(0.07), Y(0.2)); o.lineTo(X(0.48), Y(0.025)); o.lineTo(X(0.89), Y(0.2)); o.closePath(); o.fill();      // the loft, inside
  const room = (x0, x1, y0, y1, hue, pat) => { const a = X(Math.min(mx(x0), mx(x1))), b = X(Math.max(mx(x0), mx(x1))); o.fillStyle = hsl(hue, 35, 82); o.fillRect(a, Y(y0), b - a, Y(y1) - Y(y0));
    o.fillStyle = hsl(hue, 30, 74); for (let xx = a + 6; xx < b; xx += pat) o.fillRect(xx, Y(y0), 2, Y(y1) - Y(y0));
    o.fillStyle = '#b98a5a'; o.fillRect(a, Y(y1) - 5 * L.s, b - a, 5 * L.s); o.fillStyle = 'rgba(0,0,0,.12)'; o.fillRect(a, Y(y1) - 5 * L.s, b - a, 1.2); };
  room(0.045, 0.58, 0.21, 0.515, (h + 180) % 360, 14 * L.s); room(0.58, 0.915, 0.21, 0.515, (h + 40) % 360, 22 * L.s); room(0.045, 0.5, 0.525, 0.875, (h + 90) % 360, 18 * L.s); room(0.5, 0.915, 0.525, 0.875, h, 26 * L.s);
  // bathroom tiles, kitchen tiles
  { const a = X(Math.min(mx(0.045), mx(0.58))), b = X(Math.max(mx(0.045), mx(0.58))); o.fillStyle = 'rgba(255,255,255,.55)'; for (let xx = a; xx < b; xx += 9 * L.s) for (let yy = Y(0.38); yy < Y(0.505); yy += 9 * L.s) o.fillRect(xx + 0.5, yy + 0.5, 8 * L.s, 8 * L.s); }
  // the floors (thick) and the inner walls
  o.fillStyle = '#7a5a3a'; o.fillRect(wl - 5, Y(0.515), wr - wl + 10, Y(0.53) - Y(0.515)); o.fillRect(wl - 5, Y(0.2), wr - wl + 10, Y(0.21) - Y(0.2)); o.fillRect(wl - 5, Y(0.875), wr - wl + 10, Y(0.89) - Y(0.875));
  o.fillStyle = '#d8ccb8'; o.fillRect(X(mx(0.58)) - 3, Y(0.21), 6, Y(0.515) - Y(0.21)); o.fillRect(X(mx(0.5)) - 3, Y(0.53), 6, Y(0.875) - Y(0.53));
  o.fillStyle = '#c8bca8'; o.fillRect(wl - 5, Y(0.2), 5, Y(0.885) - Y(0.2)); o.fillRect(wr, Y(0.2), 5, Y(0.885) - Y(0.2));
  // windows and a door, for life
  const win = (u, v) => { const x = X(mx(u)), y = Y(v), w = 30 * L.s, hh = 36 * L.s; o.fillStyle = '#ffffff'; o.fillRect(x - w / 2 - 3, y - hh / 2 - 3, w + 6, hh + 6); o.fillStyle = P.sky[0]; o.fillRect(x - w / 2, y - hh / 2, w, hh); o.fillStyle = '#fff'; o.fillRect(x - 1, y - hh / 2, 2, hh); o.fillRect(x - w / 2, y - 1, w, 2); };
  win(0.68, 0.33); win(0.84, 0.33); win(0.1, 0.63); o.fillStyle = '#7a4a2a'; { const x = X(mx(0.88)), y0 = Y(0.6); o.fillRect(x - 10 * L.s, y0, 20 * L.s, Y(0.875) - y0 - 5 * L.s); }
  // bed, sofa: a few shapes
  { const x = X(mx(0.82)), y = Y(0.515) - 5 * L.s; o.fillStyle = hsl((h + 200) % 360, 40, 60); o.fillRect(x - 26 * L.s, y - 12 * L.s, 40 * L.s, 12 * L.s); o.fillStyle = '#fff'; o.fillRect(x - 26 * L.s, y - 16 * L.s, 10 * L.s, 6 * L.s); }
  // the pipes: cold riser from the main, branches to each part; hot from the boiler; drains down to the sewer
  const at = id => { const p = spot(G, id); return [X(p[0]), Y(p[1])]; }, [mxp, myp] = at('main'), riser = X(mx(0.62)), u = L.s;
  const cold = '#3a8ad0', hot = '#d04a3a', drain = '#8a96a2';
  const run = (pts, col, w) => { o.strokeStyle = 'rgba(0,0,0,.18)'; o.lineWidth = w + 2; o.lineCap = 'round'; o.lineJoin = 'round'; o.beginPath(); pts.forEach(([x, y], i) => i ? o.lineTo(x, y) : o.moveTo(x, y)); o.stroke(); o.strokeStyle = col; o.lineWidth = w; o.stroke(); };
  HOUSE.pipes = [];
  const add = (pts, col, kind) => { HOUSE.pipes.push({ pts, col, kind }); run(pts, col, kind === 'drain' ? 5 * u : 3.4 * u); };
  add([[X(1.0), Y(0.9)], [mxp, Y(0.9)], [mxp, myp + 4 * u]], cold, 'in');
  add([[mxp, Y(0.86)], [riser, Y(0.86)], [riser, Y(0.25)]], cold, 'cold');
  for (const id of ['ksink', 'wm', 'heater', 'otap']) { const [x, y] = at(id); const yy = id === 'heater' ? y + 20 * u : y + 2 * u; add([[riser, Y(0.86) - (id === 'otap' ? 30 : 8) * u], [x, Y(0.86) - (id === 'otap' ? 30 : 8) * u], [x, yy]], cold, 'cold'); }
  for (const id of ['basin', 'wc', 'shower']) { const [x, y] = at(id); add([[riser, Y(0.25)], [x, Y(0.25)], [x, y - (id === 'shower' ? 28 : 16) * u]], cold, 'cold'); }
  { const [hx, hy] = at('heater'), [rx, ry] = at('rad'); add([[hx - 6 * u, hy + 20 * u], [hx - 6 * u, Y(0.535)], [rx, Y(0.535)], [rx, ry + 12 * u]], hot, 'hot'); const [bx2] = at('basin'), [sx] = at('shower'); add([[hx - 6 * u, Y(0.535)], [bx2 + 6 * u, Y(0.535)]], hot, 'hot'); }
  { const stack = X(mx(0.53)); for (const id of ['basin', 'wc', 'shower']) { const [x, y] = at(id); add([[x, y + 14 * u], [x, Y(0.505)], [stack, Y(0.505)]], drain, 'drain'); } for (const id of ['ksink', 'wm']) { const [x, y] = at(id); add([[x, y + 14 * u], [x, Y(0.868)], [stack, Y(0.868)]], drain, 'drain'); }
    const [vx, vy] = at('vent'), [sx, sy] = at('sewer'); add([[vx, vy + 10 * u], [vx, Y(0.2)], [stack, Y(0.22)], [stack, Y(0.95)], [sx, Y(0.95)], [sx, sy + 3 * u]], drain, 'drain'); }
  // the parts that do not change during a job are drawn live (they animate), so nothing more here
}
// ---------- live layer: water in the pipes, the parts, the people, the trouble ----------
function liveHouse(G, L, now) { const J = G.job, c = J.call, X = L.X, Y = L.Y, u = L.s, S = houseState(G);
  // water moving: dashes along the cold pipes
  const flow = S.mainShut ? 0 : S.flow; if (flow > 0 && HOUSE.pipes) { ctx.setLineDash([4 * u, 10 * u]); ctx.lineDashOffset = -now * 40 * flow * u; ctx.strokeStyle = 'rgba(210,240,255,.85)'; ctx.lineWidth = 1.4 * u; ctx.lineCap = 'butt';
    for (const p of HOUSE.pipes) { if (p.kind !== 'cold' && p.kind !== 'in') continue; ctx.beginPath(); p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); } ctx.setLineDash([]); }
  if (S.prv === 'hi') { /* banging: the pipes shiver */ }
  // parts
  for (const id of J.parts) { const [px, py] = spot(G, id), x = X(px), y = Y(py), big = id === 'heater' || id === 'wm' ? 1.0 : id === 'pipe' ? 0.9 : 0.8;
    let sh = 0; if (S.prv === 'hi' && (id === 'ksink' || id === 'basin') && Math.sin(now * 2.2) > 0.6) sh = Math.sin(now * 60) * 1.5 * u;
    drawPart(id, x + sh, y, 40 * u * big * (L.bw / 380), partState(G, id, now), now);
    { const nm = SHORT[id]; ctx.font = `800 ${Math.round(8.5 * u)}px ${NU}`; const tw = ctx.measureText(nm).width + 8, ly = y + (id === 'vent' ? -30 : id === 'sewer' ? 12 : 24) * u; ctx.fillStyle = 'rgba(8,24,40,.55)'; rrect(x - tw / 2, ly - 6 * u, tw, 12 * u, 6 * u); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(nm, x, ly + 0.5); }
    const seen = J.seenParts && J.seenParts[id]; if (seen) { const b = seen === 'bad'; circ(x + 15 * u, y - 18 * u, 7 * u, b ? '#ff5a4a' : '#4ac06a'); ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(10 * u)}px ${NU}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b ? '!' : '✓', x + 15 * u, y - 17.5 * u); }
    if (J.look && J.look.id === id) { ctx.strokeStyle = 'rgba(255,200,40,.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, 26 * u, 0, TAU); ctx.stroke(); } }
  // the trouble, where it is
  const fault = J.steps[J.si], id0 = c.job.id, [ax, ay] = spot(G, c.at), fx = X(ax), fy = Y(ay);
  if (id0 === 'drip' && J.si === 0 && Math.random() < 0.05) drops(fx + (c.mirror ? -1 : 1) * -2 * u, fy - 10 * u, 1, 10);
  if (id0 === 'drip' && J.si === 0) { const t = (now * 1.6) % 1; circ(fx - 6 * u * (c.at === 'ksink' ? -0.3 : 1), fy - 12 * u + t * 14 * u, 2 * u, `rgba(124,200,255,${1 - t})`); }
  if (id0 === 'trap' && J.si === 0) puddle(fx, Y(floorOf(c.at, ay)) - 5 * u, 22 * u, now);
  if (id0 === 'sinkclog' && J.si === 0) { ctx.fillStyle = 'rgba(120,130,110,.85)'; ctx.fillRect(fx - 12 * u, fy - 3 * u, 18 * u, 3 * u); }
  if (id0 === 'wcclog' && J.si === 0) { ctx.fillStyle = 'rgba(140,130,90,.9)'; ctx.beginPath(); ctx.ellipse(fx - 1 * u, fy - 8 * u, 9 * u, 2.5 * u, 0, 0, TAU); ctx.fill(); }
  if (id0 === 'wcrun' && J.si === 0) { for (let i = 0; i < 3; i++) { const t = ((now * 0.8 + i / 3) % 1); ctx.globalAlpha = 1 - t; line([[fx + 3 * u, fy - 20 * u - t * 12 * u], [fx + 6 * u, fy - 24 * u - t * 12 * u]], '#7cc8ff', 1.5); } ctx.globalAlpha = 1; }
  if ((id0 === 'smell' || id0 === 'sewer') && J.si === 0) for (let i = 0; i < 3; i++) { const t = (now * 0.5 + i / 3) % 1; ctx.strokeStyle = `rgba(120,170,60,${0.8 * (1 - t)})`; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const yy = fy - 14 * u - t * 30 * u - k * 2 * u; const xx = fx - 10 * u + i * 8 * u + Math.sin(k * 0.9 + now * 3) * 3 * u; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
  if (id0 === 'sewer' && J.si === 0) puddle(fx, Y(0.875) - 5 * u, 16 * u, now, 'rgba(130,120,80,.7)');
  if ((id0 === 'bang') && J.si === 0 && Math.sin(now * 2.2) > 0.6) { ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.round(12 * u)}px ${TF}`; ctx.textAlign = 'center'; ctx.fillText('BANG!', fx + 18 * u, fy - 26 * u); }
  if (id0 === 'cartridge' && J.si < 2) { const t = (now * 1.4) % 1; circ(fx - 1 * u, fy - 28 * u + t * 40 * u, 1.8 * u, `rgba(124,200,255,${1 - t})`); }
  if (id0 === 'aerator' && J.si === 0 && Math.random() < 0.2) drops(fx + 2 * u, fy - 12 * u, 1, 60);
  // spray: a burst pipe, a split hose, a split outside tap, or a fix done before the shut-off
  const spraying = J.flooding || (id0 === 'otap' && J.si < 1) || J.spray; if (spraying) { const sp = id0 === 'burst' ? spot(G, 'pipe') : id0 === 'wmflood' ? spot(G, 'wm') : id0 === 'otap' ? spot(G, 'otap') : spot(G, J.steps[J.steps.length - 1][0]); if (Math.random() < 0.7) drops(X(sp[0]), Y(sp[1]) - 4 * u, 2, 170); }
  // the flood: water rising in the room
  if (J.water > 0) { const id = c.job.id === 'burst' ? 'pipe' : c.at, [px, py] = spot(G, id), fl = Y(floorOf(id === 'pipe' ? 'ksink' : id, py === 0.555 ? 0.6 : py)) - 4 * u, top = Y(id === 'pipe' ? 0.53 : py < 0.52 ? 0.21 : 0.53), lvl = fl - (fl - top) * Math.min(1, J.water) * 0.9;
    const xr = py < 0.52 ? [0.045, 0.915] : [0.045, 0.915]; ctx.fillStyle = 'rgba(70,150,230,.42)'; ctx.beginPath(); ctx.moveTo(X(xr[0]), fl); for (let xx = X(xr[0]); xx <= X(xr[1]); xx += 6) ctx.lineTo(xx, lvl + Math.sin(xx * 0.08 + now * 4) * 2 * u); ctx.lineTo(X(xr[1]), fl); ctx.closePath(); ctx.fill(); }
  // the plumber and the customer
  const me = J.walk ? (() => { const a = spot(G, J.me), b = spot(G, J.walk.id), t = easeOut(clamp(J.walk.t / J.walk.dur, 0, 1)); return [lerp(a[0], b[0], t), lerp(floorOf(J.me, a[1]), floorOf(J.walk.id, b[1]), t), true]; })() : (() => { const a = spot(G, J.me); return [a[0], floorOf(J.me, a[1]), false]; })();
  const [cx0, cy0] = spot(G, c.at), cust = [clamp(cx0 + (cx0 > 0.5 ? -0.12 : 0.12), 0.08, 0.88), floorOf(c.at, cy0)];
  person(X(cust[0]), Y(cust[1]) - 5 * u, 30 * u * (L.bw / 380), { hue: c.hue, mood: J.mood, cust: true }, now);
  person(X(me[0] + 0.035), Y(me[1]) - 5 * u, 32 * u * (L.bw / 380), { walk: me[2], busy: !!J.fix }, now); }
function puddle(x, y, r, now, col = 'rgba(80,160,230,.55)') { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, r * (1 + 0.04 * Math.sin(now * 2)), r * 0.22, 0, 0, TAU); ctx.fill(); }
// a little person: the plumber (cap, blue overalls) or the customer (their own colour; a face that shows their patience)
function person(x, y, h, o, now) { ctx.save(); ctx.translate(x, y); const k = h / 30; ctx.scale(k, k); const sw = o.walk ? Math.sin(now * 14) * 4 : 0, bob = o.busy ? Math.abs(Math.sin(now * 8)) * 1.2 : 0;
  line([[-2, -10], [-3 - sw * 0.5, 0]], o.cust ? '#3a3a4a' : '#24508a', 3.2); line([[2, -10], [3 + sw * 0.5, 0]], o.cust ? '#3a3a4a' : '#24508a', 3.2);
  if (o.cust) fillR(-5, -21 - bob, 10, 13, 3, hsl(o.hue, 55, 52)); else { fillR(-5, -21 - bob, 10, 13, 3, '#2a64b0'); fillR(-4, -20 - bob, 8, 4, 1, '#3a78c8'); }
  line([[-5, -18 - bob], [-8 - (o.busy ? 2 : 0), -11 - bob - (o.busy ? 4 : 0)]], o.cust ? hsl(o.hue, 55, 52) : '#2a64b0', 2.6); line([[5, -18 - bob], [8 + (o.busy ? 3 : 0), -12 - bob - (o.busy ? 3 : 0)]], o.cust ? hsl(o.hue, 55, 52) : '#2a64b0', 2.6);
  circ(0, -26 - bob, 5, o.cust ? hsl((o.hue * 7) % 40 + 15, 45, 62) : '#e8b088');
  if (!o.cust) { fillR(-5.5, -32 - bob, 11, 4, 2, '#d83a3a'); fillR(0, -29.5 - bob, 7, 1.6, 0.8, '#d83a3a'); if (o.busy) { line([[9, -13 - bob], [13, -18 - bob]], '#8a96a2', 2); } }
  else { const m = clamp(o.mood, 0, 1); ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 0.9; ctx.beginPath(); const sm = (m - 0.5) * 2.4; ctx.moveTo(-2, -24 - bob); ctx.quadraticCurveTo(0, -24 + sm - bob, 2, -24 - bob); ctx.stroke(); circ(-1.8, -27 - bob, 0.7, '#3a2a2a'); circ(1.8, -27 - bob, 0.7, '#3a2a2a');
    if (m < 0.4) { ctx.fillStyle = '#ff5a4a'; ctx.font = '900 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', 7, -32 - bob); } }
  ctx.restore(); }
