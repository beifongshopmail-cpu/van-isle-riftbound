"use strict";

// fetch-rules.js -- the rules watcher (from M9).
// Reads Riot's public rules pages as RAVI (plain GET, RAVI's own user agent,
// one page at a time) and writes data/rules.json: errata, FAQ answers, rulings,
// the legality lists and the two rules documents, word for word as Riot wrote
// them. Riot's pages carry their own content as page data (__NEXT_DATA__);
// that is what is read, never the visible layout.
//
// Text is copied, never rewritten. The only change made to Riot's markup is
// removing what a page does not need: styles, classes, editor links, empty
// tags. Allowed tags are listed in ALLOW below.
//
// FAILURE: a page that cannot be read, a page with no page data, an errata or
// FAQ article that yields nothing, or an article whose count halves against
// the last file fails the run. The last good file stays.
//
// The file is rewritten only when its content changed (the hash below), so
// a quiet run leaves nothing to commit.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { RB } = require("./config");

const PR = "https://playriftbound.com";
const LOL = "https://riftbound.leagueoflegends.com";
const HUB = "/en-us/rules-hub/";
const LISTS = ["/en-us/news/rules-and-releases/", "/en-us/news/announcements/"];
const PAUSE = 1500;
const TZ = "America/Vancouver";

// Test and recon overrides.
const BASE = process.env.RULES_BASE || "";
const OUT_FILE = process.env.RULES_OUT || path.join(__dirname, "data", "rules.json");
const TODAY = process.env.RULES_TODAY || "";

const UP = "\u25b2"; // the marker Riot puts between new and old text

// ---- text helpers ----

function decode(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); })
    .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&amp;/g, "&");
}

