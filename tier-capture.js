"use strict";

// tier-capture.js -- ONE-OFF recon for M17 (removed once the fixture is in rb-tools).
// Reads TopDeck.gg's tournaments API once and writes data/tier-sample.json with
// every player name, id and decklist removed, so the real response shape can be
// studied and turned into a test fixture without publishing anyone's name.

const fs = require("fs");
const path = require("path");

const KEY = process.env.TOPDECK_API_KEY || "";
const OUT = path.join(__dirname, "data", "tier-sample.json");
const DROP = /^(name|id|uid|username|discord|email|decklist|deckObj|deckSnapshot|player|players|opponent|opponents)$/i;

function scrubStanding(s) {
  const o = {};
  Object.keys(s || {}).forEach(function (k) {
    if (DROP.test(k)) { o[k] = "(removed)"; return; }
    o[k] = s[k];
  });
  return o;
}

function scrubEvent(t, full) {
  const o = {};
  Object.keys(t || {}).forEach(function (k) {
    if (k === "standings" && Array.isArray(t[k])) {
      o[k] = (full ? t[k] : t[k].slice(0, 12)).map(scrubStanding);
      o.standingsCount = t[k].length;
      return;
    }
    if (k === "rounds") { o[k] = "(removed; " + (Array.isArray(t[k]) ? t[k].length : 0) + " rounds)"; return; }
    if (DROP.test(k) && k !== "name") { o[k] = "(removed)"; return; }
    o[k] = t[k];
  });
  return o;
}

async function ask(body) {
  const res = await fetch("https://topdeck.gg/api/v2/tournaments", {
    method: "POST",
    headers: {
      "Authorization": KEY,
      "Content-Type": "application/json",
      "User-Agent": "VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)"
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { json = null; }
  return { status: res.status, json: json, text: json ? "" : text.slice(0, 400) };
}

(async function () {
  if (!KEY) { console.error("no TOPDECK_API_KEY"); process.exit(1); }
  const body = { game: "Riftbound", format: "Constructed", last: 30, participantMin: 16,
    columns: ["wins", "draws", "losses"] };
  const r = await ask(body);
  const out = { capturedAt: new Date().toISOString(), request: body, status: r.status, error: r.text };
  if (Array.isArray(r.json)) {
    out.count = r.json.length;
    out.keysSeen = {};
    r.json.forEach(function (t) {
      Object.keys(t).forEach(function (k) { out.keysSeen["event." + k] = (out.keysSeen["event." + k] || 0) + 1; });
      (t.standings || []).forEach(function (s) {
        Object.keys(s).forEach(function (k) { out.keysSeen["standing." + k] = (out.keysSeen["standing." + k] || 0) + 1; });
      });
    });
    out.leaders = {};
    r.json.forEach(function (t) {
      (t.standings || []).forEach(function (s) {
        const l = typeof s.leader === "string" ? s.leader : "(none)";
        out.leaders[l] = (out.leaders[l] || 0) + 1;
      });
    });
    out.events = r.json.map(function (t, i) { return scrubEvent(t, i < 3); });
  } else if (r.json) {
    out.body = r.json;
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
  console.log("status " + r.status + ", events " + (out.count || 0));
})().catch(function (e) { console.error(e && e.message); process.exit(1); });
