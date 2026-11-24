
// ===================== THE RULES: Dress Designer =====================
// A client brings a brief (a garden party, a gala, a beach wedding...) with wishes on its card: a colour family, a length,
// a fabric, a pattern, sleeves, a cut, a finishing touch. You design the dress part by part (the dress on the mannequin
// changes as you tap), then the model walks the runway and three judges give stars: THE CLIENT (were her wishes met?),
// STYLE (does it go together?) and CRAFT (are the finishing touches where they belong?). Three stars each, or more, and the
// client buys it. (JoJo's Fashion Show's rule: three of five stars to pass a stage.)
const RULES = [
  '<b>Read the brief.</b> The client\'s card lists what she wants: colour, length, fabric, pattern...',
  '<b>Design it part by part.</b> Tap an option and the dress changes at once. NEXT when you like it.',
  '<b>Finishing touches:</b> pick a trim, then tap where it goes (neck, waist or hem).',
  '<b>Walk the runway.</b> Three judges: THE CLIENT (her wishes), STYLE (does it go together?), CRAFT (touches in the right places).',
  '<b>Three stars or more from each judge</b> and she buys it. Win stars to open new studio looks.',
];
const PARTS = {
  cut: { name: 'CUT', opts: [{ id: 'aline', name: 'A-line' }, { id: 'sheath', name: 'Sheath' }, { id: 'ballgown', name: 'Ball gown' }, { id: 'mermaid', name: 'Mermaid' }, { id: 'slip', name: 'Slip' }] },
  len: { name: 'LENGTH', opts: [{ id: 'mini', name: 'Mini' }, { id: 'knee', name: 'Knee' }, { id: 'midi', name: 'Midi' }, { id: 'maxi', name: 'Maxi' }, { id: 'floor', name: 'Floor' }] },
  sleeve: { name: 'SLEEVES', opts: [{ id: 'strapless', name: 'Strapless' }, { id: 'straps', name: 'Straps' }, { id: 'short', name: 'Short' }, { id: 'long', name: 'Long' }, { id: 'offsh', name: 'Off-shoulder' }] },
  fabric: { name: 'FABRIC', opts: [{ id: 'cotton', name: 'Cotton' }, { id: 'satin', name: 'Satin' }, { id: 'velvet', name: 'Velvet' }, { id: 'chiffon', name: 'Chiffon' }, { id: 'sequins', name: 'Sequins' }] },
  colour: { name: 'COLOUR', opts: [
    { id: 'blush', name: 'Blush', col: 0xf6c4cc, fam: 'pastel' }, { id: 'mint', name: 'Mint', col: 0xb4ead2, fam: 'pastel' }, { id: 'lilac', name: 'Lilac', col: 0xd4c0f0, fam: 'pastel' }, { id: 'sky', name: 'Sky', col: 0xb4d6f6, fam: 'pastel' },
    { id: 'red', name: 'Red', col: 0xd8202e, fam: 'bright' }, { id: 'sun', name: 'Sunflower', col: 0xf6c82a, fam: 'bright' }, { id: 'tang', name: 'Tangerine', col: 0xf47a20, fam: 'bright' }, { id: 'fuchsia', name: 'Fuchsia', col: 0xe02a8a, fam: 'bright' },
    { id: 'navy', name: 'Navy', col: 0x1a2650, fam: 'dark' }, { id: 'emerald', name: 'Emerald', col: 0x0e6a46, fam: 'dark' }, { id: 'plum', name: 'Plum', col: 0x5a1a4a, fam: 'dark' }, { id: 'black', name: 'Black', col: 0x16161a, fam: 'dark' },
    { id: 'white', name: 'White', col: 0xf8f6f2, fam: 'white' }, { id: 'ivory', name: 'Ivory', col: 0xf2e8d0, fam: 'white' }, { id: 'gold', name: 'Gold', col: 0xd8b04a, fam: 'metal' }, { id: 'silver', name: 'Silver', col: 0xc8ccd4, fam: 'metal' }] },
  pattern: { name: 'PATTERN', opts: [{ id: 'plain', name: 'Plain' }, { id: 'floral', name: 'Floral' }, { id: 'stripes', name: 'Stripes' }, { id: 'polka', name: 'Polka dots' }] },
  trim: { name: 'FINISHING TOUCH', opts: [{ id: 'bow', name: 'Bow', spots: ['waist', 'neck'] }, { id: 'belt', name: 'Belt', spots: ['waist'] }, { id: 'lace', name: 'Lace', spots: ['hem'] }, { id: 'pearls', name: 'Pearls', spots: ['neck'] }, { id: 'flowers', name: 'Flowers', spots: ['waist', 'neck', 'hem'] }] },
};
const FAMS = { pastel: 'pastel', bright: 'bright', dark: 'dark or jewel', white: 'white or ivory', metal: 'gold or silver' };
// the briefs: each wish names a part and the options that satisfy it
const BRIEFS = [
  { id: 'garden', name: 'Garden Party', wishes: { colour: ['fam:pastel'], len: ['knee', 'midi'], pattern: ['floral'], fabric: ['cotton', 'chiffon'], sleeve: ['short', 'straps'], cut: ['aline'], trim: ['bow', 'flowers'] } },
  { id: 'gala', name: 'Gala Night', wishes: { colour: ['fam:dark'], len: ['floor'], fabric: ['satin', 'velvet'], pattern: ['plain'], cut: ['mermaid', 'sheath'], sleeve: ['offsh', 'strapless'], trim: ['pearls'] } },
  { id: 'beach', name: 'Beach Wedding', wishes: { colour: ['fam:white'], len: ['maxi', 'midi'], fabric: ['chiffon'], pattern: ['plain'], sleeve: ['straps', 'strapless'], cut: ['slip', 'aline'], trim: ['flowers', 'lace'] } },
  { id: 'winter', name: 'Winter Ball', wishes: { colour: ['fam:dark', 'fam:metal'], len: ['floor'], fabric: ['velvet'], sleeve: ['long'], cut: ['ballgown'], pattern: ['plain'], trim: ['belt', 'pearls'] } },
  { id: 'disco', name: 'Disco Night', wishes: { colour: ['fam:metal', 'fam:bright'], len: ['mini'], fabric: ['sequins'], pattern: ['plain'], sleeve: ['strapless', 'straps'], cut: ['sheath', 'slip'], trim: ['belt'] } },
  { id: 'prom', name: 'Prom', wishes: { colour: ['fam:bright', 'fam:pastel'], len: ['floor', 'maxi'], cut: ['ballgown'], fabric: ['satin', 'chiffon'], sleeve: ['offsh', 'strapless'], pattern: ['plain'], trim: ['bow'] } },
  { id: 'office', name: 'Office Chic', wishes: { colour: ['fam:dark'], len: ['knee'], cut: ['sheath'], fabric: ['cotton'], pattern: ['stripes', 'plain'], sleeve: ['short', 'long'], trim: ['belt'] } },
  { id: 'festival', name: 'Summer Festival', wishes: { colour: ['fam:bright'], len: ['mini', 'knee'], pattern: ['polka', 'floral'], fabric: ['cotton'], sleeve: ['straps', 'short'], cut: ['aline', 'slip'], trim: ['flowers'] } },
];
// what never goes together (STYLE): a clash costs a star
const CLASHES = [
  [d => d.fabric === 'sequins' && d.pattern !== 'plain', 'Sequins with a pattern: too busy'],
  [d => d.cut === 'ballgown' && (d.len === 'mini' || d.len === 'knee'), 'A ball gown wants length'],
  [d => d.cut === 'mermaid' && d.len !== 'floor' && d.len !== 'maxi', 'A mermaid needs to reach the floor'],
  [d => d.fabric === 'velvet' && d.sleeve === 'strapless' && d.len === 'mini', 'Velvet mini without straps: odd'],
  [d => d.pattern === 'stripes' && d.cut === 'ballgown', 'Stripes fight a ball gown'],
  [d => d.fabric === 'chiffon' && d.pattern === 'stripes', 'Chiffon blurs stripes'],
  [d => (d.colour === 'black' || d.colour === 'navy') && d.pattern === 'polka' && d.fabric === 'sequins', 'Too much going on'],
];
const PEOPLE = ['Amara', 'Bea', 'Chioma', 'Dani', 'Elif', 'Fola', 'Gigi', 'Hana', 'Imani', 'Jade', 'Kemi', 'Lola', 'Mina', 'Nia', 'Odette', 'Priya', 'Rosa', 'Sade', 'Tami', 'Zuri'];
const PLACES = [{ name: 'Little Studio', sky: 'morning' }, { name: 'City Atelier', sky: 'noon' }, { name: 'Fashion Week', sky: 'night' }, { name: 'Seaside Show', sky: 'golden' }, { name: 'Grand Gala', sky: 'night' }, { name: 'Paris-ish', sky: 'sunset' }];
const placeOf = N => Math.floor((N - 1) / 5) % PLACES.length;
const SKINS = [{ id: 'classic', name: 'Classic studio', col: 0xe8a8ff, stars: 0 }, { id: 'rose', name: 'Rose studio', col: 0xff8ab0, stars: 6 }, { id: 'gold', name: 'Gold studio', col: 0xe0b040, stars: 14 },
  { id: 'mint', name: 'Mint studio', col: 0x7ae0b8, stars: 24 }, { id: 'night', name: 'Night studio', col: 0x5a6ae0, stars: 36 }, { id: 'coral', name: 'Coral studio', col: 0xff8a6a, stars: 50 }, { id: 'pearl', name: 'Pearl studio', col: 0xf2ece4, stars: 66 }, { id: 'neon', name: 'Neon studio', col: 0x5affb0, stars: 85 }];
