"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { API_BASE, ANCHORS, TYPE_MAP, TZ, MIN_EVENTS, RB, STORE_POSTS, TOWNS } = require("./config");
const { writeFeeds, writeEventFiles, writeStoreFeeds } = require("./ics");

// Store id -> a short display name. Keys are the same store ids sid uses.
const STORE_SHORT = {
  "21894": "AJ's",
  "902": "Colossal Courtenay",
  "15103": "Colossal Victoria",
  "16866": "Everything Games",
  "2069": "Gauntlet",
  "29310": "Giddy-Up",
  "18437": "North Park Framing",
  "4294": "Skyhaven",
  // a PlayRiftbound store with no old id is keyed by its PlayRiftbound organizer id (plan 2 M5)
  "019fb060-927e-7709-b9cb-32c53ec8c895": "Elite4",
  // the rest of the island, searched from 2026-11-10
  "019fb060-93e6-7a79-a82a-fc4762d7e46e": "Sports Card Alley",
  "01a0310f-8c3a-78f3-a379-1c67b942326c": "Card Corner",
  "01a02b42-28ed-7be5-a65a-49431ed2f88f": "Fort Game Cafe",
  // a store known only from its own posts is keyed by the id storeSid gives it (plan 2 M8.7)
  "st-rottys-creations-victoria": "Rotty's"
};

// PlayRiftbound stores -> the old feed's store id and display name, keyed by
// lower-case name and city. Keeping the old id keeps saved store filters and
// gives one row per store while both feeds run. A store not listed here
// keeps its PlayRiftbound id and its own name.
const RB_STORES = {
  "aj's games|campbell river": { sid: 21894, venue: "AJ's Games" },
  "colossal cards & collectables|courtenay": { sid: 902, venue: "Colossal Cards & Collectables" },
  "colossal cards & collectables|victoria": { sid: 15103, venue: "Colossal Cards & Collectables" },
  "everything games|victoria": { sid: 16866, venue: "Everything Games" },
  "gauntlet games|victoria": { sid: 2069, venue: "Gauntlet Games" },
  "giddy-up games|campbell river": { sid: 29310, venue: "Giddy-Up Games" },
  "north park picture framing and collectables|victoria": { sid: 18437, venue: "North Park Picture Framing and Collectables" },
  "skyhaven games|victoria": { sid: 4294, venue: "Skyhaven Games" }
};

const OUT_DIR = path.join(__dirname, "data");
const OUT_FILE = path.join(OUT_DIR, "events.json");
const PAST_FILE = path.join(OUT_DIR, "past.json");
const SCHED_FILE = path.join(OUT_DIR, "sched.json");
const PAST_DAYS = 30;
const PAST_MAX = 400;
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

// ---- timezone helpers (no dependencies) ----

function partsIn(date, tz) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  const out = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return out;
}

// Minutes that the zone is ahead of UTC at this instant.
function offsetMinutes(date, tz) {
  const p = partsIn(date, tz);
  const hour = p.hour === "24" ? "0" : p.hour;
  const asUTC = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(hour), Number(p.minute), Number(p.second)
  );
  // Round to whole minutes. asUTC is built from second-resolution
  // formatted parts, so any milliseconds on the input Date leak into
  // the quotient as a fraction and corrupt the offset string.
  return Math.round((asUTC - date.getTime()) / 60000);
}

// Start of today in TZ, as a Date.
function startOfLocalDay() {
  const now = new Date();
  const p = partsIn(now, TZ);
  const guess = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 0, 0, 0);
  const off = offsetMinutes(new Date(guess), TZ);
  return new Date(guess - off * 60000);
}

function dayKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function timeLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true
  }).format(date);
}

