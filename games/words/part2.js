
// ===================== RULES: Word Wheel (game 72, set 13: one of mine, the calm one, like Wordscapes) =====================
// A wheel of letters at the bottom, a little crossword above. Put your thumb on a letter and slide through others to spell a
// word; lift to try it. A word in the crossword fills in; any other real word is a BONUS word (a coin; ten fill the jar).
// A made-up word spills a drop of ink: run out of ink and the page starts again (a found word gives a drop back). Stuck?
// The bulb shows one letter (coins), the shuffle button turns the wheel. Fill the whole crossword.
const RULES = [
  '<b>Put your thumb on a letter</b> and slide through others to spell a word. Lift to try it.',
  'Words in the crossword <b>fill in</b>. Any other real word is a <b>bonus word</b>: a coin.',
  'A made-up word spills a <b>drop of ink</b>. Out of ink: the page starts again. A found word gives one back.',
  'Stuck? <b>💡</b> shows a letter (coins). <b>⟳</b> turns the wheel round.',
  'Fill the <b>whole crossword</b>. No hints and no spills: three stars.',
];
// the words: decoded once (each length's words are one long string)
const WORDS = (() => { const all = new Set(), common = {}, rank = {}; const dec = (s, tag) => { for (const part of s.split('|')) { const [n, str] = part.split(':'), L = +n; for (let i = 0; i < str.length; i += L) { const w = str.slice(i, i + L); all.add(w); if (tag) (common[L] = common[L] || []).push(w); rank[w] = tag ? 1 : 2; } } };
  const extra = {}; dec(WCOMMON, 1); for (const part of WEXTRA.split('|')) { const [n, str] = part.split(':'), L = +n; for (let i = 0; i < str.length; i += L) { const w = str.slice(i, i + L); all.add(w); (extra[L] = extra[L] || []).push(w); rank[w] = 2; } } return { all, common, extra, rank }; })();
const counts = w => { const c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return c; };
const within = (w, have) => { const c = {}; for (const ch of w) { c[ch] = (c[ch] || 0) + 1; if (c[ch] > (have[ch] || 0)) return false; } return true; };
const PLACES = [{ name: 'Meadow', sky: ['#bfe6ff', '#fff3d6'], hill: ['#9ad08a', '#7ab872', '#5a9a5a'] }, { name: 'Seaside', sky: ['#9ad8f0', '#fbe8d0'], hill: ['#58b0d0', '#3a90b8', '#f2dcb0'] },
  { name: 'Autumn Woods', sky: ['#ffd6a8', '#fff0dc'], hill: ['#e8a05a', '#c8743a', '#9a4a2a'] }, { name: 'Mountain Lake', sky: ['#c8b8f0', '#ffd8c8'], hill: ['#8a8ac8', '#6a6aa8', '#4a5a8a'] }, { name: 'Starry Night', sky: ['#1a2050', '#4a3a78'], hill: ['#2a3a6a', '#22305a', '#1a2448'] }];
