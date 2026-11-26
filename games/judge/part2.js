// ===================== RULES: The Bench (game 45, his idea) =====================
// You are the judge. Case after case is put before you (the defendant has pleaded guilty or been found guilty): read the facts,
// what the prosecution and the defence say, what the victim says, and WRITE YOUR OWN SENTENCE in plain words ("18 months in
// prison suspended for two years, and £500 compensation"). The clerk reads it back (Claude when the page can ask, or the court's
// own reader) and you confirm it. After every five sentences the judicial council (three judges: a hawk, a dove and a scholar)
// scores each one: was it in proportion to the crime and its circumstances, was it lawful (never above the maximum), did it put
// right what can be put right (compensation, a driving ban, treatment), was it consistent with your own earlier sentences.
// Pass their mark and you rise. Or switch the council off and sentence freely. Normal cases, or 18+ cases (murder and other
// grave crimes, told without gore). Thousands of different cases from offences x circumstances x people x stories.
const RULES = [
  'Read the case: the facts, the <b>⚠ things that make it worse</b> and the <b>✓ things in their favour</b>, and the maximum the law allows.',
  '<b>Write your own sentence</b> in plain words: prison (months or years, or suspended), community hours, a fine, compensation, a ban, treatment, a discharge.',
  'The clerk reads it back: <b>confirm</b> it or change it.',
  'After every <b>five</b> sentences the <b>council</b> scores you: in proportion, lawful, putting things right, consistent. Pass their mark to rise.',
  'Switch the council off on the home card to sentence freely. 18+ cases (murder and grave crimes) can be switched on there too.',
];
// ---------- the sentence scale: everything a court can do, on one line of severity ("points") ----------
// discharge 2-6, fine 8-30, community 15-30, suspended custody 30-40, immediate custody 40 upward (doubling every log step), life 110+
const custodyPts = m => 40 + 13 * Math.log2(1 + m / 6);
const ptsToMonths = p => Math.max(1, Math.round(6 * (Math.pow(2, (p - 40) / 13) - 1)));
function severity(S) { if (!S || !S.valid) return 0; if (S.acquit) return 0; let main = 0, extra = 0; const add = v => { if (v > main) { extra += main; main = v; } else extra += v; };
  if (S.life) add(110 + 0.6 * (S.minYears || 15)); if (S.custody && !S.life) add(S.suspended ? 30 + 10 * Math.min(1, S.custody / 24) : custodyPts(S.custody));
  if (S.hours) add(15 + 15 * Math.min(1, S.hours / 300)); if (S.fine) add(Math.min(30, 6 + 6 * Math.log2(1 + S.fine / 100))); if (S.probation) add(Math.min(14, 6 + S.probation * 0.3));
  if (S.discharge) add(S.discharge === 'absolute' ? 2 : 6); if (S.curfew) add(Math.min(18, 10 + S.curfew * 1.2)); if (S.ban) extra += 2; if (S.comp) extra += Math.min(6, 2 + Math.log2(1 + S.comp / 200));
  return main + Math.min(10, extra * 0.3); }