// Local ISO with explicit offset, e.g. 2026-08-08T10:30:00-07:00
function localIso(date) {
  const p = partsIn(date, TZ);
  const off = offsetMinutes(date, TZ);
  const sign = off < 0 ? "-" : "+";
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${sign}${hh}:${mm}`;
}

// ---- the store's usual time (2026-11-02, Mako) ----
// BC kept daylight time from 2026 (UTC-7 all year). Some stores' PlayRiftbound events from
// November on start an hour late in Riot's data, as if worked out with the old rules (fall
// back to UTC-8 on the first Sunday of November, spring forward on the second Sunday of
// March): Everything Games ran Sundays at 11:30 all October, then every Sunday from Nov 1
// shows 12:30; Skyhaven's did the same until its owner fixed them by hand on 2026-11-01. Riot
// sends no time zone with an event, so nothing in the feed says which stores are affected.
// THE BEST GUESS (Mako: 'look at what the past schedule has been'): each run learns a store's
// usual start for each weekday and kind of event from events outside the old rules' winter
// (where both rules agree), kept in data/sched.json so it outlives past.json's 30 days. A
// winter event in BC that starts exactly an hour after its store's usual time, where every
// event the store ran on that weekday (that kind first, else any kind) started at one time,
// is shown at the usual time, marked guess with Riot's own time beside it. A usual time needs
// two or more days behind it. A store with any winter event on that weekday already at its
// usual time is not shifted there (Colossal's November Saturdays) and is never guessed; so an
// event a store or Riot has fixed stops the guessing by itself. No switch, no fixed offset. A
// store with mixed times on a weekday is never guessed.
const BC = new Set(["victoria", "island"]);
function nthSunday(y, m, n) { // m 1-12; the nth Sunday as YYYY-MM-DD
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const d = 1 + ((7 - first) % 7) + (n - 1) * 7;
  return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
}
// the old rules' winter: from the first Sunday of November to the second Sunday of March;
// only from 2026, the first winter BC did not fall back
function oldWinter(day) {
  if (!/^\d{4}-\d\d-\d\d$/.test(day || "") || day < "2026-11-01") return false;
  const y = Number(day.slice(0, 4)), m = Number(day.slice(5, 7));
  if (m >= 11) return day >= nthSunday(y, 11, 1);
  if (m <= 3) return day < nthSunday(y, 3, 2);
  return false;
}
function dowOf(day) { return new Date(day + "T12:00:00Z").getUTCDay(); }
function schedKeys(ev) {
  const who = (ev.sid !== null && ev.sid !== undefined) ? "s" + ev.sid : "v" + String(ev.venue || "").toLowerCase();
  const w = dowOf(ev.day);
  return [who + "|" + w + "|" + ev.type, who + "|" + w];
}
// sched: { v, groups: { key: { times: ["11:30"], days: [the days it was seen, the latest 12] } } }; learns in place
function learnSched(sched, events) {
  const g = sched.groups;
  for (const ev of events || []) {
    if (!ev || !BC.has(ev.region) || ev.guess || !ev.day || oldWinter(ev.day)) continue;
    const t = String(ev.start || "").slice(11, 16);
    if (!/^\d\d:\d\d$/.test(t)) continue;
    for (const k of schedKeys(ev)) {
      const x = g[k] || (g[k] = { times: [], days: [] });
      if (!Array.isArray(x.days)) x.days = [];
      if (x.times.indexOf(t) < 0 && x.times.length < 6) x.times.push(t);
      if (x.days.indexOf(ev.day) < 0) { x.days.push(ev.day); x.days.sort(); if (x.days.length > 12) x.days.shift(); }
    }
  }
  return sched;
}
function usualOf(sched, ev) {
  const k = schedKeys(ev), a = sched.groups[k[0]], b = sched.groups[k[1]];
  function ok(x) { return x && Array.isArray(x.days) && x.days.length >= 2; }
  const x = ok(a) ? a : ok(b) ? b : null;
  return x && x.times.length === 1 ? x.times[0] : null;
}
function shiftIso(iso, mins) { return iso ? localIso(new Date(Date.parse(iso) + mins * 60000)) : iso; }
// One event, corrected in place when it is the hour-late shape; returns true when it was.
// held: store-and-weekday keys not to guess (guessAll fills it).
function guessTime(sched, ev, held) {
  if (!ev || !BC.has(ev.region) || ev.guess || !oldWinter(ev.day)) return false;
  if (held && held.has(schedKeys(ev)[1])) return false;
  const u = usualOf(sched, ev), t = String(ev.start || "").slice(11, 16);
  if (!u || !/^\d\d:\d\d$/.test(t)) return false;
  const um = Number(u.slice(0, 2)) * 60 + Number(u.slice(3)), tm = Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  if (tm - um !== 60) return false;
  const was = ev.time;
  const start = new Date(Date.parse(ev.start) - 3600000);
  ev.start = localIso(start);
  ev.end = shiftIso(ev.end, -60);
  ev.day = dayKey(start);
  ev.time = timeLabel(start);
  ev.guess = 1;
  ev.riot = was;
  return true;
}
// Every event of a run: hold each store's weekday where a winter event already starts at its
// usual time, then guess the rest. Returns the events it moved.
function guessAll(sched, events) {
  const held = new Set();
  for (const ev of events) {
    if (!ev || !BC.has(ev.region) || ev.guess || !oldWinter(ev.day)) continue;
    const u = usualOf(sched, ev);
    if (u && String(ev.start || "").slice(11, 16) === u) held.add(schedKeys(ev)[1]);
  }
  return events.filter(function (ev) { return guessTime(sched, ev, held); });
}
function readSched() {
  const s = readJson(SCHED_FILE);
  return s && s.groups && typeof s.groups === "object" ? { v: 1, groups: s.groups } : { v: 1, groups: {} };
}

// ---- fetching ----

function buildUrl(anchor, afterIso, page) {
  const u = new URL(API_BASE);
  u.searchParams.set("start_date_after", afterIso);
  u.searchParams.append("display_statuses", "upcoming");
  u.searchParams.append("display_statuses", "inProgress");
  u.searchParams.set("game_slug", "riftbound");
  u.searchParams.set("latitude", String(anchor.lat));
  u.searchParams.set("longitude", String(anchor.lng));
  u.searchParams.set("num_miles", String(anchor.miles));
  u.searchParams.set("upcoming_only", "true");
  u.searchParams.set("page", String(page));
  u.searchParams.set("page_size", String(PAGE_SIZE));
  return u.toString();
}

async function fetchAnchor(anchor, afterIso) {
  const rows = [];
  let page = 1;
  while (page <= MAX_PAGES) {
    const url = buildUrl(anchor, afterIso, page);
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) {
      throw new Error(`${anchor.name} page ${page}: HTTP ${res.status}`);
    }
    const body = await res.json();
    if (!Array.isArray(body.results)) {
      throw new Error(`${anchor.name} page ${page}: no results array`);
    }
    rows.push(...body.results);
    if (!body.next_page_number) break;
    page += 1;
  }
  if (page > MAX_PAGES) {
    throw new Error(`${anchor.name}: exceeded ${MAX_PAGES} pages, refusing to continue`);
  }
  return rows;
}

// ---- PlayRiftbound ----

function rbHeaders() {
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": RB.ua,
    "apollographql-client-name": RB.client,
    "apollographql-client-version": RB.version
  };
}

function rbUrl(anchor, afterIso, cursor) {
  const vars = {
    sport: "rb",
    first: 50,
    filter: { rb: {
      coords: { latitude: anchor.lat, longitude: anchor.lng },
      startDate: afterIso,
      distanceMeters: Math.round(anchor.miles * 1609.344)
    } },
    sortBy: { rb: "DATE" }
  };
  if (cursor) vars.after = cursor;
  const u = new URL(RB.base);
  u.searchParams.set("operationName", RB.op);
  u.searchParams.set("variables", JSON.stringify(vars));
  u.searchParams.set("extensions", JSON.stringify({ persistedQuery: { version: 1, sha256Hash: RB.hash } }));
  return u.toString();
}

async function fetchRbAnchor(anchor, afterIso) {
  const rows = [];
  let cursor = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(rbUrl(anchor, afterIso, cursor), { headers: rbHeaders() });
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch (err) { body = null; }
    const s = body && body.data ? body.data.competeTournamentSearch : null;
    if (!res.ok || !s || !Array.isArray(s.edges)) {
      const why = (body && body.errors && body.errors[0] && body.errors[0].message) || text.slice(0, 200);
      throw new Error(`PlayRiftbound ${anchor.name} page ${page}: HTTP ${res.status} ${why}`);
    }
    for (const e of s.edges) {
      if (e && e.node && e.node.tournament) rows.push(e.node);
    }
    const more = s.pageInfo && s.pageInfo.hasNextPage;
    if (!more || !s.edges.length) return rows;
    cursor = (s.pageInfo && s.pageInfo.endCursor) || s.edges[s.edges.length - 1].cursor;
  }
  throw new Error(`PlayRiftbound ${anchor.name}: exceeded ${MAX_PAGES} pages, refusing to continue`);
}

// ---- the event's own config (M17 block 4, 2026-10-30) ----
// Riot's event page says before the event whether it is Swiss only (SWISS) or Swiss then a
// single-elimination cut (SWISS_PLUS_SINGLE_ELIM), and the store's Swiss rounds (roundCount);
// never the cut's size. The search above carries neither, so each new PlayRiftbound event's page
// is read once and its two values kept: swiss (the store's Swiss rounds, or null) and cut (false
// for Swiss only, true for a cut, null while unknown). The page streams its data as
// self.__next_f.push([1,"..."]) chunks, read as server/live/parse.js reads them; everything is
// rebuilt from checked values.
const PAGE_BASE = "https://playriftbound.com/en-US/events/";
const READ_MAX = 80;        // event pages read per run at most; the rest wait for the next run
const STRUCTURES = { SWISS: false, SWISS_PLUS_SINGLE_ELIM: true };

function streamOf(html) {
  if (typeof html !== "string") return "";
  const out = [];
  const re = /self\.__next_f\.push\(\[\d+,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let m;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse('"' + m[1] + '"')); } catch (err) { /* skip a broken chunk */ }
  }
  return out.join("");
}

function braceEnd(s, i) {
  let depth = 0, inStr = false;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) {
      if (c === "\\") { j++; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return j; }
  }
  return -1;
}

// An event page -> { swiss, cut }, or null when the page carries no config Riot's way.
function configOf(html) {
  const text = streamOf(html);
  const at = text.indexOf('{"__typename":"RiftboundTournamentConfig"');
  if (at < 0) return null;
  const end = braceEnd(text, at);
  if (end < 0) return null;
  let c;
  try { c = JSON.parse(text.slice(at, end + 1)); } catch (err) { return null; }
  const cut = Object.prototype.hasOwnProperty.call(STRUCTURES, c.structure) ? STRUCTURES[c.structure] : null;
  const swiss = Number.isInteger(c.roundCount) && c.roundCount >= 1 && c.roundCount <= 15 ? c.roundCount : null;
  if (cut === null && swiss === null) return null;
  return { swiss: swiss, cut: cut };
}

async function readConfig(id) {
  const res = await fetch(PAGE_BASE + String(id).replace(/^rb/, ""), {
    headers: { "Accept": "text/html", "User-Agent": RB.ua }
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return configOf(await res.text());
}

// Gives every event swiss and cut: carried from last run's file when already known, else read
// from its page (PlayRiftbound events only, at most max a run). A failed read leaves the event
// unknown, so the next run tries again; it never fails the run.
async function withConfig(events, prevEvents, read, max) {
  const known = new Map();
  for (const p of (Array.isArray(prevEvents) ? prevEvents : [])) {
    if (p && typeof p.id === "string" && typeof p.cut === "boolean") {
      known.set(p.id, { swiss: Number.isInteger(p.swiss) && p.swiss >= 1 && p.swiss <= 15 ? p.swiss : null, cut: p.cut });
    }
  }
  const stat = { kept: 0, read: 0, failed: 0, waiting: 0 };
  for (const ev of events) {
    ev.swiss = null; ev.cut = null;
    const k = known.get(ev.id);
    if (k) { ev.swiss = k.swiss; ev.cut = k.cut; stat.kept++; continue; }
    if (!/^rb\d{1,24}$/.test(String(ev.id))) continue;
    if (stat.read >= max) { stat.waiting++; continue; }
    stat.read++;
    try {
      const c = await read(ev.id);
      if (c) { ev.swiss = c.swiss; ev.cut = c.cut; } else stat.failed++;
    } catch (err) {
      stat.failed++;
    }
  }
  return stat;
}

// ---- STORE-POSTED EVENTS (plan 2 M8.7, Mako 2026-11-10) ----
// Some stores run Riftbound nights they never list on PlayRiftbound (Rotty's Creations,
// Tuesdays). Banh Mi's daily digest lists every upcoming event each local store's own pages
// show that day (store_events, one entry per date, re-listed on every run). Those reach the
// calendar for every store alike, marked src "store" with the post's link, under three rules:
// - CONFIRMED: only a digest run within STORE_POSTS.days days counts, so a night was seen on
//   the store's page at most that long ago, and the events drop off by themselves if the
//   digest stops. An entry that is cancelled, past, undated, untimed, online or outside the
//   island's towns is left out.
// - THE STORE'S OWN LISTING WINS: an entry is dropped when PlayRiftbound (or the old feed) has
//   an event at that store that day.
// - NO STORE LIST: a store is matched to RB_STORES by a normalised name and city; any other
//   store gets a stable id from its name and city, so Follow and the store filter work.
function storeNorm(name) {
  return String(name || "").toLowerCase().replace(/&/g, " and ").replace(/\bltd\b\.?/g, " ")
    .replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
const RB_NORM = {};
for (const k of Object.keys(RB_STORES)) {
  const at = k.lastIndexOf("|");
  RB_NORM[storeNorm(k.slice(0, at)) + "|" + k.slice(at + 1)] = RB_STORES[k];
}
function storeSid(name, city) {
  return "st-" + (storeNorm(name) + " " + String(city || "").toLowerCase()).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
// A store's time as written -> { start: "17:00", end: "20:00" or null }, or null when it
// is not a clock time. '5:00 PM', '5:00-8:00 PM', '5-8 PM', '11:00 AM - 2:00 PM'.
function storeTime(text) {
  const m = /^\s*(\d{1,2})(?::(\d\d))?\s*([ap]m)?\s*(?:(?:-|–|to)\s*(\d{1,2})(?::(\d\d))?\s*([ap]m)?)?\s*$/i.exec(String(text || ""));
  if (!m) return null;
  const two = m[4] !== undefined;
  const ap2 = two && m[6] ? m[6].toLowerCase() : null;
  let ap1 = m[3] ? m[3].toLowerCase() : ap2;
  if (!ap1) return null;
  function mins(h, mm, ap) {
    h = Number(h); mm = Number(mm || 0);
    if (h < 1 || h > 12 || mm > 59) return null;
    return ((h % 12) + (ap === "pm" ? 12 : 0)) * 60 + mm;
  }
  function hhmm(n) { return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"); }
  let a = mins(m[1], m[2], ap1);
  if (a === null) return null;
  if (!two) return { start: hhmm(a), end: null };
  const b = mins(m[4], m[5], ap2 || ap1);
  if (b === null) return null;
  // '11-2 PM': the start took the end's PM and landed after it, so it is the morning
  if (!m[3] && a >= b) { a = mins(m[1], m[2], "am"); }
  if (a === null || a >= b) return null;
  return { start: hhmm(a), end: hhmm(b) };
}
// A wall-clock day and time in TZ -> a Date.
function localDate(day, hm) {
  const guess = Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), Number(hm.slice(0, 2)), Number(hm.slice(3, 5)), 0);
  return new Date(guess - offsetMinutes(new Date(guess), TZ) * 60000);
}
function daysBetween(a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000); }
function isDay(s) { return typeof s === "string" && /^\d{4}-\d\d-\d\d$/.test(s) && isFinite(Date.parse(s + "T12:00:00Z")); }
function storeWho(ev) { return (ev.sid !== null && ev.sid !== undefined) ? "s" + ev.sid : "v" + storeNorm(ev.venue) + "|" + String(ev.city || "").toLowerCase(); }
function storeCents(fee) {
  const m = /\$\s*(\d{1,4})(?:\.(\d\d))?/.exec(String(fee || ""));
  return m ? Number(m[1]) * 100 + Number(m[2] || 0) : 0;
}
// digest: one daily file ({ run, store_events }); existing: the events already in this run
// (PlayRiftbound and the old feed); today: YYYY-MM-DD in TZ. Returns the events to add.
function storeEvents(digest, existing, today) {
  const list = digest && Array.isArray(digest.store_events) ? digest.store_events : [];
  const run = digest && isDay(digest.run) ? digest.run : null;
  if (!run || !isDay(today)) return [];
  const age = daysBetween(run, today);
  if (age < 0 || age > STORE_POSTS.days) return [];
  const taken = new Set();
  for (const e of existing || []) if (e && e.day) taken.add(storeWho(e) + "|" + e.day);
  const out = [], ids = new Set();
  for (const x of list) {
    if (!x || typeof x !== "object" || x.cancelled === true) continue;
    const name = String(x.name || "").replace(/\s+/g, " ").trim().slice(0, 120);
    const store = String(x.store || "").replace(/\s+/g, " ").replace(/ Ltd\.?$/i, "").trim().slice(0, 80);
    const city = String(x.city || "").replace(/\s+/g, " ").trim().slice(0, 40);
    const format = String(x.format || "");
    const region = STORE_POSTS.cities[city.toLowerCase()];
    if (!name || !store || !region || !isDay(x.date) || x.date < today) continue;
    if (/\bonline\b/i.test(name) || /\bonline\b/i.test(format)) continue;
    const t = storeTime(x.time);
    if (!t) continue;
    const known = RB_NORM[storeNorm(store) + "|" + city.toLowerCase()] || null;
    const sid = known ? known.sid : storeSid(store, city);
    if (taken.has("s" + sid + "|" + x.date) || taken.has("v" + storeNorm(store) + "|" + city.toLowerCase() + "|" + x.date)) continue;
    const id = "st" + String(BigInt("0x" + crypto.createHash("sha256").update(storeNorm(store) + "|" + city.toLowerCase() + "|" + x.date + "|" + name.toLowerCase()).digest("hex").slice(0, 12)) % 1000000000000n).padStart(12, "0");
    if (ids.has(id)) continue;
    ids.add(id);
    const start = localDate(x.date, t.start);
    let url = null;
    try { const u = new URL(String(x.url || "")); if (u.protocol === "https:") url = u.href.slice(0, 500); } catch (err) { url = null; }
    out.push({
      id: id,
      name: name,
      type: /\b(casual|open)\b/i.test(format) ? "open" : "other",
      start: localIso(start),
      end: t.end ? localIso(localDate(x.date, t.end)) : null,
      day: x.date,
      time: timeLabel(start),
      venue: known ? known.venue : store,
      city: city,
      address: "",
      region: region,
      cap: null,
      reg: 0,
      cents: storeCents(x.fee),
      currency: "CAD",
      updated: null,
      round: null,
      wins: null,
      sid: sid,
      store: STORE_SHORT[String(sid)] || null,
      src: "store",
      url: url,
      conf: run
    });
  }
  return out;
}
// The digest could not be read this run: last run's store events stay while their
// confirming run is within the days allowed, still under the store's-listing-wins rule.
function carryStore(prevEvents, existing, today) {
  const taken = new Set();
  for (const e of existing || []) if (e && e.day) taken.add(storeWho(e) + "|" + e.day);
  return (Array.isArray(prevEvents) ? prevEvents : []).filter(function (e) {
    if (!e || e.src !== "store" || !isDay(e.conf) || !isDay(e.day) || e.day < today) return false;
    const age = daysBetween(e.conf, today);
    return age >= 0 && age <= STORE_POSTS.days && !taken.has(storeWho(e) + "|" + e.day);
  });
}
// The newest daily file within the days allowed, or null when there is none. A missing
// day is normal (404); anything else throws, and main carries last run's events instead.
async function readDigest(today) {
  const base = process.env.EVENTS_DIGEST_BASE || STORE_POSTS.base;
  for (let back = 0; back <= STORE_POSTS.days; back++) {
    const day = new Date(Date.parse(today + "T12:00:00Z") - back * 86400000).toISOString().slice(0, 10);
    const res = await fetch(base + day + ".json", { headers: { "Accept": "application/json", "User-Agent": RB.ua } });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error("digest " + day + ": HTTP " + res.status);
    let body;
    try { body = JSON.parse(await res.text()); } catch (err) { continue; } // a broken day: try the one before
    if (!body || typeof body !== "object") continue;
    if (!isDay(body.run) || body.run > day) body.run = day;
    return body;
  }
  return null;
}

// ---- shaping ----

function shape(raw, region) {
  const start = new Date(raw.start_datetime);
  const store = raw.store || {};
  const settings = raw.settings || {};
  const roundMinutes = settings.round_duration_in_minutes;
  const round = (typeof roundMinutes === "number" && isFinite(roundMinutes) && roundMinutes > 0)
    ? roundMinutes : null;
  const gameWins = settings.maximum_number_of_game_wins_per_match;
  const wins = (typeof gameWins === "number" && isFinite(gameWins) && gameWins >= 1)
    ? gameWins : null;
  return {
    id: raw.id,
    name: String(raw.name || "").trim(),
    type: TYPE_MAP[raw.event_configuration_template] || "other",
    start: localIso(start),
    end: raw.end_datetime ? localIso(new Date(raw.end_datetime)) : null,
    day: dayKey(start),
    time: timeLabel(start),
    venue: String(store.name || "").replace(/ Ltd\.?$/, "").trim(),
    city: store.city || "",
    address: store.full_address || "",
    region: TOWNS[String(store.city || "").trim().toLowerCase()] || region,
    cap: raw.capacity == null ? null : raw.capacity,
    reg: raw.registered_user_count || 0,
    cents: raw.cost_in_cents || 0,
    currency: raw.currency || "CAD",
    updated: raw.updated_at || null,
    round: round,
    wins: wins,
    sid: (store.id === null || store.id === undefined) ? null : store.id,
    store: STORE_SHORT[String(store.id)] || null
  };
}

// A PlayRiftbound search result in the same shape as shape() gives.
function shapeRb(node, region) {
  const t = node.tournament || {};
  const c = t.config || {};
  const org = node.organizer || {};
  const addr = org.physicalAddress || {};
  const start = new Date(t.startsAt);
  const fee = t.entryFee || null;
  let reg = 0;
  for (const r of (t.registrantCounts || [])) {
    if (r && r.status === "REGISTERED" && typeof r.count === "number") reg += r.count;
  }
  const name = String(org.name || "").replace(/ Ltd\.?$/i, "").trim();
  const city = String(addr.city || "").trim();
  const known = RB_STORES[name.toLowerCase() + "|" + city.toLowerCase()] || null;
  return {
    id: "rb" + t.id,
    name: String(t.name || "").trim(),
    type: RB.types[c.tournamentType] || "other",
    start: localIso(start),
    end: null,
    day: dayKey(start),
    time: timeLabel(start),
    venue: known ? known.venue : name,
    city: city,
    address: addr.formattedAddress || "",
    region: TOWNS[city.toLowerCase()] || region,
    cap: (typeof c.participantCapacity === "number") ? c.participantCapacity : null,
    reg: reg,
    cents: (fee && typeof fee.minorUnits === "number") ? fee.minorUnits : 0,
    currency: (fee && fee.currency) || "CAD",
    updated: null,
    round: null,
    wins: null,
    sid: known ? known.sid : (org.id || null),
    store: STORE_SHORT[String(known ? known.sid : org.id)] || null
  };
}

// The towns in this run that TOWNS (config.js) does not list, A to Z: each kept its search's
// area, and is named in the summary and an issue so it can be added.
function otherTowns(events) {
  const seen = new Set();
  for (const ev of events || []) {
    const c = String((ev && ev.city) || "").trim();
    if (c && !TOWNS[c.toLowerCase()]) seen.add(c);
  }
  return Array.from(seen).sort();
}

// One event per store and start time. PlayRiftbound is read first, so its
// copy wins when the old feed still lists the same event.
function eventKey(ev) {
  const who = (ev.sid !== null && ev.sid !== undefined) ? "s" + ev.sid : "v" + String(ev.venue || "").toLowerCase();
  return who + "|" + ev.start;
}

// Accumulate an unrecognised template id. Extracted from main so the
// fixture can exercise it directly. Behaviour is unchanged.
function noteUnknown(unknown, templateId, ev) {
  const k = templateId || "null";
  if (!unknown[k]) unknown[k] = { count: 0, sample_name: ev.name };
  unknown[k].count += 1;
  return unknown;
}

// Previous published unique count, or null if unavailable. Never
// throws: a missing or malformed prior file is a normal first-run
// condition, not a fetch failure.
function priorUnique(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const prev = JSON.parse(raw);
    const n = prev && prev.totals ? prev.totals.unique : null;
    return typeof n === "number" && isFinite(n) ? n : null;
  } catch (err) {
    return null;
  }
}

// RECENT PAST EVENTS (M17 block 2, 2026-10-29): the Tier list's Local view lets
// players add the decks played at events that have finished. events.json keeps
// only today onward, so each run carries every PlayRiftbound event that has
// left the window into data/past.json, newest first, for PAST_DAYS. Only the
// fields the Tier list needs; never a player.
const PAST_FIELDS = ["id", "name", "type", "start", "day", "venue", "store", "region", "sid"];
function pastShape(ev) {
  if (!ev || typeof ev !== "object" || !/^rb\d{6,24}$/.test(String(ev.id))) return null;
  if (typeof ev.start !== "string" || !isFinite(Date.parse(ev.start))) return null;
  const o = {};
  for (const k of PAST_FIELDS) if (ev[k] !== undefined && ev[k] !== null) o[k] = ev[k];
  return o;
}
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (err) { return null; }
}
// prevEvents: last run's events; prevPast: last run's past list; nowIds: the ids
// still in the window; windowStartIso: the window's start; nowMs: the clock.
function buildPast(prevEvents, prevPast, nowIds, windowStartIso, nowMs) {
  const cut = nowMs - PAST_DAYS * 86400000;
  const start = Date.parse(windowStartIso);
  const byId = new Map();
  const add = function (ev) {
    const o = pastShape(ev);
    if (!o || nowIds.has(o.id) || byId.has(o.id)) return;
    const t = Date.parse(o.start);
    if (!(t < start) || t < cut) return;
    byId.set(o.id, o);
  };
  (Array.isArray(prevEvents) ? prevEvents : []).forEach(add);
  (Array.isArray(prevPast) ? prevPast : []).forEach(add);
  return Array.from(byId.values()).sort(function (a, b) {
    return a.start < b.start ? 1 : a.start > b.start ? -1 : (a.id < b.id ? -1 : 1);
  }).slice(0, PAST_MAX);
}

async function main() {
  const after = startOfLocalDay();
  const afterIso = after.toISOString();

  const byId = new Map();
  const keys = new Set();
  const perAnchor = [];
  const unknown = {};
  let fetched = 0;
  let oldError = null;

  // PlayRiftbound first: stores list events there now, and its copy wins a
  // duplicate. A failure here fails the run, so the last good file stays.
  for (const anchor of ANCHORS) {
    const nodes = await fetchRbAnchor(anchor, afterIso);
    fetched += nodes.length;
    let kept = 0;
    for (const n of nodes) {
      const ev = shapeRb(n, anchor.region);
      if (byId.has(ev.id) || keys.has(eventKey(ev))) continue;
      if (ev.type === "other") {
        noteUnknown(unknown, (n.tournament.config || {}).tournamentType, ev);
      }
      byId.set(ev.id, ev);
      keys.add(eventKey(ev));
      kept += 1;
    }
    perAnchor.push({ name: anchor.name, region: anchor.region, source: "playriftbound", returned: nodes.length, added: kept });
  }

  // The old UVS feed while it lasts. Its failure is noted, never fatal.
  for (const anchor of ANCHORS) {
    let rows;
    try {
      rows = await fetchAnchor(anchor, afterIso);
    } catch (err) {
      oldError = err.message;
      console.log("old feed skipped: " + err.message);
      break;
    }
    fetched += rows.length;
    let kept = 0;
    for (const raw of rows) {
      if (raw.is_test_event) continue;
      if (byId.has(raw.id)) continue;
      const ev = shape(raw, anchor.region);
      if (keys.has(eventKey(ev))) continue;
      if (ev.type === "other") {
        noteUnknown(unknown, raw.event_configuration_template, ev);
      }
      byId.set(raw.id, ev);
      keys.add(eventKey(ev));
      kept += 1;
    }
    perAnchor.push({ name: anchor.name, region: anchor.region, source: "uvs", returned: rows.length, added: kept });
  }

  // the store's usual time: learn from this run and the finished events, then guess
  const sched = readSched();
  const prevPast0 = readJson(PAST_FILE);
  learnSched(sched, prevPast0 && prevPast0.events);
  learnSched(sched, Array.from(byId.values()));
  const moved = guessAll(sched, Array.from(byId.values()));
  for (const ev of moved) console.log(`usual time: ${ev.venue} ${ev.day} ${ev.riot} -> ${ev.time} (${ev.id})`);
  console.log(`usual time: ${moved.length} events shown at their store's usual time`);

  // the stores' own posts (plan 2 M8.7): never fatal; a failed read keeps last run's
  const todayK = dayKey(new Date());
  const storePosts = { run: null, listed: 0, added: 0, error: null };
  let posted = [];
  try {
    const digest = await readDigest(todayK);
    if (digest) {
      storePosts.run = digest.run;
      storePosts.listed = Array.isArray(digest.store_events) ? digest.store_events.length : 0;
      posted = storeEvents(digest, Array.from(byId.values()), todayK);
    }
  } catch (err) {
    storePosts.error = err.message;
    const prev0 = readJson(OUT_FILE);
    posted = carryStore(prev0 && prev0.events, Array.from(byId.values()), todayK);
    console.log("store posts not read (" + err.message + "); kept " + posted.length + " from the last run");
  }
  for (const ev of posted) { if (!byId.has(ev.id)) { byId.set(ev.id, ev); storePosts.added += 1; } }
  console.log(`store posts: digest ${storePosts.run || "none"}, ${storePosts.listed} listed, ${storePosts.added} added`);

  const events = Array.from(byId.values()).sort(function (a, b) {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    return a.venue < b.venue ? -1 : a.venue > b.venue ? 1 : 0;
  });

  if (events.length < MIN_EVENTS) {
    throw new Error(`only ${events.length} events (floor is ${MIN_EVENTS}) -- refusing to overwrite`);
  }

  const prevUnique = priorUnique(OUT_FILE);
  const prevFile = readJson(OUT_FILE);
  const cfg = await withConfig(events, prevFile && prevFile.events, readConfig, READ_MAX);
  console.log(`event config: ${cfg.kept} known, ${cfg.read} read, ${cfg.failed} not read, ${cfg.waiting} waiting for the next run`);
  const prevPastFile = readJson(PAST_FILE);
  const past = buildPast(prevFile && prevFile.events, prevPastFile && prevPastFile.events,
    new Set(events.map(function (e) { return e.id; })), afterIso, Date.now());

  const payload = {
    generated_at: new Date().toISOString(),
    generated_local: localIso(new Date()),
    window_start: afterIso,
    anchors: perAnchor,
    totals: { fetched: fetched, unique: events.length, prev_unique: prevUnique,
      recent: recentCounts(prevFile && prevFile.totals && prevFile.totals.recent, events.length, new Date()) },
    unknown_templates: unknown,
    old_feed_error: oldError,
    store_posts: storePosts,
    other_towns: otherTowns(events),
    events: events
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 1) + "\n", "utf8");
  fs.writeFileSync(PAST_FILE, JSON.stringify({ v: 1, days: PAST_DAYS, events: past }, null, 1) + "\n", "utf8");
  fs.writeFileSync(SCHED_FILE, JSON.stringify(sched, null, 1) + "\n", "utf8");
  console.log(`wrote past.json (${past.length} finished events)`);

  const feeds = writeFeeds(OUT_DIR, events);
  for (const f of feeds) {
    console.log(`wrote ${f.file} (${f.count} events)`);
  }
  const st = writeStoreFeeds(OUT_DIR, events);
  console.log(`wrote store/ (${st.count} store feeds, ${st.empty} with no events left)`);
  const one = writeEventFiles(OUT_DIR, events);
  console.log(`wrote ev/ (${one.count} event files, ${one.removed} removed)`);

  console.log(`wrote ${events.length} events from ${fetched} rows`);
  for (const a of perAnchor) {
    console.log(`  ${a.name} (${a.source}): returned ${a.returned}, added ${a.added}`);
  }
  const uk = Object.keys(unknown);
  if (uk.length) {
    console.log(`UNKNOWN TEMPLATES: ${uk.length}`);
    for (const k of uk) {
      console.log(`  ${k} x${unknown[k].count} e.g. ${unknown[k].sample_name}`);
    }
  } else {
    console.log("UNKNOWN TEMPLATES: none");
  }
}

