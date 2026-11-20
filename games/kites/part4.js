
// ===================== SOUND: wind, the line, the cut (PLAYBOOK S1-S11) =====================
// The wind in the sky (a soft breath that rises with gusts), the spool's whirr while you pull, the rasp of two lines sawing
// (rising as the cut comes), a bright "snap" and a rising call for every kite you cut, climbing a step with each in a row
// (S5); a dhol-like drum pattern underneath that gets busier when lines cross.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  wind() { if (!gate('wind', 600)) return; noise(1.2, 500, 0.04, 'bandpass', 0.6); },
  pull() { if (!gate('pull', 120)) return; noise(0.08, 2400, 0.03, 'bandpass', 3); },
  cross() { tone(1200, 0.06, 0.05, 'square', 0, 900, 3000); noise(0.12, 4000, 0.04, 'bandpass', 4); },
  cut(n = 1) { noise(0.06, 6000, 0.12, 'highpass', 1); [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q + Math.min(6, (n - 1) * 2)), 0.6, 0.08, 0.04 + j * 0.06)); tone(note(784, Math.min(10, n + 3)), 0.4, 0.05, 'triangle', 0.1); },
  crash() { noise(0.5, 900, 0.14, 'lowpass', 0.8); tone(110, 0.4, 0.1, 'sine', 0, 50); },
  ring(n = 1) { tone(note(659, Math.min(12, n * 2)), 0.3, 0.07, 'triangle'); tone(note(659, Math.min(14, n * 2 + 2)), 0.25, 0.05, 'triangle', 0.08); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
let windB = null, sawB = null, drum = { t: 0, i: 0 };
function soundStep(G, dt) { if (!actx || MUTE) return; if (!windB) { windB = bed(420, 0.5, 0.0, 0.12); sawB = bed(3200, 3, 0.0, 6); } if (paused) { windB && windB.set(0, 0.1); sawB && sawB.set(0, 0.05); return; }
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), live = G && !G.over;
  if (windB) windB.set(home ? 0.02 : 0.03 + (G && G.gust ? Math.min(0.04, Math.abs(G.gust) * 0.01) : 0), 0.5);
  const cr = live && Object.values(G.crosses || {}); let saw = 0; if (cr && cr.length) saw = 0.03 + 0.08 * Math.max(...cr.map(c => Math.max(c.you, c.them)));
  if (sawB) sawB.set(saw, 0.05);
  // a dhol pattern: busier when lines cross
  drum.t += dt; const step8 = 0.19; if (drum.t >= step8) { drum.t -= step8; const i = drum.i++ % 16, busy = cr && cr.length, v = home ? 0.03 : 0.022;
    if ([0, 6, 8, 11].includes(i) || (busy && i % 2 === 1)) tone(i % 8 === 0 ? 70 : 95, 0.18, v * (i % 8 === 0 ? 1.4 : 1), 'sine', 0, 50);
    if ([4, 12].includes(i) || (busy && i % 4 === 2)) noise(0.06, 2200, v * 0.6, 'bandpass', 1.5); } }
