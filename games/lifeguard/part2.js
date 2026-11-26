// ===================== THE RULES: Beach Watch (my idea for set 17) =====================
// You are the lifeguard in the tower. Swimmers play in the surf. Rip currents (the dark gaps in the breaking waves) carry them
// out; some swim too far; kids on inflatables drift when the wind blows offshore; later, cramps. Someone drifting into danger
// can be WHISTLED back (tap them). Someone in trouble needs you: tap them and you sprint and swim out. Once you have them,
// tap the beach where you will bring them in: straight back through a rip is slow; swim across it first (as real lifeguards
// do). Tap a rip to plant a red flag and swimmers keep out of it. Tap someone who is fine and you swim out for nothing.
// Miss two and the beach is closed. Get through the shift to win.
const RULES = [
  'Swimmers in <b>trouble</b> sink low, then struggle, then wave. <b>Tap them</b> and you run and swim out.',
  'Once you have them, <b>tap the beach</b> where you will bring them in. Straight back through a rip is slow: go across it.',
  'Someone drifting into danger? <b>Tap them to whistle</b> them back before it turns to trouble.',
  'A <b>rip</b> is the dark, calm-looking gap in the breaking waves. <b>Tap it</b> to plant a red flag: swimmers keep out.',
  'Tap someone who is fine and you swim out for nothing, then need a moment back up the tower. Look first.',
  'Miss two and the beach closes. Get through the shift to win.',
];
const ZB = 13, XW = 7.5, TOWER = { x: 0, z: -7 };
const BEACHES = ['Sandy Cove', 'Gull Point', 'Long Strand', 'Coral Bay', 'Shell Beach', 'Pebble Reach', 'Surfers\' Bay', 'Driftwood Shore'];
const SKIES = ['morning', 'noon', 'golden', 'noon', 'overcast', 'morning', 'sunset', 'mist'];
const SKINS = [{ id: 'red', name: 'Classic red', col: 0xd8322a, top: 0xf2c230, stars: 0 }, { id: 'blue', name: 'Ocean blue', col: 0x2a6ad8, top: 0xffffff, stars: 6 }, { id: 'orange', name: 'Sunset', col: 0xf07a2a, top: 0x22262e, stars: 14 }, { id: 'green', name: 'Lagoon', col: 0x2aa870, top: 0xffe0a0, stars: 24 }, { id: 'black', name: 'Night swim', col: 0x22262e, top: 0xff4a6a, stars: 36 }, { id: 'gold', name: 'Gold medal', col: 0xe0b020, top: 0xd8322a, stars: 50 }];
const UPGRADES = [{ id: 'fins', name: 'Fins', max: 2, cost: l => [60, 150][l], desc: 'You swim 10% faster.' }, { id: 'bino', name: 'Binoculars', max: 1, cost: () => 120, desc: 'Trouble shows a little sooner.' }, { id: 'board', name: 'Rescue board', max: 1, cost: () => 160, desc: 'Bring people in 15% faster.' }];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Cadet'], [60, 'Junior guard'], [200, 'Lifeguard'], [500, 'Senior guard'], [1100, 'Head of the beach'], [2500, 'Legend of the surf']];
const beachOf = N => BEACHES[(N - 1) % BEACHES.length];
function makeCfg(N, help, o = {}) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, practice: !!o.practice, shift: o.practice ? 1e9 : Math.round(x(70, 115, 25)), crowd: Math.round(x(8, 15, 25)), rips: N <= 1 ? 1 : N <= 5 ? 2 : 2 + (N % 2),
    T: x(19, 11, 40) * (help ? 1.3 : 1), riskT: x(9.5, 5, 30) * (help ? 1.25 : 1), far: x(0.08, 0.2, 30), wind: N >= 3, tired: Math.round(x(4, 12, 35)), flags: N >= 2 ? 2 : 0, lives: 2,
    swim: 2.4 * (1 + 0.1 * upLv('fins')), tow: 1.7 * (1 + 0.15 * upLv('board')) }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini, beach: o.practice ? 'Practice beach' : beachOf(N), sky: SKIES[(N - 1) % SKIES.length],
    rips: [], sw: [], sid: 0, lg: { x: TOWER.x, z: TOWER.z, st: 'tower', target: null, land: null, towT: 0, lock: 0 }, lives: cfg.lives, flags: cfg.flags, fog: 0, wind: 0, windT: 0, next: 1, saved: 0, whistles: 0, falses: 0, missed: 0, resp: [], coins: 0, t0: 0, tired: [] };
  for (let i = 0; i < cfg.tired && !cfg.practice; i++) G.tired.push(8 + (cfg.shift - 25) * (i + 0.2 + R() * 0.6) / cfg.tired);
  const xs = [-4.2, 3.6, 0.2]; for (let i = 0; i < cfg.rips; i++) G.rips.push({ x: xs[i] + (R() - 0.5) * 1.2, w: 1.3 + R() * 0.6, v: 0.9 + R() * 0.5 + Math.min(0.4, cfg.f * 0.01), flag: false });
  if (G.teach && LESSONS[N] && G.taught < N && !cfg.practice) { lessonStart(G); return G; }
  for (let i = 0; i < Math.ceil(cfg.crowd * 0.6); i++) addSwimmer(G, true); G.ev.push({ k: 'start' }); return G; }