const UPGRADES = [
  { id: 'lights', name: 'Runway lights', max: 3, cost: l => [25, 60, 120][l], desc: 'A brighter show: judges are a little kinder.' },
  { id: 'model', name: 'Star model', max: 3, cost: l => [35, 80, 150][l], desc: 'A better walk earns a bonus star on CRAFT.' },
  { id: 'fabric', name: 'Fine fabrics', max: 3, cost: l => [30, 70, 140][l], desc: 'More money from every sale.' },
  { id: 'fame', name: 'Fame', max: 4, cost: l => [40, 90, 170, 280][l], desc: 'Happier clients tip more.' },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Sewing student'], [60, 'Junior designer'], [200, 'Designer'], [500, 'Head designer'], [1100, 'Couturier'], [2500, 'Fashion icon']];
// which parts a level asks for: new ones one at a time
const STAGES_BY = N => ['colour', 'len', 'pattern', 'fabric'].concat(N >= 2 ? ['sleeve'] : [], N >= 3 ? ['trim'] : [], N >= 4 ? ['cut'] : []);
const ORDER = ['cut', 'len', 'sleeve', 'fabric', 'colour', 'pattern', 'trim'];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 5 === 0, stages = STAGES_BY(N);
  return { stages, wishes: Math.min(stages.length, 4 + Math.floor(f / 6) + (boss ? 1 : 0)), miss: f >= 12 && f < 20 ? 1 : 0, exact: N <= 4, dislike: N >= 6, pass: help ? 2.5 : f >= 15 ? 3.5 : 3, per: Math.max(12, 30 - Math.max(0, f - 10) * 0.5), hidden: N >= 8 && !help, boss, help: !!help, judgeK: 1 + 0.06 * upLv('lights') }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, wait: 0, next: null };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
