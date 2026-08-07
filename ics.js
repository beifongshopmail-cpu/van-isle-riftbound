"use strict";

const fs = require("fs");
const path = require("path");
const { TZ } = require("./config");

const LABELS = {
  nexus: "Nexus Nights",
  skirmish: "Summoner Skirmish",
  learn: "Learn-to-Play",
  open: "Open Play",
  other: "Event"
};

// Two feeds so a subscriber gets the same choice the page offers.
const FEEDS = [
  { file: "victoria.ics", name: "Van Isle Riftbound - Victoria", regions: ["victoria"] },
  { file: "island.ics",   name: "Van Isle Riftbound - Island",   regions: ["victoria", "island"] }
];

const EVENT_URL = "https://locator.riftbound.uvsgames.com/events/";
const DEFAULT_MINUTES = 180;

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
  bits.push("Sign up: " + EVENT_URL + ev.id);
  return bits.join("\n");
}

function buildFeed(name, events, stamp) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//van-isle-riftbound//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + esc(name),
    "X-WR-TIMEZONE:" + TZ,
    "X-WR-CALDESC:" + esc("Riftbound events on Vancouver Island. Sign-ups happen on the official locator."),
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H"
  ];

  for (const ev of events) {
    const start = new Date(ev.start);
    const end = ev.end
      ? new Date(ev.end)
      : new Date(start.getTime() + DEFAULT_MINUTES * 60000);

    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + ev.id + "@van-isle-riftbound");
    lines.push("DTSTAMP:" + stamp);
    lines.push("DTSTART:" + utcStamp(start));
    lines.push("DTEND:" + utcStamp(end));
    lines.push("SUMMARY:" + esc(ev.name));
    lines.push("LOCATION:" + esc(ev.address || ev.venue));
    lines.push("DESCRIPTION:" + esc(describe(ev)));
    lines.push("URL:" + EVENT_URL + ev.id);
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

module.exports = { writeFeeds, buildFeed, esc, fold };
