
// ===================== DRAW + JUICE: rewrite the drawing for each game; keep the juice helpers =====================
// Juice (PLAYBOOK): screen shake, a heartbeat of hit-stop, flashes, sparks, floating words, one-line hints, the lesson panel.
const FX = { shake: 0, stop: 0, flash: 0, red: 0 }, PT = [], TXT = [];
let hint = null;
function sparks(x, y, n, col, sp = 220) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.3, t: 0, col, r: 2 + Math.random() * 2.5 }); } if (PT.length > 300) PT.splice(0, PT.length - 300); }
function say(txt, x, y, col = '#fff', size = 24) { TXT.push({ txt, x, y, col, size, t: 0 }); if (TXT.length > 8) TXT.shift(); }
function tip(key, txt, secs = 2.6) { if (HEADLESS) return; tip.seen = tip.seen || {}; if (tip.seen[key]) return; tip.seen[key] = 1; hint = { txt, t: 0, secs }; }
function fxStep(dt) {
  FX.shake = Math.max(0, FX.shake - dt * 40); FX.flash = Math.max(0, FX.flash - dt * 4); FX.red = Math.max(0, FX.red - dt * 2);
  for (const p of PT) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.vx *= 0.98; }
  for (let i = PT.length - 1; i >= 0; i--) if (PT[i].t > PT[i].life) PT.splice(i, 1);
  for (const t of TXT) t.t += dt; while (TXT.length && TXT[0].t > 1.1) TXT.shift();
  if (hint) { hint.t += dt; if (hint.t > hint.secs) hint = null; }
}
// how the game reacts to what happened (sounds, sparks, words). Called once per event from the frame loop.
function onEvent(G, e) {
  const A = area(), px = A.x + e.x * A.w, py = A.y + e.y * A.h;
  switch (e.k) {
    case 'hit': sparks(px, py, 14 + Math.min(10, e.combo * 2), '#ffd36a'); FX.stop = 0.04; FX.shake = Math.min(10, 3 + e.combo); sfx.hit(e.combo); vibe(HAP.light); if (e.combo >= 3) say(`${e.combo} IN A ROW`, px, py - 46 * k, '#ffd36a', 20); break;
    case 'fault': FX.red = 0.6; FX.shake = 8; sfx.miss(); say(e.why === 'late' ? 'TOO LATE' : e.why === 'empty' ? 'NOTHING THERE' : 'TOO SOON', px, py - 40 * k, '#ff9a8a', 22);
      tip('fault_' + e.why, e.why === 'soon' ? 'Wait for the ring to turn gold' : e.why === 'late' ? 'Tap as soon as it turns gold' : 'Tap the targets, nothing else', 2.6); break;
    case 'empty': sfx.tick(); break;
    case 'lessonnext': if (e.first) hint = null; say(e.first ? 'FIRST, A LESSON' : 'NEXT LESSON', W / 2, H * 0.5, '#ffd36a', 26); sfx.ding(); break;
    case 'lessonok': say(`GOOD! ${e.n} OF ${e.need}`, W / 2, H * 0.5, '#9be3b5', 26); sfx.coin(e.n); break;
    case 'lessonmiss': say('TRY AGAIN', W / 2, H * 0.58, '#ffd0c4', 24); hint = { txt: e.how, t: 0, secs: 3.4 }; break;
    case 'lessondone': say('YOU KNOW IT. NOW PLAY!', W / 2, H * 0.5, '#ffd36a', 26); sfx.win(); if (!HEADLESS) store.set('taught', Math.max(store.get('taught', 0) | 0, e.N)); break;
    case 'won': FX.flash = 1; sfx.win(); vibe(HAP.best); break;
    case 'lost': sfx.lose(); break;      // (P11: never vibrate on failure)
  }
}
// the play area (below the top bar) in pixels
function area() { const top = 70 * k; return { x: 0, y: top, w: W, h: H - top - 30 * k }; }

