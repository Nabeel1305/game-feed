
// ===================== RULES: Crowd Run (game 71, set 13: one of mine, like Count Masters) =====================
// Your crowd of little runners races down a track by itself. Slide your thumb left and right: the whole crowd follows. Gates
// come in pairs, side by side: +10 or x2, -20 or ÷2... run through the better one. Spinning saws, sweeping bars and swinging
// hammers knock runners off; on narrow bridges whoever is not on the planks falls. Red crowds wait on the track: you meet them
// one for one. Grey runners by the side join you if you touch them. At the end stands a GIANT with a number: be more than it.
// Whoever is left climbs the bonus stairs. Units: metres; the track runs along z (0..LEN) and is HW wide each side of x = 0.
const RULES = [
  '<b>Slide your thumb</b> left and right: your crowd follows.',
  'Run through the <b>better gate</b>: +10 or x2? Watch out for − and ÷. Later the gates all look alike: <b>count</b> which gives you more.',
  'Saws, bars and hammers knock runners off. On a <b>bridge</b>, anyone off the planks falls.',
  'A <b>red crowd</b> fights you one for one. Touch <b>grey runners</b> and they join you.',
  'At the end, be <b>more than the giant</b>. Everyone left climbs the bonus stairs.',
];
const HW = 3.6, RUN = 7.5, MAXM = 360, SP = 0.26;
const PLACES = [{ name: 'Sunny Track', sky: 'morning', sea: 0x3aa8d8, track: 0xf2f2f6 }, { name: 'Canyon Run', sky: 'golden', sea: 0xc8844a, track: 0xf6ead8 }, { name: 'Ice Bridge', sky: 'overcast', sea: 0x8ac8e8, track: 0xe8f4ff }, { name: 'Lava Dash', sky: 'sunset', sea: 0xd8402a, track: 0x3a3a44 }];
const placeOf = N => Math.floor((N - 1) / 5) % 4;
const COLORS = [{ id: 'blue', col: 0x2a8aff, stars: 0 }, { id: 'green', col: 0x3ad06a, stars: 6 }, { id: 'purple', col: 0x9a5aff, stars: 15 }, { id: 'gold', col: 0xffc030, stars: 30 }];
const UPGRADES = [
  { id: 'start', name: 'Bigger start', desc: '+3 runners at the start of every run.', max: 3, cost: l => 40 + l * 60 },
  { id: 'gate', name: 'Lucky gates', desc: 'Every + gate gives 2 more.', max: 3, cost: l => 60 + l * 60 },
  { id: 'cash', name: 'Gold rush', desc: '+25% coins at the stairs.', max: 2, cost: l => 80 + l * 80 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Jogger'], [40, 'Runner'], [130, 'Pack leader'], [320, 'Stampede'], [700, 'Army'], [1500, 'Crowd king']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  return { N, f, help: !!help, place: placeOf(N), boss, len: Math.round(x(190, 360, 30) * (boss ? 1.2 : 1)), bad: x(0.6, 0.8, 25), obst: x(0.45, 1, 25), ospd: x(1, 2.2, 30), enemy: N >= 2 ? x(0.25, 0.6, 25) : 0,
    bridge: N >= 5 ? x(0.1, 0.3, 25) : 0, combo: x(0, 0.75, 30), trap: N >= 2 ? x(0.3, 0.55, 30) : 0.15, esz: x(0.15, 0.35, 30), hammer: N >= 8, need: x(0.65, 0.95, 30) * (help ? 0.85 : 1), start: 5 + 3 * upLv('start') + (help ? 4 : 0), plus: 2 * upLv('gate'), cash: 1 + 0.25 * upLv('cash') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- the gates: what each does to n ----------
const apply = (g, n) => g.op === '+' ? n + g.v : g.op === '-' ? Math.max(0, n - g.v) : g.op === 'x' ? Math.floor(n * g.v) : g.op === 'xm' ? Math.max(0, n * g.v - g.k) : Math.floor(n / g.v);
const numTxt = v => v === 0.5 ? '½' : String(v);
const gateTxt = g => g.op === 'xm' ? `×${g.v} −${g.k}` : (g.op === 'x' ? '×' : g.op === '/' ? '÷' : g.op === '-' ? '−' : g.op) + numTxt(g.v);
// THINKING GATES (27 Nov 2026, his final fix: "The numbers that increase your numbers are clearly blue and those that reduce it is clearly red. It should
// be ambiguous and the player needs to find out which one would increase their numbers. Make it confusing so the player must actually think to go into
// the right column except in the beginning rounds"). Levels 1-3 keep the clear gates (blue good, red bad) to learn on. From level 4 the two gates of a
// pair are the same colour, and more and more of the pairs (a third at level 4, most from level 15) are ones where the sign does not tell you:
//   +a or ×m   both grow you; which grows you MORE depends on how many you are now (a is close to what ×m would add)
//   −a or ÷d   both cost you; pick the smaller loss (again close)
//   ×½ or ÷½   the times sign halves you, the divide sign doubles you
//   ×2 −k or +j   doubling then losing k, or a plain gain: count it
// Every one has a right answer you can work out from your number in the corner; the robots (who count) still win at the measured rates.
const clearGates = N => N <= 3;
function thinkPair(G, n, R) { const c = G.cfg, r = R(), m = R() < 0.75 ? 2 : 3, near = 0.75 + R() * 0.55, ev = v => Math.max(4, Math.round(v / 2) * 2);
  let p; if (r < 0.42) p = [{ op: '+', v: ev(n * (m - 1) * near) + c.plus }, { op: 'x', v: m }];
  else if (r < 0.6 && R() < c.bad) { const d = R() < 0.7 ? 2 : 3; p = [{ op: '-', v: Math.max(3, Math.round(n * (1 - 1 / d) * near)) }, { op: '/', v: d }]; }
  else if (r < 0.78) p = [{ op: 'x', v: 0.5 }, { op: '/', v: 0.5 }];
  else { const k = ev(n * (0.3 + R() * 0.6)), j = ev(n * (1 + (R() - 0.5) * 0.7) - k); p = [{ op: 'xm', v: 2, k }, { op: '+', v: Math.max(4, j) + c.plus }]; }
  if (apply(p[0], n) === apply(p[1], n)) p[0].v += p[0].op === '+' || p[0].op === '-' ? 4 : 0;
  return R() < 0.5 ? p : [p[1], p[0]]; }
function gatePair(G, n, R) { if (!clearGates(G.N) && R() < Math.min(0.85, 0.33 + (G.N - 4) * 0.05)) return thinkPair(G, n, R); const c = G.cfg, good = () => { const r = R(), px = n > 400 ? 0.82 : 0.55; return r < px ? { op: '+', v: Math.max(4, Math.round((4 + R() * 10 + n * (0.2 + R() * 0.5)) / 2) * 2) + c.plus } : r < 0.94 ? { op: 'x', v: 2 } : { op: 'x', v: 3 }; },
    bad = () => { const r = R(); return r < 0.55 ? { op: '-', v: Math.max(5, Math.round(n * (0.3 + R() * 0.4))) } : { op: '/', v: r < 0.85 ? 2 : 3 }; };
  const a = good(), b = R() < c.bad ? bad() : good(); if (b.op === a.op && b.v === a.v) b.v = a.op === 'x' ? 3 - (a.v === 3 ? 1 : 0) : a.v + 6; return R() < 0.5 ? [a, b] : [b, a]; }
// ---------- the track: built from the start, in pieces about 20 m apart ----------
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.len = o.len || c.len; G.items = []; G.t = 0; G.d = 0; G.cx = 0; G.wantX = 0; G.coins = 0; G.lost = 0; G.fall = 0; G.joined = 0; G.battle = null; G.done = false; G.stair = 0;
  G.n = o.start || c.start; G.mem = []; resize0(G);
  if (o.track) o.track(G, R); else { let z = 26, n = G.n, best = G.n, k = 0;
    while (z < G.len - 20) { const r = R(), kind = k % 2 === 0 ? 'gate' : (k === 3 || k === 7 || r < 0.22) ? 'wall' : r < c.enemy ? 'enemy' : r < c.enemy + c.bridge ? 'bridge' : r < c.enemy + c.bridge + 0.15 ? 'recruit' : 'obst';
      if (kind === 'gate') { const ops = gatePair(G, best, R), b0 = best; G.items.push({ type: 'gate', z, ops }); best = Math.min(9999, Math.max(apply(ops[0], best), apply(ops[1], best))); z += 10;
        if (R() < c.trap) { const bs = apply(ops[0], b0) >= apply(ops[1], b0) ? -1 : 1; G.items.push({ type: 'wall', z: z + 0.5, side: bs }); best = Math.round(best * 0.97); z += 10; } }
      else if (kind === 'wall') { G.items.push({ type: 'wall', z, side: R() < 0.5 ? -1 : 1 }); z += 10; }
      else if (kind === 'enemy') { const e = Math.max(4, Math.round(best * (c.esz + R() * 0.25))); G.items.push({ type: 'enemy', z, n: e }); best -= e; z += 12; }
      else if (kind === 'bridge') { const L = 9 + R() * 5, x = (R() - 0.5) * 3; G.items.push({ type: 'bridge', z, z1: z + L, x, hw: 1.1 + R() * 0.5 }); best = Math.round(best * 0.94); z += L + 10; }
      else if (kind === 'recruit') { const e = 4 + ((R() * 8) | 0); G.items.push({ type: 'recruit', z, x: (R() < 0.5 ? -1 : 1) * (1.5 + R() * 1.5), n: e }); best += e; z += 10; }
      else { obstacle(G, z, R); best = Math.round(best * 0.96); if (R() < c.combo) { obstacle(G, z + 5, R); z += 5; } z += 11; }
      if (R() < 0.5) for (let q = 0; q < 5; q++) G.items.push({ type: 'coin', z: z - 9 + q * 1.2, x: Math.sin(z) * 2.2 }); k++; }
    G.best = best; }
  G.hp = o.hp || Math.max(8, Math.round(G.best * c.need)); G.items.sort((a, b) => a.z - b.z); G.boss = { z: G.len + 8, hp: G.hp, left: G.hp }; }
function obstacle(G, z, R) { const c = G.cfg, r = R(), kind = c.hammer && r < 0.3 ? 'hammer' : r < 0.6 ? 'saw' : r < 0.85 ? 'bar' : 'wall';
  if (kind === 'saw') G.items.push({ type: 'saw', z, x0: (R() - 0.5) * 2, amp: 1.6 + R() * 1.2, w: (1 + R()) * c.ospd, ph: R() * TAU, r: 0.75 });
  if (kind === 'bar') G.items.push({ type: 'bar', z, len: 2.0, w: (1.2 + R() * 0.8) * c.ospd * (R() < 0.5 ? -1 : 1), ph: R() * TAU });
  if (kind === 'hammer') G.items.push({ type: 'hammer', z, amp: HW - 0.6, w: (1.4 + R() * 0.6) * c.ospd, ph: R() * TAU, r: 0.9 });
  if (kind === 'wall') G.items.push({ type: 'wall', z, side: R() < 0.5 ? -1 : 1, gap: 0.6 + R() * 0.8 }); }
// where each thing is at time t
const sawX = (o, t) => o.x0 + Math.sin(o.ph + t * o.w) * o.amp, barA = (o, t) => o.ph + t * o.w, hamX = (o, t) => Math.sin(o.ph + t * o.w) * o.amp;
// ---------- the crowd: up to MAXM runners drawn and hit one by one (beyond that each stands for several) ----------
const spOf = m => Math.min(SP, (1.1 + 0.05 * Math.sqrt(m)) / Math.sqrt(m + 0.5));      // a big crowd packs tighter
function slotOff(i, m) { const r = spOf(m) * Math.sqrt(i + 0.5), a = i * 2.39996; return [Math.cos(a) * r, Math.sin(a) * r * 0.8]; }
function resize0(G) { const m = Math.min(MAXM, G.n); while (G.mem.length < m) { const i = G.mem.length, s = slotOff(i, m); G.mem.push({ x: G.cx + s[0] * 1.6, z: s[1] - 1.5, ph: Math.random() * TAU }); } if (G.mem.length > m) G.mem.length = m; }
const blobR = G => { const m = Math.min(MAXM, G.n); return spOf(m) * Math.sqrt(m + 0.5); };
function kill(G, idx, why) { // runners at these places are lost
  if (!idx.length) return; const w = G.n / Math.max(1, G.mem.length), k = Math.min(G.n, Math.max(idx.length, Math.round(idx.length * w))); idx.sort((a, b) => b - a); const gone = [];
  for (const i of idx) gone.push(G.mem.splice(i, 1)[0]); G.n -= k; if (why === 'fall') G.fall += k; else G.lost += k; G.ev.push({ k: 'hit', why, n: k, at: gone.slice(0, 12) }); resize0(G); }
// ---------- your thumb ----------
function slide(G, dx) { if (G.over) return; G.wantX = clamp(G.wantX + dx, -HW + 0.3, HW - 0.3); }
// ---------- the clock ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  G.t += dt; const prev = G.d;
  // the crowd centre follows the thumb (quickly, but not at once)
  G.cx += clamp(G.wantX - G.cx, -9 * dt, 9 * dt);
  if (G.battle) { battle(G, dt); } else if (!G.done) G.d += RUN * dt;
  // each runner eases towards its place in the crowd, squeezed inside the rails (except on a bridge)
  const onBr = G.items.find(o => o.type === 'bridge' && G.d + 5 > o.z && G.d - 3 < o.z1), sq = onBr ? Math.min(1, onBr.hw * 0.85 / Math.max(0.3, blobR(G))) : 1;      // a crowd squeezes onto a bridge
  for (let i = 0, nm = G.mem.length; i < nm; i++) { const m = G.mem[i], s = slotOff(i, nm); let tx = G.cx + s[0] * sq, tz = s[1] / Math.max(0.45, sq); if (!onBr) tx = clamp(tx, -HW + 0.15, HW - 0.15); m.x += (tx - m.x) * Math.min(1, dt * 8); m.z += (tz - m.z) * Math.min(1, dt * 6); m.ph += dt * 14; }
  // things on the track, in reach
  for (const o of G.items) { if (o.z1 ? G.d - 6 > o.z1 : o.z < G.d - 6) continue; if (o.z > G.d + 6) break; thing(G, o, prev); if (G.over || G.n <= 0) break; }
  if (G.n <= 0 && !G.over) { G.n = 0; G.ev.push({ k: 'wiped' }); if (G.lesson) { lessonMiss(G); return; } G.wait = 0.9; G.next = () => finish(G, false); return; }
  // the giant at the end
  if (!G.done && !G.battle && G.d >= G.boss.z - 3) { G.battle = { foe: G.boss, boss: true }; G.ev.push({ k: 'boss' }); }
  if (G.done) stairs(G, dt); }
