// ===================== SOUND: a calm street (PLAYBOOK S1-S11) =====================
// His direction: calming instrumental music, birdsong, soft neighbourhood ambience, muted machinery; no reversing alarm, no
// loud crashes. The lift is a soft hydraulic hum, things tumble into the hopper with a muffled rustle, a bin goes back with a
// gentle clunk, a finished house is three warm notes. Music (its own switch): a slow acoustic guitar with a soft pad.
let engN = 0, rollN = 0, birdN = 3;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  step() { noise(0.05, 900, 0.03, 'lowpass', 1); },
  grab(kind) { if (kind === 'bag') noise(0.12, 2600, 0.04, 'bandpass', 1.2); else { tone(140, 0.12, 0.05, 'triangle', 0, 110); noise(0.08, 700, 0.03, 'lowpass', 1); } },
  lift() { tone(110, 0.9, 0.025, 'sawtooth', 0, 150, 500); },
  dump(kind) { const big = kind === 'garden' || kind === 'bulky'; noise(big ? 0.6 : 0.4, kind === 'bag' ? 600 : 1200, big ? 0.09 : 0.06, 'lowpass', 0.8); noise(0.3, 2400, 0.02, 'bandpass', 1, 0.08); tone(70, 0.3, 0.05, 'sine', 0.05, 55); },
  ding() { tone(note(784, 2) * vary(0.01), 0.35, 0.05, 'sine'); tone(note(784, 4), 0.3, 0.03, 'sine', 0.06); },
  early() { tone(330, 0.14, 0.035, 'triangle', 0, 294); },
  bang() { if (!gate('bang', 300)) return; noise(0.18, 500, 0.08, 'lowpass', 1); tone(180, 0.2, 0.05, 'triangle', 0, 120); for (let i = 0; i < 3; i++) noise(0.05, 2400, 0.03, 'bandpass', 2, 0.08 + i * 0.07); },
  clunk() { tone(160, 0.1, 0.045, 'triangle', 0, 120); noise(0.06, 600, 0.03, 'lowpass', 1); },
  brake() { noise(0.6, 900, 0.03, 'lowpass', 0.7); tone(220, 0.25, 0.012, 'sine', 0.3, 200); },
  go() { tone(55, 1.2, 0.04, 'sawtooth', 0, 80, 300); },
  compact() { tone(70, 1.8, 0.05, 'sawtooth', 0, 52, 260); noise(1.6, 300, 0.05, 'lowpass', 0.6, 0.2); },
  house() { [0, 2, 4].forEach((q, j) => pluck(note(392, q + 5), 1.0, 0.07, j * 0.1)); },
  note() { noise(0.2, 3000, 0.02, 'bandpass', 1.5); [0, 4, 7].forEach((q, j) => tone(note(784, q), 0.5, 0.035, 'sine', 0.1 + j * 0.08)); },
  birds() { if (!gate('birds', 3000)) return; for (let i = 0; i < 3 + ((Math.random() * 3) | 0); i++) tone(2800 + Math.random() * 1200, 0.07, 0.012, 'sine', i * 0.11, 3600 + Math.random() * 600); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(392, 4 + i * 2), 0.8, 0.07); },
  no() { if (!gate('no', 250)) return; tone(240, 0.1, 0.03, 'triangle', 0, 200, 900); },
  win() { [0, 2, 4, 7, 9].forEach((q, j) => pluck(note(392, q + 5), 1.2, 0.07, j * 0.13)); },
  lose() { tone(330, 0.4, 0.03, 'triangle', 0, 311); },
};
let mus = { t: 0, i: 0 };
const CHORDS = [[0, 4, 7], [5, 9, 12], [9, 12, 16], [7, 11, 14]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (G && !G.over && SET.sfx) { const L = G.lorry, w = G.wk;
    if (L.state === 'drive' && L.v > 0.3) { engN += dt; if (engN > 0.35) { engN = 0; noise(0.4, 160 + L.v * 25, 0.012 + L.v * 0.002, 'lowpass', 0.7); } }
    if (w.st === 'bring' || w.st === 'return') { const it = carried(G); if (it && it.kind !== 'bag' && it.kind !== 'litter') { rollN += dt; if (rollN > 0.14) { rollN = 0; noise(0.12, 420, 0.012, 'lowpass', 1); } } }
    birdN -= dt; if (birdN <= 0) { birdN = 4 + Math.random() * 7; if (G.sky !== 'rain' && G.sky !== 'dusk') sfx.birds(); } }
  mus.t += dt; const beat = 0.5; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 8) % CHORDS.length];
  const semi = q => 196 * Math.pow(2, q / 12);
  music(() => { const pat = [0, 1, 2, 1, 0, 2, 1, 2]; pluck(semi(ch[pat[i % 8]] + (i % 8 === 0 ? -12 : 0)), 1.4, i % 8 === 0 ? 0.045 : 0.028); if (i % 8 === 0) ch.forEach(q => tone(semi(q), 3.8, 0.008, 'sine', 0, null, 1200)); if (i % 16 === 11) pluck(semi(ch[2] + 12), 1.0, 0.02, 0.25); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('pastoral', { seed: 95, key: 3, bpm: 96, lead: { i: 'horn', oct: 1 }, comp: { i: 'guitar' }, A: [0, 3, 0, 4], tune: ['0...4...2...4...', '3...5...3...0...', '4...6...4...1...'], d: { k: 'x.......x.......', r: '....x.......x...' } });