// ---------- the offences ----------
// c: the usual severity for a first offender with nothing special; w: how far either way is still fair; max: the most the law
// allows in months (0: no prison at all; Infinity: life); flags: money (a victim lost money: compensation expected), drive (a
// driving ban expected), mand (murder: life is the only lawful sentence). adult: only in 18+ mode.
const OFF = [
  { id: 'shoplift', name: 'Shoplifting', c: 12, w: 8, max: 6, money: [30, 300], what: ['took {item} worth £{loss} from {shop} without paying', 'walked out of {shop} with {item} worth £{loss} hidden in a bag', "filled a pushchair with {item} worth £{loss} at {shop} and walked out", "swapped price labels at {shop} to pay pennies for {item} worth £{loss}"] },
  { id: 'graffiti', name: 'Criminal damage', c: 16, w: 8, max: 24, money: [200, 2500], what: ['sprayed graffiti across {place}, costing £{loss} to clean', 'kicked in the glass of {place}; the repair cost £{loss}', "scratched names into every window of a bus parked at {place}; new glass cost £{loss}", "pulled down and burned the Christmas lights at {place}, costing £{loss}"] },
  { id: 'employer', name: 'Theft from an employer', c: 45, w: 10, max: 84, money: [2000, 30000], what: ['took £{loss} from the till at {shop} over eight months while trusted to cash up', 'used the company card at {shop} to spend £{loss} on themself', "sold stock from the back door of {shop} for cash, £{loss} in all, while assistant manager", "paid £{loss} in wages to a worker who did not exist and kept it"] },
  { id: 'pickpocket', name: 'Theft (pickpocketing)', c: 30, w: 9, max: 84, money: [80, 900], what: ['lifted a purse with £{loss} in it from a shopper at {place}', 'stole a phone worth £{loss} from a table at {place}', "took a wallet holding £{loss} from a coat hung on a chair at {place}", "worked the crowd at {place} in a team, lifting phones worth £{loss}"] },
  { id: 'bike', name: 'Bicycle theft', c: 22, w: 8, max: 84, money: [150, 1500], what: ['cut the lock of a bicycle worth £{loss} outside {place} and rode off', 'stole an electric bike worth £{loss} from a shed at {place}', "took a child's bicycle worth £{loss} from a front garden near {place} and sold it online", "stole a delivery rider's bike worth £{loss} while he was at a door near {place}"] },
  { id: 'scam', name: 'Fraud (phone scam)', c: 60, w: 10, max: 120, money: [3000, 40000], what: ['phoned older people pretending to be their bank and took £{loss} in total', 'ran a fake online shop at {place} that took £{loss} for goods that never came', "posed as a builder, took £{loss} in deposits from pensioners and never came back", "sent texts posing as a delivery firm and emptied accounts of £{loss}"] },
  { id: 'benefit', name: 'Benefit fraud', c: 32, w: 9, max: 84, money: [2000, 25000], what: ['kept claiming benefits after starting work and was overpaid £{loss}', 'claimed to live alone while living with a working partner, taking £{loss}', "claimed carer's allowance for a mother who had died, taking £{loss}", "hid savings from an inheritance while claiming, and was overpaid £{loss}"] },
  { id: 'assault', name: 'Common assault', c: 20, w: 8, max: 6, what: ['shoved a man to the ground in a queue at {place}', 'threw a drink and then a punch that missed in an argument at {place}', "slapped a parking warden who was writing a ticket outside {place}", "spat at a doorman and swung at him when refused entry at {place}"] },
  { id: 'drink', name: 'Drink driving', c: 24, w: 7, max: 6, drive: true, what: ['was stopped driving home from {place} at more than twice the limit', 'drove into a parked car outside {place} while over the limit', "was found asleep at the wheel at traffic lights by {place}, three times over the limit", "drove the wrong way round a roundabout near {place} after a wedding"] },
  { id: 'danger', name: 'Dangerous driving', c: 52, w: 10, max: 24, drive: true, what: ['raced another car through {place} at 70 mph past a school', 'fled the police at high speed through {place}, through two red lights', "overtook a queue of traffic on a blind bend by {place}, forcing a bus off the road", "did handbrake turns in the car park at {place} with shoppers walking by"] },
  { id: 'neglect', name: 'Animal neglect', c: 30, w: 9, max: 60, what: ['left two dogs shut in a flat at {place} for a week without food', 'kept a horse in a muddy field at {place} with no shelter or care all winter', "left forty hens without water in a locked shed near {place} in a heatwave", "kept a dog chained in a yard by {place} so long its collar had grown into its neck"] },
  { id: 'flytip', name: 'Fly-tipping', c: 18, w: 7, max: 60, money: [400, 4000], what: ['dumped a van-load of building rubbish in a lane by {place}; clearing it cost £{loss}', 'took money to clear house junk and tipped it in a nature reserve; the council spent £{loss}', "emptied a lorry of old tyres into a stream by {place}; clearing it cost £{loss}", "left fridges and mattresses outside a charity shop near {place} every week; removal cost £{loss}"] },
  { id: 'fakes', name: 'Selling counterfeit goods', c: 30, w: 9, max: 120, what: ['sold fake designer trainers from a stall at {place}', 'ran an online shop selling fake perfume, some of it harmful to skin', "sold fake phone chargers at {place}; two caught fire", "sold children's toys with fake safety marks from a van at {place}"] },
  { id: 'shed', name: 'Burglary (a garage)', c: 42, w: 9, max: 120, money: [300, 5000], what: ['broke into a garage at {place} at night and took tools worth £{loss}', 'forced a shed door at {place} and took a mower and tools worth £{loss}', "broke into the cricket club store by {place} and took equipment worth £{loss}", "cut the padlock off an allotment shed near {place} and took tools worth £{loss}"] },
  { id: 'hack', name: 'Computer misuse', c: 24, w: 9, max: 24, what: ['broke into the school system at {place} and changed grades', 'took down a council website for two days to win an argument online', "guessed a former boss's password and deleted the firm's customer records", "read a neighbour's emails for a year through her wifi and passed on the gossip"] },
  { id: 'brawl', name: 'Affray', c: 36, w: 9, max: 36, what: ['started a fight outside {place} in which two people were hurt', 'joined a street fight at {place} swinging a bottle', "squared up to rival fans outside {place}; chairs were thrown and a window broken", "took part in a fight at a wedding reception at {place} that put the best man in hospital"] },
  // morally complex
  { id: 'food', name: 'Theft (food and medicine)', c: 6, w: 9, max: 84, money: [20, 120], complex: true, what: ['took food and baby medicine worth £{loss} from {shop} after their benefits were stopped', 'stole insulin worth £{loss} for a diabetic partner they could not afford to pay for', "took nappies and bread worth £{loss} from {shop} the week the gas was cut off", "took school shoes worth £{loss} for a child who had been sent home for wearing trainers"] },
  { id: 'protest', name: 'Criminal damage (protest)', c: 20, w: 13, max: 120, money: [1000, 9000], complex: true, what: ['glued themself to {place} and sprayed paint on the doors in a climate protest; repairs cost £{loss}', 'broke the windows of an arms company office at {place} in protest; damage £{loss}', "let down the tyres of forty large cars near {place} in a pollution protest; call-outs cost £{loss}", "poured red dye into the fountain at {place} in a protest; cleaning cost £{loss}"] },
  { id: 'leak', name: 'Leaking official documents', c: 34, w: 16, max: 24, complex: true, what: ['gave a newspaper hospital files showing patients were left untreated to save money', 'leaked council emails showing a cover-up of unsafe flats', "sent a reporter safety reports a rail firm had buried before a crash", "published a care home's own records showing residents left unwashed for days"] },
  // 18+: grave crimes, told without gore
  { id: 'murder', name: 'Murder', adult: true, c: 122, w: 8, max: Infinity, mand: true, what: ['killed a business partner at {place} after a dispute over money', 'stabbed a rival to death outside {place} after a long feud'] },
  { id: 'mansl', name: 'Manslaughter (one punch)', adult: true, c: 86, w: 12, max: Infinity, what: ['threw a single punch outside {place}; the man fell, hit his head and died', 'pushed a man down the stairs at {place} in a row; he died of his injuries'] },
  { id: 'mercy', name: 'Manslaughter (mercy killing)', adult: true, c: 38, w: 24, max: Infinity, complex: true, what: ['ended the life of a terminally ill wife of fifty years who begged them to, then called the police', 'helped a paralysed son, in constant pain, to die at his own long request'] },
  { id: 'armed', name: 'Armed robbery', adult: true, c: 95, w: 10, max: Infinity, money: [5000, 60000], what: ['held up {shop} with a gun and took £{loss}', 'robbed a security van at knifepoint at {place}, taking £{loss}'] },
  { id: 'kidnap', name: 'Kidnapping', adult: true, c: 88, w: 10, max: Infinity, what: ['held a man in a flat at {place} for two days over a drug debt', 'forced an ex-partner into a car and drove her away against her will'] },
  { id: 'traffick', name: 'Drug trafficking', adult: true, c: 84, w: 12, max: Infinity, what: ['brought 3 kilos of cocaine through {place} hidden in a suitcase', 'ran a county drugs line out of {place}, using young runners'] },
  { id: 'gbh', name: 'Wounding with intent', adult: true, c: 82, w: 10, max: Infinity, what: ['attacked a man with a hammer at {place}, leaving him with a fractured skull', 'slashed a rival with a knife at {place}, causing lasting scars'] },
  { id: 'deathdrive', name: 'Causing death by dangerous driving', adult: true, c: 92, w: 10, max: 168, drive: true, what: ['raced through {place} at 90 mph and hit a cyclist, who died', 'drove on the phone at {place}, crossed into a car and killed its driver'] },
  { id: 'arson', name: 'Arson endangering life', adult: true, c: 86, w: 10, max: Infinity, what: ['set fire to a neighbour\'s front door at {place} at night with a family asleep inside', 'set fire to a flat at {place} to get insurance money, with people living above'] },
  { id: 'vigil', name: 'Grievous bodily harm (revenge)', adult: true, c: 55, w: 18, max: 60, complex: true, what: ['tracked down the man who had robbed and beaten their elderly mother and beat him badly', 'attacked a drunk driver, freed on bail, who had killed their brother'] },
  // 25 Nov 2026 (his words: "way more combinations... something novel each time"): 29 offences were the whole court list. 58 now, each told four ways.
  { id: 'cardamage', name: 'Criminal damage (vehicles)', c: 14, w: 8, max: 24, money: [300, 3000], what: ["scratched a key down the side of a neighbour's car outside {place}; the respray cost £{loss}", "slashed the tyres of four cars near {place}, costing £{loss}", "broke the wing mirrors off a row of parked cars by {place}; £{loss} in repairs", "poured paint over a rival's van outside {place}; the damage came to £{loss}"] },
  { id: 'handling', name: 'Handling stolen goods', c: 26, w: 9, max: 168, money: [200, 6000], what: ["sold stolen phones worth £{loss} from a stall at {place}", "kept a garage full of stolen bicycles worth £{loss} to sell on", "bought a van-load of stolen power tools worth £{loss}, knowing where they came from", "pawned jewellery worth £{loss} that a friend had taken in a burglary"] },
  { id: 'fare', name: 'Fare evasion', c: 8, w: 7, max: 3, money: [50, 900], what: ["travelled for months on a child's ticket, avoiding £{loss} in fares", "used a doctored season ticket through {place}; the unpaid fares came to £{loss}", "jumped the barriers at {place} every working day for a year, £{loss} in all", "bought tickets for one stop and rode the whole line, avoiding £{loss}"] },
  { id: 'harass', name: 'Harassment', c: 28, w: 10, max: 6, what: ["sent a former partner more than two hundred messages after being told to stop", "waited outside a neighbour's house night after night to frighten her", "posted a colleague's address online and urged strangers to visit", "phoned a worker at {shop} dozens of times a day after a complaint"] },
  { id: 'threat', name: 'Threatening behaviour', c: 22, w: 8, max: 6, what: ["screamed threats at staff in {shop} when refused a refund", "threatened a referee with a corner flag after a match near {place}", "shouted that he would burn a neighbour's house down in a row over a hedge", "cornered a bus driver at {place} and promised to wait for him after work"] },
  { id: 'banned', name: 'Driving while disqualified', c: 20, w: 8, max: 6, drive: true, what: ["drove to work past {place} every day for a month while banned from driving", "was stopped near {place} in a friend's car while disqualified", "drove a van for cash jobs around {place} with no licence and no insurance", "took the children to school by car for weeks during a driving ban"] },
  { id: 'hitrun', name: 'Failing to stop after an accident', c: 26, w: 9, max: 6, drive: true, what: ["clipped a cyclist near {place}, breaking her wrist, and drove on", "reversed into a parked car at {place} and left without a note; a witness took the number", "hit a walker's dog outside {place} and did not stop", "knocked a moped rider over near {place} and drove away in a panic"] },
  { id: 'tax', name: 'Tax evasion', c: 40, w: 10, max: 84, money: [5000, 60000], what: ["ran a cash business for six years and hid £{loss} from the taxman", "invented staff and expenses to avoid £{loss} in tax", "sold cars privately from a yard near {place} and declared none of the £{loss} owed", "kept two sets of books at a restaurant and underpaid £{loss}"] },
  { id: 'insure', name: 'Insurance fraud', c: 34, w: 9, max: 120, money: [2000, 20000], what: ["staged a car crash near {place} and claimed £{loss} for injuries that never happened", "reported a burglary that never took place and claimed £{loss}", "invented a holiday illness to claim £{loss}", "claimed £{loss} for a \"stolen\" watch that was in a drawer at home"] },
  { id: 'forge', name: 'Forgery', c: 30, w: 9, max: 120, what: ["sold fake safety certificates for unsafe cars from a garage near {place}", "forged a doctor's signature on sick notes sold to workmates", "sold fake parking permits to drivers around {place}", "faked a degree certificate to get a teaching job"] },
  { id: 'poach', name: 'Wildlife crime', c: 18, w: 8, max: 6, what: ["netted salmon at night from a protected river", "took the eggs of a rare bird from a nature reserve", "set illegal snares in woodland beside a footpath", "ran dogs after hares across a farmer's fields, wrecking the crop"] },
  { id: 'drugs', name: 'Possession of drugs', c: 9, w: 7, max: 60, what: ["was found with a small bag of cannabis at {place}", "was growing six cannabis plants in a wardrobe at home", "was caught with a few ecstasy tablets at a festival", "was stopped at {place} carrying cannabis for a bad back"] },
  { id: 'supply', name: 'Supplying drugs', c: 48, w: 10, max: 168, what: ["sold wraps of cocaine to students around {place}", "sold cannabis from the back of a takeaway near {place}", "delivered drugs by moped around {place} for a dealer", "sold pills to clubbers outside {place}"] },
  { id: 'burgle', name: 'Burglary (a home)', c: 58, w: 10, max: 168, money: [500, 8000], what: ["climbed through a kitchen window at night and took jewellery worth £{loss} while the family slept", "broke into a house while its owners were at a funeral and took goods worth £{loss}", "forced a back door and took laptops and cash worth £{loss}", "posed as a meter reader to get into a pensioner's home and took £{loss}"] },
  { id: 'robbery', name: 'Street robbery', c: 62, w: 10, max: Infinity, money: [100, 800], what: ["threatened a schoolboy at {place} and took his phone, worth £{loss}", "pulled a handbag holding £{loss} from a woman at {place}, dragging her to the ground", "surrounded a man at a cash machine near {place} and took £{loss}", "pushed a delivery rider off his bike at {place} and took £{loss} in takings"] },
  { id: 'nuisance', name: 'Public nuisance', c: 20, w: 9, max: 6, what: ["phoned in a false bomb warning that emptied {place} for three hours", "made forty hoax emergency calls in a month", "let off fireworks inside {place}", "climbed the roof of {place} for a dare, closing the street for a night"] },
  { id: 'dog', name: 'Dog dangerously out of control', c: 24, w: 9, max: 36, what: ["let a dog known to bite run loose at {place}, where it bit a child's arm", "ignored an order to muzzle a dog that then attacked a postman", "left a gate open; the dog killed a neighbour's cat and bit its owner", "set a dog chasing joggers at {place}; one fell and broke a hip"] },
  { id: 'unsafe', name: 'Selling unsafe food', c: 26, w: 9, max: 24, what: ["kept selling meals from a kitchen overrun with mice", "relabelled out-of-date meat and sold it at {place}", "swore a curry was nut-free; the customer spent a week in hospital", "ran a burger van at {place} with no running water after being ordered to close"] },
  { id: 'safety', name: 'Health and safety breach', c: 44, w: 11, max: 24, what: ["sent roofers up without harnesses; one fell and broke his back", "took the guard off a saw to speed up work; an apprentice lost two fingers", "ignored a gas warning at rented flats; a blast injured two tenants", "let children use a bouncy castle in high wind at {place}; three were hurt"] },
  { id: 'bribe', name: 'Bribery', c: 46, w: 11, max: 120, money: [1000, 20000], what: ["took £{loss} to pass unsafe cars at a test centre", "paid a council officer £{loss} to approve a building plan", "took £{loss} from a firm for the details of its rivals' bids", "took £{loss} to pass learner drivers who could not drive"] },
  { id: 'pervert', name: 'Perverting the course of justice', c: 44, w: 11, max: Infinity, what: ["took a friend's speeding points, swearing to have been the driver", "gave the police a false alibi for a brother accused of burglary", "wiped the cameras at {shop} after a fight involving a friend", "told a witness to \"forget\" what he saw outside {place}"] },
  { id: 'evict', name: 'Illegal eviction', c: 28, w: 10, max: 24, what: ["changed the locks on a family behind with the rent and put their things in the street", "cut off a tenant's water and power to force her out", "took the front door off a flat while the tenant was at work", "sent men round at night to frighten an elderly tenant into leaving"] },
  // morally complex
  { id: 'bins', name: 'Theft (thrown-away food)', c: 4, w: 9, max: 84, complex: true, what: ["took bags of thrown-away food from the bins behind {shop} to feed a hostel", "cut a lock to take bread a supermarket was about to throw away", "climbed a fence at {shop} for binned sandwiches to hand out to rough sleepers", "took crates of dented tins left for the skip at {shop} for a food bank"] },
  { id: 'assist', name: 'Assisting an offender', c: 26, w: 14, max: 120, complex: true, what: ["hid a son wanted for robbery for three weeks and lied to the police at the door", "drove a daughter to the airport knowing the police wanted her for fraud", "washed the blood from a brother's clothes after a fight he swore he did not start", "gave a friend who had skipped bail money and a bed"] },
  { id: 'medical', name: 'Growing cannabis (for pain)', c: 10, w: 12, max: 168, complex: true, what: ["grew cannabis at home to ease a wife's pain from multiple sclerosis", "made cannabis oil for a child with severe epilepsy after the prescription was refused", "grew cannabis for pain after an injury at work; none was sold", "gave home-grown cannabis, at cost, to three cancer patients"] },
  { id: 'defence', name: 'Assault (went too far in defence)', c: 22, w: 15, max: 60, complex: true, what: ["chased a burglar out of the house and beat him in the street, breaking his jaw", "hit a man who had been following a daughter home, knocking out two teeth", "struck a mugger with his own bat after taking it from him", "punched a man who was shouting abuse at a disabled passenger at {place}"] },
  { id: 'carefraud', name: 'Fraud (to pay for care)', c: 24, w: 14, max: 120, money: [2000, 20000], complex: true, what: ["took £{loss} from an employer to pay for a child's treatment abroad, meaning to repay it", "forged a late mother's signature to keep £{loss} of her pension for the care home bill", "claimed £{loss} in false expenses to pay a husband's cancer drugs", "borrowed £{loss} from a club's funds to stop a family being evicted"] },
  // 18+
  { id: 'attempt', name: 'Attempted murder', adult: true, c: 104, w: 9, max: Infinity, what: ["drove a car at a former partner outside {place}; she survived", "poisoned a husband's food over weeks for the insurance; doctors saved him", "pushed a business rival from a balcony at {place}; he lived, badly hurt", "set a trap on a neighbour's gas pipe after a long feud; it was found in time"] },
  { id: 'gross', name: 'Manslaughter (gross negligence)', adult: true, c: 70, w: 13, max: Infinity, what: ["ignored the fire inspector's warnings at a hostel; two residents died in a blaze", "sent out a lorry with failed brakes; a pedestrian was killed at {place}", "ran a fairground ride with a cracked arm at {place}; a rider died", "left a building site unfenced by {place}; a child fell into a trench and died"] },
  { id: 'slavery', name: 'Forced labour', adult: true, c: 90, w: 10, max: Infinity, what: ["kept six workers in a shed, took their passports and paid them nothing", "made trafficked men work at a car wash to pay off debts that never shrank", "kept a young woman as an unpaid servant for four years, never letting her out alone", "ran a farm gang who slept in a barn and were beaten if they asked for wages"] },
  { id: 'gun', name: 'Possessing a firearm', adult: true, c: 78, w: 9, max: Infinity, what: ["kept a loaded pistol under a bed for a gang", "was stopped near {place} with a sawn-off shotgun in a sports bag", "sold converted pistols from a workshop behind {place}", "hid three handguns in a child's toy box for an older cousin"] },
  { id: 'abused', name: 'Manslaughter (after years of abuse)', adult: true, c: 48, w: 22, max: Infinity, complex: true, what: ["killed a husband who had beaten her for twenty years, on the night he threatened the children", "stabbed a violent father who was attacking his mother", "killed a partner who had kept her locked in the house for years", "struck a stepfather who had beaten the family for a decade; he did not get up"] },
];
// things that make it worse (+) and things in their favour (-); each with the words the prosecution or defence uses
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
const NOVICTIM = ['fare', 'banned', 'tax', 'insure', 'forge', 'poach', 'drugs', 'supply', 'medical', 'bins', 'bribe', 'pervert', 'assist', 'gun', 'nuisance', 'cardamage'], PAPER = ['benefit', 'hack', 'leak', 'fakes', 'tax', 'insure', 'forge', 'fare', 'bribe', 'scam', 'employer', 'carefraud', 'flytip', 'pervert', 'handling'];      // offences with nobody hurt in person; offences done on paper or a screen
const AGG = [
  { id: 'prev', d: 12, t: 'Many previous convictions for the same thing', who: 'p' }, { id: 'prev1', d: 5, t: 'One previous conviction', who: 'p' },
  { id: 'vuln', d: 8, t: 'The victim was vulnerable (elderly or disabled)', who: 'p', not: ['drink', 'flytip', 'hack', 'fakes', 'benefit'].concat(NOVICTIM) },
  { id: 'plan', d: 6, t: 'It was planned', who: 'p' }, { id: 'trust', d: 6, t: 'A breach of trust', who: 'p', only: ['employer', 'scam', 'benefit', 'leak'] },
  { id: 'bail', d: 6, t: 'Committed while on bail for another offence', who: 'p' }, { id: 'noremorse', d: 4, t: 'No remorse shown', who: 'p' },
  { id: 'weapon', d: 10, t: 'A weapon was used', who: 'p', only: ['assault', 'brawl', 'kidnap', 'mansl', 'vigil', 'armed', 'gbh'] },
  { id: 'harm', d: 8, t: 'Lasting harm to the victim', who: 'p', not: ['flytip', 'hack', 'fakes', 'benefit', 'drink', 'shoplift', 'food'].concat(NOVICTIM) },
  { id: 'group', d: 5, t: 'Acted as part of a group', who: 'p', excl: ['minor'] }, { id: 'child', d: 7, t: 'A child was there and saw it', who: 'p', not: PAPER },
  { id: 'lead', d: 6, t: 'Played the leading role', who: 'p' }, { id: 'blame', d: 4, t: 'Tried to put the blame on someone else', who: 'p' },
  { id: 'hide', d: 4, t: 'Tried to hide the evidence', who: 'p' }, { id: 'order', d: 7, t: 'Was under a court order at the time', who: 'p', excl: ['first', 'time'] },
  { id: 'long', d: 5, t: 'It went on for a long time', who: 'p', only: ['employer', 'scam', 'benefit', 'tax', 'harass', 'fakes', 'handling', 'neglect', 'supply', 'forge', 'fare', 'slavery', 'unsafe', 'evict'] },
  { id: 'greed', d: 5, t: 'Done out of greed, not need', who: 'p', money: true, not: ['food', 'bins', 'carefraud', 'protest'] },
  { id: 'public', d: 5, t: 'The victim was serving the public at work', who: 'p', only: ['assault', 'threat', 'harass', 'brawl', 'robbery', 'gbh', 'mansl', 'dog'] },
  { id: 'drunk', d: 3, t: 'Was drunk at the time', who: 'p', not: PAPER.concat(['drink', 'mercy', 'leak', 'medical', 'bins']) },
  { id: 'hate', d: 9, t: 'Driven by hatred of the victim\'s race or religion', who: 'p', only: ['assault', 'threat', 'harass', 'graffiti', 'brawl', 'gbh', 'cardamage', 'arson'] },
  { id: 'warned', d: 4, t: 'Had been warned before and carried on', who: 'p', excl: ['first'] },
];
const MIT = [
  { id: 'first', d: -5, t: 'First offence, previously of good character', who: 'd', excl: ['prev', 'prev1'] }, { id: 'plea', d: -6, t: 'Pleaded guilty at the first chance', who: 'd' },
  { id: 'remorse', d: -4, t: 'Genuine remorse; wrote to the victim', who: 'd', excl: ['noremorse'] }, { id: 'young', d: -6, t: 'Only 18 at the time', who: 'd' },
  { id: 'carer', d: -6, t: 'Sole carer for young children', who: 'd' }, { id: 'mental', d: -6, t: 'A serious mental illness at the time', who: 'd' },
  { id: 'repaid', d: -6, t: 'Has already paid back what was taken', who: 'd', money: true }, { id: 'provoked', d: -6, t: 'Was provoked', who: 'd', only: ['assault', 'brawl', 'mansl', 'gbh', 'vigil'] },
  { id: 'duress', d: -10, t: 'Was threatened into it by others', who: 'd', only: ['traffick', 'fakes', 'shed', 'benefit', 'armed', 'scam'] },
  { id: 'addict', d: -3, t: 'Did it to feed an addiction, and wants treatment', who: 'd', treat: true, not: ['leak', 'protest', 'mercy', 'hack', 'bins', 'medical', 'defence', 'abused', 'assist', 'safety', 'gross'] },
  { id: 'minor', d: -6, t: 'Played only a small part', who: 'd', excl: ['lead', 'group'] }, { id: 'coop', d: -5, t: 'Helped the police and named the others', who: 'd' },
  { id: 'old', d: -4, t: 'Aged over 70 and in poor health', who: 'd', excl: ['young'] }, { id: 'job', d: -3, t: 'Would lose a job and a home if jailed', who: 'd' },
  { id: 'time', d: -4, t: 'It happened long ago; no trouble since', who: 'd', excl: ['bail', 'order', 'prev'] }, { id: 'help', d: -5, t: 'Has already sought help and stuck to it', who: 'd' },
  { id: 'spur', d: -4, t: 'A moment of madness, not planned', who: 'd', excl: ['plan', 'long'] }, { id: 'grief', d: -5, t: 'Was grieving a death in the family', who: 'd' },
  { id: 'service', d: -3, t: 'Many years of service to the community', who: 'd', excl: ['prev'] },
  { id: 'askmercy', d: -5, t: 'The victim has asked the court to be lenient', who: 'd', not: NOVICTIM.concat(['benefit', 'hack', 'leak', 'fakes', 'drink', 'traffick', 'flytip', 'murder', 'mansl', 'deathdrive', 'gross']) },
  { id: 'debt', d: -4, t: 'Was deep in debt to a loan shark', who: 'd', money: true, excl: ['greed'] },
  { id: 'led', d: -4, t: 'Easily led; has a learning difficulty', who: 'd', excl: ['lead', 'plan'] },
  { id: 'owned', d: -4, t: 'Stopped of their own accord and owned up', who: 'd', excl: ['hide', 'blame', 'noremorse'] },
];
const FIRST = ['Daniel', 'Aisha', 'Tom', 'Chloe', 'Kwame', 'Priya', 'Liam', 'Grace', 'Omar', 'Sophie', 'Jamal', 'Megan', 'Ravi', 'Ellie', 'Marcus', 'Zainab', 'Connor', 'Hannah', 'Tunde', 'Ruby', 'Victor', 'Leah', 'Samuel', 'Fatima', 'Jack', 'Ngozi', 'Ben', 'Isla', 'Kofi', 'Amelia', 'Declan', 'Yasmin', 'Harry', 'Chidi', 'Niamh', 'Bogdan', 'Rosie', 'Tariq', 'Elsie', 'Dwayne', 'Ioana', 'Callum', 'Sade', 'George', 'Mei', 'Patrick', 'Anjali', 'Stefan', 'Bronwen', 'Ibrahim', 'Maisie', 'Luca', 'Folake', 'Ewan', 'Shreya', 'Darren', 'Kezia', 'Mohammed', 'Tilly', 'Emeka', 'Agnes', 'Rhys', 'Leila', 'Winston', 'Dorothy', 'Arjun', 'Shona', 'Piotr'];
const LAST = ['Okafor', 'Smith', 'Patel', 'Walsh', 'Mensah', 'Clarke', 'Hussain', 'Reid', 'Adeyemi', 'Hughes', 'Kowalski', 'Bennett', 'Ali', 'Morgan', 'Nwosu', 'Fraser', 'Begum', 'Doyle', 'Osei', 'Price', 'Evans', 'Baptiste', 'Shaw', 'Iqbal', 'Turner', 'Abara', 'Campbell', 'Dhillon', 'Edwards', 'Ferreira', 'Grant', 'Hall', 'Ibekwe', 'Jones', 'Kaur', 'Lewis', 'Murray', 'Novak', 'Obi', 'Popescu', 'Quinn', 'Rahman', 'Sesay', 'Taylor', 'Uddin', 'Varga', 'Williams', 'Yeboah', 'Zielinski', 'Ahmed', 'Brown', 'Chowdhury', 'Davies', 'Eze', 'Flynn', 'Green', 'Hamid', 'Jackson', 'Khan', 'Lloyd'];
const JOBS = ['a delivery driver', 'a nurse', 'unemployed', 'a student', 'a builder', 'a shop assistant', 'a retired teacher', 'a taxi driver', 'a care worker', 'an accountant', 'a chef', 'a warehouse worker', 'a security guard', 'a hairdresser', 'a mechanic', 'a bus driver', 'a plumber', 'a teaching assistant', 'a farm worker', 'a call-centre worker', 'a cleaner', 'a postman', 'a barber', 'a bank clerk', 'a lorry driver', 'a gardener', 'a waiter', 'a bricklayer', 'a dental nurse', 'a fishmonger', 'a painter and decorator', 'a night porter', 'an estate agent', 'a soldier on leave', 'a retired miner', 'a paramedic', 'a librarian', 'a scaffolder', 'a market trader', 'a software tester', 'a baker', 'a lifeguard', 'a church organist', 'a football coach', 'a window cleaner', 'between jobs', 'a full-time parent', 'a pub landlord', 'an electrician', 'a lab technician'];
const SHOPS = ['a supermarket', 'a chemist', 'a corner shop', 'a department store', 'a petrol station', 'an electronics shop', 'a jeweller', 'a post office', 'a garden centre', 'a bakery', 'a bookshop', 'a phone shop', 'a hardware shop', 'a toy shop', 'a sports shop', 'a pet shop', 'a charity shop', 'a furniture store', 'an off-licence', 'a shoe shop', 'a newsagent', 'a butcher', 'a bicycle shop', 'a camera shop'];
const PLACES2 = ['the town hall', 'a railway station', 'the market square', 'a bus shelter', 'the high street', 'a car park', 'the leisure centre', 'a church hall', 'the bank', 'a nightclub', 'the bus station', 'a shopping centre', 'the library', 'a primary school', 'the park gates', 'the hospital car park', 'the football ground', 'the village green', 'the canal towpath', 'a retail park', 'the war memorial', 'a taxi rank', 'the cinema', 'the swimming baths', 'a community centre', 'the allotments', 'the seafront arcade', 'the old mill', 'a motorway services', 'a housing estate', 'the ring road', 'the harbour'];
const ITEMS = ['razor blades', 'a coat', 'perfume', 'baby formula', 'headphones', 'steak and wine', 'a games console', 'make-up', 'a bottle of whisky', 'nappies', 'a leather jacket', 'trainers', 'a power drill', 'cheese and coffee', 'a tablet computer', 'children\'s clothes', 'vitamins', 'a watch', 'batteries', 'a duvet', 'school shoes', 'sunglasses', 'meat for the freezer', 'a kettle', 'a child\'s winter coat', 'razors and toothpaste'];
// ---------- reading a sentence written in plain words (the court's own reader; Claude reads it when the page can ask) ----------
const NUMW = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100, thousand: 1000, half: 0.5, dozen: 12, decade: 10, couple: 2 };
function parseSentence(text) {
  const S = { valid: false, text: String(text || '').slice(0, 400) }; let t = S.text.toLowerCase().replace(/(\d),(\d{3})/g, '$1$2').replace(/£\s*/g, '£').replace(/\$\s*/g, '£');
  if (!t.trim()) return S;
  t = t.replace(/(\d+(?:\.\d+)?)\s*k\b/g, (m, n) => String(Math.round(+n * 1000)));
  t = t.replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+and\s+a\s+half\s+(year|month)/g, (m, n, u) => `${(isNaN(+n) ? NUMW[n] : +n) + 0.5} ${u}`);
  t = t.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/g, (m, a, b) => String(NUMW[a] + NUMW[b]));
  t = t.replace(/\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|fifty)\s+(hundred|thousand)\b/g, (m, a, b) => String(NUMW[a] * NUMW[b]));
  t = t.replace(/\b(a|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|half|couple|dozen)\b(?=\s+(?:of\s+)?(?:a\s+)?(?:year|month|week|day|hour|decade|pound|quid|grand))/g, m => String(NUMW[m]));
  t = t.replace(/\bdecade(s)?\b/g, '10 years').replace(/(\d+(?:\.\d+)?)\s+grand\b/g, (m, n) => '£' + Math.round(+n * 1000)).replace(/(\d+(?:\.\d+)?)\s*(pounds|quid|dollars|naira)\b/g, '£$1');
  if (/\b(death penalty|execut|hang(ed)? |lashes|flog|whip|tortur|cut off|amputat|castrat|exile|banish|stone(d)? to|firing squad|electric chair)/.test(t)) { S.valid = true; S.cruel = true; return S; }
  if (/\b(not guilty|acquit|let (him|her|them) go free|case dismissed|no punishment|walk free)\b/.test(t)) { S.valid = true; S.acquit = true; return S; }
  const parts = t.split(/[,;]|\.(?!\d)|\band\b|\bplus\b|\balso\b|\bthen\b|\bwith\b(?!\s+(?:a\s+)?min)/).map(s => s.trim()).filter(Boolean);
  const dur = s => { let m = /(\d+(?:\.\d+)?)\s*(years?|yrs?|y\b|months?|mos?|m\b|weeks?|wks?|days?)/.exec(s); if (!m) return null; const n = +m[1], u = m[2][0]; return u === 'y' ? n * 12 : u === 'm' ? n : u === 'w' ? n / 4.33 : n / 30; };
  const money = s => { let m = /£(\d+(?:\.\d+)?)/.exec(s) || /(\d+(?:\.\d+)?)\s*(?:fine|compensation)/.exec(s); return m ? +m[1] : null; };
  const hours = s => { const m = /(\d+)\s*(?:hours?|hrs?|h\b)/.exec(s); return m ? +m[1] : null; };
  let lastCust = false;
  for (const p of parts) {
    if (/\blife\b|whole life|rest of (his|her|their) li/.test(p)) { S.life = true; S.valid = true; const d = dur(p); if (d && d >= 60) S.minYears = Math.round(d / 12); if (/whole life|rest of/.test(p)) S.minYears = 40; lastCust = true; continue; }
    if (/minimum|at least|serve/.test(p) && S.life) { const d = dur(p); if (d) S.minYears = Math.round(d / 12); continue; }
    if (/suspend/.test(p)) { const d = dur(p); const ds = [...p.matchAll(/(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?|weeks?)/g)].map(m => +m[1] * (m[2][0] === 'y' ? 12 : m[2][0] === 'w' ? 1 / 4.33 : 1)); if (S.custody && !S.suspended) { S.suspended = true; S.suspendFor = ds[0] || 24; } else if (ds.length) { S.custody = S.custody || ds[0]; S.suspended = true; if (ds[1]) S.suspendFor = ds[1]; } else S.suspended = !!S.custody; S.valid = S.valid || !!S.custody; continue; }
    if (/communit|unpaid work|service/.test(p) || (hours(p) && !/curfew/.test(p))) { const h = hours(p); if (h) { S.hours = Math.min(600, h); S.valid = true; } else if (/communit/.test(p)) { S.hours = 120; S.valid = true; } continue; }
    if (/compensat|restitution|repay|pay back|pay the victim|to the victim|damages/.test(p)) { const v = money(p); if (v) { S.comp = v; S.valid = true; } else { S.comp = -1; S.valid = true; } continue; }
    if (/fine|fined/.test(p)) { const v = money(p); if (v) { S.fine = v; S.valid = true; } continue; }
    if (/\bban|disqualif|off the road|licen[cs]e/.test(p)) { const d = dur(p); S.ban = d || 12; S.valid = true; continue; }
    if (/curfew|tag\b|tagged/.test(p)) { const d = dur(p); S.curfew = d || 3; S.valid = true; continue; }
    if (/probation|supervis|community order/.test(p)) { const d = dur(p); S.probation = d || 12; S.valid = true; continue; }
    if (/rehab|treatment|counsel|course|therapy|programme|program/.test(p)) { S.treatment = true; S.valid = true; continue; }
    if (/absolute discharge/.test(p)) { S.discharge = 'absolute'; S.valid = true; continue; }
    if (/discharge|warning|caution/.test(p)) { S.discharge = 'conditional'; S.valid = true; continue; }
    const d = dur(p); if (d && (/prison|jail|custody|imprison|inside|behind bars|detention|locked up|gaol|sentence|\bjail/.test(p) || !/£/.test(p))) { S.custody = (S.custody || 0) + d; S.valid = true; lastCust = true; continue; }
    const v = money(p); if (v) { S.fine = v; S.valid = true; }
  }
  if (S.custody && !S.suspended && /suspend/.test(t)) S.suspended = true;
  if (S.custody > 24 && S.suspended) S.suspendTooLong = true;
  return S;
}
// the clerk reads it back in court language
function readBack(S) { if (!S || !S.valid) return 'The clerk cannot find a sentence in that.'; if (S.cruel) return 'That is not a sentence this court can pass.'; if (S.acquit) return 'No punishment at all.';
  const fm = m => m >= 12 && m % 12 === 0 ? `${m / 12} year${m === 12 ? '' : 's'}` : `${Math.round(m)} month${Math.round(m) === 1 ? '' : 's'}`, out = [];
  if (S.life) out.push(`life imprisonment${S.minYears ? `, minimum term ${S.minYears} years` : ''}`); else if (S.custody) out.push(`${fm(S.custody)} in prison${S.suspended ? `, suspended${S.suspendFor ? ' for ' + fm(S.suspendFor) : ''}` : ''}`);
  if (S.hours) out.push(`${S.hours} hours of unpaid work`); if (S.fine) out.push(`a £${S.fine.toLocaleString()} fine`); if (S.comp) out.push(S.comp > 0 ? `£${S.comp.toLocaleString()} compensation` : 'compensation (no sum given)');
  if (S.probation) out.push(`${fm(S.probation)} on probation`); if (S.curfew) out.push(`a ${fm(S.curfew)} curfew`); if (S.ban) out.push(`banned from driving for ${fm(S.ban)}`); if (S.treatment) out.push('a treatment order');
  if (S.discharge) out.push(S.discharge === 'absolute' ? 'an absolute discharge' : 'a conditional discharge'); const s = out.join('; '); return s.charAt(0).toUpperCase() + s.slice(1) + '.'; }
