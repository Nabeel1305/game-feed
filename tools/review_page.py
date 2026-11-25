#!/usr/bin/env python3
"""Builds the Game Review page (his ask, 22 Nov 2026): one page with every game after the originals: its name, a PLAY button (the
game opens inside the page, with a Notes button above it), what was changed, what is still on my list, and two boxes for his
notes: CRITICAL FLAWS (nearly unplayable) and FLAWS (would make it much better). His notes are kept on his phone as he types;
COPY MY NOTES puts them all in one message to paste back in the chat. Output: out/review/ (index.html + games/<id>/index.html).
Run: python3 tools/review_page.py"""
import json, os, re, shutil, html
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(R + '/games.json')); games = [g for g in d['games'] if g['number'] >= 9]
aud = open(R + '/specs/audit-2026-11-22.md').read().split('## Done on')[0]
seen = {}
for m in re.finditer(r'^- (\d+) [^:\n]+: ((?:.+\n)(?:  .+\n)*)', aud, re.M): seen[int(m.group(1))] = ' '.join(m.group(2).split())
FIXED = {
 'mocktail': 'REBUILT. First person: you look down at the glass. Real-looking drinks: colour bands, a shining surface, bubbles, ice, a bottle that pours. Easy controls: hold a bottle to pour, tap everything else, hold STIR and SHAKE. The next thing to touch glows.',
 'hunter': 'NEW CONTROLS. Left thumb: a stick (gentle push creeps, full push runs and it hears you). Right thumb: drag the crosshair (green on the chest), tap THROW. Lion: tap its side, then tap when it leaps. A closer view and shorter grass.',
 'eleven': 'Team-mates now run into space to give you a pass. Coloured rings under both teams, a white ring on who your pass goes to, bigger players, closer camera. No SPRINT button: push the stick all the way. The first levels are easier to score in.',
 'hoops3': 'Team-mates spread out and get free for a pass, and cut to the basket when marked. No SPRINT button: push the stick all the way.',
 'hockey': 'New light and music. (My change to its team-mates was taken back: testing showed it let button-mashing win now and then.)',
 'cake': 'The icing is smooth now, not square blocks.', 'roller': 'Paint goes on smooth, not in square pixels.',
 'pilot': 'Night and storm landings: the runway lights now shine through the dark and you can read the land.',
 'vine': 'A closer camera and a soft light on the swinger: you can see yourself at dusk and at night. A vine can no longer hang across the view.',
 'judge': 'No typing needed: tap + Prison, + Fine and so on, then − and + to set the amount. (Typing still works.)',
 'convoy': 'Thirteen buttons down to a few: the wheel, PING, DROP, one SPEED button, one DEPTH button. GUN and CREW only show when they are needed. The sea is blue now, not a glare.',
 'gridiron': 'Bigger players on team-colour discs. No SPRINT button: push the stick all the way. Receivers now work to get open after their route.',
 'sprint': 'The camera at the start is behind your shoulder looking down your lane; after the line it comes round to face you.',
 'drone': 'NEW CONTROLS, one thumb: hold it down to fly forwards, slide to turn and climb, lift to brake. (It was two sticks.)',
 'roach': 'A closer camera. No SPRINT button: push the stick all the way.',
 'tag': 'A DASH button. (It was a hidden double tap.)', 'balloon': 'A VENT button. (It was a hidden flick down.)',
 'reel': 'Tap to strike when the float goes under. (It was a flick up.)',
 'surf': 'Hold PADDLE and let go when the ring turns green: you stand up. Tap to spin in the air. (Both were swipes.)',
 'wolf': 'A BITE button that glows when you are beside her. (It was a flick.)',
 'whaling': 'NEW THROW: hold your right thumb, a ring shows where the harpoon lands, move it onto her, let go. (It was a blind swipe.)',
 'dress': 'The model has a face now, and her head is no longer hidden behind the card.',
 'cook': 'The camera looks down at the counter: bigger food, no dark wall.',
 'splash': 'A hidden crash fixed (it only showed in testing, never in normal play).',
 'lighthouse': 'The sea fills the screen (less black sky) and far boats are bigger.',
 'castle': 'Towers and goblins a third bigger.', 'harvest': 'The beds are half as big again and fill the screen.',
 'lantern': 'The rooms can be read now; still dark outside your lantern.',
 'war': 'The camera frames the two armies instead of the whole valley: soldiers twice the size.',
 'rex': 'Trees no longer hide the rex; the ferns are smaller.',
 'sniper': 'The square has colour: warm paving, painted buildings, awnings, flowers.',
 'sheepdog': 'A closer camera: the dog and the sheep are bigger.',
 'tennis': 'NEW: the LENGTH of your swipe picks the shot, and its name shows by your thumb (DROP, DRIVE, LOB). Speed no longer matters. Smaller pines.',
 'vet': 'The animal is in sight from the first instant.', 'golf': 'Brighter greens; wide holes are turned to fill the screen.',
 'rodeo': 'A proper bull: haunches, shoulders, tufted tail, bigger horns.', 'ramp': 'The bike is half as big again.',
 'paint': 'Richer colours and a jar you can see.', 'dash': 'A beating sun, a skyline and bars that jump on the beat; the cube is a little bigger.',
 'lifeguard': 'The sea looks like sea now (it mirrored the sky).', 'santa': 'A fuller village: more trees, snowdrifts, cottages with lit windows.',
 'crew': 'Faster: the shadow you cannot see into is drawn a cheaper way.',
 'blocks': 'You can see the squares of the board now.', 'peaks': 'Bigger cards.', 'kingdom': 'A hidden fault fixed. It keeps its own race music.',
}
NOBAND = {'drumline', 'keys', 'dash', 'kingdom'}
PROG = json.load(open(os.path.join(R, 'specs', 'progress.json')))['games']
# (23 Nov 2026, 13:11, his words: "the ones that you do fix, you can delete the review I made, and you can say first review fixed. Just make it clear
# that I made a complaint and you fixed it on that game.") specs/reviews-fixed.json: what he said and what was done, a green box on the game's card;
# his boxes on that card are emptied (in the store too) so that the next thing he writes there is his next review.
DONE = {k: v for k, v in json.load(open(os.path.join(R, 'specs', 'reviews-fixed.json'))).items() if not k.startswith('_')}
# His words, 25 Nov 2026: "create one so that I can know I made a comment here, you fixed it, and I can click that and you show only those
# games that you just fixed... I can click one and I can see all the games that I have not yet reviewed. And the ones that I clicked good
# and didn't put any comment, then you differentiate those... there's one that says all games... Just make it for easier reviewing...
# so that I don't have to go checking again and again." Every game is in exactly one of four lists, by what HE has done since the last fix:
#   FIXED, CHECK THESE  a fix of his own note (or a fix here from his note on another game, in the newest round) that he has not rated since
#   YOUR NOTES          he has written something (or pressed Bad) that is not fixed yet
#   YOU SAID FINE       Good or Okay, and nothing written
#   NOT REVIEWED        nothing from him and nothing fixed for him
# 25 Nov 2026, 09:03, his words: "why don't you make a button that when I click a game and I think the game is completely okay, then I click this
# game is completely okay, and... it can take it to the list that the game is good, the game doesn't need any more fixing... The fixed games and the
# games that I haven't reviewed, I can take it to the games that need to be fixed". So each card has TWO buttons in place of Good / Okay / Bad:
#   GAME IS OKAY   -> rating 'good' -> the OKAY list (an 'ok' from an older review counts as okay too)
#   NEEDS FIXING   -> rating 'bad'  -> the TO FIX list (with nothing written it still means "find what to change yourself")
# The game goes to its list at once (it leaves the list he is looking at), a line at the bottom says where it went, with UNDO. A game with a note
# in its boxes is already in TO FIX; GAME IS OKAY will not hide a note he wrote (it says to delete the note first).
# 25 Nov 2026, 11:44, his words: "immediately I say a game is okay, take it out of that folder and put it in the game is okay... And if I say a game
# needs fixing, take it out of that folder... create another button, which is final fix, which is, I've played the game and the game is fine. There's
# just one thing that I want you to make sure of, just like a final polish. And after that, I may not necessarily even check it... create a folder,
# final fix... immediately I click final fix, take it to the final fix". What had gone wrong (read from the store: he had typed a note on Short Order
# in the Fixed list and then pressed NEEDS FIXING): the note alone had already put the game in TO FIX without moving its card, so the press "changed
# nothing" and the card stayed where it was. So now:
#   - a card remembers which list it is DRAWN in (data-in); any press that leaves it somewhere else takes the card away at once, in every list.
#     ALL is every game grouped by its list, so there too a press moves the card out of its group and into the other one.
#   - THREE buttons, under the boxes (write, then press, and it goes): GAME IS OKAY ('good'), FINAL FIX ('final'), NEEDS FIXING ('bad').
#     The button he presses decides the list, always: GAME IS OKAY on a game with a note sends it to OKAY and keeps the note on its card
#     (no more "delete the note first"). With no button pressed, a note puts the game in TO FIX. Writing MORE on an okay game sends it to TO FIX.
#   - FINAL FIX: the game is fine, one last thing (in the FLAWS box). A press with nothing written offers WRITE IT in the line at the bottom.
#     When the final fix is done its entry in specs/reviews-fixed.json has "final": true and the store gets rating 'good': the game goes to OKAY
#     by itself, marked FINAL FIX DONE, first in that list. He does not have to check it.
# A fix empties his boxes, which is what moves the game from YOUR NOTES to FIXED; his next press of a button moves it on. An entry with "general": true
# (something done to every game, like the music) shows in the green box but does not put the game in his list to check.
def round_of(d):
    if d.get('round'): return d['round']
    m = re.match(r'(\d+) Nov', d.get('when', '')); return '2026-11-%02d' % int(m.group(1)) if m else '2026-11-22'
