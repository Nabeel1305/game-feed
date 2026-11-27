// ===================== SOUND: glass and water (PLAYBOOK S1-S11) =====================
// A bright glassy clink when a glass is picked up (softer when it is put down), a run of low "glug"s while it pours (one for
// each layer that moves), a soft ping when a hidden colour shows itself, and a chime when a glass is done that climbs a step
// with each glass done (S5). A pour that cannot happen is a dull little clunk. Undo is a quick reverse swish.
const sfx = {
  click() { tone(880, 0.04, 0.05, 'triangle', 0, 1100); },
  start() { [0, 4, 7].forEach((q, j) => pluck(note(523, q), 0.5, 0.05, j * 0.07)); },
  clink(v = 1) { if (!gate('clink', 60)) return; const f = 2600 + Math.random() * 300; tone(f, 0.18, 0.04 * v, 'sine'); tone(f * 1.5, 0.12, 0.02 * v, 'sine', 0.005); },
  // 27 Nov 2026, his final fix: "Fix the sound effect of the pouring make it a nice watery sound." It was a run of knocks. Now a real pour: a
  // stream of water (steady filtered noise, gently wobbling) whose ring rises as the glass fills (the note of a filling bottle), with little
  // bubbles popping up through it, fading in as the stream starts and out as it stops. Longer for more layers.
  pour(n = 1) { if (!actx || MUTE) return; try {
    const dur = Math.min(1.2, 0.5 + n * 0.07), t = actx.currentTime + 0.06, sr = actx.sampleRate, len = Math.floor(sr * (dur + 0.1)), b = actx.createBuffer(1, len, sr), d = b.getChannelData(0);
    for (let i = 0, last = 0; i < len; i++) { last = last * 0.55 + (Math.random() * 2 - 1) * 0.45; d[i] = last; }
    const src = actx.createBufferSource(); src.buffer = b;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 5; bp.frequency.setValueAtTime(520, t); bp.frequency.exponentialRampToValueAtTime(1450, t + dur);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.08); g.gain.setValueAtTime(0.16, t + dur - 0.15); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 7 + Math.random() * 3; lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain);
    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(BUS); src.start(t); src.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    for (let k = 0, tt = 0.12; tt < dur - 0.08; k++, tt += 0.05 + Math.random() * 0.09) { const f0 = 380 + Math.random() * 260 + tt * 300; tone(f0, 0.05, 0.035, 'sine', 0.06 + tt, f0 * 2.2); }
  } catch (e) {} },
  reveal() { tone(1568, 0.25, 0.03, 'sine'); },
  full(n = 1) { const st = Math.min(14, n * 2); pluck(note(523, st), 0.9, 0.08); tone(note(1046, st), 0.4, 0.03, 'sine', 0.05); },
  nope() { if (!gate('nope', 200)) return; tone(180, 0.12, 0.06, 'triangle', 0, 140, 800); noise(0.05, 600, 0.03, 'lowpass', 1); },
  undo() { noise(0.18, 1800, 0.03, 'bandpass', 0.8, 0, 0.1); tone(700, 0.12, 0.03, 'sine', 0, 500); },
  no() { if (!gate('no', 250)) return; tone(200, 0.1, 0.05, 'triangle', 0, 160, 900); },
  coin(i = 0) { tone(note(784, Math.min(10, i + 1)), 0.18, 0.07, 'triangle'); },
  combo(n = 1) { [0, 2, 4].forEach((q, j) => tone(note(523, q + Math.min(6, n)), 0.15, 0.06, 'triangle', j * 0.06)); },
  star(i = 0) { tone(note(784, 2 + i * 2), 0.45, 0.1, 'sine'); pluck(note(392, 2 + i * 2), 0.6, 0.1); },
  win() { [0, 4, 7, 12, 16].forEach((q, j) => pluck(note(523, q), 1.0, 0.07, j * 0.1)); },
  lose() { tone(392, 0.4, 0.06, 'triangle', 0, 349); tone(330, 0.7, 0.06, 'triangle', 0.3, 294); },
};
// the band (tools/juice-kit.js): this game's music
bandStyle('calm', { seed: 63, key: -3, bpm: 76, lead: { i: 'marimba' }, comp: { i: 'pad', p: 'P' }, A: [0, 3, 0, 4], tune: ['2...0...2...4...', '5...3...5...7...', '6...4...6...8...'] });
