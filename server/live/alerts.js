// alerts.js -- pairing alerts for ravi-live (M16).
// One Durable Object ("all") keeps who asked to be told, per event: the
// phone's push address, its two keys, and the Riot name to look for. While
// anyone is waiting it wakes every 30 seconds, reads each event (through
// getLive, so Riot is still read politely), and when a new round's
// pairings land it pushes "Round 2: table 7" to each phone once. An event
// that has finished, or a request older than 16 hours, is forgotten; a
// phone the push service no longer knows is dropped at once.

import { send } from "./push.js";

export const SITE = "https://ravi.tools/";
const SUBJECT = "https://github.com/beifongshopmail-cpu/van-isle-riftbound";
const WAKE_MS = 30000;
const KEEP_MS = 16 * 3600000;
const MAX_ROWS = 2000, MAX_PER_PHONE = 5;
// the push services browsers use; anything else is refused
const PUSH_HOSTS = /^(web\.push\.apple\.com|fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.notify\.windows\.com|android\.googleapis\.com)$/;

const B64U = /^[A-Za-z0-9_-]{16,200}$/;
function cleanName(v, max) { return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : ""; }

// a phone's push address and keys, checked; null when anything is off
export function cleanSub(s) {
  s = s && typeof s === "object" ? s : null;
  let ep = null;
  try { const u = new URL(s && s.endpoint); if (u.protocol === "https:" && PUSH_HOSTS.test(u.hostname) && u.href.length < 1000) ep = u.href; } catch (e) { ep = null; }
  const k = s && s.keys;
  const p256dh = k && typeof k.p256dh === "string" && B64U.test(k.p256dh) ? k.p256dh : null;
  const auth = k && typeof k.auth === "string" && B64U.test(k.auth) ? k.auth : null;
  return ep && p256dh && auth ? { endpoint: ep, p256dh: p256dh, auth: auth } : null;
}

// a request to be told, checked field by field; null when anything is off
export function cleanAsk(b) {
  if (!b || typeof b !== "object") return null;
  const ev = typeof b.event === "string" && /^\d{6,24}$/.test(b.event) ? b.event : null;
  const s = cleanSub(b.sub);
  const n = cleanName(b.me && b.me.n, 40), tag = cleanName(b.me && b.me.tag, 12);
  if (!ev || !s || !n) return null;
  return { endpoint: s.endpoint, event: ev, p256dh: s.p256dh, auth: s.auth, n: n, tag: tag };
}

function same(p, row) {
  if (!p || String(p.n).toLowerCase() !== row.n.toLowerCase()) return false;
  return !row.tag || String(p.tag || "").toLowerCase() === row.tag.toLowerCase();
}

// what to say to one phone about one event, or null
export function messageFor(live, row) {
  if (!live || !Array.isArray(live.rounds)) return null;
  // the latest round with pairings out: running, or posted before the clock
  // starts (organisers often post a few minutes early; seen 2026-10-28)
  let r = null;
  for (const x of live.rounds) if (x.st === "live" || (x.st === "next" && ((x.tables && x.tables.length) || (x.byes && x.byes.length)))) r = x;
  if (!r || !(r.n > (row.last || 0))) return null;
  const url = SITE + "calendar/?live=" + live.id;
  for (const t of r.tables) {
    const mine = same(t.a, row) ? "a" : same(t.b, row) ? "b" : null;
    if (!mine) continue;
    const opp = mine === "a" ? t.b : t.a;
    return { round: r.n, title: "Round " + r.n + ": table " + (t.t == null ? "?" : t.t), body: opp ? "vs " + opp.n + (opp.tag ? "#" + opp.tag : "") : "Bye", url: url };
  }
  for (const b of r.byes || []) if (same(b, row)) return { round: r.n, title: "Round " + r.n + ": you have a bye", body: live.name || "", url: url };
  return { round: r.n, title: "Round " + r.n + " pairings are up", body: "Your name is not in them. Tap to check it.", url: url };
}

// storage: SQLite in the Durable Object, a plain list in the tests
function sqlStore(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS asks (endpoint TEXT, event TEXT, p256dh TEXT, auth TEXT, n TEXT, tag TEXT, last INTEGER, at INTEGER, PRIMARY KEY (endpoint, event))");
  return {
    all: () => sql.exec("SELECT * FROM asks").toArray(),
    count: () => sql.exec("SELECT COUNT(*) AS c FROM asks").one().c,
    phone: (ep) => sql.exec("SELECT COUNT(*) AS c FROM asks WHERE endpoint = ?", ep).one().c,
    put: (r) => sql.exec("INSERT OR REPLACE INTO asks VALUES (?, ?, ?, ?, ?, ?, ?, ?)", r.endpoint, r.event, r.p256dh, r.auth, r.n, r.tag, r.last || 0, r.at),
    last: (ep, ev, n) => sql.exec("UPDATE asks SET last = ? WHERE endpoint = ? AND event = ?", n, ep, ev),
    del: (ep, ev) => ev ? sql.exec("DELETE FROM asks WHERE endpoint = ? AND event = ?", ep, ev) : sql.exec("DELETE FROM asks WHERE endpoint = ?", ep)
  };
}
export function memStore() {
  let rows = [];
  return {
    all: () => rows.map((r) => Object.assign({}, r)),
    count: () => rows.length,
    phone: (ep) => rows.filter((r) => r.endpoint === ep).length,
    put: (r) => { rows = rows.filter((x) => !(x.endpoint === r.endpoint && x.event === r.event)); rows.push(Object.assign({ last: 0 }, r)); },
    last: (ep, ev, n) => { rows.forEach((x) => { if (x.endpoint === ep && x.event === ev) x.last = n; }); },
    del: (ep, ev) => { rows = rows.filter((x) => !(x.endpoint === ep && (!ev || x.event === ev))); }
  };
}

