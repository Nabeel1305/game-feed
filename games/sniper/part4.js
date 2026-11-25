
// ===================== SOUND: the rooftop (PLAYBOOK S1-S11) =====================
// A soft click-and-slide as the scope comes up; the "thup" of the dart rifle (a puff, not a bang); a gentle "boing" and a
// rising chime when the thief goes to sleep; a sour note for a wrong man; the crowd's murmur turns to a hubbub when it
// scatters; a breath sound when you run out of air.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 3, 7].forEach((q, j) => pluck(note(220, q), 0.5, 0.07, j * 0.08)); },
  scope() { noise(0.12, 2500, 0.03, 'bandpass', 2); tone(1200, 0.04, 0.03, 'square', 0.02, 900, 3000); },
  fire() { noise(0.18, 900, 0.12, 'lowpass', 0.7); tone(180, 0.12, 0.08, 'sine', 0, 90); },
  got() { tone(500, 0.3, 0.06, 'sine', 0, 300); [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 0.8, 0.07, 0.15 + j * 0.08)); },
  wrong() { tone(300, 0.6, 0.08, 'sawtooth', 0, 150, 900); },
  miss() { noise(0.1, 1800, 0.04, 'bandpass', 1.5); },
  panic() { for (let i = 0; i < 6; i++) tone(500 + Math.random() * 500, 0.12, 0.025, 'triangle', i * 0.05, 400 + Math.random() * 300); },
  gasp() { noise(0.5, 900, 0.05, 'bandpass', 0.6); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the square murmurs (a soft noise bed), louder when it scatters; the clock ticks in its last five seconds
let tickLast = 99; function soundStep(G, dt) { if (!G || G.over || paused) return; if (!G.lesson) { const s = Math.ceil(G.left); if (s <= 5 && s !== tickLast && s > 0) { tickLast = s; sfx.tick(); } if (s > 5) tickLast = 99; } }
// the band (tools/juice-kit.js): this game's music
bandStyle('tense', { seed: 73, key: -2, bpm: 96, lead: { i: 'pizz' }, comp: { i: 'pad', p: 'P' }, A: [0, 5, 0, 4], tune: ['0.......0...2...', '5.......5...4...', '4.......4...6...'], d: { w: 'x...x...x...x...', k: 'x...............' } });
