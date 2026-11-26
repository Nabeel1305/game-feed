// ===================== RULES: Country Vet (game 17) =====================
// A country vet's barn, in 3D. Animals come in one at a time with something wrong: a thorn in a paw, an overgrown hoof, a cut
// leg, a fever that needs an injection, a coat caked in mud, a sore ear. The card says what the owner noticed ("Limping",
// "Off her food"); you look at the animal to see where, pick the right tool from the tray and use it the way the tool is used:
// pull a thorn out slowly, rasp a hoof down to the line, spray a cut clean and wrap it, hold the needle in and lift off when she
// shivers, brush with the hair, drop into the ear when the head is still. Rough handling frightens the animal (the calm bar):
// stroke her slowly to settle her. Too frightened and she will not hold still; past that she bolts out of the barn.

const RULES = [
  '<b>The card says what is wrong.</b> Look at the animal to see where: a thorn, a long hoof, a cut, mud, a sore ear.',
  '<b>Pick the right tool</b> from the tray, then use it on the right spot, the way that tool is used.',
  '<b>Thorn:</b> tweezers on it, then pull away <b>slowly</b>. <b>Hoof:</b> rasp strokes down to the line, short ones near the end.',
  '<b>Cut:</b> hold the spray on it, then wrap the bandage round the leg, <b>unhurried</b>. <b>Fever:</b> hold the needle in; lift off when she shivers.',
  '<b>Mud:</b> brush <b>with the hair</b> (head to tail). <b>Ear:</b> a drop each time the head is still.',
  '<b>Rough handling frightens her.</b> Stroke her slowly with your hand to calm her. If she gets too nervous, you fail the round.',
];
// the animals and what can be wrong with them
const ANIMALS = {
  dog: { name: 'dog', names: ['Bella', 'Max', 'Rex', 'Daisy', 'Buddy', 'Scout', 'Poppy', 'Bruno', 'Tess', 'Monty', 'Luna', 'Jasper', 'Biscuit', 'Shadow'], temper: 0.9, hoofed: false, from: 1, probs: ['thorn', 'cut', 'shot', 'mud', 'ear'] },
  cow: { name: 'cow', names: ['Clover', 'Buttercup', 'Rosie', 'Mabel', 'Bessie', 'Daffodil', 'Hazel', 'Primrose', 'Molly', 'Dot', 'Gertie', 'Flora', 'Queenie', 'Marigold'], temper: 1.0, hoofed: true, from: 2, probs: ['hoof', 'thorn', 'cut', 'shot', 'mud'] },
  sheep: { name: 'sheep', names: ['Woolly', 'Dolly', 'Shaun', 'Fern', 'Pip', 'Blossom', 'Cotton', 'Mopsy', 'Barley', 'Snowy', 'Nell', 'Tuppence', 'Bramble', 'Misty'], temper: 1.1, hoofed: true, from: 2, probs: ['mud', 'hoof', 'thorn', 'ear'] },
  horse: { name: 'horse', names: ['Duke', 'Star', 'Ginger', 'Nutmeg', 'Thunder', 'Copper', 'Willow', 'Captain', 'Juniper', 'Chestnut', 'Biscuit', 'Major', 'Bonnie', 'Flint'], temper: 1.25, hoofed: true, from: 3, probs: ['hoof', 'thorn', 'cut', 'shot', 'mud'] },
  pig: { name: 'pig', names: ['Peggy', 'Truffle', 'Wilbur', 'Hamlet', 'Rosa', 'Bubbles', 'Acorn', 'Pickle', 'Dumpling', 'Petal', 'Rasher', 'Snuffles', 'Olive', 'Curly'], temper: 1.0, hoofed: true, from: 3, probs: ['shot', 'cut', 'mud', 'ear'] },
  // 25 Nov 2026 (his words: "way more combinations... something novel each time"): six animals were the whole practice. Twenty-two now, coming in as the
  // levels go by; each is drawn from the same parts as one of the six (BODY in part3), with its own size, coat and temper.
  sheepdog: { name: 'sheepdog', names: ['Meg', 'Jess', 'Fly', 'Moss', 'Gyp', 'Roy', 'Nell', 'Cap', 'Bess', 'Glen', 'Tweed', 'Skye'], temper: 0.85, hoofed: false, from: 2, probs: ['thorn', 'cut', 'shot', 'mud', 'ear'] },
  lamb: { name: 'lamb', names: ['Pudding', 'Tiny', 'Bobbin', 'Sprout', 'Minty', 'Dinky', 'Pom', 'Fleece', 'Button', 'Skip'], temper: 1.2, hoofed: true, from: 4, probs: ['mud', 'thorn', 'ear', 'shot'] },
  pony: { name: 'pony', names: ['Bramble', 'Toffee', 'Peanut', 'Merrylegs', 'Dusty', 'Conker', 'Pippin', 'Sugar', 'Smudge', 'Honey'], temper: 1.15, hoofed: true, from: 5, probs: ['hoof', 'thorn', 'cut', 'shot', 'mud'] },
  calf: { name: 'calf', names: ['Bluebell', 'Dandelion', 'Patch', 'Moo', 'Freckle', 'Nutkin', 'Sorrel', 'Midge', 'Tansy', 'Bud'], temper: 1.2, hoofed: true, from: 5, probs: ['thorn', 'cut', 'shot', 'mud', 'ear'] },
  terrier: { name: 'terrier', names: ['Scamp', 'Rags', 'Digger', 'Pepper', 'Ziggy', 'Nipper', 'Tuppy', 'Badger', 'Fizz', 'Jock'], temper: 1.05, hoofed: false, from: 6, probs: ['thorn', 'cut', 'shot', 'ear', 'mud'] },
  cat: { name: 'farm cat', names: ['Smokey', 'Tiger', 'Mittens', 'Ginger', 'Sooty', 'Marmalade', 'Tabitha', 'Felix', 'Purdy', 'Socks'], temper: 1.3, hoofed: false, from: 6, probs: ['thorn', 'cut', 'shot', 'ear'] },
  piglet: { name: 'piglet', names: ['Squeak', 'Pip', 'Bacon Bit', 'Truffles', 'Pinky', 'Wiggle', 'Rollo', 'Peaches', 'Snout', 'Dot'], temper: 1.25, hoofed: true, from: 6, probs: ['shot', 'cut', 'mud', 'ear'] },
  donkey: { name: 'donkey', names: ['Eeyore', 'Jenny', 'Moses', 'Dolores', 'Barnaby', 'Thistle', 'Noddy', 'Hetty', 'Solomon', 'Oats'], temper: 1.1, hoofed: true, from: 7, probs: ['hoof', 'thorn', 'cut', 'shot', 'mud', 'ear'] },
  kid: { name: 'kid goat', names: ['Skippy', 'Bounce', 'Nibbles', 'Tuft', 'Hopscotch', 'Pogo', 'Clove', 'Bleat', 'Fidget', 'Twig'], temper: 1.25, hoofed: true, from: 7, probs: ['thorn', 'ear', 'shot', 'cut'] },
  ram: { name: 'ram', names: ['Rambo', 'Hector', 'Angus', 'Boris', 'Samson', 'Curly', 'Tup', 'Goliath', 'Bruce', 'Fergus'], temper: 1.25, hoofed: true, from: 8, probs: ['hoof', 'mud', 'thorn', 'shot'] },
  bull: { name: 'bull', names: ['Ferdinand', 'Brutus', 'Titan', 'Hercules', 'Monty', 'Boss', 'Duke', 'Tank', 'Caesar', 'Big Bill'], temper: 1.35, hoofed: true, from: 9, probs: ['hoof', 'thorn', 'cut', 'shot'] },
  foal: { name: 'foal', names: ['Comet', 'Spindle', 'Dancer', 'Wisp', 'Sparrow', 'Lark', 'Pixie', 'Dash', 'Minnow', 'Jet'], temper: 1.35, hoofed: true, from: 9, probs: ['thorn', 'cut', 'shot', 'mud'] },
  blacksheep: { name: 'black sheep', names: ['Sooty', 'Inky', 'Raven', 'Coal', 'Liquorice', 'Shadow', 'Ebony', 'Pepper', 'Midnight', 'Treacle'], temper: 1.1, hoofed: true, from: 10, probs: ['mud', 'hoof', 'thorn', 'ear'] },
  spottedpig: { name: 'spotted pig', names: ['Domino', 'Splodge', 'Patches', 'Dotty', 'Marble', 'Blot', 'Freckles', 'Pebbles', 'Smudge', 'Speckle'], temper: 1.05, hoofed: true, from: 10, probs: ['shot', 'cut', 'mud', 'ear'] },
  billy: { name: 'billy goat', names: ['Gruff', 'Rufus', 'Capricorn', 'Butch', 'Whisker', 'Old Nick', 'Horatio', 'Zeus', 'Ramsay', 'Clatter'], temper: 1.3, hoofed: true, from: 11, probs: ['hoof', 'ear', 'thorn', 'shot', 'cut'] },
  highland: { name: 'highland cow', names: ['Heather', 'Morag', 'Fiona', 'Isla', 'Hamish', 'Shona', 'Bonnie', 'Thistle', 'Kirsty', 'Flora'], temper: 1.1, hoofed: true, from: 12, probs: ['hoof', 'thorn', 'cut', 'shot', 'mud'] },
  carthorse: { name: 'carthorse', names: ['Samson', 'Goliath', 'Boxer', 'Clyde', 'Dobbin', 'Prince', 'Sergeant', 'Old Tom', 'Bertha', 'Punch'], temper: 1.0, hoofed: true, from: 13, probs: ['hoof', 'thorn', 'cut', 'shot', 'mud'] },
  alpaca: { name: 'alpaca', names: ['Pablo', 'Inca', 'Fuzz', 'Llama Bean', 'Cusco', 'Noodle', 'Paddington', 'Mocha', 'Tumble', 'Chai'], temper: 1.3, hoofed: false, from: 14, probs: ['thorn', 'mud', 'shot', 'ear', 'cut'] },
  goat: { name: 'goat', names: ['Billy', 'Nanny', 'Pepper', 'Heidi', 'Gruff', 'Clover', 'Nettle', 'Toffee', 'Mischief', 'Thistle', 'Bandit', 'Whiskers', 'Juno', 'Pebble'], temper: 1.15, hoofed: true, from: 4, probs: ['hoof', 'ear', 'thorn', 'shot'] },
};
// what each problem looks like on the card, where it can be, and its steps (each step: the tool and how it is used)
const PROBS = {
  thorn: { card: 'Limping', name: 'a thorn', spots: ['front', 'hind'], steps: ['tweezers'], from: 1 },
  hoof: { card: 'Limping', name: 'an overgrown hoof', spots: ['front', 'hind'], steps: ['rasp'], from: 2, hoofed: true },
  mud: { card: 'Filthy', name: 'caked mud', spots: ['flank', 'back'], steps: ['brush'], from: 2 },
  cut: { card: 'Scratched', name: 'a cut', spots: ['front', 'hind'], steps: ['spray', 'bandage'], from: 3 },
  shot: { card: 'Off her food', name: 'a fever', spots: ['neck'], steps: ['syringe'], from: 3 },
  ear: { card: 'Shaking her head', name: 'a sore ear', spots: ['ear'], steps: ['drops'], from: 4 },
};
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
// the same trouble shows itself in many ways: what the card says (the treatment is the same; the card is the farmer's word for it, the animal shows the rest)
const SIGNS = {
  thorn: ['Limping', 'Holding a foot up', 'Hopping on three legs', 'Licking at a foot', 'Will not put a foot down', 'Came in hobbling'],
  hoof: ['Limping', 'Hooves clicking', 'Walking on tiptoe', 'Standing oddly', 'Slow to walk', 'Rocking back on her heels'],
  mud: ['Filthy', 'Rolled in something', 'Caked in mud', 'Coat all matted', 'Came through the ditch', 'Stuck in the bog all night'],
  cut: ['Scratched', 'Caught on the wire', 'Bleeding a little', 'A nasty graze', 'Nipped by another', 'Went through the hedge'],
  shot: ['Off her food', 'Running a fever', 'Dull and listless', 'Shivering', 'Needs her jab', 'Coughing since Sunday'],
  ear: ['Shaking her head', 'Scratching an ear', 'One ear drooping', 'Head on one side', 'Ear hot and red', 'Flinches when her ear is touched'],
};
const TOOLS = ['hand', 'tweezers', 'rasp', 'spray', 'bandage', 'syringe', 'brush', 'drops'];
const TOOLNAME = { hand: 'Hand', tweezers: 'Tweezers', rasp: 'Hoof rasp', spray: 'Clean spray', bandage: 'Bandage', syringe: 'Injection', brush: 'Brush', drops: 'Ear drops' };
const SPOTS = ['front', 'hind', 'neck', 'flank', 'back', 'ear'];
const WEATHERS = ['golden', 'rain', 'morning', 'overcast', 'sunset', 'mist', 'noon', 'storm', 'dawn', 'dusk'];
function weatherOf(N) { if (N <= 3) return ['morning', 'golden', 'noon'][N - 1]; const R = rng(N * 4421 + 3); R(); return WEATHERS[(R() * WEATHERS.length) | 0]; }

