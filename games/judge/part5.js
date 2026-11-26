
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
  savedLevel(); G = null; $('court').classList.add('hidden'); paused = false; $('pauseBtn').classList.add('hidden');
  $('hLvl').textContent = level;
  const bank = store.get('bank', 0), tot = store.get('earned', 0), cf = makeCfg(level), recs = (store.get('record', []) || []).length;
  $('hStat').innerHTML = [`⚖ <b>${bank}</b> · rank <b>${rankOf(tot)}</b>`, cf.free ? 'Free bench: sentence as you see fit, no council.' : `${PLACES[cf.place].name} · five cases · the council's pass mark <b>${cf.pass}</b>`, recs ? `Your record: <b>${recs}</b> sentences passed` : '', clerkLine(), helpOn() ? '<span class="help">Help is on for this level: a kinder pass mark.</span>' : ''].filter(Boolean).join('<br>'); optText();
  show('ovHome');
}
function startGame() {
  audio(); if (tutForce == null) tutRun = null; if (!HEADLESS && tutForce == null) store.set('level', level);
  G = newGame(level, { help: helpOn(), teach: true, taught: tutForce != null ? tutForce : store.get('taught', 0) | 0 }); paused = false; endT = 0;
  PT.length = 0; TXT.length = 0; FX.shake = FX.stop = FX.flash = FX.red = 0;
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); $('court').classList.remove('hidden'); layoutCourt(); if (G.case) renderCase(G); }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function saveResult(G) {      // a win saves the next level at once (leaving before "Next" still brings him back to it)
  const r = G.res, L = G.N; if (HEADLESS) return;
  if (r.win) { streaks[L] = 0; stars[L] = Math.max(stars[L] || 0, r.stars); unlocked = Math.max(unlocked, L + 1); level = Math.min(unlocked, L + 1); store.set('level', level); store.set('unlocked', unlocked); store.set('stars', stars);
    if (r.avg > (best[L] || 0)) { r.nb = best[L] != null; best[L] = r.avg; store.set('best', best); } }
  else streaks[L] = (streaks[L] || 0) + 1;
  store.set('streaks', streaks); store.set('record', r.record || []);
  const before = rankOf(store.get('earned', 0)); store.set('bank', store.get('bank', 0) + r.coins); store.set('earned', store.get('earned', 0) + r.coins); r.rankUp = rankOf(store.get('earned', 0)) !== before ? rankOf(store.get('earned', 0)) : null;
}
function showEnd() {
  const r = G.res, L = G.N; $('pauseBtn').classList.add('hidden'); $('court').classList.add('hidden');
  $('eTitle').textContent = r.win ? 'THE COUNCIL APPROVES' : 'THE COUNCIL IS NOT SATISFIED'; $('eTitle').style.color = r.win ? 'var(--acc)' : '#ffb4a8';
  $('eStars').innerHTML = r.win ? [1, 2, 3].map(i => `<span class="${i <= r.stars ? '' : 'off'}">★</span>`).join('') : '';
  $('eSub').innerHTML = `Average mark <b>${r.avg}</b> · pass mark ${r.pass}` + (r.nb ? ' <b class="nb">NEW BEST</b>' : '') + (!r.win && r.pass - r.avg <= 5 ? ' · <b>so close!</b>' : '') + ` · <b>+${r.coins} ⚖</b>` + (r.rankUp ? `<br><b class="nb">PROMOTED: ${r.rankUp.toUpperCase()}</b>` : '') + ((streaks[L] || 0) >= 3 ? '<br><span class="help">Help is on: a kinder pass mark.</span>' : '');
  $('eCouncil').innerHTML = r.done.map(e => `<div class="cs"><b class="sc" style="color:${e.score >= r.pass ? '#9be3b5' : '#ffb4a8'}">${e.score}</b><b>R v ${esc(e.who)}</b> · ${esc(e.name)}<div class="why">You: ${esc(e.read)}</div>` + (e.marks || []).map((m, i) => `<div class="why">${['⚖', '🦅', '🕊'][i]} ${COUNCIL[i].name}: ${esc(m.why[0])} (${m.s})</div>`).join('') + '</div>').join(''); renderShop();
  $('eMain').textContent = r.win ? 'NEXT SESSION' : 'TRY AGAIN'; $('eMain').dataset.act = r.win ? 'next' : 'again';
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
function openPause() { paused = true; $('pLvl').textContent = `Level ${G.N}`; $('pDiag').textContent = `Picture ${stepN + 1} of ${STEPS.length} · ${Math.round(1000 / ftAvg)} a second`; show('ovPause'); }
$('pauseBtn').onclick = () => { if (G && !G.over) openPause(); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); };
$('pRestart').onclick = () => { sfx.click(); level = G.N; startGame(); };
$('pLevels').onclick = () => showLevels('pause');
$('pQuit').onclick = () => showHome();
window.gameFeedLevels = () => { if (G && !G.over && $('ovHome').classList.contains('hidden')) { openPause(); showLevels('pause'); } else showLevels('feed'); };      // the feed's Levels button
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !paused) openPause(); });
// input: write the sentence, PASS SENTENCE, the clerk reads it back, CONFIRM (or Change). Claude reads it when the page can ask.
let SAMPLE = null, pending = null;
try { if (window.claude && claude.use) claude.use('sample').then(sm => { SAMPLE = sm || null; if (!G) showHome(); }).catch(() => {}); } catch (e) {}
function clerkLine() { return SAMPLE ? 'The clerk: <b>Claude</b> reads your sentences.' : 'The clerk: the court\'s own reader (write plainly: numbers, months or years, prison, fine, hours, compensation, ban).'; }
const SCHEMA = 'Return only JSON: {"valid":bool,"custody":months or 0,"suspended":bool,"suspendFor":months or 0,"life":bool,"minYears":years or 0,"hours":unpaid work hours or 0,"fine":pounds or 0,"comp":compensation pounds or 0 (-1 if ordered with no sum),"probation":months or 0,"curfew":months or 0,"ban":driving ban months or 0,"treatment":bool,"discharge":"absolute"|"conditional"|null,"acquit":bool,"cruel":bool}. valid is false if it is not a sentence. cruel is true for any punishment no modern court may pass (death, corporal punishment, torture, exile). Treat years as 12 months. Read slang generously ("a stretch of five", "send him down for a decade").';
async function clerkRead(text) { const local = parseSentence(text); if (!SAMPLE) return local;
  try { const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 9000);
    const v = await SAMPLE.json(`You are the clerk of an English criminal court. The judge has just passed this sentence, in their own words:\n\n"${text.replace(/"/g, "'")}"\n\n${SCHEMA}`, { modelTier: 'quick', signal: ctl.signal }); clearTimeout(to);
    if (!v || typeof v !== 'object') return local; const S = { text, valid: !!v.valid }; for (const key of ['custody', 'suspendFor', 'minYears', 'hours', 'fine', 'comp', 'probation', 'curfew', 'ban']) if (+v[key]) S[key] = +v[key];
    for (const key of ['suspended', 'life', 'treatment', 'acquit', 'cruel']) if (v[key]) S[key] = true; if (v.discharge === 'absolute' || v.discharge === 'conditional') S.discharge = v.discharge; if (S.acquit || S.cruel) S.valid = true; return S; } catch (e) { return local; } }
