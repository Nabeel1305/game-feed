
// ---------- sounds: hooves, a whip that cracks on the beat, bronze trumpets, a lyre for the wreath ----------
function sweep(dur, f0, f1, vol, q = 1, when = 0, type = 'bandpass') {   // a filtered noise whoosh that glides
  if (!actx || MUTE) return;
  try {
    const t = actx.currentTime + when, s = actx.createBufferSource(); s.buffer = nbuf(dur);
    const f = actx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = actx.createGain(); env(g, t, vol, dur, Math.min(0.1, dur * 0.3)); s.connect(f); f.connect(g); g.connect(BUS); s.start(t);
  } catch (e) {}
}
let LOOPS = null;
function ensureLoops() {
  if (LOOPS || !actx || MUTE) return;
  LOOPS = { rumble: bed(170, 0.7, 0.0001, 7, 'lowpass'), wind: bed(1300, 0.5, 0.0001, 0.4), crowd: bed(900, 0.45, 0.02, 0.13), skid: bed(2300, 0.9, 0.0001, 17), scrape: bed(3400, 3, 0.0001, 37) };
}
function loopsOff() { if (LOOPS) for (const key in LOOPS) LOOPS[key] && LOOPS[key].set(0, 0.08); }
const horn = (f, d, v, w) => { tone(f, d + 0.1, v, 'sawtooth', w, null, 2300); tone(f, d + 0.12, v * 0.55, 'triangle', w, null, 5000); };   // the salpinx, a bronze trumpet
const sfx = {
  hoof(acc) { const v = vary(0.12); noise(0.065, (acc ? 150 : 215) * v, acc ? 0.3 : 0.17, 'lowpass', 1.2); if (acc) tone(72 * v, 0.08, 0.09, 'sine', 0, 46); },
  whip(q, chain) {                    // q: 2 on the beat, 1 near it, 0 off it
    sweep(0.05, 900, 3000, 0.13, 1.4);
    if (q === 2) { noise(0.013, 5400, 0.55, 'highpass', 1, 0.035); tone(2000 * vary(0.03), 0.05, 0.05, 'triangle', 0.035, 1400, 6000); const f = note(523, Math.min(chain || 0, 12)); tone(f, 0.3, 0.085, 'triangle', 0.045, null, 6000); tone(f * 2, 0.2, 0.025, 'sine', 0.06); }
    else if (q === 1) { noise(0.013, 4600, 0.4, 'highpass', 1, 0.035); tone(1650 * vary(0.04), 0.045, 0.035, 'triangle', 0.035, 1150, 5000); }
    else { noise(0.05, 850, 0.3, 'lowpass', 1, 0.035); tone(250 * vary(), 0.17, 0.05, 'sawtooth', 0.05, 165, 700); }
  },
  blown() { tone(300, 0.5, 0.06, 'sawtooth', 0, 150, 600); noise(0.5, 1200, 0.16, 'bandpass', 1, 0, 0.05); },      // a spent snort
  spent() { if (gate('spent', 400)) noise(0.12, 900, 0.14, 'bandpass', 1.5, 0, 0.02); },
  lift() { if (!gate('lift', 500)) return; tone(330 * vary(0.05), 0.3, 0.05, 'sawtooth', 0, 250, 1100); noise(0.2, 2600, 0.12, 'bandpass', 3, 0, 0.03); },   // the axle groans
  rein() { if (!gate('rein', 600)) return; tone(190 * vary(), 0.22, 0.035, 'sawtooth', 0, 150, 520); noise(0.25, 1800, 0.1, 'bandpass', 1, 0, 0.04); },
  clash() { if (!gate('clash', 220)) return; const v = vary(); noise(0.012, 4000, 0.3, 'highpass'); noise(0.09, 700 * v, 0.5); tone(185 * v, 0.1, 0.16, 'triangle', 0, 120, 900); },
  wall() { if (!gate('wall', 300)) return; noise(0.02, 5000, 0.35, 'highpass'); noise(0.2, 2800, 0.28, 'bandpass', 2); tone(120, 0.15, 0.2, 'sine', 0, 60); },
  wreck() { noise(0.02, 3500, 0.6, 'highpass'); noise(0.5, 600, 0.95); tone(75, 0.5, 0.45, 'sine', 0, 32); for (let i = 0; i < 6; i++) noise(0.05, 1500 + Math.random() * 2500, 0.3, 'bandpass', 2, 0.06 + i * 0.07 + Math.random() * 0.03); sweep(1.0, 700, 320, 0.2, 0.7, 0.25); duck(0.7, 900); },
  tick(i) { noise(0.012, 3000, 0.15, 'highpass'); horn(note(392, +i || 0), 0.22, 0.08, 0); },
  go() { noise(0.015, 6000, 0.4, 'highpass'); horn(587, 0.6, 0.1, 0); tone(880, 0.6, 0.04, 'triangle', 0, null, 5000); sweep(0.5, 500, 1800, 0.22, 0.7); },
  falseStart() { tone(330, 0.2, 0.07, 'triangle', 0, null, 2000); tone(262, 0.35, 0.07, 'triangle', 0.16, null, 1800); },
  turn(q, chain) { if (q === 3 || q === true) [0, 2, 4].forEach((st, i) => pluck(note(392, st + Math.min(chain || 0, 5)), 0.8, 0.2, i * 0.07)); else if (q === 2) pluck(note(392, 1), 0.6, 0.15); },
  pass(up) { if (up) { tone(note(523, 1), 0.12, 0.07, 'triangle', 0, null, 5000); tone(note(523, 3), 0.2, 0.07, 'triangle', 0.09, null, 5000); } else tone(233, 0.25, 0.045, 'triangle', 0, 208, 1500); },
  lap(final) { noise(0.01, 6000, 0.2, 'highpass'); [1, 2.76, 5.4].forEach((m, j) => tone(520 * m, 1.1 / (1 + j * 0.6), 0.1 / (j + 1), 'sine')); if (final) [0, 2, 4].forEach((st, i) => horn(note(392, st), 0.14, 0.08, 0.3 + i * 0.17)); },
  win(big) {
    const n = big ? [[392, 0, 0.16], [523, 0.16, 0.16], [659, 0.32, 0.16], [784, 0.48, 0.7], [988, 0.48, 0.7]] : [[392, 0, 0.14], [523, 0.14, 0.14], [784, 0.28, 0.5]];
    n.forEach(([f, t, d]) => horn(f, d, 0.085, t));
    [0, 2, 4, 5, 7, 9].slice(0, big ? 6 : 4).forEach((st, i) => pluck(note(262, st), 1.3, 0.22, (big ? 0.55 : 0.35) + i * 0.09));
  },
  place() { [0, 2, 4].forEach((st, i) => pluck(note(330, st), 0.9, 0.2, i * 0.1)); },
  lose() { pluck(294, 0.9, 0.2, 0); pluck(262, 0.9, 0.2, 0.2); pluck(220, 1.2, 0.22, 0.42); },
  best() { [0, 2, 4].forEach((st, i) => tone(note(659, st), 0.22, 0.08, 'sine', i * 0.08)); },
  click() { noise(0.01, 5000, 0.15, 'highpass'); tone(1500 * vary(), 0.04, 0.05, 'triangle', 0, null, 3500); }
};
MUTE = store.get('mute', false);

