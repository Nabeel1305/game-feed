# 8. Plunder (`games/plunder/`)

Nabeel's brief (15 Nov 2026), in short: a pirate game. You set sail on an **expedition** (this game's level; each a little
harder than the last). Seen from above, you sail until you sight a ship or a fleet of up to three, merchant or navy or mixed,
and decide to **raid or sail on**. Merchants carry more loot; navy ships are "way harder". Navy ships fire on you: a **cannon
battle**, from above, which you must win before you can board. Then you **board**: first person, "like on Steel and Honour
but pirate themed": mostly swords (slice, stab, block, dodge) and a pistol that is "way worse" (one shot, then you must stand
still "for an unacceptable amount of time" to reload, about three shots in all). "If you fight well so does your crew and
you win. If you fight bad so does your crew and then you lose." The enemy surrenders, and the win screen shows the loot.
Calm pirate music and soft water while cruising; exciting music once a ship is seen. "Make the graphics as realistic as
you can." "It's like two games in one." Easy at first, then harder "till you actually need to lock in to win".

His answers to three questions: **fleets** = one cannon battle against all its navy ships together, then one boarding, of the
richest ship; loot counts for every ship beaten. **Loot** = score and pirate rank, nothing to buy. **Boarding** = three short
fights in a row: on deck, below deck (navy ships have their guns there), then the captain in his cabin.

- **Verb:** plunder. **Signature moment (P30):** their flag comes down while your crew roars, and the loot is counted out.
- **Signature sound:** the rolling broadside: your guns going off one after another down the side.
- **Principles:** P4 fair readable failure (gun ports open before a broadside; every blow has a wind-up), P7 hit-stop (sword
  hits, the pistol, a broadside striking home), P12 celebration scaled (the flag coming down, loot counted chest by chest),
  P14 goal-gradient (the tide bar; pips for sea, deck, below, cabin), P18 chains (parries in a row ring higher). Always: the
  S-rules, P6, P10/P11, P23.
- **Feed:** genre "Pirates", intensity 4, two thumbs, font Pirata One (title) with Barlow Condensed and Nunito. Storage `pl.`.
  Instant start: his hand is on the wheel at once and the lookout calls a second later (the choice is part of the game, not a menu).

## One expedition (aim: about three minutes)
1. **Sail** (from above, the camera turns with your ship): left thumb steers (slide left and right), calm music, soft water.
   After a few seconds: "SAIL HO!" and the music lifts. A card shows what the lookout sees: each ship (merchant or navy, its
   size), the loot it promises (coins) and the danger (skulls). **RAID** or **SAIL ON**: two passes an expedition; the third
   sighting must be fought ("the crew will not wait"). Expedition 1 is a lone merchant, 2 a lone navy cutter (no choice on
   either: they teach the two halves); from 3 the sightings are drawn by luck and get richer and better guarded.
2. **Cannon battle** (only if the sighting has navy ships): a turning fight. Guns fire out of the sides. **Hers** only reach out
   of her sides, in a fan drawn in red: faint while a side is loaded, filling while her ports are open (your warning), then she
   fires at wherever you are in it. She comes at you under full sail, then shortens sail and swings a side to you; she is heavy
   to turn. **Yours** aim themselves: when a ship is inside your gold arc, FIRE lights (right thumb, anywhere on the right half);
   each side reloads on its own. A ball that runs the length of a ship (through her bow or stern) does nearly double: **RAKED**.
   So: keep out of the red, get close on her bow or stern, and turn faster than she can. Navy ships come in one at a time (two
   from expedition 40) while the others stand off. Hull to nothing = sunk (you) or struck/sunk (them). You can lose here.
   Left alone for twelve seconds, she comes alongside and her gunners find the range: no battle goes on for ever.
3. **Come alongside** the prize (the richest ship: a merchant if there is one, else the biggest navy ship, which strikes
   instead of sinking): grapples fly by themselves.
