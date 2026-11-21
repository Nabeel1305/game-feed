# 89. Spy

## The idea (his words, then mine)
His words (20 Nov 2026, idea 18, full text in `specs/his-list-2026-11-20.md`): "act as a spy who must enter a secure
location, photograph a top-secret document and escape without getting caught." With directions for the view, controls, the
mission, readability, guards, photography, choices, gadgets, progression, sound and replay; built point by point (below).
3D: the building seen from above at night, with the guards' torches lighting their sight on the floor.

## Research (21 Nov 2026; I cannot play these myself, so I studied write-ups and reviews)
- Game Maker's Toolkit "School of Stealth": guards fill an awareness meter rather than spotting you at once; it fills slower
  far away, at the edge of sight or when you crouch; Mark of the Ninja shows the cones on screen; Metal Gear Solid drew them
  on its radar. What I took: a meter over each guard ("?" then "!") that fills faster close up, slower when crouched.
- Shadow Tactics (Gamasutra deep dive, Mimimi): cones that are too big ruin the level design and the difficulty; finding the
  size took a long time. What I took: short cones early (4.8 m), a little longer later (6 m), and crouching shortens them.
- Turnover dev log: cones drawn as overlays that pass through walls mislead; cones cut by walls show truly what a guard sees.
  What I took: each fan is cast against walls, shut doors and cupboards every frame.
- Simple stealth AI (wayline.io): a suspicious guard investigates the last place he noticed something. EGM on vision cones:
  a meter over the enemy's head shows how long you have to back out. What I took: look, then investigate, search, return.
- Sneak Ops (Pocket Gamer): stealth works on the go when new ideas keep arriving. What I took: one new thing every few levels.

## His directions, point by point
- View and environment: an elevated 3D view behind the spy; the 🗺 button steps between close, middle and far. A small office
  first (two to three rooms), then the embassy annexe, a research lab and a bank: more rooms, a corridor, two ways in.
- Controls: a floating stick on the left (push far to run); CROUCH and one ACTION button on the right. ACTION says what it
  will do: OPEN DOOR / CLOSE DOOR, HIDE / COME OUT, PHOTOGRAPH, LOOK AT DESK, TAKE FILE, TAKE KEYCARD, UNLOCK, THROW COIN.
- Basic mission: from the van, in, find the file, a clear photograph, back to the van.
- Stealth readability: sight fans on the floor (cut by walls), white, amber, red; fainter after level 14 and only when a guard
  is suspicious after level 30. Running rings out on the floor (a white ring: who is inside hears it). Low desks hide you
  only when you crouch; tall cupboards and walls always; plants only get in the way.
- Guard behaviour: rounds with pauses; a glimpse makes him stop and look ("?"); more and he comes; full and he runs ("!");
  out of sight, he searches the last place he saw you, then goes back. He hears running, doors and coins.
- Photography: a viewfinder; the frame drifts (more when a guard is near); the stick steadies it; the file must stay inside the
  frame while a bar fills.
- Interesting choices: a corridor (short, a guard walks it) or the side rooms (longer, desks and cupboards); watch first.
- Gadgets: coins from level 4 (two, three with the upgrade); keycards for locked rooms from level 7.
- Progression: guards' sight shown, then crouching (2), cupboards (3), coins (4), bonus files (5), locked rooms (7), cameras
  (8), the file on one of several desks (9), more guards and rooms as you go.
- Sound and music: soft steps, running thumps, door creaks, the camera's whirr and shutter, a coin's ping, the guard's "hm?",
  voices far away; a low bass and brushed hi-hat, a tenser line rising with suspicion.
- Replay appeal: stars for getting out, never being spotted, and every bonus file (or a quick escape); coins for coats; best
  per level; missions are built fresh each time.

## His rules for every game (20 Nov 2026), kept
- Big buttons low on the right, the stick where the thumb lands; training first (three short lessons, skippable); autosave,
  pause; the end card says why ("CAUGHT: watch their cones..."); separate Music, Sound effects, Vibration; original places.

## Spamming cannot win (LESSONS rule 1)
- Blind moves: `m` the stick any way (and now and then crouch), `a` the ACTION button. 1,984 blind games, none won; random 480,
  none. You must find the file, hold it in the frame and come back.

## Lessons of the first three levels
1. IN, SNAP, OUT. 2. CROUCH BEHIND DESKS. 3. HIDE IN A CUPBOARD. (Guards in training cannot catch you.)

## Engagement factors chosen (PLAYBOOK)
- P4 Fair, readable failure: cones cut by walls, "?" before "!", the end card says what to do.
- P6 Every input answers back: ACTION says its job, the crouch lights, the frame turns green when the file is in it.
- P15 Nested goals: the photo, then bonus files and no sightings for stars, then coats and rank.
- P17 Surprise: the file may be on any of several desks; a locked door; a camera sweeping round.

## Longevity (PLAYBOOK H)
- L1 Get the photo, get out. L2 One stick, two buttons. L3 You see what they see. L4 The file, the van, the clock.
- L5 Stars and best per level. L6 Rooms, routes, gadgets, cameras. L7 Corridor or side rooms; coin or wait.
- L8 TRY AGAIN in one tap. L9 Coats, rank. L10 Best coins per level.

## The card clip: its most exciting moment
Crouched behind a desk as a guard's torch fan sweeps over, then the flash of the photo.
