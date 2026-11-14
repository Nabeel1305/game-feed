
// ---------- the track: two straights joined by half-circle turns around the posts, run counter-clockwise ----------
// A chariot's place is (p, d): p = metres run along the centre line since the start, d = metres from the centre line (negative = inside, by the posts).
function makeTrack(V) {
  const Ls = V.Ls, rIn = V.rIn, hw = V.Wt / 2, Rc = rIn + hw, tl = Math.PI * Rc;
  return { Ls, rIn, hw, Rc, tl, L: 2 * Ls + 2 * tl, s0: Ls * 0.3, dMin: -hw + 1.45, dMax: hw - 1.45, r0: rIn + 2.2 };
}
const TP = { x: 0, z: 0, th: 0 };
function trackAt(T, s, d, o = TP) {          // centre-line distance s and offset d -> a spot on the sand and the way the track points there
  s %= T.L; if (s < 0) s += T.L;
  if (s < T.Ls) { o.x = -T.Ls / 2 + s; o.z = -(T.Rc + d); o.th = 0; }
  else if (s < T.Ls + T.tl) { const a = (s - T.Ls) / T.Rc, r = T.Rc + d; o.x = T.Ls / 2 + r * Math.sin(a); o.z = -r * Math.cos(a); o.th = a; }
  else if (s < 2 * T.Ls + T.tl) { o.x = T.Ls / 2 - (s - T.Ls - T.tl); o.z = T.Rc + d; o.th = Math.PI; }
  else { const a = (s - 2 * T.Ls - T.tl) / T.Rc, r = T.Rc + d; o.x = -T.Ls / 2 - r * Math.sin(a); o.z = r * Math.cos(a); o.th = Math.PI + a; }
  return o;
}
const TI = { k: 0, dist: 0, a: 0, left: 0 };
function turnInfo(T, s, o = TI) {            // k: 1 inside a turn; dist: metres to the next turn; a: angle already turned; left: metres of turn remaining
  if (s < T.Ls) { o.k = 0; o.dist = T.Ls - s; o.a = 0; o.left = 0; }
  else if (s < T.Ls + T.tl) { o.k = 1; o.dist = 0; o.a = (s - T.Ls) / T.Rc; o.left = T.Ls + T.tl - s; }
  else if (s < 2 * T.Ls + T.tl) { o.k = 0; o.dist = 2 * T.Ls + T.tl - s; o.a = 0; o.left = 0; }
  else { o.k = 1; o.dist = 0; o.a = (s - 2 * T.Ls - T.tl) / T.Rc; o.left = T.L - s; }
  return o;
}
const sOf = (T, p) => { let s = (T.s0 + p) % T.L; if (s < 0) s += T.L; return s; };

// ---------- physics: the same rules for every chariot ----------
const PH = { vTop: 24, cruise: 0.78, acc: 4.6, accU: 3.4, brk: 11, coast: 2.4, VLAT: 8.5, KC: 0.54, resp: 9, tau: 6, gain: [0, 0.18, 0.3], cost: [0.17, 0.1, 0.06], regen: 0.04, LEN: 5.2, WID: 2.7,
  RAMV: 2, RAMK: 4.6, RAMMAX: 30, RECOIL: 0.25, PIN: 1.5, WHEEL: 1.25, WRECKD: 25 };      // ramming: closing speed that starts to hurt, damage per m/s above it, the most one blow can do, what the striker takes back, bonuses, what a wreck costs
