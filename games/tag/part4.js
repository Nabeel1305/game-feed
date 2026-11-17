
// ===================== SOUND: the playground (PLAYBOOK S1-S11) =====================
// Trainers slapping the tarmac, a whoosh on a dash, a bright slap-and-giggle on a tag (a note higher with each in a row),
// the crystal chink of a freeze and its melt, the thump of being caught, a whistle, the school bell at the end.
const sfx = {
  dash() { noise(0.25, 1800, 0.08, 'bandpass', 0.8, 0, 0.02); tone(300, 0.18, 0.05, 'sine', 0, 600); },
  tag(n = 1) { const b = note(523, Math.min(10, (n - 1) * 2)); noise(0.04, 2500, 0.12, 'bandpass', 1.5); tone(b, 0.14, 0.1, 'triangle', 0.01); tone(b * 1.5, 0.16, 0.06, 'triangle', 0.07); },
  ice() { for (let i = 0; i < 4; i++) tone(2400 + i * 380, 0.2, 0.025, 'sine', i * 0.03); },
  thaw() { if (!gate('thaw', 300)) return; tone(1800, 0.25, 0.03, 'sine', 0, 900); noise(0.2, 4000, 0.02, 'highpass', 1); },
  caught() { tone(140, 0.25, 0.25, 'sine', 0, 80); noise(0.15, 800, 0.15, 'lowpass', 1); tone(330, 0.3, 0.06, 'triangle', 0.08, 220); },
  shield() { tone(660, 0.3, 0.07, 'triangle', 0, 990); tone(990, 0.3, 0.04, 'sine', 0.05, 1320); },
  zombie() { if (!gate('zombie', 250)) return; tone(180, 0.35, 0.07, 'sawtooth', 0, 120, 900); },
  power() { [0, 4, 7, 12].forEach((q, j) => tone(note(784, q), 0.1, 0.06, 'square', j * 0.04, null, 3000)); },
  whistle() { tone(2100, 0.5, 0.06, 'sine', 0, 2300); tone(2160, 0.5, 0.03, 'square', 0, 2360, 4000); },
  step() { if (!gate('step', 150)) return; noise(0.03, 900 * vary(0.2), 0.03, 'bandpass', 2); },
  bell() { for (let i = 0; i < 8; i++) tone(1320, 0.12, 0.05, 'square', i * 0.07, null, 3000); },
  click() { tone(620, 0.05, 0.07, 'triangle', 0, 820); },
  tick() { if (!gate('tick', 60)) return; tone(1300 * vary(0.05), 0.025, 0.04, 'square', 0, null, 3000); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  ding() { tone(988, 0.5, 0.1, 'sine'); tone(1480, 0.35, 0.04, 'sine', 0.02); },
  coin(i = 0) { const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.1, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.12, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.12); },
  thunder() { noise(1.6, 220, 0.3, 'lowpass', 0.6, 0, 0.1); },
  win() { sfx.bell(); [0, 4, 7, 12].forEach((q, j) => tone(note(523, q), 0.3, 0.1, 'triangle', 0.6 + j * 0.09)); },
  lose() { sfx.bell(); tone(330, 0.5, 0.12, 'triangle', 0.6, 247); tone(247, 0.7, 0.12, 'triangle', 0.85, 185); },
};
// footsteps while you run; a heartbeat when one is close behind you
let stepT = 0, beatT = 0;
function soundStep(G, dt) {
  if (!G || G.over || HEADLESS || MUTE || paused) return; const me = G.me, v = Math.hypot(me.vx, me.vz);
  stepT -= dt * v / 2.2; if (stepT <= 0 && v > 1) { stepT = 1; sfx.step(); }
  const it = G.mode === 'chase' || G.mode === 'freeze'; if (it) return; let d = 99; for (const q of G.kids) if (q.it && !q.out) d = Math.min(d, Math.hypot(q.x - me.x, q.z - me.z));
  beatT -= dt; if (d < 4 && beatT <= 0) { beatT = 0.25 + d * 0.12; tone(60, 0.12, 0.12 * (1 - d / 4), 'sine', 0, 45); }
}
