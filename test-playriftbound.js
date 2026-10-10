"use strict";

// Fixture for the PlayRiftbound source (from M9). Runs before every fetch.
// The node below is a real event from the search, trimmed to the fields
// the fetcher reads. A failure here means the shaping, the store map, the
// merge key or the request contract changed underneath us.

const assert = require("assert");
const { RB } = require("./config");
const fe = require("./fetch-events");

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

function node(over) {
  const n = {
    organizer: {
      id: "019fb060-8c9f-764f-b47a-b4a23c055546",
      name: "North Park Picture Framing and Collectables",
      physicalAddress: {
        city: "Victoria",
        formattedAddress: "1046 Mason St #4, Victoria, BC V8T 1A3, Canada"
      }
    },
    tournament: {
      config: {
        format: "CONSTRUCTED",
        participantCapacity: 28,
        playerFormat: "ONE_V_ONE",
        tournamentType: "NEXUS_NIGHT"
      },
      entryFee: { currency: "CAD", minorUnits: 500 },
      id: "117213852100443736",
      name: "Saturday Afternoon Nexus Play @ North Park Picture Framing and Collectables",
      pricing: "PAID",
      registrantCounts: [{ count: 1, status: "REGISTERED" }],
      startsAt: "2026-10-10T19:00:00Z"
    }
  };
  if (over) { over(n); }
  return n;
}

// The fields every event in data/events.json carries (the old shape()).
const FIELDS = ["id", "name", "type", "start", "end", "day", "time", "venue", "city",
  "address", "region", "cap", "reg", "cents", "currency", "updated", "round", "wins",
  "sid", "store"];

check("the new functions exist", function () {
  ["shapeRb", "rbUrl", "rbHeaders", "eventKey"].forEach(function (f) {
    assert.strictEqual(typeof fe[f], "function", f + " is " + typeof fe[f]);
  });
});

check("shapeRb gives every field the calendar reads", function () {
  const ev = fe.shapeRb(node(), "victoria");
  const missing = FIELDS.filter(function (f) { return !(f in ev); });
  assert.deepStrictEqual(missing, []);
});

check("shapeRb fills a real event correctly", function () {
  const ev = fe.shapeRb(node(), "victoria");
  assert.strictEqual(ev.id, "rb117213852100443736");
  assert.strictEqual(ev.type, "nexus");
  assert.strictEqual(ev.start, "2026-10-10T12:00:00-07:00");
  assert.strictEqual(ev.day, "2026-10-10");
  assert.strictEqual(ev.time, "12:00 PM");
  assert.strictEqual(ev.venue, "North Park Picture Framing and Collectables");
  assert.strictEqual(ev.city, "Victoria");
  assert.strictEqual(ev.region, "victoria");
  assert.strictEqual(ev.cap, 28);
  assert.strictEqual(ev.reg, 1);
  assert.strictEqual(ev.cents, 500);
  assert.strictEqual(ev.currency, "CAD");
  assert.strictEqual(ev.end, null);
  assert.strictEqual(ev.round, null);
  assert.strictEqual(ev.wins, null);
});

check("a known store keeps its old id and short name", function () {
  const ev = fe.shapeRb(node(), "victoria");
  assert.strictEqual(ev.sid, 18437);
  assert.strictEqual(ev.store, "North Park Framing");
});

check("store names match whatever their case, Ltd. is dropped", function () {
  const a = fe.shapeRb(node(function (n) {
    n.organizer.name = "aj's games";
    n.organizer.physicalAddress.city = "Campbell River";
  }), "island");
  assert.strictEqual(a.sid, 21894);
  assert.strictEqual(a.venue, "AJ's Games");
  assert.strictEqual(a.store, "AJ's");
  const c = fe.shapeRb(node(function (n) {
    n.organizer.name = "Colossal Cards & Collectables Ltd.";
    n.organizer.physicalAddress.city = "Courtenay";
  }), "island");
  assert.strictEqual(c.sid, 902);
  assert.strictEqual(c.venue, "Colossal Cards & Collectables");
});

