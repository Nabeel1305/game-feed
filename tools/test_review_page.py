#!/usr/bin/env python3
"""The Game Review page keeps what he writes (his words, 23 Nov 2026: "I don't want to come back to it tomorrow and not see it
there"). The page's store is stood in for here by a dictionary on this side, so it survives reloads and wiped phones.
Run: python3 tools/review_page.py && python3 tools/test_review_page.py"""
import os, sys, json
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); URL = 'file://' + R + '/out/review/index.html'
fails = 0
def ok(c, name, detail=''):
    global fails; fails += 0 if c else 1; print(('  ok   ' if c else '  FAIL ') + name + ('' if c else '   ' + str(detail)[:300]))
STORE = {}; MODE = {'fail': False, 'none': False}
MOCK = """(() => { const db = { doc(path) { return { set: async body => { const r = await window.__st('set', path, JSON.stringify(body)); if (r === 'fail') throw { code: 'unavailable' }; }, get: async () => ({ exists: false, data: () => undefined }) }; },
    collection(path) { const q = { limit() { return q; }, get: async () => { const all = JSON.parse(await window.__st('list', path, '')); return { docs: Object.keys(all).map(id => ({ id, exists: true, data: () => all[id] })) }; } }; return q; } };
  window.claude = { use: async name => (await window.__st('mode', '', '')) === 'none' ? null : name === 'db' ? db : null }; })()"""
def st(source, op, path, body):
    if op == 'mode': return 'none' if MODE['none'] else 'on'
    if op == 'set':
        if MODE['fail']: return 'fail'
        STORE[path] = json.loads(body); return 'ok'
    if op == 'list': return json.dumps({k.split('/', 1)[1]: v for k, v in STORE.items() if k.startswith(path + '/')})
