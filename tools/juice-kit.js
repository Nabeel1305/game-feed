// ---------- juice kit (PLAYBOOK S1-S11, P11) : copied into each game; keep in sync ----------
// Sound: one bus -> master -> compressor. Every play is pitch/volume varied. Ambience beds can be ducked.
let actx = null, MUTE = false, BUS = null, AMB = null, MUSB = null, OUTM = false; const lastPlay = {};
// his rule (20 Nov 2026): separate Music, Sound effects and Vibration settings. Music is anything played inside music(() => ...);
// everything else is a sound effect. SET is saved by the game's Settings card (kit part5).
const SET = { mus: true, sfx: true, vib: true, vk: 1 };
function applySet() { if (!actx || !BUS) return; const t = actx.currentTime; BUS.gain.setTargetAtTime(MUTE || !SET.sfx ? 0 : 0.9, t, 0.02); if (MUSB) MUSB.gain.setTargetAtTime(MUTE || !SET.mus ? 0 : 0.9, t, 0.02); }
function music(fn) { if (typeof BAND !== 'undefined' && BAND.S) return; const k = OUTM; OUTM = true; try { fn(); } finally { OUTM = k; } }      // (silent while the band plays: see the end of this file)
function audio() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = actx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
      BUS = actx.createGain(); BUS.gain.value = MUTE || !SET.sfx ? 0 : 0.9; BUS.connect(comp); comp.connect(actx.destination);
      MUSB = actx.createGain(); MUSB.gain.value = MUTE || !SET.mus ? 0 : 0.9; MUSB.connect(comp);
      AMB = actx.createGain(); AMB.gain.value = 1; AMB.connect(BUS);
    } catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
}
function setMute(m) { MUTE = m; applySet(); }
const vary = (a = 0.06) => 1 + (Math.random() * 2 - 1) * a;
function gate(name, ms = 35) { const t = performance.now(); if (lastPlay[name] && t - lastPlay[name] < ms) return false; lastPlay[name] = t; return true; }
function env(g, t, vol, dur, att = 0.005) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + att); g.gain.exponentialRampToValueAtTime(0.0005, t + dur); }
function tone(fr, dur, vol, type = 'sine', when = 0, to, lp, dest) {
  if (!actx || MUTE) return;
  try {
    const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(fr, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    let n = o; if (lp) { const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
    env(g, t, vol, dur); n.connect(g); g.connect(dest || (OUTM && MUSB) || BUS); o.start(t); o.stop(t + dur + 0.03);
  } catch (e) {}
}
const NB = {};   // cached noise buffers
function nbuf(dur) { const k = Math.round(dur * 100); if (!NB[k]) { const n = Math.max(1, Math.floor(actx.sampleRate * dur)), b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5); NB[k] = b; } return NB[k]; }
function noise(dur, freq, vol, type = 'lowpass', q = 1, when = 0, att = 0.002, dest) {
  if (!actx || MUTE) return;
  try {
    const t = actx.currentTime + when, s = actx.createBufferSource(); s.buffer = nbuf(dur); s.playbackRate.value = vary(0.08);
    const f = actx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = actx.createGain(); env(g, t, vol, dur, att); s.connect(f); f.connect(g); g.connect(dest || (OUTM && MUSB) || BUS); s.start(t);
  } catch (e) {}
}
function pluck(fr, dur = 0.8, vol = 0.3, when = 0) {      // Karplus-Strong string
  if (!actx || MUTE) return;
  try {
    const sr = actx.sampleRate, n = Math.floor(sr * dur), b = actx.createBuffer(1, n, sr), d = b.getChannelData(0), p = Math.max(2, Math.round(sr / fr));
    for (let i = 0; i < p; i++) d[i] = Math.random() * 2 - 1;
    for (let i = p; i < n; i++) d[i] = 0.996 * 0.5 * (d[i - p] + d[i - p + 1]);
    const s = actx.createBufferSource(); s.buffer = b; const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 5000;
    const g = actx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect((OUTM && MUSB) || BUS); s.start(actx.currentTime + when);
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
function vibe(p) { if (!SET.vib) return; if (SET.vk !== 1) p = (Array.isArray(p) ? p : [p]).map((v, i) => i % 2 ? v : Math.max(5, Math.round(v * SET.vk))); try { if (window.GameNative && GameNative.vibrate) { GameNative.vibrate(JSON.stringify(p)); return; } navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

// ---------- the band (22 Nov 2026) ----------
// His words: "some of the soundtracks sound so robotic... they're not exciting." Until now a game's music was one plucked line on
// a fixed grid (or nothing). The band plays a real arrangement: drums, bass, chords and a lead with a tune that comes back
// (an A phrase, an answer, a middle part, the A again), swing, small differences in timing and loudness from note to note, and a
// little room echo. A game picks a style in its part4: bandStyle('jazz', { seed, key, bpm }). While the band plays, the old
// music(() => ...) lines are silent. It obeys the Music switch, the mute button, pause and a hidden page, and its notes are
// timed by the sound clock (not by frames), so a slow frame never makes it stumble.
const BAND = { S: null, ctx: null, out: null, rev: null, n: 0, t0: 0, timer: null, ks: new Map(), lvl: 1 };
const BSC = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], mix: [0, 2, 4, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11], lyd: [0, 2, 4, 6, 7, 9, 11], phr: [0, 1, 3, 5, 7, 8, 10] };
const BRH = ['x...x...x.x.....', 'x..x..x...x.x...', 'x.x.x...x...x...', '..x.x.x.x.......', 'x.......x...x.x.', 'x...x.x...x.....', 'x.....x.x...x...', '....x.x.x...x.x.'];
// each style: speed, swing (in sixteenths), scale, the tonic (a MIDI note), chords for the A and B parts (scale steps, one a bar),
// drums (k kick, s snare, h hat, o open hat, r rim, c clap, q shaker, t tom, y ride, j sleigh bells), bass, chords, lead
const BSTY = {
  calm:    { bpm: 76, sw: 0.5, sc: 'maj', root: 60, sev: 1, A: [0, 5, 3, 4], B: [3, 4, 2, 5], d: { k: 'x.........x.....', r: '....x.......x...', q: 'x.x.x.x.x.x.x.x.' }, bass: '1.......1.....5.', comp: { i: 'keys', p: 'x.....x...x.....' }, lead: { i: 'bell', dens: 0.45, oct: 1 }, rev: 0.5 },
  pastoral:{ bpm: 88, sw: 0.2, sc: 'maj', root: 62, A: [0, 3, 0, 4], B: [5, 3, 0, 4], d: { q: '..x...x...x...x.' }, bass: '1.......5.......', comp: { i: 'guitar', p: 'a.a.a.a.a.a.a.a.' }, lead: { i: 'flute', dens: 0.5, oct: 1 }, rev: 0.45 },
  island:  { bpm: 104, sw: 0.25, sc: 'maj', root: 60, A: [0, 3, 4, 0], B: [5, 3, 4, 4], d: { k: 'x.....x...x.....', r: '...x..x...x.x...', q: 'x.xxx.xxx.xxx.xx' }, bass: '1..1..5...1..5..', comp: { i: 'marimba', p: '..x..x....x..x..' }, lead: { i: 'marimba', dens: 0.6, oct: 1 }, rev: 0.35 },
  western: { bpm: 112, sw: 0.4, sc: 'mix', root: 57, A: [0, 0, 3, 0], B: [4, 3, 0, 4], d: { k: 'x.......x.......', r: '....x.......x...', q: 'x.x.x.x.x.x.x.x.' }, bass: '1.......5.......', comp: { i: 'guitar', p: '....x.x.....x.x.' }, lead: { i: 'whistle', dens: 0.45, oct: 1 }, rev: 0.4 },
  sport:   { bpm: 120, sw: 0.12, sc: 'mix', root: 57, A: [0, 0, 3, 4], B: [5, 3, 0, 4], d: { k: 'x..x......x.x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', c: '............x...' }, bass: '1..1..8.1...5.3.', comp: { i: 'brass', p: 'x.....x.....x...' }, lead: { i: 'brass', dens: 0.5, oct: 1 }, rev: 0.25 },
  race:    { bpm: 138, sw: 0, sc: 'min', root: 57, A: [0, 5, 2, 6], B: [3, 5, 6, 4], d: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', o: '..............x.' }, bass: '1.1.1.1.1.1.8.1.', comp: { i: 'pad', p: 'P' }, lead: { i: 'saw', dens: 0.55, oct: 1 }, rev: 0.3 },
  tense:   { bpm: 96, sw: 0, sc: 'min', root: 57, A: [0, 0, 5, 4], B: [3, 3, 4, 4], d: { k: 'x.....x.........', t: '..........x...x.', h: 'x...x...x...x...' }, bass: '1.....1...1.....', comp: { i: 'pad', p: 'P' }, lead: { i: 'pluck', dens: 0.35, oct: 1 }, rev: 0.5 },
  spooky:  { bpm: 72, sw: 0, sc: 'harm', root: 57, A: [0, 5, 3, 4], B: [0, 3, 5, 4], d: { r: '............x...' }, bass: '1...............', comp: { i: 'pad', p: 'P' }, lead: { i: 'bell', dens: 0.4, oct: 2 }, rev: 0.7 },
  arcade:  { bpm: 132, sw: 0, sc: 'maj', root: 60, A: [0, 4, 5, 3], B: [3, 4, 0, 4], d: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, bass: '1.8.1.8.1.8.1.8.', comp: { i: 'square', p: 'a.a.a.a.a.a.a.a.' }, lead: { i: 'square', dens: 0.6, oct: 1 }, rev: 0.15 },
  jazz:    { bpm: 100, sw: 0.66, sc: 'maj', root: 58, sev: 1, A: [1, 4, 0, 5], B: [3, 4, 2, 5], d: { y: 'x...x.x.x...x.x.', k: 'x.........x.....', r: '....x.......x...' }, bass: 'w...w...w...w...', comp: { i: 'keys', p: '..x.......x.x...' }, lead: { i: 'vibes', dens: 0.5, oct: 1 }, rev: 0.4 },
  epic:    { bpm: 92, sw: 0, sc: 'min', root: 55, A: [0, 5, 2, 4], B: [3, 5, 6, 4], d: { k: 'x.....x.x.......', t: '....x.....x.x.x.', s: '............x...' }, bass: '1...1...1...1.5.', comp: { i: 'strings', p: 'P' }, lead: { i: 'brass', dens: 0.45, oct: 1 }, rev: 0.5 },
  east:    { bpm: 84, sw: 0, sc: 'min', pen: 1, root: 57, A: [0, 3, 0, 4], B: [5, 3, 4, 0], d: { t: 'x...........x...', r: '......x.........' }, bass: '1...........5...', comp: { i: 'koto', p: 'a...a.a...a...a.' }, lead: { i: 'flute', dens: 0.45, oct: 1 }, rev: 0.55 },
  synth:   { bpm: 110, sw: 0, sc: 'min', root: 57, A: [0, 5, 3, 6], B: [3, 6, 0, 4], d: { k: 'x...x...x...x...', c: '....x.......x...', h: '..x...x...x...x.' }, bass: '1.1.1.1.1.1.1.1.', comp: { i: 'saw', p: 'a.a.a.a.a.a.a.a.' }, lead: { i: 'saw', dens: 0.45, oct: 2 }, rev: 0.45 },
  funk:    { bpm: 104, sw: 0.3, sw16: 1, sc: 'dor', root: 57, sev: 1, A: [0, 0, 3, 3], B: [4, 3, 0, 0], d: { k: 'x..x......x..x..', s: '....x..-.-..x...', h: 'x.x.x.x.x.x.x.x.' }, bass: '1..1..8...1.5.3.', comp: { i: 'keys', p: '..x..x......x..x' }, lead: { i: 'organ', dens: 0.5, oct: 1 }, rev: 0.25 },
  fest:    { bpm: 108, sw: 0.4, sc: 'maj', root: 60, A: [0, 3, 4, 0], B: [5, 3, 1, 4], d: { j: 'x.x.x.x.x.x.x.x.', k: 'x.......x.......', r: '....x.......x...' }, bass: '1.......5.......', comp: { i: 'keys', p: 'x...x...x...x...' }, lead: { i: 'bell', dens: 0.55, oct: 1 }, rev: 0.5 },
  waltz:   { bpm: 126, sw: 0, three: 1, sc: 'maj', root: 60, A: [0, 4, 5, 3], B: [1, 4, 0, 0], d: { k: 'x...........', r: '....x...x...' }, bass: '1...........', comp: { i: 'keys', p: '....x...x...' }, lead: { i: 'vibes', dens: 0.5, oct: 1 }, rev: 0.5 },
};
function bandStyle(name, o = {}) { const b = BSTY[name]; if (!b) return; const S = Object.assign({}, b, o); S.name = name; if (o.key) S.root = b.root + o.key; S.steps = S.three ? 12 : 16; BAND.S = S; BAND.seed = (o.seed || 1) * 7919 + name.length; BAND.A = null; BAND.n = 0; BAND.t0 = 0; }
function bandRnd() { let s = BAND.seed = (BAND.seed * 1664525 + 1013904223) | 0; return ((s >>> 8) & 0xffff) / 65536; }
function bandSetup() { const B = BAND; if (B.ctx === actx) return true; if (!actx || !MUSB || (!B.force && (!(window.AudioContext || window.webkitAudioContext) || !(actx instanceof (window.AudioContext || window.webkitAudioContext))))) return false;      // (not while a test renders the sound effects offline)
  try { B.ctx = actx; B.out = actx.createGain(); B.out.gain.value = 0.075; B.out.connect(MUSB); B.ks.clear();
    const sr = actx.sampleRate, n = Math.floor(sr * 1.7), ir = actx.createBuffer(2, n, sr); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const e = Math.pow(1 - i / n, 3.2); lp = lp * 0.55 + (Math.random() * 2 - 1) * 0.45; d[i] = lp * e * (i < 400 ? i / 400 : 1); } }
    B.rev = actx.createConvolver(); B.rev.buffer = ir; B.wet = actx.createGain(); B.wet.gain.value = 0.5; B.rev.connect(B.wet); B.wet.connect(B.out); return true; } catch (e) { B.ctx = null; return false; } }
const bfr = m => 440 * Math.pow(2, (m - 69) / 12);
// a note's loudness shape, then to the room: g (gain node) from 0 up to v in att, down over dur, away after
function bEnv(src, t, v, att, dur, rel, rv) { const B = BAND, g = actx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.35), t + att + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0002, t + att + dur + rel); src.connect(g); g.connect(B.out); if (rv > 0) { const w = actx.createGain(); w.gain.value = rv; g.connect(w); w.connect(B.rev); } return g; }
function bOsc(type, f, t, end, det) { const o = actx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det; o.start(t); o.stop(end); return o; }
function bLP(fr, q) { const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fr; if (q) f.Q.value = q; return f; }
function bKS(f, dur) { const B = BAND, key = Math.round(f * 2) + ':' + Math.round(dur * 4); let b = B.ks.get(key); if (b) return b; const sr = actx.sampleRate, n = Math.floor(sr * dur), p = Math.max(2, Math.round(sr / f)); b = actx.createBuffer(1, n, sr); const d = b.getChannelData(0);
  let lp = 0; for (let i = 0; i < p; i++) { lp = lp * 0.5 + (Math.random() * 2 - 1) * 0.5; d[i] = lp; } for (let i = p; i < n; i++) d[i] = 0.997 * 0.5 * (d[i - p] + d[i - p + 1]); if (B.ks.size > 90) B.ks.clear(); B.ks.set(key, b); return b; }
