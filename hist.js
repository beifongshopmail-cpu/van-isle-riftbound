"use strict";

// Price history for the Collection page's chart (M13, 2026-10-25).
//
// data/log/YYYY-MM-DD.json keeps one file of every price a day (about 47 KB
// each), too heavy for a phone to load a few months of. This turns them into
// one compact file a month, data/hist/YYYY-MM.json:
//
//   { v: 1, m: "2026-10", days: ["2026-10-01", ...],
//     s: { "<productId>|<finish>": [cents or null, one per day], ... } }
//
// Prices are whole cents (USD), so a series is a list of small integers.
// null means the printing had no price that day. A month file is rebuilt
// from that month's day logs every run, so it never drifts from them, and
// data/hist/index.json lists the months and the first and last day.
//
// The day logs stay the source of record; nothing here edits them.
//
// Usage: node hist.js            rebuild every month from data/log
//        require("./hist.js").update(dataDir, day)   rebuild one day's month

const fs = require("fs");
const path = require("path");

const DAY_RE = /^(\d{4}-\d{2})-\d{2}\.json$/;

function logDays(dataDir) {
  let files = [];
  try { files = fs.readdirSync(path.join(dataDir, "log")); } catch (e) { return []; }
  return files.filter(function (f) { return DAY_RE.test(f); }).map(function (f) { return f.slice(0, 10); }).sort();
}

// One month from the day logs it has. Returns the object written to disk.
function buildMonth(dataDir, month) {
  const days = logDays(dataDir).filter(function (d) { return d.slice(0, 7) === month; });
  const s = {};
  days.forEach(function (d, i) {
    let o = null;
    try { o = JSON.parse(fs.readFileSync(path.join(dataDir, "log", d + ".json"), "utf8")); } catch (e) { o = null; }
    const p = (o && o.p) || {};
    Object.keys(p).forEach(function (id) {
      const fins = p[id] || {};
      Object.keys(fins).forEach(function (fin) {
        const v = fins[fin];
        if (typeof v !== "number" || !isFinite(v)) { return; }
        const k = id + "|" + fin;
        if (!s[k]) { s[k] = new Array(days.length).fill(null); }
        s[k][i] = Math.round(v * 100);
      });
    });
  });
  return { v: 1, m: month, days: days, s: s };
}

function writeIndex(dataDir) {
  const days = logDays(dataDir);
  const months = [];
  days.forEach(function (d) { const m = d.slice(0, 7); if (months[months.length - 1] !== m) { months.push(m); } });
  const idx = { v: 1, first: days[0] || "", last: days[days.length - 1] || "", months: months };
  fs.writeFileSync(path.join(dataDir, "hist", "index.json"), JSON.stringify(idx) + "\n", "utf8");
  return idx;
}

function writeMonth(dataDir, month) {
  const dir = path.join(dataDir, "hist");
  fs.mkdirSync(dir, { recursive: true });
  const out = buildMonth(dataDir, month);
  fs.writeFileSync(path.join(dir, month + ".json"), JSON.stringify(out) + "\n", "utf8");
  return out;
}

// The daily refresh: rebuild the month holding this day, then the index.
function update(dataDir, day) {
  const out = writeMonth(dataDir, String(day).slice(0, 7));
  writeIndex(dataDir);
  return out;
}

// Every month from scratch (the first fill, or a repair).
function rebuildAll(dataDir) {
  const months = {};
  logDays(dataDir).forEach(function (d) { months[d.slice(0, 7)] = 1; });
  Object.keys(months).sort().forEach(function (m) { writeMonth(dataDir, m); });
  return writeIndex(dataDir);
}

module.exports = { buildMonth: buildMonth, update: update, rebuildAll: rebuildAll };

if (require.main === module) {
  const dataDir = path.resolve(process.argv[2] || path.join(__dirname, "data"));
  const idx = rebuildAll(dataDir);
  console.log("hist: " + idx.months.length + " months, " + idx.first + " to " + idx.last);
}
