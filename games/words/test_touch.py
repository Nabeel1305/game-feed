#!/usr/bin/env python3
"""Word Wheel with a real thumb: sliding through the letters spells a word (lifting tries it), and sliding back onto the
last-but-one letter takes a letter off; a word in the crossword fills in and gives back a drop of ink; a real word not in it
is a bonus (a coin, in the book); a made-up word spills a drop; out of ink, the page is lost; the bulb shows a letter and costs
coins; the shuffle button turns the wheel; the whole crossword wins the page; the tiles you pick are the ones you play with.
Run: python3 games/words/test_touch.py"""
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
    def pts(): return E("__sim.lay().pts.map(p => [p.x, p.y])")
    def swipe(word=None, idx=None, back=None):
        P = pts(); letters = E("__sim.G.letters")
        if idx is None:
            idx = []
            for ch in word: idx.append(next(i for i, l in enumerate(letters) if l == ch and i not in idx))
        seq = list(idx) if back is None else list(idx[:-1]) + [back, idx[-2]]
        x, y = P[seq[0]]; pg.mouse.move(x, y); pg.mouse.down()
        for i in seq[1:]:
            x1, y1 = P[i]
            for t in range(1, 7): pg.mouse.move(x + (x1 - x) * t / 6, y + (y1 - y) * t / 6); pg.wait_for_timeout(12)
            x, y = x1, y1
        pg.mouse.up(); pg.wait_for_timeout(150)
    E("localStorage.setItem('wl.taught', '3'); localStorage.setItem('wl.bank', '200'); __sim.go(4)"); pg.wait_for_timeout(300)
    w0 = E("__sim.G.words[0].w"); E("__sim.G.ink = 3"); swipe(w0)
    ok(E("__sim.G.words[0].found"), 'sliding through the letters spells a word, and it fills in', w0)
    ok(E("__sim.G.ink") == 4, 'a found word gives back a drop of ink', str(E("__sim.G.ink")))
    # back onto the last-but-one letter takes a letter off: spell word[1] with a detour
    w1 = E("__sim.G.words[1].w"); letters = E("__sim.G.letters"); idx = []
    for ch in w1: idx.append(next(i for i, l in enumerate(letters) if l == ch and i not in idx))
    extra = next(i for i in range(len(letters)) if i not in idx)
    seq = idx[:-1] + [extra]; P = pts(); x, y = P[seq[0]]; pg.mouse.move(x, y); pg.mouse.down()
    for i in seq[1:] + [idx[-2], idx[-1]]:
        x1, y1 = P[i]
        for t in range(1, 7): pg.mouse.move(x + (x1 - x) * t / 6, y + (y1 - y) * t / 6); pg.wait_for_timeout(12)
        x, y = x1, y1
    pg.mouse.up(); pg.wait_for_timeout(150)
    ok(E("__sim.G.words[1].found"), 'sliding back onto the last-but-one letter takes a letter off', w1)
    # a bonus word (a real word not in the crossword), if this page has one
    bon = E("(() => { const G = __sim.G; return G.subs.find(w => !G.words.some(q => q.w === w)) || null; })()")
    if bon:
        c0 = E("__sim.G.coins"); swipe(bon); ok(E("__sim.G.bonus").count(bon) == 1 and E("__sim.G.coins") == c0 + 1, 'a real word not in the crossword is a bonus: a coin', bon)
    # a made-up word spills a drop
    i0 = E("__sim.G.ink"); bad = E("(() => { const G = __sim.G, n = G.letters.length; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) { if (a === b || b === c || a === c) continue; const w = G.letters[a] + G.letters[b] + G.letters[c]; if (!__sim.WORDS.all.has(w)) return [a, b, c]; } })()")
    swipe(idx=bad); ok(E("__sim.G.ink") == i0 - 1 and E("__sim.G.spills") == 1, 'a made-up word spills a drop of ink', str(E("__sim.G.ink")))
    # the bulb: a letter shown, coins spent
    s0 = E("__sim.G.spent"); L = E("[__sim.lay().bulb.x, __sim.lay().bulb.y]"); pg.mouse.click(L[0], L[1]); pg.wait_for_timeout(150)
    ok(E("__sim.G.hints") == 1 and E("__sim.G.spent") > s0, 'the bulb shows a letter and costs coins', str(E("[__sim.G.hints, __sim.G.spent]")))
    # shuffle
    l0 = E("__sim.G.letters.join('')"); L = E("[__sim.lay().shuf.x, __sim.lay().shuf.y]"); changed = False
    for _ in range(4):
        pg.mouse.click(L[0], L[1]); pg.wait_for_timeout(100)
        if E("__sim.G.letters.join('')") != l0: changed = True; break
    ok(changed and sorted(E("__sim.G.letters")) == sorted(l0), 'the shuffle button turns the wheel (same letters)')
    # the whole crossword wins
    for q in E("__sim.G.words.filter(q => !q.found).map(q => q.w)"): swipe(q)
    pg.wait_for_timeout(2400); ok(E("__sim.G.over") == 'won', 'filling the whole crossword wins the page', str(E("__sim.G.over")))
    ok(bon is None or bon in E("__sim.store.get('book', [])"), 'bonus words go in your book')
    # out of ink: the page is lost
    E("__sim.go(4)"); pg.wait_for_timeout(300); E("__sim.G.ink = 1"); bad = E("(() => { const G = __sim.G, n = G.letters.length; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) { if (a === b || b === c || a === c) continue; const w = G.letters[a] + G.letters[b] + G.letters[c]; if (!__sim.WORDS.all.has(w)) return [a, b, c]; } })()")
    swipe(idx=bad); pg.wait_for_timeout(1500); ok(E("__sim.G.over") == 'lost', 'out of ink, the page is lost', str(E("__sim.G.over")))
    # while paused, nothing is spelled
    E("__sim.go(4)"); pg.wait_for_timeout(300); E("document.getElementById('pauseBtn').click()"); pg.wait_for_timeout(200); w0 = E("__sim.G.words[0].w"); swipe(w0); ok(not E("__sim.G.words[0].found"), 'while paused, nothing is spelled')
    # tiles
    E("localStorage.setItem('wl.stars', JSON.stringify({1: 3, 2: 3})); __sim.showAqua()"); pg.wait_for_timeout(200)
    ok(E("document.querySelectorAll('#aqGrid .aq').length") == E("__sim.TILES.length"), 'Your tiles lists every tile colour')
    E("document.querySelectorAll('#aqGrid .aq')[1].click()"); ok(E("__sim.myTile().id") == E("__sim.TILES[1].id"), 'tapping an open one picks it, and it is the one you play with')
    E("localStorage.setItem('wl.stars', '{}'); __sim.showAqua(); document.querySelectorAll('#aqGrid .aq')[3].click()"); ok(E("__sim.store.get('tile')") == E("__sim.TILES[1].id"), 'a locked one cannot be picked')
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
