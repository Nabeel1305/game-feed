// ===================== RULES: Grand Hotel (game 48, his idea) =====================
// You are the hotel's attendant, the only one on shift. The hotel is a cutaway: the lobby at the bottom (the front desk, the
// kitchen, the laundry) and floors of rooms above, with a lift up the left side. Requests pop up as bubbles, each with a ring
// that empties as the guest loses patience: a new guest at the desk (carry their bags up to a clean room), a room ringing for
// food (from the kitchen) or towels (from the laundry), and a room left dirty after a check-out (clean it, or the next guest
// has nowhere to go).
// 25 Nov 2026, his review: "I think it would be more fun if you let the player click where to go instead of doing it for them. So let
// them click the request, then click the room they should go to the room themselves of course you make it cleat what room they should
// go if they make a mistake they are penalized. they have to go to the kitchen and loundry then go to the rooms". So YOU send the
// attendant: tap the kitchen and he fetches a plate for every room that rang for food (as many as his hands hold); tap the room
// and he takes it up. Tap the guest's bags, then a clean room. Tap a dirty room to clean it. The wrong door costs the hotel some of
// its rating. You can line up three stops. Fast service earns big tips; a guest left waiting too long costs the hotel a star.
const RULES = [
  'Requests pop up as <b>bubbles</b>: a guest at the desk 🧳, food 🍝, towels 🧺, a dirty room 🧹. The ring is their <b>patience</b>.',
  '<b>You send the attendant.</b> Food: tap the <b>KITCHEN</b>, then the room. Towels: the <b>LAUNDRY</b>, then the room.',
  'A new guest: tap their <b>🧳</b>, then a <b>clean room</b> (it glows green). A dirty room: tap it to <b>clean</b> it.',
  'The <b>wrong door</b> costs the hotel some of its ★. You can line up <b>three stops</b>; your hands carry <b>two</b> things.',
  'Make the <b>tips target</b> by the end of the shift. Under two ★ and the manager sends you home.',
];
const FLOOR_W = 1, LIFT = 0.07, COLS = [0.3, 0.55, 0.8], DESK = 0.3, KITCHEN = 0.55, LAUNDRY = 0.8;      // x along a floor, 0..1
const KINDS = {
  bags: { icon: '🧳', name: 'Bags up', tip: 9, pat: 30, src: 'desk' },
  food: { icon: '🍝', name: 'Room service', tip: 12, pat: 34, src: 'kitchen' },
  towels: { icon: '🧺', name: 'Towels', tip: 7, pat: 30, src: 'laundry' },
  clean: { icon: '🧹', name: 'Clean room', tip: 5, pat: 44, src: null, work: 2.2 },
};
const PLACES = [{ name: 'The Seaview' }, { name: 'The Regent' }, { name: 'The Alpine Lodge' }, { name: 'The Grand Palace' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const UPGRADES = [
  { id: 'shoes', name: 'Soft shoes', desc: 'You walk 10% faster.', max: 3, cost: l => 30 + l * 35 },
  { id: 'trolley', name: 'Trolley', desc: 'Carry three things, not two.', max: 1, cost: l => 70 },
  { id: 'lift', name: 'Lift service', desc: 'The lift runs 25% faster.', max: 2, cost: l => 40 + l * 45 },
  { id: 'smile', name: 'Warm smile', desc: 'Guests wait 10% longer.', max: 2, cost: l => 45 + l * 50 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Bellhop'], [40, 'Porter'], [130, 'Concierge'], [320, 'Head Butler'], [700, 'Manager'], [1500, 'Hotelier']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const floors = N >= 12 ? 4 : N >= 3 ? 3 : 2;
  return { N, f, help: !!help, place: placeOf(N), floors, shift: 100, jobs: Math.round(x(16, 20, 30) * (1 - 0.12 * e)), patK: x(1, 0.93, 30) * (1 + 0.1 * upLv('smile')) * (help ? 1.2 : 1),
    share: x(0.72, 0.56, 30) * (help ? 0.85 : 1),      /* (25 Nov 2026: every stop is your own tap now, which takes longer than the old automatic rounds: the target asks a little less) */ vip: N >= 4 ? x(0.1, 0.25, 30) : 0, towels: N >= 2, clean: N >= 3, hands: 2 + upLv('trolley'), sp: 0.42 * (1 + 0.1 * upLv('shoes')), lift: 1.1 * (1 + 0.25 * upLv('lift')), target: 0 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, nid: 1, wait: 0 };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { plan(G); G.ev.push({ k: 'start' }); }
  return G; }
function setup(G) { const c = G.cfg; G.rooms = []; for (let f = 1; f <= c.floors; f++) COLS.forEach((x, i) => G.rooms.push({ id: G.rooms.length, f, x, no: f * 100 + i + 1, state: 'clean', guest: null }));
  G.me = { f: 0, x: 0.42, carry: [], work: 0, face: 1, walk: 0 }; G.reqs = []; G.route = []; G.wrongs = 0; G.tips = 0; G.rating = 5; G.served = 0; G.lost = 0; G.combo = 0; G.lastDone = -9; G.clock = 1e9; G.sched = []; G.best = 0;
  G.rooms.forEach((r, i) => { if (i % 2 === 0) { r.state = 'occ'; r.guest = guestName(G); } }); }
const NAMES = ['Mr Okafor', 'Mrs Lin', 'Dr Varga', 'Ms Adeyemi', 'Mr Rossi', 'Lady Ashby', 'Mr Haddad', 'Mrs Novak', 'Sir Clive', 'Ms Tanaka', 'Mr Mensah', 'Mme Duval'];
const guestName = G => NAMES[(G.rnd() * NAMES.length) | 0];
// the shift is dealt, not drawn: fixed shares of each kind of job, spread through the shift, shuffled a little;
// the target is a share of what the shift's jobs could tip (so skill decides it, not the luck of the mix)
function plan(G) { const c = G.cfg, R = G.rnd, n = c.jobs, kinds = [];
  const w = c.clean ? { bags: 0.3, food: 0.3, towels: 0.18, clean: 0.22 } : c.towels ? { bags: 0.38, food: 0.38, towels: 0.24 } : { bags: 0.5, food: 0.5 };
  for (const k2 in w) for (let i = 0; i < Math.round(w[k2] * n); i++) kinds.push(k2); while (kinds.length < n) kinds.push('food'); kinds.length = n; kinds.sort(() => R() - 0.5);
  const span = c.shift - 14; G.sched = kinds.map((k2, i) => ({ k: k2, at: 1.5 + span * (i + R() * 0.8) / n, vip: R() < c.vip }));
  const pot = G.sched.reduce((a, s) => a + KINDS[s.k].tip * (s.vip ? 2 : 1) * 1.5, 0); c.target = Math.max(20, Math.round(pot * c.share / 5) * 5); G.clock = c.shift; }
// a request appears: bags at the desk (a guest waiting for a room), or a ring from an occupied room, or a room left dirty
function spawn(G, s) { const c = G.cfg, R = G.rnd; let room = null, kind = s.k;
  if (kind === 'clean') { const occ = G.rooms.filter(r => r.state === 'occ' && !G.reqs.some(q => q.room === r.id)); if (occ.length < 2) kind = 'food'; else { room = occ[(R() * occ.length) | 0]; room.state = 'dirty'; room.guest = null; G.ev.push({ k: 'checkout', room: room.id }); } }
  if (kind === 'bags' && !c.clean && !G.rooms.some(r => r.state === 'clean' && r.hold == null)) { const occ = G.rooms.filter(r => r.state === 'occ' && !G.reqs.some(q => q.room === r.id)); if (occ.length) { const r = occ[(R() * occ.length) | 0]; r.state = 'clean'; r.guest = null; G.ev.push({ k: 'checkout', room: r.id }); } }      // before level 3, housekeeping cleans after a check-out
  if (kind === 'food' || kind === 'towels') { const occ = G.rooms.filter(r => r.state === 'occ' && !G.reqs.some(q => q.room === r.id)); if (!occ.length) kind = 'bags'; else room = occ[(R() * occ.length) | 0]; }
  const K = KINDS[kind], q = { id: G.nid++, k: kind, room: room ? room.id : null, f: room ? room.f : 0, x: room ? room.x : DESK - 0.12 + (G.reqs.filter(r => r.k === 'bags').length % 3) * 0.06, vip: s.vip && kind !== 'clean', pat: K.pat * c.patK * (s.vip ? 0.75 : 1), t: 0, got: false, guest: kind === 'bags' ? guestName(G) : room && room.guest };
  q.max = q.pat; G.reqs.push(q); G.ev.push({ k: 'req', q }); return q; }
function step(G, dt) { if (G.over) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  const c = G.cfg;
  if (!G.lesson) { G.clock -= dt; while (G.sched.length && G.sched[0].at <= c.shift - G.clock) spawn(G, G.sched.shift()); }
  else lessonTick(G, dt);
  // patience
  for (const q of G.reqs) { if (q.k === 'clean' && G.reqs.every(r => r.k !== 'bags')) { q.t += dt * 0.3; } else q.t += dt; if (q.t >= q.pat && !q.gone) expire(G, q); }
  G.reqs = G.reqs.filter(q => !q.gone);
  move(G, dt);
  if (!G.lesson) { if (G.rating < 3) return finish(G, false, 'rating'); if (G.clock <= 0) return finish(G, G.tips >= c.target); } }
function expire(G, q) { q.gone = true; G.lost++; if (q.k === 'bags') G.me.carry = G.me.carry.filter(it => it.job !== q.id);
  G.rating = Math.max(0, G.rating - 0.6 - (q.vip ? 0.4 : 0)); G.combo = 0; G.ev.push({ k: 'expire', q }); lessonSee(G, 'expire', q); }
// ---------- what you can do: send the attendant yourself ----------
const STOPS = 3;
// what is at a place in the hotel (floor, x along it): a guest's bags, the desk, the kitchen, the laundry, a room
function placeAt(G, f, x) { f = Math.round(f);
  if (f <= 0) { const q = G.reqs.filter(r => !r.gone && r.k === 'bags' && !r.got && Math.abs(r.x - x) < 0.07).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]; if (q) return { place: 'desk', f: 0, x: q.x, job: q.id, key: 'desk' + q.id };
    if (Math.abs(x - KITCHEN) < 0.115) return { place: 'kitchen', f: 0, x: KITCHEN, key: 'kitchen' }; if (Math.abs(x - LAUNDRY) < 0.115) return { place: 'laundry', f: 0, x: LAUNDRY, key: 'laundry' }; if (Math.abs(x - DESK) < 0.14) return { place: 'desk', f: 0, x: DESK, key: 'desk' }; return null; }
  const r = G.rooms.filter(r2 => r2.f === f && Math.abs(r2.x - x) < 0.125).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]; return r ? { place: 'room', f: r.f, x: r.x, room: r.id, key: 'room' + r.id } : null; }
function tapAt(G, f, x) { if (G.over || G.wait > 0) return false; const st = placeAt(G, f, x); return st ? goTo(G, st) : false; }
// line a stop up (three at most); a stop already lined up is cancelled by tapping it again
function goTo(G, st) { const i = G.route.findIndex(s2 => s2.key === st.key); if (i >= 0) { if (i === 0 && G.me.work > 0) return false; G.route.splice(i, 1); G.ev.push({ k: 'cancel', st }); return true; }
  if (G.route.length >= STOPS) { G.ev.push({ k: 'full' }); return false; } G.route.push(st); G.ev.push({ k: 'go', st, n: G.route.length }); return true; }
function move(G, dt) { const me = G.me, c = G.cfg; me.walk = 0;
  if (me.work > 0) { me.work -= dt; if (me.work <= 0) { me.work = 0; const r = G.rooms[me.workRoom], q = G.reqs.find(x => !x.gone && x.k === 'clean' && x.room === r.id); r.state = 'clean'; G.route.shift(); if (q) done(G, q); else G.ev.push({ k: 'cleaned', room: r.id }); } return; }
  const g = G.route[0]; if (!g) return;
  // the route: along the floor to the lift, up or down, then along to the place
  if (Math.abs(me.f - g.f) > 0.001) { if (Math.abs(me.x - LIFT) > 0.005) { walkTo(G, LIFT, dt); return; } const d = g.f - me.f, s2 = c.lift * dt; me.f = Math.abs(d) <= s2 ? g.f : me.f + Math.sign(d) * s2; me.inLift = true; if (me.f === g.f) G.ev.push({ k: 'ding', f: g.f }); return; }
  me.inLift = false; me.f = g.f; if (Math.abs(me.x - g.x) > 0.005) { walkTo(G, g.x, dt); return; }
  arrive(G, g); if (!(me.work > 0) && G.route[0] === g) G.route.shift(); }
// there: what happens depends on the place, on what is in your hands, and on who is waiting
function arrive(G, st) { const me = G.me, c = G.cfg, free = () => c.hands - me.carry.length;
  if (st.place === 'kitchen' || st.place === 'laundry') { const k2 = st.place === 'kitchen' ? 'food' : 'towels', want = G.reqs.filter(q => !q.gone && q.k === k2).length, have = me.carry.filter(it => it.k === k2).length;
    if (have > want) { let n = have - want; me.carry = me.carry.filter(it => it.k !== k2 || n-- <= 0); G.ev.push({ k: 'putback', place: st.place }); return; }      // a plate nobody is waiting for goes back
    const n = Math.min(want - have, free()); if (n <= 0) { G.ev.push({ k: 'nothing', place: st.place, full: want > have }); return; }
    for (let i = 0; i < n; i++) me.carry.push({ k: k2 }); G.ev.push({ k: 'pickup', kind: k2, n }); if (n > 1) G.ev.push({ k: 'two', n }); lessonSee(G, 'pickup', { k: k2 }); return; }
  if (st.place === 'desk') { const open = G.reqs.filter(q => !q.gone && q.k === 'bags' && !q.got), q = open.find(r => r.id === st.job) || open.sort((a, b) => (a.pat - a.t) - (b.pat - b.t))[0];
    if (!q || free() <= 0) { G.ev.push({ k: 'nothing', place: 'desk', full: !!q }); return; } me.carry.push({ k: 'bags', job: q.id }); q.got = true; G.ev.push({ k: 'pickup', kind: 'bags', n: 1 }); lessonSee(G, 'pickup', q); return; }
  const r = G.rooms[st.room], q = G.reqs.find(x => !x.gone && x.room === r.id);
  if (q && q.k !== 'clean') { const i = me.carry.findIndex(it => it.k === q.k); if (i >= 0) { me.carry.splice(i, 1); return done(G, q); } return wrong(G, r, me.carry.length ? 'item' : 'empty', q); }
  if (r.state === 'dirty') { me.work = KINDS.clean.work; me.workRoom = r.id; G.ev.push({ k: 'cleaning', q, room: r.id }); return; }
  const bi = me.carry.findIndex(it => it.k === 'bags'); if (bi >= 0 && r.state === 'clean') { const bq = G.reqs.find(x => x.id === me.carry[bi].job && !x.gone); me.carry.splice(bi, 1); r.state = 'occ'; r.guest = bq ? bq.guest : guestName(G); if (bq) done(G, bq); return; }
  return wrong(G, r, bi >= 0 ? 'taken' : me.carry.length ? 'item' : 'empty', null); }
// the wrong door: bags to a room that is taken, a plate where nobody rang, a knock with nothing in your hands
function wrong(G, r, why, q) { G.rating = Math.max(0, G.rating - (why === 'empty' ? 0.15 : 0.3)); G.combo = 0; G.wrongs++; if (q) q.t += q.pat * 0.06; G.ev.push({ k: 'wrong', room: r.id, why }); lessonSee(G, 'wrong'); }
function walkTo(G, x, dt) { const me = G.me, s = G.cfg.sp * dt, d = x - me.x; me.face = Math.sign(d) || me.face; me.x = Math.abs(d) <= s ? x : me.x + Math.sign(d) * s; me.walk = 1; }
function done(G, q) { q.gone = true; if (q.k === 'clean') G.rooms[q.room].state = 'clean';
  const K = KINDS[q.k], left = clamp(1 - q.t / q.pat, 0, 1), chain = G.t - G.lastDone < 5 ? G.combo + 1 : 0; G.combo = chain; G.lastDone = G.t;
  const tip = Math.round(K.tip * (q.vip ? 2 : 1) * (0.3 + left * 1.7) * (1 + Math.min(4, chain) * 0.15)); G.tips += tip; G.served++;
  if (left > 0.5) G.rating = Math.min(5, G.rating + 0.15);
  G.ev.push({ k: 'done', q, tip, fast: left > 0.6, chain }); lessonSee(G, 'done', q); }
function finish(G, win, why) { const c = G.cfg; if (G.lesson) return; G.over = win ? 'won' : 'lost';
  const stars = win ? 1 + (G.tips >= c.target * 1.25 ? 1 : 0) + (G.rating >= 4.5 ? 1 : 0) : 0;
  G.res = { win, stars, tips: G.tips, target: c.target, rating: +G.rating.toFixed(1), served: G.served, lost: G.lost, wrongs: G.wrongs, why: why || (win ? '' : 'tips'), coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const holds = (G, k2) => G.me.carry.some(it => it.k === k2);
const LESSONS = {
  1: [{ id: 'bags', title: 'BAGS UP', say: G => holds(G, 'bags') ? 'TAP THE GREEN ROOM' : 'TAP THE 🧳', do: 'tap', how: 'Tap the guest\'s bags, then a clean room.', need: 2 }],
  2: [{ id: 'food', title: 'ROOM SERVICE', say: G => holds(G, 'food') ? 'TAP THE 🍝 ROOM' : 'TAP THE KITCHEN', do: 'tap', how: 'Tap the kitchen, then the room that rang.', need: 2 }],
  3: [{ id: 'clean', title: 'A CLEAN ROOM', say: G => G.rooms.some(r => r.state === 'dirty') ? 'TAP THE 🧹 ROOM' : holds(G, 'bags') ? 'TAP THE GREEN ROOM' : 'TAP THE 🧳', do: 'tap', how: 'Clean the dirty room, then take the guest up.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G); G.reqs = []; G.route = []; G.me.carry = []; G.me.work = 0;
  if (st.id === 'bags') { const fr = (G.rnd() * G.rooms.length) | 0; G.rooms.forEach((r, i) => { r.state = i === fr ? 'clean' : 'occ'; r.guest = i === fr ? null : guestName(G); }); spawn(G, { k: 'bags' }); }      // one free room: the green one
  if (st.id === 'food') { G.rooms.forEach((r, i) => { r.state = i % 3 === 2 ? 'clean' : 'occ'; r.guest = guestName(G); }); spawn(G, { k: 'food' }); }
  if (st.id === 'clean') { G.rooms.forEach(r => { r.state = 'occ'; r.guest = guestName(G); }); spawn(G, { k: 'clean' }); spawn(G, { k: 'bags' }); }
  G.reqs.forEach(q => q.pat = q.max = 90); }
function lessonTick(G) { if (!G.reqs.length && !G.lessonWait) { G.lessonWait = true; G.wait = 0.8; G.next = () => { G.lessonWait = false; if (lessonNow(G)) lessonSetup(G); }; } }
function lessonSee(G, what, q) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (what === 'wrong' || what === 'expire') ok = false;
  else if (what === 'done') ok = st.id === 'food' ? q.k === 'food' : q.k === 'bags' ? true : null;
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.reqs.forEach(r => r.gone = true); G.route = []; G.me.carry = []; G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.reqs.forEach(r => r.gone = true); G.route = []; G.wait = 1.6; G.lessonEnd = true;
    G.next = () => { G.lessonEnd = false; setup(G); plan(G); G.ev.push({ k: 'start' }); }; } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look taps somewhere in the hotel (most places are the wrong door, and the rating goes)
const BLIND = { t: G => tapAt(G, Math.random() * (G.cfg.floors + 0.5) - 0.25, Math.random()) };
// an attendant who looks: with something in the hands, takes it where it is wanted (the one that will run out first, if it can be
// reached in time); with empty hands, goes for what the most pressing guest needs (the kitchen, the laundry, the desk, a dirty
// room when a guest is waiting for one). One stop at a time, as a person does.
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  if (G.over || G.wait > 0) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; if (G.route.length || G.me.work > 0) return; mem.t = 0.15 + react * 1.2;
  const me = G.me, c = G.cfg, open = G.reqs.filter(q => !q.gone), tt = (f1, x1) => me.f === f1 ? Math.abs(x1 - me.x) / c.sp : (Math.abs(me.x - LIFT) + Math.abs(x1 - LIFT)) / c.sp + Math.abs(f1 - me.f) / c.lift + 0.3;
  const go = st => { if (Math.random() > acc) { if (Math.random() < 0.3) BLIND.t(G); else mem.t += 0.5; return; } goTo(G, st); },      /* a tap that misses mostly lands on nothing (the places are big); sometimes on the wrong door */ roomStop = r => ({ place: 'room', f: r.f, x: r.x, room: r.id, key: 'room' + r.id }), left = q => q.pat - q.t;
  const cleanRooms = G.rooms.filter(r => r.state === 'clean'), dirty = G.rooms.filter(r => r.state === 'dirty');
  const src = k2 => ({ place: k2 === 'food' ? 'kitchen' : 'laundry', f: 0, x: srcX(k2), key: k2 === 'food' ? 'kitchen' : 'laundry' }), nHold = k2 => me.carry.filter(it => it.k === k2).length, bag = me.carry.find(it => it.k === 'bags');
  // what is wanted that is not yet in the hands (a plate for each room ringing, a guest at the desk when there is a room to give)
  const need = [];
  for (const k2 of ['food', 'towels']) { const qs = open.filter(q => q.k === k2).sort((a, b) => left(a) - left(b)); if (qs.length > nHold(k2)) { const q = qs[nHold(k2)]; need.push({ st: src(k2), left: left(q) - (q.vip ? 6 : 0), cost: tt(0, srcX(k2)) + 6 + q.f * 2 }); } else if (nHold(k2) > qs.length) return go(src(k2)); }      // (a plate nobody wants any more goes back)
  if (!bag) for (const q of open) if (q.k === 'bags' && !q.got && (cleanRooms.length || !dirty.length)) need.push({ st: { place: 'desk', f: 0, x: q.x, job: q.id, key: 'desk' + q.id }, left: left(q) - (q.vip ? 6 : 0), cost: tt(0, q.x) + 8 });
  const waiting = open.some(x => x.k === 'bags') && !cleanRooms.length;
  for (const q of open) if (q.k === 'clean') { const r = G.rooms[q.room]; need.push({ st: roomStop(r), clean: true, left: left(q) - (waiting ? 40 : 0), cost: tt(r.f, r.x) + KINDS.clean.work }); }
  // where what is in the hands is wanted
  const cands = [];
  for (const k2 of ['food', 'towels']) if (nHold(k2)) for (const q of open) if (q.k === k2) cands.push({ st: roomStop(G.rooms[q.room]), left: left(q) });
  if (bag) { const bq = open.find(q => q.id === bag.job); if (cleanRooms.length) { const r = cleanRooms.sort((a, b) => tt(a.f, a.x) - tt(b.f, b.x))[0]; cands.push({ st: roomStop(r), left: bq ? left(bq) : 5 }); } else if (dirty.length) cands.push({ st: roomStop(dirty.sort((a, b) => tt(a.f, a.x) - tt(b.f, b.x))[0]), left: bq ? left(bq) - KINDS.clean.work : 5 }); }
  cands.sort((a, b) => (a.left - tt(a.st.f, a.st.x)) - (b.left - tt(b.st.f, b.st.x)));
  const fetch = need.filter(n => !n.clean), room = c.hands - me.carry.length;
  // in the lobby with a hand to spare: fetch the next thing before going up (one trip for two rooms); otherwise deliver; otherwise fetch or clean
  if (cands.length && !(room > 0 && me.f === 0 && fetch.length && cands[0].left - tt(cands[0].st.f, cands[0].st.x) > 9)) return go(cands[0].st);
  const pool0 = cands.length ? fetch : need, can = pool0.filter(n => n.cost < n.left), pool = can.length ? can : pool0; if (!pool.length || (room <= 0 && !pool.some(n => n.clean))) return;
  pool.sort((a, b) => a.left - b.left); go((room > 0 ? pool : pool.filter(n => n.clean))[0].st); }
function srcX(k2) { return k2 === 'food' ? KITCHEN : k2 === 'towels' ? LAUNDRY : DESK; }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.tips = G.cfg.target + 10; finish(G, true); }
