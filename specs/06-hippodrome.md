# Game 6: Hippodrome (Greek four-horse chariot racing)

Nabeel's brief: hippodrome racing like the one in Assassin's Creed Origins, but Greek. Seen from behind your own chariot (not from above), racing against a field of others. Two thumbs. Tap to spur the horses. **Turning the corners must be a skill you master with your thumbs**: easy and explained at first, a real skill as the levels climb ("press with one thumb and drag with the other"). A leaderboard that always shows who is first and where you are. Greek names. Fun for hours, engagement factors built in.

## Research notes (Nov 2026)
- The Greek four-horse race was the **tethrippon**, in the Olympics from 680 BC; one driver per chariot; raced **counter-clockwise** around a turning post (the **nyssa**); lots were drawn for the lanes; everyone fought for the inside line and most crashes happened at the post. The Romans made it bigger later (the circus), but ours is Greek.
- Assassin's Creed Origins (Lageion Hippodrome): camera close behind the chariot, start and tight turns decide the race, chariots can clash.

## Identity
- Title: **HIPPODROME**. Tagline "Four horses · one wreath". Display font Caesar Dressing, a Greek-key line, marble / gold / terracotta / Aegean blue.
- You drive the white team (four white horses, crimson and gold chariot) so you can always find yourself.
- Signature moment (P30): **the perfect turn**: reining in, hugging the post with the hub almost grazing it while the crowd roars, then whipping away. Signature sound: the four-beat gallop with the whip crack landing on its accent, each perfect crack one note higher.

## Controls (two thumbs)
- **Left thumb = the reins.** Slide left or right to steer (works anywhere on the left half, floating origin).
- **Right thumb = the whip.** Tap to crack the whip. **Hold = rein in** (slow the team).
- The turn uses both at once: hold the right thumb to rein in, drag the left to carry the team round the post, release and whip out.
- Laptop: arrows steer, space whips, down arrow reins in.

## How it plays
- **The whip beat.** The gallop has a beat (a ring closes on the whip button, the hoofbeats accent it). A crack on the beat is PERFECT: more speed, less tired horses, and a chain that climbs in pitch. Off the beat the horses balk and tire. The horses' **wind** is a budget: whip too often or badly and they are blown (slow for three seconds).
- **The turn.** In the half-circle the team is thrown outward, harder the faster you go and the tighter your line. You must steer in against it. Too fast for your line and you slide wide: a slide throws away the pace the whip built, the team cannot pull while it slides, and at speed you meet the wall. Too fast with the reins hard over and the inner wheel lifts ("WHEEL UP! EASE OFF"); keep it up and the chariot goes over. Steer too far in and you strike the post. The inside line is the fast one, so the best turn is: rein in late, hold the post close, whip out. Each turn is timed and graded (PERFECT / GOOD / WIDE / SCRAPED) with the real time and the real clearance from the post; a PERFECT gives the horses a little wind back.
- **Passing.** Rivals turn in one lane off the post and close on it by the middle of the turn. A team close behind that turns tighter takes the inside and the place. If you run wide, they do it to you. On the straights a faster team goes round a slower one.
- **Traffic.** 4, 6 or 8 chariots. Wheels clash side to side, you can be held up behind a slower team, wrecks stay on the track for a couple of seconds. A rival close to the camera turns ghostly so it never hides your own team.
- **The start.** Lots are drawn for the lanes (the favourite keeps the inside). Three trumpet notes, then GO. A crack right on GO is a flying start; a crack before it is a false start (the team rears).
- **Winning.** Finish in the top places to unlock the next race (top 2 of 4, top 3 of 6 or 8). First place is 3 stars and the wreath. Every 10th race is against a champion of legend on Mount Olympos: you start beside them and only a win will do.
- **The board.** Your place is always top left (gold when first); the live order with every name is top right, your row highlighted. At the finish the rest of the field is run to the line out of sight, so every gap shown is the real one.

## Levels (they never stop)
- Curve f = L to 60, then 60 + 15*log1p((L-60)/15). Rival skill = min(0.92, 1 - exp(-(f+3)/24)): it tops out around race 57, where the favourite drives like a near-perfect player. Learning factor e = (7-L)/6.
- Races 1-6 are for learning, with fading help up to race 10: the team slows itself before the turn (fading out by race 8), a safety net steadies it inside the turn (gone after race 10), the outward throw is weaker, the beat window is wide, a gold line shows the tight way round the post, the braking zone is painted on the sand, coach lines explain one control at a time. No post wrecks before race 6; no wall wrecks or tipping before race 8.
- Fields grow 4 -> 6 (race 6) -> 8 (race 15). Laps 2 -> 3 (race 3).
- Rivals get faster (how hard they drive), corner closer to the limit, take tighter lines, misjudge fewer turns, and from race 12 the favourite covers the line of whoever is coming up behind. The field always has a spread: the back-markers can be passed at any level.
- Variety (P26): 12 venues (Olympia, Delphi, Isthmia, Nemea, Athens, Sparta, Thebes, Syracuse, Rhodes, Alexandria, Kyrene, Troy) each with its own sky, far scenery, sand, track length and turn tightness, plus Mount Olympos for the champions (Antilochos, Eumelos, Diomedes, Oinomaos, Pelops, Hippolyte, Phaethon, Ares, Poseidon, Helios). Rivals are named from lists of Greek names x city-states x team colours x horse coats.

## Engagement factors (PLAYBOOK)
The five that define this game:
- **P18 chains:** perfect whip cracks climb in pitch and count up; perfect turns chain too.
- **P4 readable failure:** painted braking zone and gold line on the learning levels, dust and lean before the wall, "WHEEL UP!" before the chariot goes over, the wind bar flashing before the horses are blown.
- **P3 honest near-miss:** the real gap at the finish, the real turn time, the real clearance from the post in metres.
- **P12 celebrations scaled:** overtake call -> perfect turn (gold flash, crowd) -> the wreath, petals and slow motion for a win.
- **P13 personal bests:** race time and best lap per level, longest whip chain; "NEW BEST" only when an earlier best was beaten.

Supporting touches: P1 one ramp (rival skill) and short races; P2 disclosed help after 3 straight losses (rivals drive a touch slower, rules unchanged); P5 one coach line at a time; P7 hit-stop only on wrecks and slow motion only at the finish (racing must flow); P8 camera kick and banking into turns; P16 clear end card, nothing auto-continues; P17 a rare eagle over the arena. Sound rules S1-S11 and the haptic vocabulary throughout; everything readable with the sound off.

## Proven by bots (`games/hippodrome/test_sim.py`)
- Doing nothing, hammering the whip, hammering the whip while hugging the inside, and riding the outer wall lose at every level.
- Never reining in (inside, middle or the long way round) and never whipping get through the learning races, then lose from about race 10.
- A first-timer (random whip, never reins in, soft steering) gets through races 1-5.
- A human-speed driver (55 ms beat error, 12% misjudged turns) gets through nearly every race to 18, about half the time at the race 20 champion, and fades through the 30s; with help on, about half the time at race 30.
- A practised driver gets through to about race 45; a very good one gets through 75-90% of races at the top; a near-perfect one wins every champion race.
