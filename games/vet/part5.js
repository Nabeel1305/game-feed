
// ===================== SHARED: screens, levels, pause, the feed, the frame loop, the test hook (rarely touched) =====================
// What every game must have (CLAUDE.md, LESSONS rules 4, 7, 11, 12) is all here, working off part2's newGame / step / finish:
//   - level memory: it opens on the level he was on; a win saves the next level at once; lower levels open, higher ones locked
//   - the pause menu: Resume, Restart, Levels (#pResume, #pRestart, #pLevels) and Home; window.gameFeedLevels() for the feed
//   - window.gameFeedStart('mini'): playing within a second of a tap on the card, at his own level, no menu or countdown
//   - help after three losses on a level (it only gives time: makeCfg's help), stars, best, a short loss moment (P23)
//   - the lessons of the first three levels (saved once passed)
//   - smoothness: the picture is made less sharp, a notch at a time, if this phone cannot keep up (rule 12)
let G = null, paused = false, level = 1, unlocked = store.get('unlocked', 1), stars = store.get('stars', {}), streaks = store.get('streaks', {}), best = store.get('best', {});
document.getElementById('rulesList').innerHTML = RULES.map(r => `<li>${r}</li>`).join('');
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause', 'ovSet'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
const helpOn = () => (streaks[level] || 0) >= 3;
const playing = () => !!G && !G.over && !paused && $('ovHome').classList.contains('hidden') && $('ovEnd').classList.contains('hidden');
function showHome() {
  savedLevel(); G = null; paused = false; $('pauseBtn').classList.add('hidden');
  $('hLvl').textContent = level;
  const bt = best[level];
  $('hStat').innerHTML = [bt ? `Your best here: <b>${bt}</b> gentle visits in a row` : '', helpOn() ? '<span class="help">Help is on for this level: everything is a little slower.</span>' : ''].filter(Boolean).join('<br>');
  show('ovHome');
}
function startGame() {
  audio(); if (tutForce == null) tutRun = null; if (!HEADLESS && tutForce == null) store.set('level', level);
  G = newGame(level, { help: helpOn(), teach: true, taught: tutForce != null ? tutForce : store.get('taught', 0) | 0 }); paused = false; endT = 0;
  TXT.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0; ui.drag = null; hint = null;
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function saveResult(G) {      // a win saves the next level at once (leaving before "Next" still brings him back to it)
  const r = G.res, L = G.N; if (HEADLESS) return;
  if (r.win) { streaks[L] = 0; stars[L] = Math.max(stars[L] || 0, r.stars); unlocked = Math.max(unlocked, L + 1); level = Math.min(unlocked, L + 1); store.set('level', level); store.set('unlocked', unlocked); store.set('stars', stars);
    if (r.combo > (best[L] || 0)) { r.nb = best[L] != null; best[L] = r.combo; store.set('best', best); } }
  else streaks[L] = (streaks[L] || 0) + 1;
  store.set('streaks', streaks);
}
function showEnd() {
  const r = G.res, L = G.N; $('pauseBtn').classList.add('hidden');
  $('eTitle').textContent = r.win ? (L % 10 === 0 ? 'A BUSY DAY DONE' : 'DAY DONE') : 'YOU FAILED'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : '';
  $('eSub').innerHTML = r.win ? `<b>${r.treated}</b> made better · <b>${r.combo}</b> gentle in a row${r.nb ? ' <b class="nb">NEW BEST</b>' : ''}` + (r.stars < 3 ? '<br>None bolting and no rough handling for three stars.' : '')
    : `You made the animal too nervous.` + ((streaks[L] || 0) >= 3 ? '<br><span class="help">Help is on: everything is a little slower until you get through.</span>' : '');
  $('eMain').textContent = r.win ? 'NEXT LEVEL' : 'TRY AGAIN'; $('eMain').dataset.act = r.win ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !r.win);
  show('ovEnd');
  if (r.win) [1, 2, 3].forEach(i => { if (i <= r.stars) setTimeout(() => sfx.star(i), 250 + i * 180); });
}
$('playBtn').onclick = () => { audio(); sfx.click(); startGame(); };
window.gameFeedStart = () => { savedLevel(); audio(); startGame(); };      // the feed's instant start: his level, playing at once
$('rulesBtn').onclick = () => { sfx.click(); show('ovRules'); };
$('levelsBtn').onclick = () => { sfx.click(); showLevels('home'); };
$('eLevels').onclick = () => showLevels('home');
$('eMain').onclick = () => { if ($('eMain').dataset.act === 'next') level = Math.min(unlocked, G.N + 1); startGame(); };
$('eAlt').onclick = () => { level = G.N; startGame(); };
let lvFrom = 'home', lvUnder = null;
function showLevels(from) {
  lvFrom = from || 'home'; lvUnder = ['ovHome', 'ovEnd'].find(key => !$(key).classList.contains('hidden')) || null;
  const top = Math.ceil((unlocked + 5) / 5) * 5; let h = '';
  for (let L = 1; L <= top; L++) { const lock = L > unlocked, st = stars[L] || 0; h += `<button class="lvb${L % 10 === 0 ? ' boss' : ''}${L === level ? ' cur' : ''}${lock ? ' lock' : ''}" data-l="${L}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : L}<small>${lock ? '' : '★'.repeat(st)}</small></button>`; }
  $('lvGrid').innerHTML = h; $('lvSub').textContent = unlocked > 1 ? 'Every tenth level is a boss.' : 'Pass a level to open the next.';
  show('ovLevels');
}
$('lvGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b || b.disabled) return;
  level = +b.dataset.l; store.set('level', level);
  if (lvFrom === 'home') showHome(); else { sfx.click(); startGame(); }      // picked from the pause menu or the feed: it starts at once
});
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => {
  const lv = !$('ovLevels').classList.contains('hidden');
  if (lv && lvFrom === 'pause' && G && !G.over) openPause(); else if (lv && lvFrom === 'feed' && lvUnder) show(lvUnder); else showHome();
});
function sndIcon() { $('sndBtn').textContent = MUTE ? '🔇' : '🔊'; }
MUTE = !!store.get('mute', false); sndIcon();
$('sndBtn').onclick = () => { audio(); setMute(!MUTE); store.set('mute', MUTE); sndIcon(); if (!MUTE) sfx.click(); };
// pause: the same three controls in every game
function openPause() { paused = true; $('pLvl').textContent = `Level ${G.N}`; $('pDiag').textContent = `Picture ${stepN + 1} of ${STEPS.length} · ${Math.round(1000 / ftAvg)} a second · ${W3 && W3.ok ? '3D' : 'no 3D'}`; show('ovPause'); }
$('pauseBtn').onclick = () => { if (G && !G.over) openPause(); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); };
$('pRestart').onclick = () => { sfx.click(); level = G.N; startGame(); };
$('pLevels').onclick = () => showLevels('pause');
$('pQuit').onclick = () => showHome();
window.gameFeedLevels = () => { if (G && !G.over && $('ovHome').classList.contains('hidden')) { openPause(); showLevels('pause'); } else showLevels('feed'); };      // the feed's Levels button
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !paused) openPause(); });
// input (made for each tool): the tray picks a tool; with the hand, slow strokes along her calm her; tweezers: on the thorn,
// then pull away slowly; rasp: strokes along the hoof; spray and needle: hold on the spot; bandage: circle round the leg;
// brush: strokes, head to tail; drops: a tap on the ear when her head is still.
function spotNear(x, y) { if (!G || !G.pt) return null; let best = null, bd = 1e9; const lim = (G.focus ? 70 : 52) * k, sick = s => typeof probAt === 'function' && probAt(G, s) && !probAt(G, s).done;
  // 23 Nov 2026, his note: "All tools... must register reliably when used correctly": a spot with something wrong is found from much further (100 px)
  for (const s of SPOTS) { const p = spotScreen(s); if (!p.front) continue; const d = Math.hypot(p.x - x, p.y - y) * (sick(s) ? 0.5 : 1); if (d < lim && d < bd) { bd = d; best = s; } } return best; }
