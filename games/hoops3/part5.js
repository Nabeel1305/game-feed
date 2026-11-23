
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
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause', 'ovAqua', 'ovSet'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
const helpOn = () => (streaks[level] || 0) >= 3;
const playing = () => !!G && !G.over && !paused && $('ovHome').classList.contains('hidden') && $('ovEnd').classList.contains('hidden');
function showHome() {
  savedLevel(); G = null; paused = false; $('pauseBtn').classList.add('hidden');
  $('hLvl').textContent = level;
  const bank = store.get('bank', 0), tot = store.get('earned', 0), cf = makeCfg(level), bt = best[level];
  $('hStat').innerHTML = [`🪙 <b>${bank}</b> coins · rank <b>${rankOf(tot)}</b>`, `${PLACES[placeOf(level)].name} · against the <b>${TEAMS[(level - 1) % TEAMS.length]}</b>`, `${STYLES[cf.style]}`, (() => { const t = store.get('tour', null); return t && t.round > 0 ? `🏆 Tournament: you are in the <b>${['', 'semi-final', 'final'][t.round]}</b>` : ''; })(), bt ? `Your best here: <b>${bt}</b> 🪙` : '', helpOn() ? '<span class="help">Help is on: they are a little slower.</span>' : ''].filter(Boolean).join('<br>');
  show('ovHome');
}
let practiceOn = false;
function startGame(mini) {
  audio(); if (tutForce == null) tutRun = null; if (!HEADLESS && tutForce == null) store.set('level', level);
  const tour = practiceOn ? (store.get('tour', null) || { round: 0, base: Math.max(1, level - 1) }) : null; if (tour && !HEADLESS) store.set('tour', tour);
  G = newGame(tour ? tour.base + tour.round * 3 : level, { help: helpOn(), teach: !practiceOn, mini: !!mini, taught: tutForce != null ? tutForce : store.get('taught', 0) | 0, tour, foe: tour ? ['Harbour Hawks', 'Metro Kings', 'Cup Holders'][tour.round] : undefined }); paused = false; endT = 0;
  TXT.length = 0; PARTS.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0; hint = null; ui.snap = true; ui.banner = null; ui.stick = null; ui.btn = {};
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function saveResult(G) {      // a win saves the next level at once (leaving before "Next" still brings him back to it)
  const r = G.res, L = G.N; if (HEADLESS) return; const starsBefore = starsAll();
  if (r.tour) { const t = r.tour; if (r.win) { t.round++; if (t.round >= 3) { r.champ = true; r.coins += 40; store.set('tour', null); store.set('cups', store.get('cups', 0) + 1); } else store.set('tour', t); } else { r.out = t.round; store.set('tour', null); } }
  else if (r.win) { streaks[L] = 0; stars[L] = Math.max(stars[L] || 0, r.stars); unlocked = Math.max(unlocked, L + 1); level = Math.min(unlocked, L + 1); store.set('level', level); store.set('unlocked', unlocked); store.set('stars', stars);
    if (r.coins > (best[L] || 0)) { r.nb = !!best[L]; best[L] = r.coins; store.set('best', best); } }
  else streaks[L] = (streaks[L] || 0) + 1;
  const before = rankOf(store.get('earned', 0)); store.set('bank', store.get('bank', 0) + r.coins); store.set('earned', store.get('earned', 0) + r.coins); r.rankUp = rankOf(store.get('earned', 0)) !== before ? rankOf(store.get('earned', 0)) : null;
  store.set('streaks', streaks); if ((r.best || 0) > store.get('streakBest', 0)) { r.streakNB = true; store.set('streakBest', r.best); }
  { const sb = starsAll(); r.newSkins = SKINS.filter(q => q.stars > starsBefore && q.stars <= sb).map(q => q.name).join(', '); }
}
function showEnd() {
  const r = G.res, L = G.N, S = r.stats; $('pauseBtn').classList.add('hidden');
  $('eTitle').textContent = r.champ ? 'CHAMPIONS!' : r.tour && r.win ? 'THROUGH!' : r.tour ? 'KNOCKED OUT' : r.win ? (r.stars === 3 ? 'WHAT A WIN!' : 'YOU WIN!') : 'BEATEN'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win && !r.tour ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : r.champ ? '🏆' : '';
  const bits = [['pts', 'points'], ['ast', 'assists'], ['passes', 'passes'], ['reb', 'rebounds'], ['stl', 'steals'], ['blk', 'blocks'], ['threes', 'threes'], ['dunks', 'dunks']].filter(([k2]) => S[k2]).map(([k2, n]) => `<b>${S[k2]}</b> ${S[k2] === 1 ? n.replace(/s$/, '') : n}`);
  $('eSub').innerHTML = `🏀 You <b>${r.score[0]}</b> : <b>${r.score[1]}</b> ${G.foe}` + (bits.length ? `<br>${bits.join(' · ')}` : '') + (S.to ? `<br>Turnovers: ${S.to}` : '') + `<br><b>+${r.coins} 🪙</b>` + (r.nb ? ' <b class="nb">NEW BEST</b>' : '')
    + (r.tour && r.win && !r.champ ? `<br>🏆 Next: the <b>${['', 'semi-final', 'final'][r.tour.round]}</b>` : '') + (r.champ ? '<br><b class="nb">TOURNAMENT WON! +40 🪙</b>' : '')
    + (r.newSkins ? `<br><b class="nb">NEW KIT: ${r.newSkins.toUpperCase()}</b>` : '') + (r.win && r.stars < 3 && !r.tour ? '<br>Three stars: win by eight.' : '') + (!r.win ? '<br>Move the ball to the open teammate; shoot when nobody is close, and let go in the green.' : '')
    + (r.rankUp ? `<br><b class="nb">NEW RANK: ${r.rankUp.toUpperCase()}</b>` : '') + ((streaks[L] || 0) >= 3 && !r.tour ? '<br><span class="help">Help is on: they are a little slower to react.</span>' : '');
  renderShop();
  $('eMain').textContent = r.tour ? (r.win && !r.champ ? 'NEXT ROUND' : 'NEW TOURNAMENT') : r.win ? 'NEXT MATCH' : 'PLAY AGAIN'; $('eMain').dataset.act = r.tour ? 'tour' : r.win ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !r.win || !!r.tour);
  show('ovEnd');
  if (r.win) [1, 2, 3].forEach(i => { if (i <= r.stars) setTimeout(() => sfx.star(i), 250 + i * 180); });
}
$('playBtn').onclick = () => { audio(); sfx.click(); practiceOn = false; startGame(); };
$('practiceBtn').onclick = () => { audio(); sfx.click(); practiceOn = true; startGame(); };
window.gameFeedStart = () => { savedLevel(); audio(); practiceOn = false; startGame(true); };      // the feed's instant start: his level, playing at once
$('aquaBtn').onclick = () => { sfx.click(); showAqua(); };
$('rulesBtn').onclick = () => { sfx.click(); show('ovRules'); };
$('levelsBtn').onclick = () => { sfx.click(); showLevels('home'); };
$('eLevels').onclick = () => showLevels('home');
$('eMain').onclick = () => { const a = $('eMain').dataset.act; if (a === 'tour') practiceOn = true; else if (a === 'next') level = Math.min(unlocked, G.N + 1); startGame(); };
$('eAlt').onclick = () => { level = G.N; startGame(); };
let lvFrom = 'home', lvUnder = null;
function showLevels(from) {
  lvFrom = from || 'home'; lvUnder = ['ovHome', 'ovEnd'].find(key => !$(key).classList.contains('hidden')) || null;
  const top = Math.ceil((unlocked + 5) / 5) * 5; let h = '';
  for (let L = 1; L <= top; L++) { const lock = L > unlocked, st = stars[L] || 0; h += `<button class="lvb${L % 5 === 0 ? ' boss' : ''}${L === level ? ' cur' : ''}${lock ? ' lock' : ''}" data-l="${L}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : L}<small>${lock ? '' : '★'.repeat(st)}</small></button>`; }
  $('lvGrid').innerHTML = h; $('lvSub').textContent = unlocked > 1 ? 'Every team plays its own way: strong defence, quick passing, long shooters.' : 'Win the match to open the next level.';
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
function openPause() { paused = true; ui.drag = null; ui.stick = null; ui.btn = {}; if (G) { setStick(G, 0, 0); me(G).holding = false; me(G).sprint = false; } $('pLvl').textContent = `Level ${G.N}`; $('pDiag').textContent = `Picture ${stepN + 1} of ${STEPS.length} · ${Math.round(1000 / ftAvg)} a second · ${W3 && W3.ok ? '3D' : 'no 3D'}`; show('ovPause'); }
$('pauseBtn').onclick = () => { if (G && !G.over) openPause(); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); };
$('pRestart').onclick = () => { sfx.click(); level = G.N; startGame(); };
$('pLevels').onclick = () => showLevels('pause');
$('pQuit').onclick = () => showHome();
window.gameFeedLevels = () => { if (G && !G.over && $('ovHome').classList.contains('hidden')) { openPause(); showLevels('pause'); } else showLevels('feed'); };      // the feed's Levels button
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !paused) openPause(); });
// input (two thumbs, sideways): a floating stick wherever the left thumb lands (left half); PASS, SHOOT (hold for a slap
// shot) and BURST on the right. Touches are turned into the game's sideways picture first (toStage).
const inC = (b, x, y, pad = 10) => Math.hypot(x - b.x, y - b.y) < b.r + pad * k;
cv.addEventListener('pointerdown', e => { audio(); if (!G || G.over || paused) return; e.preventDefault(); const [x, y] = toStage(e.clientX, e.clientY), L = layout(G);
  if (inC(L.shoot, x, y)) { ui.btn.shoot = e.pointerId; shootDown(G); return; }
  if (inC(L.pass, x, y)) { ui.btn.pass = e.pointerId; ui.passAt = [x, y]; ui.aim = null; if (!(haveBall(G) && G.ball.own === me(G))) btnPass(G); try { cv.setPointerCapture(e.pointerId); } catch (err) {} return; }
  if (x < W * 0.55 && !ui.stick) { ui.stick = { id: e.pointerId, x0: x, y0: y, x, y }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} } });