const BINS = {
  keys(f, t, d, v, rv) { const end = t + d + 0.5, c = bOsc('sine', f, t, end), m = bOsc('sine', f, t, end), mg = actx.createGain(); mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.35); m.connect(mg); mg.connect(c.frequency); const h = bOsc('sine', f * 2, t, end, 4), hg = actx.createGain(); hg.gain.value = 0.18; h.connect(hg); const mix = actx.createGain(); c.connect(mix); hg.connect(mix); bEnv(mix, t, v, 0.006, d, 0.4, rv); },
  vibes(f, t, d, v, rv) { const end = t + d + 0.9, c = bOsc('sine', f, t, end), h = bOsc('sine', f * 4, t, end), hg = actx.createGain(); hg.gain.setValueAtTime(0.3, t); hg.gain.exponentialRampToValueAtTime(0.001, t + 0.25); h.connect(hg); const mix = actx.createGain(), tr = bOsc('sine', 5, t, end), tg = actx.createGain(); tg.gain.value = 0.12; mix.gain.value = 0.85; tr.connect(tg); tg.connect(mix.gain); c.connect(mix); hg.connect(mix); bEnv(mix, t, v, 0.004, d + 0.3, 0.6, rv); },
  bell(f, t, d, v, rv) { const end = t + d + 1.2, c = bOsc('sine', f, t, end), m = bOsc('sine', f * 3.5, t, end), mg = actx.createGain(); mg.gain.setValueAtTime(f * 1.1, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.7); m.connect(mg); mg.connect(c.frequency); bEnv(c, t, v * 0.8, 0.003, d + 0.5, 0.7, rv); },
  marimba(f, t, d, v, rv) { const end = t + 0.6, c = bOsc('sine', f, t, end), h = bOsc('sine', f * 3.98, t, end), hg = actx.createGain(); hg.gain.setValueAtTime(0.5, t); hg.gain.exponentialRampToValueAtTime(0.001, t + 0.07); h.connect(hg); const mix = actx.createGain(); c.connect(mix); hg.connect(mix); bEnv(mix, t, v * 1.1, 0.003, 0.28, 0.2, rv); },
  flute(f, t, d, v, rv) { const end = t + d + 0.3, c = bOsc('sine', f, t, end), h = bOsc('triangle', f * 2, t, end), hg = actx.createGain(); hg.gain.value = 0.12; h.connect(hg); const vb = bOsc('sine', 5.2, t, end), vg = actx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.008, t + 0.25); vb.connect(vg); vg.connect(c.frequency); const mix = actx.createGain(); c.connect(mix); hg.connect(mix);
    const g = bEnv(mix, t, v * 0.9, 0.05, Math.max(0.12, d), 0.14, rv); g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.9, t + 0.05); g.gain.setValueAtTime(v * 0.9, t + Math.max(0.1, d * 0.85)); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.12); },
  whistle(f, t, d, v, rv) { BINS.flute(f * 2, t, d, v * 0.7, rv); },
  brass(f, t, d, v, rv) { const end = t + d + 0.3, a = bOsc('sawtooth', f, t, end, -5), b = bOsc('sawtooth', f, t, end, 6), lp = bLP(500, 1); lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2400, t + 0.05); lp.frequency.exponentialRampToValueAtTime(1100, t + 0.3); a.connect(lp); b.connect(lp); bEnv(lp, t, v * 0.42, 0.025, d, 0.12, rv); },
  saw(f, t, d, v, rv) { const end = t + d + 0.3, a = bOsc('sawtooth', f, t, end, -7), b = bOsc('sawtooth', f, t, end, 7), lp = bLP(600, 3); lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(700, t + Math.min(0.4, d + 0.1)); a.connect(lp); b.connect(lp); bEnv(lp, t, v * 0.36, 0.008, d, 0.15, rv); },
  square(f, t, d, v, rv) { const end = t + d + 0.2, a = bOsc('square', f, t, end), lp = bLP(3200); a.connect(lp); bEnv(lp, t, v * 0.26, 0.004, d, 0.08, rv); },
  organ(f, t, d, v, rv) { const end = t + d + 0.2, mix = actx.createGain(); [[1, 1], [2, 0.5], [3, 0.3], [4, 0.12]].forEach(([k2, a]) => { const o = bOsc('sine', f * k2, t, end), g = actx.createGain(); g.gain.value = a; o.connect(g); g.connect(mix); }); bEnv(mix, t, v * 0.55, 0.012, d, 0.08, rv); },
  pad(f, t, d, v, rv) { const end = t + d + 0.9, a = bOsc('sawtooth', f, t, end, -8), b = bOsc('sawtooth', f, t, end, 8), c = bOsc('triangle', f, t, end), lp = bLP(900, 0.5); lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1300, t + d * 0.5); a.connect(lp); b.connect(lp); c.connect(lp); const g = bEnv(lp, t, v * 0.22, 0.3, d, 0.6, rv); g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.22, t + 0.3); g.gain.setValueAtTime(v * 0.22, t + d); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.7); },
  strings(f, t, d, v, rv) { BINS.pad(f, t, d, v * 1.2, rv); BINS.pad(f * 2, t, d, v * 0.5, rv); },
  guitar(f, t, d, v, rv) { const s = actx.createBufferSource(); s.buffer = bKS(f, 1.2); const lp = bLP(3800); s.connect(lp); const g = actx.createGain(); g.gain.value = v * 1.5; lp.connect(g); g.connect(BAND.out); if (rv > 0) { const w = actx.createGain(); w.gain.value = rv; g.connect(w); w.connect(BAND.rev); } s.start(t); },
  pluck(f, t, d, v, rv) { BINS.guitar(f, t, d, v, rv); },
  koto(f, t, d, v, rv) { const s = actx.createBufferSource(); s.buffer = bKS(f, 1.5); s.playbackRate.setValueAtTime(1.012, t); s.playbackRate.linearRampToValueAtTime(1, t + 0.12); const lp = bLP(6000); s.connect(lp); const g = actx.createGain(); g.gain.value = v * 1.5; lp.connect(g); g.connect(BAND.out); if (rv > 0) { const w = actx.createGain(); w.gain.value = rv; g.connect(w); w.connect(BAND.rev); } s.start(t); },
  bass(f, t, d, v) { const end = t + d + 0.2, a = bOsc('triangle', f, t, end), b = bOsc('sawtooth', f, t, end), lp = bLP(900); a.connect(lp); b.connect(lp); bEnv(lp, t, v, 0.008, d, 0.1, 0); },
};
function bNoise(t, dur, type, fr, q, v, rv) { const s = actx.createBufferSource(); s.buffer = nbuf(dur); const f = actx.createBiquadFilter(); f.type = type; f.frequency.value = fr; f.Q.value = q || 0.7; s.connect(f); const g = actx.createGain(); g.gain.value = v; f.connect(g); g.connect(BAND.out); if (rv) { const w = actx.createGain(); w.gain.value = rv; g.connect(w); w.connect(BAND.rev); } s.start(t); }
const BDR = {
  k(t, v) { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.11); g.gain.setValueAtTime(v * 0.95, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.22); o.connect(g); g.connect(BAND.out); o.start(t); o.stop(t + 0.3); bNoise(t, 0.03, 'bandpass', 2200, 0.8, v * 0.35); },
  s(t, v) { bNoise(t, 0.2, 'bandpass', 1900, 0.6, v * 1.3, 0.15); const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.08); g.gain.setValueAtTime(v * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.12); o.connect(g); g.connect(BAND.out); o.start(t); o.stop(t + 0.15); },
  h(t, v) { bNoise(t, 0.05, 'highpass', 7500, 0.7, v * 0.5); }, o(t, v) { bNoise(t, 0.3, 'highpass', 7000, 0.7, v * 0.45); }, y(t, v) { bNoise(t, 0.35, 'bandpass', 8200, 1.6, v * 0.55, 0.1); },
  q(t, v) { bNoise(t, 0.07, 'bandpass', 5200, 1.2, v * 0.4); }, c(t, v) { for (let i = 0; i < 3; i++) bNoise(t + i * 0.012, 0.12, 'bandpass', 1300, 0.9, v * 0.6, 0.2); },
  r(t, v) { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle'; o.frequency.value = 820; g.gain.setValueAtTime(v * 0.7, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.04); o.connect(g); g.connect(BAND.out); const w = actx.createGain(); w.gain.value = 0.3; g.connect(w); w.connect(BAND.rev); o.start(t); o.stop(t + 0.06); },
  t(t, v) { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(85, t + 0.2); g.gain.setValueAtTime(v * 1.2, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.32); o.connect(g); g.connect(BAND.out); const w = actx.createGain(); w.gain.value = 0.25; g.connect(w); w.connect(BAND.rev); o.start(t); o.stop(t + 0.35); },
  j(t, v) { [3900, 5100, 6300].forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f * (0.98 + Math.random() * 0.04); g.gain.setValueAtTime(0, t); g.gain.setValueAtTime(v * 0.1, t + i * 0.004); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.09); o.connect(g); g.connect(BAND.out); o.start(t); o.stop(t + 0.1); }); },
};
// scale step -> MIDI note (step may be below 0 or above the octave)
function bDeg(S, i, pen) { const sc = pen ? (BSC[S.sc][2] === 3 ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9]) : BSC[S.sc], n = sc.length, k = ((i % n) + n) % n; return S.root + sc[k] + 12 * Math.floor(i / n); }
// the tune: two-bar ideas made of small steps; A comes back so it can be remembered, B is made new each time round
function bIdea(S) { const L = S.lead, T = BRH, bars = []; let p = [0, 2, 4][(bandRnd() * 3) | 0]; for (let b = 0; b < 2; b++) { const rh = T[(bandRnd() * T.length) | 0], ev = []; for (let s = 0; s < S.steps; s++) if (rh[s] === 'x' && bandRnd() < L.dens + (s % 8 === 0 ? 0.35 : 0)) { p += [-1, 1, -1, 1, -2, 2, 0, 1, -1][(bandRnd() * 9) | 0]; p = Math.max(-2, Math.min(8, p)); ev.push({ s, p }); } if (!ev.length) ev.push({ s: 0, p }); bars.push(ev); } return bars; }
function bandForm() { const B = BAND, S = B.S; if (!B.A) B.A = bIdea(S); const A = B.A, Bp = bIdea(S), end = a => { const e = a.map(q => Object.assign({}, q)); const l = e[e.length - 1]; l.p = [0, 2, 4, 7][(bandRnd() * 4) | 0]; l.home = true; return e.filter(q => q.s <= 10 || q === l); };
  B.mel = [A[0], A[1], A[0], end(A[1]), A[0], A[1], A[0], end(A[1]), Bp[0], Bp[1], Bp[0], end(Bp[1]), A[0], A[1], A[0], end(A[1])]; B.cyc = (B.cyc || 0) + 1; }
