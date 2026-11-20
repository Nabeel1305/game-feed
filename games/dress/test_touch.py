#!/usr/bin/env python3
"""Dress Designer with a real thumb: a tap on an option dresses the model in it; NEXT moves to the next part; for a finishing
touch, a tap picks the trim and a tap on a glowing ring on the dress puts it there; ASK HER tells you the hidden wish. Then the
rules, stepped exactly: a dress that meets every wish with nothing clashing sells; the thing she said NO to loses her; a clash
costs the style judge; a trim in the wrong place costs craft. The ⚙ Settings: Music, Sound effects and Vibration each switch
on their own and are remembered. No errors.
Run: python3 games/dress/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate; cdp = ctx.new_cdp_session(pg)
    def tap(x, y):
        cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 1}]}); cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); pg.wait_for_timeout(80)
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def btn(i):
        r = E(f"(() => {{ const b = __sim.panel()[{i}]; return [b.x + b.w / 2, b.y + b.h / 2]; }})()"); return r
    E("localStorage.setItem('dsg.taught', '3'); __sim.go(9)"); until("__sim.G && __sim.G.wait <= 0"); pg.wait_for_timeout(300)
    part = E("__sim.G.stages[__sim.G.si]"); n = E(f"__sim.PARTS['{part}'].opts.length"); j = (E(f"__sim.PARTS['{part}'].opts.findIndex(o => o.id === __sim.G.d['{part}'])") + 1) % n
    x, y = btn(j); tap(x, y); ok(E(f"__sim.G.d['{part}']") == E(f"__sim.PARTS['{part}'].opts[{j}].id"), f'a tap on an option dresses her in it ({part})')
    nx = E("(() => { const r = __sim.panel().next; return [r.x + r.w / 2, r.y + r.h / 2]; })()"); tap(*nx); ok(E("__sim.G.si") == 1, 'NEXT moves to the next part')
    if E("!!__sim.G.hiddenWish"):
        ak = E("(() => { const r = __sim.panel().ask; return [r.x + r.w / 2, r.y + r.h / 2]; })()"); tap(*ak); ok(E("__sim.G.asked") is True, 'ASK HER tells you the hidden wish')
    else: ok(False, 'level 9 has a hidden wish to ask about')
    # walk on to the finishing touch, pick one, tap the glowing ring at the waist
    E("(() => { const G = __sim.G; while (G.stages[G.si] !== 'trim') __sim.next(); })()"); pg.wait_for_timeout(200)
    bi = E("__sim.PARTS.trim.opts.findIndex(o => o.id === 'belt')"); x, y = btn(bi); tap(x, y); ok(E("__sim.G.pick") == 'belt', 'a tap picks the trim (a belt)')
    pg.wait_for_timeout(400); s = E("__sim.spotScreen('waist')"); tap(s['x'], s['y'])
    ok(E("JSON.stringify(__sim.G.trims)") == '[{"id":"belt","at":"waist"}]', 'a tap on the glowing ring at the waist puts the belt there', E("JSON.stringify(__sim.G.trims)"))
    # ---------- the rules, stepped exactly ----------
    run = """(how) => { const S = __sim; S.start(7, { seed: 21 }); const G = S.G; let n = 0;
      while (G.stage === 'design' && n++ < 50) { const p = G.stages[G.si], opts = S.PARTS[p].opts;
        const fits = j => !G.wish.includes(p) || (p === 'trim' ? G.ok.trim.includes(opts[j].id) : (G.ok[p] ? opts.map((o, i) => i).filter(i => { const id = opts[i].id; if (p !== 'colour') return G.ok[p].includes(id); return G.ok[p].some(w => w === id || (w.startsWith('fam:') && opts[i].fam === w.slice(4))); }).includes(j) : true));
        const no = j => G.no && G.no.p === p && G.no.id === opts[j].id;
        let pick = opts.map((o, j) => j).find(j => fits(j) && !no(j) && !S.clash(Object.assign({}, G.d, { [p]: opts[j].id })));
        if (pick == null) pick = opts.map((o, j) => j).find(j => fits(j) && !no(j));
        if (how === 'no' && G.no && G.no.p === p) pick = opts.findIndex(o => o.id === G.no.id);
        if (p === 'trim') { S.choose(pick); const t = opts[pick]; S.spot(how === 'misplace' ? ['neck', 'waist', 'hem'].find(w => !t.spots.includes(w)) : t.spots[0]); } else S.choose(pick);
        S.next(); }
      let m = 0; while (!G.over && m++ < 60 * 20) S.step(1 / 60); return [G.over, G.judges, G.notes]; }"""
    r = E(f"({run})('good')"); ok(r[0] == 'won' and min(r[1]) >= 4, 'every wish met, nothing clashing: SOLD', str(r))
    r = E(f"({run})('no')"); ok(r[0] == 'lost' and r[1][0] < 3 and 'NO' in r[2][0], 'the thing she said NO to loses her (the client judge says so)', str(r))
    r = E(f"({run})('misplace')"); ok(r[1][2] < 4 and any(' at the ' in q for q in r[2]), 'a trim in the wrong place costs the craft judge, and says so', str(r))
    r = E("(() => { const S = __sim, base = { cut: 'aline', len: 'knee', sleeve: 'straps', fabric: 'cotton', colour: S.PARTS.colour.opts[0].id, pattern: 'plain' }; return [S.clash(base), S.clash(Object.assign({}, base, { fabric: 'sequins', pattern: 'floral' }))]; })()")
    ok(r[0] is False and r[1] is True, 'sequins with a floral print clash; a plain cotton dress does not', str(r))
    # ---------- ⚙ Settings ----------
    E("__sim.live(); localStorage.setItem('dsg.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    ok(E("!document.getElementById('setBtn').classList.contains('hidden') || !!document.getElementById('setBtn').offsetParent"), 'the ⚙ Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); r = E("['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"); ok(r == [False, True, True], 'Music switches off on its own', str(r))
    E("document.getElementById('tVib').click()"); r = E("['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"); ok(r == [False, True, False], 'Vibration switches off on its own', str(r))
    E("document.getElementById('tSfx').click()"); r = E("['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"); ok(r == [False, False, False], 'Sound effects switch off on their own', str(r))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E("['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')") == [False, False, False], 'the settings are remembered')
    E("localStorage.setItem('dsg.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