const ripAt = (G, x, z) => z > 0.8 && z < 24 ? G.rips.find(r => Math.abs(x - r.x) < r.w) : null;
function addSwimmer(G, inWater, o = {}) { const R = G.rnd, kid = o.kid != null ? o.kid : R() < 0.3, s = { id: ++G.sid, x: o.x != null ? o.x : (R() * 2 - 1) * (XW - 1), z: o.z != null ? o.z : inWater ? 2 + R() * 8 : -3.5, st: 'ok', kid, float: !!o.float, t: 0, rt: 0, tr: 0, T: G.cfg.T * (kid ? 0.9 : 1) * (0.9 + R() * 0.2), tx: 0, tz: 0, stay: 25 + R() * 40, cause: null, ph: R() * 6, skin: (R() * 5) | 0, cap: (R() * 6) | 0 };
  pickSpot(G, s); G.sw.push(s); return s; }
function pickSpot(G, s) { const R = G.rnd; for (let i = 0; i < 12; i++) { s.tx = (R() * 2 - 1) * (XW - 0.8); s.tz = 1.5 + R() * (R() < G.cfg.far && !G.lesson ? 16 : 8); const r = G.lesson ? G.rips.find(q => Math.abs(s.tx - q.x) < q.w + 1.2) : ripAt(G, s.tx, s.tz); if (!r || !G.lesson && !r.flag) break; } }      // in a lesson the others stay well clear of the rips
// ---------- the player's one move: a tap on the picture (in metres on the beach: x across, z out to sea) ----------
const busy = G => G.over || G.lesson && G.lesson.wait > 0;
function tap(G, x, z) { if (busy(G)) return false; if (G.fog > 0) { G.ev.push({ k: 'foggy' }); return false; } const L = G.lg;
  if (L.st === 'tow' && !L.land) { L.land = { x: clamp(x, -XW, XW), z: 0.4 }; const thr = landThrough(G, L, L.land.x); G.ev.push({ k: 'land', x: L.land.x, through: thr }); lessonSee(G, 'land', !thr); return true; }
  let best = null, bd = 1.1; for (const s of G.sw) if (['ok', 'risk', 'trouble'].includes(s.st) && s.z > 0.3) { const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s; } }
  if (best) { if (best.st === 'risk') return whistle(G, best); if (best.st === 'ok' && (L.st === 'go' || L.st === 'tow' || L.lock > 0)) { G.fog = 3; G.falses++; G.ev.push({ k: 'fine', id: best.id, x: best.x, z: best.z }); lessonSee(G, 'false'); return false; } return send(G, best); }
  const r = ripAt(G, x, z); if (r && z > 8.5 && z < 17.5) { if (r.flag) return false; if (G.flags <= 0) { G.ev.push({ k: 'noflag' }); return false; } r.flag = true; G.flags--; G.coins += 2; G.ev.push({ k: 'flag', x: r.x }); lessonSee(G, 'flag'); for (const s of G.sw) if (s.st === 'ok' && ripAt(G, s.tx, s.tz) === r) pickSpot(G, s); return true; }
  if (z > 1 && z < 26 && Math.abs(x) < XW + 1) { G.fog = 0.6; G.ev.push({ k: 'nothing', x, z, rip: !!r }); lessonSee(G, 'nothing'); return false; }
  return false; }
