// ===================== RULES: Spellshop (game 50, his idea) =====================
// You are the town's magician. People come in with their troubles, and the story they tell holds the clues: the words point to
// the jars (every ingredient always means the same thing: rose is love, moonwater sleep, salt protection...), whether the magic
// must draw something IN or drive it OUT, what it acts on (the heart, the mind, the body, the home, fortune, the road), and how
// strong it should be. You brew it by hand: pick the jars, pour as much as they need, stir the right way round, trace the rune,
// and seal it when the brew glows the right colour. A good spell sends them off happy (and they come back on later days with
// thanks and new troubles). A spell a little wrong goes funny: they come back the same day with a side effect, and you get one
// chance to put it right. A spell badly wrong: they come back furious, and the day is lost.
const RULES = [
  'Read their <b>story</b>: the words are clues. Every jar always means the same thing (🌹 love, 🌙 sleep, 🧂 protection...).',
  'Pick the <b>jars</b>, then brew: <b>pour</b> as much as they need, <b>stir</b> clockwise to draw it IN or anticlockwise to drive it OUT.',
  'Trace the <b>rune</b> for what it acts on: ♥ heart, 👁 mind, ✋ body, ⌂ home, ◎ fortune, ✦ the road. <b>Seal</b> it when it glows the ring\'s colour.',
  'A spell a little wrong goes <b>funny</b>: they come back and you can fix it. Badly wrong, they <b>complain</b> and the day is lost.',
  'Your <b>Grimoire</b> keeps every meaning you have learned. Happy customers come back with thanks.',
];
// the jars: each always means one thing; rarer ones arrive as the levels go on
// A DECK THAT REMEMBERS (25 Nov 2026, his words: "way more combinations... something novel each time. Someone can play this game for years, and they only
// see something similar to something else only, like once in a blue moon"). deal(name, n) gives the next of n things in a shuffled order that is KEPT ON THE
// PHONE: nothing comes round again until everything else in its list has, today or next month. dealIf() is the same for a list where only some fit just now
// (the rest go back under the deck). In the robots' fast games (HEADLESS) it is plain luck from the game's own dice, so a seed still gives the same game.
const DECKS = {};
function deal(name, n, R) { if (n <= 1) return 0; if (typeof HEADLESS !== 'undefined' && HEADLESS) return (R() * n) | 0;
  let q = DECKS[name]; if (!q) { try { q = store.get('deck.' + name, null); } catch (e) { q = null; } q = DECKS[name] = Array.isArray(q) ? q.filter(i => i >= 0 && i < n) : []; }
  if (!q.length) { for (let i = 0; i < n; i++) q.push(i); for (let i = n - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, t = q[i]; q[i] = q[j]; q[j] = t; } if (DECKS['<' + name] === q[n - 1] && n > 2) { const t = q[0]; q[0] = q[n - 1]; q[n - 1] = t; } }
  const i = q.pop(); DECKS['<' + name] = i; try { store.set('deck.' + name, q); } catch (e) {} return i; }
const dealOf = (name, list, R) => list[deal(name, list.length, R)];
function dealIf(name, list, ok, R) { if (typeof HEADLESS !== 'undefined' && HEADLESS) { const L = list.filter(ok); return L[(R() * L.length) | 0]; }
  const back = []; let got = -1; for (let k = 0; k < list.length * 2 && got < 0; k++) { const i = deal(name, list.length, R); if (ok(list[i], i)) got = i; else back.push(i); }
  if (back.length) { const q = DECKS[name]; for (const i of back) if (i !== got && !q.includes(i)) q.unshift(i); try { store.set('deck.' + name, q); } catch (e) {} }
  return got < 0 ? list.filter(ok)[0] : list[got]; }
