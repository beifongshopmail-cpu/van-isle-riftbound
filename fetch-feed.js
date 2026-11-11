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
// 2. Muse's daily digest in the public repo beifongshopmail-cpu/ravi-news
//    (<YYYY-MM-DD>.json at its root; moved there from mako-records on
//    2026-11-08, Mako). Riot's official posts on its site, Facebook,
//    Instagram, YouTube and X, kept word for word and credited to the place
//    each was posted. One announcement is one entry: its canonical address in
//    url, every platform's address in links. Each entry carries a tier:
//    official entries are News; community entries are left out. An entry
//    without a tier (before 2026-11-08) is official.
//    LOCAL entries (plan 2 M9 block 1, Mako 2026-11-10) are the island's
//    stores' own posts, every store alike. A store's words are never kept or
//    shown, only RAVI's short summary and the way to the post: News is a quick
//    look at whether to go and read it, never a copy of a store's page or
//    group. So a local post waits until Claude has written its summary (no
//    first-sentence stand-in), its text is dropped before the file is written,
//    standings (players' names and placings) are never read at all, and a
//    post Claude finds is only results or only a schedule (the calendar has
//    those) is held: kept in the file with hold and no words, so it is not
//    asked about again. Claude also names the last day a post still matters
//    (until), when it is plainly about one dated thing: the page drops a
//    local post a week after it was posted, or after that day if later.
//
// Riot's short links (riot.com/...) are followed one step, as RAVI, to the
// page they stand for, so a short link on Facebook and the full address on
// Discord meet as one item. A short link that will not resolve is kept as it
// is, with a WARN line.
//
// The same Riot link seen in both places becomes one item. Nothing is ever
// rewritten. Every run re-reads the last 100 Discord messages and the last
// 30 digest files and merges them into the file, so there is no saved
// position: a quiet run produces the same file and leaves nothing to commit.
//
// RAVI names itself honestly: Discord gets the user agent form Discord asks
// bots for, naming RAVI; GitHub gets RAVI's own user agent.
//
// FOR THE NEWS PAGE (plan 2 M8.7 block 1, Mako 2026-11-07: read it all
// without leaving the app):
// - A post Muse read twice (Facebook gives the same post a new address on a
//   later day) is one item: the same words within a week fold into the first.
// - Riot's own article (a playriftbound.com news page, the post itself or one
//   a post links to) is read once, as RAVI, and kept with the post: its title,
//   description, picture and words, cleaned the way the rules watcher cleans
//   Riot's markup (fetch-rules.js). A page that will not read is skipped with
//   a WARN and tried again next run.
// - Every item gets a headline (title), a short summary in plain words (sum)
//   and the dates a player can act on (dates: entries close, a drawing, an
//   event; Mako 2026-11-07, for pinning later): written by Claude (Haiku)
//   when ANTHROPIC_API_KEY is set, else no headline and Riot's first sentence
//   without links, hashtags or emoji. A summary is written once per wording (sumKey) and
//   kept; a first-sentence one is replaced by Claude's once the key is there.
//   A failed or refused call falls back to the first sentence; it never fails
//   the run. At most SUMS_PER_RUN calls and ARTS_PER_RUN pages per run.
//
// FAILURE: a missing key, or Discord or GitHub refusing a read, fails the
// run and the last file stays. A digest file that is not valid JSON in the
// agreed shape is skipped with a WARN line; the rest of the run goes on.
// The digest is public, so it needs no key; GITHUB_TOKEN, when the workflow
// passes it, only lifts GitHub's limit on unsigned reads.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { RB } = require("./config");
const RULES = require("./fetch-rules");

const CHANNEL = "1558738517679415407"; // #riot-feed in Mako's RAVI feed server
const DIGEST = "beifongshopmail-cpu/ravi-news";   // Muse's daily digest, public (Mako 2026-11-08)
const MUSE_FILES = 30;
const DISCORD_UA = "DiscordBot (https://github.com/beifongshopmail-cpu/van-isle-riftbound, 1.0) VanIsleRiftbound/1.0";