function text(html) {
  return decode(html.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, ""))
    .replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function slug(s) {
  const t = text(s).toLowerCase().replace(/[\u2018\u2019\u02bc']/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t.slice(0, 60).replace(/-+$/, "") || "x";
}

function hash(v) {
  return crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);
}

function today() {
  if (TODAY) { return TODAY; }
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// ---- markup ----

const ALLOW = {
  p: [], br: [], strong: [], b: [], em: [], i: [], u: [], s: [], sup: [], sub: [],
  ul: [], ol: [], li: [], h1: [], h2: [], h3: [], h4: [], h5: [], h6: [],
  blockquote: [], hr: [], table: [], thead: [], tbody: [], tr: [], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
  a: ["href"], img: ["src", "width", "height", "alt"]
};
const VOID = { br: 1, hr: 1, img: 1, meta: 1, wbr: 1, input: 1, source: 1 };
const DROP_ALL = { script: 1, style: 1, noscript: 1, iframe: 1, svg: 1 };

function attr(raw, name) {
  const m = new RegExp("\\s" + name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)')", "i").exec(raw);
  return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
}

function okHref(h) {
  return !!h && /^https?:\/\//i.test(h) && !/^https?:\/\/cms\.riotgames\.com\//i.test(h);
}

function okSrc(s) {
  return !!s && /^https:\/\/cmsassets\.rgpub\.io\//i.test(s);
}

function sanitize(html) {
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let out = "", last = 0, m, skip = null;
  const aStack = [];
  while ((m = re.exec(html)) !== null) {
    if (!skip) { out += html.slice(last, m.index); }
    last = re.lastIndex;
    if (!m[2]) { continue; }                       // a comment
    const close = m[1] === "/";
    const name = m[2].toLowerCase();
    if (skip) { if (close && name === skip) { skip = null; } continue; }
    if (DROP_ALL[name]) { if (!close && !/\/\s*$/.test(m[3])) { skip = name; } continue; }
    if (!ALLOW[name]) { continue; }                // unwrap: keep what is inside
    if (name === "a") {
      if (close) { if (aStack.pop()) { out += "</a>"; } continue; }
      const h = attr(m[3], "href");
      aStack.push(okHref(h));
      if (okHref(h)) { out += "<a href=\"" + h + "\">"; }
      continue;
    }
    if (close) { if (!VOID[name]) { out += "</" + name + ">"; } continue; }
    if (name === "img") {
      const src = attr(m[3], "src");
      if (!okSrc(src)) { continue; }
      let t = "<img src=\"" + src + "\"";
      ["width", "height"].forEach(function (k) { const v = attr(m[3], k); if (v && /^\d+$/.test(v)) { t += " " + k + "=\"" + v + "\""; } });
      const alt = attr(m[3], "alt");
      if (alt) { t += " alt=\"" + alt.replace(/"/g, "&quot;") + "\""; }
      out += t + ">";
      continue;
    }
    let t = "<" + name;
    ALLOW[name].forEach(function (k) { const v = attr(m[3], k); if (v && /^\d+$/.test(v) && v !== "1") { t += " " + k + "=\"" + v + "\""; } });
    out += t + ">";
  }
  if (!skip) { out += html.slice(last); }
  // Empty tags left behind (an editor link that held only <meta>, a paragraph of spaces).
  let prev;
  do {
    prev = out;
    out = out.replace(/<(p|strong|b|em|i|u|s|li|a|h[1-6]|blockquote)(\s[^>]*)?>((?:\s|&nbsp;|\u00a0)*)<\/\1>/g,
      function (m0, t, at, inner) { return inner ? " " : ""; });
  } while (out !== prev);
  return out.trim();
}

// Top-level blocks of sanitized markup, in order: {tag, html, text}.
function blocks(html) {
  const re = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/g;
  const outb = [];
  let depth = 0, start = -1, top = "", m, last = 0;
  function loose(s) {
    if (s.replace(/&nbsp;|\u00a0/g, " ").trim()) { const h = "<p>" + s.trim() + "</p>"; outb.push({ tag: "p", html: h, text: text(h) }); }
  }
  while ((m = re.exec(html)) !== null) {
    const close = m[1] === "/", name = m[2];
    if (depth === 0) {
      loose(html.slice(last, m.index));
      if (close) { last = re.lastIndex; continue; }
      if (VOID[name]) { const h = m[0]; outb.push({ tag: name, html: h, text: "" }); last = re.lastIndex; continue; }
      start = m.index; top = name; depth = 1;
      continue;
    }
    if (VOID[name]) { continue; }
    depth += close ? -1 : 1;
    if (depth === 0) {
      const h = html.slice(start, re.lastIndex);
      outb.push({ tag: top, html: h, text: text(h) });
      last = re.lastIndex;
    }
  }
  if (depth === 0) { loose(html.slice(last)); }
  return outb;
}

function isHeading(b) { return /^h[1-6]$/.test(b.tag); }
function onlyUp(b) { return b.text.replace(new RegExp(UP, "g"), "").trim() === ""; }
function join(list) { return list.map(function (b) { return b.html; }).join(""); }

// ---- the page data ----

function pageData(html) {
  const m = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) { throw new Error("no page data (__NEXT_DATA__)"); }
  const page = JSON.parse(m[1]).props.pageProps.page;
  if (!page || !Array.isArray(page.blades)) { throw new Error("page data has no blades"); }
  return page;
}

// The article's own content, in order: rich text bodies and accordion groups.
function parts(page) {
  const out = [];
  page.blades.forEach(function (b) {
    if (b.type === "articleRichText" && b.richText && typeof b.richText.body === "string") {
      out.push({ type: "rich", html: sanitize(b.richText.body) });
    } else if (b.type === "articleRichTextAccordion" && Array.isArray(b.groups)) {
      const hd = b.header || {};
      out.push({ type: "acc", title: hd.title || null, subtitle: hd.subtitle || null,
        groups: b.groups.map(function (g) { return { q: text(String(g.label || "")), a: sanitize(g.content && g.content.body ? g.content.body : "") }; }) });
    }
  });
  return out;
}

function notice(ps) {
  for (const p of ps) {
    if (p.type !== "rich") { continue; }
    for (const b of blocks(p.html)) { if (/no longer reflect/i.test(b.text)) { return b.html; } }
  }
  return null;
}

// ---- errata: a card heading, [NEW TEXT], the text, [OLD TEXT], the text ----

function stripLabel(b) {
  const h = b.html
    .replace(/<(strong|b)>\s*\[(NEW|OLD) TEXT\](\s|&nbsp;|\u00a0)*<\/\1>/g, "")
    .replace(/\[(NEW|OLD) TEXT\]/g, "")
    .replace(new RegExp("^<p>\\s*" + UP + "\\s*(<br>)?"), "<p>");
  const c = sanitize(h);
  return { tag: b.tag, html: c, text: text(c) };
}

function parseErrata(ps) {
  const out = [];
  let group = null, card = null, run = [], cur = null, state = null;
  function end() { if (cur) { out.push(cur); } cur = null; state = null; }
  ps.forEach(function (p) {
    if (p.type !== "rich") { return; }
    blocks(p.html).forEach(function (b) {
      // The labels come as bold paragraphs or as small headings; both are labels.
      if (isHeading(b) && !/\[(NEW|OLD) TEXT\]/.test(b.text)) {
        if (onlyUp(b)) { return; }
        end();
        run.push(b.text);
        card = b.text;
        if (run.length > 1) { group = run[run.length - 2]; }
        return;
      }
      if (b.tag === "hr") { end(); run = []; return; }
      if (/\[NEW TEXT\]/.test(b.text)) {
        end();
        cur = { group: group, card: card, new: [], old: [] };
        state = "new";
        run = [];
        const r = stripLabel(b);
        if (r.text) { cur.new.push(r); }
        return;
      }
      if (cur && /\[OLD TEXT\]/.test(b.text)) {
        state = "old";
        const r = stripLabel(b);
        if (r.text && !onlyUp(r)) { cur.old.push(r); }
        return;
      }
      if (!cur) { run = []; return; }
      if (onlyUp(b)) { return; }
      cur[state].push(b);
    });
  });
  end();
  return out.filter(function (e) { return e.card && e.new.length; })
    .map(function (e) { return { group: e.group, card: e.card, new: join(e.new), old: join(e.old) }; });
}

// ---- FAQ: accordion questions, or bold questions in rich text, plus rulings ----

function isQuestion(b) {
  if (b.tag !== "p") { return false; }
  if (/^Q:/.test(b.text)) { return true; }
  const m = /^<p>\s*<(strong|b)>([\s\S]*?)<\/\1>\s*<\/p>$/.exec(b.html);
  return !!m && /\?$/.test(text(m[2]));
}

function parseFaq(ps) {
  const out = [];
  let section = null, group = null, title = null, body = [], q = null, a = [], started = false;
  function flush() {
    if (q) { out.push({ kind: "faq", section: section, group: group, q: q, a: join(a) }); }
    else if (title && body.length) { out.push({ kind: "ruling", section: section, group: group, title: title, html: join(body) }); }
    q = null; a = []; body = [];
  }
  ps.forEach(function (p) {
    if (p.type === "acc") {
      flush(); title = null;
      if (p.title) { section = text(p.title); }
      group = p.subtitle ? text(p.subtitle) : group;
      p.groups.forEach(function (g) { if (g.q) { out.push({ kind: "faq", section: section, group: group, q: g.q, a: g.a }); } });
      started = true;
      return;
    }
    blocks(p.html).forEach(function (b) {
      if (isHeading(b)) {
        flush();
        if (b.tag === "h1") { section = b.text; group = null; title = null; } else { group = b.text; title = b.text; }
        started = true;
        return;
      }
      if (b.tag === "hr") { flush(); title = null; return; }
      if (isQuestion(b)) { flush(); q = b.text; started = true; return; }
      if (!started) { return; }                    // the introduction
      if (q) { a.push(b); } else if (title) { body.push(b); }
    });
  });
  flush();
  return out.filter(function (x) { return x.kind === "ruling" || x.a; });
}

// ---- the Rules Hub: the legality lists and the two rules documents ----

function parseHub(ps) {
  const out = [];
  let title = null, body = [];
  function flush() {
    if (title && body.length) {
      const html = join(body);
      const pdf = /<a href="(https:\/\/cmsassets\.rgpub\.io\/[^"]+\.pdf)">/.exec(html);
      if (/legality/i.test(title)) { out.push({ kind: "legal", title: title, html: html }); }
      else if (pdf) { out.push({ kind: "doc", title: title, url: pdf[1], html: html }); }
    }
    title = null; body = [];
  }
  ps.forEach(function (p) {
    if (p.type !== "rich") { return; }
    blocks(p.html).forEach(function (b) {
      if (isHeading(b)) { flush(); title = b.text; return; }
      if (title) { body.push(b); }
    });
  });
  flush();
  return out;
}

