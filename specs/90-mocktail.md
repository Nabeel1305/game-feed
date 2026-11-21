# 90. Mocktail Bar

## The idea (his words, then mine)
His words (20 Nov 2026, idea 24, full text in `specs/his-list-2026-11-20.md`): "play as a mixologist making alcohol-free
mocktails. Customers order drinks, and you choose ingredients, prepare them and serve. If the customer likes the drink, you
succeed; if they dislike it, you fail that order. Drinks become more complicated as you progress." With directions for the
view, controls, the round, early levels, complexity, requests, taste, freedom, preparation, feedback, failure, sound,
vibration and replay; built point by point (below). 3D: you stand behind the counter; the customer sits opposite and their
face shows what they think; the glass you are making is the hero of the picture. The bar's tools sit in a tray below, in 2D,
because bottles and buttons read better flat under a thumb.

## Research (21 Nov 2026; I cannot play these myself, so I studied write-ups, guides and reviews)
- Bartender: The Right Mix (CrazyGames page and guides): click a bottle, hold to pour, hold to shake; the score comes from
  ratios, the glass and the garnish; shaking too long ruins it. What I took: tap a bottle and HOLD a big POUR button, a
  gauge of parts beside the glass, and a glass and garnish that count but count for less than the recipe itself.
- Papa's Freezeria (Flipline wiki and FAQ, Jay is Games): an order ticket, separate stations, and a customer who judges the
  result with a face from enthusiastic to angry, then tips; returning customers and pickier "closers" later. What I took:
  the order card at the top, a face that reacts, tips that grow with a perfect drink, harder customers as levels rise.
- Coffee Talk (RPGFan, Bonus Stage, Push Square, TV Tropes): customers order by name or by description ("something warm and
  sweet"); a recipe book records what you found; Free Brew lets you experiment with no pressure; mistakes are not punished
  harshly. Game Informer's complaint: late requests leave you "fumbling in the dark". What I took: feeling requests from
  level 7, a single ASK question that narrows them down, every feeling order is checked to be solvable with the bottles you
  have, a 📖 recipe book once the card stops showing recipes, and a Free mix mode that saves your creations.

## His directions, point by point
- View and environment: a colourful 3D counter seen from behind; shelves of glowing bottles; the customer on a stool opposite,
  their face (happy, thinking, waiting, sad) and a speech bubble. The tray shows juices, syrups, fizz, fresh herbs and fruit,
  garnishes, four glasses, ice and the tools.
- Controls: tap a bottle to pick it; HOLD POUR to pour and let go to stop; swipe up and down to shake; draw circles on the
  glass to stir; drag a garnish onto the glass (a tap works too). Small wobbles of a finger are forgiven (a swipe needs 26 px
  of travel before it counts, a stir counts only smooth turns).
- Basic round: read the order, choose a glass, pour to the parts, mix, finish, SERVE. One customer at a time.
- Early levels: two-ingredient drinks with the full recipe on the card; the bottles, glass and garnish it needs glow in the
  tray for the first three levels; from level 7 the card shows only the name (📖 shows the recipe), from 15 the book costs the tip.
- Increasing complexity: layers (2), stirring (2), garnishes count (3), muddled mint and crushed ice (4), the shaker (5),
  tonic and grapefruit (6), feelings (7), new drinks every few levels; each new technique gets its own tip the first time.
- Customer requests: exact orders mixed with feelings ("something sour, refreshing and not too sweet"); ASK once for a hint.
- Taste system: every ingredient has sweet, sour, bitter and fruity values, fizz and weight; the verdict is computed from what
  is actually in the glass, so any drink that fits a feeling is liked.
- Creative freedom: feelings accept any fitting mix; named drinks need their ingredients within a tolerance (wider early).
- Satisfying preparation: the bottle tips and a stream pours in its colour; the drink rises; a heavy syrup poured last sinks
  into a layer; stirring or shaking blends the colours; ice tumbles; the glass mists over when it is cold; the garnish sits
  on the rim.
- Useful feedback: "You forgot the mint", "Not enough lime", "Too much syrup", "It should be shaken", "Do not stir it: the
  layers are gone"; on a retry the full recipe shows.
- Fair failure: tolerances on every part; a failed drink is that order only, with an instant retry of the same order; a
  shift fails only after three (later two) drinks are sent back.
- Sound and music: soft lounge chords and a brushed beat (music switch); ice clinks, a pour whose pitch rises as the glass
  fills, the shaker rattle, a spoon on glass, the muddler's thud, a bell, chatter, a happy "mm".
- Phone vibration: a tick when a glass is placed, ice drops or a garnish lands, a light pulse at six shakes and a happy
  customer; all through the Vibration switch.
- Progression and replay: new drinks, bottles, glasses and garnishes open by level; four places (corner café, rooftop,
  beach bar, hotel lounge); counter looks opened by stars; a bar shop (measuring jigger, tip jar, fairy lights); ranks from
  Glass washer to Legend of the bar; Free mix saves up to twelve creations with their taste.

## His rules for every game (20 Nov 2026), kept
- The tray and big POUR and SERVE sit low under the thumb, the glass and customer above; three short lessons (skippable);
  autosave, pause (a pour stops); the verdict says what to change; separate Music, Sound effects, Vibration; original drinks,
  places and people.

## Levels: very easy first, then harder for ever (LESSONS rule 0)
Levels 1-3: two orders, three chances. Then three to six orders and two chances, tighter tolerances, recipes hidden, feelings
with three wants from 12. Robots: ordinary player wins 100% at 1-3 and about 90% at 40; a sharp one about 100%.

## Spamming cannot win (LESSONS rule 1)
- Blind moves: `g` a random glass (and ice), `b` a random bottle and pour, `u` stop, `x` a random tool and garnish, `s` serve.
  25,920 blind games, none won; random play 480, none. You must read the order and pour to the marks.

## Lessons of the first three levels
1. POUR TO THE MARKS. 2. GLASS AND ICE. 3. THE FINISHING TOUCH. Each ends with a liked drink; a wrong one says why and you try again.

## Engagement factors chosen (PLAYBOOK)
- P4 Fair, readable failure: the customer says exactly what was wrong; the recipe shows on the retry.
- P6 Every input answers back: each tap clinks, pours, rattles or ticks; the gauge rises in the drink's colours.
- P12 Celebrations scaled: a smile and a coin for a good drink, a burst and "SHIFT DONE!" for the shift, three stars for no misses.
- P15 Nested goals: this drink, this shift, stars, counter looks, rank, and your own saved creations.

## Longevity (PLAYBOOK H)
- L1 Make what they asked for. L2 Tap, hold, swipe, circle. L3 Tolerances, reasons, retries. L4 The order in front of you.
- L5 Stars, tips and best per level. L6 New techniques and feelings change what you do. L7 Which mix fits a feeling; book or memory.
- L8 Retry the same order at once. L9 Counter looks and saved creations. L10 Best tips per level.

## The card clip: its most exciting moment
A grenadine stream sinking into a red layer under orange, the cherry dropped on, and the customer's face lighting up.
