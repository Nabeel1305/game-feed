// Robot players for Plunder's tests (games/plunder/test_play.py). They play through window.__sim, with a person's limits:
// they see a blow only after a reaction time, they fumble some blocks, and at sea they re-think the wheel only so often.
// Sea: 'plan' looks a couple of seconds ahead and keeps out of loaded fans; 'chase' is a beginner (steer at her, turn a side to her);
// 'straight', 'spam', 'circle', 'weave' are lazy. Boarding: 'good' reads, blocks, ripostes; the rest are lazy (idle, slices, stabs, scribble, block, dodge, pistol).
const S = window.__sim, DT = 1 / 60;
const L = Object.assign({}, S, { manGeo: () => S.geo(), YOU: S.you, fStroke: (G, a, b, c, d) => S.stroke(a, b, c, d), fPoke: (G, x, y) => S.poke(x, y), fDodge: () => S.dodge(), fAim: (G, x, y) => S.aim(x, y), fAimMove: (G, x, y) => S.aimMove(x, y), fFire: () => S.fire(), fReload: (G, on) => S.reload(on), aimAt: () => S.aimAt() });
function rnd32(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let RND = rnd32(1);
// a captain who looks ahead: tries each way of putting the wheel, keeps out of the fans of loaded guns, and keeps a ship in front of his own
// is a ship I could fire at nearly on a loaded beam of mine (within the gold arc and a little more)?
const nearBeam = (G, extra) => { const me = G.me; for (const t of G.foes) { if (!t.alive || t.gone || (t.K.navy && t.struck)) continue; const r = L.relTo(me, t), sd = r.lx >= 0 ? 1 : 0; if (me.load[sd] <= 0.3 && r.d < L.SEA.RANGE && Math.abs(Math.atan2(r.ly, Math.abs(r.lx))) < L.SEA.ARC + extra) return true; } return false; };
function planBot(o = {}) {
  const react = o.react == null ? 0.25 : o.react, noise = o.noise || 0, H = o.horizon || 2.2;
  let think = 0, rud = 0, letGo = 0;
  const inWedge = (sx, sy, sh, tx, ty, arc, range) => { const dx = tx - sx, dy = ty - sy, lx = dx * Math.cos(sh) - dy * Math.sin(sh), ly = dx * Math.sin(sh) + dy * Math.cos(sh), d = Math.hypot(dx, dy); if (d > range) return 0; return Math.abs(Math.atan2(ly, Math.abs(lx))) < arc ? (lx >= 0 ? 2 : 1) : 0; };
  return (G) => {
    const me = G.me, tg = G.foes.filter(s => s.alive && !s.gone && s.K.navy && !s.struck);
    if (G.phase === 'sight') { G.choice = 'raid'; return; }
    if (G.phase !== 'battle') { G.in.held = false; G.in.rud = 0; G.in.fire = false; return; }
    G.in.held = true; think -= DT;
    if (think <= 0 && tg.length) {
      think = react; let best = -1e9, pick = 0; const c = G.cfg;
      // The guns need a level deck: the wheel let go, for a moment. So a plan is "wheel this way for so long, then let it go",
      // and only the let-go part of it can bring the guns to bear.
      const plans = [[0, 0]]; for (const c of [-1, -0.5, 0.5, 1]) for (const t1 of [0.4, 0.9, 1.5, 9]) plans.push([c, t1]);
      for (const [c0, t1] of plans) {
        let x = me.x, y = me.y, h = me.hdg, v = me.v, score = 0; const st = 0.2, level = t1 ? t1 + 0.5 : Math.max(0, 0.3 - G.evenT);
        const fs = tg.map(s => ({ x: s.x, y: s.y, h: s.hdg, v: s.v, w: s.rud * s.K.turn * L.clamp(s.v / 30, 0.25, 1), s }));
        for (let tau = st; tau <= H + 1e-6; tau += st) {
          const cand = tau <= t1 ? c0 : 0; h += cand * me.K.turn * L.clamp(v / 30, 0.25, 1) * st; x += Math.sin(h) * v * st; y += Math.cos(h) * v * st;
          for (const f of fs) {
            f.h += f.w * st; f.x += Math.sin(f.h) * f.v * st; f.y += Math.cos(f.h) * f.v * st;
            const d = Math.hypot(f.x - x, f.y - y), wq = inWedge(f.x, f.y, f.h, x, y, L.SEA.ARC_E + 0.06, L.SEA.E_RANGE + 6);
            if (wq) { const side = wq - 1; if (tau >= f.s.load[side] - 0.2) score -= st * 3.2 * (c.eSide / 30); }
            const mq = inWedge(x, y, h, f.x, f.y, L.SEA.ARC - 0.04, L.SEA.RANGE - 6);
            if (mq && tau >= level) { const side = mq - 1; if (tau >= me.load[side]) { const rel = Math.abs(Math.cos(Math.atan2(f.x - x, f.y - y) - f.h)); score += st * (rel > 0.8 ? 2.0 : 1.0) / Math.max(1, tau); } }
            score -= st * Math.abs(d - 58) / 100 * 0.6 + st * Math.max(0, d - 105) / 40; if (d < 30) score -= st * 2;
          }
        }
        score += (RND() - 0.5) * noise - Math.abs(c0 - rud) * 0.03;
        if (score > best) { best = score; pick = c0; }
      }
      rud = pick;
    }
    const aim = G.inArc[0] || G.inArc[1];      // a ship in front of loaded guns: let the wheel go (the guns need a level deck for a moment), keep it let go, and fire when it lights
    if (aim) letGo = 0.7; else letGo -= DT;
    G.in.rud = aim || (letGo > 0 && nearBeam(G, 0.16)) ? 0 : rud; G.in.fire = (G.lit[0] || G.lit[1]) && !G.in.fire;
  };
}
function seaBot(kind, o = {}) {
  let think = 0, rud = 0, cross = 0, letGo = 0;
  return (G) => {
    const me = G.me, tg = G.foes.filter(s => s.alive && !s.gone && s.K.navy && !s.struck);
    if (G.phase === 'sight') { G.choice = 'raid'; return; }
    if (G.phase !== 'battle') { G.in.held = false; G.in.rud = 0; G.in.fire = false; return; }
    G.in.held = true;
    if (kind === 'straight') { G.in.rud = 0; G.in.fire = false; return; }
    if (kind === 'spam') { G.in.rud = 0; G.in.fire = !G.in.fire; return; }
    if (kind === 'circle') { G.in.rud = 1; G.in.fire = !G.in.fire; return; }
    if (kind === 'weave') { G.in.rud = Math.sin(G.t * 1.6) > 0 ? 1 : -1; G.in.fire = !G.in.fire; return; }
    const tapLit = () => { G.in.fire = (G.lit[0] || G.lit[1]) && !G.in.fire; };      // lazier still, but watching the button: the wheel never changes its ways, FIRE whenever it lights
    const tapArc = () => { G.in.fire = (G.inArc[0] || G.inArc[1]) && !G.in.fire; };    // ...or whenever a ship is in the gold arc, lit or not
    if (kind === 'litcircle') { G.in.rud = 1; tapLit(); return; }
    if (kind === 'gentle') { G.in.rud = 0.3; tapLit(); return; }
    if (kind === 'gentleweave') { G.in.rud = Math.sin(G.t * 1.6) > 0 ? 0.3 : -0.3; tapLit(); return; }
    if (kind === 'litstraight') { G.in.rud = 0; tapLit(); return; }
    if (kind === 'gentlespam') { G.in.rud = Math.sin(G.t * 1.6) > 0 ? 0.3 : -0.3; G.in.fire = !G.in.fire; return; }      // a wiggle, and FIRE as fast as it will go
    if (kind === 'arcweave') { G.in.rud = Math.sin(G.t * 1.6) > 0 ? 0.3 : -0.3; tapArc(); return; }                                   // a wiggle, and FIRE whenever a ship is in the gold arc
    if (kind === 'sweep') { G.in.rud = G.t % 3.6 < 2 ? 0.6 : 0; tapLit(); return; }                                                    // turn a while, let go a while, round and round; FIRE when it lights
    if (kind === 'sweep2') { const ph = G.t % 5; G.in.rud = ph < 1.2 ? 1 : ph < 2.5 ? 0 : ph < 3.7 ? -1 : 0; tapLit(); return; }        // hard one way, let go, hard the other, let go; FIRE when it lights
    think -= DT;
    if (think <= 0 && tg.length) {
      think = o.think || 0.2;
      let t = tg[0], bd = 1e9; for (const s of tg) { const d = L.relTo(me, s).d; if (d < bd) { bd = d; t = s; } }
      const r = L.relTo(me, t), back = L.relTo(t, me);
      let hx, hy;                                             // the way I want to be going
      if (kind === 'chase') {                                 // a new player: steer at her, and once close keep a side turned to her
        if (r.d < 100) cross = 1; else if (r.d > 135) cross = 0;
        const side = r.brg >= 0 ? 1 : -1, want = !cross ? 0 : r.d < 36 ? side * 1.95 : side * Math.PI / 2;
        rud = L.clamp(L.wrapA(r.brg - want) * 3, -1, 1);
      } else if (kind === 'orbit') {                          // circle her close, faster than she can turn
        const ux = (t.x - me.x) / (r.d || 1), uy = (t.y - me.y) / (r.d || 1), dir = (ux * L.fwdY(me) - uy * L.fwdX(me)) >= 0 ? 1 : -1;      // which way round I am already going
        const R0 = o.R || 58, k = L.clamp((r.d - R0) / 30, -1, 1.5), tx = -uy * dir, ty = ux * dir; hx = tx + ux * k; hy = ty + uy * k;
        const want = Math.atan2(hx, hy); rud = L.clamp(L.wrapA(want - me.hdg) * 3, -1, 1);
      } else {                                                // good: come in on her stern, cross it close, go round and do it again
        const fx = L.fwdX(t), fy = L.fwdY(t), ux = (t.x - me.x) / (r.d || 1), uy = (t.y - me.y) / (r.d || 1);
        const astern = back.ly < -14 && Math.abs(back.lx) < -back.ly * 1.3 + 14;
        if (!astern) { cross = 0; const ax = t.x - fx * 58 - me.x, ay = t.y - fy * 58 - me.y, n = Math.hypot(ax, ay) || 1; hx = ax / n; hy = ay / n; if (r.d < 52) { hx -= ux * 1.2; hy -= uy * 1.2; } }
        else { if (!cross) cross = back.lx >= 0 ? -1 : 1; const k = L.clamp((r.d - 46) / 30, -1, 1); hx = L.rgtX(t) * cross + ux * k; hy = L.rgtY(t) * cross + uy * k; if (Math.abs(back.lx) > 30 && Math.sign(back.lx) === cross) cross = -cross; }
        const want = Math.atan2(hx, hy); rud = L.clamp(L.wrapA(want - me.hdg) * 3, -1, 1);
      }
    }
    const aim = G.inArc[0] || G.inArc[1];
    if (aim) letGo = 0.7; else letGo -= DT;
    G.in.rud = aim || (letGo > 0 && nearBeam(G, 0.16)) ? 0 : rud; G.in.fire = (G.lit[0] || G.lit[1]) && !G.in.fire;
  };
}
function boardBot(kind, o = {}) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  let seen = null, plan = null, nextIn = 0, alt = 0, aimT = -1, lastProvoke = -9, wasOpen = false;
  return (G) => {
    const F = G.fight, m = F.man, R = RND; if (!F || F.phase !== 'fight' || !m) { plan = null; seen = null; return; }
    const g = L.manGeo(F), C = L.YOU(), f = L.fu();
    nextIn -= DT;
    const slice = () => { const a = R() * 6.28, r = 70 * f; L.fStroke(G, g.chest.x + Math.cos(a) * r, g.chest.y + Math.sin(a) * r * 0.5, g.chest.x - Math.cos(a) * r, g.chest.y - Math.sin(a) * r * 0.5); };
    const stab = () => L.fPoke(G, g.chest.x + (R() - 0.5) * 20, g.chest.y + (R() - 0.5) * 20);
    if (kind === 'idle') return;
    if (kind === 'slices') { if (nextIn <= 0) { slice(); nextIn = 0.11; } return; }
    if (kind === 'stabs') { if (nextIn <= 0) { stab(); nextIn = 0.1; } return; }
    if (kind === 'scribble' || kind === 'slowscribble') { if (nextIn <= 0) { L.fStroke(G, R() * 390, 150 + R() * 400, R() * 390, 150 + R() * 400); nextIn = kind === 'scribble' ? 0.12 : 0.5; } return; }
    if (kind === 'slow') { if (nextIn <= 0) { if (alt++ % 2) stab(); else slice(); nextIn = 1.2; } return; }      // a metronome: one blow every 1.2 s, never a block
    if (kind === 'pistol') { if (F.loaded && !F.aim) { L.fAim(G, 330, 760); aimT = F.t; } else if (F.aim && F.t - aimT > 1.0) { const p = L.aimAt(F); L.fAimMove(G, 330 + (g.chest.x - p.x) / 1.3 + F.aim.dx / 1.3, 760 + (g.chest.y - p.y) / 1.3 + F.aim.dy / 1.3); L.fFire(G); } else if (!F.loaded && G.shots > 0 && !F.reloading) L.fReload(G, true); return; }
    // reading his blow
    const atk = (m.os === 'windup' || m.os === 'strike') ? m.atk : null;
    if (atk && seen !== atk) { seen = atk; plan = { at: F.t + react, done: false, feinted: atk.feinted }; }
    if (atk && plan && atk.feinted && !plan.feinted) { plan = { at: F.t + react, done: false, feinted: true }; }
    if (!atk) { seen = null; plan = null; }
    const landIn = atk ? (m.os === 'windup' ? atk.wind - m.ot + 0.1 : 0.1 - m.ot) : 9;
    if (kind === 'dodge') { if (atk && !plan.done && F.t >= plan.at && landIn <= 0.3) { L.fDodge(G); plan.done = true; } return; }
    if (atk && plan && !plan.done && F.t >= plan.at) {
      if (atk.kind === 'heavy' || atk.kind === 'shot') { if (landIn <= 0.3) { L.fDodge(G); plan.done = true; } }
      else {
        const ideal = plan.ideal || (plan.ideal = G.cfg.parryWin * (o.timing === 'any' ? 0.12 + 0.8 * R() : 0.3));      // aim for a late, clean block (or, an ordinary player: any time it will count)
        if (landIn <= Math.max(ideal, 0.06)) {
          plan.done = true;
          if (R() < acc) {
            if (atk.kind === 'cut') {      // across his blade, out on the side it comes from; a real thumb is never square to it, nor centred on it
              const w = o.wob == null ? 0.6 : o.wob, u = 0.22 + (R() - 0.5) * 0.24 * w, px = atk.sx + (atk.ex - atk.sx) * u, py = atk.sy + (atk.ey - atk.sy) * u;
              const a = Math.atan2(atk.ey - atk.sy, atk.ex - atk.sx) + Math.PI / 2 + (R() - 0.5) * 1.2 * w, len = (55 + (R() - 0.5) * 40 * w) * f, sh = (R() - 0.5) * 50 * w * f, cx = px + Math.cos(a) * sh, cy = py + Math.sin(a) * sh;
              L.fStroke(G, cx - Math.cos(a) * len, cy - Math.sin(a) * len, cx + Math.cos(a) * len, cy + Math.sin(a) * len); }
            else L.fStroke(G, atk.px - 50 * f, atk.py - 30 * f, atk.px + 50 * f, atk.py + 30 * f);
          } else L.fStroke(G, C.x - 60, C.y + 60, C.x + 60, C.y + 90);      // fumbled it
        }
      }
      return;
    }
    if (kind === 'block') return;
    if (atk) return;
    if (F.aim) { if (F.t - aimT > 0.5) { const p = L.aimAt(F); L.fAimMove(G, F.aim.ox + F.aim.dx / 1.3 + (g.chest.x - p.x) / 1.3, F.aim.oy + F.aim.dy / 1.3 + (g.chest.y - p.y) / 1.3); L.fFire(G); } return; }
    if (nextIn > 0 || F.pBusy > 0 || F.pStun > 0 || m.z < 0.9) return;
    const open = m.os === 'stagger' || (m.os === 'recover' && m.open);
    if (open) {      // he is open: strike
      wasOpen = true;
      if (m.os === 'stagger' && o.gun && F.loaded && (m.capt || m.type === 'officer') && m.stag - m.ot > 0.75) { L.fAim(G, 330, 760); aimT = F.t; return; }
      if (m.os === 'stagger') stab(); else slice(); nextIn = 0.34; return;
    }
    if (wasOpen) { wasOpen = false; if (R() < (o.greed == null ? 0.2 : o.greed)) { slice(); nextIn = 0.4; return; } }      // (sometimes one blow too many, as people do: he turns it and cuts you for it)
    // he is on guard: nothing will land, and trying costs you. Wait for his blow.
    if (m.os === 'guard' && o.poke && F.t - lastProvoke > o.poke) { stab(); lastProvoke = F.t; nextIn = 0.4; }
    // a player who starts it: a burst of blows at his guard until it breaks (hit him while he reels), then stop and wait
    if (o.burst && m.os === 'guard' && !(m.set > 0) && !(m.soft > 0) && F.t - lastProvoke > o.burst) { slice(); nextIn = 0.45; if (m.os === 'stagger') lastProvoke = F.t; }
    if (o.burst && m.os === 'block' && !m.rip && !(m.set > 0)) { nextIn = 0.1; }      // (an impatient player: a jab at a man on guard every so often)
  };
}
function runBoard(N, bot, seed, o) {
  RND = rnd32(seed * 31 + 7); S.start(N, { seed }); S.board(); const G = S.G, b = boardBot(bot, o); let n = 0;
  while (!G.over && n++ < 60 * 400) { b(G); S.step(DT); }
  return { won: G.over === 'won', t: G.t, stage: G.fight.stage, wounds: G.took.wounds, drop: G.fight.dropped, shots: G.shots, navy: G.fight.navy };
}
// A player taking the lessons of the first three boardings: the honest robot, plus a burst at his guard when that is the lesson,
// and the pistol (dragging the sights on) when that is. Returns how long each lesson took, and whether he then took the ship.
function runLessons(N, seed, o = {}) {
  RND = rnd32(seed * 31 + 7); S.start(N, { seed, teach: true }); S.board(); const G = S.G, b = boardBot('good', Object.assign({ react: 0.35, acc: 0.85 }, o)); let n = 0, last = -1, t0 = 0; const took = [];
  while (!G.over && n++ < 60 * 600) { const F = G.fight, D = F.drill;
    if (D && D.i !== last) { if (last >= 0) took.push(+(F.t - t0).toFixed(1)); last = D.i; t0 = F.t; }
    if (!D && last >= 0 && took.length < (DRILLS_N(G))) took.push(+(F.t - t0).toFixed(1));
    const st = D && D.steps[D.i];
    if (st && st.id === 'break' && F.phase === 'fight' && F.man && F.pBusy <= 0 && (F.man.os === 'guard' || F.man.os === 'block' || F.man.os === 'stagger') && !(F.man.set > 0) && R() < 0.2) { const g = S.geo(); S.stroke(g.chest.x - 70, g.chest.y - 10, g.chest.x + 70, g.chest.y + 10); }
    else if (st && st.id === 'pistol' && F.phase === 'fight' && F.man && F.man.os === 'guard') { if (!F.aim && F.loaded) S.aim(332, 770); else if (F.aim && F.aim.t > 1.0) { const p = S.aimAt(), g = S.geo(); S.aimMove(332 + (g.chest.x - p.x) / 1.3, 770 + (g.chest.y - p.y) / 1.3); S.step(DT); S.fire(); } }
    else b(G);
    S.step(DT); }
  return { won: G.over === 'won', t: Math.round(G.t), took, left: G.fight.drill ? G.fight.drill.i : -1 };
}
const DRILLS_N = G => ({ 1: 5, 2: 4, 3: 1 })[G.N] || 0;
const R = () => RND();
function runSea(N, bot, seed, o) {
  RND = rnd32(seed * 31 + 7); S.start(N, { seed }); const G = S.G; G.nextSight = 0.1; const b = bot === 'plan' ? planBot(o) : seaBot(bot, o); let n = 0, res = null;
  while (!G.over && n++ < 60 * 300) { b(G); S.step(DT); if (G.phase === 'board') { res = 'boarded'; break; } }
  return { ok: res === 'boarded', t: G.t, hull: Math.round(G.me.hull), navy: G.sight ? G.sight.navy : 0, n: G.sight ? G.sight.ships.length : 0, over: G.over, stuck: !res && !G.over };
}
function runAll(N, seed, so, bo) {
  RND = rnd32(seed * 31 + 7); S.start(N, { seed }); const G = S.G, sb = so === 'chase' ? seaBot('chase') : planBot(so), bb = boardBot('good', bo); let n = 0; const ph = {};
  while (!G.over && n++ < 60 * 600) { if (G.phase === 'board') bb(G); else sb(G); S.step(DT); ph[G.phase] = (ph[G.phase] || 0) + DT; }
  const h = G.over === 'won' ? S.haulOf(G) : null;
  return { won: G.over === 'won', t: G.t, at: G.phase, sea: ph.battle || 0, board: ph.board || 0, hull: G.me.hull, wounds: G.took.wounds, stars: G.over === 'won' ? S.starsOf(G) : 0, haul: h ? h.total : 0, ships: G.sight ? G.sight.ships.map(s => s.kind).join('+') : '', res: G.res };
}

