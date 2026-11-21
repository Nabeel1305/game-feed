// ===================== RULES: Detective =====================
// Every case is made, then hidden: first the truth (who did it, how, when, and where everyone really was), then the clues
// that follow from it, placed on the objects in the rooms, some in plain sight, some only seen by turning an object over.
// Suspects tell you where they were; one of them lies to hide the crime, and another may lie to hide something else (a
// secret that has nothing to do with it). Show a clue to someone to challenge their story. Accuse when you can say who,
// how, when, and pick the two clues that prove it. Two wrong accusations and the case goes cold.

const RULES = [
  '<b>Search:</b> tap an object in the room to look at it close. <b>Drag</b> to turn it over: some clues are only on the back or underneath; tap what you notice.',
  '<b>Question:</b> in People, ask where they were. <b>Show a clue</b> to challenge a story: a liar cracks, someone with a secret owns up.',
  '<b>Notebook:</b> every clue and statement is kept. Link a clue to a person and say what it shows; a link the evidence supports becomes a fact ✓.',
  '<b>Accuse:</b> who, how, when, and the two clues that prove it (one that puts them at the scene, one that shows how). Two wrong accusations and the case goes cold.',
  '<b>Hints</b> (💡) help a step at a time: first a question to answer, then where to look, then the clue itself.',
];
const SKINS = [{ id: 'trench', name: 'Trench coat', col: 0xb89a6a, stars: 0 }, { id: 'tweed', name: 'Tweed', col: 0x6a5a3a, stars: 6 }, { id: 'navy', name: 'Navy', col: 0x2a3a5a, stars: 14 },
  { id: 'red', name: 'Scarlet', col: 0x9a2a2a, stars: 24 }, { id: 'white', name: 'Ivory', col: 0xe8e2d2, stars: 36 }, { id: 'gold', name: 'Gold badge', col: 0xd8a830, stars: 50 }];
const UPGRADES = [{ id: 'lens', name: 'Better lens', max: 2, cost: l => [60, 140][l], desc: 'Hidden marks show a faint glint when the object faces the right way.' }, { id: 'pad', name: 'Thicker notebook', max: 1, cost: () => 90, desc: 'One free hint every case.' },
  { id: 'nerve', name: 'Steady nerve', max: 1, cost: () => 150, desc: 'A third accusation before the case goes cold.' }];