with sync_playwright() as p:
    b = p.chromium.launch()
    def fresh():
        ctx = b.new_context(viewport={'width': 390, 'height': 844}); ctx.expose_binding('__st', st); ctx.add_init_script(MOCK); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.goto(URL); pg.wait_for_timeout(900); return ctx, pg, errs
    ctx, pg, errs = fresh(); first = pg.evaluate('GAMES[0].id'); second = pg.evaluate('GAMES[1].id')
    ok('All saved' in pg.inner_text('#svAll'), 'a new page with nothing written says All saved', pg.inner_text('#svAll'))
    pg.fill(f'textarea[data-k="{first}.c"]', 'I cannot tell what to do'); pg.click(f'.rate[data-id="{first}"] button[data-r="bad"]'); pg.wait_for_timeout(2300)
    d = STORE.get('reviews/' + first, {}); ok(d.get('critical') == 'I cannot tell what to do' and d.get('rating') == 'bad', 'what he types and his rating reach the store by themselves within two seconds', d)
    ok('Saved' in pg.inner_text(f'[data-sv="{first}"]') and 'All saved' in pg.inner_text('#svAll'), 'the card and the bar say Saved', pg.inner_text('#svAll'))
    ctx.close(); ctx, pg, errs2 = fresh()      # another day, and the phone has forgotten everything (a new context has empty local storage)
    ok(pg.input_value(f'textarea[data-k="{first}.c"]') == 'I cannot tell what to do' and pg.evaluate(f"document.querySelector('.rate[data-id=\"{first}\"] button.on').dataset.r") == 'bad', 'on a phone that has forgotten everything, his note and rating come back from the store')
    MODE['fail'] = True; pg.fill(f'textarea[data-k="{second}.f"]', 'the ball is too small'); pg.wait_for_timeout(2300)
    ok('not saved' in pg.inner_text('#svAll').lower() and 'reviews/' + second not in STORE, 'with no signal the bar says it is not saved yet', pg.inner_text('#svAll'))
    pg.reload(); pg.wait_for_timeout(1200); ok(pg.input_value(f'textarea[data-k="{second}.f"]') == 'the ball is too small', 'the unsaved note is still there after a reload (kept on the phone)')
    MODE['fail'] = False; pg.click('#save'); pg.wait_for_timeout(1200)
    ok(STORE.get('reviews/' + second, {}).get('flaw') == 'the ball is too small' and 'All saved' in pg.inner_text('#svAll'), 'SAVE sends it once the signal is back', pg.inner_text('#svAll'))
    pg.click('#submit'); pg.wait_for_timeout(1200); m = STORE.get('meta/submitted', {})
    ok(m.get('rated') == 1 and m.get('withNotes') == 2 and 'Sent' in pg.inner_text('#outMsg'), 'SUBMIT REVIEW records that he has submitted, and says so', (m, pg.inner_text('#outMsg')))
    ok('I cannot tell what to do' in pg.input_value('#outText') and 'the ball is too small' in pg.input_value('#outText') and '[NEEDS FIXING]' in pg.input_value('#outText'), 'and shows everything he wrote, for copying if needed')
    pg.click('#outClose'); pg.click(f'[data-play="{first}"]'); pg.wait_for_timeout(400); pg.click('#pnotes'); pg.fill(f'#sheet textarea[data-k="{first}.f"]', 'music is too loud'); pg.wait_for_timeout(2300)
    ok(STORE.get('reviews/' + first, {}).get('flaw') == 'music is too loud' and STORE['reviews/' + first].get('critical') == 'I cannot tell what to do', 'a note written from inside a game is saved too, and keeps the rest of that game\'s notes', STORE.get('reviews/' + first))
    ctx.close(); MODE['none'] = True; ctx, pg, errs3 = fresh(); pg.wait_for_timeout(300)
    ok('this phone only' in pg.inner_text('#svAll'), 'if the store cannot be reached at all, the page says the notes are on this phone only', pg.inner_text('#svAll'))
    pg.fill(f'textarea[data-k="{first}.c"]', 'typed with no store'); pg.click('#submit'); pg.wait_for_timeout(500); ok('COPY' in pg.inner_text('#outMsg') and 'typed with no store' in pg.input_value('#outText'), 'and SUBMIT then offers the notes to copy', pg.inner_text('#outMsg'))
    # 25 Nov 2026, his words: "I click this game is completely okay, and... it can take it to the list that the game is good... The fixed games and the
    # games that I haven't reviewed, I can take it to the games that need to be fixed": the two buttons move a game to its list at once
    ctx.close(); MODE['fail'] = False; MODE['none'] = False; ctx, pg, errs4 = fresh()
    third = pg.evaluate("GAMES.find(g => !g.check && g.id !== '%s' && g.id !== '%s').id" % (first, second))
    pg.click('.chip[data-f="new"]'); pg.wait_for_timeout(250); n0 = int(pg.inner_text('#n-fine'))
    pg.click(f'.rate[data-id="{third}"] button[data-r="good"]'); pg.wait_for_timeout(800)
    ok(pg.query_selector(f'#g-{third}') is None and int(pg.inner_text('#n-fine')) == n0 + 1 and 'OKAY' in pg.inner_text('#toastMsg'), 'GAME IS OKAY on a game not reviewed: it leaves that list, the Okay list has one more, and the page says where it went', pg.inner_text('#toastMsg'))
    pg.wait_for_timeout(1900); ok(STORE.get('reviews/' + third, {}).get('rating') == 'good', 'and the store has it', STORE.get('reviews/' + third))
    pg.click('#undo'); pg.wait_for_timeout(350); ok(pg.query_selector(f'#g-{third}') is not None and int(pg.inner_text('#n-fine')) == n0, 'UNDO puts it back where it was')
    # 25 Nov 2026, 11:44, his words: "immediately I say a game is okay, take it out of that folder... if I say a game needs fixing, take it out of
    # that folder... create another button, which is final fix... immediately I click final fix, take it to the final fix". What he had met (read from
    # the store): a note typed first, then NEEDS FIXING, and the card stayed where it was.
    S = lambda i: pg.evaluate("stateOf(GAMES.find(g => g.id === '%s'))" % i)
    pg.fill(f'textarea[data-k="{third}.f"]', 'too slow'); pg.wait_for_timeout(200)
    ok(pg.query_selector(f'#g-{third}') is not None, 'a card does not vanish while he is typing on it')
    pg.click(f'.rate[data-id="{third}"] button[data-r="bad"]'); pg.wait_for_timeout(700)
    ok(pg.query_selector(f'#g-{third}') is None and 'TO FIX' in pg.inner_text('#toastMsg'), 'a note typed first, then NEEDS FIXING: the card leaves the list at once (it stayed, on 25 Nov)', pg.inner_text('#toastMsg'))
    pg.click('.chip[data-f="wait"]'); pg.wait_for_timeout(250)
    ok(pg.query_selector(f'#g-{third}') is not None and pg.input_value(f'textarea[data-k="{third}.f"]') == 'too slow', 'and it is in the To fix list with his note')
    pg.click(f'.rate[data-id="{third}"] button[data-r="good"]'); pg.wait_for_timeout(700)
    ok(pg.query_selector(f'#g-{third}') is None and S(third) == 'fine' and 'kept' in pg.inner_text('#toastMsg'), 'GAME IS OKAY on a game with a note: it goes to Okay at once, and the page says the note is kept', pg.inner_text('#toastMsg'))
    pg.wait_for_timeout(1900); d = STORE.get('reviews/' + third, {}); ok(d.get('rating') == 'good' and d.get('flaw') == 'too slow', 'the store has the okay AND the note', d)
    pg.click('.chip[data-f="fine"]'); pg.wait_for_timeout(250)
    ok(pg.input_value(f'textarea[data-k="{third}.f"]') == 'too slow' and 'NOTE IS KEPT' in pg.inner_text(f'[data-st="{third}"]'), 'in the Okay list the note is still on its card', pg.inner_text(f'[data-st="{third}"]'))
    pg.fill(f'textarea[data-k="{third}.f"]', 'too slow and too dark'); pg.wait_for_timeout(250)
    ok(S(third) == 'wait' and 'TO FIX' in pg.inner_text('#toastMsg') and pg.query_selector(f'#g-{third}') is not None, 'writing more on an okay game sends it to To fix (and the card stays while he types)', pg.inner_text('#toastMsg'))
    fourth = pg.evaluate("GAMES.find(g => !g.check && !['%s', '%s', '%s'].includes(g.id)).id" % (first, second, third))
    pg.click('.chip[data-f="new"]'); pg.wait_for_timeout(250); f0 = int(pg.inner_text('#n-final'))
    pg.click(f'.rate[data-id="{fourth}"] button[data-r="final"]'); pg.wait_for_timeout(700)
    ok(pg.query_selector(f'#g-{fourth}') is None and int(pg.inner_text('#n-final')) == f0 + 1 and 'FINAL FIX' in pg.inner_text('#toastMsg') and pg.is_visible('#tnote'), 'FINAL FIX: the card leaves at once, the Final fix list has one more, and the page offers WRITE IT', pg.inner_text('#toastMsg'))
    pg.click('#tnote'); pg.wait_for_timeout(250)
    ok(pg.is_visible('#sheet') and pg.query_selector(f'#sheet textarea[data-k="{fourth}.f"]') is not None and pg.query_selector(f'#sheet textarea[data-k="{fourth}.c"]') is None, 'WRITE IT opens one box for the one thing')
    pg.fill(f'#sheet textarea[data-k="{fourth}.f"]', 'make the jump sound louder'); pg.wait_for_timeout(2300); d = STORE.get('reviews/' + fourth, {})
    ok(d.get('rating') == 'final' and d.get('flaw') == 'make the jump sound louder', 'the store has the final fix and the one thing', d)
    pg.click('#sdone'); pg.wait_for_timeout(200); pg.click('.chip[data-f="final"]'); pg.wait_for_timeout(250)
    ok(not pg.is_visible('#sheet') and pg.input_value(f'textarea[data-k="{fourth}.f"]') == 'make the jump sound louder' and 'ONE LAST THING' in pg.inner_text(f'[data-st="{fourth}"]'), 'and the game is in the Final fix list with the one thing on its card', pg.inner_text(f'[data-st="{fourth}"]'))
    pg.click('#submit'); pg.wait_for_timeout(900); ok('[FINAL FIX]' in pg.input_value('#outText'), 'the copied notes say FINAL FIX'); pg.click('#outClose')
    fifth = pg.evaluate("GAMES.find(g => !g.check && !['%s', '%s', '%s', '%s'].includes(g.id)).id" % (first, second, third, fourth))
    HEAD = "(() => { let e = document.getElementById('g-%s'); while (e && !e.classList.contains('sec')) e = e.previousElementSibling; return e ? e.textContent : ''; })()"
    pg.click('.chip[data-f="all"]'); pg.wait_for_timeout(250); h0 = pg.evaluate(HEAD % fifth)
    pg.click(f'.rate[data-id="{fifth}"] button[data-r="good"]'); pg.wait_for_timeout(700); h1 = pg.evaluate(HEAD % fifth)
    ok('NOT REVIEWED' in h0 and 'OKAY' in h1 and pg.evaluate("document.querySelectorAll('#list .g').length") == pg.evaluate('GAMES.length'), 'in ALL every game is there, grouped by list, and a press moves the card out of its group into the other', (h0, h1))
    pg.wait_for_timeout(1900); ctx.close(); ctx, pg, errs5 = fresh(); errs4 = errs4 + errs5
    ok(pg.get_attribute(f'#g-{fourth}', 'data-in') == 'final' and pg.get_attribute(f'#g-{fifth}', 'data-in') == 'fine' and int(pg.inner_text('#n-final')) >= 1, 'on a phone that has forgotten everything, every card is drawn in the list the store says')
    for w, h in ((360, 640), (412, 915)):
        pg.set_viewport_size({'width': w, 'height': h}); pg.wait_for_timeout(200)
        bad = pg.evaluate("""(() => { const out = []; for (const r of document.querySelectorAll('#list .rate')) { const bs = [...r.querySelectorAll('button')].map(b => b.getBoundingClientRect()); if (bs.length !== 3 || bs.some(b => b.width < 80 || b.left < 0 || b.right > innerWidth) || bs.some(b => Math.abs(b.top - bs[0].top) > 1 || Math.abs(b.height - bs[0].height) > 1)) out.push(r.dataset.id); } return out.slice(0, 5); })()""")
        ok(not bad and pg.evaluate("document.documentElement.scrollWidth <= innerWidth"), f'on a {w} x {h} phone the three buttons sit side by side, each at least 80 wide, and nothing runs off the side', bad)
        pg.evaluate('scrollTo(0, 900)'); pg.wait_for_timeout(150); hh = pg.evaluate("document.querySelector('header').getBoundingClientRect().bottom")
        ok(hh <= 0.17 * h and pg.evaluate("document.querySelectorAll('header .chip').length") == 6, f'and the six lists stay at the top in two rows without taking the screen ({round(hh)} of {h})', hh)
    ok(not (errs + errs2 + errs3 + errs4), 'no page errors', (errs + errs2 + errs3 + errs4)[:2]); b.close()
print(f'\n{fails} failed.' if fails else '\nAll review-page checks passed.'); sys.exit(1 if fails else 0)
