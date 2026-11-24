// ===================== DRAW + JUICE: the keys (2D on purpose: tiles on a page, like the original) =====================
// Four ivory lanes and glossy black tiles, a soft glow at the top in the colour of the room. A tapped tile goes grey with a
// ripple and a little note floats up; a long tile fills with gold while it is held and sparkles when it is done; the START
// tile is blue and breathes. A wrong tap flashes red where it landed; a tile that got away: the page rolls back to show it,
// blinking red. The score is the number of tiles played, big at the top, with the song's name and a bar with its three stars.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null, RIP = [], NOTES = [], SPARK = [];
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 6) TXT.shift(); }
function tip(key, txt, secs = 3) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
const S1 = () => Math.min(W, H * 0.6) / 390;
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of String(t).split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lay() { return { s: S1(), lw: W / 4, rh: H / 4 }; }
function fxStep(dt) { FX.flash = Math.max(0, FX.flash - dt * 3); FX.red = Math.max(0, FX.red - dt * 2);
  for (const t of TXT) { t.t += dt; t.y -= dt * 20; } while (TXT.length && TXT[0].t > 1.3) TXT.shift(); if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
  for (const a of [RIP, NOTES, SPARK]) { for (const p of a) { p.t += dt; if (p.vy != null) { p.x += (p.vx || 0) * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; } } for (let i = a.length - 1; i >= 0; i--) if (a[i].t > a[i].life) a.splice(i, 1); } }
