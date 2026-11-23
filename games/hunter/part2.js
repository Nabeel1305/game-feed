// ===================== RULES: Hunter (game 13) =====================
// The intense one. Ice-age grassland, first person, crouched in the tall grass with a spear. Two thumbs:
//   left thumb held down: creep forward. Lift it to freeze. When the animal flicks its ears and raises its head, it is about to
//   look: be still, or it sees you, and if it sees enough it bolts.
//   right thumb: pull back and let go to throw; a mark on the ground shows where the spear will land. The closer you are, the
//   steadier your aim. Hit the chest (heart and lungs) to bring it down; the haunch only wounds it and it runs.
//   sometimes a cave lion stalks you: a growl from one side; tap that side to face it. It leaps: SWIPE to dodge. It lands past you
//   and stumbles: TAP, TAP, TAP to spear it. It turns and comes again until it is dead (23 Nov 2026, his words: "if a lion's gonna
//   attack me, you have to show me, boom, lion attacking you, swipe to dodge... then tap to hit, tap to hit... I have to defeat that
//   lion. It can't just attack me and leave me alone"). A leap you do not dodge mauls you (a life), and it still comes again.
//   (22 Nov 2026: the controls were rebuilt to his note: a stick to creep or run, a crosshair moved by the right thumb, a THROW
//   button, and taps instead of swipes for the lion.)
// World: metres; you start at x 0, z 0 facing -z (game z grows away from you); y is up.

