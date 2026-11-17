// ===================== RULES: Tag (game 26) =====================
// The playground game, in 3D. You are a kid in a schoolyard full of kids; each level is one game of tag, and the games
// change: CHASE (you're IT: tag them all before the bell), RUN (they're IT: don't get caught till the bell; three hearts),
// FREEZE (you're IT: freeze them all at once; free kids unfreeze their friends with a touch) and ZOMBIE TAG (one kid is IT and
// everyone tagged joins him: be the last one standing). Every tenth level the BIG KID chases you.
// Controls: the thumb lands anywhere and drags: you run that way (a floating stick). Tap twice quickly: DASH.
// On the ground: SPEED shoes, a GHOST cape (chasers lose you), a SHIELD (one free tag) and a FREEZE whistle (kids near you stop).
// Tokens from every game buy upgrades in the tuck shop that stay with you; rank by tokens ever earned; new places as you go.
// World: metres; x across the screen, z down it (the camera looks up the yard, towards -z). Screen right is world +x.

const RULES = [
  '<b>Drag anywhere</b> to run: your thumb is the stick. <b>Tap twice quickly</b> to DASH.',
  '<b>CHASE:</b> you are IT. Tag every kid before the bell.',
  '<b>RUN:</b> they are IT. Keep away till the bell. Three hearts.',
  '<b>FREEZE:</b> freeze them all at once. Free kids unfreeze their friends.',
  '<b>ZOMBIE TAG:</b> everyone tagged joins the chase. Be the last one standing.',
  'Grab ⚡ speed, 👻 ghost, 🛡 shield and 🧊 freeze on the ground.',
];
const MODES = { chase: 'CHASE', run: 'RUN', freeze: 'FREEZE', zombie: 'ZOMBIE TAG', big: 'THE BIG KID' };
const HALF_X = 15, HALF_Z = 21;
const PLACES = [
  { name: 'The playground', from: 1 }, { name: 'The park', from: 10 }, { name: 'The beach', from: 20 }, { name: 'The snowy schoolyard', from: 30 },
];
const placeOf = N => { let p = 0; PLACES.forEach((q, i) => { if (N >= q.from) p = i; }); return p; };
// things in the yard to run round (circles): the climbing frame, the slide, trees, benches, the sandpit (slows, not solid)
const PROPS = [
  { k: 'frame', x: -6, z: -8, r: 2.2 }, { k: 'slide', x: 7, z: 4, r: 1.8 }, { k: 'tree', x: 9, z: -13, r: 1.2 }, { k: 'tree', x: -10, z: 9, r: 1.2 },
  { k: 'tree', x: 2, z: 14, r: 1.1 }, { k: 'bench', x: -11, z: -2, r: 1.0 }, { k: 'bench', x: 11, z: -4, r: 1.0 }, { k: 'swing', x: 0, z: -15, r: 1.6 },
  { k: 'round', x: -3, z: 5, r: 1.5 },
];
const SAND = { x: 6, z: -6, r: 3 };
const POWERS = { speed: { icon: '⚡', t: 4 }, ghost: { icon: '👻', t: 3.5 }, shield: { icon: '🛡', t: 0 }, freeze: { icon: '🧊', t: 0 } };
const UPGRADES = [
  { id: 'shoes', name: 'Fast sneakers', desc: 'You run a little faster.', max: 4, cost: l => 12 + l * 12 },
  { id: 'spring', name: 'Spring legs', desc: 'Your dash goes further.', max: 3, cost: l => 15 + l * 14 },
  { id: 'breath', name: 'Big lungs', desc: 'Dash again sooner.', max: 3, cost: l => 15 + l * 14 },
  { id: 'pockets', name: 'Lucky pockets', desc: 'Power-ups last longer and come more often.', max: 3, cost: l => 18 + l * 15 },
  { id: 'heart', name: 'Extra heart', desc: 'One more heart when they chase you.', max: 2, cost: l => 40 + l * 40 },
  { id: 'bell', name: 'Friendly bell', desc: 'A little more time when you are IT.', max: 3, cost: l => 14 + l * 14 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'New kid'], [60, 'Sneaky'], [200, 'Speedy'], [500, 'Slippery'], [1100, 'Untaggable'], [2400, 'Playground legend']];
