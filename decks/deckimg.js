// deckimg.js -- a deck drawn as one picture to save or share (plan 2 M4). Pure drawing: it reads
// the deck, Riot's cards (through decks/deck.js) and the card art RAVI already keeps; it fetches
// nothing else and needs no server. Works in the page (a canvas from the document) and in tests.
//
// THE PICTURE, 1080 wide (a phone's share size), height to fit, on a dark ground washed top to
// bottom in the deck's two domain colours (Mako's reference, 2026-11-02: Piltover Archive's export):
//   title   the deck's name, its card count and champion; RAVI's name on the right
//   Legend  its whole card and name, the runes under it (each rune's symbol and count)
//   Battlefields  the three, stacked beside the Legend, lying flat as they are played
//   Main Deck  every card once, whole, in rows of five; two or more copies as a bone disc (x3);
//           the Chosen Champion first and ringed in bone; then by energy and name
//   Sideboard  the same, when the deck has one
//   foot    Riot's Legal Jibber Jabber notice
// Colour is never the only signal: every count and name is written out.
(function (root) {
  "use strict";

  var W = 1080, PAD = 40, GAP = 12;
  // the domains' colours come from the colour table (pages.js RAVI_RUNE), read when a picture is
  // planned so the picture wears the app's palette; outside a page (a test) a domain has no colour
  var DOMS = ["body", "calm", "chaos", "fury", "mind", "order", "colorless"], RGB = {};
  function hues() { DOMS.forEach(function (d) { RGB[d] = root.RAVI_RUNE ? root.RAVI_RUNE(d) : "90,90,100"; }); }
  hues();
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
    hues();
    var doms = L ? (L.d || []).filter(function (v) { return RGB[v]; }) : [];
    return {
      legend: L ? { x: L, f: X.full(I, L) } : null, champ: champ ? { x: X.card(I, champ), f: X.full(I, X.card(I, champ)) } : null,
      main: main, bf: bf, runes: runes, side: side, byName: byName,
      counts: { main: X.sum(d.main), bf: bf.length, runes: X.sum(d.runes), side: X.sum(d.side) },
      c1: RGB[sh.a || doms[0]] || "90,90,100", c2: RGB[sh.b || doms[1] || sh.a || doms[0]] || "90,90,100"
    };
  }

  // where each part sits, from the plan: a title row; then two columns, the Legend (its card, its
  // name, the runes under it) and the battlefields stacked beside it; then the Main deck and the
  // sideboard in rows of five; then the foot
  var COLS = 5, CG = 20, HEAD = 52, SEC = 56;
  function layout(p) {
    var cw = (W - 2 * PAD - (COLS - 1) * CG) / COLS, ch = cw * RATIO;
    var parts = {}, y = PAD;
    parts.title = { y: y, h: 96 }; y += 96 + 36;
    var lw = 300, lh = lw * RATIO;
    var left = HEAD + 18 + lh + 18 + 84 + (p.runes.length ? 30 + HEAD + 18 + 84 : 0);
    var bw = 300, bh = bw * 533 / 744, bgap = 24;
    var right = p.bf.length ? HEAD + 18 + p.bf.length * bh + (p.bf.length - 1) * bgap : 0;
    parts.top = { y: y, lw: lw, lh: lh, bw: bw, bh: bh, bgap: bgap, h: Math.max(left, right) }; y += parts.top.h + SEC;
    var rows = Math.ceil(p.main.length / COLS);
    parts.main = { y: y, cw: cw, ch: ch, h: HEAD + 24 + rows * (ch + CG) - CG }; y += parts.main.h + SEC;
    if (p.side.length) { var sr = Math.ceil(p.side.length / COLS); parts.side = { y: y, cw: cw, ch: ch, h: HEAD + 24 + sr * (ch + CG) - CG }; y += parts.side.h + SEC; }
    parts.foot = { y: y, h: 96 }; y += 96 + PAD - 20;
    return { parts: parts, H: Math.ceil(y), cols: COLS };
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
  function heading(g, s, cx, y) {
    g.fillStyle = C.bone; g.font = "700 46px " + DISP; g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillText(s, cx, y + 44); g.textAlign = "left";
  }
  function cardAt(g, img, x, y, w, h, r) {
    g.save(); rr(g, x, y, w, h, r); g.clip();
    g.fillStyle = C.panel; g.fillRect(x, y, w, h);
    if (img) { g.drawImage(img, x, y, w, h); }
    g.restore();
  }
  // a copy count, bottom right of a card: a bone disc with the count in dark ink (x1 shows none)
  function count(g, n, x, y, w, h) {
    if (n < 2) { return; }
    var r = Math.round(w * 0.17), cx = x + w - r - 8, cy = y + h - r - 10;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = C.bone; g.fill();
    g.lineWidth = 3; g.strokeStyle = C.ink; g.stroke();
    g.fillStyle = C.ink; g.font = "700 " + Math.round(r * 0.9) + "px " + DISP; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("x" + n, cx, cy + 1); g.textAlign = "left"; g.textBaseline = "alphabetic";
  }
  function wrap(g, s, max) {
    var words = s.split(" "), lines = [], ln = "";
    words.forEach(function (w) { var t = ln ? ln + " " + w : w; if (ln && g.measureText(t).width > max) { lines.push(ln); ln = w; } else { ln = t; } });
    if (ln) { lines.push(ln); }
    return lines;
  }
  function grid(g, rows, P, art, champ) {
    rows.forEach(function (r, i) {
      var col = i % COLS, row = Math.floor(i / COLS), x = PAD + col * (P.cw + CG), y = P.y + HEAD + 24 + row * (P.ch + CG);
      cardAt(g, art(r.x), x, y, P.cw, P.ch, 10);
      if (champ && r.c === champ) { rr(g, x - 4, y - 4, P.cw + 8, P.ch + 8, 14); g.lineWidth = 5; g.strokeStyle = C.bone; g.stroke(); }
      count(g, r.n, x, y, P.cw, P.ch);
    });
  }

  // draw(X, I, deck, env) -> Promise of the canvas. env: { canvas(w, h), image(url) -> Promise<img|null>,
  // art: the art folder ("../cards/art/"), runes: the rune symbols' folder ("../cards/runes/") }
  function draw(X, I, d, env) {
    var p = plan(X, I, d), lay = layout(p), P = lay.parts;
    var urls = {};
    function want(x) { if (x && /^[0-9a-f]{40}$/.test(x.h || "")) { urls[x.h] = env.art + x.h + ".webp"; } }
    if (p.legend) { want(p.legend.x); }
    p.main.forEach(function (r) { want(r.x); }); p.bf.forEach(function (r) { want(r.x); }); p.side.forEach(function (r) { want(r.x); });
    var runeUrls = {};
    p.runes.forEach(function (r) { var dm = (r.x.d || [])[0]; if (dm && RGB[dm]) { runeUrls[dm] = env.runes + "rune_" + dm + ".svg"; } });
    var all = Object.keys(urls).map(function (k) { return [k, urls[k]]; }).concat(Object.keys(runeUrls).map(function (k) { return ["rune:" + k, runeUrls[k]]; }));
    return Promise.all(all.map(function (u) { return env.image(u[1]).then(function (im) { return [u[0], im]; }, function () { return [u[0], null]; }); })).then(function (got) {
      var IM = {}; got.forEach(function (x) { IM[x[0]] = x[1]; });
      function art(x) { return x && x.h ? IM[x.h] || null : null; }
      var cv = env.canvas(W, lay.H), g = cv.getContext("2d");

      // the ground: dark, washed top to bottom in the deck's two domain colours
      g.fillStyle = C.ground; g.fillRect(0, 0, W, lay.H);
      var gr = g.createLinearGradient(0, 0, 0, lay.H);
      gr.addColorStop(0, "rgba(" + p.c1 + ",.30)"); gr.addColorStop(1, "rgba(" + p.c2 + ",.30)");
      g.fillStyle = gr; g.fillRect(0, 0, W, lay.H);

      // TITLE: the deck's name; RAVI's name on the right
      var T = P.title;
      g.fillStyle = C.bone; g.font = "700 62px " + DISP; g.fillText(fit(g, d.name || "Untitled deck", W - 2 * PAD - 220), PAD, T.y + 62);
      g.font = "600 30px " + TEXT; g.fillStyle = C.muted; g.fillText(fit(g, p.counts.main + " cards" + (p.legend ? " \u00b7 " + p.legend.f.split(",")[0] : ""), W - 2 * PAD - 220), PAD, T.y + 104);
      g.font = "700 54px " + DISP; g.textAlign = "right";
      var vw = g.measureText("VI").width;
      g.fillStyle = "#EE5F9C"; g.fillText("VI", W - PAD, T.y + 58);
      g.fillStyle = "#5DA5EE"; g.fillText("RA", W - PAD - vw - 2, T.y + 58);
      g.font = "600 24px " + TEXT; g.fillStyle = C.muted; g.fillText("ravi.tools", W - PAD, T.y + 96);
      g.textAlign = "left";

      // TOP: the Legend and its runes on the left, the battlefields stacked on the right
      var Tp = P.top, cx1 = PAD + (W / 2 - PAD) / 2, cx2 = W / 2 + (W / 2 - PAD) / 2, y = Tp.y;
      heading(g, "Legend", cx1, y);
      cardAt(g, p.legend ? art(p.legend.x) : null, cx1 - Tp.lw / 2, y + HEAD + 18, Tp.lw, Tp.lh, 14);
      var ny = y + HEAD + 18 + Tp.lh + 18;
      g.fillStyle = C.bone; g.font = "700 32px " + DISP; g.textAlign = "center";
      wrap(g, p.legend ? p.legend.f : "No Legend", W / 2 - PAD - 20).slice(0, 2).forEach(function (l, i) { g.fillText(l, cx1, ny + 34 + i * 42); });
      g.textAlign = "left";
      if (p.runes.length) {
        var ry = ny + 84 + 30;
        heading(g, "Runes", cx1, ry);
        var s = 72, cy = ry + HEAD + 18, items = p.runes.map(function (r) { g.font = "700 54px " + DISP; return { r: r, w: s + 14 + g.measureText(String(r.n)).width }; });
        var tot = items.reduce(function (a, it) { return a + it.w; }, 0) + (items.length - 1) * 40, rx = cx1 - tot / 2;
        items.forEach(function (it) {
          var dm = (it.r.x.d || [])[0], sym = IM["rune:" + dm];
          if (sym) { g.drawImage(sym, rx, cy, s, s); } else { g.beginPath(); g.arc(rx + s / 2, cy + s / 2, s / 2, 0, Math.PI * 2); g.fillStyle = "rgb(" + (RGB[dm] || "90,90,100") + ")"; g.fill(); }
          g.fillStyle = C.bone; g.font = "700 54px " + DISP; g.fillText(String(it.r.n), rx + s + 14, cy + 56);
          rx += it.w + 40;
        });
      }
      if (p.bf.length) {
        heading(g, "Battlefields", cx2, y);
        p.bf.forEach(function (r, i) { cardAt(g, art(r.x), cx2 - Tp.bw / 2, y + HEAD + 18 + i * (Tp.bh + Tp.bgap), Tp.bw, Tp.bh, 12); });
      }

      // MAIN DECK and SIDEBOARD, rows of five, the copies on each card
      heading(g, "Main Deck", W / 2, P.main.y);
      grid(g, p.main, P.main, art, d.champ);
      if (P.side) { heading(g, "Sideboard", W / 2, P.side.y); grid(g, p.side, P.side, art, ""); }

      // FOOT: Riot's Legal Jibber Jabber notice, in its own words (RULE -- Riot's policies)
      var fy = P.foot.y;
      g.fillStyle = C.muted; g.font = "600 22px " + TEXT; g.textAlign = "center";
      wrap(g, NOTICE, W - 2 * PAD).forEach(function (l, i) { g.fillText(l, W / 2, fy + 30 + i * 30); });
      g.textAlign = "left";
      return cv;
    });
  }

  var API = { W: W, plan: plan, layout: layout, draw: draw };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; }
  else { root.RAVI_DECKIMG = API; }
})(this);
