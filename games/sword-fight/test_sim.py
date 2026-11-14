"""Fast-forward bot tests for Steel & Honour.  python3 test_sim.py 1,5,12,25,60 8 [assist]"""
from playwright.sync_api import sync_playwright
import sys, os
BOTS = r"""
(cfg) => {
  const S = window.__sim, out = {};
  const perp = (x, y, dx, dy, len) => { const L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; return [x - nx * len, y - ny * len, x + nx * len, y + ny * len]; };
  for (const L of cfg.levels) {
    out[L] = {};
    for (const bot of cfg.bots) {
      let wins = 0;
      for (let n = 0; n < cfg.n; n++) {
        S.setStreak(L, cfg.assist ? 3 : 0); S.start(L);
        let handled = null, nextAct = 0, steps = 0;
        while (!S.G.over && steps < 60 * 900) {
          const G = S.G, K = S.K; steps++;
          if (G.phase !== 'fight') { S.step(1 / 60); continue; }
          const g = S.geo(), you = S.you();
          const A = G.atk, key = A ? A.wind.toFixed(4) + (A.sx || A.px) : null;
          if (bot === 'smart' || bot === 'human') {
            const rt = bot === 'smart' ? 0.25 : 0.33, aimErr = bot === 'smart' ? 0.25 : 0.6, hit = bot === 'smart' ? 0.95 : 0.85;
            if (G.os === 'windup' && A) {
              const when = Math.max(rt, A.wind - K.parryWin * 0.45);
              if (handled !== key && G.ot >= when) {
                handled = key;
                const tol = S.tol(), e1 = (Math.random() - 0.5) * tol * aimErr * 2, e2 = (Math.random() - 0.5) * tol * aimErr * 2;
                if (Math.random() < hit) {
                  if (A.kind === 'cut') { const qx = A.sx + (A.ex - A.sx) * 0.3 + e1, qy = A.sy + (A.ey - A.sy) * 0.3 + e2; S.stroke(...perp(qx, qy, A.ex - A.sx, A.ey - A.sy, 70)); }
                  else S.stroke(A.px - 70 + e1, A.py + e2, A.px + 70 + e1, A.py + e2);
                } else S.stroke(you.x, you.y - 120, you.x + 30, you.y + 60);
              }
            } else if ((G.os === 'stagger' || G.os === 'recover') && G.t > nextAct && G.psta > 15) {
              if (Math.random() < 0.5) S.poke(g.head.x + (Math.random() - 0.5) * 10, g.head.y); else S.stroke(g.body.x0 - 40, g.y + Math.random() * 30, g.body.x1 + 40, g.y + Math.random() * 30);
              nextAct = G.t + 0.3;
            } else if (G.os === 'guard' && G.t > nextAct && G.psta > 70 && Math.random() < 0.02) { S.poke(g.x + (Math.random() - 0.5) * 30, g.y + Math.random() * 30); nextAct = G.t + 0.7; }
          } else if (bot === 'spam') {            // the same slash across his chest, over and over
            if (G.t > nextAct) { S.stroke(g.body.x0 - 40, g.y, g.body.x1 + 40, g.y); nextAct = G.t + 0.28; }
          } else if (bot === 'poker') {           // jabs his head nonstop
            if (G.t > nextAct) { S.poke(g.head.x, g.head.y); nextAct = G.t + 0.2; }
          } else if (bot === 'center') {          // swipes through the middle every time he swings (tries to cheat the parry)
            if (G.os === 'windup' && A && handled !== key && G.ot > Math.max(0.25, A.wind - 0.15)) { handled = key; S.stroke(you.x - 80, you.y + 40, you.x + 80, you.y - 40); }
            else if (G.os !== 'windup' && G.t > nextAct) { S.stroke(g.body.x0 - 40, g.y, g.body.x1 + 40, g.y); nextAct = G.t + 0.45; }
          } else if (bot === 'panic') {           // random swipes whenever he swings
            if (G.os === 'windup' && A && handled !== key && G.ot > 0.25) { handled = key; const x = you.x + (Math.random() - 0.5) * 300, y = you.y + (Math.random() - 0.5) * 300, a = Math.random() * 6.28; S.stroke(x - Math.cos(a) * 80, y - Math.sin(a) * 80, x + Math.cos(a) * 80, y + Math.sin(a) * 80); }
            else if (G.os !== 'windup' && G.t > nextAct) { S.poke(g.x, g.y); nextAct = G.t + 0.4; }
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
    levels = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '1,5,12,25,60').split(',')]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    res = pg.evaluate(BOTS, {'levels': levels, 'bots': ['spam', 'poker', 'center', 'panic', 'human', 'smart'], 'n': n, 'assist': len(sys.argv) > 3})
    for L, v in res.items(): print('L' + L, v)
    print('errors', errs); b.close()
