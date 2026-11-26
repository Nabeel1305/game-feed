// ===================== RULES: Tri-Peaks (game 55, mine for set 10: calm cards) =====================
// Three peaks of cards, 28 in all; only the bottom row is face up at first, and a card turns over when nothing covers it. The
// card on the pile below is your card: tap any uncovered card ONE HIGHER or ONE LOWER (an ace goes on a king and a two) to play
// it onto the pile, and it becomes your card. Stuck? Tap the stock for a new card, but the stock is short. Clear all three peaks.
// Every card played in a row without drawing builds a STREAK (and points); a streak of six turns the next stock card into a
// JOKER (it goes on anything, anything goes on it). Later: jokers in the stock, LOCKED cards (a padlock: play the gold KEY card
// first), and fewer cards in the stock. Planning which of two cards to play decides the game.
const RULES = [
  'Tap an <b>uncovered card</b> one <b>higher or lower</b> than the card on the pile (A goes on K and 2). It becomes your card.',
  'Stuck? Tap the <b>stock</b> for a new card. The stock is short: plan your runs.',
  'Six plays in a row without drawing: your next stock card is a <b>JOKER</b> 🃏 (wild).',
  '<b>Locked</b> cards 🔒 wait until you play the gold <b>KEY</b> card 🔑.',
  'Clear all three peaks. Stars for cards left in the stock.',
];
const SUITS = ['♠', '♥', '♦', '♣'], RANKS_ = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PLACES = [{ name: 'The Club Room', felt: '#1a5a3a' }, { name: 'The Riverboat', felt: '#5a1a2a' }, { name: 'The Casino', felt: '#1a3a6a' }, { name: 'The Palace', felt: '#4a3a1a' }];
const placeOf = N => Math.floor((N - 1) / 6) % 4;
const UPGRADES = [
  { id: 'undo', name: 'Second thoughts', desc: 'One undo every deal.', max: 1, cost: l => 60 },
  { id: 'extra', name: 'Extra card', desc: 'One more card in the stock.', max: 2, cost: l => 40 + l * 50 },
  { id: 'peek', name: 'Peek', desc: 'See the next stock card.', max: 1, cost: l => 70 },
];
const upLv = id => (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : ((store.get('ups', {}) || {})[id] | 0);
const RANKS = [[0, 'Newcomer'], [40, 'Card player'], [130, 'Card sharp'], [320, 'High roller'], [700, 'Dealer'], [1500, 'Grand master']];
function makeCfg(N, help) { const f = curve(N), x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), e = easyOf(N);
  return { N, f, help: !!help, place: placeOf(N), stock: Math.round(x(36, 22, 25) + 6 * e + (help ? 4 : 0)) + upLv('extra'), jokers: N >= 2 ? Math.round(x(2, 0.6, 30)) : 1, locks: N >= 4 ? Math.round(x(2, 6, 30)) : 0, undo: upLv('undo'), streakJ: 6 }; }
// the layout: rows of 3, 6, 9, 10; who covers whom
const ROWS = [3, 6, 9, 10];
function coverOf(r, i) { if (r === 0) return [[1, 2 * i], [1, 2 * i + 1]]; if (r === 1) { const b = i + Math.floor(i / 2); return [[2, b], [2, b + 1]]; } if (r === 2) return [[3, i], [3, i + 1]]; return []; }
function newGame(N, o = {}) { const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null, place: cfg.place, wait: 0, score: 0, streak: 0, best: 0, hist: [], undos: cfg.undo, gift: false, peaks: 0 };
  deal(G); if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G); else G.ev.push({ k: 'start' });
  return G; }
function deal(G, rig) { const R = G.rnd, c = G.cfg, deck = []; for (let d = 0; d < 2; d++) for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) deck.push({ r, s });      /* two decks: the stock can be longer than one deck allows */ for (let i = deck.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
  G.tab = []; let k = 0; ROWS.forEach((n, r) => { for (let i = 0; i < n; i++) G.tab.push({ r, i, card: deck[k++], gone: false, lock: false, key: false }); });
  G.waste = [deck[k++]]; G.stock = deck.slice(k, k + c.stock); for (let j = 0; j < c.jokers; j++) G.stock.splice(Math.floor(R() * (G.stock.length * 0.8) + G.stock.length * 0.1), 0, { joker: true });
  if (c.locks) { const cand = G.tab.filter(t => t.r <= 2).sort(() => R() - 0.5); cand.slice(0, c.locks).forEach(t => t.lock = true); const kc = G.tab.filter(t => t.r === 3 && !t.lock); kc[(R() * kc.length) | 0].key = true; }
  G.cleared = 0; if (rig) rig(G); }
