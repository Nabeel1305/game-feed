
// ===================== THE RULES: Sumo (his idea 21, 20 Nov 2026) =====================
// Two huge wrestlers in a clay ring. Force the other out of the ring, or off his feet. Left thumb: a floating stick that is
// always "toward him" when pushed up: up presses in, down backs off, sideways circles him. Right thumb: PUSH (tap: a shove;
// hold then let go: a big, tiring push), GRIP (hold while close: take his belt; let go to release), DODGE (a quick sidestep,
// then a moment to recover). Gripping, the stick drives him (up), pulls him (down) or turns you both (sideways).
// Weight and balance: everyone leans into what they push against. Take the support away (dodge, pull) from someone leaning
// hard and he falls forward; push someone off balance backward and he goes over. Stamina: pushing and gripping tire you;
// tired, you are easier to move. Each bout begins with a ready signal: charge (stick up), stand your ground (nothing),
// or sidestep (DODGE).
// World: metres; the ring's centre is (0, 0), its edge at RR; the camera looks at it from +z.
const RULES = [
  '<b>Left thumb</b>: push the stick <b>up to press in</b>, down to back off, sideways to circle him.',
  '<b>PUSH</b>: tap for a shove, <b>hold and let go</b> for a big push (tiring). <b>GRIP</b>: hold when close to take his belt.',
  'Gripping, the stick <b>drives</b> him (up), <b>pulls</b> him (down) or <b>turns</b> you both (sideways): turn to escape the edge.',
  '<b>DODGE</b>: a quick sidestep. Dodge or pull someone leaning in hard and he <b>falls forward</b>.',
  'At the start: <b>charge</b> (stick up), <b>stand firm</b> (nothing) or <b>sidestep</b> (DODGE).',
  'Out of the ring or off his feet: you win. Rapid tapping only tires you: <b>timing</b> wins.',
];
const RR = 2.3, BODY = 0.55;
const RIVALS = [
  { name: 'Ushiwaka', style: 'charger', col: 0x2a5ad8, look: 0, line: 'charges straight in' },
  { name: 'Iwamaru', style: 'anchor', col: 0x7a3a1a, look: 1, line: 'plants his feet and grabs your belt' },
  { name: 'Kawasemi', style: 'puller', col: 0x2a8a5a, look: 2, line: 'steps aside and pulls' },
  { name: 'Tetsuyama', style: 'anchor', col: 0x4a4a52, look: 3, line: 'is a wall' },
  { name: 'Raijin-maru', style: 'charger', col: 0xd8a020, look: 4, line: 'hits like thunder' },
  { name: 'Kitsune', style: 'puller', col: 0xd8641a, look: 5, line: 'tricks and pulls' },
  { name: 'Ozeki Taiga', style: 'mixed', col: 0x8a1a2a, look: 6, line: 'does everything well' },
];
const PLACES = [{ name: 'The Practice Stable' }, { name: 'Spring Basho' }, { name: 'Summer Basho' }, { name: 'Grand Tournament' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const SKINS = [{ id: 'black', name: 'Black belt', col: 0x1a1a1a, stars: 0 }, { id: 'purple', name: 'Purple', col: 0x5a2a8a, stars: 5 }, { id: 'red', name: 'Crimson', col: 0xb81a2a, stars: 12 },
  { id: 'teal', name: 'Teal', col: 0x1a7a7a, stars: 20 }, { id: 'gold', name: 'Gold', col: 0xd6a630, stars: 30 }, { id: 'white', name: 'White', col: 0xeeeeee, stars: 42 },
  { id: 'sky', name: 'Sky', col: 0x4aa8e8, stars: 56 }, { id: 'champ', name: 'Champion\'s rope', col: 0xf4f0e0, stars: 75 }];
const POSES = [{ id: 'stomp', name: 'Shiko stomp', stars: 0 }, { id: 'salt', name: 'Salt throw', stars: 8 }, { id: 'arms', name: 'Arms high', stars: 18 }, { id: 'bow', name: 'Deep bow', stars: 30 }];
const UPGRADES = [      // cosmetic and comfort only: every rival is beaten by skill (his rule)
  { id: 'pose', name: 'Victory poses', max: 3, cost: l => [40, 90, 160][l], desc: 'A new pose after a win (cosmetic).' },
  { id: 'crowd', name: 'Bigger crowd', max: 2, cost: l => [50, 120][l], desc: 'More spectators (cosmetic).' },
  { id: 'replay', name: 'Replay camera', max: 1, cost: l => [60][l], desc: 'A closer slow-motion replay (cosmetic).' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Jonokuchi'], [60, 'Jonidan'], [200, 'Sandanme'], [500, 'Makushita'], [1100, 'Juryo'], [2500, 'Yokozuna']];
// the level: a rival (or a tournament of three every fifth level); how sharp the rival is
function rivalFor(N, i = 0) { if (N <= 3) return RIVALS[[1, 0, 2][N - 1]]; const k2 = (N * 3 + i * 2) % RIVALS.length; return RIVALS[N >= 12 ? k2 : Math.min(5, (N - 1 + i) % 6)]; }
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), tour = N % 5 === 0;
  return { tour, bouts: tour ? 3 : 1, need: tour ? 2 : 1, skill: x(0.5, 0.72, 18) * (help ? 0.75 : 1), react: x(0.5, 0.3, 18) * (help ? 1.3 : 1), str: x(0.88, 1.05, 25) * (help ? 0.9 : 1) * (N === 1 ? 0.9 : N <= 3 ? 0.94 : 1), help: !!help, wind: 1.15 * (help ? 0.8 : 1) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null, mini: !!o.mini };
  G.bi = 0; G.wins = 0; G.losses = 0; G.log = []; bout(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function wrestler(o) { return Object.assign({ x: 0, z: 0, vx: 0, vz: 0, face: 0, lean: 0, side: 0, stam: 1, mass: 165, str: 1, plant: 1, grip: false, gripT: 0, hold: 0, pushCd: 0, dodge: 0, dodgeCd: 0, dodgeDir: 0, brace: 0, down: false, out: false, step: 0, inp: { sx: 0, sy: 0 }, edge: 0, act: '', actT: 0 }, o); }
function bout(G, o = {}) { const c = G.cfg, R = o.rival || rivalFor(G.N, G.bi); G.t = 0; G.yard = o.yard || null; G.rival = R;
  G.me = wrestler({ x: 0, z: 0.85, face: Math.PI, str: 1, mass: 170 }); G.op = wrestler({ x: 0, z: -0.85, face: 0, wind: c.wind, care: (R.style === 'charger' ? 0.2 : 0.45) * c.skill, str: c.str * (R.style === 'anchor' ? 1.0 : R.style === 'puller' ? 1.12 : R.style === 'charger' ? 1.22 : 1.04), plant: (R.style === 'anchor' ? 1.12 : R.style === 'puller' ? 1.05 : R.style === 'charger' ? 1.05 : 1) * c.str, mass: R.style === 'anchor' ? 185 : 165, style: R.style });
  G.phase = 'ready'; G.readyT = o.ready != null ? o.ready : 1.3; G.endWhy = null; G.ai = { t: 0, plan: null, rt: 0 }; G.minEdge = 9; G.finishBy = null; G.lastAct = { me: null, op: null }; G.ev.push({ k: 'ready', rival: R.name }); }
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const toward = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; return [dx / L, dz / L]; };
// ---------- your thumbs (the robot and the rival use the same) ----------
function stick(G, x, y) { const L = Math.hypot(x, y); G.me.inp.sx = L > 1 ? x / L : x; G.me.inp.sy = L > 1 ? y / L : y; }
function act(G, w, what, on) { if (G.over || G.wait > 0 || w.down || w.out || (w.stumble > 0 && what !== 'grip')) return false; const o = w === G.me ? G.op : G.me;
  if (what === 'grip') { if (on) { if (w.dodge > 0 || G.phase !== 'fight') { w.wantGrip = on; return false; } w.wantGrip = true; } else { w.wantGrip = false; if (w.grip) { w.grip = false; G.ev.push({ k: 'release', who: w === G.me ? 'me' : 'op' }); } } return true; }
  if (what === 'pushDown') { if (w.pushCd > 0) return false; w.pushing = 0.0001; return true; }
  if (what === 'pushUp') { if (!w.pushing) return false; const big = w.pushing >= 0.35; w.pushing = 0; return shove(G, w, o, big); }
  if (what === 'dodge') { if (w.dodgeCd > 0) return false; if (G.phase === 'ready') { w.henka = true; return true; } const [fx, fz] = toward(w, o), safe = (Math.hypot(w.x - fz * 0.75, w.z + fx * 0.75) < Math.hypot(w.x + fz * 0.75, w.z - fx * 0.75)) ? 1 : -1, sd = w === G.me && w.inp.sx ? Math.sign(w.inp.sx) : safe; w.dodge = 0.28; w.dodgeCd = 0.85; w.dodgeDir = sd; w.ddx = -fz * sd * 0.95 + fx * 0.3; w.ddz = fx * sd * 0.95 + fz * 0.3; /* a sidestep goes past him, a little forward, not out toward the straw */ if (o.lean > 0.6 && o.inp.sy > 0.2 && dist(w, o) < 1.6 && Math.hypot(o.vx, o.vz) > 1.2) { o.stumble = 0.55; o.stx = -fx; o.stz = -fz; o.lean = Math.min(o.lean, 0.85); } /* he was leaning on you: nothing there now */ if (w.grip) w.grip = false; if (o.grip) { o.grip = false; } G.ev.push({ k: 'dodge', who: w === G.me ? 'me' : 'op' }); G.lastAct[w === G.me ? 'me' : 'op'] = { k: 'dodge', t: G.t }; return true; }
  return false; }
function shove(G, w, o, big) { if (w.pushCd > 0 || G.phase !== 'fight') return false; const d = dist(w, o); w.pushCd = big ? 0.6 : 0.32; w.restT = 0.7; w.stam = Math.max(0, w.stam - (big ? 0.2 : 0.09)); w.act = big ? 'bigpush' : 'push'; w.actT = 0.25; w.lean += big ? 0.18 : 0.08;
  G.ev.push({ k: big ? 'bigpush' : 'push', who: w === G.me ? 'me' : 'op', hit: d < 1.45 });
  if (d < 1.45 && o.dodge <= 0) { const [fx, fz] = toward(w, o), sf = 0.25 + 0.75 * w.stam, res = (o.brace > 0 ? 0.55 : 1) / (o.plant * (o.inp.sy > 0.3 ? 1.15 : 1)), imp = (big ? 2.5 : 1.35) * w.str * sf * res * 170 / o.mass;
    o.vx += fx * imp; o.vz += fz * imp; if (o.stumble > 0) o.lean += big ? 0.8 : 0.6; else o.lean -= (big ? 0.42 : 0.2) * res * sf;      /* a shove on a man stumbling past puts him down */ if (o.grip) { o.grip = false; G.ev.push({ k: 'release', who: o === G.me ? 'me' : 'op' }); } G.lastAct[w === G.me ? 'me' : 'op'] = { k: big ? 'bigpush' : 'push', t: G.t }; }
  return true; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; const a = G.me, b = G.op;
  if (G.phase === 'ready') { G.readyT -= dt; if (G.lesson && G.lesson.dummy) dummy(G, dt); else if (!G.noAI) ai(G, dt); if (G.readyT <= 0) { G.phase = 'fight'; tachiai(G, a, b); tachiai(G, b, a); G.ev.push({ k: 'go' }); } return; }
  if (!G.lesson || !G.lesson.dummy) { if (!G.noAI) ai(G, dt); } else dummy(G, dt);      // (noAI: the tests' still partner)
  for (const w of [a, b]) { if (w.pushing) w.pushing += dt; w.pushCd = Math.max(0, w.pushCd - dt); w.dodgeCd = Math.max(0, w.dodgeCd - dt); w.brace = Math.max(0, w.brace - dt); w.actT = Math.max(0, w.actT - dt); if (w.wantGrip && !w.grip && w.dodge <= 0 && dist(w, w === a ? b : a) < 1.25) { w.grip = true; G.ev.push({ k: 'grip', who: w === a ? 'me' : 'op' }); } }
  const d = dist(a, b), [fx, fz] = toward(a, b), contact = d < 2 * BODY + 0.05;
  for (const [w, o, s] of [[a, b, 1], [b, a, -1]]) { const ux = fx * s, uz = fz * s, px = -uz, pz = ux, I = w.inp, sf = 0.45 + 0.55 * w.stam;
    // stumbling forward into the space where you were: he cannot stop it; over he goes unless it runs out first
    if (w.stumble > 0) { w.stumble -= dt; if (w.lean < 0.97) w.lean = Math.min(0.97, w.lean + dt * 0.9); w.vx = w.stx * 1.6; w.vz = w.stz * 1.6; if (w.stumble <= 0) w.lean = Math.min(w.lean, 0.5); continue; }
    // a sidestep
    if (w.dodge > 0) { w.dodge -= dt; w.x += w.ddx * 4.2 * dt; w.z += w.ddz * 4.2 * dt; continue; }
    // walking (heavy, but at once)
    const mx = ux * I.sy + px * I.sx, mz = uz * I.sy + pz * I.sx, gripping = w.grip || o.grip;
    if (!contact && !gripping) { const ac = w.lean > 0.5 ? 1.6 : 7;      /* overcommitted: his weight carries him on, he cannot turn */ w.vx += (mx * 1.9 - w.vx) * Math.min(1, dt * ac * 0.5); w.vz += (mz * 1.9 - w.vz) * Math.min(1, dt * ac * 0.5); }
    // tiring: pressing, gripping, turning; resting comes back
    const work0 = (contact && I.sy > 0.2 ? I.sy * 0.05 : 0) + (w.grip && I.sy < -0.6 ? 0.07 : 0) + (w.grip && Math.abs(I.sx) > 0.3 ? 0.06 : 0), work = work0 > 0 ? work0 + (w.grip ? 0.03 : 0) : 0; w.restT = Math.max(0, (w.restT || 0) - dt); w.stam = clamp(w.stam + dt * (work > 0 ? -work / (w.wind || 1) : w.restT > 0 ? 0 : (w.grip ? 0.14 : 0.28) * (w.wind || 1)), 0, 1);      // holding on without driving is half a rest
    // the lean comes back to upright (quicker with knees bent: no stick)
    w.lean += (0 - w.lean) * Math.min(1, dt * (Math.hypot(I.sx, I.sy) < 0.2 ? 2.4 : 1.4) * (w.stam * 0.5 + 0.5)); w.side *= Math.exp(-dt * (I.sy > 0.3 ? 0.7 : 1.8)); }      // stop driving and your feet find their balance
  // in contact: two weights against each other
  if (contact && a.dodge <= 0 && b.dodge <= 0) { const heel = w => { const e = RR - Math.hypot(w.x, w.z); return e < 0.9 ? 0.4 + 0.6 * Math.max(0, e) / 0.9 : 1; }, hA = heel(a), hB = heel(b);      // heels on the straw: less to push from
    for (const q of [a, b]) { q.footT = (q.footT || 0) - dt; if (q.footT <= 0) { q.footT = 0.8 + 0.6 * G.rnd(); q.foot = 1 + (G.rnd() - 0.5) * 0.16; } }      // footing shifts a little from moment to moment: no stand-off lasts
    const gA = 1 - 0.15 * Math.min(1, (a.giving || 0) / 2), gB = 1 - 0.15 * Math.min(1, (b.giving || 0) / 2);      // once your feet are going backwards they are hard to stop
    const driveA = Math.max(0, a.inp.sy) ** 3 * a.str * (0.45 + 0.55 * a.stam) * (a.grip ? 1.25 : 1) * hA * (a.foot || 1) * gA, driveB = Math.max(0, b.inp.sy) ** 3 * b.str * (0.45 + 0.55 * b.stam) * (b.grip ? 1.25 : 1) * hB * (b.foot || 1) * gB;
    const resA = gA * a.plant * (0.8 + 0.2 * a.stam) * (a.brace > 0 ? 1.6 : 1) * (a.inp.sy < -0.3 ? 0.6 : 1) * hA, resB = gB * b.plant * (0.8 + 0.2 * b.stam) * (b.brace > 0 ? 1.6 : 1) * (b.inp.sy < -0.3 ? 0.6 : 1) * hB;
    const pa = a.inp.sy > 0.2, pb = b.inp.sy > 0.2; let net = pa && pb ? driveA - driveB : pa ? Math.max(0, driveA - resB * 0.62) : pb ? -Math.max(0, driveB - resA * 0.62) : 0; net = Math.sign(net) * Math.max(0, Math.abs(net) - 0.05);      // pusher against pusher; standing firm only holds (it never moves the other)
    for (const q of [a, b]) q.stall = q.inp.sy > 0.2 && Math.abs(net) < 0.12 ? (q.stall || 0) + dt : 0;      // pushing and getting nowhere
    a.giving = net < -0.05 ? (a.giving || 0) + dt : Math.max(0, (a.giving || 0) - dt * 2); b.giving = net > 0.05 ? (b.giving || 0) + dt : Math.max(0, (b.giving || 0) - dt * 2);
    const v = net * 3.0; a.vx += (fx * v - a.vx) * Math.min(1, dt * 5); a.vz += (fz * v - a.vz) * Math.min(1, dt * 5); b.vx = a.vx; b.vz = a.vz;
    // not held and not driving: you can still shuffle sideways round him (circling away from the straw)
    if (!a.grip && !b.grip) for (const [w, sg] of [[a, 1], [b, -1]]) if (w.inp.sy <= 0.2 && Math.abs(w.inp.sx) > 0.3) { const sp = w.inp.sx * 0.9 * (0.45 + 0.55 * w.stam) * dt; w.x += -fz * sg * sp; w.z += fx * sg * sp; }
    // leaning into it; the one being moved back is pushed off balance (his feet scrape)
    a.lean += (driveA * 0.4 * (1 - (a.care || 0)) - a.lean) * dt * 1.5; b.lean += (driveB * 0.4 * (1 - (b.care || 0)) - b.lean) * dt * 1.5;      // a careful pusher keeps his weight over his feet if (net > 0.05) { b.lean -= net * dt * 0.55; b.scrape = 0.2; } if (net < -0.05) { a.lean += net * dt * 0.55; a.scrape = 0.2; }
    // gripping: pull (down) and turn (sideways)
    for (const [w, o, s] of [[a, b, 1], [b, a, -1]]) { if (!w.grip) continue; const I = w.inp;
      if (I.sy < -0.6) { const pull = (-I.sy - 0.4) / 0.6 * w.str * (0.45 + 0.55 * w.stam), k3 = 0.1 + Math.max(0, o.lean - 0.3) * 5 + (o.inp.sy > 0.3 ? 0.3 : 0); o.lean += pull * dt * 0.8 * k3 / o.plant; w.vx = -fx * s * pull * 0.18; w.vz = -fz * s * pull * 0.18; o.vx = w.vx; o.vz = w.vz; if (o.lean > 0.6 && !w.pullSaid) { w.pullSaid = true; G.lastAct[w === a ? 'me' : 'op'] = { k: 'pull', t: G.t }; } } else w.pullSaid = false;
      if (Math.abs(I.sx) > 0.3) { const om = I.sx * 1.5 * (0.5 + 0.5 * w.stam) / (o.inp.sy > 0.3 ? 1.6 : 1), mx2 = (a.x + b.x) / 2, mz2 = (a.z + b.z) / 2, c2 = Math.cos(om * dt), s2 = Math.sin(om * dt);
        for (const q of [a, b]) { const rx = q.x - mx2, rz = q.z - mz2; q.x = mx2 + rx * c2 - rz * s2; q.z = mz2 + rx * s2 + rz * c2; } o.side += I.sx * dt * (o.inp.sy > 0.3 ? 1.1 : 0.45) * (0.4 + 0.6 * w.stam) / o.plant; G.lastAct[w === a ? 'me' : 'op'] = { k: 'turn', t: G.t }; } } }
  else { // no contact: anyone leaning hard into nothing keeps falling forward (the support is gone)
    for (const [w, o] of [[a, b], [b, a]]) { const sp = Math.hypot(w.vx, w.vz); if (w.lean > 0.6 && sp > 1.4 && w.inp.sy > 0.2 && !(w.stumble > 0)) { const [ux, uz] = toward(w, o); w.lean += dt * sp * 0.6; w.vx += ux * w.lean * dt * 1.6; w.vz += uz * w.lean * dt * 1.6; } } }
  // a grip holds them together at arm's length
  if (a.grip || b.grip) { const d2 = dist(a, b); if (d2 > 1.5) { if (a.grip) a.grip = false; if (b.grip) b.grip = false; G.ev.push({ k: 'release', who: 'both' }); } }
  // moving; never through each other
  for (const w of [a, b]) { w.x += w.vx * dt; w.z += w.vz * dt; const sp = Math.hypot(w.vx, w.vz); w.vx *= Math.exp(-dt * 2.5); w.vz *= Math.exp(-dt * 2.5); w.step += sp * dt * 2.4; if (Math.floor(w.step) !== (w.lastStep | 0)) { w.lastStep = Math.floor(w.step); G.ev.push({ k: 'foot', who: w === a ? 'me' : 'op' }); } if (w.scrape) w.scrape = Math.max(0, w.scrape - dt); }
  { const d3 = dist(a, b); if (d3 < 2 * BODY - 0.02) { const [ux, uz] = toward(a, b), ov = 2 * BODY - d3, ka = a.dodge > 0 ? 1 : b.dodge > 0 ? 0 : 0.5; a.x -= ux * ov * ka; a.z -= uz * ov * ka; b.x += ux * ov * (1 - ka); b.z += uz * ov * (1 - ka); } }      // a sidestep slides round him; it never shoves him
  a.face = Math.atan2(b.x - a.x, b.z - a.z); b.face = Math.atan2(a.x - b.x, a.z - b.z);
  G.minEdge = Math.min(G.minEdge, RR - Math.hypot(a.x, a.z));
  if (G.t > 50) { G.ev.push({ k: 'restart' }); G.wait = 1.2; G.next = () => bout(G, { rival: G.rival }); G.phase = 'end'; return; }      // too long: the judges call a fresh start (no winner)
  // the end: a foot over the edge, or down
  for (const [w, o] of [[a, b], [b, a]]) { if (Math.hypot(w.x, w.z) + 0.28 > RR) { w.out = true; endBout(G, o, w, 'out'); return; } if (w.lean > 1 || w.lean < -1.05 || Math.abs(w.side) > 1) { w.down = true; endBout(G, o, w, Math.abs(w.side) > 1 ? 'side' : w.lean > 1 ? 'forward' : 'down'); return; } } }
function tachiai(G, w, o) { const [ux, uz] = toward(w, o), I = w.inp;
  if (w.henka) { w.henka = false; const sd = I.sx ? Math.sign(I.sx) : (G.rnd() < 0.5 ? -1 : 1); w.dodge = 0.3; w.dodgeCd = 0.9; w.ddx = -uz * sd; w.ddz = ux * sd; w.open = 'side'; G.ev.push({ k: 'dodge', who: w === G.me ? 'me' : 'op' }); G.lastAct[w === G.me ? 'me' : 'op'] = { k: 'dodge', t: G.t }; return; }
  if (I.sy > 0.4) { w.vx = ux * 3.3; w.vz = uz * 3.3; w.lean = 0.66; w.open = "charge"; G.ev.push({ k: 'charge', who: w === G.me ? 'me' : 'op' }); return; }
  w.brace = 1.1; w.open = 'brace'; }
function endBout(G, winner, loser, how) { G.phase = 'end'; const meWon = winner === G.me, la = G.lastAct[meWon ? 'me' : 'op'], counter = la && G.t - la.t < 1.6 && ['pull', 'dodge', 'turn'].includes(la.k);
  const tech = how === 'side' ? 'Uwatenage (thrown on the turn)' : how === 'judges' ? 'The judges\' decision (a long bout)' : how === 'out' ? (la && la.k === 'turn' && G.t - la.t < 1.6 ? 'Utchari (turned at the edge)' : (winner.grip ? 'Yorikiri (forced out on the belt)' : la && (la.k === 'push' || la.k === 'bigpush') ? 'Oshidashi (pushed out)' : 'Tsukidashi (driven out)')) : how === 'forward' ? (la && la.k === 'dodge' ? 'Hatakikomi (he fell for the sidestep)' : la && (la.k === 'push' || la.k === 'bigpush') ? 'Tsukiotoshi (slapped down as he stumbled)' : 'Hikiotoshi (pulled down)') : 'Oshitaoshi (pushed down)';
  G.log.push({ won: meWon, how, tech, counter: meWon && counter, edge: meWon && G.minEdge < 0.45, t: +G.t.toFixed(1), rival: G.rival.name });
  if (meWon) G.wins++; else G.losses++; G.ev.push({ k: 'end', won: meWon, how, tech, loser: loser === G.me ? 'me' : 'op' });
  if (G.lesson) { lessonSee(G, meWon); return; }
  const c = G.cfg; if (G.wins >= c.need) { G.wait = 1.6; G.next = () => finish(G, true); return; } if (G.losses > c.bouts - c.need) { G.wait = 1.6; G.next = () => finish(G, false, { why: how }); return; }
  G.wait = 1.8; G.next = () => { G.bi++; bout(G); }; }
function finish(G, win, o = {}) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const wins = G.log.filter(q => q.won), fast = wins.some(q => q.t < 12), trick = wins.some(q => q.counter || q.edge);
  const stars = win ? 1 + (trick ? 1 : 0) + (fast ? 1 : 0) : 0, last = G.log[G.log.length - 1];
  G.res = { win, stars, why: o.why || null, log: G.log, tech: last && last.tech, rival: G.rival.name, tour: G.cfg.tour, coins: Math.max(1, wins.length * 4 + (win ? Math.ceil(G.N / 2) + stars * 3 : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the brain: the rival's (by style), and the robot player's (the same rules, played for you) ----------
function turnDir(w, o) { const mx = (w.x + o.x) / 2, mz = (w.z + o.z) / 2, rx = w.x - mx, rz = w.z - mz, r = s => { const c = Math.cos(s * 0.3), n = Math.sin(s * 0.3); return Math.hypot(mx + rx * c - rz * n, mz + rx * n + rz * c); }; return r(1) < r(-1) ? 1 : -1; }
function brain(G, w, o, P) { const I = { sx: 0, sy: 0 }, d = dist(w, o), myEdge = RR - Math.hypot(w.x, w.z), hisEdge = RR - Math.hypot(o.x, o.z), sk = P.skill, st = P.style, R = Math.random;
  const [ux, uz] = toward(w, o), sideOut = turnDir(w, o), out = { I, grip: false, push: null, dodge: false }, near = d < 1.3, pushing = o.inp.sy > 0.35;
  if (w.stam < 0.25) w.resting = true; else if (w.stam > 0.65) w.resting = false;      // a breather: rest until the strength is back
  // the opening: charge, stand, or sidestep
  if (G.phase === 'ready') { const open = st === 'player' ? P.open : st === 'charger' ? 'charge' : st === 'anchor' ? (R() < 0.85 || G.N <= 1 ? 'brace' : 'charge') : st === 'puller' ? (R() < 0.3 + 0.4 * sk ? 'side' : 'brace') : (R() < 0.5 ? 'charge' : 'brace'); if (open === 'charge') I.sy = 1; else if (open === 'side') out.dodge = true; return out; }
  // 1. leaning into nothing, or being pulled: ease off before you fall
  if (w.lean > 0.3 && (!near || (o.grip && o.inp.sy < -0.3)) && R() < 0.4 + sk) { I.sy = -0.15; return out; }
  // 1b. he is turning me off my feet: stop driving, settle
  if (Math.abs(w.side) > 0.3 && R() < 0.5 + sk) { out.grip = w.grip; I.sy = 0; return out; }
  // 1a. nearly out and being driven: sidestep out of the line now (anyone with eyes)
  if (myEdge < 0.7 && near && pushing && w.dodgeCd <= 0 && st !== 'player' && R() < 0.3 + sk * 0.6) { out.dodge = true; I.sx = sideOut; return out; }
  // 1d. pushing into a wall: stop wasting strength, hold and wait for him
  if (w.stall > 0.9 && hisEdge > 0.8 && myEdge > 0.9 && R() < 0.4 + sk) { out.grip = true; I.sy = 0; w.stall = 0; return out; }
  // 1c. he has hold and is turning us: turn back against it (two turns cancel out)
  if (o.grip && Math.abs(o.inp.sx) > 0.3 && near && (myEdge < 1.3 || Math.abs(w.side) > 0.2) && R() < 0.4 + sk) { out.grip = true; I.sx = -Math.sign(o.inp.sx); I.sy = myEdge < 1.1 || pushing ? 1 : 0; return out; }
  // 2. he is overcommitted toward me: take his support away
  if (o.lean > 0.45 && near && R() < sk) { if (w.grip && myEdge > 1.2) { out.grip = true; I.sy = -1; return out; } if (w.dodgeCd <= 0 && (st !== 'anchor' || myEdge < 0.6)) { out.dodge = true; I.sx = sideOut; return out; } }
  // 3. free, but near my edge: back to the middle
  if (myEdge < 0.9 && d > 1.18 && st !== 'player') { const r = Math.hypot(w.x, w.z) || 1, cx = -w.x / r, cz = -w.z / r; I.sy = cx * ux + cz * uz; I.sx = -cx * uz + cz * ux; return out; }
  // 4. at my edge with him on me: turn out of it or sidestep (the sharp ones); else dig in (stand firm when tired)
  if (myEdge < 0.9 && near && !pushing && !w.grip && st !== 'player') { const r = Math.hypot(w.x, w.z) || 1, cx = -w.x / r, cz = -w.z / r, sd = Math.sign(-cx * uz + cz * ux) || sideOut; if (d < 2 * BODY + 0.05) { out.grip = true; I.sx = sideOut; } else { I.sx = sd; I.sy = 0.2; } return out; }      // he is not pushing: take hold and turn him, off the edge
  if (myEdge < 0.9 && near && pushing && st === 'puller' && w.dodgeCd <= 0 && R() < sk) { out.dodge = true; I.sx = sideOut; return out; }      // the puller's answer at the edge: step aside and let him go
  if (myEdge < 0.9 && near) { if (myEdge < 0.6 && R() < sk) { if (w.grip || st !== 'charger') { out.grip = true; I.sx = sideOut; I.sy = 0.2; return out; } if (w.dodgeCd <= 0) { out.dodge = true; I.sx = sideOut; return out; } } out.grip = st !== 'charger' && w.stam > 0.25; I.sy = w.stam > 0.25 ? 1 : 0; return out; }
  // 5. tired: stand firm (it costs nothing)
  if (w.resting && hisEdge > 0.9 && R() < 0.5 + sk / 2) { out.grip = false; I.sy = 0; return out; }
  if (!near) { I.sy = st === 'anchor' ? 0.6 : st === 'puller' ? 0.5 : 1; if (st === 'puller') I.sx = 0.25; return out; }
  // 6. each style's own way, in contact
  if (st === 'charger') { I.sy = w.stam > 0.3 || pushing ? 1 : 0; if (w.pushCd <= 0 && w.stam > 0.5 && R() < 0.35) out.push = R() < 0.3 ? 'big' : 'tap'; return out; }
  if (st === 'anchor') { out.grip = true; I.sy = pushing || hisEdge < 1.0 || o.stam < 0.35 || w.stam > 0.6 && (G.t % 3.5) < 1.4 ? 1 : 0; return out; }
  if (st === 'puller') { const snap = w.grip && ((pushing || o.lean > 0.2) && myEdge > 1.0 || o.lean > 0.45 && myEdge > 0.55);      // the counter-puncher: wait, let him come, snap him down
    if (snap) { out.grip = true; I.sy = -1; return out; }
    if (pushing || myEdge < 1.0) { out.grip = true; I.sy = 1; return out; }
    if (w.stam > 0.85 && !w.resting) { out.grip = true; I.sy = 1; if (w.pushCd <= 0 && R() < 0.25) out.push = 'tap'; return out; }
    out.grip = o.grip; I.sy = 0; return out; }
  // the player robot (and the all-round rival): grip and drive; pull a pusher (sometimes); a big push when he is rocked back; turn out of a stalemate
  out.grip = true;
  if (pushing && o.lean > 0.3 && myEdge > 0.8 && w.grip && R() < sk) { I.sy = -1; return out; }
  if (o.lean < -0.3 && w.pushCd <= 0 && R() < sk) { out.grip = false; out.push = 'big'; I.sy = 1; return out; }
  if (w.grip && Math.hypot(w.vx, w.vz) < 0.12) { w.stuck = (w.stuck || 0) + 1; if (w.stuck > 6 && R() < sk) { I.sx = w.turnS || (w.turnS = sideOut); I.sy = 0.3; return out; } } else w.stuck = 0;
  if (o.resting || o.stam < 0.4 || w.stam > 0.7 || myEdge < 1.0 || hisEdge < 1.0) { I.sy = w.stam > 0.15 ? 1 : 0; return out; }
  out.grip = false; I.sy = 0; return out; }      // nothing doing: get your breath back for the next push
function applyBrain(G, w, out, careful = true) { const o = w === G.me ? G.op : G.me;
  if (careful && !w.grip) { const [ux, uz] = toward(w, o), mx = ux * out.I.sy - uz * out.I.sx, mz = uz * out.I.sy + ux * out.I.sx, r = Math.hypot(w.x, w.z), ox = w.x / (r || 1), oz = w.z / (r || 1), outward = mx * ox + mz * oz;      // a wrestler with eyes never walks himself out
    if (RR - r < 0.75 && outward > 0) { const nx = mx - ox * outward, nz = mz - oz * outward; out.I.sy = nx * ux + nz * uz; out.I.sx = -nx * uz + nz * ux; } }
  w.inp.sx = out.I.sx; w.inp.sy = out.I.sy; act(G, w, 'grip', out.grip); if (out.dodge) act(G, w, 'dodge'); if (out.push && w.pushCd <= 0) { act(G, w, 'pushDown'); if (out.push === 'big') w.pushing = 0.36; act(G, w, 'pushUp'); } }
function ai(G, dt) { const A = G.ai, c = G.cfg, turning = G.me.grip && Math.abs(G.me.inp.sx) > 0.3; if (turning && !A.felt) { A.felt = true; A.t = Math.min(A.t, c.react * 0.35); } if (!turning) A.felt = false; const pulling = G.me.grip && G.me.inp.sy < -0.3; if (pulling && !A.feltPull) { A.feltPull = true; A.t = Math.min(A.t, c.react * 0.3); } if (!pulling) A.feltPull = false; const shoving = G.me.inp.sy > 0.35 && dist(G.me, G.op) < 2 * BODY + 0.3; if (shoving && !A.feltPush) { A.feltPush = true; A.t = Math.min(A.t, c.react * 0.4); } if (!shoving) A.feltPush = false; if (Math.abs(G.op.side) > 0.3 && !A.sideFelt) { A.sideFelt = true; A.t = Math.min(A.t, c.react * 0.3); } if (Math.abs(G.op.side) < 0.15) A.sideFelt = false; A.t -= dt; if (A.t > 0) return; A.t = c.react * (0.6 + 0.8 * G.rnd());
  const w = G.op, o = G.me, out = brain(G, w, o, { skill: c.skill, style: G.rival.style === 'mixed' ? (w.stam > 0.5 ? 'player' : 'puller') : G.rival.style }), hisEdge = RR - Math.hypot(o.x, o.z), myEdge = RR - Math.hypot(w.x, w.z), pressed = o.inp.sy > 0.35 || myEdge < 0.9;
  if (out.I.sy < -0.3) { A.pullT = (A.pullT || 0) + (c.react * 1); if (A.pullT > 0.9) { out.I.sy = myEdge < 1.0 || o.inp.sy > 0.35 ? 1 : 0; A.pullT = -1.5; } } else A.pullT = Math.min(0, (A.pullT || 0) + c.react);      // a pull is a snap, not a tug-of-war
  if (w.stam < 0.45 && hisEdge > 0.8 && !pressed && G.phase === 'fight') { if (out.I.sy > 0.2) out.I.sy = 0; out.push = null; if (w.grip || out.grip) out.I.sx = 0; }      // a pro keeps something back: no wasted effort while he is not pressing
  applyBrain(G, w, out); }
function dummy(G, dt) { const L = lessonNow(G); G.op.inp.sx = 0; G.op.inp.sy = L && L.id === 'tachiai' ? 1 : 0.15; G.op.grip = false; if (L && L.id === 'tachiai' && G.phase === 'fight') { G.op.inp.sy = 1; } }
function honest(G, o, mem) { if (G.over || G.wait > 0 || !G.me) return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = react * 0.6 * (0.6 + 0.8 * Math.random());
  const st = G.rival.style, open = st === 'charger' && Math.random() < acc ? 'side' : st === 'puller' ? 'brace' : 'charge';
  const out = brain(G, G.me, G.op, { skill: 0.55 + 0.45 * acc, style: 'player', open }); if (Math.random() > 0.85 + 0.15 * acc) { out.I.sx += (Math.random() - 0.5); } applyBrain(G, G.me, out); }
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). The hand sat on
// PUSH / GRIP / DODGE the whole bout, while the stick (half of each lesson) was never shown. Now the robot's own brain is asked (brain(), what it
// would do this moment): PUSH THIS WAY on the stick, TAP PUSH!, HOLD GRIP / LET GO, TAP DODGE! when he charges.
const SMO = { t: -1e9, v: null };
function sumoCue(G) { if (G.over || G.wait > 0 || !G.me) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - SMO.t < 200) return SMO.v; SMO.t = now; const me = G.me, B = btnRects(G), mid = b => [b.x + b.w / 2, b.y + b.h / 2], st = G.rival.style;
  const out = brain(G, me, G.op, { skill: 1, style: 'player', open: st === 'charger' ? 'side' : st === 'puller' ? 'brace' : 'charge' }), d = ui.drag, x0 = d ? d.x0 : W * 0.24, y0 = d ? d.y0 : H * 0.72, R = 50 * k, sx = out.I.sx, sy = out.I.sy; let v;
  if (out.dodge) v = ['TAP DODGE!', 'tap', mid(B.dodge)];
  else if (out.grip && !me.wantGrip) v = ['HOLD GRIP', 'hold', mid(B.grip)];
  else if (!out.grip && me.wantGrip) v = ['LET GO OF GRIP', 'release', mid(B.grip)];
  else if (out.push && me.pushCd <= 0) v = ['TAP PUSH!', 'tap', mid(B.push)];
  else if (Math.hypot(sx, sy) > 0.3) v = [sy > 0.5 ? 'PUSH UP: INTO HIM' : 'PUSH THIS WAY', 'drag', [x0, y0, x0 + sx * R * 0.8, y0 - sy * R * 0.8]];
  else v = ['WAIT…', 'wait', false];
  SMO.v = v; return v; }
// blind moves: the stick a random way (or let go), a shove, grip on or off, a dodge
const BLIND = { m: G => { if (Math.random() < 0.2) stick(G, 0, 0); else { const a = Math.random() * TAU; stick(G, Math.cos(a), Math.sin(a)); } }, p: G => { act(G, G.me, 'pushDown'); act(G, G.me, 'pushUp'); }, g: G => act(G, G.me, 'grip', !G.me.wantGrip), d: G => act(G, G.me, 'dodge') };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.wins = G.cfg.need; G.log.push({ won: true, how: 'out', tech: 'Yorikiri', counter: true, edge: false, t: 5, rival: G.rival.name }); finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'push', title: 'PRESS IN AND SHOVE', say: G => sumoCue(G)[0], do: G => sumoCue(G)[1], at: G => sumoCue(G)[2], how: 'Left thumb: push the stick UP to press into him. Tap PUSH (right) for a shove. Shove him out of the ring.', need: 1 }],
  2: [{ id: 'grip', title: 'GRIP AND DRIVE', say: G => sumoCue(G)[0], do: G => sumoCue(G)[1], at: G => sumoCue(G)[2], how: 'Get close and HOLD GRIP: you take his belt. Keep holding and push the stick UP to drive him out.', need: 1 }],
  3: [{ id: 'tachiai', title: 'SIDESTEP THE CHARGE', say: G => sumoCue(G)[0], do: G => sumoCue(G)[1], at: G => sumoCue(G)[2], how: 'He will charge at the start. Tap DODGE as the bout begins: he charges into nothing and falls. (Later: DODGE as he lunges, then PUSH him as he stumbles past.)', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, dummy: true }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); G.wins = G.losses = 0; G.log = [];
  bout(G, { yard: st.id, rival: { name: 'Practice partner', style: st.id === 'tachiai' ? 'charger' : 'anchor', col: 0x8a7a6a, look: 0, line: '' }, ready: st.id === 'tachiai' ? 1.6 : 0.6 }); G.op.str = st.id === 'tachiai' ? 0.9 : 0.55; G.op.plant = 0.7; G.ev.push({ k: 'yard' }); }
function lessonSee(G, won) { const L = lessonNow(G); if (!L) return; if (won) { G.lesson.n = 1; G.ev.push({ k: 'lessonok', n: 1, need: 1 }); G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); G.bi = 0; G.wins = G.losses = 0; G.log = []; bout(G); G.ev.push({ k: 'start' }); }; }
  else { G.ev.push({ k: 'lessonmiss', how: L.how }); G.wait = 1.4; G.next = () => lessonDeal(G); } }