const RULES = [
  '<b>Left thumb: the stick.</b> Push it gently to creep, all the way to run (it hears running). Up is towards the animal, sideways steps round it. Let go to freeze.',
  '<b>Freeze when it looks.</b> Its ears flick and its head comes up first. Move while it watches and it sees you; see enough and it bolts.',
  '<b>Not too close.</b> Every animal has a distance it will not let you inside (the metres turn red): go in and it runs, or turns on you.',
  '<b>Right thumb: drag to move the crosshair, tap THROW.</b> It turns green on the chest. Closer is steadier.',
  '<b>Hit the chest</b> to bring it down. A haunch only wounds it, a miss scares it off.',
  '<b>A boar, a bison or the mammoth may charge.</b> Keep still until DIVE ASIDE shows, then push the stick hard to one side. It runs past and stands winded: throw then.',
  '<b>A growl? A cave lion.</b> Tap the side it growls from to face it. When it leaps, <b>swipe</b> to dodge; then <b>tap, tap, tap</b> to spear it before it turns. It keeps coming until it is dead.',
  'Bring down the animals asked for. Three escapes or maulings and the hunt is over.',
];
const WEATHERS = ['golden', 'morning', 'overcast', 'mist', 'dawn', 'sunset', 'storm', 'noon', 'rain', 'dusk'];
function weatherOf(N) { if (N <= 2) return ['golden', 'morning'][N - 1]; const R = rng(N * 3001 + 7); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const KINDS = [
  { id: 'deer', name: 'Red Deer', from: 1, body: 1.0, vital: 0.27, speed: 9, look: 1, hp: 1, shy: 7.5, temper: 0 },
  { id: 'horse', name: 'Wild Horse', from: 3, body: 1.15, vital: 0.28, speed: 11, look: 1.1, hp: 1, shy: 8.5, temper: 0 },
  { id: 'boar', name: 'Wild Boar', from: 4, body: 0.8, vital: 0.17, speed: 8, look: 0.9, hp: 1, shy: 6.5, temper: 0.75 },
  { id: 'bison', name: 'Steppe Bison', from: 8, body: 1.5, vital: 0.32, speed: 8, look: 0.8, hp: 2, shy: 7, temper: 0.6 },
];
const MAMMOTH = { id: 'mammoth', name: 'Woolly Mammoth', body: 2.6, vital: 0.5, speed: 6.5, look: 0.7, hp: 3, shy: 9, temper: 0.85 };
// (23 Nov 2026, his review: "the animal just waits for me to kill it it should run away or even attack if I run or come too close or
// throw a spear".) Every animal has a distance it will not let you inside (`shy`): move inside it and it notices at once, sit well
// inside it and it smells you. A deer or a horse runs. A boar, a bison or the mammoth may turn on you instead (`temper`): it paws
// the ground (`threat`), then charges. Wait until it has committed to its line, then dive aside with the stick (too early and it
// follows you). A dodged animal runs past and stands winded a few metres off, head down: your best throw of the hunt.

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, boss, help: !!help,
    goal: boss ? 1 : N <= 3 ? 1 : N <= 9 ? 2 : 3, lives: 3,
    start: x(32, 46, 30),                                         // how far off the animal is when the stalk begins (m)
    notice: x(1.2, 5.0, 30) * (1 - 0.35 * e) * (help ? 0.8 : 1),   // how fast it sees you moving while it looks
    tell: (x(0.6, 0.22, 30) + 0.15 * e) * (help ? 1.25 : 1),
    sudden: x(0, 0.3, 40),                                         // chance a look comes with no warning at all       // ears and head come up this long before it looks
    graze: [x(2.6, 1.6, 25), x(5.5, 3.6, 25)],                     // seconds of grazing between looks
    lookT: [x(1.1, 1.5, 25), x(2.0, 3.0, 25)],                     // seconds it looks for
    lion: N >= 3 ? Math.min(0.6, 0.18 + f * 0.012) : 0,            // chance a cave lion comes during a stalk
    leap: (x(0.8, 0.45, 25) + 0.12 * e) * (help ? 1.2 : 1),         // how long you have to swipe aside when it leaps
    open: (x(1.7, 1.15, 25) + 0.15 * e) * (help ? 1.2 : 1),         // how long it stumbles after a dodge: the moment to spear it
    lionHp: 5 + Math.min(5, Math.floor(f / 10)),                    // spear thrusts it takes
    growl: x(2.2, 1.3, 25),
    shy: x(1.0, 1.25, 30) * (1 - 0.1 * e),                        // how wide the ring it will not let you inside is
    threat: (x(1.1, 0.6, 30) + 0.25 * e) * (help ? 1.25 : 1),       // seconds it paws the ground before it charges
    commit: x(8, 5, 30) + 2 * e + (help ? 1.5 : 0) };               // metres out at which a charging animal stops following you: the dive must come after this                                       // seconds from the growl to the leap
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), me: { x: 0, z: 0, yaw: 0, creep: false, moved: 0 }, a: null, spears: [], lion: null, kills: [], lives: cfg.lives, escapes: 0, maulings: 0, lionsKilled: 0, wounded: 0 };
  newAnimal(G);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function newAnimal(G) {
  const c = G.cfg, R = G.rnd, pool = KINDS.filter(k => k.from <= G.N), kind = c.boss && !G.kills.length ? MAMMOTH : pool[(R() * pool.length) | 0], L = lessonNow(G);
  const d = (L && L.near ? 22 : c.start) * (0.9 + 0.2 * R()), side = (R() * 2 - 1) * 0.25;
  G.a = { kind, x: G.me.x + Math.sin(side) * d, z: G.me.z + Math.cos(side) * d, face: R() * 6.28, st: 'graze', t: 0, next: c.graze[0] + R() * (c.graze[1] - c.graze[0]), alert: 0, hp: kind.hp, vx: 0, vz: 0, step: 0 };
  G.me.yaw = 0; G.ev.push({ k: 'animal', kind: kind.id });
}
const distA = G => Math.hypot(G.a.x - G.me.x, G.a.z - G.me.z);
// ---------- the thumbs ----------
function creep(G, on) { setMove(G, on ? 0.5 : 0, 0); }
const angry = a => a.st === 'threat' || a.st === 'charge' || a.st === 'pass';
// the left thumb's stick (22 Nov 2026, his note: "if you go slowly, you creep; if you go faster, you run"): fwd is towards the
// animal (negative backs away), side steps round it. A gentle push creeps; a full push runs: three times as fast, but it hears
// running even with its head down, and sees it at once when it looks.
function setMove(G, fwd, side) { if (G.over) return; const me = G.me, m = Math.hypot(fwd, side); me.creep = m > 0.12; me.run = m > 0.78; me.mf = m > 0.12 ? fwd / m : 0; me.ms = m > 0.12 ? side / m : 0; }
// a throw at a point on the ground (x, z); the spear flies there in an arc
function swayOf(G, d) { const A = (0.04 + 0.011 * Math.min(d, 16)) * (1 + Math.min(1, G.cfg.f / 40) * 0.3) * (lessonNow(G) ? 0.6 : 1); return { x: A * Math.sin(G.t * 2.1), z: A * Math.sin(G.t * 1.6 + 1.3) }; }
function throwAt(G, x, z) {
  if (G.over || G.spears.some(s => !s.done) || G.lion && G.lion.st !== 'gone' || angry(G.a)) return false;      // no time to throw at a charge (a blind thumb on THROW would win by it): the answer to a charge is the dive
  const me = G.me, R = G.rnd, d = Math.hypot(x - me.x, z - me.z); if (d < 2) return false;
  // no luck: the spear goes where the mark is when you let go. The mark sways (your arm), more the further you throw, but never so
  // much that a spear aimed at the middle of the animal finds its heart; and beyond 16 m a throw falls short.
  const sw = swayOf(G, d), short = Math.max(0, d - 16) * 0.65, ux = (x - me.x) / d, uz = (z - me.z) / d;
  const tx = x + sw.x - ux * short, tz = z + sw.z - uz * short, T = 0.25 + d / 26;
  G.spears.push({ x0: me.x, z0: me.z, tx, tz, T, t: 0, done: false });
  me.creep = false; G.ev.push({ k: 'throw', d }); return true;
}
// the lion fight: face it (tap its side), dodge the leap (a swipe), spear it while it stumbles (taps), until it is dead
const lionLive = G => G.lion && G.lion.st !== 'gone' && G.lion.st !== 'dead';
function turn(G, side) { const Ln = G.lion; if (G.over || !lionLive(G) || Ln.st !== 'stalk') return; G.me.face = side; G.ev.push({ k: 'turn', side }); }
function dodge(G, dir) { const Ln = G.lion; if (G.over || !lionLive(G) || Ln.st !== 'leap' || Ln.dodged) return false;
  if (G.me.face !== Ln.side) return false;      // you cannot dodge what you are not looking at
  Ln.dodged = true; Ln.st = 'open'; Ln.t = 0; Ln.dir = dir || 1; G.ev.push({ k: 'dodge', dir: Ln.dir }); return true; }
