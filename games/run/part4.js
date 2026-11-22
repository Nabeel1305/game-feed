
// ===================== SOUND: the chase (PLAYBOOK S1-S11) =====================
// The engine roars with speed, the siren wails, tyres hiss on wet roads; crunch of a crash, the thump of a PIT; on foot, your
// breath and footsteps; the clack of cuffs.
// On the Run: an engine that climbs with speed, tyres hissing on wet roads, the cops' sirens closing (louder as they near),
// the helicopter's chop, the cash bag's chunk (a note higher with every clean pass in a row), the nitro's whoosh, the alarm of
// a ram coming, the safehouse door. Foot: breath and steps.
const sfx = {
  swish() { if (!gate('swish', 60)) return; noise(0.12, 1800 * vary(0.1), 0.05, 'bandpass', 0.8); },
  nitro() { noise(0.9, 900, 0.14, 'bandpass', 0.6, 0, 0.03); tone(220, 0.8, 0.06, 'sawtooth', 0, 520, 1800); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  can() { tone(880, 0.1, 0.07, 'triangle', 0, 1320); tone(1320, 0.18, 0.05, 'sine', 0.08); },
  cash(n = 0) { if (!gate('cash', 40)) return; const b = note(523, Math.min(10, n % 11)); noise(0.03, 3000, 0.06, 'bandpass', 2); tone(b, 0.14, 0.07, 'triangle'); tone(b * 2, 0.1, 0.025, 'sine', 0.03); },
  coin2() { if (!gate('coin2', 40)) return; tone(1568 * vary(0.03), 0.08, 0.05, 'triangle'); tone(2093, 0.12, 0.03, 'sine', 0.05); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  siren() { tone(740, 0.5, 0.04, 'sawtooth', 0, 960, 2200); tone(960, 0.5, 0.04, 'sawtooth', 0.5, 740, 2200); },
  alert() { if (!gate('alert', 400)) return; tone(880, 0.09, 0.07, 'square', 0, null, 2400); tone(880, 0.09, 0.07, 'square', 0.14, null, 2400); },
  whoosh() { noise(0.35, 1400, 0.1, 'bandpass', 0.7, 0, 0.05); },
  through() { noise(0.4, 2000, 0.1, 'bandpass', 0.6); [0, 4, 7].forEach((q, j) => tone(note(392, q), 0.2, 0.07, 'triangle', j * 0.07)); },
  heli() { for (let i = 0; i < 12; i++) noise(0.05, 300, 0.07, 'lowpass', 1, i * 0.09); },
  safe() { [0, 4, 7, 12].forEach((q, j) => pluck(note(262, q), 1.2, 0.13, j * 0.1)); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  crash() { noise(0.6, 900, 0.4, 'lowpass', 0.7); tone(70, 0.4, 0.3, 'sine', 0, 40); for (let i = 0; i < 6; i++) tone(2000 + Math.random() * 3000, 0.05, 0.03, 'square', 0.05 + i * 0.04, null, 6000); },
  pit() { tone(90, 0.3, 0.3, 'sine', 0, 50); noise(0.25, 1200, 0.2, 'bandpass', 0.8); noise(0.6, 3000, 0.08, 'bandpass', 2, 0.1); },
  bump() { if (!gate('bump', 200)) return; tone(110, 0.15, 0.18, 'sine', 0, 70); noise(0.1, 800, 0.08); },
  scrape() { if (!gate('scrape', 300)) return; noise(0.3, 2500, 0.08, 'bandpass', 2); },
  door() { tone(180, 0.1, 0.1, 'square', 0.4, 120, 800); noise(0.1, 900, 0.1, 'lowpass', 1, 0.4); },
  horn() { if (!gate('horn', 800)) return; tone(392, 0.5, 0.07, 'sawtooth', 0, null, 1200); tone(494, 0.5, 0.05, 'sawtooth', 0, null, 1200); },
  jump() { noise(0.15, 1500, 0.06, 'bandpass', 1); tone(300, 0.15, 0.05, 'sine', 0, 450); },
  slide() { noise(0.4, 1800, 0.1, 'bandpass', 1.5); },
  step() { if (!gate('stepc', 120)) return; tone(200, 0.05, 0.05, 'sine', 0, 120); },
  thump() { tone(100, 0.25, 0.25, 'sine', 0, 55); noise(0.18, 600, 0.15, 'lowpass'); },
  tackle() { tone(80, 0.4, 0.3, 'sine', 0, 45); noise(0.35, 700, 0.25, 'lowpass'); tone(220, 0.2, 0.08, 'sawtooth', 0.05, 150, 700); },
  grunt() { tone(150 * vary(0.1), 0.18, 0.06, 'sawtooth', 0, 110, 600); },
  hold(n = 1) { tone(note(330, n * 2), 0.18, 0.1, 'triangle'); noise(0.1, 900, 0.08, 'lowpass'); },
  free() { noise(0.3, 1200, 0.15, 'bandpass', 1); tone(330, 0.3, 0.08, 'triangle', 0, 220); },
  cuffs() { for (let i = 0; i < 6; i++) tone(2600 + i * 300, 0.03, 0.06, 'square', i * 0.035, null, 7000); tone(660, 0.6, 0.08, 'triangle', 0.3); },
  thunder() { noise(2.8, 140, 0.5, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((s, j) => pluck(note(262, s), 1.2, 0.14, j * 0.09)); },
  lose() { tone(294, 0.6, 0.12, 'triangle', 0, 262); tone(220, 0.9, 0.12, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.eng = bed(160, 3, 0, 0.6, 'lowpass'); AM.tyre = bed(2200, 0.5, 0, 0.3, 'bandpass'); AM.rain = bed(4800, 0.5, 0, 0.3, 'highpass'); AM.siren = 0; AM.breath = 0; }
  const g = G; if (!g) return; const wet = W3 && W3.S ? W3.S.rain : 0, drive = g.ph === 'drive';
  AM.eng && AM.eng.set(drive ? 0.03 + g.me.v / 40 * 0.06 : 0, 0.2); try { AM.eng && AM.eng.f.frequency.setTargetAtTime(90 + g.me.v * 6, actx.currentTime, 0.2); } catch (e) {}
  AM.tyre && AM.tyre.set(drive ? (wet ? 0.04 : 0.012) * g.me.v / 30 : 0, 0.3); AM.rain && AM.rain.set(wet * 0.05, 1);
  // the siren: a two-tone wail while you drive
  const near = drive && g.cops && g.cops.length ? Math.max(...g.cops.map(cp => 1 - clamp((g.me.s - cp.s) / 120, 0, 1))) : 0;
  if (near > 0) { AM.siren -= dt; if (AM.siren <= 0) { AM.siren = 1.1; tone(740, 0.55, 0.012 + near * 0.04, 'sawtooth', 0, 960, 2400); tone(960, 0.55, 0.012 + near * 0.04, 'sawtooth', 0.55, 740, 2400); } }
  if (g.heli && drive) { AM.chop = (AM.chop || 0) - dt; if (AM.chop <= 0) { AM.chop = 0.09; noise(0.05, 260, 0.035, 'lowpass', 1); } }
  if (g.ph === 'foot') { AM.breath -= dt; if (AM.breath <= 0) { AM.breath = 0.33; tone(110, 0.05, 0.06, 'sine', 0, 70); noise(0.12, 1100, 0.025, 'bandpass', 1, 0.05); } }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('race', { seed: 24, key: -2, bpm: 142 });
