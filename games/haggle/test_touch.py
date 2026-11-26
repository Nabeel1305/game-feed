#!/usr/bin/env python3
"""Haggle with real touches: dragging the brass dial sets the offer (left is less, right is more); OFFER makes it (they counter
or take it); the UV lamp and the loupe each look once; Pass sends them away and the next customer comes. The day's money: a purchase comes out of it, the dial catches on its mark, all of it
is taken if it is at least their lowest, more than he has is a red button and a walk-out, and the day closes when it is spent. No JavaScript errors.
Run: python3 games/haggle/test_touch.py"""
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
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('hg.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(1500)
    L = pg.evaluate("__sim.lay()"); cdp = ctx.new_cdp_session(pg)
    def touch(kind, x, y): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [] if kind == 'touchEnd' else [{'x': x, 'y': y, 'id': 1}]})
    D = L['dial']; y = D['y'] + D['h'] / 2
    touch('touchStart', D['x'] + 20, y); [touch('touchMove', D['x'] + 20 + i * 12, y) for i in range(1, 12)]; touch('touchEnd', 0, 0); a = pg.evaluate("__sim.dial")
    touch('touchStart', D['x'] + D['w'] * 0.8, y); touch('touchMove', D['x'] + D['w'] * 0.85, y); touch('touchEnd', 0, 0); b2 = pg.evaluate("__sim.dial")
    ok(0 < a < b2, 'the dial: further right is a bigger offer', str([a, b2]))
    pg.screenshot(path='/tmp/ht/shop.png')
    T = {t['id']: t for t in L['tools']}
    pg.touchscreen.tap(T['uv']['x'] + 30, T['uv']['y'] + 15); pg.wait_for_timeout(300); ok(pg.evaluate("__sim.G.visit && __sim.G.visit.seen.uv"), 'the UV lamp looks')
    pg.wait_for_timeout(400); pg.screenshot(path='/tmp/ht/uv.png')
    touch('touchStart', D['x'] + D['w'] * 0.3, y); touch('touchEnd', 0, 0); off = pg.evaluate("__sim.dial"); O = L['offer']
    v0 = pg.evaluate("[__sim.G.visit.id, __sim.G.visit.offers]"); pg.touchscreen.tap(O['x'] + O['w'] / 2, O['y'] + O['h'] / 2); pg.wait_for_timeout(300)
    v1 = pg.evaluate("__sim.G.visit ? [__sim.G.visit.id, __sim.G.visit.offers] : [-1, -1]"); ok(v1[0] != v0[0] or v1[1] == v0[1] + 1, 'OFFER makes the offer', str([v0, v1, off]))
    pg.wait_for_timeout(1600); vid = pg.evaluate("__sim.G.visit && __sim.G.visit.id"); pg.touchscreen.tap(T['pass']['x'] + 30, T['pass']['y'] + 15); pg.wait_for_timeout(1700)
    ok(pg.evaluate("__sim.G.visit && __sim.G.visit.id") != vid and pg.evaluate("__sim.G.passed") >= 1, 'Pass: they go, the next one comes')
    # ---- the day's money (26 Nov 2026): only so much to spend, and the profit it can make is what the day is judged on
    ready = "__sim.G && __sim.G.visit && __sim.G.wait <= 0 && !__sim.G.over"
    pg.evaluate("__sim.go(3)"); pg.wait_for_function(ready, timeout=8000)
    m = pg.evaluate("(() => { const G = __sim.G, good = G.queue.concat([G.visit]).filter(v => !v.fake && v.walk < v.V * G.cfg.sell); return { cash: G.cash, cash0: G.cash0, target: G.cfg.target, best: G.best, all: good.reduce((a, v) => a + v.walk, 0), n: good.length }; })()")
    ok(0 < m['cash0'] < 1e9 and m['cash'] == m['cash0'], 'the day opens with a sum of money', str(m))
    ok(m['n'] < 2 or m['cash0'] < m['all'], 'the money cannot buy everything worth buying', str(m)); ok(0 < m['target'] < m['best'], 'the target is less than the best the money could make', str(m))
    c1, c30 = pg.evaluate("[__sim.makeCfg(1, false), __sim.makeCfg(30, false)]"); ok(c1['purse'] > c30['purse'] and c1['keen'] < c30['keen'], 'higher levels: less money, and more of its best asked for', str([c1['purse'], c30['purse'], c1['keen'], c30['keen']]))
    L = pg.evaluate("__sim.lay()"); D = L['dial']; y = D['y'] + D['h'] / 2; O = L['offer']
    def mx(): return pg.evaluate("(() => { const v = __sim.G.visit; return Math.max(50, Math.ceil(v.ask * 1.3 / 50) * 50); })()")
    def setdial(amt): x = D['x'] + 10 + (D['w'] - 20) * amt / mx(); touch('touchStart', x, y); touch('touchEnd', 0, 0); return pg.evaluate("__sim.dial")
    # paying their price takes the money
    cur = pg.evaluate("__sim.G.visit.cur"); pg.evaluate("__sim.G.cash = Math.max(__sim.G.cash, __sim.G.visit.cur + 200)"); before = pg.evaluate("__sim.G.cash"); pg.evaluate(f"__sim.offer({cur})")
    ok(pg.evaluate("__sim.G.cash") == before - cur and pg.evaluate("__sim.G.bought.length") == 1, 'a purchase comes out of the money', str([before, cur, pg.evaluate("__sim.G.cash")]))
    # the dial catches on the post that marks his money; OFFER there is "all of it", and they take it if it is at least their lowest
    pg.wait_for_function(ready, timeout=8000); v = pg.evaluate("(() => { const v = __sim.G.visit; __sim.G.cash = v.walk + 5; return { walk: v.walk, cur: v.cur, id: v.id }; })()"); pg.wait_for_timeout(200)
    d = setdial(v['walk'] + 5 + mx() * 0.012); ok(d == v['walk'] + 5, 'the dial catches on the mark of his money', str([d, v])); pg.screenshot(path='/tmp/ht/allin.png')
    n0 = pg.evaluate("__sim.G.bought.length"); pg.touchscreen.tap(O['x'] + O['w'] / 2, O['y'] + O['h'] / 2); pg.wait_for_timeout(300)
    ok(pg.evaluate("__sim.G.bought.length") == n0 + 1 and pg.evaluate("__sim.G.cash") == 0, 'all of his money, at least their lowest: they take it', str([n0, pg.evaluate("__sim.G.cash")]))
    pg.wait_for_timeout(3500); ok(pg.evaluate("__sim.G.over || !!__sim.G.res"), 'nothing left to spend: the day closes early'); sheet = pg.evaluate("document.body.innerText"); ok('You had' in sheet and 'best that money could have made' in sheet, 'the end of the day says what he had and the best it could have made', sheet[-300:].replace('\n', ' | '))
    pg.screenshot(path='/tmp/ht/end.png')
    # more than he has: the button is red, and pressed it is a bluff they walk out on
    pg.evaluate("__sim.go(3)"); pg.wait_for_function(ready, timeout=8000); v = pg.evaluate("(() => { const v = __sim.G.visit; __sim.G.cash = Math.round(v.cur * 0.5 / 5) * 5; return { cur: v.cur, id: v.id, cash: __sim.G.cash }; })()"); pg.wait_for_timeout(200)
    d = setdial(v['cur']); ok(d > v['cash'], 'the dial still goes beyond his money', str([d, v])); pg.wait_for_timeout(150); pg.screenshot(path='/tmp/ht/over.png')
    px = pg.evaluate(f"(() => {{ const c = document.querySelector('canvas'), r = c.getBoundingClientRect(), k = c.width / r.width, d = c.getContext('2d').getImageData(Math.round(({O['x']} + 14) * k), Math.round(({O['y']} + 12) * k), 1, 1).data; return [d[0], d[1], d[2]]; }})()")
    ok(px[0] > 150 and px[1] < 110, 'beyond his money the OFFER button is red', str(px))
    w0 = pg.evaluate("__sim.G.walked"); pg.touchscreen.tap(O['x'] + O['w'] / 2, O['y'] + O['h'] / 2); pg.wait_for_timeout(300)
    ok(pg.evaluate("__sim.G.walked") == w0 + 1 and pg.evaluate("__sim.G.cash") == v['cash'] and pg.evaluate("__sim.G.bought.length") == 0, 'an offer of more than he has: no sale, they walk out', str([w0, pg.evaluate("__sim.G.walked")]))
    # all of it, but less than their lowest: they go elsewhere, and it is not a walk-out
    pg.wait_for_function(ready, timeout=8000); v = pg.evaluate("(() => { const v = __sim.G.visit; __sim.G.cash = Math.max(5, v.walk - 10); return { walk: v.walk, id: v.id, cash: __sim.G.cash, walked: __sim.G.walked, passed: __sim.G.passed }; })()")
    pg.evaluate(f"__sim.offer({v['cash']})"); r = pg.evaluate("[__sim.G.walked, __sim.G.passed, __sim.G.bought.length, __sim.G.cash]")
    ok(r[0] == v['walked'] and r[1] == v['passed'] + 1 and r[2] == 0 and r[3] == v['cash'], 'all of it but under their lowest: they go, with no walk-out', str([v, r]))
    # the lessons have no purse: nothing about money while he is being taught
    pg.evaluate("localStorage.setItem('hg.taught', '0'); __sim.go(1);"); pg.wait_for_timeout(1200); ok(pg.evaluate("!!__sim.G.lesson && !isFinite(__sim.G.cash)"), 'the lessons are taught without the purse')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
