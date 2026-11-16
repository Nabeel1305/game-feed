
// ===================== PART 8: screens, thumbs, the loop =====================
let G = null, LIVE = null, paused = false, endT = -1, sightUp = false, lootRun = 0;
const WATERS = ['The Windward Passage', 'Tortuga Shoals', 'The Spanish Main', 'Port Royal Roads', 'Nassau Banks', 'The Mona Passage', 'Cape Fear', 'The Dry Tortugas', 'Hispaniola', 'The Mosquito Coast', 'Barbary Shore', 'The Skeleton Coast', 'Madagascar', 'The Malabar Coast', 'The Gulf of Guinea', "Devil's Reach", 'Saint Kitts', 'Maracaibo', 'Cartagena', 'Havana Roads', 'The Serpent Cays', 'Blackwater Sound', 'The Bay of Campeche', 'Santo Domingo', 'The Leeward Isles', 'Cape Verde', 'The Azores Run', 'Zanzibar', 'The Coromandel Coast', 'The Strait of Malacca', 'The Sulu Sea', 'Hangman\'s Reef', 'The Wreckers\' Coast'];
const watersOf = N => N % 10 === 0 ? 'The treasure fleet' : WATERS[(N - 1) % WATERS.length];
function show(id) { ['ovHome', 'ovRules', 'ovLevels', 'ovEnd', 'ovPause'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }
function savedLevel() { level = Math.min(Math.max(1, store.get('level', 1) | 0), unlocked); }
const helpOn = () => (streaks[level] || 0) >= 3;
const playing = () => !!G && G.phase !== 'home' && !G.over;
function clearFx() { FXS.length = 0; TXT.length = 0; WAKE.length = 0; TRAIL.length = 0; banner = null; hint = null; shake = 0; hitstop = 0; hurtFlash = 0; INP.tip = null; ptrs.clear(); }
function sightCard(on) { sightUp = on; $('ovSight').classList.toggle('hidden', !on); }
function showHome() {
  savedLevel(); paused = false; endT = -1; sightCard(false); clearFx();
  G = newExp(level, {}); G.phase = 'home'; G.nextSight = 1e9; LIVE = G; CAM.x = G.me.x; CAM.y = G.me.y; CAM.a = 0; CAM.z = k * 2.2; seaMood = 0;
  $('pauseBtn').classList.add('hidden');
  const r = rankOf(gold), c = G.cfg;
  $('hLvl').textContent = level; $('hWhere').textContent = watersOf(level);
  $('hRank').innerHTML = `<b>${r.name}</b>` + (r.next ? ` · ${fmtG(r.next[0] - gold)} gold to ${r.next[1]}` : ''); $('hBar').style.width = (r.next ? clamp((gold - r.from) / (r.next[0] - r.from), 0, 1) * 100 : 100) + '%';
  $('hStat').innerHTML = [gold ? `Plunder: <b>${fmtG(gold)}</b>` : 'Find a ship. Take her. Count the gold.', bestHaul ? `Best haul: <b>${fmtG(bestHaul)}</b>` : '', prizes ? `Ships taken: <b>${prizes}</b>` : ''].filter(Boolean).join(' · ') + (helpOn() ? '<br><span class="help">Help is on: their blows and their broadsides come a little slower until you get through.</span>' : '');
  show('ovHome');
}
function startExp(mini) {
  audio();
  if (!HEADLESS) store.set('level', level);
  clearFx(); sightCard(false); endT = -1; paused = false;
  G = newExp(level, { help: helpOn(), teach: true, taught: store.get('taught', 0) | 0 }); LIVE = G; if (mini) G.nextSight = Math.min(G.nextSight, 1.1);
  CAM.x = G.me.x; CAM.y = G.me.y + 22; CAM.a = 0; CAM.z = k * 2.2; seaMood = 0; MUS.want = 'calm';
  if (!HEADLESS) { $('pauseBtn').classList.remove('hidden'); show(null); if (level <= 2) { hint = { key: 'steer', txt: 'Slide your left thumb to steer', t: 0, secs: 3, y: H * 0.8 }; } }
  last = performance.now(); warm = 30; winN = 0; winSum = 0;
}
function fillSight() {
  const S = G.sight, P = G.prize, last = G.passes <= 0;
  const nv = S.navy, n = S.ships.length; $('sTitle').textContent = n === 1 ? (/^[AEIOU]/.test(S.ships[0].K.cls) ? 'An ' : 'A ') + S.ships[0].K.cls.toLowerCase().replace('navy', 'navy').replace('indiaman', 'Indiaman') : nv === n ? 'A navy squadron' : nv ? 'A convoy under escort' : 'A convoy';
  $('sShips').innerHTML = S.ships.map(s => `<div class="ship ${s.K.navy ? 'navy' : 'merch'}"><div class="k">${s.K.navy ? 'NAVY' : 'MERCHANT'}</div><div class="n">${s.K.cls}</div><div class="g">${fmtG(s.loot)} gold</div><div class="d">${s.K.guns ? s.K.guns * 2 + ' guns' : 'no guns'}</div></div>`).join('');
  $('sLoot').textContent = '●'.repeat(S.coins) + '○'.repeat(5 - S.coins); $('sDanger').textContent = '●'.repeat(S.skulls) + '○'.repeat(5 - S.skulls);
  $('sSub').innerHTML = (S.navy ? `Beat ${S.navy > 1 ? 'their guns' : 'her guns'} first, then board the <b>${P.info.name}</b>.` : `Run her down and board the <b>${P.info.name}</b>.`) + (G.N === 1 ? '<br>A lone trader: easy pickings.' : G.N === 2 ? '<br>Keep out of the red in front of her guns.' : last && !G.cfg.boss ? '<br>The crew will not sail past another.' : G.cfg.boss ? '<br>The treasure fleet. There will not be another.' : '');
  $('passBtn').classList.toggle('hidden', last); $('passBtn').innerHTML = last ? '' : `Sail on<small>${G.passes} left</small>`;
}
$('raidBtn').onclick = () => { if (G && G.phase === 'sight') { audio(); G.choice = 'raid'; sightCard(false); } };
$('passBtn').onclick = () => { if (G && G.phase === 'sight' && G.passes > 0) { audio(); G.choice = 'pass'; sightCard(false); } };

// ---------- the end of an expedition ----------
function finish() {
  if (G.done) return; G.done = true; const N = G.N, win = G.over === 'won', res = { win, N };
  if (!HEADLESS) { streaks[N] = win ? 0 : (streaks[N] || 0) + 1; store.set('streaks', streaks); }
  if (win) {
    const h = haulOf(G); res.haul = h; res.stars = starsOf(G); res.rank0 = rankOf(gold); res.nb = h.total > bestHaul && bestHaul > 0; res.chain = G.bestChain || 0; res.nbChain = res.chain > bestChain && res.chain >= 3;
    if (!HEADLESS) {
      stars[N] = Math.max(stars[N] || 0, res.stars); store.set('stars', stars); unlocked = Math.max(unlocked, N + 1); store.set('unlocked', unlocked);
      store.set('level', N + 1);                               // he comes back to the next expedition, even if he leaves before pressing NEXT
      gold += h.total; store.set('gold', gold); if (h.total > bestHaul) { bestHaul = h.total; store.set('bestHaul', bestHaul); } prizes += G.foes.length; store.set('prizes', prizes); if (res.chain > bestChain) { bestChain = res.chain; store.set('bestChain', bestChain); }
    }
    res.rank1 = rankOf(gold + (HEADLESS ? h.total : 0));
  } else {
    res.why = G.phase === 'board' ? 'broken' : 'sunk';
    if (res.why === 'sunk') { const left = G.foes.filter(s => s.K.navy && s.alive && !s.struck), worst = left.sort((a, b) => a.hull / a.hull0 - b.hull / b.hull0)[0]; res.near = worst ? `The ${worst.info.name} had <b>${Math.round(worst.hull / worst.hull0 * 100)}%</b> of her hull left${left.length > 1 ? ', and ' + (left.length - 1) + ' more stood off' : ''}.` : ''; }
    else { const F = G.fight; const pk = Math.round(clamp((F.peak - 0.5) / 0.5, 0, 1) * 100), far = pk > 4 ? `At your best you were <b>${pk}%</b> of the way to taking ` : 'They never gave ground '; res.near = F.stage === 0 ? far + (pk > 4 ? 'the deck.' : 'on deck.') : F.stage === 1 ? 'You had taken the deck. ' + far + (pk > 4 ? 'the deck below.' : 'below.') : `You had the deck and below. ${F.capt} ${F.man && F.man.capt ? 'had <b>' + Math.round(F.man.hp / F.man.hp0 * 100) + '%</b> of his fight left' : 'held his cabin'}.`; res.stage = F.stage; }
  }
  G.res = res; endT = win ? 1.0 : 0.5;
}
function showEnd() {
  const res = G.res, N = G.N, my = ++lootRun; $('pauseBtn').classList.add('hidden'); sightCard(false);
  $('eTitle').textContent = res.win ? (G.cfg.boss ? 'Treasure taken!' : 'Plundered!') : res.why === 'sunk' ? 'Sunk' : 'Driven off'; $('eTitle').style.color = res.win ? '#ffd166' : '#ffb4a8';
  $('eStars').innerHTML = res.win ? [1, 2, 3].map(i => `<span class="off" id="st${i}">★</span>`).join('') : '';
  const mast = $('eMast'); mast.classList.toggle('hidden', !res.win); mast.classList.remove('go'); if (res.win) { $('eTheirs').style.background = G.prize.K.navy ? '#b3271f' : '#2f6a4a'; setTimeout(() => { if (my === lootRun) mast.classList.add('go'); }, 60); }
  const helpLine = !res.win && (streaks[N] || 0) >= 3 ? '<br><span class="help">Help is on: their blows and broadsides will come a little slower until you get through.</span>' : '';
  if (res.win) {
    const h = res.haul; $('eLoot').innerHTML = h.lines.map(l => `<li><span>${l[0]}</span><b>${fmtG(l[1])}</b></li>`).join('') + `<li class="tot"><span>The haul</span><b>${fmtG(h.total)}</b></li>`;
    const r1 = res.rank1, up = r1.i > res.rank0.i;
    $('eSub').innerHTML = (res.nb ? '<b class="nb">YOUR BEST HAUL YET</b><br>' : '') + (up ? `<b class="nb">You are now ${/^[AEIOU]/.test(r1.name) ? 'an' : 'a'} ${r1.name}</b>` : `${r1.name}` + (r1.next ? ` · ${fmtG(Math.max(0, r1.next[0] - gold))} gold to ${r1.next[1]}` : '')) +
      (res.chain >= 3 ? `<br>Clean blocks in a row: <b>${res.chain}</b>${res.nbChain ? ' <b class="nb">NEW BEST</b>' : ''}` : '') + (res.stars < 3 ? '<br>Take fewer wounds and less shot for three stars.' : '');
    const lis = [...$('eLoot').children]; lis.forEach((li, i) => setTimeout(() => { if (my !== lootRun) return; li.classList.add('in'); if (i === lis.length - 1) { sfx.fanfare(); vibe(HAP.best); } else { sfx.coin(i); vibe(HAP.tick); } }, 350 + i * 300));
    for (let i = 1; i <= res.stars; i++) setTimeout(() => { if (my !== lootRun) return; const e = $('st' + i); if (e) e.classList.remove('off'); sfx.star(i - 1); }, 350 + lis.length * 300 + i * 220);
  } else {
    $('eLoot').innerHTML = '';
    const tipTxt = res.why === 'sunk' ? 'Her guns only reach out from her sides, in the red. Get on her bow or her stern, close, and turn faster than she can.' : res.stage === 2 ? 'Block him clean (swipe across his blade late), then stab while he is off balance. Pull down for his red blows.' : 'Swipe across each blade as it comes, on the side it comes from. A late, clean block opens him up.';
    $('eSub').innerHTML = `${res.near} ${tipTxt}` + helpLine;
  }
  $('eMain').textContent = res.win ? 'NEXT EXPEDITION' : 'TRY AGAIN'; $('eMain').dataset.act = res.win ? 'next' : 'again';
  $('eAlt').classList.toggle('hidden', !res.win);
  endShown = performance.now(); show('ovEnd');
}
$('playBtn').onclick = () => { audio(); sfx.tap(); startExp(false); };
// The feed's instant start (a tap on its card in the Game Feed app): the expedition he was on, his hand on the wheel at once, and the lookout's call a moment later.
window.gameFeedStart = () => { savedLevel(); audio(); startExp(true); };
$('rulesBtn').onclick = () => { sfx.tap(); show('ovRules'); };
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => {
  const lv = !$('ovLevels').classList.contains('hidden');
  if (lv && lvFrom === 'pause' && playing()) openPause(); else if (lv && lvFrom === 'feed' && lvUnder) show(lvUnder); else showHome();
});
let lvFrom = 'home', lvUnder = null;
function showLevels(from) {
  lvFrom = from || 'home';
  lvUnder = ['ovHome', 'ovEnd'].find(key => !$(key).classList.contains('hidden')) || null;
  const top = Math.ceil((unlocked + 5) / 5) * 5; let h = '';
  for (let L = 1; L <= top; L++) { const lock = L > unlocked, st = stars[L] || 0; h += `<button class="lvb${L % 10 === 0 ? ' boss' : ''}${L === level ? ' cur' : ''}${lock ? ' lock' : ''}" data-l="${L}" ${lock ? 'disabled' : ''}>${lock ? '🔒' : L}<small>${lock ? '' : '★'.repeat(st)}</small></button>`; }
  $('lvGrid').innerHTML = h;
  $('lvSub').textContent = unlocked > 1 ? `${unlocked - 1} expedition${unlocked === 2 ? '' : 's'} sailed. Every tenth is a treasure fleet.` : 'Take your first prize to open the next expedition.';
  show('ovLevels');
}
$('levelsBtn').onclick = () => { sfx.tap(); showLevels('home'); };
$('eLevels').onclick = () => { showLevels('home'); };
$('lvGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-l]'); if (!b || b.disabled) return;
  level = +b.dataset.l; store.set('level', level);
  if (lvFrom === 'home') showHome(); else { sfx.tap(); startExp(false); }      // picked from the pause menu: that expedition starts at once
});
$('eMain').onclick = () => { lootRun++; if ($('eMain').dataset.act === 'next') level = Math.min(unlocked, level + 1); startExp(false); };
$('eAlt').onclick = () => { lootRun++; startExp(false); };
let endShown = 0;
$('ovEnd').addEventListener('click', e => { if (e.target.closest('button') || !G || !G.res || G.res.win || performance.now() - endShown < 350) return; lootRun++; startExp(false); });      // after a loss, a tap anywhere tries again
function sndIcon() { $('sndBtn').textContent = MUTE ? '🔇' : '🔊'; }
MUTE = !!store.get('mute', false);
$('sndBtn').onclick = () => { audio(); setMute(!MUTE); store.set('mute', MUTE); sndIcon(); if (!MUTE) sfx.tap(); };
sndIcon();
// ---------- pause menu: resume, restart this expedition, or pick a lower one (the same in every game) ----------
const PHASE_N = { sail: 'looking for a sail', sight: 'a sail in sight', battle: 'the cannon battle', chase: 'the chase', close: 'coming alongside', grapple: 'boarding', board: 'the boarding fight', sunk: 'sinking' };
function openPause() {
  paused = true; ptrs.clear(); INP.tip = null; if (G) { G.in.fire = false; G.in.rud = 0; G.in.held = false; if (G.fight) { G.fight.aim = null; fReload(G, false); } }
  $('pLvl').textContent = `Expedition ${G.N} · ${watersOf(G.N)} · ${G.phase === 'board' ? STAGE_N[G.fight.stage].toLowerCase() : PHASE_N[G.phase] || ''}`;
  $('pDiag').textContent = `Picture ${stepN + 1} of ${STEPS.length} · ${Math.round(1000 / ftAvg)} a second${half && vsync < 12.5 ? ' (halved)' : ''} · ${SEAGL ? 'fast' : 'plain'} sea${vsync < 15 ? ' · screen ' + Math.round(1000 / vsync) : ''}${stuck ? ' · fixed' : ''}`;      // if he says it lags, ask him to read this line out (LESSONS, rule 12)
  sightCard(false); show('ovPause');
}
$('pauseBtn').onclick = () => { if (playing()) openPause(); };
$('pResume').onclick = () => { paused = false; show(null); last = performance.now(); if (G && G.phase === 'sight') { fillSight(); sightCard(true); } };
$('pRestart').onclick = () => { sfx.tap(); startExp(false); };
$('pLevels').onclick = () => showLevels('pause');
$('pQuit').onclick = () => showHome();
window.gameFeedLevels = () => { if (playing()) { openPause(); showLevels('pause'); } else showLevels('feed'); };
document.addEventListener('visibilitychange', () => { if (document.hidden && playing() && !paused) openPause(); });

