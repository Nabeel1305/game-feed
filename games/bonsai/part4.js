// ===================== SOUND: the garden (PLAYBOOK S1-S11) =====================
// Quiet and wooden: a soft rustle as a branch grows, rising a step for each one grown in a row (S4); a clean snip for a cut,
// then a light patter of twigs; a little pop and a flutter for a caterpillar flicked away; a dull crunch if one eats. Each
// season has its chime (a koto-like pluck). Birdsong and a breeze in the background, very low. Nothing harsh.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  go() { pluck(note(392, 0), 0.6, 0.09); pluck(note(392, 2), 0.7, 0.08, 0.12); },
  grow(n = 1) { const b = note(523, Math.min(10, n - 1)); noise(0.18, 2400, 0.03, 'bandpass', 1.2); pluck(b, 0.4, 0.07, 0.03); },
  wild() { if (!gate('wild', 500)) return; noise(0.35, 1400, 0.035, 'bandpass', 0.8); tone(300, 0.3, 0.03, 'triangle', 0, 420); },
  snip() { noise(0.04, 5200, 0.07, 'highpass', 1); tone(2200, 0.03, 0.03, 'square', 0, 1600, 3000); noise(0.25, 1800, 0.025, 'bandpass', 0.8, 0.08); },
  flick() { tone(500, 0.08, 0.06, 'triangle', 0, 1200); noise(0.12, 3000, 0.025, 'bandpass', 2, 0.04); },
  pest() { if (!gate('pest', 900)) return; tone(180, 0.12, 0.03, 'triangle', 0, 220); tone(200, 0.12, 0.025, 'triangle', 0.14, 170); },
  eaten() { noise(0.3, 700, 0.06, 'lowpass', 1); tone(140, 0.25, 0.05, 'triangle', 0, 100); },
  season(s = 0) { const base = [523, 587, 440, 392][s % 4]; [0, 2, 4].forEach((q, j) => pluck(note(base, q), 0.9, 0.08, j * 0.12)); },
  nosap() { if (!gate('nosap', 400)) return; tone(300, 0.15, 0.05, 'triangle', 0, 220, 900); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.11, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.11); },
  judge(i = 0) { tone(note(392, i), 0.12, 0.04, 'sine'); },
  win() { [0, 2, 4, 7, 9].forEach((q, j) => pluck(note(392, q), 1.1, 0.1, j * 0.12)); },
  lose() { pluck(330, 0.6, 0.09); pluck(262, 0.9, 0.09, 0.25); },
};
const AM = { on: false, bird: 3 };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.breeze = bed(600, 0.4, 0, 0.2, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over; if (AM.breeze) AM.breeze.set(quiet ? 0 : G.season === 3 ? 0.012 : 0.006, 0.6);
  if (!quiet && G.season < 3) { AM.bird -= dt; if (AM.bird <= 0) { AM.bird = 4 + Math.random() * 7; const b = 2200 + Math.random() * 900; for (let i = 0; i < 3; i++) tone(b * (1 + i * 0.08), 0.07, 0.012, 'sine', i * 0.09, b * 1.25); } }
}
