// ===================== SOUND: the lake at golden hour (PLAYBOOK S1-S11) =====================
// Quiet water lapping at the shore, a bird now and then, reeds in the wind. The throw is a soft whoosh; every kiss on the water
// is a "plip" that climbs a note with each skip (a perfect kiss adds a little glassy chime above it: S3, a rising ladder you
// can hear); a miss is a duller, lower plop. The stone sinks with a gloop; a ring is a bell; the jetty a wooden clack.
// Music (its own switch): a slow, soft, plucked tune over a low hum, calm enough to sit under everything.
let lapN = 0, birdN = 3, reedN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.035, 'triangle', 0, 820); },
  pick() { tone(330, 0.05, 0.04, 'triangle', 0, 260); noise(0.05, 1800, 0.02, 'bandpass', 2); },
  throw(v = 15) { noise(0.32, 900 + v * 40, 0.07 + v * 0.002, 'bandpass', 1.1); },
  kiss(q, n = 1) { const f = note(392, Math.min(11, Math.max(0, n - 1)));
    if (q === 'miss') { tone(f * 0.5, 0.09, 0.09, 'sine', 0, f * 0.32); noise(0.14, 700, 0.05, 'lowpass', 0.9); return; }
    tone(f, 0.08, 0.12, 'sine', 0, f * 0.62); noise(0.07, 2600, 0.035, 'bandpass', 2.2);      // the plip
    if (q === 'perfect') { pluck(f * 2, 0.5, 0.06, 0.02); pluck(f * 3, 0.4, 0.03, 0.05); } },     // a glassy chime above it
  wobble() { if (!gate('wob', 120)) return; tone(180, 0.06, 0.02, 'triangle', 0, 140); },
  ring(n = 1) { pluck(note(659, n * 2), 1.1, 0.05); pluck(note(659, n * 2 + 5), 1.1, 0.03, 0.05); },
  jetty() { tone(220, 0.05, 0.07, 'square', 0, 160); tone(180, 0.05, 0.05, 'square', 0.09, 140); noise(0.3, 1400, 0.03, 'bandpass', 1.2); },
  sink() { tone(260, 0.22, 0.05, 'sine', 0, 90); noise(0.35, 500, 0.03, 'lowpass', 0.7); },
  duck() { tone(520, 0.08, 0.05, 'sawtooth', 0, 380); tone(500, 0.08, 0.04, 'sawtooth', 0.12, 360); noise(0.4, 1200, 0.03, 'bandpass', 0.9); },
  pad() { tone(200, 0.12, 0.05, 'sine', 0, 120); noise(0.2, 600, 0.02, 'lowpass', 1); },
  bird() { const f = 2200 + Math.random() * 900; tone(f, 0.07, 0.012, 'sine', 0, f * 1.25); tone(f * 1.1, 0.06, 0.01, 'sine', 0.11, f * 0.9); if (Math.random() < 0.5) tone(f * 1.05, 0.07, 0.009, 'sine', 0.22, f * 1.3); },
  goal() { [0, 2, 4, 5].forEach((q, j) => pluck(note(523, q), 0.9, 0.05, j * 0.1)); },
  fanfare() { [0, 2, 4, 5, 7].forEach((q, j) => pluck(note(523, q), 1.0, 0.055, j * 0.11)); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.03, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.045, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.035, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(523, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.9, 0.07); },
  win() { this.fanfare(); },
  lose() { pluck(392, 0.9, 0.04); pluck(330, 1.2, 0.04, 0.3); },
};
let mus = { t: 0, i: 0 };
const TUNE = [5, 7, 9, 7, 10, 9, 7, 6, 5, 6, 7, 9, 7, 6, 3, 2];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx) { lapN -= dt; if (lapN <= 0) { lapN = 1.6 + Math.random() * 1.2; noise(1.1, 380, 0.01, 'lowpass', 0.4); }
    birdN -= dt; if (birdN <= 0) { birdN = 4 + Math.random() * 7; if (store.get('slow', true) !== false) sfx.bird(); }
    if (G && Math.abs(G.cfg.wind) > 1) { reedN -= dt; if (reedN <= 0) { reedN = 1.4; noise(1.5, 1600, 0.004 * Math.abs(G.cfg.wind), 'bandpass', 0.5); } } }
  mus.t += dt; const beat = 0.5; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++;
  music(() => { if (i % 2 === 0 || Math.random() < 0.3) pluck(note(196, TUNE[i % TUNE.length]), 1.2, 0.01); if (i % 8 === 0) { const b = [0, 3, 2, 4][(i >> 3) % 4]; pluck(note(98, b), 2.4, 0.018); pluck(note(98, b + 5), 2.4, 0.01, 0.05); } }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 111, key: -1, bpm: 72, lead: { i: 'flute' }, comp: { i: 'guitar', p: 'a.a.a.a.a.a.a.a.' }, A: [0, 3, 0, 4], tune: ['4.......2.......', '5.......3.......', '4.......1.......'], d: {}, rev: 0.6 });
