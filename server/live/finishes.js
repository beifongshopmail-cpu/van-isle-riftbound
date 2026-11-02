// finishes.js -- the decks played at finished events, for the Tier list's
// Local view (M17 block 2, 2026-10-29). One Durable Object ("all") on SQLite.
//
// THE HONOUR SYSTEM (Mako 2026-10-29): anyone may fill in the legend for any
// placing at a finished event from the last DAYS_OPEN days, as many as they
// know; a dedicated player can keep a whole store's board up to date. Each
// placing counts the picks it has been given, one per phone per event: the
// legend with the most picks is the placing's legend. When two legends are
// level the placing is CONTESTED: it leaves the counts until another pick
// settles it. Nobody moderates; the crowd does.
//
// WHAT IS KEPT: the event id, the placing (Riot's own final standings decide
// which placings exist; the phone's word is never taken for them), the legend
// text, and a one-way stamp of the phone's secret FOR THAT EVENT ONLY, so a
// phone can change or take back its own pick and nothing links one phone's
// picks across events. Never a player's name (RULE -- Riot's policies: no
// player's results compiled across events). Kept DAYS_KEEP days, then gone.
//
// THE PLAYER'S OWN PICK (plan 2 M3 block 3, Mako's yes 2026-11-02): a pick
// sent by the account that claimed the Riot ID at that placing decides the
// placing outright. The worker alone says which Riot ID an account claimed
// (X-Ravi-Riot, from the account's token); Riot's final standings say whose
// placing it is. Only the pick's per-event stamp is marked, never the name.
//
// LIMITS: PER_DAY picks a day per connection (the address is kept only as a
// one-way stamp with the day in it, for that day), ROW_MAX phones per placing.

export const DAYS_OPEN = 14;
export const DAYS_KEEP = 45;
export const PER_DAY = 300;
export const ROW_MAX = 20;
const DAY = 86400000;

function cleanText(v, max) {
  return typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, "").trim().slice(0, max) : "";
}
export function cleanLegend(v) {
  const s = cleanText(v, 60);
  return s.length >= 2 ? s : null;
}
export function cleanEvent(v) {
  const m = /^(?:rb)?(\d{6,24})$/.exec(String(v == null ? "" : v));
  return m ? m[1] : null;
}
const SECRET = /^[0-9a-f]{32,64}$/;

export async function sha(text) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join("");
}

// A finished event's final shape from its live file, or a reason it cannot
// take picks: n is the number of placings in Riot's final standings (drops
// included), k the cut it played when it had a second stage (0 otherwise;
// the page uses RAVI's usual cut for its size).
export function finalOf(live, now) {
  if (!live || typeof live !== "object" || !Array.isArray(live.rounds)) return { error: "event unavailable" };
  if (live.status !== "done") return { error: "not finished" };
  if (live.format && live.format !== "CONSTRUCTED") return { error: "not constructed" };
  const start = Date.parse(live.startsAt || "");
  if (!isFinite(start) || start > now + DAY || now - start > DAYS_OPEN * DAY) return { error: "too old" };
  let last = null, k = 0;
  for (const r of live.rounds) {
    if (r && r.stage === 1 && Array.isArray(r.standings) && r.standings.length) last = r;
  }
  const two = live.rounds.filter(function (r) { return r && r.stage >= 2; });
  if (two.length) {
    const first = two.reduce(function (a, b) { return (b.stage < a.stage || (b.stage === a.stage && b.n < a.n)) ? b : a; });
    const seen = new Set();
    for (const t of first.tables || []) { if (t.a) seen.add(t.a.n + "#" + t.a.tag); if (t.b) seen.add(t.b.n + "#" + t.b.tag); }
    for (const b of first.byes || []) seen.add(b.n + "#" + b.tag);
    k = seen.size;
  }
  if (!last) return { error: "no standings" };
  const n = Math.min(last.standings.length, 512);
  return { n: n, k: k > 0 && k < n ? k : 0, start: start };
}

// Riot's final standings (the last stage 1 round's), or null
function standOf(live) {
  if (!live || typeof live !== "object" || !Array.isArray(live.rounds)) return null;
  let last = null;
  for (const r of live.rounds) if (r && r.stage === 1 && Array.isArray(r.standings) && r.standings.length) last = r;
  return last ? last.standings : null;
}

// One placing's picks -> its legend, or contested when two legends are level.
export function tally(picks) {
  const c = new Map();
  for (const p of picks) c.set(p.l, (c.get(p.l) || 0) + 1);
  let best = null, top = 0, level = false;
  c.forEach(function (v, l) {
    if (v > top) { best = l; top = v; level = false; }
    else if (v === top) level = true;
  });
  return level ? { l: null, c: true, v: picks.length } : { l: best, c: false, v: picks.length };
}

