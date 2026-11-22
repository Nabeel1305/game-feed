// ===================== SOUND: up in the morning air (PLAYBOOK S1-S11) =====================
// The burner's roar (a soft rumble that swells while you hold), the hiss of the vent, the wind that grows with height, birds
// near the ground, a dog barking far below now and then; a whoosh as the marker drops and a thud as it lands, a chime that
// rises with the points, a bright fanfare for a bullseye; the basket's creak and bump on landing. Music (its own switch):
// a slow, warm waltz.
let windN = 0, birdN = 5, roarN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  burnStart() { noise(0.25, 300, 0.05, 'lowpass', 0.7); },
  vent() { noise(0.6, 3500, 0.03, 'highpass', 0.6); },
  drop() { noise(0.3, 1800, 0.03, 'bandpass', 1); tone(700, 0.25, 0.02, 'sine', 0, 300); },
  mark(p) { noise(0.08, 300, 0.05, 'lowpass', 1); const n = Math.round(p / 125); [0, 2, 4, 7, 9, 12, 14, 16].slice(0, Math.max(1, n)).forEach((q, j) => pluck(note(392, q), 0.5, 0.04, 0.08 + j * 0.06)); },
  bull() { [0, 4, 7, 12, 16, 19].forEach((q, j) => pluck(note(523, q), 1.0, 0.06, j * 0.07)); noise(0.8, 4000, 0.02, 'highpass', 0.5, 0.2); },
  bump() { noise(0.15, 250, 0.08, 'lowpass', 1); tone(90, 0.2, 0.05, 'sine'); tone(160 * vary(0.1), 0.2, 0.02, 'sawtooth', 0.05, 140, 600); },
  landed() { tone(160, 0.25, 0.03, 'sawtooth', 0, 150, 600); [0, 4, 7].forEach((q, j) => pluck(note(392, q + 5), 0.9, 0.05, 0.2 + j * 0.09)); },
  zap() { noise(0.5, 2500, 0.06, 'bandpass', 2); tone(120, 0.6, 0.05, 'square', 0, 60, 900); },
  no() { if (!gate('no', 300)) return; tone(260, 0.15, 0.035, 'triangle', 0, 220, 900); },
  bird() { if (!gate('bird', 2500)) return; const f = 2600 + Math.random() * 1200; for (let i = 0; i < 3 + ((Math.random() * 3) | 0); i++) tone(f * vary(0.06), 0.07, 0.012, 'sine', i * 0.11, f * 1.25); },
  dog() { if (!gate('dog', 9000)) return; for (let i = 0; i < 2; i++) tone(420, 0.08, 0.01, 'sawtooth', i * 0.22, 300, 1200); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q + 5), 1.2, 0.07, j * 0.11)); },
  lose() { tone(330, 0.5, 0.05, 'triangle', 0, 311); tone(262, 0.8, 0.05, 'triangle', 0.35, 247); },
};
let mus = { t: 0, i: 0 };
const CHORDS = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14], [7, 11, 14]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx && G && G.b) { const agl = G.b.y - groundAt(G, G.b.x, G.b.z), hi = clamp(agl / TOP, 0, 1);
    if (G.b.burn) { roarN -= dt; if (roarN <= 0) { roarN = 0.18; noise(0.24, 220 + Math.random() * 60, 0.045, 'lowpass', 0.8); noise(0.2, 900, 0.012, 'bandpass', 1); } }
    windN -= dt; if (windN <= 0) { windN = 2.4 + Math.random() * 1.5; noise(2.8, 250 + hi * 500, 0.012 + hi * 0.03, 'lowpass', 0.5); }
    birdN -= dt; if (birdN <= 0) { birdN = 5 + Math.random() * 7; if (agl < 80) sfx.bird(); else if (Math.random() < 0.15) sfx.dog(); } }
  mus.t += dt; const beat = 0.5; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 3) % CHORDS.length], semi = q => 261.6 * Math.pow(2, q / 12);
  music(() => { if (i % 3 === 0) pluck(semi(ch[0] - 12), 1.2, 0.03); else pluck(semi(ch[i % 3]), 0.6, 0.016); if (i % 12 === 7) pluck(semi(ch[2] + 12), 0.9, 0.014, 0.1); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('pastoral', { seed: 101, key: -2, bpm: 91 });
