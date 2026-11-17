
// ===================== SOUND: the night (PLAYBOOK S1-S11) =====================
// The sword's swish, magic bolts' shimmer, the crack of lightning, axes whirring; a soft pop for every monster that falls (a
// note higher as they fall in a quick run), the tinkle of crystals; a bright chord at each level-up; the boss's roar, the
// rising whine before its slam, the ground's boom. Under it all, wind and the shuffle of the horde.
const sfx = {
  swing() { if (!gate('swing', 120)) return; noise(0.12, 2200 * vary(0.1), 0.05, 'bandpass', 1.2); },
  zap() { if (!gate('zap', 100)) return; const b = 1200 * vary(0.06); tone(b, 0.12, 0.025, 'sine', 0, b * 1.5); },
  crack() { if (!gate('crack', 150)) return; noise(0.25, 3500, 0.12, 'highpass', 0.8); tone(80, 0.3, 0.12, 'sine', 0.02, 50); },
  whoosh() { if (!gate('whoosh', 150)) return; noise(0.3, 900, 0.04, 'bandpass', 2, 0, 0.1); },
  pop(n = 0) { if (!gate('pop', 30)) return; const b = note(392, Math.min(14, Math.floor(n / 2))); tone(b, 0.07, 0.035, 'triangle'); noise(0.04, 1500, 0.03, 'bandpass', 2); },
  gem() { if (!gate('gem', 40)) return; tone(1760 * vary(0.03), 0.06, 0.02, 'sine'); },
  hurt() { if (!gate('hurt', 250)) return; tone(160, 0.15, 0.12, 'sawtooth', 0, 100, 900); },
  draw() { if (!gate('draw', 300)) return; tone(300, 0.6, 0.025, 'triangle', 0, 520); },
  arrow() { if (!gate('arrow', 120)) return; noise(0.15, 3000, 0.04, 'bandpass', 2); },
  levelup() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(523, q), 0.35, 0.07, 'triangle', j * 0.06)); },
  boss() { tone(70, 1.4, 0.2, 'sawtooth', 0, 50, 500); noise(1.2, 300, 0.15, 'lowpass', 0.6); tone(105, 1.2, 0.1, 'sawtooth', 0.1, 70, 500); },
  raise() { tone(200, 1.2, 0.06, 'sawtooth', 0, 600, 1500); },
  slam() { tone(45, 0.7, 0.35, 'sine', 0, 28); noise(0.6, 500, 0.3, 'lowpass', 0.6); },
  volley() { for (let i = 0; i < 5; i++) tone(700 + i * 90, 0.12, 0.03, 'square', i * 0.03, 400, 2500); },
  bossdown() { noise(1.2, 700, 0.3, 'lowpass', 0.5); [0, 4, 7, 12].forEach((q, j) => tone(note(392, q), 0.6, 0.09, 'sawtooth', 0.3 + j * 0.1, null, 1800)); },
  lit() { [0, 7, 12].forEach((q, j) => tone(note(262, q), 0.8, 0.08, 'sawtooth', j * 0.08, null, 1400)); noise(0.8, 900, 0.1, 'bandpass', 0.6, 0, 0.1); },
  gather() { tone(110, 0.9, 0.08, 'sawtooth', 0, 90, 500); },
  thunder() { noise(1.6, 220, 0.3, 'lowpass', 0.6, 0, 0.1); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(392, q), 0.5, 0.09, 'sawtooth', j * 0.11, null, 1600)); },
  lose() { tone(196, 0.7, 0.12, 'sawtooth', 0, 147, 800); tone(147, 1.0, 0.12, 'sawtooth', 0.4, 98, 700); },
};
let shuffleT = 0;
function soundStep(G, dt) { if (!G || G.over || HEADLESS || MUTE || paused || G.choice) return; shuffleT -= dt; if (shuffleT <= 0 && G.foes.length) { shuffleT = 0.4; noise(0.12, 260, 0.02 + Math.min(0.05, G.foes.length / 2000), 'lowpass', 1); } }
