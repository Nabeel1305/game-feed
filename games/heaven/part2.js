// ===================== RULES: Heaven or Hell (game 27) =====================
// You keep the gate. Souls arrive one at a time with the best and the worst thing they did in life; some have smaller deeds sealed in
// the Book of Life (tap the Book to read them). Send each soul where YOU think: swipe UP to Heaven, DOWN to Hell, SIDEWAYS to the
// grey mists of Purgatory. 23 Nov 2026, his note: "We can't tell people what to think morally; this isn't a game you can win, but rather
// one to stimulate interesting conversations so dont rank the good or evil this game isnt a winning one but just allow people to send
// the individuals where they like no winning here just move on to the next level": no halos or horns, no score of good and evil, no right
// or wrong gate, nothing lost, no sunset; when the queue is empty the day is done and the next day comes. At the end of a day: where you
// sent them. 2D on purpose: the card is the game.
const RULES = [
  'Each soul shows the <b>best</b> and the <b>worst</b> thing they did.',
  'Send them where <b>you</b> think: <b>swipe UP</b> to Heaven, <b>DOWN</b> to Hell, <b>SIDEWAYS</b> to Purgatory.',
  'Some deeds are sealed in the Book of Life: <b>tap the Book</b> to read them before you decide.',
  'There is no right answer and nothing to win: talk it over with whoever is with you. When the queue is empty, the next day comes.',
];
// deeds: kind (for the day's rules), text, weight (+ good, - bad)
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
const KINDS = { animal: '🐾', family: '🏠', money: '🪙', truth: '🗣️', courage: '🔥', work: '🔨' };
const GOOD = [
  ['animal', 'Fed every stray cat on the street', 1], ['animal', 'Ran a shelter for old dogs', 2], ['animal', 'Freed a fox from a snare in winter', 2], ['animal', 'Saved a herd from a barn fire', 3],
  ['family', 'Called {p} mother every Sunday', 1], ['family', 'Raised {p} sister\'s three children', 3], ['family', 'Nursed {p} father for ten years', 2], ['family', 'Forgave the brother who wronged {o}', 2],
  ['money', 'Paid a stranger\'s rent in secret', 2], ['money', 'Gave half {p} winnings to the hospital', 3], ['money', 'Always tipped the waiters well', 1], ['money', 'Lent money and never asked it back', 1],
  ['truth', 'Owned up to a mistake that cost {o} the job', 2], ['truth', 'Told the court the truth when it was dangerous', 3], ['truth', 'Returned a wallet full of cash', 1], ['truth', 'Never told a lie to {p} children', 1],
  ['courage', 'Pulled a child from a frozen lake', 3], ['courage', 'Stood up to the bully in the yard', 1], ['courage', 'Ran into a burning house for a neighbour', 3], ['courage', 'Gave blood in every emergency', 1],
  ['work', 'Taught at the village school for forty years', 2], ['work', 'Built the bridge that saved the valley', 2], ['work', 'Swept the church steps every morning', 1], ['work', 'Cured a thousand patients for free', 3],
  // 25 Nov 2026 (his final fix, his words: "add lots more combinations so a person can play this game daily for years and still be stimulated each time... much more
  // combos of good and bad deeds"): 24 best things and 24 worst made 576 pairs; 120 and 120 make 14,400, and the Book of Life holds 36 small deeds of each kind, not 6.
  ['animal', 'Put water out for the birds every summer', 1], ['animal', 'Walked the old widow\'s dog every day', 1], ['animal', 'Carried snails off the path after rain', 1], ['animal', 'Knitted coats for the shelter\'s puppies', 1], ['animal', 'Let the swallows nest in {p} roof', 1], ['animal', 'Braked for every hedgehog on the road', 1], ['animal', 'Took in a blind donkey nobody wanted', 2], ['animal', 'Nursed an injured deer back to the woods', 2], ['animal', 'Spent {p} savings on a stray\'s operation', 2], ['animal', 'Dug a trapped dog out of a fallen well', 2], ['animal', 'Bought the old carthorse so it could rest', 2], ['animal', 'Turned {p} farm into a home for old horses', 3], ['animal', 'Swam into a flood to free a tethered herd', 3], ['animal', 'Guarded the turtle beach for thirty years', 3], ['animal', 'Led every animal out of a burning zoo', 3], ['animal', 'Faced down the poachers, alone, for years', 3],
  ['family', 'Read to {p} children every single night', 1], ['family', 'Never missed one of {p} daughter\'s matches', 1], ['family', 'Cooked Sunday lunch for the whole family', 1], ['family', 'Taught {p} grandson to ride a bicycle', 1], ['family', 'Kept every drawing {p} children made', 1], ['family', 'Rang {p} lonely aunt on every birthday', 1], ['family', 'Worked two jobs to put {p} brother in school', 2], ['family', 'Took {p} father in when he lost his home', 2], ['family', 'Ended a twenty-year family quarrel', 2], ['family', 'Sat by {p} sick child every night for a year', 2], ['family', 'Carried {p} grandmother up the stairs daily', 2], ['family', 'Gave {p} sister a kidney', 3], ['family', 'Adopted four orphans from {p} street', 3], ['family', 'Gave up {p} dream to care for {p} twins', 3], ['family', 'Sold {p} home to pay for {p} son\'s cure', 3], ['family', 'Raised {p} grandchildren alone', 3],
  ['money', 'Paid for the coffee of whoever came next', 1], ['money', 'Slipped coins into children\'s pockets', 1], ['money', 'Bought the whole lemonade stand, twice', 1], ['money', 'Rounded every bill up for the collection tin', 1], ['money', 'Never haggled with a poor trader', 1], ['money', 'Cleared a young widow\'s debts in secret', 2], ['money', 'Paid the school fees of a neighbour\'s child', 2], ['money', 'Bought boots for every child in the village', 2], ['money', 'Gave {p} first wage to {p} old teacher', 2], ['money', 'Left the bakery money to feed the hungry', 2], ['money', 'Sold {p} car to pay a friend\'s hospital bill', 2], ['money', 'Gave away {p} whole fortune before dying', 3], ['money', 'Built a clinic and never put {p} name on it', 3], ['money', 'Paid for a well in every village around', 3], ['money', 'Bought a factory to save three hundred jobs', 3], ['money', 'Left everything to the orphanage', 3],
  ['truth', 'Handed back change given by mistake', 1], ['truth', 'Admitted {p} goal had been offside', 1], ['truth', 'Told a friend the truth about the haircut', 1], ['truth', 'Owned up to breaking the window as a child', 1], ['truth', 'Put the right weight on every parcel', 1], ['truth', 'Confessed before anyone else was blamed', 2], ['truth', 'Corrected a bill that was in {p} favour', 2], ['truth', 'Told the buyers about the leaking roof', 2], ['truth', 'Reported {p} own mistake to the inspectors', 2], ['truth', 'Gave back a prize won by a judge\'s error', 2], ['truth', 'Refused to sign a report that was a lie', 2], ['truth', 'Exposed the poisoned river and lost {p} job', 3], ['truth', 'Testified against a gang to free a stranger', 3], ['truth', 'Printed the truth when the mayor forbade it', 3], ['truth', 'Gave up a fortune rather than swear a lie', 3], ['truth', 'Cleared a dead man\'s name after thirty years', 3],
  ['courage', 'Sang on stage though {p} knees shook', 1], ['courage', 'Caught the spider for the whole office', 1], ['courage', 'Was first to say sorry after every quarrel', 1], ['courage', 'Walked a frightened friend home each night', 1], ['courage', 'Asked the question everyone feared to ask', 1], ['courage', 'Chased a thief to get an old man\'s bag back', 2], ['courage', 'Stepped between a mob and a stranger', 2], ['courage', 'Climbed the tower to free a trapped boy', 2], ['courage', 'Carried a hiker down the mountain at night', 2], ['courage', 'Stood by a friend when the town turned away', 2], ['courage', 'Talked a stranger down from the bridge', 2], ['courage', 'Drove the ambulance through the storm', 2], ['courage', 'Hid a hunted family in {p} cellar for a year', 3], ['courage', 'Dragged six sailors from a sinking boat', 3], ['courage', 'Stayed at the dam to warn the valley', 3], ['courage', 'Went back into the mine for the last man', 3],
  ['work', 'Baked bread for the street before dawn', 1], ['work', 'Never left a job half done', 1], ['work', 'Mended shoes for whatever people could pay', 1], ['work', 'Stayed late so the newcomer could go home', 1], ['work', 'Kept the village clock right for fifty years', 1], ['work', 'Swept the snow from every neighbour\'s door', 1], ['work', 'Trained a hundred apprentices for nothing', 2], ['work', 'Kept the lighthouse lit for forty winters', 2], ['work', 'Delivered the post in every flood and storm', 2], ['work', 'Planted ten thousand trees on the bare hill', 2], ['work', 'Ran the night soup kitchen for thirty years', 2], ['work', 'Found the cure and gave it away for free', 3], ['work', 'Dug the tunnel that brought water to a city', 3], ['work', 'Rebuilt the village school with {p} own hands', 3], ['work', 'Delivered every baby in the valley, unpaid', 3], ['work', 'Ran the mine forty years: not one life lost', 3],
];
const BAD = [
  ['animal', 'Kicked the neighbour\'s dog', 1], ['animal', 'Poisoned the pigeons in the square', 2], ['animal', 'Ran a cruel dogfighting ring', 3], ['animal', 'Left {p} horse to starve', 2],
  ['family', 'Missed every birthday of {p} son', 1], ['family', 'Cheated {p} brother out of the farm', 2], ['family', 'Abandoned {p} family for money', 3], ['family', 'Never visited {p} dying mother', 2],
  ['money', 'Stole sweets from the corner shop', 1], ['money', 'Cheated old people out of their savings', 3], ['money', 'Took bribes as a judge', 2], ['money', 'Never paid back a loan', 1],
  ['truth', 'Lied on every tax return', 1], ['truth', 'Spread rumours that ruined a career', 2], ['truth', 'Let an innocent man go to prison', 3], ['truth', 'Faked {p} own death for the insurance', 2],
  ['courage', 'Ran away and left {p} friend in danger', 2], ['courage', 'Hid while {p} village burned', 1], ['courage', 'Blamed a child for {p} own crash', 2], ['courage', 'Sold out the resistance to the enemy', 3],
  ['work', 'Never finished a day\'s work honestly', 1], ['work', 'Built a school with rotten beams', 3], ['work', 'Sold fake medicine', 3], ['work', 'Took the credit for a friend\'s invention', 2],
  ['animal', 'Pulled the cat\'s tail whenever it passed', 1], ['animal', 'Scared the pigeons just for fun', 1], ['animal', 'Forgot to feed the goldfish for a week', 1], ['animal', 'Shooed the hungry stray from {p} door', 1], ['animal', 'Let {p} dog bark all night, every night', 1], ['animal', 'Never cleaned out the rabbit hutch', 1], ['animal', 'Dumped a litter of kittens by the road', 2], ['animal', 'Kept a songbird in a cage too small to turn', 2], ['animal', 'Sold sick puppies as healthy ones', 2], ['animal', 'Chained {p} dog outside through every winter', 2], ['animal', 'Raced {p} horse until it went lame', 2], ['animal', 'Poached the last eagles of the valley', 3], ['animal', 'Burned the forest to clear cheap grazing', 3], ['animal', 'Poisoned the river that fed the herds', 3], ['animal', 'Sold stolen pets to whoever paid', 3], ['animal', 'Starved {p} circus animals to save money', 3],
  ['family', 'Forgot {p} wedding anniversary nine times', 1], ['family', 'Ate the children\'s sweets and blamed the dog', 1], ['family', 'Never once rang {p} grandmother', 1], ['family', 'Skipped {p} brother\'s wedding to go fishing', 1], ['family', 'Fell asleep at {p} daughter\'s school play', 1], ['family', 'Always "too busy" to visit {p} parents', 1], ['family', 'Spent the children\'s school money on cards', 2], ['family', 'Turned {p} sister away on a winter night', 2], ['family', 'Told {p} son he would never be anything', 2], ['family', 'Sold {p} mother\'s ring behind her back', 2], ['family', 'Set {p} children against each other', 2], ['family', 'Put {p} old father out on the street', 3], ['family', 'Gambled away the family home', 3], ['family', 'Took {p} orphaned nephew\'s inheritance', 3], ['family', 'Left {p} children alone for weeks on end', 3], ['family', 'Disowned {p} daughter for marrying poor', 3],
  ['money', 'Never once paid for a round', 1], ['money', 'Took coins from the wishing fountain', 1], ['money', 'Slipped out of the café without paying', 1], ['money', 'Kept the change meant for the collection', 1], ['money', 'Short-changed tourists at {p} stall', 1], ['money', 'Sold watered milk for thirty years', 2], ['money', 'Paid {p} workers half what was promised', 2], ['money', 'Borrowed from friends with no plan to repay', 2], ['money', 'Raised the rent on a widow every winter', 2], ['money', 'Rigged the scales at {p} market stall', 2], ['money', 'Pocketed the money raised for the flood', 2], ['money', 'Emptied the village pension fund', 3], ['money', 'Ran a lottery that nobody could ever win', 3], ['money', 'Lent to the poor at ruinous interest', 3], ['money', 'Sold the same house to five families', 3], ['money', 'Stole the orphanage\'s winter coal money', 3],
  ['truth', 'Said "the cheque is in the post" for a year', 1], ['truth', 'Claimed {p} dog ate the homework, at forty', 1], ['truth', 'Lied about {p} golf score every week', 1], ['truth', 'Told everyone the fish was twice as big', 1], ['truth', 'Copied {p} neighbour\'s exam answers', 1], ['truth', 'Blamed the wind for the broken vase', 1], ['truth', 'Forged {p} school certificates', 2], ['truth', 'Lied under oath to win a boundary quarrel', 2], ['truth', 'Wrote unsigned letters to shame a neighbour', 2], ['truth', 'Sold a "miracle" hair tonic made of mud', 2], ['truth', 'Told a rival\'s customers he had the plague', 2], ['truth', 'Accused a rival falsely and ruined his family', 3], ['truth', 'Hid the factory\'s poison from the town', 3], ['truth', 'Wrote the lies that started a riot', 3], ['truth', 'Forged a will and left the heirs with nothing', 3], ['truth', 'Swore the bridge was safe when it was not', 3],
  ['courage', 'Let {p} little brother take the blame', 1], ['courage', 'Hid in the toilet when the bill arrived', 1], ['courage', 'Crossed the road to avoid a crying friend', 1], ['courage', 'Never once said sorry first', 1], ['courage', 'Laughed along when a friend was mocked', 1], ['courage', 'Pretended to be asleep when the baby cried', 1], ['courage', 'Watched a robbery and told no one', 2], ['courage', 'Drove away from a crash that was {p} fault', 2], ['courage', 'Let a friend go to prison in {p} place', 2], ['courage', 'Stayed silent while a colleague was framed', 2], ['courage', 'Abandoned {p} post on the night of the storm', 2], ['courage', 'Took the last lifeboat seat from a child', 3], ['courage', 'Locked the door on neighbours fleeing a fire', 3], ['courage', 'Deserted and left {p} comrades surrounded', 3], ['courage', 'Gave up the hiding families to save {p} skin', 3], ['courage', 'Let the dam fail rather than admit a fault', 3],
  ['work', 'Took two-hour lunches for thirty years', 1], ['work', 'Stole pens from the office every day', 1], ['work', 'Let the others carry the heavy end', 1], ['work', 'Called in sick every sunny Friday', 1], ['work', 'Never once refilled the coffee pot', 1], ['work', 'Slept on the night watch', 1], ['work', 'Sacked a man for being right', 2], ['work', 'Sold the firm\'s secrets to a rival', 2], ['work', 'Made the apprentices work unpaid', 2], ['work', 'Signed off repairs that were never done', 2], ['work', 'Watered the cement to pocket the saving', 2], ['work', 'Blamed {p} own errors on the newest clerk', 2], ['work', 'Sent miners down a shaft known to be unsafe', 3], ['work', 'Dumped the tannery\'s waste in the well', 3], ['work', 'Sold rotten grain to a hungry town', 3], ['work', 'Worked children fourteen hours in {p} mill', 3],
];
const SMALL_GOOD = [['animal', 'Rescued a bird with a broken wing'], ['family', 'Wrote to grandma every month'], ['money', 'Dropped coins in every hat'], ['truth', 'Told the cashier she gave too much change'], ['courage', 'Spoke up for a new kid'], ['work', 'Helped a neighbour build a shed'],
  ['animal', 'Shared {p} lunch with a stray dog'], ['animal', 'Moved a worm off the hot pavement'], ['animal', 'Left crumbs on the sill every winter'], ['animal', 'Stopped the traffic for a family of ducks'], ['animal', 'Always scratched the donkey behind the ears'],
  ['family', 'Let {p} little brother win at cards'], ['family', 'Kept {p} mother\'s recipes going'], ['family', 'Sent {p} uncle a postcard from every trip'], ['family', 'Took the blame for a cousin\'s broken vase'], ['family', 'Saved the last slice for {p} sister'],
  ['money', 'Paid a stranger\'s bus fare'], ['money', 'Left a big tip on a small bill'], ['money', 'Bought a tired busker a hot meal'], ['money', 'Lent {p} umbrella and never wanted it back'], ['money', 'Put a coin under every child\'s pillow'],
  ['truth', 'Owned up to eating the last biscuit'], ['truth', 'Pointed out a bill that was too small'], ['truth', 'Returned a pen borrowed years before'], ['truth', 'Said "I was wrong" and meant it'], ['truth', 'Kept every secret {p} friends told {o}'],
  ['courage', 'Tried the food nobody else dared to'], ['courage', 'Danced first at every wedding'], ['courage', 'Held a stranger\'s hand at the dentist'], ['courage', 'Asked for help and was not ashamed'], ['courage', 'Stood up to speak for a shy friend'],
  ['work', 'Always washed up the office cups'], ['work', 'Stayed to stack the chairs afterwards'], ['work', 'Showed the new clerk where everything was'], ['work', 'Fixed the neighbour\'s gate without a word'], ['work', 'Left every borrowed tool cleaner than before']];
