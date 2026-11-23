# Lessons and build notes

Everything learned building the first games. Every new game must follow the **rules**; reuse the **build notes** when a new game is similar to an old one (read that game's `index.html` in `games/<id>/`).

## Nabeel's taste
- **Clean screens.** Home = title + 2-3 big buttons (Play / Choose level / Rules). Rules on their own screen. No clutter, no pop-up text for things the game handles silently.
- **Looks:** as real as possible, in 3D (17 Nov 2026; it used to say "not hyper-real"). Real-looking objects (a proper revolver, proper buildings). Scenery drawn past the screen edges so camera moves never show a blank corner.
- **Win and lose moments:** winning must feel as good as losing feels bad (a sound and a visual for each). Keep each under ~2 seconds and let a tap skip to the next round.
- **Engaging and challenging**, with no easy way to win.
- **Every sound must be satisfying.** Crisp, layered, pitch-varied, never harsh or nagging, pleasant on the 50th play. Full rules and code in `PLAYBOOK.md` (Satisfying Sounds).
- **Engagement factors in every game, always, without being told** (his words: "I shouldn't have to tell you"). They are the research in `PLAYBOOK.md`: pick the ones that suit each game from the player's point of view, never all of them blindly, but never none.

## The audit of 22 Nov 2026 (read `specs/audit-2026-11-22.md` before changing any game from 9 on)
His words: "we're done making games... fix these 111 games... lots of them are below average... the graphics are just absolutely
dog shit... some of the soundtracks sound so robotic... the players' positioning is horrible... the controls on that hunter game
are horrible... the minute someone opens this game, they don't need to be a genius to understand the controls. Because you're a
genius, and that's what you forget." What that changed, for every game from now on:
- **Look at it before he does.** `/tmp/audit/shoot.py`-style sheets (level 1's first seconds, then level 5 at 3, 10 and 20 s,
  played by the game's own robot, the real 3D picture) for every game, every time. Passing tests said nothing about the levels
  being too dark to see, the hero being a speck, or the drink being a ghost behind a blob.
- **Light (tools/world3d.js):** a soft light from behind the player's eye in every 3D game (`fill`, `S.fill` scales it), brighter
  night, dusk, rain and storm, thinner fog. With the sun ahead of the camera everything facing the player was a black cut-out.
- **Music (tools/juice-kit.js, "the band"):** `bandStyle('jazz', { seed, key, bpm })` in a game's part4 gives it drums, bass,
  chords and a lead with a tune that comes back, swing, human timing and a little room echo, in one of sixteen styles. While the
  band plays, the old `music(() => ...)` lines are silent. Rhythm games (Drumline, Black Keys, Beat Dash) and Kart Kingdom keep
  their own music. **I cannot hear it**: it is checked by rendering it and measuring loudness and balance, not by ear.
- **Controls a first-timer gets at once:** a stick, a labelled button or two, and holds and taps. No swipes with meaning, no
  circles, no pull-backs, no drags onto targets, no separate SPRINT button (a full push of the stick sprints). On the first
  levels the next thing to touch glows and one yellow line says what to do (Mocktail Bar's `nextStep`).
- **Hidden gestures become something you can see** (second pass, 22 Nov): a double tap (Tag), a flick (Wolf Pack, Reel 'Em In,
  Balloon), a swipe up at the right moment (Surf), a swipe whose direction and length aim a throw (Whaling, as Hunter was) are
  all things nobody finds by themselves. Each is now a labelled button, a plain tap, a hold-and-let-go, or a ring drawn where the
  throw will land. The old gesture still works. What stays: gestures the whole genre uses and the screen shows (lane swipes in a
  runner, a slingshot with its arc drawn, swapping sweets, dragging a line between stations). Two sticks became one thumb in
  Drone Pilot: with one thumb there is no way to slide sideways, so the rules trim the sideways drift for you (`coord`), and a
  robot with only turn, climb and lift must still win (40 of 42 runs on levels 1 to 25).
- **A long list of buttons is a design fault, not a feature** (Convoy Escort: thirteen down to five): one button that steps
  through its settings (SPEED, DEPTH), and buttons that only exist while they can be used (GUN, CREW).
- **Typing is not a control** (The Bench): the sentence is built from taps; typing stays as an extra.
- **Sound work must be cheap**: the band's first room echo was a convolution reverb; on a busy machine two touch tests (Tennis,
  Ice Hockey) began to fail on timing, and a phone is slower than that. It is two short feedback echoes now. Re-run every game's
  `test_touch.py` after a change to the kit, not a sample.
- **Canvas `filter` on every draw call is slow** (Cake Boss icing): draw plain on an offscreen canvas, then one filtered blit.
- **`tools/test_controls.py` takes one id or none** (extra ids are ignored), and it rebuilds `out/app`: never two at once, and
  not beside `tools/check.py`. A failure at the end of the full run under load is run again alone before it is believed.
- **A known problem is fixed, not listed** (his words, 22 Nov, evening: "how can you not fix a known problem. Fix it"). The
  second pass ended with 22 games marked as having a known fault. Never hand him that: a fault written down is the next thing
  to do, in the same sitting. Two things made it quick: look again first (several were already cured by the shared light fix
  and nobody had looked), and most "tiny, empty, dark" complaints are the camera: frame what the player acts on (Battle Lines
  frames the armies, Sheepdog the flock, Harvest the beds, Golf turns a wide hole), then light, then colour.
- **What picks the action must be on the screen** (Tennis): the speed of a swipe chose lob or drive, which nobody could see and
  a slow machine got wrong. Now the length picks it and the shot's name is written by the thumb while it moves.
- **Canvas blur every frame halves the frame rate** (Shadow Crew's fog, like Cake Boss's icing): draw small and stretch.
  `imageSmoothingQuality = 'high'` on a stretched full-screen image is slower still: leave the default.
- **A team-mate who has finished his job stands still to be marked** (Gridiron receivers at the end of a route): give him
  something to do after it (work away from the nearest defender).
- **The team games' long proofs do finish** (Eleven about 40 minutes, the others under ten): they "never finished" on 22 Nov only
  because of the `//` comment bug. Run them after any change to how team-mates or opponents play. Eleven's found that easing
  the other keeper let random tapping fluke a goal (1 match in 480): ease what helps the player who looks (a surer aimed
  shot, softer tackles), not what helps any shot go in. Gridiron's "nothing is lost while a lesson is on" was flaky from the
  start: its first lesson is a single run, which blind tapping stumbles through; the check now asks what it means (never lost
  with a lesson still up), six times over.
- **A change to how a team plays is not finished until its long proof has run** (Ice Hockey, 22 Nov): my "get open" for its
  team-mates looked right and its quick checks passed, but the full test_play showed blind tapping winning 1 to 5 matches in
  480 (a random pass now found a man, a random shot followed). Three tunings moved the number about without curing it; the
  game already had forwards looking for space, so its own rules went back in. Check what a game already does before
  replacing it, and say plainly when a change is withdrawn.
- **A fixed short wait is not a test of the game** (GitHub, 23 Nov: "Sandworm: Resume carries the game on", 1 of 3540, on a
  push that had not touched it): the check gave the game 350 ms to draw its next frame after Resume, and a busy runner took
  longer. It now waits up to 4 s for the clock to move; a game that never carries on still fails. When a check fails on GitHub
  and passes here, read what the check times before believing either.
- **Sideways games on a narrow phone** (23 Nov, `tools/small_screen.py`): on a phone 360 wide the eleven sideways games' cards
  were taller than the screen, so the last buttons were off the edge (Eleven's NEXT LEVEL could only be reached by scrolling a
  card nobody knows scrolls). Every test until then ran at 390 wide. A card that does not fit is now shrunk to fit
  (`fitCards`). New code goes INSIDE the game's closure in part5.js (before the last `})();`): appended after it, it lands
  after `</html>` and never runs.
- **His notes must outlive the phone** (23 Nov): browser storage on a published page can come back empty, so the Game Review
  page writes every note to the page's `db` store as he types (and keeps a list of what has not got there yet). Proved live:
  his notes appeared in the store seconds after the page was republished.
- **Look at GitHub after every push** (`gh run list --limit 3`). Both pushes of 22 Nov failed there and I did not look: Splash
  Course's result card never came in the full controls run. The cause was real: a run ended in its first instant (only a robot
  can) saved an empty ghost trace, and drawing an empty ghost threw on every frame, so the game froze. "It passes alone" was the
  machine being fast, not the game being right. **Win at odd moments** (start, then `__sim.winNow()` after 0, 0.3, 1, 4, 9 s):
  the card must come and nothing may throw. Anything saved from a run (a ghost, a best) is checked before it is used.
- **The record of the audit is `PROGRESS.md`** (from `specs/progress.json`, `python3 tools/progress.py`): one entry per game
  with what was seen, what was changed, what was checked and how, and what is still open. "Verified" means: loads clean, its
  touch test and controls test pass on the current build, its picture has been looked at after the change, and nothing known is
  open. It never means heard by ear or felt on a phone: those are his.
- **The thing the game is about fills the screen.** Mocktail Bar is first person, looking down at the glass. Hunter's lens is
  longer and its grass shorter, so the animal is not a speck.
- **Team-mates get open** (Eleven `support`, Ice Hockey `getOpen`, Hoops `brain`): three times a second a team-mate without the
  ball picks the best of a handful of places: clear of markers, a clear line from the ball, a sensible pass away, ahead of the
  ball if he is a forward, not on another team-mate. The other team only learns it from level 8. Every player has a ring in his
  team's colour, and a white ring shows who a pass would go to.
- **Never put code after a `//` comment on the same line** (again): three one-line patches today ended in a comment and the rest
  of the line vanished ("Identifier 'G' has already been declared", and every test of that game timed out). Use `/* */` inside a
  line, and load every game after a sweep (`typeof window.gameFeedStart === 'function'`, no page errors).
- **A name in the kit can clash with a game's own**: Kart Kingdom had its own `const music`; the kit's `function music` broke
  the page only when the kit grew. Kart Kingdom's is now `trackMusic`.

## Rules for every game
0. **Early levels are for learning, tuned for real people.** Bots react perfectly; people don't. Make levels 1-5 clearly easy (slower, bigger targets/windows, softer hits, hints), then ramp.
1. **Spamming cannot win. On any level, the first included.** (15 Nov 2026, of Plunder's first build: "Spamming cannot win... Just repeatedly doing something cannot win. There needs to be a little bit of skill. This is why I love the boxing game.") Any repeated move, **at any speed**, must lose on **every** level: mashing, a slow steady beat of one move, a short string of moves on a beat, a control held over or wiggled, a button pressed on a count. "Early levels are for learning" (rule 0) means generous windows and soft punishment for someone who is trying to do the right thing; it never means a rhythm works. How to get there (all of it learned the hard way on Plunder, see its notes):
   - **By structure, not numbers.** On an easy level one right move is worth several of the opponent's, so a blind player who is right by luck a third of the time still comes out ahead. Make the *wrong* input cost, and cost more each time it is repeated, fading only with time (a slip is cheap, a habit is ruinous, at any tempo): Plunder's blow at a man on guard, its wasted broadside.
   - **The right move needs one read that no single input covers.** If one stroke blocks every blow, a rhythm of that stroke blocks every blow. Two plain sides, and a rule that a block must be *on* the blow's side, make the best blind guess a coin. One try per blow, or covering both sides in turn beats the coin.
   - **Nothing the player does may set the opponent's clock.** If hitting him makes him answer on a fixed beat, a rhythm can ride that beat. When he comes is his secret (a random wait), always.
   - **A rescue must not also be a reward.** A dodge that works without reading the side saved the blind player a third of the time; when it also opened the man, dodge-and-cut on a beat won. A dodge saves; only the block opens.
   - **Watch for cover.** An input that is "busy" or "stunned" time for the player can hide other inputs from their punishment (a stroke at the air kept the arm busy, so taps thrown under it cost nothing).
   - **Prove it by search, not by a few lazy robots.** The first lazy robots (mash, scribble, a slow beat) all lost, and "swipe down the middle three times a second" still won the first three expeditions. The proof is every short string of moves on every beat, played blind, in their hundreds of thousands (fast-forward makes this cheap: 300,000 fights in 40 seconds), plus random moves, plus the best ones replayed hundreds of times, **at level 1 as well as level 20**. Then trace a winning fight step by step: every hole above was found that way. Keep the search in the game's own test.
   - **And test with real touches and real drawing too.** The robots do not draw: the new "he cuts you" pose crashed the picture and froze the game, and only the touch test saw it.
   - A player who watches one thing (strikes only when the ring shows, fires only when FIRE lights) is using a little skill; he may win the first levels, and must fade soon after.
   The earlier games were only proved "past the first few levels", with a few lazy robots: search each one properly when it is next touched.
1b. **Teach, don't tell; a balanced feed.** The first three levels teach every move in play, one at a time, and play starts only once each is done two or three times (Plunder 0.4.0; the kit's `LESSONS`). And the feed must stay varied (16 Nov 2026): his taste runs intense, so in each set of five at most two are intensity 4-5, at least one is calm or light (CLAUDE.md, "Choosing games").
2. **No stalling or hiding loopholes.** Every game always moves toward an ending.
3. **Difficulty:** very easy at level 1, harder every level, never stops rising (steady to ~60, then `f = 60 + 15*log1p((L-60)/15)` forever), but always a chance to win: cap reaction windows at what a quick human can manage (~0.25-0.43 s), cap block/dodge chances, add some luck.
4. **Levels:** win to unlock the next; choose any unlocked level from a grid with stars; boss every 10th level; progress saved in localStorage under the game's own `storage_prefix` (see games.json). **The game remembers his level** (asked for 14 Nov 2026: "If I am on level 10 in boxing and I come back, I'm still on level 10 automatically... I can go to a lower level, but I can't go to a high level until I finish that level 10"). One rule does it: **the saved `level` is always the match he is in, or the next one once he has won.** So every start saves `level`; a win saves `level + 1` at once, not when he presses Next (he may swipe away from the result screen); the home screen and `gameFeedStart` read the saved level first (`savedLevel()`); "play again" after a win is a start, so it puts the saved level back. Lower levels stay open; higher ones stay locked until he wins his way there. A game with named levels instead of numbers is a ladder too (Bottle Cap Flick: Beginner, Amateur, Professional, Legendary).
5. **Longer and deeper as levels rise:** rounds (best of 3/5), points decisions when nobody is knocked out, more health on both sides.
6. **Controls:** two-thumb friendly; must work anywhere on the screen including the edges; never let the finger cover the target (offset crosshair); tap-to-select then drag-from-anywhere when a control could sit near an edge.
7. **Feed-ready:** every game runs inside the feed app with no changes, as long as it keeps to these: one button that begins play (listed in `feed.start`, default `#playBtn`); all game timing from `requestAnimationFrame`, `performance.now()` and `setTimeout`/`setInterval` (never `Date.now()` for game time: the feed freezes the first four when it pauses a game, not the date); sound through `AudioContext`; vibration through the kit's `vibe()`; saves under its own `storage_prefix` (never `gf.`, that is the feed's); no links or page reloads; works at any size (the feed gives it the screen minus a 56px bar). **And it needs an instant start:** when he taps the game's card he must be playing within a second, with no menu, countdown or intro, at his own level, in the kind of moment the card's clip shows (his choice, Nov 2026: "straight into the action"). The game defines `window.gameFeedStart(mode)`: `'mini'` is the instant start, anything else is the same as pressing Play. Set `feed.mini` to true and give `feed.live`, a JavaScript expression that is true once he is in live play: `tools/test_feed.py` fails the game if that takes more than a second after the tap. The instant start must not change who wins (see the Hippodrome note below); a game whose Play button already drops him into the action needs no code, only `feed.mini` and `feed.live`.
8. Keep call-out text clear of scenery text (a dark outline over busy backgrounds). Never show fake data, and never a guessed number either: if a figure isn't known yet, run the simulation on to get the real one (Hippodrome's finishing gaps).
9. **Character variety:** never a short fixed list of opponents. Build names and looks by combining long lists (titles, first names, epithets, places, and many independent accessory/colour choices), seeded by level, so opponents rarely repeat. (Nabeel noticed the earlier games' small name lists.)
10. Test on a 390x844 phone screen and look at a screenshot of every screen before sending.
11. **Basic controls, the same in every game** (asked for 14 Nov 2026: "I can restart that particular match. I can press pause, go to a lower level and play there. Just the basic controls"). Every game has a pause button, and its pause menu is always: **Resume**, then **Restart** and **Levels** side by side, then one quiet way out to the home screen, under a line saying which level he is on. Restart = this match again, same level, the game's normal start. Levels = the level list; Back returns to the pause menu with the match still waiting; picking a level starts it at once. The ids are fixed so the tests and the feed can find them: `#pResume`, `#pRestart`, `#pLevels`, `#pQuit`, `#pLvl`. The game also defines `window.gameFeedLevels()` for the feed's own Levels button: if a match is on, pause it and open the list as from the pause menu; otherwise open the list over whatever screen is up, and put that screen back on Back. Menus over a live scene get a darker backdrop (`#ovPause,#ovLevels`) so the words are the only thing to read. Leaving a match by Restart or Levels must never keep something a loss would have taken away (Zenith: it ends the run of saves), and the pause itself must not help (High Noon: resuming during the count puts his thumb back to the start). `tools/check.py` refuses a game without these; `tools/test_controls.py` tries them for real in every game.
12. **Smooth on a cheap phone, checked before he plays** (15 Nov 2026, of Bandit: "The game looks really fun. It looks amazing. But for some reason it's lagging"). I cannot see his phone, so a game must be shown to be light before it is sent:
    - Run `python3 tools/speed.py`. It times a frame of every game on a computer slowed down four times with no graphics chip (the worst case a phone can be in). A new game must sit among the games he already plays happily, not far past the slowest of them. Bandit as first sent took over one and a half times as long per frame as Hippodrome, the heaviest game he had, and nobody had measured it.
    - What is slow on a phone, and must stay out of anything drawn every frame: **painting a large area in many pieces** (Bandit's cloud floor was about 100 strips of pattern, each the full width of the screen at its full sharpness: three quarters of every frame); **`shadowBlur`** (put a dark outline behind text with `strokeText` instead); **outlining shapes** (fill then stroke of every flat piece of a jet is twice the drawing, and outlines are the slowest kind: draw each piece a hair bigger instead, Bandit's `fat()`); **work that grows with the screen** (smoke laid once per frame is twice the smoke on a 120-a-second screen: lay it by the clock).
    - A game with a big moving backdrop (a 3D-looking view) paints that backdrop with the phone's graphics chip, on its own canvas behind the main one, and keeps the plain way as a fallback: see "The view" under Bandit.
    - Such a game also **times its own frames and eases off** on a phone that cannot keep up, and remembers where it got to: copy "keeping it smooth" from Bandit's `part4.js` (and its test, `games/bandit/test_pace.py`). It gives the test hook `__sim.finest()` (hold the finest picture), which `tools/speed.py` and card pictures use.
    - Its pause menu carries one small grey line saying how it is doing on this phone (Bandit: "Picture 1 of 4 · 60 a second · fast sky"). **If he says a game lags, ask him to pause and read that line out**: it says which notch the game eased off to (1 is the finest), how many pictures a second it is managing ("halved" = a fast screen, drawing on every other refresh), whether the graphics chip is painting the sky ("fast sky") or not ("plain sky"), the screen's own rate if it is a fast one, and "fixed" if easing off made no difference and it stopped trying.

## How to test (fast)
- Best pattern (from Steel & Honour): add a `window.__sim` hook to the game itself (start headless + muted, step(dt), act(...)) and run bots inside the page with one `page.evaluate`, so hundreds of bouts take seconds.
- Make a test copy of the page that exposes hooks (`window.__G`, geometry helpers, `__lvl(n)`), and drive it with Playwright.
- **Run cheat tests in fast-forward:** call the game's update loop directly (many steps, no drawing) rather than real time. Real-time testing of High Noon took ~10 minutes per run.
- Bots, at several levels (e.g. 1, 5, 15, 40, 80): a **spammer** (obvious repeated move), a **smart** player (~250 ms reactions, small aim error) and, for timing games, a **jumpy** player. Spammer must lose past the early levels; smart must win early and keep a chance at the top.
- **Racing or pacing games:** also test the lazy *lines* (never brake, long way round, ride the wall), split results by starting position, and check that a faster player can actually get past an equal rival. If nobody can pass, the start decides everything.
- **Anything drawn in fake 3D:** zoom in on screenshots taken while turning and while hugging a wall. Scenery must be nailed to the world: nothing may slide, pop in at a set distance, or hang over an edge. Prefer flat shapes; pin pictures the way Hippodrome's `texQ` does.
- `python3 tools/check.py` loads every game and fails on any JavaScript error. GitHub runs it on every push.
- `python3 tools/speed.py` times a frame of every game on a slowed-down computer, side by side (rule 12). Run it before sending a new game or a change to how a game draws. It compares games; it does not say how fast a phone will be.
- **The test machines have no graphics chip.** A game that paints with the chip (WebGL) notices and uses its plain way there, so by default only the plain way is being tested. A test that should try the chip's way sets `window.__softGL = true` before the page loads: `tools/test_controls.py` does it for every game, so GitHub plays Bandit's controls the way a phone draws it, and `tools/check.py` loads it the plain way. The chip's way cannot be timed on these machines (the processor pretends to be the chip, slowly).
- `python3 tools/test_controls.py` plays every game's basic controls with a thumb (rules 4 and 11): the level he was on comes back, pause freezes, Resume, Restart, Levels (lower open, higher locked, Back, pick), and a win moves the saved level on before any button is pressed. A new game needs an entry in its `LADDER` table: how to read its clock and its match, and JavaScript that makes the next thing that happens a real win (set the opponent's health to almost nothing and land one real blow, jump the chariot to just before the line), so the game's own winning code runs.

## Build notes per game

