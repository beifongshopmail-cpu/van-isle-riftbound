"use strict";

// Fixture for the unknown-template path. That path has never fired in
// production, so it is exercised here against known input on every run.
// A failure here means shaping or accumulation changed underneath us.

const assert = require("assert");
const { TYPE_MAP } = require("./config");
const { shape, noteUnknown } = require("./fetch-events");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { reportUnknown } = require("./report-anomalies");

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log("PASS " + name);
  } catch (err) {
    failures += 1;
    console.log("FAIL " + name + ": " + err.message);
  }
}

function rawEvent(templateId, name) {
  return {
    id: "fixture-" + name,
    name: name,
    event_configuration_template: templateId,
    start_datetime: "2026-08-08T18:00:00Z",
    end_datetime: null,
    store: { name: "Fixture Games Ltd.", city: "Victoria", full_address: "1 Test St" },
    capacity: 16,
    registered_user_count: 4,
    cost_in_cents: 500,
    currency: "CAD",
    updated_at: "2026-08-07T00:00:00Z"
  };
}

const BOGUS = "00000000-0000-4000-8000-000000000000";

check("unknown template shapes to type other", function () {
  const ev = shape(rawEvent(BOGUS, "Mystery Event"), "victoria");
  assert.strictEqual(ev.type, "other");
});

check("known template still maps to its own category", function () {
  const known = Object.keys(TYPE_MAP)[0];
  assert.ok(known, "TYPE_MAP is empty, control check is vacuous");
  const ev = shape(rawEvent(known, "Known Event"), "victoria");
  assert.strictEqual(ev.type, TYPE_MAP[known]);
  assert.notStrictEqual(ev.type, "other");
});

check("noteUnknown counts occurrences and keeps the first sample name", function () {
  const unknown = {};
  noteUnknown(unknown, BOGUS, { name: "First Seen" });
  noteUnknown(unknown, BOGUS, { name: "Second Seen" });
  assert.strictEqual(unknown[BOGUS].count, 2);
  assert.strictEqual(unknown[BOGUS].sample_name, "First Seen");
});

check("noteUnknown buckets a null template id under the string null", function () {
  const unknown = {};
  noteUnknown(unknown, null, { name: "No Template" });
  assert.strictEqual(unknown["null"].count, 1);
  assert.strictEqual(unknown["null"].sample_name, "No Template");
});

check("noteUnknown keeps distinct ids in distinct buckets", function () {
  const unknown = {};
  noteUnknown(unknown, BOGUS, { name: "A" });
  noteUnknown(unknown, "some-other-id", { name: "B" });
  assert.strictEqual(Object.keys(unknown).length, 2);
});

check("reportUnknown writes an issue body when a template is unrecognised", function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vir-fixture-"));
  const payload = {
    generated_at: "2026-08-07T00:00:00.000Z",
    unknown_templates: { [BOGUS]: { count: 3, sample_name: "Mystery Event" } }
  };
  const file = reportUnknown(payload, dir);
  assert.ok(file, "expected a body file path");
  const body = fs.readFileSync(file, "utf8");
  assert.ok(body.indexOf(BOGUS) !== -1, "body does not name the template id");
  assert.ok(body.indexOf("Mystery Event") !== -1, "body does not name the sample event");
});

check("reportUnknown writes nothing when there are no unknown templates", function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vir-fixture-"));
  const res = reportUnknown({ generated_at: "x", unknown_templates: {} }, dir);
  assert.strictEqual(res, null);
  assert.strictEqual(fs.readdirSync(dir).length, 0);
});

if (failures) {
  console.log("FIXTURE FAILURES: " + failures);
  process.exit(1);
}
console.log("all fixture checks passed");
