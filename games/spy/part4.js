
// ===================== SOUND: hush (PLAYBOOK S1-S11) =====================
// Soft steps (louder thumps when you run), the creak of doors, the cupboard's click, the camera's whirr and shutter, a coin's
// ping across the floor; the guard's "hm?" when he glimpses you, a sting when he sees you; a far-off hum of conversation in
// the building. Music (its own switch): a low pulsing bass and brushed hi-hat; a second, tenser line comes in as suspicion rises.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  step() { if (!gate('step', 180)) return; noise(0.05, 900, 0.025, 'lowpass', 1); },
  run() { if (!gate('run', 160)) return; noise(0.08, 500, 0.07, 'lowpass', 0.8); tone(80, 0.08, 0.04, 'sine', 0, 55); },
  crouch(up) { noise(0.12, up ? 1600 : 1100, 0.03, 'bandpass', 1.5); },
  door(close) { tone(close ? 180 : 240, 0.25, 0.04, 'sawtooth', 0, close ? 120 : 300, 700); noise(0.1, 600, 0.04, 'lowpass', 1, close ? 0.2 : 0.05); },
  unlock() { tone(1200, 0.06, 0.05, 'square', 0, null, 3000); tone(1600, 0.08, 0.05, 'square', 0.08, null, 3000); },
  hide(out) { noise(0.06, 2400, 0.04, 'bandpass', 2); tone(out ? 420 : 300, 0.1, 0.03, 'triangle', 0.03); },
  camera(off) { tone(off ? 900 : 600, 0.15, 0.03, 'sine', 0, off ? 600 : 900); },
  shutter() { noise(0.03, 5000, 0.12, 'highpass', 1); noise(0.05, 3000, 0.08, 'bandpass', 2, 0.07); },
  coinThrow() { noise(0.15, 3000, 0.03, 'bandpass', 2, 0, 0.1); },
  ping() { tone(2400, 0.4, 0.05, 'sine', 0, 2300); tone(3100, 0.3, 0.03, 'sine', 0.06); },
  hmm(high) { if (!gate('hmm', 500)) return; tone(high ? 220 : 160, 0.3, 0.05, 'sawtooth', 0, high ? 300 : 190, 700); },
  alarm() { if (!gate('alarm', 600)) return; tone(880, 0.12, 0.08, 'square', 0, null, 2500); tone(1175, 0.18, 0.08, 'square', 0.12, null, 2500); },
  caught() { tone(110, 0.6, 0.12, 'sawtooth', 0, 70, 600); noise(0.3, 400, 0.12, 'lowpass', 0.8); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 3, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.05, 'triangle', j * 0.06)); },
  goal() { [0, 3, 7, 10, 12].forEach((q, j) => pluck(note(392, q), 0.9, 0.07, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 3, 7, 12].forEach((q, j) => pluck(note(440, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(330, 0.4, 0.06, 'triangle', 0, 311); tone(262, 0.7, 0.06, 'triangle', 0.3, 247); },
};
let mus = { t: 0, i: 0 }, hum = null;
const LINE = [0, -1, 3, -1, 2, -1, 0, -1, 0, -1, 3, 5, 3, -1, 2, -1];
function soundStep(G, dt) { if (!actx) return; if (!hum) hum = bed(260, 1.5, 0, 0.3);      // voices far away in the building
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), off = !G || paused || home || G.over; if (hum) hum.set(off ? 0 : 0.006, 0.5);
  if (MUTE || paused) return; mus.t += dt; const beat = 0.24; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, tense = G && !G.over ? Math.min(1, G.watched || 0) : 0, vol = home ? 0.9 : 0.6;
  music(() => { if (i % 2 === 0) tone(note(55, LINE[(i >> 1) % 16] >= 0 ? LINE[(i >> 1) % 16] : 0), 0.22, 0.05 * vol, 'triangle', 0, null, 300); if (i % 4 === 2) noise(0.04, 7000, 0.012 * vol, 'highpass', 0.7);
    if (tense > 0.3 && i % 2 === 1) tone(note(220, [0, 1, 0, 6][(i >> 1) % 4]), 0.2, 0.025 * vol * tense, 'sawtooth', 0, null, 1200); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('tense', { seed: 89, key: 1, bpm: 104, lead: { i: 'guitar' }, comp: { i: 'pad', p: 'P' }, A: [0, 5, 0, 4], tune: ['0...2...3...2...', '5...4...2...4...', '4...6...4...2...'], d: { b: 'x..x..x...x.x...', w: '....x.......x...', q: 'x.x.x.x.x.x.x.x.' } });
