# 76. Kart Kingdom

## The idea (his words, then mine)
His words (20 Nov 2026): "something like super mario racing, a really fun racing game with turtles, temporary flying, boosts
and what not... numerous race courses... make the graphics amazing, like jaw dropping... this should be like 10 games... polish
it, this one should be perfect."

Mine: a full kart Grand Prix of our own (no Nintendo characters, items or names). Eight karts, ten cartoon drivers (Tobi the
turtle is the mascot, with his shell on his back), sixteen courses in four cups, and the cups come round again faster: 50cc,
100cc, 150cc, MIRROR (every course flipped), 200cc. 3D because the course in front of you is the game: real hills you take off
from, a glider over a chasm, sixteen different worlds with their own weather and light.

## Research (version 2, 20 Nov 2026, after his feedback: "I don't like the controls... make the music more exciting... when I
throw a banana it's supposed to go straight... give at least two buttons... one for boost")
- KartRider Rush+ (widely called the best kart racer on phones): two big arrow buttons for steering on one side, a drift
  button and a nitro button on the other; drifting builds the nitro, and timing it is the skill. (pocketgamer.com,
  nme.com, levelwinner.com, thesixthaxis.com)
- Mario Kart Tour: a tap throws the item ahead, a swipe down throws it behind; its swipe steering is widely called imprecise.
  Wide tracks that are hard to fall off keep races close. (gamerevolution.com, gamezebo.com, butwhytho.net)
- Beach Buggy Racing 2: wider tracks, precise touch controls, many powerups. (androidpolice.com)

## How it plays (version 2: buttons)
- ◀ ▶ (bottom left, big): hold to steer; a thumb can slide from one to the other.
- DRIFT (bottom right, big): hold in a bend with an arrow: a hop, a slide, sparks blue, orange, purple; let go for a boost.
  Steering into the drift tightens it, away widens it. In the air DRIFT does a trick.
- NITRO (above DRIFT): two bars, filled by drifts, tricks, slipstreams and rings; tap when one glows: a big boost.
- ITEM (left of NITRO): tap: thrown far ahead (a banana flies like a slingshot about 40 m down the road and lands where you
  see it, with a ring marking the spot); swipe down: behind. Shells the same.
- Rocket start: hold DRIFT on the second light. Courses in the sky now have low rails; only the glider's chasm can be fallen
  into.
- Music: a real race track per course (drums, pumping bass, chord stabs, arpeggio, a hook with verse and chorus), faster and
  a step higher on the final lap.

## How it played (version 1)
- The kart drives itself. **Left thumb**: put it down anywhere on the left half and slide to steer.
- **Drift**: hold a hard turn at speed; sparks go blue, orange, purple; straighten up for a boost (bigger each colour).
- **Right thumb, tap**: use your item. In the air (off a ramp or over a crest) a tap is a **trick**: land after it for a boost,
  land in the middle of one and you wipe out.
- **Rocket start**: hold the right side as the second light comes on; from the first light you stall.
- **Glider**: the gold ramp opens a glider over a chasm (or a long flight); fly through the three gold rings for a boost.
- **Slipstream**: sit right behind a kart for a moment for a boost. Boost pads, coins (up to 10, each a little top speed).
- Courses with no walls (Lava Castle, Sky Garden, Star Ribbon): fall off and the rescue bee puts you back, a few seconds lost.

## Items (by place: the leader gets defence, the back gets catch-up)
Turtle Shell (straight, bounces off walls), Seeker Shell (chases the kart ahead), 3 Shells (spin round you and block a hit;
tap to fire one at a time), Banana Peel, Turbo Pepper, 3 Peppers, Rainbow Star (fast, untouchable, knocks karts flying), Snow
Flurry (spins everyone ahead), Comet (flies to the leader), Rocket Ride (drives you, fast and untouchable), Bubble (one hit).

