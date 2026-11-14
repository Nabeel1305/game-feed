// ---------- juice kit (PLAYBOOK S1-S11, P11) : copied into each game; keep in sync ----------
// Sound: one bus -> master -> compressor. Every play is pitch/volume varied. Ambience beds can be ducked.
let actx = null, MUTE = false, BUS = null, AMB = null; const lastPlay = {};
function audio() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = actx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
      BUS = actx.createGain(); BUS.gain.value = MUTE ? 0 : 0.9; BUS.connect(comp); comp.connect(actx.destination);
      AMB = actx.createGain(); AMB.gain.value = 1; AMB.connect(BUS);
    } catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
}
function setMute(m) { MUTE = m; if (BUS) BUS.gain.setTargetAtTime(m ? 0 : 0.9, actx.currentTime, 0.02); }
const vary = (a = 0.06) => 1 + (Math.random() * 2 - 1) * a;
function gate(name, ms = 35) { const t = performance.now(); if (lastPlay[name] && t - lastPlay[name] < ms) return false; lastPlay[name] = t; return true; }
function env(g, t, vol, dur, att = 0.005) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + att); g.gain.exponentialRampToValueAtTime(0.0005, t + dur); }
function tone(fr, dur, vol, type = 'sine', when = 0, to, lp, dest) {
  if (!actx || MUTE) return;
  try {
    const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(fr, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    let n = o; if (lp) { const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
    env(g, t, vol, dur); n.connect(g); g.connect(dest || BUS); o.start(t); o.stop(t + dur + 0.03);
  } catch (e) {}
}
const NB = {};   // cached noise buffers
function nbuf(dur) { const k = Math.round(dur * 100); if (!NB[k]) { const n = Math.max(1, Math.floor(actx.sampleRate * dur)), b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5); NB[k] = b; } return NB[k]; }
function noise(dur, freq, vol, type = 'lowpass', q = 1, when = 0, att = 0.002, dest) {
  if (!actx || MUTE) return;
  try {
    const t = actx.currentTime + when, s = actx.createBufferSource(); s.buffer = nbuf(dur); s.playbackRate.value = vary(0.08);
    const f = actx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = actx.createGain(); env(g, t, vol, dur, att); s.connect(f); f.connect(g); g.connect(dest || BUS); s.start(t);
  } catch (e) {}
}
function pluck(fr, dur = 0.8, vol = 0.3, when = 0) {      // Karplus-Strong string
  if (!actx || MUTE) return;
  try {
    const sr = actx.sampleRate, n = Math.floor(sr * dur), b = actx.createBuffer(1, n, sr), d = b.getChannelData(0), p = Math.max(2, Math.round(sr / fr));
    for (let i = 0; i < p; i++) d[i] = Math.random() * 2 - 1;
    for (let i = p; i < n; i++) d[i] = 0.996 * 0.5 * (d[i - p] + d[i - p + 1]);
    const s = actx.createBufferSource(); s.buffer = b; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 5000;
    const g = actx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(BUS); s.start(actx.currentTime + when);
  } catch (e) {}
}
function echo(fn, delay = 0.075, level = 0.12) {          // one short slap-back (a sense of place)
  fn(1); setTimeout(() => fn(level), delay * 1000);
}
const PENTA = [0, 2, 4, 7, 9];
const note = (base, step) => base * Math.pow(2, (PENTA[step % 5] + 12 * Math.floor(step / 5)) / 12);
// Looping ambience bed (crowd, wind). Returns {set(level), stop()}.
function bed(freq, q, level, lfo = 0.15, type = 'bandpass') {
  if (!actx) return null;
  try {
    const n = actx.sampleRate * 3, b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < n; i++) { last = last * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = last; }
    const s = actx.createBufferSource(); s.buffer = b; s.loop = true;
    const f = actx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = actx.createGain(); g.gain.value = 0;
    const o = actx.createOscillator(), og = actx.createGain(); o.frequency.value = lfo; og.gain.value = level * 0.35; o.connect(og); og.connect(g.gain);
    s.connect(f); f.connect(g); g.connect(AMB); s.start(); o.start();
    const B = { g, f, base: level, set(v, tc = 0.4) { try { g.gain.setTargetAtTime(v, actx.currentTime, tc); } catch (e) {} }, stop() { try { s.stop(); o.stop(); } catch (e) {} } };
    B.set(level, 1.2); return B;
  } catch (e) { return null; }
}
function duck(amount = 0.5, ms = 400) {                   // drop ambience under a big moment
  if (!actx || !AMB) return;
  const t = actx.currentTime; AMB.gain.cancelScheduledValues(t); AMB.gain.setTargetAtTime(1 - amount, t, 0.02); AMB.gain.setTargetAtTime(1, t + ms / 1000, 0.15);
}
// Haptic vocabulary (silent sound channel). Never on failure.
const HAP = { tick: [10], light: [18], sharp: [22, 40, 30], thud: [70], heavy: [120, 50, 200], best: [20, 50, 30, 50, 60] };
function vibe(p) { try { if (window.GameNative && GameNative.vibrate) { GameNative.vibrate(JSON.stringify(p)); return; } navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
