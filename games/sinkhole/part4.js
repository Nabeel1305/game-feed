
// ===================== SOUND: gulps, growing, booms (PLAYBOOK S1-S11) =====================
// Every swallow is a soft "gulp" whose pitch follows the size of the thing (little things high and quick, a house a deep
// thump) and climbs a step with each one in a combo (S5), so a fast run plays a rising scale; a whoomp and a chord when the
// hole grows; a boom and a crackle for a barrel; a big chomp when you eat another hole, a sad slide when one eats you.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(330, q + 2), 0.5, 0.07, j * 0.07)); },
  gulp(m = 1, combo = 1) { if (!gate('gulp', 45)) return; const big = Math.min(1, Math.log10(1 + m) / 3), f = note(523, Math.min(14, (combo | 0) % 15)) * (1 - big * 0.7) * vary(0.04);
    tone(f, 0.08 + big * 0.25, 0.05 + big * 0.06, 'sine', 0, f * 0.55); if (m >= 20) { noise(0.25 + big * 0.4, 300 + 400 * (1 - big), 0.04 + big * 0.06, 'lowpass', 0.8); tone(70 + 40 * (1 - big), 0.3 + big * 0.3, 0.06 + big * 0.06, 'sine', 0.02, 45); } },
  grow(s = 1) { tone(110, 0.4, 0.08, 'sine', 0, 70); [0, 4, 7, 12].forEach((q, j) => pluck(note(262, q + Math.min(10, s)), 0.6, 0.06, 0.05 + j * 0.05)); },
  boom() { noise(0.7, 900, 0.16, 'lowpass', 0.7); tone(70, 0.6, 0.14, 'sine', 0, 35); noise(0.4, 3000, 0.04, 'bandpass', 1.2, 0.1); },
  fizz() { if (!gate('fizz', 200)) return; noise(0.25, 3500, 0.03, 'highpass', 0.8); },
  pow() { [0, 7, 12].forEach((q, j) => tone(note(659, q), 0.15, 0.06, 'triangle', j * 0.05)); },
  chomp() { tone(90, 0.5, 0.12, 'sawtooth', 0, 40, 600); [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 0.8, 0.07, 0.1 + j * 0.07)); },
  eaten() { tone(400, 0.7, 0.08, 'triangle', 0, 90); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 300)) return; tone(1320, 0.05, 0.04, 'triangle'); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the last ten seconds tick
let tickLast = 99; function soundStep(G, dt) { if (!G || G.over || G.lesson || paused) return; const s = Math.ceil(G.left); if (s <= 10 && s !== tickLast && s > 0) { tickLast = s; sfx.tick(); } if (s > 10) tickLast = 99; }
// the band (tools/juice-kit.js): this game's music
bandStyle('funk', { seed: 70, key: -3, bpm: 104 });