// ---------- the Greek world: drivers, cities, champions, venues ----------
const NAMES_M = ['Lykos', 'Kallias', 'Damon', 'Nikias', 'Theron', 'Phaidon', 'Leon', 'Kimon', 'Myron', 'Dion', 'Agathon', 'Kleitos', 'Iason', 'Glaukos', 'Philon', 'Zenon', 'Telamon', 'Kreon', 'Timon', 'Lysandros', 'Brasidas', 'Polydoros', 'Eumenes', 'Nikandros', 'Sosias', 'Theokles', 'Aristion', 'Euagoras', 'Pheidon', 'Melas', 'Hipparchos', 'Hippias', 'Philippos', 'Xanthippos', 'Melanippos', 'Leukippos', 'Kallippos', 'Hippomenes', 'Hipponax', 'Aristippos', 'Chrysippos', 'Zeuxippos', 'Hermippos', 'Damasippos', 'Lysippos', 'Archippos', 'Pausanias', 'Kleomenes', 'Alketas', 'Demaratos'];
const NAMES_F = ['Kyniska', 'Euryleonis', 'Berenike', 'Bilistiche', 'Kassia', 'Timareta', 'Zeuxo', 'Aristokleia', 'Theodota', 'Hermione', 'Kleito', 'Arete', 'Gorgo', 'Lampito', 'Myrrine', 'Xanthippe', 'Melanippe', 'Leukippe', 'Nikippe', 'Kallipateira', 'Phile', 'Hipparete'];
const POLEIS = [['Athens', 'Α', '#2b5fa8', '#e8e2d0'], ['Sparta', 'Λ', '#8f1d1a', '#d9b25a'], ['Thebes', 'Θ', '#2e7d4f', '#e8d9a8'], ['Corinth', 'Κ', '#d07a2a', '#3a2a1a'], ['Argos', 'Α', '#6a3d9a', '#e0d0f0'], ['Syracuse', 'Σ', '#1f8a8a', '#f0e6c8'], ['Rhodes', 'Ρ', '#c2185b', '#f7e3a1'], ['Kyrene', 'Κ', '#8a6a2a', '#f3ead7'], ['Thessaly', 'Θ', '#3b4d8f', '#e9c46a'], ['Macedon', 'Μ', '#4a2a6a', '#e9c46a'], ['Crete', 'Κ', '#b5632a', '#f3ead7'], ['Elis', 'Η', '#2f6f8f', '#f3ead7'], ['Delphi', 'Δ', '#7a5a1a', '#f7e3a1'], ['Ephesus', 'Ε', '#356b3a', '#f0e6c8'], ['Miletus', 'Μ', '#1a4a7a', '#f3d9a0'], ['Aegina', 'Α', '#3a7a7a', '#f3ead7'], ['Samos', 'Σ', '#8f2f6f', '#f3ead7'], ['Chios', 'Χ', '#5a7a2a', '#f3ead7'], ['Megara', 'Μ', '#6b4a2a', '#e8d9a8'], ['Sikyon', 'Σ', '#9a5a1a', '#f0e0b0'], ['Messene', 'Μ', '#2a5a4a', '#e9c46a'], ['Pylos', 'Π', '#7a6a3a', '#f3ead7'], ['Ithaca', 'Ι', '#3a5a8a', '#e8e2d0'], ['Mycenae', 'Μ', '#8a5a1a', '#f7e3a1'], ['Akragas', 'Α', '#a8642a', '#f3ead7'], ['Taras', 'Τ', '#2a6a8a', '#f3ead7'], ['Massalia', 'Μ', '#5a3a7a', '#f0e6c8'], ['Byzantion', 'Β', '#7a2a5a', '#e9c46a'], ['Naxos', 'Ν', '#4a6a9a', '#f3ead7'], ['Pella', 'Π', '#6a2a5a', '#e9c46a'], ['Larissa', 'Λ', '#3a6a3a', '#e8d9a8'], ['Chalkis', 'Χ', '#9a6a1a', '#f3ead7'], ['Tegea', 'Τ', '#5a4a8a', '#f3ead7']];
const COATS = ['#6b4226', '#3a2a22', '#8a5a32', '#b9ab95', '#1f1a18', '#a0522d', '#7a4a2a', '#b8946a', '#4a3628', '#8f8478'];   // bay, dark bay, chestnut, grey, black, sorrel, brown, dun, seal, roan
const BOSSES = [
  ['Antilochos', 'the Cunning', 'Α', '#3d6b8c', '#e9d9a6', ['#6b4226', '#6b4226', '#3a2a22', '#8a5a32']],
  ['Eumelos', 'of the Swift Mares', 'Ε', '#5b7a3a', '#f3ead7', ['#b9ab95', '#b9ab95', '#b8946a', '#b9ab95']],
  ['Diomedes', 'Breaker of Horses', 'Δ', '#7a2a2a', '#d9b25a', ['#1f1a18', '#3a2a22', '#1f1a18', '#3a2a22']],
  ['Oinomaos', 'King of Pisa', 'Ο', '#4a2a6a', '#e9c46a', ['#1f1a18', '#1f1a18', '#1f1a18', '#1f1a18']],
  ['Pelops', 'Founder of the Games', 'Π', '#b5892a', '#fff3c4', ['#c8b48c', '#c8b48c', '#c8b48c', '#c8b48c']],
  ['Hippolyte', 'Queen of the Amazons', 'Ι', '#8f2f4f', '#f2c14e', ['#a0522d', '#a0522d', '#8a5a32', '#a0522d']],
  ['Phaethon', 'Son of the Sun', 'Φ', '#e8702a', '#ffe08a', ['#f2a03a', '#f2b24a', '#f2a03a', '#f2b24a']],
  ['Ares', 'God of War', 'Α', '#5a0f0f', '#c0c0c8', ['#17110f', '#17110f', '#17110f', '#17110f']],
  ['Poseidon', 'Lord of Horses', 'Π', '#1f7a8a', '#bff3ee', ['#7fd0c8', '#9fe0d8', '#7fd0c8', '#9fe0d8']],
  ['Helios', 'the Sun Himself', 'Η', '#f2b01e', '#fffbe0', ['#ffd75a', '#ffe58a', '#ffd75a', '#ffe58a']]
];
// each venue: its own sky, far scenery, sand, and its own track (long or short straights, tight or open turns)
const VENUES = [
  { name: 'Olympia', games: 'The Olympic Games', prize: 'the olive wreath of Olympia', sky: ['#2f7fcf', '#8fc8f0', '#e3f1fa'], sun: [0.8, 0.6, '#fffbe6'], far: '#8fa6b5', hill: '#5f8f58', feat: 'temple', sand: ['#dcb984', '#d2ad76', '#ead9b8'], wall: '#ece5d2', Ls: 170, rIn: 4.5, Wt: 22 },
  { name: 'Delphi', games: 'The Pythian Games', prize: 'the laurel wreath of Apollo', sky: ['#3a437c', '#e08a62', '#ffd9a6'], sun: [0.3, 0.14, '#ffe2b0'], far: '#8a6a78', hill: '#6f4f4c', feat: 'cliffs', sand: ['#d9ab7b', '#cf9f6e', '#ecc9a2'], wall: '#ead9c0', Ls: 150, rIn: 4, Wt: 20 },
  { name: 'Isthmia', games: 'The Isthmian Games', prize: 'the pine wreath of Poseidon', sky: ['#1f6fc4', '#7fc4ee', '#dff2fb'], sun: [0.55, 0.7, '#ffffff'], far: '#7f9fb5', hill: '#4f7f5f', feat: 'sea', sand: ['#e3c999', '#dabd8a', '#f0e2c4'], wall: '#f0ebdd', Ls: 185, rIn: 5.5, Wt: 24 },
  { name: 'Nemea', games: 'The Nemean Games', prize: 'the wild-celery wreath of Nemea', sky: ['#4f9ad8', '#a9d6f2', '#eef6e6'], sun: [0.15, 0.45, '#fff6d0'], far: '#93aa9a', hill: '#6f9a55', feat: 'cypress', sand: ['#d6b27c', '#cca66e', '#e6d4ae'], wall: '#e9e1cc', Ls: 160, rIn: 4.5, Wt: 22 },
  { name: 'Athens', games: 'The Panathenaic Games', prize: 'an amphora of sacred olive oil', sky: ['#4a6fb5', '#f0b77a', '#ffe6b8'], sun: [0.62, 0.2, '#fff0c0'], far: '#a08a8a', hill: '#8a7a5a', feat: 'acropolis', sand: ['#ddb680', '#d3aa72', '#f0d9b0'], wall: '#f1e8d4', Ls: 175, rIn: 5, Wt: 22 },
  { name: 'Sparta', games: 'The Games of Sparta', prize: 'a bronze tripod', sky: ['#2a3566', '#8a6a9a', '#f0b89a'], sun: [0.42, 0.08, '#ffd0a8'], far: '#6a6f95', hill: '#4a5a4a', feat: 'peaks', sand: ['#c9a071', '#be9465', '#dcbf9c'], wall: '#ddd3c0', Ls: 165, rIn: 4, Wt: 20 },
  { name: 'Thebes', games: 'The Games of Herakles', prize: 'a bronze tripod', sky: ['#3b86cf', '#9bcdf0', '#eaf3f6'], sun: [0.9, 0.5, '#fffbe6'], far: '#9aa7a0', hill: '#8a9a5a', feat: 'walls', sand: ['#d8b27a', '#cea66c', '#e9d6b0'], wall: '#e6dcc4', Ls: 180, rIn: 5, Wt: 24 },
  { name: 'Syracuse', games: 'The Games of Syracuse', prize: 'a silver cup', sky: ['#356fb8', '#f2c58f', '#ffe9c4'], sun: [0.25, 0.22, '#fff2c8'], far: '#8a8fa5', hill: '#5a7a5a', feat: 'volcano', sand: ['#dbb783', '#d1ab75', '#eed9b4'], wall: '#eee6d2', Ls: 170, rIn: 4.5, Wt: 22 },
  { name: 'Rhodes', games: 'The Games of Helios', prize: 'a crown of white poplar', sky: ['#1a66c0', '#74bdea', '#d9f0fb'], sun: [0.48, 0.75, '#ffffff'], far: '#80a0b8', hill: '#5a8a6a', feat: 'colossus', sand: ['#e6cfa0', '#ddc391', '#f2e6c8'], wall: '#f4efe2', Ls: 190, rIn: 6, Wt: 24 },
  { name: 'Alexandria', games: 'The Races of the Lageion', prize: 'a golden crown', sky: ['#4a3a78', '#e8825a', '#ffcf8f'], sun: [0.7, 0.1, '#ffe0a0'], far: '#9a7a70', hill: '#a88a5a', feat: 'pharos', sand: ['#e0b97f', '#d6ad71', '#f0d3a6'], wall: '#efe0bf', Ls: 175, rIn: 4, Wt: 22 },
  { name: 'Kyrene', games: 'The Games of Kyrene', prize: 'a jar of precious silphium', sky: ['#2f86d6', '#a6d8f4', '#f6eed6'], sun: [0.35, 0.72, '#ffffff'], far: '#c9b38a', hill: '#d6b676', feat: 'dunes', sand: ['#e9cf98', '#e0c388', '#f4e6c2'], wall: '#f0e4c6', Ls: 160, rIn: 3.5, Wt: 20 },
  { name: 'Troy', games: 'The Funeral Games of Patroklos', prize: 'a great bronze cauldron', sky: ['#222a55', '#7a5a8a', '#e8a07a'], sun: [0.58, 0.07, '#ffc090'], far: '#5a5a7a', hill: '#5a5548', feat: 'troy', sand: ['#c79d6c', '#bc9160', '#d9b894'], wall: '#d8cbb2', Ls: 185, rIn: 5, Wt: 26 }
];
const OLYMPOS = { name: 'Mount Olympos', games: 'The Games of the Gods', prize: 'a wreath of gold', sky: ['#3a4a9a', '#f0c070', '#fff3c8'], sun: [0.5, 0.5, '#fffbe0'], far: '#d9c9e0', hill: '#b9a6c9', feat: 'olympos', sand: ['#ead7a6', '#e2cc96', '#fff0cc'], wall: '#fbf6e6', Ls: 180, rIn: 4.5, Wt: 24 };
const venueOf = L => L % 10 === 0 ? OLYMPOS : VENUES[(L - 1 - Math.floor(L / 10)) % VENUES.length];