const optIdx = (part, id) => PARTS[part].opts.findIndex(o => o.id === id);
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; G.t = 0; G.yard = o.yard || null;
  const brief = o.brief || BRIEFS[(R() * BRIEFS.length) | 0], stages = o.stages || c.stages; G.brief = brief; G.who = PEOPLE[(R() * PEOPLE.length) | 0];
  const can = stages.filter(p => brief.wishes[p]).sort(() => R() - 0.5), n = Math.min(can.length, o.wishes || c.wishes);
  G.wish = can.slice(0, n); if (!G.wish.includes('colour') && can.includes('colour')) G.wish[0] = 'colour';
  G.ok = Object.assign({}, brief.wishes); if (c.exact && G.wish.includes('colour')) { const all = PARTS.colour.opts.filter(q => meets('colour', q.id, brief.wishes.colour)); G.ok.colour = [all[(R() * all.length) | 0].id]; }      // early clients name one colour
  G.no = null; if (c.dislike) { const p = G.wish[(R() * G.wish.length) | 0], bad = PARTS[p].opts.filter(q => !meets(p, q.id, G.ok[p])); if (bad.length && p !== 'trim') G.no = { p, id: bad[(R() * bad.length) | 0].id }; }      // later: something she will not wear
  G.hiddenWish = c.hidden && G.wish.length >= 4 ? G.wish[G.wish.length - 1] : null;      // from level 8: one wish is only said once you ask
  // the dress starts on options that do NOT meet her wishes (so nothing is done for you)
  G.d = {}; for (const p of ORDER) { const ok = G.ok[p] || [], opts = PARTS[p].opts.filter(q => !meets(p, q.id, ok)); G.d[p] = p === 'trim' ? null : (opts[(R() * opts.length) | 0] || PARTS[p].opts[0]).id; }
  G.trims = []; G.stages = ORDER.filter(p => stages.includes(p)); G.si = 0; G.pick = null; G.asked = false; G.walk = 0; G.stage = 'design'; G.st = { t: 0 }; G.ev.push({ k: 'part', p: G.stages[0] }); }
