"use strict";

// Fixture for store-posted events (plan 2 M8.7, Mako 2026-11-10). Runs before
// every fetch. The digest below is ravi-news 2026-11-10.json's store_events,
// trimmed; the PlayRiftbound events are the two that list the same skirmishes.
// A failure here means the digest's shape, the store match or the 7-day rule
// changed underneath us.

const assert = require("assert");
const fe = require("./fetch-events");
const ics = require("./ics");

let failures = 0;
function check(name, fn) {
  try { fn(); console.log("PASS " + name); }
  catch (err) { failures += 1; console.log("FAIL " + name + ": " + err.message); }
}

const POST = "https://facebook.com/100088865365179/posts/pfbid028";
function digest() {
  return {
    run: "2026-11-10",
    posts: [],
    store_events: [
      { cancelled: false, city: "Victoria", date: "2026-11-10", fee: "", format: "casual play", name: "Riftbound casual play", store: "Rotty's Creations", time: "5:00-8:00 PM", url: POST },
      { cancelled: false, city: "Victoria", date: "2026-11-15", fee: "", format: "skirmish", name: "Radiance Skirmish 1", store: "Skyhaven Games", time: "5:00 PM", url: "https://facebook.com/groups/1/permalink/2/" },
      { cancelled: false, city: "Victoria", date: "2026-11-16", fee: "", format: "casual (3 decks, no shared Domains)", name: "Mini-Worlds online event", store: "Skyhaven Games", time: "5:30 PM", url: "https://facebook.com/groups/1/permalink/3/" },
      { cancelled: false, city: "Victoria", date: "2026-11-17", fee: "$5", format: "casual play", name: "Riftbound casual play", store: "Rotty's Creations", time: "5:00-8:00 PM", url: POST },
      { cancelled: false, city: "Victoria", date: "2026-11-22", fee: "", format: "skirmish", name: "Riftbound Radiance Skirmish 1", store: "Colossal Cards and Collectables", time: "12:00 PM", url: "https://www.facebook.com/permalink.php?story_fbid=1&id=2" },
      { cancelled: true, city: "Victoria", date: "2026-11-24", fee: "", format: "casual play", name: "Riftbound casual play", store: "Rotty's Creations", time: "5:00-8:00 PM", url: POST },
      { cancelled: false, city: "Victoria", date: "2026-11-09", fee: "", format: "casual play", name: "Yesterday's night", store: "Rotty's Creations", time: "5:00 PM", url: POST },
      { cancelled: false, city: "Victoria", date: "2026-11-18", fee: "", format: "casual play", name: "No time given", store: "Rotty's Creations", time: "", url: POST },
      { cancelled: false, city: "Vancouver", date: "2026-11-18", fee: "", format: "casual play", name: "Off the island", store: "Some Store", time: "5:00 PM", url: POST },
      { cancelled: false, city: "Courtenay", date: "2026-11-19", fee: "", format: "league night", name: "Thursday league", store: "A New Store Ltd.", time: "6:30 PM", url: "javascript:alert(1)" }
    ]
  };
}
function rb() {
  return [
    { id: "rb1175", name: "Radiance Skirmish #1", type: "skirmish", start: "2026-11-15T18:00:00-07:00", day: "2026-11-15", venue: "Skyhaven Games", city: "Victoria", region: "victoria", sid: 4294 },
    { id: "rb1176", name: "Colossal Cards Victoria Radiance Skirmish 1", type: "skirmish", start: "2026-11-22T12:00:00-07:00", day: "2026-11-22", venue: "Colossal Cards & Collectables", city: "Victoria", region: "victoria", sid: 15103 }
  ];
}
function byName(list, n) { return list.filter(function (e) { return e.name === n; }); }

check("store events: Rotty's two nights come through, in the events' own shape", function () {
  const out = fe.storeEvents(digest(), rb(), "2026-11-10");
  const r = out.filter(function (e) { return e.venue === "Rotty's Creations"; });
  assert.strictEqual(r.length, 2, "Rotty's events: " + r.length);
  const a = r[0];
  assert.ok(/^st\d{12}$/.test(a.id), "id " + a.id);
  assert.strictEqual(a.type, "open");
  assert.strictEqual(a.day, "2026-11-10");
  assert.strictEqual(a.time, "5:00 PM");
  assert.strictEqual(a.start, "2026-11-10T17:00:00-07:00");
  assert.strictEqual(a.end, "2026-11-10T20:00:00-07:00");
  assert.strictEqual(a.city, "Victoria");
  assert.strictEqual(a.region, "victoria");
  assert.strictEqual(a.cap, null);
  assert.strictEqual(a.reg, 0);
  assert.strictEqual(a.cents, 0);
  assert.strictEqual(a.src, "store");
  assert.strictEqual(a.url, POST);
  assert.strictEqual(a.conf, "2026-11-10");
  assert.strictEqual(a.store, "Rotty's");
  assert.strictEqual(r[1].cents, 500, "a fee of $5 is 500 cents");
  assert.notStrictEqual(r[0].id, r[1].id);
  assert.strictEqual(r[0].sid, r[1].sid, "one store id for both nights");
  assert.ok(/^[A-Za-z0-9_-]+$/.test(String(a.sid)), "sid is safe for a file name: " + a.sid);
});

