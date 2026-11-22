
// ===================== SOUND: the farm (PLAYBOOK S1-S11) =====================
// A soft thump of earth when a seed goes in, a watering can's splash, a pop and a little bell when a crop is pulled (a note
// higher with each in a quick run), the cluck of hens and the click of eggs, a crow's caw, the cart's till ringing.
const sfx = {
  plant() { noise(0.12, 600, 0.08, 'lowpass', 1); tone(220, 0.08, 0.04, 'sine', 0.02, 180); },
  water() { if (!gate('water', 120)) return; noise(0.35, 2800, 0.06, 'bandpass', 0.8, 0, 0.05); },
  drip() { if (!gate('drip', 400)) return; tone(1400, 0.08, 0.025, 'sine', 0, 700); },
  ripe() { if (!gate('ripe', 250)) return; tone(1568, 0.25, 0.03, 'sine'); tone(2093, 0.2, 0.02, 'sine', 0.06); },
  pick(n = 0) { if (!gate('pick', 40)) return; noise(0.05, 900, 0.08, 'lowpass', 1); const b = note(659, Math.min(12, n)); tone(b, 0.15, 0.08, 'triangle', 0.03); tone(b * 2, 0.1, 0.025, 'sine', 0.05); },
  squelch() { noise(0.3, 400, 0.14, 'lowpass', 2); tone(110, 0.25, 0.08, 'sine', 0, 70); },
  wilt() { tone(330, 0.5, 0.05, 'triangle', 0, 220); },
  dig() { noise(0.15, 500, 0.08, 'lowpass', 1); },
  cluck() { if (!gate('cluck', 500)) return; for (let i = 0; i < 3; i++) tone(520 + i * 60, 0.06, 0.04, 'square', i * 0.08, 380, 1500); },
  eggs(n = 1) { for (let i = 0; i < Math.min(3, n); i++) tone(1200 + i * 200, 0.05, 0.05, 'triangle', i * 0.07); },
  squawk() { if (!gate('squawk', 400)) return; tone(700, 0.18, 0.06, 'sawtooth', 0, 500, 2000); },
  caw() { if (!gate('caw', 300)) return; tone(380, 0.22, 0.06, 'sawtooth', 0, 300, 1400); tone(360, 0.2, 0.05, 'sawtooth', 0.25, 280, 1400); },
  shoo() { noise(0.2, 2000, 0.06, 'bandpass', 0.7); for (let i = 0; i < 4; i++) noise(0.03, 1500, 0.03, 'bandpass', 2, i * 0.04); },
  sell(n = 1) { tone(1318, 0.1, 0.06, 'triangle'); tone(1760, 0.3, 0.06, 'sine', 0.08); for (let i = 0; i < Math.min(6, n); i++) tone(2200 + i * 120, 0.05, 0.02, 'square', 0.15 + i * 0.04, null, 5000); },
  thunder() { noise(1.6, 220, 0.3, 'lowpass', 0.6, 0, 0.1); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.12, j * 0.1)); [0, 4, 7].forEach((q, j) => tone(note(784, q), 0.4, 0.05, 'triangle', 0.5 + j * 0.08)); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
let birdT = 2;
function soundStep(G, dt) { if (!G || G.over || HEADLESS || MUTE || paused) return; birdT -= dt; if (birdT <= 0) { birdT = 3 + Math.random() * 5; if (!G.raining) { const b = 2000 + Math.random() * 800; tone(b, 0.08, 0.015, 'sine', 0, b * 1.3); tone(b * 1.1, 0.08, 0.012, 'sine', 0.1, b * 1.4); } } }
// the band (tools/juice-kit.js): this game's music
bandStyle('pastoral', { seed: 28, key: -3, bpm: 85 });