const upLv = id => { if (typeof HEADLESS !== 'undefined' && HEADLESS) return 0; return ((store.get('ups', {}) || {})[id]) | 0; };
const RANKS = [[0, 'Constable'], [60, 'Sergeant'], [200, 'Inspector'], [500, 'Chief Inspector'], [1100, 'Superintendent'], [2500, 'Legend of the Yard']];
const PLACES = [
  { id: 'home', name: 'Ashcombe House', sky: 'golden', rooms: ['Study', 'Drawing room', 'Kitchen', 'Hall', 'Conservatory', 'Library'], roles: ['the butler', 'the niece', 'the gardener', 'the cook', 'a house guest', 'the lawyer'] },
  { id: 'hotel', name: 'The Grand Meridian', sky: 'dusk', rooms: ['Suite 12', 'Lobby', 'Bar', 'Cloakroom', 'Ballroom', 'Kitchen'], roles: ['the night porter', 'a guest', 'the pianist', 'the manager', 'a chambermaid', 'the chef'] },
  { id: 'museum', name: 'The Halden Museum', sky: 'noon', rooms: ['East gallery', 'Curator\'s office', 'Storeroom', 'Café', 'Cloakroom', 'Workshop'], roles: ['the curator', 'a guard', 'a restorer', 'a visiting collector', 'the cleaner', 'the director'] },
  { id: 'train', name: 'The Night Express', sky: 'night', rooms: ['Dining car', 'Sleeper 3', 'Luggage van', 'Lounge car', 'Sleeper 7', 'Galley'], roles: ['the conductor', 'a passenger', 'the waiter', 'a salesman', 'the cook', 'a student'] },
  { id: 'office', name: 'Brightwell & Co.', sky: 'overcast', rooms: ['Boss\'s office', 'Open office', 'Archive', 'Staff kitchen', 'Lobby', 'Meeting room'], roles: ['the secretary', 'the accountant', 'an intern', 'the director', 'a cleaner', 'the courier'] },
];
const placeOf = N => (N - 1) % 5 === 0 && N > 1 ? (N - 1) / 5 % 5 : N <= 3 ? 0 : (N + 1) % 5;
const NAMES = ['Ada Finch', 'Bram Holloway', 'Cora Vane', 'Dev Malik', 'Edie Marsh', 'Felix Rook', 'Greta Lund', 'Hugo Penn', 'Iris Calder', 'Jonah Pike', 'Kit Moreau', 'Lena Sato', 'Milo Grant', 'Nora Quill', 'Otto Brandt', 'Pia Larkin', 'Quentin Hale', 'Rosa Ibarra', 'Silas Thorne', 'Tess Oduya', 'Uma Varga', 'Vic Dunmore', 'Wren Ashby', 'Yara Kell'];
const TIMES = ['7 pm', '8 pm', '9 pm', '10 pm', '11 pm'];
const PERSONAL = ['glove', 'cufflink', 'hairpin', 'fountain pen', 'button', 'ticket stub', 'scarf', 'lighter'];
// the kinds of case, each with four ways it could have been done (the trace each leaves, and the clue that ties a person to it)
const CRIMES = {
  theft: { what: ['the jade figurine', 'the silver locket', 'a rare stamp', 'the ruby brooch', 'the gold pocket watch'], verb: 'was stolen', title: 'THEFT',
    how: [{ id: 'window', name: 'Out through the window', trace: 'Fresh scratches on the window latch, and sand on the sill.', item: 'window', means: '{S}\'s shoes, with sand on the soles.', mitem: 'coatstand' },
      { id: 'swap', name: 'Swapped for a fake', trace: 'The {O} on show is a fake: the mark underneath is only printed on.', item: 'case', means: 'A receipt for a replica of {O}, in {S}\'s name.', mitem: 'desk' },
      { id: 'key', name: 'Opened with the spare key', trace: 'The case lock is unscratched: it was opened with a key.', item: 'case', means: 'The key book: {S} signed out the spare key.', mitem: 'cabinet' },
      { id: 'bag', name: 'Carried out in a bag', trace: 'An empty cloth bag, still shaped like {O}.', item: 'bin', means: '{S}\'s set of cloth bags: one is missing.', mitem: 'suitcase' }] },
  sabotage: { what: ['the music box', 'the projector', 'the old organ', 'the clock mechanism', 'the fountain pump'], verb: 'was wrecked', title: 'SABOTAGE',
    how: [{ id: 'water', name: 'Water poured inside', trace: 'A wet ring on the table and an empty jug beside it.', item: 'table', means: '{S}\'s sleeves are still damp, the cook says.', mitem: 'coatstand' },
      { id: 'wire', name: 'A wire cut', trace: 'A wire snipped clean through: pliers, not wear.', item: 'desk', means: 'Small pliers in {S}\'s pocket.', mitem: 'cabinet' },
      { id: 'coin', name: 'Jammed with a coin', trace: 'A bent coin wedged in the gears.', item: 'clock', means: '{S}\'s purse: the same foreign coins.', mitem: 'suitcase' },
      { id: 'fuse', name: 'The fuse swapped', trace: 'A burnt-out fuse dropped in the bin.', item: 'bin', means: 'A packet of fuses, opened, in {S}\'s drawer.', mitem: 'desk' }] },
  fraud: { what: ['the accounts', 'the auction ledger', 'the will', 'the cheque book', 'the share register'], verb: 'was forged', title: 'FRAUD',
    how: [{ id: 'traced', name: 'A signature traced', trace: 'Pencil lines under the ink: the signature was traced.', item: 'desk', means: 'Tracing paper with the signature on it, in {S}\'s folder.', mitem: 'shelf' },
      { id: 'pages', name: 'Pages swapped', trace: 'Two pages glued in: the stitching does not match.', item: 'shelf', means: 'Glue and a binding needle in {S}\'s bag.', mitem: 'suitcase' },
      { id: 'stamp', name: 'The office stamp used', trace: 'The office stamp is missing from its drawer.', item: 'cabinet', means: 'Fresh red stamp ink on {S}\'s cuff.', mitem: 'coatstand' },
      { id: 'burned', name: 'The real pages burned', trace: 'Ash and a half-burnt page in the grate.', item: 'bin', means: 'Matches from the grate in {S}\'s pocket.', mitem: 'cabinet' }] },
  vanish: { what: ['Duchess the cat', 'the prize parrot', 'Professor Lark', 'the guest of honour', 'little Biscuit the dog'], verb: 'has vanished', title: 'DISAPPEARANCE',
    how: [{ id: 'backdoor', name: 'Led out by the back way', trace: 'The back window is unbolted, footprints below it.', item: 'window', means: '{S}\'s boots by the door, muddy to the ankle.', mitem: 'coatstand' },
      { id: 'cupboard', name: 'Hidden in the storeroom', trace: 'Hairs and a saucer of milk behind the cupboard.', item: 'cabinet', means: 'The storeroom key on {S}\'s ring.', mitem: 'desk' },
      { id: 'basket', name: 'Taken off in a basket', trace: 'A basket lid with fresh scratches inside it.', item: 'suitcase', means: 'A receipt for a travel basket, signed by {S}.', mitem: 'shelf' },
      { id: 'note', name: 'Lured by a note', trace: 'A torn note: "Come to the garden. Now."', item: 'bin', means: 'Notepaper in {S}\'s desk: the same torn edge.', mitem: 'desk' }] },
  locked: { what: ['the sapphire', 'the master key', 'the first-edition book', 'the bronze medal', 'the old map'], verb: 'went from a locked room', title: 'LOCKED ROOM',
    how: [{ id: 'vent', name: 'Through the air vent', trace: 'The vent cover behind the painting: its screws are loose.', item: 'painting', means: 'A small screwdriver in {S}\'s coat.', mitem: 'coatstand' },
      { id: 'early', name: 'Taken before it was locked', trace: 'The clock was put back an hour: the dust ring around it is broken.', item: 'clock', means: '{S} wound the clocks that evening, the rota says.', mitem: 'shelf' },
      { id: 'inside', name: 'Hidden inside all along', trace: 'A hollow under the sofa cushion, just the right size.', item: 'sofa', means: '{S} chose that sofa for the room, the receipt says.', mitem: 'desk' },
      { id: 'line', name: 'Pulled under the door on a line', trace: 'A fishing line, cut, caught under the door frame.', item: 'window', means: 'A reel of fishing line in {S}\'s luggage.', mitem: 'suitcase' }] },
};
const KINDS = ['theft', 'theft', 'theft', 'sabotage', 'fraud', 'vanish', 'locked'];
const FURN = ['desk', 'shelf', 'cabinet', 'sofa', 'table', 'bin', 'coatstand', 'lamp', 'plant', 'case', 'painting', 'window', 'suitcase', 'clock'];
const ITEMNAME = { desk: 'writing desk', shelf: 'bookshelf', cabinet: 'cabinet', sofa: 'sofa', table: 'side table', bin: 'waste bin', coatstand: 'coat stand', lamp: 'lamp', plant: 'potted palm', case: 'display case', painting: 'painting', window: 'window', suitcase: 'suitcase', clock: 'mantel clock' };
const FILL = { desk: 'Letters and bills, nothing out of place.', shelf: 'Dusty books, undisturbed for weeks.', cabinet: 'Glasses and napkins, all neat.', sofa: 'Just cushions. Nothing tucked in.', table: 'A vase of flowers. Nothing else.', bin: 'Only paper scraps.', coatstand: 'An umbrella, dry.', lamp: 'Warm bulb. Nothing else.', plant: 'Soil undisturbed.', case: 'Empty velvet.', painting: 'A landscape. Firmly fixed.', window: 'Locked tight.', suitcase: 'Folded clothes.', clock: 'Ticking, on time.' };
const MOTIVE = ['{S} owes money to the owner.', '{S} was left out of the will.', '{S} has wanted {O} for years, a letter says.', '{S} was sacked last week, a letter says.'];
const SECRET = [{ clue: 'A note in {S}\'s hand: "Meet me at {T}. Tell no one."', admit: 'All right: I slipped out to meet someone I love. Ask the gardener: he saw us in the garden all hour.', clears: 'The gardener\'s note: "{S} in the garden with a friend, {T} till late."' },
  { clue: '{S}\'s betting slip, dated tonight.', admit: 'I was at the card table in the back room, losing. Not proud of it. The dealer kept the list.', clears: 'The card table list: {S} played from 8 till midnight.' },
  { clue: 'A pawn ticket in {S}\'s name, dated today.', admit: 'I pawned my mother\'s ring to pay a debt. I was at the telephone in the lobby for an hour, begging the bank. The operator logs every call.', clears: 'The operator\'s log: {S} on the telephone, {T}, one hour.' },
  { clue: 'A second passport, {S}\'s photo, another name.', admit: 'It is an old name, from before I moved here. I was writing letters in my room; the maid brought tea at {T}.', clears: 'The maid\'s tea list: tea to {S}\'s room at {T}.' }];

