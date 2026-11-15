"""Bandit keeps itself smooth: it times its own frames and eases off when a phone cannot keep up (see "keeping it smooth" in
part4.js). This test plays pretend phones at it: the page's clock and its screen refreshes are faked, so each "phone" is just a
rule for how long frames take given the notch the game has got to. It then checks where the game settles.

    python3 test_pace.py            all the pretend phones
    python3 test_pace.py -v         and print the notch after every phone

The game really draws every frame, so this also proves nothing breaks when it changes notch in the middle of a fight.
"""
import os, sys, json
from playwright.sync_api import sync_playwright

here = os.path.dirname(os.path.abspath(__file__))
verbose = '-v' in sys.argv

# The page's clock and screen refreshes, under the test's thumb.
FAKE = r"""(() => {
  let t = 1000; const q = [];
  performance.now = () => t;
  window.requestAnimationFrame = f => { q.push(f); return q.length; };
  window.__tick = gap => { t += gap; for (const f of q.splice(0)) f(t); };
  window.__auto = G => { G.in.sx = 0.3; G.in.sy = 0; G.fuel = 200; G.me.hp = 100; G.foe.hp = Math.max(G.foe.hp, 60); };
})()"""

# Run n screen refreshes. gapFor(state, i) -> how long until the next one, in ms. Returns the notch and how many frames were drawn.
RUN = r"""([n, rule]) => { const S = window.__sim, gapFor = new Function('s', 'i', rule), d0 = S.smooth().draws;
  for (let i = 0; i < n; i++) window.__tick(gapFor(S.smooth(), i));
  const s = S.smooth(); s.drawn = s.draws - d0; return s; }"""

fails, oks = [], 0
def ok(cond, what, detail=''):
    global oks
    if cond: oks += 1
    else: fails.append(what + (' (' + str(detail) + ')' if detail != '' else '')); print('  FAIL', what, detail)

