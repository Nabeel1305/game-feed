# 93. Tennis

## The idea (his words, then mine)
His words (20 Nov 2026, idea 17, full text in `specs/his-list-2026-11-20.md`): "play tennis, beginning with simple rallies
and progressing to more demanding opponents and matches." He gave directions for the view, controls, help for beginners,
serving, decisions, shots, opponents, the match, sound and replay. I built each one (below). It is 3D: singles seen from
behind your baseline, with the ball's shadow on the court so you can judge its height.

## Research (21 Nov 2026; I cannot play these games myself, so I studied reviews and guides)
- Tennis Clash (App Store editors, GameAnalytics, iFanzine and Mr Guider guides): you swipe to hit. The swipe's direction
  aims, its length sets how far the ball goes and its speed sets the pace. Too slow puts it in the net, too fast sends it
  out. Matches are first to seven points. GameAnalytics credits the success to "two simple controls and a simple points
  system". What I took: the same swipe (direction, length, speed) and first-to-seven matches. Their move-by-tapping
  became a left-thumb stick, because he asked for a joystick.
- Pocket Gamer on VT Tennis, and TouchArcade and Pocket Gamer on Virtua Tennis Challenge: a different swipe shape for
  every shot (loops for lobs, flicks for volleys) was hard to learn, the gesture controls felt inaccurate, and players
  switched to the virtual pad. What I took: no gestures to learn. A lob is just a slow, long swipe, a slice is a swipe
  down, and a volley is any swipe made before the ball bounces.
- Pocket Gamer on World of Tennis: Roaring '20s: a rigid timing window that punishes taking the ball early feels sluggish.
  What I took: a swing made a moment early still meets the ball (a 0.2 s buffer), and timing changes where the ball goes
  (early pulls it, late pushes it) rather than throwing the shot away.

## His directions, point by point
- View and environment: a 3D camera behind and above your baseline that slides with you. The ball is drawn larger than life,
  with its shadow and a short trail, and bounce marks fade where it landed. Courts change every four levels: a practice
  court, club clay, a grass lawn, a city hard court and a night stadium.
- Controls: a floating stick on the left moves you. On the right you swipe: direction aims, length sets depth, speed sets
  pace. A swing at nothing costs half a second, and timing shapes the shot.
- Beginner assistance: early on you take a small step toward the ball on your own, the timing window is wider and the
  opponents' shots are slower. All three fade away by level 10.
- Serving: the stick picks your spot on the baseline, a tap tosses the ball, and a swipe at the top serves (the ring around
  the ball turns green). Every toss is a little different, so you watch the ring. There is a ten-second serve clock.
- Interesting decisions: the opponent covers the middle and recovers there after each shot. A ball into the open court
  makes them run and is often a winner. A hard ball straight at them comes back.
- Shot variety: groundstrokes first, then a short practice challenge introduces each new shot: the lob (level 5, against a
  net rusher), the slice (level 7) and the volley (level 9).
- Opponent behaviour: styles take turns: the baseliner (steady), the net rusher (comes in), the pusher (lobs and slices,
  hardly misses) and the big hitter (fast, more errors). They get quicker and more accurate as levels rise.
- Match structure: first to 7 points, win by two (serve changes like a tiebreak). The long format is games to three with
  15, 30, 40, deuce and advantage, and you switch it on the home screen.
- Sound and music: the pock of the strings (softer for a slice or lob), bounces, footsteps, the net's thud, line calls,
  applause that grows with the rally, and soft music that goes quieter during play.
- Replay appeal: the end card shows your longest rally, winners, aces, errors, volleys and lobs. **Practice** on the home
  screen is a ball machine with drills for your weak spots: forehands, backhands, on the run, lobs, volleys and serves.
  You don't have to replay a whole tournament.

## His rules for every game (20 Nov 2026), kept
- Thumb zones on each half that never cover the court, three short lessons (skippable), autosave, pause, a quick retry, an
  end card that says what to change, separate Music, Sound effects and Vibration, original players and courts.

## Spamming cannot win (LESSONS rule 1)
- Blind moves: the stick any way (`m`), a swipe up in a random direction, length and speed (`s`), a swipe down (`d`) and a
  tap (`t`). A swing at nothing costs a moment, a mistimed hit sprays, and the toss height varies so a fixed rhythm can't hit
  the top every time. The serve clock ends a match where nobody serves. In 4,520 blind games on levels 1, 2, 3 and 6 none
  were won.

## Lessons of the first three levels
1. RALLY (hit four back over). 2. SERVE (four good serves in the box, swiped on the green). 3. THE OPEN COURT (two into the
glowing corner, away from them). The practice challenges for the lob, slice and volley come at levels 5, 7 and 9.

## Engagement factors chosen (PLAYBOOK)
- P6 Every input answers back: the pock, "SWEET!" on a well-timed hit, bounce marks, the trail.
- P3 Honest near-miss: bounce marks show exactly where it landed; "MISTIMED", "LATE", "OUT" and "NET".
- P15 Nested goals: this point, this match, stars, rackets, the shop, your rank, and your longest rally.
- P12 Celebrations scaled: a small cheer, louder for a long rally, "ACE!" and "WINNER!", and the crowd at the stadium.

## Longevity (PLAYBOOK H)
- L1 Win the point. L2 Stick and swipe. L3 You see where it landed and why it missed. L4 The score is always on top.
- L5 Stars and your best. L6 Four styles of opponent, new shots and courts. L7 Deep or short, a drive or a lob, to which side.
- L8 PLAY AGAIN in one tap. L9 Rackets, the shop and your rank. L10 Your longest rally and your best coins.

## The card clip: its most exciting moment
A long rally that ends with a drive into the open court, a "WINNER!" and the crowd's applause.