// where the page is: rolled back after a miss so the tile that got away is in sight
function viewPos(G) { if (G.miss && G.miss.missed) { const u = Math.min(1, G.miss.t * 3); return lerp(G.pos, Math.max(0, G.miss.y - 0.9), easeOut(u)); } return G.pos; }
const yOf = (G, rowY, vp) => H - (rowY - vp) * (H / 4);      /* screen y of a point rowY rows up the song */
function draw(now) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const L = lay(), s = L.s, g = G, P = PLACES[g ? g.place : 0];
  // the page: ivory lanes, faint row lines, a glow at the top
  ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, W, H);
  const gl = ctx.createLinearGradient(0, 0, 0, H * 0.35); gl.addColorStop(0, P.glow + '55'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H * 0.35);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let l = 1; l < 4; l++) ctx.fillRect(l * L.lw - 0.5, 0, 1, H);
  if (g) { const vp = viewPos(g);
    ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let r = Math.floor(vp); r < vp + 5; r++) ctx.fillRect(0, yOf(g, r, vp), W, 1);
    // the encore banner
    if (g.encAt && !g.lesson) { const y = yOf(g, g.encAt - 0.5, vp); if (y > -L.rh && y < H + L.rh) { ctx.fillStyle = 'rgba(232,184,48,.18)'; ctx.fillRect(0, y - L.rh / 2, W, L.rh); ctx.fillStyle = '#b8862a'; ctx.font = `${Math.round(26 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪  ENCORE  ♪', W / 2, y); } }
    // the tiles
    for (let k = Math.max(0, g.ri - 1); k < g.rows.length; k++) { const r = g.rows[k]; if (r.i > vp + 4.2) break; if (r.i + r.len < vp - 0.2) continue;
      const yTop = yOf(g, r.i + r.len, vp), yBot = yOf(g, r.i, vp), h = yBot - yTop;
      r.lanes.forEach((ln, j) => { const x = ln * L.lw, done = r.tapped[j], blink = g.miss && g.miss.missed && !done && Math.abs(g.miss.y - (r.i + 0.3)) < 0.01 && (g.miss.t < 0.5 || Math.sin(g.miss.t * 16) > -0.4);
        if (r.kind === 'start') { const br = done ? 0.35 : 0.85 + 0.15 * Math.sin(now * 4); ctx.fillStyle = `rgba(58,122,255,${br})`; rrect(x + 2, yTop + 2, L.lw - 4, h - 4, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `${Math.round(18 * s)}px ${TF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(done ? '♪' : 'START', x + L.lw / 2, yTop + h / 2); return; }
        if (blink) { ctx.fillStyle = '#ff3a3a'; rrect(x + 2, yTop + 2, L.lw - 4, h - 4, 6); ctx.fill(); return; }
        if (done && r.kind !== 'long') { ctx.fillStyle = 'rgba(30,30,40,.16)'; rrect(x + 2, yTop + 2, L.lw - 4, h - 4, 6); ctx.fill(); return; }
        const gr = ctx.createLinearGradient(x, yTop, x + L.lw, yBot); gr.addColorStop(0, '#2c2c36'); gr.addColorStop(0.5, '#101016'); gr.addColorStop(1, '#000'); ctx.fillStyle = done ? 'rgba(30,30,40,.3)' : gr; rrect(x + 2, yTop + 2, L.lw - 4, h - 4, 6); ctx.fill();
        if (!done) { ctx.fillStyle = 'rgba(255,255,255,.1)'; rrect(x + 6, yTop + 6, L.lw * 0.35, h - 12, 4); ctx.fill(); }
        if (r.kind === 'long') { const cx = x + L.lw / 2; ctx.strokeStyle = done ? 'rgba(232,184,48,.7)' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, yBot - 14 * s); ctx.lineTo(cx, yTop + 14 * s); ctx.stroke();
          if (done) { const fh = h * r.hold; const fg = ctx.createLinearGradient(0, yBot - fh, 0, yBot); fg.addColorStop(0, '#ffe08a'); fg.addColorStop(1, '#e8a830'); ctx.fillStyle = fg; rrect(x + 2, yBot - fh, L.lw - 4, Math.max(0, fh - 2), 6); ctx.fill(); if (r.held) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, yBot - fh, 7 * s + 2 * Math.sin(now * 20), 0, TAU); ctx.fill(); } }
          else { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(cx, yBot - 16 * s, 5 * s, 0, TAU); ctx.fill(); } } }); }
    // a wrong tap: red where it landed
    if (g.miss && !g.miss.missed) { const x = g.miss.lane * L.lw, y0 = yOf(g, Math.floor(g.miss.y) + 1, vp), on = g.miss.t < 0.4 || Math.sin(g.miss.t * 16) > -0.4; if (on) { ctx.fillStyle = 'rgba(255,58,58,.85)'; rrect(x + 2, y0 + 2, L.lw - 4, L.rh - 4, 6); ctx.fill(); } }
    // ripples, notes, sparkles
    for (const r of RIP) { const u = r.t / r.life; ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - u)})`; ctx.lineWidth = 3 * (1 - u) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, 10 + u * L.lw * 0.55, 0, TAU); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const n of NOTES) { const u = n.t / n.life; ctx.globalAlpha = 1 - u; ctx.fillStyle = n.col; ctx.font = `${Math.round(22 * s)}px serif`; ctx.fillText(n.ch, n.x + Math.sin(n.t * 6) * 6, n.y); } ctx.globalAlpha = 1;
    for (const p of SPARK) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    hud(g, L, now); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const q of TXT) { const a = q.t < 0.9 ? 1 : 1 - (q.t - 0.9) / 0.4, pop = 1 + 0.2 * Math.max(0, 1 - q.t * 6); ctx.globalAlpha = Math.max(0, a); ctx.font = `${Math.round(q.size * s * pop)}px ${TF}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.strokeText(q.txt, q.x, q.y); ctx.fillStyle = q.col; ctx.fillText(q.txt, q.x, q.y); } ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; const lines = wrapText(hint.txt, W - 50), lh = 17 * s, hh = lines.length * lh + 14, ww = W - 30;
    ctx.fillStyle = 'rgba(20,20,30,.9)'; rrect(W / 2 - ww / 2, H * 0.62 - hh / 2, ww, hh, 12); ctx.fill(); ctx.fillStyle = '#fff'; lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.62 - hh / 2 + 7 + lh * (i + 0.5))); ctx.globalAlpha = 1; }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,236,170,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); } }
