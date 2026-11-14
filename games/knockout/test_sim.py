"""Fast-forward bot tests for Knockout.  python3 test_sim.py 1,2,5,15,40,80 6 [assist]"""
from playwright.sync_api import sync_playwright
import sys, os
BOTS = r"""
(cfg) => {
  const S = window.__sim, out = {};
  for (const L of cfg.levels) {
    out[L] = {};
    for (const bot of cfg.bots) {
      let wins = 0;
      for (let n = 0; n < cfg.n; n++) {
        S.setStreak(L, cfg.assist ? 3 : 0);         // 3 straight losses -> corner help
        S.start(L);
        if (cfg.assist && !S.opp.assist) return 'assist not applied';
        let next = 0, handled = null, steps = 0, side = 'L';
        while (!S.G.over && steps < 60 * 400) {
          const G = S.G; steps++;
          if (G.phase === 'break') { S.next(); continue; }
          if (G.phase !== 'fight') { S.step(1 / 60); continue; }
          const P = G.oPunch;
          if (bot === 'spam') {                        // tap tap tap at his head
            if (G.t > next) { S.punch(side, 'head'); side = side === 'L' ? 'R' : 'L'; next = G.t + 0.13; }
          } else if (bot === 'upper') {                // uppercut spam
            if (G.t > next) { S.punch('R', 'head', true); next = G.t + 0.2; }
          } else if (bot === 'turtle') {               // hold block, punch now and then
            S.block(true); if (G.t > next) { S.block(false); S.punch(side, 'head'); side = side === 'L' ? 'R' : 'L'; next = G.t + 0.6; }
          } else {                                     // smart / human: read the glove, dodge away, punish openings
            const rt = bot === 'smart' ? 0.25 : 0.34, ok = bot === 'smart' ? 0.93 : 0.82;
            if (G.os === 'windup' && P && !P.feint) {
              const key = P.wind + P.side + P.type;
              if (handled !== key && G.ot >= Math.max(rt, P.wind - 0.2) - 0.0001) {
                handled = key;
                if (Math.random() < ok) S.dodge(P.type === 'hook' ? (P.side === 'L' ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1));
              }
            } else if ((G.os === 'recover' || G.os === 'idle' || G.os === 'hurt') && G.t > next && G.sta > 35) {
              S.punch(side, Math.random() < 0.3 ? 'body' : 'head', G.os === 'recover' && Math.random() < 0.4); side = side === 'L' ? 'R' : 'L';
              next = G.t + (G.os === 'recover' ? 0.25 : 0.45 + Math.random() * 0.3);
            }
          }
          S.step(1 / 60);
        }
        if (S.G.over === 'won') wins++;
      }
      out[L][bot] = wins + '/' + cfg.n;
    }
  }
  return out;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')); pg.wait_for_timeout(500)
    levels = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '1,2,5,15,40,80').split(',')]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    res = pg.evaluate(BOTS, {'levels': levels, 'bots': ['spam', 'upper', 'turtle', 'human', 'smart'], 'n': n, 'assist': len(sys.argv) > 3})
    if isinstance(res, str): print(res)
    else:
        for L, v in res.items(): print('L' + L, v)
    print('errors', errs); b.close()