function rowsOf(picks, owns) {
  const by = new Map(), own = new Map();
  for (const p of picks) { if (!by.has(p.r)) by.set(p.r, []); by.get(p.r).push(p); }
  for (const o of owns || []) own.set(o.r, o.who);
  const out = [];
  by.forEach(function (list, r) {
    const mine = own.has(r) ? list.filter(function (p) { return p.who === own.get(r); })[0] : null;
    if (mine) { out.push({ r: r, l: mine.l, c: false, v: list.length, o: true }); return; }
    const t = tally(list); out.push({ r: r, l: t.l, c: t.c, v: t.v });
  });
  out.sort(function (a, b) { return a.r - b.r; });
  return out;
}

// storage: SQLite in the Durable Object, plain lists in the tests
function sqlStore(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS picks (event TEXT, r INTEGER, who TEXT, l TEXT, at INTEGER, PRIMARY KEY (event, r, who))");
  sql.exec("CREATE TABLE IF NOT EXISTS events (event TEXT PRIMARY KEY, n INTEGER, k INTEGER, start INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS lim (key TEXT PRIMARY KEY, day TEXT, c INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS own (event TEXT, r INTEGER, who TEXT, PRIMARY KEY (event, r))");
  return {
    picks: (ev) => sql.exec("SELECT r, who, l FROM picks WHERE event = ?", ev).toArray(),
    put: (ev, r, who, l, at) => sql.exec("INSERT OR REPLACE INTO picks VALUES (?, ?, ?, ?, ?)", ev, r, who, l, at),
    del: (ev, r, who) => sql.exec("DELETE FROM picks WHERE event = ? AND r = ? AND who = ?", ev, r, who),
    owns: (ev) => sql.exec("SELECT r, who FROM own WHERE event = ?", ev).toArray(),
    setOwn: (ev, r, who) => sql.exec("INSERT OR REPLACE INTO own VALUES (?, ?, ?)", ev, r, who),
    delOwn: (ev, r) => sql.exec("DELETE FROM own WHERE event = ? AND r = ?", ev, r),
    event: (ev) => sql.exec("SELECT n, k, start FROM events WHERE event = ?", ev).toArray()[0] || null,
    setEvent: (ev, f) => sql.exec("INSERT OR REPLACE INTO events VALUES (?, ?, ?, ?)", ev, f.n, f.k, f.start),
    used: (key, day) => { const x = sql.exec("SELECT day, c FROM lim WHERE key = ?", key).toArray()[0]; return x && x.day === day ? x.c : 0; },
    use: (key, day, c) => sql.exec("INSERT OR REPLACE INTO lim VALUES (?, ?, ?)", key, day, c),
    prune: (cut, day) => {
      sql.exec("DELETE FROM picks WHERE event IN (SELECT event FROM events WHERE start < ?)", cut);
      sql.exec("DELETE FROM own WHERE event IN (SELECT event FROM events WHERE start < ?)", cut);
      sql.exec("DELETE FROM events WHERE start < ?", cut);
      sql.exec("DELETE FROM lim WHERE day <> ?", day);
    }
  };
}
export function memStore() {
  let picks = [], events = new Map(), lim = new Map(), own = [];
  return {
    picks: (ev) => picks.filter((p) => p.event === ev).map((p) => ({ r: p.r, who: p.who, l: p.l })),
    put: (ev, r, who, l, at) => { picks = picks.filter((p) => !(p.event === ev && p.r === r && p.who === who)); picks.push({ event: ev, r: r, who: who, l: l, at: at }); },
    del: (ev, r, who) => { picks = picks.filter((p) => !(p.event === ev && p.r === r && p.who === who)); },
    owns: (ev) => own.filter((o) => o.event === ev).map((o) => ({ r: o.r, who: o.who })),
    setOwn: (ev, r, who) => { own = own.filter((o) => !(o.event === ev && o.r === r)); own.push({ event: ev, r: r, who: who }); },
    delOwn: (ev, r) => { own = own.filter((o) => !(o.event === ev && o.r === r)); },
    event: (ev) => events.get(ev) || null,
    setEvent: (ev, f) => events.set(ev, { n: f.n, k: f.k, start: f.start }),
    used: (key, day) => { const x = lim.get(key); return x && x.day === day ? x.c : 0; },
    use: (key, day, c) => lim.set(key, { day: day, c: c }),
    prune: (cut, day) => {
      const gone = new Set(); events.forEach((f, ev) => { if (f.start < cut) gone.add(ev); });
      picks = picks.filter((p) => !gone.has(p.event)); own = own.filter((o) => !gone.has(o.event)); gone.forEach((ev) => events.delete(ev));
      lim.forEach((x, k) => { if (x.day !== day) lim.delete(k); });
    }
  };
}

