# 87. Sumo

## The idea (his words, then mine)
His words (20 Nov 2026, idea 21, full text in `specs/his-list-2026-11-20.md`): "play sumo wrestling as a huge, heavy
wrestler. Grapple, push and outmanoeuvre opponents to force them out of the ring or make them touch the ground with anything
other than their feet. Make weight and physical contact central to the experience, including satisfying phone vibration."
With directions for the view, the wrestlers, the controls, grappling, balance, stamina, the opening clash, the opponents,
decisions, vibration, sound, progression, replay and the end of a bout; built from them point by point (below).
3D: the bodies, their lean and the ring round them are the game.

## Research (21 Nov 2026; I cannot play these myself, so I studied store pages, reviews and how real sumo is decided)
- Sumotori Dreams (PC 2007, mobile 2014): the controls are only moving and pushing with one hand or both; the fun is the
  physics: a shove that connects starts the other man toppling. Reviewers found it funny but rough, and the controls
  "once removed" (Pocket Gamer, 148Apps, Fun-Motion). What I took: weight you can see; but not wobbly, random controls.
- Sumoscience (Franklin Chang, iOS): models the forces; the grip button turns blue when you have a hold, you can force him
  out on the belt, and you escape a grip or throw by turning; slapdowns need room behind you. Sumo fans called it the most
  realistic. (App Store page and reviews) What I took: a lit GRIP button, the belt drive, turning as the escape.
- Sumo Roll (iOS): push, chop and a sidestep button; a long press is a big charge. (App Store) What I took: tap for a shove,
  hold for a big push, a separate sidestep.
- Real sumo: most bouts are decided at the tachiai, the opening charge; the henka (a sidestep at the charge) is the classic
  answer to a charger; yorikiri, oshidashi and hatakikomi are among the commonest winning techniques (Japan Times "Sumo 101:
  Tachiai"; Sumo wiki on kimarite; nippon.com). What I took: the ready signal and the three openings, technique names on
  every result, the sidestep that makes a lunging man stumble.

## His directions, point by point
- View and environment: a slightly raised camera behind you and to one side, facing him: both wrestlers and the straw ring
  always in view; it swings round with you so "up" on the stick is always toward him. A dark hall, the crowd on cushions
  all round (instanced), warm lamps on the clay dohyo, the hanging roof with its four tassels, white start lines.
- Character design: two huge wrestlers (belly, chest, thick legs, topknot), belts in their colours, seven rivals with their
  own colour and skin tone. Feet plant, knees bend as they drive, they lean into what they push, roll when turned, arms go to
  the belt on a grip and thrust on a shove, the belly heaves when tired, dust kicks up where heels scrape.
- Movement controls: a floating stick on the left, opponent-relative: up presses in, sideways circles him, down backs off.
  Heavy (momentum) but answers at once.
- Action controls: three big buttons on the right: PUSH (tap: shove; hold and let go: big, tiring push; a ring fills while
  held), GRIP (hold while close; it lights and reads HOLDING; let go to release), DODGE (a short sidestep; a ring shows the
  recovery).
- Grappling: gripping, the stick drives (up), pulls (down) or turns you both (sideways); the arms on the belt show the
  hold. A pull is strong only against a man leaning or lunging (lean past 0.3, much more past 0.6), weak against an upright one.
- Balance: posture shows it (lean, bent knees, the roll); a balance level under the ring (LEANING IN: CAREFUL / FALLING BACK)
  for everyone (it helps in the tutorial and does not get in the way afterwards).
- Stamina: two bars at the top (YOUR STRENGTH, HIS STRENGTH); pressing, gripping while turning or pulling, and shoves use
  it; letting go brings it back (faster without a grip). Low stamina: weaker drive, easier to move; "HE IS TIRED: GO!".
- Opening clash: READY, then HAKKEYOI!: charge (stick up), stand your ground (nothing: you brace), or sidestep (DODGE). No
  introductions between bouts.
- Opponent behaviour: chargers (charge, shove, lean), anchors (plant, grip, wait for you to tire), pullers (wait, let you
  come, snap you down), the all-rounder. Each rival's style is named when the bout starts, with a tip on the first levels;
  the charge has its own clash sound and shake.
- Interesting decisions: drive or wait; grip (stronger drive, but turning costs); pull a man who leans in; sidestep a lunge
  and then shove him as he stumbles past; at your edge (the straw glows red behind you) turn him with the belt or sidestep.
- Physical feedback: short pulses for your footsteps, a strong one for the opening clash, a distinct one for a winning fall,
  a thud for a big push; the Settings have Vibration on/off and LOW / NORMAL / STRONG.
- Sound and music: deep footfalls, slaps, the clash, clay scraping under driven heels, the belt taken, the sidestep's
  whoosh, the heavy fall, the crowd's murmur rising near the edge and its roar at the end; a slow taiko pulse with a bamboo
  flute at home and between bouts, only a faint drum during the bout.
- Progression: level 1 an anchor who never charges (push him out), level 2 a charger (the sidestep), level 3 a puller; then
  the seven rivals in turn; every fifth level a tournament (best of three). No stat upgrades: the shop is cosmetic only.
- Replay appeal: quick bouts (most under 15 s), tournaments, three stars (win; with a counter or from the edge; under
  12 s), belts unlocked by stars, victory poses, a bigger crowd, best coins per level, rank from Jonokuchi to Yokozuna.
- Success and failure: the bout ends in slow motion with the technique's name (YORIKIRI: forced out on the belt, HATAKIKOMI,
  TSUKIOTOSHI, UTCHARI, UWATENAGE...) and why; on a loss a line says what to do next time; REMATCH is one tap.

