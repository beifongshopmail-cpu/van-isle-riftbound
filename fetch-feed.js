"use strict";

// fetch-feed.js -- the source scanner (from M9).
// Reads two places and writes data/feed.json, a list of Riot's own posts:
//
// 1. A Discord channel in Mako's private server (#riot-feed), which follows
//    the announcement channels of the largest Riftbound community server.
//    That server is NOT Riot's, so its words are never kept: only links to
//    Riot's own pages and accounts (RIOT below) and the day they were posted.
//    A post reaches the channel either FOLLOWED (a crosspost, flag 2) or
//    FORWARDED by hand (message_snapshots); both are read.
// 2. Muse's daily files in Mako's private records repo
//    (mako-records/ravi/muse/facebook/YYYY-MM-DD.json): Riot's official
//    Facebook posts, kept word for word and credited.
//
// The same Riot link seen in both places becomes one item. Nothing is ever
// rewritten. Every run re-reads the last 100 Discord messages and the last
// 30 Muse files and merges them into the file, so there is no saved
// position: a quiet run produces the same file and leaves nothing to commit.
//
// RAVI names itself honestly: Discord gets the user agent form Discord asks
// bots for, naming RAVI; GitHub gets RAVI's own user agent.
//
// FAILURE: a missing key, or Discord or GitHub refusing a read, fails the
// run and the last file stays. A Muse file that is not valid JSON in the
// agreed shape is skipped with a WARN line; the rest of the run goes on.

const fs = require("fs");
const path = require("path");
const { RB } = require("./config");

const CHANNEL = "1558738517679415407"; // #riot-feed in Mako's RAVI feed server
const RECORDS = "beifongshopmail-cpu/mako-records";
const MUSE_DIR = "ravi/muse/facebook";
const MUSE_FILES = 30;
const DISCORD_UA = "DiscordBot (https://github.com/beifongshopmail-cpu/van-isle-riftbound, 1.0) VanIsleRiftbound/1.0";

// Test and recon overrides.
const DISCORD = process.env.FEED_DISCORD_BASE || "https://discord.com/api/v10";
const GITHUB = process.env.FEED_GITHUB_BASE || "https://api.github.com";
const OUT_FILE = process.env.FEED_OUT || path.join(__dirname, "data", "feed.json");
const TODAY = process.env.FEED_TODAY || "";

// Riot's own places. A host alone, or a host plus the account path.
// Not sure of every Riftbound social handle: add one here when it shows up.
const RIOT = [
  { host: "playriftbound.com" },
  { host: "riot.com" },
  { host: "riotgames.com" },
  { host: "riftbound.leagueoflegends.com" },
  { host: "facebook.com", path: "/playriftbound" },
  { host: "instagram.com", path: "/playriftbound" },
  { host: "x.com", path: "/playriftbound" },
  { host: "twitter.com", path: "/playriftbound" },
  { host: "youtube.com", path: "/@playriftbound" }
];
const KINDS = ["event", "announcement", "rules", "product", "market"];

// ---- links ----

function linksOf(s) {
  const out = [];
  String(s || "").replace(/https?:\/\/[^\s<>()"'\]]+/g, function (u) {
    u = u.replace(/[.,;:!?*_~]+$/, "");
    if (out.indexOf(u) === -1) { out.push(u); }
    return u;
  });
  return out;
}

// One spelling per page: https, lower-case host without www, no query or
// fragment, playriftbound.com paths lower-case with a trailing slash.
function norm(u) {
  let x;
  try { x = new URL(u); } catch (e) { return null; }
  const host = x.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  let p = x.pathname.replace(/\/+$/, "");
  if (host === "playriftbound.com") { p = p.toLowerCase() + "/"; }
  return "https://" + host + (p || "/");
}

function isRiot(u) {
  const n = norm(u);
  if (!n) { return false; }
  const x = new URL(n);
  return RIOT.some(function (r) {
    const hostOk = x.hostname === r.host || x.hostname.endsWith("." + r.host);
    if (!hostOk) { return false; }
    if (!r.path) { return true; }
    const p = x.pathname.toLowerCase();
    return p === r.path || p.indexOf(r.path + "/") === 0;
  });
}

