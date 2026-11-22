// ===================== SOUND: the escort's bridge (PLAYBOOK S1-S11) =====================
// Waves slapping the hull and the engines' throb (faster with the throttle); the sonar's ping and its echo (a crisp return
// when it is sure); depth charges splashing, then the deep thump of the explosion (closer, louder); the gun's crack; a short
// crackle for each crew report and an alarm bell for torpedoes and hits. Music (its own switch): low, restrained strings and
// a slow drum that rise when there is danger.
let seaN = 0, engN = 0;
const sfx = {
  click() { tone(660, 0.04, 0.04, 'triangle', 0, 820); },
  ping() { tone(1480, 1.2, 0.05, 'sine', 0, 1470); tone(1480, 0.6, 0.012, 'sine', 0.6, 1470); },
  echo(d = 800) { tone(1470, 0.5, 0.03 * clamp(1.4 - d / 1400, 0.3, 1), 'sine', 0.3 + d / 1500, 1400); },
  sure() { tone(1500, 0.25, 0.05, 'sine', 0.25); tone(1500, 0.25, 0.04, 'sine', 0.5); },
  drop() { noise(0.25, 900, 0.04, 'bandpass', 1); noise(0.3, 400, 0.03, 'lowpass', 1, 0.3); },
  boom(d = 300) { const v = clamp(1.3 - d / 1200, 0.15, 1); noise(1.4, 90, 0.12 * v, 'lowpass', 0.6); tone(42, 1.0, 0.08 * v, 'sine', 0, 30); noise(0.8, 1200, 0.02 * v, 'bandpass', 0.6, 0.2); },
  hit() { tone(220, 0.3, 0.05, 'square', 0, 180, 900); },
  sunk() { [0, 4, 7, 12].forEach((q, j) => pluck(note(196, q), 1.4, 0.07, j * 0.14)); },
  gun() { noise(0.2, 2500, 0.08, 'bandpass', 0.6); noise(0.5, 200, 0.07, 'lowpass', 0.8); },
  radio() { if (!gate('radio', 400)) return; noise(0.12, 2400, 0.02, 'bandpass', 3); tone(900, 0.04, 0.01, 'square'); },
  alarm() { if (!gate('alarm', 1200)) return; for (let i = 0; i < 4; i++) tone(880, 0.09, 0.035, 'square', i * 0.14, null, 2000); },
  job() { [0, 7].forEach((q, j) => pluck(note(392, q), 0.5, 0.04, j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(240, 0.15, 0.035, 'triangle', 0, 200, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => pluck(note(392, q + i), 0.6, 0.05, j * 0.07)); },
  star(i = 0) { pluck(note(523.3, 4 + i * 2), 0.8, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(262, q + 5), 1.4, 0.07, j * 0.13)); tone(65, 1.6, 0.05, 'sine'); },
  lose() { tone(262, 0.6, 0.05, 'triangle', 0, 247); tone(196, 1.0, 0.05, 'triangle', 0.4, 185); },
};
let mus = { t: 0, i: 0 };
const CH = [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -1, 2]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (SET.sfx && G && G.me) { const me = G.me, sp = clamp(Math.abs(me.v) / 12, 0, 1);
    seaN -= dt; if (seaN <= 0) { seaN = 1.2 + Math.random() * 0.8; noise(1.6, 300 + Math.random() * 200, 0.025 + (G.cfg.place >= 2 ? 0.02 : 0), 'lowpass', 0.5); }
    engN -= dt; if (engN <= 0) { engN = 0.5 - sp * 0.25; tone(46 + sp * 20, 0.3, 0.02 + sp * 0.02, 'sawtooth', 0, null, 160); } }
  const dg = G && danger(G), beat = dg ? 0.42 : 0.7; mus.t += dt; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CH[Math.floor(i / 8) % CH.length], D = 146.8, semi = q => D * Math.pow(2, q / 12);
  music(() => { if (i % 8 === 0) ch.forEach((q, j) => tone(semi(q), beat * 8, 0.008, 'sawtooth', j * 0.02, null, 700)); if (dg && i % 2 === 0) noise(0.12, 120, 0.04, 'lowpass', 1); if (dg && i % 4 === 3) tone(semi(ch[2] + 12), beat * 1.5, 0.01, 'triangle', 0, null, 1500); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('epic', { seed: 105, key: -3, bpm: 89 });