// ---- which articles to read ----

function norm(u) {
  let p = u.replace(PR, "").replace(LOL, "").split("#")[0].split("?")[0].toLowerCase();
  if (!p.endsWith("/")) { p += "/"; }
  return p;
}

function setName(title) {
  const t = title.replace(/^Riftbound:?\s+/i, "").replace(/^Core Rules:?\s+/i, "");
  const w = /^([A-Za-z]+)/.exec(t);
  return w ? w[1].toLowerCase() : "other";
}

function classify(title) {
  if (/errata/i.test(title)) { return "errata"; }
  if (/\bFAQ\b/.test(title) && !/drawing|merch|qualification|product|championship/i.test(title)) { return "faq"; }
  if (/patch notes|changelog|ban list|bans|tournament rules|rules update/i.test(title)) { return "later"; }
  return null;
}

// Listing items (from each listing's page data) -> {load, later}.
function pickSources(listPages) {
  const seen = {}, load = [], later = [];
  listPages.forEach(function (page) {
    page.blades.forEach(function (b) {
      if (!Array.isArray(b.items)) { return; }
      b.items.forEach(function (it) {
        const url = it.action && it.action.payload && it.action.payload.url;
        if (!url || !it.title) { return; }
        const p = norm(url);
        if (seen[p] || p === HUB) { return; }
        seen[p] = 1;
        const k = classify(it.title);
        const row = { kind: k, title: it.title, path: p, published: it.publishedAt || null };
        if (k === "errata" || k === "faq") { load.push(row); } else if (k === "later") { later.push(row); }
      });
    });
  });
  const ids = {};
  load.forEach(function (s) {
    let id = s.kind + "-" + setName(s.title);
    if (ids[id]) { id += "-" + slug(s.path.split("/").filter(Boolean).pop()); }
    ids[id] = 1;
    s.id = id;
    s.set = setName(s.title);
  });
  return { load: load, later: later };
}