function meets(part, id, ok) { if (!ok) return true; if (part === 'colour') { const c = PARTS.colour.opts.find(q => q.id === id); return ok.some(w => w === id || (w.startsWith('fam:') && c && c.fam === w.slice(4))); } return ok.includes(id); }
const curPart = G => G.stages[G.si];
// ---------- your thumb: tap an option, tap a spot on the dress (for a trim), NEXT, ask ----------
function choose(G, i) { if (G.over || G.wait > 0 || G.stage !== 'design') return; const p = curPart(G), o = PARTS[p].opts[i]; if (!o) return;
  if (p === 'trim') { G.pick = o.id; G.ev.push({ k: 'pickTrim', id: o.id }); return; }
  G.d[p] = o.id; G.ev.push({ k: 'choose', p, id: o.id }); }
function spot(G, where) { if (G.over || G.wait > 0 || G.stage !== 'design' || curPart(G) !== 'trim' || !G.pick) return; const t = G.trims.find(q => q.at === where); if (t) t.id = G.pick; else if (G.trims.length < 2) G.trims.push({ id: G.pick, at: where }); else { G.trims.shift(); G.trims.push({ id: G.pick, at: where }); } G.ev.push({ k: 'trim', id: G.pick, at: where }); G.pick = null; }
function ask(G) { if (G.asked || !G.hiddenWish || G.over) return; G.asked = true; G.ev.push({ k: 'ask', p: G.hiddenWish }); }
function next(G) { if (G.over || G.wait > 0 || G.stage !== 'design') return; G.si++; G.st.t = 0; if (G.si >= G.stages.length) { G.stage = 'runway'; G.walk = 0; G.ev.push({ k: 'runway' }); } else G.ev.push({ k: 'part', p: curPart(G) }); }
// ---------- the clock: a client waits a while on each part, then says "that will do"; the runway walk; the judges ----------
function step(G, dt) { if (G.over || !(dt > 0)) return;
  if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; if (G.next) { const f = G.next; G.next = null; f(); } } return; }
  G.t += dt; G.st.t += dt;
  if (G.stage === 'design' && !G.lesson && G.st.t > G.cfg.per) { G.ev.push({ k: 'hurry' }); next(G); }
  if (G.stage === 'runway') { G.walk += dt / 6; if (G.walk >= 1) judge(G); } }