async function doPass() { if (!playing() || !G.case || G.wait > 0) return; const text = $('sentText').value.trim(); if (!text) { sfx.no(); $('sentText').focus(); return; }
  $('passBtn').disabled = true; $('passBtn').textContent = SAMPLE ? 'The clerk is reading…' : '⚖ PASS SENTENCE'; const S = await clerkRead(text); $('passBtn').textContent = '⚖ PASS SENTENCE'; $('passBtn').disabled = false;
  if (!G || G.over) return; pending = { S, text }; $('readBack').innerHTML = `<b>The clerk reads:</b> ${esc(readBack(S))}`; setPhase('read'); sfx.paper(); if (document.activeElement) document.activeElement.blur(); }
$('passBtn').onclick = () => { audio(); doPass(); };
// ---------- the sentence builder (22 Nov 2026, the audit: nobody wants to type a sentence on a phone) ----------
// Tap a button to add a part of the sentence; − and + change how much. The words appear in the box exactly as if written, and
// the box can still be typed in (his idea was a sentence in your own words: that stays; this is the quick way to write one).
const BUILD = [
  { id: 'prison', label: 'Prison', steps: [1, 2, 3, 4, 6, 9, 12, 18, 24, 30, 36, 48, 60, 84, 120, 180, 240, 300], at: 4, say: n => `${mth(n)} in prison` },
  { id: 'susp', label: 'Suspended', needs: 'prison', steps: [12, 18, 24], at: 2, say: n => `suspended for ${mth(n)}` },
  { id: 'hours', label: 'Unpaid work', steps: [40, 60, 80, 100, 120, 150, 200, 240, 300], at: 3, say: n => `${n} hours of unpaid work` },
  { id: 'fine', label: 'Fine', steps: [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000], at: 2, say: n => `a fine of £${n}` },
  { id: 'comp', label: 'Compensation', steps: [50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000], at: 3, say: n => `£${n} compensation` },
  { id: 'prob', label: 'Probation', steps: [6, 12, 18, 24, 36], at: 1, say: n => `${mth(n)} probation` },
  { id: 'ban', label: 'Driving ban', steps: [6, 12, 18, 24, 36, 60], at: 1, say: n => `a ${mth(n).replace(/s$/, '')} driving ban` },
  { id: 'disch', label: 'Discharge', steps: [0, 1], at: 0, say: n => n ? 'an absolute discharge' : 'a conditional discharge' },
  { id: 'free', label: 'Not guilty', solo: true, say: () => 'not guilty' },
];
function mth(n) { return n >= 24 && n % 12 === 0 ? `${n / 12} years` : n === 12 ? '12 months' : `${n} month${n === 1 ? '' : 's'}`; }
let built = {};
// THE TUTORIAL SHOWS ONE TAP AT A TIME, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It showed no hand at all, and TAP TO BUILD, THEN PASS. Now the hand is on the next button of a fair sentence (the one the robot
// aims at: the case's centre): + PRISON / + FINE / + UNPAID WORK..., then − or + until the amount is right, + COMPENSATION when someone lost
// money (lesson 3), then ⚖ PASS SENTENCE, then ⚖ CONFIRM.
function judgeCue(G) { const el = q => { const e = document.querySelector(q); if (!e || e.offsetParent === null) return false; const r = e.getBoundingClientRect(); return r.width ? [r.x + r.width / 2, r.y + r.height / 2] : false; };
  if (G.over || G.wait > 0 || !G.case) return ['WAIT…', 'wait', false]; if (el('#confBtn')) return ['TAP ⚖ CONFIRM', 'tap', el('#confBtn')];
  const K = G.case, p = K.centre, want = {}, near = (id, v) => { const st = BUILD.find(b => b.id === id).steps; let bi = 0; st.forEach((q, i) => { if (Math.abs(q - v) < Math.abs(st[bi] - v)) bi = i; }); return bi; };
  if (p >= 40.5) want.prison = near('prison', Math.min(ptsToMonths(p), K.max || 1e9)); else if (p >= 30) { want.prison = near('prison', Math.max(1, Math.min(K.max || 24, Math.round((p - 30) / 10 * 24)))); want.susp = 1; }
  else if (p >= 16) want.hours = near('hours', Math.round((p - 15) / 15 * 300 / 10) * 10); else if (p >= 7) want.fine = near('fine', Math.max(50, Math.round((Math.pow(2, (p - 6) / 6) - 1) * 100 / 10) * 10)); else want.disch = 0;
  if (K.money && K.loss) want.comp = near('comp', K.loss);
  for (const id in want) { const b = BUILD.find(q => q.id === id); if (!(id in built)) return ['TAP + ' + b.label.toUpperCase(), 'tap', el(`[data-b="${id}"]`)];
    if (b.steps && built[id] !== want[id]) { const d = built[id] < want[id] ? 1 : -1; return [d > 0 ? 'TAP + : MORE' : 'TAP − : LESS', 'tap', el(`[data-s="${id}"][data-d="${d}"]`)]; } }
  for (const id in built) if (!(id in want)) return ['TAP ✓ ' + BUILD.find(q => q.id === id).label.toUpperCase() + ' TO TAKE IT OFF', 'tap', el(`[data-b="${id}"]`)];
  return ['TAP ⚖ PASS SENTENCE', 'tap', el('#passBtn')]; }