const SMALL_BAD = [['animal', 'Threw stones at the ducks'], ['family', 'Read {p} sister\'s diary'], ['money', 'Kept a library book for ever'], ['truth', 'Lied about {p} age'], ['courage', 'Pretended not to see a fall'], ['work', 'Slept through {p} shifts'],
  ['animal', 'Teased the parrot until it swore'], ['animal', 'Stepped on ants for something to do'], ['animal', 'Never let the cat sit on {p} lap'], ['animal', 'Hid the dog\'s favourite ball'], ['animal', 'Laughed when the goat fell in the pond'],
  ['family', 'Hid the last cake from {p} own children'], ['family', 'Never wrote back to {p} aunt'], ['family', 'Gave away {p} mother\'s presents'], ['family', 'Borrowed {p} brother\'s bike and bent it'], ['family', 'Snored through every family dinner'],
  ['money', 'Never put a coin in the hat'], ['money', 'Took the bigger half, every time'], ['money', 'Borrowed a fiver and "forgot"'], ['money', 'Peeled the price off and paid less'], ['money', 'Left before the bill came, twice a month'],
  ['truth', 'Said "five minutes away" from {p} bed'], ['truth', 'Bragged about books never opened'], ['truth', 'Blamed the dog for the smell'], ['truth', 'Faked a cough to skip the wedding'], ['truth', 'Peeked at the cards, every game'],
  ['courage', 'Let someone else catch the mouse'], ['courage', 'Hid when the doorbell rang'], ['courage', 'Never spoke up at the meeting, then moaned'], ['courage', 'Left a friend to face the angry goose'], ['courage', 'Blamed the referee for {p} own miss'],
  ['work', 'Left early every Friday'], ['work', 'Hid broken tools at the back of the shed'], ['work', 'Took the credit for the tea round'], ['work', 'Passed the dull jobs to the new boy'], ['work', 'Was "just resting {p} eyes" at {p} desk']];