function makeCfg(N, help) {
  const f = curve(N), e = easyOf(N), boss = N % 10 === 0, x = (a, b, s) => a + (b - a) * (1 - Math.exp(-f / s)), slow = help ? 1.25 : 1;
  return { N, f, e, boss, help: !!help, lives: 3,
    patients: N <= 2 ? 2 : Math.round(x(3, 5, 30)) + (boss ? 1 : 0),
    probsMax: N <= 4 ? 1 : 2,
    arrive: x(0.15, 0.6, 30),      // (23 Nov 2026: one bolt now ends the round, so a little less fear far on)                                  // how frightened she is when she comes in
    drift: N <= 3 ? 0 : x(0, 0.055, 30) / slow,                  // fear rising by itself while it hurts (a second)
    still: 0.72,                                                // above this she will not hold still
    pullMax: x(1.6, 0.8, 30) * slow * 1.5,      // 23 Nov 2026: a normal pull must never count as a yank                           // fastest a thorn may come out (lengths a second)
    raspTol: x(0.09, 0.035, 30) * slow,                          // how far past the line is still fine
    wrapMin: x(0.35, 0.9, 30) / slow, wraps: N <= 3 ? 2 : 3,    // seconds a turn of bandage must take at least
    spray: 1.1,                                                 // seconds of spray to clean a cut
    shot: x(1.6, 2.6, 30), tele: x(0.75, 0.45, 30) * slow, twitch: [x(2.6, 1.3, 30), x(4.5, 2.6, 30)],
    brushes: N <= 3 ? 3 : Math.round(x(3, 6, 30)),
    drops: 3, shake: [x(2.8, 1.2, 30), x(5, 2.4, 30)], shakeT: 0.8,
    rough: 0.22, poke: 0.12, calm: 0.11 };
}
function newGame(N, o = {}) {
  const cfg = makeCfg(N, o.help), seed = o.seed != null ? o.seed : (Math.random() * 1e9) | 0;
  const G = { N, cfg, seed, rnd: rng(seed), t: 0, over: null, res: null, ev: [], teach: !!o.teach, taught: o.taught | 0, lesson: null,
    weather: weatherOf(N), pt: null, tool: 'hand', hold: null, seen: 0, treated: 0, lost: 0, lives: cfg.lives, roughs: 0, streak: 0, bestStreak: 0, wait: 1.2 };
  if (G.teach && LESSONS[N] && G.taught < N) lessonStart(G);
  return G;
}
// a new patient: which animal, what is wrong and where
function newPatient(G, only) {
  const c = G.cfg, R = G.rnd, L = lessonNow(G);
  const kinds = only ? [only] : null;
  let animals = Object.keys(ANIMALS).filter(a => ANIMALS[a].from <= Math.max(G.N, 1));
  if (kinds) animals = animals.filter(a => ANIMALS[a].probs.includes(kinds[0]));
  if (L && L.animal) animals = [L.animal];
  const a = L || kinds ? pick(R, animals) : dealIf('animal', Object.keys(ANIMALS), q => animals.includes(q), R), A = ANIMALS[a];      /* outside a lesson: from the deck, so every animal he has met comes round before one comes twice */
  const pool = A.probs.filter(p => PROBS[p].from <= Math.max(G.N, 1) && (!PROBS[p].hoofed || A.hoofed));
  const want = kinds ? 1 : Math.max(1, Math.min(c.probsMax, 1 + Math.floor(R() * c.probsMax + (G.N > 20 ? 0.4 : 0))));
  const probs = [], used = new Set();
  for (let tries = 0; probs.length < want && tries < 40; tries++) {
    const kind = kinds ? kinds[0] : pick(R, pool), P = PROBS[kind], spot = pick(R, P.spots.filter(s => !used.has(s)));
    if (!spot || probs.some(p => p.kind === kind)) continue; used.add(spot);
    probs.push({ kind, sign: L || (typeof HEADLESS !== 'undefined' && HEADLESS) ? 0 : deal('sign.' + kind, SIGNS[kind].length, R),      /* (the robots' games take no dice for it: their games stay as they were measured) */ spot, step: 0, prog: 0, len: kind === 'hoof' ? 0.75 + R() * 0.25 : 0, done: false, sore: false });
  }
  const face = R() < 0.5 ? 1 : -1;
  G.pt = { animal: a, name: L ? pick(R, A.names) : A.names[deal('name.' + a, A.names.length, R)], face, probs, stress: L && L.nervous != null ? L.nervous : L ? 0.15 : Math.min(0.6, c.arrive * (0.85 + R() * 0.3) * A.temper), phase: 'in', pt: 0, rough: 0, lastStroke: -9,
    twitchAt: 0, tele: false, shakeAt: 0, shaking: 0, id: ++G.seen };
  schedule(G); G.tool = 'hand'; G.hold = null; G.focus = null;
  G.ev.push({ k: 'arrive', animal: a, name: G.pt.name });
}
function schedule(G) { const c = G.cfg, p = G.pt, R = G.rnd; p.twitchAt = G.t + 1.2 + c.twitch[0] + R() * (c.twitch[1] - c.twitch[0]); p.shakeAt = G.t + 1 + c.shake[0] + R() * (c.shake[1] - c.shake[0]); }
const busy = G => !G.pt || G.pt.phase !== 'treat';
const nowStep = pr => PROBS[pr.kind].steps[pr.step];
const probAt = (G, spot) => G.pt && G.pt.probs.find(q => !q.done && q.spot === spot);
// ---------- what the thumb does ----------
function pickTool(G, t) { if (G.over || !TOOLS.includes(t) || G.tool === t) return; endHold(G); G.tool = t; if (t === 'hand') G.focus = null; G.ev.push({ k: 'tool', t }); }
// a stroke of the hand along her body; v is how fast (body lengths a second)
function stroke(G, v) {
  const p = G.pt; if (G.over || busy(G) || G.tool !== 'hand') return; const c = G.cfg, A = ANIMALS[p.animal];
  if (v > 1.6) { fright(G, 0.08, 'startle'); return; }
  if (v < 0.22) return;      // too slow to be a stroke: just a hand resting
  if (v > 1.15) return;      // brisk: does nothing either way
  const hurried = G.t - p.lastStroke < 0.55; p.lastStroke = G.t;
  const d = (hurried ? 0.3 : 1) * c.calm / A.temper; p.stress = Math.max(0, p.stress - d); G.ev.push({ k: 'calm', d, stress: p.stress }); lessonSee(G, 'calm');
}
// frightening her: rough handling, a wrong tool, a yank
function fright(G, amt, why, rough) {
  const p = G.pt; if (!p) return; const A = ANIMALS[p.animal], L = G.lesson;
  p.stress += amt * A.temper * (L ? 0.5 : 1); if (rough) { p.rough++; G.roughs++; G.streak = 0; }
  G.ev.push({ k: 'fright', why, stress: p.stress }); if (L) lessonMiss(G, why);
  if (p.stress >= 1) bolt(G);
}
function bolt(G) {
  const p = G.pt; endHold(G);
  if (G.lesson) { p.stress = 0.35; G.ev.push({ k: 'settle' }); return; }      // in a lesson she never runs off
  p.phase = 'out'; p.pt = 0; p.bolted = true; G.lost++; G.lives = 0; G.streak = 0; G.ev.push({ k: 'bolt', animal: p.animal, name: p.name });
  finish(G, false, 'nervous');      // 23 Nov 2026, his note: "If the animal becomes too nervous, immediately end the round and display: You failed. You made the animal too nervous. Offer a retry button"
}
// a tool put down on a spot (spot null: on nothing that matters). Returns the problem it started on, or null.
function touch(G, spot) {
  const p = G.pt; if (G.over || busy(G) || G.tool === 'hand' || G.hold) return null; const c = G.cfg;
  if (!spot) return null;
      // (23 Nov 2026: a nervous animal no longer ignores the tool: tools always register; too nervous and the round ends)
  const pr = probAt(G, spot);
  if (!pr) { fright(G, c.poke, 'nothing', true); return null; }
  if (nowStep(pr) !== G.tool) { fright(G, c.rough, 'wrongtool', true); G.ev.push({ k: 'wrongtool', want: nowStep(pr), spot }); return null; }
  G.focus = spot;
  if (G.tool === 'tweezers') G.hold = { kind: 'pull', pr, spot, d: 0 };
  else if (G.tool === 'syringe') { G.hold = { kind: 'press', pr, spot }; G.ev.push({ k: 'needle' }); }
  else if (G.tool === 'spray') { G.hold = { kind: 'spray', pr, spot }; G.ev.push({ k: 'sprayon' }); }
  else G.hold = { kind: 'gesture', pr, spot, t0: G.t };
  return pr;
}
function endHold(G) { if (G.hold) { if (G.hold.kind === 'spray') G.ev.push({ k: 'sprayoff' }); if (G.hold.kind === 'press') G.ev.push({ k: 'needleout' }); } G.hold = null; }
function lift(G) { endHold(G); }
// tweezers: pull the thorn out by dist (thorn lengths) over dt seconds
function pull(G, dist, dt) {
  const h = G.hold; if (G.over || !h || h.kind !== 'pull' || dist <= 0) return; const c = G.cfg, pr = h.pr;
  if (dist / Math.max(dt, 1e-3) > c.pullMax) { pr.prog = Math.max(0, pr.prog - 0.25); endHold(G); fright(G, 0.2, 'yank'); G.ev.push({ k: 'yank' }); return; }
  pr.prog += dist; G.ev.push({ k: 'pulling', prog: pr.prog });
  if (pr.prog >= 1) { endHold(G); stepDone(G, pr); }
}
// rasp: one stroke along the hoof taking amt off (a long stroke takes more)
function rasp(G, amt) {
  const h = G.hold; if (G.over || !h || h.kind !== 'gesture' || G.tool !== 'rasp') return; const c = G.cfg, pr = h.pr;
  pr.len -= amt; G.ev.push({ k: 'rasp', len: pr.len });
  if (pr.len < -c.raspTol) { pr.sore = true; endHold(G); fright(G, 0.3, 'tooshort', true); if (!G.over && !(G.pt.phase === 'out')) stepDone(G, pr); return; }
  if (pr.len <= c.raspTol) { endHold(G); stepDone(G, pr); }
}
// bandage: one turn round the leg, taking secs
function wrap(G, secs) {
  const h = G.hold; if (G.over || !h || h.kind !== 'gesture' || G.tool !== 'bandage') return; const c = G.cfg, pr = h.pr;
  if (secs < c.wrapMin) { fright(G, 0.1, 'tight'); return; }
  pr.prog += 1 / c.wraps; G.ev.push({ k: 'wrap', n: Math.round(pr.prog * c.wraps) });
  if (pr.prog >= 0.999) { endHold(G); stepDone(G, pr); }
}
// brush: one stroke, with the hair (+1) or against it (-1)
function brush(G, dir) {
  const h = G.hold; if (G.over || !h || h.kind !== 'gesture' || G.tool !== 'brush') return; const c = G.cfg, pr = h.pr;
  if (dir < 0) { fright(G, 0.1, 'against'); return; }
  pr.prog += 1 / c.brushes; G.ev.push({ k: 'brush', n: Math.round(pr.prog * c.brushes) });
  if (pr.prog >= 0.999) { endHold(G); stepDone(G, pr); }
}
// ear drops: one drop (the bottle is already at the ear)
function drop(G) {
  const h = G.hold; if (G.over || !h || h.kind !== 'gesture' || G.tool !== 'drops') return; const c = G.cfg, pr = h.pr, p = G.pt;
  if (p.shaking > 0) { fright(G, 0.08, 'shaking'); G.ev.push({ k: 'dropmiss' }); return; }
  pr.prog += 1 / c.drops; G.ev.push({ k: 'drop', n: Math.round(pr.prog * c.drops) });
  if (pr.prog >= 0.999) { endHold(G); stepDone(G, pr); }
}
function stepDone(G, pr) {
  pr.step++; pr.prog = 0; G.ev.push({ k: 'stepdone', kind: pr.kind, spot: pr.spot, sore: pr.sore });
  if (pr.step >= PROBS[pr.kind].steps.length) { pr.done = true; G.focus = null; G.ev.push({ k: 'fixed', kind: pr.kind }); lessonSee(G, 'fixed', pr.kind); }
  else if (pr.kind === 'cut') lessonSee(G, 'sprayed');
  const p = G.pt; if (!p || p.phase !== 'treat') return;
  if (p.probs.every(q => q.done)) { p.phase = 'out'; p.pt = 0; endHold(G); G.treated++; if (!p.rough) { G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); }
    p.stress = Math.max(0, p.stress - 0.4); G.ev.push({ k: 'better', animal: p.animal, name: p.name, gentle: !p.rough, n: G.streak }); lessonSee(G, 'better'); }
}
// ---------- every frame ----------
function step(G, dt) {
  if (G.over) return; G.t += dt; const c = G.cfg, L = lessonNow(G);
  if (!G.pt) { G.wait -= dt; if (G.wait <= 0) { if (L) newPatient(G, L.prob); else if (G.seen < c.patients) newPatient(G); } return; }
  const p = G.pt; p.pt += dt;
  if (p.phase === 'in') { if (p.pt >= 1.6) { p.phase = 'treat'; p.pt = 0; schedule(G); G.ev.push({ k: 'ready' }); } return; }
  if (p.phase === 'out') { if (p.pt >= (p.bolted ? 1.2 : 1.8)) { G.pt = null; G.focus = null; G.wait = 0.6; if (!G.lesson && G.seen >= c.patients && !G.over) finish(G, G.lives > 0); } return; }
  // her fear: it rises by itself while it hurts
  const left = p.probs.filter(q => !q.done).length, A = ANIMALS[p.animal];
  if (!L) p.stress = Math.min(1.2, p.stress + c.drift * A.temper * (0.6 + 0.4 * left) * dt);
  if (p.stress >= 1) { bolt(G); return; }
  // continuous tools
  const h = G.hold;
  if (h && h.kind === 'spray') { h.pr.prog += dt / c.spray; if (h.pr.prog >= 1) { endHold(G); stepDone(G, h.pr); } }
  if (h && h.kind === 'press') { h.pr.prog += dt / c.shot; if (h.pr.prog >= 1) { G.ev.push({ k: 'needleout' }); G.hold = null; stepDone(G, h.pr); } }
  // the shiver (only matters with the needle in): a warning first, then the twitch
  const needle = p.probs.some(q => !q.done && nowStep(q) === 'syringe');
  if (needle) {
    if (!p.tele && G.t >= p.twitchAt - c.tele) { p.tele = true; G.ev.push({ k: 'tele' }); }
    if (G.t >= p.twitchAt) { p.tele = false; G.ev.push({ k: 'twitch' }); const H = G.hold;
      if (H && H.kind === 'press') { H.pr.prog = Math.max(0, H.pr.prog - 0.35); G.hold = null; G.ev.push({ k: 'needleout' }); fright(G, 0.25, 'twitched', true); }
      const R = G.rnd; p.twitchAt = G.t + c.twitch[0] + R() * (c.twitch[1] - c.twitch[0]); }
  }
  // the head shake (only matters for ear drops)
  if (p.shaking > 0) p.shaking -= dt;
  if (p.probs.some(q => !q.done && q.kind === 'ear') && G.t >= p.shakeAt) { p.shaking = c.shakeT; G.ev.push({ k: 'shake' }); const R = G.rnd; p.shakeAt = G.t + c.shakeT + c.shake[0] + R() * (c.shake[1] - c.shake[0]); }
}
function finish(G, win, why) {
  G.over = win ? 'won' : 'lost'; endHold(G);
  G.res = { win, why, stars: win ? (G.lost === 0 && G.roughs <= 1 ? 3 : G.lost === 0 ? 2 : 1) : 0, treated: G.treated, patients: G.cfg.patients, lost: G.lost, roughs: G.roughs, combo: G.bestStreak, time: G.t };
  G.ev.push({ k: win ? 'won' : 'lost', why });
}
// ---------- LESSONS ----------
const LESSONS = {
  1: [{ id: 'calm', title: 'CALM HER FIRST', say: G => vetCue(G)[0], do: G => vetCue(G)[1], at: G => vetCue(G)[2], how: 'With your hand, stroke slowly along her back. Slow, gentle strokes: three of them.', need: 3, ok: w => w === 'calm', prob: 'thorn', animal: 'dog', nervous: 0.6 },
      { id: 'thorn', title: 'THE THORN', say: G => vetCue(G)[0], do: G => vetCue(G)[1], at: G => vetCue(G)[2], how: 'She is limping: find the thorn in her paw. Pick the tweezers, put them on it, then pull away slowly.', need: 1, ok: (w, k2) => w === 'fixed' && k2 === 'thorn', prob: 'thorn', animal: 'dog' }],
  2: [{ id: 'hoof', title: 'TRIM THE HOOF', say: G => vetCue(G)[0], do: G => vetCue(G)[1], at: G => vetCue(G)[2], how: 'One hoof is too long. Pick the rasp and stroke along the hoof down to the line. Short strokes near the end.', need: 1, ok: (w, k2) => w === 'fixed' && k2 === 'hoof', prob: 'hoof', animal: 'cow' },
      { id: 'mud', title: 'BRUSH WITH THE HAIR', say: G => vetCue(G)[0], do: G => vetCue(G)[1], at: G => vetCue(G)[2], how: 'Pick the brush. Stroke the mud off the way the hair lies: from her head towards her tail.', need: 1, ok: (w, k2) => w === 'fixed' && k2 === 'mud', prob: 'mud', animal: 'sheep' }],
  3: [{ id: 'cut', title: 'CLEAN AND WRAP', say: G => vetCue(G)[0], do: G => vetCue(G)[1], at: G => vetCue(G)[2], how: 'Hold the spray on the cut until it is clean. Then the bandage: circle round the leg, slowly.', need: 1, ok: (w, k2) => w === 'fixed' && k2 === 'cut', prob: 'cut', animal: 'horse' },
      { id: 'shot', title: 'THE INJECTION', say: G => vetCue(G)[0], do: G => vetCue(G)[1], at: G => vetCue(G)[2], how: 'Hold the needle on her neck. When she starts to shiver, lift off at once, then hold it in again.', need: 1, ok: (w, k2) => w === 'fixed' && k2 === 'shot', prob: 'shot', animal: 'pig' }],
};
function lessonStart(G) { G.lesson = { steps: LESSONS[G.N], i: 0, n: 0, miss: 0 }; G.ev.push({ k: 'lessonnext', first: true }); }
const lessonNow = G => G.lesson && G.lesson.steps[G.lesson.i];
function lessonSee(G, what, arg) {
  const D = G.lesson; if (!D) return; const st = D.steps[D.i]; if (!st.ok(what, arg)) return;
  D.n++; if (D.n < st.need) { G.ev.push({ k: 'lessonok', n: D.n, need: st.need }); return; }
  D.i++; D.n = 0; D.miss = 0;
  const p = G.pt, nxt = D.steps[D.i];
  if (D.i >= D.steps.length) { G.lesson = null; G.ev.push({ k: 'lessondone', N: G.N }); Object.assign(G, { seen: 0, treated: 0, lost: 0, roughs: 0, lives: G.cfg.lives, streak: 0, bestStreak: 0 }); if (p && p.phase === 'treat') { p.phase = 'out'; p.pt = 0; } if (p) p.lessonEnd = true; }
  else { G.ev.push({ k: 'lessonnext' }); if (p && nxt.prob === st.prob && nxt.animal === st.animal && p.phase === 'treat') { /* the same animal goes on to the next part */ } }
}
function lessonMiss(G, why) { const D = G.lesson; if (!D) return; D.miss++; G.ev.push({ k: 'lessonmiss', why, how: D.steps[D.i].how }); }

