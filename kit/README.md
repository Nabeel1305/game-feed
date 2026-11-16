# The starter kit

Every new game starts here (his go-ahead, 16 Nov 2026: "build the starting kit"). It is a small, complete, working game ("Gold
Rings": tap the target when its ring turns gold) that already has everything every game must have, and passes every check. A new
game is made by writing its own rules, drawing and sounds over the example; the rest is already done and already tested.

## Start a game
    python3 tools/new_game.py <id> "<Name>" --prefix xx. --font "Title Font" --tag "LINE UNDER THE TITLE" \
        --genre Genre --intensity 1-5 --thumbs 1|2 --hook "One line for its feed card"
This copies the kit to `games/<id>/`, fills in the name, title font and storage prefix, adds it to `games.json` (next number,
`in-progress`, feed fields ready, never `in_app`), and writes a design stub in `specs/`.

## Check it, all in one go
    python3 tools/check_game.py <id>          (--quick skips the speed and registry steps)
Build, the game's own proof by robots, the basic controls with real touches, speed, the registry.

## The parts
| part | what | for a new game |
|---|---|---|
| `part1.html` | page, menus, styles (five colours at the top), utilities, the juice kit (`tools/juice-kit.js`) | colours, wording |
| `part2.js` | **the rules**: `RULES` (how-to card), `makeCfg(N, help)`, `newGame`, `step`, the player's actions, `finish`, `LESSONS`, `BLIND`, `honest`, `winNow` | rewrite |
| `part3.js` | drawing and juice: `onEvent` (sound, sparks, words for each event), `draw`, `hud`, the lesson panel | rewrite the drawing, keep the helpers |
| `part4.js` | sounds, synthesized (PLAYBOOK S1-S11) | its own voice |
| `part5.js` | shared: level memory, pause (Resume, Restart, Levels), levels list, end card, help after three losses, the feed hooks (`gameFeedStart`, `gameFeedLevels`), smoothness, the frame loop, `window.__sim` | rarely; add input |
| `bots.js` | robots that play using only `BLIND` and `honest` | never |
| `test_play.py` | the proof: spamming cannot win (every blind string of up to four moves, on every beat, and random moves), people who look win, the lessons, the sounds | only the targets, with a reason |

Add more parts (`part6.js`...) if a game is big: `build.py` takes every `part*.js` in order.

## The contract between the rules and everything else
- `newGame(N, {help, seed, teach, taught})` returns `G` with `t`, `over` (`null`, `'won'`, `'lost'`), `res` (`win`, `stars`, ...),
  `ev` (events this frame), `lesson`.
- `step(G, dt)` moves the game on; the player's actions are plain functions on `G` (the example's is `tap(G, x, y)`).
- Every mistake goes through one place that, during a lesson, costs nothing (`fault` -> `lessonMiss`); every success the
  lessons should count calls `lessonSee(G, 'what')`.
- `BLIND`: each letter a thing a thumb can do without looking (tap where a thing is but not when, tap the middle, swipe...). The
  test plays every string of them. If spam wins, the rules are wrong, not the test.
- `honest(G, o, mem)`: a person who looks, with `o.react` (seconds) and `o.acc` (how often a move lands). Make it as clumsy as a
  thumb on a phone, not perfect (Plunder's robots were too good and hid that it had become too hard).
- `winNow(G)`: the shortest real win, used by the controls test.

## What the kit already gives every game (and the rule it keeps)
- Instant start from the feed at his level (rule 7); level memory, a win saves the next level at once (rule 4); the same pause
  menu everywhere (rule 11); smoothness easing off a notch at a time (rule 12).
- Lessons in the first three levels; nothing lost while learning; passed lessons saved (Plunder 0.4.0).
- Spamming cannot win, proved by search (rule 1).
- Juice: shake, hit-stop, flash, sparks, floating words, one-line hints, haptics (never on failure, P11), a short loss moment (P23),
  stars, best run, help after three losses that only gives time.
