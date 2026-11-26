#!/usr/bin/env python3
"""Give a game a dryPlan(G): what its honest robot would do NOW, without doing it (26 Nov 2026, for tutorials that show the move for the
moment: the robot already knows the right move; the tutorial asks it, dry, and shows that move with the hand).
Usage: python3 tools/dry_plan.py <game> <action> [<action> ...]
Inside honest() (only there), every call `action(G, ...)` becomes `ACT.action(G, ...)`. ACT is the real actions, except during dryPlan(G),
when it is a recorder: the first action called is returned as [name, ...args] (G left out), with the robot's luck fixed (Math.random = 0.5),
no reaction delay (react 0) and no slips (acc 1). Nothing else in the game changes; the robots' games are exactly as before."""
import re, sys, os
gid, acts = sys.argv[1], sys.argv[2:]
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'games', gid, 'part2.js'); s = open(p).read()
if 'function dryPlan(' in s: sys.exit('already has dryPlan')
i = s.index('function honest(G'); j = i; depth = 0; started = False
while True:
    ch = s[j]
    if ch == '{': depth += 1; started = True
    elif ch == '}':
        depth -= 1
        if started and depth == 0: break
    j += 1
body = s[i:j + 1]; n0 = body
for a in acts: body = re.sub(r'(?<![\w.])' + re.escape(a) + r'\(G\b', 'ACT.' + a + '(G', body)
for a in list(acts):
    if 'ACT.' + a + '(' not in body: print('note: honest() never calls', a, '(left out)'); acts.remove(a)
s = s[:i] + body + s[j + 1:]
s += ("\n// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move\n"
      f"const ACT_REAL = {{ {', '.join(acts)} }}; let ACT = ACT_REAL;\n"
      "function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */\n"
      "  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }\n"
      "function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */\n"
      "  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }\n")
open(p, 'w').write(s); print(gid, 'dryPlan added for', ', '.join(acts))