function makeCfg(N, help, o = {}) {
  const f = curve(N), e = easyOf(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s));
  return { N, f, e, help: !!help, place: placeOf(N), sus: Math.min(6, 3 + Math.floor(f / 6)), rooms: N <= 3 ? 1 : N <= 9 ? 2 : N <= 19 ? 3 : 4, herrings: N < 3 ? 0 : N < 12 ? 1 : 2,
    hidden: x(0.25, 0.65, 15), kind: N <= 3 ? 'theft' : KINDS[N % KINDS.length], tries: 2 + upLv('nerve') + (help ? 1 : 0), freeHints: upLv('pad') + (help ? 1 : 0) };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help, o), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, mini: !!o.mini };
  makeCase(G, rng(seed + 9), cfg);
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// ---------- making a case: the truth first, then the clues ----------
function makeCase(G, R, c) { const P = PLACES[c.place], K = CRIMES[c.kind], shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const names = shuffle(NAMES.slice()), roles = shuffle(P.roles.slice()), roomNames = shuffle(P.rooms.slice());
  const crimeRoom = roomNames[0], obj = pick(R, K.what), how = (R() * 4) | 0, when = 1 + ((R() * 3) | 0);
  const S = []; for (let i = 0; i < c.sus; i++) S.push({ i, name: names[i], role: roles[i % roles.length], look: [R(), R(), R()], asked: {}, patience: 3, cleared: false });
  const culprit = (R() * S.length) | 0, herrings = []; while (herrings.length < Math.min(c.herrings, S.length - 1)) { const h = (R() * S.length) | 0; if (h !== culprit && !herrings.includes(h)) herrings.push(h); }
  // where everyone says they were (and where they really were)
  const others = roomNames.slice(1); S.forEach((s, i) => { s.claim = others[i % others.length]; s.truth = i === culprit ? crimeRoom : herrings.includes(i) ? 'the garden' : s.claim; if (herrings.includes(i)) s.secret = pick(R, SECRET); });
  // the rooms you can search, and their furniture (the crime room always; items needed by the clues always present)
  const vis = roomNames.slice(0, c.rooms), rooms = vis.map((nm, ri) => ({ name: nm, items: [] })), meth = K.how[how];
  const needs = [{ room: 0, kind: meth.item }];
  const clues = []; let cid = 0; const T = TIMES[when], O = obj, fill = (t, s) => t.replace(/\{S\}/g, s ? s.name : '').replace(/\{O\}/g, O).replace(/\{T\}/g, T).replace(/\{R\}/g, crimeRoom);
  const add = (kind, text, o2 = {}) => { const cl = Object.assign({ id: cid++, kind, text, found: false, hidden: false }, o2); clues.push(cl); return cl; };
  add('method', fill(meth.trace), { method: how, room: 0, item: meth.item, key: true });
  add('time', `${pick(R, ['A broken wristwatch on the floor, stopped at', 'The night log: a light was seen in the ' + crimeRoom + ' at', 'A spilled cup gone cold, and the clock above it stopped at'])} ${T}.`, { room: 0, item: pick(R, ['table', 'clock', 'desk', 'case'].filter(k => k !== meth.item)), time: when, key: true });
  const C = S[culprit], pers = pick(R, PERSONAL); add('breaks', `${C.name}'s ${pers}, by the ${ITEMNAME[meth.item]} in the ${crimeRoom}.`, { sus: culprit, room: 0, item: pick(R, ['sofa', 'bin', 'plant', 'table', 'shelf'].filter(k => k !== meth.item)), key: true, proof: true });
  add('means', fill(meth.means, C), { sus: culprit, method: how, room: Math.min(c.rooms - 1, 1 + ((R() * 3) | 0)), item: meth.mitem, proof: true });
  add('motive', fill(pick(R, MOTIVE), C), { sus: culprit, room: (R() * c.rooms) | 0, item: pick(R, ['desk', 'shelf', 'suitcase', 'cabinet']) });
  for (const h of herrings) { const H = S[h]; add('secret', fill(H.secret.clue, H), { sus: h, room: (R() * c.rooms) | 0, item: pick(R, ['coatstand', 'suitcase', 'desk', 'bin']) }); add('clears', fill(H.secret.clears, H), { sus: h, room: (R() * c.rooms) | 0, item: pick(R, ['shelf', 'desk', 'cabinet', 'table']), afterAdmit: true }); add('motive', fill(pick(R, MOTIVE), H), { sus: h, room: (R() * c.rooms) | 0, item: pick(R, ['desk', 'shelf', 'suitcase']) }); }
  S.forEach((s, i) => { if (i !== culprit && !herrings.includes(i)) add('confirms', `${pick(R, ['The guest book', 'The duty list', 'A photograph, timed'])}: ${s.name} in the ${s.claim} at ${T}.`, { sus: i, room: (R() * c.rooms) | 0, item: pick(R, ['shelf', 'desk', 'cabinet', 'table', 'painting']) }); });
  // put every clue on an object in its room (some hidden: turn the object over to see them)
  for (const cl of clues) { const r = rooms[Math.min(cl.room, rooms.length - 1)]; cl.room = rooms.indexOf(r); let it = r.items.find(q => q.kind === cl.item && q.clue == null);
    if (!it) { it = { kind: cl.item, clue: null }; r.items.push(it); } it.clue = cl.id; cl.hidden = R() < c.hidden; if (cl.hidden) { cl.face = 1 + ((R() * 3) | 0); cl.spot = [(R() - 0.5) * 0.9, (R() - 0.5) * 0.9]; } }
  for (const r of rooms) { const want = 6 + (c.N > 8 ? 1 : 0); const pool = shuffle(FURN.filter(k => !r.items.some(q => q.kind === k))); while (r.items.length < want && pool.length) r.items.push({ kind: pool.pop(), clue: null });
    shuffle(r.items); r.items.forEach((it, j) => { const n = r.items.length, a = j / n * TAU + R() * 0.3, rr = 2.8 + (j % 2) * 1.0; it.x = Math.cos(a) * rr * 1.2; it.z = Math.sin(a) * rr * 0.9; it.r = 1.1; it.seen = false; }); }
  G.S = S; G.rooms = rooms; G.room = 0; G.clues = clues; G.K = K; G.kindId = c.kind; G.obj = obj; G.crimeRoom = crimeRoom; G.place = P;
  G.truth = { who: culprit, how, when, herrings }; G.insp = null; G.notes = []; G.facts = []; G.links = []; G.strikes = 0; G.hints = 0; G.hintStep = 0; G.acts = 0; G.wrong = []; G.freeHints = c.freeHints; G.highlight = null;
  G.brief = `${obj.charAt(0).toUpperCase() + obj.slice(1)} ${/accounts$/.test(obj) ? K.verb.replace('was ', 'were ') : K.verb} at ${P.name}, in the ${crimeRoom}, some time this evening. ${S.length} people were in the building.`;
}
const clue = (G, id) => G.clues[id];
const found = G => G.clues.filter(c => c.found);
function addNote(G, text, kind, o = {}) { G.notes.push(Object.assign({ text, kind, t: G.t }, o)); }
// ---------- the player's actions ----------
function goRoom(G, i) { if (G.over || !G.rooms[i]) return false; G.room = i; G.insp = null; G.ev.push({ k: 'room', i }); return true; }
function tapScene(G, x, z) { if (G.over) return false; const r = G.rooms[G.room]; let best = null, bd = 1e9; for (const it of r.items) { const d = Math.hypot(it.x - x, it.z - z); if (d < bd) { bd = d; best = it; } }
  if (!best || bd > best.r * 1.4) return false; return inspect(G, r.items.indexOf(best)); }