4. **Boarding**, first person, three stages: **on deck**, **below deck**, **the captain's cabin**. One bar across the top is
   the **tide of the fight**: your crew's end and theirs. Every wound you give pushes it their way, every man you drop pushes
   it a lot; every wound you take pushes it yours; standing idle lets it slide. All the way = they give up that part of the
   ship. All the way back = your crew breaks and the expedition is lost. In the cabin the tide is the captain himself.
   - **Slice:** swipe across him (hits what the stroke crosses). **Stab:** tap him (quick; heavy on a man off balance).
   - **Block:** while he swings, swipe across his blade on the side it comes from (a thrust: swipe through its point).
     A late, clean block throws him off balance: that is the moment to stab.
   - **Dodge:** pull straight down near the bottom of the screen: the only answer to a shot or a red (unblockable) blow.
   - **Pistol** (button, bottom right): hold to raise it, drag to bring the sights onto him as they settle, let go to fire.
     Head or heart drops an ordinary man; it staggers a captain. Then it is empty: hold RELOAD for four seconds without
     doing anything else, or do without. Three balls an expedition.
5. **The win screen:** the loot from the deck, the hold and the captain's cabin of the prize, plus every other ship beaten;
   stars (wounds and hull damage taken); best haul; rank (total plunder). Then the next expedition.
   Lose (sunk, or the crew broken): the card comes up within a second (a tap skips even that), and a tap anywhere tries again;
   after three losses on one expedition help is on (their blows and broadsides come a little slower: it only adds time).

## Getting harder (f = curve(N); easy = 1 at expedition 1, 0 from 7)
- Sea: her reload 5.8 s to 2.7, warning before a broadside 1.7 s to 0.5, scatter wide to tight, a whole broadside 6 to 50 of
  your 100 hull, her hull 0.5 to 2.6 times her kind's own, how quickly she swings round, how well she guesses where you will be.
  One navy ship to expedition 5, up to two to 14, up to three after (the more ships, the smaller they are).
- Boarding: wind-up 0.9 s to 0.3 (never under 0.3), gap between blows 2.1 s to 0.5, how early a block still counts 0.6 s to
  0.14, his guard against your attacks 6% to 60%, spam read hard from expedition 5, combos from 4, feints from 8, unblockable
  blows from 6 (captains from 3), marines' shots from navy ships. Navy crews are about a third harder than merchant crews at
  the same expedition; captains harder again. More men to get through as the tide moves less per man.
- Boss every 10th: a treasure galleon under a man-o'-war.
- Stars: 3 = little damage taken (hull and wounds together), 2 = some, 1 = won.

## No easy way to win (proved by `games/plunder/test_play.py`)
Sea: sailing straight without firing, sailing straight and tapping FIRE, circling, weaving. Boarding: doing nothing, nonstop
slices, nonstop stabs, scribbling, only blocking, only dodging, pistol only. Each wins the first few expeditions at most (they
are for learning) and nothing from 8 (boarding) or 12 (sea). A careful player wins early and finds it hard later; a sharp one
can still win at 100.

## Look and sound
- Sea from above painted by the graphics chip (swell, ripples, glints, foam), plain fallback; ships as wooden hulls with
  planked decks, masts, shaded sails, flags, guns; wakes, smoke, splashes, splinters, fire, a ship going down.
- Boarding: the deck (sky, sea horizon rolling, planking, rail, mast and shrouds, both crews fighting behind), below deck
  (beams, lanterns, guns at their ports on a navy ship, cargo on a merchant), the cabin (stern windows, desk, charts, chest).
  Sailors, marines, officers and captains mixed from long lists (rule 9).
- Music (he asked for it): one original shanty, played two ways from the same notes: calm (slow, squeezebox and plucked
  strings) and battle (fast, drum and fiddle). Quiet, under every effect, off with the sound switch, ducked under big moments.