// ---------- the council: three judges, each with a leaning ----------
const COUNCIL = [{ name: 'Lady Justice Hale', tag: 'the scholar', lean: 0 }, { name: 'Judge Stern', tag: 'the hawk', lean: 6 }, { name: 'Judge Mercer', tag: 'the dove', lean: -6 }];
const RANKS = [[0, 'Magistrate'], [40, 'District judge'], [130, 'Recorder'], [320, 'Circuit judge'], [700, 'High Court judge'], [1500, 'Lord Chief Justice']];
const UPGRADES = [
  { id: 'clerk', name: 'Senior clerk', desc: 'The case file shows the usual range for a first offender.', max: 1, cost: l => 40 },
  { id: 'book', name: 'Sentencing guidelines', desc: 'The case file names each factor\'s weight (small, real, big).', max: 1, cost: l => 50 },
  { id: 'robe', name: 'A finer robe', desc: 'Purely for the look of it.', max: 3, cost: l => 20 + l * 20 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const optAdult = () => (typeof HEADLESS !== 'undefined' && HEADLESS) ? false : !!store.get('adult', false);
const optFree = () => (typeof HEADLESS !== 'undefined' && HEADLESS) ? false : store.get('council', true) === false;
const PLACES = [{ name: 'The Magistrates\' Court' }, { name: 'The County Court' }, { name: 'The Crown Court' }, { name: 'The Old Bailey' }];
const placeOf = N => Math.min(3, Math.floor((N - 1) / 6));
function makeCfg(N, help) { help = help || N === 1;      /* 26 Nov 2026, his words: "the first level should be the only one that is given": level 1 always has the help a loss gives */ const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, help: !!help, place: placeOf(N), cases: 5, pass: Math.round(x(69, 87, 30) - (help ? 6 : 0)), factors: [Math.round(x(1, 3, 25)), Math.round(x(2, 5, 25))], complex: x(0.1, 0.35, 30), repeat: x(0, 0.45, 30), adult: optAdult(), free: optFree() }; }
// ---------- a case ----------
function makeCase(G, forceOff, opts = {}) { const R = G.rnd, c = G.cfg;
  let pool = OFF.filter(o => (!o.adult || c.adult) && (!o.complex || R() < c.complex * 2.2)); if (c.adult && R() < 0.45) pool = pool.filter(o => o.adult).length ? pool.filter(o => o.adult) : pool;
  let off = forceOff ? OFF.find(o => o.id === forceOff) : null; if (!off && G.record.length && R() < c.repeat) { const prev = G.record[(R() * G.record.length) | 0]; off = OFF.find(o => o.id === prev.off); }
  if (!off) off = dealIf('off', OFF, o => pool.includes(o), R);
  const nf = opts.nf != null ? opts.nf : c.factors[0] + ((R() * (c.factors[1] - c.factors[0] + 1)) | 0), facts = [];
  const okF = f => (!f.only || f.only.includes(off.id)) && (!f.not || !f.not.includes(off.id)) && (!f.money || off.money) && !facts.some(q => q.id === f.id || (f.excl || []).includes(q.id) || (q.excl || []).includes(f.id)) && !(f.id === 'prev1' && facts.some(q => q.id === 'prev')) && !(f.id === 'prev' && facts.some(q => q.id === 'prev1'));
  const want = opts.factors || []; for (const id of want) { const f = AGG.concat(MIT).find(q => q.id === id); if (f) facts.push(f); }
  for (let n = 0; facts.length < nf && n < 40; n++) { const list = R() < 0.5 ? AGG : MIT, f = list[(R() * list.length) | 0]; if (okF(f)) facts.push(f); }
  const loss = off.money ? Math.round((off.money[0] + R() * (off.money[1] - off.money[0])) / (off.money[1] > 5000 ? 100 : 10)) * (off.money[1] > 5000 ? 100 : 10) : 0;
  const first = pick(R, FIRST), last = pick(R, LAST), age = facts.some(f => f.id === 'young') ? 18 : facts.some(f => f.id === 'old') ? 71 + ((R() * 14) | 0) : 20 + ((R() * 50) | 0);
  const what = off.what[deal('what.' + off.id, off.what.length, R)].replace('{item}', pick(R, ITEMS)).replace('{shop}', pick(R, SHOPS)).replace('{place}', pick(R, PLACES2)).replace('{loss}', loss.toLocaleString());
  const plea = facts.some(f => f.id === 'plea') ? 'Pleaded guilty' : (R() < 0.5 ? 'Found guilty by a jury' : 'Pleaded guilty on the day of trial');
  const centre = Math.max(1, off.c + facts.reduce((a, f) => a + f.d, 0)), K = { id: G.nid++, off: off.id, name: off.name, who: `${first} ${last}`, first, last, age, job: pick(R, JOBS), what, plea, facts, loss, centre, w: off.w, max: off.max, mand: !!off.mand, money: !!off.money && !facts.some(f => f.id === 'repaid'), drive: !!off.drive, treat: facts.some(f => f.treat), complex: !!off.complex, adult: !!off.adult };
  K.victim = victimLine(G, K); return K; }
function victimLine(G, K) { const R = G.rnd; if (['benefit', 'hack', 'leak', 'fakes', 'drink', 'traffick', 'flytip'].concat(NOVICTIM).includes(K.off)) return null;
  const L = { murder: 'The family say their lives have stopped.', mansl: 'His mother says she will never stop looking at the door.', mercy: 'Their daughter asks the court for mercy for her father.', deathdrive: 'The family say a careless moment took everything.', vigil: 'The victim says he lives in fear now.', food: 'The shop manager says they did not want to press charges.', protest: 'The building owner says the protest cost jobs.', attempt: 'The victim says every knock at the door still stops her heart.', gross: 'The family ask how many warnings it takes.', slavery: 'One of the workers says he had forgotten what a day off was.', abused: 'His sister says nobody deserved to die. Her children say they are not afraid any more.', defence: 'The injured man says he was the one who ended up in hospital.', carefraud: 'The employer says he would have lent the money if asked.', safety: 'The injured worker says he only wanted to do the job properly.', dog: 'The victim says she crosses the road now when she sees a dog.', evict: 'The tenant says she slept in her car for a month.' };
  return L[K.off] || pick(R, ['The victim says they no longer feel safe.', 'The victim says it was a shock, but they are moving on.', 'The victim asks for the money back above all.', 'The victim says they were frightened for weeks.', 'The victim says it is the cheek of it that hurts most.', 'The victim says they have moved house since.', 'The victim says sorry would have been enough, once.', 'The victim says they still check the locks three times a night.', 'The victim says they do not want anyone sent to prison.', 'The victim says nobody thinks of what it costs the people left to clear up.', 'The victim says their children have stopped playing outside.', 'The victim says they have forgiven, but will not forget.']); }
// the usual range for a first offender, in words (shown with the Senior clerk)
function rangeWords(p0, p1) { const w = p => p < 7 ? 'a discharge' : p < 15 ? 'a small fine' : p < 30 ? 'a fine or community work' : p < 40 ? 'a suspended sentence' : p < 108 ? `${fmtM(ptsToMonths(p))} in prison` : 'life'; const a = w(p0), b = w(p1); return a === b ? a : `${a} to ${b}`; }
const fmtM = m => m >= 24 ? `${Math.round(m / 12)} years` : m >= 12 ? `${(m / 12).toFixed(m % 12 ? 1 : 0)} year${m === 12 ? '' : 's'}` : `${m} months`;
// ---------- the game ----------
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, nid: 1, record: (o.record || []).slice(-30), done: [], case: null, wait: 0, gallery: null, reveal: null };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else { G.case = makeCase(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'case' }); }
  return G; }