// ---------- thumbs ----------
// The sea: the left half of the screen is the wheel (slide left and right from wherever the thumb lands), the right half is FIRE.
// Boarding: the whole screen is your blade (swipe = slice or block, tap = stab, pull down low = dodge); the round button is the pistol.
const ptrs = new Map();
const SEA_PH = { sail: 1, sight: 1, battle: 1, chase: 1, close: 1 };
cv.addEventListener('pointerdown', e => {
  audio(); if (G && G.over && endT >= 0 && !paused) { endT = -1; showEnd(); return; }      // a tap skips the last moment
  if (!playing() || paused) return; const x = e.clientX, y = e.clientY;
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  if (G.phase === 'board') {
    const F = G.fight, B = pistolBtn();
    if (Math.hypot(x - B.x, y - B.y) <= B.r * 1.3) { if (F.loaded) { if (fAim(G, x, y)) ptrs.set(e.pointerId, { kind: 'aim' }); } else if (G.shots > 0) { fReload(G, true); if (F.reloading) ptrs.set(e.pointerId, { kind: 'load' }); } else if (gate('nopistol', 800)) { sfx.empty(); say('NO MORE BALLS', B.x - 30 * k, B.y - 60 * k, '#cfd8dc', 16); } return; }
    if ([...ptrs.values()].some(p => p.kind === 'blade')) return;
    ptrs.set(e.pointerId, { kind: 'blade', x0: x, y0: y, t0: performance.now(), fired: false }); INP.tip = { x, y };
  } else if (SEA_PH[G.phase]) {
    if (x < W * 0.5) { for (const [id, p] of ptrs) if (p.kind === 'wheel') ptrs.delete(id); ptrs.set(e.pointerId, { kind: 'wheel', x0: x - G.in.rud * 56 * k, y0: y }); G.in.held = true; }
    else if (G.phase !== 'sail' && Math.hypot(x - (W - 70 * k), y - (H - 196 * k)) <= 40 * k || G.phase === 'sail' && x > W * 0.5) { ptrs.set(e.pointerId, { kind: 'oars' }); G.in.row = true; }
    else { ptrs.set(e.pointerId, { kind: 'fire' }); G.in.fire = true; }
  }
});
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p || !G) return; const x = e.clientX, y = e.clientY;
  if (p.kind === 'wheel') { G.in.rud = clamp((x - p.x0) / (56 * k), -1, 1); p.x = x; }
  else if (p.kind === 'aim') fAimMove(G, x, y);
  else if (p.kind === 'blade') { INP.tip = { x, y }; if (!p.fired && Math.hypot(x - p.x0, y - p.y0) > 115 * fu() && performance.now() - p.t0 < 700) { p.fired = true; fStroke(G, p.x0, p.y0, x, y); } }      // a long swipe counts as soon as it is long enough
});
function endPtr(e) {
  const p = ptrs.get(e.pointerId); if (!p) return; ptrs.delete(e.pointerId); if (!G) return; const x = e.clientX, y = e.clientY;
  if (p.kind === 'wheel') { G.in.held = false; G.in.rud = 0; }
  else if (p.kind === 'fire') G.in.fire = false;
  else if (p.kind === 'oars') G.in.row = false;
  else if (p.kind === 'aim') fFire(G);
  else if (p.kind === 'load') fReload(G, false);
  else if (p.kind === 'blade') { INP.tip = null; if (p.fired || paused) return; const d = Math.hypot(x - p.x0, y - p.y0), dt = performance.now() - p.t0; if (d < 22 * Math.max(1, fu()) && dt < 400) fPoke(G, p.x0, p.y0); else if (dt < 700) fStroke(G, p.x0, p.y0, x, y); }
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', e => { const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!p || !G) return; if (p.kind === 'wheel') { G.in.held = false; G.in.rud = 0; } else if (p.kind === 'fire') G.in.fire = false; else if (p.kind === 'oars') G.in.row = false; else if (p.kind === 'aim') { if (G.fight) G.fight.aim = null; } else if (p.kind === 'load') fReload(G, false); else INP.tip = null; });
const KEYS = {};
addEventListener('keydown', e => {      // a laptop: arrows steer and swing, space fires or stabs, P the pistol
  if (!playing() || paused || e.repeat) return; audio(); const c = e.code; KEYS[c] = true;
  if (G.phase === 'board') { const F = G.fight, g = manGeo(F), Y = YOU(), r = W * 0.2;
    if (c === 'ArrowLeft') fStroke(G, Y.x + r, Y.y - 90, Y.x - r, Y.y - 60); else if (c === 'ArrowRight') fStroke(G, Y.x - r, Y.y - 90, Y.x + r, Y.y - 60); else if (c === 'ArrowUp') fStroke(G, Y.x - r, Y.y - 140, Y.x + r, Y.y - 150); else if (c === 'ArrowDown') fDodge(G);
    else if (c === 'Space') { fPoke(G, g.chest.x, g.chest.y); e.preventDefault(); } else if (c === 'KeyP') { if (F.loaded) fAim(G, W / 2, H / 2); else fReload(G, true); } }
  else if (c === 'Space') { G.in.fire = true; e.preventDefault(); }
});
addEventListener('keyup', e => { const c = e.code; KEYS[c] = false; if (!G) return; if (c === 'Space') G.in.fire = false; if (c === 'KeyP' && G.fight) { if (G.fight.aim) fFire(G); else fReload(G, false); } });

// ---------- what is on the screen at sea besides the sea ----------
function seaHud() {
  const me = G.me, u = clamp(me.hull / 100, 0, 1), x = 14, y = 17, w = 112 * k, h = 11, ph = G.phase;
  ctx.fillStyle = 'rgba(3,10,14,.55)'; rrect(x - 3, y - 3, w + 6, h + 6, 6); ctx.fill(); ctx.fillStyle = u > 0.5 ? '#7fd6a0' : u > 0.25 ? '#ffb347' : '#ff6e5a'; ctx.fillRect(x, y, w * u, h);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(11 * k)}px ${BC}`; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText('YOUR HULL', x, y + h + 11);
  // how far through the expedition: the sea, the deck, below, the cabin
  ctx.textAlign = 'right'; const px = W - 14; ctx.fillText(ph === 'sail' ? 'LOOKING FOR A SAIL' : ph === 'battle' ? 'BEAT HER GUNS' : ph === 'chase' ? 'RUN HER DOWN' : ph === 'close' ? 'COME ALONGSIDE' : '', px, y + h + 11);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i === 0 ? '#e9b949' : 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.arc(px - 6 - (3 - i) * 15, y + 5, 4.5, 0, TAU); ctx.fill(); }
  if (!SEA_PH[ph] || ph === 'sight' || paused) return;
  // the wheel (left) and FIRE (right)
  let wp = null; for (const p of ptrs.values()) if (p.kind === 'wheel') wp = p;
  const wx = wp ? clamp(wp.x0, 60 * k, W * 0.5 - 20) : 70 * k, wy = wp ? clamp(wp.y0, H * 0.3, H - 60 * k) : H - 86 * k, r = 40 * k;
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(wx, wy, r, 0, TAU); ctx.stroke();
  ctx.save(); ctx.translate(wx, wy); ctx.rotate(me.rud * 1.1); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-r - 6 * k, 0); ctx.lineTo(r + 6 * k, 0); ctx.stroke(); } ctx.fillStyle = '#e9b949'; ctx.beginPath(); ctx.arc(0, -r, 5 * k, 0, TAU); ctx.fill(); ctx.restore();
  if (wp) { ctx.fillStyle = 'rgba(233,185,73,.85)'; ctx.beginPath(); ctx.arc(wx + G.in.rud * 56 * k, wy, 13 * k, 0, TAU); ctx.fill(); }
  { // ROW: hold for a burst of speed; the ring is the crew's breath
    const ox = W - 70 * k, oy = ph === 'sail' ? H - 86 * k : H - 196 * k, orr = 30 * k, st = G.stam == null ? 1 : G.stam;
    ctx.fillStyle = G.rowing ? 'rgba(127,214,160,.7)' : 'rgba(3,10,14,.5)'; ctx.beginPath(); ctx.arc(ox, oy, orr, 0, TAU); ctx.fill();
    ctx.strokeStyle = G.tired ? 'rgba(255,140,120,.8)' : '#9be3b5'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ox, oy, orr + 4 * k, -Math.PI / 2, -Math.PI / 2 + TAU * st); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.round(14 * k)}px ${BC}`; ctx.fillStyle = G.tired ? 'rgba(255,190,180,.9)' : 'rgba(255,255,255,.9)'; ctx.fillText(G.tired ? 'TIRED' : 'ROW', ox, oy + 1); }
  if (ph === 'sail') return;
  const fx0 = W - 70 * k, fy0 = H - 86 * k, fr = 46 * k, lit = G.lit[0] || G.lit[1], ease = !lit && (G.inArc[0] || G.inArc[1]), pu = 0.5 + 0.5 * Math.sin(VT * 9);
  ctx.fillStyle = lit ? `rgba(233,185,73,${0.75 + 0.2 * pu})` : 'rgba(3,10,14,.5)'; ctx.beginPath(); ctx.arc(fx0, fy0, fr, 0, TAU); ctx.fill();
  ctx.strokeStyle = lit ? '#fff3c4' : ease ? `rgba(233,185,73,${0.5 + 0.5 * pu})` : 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; if (ease) ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(fx0, fy0, fr, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  if (ease) { ctx.textAlign = 'center'; ctx.font = `700 ${Math.round(12 * k)}px ${BC}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(3,10,14,.7)'; ctx.strokeText('LET THE WHEEL GO', fx0, fy0 - fr - 22 * k); ctx.fillStyle = '#ffe9b0'; ctx.fillText('LET THE WHEEL GO', fx0, fy0 - fr - 22 * k); tip('ease', 'Let go of the wheel, then FIRE when it lights', 3); }
  for (let s = 0; s < 2; s++) { const ld = me.load[s], a0 = s ? -Math.PI / 2 + 0.25 : Math.PI / 2 + 0.25, a1 = a0 + (Math.PI - 0.5) * (ld <= 0 ? 1 : clamp(1 - ld / G.cfg.myReload, 0, 1)); ctx.strokeStyle = ld <= 0 ? '#ffd166' : 'rgba(255,255,255,.6)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(fx0, fy0, fr + 8 * k, a0, a1); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(26 * k)}px ${PO}`; ctx.fillStyle = lit ? '#2a1a02' : 'rgba(255,255,255,.75)'; ctx.fillText('FIRE', fx0, fy0 + 1);
}

// ---------- keeping it smooth (LESSONS rule 12): the game times its own frames and eases the picture off, a notch at a time, on a phone that is not keeping up ----------
const STEPS = [{ q: 0.85, dpr: 2, pt: 260 }, { q: 0.7, dpr: 1.5, pt: 200 }, { q: 0.55, dpr: 1.25, pt: 150 }, { q: 0.45, dpr: 1, pt: 110 }];      // q: the size the sea is painted at (1 = one dot for each of the page's dots); dpr: the sharpness of everything else; pt: sparks and smoke at once
let stepN = 0, half = 0, stuck = false, vsync = 16.7, ftAvg = 16.7, warm = 30, winN = 0, winSum = 0, trial = '', before = 0, dead = 0, unsaved = false, draws = 0;
const GAPS = new Float32Array(90); let gapN = 0;
function applyStep() { const st = STEPS[stepN]; QUAL = st.q; DPR_CAP = st.dpr; PT_MAX = st.pt; resize(); }
let visits = 1, wait = 5;
function setPace() { applyStep(); store.set('smooth', stepN); store.set('half', half); store.set('flat', stuck ? 1 : 0); store.set('next', visits + wait); warm = 20; winN = 0; winSum = 0; }
(() => {
  visits = (store.get('visits', 0) | 0) + 1; store.set('visits', visits); wait = clamp(store.get('wait', 5) | 0, 5, 80);
  stepN = clamp(store.get('smooth', 0) | 0, 0, STEPS.length - 1); half = store.get('half', 0) ? 1 : 0; stuck = !!store.get('flat', 0);
  if ((stepN > 0 || half || stuck) && visits >= (store.get('next', visits + 1) | 0)) {      // now and then an eased-off phone is tried one notch finer again
    unsaved = stepN > 0 || !!half; stuck = false; if (stepN > 0) stepN--; else half = 0;
    store.set('next', visits + wait); wait = Math.min(wait * 2, 80); store.set('wait', wait);
  }
})();
function lowGap() {
  const n = Math.min(gapN, GAPS.length), a = Array.from(GAPS.subarray(0, n)).sort((x, y) => x - y), lo = a[Math.floor(n * 0.15)], mid = a[n >> 1];
  let fit = 0; for (const g of a) if (Math.abs(g - Math.max(1, Math.round(g / lo)) * lo) < lo * 0.12) fit++;
  return clamp(fit >= n * 0.85 ? lo : mid, 5.5, 50);
}
function measure(ms, fast) {
  if (ms > 250) { warm = 20; return; }
  ftAvg += (Math.min(ms, 120) - ftAvg) * 0.06;
  if (warm > 0) { warm--; return; }
  const want = half && fast ? vsync * 2 : vsync;
  winSum += Math.min(ms, want * 6); winN++;
  let avg = winSum / winN; const limit = half && fast ? want * 1.18 : Math.min(want * 1.18, 21);
  if (winN < 30 || (winN < 60 && avg < limit * 1.35)) return;
  winN = 0; winSum = 0;
  if (stuck) return;
  if (avg <= limit) { trial = ''; dead = 0; if (unsaved) { unsaved = false; wait = 5; store.set('wait', 5); setPace(); } return; }
  unsaved = false;
  if (trial === 'S') { if (avg > before * 0.93 && before < want * 5.4) { stepN--; avg = before; if (++dead >= 2) { stuck = true; trial = ''; setPace(); return; } } else dead = 0; }
  if (fast && !half && (vsync < 9.5 || stepN >= 1 || trial === 'S')) { half = 1; stepN = 0; trial = 'H'; dead = 0; }
  else if (stepN < STEPS.length - 1) { stepN++; trial = 'S'; before = avg; }
  else { stuck = true; trial = ''; }
  setPace();
}
// ---------- the loop ----------
function events() { for (const e of G.ev) { if (e.k === 'parry') G.bestChain = Math.max(G.bestChain || 0, e.chain); if (HEADLESS) continue; if (G.phase === 'board' && e.k !== 'phase') fightEvent(G, e); else seaEvent(G, e); } G.ev.length = 0; }
function tick(dt, rdt) {
  if (G.phase === 'home') { const me = G.me; me.rud = 0.3 * Math.sin(VT / 2.6); sail(me, rdt); G.t += rdt; camStep(G, rdt); CAM.zt = CAM.z = k * 2.2; wakeStep(G, rdt); fxStep(rdt); return; }
  if (!G.over) {
    if (KEYS.ArrowLeft || KEYS.ArrowRight) { G.in.rud = (KEYS.ArrowRight ? 1 : 0) - (KEYS.ArrowLeft ? 1 : 0); G.in.held = true; } else if (![...ptrs.values()].some(p => p.kind === 'wheel') && G.in.held && !window.__auto) { G.in.held = false; G.in.rud = 0; }
    if (window.__auto) window.__auto(G, dt);
    const was = G.phase; stepAll(G, dt); events();
    if (G.phase === 'sight' && !sightUp && !G.choice) { fillSight(); sightCard(true); setBanner(G.sight.ships.length > 1 ? 'Sails ho!' : 'Sail ho!', '', 1.2, '#ffd166'); } else if (G.phase !== 'sight' && sightUp) sightCard(false);
    if (G.phase !== was) { if (G.phase === 'board') { ptrs.clear(); INP.tip = null; G.in.fire = false; G.in.rud = 0; G.in.held = false; }      // (a thumb on the wheel stays on the wheel from one part of the sea to the next)
      if (G.phase === 'battle' && G.N <= 4) tip('fans', G.N <= 2 ? 'Put her in your gold arc, then FIRE' : 'Keep out of the red. Get on her bow or stern.', 3.6); if (G.phase === 'chase' && G.N <= 3) tip('chase', 'Steer for her. Your crew will grapple.', 3); }
    if (G.over) finish();
  } else { G.t += rdt; if (G.phase !== 'board') { ballsStep(G, dt); G.me.sink += G.me.alive ? 0 : dt; for (const s of G.foes) if (s.alive && !s.gone) sail(s, dt, s.struck ? 0 : s.K.speed * 0.4); } else boardIdle(G, dt); if (endT >= 0) { endT -= rdt; if (endT < 0) showEnd(); } }
  if (G.phase !== 'board') { camStep(G, rdt); wakeStep(G, rdt); smokeStep(G, rdt); }
  fxStep(rdt); if (hint) hint.t += rdt; hurtFlash = Math.max(0, hurtFlash - rdt * 1.8);
}
function boardIdle(G, dt) { const F = G.fight; F.t += dt; F.pt += dt; if (F.man) { F.man.ot += dt; F.man.hitT += dt; } if (F.pAnim) { F.pAnim.t += dt; if (F.pAnim.t >= F.pAnim.dur) F.pAnim = null; } F.shown += ((G.over === 'won' ? 1 : 0) - F.shown) * Math.min(1, dt * 4); }
function smokeStep(G, dt) {      // a ship that has been knocked about burns and smokes
  for (const s of [G.me].concat(G.foes)) { if (s.gone || !s.alive || s.hull > s.hull0 * 0.5 || s.struck) continue; s.sm = (s.sm || 0) - dt; if (s.sm > 0) continue; s.sm = 0.16 + Math.random() * 0.1; const bad = s.hull < s.hull0 * 0.25, q = (Math.random() - 0.5) * 0.6;
    fx({ k: 'dark', x: s.x + fwdX(s) * q * s.K.len, y: s.y + fwdY(s) * q * s.K.len, vx: -6 + Math.random() * 4, vy: -5 + Math.random() * 4, life: 1.6, r0: 2.5, r1: 9, a0: bad ? 0.6 : 0.4 }); if (bad) fx({ k: 'fire', x: s.x + fwdX(s) * q * s.K.len, y: s.y + fwdY(s) * q * s.K.len, life: 0.35, r0: 3, r1: 5.5, a0: 0.9 }); }
}
function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (G.phase === 'board') { drawFight(G); }
  else { const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake; ctx.save(); ctx.translate(sx, sy); drawSea(G); ctx.restore(); if (G.phase !== 'home') seaHud(); }
  hintDraw(); vignette();
}
let last = performance.now(), lastRaf = last;
function frame(now) {
  const gap = now - lastRaf; lastRaf = now;
  if (gap > 5.5 && gap < 100) { GAPS[gapN++ % GAPS.length] = gap; if (gapN % 30 === 0) vsync = lowGap(); }
  const fast = vsync < 12.5;
  if (half && fast && now - last < vsync * 1.5) { requestAnimationFrame(frame); return; }
  const ms = now - last, rdt = Math.min(0.05, ms / 1000); last = now;
  if (HEADLESS) { requestAnimationFrame(frame); return; }
  if (!paused && playing()) measure(ms, fast);
  if (G && !paused) {
    VT += rdt; let dt = rdt; if (hitstop > 0) { hitstop -= rdt; dt = 0; }
    tick(dt, rdt);
    MUS.want = G.phase === 'home' || G.phase === 'sail' || G.over ? 'calm' : G.phase === 'board' ? 'fight' : 'battle';
  }
  musicStep(!paused && !!G); ambience(G ? G.phase : 'home', G && G.fight ? G.fight.stage : 0, rdt, !paused && !!G && !MUTE);
  if (G) { draw(); draws++; }
  requestAnimationFrame(frame);
}
window.__sim = {
/*SOUNDCHECK*/
  async musicCheck(mode, secs = 8) {      // renders the shanty offline, one mood at a time: how loud it is against the effects
    const keep = [actx, BUS, AMB, MUTE], km = Object.assign({}, MUS), oc = new OfflineAudioContext(1, 44100 * secs, 44100); actx = oc; MUTE = false;
    const comp = oc.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
    BUS = oc.createGain(); BUS.gain.value = 0.9; BUS.connect(comp); comp.connect(oc.destination); AMB = oc.createGain(); AMB.connect(BUS);
    MUS.g = oc.createGain(); MUS.g.gain.value = mvol(mode); MUS.g.connect(AMB); MUS.ctx = oc; MUS.t = 0.05; MUS.bar = 0; MUS.e = 0; MUS.mode = MUS.want = mode; for (const q in NB) delete NB[q];
    let err = null; try { musicFill(secs - 0.6); } catch (e) { err = String(e); }
    const notes = MUS.bar * 6 + MUS.e, buf = await oc.startRendering(), ch = buf.getChannelData(0); let pk = 0, sq = 0; for (const x of ch) { pk = Math.max(pk, Math.abs(x)); sq += x * x; }
    [actx, BUS, AMB, MUTE] = keep; Object.assign(MUS, km); MUS.t = 0; for (const q in NB) delete NB[q];
    return { err, peak: +pk.toFixed(3), rms: +Math.sqrt(sq / ch.length).toFixed(4), eighths: notes };
  },
  start(N, o) { HEADLESS = true; MUTE = true; level = N; G = LIVE = newExp(N, o || {}); },      // (lessons only when o.teach)
  step(dt) { stepAll(G, dt); events(); if (G.over) finish(); },
  go(N, mini) { HEADLESS = false; level = N; startExp(!!mini); },
  playing, choose(c) { if (G && G.phase === 'sight') G.choice = c; },
  board() { if (!G.sight) { G.sight = makeSight(G); for (const s of G.sight.ships) s.loot0 = s.loot; placeSight(G, true); } for (const s of G.foes) if (s.K.navy && s !== G.prize) { s.alive = false; s.gone = true; } if (G.prize.K.navy) G.prize.struck = true; sightCard(false); setPhase(G, 'board'); startBoarding(G); events(); },
  stage(i) { if (G.phase !== 'board') this.board(); const F = G.fight; while (F.stage < i) nextStage(G); events(); },
  cabin() { this.stage(2); },
  stroke(ax, ay, bx, by) { fStroke(G, ax, ay, bx, by); }, poke(x, y) { fPoke(G, x, y); }, dodge() { fDodge(G); }, aim(x, y) { return fAim(G, x, y); }, aimMove(x, y) { fAimMove(G, x, y); }, fire() { fFire(G); }, reload(on) { fReload(G, on); },
  geo() { return manGeo(G.fight); }, aimAt() { return aimAt(G.fight); }, you: YOU, fu, judge(A, ax, ay, bx, by) { return judgeBlock(G, A, ax, ay, bx, by); }, makeAtk(kind) { return makeAtk(G, G.fight.man, kind); }, relTo, predict, inArc, SEA, FIGHT, KINDS, DBG, makeCfg, makeSight, haulOf, starsOf, rankOf, wrapA, clamp, fwdX, fwdY, rgtX, rgtY, CAM, MUS, TUNE,
  smooth() { return { step: stepN, half, sea: SEAGL ? 'fast' : 'plain', stuck, vsync: +vsync.toFixed(1), ms: +ftAvg.toFixed(1), dpr: DPR, draws, fx: FXS.length, wake: WAKE.length }; },
  finest(n) { stuck = true; stepN = clamp(n | 0, 0, STEPS.length - 1); half = 0; applyStep(); },      // tests and card pictures: the finest picture (or notch n), and leave it there
  gl(on) { if (on) { seaTried = false; } else { SEAGL = null; seaTried = true; $('bg').style.display = 'none'; } },      // tests: the sea by the graphics chip, or the plain way
  get G() { return G; }
};
applyStep();
try { document.fonts && document.fonts.load('48px "Pirata One"'); document.fonts && document.fonts.load('700 20px "Barlow Condensed"'); } catch (e) {}
showHome(); requestAnimationFrame(frame);
})();
</script>
</body>
</html>
