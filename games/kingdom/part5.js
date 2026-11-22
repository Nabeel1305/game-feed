
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
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause', 'ovAqua', 'ovCups', 'ovSet'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
const helpOn = () => (streaks[level] || 0) >= 3;
const playing = () => !!G && !G.over && !paused && $('ovHome').classList.contains('hidden') && $('ovEnd').classList.contains('hidden');
function showHome() {
  savedLevel(); G = null; paused = false; $('pauseBtn').classList.add('hidden');
  $('hLvl').textContent = level;
  const bt = best[level], bank = store.get('bank', 0), tot = store.get('earned', 0);
  const cf = makeCfg(level), bd = (store.get('bestT', {}) || {})[level];
  $('hStat').innerHTML = [`${CUPS[cf.cup].icon} <b>${CUPS[cf.cup].name}</b> · ${CLASSES[cf.cls]} · race ${((level - 1) % 4) + 1} of 4`, `<b>${TRACKS[cf.track].name}</b> · ${cf.laps} laps · finish <b>${cf.place === 1 ? 'first' : 'top ' + cf.place}</b>${cf.boss ? ' · <b class="nb">BOSS RACE</b>' : ''}`, `Driving: <b>${myDriver().name}</b> in the <b>${myKart().name}</b>`, `🪙 <b>${bank}</b> coins · rank <b>${rankOf(tot)}</b> · 🏆 ${trophyCount()}`, bd != null ? `Your best time here: <b>${bd.toFixed(1)} s</b>` : '', bt ? `Your stars here: <b>${'★'.repeat(bt)}</b>` : '', helpOn() ? '<span class="help">Help is on for this level: the rivals are a touch slower.</span>' : ''].filter(Boolean).join('<br>');
  show('ovHome');
}
function startGame() {
  audio(); if (tutForce == null) tutRun = null; if (!HEADLESS && tutForce == null) store.set('level', level);
  G = newGame(level, { help: helpOn(), teach: true, taught: tutForce != null ? tutForce : store.get('taught', 0) | 0 }); paused = false; endT = 0;
  TXT.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0; hint = null; ui.snap = true; ui.stick = null; ui.lapT = 0; PTR.clear(); ui.press = {};
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
  store.set('streaks', streaks);
  cupSave(G, r); { const bl = store.get('bestT', {}) || {}; r.prevBest = bl[L]; if (r.win && (bl[L] == null || r.time < bl[L])) { r.newBest = bl[L] != null; bl[L] = r.time; store.set('bestT', bl); } const sa = starsAll(); r.newShips = DRIVERS.concat(KARTS).filter(q => q.stars > sb && q.stars <= sa).map(q => q.name).join(', '); }
}
function showEnd() {
  const r = G.res, L = G.N; $('pauseBtn').classList.add('hidden');
  const nth = q => q + (q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'); $('eTitle').textContent = r.win ? (r.place === 1 ? 'YOU WIN!' : nth(r.place).toUpperCase() + ' PLACE') : nth(r.place).toUpperCase() + ' PLACE'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : '';
  $('eSub').innerHTML = `${r.track} · <b>${r.time.toFixed(1)} s</b>` + (r.win ? '' : ` · you needed ${r.need === 1 ? 'first' : 'top ' + r.need}` + (r.place === r.need + 1 ? ' · <b>one place short!</b>' : '')) + (r.newBest ? ' · <b class="nb">NEW BEST TIME</b>' : '') + `<br>${r.boosts} drift boosts (${r.big} big) · ${r.tricks} tricks · ${r.zaps} hits · <b>+${r.coins} 🪙</b>` + (r.falls ? ` · ${r.falls} falls` : '') + (r.newShips ? `<br><b class="nb">NEW IN THE GARAGE: ${r.newShips}</b>` : '') + (r.win ? (r.stars < 3 ? `<br>Three stars: win, five big boosts or tricks, and no wipeouts or falls.` : '') : '<br>Drift the long bends for orange sparks, trick off every jump, and save a shell for the kart ahead!') + (r.rankUp ? `<br><b class="nb">NEW RANK: ${r.rankUp.toUpperCase()}</b>` : '') + ((streaks[L] || 0) >= 3 ? '<br><span class="help">Help is on: the rivals are a touch slower.</span>' : '');
  $('eCup').innerHTML = cupHTML(r);
  renderShop();
  $('eMain').textContent = r.win ? 'NEXT LEVEL' : 'TRY AGAIN'; $('eMain').dataset.act = r.win ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !r.win);
  show('ovEnd');
  if (r.win) [1, 2, 3].forEach(i => { if (i <= r.stars) setTimeout(() => sfx.star(i), 250 + i * 180); });
}
$('playBtn').onclick = () => { audio(); sfx.click(); startGame(); };
window.gameFeedStart = () => { savedLevel(); audio(); startGame(); };      // the feed's instant start: his level, playing at once
$('aquaBtn').onclick = () => { sfx.click(); showAqua(); };
$('cupsBtn').onclick = () => { sfx.click(); showCups(); };
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
function tapAt() {}
// input: buttons (KartRider-style). The left half of the screen is ◀ and ▶ (a thumb can slide between them); on the right,
// DRIFT (hold), ITEM (tap: ahead; swipe down: behind) and NITRO (tap). Several thumbs at once. Before the start, any right-hand
// button held revs the engine (rocket start on the second light).
const PTR = new Map(); ui.press = {};
function whichBtn(x, y) { const B = btnLayout(); if (x < W / 2) return x < (B.L.x + B.R.x) / 2 ? 'L' : 'R';
  let best = null, bd = 1e9; for (const id of ['D', 'I', 'N']) { const b = B[id], d = Math.hypot(x - b.x, y - b.y) / b.r; if (d < bd) { bd = d; best = id; } } return bd < 1.8 ? best : (y > H * 0.55 ? 'D' : null); }
