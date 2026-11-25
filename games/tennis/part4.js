
// ===================== SOUND: the court (PLAYBOOK S1-S11) =====================
// The pock of the strings (harder and higher for a drive, softer for a slice or a lob), the ball's bounce, quick footsteps, the
// swish of a swing, the net's thud, the line call, applause that grows with the rally, a groan. Music (its own switch): soft
// and light, quieter still during a rally.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  combo(i = 0) { [0, 4, 7].forEach((q, j) => pluck(note(523, q + i), 0.4, 0.05, j * 0.06)); },
  toss() { tone(420, 0.12, 0.03, 'sine', 0, 640); },
  whoosh() { if (!gate('whoosh', 120)) return; noise(0.16, 1800, 0.05, 'bandpass', 0.8, 0, 0.04); },
  hit(p = 0.8, kind) { const soft = kind === 'slice' || kind === 'lob' || kind === 'drop'; tone((soft ? 520 : 640 + p * 220) * vary(0.04), 0.06, 0.16, 'triangle'); noise(0.04, soft ? 1800 : 3000, 0.14, 'bandpass', 2); tone(1400, 0.03, 0.04, 'sine', 0.005); },
  bounce() { if (!gate('bnc', 60)) return; tone(190 * vary(0.05), 0.07, 0.09, 'sine', 0, 140); noise(0.03, 900, 0.04, 'lowpass', 1); },
  net() { tone(110, 0.2, 0.12, 'sine', 0, 80); noise(0.2, 600, 0.08, 'lowpass', 1); },
  call() { tone(760, 0.18, 0.05, 'square', 0, null, 1400); },
  cheer(n = 1) { const a = Math.min(1, 0.3 + n / 12); for (let i = 0; i < 12; i++) noise(0.04, 1500 + Math.random() * 1500, 0.035 * a, 'bandpass', 1.5, i * 0.05 + Math.random() * 0.04); noise(1.0, 1100, 0.03 * a, 'bandpass', 0.5, 0.05, 0.2); },
  groan() { tone(250, 0.6, 0.015, 'sawtooth', 0, 190, 700); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  goal() { [0, 4, 7, 9, 12].forEach((q, j) => pluck(note(392, q), 0.9, 0.07, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 11, 14].forEach((q, j) => pluck(note(392, q), 1.0, 0.07, j * 0.11)); sfx.cheer(12); },
  lose() { tone(330, 0.4, 0.05, 'triangle', 0, 311); tone(262, 0.7, 0.05, 'triangle', 0.3, 247); },
};
let mus = { t: 0, i: 0 }, footN = 0;
const CHORDS = [[0, 4, 7], [5, 9, 12], [2, 5, 9], [7, 11, 14]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return; const live = G && !G.over && G.phase === 'rally';
  if (G && SET.sfx) { const v = Math.hypot(G.me.vx, G.me.vz); if (v > 1.5) { footN += dt * v * 0.5; if (footN > 1) { footN = 0; noise(0.03, 2200, 0.02, 'bandpass', 2); } } }
  mus.t += dt; const beat = 0.5; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 8) % 4];
  music(() => { const q = live ? 0.35 : 1; if (i % 8 === 0) ch.forEach((x, j) => tone(note(196, x), 3.6, 0.012 * q, 'sine', j * 0.04, null, 1500)); if (i % 2 === 0) pluck(note(392, ch[(i / 2) % 3 | 0]), 0.8, 0.025 * q); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('sport', { seed: 93, key: 0, bpm: 118, lead: { i: 'pizz' }, comp: { i: 'keys' }, A: [0, 3, 0, 4], tune: ['4...0...2...4...', '5...0...3...5...', '6...1...4...6...'], d: { k: 'x.......x.......', c: '....x.......x...', q: 'x.x.x.x.x.x.x.x.' } });
