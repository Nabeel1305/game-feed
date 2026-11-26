
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
  $('hStat').innerHTML = [`🪙 <b>${bank}</b> coins · rank <b>${rankOf(tot)}</b>`, `<b>${PLACES[cf.place].name}</b> · ${CRIMES[cf.kind].title.toLowerCase()} · ${cf.sus} suspects · ${cf.rooms} ${cf.rooms === 1 ? 'room' : 'rooms'}`, bt ? `Your best here: <b>${bt}</b> 🪙` : '', helpOn() ? '<span class="help">Help is on: one free hint and one more try.</span>' : ''].filter(Boolean).join('<br>');
  $('dui').classList.add('hidden');
  show('ovHome');
}
let practiceOn = false;
function startGame(mini) {
  audio(); if (tutForce == null) tutRun = null; if (!HEADLESS && tutForce == null) store.set('level', level);
  G = newGame(practiceOn ? 1 + ((Math.random() * unlocked) | 0) : level, { help: helpOn(), teach: !practiceOn, mini: !!mini, taught: tutForce != null ? tutForce : store.get('taught', 0) | 0 }); paused = false; endT = 0;
  TXT.length = 0; PARTS.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0; hint = null; ui.snap = true; ui.banner = null; ui.drag = null; ui.pinch = null; ui.zoom = 1; ui.tab = 'scene'; ui.sus = null; ui.acc = { who: null, how: null, when: null, proof: [] }; ui.linkFor = null; ui.said = null; ui.why = null; ui.dirty = true;
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); $('dui').classList.remove('hidden'); render(); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function saveResult(G) {      // a win saves the next level at once (leaving before "Next" still brings him back to it)
  const r = G.res, L = G.N; if (HEADLESS) return; const starsBefore = starsAll();
  if (r.win) { streaks[L] = 0; stars[L] = Math.max(stars[L] || 0, r.stars); unlocked = Math.max(unlocked, L + 1); level = Math.min(unlocked, L + 1); store.set('level', level); store.set('unlocked', unlocked); store.set('stars', stars);
    if (r.coins > (best[L] || 0)) { r.nb = !!best[L]; best[L] = r.coins; store.set('best', best); } }
  else streaks[L] = (streaks[L] || 0) + 1;
  const before = rankOf(store.get('earned', 0)); store.set('bank', store.get('bank', 0) + r.coins); store.set('earned', store.get('earned', 0) + r.coins); r.rankUp = rankOf(store.get('earned', 0)) !== before ? rankOf(store.get('earned', 0)) : null;
  store.set('streaks', streaks); if ((r.best || 0) > store.get('streakBest', 0)) { r.streakNB = true; store.set('streakBest', r.best); }
  { const sb = starsAll(); r.newSkins = SKINS.filter(q => q.stars > starsBefore && q.stars <= sb).map(q => q.name).join(', '); }
}
function showEnd() {
  const r = G.res, L = G.N; $('pauseBtn').classList.add('hidden'); $('dui').classList.add('hidden');
  $('eTitle').textContent = r.win ? (r.stars === 3 ? 'CASE CLOSED!' : 'SOLVED!') : 'THE CASE WENT COLD'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : '';
  $('eSub').innerHTML = `<b>${r.who}</b> did it: ${r.how.toLowerCase()}, at ${r.when}.<br><span style="opacity:.85">The proof: ${r.proof.map(t => '“' + t + '”').join(' and ')}</span>`
    + (r.herrings.length ? `<br><span style="opacity:.8">${r.herrings.join(' and ')} lied too, but only to hide a secret.</span>` : '')
    + `<br>🔎 ${r.found} of ${r.of} clues found · ${r.strikes} wrong · ${r.hints} hints<br><b>+${r.coins} 🪙</b>` + (r.nb ? ' <b class="nb">NEW BEST</b>' : '')
    + (r.newSkins ? `<br><b class="nb">NEW COAT: ${r.newSkins.toUpperCase()}</b>` : '') + (r.win && r.stars < 3 ? '<br>Three stars: right the first time, with one hint at most.' : '')
    + (!r.win ? '<br>Find who was not where they said: their own things at the scene give them away. Show people their clues before you accuse.' : '')
    + (r.rankUp ? `<br><b class="nb">NEW RANK: ${r.rankUp.toUpperCase()}</b>` : '') + ((streaks[L] || 0) >= 3 ? '<br><span class="help">Help is on: one free hint and one more try.</span>' : '');
  renderShop();
  $('eMain').textContent = r.win ? (practiceOn ? 'ANOTHER CASE' : 'NEXT CASE') : 'NEW CASE'; $('eMain').dataset.act = r.win ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !r.win);
  show('ovEnd');
  if (r.win) [1, 2, 3].forEach(i => { if (i <= r.stars) setTimeout(() => sfx.star(i), 250 + i * 180); });
}
$('playBtn').onclick = () => { audio(); sfx.click(); practiceOn = false; startGame(); };
$('practiceBtn').onclick = () => { audio(); sfx.click(); practiceOn = true; startGame(); };      // a free flight: any place, no lesson, help on
window.gameFeedStart = () => { savedLevel(); audio(); practiceOn = false; startGame(true); };      // the feed's instant start: his level, playing at once
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
  for (let L = 1; L <= top; L++) { const lock = L > unlocked, st = stars[L] || 0; h += `<button class="lvb${L % 5 === 0 ? ' boss' : ''}${L === level ? ' cur' : ''}${lock ? ' lock' : ''}" data-l="${L}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : L}<small>${lock ? '' : '★'.repeat(st)}</small></button>`; }
  $('lvGrid').innerHTML = h; $('lvSub').textContent = unlocked > 1 ? 'More X, more winds, wires and turning winds as you go.' : 'Score enough and land to open the next flight.';
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
function openPause() { paused = true; ui.drag = null; ui.pinch = null; $('pLvl').textContent = `Level ${G.N}`; $('pDiag').textContent = `Picture ${stepN + 1} of ${STEPS.length} · ${Math.round(1000 / ftAvg)} a second · ${W3 && W3.ok ? '3D' : 'no 3D'}`; show('ovPause'); }
$('pauseBtn').onclick = () => { if (G && !G.over) openPause(); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); };
$('pRestart').onclick = () => { sfx.click(); level = G.N; startGame(); };
$('pLevels').onclick = () => showLevels('pause');
$('pQuit').onclick = () => showHome();
window.gameFeedLevels = () => { if (G && !G.over && $('ovHome').classList.contains('hidden')) { openPause(); showLevels('pause'); } else showLevels('feed'); };      // the feed's Levels button
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !paused) openPause(); });
// input (one thumb): tap an object in the room to examine it; while examining, drag to turn it, pinch to zoom, tap a mark;
// everything else is in the panel below (built from the case each time something changes).
const PT = new Map();
cv.addEventListener('pointerdown', e => { audio(); if (!G || G.over || paused) return; if (e.clientY > SH()) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  PT.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now() });
  if (PT.size === 2) { const [a, b] = [...PT.values()]; ui.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: ui.zoom }; ui.drag = null; } else ui.drag = { id: e.pointerId, x: e.clientX, moved: 0 }; });