function steerFromPtrs() { let l = false, r = false; for (const p of PTR.values()) { if (p.b === 'L') l = true; if (p.b === 'R') r = true; } setBtn(G, 'L', l); setBtn(G, 'R', r); }
function holdFromPtrs() { if (G && G.count > 0) setHold(G, [...PTR.values()].some(p => p.b === 'D' || p.b === 'I' || p.b === 'N')); }
cv.addEventListener('pointerdown', e => { audio(); if (!G || G.over || paused) return; const b = whichBtn(e.clientX, e.clientY); if (!b) return; PTR.set(e.pointerId, { b, x0: e.clientX, y0: e.clientY, done: false }); try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  ui.press[b] = true; if (b === 'L' || b === 'R') steerFromPtrs();
  else if (G.count > 0) holdFromPtrs();
  else if (b === 'D') { if (driftDown(G)) vibe(HAP.tick); }
  else if (b === 'N') { if (useNitro(G)) vibe(HAP.sharp); else sfx.no(); } });
cv.addEventListener('pointermove', e => { const p = PTR.get(e.pointerId); if (!p || !G) return;
  if (p.b === 'L' || p.b === 'R') { const nb = e.clientX < W / 2 ? whichBtn(e.clientX, e.clientY) : p.b; if (nb !== p.b) { ui.press[p.b] = false; p.b = nb; ui.press[nb] = true; steerFromPtrs(); } }
  if (p.b === 'I' && !p.done && e.clientY - p.y0 > 34 * k && G.count <= 0) { p.done = true; const had = G.me.item || G.me.orbit || G.me.peppers; if (itemTap(G, true)) vibe(HAP.light); else if (!had) sfx.no(); } });
function endPtr(e) { const p = PTR.get(e.pointerId); if (!p) return; PTR.delete(e.pointerId); ui.press[p.b] = [...PTR.values()].some(q => q.b === p.b); if (!G) return;
  if (p.b === 'L' || p.b === 'R') steerFromPtrs();
  else if (G.count > 0) holdFromPtrs();
  else if (p.b === 'D') { if (![...PTR.values()].some(q => q.b === 'D')) driftUp(G); }
  else if (p.b === 'I' && !p.done) { const had = G.me.item || G.me.orbit || G.me.peppers || G.me.air; if (itemTap(G, false)) vibe(HAP.light); else if (!had && !G.me.roul) sfx.no(); } }
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
// a keyboard too (arrows steer, space drifts, X item ahead, C item behind, Z nitro)
const KEYS = {}; addEventListener('keydown', e => { if (!G || G.over || paused || KEYS[e.code]) return; KEYS[e.code] = 1; const c2 = e.code;
  if (c2 === 'ArrowLeft') setBtn(G, 'L', true); if (c2 === 'ArrowRight') setBtn(G, 'R', true); if (c2 === 'Space' || c2 === 'ArrowUp') driftDown(G); if (c2 === 'KeyX') itemTap(G, false); if (c2 === 'KeyC' || c2 === 'ArrowDown') itemTap(G, true); if (c2 === 'KeyZ') useNitro(G); if (G.count > 0) setHold(G, true); });
