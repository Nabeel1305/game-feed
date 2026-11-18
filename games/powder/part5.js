
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
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause', 'ovAqua'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
const helpOn = () => (streaks[level] || 0) >= 3;
const playing = () => !!G && !G.over && !paused && $('ovHome').classList.contains('hidden') && $('ovEnd').classList.contains('hidden');
function showHome() {
  savedLevel(); G = null; paused = false; $('pauseBtn').classList.add('hidden');
  $('hLvl').textContent = level;
  const bt = best[level], bank = store.get('bank', 0), tot = store.get('earned', 0);
  const bTime = (store.get('bestTime', {}) || {})[level], cf = makeCfg(level);
  $('hStat').innerHTML = [`🪙 <b>${bank}</b> coins · rank <b>${rankOf(tot)}</b>`, `${PLACES[placeOf(level)].name} · ${cf.len} m · beat <b>${Math.round(cf.len / cf.pace + 1)} s</b>`, bTime ? `Your ghost here: <b>${bTime.toFixed(1)} s</b>` : '', `Boards: <b>${boardsOpen()}</b> of ${BOARDS.length} 🏂`, bt ? `Your best here: <b>${'★'.repeat(bt)}</b>` : '', helpOn() ? '<span class="help">Help is on for this level: a little more time.</span>' : ''].filter(Boolean).join('<br>');
  show('ovHome');
}
function startGame() {
  audio(); if (!HEADLESS) store.set('level', level);
  G = newGame(level, { help: helpOn(), teach: true, taught: store.get('taught', 0) | 0, ghost: HEADLESS ? null : ((store.get('ghosts', {}) || {})[level] || null) }); paused = false; endT = 0;
  TXT.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0; hint = null; ui.snap = true; ui.touch = null;
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function saveResult(G) {      // a win saves the next level at once (leaving before "Next" still brings him back to it)
  const r = G.res, L = G.N; if (HEADLESS) return; const boardsBefore = boardsOpen();
  if (r.win) { streaks[L] = 0; stars[L] = Math.max(stars[L] || 0, r.stars); unlocked = Math.max(unlocked, L + 1); level = Math.min(unlocked, L + 1); store.set('level', level); store.set('unlocked', unlocked); store.set('stars', stars);
    if (!best[L] || r.stars > best[L]) { r.nb = !!best[L]; best[L] = r.stars; store.set('best', best); } }
  else streaks[L] = (streaks[L] || 0) + 1;
  // coins: every round keeps what it picked up (and a bonus when it is won); the total earned sets your rank
  const before = rankOf(store.get('earned', 0)); store.set('bank', store.get('bank', 0) + r.coins); store.set('earned', store.get('earned', 0) + r.coins); r.rankUp = rankOf(store.get('earned', 0)) !== before ? rankOf(store.get('earned', 0)) : null;
  store.set('streaks', streaks);
  { const bt = store.get('bestTime', {}) || {}; r.prevBest = bt[L] || 0; if (!r.prevBest || r.time < r.prevBest) { r.newGhost = !!r.prevBest; bt[L] = r.time; store.set('bestTime', bt); const gh = store.get('ghosts', {}) || {}; gh[L] = r.track; store.set('ghosts', gh); }
    if (r.bestTrick > (store.get('bestTrick', 0) | 0)) store.set('bestTrick', r.bestTrick); r.newBoards = BOARDS.filter(boardOpen).slice(boardsBefore).map(b => b.name); }
}
function showEnd() {
  const r = G.res, L = G.N; $('pauseBtn').classList.add('hidden');
  $('eTitle').textContent = r.win ? 'BEAT THE CLOCK!' : 'TOO SLOW'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : '';
  const d = r.time - r.par, vs = r.prevBest ? r.time - r.prevBest : null;
  $('eSub').innerHTML = `<b>${r.time.toFixed(1)} s</b> · clock ${r.par} s` + (r.win ? '' : ` · <b>${d.toFixed(1)} s too slow</b>`) + (vs != null ? (vs < 0 ? ` · <b class="nb">${(-vs).toFixed(1)} s faster than your ghost!</b>` : ` · ghost ${r.prevBest.toFixed(1)} s`) : '')
    + `<br>${r.gates} of ${r.nGates} gates · ${r.crashes} falls` + (r.tricks ? ` · ${r.tricks} tricks (best ${r.bestTrick}°)` : '') + ` · <b>+${r.coins} 🪙</b>`
    + (r.newBoards && r.newBoards.length ? `<br><b class="nb">NEW BOARD: ${r.newBoards.join(', ')}!</b>` : '') + (r.win ? (r.nb ? ' <b class="nb">NEW BEST</b>' : '') + (r.stars < 3 ? `<br>${(r.par * 0.88).toFixed(1)} s or less for three stars.` : '') : (r.missed ? '<br>Each missed gate cost 3 s.' : r.crashes ? '<br>Each fall cost time: ride round trees, jump rocks.' : '<br>Let go on the straights: tucking is fastest.'))
    + (r.rankUp ? `<br><b class="nb">NEW RANK: ${r.rankUp.toUpperCase()}</b>` : '') + ((streaks[L] || 0) >= 3 ? '<br><span class="help">Help is on: a little more time on the clock.</span>' : '');
  renderShop();
  $('eMain').textContent = r.win ? 'NEXT LEVEL' : 'TRY AGAIN'; $('eMain').dataset.act = r.win ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !r.win);
  show('ovEnd');
  if (r.win) [1, 2, 3].forEach(i => { if (i <= r.stars) setTimeout(() => sfx.star(i), 250 + i * 180); });
}
$('playBtn').onclick = () => { audio(); sfx.click(); startGame(); };
window.gameFeedStart = () => { savedLevel(); audio(); startGame(); };      // the feed's instant start: his level, playing at once
$('aquaBtn').onclick = () => { sfx.click(); showAqua(); };
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
// input (one thumb): hold and slide left or right to carve (from wherever it went down); a quick tap jumps; in the air the
// same thumb spins you
function tapAt() {}
cv.addEventListener('pointerdown', e => { audio(); if (!G || G.over || paused || ui.touch) return; ui.touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} leanToGame(); });
cv.addEventListener('pointermove', e => { const t = ui.touch; if (!t || t.id !== e.pointerId) return; t.x = e.clientX; t.y = e.clientY; t.moved = Math.max(t.moved, Math.abs(t.x - t.x0)); leanToGame(); });
function leanToGame() { const t = ui.touch; if (!G) return; if (!t) { setLean(G, 0); return; } const dx = t.x - t.x0, R = 60 * k; setLean(G, Math.abs(dx) < 5 * k ? 0 : clamp(dx / R, -1, 1)); if (!G.held && G.me.air) G.held = true; }
function endTouch(e) { const t = ui.touch; if (!t || t.id !== e.pointerId) return; ui.touch = null; leanToGame(); if (G && performance.now() - t.t0 < 230 && t.moved < 14 * k) { if (jump(G)) vibe(HAP.light); } }
cv.addEventListener('pointerup', endTouch); cv.addEventListener('pointercancel', endTouch);
// the boards: opened by stars and tricks; pick the one you ride
const BOARDS = [{ name: 'Woodie', stars: 0, c1: 0xc89a5a, c2: 0x7a5228 }, { name: 'Neon', stars: 6, c1: 0x3affb0, c2: 0x1a2a3a }, { name: 'Flame', stars: 15, c1: 0xff5a2a, c2: 0xffd03a }, { name: 'Glacier', stars: 25, c1: 0xbfeaff, c2: 0x3a7ad8 },
  { name: 'Spinner', trick: 540, c1: 0xff5a8a, c2: 0xffffff }, { name: 'Night', stars: 40, c1: 0x22222a, c2: 0x9a6aff }, { name: 'Gold', stars: 60, c1: 0xffd040, c2: 0xa87a10 }, { name: 'Pro 1080', trick: 1080, c1: 0x101010, c2: 0xff3a3a }, { name: 'Aurora', stars: 90, c1: 0x5affd0, c2: 0xb05aff }];
