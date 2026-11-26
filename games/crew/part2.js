
// ===================== RULES: Shadow Crew (game 75: his idea, like Among Us, as big as five games) =====================
// You are the hidden traitor on a space station. The rest of the crew walk about doing their jobs; you walk among them.
// When no one can see, you can knock a crewmate out. Anyone who sees it runs for the alarm; anyone who finds a body calls a
// meeting, and at a meeting everyone votes: if most vote for you, you are thrown out. Knock out the crew until only one is
// left, before they finish their jobs. Vents take you from room to room (never let anyone see you use one); sabotage turns
// the lights off, locks doors, or melts the reactor down. At a meeting you can point at someone else.
// The station is a grid of 1 m cells (x across, z down the map); walls are the cells that are not floor.
const RULES = [
  '<b>Left thumb:</b> slide to walk. You are the <b>hidden traitor</b>: nobody knows.',
  '<b>KNOCK OUT</b> a crewmate when <b>no one else can see</b>. Anyone who sees it runs for the alarm.',
  'A body found means a <b>meeting</b>: everyone votes. Most votes on you and you are out. <b>Point at someone else.</b>',
  '<b>Vents</b> take you room to room (never be seen). <b>Sabotage</b>: lights out, doors locked, reactor meltdown.',
  'Win: only <b>one crewmate</b> left. Lose: you are voted out, or the crew <b>finish their jobs</b>.',
];
// ---------- the station ----------
const SW = 54, SD = 30;
const ROOMS = [['Cafeteria', 18, 1, 13, 9], ['Weapons', 35, 2, 8, 6], ['O2', 35, 11, 6, 5], ['Navigation', 46, 9, 7, 8], ['Shields', 35, 21, 8, 6], ['Comms', 26, 24, 6, 5], ['Storage', 17, 20, 8, 9], ['Admin', 26, 13, 6, 5],
  ['Electrical', 9, 18, 7, 6], ['Lower Engine', 1, 22, 7, 6], ['Security', 9, 10, 5, 5], ['Reactor', 0, 10, 6, 7], ['Upper Engine', 1, 1, 7, 6], ['MedBay', 10, 2, 6, 5]];
const HALLS = [[8, 3, 2, 2], [16, 4, 2, 2], [31, 4, 4, 2], [23, 10, 2, 10], [25, 14, 1, 2], [32, 14, 3, 2], [42, 8, 1, 6], [41, 13, 5, 2], [39, 16, 2, 5], [43, 15, 2, 7], [25, 26, 1, 2], [16, 25, 1, 2], [8, 24, 9, 2], [4, 7, 2, 3], [4, 17, 2, 5], [6, 12, 3, 2], [14, 12, 2, 2], [12, 15, 2, 3], [16, 20, 1, 2], [31, 7, 4, 2], [32, 25, 3, 2]];
const RI = n => ROOMS.findIndex(r => r[0] === n);
// jobs (where crewmates work: two or three in each room), vents (joined in groups), the alarm button, the camera desk
const JOBS = [[20, 2, 0], [29, 2, 0], [24, 8, 0], [41, 3, 1], [36, 6, 1], [36, 12, 2], [39, 14, 2], [51, 10, 3], [47, 15, 3], [41, 22, 4], [36, 25, 4], [27, 25, 5], [30, 27, 5], [18, 21, 6], [23, 27, 6], [18, 26, 6],
  [27, 14, 7], [30, 16, 7], [10, 19, 8], [14, 22, 8], [2, 23, 9], [6, 26, 9], [12, 13, 10], [1, 11, 11], [3, 15, 11], [2, 2, 12], [6, 5, 12], [11, 3, 13], [14, 5, 13]];