export function makeAlerts(getLive) {
  return class Alerts {
    constructor(state, env) {
      this.state = state;
      this.env = env || {};
      this.db = state.db || sqlStore(state.storage.sql);
      this.fetcher = state.fetcher || fetch;
      this.now = state.now || (() => Date.now());
      this.tested = new Map(); // a test alert at most once a minute per phone
    }
    async wake() {
      const a = await this.state.storage.getAlarm();
      if (a == null) await this.state.storage.setAlarm(this.now() + 1000);
    }
    async fetch(req) {
      const u = new URL(req.url);
      let b = null;
      try { b = await req.json(); } catch (e) { b = null; }
      if (u.pathname === "/add") {
        const r = cleanAsk(b);
        if (!r) return Response.json({ error: "bad request" }, { status: 400 });
        const had = this.db.all().some((x) => x.endpoint === r.endpoint && x.event === r.event);
        if (!had && (this.db.count() >= MAX_ROWS || this.db.phone(r.endpoint) >= MAX_PER_PHONE)) return Response.json({ error: "full" }, { status: 429 });
        r.at = this.now(); r.last = 0;
        this.db.put(r);
        await this.wake();
        return Response.json({ ok: true });
      }
      if (u.pathname === "/test") {
        const s = cleanSub(b && b.sub);
        if (!s) return Response.json({ error: "bad request" }, { status: 400 });
        const jwk = this.env.VAPID_JWK ? JSON.parse(this.env.VAPID_JWK) : null;
        if (!jwk) return Response.json({ error: "alerts are not set up" }, { status: 503 });
        const last = this.tested.get(s.endpoint) || 0, now = this.now();
        if (now - last < 60000) return Response.json({ error: "once a minute" }, { status: 429 });
        this.tested.set(s.endpoint, now);
        if (this.tested.size > 500) this.tested.delete(this.tested.keys().next().value);
        let st = 0;
        try { st = await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: "RAVI test alert", body: "Alerts reach this phone. Pairing alerts will look like this.", url: SITE + "settings/", tag: "ravi-test" }), jwk, SUBJECT, this.fetcher); } catch (e) { st = 0; }
        return Response.json({ ok: st >= 200 && st < 300, status: st }, { status: st >= 200 && st < 300 ? 200 : 502 });
      }
      if (u.pathname === "/off") {
        let ep = null;
        try { ep = new URL(b && b.endpoint).href; } catch (e) { ep = null; }
        const ev = b && typeof b.event === "string" && /^\d{6,24}$/.test(b.event) ? b.event : null;
        if (!ep) return Response.json({ error: "bad request" }, { status: 400 });
        this.db.del(ep, ev);
        return Response.json({ ok: true });
      }
      return Response.json({ error: "not found" }, { status: 404 });
    }
    async alarm() {
      const rows = this.db.all(), now = this.now();
      if (!rows.length) return;
      const jwk = this.env.VAPID_JWK ? JSON.parse(this.env.VAPID_JWK) : null;
      const events = {};
      for (const r of rows) {
        if (now - r.at > KEEP_MS) { this.db.del(r.endpoint, r.event); continue; }
        (events[r.event] = events[r.event] || []).push(r);
      }
      for (const ev of Object.keys(events)) {
        let live = null;
        try { live = (await getLive(ev, { fetch: this.fetcher, now: now })).live; } catch (e) { live = null; }
        if (!live) continue;
        for (const r of events[ev]) {
          if (live.status === "done") { this.db.del(r.endpoint, r.event); continue; }
          const m = messageFor(live, r);
          if (!m || !jwk) continue;
          let st = 0;
          try { st = await send({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, JSON.stringify({ title: m.title, body: m.body, url: m.url, tag: "ravi-" + ev }), jwk, SUBJECT, this.fetcher); } catch (e) { st = 0; }
          if (st === 404 || st === 410) this.db.del(r.endpoint, null);
          else if (st >= 200 && st < 300) this.db.last(r.endpoint, r.event, m.round);
        }
      }
      if (this.db.count()) await this.state.storage.setAlarm(now + WAKE_MS);
    }
  };
}
