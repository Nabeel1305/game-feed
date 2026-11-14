from playwright.sync_api import sync_playwright
import sys, json
BOTS = r"""
(cfg) => {
  const S = window.__sim, out = {};
  for (const L of cfg.levels) {
    out[L] = {};
    for (const bot of cfg.bots) {
      let wins = 0, perf = 0;
      for (let n = 0; n < cfg.n; n++) {
        S.start(L);
        let parried = null, nextAct = 0, dirFlip = 0, reactAt = null, steps = 0;
        while (!S.G.over && steps < 60 * 600) {
          const G = S.G, K = S.K; steps++;
          if (G.phase === 'end') { S.step(1/60); continue; }
          if (G.phase === 'intro') { S.step(1/60); continue; }
          if (bot === 'smart' || bot === 'human') {
            const rt = bot === 'smart' ? 0.25 : 0.32, err = bot === 'smart' ? 0.04 : 0.1;
            if (G.os === 'windup' && G.atk) {
              const key = G.atk.wind.toFixed(4) + G.atk.type;
              const parryAt = Math.max(rt, G.atk.wind - K.parryWin * 0.45) + (Math.random() - 0.5) * err;
              if (parried !== key && G.ot >= parryAt) {
                parried = key;
                const need = {L:'L',R:'R',O:'U',T:'TAP'}[G.atk.type];
                if (G.atk.feint && !G.atk.switched) { /* reads the fake */ }
                if (Math.random() < (bot === 'smart' ? 0.95 : 0.85)) { if (need === 'TAP') S.act('tap'); else S.act('swipe', need); }
                else S.act('swipe', 'D');
              }
            } else if ((G.os === 'stagger' || G.os === 'recover') && G.t > nextAct && G.psta > 15) { S.act('swipe', (dirFlip++ % 2) ? 'L' : 'R'); nextAct = G.t + 0.3; }
            else if (G.os === 'guard' && G.t > nextAct && G.psta > 70 && Math.random() < 0.02) { S.act(Math.random() < 0.5 ? 'tap' : 'swipe', Math.random() < 0.5 ? 'L' : 'R'); nextAct = G.t + 0.6; }
          } else if (bot === 'spam') {
            if (G.t > nextAct) { S.act('swipe', 'L'); nextAct = G.t + 0.28; }
          } else if (bot === 'mash') {
            if (G.t > nextAct) { const r = Math.random(); if (r < 0.3) S.act('tap'); else S.act('swipe', r < 0.65 ? 'L' : 'R'); nextAct = G.t + 0.22; }
          } else if (bot === 'panic') {   // swings in a random direction whenever he winds up, and slashes otherwise
            if (G.os === 'windup' && G.atk && parried !== G.atk.wind) { parried = G.atk.wind; const ds = ['L','R','U','TAP']; const d = ds[(Math.random()*4)|0]; if (d==='TAP') S.act('tap'); else S.act('swipe', d); }
            else if (G.t > nextAct && G.os !== 'windup') { S.act('swipe', Math.random()<0.5?'L':'R'); nextAct = G.t + 0.4; }
          }
          S.step(1/60);
        }
        if (S.G.over === 'won') wins++;
        perf += S.G.perfects;
      }
      out[L][bot] = wins + '/' + cfg.n;
    }
  }
  return out;
}
"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file://' + __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'index.html') + ''); pg.wait_for_timeout(500)
    levels=[int(x) for x in sys.argv[1].split(',')]; n=int(sys.argv[2]) if len(sys.argv)>2 else 6
    res=pg.evaluate(BOTS, {'levels':levels,'bots':['spam','mash','panic','human','smart'],'n':n})
    for L,v in res.items(): print('L'+L, v)
    print('errors', errs); b.close()