function inspect(G, j) { const r = G.rooms[G.room], it = r.items[j]; if (!it) return false; G.insp = { j, yaw: 0, it }; it.seen = true; G.acts++; G.ev.push({ k: 'inspect', kind: it.kind });
  const cl = it.clue != null ? clue(G, it.clue) : null; if (cl && !cl.hidden) findClue(G, cl); else if (!cl) G.ev.push({ k: 'nothing', text: FILL[it.kind] }); else G.ev.push({ k: 'nothing', text: FILL[it.kind] }); return true; }
function turnInspect(G, d) { if (!G.insp) return false; G.insp.yaw += d; return true; }
const faceNow = G => { const y = ((G.insp.yaw % TAU) + TAU) % TAU; return Math.round(y / (Math.PI / 2)) % 4; };
function tapInspect(G, u, v) { const I = G.insp; if (!I || G.over) return false; const cl = I.it.clue != null ? clue(G, I.it.clue) : null;
  if (cl && cl.hidden && !cl.found && faceNow(G) === cl.face && Math.hypot(u - cl.spot[0], v - cl.spot[1]) < 0.25) { findClue(G, cl); return true; } G.ev.push({ k: 'tapnothing' }); return false; }
function closeInspect(G) { G.insp = null; return true; }
function findClue(G, cl) { if (cl.found) return; cl.found = true; G.ev.push({ k: 'clue', id: cl.id, key: !!cl.key, hidden: cl.hidden }); addNote(G, cl.text, 'clue', { id: cl.id }); lessonSee(G, cl.hidden ? 'hidden' : 'clue');
  if (cl.kind === 'time' || cl.kind === 'method') G.facts.push({ text: cl.kind === 'time' ? `It happened at ${TIMES[cl.time]}.` : `How: ${G.K.how[cl.method].name.toLowerCase()}.`, id: cl.id }); }