addEventListener('keyup', e => { KEYS[e.code] = 0; if (!G) return; const c2 = e.code; if (c2 === 'ArrowLeft') setBtn(G, 'L', false); if (c2 === 'ArrowRight') setBtn(G, 'R', false); if (c2 === 'Space' || c2 === 'ArrowUp') driftUp(G); if (G.count > 0) setHold(G, false); });
// the garage: drivers and karts, opened with stars; tap one to choose it
function starsAll() { return Object.values(stars).reduce((a, b) => a + b, 0); }
const shipOpen = q => starsAll() >= q.stars, shipsOpen = () => DRIVERS.filter(shipOpen).length + KARTS.filter(shipOpen).length;
function showAqua() { const sd = store.get('driver', 'tobi'), sk2 = store.get('kart', 'classic');
  $('aqSub').innerHTML = `★ ${starsAll()} · <b>${shipsOpen()}</b> of ${DRIVERS.length + KARTS.length} open<br>Tap a driver and a kart.`;
  const card = (q, i, sel, kind) => `<div class="aq ${shipOpen(q) ? '' : 'off'}" data-i="${i}" data-k="${kind}" style="${q.id === sel ? 'box-shadow:inset 0 0 0 2px var(--gold)' : ''}"><canvas width="${kind === 'k' ? 168 : 104}" height="${kind === 'k' ? 92 : 104}" style="width:${kind === 'k' ? 84 : 52}px;height:${kind === 'k' ? 46 : 52}px"></canvas><b>${q.name}</b>${shipOpen(q) ? (q.id === sel ? '✓' : '') : '🔒 ' + q.stars + '★'}</div>`;
  $('aqGrid').innerHTML = DRIVERS.map((q, i) => card(q, i, sd, 'd')).join(''); $('kGrid').innerHTML = KARTS.map((q, i) => card(q, i, sk2, 'k')).join('');
  document.querySelectorAll('#aqGrid .aq, #kGrid .aq').forEach(el => { const kd = el.dataset.k, q = (kd === 'd' ? DRIVERS : KARTS)[+el.dataset.i]; (kd === 'd' ? faceIcon : kartIcon)(el.querySelector('canvas'), q, !shipOpen(q)); el.onclick = () => { if (!shipOpen(q)) { sfx.no(); return; } store.set(kd === 'd' ? 'driver' : 'kart', q.id); sfx.click(); showAqua(); }; });
  show('ovAqua'); }
