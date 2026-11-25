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
const KINDS = { animal: '🐾', family: '🏠', money: '🪙', truth: '🗣️', courage: '🔥', work: '🔨' };
const GOOD = [
  ['animal', 'Fed every stray cat on the street', 1], ['animal', 'Ran a shelter for old dogs', 2], ['animal', 'Freed a fox from a snare in winter', 2], ['animal', 'Saved a herd from a barn fire', 3],
  ['family', 'Called {p} mother every Sunday', 1], ['family', 'Raised {p} sister\'s three children', 3], ['family', 'Nursed {p} father for ten years', 2], ['family', 'Forgave the brother who wronged {o}', 2],
  ['money', 'Paid a stranger\'s rent in secret', 2], ['money', 'Gave half {p} winnings to the hospital', 3], ['money', 'Always tipped the waiters well', 1], ['money', 'Lent money and never asked it back', 1],
  ['truth', 'Owned up to a mistake that cost {o} the job', 2], ['truth', 'Told the court the truth when it was dangerous', 3], ['truth', 'Returned a wallet full of cash', 1], ['truth', 'Never told a lie to {p} children', 1],
  ['courage', 'Pulled a child from a frozen lake', 3], ['courage', 'Stood up to the bully in the yard', 1], ['courage', 'Ran into a burning house for a neighbour', 3], ['courage', 'Gave blood in every emergency', 1],
  ['work', 'Taught at the village school for forty years', 2], ['work', 'Built the bridge that saved the valley', 2], ['work', 'Swept the church steps every morning', 1], ['work', 'Cured a thousand patients for free', 3],
];
const BAD = [
  ['animal', 'Kicked the neighbour\'s dog', 1], ['animal', 'Poisoned the pigeons in the square', 2], ['animal', 'Ran a cruel dogfighting ring', 3], ['animal', 'Left {p} horse to starve', 2],
  ['family', 'Missed every birthday of {p} son', 1], ['family', 'Cheated {p} brother out of the farm', 2], ['family', 'Abandoned {p} family for money', 3], ['family', 'Never visited {p} dying mother', 2],
  ['money', 'Stole sweets from the corner shop', 1], ['money', 'Cheated old people out of their savings', 3], ['money', 'Took bribes as a judge', 2], ['money', 'Never paid back a loan', 1],
  ['truth', 'Lied on every tax return', 1], ['truth', 'Spread rumours that ruined a career', 2], ['truth', 'Let an innocent man go to prison', 3], ['truth', 'Faked {p} own death for the insurance', 2],
  ['courage', 'Ran away and left {p} friend in danger', 2], ['courage', 'Hid while {p} village burned', 1], ['courage', 'Blamed a child for {p} own crash', 2], ['courage', 'Sold out the resistance to the enemy', 3],
  ['work', 'Never finished a day\'s work honestly', 1], ['work', 'Built a school with rotten beams', 3], ['work', 'Sold fake medicine', 3], ['work', 'Took the credit for a friend\'s invention', 2],
];
const SMALL_GOOD = [['animal', 'Rescued a bird with a broken wing'], ['family', 'Wrote to grandma every month'], ['money', 'Dropped coins in every hat'], ['truth', 'Told the cashier she gave too much change'], ['courage', 'Spoke up for a new kid'], ['work', 'Helped a neighbour build a shed']];
const SMALL_BAD = [['animal', 'Threw stones at the ducks'], ['family', 'Read {p} sister\'s diary'], ['money', 'Kept a library book for ever'], ['truth', 'Lied about {p} age'], ['courage', 'Pretended not to see a fall'], ['work', 'Slept through {p} shifts']];
const SHE = ['Agnes', 'Clara', 'Edith', 'Greta', 'Ines', 'Lena', 'Nadia', 'Priya', 'Rosa', 'Tilde', 'Vera', 'Yara', 'Amara', 'Dana', 'Ngozi', 'Mei'], HE = ['Boris', 'Desmond', 'Felix', 'Hugo', 'Jasper', 'Kofi', 'Mateo', 'Otto', 'Quentin', 'Sven', 'Umar', 'Wilf', 'Zeke', 'Bao', 'Chidi', 'Emeka'];
const say3 = (s, t) => t.replace(/\{p\}/g, s.female ? 'her' : 'his').replace(/\{o\}/g, s.female ? 'her' : 'him');
const LAST = ['Abbot', 'Baker', 'Carver', 'Dunn', 'Ekwueme', 'Fisher', 'Grant', 'Hale', 'Ito', 'Jones', 'Kovac', 'Lund', 'Mbeki', 'Novak', 'Oduya', 'Park', 'Quist', 'Reyes', 'Sato', 'Turner'];
const CAUSE = ['in her sleep, aged', 'falling off a ladder, aged', 'of a broken heart, aged', 'laughing too hard, aged', 'in a storm at sea, aged', 'of old age, aged', 'in a car crash, aged', 'choking on a fishbone, aged', 'peacefully at home, aged', 'struck by lightning, aged'];
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
    const g = GOOD[(R() * GOOD.length) | 0], b = BAD[(R() * BAD.length) | 0];
    const nh = o.hidden != null ? o.hidden : Math.min(3, Math.floor(R() * (c.hidden + 0.999) + (R() < c.hidden % 1 ? 1 : 0)));
    const deeds = [{ kind: g[0], text: g[1], w: g[2], best: true }, { kind: b[0], text: b[1], w: -b[2], worst: true }];
    for (let i = 0; i < nh; i++) { const good = R() < 0.5, s = (good ? SMALL_GOOD : SMALL_BAD)[(R() * 6) | 0]; deeds.push({ kind: s[0], text: s[1], w: good ? 1 : -1, hidden: true }); }
    const liar = false;
    const age = o.age != null ? o.age : R() < 0.06 ? 6 + ((R() * 5) | 0) : R() < 0.06 ? 101 + ((R() * 5) | 0) : 18 + ((R() * 80) | 0);
    const female = R() < 0.5, s = { id: ++G.id, name: (female ? SHE : HE)[(R() * 16) | 0] + ' ' + LAST[(R() * LAST.length) | 0], age, cause: CAUSE[(R() * CAUSE.length) | 0], deeds, liar, face: (R() * 1e9) | 0, female, looked: false };
    deeds.forEach(d => d.text = say3(s, d.text));
    // close calls: the visible sum near zero, so the sealed deeds decide (more often later)
    const vis = deeds.filter(d => !d.hidden).reduce((a, d) => a + d.w * mult(G, d), 0), close = Math.abs(vis) <= nh;
    if (o.close != null && close !== o.close) continue; if (o.close == null && close && R() > c.close) continue;
    return s;
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