// questions: where were you; what do you know; (after a clue names them) about this
function questions(G, si) { const s = G.S[si]; return [{ id: 'where', q: 'Where were you this evening?' }, { id: 'know', q: `What do you know about ${G.obj}?` }].concat(s.admitted ? [{ id: 'more', q: 'Who can vouch for that?' }] : []); }
function ask(G, si, qid) { const s = G.S[si]; if (!s || G.over) return null; G.acts++; let a;
  if (qid === 'where') a = s.secret && !s.admitted ? `In my room, all evening. Alone.` : `In the ${s.claim}, from about eight until late.`;
  else if (qid === 'know') a = si === G.truth.who ? `Only what everyone knows. It was in the ${G.crimeRoom}. Valuable, I suppose.` : s.secret ? `Nothing. Why would I? Ask someone else.` : `I saw it at supper. Lovely thing. I never went near the ${G.crimeRoom} after that.`;
  else if (qid === 'more') a = s.secret ? s.secret.admit : '';
  else return null;
  if (!s.asked[qid]) { s.asked[qid] = true; addNote(G, `${s.name}: "${a}"`, 'said', { sus: si, q: qid }); if (qid === 'where') s.where = true; }
  G.ev.push({ k: 'answer', si, text: a }); lessonSee(G, 'ask'); return a; }
// show a clue to someone: their reaction, and what it proves
function present(G, si, cid) { const s = G.S[si], cl = clue(G, cid); if (!s || !cl || !cl.found || G.over) return null; G.acts++; let a, ok = false;
  if (cl.sus === si && cl.kind === 'breaks') { a = `That... I must have dropped it earlier. I was in the ${s.claim}, I told you!`; ok = true; if (!s.cracked) { s.cracked = true; G.facts.push({ text: `${s.name}'s story does not hold: their ${cl.text.split("'s ")[1].split(',')[0]} was at the scene.`, id: cid, sus: si, strong: true }); } }
  else if (cl.sus === si && cl.kind === 'secret') { a = s.secret.admit; ok = true; if (!s.admitted) { s.admitted = true; addNote(G, `${s.name}: "${a}"`, 'said', { sus: si }); G.facts.push({ text: `${s.name} lied, but about a secret: ${s.secret.admit.split('.')[0].toLowerCase()}.`, id: cid, sus: si }); } }
  else if (cl.sus === si && (cl.kind === 'means' || cl.kind === 'motive')) { a = cl.kind === 'means' ? `Lots of people could have that. It proves nothing.` : `Yes, all right. That doesn't make me a thief.`; ok = true; }
  else if (cl.sus === si && (cl.kind === 'confirms' || cl.kind === 'clears')) { a = `There. I told you where I was.`; ok = true; }
  else { a = `I don't see what that has to do with me.`; s.patience--; if (s.patience <= 0) a = `I've had enough of this. I'm not answering any more.`; }
  G.ev.push({ k: 'react', si, text: a, ok }); lessonSee(G, ok ? 'present' : 'presentbad'); return a; }