const placeOf = N => Math.floor((N - 1) / 6) % PLACES.length;
const TILES = [{ id: 'cream', col: '#fff8ea', ink: '#5a3a2a', stars: 0 }, { id: 'mint', col: '#dff8ea', ink: '#2a5a3a', stars: 6 }, { id: 'sky', col: '#e2f0ff', ink: '#2a3a6a', stars: 15 }, { id: 'rose', col: '#ffe4ec', ink: '#6a2a3a', stars: 30 }];
const UPGRADES = [
  { id: 'ink', name: 'Bigger inkwell', desc: '+1 drop of ink on every page.', max: 3, cost: l => 40 + l * 50 },
  { id: 'cheap', name: 'Bright bulb', desc: 'Hints cost 5 coins less.', max: 3, cost: l => 60 + l * 60 },
  { id: 'jar', name: 'Small jar', desc: 'The bonus jar fills with 2 fewer words.', max: 2, cost: l => 80 + l * 80 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Reader'], [40, 'Speller'], [130, 'Wordsmith'], [320, 'Scholar'], [700, 'Poet'], [1500, 'Lexicon']];
const HINT = () => 25 - 5 * upLv('cheap'), JAR = () => 10 - 2 * upLv('jar');
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), boss = N % 10 === 0;
  const L = N <= 3 ? 4 : N <= 12 ? 5 : N <= 35 ? 6 : 7;
  return { N, f, help: !!help, place: placeOf(N), boss, L, want: Math.round(x(4, 11, 30) * (boss ? 1.25 : 1)), minLen: L >= 6 && N > 20 ? 4 : 3, rare: N >= 25, ink: (N >= 40 ? 3 : N >= 15 ? 4 : 5) + upLv('ink') + (help ? 2 : 0), size: 9 }; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, next: null, bank: o.bank != null ? o.bank : 100 };
  setup(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
// ---------- a page: a base word, the words inside it, laid out as a crossword ----------
function subwords(base, minLen, rare) { const have = counts(base), out = []; for (let L = minLen; L <= base.length; L++) { for (const w of WORDS.common[L] || []) if (within(w, have)) out.push(w); if (rare) for (const w of WORDS.extra[L] || []) if (within(w, have)) out.push(w); } return out; }
function pickBase(G) { const c = G.cfg, R = G.rnd, pool = WORDS.common[c.L]; for (let t = 0; t < 400; t++) { const b = pool[(R() * pool.length) | 0], subs = subwords(b, c.minLen, c.rare); const long = subs.filter(w => w.length >= c.L - 1).length;
    if (subs.length >= (t < 250 ? c.want + 3 : c.want) && long >= 2) return { base: b, subs }; } const b = pool[0]; return { base: b, subs: subwords(b, 3) }; }
// lay words into a crossword: the longest first, each next one across one already there, never touching side by side
function layout(words, R, maxW = 9, maxH = 9, most = 99) { const cells = new Map(), placed = [], key = (r, c) => r + ',' + c;
  const can = (w, r, c, dr, dc) => { let cross = 0; if (cells.has(key(r - dr, c - dc)) || cells.has(key(r + dr * w.length, c + dc * w.length))) return -1;
    for (let i = 0; i < w.length; i++) { const rr = r + dr * i, cc = c + dc * i, h = cells.get(key(rr, cc)); if (h) { if (h.ch !== w[i] || h[dr ? 'v' : 'h']) return -1; cross++; continue; }
      if (cells.has(key(rr + dc, cc + dr)) || cells.has(key(rr - dc, cc - dr))) return -1; } return cross; };
  const box = () => { let r0 = 1e9, r1 = -1e9, c0 = 1e9, c1 = -1e9; for (const k of cells.keys()) { const [r, c] = k.split(',').map(Number); r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); } return { r0, r1, c0, c1 }; };
  const put = (w, r, c, dr, dc) => { const cs = []; for (let i = 0; i < w.length; i++) { const rr = r + dr * i, cc = c + dc * i, k = key(rr, cc), h = cells.get(k) || { ch: w[i] }; h[dr ? 'v' : 'h'] = 1; cells.set(k, h); cs.push([rr, cc]); } placed.push({ w, cells: cs, found: false }); };
  for (const w of words) { if (placed.length >= most) break; if (!placed.length) { put(w, 0, 0, 0, 1); continue; } let best = null, bs = -1;
    for (const [k, h] of cells) { const [r, c] = k.split(',').map(Number); for (let i = 0; i < w.length; i++) { if (w[i] !== h.ch) continue; for (const [dr, dc] of [[0, 1], [1, 0]]) { const r0 = r - dr * i, c0 = c - dc * i, x = can(w, r0, c0, dr, dc); if (x < 1) continue;
          let r2 = r0 + dr * (w.length - 1), c2 = c0 + dc * (w.length - 1); const b = box(); const W2 = Math.max(b.c1, c2) - Math.min(b.c0, c0) + 1, H2 = Math.max(b.r1, r2) - Math.min(b.r0, r0) + 1; if (W2 > maxW || H2 > maxH) continue;
          const sc = x * 10 - (W2 * H2) * 0.3 + R(); if (sc > bs) { bs = sc; best = [r0, c0, dr, dc]; } } } }
    if (best) put(w, ...best); }
  const b = box(); for (const p of placed) p.cells = p.cells.map(([r, c]) => [r - b.r0, c - b.c0]); return { words: placed, rows: b.r1 - b.r0 + 1, cols: b.c1 - b.c0 + 1 }; }
