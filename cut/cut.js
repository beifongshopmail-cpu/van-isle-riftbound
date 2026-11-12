// THE TOP-CUT CALCULATOR'S LOGIC (M15, 2026-10-27). One file the Top cut page and the tests share.
// Pure: it reads nothing and stores nothing.
//
// THE QUESTION: in a Swiss event of n players, r rounds and a top cut of k, with my record so far,
// which finishes put me in the cut? For every way my remaining rounds can go, it gives two answers:
//   likely  every other match is played out, and the player with more points wins it;
//   worst   the same, except that in the last two rounds every other table's result (a win either
//           way, or a draw) falls the way that puts the most players level with me or ahead.
// Ties go against me in both: a player level with me on points may beat me on tiebreakers, so a
// tie is 'on tiebreakers', never 'in'.
//
// THE SCORING (Riftbound's Tournament Rules as ruled on Rift Judge, FAQ 7975): a win is 3 match
// points, a draw 1, a loss 0; intentional draws are allowed. A bye counts as a win.
// THE PAIRING model: each round the players are ranked by points and paired top down, so players
// meet others on their own points where they can and the odd one out of a points group meets the
// top of the next. With an odd number of players the lowest other player gets the bye. My own
// results follow the order given: wins, then draws, then losses, for the rounds played and again
// for the rounds to come (draws late, as intentional draws are). It is a model, not the store's
// pairings: real pairings avoid rematches and vary, so its answers are guidance.
//
// THE USUAL NUMBERS (riftbound.zone's guide for organisers, 2026-06): 4 to 8 players 3 rounds,
// 9 to 16 4, 17 to 32 5, 33 to 64 6 (one more round each time the field doubles); a top 4 to 16
// players, a top 8 from 17. Stores set their own; every field can be changed.
(function (root) {
  "use strict";

  var PTS = { W: 3, D: 1, L: 0 };
  var CUTS = [0, 2, 4, 8, 16, 32, 64];
  var MAXN = 512, MAXR = 15;

  function int(v, lo, hi, dflt) {
    var x = typeof v === "number" ? v : (typeof v === "string" && /^\s*\d+\s*$/.test(v) ? +v : NaN);
    if (!isFinite(x)) { return dflt; }
    x = Math.floor(x);
    return x < lo ? lo : (x > hi ? hi : x);
  }

  // the usual number of Swiss rounds for n players
  function roundsFor(n) {
    n = int(n, 2, MAXN, 2);
    var r = Math.ceil(Math.log(n) / Math.LN2);
    return n >= 4 ? Math.max(3, r) : r;
  }
  // the usual top cut for n players (0: none)
  function cutFor(n) {
    n = int(n, 2, MAXN, 2);
    return n >= 17 ? 8 : (n >= 5 ? 4 : 0);
  }

  // A clean input from anything: whole numbers in range, a cut from the list, the record no
  // longer than the event.
  function clean(o) {
    o = o && typeof o === "object" ? o : {};
    var n = int(o.n, 2, MAXN, 8);
    var r = int(o.r, 1, MAXR, roundsFor(n));
    var k = int(o.k, 0, 64, cutFor(n));
    if (CUTS.indexOf(k) === -1) { k = cutFor(n); }
    var w = int(o.w, 0, r, 0), l = int(o.l, 0, r, 0), d = int(o.d, 0, r, 0);
    if (w + l + d > r) { w = Math.min(w, r); l = Math.min(l, r - w); d = Math.min(d, r - w - l); }
    return { n: n, r: r, k: k, w: w, l: l, d: d };
  }

  // my results, round by round
  function path(w, d, l, w2, d2, l2) {
    var p = [], i;
    for (i = 0; i < w; i++) { p.push("W"); }
    for (i = 0; i < d; i++) { p.push("D"); }
    for (i = 0; i < l; i++) { p.push("L"); }
    for (i = 0; i < w2; i++) { p.push("W"); }
    for (i = 0; i < d2; i++) { p.push("D"); }
    for (i = 0; i < l2; i++) { p.push("L"); }
    return p;
  }

  // One round's pairings: [ [a, b], ... ] and the bye (or -1). Player 0 is me: first in my points
  // group, and never the bye.
  function pairings(pts) {
    var n = pts.length, order = [], i;
    for (i = 1; i < n; i++) { order.push(i); }
    order.sort(function (a, b) { return pts[b] - pts[a] || a - b; });
    var at = 0;
    while (at < order.length && pts[order[at]] > pts[0]) { at++; }
    order.splice(at, 0, 0);
    var bye = -1;
    if (order.length % 2) { bye = order.pop(); }
    var pairs = [];
    for (i = 0; i + 1 < order.length; i += 2) { pairs.push([order[i], order[i + 1]]); }
    return { pairs: pairs, bye: bye };
  }

  // apply one result: "W" the first of the pair wins, "L" the second wins, "D" a draw
  function apply(pts, a, b, res) {
    if (res === "W") { pts[a] += 3; }
    else if (res === "L") { pts[b] += 3; }
    else { pts[a] += 1; pts[b] += 1; }
  }

  function playMine(pts, pr, mine) {
    var i, p;
    for (i = 0; i < pr.pairs.length; i++) {
      p = pr.pairs[i];
      if (p[0] === 0) { apply(pts, 0, p[1], mine); return i; }
      if (p[1] === 0) { apply(pts, p[0], 0, mine === "W" ? "L" : (mine === "L" ? "W" : "D")); return i; }
    }
    return -1;
  }

  function count(pts, t) {
    var above = 0, tied = 0, i;
    for (i = 1; i < pts.length; i++) { if (pts[i] > t) { above++; } else if (pts[i] === t) { tied++; } }
    return { above: above, tied: tied };
  }

  // the final round, worst for me: each other table independently takes the result that puts
  // the most of its two players at or above t
  function lastWorst(pts, pr, mine, t) {
    var mi = playMine(pts, pr, mine), i, a, b, best, s, opt, j;
    if (pr.bye >= 0) { pts[pr.bye] += 3; }
    for (i = 0; i < pr.pairs.length; i++) {
      if (i === mi) { continue; }
      a = pr.pairs[i][0]; b = pr.pairs[i][1];
      best = "W"; s = -1;
      opt = ["W", "L", "D"];
      for (j = 0; j < 3; j++) {
        var pa = pts[a] + (opt[j] === "W" ? 3 : opt[j] === "D" ? 1 : 0);
        var pb = pts[b] + (opt[j] === "L" ? 3 : opt[j] === "D" ? 1 : 0);
        var c = (pa >= t ? 1 : 0) + (pb >= t ? 1 : 0);
        if (c > s) { s = c; best = opt[j]; }
      }
      apply(pts, a, b, best);
    }
  }

  // the round before the last, worst for me: tables are grouped by the points of their two
  // players; each group takes one of a few ways (all won by the higher player, all lost by it,
  // all drawn, or half drawn), and every mix of those ways is tried against the last round.
  // Groups that cannot matter to t are fixed first, so the mixes stay few.
  var MAXMIX = 6000;
  function penultimateWorst(pts, pr, mine, lastMine, t) {
    var mi = playMine(pts, pr, mine), groups = {}, keys = [], i, a, b, key;
    if (pr.bye >= 0) { pts[pr.bye] += 3; }
    for (i = 0; i < pr.pairs.length; i++) {
      if (i === mi) { continue; }
      a = pr.pairs[i][0]; b = pr.pairs[i][1];
      key = pts[a] + ":" + pts[b];
      if (!groups[key]) { groups[key] = { pairs: [], hi: pts[a], lo: pts[b] }; keys.push(key); }
      groups[key].pairs.push([a, b]);
    }
    var ways = [], mixes = 1;
    for (i = 0; i < keys.length; i++) {
      var g = groups[keys[i]], w;
      if (g.hi + 6 < t) { w = ["W"]; }                  // neither can reach t: no matter
      else if (g.lo >= t) { w = ["D"]; }                // both already there: no matter
      else {
        w = g.hi === g.lo ? ["W", "D"] : ["W", "L", "D"];
        if (g.pairs.length > 1) { w.push("H"); }        // half drawn, half won by the higher
      }
      ways.push(w);
      mixes *= w.length;
    }
    // too many mixes: fall back to the groups closest to t only
    if (mixes > MAXMIX) {
      for (i = 0; i < keys.length && mixes > MAXMIX; i++) {
        var gg = groups[keys[i]];
        if (Math.abs(gg.hi - t) > 3 && Math.abs(gg.lo - t) > 3 && ways[i].length > 1) { mixes /= ways[i].length; ways[i] = ["W"]; }
      }
    }
    var best = null, bestN = -1, pick = [];
    function run(gi) {
      if (gi === keys.length) {
        var q = pts.slice(), x, y;
        for (x = 0; x < keys.length; x++) {
          var gp = groups[keys[x]].pairs;
          for (y = 0; y < gp.length; y++) {
            var how = pick[x];
            if (how === "H") { how = y < gp.length / 2 ? "D" : "W"; }
            apply(q, gp[y][0], gp[y][1], how);
          }
        }
        lastWorst(q, pairings(q), lastMine, t);
        var c = count(q, t), m = c.above + c.tied;
        if (m > bestN || (m === bestN && c.above > best.above)) { bestN = m; best = { pts: q, above: c.above }; }
        return;
      }
      for (var o = 0; o < ways[gi].length; o++) { pick[gi] = ways[gi][o]; run(gi + 1); }
    }
    run(0);
    return best.pts;
  }

  // the whole event for one finish of mine; returns the other players' final points
  function simulate(n, r, mine, worst) {
    var pts = [], i, t = 0;
    for (i = 0; i < n; i++) { pts.push(0); }
    for (i = 0; i < mine.length; i++) { t += PTS[mine[i]]; }
    for (var rd = 0; rd < r; rd++) {
      var pr = pairings(pts);
      if (worst && r >= 2 && rd === r - 2) { return penultimateWorst(pts, pr, mine[rd], mine[rd + 1], t); }
      if (worst && rd === r - 1) { lastWorst(pts, pr, mine[rd], t); return pts; }
      var mi = playMine(pts, pr, mine[rd]);
      if (pr.bye >= 0) { pts[pr.bye] += 3; }
      for (i = 0; i < pr.pairs.length; i++) { if (i !== mi) { apply(pts, pr.pairs[i][0], pr.pairs[i][1], "W"); } }
    }
    return pts;
  }

  function verdict(c, k) {
    if (!k) { return null; }
    if (c.above + c.tied < k) { return "in"; }
    if (c.above < k) { return "ties"; }
    return "out";
  }

  // Every finish still open to me, best first: { w, d, l } to come, the final record and points,
  // and for each case { above, tied, verdict } ('in', 'ties' (on tiebreakers), 'out', or null with
  // no cut). A cut as big as the field puts everyone in.
  function scenarios(o) {
    var c = clean(o), left = c.r - c.w - c.l - c.d, out = [], a, b;
    for (a = left; a >= 0; a--) {
      for (b = left - a; b >= 0; b--) {
        var l2 = left - a - b, mine = path(c.w, c.d, c.l, a, b, l2);
        var fw = c.w + a, fd = c.d + b, fl = c.l + l2, t = fw * 3 + fd;
        var row = { w: a, d: b, l: l2, final: { w: fw, l: fl, d: fd }, pts: t };
        if (c.k >= c.n) {
          row.likely = { above: 0, tied: 0, verdict: "in" };
          row.worst = { above: 0, tied: 0, verdict: "in" };
        } else {
          var lk = count(simulate(c.n, c.r, mine, false), t), wk = count(simulate(c.n, c.r, mine, true), t);
          // the worst case is never kinder than the likely one: by its verdict first, then by the
          // players level with me or ahead
          var lv = verdict(lk, c.k), wv = verdict(wk, c.k), HARM = { "in": 0, ties: 1, out: 2 };
          if (HARM[wv] < HARM[lv] || (wv === lv && wk.above + wk.tied < lk.above + lk.tied)) { wk = lk; wv = lv; }
          row.likely = { above: lk.above, tied: lk.tied, verdict: lv };
          row.worst = { above: wk.above, tied: wk.tied, verdict: wv };
        }
        out.push(row);
      }
    }
    out.sort(function (x, y) { return y.pts - x.pts || x.l - y.l; });
    return { input: c, left: left, rows: out };
  }

  // A CHANCE PER FINISH (plan 2 M9 block 8, 2026-11-12; Cards Realm's calculator gives a percent
  // per record, Limitless's takes a tie rate). The event is played out many times: each round the
  // players are paired top down by points, in a fresh random order inside each points group; every
  // other match is a coin flip, except that a share of them (tie, one in ten: about what best of 3
  // draws on time) is drawn; my own rounds follow the finish. A finish's chance is the share of
  // those events in which it makes the cut; level on points at the cut's edge, the places left go
  // by luck among the players level. The draw is seeded from the input, so the same numbers give
  // the same chances. Small fields are played once per finish, from the rounds already played;
  // large ones (where one player's results barely move the rest) are played once for all finishes.
  var BUDGET = 3000000, TIE = 0.1;
  function rng(seed) {                                   // mulberry32
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // one round on pts (a typed array, player 0 me). mine: "W", "D", "L", or null when player 0 is
  // one more of the field. ws: { order, cnt, tmp } scratch arrays.
  function simRound(pts, n, mine, tie, rand, ws) {
    var order = ws.order, tmp = ws.tmp, cnt = ws.cnt, i, j, x, m = 0, first = mine === null ? 0 : 1;
    // the others in a random order, then by points, most first (a counting sort keeps the order inside a group)
    var len = 0;
    for (i = first; i < n; i++) { tmp[len++] = i; }
    for (i = len - 1; i > 0; i--) { j = Math.floor(rand() * (i + 1)); x = tmp[i]; tmp[i] = tmp[j]; tmp[j] = x; }
    for (i = 0; i < n; i++) { if (pts[i] > m) { m = pts[i]; } }
    for (i = 0; i <= m + 1; i++) { cnt[i] = 0; }
    for (i = 0; i < len; i++) { cnt[m - pts[tmp[i]] + 1]++; }
    for (i = 1; i <= m + 1; i++) { cnt[i] += cnt[i - 1]; }
    // me first in my points group, as pairings() does: leave my place free
    var my = -1;
    if (first) { my = cnt[m - pts[0]]; }
    for (i = 0; i < len; i++) { j = cnt[m - pts[tmp[i]]]++; order[my >= 0 && j >= my ? j + 1 : j] = tmp[i]; }
    if (first) { order[my] = 0; }
    var all = len + first;
    if (all % 2) {
      // the lowest other player gets the bye
      if (order[all - 1] === 0 && all > 1) { order[all - 1] = order[all - 2]; order[all - 2] = 0; }
      pts[order[all - 1]] += 3; all--;
    }
    for (i = 0; i + 1 < all; i += 2) {
      var a = order[i], b = order[i + 1], res;
      if (first && (a === 0 || b === 0)) {
        res = a === 0 ? mine : (mine === "W" ? "L" : (mine === "L" ? "W" : "D"));
      } else {
        x = rand();
        res = x < tie ? "D" : (x < tie + (1 - tie) / 2 ? "W" : "L");
      }
      if (res === "W") { pts[a] += 3; } else if (res === "L") { pts[b] += 3; } else { pts[a] += 1; pts[b] += 1; }
    }
  }
  function share(above, tied, k) {
    if (above >= k) { return 0; }
    if (above + tied < k) { return 1; }
    return (k - above) / (tied + 1);
  }
  // The chance of making the cut for every finish of scenarios(o), in its order: 0 to 1, or null
  // with no cut. opt.tie: the share of other matches drawn (default one in ten). opt.s: scenarios(o)
  // already worked out. A finish that is In in the worst case is certain.
  function chances(o, opt) {
    opt = opt && typeof opt === "object" ? opt : {};
    var s = opt.s && opt.s.rows && opt.s.input ? opt.s : scenarios(o), c = s.input, rows = s.rows, out = [], i, j;
    var tie = typeof opt.tie === "number" && opt.tie >= 0 && opt.tie <= 0.9 ? opt.tie : TIE;
    if (!c.k) { for (i = 0; i < rows.length; i++) { out.push(null); } return out; }
    if (c.k >= c.n) { for (i = 0; i < rows.length; i++) { out.push(1); } return out; }
    var n = c.n, r = c.r, k = c.k, played = c.w + c.l + c.d, left = s.left;
    var rand = rng(2654435761 ^ (n * 73856093) ^ (r * 19349663) ^ (k * 83492791) ^ (c.w * 2971215073) ^ (c.l * 433494437) ^ (c.d * 1597334677));
    var pts = new Int32Array(n), base = new Int32Array(n), ws = { order: new Int32Array(n), tmp: new Int32Array(n), cnt: new Int32Array(3 * r + 3) };
    var acc = [], sims, rd, t, above, tied;
    for (i = 0; i < rows.length; i++) { acc.push(0); }
    var past = path(c.w, c.d, c.l, 0, 0, 0);
    sims = Math.min(2000, Math.floor(BUDGET / (n * (played + rows.length * Math.max(1, left)))));
    if (sims >= 300) {
      // once per finish, from the rounds already played
      var paths = [];
      for (i = 0; i < rows.length; i++) { paths.push(path(0, 0, 0, rows[i].w, rows[i].d, rows[i].l)); }
      for (var sm = 0; sm < sims; sm++) {
        for (i = 0; i < n; i++) { base[i] = 0; }
        for (rd = 0; rd < played; rd++) { simRound(base, n, past[rd], tie, rand, ws); }
        for (i = 0; i < rows.length; i++) {
          pts.set(base);
          for (rd = 0; rd < left; rd++) { simRound(pts, n, paths[i][rd], tie, rand, ws); }
          t = pts[0]; above = 0; tied = 0;
          for (j = 1; j < n; j++) { if (pts[j] > t) { above++; } else if (pts[j] === t) { tied++; } }
          acc[i] += share(above, tied, k);
        }
      }
    } else {
      // a large field: played once for every finish, player 0 one more of the field
      sims = Math.max(300, Math.min(4000, Math.floor(BUDGET / (n * r))));
      var hist = new Int32Array(3 * r + 2), top = 3 * r;
      for (var sm2 = 0; sm2 < sims; sm2++) {
        for (i = 0; i < n; i++) { pts[i] = 0; }
        for (rd = 0; rd < r; rd++) { simRound(pts, n, null, tie, rand, ws); }
        for (i = 0; i <= top + 1; i++) { hist[i] = 0; }
        for (j = 1; j < n; j++) { hist[pts[j]]++; }
        for (i = top - 1; i >= 0; i--) { hist[i] += hist[i + 1]; }      // hist[p]: players on p or more
        for (i = 0; i < rows.length; i++) {
          t = rows[i].pts; above = t + 1 <= top ? hist[t + 1] : 0; tied = (t <= top ? hist[t] : 0) - above;
          acc[i] += share(above, tied, k);
        }
      }
    }
    for (i = 0; i < rows.length; i++) { out.push(rows[i].worst.verdict === "in" ? 1 : acc[i] / sims); }
    // more points never mean a smaller chance (the draw's noise aside): rows run best first
    var floor = 0, g = rows.length - 1;
    while (g >= 0) {
      var h = g, gm = 0;
      while (h >= 0 && rows[h].pts === rows[g].pts) { if (out[h] < floor) { out[h] = floor; } if (out[h] > gm) { gm = out[h]; } h--; }
      if (gm > floor) { floor = gm; }
      g = h;
    }
    return out;
  }

  // A record from the Game page's saved matches tagged to one event: player 1 is you. A match is
  // won on games; level games (or none decided) is a draw. Matches are rebuilt from checked fields.
  function recordFrom(history, evId) {
    var r = { w: 0, l: 0, d: 0, n: 0 };
    if (!history || !history.length || (typeof evId !== "string" && typeof evId !== "number")) { return r; }
    for (var i = 0; i < history.length; i++) {
      var m = history[i];
      if (!m || typeof m !== "object" || !m.tag || typeof m.tag !== "object" || String(m.tag.id) !== String(evId)) { continue; }
      if (!Array.isArray(m.games) || !m.games.length) { continue; }
      var g1 = 0, g2 = 0;
      for (var j = 0; j < m.games.length; j++) {
        var ev = m.games[j] && m.games[j].ev;
        if (!Array.isArray(ev) || !ev.length) { continue; }
        // the Game page's own rule (counter winnerOf): the last concede or end decides; else the
        // first to 8 points; else undecided
        var win = null, x, e, s1 = 0, s2 = 0;
        for (x = ev.length - 1; x >= 0 && win === null; x--) {
          e = ev[x];
          if (!e || typeof e !== "object") { continue; }
          if (e.t === "concede" && (e.p === 1 || e.p === 2)) { win = e.p === 1 ? 2 : 1; }
          else if (e.t === "end" && (e.w === 0 || e.w === 1 || e.w === 2)) { win = e.w; }
        }
        if (win === null) {
          for (x = 0; x < ev.length; x++) {
            e = ev[x];
            if (e && e.t === "point") { if (e.p === 1) { s1++; } else if (e.p === 2) { s2++; } }
          }
          win = s1 >= 8 ? 1 : (s2 >= 8 ? 2 : 0);
        }
        if (win === 1) { g1++; } else if (win === 2) { g2++; }
      }
      r.n++;
      if (g1 > g2) { r.w++; } else if (g2 > g1) { r.l++; } else { r.d++; }
    }
    return r;
  }

  var API = { PTS: PTS, CUTS: CUTS, roundsFor: roundsFor, cutFor: cutFor, clean: clean, scenarios: scenarios, recordFrom: recordFrom, simulate: simulate, chances: chances };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; }
  else { root.RAVI_CUT = API; }
})(this);