const VENTS = [[3, 4, 0], [2, 13, 0], [3, 25, 0], [12, 5, 1], [11, 11, 1], [10, 22, 1], [21, 8, 2], [30, 15, 2], [19, 24, 2], [40, 6, 3], [50, 15, 3], [38, 15, 4], [41, 25, 4], [29, 26, 4]];
const BUTTON = [24.5, 5.5], CAMDESK = [12.5, 11.2], PANEL = [15, 18.6], CORE = [[1.2, 12], [1.2, 15]];
// the camera-watched places (while someone sits at the camera desk): the halls by Cafeteria, Admin, Storage and Navigation
const CAMS = [[24, 14, 6], [24, 21, 5], [44, 13, 5], [33, 8, 5]];
const NAMES = ['YOU', 'RUBY', 'SKY', 'LIME', 'SUNNY', 'PLUM', 'MINT', 'CORAL', 'SNOW', 'COCOA', 'ROSE'];
const COLS = [0x8a5ae8, 0xe84a5a, 0x4aa8ff, 0x7ad84a, 0xffd040, 0xa060d8, 0x4ae0c0, 0xff8a6a, 0xf0f4ff, 0x9a6a4a, 0xff7ac8];
const KINDS = ['round', 'cat', 'bunny', 'sprout', 'horns', 'antenna', 'bear', 'fluff', 'round', 'cat', 'bunny'];      // who each one is (ears, horns...)
const LOOKS = [{ id: 'violet', col: 0x8a5ae8, stars: 0 }, { id: 'midnight', col: 0x3a4a8a, stars: 6 }, { id: 'ember', col: 0xe86a2a, stars: 15 }, { id: 'jade', col: 0x2aa86a, stars: 30 }, { id: 'gold', col: 0xd8a830, stars: 50 }];
const UPGRADES = [
  { id: 'quick', name: 'Quick hands', desc: 'Knock-outs come back 2 seconds sooner.', max: 3, cost: l => 60 + l * 70 },
  { id: 'feet', name: 'Light feet', desc: 'You walk 6% faster.', max: 2, cost: l => 50 + l * 60 },
  { id: 'smooth', name: 'Smooth talker', desc: 'Your words at meetings count 20% more.', max: 2, cost: l => 80 + l * 80 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Stowaway'], [40, 'Sneak'], [130, 'Shadow'], [320, 'Phantom'], [700, 'Mastermind'], [1500, 'Legend']];
const placeOf = N => 0, PLACES = [{ name: 'Station Nine' }];
function makeCfg(N, help) { help = help || N === 1;      /* 26 Nov 2026, his words: "the first level should be the only one that is given": level 1 always has the help a loss gives */ const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  const crew = Math.round(x(5, 9, 25)) + (boss ? 1 : 0);
  return { N, f, help: !!help, place: 0, boss, crew, vis: x(5.6, 7.2, 30), cd: x(10, 15, 30) - 2 * upLv('quick') - (help ? 3 : 0), job: x(3.6, 1.5, 30), need: Math.round(crew * x(4.6, 7.2, 30) * (help ? 1.3 : 1)),
    speed: 2.45 * (1 + 0.06 * upLv('feet')), cspeed: x(2.1, 2.45, 30), buddy: N >= 4 ? x(0, 0.55, 25) : 0, cams: N >= 6, lights: N >= 3, doors: N >= 5, reactor: N >= 8, sheriff: N >= 12,
    trust: x(0.7, 0.9, 30), talk: 1 + 0.2 * upLv('smooth'), alert: x(0.3, 0.6, 30) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: 0, wait: 0, next: null };
  grid(G); setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function grid(G) { const g = new Uint8Array(SW * SD), rm = new Int8Array(SW * SD).fill(-1);
  ROOMS.forEach(([n, x, z, w, d], i) => { for (let a = x; a < x + w; a++) for (let b = z; b < z + d; b++) { g[b * SW + a] = 1; rm[b * SW + a] = i; } });
  for (const [x, z, w, d] of HALLS) for (let a = x; a < x + w; a++) for (let b = z; b < z + d; b++) g[b * SW + a] = 1; G.g = g; G.rm = rm; G.shut = new Uint8Array(SW * SD); }
const open = (G, a, b) => a >= 0 && b >= 0 && a < SW && b < SD && G.g[b * SW + a] && !G.shut[b * SW + a];
const roomAt = (G, x, z) => { const a = Math.floor(x), b = Math.floor(z); return a >= 0 && b >= 0 && a < SW && b < SD ? G.rm[b * SW + a] : -1; };
const roomName = (G, x, z) => { const r = roomAt(G, x, z); return r >= 0 ? ROOMS[r][0] : 'the halls'; };
// can one see from a to b? (open cells all the way, within 'far')
function los(G, x0, z0, x1, z1, far) { const d = Math.hypot(x1 - x0, z1 - z0); if (d > far) return false; const n = Math.ceil(d / 0.25); for (let i = 1; i < n; i++) { const u = i / n; if (!G.g[Math.floor(z0 + (z1 - z0) * u) * SW + Math.floor(x0 + (x1 - x0) * u)]) return false; } return true; }
// the way from cell to cell (breadth first over open cells)
function path(G, x0, z0, x1, z1) { if (!open(G, Math.floor(x1), Math.floor(z1)) || !G.g[Math.floor(z0) * SW + Math.floor(x0)]) return null; const s = Math.floor(z0) * SW + Math.floor(x0), e = Math.floor(z1) * SW + Math.floor(x1); if (s === e) return [[x1, z1]]; const prev = new Int32Array(SW * SD).fill(-1), q = [s]; prev[s] = s;
  for (let h = 0; h < q.length; h++) { const c = q[h]; if (c === e) break; const a = c % SW, b = (c / SW) | 0; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const na = a + da, nb = b + db; if (!open(G, na, nb)) continue; const n = nb * SW + na; if (prev[n] >= 0) continue; prev[n] = c; q.push(n); } }
  if (prev[e] < 0) return null; const out = []; for (let c = e; c !== s; c = prev[c]) out.push([(c % SW) + 0.5, ((c / SW) | 0) + 0.5]); out.reverse(); out[out.length - 1] = [x1, z1]; return out; }
// ---------- the people ----------
function person(G, i, x, z) { return { i, name: NAMES[i], col: COLS[i], kind: KINDS[i], x, z, a: 0, alive: true, body: false, path: null, job: null, work: 0, wait: 0, mode: 'job', seen: {}, sus: 0, buddy: -1, walk: 0, moving: false, fled: false, sheriff: false, cam: 0 }; }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.ppl = []; G.cd = 8; G.done = 0; G.need = o.need || c.need; G.lightsOut = 0; G.doors = null; G.melt = 0; G.sabCd = 10; G.meet = null; G.bodies = [];
  G.kills = 0; G.hurry = 0; G.seenKill = 0; G.vents = 0; G.meetings = 0; G.ejected = []; G.heat = 0; G.events = []; G.shut.fill(0); G.inVent = -1; G.faking = 0; G.stickX = 0; G.stickZ = 0;
  const n = o.crew != null ? o.crew : c.crew; G.ppl.push(person(G, 0, BUTTON[0], BUTTON[1] + 1.6));
  for (let i = 1; i <= n; i++) { const a = i / n * TAU; G.ppl.push(person(G, i, BUTTON[0] + Math.cos(a) * 2.2, BUTTON[1] + Math.sin(a) * 1.6)); }
  G.you = G.ppl[0];
  // buddies (from level 4): some walk in pairs; a sheriff (from level 12) can stop you himself
  for (let i = 1; i < n; i += 2) if (R() < c.buddy) { G.ppl[i].buddy = i + 1; G.ppl[i + 1].buddy = i; G.ppl[i + 1].mode = 'follow'; }
  if (c.sheriff) G.ppl[1 + ((R() * n) | 0)].sheriff = true;
  if (o.place) o.place(G, R); }
const crew = G => G.ppl.filter(p => p.i && p.alive);
// ---------- your thumb (a floating stick) and your buttons ----------
function stick(G, x, z) { const m = Math.hypot(x, z); G.stickX = m > 1 ? x / m : x; G.stickZ = m > 1 ? z / m : z; }
function canKill(G) { if (G.cd > 0 || G.inVent >= 0 || G.meet || G.wait > 0) return null; let best = null, bd = 1.35; for (const p of crew(G)) { const d = Math.hypot(p.x - G.you.x, p.z - G.you.z); if (d < bd && los(G, G.you.x, G.you.z, p.x, p.z, 2)) { bd = d; best = p; } } return best; }
function ventNear(G) { if (G.meet) return -1; let best = -1, bd = 1.0; VENTS.forEach((v, i) => { const d = Math.hypot(v[0] + 0.5 - G.you.x, v[1] + 0.5 - G.you.z); if (d < bd) { bd = d; best = i; } }); return best; }
function bodyNear(G) { return G.bodies.find(b => Math.hypot(b.x - G.you.x, b.z - G.you.z) < 1.6 && los(G, G.you.x, G.you.z, b.x, b.z, 2)) || null; }
function jobNear(G) { return JOBS.findIndex(j => Math.hypot(j[0] + 0.5 - G.you.x, j[1] + 0.5 - G.you.z) < 1.0); }
// knock a crewmate out: they fall where they stand; anyone who can see either of you saw it
function knock(G) { const p = canKill(G); if (!p) return false; const Y = G.you; p.alive = false; p.body = true; p.path = null; G.cd = G.cfg.cd; G.kills++;
  const b = { i: p.i, x: p.x, z: p.z, t: G.t, room: roomName(G, p.x, p.z) }; G.bodies.push(b); Y.x += (p.x - Y.x) * 0.6; Y.z += (p.z - Y.z) * 0.6;
  const wit = witnesses(G, Y.x, Y.z, p.x, p.z, p.i); for (const w of wit) { w.saw = { t: G.t, by: 0, victim: p.i }; w.mode = 'flee'; w.path = null; G.seenKill++; }
  // a knock-out is not silent: anyone close by (even round a corner) comes to look
  if (!G.lesson) for (const w of crew(G)) if (!wit.includes(w) && w.mode !== 'flee' && Math.hypot(w.x - p.x, w.z - p.z) < 4.2) { w.mode = 'look'; w.lookAt = [p.x, p.z]; w.path = null; w.cam = 0; G.ev.push({ k: 'heard', i: w.i }); }
  G.events.push({ k: 'kill', t: G.t, x: p.x, z: p.z, victim: p.i }); G.ev.push({ k: 'knock', i: p.i, x: p.x, z: p.z, seen: wit.length });
  if (G.lesson) lessonSee(G, 'knock', wit.length); return true; }
// who would see something at a and b now (living crew, not 'skip'; through the cameras too, while someone watches them)
function visOf(G, p) { return G.lightsOut > 0 ? 2.2 : G.cfg.vis; }
function witnesses(G, ax, az, bx, bz, skip = -1) { const out = []; for (const w of crew(G)) { if (w.i === skip) continue; const V = visOf(G, w); if (los(G, w.x, w.z, ax, az, V) || los(G, w.x, w.z, bx, bz, V)) out.push(w); }
  if (G.cfg.cams) { const watcher = crew(G).find(w => w.cam > 0 && w.i !== skip); if (watcher && !out.includes(watcher) && CAMS.some(cm => Math.hypot(cm[0] - ax, cm[1] - az) < cm[2] && los(G, cm[0], cm[1], ax, az, cm[2]))) { out.push(watcher); watcher.camSaw = true; } } return out; }
function vent(G) { const Y = G.you; if (G.meet || G.wait > 0) return false;
  if (G.inVent >= 0) { // in a vent: hop to the next one in the same group
    const grp = VENTS.filter(v => v[2] === VENTS[G.inVent][2]), k2 = grp.indexOf(VENTS[G.inVent]), nx = grp[(k2 + 1) % grp.length]; G.inVent = VENTS.indexOf(nx); Y.x = nx[0] + 0.5; Y.z = nx[1] + 0.5; G.ev.push({ k: 'venthop', v: G.inVent }); return true; }
  const v = ventNear(G); if (v < 0) return false; const w = witnesses(G, Y.x, Y.z, Y.x, Y.z); for (const s of w) { s.sus += 3; s.sawVent = G.t; } G.inVent = v; G.vents++; Y.x = VENTS[v][0] + 0.5; Y.z = VENTS[v][1] + 0.5;
  G.ev.push({ k: 'ventin', v, seen: w.length }); if (G.lesson) lessonSee(G, 'vent', w.length); return true; }
function ventOut(G) { if (G.inVent < 0) return false; const Y = G.you, w = witnesses(G, Y.x, Y.z, Y.x, Y.z); for (const s of w) { s.sus += 3; s.sawVent = G.t; } G.inVent = -1; G.ev.push({ k: 'ventout', seen: w.length }); if (G.lesson) lessonSee(G, 'ventout', w.length); return true; }
// sabotage: lights out (crewmates see 2 m; one goes to fix them), doors (a room's doorways shut), the reactor (fix it or you win)
function sabotage(G, kind) { const c = G.cfg; if (G.sabCd > 0 || G.meet || G.lightsOut > 0 || G.melt > 0 || G.doors) return false;
  if (kind === 'lights' && c.lights) { G.lightsOut = 16; G.fixer = null; }
  else if (kind === 'doors' && c.doors) { const r = roomAt(G, G.you.x, G.you.z) >= 0 ? roomAt(G, G.you.x, G.you.z) : nearestRoom(G, G.you.x, G.you.z); shutRoom(G, r); G.doors = { r, t: 9 }; }
  else if (kind === 'reactor' && c.reactor) { G.melt = 32; G.fix = [0, 0]; }
  else return false; G.sabCd = 26; G.ev.push({ k: 'sab', kind }); return true; }
function nearestRoom(G, x, z) { let best = 0, bd = 1e9; ROOMS.forEach((r, i) => { const d = Math.hypot(r[1] + r[3] / 2 - x, r[2] + r[4] / 2 - z); if (d < bd) { bd = d; best = i; } }); return best; }
function shutRoom(G, r) { const [n, x, z, w, d] = ROOMS[r]; for (let a = x - 1; a <= x + w; a++) for (let b = z - 1; b <= z + d; b++) { if (a >= x && a < x + w && b >= z && b < z + d) continue; if (a >= 0 && b >= 0 && a < SW && b < SD && G.g[b * SW + a]) G.shut[b * SW + a] = 1; } }
// a pretend job: stand at a job and hold USE (crewmates who see you doing it trust you a little more)
function fake(G, on) { G.faking = on && jobNear(G) >= 0 ? (G.faking || 1e-6) : 0; }
// your own report: find the body yourself (a bold alibi)
function report(G) { const b = bodyNear(G); if (!b) return false; meeting(G, 0, b); return true; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  if (G.meet) { G.meet.t += dt; return; }
  G.t += dt; G.cd = Math.max(0, G.cd - dt); G.sabCd = Math.max(0, G.sabCd - dt); const c = G.cfg;
  if (G.lightsOut > 0) { G.lightsOut -= dt; if (G.lightsOut <= 0) G.ev.push({ k: 'lightson' }); }
  if (G.doors) { G.doors.t -= dt; if (G.doors.t <= 0) { G.shut.fill(0); G.doors = null; G.ev.push({ k: 'doorsopen' }); } }
  if (G.melt > 0) { G.melt -= dt; if (G.fix[0] > 1.5 && G.fix[1] > 1.5) { G.melt = 0; G.ev.push({ k: 'fixed' }); } else if (G.melt <= 0) { G.ev.push({ k: 'meltdown' }); if (G.lesson) return; G.wait = 1.6; G.next = () => finish(G, true, 'meltdown'); return; } }
  moveYou(G, dt); if (G.faking) { G.faking += dt; }
  if (!G.hurry && !G.lesson && G.t > 40 + G.cfg.crew * 12) { G.hurry = 1; G.ev.push({ k: 'hurry' }); }
  for (const p of crew(G)) think(G, p, dt);
  if (G.over || G.meet || G.wait > 0) return;
  if (crew(G).length <= 1 && !G.lesson) { G.ev.push({ k: 'last' }); G.wait = 1.4; G.next = () => finish(G, true, 'last'); return; }
  if (G.done >= G.need && !G.lesson) { G.ev.push({ k: 'jobsdone' }); G.wait = 1.4; G.next = () => finish(G, false, 'jobs'); } }
function moveYou(G, dt) { const Y = G.you; if (G.inVent >= 0) { Y.moving = false; return; } const sp = G.cfg.speed * (G.faking ? 0 : 1), vx = G.stickX * sp, vz = G.stickZ * sp; Y.moving = Math.hypot(vx, vz) > 0.1; if (Y.moving) { Y.a = Math.atan2(vx, vz); Y.walk += dt * 9; G.faking = 0; }
  const r = 0.28, tryAt = (x, z) => open(G, Math.floor(x - r), Math.floor(z - r)) && open(G, Math.floor(x + r), Math.floor(z - r)) && open(G, Math.floor(x - r), Math.floor(z + r)) && open(G, Math.floor(x + r), Math.floor(z + r));
  if (tryAt(Y.x + vx * dt, Y.z)) Y.x += vx * dt; if (tryAt(Y.x, Y.z + vz * dt)) Y.z += vz * dt; }
// a crewmate's mind: do jobs (walking between them), follow a buddy, see what there is to see
function think(G, p, dt) { const c = G.cfg, Y = G.you, V = visOf(G, p);
  p.look = (p.look || 0) - dt;
  if (p.look <= 0) { p.look = 0.2;
    // you, in sight: remember where and when, and what you were doing
    if (G.inVent < 0 && los(G, p.x, p.z, Y.x, Y.z, V)) { p.seen[0] = { t: G.t, x: Y.x, z: Y.z, job: G.faking > 1, far: Math.hypot(Y.x - p.x, Y.z - p.z) > 3 }; if (G.faking > 1) { p.alibi = G.t; p.sawWork = 1; }
      // a careful crewmate (later levels) keeps away from someone they distrust
      if (p.sus > 1 && c.alert && Math.hypot(Y.x - p.x, Y.z - p.z) < 3 && G.rnd() < c.alert) { p.mode = 'job'; p.path = null; p.job = null; }
      // the sheriff: you, by a body or out of a vent, close by: he stops you
      if (p.sheriff && p.sus >= 3 && Math.hypot(Y.x - p.x, Y.z - p.z) < 1.6) { G.ev.push({ k: 'sheriff', i: p.i }); if (G.lesson) return; G.wait = 1.4; G.next = () => finish(G, false, 'sheriff'); return; } }
    for (const q of crew(G)) if (q !== p && los(G, p.x, p.z, q.x, q.z, V)) p.seen[q.i] = { t: G.t, x: q.x, z: q.z }; 
    // a body in sight: report it at once (having looked round first: who is standing there?)
    for (const b of G.bodies) if (los(G, p.x, p.z, b.x, b.z, V)) { meeting(G, p.i, b); return; } }
  // someone who saw it runs for the alarm button and presses it
  if (p.mode === 'flee') { if (!p.path) p.path = path(G, p.x, p.z, BUTTON[0], BUTTON[1]); if (walkPath(G, p, dt, c.cspeed * 1.25)) { meeting(G, p.i, null); } return; }
  if (p.mode === 'look') { if (!p.path) p.path = path(G, p.x, p.z, p.lookAt[0], p.lookAt[1]) || []; if (walkPath(G, p, dt, c.cspeed * 1.2) || !p.path.length) { p.mode = 'job'; p.path = null; p.job = null; } return; }
  // the reactor: the nearest two go to fix it; the lights: one goes to the panel in Electrical
  if (G.melt > 0) { const fixers = crew(G).sort((a, b) => Math.hypot(a.x - 1, a.z - 13) - Math.hypot(b.x - 1, b.z - 13)).slice(0, 2), k2 = fixers.indexOf(p);
    if (k2 >= 0) { const s = CORE[k2]; if (!p.fixing) { p.path = path(G, p.x, p.z, s[0], s[1]); p.fixing = true; } if (walkPath(G, p, dt, c.cspeed * 1.3)) G.fix[k2] += dt; return; } }
  else p.fixing = false;
  if (G.lightsOut > 0) { if (!G.fixer || !G.fixer.alive) { G.fixer = crew(G).sort((a, b) => Math.hypot(a.x - PANEL[0], a.z - PANEL[1]) - Math.hypot(b.x - PANEL[0], b.z - PANEL[1]))[0]; G.fixer.path = null; G.fixer.job = null; }
    if (G.fixer === p) { if (!p.path) p.path = path(G, p.x, p.z, PANEL[0], PANEL[1]); if (walkPath(G, p, dt, c.cspeed * 1.2)) { p.fixT = (p.fixT || 0) + dt; if (p.fixT > 2.5) { G.lightsOut = 0; p.fixT = 0; G.fixer = null; G.ev.push({ k: 'lightson' }); } } return; } }
  // the camera desk (from level 6): now and then someone sits there and watches
  if (p.cam > 0) { p.cam -= dt; p.moving = false; if (p.cam <= 0) { p.job = null; p.path = null; } return; }
  if (p.patrol) { if (!p.path || !p.path.length) { p.pk = ((p.pk | 0) + 1) % p.patrol.length; const q = p.patrol[p.pk]; p.path = path(G, p.x, p.z, q[0], q[1]); p.wait = p.pk === 0 ? 2.5 : 0.3; } if (p.wait > 0) { p.wait -= dt; p.moving = false; return; } walkPath(G, p, dt, c.cspeed * 0.9); return; }
  if (p.walker && G.t < p.walker) { p.moving = false; return; }
  if (p.mode === 'follow') { const b = G.ppl[p.buddy]; if (!b || !b.alive) { p.mode = 'job'; return; } const d = Math.hypot(b.x - p.x, b.z - p.z); if (d > 1.6) { if (!p.path || G.rnd() < 0.02) p.path = path(G, p.x, p.z, b.x, b.z); walkPath(G, p, dt, c.cspeed * 1.05); } else p.moving = false; return; }
  if (p.wait > 0) { p.wait -= dt; p.moving = false; return; }
  if (!p.job) { if (c.cams && G.rnd() < 0.12 && !crew(G).some(q => q.cam > 0 || q.job === 'cam')) { p.job = 'cam'; p.path = path(G, p.x, p.z, CAMDESK[0], CAMDESK[1]); }
    else { const j = JOBS[(G.rnd() * JOBS.length) | 0]; p.job = j; p.path = path(G, p.x, p.z, j[0] + 0.5, j[1] + 0.5); p.work = 0; } }
  if (!p.path) { p.job = null; return; }
  if (walkPath(G, p, dt, c.cspeed)) { if (p.job === 'cam') { p.cam = 6 + G.rnd() * 6; p.job = null; return; } p.work += dt; p.moving = false; p.working = true; if (p.work >= c.job / (1 + Math.max(0, G.t - 40 - c.crew * 12) / 60)) { p.working = false; G.done++; G.ev.push({ k: 'job', i: p.i }); p.job = null; p.path = null; p.wait = 0.3 + G.rnd() * 0.8; } }
  else p.working = false; }
// along a path; true once there
function walkPath(G, p, dt, sp) { if (!p.path) return false; if (!p.path.length) return true; const [tx, tz] = p.path[0], dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), s = sp * dt;
  if (G.shut[Math.floor(tz) * SW + Math.floor(tx)]) { p.moving = false; return false; }      // a locked door: wait
  if (d <= s) { p.x = tx; p.z = tz; p.path.shift(); p.moving = p.path.length > 0; return !p.path.length; } p.x += dx / d * s; p.z += dz / d * s; p.a = Math.atan2(dx, dz); p.moving = true; p.walk += dt * 9; return false; }