const at = (G, r, i) => G.tab.find(t => t.r === r && t.i === i);
const free = (G, t) => !t.gone && coverOf(t.r, t.i).every(([r, i]) => { const q = at(G, r, i); return !q || q.gone; });
const top = G => G.waste[G.waste.length - 1];
const fits = (a, b) => a.joker || b.joker || Math.abs(a.r - b.r) === 1 || Math.abs(a.r - b.r) === 12;
const locked = (G, t) => t.lock && G.tab.some(q => q.key && !q.gone);
function canPlay(G, t) { return free(G, t) && !locked(G, t) && fits(t.card, top(G)); }
const moves = G => G.tab.filter(t => canPlay(G, t));
// ---------- what you do ----------
function play(G, idx) { if (G.over || G.wait > 0) return false; const t = G.tab[idx]; if (!t || t.gone) return false;
  if (!free(G, t)) { G.ev.push({ k: 'covered' }); return false; } if (locked(G, t)) { G.ev.push({ k: 'locked' }); return false; } if (!fits(t.card, top(G))) { G.ev.push({ k: 'nofit', idx }); G.streak = Math.max(0, G.streak); return false; }
  G.hist.push(snap(G)); t.gone = true; G.waste.push(t.card); G.cleared++; G.streak++; G.best = Math.max(G.best, G.streak); G.score += 10 * G.streak;
  if (t.key) G.ev.push({ k: 'unlock' }); if (t.r === 0) { G.peaks++; G.score += 150; G.ev.push({ k: 'peak', n: G.peaks }); }
  if (G.streak === G.cfg.streakJ && !G.gift) { G.gift = true; G.ev.push({ k: 'gift' }); }
  G.ev.push({ k: 'play', idx, streak: G.streak }); lessonSee(G, 'play');
  if (G.cleared >= G.tab.length) return finish(G, true); stuckCheck(G); return true; }
function drawStock(G) { if (G.over || G.wait > 0) return false; if (!G.stock.length) { G.ev.push({ k: 'empty' }); stuckCheck(G); return false; }
  G.hist.push(snap(G)); let c = G.stock.shift(); if (G.gift) { G.gift = false; G.stock.unshift(c); c = { joker: true }; } G.waste.push(c); if (G.streak >= 3) G.ev.push({ k: 'streakend', n: G.streak }); G.streak = 0; G.ev.push({ k: 'draw', joker: !!c.joker }); lessonSee(G, 'draw'); stuckCheck(G); return true; }
function undo(G) { if (G.over || G.undos <= 0 || !G.hist.length) return false; G.undos--; const s = JSON.parse(G.hist.pop()); Object.assign(G, s); G.ev.push({ k: 'undo' }); return true; }
function snap(G) { return JSON.stringify({ tab: G.tab, waste: G.waste, stock: G.stock, cleared: G.cleared, streak: G.streak, score: G.score, gift: G.gift, peaks: G.peaks }); }
function stuckCheck(G) { if (!G.stock.length && !moves(G).length && !G.gift) { if (G.lesson) { G.ev.push({ k: 'lessonmiss', how: lessonNow(G).how }); G.lesson.n = 0; G.wait = 1.6; G.next = () => lessonDeal(G); return; } G.wait = 1.2; G.next = () => finish(G, false); } }
function finish(G, win) { if (G.over) return true; if (G.lesson) { lessonSee(G, 'clear'); return true; } G.over = win ? 'won' : 'lost'; const left = G.stock.length, c = G.cfg;
  if (win) G.score += left * 50; const stars = win ? 1 + (left >= 3 ? 1 : 0) + (left >= 6 || G.best >= 12 ? 1 : 0) : 0;
  G.res = { win, stars, score: G.score, left, best: G.best, cleared: G.cleared, of: G.tab.length, coins: win ? 4 + Math.ceil(G.N / 3) + stars * 2 : 1 + Math.floor(G.cleared / 10) };
  G.ev.push({ k: win ? 'won' : 'lost' }); return true; }
function step(G, dt) { if (G.over || !(dt > 0)) return; G.t += dt; if (G.wait > 0) { G.wait -= dt; if (G.wait <= 0) { G.wait = 0; const f = G.next; G.next = null; if (f) f(); } } }
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'run', title: 'ONE UP, ONE DOWN', say: G => peaksCue(G)[0], do: G => peaksCue(G)[1], at: G => peaksCue(G)[2], how: 'Your card is on the pile. Tap a face-up card one higher or one lower. Keep going! Play a run of four.', need: 1 }],
  2: [{ id: 'choose', title: 'CHOOSE WELL', say: G => peaksCue(G)[0], do: G => peaksCue(G)[1], at: G => peaksCue(G)[2], how: 'Two cards fit. One leads to a longer run. Look ahead and pick the one that keeps you going: a run of five without drawing.', need: 1 }],
  3: [{ id: 'peak', title: 'TO THE TOP', say: G => peaksCue(G)[0], do: G => peaksCue(G)[1], at: G => peaksCue(G)[2], how: 'Clear a peak: play cards until the top card of a peak is gone.', need: 1 }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0 }; G.ev.push({ k: 'lessonnext', first: true }); lessonDeal(G); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonDeal(G) { const st = lessonNow(G); G.streak = 0; G.hist = []; deal(G, g => {
    const b = g.tab.filter(t => t.r === 3); const set = rs => rs.forEach((r, j) => b[j].card = { r, s: j % 4 });
    if (st.id === 'run') { g.waste = [{ r: 4, s: 0 }]; set([5, 6, 7, 8, 12, 0, 10, 2, 9, 11]); }
    if (st.id === 'choose') { g.waste = [{ r: 6, s: 1 }]; set([7, 5, 12, 1, 4, 3, 2, 0, 10, 11]); }      // 5 leads on to 4 3 2 1 (A): the longer run; 7 is a dead end
    if (st.id === 'peak') { g.waste = [{ r: 0, s: 2 }]; g.stock = Array.from({ length: 30 }, () => ({ joker: true })); } }); }
