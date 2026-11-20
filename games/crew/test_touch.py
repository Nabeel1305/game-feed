#!/usr/bin/env python3
"""Shadow Crew with real thumbs: the left thumb walks you (right is right, up the screen is up the map); the KNOCK OUT button
works only with someone close, knocks them out and starts its wait; someone watching sees it and runs for the alarm; a
vent takes you in, NEXT moves you along, OUT brings you up; sabotage puts the lights out; a body found calls a meeting where
a tap picks someone and VOTE throws them out; a vote against you ends it; the look you pick is yours. No errors.
Run: python3 games/crew/test_touch.py"""
import os, sys
from playwright.sync_api import sync_playwright
here = os.path.dirname(os.path.abspath(__file__)); fails = []; oks = 0
def ok(c, what, d=''):
    global oks
    if c: oks += 1; print('  ok  ', what)
    else: fails.append(what); print('  FAIL', what, d)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(here, 'index.html')); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(800)
    E = pg.evaluate
    def hold(dx, dy, ms=500, x0=110, y0=600):
        pg.mouse.move(x0, y0); pg.mouse.down()
        for i in range(1, 7): pg.mouse.move(x0 + dx * i / 6, y0 + dy * i / 6); pg.wait_for_timeout(16)
        pg.wait_for_timeout(ms); pg.mouse.up(); pg.wait_for_timeout(80)
    def btn(id): return E(f"(() => {{ const b = __sim.buttons(__sim.G).find(q => q.id === '{id}'); return b ? [b.x, b.y, b.on] : null; }})()")
    def tap(id):
        q = btn(id); pg.mouse.click(q[0], q[1]); pg.wait_for_timeout(80)
    calm = "(() => { const G = __sim.G; G.ppl.forEach(p => { if (p.i) { p.x = 49; p.z = 12.5; p.path = null; p.job = null; p.wait = 999; } }); G.cfg.need = 9999; G.need = 9999; })()"
    E("localStorage.setItem('scw.taught', '3'); __sim.go(3)"); pg.wait_for_timeout(300); E(calm)
    x0, z0 = E("[__sim.G.you.x, __sim.G.you.z]"); hold(80, 0); x1, z1 = E("[__sim.G.you.x, __sim.G.you.z]"); ok(x1 > x0 + 0.5, 'sliding right walks right', str([x0, x1]))
    hold(0, -80); z2 = E("__sim.G.you.z"); ok(z2 < z1 - 0.5, 'sliding up walks up the map', str([z1, z2]))
    # knock out: only with someone close
    E("__sim.G.cd = 0"); ok(not btn('knock')[2], 'KNOCK OUT is off with no one close')
    E("(() => { const G = __sim.G, Y = G.you, p = G.ppl[1]; p.x = Y.x + 0.8; p.z = Y.z; })()"); pg.wait_for_timeout(60); ok(btn('knock')[2], 'and on with someone close')
    tap('knock'); ok(E("!__sim.G.ppl[1].alive && __sim.G.kills === 1 && __sim.G.cd > 5"), 'KNOCK OUT knocks them out and starts its wait')
    # a witness runs for the alarm
    E("__sim.go(3)"); pg.wait_for_timeout(300); E(calm); E("(() => { const G = __sim.G, Y = G.you; G.cd = 0; Y.x = 24.5; Y.z = 8; G.ppl[1].x = 25.3; G.ppl[1].z = 8; G.ppl[2].x = 21; G.ppl[2].z = 8; G.ppl[2].wait = 0; })()"); pg.wait_for_timeout(60)
    tap('knock'); ok(E("__sim.G.ppl[2].mode") == 'flee' and E("__sim.G.seenKill") == 1, 'someone watching sees it, and runs for the alarm', str(E("[__sim.G.ppl[2].mode, __sim.G.seenKill]")))
    pg.wait_for_timeout(4000); ok(E("!!__sim.G.meet"), 'they press the alarm: a meeting')
    # a meeting: tap someone, VOTE
    pg.wait_for_timeout(int(E("__sim.G.meet.says.length") * 900 + 1500)); L = E("__sim.meetLayout(__sim.G)")
    t3 = next(t for t in L['tiles'] if t['p']['i'] == 3); pg.mouse.click(t3['x'] + 20, t3['y'] + 20); pg.wait_for_timeout(100); ok(E("__sim.ui.sel") == 3, 'at a meeting, a tap picks someone', str(E("__sim.ui.sel")))
    v = L['vote']; pg.mouse.click(v['x'] + 20, v['y'] + 20); pg.wait_for_timeout(200); ok(E("!!__sim.G.meet.votes"), 'VOTE casts the votes')
    pg.wait_for_timeout(3000); ok(E("__sim.G.over") == 'lost', 'an eyewitness gets you thrown out', str(E("__sim.G.over")))
    # vents
    E("__sim.go(3)"); pg.wait_for_timeout(300); E(calm); E("(() => { const Y = __sim.G.you; Y.x = 12.5; Y.z = 5.5; })()"); pg.wait_for_timeout(60); ok(btn('vent')[2], 'on a vent, VENT is on')
    tap('vent'); ok(E("__sim.G.inVent") == 3, 'VENT takes you in', str(E("__sim.G.inVent"))); tap('next'); ok(E("__sim.G.inVent") == 4 and abs(E("__sim.G.you.z") - 11.5) < 0.1, 'NEXT moves you to the next vent', str(E("[__sim.G.inVent, __sim.G.you.z]")))
    tap('out'); ok(E("__sim.G.inVent") == -1 and E("__sim.G.vents") == 1, 'OUT brings you up')
    # sabotage: the lights
    E("__sim.G.sabCd = 0"); tap('sab'); pg.wait_for_timeout(60); tap('sab:lights'); ok(E("__sim.G.lightsOut") > 10, 'SABOTAGE, LIGHTS puts the lights out', str(E("__sim.G.lightsOut")))
    # pretend to work: hold USE at a job
    E("(() => { const Y = __sim.G.you; Y.x = 11.5; Y.z = 3.5; })()"); pg.wait_for_timeout(60); q = btn('use'); pg.mouse.move(q[0], q[1]); pg.mouse.down(); pg.wait_for_timeout(1300); ok(E("__sim.G.faking") > 1, 'holding PRETEND at a job pretends to work', str(E("__sim.G.faking"))); pg.mouse.up(); pg.wait_for_timeout(60); ok(E("__sim.G.faking") == 0, 'and letting go stops')
    # paused
    E("__sim.go(3)"); pg.wait_for_timeout(300); E(calm); E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(200); a = E("__sim.G.you.x"); hold(80, 0); ok(abs(E("__sim.G.you.x") - a) < 1e-6, 'while paused, nothing moves')
    # looks
    E("localStorage.setItem('scw.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.LOOKS.length"), 'Your looks lists every look')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.myLook().id") == E("__sim.LOOKS[1].id"), 'tapping an open one picks it, and it is the one you play with')
    E("localStorage.setItem('scw.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('look')") == E("__sim.LOOKS[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