function thing(G, o, prev) { const t = G.t;
  if (o.type === 'gate' && !o.done && prev < o.z && G.d >= o.z) { o.done = true; const side = G.cx < 0 ? 0 : 1, g = o.ops[side], before = G.n; G.n = Math.min(9999, apply(g, G.n)); o.took = side; G.ev.push({ k: 'gate', g, before, after: G.n, good: G.n >= before, best: apply(o.ops[side], before) >= apply(o.ops[1 - side], before) }); if (G.lesson) lessonSee(G, 'gate', o);
    if (G.n < before) { const lose = Math.min(G.mem.length, Math.round((before - G.n) / Math.max(1, before) * G.mem.length)); const idx = []; for (let i = 0; i < lose; i++) idx.push(G.mem.length - 1 - i); const m = G.mem.splice(G.mem.length - lose, lose); G.ev.push({ k: 'shrink', at: m.slice(0, 20) }); }
    resize0(G); return; }
  if (o.type === 'enemy' && !o.done && G.d + blobR(G) > o.z - 1.2) { o.done = true; G.battle = { foe: o, boss: false }; o.left = o.n; G.ev.push({ k: 'fight', n: o.n }); return; }
  if (o.type === 'recruit' && !o.done) { if (Math.abs(o.z - G.d) < blobR(G) + 0.6) { for (const m of G.mem) if (Math.hypot(m.x - o.x, m.z + G.d - o.z) < 0.9) { o.done = true; G.n += o.n; G.joined += o.n; resize0(G); G.ev.push({ k: 'join', n: o.n, x: o.x, z: o.z }); if (G.lesson) lessonSee(G, 'join'); break; } } return; }
  if (o.type === 'coin' && !o.done) { if (Math.abs(o.z - G.d) < blobR(G) + 0.3) for (const m of G.mem) if (Math.hypot(m.x - o.x, m.z + G.d - o.z) < 0.5) { o.done = true; G.coins++; G.ev.push({ k: 'coin', x: o.x, z: o.z }); break; } return; }
  // what knocks runners off: each runner's place on the track is (m.x, G.d + m.z)
  const hits = [];
  if (o.type === 'saw') { const sx = sawX(o, t); G.mem.forEach((m, i) => { if (Math.hypot(m.x - sx, G.d + m.z - o.z) < o.r) hits.push(i); }); }
  if (o.type === 'hammer') { const hx = hamX(o, t); G.mem.forEach((m, i) => { if (Math.abs(m.x - hx) < o.r && Math.abs(G.d + m.z - o.z) < 0.5) hits.push(i); }); }
  if (o.type === 'bar') { const a = barA(o, t), ux = Math.cos(a), uz = Math.sin(a); G.mem.forEach((m, i) => { const px = m.x, pz = G.d + m.z - o.z, along = px * ux + pz * uz, off = Math.abs(-px * uz + pz * ux); if (Math.abs(along) < o.len && off < 0.28) hits.push(i); }); }
  if (o.type === 'wall') { G.mem.forEach((m, i) => { const zz = G.d + m.z; if (Math.abs(zz - o.z) < 0.35 && Math.sign(m.x) === o.side) hits.push(i); }); }
  if (o.type === 'bridge') { G.mem.forEach((m, i) => { const zz = G.d + m.z; if (zz > o.z && zz < o.z1 && Math.abs(m.x - o.x) > o.hw) hits.push(i); }); if (hits.length) { kill(G, hits, 'fall'); if (G.lesson) lessonSee(G, 'hit'); } return; }
  if (hits.length) { kill(G, hits, o.type); if (G.lesson) lessonSee(G, 'hit'); } }