### 1. Bottle Cap Flick (`games/bottle-cap-flick/`)
- Built from `src/engine.js` (physics, rules, computer player; no DOM) + `src/game.tpl.html` via `src/build.py`. `src/train.js` runs self-play matches in Node (`node train.js ladder 20`, `node train.js speed`).
- Board in fixed units 600x1000 scaled to fit; caps radius 24. Physics at a fixed 1/120 s step: linear friction (decel 950 units/s^2), equal-mass elastic collisions (restitution 0.9) with overlap push-apart. Deterministic, so the computer can simulate shots exactly.
- Rules: off a long side = dead. Completely past either end line = can't fall off (clamped, 0.3 bounce: players' legs). At rest: an enemy cap past your line becomes yours if you have dead caps, else it's removed; your own cap fully behind your own line is silently moved back onto the line (anti-hiding).
- Controls: tap a cap to select it (white ring), drag from anywhere; pull vector = finger minus drag start; full power at 170 units, max speed 1700. Setup: drag caps in your half; Shuffle / Rows / Ready.
- Computer: candidate shots = ghost-ball aims that push each enemy cap toward the nearest side edge or toward its own line, plus direct lines, at 4 powers, plus random shots; each simulated to rest and scored (cap counts x12/x10, danger near edges/lines). Levels differ by shots considered, aim noise, careless-shot chance; Legendary looks one move ahead (top 8 x opponent's best of 120 replies). Planner is a generator run in 12 ms slices so the screen never freezes. Each level beats the one below 85-100% in self-play; scoring weights made no difference, search and accuracy did.
- Look: wooden stool with grain on an offscreen canvas, chalk lines, knees past each end, crimped caps (21-tooth star), orange vs red (no real brand logos). Series best of 1/3/5/7, loser starts the next game.

- **1.0.1:** `gameFeedStart('mini')` for the feed: straight to the table against the computer (level last chosen), standard formation, his flick first. Nothing else changed, so the standalone page was not republished.
- **1.1.0 (14 Nov 2026): the basic controls and a ladder.** The four computer levels are now a ladder: beat the computer at one (a game, or the series if it is best of 3/5/7) to open the next; he starts on Beginner, and a win moves his saved level on at once. Saves under `bc.` (`level`, `beaten`, `bestOf`; it saved nothing before). The menu button in the bar is now a pause button: Resume, Restart, Levels, Main menu (it used to drop him straight to the menu, losing the match on a stray tap). The computer waits while paused (its thinking, its aim and the caps all hold). The result card after a win offers "Next level: X" first. The setup screen shows his level, locks the ones he has not reached and remembers the match length. `window.__sim` (new): `state`, `sweep(team)` to end a game for the tests, and `shot()`, which searches every candidate flick with the real physics and returns the most spectacular one as screen points for a thumb (used to film the card).

### 2. Knockout (`games/knockout/`)
- Opponent drawn with canvas shapes (gradient torso, head with hurt/angry faces, gloves with cuffs); your red gloves at the bottom corners. Seeded names/looks per level; gold-gloved boss every 10th.
- Input per pointer: tap (<22 px, <350 ms) = punch with that side of the screen, head or body by height; quick horizontal flick (>36 px, <380 ms) = dodge; quick flick up = uppercut; two still fingers >110 ms = block; slow drag (>200 ms) = step.
- Enemy states: idle / windup / strike / recover / hurt / block / cover / slip. Telegraph: glowing glove (white jab, orange hook from a side, red uppercut). Dodge away from a hook; uppercuts break blocks; hitting him while he recovers from a miss is a COUNTER (x1.6).
- Anti-spam: stamina (jab 11, cross 17, uppercut 30; regen 16/s, 34/s after 0.6 s idle). 4+ punches in 1.6 s multiplies his slip chance; a slip leaves you off balance 0.28 s and he fires a fast punish counter (x1.2-1.9) your punches can't interrupt. After 2-3 hits in a row he covers then fires back. Below 25 stamina he presses with combos for x1.35 and your block stops only about half.
- Curve: windup 265 + 640*e^(-f/22) ms; gap 430 + 1400*e^(-f/25) ms; block up to 0.68; slip up to 0.48; combos from level 3; feints from 10. Rounds: 1 x 60 s for levels 1-4, then 3 rounds of 45-90 s; 25% heal between rounds; he tires late in a round. No knockout -> rounds won, then damage. 3.5% lucky shots do triple damage.
- Tests: spam loses from level 2; a sharp player wins up to ~90.

- **1.1.1:** `gameFeedStart('mini')` for the feed: the bell rings at once (`G.intro` cut from 1.2 s to 0.05 s). The fight clock and the opponent's first move only run once the fight is live, so nothing about the fight changes. Standalone page not republished (nothing visible changed there).
- **1.2.0 (14 Nov 2026): the basic controls** (rules 4 and 11). Pause menu is Resume, Restart, Levels, Give up; the level list remembers where it was opened from (`showLevels('home' | 'pause' | 'feed')`) and puts back whatever screen was underneath; pause also works during the "LEVEL n" walk-in. A win saves `level + 1` at once.

### 3. High Noon (`games/high-noon/`)
- Real perspective: `P(X, Y, z)` projects metres to screen (focal length 0.62 x height, eye 1.7 m, street half-width 4.4 m). A `TOWN` list of buildings per side drawn far to near: end wall, roof, false front with stepped top, clapboard, windows, doors, batwing doors, bank pilasters and bars, signs (text via an affine transform onto the facade), boardwalk, posts, porch roof, barrels, hitching rail; distance haze. Sky/ground drawn far past the screen; the town continues past the edges.
- Duel: thumb on the holster -> ONE / TWO / THREE + random pause -> DRAW!. Fake calls from level 5 ("DRAT!", "DRINK!", "DROP!"...). Moving/lifting early = jumped the gun = free shot for him (levels 1-2 just restart the count).
- Shooting: drag up from the holster; crosshair min(90 px, 10% of height) above the thumb; release fires; 6 bullets, 0.33 s recock; aim wobbles when wounded. Headshot wins the round. Body: 2-4 hits by level (+1 boss), grazes from level 6, and from level 6 a body hit makes him fire back within 0.22-0.42 s.
- Outlaw curve: draw time 0.43 + 1.05*e^(-f/10) s; accuracy up to 0.86; sway; sidesteps from level 7; farther away as levels rise; first to 1/2/3 rounds.
- Feel: revolver drawn piece by piece (tapered barrel, fluted cylinder, hammer, brass guard, walnut grip, leather glove, cuff) with recoil, flash, smoke. Losing ~1 s (slight tip, partial grey, one heartbeat). Winning: hat flies, golden flash, twangy guitar via Karplus-Strong plucked-string synthesis. Auto-continue after ~2 s or tap to skip after 250 ms. Losing the duel shows a tombstone.
- Tests: jumpy thumbs lose from level 3; sloppy body shots win early, lose from ~14; a sharp player wins up to ~70.

- No instant-start code needed: Play already goes straight to "put your thumb on the holster" (`feed.mini` is true, `feed.live` is the `ready` phase).
- **1.2.0 (14 Nov 2026): the basic controls** (rules 4 and 11), and its own `gameFeedStart` (it used to rely on the feed pressing Play). Pause is allowed any time the duel is not over, including between rounds; resuming during the count still sends his thumb back to the start, so a pause cannot be used to wait out the call.

### 4. Steel & Honour (`games/sword-fight/`)
- First-person knight duel built on Knockout's structure. Knight drawn at scale `U*0.64` (at `U*0.95` he filled the screen). Castle courtyard: wall with crenellations and stone courses, four towers (two off screen for tilts), gate, banners in the challenger's colours and charge, torches, tilt-yard rails.
- Knights are mixed from long lists: titles (by gender), 55 male / 30 female first names, 40 epithets, 40 places, 10 boss names; looks = metal finish (6), helmet (8 kinds incl. open-face with skin/beard/scar/eye patch), plume, two tabard tinctures and a heraldic charge (12 incl. a simple lion), cape, sword type (6), pommel gem.
- **Free sword control (Nabeel's request):** your blade tip follows your finger while it's down; on release a swipe from A to B is a stroke, a tap is a poke at that exact spot (head 8, body 4: plate shrugs off pokes). Strokes during his swing are parries; otherwise slashes that hit whatever the stroke crosses (head 14, body 10). A hard pull straight down near the bottom = step back.
- **His attacks:** cuts are lines through you from any angle (upper sides and overhead early; flat cuts from level 6; rising cuts from 14), thrusts aim at a spot. Telegraph: blade drawn back on the side it comes from + gleam; levels 1-4 also draw the dashed path, the block zone and "BLOCK HERE"/"SWIPE THROUGH"; 5-9 faint; 10+ nothing. Windups never below 0.36 s.
- **Parry geometry:** your stroke must cross his blade's path within `parryTol` (28 + 30*e^(-L/14) px at 390 wide) and **before 42% of the path** (the side it comes from). A thrust needs your stroke to pass through its spot. Timing window `parryWin` = 0.14 + 0.46*e^(-f/36) s before impact; last 38% = perfect -> 0.95 s stagger -> riposte x2.2.
- **Cheats the tests found and the fixes:** (1) swiping through the middle every time parried nearly everything even at level 90 -> the 42% rule. (2) A tired swipe didn't count as a swing, so spam slipped in "careful" parries -> every swipe sets `lastSwing`. (3) Nonstop pokes won to level 8 -> pokes can't interrupt his swing, pokes do little to armour, and attacking within 0.3 s of his impact makes his hit x1.4 ("CAUGHT SWINGING"). Plus the anti-flail rule (no parry if you swung in the last 0.4 s; 0.2 s on levels 1-2) and the spam read (block 0.28 + 0.07*level, up to 0.85) with punish counters.
- **Learning levels:** Nabeel found level 3 very hard even though the human-speed bot won easily (bots read the exact path instantly; people need time to see the angle). Now `easy` = 1 at level 1 falling to 0 at level 6 scales windup (+50%), parry window (+0.2 s), block tolerance (+60%), how far into his swing you can still meet it (+20%), his damage (-40%) and health (-25%); arrow/path hints through level 5. **Lesson for all games: tune early levels for real people, not for the bots; bots overestimate humans.**
- Armour: segmented plate (layered pauldrons with rivets, gorget lames, ridged breastplate, fauld lames, mail skirt, cuisses, knee cops, greaves), surcoat open at the sides, plated arms with elbow cops and gauntlets, dents and scratches as he's hurt.
- Test hook `window.__sim` (start, step, stroke, poke, geo, you, tol). `test_sim.py` bots: spam, poker, center, panic, human (0.33 s, sloppy aim), smart. Results: spam loses from ~5, pokes from ~5, centre-swipe from ~12, panic from ~5; human-speed wins through 40 and about half at 90.

- **0.12.1:** `gameFeedStart('mini')` for the feed: "EN GARDE!" at once (`G.intro` cut from 1.4 s to 0.05 s; nothing in the duel runs during the intro). Standalone page not republished (nothing visible changed there).
- **0.13.0 (14 Nov 2026): the basic controls** (rules 4 and 11). `startBout()` is now the one way a bout starts (Play, Next, Again, Restart, a picked level, the feed).

### 5. Zenith (`games/zenith/`)
- **Built from parts:** `part1.html` (page, CSS, helpers) + `/*KIT*/` (tools/juice-kit.js) + `part2.js` (sounds, mission generator, hero/people/monster drawing) + `part3.js` (city scenes, hideout) + `part4.js` (the six mission templates) + `part5.js` (patrol flow, flight, alert card, SAVED stamp, input, screens, test hook). Run `python3 build.py` to make `index.html`; edit the parts, never index.html.
- **Mission generator = template x who x place x twist.** Six templates hold all the gameplay (catch, zap, fight, fire, lift, monster/villain); everything else is lists (20 people/animals, 8 groups, perches per scene, 8 threats, 10 gangs x 8 crimes, 10 buildings, 10 vehicles, 10 monster types x 6 creatures, 8 villain titles x 10 themes, 16 places in 6 scenes, 3 times of day). New variety = add to a list; a new kind of play = a new template object with make/update/draw/down/move/up.
- **Each template has its own anti-cheat**, proven by bots in `test_sim.py` (`python3 test_sim.py 1,3,6,12,25,50 6 catch,zap`): catch has a hero speed limit and spread-out fallers (staying in the middle loses from patrol 3); zap has a small focus point plus a heat meter (sweeping loses everywhere); fight has bystanders and a recovery after a miss (tap-spam loses from patrol 5); fire has a breath meter; lift is unstable **and the load is off-centre (passengers crowd one side, and may shift halfway)**, so holding still loses from patrol 4; monsters have armour except when the core opens, and lasering armour heats you faster.
- **Lesson:** "hold in the middle" survived the lift until the load got a constant off-centre push. A bias that the player must actively counter beats more random noise.
- The flight, the alert card and the SAVED stamp only happen on screen; the test hook (`startType`) jumps straight into a mission.
- Patrol = level: 3-6 missions, 3 city-trust hearts, stars by missions failed, a monster closes every 5th patrol and a villain every 10th. Best "saves in a row" and lifetime "citizens helped" are kept (`zn.bestStreak`, `zn.rescues`).
- The hero is our own design (teal suit, gold cape, gold Z bolt, mask). Don't drift toward any real hero's look.

- **0.1.1:** `gameFeedStart('mini')` for the feed: the first alert card of the patrol is skipped (`SKIP_ALERT`) and he takes off at once; the flight stays because it is play, not an intro. Later missions keep their alert cards. Standalone page not republished (nothing visible changed there).
- **0.2.0 (14 Nov 2026): the basic controls** (rules 4 and 11). Pausing lets go of whatever he was holding (and can never count as a dodge flick). Restart or picking another level mid-patrol ends the run of "saves in a row": walking out must not protect a streak a failed mission would have ended. `__sim.go(L, type)` starts a real, live patrol on one kind of mission (used to film the card: the giant monster at patrol 5).

### 6. Hippodrome (`games/hippodrome/`)
- **Built from parts** like Zenith: `part1.html` (page, CSS, helpers, saves) + `/*KIT*/` + `part2.js` (sounds, names, venues, `makeRace`: the field and how forgiving the level is) + `part3.js` (track, physics, rivals' driving, collisions, race flow, `settle`) + `part4.js` (the behind-the-chariot view: camera, arena, chariots) + `part5.js` (feedback, HUD, two-thumb input, screens, loop, test hook). `python3 build.py`, never edit index.html.
- **The view** is plain canvas 2D made to look 3D: a camera that only turns left/right (the horizon just shifts), flat polygons clipped where they pass behind the camera (`poly3`), walls, bands, beams and roofs as flat shapes, the crowd and the row of columns as pictures pinned to the stands (`texQ`), everything standing on the sand sorted far to near, and one wide panorama strip per venue behind it all. Costs about 1 ms a frame (100-300 picture strips).
- **Where a chariot is:** `p` metres run along the centre line, `d` metres off it (negative = inside). The track is two straights and two half-circles, run counter-clockwise. In a turn the team is thrown outward by `kc * v² / rEff(r)`; the reins push back by up to `VLAT`.
- **Two thumbs:** left half = reins (slide from wherever the thumb lands), right half = whip (tap under 230 ms) or rein in (hold). The whip has a beat (ring closes on the button); the horses' wind is the budget.
- **Lesson: the long way round must cost more than it gives.** With true physics (grip speed grows with the square root of the radius) a wide line flat out was as quick as a tight line reined in, so never reining in won to level 45. Now grip grows slower than the radius (`rEff = r0 * (r / r0)^0.6`), so the inside really is the fast way.
- **Lesson: a punishment must not double as a tool.** Sliding scrubbed speed, so sliding was a free brake and never reining in still won everywhere. Now a slide throws away the whip pace, the team cannot pull while it slides, the wheel lifts if you force the reins (tip over from level 8), and the wall pins you to a crawl.
- **Lesson: test the lazy lines, not just the lazy inputs.** Bots that borrow the rivals' steering can hide a loophole. `test_sim.py` now has `humanNoRein`, `nobrake`, `outside` (long way round, flat out), `midNoRein`, `steerOnly`, `spam`, `spamleft`, `wall`, `idle`. All must lose after the learning levels.
- **Lesson: equal pace means nobody can pass, and then the starting draw decides the race.** At the top the near-perfect bot won 12/12 from the front row and 0/12 from the second. `test_sim.py` now prints every cell split by starting row: read that split, not just the total. Fixes: rivals turn in one lane off the post and close on it mid-turn, so a tighter turn from close behind takes the inside (and they take it from you if you run wide); the field keeps a wide spread at every level so back-markers can always be passed; against a champion you start beside them.
- **Lesson: never show a guessed number.** The finish banner estimated the gap one way and the end card another (5.5 s vs 9.2 s). Now `settle()` runs the rest of the field to the line out of sight (copy the cars, step the race, read the times, put the cars back), and both screens show that one real result.
- **Lesson: anything close to the camera must fade.** A rival just behind you filled the screen and hid your own team. Rivals now turn ghostly as they near the camera. Call-outs over a busy crowd need a dark outline.
- **Lesson: a stretched picture is not perspective (v0.1.1).** The crowd was one picture per stretch of stands, skewed to fit. Seen at an angle it hung over the wall onto the track and slid about as the camera turned (Nabeel: "the audience seems to lag inside the race course... make the audience static"). Fixes, all in `part4.js`: (1) `texQ` cuts each patch into upright strips at fixed places on the stands, each short enough that perspective barely changes across it (cuts evenly spaced in depth ratio; how many comes from a 2-pixel tolerance), so the picture is nailed to the wall; (2) anything flat (walls, painted bands, beams, roof) is a flat shape, exact from any angle, drawn a hair long at both ends so no seam shows; (3) no detail switches on or off at a set distance from the camera, because that boundary travels with you and looks like the scenery moving; (4) the crowd is one still picture (the two-frame cheer is gone); (5) each picture has pre-shrunk copies (`ripmap`) so far or steeply-seen patches do not sparkle. Check: close-ups of the stands on a straight, hugging the outer wall and mid-turn, plus a still-camera frame diff (the stands must not change by one pixel).
- **Chariot combat (v0.2.0).** Swerve into a rival who is level to ram; damage comes from the real sideways closing speed, more for wheel on wheel and for a chariot held against a wall; the striker takes a quarter back. Rough rivals come across, wind up with a warning (red screen edge on their side, marker, "!", sound, haptic), then swing; rivals may dodge your swing. A chariot at zero breaks up and is out. All of it lives in `part3.js` (`ram`, `hurt`, `destroy`, `aiFight`, `endOut`); the look in `drawRig`, `breakUp`, `planks`, `float`; settings per level in `makeRace` (`tell`, `ramRate`, `ramGap`, `dmgIn`, `rough`). Test with `python3 test_sim.py 4,10,20,30 10 human,humanNoDodge,brute,hunter,humanHunter,bruteNoRein`.
- **Lesson: the obvious answer to a warning must work.** First version: the attacker followed you across the track while it wound up, so steering away as soon as you were warned got you crushed on the far wall (a bot that dodged at once was destroyed 5 times in 6). Now it holds its line while it winds up: with room, steering away always works, whenever you do it; against a wall it never does. That is exactly what Nabeel asked for.
- **Lesson: one attacker at a time, with a breather.** Four rough rivals all free to attack turned the pack into a brawl: a very good bot starting on the second row got through 0 times in 8 at race 45, even dodging everything, because every dodge costs ground. A rule that only one rival may attack, then nobody for 7-10 s, brought it back to about half.
- **Lesson: a new weapon must not beat the game it is added to.** Bots that set out to ram (`hunter`, `humanHunter`, `brute`, `bruteNoRein`) have to do no better than the same driver just racing. Keep the striker's cost (a quarter of the blow back, lost speed, lost line) and let good rivals dodge.
- **Lesson: a camera close behind cannot show who is beside you.** A rival level with you 4 m away was off the screen. Pull the camera back and widen it while someone is level, mark off-screen neighbours at the screen edge, and fade only the rivals that sit between the camera and your own chariot (a rival to the side must stay solid: you need to see it coming).
- **Lesson: one blow should never take most of a chariot.** Stacked bonuses (wheel x pin) took 67 of 100 in one hit. The player's chariot now feels 35-80% of a blow (rising with the levels), the two bonuses together are capped at 1.6, and rivals' chariots are simply weaker (80/95/130).
- **Learning levels:** the team reins itself in before the turn (fades out by race 8) and steadies itself inside the turn (gone after race 10); weaker outward throw to race 6; painted braking zone and gold line; one coach line at a time. A first-timer bot gets through races 1-5.
- **Help (P2):** after 3 straight losses rivals drive a touch slower (`uA - 0.12`, `cs - 0.04`); nothing about the player's rules changes. Rerun the lazy bots with `help` as the 4th argument.
- Fair-bot profile after tuning: human-speed bot about 100% to race 18, half at the race 20 champion, fades in the 30s; practised bot to about 45; very good bot 75-90% at the top; near-perfect bot wins every champion race. Rival skill tops out around race 57.
- Sounds: gallop = three soft hoofbeats then an accent on the whip beat; whip crack climbs the pentatonic with the chain; looping beds for wheels, wind, crowd, skid and scrape (`LOOPS`), all faded by speed and slide. `__sim.soundCheck()` peaks all under 0.5.

- **0.2.1:** `gameFeedStart('mini')` for the feed: `quickStart()` replaces the 3.2 s trumpet count with two quick notes and "GO!" (0.6 s), no false start during it, everything else the same race. `python3 test_sim.py <levels> <n> <bots> quick` runs the bots with it; results must match the full count (they do: human, good, expert and smart at races 5 to 80, 80 races each). A rolling start was tried first and thrown away (see "An instant start must not change who wins" under the feed app). Standalone page not republished (nothing visible changed there).
- **0.3.0 (14 Nov 2026): the basic controls** (rules 4 and 11). Restart runs the race's own counted start (only the feed's first tap uses the quick one). The level is saved as "through to the next race" the moment he finishes in a qualifying place.

### 7. Bandit (`games/bandit/`)
- **Built from parts** like Hippodrome: `part1.html` (page, CSS, helpers, saves) + `/*KIT*/` + `part2.js` (the fight: flying, locks, missiles, flares, cannon, the other pilot, `makeCfg`; no drawing, so bots run it fast) + `part3.js` (the view) + `part4.js` (sounds, feedback, HUD, two thumbs, screens, loop, test hook). `python3 build.py`, never edit index.html. Spec: `specs/07-bandit.md`.
- **The view:** a camera 34 m behind and 11 m above the jet that follows its heading and pitch and takes half its bank. **The cloud floor** is one small picture that joins up at its edges (made once from noise, lit from the sun's side), nailed to the world so it runs for ever, with haze over the horizon.
- **The sky, the sun and the cloud floor are painted by the phone's graphics chip** (WebGL, version 0.2.0), on a canvas of their own (`#bg`) behind the main one (`#cv`), which is see-through wherever nothing is drawn. Every dot of the sky canvas works out which bit of sky or cloud it is looking at, in one drawing; it is painted at the page's size, not the screen's full sharpness (clouds are soft), with the far clouds kept crisp by the chip's own filtering. Jets, smoke and the HUD are still plain canvas 2D on top. `glInit`/`glDraw` in `part3.js`.
- **The plain way stays as the fallback** (`drawSky`): strips of the cloud picture from the horizon down with `CanvasPattern.setTransform`, drawn small on a canvas of their own and stretched onto the main one. It is used when the phone has no usable chip, when the chip is taken away mid-game (it comes back by itself), when the first picture from the chip comes out black, and on test machines (which only pretend to have a chip). Both ways must look the same: after changing either, look at them side by side, frozen at the same instant, with flares out and an explosion going off (`__sim.gl(false)` switches to the plain way, `FX.stop = 1e9` freezes the fight).
- **Glows across two canvases.** Engines, fire, flares and missiles add their light to what is behind them (`'lighter'`). With the sky on another canvas there is nothing behind them to add to: the glow would hide a little sky instead. So for each glow the sky canvas is made brighter by exactly what the main canvas hides (`glQuad`: a second drawing on the sky canvas that multiplies instead of painting). One thing cannot be made up for: against a bright sky an orange glow adds up to white, and across two canvases it stays orange. That is why the flash of an explosion has a whitened twin for the fast way (`TEX.flash`).
- **Keeping it smooth** (`part4.js`, rule 12): on a fast screen that it cannot keep up with, it draws on every other refresh; then up to three notches of a less fine picture (`STEPS`: the size of the sky, the sharpness of the main canvas, how much smoke at once). (At 90 a second it tries one notch less fine before halving, in case that keeps all 90.) A notch that makes no difference is taken back; twice, and it stops trying (something else is setting the pace). It decides on a second of frames, half a second if the phone is plainly struggling, so the first fight on a slow phone stutters for a few seconds and then settles. The screen's own rate is read from the gaps between refreshes (`lowGap`): the short gaps, unless the gaps are merely uneven (a jittery clock), when the middle one is used, so a 60 screen is never mistaken for a fast one and halved to 30. Saved as `bd.smooth`, `bd.half`, `bd.flat`. Five visits after easing off it tries one notch finer again, in case the phone was only busy that day; if that fails, ten visits later, then twenty, forty, eighty (`bd.visits`, `bd.next`, `bd.wait`). `python3 games/bandit/test_pace.py` plays pretend phones at it with the page's clock faked.
- **Lesson: measure before he plays.** He was sent a game that took about 180 ms a frame where Hippodrome took about 110 (a level-12 fight, on a computer slowed down four times, with no graphics chip), and "it's lagging" was the first thing he said. Three quarters of that was the cloud floor: about 100 full-width strips of pattern, at the screen's full sharpness, every frame. Of the 45 ms left, more than half went on things that are now gone or moved: an outline round every flat piece of both jets, soft shadows behind the HUD text, and the sky's own washes of colour. After: about 20 ms for everything on the main canvas, plus the sky, which this machine can only time while pretending to be a graphics chip (about 50 ms all told). **None of this was measured on his phone**; the pause menu's grey line is how to find out.
- **Jets** are lists of flat pieces (`loft` for bodies, `plate` for wings and fins), turned, lit by the sun, far pieces first. Three airframes (twin tail, delta with canards, swept wing), ten paints, seven trims, sixty call signs, fifty surnames, 400 squadron names. The hero is our own grey twin-tail: do not drift toward any real aircraft.
- **A mirror** opens while he is behind you or his missile is in the air: a second, long-lens camera that looks straight at him (flipped left to right), so he is always in it, head-on while he locks, with his missile ringed in red. A fixed look-back view was tried first: he was a speck or out of frame most of the time. His engine glow is only drawn from behind (it showed through his nose).
- **Lesson: a rule that needs you behind him makes the whole dogfight.** With locks from any angle, head-on passes ended fights in five seconds (two missiles in the face before he could react) and nothing ever came from behind. With locks only from behind, shots are tail chases (time to react, so flares and distance matter), his danger always comes from behind you (so a mirror is enough), and "get on his tail" is the game.
- **Lesson: an enemy who only chases never arrives.** Equal jets cannot catch each other, and pure chasing at full speed flies straight past. He needed: a burst of speed from far back (so do you), holding back when close behind, his best turning on an attack run, and a few seconds flying straight after he fires. That last one is the player's opening and gives the fight its beat: he attacks, you defend, he is open, you attack.
- **Lesson: count the shots per minute, not just the wins.** The first balanced-looking table hid fights where each side fired about once a minute and most losses were fuel. Wider ring, a lock that fades slowly instead of dropping, and less weaving brought it to five or six a minute.
- **First-pass tuning, to revisit after he plays:** the bots never mistime a flare, so they take almost no hits and their losses are mostly fuel; real thumbs will be hit more. If he finds it too hard, lengthen `myHi`; too easy, shorten `breakAfter` and `foeLock`.
- **On the app since 15 Nov 2026** (his words after the lag was fixed: "Bandit is fucking awesome !!!! Add it to the feed please"). It is the first game that is not a core game: played over the internet, with Save in the Games list. His sorties on the test page do not come with him (the app keeps its own saves): tell him so when a game moves across.
- **Its clip** (`preview.json`): a level-12 sortie staged with him 195 m ahead and a little off the nose, already hit (so he trails smoke and one missile finishes him), out of flares, weaving gently (`G.cfg.jink` turned down for the take, or at that range he slips out of the ring as the lock completes), and not on an attack run (`runT = 0`: left as spawned he turned on us and the take never came). Real touches do the rest: the left thumb goes down and follows him (`follow`), the right thumb taps FIRE a tenth of a second after the lock. The clip starts 0.6 s before the lock, the kill lands at about 1.7 s, and the thumb keeps following the wreck so it stays in shot. It is filmed with the chip's sky at the finest picture, at half speed (`"slow": 2`), because this machine could only draw about 13 of those frames a second and the other cards run at 24.
- Test hook `window.__sim` (start, step, set, place, rel, G; for the picture: `smooth()` says which notch, how fast and which sky, `gl(false)` the plain sky, `finest()` hold the finest picture). `test_sim.py` bots: idle, spam, circle, flee, noflare, flarespam, first, human, good, smart; `MORE=1` prints shots per minute. `test_pace.py`: the smoothness notches. When it goes on the app, its card picture and clip are made on a machine with no chip, where it would ease itself off and use the plain sky: start the `js` in its `preview.json` with `window.__softGL = true; __sim.gl(true); __sim.finest();` (the chip's sky, the finest picture, held).

### 8. Plunder (`games/plunder/`)
- **Two games in one, built from parts:** `part1.html` (page, CSS, saves, helpers) + `/*KIT*/` + `part2.js` (the expedition and the sea: sailing, the lookout's card, the cannon battle, navy captains; no drawing) + `part3.js` (boarding: his blows, your blade, the pistol, the tide, the haul; no drawing) + `part4.js` (drawing the sea) + `part5.js` (the three places you fight in, each painted once) + `part6.js` (the men, your blade and pistol, the bar) + `part7.js` (sounds, the shanty) + `part8.js` (screens, thumbs, keeping it smooth, the loop, `__sim`). `python3 build.py`, never edit index.html. Spec: `specs/08-plunder.md`.
- **An expedition is this game's level:** sail (from above, your ship always points up) → "Sail ho!" card with the honest loot and danger of each ship → RAID or SAIL ON (twice at most) → the cannon battle if there are navy ships → come alongside the prize (the richest merchant, else the biggest navy ship, which strikes instead of sinking) → board: on deck, below deck, the captain's cabin → the loot counted out. Expedition 1 is always a lone trader (no cannons: it teaches the sword), 2 a lone navy cutter (teaches the guns), every tenth a treasure galleon under one escort.
- **The cannon battle is a turning fight, and that took four tries.** (1) Guns straight out of the sides at the same speed for both: the ships chase each other's tails round a circle for ever. (2) Broadsides lobbed at a red patch on the water where you were heading: mindless weaving dodged everything, at every level. (3) Navy ships that take station on your beam: sailing straight and tapping FIRE out-traded them for twenty expeditions. (4) What stayed: **her guns only reach out of her sides (the red fan, which fills before she fires); she comes at you under full sail, then shortens sail and swings her side to you; she is heavy to turn, and your sloop is not.** So the safe places are close on her bow and her stern, where your broadside also rakes her (nearly double), and "get round her faster than she can turn" is the whole battle: the naval twin of Bandit's "a lock only takes from behind". Your own guns aim themselves at a ship inside your gold arc: the skill is where you put the ship.
- **Navy ships come in one at a time** (two from expedition 40); the rest stand off and wait their turn. Three ships firing at once could not be survived by anything. More ships in a squadron means smaller ships.
- **No battle goes on for ever:** twelve seconds without one of your broadsides telling (half its balls landing) and she crowds on sail, takes station on your quarter whatever her captain's skill, and her gunners find the range (tighter, quicker, harder with every second). A minute of it and her guns bear wherever you are (the red fans open right round): a sloop spinning in tight circles with seven planks left could not be finished off before that. Each telling broadside buys 24 seconds.
- **Boarding (0.2.0): never strike a man on guard.** He was right that spamming won, and the first fix (a man on guard turns your blow and counters) was not enough: the counter came a fixed time after your own blow, so "swipe, swipe, swipe" down the middle blocked it and cut him, three times a second. The rules now:
  - **A man on guard turns your blow aside and cuts you for it**, at once, and there is no stopping it (`pAttack`, `riposte`). It costs about one of his blows the first time and half as much again each time after (`TURN_UP`, up to five times over); only time wipes that out (one step every eight seconds). Four in a row loses the fight. A moment's grace as he comes back on guard from an opening (`m.soft`), so one eager blow too many is only turned.
  - **Your blows land only on a man you have opened:** for a moment after your block (one blow, at one and a half), or while he is off balance after a late block (the last 38% of `parryWin`: the line turns bright) or after you dodged his red blow (the riposte: stabs at 2.4, slices at 1.6, as many as you can fit in).
  - **A block is one stroke, across his blade, out on the side it comes from** (`judgeBlock`): it must cross the drawn line and its middle must lie out towards where the cut starts. Through the middle of him, on the wrong side, or clean across the screen, it is no block. The first two expeditions have two plain sides (`SIDES2`), so no one stroke blocks both. **One try for each blow**, and a stroke thrown in his first instant is a guess (`GUESS`). The clash happens the moment your stroke meets his blade (no waiting for his blow to arrive; no "too early").
  - **A dodge saves you; it does not open him** (a red blow apart, which cannot be blocked: dodging that throws him off balance). After a missed block it is your second chance.
  - **When he comes at you is his secret:** a random wait after every hit, block or stagger (it was a fixed fifth of a second after being hit, and a blind rhythm rode it).
  - **One bar is the whole fight:** every wound you give pushes the tide their way, dropping a man pushes it a lot, every wound you take pushes it yours, standing idle lets it slide. Full = that part of the ship is yours; empty = your crew breaks. The crews fighting behind him are drawn from the same number.
- **0.2.1: he can attack first, and it was far too hard** (his words, 16 Nov 2026: "now it's way too hard... you can't say I cannot initiate... hit his sword, hit him, hit him. Obviously I can't do that too much"; losing every time at expedition 7, at sea and on deck). Lesson: **the robots read his blade instantly and on the right side every time; a thumb on a phone does not.** A "sloppy" robot winning was not proof that a person would. The fix:
  - **Attack first:** a blow at a man on guard hits his sword and knocks his footing (`KNOCK`, it comes back with time); two or three in a row break his guard and he reels, open, for a moment (`BREAK`: hit him, hit him, at 1.1). Each break is harder to win than the last (`brk`, fading). Four in ten knocks he answers straight off the parry with a quick blow (`COUNTER`): watch for it and block it. His own attack clock keeps running while he parries, so hammering never holds him off.
  - **Just after a broken guard he is set** (`SET`, 1.3 s): a blow then is turned and he cuts you for it, harder each time (the old rule, now only for this moment).
  - **Gentler:** the side a block must be on is wider (50 degrees early, 40 later), so is the distance from his blade; no "too soon"; his blows softer early. But **a block that misses his blade leaves you wide open** (his blow lands at 2.1), which is what keeps a blind coin-flip blocker losing: with a missed block costing about what a good one gains, guessing loses and a player who reads the side six times in ten still comes out ahead.
  - **Sea:** let go for a fifth of a second (was a quarter), and the first navy ships are less sturdy again.
  - **0.2.2: "I shoot and nothing happens to the ship."** With a ship in the gold arc and the wheel even slightly over (a thumb resting on it), FIRE threw a wild broadside that missed every time. Measured: 0 hits in 30 with the wheel at 0.3, 30 in 30 with it let go. Now FIRE pressed before the wheel is let go holds the guns ("LET GO OF THE WHEEL") and they fire the moment she is steady. Lesson: a punishment the player cannot see reads as a bug; make the game refuse and say why.
  - **0.3.0: "Why do I have to let go of the wheel to fire? I'm the captain."** His rule: the captain steers and gives the order; no letting go. Now FIRE lights whenever a ship is in the gold arc, wheel or no wheel. A quick hard turn spoils the aim a little; going round and round with the wheel hard over for seconds (`G.hardAvg`) spoils it badly (that captain won every battle once firing from the wheel was allowed). Blind wigglers with FIRE on a beat won a quarter of the first navy fights until the first navy ships were made sturdier again (`eHull` +1.6e) and a wasted broadside cost more (4 reloads, then 6, 8...). Pressing FIRE whenever a ship is in the arc while wiggling still wins the first navy fights: that is the skill he described, and it fades by expedition 6. **ROW** (his ask: "a little push, like people row and then get tired"): hold the button above FIRE for about a third more speed; the crew are spent in three seconds and need about nine to get their breath back (`OAR_*`).
  - **0.4.0: lessons.** His rule (16 Nov 2026): "in the first three levels you have to teach people all of this, and you don't let them move past till you're sure they understand... until they're able to counter all of these at least twice or three times. Make it easy." He had asked "what am I supposed to do when they stab?": the rules were never taught, only listed. Now the first man of the first three boardings gives lessons (`DRILLS` in part3): expedition 1 = block a swing from the left (x2), from the right (x2), block a stab through its ring (x3), dodge the red blow (x2), block then strike (x3); 2 = attack first and break his guard (x2), the late block (x2), dodge his pistol (x2), your pistol (x2); 3 = eight of anything, blocked or dodged. One kind of blow at a time, slow (wind-up x1.5, the late block x2.2), a pause between; a miss says TRY AGAIN and shows how, and costs nothing (the tide is frozen, nobody can lose); each hit counts once per opening. The panel under the tide bar says LESSON n OF m, what to do, and a dot for each one done. Passed lessons are saved (`pl.taught`), so a retry goes straight to the fight. The robots run without lessons unless `teach: true`; `test_lessons.py` proves an ordinary and a clumsy robot both get through (about a minute and a half, two and a half at worst on the first) and that a real swipe passes the first lesson. **Lesson for every game: teach each move in play, one at a time, and check it was learned; a rules card is not teaching.**
  - Blind search after it: about one fight in ten thousand won by rhythm, the best single rhythm (wait, block-and-cut stroke, again) about one in twenty on the first expedition and nothing after; at sea about one battle in ten thousand.
- **The pistol is deliberately bad,** as he asked: hold to raise it, the sights swing wide and settle in about a second, let go to fire; while it is up you cannot block, and a blow spoils the shot. One ball; hold the button four seconds to reload (let go and it starts again); three balls an expedition. Head or heart drops an ordinary man (30% on a captain). **And the sights never come up on him** (0.2.0): they start a thumb's width off, on any side, and you drag them on (they turn gold on his head or heart). They used to come up on his chest: hold, let go, a man dropped, three times over, without looking, and that took the first part of every ship.
- **The sea (0.2.0): the guns need the wheel let go.** The same hole as on deck, found the same way: a wheel left on a slow circle or a steady wiggle, with FIRE tapped on a beat (or whenever it lit), won the first navy fights, because her station on your quarter cannot be kept against a ship that never stops turning. The rules now:
  - **FIRE lights only when a ship is in your gold arc and the wheel has been amidships for a quarter of a second** (`STEADY`, `EVEN`): lift the thumb, wait a breath, fire. A broadside fired while she is still turning goes wild (into the sea on one side, over her masts on the other).
  - **A wild or wasted broadside puts both batteries out of action** for three reloads, then five, seven, nine (`G.waste`, fading one step every fifteen seconds), and brings her gunners on (her "range" clock jumps).
  - **Sail straight, or hold the wheel where it is, and she takes station on your quarter**, swinging wide round your guns to get there: 29 degrees abaft your beam, inside her arc (35) and outside yours (22). Turn on her.
  - The first navy ships stand more than two broadsides (`eHull` is higher early), and raking counts for little at first: two lucky raking broadsides used to beat the first cutter. Your broadside is a quarter heavier than it was, to make up for the time letting go costs.
  - Tried and dropped: making her shy away after every telling broadside, or keep to the quarter for good (beginners could not find her again); a gold arc that narrows as the wheel goes over (a steady wiggle still found her); a station she drops back to on a parallel course (she never closed with a ship that circled, and battles went on for ever).
- **What the searches found, in order** (`bots.js`, `test_play.py`): (1) mashing won expeditions 1 to 3; (2) with a man on guard turning blows and countering, a slow swipe down the middle won; (3) with turned blows costing you, "block stroke, tap" on a beat won one fight in five, because a stroke at the air kept the arm busy and hid the taps; (4) alternating a left and a right block stroke covered both sides; (5) dodge-and-cut on a beat; (6) the fixed beat after a hit; (7) the pistol fired without aiming; at sea (8) two lucky raking broadsides, (9) the slow circle, (10) she sailed end-on across your guns to reach her station, (11) a sloop that could not be finished off. A test with real finger touches (`test_touch.py`) found that the wheel let go of the thumb every time the sea moved on from one part to the next, and that the "he cuts you" pose crashed the picture. **A positional game needs a robot that looks ahead** (`planBot`: tries each way of putting the wheel for a while and then letting go, a second or two on, and counts time spent in loaded fans): simple chase-and-turn robots lost everything and made a fair battle look impossible.
- **The numbers it was left at** (robots; to revisit after he plays). No blind player wins: 0 of 308,000 fights by rhythm, 0 by random moves, 0 pistol-first; at sea about one battle in ten thousand over every plan tried, and the closest single plan under one in a hundred. Boarding, players who look: a careful robot (0.3 s, 9 blocks in 10, blocking late) wins everything to 30 and nothing at 60; an ordinary one (blocks at any moment) wins to 10 and most of 30; a sloppy one (0.45 s, 7 in 10) wins nearly all of 1 to 3 and nothing at 30; a sharp one (0.22 s) still wins at 100; the same sloppy player with one bad habit (a jab at a man on guard every three seconds) loses. At sea: a beginner (steer at her, turn a side to her, let go, fire when it lights) wins 2 to 4 and most of 6, half of 10, nothing at 20; a captain who looks a second ahead wins nearly everything to 6, most of 10, a third of 20, a fifth beyond (the middle expeditions are steeper than they were: ease `eSide`, `eAim` or `eSkill` if they feel unfair). A set routine for the wheel ("hard over, let go, hard the other way, let go") with FIRE pressed only when it lights wins the first two navy fights more often than not and fades after: that is watching one thing, and was left. A first expedition takes under a minute.
- **The look.** The sea is one small tile that wraps (red = slow swell, green = long thin wind ripples, blue = sparkle), painted by the graphics chip on its own canvas (`#bg`) at the page's size, with the plain way as fallback: the same tile as two sheets of pattern, **painted small on a canvas of their own and stretched up** (two full-screen turned patterns cost 65 ms of an 88 ms frame on the test machine; small and stretched, 43 all told). Ships are painted once each as sprites (hull, planking, guns, sails, flag, and a flat dark twin for the shadow), with a second sprite, sails furled and a white flag, for a ship that has struck. The view zooms with the distance to the ship you are fighting, so close work fills the screen.
- **The three places you fight in** (`scenePaint`) are painted once each into one canvas, in feet-on-the-floor terms (across, up, how far away; the eye line is the horizon), then swayed every frame as the ship rolls: one picture laid down, a little turned. On a phone that has eased off, the roll becomes a slide (a turned full-screen picture is the dear part without a chip). The man in front of you is drawn from parts every frame (legs, coat, head, hat, two arms bent at the elbow to wherever his hands need to be, blade); his looks are mixed from long lists (rule 9): ten skins, ten hairs, seven hats, beards, scars, patches, earrings, four kinds of coat. His blow shows its path: white while it is coming, gold when a block will count, bright for a clean one.
- **The first game with music** (he asked for it). One tune of our own in 6/8 (`TUNE`: sixteen bars, as semitones above D), played three ways from the same notes: calm (slow, squeezebox and plucked strings) while cruising, fast with a drum once a sail is sighted, faster again in the boarding fight. It is laid down a third of a second ahead from the frame loop, so it freezes with the game; it goes through the ambience bus (ducked under every big moment), stops with the sound switch, and changes mood on the half bar. Do not copy a real shanty into it. **Measure the music as well as the effects:** as first written it came out as loud as the loudest effects (`__sim.musicCheck('battle')` renders ten seconds of it offline: peak 0.51 against a middle effect at 0.22); it is now a third of that (`MVOL`), and the bass sits an octave higher than it was written, because a phone's speaker has nothing below about 120 Hz.
- **Lesson: never vibrate on failure (PLAYBOOK P11) is easy to forget in a game with two halves.** The first build buzzed on every wound and every ball in the hull. Buzzes are for a block, a riposte, a man down, a broadside of your own.
- **Lesson: a loss must be over quickly** (P23): the sinking and "your crew breaks" were each over two seconds before the card came up; now under one, a tap skips it, and after a loss a tap anywhere tries again.
- Test hook `window.__sim`: `start(N, {seed})`, `step(dt)`, `go(N, mini)`, `playing()`, `choose('raid'|'pass')`, `board()`, `stage(i)`, `cabin()` (jump ahead), `stroke`, `poke`, `dodge`, `aim`, `aimMove`, `fire`, `reload`, `geo()`, `judge(A, ...)` and `makeAtk(kind)` (is this stroke a block of that blow?), `smooth()`, `finest()`, `gl(false)` (the plain sea), `DBG` (leave parts of the picture out, to time them), `soundCheck()`, `musicCheck(mood)`. Tests: `test_play.py` (robots and the blind searches: `__B.blindBeats`, `blindRandom`, `blindGun`, `blindSeas` in `bots.js`; about twelve minutes), `test_touch.py` (real touches, with the picture drawn). `window.__auto = (G, dt) => …` lets a robot play the real game (pictures, timings). **None of it has been tried on his phone:** the grey line on the pause menu says which picture notch, how many a second and which sea.

### 9. Reel (`games/reel/`) and the 3D world (`tools/world3d.js`)
- **Every game is 3D from game 9 on** (his rule, 17 Nov 2026), **as real-looking as possible** (his words, 17 Nov 2026: "Make the graphics as realistic as possible for each"; this replaces the old "not hyper-real" taste note). three.js 0.187 is inlined (`tools/three.min.js`, built with esbuild from npm, with Sky, Water, mergeGeometries, ImprovedNoise added to `window.THREE`); `kit/build.py` puts it in when `part1.html` has `<script>/*THREE*/</script>` and `/*WORLD3D*/`. About 870 KB a game.
- **`tools/world3d.js` (W3)** is shared by every 3D game: renderer (ACES tone mapping, soft shadows that follow `W3.setFocus`), a real sky with moving clouds (three's Sky, plus a "gloom" uniform patched into its shader to grey it for rain and storms), the light it casts (sun, sky light, reflections from the sky through PMREM), mist, rain streaks moved by the chip, lightning (`W3.S.onBolt` for thunder), stars and a moon at night, and the weathers in `W3.PRESETS` (dawn, morning, noon, golden, sunset, dusk, night, overcast, rain, storm, mist). Helpers: `water` (three's Water: real reflections; keep `distort` low, ~0.35, for a calm lake seen close or the reflection turns to soup), `terrain` (a grid lifted and coloured by functions), `pines` (instanced), `normalTex`, `grainTex`, `screen`. Quality notches `W3.Q` (sharpness, shadow map, reflection size) are the kit's smoothness steps.
- **Land seen in a mirror:** the water's reflection looks at the land from below, where shallow slopes face away and are not drawn, so anything hidden under them shows. Keep a second (far) terrain a few metres *under* the near one wherever they overlap. Heights must level off (a quadratic hill becomes a wall at 300 m).
- **Test machines:** the processor paints a 3D frame in about a second, so on a test machine (`navigator.webdriver`) W3 draws no 3D at all, like Bandit's plain way; `window.__softGL` (set by `tools/test_controls.py`) paints one now and then so the path is tried, and `window.__fullGL` every frame (screenshots: `python3 tools/shots3d.py`). So `tools/speed.py` cannot time a 3D picture: say so, and ask him for the pause menu's grey line if a game stutters.
- **A fish from a sphere:** a sphere's points already carry its roundness; divide it out (`xs / hypot(xs, zs)`) before applying the body's profile, or every fish is a lemon. `clone()` copies `userData` as JSON: find child parts again by name.
- **Reel:** the float must be read, so it is big (3.2x), the view zooms in while waiting, and nibbles are a bit shallower than the bite. Reeling through a run is always over the line's limit, on every level (otherwise "hold for ever" won the easy levels). Spots stay within 5 m of the middle; the weeds start at 7.6 m both sides (reeds left, lily pads and a dead tree right) and the fish's snag line is the same 7.6 m on every level. `winNow` must do nothing while a fish is being landed (the controls test calls it every 200 ms). Strike is a flick up (under 0.9 s); a cast is a pull down past 18 px.

### 10. Wild Water (`games/wild-water/`)
- **A river is a ribbon:** the course is made in river terms (s downstream, d across, heading h off straight; `makeRiver` in part2: sections of pool, rapid, bend and ledge, smoothed), and drawn by walking a middle line (`riverPath`, `wpos(RV, s, d, y)`) with a water ribbon (MeshStandard with a flowing normal map: its reflections come from the sky through `scene.environment`), a foam ribbon over it (its whiteness worked out per point: rapids, every rock's wake, below ledges, never on a ledge's tongue), and a bank ribbon each side. **Wind the triangles so the water faces up** (a ribbon wound the other way is culled from above, and what you see is whatever is under it). **Keep bends gentle** (radius over 100 m): anything placed further to the inside of a bend than its radius folds back over the river (that was a tree standing over the boat).
- **Spam, by structure:** every row of rocks is tight with one gap, and the gap moves at least half its own width plus a boat from row to row, so no straight line passes two rows; a rock's face is always a smash, two glancing knocks are one; a stroke on the same side again turns you more each time. Every blind string, 0 of 13,056; random flailing about 1 in 600 on level 1's wide river (its test plays 1,800, with the reason written by the target).
- **Steering that a thumb can do:** an angled hull is pushed across by the current (a ferry glide, `u * sin(h) * 0.55`), a light tap is a light stroke (fine corrections), and the robots aim for the heading that gets them to the gap in time (`asin` of the sideways speed needed), not just at the gap. A smash knocks you round the rock (sending you back upstream into it made the game impossible for everyone).
- A lesson's river is 700 m longer and its gaps 2.5 m wider; if the river runs out before a lesson is learnt, you go back to the top.

### 11. Soar (`games/soar/`)
- **The land is a function both halves share** (`landOf(seed)` in part2: an island noise written out in the rules, so the robots skim off the same hills the picture shows). Nine coasts (`(N*37) % 9`); the picture builds a coast once and keeps it while the coast stays the same. The near land (4.4 km) sits round the start, which the trail never leaves by 2 km; a far ring of land sits under it where they overlap.
- **The camera sits over the right shoulder** (2.5 m back, 0.6 m up, 0.5 m to the side), leaning a third of the bank, its field of view widening a little with speed. Further back the flier was a speck.
- **Calm, and still not spammable:** nothing ends the flight early; a held or rhythmic stick never threads a trail that bends and climbs on its own (0 of 77,504). The calm game is meant to be easy: ordinary players win to level 20.

### 12. Vine (`games/vine/`)
- **Make every gap by flying it:** each next vine is placed where the best release from the last one carries the hand (`makeVines`), with its own best release angle, so every gap can be made and no rhythm works; never further to the side than a lean can carry you (an unreachable vine was why the sharp robot lost every far canopy).
- **A catch starts a full swing at once** (the speed set from the swing's energy, not from how you arrived), so the first forward swing after a catch is already the one to let go on. The robots' thumbs lift within a few hundredths of a second of when they mean to; a perfect robot made every canopy look easy.

### 13. Hunter (`games/hunter/`)
- **No luck in a throw.** A random wobble on the spear made every blind throw at an animal's middle a lottery ticket (2% of blind strings won). Now the spear goes exactly where the mark is when you let go; the mark sways with your arm, but never further than the heart is from the middle, so aiming at the middle only wounds; beyond 16 m a throw falls short (the mark turns red). After that, 0 of 77,504.
- **Grass at eye height, not over it:** clumps of crossed blades (a canvas of strokes, alpha-tested), swaying by a few lines patched into the chip's drawing (`onBeforeCompile`), under a metre tall so the animal shows above them at 15 m.
- Animals are built from capsules (`beast(id)`): legs that walk, a neck that lowers to graze, ears that flick on the tell; rotation `PI - face` turns them to face their way.

### 14. Police Chase (`games/police/`)
- **Three games in one** (`G.ph`: drive, crash, foot, cuff), each with its own input (holds while driving, swipes and a tap on foot and in the arrest). A lesson step names its part (`ph`) and puts you there; while a lesson runs, the next part never starts by itself (a tackle in the dodge lesson stranded the robots in an arrest the lesson never asked for).
- **The city repeats under you:** road and pavements jump back every 100 m; lines, buildings (a window texture whose lit windows are an emissive map) and lamps are placed by where you are; four real lights hop along with the lamps.
- **Traffic you cannot see must not hit you:** cars behind you slow down for you (a slow patrol car was being rear-ended); only cars ahead count.
- The blind search is long here (nine letters: 182,976 games, about 15 minutes).

### 15. Pilot (`games/pilot/`)
- **Doing nothing must not land.** The plane starts trimmed on the glide path, so a still thumb flew it onto the runway; the glide comes down at 3.8 m/s and the gear now takes at most 2.3 to 3.3, so every landing needs a flare (a blind pull-push still flares by luck now and then: 7 in 100 on flights 1-3).
- **The column holds what you leave it on** (the trim follows the nose while the thumb is still), pulled back down the screen raises the nose, as a real column does; the lesson says so in capitals.
- **A one-line function with a `//` comment in the middle swallows the rest of the line** (twice in Police Chase): comments go on their own line or at the very end.

### 16. Short Order (`games/cook/`)
- **A wrong plate must cost, or random serving wins:** a plate sent back (wrong, raw or burnt) takes a life like a walkout; with that, blind and random moves win 0.
- **The honest robot must play like a person watching the ring:** it moved once every 0.8 s and missed a golden window narrower than that, so level 40 looked impossible while level 80 was easy (it was the robot's rhythm, not the game). Taps (flip) and the drag to the plate now happen as soon as the ring says so; other drags take most of a second. When a robot curve goes the wrong way (harder level, more wins), trace one game before tuning.
- **Portrait phones see a narrow strip of the counter:** everything the thumb needs (ten trays, bin, plate, board, three pans) must fit inside about ±0.35 m at the counter; check with `__sim.scr` on a 390-wide screen, not only by eye.
- **A LatheGeometry drawn outward has its face pointing down:** the plate was black from above and vanished on the steel; `side: DoubleSide` fixed it. Indoors, turn the sky's light down (`W3.S.exposure *= 0.72; scene.environmentIntensity = 0.45`) or the steel goes white.

### 17. Country Vet (`games/vet/`)
- **A calm game still needs a cost for blind moves:** every wrong tool or poke frightens her more than one slow stroke calms her, and strokes made too close together calm less; with that, blind strings win 0.035%.
- **A robot's thumb picks its speed once per gesture, not every frame:** the honest robot chose a new pull speed each frame, so one frame in seven was "too fast" and every thorn yanked; level 1 looked impossible.
- **Each patient starts with the camera pulled back** (`G.focus = null` in `newPatient`, and when he picks his hand to stroke her), or the close-up of the last animal's sore leg carries over and the next one's parts are off the screen.
- **Project from a fresh camera:** `W3.screen` uses the camera's matrices from the last render; in tests (and on a slow phone) that can be the previous frame's, so `spotScreen` calls `cam.updateMatrixWorld()` first.
- **Frame the whole animal from its parts** (tail to nose, hooves to ears), shifted towards the head; a camera on the body's middle cut the head off at the screen edge.
- **soundCheck calls every sound with (1, 1):** a sound that takes a name (`voice(animal)`) must fall back to a default for a number, or it renders silence and fails.
- **A day must fit the 300-second robot limit** (and P24): five patients of two problems, not seven of three.

### 18. Lighthouse (`games/lighthouse/`)
- **Doing nothing must lose:** with three lives and two boats, two wrecks still "won" the night, so the blind robots won half their games by holding still. The night now needs most of its boats home (lifebuoys = the wrecks it can take, plus one). Check what idle play does before tuning anything else.
- **Everything the player must reach must be inside his reach:** boats drifted to a shore beyond the lamp's arc and could never be lit (a lesson that never ended). Drift targets are clamped inside the arc, and the arc is wide enough for the whole coast.
- **Rocks stay out of the water where boats appear,** or a boat can wreck before the player can find it.
- **A good strategy may be one the robot does not know:** all three robots were equally bad at level 40 until the honest robot learned to fetch the next boat with the first in tow; then skill showed. When sharp is no better than sloppy, the robot is the problem.
- **Transparent things over Water need a renderOrder** (the pool of light, the beam, the surf), or the water draws over them. A cone whose wide end is at the camera washes out the screen: the beam is narrow at the lamp.
- **The view turns with the beam, so a thumb held still keeps aiming** (`holdAim` each frame): holding near the screen's edge pans.

### 19. Hiring (`games/hiring/`) — 2D on purpose
- **A choice game beats blind play by the number of choices and decisions, not by tricks:** with four places for each CV (three jobs and the bin, a quarter each) and one mistake allowed, eight CVs still let blind strings win 0.36%; ten or more brings it to 0.
- **Build every CV from its answer:** make it fit its job (or none), break one need of another job by a hair, then check that exactly one job fits, and try again if not. Then the game never asks an unfair question.
- **Measure text after laying out:** `layout()` sets its own font, so a text wrapped after calling it was measured too small and ran off the panel.

### 20-23. Potter's Wheel, Drone Pilot, Whaling, Wolf Pack (set 3)
- **A day is won by successes, never by attempts:** Potter's Wheel, Whaling and Wolf Pack each first counted pots made / whales met / hunts tried, so a blind FIRE that cracked, a throw that missed, a kick that lost the hunt still "won" a one-try level (blind strings won 60-100%). Count fired pots, caught whales, hunts won. (Lighthouse had the same hole: doing nothing.)
- **`winNow` must do nothing while its own win is under way** (`G.gap > 0`): the controls test calls it every 200 ms, and resetting the count each time stopped the level from ever ending.
- **Behind a chasing camera that looks along +z, the screen's right is the world's -x.** Drone, Whaling and Wolf Pack first turned left when the thumb went right. Mirror the sideways axes in the input (not the rules, so the robots stay right), and test on the screen itself: after a right turn, what was ahead must move left (`drone/test_touch.py`). Games that look along -z (Police, Soar, Pilot) are right as they are.
- **A strike is a flick towards the target, not just a flick:** a blind flick at the right moment caught the elk too often; now its direction must point at her (within 0.75 rad), and a lunge at nothing makes the wolf stumble.
- **The honest robot must try the strategy a good player finds:** in Drone the robot's speed limit set the ceiling; in Potter's Wheel, the finger's reach (a ring blurred over ~3 heights) limits how close a curvy outline can get, so the mark tops out at 89%.
- **`//` comments at the end of a one-line statement swallowed the rest of the line again** (Wolf Pack's input): comments on their own line.

### 24-26. On the Run, Castle Siege, Tag (set 4: deeper games, easy controls)
- **Set 4's carry-over system** (copy it): `UPGRADES` in part2 (id, name, desc, max, cost(level)); `upLv(id)` reads the saved `ups` and is 0 when HEADLESS, so the robots always play the plain game; every finished level pays into `bank` and `earned` (a lost one a little); `RANKS` by `earned`; `renderShop()` fills `#eShop` on the end card (CSS `.shop`, `.up` in part1). On the Run calls it the garage ($), Castle Siege royal upgrades (crowns), Tag the tuck shop (tokens).
- **A runner is spammed by swiping at random unless the road is busy and the chase is tight** (On the Run: random swiping first won 15%, random moves 59%). Traffic two to three times as dense, and on foot the cop almost as fast as you with about ten metres' lead, so three stumbles lose. A lesson that counts bags must ask for them in a row, from three lanes, without a crash, or rotating blind swipes pass it.
- **Tower defence: a blind thumb is a thumb that taps the screen, not one that picks a pad.** Modelling blind play as "build any tower on any pad" gave the blind player the one thing it cannot have (where the pads are), and random towers on random pads held up to 45% of sieges whatever the tuning. `BLIND` now taps: a pad's ring is about 1% of the screen and so is each menu button, and a menu button is as likely to SELL as to upgrade. Blind strings: 0. Model blind moves as what the thumb can do, never as what the game can do.
- **Even so, read the game for slack:** the honest robot hoarded gold waiting for a dear tower, and built on pads that reach no road; teach it to fall back to archers and to skip pads covering under 5 m. Each new tower costs 15% more than the last (a few good towers, upgraded, beat many anywhere).
- **Chasers must intercept, and a dash must be a burst:** in Tag a chaser slower than you never catches a pure pursuit of someone running in a big square (the classic pursuit curve). Chasers now aim where you will be (`intercept()`), cut across when you run in circles (`me.loop`), lose the speed they push into a wall, and a dash sets the speed at once (an eased dash was only half a dash, so no chaser ever closed the last metre).
- **Never `shadowBlur` a big shape in a 2D game:** a blurred shadow under the card cost Heaven or Hell 80 ms a frame on the slowed test (Hiring 36 ms); a drawn shadow (one or two darker shapes offset) costs nothing (Heaven 20 ms, Hiring 22 ms). Draw the still parts of a 2D background into an offscreen canvas and redraw it only when it changes (the sky every 1/60 of the day).
- **A judging game's queue is dealt, not drawn:** Heaven or Hell first drew each soul's answer at random, so one day in thirty was nine Heavens in eleven and swiping UP blind won it. Deal an exact share of each answer and shuffle. A blind lesson must not pass either: in a lesson a wrong judgement waits 3.5 s, and the first lesson asks for five right in a row among all three answers.
- **Contextual taps need a cost for the wrong context** (Harvest Valley): one tap on a bed plants, waters, picks or clears, so a tapping thumb would farm by itself; watering a crop that is not thirsty rots it, and carrots need two drinks. Blind 5 in 13,056.
- **Zombie tag: chasers prefer you** (distance to you counts 0.6), or blind running lasts while they catch the others.

### 29-33. Horde, Mini Golf, Penalty Kings, Critter Clash, Rodeo (set 5)
- **A survivor game plays itself unless it asks for a trip** (Horde): weapons that fire by themselves plus a stick held in any direction won early survivor tests. What fixed it: three beacons to light by standing beside them (the boss only comes when all three are lit), crystals that spill a metre or more away and fade after 18 s (you must go and get your level-ups), and a horde that gathers round anyone who stands still. Blind strings: 0 in 46,528.
- **Breadth-first search: mark each cell once.** Golf's distance map first re-visited cells that got a shorter path and hung the page on big holes; visiting each cell once, in order, is right for a grid with equal steps.
- **A shape that funnels into the cup is a free hole for random putts** (Golf's diamond: its walls slope in toward the cup, so a random putt rolled in a fair share of the time). It was swapped for a cross with the cup in an arm. Look at which holes random play wins on, not only how often.
- **After a lesson, return before the gap** so a sink at the end of a lesson never carries on to the real holes.
- **Penalty Kings (31): a shootout is a coin-flip machine unless blind play is near zero.** Five kicks each has so much luck that a blind thumb scoring 30% won 2% of ties. What fixed it: a red strike always misses (over the bar or scuffed at the keeper), the green sits somewhere new on every kick (a fixed green let a steady beat hit it), only taps on the goal aim (18% of a phone screen, measured with a raycast grid), and a dive before the plant (even while the kicker sets the ball) is seen by the kicker. Blind 0 of 928. The honest robot's accuracy must shrink as the green narrows and the ball speeds up, or the far levels never get harder for it.
- **Behind-the-goal camera:** hide the net (its lines fill the screen) and keep the camera under the crossbar; pan a little with the keeper's dive so he stays on screen. Turn the scene's environment light down by day (0.25) or the stadium looks washed out.
- **Critter Clash (32): a turn-based game's blind player is a random policy, and short battles are lotteries.** Three things decided it: the coach must not pick your opener (a blind player sent in the counter for free; you open with the first in line and sending in the right one is your job); make battles long enough (both sides' health x2.2) that luck evens out; and no free "normal" hit when you do not tap (no tap is weak, too soon glances off). **A timing ring that always takes the same time from the button press is beaten by a steady beat** (a tap every 0.54 s won 45%): start the ring after a random wait.
- **Rodeo (33): a balance game is survived by luck unless the judging asks for skill.** Holding at random often stays on for eight seconds (the rider is well damped), so a buck only counts as ridden if you were already leaning against it in the moment before it lands (dithering left-right does not count), and the judges mark the ride (half time in the green, half bucks met; 65 to count): lucky blind survivors scored under 0.6, people over 0.65. Blind 0 of 13,056. Tuning notes: a strong lean with heavy damping (lean 9, damping 6) feels smooth and the robots stop oscillating; a weak, lightly damped one makes every thumb overshoot. A "keep your balance" lesson is passed by dithering: teach the lean with a push that has an arrow and must be held against for most of its length.

### 34. Eleven (`games/eleven/`): his own idea, played sideways
- **A sideways game inside an app that never turns:** the whole game sits in a `#stage` that is turned a quarter turn when the window is upright (`resize()` in part1: `ROT`, `toStage()` turns touches back). `tools/world3d.js` takes `init({ dims })` so the 3D picture and `W3.screen` use the game's own sideways size (other games are unchanged). Inside the phone app it follows the tilt (`devicemotion`, only when `GameNative` exists, because iPhones report the other sign). `test_touch.py` plays it in an upright and a sideways window.
- **Twenty-two players are five instanced shapes** (torsos, shorts, heads, legs, arms) with a colour each, moved with matrices: a hundred and fifty separate meshes would be a hundred and fifty draws. Nets as a few planes with a grid picture: hundreds of transparent line segments made it slow.
- **Blind football:** team-mates only shadow (you win the ball); a shot from over 30 m is an easy catch; a shot with no aim goes at the keeper; a pass or lob that runs into the goal is the keeper's; the keeper blocks a shot hit straight at him. Before these, holding SHOOT down won 2.6% of matches. A thrown or passed ball must start where the player's foot is (`release()`), or a lob from a player who has not moved yet lands eight metres long.
- **A receiver whose thumb is off runs on to a ball meant for him** (to where a lob will land), or every lob is lost while the thumb finds the stick.
- `tools/speed.py` is noisy while another test runs on the machine: time games with nothing else running.
- **His verdict on the first build (18 Nov 2026): "the way the football players run is just shit... have a button for the players really sprinting... they get tired."** Rebuilt like the big mobile football games: a held SPRINT button, stamina per player (a bar under your man; tired men are slower, breath comes back jogging and faster walking), weight in every move (a burst off the mark then slower to the top speed, a hard stop takes a stride, the faster he runs the wider he turns, a sharp turn makes him plant first), the ball pushed a couple of metres ahead at a sprint (a defender near the ball can nick it), players kept a shoulder apart, and a real run: thigh and shin with knee bend and heel kick, upper arm and forearm pumping, a lean into the run and into turns, a bob twice a stride, stride length growing with speed, a kick swing on every pass and shot, a slide. AI players sprint into space and to press. Close-up check: `__sim.ui.follow = <player index>` puts the camera beside one man.
- With runners sprinting in behind, blind lob-spam won (a lob, then a chip over a keeper who had come out: 16 in 100). A chip now needs to be 12-26 m out with the keeper 6 m off his line, and a shot snatched the moment the ball arrives flies wild (take a touch first).

### Tutorials are optional (his rule, 18 Nov 2026)
- Every game with lessons: a **Skip tutorial ›** button on screen during any lesson (one tap: `taught` = 3, the level starts
  for real, later levels skip their lessons too), and a **🎓 Tutorial** button on the home card and in the pause menu that plays
  the lessons of levels 1-3 in a row (without moving his saved level) and then returns him to his level. In the kit's part5
  (`startTutorial`, `skipTutorial`, `tutForce`); Plunder has its own (skip during the boarding drill). `tools/test_tutorial.py`
  checks all of it with real taps.

### 35. Deep Bite (`games/shark/`): his shark idea, the first game built on PLAYBOOK H (longevity)
- **Hunger is what beats blind play in a grazing game.** A dense sea lets a thumb that does not look eat by accident; what parts
  the two is the rate of eating. Measure it for both robots (eats a second), then set the hunger drain between them: the honest
  robot ate 0.6-0.8 a second, blind 0.13, so each bite gives back 0.12 a value and hunger drains 0.057 a second (less on later
  levels, where the hunters take over the difficulty). Fish dart aside when swum at straight, schools turn as one, the golden fish
  always runs: a straight line misses, steering catches.
- **What the camera shows decides the density.** At first the bay was so big that a phone-sized view held one fish; the sea
  shrank to radius 28 with 70-80 fish, and the floor went 12 m down (darker, fogged) so fish, not coral, catch the eye; fish get a
  little glow in their own colours (`onBeforeCompile` adds the vertex colour to the emissive).
- **Fewer hunters while you are small** (`huntersNow`), a hunter only a little bigger than you is a little slower, and a hunter
  gives up after 4.5 s and rests 6 s: otherwise the robot starved at size 1 just running.
- A lesson that counts to five needs each one soon after the last (5 s), or blind tapping finishes it.
- world3d's `render()` resets the fog colour every frame from `setSky` (pass `fog:`); the fog's near and far are the game's own,
  set every frame from the camera's distance. Hide the sky mesh underwater (the one with `uniforms.sunPosition`).

### 36. Powder (`games/powder/`): snowboard against the clock and your own ghost
- **The ghost is a list of points** (every 2 m: distance, across, time, height), saved for the level whenever a run is the best
  yet (`ghosts`, `bestTime`); the pale rider and the "ghost" dot on the course bar read it by time, the split at a gate by distance.
- **Gates must swing for a straight line to miss them**: with a small swing, a thumb that only tapped won level 1 by tucking
  straight down. The gates swing at least 55% of the half-width, and a miss costs 3 s.
- **A rock you jump needs a window, not a moment:** an ollie clears 0.7 m from 0.19 s to 0.69 s after the tap, so the robot (and
  a person) jumps when the rock is 0.22-0.5 s away.
- **A ribbon of snow built by hand: wind its triangles so the normals point up** (a, b, d / b, e, d); the first build lit the snow
  from below and it went black at dusk. world3d's render() resets the sky light every frame from `W3.S.hemiI`: change that, not
  `W3.hemi.intensity`.
- The spin stops when the thumb lets go (no spin momentum): the landing is a choice you can make, the dial shows when it is safe.

### 37. Cairn (`games/cairn/`): the calm one, stacking stones by a lake
- **A swinging thing dwells at the ends of its swing:** blind drops land at the extremes far more than the middle. At first the
  boulder was wide enough that stacks built at the edge stood, and blind tapping won 30%. The boulder's top is now narrower
  than the sway (0.6 m against 1.2-1.4 m), stones have narrow contact faces, and a stone right on the edge rocks and goes (a
  margin under 6 cm): blind wins went to none.
- **The robot's own timing was the bug, not the game:** it tapped when the target lay within the next 50 ms of sway (0.2 m
  early at speed); checking one frame ahead took a sharp player at level 40 from 10% to 90%.
- **Ties in "the best spot" need a tie-break toward the middle**, or the robot aims at the edge of a wide boulder and waits for a
  sway that never reaches it (stuck at 300 s).
- `pick` and `PENTA` are taken by the juice kit (`note(base, step)` counts pentatonic steps, not semitones).

### 38. Pinball (`games/pinball/`): two thumbs, two flippers, missions
- **Pinball is where blind play is strongest**: fast random flapping keeps a ball alive and makes shots by chance. Three rules
  made the difference, each a real-feeling rule: a mission shot counts only *straight off a flipper* (no bumper or sling on the
  way); a flipper pressed again within 0.3 s gives a weak flip; flapping overheats a flipper for 1.6 s (it glows, it sizzles).
- **Shots you can aim**: a real flip sends the ball at an angle set by where it meets the flipper (near the pivot: up your own
  side; near the tip: across), not by bounce physics, which made shots depend on a single frame. A cradled ball (hold the
  flipper up, let it roll, flip) is the reliable way to aim, for a person and for the robot.
- **Check every target can be reached from a cradle on each flipper** (a sweep of release times): the first orbit lane could
  not be reached at all; its wall now starts higher.
- Traps found by robots: a ball balanced on the flipper's pivot, a ball inside a slingshot, a ball rolling back down the shooter
  lane (now a one-way gate), a ball saver re-given on every serve (blind play lived for ever). "Ball search": a ball still for
  2 s is nudged; held on a flipper for 5 s, the flipper lets go.
- Robot speed: the planning robot is slow (a look ahead per possible moment); `test_play.py` takes about 40 minutes. Run it in
  the background with `python3 -u` so the output shows as it goes.

### 39. Drumline (`games/drumline/`): a rhythm game, the band made on the spot
- **Taps are timed to the moment of the touch**, not the next frame: `tap(G, lane, ahead)` with the time since the last frame;
  the backing band is scheduled 0.15 s ahead from the song's own clock, so music and notes cannot drift apart, and a pause
  stops both.
- A tap with no note near costs the crowd (less than a miss): blind tapping is never safe.
- Robots time too well: the ordinary drummer's spread is 15 ms + 80 ms x react, and difficulty comes from a narrowing window
  and a crowd that forgives less, not only from speed.

### 40. Strike Alley (`games/bowling/`): bowling, pull back and let go
- **Lucky strikes are the blind player's way in.** Random rolls strike about one frame in ten; with short games and a big
  run multiplier a lucky streak beat the target 3% of the time. Ten frames on every scoring level (the longer the game, the
  less luck counts) and the run multiplier at x1.5 per strike or spare in a row (up to x3) took blind wins to none while
  ordinary robots still win levels 1-3 about nine times in ten.
- A ball that leaves the side **after** reaching the pin deck is not a gutter ball: only call GUTTER before the deck.
- The dotted line of the roll uses the same physics as the game (`pathPts` copies `landX`), so the line is the truth (P3).
- A low camera (1 m) with a long lens (fov 40) is what makes the pins big enough on a phone; the pin map at the top right
  shows what is standing for spares.
- Knocked pins that fly off the lane are `gone` to the rules but stay drawn, lying, until the next ball (`ui.swept`).

### 41. Bonsai (`games/bonsai/`): grow, prune, show it
- **The judge is a grid**: the outline and the leaf pads are sampled on a 5 cm grid; match = (inside - 1.2 x outside) / outline.
  Blind tapping scores 0-18%, so the target can sit low enough for a calm game (need 50% at level 1) with no blind wins.
- **Each outline style has its own difficulty** (`STYLES[].d`): an honest robot reaches about 60% on an upright tree but
  about 42% on Clouds, so the target moves with the style, measured with the robots.
- **Nursery stock**: a robot (or a person) cannot reach an outline far above the trunk through empty space without
  leaves outside; every tree starts with bare scaffold branches heading for each part of the outline, which cannot be cut.
- **A bud and a branch can sit on the same spot**: buds stand 8 cm out from the tip, and a tap goes to whichever is
  closer for its size (bud radius 10 cm, branch 5 cm from the line or 80% of its pad). Before this a tap on the leaves
  grew the bud at their centre instead of pruning.
- The kit's frame-time function is called `measure`: the rules' own scorer is `rate(G)` so they do not clash.
- In a lesson a tap on nothing starts the lesson again, so blind tapping cannot pass it by luck.

### 42. Star Miner (`games/miner/`): one stick, the laser does the cutting
- **An automatic laser makes a passive player strong**: what keeps blind play from winning is that ore must be scooped
  (flown over) and carried home into a small ring before the clock runs out. A drifting ship scoops a little, never enough.
- **A lesson must not be passable by drifting**: rocks side by side let blind drift chain three scoops. One small rock at
  a time, six metres off in a new direction, with three scoops needed within five seconds of each other, holds.
- Lay big flat models flat: cylinders rotated about x stand on end toward a top-down camera and read as giant pillars.
- Everything dangerous is shown first: a flashing red line along a meteor's path 1.1 s before it comes; pirate bolts are slow.

### 43. Ghost Lantern (`games/lantern/`): hold them in the light
- **One stick, two jobs by distance**: inside 40% of the stick you turn on the spot; beyond it you walk. The stick draws its
  inner ring and says "turn" or "walk", so the split is seen, not explained.
- **Ghosts that walk into the beam make blind play win.** They now slide round to your side and back when in front of you
  (and keep apart from each other, so a sweep cannot catch three at once), and the house stirs after 25 s so a player who
  hides in one room is found. Walking sways the lantern (a third of the pull): standing to aim is the skill.
- A lit ghost struggling away must not be able to hide in a wall: ghosts stay inside the house, and the beam test stops
  35 cm short of the ghost so one half through an inner wall still shows.
- The robot that plays it walks in to about 3.5 m, then stands and holds; it picks the next room by the number of doorways
  (breadth first), not by straight-line distance, and keeps its choice until that ghost is caught.
- A dark scene still needs its hero readable: the player's coat and face have a little glow of their own.

### 44. Drift Kings (`games/kart/`): drift, boost, items
- **Drifting only matters if the kart has grip.** With free steering the robot won every race without one drift. A grip
  limit (yaw at most 14 / speed without a drift; asking for more scrubs speed) makes a hot corner run wide and slow, and
  a drift the way through it.
- **A drift needs a range, not one radius**: at first a drift always turned like a hairpin and drifting was slower than
  not. Now the thumb sets it: barely held is a wide drift, pushed all the way is a tight one.
- Rivals follow a line with their own offset, slow for bends by a factor that shrinks with the level (they corner
  better later), have a gentle rubber band (plus or minus 5%), and use items with sense (a Zap only with a kart ahead).
- A sound function called with the check's dummy arguments must still make a sound: `sfx.use(1)` played nothing until
  an unknown item fell back to the Turbo's sound. Never use `this` inside `sfx`.
- The steering thumb draws its slider with the "drift" zones (the outer 28%) marked, and the drift's spark bar shows
  when the next colour comes.

### 45. The Bench (`games/judge/`): write your own sentence
- **Free text needs a reader that never fails.** The page asks Claude (the `sample` capability, declared on its artifact)
  to read the sentence into JSON (custody, suspended, hours, fine, compensation, ban, curfew, probation, treatment,
  discharge, life with a minimum, acquit), with a 9-second limit; if that is missing or slow, a local parser reads it.
  Both give the same read-back line in court language, and he confirms it or edits before the gavel falls.
- **One severity scale for every kind of sentence** (custody on a log scale, life above it, suspended, hours, fines and
  discharges below), so any sentence can be marked against any offence's range.
- **Blind sentences won until irrelevant extras cost marks**: a driving ban for a theft, compensation where nothing
  was lost, compensation far above or below the loss. The council's leans (Stern +6, Mercer -6) stay small.
- Number words: "two and a half years" is read before anything else; the splitter must not split "3.5" at the dot.
### 46. Haggle (`games/haggle/`): the dial, the seller, the fake
- **Deal the day, do not draw it**: the day's customers come from fixed shares of cheap and dear items, conditions and
  seller kinds, shuffled; and the target is a share of what the day could make. Random days made the target luck.
- Patience is spent only by offers under what the seller would really take, or the robot walked every seller out.
  Asks are never under the worth and a first offer is always countered, or blind buys of big items won.
### 47. Battle Lines (`games/war/`): formations, then orders
- **Blind play won through the openings** until: openings stop at striking distance; the enemy holds until provoked;
  a unit standing in a fight turns frontal blows (firm, 1/1.8); flank and rear blows count 2.2 and 3.4; pulling out of a
  fight turns your back; each unit takes one order every 2 seconds (the messenger).
- **The lever that finally split looking from not looking: men you send into a fight yourself strike 1.8 times as
  hard for 10 seconds** (`LED`, said in the first lesson). A careful general gives about 30 orders a minute, a blind
  thumb 2 to 7, so the enemy could be made stronger without hurting the player who looks.
- Levels 1-3 never give the enemy a "favourite" unit kind (three spearmen against your swordsmen won blind), and an
  enemy unit never has fewer men than yours, only fewer units.
- A lesson must restart when the unit it needs is gone: the flank lesson waited for ever after the horsemen fled.
- The random-moves test plays 1,440 games here (as in Wild Water): at 480 one lucky level-1 fight decided it.
- Deploy: a slot spread of min(7, 36 / units) and the camera at height 70 on a phone keep every unit and card on screen.
### 48. Grand Hotel (`games/hotel/`): take the job, keep the promise
- **"Take everything as it comes" won blind** (a fast thumb grabs every bubble the moment it appears, and the attendant
  does the walking). What split it: letting a job go costs that guest a third of their patience and the hotel a quarter
  star; failing a job you took costs a whole star (you promised), one you never took 0.6; under three stars you are sent
  home. Blind went from a third of games to none; the robot only promises what its route can reach in time.
- The shift is dealt (fixed shares of kinds, spread through it) and the target is a share of what its jobs could tip.
- Before cleaning is taught (level 3), housekeeping frees a room on check-in, or guests had nowhere to go.
- A lesson the blind thumb can pass by luck fails the test: the first lesson has two guests and the VIP must go first,
  and letting a job go is a miss in every lesson.
- `G.clock` must not be 0 before the shift is planned: the game ended "won" the instant the lesson finished.
- A `//` comment pasted mid-line ate the end of a function and the page died with "G already declared": check each part
  with `node --check part2.js` after an edit.
### 49. Ramp Riders (`games/ramp/`): lean, fly, land
- **Blind forward presses won** while the bike kept its lagging ground angle at the lip (only a little nose-up) and table
  landings needed no turn. The bike now leaves pointing along the lip, so every landing needs a turn of the right size.
- Spin must die quickly when you let go (rate 6 a second), or neither a person nor the robot can stop on the angle: with
  a slow decay the robot oscillated round the target and crashed. Its rule: coast in when the spin will carry it there.
- A landing on a face steeper than 1 radian is a crash (you came up short), or the bike "landed" on the wall of a gap.
- Each level's track is fixed (seeded by the level) so the ghost of your best means something; one bad jump on a fixed
  track shows up as a level the robot can never pass, so look at every level in the quality run.
- `step` must ignore dt = 0 (the first frame, hit-stop): the ground speed divides by dt and the bike vanished as NaN.
- Again a `//` comment pasted mid-line killed the page: use `/* */` for comments inside a line.
### 50. Spellshop (`games/spell/`): the story holds the clues
- Every trouble is data: jar, IN or OUT, rune, the story with **bold** clue words, an optional second jar and other jars that
  also work (with their own result). 57 of them; the day is dealt from those the shelf can cure.
- The side effect a customer comes back with tells you what was wrong (each jar has its own funny effect; wrong stir, wrong
  rune, too strong), so a mistake teaches instead of just failing.
- With fixes allowed everyone won every level; a pass mark on the day's average (a fixed spell counts 60) made later
  levels a real test. The robot's chance of picking the right jar falls as the shelf grows, as a person's would.
- The first lesson must ask for spells that are just right (jar and rune), three in a row: with "good" two in a row, blind
  tapping passed it by luck.
- Words split for bold text must keep punctuation on the word before (". I want" looked wrong).
### 51. Rex (`games/rex/`): read the warning, punish the miss
- **Standing still and biting beat the rival**: its lunge hit, then it stood "tired" beside you. Only a lunge that MISSED
  leaves a rival open, and a hornface that hits you wheels away instead of being stuck. Blind went from 2% to almost none.
- Warnings must lock: the hornface and the rival stop turning to you for the last part of their warning, or no dodge could
  work. The rex needed quicker acceleration (4.2) and a tight turn when slow, or the sidestep came too late.
- A spikeback that always turns its tail to you cannot be bitten: it turns only while you are far, and after a swing it is
  slow to turn, the moment to run round to its head.
- A charge that runs on past you leaves its "stuck" moment 20 m away; it stops once it has passed you by 4 m.
- The robot facing its aim point (not the animal) stood frozen beside a target for two minutes: near the aim, face the target.
- Boss levels (every tenth) have the big rival and one prey only, or a sharp player could not finish before hunger ran out.
### 52. High Wire (`games/rope/`): an upturned pendulum under one thumb
- Balance must be possible while standing still: "thumb down to walk" left no way to steer the pole when you stopped. The
  thumb is a floating stick: sideways is the pole, up walks, the middle stands, down crouches.
- A local variable named like an action (`walk`) hid the function: "walk is not a function" at load.
- The robot reaching for a star counted the reach as a wobble and stood leaning for ever: measure the wobble from the lean
  it wants, and reach only while passing.
- It waited for a sandbag while standing inside its swing: wait before the swing (0.6-1.8 m ahead), commit once inside.
- A "save yourself" lesson built on random pushes was all or nothing (every push a fall, or none a danger): the wind lesson
  teaches stopping instead, which the robot and a person can both do every time.
- Rock pillars sized up to 36 m must stand at least their own size from the wire, or one fills the screen.
### 53. Homemaker (`games/house/`): the checklist is the level
- The plot is edges ('h:x:z', 'v:x:z') and cells; rooms are found by flooding floor between walls, houses by joining rooms
  through inner doors. Every check (closed, doors to the outside, windows, rooms by their furniture) comes from that.
- With no clock a calm builder could never lose and "it gets harder" failed: the crew has a number of jobs before the family
  arrives (every placement is one; undo is free, the mistake already cost a job), fewer spare as the levels go on.
- The plan's rooms must fit the plot: plots are at least two squares per room wide plus a margin, or the robot's first-room
  window landed on the front door.
- The walk-through hides the roof and the door panels (the camera went dark under the roof and into the closed door), with a
  wider lens indoors.
- A house in progress autosaves; a lost level clears it, so a retry is a fresh start.
### 54. Fruit Fight (`games/fruit/`): the arc is the aim
- The pull sets direction only (sideways = yaw, down = higher and further); power is full past a small pull. Pull length as
  power coupled with pitch made aiming muddy.
- A robot that solves the ballistics exactly never misses: its error must be a person's (yaw ±0.35 x (1 - acc), pitch
  ±0.25 x (1 - acc)), and oranges reload in 0.55 s, or nothing could ever reach you and every level was won with full hearts.
- Shields stop shots that come in flat (vy > -7); a lob or a melon's burst gets past. The big one's eye is the top of its head.
### 55. Tri-Peaks (`games/peaks/`): a calm card game
- A rule function named `draw` was replaced by the kit's frame `draw(now)` (the same name, later in the file): the robot
  "drew" and nothing happened. Rule functions must not share names with the kit's (draw, step, hud, lay, measure, pick, note).
- One deck leaves only 23 cards for the stock, whatever the level asks for: the stock is dealt from two decks.
- Tri-peaks is luck-heavy; a long stock on the first levels (about 42) is what lets an ordinary player win them.
### 56. Oarsmen (`games/row/`): rowing in 3D, two thumbs
- Each half of the screen is one oar (`stroke(G, side)`, 0 left, 1 right). Quality comes from the oar's time since its last
  stroke against CYCLE 0.85 s: crab under 0.6 of it, weak early, perfect in the window, late after. Both within 0.14 s =
  synced, builds rhythm (+4.5% speed a step, max 8). One oar alone turns the boat; +x is the screen's LEFT, so the left oar
  turns you right. Rowing one side for a long time breaks rhythm; a single steering stroke does not.
- **A hand-made water ribbon must face up.** The river is a BufferGeometry strip given to `W3.water` (built in x/-z then
  rotated): with the wrong winding it is culled and you see the grey riverbed instead of water. Order each quad
  `(i, i+2, i+1), (i+1, i+2, i+3)`. Look at a real screenshot before trusting a 3D river.
- Camera at 5.2 up, looking 12 ahead, so the water shows colour and not only the sky's glare.
- Balancing: blind tapping both oars steadily wins unless the course bends (bend 0.9 to 1.2) and a crab costs a lot; the
  lessons other than STEER flatten the river so they cannot stall. Bank ×0.6 speed, rock or log ×0.35.

### 57. Safecracker (`games/safe/`): a calm heist by feel
- The dial turns one to one with the thumb: the drag's change of angle round the dial's centre (ignored within a quarter of
  the radius, where the angle jumps) times M/TAU numbers. `turnDial(G, d)` finds whether the combination number was passed
  between the old and new position (unbounded floats, so it works for any turn); felt only under `cfg.feel` numbers a
  second (an eased speed, `G.spd`), which leaves the chalk mark (`G.mark`). SET tries `round(pos)`.
- Keeping still is lifting the thumb, so trying a number had to be a separate button (SET); never put "try" on lift.
- Feel speed scales with sqrt(dial size): on a 100-number dial the plain limit was a crawl (a turn in 18 s).
- Spam is safe by design: a guess is 1 in 40 to 100, and three or four wrong guesses fill the alarm.
- Speed: the room behind is painted once into a spare canvas (it was a full-screen gradient every frame).

### 58. Fire Crew (`games/fire/`): firefighting in 3D, one thumb
- Rules in window units (column, row); the view maps them to the building front (`wx`, `wy`) and back (`gridAt`, a ray to
  the plane z = 0). The water lands 60 px (x k) above the thumb, so the thumb never hides the fire.
- **Never use `G.saved` in a kit game's rules:** the shared frame loop uses it to mean "the result is saved". Counting
  rescued people in it stopped a win being saved (the controls test caught it). Same family as draw/step/hud/lay/pick.
- Spam: on a 3 by 3 building random spraying covered enough to win; at 4 by 4 it cannot. Most people start next to a fire,
  so random ladder taps do not rescue them for free. Small early buildings burn a little faster (grow x (1 + 0.5 easy)).
- Fire capacity: one hose against exponential spread. The building is capped at 5 by 6 and the spread slows far on, or
  level 40 was unwinnable even for the sharp robot.
- Flames are additive sprites from a canvas glow; keep them orange and under 0.65 opacity or the tone mapping turns them
  white.

### 59. Origami (`games/origami/`): fold paper, one thumb
- The fold is real geometry: faces are convex polygons (which side is up, height in the stack); a fold clips every face by
  the crease and reflects the flap on top in reverse order (`foldFaces`). The crease is the line halfway between where the
  thumb went down and where it is, so the corner follows the thumb; drawn live while the thumb is down.
- Models are written as crease + corner (`[A, B, P]`); the landing point is worked out. Design them by rendering every step
  (a node dump of the faces and a PIL picture): corner folds can only tuck inwards, so ears and tails need creases that run
  through the chin or across the body, as in real origami. Start the paper white side up, so folds show the colour.
- Grading compares the player's crease with the right one at the two ends of the right crease across the paper.
- Draw the target outline after (over) the paper, or the shape to make is hidden under it.
- Lessons with a big room for error can be passed by blind luck: in lessons a drag counts only if it starts on the glowing
  corner, and lesson 1 is a whole model.

### 60. Sugar Swap (`games/sweets/`): match-3, one thumb
- The rules run in phases with times (swap, pop, fall, then lines again: a cascade), so the robots and the picture see the
  same thing; the view only chases each sweet's place by its id (gravity for falls, a slide for swaps). A harness that runs
  part2 alone in node (stubs for curve, rng, store) checked thousands of moves for empty cells and stuck boards before any
  drawing: it found cells that nothing could reach under cages (now filled directly).
- **A free "swap back" lets spam win match-3.** A thumb that never looks just retries until something works, then rides
  lucky cascades. Rule 1's "a slip is cheap, a habit is ruinous": the first miss is free, the next costs a move, then two,
  fading by one every twenty quiet seconds, shown by the moves. Keep the miss count a whole number with its own timer: a
  count that decays smoothly reads 0.99 just after a miss and rounds down to free.
- Early levels: no score goals (lucky cascades reach them) and no small central jelly patch; collect goals with targets a
  blind thumb cannot reach, and a wide strip of jelly at the bottom.
- Lessons: in a lesson a second quick miss starts the lesson board again. Rigged lesson boards need every neighbour of the
  rigged swipe pinned, or the swipe makes an extra line (it made a wrapped sweet instead of the striped one promised).
- Stars from moves to spare; the Sugar Rush runs 1.6 times as fast, 4 times when he taps.

### 61. Black Keys (`games/keys/`): piano tiles, two thumbs
- Rules in rows: a row's bottom is `r.i` rows up the song, the screen shows `pos` to `pos + 4`. A touch gives a lane and a
  height in rows; a tap just beside a tile counts (tolerance, bigger on the first levels: fingers are fat). Before START
  a stray tap does nothing, so the instant start is not lost to a slip.
- Songs are melody strings ("E4 E4 F4 G4:"; a colon makes a long tile); all pre-1929. Every tile plays its note; every
  fourth a soft low note underneath.
- The robot player needs to be as human as the game is hard: two thumbs, each needing a moment before the next tap, aim
  that wobbles more the faster it goes, a held long tile tying up a thumb. A too-perfect robot showed no difficulty until a
  cliff at level 30. Song tempo is only half-weighted, or the level number barely mattered against the song.
- A lesson's end must stop the frame: the "song done" check ran on into "encore done" and won the level the moment the
  first lesson finished.
- A blinking failure mark must start solid (both screenshots caught the blink's dark half).
- `sfx.soundCheck` calls every sound with numbers: a sound that takes a list needs a default.

### 62. Paint Drop (`games/paint/`): drop and merge, one thumb
- **Plain drop-and-merge cannot be made spam-proof.** Gravity rolls same colours together by itself; random dropping won
  most early levels, and a wider jar, bigger goals, a paint allowance and smaller spawns all left lucky random runs as quick
  as careful ones. What worked, each measured: WET paint (a blob squashes only for a moment after it is dropped or made, so
  squashes happen where you aim; two dry blobs never squash), the PALETTE (six drops; each drop that leads to no squash
  dries one, a squash refills all: careful players never go past five, random thumbs usually seven to nine), a queue that
  rarely repeats a colour (dropping in one spot stacked matches), 0.85 s between drops, and a jar just tight enough that
  careless clutter spills it.
- Measure separation as distributions, not averages: careful needed 13 drops on average and random 22, but random's
  luckiest runs were as quick as careful's typical ones.
- A fast node harness for the rules (physics included) found most of this; but for the full blind search the browser test
  is quicker than node (patterns that never drop run to the five-minute limit).
- Lessons in a drop game: one drop at a time, judged before the next (blind drops squashing each other passed lesson 1),
  and only for the lessons that judge a drop (the "line" lesson froze after one drop).

### 63. Pour (`games/pour/`): colour sort, one thumb
- Spam-proof from the first build, by design rather than tuning: puzzles are random glasses kept only if a solver (weighted
  best-first with a binary heap) sorts them; the moves are the solver's route times a margin; wrong pours cost more and
  more; lessons restart on a second quick wrong pour or on running past their pours to spare. Blind 0 on the first run.
- The robot plans with what it can see (hidden layers count as unknown colours of their own), re-planning every pour.
- A stalled board must end the game ("no pours left") unless an undo or a spare glass is left (rule 2).
- Pouring animation: turn the glass about its MOUTH, set the mouth just above the target's, let the bottom tip away; the
  stream starts at the mouth. Turned about its middle, the glass swung off the screen.
- A mark on every colour (● ▲ ■ ...) so the game works without telling colours apart.

### 64. Block Party (`games/blocks/`): block puzzle, one thumb
- Random fitting placements clear lines by luck, and a lucky long survival with a streak can reach a modest score (the tail
  is heavy: 1 game in 500 scored 1,100 when the median was 60). Two structural fixes: a second wrong drop within 3 s costs
  points (25, 50, ...; a person who looks barely ever does it), and score goals sit far above what random play reaches.
  Gems only from level 3 (after their lesson), never two on one row or column, so each is an aimed clear of its own.
- The robot must look ahead: a greedy one-placement robot loses with half the board empty. It scores the best few first
  placements by where the rest of the tray would then go, and judges a board by whether each awkward shape (5-long, 3x3,
  big L) still has somewhere to go, not by how many places one shape has.
- Lessons: an empty board must not run the "nothing fits" check (it restarted the lesson for ever); one gem per lesson
  board and three boards in a row, or a single blind hit on a row of three gems passed it.
- Drag: the piece rides 2.1 cells above the finger; the shadow and the lines it would clear (lit in the piece's colour)
  show before the finger lifts, and the drop is where the shadow was. Tray pieces shrink to fit their third of the width.

### 65. Plumber (`games/plumber/`): house calls, one thumb
- A job game is spam-proof by its choices: the fix must match what the look found, and every wrong one costs patience
  (escalating). The hands-on parts add the rest: the plunger's beat changes every push (a steady tap fails), a hold has a
  random rate and a random green, the snake kinks if held on red. Blind earned ~$10 of a $590 day; 77,504 strings won 0.
- The robot is "a person who looks" only if it reads: give it seconds to read a call and what a look says, or it does a
  day's work in a third of the day and the targets come out far too high for people.
- The kit's part1 defines `pick(R, a)`: a game function called `pick` silently replaces it. Check part2's names against
  part1 (a short script does it) before the first build.
- Cut-away house: the static house and its pipes drawn once per job into an offscreen picture (redrawn when a step is
  done), the water dashes, parts, people and trouble drawn live on top.

### 66. Stunt Kart (`games/stunt/`): ramps, tricks, glider (built on Drift Kings)
- Tricks are spam-proof by themselves: each takes 0.38 s and landing during one is a wipeout, so tapping all the time in the
  air chains tricks into the ground. A tap during a trick does nothing (no queue).
- Air time must leave room for the lesson's ask: at first a normal ramp gave 0.84 s, too tight for two tricks; now 1.19 s
  (2 tricks with room, a third only with the springs upgrade); the glider ramp gives about 3 s.
- Ramps are placed by code where the track stays straight for the whole flight (scored by the sharpest bend over it); the
  gold ramp on the straightest long run. Air coins follow the glider's own arc, or nobody can reach them.
- Lessons: a tap on the ground (with no item) in a trick lesson resets the count, so a blind tapper never gets through.
- Rival skill curve: x(0.8, 1.0, 35); at 1.06 the top end was impossible for every robot.
- The 3D test_play takes about 13 minutes (blind races last minutes); run it in the background.

### 67. Knife Spin (`games/knife/`): knives into a spinning target
- A steady tapping beat lays an evenly spaced fan of knives that never collides. Three fixes made it 0 in 1,920: every
  target turns back now and then (the fan folds onto itself), knives already in from the first level, and a throw rushed
  within 0.2 s of the last stick wobbles up to 0.34 rad either way.
- Lesson targets are full of knives except for a few gaps, with obstacle knives at most 0.48 rad apart: at 0.78 apart a
  knife fitted between them and the lesson was passed by luck.
- Too many knives per target makes the last ones impossible (random packing leaves gaps narrower than a knife): keep the
  total at most about 12; the robot aims for the widest gap when no comfortable one is left.
- A full-screen gradient drawn every frame cost 30% of the frame on a slow phone: paint the background once.

### 68. Mow It (`games/mow/`): stripes, beds, the bag
- **A game function can silently replace a kit function**: `bed()` (drawing a flower bed) replaced the kit's sound `bed()`
  and the engine hum crashed. Check every part's names against part1 AND tools/juice-kit.js before the first build.
- Blind driving covered the lawn in time; what stopped it: ramming the fence or a tree at speed stalls the engine and
  costs fuel (a person who looks barely does it), and lessons have fuel too. 0 of 1,440 beats.
- Collisions must always allow moving away (and slide along), or the mower gets trapped against a tree for ever.
- The robot needs a real planner: lanes up and down, a breadth-first path round things, aim just clear of grass hard
  against a bed, give up a spot it cannot reach. Potential fields orbit and trap.
- Stripes count only while cutting, on an axis (a little wobble allowed for 0.3 s), measured over the last moment of
  cutting (cells are cut every other frame at full speed).
- Static layers (garden, hedge, long grass; beds and bin; trees) are painted once and redrawn only when they change:
  33 to 50 frames a second on the slowed test. `ctx` is a `let` in this game's part1 so a layer can borrow it.

### 69. Helix Drop (`games/helix/`): turn, drop, smash
- The whole game sits on one mapping: the piece under the ball is the one at angle `-theta - pl.a`; the 3D view turns each
  piece by `-(pl.a + k*SEG)` and the tower group by `-theta`, so what is drawn under the ball is what the rules say is under
  it. Check it with a gap turned under the ball before anything else.
- The robot kept dying on chained drops: the fall gets fast. A top falling speed, no red under the gaps of the platform
  above, and a robot that only turns while there is time (it reads when the ball will land) made a person who looks win.
- Blind turning won 2 in 2,000 at 16 platforms with little red: each platform is a coin toss for a thumb that does not look,
  so the first towers are 20 platforms (survival multiplies). Then 0 of 1,984, and an ordinary player still wins all early.
- Lessons: red 5 of 12 and one-piece gaps, or blind turning gets through the little tower.

### 70. Sinkhole (`games/sinkhole/`): a hole that swallows the town
- A real hole in 3D: the ground's shader drops every pixel inside each hole (`holes[4]` uniform: x, z, radius, on), and a
  dark open shaft goes down under it; swallowed things move to the middle, tip and fall, and the ground hides whatever is
  outside the circle. No stencil needed.
- Every kind of thing is a list of parts (geometry + colour, tinted or not); each part is one InstancedMesh, so a town of
  500 things is about 60 draws; only moving and falling things have their matrices written each frame.
- Growth must match what the town holds: with too steep a ladder the hole stalls at bus size with nothing left to eat
  (seen at L5); CUM was set from the robot's timeline (size 4 by ~10 s, houses by ~25 s).
- A meter goal alone fails with three rival holes (they eat the town): with rivals, the biggest eater at time-up also wins,
  and rivals stop at size 9 so the boss landmark is yours. A respawned hole is safe for 2.5 s.
- Barrels at size 8+ would be unavoidable: there they are harmless and the late hazard is a fuel tanker that drives.
- The robot needs a stuck rule (no progress in 1.5 s: drop the target, push off) or it pins between a target and a barrel.
- Cars: a crossing is crossed strictly once, or a car turns for ever at the same crossing.

### 71. Crowd Run (`games/crowd/`): gates, the crowd, the giant
- The crowd is real runners (up to 360 drawn and hit one by one; past that each stands for several), each easing to its
  place in a sunflower pattern; a big crowd packs tighter (radius about 1.1 + 0.05 * sqrt(n)), or it cannot dodge anything.
- On a bridge the crowd squeezes onto the planks (from 5 m before it); only a crowd that is off-line loses runners. Without
  the squeeze every big crowd fell in, whatever the player did.
- The giant's number comes from the best possible run (better gate every time) times a share (65% rising to 95%); the
  discounts for obstacles in that estimate must be small, or the share means nothing.
- Spam: a blind thumb must meet walls early (pieces 3 and 7 are always walls) and walls right behind the better gate
  (traps), placed 10 m after it so a person who looks has 1.3 s to slide away. Random moves then won 0 of 480.
- Lesson 1 needs every one of twelve gates right (one blind run in 4,096): with five gates blind tapping left the lesson.
- Gate panels face the camera only after `rotation.y = PI` (a plane faces +z; we look along +z): the numbers were mirrored.
- The game's x is drawn flipped (`X(x) = -x`), so the thumb's right is the picture's right.

### 72. Word Wheel (`games/words/`): a calm word game
- Words: the SCOWL lists (npm `wordlist-english`, free with its notice, kept in `part1w.js`): sizes 10+20 are the everyday
  words a crossword asks for; size 35 is also accepted as a bonus word (and asked for from level 25). Rude words removed.
  Stored as one string per word length with no separators (100 KB for 17,500 words).
- The crossword: greedy placement (each word across one already there, never touching side by side), 40 tries in different
  orders, keep the one with most words then the smallest box. One try alone placed half the words.
- Spam: random letters are mostly not words, and a made-up word spills ink; out of ink the page is lost. Free hints in a
  lesson must be limited (two), or blind taps on the bulb fill the lesson page.
- A calm game still has to get harder for the robots: rarer words later and less ink (5, 4, 3) did it; the robot, when
  stuck with no coins, guesses (and spills) like a person does.
- `hint` is a rules function here: the view's tip box is `hint0` (part5's reset line set `hint = null` and broke it).
- A first gift of 100 coins, or a new player cannot use a hint.

### 73. Sharpshooter (`games/sniper/`): the crowd, the card, the scope
- Sleep darts, not bullets: the thief lies down and snores. Same thrill, no blood.
- Two thumbs for real: the FIRE pad is held (scope up, breath held, the sight steadies for 3 s then shakes) and released to
  fire, while the other thumb keeps aiming. test_touch drives two pointers at once with the page's own PointerEvents.
- The scope is the same 3D camera turned to the sight with a narrow field of view; the 2D layer paints the black ring.
- A dart flies (55 m/s, a little drop, wind drift) and is checked against each person's column every frame of its flight,
  so leading a walker and crossing people both work as they look.
- Spam: the sight starts on the rooftops (not on the crowd) and any miss scatters the crowd with 6 s left; blind darts land
  on the ground. A robot that looks must also wait for a clear shot, or it darts passers-by walking in front.
- The camera close enough that people are big (it stood 16 m back at first: half the screen was empty ground).

### 74. Beat Dash (`games/dash/`): one tap, to the beat
- The course is built from pieces spaced in beats, and the music is played from the cube's place (beats = x / beat
  length), so the music always matches the course, also after a crash puts the cube back at a flag.
- Physics in 1/120 s substeps (the robot's look-ahead uses the same ticks). Hitboxes forgive: the cube is 0.6 wide against
  spikes 0.26 wide, or a triple spike leaves an 18 ms window (now about 50 ms).
- The robot is a planner: if doing nothing crashes within 44 frames, it tries a tap at each of the next frames (one by one,
  not every other: a triple spike's window is three frames), each checked far enough ahead to pass what caused the crash,
  preferring a tap that needs no second one soon; then it taps a little early or late. A fall counts at once (y < -0.4),
  or a too-short look-ahead thinks jumping into a pit is fine.
- With nothing that works yet, the robot waits if the crash is more than 22 frames away (it used to jump and hope).
- A pad's wall and landing depend on the speed: built from the cube's speed, or at high levels the cube landed on spikes.
- Five lives on levels 1-5 (then 4, then 3) made level 1 fair for an ordinary player; blind tapping still gets about 10%.

### 75. Shadow Crew (`games/crew/`): the hidden traitor, 3D station, drawn crew
- His big one (20 Nov 2026): "the equivalent of 5 games", stunning. Own W3 scene (not setSky): merged wall boxes with an
  inverted-hull ink edge, toon ramp, a painted floor per room; every character is a canvas-painted sticker (4 frames in an
  atlas) on a billboard card with a blob shadow. The fog is a 150-ray sight polygon drawn on the 2D layer.
- The station is a grid (SW 54 x SD 30); `path()` is BFS and must return null when start or goal is not an open cell (it
  looped for ever and ran out of memory).
- Fairness of a social game comes from testimony with caps per kind (near the body, with the victim, guesses): uncapped,
  stacked weak lines voted out a careful player. "With the victim" only counts from someone who saw it from over 3 m.
- What finally stopped blind play (it won 9 in 100 with knock-at-random then vote-at-random): the finder sees you standing
  over the body; a knock-out is heard within 4 m (they come to look, "?!"); "has anyone seen YOU do a job?" grows each
  meeting; blaming someone nobody suspects counts against you and barely moves the vote; doubt is remembered (they keep
  away); after 40 s + 12 s per crewmate the crew hurry their jobs (a tip says so); 5 crew from level 1. Each of these is
  something a real player can read and answer (pretend at jobs, walk away, blame the one already doubted, strike sooner).
- The robot must do what a person is told: walk well clear of the body (5 m, a path, not just "flee"), be seen pretending
  at a job once, vote skip when nobody is suspected. When it did not, the rules looked too hard when they were fine.
- Meeting lines need a real speaker (`from` is drawn as a face): never -1.

### 76. Kart Kingdom (`games/kingdom/`): the big kart racer (built on Stunt Kart and Drift Kings)
- **Version 2 after his verdict ("mid"; 20 Nov 2026).** Researched first (KartRider Rush+, Mario Kart Tour, Beach Buggy
  Racing 2): buttons instead of a slide. ◀ ▶ (a thumb can slide between them; the steering eases in over about 0.15 s), DRIFT
  (hold with an arrow: hop and slide; into the turn tightens, away widens; in the air a trick), ITEM (tap ahead, swipe down
  behind; a banana is lobbed about 40 m down the road and a ring shows where it lands; its thrower is safe from it for 3 s),
  NITRO (two bars from drifts, tricks, slipstreams, rings). A kart with nitro and drift boosts won every race: rival skill
  now rises to 1.07 (from 0.99), and rivals fill and fire nitro too. Blind thumbs are 3 moves (s random arrows, d DRIFT
  down/up, t ITEM ahead/behind or NITRO) so the kit's blind test stays near 90 strings: 0 of 5,696 won; random 0 of 480.
- In the trick lesson a plain hop on the ground (DRIFT without an arrow) resets the count; a drift does not (the robot, like
  a person, drifts through the bends).
- Music v2: drums on a sixteenth grid (kick, snare, hats, claps, crash and rolls at sections), octave-pumping bass, stabs,
  arpeggio, and a hook built as motif / answer / variation / motif over 8 bars; verse and chorus alternate.
- **THE real cause of the black screens (his screenshots, 20 Nov 2026): the sky drew, the land, road and karts were black.**
  world3d.js built the all-round light (scene.environment, through PMREM) from the sky shader; on his Samsung's chip that
  shader gives NaN below the horizon, and NaN in that light blacks out every lit surface. Reproduced here by forcing NaN in
  the sky shader; fixed by building the all-round light from a plain gradient sphere (sky colour, horizon, ground). All 48
  3D games rebuilt with it. Never feed a fancy shader's output into lighting; test a change like this with the NaN forced.
- **Black on his phone, fine here (20 Nov 2026: "everything is black... the music is going").** Same report for Tri-Peaks and
  Stunt Kart. The picture can be left at no size when an app opens the page before it knows its size and never sends a
  resize: buttons and music, a black screen. The frame loop now checks the size twice a second and fixes it (kingdom, stunt,
  peaks); world3d.js also keeps the right to get the 3D picture back if the phone takes it away. And brighter for real eyes:
  no black night skies on race courses (dusk, sunset, golden instead), exposure and sky light lifted, a soft ambient light;
  every course measured at a mean brightness of at least about 50 of 255, most 75-160.
- **Courses that cannot cross themselves**: each is a polar shape (radius from a few harmonics, always above zero), so it
  never crosses; then the whole course is scaled up until its tightest bend has a 14 m radius and any two stretches of road
  are at least 32 m apart (walls and all). Hills come from a few sines; the ground round the glider jump is levelled first.
- **Hills you take off from**: the ground under a kart is the road's height (plus a ramp); a kart leaves the ground when the
  road falls away faster than gravity can follow, so crests are jumps and tricks work off any of them. The landing must be
  judged from the real ground ahead (`landPred`): the flat-ground sum caused wipeouts on hills, for the robots and the HUD.
- **Rivals must trick on hops too**, or a player who tricks off every crest out-boosts the field by far (it won every race).
- **The race ends once the places you needed are taken** (no lonely lap at the back). It is kinder, and it made blind races
  short: the kit's 13,056 blind races took 44 minutes even so. Speed-ups that mattered: `locate` searching 12 steps either
  side (with a full search if the best is at the edge), squared distances, the place order sorted ten times a second.
- **test_play's far levels (10, 20, 40, 80) are all boss levels**: a boss race that needs first place made the sharp robot
  lose at 40. A boss race is faster rivals; the place asked for stays (top 4, 3, then 2).
- Shell lesson: a slow kart that falls behind you comes round again ahead, so there is always one to aim at; the robot lines
  up behind a kart before it fires (a shell flies straight). Seven misses in a row start the count again.
- The same course at another time of day when the cups come round (golden, rain, mist, dusk); mirror cup flips x.
- Measured: blind strings 0 of 13,056; random 0 of 480; ordinary 1.0 on levels 1-5, 0.6 at 20 and 40; sharp 0.3 at 80;
  17 ms a frame on the slowed-down chip.

### Engagement pass (Nov 2026, games 2-4)
Applied PLAYBOOK factors chosen per game (listed in each game's `principles` in games.json). How it was done, so new games can copy it:
- **Juice kit:** `tools/juice-kit.js` is pasted into each game (sound bus + compressor, `vary`, `gate`, `env`, `tone`, `noise` with cached buffers, `pluck`, `note` pentatonic, `bed()` looping ambience, `duck()`, `HAP` haptic vocabulary, `setMute`). Each game then defines its own `sfx` recipes on top. Mute is saved per game (`<prefix>mute`) with a 🔊 button at the bottom right of the home screen.
- **Hit-stop and slow-mo live in `frame()`, not `update()`:** `G.stop` freezes game time, `G.slow` scales it. The fast-forward bots call `update()` directly, so feel changes never change test results.
- **Camera kick:** `G.kx/G.ky` pushed in the direction of the blow and damped each frame (`Math.pow(0.0008, dt)`), on top of the small random shake.
- **Permanence:** hits are stored in body coordinates (`(hitX - centre) / scale`) so bruises, dents and bullet holes stay put while the figure moves.
- **Honest near-miss:** on a loss, show his real remaining health (bar + %) or the real draw times. Never invent a margin.
- **Personal bests:** Knockout fastest KO per level (`ko.bests`), High Noon fastest winning shot (`hn.bestDraw`), Steel & Honour longest parry chain (`sw.bestChain`). "NEW BEST" only when an earlier best was beaten.
- **Disclosed help (P2):** after 3 straight losses at a level (`<prefix>streaks`), the opponent is a touch slower, a pill says "HELP ON"/"ASSIST", and it resets on a win. **Lesson: help must only add reaction time (longer wind-up/draw), never loosen the rules.** Widening the sword parry window let the centre-swipe cheat bot win 3/6 at level 8; slower wind-ups alone kept every cheat at 0. Always rerun the cheat bots with help on (`test_sim.py ... assist`).
- **Rare surprises:** cosmetic only, never in the way of aiming (cat on the ring apron 1/30, tumbleweed behind the outlaw 1/12, crow over the castle 1/15).
- **No vibration on losing;** a short thud when hit is fine (it's information).
- **Sound check:** each game's `__sim.soundCheck()` renders every `sfx` offline and returns the peak; all must be under 1.0 with no errors (run it after any sound change). A transient click can measure louder than a gunshot after the compressor, so compare peaks and turn small clicks down.
- **Bug found:** `.hidden` only hid `.ov` overlays, so "Fight again" showed on loss screens. CSS now `.ov.hidden,.btn.hidden{display:none}`.
- Knockout and High Noon now have their own `test_sim.py` and `window.__sim` hooks like Steel & Honour.

### Shared building blocks
Seeded `rng(seed)` (mulberry32); `store.get/set` around localStorage with try/catch; synthesized sounds (filtered noise for hits/shots, tones for bells/calls, plucked strings for music); a vibration helper that prefers `window.GameNative.vibrate` (phone app) over `navigator.vibrate`; level grid; full-screen overlay CSS for home / rules / levels / round break / end; pause when the tab is hidden.

### 77. Sprint (`games/sprint/`): two thumbs are two feet (built on Sinkhole's shell)
- **The stride model.** Each tap is a stride; the next foot is due one stride-time after it, T(v) = 1/(2 + 0.24 v) (0.5 s
  standing, 0.22 s flat out), so the beat quickens as you speed up. PERFECT (within 0.05 s) pushes 22% of the way to top speed
  and adds FLOW (+1.2% top speed each, to 10); GOOD/EARLY push less; LATE floats (you slow while you wait); 0.13 s early or the
  same side twice trips you (speed x0.58, 0.42 s). Drag 12%/s. A metronome cannot follow a beat that quickens, and the gun
  (a tap on SET is a false start; under 0.1 s after the bang too; the second one disqualifies) ends every blind string:
  0 of 5,696 won; random 0 of 480.
- **Both thumbs = within 0.085 s.** The first tap is played as a stride at once (so the step sounds with no delay) and its
  effect is undone if the other thumb follows in time; a trip's words and sound wait 0.09 s for that, so a jump never shows
  "WRONG FOOT". At flat-out the stride is only 0.22 s, so a tap 0.08 s after the last one counts as "both": tests of "far too
  soon" must tap about 0.14 s early, not 0.16.
- Rivals are a simple first-order run-up (react, tau, top speed; 7% slower in hurdles; a chance to clip each hurdle); the race
  ends 1.3 s after you cross (the field still finishes on screen) or as soon as enough rivals are home that you cannot go
  through. Unfinished rivals on the board get a projected time.
- The 200 m runs round the far bend: every lane runs exactly 200 m (the stagger falls out of trackAt(lane, metres-to-go)).
  The 100 m and hurdles start in a chute past the bend; the bend's lane lines are left out where the chute covers them.
- Cameras: low in front in the blocks (beside you, other lanes hide you); behind and only 0.55 m to the side while running
  (more and the next lane's runner fills the middle of the screen); the photo-finish camera sits on the infield looking out,
  so the stands are its backdrop (from the stands side the crowd blocked it).
- The ghost: the distance run every 0.1 s is saved with each personal best per event and drawn as a see-through runner in
  your lane, with "1.2 m ahead / behind your best" under the clock.

### 78. Bus Driver (`games/bus/`): two pedals, a set route (built on Sprint's shell)
- **The route is a 1D line**: straights and quarter turns (radius 11 m) on a grid; everything (stops, lights, zebras, speed
  zones, cars in front) is a position along it. part3 turns a position into a place (pathAt), so the road, the pavements and
  the centre line are ribbons along the path, buildings are kept off it by distance to its points, and the bus bends round
  corners because it is drawn from its front point to its back point.
- **Pedals ease in and out** (GO 1.8 a second, BRAKE 2.2, both off at 5 a second): a tap is gentle, a hold is hard. Without
  the ease-out, the robot's short presses were all-or-nothing and the tea always spilt. The tea (comfort) loses
  (|a| - 2.9 m/s2) x 5 a second, where |a| includes the sideways pull in corners (v^2 / 11), so corners need slowing for.
- **The timetable allows for what is in the way**: each stop's time = distance / pace + 4 s + 7 s a stop + 4.5 s a light +
  2.5 s a zebra + 3 s a car before it. Without that, far levels (many lights) were late for even the sharp robot. A route is
  at most six stops (about 3 minutes): longer than that is too long for the feed, and the robots ran out of time.
- People on zebras step out only when the bus is 30 to 52 m away (so it can always stop). A test that starts the bus 45 m
  from a zebra at rest never meets the walker: give it speed first.
- Test traps: a test loop "drive until 10 m/s" never ends if the shift is lost first (a stop passed): move the stops away
  (G.stops[i].s += 3000) in tests that are about the pedals. The kit's mySkin() answers the first colour while HEADLESS;
  call __sim.live() before testing Your buses after __sim.start().
- Cameras: 10 m behind the back of the bus and 6 m up (closer and its roof fills the screen); at a stop it swings to the
  door side, high (from low, the shelter hides the door).

### 79. Cake Designer (`games/cake/`): five stages, five controls (built on Bus Driver's shell)
- **The icing is a real map**: 24 bands x 48 slices per tier, painted into a canvas wrapped round an open cylinder just
  outside the sponge (alphaTest 0.5, so uniced parts show the sponge, with no transparency sorting). The slice under the
  knife is the turntable's angle, because the cake turns by -angle and a cylinder's u = 0 faces +z (the camera). The covered
  total is kept as a running sum: recounting 1,152 cells a tier every frame made the robots twenty times slower.
- **Touches mean what they are over** (part3 sem): the height on the cake from where its foot and top are on screen, the
  point on the top from a ray onto the top's plane turned back into the cake's own frame. The rules only see { u, h, top }.
- **Blind thumbs iced cakes**: a thumb put down anywhere over and over covers a spinning cake in the end, so icing alone
  cannot be what a cake is judged on. The wrong icing colour fails the cake (a blind thumb picks it three times in four),
  stacking weighs more, a swirl more than 0.4 of a gap off is worth nothing, and a blind "thumb" is anywhere on the screen
  (the cake is about a third of it), not always on the cake. Then 2 of 5,696 blind strings won.
- **G.wait can end below zero**: after "G.wait -= dt" it is often -0.01, and "!G.wait" is then false for ever: the stage
  timeouts (the customer's "Is it ready yet?") never fired and blind games ran to the robots' 300 s limit. Set it to 0 when
  it runs out, and test "G.wait <= 0".
- A robot that remembers "I piped swirl n" must key it by the lesson's deal as well (G.deals): after a missed lesson the
  count starts at 0 again and the old memory stopped it piping at all.

### 80. Paint It (`games/roller/`): paint under the thumb (built on Cake Designer's shell)
- **Its folder is games/roller**: games/paint is already #62 Paint Drop. Check the id is free BEFORE copying a shell into a
  folder: new_game.py said "paint is already in games.json" and the copy had already overwritten Paint Drop's part1 and part5
  (restored with git checkout). The registry id, not the name, is the folder.
- The thing to paint is a 60 x 84 grid of cells: OUT (the wall behind), TAPE (safe), GLASS (a spill), or a colour. Its face
  is one plane with a canvas (4 pixels a cell, no smoothing) and a body of instanced boxes behind it for depth; a touch is a
  ray onto that plane, in cells. Each plank or stripe is a connected region and rings a note when it is 98.5% done.
- The cell just past an edge takes paint without it counting as a spill (cutting in): without that, even the robot that
  never misses spilt hundreds of cells round the fence's 2-cell gaps.
- The camera must fit the board's width as well as its height: on a phone held upright the width is what runs out (the
  first build cut both edges off, and a test touch aimed at the top corner landed off the screen).
- In a lesson, DONE finishes the lesson (at 85% or more), not the game: the robots pressed DONE at 93% and "won" in the
  middle of a lesson. A lesson is also done by itself at 94%.
- Light: the board faces the camera, so the sun must come from the camera's side (azim about 25 in W3.setSky); from 150 the
  face was in its own shadow and every colour looked brown.

### 81. Kite Fighter (`games/kites/`): pull and slack (built on Sprint's shell)
- **Making spam lose took six rules, each found by tracing a blind game that won** (kitedbg traces in the session):
  a parked kite cannot cut at all (saw needs the kite really moving, measured from where it went, not its velocity, since a
  kite held at the end of its line or the top of the sky still has velocity); the line takes 0.25 s to tighten (a flick is a
  tug); gravity in a pull (a dive is fast, a climb slower: blind loops dive into the roofs); the top of the sky has no wind
  (blind kites parked there were safe and above everyone); crossings low on a rival's line, by its flyer, do not bite; and
  the edge goes to the kite above only while it dives across the line, and a line pushed UP into another bites at 0.55.
  Then 0 of 5,696 blind strings and 0 of 480 random games won.
- Rivals that come back after a cut start low by their own flyer, not next to your kite (they were crossing your line the
  moment they appeared).
- Each of those rules cost the robots too; gentler rivals in the first six levels (rsaw x 0.7, more daylight) put them back.
- In a lesson, a rival that flies itself into the roofs must be replaced (a new deal), or the lesson waits for ever.
- A test of "darting across a line cuts it" must cross high on the rival's line (near its kite), or the crossing is ignored.

### 82. Dress Designer (`games/dress/`): taps that dress the model (built on Cake Designer's shell)
- The dress is rebuilt from the choices only when they change (a signature of `G.d` and `G.trims`): the skirt is a
  LatheGeometry whose outline follows the cut and the length, the bodice a squashed lathe, sleeves open cylinders; fabric is a
  MeshPhysicalMaterial (satin clearcoat and sheen, velvet sheen, chiffon see-through over an underskirt, sequins metal with a
  sparkle emissive map) and the pattern a canvas texture.
- The runway needs its own dark hall (a big BackSide box), or the day sky shows above the crowd.
- Trim spots are tappable rings placed on the dress; `spotScreen(where)` projects them for the thumb and the touch test.
- Balance: the robot's slips grow with what it has to keep in mind (wishes, the NO, the hidden wish, a short clock, the higher
  pass mark): `right = 0.9 + 0.1 acc - 0.014 (load - 3)`; and it forgets a clash rule now and then. Without that, level 40
  was as easy as level 3 for it (the test "it gets harder" failed). Real difficulty rises too: the pass mark goes from 3 to
  3.5 stars at 15, the forgiven miss ends at 20, the client's patience falls from 30 s to 12 s.
- The dress starts on options that do NOT meet her wishes, so NEXT, NEXT, NEXT loses.
- `node` balance sims (a copy of part2 with the kit's helpers mocked) run hundreds of games in a second: tune there, then run
  test_play once.

### 83. Taxi Driver (`games/taxi/`): a grid city, one thumb (built on Bus Driver's shell)
- **The city is a grid of one-way edges** (`i,j,h`: from a node, heading N E S W; you drive on the right). The taxi is an
  edge, a distance along it and a lane; at the node it takes the turn it was given (a closed road falls back to the GPS way,
  then straight, then right). `wp()` turns that into the world; after a junction the taxi's drawn place and yaw ease from
  where it was, so it swings round instead of jumping.
- **The GPS is Dijkstra over (node, heading in)** with no U-turns; places to wait are chosen by GPS distance, not as the crow
  flies (by distance, a "one block" fare behind you was a four-block loop, and level 1 took two minutes).
- **One thumb**: the brake comes on the moment the thumb lands and lets go as soon as it moves 26 px (a swipe). In the last
  24 m before a junction (the turn zone) a swipe sets the turn; elsewhere it changes lane.
- **Cars are made only for the road you are on and the four roads out of the next junction**; the set is worked out again
  only when that changes (`spawnKey`). Without that the robots ran at a third of the speed and the blind test took ten
  minutes. BLIND has three moves (`l r b`): five made the blind test five times longer and proved nothing more.
- Durations: level 1 about 45 s, rush hour about 100 s. Shorter blocks (52 m), a top speed of 15 m/s and pick-ups close by
  kept it to that.
- The robot's slip is a wrong turn now and then (2% + 20% of its inaccuracy); with only a stop-in-the-ring error every level
  was the same to it.

### 84. Roach Run (`games/roach/`): his idea 12, a bug-height house (built on Taxi Driver's shell)
- **The world is in centimetres** (a table 75 high, a roach 3 long). The camera sits 30 cm up and 34 behind: high enough
  to see shadows coming, low enough that table tops are ceilings. At 58 cm up the house looked ordinary. The start camera
  is inside the crack (4 cm up) and eases out once the roach is out.
- **Indoors at night with world3d**: setSky('night'), then turn its sun and sky light down, the fog far off, and light the
  room with a PointLight and SpotLights with decay 0 (with the default decay in centimetres they were either black or white).
- **Stealth as a meter**: each person's notice rises only while you are in the open (x2.2 in a pool of light, more when
  near or sprinting, a third when still) and falls under cover; at 1 they attack. Covered floor (under tables, chairs, the
  cupboard gap) makes slippers harmless; HIDE also stops the spray.
- **The slipper aims at where you will be** (position + velocity x warning x lead). The robot only "sees" a shadow after its
  own reaction time (react x 1.2, varied); without that every robot dodged everything and far levels were as easy as
  level 1.
- The robot walks an A* grid (5 cm cells, costs for the open and the light, clouds and shadows avoided). With a plain list
  as the open set a balance run took minutes; a binary heap made it a fraction of a second a game.
- Carry capacity is 3 (a big piece fills it), so later nights need several trips: that is what made rounds 40-80 s instead
  of 10.

### 85. Hoop Shot (`games/hoopshot/`): his idea 13, a slingshot pull (built on Taxi Driver's shell)
- **Real flight**: gravity, a ring for the rim (the nearest point of the circle, restitution 0.55), the board, the floor;
  a basket when the ball drops through the ring. A fixed 52-degree launch so the thumb sets only power and aim. The power
  window is a few hundredths wide; a launch speed range of 5.2-9.6 m/s (not 4.6-10.8) widened it by about 40%.
- **The robot finds its shot by simulating**: for each spot, a sweep of powers (and aims, for bank shots or a moving spot,
  around the aim that cancels the slide) and the middle of the widest run that scores; then its hand is off by an amount
  that grows as the path shown gets shorter. Without the slide's aim correction it never scored on a moving spot.
- **Why it missed**: where it came down past the rim's height, along and across the line of the shot; one that never got
  that high is too weak; one that hit the board first and came back out is too strong (the bounce back first read as
  "too weak").
- **Practice** is the same game with `need` and `balls` at a billion: it never finishes, so nothing else had to change.
- Arena crowds as instanced capsules behind and beside the hoop; put close to the camera they looked like pillars.

### 86. Sheepdog (`games/sheepdog/`): mine, herding by pressure (built on Taxi Driver's shell)
- **Sheep are boids with fear**: away from the dog within 9 m (stronger the faster she comes), cohesion, alignment,
  separation, a lamb's pull to its mother; a dog running past 6.5 m/s near them raises panic, and a panicked sheep bolts
  its own way. The ram only feels a dog within 2.6 m or a bark.
- **Things in the way are slid round, not stopped at**: sheep and dog against a tree move along its tangent; a sheep pushed
  at the river bank drifts along it to the bridge; one ever found standing in the water is put back on the bank. Without
  these the flock froze against a tree or a bank and the robots lost at dusk. Trees are never placed near the river (one
  stood on the bridge).
- **The robot herds the textbook way (Strombom)**: if the furthest sheep is further than 2.2 sqrt(n) + 1.5 m from the
  centre, go behind it; else drive from about 0.5 of that behind the flock, toward the bridge or the gate; walk when driving;
  never cut through the flock (step round it along a circle); run at a fox; bark at a stuck ram.
- **The thumb** is raycast onto the grass every 33 ms while held; a touch under 0.2 s that hardly moves is a bark and does
  not move the dog (the move only starts after 0.18 s or 12 px).
- The flock is slow to simulate (35 us a step), so BLIND has two moves (thumb somewhere or let go; bark): 31 strings, about
  30 s of blind games instead of 15 minutes.

### 87. Sumo (`games/sumo/`): his idea 21, two bodies and their weight (built on Roach Run's shell)
- **The model is forces between two men, not a ragdoll**: in contact, drive (stick up, cubed, so a wandering stick barely
  pushes; x strength, stamina, x1.25 with a grip, less with heels on the straw) against drive, or against half his footing
  if he does not push back; a small random shift in footing every second so no stand-off lasts; once your feet go backwards
  they are a little harder to stop. Every one of these was needed: without them bouts ran 40 s to the judges, or an even
  push contest never ended.
- **Pulls and sidesteps only work on a man who is committed**: a pull's strength grows with how far he leans past 0.3 (an
  upright man shrugs it off); a sidestep makes him stumble only if he is lunging at you (lean over 0.6, moving over
  1.2 m/s, within 1.6 m), and a stumbling man falls only to a shove. Earlier versions let blind grip-and-pull or dodge
  spam win one game in a hundred.
- **The rivals feel what you do at once** (a reflex that cuts their thinking time when you start a push, pull or turn), keep
  strength back when nothing is happening, rest after a burst, take hold and turn at their own edge, and never walk
  themselves out (any outward step within 0.75 m of the straw is removed unless gripping). Their style changes the numbers:
  chargers strong but leaning, anchors heavy, pullers wait and snap.
- **Tests' still partner**: `G.noAI = true` stops the rival thinking (the touch tests step the rules with it).
- **Z-fighting**: the hall floor at y 0 under the dohyo's top made a dark wedge with stripes: the floor sits at -0.6 now.
- **The camera** stands behind you and 1.5 m to the side, high: from straight behind your own body hid him.
- Node replicas of the browser tests (`/tmp/sumofull.js`: all 13,056 blind games in 20 s with two processes) made the
  balancing quick; the blind count must be checked after every change to the physics, not just the rivals.

### 88. Memory Lane (`games/memory/`): his idea 23, five kinds of remembering (built on the 2D starter kit)
- **Every question is made with the scene** (the options, the missing thing, the change), so the answer is checked against what
  was really shown, and the review can draw WHAT WAS THERE beside YOUR ANSWER with rings.
- **One difficulty at a time**: things (3 to 10), look-alikes (same family or another plate colour) and a shorter look each
  step up on their own level of every three. The honest robot has a memory that fills up (each thing remembered with a
  chance that falls with load, look-alikes and too short a look); without the gentler curve it fell off a cliff after 20.
- **The kit defines `pick`** (part1): a game function of the same name breaks the page; this one is `tapSlot`.
- **An object of answers is built in full**: `{ missing: `...${itemName(r.gone)}` }[type]` ran every entry and crashed on the
  others; use functions.
- **Emoji are drawn once per size** onto small canvases and copied (text with emoji is slow); wrapped text is cached.
- Lessons count two right answers **in a row**, so blind tapping cannot luck its way through the lesson (one in twenty).

### 89. Spy (`games/spy/`): his idea 18, stealth in a building of rooms (built on Roach Run's shell)
- **A grid of 1 m cells** (walls, shut/open/locked doors, pavement) with furniture on top (desks hide a crouching spy,
  cupboards and closets always block sight); rooms in rows with a corridor through the middle; every room reachable.
- **Name clashes with the kit**: a game function called `noise` replaced the juice kit's sound `noise()` and broke every sound
  (now `makeNoise`); check new top-level names against `tools/juice-kit.js` and part1.
- **Doorways are a metre wide and the spy 0.6 m**: movement lines her up with the cell she is in when she pushes into a
  wall (sliding into doors); without it a thumb (and the robot) stuck on door frames.
- **ACTION has one label at a time**: walking at a door puts OPEN DOOR first, even beside a cupboard.
- **Running footsteps**: the walk step counter reset before the run one could fire; nobody ever heard running.
- **The honest robot**: A* over a cost grid (cells in a guard's cone cost a lot, near a guard less), waits when its next
  steps are seen, steps out of sight when a guard grows curious (trying directions along which its whole body fits), runs
  when spotted (a cupboard if one is near), keeps still while a guard searches nearby, comes out of a cupboard after a while
  if nobody is looking, and picks the nearest desk it can actually reach (one behind a locked door means: keycard first).
- **A clock (the shift change)** ends every mission, so blind play ends too (1,984 blind games in 20 s).
- A furniture grid for lookups (thousands a second); the guards' fans are cast against walls on the floor each frame.

### 90. Mocktail Bar (`games/mocktail/`): his idea 24, a bar with a taste system (built on Hoop Shot's shell)
- **3D above, a 2D tray below**: the counter, the customer and the glass in the top 60%; tabs of bottles, glasses, ice,
  tools, a big hold-to-POUR and SERVE under the thumb. The camera's view is shifted up (`setViewOffset` onto a taller
  picture) so the glass sits just above the tray; in portrait a wide view (fov 72) keeps the customer from filling it.
- **Every taste comes from what is in the glass** (sweet, sour, bitter, fruity, fizz, weight per ingredient), so a feeling
  order accepts any drink that fits; `solve()` checks every feeling is possible with the bottles open on that level.
- **A dead branch hid a bug**: an `if (false) {...} else {...}` left from editing made the else overwrite every feeling order,
  so no customer ever asked for a feeling; the touch test that looks for one caught it. Search for `if (false)` after edits.
- **Forgiving gestures**: a shake counts only after 26 px of travel each way; a stir adds only smooth turns (no jumps over
  1.2 rad); a garnish dropped near the glass, or simply tapped, lands.
- The test hook gives the page's lexical names to Playwright through `__sim.x()` (they are not on `window`).

### 91. Timber (`games/timber/`): my idea for set 16, felling trees by notch, back cut and hinge (built on Mocktail Bar's shell)
- **One tree at a time, each in its own clearing at the origin**: the forest (one instanced mesh of 260 pines) is placed again
  round every tree, kept out of the strip and its hazards, so nothing has to stream in.
- **The tree tips only when the hinge is thin enough for what pushes it** (lean along the line, wind, wedges, the open notch):
  so a straight tree stopped in the green sits and needs wedges, a forward-leaning one goes early, and holding SAW on after
  it goes keeps cutting the hinge for half a second. Control = notch quality x hinge quality; the lean and gusts are scaled by it.
- **The camera sits behind and a little to the side of the trunk** (straight behind, the trunk hid the line and the strip),
  shifted up with `setViewOffset` so the strip sits above the ring and the buttons.
- **The ring (a cross-section) is the main readout**: colour only the wood left once it is near the hinge size, or the whole
  trunk looks like a "thick hinge" while cutting.
- Fences are five posts (five small circles) in a row beside the strip, so the hit test stays circle-against-segment.

### 92. Ice Hockey (`games/hockey/`): his idea 16, three-a-side on a compact rink (Timber's shell, turned sideways like Eleven)
- **Sideways on the kit shell**: wrap everything from `#gl` to the last overlay in `<div id="stage">`, swap `position:fixed`
  for `absolute` in the CSS, take Eleven's `resize()`/`toStage()`, pass `dims: () => [W, H]` to `W3.init`, and turn every
  touch through `toStage` first. The pause button goes top left, out of the scoreboard.
- **Blind hockey is hard to beat on a small rink**: random thumbs reach the slot often. What finally parted blind from honest
  (25,920 blind matches, 23 wins; random 0 in 240):
  - The stick aims. The shot goes where the stick's line meets the goal line (within a metre of the posts snaps on), and
    off the net it goes wide.
  - No aim goes straight at the goalie and he has it. From more than 12 m he sees it all the way (99.7%).
  - Facing away gives a weak, wild backhand. A shot snatched the moment the puck arrives is weak, unless it is a one-timer
    from the slot, facing the net.
  - A pass or loose puck that slides at the net is the goalie's. A goal needs a shot, or a rebound from your own aimed shot.
  - A poke only works facing the puck, and a steal gives the puck straight to the poker. Otherwise the victim, who stays
    close, simply picks it up again.
  - Their forwards get an "open shot" bonus when nobody is within 2.5 m: they punish a team that does not defend.
- **Goalie bugs**: deciding a save only when the shot was 0.12 s out missed slow, sideways pucks and pucks projected just
  wide that crossed just inside. Watch by distance too, keep watching a shot heading wide, and give the goalie his chance
  at the moment of crossing if nothing decided it yet.
- **An AI carrier frozen in a corner** (its dribble target was clamped onto its own spot): dribble toward the slot instead.
- The 2D overlay draws the puck's trail from projected history, so the puck never gets lost among the lines.

### 93. Tennis (`games/tennis/`): his idea 17, singles with a swipe (Timber's shell, portrait)
- **The swipe is direction, length and speed** (Tennis Clash's scheme), measured from touch-down to lift-off. The contact is
  the lift-off, and a 0.2 s buffer after it lets a swing made a moment early still meet the ball. Speed is scaled
  (x0.6) so an ordinary flick is a drive, and a slow, long swipe is a lob.
- **Plan off a shot counter, not the velocity**: the AI and the robot used `vx + vz` to notice a new ball, and every bounce
  changed it, so both re-thought (with their reaction delay) at each bounce and never got there. `launch()` now numbers
  each ball (`b.id`).
- **Take the ball on the rise**: the contact point is the first moment after the bounce when the ball is between 0.5 and
  1.6 m high and inside the court plus 3 m. Waiting for it to drop sent the AI 8 m behind the baseline.
- **Receivers stand diagonally** across from the server. With them on the wrong side, every serve was an ace and blind
  play won by serving.
- **Lockstep blind beats** found a fixed toss-to-swipe delay that hit the top of the toss every time. Each toss is now a
  little different (vy 4.7 to 5.7), and the serve lesson only counts a swipe made on the green.
- **A serve clock** (ten seconds, then a fault) ends matches where nobody serves. Without it, half the blind games hit the
  robots' time limit.
- Speeds that feel right on a phone: drives travel at about dist/(12.5 + 10 x pace) seconds, slowed by a quarter at level 1.
  Honest robots aiming at the open court (+/-2.7 m) give 8 to 15 shot rallies and minute-long matches.

### 94. Metro Map (`games/metro/`): his idea 19, a city's metro on a 2D paper map (Timber's shell, 2D, portrait)
- **2D on the 3D shell**: three.js is taken out and `/*WORLD3D*/` becomes `const W3 = null, THREE = undefined;`. STEPS for
  smoothness are then three sharpness notches (`pr` 2, 1.5, 1). The city behind the map (blocks, parks, river) is drawn once
  per level into its own canvas and copied each frame.
- **In a planning game a random network works**: a thumb dragging at random links every station sooner or later, and at low
  load any network carries people. Three things stop it: nothing is built unless the drag is *let go on a station*; every
  change halts that line's trains for 4 s (track works); and each level has a last week (4 weeks at levels 1-3, then 6).
  Blind wins went from 1.4% to 0 of 5,696.
- **Delivery is limited by how many people appear**, so a good network and a merely working one reach the target at the same
  time; that is why the last week, not speed, separates them. Faster trains (2.0 units/s) and a week of 45 s made late
  levels winnable; the target is capped at 190.
- **A tap on a station must come before a tap on a line**: the line passes through the station's centre, so the line won
  every tap and added trains instead of showing the station's card.
- **Queues beside stations near the right edge go to the left**, or they run off the screen.
- The overlay behind cards is darker than other games' (the paper map is light and showed through the end card).

### 95. Bin Round (`games/binround/`): his idea 20, a calm bin round in 3D where nothing can be lost (Timber's shell)
- **A game you cannot lose still needs spam to fail**: here "winning" is finishing a round, and a blind thumb must never
  finish one. test_play's "it gets harder" check became "later rounds are longer and fuller" (round time at street 40 over
  1.6 x street 3), since nobody can lose a street.
- **What stopped blind thumbs**: a press only lifts a bin that is already at the lorry (a thumb held down while you walk does
  nothing); holding on too long spills bits and brings the bin back down *full* (if a spill still emptied it, a thumb held
  down for ever finished every round); a wrong release costs a moment while the bin comes down; and street 1 has two things
  at every house. Random moves went from 5 of 480 rounds to 0.
- **Portrait framing in a street**: a camera behind the lorry had the lorry hiding the work. The lorry now stops just *past*
  the gate, and the camera stands over the pavement looking along the line of bins (fov 62), with the lorry ahead and to the side.
- **Three.js prisms for roofs**: CylinderGeometry(1, 1, 1, 3) with rotation.x = -PI/2 puts the ridge along z with the point
  up; scale x = width, y = length, z = height. Rotating it about z as well turned the roofs into black wedges.
- **Lamp posts near a stop** stood between the camera and the bins: none within 17 m behind or 7 m past a stop.
- **Stop here** ends with over = 'lost' and `res.rest`; saveResult must not count it as a loss (no help after "losses").

### 96. Beach Watch (`games/lifeguard/`): my idea for set 17, a lifeguard reading the water (Timber's shell, 3D)
- **When the whole game is "tap the right person", a thumb that taps people at random is the spam to beat.** BLIND has a
  second move, `s`: tap whichever swimmer is nearest. What stopped it: a tap on someone fine sends you out on a false alarm,
  and you cannot act again until you are back up the tower; a tap on someone fine while you are already out costs 3 s of
  "look first"; beach 1 has eight people and four tired swimmers, and two misses close it. Random tapping went from 41% of
  rounds won to none.
- **Whistled swimmers must not turn straight back into "at risk"**: one whistled past the buoys was still past them, so the
  next frame put them at risk again (whistle loops). Risk checks wait while a whistled swimmer swims back.
- **Lessons that are a guess among swimmers**: in a lesson every wrong tap (a fine swimmer, empty water) starts the count
  again, the others stay well clear of the rips, and the whistle lesson needs three. Otherwise a blind thumb finished them.
- **A portrait view of a wide beach**: the world is squeezed sideways for the picture only (VX = 0.62; the rules keep metres),
  taps on people use their position on the screen, other taps a ray onto the water. The tower itself is hidden: the camera
  is your eyes up on it.
- Foam and rip shading need soft canvas textures (radial and side-faded gradients), or they read as grey tiles and runways.

### 97. Hoops 3v3 (`games/hoops3/`): his idea 14, three-a-side basketball (Ice Hockey's sideways frame)
- **Built on Ice Hockey**: part1 (the sideways stage, toStage), part5 (stick + three buttons) and the robots carried over; the
  rules, court and sounds are new. Drag-to-aim from PASS turns the screen drag into court directions with three projected
  points (the same trick works for any sideways game).
- **A catch must not reset the shot clock**: `give()` reset it whenever the ball had no owner, i.e. after every pass, and the
  other team held the ball for 30 seconds. Possession is now tracked by team (`G.possT`).
- **A shot meter can be counted, by people (NBA Playgrounds' reviewers did) and by blind thumbs**: press-release lockstep at
  0.7 s hit the green every time. Every shot now has its own meter speed and its own green height. Letting go at once is a
  pump fake and holding too long comes down without a shot, so a thumb that never looks never shoots.
- **When "you" control whoever has the ball, rebounds hand a blind thumb free layups**: offensive rebounds need a closer touch
  (the defenders have inside position), and a putback within 2.5 s is half as likely.
- **Blind wins came from the other team scoring almost nothing**: when your man is left alone, the other team gives him the ball
  (75%), their shooting is better, and matches are a little longer (2:20 to 2:50) so one lucky shot decides less.
- test_play's blind run takes about 20 minutes for a two-thumb sports game with 2.5-minute matches: run it in the background.

### 98. Gridiron (`games/gridiron/`): his idea 15, five-a-side American football (Hoops 3v3's sideways frame)
- **Built on Hoops 3v3**: part1 and part5 (sideways stage, stick + three buttons) carried over; the buttons change with the
  moment (`btnLabels`: HANDOFF/DODGE/TACKLE...) and a button floats over each receiver, coloured by how open he is.
- **Separate challenge levels (two first downs, score from the 10, stop a drive) leaked wins to random tapping**: a random
  run of four plays sometimes breaks one. They became the three lessons, and every level is a match: a random thumb wins a
  play now and then, never a match, because the other team scores too.
- **Random wins came from 7-0 matches where the AI offence did nothing**: every drive now starts from the 32 (overtime from the 50) rather
  than the 45, so a lucky random play rarely goes the whole way, and a quarterback who runs past the line is a target for every
  defender, not just the spy. Random moves: 0 of 480; blind: 0 of 650 (node) before the browser run.
- **Line play needs rules or every collision is a block**: only designated blockers can hold a man (with immunity after), the
  quarterback is clamped behind the line unless you steer him up, and rushers go round the centre instead of into him.
- **Lessons must count only the player's own deeds**: AI teammates were making the lesson-3 tackles, and a touchdown did not
  count as "past the yellow line".
- **A replay is cheap**: record each live frame (positions, ball, lines: about 70 numbers), and to show it swap the numbers
  into the game, draw, swap them back; the rules never step while it runs. Offer it after a touchdown or a 15-yard gain.
- Set a down's spot by calling `toPick()` after changing `G.los`, or the players stay where the last play lined them up.

### 99. Rock Climb (`games/climb/`): his idea 22, one-thumb climbing (upright, 3D; Beach Watch's frame)
- **The body is solved, not simulated**: four holds in, hips out (`solve()`: a few dozen relaxation steps that keep every limb
  within reach, with a push upwards so the climber stands on its feet). Rules that read like climbing: no splits (a foot stays
  under its hip), a hand on a hold below the hips is no use, the body hangs below the hands. Strain counts the arms only.
- **Approach holds need the body solved high**: slopers (below the shoulders) were unreachable when the solver sat the hips
  low; standing tall fixed it. Side-pulls' facing must follow the line (towards where the body will be), not the wall side.
- **Every line must reach the top**: a last hold within 0.6 m of the top ledge; slopers only after short steps; jumps only
  where a jump really reaches (the bot found routes that ended 1.5 m short).
- **Manual feet that can strand you are no fun**: from level 6 your feet still scramble to the nearest footholds that work when a
  hand moves; dragging a foot is for a better hold (more support), not to get unstuck. Auto feet keeps the best holds.
- **A climbing robot needs a map**: `toTop()` (distance to the top over hand holds) guides the honest climber off dead ends;
  without it, it climbed into corners and waited for ever. When no hand can gain, it steps a foot up.
- **Blind moves must be cheap**: a blind move that called `targets()` (every hold, each with an auto-feet search) took 40 s per
  game; `move()` now tries only the holds within the snap radius of the finger, nearest first.
- **Lesson counters must stop at done**: a condition that stays true (a full grip) called lessonSee every frame and restarted
  the "done" wait for ever. One clip per bolt height (two lines' bolts at 3 m clipped together).
- Fall = back to the last bolt with a full grip (hanging on the rope is a rest): kinder, and no repeat-fall spiral.

### 100. Dentist (`games/dentist/`): his idea 30, a calm one-thumb clinic (3D room, 2D mouth)
- **3D where it reads, 2D where it must be touched**: the clinic, the chair and the patient's face are 3D (arrival, complaint,
  smile); the mouth close-up is a flat 2D arch (a U of ten teeth per row) because small targets read and touch better flat. The
  3D picture is not drawn while the close-up covers the screen.
- **A surface you clean is a grid of cells with layers** (food, plaque, tartar, stain, decay, hole, dust, filling, excess,
  cure, chip, crack): every tool is a few lines that change layers under it at a rate set by the stroke's speed. Calm speeds
  work; too fast is "rough" (hurts, cleans nothing): that one rule beats blind scrubbing.
- **No last speck**: a tooth at 92% clean is clean (the rest vanishes with a ding).
- **The tool works above the fingertip** (46 px): the thumb never hides the tooth.
- **Robots that follow a path need their holds kept**: a job whose last point was a hold ended at once (the wire key and the
  blue light never ran); a hold that does nothing at rest (the shaper needs movement) stalled for ever; a drill pause that
  lifted the hand left the job steering a hand that was up. Always: end a job, then plan again.
- **Per-gesture flags belong to the gesture**: the X-ray's "done" flag lived on the hand and stayed set for the next patient.
- **Clock from the work, not the level**: the day's time is each patient's estimated work times a factor that tightens with
  level (2.2 down to about 0.75); the robot's hand speed scales with its reaction so ordinary and sloppy differ at level 40.
- Drill sound has its own Settings switch (soft, quieter, off), as he asked for adjustable drill sounds.

### 101. Balloon Drift (`games/balloon/`): mine, steering by the wind at each height (upright, one thumb, 3D)
- **Place targets by flying a plan**: each X is where a simple balloon gets to by riding one wind and then a different one
  (climbing or sinking at 2 m/s between them, carried by the winds on the way). Placing them by adding wind vectors ignored
  the climb and made half of them unreachable; using two different winds means staying at one height never gets there.
- **Heights are above the ground** (winds, the ceiling, the ring), or hills put the balloon "inside" a wind layer.
- **A lagging control needs a controller on the thing you change**: steering the climb rate directly with on/off burns
  oscillated for ever; aiming the envelope's heat at the heat that gives the wanted climb is steady. The heat itself must
  answer within a second or two (cooling 0.03/s): with slow cooling, letting go kept the balloon climbing for 20 s.
- **Planning robots must look along a path, not a line**: the best height is the one whose simulated path (climb, then drift)
  comes closest to the goal, plus a little of the end distance (ties otherwise keep it where it is). Land when the predicted
  touchdown point is as close to the field as it gets; aim upwind of the field by the drift of the descent.
- **Scoring that falls off fast beats random tapping**: a quadratic fall-off (1000 at the centre, 0 at 120 m) and a goal of
  38% of the best; a linear one let random drops at 60-100 m pass level 1.
- **A minimum-detector needs a margin** (3 m): it fired on jitter and dropped markers at once.
- Lessons start in the air (no slow take-off), and place their X where the ring will be in 20 s at this height.

### 102. Sandworm Rider (`games/sandworm/`): his idea 25, riding a giant worm through waystones (sideways, two thumbs, 3D)
- **Walls make a funnel: in the open, have none.** With soft walls on every leg (bounce or turn-you-along), a worm left alone
  pinballed down the corridor and won; blind holding of BRACE won 1 in 2. Walls now exist only in canyon legs; in the open
  dunes a worm going straight rides off into the desert until sunset. Waystones are a gate (10 m + a eighth of the width),
  not the whole corridor, every waystone turns the way 25-60 degrees, and the ride starts 0.3 rad off line.
- **An unsticking rescue must not steer.** "Wedged for 1.6 s: dive under and come up past" first put the worm back on the
  route facing along it, which a blind player could ride to a win; it now just carries the head 26 m forward on its own heading.
- **Detect stuck by distance, not speed**: knocks drop the speed below a threshold and it climbs back between them, so a
  speed timer never fired; less than 10 m moved in 1.6 s does.
- **One knock per contact** (a cooldown per rock, and for walls), or one rock drained balance 60 times a second.
- **Rocks always leave a way past**: drop any rock with less than 16 m beside it, any in a canyon, any by a waystone.
- **Breach from the sand's curvature**: the head flies out when it is climbing (vy > 4) and the sand under it falls away faster
  than 5 m/s^2 at speed; counting it inside `step` (not by reading events in `lessonTick`, which ran before they were made).
- **A one-line `for` with a trailing `//` comment** swallowed the rest of the line: keep comments off packed lines.
- **Sideways HUD**: the stick only uses left-right; SURGE and BRACE sit side by side so the right thumb slides between them;
  a camera behind a long worm must come higher and closer in canyons (it went into the walls) and be clamped inside them.
- Vertex colours are linear: sand written as sRGB looked grey; convert with a 2.2 power.

### 103. Skydive (`games/skydive/`): his idea 28, freefall, canopy and a landing on the X (sideways, two thumbs, 3D)
- **The wind must not carry you to the target.** With the X downwind of the door, a jumper who did nothing drifted towards
  it and random thumbs won 3 in 120; the wind now blows across the line from the door to the X, and the plane flies across it.
- **Robots fly a pattern, not a line**: "the heading whose straight-line landing is nearest" lands 30-40 m off, because the
  180-degree turn onto final eats the height. Aim to be downwind of the X at 95 m (searching heading and brakes for the
  straight flight that passes nearest), then the final into the wind: 10-15 m off. Searching three brake settings helps.
- **Rings must be reachable one after another**: 150 m of height apart and no farther sideways than the track speed covers
  in that time; alternating them 100+ m left and right 1 s apart was impossible even for the robots.
- **The flare must be short-lived and late**: with a long flare (or one that pinned the sink at 1.2 m/s) flaring at 9 m ran
  out and stalled; 1.8 m/s for 2.6 s, and the right moment is 2-6 m (the ground ring turns green then).
- **Assist on the first jumps (his "first jump" direction)**: levels 1-2 flare for you at 4.5 m and the flare lasts longer;
  hard landings lose only from level 4. Letting hard landings pass at 1-3 let blind thumbs win.
- **Don't rebuild the world when only the rings change** (lessons replace the rings every few seconds): two separate keys.
- New settings rows (landing guide, camera shake) sit with the kit's switches; `optGuide()` is always on for the robots.

### 104. Detective (`games/detective/`): his idea 33, generated mysteries (upright, one thumb, 3D rooms + a paper panel)
- **Make the truth first, then the clues**: who, how, when and where everyone really was; every clue is derived from that
  (the trace of the method, the moment it stopped, the culprit's own thing at the scene, what ties them to the method, a
  secret-keeper's secret and what clears them, confirmations for the rest). Fair by construction, and endless.
- **The accusation is the spam gate**: four parts at once (who x how x when x two clues from all found) is about 1 in 1,600 at
  level 1, with two tries. Tapping every object finds every clue, and that is fine: finding is not solving.
- **A lesson must not be finishable by blind cycling**: lesson 1 counts only hidden marks (the right side facing and a tap
  on a small spot), and lesson 2 resets on a clue shown to the wrong person.
- **Names clash with the kit**: `note` (music) and `hint` (the hint bubble) are the kit's; the game's are `addNote`, `askHint`.
- **3D in half the screen**: give W3.init `dims: () => [W, H/2]` and CSS the GL canvas to 50vh, so W3.screen gives the half's
  own pixels; the panel is DOM (lists and choices read better flat, and the test can tap real buttons).
- **Taps on a turned object must use the same scale as the mark**: pixels per stage unit = (H/2)/(tan(fov/2) * distance),
  times the face's half-size; one function for both (faceUV/faceXY).
- Every object says what it holds when looked at ("letters and bills, nothing out of place"), with the same "turn it to see
  every side" on all of them, so the words never give a hidden clue away.

### 105. Convoy Escort (`games/convoy/`): his idea 34, hunting submarines and guarding ships (sideways, two thumbs, 3D)
- **Unopposed enemies must be deadly, or doing nothing wins.** Merchants with spare hits, sloppy torpedo leads and submarines
  that fire once and fall behind the convoy let blind thumbs win 1 in 3. Now the lead is solved properly (iterate the
  intercept), a submarine fires two salvos at two ships, and early merchants sink on one hit.
- **Deterrence is the core skill, and it must be possible**: a submarine never fires with an escort within ~500 m; it goes
  deep and comes back later. Hydrophone reports (a bearing and a wide yellow ring) come before the sonar can see it, so the
  player is never hunting blind (his "never through guesswork alone").
- **Space the submarines out along the route** (one every 450 m) and cap them at two; from level 8 other escorts guard the
  far side. Three at once on one escort could not be defended by anyone.
- **Fast-forward needs a frame budget**: the robots stop at 300 s of frames; missions are 1,400-1,900 m at 7 m/s with x6
  fast-forward in quiet stretches, dropping back automatically when there is danger.
- **Lesson objects must not react like the real ones**: the depth-charge lesson's submarine surfaced after the first hit and
  vanished from the sonar; the lesson keeps it down.
- **Removing a branch leaves an orphan `else`**: twice now (sandworm's free mode removed from saveResult and the end card);
  run `node --check` on every part after a structural edit.

### 106. Pottery Wheel (`games/pottery/`): mine, throwing a pot to an order (upright, one thumb, 3D)
- **A profile is the whole game**: the pot is radius-by-height (half-centimetre slices), a wall thickness and a height; pulls
  keep the volume (thinner, taller), shaping pulls slices towards the thumb with a soft bump, trimming cuts the height. The
  3D pot is a LatheGeometry of that profile (outside, rim, inside), rebuilt only when it changes.
- **Height must be correctable**: a single pull overshot the order by 25% and nothing could bring it back; the trim wire fixed
  it (and real potters trim the rim anyway).
- **A plain cylinder must lose to every order** (a bowl as the first, curved shapes only), or pulling alone would pass.
- **Measure the screen mapping from the camera** (two projected points of the pot's plane) for touches and the dotted outline;
  it stays right when the camera moves.
- **A speed threshold must be reachable by a real flick**: tearing at 95 cm/s never happened in a touch test; 75 down to 45.

### 107. Joust (`games/joust/`): his idea 26, a tournament (sideways, two thumbs, 3D)
- **One pass is a four-second charge with a single crash**: everything is decided at `PASS_T`: your tip (aim + the sway of the
  gallop) against their shield, their error against yours, who was braced. The rules do not need the 3D at all.
- **A fixed aim must not score by luck**: aiming at the middle and leaning at random won 10% of bouts. Fixed by moving their
  shield a little every pass, an unbraced lance skidding off for no point, a cap on how far a late lean moves their hit, and
  a seat cost for leaning far at the crash. The robot aims at `sh0 + shift - sway(PASS_T)` and so is unaffected.
- **Lessons must need skill, not tries**: "hit the shield three times" was finished by 90 s of blind tapping; now it is three
  near the middle in a row (a miss starts the count again).
- **Never end a packed line with a `//` comment when a later edit may append to it**: a comment swallowed the rival's
  balance update, so nobody could ever be unhorsed. Run the unhorse rule test after any edit of `clash`.
- **Screen mapping**: aim +x is the screen's right because the camera looks down +z (world -x is screen right); test it by
  projecting two tips, close enough to the rival that the difference is more than a pixel.

### 108. Splash Course (`games/splash/`): his idea 32, an obstacle course above water (sideways, two thumbs, 3D)
- **One player model for five obstacles**: every surface answers "how high is the ground here" (`support`) and "how does it
  carry you" (`carryV`: a swaying ball, the belt backwards, the cross round its centre). You move relative to what you stand
  on; a jump takes its carry with you; landing takes it away again. New obstacles only need those two answers.
- **A fixed pattern can be walked straight through**: the punch wall's gloves are timed so a walker at full speed is always
  caught by one of them, whenever he sets off (each glove's phase shifts by less than the "out" window); the honest robot
  waits in the gaps. Test: start the walk at 24 different moments.
- **Blind luck on the balls**: straight jumps landed on the next ball, and a full jump could skip one. The balls alternate
  left and right (a straight jump lands on an edge and slides off), and the longest jump is shorter than two ball spacings.
- **Never let a planned jump end on a moving hazard's path**: the robot checks the whole flight, not just the landing.
- **A trip must put you far enough back to jump again** (1.1 m), or the runner trips on the same hurdle for ever.
- **The end card appears by real time, not frame time**: a heavy 3D page drawing at one frame a second in the test browser
  took 12 s to show the card (frame time is capped at 0.05 s); `endT` now adds the real time (capped at 0.3 s).
- **Par per obstacle, measured**: `parOf` was calibrated against a sharp robot's time per obstacle (tools in the session:
  per-obstacle split from the `cp` events); the qualifying time is par x 1.9 at level 1 down to 1.15.

### 109. Surf (`games/surf/`): his idea 29, catching and riding waves (sideways, two thumbs, 3D)
- **The face is a 2D world**: x along the shore, s from the base to the lip, heading and speed. Down the face gains speed,
  up spends it, drag pulls towards a cruising speed, and the wave's push is strongest in the pocket near the curl
  (`(2.5 + 2.8 near) * vp / 6.2`): you can outrun the curl only close to it. Tuning order that worked: first the cruising
  speeds (shoulder ~1.2 x peel, pocket ~1.4 x), then the robot.
- **Count a move the moment it is done**, not when the turn ends: a snap is a downward turn of 1 rad that started at the lip.
  Waiting for the turn to end missed snaps whenever the next stick target carried the turn on.
- **A big reversal turns round through up the face** (a cutback), not the short way into the flats, which bogged the board.
  Only when the target is behind you: applying it to ordinary turns sent the robot the long way round.
- **Blind pumping is real surfing**: up-down at a beat earns carves and snaps. What stops it winning: each repeat of a move
  scores half, a wipeout keeps a quarter of that wave, and the target needs a mix.
- **The barrel grows out of the curl** as it enters a barrel section (`tl = xb - x0`, up to 12 m), so nobody is under a lip
  that appeared from nowhere; crouching stalls you (more drag) so the barrel can come over you.
- **The wave is drawn 1.6 times taller than it rides** (VIS): a 1.6 m wave looked like a strip from the camera's distance.
- **Three.js looking along +z puts +x on the left**: the wave is drawn mirrored (X = -x) so it peels to the right.

### 110. Santa's Round (`games/santa/`): his idea 31, flying, sneaking and delivering (sideways, two thumbs, 3D)
- **Two worlds, one scene**: the village and the room (built far away, at x = 600) share the 3D scene; the camera jumps
  between them on the switch (ui.snap) and the snow is hidden indoors.
- **Every place you must reach is reachable quietly**: rooms are generated and checked (`roomOK`) after each piece of
  furniture and each creaky board, from the fireplace to a side of the tree. Stockings and the fireplace take ACT from 1.5 m,
  so a creaky board in front of one never forces a creak.
- **Robot spots, not points**: the honest robot walks to the nearest quiet cell from which ACT reaches (`spotNear`); aiming at
  the object's own cell stopped it 0.35 m short (outside the ACT range) or sent it into furniture.
- **A deliberate robot mistake must be undoable**: it placed a wrong present, picked it up and placed it again for ever. Holding
  a wrong present, it now swaps it for the right one (a tap on the sack replaces what you hold).
- **A careless robot for a real curve**: ordinary and sloppy robots sometimes rush (run) or walk over creaky boards; noise then
  wakes people and costs a restart. Without that every robot won every level in a third of the night.
- **Blind play cannot finish a house**: leaving is refused until exactly the wished presents are under the tree and every
  stocking is full (77,504 blind games won none).

### 111. Skimming Stones (`games/skim/`): my idea for set 20, the calm one (upright, one thumb, 3D)
- **A fixed first kiss is a free win for a rhythm**: every throw first touched the water 0.5 s after letting go, so "throw,
  wait, tap" on a beat was always perfect and blind cycling passed the first lesson. The throw's upward speed now grows with
  its power (0.5 + 2.5 x power), so the first kiss comes later for a harder throw; the dots show it.
- **The first goals must be out of reach of no taps**: a hard throw with no good taps goes 20-40 m in 3-4 skips, so the
  first goals are 9 skips and 48 m; a miss keeps only 45% of the speed (less for a round stone).
- **Lessons count a run, not a total**: "two good taps" was passed by blind tapping over 90 s; "three good taps in a row on
  one stone" (a miss or a wobble starts the count again) is not.
- **The kiss time is interpolated, and the robot taps a little early and once more late**: frame steps let the real kiss fall
  between frames; the exact moment (`tk`) decides the quality, and a tap just after a kiss with no tap still counts as good.
- **Upright 3D needs a high camera**: from eye height the whole lake squashed into a strip at the horizon; the camera stands
  4 m up looking 18 m out, follows the stone from 3-7 m up, and a portrait view is narrow (about 15 degrees each side at fov
  58), so rings, pads and ducks are kept within a few metres of the middle.
- **The sun in front for warmth, but not straight ahead**: azimuth 0 looks along +z (straight out over the lake); at 12 the
  glare washed the sky white, at 170 it was behind you and the sky went dark. 50 keeps the warm side-light.
- **Robots look before they throw**: the honest robot checks its path for lily pads and ducks (`pathHit`), aims around them or
  waits for a duck to paddle past, as the dots let a person do.

### Settings: Music, Sound effects, Vibration (his rule, 20 Nov 2026; every game from #82 on)
- tools/juice-kit.js keeps SET { mus, sfx, vib, vk }: sound effects go through BUS as before, music through its own MUSB
  (anything played inside music(() => ...)), both silenced by the master mute (the feed's Sound switch); vibe() does
  nothing when vibration is off and scales its pulses by the strength (LOW 0.5, NORMAL 1, STRONG 1.6). Old games are
  unchanged when rebuilt (all on; their music simply counts as sound effects).
- `python3 tools/add_settings.py <id>` adds the ⚙ button (home and pause), the card and its saving to a game made from the
  kit (the kit itself has it). Test it: the card opens from both places, each switch saves (store 'settings') and Done goes
  back where it came from. Put every piece of music in music(): the soundCheck only renders sound effects.

## The feed app (`feed/`, `tools/build_feed.py`, `android/`)
How it is put together is in CLAUDE.md. What was learned building it:
- **The plug goes in at build time, not into the games.** `tools/build_feed.py` writes a copy of each game with `feed/plug.js` at the top of its page. The games in `games/` stay exactly as he approved them, every game gets the same plug, and a better plug reaches all of them at once. The `<meta charset>` line must stay ahead of the plug: browsers only look for it in the first bytes of a page, and without it every "·" and "é" turns to junk.
- **Freeze, don't ask the game to pause.** The plug wraps `requestAnimationFrame`, `setTimeout`/`setInterval`, `performance.now()` and `AudioContext` before the game's own code runs. On pause nothing is called, the clock stands still and sound is suspended; on resume the clock carries on from the same instant, so no game sees a jump. It also swallows `visibilitychange` so a game's own "tab hidden" pause screen does not pile up on the feed's. This only works for games that keep to rule 7. Proof it is invisible to a game: a bot drove a whole Hippodrome race inside the feed while it was frozen 16 times and still finished first, with the game's clock showing 40 s after 78 s on the wall; High Noon frozen for 6 s in the middle of the count did not call DRAW until it was let go.
- **Feed and games only talk by message.** In the phone app every page is a local file, and local files are strangers to each other: the feed cannot reach into a game, cannot `fetch` anything (so the game list is `games.js`, a script, not `games.json`), and a tap on the feed does not count as a tap inside the game. So: `postMessage` both ways (`{gf:1, cmd}` down, `{gf:1, ev}` up), vibration through `GameNative.vibrate` (the browser's own is refused inside the game's frame), and the wrapper allows sound without a tap. `tools/test_feed.py` runs the feed from `file://` to catch anything that only breaks there.
- **A tap on a card drops him straight into the action** (asked for on 14 Nov 2026: "you show me the most exciting part of the game, but me tapping there, I should be entering a game"; offered three ways, he picked "straight into the action": no countdown, no intro, playing within a second, at his own level). The plug calls the game's `window.gameFeedStart('mini')`; if a game has none it presses `feed.start` instead. What each game skips: Bottle Cap Flick the mode and formation screens (computer opponent, standard formation, his flick first); Knockout the "LEVEL n" wait before the bell; Steel & Honour the wait before "EN GARDE!"; Zenith the first alert card (he is flying at once; later missions in the patrol keep their cards); Hippodrome the trumpet count (two quick notes and "GO!" in 0.6 s); High Noon nothing, its Play already puts his thumb on the holster. Starts made from inside a game (next level, try again) are unchanged.
- **An instant start must not change who wins.** Skipping a wait is free; skipping a start that is part of the contest is not. Hippodrome's first instant start was a rolling start (every team already moving): bots that win every top race with the counted start won half of them or fewer, because the crack on "GO!" and the lead into the first turn decide those races. The fix keeps the race's own start and only shortens the wait, with the notes a third of a second apart so "GO!" can still be timed by ear, and it forgives a thumb that lands before "GO!" (the tap that opened the card is still in the air). Bots then finish the same with either start.
- **When two bot runs are compared, check they differ in one thing only.** The first comparisons here were wrong for an hour: a filler word on the command line had switched help on for one side.
- **A card is a clip of real play, not a menu** (P27). `tools/previews.py` films the real game in a phone-sized browser with real touches and saves a 3 s silent clip plus a still. A clip of someone doing nothing is dull, so each game has `games/<id>/preview.json`: scripted touches, `anchor` (JavaScript that turns true at the moment worth filming, e.g. High Noon's DRAW), `to_js`/`follow` to aim a finger at something the game exposes through `__sim`, `js` to set a scene up, and `seed` to make the game's "random" numbers the same every time. Look at `out/previews/<id>.jpg` after filming.
- **Every clip is the most exciting moment of its game, and they all keep the same rules** (his words, 14 Nov 2026: "for every game, we take the most exciting part of the game... it needs to be consistent, it needs to be good. Don't make it messy"; Hippodrome's ramming clip was the one he pointed to as right). The rules: the game's biggest moment, in the middle of play; no menu, intro banner ("FIGHT!", "EN GARDE!") or toast in shot; the big moment lands about half-way through; 3 to 3.6 seconds; over before any result screen appears; real touches do the deed. What each card shows: Bottle Cap Flick a break shot that sends two caps off the stool; Knockout jab, cross, uppercut and the knockout under the camera flashes; High Noon the call, the draw and the headshot; Steel & Honour a perfect parry, the riposte and his sword flying; Zenith the giant monster's slam dodged, its core opening and the laser finishing it; Hippodrome a wheel strike and a ram at speed; Bandit the ring turning red on a smoking bandit, the missile away, and him coming apart inside the ring as you fly through the smoke. How to get such a moment on film without luck: **stage the scene, then play it for real.** Set the state up out of shot (opponent nearly beaten, monster already wounded, his next attack due at a known time; for a take that must land, his chance to slip or block set to nothing), start filming after the intro text has gone, and let real touches do the rest. A plain `seed` is not enough for a real-time game: the same seed gives different luck when frames fall differently, so two takes of Knockout went wrong before the staging did. Timing a touch to the game: `anchor` on the game's own state (Steel & Honour: "his blade is 0.3 s from landing"), then `js` to work the stroke out and `to_js` to draw it. For a planned shot in a turn-based game let the game's own planner choose (Bottle Cap's `__sim.shot()` searches every candidate flick with the real physics and returns screen points for the thumb). Plan before filming: `python3 tools/previews.py <id> --trace "<JavaScript>"` plays the script without filming and prints what that JavaScript returns against the clip's clock, so it is plain when the game says what and when a result screen would cut in.
- **Swiping cannot happen on top of a running game** (the game owns every touch), so: the card (before play) and the "Paused" screen take swipes anywhere; during play the swipe lives on the bar under the game. A drag on the bar freezes the game at once, so peeking at the next card never costs him the game he is in. Mid-game the bar's buttons sleep: the first tap only wakes them, because a stray thumb in a two-thumb game must not open the games list.
- **Coming back to a fast game needs a breath.** "Resume" on a two-thumb or intense game counts 3, 2, 1 over the frozen picture so he can set his thumbs (P25); calm games carry on at once.
- **The same three controls on the feed's Paused card as in every game: Resume, Restart, Levels** (rule 11). **Restart** throws the game's page away, loads a fresh one and goes straight into play at his saved level (never back to the card: he asked to restart the match, not to look at the clip). **Levels** sends `{cmd:'levels'}`: the plug calls the game's `window.gameFeedLevels()` while the game is still frozen and only then lets its clock run, so the game's own list is up before a single frame of play can slip by. The button only shows for games that have `gameFeedLevels` (`levels` in `games.js`, worked out by the build from the game's page). **And a Pause button on the bar, in the same place for every game** (only while a game is running; like the other bar buttons the first tap only wakes it). So there are two ways to the same three controls, and neither depends on where a game happens to put its own pause button. One thing to know about Restart: the fresh page is one nobody has touched yet, and a browser refuses a buzz from an untouched page (it says so on the console). The phone app is not affected, because there buzzes go through `GameNative`; `tools/test_feed.py` ignores that one notice, which otherwise fails the run only now and then (when a game happens to buzz in its first second), the worst kind of failure to chase.
- **Fonts travel with the app.** A page that waits on Google Fonts stalls on a weak signal. `tools/fonts.py` pulls the same fonts from npm (`@fontsource/*`) into `feed/fonts/`, and the build points each game at them. `tools/check.py` fails if a game uses a font that is not there or has no card picture, so neither can be forgotten.
- **If a game's page will not open as a page**, the feed fetches it and hands it over as text (`srcdoc`) and remembers to do that for the rest of the session. This is a safety net for hosts that refuse inner pages; it is tested by blocking the page on purpose.
- **Each card's title is set in the game's own title font** (`feed.font`), and the game's number is on the card, so a thousand cards do not blur into one (P30). The feed's own controls stay plain so the games carry the colour.
- **One sound switch for the whole app** (his rule: "when I off the sound, I'm offing the sound for all the games... I don't want to hear them"). The Sound button on the bar is remembered (`gf.sound`) and sent to every game (`{cmd:'sound', on}` when the game loads, again with `start`, and on every change). The plug puts a volume knob between each game's `AudioContext` and the speaker by making `ctx.destination` hand back that knob, so it silences any game without the game knowing; it mutes `<audio>` and `<video>` too. A game's own sound button still works underneath while the app's sound is on. This only holds for games that send all their sound to `ctx.destination` of an `AudioContext` (rule 7). `tools/test_feed.py` plays a test tone the way a game would and listens after the knob: silence is measured, not assumed.
- **No feed sounds.** The games own the sound; the feed only gives a tiny buzz when a card snaps into place.
- **When a game leaves the feed, take its id out of everything the feed remembers.** The list, the deck, the new-game queue and the pins were cleaned, but not the short memory of his last few games (`recent`), and `nextGame()` looks those up: with the wrong last three games it stopped with an error (found by `tools/test_sync.py` only one run in several, because the order is shuffled; the test now puts the retired game in that memory on purpose). Any list of ids added later needs the same line in `addGames()`, and anything that looks a game up by id must cope with it being gone.
- **Hide things by a distance that does not depend on their own size.** The note at the top was hidden by sliding it up 140% of its own height: empty (before the first note of a session) it is only 20px tall, so 6px of a white pill showed at the top of the screen on every start. It now slides up by its height plus a fixed distance, and `tools/test_feed.py` measures that it is off the screen.
- **A check that times something must be fair on a slow shared machine, or it will stop a new game reaching his phone.** GitHub's run for build 22 failed on "playing within a second of the tap": that machine had every game about half a second late (restart-to-play 0.5 to 0.75 s where 0.1 is normal), and Hippodrome, whose race keeps its own short count (about 0.7 s, part of the contest), took 1.33 s. Nothing is published when a check fails, so a slow machine would have held a game back with nobody the wiser. Now `tools/test_feed.py` holds to one second on the computer the work is done on (run it before every push), and on GitHub (`CI` is set there) allows two seconds and takes the best of three looks; that still catches a menu, a countdown or an intro coming back. It prints both sets of timings, so a slow run can be told from a real change. **After every push, look at GitHub's run; if it failed, read which check and why before anything else** (`gh run view <id>`, then the job's log through `gh api repos/Nabeel1305/game-feed/actions/jobs/<job id>/logs`).
- **The Games list must stay tidy at every phone width (360 to 430 wide), whatever the names are.** Adding the Save column took 52px from every row, and at once names were cut ("Steel & Hon...") and the small print broke in the middle of a piece ("PLAYED 1" / "TIME"). Now: a name is never cut (a long one takes a second line); the small print (New, kind, thumbs, times played) is made of whole pieces, and a piece that does not fit drops to the next line as a whole, with no dot left at the start or end of a line; labels in the Save column stay on one line. Both tests measure this (`tools/test_sync.py` at 360 and 390 wide with the Save column). When anything is added to a row, look at it at 360 wide with real play counts before calling it done.
- **Things the hosted page forbids** (so the feed avoids them): links with `#key=value` (only a plain `#name`; `#<game id>` opens the feed on that game), remote images, and `viewport-fit=cover` without safe-area padding.
- **The first game that was not a core game broke two tests, not the app** (Bandit, 15 Nov 2026). Both tests had quietly assumed every game on the app was inside it: `tools/test_feed.py` opened "the last game" from files the way the app's own copy does (the last game was now one the app has to fetch), and `tools/test_sync.py` built its whole pretend world from "the games on the app" and called them all core. Now the first picks the last core game, and the second starts its made-up scenarios from the core games alone and has a part of its own for the games really on the app that are not core games: each is fetched by the phone app's real updater exactly as published, played inside the feed from the phone's own files, frozen, and saved. **Never write a test around "the last game" or "all the games": say which kind of game it needs.**
- **Filming a two-thumb game: say which finger left.** `tools/previews.py` lifted a finger, when another was still down, by sending a move that left it out. The browser lifts nothing on that: Bandit's FIRE thumb was never let go and the cannon ran for the rest of the clip. A finger leaving while another stays is an end that names the finger leaving (found with `--trace` printing the game's own idea of the thumbs). No earlier clip has two fingers down at once, so none was affected.
- **Filming a heavy game: `"slow": 2` in its `preview.json`** films it at half speed and plays the clip back at full speed, so a machine with no graphics chip still gets its 24 different frames a second (the tool slows the game's clock; every time in the file still means the game's own seconds). Check a new clip against the others: `ffmpeg -i clip.webm -vf mpdecimate -f null -` should count about 80 different frames in 3.4 seconds.
- **A game goes on the app only on his word** (15 Nov 2026: "I want to be able to describe a new game to you. And obviously, you're not gonna put the game on the app until I specifically tell you to. But I want to finish designing [it], and I want to be able to say, hey, put this game on the app now. And without updating it, maybe a restart. That new game can be on the app automatically without it crashing, without anything funny happening"). The first rule here was the opposite (every game in `testing` joined the app by itself), which would have put half-designed games on his phone. Now `tools/build_feed.py` only takes games with `"in_app": true` in `games.json`, and that is set when he says so and at no other time; `tools/test_sync.py` builds a finished, tested, unasked-for game into its second version and checks it is not published. Everything else about a new game is made ready while he play-tests it (feed fields, basic controls, tests), so his word costs one push. What to tell him then: about six minutes for GitHub, then close the app fully and open it (or leave it open: it looks every ten minutes); the game is the next card, marked New; nothing to install.
- **Core games live on the phone; every other game is played over the internet; any game can be saved** (his design, 15 Nov 2026: "the games that we've already made, those are on the app permanently... these first games are going to be the core games. And as we add games, you need internet, of course. You can just play them, and if you really enjoy a game, you can download it. You can save a game. This will be on the games place, that place that you search for games... you can click to save it, and it just downloads that game, so you can play it without internet all the time"). How it is built:
  - **Core** = `"core": true` in `games.json` (the first six). Only core games go inside the APK (`tools/build_feed.py --core`), so the app stays small however many games there are. The phone treats the games inside its APK as core: always there, always kept up to date. A new game is never core unless he says so.
  - **Every other game** is listed on every phone (`games.js`, its small list picture in `pics/`, the fonts: all tiny, always fetched) but its own files (page, card picture, clip) are fetched only when its card comes up: `Sync.fetchGame`, asked for by the feed as soon as the card is the *next* one, so it is usually there before he swipes to it. Until it arrives the card waits with the small picture out of focus and "Getting the game"; a tap in that moment is remembered and the game starts when it lands. A game fetched this way is cleared the next time the app starts (`Sync.prune`), never while the app is open.
  - **Saved** = he tapped Save on its row in the Games list. The game is fetched if need be and its id goes into `kept.txt`; from then on it is treated like a core game (kept, updated, works with no internet). Tapping Saved lets it go again. The row shows Save / Saving / Saved, core games show "On phone", and the card of any non-core game carries a chip saying Online or Saved.
  - **No internet:** the feed knows from the app's last look for new games (`gameFeedUpdate` with `ok: false`) or from a fetch that failed. It then only deals cards for games that are on the phone; the first card of every session is always a game that is on the phone (when the app opens it does not know yet whether there is internet, and the app must open on something that plays at once); a card he has not seen yet for a game that cannot be fetched is swapped for one that can; a game picked by hand from the list shows "This game needs the internet" on its card; when the internet is back (the feed asks the app to look again every 45 seconds, and there is a "Check for new games" button at the bottom of the list) a waiting card fetches its game by itself.
  - **Everything he plays is still a file on the phone, loaded the same way as ever.** The other way to do this (load a game's page straight from GitHub) was not taken: GitHub serves pages as plain text that a browser will not run, and it would have meant a second, unproven way of loading games. Fetching through the updater keeps one way of loading, and every file is still checked against its fingerprint.
  - **The folder is made before the feed is shown** (`Sync.seed`): after an install or an update the feed page and core games are copied out of the APK with no internet, so the feed always runs from the folder and never has to move there later (the one reload that builds 19 and 20 still had is gone). The copy inside the APK is only shown if the folder cannot be made; the feed then offers the core games only. **The feed page is the APK's own from the first moment, whatever the folder holds:** a folder older than the APK takes everything in it; a folder that is as new or newer (the usual case: the phone had already fetched the games published along with the new app before he installed it) keeps its games and takes only the APK's feed page, plus any file of its own that went missing. Without that rule a freshly installed update would have shown the old screen until the app was opened a second time. A file the newer folder does not list is not put back (that game was taken off the app since).
  - **The hosted page** has every game sitting next to it, so none of this shows there: no Save buttons, nothing fetched.
  - **Apps from before this** (builds 19 and 20) fetch every game, as they always did, from the same `app-v2` branch: nothing was changed that they read differently (same file names, same list, new fields only added). Do not change that.
  - **When there are very many games:** the list of files (`manifest.txt`) is read on every look for new games and grows with every game (about a third of a megabyte at 1,000 games). The app already remembers it for 15 minutes so that fetching one game does not read it again; when it gets big, split it (a short list of lists) rather than making phones read it all.
- **New games arrive by themselves; anything app-wide comes as a new download** (his rule, in two parts. First, the hard requirement: "I'm never gonna stop adding games... without me updating anything". Then, 14 Nov 2026, after the first app restarted under him: "what is very important to me is the new games load automatically, but when it comes to app-wide fixes, I think you can just give me another APK"). So the line is drawn like this:
  - **By themselves:** the list of games (`games.js`), the small list pictures, fonts, and every change to a core game or a game he has saved. (A game that is neither is fetched when its card comes up: see above.)
  - **Only with a new APK:** the feed page (`feed/index.html`) and the Android wrapper (`android/`). `Sync.java` copies the feed page out of the APK and never takes it from GitHub (`Sync.SHELL`), so the app he is holding only changes when he installs one. **Whenever the feed page or the wrapper changes: build, check the new `GameFeed.apk` (`python3 tools/check_release.py <build>`), tell him plainly that this one needs installing, and give him the link** (`feed_app.apk`).
  - **The plug (`feed/plug.js`) rides inside every game page, so it does arrive by itself, next to a feed page that may be older.** Only ever add to what the plug and the feed say to each other; never change or remove a message, and never make a game depend on a feed feature that an installed feed page may not have. The same goes for `games.js`: add fields, never rename them.
  - **New games never reload the page.** The app tells the feed (`window.gameFeedUpdate`), the feed reads the new `games.js` and adds the games to what it is showing: the game in his hand carries on, the new game is simply the next card, marked New, and the note about it waits until no game is playing. The app looks for new games when it starts, every time he comes back to it (if the last look was over a minute ago), every ten minutes while it is open, and when he taps "Check for new games" in the list.
- **What went wrong in builds 15 to 18 (the "crash"), so it is never built again.** Those apps took an update by asking the wrapper to load the feed again at `folder/index.html#<card>`. When the feed was already running from that folder, the only thing that changed in the address was the part after `#`, and a browser treats that as a jump inside the page it already has: **nothing was loaded.** The wrapper, still waiting for the "new" page to say it was running, gave up after 12 seconds and loaded the copy inside the APK: the feed restarted under him, mid-session, with older games. Lessons: (1) an address that differs only after `#` is not a load; reload the page, or load a different page; (2) before giving up on a page, ask the page (`evaluateJavascript`) whether it is alive; never throw away a feed that is on screen because a signal did not arrive; (3) the less a running app reloads, the less can go wrong: merge new things into the page instead; (4) on a phone the web engine itself can be shut down for memory, which closes the whole app unless `onRenderProcessGone` is handled: the wrapper now rebuilds the web view and carries on, and only one game is ever kept loaded behind a card; (5) **make the app able to say what happened**: the wrapper writes the last problem to a file and the small line at the bottom of the Games list shows it ("Last problem: ..."), next to "Up to date · Games <rev> · App <version>". When he reports trouble, ask him to read that line out.
- **The first apps cannot be fixed, so they are left in peace.** Builds 15 to 18 read the `app` branch and restart the feed whenever it changes. So `app` is **frozen at build 18 and must never be pushed to or deleted**; everything new is published to **`app-v2`**, which the fixed app reads. An old install keeps working exactly as it is and simply stops getting new games until the new APK is installed over it (same signing key, so progress is kept). If the wrapper ever has to change the way it reads published games again, do the same: a new branch for the new app, the old branch left alone.
- **How fetching works** (`android/.../Sync.java`, plain Java with nothing from Android in it, so `tools/test_sync.py` runs the real thing on any computer against a stand-in server that drops connections, cuts files short and serves wrong, stale or tampered answers):
  - GitHub publishes the built app (`out/app/`) to the `app-v2` branch after the checks pass. The phone app reads `https://raw.githubusercontent.com/Nabeel1305/game-feed/app-v2/manifest.txt`. This needs nothing from Nabeel (no settings to switch on, no public website); the repo is public and that address serves any branch of it.
  - `manifest.txt` is one line per file: `sha256 size path`, under a first line `# Game Feed app. build N rev R`. The updater compares it with the folder on the phone and fetches only what differs, each file under a name that includes its fingerprint (`?v=`) so GitHub's five-minute cache can never hand back the old version, and checks every file against its fingerprint before putting it in place. Games, pictures and fonts go in first; `games.js` last, so the list never names a game that is not on the phone yet. A dropped connection keeps what arrived and finishes next time. Files identical to the ones inside the APK are copied from the APK, not downloaded.
  - **`build` is GitHub's run number and only goes up.** The phone never swaps its copy for a lower build, and uses the fetched folder only when it is complete and not older than the copy inside the APK. `rev` is a fingerprint of the list plus every file: it changes only when something he could see changes, and the feed looks at the new list only when `rev` differs. So the build must stay repeatable: nothing with today's date or a random number may go into `out/app/`.
  - The fetched copy runs from a folder (`file://`), exactly like the copy inside the APK, so saves are shared between the two.
  - The repo has to stay public and the `app-v2` branch has to stay: that address is built into every installed app. If either goes, installed apps simply stop getting new games (they keep working from what they have).
  - **Never break an installed app:** keep the manifest format and the first line's `build N rev R`; keep file names to letters, digits, `. _ - /` (the build fails otherwise); never rename or remove a `GameNative` method, and in the page always check a method exists before calling it.
  - The Android side (`MainActivity`, `Bridge`) is only glue; `tools/check_android_java.py` compile-checks it against stand-in Android classes because the real tools cannot be downloaded in a session.
  - What is on a phone: the feed page (the APK's own), the list, list pictures and fonts, the core games, his saved games (`kept.txt`), and whatever he has played since the app was opened. `Sync.run` keeps the first five equal to what is published; `Sync.fetchGame` brings one game; `Sync.prune` clears played games when the app starts; `Sync.seed` makes the folder from the APK. All of it runs on one thread, one thing after another, for as long as the app is in memory (the thread belongs to the app, not to the screen: if the phone closes the screen and makes it again while a fetch is still running, the new screen's work waits its turn), so two of them can never write at once. Nothing is cleared once the feed is on screen. The page asks through `GameNative.onPhone()`, `fetchGame(id)`, `saveGame(id)`, `forgetGame(id)` and `check()`, and is answered through `window.gameFeedGame({id, why, ok, here, saved})` and `window.gameFeedUpdate(...)`.
- **Proven so far, and not yet:** the signing password was added on 14 Nov 2026 and build 15 was the first signed `GameFeed.apk` (checked from outside: the feed, six games and `manifest.txt` are inside, the updater and its address are compiled in, permissions are internet and vibration only, and its certificate matches `android/signing/release.p12`, SHA-256 `9319...9d96`). The real updater was run from a computer against the real `app` branch and fetched and verified every file. **Not yet proven on a real phone** when this was written: nobody had held the app. First things to check on his phone: clips play on the cards, sound and vibration inside games, the back button, coming back after a phone call, and that the next game added shows up by itself (the small line at the bottom of the Games list says "Up to date", the feed's `rev` and the app version: ask him to read it out if something is off). **The core / internet / saved design (the first build after 20) is proven on a computer only:** the real updater against a stand-in server with every fault, the whole journey in a phone-sized browser, and after publishing the real updater against the real `app-v2` branch. (Build 21, checked from outside on 15 Nov 2026: only the core games inside, same signing key, `app-v2` published with the same set, `app` still build 18. The real updater was run as his phone would be: a folder left by build 20 took 8 files out of the new app and downloaded nothing; a folder that the old app had already brought up to build 21 took only the new feed page; a new phone took all 54 files out of the app with no internet; one game was fetched on its own from GitHub byte for byte. The old app's page was also opened with the new published list and still played. `tools/check_release.py` now does the outside checks in one go.) No phone had run it when this was written, and no game other than the core six existed yet, so fetching a game when its card comes up and Save have never been seen on a phone. When the first new game goes on the app, ask him: did its card come up by itself and play; after Save, does it play in flight mode; does the app open in flight mode on a core game. The line at the bottom of the Games list also says how many games are on the phone and "No internet" when the last look failed. **First word from his phone (15 Nov 2026, build 23, installed fresh):** the bottom of the Games list read "Up to date" and "6 on this phone", so the copy out of the APK at start-up and the first look at GitHub both work on a real phone. He had uninstalled the old app first, which wipes the levels he had reached (they are kept with the app): tell him to install a new APK over the top, never to delete the old one. Still not seen on a phone: a new game arriving, its card being fetched, Save, and play with no internet.

## Phone apps (APK)
Android WebView wrapper in its own GitHub repo (Nabeel creates it and gives the Claude GitHub App access). Gradle, AGP 8.5.2, compileSdk/targetSdk 34, minSdk 26, adaptive vector icon designed per app. GitHub Actions builds on push (the ubuntu runner already has the Android SDK; don't use setup-android) and publishes a Release with the APK. Sign with a fixed key so updates install over old versions: commit an encrypted .p12 and have Nabeel add the `KEYSTORE_PASSWORD` secret himself (secrets can't be set from a Claude session). See Nabeel1305/My-Dhikr for the working setup.

**Game Feed app** (`android/` in this repo, not a repo of its own, because it is built from the games here): the same recipe as My-Dhikr. The `apk` job in `.github/workflows/check.yml` runs only after the checks pass, copies the feed into the app with `tools/build_feed.py --out android/app/src/main/assets`, always does a test build (so a broken app is caught even without the password), and when the `KEYSTORE_PASSWORD` secret is there builds the signed app and publishes a Release with `GameFeed.apk` (`versionCode` = the run number, so each build installs over the last). It asks for the internet permission only to fetch new games from the `app-v2` branch (see "New games arrive by themselves"); with no signal it runs from what is on the phone. The fetched copy lives in `getNoBackupFilesDir()`, so it does not eat the phone-backup allowance that the saves need. `GameNative` gives pages `vibrate(pattern)`, `close()`, `ready(rev)`, `reload(cardId)`, `version()` and `lastProblem()`. Back asks the page first (`window.gameFeedBack()`), and going to the background calls `window.gameFeedHide()` so the game and its sound freeze. A held thumb must not trigger Android's long-press buzz or text selection (`setHapticFeedbackEnabled(false)`, a long-click listener that returns true). The Android build tools cannot be downloaded in a Claude session, so the only compile check is GitHub's: keep the Java close to the working one.
