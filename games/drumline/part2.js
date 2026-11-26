
// ===================== RULES: Drumline (game 39) =====================
// Notes roll down two lanes toward your two drums; tap the left half of the screen for the left drum, the right half for the
// right drum, as each note reaches its drum. Gold notes are for both drums at once. A long note is a drum roll: keep tapping
// that drum till it ends. The crowd meter fills when you hit and drains when you miss or tap with no note there; if it empties,
// the song stops. Sixteen in a row lights FEVER: double points for a while. Each level is a song of its own, a little faster
// and busier; finish it with the crowd still with you.
// Time is in seconds from the start of the song; a note is { t, lane: 0 left / 1 right / 2 both, roll: seconds }.
const RULES = [
  'Notes roll down toward your two drums. <b>Tap the left half</b> for the left drum, <b>the right half</b> for the right one, as each note arrives.',
  '<b>Gold</b> notes: both drums at once. <b>Long</b> notes: a drum roll, keep tapping till it ends.',
  'The <b>crowd meter</b> fills when you hit and drains when you miss, or tap with no note there. Empty, and the song stops.',
  'Sixteen in a row: <b>FEVER</b>, double points. Finish the song with the crowd on its feet.',
];
const WIN = { perfect: 0.05, good: 0.1, ok: 0.14 };
const SONGS = ['Marching In', 'Friday Lights', 'Halftime Heat', 'Snare Storm', 'Brass Parade', 'Thunder Row', 'Victory Lap', 'Night Game', 'Homecoming', 'Big Ten Blast', 'Cadence 99', 'The Field', 'Rimshot Run', 'Stadium Roar', 'Final Whistle'];
const songName = N => SONGS[(N - 1) % SONGS.length] + (N > SONGS.length ? ` ${['II', 'III', 'IV', 'V'][Math.min(3, Math.floor((N - 1) / SONGS.length) - 1)]}` : '');
const PLACES = [{ name: 'Home field', sky: 'dusk' }, { name: 'Night game', sky: 'night' }, { name: 'Sunset bowl', sky: 'sunset' }, { name: 'Rainy rivalry', sky: 'rain' }];
const placeOf = N => Math.floor((N - 1) / 4) % PLACES.length;
const UPGRADES = [
  { id: 'ears', name: 'Good ears', desc: 'A wider window for PERFECT.', max: 2, cost: l => 25 + l * 30 },
  { id: 'crowd', name: 'Home crowd', desc: 'The crowd forgives a miss a little more.', max: 3, cost: l => 20 + l * 25 },
  { id: 'fever', name: 'Longer fever', desc: 'FEVER lasts longer.', max: 2, cost: l => 25 + l * 30 },
  { id: 'sticks', name: 'Gold sticks', desc: 'Drum rolls score double.', max: 1, cost: l => 40 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Rookie'], [40, 'Snare'], [130, 'Section leader'], [320, 'Drum major'], [700, 'Legend'], [1500, 'Hall of fame']];
function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), sky: PLACES[placeOf(N)].sky, name: songName(N),
    bpm: Math.round(x(84, 150, 30)), bars: Math.round(x(12, 24, 25)), dens: x(0.45, 0.9, 30), eighth: x(0.05, 0.6, 30), both: N >= 2 ? x(0.06, 0.18, 30) : 0, roll: N >= 3 ? x(0.08, 0.2, 30) : 0, sixteenth: N >= 8 ? x(0, 0.25, 30) : 0,
    perfect: WIN.perfect * (1 + 0.25 * upLv('ears')), okw: x(0.14, 0.08, 30) * (help ? 1.2 : 1), goodw: x(0.1, 0.065, 30), drain: x(0.08, 0.4, 30) * (1 - 0.12 * upLv('crowd')) * (help ? 0.7 : 1) * (1 - 0.2 * e), stray: x(0.05, 0.07, 30) * (help ? 0.7 : 1), gain: 0.03, fever: 8 + 3 * upLv('fever'),
    speed: x(5.5, 9, 30), pass: 0 };
}
// a song: bars of four beats; on each beat (and between, on busier songs) a note or not, left or right, sometimes both or a roll;
// phrases repeat (a cadence you can learn), with a fill at the end of every fourth bar
function makeSong(G) { const c = G.cfg, R = G.rnd, beat = 60 / c.bpm, notes = [], lead = 2.4; let phrase = null;
  for (let b = 0; b < c.bars; b++) { if (b % 4 === 0 || !phrase) { phrase = []; for (let s = 0; s < 16; s++) { const onBeat = s % 4 === 0, onEighth = s % 2 === 0; let p = onBeat ? c.dens : onEighth ? c.eighth * c.dens : c.sixteenth * c.dens; if (s === 0) p = 1;
        if (R() < p) { const lane = R() < c.both && onBeat ? 2 : (R() < 0.5 ? 0 : 1); phrase.push({ s, lane, roll: onBeat && R() < c.roll && s % 8 === 0 ? beat * (1 + (R() * 2 | 0)) : 0 }); } } }
    const fill = b % 4 === 3 && c.N > 1;
    for (const q of phrase) { if (fill && q.s >= 8) continue; notes.push({ t: lead + (b * 16 + q.s) * beat / 4, lane: q.lane, roll: q.roll }); }
    if (fill) for (let s = 8; s < 16; s += 2) notes.push({ t: lead + (b * 16 + s) * beat / 4, lane: (s / 2) % 2, roll: 0 }); }
  // a roll must not run into the next note in its lane
  notes.sort((a, b) => a.t - b.t); for (let i = 0; i < notes.length; i++) { const n = notes[i]; if (!n.roll) continue; const nx = notes.find((m, j) => j > i && (m.lane === n.lane || m.lane === 2 || n.lane === 2)); if (nx && n.t + n.roll > nx.t - beat * 0.5) n.roll = Math.max(0, nx.t - beat * 0.5 - n.t); if (n.roll < beat * 0.75) n.roll = 0; if (n.roll && n.lane === 2) n.lane = (i % 2); }
  notes.forEach((n, i) => { n.id = i; n.hit = [false, false]; n.done = false; n.rollHits = 0; });
  G.notes = notes; G.len = lead + c.bars * 4 * beat + 1.5; G.beat = beat; G.lead = lead; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, sky: cfg.sky,
    notes: [], crowd: 0.6, score: 0, combo: 0, maxCombo: 0, mult: 1, fever: 0, perfects: 0, goods: 0, oks: 0, misses: 0, strays: 0, coins: 0, held: [false, false], last: [-9, -9] };
  makeSong(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G;
}
const hittable = n => !n.done;
// ---------- your thumbs ----------
// a tap on drum `lane` at `ahead` seconds after the last frame (taps between frames are timed exactly)
function tap(G, lane, ahead = 0) {
  if (G.over || G.wait > 0) return null; const t = G.t + ahead; G.last[lane] = t; G.ev.push({ k: 'drum', lane });
  // a drum roll in progress on this drum takes the tap
  const r = G.notes.find(n => n.roll && !n.done && n.hit[0] && (n.lane === lane) && t <= n.t + n.roll + 0.05); if (r) { r.rollHits++; G.score += 10 * G.mult * (upLv('sticks') ? 2 : 1); G.crowd = Math.min(1, G.crowd + 0.004); G.ev.push({ k: 'roll', lane }); return 'roll'; }
  const okw = G.cfg.okw; let best = null, bd = 1e9; for (const n of G.notes) { if (n.done) continue; if (n.t - t > okw) break; const need = n.lane === 2 ? !n.hit[lane] : n.lane === lane; if (!need) continue; const d = Math.abs(t - n.t); if (d < bd && d <= okw) { bd = d; best = n; } }
  if (!best) { stray(G, lane); return 'stray'; }
  const q = bd <= G.cfg.perfect ? 'perfect' : bd <= G.cfg.goodw ? 'good' : 'ok';
  if (best.lane === 2) { best.hit[lane] = true; best.q = best.q && rankQ(best.q) < rankQ(q) ? best.q : q; if (!(best.hit[0] && best.hit[1])) { best.half = t; return 'half'; } }
  else best.hit[0] = true;
  if (!best.roll) best.done = true; judge(G, best, best.lane === 2 ? best.q : q, t - best.t); return q;
}
const rankQ = q => ({ perfect: 0, good: 1, ok: 2 })[q];
function judge(G, n, q, off) { const c = G.cfg; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); G.mult = Math.min(4, 1 + Math.floor(G.combo / 8));
  const pts = { perfect: 100, good: 70, ok: 40 }[q] * (n.lane === 2 ? 2 : 1); G.score += pts * G.mult * (G.fever > 0 ? 2 : 1); G[q === 'perfect' ? 'perfects' : q === 'good' ? 'goods' : 'oks']++;
  G.crowd = Math.min(1, G.crowd + c.gain * (q === 'perfect' ? 1.3 : q === 'good' ? 1 : 0.6)); if (G.combo % 16 === 0 && G.fever <= 0) { G.fever = c.fever; G.ev.push({ k: 'fever' }); }
  if (G.combo % 25 === 0) G.coins++; G.ev.push({ k: 'hit', q, lane: n.lane, off, combo: G.combo }); if (!n.roll) lessonSee(G, n.lane === 2 ? 'both' : 'hit', q); }
