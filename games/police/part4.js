
// ===================== SOUND: the chase (PLAYBOOK S1-S11) =====================
// The engine roars with speed, the siren wails, tyres hiss on wet roads; crunch of a crash, the thump of a PIT; on foot, your
// breath and footsteps; the clack of cuffs.
const sfx = {
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
  const g = G; if (!g) return; const wet = W3 && W3.S ? W3.S.rain : 0, drive = g.ph === 'drive' || g.ph === 'crash';
  AM.eng && AM.eng.set(drive ? 0.03 + g.me.v / 40 * 0.06 : 0, 0.2); try { AM.eng && AM.eng.f.frequency.setTargetAtTime(90 + g.me.v * 6, actx.currentTime, 0.2); } catch (e) {}
  AM.tyre && AM.tyre.set(drive ? (wet ? 0.04 : 0.012) * g.me.v / 30 : 0, 0.3); AM.rain && AM.rain.set(wet * 0.05, 1);
  // the siren: a two-tone wail while you drive
  if (drive) { AM.siren -= dt; if (AM.siren <= 0) { AM.siren = 1.1; tone(740, 0.55, 0.035, 'sawtooth', 0, 960, 2400); tone(960, 0.55, 0.035, 'sawtooth', 0.55, 740, 2400); } }
  if (g.ph === 'foot') { AM.breath -= dt; if (AM.breath <= 0) { AM.breath = 0.33; tone(110, 0.05, 0.06, 'sine', 0, 70); noise(0.12, 1100, 0.025, 'bandpass', 1, 0.05); } }
}