// two crowds meet: one for one, quickly; the giant the same way
function battle(G, dt) { const b = G.battle, f = b.foe, rate = Math.max(12, (G.n + f.left) * 1.6) * dt; b.acc = (b.acc || 0) + rate; const k = Math.floor(b.acc); if (!k) return; b.acc -= k;
  const q = Math.min(k, G.n, f.left); G.n -= q; f.left -= q; G.ev.push({ k: 'clash', n: q, boss: b.boss }); const lose = Math.min(G.mem.length, Math.max(0, G.mem.length - Math.min(MAXM, G.n))); if (lose) G.mem.splice(G.mem.length - lose, lose);
  if (f.left <= 0) { G.battle = null; if (b.boss) { G.done = true; G.left = G.n; G.ev.push({ k: 'giant' }); if (G.lesson) lessonSee(G, 'giant'); } else { G.ev.push({ k: 'won1', n: f.n }); if (G.lesson) lessonSee(G, 'fight'); } return; }
  if (G.n <= 0) { G.battle = null; G.ev.push({ k: 'beaten', boss: b.boss, left: f.left }); if (G.lesson) { lessonMiss(G); return; } G.wait = 1.0; G.next = () => finish(G, false); } }
// the stairs after the giant: everyone left climbs; each step takes a few, and multiplies the coins
function stairs(G, dt) { G.st = (G.st || 0) + dt; if (G.st < 0.32) return; G.st = 0; const cost = Math.max(2, Math.ceil(G.hp * 0.15));
  if (G.n >= cost && G.stair < 10) { G.n -= cost; G.stair++; G.ev.push({ k: 'stair', s: G.stair }); resize0(G); return; }
  G.ev.push({ k: 'top', s: G.stair }); G.wait = 1.2; G.next = () => finish(G, true); }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, prog = Math.min(1, (win ? 1 : G.d / (G.boss.z))), mult = 1 + G.stair * 0.5;
  const stars = win ? 1 + (G.stair >= 3 ? 1 : 0) + (G.stair >= 6 ? 1 : 0) : 0;
  G.res = { win, stars, score: Math.round((win ? G.left : 0) * 10 + G.coins * 25 + (win ? G.stair * 100 : 0)), prog, left: G.left | 0, hp: G.hp, stair: G.stair, lost: G.lost, fell: G.fall, joined: G.joined, gotCoins: G.coins, short: win ? 0 : (G.boss.left || 0),
    coins: Math.round((G.coins + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1)) * (win ? mult * c.cash : 1)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: slides some way left or right
const BLIND = { l: G => slide(G, -(0.5 + Math.random() * 3)), r: G => slide(G, 0.5 + Math.random() * 3) };
// a player who looks: for the next gate takes the better side; dodges what is coming by trying places across the track
// and keeping the one where the fewest would be hit when the crowd gets there; follows a bridge; picks up grey runners
function honest(G, o, mem) { if (G.over || G.wait > 0) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return mem.slide && ACT.slide(G, clamp(mem.goal - G.wantX, -0.12, 0.12)); mem.t = react * 0.5 + 0.03;
  const br = blobR(G); let goal = G.cx;
  const ahead = G.items.filter(q => !q.done && (q.z1 || q.z) > G.d - br && q.z < G.d + 16 && q.type !== 'coin');
  const gate = ahead.find(q => q.type === 'gate'), danger = ahead.filter(q => ['saw', 'bar', 'hammer', 'wall'].includes(q.type)), brg = ahead.find(q => q.type === 'bridge'), rec = ahead.find(q => q.type === 'recruit');
  const cost = x => { let c = 0; for (const q of danger) { const tt = G.t + Math.max(0, (q.z - G.d) / RUN); for (const [dx, dz] of [[0, 0], [br * 0.7, 0], [-br * 0.7, 0], [0, br * 0.5], [0, -br * 0.5], [br * 0.5, br * 0.4], [-br * 0.5, -br * 0.4]]) for (const tw of [-0.15, 0, 0.15]) { const px = x + dx, pz = q.z + dz;
        if (q.type === 'saw' && Math.hypot(px - sawX(q, tt + tw), dz) < q.r + 0.25) c++; if (q.type === 'hammer' && Math.abs(px - hamX(q, tt + tw)) < q.r + 0.3) c++;
        if (q.type === 'wall' && Math.sign(px) === q.side) c += 2; if (q.type === 'bar') { const a = barA(q, tt + tw), off = Math.abs(-px * Math.sin(a) + dz * Math.cos(a)); if (Math.abs(px * Math.cos(a) + dz * Math.sin(a)) < q.len && off < 0.5) c++; } } } return c; };
  const zOf = q => q ? q.z : 1e9, dz0 = danger.length ? danger[0].z : 1e9;
  if (brg && (brg.z <= G.d + 0.5 || (brg.z - G.d < 10 && brg.z < dz0))) goal = brg.x;
  else if (gate && gate.z - G.d < 12 && gate.z < dz0) { const v0 = apply(gate.ops[0], G.n), v1 = apply(gate.ops[1], G.n); let side = v0 >= v1 ? 0 : 1; if (R() > acc && R() < 0.3) side = 1 - side; goal = side ? Math.max(br * 0.5, 1.8) : -Math.max(br * 0.5, 1.8); }
  else if (danger.length) { let bx = G.cx, bc = 1e9; for (let x = -HW + 0.4; x <= HW - 0.4; x += 0.3) { const c = cost(x) + Math.abs(x - G.cx) * 0.05; if (c < bc) { bc = c; bx = x; } } goal = bx; }
  else if (rec) goal = rec.x * 0.7; else if (gate) { const v0 = apply(gate.ops[0], G.n), v1 = apply(gate.ops[1], G.n); goal = v0 >= v1 ? -1.8 : 1.8; }
  goal += (R() - 0.5) * (1 - acc) * 1.4; mem.goal = clamp(goal, -HW + 0.3, HW - 0.3); mem.slide = true; ACT.slide(G, clamp(mem.goal - G.wantX, -0.12, 0.12)); }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.left = G.n; G.stair = 0; finish(G, true); }