const starsAll = () => Object.values(store.get('stars', {}) || {}).reduce((a, b) => a + b, 0);
const boardOpen = b => b.trick ? (store.get('bestTrick', 0) | 0) >= b.trick : starsAll() >= b.stars;
function boardsOpen() { return BOARDS.filter(boardOpen).length; }
function myBoard() { const i = store.get('board', 0) | 0; return BOARDS[i] && boardOpen(BOARDS[i]) ? BOARDS[i] : BOARDS[0]; }
function showAqua() { const sel = store.get('board', 0) | 0, bt = store.get('bestTrick', 0) | 0;
  $('aqSub').innerHTML = `<b>${boardsOpen()}</b> of ${BOARDS.length} open · ★ ${starsAll()}` + (bt ? ` · best trick <b>${bt}°</b>` : '') + '<br>Tap one to ride it.';
  $('aqGrid').innerHTML = BOARDS.map((b, i) => `<div class="aq ${boardOpen(b) ? '' : 'off'} ${i === sel && boardOpen(b) ? 'sel' : ''}" data-i="${i}"><canvas width="128" height="60"></canvas><b>${b.name}</b>${boardOpen(b) ? (i === sel ? 'riding' : 'tap to ride') : b.trick ? 'land a ' + b.trick + '°' : '★ ' + b.stars}</div>`).join('');
  $('aqGrid').querySelectorAll('.aq').forEach(el => { const b = BOARDS[+el.dataset.i]; boardIcon(el.querySelector('canvas'), b, !boardOpen(b)); el.onclick = () => { if (!boardOpen(b)) { sfx.no(); return; } store.set('board', +el.dataset.i); sfx.click(); ui.boardKey = null; showAqua(); }; });
  show('ovAqua'); }
