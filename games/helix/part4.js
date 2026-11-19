
// ===================== SOUND: bounce, drop, smash (PLAYBOOK S1-S11) =====================
// A soft rubbery "bop" for each bounce (a little different each time, S2); a whoosh-and-note for each platform you drop
// through, a step higher for each one in a row (S5), so a long fall plays a run up the scale; a roar of flame for fire; a
// crash and a chord for a smash; a sad low "bonk" on red (S8); a bright fanfare at the bottom.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(392, q + 2), 0.5, 0.07, j * 0.07)); },
  bounce() { if (!gate('bounce', 80)) return; const f = 300 * vary(0.06); tone(f, 0.1, 0.08, 'sine', 0, f * 0.6); },
  pass(n = 1) { if (!gate('pass', 50)) return; noise(0.15, 1800 + n * 200, 0.03, 'bandpass', 1.2); tone(note(392, Math.min(14, n * 2)), 0.18, 0.05, 'triangle', 0.02); },
  fire() { noise(0.6, 700, 0.08, 'lowpass', 0.8); tone(110, 0.5, 0.05, 'sawtooth', 0, 220, 900); },
  smash() { noise(0.35, 2400, 0.12, 'bandpass', 0.7); tone(90, 0.35, 0.1, 'sine', 0, 50); [0, 4, 7].forEach((q, j) => tone(note(523, q), 0.25, 0.04, 'triangle', 0.05 + j * 0.04)); },
  shield() { tone(600, 0.25, 0.06, 'sine', 0, 900); },
  red() { tone(160, 0.5, 0.1, 'triangle', 0, 70); noise(0.2, 500, 0.06, 'lowpass', 1); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  tick() { if (!gate('tick', 45)) return; tone(1320, 0.05, 0.03, 'triangle'); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
function soundStep(G, dt) {}
