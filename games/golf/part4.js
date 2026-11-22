
// ===================== SOUND: the course (PLAYBOOK S1-S11) =====================
// The click of the putter (harder with power), the knock of the ball on a rail, the boing of a bumper, the clack of a windmill
// sail, the rattle and drop into the cup, a splash, a little crowd's applause for a birdie, birdsong in the garden.
const sfx = {
  putt(p = 0.5) { tone(900 + p * 400, 0.05, 0.08 + p * 0.06, 'triangle', 0, 600); noise(0.03, 3000, 0.04 + p * 0.04, 'bandpass', 2); },
  rail(v = 2) { if (!gate('rail', 60)) return; tone(320 * vary(0.05), 0.06, Math.min(0.08, 0.02 + v * 0.008), 'triangle', 0, 260); noise(0.03, 1200, 0.02, 'bandpass', 2); },
  bumper() { if (!gate('bumper', 80)) return; tone(260, 0.25, 0.08, 'sine', 0, 520); tone(520, 0.2, 0.04, 'triangle', 0.02, 780); },
  swat() { if (!gate('swat', 120)) return; noise(0.06, 900, 0.1, 'bandpass', 1.5); tone(180, 0.1, 0.06, 'square', 0, 120, 900); },
  lip() { if (!gate('lip', 300)) return; for (let i = 0; i < 3; i++) tone(700 - i * 80, 0.05, 0.04, 'triangle', i * 0.05); },
  cup() { for (let i = 0; i < 3; i++) tone(500 - i * 60, 0.05, 0.05, 'triangle', i * 0.04); tone(180, 0.2, 0.1, 'sine', 0.15, 120); },
  cheer(n = 1) { for (let i = 0; i < 8 + n * 6; i++) noise(0.05, 1800 + Math.random() * 1500, 0.015 + n * 0.005, 'bandpass', 3, 0.2 + i * 0.04); [0, 4, 7, 12].forEach((q, j) => tone(note(523, q), 0.25, 0.06, 'triangle', 0.2 + j * 0.08)); },
  splash() { noise(0.5, 1200, 0.15, 'lowpass', 0.8); for (let i = 0; i < 5; i++) tone(900 + Math.random() * 600, 0.05, 0.02, 'sine', 0.1 + i * 0.05, 400); },
  mull() { tone(660, 0.12, 0.06, 'triangle', 0, 440); tone(440, 0.15, 0.05, 'triangle', 0.1, 660); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.12, j * 0.1)); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
let birdT = 2;
function soundStep(G, dt) { if (!G || G.over || HEADLESS || MUTE || paused) return; birdT -= dt; if (birdT <= 0) { birdT = 3 + Math.random() * 6; const b = 2200 + Math.random() * 900; tone(b, 0.07, 0.012, 'sine', 0, b * 1.25); tone(b * 1.1, 0.07, 0.01, 'sine', 0.09, b * 1.4); } }
// the band (tools/juice-kit.js): this game's music
bandStyle('island', { seed: 30, key: 0, bpm: 109 });
