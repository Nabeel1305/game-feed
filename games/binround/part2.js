// ===================== THE RULES: Bin Round (his idea 20, 20 Nov 2026) =====================
// You ride on the back of a bin lorry along a street. At each house it stops and waits for you: tap a bin or bag and you go
// and fetch it; HOLD COLLECT to lift and empty it, and let go once it is empty (the green part of the ring) and it goes back
// neatly. Let go too soon and it comes down full; hold on too long and it bangs and spills a bit (more to pick up). Recycling
// sometimes has a bin bag on top: PICK OUT keeps it clean (optional, a bonus). When a house is done, NEXT HOUSE. Nothing is ever
// lost: no clock, no lives, no failing. Finish after any house; the round carries on from there next time.
const RULES = [
  '<b>Tap a bin or a bag</b> and you go and fetch it.',
  '<b>Hold COLLECT</b> to lift and empty it. <b>Let go in the green</b>, once it is empty, and it goes back neatly.',
  'Too soon and it comes down full. Too long and it bangs, spills a few bits and comes down to try again.',
  'Recycling with a bin bag on top? <b>PICK OUT</b> keeps it clean. A small bonus, never a must.',
  'When the house is done, <b>NEXT HOUSE</b>. Stop after any house: the round waits for you.',
  'No clock, no losing. Wave back to the neighbours.',
];
const KINDS = {
  bin:     { name: 'bin',          lift: 1.1,  win: 0.75, load: 1,   coins: 2, lv: 1 },
  bag:     { name: 'bag',          lift: 0.55, win: 0.45, load: 0.4, coins: 1, lv: 1 },
  recycle: { name: 'recycling',    lift: 1.0,  win: 0.7,  load: 0.8, coins: 2, lv: 2 },
  garden:  { name: 'garden waste', lift: 1.5,  win: 0.8,  load: 1.3, coins: 3, lv: 3 },
  bulky:   { name: 'old armchair', lift: 1.8,  win: 0.8,  load: 2.5, coins: 6, lv: 4 },
  litter:  { name: 'spilt bits',   lift: 0,    win: 0,    load: 0.1, coins: 0, lv: 99 },
};
const STREETS = ['Willow Lane', 'Primrose Close', 'Orchard Row', 'Larch Avenue', 'Brook Street', 'Holly Crescent', 'Meadow Way', 'Chestnut Grove', 'Kingfisher Road', 'Mill Lane', 'Foxglove Drive', 'Elm Terrace'];
const SEASONS = [{ id: 'spring', em: '🌸', skies: ['morning', 'mist', 'morning'] }, { id: 'summer', em: '☀️', skies: ['noon', 'golden', 'morning'] }, { id: 'autumn', em: '🍂', skies: ['golden', 'overcast', 'rain'] }, { id: 'winter', em: '❄️', skies: ['overcast', 'mist', 'dusk'] }];
const NOTES = ['"Thank you! You\'re always so careful." – No. 4', '"Have a lovely day!" (with a smiley face)', '"Sorry about the heavy one!"', '"Biscuits for the crew in the box ❤"', '"Thanks for putting it back so neatly."', '"You\'re the best part of Tuesday."'];
const THANKS = ['Thank you!', 'Cheers!', 'Thanks, love!', 'Lovely, thanks!', 'See you next week!', 'Ta very much!'];
const SKINS = [{ id: 'green', name: 'Council green', col: 0x3f9a4a, vest: 0xf2c230, stars: 0 }, { id: 'blue', name: 'River blue', col: 0x2a6ad8, vest: 0xff8a2a, stars: 3 }, { id: 'white', name: 'Clean white', col: 0xeeeeea, vest: 0x9cf04a, stars: 6 }, { id: 'orange', name: 'Sunrise', col: 0xf07a2a, vest: 0xf2f2f2, stars: 10 }, { id: 'purple', name: 'Lavender', col: 0x8a5ad0, vest: 0xffd23a, stars: 15 }, { id: 'red', name: 'Post-box red', col: 0xd8322a, vest: 0xb8f070, stars: 22 }];
const UPGRADES = [{ id: 'boots', name: 'Comfy boots', max: 2, cost: l => [40, 110][l], desc: 'You walk 10% quicker.' }, { id: 'gloves', name: 'Good gloves', max: 2, cost: l => [50, 130][l], desc: 'The green part of the ring is wider.' }, { id: 'hopper', name: 'Big hopper', max: 1, cost: () => 90, desc: 'The compactor runs less often.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'New starter'], [50, 'Crew member'], [180, 'Back-step pro'], [450, 'Round leader'], [1000, 'Street favourite'], [2400, 'Legend of the lane']];
const seasonOf = N => SEASONS[(N - 1) % 4], streetOf = N => STREETS[(N - 1) % STREETS.length];
const LANE = 1.8, WALK = 3.6, STOPGAP = 17;
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, free: !!o.practice, stops: o.practice ? 999 : Math.min(9, 4 + Math.floor((N - 1) / 2)), items: [Math.round(x(1.6, 2.4, 25)), Math.round(x(2, 5, 25))],
    win: x(0.7, 0.5, 30) * (help ? 1.3 : 1) * (1 + 0.15 * upLv('gloves')), wrong: N >= 2 ? x(0.25, 0.4, 30) : 0, kinds: Object.keys(KINDS).filter(k2 => KINDS[k2].lv <= N), back: N >= 6 ? x(0.1, 0.35, 30) : 0, cap: 6 + 3 * upLv('hopper') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, street: o.practice ? 'Any street' : streetOf(N), season: seasonOf(N),
    sky: seasonOf(N).skies[(seed >>> 3) % 3], stops: [], si: Math.max(0, o.from | 0), items: [], iid: 0, lorry: { z: -30, v: 0, state: 'drive' }, wk: { x: LANE, z: -31, st: 'ride', t: 0, item: null, carry: null },
    sam: { st: 'ride', t: 0 }, hold: false, holdNew: false, queue: null, load: 0, compact: 0, nextOk: false, autoT: -1, auto: !!o.auto, log: { bin: 0, bag: 0, recycle: 0, garden: 0, bulky: 0, sorted: 0, notes: 0, sam: 0, tidy: 0, houses: 0 }, coins: 0, first: Math.max(0, o.from | 0) };
  if (G.teach && LESSONS[N] && G.taught < N && !cfg.free) { lessonStart(G); return G; }
  for (let i = 0; i < Math.min(cfg.stops, 999) && i < 400; i++) { G.stops.push(makeStop(G, i)); if (cfg.free && i > 40) break; }
  G.lorry.z = stopZ(G, G.si) + 2.5 - 18; G.ev.push({ k: 'start' }); return G; }
