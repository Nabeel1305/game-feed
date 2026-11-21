# 94. Metro Map

## The idea (his words, then mine)
His idea 19 (20 Nov 2026): "manage a city's metro system, designing train routes that get passengers to their destinations as
quickly as possible", with his directions (specs/his-list-2026-11-20.md). Mine: a calm, clean planning game in 2D. A city grows
on a paper map; you draw coloured lines between stations; passengers (little shapes) ride to the kind of place they want and
change lines on their own. Lines, trains and river bridges are limited, and every week brings a new train and a choice.

**2D, not 3D:** it is a map. Reading every station, queue and line at a glance is the whole game; a 3D view would hide them.

## Research (I cannot play other games; I read about the best of the genre)
- **Mini Metro** (Dinosaur Polo Club), the model of the genre. Android Central: stations are shapes, passengers queue as
  smaller shapes showing where they want to go; at the end of each week a new train plus a choice of upgrade (tunnels for
  water, a carriage, a new line, a bigger station); an overcrowded station for too long ends the game.
  https://www.androidcentral.com/mini-metro-retro-review
- Pocket Gamer: water must be crossed with bridges or tunnels; an overcrowded station ends the game after about 45 seconds;
  the weekly upgrade "can completely change your strategy"; the fun is re-arranging under pressure as new stations appear.
  https://www.pocketgamer.com/articles/071794/mini-metro-review-a-smart-and-satisfying-transportation-puzzler/
- Transit Map's review: the sound is the whirr of little trains, a ping as a commuter arrives, a warning chime at a crowded
  station. https://transitmap.net/mini-metro-review
- Wikipedia: an endless mode where you cannot lose. https://www.Wikipedia.org/wiki/Mini_Metro_(game)
- What reviewers disliked on touch screens (Gaming Trend, WCCFTech): drawing and especially *erasing* lines is finicky; it is
  easy to pull a station off a line by accident. https://gamingtrend.com/reviews/metro-mania-mini-metro-review/ ,
  https://wccftech.com/review/mini-metro-having-fun-public-transport/
- Mini Motorways (same makers, App Store page): endless mode as the stress-free option, upgrades picked to fit the network.

**What I took:** shapes for places and passengers, the weekly train + choice of two, bridges as the river limit, the ring that
fills slowly before a station closes the metro, calm chimes. **What I changed for a phone:** shortening a line is a *tap on
its end tab* (no fiddly erase drag), and nothing is built unless you let go *on a station*, so a slip never wrecks a line.
Each level is a fixed city with a goal (carry N passengers before the last week ends), so there is a near goal on screen.

## How it plays (one thumb)
- **Drag from station to station** (through as many as you like), let go on a station: a new line, and a train starts on it.
- **Drag from a line's end** to a station: the line is extended. **Drag the middle of a stretch** onto a station: the line is
  routed through it (his "drag an existing line to reroute it").
- **Tap a line**: put a spare train on it. **Tap its end tab**: shorten it (a two-station line is taken up, its train comes back).
- **Tap a station**: a card says how it is doing and *why* it struggles (no line, no route to a shape, no train, too busy).
- Bottom bar: lines (filled = in use, ring = free), spare trains, bridges left, and a ▶/▶▶ speed button. Pause top centre.
- Track works: a changed line's trains stand for a few seconds, so re-drawing has a cost.

## His directions, point by point
- *Clean 2D map, neighbourhoods, a river, stations, recognisable destinations*: paper map with soft blocks and parks, a river
  band from level 2, six kinds of place (homes ●, offices ■, schools ▲, the stadium ★, the hospital ✚, the market ◆).
- *Drag to create, drag to reroute, tap to add a train, pause and speed*: as above.
- *Passengers as small coloured symbols; queues and crowding readable at a glance*: shapes beside each station, the ones over
  the station's room in orange; a ring fills round a crowded station and pulses when it is half full.
- *A few stations and one line, growing gradually*: three stations, one line on levels 1-2; new stations every 11-16 s.
- *Average waiting time, crowding, busiest connections; struggles inspectable*: the wait is in the top bar, the busiest
  stretch glows, the tap-a-station card, and the end card names the station that closed the metro and the busiest stretch.
- *Limited trains, lines and river crossings; extend or connect*: all three are counted in the bar; every week one choice
  out of two (a line, a train, two bridges, a carriage, bigger stations).
- *Transfers automatic; bad transfers cost time*: passengers get off where another line takes them closer and wait again
  (their wait counts towards the average, so badly placed changes show in the wait figure).
- *Growth, rush hours, temporary closures, warned first*: rush hours from level 3 ("RUSH HOUR IN 6"), closures from level 6
  (the station blinks and "CLOSING SOON" six seconds before).
- *Fair failure*: the ring takes about 30 s to fill (38 s with help), a new station fills at half speed for its first 25 s.
- *Calm music, gentle train sounds, subtle warnings*: soft electric-piano chords, two-note chimes as trains stop, one low
  pulse for a warning at most every 1.5 s.
- *Layouts, fixed challenges, endless, animated summary*: each level is its own city and river; 🚇 Endless has no target and
  no last week; the end card draws the passengers carried week by week as a line that draws itself.

## Levels: very easy first, then harder for ever (LESSONS rule 0)
Target 42 at level 1, +12 a level to level 10, then +1 a level (at most 190). 4 weeks on levels 1-3, 6 weeks after. Passenger
rate and new stations speed up with the curve; the 4th, 5th and 6th kinds of place arrive at levels 4, 7 and 11.

## Spamming cannot win (LESSONS rule 1)
- Blind moves (BLIND in part2): `d` a random drag between two random spots, `t` a random tap, `c` either weekly card.
- Nothing is built unless the drag ends on a station; every change stops that line's trains for 4 s; and the level must be
  done before the last week ends. Robots: every blind string of up to four moves, 5,696 games, won 0; random moves, 480, won 0.

## Lessons of the first three levels
1. DRAW A LINE (drag through the three stations). 2. REACH THE NEW STATIONS (extend three times). 3. MORE TRAINS (tap the line
while a crowd grows). Blind tapping for 90 s neither finishes nor loses one.

## Engagement factors chosen
P4 fair, readable failure (the ring fills slowly with a warning; the end card and the tap-a-station card say why), P14
goal-gradient bar (carried / target and the week bar always on screen), P20 gentle palettes (paper map, soft colours, calm
music), P22 minimal UI (one bottom bar; everything else is the map itself). Sound rules S1-S11 (each sound varied, short, gated; warnings soft). Longevity L1-L10: L1 the lessons; L2 let go on a station;
L3 crowds build slowly with warnings; L4 the target and week bar; L5 best coins per level, stars for a short average wait;
L6 rivers, rush hours, closures, new places; L7 the weekly choice; L8 Try again at once; L9 your map paper (six, by stars)
and the depot upgrades; L10 your best per level on the home card.

## The card clip: its most exciting moment
A rush hour on a busy map: trains full of shapes running on three or four lines over the river, a ring filling and the
player adding a train.
