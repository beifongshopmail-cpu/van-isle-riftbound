// worker.js -- ravi-live, RAVI's server for live event data (M16).
// A Cloudflare Worker on the free tier. GET /event/<id> returns the event's
// small live file (see parse.js). It reads Riot's event page politely: a
// tiny "last changed" check first, the full page only when something
// changed, and at most one upstream check per event per FRESH_MS however
// many people ask. RAVI names itself honestly; it never claims to be Riot.

import { liveFromHtml, settle } from "./parse.js";
import { makeAlerts } from "./alerts.js";
import { vapidPublic } from "./push.js";
import { makeFinishes } from "./finishes.js";
import { makeAccounts } from "./accounts.js";

const UA = "VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)";
const GQL = "https://playriftbound.com/api/gql";
const POLLER = { op: "GetCompeteRbRefreshPoller", hash: "459dbd58b231ad1767b999a1bf987836123ac86a0b5110e166de15b69723ba0d" };
const PAGE = "https://playriftbound.com/en-US/events/";
const ORIGINS = ["https://ravi.tools"]; // the old github.io address only redirects here since M8 (dropped in the security check, Mako's yes 2026-10-31)
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

// The one place upstream is read. Exported for the tests. Every answer is settled (an event the
// store forgot to end counts as finished: parse.js settle); the held copy stays as Riot sent it.
export async function getLive(eid, opts) {
  const now = (opts && opts.now) || Date.now();
  const r = await readLive(eid, opts, now);
  const live = settle(r.live, now);
  return live === r.live ? r : Object.assign({}, r, { live: live });
}
async function readLive(eid, opts, now) {
  const fetcher = (opts && opts.fetch) || fetch;
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

// who a signed-in phone is, from its token (the accounts store's /me), or null
async function whoIs(req, env) {
  const auth = req.headers.get("Authorization");
  if (!auth || !env.ACCOUNTS) return null;
  try {
    const st = env.ACCOUNTS.get(env.ACCOUNTS.idFromName("all"));
    const r = await st.fetch(new Request("https://accounts/me", { method: "GET", headers: { "Content-Type": "application/json", "Authorization": auth.slice(0, 200), "X-Ravi-Ip": req.headers.get("CF-Connecting-IP") || "" } }));
    return r.ok ? await r.json().catch(function () { return null; }) : null;
  } catch (e) { return null; }
}
// a saved account's number (never a guest's): the honour weight's link (plan 2 M3 block 4)
function savedId(j) { return j && !j.guest && typeof j.id === "string" && /^[0-9a-f]{24}$/.test(j.id) ? j.id : null; }

async function toFinishes(req, env, path, method) {
  const init = { method: method, headers: { "Content-Type": "application/json", "X-Ravi-Ip": req.headers.get("CF-Connecting-IP") || "" } };
  if (path === "/hon") {
    // your own two numbers: only ever your own, so signed out has none
    const id = savedId(await whoIs(req, env));
    if (!id) return json(req, 401, { error: "signed out" });
    init.headers["X-Ravi-Acct"] = id;
  } else if (method === "POST") {
    const text = await req.text();
    if (text.length > 2048) return json(req, 413, { error: "too big" });
    init.body = text;
    // a signed-in pick carries the Riot ID its account claimed (plan 2 M3
    // block 3: the player's own pick decides their placing) and, for a saved
    // account, its number (block 4: the honour weight); only the worker sets
    // these headers, from the account's token, never from the phone
    const j = await whoIs(req, env);
    if (j && j.riot && typeof j.riot.n === "string" && typeof j.riot.tag === "string" && j.riot.tag) init.headers["X-Ravi-Riot"] = (j.riot.n + "#" + j.riot.tag).slice(0, 80);
    const id = savedId(j);
    if (id) init.headers["X-Ravi-Acct"] = id;
  }
  const stub = env.FINISHES.get(env.FINISHES.idFromName("all"));
  const r = await stub.fetch(new Request("https://finishes" + path, init));
  return json(req, r.status, await r.json().catch(function () { return {}; }));
}

// RAVI's own accounts (accounts.js, plan 2 M1): one Durable Object. The
// phone's token rides in the Authorization header (Safari keeps no cookie
// for this server from ravi.tools: a cross-site cookie is blocked).
export const Accounts = makeAccounts();

async function toAccounts(req, env, path) {
  const init = { method: req.method, headers: { "Content-Type": "application/json", "X-Ravi-Ip": req.headers.get("CF-Connecting-IP") || "" } };
  const auth = req.headers.get("Authorization");
  if (auth) init.headers.Authorization = auth.slice(0, 200);
  if (req.method === "POST") {
    const text = await req.text();
    if (text.length > (path === "/photo" ? 220000 : path === "/sync" ? 1100000 : 16384)) return json(req, 413, { error: "too big" });
    init.body = text;
  }
  // deleting an account deletes its honour numbers too (plan 2 M3 block 4): who it is, asked first
  const gone = path === "/delete" && req.method === "POST" && env.FINISHES ? savedId(await whoIs(req, env)) : null;
  const stub = env.ACCOUNTS.get(env.ACCOUNTS.idFromName("all"));
  // a GET keeps its search words (the Public view of decks, a shared deck's link: plan 2 M3), capped
  const search = req.method === "GET" ? new URL(req.url).search.slice(0, 4000) : "";
  const r = await stub.fetch(new Request("https://accounts" + path + search, init));
  if (gone && r.ok) {
    try { await env.FINISHES.get(env.FINISHES.idFromName("all")).fetch(new Request("https://finishes/hon/del", { method: "POST", headers: { "X-Ravi-Acct": gone } })); } catch (e) {}
  }
  if (/^\/b?pic\//.test(path) && r.ok) {
    // a player's photo: only ever a JPEG the server checked, never sniffed as anything else
    return new Response(r.body, { status: 200, headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'", "Cross-Origin-Resource-Policy": "cross-origin" } });
  }
  return json(req, r.status, await r.json().catch(function () { return {}; }));
}

async function toAlerts(req, env, path) {
  const text = await req.text();
  if (text.length > 4096) return json(req, 413, { error: "too big" });
  const stub = env.ALERTS.get(env.ALERTS.idFromName("all"));
  const r = await stub.fetch(new Request("https://alerts" + path, { method: "POST", body: text, headers: { "Content-Type": "application/json", "X-Ravi-Ip": req.headers.get("CF-Connecting-IP") || "" } }));
  return json(req, r.status, await r.json().catch(function () { return {}; }));
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: Object.assign({ "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": /^\/(acct|finishes)\//.test(url.pathname) ? "Content-Type, Authorization" : "Content-Type", "Access-Control-Max-Age": "86400" }, cors(req)) });
    const ROUTE = { "/alerts": "/add", "/alerts/off": "/off", "/alerts/test": "/test" };
    if (req.method === "POST" && ROUTE[url.pathname]) {
      if (!env || !env.ALERTS) return json(req, 503, { error: "alerts are not set up" });
      return toAlerts(req, env, ROUTE[url.pathname]);
    }
    const am = /^\/acct(\/[a-z]+(?:\/[a-z]+)?|\/b?pic\/[0-9a-f]{24})$/.exec(url.pathname);
    if (am) {
      if (!env || !env.ACCOUNTS) return json(req, 503, { error: "accounts are not set up" });
      if (req.method !== "GET" && req.method !== "POST") return json(req, 405, { error: "not allowed" });
      return toAccounts(req, env, am[1]);
    }
    const fm = /^\/finishes(?:\/(\d{6,24}|hon))?$/.exec(url.pathname);
    if (fm) {
      if (!env || !env.FINISHES) return json(req, 503, { error: "not set up" });
      if (fm[1] === "hon") return req.method === "GET" ? toFinishes(req, env, "/hon", "GET") : json(req, 405, { error: "not allowed" });
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
