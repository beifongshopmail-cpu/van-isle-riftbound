"use strict";

// fetch-tier.js -- the tier list's results (M17, 2026-10-28).
// Reads TopDeck.gg's tournaments API (free key, the Actions secret TOPDECK_API_KEY) for recent
// Riftbound Constructed events of 16 players or more, and writes data/tier.json for the Tier list
// page: each event's date, its size, and every placing with its legend. NOTHING ELSE IS KEPT:
// no player's name, id or decklist ever reaches the file (RULE -- Riot's policies: legends and
// decks only, never a player's results across events).
//
// Every field is rebuilt from checked values: placings whole numbers from 1 to the field size,
// the size a whole number, the date a real day. A legend counts only when TopDeck's 'leader' is
// one of the legends in cards/legends.js (Riot's own names); anything else is counted as unmatched
// and never written. The maths runs on the page (tier/tier.js), so the page can change its window
// later without a new file.
//
// FAILURE: no key, a failed read or a reply that is not a list fails the run and the last good
// file stays. A run that finds fewer than half the events the last file held also fails, so a
// half-broken reply cannot empty the page.
//
// Credit: TopDeck's API terms ask for a visible credit and link; the page's footer carries it.
//
// DECK LISTS (plan 2 M4, Mako's yes 2026-11-02): TopDeck also sends each finisher's decklist once
// an event has ended. Those lists go to a second file, data/tierlists.json, and never into
// tier.json: the top-cut lists themselves (as RAVI deck codes, with the event's date, size and the
// placing; no name, no id, so no player's results across events), and each legend's most-played
// cards across every list read (with each card's name and art, as the page loads no catalogue).
// A list is read with Decks' own importer (decks/deck.js), so it counts only when its cards are
// Riot's. TopDeck does not document Riftbound's list format, so deckObj (sections of cards) and the
// plain text are both tried, and the file says how many lists could not be read. The lists never
// fail the tier run: on trouble the last lists file stays.

const fs = require("fs");
const path = require("path");

const API = process.env.TIER_API || "https://topdeck.gg/api/v2/tournaments";
const KEY = process.env.TOPDECK_API_KEY || "";
const OUT_FILE = process.env.TIER_OUT || path.join(__dirname, "data", "tier.json");
const NOW = process.env.TIER_NOW ? new Date(process.env.TIER_NOW) : new Date();
const DAYS = 30;
const MIN_PLAYERS = 16;
const LISTS_FILE = process.env.TIER_LISTS_OUT || path.join(__dirname, "data", "tierlists.json");
const LISTS_PER_LEGEND = 15, CARDS_PER_LEGEND = 20, MIN_LISTS_FOR_CARDS = 3;
const UA = "VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)";

// ---- the legends RAVI knows ----

function loadLegends() {
  // the file is RAVI's own (written by fetch-cards.js); run it in an empty sandbox to read the list
  const src = fs.readFileSync(path.join(__dirname, "cards", "legends.js"), "utf8");
  const box = {};
  require("vm").runInNewContext(src + "\n;this.L = VIR_LEGENDS;", box, { timeout: 1000 });
  if (!Array.isArray(box.L)) { throw new Error("cards/legends.js: no legend list"); }
  return box.L.map(function (x) { return x && x.n; }).filter(function (n) { return typeof n === "string" && n; });
}

function norm(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
}

// A matcher from TopDeck's leader text to one of Riot's names, or "" when none fits for sure:
// the exact name, then the name with punctuation and case ignored, then the champion alone when
// only one legend carries it. 'A / B' (TopDeck's way of writing two leaders) tries each part.
function matcher(names) {
  const full = {}, champ = {};
  names.forEach(function (n) {
    full[norm(n)] = n;
    const c = norm(n.split(",")[0]);
    champ[c] = champ[c] === undefined ? n : "";
  });
  function one(t) {
    if (!t) { return ""; }
    const k = norm(t);
    if (full[k]) { return full[k]; }
    const c = norm(t.split(",")[0]);
    return champ[c] || "";
  }
  return function (leader) {
    if (typeof leader !== "string" || !leader || leader.length > 200) { return ""; }
    const parts = leader.split(" / ");
    for (let i = 0; i < parts.length; i++) {
      const hit = one(parts[i].trim());
      if (hit) { return hit; }
    }
    return "";
  };
}

// ---- one event, rebuilt ----

function whole(v, lo, hi) {
  return typeof v === "number" && isFinite(v) && Math.floor(v) === v && v >= lo && v <= hi;
}

function dayOf(start) {
  // TopDeck sends startDate in Unix seconds
  if (!whole(start, 1, 1e11)) { return ""; }
  const d = new Date(start * 1000);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
}