const WEATHERS = ['morning', 'noon', 'golden', 'overcast', 'sunset', 'rain', 'mist', 'dawn'];
function weatherOf(N) { if (N <= 3) return ['morning', 'noon', 'golden'][N - 1]; const R = rng(N * 3301 + 7); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
function modeOf(N) { if (N % 10 === 0) return 'big'; if (N <= 3) return ['chase', 'run', 'freeze'][N - 1]; return ['chase', 'run', 'zombie', 'freeze'][(N - 4) % 4]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), mode = modeOf(N);
  const me = 6.2 * (1 + 0.03 * upLv('shoes'));
  return { N, f, e, mode, help: !!help, me,
    kids: mode === 'run' ? Math.min(4, 2 + Math.round(x(0, 2, 20))) : mode === 'big' ? 1 : Math.min(8, Math.round(x(3, 8, 25))),
    kidV: 6.2 * x(0.8, 0.96, 40) * (help ? 0.93 : 1), chaseV: 6.2 * (mode === 'big' ? x(0.98, 1.08, 30) : x(0.86, 0.98, 45)) * (help ? 0.93 : 1),
    time: mode === 'chase' ? x(45, 30, 25) + 4 * upLv('bell') : mode === 'freeze' ? x(55, 40, 25) + 4 * upLv('bell') : mode === 'big' ? x(30, 40, 30) : mode === 'zombie' ? x(40, 55, 30) : x(30, 45, 30),
    hearts: 3 + upLv('heart'), lead: x(0.1, 0.6, 25), smart: x(0.3, 1, 20), kidDash: x(4.5, 2.8, 30), unfreeze: x(1.4, 0.7, 35),
    dashV: 14, dashT: 0.32 * (1 + 0.15 * upLv('spring')), dashCD: 2.2 * (1 - 0.12 * upLv('breath')), powerEvery: x(7, 11, 30) * (1 - 0.12 * upLv('pockets')), powerT: 1 + 0.25 * upLv('pockets'),
    zombies: 1 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), place: placeOf(N), mode: cfg.mode, left: cfg.time, hearts: cfg.hearts, tags: 0, combo: 0, best: 0, near: 0, tokens: 0, id: 0,
    me: { x: 0, z: 14, vx: 0, vz: 0, h: Math.PI, dash: 0, cd: 0, inv: 0, run: 0 }, kids: [], powers: [], nextPower: 4, buff: {}, in: { x: 0, z: 0 }, lastTap: -9 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else setup(G);
  return G;
}
// the kids, by game
const NAMES = ['Ada', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivo', 'Juno', 'Kai', 'Lola'];
function setup(G) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G), n = L ? L.kids : c.kids; G.kids = []; G.powers = []; G.me.x = 0; G.me.z = 14; G.me.vx = G.me.vz = 0;
  const mode = L ? L.mode : G.mode; G.mode = mode; G.left = L ? 999 : c.time;
  for (let i = 0; i < n; i++) { let x, z, tries = 0; do { x = (R() - 0.5) * 2 * (HALF_X - 2); z = (R() - 0.5) * 2 * (HALF_Z - 2); tries++; } while ((Math.hypot(x - G.me.x, z - G.me.z) < (mode === 'run' || mode === 'big' ? 14 : 8) || blocked(x, z, 0.6)) && tries < 50);
    const it = mode === 'run' || mode === 'big' || (mode === 'zombie' && i === 0);
    G.kids.push({ id: ++G.id, name: NAMES[(i + G.N * 3) % NAMES.length], x, z, vx: 0, vz: 0, h: 0, it, big: mode === 'big', out: false, frozen: false, stun: 0, dash: 0, cd: R() * 2, wob: R() * TAU, col: (i + G.N) % 8, thaw: 0, juke: 0 }); }
}
// ---------- the thumb ----------
function stick(G, x, z) { const m = Math.hypot(x, z); G.in.x = m > 1 ? x / m : x; G.in.z = m > 1 ? z / m : z; }
function dash(G) { const me = G.me; if (G.over || me.cd > 0 || me.dash > 0) return false; me.dash = G.cfg.dashT; me.cd = G.cfg.dashCD; const m = Math.hypot(G.in.x, G.in.z); if (m > 0.2) me.h = Math.atan2(G.in.x, G.in.z); G.ev.push({ k: 'dash' }); lessonSee(G, 'dash'); return true; }
function tapAt(G) { if (G.t - G.lastTap < 0.32) { G.lastTap = -9; return dash(G); } G.lastTap = G.t; return false; }
// ---------- moving ----------
function blocked(x, z, r) { for (const p of PROPS) if (Math.hypot(x - p.x, z - p.z) < p.r + r) return true; return false; }
function collide(o, r) {      // pushed out of props and walls; the speed into them is lost (so a kid pinned on a wall is not 'running')
  for (const p of PROPS) { const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz), m = p.r + r; if (d < m && d > 1e-4) { const nx = dx / d, nz = dz / d; o.x = p.x + nx * m; o.z = p.z + nz * m; const vn = o.vx * nx + o.vz * nz; if (vn < 0) { o.vx -= vn * nx; o.vz -= vn * nz; } } }
  if (o.x < -HALF_X + r) { o.x = -HALF_X + r; o.vx = Math.max(0, o.vx); } if (o.x > HALF_X - r) { o.x = HALF_X - r; o.vx = Math.min(0, o.vx); }
  if (o.z < -HALF_Z + r) { o.z = -HALF_Z + r; o.vz = Math.max(0, o.vz); } if (o.z > HALF_Z - r) { o.z = HALF_Z - r; o.vz = Math.min(0, o.vz); }
}
function move(o, dx, dz, v, dt, acc = 22) {      // steer towards a direction at speed v
  const m = Math.hypot(dx, dz); const tx = m > 0.01 ? dx / m * v * Math.min(1, m) : 0, tz = m > 0.01 ? dz / m * v * Math.min(1, m) : 0;
  const k2 = Math.min(1, acc * dt / Math.max(0.01, v)); o.vx += (tx - o.vx) * k2; o.vz += (tz - o.vz) * k2;
  const sand = Math.hypot(o.x - SAND.x, o.z - SAND.z) < SAND.r ? 0.6 : 1; o.x += o.vx * dt * sand; o.z += o.vz * dt * sand;
  if (Math.hypot(o.vx, o.vz) > 0.3) o.h = Math.atan2(o.vx, o.vz);
}
// when a chaser running at v would meet the target if it kept going straight (seconds); a little if never
function intercept(k, tg, v) { const rx = tg.x - k.x, rz = tg.z - k.z, a = tg.vx * tg.vx + tg.vz * tg.vz - v * v, b = 2 * (rx * tg.vx + rz * tg.vz), cc = rx * rx + rz * rz;
  if (Math.abs(a) < 1e-6) return b < 0 ? -cc / b : 0.3; const disc = b * b - 4 * a * cc; if (disc < 0) return 0.3; const r1 = (-b - Math.sqrt(disc)) / (2 * a), r2 = (-b + Math.sqrt(disc)) / (2 * a), t = [r1, r2].filter(q => q > 0).sort((p, q) => p - q)[0]; return t == null ? 0.3 : t; }