check("store events: the store's own PlayRiftbound listing wins that day", function () {
  const out = fe.storeEvents(digest(), rb(), "2026-11-10");
  assert.strictEqual(byName(out, "Radiance Skirmish 1").length, 0, "Skyhaven's skirmish is on PlayRiftbound");
  assert.strictEqual(byName(out, "Riftbound Radiance Skirmish 1").length, 0, "Colossal's skirmish is on PlayRiftbound ('and' against '&')");
  const alone = fe.storeEvents(digest(), [], "2026-11-10");
  const c = byName(alone, "Riftbound Radiance Skirmish 1")[0];
  assert.ok(c, "with no PlayRiftbound listing it comes through");
  assert.strictEqual(c.sid, 15103, "a known store keeps its id");
  assert.strictEqual(c.venue, "Colossal Cards & Collectables");
  assert.strictEqual(c.type, "other");
});

check("store events: cancelled, past, untimed, online and off-island entries are left out", function () {
  const out = fe.storeEvents(digest(), rb(), "2026-11-10");
  ["Mini-Worlds online event", "Yesterday's night", "No time given", "Off the island"].forEach(function (n) {
    assert.strictEqual(byName(out, n).length, 0, n);
  });
  assert.strictEqual(out.filter(function (e) { return e.day === "2026-11-24"; }).length, 0, "the cancelled night");
});

check("store events: a new store gets a stable id, its region from its city, and only an https link", function () {
  const out = fe.storeEvents(digest(), rb(), "2026-11-10");
  const n = byName(out, "Thursday league")[0];
  assert.ok(n, "the new store's event");
  assert.strictEqual(n.venue, "A New Store");
  assert.strictEqual(n.region, "island");
  assert.strictEqual(n.store, null);
  assert.strictEqual(n.url, null, "a link that is not https is dropped");
  assert.strictEqual(n.time, "6:30 PM");
  assert.strictEqual(n.end, null);
  assert.strictEqual(fe.storeEvents(digest(), rb(), "2026-11-10").filter(function (e) { return e.name === "Thursday league"; })[0].id, n.id, "the same id on every run");
});

check("store events: every island town counts, in its area", function () {
  const d = digest();
  d.store_events = [["Nanaimo", "island"], ["Duncan", "island"], ["Sidney", "victoria"], ["Port Alberni", "island"], ["Vancouver", null]].map(function (c, i) {
    return { cancelled: false, city: c[0], date: "2026-11-1" + (2 + i), fee: "", format: "casual play", name: "Night " + i, store: "Store " + i, time: "6:00 PM", url: POST };
  });
  const out = fe.storeEvents(d, [], "2026-11-10");
  assert.deepStrictEqual(out.map(function (e) { return e.city + ":" + e.region; }), ["Nanaimo:island", "Duncan:island", "Sidney:victoria", "Port Alberni:island"]);
});

check("store events: a digest older than 7 days gives nothing", function () {
  assert.strictEqual(fe.storeEvents(digest(), rb(), "2026-11-17").length, 2, "7 days on, the Nov 17 and Nov 19 nights still show");
  assert.strictEqual(fe.storeEvents(digest(), rb(), "2026-11-18").length, 0, "8 days on, nothing");
  assert.strictEqual(fe.storeEvents({ run: "2026-11-10" }, rb(), "2026-11-10").length, 0, "no store_events list");
  assert.strictEqual(fe.storeEvents(null, rb(), "2026-11-10").length, 0, "no digest");
});

check("store events: times read the ways stores write them", function () {
  assert.deepStrictEqual(fe.storeTime("5:00 PM"), { start: "17:00", end: null });
  assert.deepStrictEqual(fe.storeTime("5:00-8:00 PM"), { start: "17:00", end: "20:00" });
  assert.deepStrictEqual(fe.storeTime("5-8 PM"), { start: "17:00", end: "20:00" });
  assert.deepStrictEqual(fe.storeTime("11:00 AM - 2:00 PM"), { start: "11:00", end: "14:00" });
  assert.deepStrictEqual(fe.storeTime("11-2 PM"), { start: "11:00", end: "14:00" });
  assert.deepStrictEqual(fe.storeTime("12:00 PM"), { start: "12:00", end: null });
  assert.strictEqual(fe.storeTime("evening"), null);
  assert.strictEqual(fe.storeTime(""), null);
  assert.strictEqual(fe.storeTime("25:00 PM"), null);
});

