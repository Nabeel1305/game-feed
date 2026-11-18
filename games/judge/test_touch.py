#!/usr/bin/env python3
"""The Bench with real touches and a real keyboard: the case file shows; typing a sentence and tapping PASS SENTENCE shows the
clerk's reading; Change goes back to the box with the words kept; CONFIRM passes it (the gavel), and the next case comes;
an empty box does not pass. Screenshots of the court and the council's report. No JavaScript errors.
Run: python3 games/judge/test_touch.py"""
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
    pg.evaluate("localStorage.setItem('jd.taught', '3'); __sim.go(1);"); pg.wait_for_timeout(800)
    ok(pg.is_visible('#caseCard') and 'R v' in pg.inner_text('#caseCard'), 'the case file shows')
    pg.screenshot(path='/tmp/jt/court.png')
    pg.tap('#passBtn'); pg.wait_for_timeout(300); ok(pg.evaluate("__sim.G.done.length") == 0 and pg.is_visible('#sentText'), 'an empty box does not pass')
    pg.tap('#sentText'); pg.keyboard.type('a £200 fine and £100 compensation'); pg.tap('#passBtn'); pg.wait_for_timeout(400)
    rb = pg.inner_text('#readBack'); ok(pg.is_visible('#readBack') and '£200 fine' in rb, 'PASS SENTENCE: the clerk reads it back', rb)
    pg.screenshot(path='/tmp/jt/readback.png')
    pg.tap('#editBtn'); pg.wait_for_timeout(200); ok(pg.is_visible('#sentText') and 'fine' in pg.input_value('#sentText'), 'Change: back to the box, the words kept')
    pg.tap('#passBtn'); pg.wait_for_timeout(400); first = pg.evaluate("__sim.G.case.id"); pg.tap('#confBtn'); pg.wait_for_timeout(300)
    ok(pg.evaluate("__sim.G.done.length") == 1, 'CONFIRM passes the sentence')
    pg.wait_for_timeout(2000); ok(pg.evaluate("__sim.G.case.id") != first and pg.input_value('#sentText') == '', 'the next case comes, the box empty')
    for i in range(4):
        pg.tap('#sentText'); pg.keyboard.type('6 months in prison suspended for a year'); pg.tap('#passBtn'); pg.wait_for_timeout(300); pg.tap('#confBtn'); pg.wait_for_timeout(2000)
    pg.wait_for_timeout(1500); ok(pg.is_visible('#ovEnd') and pg.locator('#eCouncil .cs').count() == 5, "after five, the council's report: five cases marked")
    pg.screenshot(path='/tmp/jt/council.png', full_page=True)
    ok(not errs, 'no JavaScript errors', str(errs[:3])); b.close()
print(f'\n{oks} passed, {len(fails)} failed'); sys.exit(1 if fails else 0)
