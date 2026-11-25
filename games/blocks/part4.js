
// ===================== SOUND: the toy box (PLAYBOOK S1-S11) =====================
// Heard hundreds of times, so everything is short, soft and wooden-plastic: putting a piece down is a little "clack" (a
// filtered knock plus a low pluck, a touch deeper for a bigger piece, never quite the same twice, S2). A clear is a bright
// chime chord; more lines at once add voices, and each clear in a combo lifts the chord a step up the scale (S5), so a long
// combo climbs like a tune. A gem rings a crystal bell. New pieces arrive with three quick ticks. A drop that does not fit is
// a soft hollow knock, never harsh (S8). Out of room is a gentle falling pair.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(392, q + 5), 0.5, 0.07, j * 0.07)); },
  deal() { if (!gate('deal', 120)) return; for (let j = 0; j < 3; j++) noise(0.025, 2600 + j * 500, 0.035, 'bandpass', 2, j * 0.05); },
  place(n = 4) { if (!gate('place', 40)) return; const f = 190 * vary(0.06) * (n >= 6 ? 0.8 : n <= 2 ? 1.25 : 1); noise(0.04, 1500 * vary(0.1), 0.09, 'bandpass', 1.6); tone(f, 0.09, 0.09, 'triangle', 0, f * 0.7); pluck(f * 2, 0.18, 0.05, 0.005); },
  nope() { if (!gate('nope', 160)) return; tone(160, 0.12, 0.06, 'sine', 0, 120); noise(0.06, 600, 0.04, 'lowpass', 1); },
  clear(n = 1, streak = 1) { const st = Math.min(12, (streak - 1) * 2), base = note(523, st); [0, 4, 7, 12, 16, 19].slice(0, 2 + Math.min(4, n)).forEach((q, j) => tone(base * Math.pow(2, q / 12), 0.45, 0.05, 'sine', j * 0.03)); pluck(base, 0.5, 0.06);
    noise(0.22, 5000, 0.035, 'highpass', 0.7, 0, 0.01); if (n >= 2) tone(base / 2, 0.3, 0.08, 'triangle', 0, base / 2 * 1.5); },
  gem() { if (!gate('gem', 70)) return; tone(1976 * vary(0.02), 0.35, 0.05, 'sine'); tone(2637, 0.25, 0.03, 'sine', 0.05); },
  full() { tone(330, 0.3, 0.07, 'triangle', 0, 294); tone(262, 0.5, 0.07, 'triangle', 0.22, 220); },
  boom() { tone(80, 0.5, 0.16, 'sine', 0, 45); noise(0.4, 800, 0.1, 'lowpass', 0.8, 0, 0.005); },
  tick() { if (!gate('tick', 45)) return; tone(1320 + Math.random() * 200, 0.05, 0.03, 'triangle'); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the band (tools/juice-kit.js): this game's music
bandStyle('island', { seed: 64, key: 2, bpm: 100, lead: { i: 'steel' }, comp: { i: 'guitar' }, A: [0, 3, 0, 4], tune: ['0...0...4...2...', '3...3...7...5...', '4...4...8...6...'] });
