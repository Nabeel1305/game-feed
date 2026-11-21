# 98. Gridiron

## The idea (his words, then mine)
His idea 15 (20 Nov 2026): "play American football through short, exciting matches built around choosing plays and executing
them", with his directions (specs/his-list-2026-11-20.md). Mine: five-a-side arcade football, the phone held sideways, built on
Hoops 3v3's frame (the same sideways stage, floating stick and three buttons). Each drive is a few plays: pick a card, SNAP,
then play it out yourself; on their drives you defend. A match is one drive each (level: up to two overtime pairs, then whoever gained more yards).

**3D:** yes. The field in front of the attacking team is the game: you see the routes, the gaps and the yellow line ahead.
Practice field at golden hour first, then a high school stadium at dusk, a college bowl and a pro stadium at night with a crowd.

## How it plays (one screen, two thumbs)
- **Before the snap:** play cards along the bottom (Dive, Sweep, Slants, Go deep, Curls), the routes drawn on the grass,
  SNAP on the right. The camera is pulled back to show the formation.
- **Quarterback:** the stick moves you in the pocket; a coloured button floats over each receiver, green when he is open,
  yellow when tight, red when covered. Tap it to throw (the ball is led to where he is going). A rusher on you spoils the throw.
- **Run plays:** HANDOFF gives the ball to the back and you become him.
- **With the ball:** the stick runs (up the screen is down the field), DODGE (a short hop past a tackle), JUKE, SPRINT held.
- **Defence:** SWITCH takes the player nearest the ball, TACKLE close to the carrier brings him down; a dive at nothing leaves
  you on the ground for almost a second.
- **Rules through play:** downs and distance on the scoreboard, a blue line of scrimmage and a yellow first-down line on the
  grass, FIRST DOWN!, TURNOVER ON DOWNS, a touchdown is seven.

## Research (I cannot play other games; I read about them)
- **Retro Bowl** (Pocket Gamer, App Store editors, Gaming Age): loved for simple controls and deep strategy; you drag to aim a
  pass and the team runs; you only play offence, and reviewers found the touch aiming clumsy and imprecise on a bigger screen.
  https://ee.pocketgamer.com/articles/084147/retro-bowl-review-a-must-play-sports-game/ ,
  https://apps.apple.com/us/story/id1497755753 , https://gaming-age.com/2022/02/retro-bowl-review-for-nintendo-switch/amp/
  — so: no aimed drag at all; a tap on the receiver's own button throws, and you play defence too (his direction).
- **Tecmo Bowl / Tecmo Super Bowl** (GameSpot reviews, Nintendo Life, MobyGames, That Game UX): four to eight plays, picked in a
  moment; very little time between plays; you still steer the man to rescue a broken play; slow play selection kills the pace.
  https://www.gamespot.com/tecmo-bowl/user-reviews/2200-340442/ , https://www.nintendolife.com/reviews/vc/tecmo_bowl_nes ,
  https://www.mobygames.com/game/8021/ , https://www.thatgamesux.com/retro-gaming-ux-fails-choosing-plays-in-great-football
  — so: five plays at most, one tap each, SNAP straight after; plays open a level at a time.
- **Madden NFL Mobile** (EA's own FAQ and forum): a stick for the QB and a tap on a receiver's icon to throw; players on phones
  complained about reaching across the screen for icons on the far side.
  https://forums.ea.com/discussions/madden-nfl-mobile-en/madden-nfl-mobile-faq/8936215 ,
  https://forums.ea.com/discussions/madden-nfl-mobile-en/game-play-suggestion---in-game-controls/8884953
  — so the receiver buttons are big (and the stick is only needed if you want to move in the pocket); the colour says who is
  open, so you never guess.

## His directions, point by point
- *Landscape 3D view from behind the attacking team; the carrier obvious with a coloured ring; zoom out before each play*: yes;
  a yellow ring under our carrier (red under theirs), a white ring under the man you control, the camera pulled back and up
  before the snap and closer once the ball is live.
- *Approachable arcade version; downs, first-down line and scoring taught through play, clear markings*: yard lines and
  numbers, end zones, the two coloured lines, the down and distance on the scoreboard, banners for each.
- *A small set of plays, routes on the field, more added gradually*: Dive and Sweep from level 1, Slants at 2, Go deep at 4,
  Curls at 6; dashed routes on the grass before the snap.
- *Left joystick moves the QB; a floating button above each receiver, tap to throw; a separate handoff on runs*: exactly.
- *Control switches to the carrier; joystick to run; sprint and dodge on the right*: exactly (plus JUKE).
- *Defence: switch defenders, a tackle button, sensible AI coverage*: corners stay with the receivers, the linebacker watches
  the back or blitzes, linemen rush round the centre, everyone takes a pursuit angle.
- *Safe short gain or risky long pass, separation readable*: Slants and Curls are short and safe, Go deep is huge or an
  interception; the button colours show separation; covered throws get broken up or picked off.
- *Start with individual challenges, then short matches once the controls are understood*: the three lessons are the
  challenges (run for a first down, three open catches in a row, make a tackle), then every level is a short match. (Separate
  challenge levels were tried and taken out: random tapping won them.) **🏈 Quick drive** on the home card is one drive alone.
- *Opponents with different strengths; learn to adapt*: from level 5 the defences rotate: blitz (quick throws beat it), deep
  zones (short passes and runs work), a wall against the run (pass on them); the home card and a note at kick-off say which.
- *Stadium ambience, whistles, padded impacts, strong touchdown celebrations; commentary brief*: crowd, hut-hut, whistle,
  padded hits, the chain on a first down, a horn and a drumline for a touchdown; the words are two or three on screen, rarely.
- *Close escapes, visible blocks, short optional replays*: JUKED HIM!, block bursts when a lineman holds a man, and after a
  touchdown or a gain of 15 yards or more a **▶ REPLAY** chip plays the run again at half speed (a tap skips it).

## Levels, spam, lessons
Levels: easy first (their defenders slower and weaker tacklers), harder for ever; styles from level 5. Robots (node, 10 games
each): an ordinary player wins 0.8-1.0 of levels 1-3 and about 0.4 at 40; a sloppy one 0.8-1.0 at level 1; a sharp one 0.8 at
40. Blind moves (BLIND in part2: stick anywhere, any button, any receiver, snap): 0 of 650 in node, and test_play's blind and
random runs win nothing. What stops spam: a dive at nothing puts you on the ground, a covered throw is broken up or
intercepted, a quarterback who runs past the line is everyone's man, and the AI scores against a defence that does nothing.
Lessons: 1 RUN IT (a first down or a touchdown), 2 THROW IT (three open catches in a row; a covered throw resets), 3 STOP THEM
(your own tackle).

## Engagement factors chosen
P6 every input answers back (hut, hits, chain, the buttons' colours), P12 celebrations scaled (FIRST DOWN!, TOUCHDOWN! with the
crowd and horn, the replay), P13 visible personal best (best per level, longest gain), P15 nested goals (the drive, the match,
stars, kits, the locker room). Sound rules S1-S11.
Longevity L1-L10: lessons; a stick, a tap on a receiver, three buttons; turnovers and broken-up throws explained; the yellow line
always in sight; yards and stats after every game; plays and defences that change your choice; short or deep, run or pass;
Play again at once; kits and upgrades; best per level.

## The card clip: its most exciting moment
A sweep round the edge, a juke past the last man, and the run into the end zone with the crowd up.
