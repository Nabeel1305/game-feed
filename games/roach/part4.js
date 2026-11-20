
// ===================== SOUND: tiny you, huge them (PLAYBOOK S1-S11) =====================
// Tiny skitters when you run, crunches as you take food (a bigger crunch for a big piece), a sweet chime up the scale as the
// stash grows (S5); their footsteps huge and muffled; the swish that rises as a slipper comes down, the slap, the rattle of
// the can, the hiss of the spray, a cough. Music (its own switch): sneaking pizzicato over a soft bass; it goes quiet for a
// moment while a threat is coming.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  skitter() { for (let i = 0; i < 6; i++) noise(0.02, 5200 + i * 300, 0.025, 'bandpass', 4, i * 0.035); },
  crunch(big) { noise(big ? 0.18 : 0.09, big ? 1800 : 3200, big ? 0.09 : 0.06, 'bandpass', 1.2); noise(0.05, 5000, 0.04, 'highpass', 1, 0.05); },
  stash(n = 1) { for (let i = 0; i < Math.min(6, n); i++) tone(note(784, i * 2), 0.18, 0.06, 'triangle', i * 0.07); },
  thud() { tone(140, 0.12, 0.08, 'sine', 0, 80); },
  tuck() { noise(0.15, 900, 0.04, 'lowpass', 1); tone(440, 0.12, 0.03, 'sine', 0.05, 330); },
  pant() { if (!gate('pant', 600)) return; [0, 0.25].forEach(w => noise(0.14, 1400, 0.04, 'bandpass', 2, w)); },
  swish() { const t = actx ? actx.currentTime : 0; noise(0.9, 600, 0.05, 'bandpass', 1.5, 0, 0.6); tone(300, 0.9, 0.025, 'sawtooth', 0, 900, 1600); },
  slap(d = 50) { noise(0.25, 700, d < 30 ? 0.22 : 0.15, 'lowpass', 0.8); tone(70, 0.3, 0.14, 'sine', 0, 40); },
  shake() { for (let i = 0; i < 4; i++) noise(0.05, 3500, 0.05, 'bandpass', 3, i * 0.11); },
  hiss() { noise(0.8, 5500, 0.08, 'highpass', 0.7, 0, 0.05); },
  cough() { if (!gate('cough', 450)) return; noise(0.08, 1100, 0.06, 'bandpass', 2); noise(0.06, 1300, 0.05, 'bandpass', 2, 0.12); },
  splat(why) { if (why === 'spray') { noise(0.6, 4000, 0.08, 'highpass', 0.7); tone(600, 0.5, 0.05, 'triangle', 0, 200); } else { noise(0.4, 500, 0.25, 'lowpass', 0.7); tone(60, 0.4, 0.2, 'sine', 0, 30); } },
  step() { if (!gate('foot', 300)) return; tone(48, 0.35, 0.09, 'sine', 0, 30); noise(0.18, 220, 0.07, 'lowpass', 0.8); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 4)), 0.18, 0.07, 'triangle'); tone(note(784, Math.min(14, i + 8)), 0.18, 0.05, 'triangle', 0.06); },
  combo(n = 1) { [0, 2, 4, 7].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  goal() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 0.9, 0.08, j * 0.09)); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12].forEach((q, j) => pluck(note(523, q), 1.0, 0.08, j * 0.12)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
let mus = { t: 0, i: 0, duck: 0 }, room = null;
const SNEAK = [0, -1, 3, -1, 0, 2, 3, 5, 7, -1, 5, 3, 2, -1, 0, -1];
function soundStep(G, dt) { if (!actx) return; if (!room) room = bed(180, 0.5, 0, 0.05);
  const home = $('ovHome') && !$('ovHome').classList.contains('hidden'), off = !G || paused || home || G.over;
  if (room) room.set(off ? 0 : 0.02, 0.5);
  if (G && !off) { for (const p of G.people) if (p.walk) { p.sT = (p.sT || 0) + dt; if (p.sT > 0.55) { p.sT = 0; sfx.step(); } } const m = G.me; if (m && Math.hypot(m.vx, m.vz) > 8) { m.skT = (m.skT || 0) + dt; if (m.skT > 0.09) { m.skT = 0; noise(0.012, 6000, m.running ? 0.012 : 0.007, 'bandpass', 5); } } }
  const threat = G && (G.slips.some(s => !s.land) || G.sprays.some(s => s.t < s.raise + 0.7)); mus.duck = threat ? Math.min(1, mus.duck + dt * 6) : Math.max(0, mus.duck - dt * 1.2);
  if (MUTE || paused) return; mus.t += dt; const beat = 0.19; if (mus.t < beat) return; mus.t -= beat; const i = mus.i++, bar = Math.floor(i / 16) % 4, vol = (home ? 1 : 0.8) * (1 - 0.85 * mus.duck);
  if (vol < 0.05) return;
  music(() => { const n = SNEAK[i % 16]; if (n >= 0) pluck(note(196, n + [0, 0, 3, -2][bar]), 0.35, 0.05 * vol);
    if (i % 4 === 0) tone(note(49, [0, 0, 3, -2][bar]), 0.4, 0.05 * vol, 'triangle', 0, null, 300); if (i % 8 === 6) noise(0.03, 7000, 0.01 * vol, 'highpass', 0.7); }); }
