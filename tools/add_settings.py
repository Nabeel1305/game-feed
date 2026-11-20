#!/usr/bin/env python3
"""Adds the Settings card to a game made from the kit (his rule, 20 Nov 2026: separate Music, Sound effects and Vibration
settings): a ⚙ button on the home card and in the pause menu, a card with Music / Sound effects / Vibration / Vibration
strength, saved with the game's own saves. The sound side is in tools/juice-kit.js (SET, applySet, music(), vibe()).
Safe to run twice. Run: python3 tools/add_settings.py <game id>   (or "kit" for the starter kit itself)"""
import os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = os.path.join(root, 'kit') if sys.argv[1] == 'kit' else os.path.join(root, 'games', sys.argv[1])
p1, p5 = os.path.join(d, 'part1.html'), os.path.join(d, 'part5.js')
a, b = open(p1).read(), open(p5).read()
if 'id="ovSet"' in a: print('already has Settings'); sys.exit(0)
def rep(s, old, new):
    assert old in s, old[:70]
    return s.replace(old, new, 1)
css = '.setrow{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;font-size:16px;font-weight:800;text-align:left}.tog{min-width:96px;border:0;border-radius:12px;padding:11px 10px;font:inherit;font-weight:800;font-size:15px;background:var(--acc);color:#1d1204;cursor:pointer}.tog.off{background:rgba(255,255,255,.14);color:var(--ink)}\n</style>'
a = rep(a, '</style>', css)
a = rep(a, '<button class="snd" id="sndBtn" aria-label="Sound">🔊</button>', '<button class="snd" id="sndBtn" aria-label="Sound">🔊</button>\n  <button class="snd" id="setBtn" aria-label="Settings" style="right:62px">⚙</button>')
card = '''<div class="ov hidden" id="ovSet">
  <div class="card">
    <h2 class="tf">SETTINGS</h2>
    <div class="setrow"><span>🎵 Music</span><button class="tog" id="tMus"></button></div>
    <div class="setrow"><span>🔊 Sound effects</span><button class="tog" id="tSfx"></button></div>
    <div class="setrow"><span>📳 Vibration</span><button class="tog" id="tVib"></button></div>
    <div class="setrow"><span>Vibration strength</span><button class="tog" id="tVk"></button></div>
    <button class="btn" id="setBack">Done</button>
  </div>
</div>

<div class="ov hidden" id="ovPause">'''
a = rep(a, '<div class="ov hidden" id="ovPause">', card)
a = rep(a, '<button class="btn ghost quiet" id="pTut">🎓 Tutorial</button>', '<button class="btn ghost quiet" id="pTut">🎓 Tutorial</button>\n    <button class="btn ghost quiet" id="pSet">⚙ Settings</button>')
b = rep(b, "].forEach(key => $(key).classList.toggle('hidden', key !== id)); }", ", 'ovSet'].forEach(key => $(key).classList.toggle('hidden', key !== id)); }")
code = '''// ---------- settings: Music, Sound effects, Vibration (his rule, 20 Nov 2026; the sound side is in the juice kit) ----------
Object.assign(SET, store.get('settings', {}) || {});
let setFrom = 'ovHome';
function renderSet() { const t = (id, on, txt) => { $(id).textContent = txt || (on ? 'ON' : 'OFF'); $(id).classList.toggle('off', !on); }; t('tMus', SET.mus); t('tSfx', SET.sfx); t('tVib', SET.vib); t('tVk', SET.vib, SET.vk < 0.8 ? 'LOW' : SET.vk > 1.2 ? 'STRONG' : 'NORMAL'); }
function openSet(from) { setFrom = from; renderSet(); show('ovSet'); }
const saveSet = () => { store.set('settings', SET); applySet(); renderSet(); };
$('setBtn').onclick = () => { audio(); sfx.click(); openSet('ovHome'); };
$('pSet').onclick = () => { sfx.click(); openSet('ovPause'); };
$('tMus').onclick = () => { audio(); SET.mus = !SET.mus; saveSet(); };
$('tSfx').onclick = () => { audio(); SET.sfx = !SET.sfx; saveSet(); if (SET.sfx) sfx.click(); };
$('tVib').onclick = () => { SET.vib = !SET.vib; saveSet(); vibe(HAP.light); };
$('tVk').onclick = () => { SET.vk = SET.vk < 0.8 ? 1 : SET.vk > 1.2 ? 0.5 : 1.6; saveSet(); vibe(HAP.thud); };
$('setBack').onclick = () => { sfx.click(); show(setFrom); };
window.gameFeedSettings = () => openSet(G && !G.over ? 'ovPause' : 'ovHome');
'''
last = 'applyStep(); showHome(); requestAnimationFrame(frame);'
b = rep(b, last, code + last)
open(p1, 'w').write(a); open(p5, 'w').write(b); print('Settings added to', d)
