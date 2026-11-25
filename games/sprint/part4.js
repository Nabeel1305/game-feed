
// ===================== SOUND: spikes on the track, the gun, the crowd (PLAYBOOK S1-S11) =====================
// Every stride is a crisp spike "tk" on the tartan with a soft thump under it; a PERFECT one also rings a note, and the
// notes climb the scale as your FLOW builds (S5), so a run in rhythm plays a rising tune under your feet. The crowd hushes
// on SET, the gun cracks round the stadium (S9 echo), the crowd rises as you near the line and roars as you cross it.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  set() { tone(196, 0.25, 0.05, 'sine', 0, 180); },
  gun() { noise(0.35, 2500, 0.26, 'lowpass', 0.7); tone(90, 0.3, 0.2, 'sine', 0, 40); echo(v => { if (v < 1) noise(0.3, 1600, 0.1 * v, 'lowpass', 0.7); }, 0.16, 0.5); noise(0.6, 900, 0.035, 'lowpass', 0.6, 0.3); },
  whistle() { tone(2300, 0.18, 0.06, 'sine', 0, 2250); tone(2300, 0.3, 0.06, 'sine', 0.24, 2200); },
  step(q = 'good', flow = 0, side = 'L') { if (!gate('step', 40)) return; const lr = side === 'L' ? 1 : 1.07;
    noise(0.03, 3800 * lr * vary(0.08), 0.12, 'bandpass', 1.4); tone(95 * lr, 0.07, 0.11, 'sine', 0, 60);
    if (q === 'perfect') pluck(note(392, Math.min(14, (flow | 0))), 0.35, 0.1);
    else if (q === 'early' || q === 'late') tone(330, 0.05, 0.025, 'triangle', 0, 300); },
  flow(n = 5) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, (n / 5) | 0)), 0.16, 0.06, 'triangle', j * 0.05)); },
  trip() { noise(0.25, 700, 0.12, 'lowpass', 0.8); tone(120, 0.25, 0.09, 'sine', 0, 55); tone(300, 0.18, 0.04, 'triangle', 0.05, 180); },
  jump() { noise(0.3, 1200, 0.05, 'bandpass', 0.8); tone(300, 0.25, 0.03, 'sine', 0, 520); },
  land() { tone(80, 0.12, 0.09, 'sine', 0, 45); noise(0.06, 2500, 0.05, 'bandpass', 1); },
  clear() { pluck(note(523, 7), 0.4, 0.06); pluck(note(523, 9), 0.4, 0.05, 0.06); },
  clip() { noise(0.35, 1400, 0.12, 'bandpass', 1.5); tone(220, 0.12, 0.08, 'square', 0, 160, 1200); tone(160, 0.2, 0.06, 'square', 0.07, 110, 900); },
  rclip() { if (!gate('rclip', 150)) return; noise(0.2, 1400, 0.03, 'bandpass', 1.5); },
  dip() { noise(0.25, 900, 0.05, 'bandpass', 0.7); },
  whoosh() { if (!gate('whoosh', 120)) return; noise(0.2, 1500, 0.025, 'bandpass', 0.7); },
  finish() { noise(1.2, 1000, 0.07, 'bandpass', 0.5); [0, 4, 7].forEach((q, j) => tone(note(392, q + 5), 0.5, 0.05, 'triangle', j * 0.06)); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); tone(note(262, 7), 0.9, 0.04, 'triangle', 0.45); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the crowd: a murmur, hushed on SET, rising down the straight, a roar at the line
let crowdLo = null, crowdHi = null, roar = 0;
function soundStep(G, dt) { if (!actx) return; if (!crowdLo) { crowdLo = bed(700, 0.5, 0.0, 0.2); crowdHi = bed(2100, 0.7, 0.0, 0.35); if (!crowdLo) return; }
  const g = G, y = g && g.you; let lo = 0.03, hi = 0.0;
  if (!g || paused || $('ovHome') && !$('ovHome').classList.contains('hidden')) { lo = 0.025; hi = 0.004; }
  else if (g.phase === 'set') { lo = 0.006; hi = 0; }
  else if (g.phase === 'marks') { lo = 0.02; hi = 0.004; }
  else if (y && y.started) { const near = clamp(1 - (g.D - y.s) / 50, 0, 1); lo = 0.04 + 0.07 * near; hi = 0.01 + 0.06 * near; }
  if (y && y.fin != null && !roar) roar = 2.5; if (y && y.fin == null) roar = 0; if (roar > 0) { roar -= dt; lo += 0.08 * Math.min(1, roar); hi += 0.09 * Math.min(1, roar); }
  if (paused) { lo = hi = 0; }
  crowdLo.set(lo, 0.25); crowdHi.set(hi, 0.25); }
// the band (tools/juice-kit.js): this game's music
bandStyle('sport', { seed: 77, key: -3, bpm: 126, lead: { i: 'brass' }, comp: { i: 'brass' }, A: [0, 3, 0, 4], tune: ['0...0...0...4...', '3...3...3...5...', '4...4...4...8...'], d: { k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' } });
