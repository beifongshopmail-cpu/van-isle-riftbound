// THE DECKBUILDER'S LOGIC (M11, 2026-10-17). One file the Decks page and the tests share:
// the deck rules (Riot's Core Rules 103 and Tournament Rules 402), the six ways a deck is
// pasted in, the three ways it is copied out, the deck's stats and a sample opening hand.
// It reads cards/catalogue.json as the page loaded it and touches nothing else.
//
// THE DECK CODE is Piltover Archive's open format. Its encoder and decoder below are adapted
// from github.com/Piltover-Archive/RiftboundDeckCodes v1.5.0 (src/deckCode.ts and
// src/VarintTranslator.ts), Copyright 2025 PiltoverArchive, licensed under the Apache License,
// Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0). Changes from the original: ported
// from TypeScript to plain JavaScript in this one file; errors return null to the caller
// instead of throwing out of it. The format itself is unchanged, so codes round-trip with
// Piltover Archive, Riftmana and riftbound.zone.
//
// THE FORMATS (records: ARCH -- deck import and export formats):
//   in:  deck code, headed text (Piltover Archive's 'Export as Text', the Event Locator's
//        paste), the same text without headings, code lines ('1xUNL-183', Riftmana),
//        Tabletop Simulator code ('OGN-265-1 ...'), Pixelborn code (Base64 of TTS tokens)
//   out: event text first (the headed layout), then deck code, then TTS code
//
// A DECK, as the page stores it:
//   { id, name, legend:"OGN-253", champ:"OGN-027", main:{code:n}, side:{code:n},
//     maybe:{code:n}, runes:{code:n}, bf:[code, code, code], extra:[code], note:"", t:ms }
// A card's code is its catalogue number without the set total: "OGN-066a/298" is "OGN-066a".
// The Chosen Champion is one of the Main deck's copies (Core Rules 103.3.a): champ names it and
// main counts it, so the Main deck is 40 with the champion in it.
(function (root) {
  "use strict";

  var SETS = ["OGN", "OGS", "SFD", "UNL", "VEN", "RAD"];   // release order, for picking a printing
  var DOMAINS = ["fury", "calm", "mind", "body", "chaos", "order"];

  function codeOf(c) { return String(c || "").split("/")[0]; }
  function parts(code) {
    var m = /^([A-Z]+)-(R|SP|T)?(\d+)([a-z*]?)$/.exec(code || "");
    return m ? { set: m[1], pre: m[2] || "", num: m[3], v: m[4] || "" } : null;
  }
  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/[\u2018\u2019\u02bc`]/g, "'").replace(/[\u2013\u2014]/g, "-")
      .replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function sum(m) { var t = 0, k; for (k in m) { if (m.hasOwnProperty(k)) { t += m[k]; } } return t; }
  function keys(m) { return Object.keys(m || {}).filter(function (k) { return m[k] > 0; }); }

  // ---- THE INDEX: the catalogue made searchable by code and by name ----
  function prep(cat) {
    var list = (cat && cat.cards) || cat || [], by = {}, champs = {}, names = {}, i, x;
    for (i = 0; i < list.length; i++) {
      x = list[i];
      by[codeOf(x.c)] = x;
      if (x.t === "unit" && (x.k || []).indexOf("champion") > -1) { champs[x.n] = 1; }
    }
    var I = { list: list, by: by, champs: champs, names: names };
    for (i = 0; i < list.length; i++) {
      x = list[i];
      var a = [full(I, x)];
      if (x.t === "legend") { a.push(x.n); }
      if (!x.b && x.t !== "legend") { a.push(x.n); }
      a.forEach(function (nm) { var k = norm(nm); if (k) { (names[k] = names[k] || []).push(x); } });
    }
    for (var k in names) { if (names.hasOwnProperty(k)) { names[k].sort(function (p, q) { return rank(p) - rank(q); }); } }
    return I;
  }
  // The printing a name means when only the name is given: the plain base card first, the
  // earliest set first, alternate art, signed and showcase after.
  function rank(x) {
    var p = parts(codeOf(x.c)) || {}, r = 0;
    if (p.v) { r += 20; }
    if (p.pre === "SP") { r += 20; }
    if (x.r === "showcase") { r += 10; }
    var s = SETS.indexOf(p.set);
    return r + (s < 0 ? 9 : s);
  }
  function legendChamp(I, x) {
    var g = (x && x.g) || [], i;
    for (i = 0; i < g.length; i++) { if (I.champs[g[i]]) { return g[i]; } }
    return g.length ? g[g.length - 1] : "";
  }
  // A card's full name (Core Rules 132.4): "Short Name, Subtitle". A legend's is its champion
  // and its title, as every decklist writes it: "Darius, Hand of Noxus".
  function full(I, x) {
    if (!x) { return ""; }
    if (x.t === "legend") { var c = legendChamp(I, x); return c ? c + ", " + x.n : x.n; }
    // a Signature card's subtitle line is its champion (Siphon Power: Viktor), not part of its name
    var sig = (x.k || []).indexOf("signature") > -1 && (x.g || []).indexOf(x.b) > -1;
    return x.n + (x.b && !sig ? ", " + x.b : "");
  }
  function card(I, code) { return I.by[code] || null; }
  function isChampUnit(x) { return !!x && x.t === "unit" && (x.k || []).indexOf("champion") > -1 && (x.k || []).indexOf("signature") === -1; }
  function isToken(x) { return !!x && (x.k || []).indexOf("token") > -1; }
  // where a card goes when it is added: the section its type belongs to
  function sectionOf(x) {
    if (!x || isToken(x)) { return ""; }
    if (x.t === "legend") { return "legend"; }
    if (x.t === "rune") { return "runes"; }
    if (x.t === "battlefield") { return "bf"; }
    return "main";
  }
  // Spiderling and its kind: "Your deck can have any number of cards named X."
  function anyNumber(x) { return /any number of cards named/i.test((x && x.q) || ""); }

  function empty(name) {
    return { id: "", name: name || "", legend: "", champ: "", main: {}, side: {}, maybe: {}, runes: {}, bf: [], extra: [], note: "", t: 0 };
  }

  // ---- ADDING AND MOVING ----
  // add(I, deck, code, to): to is "main", "side" or "maybe" for a main-deck card; a legend,
  // a rune or a battlefield goes to its own section whatever to says. Returns the section it
  // landed in, or "" with deck unchanged.
  function add(I, deck, code, to) {
    var x = card(I, code), s = sectionOf(x);
    if (!s) { return ""; }
    if (s === "legend") {
      if (deck.legend && deck.legend !== code && deck.champ) {
        var c = card(I, deck.champ);
        if (c && (c.g || []).indexOf(legendChamp(I, x)) === -1) { deck.champ = ""; }
      }
      deck.legend = code; return "legend";
    }
    if (s === "runes") { deck.runes[code] = (deck.runes[code] || 0) + 1; return "runes"; }
    if (s === "bf") {
      if (deck.bf.indexOf(code) > -1) { return ""; }
      deck.bf.push(code); return "bf";
    }
    var into = (to === "side" || to === "maybe") ? to : "main";
    deck[into][code] = (deck[into][code] || 0) + 1;
    return into;
  }
  function take(deck, sec, code) {
    if (sec === "legend") { if (deck.legend === code) { deck.legend = ""; } return; }
    if (sec === "bf") { deck.bf = deck.bf.filter(function (c) { return c !== code; }); return; }
    var m = deck[sec];
    if (!m || !m[code]) { return; }
    m[code] -= 1;
    if (m[code] <= 0) { delete m[code]; }
    if (sec === "main" && deck.champ === code && !deck.main[code]) { deck.champ = ""; }
  }
  // the Chosen Champion: one of the Main deck's copies; making one adds a copy if none is there
  function setChamp(I, deck, code) {
    if (!isChampUnit(card(I, code))) { return false; }
    if (!deck.main[code]) { deck.main[code] = 1; }
    deck.champ = code;
    return true;
  }

  // ---- THE RULES, IN WORDS ----
  // banned: a set of normalised names (bannedFrom below). Returns [{at, msg}], where at is the
  // section a problem belongs to: legend, champ, main, runes, bf, side.
  function check(I, deck, banned) {
    var out = [], L = card(I, deck.legend), C = card(I, deck.champ), tag = L ? legendChamp(I, L) : "";
    var ids = L ? (L.d || []) : null;
    function say(at, msg) { out.push({ at: at, msg: msg }); }
    function inId(x) {
      if (!ids) { return true; }
      var d = (x.d || []).filter(function (v) { return v !== "colorless"; });
      return d.every(function (v) { return ids.indexOf(v) > -1; });
    }
    function dw(x) { return (x.d || []).map(cap).join(" and "); }
    if (!L) { say("legend", "Pick a Legend."); }
    if (!C) {
      say("champ", tag ? "Pick a Chosen Champion: a " + tag + " champion unit." : "Pick a Chosen Champion.");
    } else if (!isChampUnit(C) || (tag && (C.g || []).indexOf(tag) === -1)) {
      say("champ", full(I, C) + " can't be the Chosen Champion: it must be a " + (tag || "champion") + " champion unit, not a Signature card.");
    }
    var m = sum(deck.main);
    if (m < 40) { say("main", "Main deck has " + m + " of 40."); }
    if (m > 40) { say("main", "Main deck has " + m + "; events need exactly 40."); }
    var per = {}, who = {};
    ["main", "side"].forEach(function (sec) {
      keys(deck[sec]).forEach(function (code) {
        var x = card(I, code);
        if (!x) { say(sec, code + " is not a known card."); return; }
        var f = full(I, x);
        per[f] = (per[f] || 0) + deck[sec][code]; who[f] = x;
        if (sectionOf(x) !== "main") { say(sec, f + " can't go in the " + (sec === "main" ? "Main deck" : "Sideboard") + "."); }
        if (!inId(x)) { say(sec, f + " is " + dw(x) + ", outside your Legend's domains."); }
      });
    });
    Object.keys(per).sort().forEach(function (f) {
      if (per[f] > 3 && !anyNumber(who[f])) { say("main", f + ": " + per[f] + " copies; the most is 3."); }
    });
    var sig = 0;
    ["main", "side"].forEach(function (sec) {
      keys(deck[sec]).forEach(function (code) {
        var x = card(I, code);
        if (!x || (x.k || []).indexOf("signature") === -1) { return; }
        sig += deck[sec][code];
        if (tag && (x.g || []).indexOf(tag) === -1) { say(sec, full(I, x) + " is a " + ((x.g || [])[0] || "different") + " Signature card; your Legend is " + tag + "."); }
      });
    });
    if (sig > 3) { say("main", sig + " Signature cards; the most is 3."); }
    var r = sum(deck.runes);
    if (r !== 12) { say("runes", "Rune deck has " + r + " of 12."); }
    keys(deck.runes).forEach(function (code) { var x = card(I, code); if (x && !inId(x)) { say("runes", full(I, x) + " is outside your Legend's domains."); } });
    if (deck.bf.length !== 3) { say("bf", "Battlefields: " + deck.bf.length + " of 3."); }
    var bn = {};
    deck.bf.forEach(function (code) { var x = card(I, code), f = full(I, x); if (bn[f]) { say("bf", "Two battlefields named " + f + "; each needs its own name."); } bn[f] = 1; });
    var s = sum(deck.side);
    if (s > 10) { say("side", "Sideboard has " + s + "; the most is 10."); }
    if (banned) {
      var seen = {};
      var all = [deck.legend].concat(keys(deck.main), keys(deck.side), deck.bf);
      all.forEach(function (code) {
        var x = card(I, code); if (!x) { return; }
        var f = full(I, x);
        if (!seen[f] && isBanned(banned, f)) { seen[f] = 1; say(code === deck.legend ? "legend" : (deck.bf.indexOf(code) > -1 ? "bf" : "main"), f + " is banned in Constructed."); }
      });
    }
    return out;
  }
  // Riot's ban list (data/rules.json, the Constructed Format Legality entry) is HTML lists of
  // names. 'The Dreaming Tree' is listed as 'Dreaming Tree' and Draven's comma may be missing,
  // so names are compared without a leading 'the' and without punctuation.
  function bkey(s) { return norm(s).replace(/[^a-z0-9 ]/g, "").replace(/^the /, "").replace(/\s+/g, " ").trim(); }
  function bannedFrom(html) {
    var set = {}, re = /<li>([\s\S]*?)<\/li>/g, m;
    while ((m = re.exec(html || ""))) { var k = bkey(m[1].replace(/<[^>]+>/g, "")); if (k) { set[k] = 1; } }
    return set;
  }
  function isBanned(set, name) { return !!set[bkey(name)]; }

  // ---- THE DECK CODE (adapted from Piltover Archive's RiftboundDeckCodes, Apache-2.0) ----
  var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  var SET_MAP = { OGN: 0, OGS: 1, ARC: 2, SFD: 3, UNL: 4, VEN: 5, RAD: 6 };
  var VARIANT_MAP = { "": 0, a: 1, s: 2, "*": 2, b: 3 };
  function b32enc(bytes) {
    var out = "", buf = 0, left = 0, i;
    for (i = 0; i < bytes.length; i++) {
      buf = ((buf << 8) | bytes[i]) & 0xffff; left += 8;
      while (left >= 5) { left -= 5; out += B32[(buf >> left) & 31]; }
    }
    if (left > 0) { buf <<= 5 - left; out += B32[buf & 31]; }
    return out;
  }
  function b32dec(str) {
    var bytes = [], buf = 0, left = 0, i, v;
    for (i = 0; i < str.length; i++) {
      v = B32.indexOf(str.charAt(i).toUpperCase());
      if (v < 0) { throw new Error("bad character"); }
      buf = ((buf << 5) | v) & 0xffff; left += 5;
      while (left >= 8) { left -= 8; bytes.push((buf >> left) & 255); }
    }
    return bytes;
  }
  function varint(n) {
    if (n === 0) { return [0]; }
    var out = [], b;
    while (n !== 0) { b = n & 127; n = n >>> 7; if (n !== 0) { b |= 128; } out.push(b); }
    return out;
  }
  function Reader(bytes) { this.b = bytes; this.i = 0; }
  Reader.prototype.byte = function () { if (this.i >= this.b.length) { throw new Error("short code"); } return this.b[this.i++]; };
  Reader.prototype.varint = function () {
    var r = 0, sh = 0, x;
    for (;;) { x = this.byte(); r |= (x & 127) << sh; if (!(x & 128)) { return r; } sh += 7; if (sh > 35) { throw new Error("bad varint"); } }
  };
  function pcParse(code) {
    var i = code.indexOf("-");
    var set = code.slice(0, i), m = /^((?:R|SP)?\d+)([a-z*]?)$/.exec(code.slice(i + 1));
    if (i < 1 || !m) { throw new Error("bad card code " + code); }
    if (SET_MAP[set] === undefined) { throw new Error("unknown set " + set); }
    if (VARIANT_MAP[m[2]] === undefined) { throw new Error("unknown variant " + code); }
    return { set: set, number: m[1], variant: m[2] };
  }
  function numBytes(number, flagged, v4) {
    if (flagged || v4) {
      if (number.indexOf("SP") === 0) { return [2].concat(varint(parseInt(number.slice(2), 10))); }
      if (number.charAt(0) === "R") { return [1].concat(varint(parseInt(number.slice(1), 10))); }
      return [0].concat(varint(parseInt(number, 10)));
    }
    return varint(parseInt(number, 10));
  }
  function groups(cards) {
    var g = {}, out = [];
    cards.forEach(function (c) {
      var p = pcParse(c.code), k = p.set + "-" + p.variant;
      if (!g[k]) { g[k] = { set: SET_MAP[p.set], variant: VARIANT_MAP[p.variant], nums: [] }; out.push(g[k]); }
      g[k].nums.push(p.number);
    });
    out.sort(function (a, b) { return (a.set - b.set) || (a.variant - b.variant); });
    out.forEach(function (x) { x.nums.sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); }); });
    return out;
  }
  function encSection(cards, max, version) {
    var bytes = [], n, gs;
    for (n = max; n >= 1; n--) {
      gs = groups(cards.filter(function (c) { return c.count === n; }));
      bytes = bytes.concat(varint(gs.length));
      gs.forEach(function (g) {
        bytes = bytes.concat(varint(g.nums.length), [g.set, g.variant]);
        g.nums.forEach(function (num) { bytes = bytes.concat(version >= 4 ? numBytes(num, true, true) : varint(parseInt(num, 10))); });
      });
    }
    return bytes;
  }
  function encSparse(cards, flagged) {
    var counts = [], bytes;
    cards.forEach(function (c) { if (counts.indexOf(c.count) < 0) { counts.push(c.count); } });
    counts.sort(function (a, b) { return b - a; });
    bytes = varint(counts.length);
    counts.forEach(function (n) {
      var gs = groups(cards.filter(function (c) { return c.count === n; }));
      bytes = bytes.concat(varint(n), varint(gs.length));
      gs.forEach(function (g) {
        bytes = bytes.concat(varint(g.nums.length), [g.set, g.variant]);
        g.nums.forEach(function (num) { bytes = bytes.concat(numBytes(num, flagged, false)); });
      });
    });
    return bytes;
  }
  function refBytes(code, flagged) {
    var p = pcParse(code);
    return [SET_MAP[p.set], VARIANT_MAP[p.variant]].concat(numBytes(p.number, flagged, false));
  }
  // main and side are [{code, count}]; champ and legends are codes. Returns the code string.
  function encode(main, side, champ, legends) {
    side = side || []; legends = legends || [];
    var all = main.concat(side), refs = (champ ? [champ] : []).concat(legends);
    all.forEach(function (c) { if (!(c.count >= 1) || c.count !== Math.floor(c.count)) { throw new Error("bad count"); } });
    function pre(code, p) { return pcParse(code).number.indexOf(p) === 0; }
    var v4 = all.some(function (c) { return pre(c.code, "R"); }) || refs.some(function (c) { return pre(c, "R"); });
    var sp = all.some(function (c) { return pre(c.code, "SP"); }) || refs.some(function (c) { return pre(c, "SP"); });
    var hi = main.some(function (c) { return c.count > 12; }) || side.some(function (c) { return c.count > 3; });
    var version = legends.length ? 6 : (hi || sp) ? 5 : v4 ? 4 : 3;
    var flagged = v4 || sp;
    var bytes = [(1 << 4) | version];
    if (version >= 5) { bytes.push(flagged ? 1 : 0); bytes = bytes.concat(encSparse(main, flagged), encSparse(side, flagged)); }
    else { bytes = bytes.concat(encSection(main, 12, version), encSection(side, 3, version)); }
    if (champ) { bytes = bytes.concat([1], refBytes(champ, flagged)); } else { bytes.push(0); }
    if (version >= 6) { bytes = bytes.concat(varint(legends.length)); legends.forEach(function (l) { bytes = bytes.concat(refBytes(l, flagged)); }); }
    return b32enc(bytes);
  }
  var SET_BY_ID = {}; Object.keys(SET_MAP).forEach(function (k) { SET_BY_ID[SET_MAP[k]] = k; });
  function variantOf(id, signed) {
    if (id === 2) { return signed; }
    var k = Object.keys(VARIANT_MAP).filter(function (x) { return VARIANT_MAP[x] === id && x !== "*" && x !== "s"; })[0];
    if (k === undefined) { throw new Error("unknown variant id " + id); }
    return k;
  }
  function readNum(r, flagged, v4) {
    if (flagged || v4) {
      var f = r.byte(), n = r.varint();
      if (f === 2) { return "SP" + n; }
      if (f === 1) { return "R" + (n < 10 ? "0" : "") + n; }
      if (f === 0) { return ("00" + n).slice(-3); }
      throw new Error("unknown prefix flag");
    }
    return ("00" + r.varint()).slice(-3);
  }
  function decSection(r, max, version, signed) {
    var out = [], n, g, gi, j, cnt, set, v;
    for (n = max; n >= 1; n--) {
      g = r.varint();
      for (gi = 0; gi < g; gi++) {
        cnt = r.varint(); set = SET_BY_ID[r.byte()]; v = variantOf(r.byte(), signed);
        if (!set) { throw new Error("unknown set id"); }
        for (j = 0; j < cnt; j++) { out.push({ code: set + "-" + readNum(r, false, version >= 4) + v, count: n }); }
      }
    }
    return out;
  }
  function decSparse(r, flagged, signed) {
    var out = [], nc = r.varint(), i, n, g, gi, j, cnt, set, v;
    for (i = 0; i < nc; i++) {
      n = r.varint(); g = r.varint();
      for (gi = 0; gi < g; gi++) {
        cnt = r.varint(); set = SET_BY_ID[r.byte()]; v = variantOf(r.byte(), signed);
        if (!set) { throw new Error("unknown set id"); }
        for (j = 0; j < cnt; j++) { out.push({ code: set + "-" + readNum(r, flagged, false) + v, count: n }); }
      }
    }
    return out;
  }
  function readRef(r, flagged, signed) {
    var set = SET_BY_ID[r.byte()], v = variantOf(r.byte(), signed);
    if (!set) { throw new Error("unknown set id"); }
    return set + "-" + readNum(r, flagged, false) + v;
  }
  // Returns {main, side, champ, legends} (champ "" when none; legends null below v6), or null
  // when the string is not a deck code. signed is the suffix a signed card gets: "*" in RAVI.
  function decode(code, signed) {
    signed = signed || "*";
    try {
      var r = new Reader(b32dec(String(code).trim())), fv = r.byte(), format = fv >> 4, version = fv & 15;
      if (format !== 1 || version < 1 || version > 6) { return null; }
      var flagged = version >= 4, main, side = [], champ = "", legends = null;
      if (version >= 5) {
        var pf = r.byte(); if (pf > 1) { return null; }
        flagged = pf === 1;
        main = decSparse(r, flagged, signed); side = decSparse(r, flagged, signed);
      } else {
        main = decSection(r, 12, version, signed);
        if (version >= 2) { side = decSection(r, 3, version, signed); }
      }
      if (version >= 3) { if (r.byte() === 1) { champ = readRef(r, flagged, signed); } }
      if (version >= 6) { var nl = r.varint(), i; legends = []; for (i = 0; i < nl; i++) { legends.push(readRef(r, flagged, signed)); } }
      return { main: main, side: side, champ: champ, legends: legends };
    } catch (e) { return null; }
  }

  // ---- COPYING A DECK OUT ----
  // EVENT TEXT: Piltover Archive's headed layout, which the Event Locator takes. One line per
  // name ("3 Seal of Rage"); the Champion has its own section and the Main deck lists the other
  // 39. Lines run most copies first, then by name. An empty section is left out.
  function byName(I, m) {
    var t = {}, order = [];
    keys(m).forEach(function (code) { var f = full(I, card(I, code)) || code; if (!t[f]) { t[f] = 0; order.push(f); } t[f] += m[code]; });
    return order.sort(function (a, b) { return (t[b] - t[a]) || a.localeCompare(b); }).map(function (f) { return t[f] + " " + f; });
  }
  function toText(I, deck) {
    var out = [], main = {}, k;
    for (k in deck.main) { if (deck.main.hasOwnProperty(k)) { main[k] = deck.main[k]; } }
    if (deck.champ && main[deck.champ]) { main[deck.champ] -= 1; }
    function sec(h, lines) { if (lines.length) { out.push(h + ":\n" + lines.join("\n")); } }
    sec("Legend", deck.legend ? ["1 " + full(I, card(I, deck.legend))] : []);
    sec("Champion", deck.champ ? ["1 " + full(I, card(I, deck.champ))] : []);
    sec("MainDeck", byName(I, main));
    sec("Battlefields", deck.bf.map(function (c) { return "1 " + full(I, card(I, c)); }));
    sec("Runes", byName(I, deck.runes));
    sec("Sideboard", byName(I, deck.side));
    return out.join("\n\n");
  }
  function flat(m) { return keys(m).map(function (c) { return { code: c, count: m[c] }; }); }
  // DECK CODE: the legend, the Main deck, the battlefields and the runes ride in one list, as
  // Piltover Archive writes them; the Chosen Champion and any extra legends (Neeko) after.
  // Returns "" when a card has no place in the format.
  function toCode(I, deck) {
    var main = flat(deck.main).concat(flat(deck.runes));
    if (deck.legend) { main.unshift({ code: deck.legend, count: 1 }); }
    deck.bf.forEach(function (c) { main.push({ code: c, count: 1 }); });
    var merged = {}, list = [];
    main.forEach(function (c) { if (merged[c.code]) { merged[c.code].count += c.count; } else { merged[c.code] = { code: c.code, count: c.count }; list.push(merged[c.code]); } });
    try { return encode(list, flat(deck.side), deck.champ || "", deck.extra || []); } catch (e) { return ""; }
  }
  // TTS CODE: one SET-NUMBER-ART token per copy: the legend, the Champion, the Main deck, the
  // battlefields, then the runes. Art 1 is the base card, 2 any other printing. Tabletop
  // Simulator's tables read plain numbers only, so a rune or special card numbered R or SP is
  // written as the same card's plain-numbered printing (its art differs, its card does not).
  function ttsTok(I, code) {
    var p = parts(code), x = card(I, code);
    if (p && (p.pre === "R" || p.pre === "SP") && x) {
      var alt = (I.names[norm(full(I, x))] || []).filter(function (y) { var q = parts(codeOf(y.c)); return q && !q.pre; })[0];
      if (alt) { p = parts(codeOf(alt.c)); }
    }
    if (!p || p.pre) { return ""; }
    return p.set + "-" + p.num + "-" + (p.v ? 2 : 1);
  }
  function toTTS(I, deck) {
    var out = [], main = {}, k;
    for (k in deck.main) { if (deck.main.hasOwnProperty(k)) { main[k] = deck.main[k]; } }
    function put(code, n) { var t = ttsTok(I, code), i; if (!t) { return; } for (i = 0; i < n; i++) { out.push(t); } }
    if (deck.legend) { put(deck.legend, 1); }
    if (deck.champ && main[deck.champ]) { put(deck.champ, 1); main[deck.champ] -= 1; }
    keys(main).forEach(function (c) { put(c, main[c]); });
    deck.bf.forEach(function (c) { put(c, 1); });
    keys(deck.runes).forEach(function (c) { put(c, deck.runes[c]); });
    return out.join(" ");
  }

  // ---- PASTING A DECK IN ----
  // fromCode(I, code-from-another-site): a card code as the other site wrote it, or null.
  function findCode(I, raw) {
    var s = String(raw || "").trim().toUpperCase().replace(/S$/, "*");
    if (I.by[s]) { return s; }
    var m = /^([A-Z]+)-(R|SP|T)?0*(\d+)([A-Z*]?)$/.exec(s);
    if (!m) { return null; }
    var v = (m[4] || "").toLowerCase().replace("s", "*"), pre = m[2] || "";
    var num = pre === "R" ? ("0" + m[3]).slice(-2) : (pre === "SP" ? m[3] : ("00" + m[3]).slice(-3));
    var c = m[1] + "-" + pre + num + v;
    return I.by[c] ? c : null;
  }
  function findName(I, raw) {
    var s = String(raw || ""), at = null;
    var m = /^(.*?)\s*\(([A-Za-z]+)\)\s*([A-Za-z0-9*]+)\s*$/.exec(s);
    if (m) { at = findCode(I, m[2] + "-" + m[3]); s = m[1]; }
    if (at) { return at; }
    var hit = I.names[norm(s)];
    return hit && hit.length ? codeOf(hit[0].c) : null;
  }
  var HEADS = {
    "legend": "legend", "legends": "legend", "champion": "champ", "champions": "champ", "chosen champion": "champ",
    "maindeck": "main", "main deck": "main", "main": "main", "deck": "main", "mainboard": "main",
    "battlefield": "bf", "battlefields": "bf", "rune": "runes", "runes": "runes", "rune deck": "runes",
    "sideboard": "side", "side deck": "side", "side": "side",
    "considering": "maybe", "maybeboard": "maybe", "maybe": "maybe", "the bench": "maybe", "bench": "maybe"
  };
  function head(line) {
    var k = norm(line.replace(/\(\d+\)\s*$/, "").replace(/:\s*$/, ""));
    return HEADS.hasOwnProperty(k) && /^[A-Za-z ]+:?\s*(\(\d+\))?\s*$/.test(line.trim()) ? HEADS[k] : "";
  }
  function qtyLine(line) {
    var m = /^\s*(\d+)\s*[xX*]?\s+(.+?)\s*$/.exec(line);
    if (m) { return { n: +m[1], s: m[2] }; }
    m = /^\s*(\d+)\s*[xX]\s*(\S.*?)\s*$/.exec(line);
    if (m) { return { n: +m[1], s: m[2] }; }
    return { n: 1, s: line.trim() };
  }
  // Puts a card into a fresh deck by its type, the way a list with no headings is read.
  function place(I, deck, code, n, sec) {
    var x = card(I, code), s = sectionOf(x);
    if (!s) { return false; }
    if (sec === "champ") { if (!isChampUnit(x)) { sec = "main"; } else { deck.main[code] = (deck.main[code] || 0) + n; deck.champ = code; return true; } }
    if (s === "legend") { if (!deck.legend) { deck.legend = code; } else if (deck.legend !== code && deck.extra.indexOf(code) < 0) { deck.extra.push(code); } return true; }
    if (s === "runes") { deck.runes[code] = (deck.runes[code] || 0) + n; return true; }
    if (s === "bf") { var i; for (i = 0; i < n; i++) { if (deck.bf.indexOf(code) < 0) { deck.bf.push(code); } } return true; }
    var into = (sec === "side" || sec === "maybe") ? sec : "main";
    deck[into][code] = (deck[into][code] || 0) + n;
    return true;
  }
  // With no Champion named, the first Main deck card that can be one is it: lists without
  // headings, TTS and code lines all write the Champion straight after the Legend.
  function autoChamp(I, deck, order) {
    if (deck.champ) { return; }
    var L = card(I, deck.legend), tag = L ? legendChamp(I, L) : "", i, x;
    for (i = 0; i < order.length; i++) {
      x = card(I, order[i]);
      if (deck.main[order[i]] && isChampUnit(x) && (!tag || (x.g || []).indexOf(tag) > -1)) { deck.champ = order[i]; return; }
    }
  }
  function b64(s) {
    try {
      if (typeof atob === "function") { return atob(s); }
      return Buffer.from(s, "base64").toString("binary");
    } catch (e) { return ""; }
  }
  var TTS_TOK = /^([A-Za-z0-9]+)-(\d+[a-z]?)-(\d+)$/;
  function ttsCode(I, tok) {
    var m = TTS_TOK.exec(tok);
    if (!m) { return null; }
    var base = m[1].toUpperCase() + "-" + m[2];
    if (+m[3] > 1) { var alt = findCode(I, base + "a"); if (alt) { return alt; } }
    return findCode(I, base);
  }
  // parse(I, text) -> {deck, fmt, miss:[lines it could not place]} or null when nothing in it
  // reads as a deck. fmt names the format found, in words.
  function parse(I, text) {
    var t = String(text || "").replace(/\r\n?/g, "\n").trim(), deck = empty(), miss = [], order = [], fmt = "";
    if (!t) { return null; }
    var one = t.replace(/\s+/g, "");
    // Pixelborn: Base64 of TTS tokens joined by '$'
    if (/^[A-Za-z0-9+\/]+=*$/.test(one) && one.length >= 16 && /[a-z0-9+\/=]/.test(one)) {
      var px = b64(one);
      if (px && px.indexOf("$") > -1 && px.split("$").every(function (s) { return TTS_TOK.test(s); })) {
        px.split("$").forEach(function (tok) { var c = ttsCode(I, tok); if (c && place(I, deck, c, 1, "")) { order.push(c); } else { miss.push(tok); } });
        fmt = "Pixelborn code";
      }
    }
    // the deck code
    if (!fmt && /^[A-Za-z2-7]+$/.test(one) && one.length >= 8) {
      var d = decode(one, "*");
      if (d) {
        fmt = "Deck code";
        d.main.forEach(function (c) { var code = findCode(I, c.code); if (code && place(I, deck, code, c.count, "")) { order.push(code); } else { miss.push(c.count + " " + c.code); } });
        d.side.forEach(function (c) { var code = findCode(I, c.code); if (code && place(I, deck, code, c.count, "side")) { return; } miss.push(c.count + " " + c.code + " (sideboard)"); });
        (d.legends || []).forEach(function (c) { var code = findCode(I, c); if (code && deck.extra.indexOf(code) < 0) { deck.extra.push(code); } else if (!code) { miss.push(c + " (legend)"); } });
        if (d.champ) { var cc = findCode(I, d.champ); if (cc && isChampUnit(card(I, cc))) { if (!deck.main[cc]) { deck.main[cc] = 1; } deck.champ = cc; } else { miss.push(d.champ + " (champion)"); } }
      }
    }
    var toks = t.split(/\s+/).map(function (s) { return s.replace(/[,;]$/, ""); }).filter(Boolean);
    if (!fmt && toks.length > 1 && toks.every(function (s) { return TTS_TOK.test(s); })) {
      fmt = "Tabletop Simulator code";
      toks.forEach(function (tok) { var c = ttsCode(I, tok); if (c && place(I, deck, c, 1, "")) { order.push(c); } else { miss.push(tok); } });
    }
    if (!fmt) {
      var lines = t.split("\n"), headed = lines.some(function (l) { return !!head(l); });
      var codeLines = lines.filter(function (l) { return l.trim(); }).every(function (l) { return /^\s*\d+\s*[xX]?\s*[A-Za-z]+-[A-Za-z0-9]+[a-z*]?\s*$/.test(l); });
      fmt = headed ? "Text with headings" : (codeLines ? "Code lines" : "Text");
      var sec = headed ? "main" : "", seen = false;
      lines.forEach(function (l) {
        if (!l.trim()) { return; }
        var h = head(l);
        if (h) { sec = h; seen = true; return; }
        if (headed && !seen) { return; }        // a deck name or a title line above the first heading
        var q = qtyLine(l), code = codeLines ? findCode(I, q.s) : findName(I, q.s);
        if (!code) { miss.push(l.trim()); return; }
        var x = card(I, code);
        if (sec === "legend" && x.t !== "legend") { miss.push(l.trim()); return; }
        if (place(I, deck, code, q.n, sec)) { order.push(code); } else { miss.push(l.trim()); }
      });
    }
    autoChamp(I, deck, order);
    var got = deck.legend || keys(deck.main).length || keys(deck.runes).length || deck.bf.length || keys(deck.side).length;
    if (!got) { return null; }
    return { deck: deck, fmt: fmt, miss: miss };
  }

  // ---- STATS (the Main deck, Chosen Champion included) ----
  var KW = /\[([A-Za-z][A-Za-z' -]*?)(?:\s+\d+)?\]/g;
  function keywordsOf(x) {
    var s = {}, m, k;
    KW.lastIndex = 0;
    while ((m = KW.exec((x && x.q) || ""))) {
      k = m[1].trim();
      if (!/^[A-Za-z][A-Za-z' -]*$/.test(k) || /^no text$/i.test(k)) { continue; }
      k = k.split(/(-| )/).map(function (w) { return /^[a-z]/i.test(w) ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w; }).join("");
      s[k] = 1;
    }
    return Object.keys(s);
  }
  function stats(I, deck) {
    var S = { cards: 0, units: 0, energy: [], power: [], might: [], types: {}, keywords: {}, eSum: 0, eN: 0, pSum: 0, pN: 0, mSum: 0, mN: 0 };
    var i;
    for (i = 0; i <= 9; i++) { S.energy.push({ n: 0, d: {} }); }
    for (i = 0; i <= 4; i++) { S.power.push({ n: 0, d: {} }); }
    for (i = 0; i <= 12; i++) { S.might.push({ n: 0, d: {} }); }
    function bump(arr, v, n, x) {
      var b = arr[Math.min(v, arr.length - 1)];
      b.n += n;
      var d = (x.d || []).filter(function (y) { return y !== "colorless"; });
      var key = d.length ? d.join("+") : "colorless";
      b.d[key] = (b.d[key] || 0) + n;
    }
    keys(deck.main).forEach(function (code) {
      var x = card(I, code), n = deck.main[code];
      if (!x) { return; }
      S.cards += n;
      var ty = x.t || "other";
      S.types[ty] = (S.types[ty] || 0) + n;
      if (typeof x.e === "number") { bump(S.energy, x.e, n, x); S.eSum += x.e * n; S.eN += n; }
      var w = typeof x.w === "number" ? x.w : 0;
      bump(S.power, w, n, x); S.pSum += w * n; S.pN += n;
      if (x.t === "unit") { S.units += n; if (typeof x.p === "number") { bump(S.might, x.p, n, x); S.mSum += x.p * n; S.mN += n; } }
      keywordsOf(x).forEach(function (k) {
        var e = S.keywords[k] = S.keywords[k] || { n: 0, by: {} };
        e.n += n; e.by[ty] = (e.by[ty] || 0) + n;
      });
    });
    S.avgEnergy = S.eN ? S.eSum / S.eN : 0;
    S.avgPower = S.pN ? S.pSum / S.pN : 0;
    S.avgMight = S.mN ? S.mSum / S.mN : 0;
    return S;
  }

  // ---- A SAMPLE OPENING HAND (Core Rules 116 and 117) ----
  // The Chosen Champion starts in the Champion Zone, so one copy stays out of the shuffle. The
  // hand is 4; a mulligan sets aside up to 2, draws as many, then recycles the ones set aside.
  // rnd is a function returning [0, 1), so a test can make the shuffle repeatable.
  function library(deck) {
    var lib = [], k, i;
    for (k in deck.main) {
      if (!deck.main.hasOwnProperty(k)) { continue; }
      var n = deck.main[k] - (k === deck.champ ? 1 : 0);
      for (i = 0; i < n; i++) { lib.push(k); }
    }
    return lib;
  }
  function shuffle(a, rnd) {
    var i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function deal(deck, rnd) {
    var lib = shuffle(library(deck), rnd || Math.random);
    return { hand: lib.slice(0, 4), lib: lib.slice(4), mull: false };
  }
  // keep: the hand's positions to keep; the rest (at most 2) go to the bottom
  function mulligan(state, out) {
    if (state.mull || (state.drawn || []).length) { return state; }
    out = (out || []).filter(function (p, i, a) { return a.indexOf(p) === i && p >= 0 && p < state.hand.length; }).slice(0, 2);
    var keep = state.hand.filter(function (c, i) { return out.indexOf(i) < 0; });
    var aside = state.hand.filter(function (c, i) { return out.indexOf(i) > -1; });
    var drawn = state.lib.slice(0, aside.length);
    return { hand: keep.concat(drawn), lib: state.lib.slice(aside.length).concat(aside), mull: true };
  }
  // ---- THE TURNS AFTER IT (refinement, 2026-10-18) ----
  // Riot's draws: 4 to open (Core Rules 116), then 1 in each Draw Phase (315.4.b); in a 1v1
  // game the first player draws on turn 1 too (Riot's ruling). So by turn N a player has seen
  // 4 + N cards, whichever player goes first. A draw ends the chance to mulligan.
  function draw(state) {
    if (!state.lib.length) { return state; }
    return { hand: state.hand, lib: state.lib.slice(1), mull: state.mull, drawn: (state.drawn || []).concat([state.lib[0]]) };
  }
  // the chance of at least one of codes among the first seen cards of the library (the
  // hypergeometric chance; the Chosen Champion's own copy is not in the library).
  // codes may instead be a list of lists: then the chance of at least one card from EVERY
  // list (one card AND another), by inclusion and exclusion over the lists.
  // A mulligan of m cards that are not wanted sets them aside to the bottom and draws m, so
  // with it the cards seen by turn t are 4 + m + t: the caller passes seen accordingly.
  function missAll(L, k, n) {
    var i, p = 1;
    for (i = 0; i < n; i++) { p *= Math.max(0, L - k - i) / (L - i); }
    return p;
  }
  function odds(deck, codes, seen) {
    var lib = library(deck), L = lib.length;
    var groups = (codes.length && Array.isArray(codes[0])) ? codes : [codes];
    groups = groups.filter(function (g) { return g && g.length; });
    if (!groups.length || !L) { return 0; }
    var n = Math.min(seen, L), counts = groups.map(function (g) { var k = 0; lib.forEach(function (c) { if (g.indexOf(c) > -1) { k++; } }); return k; });
    if (counts.some(function (k) { return !k; })) { return 0; }
    // P(every group hit) = sum over subsets S of the groups of (-1)^|S| P(no card of S seen)
    var total = 0, G = groups.length, mask, s;
    for (mask = 0; mask < (1 << G); mask++) {
      var k = 0, bits = 0, seenCodes = {};
      for (s = 0; s < G; s++) {
        if (mask & (1 << s)) {
          bits++;
          groups[s].forEach(function (c) { seenCodes[c] = 1; });
        }
      }
      lib.forEach(function (c) { if (seenCodes[c]) { k++; } });
      total += (bits % 2 ? -1 : 1) * missAll(L, k, n);
    }
    return Math.max(0, Math.min(1, total));
  }

  // ---- RUNES ARE ALWAYS 12 (round 6, Mako 2026-10-22) ----
  // A Legend's two domains split the 12: picking a Legend fills 6 and 6 (12 of one for a
  // one-domain Legend) unless the deck's runes already fit it. A plus on one domain takes one
  // from the other once there are 12; a minus gives it to the other.
  function baseRuneOf(I, dm) {
    var best = null;
    I.list.forEach(function (x) { if (x.t === "rune" && (x.d || [])[0] === dm && (!best || rank(x) < rank(best))) { best = x; } });
    return best ? codeOf(best.c) : "";
  }
  function legendDomains(I, deck) {
    var L = card(I, deck.legend);
    return ((L && L.d) || []).filter(function (d) { return d !== "colorless"; });
  }
  function fitRunes(I, deck) {
    var ds = legendDomains(I, deck);
    if (!ds.length) { return false; }
    var fits = sum(deck.runes) > 0 && keys(deck.runes).every(function (c) { var x = card(I, c); return x && ds.indexOf((x.d || [])[0]) > -1; });
    if (fits) { return false; }
    deck.runes = {};
    if (ds.length === 1) { deck.runes[baseRuneOf(I, ds[0])] = 12; }
    else { deck.runes[baseRuneOf(I, ds[0])] = 6; deck.runes[baseRuneOf(I, ds[1])] = 6; }
    return true;
  }
  // dir +1 or -1 on one rune card; returns true when something changed
  function runeStep(I, deck, code, dir) {
    var x = card(I, code), dm = x && (x.d || [])[0], ds = legendDomains(I, deck);
    var other = ds.filter(function (d) { return d !== dm; })[0];
    function biggest(d) { var best = ""; keys(deck.runes).forEach(function (c) { var y = card(I, c); if (y && (y.d || [])[0] === d && (!best || deck.runes[c] > deck.runes[best])) { best = c; } }); return best; }
    var total = sum(deck.runes);
    if (dir > 0) {
      if (total < 12) { deck.runes[code] = (deck.runes[code] || 0) + 1; return true; }
      var from = other ? biggest(other) : "";
      if (!from) { return false; }
      deck.runes[from] -= 1; if (!deck.runes[from]) { delete deck.runes[from]; }
      deck.runes[code] = (deck.runes[code] || 0) + 1;
      return true;
    }
    if (!deck.runes[code]) { return false; }
    deck.runes[code] -= 1; if (!deck.runes[code]) { delete deck.runes[code]; }
    if (other && sum(deck.runes) < 12) { var to = biggest(other) || baseRuneOf(I, other); deck.runes[to] = (deck.runes[to] || 0) + 1; }
    return true;
  }

  // ---- UNDO ONE CHANGE, WHENEVER IT WAS (round 5, Mako 2026-10-21) ----
  // prev and next are the deck just before and just after one change; cur is the deck now,
  // perhaps with later changes on top. unchange() takes back only what that change did:
  // counts by their difference (never below 0), and the Legend, Chosen Champion, battlefields
  // and priced printings only where they still hold what the change set. Later changes stay.
  function unchange(cur, prev, next) {
    if (cur.legend === next.legend && prev.legend !== next.legend) { cur.legend = prev.legend; }
    ["main", "side", "maybe", "runes"].forEach(function (s) {
      var a = prev[s] || {}, b = next[s] || {}, all = {};
      Object.keys(a).concat(Object.keys(b)).forEach(function (k) { all[k] = 1; });
      cur[s] = cur[s] || {};
      Object.keys(all).forEach(function (c) {
        var dn = (b[c] || 0) - (a[c] || 0);
        if (!dn) { return; }
        var n = Math.max(0, (cur[s][c] || 0) - dn);
        if (n) { cur[s][c] = n; } else { delete cur[s][c]; }
      });
    });
    var pb = prev.bf || [], nb = next.bf || [];
    nb.forEach(function (c) { if (pb.indexOf(c) < 0) { cur.bf = cur.bf.filter(function (x) { return x !== c; }); } });
    pb.forEach(function (c) { if (nb.indexOf(c) < 0 && cur.bf.indexOf(c) < 0 && cur.bf.length < 3) { cur.bf.push(c); } });
    if (cur.champ === next.champ && prev.champ !== next.champ) { cur.champ = prev.champ; }
    var pv = prev.ver || {}, nv = next.ver || {}, vk = {};
    Object.keys(pv).concat(Object.keys(nv)).forEach(function (k) { vk[k] = 1; });
    Object.keys(vk).forEach(function (c) {
      if (pv[c] === nv[c]) { return; }
      cur.ver = cur.ver || {};
      if (cur.ver[c] === nv[c]) { if (pv[c]) { cur.ver[c] = pv[c]; } else { delete cur.ver[c]; } }
    });
    if (cur.champ && !(cur.main || {})[cur.champ]) { cur.champ = ""; }
    return cur;
  }

  // ---- THE TOKENS A DECK MAKES: card text that plays a 'Name unit token' or 'Name gear token' ----
  function tokens(I, deck) {
    var out = {}, order = [];
    keys(deck.main).concat(keys(deck.side)).forEach(function (code) {
      var x = card(I, code);
      if (!x) { return; }
      var q = String(x.q || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "), re = /([A-Z][\w']*(?: [A-Z][\w']*)*) (unit|gear) tokens?/g, m;
      while ((m = re.exec(q))) {
        var nm = m[1].replace(/^(?:Play|Create|Make|A|An|Your|Each|That|Those|The|Two|Three)\s+/, "");
        if (!nm || /^(?:A|An|Your|Each)$/.test(nm)) { continue; }
        if (!out[nm]) { out[nm] = { name: nm, kind: m[2], by: [], code: "" }; order.push(nm); }
        if (out[nm].by.indexOf(code) < 0) { out[nm].by.push(code); }
      }
    });
    // the token's own card, where Riot lists one (Gold, Recruit, Sprite, Bird, Reflection)
    order.forEach(function (nm) {
      var best = null;
      I.list.forEach(function (x) { if (isToken(x) && (x.n === nm || x.n.indexOf(nm + " (") === 0) && (!best || codeOf(x.c) < codeOf(best.c))) { best = x; } });
      if (best) { out[nm].code = codeOf(best.c); }
    });
    return order.map(function (nm) { return out[nm]; });
  }

  // ---- THE CARDS AN EVENT NEEDS: 40 main, 12 runes, 1 legend, 3 battlefields (56; the
  // sideboard is extra) ----
  function needed(deck) {
    var have = Math.min(sum(deck.main), 40) + Math.min(sum(deck.runes), 12) + (deck.legend ? 1 : 0) + Math.min((deck.bf || []).length, 3);
    return { have: have, need: 56 };
  }

  // ---- PRINTINGS AND FINISHES FROM THE PRICE FEED (refinement round 2, 2026-10-19) ----
  // Riot's gallery lists only base and showcase printings; TCGplayer's list (data/prices.json)
  // has every printing: each set's base, promos (Top 8, Champion, Organized Play), Normal and
  // Foil. A version is one product and one finish, priced on its own; the card's picture and
  // its deck code stay Riot's.
  function pkey(n) { return norm(String(n || "").replace(/\s*\([^)]*\)\s*$/, "").replace(/\s+-\s+/g, ", ")); }
  function priceIndex(P) {
    var sets = {}, order = {}, byName = {}, bySetNum = {}, byId = {};
    (P && P.sets || []).forEach(function (s, i) { sets[s.g] = s; order[s.g] = Date.parse(s.p) || i; });
    (P && P.cards || []).forEach(function (c) {
      if (!c.c || !c.p) { return; }
      var s = sets[c.g]; if (!s) { return; }
      byId[c.i] = c;
      (byName[pkey(c.n)] = byName[pkey(c.n)] || []).push(c);
      var k = s.a + "-" + String(c.c).split("/")[0];
      (bySetNum[k] = bySetNum[k] || []).push(c);
    });
    return { sets: sets, order: order, byName: byName, bySetNum: bySetNum, byId: byId };
  }
  // every version of a card, the base printing's own first: [{id, fin, price, set, setName, label}]
  function versionsOf(I, PX, x) {
    if (!PX || !x) { return []; }
    var found = {}, list = [];
    function take(c) { if (c && !found[c.i]) { found[c.i] = 1; list.push(c); } }
    (PX.byName[pkey(full(I, x))] || []).forEach(take);
    (PX.byName[pkey(x.n)] || []).forEach(function (c) { if (x.t !== "legend" || pkey(c.n) === pkey(full(I, x))) { take(c); } });
    // and every product sharing a set and number with any of this card's Riot printings
    (I.names[norm(full(I, x))] || []).forEach(function (y) {
      if (full(I, y) !== full(I, x)) { return; }
      var p = parts(codeOf(y.c)); if (!p) { return; }
      (PX.bySetNum[p.set + "-" + p.pre + p.num + p.v] || []).forEach(take);
    });
    var own = parts(codeOf(x.c)) || {}, ownKey = own.set + "-" + (own.pre || "") + own.num + (own.v || "");
    var out = [];
    list.forEach(function (c) {
      var s = PX.sets[c.g], m = /\(([^)]*)\)\s*$/.exec(c.n), note = m ? m[1] : "";
      Object.keys(c.p).forEach(function (fin) {
        out.push({ id: c.i, fin: fin, price: c.p[fin], set: s.a, setName: s.n, rarity: c.r || "", note: note, num: String(c.c).split("/")[0],
          own: (s.a + "-" + String(c.c).split("/")[0]) === ownKey, t: PX.order[c.g] || 0 });
      });
    });
    out.sort(function (a, b) {
      return (b.own - a.own) || (a.t - b.t) || (a.id - b.id) || ((a.fin === "Normal" ? 0 : 1) - (b.fin === "Normal" ? 0 : 1));
    });
    return out;
  }
  // ONE LIST OF PRINTINGS (round 3, 2026-10-20): Riot's printings and the price feed's merged
  // by set and number, so each printing shows once, with its own picture and its finishes.
  // Rows: { code: Riot's code or "" (a printing Riot's gallery does not show), pic: the code
  // whose picture to show, own: true when the picture is this printing's, set, setName, num,
  // kind: Base, Alternate art, Overnumbered, Signature, Special, Promo, Top 8, ..., fins:
  // [{ id, fin, price }] }
  var KIND_WORDS = /^(Alternate Art|Overnumbered|Signature|Top 8|Champion|Showcase)$/i;
  function kindOf(x, note, rarity) {
    var p = parts(codeOf(x ? x.c : "")) || {};
    if (note && KIND_WORDS.test(note)) { return note.replace(/^Alternate Art$/i, "Alt art"); }
    if (p.v === "a" || p.v === "b") { return "Alt art"; }
    if (p.v === "*") { return "Signature"; }
    if (p.pre === "SP") { return "Special"; }
    if (x && x.r === "showcase") {
      var tot = /\/(\d+)$/.exec(x.c || ""); if (tot && +p.num > +tot[1]) { return "Overnumbered"; }
      return "Showcase";
    }
    if (/promo/i.test(rarity || "")) { return note && !/^R\d|^\d/.test(note) ? note : "Promo"; }
    return "Base";
  }
  // a printing only the price feed lists: its kind from its name's note, its rarity and number
  function tcgKind(v, s) {
    var note = v.note || "", codeLike = /^[A-Z]{0,3}\d/.test(note);
    if (note && KIND_WORDS.test(note)) { return note.replace(/^Alternate Art$/i, "Alt art"); }
    if (/promo/i.test(v.rarity) || /promo/i.test(s.n)) { return "Promo" + (note && !codeLike ? ", " + note : ""); }
    if (/a$/.test(v.num)) { return "Alt art"; }
    if (/showcase/i.test(v.rarity)) { return "Showcase"; }
    return "Base";
  }
  function printingsOf(I, PX, x, setNames) {
    if (!x) { return []; }
    var name = full(I, x), seen = {}, riot = (I.names[norm(name)] || []).filter(function (y) {
      // the name index holds a card under more than one name: keep each printing once
      var c = codeOf(y.c); if (seen[c] || full(I, y) !== name || isToken(y)) { return false; } seen[c] = 1; return true;
    });
    var base = riot.slice().sort(function (a, b) { return rank(a) - rank(b); })[0] || x;
    var rows = [], taken = {};
    riot.forEach(function (y) {
      var code = codeOf(y.c), p = parts(code) || {}, prods = PX ? (PX.bySetNum[code] || []) : [];
      var fins = [];
      prods.forEach(function (c) { taken[c.i] = 1; Object.keys(c.p).forEach(function (f) { fins.push({ id: c.i, fin: f, price: c.p[f] }); }); });
      var m = prods[0] ? /\(([^)]*)\)\s*$/.exec(prods[0].n) : null;
      rows.push({ code: code, pic: code, own: true, set: p.set, setName: (setNames && setNames[p.set]) || p.set, num: (p.pre || "") + p.num + (p.v || ""),
        kind: kindOf(y, m ? m[1] : "", prods[0] ? prods[0].r : ""), fins: fins, t: SETS.indexOf(p.set) * 1000 + (p.v || p.pre ? 500 : 0) + (+p.num || 0) });
    });
    if (PX) {
      versionsOf(I, PX, x).forEach(function (v) {
        if (taken[v.id]) { return; }
        var row = null;
        rows.forEach(function (r) { if (!r.code && r.id === v.id) { row = r; } });
        if (!row) {
          var s = PX.sets[PX.byId[v.id].g];
          row = { code: "", id: v.id, pic: codeOf(base.c), own: false, set: s.a, setName: s.n.replace(/^Riftbound\s+/, "").replace(/\s+Cards$/, "").replace(/\s+Promotional$/, ""),
            num: v.num, kind: tcgKind(v, s), fins: [], t: 100000 + v.t / 1e6 + v.id / 1e9 };
          rows.push(row);
        }
        row.fins.push({ id: v.id, fin: v.fin, price: v.price });
      });
    }
    rows.forEach(function (r) { r.fins.sort(function (a, b) { return (a.fin === "Normal" ? 0 : 1) - (b.fin === "Normal" ? 0 : 1); }); });
    rows.sort(function (a, b) { return a.t - b.t; });
    return rows;
  }
  function verLabel(v) {
    var w = v.setName.replace(/^Riftbound\s+/, "").replace(/\s+Cards$/, "");
    var bits = [v.note || v.rarity].filter(Boolean);
    return w + (bits.length ? ", " + bits.join(", ") : "");
  }
  // how the Main deck splits between the Legend's two domains: a card of both counts for both
  function share(I, deck) {
    var L = card(I, deck.legend), ds = ((L && L.d) || []).filter(function (v) { return v !== "colorless"; });
    var o = { a: ds[0] || "", b: ds[1] || "", na: 0, nb: 0, s: 0.5 };
    keys(deck.main).forEach(function (c) {
      var x = card(I, c), n = deck.main[c];
      if (!x) { return; }
      if (o.a && (x.d || []).indexOf(o.a) > -1) { o.na += n; }
      if (o.b && (x.d || []).indexOf(o.b) > -1) { o.nb += n; }
    });
    if (o.na + o.nb) { o.s = o.na / (o.na + o.nb); }
    return o;
  }
  // a deck found by a search: every word in its name, its Legend, its Champion or any card in it
  function matches(I, deck, q) {
    var w = norm(q).split(" ").filter(Boolean);
    if (!w.length) { return true; }
    var hay = [deck.name || ""], codes = [deck.legend, deck.champ].concat(keys(deck.main), keys(deck.side), keys(deck.maybe), keys(deck.runes), deck.bf || []);
    codes.forEach(function (c) { var x = card(I, c); if (x) { hay.push(full(I, x)); } });
    var h = norm(hay.join(" | "));
    return w.every(function (x) { return h.indexOf(x) > -1; });
  }

  var API = {
    DOMAINS: DOMAINS, prep: prep, codeOf: codeOf, full: full, card: card, legendChamp: legendChamp,
    sectionOf: sectionOf, isChampUnit: isChampUnit, anyNumber: anyNumber, empty: empty, sum: sum,
    add: add, take: take, setChamp: setChamp, check: check, bannedFrom: bannedFrom, isBanned: isBanned,
    encode: encode, decode: decode, toText: toText, toCode: toCode, toTTS: toTTS, parse: parse,
    findCode: findCode, findName: findName, stats: stats, keywordsOf: keywordsOf, deal: deal, mulligan: mulligan,
    draw: draw, odds: odds, share: share, matches: matches,
    tokens: tokens, needed: needed, unchange: unchange, fitRunes: fitRunes, runeStep: runeStep, baseRuneOf: baseRuneOf, priceIndex: priceIndex, versionsOf: versionsOf, verLabel: verLabel, printingsOf: printingsOf, isToken: isToken, rank: rank
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = API; }
  else { root.RAVI_DECK = API; }
})(this);