cv.addEventListener('pointermove', e => { const P = PT.get(e.pointerId); if (!P || !G) return; P.x = e.clientX; P.y = e.clientY;
  if (ui.pinch && PT.size >= 2) { const [a, b] = [...PT.values()]; ui.zoom = clamp(ui.pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(20, ui.pinch.d0), 0.7, 2.2); return; }
  if (ui.drag && ui.drag.id === e.pointerId && G.insp) { const dx = e.clientX - ui.drag.x; ui.drag.x = e.clientX; ui.drag.moved += Math.abs(dx); turnInspect(G, dx * 0.012); } });
function endTouch(e) { const P = PT.get(e.pointerId); PT.delete(e.pointerId); if (!P || !G || G.over) { ui.drag = null; return; } if (PT.size < 2) ui.pinch = null;
  const moved = Math.hypot(P.x - P.x0, P.y - P.y0), quick = performance.now() - P.t < 450; ui.drag = null; if (moved > 12 * k || !quick || PT.size) return;
  if (G.insp) { const [u, v] = faceUV(P.x, P.y); if (Math.abs(u) > 1.5 || Math.abs(v) > 1.5) return; tapInspect(G, u, v); return; }
  // the nearest object under the tap (big targets: within 46 px of its middle)
  const r = G.rooms[G.room]; let best = -1, bd = 46 * k; r.items.forEach((it, j) => { const s = scrOf(it.x, 0.6, it.z); if (!s) return; const d = Math.hypot(s.x - P.x, s.y - P.y); if (d < bd) { bd = d; best = j; } });
  if (best >= 0) { inspect(G, best); render(); } }
