
// ===================== SOUND: the engine, air brakes, doors, the bell, the city (PLAYBOOK S1-S11) =====================
// A diesel hum that rises with the revs (made of two detuned saws through a low filter), the hiss of air brakes as you stop,
// the doors' pneumatic sigh, a card-reader beep for every passenger that climbs a step of the scale (S5), the "ding ding"
// bell when all are aboard, the city around you (a soft traffic murmur), rain on the roof in the rain.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  brakes() { noise(0.5, 3200, 0.06, 'highpass', 0.7, 0.05); tone(70, 0.2, 0.05, 'sine', 0, 50); },
  doors() { noise(0.6, 1600, 0.07, 'bandpass', 0.6); tone(180, 0.35, 0.03, 'triangle', 0.1, 150); },
  doorsShut() { noise(0.4, 1400, 0.06, 'bandpass', 0.6); tone(120, 0.12, 0.08, 'sine', 0.32, 70); },
  beep(n = 0) { tone(note(784, Math.min(12, n | 0)), 0.09, 0.06, 'square', 0, null, 2400); },
  bell() { [0, 0.28].forEach(w => { tone(1318, 0.5, 0.07, 'sine', w); tone(2637, 0.3, 0.025, 'sine', w); }); },
  step() { if (!gate('pstep', 120)) return; noise(0.05, 900, 0.04, 'bandpass', 1); },
  slosh() { if (!gate('slosh', 400)) return; noise(0.35, 700, 0.06, 'bandpass', 2.5); noise(0.2, 1300, 0.03, 'bandpass', 3, 0.12); },
  camera() { noise(0.08, 5000, 0.06, 'highpass', 0.7); tone(1800, 0.06, 0.04, 'square', 0.02, null, 3000); },
  alarm() { tone(880, 0.18, 0.07, 'square', 0, null, 2000); tone(660, 0.25, 0.07, 'square', 0.2, null, 2000); },
  crash() { noise(0.9, 1200, 0.22, 'lowpass', 0.7); tone(60, 0.6, 0.18, 'sine', 0, 35); noise(0.5, 4000, 0.05, 'bandpass', 1.5, 0.1); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the engine (two detuned saws, filtered) and the city's murmur; quiet when paused
let eng = null, city = null, rainB = null;
function engine() { if (!actx || eng) return; try { const o1 = actx.createOscillator(), o2 = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain(); o1.type = o2.type = 'sawtooth'; o1.frequency.value = 42; o2.frequency.value = 42.7; f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 2; g.gain.value = 0; o1.connect(f); o2.connect(f); f.connect(g); g.connect(AMB); o1.start(); o2.start(); eng = { o1, o2, f, g }; } catch (e) { eng = null; } }
function soundStep(G, dt) { if (!actx) return; engine(); if (!city) { city = bed(500, 0.4, 0.0, 0.1); rainB = bed(5000, 0.3, 0.0, 0.05, 'highpass'); }
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), off = !G || paused || home || G.over;
  if (eng) { const b = G && G.bus, v = b ? b.v : 0, rev = b ? 0.3 + 0.7 * b.go : 0, f0 = 38 + v * 3.2 + rev * 18; try { const t = actx.currentTime; eng.o1.frequency.setTargetAtTime(f0, t, 0.1); eng.o2.frequency.setTargetAtTime(f0 * 1.017, t, 0.1); eng.f.frequency.setTargetAtTime(200 + rev * 500 + v * 20, t, 0.1); eng.g.gain.setTargetAtTime(off ? 0 : 0.035 + 0.035 * rev, t, 0.15); } catch (e) {} }
  if (city) city.set(off && !home ? 0 : 0.025, 0.4); if (rainB) rainB.set(!off && W3 && W3.S && W3.S.rain > 0 ? 0.03 : 0, 0.5); }
// the band (tools/juice-kit.js): this game's music
bandStyle('jazz', { seed: 78, key: 2, bpm: 99 });