// Test and recon overrides.
const DISCORD = process.env.FEED_DISCORD_BASE || "https://discord.com/api/v10";
const GITHUB = process.env.FEED_GITHUB_BASE || "https://api.github.com";
const OUT_FILE = process.env.FEED_OUT || path.join(__dirname, "data", "feed.json");
const SHORT = process.env.FEED_SHORT_BASE || ""; // stands in for https://riot.com in tests
const TODAY = process.env.FEED_TODAY || "";
const PR_BASE = process.env.FEED_PR_BASE || "";        // stands in for https://playriftbound.com in tests
const CLAUDE = process.env.FEED_CLAUDE_BASE || "https://api.anthropic.com";
const MODEL = "claude-haiku-5-5";
const ARTS_PER_RUN = 12;
const SUMS_PER_RUN = 40;
const PAUSE = 1500;

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
  { host: "youtube.com", path: "/@playriftbound" },
  { host: "youtube.com", path: "/@riftbound" }   // the handle Riot links (ravi-news SOURCES.md, 2026-11-08)
];
const KINDS = ["event", "announcement", "rules", "product", "market", "reveal"];
const TIERS = ["official", "community", "local"];

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
    if (p.tier !== undefined && TIERS.indexOf(p.tier) === -1) { return "post " + i + " has tier " + JSON.stringify(p.tier); }
    if (p.links !== undefined && (!Array.isArray(p.links) || p.links.some(function (l) { return typeof l !== "string"; }))) { return "post " + i + " has links that are not addresses"; }
  }
  return "";
}

// where a post was posted, in words, from its address
function placeOf(u) {
  const n = norm(u);
  if (!n) { return "the web"; }
  const h = new URL(n).hostname;
  if (h === "facebook.com" || h === "fb.watch") { return "Facebook"; }
  if (h === "instagram.com") { return "Instagram"; }
  if (h === "youtube.com" || h === "youtu.be") { return "YouTube"; }
  if (h === "x.com" || h === "twitter.com") { return "X"; }
  if (h === "twitch.tv") { return "Twitch"; }
  return h;
}

// Official entries only (an entry without a tier is official). The id keeps
// its "fb:" prefix for every digest post, whatever the platform: it means
// "a post Muse read" (merge and foldRepeats key on it), and the items News
// already holds keep their ids.
function itemsFromMuse(d) {
  return d.posts.filter(function (p) { return !p.tier || p.tier === "official"; }).map(function (p) {
    const url = norm(p.url) || p.url;
    const links = (p.links || []).concat(linksOf(p.text).filter(isRiot)).map(norm).filter(function (u, i, a) { return u && a.indexOf(u) === i && u !== url; });
    const it = { id: "fb:" + url, kind: p.kind, url: url, posted: p.posted || d.run, source: p.source, credit: "Riot, on " + placeOf(url), text: p.text, via: ["muse"] };
    if (links.length) { it.links = links; }
    return it;
  });
}

// A post of standings: players' names with their placings. Never read, never
// sent anywhere (RAVI ranks no players; the names are not RAVI's to show).
function isStandings(t) {
  const places = (String(t || "").match(/\b\d{1,2}(?:st|nd|rd|th)\s*[-:.)]/gi) || []).length;
  return places >= 4 || (places >= 2 && /standings|results|final placings/i.test(t));
}

// The store a local entry is from: the digest's source, without the name of
// its group ("Skyhaven Games Riftbound (League of Legends) Group").
function storeOf(source) {
  return String(source || "").replace(/\s+Riftbound\b.*\bGroup\s*$/i, "").replace(/\s+(?:Facebook\s+)?Group\s*$/i, "").replace(/\s+/g, " ").trim();
}

// Local entries: one item per store post, kind local, the store as its source.
// text is carried only as far as the summary; strip() drops it before writing.
function localFromMuse(d) {
  return d.posts.filter(function (p) { return p.tier === "local" && !isStandings(p.text) && storeOf(p.source); }).map(function (p) {
    const url = norm(p.url) || p.url, store = storeOf(p.source);
    return { id: "fb:" + url, kind: "local", tier: "local", url: url, posted: p.posted || d.run, source: store, credit: store + ", on " + placeOf(url), text: p.text, via: ["muse"] };
  });
}

