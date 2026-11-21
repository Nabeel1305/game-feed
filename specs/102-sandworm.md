# 102. Sandworm Rider (his idea 25, 21 Nov 2026)

## The idea (his words, then mine)
His: ride a gigantic sandworm through a vast desert, inspired by the scale and excitement of Dune, but with an original creature,
world and look. Steer the worm, keep your balance, read the dunes and the hazards, on harder and harder routes.
Mine: you stand on the head of a worm the size of a train that swims just under the sand. Pairs of tall waystones mark the way;
pass between every pair to the end of the route before sunset. Intensity 4, two thumbs, played sideways.

**3D:** yes. The game is the desert in front of you: the dunes rising and falling, canyon walls, ruins, a dust storm coming
across, and the worm's long body curving behind you. His direction asks for it too.

## How it plays (two thumbs, sideways)
- **Left thumb: a floating stick** wherever it lands. Drag left or right to turn. The worm is heavy: its head swings round
  late and keeps turning a little after you let go (his "wide, powerful curves... enough responsiveness to judge and correct").
- **Right thumb: hold SURGE** to speed up; let go and it eases back to cruising. **Hold BRACE** (the button above it) to
  crouch and grip: you turn slower and lose a little speed, but knocks and landings hardly shake you.
- **Balance** (the ring round your rider, and the rider leaning on the worm): a turn that is too sharp for your speed pulls you
  sideways and drains it; rocks, canyon walls, cracked sand and hard landings knock it. Ride smoothly (or brace) and it comes
  back. Under a third it flashes red, the rider wobbles and a warning sounds ("HOLD ON!"); empty, you fall.
- **A fall** puts you back at the last waystone after a second and a half. Three falls, or sunset (the sun bar), and the ride
  is over.
- **Breaching:** climb the face of a dune fast and the worm's head flies out of the sand over the crest and comes down with a
  crash: player-made through speed and the angle you take the dune (straight up the face, at speed). It is the thrill, and a
  risk: land braced or it knocks you hard.
- **Shortcuts:** across the inside of some bends, a straighter way marked by a line of small flags, with rocks and cracked sand
  on it. Quicker, rougher. A long time on a shortcut earns a bonus.
- **Free roam** (the second home button): no sunset, no falls counted, the route goes on for ever; just ride.
- **Each level's challenge** (optional, shown on the home card and the end card): breach N times, take a shortcut, no falls,
  or arrive with balance never under a half. Coins for it.

## Places, worms and hazards (taught one at a time, then combined)
- Levels 1-3 **open dunes** (morning): wide, gentle; level 2 adds rocks and bigger dunes; 3 adds shortcuts.
- Levels 4-7 **red canyons** (noon): narrow legs with rock walls on both sides (the only place with walls: in the open you
  can go anywhere, so you have to steer for the stones); 5 adds cracked sand (a ring of dark cracks and two warning poles:
  ride on and the ridge collapses under you); 6 adds **sandstorms** on some legs (a brown wall of dust you can see coming,
  "STORM AHEAD"; inside, gusts push your head about, you see less, and your balance slowly drains unless you brace).
- Levels 8-12 **the buried city** (golden light): broken columns and arches stick out of the sand (they are the rocks here).
- 13-18 **storm sea** (overcast), 19+ **the deep desert** (sunset).
- **Worms:** a young worm (1-6: tight turns, 28 m/s top), a great worm (7-14: wider, faster) and an elder worm (15+: long,
  heavy, 37 m/s top, turns late).
- Harder for ever: more legs, narrower gates, more rocks, more cracks, tighter sunset. Never more turn speed than a thumb can
  manage.
- Every obstacle section keeps a way through (his direction): rocks are only placed where there is a gap of at least 16 m
  beside them, never in canyons, never by a waystone; if the worm is ever wedged it dives under and comes up past (never stuck).

## Levels: very easy first, then harder for ever (LESSONS rule 0)
`makeCfg`: legs 3 -> 9, gate width 70 -> 30 m, rocks 0 -> 14 per three legs, cracks from 5, storms from 6, sunset 2.4x -> 1.45x
par. Help after three losses: wider gates, gentler knocks, more time.

## Spamming cannot win (LESSONS rule 1)
- Blind moves (BLIND in part2): `m` the stick anywhere, `c` let go of the stick, `s` hold surge a while, `b` hold brace a while,
  `h` hard over flat out.
- Why they lose: the waystones need steering (you start a little off line and every waystone turns the way, by 25-60 degrees,
  either side). Open dunes have no walls to bounce you along, so a worm left to itself rides off into the desert until sunset.
  Hard turns at speed throw you off; holding brace all the time is too slow for sunset.
- Proved: every string of up to two blind moves on four beats and four levels: 0 wins in 640; random moves: 0 in 120.

