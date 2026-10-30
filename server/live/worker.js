// worker.js -- ravi-live, RAVI's server for live event data (M16).
// A Cloudflare Worker on the free tier. GET /event/<id> returns the event's
// small live file (see parse.js). It reads Riot's event page politely: a
// tiny "last changed" check first, the full page only when something
// changed, and at most one upstream check per event per FRESH_MS however
// many people ask. RAVI names itself honestly; it never claims to be Riot.

import { liveFromHtml } from "./parse.js";
import { makeAlerts } from "./alerts.js";
import { vapidPublic } from "./push.js";
import { makeFinishes } from "./finishes.js";

const UA = "VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)";
const GQL = "https://playriftbound.com/api/gql";
const POLLER = { op: "GetCompeteRbRefreshPoller", hash: "459dbd58b231ad1767b999a1bf987836123ac86a0b5110e166de15b69723ba0d" };
const PAGE = "https://playriftbound.com/en-US/events/";
const ORIGINS = ["https://ravi.tools", "https://beifongshopmail-cpu.github.io"]; // the old address stays until M8 is checked
export const FRESH_MS = 15000;
const KEEP = 200; // events held in memory at most
const LAG_TRIES = 4; // a page behind Riot's change stamp is read again this many times at most

// Per-isolate memory: { at, updatedAt, body } per event id. An isolate can
// be recycled at any time; the cost is one extra upstream read.
const memo = new Map();
const inflight = new Map();

function cors(req) {
  const o = req.headers.get("Origin");
  const h = { "Vary": "Origin" };
  if (o && ORIGINS.indexOf(o) >= 0) h["Access-Control-Allow-Origin"] = o;
  return h;
}

function json(req, status, obj, extra) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }, cors(req), extra || {})
  });
}

function pollerUrl(eid) {
  const u = new URL(GQL);
  u.searchParams.set("operationName", POLLER.op);
  u.searchParams.set("variables", JSON.stringify({ tournamentId: eid }));
  u.searchParams.set("extensions", JSON.stringify({ persistedQuery: { version: 1, sha256Hash: POLLER.hash } }));
  return u.href;
}

async function changedAt(eid, fetcher) {
  const res = await fetcher(pollerUrl(eid), {
    cache: "no-store",
    headers: { "User-Agent": UA, "Accept": "application/json", "Content-Type": "application/json", "apollographql-client-name": "ravi", "apollographql-client-version": "1.0" }
  });
  if (!res.ok) return null;
  const j = await res.json().catch(function () { return null; });
  const u = j && j.data && j.data.t && j.data.t.u;
  return typeof u === "string" && u.length < 40 ? u : null;
}

async function readPage(eid, fetcher, now) {
  const res = await fetcher(PAGE + eid, { cache: "no-store", headers: { "User-Agent": UA, "Accept": "text/html", "Cache-Control": "no-cache" } });
  if (!res.ok) throw new Error("page " + res.status);
  const live = liveFromHtml(await res.text(), new Date(now).toISOString());
  if (!live || live.id !== eid) throw new Error("no event data on the page");
  return live;
}

// The one place upstream is read. Exported for the tests.
export async function getLive(eid, opts) {
  const fetcher = (opts && opts.fetch) || fetch;
  const now = (opts && opts.now) || Date.now();
  const hit = memo.get(eid);
  if (hit && now - hit.at < FRESH_MS) return { live: hit.live, upstream: "none" };
  if (inflight.has(eid)) return inflight.get(eid);
  const job = (async function () {
    try {
      let stamp = null;
      try { stamp = await changedAt(eid, fetcher); } catch (e) { stamp = null; }
      if (hit && stamp && stamp === hit.stamp) {
        hit.at = now;
        return { live: hit.live, upstream: "check" };
      }
      let live = await readPage(eid, fetcher, now);
      // Riot's page can lag its own change stamp (seen 2026-10-28: one
      // reader then held the old state for good). Never go back to an older
      // state, and when the page is behind the stamp, do not record the
      // stamp, so the next check reads the page again (LAG_TRIES at most).
      const t = function (x) { const v = Date.parse(x || ""); return isFinite(v) ? v : 0; };
      if (hit && t(live.updatedAt) < t(hit.live.updatedAt)) live = hit.live;
      const behind = !!stamp && t(live.updatedAt) + 1000 < t(stamp);
      const lag = behind ? ((hit && hit.lagFor === stamp ? hit.lag : 0) + 1) : 0;
      const keep = behind && lag < LAG_TRIES ? null : stamp;
      memo.set(eid, { at: now, stamp: keep, live: live, lag: lag, lagFor: behind ? stamp : null });
      if (memo.size > KEEP) memo.delete(memo.keys().next().value);
      return { live: live, upstream: "page" };
    } catch (e) {
      if (hit) return { live: hit.live, upstream: "failed", stale: true };
      throw e;
    } finally {
      inflight.delete(eid);
    }
  })();
  inflight.set(eid, job);
  return job;
}