// returns { d, n, k, s: [[placing, leader text]] } or null. TopDeck lists standings in placing
// order and sends no placing field with these columns, so a row's place is its position; k is the
// top cut the event played (topCut), 0 when it stopped after Swiss.
function rebuild(t) {
  if (!t || typeof t !== "object" || !Array.isArray(t.standings)) { return null; }
  const n = t.standings.length;
  if (n < MIN_PLAYERS || n > 4096) { return null; }
  const d = dayOf(t.startDate);
  if (!d) { return null; }
  const s = [], dl = [];
  const seen = {};
  t.standings.forEach(function (p, i) {
    if (!p || typeof p !== "object") { return; }
    const r = whole(p.standing, 1, n) ? p.standing : i + 1;
    if (seen[r]) { return; }
    seen[r] = true;
    const lead = typeof p.leader === "string" ? p.leader : "";
    s.push([r, lead]);
    // the list as sent, kept only in memory for lists(); never written as it came
    if (lead && (p.deckObj || p.decklist)) { dl.push([r, lead, p.deckObj || null, typeof p.decklist === "string" ? p.decklist : ""]); }
  });
  const k = whole(t.topCut, 1, 64) && t.topCut < n ? t.topCut : 0;
  const out = { d: d, n: n, k: k, s: s };
  if (dl.length) { Object.defineProperty(out, "dl", { value: dl, enumerable: false }); }
  return out;
}

// events: rebuilt events with leader text -> the file: { legends: [names], events: [{d, n, s: [[r, i]]}] }
function build(events, names) {
  const match = matcher(names);
  const index = {}, legends = [], out = [];
  let unmatched = 0, blank = 0;
  const miss = {};
  events.forEach(function (e) {
    const s = [];
    e.s.forEach(function (p) {
      if (!p[1]) { blank++; return; }
      const nm = match(p[1]);
      if (!nm) {
        unmatched++;
        const k = p[1].replace(/[^\x20-\x7e]/g, "?").slice(0, 60);
        miss[k] = (miss[k] || 0) + 1;
        return;
      }
      if (index[nm] === undefined) { index[nm] = legends.length; legends.push(nm); }
      s.push([p[0], index[nm]]);
    });
    if (s.length) { out.push(e.k ? { d: e.d, n: e.n, k: e.k, s: s } : { d: e.d, n: e.n, s: s }); }
  });
  out.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : b.n - a.n; });
  const missing = Object.keys(miss).sort(function (a, b) { return miss[b] - miss[a]; }).slice(0, 15)
    .map(function (k) { return k + " x" + miss[k]; });
  return { legends: legends, events: out, unmatched: unmatched, blank: blank, missing: missing };
}


// ---- deck lists ----

// Decks' importer and Riot's cards, for reading lists (null when either cannot load)
function loadDecks() {
  const X = require(path.join(__dirname, "decks", "deck.js"));
  const cat = JSON.parse(fs.readFileSync(path.join(__dirname, "cards", "catalogue.json"), "utf8"));
  return { X: X, I: X.prep(cat) };
}

// TopDeck's section names to the headings Decks reads; anything else counts as the Main deck
function heading(k) {
  const t = String(k).toLowerCase();
  if (/legend/.test(t)) { return "Legend"; }
  if (/champ/.test(t)) { return "Champion"; }
  if (/battle/.test(t)) { return "Battlefields"; }
  if (/rune/.test(t)) { return "Runes"; }
  if (/side/.test(t)) { return "Sideboard"; }
  return "MainDeck";
}
function count(v) {
  if (whole(v, 1, 99)) { return v; }
  if (v && typeof v === "object") {
    const c = v.count !== undefined ? v.count : v.quantity !== undefined ? v.quantity : v.qty !== undefined ? v.qty : v.amount;
    if (whole(c, 1, 99)) { return c; }
    if (typeof c === "string" && /^\d{1,2}$/.test(c) && +c > 0) { return +c; }
  }
  return 0;
}
function clip(v) { return typeof v === "string" ? v.replace(/[\r\n]+/g, " ").slice(0, 120).trim() : ""; }
// one card as a line Decks reads: "3 Name", or "3 Name (OGN) 024" when a code came with it
function cardLine(name, v) {
  const n = count(v);
  if (!n || !name) { return ""; }
  const id = v && typeof v === "object" ? clip(v.id || v.code || v.cardId || "") : "";
  const m = /^([A-Za-z]{2,6})-?([A-Za-z]{0,2}\d{1,4}[a-z*]?)(?:\/\d+)?$/.exec(id);
  return n + " " + name + (m ? " (" + m[1] + ") " + m[2] : "");
}
// deckObj -> headed text: { Section: { name: n | { count, id } } } or { Section: [ { name, count } | "3 Name" ] }
function objText(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) { return ""; }
  const out = [];
  Object.keys(o).slice(0, 12).forEach(function (sec) {
    const v = o[sec], rows = [];
    if (Array.isArray(v)) {
      v.slice(0, 80).forEach(function (x) {
        if (typeof x === "string") { rows.push(clip(x)); return; }
        if (x && typeof x === "object") { const l = cardLine(clip(x.name || x.card || x.cardName || x.title || ""), x); if (l) { rows.push(l); } }
      });
    } else if (v && typeof v === "object") {
      Object.keys(v).slice(0, 80).forEach(function (name) {
        const x = v[name];
        const nm = clip(x && typeof x === "object" && x.name ? x.name : name);
        const l = cardLine(nm, x);
        if (l) { rows.push(l); }
      });
    }
    if (rows.length) { out.push(heading(sec) + ":\n" + rows.join("\n")); }
  });
  return out.join("\n\n");
}