function draw(now) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g0 = ctx.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#1a2233'); g0.addColorStop(1, '#0b0f18'); ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
  if (!G) return;
  ctx.save();
  if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
  const A = area();
  for (const g of G.rings) {
    const x = A.x + g.x * A.w, y = A.y + g.y * A.h, u = g.t / g.dur, rt = 30 * k, r = rt + (1 - Math.min(1, u)) * 120 * k, gold = goldNow(g);
    ctx.beginPath(); ctx.arc(x, y, rt, 0, TAU); ctx.fillStyle = gold ? 'rgba(255,211,106,.95)' : 'rgba(255,255,255,.14)'; ctx.fill();
    ctx.lineWidth = 3 * k; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = (gold ? 7 : 4) * k; ctx.strokeStyle = gold ? '#ffd36a' : 'rgba(200,215,240,.75)'; ctx.stroke();
    if (gold) { ctx.beginPath(); ctx.arc(x, y, r + 10 * k, 0, TAU); ctx.lineWidth = 2 * k; ctx.strokeStyle = 'rgba(255,211,106,.35)'; ctx.stroke(); }
  }
  for (const p of PT) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * k, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.restore();
  hud(G);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of TXT) { const a = t.t < 0.8 ? 1 : 1 - (t.t - 0.8) / 0.3; ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(t.size * k)}px ${BC}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.txt, t.x, t.y - t.t * 30 * k); ctx.fillStyle = t.col; ctx.fillText(t.txt, t.x, t.y - t.t * 30 * k); }
  ctx.globalAlpha = 1;
  if (hint) { const a = Math.min(1, hint.t / 0.2, (hint.secs - hint.t) / 0.4); ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; const w = Math.min(W - 24, ctx.measureText(hint.txt).width + 30); ctx.fillStyle = 'rgba(0,0,0,.65)'; rrect(W / 2 - w / 2, H * 0.84 - 18 * k, w, 36 * k, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(hint.txt, W / 2, H * 0.84, W - 40); ctx.globalAlpha = 1; }
  if (FX.red > 0) { ctx.fillStyle = `rgba(255,60,40,${FX.red * 0.25})`; ctx.fillRect(0, 0, W, H); }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
}
function hud(G) {
  const c = G.cfg, x = 16, w = W - 32, y = 48 * k;
  if (!G.lesson) {      // progress bar to the goal (P14 goal-gradient) and lives
    ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(x, y, w * 0.7, 10 * k, 5); ctx.fill();
    ctx.fillStyle = '#ffd36a'; rrect(x, y, Math.max(10, w * 0.7 * Math.min(1, G.hits / c.goal)), 10 * k, 5); ctx.fill();
    ctx.font = `700 ${Math.round(16 * k)}px ${BC}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff8a7a';
    ctx.fillText('♥'.repeat(Math.max(0, G.lives)) + '♡'.repeat(Math.max(0, c.lives - G.lives)), x + w, y + 5 * k);
  } else lessonPanel(G);
}
function wrapText(t, w) { const out = []; let cur = ''; for (const wd of t.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd; } else cur = tr; } if (cur) out.push(cur); return out; }
function lessonPanel(G) {      // the lesson on now, how to do it, a dot for each one done
  const D = G.lesson, st = D.steps[D.i], x = 16, w = W - 32, y = 44 * k; ctx.save();
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; const lines = wrapText(st.how, w - 24), h = 54 * k + lines.length * 17 * k;
  ctx.fillStyle = 'rgba(0,0,0,.72)'; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,211,106,.7)'; ctx.lineWidth = 2; rrect(x, y, w, h, 12); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#ffd36a'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.fillText(`LESSON ${D.i + 1} OF ${D.steps.length}`, x + 12, y + 10 * k);
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(18 * k)}px ${BC}`; ctx.fillText(st.title, x + 12, y + 25 * k);
  ctx.font = `700 ${Math.round(13 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.88)'; lines.forEach((l, i) => ctx.fillText(l, x + 12, y + 48 * k + i * 17 * k));
  for (let i = 0; i < st.need; i++) { ctx.beginPath(); ctx.arc(x + w - 16 - (st.need - 1 - i) * 18 * k, y + 18 * k, 6 * k, 0, TAU); if (i < D.n) { ctx.fillStyle = '#8fe0ab'; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); } }
  ctx.restore();
}