function bodyLen() { const [h, t] = headTail(); return Math.max(80 * k, Math.hypot(h.x - t.x, h.y - t.y)); }
cv.addEventListener('pointerdown', e => { audio(); if (!G || G.over || paused || ui.drag) return; const x = e.clientX, y = e.clientY, now = performance.now() / 1000;
  const tl = toolAt(x, y); if (tl) { pickTool(G, tl); return; }
  ui.drag = { id: e.pointerId, x, y, x0: x, y0: y, t0: now, lx: x, ly: y, lt: now, len: 0, seg: 0, segDir: null, acc: 0, accT: 0, ang: null, turn: 0, turnT: now };
  if (G.tool !== 'hand') { const sp = spotNear(x, y); const pr = touch(G, sp); ui.drag.spot = sp; ui.drag.on = !!pr; if (pr && G.tool === 'drops') { drop(G); } if (pr) { const c = spotScreen(sp); ui.drag.cx = c.x; ui.drag.cy = c.y; ui.drag.d0 = Math.hypot(x - c.x, y - c.y); } }
  try { cv.setPointerCapture(e.pointerId); } catch (err) {} });
function segEnd(d) { if (!G || !d.on || d.seg < 14 * k) { d.seg = 0; return; } const v = d.segV;
  if (G.tool === 'rasp') rasp(G, clamp(d.seg / (170 * k) * 0.32, 0.02, 0.32));
  if (G.tool === 'brush' && d.seg > 22 * k) { const [h, t] = headTail(), gx = t.x - h.x, gy = t.y - h.y, gl = Math.hypot(gx, gy) || 1, vl = Math.hypot(v.x, v.y) || 1; brush(G, (v.x * gx + v.y * gy) / (gl * vl) > -0.35 ? 1 : -1); }      // only a stroke clearly against the hair counts as against
  d.seg = 0; }
