// ===================== RULES: Grand Hotel (game 48, his idea) =====================
// You are the hotel's attendant, the only one on shift. The hotel is a cutaway: the lobby at the bottom (the front desk, the
// kitchen, the laundry) and floors of rooms above, with a lift up the left side. Requests pop up as bubbles, each with a ring
// that empties as the guest loses patience: a new guest at the desk (carry their bags up to a clean room), a room ringing for
// food (fetch it from the kitchen) or towels (from the laundry), and a room left dirty after a check-out (clean it, or the next
// guest has nowhere to go). Tap a bubble to take the job; you can hold three jobs in your head, done in the order you took
// them, and your hands carry two things. Fetching two dishes in one kitchen trip, or taking jobs on the same floor together,
// is how you keep up. Fast service earns big tips; a guest left waiting too long costs the hotel a star. Make the shift's
// tips target before the clock runs out; if the hotel's rating falls under two stars, the manager sends you home.
const RULES = [
  'Requests pop up as <b>bubbles</b>: a guest at the desk 🧳, food 🍝, towels 🧺, a dirty room 🧹. The ring is their <b>patience</b>.',
  '<b>Tap a bubble</b> to take the job. You hold <b>three jobs</b>, done in the order you took them. Your hands carry <b>two</b> things.',
  'Food comes from the <b>kitchen</b>, towels from the <b>laundry</b>. Take two of the same and you fetch both in <b>one trip</b>.',
  'A new guest needs a <b>clean room</b>: clean rooms after check-out. Fast service, <b>big tips</b>; too slow costs a ★.',
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
    share: x(0.75, 0.57, 30) * (help ? 0.85 : 1), vip: N >= 4 ? x(0.1, 0.25, 30) : 0, towels: N >= 2, clean: N >= 3, hands: 2 + upLv('trolley'), sp: 0.42 * (1 + 0.1 * upLv('shoes')), lift: 1.1 * (1 + 0.25 * upLv('lift')), target: 0 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, nid: 1, wait: 0 };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { plan(G); G.ev.push({ k: 'start' }); }
  return G; }