// ---- items with ids, seen and changed ----

function itemsFor(src, raw) {
  const used = {};
  return raw.map(function (r) {
    let key;
    if (r.card) { key = slug(r.card); }
    else if (r.q) { key = (r.group ? slug(r.group) + "~" : "") + slug(r.q); }
    else { key = slug(r.title || "x"); }
    let id = src.id + "#" + key, n = 2;
    while (used[id]) { id = src.id + "#" + key + "-" + n; n++; }
    used[id] = 1;
    const it = { id: id, kind: r.kind || src.kind, source: src.id, set: src.set || null };
    ["section", "group", "title", "q", "a", "new", "old", "url", "html"].forEach(function (k) { if (r[k] !== undefined && r[k] !== null) { it[k] = r[k]; } });
    if (r.card) { it.cards = [r.card]; }
    return it;
  });
}

function stamp(items, prev, day) {
  const before = {};
  (prev && prev.items || []).forEach(function (it) { before[it.id] = it; });
  return items.map(function (it) {
    const body = hash(Object.assign({}, it, { seen: undefined, changed: undefined }));
    const old = before[it.id];
    let seen = day, changed = day;
    if (old) {
      seen = old.seen || day;
      const oldBody = hash(Object.assign({}, old, { seen: undefined, changed: undefined }));
      changed = oldBody === body ? (old.changed || day) : day;
    }
    return Object.assign(it, { seen: seen, changed: changed });
  });
}

