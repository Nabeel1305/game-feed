#!/usr/bin/env python3
"""Tests the feed app the way a thumb would use it, in a phone-sized browser.

Builds the app, then checks: every game starts inside the feed from one tap, a game freezes completely
when he swipes away or the app is hidden (frames, timers, clock, sound) and carries on from the same
instant, swiping (on the card and on the bar), the order (shuffled, no repeats until all are seen),
pin, search, the break card after ten games, the back button, the phone-app way of loading (file://),
and the fallback way of loading a game. Any JavaScript error in the feed or in a game fails the test.
Run: python3 tools/test_feed.py            (add an id to test only that game's start)"""
import json, os, sys, threading, http.server, functools, time

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, 'tools'))
import build_feed

OUT = os.path.join(root, 'out', 'app')
W, H = 390, 844
fails, oks = [], 0


def ok(cond, what, detail=''):
    global oks
    if cond: oks += 1
    else:
        fails.append(what + (f' ({detail})' if detail else ''))
        print('  FAIL', what, detail)
    return cond


class Touch:
    def __init__(self, page):
        self.pg, self.cdp = page, page.context.new_cdp_session(page)
    def _send(self, kind, pts):
        self.cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': 1} for x, y in pts]})
    def swipe(self, x, y0, y1, ms=160):
        self._send('touchStart', [(x, y0)])
        n = max(3, ms // 16)
        for k in range(1, n + 1):
            self.pg.wait_for_timeout(16)
            self._send('touchMove', [(x, y0 + (y1 - y0) * k / n)])
        self._send('touchEnd', [])
        self.pg.wait_for_timeout(450)
    def tap(self, x, y):
        self._send('touchStart', [(x, y)]); self.pg.wait_for_timeout(40); self._send('touchEnd', []); self.pg.wait_for_timeout(60)


def state(pg):
    return pg.evaluate('window.__feed.state()')


def game_frame(pg):
    h = pg.evaluate_handle('(() => { const s = window.__feed.cur(); return s && s.frame; })()').as_element()
    return h.content_frame() if h else None


def wait_ready(pg, ms=6000):
    t = time.time()
    while time.time() - t < ms / 1000:
        if state(pg)['ready']: return True
        pg.wait_for_timeout(60)
    return False


def open_feed(browser, url, errs, **kw):
    ctx = browser.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, has_touch=True, is_mobile=True, **kw)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('error: ' + str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
    pg.goto(url)
    pg.wait_for_function('window.__feed && window.__feed.cur()')
    return ctx, pg


def main():
    from playwright.sync_api import sync_playwright
    listing, notes, problems = build_feed.build(OUT)
    if problems:
        print('build problems:', problems); sys.exit(1)
    games = [g for g in json.load(open(os.path.join(root, 'games.json')))['games'] if g['status'] in build_feed.IN_FEED]
    byid = {g['id']: g for g in games}
    only = [a for a in sys.argv[1:] if not a.startswith('-')]
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=OUT))
    srv.handle_error = lambda *a: None          # a page dropping a request it no longer needs (a clip, when its card is left) is not news
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    os.makedirs(os.path.join(root, 'out', 'feed'), exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])

        # 1. every game: one tap on its card starts it; it freezes and carries on
        print('Every game starts from its card, freezes and carries on:')
        restart_took = []
        for g in games:
            if only and g['id'] not in only: continue
            errs = []
            ctx, pg = open_feed(b, base + '#' + g['id'], errs)
            t = Touch(pg)
            st = state(pg)
            ok(st['id'] == g['id'] and st['state'] == 'cover', f"{g['id']}: opens on its card", str(st))
            ok(wait_ready(pg), f"{g['id']}: loads behind its card")
            pg.wait_for_timeout(900)
            fr = game_frame(pg)
            d = fr.evaluate('window.GameFeed.debug()')
            ok(d['paused'], f"{g['id']}: held still while its card is showing")
            pg.screenshot(path=os.path.join(root, 'out', 'feed', g['id'] + '-card.png'))
            t.tap(W / 2, 330)
            # straight into the action: live play within a second of the tap, with no menu, count or intro to wait through
            live, t0, took = (g.get('feed') or {}).get('live'), time.time(), None
            while live and time.time() - t0 < 3:
                try:
                    if fr.evaluate(live): took = time.time() - t0; break
                except Exception: pass
                pg.wait_for_timeout(40)
            ok(not live or (took is not None and took <= 1.0), f"{g['id']}: he is playing within a second of the tap", 'never got going' if took is None else f'took {took:.2f} s')
            pg.wait_for_timeout(max(0, 1300 - int((time.time() - t0) * 1000)))
            st = state(pg)
            ok(st['state'] == 'playing' and st['started'] is True, f"{g['id']}: one tap starts it", str(st))
            sels = (g.get('feed') or {}).get('start') or ['#playBtn']
            ok(not fr.locator(sels[-1]).is_visible(), f"{g['id']}: its own menu is gone, play has begun")
            pg.screenshot(path=os.path.join(root, 'out', 'feed', g['id'] + '-play.png'))
            d = fr.evaluate('window.GameFeed.debug()')
            ok(d['soundOn'] and d['wired'] and len(d['knobs']) > 0 and all(k == 1 for k in d['knobs']), f"{g['id']}: its sound goes out through the app's sound switch", str(d))
            # frozen means frozen
            fr.evaluate('window.__n = 0; window.__tk = 0; (function f() { window.__n++; requestAnimationFrame(f); })(); setInterval(() => window.__tk++, 50)')
            pg.wait_for_timeout(300)
            ok(fr.evaluate('window.__n') > 2, f"{g['id']}: runs while playing")
            pg.evaluate('window.__feed.halt()')
            pg.wait_for_timeout(120)
            n0, k0, c0 = fr.evaluate('[window.__n, window.__tk, performance.now()]')
            pg.wait_for_timeout(700)
            n1, k1, c1 = fr.evaluate('[window.__n, window.__tk, performance.now()]')
            d = fr.evaluate('window.GameFeed.debug()')
            ok(n1 == n0 and k1 == k0 and c1 == c0, f"{g['id']}: frozen solid when paused", f'frames {n0}->{n1}, timers {k0}->{k1}, clock {c0:.0f}->{c1:.0f}')
            ok(all(x != 'running' for x in d['sound']), f"{g['id']}: silent when paused", str(d['sound']))
            ok(state(pg)['halted'], f"{g['id']}: shows Paused")
            pg.evaluate('window.__feed.carryOn()')
            pg.wait_for_timeout(400)
            n2, k2, c2 = fr.evaluate('[window.__n, window.__tk, performance.now()]')
            ok(n2 > n1 + 2 and k2 > k1 and 150 < c2 - c1 < 2000, f"{g['id']}: carries on from the same instant", f'frames {n1}->{n2}, clock moved {c2 - c1:.0f} ms')
            d = fr.evaluate('window.GameFeed.debug()')
            ok(len(d['sound']) == 0 or 'running' in d['sound'], f"{g['id']}: sound is back", str(d['sound']))
            # the game's own "page hidden" pause must not pile up on top of the feed's
            fr.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden")
            pg.wait_for_timeout(150)
            ok(fr.locator('#ovPause').count() == 0 or not fr.locator('#ovPause').is_visible(), f"{g['id']}: its own pause screen stays out of the feed's way")
            # carrying on: fast or two-thumb games count 3, 2, 1 first
            feed = g.get('feed') or {}
            quick = feed.get('thumbs', 1) == 2 or feed.get('intensity', 3) >= 4
            pg.evaluate('window.__feed.halt()'); pg.wait_for_timeout(100)
            pg.click('.slide.halt [data-act="continue"]'); pg.wait_for_timeout(250)
            if quick:
                ok(state(pg)['state'] == 'paused' and pg.locator('.slide.halt .paused.count').count() == 1, f"{g['id']}: counts 3, 2, 1 before carrying on")
                if g['id'] == games[-1]['id']: pg.screenshot(path=os.path.join(root, 'out', 'feed', 'count-in.png'))
                pg.wait_for_timeout(1500)
            ok(state(pg)['state'] == 'playing' and not fr.evaluate('window.GameFeed.debug().paused'), f"{g['id']}: Resume carries on" + ('' if quick else ' straight away'))
            # the basic controls, in the same place for every game: Pause on the bar, then Resume, Restart or Levels
            gid = g['id']
            pg.click('#pauseBtn'); pg.wait_for_timeout(150)
            ok(state(pg)['state'] == 'playing', f"{gid}: one stray tap on Pause mid-game does nothing")
            pg.click('#pauseBtn'); pg.wait_for_timeout(200)
            ok(state(pg)['state'] == 'paused' and state(pg)['halted'], f"{gid}: Pause on the bar pauses it")
            acts = pg.evaluate("Array.from(document.querySelectorAll('.slide.halt .paused [data-act]')).filter(b => b.getClientRects().length).map(b => b.dataset.act)")
            ok(acts == ['continue', 'restart', 'levels'], f"{gid}: the Paused card offers Resume, Restart and Levels", str(acts))
            if gid == games[0]['id']: pg.screenshot(path=os.path.join(root, 'out', 'feed', 'paused-card.png'))
            # Restart: a fresh match, straight into play
            pg.click('.slide.halt [data-act="restart"]')
            t0, took = time.time(), None
            while time.time() - t0 < 5:
                try:
                    fr = game_frame(pg)
                    if fr and state(pg)['state'] == 'playing' and state(pg)['started'] and (not live or fr.evaluate(live)): took = time.time() - t0; break
                except Exception: pass
                pg.wait_for_timeout(50)
            ok(took is not None and took < 4, f"{gid}: Restart goes straight into a fresh match", 'never got going' if took is None else f'took {took:.2f} s')
            restart_took.append(round(took or 9, 2))
            # Levels: the game's own level list opens; Back shows the game's pause menu; Resume carries the same match on
            pg.wait_for_timeout(300)
            pg.evaluate('window.__feed.halt()'); pg.wait_for_timeout(120)
            pg.click('.slide.halt [data-act="levels"]'); pg.wait_for_timeout(400)
            bc = gid == 'bottle-cap-flick'
            lv, pm = ('#levels', '#pause') if bc else ('#ovLevels', '#ovPause')
            ok(state(pg)['state'] == 'playing' and not fr.evaluate('window.GameFeed.debug().paused') and fr.locator(lv).is_visible(), f"{gid}: Levels opens the game's own level list")
            if gid == games[1]['id']: pg.screenshot(path=os.path.join(root, 'out', 'feed', 'levels-in-feed.png'))
            fr.click('#lvBack' if gid in ('bottle-cap-flick', 'knockout') else '#ovLevels [data-back]'); pg.wait_for_timeout(150)
            ok(fr.locator(pm).is_visible() and not fr.locator(lv).is_visible(), f"{gid}: Back from the list shows the game's pause menu")
            fr.click('#pResume'); pg.wait_for_timeout(200)
            ok(not fr.locator(pm).is_visible() and state(pg)['state'] == 'playing', f"{gid}: and Resume carries the match on")
            pg.wait_for_timeout(1200)
            ok(not errs, f"{g['id']}: no errors", '; '.join(errs[:3]))
            print(f"  {'ok  ' if not any(g['id'] in f for f in fails) else 'FAIL'} #{g['number']} {g['name']}")
            ctx.close()
        print('  Restart to live play took', restart_took, 'seconds')
        if only:
            b.close(); srv.shutdown(); finish(); return

        # 2. swiping, order, pause on leaving
        print('Swiping and order:')
        errs = []
        ctx, pg = open_feed(b, base, errs)
        t = Touch(pg)
        seen = [state(pg)['id']]
        for i in range(len(games) - 1):
            t.swipe(W / 2, 600, 200)
            seen.append(state(pg)['id'])
        ok(len(set(seen)) == len(games), 'a swipe up on the card goes to the next game; all games come up before any repeats', str(seen))
        more = []
        for i in range(len(games) + 2):
            t.swipe(W / 2, 600, 200); more.append(state(pg)['id'])
        allseen = seen + more
        ok(all(allseen[i] != allseen[i + 1] for i in range(len(allseen) - 1)), 'never the same game twice in a row', str(allseen))
        p0 = state(pg)['pos']
        t.swipe(W / 2, 250, 650)
        ok(state(pg)['pos'] == p0 - 1 and state(pg)['id'] == allseen[-2], 'a swipe down goes back to the last game')
        t.swipe(W / 2, 500, 440, 200)
        ok(state(pg)['pos'] == p0 - 1, 'a short drag does not change game')
        # play, then leave by swiping on the bar: the game must freeze, and wait for him
        wait_ready(pg); t.tap(W / 2, 330); pg.wait_for_timeout(900)
        ok(state(pg)['state'] == 'playing', 'tap to play after swiping around')
        fr = game_frame(pg)
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'bar-quiet.png'))
        t.swipe(W / 2, H - 28, H - 28 - 420)
        ok(state(pg)['pos'] == p0, 'a swipe up on the bar leaves a running game')
        ok(fr.evaluate('window.GameFeed.debug().paused'), 'the game he left is frozen')
        t.swipe(W / 2, 250, 650)
        st = state(pg)
        ok(st['pos'] == p0 - 1 and st['state'] == 'paused' and st['halted'], 'coming back shows it paused', str(st))
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'paused.png'))
        pg.click('.slide.halt [data-act="continue"]'); pg.wait_for_timeout(1900)
        ok(state(pg)['state'] == 'playing' and not fr.evaluate('window.GameFeed.debug().paused'), 'Resume carries on')
        # a stray thumb on the bar mid-game does nothing; a second tap works
        pg.click('#libBtn'); pg.wait_for_timeout(200)
        ok(not pg.evaluate("document.querySelector('#lib').classList.contains('open')") and state(pg)['state'] == 'playing', 'one stray tap on the bar mid-game opens nothing')
        pg.click('#libBtn'); pg.wait_for_timeout(350)
        ok(pg.evaluate("document.querySelector('#lib').classList.contains('open')") and state(pg)['state'] == 'paused', 'a second tap opens the games list and pauses the game')
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'games-list.png'))

        # 3. search, pin, jump
        print('Search and pin:')
        ok(pg.locator('#list .row').count() == len(games), 'the list shows every game')
        pg.fill('#q', games[-1]['name'][:5].lower()); pg.wait_for_timeout(100)
        rows = pg.locator('#list .row')
        ok(rows.count() >= 1 and rows.first.get_attribute('data-id') == games[-1]['id'], 'search by name finds the game')
        pg.fill('#q', '#%d' % games[0]['number']); pg.wait_for_timeout(100)
        ok(pg.locator('#list .row').first.get_attribute('data-id') == games[0]['id'], 'search by number finds the game')
        pg.fill('#q', 'zzzz'); pg.wait_for_timeout(100)
        ok(pg.locator('#list .none').count() == 1, 'a search with no match says so')
        pg.fill('#q', ''); pg.wait_for_timeout(100)
        target = next(g for g in games if g['id'] != state(pg)['id'])
        pg.click(f'#list .row[data-id="{target["id"]}"] .pin'); pg.wait_for_timeout(100)
        ok(state(pg)['pins'] == [target['id']] and pg.locator('#list .sect').first.inner_text().strip().lower() == 'pinned', 'pin from the list; pinned games are listed first')
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'games-list-pinned.png'))
        pg.click(f'#list .row[data-id="{target["id"]}"] .open'); pg.wait_for_timeout(700)
        st = state(pg)
        ok(st['id'] == target['id'] and st['state'] == 'cover' and not pg.evaluate("document.querySelector('#lib').classList.contains('open')"), 'tapping a game in the list goes to it', str(st))
        ok(pg.evaluate("document.querySelector('#pinBtn').classList.contains('on')"), 'the bar shows it is pinned')
        nxt = pg.evaluate('window.__feed.hist[window.__feed.pos + 1].id')
        pg.evaluate(f"window.__feed.jump('{nxt}')"); pg.wait_for_timeout(700)
        ids = pg.evaluate('window.__feed.hist.map(e => e.id || e.type)')
        ok(state(pg)['id'] == nxt and all(ids[i] != ids[i + 1] for i in range(len(ids) - 1)), 'picking the game that was coming up next does not show it twice', str(ids))
        pg.evaluate(f"window.__feed.jump('{target['id']}')"); pg.wait_for_timeout(700)
        ok(state(pg)['id'] == target['id'], 'back on the pinned game')
        pg.click('#pinBtn'); pg.wait_for_timeout(100)
        ok(state(pg)['pins'] == [], 'tapping Pin on the bar unpins')
        pg.click('#pinBtn'); pg.wait_for_timeout(100)
        pg.reload(); pg.wait_for_function('window.__feed && window.__feed.cur()')
        ok(state(pg)['pins'] == [target['id']], 'pins are remembered after closing')
        ok(pg.evaluate("Object.keys(window.__feed.stats).length") > 0, 'play history is being kept for later tuning')

        # 4. the back button and hiding the app
        t = Touch(pg)
        wait_ready(pg); t.tap(W / 2, 330); pg.wait_for_timeout(700)
        ok(pg.evaluate('window.gameFeedBack()') is True and state(pg)['state'] == 'paused', 'the back button pauses a running game')
        ok(pg.evaluate('window.gameFeedBack()') is False, 'back again is left to the phone (leaves the app)')
        ok(not errs, 'no errors while swiping, searching and pinning', '; '.join(errs[:3]))
        ctx.close()

        # 4b. the one sound switch for the whole app
        print('Sound switch:')
        LISTEN = """async () => {
            const c = window.GameFeed.contexts()[0];
            const ear = c.createAnalyser(); ear.fftSize = 2048;
            c.__gfKnob.connect(ear);                               // listen where the speaker is
            const o = c.createOscillator(), g = c.createGain();
            g.gain.value = 0.2; o.connect(g); g.connect(c.destination);   // a test tone, sent out the way every game sends its sound
            o.start();
            await new Promise(r => setTimeout(r, 300));
            const buf = new Float32Array(ear.fftSize); ear.getFloatTimeDomainData(buf);
            o.stop();
            return Math.max(...buf.map(Math.abs));
        }"""
        errs = []
        ctx, pg = open_feed(b, base + '#' + games[1]['id'], errs)
        t = Touch(pg)
        ok(pg.get_attribute('#soundBtn', 'aria-pressed') == 'true' and pg.inner_text('#soundTxt').strip().lower() == 'sound', 'sound starts on')
        pg.click('#soundBtn'); pg.wait_for_timeout(200)
        ok(pg.evaluate('window.__feed.soundOn') is False and pg.get_attribute('#soundBtn', 'aria-pressed') == 'false' and pg.inner_text('#soundTxt').strip().lower() == 'muted',
           'one tap on Sound turns sound off, and the bar shows it')
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'sound-off.png'))
        wait_ready(pg); pg.wait_for_timeout(600); t.tap(W / 2, 330); pg.wait_for_timeout(1200)
        fr = game_frame(pg)
        d = fr.evaluate('window.GameFeed.debug()')
        ok(state(pg)['state'] == 'playing' and d['soundOn'] is False and d['wired'] and len(d['knobs']) > 0 and all(k == 0 for k in d['knobs']), 'a game started with sound off is silent from its first moment', str(d))
        ok(fr.evaluate(LISTEN) < 0.001, 'nothing at all reaches the speaker')
        pg.click('#soundBtn'); pg.wait_for_timeout(250)
        ok(pg.evaluate('window.__feed.soundOn') is False, 'mid-game, one stray tap on Sound changes nothing')
        pg.click('#soundBtn'); pg.wait_for_timeout(350)
        loud = fr.evaluate(LISTEN)
        ok(pg.evaluate('window.__feed.soundOn') is True and loud > 0.05, 'a second tap turns sound back on while playing', f'heard {loud:.3f}')
        pg.click('#soundBtn'); pg.wait_for_timeout(350)
        ok(pg.evaluate('window.__feed.soundOn') is False and fr.evaluate(LISTEN) < 0.001, 'and off again while playing')
        first = state(pg)['id']
        t.swipe(W / 2, H - 28, H - 28 - 420)
        wait_ready(pg); pg.wait_for_timeout(600); t.tap(W / 2, 330); pg.wait_for_timeout(1200)
        fr2 = game_frame(pg)
        d = fr2.evaluate('window.GameFeed.debug()')
        ok(state(pg)['id'] != first and state(pg)['state'] == 'playing' and d['soundOn'] is False and all(k == 0 for k in d['knobs']) and fr2.evaluate(LISTEN) < 0.001,
           'off means off for every game: the next game is silent too', str(d))
        pg.reload(); pg.wait_for_function('window.__feed && window.__feed.cur()')
        ok(pg.evaluate('window.__feed.soundOn') is False and pg.get_attribute('#soundBtn', 'aria-pressed') == 'false', 'the choice is remembered after closing the app')
        pg.click('#soundBtn'); pg.wait_for_timeout(200)
        ok(pg.evaluate('window.__feed.soundOn') is True, 'and one tap brings sound back')
        ok(not errs, 'no errors with the sound switch', '; '.join(errs[:3]))
        ctx.close()

        # 5. the break card after ten games
        print('Break card:')
        errs = []
        ctx, pg = open_feed(b, base, errs)
        t = Touch(pg)
        for i in range(10):
            wait_ready(pg); t.tap(W / 2, 330); pg.wait_for_timeout(350)
            ok(state(pg)['state'] == 'playing', f'game {i + 1} of the set starts') if i in (0, 9) else None
            t.swipe(W / 2, H - 28, H - 28 - 420)
        t.swipe(W / 2, 600, 200)
        types = pg.evaluate('window.__feed.hist.map(e => e.type)')
        ok('set' in types and types.index('set') in (10, 11), 'the break card comes after about ten games', str(types))
        while state(pg)['type'] != 'set' and state(pg)['pos'] < 14: t.swipe(W / 2, 600, 200)
        ok(state(pg)['type'] == 'set', 'reached the break card')
        pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'break-card.png'))
        pg.click('[data-act="keep"]'); pg.wait_for_timeout(600)
        st = state(pg)
        ok(st['type'] == 'game' and st['setPlays'] == 0, 'Keep going moves on and starts a new set', str(st))
        ok(not errs, 'no errors through a whole set', '; '.join(errs[:3]))
        ctx.close()

        # 6. the way the phone app loads it: straight from files, where the feed and the games cannot touch each other
        print('Phone-app loading (file://):')
        errs = []
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, has_touch=True, is_mobile=True)
        # the phone app gives every page a GameNative object (vibration goes through it, not through the browser)
        ctx.add_init_script("window.GameNative = { vibrate(p) { try { top.postMessage({ vib: 1 }, '*'); } catch (e) {} }, close() {} }; window.addEventListener('message', e => { if (e.data && e.data.vib) window.__vib = (window.__vib || 0) + 1; });")
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('error: ' + str(e)))
        pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' else None)
        pg.goto('file://' + os.path.join(OUT, 'index.html') + '#' + games[-1]['id'])
        pg.wait_for_function('window.__feed && window.__feed.cur()')
        t = Touch(pg)
        ok(wait_ready(pg), 'a game loads from files')
        pg.wait_for_timeout(800)
        t.tap(W / 2, 330); pg.wait_for_timeout(1200)
        st = state(pg)
        ok(st['state'] == 'playing' and st['started'] is True, 'and starts from one tap', str(st))
        fr = game_frame(pg)
        ok(not fr.locator(((games[-1].get('feed') or {}).get('start') or ['#playBtn'])[-1]).is_visible(), 'and is really in play')
        pg.evaluate('window.__feed.halt()'); pg.wait_for_timeout(150)
        c0 = fr.evaluate('performance.now()'); pg.wait_for_timeout(400); c1 = fr.evaluate('performance.now()')
        ok(c0 == c1, 'and freezes')
        pg.evaluate('window.__feed.setSound(false)'); pg.wait_for_timeout(200)
        ok(fr.evaluate('window.GameFeed.debug().soundOn') is False and all(k == 0 for k in fr.evaluate('window.GameFeed.debug().knobs')), 'and the sound switch reaches the game')
        pg.evaluate('window.__feed.setSound(true)'); pg.wait_for_timeout(100)
        ok(fr.evaluate("(() => { try { localStorage.setItem('gf.t', '1'); return localStorage.getItem('gf.t'); } catch (e) { return 'ERR ' + e.name; } })()") == '1', 'and a game can save its progress')
        ok((pg.evaluate('window.__vib || 0')) > 0, 'and vibration goes through the phone app')
        t.swipe(W / 2, H - 28, H - 28 - 420)
        ok(state(pg)['pos'] == 1, 'and swipes on')
        ok(not errs, 'no errors when loaded from files', '; '.join(errs[:3]))
        ctx.close()

        # 7. if a game's page will not open the normal way, the feed hands it over as text instead
        print('Fallback loading:')
        errs = []
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('error: ' + str(e)))
        gid = games[1]['id']
        pg.route(f'**/games/{gid}/index.html', lambda r: r.abort() if r.request.resource_type == 'document' else r.continue_())
        pg.goto(base + '#' + gid)
        pg.wait_for_function('window.__feed && window.__feed.cur()')
        ok(wait_ready(pg, 12000), 'the game still loads')
        t = Touch(pg); pg.wait_for_timeout(800); t.tap(W / 2, 330); pg.wait_for_timeout(1200)
        st = state(pg)
        ok(st['state'] == 'playing' and st['started'] is True, 'and still starts', str(st))
        ok(not errs, 'no errors with fallback loading', '; '.join(errs[:3]))
        ctx.close()

        # 8. a game that cannot load at all says so and the feed carries on
        errs = []
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = ctx.new_page()
        pg.route(f'**/games/{gid}/index.html', lambda r: r.abort())
        pg.goto(base + '#' + gid)
        pg.wait_for_function('window.__feed && window.__feed.cur()')
        t = Touch(pg); pg.wait_for_timeout(500); t.tap(W / 2, 330)
        pg.wait_for_timeout(11500)
        ok(pg.evaluate("window.__feed.cur().el.classList.contains('failed')"), 'a game that cannot load says so on its card')
        pg.screenshot(path=os.path.join(root, 'out', 'feed', 'did-not-load.png'))
        t.swipe(W / 2, 600, 200)
        ok(state(pg)['pos'] == 1, 'and he can swipe on')
        ctx.close()
        b.close()
    srv.shutdown()
    finish()


def finish():
    if fails:
        print(f'\nFEED PROBLEMS ({len(fails)}):')
        [print(' -', f) for f in fails]
        sys.exit(1)
    print(f'\nFeed passed: {oks} checks.')


if __name__ == '__main__':
    main()