// the board: link a clue to a person and say what it shows; supported links become facts
const IMPL = [{ id: 'scene', name: 'puts them at the scene' }, { id: 'how', name: 'shows how they did it' }, { id: 'motive', name: 'gives them a motive' }, { id: 'clear', name: 'clears them' }];
function link(G, cid, si, imp) { const cl = clue(G, cid); if (!cl || !cl.found || !G.S[si]) return false; const truth = cl.sus === si && (imp === 'scene' && cl.kind === 'breaks' || imp === 'how' && cl.kind === 'means' || imp === 'motive' && cl.kind === 'motive' || imp === 'clear' && (cl.kind === 'confirms' || cl.kind === 'clears'));
  const L = { cid, si, imp, fact: truth }; G.links = G.links.filter(q => !(q.cid === cid && q.si === si)); G.links.push(L); G.ev.push({ k: 'link', fact: truth }); if (imp === 'clear' && truth) G.S[si].cleared = true; return truth; }
// hints: a question first, then where to look, then the clue itself
function askHint(G) { if (G.over) return null; const need = G.clues.filter(c => c.key || c.proof).find(c => !c.found) || (G.truth.herrings.map(h => G.clues.find(c => c.sus === h && c.kind === 'clears')).find(c => c && !c.found));
  let txt; if (!need) txt = 'You have what you need. Who was not where they said, and which two clues show it?';
  else { const step = G.hintStep = need.id === G.hintFor ? Math.min(3, G.hintStep + 1) : 1; G.hintFor = need.id;
    const q = { method: 'How was it done? Something in the room must show it.', time: 'When did it happen? Something must have stopped at that moment.', breaks: `Who was really in the ${G.crimeRoom}? Someone left something behind.`, means: 'Who could have done it that way? Look for what they used.', clears: 'Someone with a secret may still be in the clear. What do they say when shown their secret?' }[need.kind] || 'What is still unexplained?';
    txt = step === 1 ? q : step === 2 ? `Look in the ${G.rooms[need.room].name}${need.hidden ? ', and turn things over' : ''}.` : `The ${ITEMNAME[need.item]} in the ${G.rooms[need.room].name}${need.hidden ? ': turn it, and look closely' : ''}.`;
    if (step === 3) G.highlight = { room: need.room, item: need.item }; }
  if (G.freeHints > 0) G.freeHints--; else G.hints++; G.ev.push({ k: 'hint', text: txt }); return txt; }
// the accusation: who, how, when, and the two clues that prove it
function accuse(G, a) { if (G.over || G.lesson && G.lesson.id !== 'accuse') return null; const T = G.truth, ps = (a.proof || []).slice(0, 2);
  const pOk = ps.length === 2 && ps.every(id => clue(G, id) && clue(G, id).found) && ps.some(id => clue(G, id).kind === 'breaks' && clue(G, id).sus === T.who) && ps.some(id => (clue(G, id).kind === 'means' && clue(G, id).sus === T.who) || clue(G, id).kind === 'method');
  const ok = a.who === T.who && a.how === T.how && a.when === T.when && pOk;
  if (ok) { G.ev.push({ k: 'solved' }); if (G.lesson) { lessonSee(G, 'solved'); return { ok }; } finish(G, true); return { ok }; }
  // explain through the evidence, not just "wrong"
  const why = []; const S = G.S[a.who], have = k => G.clues.find(c => c.found && k(c));
  if (a.who !== T.who) { const c2 = have(c => c.sus === a.who && (c.kind === 'confirms' || c.kind === 'clears')); why.push(c2 ? `${c2.text} ${S.name} could not have been in the ${G.crimeRoom}.` : `Nothing you have found puts ${S ? S.name : 'them'} in the ${G.crimeRoom}.`); }
  if (a.how !== T.how) { const c2 = have(c => c.kind === 'method'); why.push(c2 ? `It was not "${G.K.how[a.how] ? G.K.how[a.how].name.toLowerCase() : '?'}": ${c2.text}` : `How was it done? You have not found what shows it.`); }
  if (a.when !== T.when) { const c2 = have(c => c.kind === 'time'); why.push(c2 ? `Not ${TIMES[a.when]}: ${c2.text}` : `When did it happen? You have not found what shows it.`); }
  if (!pOk) why.push('Those two clues do not prove it: one must put the culprit at the scene, the other must show how.');
  G.strikes++; G.wrong.push(why); G.ev.push({ k: 'wrong', why, left: G.cfg.tries - G.strikes }); if (G.lesson) { lessonSee(G, 'wrongacc'); return { ok, why }; }
  if (G.strikes >= G.cfg.tries) finish(G, false, 'cold'); return { ok, why }; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.lesson) lessonTick(G, dt); }