// ---------- LESSONS: short tracks ----------
const AIMCARD = {"pic": "👥", "win": "BE BIGGER THAN THE GIANT", "lose": "YOUR CROWD IS GONE", "how": "SLIDE THROUGH THE BEST GATE"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'gates', title: 'PICK THE BETTER GATE', say: G => crowdCue(G)[0], do: G => crowdCue(G)[1], at: G => crowdCue(G)[2], how: 'Slide left and right. Run through the gate that makes your crowd BIGGER. Beat the giant at the end!' }],
  2: [{ id: 'dodge', title: 'DODGE THE SAWS', say: G => crowdCue(G)[0], do: G => crowdCue(G)[1], at: G => crowdCue(G)[2], how: 'Saws and bars knock runners off. Slide to where they are not. Keep enough runners to beat the giant!' }],
  3: [{ id: 'fight', title: 'BIGGER CROWD WINS', say: G => crowdCue(G)[0], do: G => crowdCue(G)[1], at: G => crowdCue(G)[2], how: 'Red crowds fight you one for one. Take the best gates first, grab the grey runners, then beat them all!' }],
};
// THE TUTORIAL SAYS WHICH WAY, AND HOW FAR (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). The hand
// slid left and right for ever, whatever was coming. Now the robot is asked where it would run (dryPlan; its goal) and the hand slides that
// way, that far (the slide moves the crowd by the finger's movement): SLIDE LEFT / SLIDE RIGHT, or STAY when it is already there.
const CWC = { t: -1e9, v: null };
function crowdCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - CWC.t < 250) return CWC.v; CWC.t = now;
  const mem = {}; dryPlan(G, null, mem); let v = ['STAY', 'wait', false];
  if (mem.goal != null && Math.abs(mem.goal - G.wantX) > 0.35) { const dx = (mem.goal - G.wantX) / (HW * 2) * Math.max(260, W * 0.75), x0 = clamp(W / 2 - dx / 2, 30, W - 30), y0 = H * 0.72;
    v = [dx > 0 ? 'SLIDE RIGHT' : 'SLIDE LEFT', 'drag', [x0, y0, x0 + dx, y0]]; }
  CWC.v = v; return v; }