## His rules for every game (20 Nov 2026), kept
- Big buttons low on the right, the stick where the thumb lands: nothing covers the ring.
- Fun within ten seconds: lesson 1 is shoving a practice partner out of the ring.
- One thing at a time: push (lesson 1), grip and drive (lesson 2), the sidestep at the charge (lesson 3); pulls and turns
  come with the rivals who need them, with a tip.
- Autosave, pause, separate Music, Sound effects and Vibration; original wrestlers and arena, no real names or brands.

## Spamming cannot win (LESSONS rule 1)
- Blind moves (BLIND in part2): `m` the stick any way (or let go), `p` a shove, `g` grip on or off, `d` a sidestep.
- Drive grows with the cube of how straight the stick points at him (a wandering stick barely pushes); a pull needs the stick
  firmly down and works only on a man already leaning; a sidestep makes a man stumble only if he is lunging at you that
  moment, and only a shove while he stumbles puts him down; the rivals feel your pushes, pulls and turns at once and answer.
- test_play: 13,056 blind games, 6 won; random moves, 480 games, none.

## Lessons of the first three levels
1. PRESS IN AND SHOVE. 2. GRIP AND DRIVE. 3. SIDESTEP THE CHARGE.

## Engagement factors chosen (PLAYBOOK: 3 to 5 principles, the sound rules)
- P6 Every input answers back: the bodies lean, the buttons light, the ring fills as you hold PUSH.
- P4 Fair fail: every loss is seen coming (the red edge behind you, his lean, his charge) and named at the end with what to do.
- P7 Hit-stop and slow motion: a beat of stillness on a big push, the end of a bout in slow motion.
- P12 Celebrations scaled: slow motion, the technique's name, the crowd's roar, three stars.

## Longevity (PLAYBOOK H)
- L1 Two men, a ring: push him out. L2 One stick, three buttons. L3 Fair: everything he does, you can do. L4 His strength
  bar, the straw behind him. L5 Stars, best coins. L6 Seven rivals, three styles, tournaments. L7 Drive or wait, grip or
  shove, pull or sidestep. L8 REMATCH in one tap. L9 Belts, poses, rank. L10 Best coins per level.

## The card clip: its most exciting moment
A charge at HAKKEYOI, the clash, a drive to the straw and the slow-motion fall out of the ring with YORIKIRI.