function setup(G) { const c = G.cfg; G.rooms = []; for (let f = 1; f <= c.floors; f++) COLS.forEach((x, i) => G.rooms.push({ id: G.rooms.length, f, x, no: f * 100 + i + 1, state: 'clean', guest: null }));
  G.me = { f: 0, x: 0.42, carry: [], work: 0, face: 1, walk: 0 }; G.reqs = []; G.queue = []; G.tips = 0; G.rating = 5; G.served = 0; G.lost = 0; G.combo = 0; G.lastDone = -9; G.clock = 1e9; G.sched = []; G.best = 0;
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
function expire(G, q) { q.gone = true; G.lost++; const promised = G.queue.includes(q.id); q.promised = promised; G.queue = G.queue.filter(id => id !== q.id); G.me.carry = G.me.carry.filter(it => it.job !== q.id);
  if (q.k === 'bags') { const r = G.rooms.find(r2 => r2.hold === q.id); if (r) r.hold = null; }
  G.rating = Math.max(0, G.rating - (promised ? 1.0 : 0.6) - (q.vip ? 0.4 : 0));      /* a job you took and then failed costs twice: you promised */ G.combo = 0; G.ev.push({ k: 'expire', q }); lessonSee(G, 'expire', q); }
// ---------- what you can do: tap a request to take the job ----------
function take(G, id) { if (G.over || G.wait > 0) return false; const q = G.reqs.find(r => r.id === id && !r.gone); if (!q) return false;
  if (G.queue.includes(id)) return false; if (G.queue.length >= 3) { G.ev.push({ k: 'full' }); return false; }
  G.queue.push(id); G.ev.push({ k: 'take', q }); return true; }
function drop(G, id) { const q = G.reqs.find(r => r.id === id); if (!G.queue.includes(id) || !q || q.got || (G.me.work > 0 && G.me.workOn === id)) return false; G.queue = G.queue.filter(j => j !== id); q.t += q.pat * 0.3; G.rating = Math.max(0, G.rating - 0.25); G.ev.push({ k: 'drop', q }); lessonSee(G, 'drop', q); return true; }      // let go of a job not yet started: the guest was told you were coming
// a tap at a place in the hotel (floor, x): a request there, or nothing
function tapAt(G, f, x) { const q = G.reqs.filter(r => !r.gone && Math.round(f) === r.f && Math.abs(r.x - x) < 0.085).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (q) { if (G.queue.includes(q.id)) return drop(G, q.id); return take(G, q.id); } return false; }
// where the attendant must go next for the first job (fetching from the kitchen or laundry first, or the bags from the desk)
function srcX(k2) { return k2 === 'food' ? KITCHEN : k2 === 'towels' ? LAUNDRY : DESK; }
function goal(G) { const id = G.queue[0], q = G.reqs.find(r => r.id === id); if (!q) { G.queue.shift(); return null; } const K = KINDS[q.k];
  if (q.k === 'clean') { const r = G.rooms[q.room]; return { f: r.f, x: r.x, act: 'clean', q }; }
  const has = G.me.carry.find(it => it.job === q.id);
  if (!has) { if (G.me.carry.length >= G.cfg.hands) return { f: G.me.f, x: G.me.x, act: 'full', q }; if (q.k === 'bags') { return { f: 0, x: q.x, act: 'pickup', q }; } return { f: 0, x: srcX(q.k), act: 'pickup', q }; }
  if (q.k === 'bags') { let r = G.rooms.find(r2 => r2.hold === q.id); if (!r) { const free = G.rooms.filter(r2 => r2.state === 'clean' && r2.hold == null).sort((a, b) => a.f - b.f); r = free[0]; if (!r) return { f: G.me.f, x: G.me.x, act: 'noroom', q }; r.hold = q.id; } return { f: r.f, x: r.x, act: 'deliver', q, room: r }; }
  const r = G.rooms[q.room]; return { f: r.f, x: r.x, act: 'deliver', q, room: r }; }
function move(G, dt) { const me = G.me, c = G.cfg; me.walk = 0;
  if (me.work > 0) { me.work -= dt; if (me.work <= 0) { const q = G.reqs.find(r => r.id === me.workOn); me.work = 0; if (q) done(G, q); } return; }
  const g = goal(G); if (!g) return; if (g.act === 'noroom') { if (!G.noroomT || G.t - G.noroomT > 3) { G.noroomT = G.t; G.ev.push({ k: 'noroom' }); } rotate(G); return; } if (g.act === 'full') { rotate(G); return; }
  // the route: along the floor to the lift, up or down, then along to the place
  if (Math.abs(me.f - g.f) > 0.001) { if (Math.abs(me.x - LIFT) > 0.005) { walkTo(G, LIFT, dt); return; } const d = g.f - me.f, s = c.lift * dt; me.f = Math.abs(d) <= s ? g.f : me.f + Math.sign(d) * s; me.inLift = true; if (me.f === g.f) G.ev.push({ k: 'ding', f: g.f }); return; }
  me.inLift = false; me.f = g.f; if (Math.abs(me.x - g.x) > 0.005) { walkTo(G, g.x, dt); return; }
  // there: do it
  if (g.act === 'pickup') { const room = c.hands - me.carry.length;
    if (g.q.k === 'bags') { me.carry.push({ job: g.q.id, k: 'bags' }); g.q.got = true; G.ev.push({ k: 'pickup', q: g.q }); return; }
    // fetch for every job you hold that needs this place (two dishes, one trip)
    const want = G.queue.map(id => G.reqs.find(r => r.id === id)).filter(q => q && q.k === g.q.k && !me.carry.some(it => it.job === q.id)).slice(0, room);
    for (const q of want) { me.carry.push({ job: q.id, k: q.k }); q.got = true; } G.ev.push({ k: 'pickup', q: g.q, n: want.length }); if (want.length > 1) { G.ev.push({ k: 'two', n: want.length }); lessonSee(G, 'two'); } return; }
  if (g.act === 'deliver') { me.carry = me.carry.filter(it => it.job !== g.q.id); if (g.q.k === 'bags') { g.room.state = 'occ'; g.room.guest = g.q.guest; g.room.hold = null; } done(G, g.q); return; }
  if (g.act === 'clean') { me.work = KINDS.clean.work; me.workOn = g.q.id; G.ev.push({ k: 'cleaning', q: g.q }); } }
// a job that cannot be done yet (no clean room, hands full) goes to the back of the list
function rotate(G) { if (G.queue.length > 1) G.queue.push(G.queue.shift()); }
function walkTo(G, x, dt) { const me = G.me, s = G.cfg.sp * dt, d = x - me.x; me.face = Math.sign(d) || me.face; me.x = Math.abs(d) <= s ? x : me.x + Math.sign(d) * s; me.walk = 1; }
function done(G, q) { q.gone = true; G.queue = G.queue.filter(id => id !== q.id); if (q.k === 'clean') G.rooms[q.room].state = 'clean';
  const K = KINDS[q.k], left = clamp(1 - q.t / q.pat, 0, 1), chain = G.t - G.lastDone < 5 ? G.combo + 1 : 0; G.combo = chain; G.lastDone = G.t;
  const tip = Math.round(K.tip * (q.vip ? 2 : 1) * (0.3 + left * 1.7) * (1 + Math.min(4, chain) * 0.15)); G.tips += tip; G.served++;
  if (left > 0.5) G.rating = Math.min(5, G.rating + 0.15);
  G.ev.push({ k: 'done', q, tip, fast: left > 0.6, chain }); lessonSee(G, 'done', q); }
function finish(G, win, why) { const c = G.cfg; if (G.lesson) return; G.over = win ? 'won' : 'lost';
  const stars = win ? 1 + (G.tips >= c.target * 1.25 ? 1 : 0) + (G.rating >= 4.5 ? 1 : 0) : 0;
  G.res = { win, stars, tips: G.tips, target: c.target, rating: +G.rating.toFixed(1), served: G.served, lost: G.lost, why: why || (win ? '' : 'tips'), coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'bags', title: 'BAGS UP', how: 'Two guests at the desk. Tap the VIP\'s 🧳 (the gold one) first: you carry the bags up to a clean room. Then the other. Twice.', need: 2 }],
  2: [{ id: 'two', title: 'ONE TRIP', how: 'Two rooms want food. Tap BOTH 🍝 bubbles before you reach the kitchen, and you fetch both plates in one trip. Do it twice.', need: 2 }],
  3: [{ id: 'clean', title: 'A CLEAN ROOM', how: 'Every room is full or dirty and a guest is waiting. Tap the 🧹 dirty room first, then the guest\'s 🧳. Twice.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonSetup(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSetup(G) { const st = lessonNow(G); G.reqs = []; G.queue = []; G.me.carry = []; G.me.work = 0;
  if (st.id === 'bags') { G.rooms.forEach((r, i) => { r.state = i < 3 ? 'occ' : 'clean'; r.hold = null; }); spawn(G, { k: 'bags' }); spawn(G, { k: 'bags', vip: true }); if (G.rnd() < 0.5) { const a = G.reqs[0].x; G.reqs[0].x = G.reqs[1].x; G.reqs[1].x = a; } G.reqs.forEach(q => q.pat = q.max = 60); G.firstDone = null; }
  if (st.id === 'two') { G.rooms.forEach((r, i) => { r.state = i % 3 === 2 ? 'clean' : 'occ'; r.guest = guestName(G); }); spawn(G, { k: 'food' }); spawn(G, { k: 'food' }); G.reqs.forEach(q => q.pat = q.max = 60); G.me.f = 1; G.me.x = 0.8; G.twoSeen = false; }
  if (st.id === 'clean') { G.rooms.forEach(r => { r.state = 'occ'; r.guest = guestName(G); r.hold = null; }); spawn(G, { k: 'clean' }); spawn(G, { k: 'bags' }); G.reqs.forEach(q => q.pat = q.max = 70); } }
function lessonTick(G) { const st = lessonNow(G); if (!G.reqs.length && !G.lessonWait) { G.lessonWait = true; G.wait = 0.8; G.next = () => { G.lessonWait = false; if (lessonNow(G)) lessonSetup(G); }; } }
function lessonSee(G, what, q) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'bags') { if (what === 'done' && q.k === 'bags') { if (G.firstDone == null) { G.firstDone = q.vip; if (!q.vip) ok = false; else return; } else if (G.reqs.some(r => !r.gone)) return; else ok = !!G.firstDone; } if (what === 'expire' || what === 'drop') ok = false; }
  if (st.id === 'two') { if (what === 'two') { G.twoSeen = true; return; } if (what === 'done' && q.k === 'food') { if (G.reqs.some(r => !r.gone && r.k === 'food')) return; ok = !!G.twoSeen; } if (what === 'expire' || what === 'drop') ok = false; }
  if (st.id === 'clean') { if (what === 'done' && q.k === 'bags') ok = true; if (what === 'expire' || what === 'drop') ok = false; }
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.reqs.forEach(r => r.gone = true); G.ev.push({ k: 'lessonmiss', how: what === 'drop' ? 'You let that job go. Tap a bubble once and the job is yours.' : st.id === 'bags' && what === 'done' ? 'The VIP (the gold bubble) goes first: they tip double and wait less.' : st.id === 'two' ? 'Tap both 🍝 bubbles FIRST, then the kitchen gives you both plates at once.' : st.how }); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.reqs.forEach(r => r.gone = true); G.wait = 1.6; G.lessonEnd = true;
    G.next = () => { G.lessonEnd = false; setup(G); plan(G); G.ev.push({ k: 'start' }); }; } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look taps somewhere in the hotel (it may land on a bubble and take or drop that job)