const stopZ = (G, i) => 20 + i * STOPGAP;
function makeStop(G, i, forced) { const R = G.rnd, c = G.cfg, side = i % 2 === 0 ? 1 : -1, z = stopZ(G, i), n = forced ? forced.length : c.items[0] + Math.floor(R() * (c.items[1] - c.items[0] + 1));
  const S = { i, side, z, n, resident: R() < 0.5, cat: R() < 0.25, house: (R() * 6) | 0, done: false, note: -1, thanks: THANKS[(R() * THANKS.length) | 0] };
  S.kinds = forced || Array.from({ length: n }, () => { const ks = c.kinds.filter(k2 => k2 !== 'litter' && (k2 !== 'bulky' || R() < 0.15)); return ks[(R() * ks.length) | 0]; });
  if (S.kinds.filter(k2 => k2 === 'bulky').length > 1) S.kinds = S.kinds.map((k2, j) => k2 === 'bulky' && j > S.kinds.indexOf('bulky') ? 'bin' : k2);
  if (R() < 0.2) S.note = (R() * S.kinds.length) | 0; S.noteTxt = NOTES[(R() * NOTES.length) | 0]; return S; }
function spawnItems(G, S) { const R = G.rnd, c = G.cfg; G.items = []; const n = S.kinds.length;
  S.kinds.forEach((kind, j) => { const back = kind !== 'bag' && kind !== 'bulky' && R() < c.back, hx = S.side * (back ? 8.6 : 5.2 + (kind === 'bag' ? 0.5 : 0)), hz = S.z - 2.2 + (j - (n - 1) / 2) * 1.25 + (R() - 0.5) * 0.3;
    G.items.push({ id: ++G.iid, kind, hx, hz, x: hx, z: hz, st: 'wait', p: 0, wrong: kind === 'recycle' && R() < c.wrong, note: j === S.note, tidy: true, back, rot: (R() - 0.5) * 0.4 }); }); }
