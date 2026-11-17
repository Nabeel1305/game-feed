
// ===================== SOUND: the kitchen (PLAYBOOK S1-S11) =====================
// A sizzle under every busy pan (louder as it browns, angrier as it burns), the extractor hum, the knife on the board, the flip,
// the clink of the plate, the bell at the pass (climbing with a run of orders), the ticket printer.
const sfx = {
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  ticket() { for (let i = 0; i < 6; i++) tone(1800 + Math.random() * 400, 0.02, 0.03, 'square', i * 0.04, null, 5000); },
  drop() { noise(0.4, 3500, 0.12, 'highpass', 0.8); tone(180, 0.06, 0.05, 'sine', 0, 120); },
  thunk() { tone(140, 0.08, 0.12, 'sine', 0, 90); },
  chop(n = 1) { tone(220 * vary(0.08), 0.05, 0.14, 'triangle', 0, 140); noise(0.04, 2400, 0.08, 'bandpass', 2); },
  flip() { noise(0.12, 1800, 0.08, 'bandpass', 1); noise(0.3, 3500, 0.07, 'highpass', 0.8, 0.08); },
  ding2() { if (!gate('ding2', 300)) return; tone(1320, 0.25, 0.05, 'sine'); },
  burn() { noise(0.6, 900, 0.1, 'bandpass', 0.6); tone(110, 0.4, 0.05, 'sawtooth', 0, 90, 600); },
  no() { if (!gate('no', 300)) return; tone(220, 0.15, 0.07, 'square', 0, 180, 900); },
  plate() { tone(2200 * vary(0.05), 0.12, 0.06, 'sine'); tone(3300, 0.08, 0.03, 'sine', 0.01); },
  bin() { tone(90, 0.15, 0.1, 'sine', 0, 60); noise(0.12, 600, 0.06); },
  bell() { tone(1568, 1.0, 0.12, 'sine'); tone(2350, 0.7, 0.05, 'sine', 0.01); tone(3136, 0.5, 0.03, 'sine', 0.02); },
  walk() { tone(330, 0.25, 0.07, 'triangle', 0, 247); tone(247, 0.35, 0.07, 'triangle', 0.2, 185); },
  thunder() { noise(2.8, 140, 0.4, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12, 16].forEach((s, j) => pluck(note(262, s), 1.2, 0.14, j * 0.09)); },
  lose() { tone(294, 0.6, 0.12, 'triangle', 0, 262); tone(220, 0.9, 0.12, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) {
  if (!actx || MUTE || HEADLESS) return;
  if (!AM.on) { AM.on = true; AM.fry = bed(4200, 0.6, 0, 0.12, 'highpass'); AM.hum = bed(120, 2, 0.02, 0.5, 'lowpass'); AM.rain = bed(4800, 0.5, 0, 0.3, 'highpass'); AM.burn = bed(1200, 1, 0, 0.3, 'bandpass'); }
  const g = G || (typeof IG !== 'undefined' && IG); if (!g) return; let fry = 0, burn = 0; for (const p of g.pans) if (p) { fry += 0.02 + Math.min(1, p.sides[p.down]) * 0.025; if (p.sides[p.down] > 1.15) burn += 0.03; }
  AM.fry && AM.fry.set(fry, 0.2); AM.burn && AM.burn.set(burn, 0.2); AM.rain && AM.rain.set((W3 && W3.S ? W3.S.rain : 0) * 0.025, 1);
}
