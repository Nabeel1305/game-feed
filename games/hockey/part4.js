
// ===================== SOUND: the rink (PLAYBOOK S1-S11) =====================
// Skate blades cutting the ice on every hard turn, the clack of stick on puck, the boards booming, the ping of a post, the
// goalie's pad thump, the goal horn and the crowd. Music (its own switch): energetic, between matches; in play the crowd.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  combo(i = 0) { [0, 4, 7].forEach((q, j) => pluck(note(392, q + i), 0.4, 0.05, j * 0.06)); },
  stick() { if (!gate('stick', 40)) return; noise(0.03, 2600, 0.12, 'bandpass', 3); tone(900 * vary(0.08), 0.04, 0.06, 'triangle'); },
  windup() { noise(0.25, 900, 0.09, 'bandpass', 1, 0, 0.06); tone(180, 0.2, 0.04, 'triangle', 0, 260); },
  shot(pw = 0) { noise(0.05, 2000 + pw * 1500, 0.18 + pw * 0.1, 'bandpass', 2); tone(260 + pw * 120, 0.06, 0.08, 'triangle', 0, 140); noise(0.3, 3000, 0.02, 'highpass', 0.7, 0.03); },
  save() { tone(110, 0.12, 0.18, 'sine', 0, 70); noise(0.08, 700, 0.12, 'lowpass', 1); },
  boards(v = 4) { if (!gate('boards', 70)) return; const a = Math.min(1, v / 10); tone(70 + a * 30, 0.25, 0.1 + a * 0.15, 'sine', 0, 45); noise(0.15, 500, 0.08 + a * 0.1, 'lowpass', 0.8); },
  post() { tone(1480, 0.5, 0.1, 'triangle'); tone(2220, 0.35, 0.05, 'sine', 0.005); },
  poke() { noise(0.04, 1800, 0.06, 'bandpass', 2); },
  burst() { noise(0.18, 3500, 0.05, 'highpass', 0.8); },
  horn(us) { if (us) { [0, 4, 7].forEach((q, j) => tone(note(110, q), 1.6, 0.07, 'sawtooth', 0, null, 1400)); noise(2.2, 1400, 0.09, 'bandpass', 0.4, 0.1, 0.3); } else tone(147, 0.9, 0.05, 'sawtooth', 0, null, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.06, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  goal() { [0, 4, 7, 9, 12].forEach((q, j) => pluck(note(392, q), 0.9, 0.07, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 11, 14].forEach((q, j) => pluck(note(392, q), 1.0, 0.07, j * 0.11)); sfx.horn(true); },
  lose() { tone(330, 0.4, 0.05, 'triangle', 0, 311); tone(262, 0.7, 0.05, 'triangle', 0.3, 247); },
};
let mus = { t: 0, i: 0 }, crowdN = 0;
const CHORDS = [[0, 4, 7], [5, 9, 12], [3, 7, 10], [4, 7, 11]];
function soundStep(G, dt) { if (!actx || MUTE || paused) return; const live = G && !G.over;
  if (live && SET.sfx) { for (const p of G.P) if (p.cut && Math.random() < dt * 6) noise(0.12, 5000 + Math.random() * 2000, 0.025, 'highpass', 0.8);
    crowdN += dt; if (crowdN > 0.8) { crowdN = 0; const near = Math.abs(G.puck.x) > 11 ? 1.6 : 1; noise(1.2, 700, 0.006 * near, 'bandpass', 0.5); } }
  mus.t += dt; const beat = 0.24; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, ch = CHORDS[Math.floor(i / 16) % 4];
  music(() => { const quiet = live ? 0.35 : 1; if (i % 4 === 0) tone(note(55, ch[0]), 0.22, 0.09 * quiet, 'square', 0, null, 500); if (i % 2 === 1) noise(0.04, 7000, 0.02 * quiet, 'highpass', 0.7); if (i % 8 === 4) noise(0.1, 1200, 0.05 * quiet, 'bandpass', 1);
    if (!live && i % 2 === 0) tone(note(220, ch[(i / 2) % 3 | 0] + (i % 16 > 7 ? 5 : 0)), 0.18, 0.03, 'sawtooth', 0, null, 1800); }); }