// ---------- where the worker stands to empty things: just behind the lorry, on the kerb side ----------
const hopper = G => ({ x: G.stops[G.si] ? G.stops[G.si].side * LANE : LANE, z: G.lorry.z - 0.9 });
const busy = G => G.over || G.lesson && G.lesson.wait > 0;
const atStop = G => G.lorry.state === 'stopped';
// ---------- the player's moves ----------
function tapItem(G, id) { if (busy(G) || !atStop(G)) return false; const it = G.items.find(q => q.id === id && q.st === 'wait'); if (!it) return false; const w = G.wk;
  if (w.st === 'idle' || w.st === 'hop' && w.t <= 0) { goFetch(G, it); return true; } if (G.queue !== it.id) { G.queue = it.id; G.ev.push({ k: 'queued', id: it.id }); } return true; }
function goFetch(G, it) { const w = G.wk; w.st = 'walk'; w.item = it.id; it.st = 'fetch'; G.queue = null; G.ev.push({ k: 'go', id: it.id, kind: it.kind }); if (it.kind === 'bulky') { G.sam.st = 'help'; G.ev.push({ k: 'samhelp' }); } }
// a tap on the world (the robots use this; the screen picks the nearest item on screen)
function tapWorld(G, x, z) { let best = null, bd = 0.7; for (const it of G.items) if (it.st === 'wait') { const d = Math.hypot(it.x - x, it.z - z); if (d < bd) { bd = d; best = it; } } return best ? tapItem(G, best.id) : false; }
const carried = G => G.items.find(q => q.id === G.wk.item);
const ready = G => G.wk.st === 'ready' && G.compact <= 0;
function press(G) { if (busy(G) || G.hold) return false; G.hold = true; G.holdNew = G.wk.st === 'ready'; return true; }      // a press only lifts what is already at the lorry
function release(G) { if (!G.hold) return false; G.hold = false; const it = carried(G); if (!it || G.wk.st !== 'lift') return true; const K = KINDS[it.kind];
  if (it.p < 1) { G.wk.st = 'lower'; G.wk.t = 0.5 + it.p * 0.6; G.ev.push({ k: 'early', kind: it.kind }); lessonSee(G, 'early'); return true; }
  emptied(G, it, true); return true; }
function emptied(G, it, tidy) { const K = KINDS[it.kind], w = G.wk; it.tidy = tidy; G.load += K.load; G.coins += K.coins + (tidy ? 1 : 0); G.log[it.kind === 'litter' ? 'tidy' : it.kind] += it.kind === 'litter' ? 0 : 1; if (tidy && it.kind !== 'litter') G.log.tidy++;
  G.ev.push({ k: tidy ? 'empty' : 'spill', kind: it.kind, x: it.x, z: it.z });
  if (it.wrong) { G.ev.push({ k: 'wrongbin' }); it.wrong = false; }
  if (it.note) { G.coins += 4; G.log.notes++; G.ev.push({ k: 'note', txt: G.stops[G.si] ? G.stops[G.si].noteTxt : NOTES[0] }); it.note = false; }
  if (!tidy) { const hp = hopper(G), R = G.rnd; G.items.push({ id: ++G.iid, kind: 'litter', hx: hp.x + G.stops[G.si].side * (1.2 + R() * 1.4), hz: hp.z + (R() - 0.5) * 2.4, x: 0, z: 0, st: 'wait', p: 0, tidy: true, rot: R() * 6 }); const L = G.items[G.items.length - 1]; L.x = L.hx; L.z = L.hz; }
  if (it.kind === 'bag' || it.kind === 'litter' || it.kind === 'bulky') { it.st = 'done'; w.st = 'idle'; w.item = null; if (it.kind === 'bulky') G.sam.st = 'back'; }
  else { it.st = 'return'; w.st = 'return'; }
  if (G.load >= G.cfg.cap) { G.load = 0; G.compact = 2.2; G.ev.push({ k: 'compact' }); }
  lessonSee(G, tidy ? 'empty' : 'spill'); }
// held on too long: it bangs on the hopper, a few bits fall out on the road, and it comes back down to try again
function spill(G, it) { const hp = hopper(G), R = G.rnd, S = G.stops[G.si]; it.dumped = false; it.tidy = false; G.wk.st = 'lower'; G.wk.t = 1.3;
  G.items.push({ id: ++G.iid, kind: 'litter', hx: hp.x + S.side * (1.0 + R() * 1.6), hz: hp.z + (R() - 0.5) * 2.6, x: 0, z: 0, st: 'wait', p: 0, tidy: true, rot: R() * 6 }); const L = G.items[G.items.length - 1]; L.x = L.hx; L.z = L.hz;
  G.log.spills = (G.log.spills || 0) + 1; G.ev.push({ k: 'spill', kind: it.kind }); lessonSee(G, 'spill'); }
