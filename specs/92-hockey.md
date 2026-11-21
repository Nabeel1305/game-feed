# 92. Ice Hockey

## The idea (his words, then mine)
His words (20 Nov 2026, idea 16, full text in `specs/his-list-2026-11-20.md`): "play fast, accessible hockey matches. For
this version, use ice hockey." He gave directions for the view, controls, skating, shooting, the puck, teammates, the action,
the match, progression, sound and replay. I built each one (below). It is 3D and sideways, like Eleven: a raised camera above
the near boards follows the puck along a compact rink. Each side has three skaters and a goalie.

## Research (21 Nov 2026; I cannot play these games myself, so I studied reviews and write-ups)
- NHL '94 (Wikipedia, Giant Bomb, Operation Sports): still called one of the best sports games because the controls are
  simple and the skaters glide on the ice. The move everyone remembers is the one-timer: you shoot straight off a pass, with
  no pause. What I took: two buttons do almost everything, the skaters glide, and there is a one-timer (tap SHOOT while the
  pass is coming to you, or the moment it arrives). It is fast and the goalie has to slide across for it.
- TouchArcade's review of a touch hockey game: with the puck you can pass, take a quick wrist shot, wind up a slap shot, or
  hit a one-timer by pressing shoot right after a pass, and the touch controls worked well. Hockey All Stars (store text)
  also sells itself on winding up slap shots and poke checks. What I took: tap SHOOT for a wrist shot, hold it for a slap
  shot (a ring shows the wind-up), and SHOOT becomes POKE when you don't have the puck.
- Superstar Hockey (player reviews collected on GameBrain): people liked the quick matches and smooth passing, but kept
  complaining that they could not tell passing from shooting. What I took: each button says what it does right now (PASS or
  SWITCH, SHOOT or POKE, TAP at a faceoff), and the buttons are big and well apart.
- Eleven (our own football game, LESSONS): run your teammates with the team's own brain, but only shadow on defence, so
  winning the puck is your job and blind tapping can't win. When a pass is meant for a player who isn't holding the stick,
  he skates to meet it. A shot snatched the moment the puck arrives flies wild (the one-timer is the exception).

## His directions, point by point
- View and environment: sideways, a slightly raised camera, three skaters and a computer goalie per side on a compact
  40 x 20 m rink with boards, glass, nets and a crowd. The first rink is an outdoor pond with snowbanks and pines.
- Controls: a floating stick on the left; PASS, SHOOT and BURST on the right. On defence the same buttons are SWITCH, POKE
  and BURST.
- Skating feel: speed builds quickly and glides off slowly, and turns are smooth. Any old direction fades within a fraction
  of a second, so the skater always follows your thumb.
- Shooting: tap for a quick shot; hold to wind up a stronger slap shot. While you wind up you skate slower and a defender
  is more likely to poke the puck away. You aim with the joystick: point it at the net and the shot goes where it points.
  Anything within about a metre of the posts still counts as on target. Point it away from the net and the shot goes
  wide. A shot taken while facing away from the net is a weak backhand, and a shot snatched the moment the puck arrives is
  weak too, unless it is a one-timer from the slot.
- Puck visibility: the puck is drawn bigger than life, with a pale outline ring on the ice and a short trail when it moves fast.
- Team behaviour: the defender stays back and the forwards spread out and move to open passing lanes. When we shoot, one
  forward goes to the crease for the rebound.
- Interesting action: saves often bounce out as rebounds, passes go off the boards on their own when the straight lane is
  blocked, and the puck can bang off the posts. Quick counterattacks come from steals and interceptions.
- Match structure: two-minute matches with golden-goal overtime, and a quick faceoff (tap as the puck drops) after every
  goal. "First to three" is the other mode, on the home screen.
- Progression: opponents get quicker and sharper. Their styles take turns from level 4: they press you hard, they defend
  the slot, or they pass a lot.
- Sound and music: skate blades cut the ice on hard turns, sticks clack, the boards boom, the posts ping, there is a goal
  horn and a crowd. Music plays between matches and goes quiet during play.
- Replay appeal: coins for assists, interceptions, steals and passing moves, as well as goals. One-timers and slap shots are
  called out. There are kit colours, a pro shop and ranks.

## His rules for every game (20 Nov 2026), kept
- Big buttons that do not cover the play, three short lessons (skippable), autosave, pause, a quick retry, an end card that
  says what to change, separate Music, Sound effects and Vibration, original teams and places.

## Spamming cannot win (LESSONS rule 1)
- Blind moves: the stick any way (`m`), PASS (`p`), a tap of SHOOT (`k`), a held SHOOT (`h`), BURST (`b`). Your teammates
  only shadow on defence (winning the puck is your job). A shot with no aim goes straight at the goalie and he has it. From
  more than 12 m he sees it all the way. A pass or a loose puck sliding at the net is the goalie's. A poke only works if you
  are facing the puck. Their forwards punish a team that does not defend: an open shot from close is their best chance.
  A tap before the faceoff drop loses it. In the node tests that copy test_play's blind patterns, 405 blind matches gave
  0 to 2 wins, while honest robots win 85-97% of levels 1-3.

## Lessons of the first three levels
1. PASS (two), then SHOOT (score once). 2. POKE CHECK (steal it three times; a poke only works facing the puck). 3. SLAP SHOT (score with one). Their skaters only
stroll during lessons and their goalie is weak.

## Engagement factors chosen (PLAYBOOK)
- P6 Every input answers back: the stick clacks, the slap shot has a wind-up ring, the horn and the crowd go off, the phone pulses.
- P12 Celebrations scaled: a small "STOLEN!", a bigger "ONE-TIMER!", the full GOAL with the horn, a cheering crowd and a flash.
- P15 Nested goals: this match, three stars for a three-goal win, assists and passing moves, kits, the shop, your rank.
- P4 Fair, readable failure: "TOO EARLY" at a faceoff, "SAVE! REBOUND", and the end card says what to change.

## Longevity (PLAYBOOK H)
- L1 Score more than them. L2 Stick and three buttons. L3 Saves and lost faceoffs are shown and explained. L4 The score
  and the clock. L5 Stars and your best coins. L6 Pressing, slot-defending and passing teams. L7 Pass, carry, wind up or
  one-time. L8 PLAY AGAIN in one tap. L9 Kits, the shop and your rank. L10 Your best coins per level.

## The card clip: its most exciting moment
A pass across the slot and a one-timer into the top corner, then the horn and the crowd jumping.