const INGS = [
  { id: 'rose', name: 'Rose petals', icon: '🌹', means: 'love', n: 1, side: 'everyone at the market keeps proposing to me' },
  { id: 'moon', name: 'Moonwater', icon: '🌙', means: 'sleep and dreams', n: 1, side: 'I fell asleep in my soup. Twice' },
  { id: 'thistle', name: 'Thistle', icon: '🌵', means: 'courage', n: 1, side: 'I challenged a goose to a duel. I lost' },
  { id: 'gold', name: 'Gold leaf', icon: '✨', means: 'luck and fortune', n: 1, side: 'I keep finding buttons. Four hundred buttons' },
  { id: 'mint', name: 'Mint', icon: '🌿', means: 'health', n: 1, side: 'my breath could freeze a pond' },
  { id: 'salt', name: 'Sea salt', icon: '🧂', means: 'protection', n: 1, side: 'nothing can touch me. Not even my spoon' },
  { id: 'ash', name: 'Ash', icon: '⚱️', means: 'forgetting and endings', n: 2, side: 'I forgot my own cat\'s name. And the cat' },
  { id: 'sage', name: 'Sage', icon: '🍃', means: 'clear thinking and memory', n: 2, side: 'I remember every word of every song. Ever' },
  { id: 'honey', name: 'Honey', icon: '🍯', means: 'friendship and sweet words', n: 3, side: 'the bees follow me home now' },
  { id: 'feather', name: 'Feather', icon: '🪶', means: 'travel and freedom', n: 3, side: 'I float a little on windy days' },
  { id: 'iron', name: 'Iron filings', icon: '⚙️', means: 'strength', n: 5, side: 'I bent the door handle saying good morning' },
  { id: 'silk', name: 'Spider silk', icon: '🕸️', means: 'keeping and binding', n: 5, side: 'I am stuck to my favourite chair' },
  { id: 'acorn', name: 'Acorn', icon: '🌰', means: 'growth', n: 7, side: 'my beard grows an inch an hour' },
  { id: 'rain', name: 'Raindrop', icon: '💧', means: 'rain and tears', n: 7, side: 'a little grey cloud follows me about' },
  { id: 'mirror', name: 'Mirror shard', icon: '🪞', means: 'truth', n: 9, side: 'I told my mother-in-law what I think of her stew' },
  { id: 'ember', name: 'Ember', icon: '🕯️', means: 'warmth and passion', n: 9, side: 'my hat has caught fire twice today' },
];
const RUNES = [
  { id: 'heart', icon: '♥', name: 'the heart', n: 1, pts: [[0, 0.35], [-0.42, -0.1], [-0.2, -0.38], [0, -0.15], [0.2, -0.38], [0.42, -0.1], [0, 0.35]] },
  { id: 'eye', icon: '👁', name: 'the mind', n: 1, pts: [[-0.45, 0], [0, -0.28], [0.45, 0], [0, 0.28], [-0.45, 0]] },
  { id: 'hand', icon: '✋', name: 'the body', n: 1, pts: [[-0.3, 0.38], [-0.3, -0.38], [0.3, -0.38], [0.3, 0.38]] },
  { id: 'house', icon: '⌂', name: 'the home', n: 2, pts: [[-0.35, 0.38], [-0.35, -0.05], [0, -0.4], [0.35, -0.05], [0.35, 0.38]] },
  { id: 'coin', icon: '◎', name: 'fortune and things', n: 4, pts: [[0, -0.4], [0.38, 0], [0, 0.4], [-0.38, 0], [0, -0.4]] },
  { id: 'star', icon: '✦', name: 'the road and the world', n: 4, pts: [[0, -0.42], [0.12, 0.38], [-0.38, -0.12], [0.38, -0.12], [-0.12, 0.38]] },
];
// the troubles: [jar, IN or OUT, rune, the story (**clue words**), a second jar if the spell needs two, other jars that would also
// work (with what happens then)]. Names and amounts are added when a customer comes in.
const TROUBLES = [
  ['rose', 'in', 'heart', 'There\'s a baker I **adore**. I want her to **love** me back.'],
  ['rose', 'out', 'heart', 'A man follows me everywhere with poems. I need his **love** for me **gone**. Kindly.'],
  ['rose', 'in', 'house', 'My wife and I just argue at home. I want the **love** back **under our roof**.'],
  ['moon', 'in', 'eye', 'I haven\'t **slept** in weeks. My **head** won\'t stop spinning.'],
  ['moon', 'out', 'hand', 'My son **sleeps** all day. I need him **awake** and his **legs** working for the harvest.'],
  ['moon', 'in', 'heart', 'My little one has **nightmares** and **cries** for me. I want her **dreaming** sweetly.', null, [['salt', 'She sleeps safe now, though she says the dreams still knock']]],
  ['moon', 'out', 'house', 'Something in my **house** keeps everyone **dozing off**. Even the dog. **Drive it out**.'],
  ['thistle', 'in', 'heart', 'I\'m too **scared** to speak at my sister\'s wedding. Give me **courage**.'],
  ['thistle', 'in', 'hand', 'I freeze up when I see the **bull**. My **body** won\'t move. I need **nerve**.'],
  ['thistle', 'out', 'eye', 'My husband is **brave** to the point of **madness**. He wants to wrestle a bear. **Take the bravery down**.'],
  ['gold', 'in', 'coin', 'My shop has had no **luck** for a year. Bring **fortune** to my **till**.'],
  ['gold', 'out', 'coin', 'Everything I touch turns to **gold** coins and I can\'t eat. **Take this luck away**!'],
  ['gold', 'in', 'star', 'I sail tomorrow for the islands. Give my **voyage** some **luck**.', null, [['feather', 'The winds carried her there quick as a gull']]],
  ['mint', 'in', 'hand', 'This **cough** has kept me in bed for a month. I want to be **healthy** again.'],
  ['mint', 'in', 'house', 'Everyone in my **house** has a **fever**. Bring **health** back **home**.'],
  ['mint', 'out', 'eye', 'I worry about my **health** every minute. I need it **out** of my **head**.'],
  ['salt', 'in', 'house', 'Thieves came twice this month. **Protect** my **home**.'],
  ['salt', 'in', 'star', 'I walk the forest road at night. Keep me **safe** on the **road**.'],
  ['salt', 'out', 'heart', 'I\'ve built **walls** round my **heart** after he left. I want to **let people in** again.'],
  ['ash', 'in', 'eye', 'I can\'t stop thinking about my **old flame**. Help me **forget**.', null, [['sage', 'He thinks of her more clearly now: not quite what he wanted']]],
  ['ash', 'out', 'eye', 'I keep **forgetting** where I put things. My keys, my glasses, my horse. Make it **stop**.', null, [['sage', 'Never lost a thing since. Not even a sock']]],
  ['ash', 'in', 'house', 'The old **feud** with my neighbours has gone on too long. Let it **end**, **house** to **house**.'],
  ['sage', 'in', 'eye', 'I have my big **exam** tomorrow and I can\'t **think straight**.'],
  ['sage', 'in', 'coin', 'I hid my savings somewhere and can\'t **remember** where. Help me **recall** my **money**.'],
  ['honey', 'in', 'heart', 'I\'m new in town and so **lonely**. I want **friends**.'],
  ['honey', 'in', 'coin', 'I need to **convince** the bank to lend me **money**.'],
  ['honey', 'out', 'house', 'My cousin is **too charming**; he has talked his way into **living in my house**. **Out**!'],
  ['feather', 'in', 'star', 'I\'ve never left this valley. I want to be **free** to **travel**.'],
  ['feather', 'out', 'hand', 'My **feet** keep wanting to **wander** off at night. **Ground** me.'],
  ['feather', 'in', 'heart', 'I feel so **heavy** inside. I want to feel **light** and **free** again.'],
  ['iron', 'in', 'hand', 'The blacksmith competition is Saturday. I need **strength** in my **arms**.'],
  ['iron', 'in', 'house', 'My old **house** creaks and leans. Make its **walls strong**.'],
  ['iron', 'out', 'hand', 'My new **strength** potion from the travelling quack worked **too well**. I crush teacups. **Undo it**.'],
  ['silk', 'in', 'heart', 'My dog keeps running off. I want him to **stay** **loyal** to me.'],
  ['silk', 'out', 'house', 'I made a promise to **stay in this house** forever. I need that **bond broken**.'],
  ['silk', 'in', 'coin', 'Money runs through my fingers. Help me **keep hold** of my **coins**.'],
  ['acorn', 'in', 'house', 'My **garden** won\'t **grow** a thing. My **land** is bare.'],
  ['acorn', 'out', 'hand', 'My **nose** keeps **growing**. Don\'t ask why. **Stop it**.'],
  ['acorn', 'in', 'coin', 'My little business is too **small**. Help it **grow**.'],
  ['rain', 'in', 'house', 'The **drought** has dried our **well** and **fields**. We need **rain** at home.'],
  ['rain', 'out', 'heart', 'I can\'t stop **crying** since the funeral. Help my **tears** **dry**.'],
  ['rain', 'out', 'star', 'It has **rained** on our **road** for forty days. The carts are stuck. **Send it away**.'],
  ['mirror', 'in', 'eye', 'My business partner **lies** to me. I want to see the **truth**.'],
  ['mirror', 'in', 'heart', 'My son keeps **secrets** from me. I want him to tell me the **truth**.'],
  ['mirror', 'out', 'house', 'Since your mirror spell my parrot tells **every truth** in the house. **Quiet** it.'],
  ['ember', 'in', 'house', 'Winter has come and my **house** is **freezing**. Bring **warmth** home.'],
  ['ember', 'in', 'heart', 'After thirty years of marriage the **spark** has gone **cold**. Light it again.', null, [['rose', 'He brings her flowers again. It is sweet, but not quite fire']]],
  ['ember', 'out', 'eye', 'I have a **burning temper**. I need to **cool** my **head**.'],
  // two-jar spells (from level 4)
  ['thistle', 'in', 'heart', 'I **love** her but I\'m too **scared** to tell her.', 'rose'],
  ['salt', 'in', 'star', 'I carry the king\'s **gold** through **bandit** country. Keep it **safe** and **lucky** on the **road**.', 'gold'],
  ['mint', 'in', 'hand', 'I\'m old and **weak** and always **sick**. I want my **body** **strong** and **healthy**.', 'iron'],
  ['honey', 'in', 'heart', 'I\'ve quarrelled with my best **friend** and I want her **back**, and to **keep** her this time.', 'silk'],
  ['sage', 'in', 'eye', 'I must **remember** my lines for the play and stop being **afraid** of the crowd.', 'thistle'],
  ['acorn', 'in', 'house', 'Our **fields** are **dry** and nothing will **grow**.', 'rain'],
  ['mirror', 'in', 'heart', 'I want to tell my husband the **truth** about the broken vase, and still have his **love**.', 'rose'],
  ['ember', 'in', 'house', 'My **home** is **cold** and the bailiffs keep **coming**. Warm it and **protect** it.', 'salt'],
  // 25 Nov 2026 (his words: "way more combinations... something novel each time"): 56 troubles were the whole village. 194 now: every jar has eight more
  // people at the door, some wanting a thing brought and some wanting it gone, to every part of a life; and ten more that need two jars.
  ["rose", "in", "eye", "My husband only **thinks** about his turnips. Put some **love** in that **head** of his."],
  ["rose", "out", "house", "The newlyweds next door coo through my wall all night. Cool the **love** in that **house**. A little."],
  ["rose", "in", "star", "My sweetheart sails **far away** tomorrow. Send my **love** down the **road** with him."],
  ["rose", "out", "eye", "I can't **think** for **love**. I've burnt nine loaves daydreaming of the miller. **Clear it** from my **head**."],
  ["rose", "in", "coin", "I carve wooden spoons for my wife. Put my **love** into the **things** I make."],
  ["rose", "out", "coin", "They say I **love** my **purse** more than my children. **Take** that love **off** my **coins**."],
  ["rose", "in", "heart", "My old dog has gone cold on me since the puppy came. Make his **heart** **love** me again."],
  ["rose", "out", "hand", "I go weak when she walks by; my knees give way. Get this **love** **out** of my **limbs**."],
  ["moon", "in", "house", "The baby, the dog and the rooster are all up at midnight. Bring **sleep** to our **house**."],
  ["moon", "out", "eye", "I **daydream** through every sermon. Take the **dreams out** of my **head** till Sunday is done."],
  ["moon", "in", "hand", "My **legs** twitch and kick all night. Let my **body** **rest**."],
  ["moon", "out", "heart", "I **dream** of my lost love every night and wake weeping. **Take** her **out** of them, for my **heart**."],
  ["moon", "in", "star", "The night coach is ten hours of bumps. Let me **sleep** the whole **road**."],
  ["moon", "out", "coin", "My scarecrow looks fast **asleep** and the crows sit on it. **Wake** the **thing** up."],
  ["moon", "in", "eye", "I lie awake counting my worries. Quiet my **mind** and let me **sleep**."],
  ["moon", "out", "hand", "My **foot** has been **asleep** since Tuesday. **Wake** it."],
  ["thistle", "in", "eye", "I know the answer, but my **mind** goes blank before the judge. Give my **wits** some **nerve**."],
  ["thistle", "in", "house", "Every creak sends my family under the beds. Make ours a **brave** **household**."],
  ["thistle", "in", "star", "I've never left the village. Give me the **courage** for the **road** to the city."],
  ["thistle", "out", "hand", "My boy **dares** to climb the church tower every day. **Take** the **daring** out of those **legs**."],
  ["thistle", "out", "heart", "My **heart** is too **bold**: I've proposed to five women this week. **Calm** it."],
  ["thistle", "in", "coin", "I'm too **timid** to ask a fair price. Put some **nerve** into my **trade**."],
  ["thistle", "out", "house", "My hens have turned **fearless**. They chase the fox. **Take it out** of my **henhouse**."],
  ["thistle", "in", "hand", "My **hands** shake when I hold the razor, and I'm the barber. A steady **nerve**, please."],
  ["gold", "in", "heart", "I'm **unlucky** in matters of the **heart**: three weddings, three brides who never came. Bring me **luck**."],
  ["gold", "in", "hand", "I trip on flat ground and bang every doorframe. Give this clumsy **body** some **luck**."],
  ["gold", "in", "house", "The roof leaks, the cow's dry, the chimney fell in. Our **home** needs **luck**."],
  ["gold", "out", "house", "Our **lucky** horseshoe brings so many visitors we can't sit down. **Take** the luck **off** the **house**."],
  ["gold", "in", "eye", "I guess wrong every time: cards, weather, husbands. Give my **head** some **luck**."],
  ["gold", "out", "hand", "I win every arm-wrestle by a **fluke** and now nobody will play. **Take** the **luck** out of my **arm**."],
  ["gold", "out", "star", "I find a coin on every **road** I walk, and now thieves follow me. **Take** the **luck** off my **travels**."],
  ["gold", "in", "coin", "I've a ticket in the harvest lottery. A little **luck** on my **stake**?"],
  ["mint", "in", "heart", "My **heart** flutters like a moth since the fever. Make it **well**."],
  ["mint", "in", "eye", "My **head** aches from dawn to dusk. **Heal** it.", null, [["moon", "She slept it off. Fourteen hours"]]],
  ["mint", "out", "hand", "My brother is so **healthy** he hasn't sat down in a year. **Take** a little **out** of his **body**."],
  ["mint", "in", "star", "The **road** to the coast is all coughs and bad water. Keep me **well** on the **way**."],
  ["mint", "in", "coin", "My apple cart has gone to rot: bruised, wormy fruit. Make my **goods** **wholesome** again."],
  ["mint", "out", "house", "Mother's **health** tonics are so strong the whole **house** is bouncing off the walls. **Draw it out**."],
  ["mint", "in", "house", "Everyone under my **roof** has the sniffles. **Heal** the **household**."],
  ["mint", "in", "hand", "My **back** went when I lifted the anvil. **Mend** it."],
  ["salt", "in", "heart", "I fall for every sad story and it breaks me. **Guard** my **heart** a little."],
  ["salt", "in", "eye", "A fortune-teller keeps getting into my **head**. **Shield** my **thoughts**."],
  ["salt", "in", "hand", "I'm off to fight in the tourney. Keep my **body** **safe** from harm.", null, [["iron", "He was not safe at all, but he hit back very hard"]]],
  ["salt", "in", "coin", "Mice, moths and thieves: keep my **stock** **safe**."],
  ["salt", "out", "house", "So many **charms** hang on our **house** that the postman can't get up the path. **Take** the wards **off**."],
  ["salt", "out", "eye", "I'm so **guarded** I trust nobody, not even the cat. Let my **mind** **drop** its shield."],
  ["salt", "out", "coin", "I put a **ward** on my **strongbox** and now I can't open it either. **Take it off**."],
  ["salt", "in", "house", "Wolves were at the door last night. **Protect** my **home**."],
  ["ash", "in", "heart", "My **heart** still aches for a man who left ten years ago. Let it **forget** him."],
  ["ash", "in", "hand", "I learnt to juggle wrong and my **hands** won't unlearn it. Make them **forget**."],
  ["ash", "in", "star", "I told the whole **town** I could fly. Make the **world** **forget** I said it."],
  ["ash", "in", "coin", "A debt in my **ledger** was paid twice and argued over for years. Let the **book** **forget** it."],
  ["ash", "out", "house", "Our **household** has **forgotten** everything: birthdays, chores, the baby. **Drive** the forgetting **out**."],
  ["ash", "out", "heart", "I've **forgotten** how it felt to be happy. **Take** the forgetting **off** my **heart**."],
  ["ash", "in", "eye", "I saw the mayor in his bath. Make my **mind** **forget** it."],
  ["ash", "in", "house", "A quarrel has sat at our table for a year. Bring it to an **end** under our **roof**."],
  ["sage", "in", "heart", "I can't tell if it's him I want or his pies. Let my **heart** see **clearly**."],
  ["sage", "in", "hand", "I've lost the steps of the harvest dance. Let my **feet** **remember**."],
  ["sage", "in", "house", "We've lost grandmother's ring somewhere at home. Help this **house** **remember** where things are."],
  ["sage", "in", "star", "I get lost on the way to my own gate. Let me **remember** the **road**."],
  ["sage", "out", "eye", "I **remember** everything: every slight since I was four. It's too much. **Dull** my **memory** a touch."],
  ["sage", "out", "heart", "I **think** too hard about every feeling and never feel it. **Take** the thinking **out** of my **heart**."],
  ["sage", "in", "coin", "I never know what's in my own shop. Let me keep my **stock** **clear in my head**."],
  ["sage", "out", "house", "My family **remembers** every argument, word for word. **Take** the memory **out** of that **house**."],
  ["honey", "in", "eye", "I mean kind things and say rude ones. Put **sweet words** in my **head** before they reach my mouth."],
  ["honey", "in", "house", "The new neighbours won't even nod. Make ours a **friendly** **house** to visit."],
  ["honey", "in", "star", "I'm a stranger everywhere I go. Let me find **friends** on the **road**."],
  ["honey", "in", "hand", "My handshake frightens people. Make my **grip** **friendly**."],
  ["honey", "out", "heart", "I'm everyone's **friend**: nine christenings this month. Make my **heart** a little **less** friendly."],
  ["honey", "out", "eye", "I **flatter** everyone, and now the baker thinks his bread is good. **Take** the sweet talk **out** of my **head**."],
  ["honey", "out", "coin", "I **sweet-talk** every customer and give it all away at half price. Get the sweetness **out** of my **trade**."],
  ["honey", "in", "heart", "My sister and I haven't spoken since the goose business. Make us **friends** at **heart** again.", null, [["rose", "They hug every morning now. A bit much, they both say"]]],
  ["feather", "in", "hand", "I've been stiff as a gatepost since the winter. Let my **limbs** move **free**."],
  ["feather", "in", "eye", "My thoughts go round one track like a mill-horse. Let my **mind** **wander free**."],
  ["feather", "in", "house", "We've not left the farm in nine years. Give this **household** a taste for **travel**."],
  ["feather", "in", "coin", "My **goods** sit in the barn and rot. Help them **travel** to market."],
  ["feather", "out", "star", "My husband **wanders** off down every **road** he sees. Three days, last time. **Stop** his roaming."],
  ["feather", "out", "heart", "My **heart** wants to **run away** to sea every spring, and I've a farm to mind. **Settle** it."],
  ["feather", "out", "house", "Everything in my **house** has got **loose**: the hens, the washing, the children. **Take** the freedom **out**."],
  ["feather", "in", "star", "The pass is snowed in and my mother is waiting. Open the **road** and let me **travel**."],
  ["iron", "in", "heart", "My **heart** gives up at the first setback. Make it **strong**.", null, [["thistle", "He is braver now, if no tougher. It will do"]]],
  ["iron", "in", "eye", "I change my **mind** whenever anyone frowns. Give me a **strong** **will**."],
  ["iron", "in", "coin", "My **cart** falls apart on every hill. Make the **thing** **strong**."],
  ["iron", "in", "star", "The bridge on the north **road** sways like a hammock. **Strengthen** it before market day."],
  ["iron", "out", "heart", "My father's **heart** is **hard as iron**: he hasn't forgiven anyone since the flood. **Soften** it."],
  ["iron", "out", "eye", "My wife's **will** is so **strong** the mule obeys her. **Take** a little **out** of her **head**."],
  ["iron", "out", "house", "I built our door so **strong** that nobody can open it. Including us. **Weaken** the **house** a bit."],
  ["iron", "in", "hand", "I'm the new blacksmith and I can't lift the hammer. **Strength** for my **arms**, quick."],
  ["silk", "in", "eye", "Nothing **stays** in my **head**: names, sums, where I live. Make things **stick**.", null, [["sage", "He remembers it all now. Whether he wants to or not"]]],
  ["silk", "in", "hand", "I drop everything: plates, babies, hints. Make my **hands** **hold on**."],
  ["silk", "in", "house", "My children are leaving one by one for the city. **Keep** the family **together** under our **roof**."],
  ["silk", "in", "star", "My flock scatters on every **road**. **Bind** them to the path."],
  ["silk", "out", "heart", "I'm still **tied** to a promise I made a dead man. **Unbind** my **heart**."],
  ["silk", "out", "hand", "I shook on a bad bargain and my **hand** won't let go of his. **Unstick** us."],
  ["silk", "out", "coin", "My **purse** is **knotted** so tight I can't pay anyone. They think I'm mean. **Loosen** it."],
  ["silk", "out", "eye", "A tune has been **stuck** in my **head** since midsummer. **Free** it."],
  ["acorn", "in", "hand", "My son is twelve and the size of a hen. Help his **body** **grow**."],
  ["acorn", "in", "eye", "I've learnt nothing new since I was nine. Make my **mind** **grow**."],
  ["acorn", "in", "heart", "My **heart** is a small, mean thing, my wife says. Help it **grow**."],
  ["acorn", "in", "star", "Our village is four houses and a duck. Make it **grow** into a **town**."],
  ["acorn", "out", "house", "The ivy has **grown** through the windows and up the stairs. **Shrink** it out of my **house**."],
  ["acorn", "out", "coin", "My **debts** keep **growing**. **Stop** them."],
  ["acorn", "out", "heart", "A grudge is **growing** in my **heart** like a weed. **Stunt** it."],
  ["acorn", "in", "coin", "Three coins in the jar. Make my **savings** **grow**."],
  ["rain", "in", "heart", "I buried my wife dry-eyed and it sits in me like a stone. Let my **heart** **weep**."],
  ["rain", "in", "star", "The whole **valley** is cracked and brown. Bring **rain** on the **land**."],
  ["rain", "in", "coin", "My well is dust and my **mill-wheel** won't turn. Bring **water** to my **works**."],
  ["rain", "in", "eye", "I'm an actor and I can't **cry** when I'm told to. Put **tears** at my **command**."],
  ["rain", "out", "house", "The roof leaks in nine places. Keep the **rain** **out** of my **house**."],
  ["rain", "out", "eye", "I **weep** when I **think** of anything at all: sunsets, onions, the price of eggs. **Dry** it up."],
  ["rain", "out", "coin", "My market **stall** has been **rained** on every single Saturday. **Keep it off** my **goods**."],
  ["rain", "out", "hand", "My **knees** tell me when **rain** is coming, and they are never quiet. Get the rain **out** of my **bones**."],
  ["mirror", "in", "hand", "My face gives nothing away and nobody believes I'm ill. Let my **body** tell the **truth**."],
  ["mirror", "in", "coin", "The merchant swears this is silver. Make the **thing** show what it **truly** is."],
  ["mirror", "in", "star", "The whole **town** believes the lie about my mother. Let the **world** see the **truth**."],
  ["mirror", "in", "house", "Someone under my **roof** ate the Sunday pie and all five deny it. Bring the **truth** home."],
  ["mirror", "out", "eye", "I see the **truth** of everyone I meet and I've no friends left. **Blur** my **mind** a little."],
  ["mirror", "out", "heart", "My **heart** is too **honest**: I told the bride she looked like a goose. **Take** some honesty **out**."],
  ["mirror", "out", "coin", "I sell second-hand horses and I cannot stop telling the **truth** about them. **Take it out** of my **trade**."],
  ["mirror", "in", "eye", "I can't tell when my son is lying. Let my **mind** see the **truth**."],
  ["ember", "in", "hand", "My **fingers** are blue from October to May. **Warm** this **body**.", null, [["mint", "Her fingers are pink and healthy, though still a bit chilly"]]],
  ["ember", "in", "eye", "I used to love my work. Now I count the nails. Put the **fire** back in my **mind**."],
  ["ember", "in", "coin", "My **forge** has gone cold and won't catch. Put **fire** in the **thing**."],
  ["ember", "in", "star", "It's a week's walk through the snow. Keep me **warm** on the **road**."],
  ["ember", "out", "heart", "My temper **flares** at nothing: I shouted at a cabbage. **Cool** the fire in my **heart**."],
  ["ember", "out", "house", "My wife keeps the hearth so **hot** the candles droop. **Cool** our **home** down."],
  ["ember", "out", "hand", "I danced too near the bonfire and I've been **glowing hot** ever since. **Take** the heat **out** of my **body**."],
  ["ember", "out", "coin", "My new **kettle** boils over the moment I look at it. **Take** some **fire** out of the **thing**."],
  ["mint", "in", "hand", "I go to war in spring. Keep my **body** **healthy** and **strong**.", "iron"],
  ["rose", "in", "house", "We wed tomorrow. Bless our **home** with **love** and **luck**.", "gold"],
  ["moon", "in", "eye", "Let my **mind** **sleep**, and **forget** the day I've had.", "ash"],
  ["honey", "in", "star", "I'm sent to make peace with the next valley. Give me **sweet words** and **courage** for the **journey**.", "thistle"],
  ["salt", "in", "hand", "My boy starts at the quarry on Monday. Keep his **body** **safe** and **strong**.", "iron"],
  ["sage", "in", "eye", "I sit the scholars' exam at dawn. A **clear head**, and a little **luck** with it.", "gold"],
  ["feather", "in", "star", "I'm walking to the sea and back. Let me **travel** light and stay **well** on the **road**.", "mint"],
  ["ember", "in", "heart", "He's kind but cold as a fish. Put **warmth** and **love** in his **heart**.", "rose"],
  ["acorn", "in", "coin", "I've planted my last seed-corn. Make the **crop** **grow**, and send it **rain**.", "rain"],
  ["mirror", "in", "house", "We need the **truth** told at our table, but **kindly**. For the sake of the **family**.", "honey"],
];
const AMT = [null, ['Just a **little**, mind.', 'Only a **drop** of it, please.', 'Nothing too **strong**.'], null, ['Make it **strong**. **Very strong**.', 'As **much** as you can.', 'A **big** dose. It\'s **bad**.']];
const PEOPLE = ['Mrs Pell', 'Old Bram', 'Tilly the baker', 'Farmer Odo', 'Lady Wren', 'Captain Ruff', 'Young Pip', 'Granny Moss', 'Sir Alden', 'Nell the weaver', 'Doctor Quill', 'Hob the miller', 'Widow Flint', 'Master Crake', 'Rosa the singer', 'Little Jem', 'Tam the fisher', 'Mistress Oake', 'Brother Anselm', 'Daft Wat', 'Meg of the mill', 'Old Mother Sedge', 'Jory the piper', 'Dame Hester', 'Bess the brewer', 'Simkin', 'Lord Fenwick', 'Tibb the thatcher', 'Goody Marsh', 'Perkin the tailor', 'Sister Agnes', 'Wilf the shepherd', 'Madam Ysolde', 'Ned the carter', 'Lame Hugh', 'Annis the midwife', 'Squire Bolt', 'Cob the tinker', 'Maud of the ford', 'Peg the goose-girl', 'Father Ambrose', 'Jenet the dyer', 'Big Hal', 'Odd Oswin', 'Mistress Tansy', 'Rafe the fowler', 'Kit the potboy', 'Aunt Dorcas'];
const PLACES = [{ name: 'Mossbrook' }, { name: 'Raven Hill' }, { name: 'Saltmarsh' }, { name: 'The Old City' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
const UPGRADES = [
  { id: 'lamp', name: 'Reading lamp', desc: 'Clue words glow in their stories.', max: 1, cost: l => 50 },
  { id: 'spoon', name: 'Silver spoon', desc: 'Stirring needs one turn, not two.', max: 1, cost: l => 40 },
  { id: 'hourglass', name: 'Hourglass', desc: 'The seal glows more slowly.', max: 2, cost: l => 40 + l * 45 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Apprentice'], [40, 'Hedge witch'], [130, 'Conjurer'], [320, 'Enchanter'], [700, 'Sorcerer'], [1500, 'Archmage']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, place: placeOf(N), people: Math.round(x(4, 7, 25)), ings: INGS.filter(i => i.n <= N), runes: RUNES.filter(r => r.n <= N), pour: N >= 2, seal: N >= 3, two: N >= 4 ? x(0.25, 0.5, 30) : 0,
    dirs: N >= 2, amtOn: N >= 2, pass: Math.round(x(60, 84, 30) - (help ? 8 : 0)), sealSpd: x(0.5, 0.9, 30) / (1 + 0.3 * upLv('hourglass')) * (help ? 0.75 : 1), turns: upLv('spoon') ? 1 : 2 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, done: [], queue: [], cur: null, known: o.known || {} };
  planDay(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.ev.push({ k: 'start' }); nextCustomer(G); }
  return G; }
// the day's customers are dealt: troubles the jars on the shelf can cure, no two alike, a share of two-jar ones
function planDay(G) { const c = G.cfg, R = G.rnd, have = new Set(c.ings.map(i => i.id)), runes = new Set(c.runes.map(r => r.id));
  const ok = t => have.has(t[0]) && runes.has(t[2]) && (!t[4] || (c.two && have.has(t[4]))) && (c.dirs || t[1] === 'in'), pool = TROUBLES.filter(ok), ones = pool.filter(t => !t[4]).sort(() => R() - 0.5), twos = pool.filter(t => t[4]).sort(() => R() - 0.5);
  const nTwo = Math.min(twos.length, Math.round(c.people * c.two)); const takeN = (L, n) => { const out = []; for (let k = 0; k < n && k < L.length; k++) out.push(dealIf('trouble', TROUBLES, q => L.includes(q) && !out.includes(q), R)); return out; };      /* from the deck: no trouble comes to the door twice until every other one the shelf can cure has */
  G.queue = takeN(twos, nTwo).concat(takeN(ones, c.people - nTwo)).sort(() => R() - 0.5).map((t, i) => makeVisit(G, t, i)); G.total = G.queue.length; }
function makeVisit(G, t, i) { const R = G.rnd, c = G.cfg, amt = c.amtOn ? [1, 2, 3][(R() * 3) | 0] : 2, who = PEOPLE[(G.seed + i * 7 + ((R() * 16) | 0) + deal('who', PEOPLE.length, R)) % PEOPLE.length];
  let story = t[3]; if (amt !== 2) story += ' ' + pick(R, AMT[amt]);
  return { id: i, who, story, need: [t[0]].concat(t[4] ? [t[4]] : []), dir: t[1], rune: t[2], amt, alt: t[5] || [], face: (R() * 6) | 0, hat: (R() * 4) | 0 }; }
function nextCustomer(G) { const ret = G.done.find((d, i) => d.back && !d.seenBack && (G.done.length > i + 1 || !G.queue.length));      /* they come back after the next customer */
  if (ret) { ret.seenBack = true; G.cur = Object.assign({}, ret.v, { returning: ret }); G.phase = 'back'; G.ev.push({ k: 'back', d: ret }); return; }
  if (!G.queue.length) return endDay(G);
  G.cur = G.queue.shift(); startBrew(G); G.ev.push({ k: 'enter', v: G.cur }); }
function startBrew(G) { G.phase = 'pick'; G.pick = []; G.amount = 0; G.pouring = false; G.stirA = 0; G.stirDir = 0; G.runeId = null; G.sealT = 0; G.sealAcc = null; }
const PHASES = c => ['pick'].concat(c.pour ? ['pour'] : [], ['stir', 'rune'], c.seal ? ['seal'] : []);
function nextPhase(G) { const ph = PHASES(G.cfg), i = ph.indexOf(G.phase); if (i < ph.length - 1) { G.phase = ph[i + 1]; G.ev.push({ k: 'phase', p: G.phase }); if (G.phase === 'seal') { G.sealT = 0; G.sealWant = 0.25 + G.rnd() * 0.5; } } else serve(G); }
// ---------- what you do ----------
function pickJar(G, id) { if (G.over || G.wait > 0 || G.phase !== 'pick') return false; if (!G.cfg.ings.some(i => i.id === id)) return false;
  const k2 = G.pick.indexOf(id); if (k2 >= 0) G.pick.splice(k2, 1); else { if (G.pick.length >= 3) return false; G.pick.push(id); } G.ev.push({ k: 'jar', id, on: k2 < 0 }); return true; }
function brew(G) { if (G.over || G.wait > 0 || G.phase !== 'pick' || !G.pick.length) return false; nextPhase(G); return true; }
function pourHold(G, on) { if (G.phase !== 'pour' || G.over || G.wait > 0) return false; if (on) { G.pouring = true; return true; } if (!G.pouring) return false; G.pouring = false; G.ev.push({ k: 'poured', a: G.amount }); nextPhase(G); return true; }
function stirBy(G, da) { if (G.phase !== 'stir' || G.over || G.wait > 0) return false; G.stirA += da; if (Math.abs(G.stirA) >= TAU * G.cfg.turns) { G.stirDir = Math.sign(G.stirA); G.ev.push({ k: 'stirred', dir: G.stirDir }); nextPhase(G); } return true; }
function drawRune(G, id) { if (G.phase !== 'rune' || G.over || G.wait > 0 || !G.cfg.runes.some(r => r.id === id)) return false; G.runeId = id; G.ev.push({ k: 'rune', id }); nextPhase(G); return true; }
function seal(G) { if (G.phase !== 'seal' || G.over || G.wait > 0) return false; const ph = (G.sealT * G.cfg.sealSpd) % 1, d = Math.min(Math.abs(ph - G.sealWant), 1 - Math.abs(ph - G.sealWant)); G.sealAcc = clamp(1 - d / 0.15, 0, 1); G.ev.push({ k: 'sealed', acc: G.sealAcc }); serve(G); return true; }
const sealPhase = G => (G.sealT * G.cfg.sealSpd) % 1;
// mark the spell and send them off
function judge(G, v) { const c = G.cfg, P = G.pick; let s = 0, side = null, alt = null, missing = [];
  const altHit = v.alt.find(a => P.includes(a[0]) && !P.includes(v.need[0]));
  for (const n of v.need) { if (P.includes(n)) s += 60 / v.need.length; else if (altHit && n === v.need[0]) { s += 60 / v.need.length; alt = altHit[1]; } else missing.push(n); }
  const extra = P.filter(p => !v.need.includes(p) && !(altHit && p === altHit[0])); s -= extra.length * 18; if (extra.length) side = extra[0];
  const dir = G.stirDir > 0 ? 'in' : 'out', dirOk = dir === v.dir; s += dirOk ? 15 : 0;
  const runeOk = G.runeId === v.rune; s += runeOk ? 15 : 0;
  const amt = G.amount < 0.67 ? 1 : G.amount < 1.33 ? 2 : 3; s += !c.pour ? 5 : amt === v.amt ? 5 : Math.abs(amt - v.amt) === 1 ? 2 : 0; if (c.pour && G.amount > 1.85) { s -= 10; side = side || 'spill'; }
  s += !c.seal ? 5 : 5 * (G.sealAcc || 0);
  return { s: Math.round(clamp(s, 0, 100)), side, alt, missing, dirOk, runeOk, amtOk: !c.pour || amt === v.amt, amt }; }
function serve(G) { const v = G.cur, J = judge(G, v), grade = J.s >= 85 ? 'perfect' : J.s >= 70 ? 'good' : J.s >= 40 ? 'funny' : 'bad';
  if (v.returning) { const d = v.returning; d.fix = J; d.fixGrade = grade; G.ev.push({ k: 'fixed', grade, J, v }); lessonSee(G, 'fix', grade); if (grade === 'funny' || grade === 'bad') return complaint(G, d); G.wait = 1.8; G.next = () => nextCustomer(G); return; }
  const d = { v, J, grade, back: grade === 'funny' || grade === 'bad' }; G.done.push(d); G.ev.push({ k: 'served', grade, J, v }); lessonSee(G, 'served', grade, J);
  G.wait = 1.8; G.next = () => { if (G.lesson) { lessonNext(G); return; } nextCustomer(G); }; }
function complaint(G, d) { G.ev.push({ k: 'complain', d }); G.wait = 2.2; G.next = () => endDay(G, d); }
function endDay(G, why) { if (G.lesson) return; const good = G.done.filter(d => !d.back || d.fixGrade === 'good' || d.fixGrade === 'perfect'), avg = G.done.length ? G.done.reduce((a, d) => a + (d.fix ? Math.min(d.fix.s, 60) : d.J.s), 0) / G.done.length : 0;
  const win = !why && good.length === G.done.length && G.done.length >= G.total && avg >= G.cfg.pass; G.over = win ? 'won' : 'lost';
  const stars = win ? (avg >= 90 ? 3 : avg >= 78 ? 2 : 1) : 0;
  G.res = { win, stars, avg: Math.round(avg), pass: G.cfg.pass, served: G.done.length, total: G.total, perfect: G.done.filter(d => d.grade === 'perfect').length, why: why ? why.v.who : null, list: G.done.map(d => ({ who: d.v.who, grade: d.fixGrade ? 'fixed' : d.grade, need: d.v.need })), coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// a returning customer with a funny side effect: brew it again
function retryBack(G) { if (G.phase !== 'back' || G.over || G.wait > 0) return false; const d = G.cur.returning; if (d.grade === 'bad') { return complaint(G, d); } startBrew(G); G.ev.push({ k: 'retry' }); return true; }
function step(G, dt) { if (G.over) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; }
  if (G.phase === 'pour' && G.pouring) { G.amount = Math.min(2.2, G.amount + dt * 0.9); }
  if (G.phase === 'seal') G.sealT += dt; }
// ---------- LESSONS ----------
const AIMCARD = {"pic": "🔮", "win": "BREW THE RIGHT SPELL FOR EACH STORY", "lose": "WRONG SPELLS UPSET THEM", "how": "PICK, BREW, STIR, SEAL"};      // the aim card: specs/aims.json (tools/aims.py)
const LESSONS = {
  1: [{ id: 'read', title: 'READ THE STORY', say: G => spellCue(G)[0], do: G => spellCue(G)[1], at: G => spellCue(G)[2], how: 'Their words point to the jar: "love" is 🌹, "sleep" is 🌙... Pick it, BREW, stir round, then tap the rune for what it acts on (♥ heart, 👁 mind, ✋ body). Three spells in a row that are just right.', need: 3 }],
  2: [{ id: 'dose', title: 'IN OR OUT, AND HOW MUCH', say: G => spellCue(G)[0], do: G => spellCue(G)[1], at: G => spellCue(G)[2], how: 'Stir clockwise to draw it IN, anticlockwise to drive it OUT. Hold to pour: one line for "a little", two for usual, three for "strong". Two good spells in a row.', need: 2 }],
  3: [{ id: 'seal', title: 'SEAL IT', say: G => spellCue(G)[0], do: G => spellCue(G)[1], at: G => spellCue(G)[2], how: 'Last of all, tap SEAL when the brew glows the colour of the ring round it. Two good spells in a row.', need: 2 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonNext(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonNext(G) { const st = lessonNow(G); if (!st) return; const R = G.rnd, have = new Set(G.cfg.ings.map(i => i.id)), runes = new Set(G.cfg.runes.map(r => r.id));
  const pool = TROUBLES.filter(t => have.has(t[0]) && runes.has(t[2]) && !t[4] && (G.cfg.dirs || t[1] === 'in')); const t = pool[(R() * pool.length) | 0]; G.cur = makeVisit(G, t, (R() * 99) | 0); startBrew(G); G.ev.push({ k: 'enter', v: G.cur }); }
function lessonSee(G, what, grade) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (what === 'served') ok = grade === 'perfect';      /* in a lesson: the right jar AND the right rune */
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.done = []; G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 2.6; G.next = () => lessonNext(G); return; }
  G.lesson.n++; G.done = []; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.8; G.next = () => { G.done = []; planDay(G); G.ev.push({ k: 'start' }); nextCustomer(G); }; } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps a jar, taps BREW (or the next step: a random amount, a random stir, a random rune, the
// seal whenever), or taps "try again" for someone who came back
const BLIND = { j: G => { const ing = G.cfg.ings; pickJar(G, ing[(Math.random() * ing.length) | 0].id); },
  b: G => { if (G.phase === 'pick') brew(G); else if (G.phase === 'pour') { if (!G.pouring) pourHold(G, true); else pourHold(G, false); } else if (G.phase === 'stir') stirBy(G, (Math.random() < 0.5 ? -1 : 1) * TAU * 2.1); else if (G.phase === 'rune') { const r = G.cfg.runes; drawRune(G, r[(Math.random() * r.length) | 0].id); } else if (G.phase === 'seal') seal(G); else if (G.phase === 'back') retryBack(G); } };
// a magician who looks: reads the clue words (acc: how surely), picks the jars, pours to the line, stirs the right way, the rune,
// seals near the colour; for a funny return, brews it again
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It said PICK,
// BREW, STIR (three things) with a hand sliding right in a box. Now the robot is asked (dryPlanAll) and the hand goes where its move is: TAP THIS
// JAR, TAP BREW, STIR THIS WAY round the pot (clockwise draws IN, anticlockwise drives OUT), HOLD TO POUR / LET GO at the line, TAP THIS RUNE then
// DRAW IT dot to dot, TAP SEAL! when the glow is right, TAP TRY AGAIN.
const SPC = { t: -1e9, v: null };
function spellCue(G) { if (G.over || G.wait > 0 || !G.cur) return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - SPC.t < 120) return SPC.v; SPC.t = now; const L = lay(), C = L.C, mid = b => [b.x + b.w / 2, b.y + b.h / 2], P = G.phase; let v = ['WAIT…', 'wait', false];
  const tr = typeof trace !== 'undefined' && trace;
  if (P === 'rune' && tr) { const ru = runeOf(tr.id), a = ru.pts[Math.max(0, tr.i - 1)], b = ru.pts[tr.i], at = q => [C.x + q[0] * C.r * 1.6, C.y - C.r * 0.8 + q[1] * C.r * 1.6]; if (b) { const A = at(tr.i ? a : b), B = at(b); v = ['DRAW IT', 'drag', tr.i ? [A[0], A[1], B[0], B[1]] : [A[0], A[1], A[0] + 1, A[1] + 1]]; } SPC.v = v; return v; }
  const all = dryPlanAll(G, null, { t: -1 }), q = all[all.length - 1];
  if (P === 'seal') v = all.some(z => z[0] === 'seal') ? ['TAP SEAL!', 'tap', mid(L.act)] : ['WAIT FOR THE GLOW', 'wait', false];
  else if (!q) v = P === 'pour' && G.pouring ? ['KEEP HOLDING', 'hold', [W / 2, H * 0.75]] : ['WAIT…', 'wait', false];
  else if (q[0] === 'pickJar') { const J = L.jars.find(j => j.id === q[1]); v = J ? ['TAP THIS JAR', 'tap', mid(J)] : v; }
  else if (q[0] === 'brew' || q[0] === 'retryBack') v = [q[0] === 'brew' ? 'TAP BREW' : 'TAP TRY AGAIN', 'tap', mid(L.act)];
  else if (q[0] === 'pourHold') v = q[1] ? ['HOLD TO POUR', 'hold', [W / 2, H * 0.75]] : ['LET GO!', 'release', [W / 2, H * 0.75]];
  else if (q[0] === 'stirBy') { const cw = q[1] > 0, r = C.r * 0.3, pt = a => [C.x + Math.cos(a) * r / 0.35, C.y + Math.sin(a) * r], A = pt(-Math.PI / 2), B = pt(cw ? 0.2 : -Math.PI - 0.2); v = [cw ? 'STIR THIS WAY: IN' : 'STIR THIS WAY: OUT', 'drag', [A[0], A[1], B[0], B[1]]]; }
  else if (q[0] === 'drawRune') { const R2 = L.runes.find(r => r.id === q[1]); v = R2 ? ['TAP THIS RUNE', 'tap', mid(R2)] : v; }
  SPC.v = v; return v; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, v = G.cur, R = Math.random;
  if (G.over || G.wait > 0 || !v) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0 && G.phase !== 'pour' && G.phase !== 'seal') return; if (mem.t <= 0) mem.t = 0.5 + react * 1.5;
  if (mem.vid !== v.id + ':' + G.phase.slice(0, 1) + (v.returning ? 'r' : '')) { mem.vid = v.id + ':' + G.phase.slice(0, 1) + (v.returning ? 'r' : ''); mem.err = (R() - 0.5) * (1 - acc) * 0.8; }
  if (G.phase === 'back') { ACT.retryBack(G); return; }
  if (G.phase === 'pick') { const want = v.need.map(n => R() < 0.45 + acc * 0.55 - (G.cfg.ings.length - 6) * 0.012 ? n : G.cfg.ings[(R() * G.cfg.ings.length) | 0].id); for (const w of want) if (!G.pick.includes(w)) { ACT.pickJar(G, w); return; } ACT.brew(G); return; }
  if (G.phase === 'pour') { const target = [0, 0.33, 1, 1.67][v.amt] + mem.err; if (!G.pouring && G.amount < target) { ACT.pourHold(G, true); return; } if (G.pouring && G.amount >= target) ACT.pourHold(G, false); return; }
  if (G.phase === 'stir') { const right = R() < 0.6 + acc * 0.4 ? v.dir : (v.dir === 'in' ? 'out' : 'in'); ACT.stirBy(G, (right === 'in' ? 1 : -1) * TAU * 2.05); return; }
  if (G.phase === 'rune') { ACT.drawRune(G, R() < 0.6 + acc * 0.4 ? v.rune : pick(R, G.cfg.runes).id); return; }
  if (G.phase === 'seal') { const ph = sealPhase(G), d = Math.min(Math.abs(ph - G.sealWant), 1 - Math.abs(ph - G.sealWant)); if (d < 0.03 + (1 - acc) * 0.12 + react * 0.04) ACT.seal(G); } }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.done = [{ v: { who: 'x', need: [] }, J: { s: 100 }, grade: 'perfect' }]; G.total = 1; G.queue = []; endDay(G); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { pickJar, brew, pourHold, stirBy, drawRune, seal, retryBack }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
