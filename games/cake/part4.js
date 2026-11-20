
// ===================== SOUND: a calm bakery (PLAYBOOK S1-S11) =====================
// A soft music-box tune over a warm pad (slow, never pushy); the sweep of the knife is a soft "shhh" that follows your thumb;
// each swirl is a squeeze a step higher than the last (S5), each tier and topping a soft plop; a bell when the customer comes
// in, an "ooh" for a great cake, the till for the coins.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  bell() { tone(1568, 0.6, 0.05, 'sine'); tone(2093, 0.5, 0.03, 'sine', 0.12); },
  stage() { pluck(note(523, 4), 0.5, 0.05); },
  plop(q = 'good', n = 0) { tone(note(196, Math.min(10, n | 0)) * (q === 'perfect' ? 1.5 : 1), 0.18, 0.09, 'sine', 0, 90); noise(0.06, 900, 0.03, 'lowpass', 1); if (q === 'perfect') pluck(note(784, 4), 0.5, 0.06, 0.05); },
  bloop() { tone(330, 0.2, 0.07, 'sine', 0, 660); },
  squish(n = 1) { noise(0.18, 1100 + n * 60, 0.05, 'bandpass', 2.5); tone(note(392, Math.min(14, n | 0)), 0.25, 0.05, 'triangle', 0.03); },
  drip() { for (let i = 0; i < 5; i++) tone(note(784, 9 - i), 0.12, 0.03, 'sine', i * 0.09, note(784, 8 - i)); },
  ooh() { tone(330, 0.6, 0.05, 'sine', 0, 440, 900); tone(415, 0.6, 0.03, 'sine', 0.02, 554, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); noise(0.08, 3000, 0.04, 'bandpass', 2, 0.5); tone(1760, 0.3, 0.04, 'triangle', 0.55); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 349); tone(330, 0.7, 0.05, 'triangle', 0.3, 294); },
};
// the music box: a gentle tune, a beat every 0.42 s; the knife's "shhh" while icing
let mus = { t: 0, i: 0 }, knifeB = null;
const TUNE = [0, 2, 4, 7, 4, 2, 4, 9, 7, 4, 2, 0, 2, 4, 2, -1];
function soundStep(G, dt) { if (!actx || MUTE) return; if (!knifeB) knifeB = bed(2600, 0.8, 0.0, 0.3);
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'); if (paused) { if (knifeB) knifeB.set(0, 0.1); return; }
  if (knifeB) knifeB.set(G && G.stage === 'ice' && G.thumb && G.spreading && !G.over ? 0.06 : 0, 0.08);
  mus.t += dt; if (mus.t >= 0.42) { mus.t -= 0.42; const n = TUNE[mus.i % TUNE.length], bar = Math.floor(mus.i / 16) % 4; mus.i++;
    if (n >= 0 && (mus.i % 2 === 1 || Math.random() < 0.55)) pluck(note(523, n + [0, 2, 0, 3][bar]), 0.9, home ? 0.025 : 0.018);
    if (mus.i % 8 === 1) tone(note(131, [0, 3, 5, 4][bar]), 3.0, home ? 0.025 : 0.018, 'sine'); } }