function step(G, dt) { if (G.over) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.lessonEnd) { G.lessonEnd = false; G.done = []; G.case = makeCase(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'case' }); } else if (G.next) { const f = G.next; G.next = null; f(); } } } }
// how each councillor marks one sentence (0-100) and why
function mark(K, S, lean = 0, rec = []) { const why = []; let s;
  if (!S || !S.valid) return { s: 0, why: ['No sentence could be found in what was written.'], dir: 0 };
  if (S.cruel) return { s: 0, why: ['That punishment is unlawful and cruel. No court may pass it.'], dir: 1, unlawful: true };
  const P = severity(S), w = K.w * 0.85, lo = K.centre + lean - w, hi = K.centre + lean + w, c = K.centre + lean; let dir = 0;
  if (P >= lo && P <= hi) s = 100 - 22 * Math.abs(P - c) / w; else { const d = P < lo ? lo - P : P - hi; s = 75 - 6 * d; dir = P < lo ? -1 : 1; why.push(P < lo ? (d > 15 ? 'Far too lenient for what was done.' : 'Too lenient.') : (d > 15 ? 'Far too harsh for what was done.' : 'Too harsh.')); }
  if (K.mand && !S.life) { s = Math.min(s, 10); why.push('Murder carries a mandatory life sentence: the court must pass life, with a minimum term.'); dir = -1; }
  const months = S.life ? Infinity : (S.custody || 0); if (months > K.max) { s = Math.min(s, 15); why.push(K.max === 0 ? 'This offence cannot be punished with prison at all.' : `Unlawful: above the maximum of ${fmtM(K.max)}.`); dir = 1; }
  if (S.suspended && S.custody > 24) { s -= 10; why.push('Only sentences of two years or less can be suspended.'); }
  if (S.acquit) { s = Math.min(s, 20); why.push('They have been found guilty: the court must pass some sentence.'); }
  if (K.money && K.loss) { if (S.comp) { s += 5; if (S.comp > 0 && (S.comp < K.loss * 0.3)) { s -= 8; why.push('Compensation well below the loss.'); } } else { s -= 12; why.push(`Nothing for the victim's £${K.loss.toLocaleString()} loss: order compensation.`); } }
  if (K.drive) { if (S.ban) s += 4; else { s -= 12; why.push('A driving offence: a ban from driving was expected.'); } }
  else if (S.ban) { s -= 12; why.push('A driving ban has nothing to do with this offence.'); }
  if (S.comp && !(K.loss > 0)) { s -= 8; why.push('Compensation, when nobody lost any money?'); } else if (S.comp > 0 && K.loss && S.comp > K.loss * 2) { s -= 8; why.push(`Compensation far above the £${K.loss.toLocaleString()} actually lost.`); }
  if (K.treat) { if (S.treatment) s += 5; else why.push('Treatment for the addiction would have helped.'); }
  const same = rec.filter(r => r.off === K.off && r.id !== K.id); if (same.length) { const r = same[same.length - 1], gap = (P - K.centre) - (r.P - r.centre); if (Math.abs(gap) > 20) { s -= 8; why.push(`Out of step with your own sentence in R v ${r.last} (${gap > 0 ? 'much harsher' : 'much softer'} for a like case).`); } }
  if (!why.length) why.push(pick(Math.random, ['A fair and measured sentence.', 'Well judged.', 'Exactly in proportion.', 'Sound.']));
  return { s: clamp(Math.round(s), 0, 100), why, dir, P }; }
