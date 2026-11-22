// ===================== SOUND: the sweet shop (PLAYBOOK S1-S11) =====================
// Everything soft, round and musical, because it is heard hundreds of times. A pop is a little plucked note with a wet click;
// each cascade in a move lifts it a step up the scale (S5), so a long cascade climbs like a tune. A bigger line pops louder
// (more voices). Making a special is a shimmering chord; a striped beam a bright swoosh; a wrapped blast a soft round thump;
// the colour bomb a sparkling run. A swap that does nothing is a gentle "boing". Frosting crackles; jelly squelches; a cherry
// coming out rings two bells. The Sugar Rush plays a rising run, one note per move turned into a stripe.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 2, 4].forEach((q, j) => pluck(note(523, q + 2), 0.5, 0.06, j * 0.07)); },
  swap() { noise(0.09, 2200, 0.025, 'bandpass', 1.2, 0, 0.02); },
  nope() { if (!gate('nope', 200)) return; tone(330, 0.14, 0.05, 'triangle', 0, 240); tone(250, 0.14, 0.04, 'triangle', 0.08, 300); },
  pop(casc = 0, n = 3) { if (!gate('pop', 40)) return; const st = Math.min(14, casc * 2 + (sfx.alt = (sfx.alt || 0) ^ 1)); pluck(note(523, st), 0.35, 0.07); noise(0.03, 3200, 0.04, 'bandpass', 1.5);
    if (n >= 4) pluck(note(523, st + 2), 0.35, 0.05, 0.02); if (n >= 6) pluck(note(523, st + 4), 0.4, 0.05, 0.04); },
  made(sp) { const b = sp === 'b' ? 7 : sp === 'w' ? 4 : 2; [0, 2, 4, 7].forEach((q, j) => tone(note(659, q + b), 0.4, 0.035, 'sine', j * 0.04)); },
  beam() { if (!gate('beam', 60)) return; noise(0.28, 3000, 0.05, 'bandpass', 0.6, 0, 0.01); tone(900, 0.22, 0.04, 'sawtooth', 0, 2400, 3000); },
  blast(big) { tone(big ? 70 : 95, big ? 0.6 : 0.35, 0.16, 'sine', 0, 45); noise(big ? 0.5 : 0.3, 700, 0.09, 'lowpass', 0.8, 0, 0.005); },
  zap() { for (let i = 0; i < 8; i++) tone(note(784, i * 2), 0.12, 0.03, 'sine', i * 0.035); noise(0.4, 6000, 0.03, 'highpass', 0.7); },
  jelly() { if (!gate('jelly', 60)) return; tone(180, 0.12, 0.05, 'sine', 0, 110); noise(0.08, 500, 0.03, 'lowpass', 2); },
  crack(left = 0) { if (!gate('crack', 50)) return; for (let i = 0; i < 4; i++) noise(0.025, 4500 - i * 400, 0.045, 'highpass', 1, i * 0.018); if (!left) tone(1200, 0.08, 0.03, 'triangle', 0.05); },
  cherry() { tone(1568, 0.3, 0.06, 'sine'); tone(2093, 0.4, 0.05, 'sine', 0.1); },
  tick() { if (!gate('tick', 45)) return; tone(1320 + Math.random() * 200, 0.05, 0.03, 'triangle'); },
  shuffle() { noise(0.4, 1500, 0.04, 'bandpass', 0.7, 0, 0.1); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  rushfire(i = 0) { tone(note(659, Math.min(16, i)), 0.18, 0.05, 'triangle'); noise(0.12, 3500, 0.025, 'bandpass', 0.8); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the band (tools/juice-kit.js): this game's music
bandStyle('arcade', { seed: 60, key: 3, bpm: 137 });