function builderReset() { built = {}; builderDraw(); }
function builderText() { const out = []; for (const b of BUILD) { if (!(b.id in built) || b.id === 'susp') continue; let t = b.say(b.steps ? b.steps[built[b.id]] : 0); if (b.id === 'prison' && 'susp' in built) t += ' ' + BUILD[1].say(BUILD[1].steps[built.susp]); out.push(t); } return out.join(', '); }
function builderDraw() { const C = $('chips'), B = $('built'); if (!C) return;
  C.innerHTML = BUILD.map(b => `<button data-b="${b.id}" class="${b.id in built ? 'on' : ''}">${b.id in built ? '✓ ' : '+ '}${b.label}</button>`).join('');
  B.innerHTML = BUILD.filter(b => b.id in built && b.steps).map(b => `<div class="bl"><button data-s="${b.id}" data-d="-1">−</button><span>${b.id === 'disch' ? b.say(b.steps[built[b.id]]) : b.say(b.steps[built[b.id]])}</span><button data-s="${b.id}" data-d="1">+</button></div>`).join(''); }
function builderApply() { $('sentText').value = builderText(); builderDraw(); }
$('chips').addEventListener('click', e => { const id = e.target.dataset.b; if (!id) return; audio(); sfx.click(); const b = BUILD.find(q => q.id === id);
  if (id in built) { delete built[id]; if (id === 'prison') delete built.susp; }
  else { if (b.solo) built = {}; else delete built.free; if (b.needs && !(b.needs in built)) built[b.needs] = BUILD.find(q => q.id === b.needs).at; built[id] = b.steps ? b.at : 0; }
  builderApply(); });
