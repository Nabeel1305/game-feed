
// ===================== SOUND: synthesized from the PLAYBOOK sound kit (S1-S11); give each game its own voice =====================
// Every sound: varied a little each time, short, through the one bus (the feed's Sound switch reaches it). soundCheck() renders
// each one offline in the tests: no errors, no clipping.
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  hit(combo = 1) { const b = note(523.3, Math.min(10, combo - 1)) * vary(0.02); tone(b, 0.16, 0.18, 'triangle'); tone(b * 2, 0.1, 0.06, 'sine', 0.01); noise(0.05, 3200, 0.08, 'highpass', 1); },
  miss() { if (!gate('miss', 90)) return; tone(220 * vary(0.04), 0.22, 0.2, 'sawtooth', 0, 140, 900); noise(0.12, 500, 0.12); },
  ding() { tone(988, 0.5, 0.12, 'sine'); tone(1480, 0.35, 0.05, 'sine', 0.02); },
  coin(i = 0) { const b = note(1046.5, Math.min(12, i)); tone(b, 0.15, 0.12, 'square', 0, b * 1.5, 3000); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.14, 'sine'); },
  win() { [0, 4, 7, 12].forEach((s, j) => tone(523.3 * Math.pow(2, s / 12), 0.35, 0.13, 'triangle', j * 0.09)); },
  lose() { tone(330, 0.5, 0.15, 'triangle', 0, 247); tone(247, 0.7, 0.15, 'triangle', 0.25, 185); },
};