// where to run to get away from those chasing: away from each (closer counts more), off the walls, round the props
function fleeDir(o, chasers, smart) {
  let fx = 0, fz = 0;
  for (const c of chasers) { const dx = o.x - c.x, dz = o.z - c.z, d = Math.max(0.5, Math.hypot(dx, dz)); fx += dx / d / (d * d) * 30; fz += dz / d / (d * d) * 30; }
  const wall = (p, half) => p > half - 5 ? -(p - (half - 5)) / 5 : p < -half + 5 ? (-half + 5 - p) / 5 : 0;
  fx += wall(o.x, HALF_X) * (1 + smart) * 1.2; fz += wall(o.z, HALF_Z) * (1 + smart) * 1.2;
  // corners: slide along the wall, away from the chaser
  for (const p of PROPS) { const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz); if (d < p.r + 2) { fx += dx / d * 0.6; fz += dz / d * 0.6; } }
  return [fx, fz];
}
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, me = G.me, R = G.rnd, L = lessonNow(G), mode = G.mode;
  for (const k in G.buff) { G.buff[k] -= dt; if (G.buff[k] <= 0) delete G.buff[k]; }
  // you
  me.cd = Math.max(0, me.cd - dt); me.inv = Math.max(0, me.inv - dt);
  if (me.dash > 0) { me.dash -= dt; const dv = c.dashV; me.vx = Math.sin(me.h) * dv; me.vz = Math.cos(me.h) * dv; me.x += me.vx * dt; me.z += me.vz * dt; }
  else move(me, G.in.x, G.in.z, c.me * (G.buff.speed ? 1.4 : 1), dt, 30);
  collide(me, 0.45); me.run += Math.hypot(me.vx, me.vz) * dt;
  me.tt = (me.tt || 0) - dt; if (me.tt <= 0) { me.tt = 0.25; (me.trail = me.trail || []).push([me.x, me.z, me.run]); if (me.trail.length > 16) me.trail.shift(); }
  const tr = me.trail || [], loop = tr.length >= 12 && Math.hypot(me.x - tr[0][0], me.z - tr[0][1]) < 0.4 * (me.run - tr[0][2]) && me.run - tr[0][2] > 8;
  me.loop = loop; if (loop) { me.cx = tr.reduce((a, q) => a + q[0], 0) / tr.length; me.cz = tr.reduce((a, q) => a + q[1], 0) / tr.length; }
  // the kids
  const chasers = G.kids.filter(k => k.it && !k.out), prey = G.kids.filter(k => !k.it && !k.out && !k.frozen);
  for (const k of G.kids) { if (k.out) continue; k.stun = Math.max(0, k.stun - dt); k.cd = Math.max(0, k.cd - dt); if (k.frozen || k.stun > 0 || (G.buff.freezeAll && Math.hypot(k.x - me.x, k.z - me.z) < 7)) { k.vx *= 0.8; k.vz *= 0.8; continue; }
    let dx = 0, dz = 0, v = k.it ? c.chaseV : c.kidV;
    if (k.it) {      // chasing: you (unless a ghost) or, in zombie tag, the nearest kid still free
      const targets = (mode === 'zombie' ? G.kids.filter(q => !q.it && !q.out) : []).concat(G.buff.ghost ? [] : [me]); let tg = null, bd = 1e9;
      for (const t of targets) { const d = Math.hypot(t.x - k.x, t.z - k.z) * (t === me ? 0.6 : 1); if (d < bd) { bd = d; tg = t; } } if (tg) bd = Math.hypot(tg.x - k.x, tg.z - k.z);
      if (tg === me && me.loop && bd > 3 && R() < 0.98) { dx = (me.cx + me.x) / 2 - k.x; dz = (me.cz + me.z) / 2 - k.z; }      // you are running in circles: cut across
      else if (tg) { const t2 = intercept(k, tg, v), lead = Math.min(t2, 1.6) * Math.min(1, 0.4 + c.smart * 0.6); dx = tg.x + tg.vx * lead - k.x; dz = tg.z + tg.vz * lead - k.z; if (bd < 3 && k.cd <= 0 && R() < dt * 3) { k.dash = 0.28; k.cd = c.kidDash; } }
      else { dx = Math.sin(G.t * 0.7 + k.wob) ; dz = Math.cos(G.t * 0.5 + k.wob); v *= 0.5; }
    } else if (mode === 'freeze' && !k.frozen) {      // free kids: run from you; go and thaw a frozen friend when you are far
      const fr = G.kids.filter(q => q.frozen).sort((a, b) => Math.hypot(a.x - k.x, a.z - k.z) - Math.hypot(b.x - k.x, b.z - k.z))[0], dMe = Math.hypot(me.x - k.x, me.z - k.z);
      if (fr && dMe > 6 && Math.hypot(fr.x - me.x, fr.z - me.z) > 4) { dx = fr.x - k.x; dz = fr.z - k.z; if (Math.hypot(dx, dz) < 1.0) { fr.thaw += dt; if (fr.thaw >= c.unfreeze) { fr.frozen = false; fr.thaw = 0; G.ev.push({ k: 'thaw', x: fr.x, z: fr.z }); } } }
      else [dx, dz] = fleeDir(k, [me], c.smart);
    } else [dx, dz] = fleeDir(k, mode === 'zombie' ? chasers : [me], c.smart);
    // a juke: a fleeing kid dashes sideways when you are right on him
    if (!k.it && k.cd <= 0) { const d = Math.hypot(me.x - k.x, me.z - k.z); if (d < 2.2 && R() < dt * 4 * c.smart) { const s = R() < 0.5 ? -1 : 1, ax = k.x - me.x, az = k.z - me.z; dx = ax + s * az * 1.5; dz = az - s * ax * 1.5; k.dash = 0.25; k.cd = c.kidDash; } }
    if (k.dash > 0) { k.dash -= dt; v *= k.it ? 1.7 : 1.5; }
    if (k.dash > 0) { const m = Math.hypot(dx, dz) || 1; k.vx = dx / m * v; k.vz = dz / m * v; k.x += k.vx * dt; k.z += k.vz * dt; k.h = Math.atan2(k.vx, k.vz); }      // a dash is a burst, at once
    else move(k, dx, dz, v * (0.95 + 0.05 * Math.sin(G.t * 2 + k.wob)), dt); collide(k, 0.42);
    for (const q of G.kids) if (q !== k && !q.out) { const ddx = k.x - q.x, ddz = k.z - q.z, d = Math.hypot(ddx, ddz); if (d < 0.8 && d > 1e-3) { k.x += ddx / d * (0.8 - d) * 0.5; k.z += ddz / d * (0.8 - d) * 0.5; } }
  }
  // tags
  const TAG = 0.95;
  if (mode === 'chase' || mode === 'freeze') for (const k of G.kids) { if (k.out || k.frozen) continue; if (Math.hypot(k.x - me.x, k.z - me.z) < TAG) {
    if (mode === 'chase') { k.out = true; } else { k.frozen = true; k.thaw = 0; } G.tags++; G.combo = G.t - (G.lastTag || -9) < 4 ? G.combo + 1 : 1; G.lastTag = G.t; G.best = Math.max(G.best, G.combo);
    G.ev.push({ k: 'tag', x: k.x, z: k.z, name: k.name, combo: G.combo, freeze: mode === 'freeze' }); lessonSee(G, 'tag'); } }
  if (mode === 'run' || mode === 'big' || mode === 'zombie') {
    for (const k of G.kids) { if (!k.it || k.out || k.stun > 0) continue; const d = Math.hypot(k.x - me.x, k.z - me.z);
      if (d < TAG && me.inv <= 0 && !G.buff.ghost) { k.stun = 1; me.inv = 1.2; if (G.buff.shield) { delete G.buff.shield; G.ev.push({ k: 'shield' }); continue; }
        G.hearts--; G.ev.push({ k: 'caught', name: k.name, hearts: G.hearts }); lessonMiss(G, 'caught'); if (L) { if (G.hearts <= 0) G.hearts = c.hearts; } else if (G.hearts <= 0) { finish(G, false, 'caught'); return; } }
      else if (d < 2.2 && d > TAG && me.inv <= 0 && !k.nearT) { k.nearT = true; G.near++; } else if (d > 3.5) k.nearT = false; }
    if (mode === 'zombie') for (const k of G.kids) { if (!k.it || k.stun > 0) continue; for (const q of G.kids) if (!q.it && !q.out && Math.hypot(q.x - k.x, q.z - k.z) < TAG) { q.it = true; q.stun = 1; G.ev.push({ k: 'zombie', x: q.x, z: q.z, name: q.name }); } }
  }
  // power-ups
  G.nextPower -= dt; if (G.nextPower <= 0 && G.powers.length < 2) { G.nextPower = c.powerEvery * (0.7 + R() * 0.6); let x, z, n = 0; do { x = (R() - 0.5) * 2 * (HALF_X - 2); z = (R() - 0.5) * 2 * (HALF_Z - 2); n++; } while ((blocked(x, z, 0.8) || Math.hypot(x - me.x, z - me.z) < 5) && n < 30);
    const kinds = mode === 'chase' || mode === 'freeze' ? ['speed', 'freeze', 'speed'] : ['speed', 'ghost', 'shield']; G.powers.push({ k: kinds[(R() * kinds.length) | 0], x, z, t: 0 }); }
  for (const p of G.powers) { p.t += dt; if (!p.got && Math.hypot(p.x - me.x, p.z - me.z) < 1.1) { p.got = true; const P = POWERS[p.k];
      if (p.k === 'shield') G.buff.shield = 999; else if (p.k === 'freeze') { G.buff.freezeAll = 1.8 * c.powerT; } else G.buff[p.k] = P.t * c.powerT; G.ev.push({ k: 'power', p: p.k }); lessonSee(G, 'power'); } }
  G.powers = G.powers.filter(p => !p.got && p.t < 14);
  // the bell
  if (!L) { G.left -= dt; }
  const free = G.kids.filter(k => !k.it && !k.out && !k.frozen).length;
  if (mode === 'chase' && free === 0 && G.kids.length) { if (L) lessonSee(G, 'all'); else return finish(G, true); }
  if (mode === 'freeze' && free === 0 && G.kids.length) { if (L) lessonSee(G, 'all'); else return finish(G, true); }
  if (L && (mode === 'run') && G.t - (G.lstart || 0) > L.survive) { G.lstart = G.t; lessonSee(G, 'survived'); }
  if (!L && G.left <= 0) { G.left = 0; return finish(G, mode === 'run' || mode === 'big' || mode === 'zombie', 'bell'); }
}
function finish(G, win, why) {
  const c = G.cfg, mode = G.mode; G.over = win ? 'won' : 'lost';
  const it = mode === 'chase' || mode === 'freeze', share = it ? G.left / c.time : G.hearts / c.hearts;
  const stars = !win ? 0 : it ? (share >= 0.4 ? 3 : share >= 0.2 ? 2 : 1) : (G.hearts >= c.hearts ? 3 : G.hearts >= c.hearts - 1 ? 2 : 1);
  const tokens = win ? stars * 2 + Math.ceil(G.N / 3) + G.tags + Math.min(5, G.near) : Math.min(4, G.tags + (it ? 0 : Math.floor(G.t / 15)));
  G.res = { win, why, stars, mode, tags: G.tags, hearts: G.hearts, left: G.left, near: G.near, tokens, combo: G.best, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'run', title: 'YOU ARE IT!', how: 'Put your thumb down anywhere and drag: you run that way. Tag all three kids.', need: 1, ok: w => w === 'all', mode: 'chase', kids: 3 },
      { id: 'dash', title: 'DASH', how: 'Tap twice quickly to DASH: a burst of speed. Dash to tag the last two.', need: 1, ok: w => w === 'all', mode: 'chase', kids: 2, dashOnly: true }],
  2: [{ id: 'flee', title: 'THEY ARE IT!', how: 'The kid in red is IT. Keep away from him for 15 seconds. Dash when he gets close.', need: 1, ok: w => w === 'survived', mode: 'run', kids: 1, survive: 15 }],
  3: [{ id: 'freeze', title: 'FREEZE TAG', how: 'Freeze all four. Free kids can unfreeze a friend with a touch: get them all.', need: 1, ok: w => w === 'all', mode: 'freeze', kids: 4 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0, dashed: 0 }; setup(G); G.lstart = G.t; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i];
  if (what === 'tag' && st.dashOnly && G.me.dash <= 0 && G.me.cd < G.cfg.dashCD - 0.6) { G.ev.push({ k: 'lessonmiss', why: 'nodash', how: st.how }); const k = G.kids.find(q => q.out && Math.hypot(q.x - G.me.x, q.z - G.me.z) < 1.5); if (k) { k.out = false; k.x = clamp(k.x + 6, -12, 12); } return; }
  if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0; D.caught = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.mode = G.cfg.mode; G.hearts = G.cfg.hearts; G.tags = 0; G.near = 0; G.buff = {}; setup(G); }
  else { G.ev.push({ k: 'lessonnext' }); setup(G); G.lstart = G.t; }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; if (why === 'caught') { D.caught = 1; G.lstart = G.t; } G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: the stick held one way (eight ways), let go, a dash
