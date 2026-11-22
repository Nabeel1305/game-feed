// ===================== SOUND: the clinic (PLAYBOOK S1-S11) =====================
// Soft and friendly: water that runs while you rinse, the brush's gentle swish, the scaler's dry little scritch, the polisher's
// hum, the drill as a soft whine (its own switch in Settings: soft, quieter or off), a cheerful ding when a tooth comes clean,
// a warm chord when a repair is done, a sparkle for the smile. Music (its own switch): light, gentle clinic music.
let toolN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  pick() { tone(660, 0.05, 0.035, 'triangle'); tone(990, 0.05, 0.03, 'triangle', 0.04); },
  no() { if (!gate('no', 300)) return; tone(300, 0.12, 0.035, 'triangle', 0, 250, 900); },
  ouch() { if (!gate('ouch', 400)) return; tone(520, 0.18, 0.04, 'sine', 0, 380); },
  found() { tone(523, 0.12, 0.04, 'triangle'); tone(784, 0.18, 0.04, 'triangle', 0.08); },
  xray() { noise(0.6, 3000, 0.02, 'highpass', 0.7); tone(1200, 0.5, 0.012, 'sine', 0, 1250); },
  ding() { tone(1568, 0.25, 0.04, 'sine'); tone(2093, 0.3, 0.025, 'sine', 0.05); },
  fixed() { [0, 4, 7].forEach((q, j) => pluck(note(523, q), 0.7, 0.05, j * 0.07)); },
  creak() { if (!gate('creak', 120)) return; tone(160 * vary(0.1), 0.08, 0.03, 'sawtooth', 0, 140, 700); },
  gauge() { tone(220, 2.2, 0.02, 'triangle', 0, 520); },
  reassure() { tone(392, 0.2, 0.025, 'sine'); tone(494, 0.25, 0.025, 'sine', 0.12); },
  flip() { noise(0.15, 1500, 0.02, 'bandpass', 1); },
  smile() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(523, q), 1.0, 0.06, j * 0.08)); for (let i = 0; i < 6; i++) tone(2500 + Math.random() * 2000, 0.12, 0.012, 'sine', 0.3 + i * 0.07); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { [0, 2, 4, 7, 9].forEach((q, j) => pluck(note(523, q), 1.2, 0.07, j * 0.1)); },
  lose() { tone(330, 0.5, 0.05, 'triangle', 0, 311); tone(262, 0.8, 0.05, 'triangle', 0.35, 247); },
};
// the working sounds, while a tool is on the teeth (short pieces, so they stop when you stop)
function toolSound(G, dt) { const h = G.hand; if (!h.down || !G.tool) { toolN = 0; return; } toolN -= dt; if (toolN > 0) return; const sp = Math.min(3, h.sp), dv = SET.drill == null ? 1 : SET.drill;
  switch (G.tool) {
    case 'brush': if (sp > 0.2) { noise(0.12, 2500 + sp * 800, 0.02 + sp * 0.006, 'bandpass', 0.8); toolN = 0.09; } break;
    case 'scaler': if (sp > 0.1) { noise(0.05, 5000, 0.018, 'highpass', 1.5); toolN = 0.07; } break;
    case 'polish': tone(240, 0.16, 0.012, 'sawtooth', 0, 245, 900); toolN = 0.14; break;
    case 'drill': if (dv > 0) { tone(1700 * vary(0.01), 0.16, 0.006 * dv, 'sine', 0, 1720); tone(850, 0.16, 0.004 * dv, 'triangle'); } toolN = 0.14; break;
    case 'water': noise(0.2, 1800, 0.02, 'bandpass', 0.5); toolN = 0.16; break;
    case 'fill': case 'shaper': if (sp > 0.1) { noise(0.06, 900, 0.015, 'lowpass', 1); toolN = 0.1; } break;
    case 'light': tone(980, 0.2, 0.008, 'sine'); toolN = 0.18; break;
  } }
let mus = { t: 0, i: 0 };
const CHORDS = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [4, 7, 12]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return; if (G && SET.sfx) toolSound(G, dt);
  mus.t += dt; const beat = 0.42; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 8) % CHORDS.length], semi = q => 293.7 * Math.pow(2, q / 12);
  music(() => { const pat2 = [0, 1, 2, 1, 0, 2, 1, 2]; pluck(semi(ch[pat2[i % 8]]), 0.6, i % 2 ? 0.014 : 0.022); if (i % 8 === 0) pluck(semi(ch[0] - 12), 1.2, 0.03); if (i % 16 === 13) pluck(semi(ch[2] + 12), 0.8, 0.014, 0.1); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('waltz', { seed: 100, key: 0, bpm: 125 });