cv.addEventListener('pointermove', e => { if (ui.btn.pass === e.pointerId && ui.passAt) { const [x, y] = toStage(e.clientX, e.clientY), dx = x - ui.passAt[0], dy = y - ui.passAt[1], d = Math.hypot(dx, dy); if (d > 18 * k) { const c = scr(0, 0, 0), c2 = scr(1, 0, 0), c3 = scr(0, 0, 1), ax = c2.x - c.x, ay = c2.y - c.y, bx = c3.x - c.x, by = c3.y - c.y, det = ax * by - ay * bx || 1; ui.aim = { x: (dx * by - dy * bx) / det, z: (ax * dy - ay * dx) / det, sx: dx / d, sy: dy / d }; } return; }
  const s2 = ui.stick; if (!s2 || s2.id !== e.pointerId || !G) return; const [x, y] = toStage(e.clientX, e.clientY); s2.x = x; s2.y = y; const R = 56 * k, dx = (x - s2.x0) / R, dy = (y - s2.y0) / R, d = Math.hypot(dx, dy); setStick(G, d < 0.12 ? 0 : dx, d < 0.12 ? 0 : dy); sprintOn(G, d > 0.9); });      // a full push sprints
function endTouch(e) { if (ui.stick && ui.stick.id === e.pointerId) { ui.stick = null; if (G) { setStick(G, 0, 0); sprintOn(G, false); } }
  if (ui.btn.shoot === e.pointerId) { ui.btn.shoot = null; if (G) shootUp(G); } if (ui.btn.pass === e.pointerId) { ui.btn.pass = null; if (G && haveBall(G) && G.ball.own === me(G)) btnPass(G, ui.aim); ui.aim = null; ui.passAt = null; } if (ui.btn.sprint === e.pointerId) { ui.btn.sprint = null; if (G) sprintOn(G, false); } }
