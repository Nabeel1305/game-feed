#!/usr/bin/env python3
"""Every check for one game, in one command (kit/README.md):

    python3 tools/check_game.py <id> [--quick]

  1. builds it (games/<id>/build.py)
  2. its own proof by robots (games/<id>/test_play.py: spamming cannot win, people who look do, the lessons, the sounds)
     and any other test_*.py in its folder
  3. the basic controls the way a thumb uses them (tools/test_controls.py <id>)
  4. how long a frame takes on a slowed-down machine (tools/speed.py <id>, LESSONS rule 12)
  5. the registry and the feed build (tools/check.py)
--quick skips 4 and 5. Prints one line per step and stops at the end with a pass or a list of what failed."""
import os, subprocess, sys, time

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]; quick = '--quick' in sys.argv
if len(args) != 1: sys.exit(__doc__)
gid = args[0]; d = os.path.join(root, 'games', gid)
if not os.path.isdir(d): sys.exit(f'no games/{gid}')
steps = [('build', [sys.executable, os.path.join(d, 'build.py')])]
for f in sorted(os.listdir(d)):
    if f.startswith('test_') and f.endswith('.py'): steps.append((f, [sys.executable, os.path.join(d, f)]))
steps.append(('controls', [sys.executable, os.path.join(root, 'tools', 'test_controls.py'), gid]))
if not quick: steps += [('speed', [sys.executable, os.path.join(root, 'tools', 'speed.py'), gid]), ('registry', [sys.executable, os.path.join(root, 'tools', 'check.py')])]
failed = []
for name, cmd in steps:
    t0 = time.time(); r = subprocess.run(cmd, cwd=root, capture_output=True, text=True)
    tail = (r.stdout.strip().splitlines() or [''])[-1] if r.returncode == 0 else '\n'.join((r.stdout + r.stderr).strip().splitlines()[-12:])
    print(f"{'ok  ' if r.returncode == 0 else 'FAIL'} {name:18} {time.time() - t0:5.0f} s  {tail if r.returncode == 0 else ''}", flush=True)
    if r.returncode: failed.append(name); print('     ' + tail.replace('\n', '\n     '))
print('\nAll checks passed.' if not failed else f"\nFailed: {', '.join(failed)}")
sys.exit(1 if failed else 0)
