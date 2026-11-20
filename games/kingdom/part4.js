// ===================== SOUND: the race (PLAYBOOK S1-S11) and a tune for every course =====================
// A buzzy little engine that climbs with your speed (and roars on a boost); tyres that squeal in a drift, a crackle as the
// sparks change colour, a whoosh-and-chord boost (bigger for each colour); a springy boing off a ramp, a rising whoosh for each
// trick (a step higher each time, S5), a thump and a chord on a clean landing, a sparkle on a PERFECT; a chime through each
// glider ring; coins up the scale; the ? box's roulette tick-tick-ding; a pop, a bonk, a splat for each item; a cartoon spin;
// a bee's buzz; three beeps and a high one at the start; a bell for each lap; a fanfare at the line.
// The music: each course its own little tune (seeded: its key, its bass line, its melody), bright or spooky to suit; faster and
// a step higher on the final lap.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  go() { tone(660, 0.2, 0.06, 'square', 0, 660, 2400); },
  light(n) { tone(n ? 440 : 880, n ? 0.18 : 0.45, 0.07, 'square', 0, n ? 440 : 880, 2400); },
  drift() { if (!gate('drift', 300)) return; noise(0.3, 2400, 0.03, 'bandpass', 2); },
  spark(t = 1) { tone(note(659, t * 3), 0.12, 0.05, 'triangle'); tone(note(659, t * 3 + 2), 0.1, 0.03, 'sine', 0.05); noise(0.06, 5000, 0.03, 'highpass', 1); },
  boost(t = 1) { noise(0.25 + t * 0.15, 1400, 0.05 + t * 0.015, 'bandpass', 0.8); tone(220, 0.3 + t * 0.1, 0.04, 'sawtooth', 0, 520 + t * 120, 1800); if (t >= 2) [0, 4, 7].forEach((q, j) => tone(note(523, q + t), 0.18, 0.03, 'triangle', 0.05 + j * 0.04)); },
  item() { for (let i = 0; i < 8; i++) tone(1200 + (i % 2) * 300, 0.035, 0.022, 'square', i * 0.12, 0, 2600); },
  ding() { tone(note(784, 4), 0.3, 0.06, 'triangle'); tone(note(784, 9), 0.25, 0.03, 'sine', 0.04); },
  boxhit() { if (!gate('boxhit', 120)) return; tone(1400, 0.08, 0.04, 'triangle', 0, 2200); noise(0.08, 3000, 0.03, 'highpass', 1); },
  use(it) { if (!ITEMS[it]) it = 'pepper';
    if (it === 'pepper' || it === 'pepper3') sfx.boost(2); else if (it === 'shell' || it === 'triple' || it === 'homing') { tone(300, 0.15, 0.06, 'triangle', 0, 900); noise(0.15, 1200, 0.03, 'bandpass', 1); }
    else if (it === 'peel') noise(0.2, 600, 0.06, 'lowpass', 1); else if (it === 'star') [0, 2, 4, 7, 9, 12, 14, 16].forEach((q, j) => tone(note(523, q), 0.14, 0.045, 'triangle', j * 0.05));
    else if (it === 'freeze') { noise(0.6, 6000, 0.04, 'highpass', 1); tone(1800, 0.5, 0.03, 'sine', 0, 2600); } else if (it === 'comet') { tone(200, 0.8, 0.05, 'sawtooth', 0, 1200, 2000); noise(0.8, 900, 0.04, 'bandpass', 1); }
    else if (it === 'rocket') { noise(1.0, 400, 0.08, 'lowpass', 1); tone(80, 1.0, 0.05, 'sawtooth', 0, 160, 900); } else if (it === 'bubble') tone(300, 0.3, 0.05, 'sine', 0, 700); },
  spin() { tone(700, 0.6, 0.06, 'triangle', 0, 200); noise(0.4, 2400, 0.04, 'bandpass', 1); },
  pop() { tone(900, 0.12, 0.06, 'sine', 0, 300); },
  gotem() { [0, 4, 7].forEach((q, j) => tone(note(784, q), 0.12, 0.05, 'triangle', j * 0.05)); },
  bump() { if (!gate('bump', 250)) return; noise(0.08, 600, 0.05, 'lowpass', 1); tone(120, 0.1, 0.05, 'triangle', 0, 90); },
  wall() { if (!gate('wall', 300)) return; noise(0.15, 400, 0.07, 'lowpass', 1); tone(90, 0.18, 0.07, 'sine', 0, 60); },
  fall() { tone(800, 0.9, 0.05, 'triangle', 0, 120); },
  bee() { tone(220, 0.6, 0.03, 'sawtooth', 0, 240, 900); tone(226, 0.6, 0.03, 'sawtooth', 0, 246, 900); },
  ring(n = 1) { [0, 4, 7].forEach((q, j) => tone(note(784, q + n * 2), 0.2, 0.045, 'sine', j * 0.03)); },
  lap(n = 1) { pluck(note(523, n * 2), 0.6, 0.09); pluck(note(523, n * 2 + 4), 0.7, 0.07, 0.1); },
  no() { if (!gate('no', 300)) return; tone(260, 0.14, 0.06, 'triangle', 0, 200, 900); },
  coin(i = 0) { if (!gate('coin', 60)) return; const b = note(784, Math.min(10, i + 1)); tone(b, 0.18, 0.07, 'triangle'); tone(b * 2, 0.12, 0.03, 'sine', 0.01); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.11, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.11); },
  launch(big = 0) { tone(big ? 180 : 260, big ? 0.6 : 0.3, 0.07, 'triangle', 0, big ? 700 : 620); if (big) noise(0.8, 900, 0.04, 'bandpass', 0.7, 0.05); },
  trick(n = 1) { noise(0.25, 1600 + n * 300, 0.045, 'bandpass', 1.2); tone(note(392, Math.min(14, n * 2)), 0.22, 0.05, 'triangle', 0.04); },
  tick() { if (!gate('tick', 60)) return; tone(1600, 0.04, 0.025, 'sine'); },
  land(n = 1, perfect = false) { noise(0.12, 300, 0.09, 'lowpass', 1); [0, 4, 7].slice(0, 1 + Math.min(2, n)).forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.3, 0.05, 'triangle', 0.03 + j * 0.03)); if (perfect) [12, 16, 19].forEach((q, j) => tone(note(523, q), 0.25, 0.04, 'sine', 0.1 + j * 0.05)); },
  thump() { if (!gate('thump', 200)) return; noise(0.1, 260, 0.07, 'lowpass', 1); tone(90, 0.12, 0.06, 'sine', 0, 60); },
  pad() { if (!gate('pad', 200)) return; tone(400, 0.25, 0.05, 'sawtooth', 0, 1400, 2400); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(392, q), 1.0, 0.1, j * 0.09)); [0, 4, 7].forEach((q, j) => tone(note(392, q + 12), 0.6, 0.04, 'triangle', 0.5 + j * 0.02)); },
  lose() { tone(330, 0.5, 0.09, 'triangle', 0, 247); tone(247, 0.7, 0.09, 'triangle', 0.25, 165); },
};
// ---------- the music: a little tune per course, scheduled a moment ahead ----------
const music = { on: false, next: 0, step: 0, bpm: 132, up: 0,
  start(G) { if (HEADLESS || !actx) return; const info = TRACKS[G.cfg.track], R = rng(info.seed * 7 + 1), dark = ['haunt', 'lava', 'neon', 'star', 'moon'].includes(info.theme);
    this.root = [196, 220, 233, 247, 262, 294][(R() * 6) | 0] * (dark ? 0.9 : 1); this.scale = dark ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]; this.bpm = 124 + ((R() * 4) | 0) * 6; this.up = 0;
    this.prog = [[0, 5, 3, 4], [0, 3, 4, 4], [0, 4, 5, 3], [5, 3, 0, 4]][(R() * 4) | 0]; this.mel = []; let p = 5; for (let i = 0; i < 32; i++) { if (R() < 0.62) { p = clamp(p + ((R() * 5) | 0) - 2, 2, 11); this.mel.push(p); } else this.mel.push(-1); }
    this.on = true; this.step = 0; this.next = actx.currentTime + 0.05; },
  final() { if (this.on) { this.bpm += 16; this.up = 1; } }, stop() { this.on = false; },
  tick() { if (!this.on || !actx || MUTE || paused) { if (actx) this.next = Math.max(this.next, actx.currentTime + 0.05); return; } const sp = 60 / this.bpm / 2, sc = this.scale, f = s => this.root * (this.up ? 1.0595 : 1) * Math.pow(2, (sc[((s % 5) + 5) % 5] + 12 * Math.floor(s / 5)) / 12);
    while (this.next < actx.currentTime + 0.2) { const w = this.next - actx.currentTime, i = this.step, bar = Math.floor(i / 8) % 4, ch = this.prog[bar], deg = [0, 1, 2, 3, 4, 5, 6][ch];
      const bassS = [deg, deg, deg + 2, deg, deg + 1, deg, deg + 2, deg + 3][i % 8]; tone(f(bassS) / 2, sp * 0.9, 0.035, 'triangle', w, 0, 900);
      if (i % 2 === 0) noise(0.04, 7000, i % 4 === 0 ? 0.012 : 0.007, 'highpass', 1, w); if (i % 8 === 4) noise(0.12, 1800, 0.02, 'bandpass', 0.8, w); if (i % 4 === 0) tone(70, 0.12, 0.05, 'sine', w, 45);
      if (i % 4 === 2) [0, 2, 4].forEach(q => tone(f(deg + q + 5), sp * 0.6, 0.008, 'square', w, 0, 1600));
      const m = this.mel[i % 32]; if (m >= 0) tone(f(m + 5), sp * 1.6, 0.022, 'square', w, 0, 2600);
      this.step++; this.next += sp; } } };
