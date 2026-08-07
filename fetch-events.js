"use strict";

const fs = require("fs");
const path = require("path");
const { API_BASE, ANCHORS, TYPE_MAP, TZ, MIN_EVENTS } = require("./config");
const { writeFeeds } = require("./ics");

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

// ---- shaping ----

function shape(raw, region) {
  const start = new Date(raw.start_datetime);
  const store = raw.store || {};
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
    updated: raw.updated_at || null
  };
}

// Accumulate an unrecognised template id. Extracted from main so the
// fixture can exercise it directly. Behaviour is unchanged.
function noteUnknown(unknown, templateId, ev) {
  const k = templateId || "null";
  if (!unknown[k]) unknown[k] = { count: 0, sample_name: ev.name };
  unknown[k].count += 1;
  return unknown;
}

async function main() {
  const after = startOfLocalDay();
  const afterIso = after.toISOString();

  const byId = new Map();
  const perAnchor = [];
  const unknown = {};
  let fetched = 0;

  for (const anchor of ANCHORS) {
    const rows = await fetchAnchor(anchor, afterIso);
    fetched += rows.length;
    let kept = 0;
    for (const raw of rows) {
      if (raw.is_test_event) continue;
      if (byId.has(raw.id)) continue;
      const ev = shape(raw, anchor.region);
      if (ev.type === "other") {
        noteUnknown(unknown, raw.event_configuration_template, ev);
      }
      byId.set(raw.id, ev);
      kept += 1;
    }
    perAnchor.push({ name: anchor.name, region: anchor.region, returned: rows.length, added: kept });
  }

  const events = Array.from(byId.values()).sort(function (a, b) {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    return a.venue < b.venue ? -1 : a.venue > b.venue ? 1 : 0;
  });

  if (events.length < MIN_EVENTS) {
    throw new Error(`only ${events.length} events (floor is ${MIN_EVENTS}) -- refusing to overwrite`);
  }

  const payload = {
    generated_at: new Date().toISOString(),
    generated_local: localIso(new Date()),
    window_start: afterIso,
    anchors: perAnchor,
    totals: { fetched: fetched, unique: events.length },
    unknown_templates: unknown,
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
    console.log(`  ${a.name}: returned ${a.returned}, added ${a.added}`);
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

module.exports = { shape, noteUnknown };
