// ===================== SOUND: the hotel (PLAYBOOK S1-S11) =====================
// The desk bell for a new guest, a room's telephone trill for room service, the door for a check-out, the lift's ding at a
// floor, a soft pick-up clink (two for a double fetch), the brush of a scrub, and the tip: a coin and a little chord that
// climbs with each job in a streak (S4). A huff when a guest gives up.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  bell() { if (!gate('bell', 200)) return; tone(2093 * vary(0.01), 0.7, 0.06, 'sine'); tone(3140, 0.4, 0.02, 'sine'); },
  ring() { if (!gate('ring', 300)) return; for (let i = 0; i < 4; i++) { tone(1320, 0.05, 0.035, 'square', i * 0.07, 0, 3000); tone(1660, 0.05, 0.03, 'square', i * 0.07 + 0.035, 0, 3000); } },
  door() { if (!gate('door', 250)) return; noise(0.12, 320, 0.09, 'lowpass', 1); tone(95, 0.18, 0.07, 'sine', 0, 60); },
  take(n = 1) { tone(note(659, Math.min(6, n * 2)), 0.08, 0.06, 'triangle', 0, 0, 3500); },
  pick(n = 1) { for (let i = 0; i < Math.min(3, n); i++) { tone(2200 * vary(0.03), 0.06, 0.04, 'sine', i * 0.07); tone(3300, 0.04, 0.02, 'sine', i * 0.07 + 0.01); } },
  ding() { if (!gate('ding', 200)) return; tone(1175, 0.45, 0.05, 'sine'); tone(1760, 0.3, 0.02, 'sine', 0.02); },
  scrub() { noise(0.5, 2600, 0.04, 'bandpass', 1); noise(0.35, 1800, 0.035, 'bandpass', 1, 0.5); },
  tip(chain = 0) { const b = note(784, Math.min(8, chain * 2)); tone(b, 0.16, 0.07, 'triangle'); tone(b * 2, 0.1, 0.03, 'sine', 0.01); [0, 4, 7].forEach((q, j) => tone(note(b, q), 0.18, 0.035, 'triangle', 0.08 + j * 0.05)); },
  huff() { noise(0.25, 900, 0.08, 'bandpass', 1); tone(240, 0.3, 0.06, 'sawtooth', 0, 150, 900); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
// the band (tools/juice-kit.js): this game's music
bandStyle('jazz', { seed: 48, key: -1, bpm: 100 });
