# 7. Bandit (fighter-jet dogfight)

**His brief (15 Nov 2026):** "dogfighting, fighter jet dogfighting. This one should be a bit hard. The first level should just be teaching you... It's just two fighter jets. You see your enemy, you try and shoot them down. You can try to maneuver. You can do flares. If there's a missile locked onto you, you can try to maneuver, and you have to do a flare to get it off of you, and then you turn around, and then you shoot them back... make it look realistic as you can... maybe this one is two thumbs. You control the fighter jet with one thumb, shoot with the other. You need to lock onto the enemy, shoot them. They can dodge, you can dodge too... Top Gun... above the clouds... the levels keep on getting harder, infinitely."

**Verb:** dogfight. **Signature moment (P30):** MISSILE! in the mirror, you haul the jet over, tap FLARE as the ring closes, the flare blooms behind you, EVADED!, and he flies past into your ring. **Signature sound:** the lock ticks climbing into the two-note "locked", then the launch.

## The view
Seen from just behind and above your own jet (every game of his so far is first-person or just-behind). A sky with a low sun, a floor of cloud that runs to the horizon, heaps of cloud standing on it, the horizon tilting as you bank. Jets are built from flat pieces, lit by the sun, with burning engines, wingtip vapour in hard turns, smoke when damaged. The enemy is drawn 2.3 times life size so a jet half a kilometre off still reads as a jet.

## Two thumbs
- **Left: fly.** A stick that appears wherever the thumb lands on the left half. Push toward where the nose should go (up = climb). Further = harder turn; hard turns cost speed.
- **Right: FIRE and FLARE.** Two big buttons; a touch anywhere on the right half counts for whichever is nearer. FIRE with a lock sends a missile (two on the rails, each back after 3.6 s); held, it fires the cannon (short range, overheats). FLARE drops one (three, each back after 7 s).

## The rules of the fight (game rules, tuned for play)
- **Lock:** hold him inside your ring for 0.75 s, from behind him (within about 97 degrees of his tail). From the front the ring says so. His lock on you works the same way, so danger always comes from behind: that is what the mirror is for.
- **A missile always arrives unless a flare takes it.** A flare takes it only if dropped inside a window before it arrives, while turning hard. The window is shown as a ring closing on the FLARE button (green NOW inside it). Too early / too late / not turning are said out loud. The same rule holds for him: he needs his reaction time, then a hard turn, then a flare he may fumble; after a flare he cannot drop another for 1.7 s, so a second missile straight behind the first gets through. The closer you are behind him, the less time he has.
- **His rhythm:** you behind him = he weaves; after a while he hauls round and makes an attack run (he flies at his very best for 9 s and holds back so as to stay on your tail); when he fires he flies on straight for a few seconds, which is your opening.
- **Damage:** his missile takes 34 of your 100 on sorties 1 to 3, then 55. Yours takes 100 of his 100 (an ace has 200). Cannon chips.
- **Ending:** every bandit down = win. Shot down or out of fuel (120 s a bandit) = lose. Chasers get a burst of speed from far back, so nobody can run away.

## Levels (`makeCfg`)
One number `f = curve(L)` sharpens him: how hard he pulls, how hard he weaves, how soon he turns on you, how long he needs to lock (3.6 s at sortie 2 down to about 1 s), how fast his missile flies, how quickly he reacts to yours, how many flares he carries and how often he times them right, second missiles from sortie 15, cannon from sortie 4. Your flare window shrinks from about 1.8 s to 0.34 s. Sortie 1: he only flies. Sortie 2: he starts behind you (the flare lesson, no hard turn needed). Sortie 3: he has one flare. One bandit to sortie 5, two to 19, three after; an ace alone every tenth. Stars: no missile hits = 3, one = 2.

## Engagement factors chosen
P4 readable failure (mirror, lock bar, MISSILE!, the closing ring, why a flare failed); P5 teach by doing (three learning sorties, one coach line); P7/P8 hit-stop, slow motion, shake, smoke that stays; P3 honest near-miss (how much of his jet was left, what the last flare did wrong); P13 bests (fastest sortie, run of sorties won); P2 disclosed help after three losses (he locks slower, his missiles fly slower, he flies straight longer; rules unchanged). Always: sounds S1 to S11 (23 recipes, offline check), P6, P10/P11, P23.

## Proven by bots (`games/bandit/test_sim.py`)
Hands off, hammering both buttons, and running away lose from sortie 2 (sortie 1: out of fuel). One endless hard turn wins only on sorties 2 to 3. Never flaring, or flaring the instant a missile shows, is fine to about sortie 12 and fails after 20. A first-timer gets through 1 to 8. A 0.3 s player: all of 1 to 12, most of 20 to 45, some at 60 and 90. Bots time their flares better than people will: expect it to play harder than this.