check("a new store keeps its PlayRiftbound id and its own name", function () {
  const ev = fe.shapeRb(node(function (n) {
    n.organizer.id = "019f-new-store";
    n.organizer.name = "Elite4 Games";
  }), "victoria");
  assert.strictEqual(ev.sid, "019f-new-store");
  assert.strictEqual(ev.venue, "Elite4 Games");
  assert.strictEqual(ev.store, null);
});

check("types: Pre-Rift is its own, the rest map, unknown falls to other", function () {
  const t = function (k) {
    return fe.shapeRb(node(function (n) { n.tournament.config.tournamentType = k; }), "victoria").type;
  };
  assert.strictEqual(t("PRE_RIFT"), "prerift");
  assert.strictEqual(t("SUMMONER_SKIRMISH"), "skirmish");
  assert.strictEqual(t("LEARN_TO_PLAY"), "learn");
  assert.strictEqual(t("OPEN_PLAY"), "open");
  assert.strictEqual(t("LOCAL_CIRCUIT_SOMETHING"), "other");
});

check("a free event costs 0 and an empty count is 0 registered", function () {
  const ev = fe.shapeRb(node(function (n) {
    n.tournament.entryFee = null;
    n.tournament.registrantCounts = [];
  }), "victoria");
  assert.strictEqual(ev.cents, 0);
  assert.strictEqual(ev.currency, "CAD");
  assert.strictEqual(ev.reg, 0);
});

check("only REGISTERED players count", function () {
  const ev = fe.shapeRb(node(function (n) {
    n.tournament.registrantCounts = [{ count: 3, status: "REGISTERED" }, { count: 2, status: "WAITLISTED" }];
  }), "victoria");
  assert.strictEqual(ev.reg, 3);
});

check("the request names RAVI, never Riot's own site", function () {
  const h = fe.rbHeaders();
  assert.strictEqual(h["apollographql-client-name"], "ravi");
  assert.strictEqual(h["Content-Type"], "application/json");
  assert.ok(/^VanIsleRiftbound\//.test(h["User-Agent"]), h["User-Agent"]);
  Object.keys(h).forEach(function (k) {
    assert.ok(!/riot|playriftbound|rgpub/i.test(String(h[k])), k + " = " + h[k]);
  });
});

check("the request asks for the anchor, its radius, the stored query and the next page", function () {
  const u = new URL(fe.rbUrl({ lat: 48.4335190525, lng: -123.4028759261, miles: 10 }, "2026-10-10T07:00:00.000Z", "CUR+1="));
  assert.strictEqual(u.origin + u.pathname, RB.base);
  assert.strictEqual(u.searchParams.get("operationName"), "CompeteTournamentSearch");
  const v = JSON.parse(u.searchParams.get("variables"));
  assert.strictEqual(v.filter.rb.coords.latitude, 48.4335190525);
  assert.strictEqual(v.filter.rb.distanceMeters, 16093);
  assert.strictEqual(v.filter.rb.startDate, "2026-10-10T07:00:00.000Z");
  assert.strictEqual(v.after, "CUR+1=");
  const x = JSON.parse(u.searchParams.get("extensions"));
  assert.strictEqual(x.persistedQuery.sha256Hash, RB.hash);
  const first = new URL(fe.rbUrl({ lat: 1, lng: 2, miles: 10 }, "2026-10-10T07:00:00.000Z", null));
  assert.strictEqual(JSON.parse(first.searchParams.get("variables")).after, undefined);
});

check("the same event from both feeds has one key", function () {
  const a = fe.shapeRb(node(), "victoria");
  const b = fe.shape({
    id: 555, name: "Nexus", event_configuration_template: "3da10c44-6e38-422f-ad46-7dc47f7f839e",
    start_datetime: "2026-10-10T19:00:00Z", store: { id: 18437, name: "North Park Picture Framing and Collectables", city: "Victoria" }
  }, "victoria");
  assert.strictEqual(fe.eventKey(a), fe.eventKey(b));
  const later = fe.shapeRb(node(function (n) { n.tournament.startsAt = "2026-10-10T20:00:00Z"; }), "victoria");
  assert.notStrictEqual(fe.eventKey(a), fe.eventKey(later));
});

if (failures) {
  console.log("PLAYRIFTBOUND FIXTURE FAILURES: " + failures);
  process.exit(1);
}
console.log("all PlayRiftbound fixture checks passed");