// What the file keeps of the local items: no store's words, and none that has
// neither its summary nor its hold yet (read again next run).
function strip(items) {
  return items.filter(function (it) { return it.tier !== "local" || it.sum || it.hold; }).map(function (it) {
    if (it.tier === "local") { delete it.text; }
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
    // The newer reading wins; where it was seen adds up.
    const via = was.via.slice();
    it.via.forEach(function (v) { if (via.indexOf(v) === -1) { via.push(v); } });
    Object.assign(was, JSON.parse(JSON.stringify(it)));
    was.via = via;
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

// ---- short links ----

function isShort(u) {
  const n = norm(u);
  return !!n && new URL(n).hostname === "riot.com" && new URL(n).pathname.length > 1;
}

// One step only: the address riot.com points to, if it is one of Riot's own.
async function resolveShort(u, cache) {
  const n = norm(u);
  if (cache[n] !== undefined) { return cache[n]; }
  const target = SHORT ? SHORT + new URL(n).pathname : n;
  let got = n;
  try {
    const res = await fetch(target, { redirect: "manual", headers: { "User-Agent": RB.ua } });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      const to = norm(new URL(loc, n).href);
      if (to && isRiot(to) && !isShort(to)) { got = to; }
      else { console.log("WARN short link " + n + " points outside Riot's places; kept as it is"); }
    } else {
      console.log("WARN short link " + n + " answered " + res.status + "; kept as it is");
    }
  } catch (e) {
    console.log("WARN short link " + n + " did not answer; kept as it is");
  }
  cache[n] = got;
  return got;
}

// Discord links and the Riot links inside Muse's posts, followed to their pages.
async function expand(items, cache) {
  for (const it of items) {
    if (it.id.indexOf("link:") === 0 && isShort(it.url)) {
      const to = await resolveShort(it.url, cache);
      if (to !== it.url) { it.short = it.url; it.url = to; it.id = "link:" + to; it.kind = kindOf(to); }
    }
    if (it.links) {
      const out = [];
      for (const l of it.links) {
        const to = isShort(l) ? await resolveShort(l, cache) : l;
        if (out.indexOf(to) === -1 && to !== it.url) { out.push(to); }
      }
      it.links = out;
    }
  }
  return items;
}

// ---- repeats ----

// The words of a post with its links, tags and spacing taken out: two
// readings of the same post share this.
function wordsKey(t) {
  return String(t || "").toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 200);
}

function daysApart(a, b) {
  return Math.abs((Date.parse(a + "T12:00:00Z") - Date.parse(b + "T12:00:00Z")) / 86400000);
}

// Muse posts with the same words posted within a week are one post: the first
// reading keeps its place and takes the others' sources and links. On the
// same day, a reading News already shows (it has its summary) is the first,
// so a post Facebook gives a new address keeps its id and summary (the
// digest move, 2026-11-08).
function foldRepeats(items) {
  const out = [];
  items.slice().sort(function (a, b) { return (a.posted || "").localeCompare(b.posted || "") || (b.sum ? 1 : 0) - (a.sum ? 1 : 0) || a.id.localeCompare(b.id); }).forEach(function (it) {
    const k = it.id.indexOf("fb:") === 0 ? wordsKey(it.text) : "";
    const home = k.length >= 30 ? out.filter(function (o) { return o.id.indexOf("fb:") === 0 && wordsKey(o.text) === k && daysApart(o.posted, it.posted) <= 7; })[0] : null;
    if (!home) { out.push(it); return; }
    it.via.forEach(function (v) { if (home.via.indexOf(v) === -1) { home.via.push(v); } });
    home.via.sort();
    (it.links || []).forEach(function (l) { home.links = home.links || []; if (home.links.indexOf(l) === -1 && l !== home.url) { home.links.push(l); } });
  });
  out.sort(function (a, b) { return (b.posted || "").localeCompare(a.posted || "") || a.id.localeCompare(b.id); });
  return out;
}

// ---- Riot's article ----

function isArticle(u) {
  const n = norm(u);
  return !!n && new URL(n).hostname === "playriftbound.com" && /^\/[a-z]{2}-[a-z]{2}\/news\/[^/]+\/[^/]+\/$/.test(new URL(n).pathname);
}

// the article a post stands for: the post itself, else the first one it links to
function articleOf(it) {
  if (isArticle(it.url)) { return norm(it.url); }
  const l = (it.links || []).filter(isArticle)[0];
  return l ? norm(l) : null;
}

function isVideo(u) {
  return /^https:\/\/(facebook\.com\/reel\/|facebook\.com\/[^/]+\/videos\/|instagram\.com\/reels?\/|youtube\.com\/|youtu\.be\/)/.test(norm(u) || "");
}

// Riot's page data -> { url, title, desc, pic, published, html }, the words
// cleaned as the rules watcher cleans them (fetch-rules.js sanitize).
function readArticle(html, url) {
  const page = RULES.pageData(html);
  const body = [];
  RULES.parts(page).forEach(function (p) {
    if (p.type === "rich") { body.push(p.html); return; }
    if (p.title) { body.push("<h3>" + RULES.sanitize(String(p.title)) + "</h3>"); }
    p.groups.forEach(function (g) { body.push("<h4>" + RULES.sanitize(g.q) + "</h4>" + g.a); });
  });
  const pic = page.metaImage && typeof page.metaImage.url === "string" && /^https:\/\/cmsassets\.rgpub\.io\/[^"<>`\s]+$/.test(page.metaImage.url) ? page.metaImage.url : null;
  const out = { url: url, title: RULES.text(String(page.title || "")), desc: RULES.text(String(page.description || "")), published: page.displayedPublishDate || null, html: body.join("").slice(0, 60000) };
  if (pic) { out.pic = pic; }
  if (!out.title || !out.html) { throw new Error("no title or words"); }
  return out;
}

async function fetchArticle(url) {
  const at = PR_BASE ? PR_BASE + new URL(url).pathname : url;
  const res = await fetch(at, { headers: { "User-Agent": RB.ua, "Accept": "text/html", "Accept-Language": "en-US" }, redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (res.status !== 200) { throw new Error("HTTP " + res.status); }
  return readArticle(await res.text(), url);
}

// ---- summaries ----

// The words a summary is written from: Riot's post, then its article.
function sumInput(it) {
  const parts = ["Published: " + (it.posted || "unknown")];
  if (it.text) { parts.push(it.text); }
  if (it.art) { parts.push(it.art.title, it.art.desc || "", RULES.text(it.art.html).slice(0, 6000)); }
  return parts.length > 1 ? parts.filter(Boolean).join("\n\n").trim() : "";
}

function sumKey(input) {
  return crypto.createHash("sha256").update("v2\n" + input).digest("hex").slice(0, 16);   // v2: headline, summary and dates
}

// Riot's first sentence, without links, hashtags or emoji: the summary when
// Claude is not there.
function firstSentence(t) {
  const s = String(t || "").replace(/https?:\/\/\S+/g, " ").replace(/#[A-Za-z0-9_]+/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, " ").replace(/\s+/g, " ").trim();
  const m = /^.*?[.!?](?=\s|$)/.exec(s);
  let f = (m ? m[0] : s).trim();
  if (f.length > 200) { f = f.slice(0, 197).replace(/\s+\S*$/, "") + "..."; }
  return f;
}

const ASK = "You write for RAVI, a free community app for the Riftbound trading card game. Read the official Riot Games post below. " +
  "Reply with one JSON object and nothing else: " +
  "{\"title\": a plain headline of at most 8 words; " +
  "\"summary\": one or two short, plain sentences, under 40 words, saying what is happening and when, if the post says; " +
  "\"dates\": the dates in the post a player could act on, each {\"what\": one of \"entries open\", \"entries close\", \"drawing\", \"event\", \"release\", \"deadline\", \"other\", " +
  "\"label\": at most 6 words, \"from\": \"YYYY-MM-DD\", \"to\": \"YYYY-MM-DD\" or null}, at most 6 of them, the soonest first, or [] when there are none}. " +
  "Use only facts in the post; work out relative dates (tomorrow, next week) from its published day. No hashtags, emoji, quotes or hype.";
const WHAT = ["entries open", "entries close", "drawing", "event", "release", "deadline", "other"];

// A LOCAL STORE'S POST (plan 2 M9 block 1): a short summary in RAVI's own words, or skip.
const ASK_LOCAL = "You write for RAVI, a free community app for the Riftbound trading card game on Vancouver Island. " +
  "Below is a post by a local game store, or from its community group. Reply with one JSON object and nothing else: " +
  "{\"skip\": true} when the post is only results or standings, or only a schedule, calendar or list of events " +
  "(a month's events, weekly nights, a game named among others) with nothing a player has to do or would be caught out by not knowing; " +
  "otherwise {\"title\": a plain headline of at most 8 words that names the store; " +
  "\"summary\": one or two short, plain sentences, under 40 words, in your own words, saying what a player should know and when; " +
  "\"until\": \"YYYY-MM-DD\", the last day the post still matters when it is plainly about one dated thing (the day of the event, the deadline), or null when it names no such day}. " +
  "Never copy the post's sentences. Never name a person: the store is the only name. " +
  "Use only facts in the post; work out relative dates (tomorrow, next week) from its published day. No hashtags, emoji, quotes or hype.";

function localInput(it) {
  return "Published: " + (it.posted || "unknown") + "\nStore: " + it.source + "\n\n" + it.text;
}

// Claude's reply to ASK_LOCAL -> { skip: true } or { title, sum }, or a thrown error
function readLocal(t) {
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a === -1 || b < a) { throw new Error("no JSON"); }
  const d = JSON.parse(t.slice(a, b + 1));
  if (d.skip === true) { return { skip: true }; }
  const clean = function (x, n) { return typeof x === "string" ? x.replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "").slice(0, n) : ""; };
  const title = clean(d.title, 100), sum = clean(d.summary, 300);
  if (!title || !sum) { throw new Error("no title or summary"); }
  const out = { title: title, sum: sum };
  // the last day the post still matters (Mako 2026-11-10: a local post drops after a week unless it
  // plainly pertains to a date); the page keeps it showing through that day
  if (typeof d.until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.until) && !isNaN(Date.parse(d.until + "T12:00:00Z"))) { out.until = d.until; }
  return out;
}

// Claude's reply -> { title, sum, dates } or a thrown error
function readReply(t) {
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a === -1 || b < a) { throw new Error("no JSON"); }
  const d = JSON.parse(t.slice(a, b + 1));
  const clean = function (x, n) { return typeof x === "string" ? x.replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "").slice(0, n) : ""; };
  const title = clean(d.title, 100), sum = clean(d.summary, 400);
  if (!title || !sum) { throw new Error("no title or summary"); }
  const ok = function (x) { return typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !isNaN(Date.parse(x + "T12:00:00Z")); };
  const dates = (Array.isArray(d.dates) ? d.dates : []).filter(function (x) { return x && WHAT.indexOf(x.what) !== -1 && ok(x.from); }).slice(0, 6).map(function (x) {
    const o = { what: x.what, label: clean(x.label, 60) || x.what, from: x.from };
    if (ok(x.to) && x.to >= x.from) { o.to = x.to; }
    return o;
  });
  return { title: title, sum: sum, dates: dates };
}

