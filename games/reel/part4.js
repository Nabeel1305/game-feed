
// ===================== SOUND: the lake (PLAYBOOK S1-S11) =====================
// A quiet place: lapping water, birds by day, crickets by night, rain. The fish speak through the float (a tiny plink for a nibble,
// a deep "ploonk" for the bite: P30, its signature), the reel's ratchet, the scream of line on a run, the slap of a leaping fish.
const sfx = {
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  cast(d = 15) { noise(0.32, 1800, 0.12, 'bandpass', 1.4, 0, 0.05); const n = Math.round(6 + d * 0.4); for (let i = 0; i < n; i++) tone(2600 * vary(0.1), 0.012, 0.025 * (1 - i / n), 'square', 0.04 + i * (0.018 + i * 0.002), null, 5000); },
  plop() { tone(330 * vary(0.06), 0.12, 0.16, 'sine', 0, 110); noise(0.18, 900, 0.08, 'lowpass', 1, 0.01); tone(700 * vary(0.05), 0.05, 0.05, 'sine', 0.03, 1100); },
  rise(big) { if (!gate('rise', 300)) return; tone((big ? 180 : 260) * vary(0.08), 0.1, big ? 0.09 : 0.05, 'sine', 0, big ? 80 : 120); noise(0.12, big ? 700 : 1200, big ? 0.06 : 0.035, 'lowpass'); },
  nibble() { tone(1100 * vary(0.08), 0.05, 0.05, 'sine', 0, 1500); tone(560 * vary(0.06), 0.06, 0.03, 'sine', 0.02, 420); },
  bite() { tone(150 * vary(0.04), 0.3, 0.26, 'sine', 0, 55); tone(300, 0.12, 0.08, 'triangle', 0, 120); noise(0.25, 600, 0.12, 'lowpass', 1, 0.02);
    for (let i = 0; i < 4; i++) tone(900 + i * 240 * vary(0.2), 0.04, 0.04, 'sine', 0.1 + i * 0.06, 1400 + i * 200); },
  swish() { if (!gate('swish', 120)) return; noise(0.22, 1400, 0.16, 'bandpass', 0.9, 0, 0.03); },
  hooked() { tone(180, 0.35, 0.12, 'sawtooth', 0.05, 120, 700); pluck(196, 0.9, 0.16, 0.06); pluck(294, 0.7, 0.1, 0.12); },
  flee() { noise(0.35, 1100, 0.1, 'bandpass', 1.2); tone(240 * vary(0.1), 0.18, 0.05, 'sine', 0.05, 90); },
  thrash() { for (let i = 0; i < 3; i++) noise(0.14, 1600 * vary(0.2), 0.12, 'bandpass', 0.8, i * 0.09); },
  splash() { noise(0.4, 1300, 0.18, 'lowpass', 0.8); tone(140 * vary(0.08), 0.18, 0.12, 'sine', 0, 60); for (let i = 0; i < 5; i++) tone(1200 + 700 * Math.random(), 0.03, 0.02, 'sine', 0.06 + i * 0.05); },
  run() { tone(1900 * vary(0.05), 0.45, 0.05, 'sawtooth', 0, 1500, 3200); },
  turned() { tone(note(523, 4), 0.16, 0.08, 'triangle'); tone(note(523, 6), 0.2, 0.07, 'triangle', 0.08); },
  landed(kg = 1, special) { const n = special ? 6 : 4; for (let i = 0; i < n; i++) pluck(note(262, i * 2 + Math.min(4, Math.floor(kg / 3))), 1.1, 0.16, i * 0.08);
    noise(0.5, 1500, 0.12, 'lowpass', 0.8); if (special) for (let i = 0; i < 6; i++) tone(note(1046, i * 2), 0.3, 0.06, 'sine', 0.35 + i * 0.07); },
  snap() { tone(880, 0.06, 0.2, 'square', 0, 260, 4000); pluck(110, 0.6, 0.18, 0.01); noise(0.1, 4000, 0.1, 'highpass', 1); },
  lost() { tone(330, 0.3, 0.1, 'triangle', 0, 220); },
  thunder() { noise(2.8, 140, 0.5, 'lowpass', 0.7, 0, 0.08); noise(1.6, 320, 0.22, 'lowpass', 0.6, 0.2, 0.05); },
  win() { [0, 2, 4, 7, 9].forEach((s, j) => pluck(note(262, s + 5), 1.2, 0.15, j * 0.09)); tone(1046, 0.8, 0.05, 'sine', 0.45); },
  lose() { tone(294, 0.6, 0.12, 'triangle', 0, 262); tone(220, 0.9, 0.12, 'triangle', 0.3, 196); },
};
// the place and the fight, every frame: the beds come up and down with the weather and what the line is doing
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.lap = bed(420, 0.7, 0.05, 0.12, 'lowpass'); AM.rain = bed(5200, 0.4, 0, 0.3, 'highpass'); AM.wind = bed(300, 0.8, 0, 0.07, 'bandpass'); AM.drag = bed(2600, 4, 0, 6, 'bandpass'); AM.creak = bed(900, 9, 0, 1.5, 'bandpass'); AM.bird = 2; }
  const w = G ? G.weather : 'morning', wet = W3 && W3.S ? W3.S.rain : 0;
  AM.lap && AM.lap.set(0.05 + (w === 'storm' ? 0.06 : 0), 1); AM.rain && AM.rain.set(wet * 0.06, 1); AM.wind && AM.wind.set(w === 'storm' ? 0.08 : w === 'overcast' || w === 'rain' ? 0.035 : 0.012, 1.5);
  const F = G && G.F, running = F && (F.surge > 0), loud = F ? clamp((F.T - 0.85) * 3, 0, 1) : 0;
  AM.drag && AM.drag.set(running ? 0.03 + 0.05 * Math.min(1, F.amp || 0) : 0, 0.05);
  AM.creak && AM.creak.set(F ? loud * 0.06 : 0, 0.08);
  if (F && G.in.hold && !running) { AM.rt = (AM.rt || 0) - dt * (14 + 10 * F.T); if (AM.rt <= 0) { AM.rt = 1; tone(2300 * vary(0.06), 0.012, 0.018, 'square', 0, null, 4500); } }
  // birds by day, crickets by night, now and then
  AM.bird -= dt; if (AM.bird <= 0) { AM.bird = 2 + Math.random() * 6; const night = w === 'night' || w === 'dusk';
    if (night) { for (let i = 0; i < 6; i++) tone(4400 * vary(0.02), 0.03, 0.012, 'sine', i * 0.06); }
    else if (w !== 'storm' && w !== 'rain') { const b = 2200 + Math.random() * 1400, n = 2 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) tone(b * vary(0.08), 0.07, 0.014, 'sine', i * 0.11, b * (1.2 + Math.random() * 0.3)); } }
}
