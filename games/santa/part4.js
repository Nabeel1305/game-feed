// ===================== SOUND: a quiet night (PLAYBOOK S1-S11) =====================
// Sleigh bells and a soft whoosh in flight; a crunch of snow on landing; a sooty thump down the chimney; inside: a crackling
// fire, soft footsteps (louder running), creaks, a meow, a snore that catches when someone stirs; a chime for each present,
// a jingle for each house. Music (its own switch): a gentle festive tune, softer inside while you sneak.
let bellN = 0, fireN = 0, stepN2 = 0, snoreN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  land() { noise(0.25, 900, 0.06, 'lowpass', 0.8); [0, 4, 7].forEach((q, j) => tone(note(1568, q), 0.12, 0.02, 'sine', j * 0.04)); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  slip() { tone(500, 0.4, 0.04, 'sawtooth', 0, 200, 1400); },
  thump() { noise(0.12, 300, 0.06, 'lowpass', 1); },
  chimney() { noise(0.5, 400, 0.05, 'lowpass', 0.5); tone(220, 0.3, 0.04, 'sine', 0.1, 110); },
  place(ok) { if (ok) [0, 7, 12].forEach((q, j) => pluck(note(784, q), 0.5, 0.04, j * 0.07)); else tone(330, 0.2, 0.03, 'triangle', 0, 294); },
  stocking() { [0, 4].forEach((q, j) => pluck(note(1047, q), 0.4, 0.03, j * 0.06)); },
  delivered() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(1047, q), 0.18, 0.03, 'sine', j * 0.07)); noise(0.6, 6000, 0.01, 'highpass', 1); },
  bump() { noise(0.12, 500, 0.07, 'lowpass', 1); },
  creak() { tone(180, 0.35, 0.05, 'sawtooth', 0, 140, 600); },
  meow() { tone(700, 0.35, 0.04, 'triangle', 0, 500); },
  toy() { tone(1200, 0.1, 0.03, 'square', 0, 1600, 3000); },
  wake() { tone(392, 0.25, 0.05, 'triangle', 0, 523); tone(523, 0.4, 0.05, 'triangle', 0.2, 392); },
  fanfare() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 0.7, 0.06, j * 0.11)); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(523, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { this.fanfare(); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 330); tone(294, 0.8, 0.05, 'triangle', 0.3, 262); },
};
let mus = { t: 0, i: 0 };
const TUNE = [4, 4, 4, -1, 4, 4, 4, -1, 4, 7, 0, 2, 4, -1, -1, -1];
function soundStep(G, dt) { if (!actx || MUTE || paused) return; const inside = G && G.phase === 'in';
  if (SET.sfx && G && !G.over) {
    if (G.phase === 'fly') { bellN -= dt; if (bellN <= 0) { bellN = 0.32; tone(2093 + Math.random() * 200, 0.08, 0.012, 'sine'); tone(2637, 0.06, 0.008, 'sine', 0.05); } }
    if (inside) { const I = G.in, m = Math.hypot(G.stick.x, G.stick.y); fireN -= dt; if (fireN <= 0) { fireN = 0.15 + Math.random() * 0.3; noise(0.05, 3000, 0.006, 'highpass', 1); }
      if (m > 0.15) { stepN2 -= dt; if (stepN2 <= 0) { stepN2 = m > 0.7 ? 0.2 : 0.42; noise(0.06, m > 0.7 ? 700 : 400, m > 0.7 ? 0.04 : 0.01, 'lowpass', 1); } }
      if (I.H.room.sl) { snoreN -= dt; if (snoreN <= 0) { snoreN = 2.4; if (!I.stir) noise(1.0, 220, 0.012, 'lowpass', 1); } } } }
  mus.t += dt; const beat = 0.3; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, q = TUNE[i % TUNE.length];
  music(() => { if (q >= 0) pluck(note(523, q), 0.5, inside ? 0.005 : 0.013); if (i % 4 === 0) pluck(note(131, [0, 5, 7, 0][(i >> 2) % 4]), 0.9, inside ? 0.008 : 0.02); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('fest', { seed: 110, key: 1, bpm: 103 });