// ---------- meetings ----------
// what each crewmate has to say: who did it (seen), who came out of a vent, who was near the body, who was with whom
function meeting(G, by, body) { if (G.meet || G.over) return; const c = G.cfg, Y = G.you, says = [], sus = {}; for (const p of G.ppl) if (p.alive) sus[p.i] = 0; G.meetings++;
  const capd = {}, add = (who, w, line, from, cap) => { if (sus[who] == null) return; if (cap) { const key = cap + who, used = capd[key] || 0; w = Math.min(w, Math.max(0, (cap === 'with' ? 2.2 : 3.4) - used)); capd[key] = used + w; } sus[who] += w; says.push({ from, line, who, w }); };
  // the one who found the body found you standing over it
  if (body && by && G.inVent < 0 && Math.hypot(G.you.x - body.x, G.you.z - body.z) < 2.2 && los(G, G.ppl[by].x, G.ppl[by].z, G.you.x, G.you.z, c.vis + 3)) add(0, 3.2, `I found ${NAMES[0]} right next to the body!`, by);
  // nobody has ever seen you do a job: that is noticed, more at every meeting
  if (G.t > 20 && !G.lesson && !crew(G).some(p => p.sawWork)) { let w = null; for (const p of crew(G)) if (p.seen[0] && (!w || p.seen[0].t > w.seen[0].t)) w = p; if (w) { add(0, Math.min(2.4, 0.9 * G.meetings), `Has anyone seen ${NAMES[0]} do a single job?`, w.i); G.ev.push({ k: 'idle' }); } }
  for (const p of crew(G)) {
    if (p.saw) add(0, 9, `I SAW ${NAMES[0]} DO IT!`, p.i);
    else if (p.sawVent && G.t - p.sawVent < 60) add(0, 4, `${NAMES[0]} came out of a VENT!`, p.i);
    else if (body && p.seen[0] && Math.hypot(p.seen[0].x - body.x, p.seen[0].z - body.z) < 4 && G.t - p.seen[0].t < 12) add(0, 1.7, `${NAMES[0]} was near ${body.room}...`, p.i, 'near');
    // you were seen with the one who is down, not long before
    else if (body && p.seen[0] && p.seen[0].far && p.seen[body.i] && Math.abs(p.seen[0].t - p.seen[body.i].t) < 1 && Math.hypot(p.seen[0].x - p.seen[body.i].x, p.seen[0].z - p.seen[body.i].z) < 3.5 && body.t - p.seen[0].t < 15) add(0, 1.1, `${NAMES[0]} was with ${G.ppl[body.i].name}!`, p.i, 'with');
    if (p.alibi && G.t - p.alibi < 25 && !p.saw) add(0, -1.2, `${NAMES[0]} was doing jobs with me.`, p.i);
    // a guess about someone else (crewmates are not sure of each other either)
    if (body) { let best = null, bt = 1e9; for (const q of crew(G)) { if (q === p || q.i === by) continue; const s = p.seen[q.i]; if (s && Math.hypot(s.x - body.x, s.z - body.z) < 6 && G.t - s.t < bt) { bt = G.t - s.t; best = q; } } if (best && G.rnd() < 0.7) add(best.i, 1.1, `${best.name} was around ${body.room}.`, p.i); } }
  // whoever found the body (if not you) is looked at a little too
  G.meet = { by, body, says, sus, t: 0, vote: null, votes: null, out: null, room: body ? body.room : null, victim: body ? body.i : -1 }; G.ev.push({ k: 'meeting', by, body: !!body });
  for (const b of G.bodies) G.ppl[b.i].gone = true; G.bodies = []; G.lightsOut = 0; G.doors = null; G.shut.fill(0); G.melt = 0; if (G.inVent >= 0) G.inVent = -1;
  if (G.lesson) lessonSee(G, 'meeting'); }