cv.addEventListener('pointerup', endTouch); cv.addEventListener('pointercancel', endTouch);
// your kits: the team's colour, opened by the stars you win
const starsAll = () => Object.values(store.get('stars', {}) || {}).reduce((a, b) => a + b, 0), skinOpen = q => starsAll() >= q.stars, skinsOpen = () => SKINS.filter(skinOpen).length;
function showAqua() { const sel = store.get('skin', 'blue');
  $('aqSub').innerHTML = `<b>${skinsOpen()}</b> of ${SKINS.length} kits · ★ ${starsAll()}<br>Tap one to wear it.`;
  $('aqGrid').innerHTML = SKINS.map((q, i) => `<div class="aq ${skinOpen(q) ? '' : 'off'}" data-i="${i}" style="${q.id === sel ? 'box-shadow:inset 0 0 0 2px var(--acc)' : ''}"><div style="width:48px;height:20px;border-radius:6px;margin:12px auto 8px;background:${'#' + q.col.toString(16).padStart(6, '0')}"></div><b>${q.name}</b><small>${skinOpen(q) ? (q.id === sel ? 'WEARING' : 'TAP TO CHOOSE') : '★ ' + q.stars}</small></div>`).join('');
  $('aqGrid').querySelectorAll('.aq').forEach(el => { const q = SKINS[+el.dataset.i]; el.onclick = () => { if (!skinOpen(q)) { sfx.no(); return; } store.set('skin', q.id); sfx.click(); showAqua(); }; }); show('ovAqua'); }

