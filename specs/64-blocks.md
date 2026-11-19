# 64. Block Party

## The idea (set 11: his brief)
A block puzzle, like Block Blast: really simple, calm (intensity 1), and the kind of game people play "one more" of for an
hour. 2D on purpose: a grid of squares reads best flat, like the originals.

## How it plays (one thumb)
An 8 by 8 grid and a tray of three pieces under it. Put a finger on a piece and drag it: it rides above the finger (so the
finger never hides it), and a shadow on the grid shows where it will land. Let go to put it down. When all three are down,
three more come. A full row or column clears; several at once score far more (DOUBLE, TRIPLE...). Clearing again within
your next three placements keeps a COMBO going that multiplies every clear (the dots under COMBO count down).
- Before you let go, the rows and columns the piece would complete light up and turn its colour: the promise of a clear.
- A drop where the piece does not fit sends it back to the tray, free (a person who looks barely does it; it never helps).
- It ends when none of the pieces in the tray fits anywhere ("no room!"). The edges glow red when the grid is getting full.
- Pieces that fit nowhere fade in the tray, so you can see trouble coming.

## Levels and goals
Levels 1-2: a score. Level 3 on: collect GEMS (a gem sits in a block; clear its row or column to take it), with a score
level every third. From level 4: grey junk blocks already on the grid, and as levels rise more gems, a higher score, more
junk and more of the big awkward pieces (3x3, long fives). Gems never share a row or column, so each one is a clear of its
own; more appear as you take them. Four places: Toy Box, Arcade, Beach, Garden. Help after three losses: fewer big pieces.

## Systems
Placing and clearing, multi-line clears, the combo streak, gems, junk, piece sizes by level, stars (clear two lines at once;
use few pieces), coins, the Toy Shop (Reroll: new pieces once a level; Bomb: clear a 3x3 once a level; Kind pieces: a few
more small ones), ranks from Beginner to Legend, best score per level always on screen.

## Controls
Drag a piece from the tray. Power-ups are buttons under the tray; the bomb is tap it, then tap the grid.

## Spamming cannot win
- Blind move: `d` (drag a random piece to a random cell).
- Blind drops only land where they fit, at random: the grid fills without clears and the game ends. Score goals are set
  above what random play ever reaches (random play's best of 1,200 games was about 650; level 1 asks 800); gems need
  separate, aimed clears. Measured: blind strings 0 of 448, random 0 of 480 (see test_play).
- Lessons: every drop must clear (one that fits but does not clear starts the lesson again), and two wrong drops in quick
  succession start it again too, so dragging blind cannot pass.

## Lessons
1. FILL A LINE: a row with a gap, the piece that fills it in the tray; three in a row.
2. TWO AT ONCE: a row and a column that cross at the gap; do it twice.
3. GEMS: a gem in the nearly full row; take three.

## Engagement factors chosen (PLAYBOOK numbers)
P3 near-miss (the grid nearly full, a line one block short, "so close" on the end card); P6 the input answers (the shadow
and the lit lines before you let go); P18 combos (the streak multiplier and the rising chime); P21 tidy-up satisfaction (a
line sweeping away); P13 visible best (best score here, NEW BEST as you pass it).

## Longevity (PLAYBOOK H)
- L1: drag a piece onto a grid: understood at a glance.
- L2: the piece lands with a squash and a clack; a clear sweeps and chimes.
- L3: it only ends when nothing fits, and you can see it coming (faded pieces, red edges).
- L4: the goal and its bar at the top; the combo dots.
- L5: best score per level, always on screen.
- L6: gems, junk and bigger pieces change where you want to put things.
- L7: keep room for the 3x3 or take the double now; where the long piece goes.
- L8: Try again is one tap.
- L9: the Toy Shop's power-ups, your rank.
- L10: your best score on every level.

## Sound (S1-S11)
A soft wooden clack per piece (deeper for big ones, varied each time); a chime chord per clear with more voices for more
lines, stepping up the scale with each combo; a crystal bell per gem; three ticks for new pieces; a soft hollow knock for a
drop that does not fit.

## The card clip
A long piece dragged into a gap, two lines lighting up, then sweeping away with DOUBLE! and COMBO ×3.
