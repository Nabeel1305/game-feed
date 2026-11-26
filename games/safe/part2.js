
// ===================== RULES: Safecracker (game 57, mine for set 10: a quiet heist) =====================
// A safe door with a dial. Drag your thumb round the dial to turn it. Somewhere on the dial is the next number of the
// combination: turn SLOWLY and, as that number passes the pointer, the lock CLICKS (a thump you hear and feel, a gold pulse on
// the listening strip) and a chalk mark appears on the dial at that number. Turn back until the chalk mark sits under the
// pointer and tap SET. Right: a bolt slides back. Wrong: the lock jams and the ALARM rises. All the bolts back: the door swings
// open. Turn too fast and you cannot feel the click, and you make NOISE; noise fills up and the dog barks (alarm). From level 3
// a GUARD does his rounds: footsteps, then his torch sweeps the room: lift your thumb and keep still until it has gone. Open
// the safe before dawn. Later: bigger dials, more numbers, a quicker guard, and a lock that RELOCKS a bolt on a wrong number.
const RULES = [
  '<b>Drag round the dial</b> to turn it. Turn <b>slowly</b>: when the right number passes the top, the lock <b>CLICKS</b> and leaves a chalk mark.',
  'Turn back until the <b>chalk mark</b> is under the pointer, then tap <b>SET</b>. A bolt slides back.',
  'A wrong number jams the lock: the <b>ALARM</b> rises. Too fast and you make <b>NOISE</b>: the dog barks.',
  '<b>Footsteps?</b> The guard is coming. Lift your thumb and <b>keep still</b> while his torch sweeps the room.',
  'Open every bolt before <b>dawn</b>. Stars for no alarm and time to spare.',
];
const PLACES = [{ name: "The Jeweller's", wall: '#3a2430', trim: '#8a5a3a' }, { name: 'The Bank', wall: '#22303a', trim: '#7a7a6a' }, { name: 'The Museum', wall: '#2a3424', trim: '#9a8a5a' }, { name: 'The Casino', wall: '#3a1a1a', trim: '#b08a3a' }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const SAFES = [{ name: 'WALL SAFE', loot: '💵' }, { name: 'OFFICE SAFE', loot: '💰' }, { name: 'STRONGBOX', loot: '💎' }, { name: 'THE VAULT', loot: '🥇' }];
const UPGRADES = [
  { id: 'steth', name: 'Stethoscope', desc: 'Feel the click turning a little faster.', max: 2, cost: l => 35 + l * 45 },
  { id: 'gloves', name: 'Soft gloves', desc: 'Turning makes less noise.', max: 2, cost: l => 35 + l * 45 },
  { id: 'lookout', name: 'A lookout', desc: 'Hear the guard coming sooner.', max: 1, cost: l => 60 },
  { id: 'charm', name: 'Lucky charm', desc: 'Your first wrong number each job is free.', max: 1, cost: l => 80 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Pickpocket'], [40, 'Sneak'], [130, 'Cat burglar'], [320, 'Safecracker'], [700, 'Master thief'], [1500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  const M = Math.round(x(40, 100, 25) / 10) * 10, n = Math.min(5, 2 + (N >= 3) + (N >= 8) + (N >= 18)), feel = x(9, 5.5, 30) * Math.sqrt(M / 40) * (1 + 0.12 * upLv('steth')) * (help ? 1.15 : 1);
  const need = n * (M * 0.55 / (feel * 0.7) + 3.5), guard = N >= 3, gap = x(17, 9, 30);
  return { N, f, help: !!help, place: placeOf(N), kind: n <= 2 ? 0 : n === 3 ? 1 : n === 4 ? 2 : 3, M, n, feel, quiet: feel * 1.25 * (1 + 0.15 * upLv('gloves')),
    time: Math.round(need * (x(2.3, 0.8, 30) + 0.4 * e + (help ? 0.35 : 0)) + (guard ? need / gap * 4 : 0)), guard, gap, warn: x(2.8, 1.2, 30) + 0.7 * upLv('lookout') + (help ? 0.5 : 0), torch: x(2.5, 3.4, 30),
    wrong: x(0.3, 0.4, 30) * (help ? 0.8 : 1), relock: N >= 8, charm: upLv('charm') > 0 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.n = o.n || c.n; G.combo = []; let prev = (R() * c.M) | 0;
  for (let i = 0; i < G.n; i++) { let v; do v = (R() * c.M) | 0; while (Math.abs(((v - prev + c.M * 1.5) % c.M) - c.M / 2) > c.M * 0.3); G.combo.push(v); prev = v; }      /* each number a good way round from the one before */
  G.pos = 0; G.k = 0; G.mark = null; G.spd = 0; G.moved = 0; G.noise = 0; G.alarm = 0; G.left = c.time; G.wrongs = 0; G.free = c.charm ? 1 : 0; G.spotted = 0; G.barks = 0; G.clicks = 0;
  G.gd = { s: 'away', t: o.guardAt != null ? o.guardAt : c.guard ? c.gap * (0.6 + 0.5 * R()) : 1e9, tm: 0 }; G.wave = []; G.useGuard = o.guard != null ? o.guard : c.guard; G.useTime = o.time != null ? o.time : true; }
const reading = G => ((Math.round(G.pos) % G.cfg.M) + G.cfg.M) % G.cfg.M;
const target = G => G.combo[G.k];
// ---------- what you do ----------
function turnDial(G, d) { if (G.over || G.wait > 0 || !d) return false; const c = G.cfg, M = c.M, a = G.pos, b = a + d; G.pos = b; G.moved += Math.abs(d);
  if (G.gd.s === 'torch') { G.gd.mv += Math.abs(d); if (G.gd.mv > 0.6) seen(G); }
  const lo = Math.min(a, b), hi = Math.max(a, b), T = target(G); let ticks = Math.floor(hi) - Math.floor(lo); if (ticks > 0) G.ev.push({ k: 'tick', n: Math.min(ticks, 5) });
  const first = Math.ceil((lo - T) / M) * M + T; if (first > lo && first <= hi) {
    if (G.spd <= c.feel) { G.mark = T; G.clicks++; G.wave.push({ t: G.t, big: 1 }); G.ev.push({ k: 'click' }); lessonSee(G, 'click'); }
    else { G.wave.push({ t: G.t, big: 0.25 }); G.ev.push({ k: 'muffle' }); } }
  return true; }
function setNum(G) { if (G.over || G.wait > 0) return false; if (G.gd.s === 'torch') { seen(G); return false; }
  if (reading(G) === target(G)) { G.k++; G.mark = null; G.ev.push({ k: 'set', i: G.k - 1, of: G.n }); lessonSee(G, 'set');
    if (G.k >= G.n) { G.ev.push({ k: 'open' }); lessonSee(G, 'open'); if (!G.lesson) { G.wait = 1.0; G.next = () => finish(G, true); } }
    return true; }
  G.ev.push({ k: 'wrong', num: reading(G) }); fault(G, 'wrong'); return false; }
function seen(G) { G.gd.s = 'away'; G.gd.t = G.cfg.gap * (0.7 + 0.5 * G.rnd()); G.ev.push({ k: 'spotted' }); fault(G, 'spotted'); }
// every mistake comes through here: during a lesson it costs nothing (only the lesson's own test can send you back)
function fault(G, why) { if (G.lesson) { const st = lessonNow(G); if ((st.id === 'freeze' && why === 'spotted') || (st.id === 'quiet' && why === 'bark')) lessonMiss(G); return; }
  if (why === 'wrong') { G.wrongs++; if (G.free > 0) { G.free--; G.ev.push({ k: 'charm' }); return; } G.alarm += G.cfg.wrong; if (G.cfg.relock && G.k > 0) { G.k--; G.mark = null; G.ev.push({ k: 'relock' }); } }
  if (why === 'spotted') { G.spotted++; G.alarm += 0.45; }
  if (why === 'bark') { G.barks++; G.alarm += 0.25; }
  if (G.alarm >= 0.999) { G.alarm = 1; G.ev.push({ k: 'alarm' }); G.wait = 0.9; G.next = () => finish(G, false, 'alarm'); } }
function finish(G, win, why) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg;
  const stars = win ? 1 + (G.alarm < 0.01 ? 1 : 0) + (G.left >= c.time * 0.35 ? 1 : 0) : 0, loot = win ? Math.round((40 + 25 * c.n + c.M / 2) * (1 + stars * 0.25)) : 0;
  G.res = { win, why: why || (win ? null : 'dawn'), stars, loot, k: G.k, n: G.n, wrongs: G.wrongs, spotted: G.spotted, barks: G.barks, left: Math.max(0, Math.round(G.left)), time: c.time, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + G.k };
  G.ev.push({ k: win ? 'won' : 'lost', why: G.res.why }); return true; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } G.moved = 0; return; }
  const c = G.cfg; G.spd += (G.moved / dt - G.spd) * (1 - Math.exp(-dt / 0.15)); G.moved = 0;
  if (G.spd > c.quiet) G.noise += (G.spd - c.quiet) / c.quiet * 0.9 * dt; else G.noise = Math.max(0, G.noise - 0.12 * dt);
  if (G.noise >= 1) { G.noise = 0.45; G.ev.push({ k: 'bark' }); fault(G, 'bark'); if (G.over || G.wait > 0) return; }
  if (G.useGuard) { const g = G.gd; g.t -= dt;
    if (g.s === 'away' && g.t <= 0) { g.s = 'warn'; g.t = c.warn; G.ev.push({ k: 'warn' }); }
    else if (g.s === 'warn' && g.t <= 0) { g.s = 'torch'; g.t = c.torch; g.mv = 0; G.ev.push({ k: 'torch' }); }
    else if (g.s === 'torch' && g.t <= 0) { g.s = 'away'; g.t = c.gap * (0.7 + 0.5 * G.rnd()); G.ev.push({ k: 'gone' }); lessonSee(G, 'gone'); } }
  if (G.useTime && !G.lesson) { G.left -= dt; if (G.left <= 0) { G.left = 0; finish(G, false, 'dawn'); return; } }
  while (G.wave.length && G.t - G.wave[0].t > 3) G.wave.shift(); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'feel', title: 'FEEL THE CLICK', say: G => safeCue(G)[0], do: G => safeCue(G)[1], at: G => safeCue(G)[2], how: 'Drag round the dial, slowly. When it CLICKS, a chalk mark appears. Turn back until the mark is under the pointer, then tap SET.', need: 1 }],
  2: [{ id: 'quiet', title: 'SOFTLY', say: G => safeCue(G)[0], do: G => safeCue(G)[1], at: G => safeCue(G)[2], how: 'Too fast and you miss the click, and you make noise. Open both bolts without the noise bar filling up.', need: 1 }],
  3: [{ id: 'freeze', title: 'KEEP STILL', say: G => safeCue(G)[0], do: G => safeCue(G)[1], at: G => safeCue(G)[2], how: 'Footsteps! When the torch comes, lift your thumb and keep perfectly still until it has gone.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); if (st.id === 'feel') setup(G, { n: 1, guard: false }); if (st.id === 'quiet') setup(G, { n: 2, guard: false }); if (st.id === 'freeze') setup(G, { n: 3, guard: true, guardAt: 3 }); }
function lessonMiss(G) { const st = lessonNow(G); G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.4; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return; let ok = null;
  if ((st.id === 'feel' || st.id === 'quiet') && what === 'open') ok = true;
  if (st.id === 'freeze' && what === 'gone') ok = true;
  if (!ok) return;
  G.lesson.i++; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look or listen: nudge the dial one way or the other, or tap SET
const BLIND = { r: G => turnDial(G, 1), l: G => turnDial(G, -1), s: G => setNum(G) };
// a player who looks and listens: turns at a steady pace under the feel limit (a little too fast now and then), notices a click
// after `react`, turns back to the chalk mark, slowing as it gets near, and sets it (sometimes one off); freezes for the torch
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said TURN
// SLOWLY… TAP SET (two things) with a hand sliding left and right in a box, which does not turn a round dial. Now: TURN SLOWLY round the dial
// (the hand goes round it) until the click; TURN BACK TO THE MARK (the way to the chalk mark); TAP SET when the mark is under the pointer;
// LET GO! / KEEP STILL while the torch is on the door.
function safeCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const L = lay(), c = G.cfg, arc = (dir) => { const r = L.R * 0.8, a0 = -Math.PI / 2 + 0.5 * dir, a1 = a0 - 0.4 * dir; return [L.cx + Math.cos(a0) * r, L.cy + Math.sin(a0) * r, L.cx + Math.cos(a1) * r, L.cy + Math.sin(a1) * r]; };
  if (G.gd.s === 'warn' || G.gd.s === 'torch') return ui.drag ? ['LET GO!', 'release', [W / 2, H * 0.7]] : ['KEEP STILL', 'wait', false];
  if (G.mark == null) return ['TURN SLOWLY', 'drag', arc(1)];
  const M = c.M, diff = ((((G.mark - G.pos) % M) + M * 1.5) % M - M / 2);
  if (Math.abs(diff) > 0.3) return ['TURN TO THE MARK', 'drag', arc(Math.sign(diff))];
  return ['TAP SET', 'tap', [L.set.x + L.set.w / 2, L.set.y + L.set.h / 2]]; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, dt = 1 / 60, c = G.cfg;
  if (G.over || G.wait > 0) { mem.markT = 0; return; }
  if (G.gd.s === 'warn' || G.gd.s === 'torch') { mem.seen = (mem.seen || 0) + dt; if (mem.seen > react) return; } else mem.seen = 0;
  mem.pace = (mem.pace || 0) - dt; if (mem.pace <= 0) { mem.pace = 1; mem.v = c.feel * (0.55 + 0.25 * R()) * (R() > acc ? 1.5 : 1); mem.dir = mem.dir || 1; }
  let v = mem.v; if (G.noise > 0.55) v = Math.min(v, c.feel * 0.5);
  if (G.mark == null) { mem.markT = 0; mem.hold = 0; turnDial(G, mem.dir * v * dt); return; }
  mem.markT = (mem.markT || 0) + dt; if (mem.markT < react) { turnDial(G, mem.dir * v * dt); return; }
  const M = c.M, near = G.pos + ((((G.mark - G.pos) % M) + M * 1.5) % M - M / 2), diff = near - G.pos;
  if (Math.abs(diff) > 0.3) { mem.hold = 0; turnDial(G, Math.sign(diff) * Math.min(v, Math.abs(diff) * 5 + 0.8) * dt); return; }
  mem.hold = (mem.hold || 0) + dt; if (mem.hold < 0.15 + react * 0.5) return;
  if (R() > acc + (1 - acc) * 0.6) turnDial(G, R() < 0.5 ? 1 : -1);      /* a slip of the thumb: one off */
  mem.hold = 0; setNum(G); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.k = G.n; finish(G, true); }