const AM = { on: false };
function soundStep(G, dt) {
  if (HEADLESS || !actx) return; if (!AM.on) { AM.on = true; AM.eng = bed(160, 4, 0, 0.05, 'bandpass'); AM.eng2 = bed(320, 6, 0, 0.05, 'bandpass'); AM.skid = bed(2600, 2, 0, 0.08, 'bandpass'); AM.crowd = bed(900, 0.5, 0, 0.2, 'bandpass'); }
  const quiet = MUTE || paused || !G || G.over, k = G && G.me, v = k ? k.v / VMAX : 0;
  if (AM.eng) { AM.eng.set(quiet ? 0 : (G.count > 0 ? (G.hold ? 0.045 : 0.02) : 0.02 + v * 0.03), 0.08); if (AM.eng.f) AM.eng.f.frequency.value = (G && G.count > 0 && G.hold ? 300 : 110 + v * 260) + (k && (k.boost > 0 || k.rocket > 0) ? 90 : 0) * (k && k.air ? 1.3 : 1); }
  if (AM.eng2) { AM.eng2.set(quiet ? 0 : 0.008 + v * 0.015, 0.08); if (AM.eng2.f) AM.eng2.f.frequency.value = 220 + v * 520; }
  if (AM.skid) AM.skid.set(quiet ? 0 : (k && (k.drift || (k.off && !k.air && v > 0.3)) ? 0.012 : 0), 0.05);
  if (AM.crowd) AM.crowd.set(quiet ? 0 : G.count > 0 ? 0.012 : 0.002, 0.5);
  if (quiet && music.on && (!G || G.over)) music.stop(); music.tick();
}