// your vote (a crewmate's number, or -1 to skip): your word adds to the crew's doubts about them, less the more they doubt you
function vote(G, who) { const M = G.meet; if (!M || M.votes) return; const c = G.cfg, R = G.rnd; M.vote = who;
  // blaming someone nobody has said a word against looks bad on you
  const baseless = who > 0 && !(M.sus[who] > 0.5) && !G.lesson;
  if (baseless) { M.sus[0] += 1; const sk = crew(G).find(q => q.i !== who); if (sk) M.says.push({ from: sk.i, line: `Why ${G.ppl[who].name}? Nobody said a thing about them...`, who: 0, w: 1 }); }
  if (who > 0) { const cred = clamp(1 - M.sus[0] / 6, 0.15, 1) * c.talk * (baseless ? 0.4 : 1); M.sus[who] += 1.6 * cred; M.says.push({ from: 0, line: `I think it was ${G.ppl[who].name}!`, who, w: 1.6 * cred }); }
  const votes = {}; votes[0] = []; for (const p of G.ppl) if (p.alive) votes[p.i] = []; votes.skip = [];
  for (const p of crew(G)) { if (p.saw) { votes[0].push(p.i); continue; } let best = 'skip', bs = 2 + R() * 0.8; for (const k2 in M.sus) { if (+k2 === p.i) continue; const s = M.sus[k2] * (c.trust + R() * 0.5) + R() * 0.6; if (s > bs) { bs = s; best = k2; } } votes[best].push(p.i); }
  if (who === -1) votes.skip.push(0); else votes[who].push(0);
  let top = 'skip', tn = votes.skip.length, tie = false; for (const k2 in votes) { if (k2 === 'skip') continue; const n = votes[k2].length; if (n > tn) { top = k2; tn = n; tie = false; } else if (n === tn && n > 0) tie = true; }
  M.votes = votes; M.out = top === 'skip' || tie ? -1 : +top; G.ev.push({ k: 'votes', out: M.out });
  if (G.lesson) { lessonSee(G, 'vote', M.out); return; }
  G.wait = 0.01; G.next = () => afterVote(G); }