## Lessons of the first three levels
1. **STEER:** pass between three pairs of waystones (the worm is heavy: start the turn early).
2. **SURGE AND BREACH:** hold SURGE, breach twice over a dune crest.
3. **BRACE:** three braced knocks or landings (cracked sand is laid on the route for it); an unbraced one starts the count again.
Nothing is lost while learning (knocks are capped, no falls counted, no sunset).

## Research (I cannot play other games; I read about them)
- **Death Worm** (Pocket Gamer, VideoGamer, Android Central): the classic phone worm game; praised for immediacy and
  well-made controls, faulted for a lack of variety that makes it fizzle out
  (https://www.pocketgamer.com/death-worm/review-2020/ , https://www.pocketgamer.com/death-worm/review/). So: lots of variety
  (five places, three worms, canyons, cracks, storms, shortcuts, challenges, free roam) on top of a control that feels good in
  ten seconds.
- **Super Mega Worm** (Pocket Gamer): steered with a slider for direction and tightness of the turn; tilt was offered but not
  practical (https://www.pocketgamer.com/super-mega-worm/review/). So: an analogue stick (how far you drag is how tight the
  turn), no tilt.
- **Effing Worms 2** (Jay is Games): steer and speed up or slow down; gravity takes over above the sand, and building momentum
  is what keeps you up longer (https://images.jayisgames.com/review/effing-worms-2.php). So: the breach comes from speed and
  the angle you take a dune, and SURGE is the momentum.
- **Alto's Odyssey** (148Apps, GSMArena, App Store reviews): sand-dune riding on one touch; players liked that deaths felt
  their own fault rather than unlucky, and that there is a calm Zen mode
  (https://148apps.com/reviews/altos-odyssey-review , https://www.gsmarena.com/altos_odyssey_review-news-29944.php). So: every
  hazard is visible early with a warning, every knock says what it was, and Free roam is our Zen mode.
- **Dune: Awakening** coverage (GamesRadar): its makers say riding a worm must feel like an epic moment and the worm must never
  be a mere taxi (https://www.gamesradar.com/games/mmo/dune-awakening-dev-says-when-we-do-bring-stuff-like-sandworm-riding-into-the-game-itll-feel-like-an-epic-moment-like-in-the-movies-but-you-cant-trivialize-the-sandworm-because-that-breaks-dune).
  So: the camera sits behind and above to show the worm's size, the body ripples the sand behind you, the breach is a big
  slow moment, and the worm fights you in hard turns.

## His directions, point by point
- View and environment: 3D desert, dunes, canyons (walls), buried ruins (place 3), sandstorms; camera behind and above. Kept.
- Controls: left stick steers, hold right SURGE, BRACE button. Kept exactly.
- Movement: heavy, late-answering head that keeps swinging; correctable. Kept (turn rate eases towards the stick).
- Riding and balance: the rider leans with the turn; sharp turns drain balance, easing or bracing restores it; a clear warning
  (ring flashes red, "HOLD ON!", a creak sound) before a fall. Kept.
- Basic round: waystones to a destination; open dunes first, narrow canyons and hazards later. Kept.
- Satisfying action: surge up dunes, plunge down, breach; made by speed and approach angle. Kept.
- Interesting choices: winding way vs rough shortcuts; smooth riding keeps balance and speed (stars and coins reward time and
  no falls). Kept.
- Hazards: rocks, collapsing ridges, storms, each with a warning you can see; a way through always. Kept.
- Progression: three worms with different handling, harder terrain, longer routes; each taught alone first. Kept.
- Sound and music: deep rumble under everything, rushing sand that rises with speed, wind, music that builds with speed. Kept.
- Vibration: pulses on breaches and landings, a light tick while straining a turn; strength in Settings. Kept.
- Failure: back at the last waystone in 1.6 s. Kept.
- Replay: timed routes (par, stars), a challenge on every level, Free roam. Kept.

## Engagement factors chosen (PLAYBOOK)
P4 fair, readable failure (every knock says what it was; hazards warned early), P6 every input answers back (the head swings,
the rider leans, sand sprays, the sound rises with speed), P12 celebrations scaled (a breach whoosh; a big one gets BIG AIR),
P15 nested goals (the next waystone, the route, the level's challenge, the next worm). Sound rules S1-S11.
Longevity L1-L10: steering works in the first second; stick plus two held buttons; knocks and balance are fair and visible;
the next pair of stones is always on screen with an arrow; time, par and best on every card; three worms and five places that
change the line you take; safe way or shortcut; Restart in a tap, back at the waystone in 1.6 s; worm skins by stars and the
rider's gear (saddle, hooks, reins) bought with coins; best per level.

## The card clip: its most exciting moment
A breach: the worm's head bursting out over a dune crest in a fountain of sand, hanging in the air, and crashing down.
