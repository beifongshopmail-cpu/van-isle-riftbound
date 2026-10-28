// THE TIER LIST'S MATHS (M17, 2026-10-28). One file the fetcher, the Tier list page and the tests
// share. Pure: it reads nothing and stores nothing. Legends only: it never sees a player's name.
//
// THE QUESTION: across recent events, which legends turn up most, and which reach the top cut more
// often than their numbers alone would explain?
//
// THE COUNTING (how RiftDecks, Inkdecks and Riot's own 'Top Decks' posts count, checked 2026-10-26):
//   field share    a legend's entries / every entry with a known legend
//   top-cut share  a legend's top-cut finishes / every top-cut finish with a known legend
//   conversion     top-cut share / field share; 1.00x is average
// An event's top cut is the cut it played (k, from TopDeck's topCut) when it had one; an event that
// stopped after Swiss counts RAVI's usual cut for its size (cut/cut.js: a top 8 from 17 players, a
// top 4 below), so no second copy of that table exists.
//
// SMALL SAMPLES: conversion is pulled toward average as if every legend had SHRINK more entries
// that converted at the average rate, so three lucky decks cannot read as the best legend.
//   conversion = (tops + SHRINK * p) / ((entries + SHRINK) * p), p = all tops / all entries
//
// TIERS (RiftDecks' cutoffs, on the shrunk conversion):
//   S  field share 10% or more and 1.20x or better
//   A  6% and 1.05x      B  4% and 0.90x      C  1% and 0.70x      R (Rogue) everything else
(function (root) {
  "use strict";

  var SHRINK = 20;
  var TIERS = [
    { t: "S", fs: 0.10, cv: 1.20 },
    { t: "A", fs: 0.06, cv: 1.05 },
    { t: "B", fs: 0.04, cv: 0.90 },
    { t: "C", fs: 0.01, cv: 0.70 }
  ];
  var ORDER = { S: 0, A: 1, B: 2, C: 3, R: 4 };

  function cutFor(n) {
    return n >= 17 ? 8 : (n >= 5 ? 4 : 0);
  }
  // Use the Top cut page's own table when it is loaded (page) or can be required (Node).
  try {
    if (root && root.RAVI_CUT && root.RAVI_CUT.cutFor) { cutFor = root.RAVI_CUT.cutFor; }
    else if (typeof require === "function") { cutFor = require("../cut/cut.js").cutFor; }
  } catch (e) { /* the local copy above stays */ }

  function whole(v, lo, hi) {
    return typeof v === "number" && isFinite(v) && Math.floor(v) === v && v >= lo && v <= hi;
  }

  function tierOf(fs, cv) {
    for (var i = 0; i < TIERS.length; i++) {
      if (fs >= TIERS[i].fs && cv >= TIERS[i].cv) { return TIERS[i].t; }
    }
    return "R";
  }

  function round(x, d) {
    var m = Math.pow(10, d);
    return Math.round(x * m) / m;
  }

  // events: [ { n: players, k: the cut played (optional), s: [ { r: placing, l: legend name } ] } ]. Anything malformed is
  // skipped, not guessed: an event needs a whole player count of 2 to 4096, a placing a whole
  // number from 1 to n, a legend a non-empty string. An event whose cut is 0 adds entries but no
  // tops.
  function compute(events) {
    var by = {}, F = 0, T = 0, E = 0, i, j;
    events = Array.isArray(events) ? events : [];
    for (i = 0; i < events.length; i++) {
      var ev = events[i];
      if (!ev || !whole(ev.n, 2, 4096) || !Array.isArray(ev.s)) { continue; }
      var k = whole(ev.k, 1, 64) && ev.k < ev.n ? ev.k : cutFor(ev.n), used = 0;
      for (j = 0; j < ev.s.length; j++) {
        var s = ev.s[j];
        if (!s || !whole(s.r, 1, ev.n) || typeof s.l !== "string" || !s.l) { continue; }
        var b = by[s.l] || (by[s.l] = { l: s.l, f: 0, t: 0 });
        b.f++; F++; used++;
        if (k && s.r <= k) { b.t++; T++; }
      }
      if (used) { E++; }
    }
    var p = F ? T / F : 0, out = [];
    Object.keys(by).forEach(function (key) {
      var b = by[key];
      var fs = F ? b.f / F : 0;
      var ts = T ? b.t / T : 0;
      var cv = p ? (b.t + SHRINK * p) / ((b.f + SHRINK) * p) : 1;
      out.push({ l: b.l, f: b.f, t: b.t, fs: round(fs, 4), ts: round(ts, 4), cv: round(cv, 2), tier: tierOf(fs, cv) });
    });
    out.sort(function (a, b) {
      return ORDER[a.tier] - ORDER[b.tier] || b.cv - a.cv || b.f - a.f || (a.l < b.l ? -1 : a.l > b.l ? 1 : 0);
    });
    return { events: E, entries: F, tops: T, legends: out };
  }

  var API = { SHRINK: SHRINK, TIERS: TIERS, cutFor: function (n) { return cutFor(n); }, tierOf: tierOf, compute: compute };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; }
  else { root.RAVI_TIER = API; }
})(this);