function pickOut(G) { const it = carried(G); if (busy(G) || !it || !it.wrong || G.wk.st !== 'ready') return false; it.wrong = false; G.coins += 3; G.log.sorted++; const R = G.rnd, S = G.stops[G.si];
  G.items.push({ id: ++G.iid, kind: 'bag', hx: hopper(G).x + S.side * 1.6, hz: hopper(G).z + 1.2 + R(), x: 0, z: 0, st: 'wait', p: 0, tidy: true, rot: R() }); const b = G.items[G.items.length - 1]; b.x = b.hx; b.z = b.hz;
  G.ev.push({ k: 'pickout' }); lessonSee(G, 'pickout'); return true; }
function nextHouse(G) { if (busy(G) || !G.nextOk) return false; const S = G.stops[G.si]; const left = G.items.filter(q => q.st === 'wait' && q.kind === 'litter').length; if (left) { G.log.sam += left; G.ev.push({ k: 'sam', n: left }); }
  for (const q of G.items) if (q.kind === 'litter') q.st = 'done'; G.nextOk = false; G.autoT = -1; G.wk.st = 'board'; G.wk.t = 0.5; G.ev.push({ k: 'next' }); lessonSee(G, 'next'); return true; }
function stopHere(G) { if (G.over || !G.nextOk || G.lesson) return false; finish(G, false, { rest: true }); return true; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; const L = G.lorry, w = G.wk, sp = WALK * (1 + 0.1 * upLv('boots'));
  if (G.lesson) { lessonTick(G, dt); if (G.lesson && G.lesson.wait > 0) return; }
  if (G.compact > 0) G.compact -= dt;
  // the lorry: drives to the next stop, stops, waits
  if (L.state === 'drive') { const S = G.stops[G.si]; if (!S) { L.v = Math.min(6, L.v + dt * 1.5); L.z += L.v * dt; w.z = L.z - 0.3; if (L.z > stopZ(G, G.stops.length) + 10) finish(G, true); return; }
    const goal = S.z + 2.5, d = goal - L.z, vT = Math.min(6.5, Math.max(0.6, Math.sqrt(Math.max(0, d) * 2.2))); L.v += clamp(vT - L.v, -dt * 4, dt * 2.2); L.z += L.v * dt; w.x = S.side * LANE; w.z = L.z - 0.3;
    if (d <= 0.05) { L.z = goal; L.v = 0; L.state = 'stopped'; spawnItems(G, S); if (G.lesson && lessonNow(G).id === 'pickout') G.items.forEach(o => { if (o.kind === 'recycle') o.wrong = true; }); w.st = 'hop'; w.t = 0.5; G.ev.push({ k: 'arrive', i: G.si, resident: S.resident }); } return; }
  // the worker
  const S = G.stops[G.si], hp = hopper(G), it = carried(G), K = it && KINDS[it.kind], mv = (tx, tz, v) => { const dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz); if (d < v * dt) { w.x = tx; w.z = tz; return true; } w.x += dx / d * v * dt; w.z += dz / d * v * dt; w.face = Math.atan2(dx, dz); return false; };
  if (w.st === 'hop') { w.t -= dt; if (mv(hp.x, hp.z, 2) && w.t <= 0) { w.st = 'idle'; if (G.queue) { const q = G.items.find(o => o.id === G.queue && o.st === 'wait'); G.queue = null; if (q) goFetch(G, q); } } }
  else if (w.st === 'idle') { mv(hp.x, hp.z, sp); if (G.queue) { const q = G.items.find(o => o.id === G.queue && o.st === 'wait'); G.queue = null; if (q) goFetch(G, q); } }
  else if (w.st === 'walk' && it) { const bulkySlow = it.kind === 'bulky' ? 0.75 : 1; if (mv(it.x - S.side * 0.55, it.z, sp * bulkySlow)) { w.st = 'bring'; G.ev.push({ k: 'grab', kind: it.kind }); } }
  else if (w.st === 'bring' && it) { const v = sp * (it.kind === 'bulky' ? 0.55 : it.kind === 'garden' ? 0.8 : 0.9); if (mv(hp.x, hp.z, v)) { it.x = hp.x; it.z = hp.z + 0.6; if (it.kind === 'litter') emptied(G, it, true); else { w.st = 'ready'; it.p = 0; G.ev.push({ k: 'ready', kind: it.kind, wrong: it.wrong }); } } else { it.x = w.x + S.side * 0.5; it.z = w.z + 0.25; } }
  else if ((w.st === 'ready' || w.st === 'lift') && it) { if (w.st === 'ready' && G.hold && G.holdNew && G.lesson && it.wrong) { G.holdNew = false; G.ev.push({ k: 'lessonmiss', how: 'Tap PICK OUT first: the bin bag goes in the main hopper.' }); }
    if (w.st === 'ready' && G.hold && G.holdNew && G.compact <= 0) { w.st = 'lift'; G.holdNew = false; G.ev.push({ k: 'lift', kind: it.kind }); }
    if (w.st === 'lift') { it.p += dt / K.lift; const top = 1 + G.cfg.win * K.win / K.lift; if (it.p >= 1 && !it.dumped) { it.dumped = true; G.ev.push({ k: 'dump', kind: it.kind }); } if (it.p > top) { G.hold = false; spill(G, it); } } }
  else if (w.st === 'lower' && it) { w.t -= dt; it.p = Math.max(0, it.p - dt * 1.6); if (w.t <= 0) { it.p = 0; w.st = 'ready'; } }      // it comes back down before you can try again
  else if (w.st === 'return' && it) { const done = mv(it.hx - S.side * 0.55, it.hz, sp * 0.95); it.x = w.x + S.side * 0.55; it.z = w.z; it.p = Math.max(0, it.p - dt * 3); if (done) { it.x = it.hx; it.z = it.hz; it.st = 'done'; it.p = 0; w.st = 'idle'; w.item = null; G.ev.push({ k: 'back', kind: it.kind, tidy: it.tidy }); } }
  else if (w.st === 'board') { w.t -= dt; if (mv(S.side * LANE, L.z - 0.3, sp) && w.t <= 0) { w.st = 'ride'; L.state = 'drive'; G.log.houses++; G.si++; if (!G.cfg.free) saveSpot(G); if (G.cfg.free && G.si >= G.stops.length - 2) G.stops.push(makeStop(G, G.stops.length)); G.items = G.items.filter(q => q.st !== 'done'); } }
  // the house is done: NEXT HOUSE (or, with Auto on, off we go by ourselves)
  if (L.state === 'stopped' && !G.nextOk && w.st === 'idle' && G.items.every(q => q.st === 'done' || q.kind === 'litter')) { G.nextOk = true; S.done = true; G.ev.push({ k: 'housedone', i: G.si, resident: S.resident, thanks: S.thanks, last: G.si === G.stops.length - 1 && !G.cfg.free }); lessonSee(G, 'house'); if (G.auto && !G.lesson) G.autoT = 1.4; }
  if (G.autoT > 0 && !G.hold) { G.autoT -= dt; if (G.autoT <= 0) nextHouse(G); } }
