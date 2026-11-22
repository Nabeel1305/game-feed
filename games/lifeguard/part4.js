// ===================== SOUND: the beach (PLAYBOOK S1-S11) =====================
// Waves rolling in (noise swells), gulls now and then, the crowd's murmur; your whistle (a bright two-note trill); running on
// sand, the splash as you dive in and as you grab someone; a warm chord and a little applause when they are safe. When someone
// is in trouble the music gains a quiet pulse underneath (never an alarm). Music (its own switch): a sunny ukulele-like pluck.
let waveN = 0, gullN = 4;
const sfx = {
  click() { tone(880, 0.04, 0.04, 'triangle', 0, 1100); },
  whistle() { tone(2300 * vary(0.02), 0.12, 0.05, 'sine', 0, 2500); tone(2700, 0.18, 0.045, 'sine', 0.12, 2650); },
  go() { tone(2400, 0.4, 0.05, 'sine', 0, 2600); for (let i = 0; i < 4; i++) noise(0.05, 1500, 0.025, 'bandpass', 1.5, 0.1 + i * 0.12); },
  grab() { noise(0.35, 1200, 0.06, 'lowpass', 0.8); tone(330, 0.2, 0.04, 'triangle', 0.05, 440); },
  saved() { [0, 2, 4, 7].forEach((q, j) => pluck(note(392, q + 3), 1.1, 0.07, j * 0.08)); for (let i = 0; i < 14; i++) noise(0.03, 2500 + Math.random() * 1500, 0.02, 'bandpass', 3, 0.35 + Math.random() * 0.8); },
  tense() { if (!gate('tense', 1500)) return; tone(196, 0.5, 0.03, 'sine', 0, 185); },
  missed() { tone(90, 1.4, 0.04, 'sawtooth', 0, 140, 600); noise(1.2, 800, 0.03, 'lowpass', 0.8); },
  flag() { noise(0.2, 2200, 0.04, 'bandpass', 2); tone(523, 0.15, 0.04, 'triangle', 0.05); },
  wind() { noise(1.6, 500, 0.05, 'lowpass', 0.6); },
  no() { if (!gate('no', 250)) return; tone(240, 0.12, 0.04, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  gull() { if (!gate('gull', 3000)) return; for (let i = 0; i < 2 + ((Math.random() * 2) | 0); i++) tone(1500 + Math.random() * 300, 0.25, 0.012, 'sawtooth', i * 0.3, 1100, 2600); },
  win() { [0, 2, 4, 7, 9].forEach((q, j) => pluck(note(392, q + 5), 1.2, 0.08, j * 0.12)); },
  lose() { tone(330, 0.5, 0.05, 'triangle', 0, 311); tone(262, 0.8, 0.05, 'triangle', 0.35, 247); },
};
let mus = { t: 0, i: 0 };
const CHORDS = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx) { waveN -= dt; if (waveN <= 0) { waveN = 2.6 + Math.random() * 1.6; noise(2.2, 600 + Math.random() * 300, 0.035, 'lowpass', 0.6); noise(1.4, 2400, 0.008, 'highpass', 0.5, 0.6); }
    gullN -= dt; if (gullN <= 0) { gullN = 6 + Math.random() * 9; if (G && G.sky !== 'overcast') sfx.gull(); } }
  mus.t += dt; const beat = 0.36; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 8) % CHORDS.length], trouble = G && G.sw && G.sw.some(s => s.st === 'trouble');
  const semi = q => 261.6 * Math.pow(2, q / 12);
  music(() => { const pat = [0, 2, 1, 2, 0, 2, 1, 2]; pluck(semi(ch[pat[i % 8]]), 0.7, i % 2 ? 0.02 : 0.032); if (i % 8 === 0) pluck(semi(ch[0] - 12), 1.2, 0.04); if (i % 16 === 6) pluck(semi(ch[2] + 12), 0.8, 0.02, 0.1);
    if (trouble && i % 2 === 0) tone(semi(ch[0] - 24), 0.25, 0.022, 'sine'); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('island', { seed: 96, key: 1, bpm: 109 });