function judge(G) { if (G.over) return; const c = G.cfg, b = G.brief, d = G.d, notes = [];
  // THE CLIENT: her wishes
  let met = 0; for (const p of G.wish) { const ok = p === 'trim' ? G.trims.some(t => G.ok.trim.includes(t.id)) : meets(p, d[p], G.ok[p]); if (ok) met++; else notes.push(missNote(G, p)); }
  const missed = G.wish.length - met; let client = missed === 0 ? 5 : missed <= c.miss ? 3.5 : Math.max(1, 3 - missed);
  if (G.no && d[G.no.p] === G.no.id) { client = Math.max(1, client - 2.5); notes.unshift(`She said NO ${PARTS[G.no.p].opts.find(q => q.id === G.no.id).name.toLowerCase()}!`); }
  // STYLE: clashes
  const clashes = CLASHES.filter(q => q[0](d)).map(q => q[1]); const style = clamp(5 - clashes.length * 2, 1, 5); notes.push(...clashes);
  // CRAFT: touches where they belong; a model who walks well
  let craft = 4 + (upLv('model') ? 1 : 0); if (G.stages.includes('trim')) { if (!G.trims.length) { craft = 2; notes.push('No finishing touch'); } else for (const t of G.trims) if (!PARTS.trim.opts.find(q => q.id === t.id).spots.includes(t.at)) { craft -= 2; notes.push(`${PARTS.trim.opts.find(q => q.id === t.id).name} at the ${t.at}? It belongs ${PARTS.trim.opts.find(q => q.id === t.id).spots[0] === 'hem' ? 'at the hem' : 'at the ' + PARTS.trim.opts.find(q => q.id === t.id).spots[0]}`); } }
  craft = clamp(craft, 1, 5); if (!G.stages.includes('trim')) craft = Math.max(craft, 4);
  const stars = [client, style, craft].map(s => Math.min(5, Math.round(s * c.judgeK * 2) / 2));
  G.judges = stars; G.notes = notes; G.met = met; G.ev.push({ k: 'judge', stars });
  if (G.lesson) { lessonSee(G, 'judge'); return; }
  finish(G, stars.every(s => s >= c.pass)); }
