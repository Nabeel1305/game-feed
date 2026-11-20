
// ===================== SOUND: the crowd (PLAYBOOK S1-S11) =====================
// A gate that helps: a bright rising chime, higher the more it multiplies (S5); one that hurts: a falling "bwomp" (S8).
// Knocked runners: little pops, more for more; a splash for a fall; a fight is a scuffle of thuds; the giant a deep drum;
// each bonus step a note higher up the scale, to a fanfare at the top.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(392, q), 0.5, 0.07, j * 0.07)); },
  gateUp(r = 2) { const s = Math.min(12, Math.round(Math.log2(Math.max(1.05, r)) * 6)); [0, 4, 7].forEach((q, j) => tone(note(523, q + s), 0.16, 0.06, 'triangle', j * 0.05)); noise(0.2, 4000, 0.025, 'highpass', 0.7); },
  gateDown() { tone(330, 0.35, 0.07, 'sawtooth', 0, 140, 900); },
  hit(n = 1, why) { if (!gate('hit', 60)) return; if (why === 'fall') { noise(0.3, 800, 0.05, 'lowpass', 0.7); tone(600, 0.2, 0.03, 'sine', 0, 200); return; } for (let i = 0; i < Math.min(4, 1 + n / 3); i++) tone(500 * vary(0.2), 0.05, 0.04, 'square', i * 0.03, 250, 1500); },
  fight() { noise(0.3, 600, 0.08, 'lowpass', 0.8); tone(90, 0.3, 0.08, 'sine', 0, 60); },
  clash() { if (!gate('clash', 70)) return; noise(0.06, 900 * vary(0.3), 0.05, 'bandpass', 1.5); },
  won1() { [0, 7].forEach((q, j) => tone(note(523, q), 0.14, 0.06, 'triangle', j * 0.06)); },
  join(n = 5) { [0, 4, 7, 12].forEach((q, j) => tone(note(659, q), 0.1, 0.05, 'sine', j * 0.04)); },
  coin(i = 0) { if (!gate('coin', 50)) return; tone(note(988, (i | 0) % 5), 0.12, 0.05, 'triangle'); },
  boss() { tone(65, 0.8, 0.14, 'sine', 0, 50); noise(0.5, 300, 0.06, 'lowpass', 0.8, 0.05); },
  stair(s = 1) { pluck(note(392, Math.min(16, s * 2)), 0.4, 0.08); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
function soundStep(G, dt) {}