const rEff = (T, r) => T.r0 * Math.pow(Math.max(r, 1) / T.r0, 0.6);           // a wide line carries more speed, but not as much as its extra length needs: the inside is the fast way round
const holdSpeed = (T, r, kc = PH.KC) => Math.sqrt(PH.VLAT * rEff(T, r) / kc);  // the fastest a line of radius r can be held with the reins hard over
const strideT = v => lerp(0.92, 0.72, clamp((v - 8) / (PH.vTop - 8), 0, 1));   // seconds per whip beat: the gallop quickens with speed
function newChariot(o) {
  return Object.assign({ p: 0, d: 0, v: 0, vd: 0, urge: 0, wind: 1, ph: 0, beatN: 0, lastBeat: -1, gal: Math.random(), wheel: 0, st: 'grid', wt: 0, blown: 0, balk: 0, slide: 0, tip: 0, scrape: 0, lat: 0, u: 0, b: 0,
    lap: 1, fin: 0, place: 0, ghost: 0, whipT: 9, hitT: 9, onW: 0, auto: 0, rank: 0, react: 0, chain: 0, topChain: 0, pWhips: 0, whips: 0, turns: 0, pTurns: 0, tChain: 0, inTurn: 0, wrecks: 0, lapT0: 0, bestLap: 0, surge: 0, bErr: 0, wasT: 0, side: 0, sideT: 0,
    str: 100, strMax: 100, ramT: 9, hurtT: 9, dSide: 0, rm: 0, rmT: 0, rmS: 0, rmCd: 3 + Math.random() * 3, rmD0: 0, dgT: 0, dgW: 0, dgS: 0, dgCd: 0, anger: 0, brute: 0, dodge: 0, outT: 0, outAt: 0, rams: 0, kills: 0, hits: 0, dodges: 0 }, o);
}
function ev(R, c, type, val) { if (!HEADLESS) R.evs.push({ c, type, val }); }
function wreckIt(c, R) { c.st = 'wreck'; c.wt = 0; c.tip = 0; c.urge = 0; c.u = 0; c.b = 0; c.rm = 0; c.wrecks++; c.tHit = 1; c.chain = 0; ev(R, c, 'wreck'); hurt(c, R, PH.WRECKD * (c.me ? R.dmgIn : 1), null, 0); }
function hurt(c, R, dmg, by, side) {         // the chariot itself takes a knock; enough of them and it breaks up
  if (!(dmg > 0) || c.st === 'out' || c.st === 'fin' || c.st === 'grid') return 0;
  c.str -= dmg; c.hurtT = 0; if (side) c.dSide = side;
  if (c.str <= 0.5) { c.str = 0; destroy(c, R, by); }
  return dmg;
}
function destroy(c, R, by) {                 // broken up: out of the race for good
  c.st = 'out'; c.outT = 0; c.outAt = R.t; c.urge = 0; c.u = 0; c.b = 0; c.rm = 0; c.by = by || null; c.ghost = 0;
  if (by) by.kills++;
  if (R.me.warn && R.me.warn.by === c) R.me.warn = null;
  ev(R, c, 'out', by);
  if (c.me) endOut(R);
}
function beatErr(c) { return (c.ph < 0.5 ? c.ph : c.ph - 1) * strideT(c.v); }   // seconds from the nearest beat (negative = early)
function whip(c, q) {                        // q: 2 on the beat, 1 near it, 0 off it
  c.whipT = 0; c.whips++;
  c.urge = Math.min(1, c.urge + PH.gain[q]); c.wind -= PH.cost[q];
  if (q === 0) c.balk = 0.45;                // off the beat the team breaks stride
  if (c.wind <= 0) { c.wind = 0; c.blown = 3; c.urge = 0; }
}
function stepChariot(c, dt, R) {
  const T = R.T;
  c.whipT += dt; c.hitT += dt; c.ramT += dt; c.hurtT += dt; if (c.ghost > 0) c.ghost -= dt; if (c.auto > 0) c.auto -= dt; if (c.anger > 0) c.anger -= dt;
  if (c.st === 'grid') return;
  if (c.st === 'out') { c.outT += dt; c.v = Math.max(0, c.v - 20 * dt); c.p += c.v * dt; c.vd *= 0.9; c.d = clamp(c.d + c.vd * dt, T.dMin, T.dMax); c.slide = 0; c.scrape = 0; c.lat = 0; return; }
  if (c.st === 'wreck') {
    c.wt += dt; c.v = Math.max(0, c.v - 26 * dt); c.p += c.v * dt; c.vd *= 0.9; c.slide = 0; c.scrape = 0; c.lat = 0;
    if (c.wt >= R.wreckT) { c.st = 'run'; c.v = 2.5; c.vd = 0; c.urge = 0; c.ghost = 1.5; c.wt = 0; c.onW = 0; c.d = clamp(c.d, T.dMin + 1.2, T.dMax - 1.2); }
    return;
  }
  turnInfo(T, sOf(T, c.p)); const inT = TI.k, dist = TI.dist, r = T.Rc + c.d, fin = c.st === 'fin';
  const u = fin ? 0 : c.u; let b = fin ? 0 : c.b;
  const kc = PH.KC * (c.me ? R.cfScale : 1);
  if (c.me && R.assist && !fin) {            // learning levels: the team looks after itself, less and less
    const vh0 = holdSpeed(T, r, kc);
    if (inT) { if (c.v > vh0 * R.assistIn) { b = 1; c.auto = 0.3; } }                                              // in the turn it steadies itself (a safety net that still costs you the line)
    else if (R.assistPre > 0 && c.v > vh0 && dist <= (c.v * c.v - vh0 * vh0) / (2 * PH.brk) * R.assistPre + 1.5) { b = 1; c.auto = 0.3; }   // on the first levels it also slows in good time
  }
  // speed: cruising pace, plus what the whip has asked for, minus the reins
  if (c.blown > 0) { c.blown -= dt; if (c.blown <= 0) { c.blown = 0; c.wind = Math.max(c.wind, 0.3); } }
  if (c.balk > 0) c.balk -= dt;
  if (!c.ai) c.urge *= Math.exp(-dt / PH.tau * (c.slide > 0.4 ? 7 : b > 0.3 ? 3 : 1));       // reining in costs some of the pace; a slide throws most of it away
  const cru = PH.vTop * PH.cruise, vt = fin ? 9 : cru * (c.blown > 0 ? 0.8 : c.balk > 0 ? 0.93 : 1) + (c.blown > 0 ? 0 : c.urge) * (PH.vTop - cru);
  if (b > 0) { if (c.v > 5) c.v = Math.max(5, c.v - PH.brk * b * dt); }
  else if (c.v < vt) c.v = Math.min(vt, c.v + (PH.acc + PH.accU * c.urge) * (1 - Math.min(1, c.slide)) * dt);     // a sliding team cannot pull
  else c.v = Math.max(vt, c.v - PH.coast * dt);
  c.wind = Math.min(1, c.wind + PH.regen * (c.blown > 0 ? 2 : b > 0.3 ? 1.8 : 1) * dt);
  // sideways: the reins against the outward throw of the turn
  const cf = inT ? kc * c.v * c.v / rEff(T, r) : 0, g = Math.min(1, c.v / 9);
  c.vd += (u * PH.VLAT * g + cf - c.vd) * Math.min(1, dt * PH.resp);
  c.d += c.vd * dt; c.lat = cf;
  const sl = inT ? (cf - 0.72 * PH.VLAT) / (0.5 * PH.VLAT) : 0;
  c.slide = clamp(sl, 0, 1.5);
  if (cf > 0.85 * PH.VLAT && c.v > 6) c.v -= Math.min(8, 6 * (cf / PH.VLAT - 0.85)) * dt;        // sliding scrubs speed away (but less than the reins would)
  // far too fast with the reins hard over: the inner wheel lifts, and if it stays up the chariot goes over
  const lift = sl > 0.85 ? (Math.min(sl, 3) - 0.85) / 0.65 * Math.max(0, -u) : 0, t0 = c.tip;
  c.tip = lift > 0 ? Math.min(1, c.tip + lift * dt) : Math.max(0, c.tip - 1.6 * dt);
  if (c.tip > 0.2 && t0 <= 0.2) ev(R, c, 'lift');
  if (c.tip >= R.tipAt && R.tipWreck && !fin && c.ghost <= 0) { ev(R, c, 'tip'); wreckIt(c, R); return; }
  // the walls: the stands outside, the barrier and the posts inside
  c.scrape = Math.max(0, c.scrape - dt * 5);
  if (c.d > T.dMax) {
    const imp = Math.max(0, c.vd); c.d = T.dMax; c.vd = 0;
    if (!c.onW) { c.onW = 1; if (imp > 0.6) { c.v *= 1 - Math.min(0.55, 0.06 + imp * 0.05); c.hitT = 0; c.tHit = 1; ev(R, c, 'wall', imp); if (R.wallWreck && imp > R.wallAt && c.v > 12 && !fin) { wreckIt(c, R); return; } if (imp > 3 && !fin) { hurt(c, R, (imp - 3) * 2.2 * (c.me ? R.dmgIn : 1), null, 1); if (c.st === 'out') return; } } }
    if (c.v > 10) c.v = Math.max(10, c.v - 16 * dt); c.scrape = 1; c.tHit = 1;
  } else if (c.d < T.dMin) {
    const imp = Math.max(0, -c.vd), post = inT || dist < 1.5;
    c.d = T.dMin;
    if (post && R.postWreck && c.v > 9 && c.ghost <= 0 && !fin) { ev(R, c, 'post'); wreckIt(c, R); return; }
    c.vd = post ? 2.5 : 0;
    if (!c.onW) { c.onW = 1; if (imp > 0.6 || post) { c.v *= 1 - Math.min(0.4, 0.06 + imp * 0.045); c.hitT = 0; ev(R, c, 'wall', imp); if (imp > 3 && !fin) { hurt(c, R, (imp - 3) * 2.2 * (c.me ? R.dmgIn : 1), null, -1); if (c.st === 'out') return; } } }
    if (c.v > 10) c.v = Math.max(10, c.v - 16 * dt); c.scrape = 1; c.tHit = 1;
  } else if (c.d < T.dMax - 0.25 && c.d > T.dMin + 0.25) c.onW = 0;
  // forward: the inside of a turn is the short way round
  c.p += c.v * Math.sqrt(Math.max(0.15, 1 - c.vd * c.vd / (c.v * c.v + 1))) * dt * (inT ? T.Rc / r : 1);   // speed spent going sideways is not going forward
  const sT = strideT(c.v); c.ph += dt / sT; if (c.ph >= 1) { c.ph -= 1; c.beatN++; }
  c.gal += 2 * dt / sT; c.wheel += c.v * dt * 2;
}