function missNote(G, p) { const ok = G.ok[p]; if (p === 'colour') return `She wanted ${ok.map(w => w.startsWith('fam:') ? FAMS[w.slice(4)] : PARTS.colour.opts.find(q => q.id === w).name).join(' or ')} colours`;
  return `She wanted ${ok.map(id => PARTS[p].opts.find(q => q.id === id).name.toLowerCase()).join(' or ')} (${PARTS[p].name.toLowerCase()})`; }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const s = G.judges || [0, 0, 0], avg = (s[0] + s[1] + s[2]) / 3;
  const stars = win ? (avg >= 4.8 ? 3 : avg >= 4 ? 2 : 1) : 0, tip = win && avg >= 4.5 ? 3 + upLv('fame') * 2 : 0;
  G.res = { win, stars, judges: s, avg: +avg.toFixed(1), notes: G.notes || [], who: G.who, brief: G.brief.name, met: G.met, wishes: G.wish.length, tip, coins: Math.max(1, Math.round(avg * 2) + (win ? 4 + Math.ceil(G.N / 3) + stars * 2 + tip + upLv('fabric') * 2 : 0)) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- the robot: a designer who reads the card ----------
function honest(G, o, mem) { if (G.over || G.wait > 0 || G.stage !== 'design') return; const acc = o.acc == null ? 0.85 : o.acc, react = o.react == null ? 0.3 : o.react;
  mem.cd = (mem.cd || 0) - 1 / 60; if (mem.cd > 0) return; mem.cd = 0.25 + react;
  if (G.hiddenWish && !G.asked) { ask(G); return; }
  const key = G.si + ':' + G.seed + ':' + (G.deals | 0); if (mem.done === key) { next(G); return; }
  const p = curPart(G), ok = G.ok[p], known = G.wish.includes(p), load = G.wish.length + (G.no ? 1 : 0) + (G.hiddenWish ? 1 : 0) + (G.cfg.per < 20 ? 1 : 0) + (G.cfg.pass > 3 ? 1 : 0), right = Math.random() < 0.9 + 0.1 * acc - 0.014 * Math.max(0, load - 3);      // more to keep in mind, more slips
  if (p === 'trim') { if (!G.pick) { const good = PARTS.trim.opts.map((q, j) => j).filter(j => !known || ok.includes(PARTS.trim.opts[j].id)); choose(G, right ? good[0] : (Math.random() * 5) | 0); return; }
    const t = PARTS.trim.opts.find(q => q.id === G.pick); spot(G, right ? t.spots[0] : ['neck', 'waist', 'hem'][(Math.random() * 3) | 0]); mem.done = key; return; }
  const n = PARTS[p].opts.length, fits = j => (!known || meets(p, PARTS[p].opts[j].id, ok)), clean = j => !CLASHES.some(c => c[0](Object.assign({}, G.d, { [p]: PARTS[p].opts[j].id }))) && !(G.no && G.no.p === p && G.no.id === PARTS[p].opts[j].id);
  const careful = Math.random() < 0.6 + 0.4 * acc; let good = [...Array(n).keys()].filter(j => fits(j) && (!careful || clean(j))); if (!good.length) good = [...Array(n).keys()].filter(fits);
  choose(G, right ? good[(Math.random() * good.length) | 0] : (Math.random() * n) | 0); mem.done = key; }
// blind moves: a tap somewhere on the option row (any option), a tap on the dress (a spot), NEXT
const BLIND = { t: G => { if (Math.random() < 0.6) choose(G, (Math.random() * (curPart(G) === 'colour' ? 16 : 5)) | 0); }, s: G => spot(G, ['neck', 'waist', 'hem'][(Math.random() * 3) | 0]), n: G => { if (Math.random() < 0.5) next(G); } };
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; G.judges = [5, 5, 5]; G.notes = []; G.met = G.wish.length; finish(G, true); }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'design', title: 'TAP TO DESIGN', say: 'TAP WHAT SHE WANTS', do: 'tap', how: 'Her card says what she wants. Tap the options that match: the dress changes as you tap. NEXT when it matches. Meet all 3 wishes.', need: 1 }],
  2: [{ id: 'style', title: 'DOES IT GO TOGETHER?', say: 'NO CLASHING', do: 'tap', how: 'STYLE judges what clashes. Sequins with a pattern is too busy. Meet her wishes AND keep it clean.', need: 1 }],
  3: [{ id: 'trim', title: 'FINISHING TOUCHES', say: 'TAP WHERE IT GOES', do: 'tap', how: 'Pick a trim, then tap where it goes on the dress: pearls at the neck, a belt at the waist, lace at the hem.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); G.lesson.n = 0;
  if (st.id === 'design') setup(G, { yard: 'design', brief: BRIEFS[0], stages: ['colour', 'len', 'pattern'], wishes: 3 });
  if (st.id === 'style') setup(G, { yard: 'style', brief: BRIEFS[4], stages: ['colour', 'len', 'fabric', 'pattern'], wishes: 3 });
  if (st.id === 'trim') setup(G, { yard: 'trim', brief: BRIEFS[1], stages: ['colour', 'trim'], wishes: 2 });
  G.ev.push({ k: 'yard' }); }
function lessonSee(G, what) { const L = lessonNow(G); if (!L) return; const s = G.judges, ok = s.every(x => x >= 3);
  if (!ok) { G.ev.push({ k: 'lessonmiss', how: (G.notes[0] || 'Not quite.') + '. Try again: read her card.' }); G.wait = 2.2; G.next = () => lessonDeal(G); return; }
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'yard' }); }; }
