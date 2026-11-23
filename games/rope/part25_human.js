// ===================== A PERSON WITH JOINTS (Vine first, 23 Nov 2026; copied to the games that need it) =====================
// His review of Vine: "do better on the animation... hands and the person holding the vines and swinging". The swinger was a pill
// with two straight sticks for arms and two stumps for legs. humMake(T, look) builds a person: head, neck, a chest wider than the
// waist, shoulders, upper arms, forearms, hands with fingers that close; hips, thighs, shins, feet. The arms reach for a point
// (humReach: shoulder and elbow worked out so the hand is there); the legs are set by angles (humLegs). The person faces -z;
// the origin is the middle of the body, 1.0 below the hands when hanging at full stretch.
function humMake(T, look = {}) {
  const g = new T.Group(), mat = (c, r = 0.7) => { const m = new T.MeshStandardMaterial({ color: c, roughness: r }); m.emissive = new T.Color(c); m.emissiveIntensity = 0.1; return m; };
  const M = { skin: mat(look.skin || 0xa8754f, 0.55), top: mat(look.top || 0x2f6a44, 0.8), shorts: mat(look.shorts || 0x6b4d2e, 0.85), hair: mat(look.hair || 0x17110c, 0.8), band: mat(look.band || 0xd6452e, 0.7) };
  const sph = new T.SphereGeometry(1, 16, 12);
  const ell = (rx, ry, rz, x, y, z, m, par = g) => { const q = new T.Mesh(sph, m); q.scale.set(rx, ry, rz); q.position.set(x, y, z); q.castShadow = true; par.add(q); return q; };
  const seg = (rt, rb, len, m, par) => { const ge = new T.CylinderGeometry(rt, rb, len, 10); ge.translate(0, -len / 2, 0); const q = new T.Mesh(ge, m); q.castShadow = true; par.add(q); return q; };      // hangs down from its joint
  const SH = 0.46, HIP = -0.11, UA = 0.28, FA = 0.25, TH = 0.42, SN = 0.4;
  // trunk: chest, waist, hips; neck and head
  ell(0.185, 0.17, 0.115, 0, SH - 0.14, 0, M.top); ell(0.15, 0.15, 0.1, 0, SH - 0.33, 0.005, M.top); ell(0.165, 0.12, 0.115, 0, HIP + 0.04, 0, M.shorts);
  const neck = new T.Group(); neck.position.set(0, SH + 0.03, 0); g.add(neck); seg(0.05, 0.055, 0.1, M.skin, neck).position.y = 0.09;
  const head = new T.Group(); head.position.y = 0.17; neck.add(head); ell(0.1, 0.118, 0.108, 0, 0, 0, M.skin, head); ell(0.105, 0.1, 0.112, 0, 0.035, 0.012, M.hair, head); ell(0.02, 0.03, 0.012, -0.1, 0, 0, M.skin, head); ell(0.02, 0.03, 0.012, 0.1, 0, 0, M.skin, head); ell(0.018, 0.025, 0.02, 0, -0.01, -0.105, M.skin, head);
  { const b = new T.Mesh(new T.TorusGeometry(0.104, 0.014, 6, 20), M.band); b.rotation.x = Math.PI / 2 - 0.15; b.position.y = 0.035; head.add(b); const tailG = new T.Group(); tailG.position.set(0, 0.03, 0.105); head.add(tailG); seg(0.012, 0.004, 0.2, M.band, tailG); seg(0.012, 0.004, 0.17, M.band, tailG).rotation.z = 0.35; head.userData.band = tailG; }
  // arms: shoulder -> upper arm -> elbow -> forearm -> hand (a palm and four fingers on one knuckle joint, and a thumb)
  const arms = [-1, 1].map(sx => { const sh = new T.Group(); sh.position.set(sx * 0.2, SH, 0); g.add(sh); ell(0.062, 0.062, 0.062, 0, 0, 0, M.skin, sh); seg(0.05, 0.04, UA, M.skin, sh);
    const el = new T.Group(); el.position.y = -UA; sh.add(el); ell(0.041, 0.041, 0.041, 0, 0, 0, M.skin, el); seg(0.04, 0.03, FA, M.skin, el);
    const hand = new T.Group(); hand.position.y = -FA; el.add(hand); ell(0.033, 0.045, 0.02, 0, -0.035, 0, M.skin, hand);
    const fing = new T.Group(); fing.position.set(0, -0.075, 0); hand.add(fing); for (let f = 0; f < 4; f++) { const q = seg(0.0095, 0.008, 0.065, M.skin, fing); q.position.set(-0.024 + f * 0.016, 0, 0); }
    const thumb = new T.Group(); thumb.position.set(sx * -0.03, -0.03, -0.005); hand.add(thumb); seg(0.011, 0.009, 0.05, M.skin, thumb); return { sx, sh, el, hand, fing, thumb }; });
  // legs: hip -> thigh -> knee -> shin -> foot
  const legs = [-1, 1].map(sx => { const hip = new T.Group(); hip.position.set(sx * 0.088, HIP, 0); g.add(hip); seg(0.082, 0.058, TH, M.skin, hip); ell(0.09, 0.13, 0.092, 0, -0.08, 0, M.shorts, hip);
    const knee = new T.Group(); knee.position.y = -TH; hip.add(knee); ell(0.058, 0.058, 0.058, 0, 0, 0, M.skin, knee); seg(0.055, 0.036, SN, M.skin, knee); ell(0.05, 0.075, 0.05, 0, -0.14, 0.014, M.skin, knee);
    const foot = new T.Group(); foot.position.y = -SN; knee.add(foot); ell(0.04, 0.028, 0.095, 0, -0.012, -0.05, M.skin, foot); return { sx, hip, knee, foot }; });
  return { g, M, neck, head, arms, legs, UA, FA, SH, grip: 0 };
}
// put a hand at a point (in the person's own space): the elbow bends away from `hint` (default: out to the side and a little back)
function humReach(H, i, tx, ty, tz, hint) {
  const T = THREE, A = H.arms[i], S = A.sh.position, L1 = H.UA, L2 = H.FA + 0.05; let dx = tx - S.x, dy = ty - S.y, dz = tz - S.z, d = Math.hypot(dx, dy, dz) || 1e-4; const dm = Math.min(d, (L1 + L2) * 0.995); dx *= dm / d; dy *= dm / d; dz *= dm / d; d = dm;
  const ca = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), al = Math.acos(ca), n = new T.Vector3(dx, dy, dz).divideScalar(d), h = hint ? new T.Vector3(hint[0], hint[1], hint[2]) : new T.Vector3(A.sx * 0.9, -0.2, 0.45);
  const b = h.sub(n.clone().multiplyScalar(h.dot(n))); if (b.lengthSq() < 1e-6) b.set(A.sx, 0, 0); b.normalize();
  const E = n.clone().multiplyScalar(L1 * Math.cos(al)).addScaledVector(b, L1 * Math.sin(al)), down = new T.Vector3(0, -1, 0);
  A.sh.quaternion.setFromUnitVectors(down, E.clone().normalize());
  const f = new T.Vector3(dx, dy, dz).sub(E).normalize().applyQuaternion(A.sh.quaternion.clone().invert()); A.el.quaternion.setFromUnitVectors(down, f);
}
// arms hanging or swung by angles instead: fwd (+ forward, towards -z), out (+ away from the body), elbow bend
function humArm(H, i, fwd, out, bend) { const A = H.arms[i]; A.sh.rotation.set(fwd, 0, A.sx * out); A.el.rotation.set(bend, 0, 0); }
// legs by angles: each [hip forward (+ towards -z), knee bend (+ heel back), hip out]
function humLegs(H, L, R) { [L, R].forEach((q, i) => { const g = H.legs[i]; g.hip.rotation.set(q[0], 0, g.sx * (q[2] || 0)); g.knee.rotation.set(-Math.max(0, q[1]), 0, 0); g.foot.rotation.x = q[3] == null ? 0.25 : q[3]; }); }
// hands: 0 open .. 1 closed round something
function humGrip(H, v, dt = 1) { H.grip += (v - H.grip) * Math.min(1, dt * 18); for (const A of H.arms) { A.fing.rotation.x = 0.15 + H.grip * 2.1; A.thumb.rotation.set(0.3 + H.grip * 0.9, 0, A.sx * (0.9 - H.grip * 0.5)); } }