const BLIND = { n: G => stick(G, 0, -1), s: G => stick(G, 0, 1), e: G => stick(G, 1, 0), w: G => stick(G, -1, 0), o: G => stick(G, 0, 0), d: G => dash(G),
  q: G => stick(G, 0.7, -0.7), z: G => stick(G, -0.7, 0.7) };
// a kid who looks: chasing, runs at the nearest free kid where he is going (cuts him off), dashes when close; running away,
// keeps the chasers behind him, out of corners, round the frame, dashes when one is on him; picks up power-ups on the way
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, me = G.me, c = G.cfg, mode = G.mode;
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.08 + react * 0.5;
  if (mem.slip > G.t) return; if (Math.random() > acc + (1 - acc) * 0.75) { mem.slip = G.t + 0.25 + react; const a = Math.random() * TAU; stick(G, Math.sin(a), Math.cos(a)); return; }
  const it = mode === 'chase' || mode === 'freeze', near = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  if (it) {
    let best = null, bs = 1e9; for (const k of G.kids) { if (k.out || k.frozen) continue; let s = near(k, me); if (mode === 'freeze') { const thawing = G.kids.some(q => q.frozen && near(q, k) < 2); if (thawing) s -= 6; } if (s < bs) { bs = s; best = k; } }
    if (!best) return; const lead = Math.min(0.9, bs / c.me) ; let tx = best.x + best.vx * lead, tz = best.z + best.vz * lead;
    // a kid by a wall cannot go further: aim a little inside to cut him off
    const p = G.powers.find(q => near(q, me) < 3 && q.k !== 'ghost'); if (p && bs > 4) { tx = p.x; tz = p.z; }
    const dx = tx - me.x, dz = tz - me.z, d = Math.hypot(dx, dz) || 1; stick(G, dx / d, dz / d);
    if (bs < 3.2 && bs > 0.9 && me.cd <= 0) { me.h = Math.atan2(dx, dz); dash(G); }
  } else {
    const ch = G.kids.filter(k => k.it && !k.out && !(k.stun > 0.6));
    // look at sixteen ways to run: where would I be in 0.7 s, how near would they be, how near a wall or a prop?
    let fx = 0, fz = 0, bs = -1e9; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, ux = Math.sin(a), uz = Math.cos(a), px = me.x + ux * c.me * 0.7, pz = me.z + uz * c.me * 0.7;
      let sc = 0; for (const k of ch) { const kx = k.x + (px - k.x) * 0.35, kz = k.z + (pz - k.z) * 0.35, d = Math.hypot(px - kx, pz - kz); sc -= 12 / Math.max(0.6, d); }
      const wx = HALF_X - Math.abs(px), wz = HALF_Z - Math.abs(pz); if (wx < 3) sc -= (3 - wx) * 3; if (wz < 3) sc -= (3 - wz) * 3;
      for (const p of PROPS) if (Math.hypot(px - p.x, pz - p.z) < p.r + 0.8) sc -= 6; if (Math.hypot(px - SAND.x, pz - SAND.z) < SAND.r) sc -= 2;
      if (sc > bs) { bs = sc; fx = ux; fz = uz; } }
    const p = G.powers.find(q => near(q, me) < 6); if (p && ch.every(k => near(k, p) > near(me, p) + 2)) { fx = (fx * 0.5) + (p.x - me.x) * 0.3; fz = fz * 0.5 + (p.z - me.z) * 0.3; }
    const m = Math.hypot(fx, fz) || 1; stick(G, fx / m, fz / m);
    const close = ch.some(k => near(k, me) < 1.9 && k.stun <= 0); if (close && me.cd <= 0) { me.h = Math.atan2(fx, fz); dash(G); }
  }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; const mode = G.mode; if (mode === 'chase' || mode === 'freeze') { for (const k of G.kids) { if (mode === 'chase') k.out = true; else k.frozen = true; } } else G.left = 0.001; }
