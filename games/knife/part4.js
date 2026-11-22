
// ===================== SOUND: knives and wood (PLAYBOOK S1-S11) =====================
// A quick swish for each throw; a solid wooden THUNK as it sticks (a little higher with each knife in the same target, S5,
// and never quite the same twice, S2); a bright metal CLANG for a knife on a knife; a juicy splat for an apple (a chime for
// a gold one); a crack and a crash as a target bursts, and a deeper one for a boss; the next target lands with a soft thud.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(392, q), 0.5, 0.07, j * 0.07)); },
  throw() { if (!gate('throw', 50)) return; noise(0.08, 3200 * vary(0.1), 0.05, 'bandpass', 1.4); },
  thunk(n = 1) { if (!gate('thunk', 40)) return; const f = note(130, Math.min(10, n)) * vary(0.03); tone(f, 0.12, 0.12, 'triangle', 0, f * 0.7); noise(0.06, 900 * vary(0.1), 0.09, 'lowpass', 1.5); },
  clang() { tone(1650, 0.5, 0.07, 'square', 0, 1600, 4000); tone(2470, 0.4, 0.05, 'triangle', 0.01); noise(0.15, 6000, 0.05, 'highpass', 1); },
  apple(gold = false) { noise(0.12, 1400, 0.08, 'bandpass', 1); tone(500, 0.08, 0.05, 'sine', 0, 300); if (gold) [0, 4, 7].forEach((q, j) => tone(note(784, q), 0.2, 0.04, 'sine', 0.04 + j * 0.05)); },
  burst(boss = false) { noise(0.4, 1800, 0.12, 'lowpass', 0.8); tone(boss ? 70 : 110, 0.4, 0.12, 'sine', 0, boss ? 40 : 60); [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q + (boss ? 0 : 2)), 0.5, 0.06, 0.08 + j * 0.06)); },
  drop() { tone(90, 0.2, 0.08, 'sine', 0, 60); noise(0.1, 500, 0.05, 'lowpass', 1); },
  boss() { tone(110, 0.6, 0.1, 'sawtooth', 0, 82, 900); tone(165, 0.6, 0.06, 'sawtooth', 0.05, 123, 900); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the band (tools/juice-kit.js): this game's music
bandStyle('western', { seed: 67, key: 3, bpm: 111 });
