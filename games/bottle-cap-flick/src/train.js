// Self-play harness: node train.js <cmd> ...
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/engine.js', 'utf8');
const E = new Function(src + '\nreturn {step,resolve,countT,shuffled,plan,LEVELS,WEIGHTS,other};')();

function playGame(pO, pR, maxTurns = 160) {
  // pO/pR: {L, W}
  let cs = E.shuffled('O').concat(E.shuffled('R'));
  let turn = Math.random() < 0.5 ? 'O' : 'R';
  for (let t = 0; t < maxTurns; t++) {
    const p = turn === 'O' ? pO : pR;
    const sh = E.plan(cs, turn, p.L, p.W, Math.random);
    if (!sh) break;
    cs[sh.idx].vx = sh.vx; cs[sh.idx].vy = sh.vy;
    let n = 0; while (E.step(cs, null) && n < 4000) n++;
    E.resolve(cs, null);
    const o = E.countT('O', cs), r = E.countT('R', cs);
    if (o === 0 || r === 0) return { w: o === 0 && r === 0 ? 'D' : (o === 0 ? 'R' : 'O'), turns: t + 1 };
    turn = E.other(turn);
  }
  const o = E.countT('O', cs), r = E.countT('R', cs);
  return { w: o > r ? 'O' : r > o ? 'R' : 'D', turns: maxTurns, timeout: true };
}
// A plays B for `games` games, swapping colours each game. Returns A's score (win=1, draw=.5).
function match(A, B, games) {
  let sa = 0, turns = 0, to = 0;
  for (let g = 0; g < games; g++) {
    const aIsO = g % 2 === 0;
    const res = aIsO ? playGame(A, B) : playGame(B, A);
    turns += res.turns; if (res.timeout) to++;
    if (res.w === 'D') sa += 0.5;
    else if ((res.w === 'O') === aIsO) sa += 1;
  }
  return { score: sa / games, avgTurns: turns / games, timeouts: to };
}
module.exports = { E, playGame, match };

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'speed') {
    for (const k of Object.keys(E.LEVELS)) {
      const cs = E.shuffled('O').concat(E.shuffled('R'));
      const t0 = Date.now(); E.plan(cs, 'R', E.LEVELS[k], E.WEIGHTS, Math.random);
      console.log(k, Date.now() - t0, 'ms');
    }
  } else if (cmd === 'ladder') {
    const games = +process.argv[3] || 10;
    const ks = Object.keys(E.LEVELS);
    for (let i = 0; i + 1 < ks.length; i++) {
      const t0 = Date.now();
      const r = match({ L: E.LEVELS[ks[i + 1]], W: E.WEIGHTS }, { L: E.LEVELS[ks[i]], W: E.WEIGHTS }, games);
      console.log(`${ks[i + 1]} vs ${ks[i]}: ${(r.score * 100).toFixed(0)}%  avgTurns ${r.avgTurns.toFixed(1)} timeouts ${r.timeouts}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
}

if (require.main === module && process.argv[2] === 'tune') {
  const iters = +process.argv[3] || 10, games = +process.argv[4] || 24;
  const L = Object.assign({}, E.LEVELS.professional, { n: 150 });
  let best = Object.assign({}, E.WEIGHTS);
  const keys = Object.keys(best);
  for (let it = 0; it < iters; it++) {
    const cand = Object.assign({}, best);
    const k1 = keys[(Math.random() * keys.length) | 0], k2 = keys[(Math.random() * keys.length) | 0];
    for (const k of new Set([k1, k2])) cand[k] = Math.max(0, +(cand[k] * (0.5 + Math.random()) + (Math.random() - 0.5) * 2).toFixed(2));
    const r = match({ L, W: cand }, { L, W: best }, games);
    const acc = r.score >= 0.6;
    console.log(it, JSON.stringify(cand), (r.score * 100).toFixed(0) + '%', 'turns', r.avgTurns.toFixed(0), acc ? 'ACCEPT' : '');
    if (acc) best = cand;
  }
  console.log('BEST', JSON.stringify(best));
}