// ---------- for the robots ----------
// BLIND: things a thumb can do without looking: a gentle stroke, pick a tool from the tray (any), put the tool on a part of her
// (any), pull away gently, a rasp stroke, a turn of bandage, a brush stroke (either way), a drop, lift off.
const rs = () => SPOTS[(Math.random() * (SPOTS.length + 2)) | 0] || null;
const BLIND = {
  k: G => stroke(G, 0.6), u: G => pickTool(G, TOOLS[(Math.random() * TOOLS.length) | 0]), g: G => { if (!G.hold) touch(G, rs()); },
  p: G => { if (!G.hold) touch(G, rs()); pull(G, 0.35, 0.5); }, r: G => { if (!G.hold) touch(G, rs()); rasp(G, 0.06 + Math.random() * 0.2); },
  w: G => { if (!G.hold) touch(G, rs()); wrap(G, 1); }, b: G => { if (!G.hold) touch(G, rs()); brush(G, Math.random() < 0.5 ? 1 : -1); },
  d: G => { if (!G.hold) touch(G, rs()); drop(G); }, l: G => lift(G),
};
// a person who looks: o.react seconds to see and act, o.acc how often the thumb lands where it meant to
// THE TUTORIAL SHOWS THE ONE MOVE TO MAKE NOW, ON THE ANIMAL (26 Nov 2026, his words: "it tells me to swipe. I swipe up and then nothing happens").
// It said TWEEZERS, PULL SLOWLY or SPRAY, THEN WRAP (two things) with a hand sliding in a box, nowhere near the paw. Now the robot is asked
// (dryPlanAll): TAP THE TWEEZERS (the hand on it in the tray), STROKE SLOWLY head to tail along her, then on the very spot: PULL IT OUT SLOWLY,
// RASP DOWN, BRUSH HEAD TO TAIL, HOLD THE SPRAY ON IT, CIRCLE ROUND, HOLD THE NEEDLE IN / LIFT OFF! as she shivers, TAP A DROP.
const VTC = { t: -1e9, v: null };
function vetCue(G) { const p = G.pt; if (G.over || G.wait > 0 || !p || p.phase !== 'treat') return ['WAIT…', 'wait', false]; const now = performance.now(); if (now - VTC.t < 150) return VTC.v; VTC.t = now;
  const all = dryPlanAll(G, null, { next: -1 }), q = all.filter(z => z[0] !== 'endHold').pop(), h = G.hold, want = p.probs.find(z => !z.done), tr = trayRect(), trayAt = t => [tr.x + (TOOLS.indexOf(t) + 0.5) * tr.w / TOOLS.length, tr.y + tr.h / 2];
  const sp = h ? spotScreen(h.spot) : want ? spotScreen(want.spot) : { x: W / 2, y: H / 2 }, [hd, tl] = headTail(), gx = tl.x - hd.x, gy = tl.y - hd.y, gl = Math.hypot(gx, gy) || 1; let v;
  if (h && h.kind === 'press') v = q && q[0] === 'lift' ? ['LIFT OFF!', 'release', [sp.x, sp.y]] : ['HOLD THE NEEDLE IN', 'hold', [sp.x, sp.y]];
  else if (h && h.kind === 'spray') v = ['HOLD THE SPRAY ON IT', 'hold', [sp.x, sp.y]];
  else if (!q) v = ['WAIT…', 'wait', false];
  else if (q[0] === 'pickTool') v = ['TAP THE ' + String(q[1]).toUpperCase(), 'tap', trayAt(q[1])];
  else if (q[0] === 'stroke') v = ['STROKE SLOWLY', 'drag', [hd.x + gx * 0.15, hd.y + gy * 0.15, hd.x + gx * 0.85, hd.y + gy * 0.85]];
  else { const t = G.tool, L = 70 * k;
    if (t === 'tweezers') { const ox = (sp.x - W / 2) || 1, oy = (sp.y - H / 2) || 1, om = Math.hypot(ox, oy); v = ['PULL IT OUT SLOWLY', 'drag', [sp.x, sp.y, sp.x + ox / om * L, sp.y + oy / om * L]]; }
    else if (t === 'rasp') v = ['RASP DOWN', 'drag', [sp.x, sp.y - L * 0.5, sp.x, sp.y + L * 0.5]];
    else if (t === 'brush') v = ['BRUSH HEAD TO TAIL', 'drag', [sp.x - gx / gl * L * 0.5, sp.y - gy / gl * L * 0.5, sp.x + gx / gl * L * 0.5, sp.y + gy / gl * L * 0.5]];
    else if (t === 'bandage') v = ['CIRCLE ROUND', 'drag', [sp.x + L * 0.5, sp.y, sp.x, sp.y + L * 0.5]];
    else if (t === 'drops') v = ['TAP A DROP', 'tap', [sp.x, sp.y]];
    else v = [t === 'syringe' ? 'HOLD THE NEEDLE IN' : t === 'spray' ? 'HOLD THE SPRAY ON IT' : 'HOLD IT ON HERE', 'hold', [sp.x, sp.y]]; }
  VTC.v = v; return v; }
