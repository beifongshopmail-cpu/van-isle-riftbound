// board/demand.js -- how sought-after a card is, for the Trade board's order
// (plan 2 M2 block 1b, Mako 2026-11-01: "organize by demand rather than sheer
// value"). Adapted from BHH's binder curator (bhh-binder binder.js, Mako's own
// script: value 0.60, treatment 0.25, upside movement 0.15), reweighted to add
// RAVI's own signal: how many players on the board want the card.
//
// Each part is scaled 0 to 1 across the cards being ordered, then weighted:
//   value      log10(market price in CAD + 1)                       W.value
//   wanted     players on the board with it on a shared Wishlist     W.wanted
//   treatment  Showcase 2, Alternate Art 2, Signature 2.5,           W.treat
//              Overnumbered 1.5 (from the rarity and the card name)
//   movement   the rise in market price over 7 days, up only,        W.move
//              capped at +100%, and none under MOVE_MIN CAD
// A card RAVI has no price for scores on what it has. Pure functions: the
// page and rb-tools both call them.
(function (root) {
  "use strict";
  var W = { value: 0.45, wanted: 0.25, treat: 0.15, move: 0.15 };
  var MOVE_MIN = 3, MOVE_CAP = 1;
  function treat(c) {
    if (!c) { return 0; }
    var n = String(c.n || ""), t = 0;
    if (c.r === "Showcase") { t += 2; }
    if (/\(Alternate Art\)/i.test(n)) { t += 2; }
    if (/Signature/i.test(n)) { t += 2.5; }
    if (/Overnumbered/i.test(n)) { t += 1.5; }
    return t;
  }
  function price(c, f) { var v = c && c.p && c.p[f]; return typeof v === "number" && isFinite(v) && v > 0 ? v : null; }
  function move(c, f, fx) {
    var now = price(c, f), then = c && c.a && c.a["7"] && c.a["7"][f];
    if (now == null || !(typeof then === "number" && then > 0) || now * fx < MOVE_MIN) { return 0; }
    return Math.max(0, Math.min(MOVE_CAP, (now - then) / then));
  }
  function scale(xs) {
    var lo = Infinity, hi = -Infinity;
    xs.forEach(function (x) { if (x < lo) { lo = x; } if (x > hi) { hi = x; } });
    return function (x) { return hi > lo ? (x - lo) / (hi - lo) : (hi > 0 ? 1 : 0); };
  }
  // items: [{ i, f }]; card(i) the price feed's card; wanted(i, f) players wanting it; fx USD to CAD.
  // Returns a Map from "i|f" to a score from 0 to 1.
  function scores(items, card, wanted, fx) {
    fx = fx > 0 ? fx : 1;
    var parts = items.map(function (x) {
      var c = card(x.i), p = price(c, x.f);
      return { k: x.i + "|" + x.f, v: p == null ? 0 : Math.log10(p * fx + 1), w: +wanted(x.i, x.f) || 0, t: treat(c), m: move(c, x.f, fx) };
    });
    var sv = scale(parts.map(function (p) { return p.v; })), sw = scale(parts.map(function (p) { return p.w; })),
      st = scale(parts.map(function (p) { return p.t; })), sm = scale(parts.map(function (p) { return p.m; }));
    var out = new Map();
    parts.forEach(function (p) { out.set(p.k, W.value * sv(p.v) + W.wanted * sw(p.w) + W.treat * st(p.t) + W.move * sm(p.m)); });
    return out;
  }
  var api = { W: W, treat: treat, move: move, scores: scores };
  if (typeof module === "object" && module.exports) { module.exports = api; } else { root.RAVI_DEMAND = api; }
})(this);