// A reply cut off at the cap (plan 2 M8.7 C2; the log of 2026-11-10: a long roadmap post's reply
// began with its whole headline and summary, then listed more dates than the cap holds). The
// headline and summary come first, so they are whole; the dates are the soonest first, so the
// ones that arrived whole are the ones wanted. Anything less than a whole headline and summary
// throws, as readReply does.
function readPartial(t) {
  const str = function (name) {
    const m = new RegExp('"' + name + '"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*")').exec(t);
    if (!m) { return ""; }
    try { return JSON.parse(m[1]); } catch (e) { return ""; }
  };
  const dates = [];
  const at = t.search(/"dates"\s*:\s*\[/);
  if (at !== -1) {
    const re = /\{[^{}]*\}/g;
    re.lastIndex = at;
    let m;
    while ((m = re.exec(t))) { try { dates.push(JSON.parse(m[0])); } catch (e) { /* a broken entry: skip it */ } }
  }
  return readReply(JSON.stringify({ title: str("title"), summary: str("summary"), dates: dates }));
}

async function claudeSum(input, key, system, read) {
  system = system || ASK; read = read || readReply;
  const res = await fetch(CLAUDE + "/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json", "User-Agent": RB.ua },
    body: JSON.stringify({ model: MODEL, max_tokens: 1024, system: system, messages: [{ role: "user", content: input.slice(0, 12000) }] }),
    signal: AbortSignal.timeout(60000)
  });
  if (res.status !== 200) { throw new Error("HTTP " + res.status); }
  const d = await res.json();
  // a reply cut off at the cap is not a summary: say how it began, so the log shows why (plan 2
  // M8.7 C2: three long posts still stop at the cap on every run, six dates or not; the cap stays
  // until the log shows what fills it)
  if (d.stop_reason && d.stop_reason !== "end_turn") {
    const all = (d.content || []).filter(function (c) { return c.type === "text"; }).map(function (c) { return c.text; }).join(" ");
    // cut off at the cap: the headline, the summary and the dates that arrived whole are kept
    if (d.stop_reason === "max_tokens" && read === readReply) {
      try { const part = readPartial(all); console.log("summary cut off at the cap: kept its headline, summary and " + part.dates.length + " dates"); return part; }
      catch (e) { /* not even a whole summary: fall back below */ }
    }
    const began = all.slice(0, 120);
    throw new Error("stopped: " + d.stop_reason + (began ? "; the reply began: " + began : ""));
  }
  return read((d.content || []).filter(function (c) { return c.type === "text"; }).map(function (c) { return c.text; }).join(" "));
}