function setup(G, o = {}) { const c = G.cfg, R = G.rnd; let base, subs;
  if (o.page) { base = o.page.base; subs = o.page.words; } else { const p = pickBase(G); base = p.base; subs = p.subs; }
  // the crossword: the base word, then a mix of the other words, longer ones more likely
  let pool = subs.filter(w => w !== base), chosen = [base]; pool.sort((a, b) => b.length - a.length + (R() - 0.5) * 2.5);
  if (o.page) chosen = o.page.words.slice(); else for (const w of pool) if (chosen.length < c.want * 3) chosen.push(w);
  // many tries at the crossword (each in a different order); the one that fits the most words, then the tidiest
  let lay = null; for (let t = 0; t < (o.page ? 1 : 40); t++) { const ord = chosen.slice().sort((a, b) => b.length - a.length + (t ? (R() - 0.5) * 3 : 0)); if (ord[0] !== base) { ord.splice(ord.indexOf(base), 1); ord.unshift(base); } const L2 = layout(ord, R, c.size, c.size + 1, o.page ? 99 : c.want);
    if (!lay || L2.words.length > lay.words.length || (L2.words.length === lay.words.length && L2.rows * L2.cols < lay.rows * lay.cols)) lay = L2; }
  G.base = base; G.words = lay.words; G.rows = lay.rows; G.cols = lay.cols; G.letters = base.split(''); for (let i = G.letters.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [G.letters[i], G.letters[j]] = [G.letters[j], G.letters[i]]; }
  if (G.letters.join('') === base) G.letters.reverse();
  G.shown = new Set(); G.bonus = []; G.tried = new Set(); G.ink = c.ink; G.inkMax = c.ink; G.spills = 0; G.hints = 0; G.spent = 0; G.score = 0; G.found = 0; G.jar = G.jar | 0; G.coins = 0; G.streak = 0; G.t = 0; G.lastFound = -9;
  G.subs = subs; }
const cellKey = (r, c) => r + ',' + c;
// ---------- your thumb: a word spelled by sliding through the letters (indexes into G.letters, each used once) ----------
function spell(G, idx) { if (G.over || G.wait > 0) return null; const w = idx.map(i => G.letters[i]).join(''); if (new Set(idx).size !== idx.length) return null;
  if (w.length < 3) { G.ev.push({ k: 'short' }); return 'short'; }
  const tgt = G.words.find(q => q.w === w);
  if (tgt) { if (tgt.found) { G.ev.push({ k: 'again', w }); return 'again'; } found(G, tgt, 'spell'); return 'found'; }
  if (WORDS.all.has(w)) { if (G.bonus.includes(w)) { G.ev.push({ k: 'again', w, bonus: true }); return 'again'; } G.bonus.push(w); G.coins++; G.score += w.length * 5; G.jar++; G.ev.push({ k: 'bonus', w, jar: G.jar });
    if (G.jar >= JAR()) { G.jar = 0; G.coins += 20; G.ev.push({ k: 'jar' }); } if (G.lesson) lessonSee(G, 'bonus'); return 'bonus'; }
  // a made-up word: a drop of ink
  G.ink--; G.spills++; G.streak = 0; G.ev.push({ k: 'spill', w, ink: G.ink });
  if (G.ink <= 0) { G.ev.push({ k: 'dry' }); if (G.lesson) { lessonMiss(G); return 'wrong'; } G.wait = 1.0; G.next = () => finish(G, false); }
  return 'wrong'; }
function found(G, q, how) { q.found = true; G.found++; for (const [r, c] of q.cells) G.shown.add(cellKey(r, c)); const quick = G.t - G.lastFound < 6; G.streak = quick ? G.streak + 1 : 1; G.lastFound = G.t;
  G.score += q.w.length * 10 * (how === 'spell' ? 1 + Math.min(4, G.streak - 1) * 0.25 : 0.5); if (how === 'spell') G.ink = Math.min(G.inkMax, G.ink + 1);
  G.ev.push({ k: 'found', w: q.w, i: G.words.indexOf(q), how, streak: G.streak, long: q.w === G.base });
  if (G.lesson) lessonSee(G, 'found');
  if (G.words.every(w => w.found)) { G.ev.push({ k: 'page' }); if (G.lesson) { lessonSee(G, 'page'); return; } G.wait = 1.4; G.next = () => finish(G, true); } }