function honest(G, o, mem) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc, c = G.cfg, p = G.pt, L = lessonNow(G);
  if (!p || p.phase !== 'treat') { mem.next = G.t + react; mem.pressAt = null; return; }
  const h = G.hold;
  // holding the needle: watch for the shiver, lift off in time
  if (h && h.kind === 'press') { if (p.tele) { mem.seenTele = mem.seenTele || G.t; if (G.t - mem.seenTele >= react * (0.6 + Math.random() * 0.8)) { ACT.lift(G); mem.seenTele = null; mem.next = G.t + react; } } else mem.seenTele = null; return; }
  if (h && h.kind === 'spray') return;      // keep the spray on until it is clean
  if (h && h.kind === 'pull') { if (!mem.pullV) mem.pullV = c.pullMax * (Math.random() < acc ? 0.5 + Math.random() * 0.4 : 1.05 + Math.random() * 0.3); ACT.pull(G, mem.pullV / 60, 1 / 60); return; }
  mem.pullV = 0;
  if (G.t < (mem.next || 0)) return;
  const pace = 0.5 + react * 1.2;
  // frightened: stroke her first (a slow stroke takes most of a second)
  const want = p.probs.find(q => !q.done), lessonCalm = L && L.id === 'calm';
  if (p.stress > c.still - 0.12 || lessonCalm || (p.stress > 0.45 && Math.random() < 0.15)) {
    if (G.tool !== 'hand') { ACT.endHold(G); ACT.pickTool(G, 'hand'); mem.next = G.t + react; return; }
    ACT.stroke(G, Math.random() < acc ? 0.4 + Math.random() * 0.6 : 1.3 + Math.random() * 0.6); mem.next = G.t + 0.75 + react; return; }
  if (!want) return;
  const tool = nowStep(want);
  if (G.tool !== tool) { ACT.endHold(G); ACT.pickTool(G, Math.random() < acc + 0.08 ? tool : TOOLS[1 + ((Math.random() * 7) | 0)]); mem.next = G.t + react * 0.8; return; }
  if (!h) { // put the tool on it (a miss lands on nothing, now and then on the wrong part)
    const r = Math.random(), spot = r < acc ? want.spot : r < acc + (1 - acc) * 0.8 ? null : pick(Math.random, SPOTS);
    if (tool === 'syringe') { if (p.tele || G.t < (mem.waitTwitch || 0)) return; }
    if (tool === 'drops' && p.shaking > 0) return;
    ACT.touch(G, spot); mem.next = G.t + react * 0.5; return; }
  // gestures
  if (tool === 'rasp') { const left = want.len; ACT.rasp(G, left > 0.32 ? 0.16 + Math.random() * 0.1 : Math.max(0.02, left * (Math.random() < acc ? 0.85 + Math.random() * 0.2 : 1.4 + Math.random() * 0.6) + 0.01)); mem.next = G.t + pace * 0.6; return; }
  if (tool === 'bandage') { ACT.wrap(G, c.wrapMin * (Math.random() < acc ? 1.15 + Math.random() * 0.6 : 0.6 + Math.random() * 0.3)); mem.next = G.t + c.wrapMin * 1.4; return; }
  if (tool === 'brush') { ACT.brush(G, Math.random() < acc + 0.08 ? 1 : -1); mem.next = G.t + pace * 0.8; return; }
  if (tool === 'drops') { if (p.shaking > 0) return; mem.dropAt = mem.dropAt || G.t + react * 0.7; if (G.t >= mem.dropAt) { ACT.drop(G); mem.dropAt = null; mem.next = G.t + 0.35 + react * 0.5; } return; }
}
function winNow(G) { if (!G || G.over || (G.pt && G.pt.phase === 'out')) return; G.lesson = null; G.seen = Math.max(G.seen, G.cfg.patients); G.lives = G.cfg.lives; if (!G.pt) newPatient(G); const p = G.pt; p.phase = 'treat';
  p.probs.forEach((q, i) => { if (i) { q.done = true; q.step = PROBS[q.kind].steps.length; } else { q.done = false; q.step = PROBS[q.kind].steps.length - 1; } }); stepDone(G, p.probs[0]); }

// what the robot would do now, without doing it (tools/dry_plan.py): the tutorial shows this move
const ACT_REAL = { pickTool, endHold, stroke, touch, lift, pull, rasp, wrap, brush, drop }; let ACT = ACT_REAL;
function dryPlan(G, o, mem) { let got = null; const rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { if (!got && !(a.length > 2 && a.slice(1).every(v => v === 0 || v === false))) got = [n, ...a.slice(1)]; return true; };      /* (a stick at rest, all its numbers 0, is not a move; a first bed, number 0, is) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return got; }
function dryPlanAll(G, o, mem) { const all = [], rec = {}; for (const n in ACT_REAL) rec[n] = (...a) => { all.push([n, ...a.slice(1)]); return true; };      /* every call, in order (for a robot that steers and drifts at once) */
  const sr = Math.random; ACT = rec; Math.random = () => 0.5; try { honest(G, Object.assign({ acc: 1, react: 0 }, o || {}), mem || {}); } catch (e) {} finally { ACT = ACT_REAL; Math.random = sr; } return all; }