function finish(G, win, why) { if (G.over) return; G.over = win ? 'won' : 'lost'; const T = G.truth;
  const stars = win ? (G.strikes === 0 && G.hints <= 1 ? 3 : G.strikes === 0 ? 2 : 1) : 0, coins = win ? 12 + stars * 6 + G.clues.filter(c => c.found).length * 2 + G.S.length * 2 : 3;
  G.res = { win, why, stars, coins, who: G.S[T.who].name, how: G.K.how[T.how].name, when: TIMES[T.when], proof: G.clues.filter(c => c.proof).map(c => c.text), found: found(G).length, of: G.clues.length, strikes: G.strikes, hints: G.hints, herrings: T.herrings.map(h => G.S[h].name) };
  G.ev.push({ k: win ? 'won' : 'lost', why }); }

// ---------- LESSONS: turn things over, challenge a story, accuse with proof ----------
const LESSONS = {
  1: [{ id: 'search', title: 'LOOK CLOSELY', how: 'Tap an object to look at it. Drag to turn it round: some clues are only on the back. Tap what you notice. Find three hidden marks.', need: 3 }],
  2: [{ id: 'challenge', title: 'CHALLENGE A STORY', how: 'In People, ask where they were. Then Show a clue that is about them: a liar cracks, someone with a secret owns up. Do it twice. (A clue about someone else starts the count again.)', need: 2 }],
  3: [{ id: 'accuse', title: 'PROVE IT', how: 'In Accuse, choose who, how and when, and the two clues that prove it (one puts them at the scene, one shows how). Everything you need is already in the Notebook.', need: 1 }],
};
function lessonStart(G) { const st = LESSONS[G.N][0]; G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, id: st.id }; G.ev.push({ k: 'lessonnext', first: true });
  if (st.id === 'search') { G.clues.forEach(c => { if (!c.hidden && c.room === 0) { c.hidden = true; c.face = 1 + (c.id % 3); c.spot = [((c.id * 37) % 9 - 4) / 10, ((c.id * 53) % 9 - 4) / 10]; } }); }
  if (st.id === 'accuse') { G.clues.forEach(c => { if (c.key || c.proof || c.kind === 'clears') { c.found = true; addNote(G, c.text, 'clue', { id: c.id }); } }); } }
function lessonSee(G, what) { const D = G.lesson; if (!D || D.done) return; const id = D.id;
  const good = id === 'search' && what === 'hidden' || id === 'challenge' && what === 'present' || id === 'accuse' && what === 'solved';
  const bad = id === 'challenge' && what === 'presentbad';
  if (good) { D.n++; G.ev.push({ k: 'lessonok', n: D.n, need: D.steps[0].need }); if (D.n >= D.steps[0].need) { D.done = true; D.wait = 1.6; } }
  else if (bad && D.n) { D.n = 0; G.ev.push({ k: 'lessonmiss', how: 'That clue is not about them: show each person a clue that names them.' }); }
  else if (id === 'accuse' && what === 'wrongacc') G.ev.push({ k: 'lessonmiss', how: 'Not quite: read why, then try again. Lessons cost nothing.' }); }
function lessonTick(G, dt) { const D = G.lesson; if (!D.done) return; D.wait -= dt; if (D.wait > 0) return; G.lesson = null; makeCase(G, rng(G.seed + 9), G.cfg); G.ev.push({ k: 'lessondone', N: G.N }); }

