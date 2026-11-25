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
    pg.click(f'.rate[data-id="{third}"] button[data-r="bad"]'); pg.wait_for_timeout(800); pg.click('.chip[data-f="wait"]'); pg.wait_for_timeout(250)
    ok(pg.query_selector(f'#g-{third}') is not None and 'NEEDS FIXING' in pg.inner_text(f'[data-st="{third}"]'), 'NEEDS FIXING sends it to the To fix list', pg.inner_text('#toastMsg'))
    pg.click('.chip[data-f="all"]'); pg.wait_for_timeout(250); pg.click(f'.rate[data-id="{third}"] button[data-r="bad"]'); pg.wait_for_timeout(200); pg.fill(f'textarea[data-k="{third}.f"]', 'too slow'); pg.click(f'.rate[data-id="{third}"] button[data-r="good"]'); pg.wait_for_timeout(300)
    ok(pg.evaluate("stateOf(GAMES.find(g => g.id === '%s'))" % third) == 'wait' and 'note' in pg.inner_text('#toastMsg').lower(), 'GAME IS OKAY does not hide a note he wrote: it stays in To fix and the page says why', pg.inner_text('#toastMsg'))
    ok(not (errs + errs2 + errs3 + errs4), 'no page errors', (errs + errs2 + errs3 + errs4)[:2]); b.close()
print(f'\n{18 - fails if fails <= 18 else 0} passed, {fails} failed.' if fails else '\nAll review-page checks passed.'); sys.exit(1 if fails else 0)