function hud(G, L, now) { const s = L.s;
  if (G.lesson) { lessonPanel(G, L); return; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.fillStyle = '#e83a4a'; ctx.font = `${Math.round(46 * s)}px ${TF}`; ctx.strokeText(G.tiles, W / 2, 74 * s); ctx.fillText(G.tiles, W / 2, 74 * s);
  ctx.font = `italic 700 ${Math.round(13 * s)}px ${BC}`; ctx.fillStyle = 'rgba(40,30,40,.75)'; ctx.fillText(`${G.cfg.song.name} · ${G.cfg.song.by}`, W / 2, 106 * s);
  // the bar with the three stars: the song, every long tile held, the encore
  const bw = W * 0.6, bx = (W - bw) / 2, by = 122 * s, tot = G.total, u = clamp(G.pos / tot, 0, 1), m1 = G.songEnd / tot; ctx.fillStyle = 'rgba(0,0,0,.1)'; rrect(bx, by, bw, 6 * s, 3); ctx.fill(); ctx.fillStyle = '#e83a4a'; rrect(bx, by, bw * u, 6 * s, 3); ctx.fill();
  const star = (x, on, dim) => { ctx.font = `${Math.round(18 * s)}px sans-serif`; ctx.fillStyle = on ? '#e8b830' : dim ? 'rgba(0,0,0,.12)' : 'rgba(0,0,0,.25)'; ctx.fillText('★', x, by + 3 * s); };
  star(bx + bw * m1 - 12 * s, G.songDone, false); star(bx + bw * m1 + 10 * s, G.songDone && G.holdsAll, !G.holdsAll); star(bx + bw, G.encDone, false);
  if (!G.go && !G.miss) { ctx.fillStyle = 'rgba(40,30,40,.6)'; ctx.font = `700 ${Math.round(14 * s)}px ${BC}`; ctx.fillText('Tap START', W / 2, H * 0.62); } }
function lessonPanel(G, L) { coachPanel(G); }
function onEvent(G, e) { const L = lay(), s = L.s, vp = viewPos(G);
  switch (e.k) {
    case 'start': say(G.cfg.song.name, W / 2, H * 0.45, '#2a2030', 26); say(G.cfg.song.by, W / 2, H * 0.45 + 30 * s, '#8a7a8a', 16); sfx.chord([60, 64, 67]); if (G.N <= 1) tip('how', 'Tap START, then every black tile. Never the white!', 3); break;
    case 'go': sfx.chord([48, 55, 60]); break;
    case 'tap': { const x = (e.lane + 0.5) * L.lw, y = yOf(G, e.row.i + 0.5, vp); RIP.push({ x, y, t: 0, life: 0.35 });
      if (e.kind !== 'start') { NOTES.push({ x, y: y - 10, vy: -90, t: 0, life: 0.8, ch: ['♪', '♫', '♩'][(G.tiles + e.lane) % 3], col: ['#e83a4a', '#3a7aff', '#e8a830', '#8a4ae8'][e.lane] }); const n = e.notes[0], len = e.kind === 'long' ? e.row.len / Math.max(1, G.v) + 0.4 : 0; sfx.key(n, len, G.tiles); }
      break; }
    case 'held': { const x = (e.row.lanes[0] + 0.5) * L.lw, y = H * 0.75; for (let i = 0; i < 14; i++) { const a = Math.random() * TAU; SPARK.push({ x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 - 80, g: 300, t: 0, life: 0.6, col: '#e8b830', r: 2.5 }); } say(`+${e.row.len}`, x, y - 30 * s, '#e8a830', 22); sfx.chime(); vibe(HAP.light); break; }
    case 'letgo': sfx.letgo(); break;
    case 'white': case 'missed': sfx.wrong(); FX.red = 0.6; break;
    case 'grace': say('ONE MORE TRY', W / 2, H * 0.45, '#3a7aff', 24); break;
    case 'songdone': if (!G.lesson) { say('★ SONG COMPLETE ★', W / 2, H * 0.4, '#e8a830', 26); FX.flash = 0.5; sfx.fanfare(); vibe(HAP.best); } break;
    case 'encoredone': say('★ ENCORE! ★', W / 2, H * 0.4, '#e83a4a', 30); sfx.fanfare(); break;
    case 'lessonnext': if (e.first) hint = null; break;
    case 'lessonok': say(`${e.n} / ${e.need}`, W / 2, H * 0.45, '#e8a830', 26); break;
    case 'lessonmiss': coachMiss(); break;
    case 'lessondone': say('BRAVO!', W / 2, H * 0.45, '#e8a830', 32); sfx.fanfare(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': break;
    case 'lost': sfx.lose(); break;
  } }