def phone(b, name, rule, n=900, store=None, glOff=False):
    ctx = b.new_context(viewport={'width': 300, 'height': 560}, device_scale_factor=2, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script(FAKE + (';window.__noGL = true' if glOff else ';window.__softGL = true') +      # (this machine has no graphics chip: try the fast sky all the same)
                       (';' + ''.join(f"localStorage.setItem('bd.{k}', '{json.dumps(v)}');" for k, v in store.items()) if store else ''))
    pg.goto('file://' + os.path.join(here, 'index.html'))
    for _ in range(40): pg.evaluate("window.__tick(16.67)")
    pg.evaluate("window.__sim.go(12)")
    s, drawn = None, 0
    for i in range(0, n, 150): s = pg.evaluate(RUN, [min(150, n - i), rule]); drawn += s['drawn']
    s['drawn'] = drawn
    saved = pg.evaluate("(() => { const o = {}; for (const k of ['smooth', 'half', 'flat', 'visits', 'next', 'wait']) o[k] = JSON.parse(localStorage.getItem('bd.' + k) || 'null'); return o; })()")
    ok(not errs, f'{name}: no errors', errs[:2])
    ok(pg.evaluate("window.__sim.G.phase") == 'fight', f'{name}: the fight carried on through it')
    if verbose: print('   ', name, '->', s, saved)
    ctx.close()
    return s, saved

with sync_playwright() as p:
    b = p.chromium.launch(args=['--mute-audio'])
    MISS = "(i % 2 ? 2 : 1)"                # every other frame late: half the screen's refreshes missed

    s, sv = phone(b, 'a phone that keeps up', "return 16.67")
    ok(s['step'] == 0 and s['sky'] == 'fast' and not s['half'] and not s['stuck'], 'a phone that keeps up: nothing is eased off', s)
    ok(sv['smooth'] is None, 'and nothing is written down', sv)

    s, sv = phone(b, 'a hiccup now and then', "return i % 60 === 7 ? 70 : 16.67")
    ok(s['step'] == 0 and not s['half'], 'a hiccup once a second does not ease anything off', s)

    s, sv = phone(b, 'the app goes away and comes back', "return i % 200 === 150 ? 4000 : 16.67")
    ok(s['step'] == 0, 'a long gap (the app was away) is not counted as a slow frame', s)

    s, sv = phone(b, 'slow until two notches less fine', "return s.step >= 2 ? 16.67 : s.step === 1 ? (i % 5 < 2 ? 33.33 : 16.67) : (i % 5 < 4 ? 33.33 : 16.67)")
    ok(s['step'] == 2 and not s['stuck'], 'a slow phone: two notches less fine, and there it keeps up', s)
    ok(abs(s['dpr'] - 1.25) < 0.01, 'the picture is at the sharpness of that notch', s['dpr'])
    ok(sv['smooth'] == 2, 'and that is remembered', sv)
    ok(sv['next'] == 6, 'with a note to try a finer notch five visits on', sv)
    s2, sv2 = phone(b, 'the next visit', "return 16.67", n=300, store={'smooth': 2, 'visits': 1, 'next': 6})
    ok(s2['step'] == 2, 'the next visit starts where the last one got to', s2)

    s, sv = phone(b, 'something else holds it at 30 a second', "return 33.33")
    ok(s['step'] == 0 and s['stuck'], 'a less fine picture made no difference, twice: it was put back and the game stopped trying', s)
    ok(sv['flat'] == 1 and sv['smooth'] == 0, 'and it remembers not to try', sv)
    s2, sv2 = phone(b, 'the next visit to that phone', "return 33.33", n=400, store={'flat': 1, 'visits': 1, 'next': 6})
    ok(s2['step'] == 0 and s2['stuck'] and s2['draws'] > 0, 'the next visit leaves the picture alone', s2)
    s2, sv2 = phone(b, 'five visits on', "return 16.67", n=300, store={'flat': 1, 'visits': 5, 'next': 6})
    ok(not s2['stuck'], 'five visits on it is willing to try again', s2)

    s, sv = phone(b, 'a slow phone with no fast sky', "return s.step >= 1 ? 16.67 : 33.33", glOff=True)
    ok(s['sky'] == 'plain' and s['step'] == 1, 'without the fast sky it eases off just the same', s)

    s, sv = phone(b, 'too slow even at the least fine picture', "return 33.33", n=500, store={'smooth': 3, 'visits': 1, 'next': 6})
    ok(s['step'] == 3 and s['stuck'], 'nothing left to ease off: it stays put and stops measuring', s)

    for hz, vs in ((120, 8.33), (90, 11.11)):
        s, sv = phone(b, f'a {hz} screen that cannot keep up', f"return {vs} * (s.half ? 1 : {MISS})", n=900)
        ok(s['half'] == 1 and s['step'] == 0 and not s['stuck'], f'a {hz}-a-second screen: every other refresh, at the finest picture', s)
        ok(sv['half'] == 1 and sv['smooth'] == 0, 'and that is remembered', sv)
        n3 = 600
        s3, _ = phone(b, f'a {hz} screen, already eased off', f"return {vs}", n=n3, store={'half': 1, 'visits': 1, 'next': 6})
        ok(abs(s3['drawn'] - n3 / 2) <= n3 * 0.06, f'a {hz}-a-second screen, eased off: it draws on every other refresh', (s3['drawn'], n3))
        ok(s3['half'] == 1 and s3['step'] == 0, 'and is happy there', s3)

    s, sv = phone(b, 'a 90 screen that only needs a little', "return 11.11 * (s.step >= 1 ? 1 : (i % 2 ? 2 : 1))", n=700)
    ok(s['half'] == 0 and s['step'] == 1, 'a 90-a-second screen that keeps up one notch less fine: it keeps all 90', s)

    s, sv = phone(b, 'a fast screen that needs more than that', "return s.half ? (s.step >= 1 ? 8.33 : 25) : 8.33 * (i % 2 ? 2 : 1)", n=1500)
    ok(s['half'] == 1 and s['step'] == 1, 'a fast screen still struggling at every other refresh: one notch less fine as well', s)

    s, sv = phone(b, 'a 60 screen with the fast-screen setting saved', "return 16.67", n=400, store={'half': 1, 'visits': 1, 'next': 6})
    ok(abs(s['drawn'] - 400) <= 3, 'on an ordinary screen the every-other-refresh setting does nothing', s['drawn'])

    s, sv = phone(b, 'an eased-off phone, five visits on', "return 16.67", n=300, store={'smooth': 2, 'visits': 5, 'next': 6})
    ok(s['step'] == 1, 'five visits after easing off, it starts one notch finer', s)
    ok(sv['smooth'] == 1 and sv['wait'] == 5, 'and when the finer notch keeps up, it is the one remembered', sv)
    s, sv = phone(b, 'five visits on, still too much', "return 16.67 * (s.step >= 2 ? 1 : (i % 2 ? 2 : 1))", n=600, store={'smooth': 2, 'visits': 5, 'next': 6})
    ok(s['step'] == 2 and sv['smooth'] == 2, 'and when it does not, it goes back to where it was', (s, sv))
    ok(sv['wait'] == 10 and sv['next'] == 16, 'and waits twice as long before trying again', sv)
    s, sv = phone(b, 'a visit in between', "return 16.67", n=300, store={'smooth': 2, 'visits': 8, 'next': 16, 'wait': 10})
    ok(s['step'] == 2, 'in between, it stays where it is', s)
    b.close()

if fails:
    print(f'\nSmoothness FAILED: {len(fails)} of {oks + len(fails)} checks'); [print('  -', f) for f in fails]; sys.exit(1)
print(f'Smoothness passed: {oks} checks.')
