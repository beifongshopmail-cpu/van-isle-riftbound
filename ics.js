"use strict";

const fs = require("fs");
const path = require("path");
const { TZ } = require("./config");

const LABELS = {
  nexus: "Nexus Nights",
  skirmish: "Summoner Skirmish",
  learn: "Learn-to-Play",
  open: "Open Play",
  prerift: "Pre-Rift",
  other: "Event"
};

// Two feeds so a subscriber gets the same choice the page offers.
const FEEDS = [
  { file: "victoria.ics", name: "RAVI - Victoria", regions: ["victoria"] },
  { file: "island.ics",   name: "RAVI - Island",   regions: ["victoria", "island"] }
];

// An event's own page, the same rule as the calendar page's eventUrl:
// PlayRiftbound ids ("rb" + its number) open on playriftbound.com; the old
// locator's numeric ids keep the locator.
function eventUrl(id) {
  const s = String(id);
  return /^rb\d+$/.test(s) ? "https://playriftbound.com/en-US/events/" + s.slice(2)
    : "https://locator.riftbound.uvsgames.com/events/" + s;
}
const DEFAULT_MINUTES = 180;
const FIXED_STAMP = "20260901T000000Z";

// RFC 5545 text escaping: backslash, semicolon, comma, newline.
function esc(value) {
  return String(value == null ? "" : value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC 5545 line folding: no line may exceed 75 octets. Continuation
// lines begin with a single space. Measured in bytes, not characters,
// because a folded multi-byte character would corrupt the feed.
function fold(line) {
  const out = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch, "utf8");
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out[0] + out.slice(1).map(function (s) { return "\r\n " + s; }).join("");
}

// UTC stamp form: 20260808T173000Z
function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function describe(ev) {
  const bits = [LABELS[ev.type] || LABELS.other];
  bits.push(ev.venue + (ev.city ? ", " + ev.city : ""));
  if (ev.cap != null) bits.push(ev.reg + " of " + ev.cap + " registered");
  bits.push(ev.cents ? "$" + (ev.cents / 100).toFixed(2) + " " + ev.currency : "Free");
  bits.push("Sign up: " + eventUrl(ev.id));
  return bits.join("\n");
}

// A feed (name given: a calendar to subscribe to, refreshed every 6 hours)
// or a single event to add once (name null: no calendar name, no refresh).
function buildFeed(name, events, stamp) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//van-isle-riftbound//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];
  if (name !== null) {
    lines.push("X-WR-CALNAME:" + esc(name));
    lines.push("X-WR-TIMEZONE:" + TZ);
    lines.push("X-WR-CALDESC:" + esc("Riftbound events on Vancouver Island. Sign-ups happen on each event's own page."));
    lines.push("REFRESH-INTERVAL;VALUE=DURATION:PT6H");
    lines.push("X-PUBLISHED-TTL:PT6H");
  }

  for (const ev of events) {
    const start = new Date(ev.start);
    const end = ev.end
      ? new Date(ev.end)
      : new Date(start.getTime() + DEFAULT_MINUTES * 60000);

    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + ev.id + "@van-isle-riftbound");
    lines.push("DTSTAMP:" + (stamp || FIXED_STAMP));
    lines.push("DTSTART:" + utcStamp(start));
    lines.push("DTEND:" + utcStamp(end));
    lines.push("SUMMARY:" + esc(ev.name));
    lines.push("LOCATION:" + esc(ev.address || ev.venue));
    lines.push("DESCRIPTION:" + esc(describe(ev)));
    lines.push("URL:" + eventUrl(ev.id));
    lines.push("CATEGORIES:" + esc(LABELS[ev.type] || LABELS.other));
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

function writeFeeds(outDir, events) {
  const stamp = utcStamp(new Date());
  const written = [];
  for (const feed of FEEDS) {
    const subset = events.filter(function (e) {
      return feed.regions.indexOf(e.region) !== -1;
    });
    const body = buildFeed(feed.name, subset, stamp);
    fs.writeFileSync(path.join(outDir, feed.file), body, "utf8");
    written.push({ file: feed.file, count: subset.length });
  }
  return written;
}

// ONE FILE PER EVENT, data/ev/<id>.ics, for the event card's Add to
// calendar button. DTSTAMP is FIXED_STAMP, a fixed past moment, so a file
// changes only when its event does (the cron commits nothing new otherwise).
// Files for events no longer listed are removed.
function writeEventFiles(outDir, events) {
  const dir = path.join(outDir, "ev");
  fs.mkdirSync(dir, { recursive: true });
  const keep = {};
  let n = 0;
  for (const ev of events) {
    const id = String(ev.id).replace(/[^A-Za-z0-9_-]/g, "");
    if (!id || !ev.start) continue;
    const file = id + ".ics";
    const body = buildFeed(null, [ev], null);
    const full = path.join(dir, file);
    let old = null;
    try { old = fs.readFileSync(full, "utf8"); } catch (e) {}
    if (old !== body) fs.writeFileSync(full, body, "utf8");
    keep[file] = 1;
    n++;
  }
  let removed = 0;
  for (const f of fs.readdirSync(dir)) {
    if (/\.ics$/.test(f) && !keep[f]) { fs.unlinkSync(path.join(dir, f)); removed++; }
  }
  return { count: n, removed: removed };
}

module.exports = { writeFeeds, writeEventFiles, buildFeed, eventUrl, esc, fold };
