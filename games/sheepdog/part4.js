
// ===================== SOUND: the farm (PLAYBOOK S1-S11) =====================
// A shepherd's whistle to start, the dog's bark, bleats as each sheep goes in (lambs higher, the ram lower) with a chime a
// step up the scale for each (S5), a panicked scatter of hooves, the fox's thin cry, birdsong and wind in the grass.
// Music (its own switch): a gentle folk tune on plucked strings over a drone; it thins out as the sun goes down.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  whistle() { tone(1800, 0.18, 0.05, 'sine', 0, 2400); tone(2400, 0.25, 0.05, 'sine', 0.22, 1700); },
  bark() { tone(420, 0.09, 0.12, 'sawtooth', 0, 260, 1400); noise(0.08, 900, 0.07, 'bandpass', 1.5); tone(380, 0.08, 0.1, 'sawtooth', 0.14, 240, 1300); },
  bleat(kind) { const f = kind === 'lamb' ? 520 : kind === 'ram' ? 210 : 330; for (let i = 0; i < 5; i++) tone(f * (1 + (i % 2) * 0.04), 0.07, 0.035, 'sawtooth', i * 0.06, null, 1800); },
  scatter() { if (!gate('scat', 600)) return; for (let i = 0; i < 8; i++) noise(0.04, 700 + Math.random() * 500, 0.04, 'bandpass', 2, i * 0.05); },
  fox() { tone(900, 0.4, 0.04, 'sine', 0, 1400); tone(1300, 0.3, 0.03, 'sine', 0.35, 800); },
  yip() { tone(1100, 0.08, 0.04, 'triangle', 0, 1400); tone(1200, 0.08, 0.04, 'triangle', 0.12, 1500); },
  taken() { tone(300, 0.6, 0.06, 'triangle', 0, 180); },
  coin(i = 0) { tone(note(784, Math.min(12, i)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(16, i + 4)), 0.18, 0.04, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
let mus = { t: 0, i: 0 }, wind = null, birdT = 0;
const TUNE = [0, 2, 4, 7, 4, 2, 0, -1, 2, 4, 5, 4, 2, 0, -3, -1];
function soundStep(G, dt) { if (!actx) return; if (!wind) wind = bed(500, 0.4, 0, 0.12);
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), off = !G || paused || home || G.over, day = G ? clamp(G.clock / G.day, 0, 1) : 1;
  if (wind) wind.set(off ? 0 : 0.02, 0.6); birdT -= dt; if (!off && birdT < 0 && !MUTE) { birdT = 1.5 + Math.random() * 3; if (day > 0.3) [0, 0.09, 0.18].forEach(w => tone(2600 + Math.random() * 900, 0.06, 0.012, 'sine', w, 3200)); }
  if (MUTE || paused) return; mus.t += dt; const beat = 0.3; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, bar = Math.floor(i / 16) % 4, vol = (home ? 1 : 0.7) * (0.5 + 0.5 * day);
  music(() => { const n = TUNE[i % 16]; if (n > -2 && (i % 2 === 0 || day > 0.5)) pluck(note(392, n + [0, 5, -3, 0][bar]), 0.9, 0.035 * vol); if (i % 8 === 0) tone(note(98, [0, 5, -3, 0][bar]), 2.6, 0.022 * vol, 'sine'); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('pastoral', { seed: 86, key: 0, bpm: 86 });