function bandStepAt(n, t) { const B = BAND, S = B.S, N = S.steps, s = n % N, bar = Math.floor(n / N), b16 = bar % 16; if (s === 0 && b16 === 0) bandForm(); if (!B.mel) bandForm();
  const prog = b16 >= 8 && b16 < 12 ? S.B : S.A, ch = prog[b16 % 4], nx = (b16 % 4 === 3 ? (b16 === 7 ? S.B : S.A)[0] : prog[b16 % 4 + 1]), first = B.cyc === 1, hum = () => 0.82 + Math.random() * 0.3, late = () => (Math.random() - 0.5) * 0.012, spb = 60 / S.bpm / 4, rv = S.rev || 0.3;
  const quietBar = b16 === 7 || b16 === 15, fill = quietBar && s >= N - 4, lvl = B.lvl;
  // drums: in from the third bar the first time round; a small fill at the end of each half
  if (!(first && b16 < 2)) for (const k in S.d) { const c = S.d[k][s]; if (c && c !== '.') { if (fill && (k === 'k' || k === 's' || k === 'r')) continue; BDR[k](t + (k === 'k' ? 0 : late()), 0.11 * (c === 'X' ? 1.3 : c === '-' ? 0.4 : 1) * hum() * (s % 4 === 0 ? 1.1 : 0.9)); } }
  if (fill && !(first && b16 < 2) && (S.d.s || S.d.t || S.d.r)) { const k = S.d.t ? 't' : S.d.s ? 's' : 'r'; if (s % 2 === 0 || s === N - 1) BDR[k](t + late(), 0.07 + 0.02 * (s - (N - 4))); }
  // bass
  { const c = S.bass[s]; if (c && c !== '.') { let st = ch; if (c === '5') st = ch + 4; else if (c === '3') st = ch + 2; else if (c === 'w') { const q = s / 4; st = q === 0 ? ch : q === 1 ? ch + 2 : q === 2 ? ch + 4 : (nx > ch ? nx - 1 : nx + 1); } let m = bDeg(S, st) - 24 + (c === '8' ? 12 : 0); while (m < 38) m += 12; while (m > 55) m -= 12; BINS.bass(bfr(m), t + late(), spb * (c === 'w' ? 3.4 : 2.4), 0.14 * hum()); } }
  // chords
  { const C = S.comp, tones = [ch, ch + 2, ch + 4].concat(S.sev ? [ch + 6] : []).map(q => { let m = bDeg(S, q) + (C.oct || 0) * 12; while (m > 67) m -= 12; while (m < 52) m += 12; return m; });
    if (C.p === 'P') { if (s === 0) tones.forEach((m, i) => BINS[C.i](bfr(m), t + i * 0.02, spb * N * 0.96, 0.09, rv)); }
    else { const c = C.p[s]; if (c === 'x') tones.forEach((m, i) => BINS[C.i](bfr(m), t + late() + i * 0.008, spb * 2.2, 0.075 * hum(), rv)); else if (c === 'a') { const k2 = [0, 1, 2, 1, 0, 2, 1, 2][(s / 2 | 0) % 8] % tones.length; BINS[C.i](bfr(tones.slice().sort((a, b) => a - b)[k2] + (k2 === 2 && (s / 2 | 0) % 4 === 3 ? 12 : 0)), t + late(), spb * 2, 0.085 * hum(), rv); } } }
  // the lead: rests for the first four bars, snaps to the chord on strong beats, breathes at the end of each phrase
  if (!(first && b16 < 4)) { const ev = B.mel[b16], L = S.lead; for (let i = 0; i < ev.length; i++) if (ev[i].s === s) { const e = ev[i], nxt = ev[i + 1]; let p = e.p; const tn = [ch, ch + 2, ch + 4];
      if (!S.pen && (s % 8 === 0 || e.home)) { let best = p, bd = 99; for (const c of tn) for (const o of [-7, 0, 7]) { const d = Math.abs(c + o - p); if (d < bd) { bd = d; best = c + o; } } p = best; }
      const m = (S.pen ? bDeg(S, p, true) : bDeg(S, p)) + 12 * (L.oct || 0), len = e.home ? 6 : Math.min(6, (nxt ? nxt.s : N) - s); BINS[L.i](bfr(m), t + late(), spb * len * 0.92, 0.12 * hum() * lvl, rv); } } }
function bandTick() { const B = BAND, S = B.S; if (!S || !actx || MUTE || !SET.mus || document.hidden || (typeof paused !== 'undefined' && paused) || !bandSetup()) { B.t0 = 0; return; }
  const ct = actx.currentTime, spb = 60 / S.bpm / 4; if (!B.t0 || B.next < ct - 0.4) { B.t0 = ct + 0.1 - B.n * spb; }
  for (let i = 0; i < 12; i++) { const n = B.n, s = n % S.steps, sw = S.sw16 ? (s % 2 === 1 ? S.sw * spb : 0) : (s % 4 === 2 ? S.sw * spb : 0), t = B.t0 + n * spb + sw; B.next = t; if (t > ct + 0.24) break; try { bandStepAt(n, Math.max(t, ct + 0.005)); } catch (e) {} B.n++; } }
if (typeof window !== 'undefined' && !BAND.timer) { BAND.timer = setInterval(bandTick, 60); window.__band = BAND; }
