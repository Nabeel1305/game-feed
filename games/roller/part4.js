
// ===================== SOUND: rollers, brushes, peeling tape (PLAYBOOK S1-S11) =====================
// The roller's soft wet "shhhk" follows your thumb (louder and brighter the faster you roll); the brush a finer whisper; each
// plank, stripe or panel finished rings a note a step higher than the last (S5); the pots clink; the tape peels with a
// crackle at the end; a gentle guitar-ish pluck tune plays under it all.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  bell() { tone(1318, 0.5, 0.05, 'sine'); tone(1760, 0.4, 0.03, 'sine', 0.1); },
  pot() { tone(1400, 0.08, 0.05, 'triangle'); tone(2100, 0.06, 0.03, 'triangle', 0.03); },
  spill() { noise(0.18, 600, 0.06, 'lowpass', 1); tone(160, 0.15, 0.04, 'sine', 0, 110); },
  region(n = 1) { pluck(note(392, Math.min(14, n | 0)), 0.8, 0.08); tone(note(784, Math.min(14, n | 0)), 0.25, 0.03, 'sine', 0.02); },
  peel() { for (let i = 0; i < 9; i++) noise(0.05, 2500 + i * 300, 0.04, 'bandpass', 2, i * 0.05); tone(300, 0.5, 0.03, 'triangle', 0.1, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.05, 'triangle', 0, 349); tone(330, 0.7, 0.05, 'triangle', 0.3, 294); },
};
let rollB = null, mus = { t: 0, i: 0 }, lastStroke = 0;
const TUNE = [0, 4, 7, 4, 2, 4, 9, 7, 5, 4, 2, 4, 0, 2, 4, -1];
function soundStep(G, dt) { if (!actx || MUTE) return; if (!rollB) rollB = bed(1800, 0.6, 0.0, 0.4); if (paused) { if (rollB) rollB.set(0, 0.05); return; }
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), sp = G && G.stroke != null ? (G.stroke - lastStroke) / Math.max(1e-3, dt) : 0; if (G) lastStroke = G.stroke || 0;
  if (rollB) { rollB.set(G && G.thumb && !G.over ? Math.min(0.12, 0.02 + sp * 0.0012) * (G.tool === 'roller' ? 1 : 0.5) : 0, 0.05); try { rollB.f.frequency.setTargetAtTime(G && G.tool === 'brush' ? 4200 : 1500 + Math.min(1500, sp * 12), actx.currentTime, 0.05); } catch (e) {} }
  mus.t += dt; if (mus.t >= 0.36) { mus.t -= 0.36; const n = TUNE[mus.i % TUNE.length], bar = Math.floor(mus.i / 16) % 4; mus.i++; if (n >= 0 && (mus.i % 2 === 1 || Math.random() < 0.5)) pluck(note(330, n + [0, 3, 1, 4][bar]), 0.7, home ? 0.025 : 0.016);
    if (mus.i % 8 === 1) pluck(note(110, [0, 3, 1, 4][bar]), 1.6, home ? 0.03 : 0.022); } }
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 80, key: -2, bpm: 72, lead: { i: 'guitar' }, comp: { i: 'pad', p: 'P' }, A: [0, 3, 0, 4], tune: ['0...2...4...7...', '3...5...7...a...', '4...6...8...6...'], d: {} });
