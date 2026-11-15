#!/usr/bin/env python3
"""Generate LEDGER.md from games.json.  python3 tools/ledger.py  (add --check to fail if it's out of date)"""
import json, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
reg = json.load(open(os.path.join(root, 'games.json')))
games = sorted(reg['games'], key=lambda g: g['number'])
on_app = lambda g: g.get('in_app') is True and g['status'] in ('approved', 'testing')      # only when Nabeel has said "put it on the app"
lines = ['# Game Ledger', '', '_Generated from `games.json` by `tools/ledger.py`. Do not edit by hand._', '',
         f"**{len(games)} game{'s' if len(games) != 1 else ''}** so far. Next number: **{reg['next_number']}**.", '']
fa = reg.get('feed_app')
if fa:
    inside = sum(1 for g in games if on_app(g))
    lines += [f"**{fa['name']}** (the scrolling app with all the games, version {fa['version']}): [open the feed]({fa['artifact']}) · [Android app]({fa['apk']}) · {inside} game{'s' if inside != 1 else ''} in it.", '']
lines += [
         '| # | Game | Status | On the app | Version | Play / test page | Code |', '|---|------|--------|------------|---------|------------------|------|']
for g in games:
    where = ('yes: core game, always on the phone' if g.get('core') is True else 'yes: played over the internet, can be saved') if on_app(g) else 'not yet (he has not said so)'
    lines.append(f"| {g['number']} | **{g['name']}** | {g['status']} | {where} | {g['version']} | [play]({g['artifact']}) | `{g['path']}` |")
lines += ['', '## What each game is', '']
for g in games:
    extra = f" APK repo: `{g['apk_repo']}`." if g.get('apk_repo') else ''
    lines.append(f"{g['number']}. **{g['name']}**: {g['summary']}{extra}")
if reg.get('planned'):
    lines += ['', '## Up next (designed, not built yet)', '']
    for g in reg['planned']:
        lines.append(f"{g['number']}. **{g['name']}**: {g['summary']} Spec: `{g['spec']}`.")
out = '\n'.join(lines) + '\n'
path = os.path.join(root, 'LEDGER.md')
if '--check' in sys.argv:
    cur = open(path).read() if os.path.exists(path) else ''
    if cur != out:
        print('LEDGER.md is out of date: run python3 tools/ledger.py'); sys.exit(1)
    print('LEDGER.md is up to date')
else:
    open(path, 'w').write(out); print('wrote LEDGER.md')