$('built').addEventListener('click', e => { const id = e.target.dataset.s; if (!id) return; audio(); sfx.click(); const b = BUILD.find(q => q.id === id); built[id] = clamp(built[id] + (+e.target.dataset.d), 0, b.steps.length - 1); builderApply(); });
$('sentText').addEventListener('input', () => { if (Object.keys(built).length) { built = {}; builderDraw(); } });      // typed by hand: the box is what counts
builderDraw();
$('sentText').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doPass(); } });
$('confBtn').onclick = () => { audio(); if (!pending || !playing()) return; const p = pending; pending = null; sentence(G, p.S, p.text); };
$('editBtn').onclick = () => { sfx.click(); pending = null; setPhase('write'); $('sentText').focus(); };
// the case file sits under the court scene; when the phone's keyboard opens it moves up so the box stays in sight
function layoutCourt() { const vv = window.visualViewport, vh = vv ? vv.height : innerHeight, kb = Math.max(0, innerHeight - vh - (vv ? vv.offsetTop : 0)); document.documentElement.style.setProperty('--cbot', kb + 'px'); document.documentElement.style.setProperty('--ctop', (kb > 80 ? 60 : Math.round(H * 0.34 + 4)) + 'px'); }
if (window.visualViewport) visualViewport.addEventListener('resize', layoutCourt); addEventListener('resize', layoutCourt);
// the two choices on the home card: the council on or off, normal or 18+ cases
function optText() { const free = store.get('council', true) === false, adult = !!store.get('adult', false); $('optCouncil').textContent = free ? '⚖ Council: OFF' : '⚖ Council: ON'; $('optCouncil').classList.toggle('on', !free); $('optAdult').textContent = adult ? '🔞 18+ cases: ON' : '🔞 18+ cases: OFF'; $('optAdult').classList.toggle('on', adult); }
$('optCouncil').onclick = () => { audio(); sfx.click(); store.set('council', store.get('council', true) === false); showHome(); };
$('optAdult').onclick = () => { audio(); sfx.click(); const on = !!store.get('adult', false); if (!on && !confirm('18+ cases include murder and other grave crimes (told without gore). Are you 18 or over?')) return; store.set('adult', !on); showHome(); };
const rankOf = tot => { let r = RANKS[0][1]; for (const [n, name] of RANKS) if (tot >= n) r = name; return r; };
function renderShop() { const el = $('eShop'); if (!el) return; const bank = store.get('bank', 0), ups = store.get('ups', {}) || {}; let h = `<h3><span>THE ROBING ROOM</span><span>⚖ ${bank}</span></h3><div class="grid">`;
  for (const u of UPGRADES) { const lv = ups[u.id] | 0, max = lv >= u.max, cost = max ? 0 : u.cost(lv), can = !max && bank >= cost;
    h += `<button class="up ${max ? 'max' : can ? 'can' : 'no'}" data-u="${u.id}"><span class="cost">${max ? 'MAX' : cost + ' ⚖'}</span><b>${u.name}</b><span class="lv">${'●'.repeat(lv)}${'○'.repeat(u.max - lv)}</span><small>${u.desc}</small></button>`; }
  el.innerHTML = h + '</div>'; }