function afterVote(G) { const M = G.meet; if (!M) return; if (M.out === 0) { G.ev.push({ k: 'ejected', i: 0 }); G.wait = 2.6; G.next = () => finish(G, false, 'voted'); return; }
  if (M.out > 0) { const p = G.ppl[M.out]; p.alive = false; p.gone = true; G.ejected.push(p.i); G.ev.push({ k: 'ejected', i: p.i }); }
  else G.ev.push({ k: 'noone' });
  // what was said about you is not forgotten: those who doubt you keep their distance from now on
  for (const p of crew(G)) p.sus += Math.max(0, M.sus[0]);
  G.wait = 2.6; G.next = () => { G.meet = null; regroup(G); G.ev.push({ k: 'resume' }); if (crew(G).length <= 1) { G.wait = 0.6; G.next = () => finish(G, true, 'last'); } }; }
// after a meeting: everyone back round the table, a fresh start
function regroup(G) { const L = crew(G); G.you.x = BUTTON[0]; G.you.z = BUTTON[1] + 1.6; L.forEach((p, j) => { const a = (j + 1) / (L.length + 1) * TAU; p.x = BUTTON[0] + Math.cos(a) * 2.4; p.z = BUTTON[1] + Math.sin(a) * 1.8; p.path = null; p.job = null; p.mode = p.buddy >= 0 && G.ppl[p.buddy].alive && p.i > p.buddy ? 'follow' : 'job'; p.saw = null; p.wait = G.rnd() * 1.5; p.cam = 0; p.seen = {}; p.sus *= 0.5; });
  G.cd = Math.max(G.cd, G.cfg.cd * 0.6); G.sabCd = Math.max(G.sabCd, 8); G.stickX = G.stickZ = 0; }