// a driver's face, drawn flat for the garage
function faceIcon(c, q, off) { const g = c.getContext('2d'), w = c.width, h = c.height, hx = n => '#' + n.toString(16).padStart(6, '0'), cx = w / 2, cy = h / 2 + 6, r = w * 0.32; g.clearRect(0, 0, w, h); g.globalAlpha = off ? 0.3 : 1; const kd = q.kind;
  g.fillStyle = hx(q.col); if (kd === 'cat' || kd === 'fox') for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * 0.9, cy - r * 0.3); g.lineTo(cx + s * r * 0.55, cy - r * 1.35); g.lineTo(cx + s * r * 0.15, cy - r * 0.8); g.fill(); }
  if (kd === 'bunny') for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * 0.4, cy - r * 1.3, r * 0.22, r * 0.6, s * 0.2, 0, TAU); g.fill(); }
  if (kd === 'bear') for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * 0.75, cy - r * 0.75, r * 0.32, 0, TAU); g.fill(); }
  if (kd === 'dragon') { g.fillStyle = hx(q.col2); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * 0.5, cy - r * 0.7); g.lineTo(cx + s * r * 0.75, cy - r * 1.4); g.lineTo(cx + s * r * 0.2, cy - r * 0.85); g.fill(); } }
  if (kd === 'alien') { g.strokeStyle = '#222'; g.lineWidth = 2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * 0.3, cy - r * 0.8); g.lineTo(cx + s * r * 0.55, cy - r * 1.45); g.stroke(); g.fillStyle = hx(q.col2); g.beginPath(); g.arc(cx + s * r * 0.55, cy - r * 1.45, 4, 0, TAU); g.fill(); } }
  g.fillStyle = hx(q.col); if (kd === 'robot') { g.fillRect(cx - r, cy - r * 0.9, r * 2, r * 1.8); g.fillStyle = hx(q.col2); g.fillRect(cx - r * 0.7, cy - r * 0.25, r * 1.4, r * 0.35); } else { g.beginPath(); g.ellipse(cx, cy, r, kd === 'alien' ? r * 1.12 : r, 0, 0, TAU); g.fill(); }
  if (kd === 'penguin' || kd === 'turtle' || kd === 'bunny' || kd === 'bear' || kd === 'fox' || kd === 'cat') { g.fillStyle = kd === 'turtle' ? '#ffe08a' : hx(q.col2); g.beginPath(); g.ellipse(cx, cy + r * 0.38, r * 0.55, r * 0.42, 0, 0, TAU); g.fill(); }
  if (kd === 'penguin') { g.fillStyle = '#ff9a2a'; g.beginPath(); g.moveTo(cx - 6, cy + r * 0.15); g.lineTo(cx + 6, cy + r * 0.15); g.lineTo(cx, cy + r * 0.45); g.fill(); }
  if (kd !== 'robot') { const er = r * (kd === 'alien' ? 0.3 : 0.24); for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx + s * r * 0.36, cy - r * 0.12, er * 0.8, er, 0, 0, TAU); g.fill(); g.fillStyle = '#101018'; g.beginPath(); g.arc(cx + s * r * 0.34, cy - r * 0.08, er * 0.5, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + s * r * 0.3, cy - r * 0.16, er * 0.18, 0, TAU); g.fill(); } }
  g.globalAlpha = 1; }
function kartIcon(c, q, off) { const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h); g.globalAlpha = off ? 0.3 : 1; g.save(); g.translate(w / 2, h / 2 + 8); const col = q.body === 5 ? '#e8b830' : ['#ff3a4a', '#3ab0ff', '#7ae03a', '#ff8a2a', '#c050ff', '#e8b830'][q.body];
  const big = q.body === 3 ? 1.5 : 1; g.fillStyle = '#1a1a1a'; for (const x of [-30, 28]) { g.beginPath(); g.arc(x, 12, 11 * big, 0, TAU); g.fill(); } g.fillStyle = col; g.beginPath();
  if (q.body === 1) g.ellipse(0, 0, 44, 16, 0, 0, TAU); else if (q.body === 4) { g.moveTo(-40, 8); g.lineTo(-36, -8); g.lineTo(10, -10); g.lineTo(52, 2); g.lineTo(-40, 10); } else { g.moveTo(-44, 8); g.lineTo(-38, -10); g.lineTo(12, -12); g.lineTo(44, -2); g.lineTo(46, 8); } g.closePath(); g.fill();
  if (q.body === 0 || q.body === 2 || q.body === 5) { g.fillStyle = '#222'; g.fillRect(-46, -22, 14, 4); g.fillRect(-42, -20, 3, 10); } g.restore();
  g.font = '700 11px sans-serif'; g.fillStyle = '#ffd040'; g.textAlign = 'center'; g.fillText(`${'▲'.repeat(Math.max(0, q.spd + 1))} spd  ${'▲'.repeat(Math.max(0, q.hnd + 1))} grip`, w / 2, 12); g.globalAlpha = 1; }