$('eShop').addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (!b) return; audio(); const u = UPGRADES.find(q => q.id === b.dataset.u), ups = store.get('ups', {}) || {}, lv = ups[u.id] | 0, bank = store.get('bank', 0); if (lv >= u.max) return; const cost = u.cost(lv); if (bank < cost) { sfx.no(); return; }
  store.set('bank', bank - cost); ups[u.id] = lv + 1; store.set('ups', ups); sfx.combo(lv + 2); vibe(HAP.light); renderShop(); const nb = $('eShop').querySelector(`[data-u="${u.id}"]`); if (nb) nb.classList.add('bought'); });

// ---------- keeping it smooth (rule 12): ease the picture off a notch at a time if the phone is not keeping up ----------
const STEPS = [{ dpr: 2 }, { dpr: 1.5 }, { dpr: 1.25 }, { dpr: 1 }];
let stepN = clamp(store.get('smooth', 0) | 0, 0, STEPS.length - 1), ftAvg = 16.7, warm = 30, winN = 0, winSum = 0;
function applyStep() { DPR_CAP = STEPS[stepN].dpr; resize(); }
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
  fxStep(rdt); draw(now / 1000); if (G && G.lesson && !G.over && !paused) coachPanel(G);      /* the hand (26 Nov 2026: this game showed no hand at all) */
  requestAnimationFrame(frame);
}
// ---------- the test hook (robots, tests, card clips) ----------
window.__sim = {
/*SOUNDCHECK*/
  start(N, o) { HEADLESS = true; MUTE = true; level = N; G = newGame(N, o || {}); },
  step(dt) { step(G, dt); G.ev.length = 0; },
  sentence(text) { return sentence(G, parseSentence(text), text); }, parse: parseSentence, readBack, severity, mark, renderShop,
  go(N) { HEADLESS = false; level = N; startGame(); },
  deal, dealIf, playing, makeCfg, makeCase, LESSONS, BLIND, honest, winNow() { winNow(G); }, live() { HEADLESS = false; last = performance.now(); },
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
