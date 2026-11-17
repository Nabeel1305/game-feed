#!/usr/bin/env python3
"""Screenshots of a 3D game with the real picture (window.__fullGL), side by side: python3 tools/shots3d.py <id> "js1|||js2" out.png
Each js runs in turn (use __sim.go(N), __sim.adv(sec) to move the game on, __sim.ui.snap = true to put the camera where it is going)."""
import sys
from playwright.sync_api import sync_playwright
from PIL import Image
gid = sys.argv[1]; jss = sys.argv[2].split('|||'); out = sys.argv[3]
imgs = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 390, 'height': 844}); pg.add_init_script('window.__fullGL = true'); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e) + ' ' + (e.stack or '')[:300]))
    pg.goto('file:///home/claude/game-feed/games/%s/index.html' % gid); pg.wait_for_timeout(1500)
    for i, js in enumerate(jss):
        r = pg.evaluate(js); pg.wait_for_timeout(700); f = '/tmp/_g%d.png' % i; pg.screenshot(path=f); imgs.append(Image.open(f).resize((260, 563))); print(i, r)
    print('errors', errs[:3]); b.close()
W = Image.new('RGB', (260 * len(imgs), 563))
for i, im in enumerate(imgs): W.paste(im, (260 * i, 0))
W.save(out)
