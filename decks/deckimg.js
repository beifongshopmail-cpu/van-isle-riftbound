// deckimg.js -- a deck drawn as one picture to save or share (plan 2 M4). Pure drawing: it reads
// the deck, Riot's cards (through decks/deck.js) and the card art RAVI already keeps; it fetches
// nothing else and needs no server. Works in the page (a canvas from the document) and in tests.
//
// THE PICTURE, 1080 wide (a phone's share size), height to fit:
//   head    the Legend's whole card, then the deck's name, the Legend, the Chosen Champion and the
//           counts, on a band in the deck's two domain colours (as its card on the Decks list)
//   Main deck  every card once, whole, most copies shown as a bone pill (x3), sorted by energy
//           then name; the Chosen Champion first, ringed in bone and named in the head
//   Battlefields  the three, lying flat as they are played
//   Runes   each rune's symbol with its count and name
//   Sideboard  smaller, when the deck has one
//   foot    ravi.tools and Riot's Legal Jibber Jabber notice
// Colour is never the only signal: every count and name is written out.
(function (root) {
  "use strict";

  var W = 1080, PAD = 40, GAP = 12;
  var RGB = { body: "232,118,0", calm: "72,140,56", chaos: "106,64,148", fury: "223,22,32", mind: "15,111,166", order: "210,180,0", colorless: "240,240,245" };
  var C = { ground: "#0B0B0E", panel: "#17171C", bone: "#EFEBE3", muted: "#A3A3AD", ink: "#111114" };
  var DISP = "Poppins, system-ui, sans-serif", TEXT = "Nunito, system-ui, sans-serif";
  var RATIO = 1039 / 744;
  var NOTICE = "RAVI was created under Riot Games' Legal Jibber Jabber policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.";

  function keys(m) { return Object.keys(m || {}).filter(function (k) { return m[k] > 0; }); }

  // the deck laid out as rows to draw: what the picture holds, before any pixel
  function plan(X, I, d) {
    var L = X.card(I, d.legend), champ = d.champ && d.main[d.champ] ? d.champ : "";
    var byName = {};
    function group(m) {
      var out = [], seen = {};
      keys(m).forEach(function (c) {
        var x = X.card(I, c); if (!x) { return; }
        var f = X.full(I, x);
        if (seen[f]) { seen[f].n += m[c]; return; }
        seen[f] = { c: c, x: x, f: f, n: m[c] }; out.push(seen[f]);
      });
      return out;
    }
    var main = group(d.main);
    main.sort(function (a, b) {
      var ac = a.c === champ ? 0 : 1, bc = b.c === champ ? 0 : 1;
      var ae = typeof a.x.e === "number" ? a.x.e : 99, be = typeof b.x.e === "number" ? b.x.e : 99;
      return ac - bc || ae - be || a.f.localeCompare(b.f);
    });
    var runes = group(d.runes).sort(function (a, b) { return b.n - a.n || a.f.localeCompare(b.f); });
    var side = group(d.side).sort(function (a, b) { var ae = typeof a.x.e === "number" ? a.x.e : 99, be = typeof b.x.e === "number" ? b.x.e : 99; return ae - be || a.f.localeCompare(b.f); });
    var bf = (d.bf || []).map(function (c) { var x = X.card(I, c); return x ? { c: c, x: x, f: X.full(I, x), n: 1 } : null; }).filter(Boolean);
    var sh = X.share ? X.share(I, d) : {};
    var doms = L ? (L.d || []).filter(function (v) { return RGB[v]; }) : [];
    return {
      legend: L ? { x: L, f: X.full(I, L) } : null, champ: champ ? { x: X.card(I, champ), f: X.full(I, X.card(I, champ)) } : null,
      main: main, bf: bf, runes: runes, side: side, byName: byName,
      counts: { main: X.sum(d.main), bf: bf.length, runes: X.sum(d.runes), side: X.sum(d.side) },
      c1: RGB[sh.a || doms[0]] || "90,90,100", c2: RGB[sh.b || doms[1] || sh.a || doms[0]] || "90,90,100"
    };
  }

  // how tall each part is, from the plan
  function layout(p) {
    var cols = 6, cw = (W - 2 * PAD - (cols - 1) * GAP) / cols, ch = cw * RATIO;
    var rows = Math.ceil(p.main.length / cols);
    var y = PAD, parts = {};
    parts.head = { y: y, h: 300 }; y += 300 + 44;
    parts.main = { y: y, cols: cols, cw: cw, ch: ch, h: 56 + rows * (ch + GAP) - GAP }; y += parts.main.h + 44;
    var bw = (W - 2 * PAD - 2 * GAP) / 3, bh = bw * 533 / 744;   // a battlefield's art is stored lying flat
    if (p.bf.length) { parts.bf = { y: y, bw: bw, bh: bh, h: 56 + bh }; y += parts.bf.h + 44; }
    if (p.runes.length) { parts.runes = { y: y, h: 56 + 96 }; y += parts.runes.h + 44; }
    if (p.side.length) {
      var sc = 8, sw = (W - 2 * PAD - (sc - 1) * GAP) / sc, sr = Math.ceil(p.side.length / sc);
      parts.side = { y: y, cols: sc, cw: sw, ch: sw * RATIO, h: 56 + sr * (sw * RATIO + GAP) - GAP }; y += parts.side.h + 44;
    }
    parts.foot = { y: y, h: 120 }; y += 120 + PAD - 10;
    return { parts: parts, H: Math.ceil(y) };
  }

  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function fit(g, s, max) {
    if (g.measureText(s).width <= max) { return s; }
    while (s.length > 1 && g.measureText(s + "\u2026").width > max) { s = s.slice(0, -1); }
    return s.replace(/\s+$/, "") + "\u2026";
  }
  function label(g, s, y, right) {
    g.fillStyle = C.bone; g.font = "700 36px " + DISP; g.textBaseline = "alphabetic"; g.textAlign = "left";
    g.fillText(s, PAD, y + 38);
    if (right) { g.fillStyle = C.muted; g.font = "600 28px " + TEXT; g.textAlign = "right"; g.fillText(right, W - PAD, y + 36); g.textAlign = "left"; }
  }
  function cardAt(g, img, x, y, w, h, r) {
    g.save(); rr(g, x, y, w, h, r); g.clip();
    g.fillStyle = C.panel; g.fillRect(x, y, w, h);
    if (img) { g.drawImage(img, x, y, w, h); }
    g.restore();
  }
  function pill(g, s, cx, by, size) {
    g.font = "700 " + size + "px " + DISP;
    var tw = g.measureText(s).width, ph = size * 1.45, pw = Math.max(ph * 1.5, tw + size * 1.1);
    rr(g, cx - pw / 2, by - ph, pw, ph, ph / 2); g.fillStyle = C.bone; g.fill();
    g.lineWidth = 3; g.strokeStyle = C.ink; g.stroke();
    g.fillStyle = C.ink; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(s, cx, by - ph / 2 + 1);
    g.textAlign = "left"; g.textBaseline = "alphabetic";
  }

  // draw(X, I, deck, env) -> Promise of the canvas. env: { canvas(w, h), image(url) -> Promise<img|null>,
  // art: the art folder ("../cards/art/"), runes: the rune symbols' folder ("../cards/runes/") }
  function draw(X, I, d, env) {
    var p = plan(X, I, d), lay = layout(p), P = lay.parts;
    var urls = {};
    function want(x, big) { if (x && /^[0-9a-f]{40}$/.test(x.h || "")) { urls[x.h + (big ? "" : ".t")] = env.art + x.h + (big ? ".webp" : ".t.webp"); } }
    if (p.legend) { want(p.legend.x, true); }
    p.main.forEach(function (r) { want(r.x, true); }); p.bf.forEach(function (r) { want(r.x, true); }); p.side.forEach(function (r) { want(r.x, false); });
    var runeUrls = {};
    p.runes.forEach(function (r) { var dm = (r.x.d || [])[0]; if (dm && RGB[dm]) { runeUrls[dm] = env.runes + "rune_" + dm + ".svg"; } });
    var all = Object.keys(urls).map(function (k) { return [k, urls[k]]; }).concat(Object.keys(runeUrls).map(function (k) { return ["rune:" + k, runeUrls[k]]; }));
    return Promise.all(all.map(function (u) { return env.image(u[1]).then(function (im) { return [u[0], im]; }, function () { return [u[0], null]; }); })).then(function (got) {
      var IM = {}; got.forEach(function (x) { IM[x[0]] = x[1]; });
      function art(x, big) { return x && x.h ? IM[x.h + (big ? "" : ".t")] || null : null; }
      var cv = env.canvas(W, lay.H), g = cv.getContext("2d");
      g.fillStyle = C.ground; g.fillRect(0, 0, W, lay.H);

      // HEAD: the band in the deck's two colours, the Legend's card, the words
      var hy = P.head.y, hh = P.head.h;
      g.save(); rr(g, PAD, hy, W - 2 * PAD, hh, 36); g.clip();
      var gr = g.createLinearGradient(PAD, hy, W - PAD, hy + hh);
      gr.addColorStop(0, "rgba(" + p.c1 + ",.85)"); gr.addColorStop(1, "rgba(" + p.c2 + ",.85)");
      g.fillStyle = gr; g.fillRect(PAD, hy, W - 2 * PAD, hh);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(PAD, hy, W - 2 * PAD, hh);
      g.restore();
      var lh = hh - 40, lw = lh / RATIO;
      cardAt(g, p.legend ? art(p.legend.x, true) : null, PAD + 20, hy + 20, lw, lh, 12);
      var tx = PAD + 20 + lw + 32, tw = W - PAD - 28 - tx;
      g.fillStyle = C.bone; g.font = "700 54px " + DISP; g.fillText(fit(g, d.name || "Untitled deck", tw), tx, hy + 84);
      g.font = "600 32px " + TEXT; g.fillStyle = C.bone;
      g.fillText(fit(g, p.legend ? p.legend.f : "No Legend", tw), tx, hy + 136);
      if (p.champ) { g.fillStyle = "rgba(239,235,227,.82)"; g.fillText(fit(g, "Chosen Champion: " + p.champ.f, tw), tx, hy + 184); }
      g.fillStyle = "rgba(239,235,227,.82)"; g.font = "600 28px " + TEXT;
      var cnt = [p.counts.main + " Main deck", p.counts.bf + " Battlefields", p.counts.runes + " Runes"].concat(p.counts.side ? [p.counts.side + " Sideboard"] : []).join(" \u00b7 ");
      g.fillText(fit(g, cnt, tw), tx, hy + 246);

      // MAIN DECK
      var M = P.main;
      label(g, "Main deck", M.y, p.counts.main + " cards");
      p.main.forEach(function (r, i) {
        var col = i % M.cols, row = Math.floor(i / M.cols), x = PAD + col * (M.cw + GAP), y = M.y + 56 + row * (M.ch + GAP);
        cardAt(g, art(r.x, true), x, y, M.cw, M.ch, 9);
        if (p.champ && r.c === d.champ) { rr(g, x - 3, y - 3, M.cw + 6, M.ch + 6, 12); g.lineWidth = 5; g.strokeStyle = C.bone; g.stroke(); }
        pill(g, "x" + r.n, x + M.cw / 2, y + M.ch - 10, 26);
      });

      // BATTLEFIELDS, flat as they are played (Riot's art for them is already landscape)
      if (P.bf) {
        label(g, "Battlefields", P.bf.y);
        p.bf.forEach(function (r, i) {
          var x = PAD + i * (P.bf.bw + GAP), y = P.bf.y + 56, w = P.bf.bw, h = P.bf.bh, im = art(r.x, true);
          g.save(); rr(g, x, y, w, h, 10); g.clip(); g.fillStyle = C.panel; g.fillRect(x, y, w, h);
          if (im) { g.drawImage(im, x, y, w, h); }
          g.restore();
        });
      }

      // RUNES: the symbol in its domain's colour, the count, the name
      if (P.runes) {
        label(g, "Runes", P.runes.y, p.counts.runes + " runes");
        var rx = PAD;
        p.runes.forEach(function (r) {
          var dm = (r.x.d || [])[0], y = P.runes.y + 56, s = 96;
          g.beginPath(); g.arc(rx + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); g.fillStyle = "rgb(" + (RGB[dm] || "90,90,100") + ")"; g.fill();
          var sym = IM["rune:" + dm]; if (sym) { g.drawImage(sym, rx + 18, y + 18, s - 36, s - 36); }
          g.fillStyle = C.bone; g.font = "700 44px " + DISP; g.fillText(String(r.n), rx + s + 18, y + 52);
          g.font = "600 26px " + TEXT; g.fillStyle = C.muted; g.fillText(fit(g, r.f, 300), rx + s + 18, y + 86);
          g.font = "700 44px " + DISP;
          rx += s + 18 + Math.max(g.measureText(String(r.n)).width, (g.font = "600 26px " + TEXT, g.measureText(r.f).width)) + 48;
        });
      }

      // SIDEBOARD, smaller
      if (P.side) {
        label(g, "Sideboard", P.side.y, p.counts.side + " cards");
        p.side.forEach(function (r, i) {
          var col = i % P.side.cols, row = Math.floor(i / P.side.cols), x = PAD + col * (P.side.cw + GAP), y = P.side.y + 56 + row * (P.side.ch + GAP);
          cardAt(g, art(r.x, false), x, y, P.side.cw, P.side.ch, 7);
          pill(g, "x" + r.n, x + P.side.cw / 2, y + P.side.ch - 6, 20);
        });
      }

      // FOOT
      var fy = P.foot.y;
      g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 2; g.beginPath(); g.moveTo(PAD, fy); g.lineTo(W - PAD, fy); g.stroke();
      g.fillStyle = C.bone; g.font = "700 30px " + DISP; g.fillText("ravi.tools", PAD, fy + 50);
      // Riot's Legal Jibber Jabber notice, in its own words (RULE -- Riot's policies)
      g.fillStyle = C.muted; g.font = "600 22px " + TEXT;
      var words = NOTICE.split(" "), ln = "", ly = fy + 84;
      words.forEach(function (w) { var t = ln ? ln + " " + w : w; if (g.measureText(t).width > W - 2 * PAD) { g.fillText(ln, PAD, ly); ly += 30; ln = w; } else { ln = t; } });
      if (ln) { g.fillText(ln, PAD, ly); }
      return cv;
    });
  }

  var API = { W: W, plan: plan, layout: layout, draw: draw };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; }
  else { root.RAVI_DECKIMG = API; }
})(this);