function saveSpot(G) { if (typeof HEADLESS !== 'undefined' && HEADLESS) return; store.set('resume', G.si < G.stops.length ? { N: G.N, from: G.si } : null); }
function finish(G, win, o = {}) { if (G.over) return; G.over = win ? 'won' : 'lost'; const l = G.log, items = l.bin + l.bag + l.recycle + l.garden + l.bulky;
  G.res = { win, rest: !!o.rest, stars: win ? 1 : 0, houses: l.houses, total: G.stops.length, from: G.first, items, log: Object.assign({}, l), coins: G.coins + (win ? 10 + G.N : 0), street: G.street, season: G.season.id };
  G.ev.push({ k: win ? 'won' : 'rest' }); }
// ---------- LESSONS: the first three levels each start with one ----------
const LESSONS = {
  1: [{ id: 'empty', title: 'EMPTY A BIN', how: 'Tap the bin: you fetch it. HOLD COLLECT. Let go when the ring reaches the GREEN. Two bins.', need: 2 }],
  2: [{ id: 'pickout', title: 'KEEP THE RECYCLING CLEAN', how: 'A bin bag is on top of the recycling. Fetch it, tap PICK OUT, then empty the box.', need: 1 }],
  3: [{ id: 'house', title: 'FINISH THE HOUSE', how: 'Empty the bag and the garden bin, then tap NEXT HOUSE.', need: 1 }],
};
function lessonStart(G) { const st0 = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, wait: 0 };
  G.stops = [makeStop(G, 0, st0.id === 'empty' ? ['bin', 'bin', 'bin'] : st0.id === 'pickout' ? ['recycle', 'bag'] : ['bag', 'garden'])]; G.stops[0].note = -1;
  G.lorry.z = G.stops[0].z + 2.5 - 6; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) { const st0 = lessonNow(G); if (!st0 || G.lesson.done) return;
  if (st0.id === 'pickout' && what === 'empty' && !G.lesson.picked) { return; }
  if (st0.id === 'pickout' && what === 'pickout') { G.lesson.picked = true; G.ev.push({ k: 'lessonok', n: 0, need: 1, soft: true }); return; }
  const ok = (st0.id === 'empty' && what === 'empty') || (st0.id === 'pickout' && what === 'empty' && G.lesson.picked) || (st0.id === 'house' && what === 'next');
  if (!ok) { if (what === 'early') G.ev.push({ k: 'lessonmiss', how: 'Keep holding until the ring is in the green.' }); if (what === 'spill') G.ev.push({ k: 'lessonmiss', how: 'Let go a little sooner: as soon as it is in the green.' }); return; }
  G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st0.need }); if (G.lesson.n >= st0.need) { G.lesson.done = true; G.lesson.wait = 1.6; G.ev.push({ k: 'lessondone', N: G.N }); } }