// one finisher's list -> a Decks deck, or "" with why: url, none, bad, other (a different legend)
function deckOf(D, leaderName, obj, text) {
  const tries = [];
  const ot = objText(obj);
  if (ot) { tries.push(ot); }
  if (text && text.length <= 20000) {
    if (/^\s*https?:\/\//i.test(text) && !/\n/.test(text.trim())) { if (!tries.length) { return "url"; } }
    else { tries.push(text); }
  }
  if (!tries.length) { return "none"; }
  const want = D.X.findName(D.I, leaderName);
  for (let i = 0; i < tries.length; i++) {
    const p = D.X.parse(D.I, tries[i]);
    if (!p || !p.deck) { continue; }
    const d = p.deck;
    if (!d.legend && want) { d.legend = want; }
    const L = D.X.card(D.I, d.legend);
    if (!L) { continue; }
    if (D.X.full(D.I, L) !== leaderName) { return "other"; }
    if (D.X.sum(d.main) < 30 || p.miss.length > 3) { continue; }
    d.maybe = {}; d.note = ""; d.name = "";
    return d;
  }
  return "bad";
}

// the base printing's code for a card name (the one Decks shows first)
function baseCode(D, code) {
  const x = D.X.card(D.I, code);
  if (!x) { return code; }
  const k = D.X.full(D.I, x).toLowerCase().normalize("NFKD").replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ").trim();
  const all = (D.I.names[k] || []).filter(function (y) { return y.t === x.t; });
  return all.length ? D.X.codeOf(all[0].c) : code;
}

// rebuilt events (with their lists) -> the lists file's body, or null when no list could be read
function lists(events, names, D) {
  const match = matcher(names), tally = { lists: 0, read: 0, url: 0, none: 0, bad: 0, other: 0 };
  const tops = [], byLegend = {};
  events.forEach(function (e) {
    const cut = e.k || require(path.join(__dirname, "tier", "tier.js")).cutFor(e.n);
    (e.dl || []).forEach(function (row) {
      const nm = match(row[1]);
      if (!nm) { return; }
      tally.lists++;
      const d = deckOf(D, nm, row[2], row[3]);
      if (typeof d === "string") { tally[d]++; return; }
      tally.read++;
      const b = byLegend[nm] || (byLegend[nm] = { k: 0, c: {} });
      b.k++;
      const seen = {};
      Object.keys(d.main).concat(d.bf).forEach(function (code) {
        const base = baseCode(D, code), n = d.main[code] || 1;
        const c = b.c[base] || (b.c[base] = { in: 0, n: 0 });
        if (!seen[base]) { c.in++; seen[base] = true; }
        c.n += n;
      });
      if (cut && row[0] <= cut) {
        const code = D.X.toCode(D.I, d);
        if (code) { tops.push({ d: e.d, n: e.n, r: row[0], l: nm, c: code }); }
      }
    });
  });
  if (!tally.read) { return { body: null, tally: tally }; }
  tops.sort(function (a, b) { return a.r - b.r || (a.d < b.d ? 1 : a.d > b.d ? -1 : 0) || b.n - a.n; });
  const per = {}, kept = [];
  tops.forEach(function (t) { per[t.l] = (per[t.l] || 0) + 1; if (per[t.l] <= LISTS_PER_LEGEND) { kept.push(t); } });
  const cards = {};
  Object.keys(byLegend).sort().forEach(function (nm) {
    const b = byLegend[nm];
    if (b.k < MIN_LISTS_FOR_CARDS) { return; }
    // [base code, lists that run it, copies in those lists x10, as a whole number]
    const rows = Object.keys(b.c).map(function (code) { return [code, b.c[code].in, Math.round(b.c[code].n * 10 / b.c[code].in)]; })
      .filter(function (r) { return D.X.card(D.I, r[0]) && D.X.card(D.I, r[0]).t !== "legend"; });
    rows.sort(function (x, y) { return y[1] - x[1] || y[2] - x[2] || (x[0] < y[0] ? -1 : 1); });
    cards[nm] = { k: b.k, c: rows.slice(0, CARDS_PER_LEGEND) };
  });
  // each card's name and art for the Tier list, which does not load the whole catalogue
  const named = {};
  Object.keys(cards).forEach(function (nm) {
    cards[nm].c.forEach(function (r) { const x = D.X.card(D.I, r[0]); named[r[0]] = [D.X.full(D.I, x), /^[0-9a-f]{40}$/.test(x.h || "") ? x.h : ""]; });
  });
  return { body: { lists: kept, cards: cards, names: named, read: tally }, tally: tally };
}

function writeLists(evs, names, file) {
  let D;
  try { D = loadDecks(); } catch (e) { return "lists: Decks' importer did not load (" + (e && e.message) + "); the last lists file stays"; }
  const got = lists(evs, names, D), t = got.tally;
  const say = "lists: " + t.lists + " with a known legend, " + t.read + " read, " + t.url + " links only, " + t.none + " empty, " + t.bad + " not readable, " + t.other + " under another legend";
  if (!got.body) { return say + "; the last lists file stays"; }
  const out = Object.assign({ v: 1, at: file.at, days: file.days, source: file.source }, got.body);
  let same = false;
  try {
    const o = JSON.parse(fs.readFileSync(LISTS_FILE, "utf8"));
    same = JSON.stringify(o.lists) === JSON.stringify(out.lists) && JSON.stringify(o.cards) === JSON.stringify(out.cards);
  } catch (e) { same = false; }
  if (!same) { fs.writeFileSync(LISTS_FILE, JSON.stringify(out) + "\n"); }
  return say + "; " + out.lists.length + " top-cut lists kept" + (same ? ", no change" : ", file written");
}

async function read() {
  const body = { game: "Riftbound", format: "Constructed", last: DAYS, participantMin: MIN_PLAYERS,
    columns: ["wins", "draws", "losses", "decklist"] };
  const res = await fetch(API, {
    method: "POST",
    headers: { "Authorization": KEY, "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify(body)
  });
  if (!res.ok) { throw new Error("TopDeck answered " + res.status); }
  const j = await res.json();
  if (!Array.isArray(j)) { throw new Error("TopDeck's reply is not a list"); }
  return j;
}

function lastEvents() {
  try { const o = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); return Array.isArray(o.events) ? o.events.length : 0; }
  catch (e) { return 0; }
}

async function main() {
  if (!KEY) { throw new Error("no TOPDECK_API_KEY"); }
  const names = loadLegends();
  const raw = await read();
  const evs = raw.map(rebuild).filter(Boolean);
  const b = build(evs, names);
  const before = lastEvents();
  if (before >= 4 && b.events.length < before / 2) {
    throw new Error("only " + b.events.length + " events against " + before + " last time; the last file stays");
  }
  const file = { v: 1, at: NOW.toISOString().replace(/\.\d+Z$/, ".000Z"), days: DAYS, minPlayers: MIN_PLAYERS,
    source: "TopDeck.gg", legends: b.legends, events: b.events };
  // Rewritten only when the results changed, so a quiet day adds nothing to the repo; 'at' is then
  // the last time the results moved.
  let same = false;
  try {
    const o = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
    same = JSON.stringify(o.legends) === JSON.stringify(file.legends) && JSON.stringify(o.events) === JSON.stringify(file.events);
  } catch (e) { same = false; }
  if (!same) { fs.writeFileSync(OUT_FILE, JSON.stringify(file) + "\n"); }
  const line = "tier: " + raw.length + " events read, " + b.events.length + " kept, " + b.legends.length + " legends, " +
    b.unmatched + " placings with a legend RAVI does not know, " + b.blank + " with none" +
    (same ? "; no change, file left alone" : "; file written");
  console.log(line);
  const ll = writeLists(evs, names, file);
  console.log("tier: " + ll);
  if (process.env.GITHUB_STEP_SUMMARY) { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, ll + "\n"); }
  if (b.missing.length) { console.log("tier: leaders not matched (TopDeck's text): " + b.missing.join("; ")); }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + "\n" + (b.missing.length ? "\nNot matched: " + b.missing.join("; ") + "\n" : ""));
  }
}

if (require.main === module) {
  main().catch(function (e) { console.error("tier: " + (e && e.message)); process.exit(1); });
}

module.exports = { loadLegends: loadLegends, matcher: matcher, rebuild: rebuild, build: build, norm: norm,
  loadDecks: loadDecks, objText: objText, deckOf: deckOf, lists: lists, MIN_PLAYERS: MIN_PLAYERS, DAYS: DAYS };
