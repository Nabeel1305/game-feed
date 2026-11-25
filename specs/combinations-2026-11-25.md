# Games of combinations: way more of them, and a deck that remembers (25 Nov 2026, 21:43)

His words: "a general fix. You know all the ones that has options, the ones that you have to have combinations, like judge, like the game that you pretend to
be a judge, or the game that you're heaven and hell, or even the game that you have to be a vet... I want you to look at all the games that requires different
combinations, and I want you to make it fun... I need you to make way more combinations within those games that require them. So yeah, lots of them. I mean, it
keeps on coming, something novel each time. Someone can play this game for years, and they only see something similar to something else only, like once in a
blue moon."

## What "a game of combinations" was taken to mean
A game where each round is a new case, patient, customer or order drawn from written lists. Two things were done to each:
1. **Far more to draw from**, in parts that multiply.
2. **The deck that remembers**: every list is dealt in a shuffled order saved on the phone (`deck.<name>` in the game's own storage); nothing returns until the
   rest of its list has gone by. Proved by `tools/test_decks.py` (14 games pass).

## The fourteen (was -> now)
| Game | What it holds now |
|---|---|
| The Bench (judge) 0.3.0 | offences 29 -> 58, each told 4 ways (2 before); things for and against 19 -> 45; first names 30 -> 70, family names 25 -> 62, jobs 15 -> 50, shops 8 -> 24, places 12 -> 34, things taken 8 -> 28; victims' words 4 -> 12 |
| Heaven or Hell 0.2.2 | best/worst deeds 48 -> 240, small deeds 12 -> 72 (earlier the same evening), now dealt from the deck |
| Country Vet 0.2.0 | animals 6 -> 22 (each built from one of the six, own size, coat, temper, level); names 5 -> 14 each (10-12 for the new); each trouble shown 6 ways on the card (1 before) |
| Hiring 0.2.0 | jobs 8 -> 34 (never two in one line of work on a day); lines of work 11 -> 28; certificates 5 -> 19; languages 6 -> 16; lines about themselves 12 -> 80; names 14+14 -> 40+40, family names 18 -> 48 |
| Spellshop 0.2.0 | troubles 56 -> 194 (160 of the 192 jar/way/rune combinations have at least one; 18 need two jars); villagers 16 -> 48 |
| Detective 0.2.0 | places 5 -> 9; things 25 -> 62; ways it was done 20 -> 35 (four on the sheet in any one case); motives 4 -> 18; secrets 4 -> 12; names 24 -> 72; dropped things 8 -> 24; three ways of finding nothing in each piece of furniture |
| Mocktail Bar 0.3.0 | named drinks 11 -> 41 from the same bottles; customers 20 -> 60 |
| Dress Designer 0.2.0 | occasions 8 -> 40 (each checked to have a dress with no clash); customers 20 -> 50 |
| Cake Designer 0.2.0 | icings 8 -> 18, sponges 3 -> 7, toppings 4 -> 8 (blueberries, sugar flowers, gold stars, chocolate curls), occasions 8 -> 48, customers 20 -> 60 |
| Plumber 0.2.0 | kinds of call 21 -> 35 (all mended with tools already taught); ways of saying them 63 -> 174; names 30+22 -> 60+47, streets 12 -> 36 |
| Pottery Wheel 0.2.0 | shapes 8 -> 24 (from level 5 dealt from the deck, not fixed to the level); glazes 6 -> 16, six on the bench for any pot; customers 8 -> 40. Also: the line telling you how to centre the clay is now only in the tutorial |
| Dentist 0.2.0 | kinds of patient 4 -> 11; names 18 -> 70 |
| Haggle 0.2.1 | reasons for selling 4 -> 40 (ten for each kind of seller); names 12 -> 48; the 24 kinds of thing come from the deck |
| Short Order 0.3.1 | the 34 dishes come mostly from the deck |

## Looked at and left, and why
- **Grand Hotel**: its variety is the rush (bags, food, towels, cleaning), not a list of cases; more names would change nothing you notice.
- **Word Wheel, Black Keys, Origami, Memory Lane, Metro Map, Safecracker, Sugar Swap**: puzzles and songs, made by rule or one at a time; "more combinations"
  there means more puzzles or songs, which is a different job (say if you want it).
- **Bin Round, Mow It, Taxi Driver, Bus Driver, Beach Watch**: driving and tidying games; their lists are scenery.
- **Zenith and Hippodrome** hold long lists too, but they are on the app (games 1-8 are not changed).

## What the tests taught (also in LESSONS)
- In the robots' games a new list must take **no extra dice**: one more random number shifts every game after it (Country Vet: a random-mover won 1 of 3,000;
  Haggle: level 1 fell from 10/10 to 7/10) though nothing a player meets had changed. The decks and the new lines take no dice there now.
- A rate of a few in ten thousand cannot be read from 1,984 games (The Bench's blind test showed 1, then 3; over 19,840 games it is 0.20 per thousand before
  and 0.30 after). Its sample is three times bigger now.
- Detective's "it gets harder" compared wins at level 3 and 40, but its robot reads every clue and wins 0.97 at both; it now checks that the case grows.
- Mocktail Bar: a four-part drink at level 3 made the early game harder for no reason; it comes at level 5.

## Honest list
- Seen in stills on a computer: the 16 new animals (pony not caught in a still), four cake toppings, a Bench case, a Hiring day, a Haggle visitor, the glaze
  bench. Not looked at: Spellshop, Detective's four new places, Dress, Mocktail and Plumber screens with the new words (their longest lines were measured
  against the old longest, not seen). Nothing on a phone.
- The deck keeps its place per phone. A reinstall, or clearing the app's data, starts every deck again.
- Not done: more THINGS to haggle over (each needs drawing; 24 now), new tools or mechanics for the vet, plumber or dentist (the new work uses what is there).