function boardIcon(c, b, off) { const g = c.getContext('2d'), w = c.width, h = c.height, hx = n => '#' + n.toString(16).padStart(6, '0'); g.clearRect(0, 0, w, h); g.save(); g.translate(w / 2, h / 2);
  g.fillStyle = off ? '#2a3442' : hx(b.c1); g.beginPath(); g.ellipse(0, 0, w * 0.45, h * 0.3, 0, 0, Math.PI * 2); g.fill(); if (!off) { g.fillStyle = hx(b.c2); g.fillRect(-w * 0.28, -h * 0.06, w * 0.56, h * 0.12); g.beginPath(); g.arc(-w * 0.2, 0, h * 0.12, 0, 7); g.arc(w * 0.2, 0, h * 0.12, 0, 7); g.fill(); } g.restore(); }
// ---------- the pro shop: upgrades bought with coins; they stay with you (nothing expires) ----------
const rankOf = tot => { let r = RANKS[0][1]; for (const [n, name] of RANKS) if (tot >= n) r = name; return r; };
function renderShop() { const el = $('eShop'); if (!el) return; const bank = store.get('bank', 0), ups = store.get('ups', {}) || {}; let h = `<h3><span>THE TRAINING REEF</span><span>🪙 ${bank}</span></h3><div class="grid">`;
  for (const u of UPGRADES) { const lv = ups[u.id] | 0, max = lv >= u.max, cost = max ? 0 : u.cost(lv), can = !max && bank >= cost;
    h += `<button class="up ${max ? 'max' : can ? 'can' : 'no'}" data-u="${u.id}"><span class="cost">${max ? 'MAX' : cost + ' 🪙'}</span><b>${u.name}</b><span class="lv">${'●'.repeat(lv)}${'○'.repeat(u.max - lv)}</span><small>${u.desc}</small></button>`; }
  el.innerHTML = h + '</div>'; }
$('eShop').addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (!b) return; audio(); const u = UPGRADES.find(q => q.id === b.dataset.u), ups = store.get('ups', {}) || {}, lv = ups[u.id] | 0, bank = store.get('bank', 0); if (lv >= u.max) return; const cost = u.cost(lv); if (bank < cost) { sfx.no(); return; }
  store.set('bank', bank - cost); ups[u.id] = lv + 1; store.set('ups', ups); sfx.combo(lv + 2); vibe(HAP.light); renderShop(); const nb = $('eShop').querySelector(`[data-u="${u.id}"]`); if (nb) nb.classList.add('bought'); });
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
  const ms = now - last, rdt = clamp(ms / 1000, 0, 0.05); last = now;
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
  stepEv(dt) { step(G, dt); const e = G.ev.slice(); G.ev.length = 0; return e; },
  adv(sec) { for (let i = 0; i < sec * 60; i++) { if (!G.over) step(G, 1 / 60); for (const e of G.ev) onEvent(G, e); G.ev.length = 0; fxStep(1 / 60); } },
  frame() { draw(performance.now() / 1000, 1 / 60); },
  lean(l) { setLean(G, l); }, jump() { return jump(G); }, scr, renderShop, ui, get V3() { return V3; }, W3,
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