function kindOf(u) {
  const p = new URL(norm(u)).pathname;
  if (/errata|faq|rules|patch-notes|ban|legality|clarification/.test(p)) { return "rules"; }
  if (/event|tournament|regional|championship|nexus-night|skirmish/.test(p)) { return "event"; }
  return "announcement";
}

// ---- Discord ----

// FOLLOWED: a crosspost from a followed channel (flag 2).
// FORWARDED: a message forwarded by hand (message_snapshots).
function shapeOf(m) {
  if (m.message_snapshots && m.message_snapshots.length) { return "forwarded"; }
  if ((m.flags || 0) & 2) { return "followed"; }
  return "plain";
}

function discordText(m) {
  const parts = [m.content || ""];
  function embeds(list) {
    (list || []).forEach(function (e) { parts.push(e.url || "", e.description || "", e.title || ""); });
  }
  embeds(m.embeds);
  (m.message_snapshots || []).forEach(function (s) {
    const x = s.message || {};
    parts.push(x.content || "");
    embeds(x.embeds);
  });
  return parts.join(" ");
}

function postedOf(m) {
  const s = (m.message_snapshots && m.message_snapshots[0] && m.message_snapshots[0].message && m.message_snapshots[0].message.timestamp) || m.timestamp;
  return day(s);
}

