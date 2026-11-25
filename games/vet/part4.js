// ===================== SOUND: the barn (PLAYBOOK S1-S11) =====================
// Calm first: birdsong and wind (or rain on the roof) through the open door, a soft lamp hum. Each animal has its own voice,
// content, uneasy or happy. The tools sound like themselves: tweezers creak and a thorn pops out, the rasp scrapes, the spray
// hisses, the bandage rustles, the brush swishes, drops plip. A warm chime when a problem is fixed; a little tune when she is
// better, a step higher with every gentle visit in a row.
function trem(fr, dur, vol, rate, type = 'sawtooth', when = 0, to, lp = 1200) { const n = Math.max(2, Math.round(dur * rate)); for (let i = 0; i < n; i++) { const u = i / n, f = to ? fr + (to - fr) * u : fr; tone(f * vary(0.01), 1 / rate * 1.1, vol * (1 - u * 0.4), type, when + i / rate, null, lp); } }
const sfx = {
  click() { tone(660, 0.05, 0.08, 'triangle', 0, 880); },
  tick() { if (!gate('tick', 60)) return; tone(1200 * vary(0.05), 0.03, 0.05, 'square'); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  tool() { tone(1400 * vary(0.05), 0.04, 0.05, 'triangle'); noise(0.05, 4200, 0.04, 'highpass', 1); },
  stroke() { noise(0.45, 1800 * vary(0.1), 0.05, 'bandpass', 0.6, 0, 0.12); },
  creak() { if (!gate('creak', 120)) return; tone(320 * vary(0.1), 0.08, 0.03, 'sawtooth', 0, 260, 1200); },
  pop() { tone(900, 0.06, 0.1, 'sine', 0, 300); noise(0.05, 2500, 0.06, 'bandpass', 2); },
  rasp() { noise(0.18, 3000 * vary(0.12), 0.11, 'bandpass', 1.4, 0, 0.02); noise(0.18, 6500, 0.04, 'highpass', 0.8, 0.02); },
  wrap(n = 1) { noise(0.35, 2400, 0.06, 'bandpass', 0.8, 0, 0.06); tone(note(523, n + 1), 0.15, 0.04, 'sine', 0.3); },
  brush(n = 1) { noise(0.28, 5200 * vary(0.1), 0.08, 'highpass', 0.7, 0, 0.04); if (n) tone(note(523, n + 1), 0.12, 0.03, 'sine', 0.22); },
  drip(n = 1) { if (!n) { noise(0.08, 900, 0.05, 'lowpass'); return; } tone(1500 * vary(0.05), 0.09, 0.08, 'sine', 0, 2400); tone(note(784, n + 1), 0.2, 0.03, 'sine', 0.06); },
  shiver() { noise(0.4, 300, 0.05, 'lowpass', 1); },
  flap() { for (let i = 0; i < 4; i++) noise(0.06, 700, 0.05, 'bandpass', 1, i * 0.08); },
  hooves(sp = 1) { const n = Math.round(4 * sp); for (let i = 0; i < n; i++) { tone(140 * vary(0.15), 0.06, 0.08, 'sine', i * 0.24 / sp, 90); noise(0.04, 1200, 0.05, 'bandpass', 1.5, i * 0.24 / sp); } },
  fixed() { [0, 2, 4].forEach((s, j) => tone(note(523, s + 2), 0.35, 0.07, 'sine', j * 0.07)); },
  better(n = 1) { const b = Math.min(8, n); [0, 2, 4, 7].forEach((s, j) => pluck(note(392, s + b), 0.9, 0.11, j * 0.09)); },
  thunder() { noise(2.8, 140, 0.35, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((s, j) => pluck(note(262, s), 1.2, 0.14, j * 0.09)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
  // the animals' voices: mood is 'hello', 'content', 'upset' or 'happy'
  voice(a = 'cow', mood = 'hello') { if (typeof a !== 'string') a = 'cow'; if (!gate('voice', 450)) return; const up = mood === 'upset', hp = mood === 'happy', ct = mood === 'content';
    if (a === 'cow') { const f = up ? 150 : hp ? 135 : 118; tone(f * vary(0.04), ct ? 0.6 : 1.1, 0.12, 'sawtooth', 0, f * (up ? 1.15 : 0.82), 620); tone(f * 2, ct ? 0.5 : 1.0, 0.03, 'sawtooth', 0.04, f * 1.7, 900); }
    else if (a === 'horse') { if (up) { trem(820, 0.7, 0.06, 26, 'triangle', 0, 520, 2600); noise(0.3, 900, 0.05, 'bandpass', 0.7, 0.6); } else if (ct) noise(0.5, 400, 0.08, 'lowpass', 1); else trem(700, 0.8, 0.05, 22, 'triangle', 0, hp ? 900 : 560, 2400); }
    else if (a === 'sheep' || a === 'goat') { const f = (a === 'goat' ? 420 : 300) * (up ? 1.2 : 1); trem(f, ct ? 0.35 : 0.65, 0.05, 13, 'square', 0, f * (up ? 1.1 : 0.94), 1400); }
    else if (a === 'dog') { if (up) { tone(900, 0.4, 0.06, 'sine', 0, 1250); tone(1100, 0.35, 0.04, 'sine', 0.4, 800); } else if (ct) noise(0.4, 500, 0.05, 'lowpass', 1); else { for (let i = 0; i < (hp ? 2 : 1); i++) { noise(0.08, 900, 0.1, 'bandpass', 1.4, i * 0.2); tone(480, 0.09, 0.08, 'triangle', i * 0.2, 330, 1500); } } }
    else if (a === 'pig') { const n = up ? 3 : 2; for (let i = 0; i < n; i++) { noise(0.1, up ? 700 : 500, 0.1, 'bandpass', 3, i * 0.16); tone(170, 0.1, 0.05, 'sawtooth', i * 0.16, 130, 700); } } },
  bird() { const b = 2600 + Math.random() * 1200, n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) tone(b * vary(0.08), 0.07, 0.015, 'sine', i * 0.11, b * 1.25); },
};
const AM = { on: false, bird: 3 };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.wind = bed(500, 0.6, 0.012, 0.12, 'lowpass'); AM.rain = bed(4600, 0.5, 0, 0.3, 'highpass'); AM.hiss = bed(6000, 0.7, 0, 0, 'highpass'); }
  const g = G || (typeof IG !== 'undefined' && IG), rain = W3 && W3.S ? W3.S.rain : 0;
  AM.rain && AM.rain.set(rain * 0.03, 1); AM.hiss && AM.hiss.set(g && g.hold && g.hold.kind === 'spray' ? 0.05 : 0, 0.05);
  AM.bird -= dt; if (AM.bird <= 0) { AM.bird = 4 + Math.random() * 7; if (!rain && !(W3 && W3.S && W3.S.night)) sfx.bird(); }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('pastoral', { seed: 17, key: -2, bpm: 84, lead: { i: 'whistle' }, comp: { i: 'guitar' }, A: [0, 5, 0, 4], tune: ['2...4...2...0...', '5...7...9...7...', '4...6...4...1...'] });