// Articles and summaries for every item, keeping what an earlier run wrote.
async function enrich(items, prevItems, key) {
  const before = {};
  prevItems.forEach(function (p) { before[p.id] = p; });
  const arts = {};
  prevItems.forEach(function (p) { if (p.art) { arts[p.art.url] = p.art; } });
  let artBudget = ARTS_PER_RUN, sumBudget = SUMS_PER_RUN, read = 0, wrote = 0, fell = 0, local = 0, held = 0;
  for (const it of items) {
    const was = before[it.id] || {};
    // a local store's post: Claude's summary or nothing (never the store's own sentence)
    if (it.tier === "local") {
      if (!it.text) { continue; }   // not in the digest's last files: it stays as the file has it
      const lk = sumKey("local2\n" + localInput(it));   // local2: the tighter skip and until (2026-11-10)
      const put = function (from) { ["title", "sum", "sumBy", "hold", "until"].forEach(function (f) { if (from[f] !== undefined) { it[f] = from[f]; } else { delete it[f]; } }); };
      if (was.sumKey === lk && (was.hold || (was.sum && was.sumBy === "claude"))) { put(was); it.sumKey = lk; continue; }
      put({}); delete it.sumKey;
      if (key && sumBudget > 0) {
        sumBudget--;
        try {
          const got = await claudeSum(localInput(it), key, ASK_LOCAL, readLocal);
          if (got.skip) { put({ hold: "skip" }); held++; } else { put({ title: got.title, sum: got.sum, sumBy: "claude", until: got.until }); local++; }
          it.sumKey = lk;
        } catch (e) { console.log("WARN local summary for " + it.id + " not written: " + e.message + "; tried again next run"); }
      }
      continue;
    }
    const a = articleOf(it);
    if (a && arts[a]) { it.art = arts[a]; }
    else if (a && artBudget > 0) {
      artBudget--;
      if (read) { await new Promise(function (r) { setTimeout(r, PROD ? PAUSE : 0); }); }
      try { it.art = await fetchArticle(a); arts[a] = it.art; read++; }
      catch (e) { console.log("WARN article " + a + " not read: " + e.message + "; tried again next run"); }
    }
    if (!it.art) { delete it.art; }
    if (isVideo(it.url)) { it.video = true; } else { delete it.video; }
    const input = sumInput(it);
    const keep = function (from) { ["title", "sum", "sumBy", "dates"].forEach(function (f) { if (from[f] !== undefined) { it[f] = from[f]; } else { delete it[f]; } }); };
    if (!input) { keep({}); delete it.sumKey; continue; }
    const k = sumKey(input);
    if (was.sumKey === k && was.sum && (was.sumBy === "claude" || !key)) { keep(was); it.sumKey = k; continue; }
    let got = null;
    if (key && sumBudget > 0) {
      sumBudget--;
      try { got = await claudeSum(input, key); wrote++; }
      catch (e) { console.log("WARN summary for " + it.id + " fell back to the first sentence: " + e.message); fell++; }
    }
    if (got) { keep({ title: got.title, sum: got.sum, sumBy: "claude", dates: got.dates.length ? got.dates : undefined }); }
    else if (was.sumKey === k && was.sum) { keep(was); }
    else { keep({ title: it.art ? it.art.title : undefined, sum: firstSentence(it.text || (it.art && (it.art.desc || it.art.title)) || ""), sumBy: "first" }); }
    it.sumKey = k;
  }
  console.log("articles: " + read + " read; summaries: " + wrote + " by Claude" + (fell ? ", " + fell + " fell back" : "") + (key ? "" : " (no ANTHROPIC_API_KEY: first sentences)") +
    "; local: " + local + " summed up, " + held + " held");
}
const PROD = !process.env.FEED_PR_BASE;

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
  const h = { "Accept": "application/vnd.github+json", "User-Agent": RB.ua, "X-GitHub-Api-Version": "2022-11-28" };
  if (token) { h.Authorization = "Bearer " + token; }
  const list = await get(GITHUB + "/repos/" + DIGEST + "/contents", h);
  const names = list.filter(function (f) { return f.type === "file" && /^\d{4}-\d{2}-\d{2}\.json$/.test(f.name); })
    .map(function (f) { return f.name; }).sort().slice(-MUSE_FILES);
  const items = [];
  let warn = 0;
  for (const name of names) {
    const f = await get(GITHUB + "/repos/" + DIGEST + "/contents/" + name, h);
    let d = null;
    try { d = JSON.parse(Buffer.from(f.content || "", "base64").toString("utf8")); } catch (e) {}
    const bad = d ? checkMuse(d) : "not valid JSON";
    if (bad) { console.log("WARN muse " + name + " skipped: " + bad); warn++; continue; }
    itemsFromMuse(d).concat(localFromMuse(d)).forEach(function (it) { items.push(it); });
  }
  return { items: items, files: names.length, warn: warn };
}