function hit(G) { const Ln = G.lion; if (G.over || !lionLive(G) || Ln.st !== 'open' || G.t - (Ln.lastHit || -9) < 0.11) return false;
  Ln.lastHit = G.t; Ln.hp--; G.ev.push({ k: 'lionhit', hp: Ln.hp, max: Ln.max });
  if (Ln.hp <= 0) { Ln.st = 'dead'; Ln.t = 0; G.lionsKilled++; G.ev.push({ k: 'lionkill' }); lessonSee(G, 'lion'); } return true; }
function brace(G) { const Ln = G.lion; if (!Ln) return; if (Ln.st === 'stalk') turn(G, Ln.side); else if (Ln.st === 'leap') dodge(G, 1); else hit(G); }      // one tap that does the right thing (the robots and old tests)
function maul(G, why) { const Ln = G.lion; G.maulings++; G.ev.push({ k: 'maul', why }); Ln.st = 'down'; Ln.t = 0; Ln.dodged = false; G.me.face = Ln.side;      // knocked down; it is still there
  if (lessonNow(G)) { lessonMiss(G, why); return; } G.lives--; if (G.lives <= 0) finish(G, false, 'maul'); }
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, me = G.me, a = G.a, R = G.rnd, L = lessonNow(G);
  // the lion: a growl from one side, then it comes; it leaps; a brace in that moment, facing it, kills it
  const Ln = G.lion;
  if (Ln && Ln.st !== 'gone') { Ln.t += dt;
    if (Ln.st === 'stalk' && Ln.t >= Ln.leapAt) { Ln.st = 'leap'; Ln.t = 0; Ln.dodged = false; G.ev.push({ k: 'leap', seen: me.face === Ln.side }); }
    else if (Ln.st === 'leap' && Ln.t >= c.leap * (L ? 1.8 : 1)) maul(G, me.face !== Ln.side ? 'wrongway' : 'late');
    else if (Ln.st === 'open' && Ln.t >= c.open * (L ? 1.6 : 1)) { Ln.st = 'circle'; Ln.t = 0; G.ev.push({ k: 'circle', hp: Ln.hp }); }
    else if (Ln.st === 'down' && Ln.t >= 1.3) { Ln.st = 'circle'; Ln.t = 0; G.ev.push({ k: 'circle', hp: Ln.hp }); }
    else if (Ln.st === 'circle' && Ln.t >= 1.4 + G.rnd() * 0.02) { Ln.st = 'leap'; Ln.t = 0; Ln.dodged = false; G.ev.push({ k: 'leap', seen: true }); }
    else if (Ln.st === 'dead' && Ln.t >= 1.6) { Ln.st = 'gone'; Ln.t = 0; }
    return; }
  if (!Ln && a.st !== 'flee' && a.st !== 'dead' && !angry(a) && c.lion && !L && R() < c.lion * dt / 25) { const side = R() < 0.5 ? -1 : 1; G.lion = { side, st: 'stalk', t: 0, leapAt: c.growl * (0.8 + 0.4 * R()), hp: c.lionHp, max: c.lionHp }; me.creep = false; me.face = 0; G.ev.push({ k: 'growl', side }); return; }
  if (L && L.lion && !Ln) { const side = R() < 0.5 ? -1 : 1; G.lion = { side, st: 'stalk', t: 0, leapAt: 2.6, hp: 4, max: 4 }; me.face = 0; G.ev.push({ k: 'growl', side }); return; }
  if (Ln && Ln.st === 'gone') { Ln.t += dt; if (Ln.t > 1.2) G.lion = null; }
  // creeping
  if (me.creep && a.st !== 'flee' && a.st !== 'dead') { const sp = me.run ? 3.2 : 1.15, d = Math.max(0.5, distA(G)), lk = a.st === 'charge' && a.locked, ux = lk ? -Math.sin(a.face) : (a.x - me.x) / d, uz = lk ? -Math.cos(a.face) : (a.z - me.z) / d, mf = me.mf == null ? 1 : me.mf, ms = me.ms || 0, chg = a.st === 'charge' || a.st === 'threat';      // (once it has committed, sideways is across ITS line, so a dive goes straight out of its way and not round it)
    const ss = chg ? (me.run ? 5.2 : 1.6) : sp * 0.8;      // a dive aside from a charge is quicker than a step round a grazing animal
    if ((d > 5 || mf < 0) && !chg) { me.x += ux * mf * sp * dt; me.z += uz * mf * sp * dt; } me.x += uz * ms * ss * dt; me.z -= ux * ms * ss * dt; me.moved = me.run ? 0.5 : 0.25; me.crept = true;
    if (me.run && !angry(a)) { a.alert += dt * 0.45 * (1 + 14 / Math.max(5, d)); G.ev.push({ k: 'heard' }); if (a.alert >= 1) { if (L) { a.alert = 0.4; lessonMiss(G, 'heard'); } else return provoke(G, 'heard'); } } }
  else me.moved = Math.max(0, me.moved - dt);
  // the animal: grazes (wandering a little), flicks its ears (the tell), looks; sees movement while it looks
  a.t += dt;
  if (a.st === 'graze') { const wv = a.winded > 0 ? 0 : 0.25; a.step += dt; a.x += Math.sin(a.face) * wv * dt; a.z += Math.cos(a.face) * wv * dt; if (a.step > 3) { a.step = 0; a.face += (R() - 0.5) * 1.6; }
    if (a.t >= a.next) { a.st = 'tell'; a.t = 0; a.sudden = !L && R() < c.sudden; G.ev.push({ k: 'tell' }); a.creptBefore = me.crept; me.crept = false; } }
  else if (a.st === 'tell') { if (a.t >= (a.sudden ? 0 : c.tell)) { a.st = 'look'; a.t = 0; a.lookFor = c.lookT[0] + R() * (c.lookT[1] - c.lookT[0]); G.ev.push({ k: 'look' }); } }
  else if (a.st === 'look') {
    const d = distA(G), seen = me.moved > 0 ? c.notice * a.kind.look * (1 + 12 / Math.max(4, d)) * 0.5 * (me.run ? 2.5 : 1) : 0;
    a.alert += seen * dt; if (seen) G.ev.push({ k: 'seen' });
    if (a.alert >= 1) { if (L) { a.alert = 0.4; lessonMiss(G, 'seen'); } else return provoke(G, 'seen'); }
    if (a.t >= a.lookFor) { a.st = 'graze'; a.t = 0; a.next = c.graze[0] + R() * (c.graze[1] - c.graze[0]); G.ev.push({ k: 'graze' }); if (a.alert < 0.25 && a.creptBefore) lessonSee(G, 'froze'); } }
  else if (a.st === 'flee') { a.x += a.vx * dt; a.z += a.vz * dt; if (a.t > 2.2) { if (G.over) return; newAnimal(G); } }
  else if (a.st === 'dead') { if (a.t > 2.6) { if (!G.lesson && G.kills.length >= c.goal) { finish(G, true); return; } newAnimal(G); } }
  // charging: it paws the ground, comes straight at you, and stops following you once it is close (it has committed)
  else if (a.st === 'threat') { a.face = Math.atan2(me.x - a.x, me.z - a.z); if (a.t >= c.threat) { a.st = 'charge'; a.t = 0; a.locked = false; G.ev.push({ k: 'charge' }); } }
  else if (a.st === 'charge') { const d = distA(G), v = a.kind.speed * 0.95;
    if (!a.locked) { a.face = Math.atan2(me.x - a.x, me.z - a.z); if (d <= c.commit) { a.locked = true; G.ev.push({ k: 'commit' }); } }
    const fx = Math.sin(a.face), fz = Math.cos(a.face); a.x += fx * v * dt; a.z += fz * v * dt;
    const along = (me.x - a.x) * fx + (me.z - a.z) * fz, lat = Math.abs((me.x - a.x) * fz - (me.z - a.z) * fx);
    if (along <= 0.6) { if (lat < 0.5 * a.kind.body + 0.4) return gored(G); a.st = 'pass'; a.t = 0; a.vx = fx * v; a.vz = fz * v; G.ev.push({ k: 'dodged' }); } }
  else if (a.st === 'pass') { const u = Math.max(0, 1 - a.t / 1.6); a.x += a.vx * u * dt; a.z += a.vz * u * dt; if (a.t >= 1.6) { a.st = 'graze'; a.t = 0; a.next = 4.5; a.alert = 0.3; a.step = 0; a.locked = false; a.winded = 4.5; G.ev.push({ k: 'winded' }); } }
  // too close: inside the ring it will not let you into, moving is noticed at once, and well inside it you are smelt even keeping still
  if (a.winded > 0) a.winded -= dt;      // winded after a charge it has no thought for you: this is the throw
  else if (a.st === 'graze' || a.st === 'tell' || a.st === 'look') { const d = distA(G), shy = a.kind.shy * c.shy;
    if (d < shy) { const close = 1 - d / shy, rate = me.moved > 0 ? 0.9 + 2.4 * close : d < shy * 0.72 ? 0.3 + 1.2 * close : 0;
      if (rate) { a.alert += (rate + 0.12) * dt; G.ev.push({ k: 'wary' }); if (a.alert >= 1) { if (L) { a.alert = 0.4; lessonMiss(G, 'close'); } else return provoke(G, 'close'); } } } }
  if (a.st !== 'look') a.alert = Math.max(0, a.alert - dt * 0.12);
  // spears in flight
  for (const s of G.spears) if (!s.done) { s.t += dt; if (s.t >= s.T) { s.done = true; land(G, s); } }
}
function land(G, s) {
  const a = G.a, k2 = a.kind; if (a.st === 'dead') return;
  if (angry(a)) { G.ev.push({ k: 'missed', x: s.tx, z: s.tz, still: true }); return; }      // a spear already in the air when it turned on you
  const vx = a.x + Math.sin(a.face) * k2.body * 0.5, vz = a.z + Math.cos(a.face) * k2.body * 0.5;      // the chest is well forward of the middle: a spear at the middle only wounds
  const dv = Math.hypot(s.tx - vx, s.tz - vz), db = Math.hypot(s.tx - a.x, s.tz - a.z);
  if (dv < k2.vital * (1 - Math.min(0.3, G.cfg.f / 150)) * (lessonNow(G) ? 1.3 : 1)) { a.hp--; s.hit = 'vital'; G.ev.push({ k: 'hit', vital: true, x: s.tx, z: s.tz });
    if (a.hp <= 0) { a.st = 'dead'; a.t = 0; G.kills.push({ id: k2.id, name: k2.name, d: Math.round(Math.hypot(s.tx - s.x0, s.tz - s.z0)) }); G.ev.push({ k: 'kill', kind: k2.id, n: G.kills.length }); lessonSee(G, 'kill'); return; }
    a.alert = 1; return provoke(G, 'hurt', true); }
  if (db < k2.body * 0.75) { G.wounded++; s.hit = 'body'; a.lame = true; G.ev.push({ k: 'hit', vital: false, x: s.tx, z: s.tz }); return provoke(G, 'wounded'); }
  G.ev.push({ k: 'missed', x: s.tx, z: s.tz }); provoke(G, 'missed');
}
// what it does when it has had enough of you: a deer or a horse runs; a boar, a bison or the mammoth may turn on you
function provoke(G, why, stillHurt) { const a = G.a, k2 = a.kind;
  if (!lessonNow(G) && k2.temper && a.st !== 'flee' && a.st !== 'dead' && !angry(a) && G.rnd() < k2.temper * (why === 'hurt' || why === 'wounded' ? 1.3 : 1)) {
    a.st = 'threat'; a.t = 0; a.alert = 1; a.face = Math.atan2(G.me.x - a.x, G.me.z - a.z); G.ev.push({ k: 'threat', why }); return; }
  return bolt(G, why, stillHurt); }
