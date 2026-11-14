# Lessons and build notes

Everything learned building the first games. Every new game must follow the **rules**; reuse the **build notes** when a new game is similar to an old one (read that game's `index.html` in `games/<id>/`).

## Nabeel's taste
- **Clean screens.** Home = title + 2-3 big buttons (Play / Choose level / Rules). Rules on their own screen. No clutter, no pop-up text for things the game handles silently.
- **Looks:** appropriate and polished, not hyper-real. Real-looking objects (a proper revolver, proper buildings). Scenery drawn past the screen edges so camera moves never show a blank corner.
- **Win and lose moments:** winning must feel as good as losing feels bad (a sound and a visual for each). Keep each under ~2 seconds and let a tap skip to the next round.
- **Engaging and challenging**, with no easy way to win.
- **Every sound must be satisfying.** Crisp, layered, pitch-varied, never harsh or nagging, pleasant on the 50th play. Full rules and code in `PLAYBOOK.md` (Satisfying Sounds).
- **Design principles** (flow, juice, calm, dark patterns to avoid) are in `PLAYBOOK.md`. Apply only the ones that suit each game.

## Rules for every game
0. **Early levels are for learning, tuned for real people.** Bots react perfectly; people don't. Make levels 1-5 clearly easy (slower, bigger targets/windows, softer hits, hints), then ramp.
1. **No easy way to win.** The obvious repeated move (spam taps, fast sloppy shots) must lose past the first few levels; skilled play must win. Prove it with simulated players before showing him.
2. **No stalling or hiding loopholes.** Every game always moves toward an ending.
3. **Difficulty:** very easy at level 1, harder every level, never stops rising (steady to ~60, then `f = 60 + 15*log1p((L-60)/15)` forever), but always a chance to win: cap reaction windows at what a quick human can manage (~0.25-0.43 s), cap block/dodge chances, add some luck.
4. **Levels:** win to unlock the next; choose any unlocked level from a grid with stars; boss every 10th level; progress saved in localStorage under the game's own `storage_prefix` (see games.json).
5. **Longer and deeper as levels rise:** rounds (best of 3/5), points decisions when nobody is knocked out, more health on both sides.
6. **Controls:** two-thumb friendly; must work anywhere on the screen including the edges; never let the finger cover the target (offset crosshair); tap-to-select then drag-from-anywhere when a control could sit near an edge.
7. **Feed-ready:** each game needs a mini mode that starts instantly (no menus) and the full mode; keep the bottom edge free for the feed's swipe-up handle.
8. Keep call-out text clear of scenery text. Never show fake data.
9. **Character variety:** never a short fixed list of opponents. Build names and looks by combining long lists (titles, first names, epithets, places, and many independent accessory/colour choices), seeded by level, so opponents rarely repeat. (Nabeel noticed the earlier games' small name lists.)
10. Test on a 390x844 phone screen and look at a screenshot of every screen before sending.

## How to test (fast)
- Best pattern (from Steel & Honour): add a `window.__sim` hook to the game itself (start headless + muted, step(dt), act(...)) and run bots inside the page with one `page.evaluate`, so hundreds of bouts take seconds.
- Make a test copy of the page that exposes hooks (`window.__G`, geometry helpers, `__lvl(n)`), and drive it with Playwright.
- **Run cheat tests in fast-forward:** call the game's update loop directly (many steps, no drawing) rather than real time. Real-time testing of High Noon took ~10 minutes per run.
- Bots, at several levels (e.g. 1, 5, 15, 40, 80): a **spammer** (obvious repeated move), a **smart** player (~250 ms reactions, small aim error) and, for timing games, a **jumpy** player. Spammer must lose past the early levels; smart must win early and keep a chance at the top.
- `python3 tools/check.py` loads every game and fails on any JavaScript error. GitHub runs it on every push.

## Build notes per game

### 1. Bottle Cap Flick (`games/bottle-cap-flick/`)
- Built from `src/engine.js` (physics, rules, computer player; no DOM) + `src/game.tpl.html` via `src/build.py`. `src/train.js` runs self-play matches in Node (`node train.js ladder 20`, `node train.js speed`).
- Board in fixed units 600x1000 scaled to fit; caps radius 24. Physics at a fixed 1/120 s step: linear friction (decel 950 units/s^2), equal-mass elastic collisions (restitution 0.9) with overlap push-apart. Deterministic, so the computer can simulate shots exactly.
- Rules: off a long side = dead. Completely past either end line = can't fall off (clamped, 0.3 bounce: players' legs). At rest: an enemy cap past your line becomes yours if you have dead caps, else it's removed; your own cap fully behind your own line is silently moved back onto the line (anti-hiding).
- Controls: tap a cap to select it (white ring), drag from anywhere; pull vector = finger minus drag start; full power at 170 units, max speed 1700. Setup: drag caps in your half; Shuffle / Rows / Ready.
- Computer: candidate shots = ghost-ball aims that push each enemy cap toward the nearest side edge or toward its own line, plus direct lines, at 4 powers, plus random shots; each simulated to rest and scored (cap counts x12/x10, danger near edges/lines). Levels differ by shots considered, aim noise, careless-shot chance; Legendary looks one move ahead (top 8 x opponent's best of 120 replies). Planner is a generator run in 12 ms slices so the screen never freezes. Each level beats the one below 85-100% in self-play; scoring weights made no difference, search and accuracy did.
- Look: wooden stool with grain on an offscreen canvas, chalk lines, knees past each end, crimped caps (21-tooth star), orange vs red (no real brand logos). Series best of 1/3/5/7, loser starts the next game.

### 2. Knockout (`games/knockout/`)
- Opponent drawn with canvas shapes (gradient torso, head with hurt/angry faces, gloves with cuffs); your red gloves at the bottom corners. Seeded names/looks per level; gold-gloved boss every 10th.
- Input per pointer: tap (<22 px, <350 ms) = punch with that side of the screen, head or body by height; quick horizontal flick (>36 px, <380 ms) = dodge; quick flick up = uppercut; two still fingers >110 ms = block; slow drag (>200 ms) = step.
- Enemy states: idle / windup / strike / recover / hurt / block / cover / slip. Telegraph: glowing glove (white jab, orange hook from a side, red uppercut). Dodge away from a hook; uppercuts break blocks; hitting him while he recovers from a miss is a COUNTER (x1.6).
- Anti-spam: stamina (jab 11, cross 17, uppercut 30; regen 16/s, 34/s after 0.6 s idle). 4+ punches in 1.6 s multiplies his slip chance; a slip leaves you off balance 0.28 s and he fires a fast punish counter (x1.2-1.9) your punches can't interrupt. After 2-3 hits in a row he covers then fires back. Below 25 stamina he presses with combos for x1.35 and your block stops only about half.
- Curve: windup 265 + 640*e^(-f/22) ms; gap 430 + 1400*e^(-f/25) ms; block up to 0.68; slip up to 0.48; combos from level 3; feints from 10. Rounds: 1 x 60 s for levels 1-4, then 3 rounds of 45-90 s; 25% heal between rounds; he tires late in a round. No knockout -> rounds won, then damage. 3.5% lucky shots do triple damage.
- Tests: spam loses from level 2; a sharp player wins up to ~90.

### 3. High Noon (`games/high-noon/`)
- Real perspective: `P(X, Y, z)` projects metres to screen (focal length 0.62 x height, eye 1.7 m, street half-width 4.4 m). A `TOWN` list of buildings per side drawn far to near: end wall, roof, false front with stepped top, clapboard, windows, doors, batwing doors, bank pilasters and bars, signs (text via an affine transform onto the facade), boardwalk, posts, porch roof, barrels, hitching rail; distance haze. Sky/ground drawn far past the screen; the town continues past the edges.
- Duel: thumb on the holster -> ONE / TWO / THREE + random pause -> DRAW!. Fake calls from level 5 ("DRAT!", "DRINK!", "DROP!"...). Moving/lifting early = jumped the gun = free shot for him (levels 1-2 just restart the count).
- Shooting: drag up from the holster; crosshair min(90 px, 10% of height) above the thumb; release fires; 6 bullets, 0.33 s recock; aim wobbles when wounded. Headshot wins the round. Body: 2-4 hits by level (+1 boss), grazes from level 6, and from level 6 a body hit makes him fire back within 0.22-0.42 s.
- Outlaw curve: draw time 0.43 + 1.05*e^(-f/10) s; accuracy up to 0.86; sway; sidesteps from level 7; farther away as levels rise; first to 1/2/3 rounds.
- Feel: revolver drawn piece by piece (tapered barrel, fluted cylinder, hammer, brass guard, walnut grip, leather glove, cuff) with recoil, flash, smoke. Losing ~1 s (slight tip, partial grey, one heartbeat). Winning: hat flies, golden flash, twangy guitar via Karplus-Strong plucked-string synthesis. Auto-continue after ~2 s or tap to skip after 250 ms. Losing the duel shows a tombstone.
- Tests: jumpy thumbs lose from level 3; sloppy body shots win early, lose from ~14; a sharp player wins up to ~70.

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

### Shared building blocks
Seeded `rng(seed)` (mulberry32); `store.get/set` around localStorage with try/catch; synthesized sounds (filtered noise for hits/shots, tones for bells/calls, plucked strings for music); a vibration helper that prefers `window.GameNative.vibrate` (phone app) over `navigator.vibrate`; level grid; full-screen overlay CSS for home / rules / levels / round break / end; pause when the tab is hidden.

## Phone apps (APK)
Android WebView wrapper in its own GitHub repo (Nabeel creates it and gives the Claude GitHub App access). Gradle, AGP 8.5.2, compileSdk/targetSdk 34, minSdk 26, adaptive vector icon designed per app. GitHub Actions builds on push (the ubuntu runner already has the Android SDK; don't use setup-android) and publishes a Release with the APK. Sign with a fixed key so updates install over old versions: commit an encrypted .p12 and have Nabeel add the `KEYSTORE_PASSWORD` secret himself (secrets can't be set from a Claude session). See Nabeel1305/My-Dhikr for the working setup.
