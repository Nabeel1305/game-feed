
// ===================== SOUND: the cab, the street, the meter (PLAYBOOK S1-S11) =====================
// A petrol hum that climbs with the speed, the tick of the indicator when a turn is set, a whoosh past each car you pass,
// the street whistle of someone hailing, the door, the meter's chime and the till's ring with coins up the scale (S5),
// tyres squealing on a fast corner, the crunch of a crash; a city murmur, rain on the roof in the rain. Music (its own
// switch): a laid-back bass and electric-piano groove that tightens while the meter runs low.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  whistle() { tone(1900, 0.14, 0.05, 'sine', 0, 2400); tone(1500, 0.3, 0.05, 'sine', 0.16, 2300); },
  tick() { [0, 0.18].forEach(w => noise(0.02, 3000, 0.05, 'bandpass', 3, w)); },
  swish() { noise(0.18, 1600, 0.04, 'bandpass', 0.8); },
  bump() { if (!gate('bump', 200)) return; noise(0.08, 300, 0.06, 'lowpass', 1); },
  whoosh() { if (!gate('whoosh', 150)) return; noise(0.35, 900, 0.05, 'bandpass', 0.7); },
  door() { noise(0.12, 500, 0.08, 'lowpass', 1); tone(110, 0.1, 0.06, 'sine', 0.08, 70); },
  meter() { tone(1046, 0.12, 0.05, 'sine'); tone(1568, 0.2, 0.04, 'sine', 0.1); },
  till() { tone(2093, 0.4, 0.04, 'sine'); tone(2637, 0.4, 0.03, 'sine', 0.05); noise(0.06, 4000, 0.04, 'highpass', 1); },
  alarm() { tone(880, 0.18, 0.07, 'square', 0, null, 2000); tone(660, 0.25, 0.07, 'square', 0.2, null, 2000); },
  skid() { noise(0.55, 2400, 0.06, 'bandpass', 6); tone(900, 0.5, 0.02, 'sawtooth', 0, 700, 2400); },
  gasp() { if (!gate('gasp', 400)) return; noise(0.25, 1200, 0.05, 'bandpass', 2); tone(520, 0.2, 0.03, 'triangle', 0, 700); },
  crash() { noise(0.9, 1200, 0.22, 'lowpass', 0.7); tone(60, 0.6, 0.18, 'sine', 0, 35); noise(0.5, 4000, 0.05, 'bandpass', 1.5, 0.1); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
let eng = null, city = null, rainB = null, mus = { t: 0, i: 0 };
function engine() { if (!actx || eng) return; try { const o1 = actx.createOscillator(), o2 = actx.createOscillator(), f = actx.createBiquadFilter(), g = actx.createGain(); o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = 55; o2.frequency.value = 27.7; f.type = 'lowpass'; f.frequency.value = 320; f.Q.value = 1.5; g.gain.value = 0; o1.connect(f); o2.connect(f); f.connect(g); g.connect(AMB); o1.start(); o2.start(); eng = { o1, o2, f, g }; } catch (e) { eng = null; } }
const BASS = [0, 0, 7, 0, 10, 0, 7, 5, 0, 0, 7, 0, 3, 5, 7, 10], CH = [[0, 3, 7, 10], [5, 9, 12, 15], [3, 7, 10, 14], [-2, 2, 5, 9]];
function soundStep(G, dt) { if (!actx) return; engine(); if (!city) { city = bed(600, 0.4, 0.0, 0.1); rainB = bed(5000, 0.3, 0.0, 0.05, 'highpass'); }
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), off = !G || paused || home || G.over;
  if (eng) { const t = G && G.taxi, v = t ? t.v : 0, f0 = 48 + v * 6.5; try { const n = actx.currentTime; eng.o1.frequency.setTargetAtTime(f0, n, 0.1); eng.o2.frequency.setTargetAtTime(f0 / 2, n, 0.1); eng.f.frequency.setTargetAtTime(260 + v * 45, n, 0.1); eng.g.gain.setTargetAtTime(off ? 0 : 0.025 + v * 0.0025, n, 0.15); } catch (e) {} }
  if (city) city.set(off && !home ? 0 : 0.022, 0.4); if (rainB) rainB.set(!off && W3 && W3.S && W3.S.rain > 0 ? 0.03 : 0, 0.5);
  if (MUTE || paused) return; const low = G && G.fare && G.fare.left < 12, beat = low ? 0.16 : 0.2; mus.t += dt; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, bar = Math.floor(i / 16) % 4, vol = home ? 1 : G && !G.over ? 0.75 : 0.5;
  music(() => { const b = BASS[i % 16]; if (b >= 0 && (i % 2 === 0 || i % 16 > 11)) tone(note(55, b + CH[bar][0]), 0.22, 0.05 * vol, 'triangle', 0, null, 500);
    if (i % 8 === 4 || i % 8 === 7) CH[bar].forEach((q, j) => tone(note(220, q), 0.35, 0.012 * vol, 'sine', j * 0.01));
    if (i % 4 === 2) noise(0.05, 2000, 0.02 * vol, 'bandpass', 1.4); if (i % 2 === 1) noise(0.02, 8000, 0.008 * vol, 'highpass', 0.7); if (i % 8 === 0) tone(60, 0.18, 0.05 * vol, 'sine', 0, 40); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('funk', { seed: 83, key: -1, bpm: 101 });
