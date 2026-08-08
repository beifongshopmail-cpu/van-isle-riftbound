"use strict";

// Anomaly reporter. Runs after Publish, so a failure here never blocks
// the feed. Writes one markdown body file per condition into a temp
// directory; the workflow opens an issue for each file that appears.

const fs = require("fs");
const path = require("path");
const os = require("os");

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

function main() {
  const outDir = process.env.RUNNER_TEMP || os.tmpdir();
  const payload = JSON.parse(fs.readFileSync(DATA, "utf8"));
  reportUnknown(payload, outDir);
}

if (require.main === module) {
  main();
}

module.exports = { reportUnknown };
