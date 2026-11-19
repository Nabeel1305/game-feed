// ===================== SOUND: the bike (PLAYBOOK S1-S11) =====================
// The engine is a growl that rises with speed (a filtered noise bed whose pitch follows the bike), and dies in the air to a
// wind whoosh; a thump on landing that is heavier the longer you flew, a bright chord for a flip (higher for a double: S4), a
// glassy ping for a PERFECT, a crunch and a clatter on a crash, a two-note chirp at a checkpoint.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  go() { tone(note(523, 0), 0.12, 0.06, 'square', 0, 0, 2400); tone(note(523, 7), 0.25, 0.06, 'square', 0.14, 0, 2400); },
  whoosh() { if (!gate('whoosh', 200)) return; noise(0.5, 900, 0.05, 'bandpass', 0.8, 0, 0.08); },
  land(air = 0.5) { noise(0.12, 260, Math.min(0.14, 0.05 + air * 0.06), 'lowpass', 1); tone(70, 0.18, Math.min(0.12, 0.04 + air * 0.05), 'sine', 0, 45); },
  flip(n = 1) { [0, 4, 7, 12].forEach((q, j) => tone(note(523, q + Math.min(6, (n - 1) * 3)), 0.22, 0.06, 'triangle', j * 0.05)); },
  perfect() { tone(note(1046, 7), 0.4, 0.05, 'sine'); tone(note(1046, 12), 0.3, 0.03, 'sine', 0.05); },
  crash() { noise(0.4, 1800, 0.14, 'bandpass', 0.7); noise(0.25, 300, 0.12, 'lowpass', 1, 0.05); tone(120, 0.3, 0.08, 'sawtooth', 0, 50, 600); for (let i = 0; i < 4; i++) tone(2400 + i * 300, 0.05, 0.02, 'square', 0.1 + i * 0.07, 0, 4000); },
  flag() { tone(note(784, 4), 0.1, 0.05, 'triangle'); tone(note(784, 9), 0.18, 0.05, 'triangle', 0.09); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.05, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(392, q), 1.0, 0.09, j * 0.12)); },
  lose() { tone(294, 0.5, 0.08, 'triangle', 0, 262); tone(247, 0.8, 0.08, 'triangle', 0.3, 220); },
};
const AM = { on: false };
function soundStep(G, dt) { if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.eng = bed(160, 3, 0, 0.0, 'bandpass'); AM.wind = bed(700, 0.6, 0, 0.2, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over || G.wait > 0, b = G && G.b, sp = b ? Math.hypot(b.vx, b.vy) : 0;
  if (AM.eng) { AM.eng.set(quiet || !b || b.air ? 0 : 0.05 + (b.boost > 0 ? 0.03 : 0), 0.12); try { AM.eng.f.frequency.setTargetAtTime(110 + sp * 14 + (b && b.boost > 0 ? 120 : 0), actx.currentTime, 0.1); } catch (e) {} }
  if (AM.wind) AM.wind.set(quiet || !b ? 0 : b.air ? 0.04 : 0.008, 0.2); }