const SHE = ['Agnes', 'Clara', 'Edith', 'Greta', 'Ines', 'Lena', 'Nadia', 'Priya', 'Rosa', 'Tilde', 'Vera', 'Yara', 'Amara', 'Dana', 'Ngozi', 'Mei', 'Ada', 'Bisi', 'Celia', 'Dalia', 'Efua', 'Freya', 'Hana', 'Imani', 'Joan', 'Kemi', 'Lucia', 'Maud', 'Nora', 'Olga', 'Pilar', 'Queenie', 'Ruth', 'Sunita', 'Tamsin', 'Una', 'Wanda', 'Xenia', 'Zainab', 'Aiko'], HE = ['Boris', 'Desmond', 'Felix', 'Hugo', 'Jasper', 'Kofi', 'Mateo', 'Otto', 'Quentin', 'Sven', 'Umar', 'Wilf', 'Zeke', 'Bao', 'Chidi', 'Emeka', 'Anton', 'Bram', 'Cedric', 'Dele', 'Enzo', 'Faisal', 'Gus', 'Hamid', 'Ivo', 'Jomo', 'Kenji', 'Lars', 'Musa', 'Nils', 'Obi', 'Pavel', 'Rafa', 'Segun', 'Tomas', 'Uche', 'Viktor', 'Walt', 'Yusuf', 'Zoran'];
const say3 = (s, t) => t.replace(/\{p\}/g, s.female ? 'her' : 'his').replace(/\{o\}/g, s.female ? 'her' : 'him');
const LAST = ['Abbot', 'Baker', 'Carver', 'Dunn', 'Ekwueme', 'Fisher', 'Grant', 'Hale', 'Ito', 'Jones', 'Kovac', 'Lund', 'Mbeki', 'Novak', 'Oduya', 'Park', 'Quist', 'Reyes', 'Sato', 'Turner', 'Adeyemi', 'Brandt', 'Castillo', 'Diallo', 'Eze', 'Fontaine', 'Greaves', 'Haddad', 'Ivanov', 'Jensen', 'Kimura', 'Larsen', 'Moreau', 'Nwosu', 'Okafor', 'Petrov', 'Quinn', 'Rossi', 'Suleiman', 'Tanaka', 'Usman', 'Varga', 'Weller', 'Yilmaz', 'Zubair'];
const CAUSE = ['in {p} sleep, aged', 'falling off a ladder, aged', 'of a broken heart, aged', 'laughing too hard, aged', 'in a storm at sea, aged', 'of old age, aged', 'in a car crash, aged', 'choking on a fishbone, aged', 'peacefully at home, aged', 'struck by lightning, aged', 'chasing {p} hat into the road, aged', 'of a cold that would not go, aged', 'in the garden among {p} roses, aged', 'dancing at a wedding, aged', 'of a surfeit of plums, aged', 'saving a kite from a tree, aged', 'in {p} favourite armchair, aged', 'of a fever in the rainy season, aged', 'in a rockfall on the pass, aged', 'at {p} desk, pen in hand, aged', 'after one sneeze too many, aged', 'in the middle of a sentence, aged', 'on the way to market, aged', 'in the middle of a very long nap, aged'];
// the day's rules: what they change (mult for one kind of deed, or a kind of soul always goes one way)
const DAYRULES = [
  { id: 'none', text: 'No special rule today.' },
  { id: 'x2', kind: 'animal', text: 'Deeds to ANIMALS 🐾 count double today.' }, { id: 'x2', kind: 'family', text: 'Deeds in the FAMILY 🏠 count double today.' },
  { id: 'x2', kind: 'money', text: 'Deeds with MONEY 🪙 count double today.' }, { id: 'x2', kind: 'truth', text: 'TRUTH and LIES 🗣️ count double today.' },
  { id: 'x2', kind: 'courage', text: 'COURAGE and COWARDICE 🔥 count double today.' }, { id: 'x2', kind: 'work', text: 'Deeds at WORK 🔨 count double today.' },
  { id: 'young', text: 'Mercy: souls under 12 go to Heaven, whatever they did.' }, { id: 'old', text: 'Souls over 100 have earned their rest: Heaven.' },
  { id: 'nomist', text: 'Purgatory is closed: an even soul goes to Heaven today.' },
];
const UPGRADES = [
  { id: 'choir', name: 'Choir', desc: 'More karma for every soul you send on.', max: 3, cost: l => 12 + l * 12 },
];
const OLD_UPGRADES = [
  { id: 'sight', name: 'Second sight', desc: 'One more look in the Book each day.', max: 3, cost: l => 10 + l * 12 },
  { id: 'grace', name: 'Grace', desc: 'One more wrong judgement forgiven.', max: 2, cost: l => 30 + l * 30 },
  { id: 'sun', name: 'Long summer', desc: 'The sun sets later.', max: 3, cost: l => 8 + l * 10 },
  { id: 'lantern', name: 'Lantern', desc: 'Deeds that today\'s rule doubles glow.', max: 1, cost: () => 25 },
  { id: 'quill', name: 'Clerk\'s quill', desc: 'Forged deeds smudge where you can see them.', max: 1, cost: () => 40 },
  { id: 'choir', name: 'Choir', desc: 'More karma for judgements in a row.', max: 3, cost: l => 12 + l * 12 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Gatekeeper'], [40, 'Cherub'], [130, 'Angel'], [320, 'Archangel'], [700, 'Seraph'], [1500, 'Saint']];

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help,
    souls: Math.round(x(14, 20, 30)), wrongs: 3 + upLv('grace'), looks: Math.max(2, Math.round(x(14, 20, 30) * x(0.3, 0.85, 25) * x(0.9, 0.3, 25))) + (N <= 5 ? 1 : 0) + upLv('sight'),
    hidden: x(0.4, 2.2, 25), close: x(0.3, 0.85, 25), liars: N < 6 ? 0 : x(0.1, 0.35, 30), mist: x(0.12, 0.2, 30),
    secs: x(11, 4.2, 35) * (help ? 1.25 : 1) * (1 + 0.12 * upLv('sun')), rules: N < 3 ? 0 : N < 15 ? 1 : 2 };
}
function dayRules(N) { if (N < 3) return []; const R = rng(N * 9157 + 3); R(); const out = []; const n = N < 15 ? 1 : 2; let tries = 0;
  while (out.length < n && tries++ < 20) { const r = DAYRULES[1 + ((R() * (DAYRULES.length - 1)) | 0)]; if (!out.includes(r) && !(r.id !== 'x2' && out.some(q => q.id === r.id))) out.push(r); } return out; }
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, sent: { up: 0, down: 0, side: 0 },
    rules: [], queue: [], soul: null, judged: 0, right: 0, wrong: 0, streak: 0, best: 0, looks: cfg.looks, sun: 0, karma: 0, id: 0, gap: 0 };
  G.sunLen = 1e9; G.looks = 1e9;      // no sunset, no limit on reading the Book
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.queue = makeQueue(G, cfg.souls); nextSoul(G); }
  return G;
}
// the true count of a soul under today's rules
function mult(G, d) { return G.rules.some(r => r.id === 'x2' && r.kind === d.kind) ? 2 : 1; }
function score(G, s) { let t = 0; for (const d of s.deeds) if (!d.forged) t += d.w * mult(G, d); return t; }
function verdict(G, s) {
  if (G.rules.some(r => r.id === 'young') && s.age < 12) return 'up'; if (G.rules.some(r => r.id === 'old') && s.age > 100) return 'up';
  const t = score(G, s); return t > 0 ? 'up' : t < 0 ? 'down' : G.rules.some(r => r.id === 'nomist') ? 'up' : 'side';
}
// a soul built from the answer it should have: an even share of Heaven, Hell and (some) Purgatory; close calls more often later
function makeSoul(G, want, o = {}) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G);
  for (let tries = 0; tries < 200; tries++) {
    const used = G.used || (G.used = new Set()), fresh = (L, nm) => { if (!(typeof HEADLESS !== 'undefined' && HEADLESS) && !G.lesson) return dealOf(nm, L, R); let d = L[(R() * L.length) | 0]; for (let i = 0; i < 6 && used.has(d); i++) d = L[(R() * L.length) | 0]; return d; }, g = fresh(GOOD, 'good'), b = fresh(BAD, 'bad');      /* in play: from the deck that remembers, so of 120 best things none comes twice until the other 119 have */      /* no deed twice in one day at the gate */
    const nh = o.hidden != null ? o.hidden : Math.min(3, Math.floor(R() * (c.hidden + 0.999) + (R() < c.hidden % 1 ? 1 : 0)));
    const deeds = [{ kind: g[0], text: g[1], w: g[2], best: true }, { kind: b[0], text: b[1], w: -b[2], worst: true }];
    for (let i = 0; i < nh; i++) { const good = R() < 0.5, SL = good ? SMALL_GOOD : SMALL_BAD, s = SL[deal(good ? 'sg' : 'sb', SL.length, R)]; deeds.push({ kind: s[0], text: s[1], w: good ? 1 : -1, hidden: true }); }
    const liar = false;
    const age = o.age != null ? o.age : R() < 0.06 ? 6 + ((R() * 5) | 0) : R() < 0.06 ? 101 + ((R() * 5) | 0) : 18 + ((R() * 80) | 0);
    const female = R() < 0.5, s = { id: ++G.id, name: (female ? SHE : HE)[(R() * (female ? SHE : HE).length) | 0] + ' ' + LAST[(R() * LAST.length) | 0], age, cause: CAUSE[(R() * CAUSE.length) | 0], deeds, liar, face: (R() * 1e9) | 0, female, looked: false };
    deeds.forEach(d => d.text = say3(s, d.text)); s.cause = say3(s, s.cause);      /* "in her sleep" was said of the men too */
    // close calls: the visible sum near zero, so the sealed deeds decide (more often later)
    const vis = deeds.filter(d => !d.hidden).reduce((a, d) => a + d.w * mult(G, d), 0), close = Math.abs(vis) <= nh;
    if (o.close != null && close !== o.close) continue; if (o.close == null && close && R() > c.close) continue;
    used.add(g); used.add(b); return s;
  }
  return null;
}
function makeQueue(G, n) {
  const R = G.rnd, c = G.cfg, out = [], nside = G.rules.some(r => r.id === 'nomist') ? 0 : Math.max(1, Math.round(n * c.mist)), nup = Math.floor((n - nside) / 2), wants = [];      // an even share, shuffled
  for (let i = 0; i < n; i++) wants.push(i < nside ? 'side' : i < nside + nup ? 'up' : 'down'); for (let i = wants.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [wants[i], wants[j]] = [wants[j], wants[i]]; }
  for (const want of wants) { const s = makeSoul(G, want) || makeSoul(G, want, { hidden: 0 }) || makeSoul(G, 'up'); out.push(s); }
  return out;
}
function nextSoul(G) { G.soul = G.queue.shift() || null; G.wait = 0; if (G.soul) { G.soul.t0 = G.t; G.ev.push({ k: 'soul' }); } }
// ---------- the thumb ----------
function judge(G, dir) {      // wherever you send them is your answer: nothing is right or wrong
  const s = G.soul; if (G.over || !s || G.gap > 0) return; G.judged++; G.gap = 0.55; G.last = { s, dir }; G.sent[dir]++; G.right++;
  if (!G.lesson) { const b = s.deeds.find(d => d.best), w = s.deeds.find(d => d.worst); (G.log = G.log || []).push({ dir, bk: b.kind, bw: b.w, wk: w.kind, ww: -w.w, hid: s.deeds.some(d => d.hidden), looked: !!s.looked, age: s.age, dt: Math.min(30, G.t - (s.t0 || G.t)) }); }
  G.karma += 1 * (1 + 0.25 * upLv('choir')); G.ev.push({ k: 'right', dir, n: 0 }); lessonSee(G, 'right');
}
function look(G) {
  const s = G.soul; if (G.over || !s || s.looked || G.gap > 0) return false; if (G.looks <= 0) { G.ev.push({ k: 'nolooks' }); return false; }
  s.looked = true; G.ev.push({ k: 'look', n: s.deeds.filter(d => d.hidden).length }); lessonSee(G, 'look'); return true;
}
function step(G, dt) {
  if (G.over) return; G.t += dt;
  if (G.gap > 0) { G.gap -= dt; if (G.gap <= 0) { G.gap = 0; nextSoul(G); if (!G.soul) { if (G.lesson) lessonSee(G, 'done'); else finish(G, true); } } return; }
}
function finish(G, win, why) {
  const c = G.cfg; G.over = win ? 'won' : 'lost';
  const stars = win ? 3 : 0;      // a day done is a day done: no grading
  G.res = { win, why, stars, log: G.log || [], sent: G.sent, right: G.right, wrong: G.wrong, judged: G.judged, souls: c.souls, best: G.best, karma: Math.round(G.karma + (win ? stars * 2 + Math.ceil(G.N / 3) : 0)), combo: G.best, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- what your gate says about you ----------
// 25 Nov 2026, his review: "At the end of every level analysze who the person sent to heaven hell of purgatory and tell them something
// instresting about themselves and what they value. It should be short but they can click for a deeper analysis maybe a paragraph long
// that says you value x y z and some predictable possible persnility traits always flatter the player. Even if they are dead wrong
// sometimes find anything good." Nothing here says a verdict was right or wrong (his rule of 23 Nov stands): it reads what you
// rewarded and what you would not forgive, how you used Purgatory and the Book, and how fast you were sure; and every reading is kind.
const VAL = { animal: ['kindness to animals', 'gentle', 'been kind to animals', 'been cruel to an animal', 'gentle and patient, and quick to notice anyone who cannot speak up for themselves'],
  family: ['family', 'loyal', 'stood by their family', 'let their family down', 'loyal and dependable: the ones the others call when something goes wrong'],
  money: ['generosity', 'generous', 'given freely', 'cheated or taken what was not theirs', 'warm and open-handed: they give without keeping count'],
  truth: ['honesty', 'honest', 'told the truth when it cost them', 'lied when it mattered', 'straight talkers people trust, who keep a promise and have no time for gossip'],
  courage: ['courage', 'brave', 'shown real courage', 'run when they were needed', 'brave in their own lives: the ones who step forward when others hold back'],
  work: ['honest work', 'dependable', 'worked hard for others', 'cheated at their work', 'steady and reliable: they finish what they start'] };
function tally(log, T) { T = T || { n: 0, up: 0, down: 0, side: 0, looked: 0, sealed: 0, time: 0, redeem: 0, strict: 0, k: {} }; for (const k2 in VAL) T.k[k2] = T.k[k2] || { gu: 0, gd: 0, gs: 0, bu: 0, bd: 0, bs: 0 };
  for (const e of log) { T.n++; T[e.dir]++; if (e.hid) { T.sealed++; if (e.looked) T.looked++; } T.time += e.dt; T.k[e.bk]['g' + e.dir[0]]++; T.k[e.wk]['b' + e.dir[0]]++; if (e.dir === 'up' && e.ww >= e.bw) T.redeem++; if (e.dir === 'down' && e.bw >= e.ww) T.strict++; } return T; }
// today's souls (log) and everything before (life, a tally kept from day to day): { title, line, values, deep }
function reading(log, life) { const D = tally(log), A = tally(log, life ? JSON.parse(JSON.stringify(life)) : null), n = Math.max(1, D.n), plural = (q, w) => `${q} ${w}${q === 1 ? '' : 's'}`;
  // what you value: the kinds of good you rewarded and the kinds of wrong you would not forgive (today counts double)
  const care = k2 => { const a = A.k[k2], d = D.k[k2], seen = a.gu + a.gd + a.gs + a.bu + a.bd + a.bs + d.gu + d.gd + d.gs + d.bu + d.bd + d.bs; return seen ? ((a.gu + d.gu + a.bd + d.bd) * 2 - (a.gd + d.gd + a.bu + d.bu)) / (seen + 2) : -9; };
  const ks = Object.keys(VAL).sort((a, b) => care(b) - care(a)), vals = ks.slice(0, A.n >= 30 && care(ks[2]) > 0.4 ? 3 : 2), v1 = vals[0];
  const up = D.up / n, down = D.down / n, side = D.side / n;
  const style = side >= 0.4 ? ['THE THOUGHTFUL', `You did not rush: ${plural(D.side, 'soul')} went to Purgatory. You can live with a question that has no easy answer.`, 'open-minded']
    : up >= 0.6 ? ['THE MERCIFUL', `You look for the good in people: ${D.up} of ${D.n} went to Heaven.`, 'warm-hearted']
    : down >= 0.6 ? ['THE JUST', `For you, what people do matters: ${D.down} of ${D.n} answered for it. That is a strong sense of justice.`, 'principled']
    : ['THE FAIR', `No two verdicts alike: ${D.up} up, ${D.down} down, ${D.side} between. You weigh each life on its own.`, 'even-handed'];
  const list = vals.map(k2 => VAL[k2][0]), listTxt = list.length > 2 ? `${list[0]}, ${list[1]} and ${list[2]}` : list.join(' and ');
  // the paragraph
  const P = [`You value ${listTxt}.`], d1 = D.k[v1], g1 = d1.gu + d1.gd + d1.gs, b1 = d1.bu + d1.bd + d1.bs;
  if (d1.gu > 0 && d1.gu * 2 >= g1) P.push(`Today ${d1.gu === g1 ? (g1 === 1 ? 'the one soul' : `all ${g1} souls`) : `${d1.gu} of the ${g1} souls`} who had ${VAL[v1][2]} went to Heaven${d1.bd > 0 ? `, and ${d1.bd === b1 ? (b1 === 1 ? 'the one' : `all ${b1}`) : `${d1.bd} of the ${b1}`} who had ${VAL[v1][3]} went to Hell` : ''}.`);
  else if (d1.bd > 0) P.push(`Today ${d1.bd === b1 ? (b1 === 1 ? 'the one soul' : `all ${b1} souls`) : `${d1.bd} of the ${b1} souls`} who had ${VAL[v1][3]} went to Hell: it is the thing you find hardest to forgive.`);
  if (D.redeem >= 2 && D.redeem >= D.strict) P.push(`${D.redeem} times you opened Heaven to someone whose worst deed was as heavy as their best: you believe people are more than the worst thing they did.`);
  else if (D.strict >= 2) P.push(`${D.strict} times a great good deed was not enough for you: there are lines you will not see crossed, and you are not easily bought.`);
  else P.push(style[1]);
  if (D.sealed >= 2 && D.looked / D.sealed >= 0.6) P.push(`You opened the Book for ${D.looked} of ${D.sealed} sealed lives: you want the whole story before you decide, the mark of a careful mind.`);
  else if (D.sealed >= 2 && D.looked / D.sealed <= 0.25) P.push(`You hardly needed the Book: you trust your first reading of a person.`);
  const avg = D.time / n; if (avg > 0 && avg < 3) P.push('And you were quick about it: sure of your own compass.'); else if (avg > 8) P.push('And you took your time: you do not hand out a verdict lightly.');
  P.push(`People who judge like this are often ${VAL[v1][4]}. ${style[2][0].toUpperCase() + style[2].slice(1)} and ${VAL[v1][1]}: that is a rare mix, and good company to keep.`);
  return { title: style[0], line: style[1], values: list, deep: P.join(' '), life: A }; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'weigh', title: 'YOU KEEP THE GATE', say: 'SWIPE UP, DOWN OR SIDEWAYS', do: 'swipe', dir: 'up', at: G => [W / 2, H * 0.7], how: 'Read the best and the worst thing each soul did, then send them where you think: swipe UP to Heaven, DOWN to Hell, SIDEWAYS to Purgatory. There is no right answer. Send three.', need: 3, ok: w => w === 'right', make: G => makeSoul(G, ['up', 'down', 'side'][(G.rnd() * 3) | 0], { hidden: 0 }) }],
  2: [{ id: 'book', title: 'THE BOOK OF LIFE', say: 'TAP THE BOOK', do: 'tap', how: 'Sealed scrolls hide smaller deeds. Tap the BOOK to read them, then send the soul where you think. Read two.', need: 2, ok: w => w === 'look', make: G => makeSoul(G, ['up', 'down', 'side'][(G.rnd() * 3) | 0], { hidden: 2 }) }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.looks = 99; lessonFeed(G); G.ev.push({ k: 'lessonnext', first: true }); }
function lessonFeed(G) { const st = lessonNow(G); G.queue = []; for (let i = 0; i < 3; i++) G.queue.push(st.make(G)); nextSoul(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i];
  if (what === 'done') { lessonFeed(G); return; }
  if (!st.ok(what)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); if (G.queue.length < 2) G.queue.push(st.make(G)); return; }
  D.i++; D.n = 0; D.miss = 0;
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.rules = []; Object.assign(G, { judged: 0, right: 0, wrong: 0, streak: 0, best: 0, karma: 0, sun: 0, looks: G.cfg.looks }); G.queue = makeQueue(G, G.cfg.souls); G.gap = 0.6; G.soul = null; }
  else { G.ev.push({ k: 'lessonnext' }); lessonFeed(G); }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; D.n = 0; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); if (G.queue.length < 2) G.queue.push(D.steps[D.i].make(G)); }

