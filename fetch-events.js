"use strict";

const fs = require("fs");
const path = require("path");
const { API_BASE, ANCHORS, TYPE_MAP, TZ, MIN_EVENTS, RB } = require("./config");
const { writeFeeds } = require("./ics");

// Store id -> a short display name. Keys are the same store ids sid uses.
const STORE_SHORT = {
  "21894": "AJ's",
  "902": "Colossal Courtenay",
  "15103": "Colossal Victoria",
  "16866": "Everything Games",
  "2069": "Gauntlet",
  "29310": "Giddy-Up",
  "18437": "North Park Framing",
  "4294": "Skyhaven"
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
    region: region,
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
    region: region,
    cap: (typeof c.participantCapacity === "number") ? c.participantCapacity : null,
    reg: reg,
    cents: (fee && typeof fee.minorUnits === "number") ? fee.minorUnits : 0,
    currency: (fee && fee.currency) || "CAD",
    updated: null,
    round: null,
    wins: null,
    sid: known ? known.sid : (org.id || null),
    store: known ? (STORE_SHORT[String(known.sid)] || null) : null
  };
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

  const events = Array.from(byId.values()).sort(function (a, b) {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    return a.venue < b.venue ? -1 : a.venue > b.venue ? 1 : 0;
  });

  if (events.length < MIN_EVENTS) {
    throw new Error(`only ${events.length} events (floor is ${MIN_EVENTS}) -- refusing to overwrite`);
  }

  const prevUnique = priorUnique(OUT_FILE);

  const payload = {
    generated_at: new Date().toISOString(),
    generated_local: localIso(new Date()),
    window_start: afterIso,
    anchors: perAnchor,
    totals: { fetched: fetched, unique: events.length, prev_unique: prevUnique },
    unknown_templates: unknown,
    old_feed_error: oldError,
    events: events
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 1) + "\n", "utf8");

  const feeds = writeFeeds(OUT_DIR, events);
  for (const f of feeds) {
    console.log(`wrote ${f.file} (${f.count} events)`);
  }

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

module.exports = { shape, noteUnknown, priorUnique, shapeRb, rbUrl, rbHeaders, eventKey };