function lessonTick(G, dt) { const D = G.lesson; if (D.wait > 0) { D.wait -= dt; if (D.wait <= 0 && D.done) { G.lesson = null; G.stops = []; for (let i = 0; i < G.cfg.stops; i++) G.stops.push(makeStop(G, i)); G.si = 0; G.items = []; G.lorry = { z: stopZ(G, 0) + 2.5 - 10, v: 0, state: 'drive' }; G.wk.st = 'ride'; G.wk.item = null; G.nextOk = false; G.log = { bin: 0, bag: 0, recycle: 0, garden: 0, bulky: 0, sorted: 0, notes: 0, sam: 0, tidy: 0, houses: 0 }; G.coins = 0; G.ev.push({ k: 'start' }); } } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps anywhere on the street picture, presses or lets go of COLLECT, taps NEXT HOUSE or
// PICK OUT where they would be
const BLIND = {
  t: G => { const S = G.stops[G.si], z0 = S ? S.z : G.lorry.z; tapWorld(G, (Math.random() * 2 - 1) * 10, z0 - 9 + Math.random() * 13); },
  p: G => press(G), r: G => release(G), n: G => nextHouse(G), o: G => pickOut(G),
};
// HONEST: someone who looks. react: seconds to notice; acc: how well they judge the moment to let go (and how often they bother
// to pick out a bag from the recycling)
function honest(G, o, mem) { if (G.over || busy(G)) return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.35 : o.react, R = Math.random, w = G.wk, it = carried(G);
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return;
  if (G.hold && it && w.st === 'lift') { if (mem.let == null) { const K = KINDS[it.kind], span = G.cfg.win * K.win / K.lift; mem.let = 1 + span * (0.5 + (R() - 0.5) * 1.6 * (1.15 - acc)) + (R() < (1 - acc) * 0.3 ? (R() < 0.5 ? -0.25 : span) : 0); } if (it.p >= mem.let) { release(G); mem.let = null; mem.cd = react * 0.5; } return; }
  if (G.hold && w.st !== 'lift') { release(G); mem.let = null; return; }
  if (w.st === 'ready' && it && G.compact <= 0) { if (it.wrong && R() < acc) { pickOut(G); mem.cd = react; return; } press(G); mem.let = null; return; }
  if (G.nextOk) { nextHouse(G); mem.cd = react * 2; return; }
  if (atStop(G) && (w.st === 'idle' || w.st === 'return' || w.st === 'hop') && !G.queue) { const hp = hopper(G); let best = null, bd = 1e9; for (const q of G.items) if (q.st === 'wait') { const d = Math.hypot(q.x - hp.x, q.z - hp.z); if (d < bd) { bd = d; best = q; } }
    if (best) { if (R() < (1 - acc) * 0.3) { mem.cd = react; return; } tapItem(G, best.id); mem.cd = react * (1 + R()); } } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.si = G.stops.length; finish(G, true); }