from collections import Counter
SAID = Counter(d['said'].strip() for v in DONE.values() for d in v)
for v in DONE.values():
    for d in v:
        if d['kind'] != 'yours' and SAID[d['said'].strip()] >= 15: d['general'] = True      # the same words on fifteen games or more: done to every game
LATEST = max(round_of(d) for v in DONE.values() for d in v if d['kind'] == 'yours' or not d.get('general'))
rows = []
for g in games:
    s = seen.get(g['number'], ''); crit = s.startswith('C '); flaw = s.startswith('F '); note = s[2:] if (crit or flaw) else s
    fixed = '' if any(d['kind'] == 'yours' for d in DONE.get(g['id'], [])) else FIXED.get(g['id'], ''); todo = ' '.join(PROG.get(g['id'], {}).get('remaining', []))      # what is still open comes from the record (PROGRESS.md), not from the first list of faults
    rows.append({'n': g['number'], 'id': g['id'], 'name': g['name'], 'genre': g['feed'].get('genre', ''), 'thumbs': g['feed'].get('thumbs', 1), 'fixed': fixed, 'todo': todo, 'crit': bool(crit and not fixed and g['id'] not in DONE), 'band': g['id'] not in NOBAND, 'done': [dict(d, round=round_of(d)) for d in DONE.get(g['id'], [])],
                 'check': any(d['kind'] == 'yours' or (round_of(d) == LATEST and not d.get('general')) for d in DONE.get(g['id'], [])), 'day': max([round_of(d) for d in DONE.get(g['id'], []) if d['kind'] == 'yours' or not d.get('general')] or ['']), 'fday': max([round_of(d) for d in DONE.get(g['id'], []) if d.get('final')] or [''])})