check("store events: when the digest cannot be read, last run's confirmed nights stay for their 7 days", function () {
  const prev = fe.storeEvents(digest(), rb(), "2026-11-10");
  const kept = fe.carryStore(prev.concat(rb()), rb(), "2026-11-12");
  assert.strictEqual(kept.length, 2, "Nov 17 and Nov 19 stay: " + kept.map(function (e) { return e.day; }).join(","));
  assert.strictEqual(fe.carryStore(prev, rb(), "2026-11-18").length, 0, "not past 7 days from the confirming run");
});

check("store events: the calendar file links the store's post, never PlayRiftbound", function () {
  const ev = fe.storeEvents(digest(), rb(), "2026-11-10")[0];
  const text = ics.buildFeed(null, [ev], null, null);
  assert.ok(text.indexOf("playriftbound.com") === -1 && text.indexOf("locator.riftbound") === -1, "no Riot link");
  assert.ok(text.replace(/\r\n /g, "").indexOf("URL:" + POST) !== -1, "URL is the store's post");
  assert.ok(/From the store's own post/.test(text.replace(/\r\n /g, "")), "says where it is from");
  assert.ok(text.indexOf("DTEND;TZID=America/Vancouver:20261110T200000") !== -1, "ends at 8");
});

check("store events: a store's post under a shorter spelling of its name is still that store (2026-11-12)", function () {
  // North Park's own post said 'North Park Framing and Collectibles'; PlayRiftbound lists
  // 'North Park Picture Framing and Collectables'. The night showed twice.
  const d = { run: "2026-11-12", posts: [], store_events: [
    { cancelled: false, city: "Victoria", date: "2026-11-12", fee: "", format: "open play", name: "Open Play", store: "North Park Framing and Collectibles", time: "6:00 PM", url: POST }
  ] };
  const listed = [{ id: "rb1177", name: "North Park Picture Framing and Collectables Open Play", type: "open", start: "2026-11-12T18:00:00-08:00", day: "2026-11-12", venue: "North Park Picture Framing and Collectables", city: "Victoria", region: "victoria", sid: 18437 }];
  assert.strictEqual(fe.storeEvents(d, listed, "2026-11-12").length, 0, "the night PlayRiftbound lists is not added again");
  const alone = fe.storeEvents(d, [], "2026-11-12");
  assert.strictEqual(alone.length, 1, "with no listing the post comes through");
  assert.strictEqual(alone[0].sid, 18437, "as North Park's own store");
  assert.strictEqual(alone[0].venue, "North Park Picture Framing and Collectables", "under the name PlayRiftbound uses");
});

check("store events: a store's post naming another town than PlayRiftbound's is still that store (2026-11-12)", function () {
  // Elite4's own post put it in Langford (its street address is); PlayRiftbound lists Elite4 Games
  // in Victoria. The Saturday skirmish showed twice (Mako's phone, 2026-11-12 21:02).
  const d = { run: "2026-11-12", posts: [], store_events: [
    { cancelled: false, city: "Langford", date: "2026-11-14", fee: "$20", format: "", name: "Radiance Summoner Skirmish I", store: "Elite4 Games", time: "10:30 AM", url: POST }
  ] };
  const listed = [{ id: "rb117089941548488590", name: "Radiance Summoner Skirmish I", type: "skirmish", start: "2026-11-14T10:30:00-07:00", day: "2026-11-14", venue: "Elite4 Games", city: "Victoria", sid: "019fb060-927e-7709-b9cb-32c53ec8c895" }];
  assert.strictEqual(fe.storeEvents(d, listed, "2026-11-12").length, 0, "the skirmish PlayRiftbound lists is not added again");
  const prev = fe.storeEvents(d, [], "2026-11-12");
  assert.strictEqual(prev.length, 1, "with no listing the post comes through");
  assert.strictEqual(fe.carryStore(prev, listed, "2026-11-12").length, 0, "nor is last run's copy carried beside it");
  // two stores of one name in two towns: a name alone never decides it, so each town keeps its own
  const two = [{ id: "rb1", name: "Skirmish", type: "skirmish", day: "2026-11-14", venue: "Colossal Cards & Collectables", city: "Victoria", sid: 15103 },
    { id: "rb2", name: "Skirmish", type: "skirmish", day: "2026-11-15", venue: "Colossal Cards & Collectables", city: "Courtenay", sid: 902 }];
  const dc = { run: "2026-11-12", posts: [], store_events: [
    { cancelled: false, city: "Nanaimo", date: "2026-11-14", fee: "", format: "", name: "Open Play", store: "Colossal Cards & Collectables", time: "6:00 PM", url: POST }
  ] };
  assert.strictEqual(fe.storeEvents(dc, two, "2026-11-12").length, 1, "a store name two towns share is not matched by name alone");
});

if (failures) {
  console.log(failures + " failed");
  process.exit(1);
}
console.log("all store-event checks passed");