function day(iso) {
  const d = new Date(iso);
  if (isNaN(d)) { return ""; }
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

// Only the Riot links are kept; the server's own words are not.
function itemsFromDiscord(messages) {
  const items = [];
  messages.forEach(function (m) {
    const shape = shapeOf(m);
    linksOf(discordText(m)).filter(isRiot).forEach(function (u) {
      const url = norm(u);
      if (items.some(function (i) { return i.url === url; })) { return; }
      items.push({ id: "link:" + url, kind: kindOf(url), url: url, posted: postedOf(m), via: ["discord"], shape: shape });
    });
  });
  return items;
}

// ---- Muse ----

function checkMuse(d) {
  if (!d || typeof d !== "object" || !/^\d{4}-\d{2}-\d{2}$/.test(d.run || "") || !Array.isArray(d.posts)) { return "not the agreed shape (run, posts)"; }
  for (let i = 0; i < d.posts.length; i++) {
    const p = d.posts[i];
    if (!p || typeof p.url !== "string" || typeof p.text !== "string" || typeof p.source !== "string") { return "post " + i + " lacks source, url or text"; }
    if (KINDS.indexOf(p.kind) === -1) { return "post " + i + " has kind " + JSON.stringify(p.kind); }
  }
  return "";
}

function itemsFromMuse(d) {
  return d.posts.map(function (p) {
    const url = norm(p.url) || p.url;
    const links = linksOf(p.text).filter(isRiot).map(norm).filter(function (u, i, a) { return u && a.indexOf(u) === i && u !== url; });
    const it = { id: "fb:" + url, kind: p.kind, url: url, posted: p.posted || d.run, source: p.source, credit: "Riot, on Facebook", text: p.text, via: ["muse"] };
    if (links.length) { it.links = links; }
    return it;
  });
}

// ---- merging ----

// A Discord link that a Muse post links to, or is, folds into that post.
function merge(prev, fresh) {
  const byId = {};
  const out = [];
  function add(it) {
    const was = byId[it.id];
    if (!was) { byId[it.id] = JSON.parse(JSON.stringify(it)); out.push(byId[it.id]); return; }
    it.via.forEach(function (v) { if (was.via.indexOf(v) === -1) { was.via.push(v); } });
    if (it.text && !was.text) { Object.assign(was, it, { via: was.via }); }
  }
  prev.concat(fresh).forEach(add);
  const posts = out.filter(function (i) { return i.id.indexOf("fb:") === 0; });
  const kept = out.filter(function (i) {
    if (i.id.indexOf("link:") !== 0) { return true; }
    const home = posts.filter(function (p) { return p.url === i.url || (p.links || []).indexOf(i.url) !== -1; })[0];
    if (!home) { return true; }
    if (home.via.indexOf("discord") === -1) { home.via.push("discord"); }
    return false;
  });
  kept.forEach(function (i) { i.via.sort(); });
  kept.sort(function (a, b) { return (b.posted || "").localeCompare(a.posted || "") || a.id.localeCompare(b.id); });
  return kept;
}

// ---- reading ----

async function get(url, headers) {
  const res = await fetch(url, { headers: headers });
  if (!res.ok) { throw new Error(res.status + " from " + url.replace(/\?.*$/, "")); }
  return res.json();
}

async function readDiscord(token) {
  return get(DISCORD + "/channels/" + CHANNEL + "/messages?limit=100", { "Authorization": "Bot " + token, "User-Agent": DISCORD_UA });
}

async function readMuse(token) {
  const h = { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json", "User-Agent": RB.ua, "X-GitHub-Api-Version": "2022-11-28" };
  const list = await get(GITHUB + "/repos/" + RECORDS + "/contents/" + MUSE_DIR, h);
  const names = list.filter(function (f) { return f.type === "file" && /^\d{4}-\d{2}-\d{2}\.json$/.test(f.name); })
    .map(function (f) { return f.name; }).sort().slice(-MUSE_FILES);
  const items = [];
  let warn = 0;
  for (const name of names) {
    const f = await get(GITHUB + "/repos/" + RECORDS + "/contents/" + MUSE_DIR + "/" + name, h);
    let d = null;
    try { d = JSON.parse(Buffer.from(f.content || "", "base64").toString("utf8")); } catch (e) {}
    const bad = d ? checkMuse(d) : "not valid JSON";
    if (bad) { console.log("WARN muse " + name + " skipped: " + bad); warn++; continue; }
    itemsFromMuse(d).forEach(function (it) { items.push(it); });
  }
  return { items: items, files: names.length, warn: warn };
}

async function main() {
  const dt = process.env.DISCORD_TOKEN, rt = process.env.RECORDS_TOKEN;
  if (!dt || !rt) { throw new Error("missing key: " + [!dt ? "DISCORD_TOKEN" : "", !rt ? "RECORDS_TOKEN" : ""].filter(Boolean).join(" and ")); }

  const msgs = await readDiscord(dt);
  const shapes = { followed: 0, forwarded: 0, plain: 0 };
  msgs.forEach(function (m) { shapes[shapeOf(m)]++; });
  const fromDiscord = itemsFromDiscord(msgs);
  console.log("discord: " + msgs.length + " messages (followed " + shapes.followed + ", forwarded " + shapes.forwarded + ", plain " + shapes.plain + "); Riot links kept " + fromDiscord.length);

  const muse = await readMuse(rt);
  console.log("muse: " + muse.files + " files, " + muse.items.length + " posts" + (muse.warn ? ", " + muse.warn + " skipped" : ""));

  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch (e) {}
  const before = prev ? prev.items : [];
  const items = merge(before, fromDiscord.concat(muse.items));
  const oldIds = before.map(function (i) { return i.id; });
  const fresh = items.filter(function (i) { return oldIds.indexOf(i.id) === -1; });
  const rules = fresh.some(function (i) { return i.kind === "rules"; });
  if (process.env.GITHUB_OUTPUT) { fs.appendFileSync(process.env.GITHUB_OUTPUT, "rules=" + (rules ? "yes" : "no") + "\n"); }

  if (prev && JSON.stringify(prev.items) === JSON.stringify(items)) { console.log("no change; nothing written"); return; }
  const today = TODAY || day(new Date().toISOString());
  const out = { updated: today, note: "Riot's own posts. Facebook text is Riot's, word for word; Discord gives only the link and the day.", items: items };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + "\n");
  console.log("wrote " + items.length + " items (" + fresh.length + " new" + (rules ? ", rules among them" : "") + ")");
}

if (require.main === module) {
  main().catch(function (err) {
    console.log("FAILED " + err.message);
    process.exit(1);
  });
}

module.exports = { linksOf, norm, isRiot, kindOf, shapeOf, discordText, itemsFromDiscord, checkMuse, itemsFromMuse, merge, day, CHANNEL };