function whistle(G, s) { if (s.float) { s.st = 'leave'; s.tx = s.x; s.tz = -6; s.float = false; G.whistles++; G.coins += 2; G.ev.push({ k: 'whistle', id: s.id, x: s.x, z: s.z }); lessonSee(G, 'whistle'); return true; } s.st = 'ok'; s.rt = 0; s.whistled = (s.whistled || 0) + 1; const r = ripAt(G, s.x, s.z); s.tx = r ? clamp(r.x + (s.x < r.x ? -1 : 1) * (r.w + 1.5), -XW, XW) : s.x; s.tz = Math.max(1.5, Math.min(s.z - 4, 6)); s.back = 10; G.whistles++; G.coins += 2; G.ev.push({ k: 'whistle', id: s.id, x: s.x, z: s.z }); lessonSee(G, 'whistle'); return true; }
function send(G, s) { const L = G.lg; if (L.st === 'go' || L.st === 'tow' || L.lock > 0) { G.ev.push({ k: 'busy' }); return false; } L.st = 'go'; L.target = s.id; L.t0 = G.t; G.ev.push({ k: 'go', id: s.id, real: s.st === 'trouble' }); return true; }
// the straight line home from where you are: does it run up a rip?
// coming in through a rip: the beach you chose is straight down the rip you are in (or the one beside you)
function landThrough(G, L, lx) { return G.rips.some(r => Math.abs(lx - r.x) < r.w + 0.6 && (Math.abs(L.x - r.x) < r.w + 2.5)); }
function ripBetween(G, a, b) { for (let i = 1; i < 8; i++) { const u = i / 8, r = ripAt(G, a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u); if (r) return r; } return null; }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; const c = G.cfg, R = G.rnd, L = G.lg;
  if (G.lesson) { lessonTick(G, dt); if (G.lesson && G.lesson.wait > 0) return; }
  if (G.fog > 0) G.fog -= dt; if (L.lock > 0) L.lock -= dt;
  // the wind: now and then it turns offshore and inflatables drift out (warned)
  if (c.wind && !G.lesson) { G.windT -= dt; if (G.windT <= 0) { G.wind = G.wind ? 0 : 1; G.windT = G.wind ? 12 + R() * 8 : 20 + R() * 15; G.ev.push({ k: G.wind ? 'wind' : 'calm' }); if (G.wind) { const s = addSwimmer(G, true, { kid: true, float: true, x: (R() * 2 - 1) * 5, z: 3 + R() * 2 }); s.tz = s.z; } } }
  // people come down to the water, and later go home
  if (!G.lesson && G.t - G.t0 < c.shift - 8) { G.next -= dt; const n = G.sw.filter(s => s.st !== 'out' && s.st !== 'safe').length; if (G.next <= 0 && n < c.crowd) { addSwimmer(G, false); G.next = 3 + R() * 4; } }
  if (!G.lesson && G.tired.length && G.t - G.t0 >= G.tired[0]) { const cand = G.sw.filter(s => s.st === 'ok' && s.z > 3.5 && !s.float); if (cand.length) { G.tired.shift(); const s = cand[(R() * cand.length) | 0]; s.st = 'trouble'; s.cause = 'tired'; s.tr = 0; G.ev.push({ k: 'trouble', id: s.id }); } }
  if (c.practice && !G.lesson && R() < dt / 18) { const cand = G.sw.filter(s => s.st === 'ok' && s.z > 3.5); if (cand.length) { const s = cand[(R() * cand.length) | 0]; s.st = 'trouble'; s.cause = 'tired'; s.tr = 0; G.ev.push({ k: 'trouble', id: s.id }); } }
  for (const s of G.sw) { s.t += dt; s.ph += dt;
    const r = ripAt(G, s.x, s.z), mv = (tx, tz, v) => { const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz); if (d > 0.05) { s.x += dx / d * Math.min(d, v * dt); s.z += dz / d * Math.min(d, v * dt); } return d < 0.3; };
    if (s.st === 'ok') { if (s.back > 0) s.back -= dt;
      if (s.float && G.wind && !s.back) s.z += 0.35 * dt; else if (mv(s.tx, s.tz, s.z < 0.5 ? 1.2 : s.back > 0 ? 1.0 : 0.55)) { if (s.t > s.stay && !G.lesson) { s.tx = s.x; s.tz = -6; s.st = 'leave'; } else pickSpot(G, s); }
      if (r && !s.back) { s.z += r.v * 0.6 * dt; s.inRip = (s.inRip || 0) + dt; if (s.inRip > 1.2) { s.st = 'risk'; s.cause = 'rip'; s.rt = 0; G.ev.push({ k: 'risk', id: s.id, cause: 'rip' }); } } else s.inRip = 0;
      if (s.st === 'ok' && s.z > 17 && !(s.back > 0)) { s.st = 'risk'; s.cause = 'far'; s.rt = 0; G.ev.push({ k: 'risk', id: s.id, cause: 'far' }); }
      if (s.st === 'ok' && s.float && s.z > 9 && !(s.back > 0)) { s.st = 'risk'; s.cause = 'wind'; s.rt = 0; G.ev.push({ k: 'risk', id: s.id, cause: 'wind' }); }
    }
    else if (s.st === 'risk') { s.rt += dt; s.z += (r ? r.v * 0.8 : s.cause === 'wind' ? (G.wind ? 0.35 : 0.1) : 0.12) * dt; if (s.rt > G.cfg.riskT * (s.kid ? 0.85 : 1) && !(G.lesson && G.lesson.noTrouble)) { s.st = 'trouble'; s.tr = 0; G.ev.push({ k: 'trouble', id: s.id }); } }
    else if (s.st === 'trouble') { s.tr += dt; s.z += (r ? r.v * 0.7 : 0.05) * dt; if (s.tr >= s.T && !G.lesson) { s.st = 'out'; G.missed++; G.lives--; G.ev.push({ k: 'missed', id: s.id, x: s.x, z: s.z }); if (L.target === s.id && L.st === 'go') { L.st = 'back'; L.target = null; } if (G.lives <= 0) return finish(G, false); } else if (s.tr >= s.T && G.lesson) s.tr = s.T * 0.6; }
    else if (s.st === 'leave' || s.st === 'safe') { if (mv(s.tx, s.tz, 1.1)) s.st = 'gone'; }
    else if (s.st === 'towed') { s.x = L.x; s.z = L.z + 0.6; } }
  G.sw = G.sw.filter(s => s.st !== 'gone' && !(s.st === 'out' && s.t > 400));
  // you
  const sp = (z) => z < 0 ? 6 : z < 1.8 ? 3 : c.swim, moveL = (tx, tz, v) => { const dx = tx - L.x, dz = tz - L.z, d = Math.hypot(dx, dz); if (d > 0.05) { L.x += dx / d * Math.min(d, v * dt); L.z += dz / d * Math.min(d, v * dt); } L.face = Math.atan2(dx, dz); const r = ripAt(G, L.x, L.z); if (r && L.z > 1) L.z += r.v * 0.75 * dt; return d < 0.8; };
  if (L.st === 'go') { const s = G.sw.find(q => q.id === L.target); if (!s || !['ok', 'risk', 'trouble'].includes(s.st)) { L.st = 'back'; L.target = null; }
    else if (moveL(s.x, s.z, sp(L.z))) { if (s.st === 'trouble') { s.st = 'towed'; L.st = 'tow'; L.land = null; L.towT = 0; G.resp.push(s.tr); G.ev.push({ k: 'grab', id: s.id }); lessonSee(G, 'grab'); }
      else { G.falses++; L.st = 'back'; L.target = null; L.lock = 4; L.wasted = true; G.ev.push({ k: 'false', id: s.id }); lessonSee(G, 'false'); if (s.st === 'risk') whistle(G, s); } } }
  else if (L.st === 'tow') { L.towT += dt; if (!L.land && L.towT > 3.5) { L.land = { x: L.x, z: 0.4 }; G.ev.push({ k: 'land', x: L.x, through: landThrough(G, L, L.x), auto: true }); }
    if (L.land && moveL(L.land.x, L.land.z, L.z < 1.8 ? 2.4 : c.tow)) { const s = G.sw.find(q => q.id === L.target); if (s) { s.st = 'safe'; s.tx = s.x + (G.rnd() - 0.5) * 3; s.tz = -5; } G.saved++; G.coins += 6; L.st = 'back'; L.target = null; G.ev.push({ k: 'saved', x: L.x }); lessonSee(G, 'saved'); } }
  else if (L.st === 'back') { if (L.wasted) { G.fog = Math.max(G.fog, 0.2); L.lock = 4; } if (moveL(TOWER.x, TOWER.z + 1.5, sp(L.z) * 0.8)) { L.st = 'tower'; if (L.wasted) { L.wasted = false; G.fog = 4; } } }      // a false alarm: all the way back up the tower before you can whistle or go again
  if (!G.lesson && !c.practice && G.t - G.t0 >= c.shift && !G.sw.some(s => s.st === 'trouble' || s.st === 'towed') && L.st !== 'tow') finish(G, true); }
