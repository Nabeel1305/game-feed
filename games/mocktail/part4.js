
// ===================== SOUND: the bar (PLAYBOOK S1-S11) =====================
// A glass set down, crisp ice clinks, the glug and trickle of pouring (it rises in pitch as the glass fills), the shaker's
// rattle, a spoon on glass, the soft thud of the muddler, leaves; a bell for each customer, a happy "mm!" or a disappointed
// sigh. Music (its own switch): relaxed lounge chords and a soft brushed beat.
let pourN = null;
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  combo(i = 0) { [0, 4, 7].forEach((q, j) => pluck(note(523, q + i), 0.4, 0.05, j * 0.06)); },
  bell() { tone(1568, 0.6, 0.05, 'sine'); tone(2093, 0.5, 0.03, 'sine', 0.08); },
  glass() { tone(2400 * vary(0.05), 0.12, 0.04, 'sine'); tone(3200, 0.08, 0.02, 'sine', 0.01); noise(0.03, 3000, 0.03, 'bandpass', 2); },
  ice(kind) { const n = kind === 'crushed' ? 6 : 3; for (let i = 0; i < n; i++) { tone(3000 + Math.random() * 1500, 0.06, 0.03, 'sine', i * 0.05); noise(0.03, 5000, 0.02, 'highpass', 1, i * 0.05); } },
  pourOn() { if (!actx || MUTE || !SET.sfx) return; if (pourN) return; pourN = { t: 0 }; noise(0.5, 900, 0.05, 'bandpass', 1.2, 0, 0.05); },
  pourOff() { pourN = null; tone(700, 0.05, 0.02, 'sine', 0, 900); },
  leaf() { noise(0.1, 2600, 0.04, 'bandpass', 1.4); },
  muddle() { tone(120, 0.1, 0.08, 'sine', 0, 80); noise(0.06, 800, 0.05, 'lowpass', 1); },
  shake() { if (!gate('shake', 80)) return; for (let i = 0; i < 4; i++) noise(0.03, 4000 + Math.random() * 2000, 0.05, 'bandpass', 3, i * 0.025); },
  stir() { for (let i = 0; i < 3; i++) tone(2600 + i * 200, 0.08, 0.02, 'sine', i * 0.1); },
  chat() { tone(330, 0.12, 0.03, 'triangle', 0, 392); tone(392, 0.12, 0.03, 'triangle', 0.13, 330); },
  happy() { tone(392, 0.15, 0.05, 'triangle', 0, 523); [0, 4, 7].forEach((q, j) => pluck(note(523, q), 0.6, 0.06, 0.1 + j * 0.08)); },
  sad() { tone(330, 0.5, 0.04, 'triangle', 0, 262); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  goal() { [0, 4, 7, 9, 12].forEach((q, j) => pluck(note(392, q), 0.9, 0.07, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 11, 14].forEach((q, j) => pluck(note(392, q), 1.0, 0.07, j * 0.11)); },
  lose() { tone(330, 0.4, 0.05, 'triangle', 0, 311); tone(262, 0.7, 0.05, 'triangle', 0.3, 247); },
};
let mus = { t: 0, i: 0 };
const CHORDS = [[0, 4, 7, 11], [5, 9, 12, 16], [2, 5, 9, 12], [7, 11, 14, 17]];
function soundStep(G, dt) { if (!actx) return; const D = G && G.drink;
  if (pourN && D && D.pouring && !MUTE && SET.sfx && !paused) { pourN.t += dt; if (pourN.t > 0.12) { pourN.t = 0; const into = D.vessel === 'shaker' ? D.shaker : D.parts, cap = D.vessel === 'shaker' ? 8 : GLASSES[D.glass].cap, f = into.reduce((a, b) => a + b.n, 0) / cap; noise(0.14, 600 + 900 * f, 0.04, 'bandpass', 2.5); } }
  if (MUTE || paused) return; mus.t += dt; const beat = 0.36; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 8) % 4];
  music(() => { if (i % 8 === 0) ch.forEach((q, j) => tone(note(196, q), 2.6, 0.012, 'sine', j * 0.03, null, 1600)); if (i % 2 === 0) noise(0.05, 6000, 0.008, 'highpass', 0.7); if (i % 4 === 2) tone(note(98, ch[0]), 0.3, 0.03, 'triangle', 0, null, 400); }); }
