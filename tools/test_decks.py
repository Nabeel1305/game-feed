"""The decks that remember (25 Nov 2026): run python3 tools/test_decks.py [ids]. Every game with a deck loads and runs, in the robots' fast games the deck is plain luck and writes nothing, and in live play it never repeats before its whole list has gone by and is kept on the phone."""
# every changed game loads and runs, and in live play its deck never repeats before the whole list has gone by (and is kept on the phone)
import sys
from playwright.sync_api import sync_playwright
G = sys.argv[1:] or ['judge', 'vet', 'hiring', 'spell', 'detective', 'mocktail', 'dress', 'cake', 'plumber', 'dentist', 'pottery', 'haggle', 'heaven', 'cook']
bad = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for g in G:
        pg = b.new_page(viewport={'width': 390, 'height': 844}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
        pg.add_init_script('window.__softGL = true'); pg.goto(f'file:///home/claude/game-feed/games/{g}/index.html')
        try: pg.wait_for_function('typeof window.gameFeedStart === "function"', timeout=15000)
        except Exception as e: print(g, 'DID NOT LOAD', errs[:2]); bad += 1; pg.close(); continue
        r = pg.evaluate("""() => { const out = {}, S = __sim; try { S.start(12, { seed: 5, taught: 99 }); for (let i = 0; i < 600; i++) S.step(1 / 60); out.ran = true; const h = []; for (let i = 0; i < 20; i++) h.push(S.deal('zz', 10, S.G.rnd)); out.headlessPlain = !Object.keys(localStorage).some(k => k.includes('deck.zz'));
          S.live(); const seq = []; for (let i = 0; i < 30; i++) seq.push(S.deal('zz', 10, Math.random)); out.deck = new Set(seq.slice(0, 10)).size === 10 && new Set(seq.slice(10, 20)).size === 10 && seq[9] !== seq[10] && seq[19] !== seq[20]; out.kept = Object.keys(localStorage).some(k => k.includes('deck.zz'));
          const L = [0, 1, 2, 3, 4, 5, 6, 7], got = []; for (let i = 0; i < 12; i++) got.push(S.dealIf('yy', L, q => q % 2 === 0, Math.random)); out.dealIf = got.every(q => q % 2 === 0) && new Set(got.slice(0, 4)).size === 4 && new Set(got.slice(4, 8)).size === 4; S.start(1, { seed: 1, taught: 99 }); } catch (e) { out.err = String(e).slice(0, 160); } return out; }""")
        ok = r.get('ran') and r.get('deck') and r.get('kept') and r.get('dealIf') and r.get('headlessPlain') and not errs and not r.get('err')
        if not ok: bad += 1
        print(('ok  ' if ok else 'FAIL') + ' ' + g.ljust(10), '' if ok else r, errs[:2] if errs else '')
        pg.close()
    b.close()
print('all decks pass' if not bad else f'{bad} failed'); sys.exit(1 if bad else 0)