function reply(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export function makeFinishes(getLive) {
  return class Finishes {
    constructor(state, env) {
      this.state = state;
      this.env = env || {};
      this.db = state.db || sqlStore(state.storage.sql);
      this.fetcher = state.fetcher || fetch;
      this.now = state.now || (() => Date.now());
    }
    view(ev) {
      const f = this.db.event(ev);
      return { v: 1, id: ev, n: f ? f.n : null, k: f ? f.k : null, rows: rowsOf(this.db.picks(ev), this.db.owns(ev)) };
    }
    async fetch(req) {
      const u = new URL(req.url);
      if (req.method === "GET" && u.pathname === "/list") {
        const ids = String(u.searchParams.get("ids") || "").split(",").map(cleanEvent).filter(Boolean).slice(0, 200);
        const out = {};
        for (const ev of new Set(ids)) {
          const f = this.db.event(ev);
          if (!f) continue;
          const s = rowsOf(this.db.picks(ev), this.db.owns(ev)).filter((x) => x.l).map((x) => [x.r, x.l]);
          if (s.length) out[ev] = { n: f.n, k: f.k, s: s };
        }
        return reply({ v: 1, events: out });
      }
      const m = /^\/e\/(\d{6,24})$/.exec(u.pathname);
      if (!m) return reply({ error: "not found" }, 404);
      const ev = m[1];
      if (req.method === "GET") return reply(this.view(ev));
      if (req.method !== "POST") return reply({ error: "not allowed" }, 405);

      let b = null;
      try { b = await req.json(); } catch (e) { b = null; }
      if (!b || typeof b !== "object") return reply({ error: "bad request" }, 400);
      const r = Number.isInteger(b.r) && b.r >= 1 && b.r <= 512 ? b.r : null;
      const secret = typeof b.who === "string" && SECRET.test(b.who) ? b.who : null;
      const l = b.l === null ? null : cleanLegend(b.l);
      if (!r || !secret || (b.l !== null && !l)) return reply({ error: "bad request" }, 400);

      const now = this.now(), day = new Date(now).toISOString().slice(0, 10);
      const key = await sha("ip:" + String(req.headers.get("X-Ravi-Ip") || "") + ":" + day);
      const used = this.db.used(key, day);
      if (used >= PER_DAY) return reply({ error: "That is plenty for today. Try again tomorrow." }, 429);

      let f = this.db.event(ev);
      if (!f) {
        let live = null;
        try { live = (await getLive(ev, { fetch: this.fetcher, now: now })).live; } catch (e) { live = null; }
        const fin = finalOf(live, now);
        if (fin.error) return reply({ error: fin.error }, 409);
        f = { n: fin.n, k: fin.k, start: fin.start };
        this.db.setEvent(ev, f);
      }
      if (now - f.start > DAYS_OPEN * DAY) return reply({ error: "too old" }, 409);
      if (r > f.n) return reply({ error: "no such placing" }, 400);

      const who = await sha(secret + ":" + ev);
      const row = this.db.picks(ev).filter((p) => p.r === r);
      // is this the player at this placing? (the worker's claimed Riot ID against Riot's standings)
      const riot = cleanText(req.headers.get("X-Ravi-Riot") || "", 80).toLowerCase();
      let owner = false;
      if (riot && riot.indexOf("#") > 0) {
        let live = null;
        try { live = (await getLive(ev, { fetch: this.fetcher, now: now })).live; } catch (e) { live = null; }
        const st = standOf(live);
        const at = st ? st.filter(function (x) { return x && x.rank === r; })[0] : null;
        owner = !!at && (String(at.n || "") + "#" + String(at.tag || "")).toLowerCase() === riot;
      }
      if (l === null) {
        this.db.del(ev, r, who);
        if (this.db.owns(ev).some((o) => o.r === r && o.who === who)) this.db.delOwn(ev, r);
      } else {
        if (!owner && !row.some((p) => p.who === who) && row.length >= ROW_MAX) return reply({ error: "This placing has enough picks." }, 429);
        this.db.put(ev, r, who, l, now);
        if (owner) this.db.setOwn(ev, r, who);
      }
      this.db.use(key, day, used + 1);
      this.db.prune(now - DAYS_KEEP * DAY, day);
      return reply(this.view(ev));
    }
  };
}
