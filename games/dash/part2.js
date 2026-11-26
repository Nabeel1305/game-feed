
// ===================== RULES: Beat Dash (game 74, set 13: one of mine, like Geometry Dash) =====================
// A cube runs to the right by itself, in time with the music. Tap to jump; hold to keep jumping each time it lands. Spikes
// and the sides of blocks end the run; land on top of blocks. Yellow pads throw you high; yellow rings in the air jump you
// again if you tap while passing through; blue portals flip gravity (run on the ceiling). Three lives: a crash puts you back
// at the last flag (25%, 50%, 75%). Reach 100%.
// Units: one block = 1. The cube is 1 by 1; x is its left side, y its bottom (gravity down) or top (gravity up: it runs on
// the ceiling). Ground is y = 0 (where there is floor).
const RULES = [
  '<b>Tap</b> to jump. <b>Hold</b> to keep jumping each time you land.',
  '<b>Spikes</b> and the <b>sides of blocks</b> crash you. Land on top of blocks.',
  '<b>Pads</b> throw you high. <b>Rings</b> in the air: tap as you pass through to jump again.',
  '<b>Blue portals</b> flip gravity: you run on the ceiling. <b>Never jump</b> under hanging spikes.',
  'Three lives; a crash puts you back at the last flag. Reach <b>100%</b>.',
];
const JV = 17.5, GRAV = 80, PADV = 25.5, ORBV = 17.5, TOP = 9;
const PLACES = [{ name: 'Neon City', bg: ['#1a0a3a', '#4a1a6a'], acc: '#ff3ad8', ground: '#2a1450' }, { name: 'Ocean Pulse', bg: ['#0a1a3a', '#0a4a6a'], acc: '#3ae0ff', ground: '#0a2a4a' },
  { name: 'Lava Beat', bg: ['#2a0a0a', '#6a1a0a'], acc: '#ff8a2a', ground: '#3a1408' }, { name: 'Jungle Drum', bg: ['#0a2a14', '#1a5a2a'], acc: '#8aff3a', ground: '#0a3014' }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const CUBES = [{ id: 'classic', col: '#ffd040', face: 0, stars: 0 }, { id: 'mint', col: '#3affb0', face: 1, stars: 6 }, { id: 'pink', col: '#ff5ac8', face: 2, stars: 15 }, { id: 'ice', col: '#9ae6ff', face: 3, stars: 30 }];
const UPGRADES = [
  { id: 'life', name: 'Extra life', desc: 'Four lives on every run.', max: 1, cost: l => 180 },
  { id: 'flag', name: 'More flags', desc: 'A flag every 20% instead of 25%.', max: 1, cost: l => 220 },
  { id: 'coin', name: 'Coin sense', desc: 'Secret coins glow brighter and give 2 more.', max: 1, cost: l => 120 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Beginner'], [40, 'Jumper'], [130, 'Dasher'], [320, 'Rhythm king'], [700, 'Demon'], [1500, 'Legend']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  return { N, f, help: !!help, place: placeOf(N), boss, bpm: Math.round(x(118, 150, 35)), v: x(8.2, 10.8, 35), beats: Math.round(x(56, 120, 30) * (boss ? 1.25 : 1)), gap: x(1.6, 0.35, 25),
    hard: x(0.15, 0.9, 30), orbs: N >= 3, pads: N >= 2, flip: N >= 6, ceil: N >= 4, lives: (N <= 5 ? 5 : N <= 15 ? 4 : 3) + upLv('life') + (help ? 2 : 0), flag: upLv('flag') ? 0.2 : 0.25 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the course: built from pieces, each on the beat ----------
// G.floor: [x0, x1] stretches of floor; G.blocks: {x, y, w, h}; G.spikes: {x, y, up}; G.pads, G.orbs, G.portals: {x, y}
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.blocks = []; G.spikes = []; G.pads = []; G.orbs = []; G.portals = []; G.coins = []; G.floor = []; G.ceils = [];
  const beat = c.v * 60 / c.bpm; G.beat = beat; let x = 8; const fl = (a, b) => G.floor.push([a, b]);
  if (o.course) { x = o.course(G, R, beat); } else {
    let floorFrom = -20; const end = c.beats * beat; let last = '';
    while (x < end - 6) { const r = R(), h = c.hard; let kind;
      const menu = [['spike1', 1], ['spike2', 0.8 + h], ['spike3', G.N >= 4 ? h * 1.2 : 0], ['block', 0.8], ['stairs', 0.4 + h * 0.4], ['blockspike', h], ['pit', 0.7], c.pads ? ['pad', 0.5] : null, c.orbs ? ['orb', 0.6 + h * 0.3] : null, c.ceil ? ['hang', 0.5 + h * 0.4] : null, c.flip ? ['flip', 0.25 + h * 0.3] : null].filter(Boolean);
      let tot = menu.reduce((s, m) => s + m[1], 0), pick = R() * tot; for (const m of menu) { pick -= m[1]; if (pick <= 0) { kind = m[0]; break; } } if (kind === last && R() < 0.5) continue; last = kind;
      const P = piece(G, kind, x, R, beat); if (P.pit) { fl(floorFrom, x + P.pit[0]); floorFrom = x + P.pit[1]; } x += P.len + Math.max(1.2, beat * (c.gap + R() * 0.8)); }
    fl(floorFrom, x + 60); }
  if (o.course) fl(-20, x + 60);
  G.len = x; G.x = 0; G.y = 0; G.vy = 0; G.s = 1; G.ground = true; G.rot = 0; G.holdOn = false; G.press = false; G.lives = o.lives || c.lives; G.deaths = 0; G.flagX = 0; G.flags = []; G.got = 0; G.best = 0; G.jumps = 0;
  const step2 = c.flag; for (let f = step2; f < 0.99; f += step2) G.flags.push(Math.round(G.len * f)); G.t = 0; G.dead = 0; G.coinsHave = G.coins.map(() => false); G.orbUsed = new Set(); }
// one piece of course, starting at x; returns its length (and a pit, if it leaves a gap in the floor)
function piece(G, kind, x, R, beat) { const S = (dx, y = 0, up = true) => G.spikes.push({ x: x + dx, y, up }), B = (dx, y, w, h) => G.blocks.push({ x: x + dx, y, w, h });
  switch (kind) {
    case 'spike1': S(0); return { len: 1 };
    case 'spike2': S(0); S(1); return { len: 2 };
    case 'spike3': S(0); S(1); S(2); return { len: 3 };
    case 'block': { const w = 2 + ((R() * 3) | 0); B(0, 0, w, 1); if (R() < 0.4) S(w + 0.2); return { len: w + 1 }; }
    case 'stairs': B(0, 0, 2, 1); B(3.4, 0, 2, 2); B(6.8, 0, 2, 1); return { len: 9 };
    case 'blockspike': { B(0, 0, 3, 1); S(1, 1); return { len: 3 }; }
    case 'pit': { const w = 1 + ((R() * (1.4 + G.cfg.hard * 2)) | 0); return { len: w, pit: [0, w] }; }
    case 'pad': { // the pad throws you over a tall wall; where the wall stands and where you land depend on the speed
      const v = G.cfg.v, w0 = 0.16 * v + 0.1, land = 0.64 * v - 0.6; G.pads.push({ x: x + 0.1, y: 0 }); B(w0, 0, 1, 2.6); S(w0, 2.6); if (land - (w0 + 1.6) > 1.6) S(w0 + 1.6); if (R() < 0.35) G.coins.push({ x: x + w0 + 0.5, y: 5 }); return { len: land + 1.5 }; }
    case 'orb': { const w = 7; G.orbs.push({ x: x + 3.4, y: 2.2 }); if (R() < 0.3) G.coins.push({ x: x + 5.2, y: 4.4 }); return { len: w, pit: [0.3, w - 0.3] }; }
    case 'hang': { const L = 6 + ((R() * 3) | 0); for (let i = 0; i < L; i++) { G.blocks.push({ x: x + i, y: 2.3, w: 1, h: 0.6, ceil: true }); if (i % 2 === 0 && i > 0 && i < L - 1) S(i, 2.3, false); } return { len: L + 1 }; }
    case 'flip': { // a portal up; a stretch on the ceiling (a roof of blocks with spikes hanging below it... and on the floor nothing to land on); a portal back
      const L = 12; G.portals.push({ x: x, y: 0.5, to: -1 }); for (let i = 0; i < L + 2; i++) G.ceils.push({ x: x + i - 0.5, w: 1 }); G.blocks.push({ x: x - 0.5, y: TOP - 1, w: L + 2, h: 1, roof: true });
      S(4, TOP - 1, false); S(5, TOP - 1, false); S(9, TOP - 1, false); G.portals.push({ x: x + L, y: TOP - 2, to: 1 }); return { len: L + 7, pit: [1.5, L + 1] }; }
  } return { len: 1 }; }
// ---------- your thumb ----------
function press(G) { if (G.over) return; G.holdOn = true; G.press = true; }
function release(G) { G.holdOn = false; }
// ---------- the clock ----------
const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
function onFloor(G, x) { for (const [a, b] of G.floor) if (x + 0.85 > a && x + 0.15 < b) return true; return false; }
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  G.t += dt; const c = G.cfg, n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n; for (let i = 0; i < n; i++) { tick(G, h); if (G.dead || G.over || G.wait > 0) break; } G.press = false; }
function tick(G, dt) { const c = G.cfg, s = G.s, px = G.x;
  // a jump: on the ground (a fresh tap, or holding); in a ring (a fresh tap)
  if (G.ground && (G.press || G.holdOn)) { G.vy = JV * s; G.ground = false; G.jumps++; G.ev.push({ k: 'jump' }); G.press = false; }
  if (!G.ground && G.press) for (const o of G.orbs) { const key = o.x; if (G.orbUsed.has(key)) continue; if (Math.hypot(G.x + 0.5 - o.x, G.y + 0.5 * s - o.y) < 1.0) { G.vy = ORBV * s; G.orbUsed.add(key); G.press = false; G.ev.push({ k: 'orb', x: o.x, y: o.y }); if (G.lesson) lessonSee(G, 'orb'); break; } }
  G.vy -= GRAV * s * dt; G.vy = clamp(G.vy, -32, 32); const ny = G.y + G.vy * dt; G.x += c.v * dt;
  // where the cube's box is: [x, x+1] by [bottom, bottom+1]; with gravity up, y is its top
  const bot = s > 0 ? ny : ny - 1; let landed = false;
  // the floor (gravity down) and the tops of blocks; with gravity up, roofs and the undersides of blocks
  if (s > 0) { if (ny <= 0 && G.y >= -0.05 && onFloor(G, G.x)) { G.y = 0; G.vy = 0; landed = true; }
    else { G.y = ny; for (const b of G.blocks) { if (b.roof) continue; const top = b.y + b.h; if (overlap(G.x + 0.08, G.y, 0.84, 1, b.x, b.y, b.w, b.h)) { if (G.vy <= 0 && G.y >= top - 0.45) { G.y = top; G.vy = 0; landed = true; } else return die(G, b.ceil ? 'head' : 'block'); } } } }
  else { const ceilY = TOP - 1; if (ny >= ceilY && G.y <= ceilY + 0.05 && G.ceils.some(q => G.x + 0.85 > q.x && G.x + 0.15 < q.x + q.w)) { G.y = ceilY; G.vy = 0; landed = true; }
    else { G.y = ny; for (const b of G.blocks) { if (b.roof) continue; if (overlap(G.x + 0.08, G.y - 1, 0.84, 1, b.x, b.y, b.w, b.h)) { if (G.vy >= 0 && G.y <= b.y + 0.45) { G.y = b.y; G.vy = 0; landed = true; } else return die(G, 'block'); } } } }
  G.ground = landed; if (!landed) G.rot += dt * 7.5 * s; else G.rot = Math.round(G.rot / (Math.PI / 2)) * (Math.PI / 2);
  // spikes (a small box at each spike's middle)
  const cy = s > 0 ? G.y : G.y - 1; for (const k2 of G.spikes) { if (k2.x > G.x + 2) continue; if (k2.x < G.x - 2) continue; const sy = k2.up ? k2.y : k2.y - 0.5; if (overlap(G.x + 0.2, cy + 0.1, 0.6, 0.8, k2.x + 0.37, sy + (k2.up ? 0 : 0.05), 0.26, 0.45)) return die(G, 'spike'); }
  // pads, portals, coins
  if (G.ground) for (const p of G.pads) if (G.x + 0.9 > p.x && G.x < p.x + 0.8 && s > 0) { G.vy = PADV; G.ground = false; G.ev.push({ k: 'pad', x: p.x }); if (G.lesson) lessonSee(G, 'pad'); }
  for (const p of G.portals) if (px + 0.5 < p.x && G.x + 0.5 >= p.x && G.s !== p.to) { G.s = p.to; G.vy *= 0.3; G.ground = false; if (p.to < 0) G.y = Math.max(G.y + 1, 1); G.ev.push({ k: 'flip', s: G.s }); if (G.lesson) lessonSee(G, 'flip'); }
  G.coins.forEach((q, i) => { if (!G.coinsHave[i] && Math.hypot(G.x + 0.5 - q.x, (s > 0 ? G.y + 0.5 : G.y - 0.5) - q.y) < 1.0) { G.coinsHave[i] = true; G.got++; G.ev.push({ k: 'coin', i }); } });
  // out of the world
  if (G.y < -3 || G.y > TOP + 3) return die(G, 'fall');
  // flags and the end
  for (const f of G.flags) if (px < f && G.x >= f) { G.flagX = f; G.ev.push({ k: 'flag', pct: Math.round(100 * f / G.len) }); }
  G.best = Math.max(G.best, G.x / G.len);
  if (G.x >= G.len) { G.ev.push({ k: 'finish' }); if (G.lesson) { lessonSee(G, 'finish'); return; } G.wait = 1.2; G.next = () => finish(G, true); } }
function die(G, why) { G.dead = 1; G.deaths++; G.lives--; G.ev.push({ k: 'crash', why, x: G.x, y: G.y, pct: Math.round(100 * G.x / G.len), lives: G.lives });
  if (G.lesson) { lessonMiss(G, why); return; }
  if (G.lives <= 0) { G.wait = 0.9; G.next = () => finish(G, false); return; }
  G.wait = 0.55; G.next = () => respawn(G); }
function respawn(G) { const fx = G.flagX; G.x = fx > 0 ? fx - 1.5 : 0; G.y = 0; G.vy = 0; G.s = 1; G.ground = true; G.rot = 0; G.dead = 0; G.holdOn = false; G.orbUsed = new Set(); G.ev.push({ k: 'respawn', x: G.x });
  // a flag is always on open floor, with nothing just ahead (they are placed so); if not, step forward to the next safe spot
  for (let t = 0; t < 40 && !safeSpot(G, G.x); t++) G.x += 0.5; }
function safeSpot(G, x) { if (!onFloor(G, x) || !onFloor(G, x + 3)) return false; for (const b of G.blocks) if (b.x < x + 4 && b.x + b.w > x - 1 && !b.roof && b.y < 3) return false; for (const k2 of G.spikes) if (k2.x > x - 1 && k2.x < x + 4) return false; return !G.portals.some(p => p.x > x - 1 && p.x < x + 4); }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, pct = Math.round(100 * Math.min(1, G.best));
  const stars = win ? 1 + (G.deaths <= 1 ? 1 : 0) + (G.deaths === 0 ? 1 : 0) : 0;
  G.res = { win, stars, score: Math.round(pct * 10 + G.got * 200 + (win ? 1000 - G.deaths * 200 : 0)), prog: pct / 100, pct, deaths: G.deaths, coinsGot: G.got, coinsAll: G.coins.length, jumps: G.jumps,
    coins: G.got * (3 + 2 * upLv('coin')) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : Math.round(pct / 30)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps; holds; lets go
const BLIND = { t: G => { press(G); release(G); }, h: G => press(G), r: G => release(G) };
// a player who looks: sees what is coming and finds when to jump by trying it out in its head (a short look ahead: jump now,
// or wait a moment), then jumps a little early or late (more so when sloppy)
function snap(G) { return { x: G.x, y: G.y, vy: G.vy, s: G.s, ground: G.ground, rot: G.rot, dead: 0, orbUsed: new Set(G.orbUsed), ev: [], cfg: G.cfg, blocks: G.blocks, spikes: G.spikes, pads: G.pads, orbs: G.orbs, portals: G.portals, coins: [], coinsHave: [], floor: G.floor, ceils: G.ceils, flags: [], len: 1e9, lives: 99, deaths: 0, press: false, holdOn: false, best: 0, jumps: 0, got: 0, lesson: null, wait: 0, t: 0 }; }
const clone = S => Object.assign({}, S, { orbUsed: new Set(S.orbUsed), ev: [] });
function sim(S, frames, tapAt = -1) { for (let f = 0; f < frames; f++) { if (f === tapAt) S.press = true; const lv = S.lives; tick(S, 1 / 120); if (S.lives < lv) return f; tick(S, 1 / 120); if (S.lives < lv) return f; S.press = false; if (S.s > 0 ? S.y < -0.4 : S.y > TOP + 0.4) return f; } return -1; }      // falling below the floor counts at once
// can the cube live 'frames' more (at 1/60) with at most 'depth' more taps?
function canLive(S0, frames, depth) { const d = sim(clone(S0), frames); if (d < 0) return true; if (!depth) return false;
  for (let f = 0; f <= d; f += 2) { const S1 = clone(S0); if (sim(S1, f) >= 0) continue; if (sim(S1, 1, 0) >= 0) continue; if (canLive(S1, frames - f - 1, depth - 1)) return true; } return false; }
function honest(G, o, mem) { if (G.over || G.wait > 0 || G.dead) { mem.tap = null; return; } const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (mem.tap != null) { mem.tap--; if (mem.tap <= 0) { mem.tap = null; press(G); release(G); mem.cool = 4; } return; }
  if (mem.cool > 0) { mem.cool--; return; } mem.k = (mem.k | 0) + 1; if (mem.k % 2) return;
  const S = snap(G), d0 = sim(S, 44); if (d0 < 0) return;
  // the taps that work (now, or a little later), then the middle of the first run of them, done a little off
  // best: a tap that needs no other soon (a clean jump); else one that needs one more
  let ok = []; for (const dep of [0, 1]) { ok = []; for (let f = 0; f <= Math.min(30, d0); f++) { const S1 = snap(G); if (sim(S1, f) >= 0) break; if (sim(S1, 1, 0) >= 0) continue; if (canLive(S1, Math.max(24, d0 - f + 18), dep)) ok.push(f); else if (ok.length) break; } if (ok.length) break; }
  if (!ok.length) { if (d0 > 22) return; press(G); release(G); mem.cool = 4; return; }      // nothing works yet: wait if there is time, else jump and hope
  const f = ok[Math.floor(ok.length / 2)], err = Math.round((R() - 0.5) * 2 * (1 - acc) * 6 + (R() < (1 - acc) * 0.25 ? (R() < 0.5 ? -4 : 5) : 0) + react * 2 * (R() - 0.3));
  mem.tap = Math.max(0, f + err); if (mem.tap === 0) { mem.tap = null; press(G); release(G); mem.cool = 4; } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.best = 1; finish(G, true); }
// ---------- LESSONS: short courses ----------
const LESSONS = {
  1: [{ id: 'jump', title: 'TAP TO JUMP', say: G => dashCue(G)[0], do: G => dashCue(G)[1], at: G => dashCue(G)[2], how: 'Tap anywhere to jump over the spikes. Land on the blocks. Reach the end!' }],
  2: [{ id: 'pad', title: 'PADS AND RINGS', say: G => dashCue(G)[0], do: G => dashCue(G)[1], at: G => dashCue(G)[2], how: 'Yellow pads throw you high by themselves. Over a gap, tap as you pass through the yellow ring to jump again.' }],
  3: [{ id: 'ceil', title: 'DON\'T JUMP!', say: G => dashCue(G)[0], do: G => dashCue(G)[1], at: G => dashCue(G)[2], how: 'Spikes hang low over the floor: do NOT jump under them. Then a blue portal flips you onto the ceiling.' }],
};
// THE TUTORIAL SHOWS WHERE TO JUMP (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It showed a tap for
// the whole run. Now the hand taps on the track at the spot where the robot would take off (the middle of the moments that clear what is
// coming): TAP WHEN YOU REACH THE HAND. Seeing the spot come lets a thumb be on time; a flash saying NOW comes too late for a jump.
const DSC = { t: -1e9, f: null, x: 0, y: 0 };
function dashCue(G) { if (G.dead || G.over) DSC.lock = false; if (G.over || G.wait > 0 || G.dead) return ['WAIT…', 'wait', false]; const now = G.t * 1000;
  if (Math.abs(now - DSC.t) >= 50 || DSC.g !== G) { DSC.t = now; DSC.g = G; const S = snap(G), d0 = sim(S, 44); let f = null;
    if (d0 >= 0) { let ok = []; for (const dep of [0, 1]) { ok = []; for (let q = 0; q <= Math.min(30, d0); q++) { const S1 = snap(G); if (sim(S1, q) >= 0) break; if (sim(S1, 1, 0) >= 0) continue; if (canLive(S1, Math.max(24, d0 - q + 18), dep)) ok.push(q); else if (ok.length) break; } if (ok.length) break; }
      f = ok.length ? ok[Math.floor(ok.length / 2)] : Math.max(0, d0 - 22); }      // (nothing clean: the robot jumps when the danger is 22 frames off)
    if (DSC.lock && (G.x > DSC.x + 0.3 || G.dead)) DSC.lock = false;      // the spot is passed: look for the next
    if (!DSC.lock && f != null) { const S2 = snap(G); sim(S2, f); DSC.x = S2.x; DSC.y = S2.y; DSC.lock = true; }      // the spot is fixed when first seen (the middle of the moments that work THEN), so it does not creep forward as they pass
    DSC.f = DSC.lock ? 1 : null; if (DSC.lock) { const S1 = snap(G); sim(S1, 1, 0); G.cueF = Math.round((DSC.x - G.x) / Math.max(0.01, S1.x - G.x)); } else G.cueF = null; }      // (cueF: frames to the spot, for the tests' thumb)
  const orb = !G.ground && G.orbs.find(o => !G.orbUsed.has(o.x) && o.x > G.x && o.x - G.x < 4.5);      // in the air with a yellow ring ahead: the hand on the ring
  if (orb) { const S1 = snap(G); sim(S1, 1, 0); G.cueF = Math.round((orb.x - 0.6 - G.x) / Math.max(0.01, S1.x - G.x)); const u = Math.min(W / 11, H / 15), x0 = G.x - W * 0.2 / u, gy = H * 0.7 + CAMY * u; return ['TAP IN THE YELLOW RING', 'tap', [(orb.x - x0) * u, gy - orb.y * u]]; }
  if (DSC.f == null) return [G.lesson && G.lesson.steps[G.lesson.i].id === 'ceil' ? 'DON\'T JUMP… WAIT' : 'WAIT…', 'wait', false];
  const u = Math.min(W / 11, H / 15), x0 = G.x - W * 0.2 / u, gy = H * 0.7 + CAMY * u;
  return ['TAP WHEN YOU REACH THE HAND', 'tap', [(DSC.x - x0) * u, gy - DSC.y * u]]; }
const LCOURSE = {
  jump: (G, R, b) => { let x = 8; for (const k2 of ['spike1', 'spike1', 'block', 'spike2', 'blockspike', 'spike2', 'spike3']) { const P = piece(G, k2, x, R, b); x += P.len + 5; } return x + 6; },
  pad: (G, R, b) => { let x = 8; const fl = []; for (const k2 of ['spike1', 'pad', 'orb', 'pad', 'orb', 'spike2']) { const P = piece(G, k2, x, R, b); if (P.pit) fl.push([x + P.pit[0], x + P.pit[1]]); x += P.len + 5; } G.pits = fl; return x + 6; },
  ceil: (G, R, b) => { let x = 8; const fl = []; for (const k2 of ['spike1', 'hang', 'spike2', 'hang', 'flip', 'spike1']) { const P = piece(G, k2, x, R, b); if (P.pit) fl.push([x + P.pit[0], x + P.pit[1]]); x += P.len + 5; } G.pits = fl; return x + 6; },
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); setup(G, { course: LCOURSE[st.id], lives: 99 });
  if (G.pits) { // lesson courses: cut the pits into the floor
    let from = -20; const fl = []; for (const [a, b] of G.pits.sort((p, q) => p[0] - q[0])) { fl.push([from, a]); from = b; } fl.push([from, G.len + 60]); G.floor = fl; G.pits = null; }
  G.flags = []; G.ev.push({ k: 'course' }); }
function lessonMiss(G, why) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: why === 'head' ? 'Bonk! Under hanging spikes, do not jump: just run.' : st.how }); G.wait = 1.0; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || what !== 'finish') return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'course' }); }; }