// ---------- one race: the venue, the field, and how forgiving the level is ----------
function makeRace(L, opts = {}) {
  const f = curve(L), e = easyOf(L), boss = L % 10 === 0, r = rng(L * 7717 + 11), pk = a => a[(r() * a.length) | 0];
  const V = venueOf(L), T = makeTrack(V), n = L <= 5 ? 4 : L <= 14 ? 6 : 8, laps = L <= 2 ? 2 : 3;
  const help = !!opts.help, skill = Math.min(0.92, 1 - Math.exp(-(f + 3) / 24)), spread = 0.78 - 0.08 * skill, cars = [], used = new Set(), usedN = new Set();
  for (let i = 0; i < n - 1; i++) {
    const isBoss = boss && i === 0, q = isBoss ? 1.07 : n > 2 ? 1 - i * spread / (n - 2) : 1, qc = Math.min(1, q);
    let pol; do pol = pk(POLEIS); while (used.has(pol[0])); used.add(pol[0]);
    const fem = r() < 0.22; let nm; do nm = pk(fem ? NAMES_F : NAMES_M); while (usedN.has(nm)); usedN.add(nm);
    const B = isBoss ? BOSSES[(L / 10 - 1) % BOSSES.length] : null, c0 = pk(COATS);
    const tight = clamp((0.35 + 0.62 * skill) * (0.6 + 0.4 * qc), 0, 0.97);
    const cl = T.dMin + 0.7 + (1 - tight) * 8;
    cars.push(newChariot({
      ai: true, boss: isBoss, name: B ? B[0] : nm, full: B ? `${B[0]} ${B[1]}` : `${nm} of ${pol[0]}`, em: B ? B[2] : pol[1], col: B ? B[3] : pol[2], col2: B ? B[4] : pol[3],
      coats: B ? B[5] : [c0, r() < 0.5 ? c0 : pk(COATS), c0, r() < 0.3 ? pk(COATS) : c0],
      uA: clamp(0.1 + 0.82 * skill + (q - 0.6) * (0.08 + 0.16 * skill) - (help ? 0.12 : 0), 0, 0.96),          // how hard they drive the team
      cs: clamp(0.8 + 0.145 * skill + (q - 0.6) * 0.05 - (help ? 0.04 : 0), 0.7, 0.965),                         // how close to the limit they corner
      cl, sl: clamp(cl + 1.2 + (i % 3) * 2.3, T.dMin + 1, T.dMax - 1),                                            // corner lane and straight lane
      pm: 0.02 + 0.2 * (1 - skill) * (1.3 - qc), rt: 0.12 + 0.55 * (1 - skill) * (1.4 - qc) * r(), agg: L >= 12 && i === 0 ? 0.35 * skill : 0
    }));
  }
  const me = newChariot({ me: true, name: 'YOU', full: 'You', em: '★', col: '#b3261e', col2: '#f2c14e', coats: ['#efe9dc', '#e4dccb', '#f3eee4', '#dfd6c5'] });
  // the starting line: rows of up to four, the favourite on the inside
  const per = n <= 4 ? n : n / 2, slots = [];
  for (let i = 0; i < n; i++) slots.push({ p: -5 - Math.floor(i / per) * 9, d: lerp(T.dMin + 1.3, T.dMax - 1.3, (i % per + 0.5) / per) });
  const mine = L <= 3 || boss ? 1 : 1 + ((Math.random() * (n - 1)) | 0);        // lots are drawn for the lanes (the favourite keeps the inside); against a champion you start beside them
  me.p = slots[mine].p; me.d = slots[mine].d; slots.splice(mine, 1);
  cars.forEach((c, i) => { c.p = slots[i].p; c.d = slots[i].d; });
  cars.push(me);
  const kc = PH.KC * (1 - 0.6 * e), rRef = T.rIn + 2.3;
  return {
    L, V, T, cars, me, n, laps, boss, help, f, e, order: cars.slice(), t: 0, ct: 0, tickN: 0, phase: 'home', finN: 0, evs: [], parts: [], msgs: [], A: null, crowd: 0.25, ft: 0,
    cfScale: 1 - 0.6 * e, assist: L <= 10, assistPre: clamp((8 - L) / 6, 0, 1), assistIn: L <= 5 ? 1 + 0.1 * Math.max(0, L - 4) : 1.3 + 0.3 * (L - 6), hint: L <= 5 ? 2 : L <= 10 ? 1 : 0,
    wP: 0.075 + 0.065 * Math.exp(-f / 18) + 0.03 * e, wG: Math.min(0.24, 2 * (0.075 + 0.065 * Math.exp(-f / 18) + 0.03 * e)),
    postWreck: L >= 6, wallWreck: L >= 8, tipWreck: L >= 8, tipAt: 0.55 + 0.35 * clamp((12 - L) / 4, 0, 1), wallAt: 5.6 + 5 * clamp((13 - L) / 5, 0, 1), wreckT: 2.3, autoStart: L <= 1 ? 0.05 : 0.5, need: boss ? 1 : n <= 4 ? 2 : 3,
    tIdeal: Math.PI * rRef / holdSpeed(T, rRef, kc), eagle: !HEADLESS && Math.random() < 0.12
  };
}