## The sixteen courses (each its own world, music and dangers)
| Cup | Courses |
|---|---|
| 🌱 Sprout | Meadow Circuit (sheep), Coconut Beach (crabs, the sea), Windmill Valley (sheep, mud, big hills), Canyon Leap (boulders, a chasm) |
| 🌸 Blossom | Blossom Way (torii, lanterns, a pagoda), Frost Peak (snowballs, ice), Jungle Ruins (mud, a river chasm), Neon City (traffic, night) |
| ⚡ Thunder | Pirate Cove (cannonballs, a sea chasm, ships), Candy Canyon (bouncing gumdrops), Haunted Manor (ghosts), Desert Dunes (twisters, boulders) |
| ⭐ Star | Lava Castle (no walls, lava bursts, a storm), Sky Garden (no walls, floating islands), Moon Base (low gravity, meteors), Star Ribbon (a rainbow road in space) |

## Levels and systems
- Each level is one race (2 laps on levels 1-2, then 3). Finish top 4 (levels 1-4), top 3 (to 12), then top 2. Every tenth
  level is a boss race (faster rivals). Rivals get faster, use items more and better, dodge more; dangers grow in number.
- A race is over as soon as the places you needed are taken (no lonely lap at the back).
- **Cups**: four races; points for every place (15, 12, 10, 8, 7, 6, 5, 4); after the fourth, a gold, silver or bronze
  trophy for the top three. A trophy case for every cup in every class.
- Stars (win; first; 5 big boosts or tricks with no wipeouts or falls), coins, the Pit Shop (Engine, Grippy tyres, Turbo
  charger, Coin magnet), the Garage (10 drivers, 6 karts, opened with stars; each with a little speed or grip of its own),
  ranks from Rookie to Kart King. Help after three losses.

## Spamming cannot win (LESSONS rule 1)
- Blind moves (BLIND in part2): `s` steer some way and hold it, `t` tap the right side, `h` hold it, `r` let go.
- Blind steering runs into walls and off the edges; blind tricks land mid-trick (wipeout); blind holding at the start stalls.
- Measured (test_play.py): blind strings 0 of 13,056 races; random moves 0 of 480. People who look: ordinary 1.0 on
  levels 1-5, 0.6 at 20 and 40; sloppy 1.0 on levels 1-3; sharp 0.6 at 40, 0.3 at 80.

## Lessons
1. STEER AND DRIFT: two drift boosts. 2. JUMP AND TRICK: two clean tricks off ramps (a tap on the ground resets).
3. TURTLE SHELLS: three shells; line up behind slow karts; two hits (seven misses in a row reset).
Skip tutorial on every lesson; Tutorial on the home card and in the pause menu.

## Engagement factors chosen (PLAYBOOK)
P18 combos in a run (drift colours, tricks in one jump, rings in one flight), P7 hit-stop and P8 shake on hits and landings,
P15 nested goals (race, cup, trophy case, class), P26 variety with rhythm (sixteen worlds, a new danger each), P30 the
signature: gliding through gold rings over a chasm.

## Longevity (PLAYBOOK H)
- L1: a race; slide to steer; the place you need is on screen.
- L2: one floating thumb to steer, one tap; the kart answers at once; sparks, flames, shakes.
- L3: every loss is shown: the hits, the falls, the wipeouts, the place you finished.
- L4: your place (big), the lap, the place you need; the cup standings after each race.
- L5: best time on every course; stars; the trophy case.
- L6: sixteen courses, eleven items, twelve dangers, five classes, a mirror cup.
- L7: drift now or hold for purple; use the shell now or keep it to block; take the ramp line or the coin line.
- L8: Try again at once; a race is about a minute and a half.
- L9: your driver, your kart, your upgrades, your trophies.
- L10: your best time on every course.

## Sound (S1-S11)
An engine that climbs with your speed and roars when you rev at the start; drift squeal, spark crackles that rise with the
colour, boosts with a chord; a boing off a ramp, rising whooshes for tricks, a chord on landing; chimes through rings; coins up
the scale; the roulette's tick-tick-ding; a sound for every item; a bee's buzz; start beeps; lap bells; and a tune for every
course (its own key, bass line and melody; spooky ones for the night courses), faster and higher on the final lap.

## The card clip: its most exciting moment
The glider over the chasm through the gold rings (Pirate Cove or Star Ribbon). Not on the app until he says so.