const LTRACK = {
  gates: G => { const p = [[{ op: '+', v: 10 }, { op: '-', v: 5 }], [{ op: '/', v: 2 }, { op: 'x', v: 2 }], [{ op: '+', v: 8 }, { op: '-', v: 10 }], [{ op: '-', v: 20 }, { op: '+', v: 20 }], [{ op: 'x', v: 2 }, { op: '/', v: 3 }], [{ op: '+', v: 30 }, { op: '/', v: 2 }], [{ op: '-', v: 40 }, { op: 'x', v: 2 }], [{ op: '/', v: 2 }, { op: '+', v: 50 }], [{ op: 'x', v: 2 }, { op: '-', v: 30 }], [{ op: '-', v: 60 }, { op: '+', v: 100 }], [{ op: 'x', v: 2 }, { op: '/', v: 2 }], [{ op: '+', v: 150 }, { op: '-', v: 100 }]];
    p.forEach((ops, i) => G.items.push({ type: 'gate', z: 22 + i * 13, ops: G.rnd() < 0.5 ? ops : [ops[1], ops[0]] })); return 1870; },
  dodge: G => { let z = 24; for (let i = 0; i < 7; i++) { if (i % 2 === 0) G.items.push({ type: 'saw', z, x0: (G.rnd() - 0.5) * 2, amp: 2.2, w: 1.5, ph: G.rnd() * TAU, r: 0.75 }); else G.items.push({ type: 'bar', z, len: 2.0, w: 1.6 * (G.rnd() < 0.5 ? -1 : 1), ph: G.rnd() * TAU }); z += 14; }
    G.items.push({ type: 'wall', z, side: G.rnd() < 0.5 ? -1 : 1 }); z += 12; G.items.push({ type: 'wall', z, side: G.rnd() < 0.5 ? -1 : 1 }); return 34; },
  fight: G => { const p = [[{ op: 'x', v: 2 }, { op: '-', v: 6 }], [{ op: '+', v: 15 }, { op: '/', v: 2 }]]; G.items.push({ type: 'gate', z: 22, ops: G.rnd() < 0.5 ? p[0] : [p[0][1], p[0][0]] }); G.items.push({ type: 'recruit', z: 34, x: G.rnd() < 0.5 ? -2.2 : 2.2, n: 10 });
    G.items.push({ type: 'enemy', z: 46, n: 14 }); G.items.push({ type: 'gate', z: 60, ops: G.rnd() < 0.5 ? p[1] : [p[1][1], p[1][0]] }); G.items.push({ type: 'enemy', z: 74, n: 12 }); return 10; },
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); let hp = 0; setup(G, { len: { gates: 175, dodge: 150, fight: 90 }[st.id], start: st.id === 'gates' ? 10 : st.id === 'dodge' ? 40 : 12, track: (g) => { hp = LTRACK[st.id](g); }, hp: 1 }); G.hp = G.boss.hp = G.boss.left = hp; G.ev.push({ k: 'track' }); }
function lessonMiss(G, why) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.2; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || G.wait > 0) return; if (what !== 'giant') return;
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.4; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'track' }); }; }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { slide }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