// ---------- rivals: the same chariot, driven by rules ----------
function aiDrive(c, R, dt) {
  const T = R.T; turnInfo(T, sOf(T, c.p)); const inT = TI.k, dist = TI.dist, a = TI.a;
  if (inT !== c.wasT) {                     // each new straight: how well will it judge the next turn?
    c.wasT = inT;
    if (!inT) { const bad = Math.random() < c.pm; c.bErr = bad ? 5 + Math.random() * 9 : (Math.random() - 0.5) * 3; c.wob = bad && R.L >= 8 && Math.random() < 0.12; }
  }
  // the lane it wants: its own on the straight; into the turn a lane off the post, closing on its corner lane by the middle of the turn, drifting out at the exit.
  // That way in leaves the door open at the post: a team close behind that turns tighter can take the inside (and so can a rival, if you run wide).
  const ent = c.tin ? c.cl : Math.max(c.cl, T.dMin + 3.1);
  let dT = inT ? (a < 0.8 ? ent : a < 1.7 ? lerp(ent, c.cl, (a - 0.8) / 0.9) : c.cl + (a > 2 && !c.hug ? (a - 2) * 3 : 0)) : dist < 80 ? lerp(ent, c.sl, clamp((dist - 12) / 68, 0, 1)) : c.sl;
  let slow = null, sdp = 1e9;
  for (const o of R.cars) {
    if (o === c || o.st === 'grid' || o.st === 'fin' || o.st === 'out' || o.ghost > 0) continue;
    let dp = o.p - c.p; dp -= Math.round(dp / T.L) * T.L;
    if (dp > 1 && dp < 7 + c.v * 0.6 && Math.abs(o.d - dT) < 2.9 && (o.v < c.v - 0.2 || o.st === 'wreck')) { if (dp < sdp) { slow = o; sdp = dp; } }
    else if (Math.abs(dp) < 5.6 && Math.abs(o.d - c.d) < 3.3) {          // someone alongside: keep a wheel's width (but it will not be herded on to a wall by you: it holds its ground 1.7 m out)
      if (o.d > c.d) { const y = o.d - 3.0; if (y < dT) dT = o.me ? Math.max(y, Math.min(dT, T.dMin + 1.7)) : y; }
      else { const y = o.d + 3.0; if (y > dT) dT = o.me ? Math.min(y, Math.max(dT, T.dMax - 1.7)) : y; }
    }
  }
  let boxed = false;
  if (slow) {                               // a slower team ahead: go round, inside or outside, whichever is open
    const free = d => d > T.dMin + 0.2 && d < T.dMax - 0.2 && !R.cars.some(o => { if (o === c || o === slow || o.st === 'grid' || o.st === 'out') return false; let dp = o.p - c.p; dp -= Math.round(dp / T.L) * T.L; return Math.abs(dp) < 9 && Math.abs(o.d - d) < 2.8; });
    const din = slow.d - 3.1, dout = slow.d + 3.1, fi = free(din), fo = free(dout);
    if (c.side && R.t - c.sideT > 1.5) c.side = 0;
    if (!c.side) { c.side = fi && fo ? (Math.abs(din - c.d) < Math.abs(dout - c.d) ? -1 : 1) : fi ? -1 : fo ? 1 : 0; c.sideT = R.t; }
    if (c.side === -1 && fi) dT = din; else if (c.side === 1 && fo) dT = dout; else if (fi) dT = din; else if (fo) dT = dout; else boxed = true;
  }
  if (c.agg && !inT && dist > 40) {         // the favourite covers the line of whoever is coming up behind
    for (const o of R.cars) { if (o === c || o.st !== 'run') continue; let dp = c.p - o.p; dp -= Math.round(dp / T.L) * T.L; if (dp > 5.5 && dp < 15 && o.v > c.v + 0.4) { dT = lerp(dT, o.d, c.agg); break; } }
  }
  const fight = c.ai ? aiFight(c, R, dt, inT, dist) : 0;                    // 1 winding up beside you, 2 swinging in, 3 pulling away from your swing, 4 coming across to you
  if (fight === 1) dT = c.rmD0 - c.rmS * 0.5; else if (fight === 4) dT = R.me.d - c.rmS * 4.2;       // (winding up, it leans half a metre away and holds that line)
  dT = clamp(dT, T.dMin + 0.45, T.dMax - 0.5);
  const kc = PH.KC * (c.me ? R.cfScale : 1), r = T.Rc + c.d, cf = inT ? kc * c.v * c.v / rEff(T, r) : 0, g = Math.min(1, c.v / 9);
  c.u = clamp((clamp((dT - c.d) * 1.6, -5.5, 5.5) - cf) / (PH.VLAT * g), -1, 1);
  if (fight === 2) c.u = c.rmS; else if (fight === 3) c.u = c.dgS;
  if (inT && cf > 1.2 * PH.VLAT) c.u = Math.max(c.u, -0.3);                 // far too fast: ease the reins and run wide rather than flip
  const vh = holdSpeed(T, T.Rc + (inT ? Math.max(c.d, dT) : dT), kc) * c.cs;
  let b = 0;
  if (inT) { if (c.v > vh * 1.02) b = clamp((c.v - vh) / 2.5, 0.25, 1); }
  else if (c.v > vh && dist + c.bErr <= (c.v * c.v - vh * vh) / (2 * PH.brk) + c.v * 0.04) b = 1;
  if (!b && boxed && sdp < 9 && c.v > slow.v) b = 0.6;
  c.b = b;
  if (c.wob && inT && a > 0.9) { c.wob = false; wreckIt(c, R); return; }       // once in a while a wheel comes off
  if (!c.ai) return;                        // (the test autopilot borrows the steering and braking above, but whips for itself)
  // how hard it drives: steady, a little kept back early, everything on the last half-lap
  let uT = clamp(c.uA * (0.88 + 0.12 * Math.min(1, c.p / T.L)) + (c.p > (R.laps - 0.45) * T.L ? 0.08 : 0), 0, 1);
  if (fight === 1 || fight === 4) { let dp = R.me.p - c.p; dp -= Math.round(dp / T.L) * T.L; uT = clamp(uT + clamp(dp * 0.1, -0.3, 0.25), 0, 1); }      // keeping level with you while it winds up
  c.urge = b ? Math.max(0, c.urge - dt * 0.4) : c.urge + clamp(uT - c.urge, -dt * 0.25, dt * 0.5);
  if (!b && c.whipT > 1.4 + c.gal % 1 && c.urge < uT + 0.02 && uT > 0.1) c.whipT = 0;   // (for show) the whip arm
}