// ---------- for the robots: blind moves and an honest detective ----------
const BLIND = {
  t: G => { if (G.insp && Math.random() < 0.6) tapInspect(G, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2); else { if (G.insp) closeInspect(G); tapScene(G, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 7); } },   // tap somewhere
  r: G => turnInspect(G, (Math.random() - 0.5) * 6),                                       // drag an object round
  g: G => goRoom(G, (Math.random() * G.rooms.length) | 0),                                // another room
  q: G => { const si = (Math.random() * G.S.length) | 0, qs = questions(G, si); ask(G, si, qs[(Math.random() * qs.length) | 0].id); },   // a question
  p: G => { const f = found(G); if (f.length) present(G, (Math.random() * G.S.length) | 0, f[(Math.random() * f.length) | 0].id); },   // show a clue
  a: G => { const f = found(G); accuse(G, { who: (Math.random() * G.S.length) | 0, how: (Math.random() * 4) | 0, when: (Math.random() * TIMES.length) | 0, proof: f.length >= 2 ? [f[(Math.random() * f.length) | 0].id, f[(Math.random() * f.length) | 0].id] : [] }); },   // accuse at random
};
// HONEST: a detective who looks: searches room by room (turning things over finds a hidden mark with chance acc), asks
// everyone where they were, shows each clue to the person it names, then accuses with what it has. It may stop early and
// guess (more often when sloppy, and the bigger the case), and with a secret still unexplained it can pick the wrong person.
function honest(G, o, mem) {
  if (G.over) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.t < (mem.next || 0)) return; mem.next = G.t + 0.6 + react * 2; const D = G.lesson;
  if (!mem.plan) { mem.plan = []; mem.pass = 0; }
  if (D && D.id === 'accuse') { const T = G.truth; accuse(G, { who: T.who, how: T.how, when: T.when, proof: G.clues.filter(c => c.proof).map(c => c.id) }); return; }
  // 1) search: every object in every room (and a second look at the ones that felt odd)
  if (!mem.searched) { mem.ri = mem.ri || 0; mem.ji = mem.ji || 0; const r = G.rooms[mem.ri];
    if (G.room !== mem.ri) { goRoom(G, mem.ri); return; }
    if (G.insp && mem.turning) { const cl = clue(G, G.insp.it.clue); if (faceNow(G) !== cl.face) { turnInspect(G, Math.PI / 2); return; } if (R() < acc) tapInspect(G, cl.spot[0] + (R() - 0.5) * 0.2, cl.spot[1] + (R() - 0.5) * 0.2); else (mem.odd = mem.odd || []).push([mem.ri, G.insp.j]); mem.turning = false; closeInspect(G); return; }
    if (mem.ji < r.items.length) { inspect(G, mem.ji); const it = r.items[mem.ji]; mem.ji++; if (it.clue != null && clue(G, it.clue).hidden && !clue(G, it.clue).found && (R() < 0.5 + acc * 0.5)) mem.turning = true; else closeInspect(G); return; }
    mem.ri++; mem.ji = 0; if (mem.ri >= G.rooms.length) mem.searched = true; return; }
  if (D && D.id === 'search') { mem.searched = false; mem.ri = 0; mem.ji = 0; return; }
  // 2) ask everyone where they were
  const un = G.S.find(s => !s.asked.where); if (un) { ask(G, un.i, 'where'); return; }
  // 3) show each person the clues that name them
  mem.shown = mem.shown || {}; const toShow = found(G).find(c => c.sus != null && !mem.shown[c.id] && (c.kind === 'breaks' || c.kind === 'secret')); if (toShow) { mem.shown[toShow.id] = 1; present(G, toShow.sus, toShow.id); return; }
  if (D && D.id === 'challenge') { const s2 = found(G).find(c => c.sus != null); if (s2) present(G, s2.sus, s2.id); else { mem.searched = false; mem.ri = 0; mem.ji = 0; } return; }
  // 4) a second look at odd objects, once
  if (mem.odd && mem.odd.length && !mem.second) { const [ri, j] = mem.odd.shift(); if (G.room !== ri) goRoom(G, ri); inspect(G, j); const cl = clue(G, G.rooms[ri].items[j].clue); if (cl && cl.hidden && !cl.found && R() < acc) { while (faceNow(G) !== cl.face) turnInspect(G, Math.PI / 2); tapInspect(G, cl.spot[0], cl.spot[1]); } closeInspect(G); if (!mem.odd.length) mem.second = true; return; }
  // 5) accuse with what it has (guessing what it lacks); a careful one asks for hints first
  const T = G.truth, f = found(G), has = k => f.find(k), br = f.filter(c => c.kind === 'breaks'), sec = T.herrings.filter(h => !G.S[h].admitted);
  const missing = !has(c => c.kind === 'method') || !has(c => c.kind === 'time') || !br.length || !has(c => c.proof && c.kind !== 'breaks');
  if (missing && (mem.hintsUsed || 0) < 3 && R() < acc) { mem.hintsUsed = (mem.hintsUsed || 0) + 1; askHint(G); const H = G.highlight; if (H) { goRoom(G, H.room); const j = G.rooms[H.room].items.findIndex(q => q.kind === H.item && q.clue != null); if (j >= 0) { inspect(G, j); const cl = clue(G, G.rooms[H.room].items[j].clue); if (cl.hidden && !cl.found) { while (faceNow(G) !== cl.face) turnInspect(G, Math.PI / 2); tapInspect(G, cl.spot[0], cl.spot[1]); } closeInspect(G); } } return; }
  const tried = mem.tried = mem.tried || [];
  let who = br.length ? br[0].sus : null; if (who == null || (sec.length && R() > acc)) { const pool = [T.who].concat(sec).concat(G.S.map(s => s.i)).filter(i => !tried.includes(i)); who = pool[(R() * Math.min(pool.length, 1 + sec.length)) | 0]; }
  const how = has(c => c.kind === 'method') ? has(c => c.kind === 'method').method : (R() * 4) | 0, when = has(c => c.kind === 'time') ? has(c => c.kind === 'time').time : (R() * TIMES.length) | 0;
  const pr = [br.find(c => c.sus === who), has(c => (c.kind === 'means' && c.sus === who) || c.kind === 'method')].filter(Boolean).map(c => c.id);
  while (pr.length < 2 && f.length) pr.push(f[(R() * f.length) | 0].id);
  tried.push(who); accuse(G, { who, how, when, proof: pr });
}
function winNow(G) { if (!G || G.over || G.lesson) return; finish(G, true); }
