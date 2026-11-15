// Robot players for Plunder's tests (games/plunder/test_play.py). They play through window.__sim, with a person's limits:
// they see a blow only after a reaction time, they fumble some blocks, and at sea they re-think the wheel only so often.
// Sea: 'plan' looks a couple of seconds ahead and keeps out of loaded fans; 'chase' is a beginner (steer at her, turn a side to her);
// 'straight', 'spam', 'circle', 'weave' are lazy. Boarding: 'good' reads, blocks, ripostes; the rest are lazy (idle, slices, stabs, scribble, block, dodge, pistol).
const S = window.__sim, DT = 1 / 60;
const L = Object.assign({}, S, { manGeo: () => S.geo(), YOU: S.you, fStroke: (G, a, b, c, d) => S.stroke(a, b, c, d), fPoke: (G, x, y) => S.poke(x, y), fDodge: () => S.dodge(), fAim: (G, x, y) => S.aim(x, y), fAimMove: (G, x, y) => S.aimMove(x, y), fFire: () => S.fire(), fReload: (G, on) => S.reload(on), aimAt: () => S.aimAt() });
function rnd32(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let RND = rnd32(1);
// a captain who looks ahead: tries each way of putting the wheel, keeps out of the fans of loaded guns, and keeps a ship in front of his own
function planBot(o = {}) {
  const react = o.react == null ? 0.25 : o.react, noise = o.noise || 0, H = o.horizon || 2.2;
  let think = 0, rud = 0;
  const inWedge = (sx, sy, sh, tx, ty, arc, range) => { const dx = tx - sx, dy = ty - sy, lx = dx * Math.cos(sh) - dy * Math.sin(sh), ly = dx * Math.sin(sh) + dy * Math.cos(sh), d = Math.hypot(dx, dy); if (d > range) return 0; return Math.abs(Math.atan2(ly, Math.abs(lx))) < arc ? (lx >= 0 ? 2 : 1) : 0; };
  return (G) => {
    const me = G.me, tg = G.foes.filter(s => s.alive && !s.gone && s.K.navy && !s.struck);
    if (G.phase === 'sight') { G.choice = 'raid'; return; }
    if (G.phase !== 'battle') { G.in.held = false; G.in.rud = 0; G.in.fire = false; return; }
    G.in.held = true; think -= DT;
    if (think <= 0 && tg.length) {
      think = react; let best = -1e9, pick = 0; const c = G.cfg;
      for (const cand of [-1, -0.5, 0, 0.5, 1]) {
        let x = me.x, y = me.y, h = me.hdg, v = me.v, score = 0; const st = 0.2;
        const fs = tg.map(s => ({ x: s.x, y: s.y, h: s.hdg, v: s.v, w: s.rud * s.K.turn * L.clamp(s.v / 30, 0.25, 1), s }));
        for (let tau = st; tau <= H + 1e-6; tau += st) {
          h += cand * me.K.turn * L.clamp(v / 30, 0.25, 1) * st; x += Math.sin(h) * v * st; y += Math.cos(h) * v * st;
          for (const f of fs) {
            f.h += f.w * st; f.x += Math.sin(f.h) * f.v * st; f.y += Math.cos(f.h) * f.v * st;
            const d = Math.hypot(f.x - x, f.y - y), wq = inWedge(f.x, f.y, f.h, x, y, L.SEA.ARC_E + 0.06, L.SEA.E_RANGE + 6);
            if (wq) { const side = wq - 1; if (tau >= f.s.load[side] - 0.2) score -= st * 3.2 * (c.eSide / 30); }
            const mq = inWedge(x, y, h, f.x, f.y, L.SEA.ARC - 0.04, L.SEA.RANGE - 6);
            if (mq) { const side = mq - 1; if (tau >= me.load[side]) { const rel = Math.abs(Math.cos(Math.atan2(f.x - x, f.y - y) - f.h)); score += st * (rel > 0.8 ? 2.0 : 1.0) / Math.max(1, tau); } }
            score -= st * Math.abs(d - 58) / 100 * 0.6 + st * Math.max(0, d - 105) / 40; if (d < 30) score -= st * 2;
          }
        }
        score += (RND() - 0.5) * noise - Math.abs(cand - rud) * 0.03;
        if (score > best) { best = score; pick = cand; }
      }
      rud = pick;
    }
    G.in.rud = rud; G.in.fire = (G.lit[0] || G.lit[1]) && !G.in.fire;
  };
}
function seaBot(kind, o = {}) {
  let think = 0, rud = 0, cross = 0;
  return (G) => {
    const me = G.me, tg = G.foes.filter(s => s.alive && !s.gone && s.K.navy && !s.struck);
    if (G.phase === 'sight') { G.choice = 'raid'; return; }
    if (G.phase !== 'battle') { G.in.held = false; G.in.rud = 0; G.in.fire = false; return; }
    G.in.held = true;
    if (kind === 'straight') { G.in.rud = 0; G.in.fire = false; return; }
    if (kind === 'spam') { G.in.rud = 0; G.in.fire = !G.in.fire; return; }
    if (kind === 'circle') { G.in.rud = 1; G.in.fire = !G.in.fire; return; }
    if (kind === 'weave') { G.in.rud = Math.sin(G.t * 1.6) > 0 ? 1 : -1; G.in.fire = !G.in.fire; return; }
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
    G.in.rud = rud; G.in.fire = (G.lit[0] || G.lit[1]) && !G.in.fire;
  };
}
function boardBot(kind, o = {}) {
  const react = o.react == null ? 0.3 : o.react, acc = o.acc == null ? 0.9 : o.acc;
  let seen = null, plan = null, nextIn = 0, alt = 0, burst = 0, rest = 0, aimT = -1, relT = 0;
  return (G) => {
    const F = G.fight, m = F.man, R = RND; if (!F || F.phase !== 'fight' || !m) { plan = null; seen = null; return; }
    const g = L.manGeo(F), C = L.YOU(), f = L.fu();
    nextIn -= DT; rest -= DT;
    const slice = () => { const a = R() * 6.28, r = 70 * f; L.fStroke(G, g.chest.x + Math.cos(a) * r, g.chest.y + Math.sin(a) * r * 0.5, g.chest.x - Math.cos(a) * r, g.chest.y - Math.sin(a) * r * 0.5); };
    const stab = () => L.fPoke(G, g.chest.x + (R() - 0.5) * 20, g.chest.y + (R() - 0.5) * 20);
    if (kind === 'idle') return;
    if (kind === 'slices') { if (nextIn <= 0) { slice(); nextIn = 0.11; } return; }
    if (kind === 'stabs') { if (nextIn <= 0) { stab(); nextIn = 0.1; } return; }
    if (kind === 'scribble') { if (nextIn <= 0) { L.fStroke(G, R() * 390, 150 + R() * 400, R() * 390, 150 + R() * 400); nextIn = 0.12; } return; }
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
        const ideal = G.cfg.parryWin * 0.3;      // aim for a late, clean block
        if (landIn <= Math.max(ideal, 0.06)) {
          plan.done = true;
          if (R() < acc) {
            if (atk.kind === 'cut') { const u = 0.22, px = atk.sx + (atk.ex - atk.sx) * u, py = atk.sy + (atk.ey - atk.sy) * u, nx = -(atk.ey - atk.sy), ny = atk.ex - atk.sx, n = Math.hypot(nx, ny), q = 55 * f / n; L.fStroke(G, px - nx * q, py - ny * q, px + nx * q, py + ny * q); }
            else L.fStroke(G, atk.px - 50 * f, atk.py - 30 * f, atk.px + 50 * f, atk.py + 30 * f);
          } else L.fStroke(G, C.x - 60, C.y + 60, C.x + 60, C.y + 90);      // fumbled it
        }
      }
      return;
    }
    if (kind === 'block') return;
    if (atk) { if (atk.kind === 'shot' && landIn > 0.6 && nextIn <= 0 && F.pBusy <= 0) { slice(); nextIn = 0.4; } return; }
    // his guard is open or he is off balance: attack, a couple at a time
    if (nextIn > 0 || F.pBusy > 0 || F.pStun > 0 || m.z < 0.9) return;
    if (m.os === 'stagger') {
      if (o.gun && F.loaded && (m.capt || m.type === 'officer') && m.stag - m.ot > 0.55 && !F.aim) { L.fAim(G, 330, 760); aimT = F.t; return; }
      stab(); nextIn = 0.34; return;
    }
    if (F.aim) { if (F.t - aimT > 0.5) { const p = L.aimAt(F); L.fAimMove(G, F.aim.ox + F.aim.dx / 1.3 + (g.chest.x - p.x) / 1.3, F.aim.oy + F.aim.dy / 1.3 + (g.chest.y - p.y) / 1.3); L.fFire(G); } return; }
    if (rest > 0) return;
    if (m.os === 'guard' || m.os === 'hurt' || m.os === 'recover') {
      if (m.os === 'guard' && m.next < 0.25 && G.cfg.e < 0.5) return;       // he is about to come: keep the blade free
      if (alt++ % 2) stab(); else slice(); nextIn = 0.4; burst++;
      if (burst >= 2) { burst = 0; rest = 0.75; }
    }
  };
}
function runBoard(N, bot, seed, o) {
  RND = rnd32(seed * 31 + 7); S.start(N, { seed }); S.board(); const G = S.G, b = boardBot(bot, o); let n = 0;
  while (!G.over && n++ < 60 * 400) { b(G); S.step(DT); }
  return { won: G.over === 'won', t: G.t, stage: G.fight.stage, wounds: G.took.wounds, drop: G.fight.dropped, shots: G.shots, navy: G.fight.navy };
}
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
window.__B = { runBoard, runSea, runAll, seaBot, boardBot, planBot };