// ---------- the cups: four races each, points for every place; a trophy for the top three after the fourth ----------
const PTS = [15, 12, 10, 8, 7, 6, 5, 4];
function cupSave(G, r) { const L = G.N, key = classOf(L) * 4 + cupOf(L), ri = (L - 1) % 4; let cp = store.get('cup', null);
  if (!cp || cp.key !== key || ri === 0) cp = { key, races: {} }; cp.races[ri] = r.order; store.set('cup', cp);
  const tot = {}; for (const i in cp.races) cp.races[i].forEach((nm, q) => tot[nm] = (tot[nm] || 0) + PTS[q]);
  r.standing = Object.entries(tot).sort((a, b) => b[1] - a[1]); r.ri = ri; r.cupKey = key; r.racesIn = Object.keys(cp.races).length;
  if (ri === 3) { const pos = r.standing.findIndex(e => e[0] === 'YOU') + 1; r.trophy = pos <= 3 ? pos : 0; const tr = store.get('trophies', {}) || {}; if (r.trophy && (!tr[key] || r.trophy < tr[key])) { r.newTrophy = true; tr[key] = r.trophy; store.set('trophies', tr); } } }
function cupHTML(r) { if (!r.standing) return ''; const mine = r.standing.findIndex(e => e[0] === 'YOU');
  let h = `<div class="vs">${CUPS[r.cup].icon} ${CUPS[r.cup].name.toUpperCase()} · ${CLASSES[r.cls]} · AFTER RACE ${r.ri + 1} OF 4</div>`;
  if (r.ri === 3) h += r.trophy ? `<div class="troph">${['', '🥇', '🥈', '🥉'][r.trophy]}</div><div class="nb"><b>${['', 'GOLD', 'SILVER', 'BRONZE'][r.trophy]} TROPHY!</b></div>` : `<div class="sub">No trophy this time: finish the cup in the top three.</div>`;
  h += '<table class="cupt">' + r.standing.map((e, q) => (q < 4 || q === mine) ? `<tr class="${e[0] === 'YOU' ? 'me' : ''}"><td>${q + 1}.</td><td>${e[0] === 'YOU' ? 'YOU (' + myDriver().name + ')' : e[0]}</td><td>${e[1]} pts</td></tr>` : '').join('') + '</table>'; return h; }
const trophyCount = () => Object.keys(store.get('trophies', {}) || {}).length;
function showCups() { const tr = store.get('trophies', {}) || {}; $('cupSub').innerHTML = `Four races make a cup. Finish a cup in the top three for a trophy.<br>Every 16 levels the cups come round again, faster (and once in a mirror).`;
  let h = '<div class="trow"><b></b>' + CUPS.map(c => `<div style="font-size:18px">${c.icon}</div>`).join('') + '</div>';
  for (let cl = 0; cl < CLASSES.length; cl++) { h += `<div class="trow"><b>${CLASSES[cl]}</b>` + CUPS.map((c, ci) => { const t = tr[cl * 4 + ci]; return `<div class="tc">${t ? ['', '🥇', '🥈', '🥉'][t] : '·'}<small>${c.name.split(' ')[0]}</small></div>`; }).join('') + '</div>'; }
  $('cupGrid').innerHTML = h; show('ovCups'); }
// ---------- the pro shop: upgrades bought with coins; they stay with you (nothing expires) ----------
const rankOf = tot => { let r = RANKS[0][1]; for (const [n, name] of RANKS) if (tot >= n) r = name; return r; };
function renderShop() { const el = $('eShop'); if (!el) return; const bank = store.get('bank', 0), ups = store.get('ups', {}) || {}; let h = `<h3><span>THE PIT SHOP</span><span>🪙 ${bank}</span></h3><div class="grid">`;
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
  // the screen's size, checked twice a second: an app that opens the page before it has its size never sends a resize, and
  // the picture stayed at no size at all (a black screen with only the buttons and the music) on his phone
  if (now - (frame.sz || 0) > 500) { frame.sz = now; const gl3 = typeof W3 !== 'undefined' && W3 && W3.ok; if (innerWidth > 0 && innerHeight > 0 && (W !== innerWidth || H !== innerHeight || !cv.width || (gl3 && !W3.R.domElement.width))) { resize(); if (gl3) W3.resize(); } }
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
  steer(s) { setSteer(G, s); }, btn(b, on) { setBtn(G, b, on); }, driftDown() { return driftDown(G); }, driftUp() { driftUp(G); }, itemTap(back) { return itemTap(G, back); }, nitro() { return useNitro(G); }, btnLayout, hold(on) { setHold(G, on); }, item() { return tapRight(G); }, tap() { return tapRight(G); }, scr, renderShop, ui, get V3() { return V3; }, W3,
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