// A rough driver comes across to you, winds up where you can see it (the warning), then swings its chariot into yours.
// While it winds up it holds its line, so with room you can steer away out of reach; against a wall you cannot.
// Any driver may also pull away from your swing, if it sees it coming and has room. Returns 1 winding up, 2 swinging, 3 pulling away, 4 coming across, 0 none of these.
function aiFight(c, R, dt, inT, dist) {
  const me = R.me, T = R.T, stop = () => { if (c.rm === 1 || c.rm === 2) R.atkCd = R.ramGap; c.rm = 0; if (me.warn && me.warn.by === c) me.warn = null; };      // (after any attack on you, nobody starts another for a while)
  if (c.rmCd > 0) c.rmCd -= dt; if (c.dgCd > 0) c.dgCd -= dt;
  if (me.st !== 'run' || me.ghost > 0 || c.ghost > 0) { if (c.rm) stop(); c.dgT = 0; return 0; }
  let dp = me.p - c.p; dp -= Math.round(dp / T.L) * T.L;
  const gap = me.d - c.d, ag = Math.abs(gap), sg = gap > 0 ? 1 : -1, turn = (inT || dist < 14) && !R.ramTurn;       // sg: which side of this driver you are on
  if (c.rm === 4) {                         // coming across the track to get within reach (no warning yet: you can see it coming)
    c.rmT += dt;
    if (Math.abs(dp) > 13 || sg !== c.rmS || c.rmT > 4.5 || turn) { stop(); c.rmCd = 2; return 0; }
    if (ag <= 4.8 && Math.abs(dp) < 3) { c.rm = 1; c.rmT = 0; c.rmD0 = c.d; me.warn = { by: c, sg, t: 0 }; ev(R, c, 'warn', sg); return 1; }
    return 4;
  }
  if (c.rm === 1) {                         // winding up: it holds its line for the length of the warning
    c.rmT += dt;
    if (Math.abs(dp) > 4.8 || sg !== c.rmS || turn) { stop(); c.rmCd = 2.5; return 0; }
    if (c.rmT >= R.tell) {
      if (ag > 6.6) { stop(); c.rmCd = R.ramCd * (0.6 + 0.5 * Math.random()); ev(R, c, 'miss', c.rmS); me.dodges++; return 0; }     // you are out of reach already: it thinks better of it
      c.rm = 2; c.rmT = 0; c.rmD0 = c.d;
    }
    return 1;
  }
  if (c.rm === 2) {                         // the swing: flat out sideways for a moment, hit or miss
    c.rmT += dt;
    if (c.ramT < 0.4 || c.rmT > 0.62 || Math.abs(c.d - c.rmD0) > 5 || sg !== c.rmS || Math.abs(dp) > 5.4) {
      if (c.ramT >= 0.4) { ev(R, c, 'miss', c.rmS); me.dodges++; }
      stop(); c.rmCd = R.ramCd * (0.7 + 0.6 * Math.random()); return 0;
    }
    return 2;
  }
  if (c.dgT > 0) { c.dgT -= dt; if (c.dgW > 0) { c.dgW -= dt; return 0; } return 3; }        // pulling away from your swing (after a moment to react)
  // your swing coming in: a good driver with room gets out of the way
  const close = -me.vd * sg;                // how fast you are coming sideways at this driver
  if (c.dgCd <= 0 && Math.abs(dp) < 4.4 && ag < 5.6 && close > 3.2 && -me.u * sg > 0.45) {
    c.dgCd = 0.9;                           // one look per swing
    const room = sg > 0 ? c.d - T.dMin : T.dMax - c.d;
    if (Math.random() < c.dodge && room > 1.8) { c.dgT = 0.5; c.dgW = 0.05 + Math.random() * 0.1; c.dgS = -sg; ev(R, c, 'evade'); }
    return 0;
  }
  // its own attack: only the rough ones start it, or anyone you have just rammed
  const want = c.anger > 0 ? Math.max(c.brute, 0.9) : c.brute;
  const level = Math.abs(dp) < 2.4, late = c.p > (R.laps - 0.5) * T.L;     // (on the last half-lap it only fights if you are right there: it has a race to win)
  if (want <= 0 || c.rmCd > 0 || R.atkCd > 0 || R.t < 5 || ag < 2.9 || ag > 11 || !(level || (!late && dp > -6 && dp < 9))) return 0;
  for (const o of R.cars) if (o.rm && o !== c) return 0;                  // one at a time: they do not gang up on you      // level with you, or near enough to get level by easing up or pressing on
  if ((inT || dist < 34) && !R.ramTurn) return 0;
  const room = sg > 0 ? T.dMax - me.d : me.d - T.dMin;                     // how far you could run before the wall stops you
  if (Math.random() < want * R.ramRate * (level ? 1 : 0.5) * (room < 3 ? 2 : 1) * dt) {
    c.rmT = 0; c.rmS = sg;
    if (level && ag <= 4.8) { c.rm = 1; c.rmD0 = c.d; me.warn = { by: c, sg, t: 0 }; ev(R, c, 'warn', sg); return 1; }
    c.rm = 4; return 4;
  }
  return 0;
}

