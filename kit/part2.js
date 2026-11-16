
// ===================== RULES: rewrite this part for each game =====================
// The example game, so the kit runs and passes every check from the first minute: "a ring closes on a target; tap the target
// while the ring is gold". Replace it, but keep the shape: makeCfg, newGame, step, the player's actions, finish, the lessons,
// the blind moves and the honest player at the bottom. Everything in part5 (menus, levels, pause, feed, robots) works off these.

const RULES = [      // the "How to play" card: one line each, plain words
  '<b>Tap the target when its ring turns gold.</b> The ring closes in; it is gold only for a moment.',
  '<b>Too soon breaks it.</b> A tap before the gold, or on nothing, costs you a life.',
  '<b>Too late loses it.</b> Let a ring close past the target and it costs a life.',
  'Hit enough rings to pass the level. Lose no lives for three stars.',
];
function makeCfg(N, help) {      // every number that changes with the level, in one place (help after three losses only gives time)
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0;
  return { N, f, e, boss, help: !!help,
    close: (2.3 - 1.4 * (1 - Math.exp(-f / 25))) * (1 + 0.45 * e) * (help ? 1.25 : 1),      // seconds for a ring to close on its target
    gold: (0.07 + 0.11 * Math.exp(-f / 30) + 0.12 * e) * (help ? 1.3 : 1),                 // how much of that time it is gold
    gap: (0.95 - 0.45 * (1 - Math.exp(-f / 30))) * (1 + 0.4 * e),                           // pause between rings
    two: N >= 4 ? Math.min(0.7, 0.08 + f * 0.012) : 0,                                     // chance of two rings at once
    goal: Math.round(8 + Math.min(14, f * 0.35)) + (boss ? 4 : 0),                          // rings to hit to pass
    lives: 3 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, rings: [], next: 0.7, hits: 0, lives: cfg.lives, lost: 0, combo: 0, bestCombo: 0,
    wasted: 0, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
function spawn(G, slow) {
  const R = G.rnd, c = G.cfg; let x, y, n = 0;
  do { x = 0.2 + 0.6 * R(); y = 0.3 + 0.42 * R(); n++; } while (n < 12 && G.rings.some(g => Math.hypot(g.x - x, (g.y - y) * 1.6) < 0.3));
  G.rings.push({ x, y, t: 0, dur: c.close * (0.85 + 0.3 * R()) * (slow || 1), gold: c.gold, done: false });
}
const goldNow = g => { const u = g.t / g.dur; return u >= 1 - g.gold && u <= 1.05; };      // the gold moment (a little grace past the target)
function step(G, dt) {
  if (G.over) return; G.t += dt; G.wasted = Math.max(0, G.wasted - dt / 5);
  G.next -= dt;
  if (G.next <= 0 && (!G.lesson || G.rings.length === 0)) {
    const L = G.lesson && lessonNow(G); spawn(G, L ? 1.6 : 1); if (L && L.two || !G.lesson && G.rnd() < G.cfg.two) spawn(G, L ? 1.6 : 1);
    G.next = G.cfg.gap * (0.8 + 0.4 * G.rnd()) + (G.lesson ? 0.8 : 0);
  }
  for (const g of G.rings) { g.t += dt; if (!g.done && g.t > g.dur * 1.05) { g.done = true; fault(G, 'late', g.x, g.y); } }
  G.rings = G.rings.filter(g => !g.done);
  if (!G.lesson && G.hits >= G.cfg.goal) finish(G, true);
  else if (G.lives <= 0) finish(G, false);
}
// The player's one action. x, y are fractions of the play area (0..1).
function tap(G, x, y) {
  if (G.over) return; let best = null, bd = 0.11;
  for (const g of G.rings) { const d = Math.hypot(g.x - x, (g.y - y) * 1.6); if (d < bd) { bd = d; best = g; } }
  if (!best) { G.wasted++; G.ev.push({ k: 'empty', x, y }); if (G.wasted >= 2) { G.wasted = 0; fault(G, 'empty', x, y); } return; }      // a tap on nothing: twice in quick succession costs a life
  best.done = true; G.rings = G.rings.filter(g => g !== best);
  if (goldNow(best)) { G.hits++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.ev.push({ k: 'hit', x: best.x, y: best.y, combo: G.combo }); lessonSee(G, 'hit'); }
  else fault(G, 'soon', best.x, best.y);
}
function fault(G, why, x, y) {      // a mistake: in a lesson it costs nothing and says how; otherwise a life
  G.combo = 0; G.ev.push({ k: 'fault', why, x, y });
  if (G.lesson) { lessonMiss(G, why); return; }
  G.lives--; G.lost++;
}
function finish(G, win) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  G.res = { win, stars: win ? (G.lost === 0 ? 3 : G.lost === 1 ? 2 : 1) : 0, hits: G.hits, goal: c.goal, combo: G.bestCombo, lost: G.lost, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost' });
}

// ---------- LESSONS (LESSONS.md rule: the first three levels teach every move, and you do not go on until you can do each one) ----------
// Each lesson: a title, how to do it in one line, how many times (need), and which events count (ok). While a lesson is on
// nothing is lost: a mistake says TRY AGAIN and shows how. Passed lessons are saved, so a retry goes straight to play.
// The game tells the lessons what happened with lessonSee(G, 'what') and lessonMiss(G, why).
const LESSONS = {
  1: [{ id: 'gold', title: 'TAP ON GOLD', how: 'A ring closes on the target. Tap the target the moment the ring turns gold.', need: 3, ok: w => w === 'hit' },
      { id: 'wait', title: 'NOT TOO SOON', how: 'A tap before the gold breaks the ring. Watch it, wait for gold, then tap.', need: 2, ok: w => w === 'hit' }],
  2: [{ id: 'two', two: true, title: 'TWO AT ONCE', how: 'Two rings, two targets. Tap each one as its own ring turns gold.', need: 4, ok: w => w === 'hit' }],
  3: [{ id: 'all', two: true, title: 'PUT IT TOGETHER', how: 'Anything can come now. Tap each target on its gold.', need: 6, ok: w => w === 'hit' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.rings.length = 0; G.next = 1.2; G.ev.push({ k: 'lessondone', N: G.N }); }
  else G.ev.push({ k: 'lessonnext' });
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots (bots.js, test_play.py): the game's own blind moves and its honest player ----------
// BLIND: each letter is one thing a thumb can do without looking. The search plays every short string of them on every beat,
// and none may win (spamming cannot win, LESSONS rule 1). Include every kind of input the game has.
const BLIND = {
  T: G => { const g = G.rings[G.rings.length - 1]; if (g) tap(G, g.x, g.y); },      // tap the newest target (a thumb that knows where, but not when)
  O: G => { const g = G.rings[0]; if (g) tap(G, g.x, g.y); },                        // tap the oldest target
  C: G => tap(G, 0.5, 0.5),                                                          // tap the middle of the screen
  R: G => tap(G, 0.2 + 0.6 * Math.random(), 0.3 + 0.42 * Math.random()),             // tap anywhere
};
// HONEST: a person who looks. react = seconds to see and act; acc = how often a tap lands when meant. Return nothing; just act.
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  for (const g of G.rings) {
    if (!goldNow(g)) { g.seen = null; continue; }
    if (g.seen == null) g.seen = G.t;
    if (G.t - g.seen >= Math.min(react, g.dur * g.gold * 0.9)) { if (Math.random() < acc) tap(G, g.x, g.y); else tap(G, g.x + 0.2, g.y); return; }
  }
}
// The shortest way to a real win, for tools/test_controls.py: one ring short of the goal, a ring at its gold, and a tap on it.
function winNow(G) { if (!G || G.over || G.lesson) return; G.hits = G.cfg.goal - 1; spawn(G); const g = G.rings[G.rings.length - 1]; g.t = g.dur * (1 - g.gold * 0.5); tap(G, g.x, g.y); }
