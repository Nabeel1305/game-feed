
// ===================== RULES: Penalty Kings (game 31) =====================
// A penalty shootout, cup tie by cup tie. Five kicks each, then sudden death. Your kick: tap the spot in the goal you want to
// hit, then tap again while the needle is in the green (the green is narrower when you aim for a corner). The keeper leans to
// the side he means to dive to, but some keepers bluff and every keeper remembers where you have been shooting. Their kick:
// watch the kicker; when he plants his foot his body turns to where he will shoot; tap that side of the screen to dive (the
// middle to stay). Go before he plants and he sees you and puts it the other way; go too late and it is past you.
// Coins for goals, saves and wins buy upgrades that stay (golden boots, big gloves, a scout report...); your rank grows.
// World: metres; the goal line is z = 0 (posts at x = +-3.66, bar at 2.44 m), the penalty spot is at z = 11.
const RULES = [
  '<b>Your kick:</b> tap where you want to shoot in the goal, then tap again while the needle is in the <b>green</b>. Corners are harder to hit.',
  '<b>Read the keeper:</b> he leans to the side he will dive to. Shoot the other way. Some keepers bluff, and they all remember where you shot.',
  '<b>Their kick:</b> when the kicker <b>plants his foot</b>, his body turns to where he will shoot. Tap that side to dive, the middle to stay.',
  'Dive <b>before</b> he plants and he sees you go. Five kicks each, then sudden death. Win the tie to go through.',
  'Coins for goals, saves and wins buy upgrades that stay.',
];
const GW = 3.66, GH = 2.44, SPOT = 11, FGOAL = 0.18;      // FGOAL: the share of the screen that is the goal and the space round it (measured, tools/shots3d)
const UPGRADES = [
  { id: 'boots', name: 'Golden boots', desc: 'A wider green zone on the power bar.', max: 3, cost: l => 20 + l * 25 },
  { id: 'focus', name: 'Ice in the veins', desc: 'The needle moves slower.', max: 2, cost: l => 25 + l * 30 },
  { id: 'gloves', name: 'Big gloves', desc: 'Your keeper reaches further.', max: 3, cost: l => 20 + l * 25 },
  { id: 'spring', name: 'Spring heels', desc: 'Your keeper dives faster, so you can wait longer.', max: 2, cost: l => 25 + l * 30 },
  { id: 'scout', name: 'Scout report', desc: "Shows each kicker's favourite side before he shoots.", max: 1, cost: () => 45 },
  { id: 'captain', name: "Captain's armband", desc: 'Retake one failed kick each match.', max: 1, cost: () => 70 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Sunday league'], [40, 'Academy'], [130, 'Pro'], [320, 'Star'], [700, 'Captain'], [1500, 'Legend'], [3000, 'Penalty King']];
const CUPS = ['Village Cup', 'County Cup', 'National Cup', 'Continental Cup', 'World Cup'], STAGES = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
const TEAMS = [{ name: 'Lions', c: 0xd8302a, c2: 0xffffff }, { name: 'Sharks', c: 0x2a6ad8, c2: 0xffffff }, { name: 'Eagles', c: 0x2a9a4a, c2: 0xf0e0a0 }, { name: 'Wolves', c: 0xe4e4e4, c2: 0x2a2a3a },
  { name: 'Tigers', c: 0xf08a20, c2: 0x1a1a1a }, { name: 'Panthers', c: 0x26262c, c2: 0xd8b040 }, { name: 'Bulls', c: 0x8a1a2a, c2: 0xf0f0f0 }, { name: 'Comets', c: 0x7a3ad0, c2: 0xffe060 }];
const KEEPERS = ['Big Sam', 'Iron Ike', 'Tall Tom', 'Cat Carlos', 'Quick Kofi', 'Mighty Mo', 'Safe Hands Sid', 'Lanky Lars'];
const KICKERS = ['Rico', 'Dimi', 'Kwame', 'Luca', 'Yusuf', 'Bram', 'Teo', 'Sami', 'Nico', 'Obi', 'Ivan', 'Pele Jr', 'Marco', 'Ade', 'Jonas', 'Kai'];
const cupOf = N => CUPS[Math.floor((N - 1) / 5) % CUPS.length] + (N > 25 ? ' ' + ['II', 'III', 'IV', 'V', 'VI'][Math.min(4, Math.floor((N - 1) / 25) - 1)] : ''), stageOf = N => STAGES[(N - 1) % 5];
const WEATHERS = ['morning', 'golden', 'night', 'sunset', 'overcast', 'night', 'rain', 'dusk'];
function weatherOf(N) { if (N <= 3) return ['morning', 'golden', 'night'][N - 1]; const R = rng(N * 7741 + 5); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  return { N, f, help: !!help, boss,
    // your kick
    // (25 Nov 2026, his review: "as the levels go up make it faster the green parts smaller ans the line go faster for saving and scoring".
    // It did, but too gently to feel: by level 10 the green was only a tenth narrower. The green now narrows, the needle quickens and
    // their shot comes sooner about half as fast again over the first twenty levels, and each goes a little further in the end.)
    band: x(0.17, 0.09, 20) + 0.02 * upLv('boots') + (help ? 0.03 : 0), sweep: x(1.15, 0.56, 26) * (1 + 0.12 * upLv('focus')),
    relK: x(0.95, 0.5, 30) - (boss ? 0.06 : 0), memK: x(0.35, 0.85, 30), reachK: x(1.3, 1.9, 35) + (boss ? 0.12 : 0),
    // their kick
    relC: x(0.96, 0.55, 35), sw: x(0.85, 0.97, 30), pc: x(0.06, 0.35, 35) + (boss ? 0.08 : 0), mk: x(0.05, 0.03, 40), flight: x(0.6, 0.38, 26), stutter: N >= 3 ? x(0.25, 0.55, 30) : 0, centre: x(0.08, 0.2, 30),
    reach: 1.45 + 0.12 * upLv('gloves') + (help ? 0.15 : 0), dive: 0.2 - 0.04 * upLv('spring'), arrow: N <= 5, retake: upLv('captain'), scout: upLv('scout') };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0, R = rng(seed);
  const team = TEAMS[(N * 5 + (seed % 3)) % TEAMS.length], kickers = [];
  for (let i = 0; i < 12; i++) kickers.push({ name: KICKERS[(N * 3 + i * 5 + (seed % 7)) % KICKERS.length], no: 2 + ((N * 7 + i * 3) % 20), fs: R() < 0.5 ? -1 : 1, type: R() < cfg.centre * 1.5 ? 'trick' : R() < 0.5 ? 'placer' : 'power' });
  const G = { N, cfg, seed, rnd: R, t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), team, keeper: KEEPERS[(N + seed) % KEEPERS.length], kickers, ours: [], theirs: [], zones: [], sd: false, ph: 'aim', pt: 0, S: null, K: null,
    goals: 0, saves: 0, top: 0, retake: cfg.retake, side: 'S' };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.ev.push({ k: 'match' }); startShot(G); }
  return G;
}
const zoneOf = x => Math.abs(x) < 1.0 ? 0 : Math.sign(x);
const sum = a => a.reduce((s, v) => s + v, 0);
function gauss(R) { return Math.sqrt(-2 * Math.log(1 - R() * 0.9999)) * Math.cos(TAU * R()); }
// ---------- your kick ----------
function startShot(G) {
  const R = G.rnd, L = lessonNow(G); G.side = 'S'; G.ph = 'aim'; G.pt = 0;
  G.S = { lean: L && L.id === 'shoot' ? 0 : R() < 0.5 ? -1 : 1, leanAt: 0.45 + R() * 0.5, aim: null, bc: 0.22 + R() * 0.56, w: 0, m: 0, dir: 1, passes: 0, q: null, x: 0, y: 0, T: 0.45, dive: 0, out: null, strike: 0.18 };
  G.ev.push({ k: 'shotup' });
}
function corner(x, y) { return clamp((Math.abs(x) - 1.5) / 2.1, 0, 1) * 0.6 + clamp((y - 1.2) / 1.2, 0, 1) * 0.4; }
function aimAt(G, x, y) {
  if (G.over || G.ph !== 'aim' || Math.abs(x) > GW + 0.7 || y < -0.4 || y > GH + 1.0) return false; const S = G.S;
  S.aim = { x, y: clamp(y, 0.12, GH + 1) }; S.w = G.cfg.band * (1 - 0.5 * corner(x, y)); G.ph = 'meter'; G.pt = 0; S.m = 0; S.dir = 1; S.passes = 0; G.ev.push({ k: 'aim' }); return true;
}
function shootNow(G, forced) {
  if (G.over || G.ph !== 'meter') return false; const S = G.S, R = G.rnd, c = G.cfg, d = Math.abs(S.m - S.bc);
  S.q = forced ? 'r' : d <= S.w / 2 ? 'g' : d <= S.w / 2 + 0.05 ? 'y' : 'r';
  const sd = S.q === 'g' ? 0.12 : 0.8; S.x = S.aim.x + gauss(R) * sd; S.y = Math.max(0.1, S.aim.y + gauss(R) * sd * 0.6); S.T = S.q === 'g' ? 0.42 : S.q === 'y' ? 0.62 : 0.5;
  if (S.q === 'r') { if (R() < 0.55) { S.y = GH + 0.6 + R() * 2.5; S.x = S.aim.x * 0.8 + gauss(R) * 1.2; } else { S.x = S.aim.x * 0.25; S.y = 0.12; S.T = 0.9; } }      // red: skied over the bar, or scuffed along the ground at him
  // the keeper: where you have been shooting, else his lean (or a bluff)
  const L = lessonNow(G), z = G.zones, mem = z.length >= 2 && z[z.length - 1] === z[z.length - 2] ? z[z.length - 1] : null;
  if (L && L.id === 'shoot') S.dive = 0; else if (L && L.id === 'read') S.dive = S.lean;
  else if (mem != null && R() < c.memK) S.dive = mem; else if (R() < c.relK) S.dive = S.lean; else S.dive = R() < 0.67 ? -S.lean : 0;
  const ax = Math.abs(S.x), Rk = c.reachK * (S.q === 'y' ? 1.25 : 1) * (L ? 0.85 : 1);
  if (ax > GW + 0.12 || S.y > GH + 0.12) S.out = (Math.abs(ax - GW) < 0.2 && S.y < GH + 0.1) || (Math.abs(S.y - GH) < 0.18 && ax < GW) ? 'post' : S.y > GH ? 'over' : 'wide';
  else if (covers(S.dive, S.x, S.y, Rk) || (S.q === 'r' && S.y < 0.5)) S.out = 'saved'; else S.out = 'goal';
  if (S.out === 'post') { S.x = clamp(S.x, -GW, GW); }
  G.ph = 'kickS'; G.pt = 0; G.ev.push({ k: 'run' }); return true;
}
// does a keeper who went this way (-1, 0 stay, 1) reach a ball at x, y?
function covers(d, x, y, R) { if (d === 0) return Math.abs(x) < 0.95 + R * 0.25 && y < 2.3; return Math.sign(x) === d && Math.hypot(x - d * 1.9, (y - 0.9) * 1.1) < R; }
// ---------- their kick ----------
function startSave(G) {
  const R = G.rnd, c = G.cfg, L = lessonNow(G), kk = G.kickers[G.theirs.length % G.kickers.length]; G.side = 'K'; G.ph = 'spot'; G.pt = 0;
  const stut = (L && L.id === 'stutter') || (!L && c.stutter && R() < c.stutter) ? 0.35 + R() * 0.45 : 0;
  const K = { kk, run: 1.0 + stut, stut, stutAt: 0.3 + R() * 0.3, dive: null, diveT: null, early: false, late: false, cue: 0, out: null, switched: false, x: 0, y: 0 };
  aimKick(G, K, kk.type === 'trick' && R() < 0.35 ? 0 : R() < (L ? 0 : c.centre * 0.5) ? 0 : (R() < 0.62 ? kk.fs : -kk.fs)); G.K = K; G.ev.push({ k: 'spot' });
}
function aimKick(G, K, zone) {
  const R = G.rnd, c = G.cfg, L = lessonNow(G); K.zone = zone; K.miss = !L && R() < c.mk;
  if (zone === 0) { K.x = (R() - 0.5) * 1.1; K.y = 0.3 + R() * 1.5; }
  else if (L) { K.x = zone * (1.7 + R() * 0.9); K.y = 0.2 + R() * 1.3; }
  else if (R() < c.pc) { K.x = zone * (3.15 + R() * 0.3); K.y = 1.9 + R() * 0.35; }
  else { K.x = zone * (1.6 + R() * 1.7); K.y = 0.15 + R() * 1.9; }
  if (K.miss) { if (R() < 0.5) K.x = (zone || 1) * (3.9 + R() * 0.8); else K.y = 2.6 + R() * 0.8; }
  K.T = c.flight * (K.kk.type === 'power' ? 0.85 : K.kk.type === 'placer' ? 1.1 : 1);
}
// your keeper: d = -1 or 1 (world side), 0 = stay in the middle; once a kick
function dive(G, d) {
  if (G.over || G.side !== 'K' || G.K.dive != null || !(G.ph === 'spot' || G.ph === 'run' || G.ph === 'kickK')) return false; const K = G.K, c = G.cfg, R = G.rnd;
  K.dive = d; K.diveT = G.pt; K.diveG = G.t; K.early = G.ph !== 'kickK';
  if (K.early && R() < (lessonNow(G) ? 1 : c.sw)) { const nz = d === 0 ? (R() < 0.5 ? -1 : 1) : (R() < 0.75 ? -d : 0); if (nz !== K.zone) { aimKick(G, K, nz); K.switched = true; } }
  if (G.ph === 'kickK' && G.pt > 0.22 + K.T - c.dive) K.late = true;
  G.ev.push({ k: 'dive', d, early: K.early }); return true;
}
// ---------- the flow of the shootout ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; G.pt += dt; const c = G.cfg, S = G.S, K = G.K;
  if (G.lessonEnd || G.lessonSwap) { if (G.pt < 1.4) return;      // a lesson step ends on its own result; then the next step (or the match)
    if (G.lessonEnd) { G.lessonEnd = false; G.ours = []; G.theirs = []; G.zones = []; G.goals = G.saves = G.top = 0; G.ev.push({ k: 'match' }); startShot(G); } else { G.lessonSwap = false; lessonGo(G); } return; }
  if (G.ph === 'aim') { if (G.pt > 7) { G.ph = 'meter'; S.aim = { x: 0, y: 0.5 }; S.w = c.band; shootNow(G, true); G.ev.push({ k: 'slow' }); } return; }
  if (G.ph === 'meter') { S.m += S.dir * dt / c.sweep; if (S.m >= 1) { S.m = 2 - S.m; S.dir = -1; S.passes++; } if (S.m <= 0) { S.m = -S.m; S.dir = 1; S.passes++; } if (S.passes >= 5) shootNow(G, true); return; }
  if (G.ph === 'kickS') { if (G.pt >= S.strike && !S.struck) { S.struck = true; G.ev.push({ k: 'strike', q: S.q }); }
    if (G.pt >= S.strike + S.T) { G.ph = 'resS'; G.pt = 0; const goal = S.out === 'goal';
      if (goal) { const top = Math.abs(S.x) > 2.9 && S.y > 1.7; G.ev.push({ k: 'goal', top, x: S.x, y: S.y }); if (top && !G.lesson) G.top++; } else G.ev.push({ k: S.out }); S.goal = goal;
      if (G.lesson) lessonSee(G, goal); } return; }
  if (G.ph === 'resS') { if (G.pt < 1.4) return;
    if (G.lesson) { startShot(G); return; }
    if (!S.goal && G.retake > 0) { G.retake--; G.ev.push({ k: 'retake' }); startShot(G); return; }
    G.ours.push(S.goal ? 1 : 0); G.zones.push(zoneOf(S.x)); if (S.goal) G.goals++; if (!decide(G)) startSave(G); return; }
  if (G.ph === 'spot') { if (G.pt >= 0.9) { G.ph = 'run'; G.pt = 0; G.ev.push({ k: 'runup' }); } return; }
  if (G.ph === 'run') { if (G.pt >= K.run) { G.ph = 'kickK'; G.pt = 0; K.cue = cueOf(G, K); G.ev.push({ k: 'plant', cue: K.cue }); } return; }
  if (G.ph === 'kickK') { if (G.pt >= 0.22 && !K.struck) { K.struck = true; G.ev.push({ k: 'kstrike' }); }
    if (G.pt >= 0.22 + K.T) { G.ph = 'resK'; G.pt = 0; const off = Math.abs(K.x) > GW + 0.1 || K.y > GH + 0.1, d = K.dive == null ? 0 : K.dive, ok = !off && !K.late && covers(d, K.x, K.y, c.reach * (K.dive == null ? 0.9 : 1));
      K.out = off ? 'kmiss' : ok ? 'save' : 'conceded'; G.ev.push({ k: K.out, late: K.late, switched: K.switched, top: Math.abs(K.x) > 3 && K.y > 1.8 }); if (K.out === 'save' && !G.lesson) G.saves++;
      if (G.lesson) lessonSee(G, K.out === 'save'); } return; }
  if (G.ph === 'resK') { if (G.pt < 1.4) return; if (G.lesson) { startSave(G); return; }
    G.theirs.push(K.out === 'conceded' ? 1 : 0); if (!decide(G)) startShot(G); return; }
}
// the cue: his body turns to where he will shoot (a good kicker sometimes hides it)
function cueOf(G, K) { const R = G.rnd; if (lessonNow(G) || R() < G.cfg.relC) return K.zone; const o = [-1, 0, 1].filter(z => z !== K.zone); return o[(R() * o.length) | 0]; }
// is the tie decided? (five each, then sudden death in pairs)
function decide(G) {
  const a = sum(G.ours), b = sum(G.theirs), na = G.ours.length, nb = G.theirs.length;
  if (!G.sd) { if (a > b + (5 - nb)) return finish(G, true); if (b > a + (5 - na)) return finish(G, false); if (na === 5 && nb === 5) { G.sd = true; G.ev.push({ k: 'sd' }); } return false; }
  if (na === nb && a !== b) return finish(G, a > b); return false;
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; const pts = sum(G.ours.slice(0, 5)) + (Math.min(5, G.theirs.length) - sum(G.theirs.slice(0, 5))), stars = win ? (pts >= 8 ? 3 : pts >= 6 ? 2 : 1) : 0;
  G.res = { win, why, stars, a: sum(G.ours), b: sum(G.theirs), coins: G.goals + G.saves * 2 + G.top + (win ? 4 + Math.ceil(G.N / 3) : 0), time: G.t, saves: G.saves, goals: G.goals };
  G.ev.push({ k: win ? 'won' : 'lost', why }); return true;
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'shoot', kind: 'S', title: 'SHOOT', say: G => penCue(G)[0], do: G => penCue(G)[1], at: G => penCue(G)[2], how: 'Tap the spot in the goal you want to hit. Then tap again when the needle is in the GREEN. Score twice in a row.', need: 2 },
    { id: 'save', kind: 'K', title: 'SAVE', say: G => penCue(G)[0], do: G => penCue(G)[1], at: G => penCue(G)[2], how: 'Watch the kicker. When he plants his foot his body turns to where he will shoot: tap that side (the middle to stay). Not before, or he sees you go. Save two in a row.', need: 2 }],
  2: [{ id: 'read', kind: 'S', title: 'READ THE KEEPER', say: G => penCue(G)[0], do: G => penCue(G)[1], at: G => penCue(G)[2], how: 'The keeper leans to the side he is going to dive to. Shoot to the OTHER side. Score twice in a row.', need: 2 }],
  3: [{ id: 'stutter', kind: 'K', title: 'THE STUTTER', say: G => penCue(G)[0], do: G => penCue(G)[1], at: G => penCue(G)[2], how: 'This kicker stops in his run-up to fool you. Wait for him to plant his foot, then dive. Save two in a row.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonGo(G); }
function lessonGo(G) { if (lessonNow(G).kind === 'S') startShot(G); else startSave(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, good) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i];
  if (!good) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); return; }
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.ph = G.side === 'S' ? 'resS' : 'resK'; return; }
  G.ev.push({ k: 'lessonnext' }); G.lessonSwap = true;
}
// ---------- for the robots ----------
// BLIND: a thumb that taps somewhere on the screen. Aiming, only a tap on the goal (or just round it) counts; the needle stops at
// any tap; a dive goes to whichever third of the screen was tapped.
const BLIND = { t: G => { const R = Math.random; if (G.ph === 'aim') { if (R() < FGOAL) aimAt(G, (R() * 2 - 1) * (GW + 0.7), -0.4 + R() * (GH + 1.4)); } else if (G.ph === 'meter') shootNow(G); else dive(G, [-1, 0, 1][(R() * 3) | 0]); } };
// a player who looks: reads the keeper's lean and shoots the other way (not where he has been shooting); stops the needle in
// the green most of the time (acc); waits for the kicker to plant, reads his body and dives that way
// THE TUTORIAL SHOWS ONE TAP AT A TIME, WHERE AND WHEN (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens").
// It said TAP A SPOT, TAP IN GREEN (two taps) with a hand in a box. Now: the hand on the spot in the goal (the corner away from the keeper's lean),
// TAP NOW! as the needle comes into the green (a fifth of a second early), and as keeper WAIT FOR THE FOOT… then TAP THIS SIDE where he turns.
const PNC = { lit: -1e9 };
function penCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const S = G.S, now = G.t * 1000;
  if (G.ph === 'aim' && S) { const side = S.lean ? -S.lean : 1, x = side * 2.6, y = 0.6; let at = [W / 2 + side * W * 0.3, H * 0.3]; try { if (V3 && !V3.none) { const P0 = new THREE.Vector3(); V3.plane.coplanarPoint(P0); const v = W3.screen(new THREE.Vector3(x, y, P0.z)); at = [v.x, v.y]; } } catch (e) {}
    return [S.lean ? 'THE OTHER WAY: TAP HERE' : 'TAP THIS CORNER', 'tap', at]; }
  if (G.ph === 'meter' && S) { const f = S.m + S.dir * 0.22 / G.cfg.sweep; if (Math.abs(f - S.bc) < S.w * 0.35) PNC.lit = now; return now - PNC.lit < 220 && now >= PNC.lit ? ['TAP NOW!', 'tap', [W / 2, H * 0.62]] : ['WAIT FOR GREEN…', 'wait', false]; }
  if (G.ph === 'kickK' && G.K && G.K.dive == null) { const d = G.K.cue; return ['TAP ' + (d === 0 ? 'THE MIDDLE' : 'THIS SIDE'), 'tap', [d === 1 ? W / 6 : d === -1 ? W * 5 / 6 : W / 2, H * 0.55]]; }
  return [G.ph === 'run' ? 'WAIT FOR THE FOOT…' : 'WAIT…', 'wait', false]; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.lessonEnd || G.lessonSwap) return;
  if (G.ph === 'aim') { const S = G.S; if (mem.s !== S) { mem.s = S; mem.at = S.leanAt + 0.25 + react * (0.6 + R() * 0.6); } if (G.pt < mem.at) return;
    let side = S.lean ? -S.lean : (R() < 0.5 ? -1 : 1); const z = G.zones, n = z.length;
    if (n >= 2 && z[n - 1] === z[n - 2] && z[n - 1] === side) side = 0;      // he would expect that one: down the middle
    aimAt(G, side === 0 ? (R() - 0.5) * 0.4 : side * (2.5 + R() * 0.4), side === 0 ? 1.5 + R() * 0.4 : 0.35 + R() * 0.5); mem.tv = null; return; }
  if (G.ph === 'meter') { const S = G.S; if (mem.tv == null || mem.ms !== S) { mem.ms = S; const hit = R() < Math.pow(acc, (0.15 / S.w) * Math.sqrt(1.1 / G.cfg.sweep)), s2 = R() < 0.5 ? -1 : 1; mem.tv = hit ? S.bc + (R() - 0.5) * S.w * 0.6 : S.bc + s2 * (S.w / 2 + 0.01 + R() * 0.1); mem.at = 0.15 + react * 0.5; mem.pm = S.m; }
    if (G.pt < mem.at) { mem.pm = S.m; return; } const a = mem.pm, b = S.m; mem.pm = b; if ((a - mem.tv) * (b - mem.tv) <= 0 || Math.abs(b - mem.tv) < 0.004) shootNow(G); return; }
  if (G.ph === 'kickK') { const K = G.K; if (K.dive != null) return; if (mem.k !== K) { mem.k = K; mem.at = 0.08 + react * (0.45 + R() * 0.35); } if (G.pt < mem.at) return;
    let d = K.cue; if (R() > Math.pow(acc, 0.6 / K.T)) { const ot = [-1, 0, 1].filter(q => q !== d); d = ot[(R() * 2) | 0]; } dive(G, d); }
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; finish(G, true); }