cv.addEventListener('pointerup', endTouch); cv.addEventListener('pointercancel', endTouch);
// your kit: your colours, opened by the stars you win
const starsAll = () => Object.values(store.get('stars', {}) || {}).reduce((a, b) => a + b, 0), skinOpen = q => starsAll() >= q.stars, skinsOpen = () => SKINS.filter(skinOpen).length;
function showAqua() { const sel = store.get('skin', 'sun');
  $('aqSub').innerHTML = `<b>${skinsOpen()}</b> of ${SKINS.length} balloons · ★ ${starsAll()}<br>Tap one to wear it.`;
  $('aqGrid').innerHTML = SKINS.map((q, i) => `<div class="aq ${skinOpen(q) ? '' : 'off'}" data-i="${i}" style="${q.id === sel ? 'box-shadow:inset 0 0 0 2px var(--acc)' : ''}"><div style="width:48px;height:20px;border-radius:6px;margin:12px auto 8px;background:${'#' + q.top.toString(16).padStart(6, '0')}"></div><b>${q.name}</b><small>${skinOpen(q) ? (q.id === sel ? 'WEARING' : 'TAP TO CHOOSE') : '★ ' + q.stars}</small></div>`).join('');
  $('aqGrid').querySelectorAll('.aq').forEach(el => { const q = SKINS[+el.dataset.i]; el.onclick = () => { if (!skinOpen(q)) { sfx.no(); return; } store.set('skin', q.id); sfx.click(); showAqua(); }; }); show('ovAqua'); }

// ---------- the case panel (DOM): briefing and rooms, people, notebook, accusation ----------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function portrait(s, size = 44) { const c = document.createElement('canvas'); c.width = c.height = size * 2; const g = c.getContext('2d'), L = s.look, hue = Math.floor(L[0] * 360);
  g.fillStyle = `hsl(${hue},35%,78%)`; g.fillRect(0, 0, size * 2, size * 2); g.fillStyle = `hsl(${20 + L[1] * 20},${40 + L[1] * 20}%,${35 + L[2] * 40}%)`; g.beginPath(); g.arc(size, size * 1.05, size * 0.55, 0, TAU); g.fill();
  g.fillStyle = `hsl(${Math.floor(L[2] * 50)},40%,${15 + L[0] * 50}%)`; g.beginPath(); g.arc(size, size * 0.82, size * 0.58, Math.PI, TAU); g.fill(); g.fillStyle = `hsl(${hue},45%,40%)`; g.fillRect(size * 0.4, size * 1.6, size * 1.2, size * 0.5);
  g.fillStyle = '#222'; for (const x of [0.78, 1.22]) { g.beginPath(); g.arc(size * x, size * 1.02, size * 0.07, 0, TAU); g.fill(); } return c; }
