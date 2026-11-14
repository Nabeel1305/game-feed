# Game 5: Zenith (superhero rescue patrol)

Nabeel's brief: a flying superhero (not a real one; our own name) who sits at his little place, gets alert after alert, flies there, helps, wins the mission, and it just keeps going. Fly, rescue someone from a tree, beat a bad guy, fight a monster, laser eyes, super strength, super villains. Many missions, made cheaply by mixing things together; exciting and fun; the sound of flying.

## Identity
- Hero: **Zenith**, guardian of **Brightwater City**. Teal suit, gold cape, a gold "Z" bolt emblem, dark domino mask, laser eyes. (Deliberately not the blue-suit / red-cape / chest-shield look of any real hero.)
- Home: a rooftop hideout with a beacon light, hero sitting on the ledge over the night city.
- Signature moment (P30): the **"SAVED!" stamp** with a rising three-note hero horn and the hero's cape flourish. Signature sound: the flying whoosh that rises as he takes off.

## Flow (one patrol = one level)
Home -> alert card (radio crackle, mission text, auto-launch after ~2.5 s or tap) -> flight (3.4 s, steer through gold rings, rising chimes, can't fail) -> mission (one-word verb shown: CATCH! ZAP! FIGHT! BLOW! LIFT! DODGE & ZAP!) -> SAVED! / missed stamp (1.5 s, tap to skip) -> next alert straight away -> ... -> patrol card.
- Missions per patrol: 3 (L1-2), 4 (L3-6), 5 (L7-15), 6 after. Within a patrol each mission is a little harder.
- City trust: 3 hearts per patrol. A failed mission costs a heart; at 0 the patrol ends. Stars: 3 = no fails, 2 = one, 1 = two.
- Every 5th level ends with a giant monster, every 10th with a super villain.
- Never the same mission type twice in a row (P26 variety).

## Mission generator (cheap, endless)
Each mission = **template (the gameplay)** x **who/what** x **place (scene + time of day)** x **twist (difficulty knobs)**. Text and looks are built from lists, so thousands of combinations cost almost nothing.
| Template | Verb | Play | Mixed from |
|---|---|---|---|
| Catch | CATCH! | People fall from a perch; slide to fly under and catch them | 20 people/animals x 6 scenes x perches (tree, crane, Ferris wheel, scaffold, cliff...) x count, drift, zigzag |
| Zap | ZAP! | Hold to aim laser eyes at falling threats before they hit the city; heat meter | 8 threats (meteors, drones, hail, space junk, robot bees...) x places x speed, size, splitting, helicopters to avoid |
| Fight | FIGHT! | Tap bad guys before their glowing punch lands; don't tap the scared bystanders | 10 gangs x 8 crimes x places x how many at once, big brutes |
| Fire | BLOW! | Hold on burning windows to blow them out with super breath; breath meter | 10 buildings x places x fire growth and spread |
| Lift | LIFT! | Hold to lift a hanging vehicle; slide left/right to keep it level; gusts | 10 vehicles x edges x wobble, gusts |
| Monster / Villain | DODGE & ZAP! | Flick left/right to dodge telegraphed attacks across 3 lanes; laser the glowing core when it opens | 10 types x 6 creatures (monsters); 8 titles x 10 themes (villains) |

## Difficulty
- Curve f = L to 60, then 60 + 15*log1p((L-60)/15). Learning factor e = (6-L)/5 on levels 1-5 (bigger catch zones, slower falls, longer warnings, more hearts on the hero).
- Anti-cheat per template: Catch has a hero speed limit and spread-out fallers; Zap uses a small focus point plus a heat meter, so sweeping overheats; Fight has bystanders and whiff recovery, so tap-spam hurts; Fire has a breath meter; Lift is unstable, so you must steer; Boss means armour blocks the laser except when the core is open, flicks have recovery, and the laser has heat.

## PLAYBOOK principles chosen
P5 one-word verb per mission; P6/P7 juice and hit-stop (punches, catches, boss defeat); P18 rising chimes for flight rings and catches; P26 variety rhythm; P13 personal best (longest saved-in-a-row streak) plus a lifetime "citizens helped" count; P12 scaled celebrations (SAVED! stamp, bigger fanfare for monsters/villains and patrol complete); P2 disclosed help after 3 straight patrol losses (more reaction time only). Sound rules S1-S11 throughout. Rare surprise P17: a golden "famous rescue" (the mayor's prize-winning goat, a baby dragon...) about 1 in 25 missions.
