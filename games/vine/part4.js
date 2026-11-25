
// ===================== SOUND: the canopy (PLAYBOOK S1-S11) =====================
// Insects and birds, a river far below, rain on leaves; the creak of the vine, a whoosh as you fly, a leafy slap as you catch
// (brighter with every catch in a row), a deep splash when you fall.
const sfx = {
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  whoosh() { noise(0.45, 900 * vary(0.1), 0.12, 'bandpass', 0.7, 0, 0.12); },
  catch(n = 1, fine) { noise(0.12, 2600, 0.14, 'bandpass', 1); tone(note(330, Math.min(10, n)), 0.2, 0.09, 'triangle', 0.01); if (fine) tone(note(659, Math.min(10, n + 2)), 0.3, 0.06, 'sine', 0.05); tone(140, 0.12, 0.08, 'sine', 0, 90); },
  air() { if (!gate('air', 200)) return; noise(0.08, 1500, 0.06, 'bandpass', 1.5); },
  fall() { noise(0.9, 700, 0.26, 'lowpass', 0.7, 0.05, 0.02); tone(90, 0.5, 0.22, 'sine', 0.05, 45); },
  creak() { if (!gate('creak', 700)) return; tone(180 * vary(0.1), 0.25, 0.025, 'sawtooth', 0, 150, 600); },
  thunder() { noise(2.8, 140, 0.5, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 2, 4, 7, 9].forEach((s, j) => pluck(note(262, s + 5), 1.2, 0.15, j * 0.09)); tone(1046, 0.8, 0.05, 'sine', 0.45); },
  lose() { tone(294, 0.6, 0.12, 'triangle', 0, 262); tone(220, 0.9, 0.12, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.river = bed(600, 0.5, 0.03, 0.15, 'lowpass'); AM.bugs = bed(5200, 6, 0.008, 3, 'bandpass'); AM.rain = bed(4800, 0.5, 0, 0.3, 'highpass'); AM.air = bed(800, 0.7, 0, 0.2, 'bandpass'); AM.bird = 2; }
  const g = G || (typeof IG !== 'undefined' && IG); if (!g) return; const wet = W3 && W3.S ? W3.S.rain : 0, sp = g.held ? Math.abs(g.om) * g.vines[g.on].L : Math.hypot(g.p.vy, g.p.vz);
  AM.rain && AM.rain.set(wet * 0.06, 1); AM.air && AM.air.set(clamp(sp / 14, 0, 1) * 0.06, 0.15);
  if (g.held && Math.abs(g.th) > 0.8) sfx.creak();
  AM.bird -= dt; if (AM.bird <= 0) { AM.bird = 1.5 + Math.random() * 4; if (!wet) { const b = 1600 + Math.random() * 2400, n = 2 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) tone(b * vary(0.1), 0.09, 0.012, 'sine', i * 0.13, b * (0.7 + Math.random() * 0.8)); } }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('island', { seed: 12, key: 1, bpm: 104, lead: { i: 'steel' }, comp: { i: 'marimba' }, A: [0, 3, 0, 4], tune: ['4...4...2...0...', '5...5...3...0...', '4...6...4...1...'], d: { b: 'x..x..x...x.x...', w: '....x.......x...', q: 'x.x.x.x.x.x.x.x.' } });