function miss(G, n) { G.misses++; G.combo = 0; G.mult = 1; G.crowd -= G.cfg.drain; G.ev.push({ k: 'miss', lane: n.lane }); lessonMiss(G); }
function stray(G, lane) { G.strays++; G.combo = 0; G.mult = 1; G.crowd -= G.cfg.stray; G.ev.push({ k: 'stray', lane }); }
// ---------- the song, step by step ----------
function step(G, dt) {
  if (G.over) return; const c = G.cfg;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0 && G.lessonEnd) { G.lessonEnd = false; Object.assign(G, { t: 0, crowd: 0.6, score: 0, combo: 0, maxCombo: 0, mult: 1, fever: 0, perfects: 0, goods: 0, oks: 0, misses: 0, strays: 0, coins: 0 }); makeSong(G); G.ev.push({ k: 'start' }); } return; }
  G.t += dt; if (G.fever > 0) { G.fever -= dt; if (G.fever <= 0) G.ev.push({ k: 'feverend' }); }
  for (const n of G.notes) { if (n.t > G.t) break; if (n.done) continue;
    if (n.roll && n.hit[0]) { if (G.t > n.t + n.roll) { n.done = true; const good = n.rollHits >= Math.floor(n.roll / 0.3); G.ev.push({ k: 'rollend', hits: n.rollHits, good }); if (good) lessonSee(G, 'roll'); else lessonMiss(G); } continue; }
    if (G.t - n.t > c.okw) { if (n.lane === 2 && (n.hit[0] || n.hit[1])) { n.done = true; judge(G, n, 'ok', 0); continue; } n.done = true; miss(G, n); } }
  if (G.lesson) { G.crowd = Math.max(0.3, G.crowd); lessonTick(G, dt); }
  if (G.crowd <= 0) { G.crowd = 0; return finish(G, false); }
  if (!G.lesson && G.t > G.len) return finish(G, true);
}
function finish(G, win) { G.over = win ? 'won' : 'lost'; const tot = G.notes.length, acc = tot ? (G.perfects + G.goods * 0.7 + G.oks * 0.4) / tot : 0, stars = win ? (acc > 0.85 ? 3 : acc > 0.65 ? 2 : 1) : 0;
  G.res = { win, stars, score: G.score, acc, perfects: G.perfects, goods: G.goods, oks: G.oks, misses: G.misses, strays: G.strays, maxCombo: G.maxCombo, name: G.cfg.name, prog: Math.min(1, G.t / G.len), coins: G.coins + (win ? 4 + Math.ceil(G.N / 3) : 0) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'hit', title: 'ON THE BEAT', say: G => drumCue(G)[0], do: G => drumCue(G)[1], at: G => drumCue(G)[2], how: 'Tap the left half for the left drum, the right half for the right, as each note reaches its drum. Eight in a row.', need: 8 }],
  2: [{ id: 'both', title: 'BOTH DRUMS', say: G => drumCue(G)[0], do: G => drumCue(G)[1], at: G => drumCue(G)[2], how: 'Gold notes: tap both halves at once. Three in a row.', need: 3 }],
  3: [{ id: 'roll', title: 'DRUM ROLL', say: G => drumCue(G)[0], do: G => drumCue(G)[1], at: G => drumCue(G)[2], how: 'A long note: tap it, then keep tapping that drum till it ends. Two rolls.', need: 2 }],
};
// THE TUTORIAL'S HAND IS ON THE DRUM THE NEXT NOTE FALLS TO (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It showed a tap in a box: which side was his to work out. Now the hand taps on that drum (left or right; both for gold; again and
// again for a roll) as the note comes down to it, and says so: TAP LEFT / TAP RIGHT / GOLD: TAP BOTH SIDES / KEEP TAPPING.
function drumCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const rl = G.notes.find(q => q.roll && !q.done && q.hit && q.hit[0] && G.t <= q.t + q.roll); if (rl) { const p = drumAt(rl.lane === 2 ? 0 : rl.lane); return ['KEEP TAPPING!', 'tap', [p.x, p.y]]; }      /* a drum roll under way */ const n = G.notes.find(q => !q.done && q.t > G.t - 0.15); if (!n || n.t > G.t + 1.6) return ['GET READY…', 'wait', false];
  if (n.lane === 2) { const a = drumAt(0), b = drumAt(1); if (n.t - G.t > 0.24) return ['GOLD: BOTH SIDES…', 'wait', false]; return ['GOLD: TAP BOTH SIDES', 'tap', [(a.x + b.x) / 2, (a.y + b.y) / 2]]; }
  const p = drumAt(n.lane); if (n.t - G.t > 0.24 && !(n.roll && G.t > n.t)) return [n.lane ? 'RIGHT DRUM…' : 'LEFT DRUM…', 'wait', false];      // the tap shows as the note reaches the drum (a fifth of a second ahead: a thumb's time)
  return [n.roll && G.t > n.t ? 'KEEP TAPPING' : n.lane ? 'TAP RIGHT' : 'TAP LEFT', 'tap', [p.x, p.y]]; }
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSong(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSong(G) { const st = lessonNow(G), beat = 60 / 80, notes = []; let t = G.t + 2.2;
  for (let i = 0; i < 200; i++) { if (st.id === 'hit') notes.push({ t, lane: i % 2 === 0 ? 0 : (i % 4 === 1 ? 1 : 0), roll: 0 }); if (st.id === 'both') notes.push({ t, lane: i % 2 ? 2 : (i % 4 === 0 ? 0 : 1), roll: 0 });
    if (st.id === 'roll') { if (i % 3 === 0) { notes.push({ t, lane: (i / 3) % 2, roll: beat * 2 }); t += beat * 2; } else notes.push({ t, lane: i % 2, roll: 0 }); } t += beat; }
  notes.forEach((n, i) => { n.id = 1000 + i; n.hit = [false, false]; n.done = false; n.rollHits = 0; }); G.notes = notes; G.beat = beat; G.len = 1e9; }
function lessonTick(G) {}
function lessonSee(G, what, q) { const st = lessonNow(G); if (!st) return; if (what !== st.id) return;
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.4; } else lessonSong(G); }
function lessonMiss(G) { const st = lessonNow(G); if (!st) return; if (G.lesson.n) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); } }
// ---------- for the robots ----------
// BLIND: thumbs that do not look: a tap on the left, the right, or both
const BLIND = { l: G => { tap(G, 0); }, r: G => { tap(G, 1); }, b: G => { tap(G, 0); tap(G, 1); } };
// a drummer who listens: taps each note as it comes, a little early or late (react sets how much), and now and then not at all
// (acc); keeps a roll going with taps every 0.1-0.15 s
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, sd = 0.015 + react * 0.08;
  if (G.over || G.wait > 0) return;
  if (!mem.plan) mem.plan = new Map();
  for (const n of G.notes) { if (n.t > G.t + 0.5) break; if (n.done || mem.plan.has(n.id)) continue; const skip = R() > acc + (1 - acc) * 0.5; const err = (R() + R() + R() - 1.5) * sd * 1.4;
    mem.plan.set(n.id, skip ? null : { at: n.t + err, lanes: n.lane === 2 ? [0, 1] : [n.lane], roll: n.roll, end: n.t + n.roll }); }
  for (const [id, p] of mem.plan) { if (!p) continue; if (G.t >= p.at && !p.did) { p.did = true; for (const l of p.lanes) tap(G, l, p.at - G.t); p.nextRoll = G.t + 0.12; }
    if (p.did && p.roll && G.t < p.end - 0.04 && G.t >= p.nextRoll) { tap(G, p.lanes[0], 0); p.nextRoll = G.t + 0.1 + R() * 0.05; } }
  if (mem.plan.size > 400) { for (const k of [...mem.plan.keys()].slice(0, 200)) mem.plan.delete(k); }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.t = G.len + 1; finish(G, true); }
