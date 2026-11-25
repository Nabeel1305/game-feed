
// ===================== SOUND: the air (PLAYBOOK S1-S11) =====================
// Calm first: wind that rises with speed, a soft drifting chord underneath, the sea far below. Each ring is a bell note that climbs
// the scale while the chain lasts (P18), warmer the closer to the middle.
const sfx = {
  click() { tone(620, 0.05, 0.06, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.035, 'sine'); },
  ding() { tone(988, 0.6, 0.08, 'sine'); tone(1480, 0.45, 0.03, 'sine', 0.03); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.3, 0.08, 'sine'); tone(b * 2, 0.2, 0.025, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.6, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.8, 0.1); },
  ring(chain = 1, off = 0.5) { const b = note(523.3, Math.min(14, chain - 1)) * vary(0.004); tone(b, 1.2, 0.11, 'sine'); tone(b * 2, 0.8, 0.035 * (1.2 - off), 'sine', 0.01); tone(b * 3, 0.5, 0.015, 'sine', 0.02); pluck(b / 2, 1.4, 0.07, 0.02); },
  miss() { if (!gate('miss', 400)) return; tone(330, 0.5, 0.05, 'sine', 0, 300); },
  skim(sea) { noise(0.6, sea ? 1300 : 600, 0.14, sea ? 'bandpass' : 'lowpass', 0.8, 0, 0.03); tone(sea ? 180 : 110, 0.25, 0.06, 'sine', 0, 70); },
  win() { [0, 2, 4, 7, 9, 12].forEach((s, j) => tone(note(262, s + 5), 1.6, 0.08, 'sine', j * 0.12)); [0, 4, 7].forEach((s, j) => pluck(note(131, s + 5), 2, 0.08, 0.3 + j * 0.15)); },
  lose() { tone(392, 1.0, 0.07, 'sine', 0, 349); tone(294, 1.3, 0.07, 'sine', 0.35, 262); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.wind = bed(900, 0.6, 0, 0.18, 'bandpass'); AM.low = bed(260, 0.7, 0, 0.1, 'lowpass'); AM.sea = bed(500, 0.5, 0, 0.12, 'lowpass'); AM.pad = 0; }
  const g = G || (typeof IG !== 'undefined' && IG); if (!g) return; const f = g.f, alt = f.y - Math.max(0, g.land(f.x, f.z));
  if (AM.wind) { AM.wind.set(0.02 + clamp((f.v - 14) / 24, 0, 1) * 0.06, 0.3); try { AM.wind.f.frequency.setTargetAtTime(600 + f.v * 25, actx.currentTime, 0.3); } catch (e) {} }
  AM.low && AM.low.set(0.03 + clamp((f.v - 18) / 20, 0, 1) * 0.04, 0.4); AM.sea && AM.sea.set(clamp(1 - alt / 60, 0, 1) * 0.05, 0.5);
  // a soft chord that drifts, now and then (calm, never a loop he notices)
  AM.pad -= dt; if (AM.pad <= 0) { AM.pad = 5 + Math.random() * 5; const roots = [130.8, 146.8, 110, 164.8], r = roots[(Math.random() * roots.length) | 0]; [1, 1.5, 2, 2.52].forEach((m, j) => tone(r * m, 4.5, 0.018, 'sine', j * 0.25)); }
}
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 11, key: 3, bpm: 70, lead: { i: 'flute', oct: 1 }, comp: { i: 'strings', p: 'P' }, A: [0, 1, 0, 4], tune: ['4.......7.......', '5.......3...1...', '4.......6...4...'], sc: 'lyd', d: {}, rev: 0.7 });
