# Game 4: Sword Fight (working title "Steel & Honour")

Requested by Nabeel on 2026-11-14. Build this next. Follow LESSONS.md (taste, rules, testing). Closest existing game for code reuse: **Knockout** (first-person fighter, telegraphed attacks, gestures, stamina, anti-spam, rounds, level grid).

## His words (the brief)
- A simple sword fight, medieval England, knights. Rounds that keep going: beat one opponent, go to the next. Endless, easy at first, harder forever.
- You only have a sword, **no shield**. You block by striking: when he attacks, you swing your sword right where his attack is coming, at the right moment, and your blades clash. That is the block (a parry).
- You can also **dodge** with your body, **strike** him, and **poke** (thrust).
- "Think about everything, make the game nice."
- **Variety of characters:** don't use a short fixed list. Combine long lists of names, titles, epithets and accessories so opponents rarely repeat.

## Proposed design (show him, then adjust)
- **View:** first person, like Knockout. You see the opposing knight and your own sword arm/blade at the bottom. Setting: tournament lists or a castle courtyard (stone walls, banners, torches, crowd), drawn in perspective and extending past the screen edges.
- **His attacks are telegraphed by direction:** slash from his right (comes at your left), slash from his left (your right), overhead chop, thrust to the chest, and later low cuts and feints. A gleam on his blade and a short trail show the line before it lands.
- **Parry = swipe your sword along the same line at the right moment** (e.g. his slash coming at your left -> swipe toward the left; overhead -> swipe up; thrust -> quick flick across the centre). Timing window shrinks with level. A **perfect parry** (tight timing) staggers him and opens a riposte window (bonus damage). Wrong direction or late = you get hit.
- **Your attacks:** swipe across him = slash in that direction; tap on him = thrust/poke (fast, light). He parries or dodges depending on level; repeat the same attack and he reads it (anti-spam, like Knockout).
- **Dodge:** swipe down = step back out of reach (works against everything but costs stamina; a later-level lunge can still catch you).
- **Stamina** for both; swinging wildly drains you and he punishes it with combos. Clash sparks, metal ring sounds (synthesized), screen shake on hits; armour dents and shows damage.
- **Rounds:** first to 2 rounds early on, longer bouts and best of 5 later; boss knights every 10th level (champions, the Black Knight etc).
- **Win/lose moments:** short and skippable (tap). Win: he drops to one knee / his sword flies, a short heraldic trumpet fanfare. Lose: you're knocked down, quick fade.

## Character generator (much bigger variety)
Combine, seeded by level, so each opponent is a new mix:
- Titles: Sir, Dame, Lord, Lady, Baron, Earl, Squire, Brother, Captain, Prince, Duke...
- First names (60+): Aldric, Bertram, Cedric, Edmund, Godfrey, Gawain, Hugh, Osric, Percival, Roland, Tristan, Wulfric, Isolde, Matilda, Rowena, Eleanor, Gwendolyn, Beatrice, Agnes, Edith...
- Epithets (40+): the Bold, the Grim, Ironhand, the Unbroken, Lionheart, the Red, Oathkeeper, the Silent, Stormborn...
- Places (40+): of Wessex, of York, of Cornwall, of Northumbria, of the Marches, of Avalon, of Lindisfarne...
- Look: helmet type (great helm, bascinet with visor, kettle hat, sallet, open-face with beard, crowned helm, horned helm), plume colour/none, armour metal tint (steel, blackened, gilded, rusty), tabard colours and heraldic charge (lion, eagle, cross, chevron, stag, dragon, fleur-de-lis, stripes), cape, gauntlets, sword type (longsword, broadsword, falchion, claymore, sabre), sword pommel/gem, scars/eye patch when the face shows.
- Bosses get special combos and names (the Black Knight, the Green Knight, the Lionheart Champion...).

## Done when
- Spammer bot (same slash over and over) loses past the early levels; a smart bot (parries on time in the right direction, attacks when he's open) wins early and keeps a chance at the top.
- Clean home (Play / Choose level / Rules), level grid with stars, saves under its own storage prefix (suggest `sw.`).
- Then add to games.json as number 4.
