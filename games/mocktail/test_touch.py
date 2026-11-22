#!/usr/bin/env python3
"""Mocktail Bar with real touches (easy controls, 22 Nov 2026): tabs switch the tray; a tap on a glass takes it; HOLDING a
bottle pours it for as long as the thumb stays (letting go stops it); ICE CUBES and CRUSHED ICE fill and empty the glass; a
tap on a garnish puts it on the rim; HOLDING STIR stirs; SHAKER takes the shaker, a pour goes into it, HOLDING the same button
shakes it and a tap pours it out; fresh mint tapped and MUDDLE three times crushes it; SERVE hands it over. Then the rules: the recipe made right is liked; too much or too little of something is sent back with
the reason; a wrong glass is only a small note; a layered drink must not be stirred; a feeling order is answered by ASK, and
any drink that fits it is liked; the 📖 recipe shows the card later on. Pause stops a pour. The Settings switch Music, Sound
effects and Vibration on their own and remember them. No errors.
Run: python3 games/mocktail/test_touch.py"""
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
    E = pg.evaluate; E("Object.assign(window, __sim.x())"); cdp = ctx.new_cdp_session(pg)
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    def tap(x, y, i=5): touch('touchStart', [(i, (x, y))]); touch('touchEnd', [(i, (x, y))]); pg.wait_for_timeout(60)
    def mid(r): return (r['x'] + r['w'] / 2, r['y'] + r['h'] / 2)
    def until(js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def order(did):      # give the customer a known order and a clean counter
        E(f"(() => {{ const G = __sim.G; G.wait = 0; G.next = null; Object.assign(G.order, {{ drink: DRINKS.find(d => d.id === '{did}'), feel: null, tries: 0 }}); G.drink = newDrink(); }})()")
    def tabTo(t): tap(*mid(next(q for q in E("__sim.layout().tabs") if q['id'] == t)))
    def item(i): return mid(next(q for q in E("__sim.layout().items") if q['id'] == i))
    def tool(i): return mid(next(q for q in E("__sim.layout().tools") if q['id'] == i))
    E("localStorage.setItem('mok.taught', '3'); __sim.go(5)"); until("__sim.G && __sim.G.order && __sim.G.wait <= 0"); order('breeze')
    tabTo('glass'); ok(E("__sim.ui.tab") == 'glass', 'a tab switches the tray'); tap(*item('rocks')); ok(E("__sim.G.drink.glass") == 'rocks', 'a tap on a glass takes it')
    tabTo('bottles'); P = item('cranberry'); touch('touchStart', [(2, P)]); pg.wait_for_timeout(120); ok(E("__sim.G.drink.pouring") == 'cranberry', 'holding a bottle pours it')
    pg.wait_for_timeout(900); touch('touchEnd', [(2, P)]); pg.wait_for_timeout(60); n1 = E("(__sim.G.drink.parts[0] || {n: 0}).n")
    ok(E("__sim.G.drink.pouring") is None and 0.6 < n1 < 3, 'letting go stops it, with as much as was held', str(n1)); pg.wait_for_timeout(300); ok(E("__sim.G.drink.parts[0].n") == n1, 'and nothing more comes out')
    tabTo('extras'); tap(*item('cubes')); ok(E("__sim.G.drink.ice") == 'cubes', 'ICE CUBES fills the glass with cubes'); tap(*item('crushed')); ok(E("__sim.G.drink.ice") == 'crushed', 'CRUSHED ICE swaps them for crushed ice'); tap(*item('crushed')); ok(E("__sim.G.drink.ice") == 'none', 'a second tap takes the ice out')
    tabTo('glass'); tap(*item('cherry')); ok(E("__sim.G.drink.garn") == 'cherry', 'a tap on the cherry puts it on the glass')
    tap(*item('lime')); ok(E("__sim.G.drink.garn") == 'lime', 'a tap on another garnish swaps it')
    S = tool('stir'); touch('touchStart', [(4, S)]); pg.wait_for_timeout(400); mid_s = E("__sim.G.drink.stirred"); ok(0 < mid_s, 'holding STIR stirs', str(mid_s))
    until("__sim.G.drink.stirDone", 6000); touch('touchEnd', [(4, S)]); ok(E("__sim.G.drink.stirred") >= 2.5 and E("__sim.G.drink.mixedAfter") is True, 'held long enough, the drink is stirred', str(E("__sim.G.drink.stirred")))
    s1 = E("__sim.G.drink.stirred"); pg.wait_for_timeout(300); ok(E("__sim.G.drink.stirred") == s1, 'letting go of STIR stops the spoon')
    # the shaker
    order('pinesour'); E("__sim.G.drink.glass = 'coupe'"); tap(*tool('shaker')); ok(E("__sim.G.drink.vessel") == 'shaker', 'SHAKER takes the shaker')
    tabTo('bottles'); P = item('lemon'); touch('touchStart', [(2, P)]); pg.wait_for_timeout(700); touch('touchEnd', [(2, P)]); pg.wait_for_timeout(60)
    ok(E("__sim.G.drink.shaker.length") == 1 and not E("__sim.G.drink.parts.length"), 'a pour goes into the shaker, not the glass')
    S = tool('shaker'); touch('touchStart', [(6, S)]); pg.wait_for_timeout(350); ok(0 < E("__sim.G.drink.shakes") < 6, 'holding the shaker button shakes it', str(E("__sim.G.drink.shakes")))
    until("__sim.G.drink.shakes >= 6", 6000); touch('touchEnd', [(6, S)]); ok(E("__sim.G.drink.shakes") >= 6 and E("__sim.G.drink.vessel") == 'shaker', 'six shakes and it is ready (still in the shaker)', str(E("__sim.G.drink.shakes")))
    tap(*tool('shaker')); ok(E("[__sim.G.drink.vessel, __sim.G.drink.parts.length, !!__sim.G.drink.shook]") == ['glass', 1, True], 'a tap then pours it, shaken, into the glass', str(E("[__sim.G.drink.vessel, __sim.G.drink.parts.length, __sim.G.drink.shook]")))
    # muddling
    order('nojito'); E("__sim.G.drink.glass = 'highball'"); tabTo('extras'); tap(*item('mint')); ok(E("__sim.G.drink.fresh") == ['mint'], 'fresh mint goes into the glass')
    for i in range(3): tap(*tool('muddle'))
    ok(E("__sim.G.drink.muddled") == 3, 'MUDDLE three times crushes it')
    # serving: the recipe made right is liked; SERVE by touch
    def make(did, change=''):
        E(f"""(() => {{ const G = __sim.G, d = DRINKS.find(q => q.id === '{did}'), D = newDrink(); D.glass = d.glass; D.ice = d.ice; D.fresh = (d.fresh || []).slice(); D.muddled = D.fresh.length ? 3 : 0; for (const id in d.ing) addPart(D.parts, id, d.ing[id]); if (d.how === 'shake') {{ D.shook = true; D.shakes = 6; }} if (d.how === 'stir') {{ D.stirred = 3; D.mixedAfter = true; D.stirDone = true; }} if (d.how === 'layer') {{ D.lastPour = Object.keys(d.ing).find(i => ING[i].heavy); D.layered = true; }} D.garn = d.garn; G.drink = D; {change} }})()""")
    def serveTouch(): E("__sim.G.ev.length = 0; window.__v = null; (() => { const G = __sim.G, push = G.ev.push.bind(G.ev); G.ev.push = e => { if (e.k === 'verdict') window.__v = e; return push(e); }; })()"); tap(*mid(E("__sim.layout().serve"))); return E("window.__v && { like: window.__v.like, why: window.__v.why, minor: window.__v.minor }")
    order('breeze'); make('breeze'); v = serveTouch(); ok(v and v['like'] is True, 'SERVE hands it over, and the recipe made right is liked', str(v))
    until("__sim.G.wait <= 0", 5000); order('breeze'); make('breeze', "G.drink.parts.find(p => p.id === 'cranberry').n = 4;"); v = serveTouch(); ok(v and v['like'] is False and any('much' in w.lower() for w in v['why']), 'too much of something is sent back, and it says so', str(v))
    until("__sim.G.wait <= 0", 5000); order('breeze'); make('breeze', "G.drink.parts.find(p => p.id === 'apple').n = 0.6;"); v = serveTouch(); ok(v and v['like'] is False and any('enough' in w.lower() for w in v['why']), 'too little is sent back too', str(v))
    until("__sim.G.wait <= 0", 5000); order('breeze'); make('breeze', "G.drink.glass = 'highball';"); v = serveTouch(); ok(v and v['like'] is True and v['minor'], 'a wrong glass is only a small note', str(v))
    lay = E("DRINKS.find(d => d.how === 'layer').id"); until("__sim.G.wait <= 0", 5000); order(lay); make(lay, "G.drink.stirred = 3; G.drink.mixedAfter = true;"); v = serveTouch(); ok(v and v['like'] is False, 'a layered drink must not be stirred', str(v))
    # a feeling: ASK, and a drink that fits is liked
    r = E("""(() => { const S = __sim; S.start(12, { seed: 3 }); const G = S.G; for (let i = 0; i < 400 && !(G.order && G.order.feel); i++) { G.served = 0; G.next = null; G.wait = 0; nextOrder(G); } return !!(G.order && G.order.feel); })()""")
    if r:
        E("__sim.live(); __sim.G.wait = 0"); a = E("__sim.layout().ask"); tap(a['x'] + a['w'] / 2, a['y'] + 24 * E("k") + a['h'] / 2)
        ok(E("__sim.G.order.asked") is True and E("!!__sim.ui.bubble"), 'ASK gets an answer from a customer who wants a feeling')
        v = E("(() => { const G = __sim.G, R = planFor(G, G.order, 1), D = newDrink(); D.glass = R.glass; D.ice = R.ice; D.fresh = (R.fresh || []).slice(); D.muddled = 3; for (const id in R.ing) addPart(D.parts, id, R.ing[id]); if (R.how === 'shake') { D.shook = true; D.shakes = 6; } if (R.how === 'stir') { D.stirred = 3; D.mixedAfter = true; } D.garn = R.garn; G.drink = D; return judge(G); })()")
        ok(v['like'] is True, 'any drink that fits the feeling is liked', str(v))
    else: ok(False, 'a feeling order turns up at level 12')
    E("localStorage.setItem('mok.taught', '3'); __sim.go(9)"); until("__sim.G && __sim.G.order && __sim.G.wait <= 0"); order('breeze')
    ok(E("cardLines(__sim.G).length") == 1, 'later on the card shows only the name'); bk = E("__sim.layout().book"); tap(bk['x'] + bk['w'] / 2, bk['y'] + 24 * E("k") + bk['h'] / 2)
    ok(E("cardLines(__sim.G).length") == 2, 'the 📖 recipe shows it')
    E("__sim.G.drink.glass = 'rocks'"); tabTo('bottles'); P = item('cranberry'); touch('touchStart', [(2, P)]); pg.wait_for_timeout(150); ok(E("__sim.G.drink.pouring") == 'cranberry', 'a bottle held on a later level pours')
    E("document.getElementById('pauseBtn').click()"); ok(E("__sim.G.drink.pouring") is None, 'pausing stops a pour'); touch('touchEnd', [(2, P)])
    # ---------- Settings ----------
    E("__sim.live(); localStorage.setItem('mok.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    ok(E("!!document.getElementById('setBtn').offsetParent"), 'the Settings button is on the home screen')
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'it opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('mok.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