// ---------- wheels and noses ----------
// One chariot swung into another. Each deals a blow by how fast it was really closing and whether it was meant; the one against a wall cannot ride the blow.
function ram(R, a, b, sg, vc, dp) {          // a is on the side sg of b (sg = +1: a is further out); returns false if it was only a brush
  const T = R.T, va = -a.vd * sg, vb = b.vd * sg;                          // how fast each was moving towards the other
  const ia = a.me ? (-a.u * sg >= 0.45 ? 1 : 0.3) : a.rm === 2 ? 1 : 0.3, ib = b.me ? (b.u * sg >= 0.45 ? 1 : 0.3) : b.rm === 2 ? 1 : 0.3;
  const blow = e => clamp((e - PH.RAMV) * PH.RAMK, 0, PH.RAMMAX);
  const fa = blow(Math.max(0, Math.min(va, vc)) * ia), fb = blow(Math.max(0, Math.min(vb, vc)) * ib);     // what a deals to b, and b to a
  if (fa <= 0 && fb <= 0) return false;
  const wheel = Math.abs(dp) < 1.4, pinA = sg > 0 ? a.d > T.dMax - 0.6 : a.d < T.dMin + 0.6, pinB = sg > 0 ? b.d < T.dMin + 0.6 : b.d > T.dMax - 0.6;
  let da = fb * Math.min(1.6, (wheel ? PH.WHEEL : 1) * (pinA ? PH.PIN : 1)) + fa * PH.RECOIL, db = fa * Math.min(1.6, (wheel ? PH.WHEEL : 1) * (pinB ? PH.PIN : 1)) + fb * PH.RECOIL;     // (the two bonuses together count for at most 1.6: no single blow takes most of a chariot)
  if (a.me) da *= R.dmgIn; if (b.me) db *= R.dmgIn;
  // the shove: they bounce apart; one held by a wall cannot give, so the other takes it all
  const wA = pinA ? 0 : pinB ? 1 : 0.5, j = 1.35 * vc;
  a.vd += sg * j * wA; b.vd -= sg * j * (1 - wA);
  a.v *= 1 - Math.min(0.14, 0.015 + 0.003 * da); b.v *= 1 - Math.min(0.14, 0.015 + 0.003 * db);
  if (a.ai) a.urge = Math.max(0, a.urge - da * 0.006); if (b.ai) b.urge = Math.max(0, b.urge - db * 0.006);
  a.ramT = 0; b.ramT = 0;
  const hitter = fa >= fb ? a : b, hit = hitter === a ? b : a, clash = Math.min(fa, fb) > 0.55 * Math.max(fa, fb);
  hitter.rams++; hit.hits++;
  if (hit.ai && hitter.me) { hit.anger = 7; if (hit.rm) { hit.rm = 0; hit.rmCd = 1.2; R.atkCd = Math.min(R.atkCd > 0 ? R.atkCd : 9, 2); if (R.me.warn && R.me.warn.by === hit) R.me.warn = null; } }   // a rammed rival loses its own swing, and remembers
  ev(R, hitter, 'ram', { to: hit, d: hitter === a ? db : da, back: hitter === a ? da : db, pin: hitter === a ? pinB : pinA, wheel, clash });
  hurt(a, R, da, b, -sg); hurt(b, R, db, a, sg);
  return true;
}
function collide(R) {
  const cs = R.cars, T = R.T;
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const a = cs[i], b = cs[j];
    if (a.st === 'grid' || b.st === 'grid' || a.st === 'fin' || b.st === 'fin' || a.st === 'out' || b.st === 'out' || a.ghost > 0 || b.ghost > 0) continue;
    let dp = a.p - b.p; dp -= Math.round(dp / T.L) * T.L;
    const dd = a.d - b.d, ox = PH.WID - Math.abs(dd), oz = PH.LEN - Math.abs(dp);
    if (ox <= 0 || oz <= 0) continue;
    const wa = a.st === 'wreck', wb = b.st === 'wreck';
    if (ox / PH.WID < oz / PH.LEN) {         // side by side: the wheels clash and push apart
      const sg = dd >= 0 ? 1 : -1, ma = wa ? 0 : wb ? 1 : 0.5, rel = (a.vd - b.vd) * sg;
      a.d += sg * ox * ma; b.d -= sg * ox * (1 - ma);
      if (rel <= -PH.RAMV && !wa && !wb && (a.me || b.me) && a.ramT > 0.5 && b.ramT > 0.5 && ram(R, a, b, sg, -rel, dp)) continue;      // a real blow (only you and whoever you are fighting; rivals do not wreck each other)
      if (rel < 0) { if (!wa) a.vd -= sg * rel * 0.6; if (!wb) b.vd += sg * rel * 0.6; }
      if (rel < -0.8) { if (!wa) a.v *= 0.985; if (!wb) b.v *= 0.985; ev(R, a, 'clash', -rel); ev(R, b, 'clash', -rel); }
    } else {                                 // nose to tail: the one behind is held up
      const front = dp > 0 ? a : b, rear = dp > 0 ? b : a;
      if (rear.st !== 'wreck') { const cap = front.st === 'wreck' ? 4 : front.v * 0.97; if (rear.v > cap) { if (rear.v - cap > 2.5) ev(R, rear, 'bump', rear.v - cap); rear.v = cap; } rear.p -= oz * 0.5; }
      if (front.st !== 'wreck') front.v += 0.15;
    }
  }
}