// ---- network ----

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function getPage(p) {
  const url = (BASE || PR) + p;
  const res = await fetch(url, {
    headers: { "User-Agent": RB.ua, "Accept": "text/html", "Accept-Language": "en-US" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000)
  });
  if (res.status !== 200) { throw new Error(p + ": HTTP " + res.status); }
  return { url: res.url, page: pageData(await res.text()) };
}

function srcRow(s, page, extra) {
  return Object.assign({
    id: s.id, kind: s.kind, set: s.set || null, title: page.title || s.title,
    url: PR + s.path,
    published: page.displayedPublishDate || s.published || null,
    rev: page.analytics && page.analytics.rev ? page.analytics.rev : null
  }, extra || {});
}

async function main() {
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")); } catch (e) { prev = null; }
  const prevCount = {};
  (prev && prev.items || []).forEach(function (it) { prevCount[it.source] = (prevCount[it.source] || 0) + 1; });

  const lists = [];
  for (let i = 0; i < LISTS.length; i++) {
    if (i) { await sleep(PAUSE); }
    lists.push((await getPage(LISTS[i])).page);
  }
  const picked = pickSources(lists);

  const sources = [], raw = [];
  await sleep(PAUSE);
  const hub = (await getPage(HUB)).page;
  const hubSrc = { id: "hub", kind: "hub", set: null, path: HUB, title: "Rules Hub" };
  const hubItems = parseHub(parts(hub));
  if (!hubItems.length) { throw new Error("Rules Hub: no legality lists or rules documents found"); }
  sources.push(srcRow(hubSrc, hub, { notice: null }));
  raw.push(itemsFor(hubSrc, hubItems));

  for (const s of picked.load) {
    await sleep(PAUSE);
    const page = (await getPage(s.path)).page;
    const ps = parts(page);
    const got = s.kind === "errata"
      ? parseErrata(ps).map(function (e) { return Object.assign({ kind: "errata" }, e); })
      : parseFaq(ps);
    if (!got.length) { throw new Error(s.title + ": no " + s.kind + " entries found (layout changed?)"); }
    if (prevCount[s.id] && got.length * 2 < prevCount[s.id]) {
      throw new Error(s.title + ": " + got.length + " entries, was " + prevCount[s.id] + " (more than halved)");
    }
    sources.push(srcRow(s, page, { notice: notice(ps) }));
    raw.push(itemsFor(s, got));
  }

  const items = stamp([].concat.apply([], raw), prev, today());
  const later = picked.later.map(function (l) { return { title: l.title, url: PR + l.path, published: l.published }; });
  const content = { sources: sources, later: later, items: items };
  // Riot's revision id moves on any republish; only the words decide a change.
  const h = hash({ sources: sources.map(function (s) { return Object.assign({}, s, { rev: undefined }); }), later: later, items: items });
  const counts = {};
  items.forEach(function (it) { counts[it.kind] = (counts[it.kind] || 0) + 1; });
  console.log("sources " + sources.length + " | items " + items.length + " " + JSON.stringify(counts) + " | later " + later.length + " | hash " + h);
  sources.forEach(function (s) {
    const n = items.filter(function (it) { return it.source === s.id; }).length;
    console.log("  " + s.id + " " + n + (s.notice ? " (notice)" : "") + " " + s.url);
  });
  if (prev && prev.hash === h) { console.log("no change; file left as it was"); return; }
  const out = Object.assign({ v: 1, generated_at: new Date().toISOString(), hash: h }, content);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1) + "\n");
  console.log("wrote " + OUT_FILE);
}

if (require.main === module) {
  main().catch(function (err) {
    console.error("RULES FETCH FAILED: " + (err && err.message ? err.message : String(err)));
    process.exit(1);
  });
}

module.exports = { sanitize, blocks, text, slug, parts, parseErrata, parseFaq, parseHub, pickSources, itemsFor, stamp, notice, classify, setName };
