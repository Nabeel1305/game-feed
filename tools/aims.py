#!/usr/bin/env python3
"""Writes each game's aim card (specs/aims.json: pic, win, lose, how) into games/<id>/part2.js as `const AIMCARD = {...};` just above LESSONS.
The kit (tools/juice-kit.js, aimCard) shows it before the first lesson and from the pause menu's HOW TO PLAY. Run, then build the games.
Run: python3 tools/aims.py [ids]"""
import json, os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = json.load(open(os.path.join(root, 'specs', 'aims.json'))); ids = sys.argv[1:] or [k for k in A if not k.startswith('_')]
for gid in ids:
    p = os.path.join(root, 'games', gid, 'part2.js'); s = open(p).read(); a = A[gid]
    line = 'const AIMCARD = ' + json.dumps({k: a[k] for k in ('pic', 'win', 'lose', 'how') if k in a}, ensure_ascii=False) + ';      // the aim card: specs/aims.json (tools/aims.py)\n'
    if re.search(r'^const AIMCARD = .*$\n', s, re.M): s = re.sub(r'^const AIMCARD = .*$\n', lambda m: line, s, count=1, flags=re.M)
    else:
        i = s.find('const LESSONS'); assert i >= 0, gid; i = s.rfind('\n', 0, i) + 1; s = s[:i] + line + s[i:]
    open(p, 'w').write(s)
print(len(ids), 'games')