// ---------- the race ----------
function rankCars(R) {                       // finishers by time, then those still racing by distance, then the broken ones (the last to break ranks highest)
  const a = R.order, out = c => c.st === 'out' ? 1 : 0;
  a.sort((x, y) => (x.fin || 1e9) - (y.fin || 1e9) || out(x) - out(y) || (out(x) ? y.outAt - x.outAt : y.p - x.p)); for (let i = 0; i < a.length; i++) a[i].rank = i + 1;
}
function gradeTurn(R) {
  const me = R.me, x = me.tT / R.tIdeal, q = me.tHit ? 0 : x <= 1.3 ? 3 : x <= 1.7 ? 2 : 1;      // 3 perfect, 2 good, 1 wide, 0 scraped
  me.turns++;
  if (q === 3) { me.pTurns++; me.tChain++; me.wind = Math.min(1, me.wind + 0.1); } else me.tChain = 0;
  me.lastTurn = { q, t: me.tT, clear: me.tMin };
  ev(R, me, 'turn', q);
}
function playerWhip(R) {
  const me = R.me;
  if (R.phase === 'count') { if (R.ct > 0.5 && !me.jump) { me.jump = true; ev(R, me, 'jump'); } return; }
  if (R.phase !== 'race') return;
  if (me.st === 'grid') {                    // the start: a crack right on GO is a flying start
    if (me.jump) return;
    const perfect = R.t < 0.25; me.st = 'run'; me.urge = perfect ? 1 : 0.35; me.wind -= 0.04; me.whipT = 0; me.whips++; if (perfect) { me.pWhips++; me.chain = 1; }
    ev(R, me, perfect ? 'pstart' : 'whip', 1); return;
  }
  if (me.st !== 'run') return;
  if (me.blown > 0) { ev(R, me, 'spent'); return; }
  const e = Math.abs(beatErr(me)), beat = me.ph < 0.5 ? me.beatN : me.beatN + 1;
  let q = e <= R.wP ? 2 : e <= R.wG ? 1 : 0;
  if (beat === me.lastBeat) q = 0;           // one crack per beat
  me.lastBeat = beat;
  whip(me, q);
  if (q === 2) { me.chain++; me.pWhips++; me.topChain = Math.max(me.topChain, me.chain); } else me.chain = 0;
  ev(R, me, 'whip', q);
  if (me.blown > 0) ev(R, me, 'blown');
}
function raceStep(R, dt) {
  const T = R.T, me = R.me;
  if (R.phase === 'count') {                 // three trumpet notes, then GO
    R.ct += dt;
    const tk = Math.min(3, Math.floor(R.ct / 0.8));
    if (tk > R.tickN) { R.tickN = tk; ev(R, null, 'tick', tk - 1); }
    if (R.ct >= 3.2) { R.phase = 'race'; R.t = 0; for (const c of R.cars) c.react = c.me ? (me.jump ? 1.0 : R.autoStart) : c.rt; ev(R, null, 'go'); }
    return;
  }
  if (R.phase !== 'race' && R.phase !== 'finish') return;
  R.t += dt;
  for (const c of R.cars) {
    if (c.st === 'grid') { if (R.t >= c.react) c.st = 'run'; else continue; }
    if (c.ai && c.st === 'run') aiDrive(c, R, dt);
    stepChariot(c, dt, R);
  }
  collide(R);
  for (const c of R.cars) {
    if (c.st !== 'run') continue;
    const lap = Math.floor(c.p / T.L) + 1;
    if (lap !== c.lap && c.p > 0) {
      const lt = R.t - c.lapT0; c.lapT0 = R.t; if (!c.bestLap || lt < c.bestLap) c.bestLap = lt;
      c.lap = lap;
      if (c.p >= R.laps * T.L) { c.st = 'fin'; c.fin = R.t; c.place = ++R.finN; c.ghost = 99; if (c.me) finishRace(R); }
      else if (c.me) ev(R, c, 'lap', lap);
    }
  }
  rankCars(R);
  if (me.warn) { me.warn.t += dt; if (me.warn.by.rm === 0 && me.warn.t > 0.25) me.warn = null; }
  if (R.atkCd > 0) R.atkCd -= dt;
  if (R.phase === 'finish' && !R.res.board && !HEADLESS) settle(R);
  // your turns are timed from the moment you enter the half-circle to the moment you leave it
  if (me.st === 'run' || me.st === 'wreck') {
    turnInfo(T, sOf(T, me.p)); const kk = TI.k;
    if (kk && !me.inTurn) { me.inTurn = 1; me.tT = 0; me.tMin = 99; me.tHit = 0; }
    if (me.inTurn) { me.tT += dt; me.tMin = Math.min(me.tMin, me.d - T.dMin); if (!kk) { me.inTurn = 0; gradeTurn(R); } }
  }
  if (me.rank !== me.shown) {               // announce a change of place once it has held for a moment
    if (me.rank !== me.pend) { me.pend = me.rank; me.pendT = 0; } else if ((me.pendT += dt) > 0.35) { if (me.shown && R.t > 3 && R.phase === 'race') ev(R, me, 'rank', me.shown); me.shown = me.rank; }
  } else me.pend = 0;
}
function finishRace(R) {
  const me = R.me, T = R.T; R.phase = 'finish'; R.ft = 0;
  const ahead = R.cars.filter(c => c.fin && c !== me).sort((a, b) => b.fin - a.fin)[0];           // the one who crossed just before you
  const behind = R.cars.filter(c => !c.fin && c.st !== 'out').sort((a, b) => b.p - a.p)[0];                         // the nearest still racing
  R.res = { place: me.place, time: me.fin, lap: me.bestLap, ok: me.place <= R.need,
    gapAhead: ahead ? me.fin - ahead.fin : 0, ahead: ahead ? ahead.full : '', gapBehind: behind ? (me.p - behind.p) / Math.max(8, behind.v) : 0, behind: behind ? behind.full : '',
    winner: R.order[0] };
  ev(R, me, 'finish', me.place);
}
function endOut(R) {                         // your own chariot has broken up: the race is over for you
  const me = R.me; R.phase = 'finish'; R.ft = 0; rankCars(R);
  R.res = { place: me.rank, time: 0, lap: me.bestLap, ok: false, out: true, by: me.by ? me.by.full : '', gapAhead: 0, ahead: '', gapBehind: 0, behind: '', winner: R.order[0] };
  ev(R, me, 'finish', me.rank);
}
function settle(R) {                         // out of sight, the rest of the field is run to the line, so every gap on the board is the real one, not a guess
  const res = R.res, me = R.me, save = R.cars.map(c => Object.assign({}, c)), t0 = R.t, f0 = R.finN, hd = HEADLESS, evs = R.evs;
  res.board = [];                            // (set first: the steps below must not settle again)
  HEADLESS = true; R.evs = [];
  for (let i = 0; i < 60 * 150 && R.cars.some(c => !c.fin && c.st !== 'out'); i++) raceStep(R, 1 / 60);
  res.board = R.cars.map(c => ({ c, fin: c.fin, out: c.st === 'out', at: c.outAt })).sort((a, b) => (a.fin || 1e9) - (b.fin || 1e9) || (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.at - a.at);
  const nx = res.board[res.board.findIndex(x => x.c === me) + 1];
  if (nx && nx.fin) { res.gapBehind = nx.fin - me.fin; res.behind = nx.c.full; } else { res.gapBehind = 0; res.behind = ''; }
  R.cars.forEach((c, i) => { for (const key in c) delete c[key]; Object.assign(c, save[i]); });
  R.t = t0; R.finN = f0; R.evs = evs; HEADLESS = hd; rankCars(R);
}
