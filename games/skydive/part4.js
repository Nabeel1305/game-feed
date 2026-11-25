// ===================== SOUND: the sky (PLAYBOOK S1-S11) =====================
// The plane's drone as you leave it; in freefall the rushing roar of the wind, louder and higher tucked; the canopy opening:
// a deep fabric WHUMP and the roar cut to a soft flutter; quiet wind under the canopy, the canopy rustling as you turn; a
// whoosh through a ring with a chime that climbs; the altimeter's beep; a soft thud and a bright chord for a soft landing.
// Music (its own switch): light, open and uplifting, with room for the wind.
let windN = 0, engN = 0, flutN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  open() { noise(0.25, 140, 0.12, 'lowpass', 0.9); noise(0.5, 600, 0.05, 'bandpass', 0.5, 0.05); tone(70, 0.4, 0.08, 'sine', 0, 45); },
  flare() { noise(0.4, 900, 0.03, 'bandpass', 0.6); },
  beep(n = 1) { for (let i = 0; i < n + 1; i++) tone(1760, 0.07, 0.035, 'square', i * 0.14, null, 3000); },
  ring(n = 0) { noise(0.35, 2400, 0.03, 'bandpass', 0.7); [0, 4, 7].forEach((q, j) => pluck(note(523, q + Math.min(12, n * 2)), 0.7, 0.05, j * 0.06)); },
  touch(q) { noise(0.2, q === 'soft' ? 300 : 180, q === 'soft' ? 0.05 : 0.1, 'lowpass', 0.9); if (q === 'soft') [0, 4, 7, 12].forEach((n, j) => pluck(note(392, n + 5), 1.0, 0.05, 0.1 + j * 0.08)); else tone(90, 0.3, 0.07, 'sine', 0, 55); },
  no() { if (!gate('no', 300)) return; tone(260, 0.15, 0.035, 'triangle', 0, 220, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q + 5), 1.2, 0.07, j * 0.11)); },
  lose() { tone(330, 0.5, 0.05, 'triangle', 0, 311); tone(262, 0.8, 0.05, 'triangle', 0.35, 247); },
};
let mus = { t: 0, i: 0 };
const CH = [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx && G && G.p) { const p = G.p, ph = p.phase, fall = clamp(-p.vy / 64, 0, 1);
    if (G.t < 4 && !G.lesson) { engN -= dt; if (engN <= 0) { engN = 0.3; tone(82, 0.35, 0.02 * (1 - G.t / 4), 'sawtooth', 0, null, 300); } }
    windN -= dt; if (windN <= 0) { windN = 0.28; if (ph === 'free') noise(0.36, 500 + fall * 1400, 0.03 + fall * 0.05, 'bandpass', 0.4); else if (ph === 'canopy') noise(0.4, 400, 0.012, 'lowpass', 0.5); }
    if (ph === 'canopy' && Math.abs(G.stick.x) > 0.4) { flutN -= dt; if (flutN <= 0) { flutN = 0.5; noise(0.2, 1500, 0.012, 'bandpass', 1.2); } } }
  mus.t += dt; const beat = 0.48; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CH[Math.floor(i / 8) % CH.length], semi = q => 261.6 * Math.pow(2, q / 12);
  music(() => { if (i % 4 === 0) pluck(semi(ch[0] - 12), 1.6, 0.025); pluck(semi(ch[(i * 3) % 4] + 12), 0.7, 0.011); if (i % 8 === 6) pluck(semi(ch[3] + 12), 1.0, 0.012, 0.1); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('synth', { seed: 103, key: 1, bpm: 112, lead: { i: 'saw' }, comp: { i: 'pad', p: 'P' }, A: [0, 3, 0, 4], tune: ['9...7...4...7...', 'a...7...5...7...', '8...6...4...6...'], sc: 'maj' });
