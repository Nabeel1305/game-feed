// ===================== SOUND: the fire (PLAYBOOK S1-S11) =====================
// Under it all the fire's roar, louder as more burns, and the hose's rushing hiss while you spray (S9: the bed that tells you
// how it is going without looking). A fire going out is a sharp steam hiss with a bright little note that climbs with each one
// in a row (S4); a window catching is a whoosh; a gas bottle a deep boom. The ladder whirrs; a person saved gets a warm chord.
const sfx = {
  click() { tone(660, 0.05, 0.06, 'triangle', 0, 880); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.09, 'triangle'); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  siren() { for (let i = 0; i < 2; i++) { tone(660, 0.35, 0.05, 'triangle', i * 0.7, 880); tone(880, 0.35, 0.05, 'triangle', i * 0.7 + 0.35, 660); } },
  hiss() { if (!gate('hiss', 90)) return; noise(0.45, 4500, 0.08, 'highpass', 0.7, 0, 0.01); sfx.n = (sfx.n || 0) + 1; tone(note(784, Math.min(12, sfx.n % 13)), 0.15, 0.04, 'sine', 0.05); },
  whoosh() { if (!gate('whoosh', 200)) return; noise(0.5, 500, 0.08, 'lowpass', 0.8, 0, 0.12); },
  boom() { tone(60, 0.8, 0.2, 'sine', 0, 30); noise(1.0, 300, 0.2, 'lowpass', 0.6, 0, 0.005); },
  sputter() { for (let i = 0; i < 4; i++) noise(0.05, 2000, 0.05, 'bandpass', 1, i * 0.09); },
  ladder() { tone(140, 0.8, 0.04, 'sawtooth', 0, 220, 600); },
  grab() { tone(note(523, 4), 0.12, 0.05, 'triangle'); },
  saved(n = 1) { [0, 4, 7].forEach((q, j) => pluck(note(392, q + Math.min(8, n)), 0.9, 0.09, j * 0.08)); },
  lostp() { tone(330, 0.5, 0.08, 'triangle', 0, 220); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  thunder() { noise(2.8, 140, 0.3, 'lowpass', 0.7, 0, 0.08); },
  win() { [0, 4, 7, 12].forEach((s, j) => pluck(note(392, s), 1.2, 0.13, j * 0.1)); },
  lose() { tone(294, 0.6, 0.1, 'triangle', 0, 262); tone(220, 0.9, 0.1, 'triangle', 0.3, 196); },
};
const AM = { on: false };
function soundStep(G, dt) { if (!actx || MUTE || HEADLESS) return; if (!AM.on) { AM.on = true; AM.fire = bed(350, 0.6, 0.0, 0.5, 'lowpass'); AM.hose = bed(2600, 0.5, 0.0, 0.6, 'bandpass'); }
  const live = G && !G.over && !paused, fs = live ? G.w.reduce((a, w) => a + w.f, 0) : 0;
  if (AM.fire) AM.fire.set(Math.min(0.05, fs * 0.008), 0.4); if (AM.hose) AM.hose.set(live && G.on && G.tank > 0 ? 0.03 : 0, 0.08); }