function finish(G, win) { if (G.over) return; G.over = win ? 'won' : 'lost'; const avg = G.resp.length ? G.resp.reduce((a, b) => a + b, 0) / G.resp.length : 0, stars = win ? (G.missed === 0 && G.falses <= 1 ? 3 : G.missed <= 1 ? 2 : 1) : 0;
  G.res = { win, stars, saved: G.saved, whistles: G.whistles, falses: G.falses, missed: G.missed, avg: +avg.toFixed(1), flags: G.cfg.flags - G.flags, coins: G.coins + (win ? 8 + Math.ceil(G.N / 2) + stars * 3 : 0), beach: G.beach };
  G.ev.push({ k: win ? 'won' : 'lost' }); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'rescue', title: 'BRING THEM IN', say: G => lgCue(G)[0], do: G => lgCue(G)[1], at: G => lgCue(G)[2], how: 'Someone is in trouble: low in the water, struggling. TAP THEM to swim out. Then TAP THE BEACH beside the rip, not straight back through it.', need: 2 }],
  2: [{ id: 'whistle', title: 'WHISTLE THEM BACK', say: G => lgCue(G)[0], do: G => lgCue(G)[1], at: G => lgCue(G)[2], how: 'A swimmer is drifting into the rip (the dark gap in the waves). TAP THEM to whistle them back before it turns to trouble. Three times.', need: 3 }],
  3: [{ id: 'flag', title: 'FLAG THE RIPS', say: G => lgCue(G)[0], do: G => lgCue(G)[1], at: G => lgCue(G)[2], how: 'Spot each rip: the dark, calm-looking gap where the waves do not break. TAP THE GAP to plant a red flag. Two rips, two flags.', need: 2 }],
};
function lessonStart(G) { const id = LESSONS[G.N][0].id; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, wait: 0, id, noTrouble: id === 'whistle', spawnT: 1.5 }; G.ev.push({ k: 'lessonnext', first: true });
  const free = []; for (let x = -XW + 0.8; x <= XW - 0.8; x += 0.5) if (!G.rips.some(r => Math.abs(x - r.x) < r.w + 1.2)) free.push(x);
  for (let i = 0; i < 6; i++) { const s = addSwimmer(G, true, { kid: false, x: free[Math.floor((i * 0.37 + 0.1) % 1 * free.length)], z: [3, 4, 7, 6, 9.5, 8.5][i] }); s.stay = 1e9; s.tx = s.x; s.tz = s.z; } if (id === 'flag') G.flags = Math.max(G.flags, G.rips.length); }
