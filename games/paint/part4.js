// ===================== SOUND: paint (PLAYBOOK S1-S11) =====================
// Wet and round. A drop is a soft "plip" (a little lower for a bigger blob); a squash a juicy "splosh": a low wet thump and a
// plucked note, the note a step higher for every colour up the chart and higher again in a chain (S5), so building up to
// the goal climbs like a scale. A palette drop drying is a tiny dull tick going down; a refill a bright sparkle. The line in
// danger is a low soft pulse. A stone cracking a dry crunch. The goal: a bright run.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 2, 4].forEach((q, j) => pluck(note(392, q + 2), 0.5, 0.06, j * 0.07)); },
  plop(t = 0) { const f = 900 - Math.max(0, t) * 70; tone(f, 0.09, 0.05, 'sine', 0, f * 0.6); noise(0.04, 1800, 0.02, 'bandpass', 2); },
  squash(t = 1, chain = 1) { tone(140 - Math.min(8, t) * 6, 0.22, 0.12, 'sine', 0, 70); noise(0.16, 700, 0.06, 'lowpass', 1.2, 0, 0.01); pluck(note(392, Math.min(16, t + (chain - 1) * 2)), 0.6, 0.08, 0.02); if (chain >= 2) tone(note(784, Math.min(14, t + chain)), 0.25, 0.03, 'sine', 0.06); },
  dry(n = 1, of = 6) { tone(500 - n * 40, 0.08, 0.04, 'triangle', 0, 420 - n * 40); },
  refill() { if (!gate('refill', 200)) return; [0, 4, 7].forEach((q, j) => tone(note(1046, q), 0.12, 0.025, 'sine', j * 0.03)); },
  warn() { tone(110, 0.4, 0.06, 'sine', 0, 90); },
  crack() { for (let i = 0; i < 4; i++) noise(0.03, 3000 - i * 500, 0.05, 'highpass', 1, i * 0.02); },
  shake() { noise(0.5, 900, 0.06, 'bandpass', 0.8, 0, 0.05); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.08)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 62, key: -1, bpm: 78, lead: { i: 'vibes' }, comp: { i: 'keys' }, A: [0, 3, 0, 4], tune: ['4.......2...0...', '5.......3...0...', '4.......2...1...'] });
