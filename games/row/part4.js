// ===================== SOUND: the river (PLAYBOOK S1-S11) =====================
// Water lapping all the time; each stroke a deep "chunk" of the blade going in and a rush of water, panned to its side (a
// splashy slap for a crab); a soft click when both oars land together, and a rising note as the rhythm builds (S4); a thud on
// the bank or a rock; the starting gun and a crowd at the finish.
const sfx = {
  click() { tone(660, 0.05, 0.06, 'triangle', 0, 880); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.09, 'triangle'); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  gun() { noise(0.25, 1500, 0.2, 'bandpass', 0.6); tone(90, 0.3, 0.1, 'sine', 0, 50); },
  stroke(kind = 'perfect', side = 0) { if (kind === 'crab') { noise(0.3, 1800, 0.1, 'bandpass', 0.8); tone(300, 0.15, 0.04, 'square', 0, 200, 1200); return; }
    tone(kind === 'perfect' ? 110 : 140, 0.14, 0.09, 'sine', 0, 70); noise(0.35, 900 + (side ? 200 : 0), 0.06, 'lowpass', 0.9, 0.03, 0.04); },
  sync(r = 1) { tone(note(523, Math.min(12, Math.floor(r) * 2)), 0.18, 0.05, 'triangle'); },
  bump() { tone(70, 0.3, 0.16, 'sine', 0, 45); noise(0.2, 400, 0.1, 'lowpass', 1); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12].forEach((s, j) => pluck(note(392, s), 1.2, 0.13, j * 0.1)); noise(1.5, 1200, 0.04, 'bandpass', 0.5, 0.2, 0.3); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) { if (!actx || MUTE || HEADLESS) return; if (!AM.on) { AM.on = true; AM.water = bed(600, 0.5, 0.02, 0.4, 'lowpass'); AM.wind = bed(1200, 0.6, 0.006, 0.2, 'bandpass'); }
  if (AM.water) AM.water.set(!G || G.over || paused ? 0.008 : 0.012 + Math.min(0.025, (G.me.v || 0) * 0.004), 0.3); }
