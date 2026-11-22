#!/usr/bin/env python3
"""The record of the review of all 111 games (his prompt, 22 Nov 2026: "maintain a persistent record of the work... one entry per
game"). The facts live in specs/progress.json (edited by hand or by `set`); this writes PROGRESS.md from it, one entry per game:
where it is, what it is for, its status (unreviewed, reviewing, fixing, retesting, verified, blocked, or kept: the first eight,
which he said are good and are on the app), problems seen, changes made, checks run, and what is still unverified.
  python3 tools/progress.py                      write PROGRESS.md
  python3 tools/progress.py set <id> status=fixing problem="..." change="..." check="..." remain="..."   (each may repeat)
  python3 tools/progress.py init                 first fill from games.json and the audit (does not overwrite entries)"""
import json, os, re, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PJ = R + '/specs/progress.json'
games = json.load(open(R + '/games.json'))['games']
P = json.load(open(PJ)) if os.path.exists(PJ) else {'checkpoint': '', 'shared': [], 'games': {}}
def save(): json.dump(P, open(PJ, 'w'), indent=1, ensure_ascii=False); open(PJ, 'a').write('\n')
def init():
    aud = open(R + '/specs/audit-2026-11-22.md').read().split('## Done on')[0]; seen = {}
    for m in re.finditer(r'^- (\d+) [^:\n]+: ((?:.+\n)(?:  .+\n)*)', aud, re.M): seen[int(m.group(1))] = ' '.join(m.group(2).split())
    for g in games:
        if g['id'] in P['games']: continue
        e = {'status': 'kept' if g['number'] <= 8 else 'reviewing', 'problems': [], 'changes': [], 'checks': [], 'remaining': []}
        s = seen.get(g['number'], '')
        if s[:2] in ('C ', 'F '): e['problems'].append(('CRITICAL: ' if s[0] == 'C' else '') + s[2:]); e['status'] = 'fixing'
        elif s: e['note'] = s
        P['games'][g['id']] = e
    save()
def write():
    c = {}; L = []
    for g in games: c[P['games'][g['id']]['status']] = c.get(P['games'][g['id']]['status'], 0) + 1
    L += ['# Progress: the review of all 111 games', '', 'Made by `python3 tools/progress.py` from `specs/progress.json`. Do not edit by hand.', '',
          '**Count:** ' + ', '.join(f'{v} {k}' for k, v in sorted(c.items(), key=lambda x: -x[1])) + f' (of {len(games)}).', '',
          '**Statuses:** kept = the first eight, on the app, which he said are good (loaded and controls-tested only); verified = no known critical or major problem, changes retested; retesting = changed, a check still to finish; fixing = a problem is known and not yet fixed; reviewing = looked at by robot play and screenshots, no hands-on pass yet.', '',
          '## Where to carry on', '', P.get('checkpoint', ''), '', '## What no check here can tell (true of every game)', '',
          '- **Sound by ear.** Sounds and music are rendered and measured (errors, loudness, balance), never heard.', '- **A real thumb on a real phone.** Touches are sent by a test browser at phone size; reach, comfort and a finger covering the action are judged from pictures.', '- **Vibration.** Only that the calls are made and obey the switch.', '- **Speed on his phone.** Measured on a slowed-down computer; the pause menu\'s grey line tells the truth on the phone.', '',
          '## Shared changes (every game built from the kit)', ''] + ['- ' + s for s in P.get('shared', [])] + ['', '## Game by game', '']
    for g in games:
        e = P['games'][g['id']]; L.append(f"### {g['number']}. {g['name']} (`{g['id']}`): {e['status'].upper()}")
        L.append(f"- **Where:** `{g['path']}` · v{g['version']} · {g['feed'].get('genre', '')} · {g['feed'].get('thumbs', 1)} thumb(s)" + (' · on the app' if g.get('in_app') else ''))
        L.append(f"- **What it is:** {g.get('summary') or g['feed'].get('hook', '')}")
        if e.get('note'): L.append(f"- **First look:** {e['note']}")
        for k, t in (('problems', 'Problem'), ('changes', 'Changed'), ('checks', 'Checked'), ('remaining', 'Still open')):
            for x in e.get(k, []): L.append(f'- **{t}:** {x}')
        L.append('')
    open(R + '/PROGRESS.md', 'w').write('\n'.join(L)); print('wrote PROGRESS.md:', c)
if len(sys.argv) > 1 and sys.argv[1] == 'init': init(); write()
elif len(sys.argv) > 2 and sys.argv[1] == 'set':
    e = P['games'][sys.argv[2]]
    for a in sys.argv[3:]:
        k, v = a.split('=', 1)
        if k == 'status': e['status'] = v
        else: e[{'problem': 'problems', 'change': 'changes', 'check': 'checks', 'remain': 'remaining'}[k]].append(v)
    save(); write()
else: write()