export function _reset() { memo.clear(); inflight.clear(); }

// Pairing alerts: one Durable Object holds every request (alerts.js).
export const Alerts = makeAlerts(getLive);

// The decks played at finished events (finishes.js): one Durable Object.
export const Finishes = makeFinishes(getLive);

async function toFinishes(req, env, path, method) {
  const init = { method: method, headers: { "Content-Type": "application/json", "X-Ravi-Ip": req.headers.get("CF-Connecting-IP") || "" } };
  if (method === "POST") {
    const text = await req.text();
    if (text.length > 2048) return json(req, 413, { error: "too big" });
    init.body = text;
  }
  const stub = env.FINISHES.get(env.FINISHES.idFromName("all"));
  const r = await stub.fetch(new Request("https://finishes" + path, init));
  return json(req, r.status, await r.json().catch(function () { return {}; }));
}

async function toAlerts(req, env, path) {
  const text = await req.text();
  if (text.length > 4096) return json(req, 413, { error: "too big" });
  const stub = env.ALERTS.get(env.ALERTS.idFromName("all"));
  const r = await stub.fetch(new Request("https://alerts" + path, { method: "POST", body: text, headers: { "Content-Type": "application/json" } }));
  return json(req, r.status, await r.json().catch(function () { return {}; }));
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: Object.assign({ "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" }, cors(req)) });
    const ROUTE = { "/alerts": "/add", "/alerts/off": "/off", "/alerts/test": "/test" };
    if (req.method === "POST" && ROUTE[url.pathname]) {
      if (!env || !env.ALERTS) return json(req, 503, { error: "alerts are not set up" });
      return toAlerts(req, env, ROUTE[url.pathname]);
    }
    const fm = /^\/finishes(?:\/(\d{6,24}))?$/.exec(url.pathname);
    if (fm) {
      if (!env || !env.FINISHES) return json(req, 503, { error: "not set up" });
      if (fm[1] && (req.method === "GET" || req.method === "POST")) return toFinishes(req, env, "/e/" + fm[1], req.method);
      if (!fm[1] && req.method === "GET") return toFinishes(req, env, "/list?ids=" + encodeURIComponent(String(url.searchParams.get("ids") || "").slice(0, 6000)), "GET");
      return json(req, 405, { error: "not allowed" });
    }
    if (req.method !== "GET") return json(req, 405, { error: "GET only" });
    if (url.pathname === "/vapid") {
      if (!env || !env.VAPID_JWK) return json(req, 503, { error: "alerts are not set up" });
      return json(req, 200, { key: vapidPublic(JSON.parse(env.VAPID_JWK)) });
    }
    if (url.pathname === "/" || url.pathname === "/health") return json(req, 200, { ok: true, name: "ravi-live" });
    const m = /^\/event\/(\d{6,24})$/.exec(url.pathname);
    if (!m) return json(req, 404, { error: "not found" });
    try {
      const r = await getLive(m[1]);
      const body = Object.assign({}, r.live, r.stale ? { stale: true } : {});
      return json(req, 200, body, { "Cache-Control": "public, max-age=10" });
    } catch (e) {
      return json(req, 502, { error: "event unavailable" });
    }
  }
};
