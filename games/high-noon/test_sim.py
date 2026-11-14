"""Fast-forward bot tests for High Noon.  python3 test_sim.py 1,3,6,14,30,70 8 [assist]"""
from playwright.sync_api import sync_playwright
import sys, os
BOTS = r"""
(cfg) => {
  const S = window.__sim, out = {};
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  for (const L of cfg.levels) {
    out[L] = {};
    for (const bot of cfg.bots) {
      let wins = 0;
      for (let n = 0; n < cfg.n; n++) {
        S.setStreak(L, cfg.assist ? 3 : 0); S.start(L);
        let steps = 0, jumpAt = 0, nextShot = 0;
        while (!S.G.over && steps < 60 * 300) {
          const G = S.G; steps++;
          if (G.phase === 'ready') { S.hold(); jumpAt = 0.6 + Math.random() * 3; }
          else if (G.phase === 'count') { if (bot === 'jumpy' && G.callT > jumpAt) S.move(); }
          else if (G.phase === 'draw' && !G.oDown) {
            const since = G.t - G.drawAt, g = S.geo();
            const rt = bot === 'smart' ? 0.25 : bot === 'human' ? 0.33 : 0.22;
            if (since >= rt && G.t >= nextShot && G.cock <= 0 && G.ammo > 0) {
              if (bot === 'body' || bot === 'jumpy') S.shoot(g.x + gauss() * 4, (g.body.y0 + g.body.y1) / 2 + gauss() * 6);
              else { const e = bot === 'smart' ? 0.55 : 0.95; S.shoot(g.head.x + gauss() * g.head.r * e, g.head.y + gauss() * g.head.r * e); }
              nextShot = G.t + (bot === 'body' ? 0.34 : bot === 'smart' ? 0.4 : 0.5);
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
    levels = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '1,3,6,14,30,70').split(',')]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    res = pg.evaluate(BOTS, {'levels': levels, 'bots': ['jumpy', 'body', 'human', 'smart'], 'n': n, 'assist': len(sys.argv) > 3})
    for L, v in res.items(): print('L' + L, v)
    print('errors', errs); b.close()
