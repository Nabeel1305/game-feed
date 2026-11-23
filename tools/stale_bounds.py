#!/usr/bin/env python3
"""His "skyscrapers randomly disappear if you play long enough" (Police Chase, 23 Nov 2026), looked for in every 3D game: a mesh of
many copies (InstancedMesh) that the game re-places as you travel keeps the bounding sphere three.js worked out the first time it
was drawn; once the copies have moved outside that sphere the whole mesh is culled whenever the OLD place is off the screen. Each
game is played by its robot for a while, then every such mesh is checked: are its copies still inside the sphere it is culled by?
python3 tools/stale_bounds.py [id ...]"""
import json, os, sys
from playwright.sync_api import sync_playwright
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
games = [g for g in json.load(open(R + '/games.json'))['games'] if (g['id'] in sys.argv[1:] if len(sys.argv) > 1 else g['number'] > 8)]
PLAY = """(sec) => { const S = __sim; window.__m = window.__m || {}; for (let i = 0; i < sec * 60; i++) { if (!S.G || S.G.over) break; try { S.honest(S.G, { react: 0.2, acc: 0.97 }, window.__m); } catch (e) {} try { S.step(1 / 60); } catch (e) { return 'ERR ' + String(e).slice(0, 80); } } return S.G && S.G.over ? String(S.G.over) : ''; }"""
CHECK = """() => { const W = { scene: (window.__scenes || []).slice().sort((a, b) => b.children.length - a.children.length)[0] || ((window.__sim && __sim.W3) || window.W3 || {}).scene }; if (!W.scene) return null; const T = window.THREE, out = [], v = new T.Vector3(), m4 = new T.Matrix4(); let n = 0;
  W.scene.traverse(o => { if (!o.isInstancedMesh || !o.visible || !o.count) return; n++; if (!o.frustumCulled || !o.boundingSphere) return; const bs = o.boundingSphere; let worst = 0;
    for (let i = 0; i < o.count; i += Math.max(1, Math.floor(o.count / 120))) { o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4); const sc = Math.abs(m4.elements[0]) + Math.abs(m4.elements[5]) + Math.abs(m4.elements[10]); if (sc < 1e-4) continue; worst = Math.max(worst, v.distanceTo(bs.center) - bs.radius); }
    if (worst > 2) out.push(Math.round(worst) + ' m outside (' + o.count + ' copies' + (o.name ? ', ' + o.name : '') + ')'); }); return [n, out]; }"""
nbad = 0
with sync_playwright() as p:
    b = p.chromium.launch(args=['--mute-audio'])
    for g in games:
        gid = g['id']; html = open(f'{R}/games/{gid}/index.html').read()
        if 'three' not in html[:400000].lower() and 'W3.init' not in html: print(gid, '2D'); continue
        side = 'ROTW' in html; pg = b.new_page(viewport={'width': 844, 'height': 390} if side else {'width': 390, 'height': 844}); pg.add_init_script("window.__fullGL = true; (() => { let T0; Object.defineProperty(window, 'THREE', { configurable: true, get() { return T0; }, set(v) { T0 = v; try { v.Scene = new Proxy(v.Scene, { construct(t, args) { const sc = new t(...args); (window.__scenes = window.__scenes || []).push(sc); return sc; } }); } catch (e) {} } }); })();"); res = None
        try:
            pg.goto(f'file://{R}/games/{gid}/index.html'); pg.wait_for_timeout(1200); pg.evaluate(f"localStorage.setItem('{g['storage_prefix']}taught', '9'); window.__m = {{}}; __sim.go(5)"); pg.wait_for_timeout(700)
            worst = []
            for rnd in range(3):
                r = pg.evaluate(PLAY, 25); pg.wait_for_timeout(450); res = pg.evaluate(CHECK)
                if res and res[1]: worst = res[1]
                if r: break
        except Exception as e: res = None; worst = ['EXC ' + str(e)[:80]]
        print(gid, 'no 3D scene found' if res is None and not worst else ('STALE ' + '; '.join(worst[:3]) if worst else f'ok ({res[0]} instanced)'), flush=True); nbad += bool(worst); pg.close()
    b.close()
sys.exit(1 if nbad else 0)
