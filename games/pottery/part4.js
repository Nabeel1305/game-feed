// ===================== SOUND: a quiet studio (PLAYBOOK S1-S11) =====================
// The wheel's soft hum (higher as it turns), wet clay squelching under the thumb, a smooth rising slide for each pull, a
// soft tearing rip and a slump's flop, the wire's zip when trimming, a gentle chime when the clay is centred, the kiln's
// roar, and a bright little bell for the finished pot (a sparkle when the glaze surprises you). Music (its own switch):
// slow, warm guitar-like plucks with lots of space.
let humN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  wet() { noise(0.12, 600, 0.03, 'lowpass', 2); },
  pull() { noise(0.5, 900, 0.025, 'bandpass', 1.2); tone(220, 0.4, 0.015, 'sine', 0, 330); },
  tear() { noise(0.35, 1800, 0.05, 'bandpass', 0.8); },
  squash() { noise(0.2, 300, 0.05, 'lowpass', 1); },
  slump() { noise(0.6, 220, 0.08, 'lowpass', 0.7); tone(140, 0.5, 0.04, 'sine', 0, 70); },
  warn() { if (!gate('warn', 900)) return; tone(440, 0.12, 0.03, 'triangle'); tone(415, 0.16, 0.03, 'triangle', 0.14); },
  trim() { noise(0.25, 3500, 0.03, 'highpass', 0.8); },
  centred() { [0, 4, 7].forEach((q, j) => pluck(note(392, q), 0.9, 0.05, j * 0.08)); },
  done() { [0, 7, 12].forEach((q, j) => pluck(note(330, q), 0.9, 0.05, j * 0.1)); },
  kiln() { noise(2.2, 160, 0.06, 'lowpass', 0.6); noise(2.2, 700, 0.015, 'bandpass', 0.6, 0.2); },
  fired() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.2, 0.05, j * 0.09)); },
  surprise() { [0, 4, 7, 11, 14, 19].forEach((q, j) => pluck(note(523, q), 1.0, 0.05, j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 1.3, 0.06, j * 0.12)); },
  lose() { tone(330, 0.5, 0.05, 'triangle', 0, 311); tone(262, 0.8, 0.05, 'triangle', 0.35, 247); },
};
let mus = { t: 0, i: 0 };
const CH = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx && G) { humN -= dt; if (humN <= 0) { humN = 0.6; const sp = G.phase === 'kiln' || G.over ? 0 : G.phase === 'glaze' ? 0.3 : 1; if (sp) tone(95 + sp * 20, 0.65, 0.006 * sp, 'sine'); } }
  mus.t += dt; const beat = 0.6; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CH[Math.floor(i / 8) % CH.length], semi = q => 196 * Math.pow(2, q / 12);
  music(() => { if (i % 8 === 0) pluck(semi(ch[0] - 12), 2.2, 0.025); if (i % 2 === 0) pluck(semi(ch[(i / 2) % 4] + 12), 1.2, 0.012); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 106, key: 2, bpm: 76, lead: { i: 'guitar' }, comp: { i: 'pad', p: 'P' }, A: [0, 3, 0, 4], tune: ['2...4...5...4...', '0...3...5...3...', '1...4...6...4...'], d: { q: '..x...x...x...x.' } });