// a hint: one hidden letter shown (in the word with most still hidden); a word fully shown counts as found
function hint(G) { if (G.over || G.wait > 0) return false; const cost = G.lesson ? 0 : HINT(); if (G.lesson && G.hints >= 2) { G.ev.push({ k: 'broke', lesson: true }); return false; } if (G.bank - G.spent < cost) { G.ev.push({ k: 'broke' }); return false; }
  const open = G.words.filter(q => !q.found).map(q => ({ q, hid: q.cells.filter(([r, c]) => !G.shown.has(cellKey(r, c))) })).filter(x => x.hid.length).sort((a, b) => b.hid.length - a.hid.length);
  if (!open.length) return false; const x = open[0], cell = x.hid[(G.rnd() * x.hid.length) | 0]; G.shown.add(cellKey(cell[0], cell[1])); G.spent += cost; G.hints++; G.ev.push({ k: 'hint', r: cell[0], c: cell[1] });
  for (const q of G.words) if (!q.found && q.cells.every(([r, c]) => G.shown.has(cellKey(r, c)))) found(G, q, 'hint');
  if (G.lesson) lessonSee(G, 'hint'); return true; }
function shuffle(G) { if (G.over) return; const R = G.rnd; for (let i = G.letters.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [G.letters[i], G.letters[j]] = [G.letters[j], G.letters[i]]; } G.ev.push({ k: 'shuffle' }); }
function step(G, dt) { if (G.over || !(dt > 0)) return; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } return; } G.t += dt; }
function finish(G, win) { if (G.over) return true; G.over = win ? 'won' : 'lost'; const c = G.cfg, prog = G.found / G.words.length;
  const stars = win ? 1 + (G.hints === 0 ? 1 : 0) + (G.spills === 0 ? 1 : 0) : 0;
  G.res = { win, stars, score: Math.round(G.score + (win ? 100 + stars * 50 : 0)), prog, found: G.found, total: G.words.length, bonus: G.bonus.length, bonusWords: G.bonus.slice(), hints: G.hints, spills: G.spills, spent: G.spent, base: G.base,
    coins: G.coins + (win ? 3 + Math.ceil(G.N / 4) + stars : 0) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: slides through some letters at random; taps the bulb; turns the wheel
function blindSpell(G) { const n = G.letters.length, L = 2 + ((Math.random() * (n - 1)) | 0), idx = []; while (idx.length < L) { const i = (Math.random() * n) | 0; if (!idx.includes(i)) idx.push(i); } spell(G, idx); }
const BLIND = { s: G => blindSpell(G), h: G => hint(G), f: G => shuffle(G) };
// a player who looks: knows most everyday words (the very common ones nearly always), takes a moment to see each one, and
// now and then tries one that is not a word; when it sees none left, it uses a hint (if it has the coins)
function indexes(G, w) { const used = [], idx = []; for (const ch of w) { const i = G.letters.findIndex((l, j) => l === ch && !used.includes(j)); if (i < 0) return null; used.push(i); idx.push(i); } return idx; }
// THE FIRST LESSON SHOWS A REAL WORD (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). SLIDE ACROSS LETTERS
// slid right across nothing: a slide that spells no word does nothing. Now it names the shortest word still to find (SPELL HAT) and the hand
// starts on its first letter and slides to the next. Later lessons leave the finding to him (the hint lesson points at the bulb).
function wordsCue(G) { const L = lay(), q = (G.words || []).filter(z => !z.found).sort((a, b) => a.w.length - b.w.length)[0], ix = q && indexes(G, q.w);
  if (!ix || ix.length < 2) return ['SLIDE ACROSS LETTERS', false]; const A = L.pts[ix[0]], B = L.pts[ix[1]]; return ['SPELL ' + q.w.toUpperCase(), [A.x, A.y, B.x, B.y]]; }
function honest(G, o, mem) { if (G.over || G.wait > 0) return; const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (mem.page !== G.words) { mem.page = G.words; mem.know = {}; mem.t = 1 + react * 2; for (const q of G.words) mem.know[q.w] = R() < (WORDS.rank[q.w] === 2 ? 0.5 : q.w.length <= 4 ? 0.97 : q.w === G.base ? 0.75 : 0.88) * (0.85 + acc * 0.15); mem.extra = G.subs.filter(w => !G.words.some(q => q.w === w) && R() < 0.4); }
  mem.t -= 1 / 60; if (mem.t > 0) return;
  // a hint shows letters: knowing a word gets likelier the more of it shows
  for (const q of G.words) if (!q.found && !mem.know[q.w]) { const sh = q.cells.filter(([r, c]) => G.shown.has(cellKey(r, c))).length / q.w.length; if (sh >= 0.5 && R() < 0.15) mem.know[q.w] = true; }
  const todo = G.words.filter(q => !q.found && mem.know[q.w]);
  if (R() < (1 - acc) * 0.25) { const n = G.letters.length, idx = []; while (idx.length < 3 + ((R() * 2) | 0) && idx.length < n) { const i = (R() * n) | 0; if (!idx.includes(i)) idx.push(i); } if (!WORDS.all.has(idx.map(i => G.letters[i]).join(''))) { spell(G, idx); mem.t = 0.8 + react * 2; return; } }
  if (todo.length) { const q = todo[(R() * todo.length) | 0]; spell(G, indexes(G, q.w)); mem.t = 0.6 + q.w.length * 0.25 + react * 3 * R(); return; }
  if (mem.extra.length && R() < 0.3) { const w = mem.extra.shift(); spell(G, indexes(G, w)); mem.t = 0.8 + react * 2; return; }
  // stuck: a hint if it can, or else look a while longer (a word comes to mind)
  if (hint(G)) { mem.t = 1 + react * 2; return; }
  if (R() < 0.35) { const left = G.words.filter(q => !q.found); mem.know[left[(R() * left.length) | 0].w] = true; mem.t = 2 + react * 3; return; }
  { const n = G.letters.length, idx = []; while (idx.length < 4 && idx.length < n) { const i = (R() * n) | 0; if (!idx.includes(i)) idx.push(i); } spell(G, idx); mem.t = 1.5 + react * 3; } }
function winNow(G) { if (!G || G.over) return; G.lesson = null; G.wait = 0; for (const q of G.words) q.found = true; G.found = G.words.length; finish(G, true); }
// ---------- LESSONS: little pages ----------
const LESSONS = {
  1: [{ id: 'spell', title: 'SLIDE TO SPELL', say: G => wordsCue(G)[0], do: 'drag', dir: 'right', at: G => wordsCue(G)[1], how: 'Put your thumb on a letter and slide through the others to spell a word. Lift to try it. Fill the crossword!', page: { base: 'heart', words: ['heart', 'earth', 'hate', 'tear', 'hat'] } }],
  2: [{ id: 'hint', title: 'STUCK? A HINT', say: 'STUCK? TAP 💡', do: 'tap', at: G => { const L = lay(); return [L.bulb.x, L.bulb.y]; }, how: 'Find the words. Stuck? Tap the 💡 bulb: it shows a letter (two free in this lesson). Made-up words spill ink!', page: { base: 'stone', words: ['stone', 'notes', 'tone', 'nest', 'one', 'set'] } }],
  3: [{ id: 'bonus', title: 'BONUS WORDS', say: 'FIND A BONUS WORD', do: 'drag', dir: 'right', how: 'Real words that are not in the crossword are BONUS words: a coin each. Find one bonus word, and fill the crossword.', page: { base: 'plane', words: ['plane', 'panel', 'lane', 'plan', 'pal'] } }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.rnd = rng(G.seed + (G.deals = (G.deals | 0) + 1)); setup(G, { page: st.page }); G.subs = subwords(st.page.base, 3); G.ink = G.inkMax = 4; G.lesson.n = 0; G.ev.push({ k: 'page0' }); }
function lessonMiss(G) { const st = lessonNow(G); G.ev.push({ k: 'lessonmiss', how: 'Out of ink! Only real words: look at the letters, then slide. ' + st.how }); G.wait = 1.2; G.next = () => lessonDeal(G); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st || G.wait > 0) return; if (what === 'bonus') G.lesson.n++;
  if (what !== 'page') return; if (st.id === 'bonus' && !G.lesson.n) { G.ev.push({ k: 'lessonmiss', how: 'The crossword is full, but find a BONUS word too: a real word that is not in it (like LEAP or PAN).' }); G.wait = 1.4; G.next = () => lessonDeal(G); return; }
  G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); setup(G); G.ev.push({ k: 'start' }); G.ev.push({ k: 'page0' }); }; }
