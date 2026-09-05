"use strict";

// Riftbound price data for Van Isle Riftbound.
// Reads TCGCSV, a public mirror of the TCGplayer catalogue, plus the Bank of
// Canada Valet API for the USD to CAD rate, and writes data/prices.json.
//
// Pricing is TCGplayer MARKET PRICE and nothing else. There is deliberately
// no fallback to mid or low price: a product with no market price is left out
// rather than quietly priced from a different number. Do not add a fallback.
//
// Never reads or writes data/events.json, the ICS feeds, index.html, or
// anything under counter/.

const fs = require("fs");
const path = require("path");

const CATEGORY = 89; // Riftbound on TCGplayer
const BASE = "https://tcgcsv.com/tcgplayer/" + CATEGORY;
const FX_URL = "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1";
const UA = "VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)";
const GAP_MS = 150; // courtesy delay between TCGCSV requests
const MIN_PRICED = 800; // floor; below this we refuse to overwrite a good file
const TZ = "America/Vancouver";

const OUT_DIR = path.join(__dirname, "data");
const OUT_FILE = path.join(OUT_DIR, "prices.json");

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

async function getJSON(url) {
  const res = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": UA }
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
  return await res.json();
}

// Pulls a named field out of a product's extendedData key-value list.
function ext(product, name) {
  const list = Array.isArray(product.extendedData) ? product.extendedData : [];
  for (const e of list) {
    if (e && e.name === name) return String(e.value == null ? "" : e.value);
  }
  return "";
}

async function fxRate() {
  const d = await getJSON(FX_URL);
  const obs = d && Array.isArray(d.observations) ? d.observations : [];
  if (!obs.length) throw new Error("no FX observation returned");
  const o = obs[obs.length - 1];
  const cell = o["FXUSDCAD"];
  const v = cell ? Number(cell.v) : NaN;
  if (!isFinite(v) || v <= 0) throw new Error("FX rate is not a usable number");
  return { rate: v, date: String(o.d || "") };
}

// Reads the previous file so the payload can carry the prior count forward.
// Never throws: a missing, empty or unparseable file yields null.
function priorPriced(file) {
  try {
    const prev = JSON.parse(fs.readFileSync(file, "utf8"));
    const n = prev && prev.totals ? prev.totals.priced : null;
    return (typeof n === "number" && isFinite(n)) ? n : null;
  } catch (e) {
    return null;
  }
}

const BASELINE_DAYS = Number(process.env.VIRB_BASELINE_DAYS || 7);

// Reads the previous file whole. Never throws; returns null if the file
// is missing, empty or unparseable.
function priorAll(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return null;
  }
}

// Attaches a frozen baseline price to every card and returns the date
// that baseline describes. Three cases:
//   no usable prior baseline -> seed from today's prices, dated now
//   baseline older than the limit -> roll forward to the prior run's
//     prices, dated by the prior run
//   otherwise -> carry the prior baseline through untouched
function attachBaseline(cards, prev, nowIso) {
  const prevCards = (prev && Array.isArray(prev.cards)) ? prev.cards : null;
  const prevAt = (prev && typeof prev.baseline_at === "string") ? prev.baseline_at : null;
  let ageDays = Infinity;
  if (prevAt) {
    const t = Date.parse(prevAt);
    if (isFinite(t)) ageDays = (Date.parse(nowIso) - t) / 86400000;
  }
  if (!prevCards || !prevAt) {
    for (const c of cards) c.b = Object.assign({}, c.p);
    return nowIso;
  }
  // The all-time anchor never rolls. It is the oldest price we hold,
  // so it means "since we started tracking". The 1/7/30/365 anchors
  // come from the daily log instead -- see attachAnchors.
  const roll = false;
  const src = new Map();
  for (const pc of prevCards) {
    const from = roll ? pc.p : pc.b;
    if (from) src.set(pc.i, from);
  }
  for (const c of cards) {
    const from = src.get(c.i);
    const out = {};
    if (from) {
      for (const k of Object.keys(c.p)) {
        if (typeof from[k] === "number") out[k] = from[k];
      }
    }
    c.b = out;
  }
  return roll ? (typeof prev.generated_at === "string" ? prev.generated_at : prevAt) : prevAt;
}

const WINDOWS = [1, 7, 30, 365];

// Reads the daily log and attaches the price each card carried at each
// window. Returns a map of window to the ACTUAL DATE used, which the
// page shows instead of claiming a fixed period.
//
// THE COMPACTION RULE, and the page depends on it: if a window appears
// in the returned map, it resolved. A card with NO entry for that
// window was unchanged. A card carrying null for that window was not
// in the log that day and has no reading. Absence and unknown are
// different things and must stay that way.
function attachAnchors(cards, nowIso) {
  const dir = path.join(OUT_DIR, "log");
  let days = [];
  try {
    days = fs.readdirSync(dir)
      .filter(function (f) { return /^\d{4}-\d{2}-\d{2}\.json$/.test(f); })
      .map(function (f) { return f.slice(0, 10); })
      .sort();
  } catch (e) {
    return {};
  }
  const today = String(nowIso).slice(0, 10);
  const used = {};
  for (const w of WINDOWS) {
    const cut = new Date(Date.parse(today + "T00:00:00Z") - w * 86400000)
      .toISOString().slice(0, 10);
    let pick = null;
    for (const d of days) {
      if (d <= cut) pick = d;
    }
    if (!pick) continue;
    let src = null;
    try {
      const o = JSON.parse(fs.readFileSync(path.join(dir, pick + ".json"), "utf8"));
      src = (o && o.p) ? o.p : null;
    } catch (e) {
      src = null;
    }
    if (!src) continue;
    used[w] = pick;
    for (const c of cards) {
      const from = src[c.i];
      if (!from) {
        if (!c.a) c.a = {};
        c.a[w] = null;
        continue;
      }
      let same = true;
      for (const k of Object.keys(c.p)) {
        if (from[k] !== c.p[k]) { same = false; break; }
      }
      if (same) continue;
      const rec = {};
      for (const k of Object.keys(c.p)) {
        if (typeof from[k] === "number") rec[k] = from[k];
      }
      if (!c.a) c.a = {};
      c.a[w] = rec;
    }
  }
  return used;
}

