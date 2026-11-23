// Robot players for the starter kit's games (kit/README.md). They drive window.__sim, fast-forward, with seeded luck, and use
// only what the game itself declares in part2: BLIND (moves a thumb can make without looking) and honest() (a person who looks).
// Nothing here needs changing for a new game; test_play.py calls these.
(() => {
const S = window.__sim, DT = 1 / 60, LIMIT = 60 * 900;      // a shift is three to seven minutes now
function seeded(seed) { let a = (seed * 7919 + 13) >>> 0; Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const done = G => ({ won: G.over === 'won', t: Math.round(G.t), over: G.over, stuck: !G.over });
// a person who looks: react seconds, acc chance a tap lands
function runHonest(N, seed, o = {}) { seeded(seed); S.start(N, { seed, teach: !!o.teach, taught: o.taught | 0 }); const G = S.G, mem = {}; let n = 0, took = null;
  while (!G.over && n++ < LIMIT) { S.honest(G, o, mem); S.step(DT); if (o.teach && took == null && !G.lesson) took = G.t; }
  return Object.assign(done(G), { lessons: took }); }
// a string of blind moves, one every P seconds (a tenth either way, as a thumb is), for ever
function blindBeat(N, seed, pat, P) { seeded(seed); S.start(N, { seed }); const G = S.G; let n = 0, i = 0, next = Math.random() * P;
  while (!G.over && n++ < LIMIT) { next -= DT; if (next <= 0) { const m = pat[i++ % pat.length]; if (m !== '.') S.BLIND[m](G); next = P * (0.9 + 0.2 * Math.random()); } S.step(DT); }
  return done(G); }
// no beat at all: blind moves drawn at random, at random gaps
function blindRandom(N, seed, mean) { seeded(seed); S.start(N, { seed }); const G = S.G, keys = Object.keys(S.BLIND); let n = 0, next = 0;
  while (!G.over && n++ < LIMIT) { next -= DT; if (next <= 0) { S.BLIND[keys[(Math.random() * keys.length) | 0]](G); next = -Math.log(1 - Math.random() * 0.999) * mean; } S.step(DT); }
  return done(G); }
function blindBeats(spec) { const out = [];
  for (const pat of spec.pats) for (const P of spec.Ps) { const row = { pat, P, w: 0, n: 0 };
    for (const N of spec.levels) for (let s = 0; s < spec.n; s++) { row.n++; if (blindBeat(N, spec.seed + s * 17 + N, pat, P).won) row.w++; }
    out.push(row); }
  return out; }
window.__B = { runHonest, blindBeat, blindRandom, blindBeats };
})();