function gored(G) { const a = G.a; G.maulings++; G.escapes++; a.st = 'flee'; a.t = 0; a.vx = Math.sin(a.face) * a.kind.speed; a.vz = Math.cos(a.face) * a.kind.speed; G.ev.push({ k: 'gored' }); G.lives--; if (G.lives <= 0) finish(G, false, 'gored'); }
function bolt(G, why, stillHurt) {
  const a = G.a, L = lessonNow(G); if (a.st === 'flee') return;
  if (L && !stillHurt) { a.alert = 0.3; a.st = 'graze'; a.t = 0; a.next = 2; lessonMiss(G, why); G.ev.push({ k: 'calm' }); return; }
  if (stillHurt && a.hp > 0) { a.st = 'graze'; a.t = 0; a.next = 0.8; a.alert = 0.6; G.ev.push({ k: 'staggers' }); return; }      // a big beast takes more than one spear
  a.st = 'flee'; a.t = 0; const away = Math.atan2(a.x - G.me.x, a.z - G.me.z) + (G.rnd() - 0.5); a.face = away; a.vx = Math.sin(away) * a.kind.speed; a.vz = Math.cos(away) * a.kind.speed;
  G.escapes++; G.ev.push({ k: 'bolt', why });
  G.lives--; if (G.lives <= 0) finish(G, false, why);
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, why, stars: win ? (G.lives === c.lives ? 3 : G.lives === c.lives - 1 ? 2 : 1) : 0, kills: G.kills.length, goal: c.goal, lions: G.lionsKilled, combo: 0, best: G.kills.reduce((m, q) => Math.max(m, q.d), 0), time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'freeze', title: 'CREEP, AND FREEZE WHEN IT LOOKS', how: 'Push the stick gently (left thumb) to creep. When its ears flick and its head comes up, let go and keep still.', need: 2, ok: w => w === 'froze', creepNeeded: true },
      { id: 'throw', title: 'THROW AT THE CHEST', how: 'Drag your right thumb to put the crosshair on its chest, just behind the front legs (it turns green). Tap THROW.', need: 1, ok: w => w === 'kill', near: 1 }],
  2: [{ id: 'close', title: 'GET CLOSE, THEN THROW', how: 'Creep in, freezing each time it looks, then throw while the metres are green. Go too close (red) and it runs.', need: 2, ok: w => w === 'kill' }],
  3: [{ id: 'lion', title: 'A LION!', how: 'Tap the side the growl comes from to face it. When it leaps, SWIPE to dodge. Then TAP, TAP, TAP to spear it. It comes again until it is dead.', need: 1, ok: w => w === 'lion', lion: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); if (lessonNow(G).near) newAnimal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.lion = null; G.kills.length = 0; G.lives = G.cfg.lives; G.escapes = 0; G.ev.push({ k: 'lessondone', N: G.N }); G.me.x = G.me.z = 0; newAnimal(G); }
  else { G.ev.push({ k: 'lessonnext' }); if (lessonNow(G).near) newAnimal(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: creep, freeze, throw at the animal's middle (it knows where, not when), throw anywhere, turn left, turn right, brace.
const BLIND = {
  H: G => creep(G, true), S: G => creep(G, false),
  T: G => throwAt(G, G.a.x, G.a.z), A: G => throwAt(G, G.me.x + (Math.random() - 0.5) * 20, G.me.z + 5 + Math.random() * 30),
  L: G => turn(G, -1), R: G => turn(G, 1), D: G => dodge(G, Math.random() < 0.5 ? -1 : 1), B: G => hit(G),
};
// HONEST: creeps while it grazes, freezes on the tell (late by react), throws at the chest from a comfortable range, faces a growl
// and braces on the leap (late by react).
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, a = G.a, Ln = G.lion, t = G.t;
  const seen = (key, cond) => { if (!cond) { mem[key] = null; return false; } if (mem[key] == null) mem[key] = t; return t - mem[key] >= react; };
  if (Ln && Ln.st !== 'gone') { creep(G, false); setMove(G, 0, 0); if (Ln.st === 'stalk' && seen('growl', true) && G.me.face !== Ln.side) turn(G, Math.random() < acc ? Ln.side : -Ln.side);
    if (seen('leap', Ln.st === 'leap')) { dodge(G, Math.random() < 0.5 ? -1 : 1); mem.leap = null; }
    if (Ln.st === 'open' && seen('open', true) && t - (mem.hitT || -9) > 0.14 + (1 - acc) * 0.35) { hit(G); mem.hitT = t; } if (Ln.st !== 'open') mem.open = null; return; }
  mem.growl = mem.leap = mem.open = null;
  // a charge: keeps still until it has committed, then dives (late by react)
  if (a.st === 'threat' || a.st === 'charge') { if (a.locked && seen('lock', true)) { if (!mem.side) mem.side = Math.random() < 0.5 ? -1 : 1; setMove(G, 0, mem.side); } else creep(G, false); return; }
  mem.side = null; mem.lock = null;
  if (a.st === 'flee' || a.st === 'dead' || a.st === 'pass' || G.spears.some(s => !s.done)) { creep(G, false); return; }
  const warn = a.st === 'tell' || a.st === 'look', d = distA(G), range = 9 + 5 * acc;
  if (warn) { if (seen('tell', true)) creep(G, false); else if (Math.random() > acc * 1.03) creep(G, d > range); }
  else { mem.tell = null; creep(G, d > range); }      // in range it keeps still (an animal winded after a charge is close: moving would set it off again)
  if (d < range && !warn && seen('aim', true)) { const k2 = a.kind, vx = a.x + Math.sin(a.face) * k2.body * 0.5, vz = a.z + Math.cos(a.face) * k2.body * 0.5, e = (1 - acc) * 1.4;
    throwAt(G, vx + Math.sin(a.face) * 0.25 * (0.25 + d / 26) + (Math.random() - 0.5) * e, vz + Math.cos(a.face) * 0.25 * (0.25 + d / 26) + (Math.random() - 0.5) * e); mem.aim = null; }
}
function winNow(G) { if (!G || G.over || G.a.st === 'dead') return; G.lesson = null; G.lion = null; while (G.kills.length < G.cfg.goal - 1) G.kills.push({ id: 'deer', name: 'Red Deer', d: 10 }); const a = G.a; a.hp = 1; a.st = 'graze'; a.next = 99;
  G.spears.push({ x0: G.me.x, z0: G.me.z, tx: a.x + Math.sin(a.face) * a.kind.body * 0.5, tz: a.z + Math.cos(a.face) * a.kind.body * 0.5, T: 0.05, t: 0, done: false }); }
