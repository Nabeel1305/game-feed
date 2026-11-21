// ===================== SOUND: the stadium (PLAYBOOK S1-S11) =====================
// The crowd's roar rising on a long run, the quarterback's "hut", the whistle, padded hits (a low thump and a crack), the
// whoosh of a juke, the chain gang's rattle on a first down, a horn and a brass sting for a touchdown. Music (its own
// switch): a marching drumline with brass stabs, quieter in play.
let roarN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  hut() { tone(180, 0.12, 0.08, 'sawtooth', 0, 140, 700); tone(170, 0.12, 0.07, 'sawtooth', 0.28, 130, 700); },
  whistle() { tone(2600, 0.5, 0.05, 'sine', 0, 2650); tone(2900, 0.45, 0.02, 'sine', 0.02); },
  thud() { tone(90, 0.15, 0.1, 'sine', 0, 60); noise(0.08, 600, 0.05, 'lowpass', 1); },
  throwB() { noise(0.25, 1600, 0.03, 'bandpass', 1); },
  catchB() { tone(120, 0.1, 0.08, 'sine', 0, 80); noise(0.06, 900, 0.04, 'lowpass', 1); },
  hit() { tone(70, 0.3, 0.14, 'sine', 0, 45); noise(0.12, 900, 0.12, 'lowpass', 1); noise(0.05, 3000, 0.05, 'bandpass', 2, 0.02); },
  pad() { if (!gate('pad', 120)) return; tone(110, 0.1, 0.06, 'sine', 0, 70); noise(0.06, 800, 0.05, 'lowpass', 1); },
  whoosh() { noise(0.25, 1200, 0.05, 'bandpass', 0.8); },
  chain() { for (let i = 0; i < 6; i++) noise(0.03, 4000, 0.03, 'bandpass', 4, i * 0.04); [0, 4, 7].forEach((q, j) => tone(note(392, q + 2), 0.25, 0.05, 'triangle', 0.15 + j * 0.07)); },
  td(us) { tone(220, 1.2, 0.08, 'square', 0, null, 1200); if (us) { [0, 4, 7, 12].forEach((s, j) => tone(392 * Math.pow(2, s / 12), 0.5, 0.08, 'sawtooth', 0.3 + j * 0.12, null, 2200)); noise(2.2, 900, 0.08, 'bandpass', 0.5, 0.2); } },
  no() { if (!gate('no', 250)) return; tone(220, 0.12, 0.05, 'triangle', 0, 180, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(i = 0) { [0, 4, 7].forEach((q, j) => tone(note(392, q + i), 0.3, 0.05, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); },
  win() { [0, 4, 7, 12].forEach((s, j) => tone(392 * Math.pow(2, s / 12), 0.4, 0.09, 'sawtooth', j * 0.1, null, 2200)); },
  lose() { tone(330, 0.5, 0.06, 'triangle', 0, 247); tone(247, 0.7, 0.06, 'triangle', 0.25, 185); },
};
let mus = { t: 0, i: 0 };
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (G && !G.over && SET.sfx && G.phase === 'live') { const o = G.ball.own; roarN += dt; if (roarN > 0.4) { roarN = 0; const run = o ? Math.max(0, o.z - G.los) : 0; noise(0.6, 700, 0.01 + Math.min(0.05, run * 0.003), 'bandpass', 0.6); } }
  mus.t += dt; const beat = 0.25; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, live = G && !G.over && G.phase === 'live';
  music(() => { const v = live ? 0.35 : 1; if (i % 4 === 0) tone(70, 0.2, 0.08 * v, 'sine', 0, 50); if (i % 2 === 1 || i % 8 === 6) noise(0.06, 2200, 0.035 * v, 'bandpass', 2); if (i % 16 === 0) [0, 4, 7].forEach(q => tone(note(196, q), 0.35, 0.025 * v, 'sawtooth', 0, null, 1600)); if (i % 16 === 8) [2, 5, 9].forEach(q => tone(note(196, q), 0.35, 0.02 * v, 'sawtooth', 0, null, 1600)); }); }
