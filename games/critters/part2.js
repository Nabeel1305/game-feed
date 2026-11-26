
// ===================== RULES: Critter Clash (game 32) =====================
// Turn by turn battles between teams of little critters in a meadow. Every critter has a type: fire beats leaf and spark, water
// beats fire and stone, leaf beats water and stone, spark beats water and leaf, stone beats fire and spark. A hit on a type it
// beats does double; on a type that beats it, half. Your turn: ATTACK (then tap when the white ring meets the gold one for a
// critical; too early and it glances off), GUARD (the foe's next hit does a fifth), or tap a critter on your bench to send it in.
// The foe shows what it will do next: a BIG ATTACK is coming? Guard it, or send in a critter it is weak against. Every fourth
// level a wild critter: weaken it and CATCH it (it joins your collection and makes that type stronger). Coins buy upgrades that
// stay; your rank grows.
const RULES = [
  '<b>ATTACK</b>, then tap when the white ring meets the gold ring for a <b>critical</b>. Too early and it glances off.',
  '<b>Types:</b> 🔥 beats 🌿⚡ · 💧 beats 🔥🪨 · 🌿 beats 💧🪨 · ⚡ beats 💧🌿 · 🪨 beats 🔥⚡. Double damage one way, half the other.',
  'Tap a critter on your <b>bench</b> to send it in. Watch what the foe will do next: <b>GUARD</b> a big attack.',
  'Every fourth level a <b>wild critter</b>: weaken it, then <b>CATCH</b> it. Each one you catch makes its type stronger.',
  'Coins buy upgrades that stay. Win with nobody fainted for three stars.',
];
const TYPES = ['fire', 'water', 'leaf', 'spark', 'stone'];
const TI = { fire: '🔥', water: '💧', leaf: '🌿', spark: '⚡', stone: '🪨' };
const TCOL = { fire: '#ff7a3a', water: '#4a9aff', leaf: '#5ad05a', spark: '#ffd83a', stone: '#b8a890' };
const BEATS = { fire: ['leaf', 'spark'], water: ['fire', 'stone'], leaf: ['water', 'stone'], spark: ['water', 'leaf'], stone: ['fire', 'spark'] };
const eff = (a, d) => BEATS[a].includes(d) ? 2 : BEATS[d].includes(a) ? 0.5 : 1;
const SPECIES = { fire: { name: 'Emberpup', move: 'Flame Puff' }, water: { name: 'Puddlewump', move: 'Splash Jet' }, leaf: { name: 'Sproutle', move: 'Leaf Flurry' }, spark: { name: 'Zapling', move: 'Zap Bolt' }, stone: { name: 'Pebblor', move: 'Rock Roll' } };
const TRAINERS = ['Ranger Jo', 'Picnic Pat', 'Camper Kip', 'Scout Remi', 'Hiker Bo', 'Twins Ada & Ida', 'Fisher Lu', 'Coach Mags'];
const UPGRADES = [
  { id: 'train', name: 'Training camp', desc: 'All your critters hit harder and have more health.', max: 3, cost: l => 20 + l * 25 },
  { id: 'claws', name: 'Sharp claws', desc: 'A wider gold ring: criticals are easier.', max: 2, cost: l => 25 + l * 30 },
  { id: 'shell', name: 'Hard shell', desc: 'GUARD blocks even more.', max: 2, cost: l => 20 + l * 25 },
  { id: 'berry', name: 'Berry basket', desc: 'One berry each battle: heals a critter by half.', max: 1, cost: () => 45 },
  { id: 'charm', name: 'Lucky charm', desc: 'Catching works more often.', max: 2, cost: l => 20 + l * 25 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const starsOf = t => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : Math.min(3, ((store.get('dex', {}) || {})[t] | 0));
const RANKS = [[0, 'Rookie'], [40, 'Trainer'], [130, 'Ace trainer'], [320, 'Gym leader'], [700, 'Champion'], [1500, 'Critter legend']];
const PLACES = ['The meadow', 'The beach', 'The autumn wood', 'The snowfield'], placeOf = N => Math.floor((N - 1) / 5) % 4;
const WEATHERS = ['morning', 'noon', 'golden', 'sunset', 'overcast', 'morning', 'rain', 'dusk'];
function weatherOf(N) { if (N <= 3) return ['morning', 'noon', 'golden'][N - 1]; const R = rng(N * 7741 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }
const ownedAt = N => ['fire', 'water', ...(N >= 3 ? ['leaf'] : []), ...(N >= 10 ? ['spark'] : []), ...(N >= 20 ? ['stone'] : [])];
const foePool = N => ['fire', 'water', 'leaf', ...(N >= 8 ? ['spark'] : []), ...(N >= 16 ? ['stone'] : [])];
const hpOf = lv => (40 + 6 * lv) * 2.2, powOf = lv => 10 + 1.6 * lv;

function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0, wild = N % 4 === 0 && !boss;
  return { N, f, help: !!help, boss, wild,
    foeLv: N + x(0, 4, 40) + (boss ? 2 : 0), foes: wild ? 1 : N <= 1 ? 1 : N <= 4 ? 2 : 3, hm: x(1.2, 3.0, 22) * (wild ? 1.6 : 1), foeP: x(0.75, 1.2, 35), bigX: x(3.8, 4.4, 40),
    bigEvery: Math.round(x(3.4, 2.2, 30)), smart: x(0.05, 0.9, 30), guardP: x(0, 0.22, 30), healP: x(0, 0.1, 40),
    win: 0.085 + 0.025 * upLv('claws') + (help ? 0.02 : 0), ringT: x(0.95, 0.7, 40),
    train: 1 + 0.08 * upLv('train') + (help ? 0.15 : 0), shell: 0.8 + 0.05 * upLv('shell'), berry: upLv('berry'), charm: 0.12 * upLv('charm'), wildHp: 1.7 };
}
function critter(type, lv, mine, c) { const k = mine ? c.train * (1 + 0.05 * starsOf(type)) : 1, max = Math.round(hpOf(lv) * k * (mine ? 1 : c.hm)); return { type, lv: Math.round(lv), max, hp: max, pow: powOf(lv) * k * (mine ? 1 : c.foeP), alive: true, name: (mine ? '' : c.wild ? 'Wild ' : '') + SPECIES[type].name }; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const pool = foePool(N), foe = []; for (let i = 0; i < cfg.foes; i++) foe.push(critter(N <= 3 ? [['fire'], ['fire', 'water'], ['water', 'leaf']][N - 1][i] : pool[(R() * pool.length) | 0], cfg.foeLv + (i === cfg.foes - 1 && N > 5 ? 1 : 0), false, cfg));
  // your coach picks your team: for each of their critters, the one of yours that beats it best, then the rest
  const own = ownedAt(N), team = []; if (own.length > 3) for (const f of foe) { const best = own.filter(t => !team.includes(t)).sort((a, b) => eff(b, f.type) - eff(a, f.type) + (eff(f.type, a) - eff(f.type, b)) * 0.5)[0]; if (best && team.length < 3) team.push(best); }
  const size = N === 1 ? 1 : Math.min(3, own.length);
  for (const t of own) if (team.length < size && !team.includes(t)) team.push(t); team.length = Math.min(team.length, size);
  foe.forEach(f => { f.max = f.hp = Math.round(f.max * size / cfg.foes); });      // the same weight on both sides: their health against yours
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), place: placeOf(N), trainer: cfg.wild ? null : TRAINERS[(N * 3 + seed) % TRAINERS.length],
    me: team.map(t => critter(t, N, true, cfg)), ai: 0, foe, fi: 0, ph: 'choose', pt: 0, intent: null, sinceBig: 0, guard: false, foeGuard: false, act: null, berry: cfg.berry,
    crits: 0, supers: 0, faints: 0, turns: 0, caught: false };
  G.me.sort((a, b) => TYPES.indexOf(a.type) - TYPES.indexOf(b.type)); G.ai = 0;      // you open with the first in line: sending in the right one is yours to do
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.ev.push({ k: 'battle' }); nextIntent(G); }
  return G;
}
function bestFor(G, ft, skip) { let bi = -1, bs = -9; G.me.forEach((m, i) => { if (!m.alive || i === skip) return; const s = eff(m.type, ft) - eff(ft, m.type) * 0.6 + m.hp / m.max * 0.3; if (s > bs) { bs = s; bi = i; } }); return bi; }
const mine = G => G.me[G.ai], theirs = G => G.foe[G.fi];
// ---------- what the foe will do next (shown to you before you choose) ----------
function nextIntent(G) {
  const c = G.cfg, R = G.rnd, f = theirs(G), m = mine(G), L = lessonNow(G);
  if (L) { G.intent = { k: L.id === 'guard' ? (G.sinceBig >= 1 ? 'big' : 'rest') : 'rest' }; return; }
  if (G.sinceBig >= c.bigEvery - 1 && R() < 0.85) { G.intent = { k: 'big' }; return; }
  const bad = eff(m.type, f.type) > 1 || eff(f.type, m.type) < 1, alt = G.foe.findIndex((q, i) => q.alive && i !== G.fi && eff(q.type, m.type) > 1);
  if (bad && alt >= 0 && R() < c.smart) { G.intent = { k: 'switch', to: alt }; return; }
  if (f.hp < f.max * 0.35 && R() < c.healP * 3) { G.intent = { k: 'heal' }; return; }
  if (R() < c.guardP) { G.intent = { k: 'guard' }; return; }
  G.intent = { k: 'hit' };
}
// ---------- your turn: the things you can tap ----------
function canAct(G) { return !G.over && G.ph === 'choose' && !G.lessonWait; }
function attack(G) { if (!canAct(G)) return false; G.ph = 'ring'; G.pt = 0; G.act = { k: 'attack', tap: null, wait: G.rnd() * 0.9 }; G.foeGuard = G.intent && G.intent.k === 'guard'; G.ev.push({ k: 'ring' }); return true; }
function guard(G) { if (!canAct(G)) return false; G.guard = true; G.act = { k: 'guard' }; G.ph = 'mine'; G.pt = 0; G.ev.push({ k: 'guard' }); return true; }
function switchTo(G, i) { if (!canAct(G) || i === G.ai || !G.me[i] || !G.me[i].alive) return false; G.act = { k: 'switch', from: G.ai }; G.ai = i; G.ph = 'mine'; G.pt = 0; G.ev.push({ k: 'switch', i }); return true; }
function bench(G) { return G.me.map((m, i) => i).filter(i => i !== G.ai); }
function useBerry(G) { if (!canAct(G) || G.berry <= 0) return false; const m = mine(G); if (m.hp >= m.max * 0.9) return false; G.berry--; m.hp = Math.min(m.max, m.hp + m.max * 0.5); G.act = { k: 'berry' }; G.ph = 'mine'; G.pt = 0; G.ev.push({ k: 'berry' }); return true; }
const canCatch = G => G.cfg.wild && !G.lesson && theirs(G) && theirs(G).hp < theirs(G).max * 0.4;
function throwCharm(G) { if (!canAct(G) || !canCatch(G)) return false; G.ph = 'ring'; G.pt = 0; G.act = { k: 'catch', tap: null, wait: G.rnd() * 0.9 }; G.ev.push({ k: 'ring', catch: true }); return true; }
// the timing tap (anywhere) while the ring closes: right on the gold ring = critical; early = it glances off
function tapRing(G) { if (G.over || G.ph !== 'ring' || G.act.tap != null) return false; G.act.tap = G.pt; G.ev.push({ k: 'tap' }); return true; }
const ringAt = (c, a) => (a ? a.wait : 0) + 0.6 * c.ringT;      // when the white ring meets the gold one (it starts after a short, random wait)
function timing(G) { const c = G.cfg, t = G.act.tap, tc = ringAt(c, G.act), hw = c.win * c.ringT * 1.2 * (G.lesson ? 1.8 : 1); if (t == null) return 'none';      /* (a lesson's window is wider: 0.2 s was too tight to learn from; 26 Nov 2026) */ if (Math.abs(t - tc) <= hw) return 'crit'; return t < tc ? 'early' : 'late'; }
// ---------- the flow ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.pt += dt; const c = G.cfg;
  if (G.lessonWait) { if (G.pt < 1.3) return; G.lessonWait = false; if (G.lessonEnd) { G.lessonEnd = false; realBattle(G); } return; }
  if (G.ph === 'ring') { if (G.act.tap == null && G.pt < G.act.wait + c.ringT) return; if (G.act.tap != null && G.pt < Math.max(G.act.tap, ringAt(c, G.act)) + 0.05) return;
    const tm = timing(G); G.act.tm = tm;
    if (G.act.k === 'catch') { const f = theirs(G), p = clamp((1 - f.hp / f.max) * (tm === 'crit' ? 1.05 : tm === 'early' ? 0.35 : 0.6) + c.charm, 0, 0.95); G.act.ok = G.rnd() < p; G.ph = 'mine'; G.pt = 0; G.ev.push({ k: 'throw', tm }); return; }
    const m = mine(G), f = theirs(G), e = eff(m.type, f.type), mul = tm === 'crit' ? 2 : tm === 'early' ? 0.15 : tm === 'late' ? 0.7 : 0.6;      // no tap at all: a half-hearted hit
    G.act.dmg = Math.max(1, Math.round(m.pow * e * mul * (G.foeGuard ? 0.3 : 1) * (0.9 + G.rnd() * 0.2))); G.act.e = e; G.ph = 'mine'; G.pt = 0; G.ev.push({ k: 'shoot', type: m.type, tm, e }); return; }
  if (G.ph === 'mine') { const a = G.act, hitT = a.k === 'attack' ? 0.38 : a.k === 'catch' ? 1.5 : 0.35;
    if (a.k === 'attack' && !a.hit && G.pt >= hitT) { a.hit = true; const f = theirs(G); f.hp = Math.max(0, f.hp - a.dmg); if (a.tm === 'crit') G.crits++; if (a.e > 1) G.supers++;
      G.ev.push({ k: 'hit', who: 'foe', dmg: a.dmg, e: a.e, tm: a.tm, guarded: G.foeGuard }); lessonSee(G, 'attack', a); }
    if (a.k === 'catch' && !a.hit && G.pt >= hitT) { a.hit = true; G.ev.push({ k: a.ok ? 'caught' : 'breakfree' }); if (a.ok) { G.caught = true; theirs(G).alive = false; finish(G, true, 'caught'); return; } }
    if (G.pt < (a.k === 'attack' ? 0.8 : a.k === 'catch' ? 2.0 : 0.55)) return;
    G.foeGuard = false; const f = theirs(G); if (f.hp <= 0 && f.alive) { f.alive = false; G.ev.push({ k: 'faint', who: 'foe' }); G.sinceBig = 0;
      if (G.lesson) { f.hp = f.max; f.alive = true; } else { const n = G.foe.findIndex(q => q.alive); if (n < 0) { finish(G, true); return; } G.fi = n; G.ph = 'swap'; G.pt = 0; G.swapWho = 'foe'; G.ev.push({ k: 'enter', who: 'foe' }); return; } }
    G.ph = 'theirs'; G.pt = 0; foeAct(G); return; }
  if (G.ph === 'theirs') { const a = G.fact; if (a.dmg != null && !a.hit && G.pt >= 0.42) { a.hit = true; const m = mine(G); m.hp = Math.max(G.lesson ? 1 : 0, m.hp - a.dmg); G.ev.push({ k: 'hit', who: 'me', dmg: a.dmg, e: a.e, big: a.big, guarded: G.guard }); if (a.big) lessonSee(G, G.guard ? 'blocked' : 'unblocked'); }
    if (G.pt < 0.9) return; G.guard = false; G.turns++; const m = mine(G);
    if (m.hp <= 0) { m.alive = false; G.faints++; G.ev.push({ k: 'faint', who: 'me' }); const n = bestFor(G, theirs(G).type); if (n < 0) { finish(G, false); return; } G.ai = n; G.ph = 'swap'; G.pt = 0; G.swapWho = 'me'; G.ev.push({ k: 'enter', who: 'me' }); return; }
    nextIntent(G); G.ph = 'choose'; G.pt = 0; return; }
  if (G.ph === 'swap') { if (G.pt < 0.9) return; nextIntent(G); G.ph = 'choose'; G.pt = 0; return; }
}
function foeAct(G) {
  const c = G.cfg, R = G.rnd, f = theirs(G), m = mine(G), it = G.intent || { k: 'hit' }, a = { k: it.k };
  if (it.k === 'hit' || it.k === 'big') { const e = eff(f.type, m.type), big = it.k === 'big'; a.e = e; a.big = big; a.dmg = Math.max(1, Math.round(f.pow * e * (big ? c.bigX : 1) * (G.guard ? 1 - c.shell : 1) * (0.9 + R() * 0.2) * (G.lesson ? 0.25 : 1))); G.sinceBig = big ? 0 : G.sinceBig + 1; G.ev.push({ k: 'foeshoot', type: f.type, big }); }
  else if (it.k === 'switch' && G.foe[it.to] && G.foe[it.to].alive) { G.fi = it.to; G.ev.push({ k: 'enter', who: 'foe' }); G.sinceBig++; }
  else if (it.k === 'heal') { f.hp = Math.min(f.max, f.hp + f.max * 0.3); G.ev.push({ k: 'foeheal' }); G.sinceBig++; }
  else { G.sinceBig += it.k === 'rest' ? 1 : 1; G.ev.push({ k: 'foe' + it.k }); }
  G.fact = a;
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; const hp = G.me.reduce((s, m) => s + m.hp / m.max, 0) / G.me.length, stars = win ? (G.faints === 0 && hp > 0.5 ? 3 : G.faints === 0 ? 2 : 1) : 0;
  G.res = { win, why, stars, caught: G.caught, crits: G.crits, supers: G.supers, faints: G.faints, coins: G.crits + G.supers + (win ? 4 + Math.ceil(G.N / 3) + (G.caught ? 5 : 0) : 0), time: G.t, type: theirs(G) && theirs(G).type };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🐾", "win": "MAKE ALL THEIR CRITTERS FAINT", "lose": "ALL YOURS FAINT", "how": "ATTACK, TAP ON THE GOLD RING"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'crit', title: 'ATTACK!', say: G => critCue(G)[0], do: G => critCue(G)[1], at: G => critCue(G)[2], how: 'Tap ATTACK. Then tap anywhere when the white ring meets the gold ring: a CRITICAL! Land two criticals in a row.', need: 2, foe: 'leaf', me: 'fire' }],
  2: [{ id: 'type', title: 'TYPES', say: G => critCue(G)[0], do: G => critCue(G)[1], at: G => critCue(G)[2], how: 'Water beats fire! Tap Puddlewump on your bench to send it in, then attack: two SUPER EFFECTIVE hits in a row.', need: 2, foe: 'fire', me: 'fire' }],
  3: [{ id: 'guard', title: 'GUARD', say: G => critCue(G)[0], do: G => critCue(G)[1], at: G => critCue(G)[2], how: 'When the foe shows BIG ATTACK, tap GUARD before it lands. Block two big attacks.', need: 2, foe: 'water', me: 'leaf' }],
};
// THE TUTORIAL SHOWS ONE TAP AT A TIME, WITH THE HAND ON IT (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing
// happens"). It said TAP ON THE GOLD RING before ATTACK had even been pressed. Now the robot is asked (dryPlan) and the hand is on its button:
// TAP ATTACK, then WAIT… / TAP NOW! as the white ring reaches the gold one (shown a quarter of a second early, the time a thumb takes);
// TAP <the water one> on the bench; TAP GUARD when the foe shows BIG ATTACK.
function critCue(G) { const c = G.cfg, B = q => { const b = buttons(G).find(q); return b ? [b.x + b.w / 2, b.y + b.h / 2] : false; };
  if (G.over || G.lessonWait) return ['WAIT…', 'wait', false];
  if (G.ph === 'ring') { if (G.act.tap != null) return ['WAIT…', 'wait', false]; const tc = ringAt(c, G.act); return G.pt >= tc - 0.2 && G.pt <= tc + 0.05 ? ['TAP NOW!', 'tap', [W / 2, H * 0.45]] : ['WAIT FOR GOLD…', 'wait', false]; }
  if (G.ph !== 'choose') return ['WAIT…', 'wait', false];
  const P = dryPlan(G, null, { at: -1e9 }); if (!P) return ['WAIT…', 'wait', false];
  if (P[0] === 'attack') return ['TAP ATTACK', 'tap', B(q => q.k === 'attack')]; if (P[0] === 'guard') return ['TAP GUARD!', 'tap', B(q => q.k === 'guard')];
  if (P[0] === 'switchTo') return ['TAP ' + (G.me[P[1]].name || 'IT').toUpperCase(), 'tap', B(q => q.k === 'bench' && q.i === P[1])];
  if (P[0] === 'useBerry') return ['TAP THE BERRY', 'tap', B(q => q.k === 'berry')]; if (P[0] === 'throwCharm') return ['TAP CATCH', 'tap', B(q => q.k === 'catch')];
  return ['WAIT…', 'wait', false]; }
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.saveFoe = G.foe; G.saveMe = G.me.map(m => Object.assign({}, m));
  const d = critter(st.foe, G.N, false, G.cfg); d.max = d.hp = 999; d.name = 'Practice ' + SPECIES[st.foe].name; G.foe = [d]; G.fi = 0; const mi = G.me.findIndex(m => m.type === st.me); G.ai = mi >= 0 ? mi : 0; G.sinceBig = 0;
  G.ev.push({ k: 'lessonnext', first: true }); nextIntent(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, a) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i];
  const good = st.id === 'crit' ? what === 'attack' && a.tm === 'crit' : st.id === 'type' ? what === 'attack' && a.e > 1 : what === 'blocked';
  const counts = st.id === 'guard' ? (what === 'blocked' || what === 'unblocked') : what === 'attack';
  if (!counts) return;
  if (!good) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.lessonWait = true; G.pt = 0; G.ph = 'choose'; }
}
function realBattle(G) { G.foe = G.saveFoe; G.me = G.saveMe; G.fi = 0; G.ai = 0; G.sinceBig = 0; G.crits = G.supers = G.faints = G.turns = 0; G.guard = G.foeGuard = false; G.ph = 'choose'; G.pt = 0; G.ev.push({ k: 'battle' }); nextIntent(G); }
// ---------- for the robots ----------
// BLIND: a thumb that taps somewhere on the screen. The buttons sit at the bottom (ATTACK a tenth of the screen, GUARD and the
// bench and the small buttons less); a tap elsewhere does nothing; while the ring closes any tap is the timing tap.
const BLIND = { t: G => { const R = Math.random; if (G.ph === 'ring') { tapRing(G); return; } if (G.ph !== 'choose') return; const b = R(), bn = bench(G);
  if (b < 0.1) attack(G); else if (b < 0.16) guard(G); else if (b < 0.18) switchTo(G, bn[0]); else if (b < 0.2) switchTo(G, bn[1]); else if (b < 0.22) { if (!throwCharm(G)) useBerry(G); } } };