// what you can do: pass a sentence (already read: S). The gallery reacts at once; the council marks the docket of five.
function sentence(G, S, text) { if (G.over || G.wait > 0 || !G.case) return false; const K = G.case;
  const ms = COUNCIL.map(cn => mark(K, S, cn.lean, G.record)), avg = Math.round(ms.reduce((a, m) => a + m.s, 0) / ms.length), P = severity(S);
  const entry = { id: K.id, off: K.off, name: K.name, last: K.last, who: K.who, centre: K.centre, P, text: String(text || '').slice(0, 200), read: readBack(S), score: avg, marks: ms, valid: !!(S && S.valid) };
  G.done.push(entry); if (S && S.valid && !S.cruel) G.record.push({ id: K.id, off: K.off, centre: K.centre, P, last: K.last });
  // (25 Nov 2026, his review: "When you off council they should be no boo's or nods": with the council switched off nobody is judging the
  // sentence, so the gallery keeps quiet too. Only a sentence that could not be understood still gets its puzzled murmur.)
  const dir = ms[0].dir, gal = !S || !S.valid ? 'puzzled' : G.cfg.free ? 'quiet' : S.cruel ? 'horror' : avg >= 70 ? 'nod' : dir > 0 ? 'gasp' : 'boo'; G.gallery = { kind: gal, t: 0 };
  G.ev.push({ k: 'gavel', gal, score: avg });
  if (G.lesson) { lessonSee(G, entry); return true; }
  G.wait = 1.6; G.next = () => { if (!G.cfg.free && G.done.length >= G.cfg.cases) return judgeDocket(G); G.case = makeCase(G); G.ev.push({ k: 'case' }); };
  return true; }
