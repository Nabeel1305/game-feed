// ===================== SOUND: the beach (PLAYBOOK S1-S11) =====================
// The ocean's hush all the time, the wave's roar growing behind you, the board's hiss on the face (louder in hard turns),
// spray, a deep muffled roar inside the barrel that opens up again on the way out, a thump and a splash for a wipeout.
// Music (its own switch): a relaxed, plucked island tune.
let oceanN = 0, hissN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  swell() { noise(1.6, 500, 0.04, 'lowpass', 0.4); },
  stand() { tone(392, 0.12, 0.04, 'triangle', 0, 523); },
  move(id, c = 0) { const base = { carve: 523, snap: 587, cutback: 659, air: 784, barrel: 880 }[id] || 523; noise(0.25, 2600, 0.05, 'highpass', 0.8); [0, 4, 7].slice(0, 1 + Math.min(2, c)).forEach((q, j) => pluck(note(base, q), 0.5, 0.045, j * 0.06)); },
  launch() { noise(0.35, 3200, 0.06, 'highpass', 0.6); },
  whoosh() { if (!gate('whoosh', 120)) return; noise(0.2, 1200, 0.03, 'bandpass', 1.4); },
  tube(inn) { if (inn) noise(1.2, 300, 0.06, 'lowpass', 0.5); else { noise(0.5, 3000, 0.05, 'highpass', 0.6); [0, 7, 12].forEach((q, j) => pluck(note(523, q), 0.6, 0.05, j * 0.07)); } },
  wipe() { noise(0.9, 700, 0.1, 'lowpass', 0.6); tone(110, 0.4, 0.06, 'sine', 0, 60); },
  cheer() { noise(1.4, 1000, 0.04, 'bandpass', 0.3); },
  fanfare() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 0.7, 0.06, j * 0.11)); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(523, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { this.fanfare(); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 330); tone(294, 0.8, 0.05, 'triangle', 0.3, 262); },
};
let mus = { t: 0, i: 0 };
const TUNE = [0, 4, 7, 9, 7, 4, 2, 0, -3, 0, 4, 2, 0, -3, -5, -3];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx) { oceanN -= dt; if (oceanN <= 0) { oceanN = 1.2; noise(1.5, 400, 0.012, 'lowpass', 0.3); }
    if (G && G.phase === 'ride' && !G.p.air) { const P = G.p, near = clamp(1 - (P.x - G.xb) / 20, 0, 1); hissN -= dt; if (hissN <= 0) { hissN = 0.18; noise(0.22, 2400 + P.v * 120, 0.006 + Math.min(0.03, P.v * 0.0015), 'bandpass', 0.7); noise(0.25, 260, 0.01 + near * 0.03 + (P.inTube ? 0.03 : 0), 'lowpass', 0.6); } } }
  mus.t += dt; const beat = 0.32; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++;
  music(() => { pluck(note(392, TUNE[i % TUNE.length]), 0.6, 0.012); if (i % 4 === 0) pluck(note(98, [0, 5, 7, 5][(i >> 2) % 4]), 0.9, 0.02); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('island', { seed: 109, key: 3, bpm: 106 });
