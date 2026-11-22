// ===================== SOUND: under the sea (PLAYBOOK S1-S11) =====================
// Soft and wet: a deep hum of the sea and slow bubbles behind everything; a snap and a gulp for each bite (higher and brighter
// the more you eat in a row, S4), a rising chime and a big low swell when you grow, a cash-bright sparkle for a golden fish.
// Danger is low: a growl when a hunter notices you, a heartbeat while it hunts, a crunch if it catches you. A dash is a rush
// of water. The bed gets darker in the deep.
const sfx = {
  click() { tone(880, 0.04, 0.06, 'triangle', 0, 1100); },
  bite(n = 0, big) { const b = 300 + Math.min(10, n) * 22; noise(0.05, 2200, 0.07, 'bandpass', 2); tone(b * vary(0.05), 0.07, 0.1, 'triangle', 0, b * 0.6); tone(b * 1.5, 0.08, 0.04, 'sine', 0.05, b * 2.2);
    if (big) tone(110, 0.25, 0.12, 'sine', 0, 70); },
  gold() { [0, 4, 7, 12, 16].forEach((q, j) => tone(note(1046, q), 0.2, 0.05, 'sine', j * 0.045)); noise(0.2, 7000, 0.025, 'highpass', 1, 0.05); },
  grow(t = 1) { [0, 4, 7, 12].forEach((q, j) => pluck(note(262 + t * 18, q), 0.8, 0.11, j * 0.08)); tone(80, 0.9, 0.14, 'sine', 0, 55); noise(0.7, 500, 0.05, 'lowpass', 1); },
  newkind() { [0, 7, 12].forEach((q, j) => tone(note(784, q), 0.3, 0.05, 'triangle', 0.15 + j * 0.07)); },
  growl() { if (!gate('growl', 900)) return; tone(70, 0.6, 0.14, 'sawtooth', 0, 55, 300); tone(92, 0.5, 0.06, 'sawtooth', 0.05, 70, 260); },
  hunt() { if (!gate('hunt', 700)) return; tone(58, 0.14, 0.16, 'sine', 0, 45); tone(58, 0.14, 0.12, 'sine', 0.22, 45); },
  beat() { if (!gate('beat', 380)) return; tone(56, 0.12, 0.1, 'sine', 0, 44); tone(56, 0.1, 0.07, 'sine', 0.18, 44); },
  escaped() { tone(392, 0.25, 0.05, 'triangle', 0, 523); tone(523, 0.3, 0.05, 'triangle', 0.12, 659); },
  dash() { if (!gate('dash', 350)) return; noise(0.35, 900, 0.06, 'bandpass', 0.8); tone(180, 0.3, 0.03, 'sine', 0, 320); },
  sting() { tone(1600, 0.12, 0.05, 'sawtooth', 0, 900, 4000); noise(0.12, 5000, 0.04, 'highpass'); },
  spike() { tone(700, 0.08, 0.06, 'square', 0, 400, 2400); },
  caught() { noise(0.18, 600, 0.16, 'lowpass', 1); tone(90, 0.4, 0.16, 'sawtooth', 0, 50, 500); tone(60, 0.6, 0.12, 'sine', 0.1, 40); },
  bubble() { const f = 500 + Math.random() * 600; tone(f, 0.06, 0.012, 'sine', 0, f * 1.8); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.08, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.12, j * 0.1)); tone(98, 1.2, 0.1, 'sine', 0, 65); },
  lose() { tone(330, 0.5, 0.1, 'triangle', 0, 247); tone(247, 0.7, 0.1, 'triangle', 0.25, 196); },
};
const AM = { on: false }; let bubT = 1;
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.sea = bed(260, 0.7, 0.02, 0.1, 'lowpass'); AM.hiss = bed(1800, 0.6, 0, 0.2, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, deep = G ? G.place === 3 : false;
  if (AM.sea) AM.sea.set(quiet ? 0 : deep ? 0.03 : 0.02, 0.8); if (AM.hiss) AM.hiss.set(!quiet && G && G.me.dashing ? 0.025 : 0, 0.15);
  if (quiet) return; bubT -= dt; if (bubT <= 0) { bubT = 0.6 + Math.random() * 2.2; sfx.bubble(); }
  if (G.hunted) sfx.beat();
}
// the band (tools/juice-kit.js): this game's music
bandStyle('tense', { seed: 35, key: -3, bpm: 99 });
