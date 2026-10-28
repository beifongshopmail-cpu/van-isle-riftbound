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

const fs = require("fs");
const path = require("path");

const API = process.env.TIER_API || "https://topdeck.gg/api/v2/tournaments";
const KEY = process.env.TOPDECK_API_KEY || "";
const OUT_FILE = process.env.TIER_OUT || path.join(__dirname, "data", "tier.json");
const NOW = process.env.TIER_NOW ? new Date(process.env.TIER_NOW) : new Date();
const DAYS = 30;
const MIN_PLAYERS = 16;
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
  const s = [];
  const seen = {};
  t.standings.forEach(function (p, i) {
    if (!p || typeof p !== "object") { return; }
    const r = whole(p.standing, 1, n) ? p.standing : i + 1;
    if (seen[r]) { return; }
    seen[r] = true;
    s.push([r, typeof p.leader === "string" ? p.leader : ""]);
  });
  const k = whole(t.topCut, 1, 64) && t.topCut < n ? t.topCut : 0;
  return { d: d, n: n, k: k, s: s };
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

async function read() {
  const body = { game: "Riftbound", format: "Constructed", last: DAYS, participantMin: MIN_PLAYERS,
    columns: ["wins", "draws", "losses"] };
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
  if (b.missing.length) { console.log("tier: leaders not matched (TopDeck's text): " + b.missing.join("; ")); }
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + "\n" + (b.missing.length ? "\nNot matched: " + b.missing.join("; ") + "\n" : ""));
  }
}

if (require.main === module) {
  main().catch(function (e) { console.error("tier: " + (e && e.message)); process.exit(1); });
}

module.exports = { loadLegends: loadLegends, matcher: matcher, rebuild: rebuild, build: build, norm: norm, MIN_PLAYERS: MIN_PLAYERS, DAYS: DAYS };
