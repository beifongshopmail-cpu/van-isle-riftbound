"use strict";

// Anomaly reporter. Runs after Publish, so a failure here never blocks
// the feed. Writes one markdown body file per condition into a temp
// directory; the workflow opens an issue for each file that appears.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { DROP_FRACTION, DROP_FLOOR } = require("./config");

const DATA = path.join(__dirname, "data", "events.json");

function reportUnknown(payload, outDir) {
  const unknown = payload.unknown_templates || {};
  const keys = Object.keys(unknown);
  if (!keys.length) {
    console.log("unknown templates: none");
    return null;
  }
  const lines = [];
  lines.push("The fetcher saw event categories that are not in TYPE_MAP.");
  lines.push("");
  lines.push("These events still publish, but they render as the generic grey");
  lines.push('"Event" chip instead of their own colour and label.');
  lines.push("");
  lines.push("| template id | count | example event |");
  lines.push("| --- | --- | --- |");
  for (const k of keys) {
    const name = String(unknown[k].sample_name || "").replace(/\|/g, "\\|");
    lines.push("| " + k + " | " + unknown[k].count + " | " + name + " |");
  }
  lines.push("");
  lines.push("To fix: add each id to TYPE_MAP in config.js, add a matching");
  lines.push("entry to TYPES and TYPE_ORDER in index.html, then close this");
  lines.push("issue. Colours separate by lightness, not hue - green and");
  lines.push("violet are deliberately absent.");
  lines.push("");
  lines.push("Feed generated at " + payload.generated_at + ".");
  const file = path.join(outDir, "anomaly-unknown.md");
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
  console.log("unknown templates: " + keys.length + ", wrote " + file);
  return file;
}

// Two checks: against the previous run (a sudden drop), and against the highest count of the last
// 14 days (a slow slide, plan 2 M5: Sept 12 to Oct 9 went 52 to 19 with no single drop big enough).
// The slide compares against a high above the floor; the current count may be below it.
function reportDrop(payload, outDir) {
  const totals = payload.totals || {};
  const now = totals.unique;
  const prev = totals.prev_unique;
  if (typeof now !== "number") {
    console.log("degradation check: no count, skipped");
    return null;
  }
  let sudden = null, slide = null;
  if (typeof prev === "number" && now >= DROP_FLOOR && prev >= DROP_FLOOR && (prev - now) / prev > DROP_FRACTION) sudden = Math.round((prev - now) / prev * 100);
  const high = (Array.isArray(totals.recent) ? totals.recent : []).reduce(function (m, r) { return r && typeof r.n === "number" && r.n > m.n ? r : m; }, { n: 0, d: "" });
  if (high.n >= DROP_FLOOR && (high.n - now) / high.n > DROP_FRACTION) slide = Math.round((high.n - now) / high.n * 100);
  if (sudden === null && slide === null) {
    console.log("degradation check: " + prev + " -> " + now + " (14-day high " + high.n + "), within tolerance");
    return null;
  }
  const lines = [];
  lines.push(sudden !== null ? "The event count dropped sharply against the previous run." : "The event count has slid well below its 14-day high.");
  lines.push("");
  lines.push("| against | then | current | drop |");
  lines.push("| --- | --- | --- | --- |");
  if (typeof prev === "number") lines.push("| previous run | " + prev + " | " + now + " | " + (sudden !== null ? sudden : Math.max(0, Math.round((prev - now) / prev * 100))) + "% |");
  if (high.n) lines.push("| 14-day high (" + high.d + ") | " + high.n + " | " + now + " | " + Math.max(0, Math.round((high.n - now) / high.n * 100)) + "% |");
  lines.push("");
  lines.push("The calendar published anyway - this is a notice, not a");
  lines.push("failure. A drop this size is usually one of: upstream removed");
  lines.push("or rescheduled events, an anchor returning fewer results, or a");
  lines.push("partial API response that still cleared the minimum floor.");
  lines.push("");
  lines.push("Check the run summary for per-anchor counts before assuming a");
  lines.push("fault. Close this issue once explained.");
  lines.push("");
  lines.push("Feed generated at " + payload.generated_at + ".");
  const file = path.join(outDir, "anomaly-drop.md");
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
  console.log("degradation check: " + prev + " -> " + now + " (14-day high " + high.n + "), wrote " + file);
  return file;
}

// A NEW STORE (plan 2 M5; both sources from plan 2 M8.7): a store with no short name in STORE_SHORT
// (fetch-events.js) is one the app has not met, from PlayRiftbound or from a store's own post. Its
// events still publish under the full venue name. One body naming each such store once, with where
// it came from; the issue stays open until the store gets its short name.
function reportStores(payload, outDir) {
  const seen = {}, rows = [];
  function cell(v) { return String(v == null ? "" : v).replace(/\|/g, "\\|"); }
  for (const e of payload.events || []) {
    if (!e || e.store) continue;
    const k = String(e.sid) + "|" + e.venue;
    if (seen[k]) continue;
    seen[k] = 1;
    rows.push("| " + cell(e.venue) + " | " + cell(e.city) + " | " + cell(e.sid) + " | " + (e.src === "store" ? "the store's own post" : "PlayRiftbound") + " |");
  }
  if (!rows.length) {
    console.log("store names: every store has a short name");
    return null;
  }
  const lines = [];
  lines.push("A store new to RAVI has events on the calendar.");
  lines.push("");
  lines.push("Its events publish already, with the full venue name on the cards.");
  lines.push("");
  lines.push("| venue | city | store id | first seen in |");
  lines.push("| --- | --- | --- | --- |");
  for (const r of rows) lines.push(r);
  lines.push("");
  lines.push("To finish: add each store id to STORE_SHORT in fetch-events.js with a");
  lines.push("short name, then close this issue.");
  lines.push("");
  lines.push("Feed generated at " + payload.generated_at + ".");
  const file = path.join(outDir, "anomaly-stores.md");
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
  console.log("store names: " + rows.length + " new, wrote " + file);
  return file;
}

function main() {
  const outDir = process.env.RUNNER_TEMP || os.tmpdir();
  const payload = JSON.parse(fs.readFileSync(DATA, "utf8"));
  reportUnknown(payload, outDir);
  reportDrop(payload, outDir);
  reportStores(payload, outDir);
}

if (require.main === module) {
  main();
}

module.exports = { reportUnknown, reportDrop, reportStores };