cv.addEventListener('pointermove', e => { const d = ui.drag; if (!d || e.pointerId !== d.id || !G) return; const x = e.clientX, y = e.clientY, now = performance.now() / 1000, dx = x - d.lx, dy = y - d.ly, step = Math.hypot(dx, dy);
  d.x = x; d.y = y; d.len += step;
  if (G.hold && G.hold.kind === 'pull') { const r = Math.hypot(x - d.cx, y - d.cy), out = r - (d.r || d.d0); d.r = Math.max(d.r || d.d0, r); if (out > 0) { d.acc += out; } d.accT += now - d.lt; if (d.accT >= 0.06) { pull(G, d.acc / (110 * k), d.accT); d.acc = 0; d.accT = 0; } }
  if ((G.tool === 'rasp' || G.tool === 'brush') && step > 0.5) { const dir = { x: dx / step, y: dy / step }; if (d.segDir && dir.x * d.segDir.x + dir.y * d.segDir.y < -0.3) { segEnd(d); } d.segDir = d.segDir && d.seg ? { x: d.segDir.x * 0.7 + dir.x * 0.3, y: d.segDir.y * 0.7 + dir.y * 0.3 } : dir; d.segV = d.segDir; d.seg += step; }
  if (G.tool === 'bandage' && d.on && G.hold) { const a = Math.atan2(y - d.cy, x - d.cx); if (d.ang != null) { let da = a - d.ang; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU; d.turn += da; if (Math.abs(d.turn) >= TAU) { wrap(G, now - d.turnT); d.turn = 0; d.turnT = now; } } d.ang = a; }
  d.lx = x; d.ly = y; d.lt = now; });