function render() { if (!G || HEADLESS) return; ui.dirty = false; const B = $('dBody');
  $('dTitle').textContent = `${G.lesson ? 'Lesson · ' : ''}${G.K.title}: ${G.obj}`; $('dStrikes').textContent = G.strikes ? '✗'.repeat(G.strikes) + ` ${Math.max(0, G.cfg.tries - G.strikes)} left` : '';
  $('dRooms').innerHTML = G.insp ? '' : G.rooms.map((r, i) => `<button data-room="${i}" class="${i === G.room ? 'on' : ''}">${esc(r.name)}${i === 0 ? ' ✦' : ''}</button>`).join('');
  $('dInsp').classList.toggle('hidden', !G.insp); if (G.insp) { const it = G.insp.it, cl = it.clue != null ? clue(G, it.clue) : null; $('dInspTxt').innerHTML = `<b>${esc(ITEMNAME[it.kind])}</b><br>` + (cl && cl.found ? `🔎 ${esc(cl.text)}` : esc(FILL[it.kind]) + ' <span style="opacity:.7">Turn it to see every side.</span>'); }
  document.querySelectorAll('#dTabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === ui.tab); b.classList.toggle('new', b.dataset.tab === 'notes' && ui.newNote && ui.tab !== 'notes'); });
  let h = '';
  if (G.lesson) { const D = G.lesson, st = D.steps[D.i]; h += `<div class="why" style="background:#e6f4ea;border-color:#2a8a4a;text-align:center"><span style="font-size:12px">LESSON ${G.N} OF 3 · ${'●'.repeat(D.n)}${'○'.repeat(Math.max(0, st.need - D.n))}</span><br><b style="font-size:24px;line-height:1.15">👆 ${esc((typeof st.say === 'function' ? st.say(G) : st.say) || st.title)}</b></div>`;      /* his words (24 Nov 2026): a few big words, not a paragraph */ }
  if (ui.tab === 'scene') { h += `<div class="brief">${esc(G.brief)}</div><h4>WHAT YOU KNOW</h4>`; const facts = G.facts.slice(-6); h += facts.length ? facts.map(f => `<div class="row fact"><span class="ic">✓</span><span class="tx">${esc(f.text)}</span></div>`).join('') : '<div class="row"><span class="tx">Nothing yet. Search the room: tap the objects above.</span></div>';
    h += `<h4>THE ROOMS</h4>` + G.rooms.map((r, i) => `<div class="row"><span class="ic">${i === 0 ? '✦' : '·'}</span><span class="tx"><b>${esc(r.name)}</b>${i === 0 ? ' (where it happened)' : ''}: ${r.items.filter(q => q.seen).length} of ${r.items.length} things looked at</span></div>`).join(''); }
  if (ui.tab === 'people') { if (ui.sus == null) { h += G.S.map(s => `<div class="sus" data-sus="${s.i}"><span class="pp" data-i="${s.i}"></span><div><b>${esc(s.name)}</b><small>${esc(s.role)}${s.cracked ? ' · <b style="color:#a8301a">story cracked</b>' : s.admitted ? ' · owned up to a secret' : s.where ? ` · says: the ${esc(s.claim === s.truth || !s.secret || s.admitted ? s.claim : 'their room')}` : ''}</small></div></div>`).join(''); }
    else { const s = G.S[ui.sus]; h += `<div class="sus"><span class="pp" data-i="${s.i}"></span><div><b>${esc(s.name)}</b><small>${esc(s.role)} · patience ${'●'.repeat(Math.max(0, s.patience))}${'○'.repeat(3 - Math.max(0, s.patience))}</small></div><button class="mini" data-back>‹ All</button></div>`;
      if (ui.said && ui.said.si === s.i) h += `<div class="say">“${esc(ui.said.text)}”</div>`;
      if (s.patience > 0) { h += `<h4>ASK</h4><div class="chips">` + questions(G, s.i).map(qq => `<button class="chip" data-ask="${qq.id}">${esc(qq.q)}</button>`).join('') + `</div><h4>SHOW A CLUE</h4><div class="chips">` + (found(G).length ? found(G).map(c => `<button class="chip" data-show="${c.id}">${esc(c.text)}</button>`).join('') : '<span>No clues yet.</span>') + '</div>'; }
      else h += '<div class="why">They will not answer any more questions.</div>'; } }
  if (ui.tab === 'notes') { ui.newNote = false; const f = found(G);
    h += '<h4>FACTS ✓</h4>' + (G.facts.length ? G.facts.map(x => `<div class="row fact"><span class="ic">✓</span><span class="tx">${esc(x.text)}</span></div>`).join('') : '<div class="row"><span class="tx">Proven facts appear here.</span></div>');
    h += '<h4>CLUES</h4>' + (f.length ? f.map(c => { const ls = G.links.filter(L => L.cid === c.id); return `<div class="row"><span class="ic">◆</span><span class="tx">${esc(c.text)}${ls.map(L => `<br><small style="color:${L.fact ? '#1a6a2a' : '#8a6a3a'}">→ ${esc(G.S[L.si].name)}: ${esc(IMPL.find(m => m.id === L.imp).name)} ${L.fact ? '✓ fact' : '(your theory: not proven)'}</small>`).join('')}
      ${ui.linkFor && ui.linkFor.cid === c.id ? `<div class="chips" style="margin-top:6px">${ui.linkFor.si == null ? G.S.map(s => `<button class="chip" data-lsus="${s.i}">${esc(s.name)}</button>`).join('') : IMPL.map(m => `<button class="chip" data-limp="${m.id}">${esc(m.name)}</button>`).join('')}</div>` : ''}</span><button class="mini" data-link="${c.id}">Link</button></div>`; }).join('') : '<div class="row"><span class="tx">Clues you find are kept here.</span></div>');
    const said = G.notes.filter(n => n.kind === 'said'); h += '<h4>WHAT THEY SAID</h4>' + (said.length ? said.map(n => `<div class="row said"><span class="ic">“</span><span class="tx">${esc(n.text)}</span></div>`).join('') : '<div class="row"><span class="tx">Ask people where they were.</span></div>'); }
  if (ui.tab === 'accuse') { const A = ui.acc, f = found(G);
    h += '<h4>WHO DID IT?</h4><div class="chips">' + G.S.map(s => `<button class="chip ${A.who === s.i ? 'on' : ''}" data-who="${s.i}">${esc(s.name)}</button>`).join('') + '</div>';
    h += '<h4>HOW?</h4><div class="chips">' + G.K.how.map((m, i) => `<button class="chip ${A.how === i ? 'on' : ''}" data-how="${i}">${esc(m.name)}</button>`).join('') + '</div>';
    h += '<h4>WHEN?</h4><div class="chips">' + TIMES.map((t, i) => `<button class="chip ${A.when === i ? 'on' : ''}" data-when="${i}">${t}</button>`).join('') + '</div>';
    h += `<h4>THE PROOF: PICK TWO CLUES (${A.proof.length}/2)</h4><div class="chips">` + (f.length ? f.map(c => `<button class="chip ${A.proof.includes(c.id) ? 'on' : ''}" data-proof="${c.id}">${esc(c.text)}</button>`).join('') : '<span>Find clues first.</span>') + '</div>';
    if (ui.why) h += ui.why.map(w => `<div class="why">${esc(w)}</div>`).join('');
    h += `<button class="go" id="goAccuse" ${A.who == null || A.how == null || A.when == null || A.proof.length < 2 ? 'disabled' : ''}>⚖ ACCUSE (${Math.max(0, G.cfg.tries - G.strikes)} ${G.cfg.tries - G.strikes === 1 ? 'try' : 'tries'} left)</button>`; }
  B.innerHTML = h; B.querySelectorAll('.pp').forEach(el => el.replaceWith(portrait(G.S[+el.dataset.i]))); }
$('dTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b || !G) return; sfx.click(); ui.tab = b.dataset.tab; ui.sus = null; ui.linkFor = null; render(); $('dBody').scrollTop = 0; });
$('dRooms').addEventListener('click', e => { const b = e.target.closest('[data-room]'); if (!b || !G) return; goRoom(G, +b.dataset.room); render(); });
$('dInspDone').onclick = () => { if (G) { closeInspect(G); sfx.click(); render(); } };
$('hintBtn').onclick = () => { if (G && !G.over) { audio(); askHint(G); render(); } };
$('dBody').addEventListener('click', e => { if (!G || G.over) return; const t = e.target.closest('button,.sus'); if (!t) return; const d = t.dataset, A = ui.acc;
  if (d.sus != null && ui.sus == null) { ui.sus = +d.sus; ui.said = null; sfx.click(); }
  else if (d.back != null) ui.sus = null;
  else if (d.ask) ask(G, ui.sus, d.ask);
  else if (d.show) present(G, ui.sus, +d.show);
  else if (d.link) { ui.linkFor = ui.linkFor && ui.linkFor.cid === +d.link ? null : { cid: +d.link, si: null }; sfx.click(); }
  else if (d.lsus) { ui.linkFor.si = +d.lsus; sfx.click(); }
  else if (d.limp) { link(G, ui.linkFor.cid, ui.linkFor.si, d.limp); ui.linkFor = null; }
  else if (d.who) { A.who = +d.who; sfx.click(); } else if (d.how) { A.how = +d.how; sfx.click(); } else if (d.when) { A.when = +d.when; sfx.click(); }
  else if (d.proof) { const id = +d.proof; A.proof = A.proof.includes(id) ? A.proof.filter(x => x !== id) : A.proof.concat(id).slice(-2); sfx.click(); }
  else if (t.id === 'goAccuse') { const r = accuse(G, { who: A.who, how: A.how, when: A.when, proof: A.proof }); if (r && r.ok) ui.why = null; }
  else return; render(); });
setInterval(() => { if (G && ui.dirty && !HEADLESS) render(); }, 120);
// ---------- the pro shop: upgrades bought with coins; they stay with you (nothing expires) ----------
const rankOf = tot => { let r = RANKS[0][1]; for (const [n, name] of RANKS) if (tot >= n) r = name; return r; };
function renderShop() { const el = $('eShop'); if (!el) return; const bank = store.get('bank', 0), ups = store.get('ups', {}) || {}; let h = `<h3><span>THE KIT BAG</span><span>🪙 ${bank}</span></h3><div class="grid">`;
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
  x() { return { k, scrOf, faceUV, faceXY, SH, inspect, turnInspect, tapInspect, closeInspect, goRoom, ask, present, link, askHint, accuse, questions, faceNow, found, clue, render, TIMES }; }, layout() { return layout(G); }, ui, store,
  practice(on) { practiceOn = on; },
  showAqua, mySkin, SKINS, renderShop, get V3() { return V3; }, W3,
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
setInterval(() => { const on = !!(G && G.lesson && !G.over && (!paused || (typeof AIMEL !== 'undefined' && AIMEL && AIMEL._unpause)) && !HEADLESS);      /* Skip stays while the aim card is up */ $('skipTut').classList.toggle('hidden', !on); }, 150);
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