function writeDayLog(payload) {
  const dir = path.join(OUT_DIR, "log");
  fs.mkdirSync(dir, { recursive: true });
  const day = String(payload.generated_at).slice(0, 10);
  const file = path.join(dir, day + ".json");
  if (fs.existsSync(file)) return "already present";
  const p = {};
  for (const c of payload.cards) p[c.i] = c.p;
  const out = { v: 1, at: payload.generated_at, d: day, p: p };
  fs.writeFileSync(file, JSON.stringify(out) + "\n", "utf8");
  return "written";
}

async function main() {
  const fx = await fxRate();
  console.log("fx USDCAD " + fx.rate + " as of " + fx.date);

  const gjson = await getJSON(BASE + "/groups");
  const groups = Array.isArray(gjson.results) ? gjson.results : [];
  if (!groups.length) throw new Error("no groups returned for category " + CATEGORY);

  const sets = [];
  const cards = [];
  let unpriced = 0;

  for (const g of groups) {
    await sleep(GAP_MS);
    const pj = await getJSON(BASE + "/" + g.groupId + "/products");
    await sleep(GAP_MS);
    const cj = await getJSON(BASE + "/" + g.groupId + "/prices");

    const products = Array.isArray(pj.results) ? pj.results : [];
    const rows = Array.isArray(cj.results) ? cj.results : [];

    // One product can carry several priced printings, keyed by subtype.
    const priceById = new Map();
    for (const row of rows) {
      const m = row.marketPrice;
      if (typeof m !== "number" || !isFinite(m) || m <= 0) continue;
      const key = String(row.productId);
      const sub = String(row.subTypeName || "Normal");
      let bucket = priceById.get(key);
      if (!bucket) { bucket = {}; priceById.set(key, bucket); }
      bucket[sub] = Math.round(m * 100) / 100;
    }

    let kept = 0;
    for (const p of products) {
      const bucket = priceById.get(String(p.productId));
      if (!bucket) { unpriced++; continue; }
      const num = ext(p, "Number");
      const rar = ext(p, "Rarity");
      cards.push({
        i: p.productId,
        g: g.groupId,
        n: String(p.name || ""),
        c: num,
        r: rar,
        k: (num || rar) ? 1 : 0, // 1 single card, 0 sealed or other product
        p: bucket
      });
      kept++;
    }

    sets.push({
      g: g.groupId,
      n: String(g.name || ""),
      a: String(g.abbreviation || ""),
      p: String(g.publishedOn || ""),
      count: kept
    });
    console.log("set " + g.groupId + " " + g.name + " kept " + kept + " of " + products.length);
  }

  if (cards.length < MIN_PRICED) {
    throw new Error("only " + cards.length + " priced products, floor is " + MIN_PRICED);
  }

  cards.sort(function (a, b) { return (a.g - b.g) || (a.i - b.i); });
  sets.sort(function (a, b) { return a.g - b.g; });

  const now = new Date();
  const prevAllFile = priorAll(OUT_FILE);
  const baselineAt = attachBaseline(cards, prevAllFile, now.toISOString());
  const anchors = attachAnchors(cards, now.toISOString());
  const payload = {
    generated_at: now.toISOString(),
    baseline_at: baselineAt,
    anchors: anchors,
    generated_local: now.toLocaleString("en-CA", { timeZone: TZ }),
    source: "TCGplayer market price via tcgcsv.com, category " + CATEGORY,
    fx: { pair: "USDCAD", rate: fx.rate, date: fx.date, source: "Bank of Canada Valet" },
    totals: {
      sets: sets.length,
      priced: cards.length,
      unpriced: unpriced,
      prev_priced: priorPriced(OUT_FILE)
    },
    sets: sets,
    cards: cards
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Written compact on purpose, unlike events.json. This file is 1500-plus
  // records committed daily and no human reads it by hand.
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload) + "\n", "utf8");
  // One price file per UTC day, written once and never rewritten.
  // Nothing on the site reads it. It exists because the past cannot be
  // invented later. A failure here must never fail the price publish.
  try {
    console.log("day log " + writeDayLog(payload));
  } catch (e) {
    console.log("day log failed: " + e.message);
  }
  console.log("wrote " + OUT_FILE + " " + fs.statSync(OUT_FILE).size + " bytes, " +
    cards.length + " priced, " + unpriced + " unpriced");
}

main().catch(function (e) {
  console.error("PRICE FETCH FAILED: " + e.message);
  console.error("data/prices.json left untouched");
  process.exit(1);
});