function lessonSee(G, what) { const st = lessonNow(G); if (!st) return; let ok = null;
  if (st.id === 'run' && what === 'play' && G.streak >= 4) ok = true;
  if (st.id === 'choose') { if (what === 'play' && G.streak >= 5) ok = true; if (what === 'draw') ok = false; }
  if (st.id === 'peak' && what === 'play' && G.peaks >= 1) ok = true;
  if (ok == null) return;
  if (!ok) { G.lesson.n = 0; G.ev.push({ k: 'lessonmiss', how: st.how }); G.wait = 1.4; G.next = () => lessonDeal(G); return; }
  G.lesson.i++; if (G.lesson.i >= G.lesson.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); G.wait = 1.6; G.next = () => { G.rnd = rng(G.seed); G.score = 0; G.best = 0; G.peaks = 0; deal(G); G.streak = 0; G.hist = []; G.ev.push({ k: 'start' }); }; } else { G.wait = 1.2; G.next = () => lessonDeal(G); } }
// ---------- for the robots ----------
// BLIND: a thumb that does not look: taps a card somewhere in the peaks, or the stock
const BLIND = { c: G => play(G, (Math.random() * G.tab.length) | 0), s: G => drawStock(G) };
// a player who looks: plays the card that starts the longest run it can see (face-up cards only), keeps jokers for when stuck,
// plays the key early; draws only when nothing fits
function runFrom(G, t, depth) { if (depth > 7) return 0; t.gone = true; const prev = G.waste; G.waste = prev.concat([t.card]); let best = 0; for (const q of G.tab) if (!q.gone && free(G, q) && !locked(G, q) && fits(q.card, top(G)) && qFaceUp(G, q, t)) best = Math.max(best, runFrom(G, q, depth + 1)); G.waste = prev; t.gone = false; return 1 + best; }
const qFaceUp = (G, q, removed) => q.r === 3 || coverOf(q.r, q.i).every(([r, i]) => { const z = at(G, r, i); return !z || z.gone; });
// THE HAND IS ON THE CARD TO PLAY (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens"). It tapped in a box.
// Now the robot is asked (dryPlan) and the hand is on its card (one up or one down, the one that leads furthest), or on the pile to draw.
function peaksCue(G) { if (G.over || G.wait > 0) return ['WAIT…', 'wait', false]; const L = lay(), P = dryPlan(G, null, { t: -1, cd: -1 }); if (!P) return ['WAIT…', 'wait', false];
  if (P[0] === 'drawStock') return ['NONE FITS: TAP THE PILE', 'tap', [L.stock.x + L.stock.w / 2, L.stock.y + L.stock.h / 2]];
  const t = G.tab[P[1]], p = L.pos(t.r, t.i); return [G.lesson && G.lesson.steps[0].id === 'choose' ? 'THIS ONE GOES FURTHER' : 'TAP THIS CARD', 'tap', [p.x, p.y]]; }
function honest(G, o, mem) { const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, R = Math.random;
  if (G.over || G.wait > 0) return; mem.t = (mem.t || 0) - 1 / 60; if (mem.t > 0) return; mem.t = 0.25 + react * 1.2;
  const ms = moves(G); if (!ms.length) { ACT.drawStock(G); return; }
  if (R() > acc) { if (R() < 0.3) { ACT.drawStock(G); return; } const m = ms[(R() * ms.length) | 0]; ACT.play(G, G.tab.indexOf(m)); return; }      // a slip: an early draw, or a careless pick
  let best = null, bv = -1; for (const m of ms) { const v = runFrom(G, m, 0) + (m.key ? 3 : 0) + (m.r < 3 ? 0.5 : 0) - (top(G).joker ? 0 : 0); if (v > bv) { bv = v; best = m; } }
  ACT.play(G, G.tab.indexOf(best)); }
function winNow(G) { if (!G || G.over || G.wait > 0) return; G.lesson = null; G.tab.forEach(t => t.gone = true); G.cleared = G.tab.length; finish(G, true); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { play, drawStock }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
