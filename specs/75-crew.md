# 75. Shadow Crew

## The idea (his words, then mine)
His words (20 Nov 2026): "a mix between 3D and 2D... let the characters have their 3D, but let their dimensions be like a
drawing... like Among Us, kind of... you walk and you're able to kill people and the rest of the people can't see you
killing people... in the same place, but levels making it harder and harder... the equivalent of 5 games... stunning."

Mine: one space station, seen from above at an angle in real 3D (walls with ink outlines, lit rooms, props, a starfield),
and every crewmate is a hand-drawn sticker standing up in it: white sticker edge, ink outline, cel shading, big eyes, its
own ears (cat, bunny, sprout, horns, antenna, bear, fluff). You are the traitor. Knock-outs are cartoon (BONK, X eyes,
stars), never blood. 3D because the station itself, its corners and what you can and cannot see round them, is the game.

## How it plays (two thumbs, all simple)
- Left thumb anywhere: walk (one floating stick).
- Right thumb: big buttons that light up only when they work: **KNOCK OUT** (someone within reach, cooldown shown),
  **VENT** (stand on a vent: hide, hop to the next vent, come out), **REPORT/PRETEND** (hold at a job to look busy; report a
  body yourself), **SABOTAGE** (lights, doors, reactor).
- What you see is what they see: the fog is your sight lines, worked out ray by ray. If a crewmate can see you or the
  victim at the moment of a knock-out, they saw it ("SOMEONE SAW!") and run for the alarm.
- A knock-out makes a noise: anyone close by, even round a corner, comes to look ("?!").
- Bodies get found. A meeting: the crew talk one by one (who was near the body, who came out of a vent, who was with whom,
  who has never been seen doing a job, alibis), then everyone votes. Tap a face to blame them, or skip. Blaming someone
  nobody suspects makes them doubt you.
- Win: only one crewmate left (knock-outs plus wrong votes). Lose: voted out, the crew finish their jobs, or (later) the
  sheriff catches you. After a while the crew hurry their jobs, so waiting for ever does not pay.

## Levels: very easy first, then harder for ever (LESSONS rule 0)
5 crew at first, up to 9 (and one more on every tenth level). They see further, the cooldown is longer, jobs go faster,
the crew trust what they hear more. New things arrive one at a time: lights sabotage (3), buddies who walk in pairs (4),
doors (5), cameras and the camera desk (6), the reactor (8), the sheriff (12). Help after three losses: shorter cooldown,
more jobs before the crew win.

## Systems
Five things in one game: stalking (sight lines, buddies, cameras), escaping (vents, walking away, pretending to work),
sabotage (lights, doors, reactor), talking (meetings, testimony, blaming, alibis) and the levels with their new rules.
Stars (win; no meeting; never seen and no innocent voted out), coins, the Upgrades (Quick hands, Light feet, Smooth talker),
five looks for your character opened by stars, ranks from Stowaway to Legend.

## Spamming cannot win (LESSONS rule 1)
- Blind moves (BLIND in part2): `w` walk a random way, `s` stop, `k` knock out, `v` vent in/out, `b` a random sabotage,
  `m` a random vote at a meeting.
- What stops it: witnesses and cameras; the noise of a knock-out; whoever finds the body sees you standing over it; "nobody
  has seen YOU do a job"; baseless blaming counts against you and barely moves the vote; those who doubt you keep their
  distance; the crew hurry after a while.
- Measured (test_play.py): blind strings 1 of 46,528 games, the closest string 0 of 100; random moves 0 of 480.
  People who look: ordinary 0.8-1 on levels 1-3, 0.3-0.4 at 20-40; sloppy 0.85 on level 1; sharp 0.5 at 40.

## Lessons of the first three levels
1. WHEN NO ONE IS LOOKING: SKY alone in Electrical, LIME walks in and out. Knock out SKY when LIME is gone.
2. VANISH: knock out RUBY in MedBay, hide in the vent, come out somewhere else.
3. THE MEETING: knock out COCOA in Storage; the body is found; vote for the one they already doubt.
Skip tutorial on every lesson; Tutorial on the home card and in the pause menu.

## Engagement factors chosen (PLAYBOOK)
P4 fair, readable failure (you see exactly who saw you and why they doubt you: every line at the meeting is a reason),
P26 variety with rhythm (a new rule every few levels), P7 hit-stop and P8 shake on the BONK, P13 visible personal best
(stars per level, rank), P30 the signature: drawn stickers in a real 3D station, and the meeting table.

## Longevity (PLAYBOOK H)
- L1: you are the traitor; walk, knock out, don't be seen. The fog shows what can be seen.
- L2: one floating stick, big buttons that light up only when they work.
- L3: every loss has a reason you were told at the meeting.
- L4: the crew-left count and the crew's job bar on screen.
- L5: stars on every level, your rank.
- L6: lights, doors, reactor, buddies, cameras, the sheriff.
- L7: who to pick, when to strike, vent or walk, sabotage or not, whom to blame.
- L8: Again on the end card, the next game at once.
- L9: your looks, your upgrades, your rank.
- L10: your stars on every level, kept.

## Sound (S1-S11)
A low station hum and soft footsteps; a cartoon BONK; a gasp when someone sees; a whoosh for vents; a power-down for
sabotage; meltdown beeps for the reactor; the alarm bell for a meeting; a pop per vote; a long whistle for an ejection.
No buzz on a loss (P11).

## The card clip: its most exciting moment
A knock-out with nobody looking, BONK and stars, then the walk away into a vent. Not on the app until he says so.