function finish(G, win, why) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, start = c.crew, prog = Math.min(1, (start - crew(G).length) / Math.max(1, start - 1));
  const stars = win ? 1 + (G.meetings === 0 ? 1 : 0) + (G.seenKill === 0 && G.ejected.length === 0 ? 1 : 0) : 0;
  G.res = { win, why, stars, score: Math.round(G.kills * 300 + (win ? 1000 + Math.max(0, G.need - G.done) * 20 : 0) + G.ejected.length * 250), prog, kills: G.kills, meetings: G.meetings, ejected: G.ejected.length, seen: G.seenKill, vents: G.vents, jobs: Math.round(100 * G.done / G.need),
    coins: win ? 6 + Math.ceil(G.N / 2) + stars * 3 : 1 + G.kills };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true; }
// ---------- for the robots ----------
// BLIND: thumbs that do not look: walk some way; press KNOCK OUT; a vent; sabotage; report; skip or vote at random at a meeting
const BLIND = { w: G => { const a = Math.random() * TAU; stick(G, Math.cos(a), Math.sin(a)); }, s: G => stick(G, 0, 0), k: G => knock(G), v: G => { if (G.inVent >= 0) ventOut(G); else vent(G); },
  b: G => sabotage(G, ['lights', 'doors', 'reactor'][(Math.random() * 3) | 0]), m: G => { if (G.meet && !G.meet.votes) { const L = crew(G); vote(G, Math.random() < 0.3 ? -1 : L.length ? L[(Math.random() * L.length) | 0].i : -1); } } };
