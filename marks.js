"use strict";

// The marks behind the count badges (plan 2 M9, 2026-11-14; pages.js RAVI_COUNTS).
//
// The hub and Go to show how many things wait behind News, Rules and Decks. data/feed.json and
// data/rules.json are about 290 KB each, too heavy to load just to count, so this writes the
// little each count needs, from the files as they are on disk:
//
//   data/marks/news.json   { v: 1, p: [[posted, kind, last], ...] }
//       one entry per post the News page shows: the day it was posted, its kind as News files it,
//       and for a local store's post the last day it shows ("" for a post that stays)
//   data/marks/rules.json  { v: 1, c: { "<day>": n, ... }, ban: [code, ...] }
//       how many entries and updates the Rules page shows changed on each day, and every printing
//       of every card banned in Constructed, as a deck stores its cards
//
// Nothing here has a clock in it: the same files in give the same files out, so a run with no
// news leaves both untouched. The feed and rules workflows run it after their fetch.
//
// THE SAME RULES AS THE PAGES, kept in step by rb-tools p2m9o: NEWS_KINDS is news/index.html's
// ORDER; a post is shown as its shown() says; a local post's last day as its gone() says; an
// update counts as rules/index.html's updLoad() takes it; a banned card is decks/deck.js's.
//
// Usage: node marks.js [data dir]

const fs = require("fs");
const path = require("path");
const DECK = require("./decks/deck.js");

const NEWS_KINDS = ["rules", "event", "product", "reveal", "announcement", "local", "market"];
const YMD = /^\d{4}-\d{2}-\d{2}$/;

function news(feed) {
  const p = [];
  ((feed && feed.items) || []).forEach(function (it) {
    if (!it || !it.id || !(it.sum || it.text || it.art) || typeof it.posted !== "string" || !it.posted) { return; }
    const kind = NEWS_KINDS.indexOf(it.kind) >= 0 ? it.kind : "market";
    let last = "";
    if (it.kind === "local" && YMD.test(it.posted)) {
      last = new Date(Date.UTC(+it.posted.slice(0, 4), +it.posted.slice(5, 7) - 1, +it.posted.slice(8)) + 7 * 864e5).toISOString().slice(0, 10);
      if (YMD.test(String(it.until || "")) && it.until > last) { last = it.until; }
    }
    p.push([it.posted, kind, last]);
  });
  p.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0); });
  return { v: 1, p: p };
}

function rules(rj, cat) {
  const c = {};
  function add(day) { if (day) { c[day] = (c[day] || 0) + 1; } }
  ((rj && rj.items) || []).forEach(function (it) { if (it && typeof it.changed === "string") { add(it.changed); } });
  ((rj && Array.isArray(rj.later)) ? rj.later : []).forEach(function (l) {
    if (!l || typeof l.title !== "string" || typeof l.url !== "string" || typeof l.published !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(l.published)) { return; }
    const t = l.title.replace(/^\s*\[[^\]]*\]\s*/, "").replace(/\s*\[[A-Za-z0-9_]+\]\s*$/, "").trim().slice(0, 160);
    if (t) { add(l.published.slice(0, 10)); }
  });
  const days = {};
  Object.keys(c).sort().forEach(function (d) { days[d] = c[d]; });
  // the ban list, as Decks reads it: the Constructed legality entry's list of names
  const ban = [];
  const legal = ((rj && rj.items) || []).filter(function (i) { return i && i.id === "hub#constructed-format-legality"; })[0];
  if (legal && cat) {
    const set = DECK.bannedFrom(legal.html), I = DECK.prep(cat);
    Object.keys(I.by).forEach(function (code) { if (DECK.isBanned(set, DECK.full(I, I.by[code]))) { ban.push(code); } });
    ban.sort();
  }
  return { v: 1, c: days, ban: ban };
}

function read(f) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return null; } }
function put(f, o) {
  const s = JSON.stringify(o) + "\n";
  let was = null;
  try { was = fs.readFileSync(f, "utf8"); } catch (e) { was = null; }
  if (was === s) { return false; }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s, "utf8");
  return true;
}

// Both files from what is on disk. A source that is missing or broken leaves its marks as they were.
function update(dataDir, catFile) {
  const feed = read(path.join(dataDir, "feed.json")), rj = read(path.join(dataDir, "rules.json"));
  const cat = read(catFile || path.join(dataDir, "..", "cards", "catalogue.json"));
  const out = { news: false, rules: false };
  if (feed && Array.isArray(feed.items)) { out.news = put(path.join(dataDir, "marks", "news.json"), news(feed)); }
  if (rj && Array.isArray(rj.items)) { out.rules = put(path.join(dataDir, "marks", "rules.json"), rules(rj, cat)); }
  return out;
}

module.exports = { NEWS_KINDS: NEWS_KINDS, news: news, rules: rules, update: update };

if (require.main === module) {
  const dataDir = path.resolve(process.argv[2] || path.join(__dirname, "data"));
  const r = update(dataDir);
  console.log("marks: news " + (r.news ? "written" : "as it was") + ", rules " + (r.rules ? "written" : "as it was"));
}
