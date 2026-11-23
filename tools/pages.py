#!/usr/bin/env python3
"""Which games' own pages are behind the game in the repository?

Every game has its own page (`artifact` in games.json): the link he plays from. A fix is not delivered until that page
has it; the Game Review page carrying a copy is not enough (his words, 23 Nov 2026: "I don't want you to fix it on the
review page. Like, actually make the artifact, put the game normally how you would put it").

  python3 tools/pages.py              the games whose index.html differs from what was last put on their own page
  python3 tools/pages.py --done a b   record that a and b have just been published (their own artifact, index.html)
  python3 tools/pages.py --check      exit 1 if any game from 9 on is behind (for the end of a sitting)

The record is specs/pages.json: { id: sha256 of the index.html last published to its own page }.
"""
import hashlib, json, os, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REC = f'{R}/specs/pages.json'
games = json.load(open(f'{R}/games.json'))['games']
rec = json.load(open(REC)) if os.path.exists(REC) else {}
sha = lambda g: hashlib.sha256(open(f'{R}/{g["path"]}', 'rb').read()).hexdigest()
a = sys.argv[1:]
if a and a[0] == '--done':
    by = {g['id']: g for g in games}
    for i in a[1:]: rec[i] = sha(by[i])
    json.dump(rec, open(REC, 'w'), indent=1, sort_keys=True)
    print(f'recorded {len(a) - 1}')
    sys.exit(0)
behind = [g for g in games if g['number'] >= 9 and g.get('status') != 'retired' and rec.get(g['id']) != sha(g)]
for g in behind: print(f'{g["number"]:>3} {g["id"]:<11} {g["artifact_slug"]}  {g["path"]}')
print(f'{len(behind)} behind' if behind else 'every game\'s own page has the newest game')
if a and a[0] == '--check' and behind: sys.exit(1)