// a player who looks: picks a crewmate who is alone, walks near, waits until no one else could see, knocks them out, then
// slips away (a vent if one is close and no one sees, or walks to another room and pretends to work); at a meeting it
// points at whoever the crew already doubt most (or skips when it is in doubt itself)
function honest(G, o, mem) { if (G.over || G.wait > 0) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, Y = G.you;
  if (G.meet) { if (G.meet.votes) return; mem.mt = (mem.mt || 0) + 1 / 60; if (mem.mt < 1.5 + react * 3) return; mem.mt = 0; const M = G.meet; let best = -1, bs = -1; for (const k2 in M.sus) { if (+k2 === 0) continue; if (M.sus[k2] > bs) { bs = M.sus[k2]; best = +k2; } }
    ACT.vote(G, (M.sus[0] > 3 && R() < 0.5) || bs < 0.6 ? -1 : best); return; }
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) { if (mem.p && mem.p.length) follow(G, mem); return; } mem.t = 0.12 + react * 0.3;
  if (G.inVent >= 0) { // in a vent: come out where no one sees (or hop on)
    if (witnesses(G, Y.x, Y.z, Y.x, Y.z).length) { ACT.vent(G); } else { ACT.ventOut(G); mem.p = null; mem.flee = false; } return; }
  const c = G.cfg, margin = (1 - acc) * 2.2;   // a sloppy one misjudges how far the crew can see
  const camOn = c.cams && crew(G).some(w => w.cam > 0), onCam = (x, z) => camOn && acc > 0.7 && CAMS.some(cm => Math.hypot(cm[0] - x, cm[1] - z) < cm[2] + 1);
  const watching = (x, z, skip) => onCam(x, z) || onCam(Y.x, Y.z) || crew(G).some(w => w.i !== skip && (los(G, w.x, w.z, x, z, visOf(G, w) - margin + acc) || los(G, w.x, w.z, Y.x, Y.z, visOf(G, w) - margin + acc)));
  // after a knock-out: get away from the body (a vent if close and unseen)
  if (mem.flee) { const vn = ventNear(G); if (vn >= 0 && !watching(Y.x, Y.z, -1)) { ACT.vent(G); return; }
    if (!mem.vp) { let bv = null, bd = 7 * acc; for (const v of VENTS) { const dd = Math.hypot(v[0] + 0.5 - Y.x, v[1] + 0.5 - Y.z); if (dd < bd) { bd = dd; bv = v; } } if (bv) { mem.p = path(G, Y.x, Y.z, bv[0] + 0.5, bv[1] + 0.5); mem.vp = 1; } } if (!mem.p || !mem.p.length) { const j = JOBS[(R() * JOBS.length) | 0]; if (Math.hypot(j[0] - Y.x, j[1] - Y.z) < 10) return; mem.p = path(G, Y.x, Y.z, j[0] + 0.5, j[1] + 0.5); mem.flee = false; mem.vp = 0; mem.fakeAt = j; } follow(G, mem); return; }
  // keep walking until well clear of the body
  if (mem.away && G.t - mem.away.t < 9 && Math.hypot(Y.x - mem.away.x, Y.z - mem.away.z) < 5) { if (!mem.p || !mem.p.length) { const j = JOBS[(R() * JOBS.length) | 0]; if (Math.hypot(j[0] - Y.x, j[1] - Y.z) > 7) { mem.p = path(G, Y.x, Y.z, j[0] + 0.5, j[1] + 0.5); mem.fakeAt = j; } } follow(G, mem); return; }
  // pretend to work where it stopped (now and then), so the crew see it at a job
  if (mem.fakeAt && jobNear(G) >= 0 && !G.faking && R() < 0.5) { ACT.fake(G, true); ACT.stick(G, 0, 0); mem.fakeT = 2 + R() * 3; mem.fakeAt = null; return; }
  if (G.faking) { mem.fakeT -= mem.t; if (mem.fakeT > 0 && G.cd > 1) return; ACT.fake(G, false); }
  // be seen working once in a while (the crew notice someone who never does a job)
  if (acc > 0.5 && G.cd > 3 && !crew(G).some(p => p.sawWork)) { if (jobNear(G) >= 0 && !G.faking && crew(G).some(w => los(G, w.x, w.z, Y.x, Y.z, visOf(G, w)))) { ACT.fake(G, true); ACT.stick(G, 0, 0); mem.fakeT = 2.2 + R() * 2; mem.p = null; return; }
    if (!mem.p || !mem.p.length || !mem.jobGo) { let bj = null, bd = 1e9; for (const j of JOBS) { const d2 = Math.hypot(j[0] + 0.5 - Y.x, j[1] + 0.5 - Y.z); if (d2 < bd && crew(G).some(w => Math.hypot(w.x - j[0], w.z - j[1]) < 6)) { bd = d2; bj = j; } } if (bj) { mem.p = path(G, Y.x, Y.z, bj[0] + 0.5, bj[1] + 0.5); mem.jobGo = 1; } }
    if (mem.p && mem.p.length) { follow(G, mem); return; } }
  mem.jobGo = 0;
  // the target: the crewmate with the fewest others near (and not with a buddy)
  const L = crew(G); if (!L.length) return; if (!mem.tg || !mem.tg.alive || R() < 0.015) { let best = null, bs = 1e9; for (const p of L) { let s = Math.hypot(p.x - Y.x, p.z - Y.z) * 0.15 + (p.moving ? 2 : 0) + (p.cam > 0 ? 6 : 0) + (p.buddy >= 0 && G.ppl[p.buddy].alive ? 4 : 0); for (const q of L) if (q !== p && Math.hypot(q.x - p.x, q.z - p.z) < 8) s += 3; if (s < bs) { bs = s; best = p; } } mem.tg = best; }
  const T = mem.tg, d = Math.hypot(T.x - Y.x, T.z - Y.z); if (d < 3.5 && watching(T.x, T.z, T.i)) mem.exposed = G.t; const fresh = acc > 0.7 && mem.exposed != null && mem.exposedTg === T && G.t - mem.exposed < 6; mem.exposedTg = mem.exposedTg === T ? T : (mem.exposed = null, T);
  if (G.cd <= 0 && d < 1.3 && canKill(G) === T && !watching(T.x, T.z, T.i) && !fresh) { ACT.knock(G); mem.away = { x: T.x, z: T.z, t: G.t }; mem.flee = true; mem.vp = 0; mem.p = null; return; }
  // the lights off when stalking (from level 3), if it helps
  if (c.lights && G.cd < 3 && d < 6 && G.sabCd <= 0 && R() < 0.3) ACT.sabotage(G, 'lights');
  // close in when the cooldown is nearly done; hang back (at a job nearby) when it is not
  if ((G.cd > 2.5 && d < 3) || (d < 4.5 && acc > 0.7 && watching(T.x, T.z, T.i))) { ACT.stick(G, 0, 0); mem.p = null; if (d < 2.5) { const away = path(G, Y.x, Y.z, Y.x + (Y.x - T.x) * 2, Y.z + (Y.z - T.z) * 2); if (away) { mem.p = away.slice(0, 3); follow(G, mem); } } return; }
  if (d < 2.2 && los(G, Y.x, Y.z, T.x, T.z, 3)) { ACT.stick(G, (T.x - Y.x) / d, (T.z - Y.z) / d); mem.p = null; return; }
  if (!mem.p || !mem.p.length || R() < 0.15) mem.p = path(G, Y.x, Y.z, T.x, T.z); if (mem.p && mem.p.length > 1 || d > 1.0) follow(G, mem); else ACT.stick(G, 0, 0); }
