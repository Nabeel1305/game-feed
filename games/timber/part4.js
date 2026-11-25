
// ===================== SOUND: the woods (PLAYBOOK S1-S11) =====================
// The saw: a two-stroke buzz that bogs down (lower) while it is in the wood; chips; the creak of a thinning hinge; the crack as
// it goes; a rising whoosh as it falls; a deep thump and the shake of branches when it lands. Wedge taps ring on steel. Birds,
// and wind that rises with the gusts. Music (its own switch): an easy folk guitar.
let sawN = 0, creakN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  combo(i = 0) { [0, 4, 7].forEach((q, j) => pluck(note(392, q + i), 0.4, 0.05, j * 0.06)); },
  birds() { if (!gate('birds', 4000)) return; for (let i = 0; i < 3; i++) tone(2600 + Math.random() * 900, 0.08, 0.02, 'sine', 0.3 + i * 0.13, 3400 + Math.random() * 500); },
  sawOn() { tone(90, 0.25, 0.05, 'sawtooth', 0, 160, 1200); noise(0.2, 1800, 0.03, 'bandpass', 1); },
  sawOff() { tone(150, 0.4, 0.04, 'sawtooth', 0, 60, 900); },
  wedge() { tone(1650 * vary(0.04), 0.18, 0.07, 'triangle'); tone(2470, 0.12, 0.03, 'sine', 0.005); noise(0.05, 3000, 0.05, 'bandpass', 2); },
  crack() { noise(0.25, 1400, 0.16, 'bandpass', 0.8); tone(180, 0.3, 0.1, 'triangle', 0, 70); for (let i = 0; i < 5; i++) noise(0.04, 2500, 0.08, 'bandpass', 2, 0.05 + i * 0.06); },
  thud(d = 0.6) { tone(55 + 20 * (1 - d), 0.9, 0.32, 'sine', 0, 32); noise(0.7, 400, 0.22, 'lowpass', 0.7); noise(0.9, 3000, 0.07, 'highpass', 0.6, 0.05); },
  good(g) { const n = g === 'perfect' ? 5 : g === 'good' ? 3 : 2; for (let i = 0; i < n; i++) pluck(note(392, [0, 4, 7, 9, 12][i]), 0.8, 0.07, 0.3 + i * 0.09); },
  bad() { tone(300, 0.4, 0.05, 'triangle', 0.3, 220); tone(220, 0.6, 0.05, 'triangle', 0.6, 180); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  goal() { [0, 4, 7, 9, 12].forEach((q, j) => pluck(note(392, q), 0.9, 0.07, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 11, 14].forEach((q, j) => pluck(note(392, q), 1.0, 0.07, j * 0.11)); },
  lose() { tone(330, 0.4, 0.05, 'triangle', 0, 311); tone(262, 0.7, 0.05, 'triangle', 0.3, 247); },
};
let mus = { t: 0, i: 0 }, windN = 0, whooshN = 0;
const CHORDS = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14], [7, 11, 14]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return; const T = G && G.tree;
  if (T && SET.sfx) {
    if (T.notching || T.sawing) { sawN += dt; if (sawN > 0.07) { sawN = 0; const inWood = T.notching ? T.nd > 0 : T.bc > 0; tone((inWood ? 105 : 140) * vary(0.03), 0.09, 0.035, 'sawtooth', 0, null, inWood ? 900 : 1500); if (inWood) noise(0.06, 2200, 0.02, 'bandpass', 1.5); } }
    if (T.phase === 'cut' && T.bc > 0 && hingeOf(T) < 0.18) { creakN += dt; if (creakN > 0.6 + Math.random() * 0.8) { creakN = 0; tone(140 + Math.random() * 60, 0.35, 0.03, 'sawtooth', 0, 90 + Math.random() * 40, 500); } }
    if (T.phase === 'fall') { whooshN += dt; if (whooshN > 0.1) { whooshN = 0; noise(0.14, 300 + T.th * 1200, 0.02 + T.th * 0.05, 'bandpass', 1.2); } }
    if (T.spec.wind) { windN += dt; if (windN > 0.5) { windN = 0; const w = windNow(T, G.t); noise(0.7, 500 + w * 60, 0.004 + w * 0.0035, 'lowpass', 0.6); } } }
  mus.t += dt; const beat = 0.42; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 6) % CHORDS.length];
  music(() => { const pat = [0, 2, 1, 2, 0, 1]; pluck(note(i % 6 === 0 ? 98 : 196, ch[pat[i % 6]]), 1.1, i % 6 === 0 ? 0.05 : 0.03); if (i % 12 === 3) pluck(note(392, ch[2] + 2), 0.9, 0.02, 0.1); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('western', { seed: 91, key: -3, bpm: 106, lead: { i: 'banjo' }, comp: { i: 'guitar' }, A: [0, 3, 0, 4], tune: ['0...2...0...4...', '3...5...3...7...', '4...6...4...1...'], d: { k: 'x.......x.......', c: '....x.......x...' } });