function judgeDocket(G) { const c = G.cfg, avg = Math.round(G.done.reduce((a, e) => a + e.score, 0) / G.done.length), win = avg >= c.pass;
  G.over = win ? 'won' : 'lost'; const stars = win ? (avg >= c.pass + 12 ? 3 : avg >= c.pass + 6 ? 2 : 1) : 0;
  G.res = { win, stars, avg, pass: c.pass, done: G.done, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1, record: G.record.slice(-30) };
  G.ev.push({ k: 'council', avg }); G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'write', title: 'PASS SENTENCE', say: G => judgeCue(G)[0], do: G => judgeCue(G)[1], at: G => judgeCue(G)[2], how: 'Read the case, then tap the buttons to build a sentence (try + Fine, then − or + to change it), or write your own. Tap PASS SENTENCE. Three fair sentences in a row.', need: 3, off: 'shoplift', nf: 0 }],
  2: [{ id: 'weigh', title: 'WEIGH IT UP', say: G => judgeCue(G)[0], do: G => judgeCue(G)[1], at: G => judgeCue(G)[2], how: '⚠ things make it worse and ✓ things help them. The same crime, different people: weigh each one. Three fair sentences in a row.', need: 3, off: 'bike', nf: 2 }],
  3: [{ id: 'right', title: 'PUT IT RIGHT', say: G => judgeCue(G)[0], do: G => judgeCue(G)[1], at: G => judgeCue(G)[2], how: 'A victim lost money: add + Compensation as well as the punishment. Three in a row.', need: 3, off: 'pickpocket', nf: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonCase(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonCase(G) { const st = lessonNow(G); G.case = makeCase(G, st.off, { nf: st.nf }); G.ev.push({ k: 'case' }); }
function lessonSee(G, e) { const st = lessonNow(G), ok = e.valid && e.score >= 70 && (st.id !== 'right' || /compensat|restitution|repay|pay back|victim/i.test(e.read));
  if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: e.marks[0].why[0] || st.how }); G.wait = 3.5; G.next = () => lessonCase(G); return; }
  G.lesson.n++; if (G.lesson.n < st.need) { G.ev.push({ k: 'lessonok', n: G.lesson.n, need: st.need }); G.wait = 1.6; G.next = () => lessonCase(G); return; }
  G.lesson.i++; G.lesson.n = 0; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.lessonEnd = true; G.wait = 1.6; } else { G.wait = 1.6; G.next = () => lessonCase(G); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not read the case: writes a sentence of some kind, of some size, with or without the trimmings
function blindText(R) { const n = () => 1 + ((R() * (R() < 0.5 ? 12 : 60)) | 0), parts = [], k2 = (R() * 6) | 0;
  parts.push([`${n()} years in prison`, `${n()} months in prison`, `${n()} months suspended`, `${n() * 10} hours community service`, `a £${n() * 50} fine`, 'a conditional discharge', `life with a minimum of ${n()} years`][k2 % 7]);
  if (R() < 0.4) parts.push(`£${n() * 100} compensation`); if (R() < 0.3) parts.push(`banned from driving for ${n()} months`); if (R() < 0.2) parts.push('drug treatment'); return parts.join(' and '); }
const BLIND = { w: G => { const t = blindText(Math.random); sentence(G, parseSentence(t), t); }, x: G => { sentence(G, parseSentence('guilty'), 'guilty'); } };
// a judge who reads the case: weighs it (by eye, so roughly: acc), writes a sentence of the right kind with the trimmings
function honestText(G, o) { const K = G.case, acc = o.acc == null ? 0.9 : o.acc, sd = 3 + (1 - acc) * 18, g = () => { let s = 0; for (let i = 0; i < 6; i++) s += Math.random(); return (s - 3) / 0.707; };
  let p = K.centre + g() * sd; const parts = [];
  if (K.mand) parts.push(`life imprisonment with a minimum term of ${Math.max(10, Math.round((p - 110) / 0.6))} years`);
  else if (p >= 108 && K.max === Infinity) parts.push(`life with a minimum of ${Math.max(5, Math.round((p - 110) / 0.6))} years`);
  else if (p >= 40.5) { let m = ptsToMonths(p); if (K.max) m = Math.min(m, K.max); parts.push(m >= 24 && m % 12 < 2 ? `${Math.round(m / 12)} years in prison` : `${m} months in prison`); }
  else if (p >= 30) { const m = clamp(Math.round((p - 30) / 10 * 24), 1, 24); parts.push(`${Math.max(1, Math.min(K.max || 24, m))} months in prison suspended for two years`); }
  else if (p >= 16) { const h = clamp(Math.round((p - 15) / 15 * 300 / 10) * 10, 40, 300); parts.push(`${h} hours of community service`); }
  else if (p >= 7) { parts.push(`a £${Math.max(50, Math.round((Math.pow(2, (p - 6) / 6) - 1) * 100 / 10) * 10)} fine`); }
  else parts.push('a conditional discharge');
  if (K.money && K.loss && Math.random() < acc + 0.2) parts.push(`£${K.loss} compensation`); if (K.drive && Math.random() < acc + 0.2) parts.push('banned from driving for 2 years'); if (K.treat && Math.random() < acc) parts.push('a drug treatment programme');
  return parts.join(' and '); }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react; if (G.over || G.wait > 0 || !G.case) { mem.t0 = null; return; }
  if (mem.t0 == null) { mem.t0 = G.t + 1 + react * 4; return; } if (G.t < mem.t0) return; mem.t0 = null; const t = honestText(G, o); sentence(G, parseSentence(t), t); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.done = Array.from({ length: G.cfg.cases }, (_, i) => ({ id: i, off: 'shoplift', name: 'x', last: 'x', who: 'x', centre: 10, P: 10, text: '', read: '', score: 100, marks: [], valid: true })); judgeDocket(G); }