function follow(G, mem) { const Y = G.you; if (!mem.p || !mem.p.length) { ACT.stick(G, 0, 0); return; } const [tx, tz] = mem.p[0], dx = tx - Y.x, dz = tz - Y.z, d = Math.hypot(dx, dz); if (d < 0.25) { mem.p.shift(); return follow(G, mem); } ACT.stick(G, dx / d, dz / d); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.meet = null; finish(G, true, 'last'); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'sneak', title: 'WHEN NO ONE IS LOOKING', say: G => crewCue(G)[0], do: G => crewCue(G)[1], at: G => crewCue(G)[2], how: 'SKY works alone in Electrical. LIME walks in and out. Slide to walk there; KNOCK OUT SKY only when LIME is gone.' }],
  2: [{ id: 'vent', title: 'VANISH', say: G => crewCue(G)[0], do: G => crewCue(G)[1], at: G => crewCue(G)[2], how: 'Knock out RUBY in MedBay, then hide in the VENT (stand on it, tap VENT) and come out somewhere else before anyone comes.' }],
  3: [{ id: 'talk', title: 'THE MEETING', say: G => crewCue(G)[0], do: G => crewCue(G)[1], at: G => crewCue(G)[2], how: 'Knock out COCOA in Storage (no one looking). Soon the body is found: at the meeting, vote for the one they already doubt.' }],
};
// THE TUTORIAL SHOWS THE NEXT MOVE, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens").
// It said KNOCK OUT WHEN NO ONE LOOKS with a hand tapping in a box. Now the robot is asked (dryPlan) and the hand does it: SLIDE TO WALK (the
// way to go), WAIT: SOMEONE IS LOOKING, TAP KNOCK OUT, TAP VENT, TAP OUT; at the meeting LISTEN…, then the hand on the one they doubt and VOTE.
const CRC = { t: -1e9, v: null };
function crewCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const B = id => { const b = buttons(G).find(q => q.id === id); return b ? [b.x, b.y] : false; }, mid = r => [r.x + r.w / 2, r.y + r.h / 2];
  if (G.meet) { const M = G.meet; if (M.votes) return ['WAIT…', 'wait', false]; if (ui.meetT < saysShown(M) * 0.9 + 0.6) return ['LISTEN…', 'wait', false]; const Lo = meetLayout(G);
    let best = -1, bs = -1; for (const k2 in M.sus) { if (+k2 === 0) continue; if (M.sus[k2] > bs) { bs = M.sus[k2]; best = +k2; } }
    if (best < 0 || bs < 0.6) return ['TAP SKIP', 'tap', mid(Lo.skip)]; if (ui.sel === best) return ['TAP VOTE', 'tap', mid(Lo.vote)]; const t = Lo.tiles.find(q => q.p.i === best); return t ? ['TAP THE ONE THEY DOUBT', 'tap', mid(t)] : ['WAIT…', 'wait', false]; }
  const now = performance.now(); if (now - CRC.t < 300) return CRC.v; CRC.t = now;
  const Y = G.you, walkTo = (tx, tz) => { const pp = path(G, Y.x, Y.z, tx, tz); if (!pp || !pp.length) return null; let [px, pz] = pp[0]; if (Math.hypot(px - Y.x, pz - Y.z) < 0.3 && pp[1]) [px, pz] = pp[1]; const dx = px - Y.x, dz = pz - Y.z, m = Math.hypot(dx, dz) || 1, x0 = W * 0.35, y0 = H * 0.62; return ['SLIDE TO WALK', 'drag', [x0, y0, x0 + dx / m * 70 * k, y0 + dz / m * 70 * k]]; };
  const id = G.lesson && lessonNow(G) ? lessonNow(G).id : '';
  if (id === 'vent' && G.kills > 0 && G.inVent < 0) { const v2 = ventNear(G) >= 0 ? ['TAP VENT', 'tap', B('vent')] : (() => { let bv = null, bd = 1e9; for (const q of VENTS) { const dd = Math.hypot(q[0] + 0.5 - Y.x, q[1] + 0.5 - Y.z); if (dd < bd) { bd = dd; bv = q; } } return bv ? walkTo(bv[0] + 0.5, bv[1] + 0.5) : null; })(); if (v2) { CRC.v = v2; return v2; } }      // after the knock-out: to the vent
  const P = dryPlan(G); let v = ['WAIT: SOMEONE IS LOOKING', 'wait', false];
  if (P && P[0] === 'knock') { const T = canKill(G); if (T && crew(G).some(w => w.i !== T.i && los(G, w.x, w.z, T.x, T.z, visOf(G, w) + 2.5))) P[0] = 'wait'; }      // someone could look in before a thumb lands: wait
  if (P) { const [a, x, z] = P;
    if (a === 'knock') v = ['TAP KNOCK OUT', 'tap', B('knock')]; else if (a === 'vent') v = ['TAP VENT', 'tap', B(G.inVent >= 0 ? 'next' : 'vent')]; else if (a === 'ventOut') v = ['TAP OUT', 'tap', B('out')];
    else if (a === 'fake' && x) v = ['HOLD PRETEND', 'hold', B('use')]; else if (a === 'report') v = ['TAP REPORT', 'tap', B('report')];
    else if (a === 'stick' && (x || z)) { const x0 = W * 0.35, y0 = H * 0.62, m = Math.hypot(x, z) || 1; v = ['SLIDE TO WALK', 'drag', [x0, y0, x0 + x / m * 70 * k, y0 + z / m * 70 * k]]; } }
  CRC.v = v; return v; }
const LSET = {
  sneak: (G, R) => { G.ppl.length = 1; G.you.x = 23.5; G.you.z = 12; const s = person(G, 2, 14.5, 22.5); s.job = JOBS[19]; s.path = []; s.work = -999; G.ppl.push(s); const l = person(G, 3, 12.5, 19.5); l.patrol = [[11.5, 20.5], [13, 15.5], [12.5, 11.5], [13, 15.5]]; G.ppl.push(l); G.cd = 0; },
  vent: (G, R) => { G.ppl.length = 1; G.you.x = 13.5; G.you.z = 5.5; const r = person(G, 1, 11.5, 3.5); r.job = JOBS[27]; r.path = []; r.work = -999; G.ppl.push(r); const w = person(G, 4, 20.5, 8.5); w.walker = 7; w.job = JOBS[28]; w.path = path(G, w.x, w.z, JOBS[28][0] + 0.5, JOBS[28][1] + 0.5); w.work = -999; G.ppl.push(w); G.cd = 0; },
  talk: (G, R) => { G.ppl.length = 1; G.you.x = 22.5; G.you.z = 22.5; const v = person(G, 9, 18.5, 26.5); v.job = JOBS[15]; v.path = []; v.work = -999; G.ppl.push(v); const pl = person(G, 5, 23.5, 25.5); pl.patrol = [[23.5, 25.5], [24, 14], [27, 16]]; G.ppl.push(pl); for (const i of [1, 2]) { const q = person(G, i, 20 + i * 3, 3); G.ppl.push(q); } G.cd = 0; },
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); setup(G, { crew: 0, need: 999, place: LSET[st.id] }); G.ppl.forEach((p, j) => p.i = j); G.lessonId = st.id; G.ev.push({ k: 'deal' }); }
function lessonMiss(G, how) { G.ev.push({ k: 'lessonmiss', how }); G.wait = 1.4; G.next = () => lessonDeal(G); }
function lessonSee(G, what, n) { const st = lessonNow(G); if (!st || G.wait > 0) return;
  if (st.id === 'sneak' && what === 'knock') { if (n) return lessonMiss(G, 'LIME saw you! Wait until LIME has walked away, then strike.'); return lessonDone(G); }
  if (st.id === 'vent') { if (what === 'knock' && n) return lessonMiss(G, 'SUNNY saw you! Be quick, before SUNNY comes in.'); if ((what === 'vent' || what === 'ventout') && n) return lessonMiss(G, 'Someone saw you use the vent! Only when no one is looking.'); if (what === 'ventout' && G.kills) return lessonDone(G); if (what === 'meeting') return lessonMiss(G, 'They found the body with you near it. Into the vent, quick!'); }
  if (st.id === 'talk' && what === 'knock') { if (n) return lessonMiss(G, 'Someone saw you! Only when no one is looking.'); // PLUM was seen walking out of Storage; a moment later someone finds the body
    for (const q of crew(G)) if (q.i !== 2) q.seen[2] = { t: G.t, x: 20, z: 25 }; G.wait = 2.2; G.next = () => meeting(G, 3, G.bodies[0]); return; }
  if (st.id === 'talk' && what === 'vote') { if (n === 2) return lessonDone(G); return lessonMiss(G, n === 0 ? 'They voted YOU out! Point at the one they already doubt: PLUM.' : 'Nobody was voted out, and they still wonder about you. Listen: who did they see near the body?'); } }
function lessonDone(G) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'deal' }); }; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { knock, vent, ventOut, stick, fake, vote, sabotage }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
