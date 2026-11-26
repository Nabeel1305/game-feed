
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
  const bt = best[level], bank = store.get('bank', 0), tot = store.get('earned', 0);
  const cf = makeCfg(level), bh = (store.get('bestH', {}) || {})[level];
  $('hStat').innerHTML = [`🪙 <b>${bank}</b> coins · rank <b>${rankOf(tot)}</b>`, `${PLACES[placeOf(level)].name} · <b>${STYLES[cf.style].name}</b> · match <b>${cf.need}%</b>${cf.years > 1 ? ' · two years' : ''}`, bh ? `Your best match here: <b>${bh}%</b>` : '', `Trees in your garden: <b>${treeCount()}</b> 🌳`, bt ? `Your best here: <b>${'★'.repeat(bt)}</b>` : '', helpOn() ? '<span class="help">Help is on for this level: longer seasons and a kinder judge.</span>' : ''].filter(Boolean).join('<br>');
  show('ovHome');
}
function startGame() {
  audio(); if (tutForce == null) tutRun = null; if (!HEADLESS && tutForce == null) store.set('level', level);
  G = newGame(level, { help: helpOn(), teach: true, taught: tutForce != null ? tutForce : store.get('taught', 0) | 0 }); paused = false; endT = 0;
  TXT.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0; hint = null; ui.snap = true;
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function saveResult(G) {      // a win saves the next level at once (leaving before "Next" still brings him back to it)
  const r = G.res, L = G.N; if (HEADLESS) return; const sb = starsAll();
  if (r.win) { streaks[L] = 0; stars[L] = Math.max(stars[L] || 0, r.stars); unlocked = Math.max(unlocked, L + 1); level = Math.min(unlocked, L + 1); store.set('level', level); store.set('unlocked', unlocked); store.set('stars', stars);
    if (!best[L] || r.stars > best[L]) { r.nb = !!best[L]; best[L] = r.stars; store.set('best', best); } }
  else streaks[L] = (streaks[L] || 0) + 1;
  // coins: every round keeps what it picked up (and a bonus when it is won); the total earned sets your rank
  const before = rankOf(store.get('earned', 0)); store.set('bank', store.get('bank', 0) + r.coins); store.set('earned', store.get('earned', 0) + r.coins); r.rankUp = rankOf(store.get('earned', 0)) !== before ? rankOf(store.get('earned', 0)) : null;
  store.set('streaks', streaks); { const sa = starsAll(); r.newSp = SPECIES.filter(sp => sp.stars > sb && sp.stars <= sa).map(q => q.name).join(', '); }
  { const bh = store.get('bestH', {}) || {}; r.prevBest = bh[L] | 0; if (r.match > r.prevBest) { bh[L] = r.match; store.set('bestH', bh); r.newHigh = !!r.prevBest; }
    if (r.win) { const cs = store.get('trees', {}) || {}; r.firstTree = !cs[L]; if (!cs[L] || r.match >= (cs[L].match | 0)) cs[L] = { tree: r.tree, sp: r.sp, match: r.match, style: r.style }; store.set('trees', cs); } }
}
function showEnd() {
  const r = G.res, L = G.N; $('pauseBtn').classList.add('hidden');
  $('eTitle').textContent = r.win ? 'A FESTIVAL RIBBON' : 'NOT THIS YEAR'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : '';
  $('eSub').innerHTML = `Match <b>${r.match}%</b> of ${r.need}% needed` + (!r.win && r.need - r.match <= 5 ? ' · <b>so close!</b>' : '') + (r.prevBest && !r.win ? ` · your best here ${Math.max(r.prevBest, r.match)}%` : '') + (r.newHigh ? ' · <b class="nb">NEW BEST</b>' : '')
    + `<br>${r.grown} grown · ${r.pruned} pruned · ${r.wild} grew wild` + (r.flicked ? ` · ${r.flicked} 🐛 flicked` : '') + ` · <b>+${r.coins} 🪙</b>`
    + (r.win && r.firstTree ? '<br><b class="nb">Your tree now stands in your garden.</b>' : '') + (r.win ? (r.nb ? ' <b class="nb">NEW BEST</b>' : '') + (r.stars < 3 ? `<br>Match ${r.need + 16}% for three stars.` : '') : '<br>Grow only buds that point into the outline, and cut what grows out of it.')
    + (r.rankUp ? `<br><b class="nb">NEW RANK: ${r.rankUp.toUpperCase()}</b>` : '') + (r.newSp ? `<br><b class="nb">NEW TREE: ${r.newSp}</b>` : '') + ((streaks[L] || 0) >= 3 ? '<br><span class="help">Help is on: longer seasons and a kinder judge.</span>' : '');
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
// input (one thumb): a tap on the tree (a caterpillar, a bud, a branch); the Next season button
function tapAt() {}
cv.addEventListener('pointerdown', e => { audio(); if (!G || G.over || paused) return; const x = e.clientX, y = e.clientY, nb = ui.nextBtn;
  if (nb && x > nb.x - 6 && x < nb.x + nb.w + 6 && y > nb.y - 6 && y < nb.y + nb.h + 6) { if (nextSeason(G)) { sfx.click(); vibe(HAP.light); } return; }
  { let pb = null, pd = 40 * k; for (const c of G.pests) { const q = scr(c.x, c.y, 0.16), d = Math.hypot(q.x - x, q.y - y); if (d < pd) { pd = d; pb = c; } } if (pb) { if (tap(G, pb.x, pb.y)) vibe(HAP.light); return; } }      /* a caterpillar is hit where it is DRAWN (it sits in front of the tree: tapped through to the tree's plane, a finger on it missed half the time; 26 Nov 2026) */
  const p = worldAt(x, y); if (!p) return; if (tap(G, p.x, p.y)) vibe(HAP.light); });
// your garden: every level you win leaves its tree there; and the trees you can grow (unlocked by stars)
const treeCount = () => Object.keys(store.get('trees', {}) || {}).length;
function spOpen(sp) { return starsAll() >= sp.stars; }
function starsAll() { return Object.values(stars).reduce((a, b) => a + b, 0); }
function showAqua() { const cs = store.get('trees', {}) || {}, keys = Object.keys(cs).map(Number).sort((a, b) => a - b), sel = store.get('species', 'juniper');
  $('aqSub').innerHTML = `★ ${starsAll()} · tap a tree to grow it next` + (keys.length ? `<br><b>${keys.length}</b> trees in your garden` : '<br>Win a level and its tree stands here.');
  $('aqGrid').innerHTML = SPECIES.map((sp, i) => `<div class="aq${sp.id === sel ? ' cur' : ''}" data-sp="${i}" style="${sp.id === sel ? 'box-shadow:inset 0 0 0 2px var(--acc)' : ''}"><canvas width="128" height="150"></canvas><b>${sp.name}</b>${spOpen(sp) ? (sp.id === sel ? 'growing' : 'tap to grow') : '🔒 ' + sp.stars + ' ★'}</div>`).join('')
    + keys.map(L => `<div class="aq"><canvas data-l="${L}" width="128" height="150"></canvas><b>Level ${L}</b>${cs[L].match}% ${cs[L].style}</div>`).join('');
  $('aqGrid').querySelectorAll('[data-sp]').forEach(el => { const sp = SPECIES[+el.dataset.sp]; treeIcon(el.querySelector('canvas'), null, sp, !spOpen(sp)); el.onclick = () => { if (!spOpen(sp)) { sfx.no(); return; } store.set('species', sp.id); sfx.click(); showAqua(); }; });
  $('aqGrid').querySelectorAll('canvas[data-l]').forEach(c => { const t = cs[c.dataset.l]; treeIcon(c, t.tree, SPECIES.find(q => q.id === t.sp) || SPECIES[0], false); }); show('ovAqua'); }
const DEMO = [[0, 0, 0, 0.5, 0], [0, 0.5, -0.25, 0.75, 0.15], [0, 0.5, 0.25, 0.75, 0.15], [-0.25, 0.75, -0.3, 1.02, 0.17], [0.25, 0.75, 0.32, 1.0, 0.17], [-0.25, 0.75, -0.5, 0.82, 0.17], [0.25, 0.75, 0.5, 0.86, 0.17], [-0.3, 1.02, -0.05, 1.2, 0.17], [0.32, 1.0, 0.1, 1.28, 0.17]];
function treeIcon(c, tree, sp, off) { const g = c.getContext('2d'), w = c.width, h = c.height, hx = n => '#' + n.toString(16).padStart(6, '0'), sc = 58, ox = w / 2, oy = h - 26; g.clearRect(0, 0, w, h); g.globalAlpha = off ? 0.35 : 1;
  g.fillStyle = '#7a4a3a'; g.beginPath(); g.moveTo(ox - 34, oy); g.lineTo(ox + 34, oy); g.lineTo(ox + 26, oy + 18); g.lineTo(ox - 26, oy + 18); g.closePath(); g.fill();
  const T = tree || DEMO; g.strokeStyle = hx(sp.bark); g.lineCap = 'round'; for (const [x0, y0, x, y] of T) { g.lineWidth = Math.max(2, 7 - y0 * 4); g.beginPath(); g.moveTo(ox + x0 * sc, oy - y0 * sc); g.lineTo(ox + x * sc, oy - y * sc); g.stroke(); }
  for (const [, , x, y, r] of T) if (r > 0.02) { g.fillStyle = hx(sp.leaf); g.beginPath(); g.arc(ox + x * sc, oy - y * sc, r * sc, 0, TAU); g.fill(); g.fillStyle = hx(sp.leaf2) + '88'; g.beginPath(); g.arc(ox + x * sc - r * sc * 0.25, oy - y * sc - r * sc * 0.3, r * sc * 0.55, 0, TAU); g.fill(); }
  g.globalAlpha = 1; }

// ---------- the pro shop: upgrades bought with coins; they stay with you (nothing expires) ----------
const rankOf = tot => { let r = RANKS[0][1]; for (const [n, name] of RANKS) if (tot >= n) r = name; return r; };
function renderShop() { const el = $('eShop'); if (!el) return; const bank = store.get('bank', 0), ups = store.get('ups', {}) || {}; let h = `<h3><span>THE POTTING SHED</span><span>🪙 ${bank}</span></h3><div class="grid">`;
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
  stepEv(dt) { step(G, dt); const e = G.ev.slice(); G.ev.length = 0; return e; },
  adv(sec) { for (let i = 0; i < sec * 60; i++) { if (!G.over) step(G, 1 / 60); for (const e of G.ev) onEvent(G, e); G.ev.length = 0; fxStep(1 / 60); } },
  frame() { draw(performance.now() / 1000, 1 / 60); },
  tap(x, y) { return tap(G, x, y); }, next() { return nextSeason(G); }, scr, renderShop, ui, get V3() { return V3; }, W3,
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
})();
</script>
</body>
</html>