function endTouch(e) { const d = ui.drag; if (!d || e.pointerId !== d.id) return; ui.drag = null; if (!G || G.over || paused) return; const now = performance.now() / 1000;
  if (G.tool === 'hand') { const secs = Math.max(0.05, now - d.t0); if (d.len > 40 * k) stroke(G, d.len / bodyLen() / secs); return; }
  if (G.hold && G.hold.kind === 'pull' && d.acc > 0) pull(G, d.acc / (110 * k), Math.max(0.02, d.accT));
  if (G.tool === 'rasp' || G.tool === 'brush') segEnd(d);
  lift(G); }
cv.addEventListener('pointerup', endTouch); cv.addEventListener('pointercancel', endTouch);
// ---------- keeping it smooth (rule 12): ease the picture off a notch at a time if the phone is not keeping up ----------
const STEPS = W3 ? W3.Q : [{ pr: 2 }];      // the 3D picture's notches (tools/world3d.js): sharpness, shadows, reflections
let stepN = clamp(store.get('smooth', 0) | 0, 0, STEPS.length - 1), ftAvg = 16.7, warm = 30, winN = 0, winSum = 0;
function applyStep() { DPR_CAP = Math.min(2, STEPS[stepN].pr + 0.5); resize(); if (W3 && W3.ok) W3.setQuality(stepN); }
function measure(ms) {
  if (ms > 250) { warm = 20; return; } ftAvg += (Math.min(ms, 120) - ftAvg) * 0.06; if (warm > 0) { warm--; return; }
  winSum += Math.min(ms, 100); if (++winN < 60) return; const avg = winSum / winN; winN = 0; winSum = 0;
  if (avg > 21 && stepN < STEPS.length - 1) { stepN++; store.set('smooth', stepN); applyStep(); warm = 20; }
}
// ---------- the frame loop ----------
let last = performance.now(), endT = 0;
function frame(now) {
  const ms = now - last, rdt = Math.min(0.05, ms / 1000); last = now;
  if (HEADLESS) { requestAnimationFrame(frame); return; }
  if (G && !paused && !G.over) measure(ms);
  if (G && !paused) {
    let dt = rdt; if (FX.stop > 0) { FX.stop -= rdt; dt = 0; }      // a heartbeat of stillness on a hit (P7)
    if (!G.over) step(G, dt);
    for (const e of G.ev) onEvent(G, e); if (tutRun && G.ev.some(e => e.k === 'lessondone')) tutNext();
    if (G.ev.length && G.over && !G.saved) { G.saved = true; saveResult(G); }
    G.ev.length = 0;
    if (G.over) { endT += rdt; if (endT > (G.res.win ? 1.0 : 0.7)) { endT = -1e9; showEnd(); } }      // a short moment, then the card (P23)
  }
  fxStep(rdt); draw(now / 1000, rdt); soundStep(G, rdt);
  requestAnimationFrame(frame);
}
// ---------- the test hook (robots, tests, card clips) ----------
window.__sim = {
/*SOUNDCHECK*/
  start(N, o) { HEADLESS = true; MUTE = true; level = N; G = newGame(N, o || {}); },
  step(dt) { step(G, dt); G.ev.length = 0; },
  adv(sec) { for (let i = 0; i < sec * 60; i++) { if (!G.over) step(G, 1 / 60); for (const e of G.ev) onEvent(G, e); G.ev.length = 0; fxStep(1 / 60); } },
  frame() { draw(performance.now() / 1000, 1 / 60); },
  pickTool(t) { pickTool(G, t); }, touch(sp) { return !!touch(G, sp); }, stroke(v) { stroke(G, v); }, pull(d, dt) { pull(G, d, dt); }, rasp(a) { rasp(G, a); }, wrap(s) { wrap(G, s); }, brush(d) { brush(G, d); }, drop() { drop(G); }, lift() { lift(G); }, spotScreen, headTail, toolAt, trayRect, ui, get V3() { return V3; }, W3, newPatient(o) { newPatient(G, o); },
  go(N) { HEADLESS = false; level = N; startGame(); },
  deal, dealIf, playing, makeCfg, LESSONS, BLIND, honest, winNow() { winNow(G); }, live() { HEADLESS = false; last = performance.now(); },
  finest() { stepN = 0; applyStep(); }, smooth() { return { step: stepN, ms: +ftAvg.toFixed(1), dpr: DPR }; },
  skipTutorial() { skipTutorial(); }, startTutorial() { startTutorial(); }, get tutRun() { return tutRun; },
  get G() { return G; }
};
let tutForce = null;
// ---------- tutorials are optional (his rule, 18 Nov 2026): a SKIP TUTORIAL button on every lesson, and a Tutorial button
// always there (home and pause) that plays the lessons again, whatever level he is on ----------
let tutRun = null;
function startTutorial() { if (typeof LESSONS === 'undefined') return; const ns = [1, 2, 3].filter(n => LESSONS[n]); if (!ns.length) return; tutRun = { ns, i: 0, back: Math.min(Math.max(1, store.get('level', 1) | 0), unlocked) }; runTut(); }
function runTut() { const N = tutRun.ns[tutRun.i]; tutForce = N - 1; const keep = level; level = N; startGame(); level = keep; tutForce = null; }
function tutNext() { if (!tutRun) return; tutRun.i++; if (tutRun.i < tutRun.ns.length) { setTimeout(() => { if (tutRun) runTut(); }, 1200); return; } const back = tutRun.back; tutRun = null; setTimeout(() => { level = back; startGame(); }, 1500); }
function skipTutorial() { if (!G || !G.lesson) return; audio(); sfx.click(); store.set('taught', 3); const back = tutRun ? tutRun.back : G.N; tutRun = null; level = back; startGame(); }
$('skipTut').onclick = e => { e.stopPropagation(); skipTutorial(); };
['pointerdown', 'touchstart'].forEach(k => $('skipTut').addEventListener(k, e => e.stopPropagation(), { passive: true }));
$('tutBtn').onclick = () => { audio(); sfx.click(); startTutorial(); };
$('pTut').onclick = () => { sfx.click(); paused = false; startTutorial(); };
setInterval(() => { const on = !!(G && G.lesson && !G.over && !paused && !HEADLESS); $('skipTut').classList.toggle('hidden', !on); }, 150);
window.gameFeedTutorial = () => { audio(); startTutorial(); };
// ---------- settings: Music, Sound effects, Vibration (his rule, 20 Nov 2026; the sound side is in the juice kit) ----------
Object.assign(SET, store.get('settings', {}) || {});
let setFrom = 'ovHome';
function renderSet() { const t = (id, on, txt) => { $(id).textContent = txt || (on ? 'ON' : 'OFF'); $(id).classList.toggle('off', !on); }; t('tMus', SET.mus); t('tSfx', SET.sfx); t('tVib', SET.vib); t('tVk', SET.vib, SET.vk < 0.8 ? 'LOW' : SET.vk > 1.2 ? 'STRONG' : 'NORMAL'); }
function openSet(from) { setFrom = from; renderSet(); show('ovSet'); }
const saveSet = () => { store.set('settings', SET); applySet(); renderSet(); };
$('setBtn').onclick = () => { audio(); sfx.click(); openSet('ovHome'); };
$('pSet').onclick = () => { sfx.click(); openSet('ovPause'); };
$('tMus').onclick = () => { audio(); SET.mus = !SET.mus; saveSet(); };
$('tSfx').onclick = () => { audio(); SET.sfx = !SET.sfx; saveSet(); if (SET.sfx) sfx.click(); };
$('tVib').onclick = () => { SET.vib = !SET.vib; saveSet(); vibe(HAP.light); };
$('tVk').onclick = () => { SET.vk = SET.vk < 0.8 ? 1 : SET.vk > 1.2 ? 0.5 : 1.6; saveSet(); vibe(HAP.thud); };
$('setBack').onclick = () => { sfx.click(); show(setFrom); };
window.gameFeedSettings = () => openSet(G && !G.over ? 'ovPause' : 'ovHome');
applyStep(); showHome(); requestAnimationFrame(frame);
})();
</script>
</body>
</html>
