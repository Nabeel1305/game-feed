/* Game Feed plug. tools/build_feed.py puts this at the top of every game's page in the feed app.
   It lets the feed start, freeze and unfreeze any game without the game knowing:
     - "pause" stops the game's clock: animation frames, timers, performance.now() and sound all stand still
     - "resume" lets them run again from the same instant
     - "start" presses the game's own Play button (or calls window.gameFeedStart(mode) if the game has one)
     - "sound" is the app's one sound switch: off silences everything the game plays, whatever its own sound button says
     - "levels" opens the game's own level list (window.gameFeedLevels()) from the feed's Paused card
   Outside the feed (the page opened on its own) it does nothing at all.
   A game may also use: window.GameFeed.finish({win, level, score}) to tell the feed a level ended,
   and may define window.gameFeedPause() / window.gameFeedResume() for anything extra it wants to do. */
(function () {
  'use strict';
  if (window.parent === window || window.GameFeed) return;
  var cfg = /*CFG*/{};
  var perf = window.performance, realNow = perf.now.bind(perf);
  var paused = false, pausedAt = 0, shift = 0;

  function post(ev, extra) {
    var m = { gf: 1, id: cfg.id, ev: ev };
    if (extra) for (var k in extra) m[k] = extra[k];
    try { window.parent.postMessage(m, '*'); } catch (e) {}
  }

  /* ---- the game's clock ---- */
  try { perf.now = function () { return (paused ? pausedAt : realNow()) - shift; }; } catch (e) {}

  /* ---- animation frames ---- */
  var rRAF = window.requestAnimationFrame.bind(window), rCAF = window.cancelAnimationFrame.bind(window);
  var frames = {}, frameId = 0;
  function armFrame(f) { f.n = rRAF(function (t) { if (frames[f.id] !== f) return; delete frames[f.id]; f.cb(t - shift); }); }
  window.requestAnimationFrame = function (cb) {
    var f = { id: ++frameId, cb: cb, n: 0 };
    frames[f.id] = f;
    if (!paused) armFrame(f);
    return f.id;
  };
  window.cancelAnimationFrame = function (id) {
    var f = frames[id];
    if (f) { if (f.n) rCAF(f.n); delete frames[id]; }
  };

  /* ---- timers ---- */
  var rST = window.setTimeout.bind(window), rCT = window.clearTimeout.bind(window);
  var rSI = window.setInterval.bind(window), rCI = window.clearInterval.bind(window);
  var timers = {}, timerId = 1e6;
  function armTimer(t) {
    t.due = realNow() + t.left;
    t.n = rST(function () {
      if (timers[t.id] !== t) return;
      if (t.every == null) delete timers[t.id];
      else { t.left = t.every; armTimer(t); }
      t.fn.apply(window, t.args);
    }, t.left);
  }
  function addTimer(fn, ms, args, every) {
    var t = { id: ++timerId, fn: fn, args: args, left: Math.max(0, +ms || 0), every: every, n: 0, due: 0 };
    timers[t.id] = t;
    if (!paused) armTimer(t);
    return t.id;
  }
  window.setTimeout = function (fn, ms) {
    if (typeof fn !== 'function') return rST.apply(null, arguments);
    return addTimer(fn, ms, Array.prototype.slice.call(arguments, 2), null);
  };
  window.setInterval = function (fn, ms) {
    if (typeof fn !== 'function') return rSI.apply(null, arguments);
    return addTimer(fn, ms, Array.prototype.slice.call(arguments, 2), Math.max(4, +ms || 0));
  };
  window.clearTimeout = window.clearInterval = function (id) {
    var t = timers[id];
    if (t) { if (t.n) rCT(t.n); delete timers[id]; }
    else { rCT(id); rCI(id); }
  };

  /* ---- sound ----
     Every sound context the game makes gets a volume knob of ours between the game and the speaker: the game's
     "destination" is that knob. The feed's sound switch turns the knob to 0 or 1, so it works on any game. */
  var ctxs = [], soundOn = true, media = [];
  var realDest = null;
  try {
    var owner = window.BaseAudioContext || window.AudioContext || window.webkitAudioContext;
    var desc = owner && Object.getOwnPropertyDescriptor(owner.prototype, 'destination');
    realDest = desc && desc.get;
  } catch (e) {}
  function addKnob(c) {
    try {
      var out = realDest ? realDest.call(c) : c.destination;
      var knob = c.createGain();
      knob.gain.value = soundOn ? 1 : 0;
      knob.connect(out);
      Object.defineProperty(c, 'destination', { configurable: true, get: function () { return knob; } });
      c.__gfKnob = knob;
    } catch (e) {}
  }
  function setSound(on) {
    soundOn = !!on;
    var v = soundOn ? 1 : 0;
    ctxs.forEach(function (c) {
      var k = c.__gfKnob;
      if (!k) return;
      try {
        k.gain.cancelScheduledValues(0);
        if (c.state === 'running') k.gain.setTargetAtTime(v, c.currentTime, 0.012);   // a quick fade, no click
        else k.gain.value = v;
      } catch (e) { try { k.gain.value = v; } catch (e2) {} }
    });
    var els = Array.prototype.slice.call(document.querySelectorAll('audio,video')).concat(media);
    els.forEach(function (el) {
      try {
        if (!soundOn) { if (!el.muted) { el.muted = true; el.__gfMuted = true; } }
        else if (el.__gfMuted) { el.muted = false; el.__gfMuted = false; }
      } catch (e) {}
    });
    try { if (typeof window.gameFeedSound === 'function') window.gameFeedSound(soundOn); } catch (e) {}
  }
  try {                                       // sound files and video, for games that use them
    var realPlay = window.HTMLMediaElement && HTMLMediaElement.prototype.play;
    if (realPlay) HTMLMediaElement.prototype.play = function () {
      if (media.indexOf(this) < 0) media.push(this);
      if (!soundOn && !this.muted) { this.muted = true; this.__gfMuted = true; }
      return realPlay.apply(this, arguments);
    };
  } catch (e) {}
  ['AudioContext', 'webkitAudioContext'].forEach(function (k) {
    var C = window[k];
    if (!C) return;
    var W = function (opts) {
      var c = opts === undefined ? new C() : new C(opts);
      ctxs.push(c);
      addKnob(c);
      if (paused) { c.__gfHeld = true; try { c.suspend(); } catch (e) {} }
      return c;
    };
    W.prototype = C.prototype;
    try { Object.setPrototypeOf(W, C); } catch (e) {}
    window[k] = W;
  });

  /* ---- freeze and unfreeze ---- */
  var css = document.createElement('style');
  css.textContent = 'html.gf-paused *,html.gf-paused *::before,html.gf-paused *::after{animation-play-state:paused!important}';
  function pause() {
    if (paused) return;
    try { if (typeof window.gameFeedPause === 'function') window.gameFeedPause(); } catch (e) {}
    pausedAt = realNow();
    paused = true;
    var k;
    for (k in frames) if (frames[k].n) { rCAF(frames[k].n); frames[k].n = 0; }
    for (k in timers) { var t = timers[k]; if (t.n) { rCT(t.n); t.n = 0; t.left = Math.max(0, t.due - pausedAt); } }
    ctxs.forEach(function (c) {
      c.__gfHeld = c.state === 'running';
      if (c.__gfHeld) try { c.suspend(); } catch (e) {}
    });
    document.documentElement.classList.add('gf-paused');
  }
  function resume() {
    if (!paused) return;
    shift += realNow() - pausedAt;
    paused = false;
    var k;
    for (k in frames) if (!frames[k].n) armFrame(frames[k]);
    for (k in timers) if (!timers[k].n) armTimer(timers[k]);
    ctxs.forEach(function (c) {
      if (c.__gfHeld) { c.__gfHeld = false; try { c.resume(); } catch (e) {} }
    });
    document.documentElement.classList.remove('gf-paused');
    try { if (typeof window.gameFeedResume === 'function') window.gameFeedResume(); } catch (e) {}
  }

  /* ---- start: press the game's own Play button(s) ---- */
  function visible(el) { return !!el && el.getClientRects().length > 0; }
  function start(mode, sound) {
    if (sound !== undefined) setSound(sound);
    resume();
    window.GameFeed.mode = mode || 'full';
    try { window.focus(); } catch (e) {}
    if (typeof window.gameFeedStart === 'function') {
      try { window.gameFeedStart(window.GameFeed.mode); post('started'); return; } catch (e) {}
    }
    var steps = (cfg.start || ['#playBtn']).slice(), tries = 0;
    (function next() {
      if (!steps.length) { post('started'); return; }
      var el = document.querySelector(steps[0]);
      if (visible(el)) { steps.shift(); tries = 0; try { el.click(); } catch (e) {} rST(next, 40); }
      else if (++tries > 30) post('started', { partial: true });
      else rST(next, 50);
    })();
  }

  window.GameFeed = {
    inFeed: true, id: cfg.id, mode: 'full',
    isPaused: function () { return paused; },
    soundOn: function () { return soundOn; },
    contexts: function () { return ctxs.slice(); },
    finish: function (result) { post('finish', { result: result || {} }); },
    debug: function () {
      return { paused: paused, frames: Object.keys(frames).length, timers: Object.keys(timers).length, sound: ctxs.map(function (c) { return c.state; }),
        soundOn: soundOn, knobs: ctxs.map(function (c) { return c.__gfKnob ? c.__gfKnob.gain.value : null; }),
        wired: ctxs.every(function (c) { return !!c.__gfKnob && c.destination === c.__gfKnob; }) };
    }
  };

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (e.source !== window.parent || !d || d.gf !== 1) return;
    if (d.cmd === 'pause') pause();
    else if (d.cmd === 'resume') resume();
    else if (d.cmd === 'start') start(d.mode, d.sound);
    else if (d.cmd === 'sound') setSound(d.on);
    else if (d.cmd === 'levels') {            // "Levels" on the feed's Paused card: the game shows its own level list, then its clock runs again
      try { if (typeof window.gameFeedLevels === 'function') window.gameFeedLevels(); } catch (e) {}
      resume();
    }
    else if (d.cmd === 'ping') post('ready');
  });
  /* inside the feed, the feed decides when a game stops: the game's own "page hidden" pause would only stack a second pause on top */
  document.addEventListener('visibilitychange', function (e) { e.stopImmediatePropagation(); }, true);
  window.addEventListener('error', function (e) { post('error', { msg: String((e && e.message) || e).slice(0, 300) }); });
  window.addEventListener('pagehide', function () {
    ctxs.forEach(function (c) { try { c.close(); } catch (e) {} });
  });
  function ready() { (document.head || document.documentElement).appendChild(css); rST(function () { post('ready'); }, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
