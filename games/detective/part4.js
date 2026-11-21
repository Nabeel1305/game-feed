// ===================== SOUND: a quiet mystery (PLAYBOOK S1-S11) =====================
// The room's own air (a clock ticking in the house, rain on a hotel window, the hum of the museum, the train's rattle, an
// office's buzz), footsteps between rooms, the soft thump of picking something up, a bright little chime for a clue and a
// rising one for a key clue, pencil scratches for notes, a low "dum" when a story cracks, a gavel for the accusation.
// Music (its own switch): soft walking bass and brushed chords; it lifts when a contradiction is uncovered.
let ambN = 0, lift = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  pick() { noise(0.08, 500, 0.04, 'lowpass', 1); },
  tap() { if (!gate('tap', 120)) return; tone(1200, 0.03, 0.012, 'sine'); },
  clue(key) { [0, 4, 7].concat(key ? [12] : []).forEach((q, j) => pluck(note(523, q), 0.8, 0.05, j * 0.07)); noise(0.2, 3000, 0.012, 'highpass', 0.6, 0.1); },
  talk() { for (let i = 0; i < 3; i++) tone(260 + Math.random() * 80, 0.06, 0.012, 'triangle', i * 0.09, null, 900); noise(0.15, 2500, 0.008, 'bandpass', 2, 0.05); },
  gotcha() { tone(98, 0.6, 0.07, 'sine', 0, 82); [0, 3, 7].forEach((q, j) => pluck(note(220, q), 1.0, 0.05, 0.15 + j * 0.05)); lift = 8; },
  fact() { [0, 7].forEach((q, j) => pluck(note(659, q), 0.6, 0.04, j * 0.06)); },
  hint() { tone(880, 0.25, 0.03, 'sine', 0, 1320); },
  step() { for (let i = 0; i < 3; i++) noise(0.06, 300, 0.035, 'lowpass', 1, i * 0.22); },
  wrong() { tone(196, 0.45, 0.05, 'triangle', 0, 185); tone(147, 0.6, 0.04, 'triangle', 0.25, 139); },
  solved() { noise(0.1, 200, 0.12, 'lowpass', 1); tone(80, 0.3, 0.08, 'sine'); [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.4, 0.06, 0.2 + j * 0.1)); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { [0, 4, 7, 11, 14].forEach((q, j) => pluck(note(349, q), 1.4, 0.06, j * 0.12)); },
  lose() { tone(262, 0.6, 0.05, 'triangle', 0, 247); tone(196, 1.0, 0.05, 'triangle', 0.4, 185); },
};
let mus = { t: 0, i: 0 };
const BASS = [0, 3, 5, 6, 7, 5, 3, 2], CH = [[0, 3, 7, 10], [5, 8, 12, 15], [7, 10, 14, 17], [3, 7, 10, 14]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx && G && G.place) { ambN -= dt; if (ambN <= 0) { const id = G.place.id; ambN = id === 'train' ? 0.55 : id === 'home' ? 1 : 2.5;
    if (id === 'home') tone(1800, 0.02, 0.008, 'square'); else if (id === 'train') { noise(0.08, 400, 0.02, 'lowpass', 1); noise(0.08, 400, 0.016, 'lowpass', 1, 0.14); } else if (id === 'hotel') noise(2.6, 3000, 0.006, 'highpass', 0.5); else noise(2.6, 120, 0.01, 'lowpass', 0.5); } }
  mus.t += dt; const beat = 0.5; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CH[Math.floor(i / 8) % CH.length], D = 110, semi = q => D * Math.pow(2, q / 12); if (lift > 0) lift--;
  music(() => { pluck(semi(BASS[i % 8]), 0.5, 0.03); if (i % 4 === 1) ch.forEach((q, j) => tone(semi(q + 12), 0.4, 0.006, 'triangle', j * 0.01, null, 1400)); if (i % 2 === 0) noise(0.12, 4000, 0.004, 'highpass', 0.5);
    if (lift > 0) pluck(semi(ch[i % 4] + 24), 0.6, 0.014); }); }