// ---------- for the robots ----------
// BLIND: swipe up, down or sideways; tap the Book
const BLIND = { u: G => judge(G, 'up'), d: G => judge(G, 'down'), s: G => judge(G, 'side'), b: G => look(G) };
// a gatekeeper who reads: adds the halos and horns under today's rule; if the sealed deeds could change the answer, looks
// (while looks last); otherwise judges the sign; a liar's forged deed only shows in the Book (or with the quill)
function honest(G, o, mem) {      // a gatekeeper who reads the card (and the Book, if anything is sealed), thinks, and sends the soul where they think
  const react = o.react == null ? 0.3 : o.react, s = G.soul;
  if (!s || G.gap > 0) return; if (mem.id !== s.id) { mem.id = s.id; mem.at = G.t + 1.2 + react * 4 + s.deeds.length * 0.4; } if (G.t < mem.at) return;
  if (!s.looked && s.deeds.some(d => d.hidden)) { look(G); mem.at = G.t + 0.6 + react; return; }
  const t = s.deeds.reduce((a, d) => a + d.w, 0); judge(G, Math.random() < 0.25 ? ['up', 'down', 'side'][(Math.random() * 3) | 0] : t > 0 ? 'up' : t < 0 ? 'down' : 'side');
}
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.queue.length = 0; G.soul = null; G.gap = 0; finish(G, true); }
