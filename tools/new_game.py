#!/usr/bin/env python3
"""Starts a new game from the starter kit (kit/README.md).

    python3 tools/new_game.py <id> "<Name>" --prefix xx. [--font "Title Font"] [--tag "ONE LINE UNDER THE TITLE"]
        [--genre Genre] [--intensity 1-5] [--thumbs 1|2] [--hook "One line for its feed card"]

Copies kit/ to games/<id>/ with the name, title font and storage prefix filled in, builds it, adds it to games.json (next number,
status in-progress, its feed fields filled in so it is ready the day he says "put it on the app", but never "in_app"), and writes
a design stub at specs/<NN>-<id>.md. The new game runs and passes every check at once (it is the kit's example game) until its
rules are written over it. Then: python3 tools/check_game.py <id>"""
import argparse, json, os, re, shutil, subprocess, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
a = argparse.ArgumentParser()
a.add_argument('id'); a.add_argument('name'); a.add_argument('--prefix', required=True)
a.add_argument('--font', default='Bebas Neue'); a.add_argument('--tag', default='')
a.add_argument('--genre', default='Arcade'); a.add_argument('--intensity', type=int, default=3); a.add_argument('--thumbs', type=int, default=1)
a.add_argument('--hook', default='')
o = a.parse_args()
if not re.fullmatch(r'[a-z0-9-]+', o.id): sys.exit('id: lowercase letters, digits and dashes only')
if not re.fullmatch(r'[a-z]{1,4}\.', o.prefix): sys.exit('prefix: a few letters and a dot, e.g. "gr."')
reg_p = os.path.join(root, 'games.json'); txt = open(reg_p).read(); reg = json.loads(txt)
if any(g['id'] == o.id for g in reg['games']): sys.exit(f'{o.id} is already in games.json')
if o.prefix == 'gf.' or any(g.get('storage_prefix') == o.prefix for g in reg['games']): sys.exit(f'prefix {o.prefix} is taken')
dst = os.path.join(root, 'games', o.id)
if os.path.exists(dst): sys.exit(f'games/{o.id} already exists')
shutil.copytree(os.path.join(root, 'kit'), dst, ignore=shutil.ignore_patterns('README.md', 'index.html', '__pycache__'))
fill = {'__NAME__': o.name, '__PREFIX__': o.prefix, '__TITLEFONT__': o.font, '__FONTURL__': o.font.replace(' ', '+'), '__TAGLINE__': o.tag or o.name.upper()}
for f in os.listdir(dst):
    p = os.path.join(dst, f)
    if f.endswith(('.html', '.js', '.py')):
        s = open(p).read()
        for k2, v in fill.items(): s = s.replace(k2, v)
        open(p, 'w').write(s)
subprocess.run([sys.executable, os.path.join(dst, 'build.py')], check=True)
n = reg['next_number']
reg['games'].append({
    'number': n, 'id': o.id, 'name': o.name, 'status': 'in-progress', 'version': '0.1.0', 'added': __import__('datetime').date.today().isoformat(),
    'path': f'games/{o.id}/index.html', 'artifact': None, 'artifact_slug': None, 'apk_repo': None, 'storage_prefix': o.prefix,
    'feed': {'mini': True, 'full': True, 'hook': o.hook or o.name, 'genre': o.genre, 'intensity': o.intensity, 'thumbs': o.thumbs,
             'start': ['#playBtn'], 'font': o.font, 'live': 'window.__sim && window.__sim.playing()'},
    'principles': [], 'summary': ''})
reg['next_number'] = n + 1
open(reg_p, 'w').write(json.dumps(reg, indent=2, ensure_ascii=False) + ('\n' if txt.endswith('\n') else ''))
spec = os.path.join(root, 'specs', f'{n:02d}-{o.id}.md')
open(spec, 'w').write(f"""# {n}. {o.name}

## The idea (his words, then mine)

## How it plays (one screen, one thumb or two)

## Levels: very easy first, then harder for ever (LESSONS rule 0)

## Spamming cannot win (LESSONS rule 1): the wrong move costs, more each time; the right move needs one read
- Blind moves (BLIND in part2):

## Lessons of the first three levels (each move, two or three times, before play)

## Engagement factors chosen (PLAYBOOK: 3 to 5 principles, the sound rules)

## The card clip: its most exciting moment
""")
print(f'games/{o.id}/ made from the kit; games.json entry #{n} ({o.name}, in-progress); {os.path.relpath(spec, root)} to fill in.')
print(f'Next: write the rules (games/{o.id}/part2.js), the drawing (part3.js) and the sounds (part4.js); then python3 tools/check_game.py {o.id}')
