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

function reportDrop(payload, outDir) {
  const totals = payload.totals || {};
  const now = totals.unique;
  const prev = totals.prev_unique;
  if (typeof now !== "number" || typeof prev !== "number") {
    console.log("degradation check: no prior count, skipped");
    return null;
  }
  if (now < DROP_FLOOR || prev < DROP_FLOOR) {
    console.log("degradation check: below floor, skipped");
    return null;
  }
  const drop = (prev - now) / prev;
  if (drop <= DROP_FRACTION) {
    console.log("degradation check: " + prev + " -> " + now + ", within tolerance");
    return null;
  }
  const pct = Math.round(drop * 100);
  const lines = [];
  lines.push("The event count dropped sharply against the previous run.");
  lines.push("");
  lines.push("| previous | current | drop |");
  lines.push("| --- | --- | --- |");
  lines.push("| " + prev + " | " + now + " | " + pct + "% |");
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
  console.log("degradation check: " + prev + " -> " + now + ", " + pct + "% drop, wrote " + file);
  return file;
}

function main() {
  const outDir = process.env.RUNNER_TEMP || os.tmpdir();
  const payload = JSON.parse(fs.readFileSync(DATA, "utf8"));
  reportUnknown(payload, outDir);
  reportDrop(payload, outDir);
}

if (require.main === module) {
  main();
}

module.exports = { reportUnknown, reportDrop };
