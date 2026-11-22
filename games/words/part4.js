
// ===================== SOUND: soft and warm (PLAYBOOK S1-S11; calm: no harsh sounds) =====================
// Each letter you slide through plays a soft marimba note, a step higher for each (S5), so a long word plays a little run;
// a found word rings a warm chord (fuller for longer words and quick runs); a bonus word twinkles; a made-up word is a soft
// "blop" (S8, never harsh); a page done plays a gentle arpeggio.
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(392, q), 0.6, 0.06, j * 0.08)); },
  letter(i = 0) { pluck(note(392, [0, 2, 4, 7, 9, 12, 14][Math.min(6, i)]), 0.35, 0.06); },
  found(n = 3, streak = 1) { const b = Math.min(5, streak - 1); [0, 4, 7, n >= 5 ? 12 : null, n >= 6 ? 16 : null].filter(q => q != null).forEach((q, j) => pluck(note(392, q + b), 0.8, 0.07, j * 0.05)); },
  bonus() { [12, 16, 19].forEach((q, j) => tone(note(523, q), 0.2, 0.04, 'sine', j * 0.06)); },
  jar() { [0, 4, 7, 12, 16, 19].forEach((q, j) => tone(note(523, q), 0.25, 0.05, 'triangle', j * 0.06)); },
  again() { tone(520, 0.12, 0.03, 'sine', 0, 500); },
  spill() { tone(300, 0.25, 0.06, 'sine', 0, 140); noise(0.12, 600, 0.02, 'lowpass', 1); },
  hint() { tone(note(659, 7), 0.4, 0.05, 'sine'); tone(note(659, 12), 0.5, 0.04, 'sine', 0.08); },
  shuffle() { noise(0.25, 2500, 0.025, 'bandpass', 0.8); },
  goal() { [0, 4, 7, 12, 16, 19].forEach((q, j) => pluck(note(392, q), 1.0, 0.07, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(220, 0.12, 0.04, 'triangle', 0, 180, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.04, 0.02, 'triangle'); },
  coin(i = 0) { tone(note(988, (i | 0) % 5), 0.12, 0.04, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.05, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.08, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.08); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.07, j * 0.12)); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 349); tone(330, 0.7, 0.05, 'triangle', 0.3, 294); },
};
function soundStep(G, dt) {}
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 72, key: 0, bpm: 74 });
