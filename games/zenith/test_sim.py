"""Fast-forward bot tests for Zenith, one mission type at a time.
python3 test_sim.py [levels] [n] [types] [assist]   e.g.  python3 test_sim.py 1,3,6,12,25,50 8 catch,zap"""
from playwright.sync_api import sync_playwright
import sys, os
BOTS = r"""
(cfg) => {
  const S = window.__sim, out = {}, { W, H, k } = S.size();
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const BOTS = {
    catch: {
      smart: (M, b) => { const rt = b.human ? 0.35 : 0.22, err = b.human ? 0.35 : 0.15;
        const fall = M.fallers.filter(p => p.state === 'fall').sort((a, c) => c.y - a.y)[0];
        if (fall) { if (b.seen !== fall) { b.seen = fall; b.at = M.t + rt; b.e = gauss() * M.r * err; } if (M.t >= b.at) { const tl = Math.max(0, (M.hy - fall.y) / Math.max(60, fall.vy + 200)); S.down(fall.x + fall.vx * tl + b.e, 0); } return; }
        const w = M.fallers.filter(p => p.state === 'wait').sort((a, c) => (M.warn - a.wt) - (M.warn - c.wt))[0]; if (w) S.down(w.x, 0); },
      lazy: (M) => S.down(W / 2, 0),
      jitter: (M, b) => { if (M.t > (b.n || 0)) { S.down(W * Math.random(), 0); b.n = M.t + 0.3; } }
    },
    zap: {
      smart: (M, b) => { const rt = b.human ? 0.3 : 0.15, err = b.human ? 10 : 4;
        if (M.over || M.heat > 0.9) { S.up(); return; }
        const t = M.targets.slice().sort((a, c) => c.y - a.y).find(t => !M.civs.some(c => Math.hypot(c.x - t.x, c.y - t.y) < 70 * k));
        if (!t) { S.up(); return; }
        if (b.tg !== t) { b.tg = t; b.at = M.t + rt; S.up(); }
        if (M.t >= b.at) { S.down(t.x + gauss() * err, t.y + gauss() * err); } },
      sweep: (M, b) => { b.x = (b.x || 0) + 1; const x = W * (0.5 + 0.45 * Math.sin(b.x / 12)); S.down(x, H * (0.35 + 0.15 * Math.sin(b.x / 31))); },
      chase: (M, b) => { const t = M.targets[0]; if (t) S.down(t.x, t.y); else S.down(W / 2, H / 2); }   // never lets go: overheats
    },
    fight: {
      smart: (M, b) => { const rt = b.human ? 0.4 : 0.25;
        if (M.busy > 0) return;
        const th = M.chars.filter(c => c.thug && c.state !== 'ko' && c.state !== 'rise').map(c => ({ c, left: c.state === 'wind' ? c.wind - c.st : c.state === 'idle' ? c.idle - c.st + c.wind : 9 }));
        th.sort((a, c) => a.left - c.left); const tgt = th.find(o => o.c.seenAt != null ? M.t - o.c.seenAt >= rt : (o.c.seenAt = M.t, false));
        for (const o of th) if (o.c.seenAt == null) o.c.seenAt = M.t;
        if (!tgt) return;
        let c = tgt.c; if (b.human && Math.random() < 0.06) { const any = M.chars.filter(x => x.state !== 'ko'); c = any[(Math.random() * any.length) | 0]; }
        const p = S.spot(c.spot), sc = c.big ? 1.3 : 1; S.down(p.x + gauss() * 6, p.y - 48 * k * sc + gauss() * 6); },
      spam: (M, b) => { if (M.t > (b.n || 0)) { const p = S.spot((Math.random() * 5) | 0); S.down(p.x, p.y - 48 * k); b.n = M.t + 0.12; } }
    },
    fire: {
      smart: (M, b) => { const sw = b.human ? 0.3 : 0.12;
        if (M.bOut || (b.rest && M.breath < 0.45)) { b.rest = true; S.up(); return; } b.rest = false;
        if (M.breath < 0.06) { b.rest = true; S.up(); return; }
        const w = M.win.filter(w => w.I > 0).sort((a, c) => c.I - a.I)[0];
        if (!w) { S.up(); return; }
        if (b.w !== w) { if (M.t < (b.sw || 0)) return; b.w = w; b.sw = M.t + sw; }
        S.down(w.x, w.y); },
      spam: (M, b) => { if (M.t > (b.n || 0)) { const w = M.win[(Math.random() * M.win.length) | 0]; S.down(w.x, w.y); b.n = M.t + 0.25; } }
    },
    lift: {
      smart: (M, b) => { const d = b.human ? 0.32 : 0.18; b.h = b.h || []; b.h.push([M.t, M.th, M.om]); while (b.h.length > 1 && b.h[1][0] <= M.t - d) b.h.shift();
        const [, th, om] = b.h[0], u = Math.max(-1, Math.min(1, 1.6 * th + 0.8 * om)); S.down(W / 2 + u * W * 0.4, H * 0.8); },
      lazy: (M) => S.down(W / 2, H * 0.8),
      jitter: (M, b) => { if (M.t > (b.n || 0)) { b.x = W * Math.random(); b.n = M.t + 0.25; } S.down(b.x || W / 2, H * 0.8); }
    },
    monster: {
      smart: (M, b) => { const rt = b.human ? 0.42 : 0.3;
        if (M.st === 'tele') { if (b.key !== M.cur) { b.key = M.cur; b.at = M.t + rt; b.miss = b.human && Math.random() < 0.08; } S.up();
          if (M.t >= b.at && !b.miss && M.danger.includes(M.lane)) { const safe = [0, 1, 2].filter(l => !M.danger.includes(l)).sort((a, c) => Math.abs(a - M.lane) - Math.abs(c - M.lane))[0]; S.flick(Math.sign(safe - M.lane)); }
          return; }
        if (M.st === 'open' && !M.over && M.heat < 0.92) { const c = S.core(); S.down(c.x + gauss() * 4, c.y + gauss() * 4); } else S.up(); },
      spam: (M, b) => { const c = S.core(); S.down(c.x, c.y); if (M.t > (b.n || 0)) { S.flick(Math.random() < 0.5 ? -1 : 1); b.n = M.t + 0.5; } }
    }
  };
  BOTS.villain = BOTS.monster;
  for (const type of cfg.types) {
    out[type] = {};
    for (const L of cfg.levels) {
      if ((type === 'monster' && L < 5) || (type === 'villain' && L < 10) || (type === 'lift' && L < 4) || (type === 'fire' && L < 3) || (type === 'fight' && L < 2)) continue;
      const row = {};
      for (const [name, fn] of Object.entries(BOTS[type])) {
        for (const human of name === 'smart' ? [false, true] : [false]) {
          let wins = 0;
          for (let n = 0; n < cfg.n; n++) {
            S.setStreak(L, cfg.assist ? 3 : 0); S.startType(L, type);
            const b = { human }; let steps = 0;
            while (!S.M.result && steps < 60 * 240) { fn(S.M, b); S.step(1 / 60); steps++; }
            if (S.M.result === 'win') wins++;
          }
          row[human ? 'human' : name] = wins + '/' + cfg.n;
        }
      }
      out[type]['L' + L] = row;
    }
  }
  return out;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index.html')); pg.wait_for_timeout(500)
    levels = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '1,3,6,12,25,50').split(',')]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 6
    types = (sys.argv[3] if len(sys.argv) > 3 else 'catch,zap,fight,fire,lift,monster,villain').split(',')
    res = pg.evaluate(BOTS, {'levels': levels, 'n': n, 'types': types, 'assist': len(sys.argv) > 4})
    for t, rows in res.items():
        print(t)
        for L, r in rows.items(): print('  ', L, r)
    print('errors', errs); b.close()