if (require.main === module) {
  main().catch(function (err) {
    console.error("FETCH FAILED: " + err.message);
    console.error("data/events.json left untouched");
    process.exit(1);
  });
}

// THE 14-DAY HIGH (plan 2 M5; NEXT -- calendar follow-ups from M9, item 1): each day's highest
// event count over the last RECENT_DAYS, kept in events.json's totals, so report-anomalies.js can
// see a slow slide (Sept 12 to Oct 9 went 52 to 19 with no single run's drop big enough).
const RECENT_DAYS = 14;
function recentCounts(prev, n, now) {
  const today = dayKey(now), cut = dayKey(new Date(now.getTime() - RECENT_DAYS * 86400000));
  const by = {};
  for (const r of Array.isArray(prev) ? prev : []) {
    if (!r || typeof r.d !== "string" || typeof r.n !== "number" || r.d <= cut || r.d > today) continue;
    by[r.d] = Math.max(by[r.d] || 0, r.n);
  }
  by[today] = Math.max(by[today] || 0, n);
  return Object.keys(by).sort().map(function (d) { return { d: d, n: by[d] }; });
}

module.exports = { recentCounts, shapeRb, oldWinter, learnSched, guessTime, guessAll, usualOf, shape, noteUnknown, priorUnique, shapeRb, rbUrl, rbHeaders, eventKey, buildPast, PAST_DAYS, configOf, withConfig, storeEvents, storeTime, carryStore, storeNorm, storeSid, readDigest, otherTowns };
