
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
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
const helpOn = () => (streaks[level] || 0) >= 3;
const playing = () => !!G && !G.over && !paused && $('ovHome').classList.contains('hidden') && $('ovEnd').classList.contains('hidden');
function showHome() {
  savedLevel(); G = null; paused = false; $('pauseBtn').classList.add('hidden');
  $('hLvl').textContent = level;
  const big = Object.entries(bigs).sort((a, b) => b[1] - a[1])[0], spn = id => ([...SPECIES, GOLDEN, ...GIANTS].find(q => q.id === id) || { name: id }).name;
  $('hStat').innerHTML = [big ? `Your biggest fish: <b>${spn(big[0])}, ${big[1].toFixed(2)} kg</b>` : '', helpOn() ? '<span class="help">Help is on for this level: everything is a little slower.</span>' : ''].filter(Boolean).join('<br>');
  show('ovHome');
}
function startGame() {
  audio(); if (!HEADLESS) store.set('level', level);
  G = newGame(level, { help: helpOn(), teach: true, taught: store.get('taught', 0) | 0 }); paused = false; endT = 0;
  TXT.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0; ui.aim = null; ui.drag = null; hint = null;
  if (V3 && !V3.none) { if (V3.jump && V3.jump.m) W3.scene.remove(V3.jump.m); if (V3.held && V3.held.m) W3.scene.remove(V3.held.m); V3.jump = V3.held = null; }
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function saveResult(G) {      // a win saves the next level at once (leaving before "Next" still brings him back to it)
  const r = G.res, L = G.N; if (HEADLESS) return;
  if (r.win) { streaks[L] = 0; stars[L] = Math.max(stars[L] || 0, r.stars); unlocked = Math.max(unlocked, L + 1); level = Math.min(unlocked, L + 1); store.set('level', level); store.set('unlocked', unlocked); store.set('stars', stars);
  }
  else streaks[L] = (streaks[L] || 0) + 1;
  store.set('streaks', streaks);
}
function showEnd() {
  const r = G.res, L = G.N; $('pauseBtn').classList.add('hidden');
  $('eTitle').textContent = r.win ? (L % 10 === 0 ? 'THE GIANT IS LANDED' : 'A GOOD DAY') : r.why === 'dark' ? 'THE LIGHT IS GONE' : 'OUT OF LINE'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : '';
  $('eSub').innerHTML = r.win ? `Biggest today: <b>${r.big.name}, ${r.big.kg.toFixed(2)} kg</b>` + (r.stars < 3 ? '<br>Lose no lines, with light to spare, for three stars.' : '')
    : `<b>${r.caught}</b> of ${r.goal} landed.${r.caught === r.goal - 1 ? ' One more fish!' : ''}` + ((streaks[L] || 0) >= 3 ? '<br><span class="help">Help is on: everything is a little slower until you get through.</span>' : '');
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
// input (made for fishing): pull your thumb down and let go to cast (the float flies the other way, the ring on the water shows
// where); flick up to strike; in a fight, hold to reel and drag left or right to swing the rod against the fish.
const touch = { id: null, x0: 0, y0: 0, t0: 0, x: 0, y: 0, side0: 0 };
function castAim(dx, dy) {      // the pull (pixels) -> where on the water (metres); the further back, the further out
  const pull = clamp(dy / (H * 0.3), 0, 1), z = 6 + pull * 28, cy = V3 && !V3.none ? Math.atan2(V3.lookS.x, -V3.lookS.z) : 0;
  const ang = cy + clamp(-dx / (W * 0.45), -1, 1) * 0.42; return { x: Math.sin(ang) * z, z: Math.cos(ang) * z, pull };
}
cv.addEventListener('pointerdown', e => {
  audio(); if (!G || G.over || paused || touch.id != null) return;
  touch.id = e.pointerId; touch.x0 = touch.x = e.clientX; touch.y0 = touch.y = e.clientY; touch.t0 = performance.now(); touch.side0 = G.in.side;
  if (G.ph === 'fight') { G.in.hold = true; ui.drag = { mode: 'reel' }; } else ui.drag = { mode: 'maybe', pull: 0 };
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
});
cv.addEventListener('pointermove', e => {
  if (e.pointerId !== touch.id || !G) return; touch.x = e.clientX; touch.y = e.clientY; const dx = touch.x - touch.x0, dy = touch.y - touch.y0;
  if (G.ph === 'fight') { G.in.hold = true; G.in.side = clamp(touch.side0 + dx / (W * 0.2), -1, 1); return; }
  if (ui.drag && ui.drag.mode !== 'reel' && dy > 18 * k && ['idle', 'wait', 'bite', 'reelin'].includes(G.ph)) { ui.drag.mode = 'cast'; const A = castAim(dx, dy); ui.drag.pull = A.pull; ui.aim = A.pull > 0.04 ? A : null; }
  else if (ui.drag && ui.drag.mode === 'cast' && dy <= 18 * k) { ui.aim = null; ui.drag.pull = 0; }
});
function endTouch(e) {
  if (e.pointerId !== touch.id) return; touch.id = null; if (!G) return; const dx = touch.x - touch.x0, dy = touch.y - touch.y0, ms = performance.now() - touch.t0;
  if (G.ph === 'fight') { G.in.hold = false; ui.drag = null; return; }
  if (ui.drag && ui.drag.mode === 'cast' && ui.aim) { const A = ui.aim; if (G.ph === 'reelin') G.ph = 'idle'; cast(G, A.x, A.z); }
  else if (dy < -30 * k && ms < 600 && -dy > Math.abs(dx) * 0.8) strike(G);
  ui.aim = null; ui.drag = null;
}
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
    for (const e of G.ev) onEvent(G, e);
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
  cast(x, z) { return cast(G, x, z); }, strike() { strike(G); }, hold(on, side) { G.in.hold = !!on; if (side != null) G.in.side = side; }, castAim, ui, get V3() { return V3; }, W3,
  go(N) { HEADLESS = false; level = N; startGame(); },
  playing, makeCfg, LESSONS, BLIND, honest, winNow() { winNow(G); }, live() { HEADLESS = false; last = performance.now(); },
  finest() { stepN = 0; applyStep(); }, smooth() { return { step: stepN, ms: +ftAvg.toFixed(1), dpr: DPR }; },
  get G() { return G; }
};
applyStep(); showHome(); requestAnimationFrame(frame);
})();
</script>
</body>
</html>
