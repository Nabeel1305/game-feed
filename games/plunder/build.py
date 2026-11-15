"""Assembles index.html from the parts plus the shared juice kit. Edit the parts, then run: python3 build.py"""
import os
d = os.path.dirname(os.path.abspath(__file__))
kit = open(os.path.join(d, '../../tools/juice-kit.js')).read()
snd = """  async soundCheck() {   // renders every sound offline: catches errors and clipping
    const out = {}, keep = [actx, BUS, AMB, MUTE];
    for (const key of Object.keys(sfx)) {
      const oc = new OfflineAudioContext(1, 44100 * 3, 44100); actx = oc; MUTE = false;
      const comp = oc.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
      BUS = oc.createGain(); BUS.gain.value = 0.9; BUS.connect(comp); comp.connect(oc.destination); AMB = oc.createGain(); AMB.connect(BUS);
      for (const q in lastPlay) delete lastPlay[q]; for (const q in NB) delete NB[q];
      let err = null; try { sfx[key](1, 1); } catch (e) { err = String(e); }
      const buf = await oc.startRendering(), ch = buf.getChannelData(0); let pk = 0; for (const x of ch) pk = Math.max(pk, Math.abs(x));
      out[key] = err || +pk.toFixed(3);
    }
    [actx, BUS, AMB, MUTE] = keep; for (const q in NB) delete NB[q];
    return out;
  },"""
s = open(os.path.join(d, 'part1.html')).read().replace('/*KIT*/', kit)
for p in ['part2.js', 'part3.js', 'part4.js', 'part5.js', 'part6.js', 'part7.js', 'part8.js']: s += open(os.path.join(d, p)).read()
s = s.replace('/*SOUNDCHECK*/', snd)
open(os.path.join(d, 'index.html'), 'w').write(s)
print(len(s.splitlines()), 'lines,', len(s) // 1024, 'KB')
