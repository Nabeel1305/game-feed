#!/usr/bin/env python3
"""Detective with real touches (a phone held upright): a tap on an object in the room brings it up close; a drag turns it; a
pinch zooms; a tap on the hidden mark (with that side facing you) finds the clue, a tap elsewhere does not; Done puts it
back; the room buttons change room. In the panel: tap a person, ask where they were, show them a clue: their own clue
cracks a liar's story (a fact), someone else's tries their patience; a link the evidence supports becomes a fact, one it
does not stays a theory; hints go a question, then a place, then the object; a wrong accusation is explained by the
evidence, the right one solves the case, and two wrong ones let it go cold. The Settings switch Music, Sound effects and
Vibration on their own and remember them. No errors.
Run: python3 games/detective/test_touch.py"""
import os, sys, json
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
    def touch(kind, pts): cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, x, y in pts]})
    def tap(x, y): touch('touchStart', [(5, x, y)]); touch('touchEnd', [(5, x, y)]); pg.wait_for_timeout(120)
    def tapSel(sel): pg.tap(sel); pg.wait_for_timeout(120)
    E("localStorage.setItem('det.taught', '3'); __sim.go(10)"); pg.wait_for_timeout(600); E("Object.assign(window, __sim.x())")
    # a hidden clue in the first room, on an object we can find
    J = E("(() => { const G = __sim.G, r = G.rooms[0]; const j = r.items.findIndex(q => q.clue != null && clue(G, q.clue).hidden); if (j < 0) { const k2 = r.items.findIndex(q => q.clue != null); const c = clue(G, r.items[k2].clue); c.hidden = true; c.face = 2; c.spot = [0.2, -0.1]; return k2; } return j; })()")
    it = E(f"(() => {{ const it = __sim.G.rooms[0].items[{J}], s = scrOf(it.x, 0.6, it.z); return [s.x, s.y]; }})()")
    tap(it[0], it[1]); ok(E("!!__sim.G.insp") and E(f"__sim.G.insp.j === {J}") and E("!document.getElementById('dInsp').classList.contains('hidden')"), 'a tap on an object brings it up close')
    y0 = E("__sim.G.insp.yaw"); touch('touchStart', [(1, 150, 200)]); touch('touchMove', [(1, 200, 200)]); touch('touchMove', [(1, 260, 200)]); touch('touchEnd', [(1, 260, 200)]); pg.wait_for_timeout(100)
    ok(abs(E("__sim.G.insp.yaw") - y0) > 0.8, 'a drag turns it', str([y0, E("__sim.G.insp.yaw")]))
    z0 = E("__sim.ui.zoom"); touch('touchStart', [(1, 170, 200), (2, 220, 200)]); touch('touchMove', [(1, 140, 200), (2, 250, 200)]); touch('touchMove', [(1, 110, 200), (2, 280, 200)]); touch('touchEnd', [(1, 110, 200), (2, 280, 200)]); pg.wait_for_timeout(100)
    ok(E("__sim.ui.zoom") > z0 + 0.3, 'a pinch zooms in', str([z0, E("__sim.ui.zoom")]))
    E("__sim.ui.zoom = 1")
    C = E(f"(() => {{ const G = __sim.G, c = clue(G, G.rooms[0].items[{J}].clue); return {{ face: c.face, spot: c.spot, id: c.id }}; }})()")
    E(f"(() => {{ const G = __sim.G; G.insp.yaw = {C['face']} * Math.PI / 2 + 0.05; }})()")
    def uvToScreen(u, v): return E(f"faceXY({u}, {v})")
    xy = uvToScreen(-C['spot'][0], -C['spot'][1]) if abs(C['spot'][0]) > 0.3 or abs(C['spot'][1]) > 0.3 else uvToScreen(C['spot'][0] + 0.7 if C['spot'][0] < 0.2 else C['spot'][0] - 0.7, C['spot'][1])
    tap(xy[0], xy[1]); ok(E(f"__sim.G.clues[{C['id']}].found") is False, 'a tap away from the mark finds nothing')
    xy = uvToScreen(C['spot'][0], C['spot'][1]); tap(xy[0], xy[1]); ok(E(f"__sim.G.clues[{C['id']}].found") is True, 'a tap on the hidden mark, that side facing you, finds the clue')
    tapSel('#dInspDone'); ok(E("__sim.G.insp") is None, 'Done puts it back')
    tapSel('#dRooms button[data-room="1"]'); ok(E("__sim.G.room") == 1, 'the room buttons change room')
    # find everything (as if searched), then talk
    E("(() => { const G = __sim.G; G.clues.forEach(c => { c.found = true; }); __sim.x().render(); })()")
    T = E("__sim.G.truth"); who = T['who']; other = next(i for i in range(E("__sim.G.S.length")) if i != who and i not in T['herrings'])
    tapSel('#dTabs button[data-tab="people"]'); tapSel(f'.sus[data-sus="{who}"]'); tapSel('[data-ask="where"]')
    ok(E(f"!!__sim.G.S[{who}].asked.where") and 'In the' in E("document.querySelector('.say').textContent"), 'tap a person and ask where they were: their answer', E("document.querySelector('.say') && document.querySelector('.say').textContent"))
    br = E(f"__sim.G.clues.find(c => c.kind === 'breaks' && c.sus === {who}).id"); tapSel(f'[data-show="{br}"]')
    ok(E(f"__sim.G.S[{who}].cracked") is True and E("__sim.G.facts.some(f => f.strong)"), "showing a liar their own clue cracks their story (a fact)")
    pat = E(f"__sim.G.S[{who}].patience"); oth = E(f"__sim.G.clues.find(c => c.sus === {other}).id"); tapSel(f'[data-show="{oth}"]')
    ok(E(f"__sim.G.S[{who}].patience") == pat - 1, "someone else's clue tries their patience")
    tapSel('#dTabs button[data-tab="notes"]'); tapSel(f'[data-link="{br}"]'); tapSel(f'[data-lsus="{who}"]'); tapSel('[data-limp="scene"]')
    ok(E(f"__sim.G.links.some(L => L.cid === {br} && L.fact)") and '✓ fact' in E("document.getElementById('dBody').textContent"), 'a link the evidence supports becomes a fact ✓')
    tapSel(f'[data-link="{br}"]'); tapSel(f'[data-lsus="{other}"]'); tapSel('[data-limp="scene"]')
    ok(E(f"__sim.G.links.some(L => L.cid === {br} && L.si === {other} && !L.fact)") and 'theory' in E("document.getElementById('dBody').textContent"), 'one it does not support stays a theory')
    # hints, in three steps
    E("(() => { const G = __sim.G; G.clues.forEach(c => { if (c.kind === 'method') c.found = false; }); G.freeHints = 0; })()")
    hs = []
    for i in range(3): tapSel('#hintBtn'); hs.append(E("__sim.G.hintStep"))
    ok(hs == [1, 2, 3] and E("!!__sim.G.highlight"), 'hints go: a question, then a place, then the object itself', str(hs))
    E("(() => { const G = __sim.G; G.clues.forEach(c => { c.found = true; }); })()")
    # accuse: wrong (explained), then right
    tapSel('#dTabs button[data-tab="accuse"]'); tapSel(f'[data-who="{other}"]'); tapSel(f'[data-how="{T["how"]}"]'); tapSel(f'[data-when="{T["when"]}"]')
    pr = E("__sim.G.clues.filter(c => c.proof).map(c => c.id)"); tapSel(f'[data-proof="{pr[0]}"]'); tapSel(f'[data-proof="{pr[1]}"]'); tapSel('#goAccuse')
    ok(E("__sim.G.strikes") == 1 and E("__sim.G.over") is None and E("document.querySelectorAll('.why').length") >= 1, 'a wrong accusation is explained by the evidence (and costs a try)', E("document.querySelector('.why') && document.querySelector('.why').textContent"))
    tapSel(f'[data-who="{who}"]'); tapSel('#goAccuse'); pg.wait_for_timeout(300)
    ok(E("__sim.G.over") == 'won', 'the right one (who, how, when, two clues) solves the case', str(E("__sim.G.over")))
    E("__sim.go(10)"); pg.wait_for_timeout(300)
    r = E("(() => { const G = __sim.G, X = __sim.x(), T = G.truth, o = (T.who + 1) % G.S.length; G.clues.forEach(c => c.found = true); X.accuse(G, { who: o, how: T.how, when: T.when, proof: [] }); X.accuse(G, { who: o, how: T.how, when: T.when, proof: [] }); return [G.over, G.res && G.res.why]; })()")
    ok(r == ['lost', 'cold'], 'two wrong accusations and the case goes cold', str(r))
    # settings
    E("__sim.live(); localStorage.setItem('det.settings', '{}'); location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(600)
    sw = "['tMus', 'tSfx', 'tVib'].map(i => document.getElementById(i).textContent === 'ON')"
    E("document.getElementById('setBtn').click()"); ok(E("!document.getElementById('ovSet').classList.contains('hidden')"), 'the Settings button opens the Settings card')
    E("document.getElementById('tMus').click()"); ok(E(sw) == [False, True, True], 'Music switches off on its own', str(E(sw)))
    E("document.getElementById('tVib').click()"); ok(E(sw) == [False, True, False], 'Vibration switches off on its own', str(E(sw)))
    E("document.getElementById('tSfx').click()"); ok(E(sw) == [False, False, False], 'Sound effects switch off on their own', str(E(sw)))
    E("location.reload()"); pg.wait_for_function('typeof window.gameFeedStart === "function"'); pg.wait_for_timeout(500)
    ok(E(sw) == [False, False, False], 'the settings are remembered'); E("localStorage.setItem('det.settings', '{}')")
    ok(not errs, 'no JavaScript errors', str(errs[:3])); ctx.close(); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
