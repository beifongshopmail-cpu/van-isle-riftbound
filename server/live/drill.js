// drill.js -- the restore drill (plan 2 M10 block 4, 2026-11-15). RAVI's backup is Cloudflare's own
// point-in-time recovery of each SQLite Durable Object: any moment of the last 30 days can be put back
// (ctx.storage.getBookmarkForTime, onNextSessionRestoreBookmark; records: ARCH -- account data, its
// backup and the server's limits). This object proves that it works, on this account and plan, without
// touching real data: it is its own store, holding nothing but the drill's two rows.
//
// One drill (the worker's GET /drill runs the three steps in order):
//   POST /start   keep row 1, take a bookmark, keep row 2
//   POST /restore put the store back to the bookmark and restart it
//   GET  /read    the rows now: [1] means the restore worked; the result is kept for the next asker
// A drill runs at most once in 10 minutes; inside that, /start answers with the last result.
"use strict";

export const DRILL_GAP = 10 * 60000;

export function makeDrill() {
  return class Drill {
    constructor(state) {
      this.state = state;
      this.sql = state.storage.sql;
      this.sql.exec("CREATE TABLE IF NOT EXISTS t (v INTEGER)");
      this.sql.exec("CREATE TABLE IF NOT EXISTS m (k TEXT PRIMARY KEY, v TEXT)");
    }
    get(k) { const r = this.sql.exec("SELECT v FROM m WHERE k = ?", k).toArray(); return r.length ? r[0].v : null; }
    set(k, v) { this.sql.exec("INSERT INTO m (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, String(v)); }
    rows() { return this.sql.exec("SELECT v FROM t ORDER BY v").toArray().map(function (r) { return r.v; }); }
    async fetch(req) {
      const path = new URL(req.url).pathname;
      const out = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { "Content-Type": "application/json" } });
      if (path === "/start" && req.method === "POST") {
        const at = +this.get("at") || 0, now = Date.now();
        if (now - at < DRILL_GAP && now >= at) return out(200, { recent: true, last: JSON.parse(this.get("last") || "null") });
        this.set("at", now);
        this.sql.exec("DELETE FROM t");
        this.sql.exec("INSERT INTO t (v) VALUES (1)");
        const bm = await this.state.storage.getCurrentBookmark();
        this.sql.exec("INSERT INTO t (v) VALUES (2)");
        return out(200, { bookmark: bm, rows: this.rows() });
      }
      if (path === "/restore" && req.method === "POST") {
        const j = await req.json().catch(function () { return {}; });
        if (typeof j.bookmark !== "string" || j.bookmark.length > 200) return out(400, { error: "no bookmark" });
        await this.state.storage.onNextSessionRestoreBookmark(j.bookmark);
        // the store restarts; the restore happens as it comes back
        this.state.abort("restore drill");
        return out(200, { restoring: true });
      }
      if (path === "/read" && req.method === "GET") {
        const rows = this.rows(), res = { ok: rows.length === 1 && rows[0] === 1, rows: rows, at: Date.now() };
        this.set("last", JSON.stringify(res));
        return out(200, res);
      }
      return out(404, { error: "not found" });
    }
  };
}

// the worker's side: the three steps against the drill's own store, never another
export async function runDrill(ns) {
  const stub = function () { return ns.get(ns.idFromName("drill")); };
  const t0 = Date.now();
  const a = await (await stub().fetch(new Request("https://drill/start", { method: "POST" }))).json();
  if (a.recent) return Object.assign({ recent: true }, a.last || { ok: null });
  if (!a.bookmark || JSON.stringify(a.rows) !== "[1,2]") return { ok: false, step: "start", got: a };
  try { await stub().fetch(new Request("https://drill/restore", { method: "POST", body: JSON.stringify({ bookmark: a.bookmark }) })); } catch (e) { /* the restart ends that call */ }
  let r = null;
  for (let i = 0; i < 5; i++) {
    try { r = await (await stub().fetch(new Request("https://drill/read"))).json(); break; } catch (e) { await new Promise(function (ok) { setTimeout(ok, 400); }); }
  }
  if (!r) return { ok: false, step: "read" };
  return { ok: r.ok, rows: r.rows, ms: Date.now() - t0 };
}