// ---- BLIND PLAYERS. "Spamming cannot win": a player who is not looking at all, however he spends his thumbs, must not win.
// Robots with a few habits prove little (the first lot here lost, and a steady "swipe down the middle three times a second"
// still won the first expeditions). So the proof is a search: every short string of moves on every beat, with no eyes at all.
//
// The fight. Moves:  T tap his chest   S slice across his chest   L / R a clean block stroke out on your left / right (it
//  touches nothing else)   U a block stroke over his head   / \ one stroke that both crosses a side's blade and cuts him
//  M a swipe through the middle   V straight down the middle   B a stroke beside his belly (where thrusts come)   D dodge
//  A raise the pistol   F fire it   r hold to reload   q let go   . wait
function blindMove(mv) {
  const g = S.geo(), C = S.you(), f = S.fu();
  const side = (sg) => { const a = (sg < 0 ? -150 : -30) * Math.PI / 180, px = C.x + Math.cos(a) * 109 * f, py = C.y + Math.sin(a) * 109 * f, nx = -Math.sin(a), ny = Math.cos(a); S.stroke(px - nx * 55 * f, py - ny * 55 * f, px + nx * 55 * f, py + ny * 55 * f); };
  if (mv === 'T') S.poke(g.chest.x, g.chest.y);
  else if (mv === 'S') S.stroke(g.chest.x - 70 * f, g.chest.y - 15 * f, g.chest.x + 70 * f, g.chest.y + 15 * f);
  else if (mv === 'L') side(-1); else if (mv === 'R') side(1);
  else if (mv === 'U') S.stroke(C.x - 55 * f, C.y - 110 * f, C.x + 55 * f, C.y - 110 * f);
  else if (mv === '/') S.stroke(C.x - 135 * f, C.y - 19 * f, C.x + 35 * f, C.y - 109 * f);
  else if (mv === '\\') S.stroke(C.x + 135 * f, C.y - 19 * f, C.x - 35 * f, C.y - 109 * f);
  else if (mv === 'M') S.stroke(C.x - 95 * f, C.y - 20 * f, C.x + 95 * f, C.y - 20 * f);
  else if (mv === 'V') S.stroke(C.x, C.y - 80 * f, C.x, C.y + 50 * f);
  else if (mv === 'B') S.stroke(C.x - 60 * f, C.y - 70 * f, C.x - 60 * f, C.y + 20 * f);
  else if (mv === 'D') S.dodge(); else if (mv === 'A') S.aim(332 * f, 770 * f); else if (mv === 'F') S.fire(); else if (mv === 'r') S.reload(true); else if (mv === 'q') S.reload(false);
}
const lcg = seed => { let rs = (seed * 7919 + 13) | 0; return () => { rs = (Math.imul(rs, 1103515245) + 12345) & 0x7fffffff; return rs / 0x7fffffff; }; };
const fightOver = G => ({ won: G.over === 'won', t: G.t, parts: G.fight.stage + (G.over === 'won' ? 1 : 0) });
// a string of moves, one every P seconds (a tenth either way, as a thumb is), for ever
function blindBeat(N, seed, pat, P) {
  S.start(N, { seed }); S.board(); const G = S.G, R = lcg(seed); let n = 0, i = 0, next = R() * P;
  while (!G.over && n++ < 60 * 240) { const F = G.fight; if (F.phase === 'fight' && F.man) { next -= DT; if (next <= 0) { blindMove(pat[i++ % pat.length]); next = P * (0.9 + 0.2 * R()); } } S.step(DT); }
  return fightOver(G);
}
// no beat at all: moves drawn from a bag at random, at random gaps
function blindRandom(N, seed, bag, mean) {
  S.start(N, { seed }); S.board(); const G = S.G, R = lcg(seed); let n = 0, next = 0;
  while (!G.over && n++ < 60 * 240) { const F = G.fight; if (F.phase === 'fight' && F.man) { next -= DT; if (next <= 0) { blindMove(bag[(R() * bag.length) | 0]); next = -Math.log(1 - R() * 0.999) * mean; } } S.step(DT); }
  return fightOver(G);
}
// the pistol first (raise it, hold it so long, fire, reload: three times), then a string of moves for ever
function blindGun(N, seed, pat, P, hold) {
  S.start(N, { seed }); S.board(); const G = S.G, R = lcg(seed); let n = 0, i = 0, next = 0, t0 = 0;
  while (!G.over && n++ < 60 * 300) { const F = G.fight;
    if (F.phase === 'fight' && F.man) {
      if (G.shots > 0 || F.aim || F.reloading) { if (F.loaded && !F.aim) { blindMove('A'); t0 = F.t; } else if (F.aim && F.t - t0 >= hold) S.fire(); else if (!F.loaded && !F.reloading && G.shots > 0) S.reload(true); }
      else { next -= DT; if (next <= 0) { blindMove(pat[i++ % pat.length]); next = P * (0.9 + 0.2 * R()); } } }
    S.step(DT); }
  return fightOver(G);
}
// many at once: spec = { pats, Ps, levels, n, seed } -> one row for each string and beat: wins on each level, parts of the ship taken
function blindBeats(spec) {
  const out = [];
  for (const pat of spec.pats) for (const P of spec.Ps) { const row = { pat, P, w: {}, parts: 0 };
    for (const N of spec.levels) { let w = 0; for (let s = 0; s < spec.n; s++) { const r = blindBeat(N, spec.seed + s * 17 + N, pat, P); w += r.won ? 1 : 0; row.parts += r.parts; } row.w[N] = w; }
    out.push(row); }
  return out;
}
// The sea. The wheel follows a fixed plan (segs: [[how far over, for how long], ...], round and round) and FIRE is tapped every Q
// seconds (0 = never). Hands off once she strikes (the helmsman takes her alongside).
function blindSea(N, seed, segs, Q) {
  S.start(N, { seed }); const G = S.G; G.nextSight = 0.1; let n = 0, i = 0, tSeg = 0, tFire = Q * 0.37, res = null;
  while (!G.over && n++ < 60 * 300) {
    if (G.phase === 'sight') G.choice = 'raid';
    else if (G.phase === 'battle') { G.in.held = true; tSeg -= DT; if (tSeg <= 0) { const s = segs[i++ % segs.length]; G.in.rud = s[0]; tSeg += s[1]; } G.in.fire = false; if (Q) { tFire -= DT; if (tFire <= 0) { G.in.fire = true; tFire += Q; } } }
    else { G.in.held = false; G.in.rud = 0; G.in.fire = false; }
    S.step(DT); if (G.phase === 'board') { res = 'boarded'; break; } }
  return { ok: res === 'boarded', t: G.t, navy: G.sight ? G.sight.navy : 0, hull: G.me.hull, stuck: !res && !G.over };
}
function blindSeas(spec) {      // spec = { plans: [[segs, Q], ...], levels, n, seed }
  const out = [];
  for (const P of spec.plans) { const row = { segs: P[0], Q: P[1], w: 0, n: 0, stuck: 0 };
    for (const N of spec.levels) for (let s = 0; s < spec.n; s++) { const r = blindSea(N, spec.seed + s * 13 + N, P[0], P[1]); if (!r.navy) continue; row.n++; row.w += r.ok ? 1 : 0; row.stuck += r.stuck ? 1 : 0; }
    out.push(row); }
  return out;
}
window.__B = { runLessons, runBoard, runSea, runAll, seaBot, boardBot, planBot, blindMove, blindBeat, blindRandom, blindGun, blindBeats, blindSea, blindSeas };