out = R + '/out/review'; shutil.rmtree(out, ignore_errors=True); os.makedirs(out + '/games')
for g in games: os.makedirs(f'{out}/games/{g["id"]}'); shutil.copy(f'{R}/games/{g["id"]}/index.html', f'{out}/games/{g["id"]}/index.html')
page = r'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Game Review</title>
<style>
:root{--bg:#12141c;--card:#1c2030;--ink:#f2f4fa;--dim:#9aa3b8;--acc:#ffc94a;--ok:#7be0a0;--bad:#ff7a6a;--line:#2c3246}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.intro{padding:12px 14px 6px}header{position:sticky;top:0;z-index:5;background:rgba(18,20,28,.97);border-bottom:1px solid var(--line);padding:2px 10px 8px}
h1{margin:0 0 2px;font-size:20px}.sub{color:var(--dim);font-size:13px}
.bar{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.chip{flex:none;border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:18px;padding:8px 10px;font:inherit;font-size:13.5px;white-space:nowrap}
.chip.on{background:var(--acc);color:#1d1204;border-color:var(--acc);font-weight:700}.chip i{font-style:normal;font-weight:800;margin-left:4px;opacity:.85}.chip.c-check{border-color:#2f6a48}.chip.c-wait{border-color:#7a5a20}.chip.c-final{border-color:#3a4f9a}.what{margin:0 2px 12px;font-size:13px;color:#d8dcea}
.st{display:block;font-size:12px;font-weight:800;letter-spacing:.3px;border-radius:8px;padding:5px 9px;margin:10px 0 0}.st.check{background:#7be0a0;color:#08240f}.st.wait{background:#4a3a14;color:#ffd98a}.st.fine{background:#1e3a2a;color:#9fe0b8}.st.final{background:#22305a;color:#b9d0ff}.g.s-final{border-color:#4a6ad0}.st.new{background:#262b3c;color:#aab3c8}.g.s-check{border-color:#3f9a68}.g.s-wait{border-color:#8a6a20}
main{padding:12px 12px 120px;max-width:720px;margin:0 auto}
.g{background:var(--card);border-radius:16px;padding:14px;margin-bottom:12px;border:1px solid var(--line)}.g.crit{border-color:#6a3a34}
.top{display:flex;align-items:center;gap:10px}.num{color:var(--dim);font-size:13px;min-width:34px}.nm{font-weight:800;font-size:18px;flex:1}.gen{color:var(--dim);font-size:12px}
.play{flex:none;border:0;border-radius:12px;background:var(--acc);color:#1d1204;font:inherit;font-weight:800;padding:12px 18px;font-size:16px}
.tag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:2px 7px;margin:8px 6px 0 0;letter-spacing:.3px}.t-fix{background:#1e4a34;color:var(--ok)}.t-all{background:#26304a;color:#a8c0ff}.t-todo{background:#4a2a26;color:#ffb0a0}.t-done{background:#7be0a0;color:#08240f}
.done{margin-top:10px;border:1px solid #2f6a48;background:#15301f;border-radius:12px;padding:10px 12px}.done .h{font-weight:800;color:var(--ok);font-size:14px;letter-spacing:.2px}.done .h small{font-weight:400;color:#9fcfb2}.done .said{margin-top:6px;font-size:13px;color:#b9c7bf;font-style:italic}.done .did{margin-top:6px;font-size:14px;color:#eaf6ee}.done .did b{color:var(--ok)}.again{margin-top:12px;font-size:13px;color:var(--dim)}details.old{margin-top:10px}details.old summary{font-size:13px;color:var(--dim);padding:6px 0}
p.w{margin:6px 0 0;font-size:14px;color:#d8dcea}p.w b{color:var(--ink)}
.where{margin-top:14px;font-size:12px;font-weight:800;letter-spacing:.3px;color:var(--dim)}.rate{display:flex;gap:6px;margin-top:6px}.rate button{flex:1 1 0;min-width:0;border:2px solid var(--line);background:transparent;color:var(--ink);border-radius:12px;padding:11px 3px 9px;font:inherit;font-size:14px;font-weight:800;line-height:1.15}
.sec{margin:22px 2px 8px;font-size:13px;font-weight:800;letter-spacing:.4px;color:#c9d0e2}.sec:first-child{margin-top:4px}.sec i{font-style:normal;opacity:.7;margin-left:4px}.rate button small{display:block;font-size:11px;font-weight:400;color:var(--dim);margin-top:3px;pointer-events:none}
.rate button[data-r="good"]{border-color:#2f6a48}.rate button[data-r="bad"]{border-color:#7a5a20}.rate button[data-r="final"]{border-color:#3a4f9a}.rate button[data-r="final"].on{background:#8fb4ff;border-color:#8fb4ff;color:#0a1433}.rate button[data-r="good"].on{background:#7be0a0;border-color:#7be0a0;color:#08240f}.rate button[data-r="bad"].on{background:#ffc94a;border-color:#ffc94a;color:#1d1204}.rate button.on small{color:inherit;opacity:.8}
.g.gone{opacity:0;transform:translateX(40px);transition:opacity .35s,transform .35s}
#toast{position:fixed;left:10px;right:10px;bottom:74px;z-index:40;background:#f2f4fa;color:#12141c;border-radius:12px;padding:11px 12px;display:none;align-items:center;gap:10px;font-size:14px;font-weight:700;box-shadow:0 6px 24px rgba(0,0,0,.5)}#toast.on{display:flex}#toast span{flex:1}#toast button{flex:none;border:0;border-radius:9px;background:#12141c;color:#fff;font:inherit;font-weight:800;padding:9px 11px}#toast #tnote{background:#2a4fd0}#player.on~#toast{bottom:auto;top:48px}
label{display:block;font-size:12px;font-weight:800;margin:12px 0 4px;letter-spacing:.3px}label.c{color:var(--bad)}label.f{color:var(--acc)}label small{font-weight:400;color:var(--dim)}
textarea{width:100%;min-height:58px;border-radius:10px;border:1px solid var(--line);background:#12141c;color:var(--ink);font:inherit;font-size:16px;padding:9px;resize:vertical}
footer{position:fixed;left:0;right:0;bottom:0;z-index:6;background:rgba(18,20,28,.97);border-top:1px solid var(--line);padding:10px 12px;display:flex;gap:10px;align-items:center}
footer .cnt{flex:1;font-size:12px;color:var(--dim);min-width:0}footer .cnt b{display:block;font-size:13px}footer .cnt b.ok{color:var(--ok)}footer .cnt b.no{color:var(--bad)}footer button{flex:none;border:0;border-radius:12px;background:var(--ok);color:#08240f;font:inherit;font-weight:800;padding:13px 14px}footer button#submit{background:var(--acc);color:#1d1204}
.sv{font-size:12px;margin-top:6px;color:var(--dim)}.sv.ok{color:var(--ok)}.sv.no{color:var(--bad);font-weight:700}
.key{margin-top:8px;font-size:13px;color:#d8dcea;line-height:1.5}.key b{color:var(--ink)}#outMsg{font-size:15px;margin:8px 0;line-height:1.45}#outMsg.ok{color:var(--ok)}#outMsg.no{color:var(--bad)}#out .row{display:flex;gap:10px}#out .row button{flex:1}
#player{position:fixed;inset:0;z-index:20;background:#000;display:none;flex-direction:column}#player.on{display:flex}
#pbar{flex:none;height:40px;display:flex;align-items:center;gap:8px;padding:0 8px;background:#12141c;border-bottom:1px solid var(--line)}#pbar button{border:0;border-radius:9px;background:#2a3044;color:var(--ink);font:inherit;font-weight:700;padding:7px 12px;font-size:14px}#pbar .pn{flex:1;font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#frame{flex:1;border:0;width:100%;background:#000}
#sheet{position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--card);border-top:2px solid var(--acc);border-radius:16px 16px 0 0;padding:14px;display:none;max-height:80vh;overflow:auto}#sheet.on{display:block}
#out{position:fixed;inset:0;z-index:40;background:rgba(10,12,18,.97);display:none;flex-direction:column;padding:16px}#out.on{display:flex}#out textarea{flex:1;margin:10px 0}#out button{border:0;border-radius:12px;background:var(--acc);color:#1d1204;font:inherit;font-weight:800;padding:13px}
.hide{display:none}
</style></head><body>
<div class="intro" id="intro"><h1>Game Review</h1><div class="sub">Tap PLAY. Write what is wrong (if anything), then press a button: the game goes to that list at once.</div></div>
<header><div class="bar"><button class="chip" data-f="all">All <i id="n-all"></i></button><button class="chip c-check" data-f="check">✔ Fixed <i id="n-check"></i></button><button class="chip c-new" data-f="new">○ Not reviewed <i id="n-new"></i></button></div>
<div class="bar"><button class="chip c-fine" data-f="fine">👍 Okay <i id="n-fine"></i></button><button class="chip c-final" data-f="final">★ Final fix <i id="n-final"></i></button><button class="chip c-wait" data-f="wait">✎ To fix <i id="n-wait"></i></button></div></header>
<main><div class="what" id="what"></div><div id="list"></div></main>
<footer><div class="cnt"><b id="svAll">Checking…</b><span id="cnt"></span></div><button id="save">SAVE</button><button id="submit">SUBMIT REVIEW</button></footer>
<div id="player"><div id="pbar"><button id="pback">‹ Games</button><div class="pn" id="pname"></div><button id="pnotes">✎ Notes</button></div><iframe id="frame" title="game" allow="autoplay; fullscreen"></iframe></div>
<div id="sheet"></div>
<div id="toast"><span id="toastMsg"></span><button id="tnote">WRITE IT</button><button id="undo">UNDO</button></div>
<div id="out"><b>Your review</b><div id="outMsg"></div><div class="sub">Everything you have written so far is below. You can submit again whenever you have done more.</div><textarea id="outText" readonly></textarea><div class="row"><button id="copy">COPY</button><button id="outClose">Done</button></div></div>
<script>
const GAMES = __DATA__, LATEST = '__LATEST__';
const mem = {}; const get = k => { try { const v = localStorage.getItem('rev.' + k); return v == null ? (mem[k] || '') : v; } catch (e) { return mem[k] || ''; } };
const set = (k, v) => { mem[k] = v; try { localStorage.setItem('rev.' + k, v); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let filter = get('filter') || 'all', cur = null;
// which of the five lists a game is in (see the top of tools/review_page.py): the button he pressed decides; with none, a note means TO FIX
function stateOf(g) { const r = get(g.id + '.r'); return r === 'final' ? 'final' : r === 'bad' ? 'wait' : r ? 'fine' : noted(g.id) ? 'wait' : g.check ? 'check' : 'new'; }
const STATE = { check: '✔ FIXED: PLAY IT, THEN PRESS A BUTTON BELOW', wait: '✎ YOUR NOTE IS SAVED: NOT FIXED YET', final: '★ FINAL FIX: ONE LAST THING, NOT DONE YET', fine: '👍 OKAY: NO MORE FIXING', new: '○ NOT REVIEWED YET' }, LIST = { check: 'FIXED', wait: 'TO FIX', final: 'FINAL FIX', fine: 'OKAY', new: 'NOT REVIEWED' };
const ORDER = ['check', 'new', 'wait', 'final', 'fine'], HEAD = { check: '✔ FIXED: CHECK THESE', new: '○ NOT REVIEWED', wait: '✎ TO FIX', final: '★ FINAL FIX', fine: '👍 OKAY' };      // ALL shows every game, grouped by its list
const BTN = [['good', '👍 GAME IS OKAY', 'no more fixing'], ['final', '★ FINAL FIX', 'fine: one last thing'], ['bad', '✎ NEEDS FIXING', 'send it to be fixed']];
const noted = id => (get(id + '.c') + get(id + '.f')).trim(), isOn = (k, r) => k === r || (k === 'good' && r === 'ok');      // an Okay from an older review counts as okay
const stLabel = (g, st) => st === 'wait' && !noted(g.id) ? '✎ NEEDS FIXING: NOT FIXED YET' : st === 'final' && !noted(g.id) ? '★ FINAL FIX: WRITE THE ONE THING IN THE BOX' : st === 'fine' && noted(g.id) ? '👍 OKAY: NO MORE FIXING (YOUR NOTE IS KEPT)' : st === 'fine' && g.fday ? '👍 OKAY: FINAL FIX DONE ✔' : STATE[st];
const WHAT = { all: 'ALL: every game, grouped by its list.', check: 'FIXED: only the games I fixed from what you wrote, newest first. Play one, then press a button and it goes to that list.', wait: 'TO FIX: games you sent to be fixed. (Nothing written = I find what to change myself.)', final: 'FINAL FIX: the game is fine, it needs one last thing. Write the one thing in the FLAWS box. When I have done it the game goes to OKAY by itself: you do not have to check it.', new: 'NOT REVIEWED: games you have not judged yet. Press a button and it goes to that list.', fine: 'OKAY: games you said are okay. No more fixing. (Press another button to send one back.)' };
const ORD = ['', 'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH'];
function doneHtml(g) { if (!g.done || !g.done.length) return ''; let n = 0; const box = d => { const mine = d.kind === 'yours'; if (mine) n++; return `<div class="done"><div class="h">✔ ${mine ? (d.final ? 'YOUR FINAL FIX: DONE' : `YOUR ${ORD[n] || n + 'TH'} REVIEW: ${d.answer ? 'CHECKED' : 'FIXED'}`) : d.general ? 'DONE TO EVERY GAME' : 'FIXED HERE TOO'} <small>(${esc(d.when)})</small></div><div class="said">You said: “${esc(d.said.trim())}”</div><div class="did"><b>What I did:</b> ${esc(d.did)}</div></div>`; };
  const now = [], old = []; for (const d of g.done) (d.kind === 'yours' || d.round === LATEST ? now : old).push(box(d)); const mine = g.done.some(d => d.kind === 'yours' && !d.answer);
  return now.join('') + (old.length ? `<details class="old"><summary>Earlier changes to this game (${old.length})</summary>${old.join('')}</details>` : '') + (mine ? `<div class="again">Your old note is cleared from the boxes below. Play it again and write your next review there if anything is still wrong.</div>` : ''); }
function boxesHtml(g, one) { return (one ? '' : `<label class="c">CRITICAL FLAWS <small>(makes it almost unplayable)</small></label><textarea data-k="${g.id}.c" placeholder="e.g. I can't tell what to do">${esc(get(g.id + '.c'))}</textarea>`) + `
<label class="f">${one ? 'THE ONE THING TO POLISH' : 'FLAWS <small>(fixing this would make it better; the one thing for a FINAL FIX goes here)</small>'}</label><textarea data-k="${g.id}.f" placeholder="e.g. the character is too small">${esc(get(g.id + '.f'))}</textarea><div class="sv" data-sv="${g.id}"></div>`; }
function rateHtml(g) { const r = get(g.id + '.r'); return `<div class="where">WHERE DOES THIS GAME GO?</div><div class="rate" data-id="${g.id}">${BTN.map(([k, t, sm]) => `<button data-r="${k}" class="${isOn(k, r) ? 'on' : ''}">${t}<small>${sm}</small></button>`).join('')}</div>`; }
function notesHtml(g) { return boxesHtml(g) + rateHtml(g); }      // write, then press: the press takes the card away
function show(g) { return filter === 'all' || stateOf(g) === filter; }
function render() { const L = document.getElementById('list'); let list = GAMES.filter(show), last = ''; if (filter === 'check') list.sort((a, b) => (b.day || '').localeCompare(a.day || '') || a.n - b.n);
  if (filter === 'fine') list.sort((a, b) => (b.fday || '').localeCompare(a.fday || '') || a.n - b.n);      // a final fix just done comes first
  if (filter === 'all') { const all = list; list = [].concat(...ORDER.map(s => all.filter(g => stateOf(g) === s))); }
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.f === filter)); document.getElementById('what').textContent = WHAT[filter] || '';
  L.innerHTML = list.map(g => { const st = stateOf(g); let h = ''; if (filter === 'all' && st !== last) { last = st; h = `<h2 class="sec">${HEAD[st]} <i>${list.filter(q => stateOf(q) === st).length}</i></h2>`; }
    return h + `<section class="g s-${st}" id="g-${g.id}" data-in="${st}"><span class="st ${st}" data-st="${g.id}">${stLabel(g, st)}</span><div class="top" style="margin-top:10px"><div class="num">#${g.n}</div><div class="nm">${esc(g.name)}<div class="gen">${esc(g.genre)} · ${g.thumbs === 2 ? 'two thumbs' : 'one thumb'}</div></div><button class="play" data-play="${g.id}">PLAY</button></div>
${doneHtml(g)}${g.fixed ? `<p class="w"><b>What I changed:</b> ${esc(g.fixed)}</p>` : ''}${g.todo ? `<p class="w"><b>Still open, or yours to judge:</b> ${esc(g.todo)}</p>` : ''}${notesHtml(g)}</section>`; }).join('') || '<p class="sub">Nothing here.</p>'; count(); }
function count() { let r = 0, n = 0; const by = { all: GAMES.length, check: 0, wait: 0, final: 0, fine: 0, new: 0 }; for (const g of GAMES) { if (get(g.id + '.r')) r++; if (get(g.id + '.c') || get(g.id + '.f')) n++; const st = stateOf(g); by[st]++; const el = document.querySelector(`[data-st="${g.id}"]`); if (el) { el.textContent = stLabel(g, st); el.className = 'st ' + st; } }
  for (const k in by) { const el = document.getElementById('n-' + k); if (el) el.textContent = by[k]; } document.getElementById('cnt').textContent = `${r} of ${GAMES.length} rated · ${n} with notes`; return [r, n]; }
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.k; if (!k) return; const id = k.slice(0, k.lastIndexOf('.')), old = get(k), v = e.target.value; set(k, v);
  if (v.trim().length > old.trim().length && isOn('good', get(id + '.r'))) { const g = GAMES.find(q => q.id === id); setRating(id, ''); toast(`You wrote on #${g.n} ${g.name}, so it goes to TO FIX.`); return; }      // more written on an okay game: his words are never left where nobody acts on them
  count(); touch(id); });
document.addEventListener('click', e => { const t = e.target;
  const chip = t.closest && t.closest('.chip'); if (chip) { filter = chip.dataset.f; set('filter', filter); render(); scrollTo(0, Math.min(scrollY, document.getElementById('intro').offsetHeight)); return; }
  const rb = t.closest && t.closest('.rate button[data-r]');
  if (rb) { const id = rb.parentNode.dataset.id, was = get(id + '.r'), want = rb.dataset.r, g = GAMES.find(q => q.id === id), before = stateOf(g);
    setRating(id, isOn(want, was) ? '' : want); const after = stateOf(g), el = document.getElementById('g-' + id), inGame = document.getElementById('player').classList.contains('on');
    const leaves = el ? el.dataset.in !== after : after !== before, blank = !noted(id) && (after === 'wait' || after === 'final') && !document.getElementById('sheet').classList.contains('on');      // where the card is DRAWN, not what the press changed: a note typed first had already changed the list without moving the card
    toast(`#${g.n} ${g.name}: ${leaves ? 'moved to' : 'is in'} ${LIST[after]}` + (after === 'fine' && noted(id) ? '. Your note is kept on its card.' : ''), () => { setRating(id, was); render(); }, blank ? () => noteSheet(g) : null);
    if (leaves && el && !inGame) { el.classList.add('gone'); setTimeout(render, 280); }      // it leaves the list he is looking at, at once
    return; }
  if (t.dataset.play) { play(t.dataset.play); return; } });
function setRating(id, v) { set(id + '.r', v); document.querySelectorAll(`.rate[data-id="${id}"]`).forEach(r => r.querySelectorAll('button').forEach(b => b.classList.toggle('on', isOn(b.dataset.r, v)))); count(); touch(id); }
let toastT = 0, undoFn = null, noteFn = null;
function toast(msg, undo, note) { const el = document.getElementById('toast'); document.getElementById('toastMsg').textContent = msg; undoFn = undo || null; noteFn = note || null; document.getElementById('undo').style.display = undo ? '' : 'none'; document.getElementById('tnote').style.display = note ? '' : 'none'; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), note ? 9000 : undo ? 6000 : 4000); }
document.getElementById('undo').onclick = () => { const f = undoFn; undoFn = null; document.getElementById('toast').classList.remove('on'); if (f) f(); };
document.getElementById('tnote').onclick = () => { const f = noteFn; noteFn = null; document.getElementById('toast').classList.remove('on'); if (f) f(); };
// the card has gone to its list with nothing written: WRITE IT opens its boxes here, so he does not have to go and find it
function noteSheet(g) { const s = document.getElementById('sheet'), fin = get(g.id + '.r') === 'final';
  s.innerHTML = `<b>#${g.n} ${esc(g.name)}</b><div class="sub" style="margin-top:4px">${fin ? 'FINAL FIX: what is the one thing?' : 'NEEDS FIXING: what is wrong? (Leave it empty and I will find what to change myself.)'}</div>` + boxesHtml(g, fin) + '<div style="height:10px"></div><button class="play" id="sdone" style="width:100%">DONE</button>';
  s.classList.add('on'); document.getElementById('sdone').onclick = closeSheet; status(); const ta = s.querySelector(`textarea[data-k="${g.id}.f"]`); if (ta) try { ta.focus(); } catch (e) {} }
function play(id) { cur = GAMES.find(g => g.id === id); document.getElementById('pname').textContent = `#${cur.n} ${cur.name}`; document.getElementById('frame').src = 'games/' + id + '/index.html'; document.getElementById('player').classList.add('on'); }
function closeSheet() { const s = document.getElementById('sheet'), was = s.classList.contains('on'); s.classList.remove('on'); s.innerHTML = ''; if (was && !document.getElementById('player').classList.contains('on')) render(); }
document.getElementById('pback').onclick = () => { closeSheet(); document.getElementById('player').classList.remove('on'); document.getElementById('frame').src = 'about:blank'; render(); if (cur) { const el = document.getElementById('g-' + cur.id); if (el) (el.querySelector('.rate') || el).scrollIntoView({ block: 'center' }); } };      // back from a game: its boxes and its three buttons are in front of him
document.getElementById('pnotes').onclick = () => { const s = document.getElementById('sheet'); if (s.classList.contains('on')) { closeSheet(); return; } s.innerHTML = `<b>#${cur.n} ${esc(cur.name)}</b>` + doneHtml(cur) + notesHtml(cur) + '<div style="height:10px"></div><button class="play" id="sdone" style="width:100%">Back to the game</button>'; s.classList.add('on'); document.getElementById('sdone').onclick = closeSheet; status(); };
function allNotes() { const L = ['GAME REVIEW NOTES']; for (const g of GAMES) { const r = get(g.id + '.r'), c = get(g.id + '.c').trim(), f = get(g.id + '.f').trim(); if (!r && !c && !f) continue; L.push('', `#${g.n} ${g.name}${r ? ' [' + (r === 'bad' ? 'NEEDS FIXING' : r === 'final' ? 'FINAL FIX' : 'OKAY') + ']' : ''}`); if (c) L.push('CRITICAL: ' + c); if (f) L.push('FLAWS: ' + f); } if (L.length === 1) L.push('', '(no notes yet)'); return L.join('\n'); }
document.getElementById('copy').onclick = () => { const txt = document.getElementById('outText').value, b = document.getElementById('copy');
  try { navigator.clipboard.writeText(txt).then(() => { b.textContent = 'COPIED ✓'; setTimeout(() => b.textContent = 'COPY', 2500); }, () => { document.getElementById('outText').select(); }); } catch (e) { document.getElementById('outText').select(); } };
// ---------- SAVING (23 Nov 2026, his words: "I don't want to come back to it tomorrow and not see it there") ----------
// Every change is kept at once on this phone, and a moment later in the page's own store (the `db` capability), one document
// a game at reviews/<id>: { rating, critical, flaw, at }. Claude reads that store. What has not reached the store yet is
// remembered (rev.dirty) and sent the next time the page opens. SUBMIT writes meta/submitted.
let db = null, dbState = 'wait', lastErr = ''; const dirty = new Set(), busy = new Set(), timers = {};
try { for (const id of JSON.parse(get('dirty') || '[]')) dirty.add(id); } catch (e) {}
const stamp = id => +get(id + '.t') || 0, has = id => !!(get(id + '.r') || get(id + '.c') || get(id + '.f'));
const saveDirty = () => set('dirty', JSON.stringify([...dirty]));
function touch(id) { set(id + '.t', String(Date.now())); dirty.add(id); saveDirty(); status(); clearTimeout(timers[id]); timers[id] = setTimeout(() => push(id), 1500); }
async function push(id) { if (!db || busy.has(id) || !dirty.has(id)) return; busy.add(id); status(); const at = stamp(id) || Date.now(), body = { rating: get(id + '.r'), critical: get(id + '.c'), flaw: get(id + '.f'), at };
  try { await db.doc('reviews/' + id).set(body); lastErr = ''; if ((stamp(id) || at) === at) { dirty.delete(id); set(id + '.t', String(at)); saveDirty(); } } catch (e) { lastErr = (e && e.code) || 'error'; }
  busy.delete(id); status(); if (!lastErr && dirty.has(id)) push(id); }
async function saveAll() { if (!db) return false; for (const id of [...dirty]) { clearTimeout(timers[id]); await push(id); } status(); return dirty.size === 0; }
function status() { const all = document.getElementById('svAll'); let txt, cls;
  if (dbState === 'wait') { txt = 'Checking your saved notes…'; cls = ''; } else if (dbState === 'off') { txt = 'Kept on this phone only: use SUBMIT, then COPY'; cls = 'no'; }
  else if (dirty.size) { txt = busy.size ? 'Saving…' : `${dirty.size} not saved yet: tap SAVE`; cls = busy.size ? '' : 'no'; } else { txt = 'All saved ✓'; cls = 'ok'; }
  all.textContent = txt; all.className = cls;
  document.querySelectorAll('[data-sv]').forEach(el => { const id = el.dataset.sv; if (dirty.has(id)) { const w = busy.has(id) || dbState === 'wait'; el.textContent = w ? 'Saving…' : dbState === 'off' ? 'Kept on this phone only' : 'Not saved yet: tap SAVE'; el.className = 'sv' + (w ? '' : ' no'); } else if (has(id) && dbState === 'on') { el.textContent = 'Saved ✓'; el.className = 'sv ok'; } else { el.textContent = ''; el.className = 'sv'; } }); }
function refreshFields() { const act = document.activeElement; document.querySelectorAll('textarea[data-k]').forEach(t => { if (t !== act) t.value = get(t.dataset.k); }); document.querySelectorAll('.rate').forEach(r => { const v = get(r.dataset.id + '.r'); r.querySelectorAll('button').forEach(b => b.classList.toggle('on', isOn(b.dataset.r, v))); }); count(); }
async function connect() { const t0 = Date.now(); while (!(window.claude && window.claude.use) && Date.now() - t0 < 10000) await new Promise(r => setTimeout(r, 200));
  try { db = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { db = null; }
  if (!db) { dbState = 'off'; status(); return; }
  try { const snap = await Promise.race([db.collection('reviews').limit(1000).get(), new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), 12000))]), have = {};
    for (const d of snap.docs) { const v = d.data() || {}, id = d.id, at = +v.at || 1; have[id] = at; if (!GAMES.some(g => g.id === id)) continue;
      if (at > stamp(id)) { set(id + '.r', v.rating || ''); set(id + '.c', v.critical || ''); set(id + '.f', v.flaw || ''); set(id + '.t', String(at)); dirty.delete(id); } }      // the store is newer (another day, another phone): show it
    for (const g of GAMES) if (has(g.id) && !have[g.id]) { if (!stamp(g.id)) set(g.id + '.t', String(Date.now())); dirty.add(g.id); }      // written here before the store existed, or never sent
    const a = document.activeElement; if (a && a.tagName === 'TEXTAREA') refreshFields(); else render(); } catch (e) { lastErr = (e && e.code) || 'error'; }      // what the store knows puts every card in its right list (unless he is already typing)
  dbState = 'on'; saveDirty(); status(); saveAll(); }
document.getElementById('save').onclick = async () => { const b = document.getElementById('save'); if (dbState !== 'on') { status(); return; } b.textContent = 'SAVING…'; const ok = await saveAll(); b.textContent = ok ? 'SAVED ✓' : 'TRY AGAIN'; setTimeout(() => b.textContent = 'SAVE', 2200); };
document.getElementById('submit').onclick = async () => { const b = document.getElementById('submit'), o = document.getElementById('out'), m = document.getElementById('outMsg'); b.textContent = 'SENDING…'; let sent = false;
  if (dbState === 'on') { const ok = await saveAll(); if (ok) { const [r, n] = count(); try { await db.doc('meta/submitted').set({ at: Date.now(), rated: r, withNotes: n, games: GAMES.length }); sent = true; } catch (e) {} } }
  document.getElementById('outText').value = allNotes(); m.className = sent ? 'ok' : 'no';
  m.textContent = sent ? 'Sent ✓ Claude can now read everything below. Go back to the chat and say: "I submitted my review".' : 'It could not be sent from here just now. Tap COPY and paste it to Claude in the chat instead (nothing is lost: it is all still on this page).';
  b.textContent = 'SUBMIT REVIEW'; o.classList.add('on'); };
setInterval(() => { if (dbState === 'on' && dirty.size && !busy.size) saveAll(); }, 20000);      // a save that failed (no signal) is tried again
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dbState === 'on' && dirty.size) saveAll(); });
document.getElementById('outClose').onclick = () => document.getElementById('out').classList.remove('on');
const render0 = render; render = function () { render0(); status(); };
render(); connect();
</script></body></html>'''
page = page.replace('__LATEST__', LATEST).replace('__N__', str(len(rows))).replace('__DATA__', json.dumps(rows, ensure_ascii=False).replace('</', '<\\/'))
open(out + '/index.html', 'w').write(page)
tot = sum(os.path.getsize(f'{out}/games/{g["id"]}/index.html') for g in games)
print(len(rows), 'games,', round(tot / 1048576, 1), 'MiB; fixed', sum(1 for r in rows if r['fixed']), 'todo', sum(1 for r in rows if r['todo']), 'no audit line', [r['n'] for r in rows if r['n'] not in seen])
