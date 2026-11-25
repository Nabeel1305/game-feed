
// ===================== SOUND: the gate (PLAYBOOK S1-S11) =====================
// A soft chime as each soul arrives; a rising choir chord to Heaven (a note higher with each right judgement in a row); a low
// rumble and crackle down to Hell; a hollow breath of wind to Purgatory; pages turning in the Book; a dull bell when wrong.
const sfx = {
  arrive() { tone(1046 * vary(0.02), 0.6, 0.04, 'sine'); tone(1568, 0.5, 0.02, 'sine', 0.05); },
  heaven(n = 1) { const b = note(392, Math.min(10, n)); [0, 4, 7, 12].forEach((q, j) => tone(b * Math.pow(2, q / 12), 0.9, 0.05, 'sine', j * 0.04)); noise(0.6, 6000, 0.015, 'highpass', 1, 0, 0.2); },
  hell() { tone(55, 0.8, 0.22, 'sawtooth', 0, 40, 300); noise(0.7, 300, 0.12, 'lowpass', 0.7); for (let i = 0; i < 6; i++) noise(0.04, 2500, 0.03, 'bandpass', 3, 0.1 + i * 0.08); },
  mist() { noise(0.9, 500, 0.08, 'bandpass', 0.5, 0, 0.35); tone(220, 0.8, 0.03, 'sine', 0.1, 196); },
  book() { for (let i = 0; i < 3; i++) noise(0.08, 3000 + i * 600, 0.05, 'bandpass', 1.5, i * 0.07); tone(784, 0.4, 0.03, 'sine', 0.2); },
  wrong() { tone(196, 0.9, 0.12, 'triangle', 0, 185); tone(147, 1.0, 0.08, 'sine', 0.05); },
  bell() { tone(330, 1.6, 0.1, 'sine'); tone(495, 1.4, 0.05, 'sine', 0.01); tone(660, 1.2, 0.03, 'sine', 0.02); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(392, q), 1.0, 0.06, 'sine', j * 0.1)); [0, 7].forEach((q, j) => pluck(note(196, q), 1.4, 0.08, 0.5 + j * 0.1)); },
  lose() { sfx.bell(); tone(220, 0.8, 0.08, 'triangle', 0.4, 165); },
};
function soundStep(G, dt) {}
// the band (tools/juice-kit.js): this game's music
bandStyle('waltz', { seed: 27, key: -1, bpm: 120, lead: { i: 'bell' }, comp: { i: 'harp', p: 'a.a.a.a.a.a.' }, A: [0, 3, 0, 4], tune: ['7...4...2...', '7...5...3...', '6...4...1...'], rev: 0.7 });