const BLIND = { t: G => tapAt(G, Math.random() * (G.cfg.floors + 0.5) - 0.25, Math.random()) };
// an attendant who looks: takes the jobs that will run out first and lie on the way, two of a kind together, a dirty room
// when a guest is waiting for one; holds two jobs, takes a third when it is on the way
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  if (G.over || G.wait > 0) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.3 + react * 1.6;
  if (G.queue.length >= 3) return; const open = G.reqs.filter(q => !q.gone && !G.queue.includes(q.id)); if (!open.length) return;
  const held = G.queue.map(id => G.reqs.find(r => r.id === id)).filter(Boolean), me = G.me, cleanFree = G.rooms.some(r => r.state === 'clean' && r.hold == null);
  if (held.length >= 2 && !open.some(q => held.some(h => h.k === q.k && q.k !== 'bags' && q.k !== 'clean' && !h.got))) return;
  const tt = (f0, x0, f1, x1) => f0 === f1 ? Math.abs(x1 - x0) / G.cfg.sp : (Math.abs(x0 - LIFT) + Math.abs(x1 - LIFT)) / G.cfg.sp + Math.abs(f1 - f0) / G.cfg.lift + 0.3;
  const via = q => q.k === 'clean' ? null : q.k === 'bags' ? { f: 0, x: q.x } : { f: 0, x: srcX(q.k) }, roomOf = q => q.k === 'bags' ? (G.rooms.find(r => r.state === 'clean' && r.hold == null) || G.rooms[0]) : G.rooms[q.room];
  const eta = q => { let f = me.f, x = me.x, T = 0; for (const h of held.concat([q])) { const v = via(h); if (v && !h.got) { T += tt(f, x, v.f, v.x); f = v.f; x = v.x; } const r = roomOf(h); T += tt(f, x, r.f, r.x) + (h.k === 'clean' ? KINDS.clean.work : 0.2); f = r.f; x = r.x; } return T; };
  const score = q => { const left = q.pat - q.t, d = Math.abs(q.f - me.f) * 1.6 + Math.abs(q.x - me.x) * 2.4; let s = 20 / Math.max(3, left) - d * 0.5 + (q.vip ? 1 : 0);
    if (held.some(h => h.k === q.k && q.k !== 'bags' && q.k !== 'clean' && !h.got)) s += 3; if (q.k === 'clean' && !cleanFree && G.reqs.some(r => r.k === 'bags')) s += 4; if (q.k === 'bags' && !cleanFree && !held.some(h => h.k === 'clean')) s -= 3; if (eta(q) > left * 0.92) s -= 100; return s; };
  const best = open.sort((a, b) => score(b) - score(a))[0]; if (score(best) < -50) return;      // nothing it can promise in time
  if (Math.random() > acc) { BLIND.t(G); return; } take(G, best.id); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.tips = G.cfg.target + 10; finish(G, true); }