function lessonTick(G, dt) { const D = G.lesson; if (D.wait > 0) { D.wait -= dt; if (D.wait <= 0 && D.done) { G.lesson = null; G.t0 = G.t; G.sw = G.sw.filter(s => s.st === 'ok'); G.lg = { x: TOWER.x, z: TOWER.z, st: 'tower', target: null, land: null, towT: 0, lock: 0 }; G.flags = G.cfg.flags; G.rips.forEach(r => r.flag = false); G.saved = G.whistles = G.falses = G.missed = 0; G.resp = []; G.coins = 0; G.ev.push({ k: 'start' }); } return; }
  // the lesson keeps one situation going: someone in trouble in the rip, someone drifting into it, or the rip to flag
  const r = G.rips[0], busyS = G.sw.some(s => ['risk', 'trouble', 'towed'].includes(s.st)); if (D.id === 'flag' || busyS || G.lg.st === 'tow') return; D.spawnT -= dt; if (D.spawnT > 0) return; D.spawnT = 2;
  const s = addSwimmer(G, true, { kid: false, x: r.x + (G.rnd() - 0.5) * 0.6, z: D.id === 'rescue' ? 7 : 5 }); s.stay = 1e9; s.tx = s.x; s.tz = s.z;
  if (D.id === 'rescue') { s.st = 'trouble'; s.tr = 0; s.T = 1e9; s.cause = 'rip'; G.ev.push({ k: 'trouble', id: s.id }); } else { s.st = 'risk'; s.cause = 'rip'; s.rt = 0; G.ev.push({ k: 'risk', id: s.id, cause: 'rip' }); } }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, good) { const st0 = lessonNow(G); if (!st0 || G.lesson.done) return;
  if (what === 'false' || what === 'nothing') { if (G.lesson.n) G.ev.push({ k: 'lessonmiss', how: what === 'false' ? 'That one was fine. Look first: low in the water, or drifting into the gap.' : st0.id === 'flag' ? 'Not there: look for the gap where the waves do not break.' : 'Nobody there. Tap the swimmer you mean.' }); G.lesson.n = 0; G.lesson.badLand = false; if (st0.id === 'flag') { G.rips.forEach(r => r.flag = false); G.flags = G.rips.length; } return; }
  if (st0.id === 'rescue' && what === 'land' && !good) { G.ev.push({ k: 'lessonmiss', how: 'That way runs up the rip and is slow. Tap the beach to one side of it.' }); G.lesson.badLand = true; return; }
  if (st0.id === 'rescue' && what === 'saved' && G.lesson.badLand) { G.lesson.badLand = false; return; }
  const ok = (st0.id === 'rescue' && what === 'saved') || (st0.id === 'whistle' && what === 'whistle') || (st0.id === 'flag' && what === 'flag'); if (!ok) return;
  G.lesson.n++; G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st0.need }); if (G.lesson.n >= st0.need) { G.lesson.done = true; G.lesson.wait = 1.6; G.ev.push({ k: 'lessondone', N: G.N }); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps anywhere on the beach and sea, or taps whichever swimmer is nearest its thumb
const BLIND = {
  t: G => tap(G, (Math.random() * 2 - 1) * (XW + 1), -4 + Math.random() * 30),
  s: G => { const live = G.sw.filter(s => ['ok', 'risk', 'trouble'].includes(s.st) && s.z > 0.3); const s = live[(Math.random() * live.length) | 0]; if (s) tap(G, s.x, s.z); else if (G.lg.st === 'tow') tap(G, (Math.random() * 2 - 1) * XW, 0); },
};
// HONEST: a lifeguard who watches. react: seconds to act; acc: how early they read the signs and how well they choose the way in
// THE HAND IS ON THE ONE TO TAP (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said TAP THEM, TAP THE
// BEACH (two taps) with a hand in a box. Now the robot is asked (dryPlan tap) and the hand is there: on the swimmer in trouble (TAP THEM: SWIM
// OUT), on the beach beside the rip (TAP THE BEACH HERE), on a drifting swimmer (TAP THEM BACK), on the dark gap (TAP THE DARK GAP).
const LGC = { t: -1e9, v: null };
function lgCue(G) { if (G.over || busy(G)) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - LGC.t < 200) return LGC.v; LGC.t = now; const P = dryPlan(G, null, { cd: -1 }); let v = ['WATCH THE WATER…', 'wait', false];
  if (P && P[0] === 'tap') { const sp = scrOf(P[1], 0, P[2]), L = G.lg, s = G.sw.find(q => Math.hypot(q.x - P[1], q.z - P[2]) < 1.1 && ['ok', 'risk', 'trouble'].includes(q.st));
    const w = L.st === 'tow' && !L.land ? 'TAP THE BEACH HERE' : s ? (s.st === 'trouble' ? 'TAP THEM: SWIM OUT' : 'TAP THEM BACK') : 'TAP THE DARK GAP'; if (sp) v = [w, 'tap', [sp.x, sp.y]]; }
  LGC.v = v; return v; }
