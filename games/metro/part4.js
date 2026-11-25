// ===================== SOUND: the metro (PLAYBOOK S1-S11) =====================
// Gentle and calm (his direction): soft two-note chimes as trains stop, a light ding per passenger set down (pitched by the
// shape they wanted), a pop for a new station, a zip as track is laid. Warnings are one soft low pulse, never an alarm.
// Music (its own switch): slow electric-piano chords with a light pulse, getting a little busier as the city grows.
let trainN = 0;
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  pop() { tone(660 * vary(0.03), 0.12, 0.07, 'sine', 0, 990); tone(1320, 0.08, 0.03, 'sine', 0.03); },
  build(i = 1) { noise(0.12, 2400, 0.04, 'bandpass', 2); tone(note(392, 2 + (i % 5)), 0.2, 0.07, 'triangle', 0.02, null, 2600); },
  trim() { tone(520, 0.12, 0.05, 'triangle', 0, 330); noise(0.08, 900, 0.04, 'bandpass', 1.5); },
  train() { tone(587, 0.18, 0.07, 'sine'); tone(880, 0.25, 0.06, 'sine', 0.12); },
  deliver(i = 0) { tone(note(784, i % 6) * vary(0.01), 0.18, 0.035, 'sine'); },
  stop(i = 0) { if (!gate('stop', 400)) return; tone(note(523.3, i % 5), 0.3, 0.025, 'sine'); tone(note(523.3, (i % 5) + 2), 0.35, 0.02, 'sine', 0.14); },
  warn() { if (!gate('warn', 1500)) return; tone(196, 0.5, 0.08, 'sine', 0, 185); tone(196, 0.5, 0.05, 'sine', 0.35, 175); },
  week() { [0, 2, 4, 7].forEach((q, j) => tone(note(523.3, q), 0.6, 0.06, 'sine', j * 0.1)); },
  combo(i = 0) { [0, 2, 4].forEach((q, j) => tone(note(523.3, q + (i | 0)), 0.4, 0.05, 'triangle', j * 0.07)); },
  no() { if (!gate('no', 250)) return; tone(220, 0.12, 0.05, 'triangle', 0, 180, 900); },
  ding() { tone(988, 0.5, 0.08, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.05, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.04, 'triangle', 0.06); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.08, 'sine'); },
  win() { [0, 2, 4, 5, 7].forEach((q, j) => tone(note(392, q + 3), 0.7, 0.07, 'triangle', j * 0.11)); },
  lose() { tone(330, 0.5, 0.05, 'triangle', 0, 311); tone(262, 0.8, 0.05, 'triangle', 0.35, 247); },
};
let mus = { t: 0, i: 0 };
const CHORDS = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]];
const ep = (f, dur, vol, when = 0) => { tone(f, dur, vol, 'sine', when, null, 2200); tone(f * 2, dur * 0.4, vol * 0.25, 'sine', when); };      // a soft electric-piano note
function soundStep(G, dt) { if (!actx || MUTE || paused) return;
  if (G && !G.over && !G.choice && SET.sfx) { trainN += dt; if (trainN > 0.5) { trainN = 0; for (const tr of G.trains) if (tr.dwell > 0.2 && tr.dwell < 0.7 && Math.random() < 0.25) { sfx.stop(tr.line); break; } } }
  mus.t += dt; const beat = 0.6; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 8) % CHORDS.length], busyCity = G && G.S ? Math.min(1, G.S.length / 18) : 0;
  const semi = q => 220 * Math.pow(2, q / 12);
  music(() => { if (i % 8 === 0) ch.forEach((q, j) => ep(semi(q), 3.6, 0.018, j * 0.03)); if (i % 2 === 1) ep(semi(ch[(i >> 1) % 4] + 12), 0.8, 0.012);
    if (busyCity > 0.4 && i % 4 === 2) tone(semi(ch[0] - 12), 0.4, 0.02, 'triangle'); }); }
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 94, key: -2, bpm: 80, lead: { i: 'marimba' }, comp: { i: 'pad', p: 'P' }, A: [0, 3, 0, 4], tune: ['2...4...2...7...', '3...5...3...7...', '1...4...1...6...'] });