async function main() {
  const dt = process.env.DISCORD_TOKEN, gt = process.env.GITHUB_TOKEN || "";
  if (!dt) { throw new Error("missing key: DISCORD_TOKEN"); }

  const msgs = await readDiscord(dt);
  const shapes = { followed: 0, forwarded: 0, plain: 0 };
  msgs.forEach(function (m) { shapes[shapeOf(m)]++; });
  const fromDiscord = itemsFromDiscord(msgs);
  console.log("discord: " + msgs.length + " messages (followed " + shapes.followed + ", forwarded " + shapes.forwarded + ", plain " + shapes.plain + "); Riot links kept " + fromDiscord.length);

  const muse = await readMuse(gt);
  console.log("muse: " + muse.files + " files, " + muse.items.length + " posts" + (muse.warn ? ", " + muse.warn + " skipped" : ""));

  const cache = {};
  await expand(fromDiscord.concat(muse.items), cache);
  const keys = Object.keys(cache);
  console.log("short links: " + keys.length + " followed, " + keys.filter(function (k) { return cache[k] !== k; }).length + " resolved");

  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch (e) {}
  const before = prev ? prev.items : [];
  const read = foldRepeats(merge(before, fromDiscord.concat(muse.items)));
  await enrich(read, before, process.env.ANTHROPIC_API_KEY || "");
  const items = strip(read);
  const oldIds = before.map(function (i) { return i.id; });
  const fresh = items.filter(function (i) { return oldIds.indexOf(i.id) === -1; });
  const rules = fresh.some(function (i) { return i.kind === "rules"; });
  if (process.env.GITHUB_OUTPUT) { fs.appendFileSync(process.env.GITHUB_OUTPUT, "rules=" + (rules ? "yes" : "no") + "\n"); }

  if (prev && JSON.stringify(prev.items) === JSON.stringify(items)) { console.log("no change; nothing written"); return; }
  const today = TODAY || day(new Date().toISOString());
  const out = { updated: today, note: "Riot's own posts. Their text and Riot's articles are Riot's, word for word; sum is RAVI's summary (sumBy claude: written by Claude; first: Riot's first sentence). kind local: a local store's post, RAVI's summary only, never the store's words; hold: read and left out.", items: items };
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

module.exports = { linksOf, norm, isRiot, kindOf, placeOf, DIGEST, shapeOf, discordText, itemsFromDiscord, checkMuse, itemsFromMuse, merge, day, isShort, expand, CHANNEL,
  wordsKey, foldRepeats, isArticle, articleOf, isVideo, readArticle, sumInput, sumKey, firstSentence, readReply, readPartial, MODEL,
  isStandings, storeOf, localFromMuse, strip, readLocal, localInput, ASK_LOCAL };
