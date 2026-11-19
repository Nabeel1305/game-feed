// ===================== SOUND: the shop (PLAYBOOK S1-S11) =====================
// The shop bell, glass jars clinking into the cauldron, a pour, a swirl that rises (clockwise) or falls (anticlockwise), a
// chime as a rune burns in, the seal (brighter the closer you were), a sparkle chord for a good spell (fuller for a perfect
// one: S4), a sad fizzle for a bad one, the door, and an angry stamp when someone complains.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  bell() { if (!gate('bell', 300)) return; [0, 0.15].forEach(d => tone(1760 * vary(0.01), 0.5, 0.04, 'sine', d)); },
  clink() { tone(2600 * vary(0.05), 0.12, 0.04, 'sine'); tone(3900 * vary(0.05), 0.08, 0.02, 'sine', 0.01); tone(180, 0.15, 0.04, 'sine', 0.05, 120); },
  whoosh() { noise(0.25, 1200, 0.03, 'bandpass', 0.8, 0, 0.05); },
  splash() { noise(0.3, 700, 0.06, 'lowpass', 1); tone(300, 0.2, 0.03, 'sine', 0, 500); },
  swirl(dir = 1) { tone(dir > 0 ? 300 : 700, 0.45, 0.05, 'triangle', 0, dir > 0 ? 700 : 300, 1600); },
  rune() { [0, 7, 12].forEach((q, j) => tone(note(587, q), 0.4, 0.04, 'sine', j * 0.06)); },
  seal(acc = 1) { tone(note(784, Math.round(acc * 7)), 0.3, 0.06, 'triangle'); noise(0.08, 3000, 0.03, 'highpass', 1); },
  good(perfect = false) { [0, 4, 7, 11, perfect ? 14 : 12].forEach((q, j) => pluck(note(392, q), 0.9, 0.07, j * 0.07)); },
  fizzle() { noise(0.6, 900, 0.05, 'bandpass', 2); tone(400, 0.5, 0.04, 'sawtooth', 0, 120, 900); },
  door() { noise(0.12, 320, 0.08, 'lowpass', 1); tone(95, 0.18, 0.06, 'sine', 0, 60); },
  angry() { tone(140, 0.25, 0.09, 'sawtooth', 0, 110, 700); noise(0.12, 300, 0.1, 'lowpass', 1, 0.2); tone(120, 0.3, 0.08, 'sawtooth', 0.3, 90, 700); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