// a player who looks: guards a big attack (or sends in a critter that shrugs it off), sends in the critter that beats the foe,
// catches a weak wild critter, and taps the ring on time most of the time (acc)
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random, c = G.cfg;
  if (G.over || G.lessonWait) return;
  if (G.ph === 'ring') { if (G.act.tap != null) return; if (mem.r !== G.act) { mem.r = G.act; const hit = R() < Math.pow(acc, (0.085 / c.win) * Math.sqrt(0.95 / c.ringT)), tc = ringAt(c, G.act), hw = c.win * c.ringT * 1.2; mem.tt = hit ? tc + (R() - 0.5) * hw * 1.4 : tc + (R() < 0.4 ? -1 : 1) * (hw + 0.02 + R() * 0.12); }
    if (G.pt >= mem.tt) ACT.tapRing(G); return; }
  if (G.ph !== 'choose') { mem.at = null; return; } if (mem.at == null) mem.at = G.t + 0.3 + react * 2; if (G.t < mem.at) return; mem.at = null;
  const m = mine(G), f = theirs(G), it = G.intent || {}, L = lessonNow(G);
  if (canCatch(G) && f.hp < f.max * 0.28) { ACT.throwCharm(G); return; }
  if (it.k === 'big') { const res = G.me.findIndex((q, i) => q.alive && i !== G.ai && eff(f.type, q.type) < 1 && q.hp > q.max * 0.5); if (eff(f.type, m.type) >= 1 && res >= 0 && R() < 0.5) ACT.switchTo(G, res); else ACT.guard(G); return; }
  if (m.hp < m.max * 0.3 && G.berry > 0) { ACT.useBerry(G); return; }
  const best = bestFor(G, f.type); if (best >= 0 && best !== G.ai && eff(G.me[best].type, f.type) > eff(m.type, f.type) && (G.me[best].hp > G.me[best].max * 0.3 || L)) { ACT.switchTo(G, best); return; }
  if (it.k === 'guard' && !L) { ACT.guard(G); return; }
  ACT.attack(G);
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { tapRing, throwCharm, switchTo, guard, useBerry, attack }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