function honest(G, o, mem) { if (G.over || busy(G)) return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.35 : o.react, R = Math.random, L = G.lg;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = react * (0.8 + R() * 0.4);
  if (L.st === 'tow' && !L.land) { if (L.towT < react) return; const r = ripAt(G, L.x, L.z) || ripBetween(G, L, { x: L.x, z: 0.4 }); let lx = L.x; if (r && R() < acc) lx = r.x + (L.x < r.x ? -1 : 1) * (r.w + 1.6); ACT.tap(G, clamp(lx, -XW, XW), -1); return; }
  const see = s => s.st === 'trouble' ? s.tr > react * 1.5 + (1 - acc) * Math.min(s.T, G.cfg.T) * 0.45 : s.st === 'risk' ? s.rt > react * 2 + (1 - acc) * 5 : false;
  const tr = G.sw.filter(s => s.st === 'trouble' && see(s)).sort((a, b) => (a.T - a.tr) - (b.T - b.tr))[0];
  if (tr && (L.st === 'tower' || L.st === 'back') && L.lock <= 0) { ACT.tap(G, tr.x + (R() < (1 - acc) * 0.15 ? 1.5 : 0), tr.z); return; }
  const rk = G.sw.find(s => s.st === 'risk' && see(s)); if (rk) { ACT.tap(G, rk.x, rk.z); return; }
  if (G.flags > 0 && (G.lesson || G.t - G.t0 > 5 + (1 - acc) * 15)) { const r = G.rips.find(q => !q.flag); if (r && R() < acc * 0.3 + (G.lesson ? 0.5 : 0)) { ACT.tap(G, r.x, 13); return; } } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { tap }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