// ---------- the pro shop: upgrades bought with coins; they stay with you (nothing expires) ----------
const rankOf = tot => { let r = RANKS[0][1]; for (const [n, name] of RANKS) if (tot >= n) r = name; return r; };
function renderShop() { const el = $('eShop'); if (!el) return; const bank = store.get('bank', 0), ups = store.get('ups', {}) || {}; let h = `<h3><span>THE LOCKER ROOM</span><span>🪙 ${bank}</span></h3><div class="grid">`;
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
    let dt = rdt; if (FX.stop > 0) { FX.stop -= rdt; dt = 0; } if (FX.slow > 0) { FX.slow -= rdt; dt *= 0.3; }      // a heartbeat of stillness on a hit (P7)
    if (!G.over) step(G, dt);
    for (const e of G.ev) onEvent(G, e); if (tutRun && G.ev.some(e => e.k === 'lessondone')) tutNext();
    if (G.ev.length && G.over && !G.saved) { G.saved = true; saveResult(G); }
    G.ev.length = 0;
    if (G.over) { endT += rdt; if (endT > (G.res.win ? 0.6 : 0.5)) { endT = -1e9; showEnd(); } }      // a short moment, then the card (P23)
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
  x() { return { k, team, me, bestTarget, greenZone, dHoop, contest, tipOff, give }; }, stick(x, z) { setStick(G, x, z); }, pass(dir) { return btnPass(G, dir); }, shootDown() { return shootDown(G); }, shootUp() { return shootUp(G); }, sprint(on) { return sprintOn(G, on); }, layout() { return layout(G); }, ui, store,
  practice(on) { practiceOn = on; }, showAqua, mySkin, SKINS, scr, renderShop, get V3() { return V3; }, W3,
  go(N) { HEADLESS = false; level = N; startGame(); },
  playing, makeCfg, LESSONS, BLIND, honest, winNow() { winNow(G); }, live() { HEADLESS = false; last = performance.now(); },
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
// 23 Nov 2026 (small-phone sweep): played sideways on a phone 360 wide, a card taller than the screen had its last buttons off the
// edge (Eleven's NEXT LEVEL could only be reached by scrolling a card nobody knows scrolls). A card that does not fit is shrunk to fit.
function fitCards() { fitCards.q = 0; document.querySelectorAll('.ov:not(.hidden) .card').forEach(c => { c.style.zoom = ''; const h = c.scrollHeight, room = document.getElementById('stage').clientHeight - 6; if (h > room) c.style.zoom = String(Math.max(0.6, room / h)); }); }
window.__fitCards = fitCards;
{ const later = () => { if (!fitCards.q) { fitCards.q = 1; requestAnimationFrame(fitCards); } }; document.querySelectorAll('.ov').forEach(o => new MutationObserver(later).observe(o, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true })); addEventListener('resize', () => setTimeout(later, 60)); setTimeout(later, 0); }
})();
</script>
</body>
</html>
