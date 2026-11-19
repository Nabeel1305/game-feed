// ===================== SOUND: glass and water (PLAYBOOK S1-S11) =====================
// A bright glassy clink when a glass is picked up (softer when it is put down), a run of low "glug"s while it pours (one for
// each layer that moves), a soft ping when a hidden colour shows itself, and a chime when a glass is done that climbs a step
// with each glass done (S5). A pour that cannot happen is a dull little clunk. Undo is a quick reverse swish.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(523, q), 0.5, 0.05, j * 0.07)); },
  clink(v = 1) { if (!gate('clink', 60)) return; const f = 2600 + Math.random() * 300; tone(f, 0.18, 0.04 * v, 'sine'); tone(f * 1.5, 0.12, 0.02 * v, 'sine', 0.005); },
  pour(n = 1) { for (let i = 0; i < 2 + n * 2; i++) { const t = 0.12 + i * 0.07; noise(0.07, 380 + Math.random() * 120, 0.06, 'bandpass', 3, t, 0.01); tone(160 + Math.random() * 60, 0.06, 0.03, 'sine', t, 110); } },
  reveal() { tone(1568, 0.25, 0.03, 'sine'); },
  full(n = 1) { const st = Math.min(14, n * 2); pluck(note(523, st), 0.9, 0.08); tone(note(1046, st), 0.4, 0.03, 'sine', 0.05); },
  nope() { if (!gate('nope', 200)) return; tone(180, 0.12, 0.06, 'triangle', 0, 140, 800); noise(0.05, 600, 0.03, 'lowpass', 1); },
  undo() { noise(0.18, 1800, 0.03, 'bandpass', 0.8, 0, 0.1); tone(700, 0.12, 0.03, 'sine', 0, 500); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(523, q), 1.0, 0.07, j * 0.1)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
