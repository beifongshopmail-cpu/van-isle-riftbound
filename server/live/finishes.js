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
// THE HONOUR WEIGHT (plan 2 M3 block 4, Mako's yes 2026-11-02): a pick from a
// saved account carries a one-way stamp of that account (the worker alone
// says which account, X-Ravi-Acct; never a guest). When the player at a
// placing gives their own pick, every saved account's pick made BEFORE it at
// that placing is scored: it matched or it did not (a pick made after it
// earns nothing, so copying the answer does not pay). Each account keeps two
// numbers, matched and checked, and its picks weigh 2 * (matched + 1) /
// (checked + 2): 1 with no record, up to nearly 2 when they keep matching,
// down towards 0 when they keep missing. Unlinked picks weigh 1. The numbers
// are shown only to their own account (GET /hon), never to others, never as
// a list; they rate reports, never play. The link from a pick to its account
// goes with the pick at DAYS_KEEP; the two numbers stay, and go when the
// account is deleted (POST /hon/del) or after HON_IDLE days untouched.
//
// LIMITS: PER_DAY picks a day per connection (the address is kept only as a
// one-way stamp with the day in it, for that day), ROW_MAX phones per placing.

export const DAYS_OPEN = 14;
export const DAYS_KEEP = 45;
export const PER_DAY = 300;
export const ROW_MAX = 20;
export const HON_IDLE = 365;
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
const ACCT = /^[0-9a-f]{24}$/;

// how much a pick weighs, from its account's two numbers
export function weightOf(h) {
  return h && h.t > 0 ? 2 * (h.m + 1) / (h.t + 2) : 1;
}

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
// weigh(p) is a pick's weight (1 when not given).
export function tally(picks, weigh) {
  const c = new Map();
  for (const p of picks) c.set(p.l, (c.get(p.l) || 0) + (weigh ? weigh(p) : 1));
  let best = null, top = 0, level = false;
  c.forEach(function (raw, l) {
    const v = Math.round(raw * 1e6); // weights are fractions: level means level to a millionth
    if (v > top) { best = l; top = v; level = false; }
    else if (v === top) level = true;
  });
  return level ? { l: null, c: true, v: picks.length } : { l: best, c: false, v: picks.length };
}

function rowsOf(picks, owns, hons) {
  const weigh = hons ? function (p) { return p.a && hons.has(p.a) ? weightOf(hons.get(p.a)) : 1; } : null;
  const by = new Map(), own = new Map();
  for (const p of picks) { if (!by.has(p.r)) by.set(p.r, []); by.get(p.r).push(p); }
  for (const o of owns || []) own.set(o.r, o.who);
  const out = [];
  by.forEach(function (list, r) {
    const mine = own.has(r) ? list.filter(function (p) { return p.who === own.get(r); })[0] : null;
    if (mine) { out.push({ r: r, l: mine.l, c: false, v: list.length, o: true }); return; }
    const t = tally(list, weigh); out.push({ r: r, l: t.l, c: t.c, v: t.v });
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
  // the honour weight (block 4): a pick's account stamp, when the own pick came, the two numbers, and what was scored
  try { sql.exec("ALTER TABLE picks ADD COLUMN a TEXT"); } catch (e) { /* already there */ }
  try { sql.exec("ALTER TABLE own ADD COLUMN at INTEGER"); } catch (e) { /* already there */ }
  sql.exec("CREATE TABLE IF NOT EXISTS hon (k TEXT PRIMARY KEY, m INTEGER, t INTEGER, at INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS hsc (event TEXT, r INTEGER, k TEXT, hit INTEGER, PRIMARY KEY (event, r, k))");
  return {
    picks: (ev) => sql.exec("SELECT r, who, l, at, a FROM picks WHERE event = ?", ev).toArray(),
    put: (ev, r, who, l, at, a) => sql.exec("INSERT OR REPLACE INTO picks (event, r, who, l, at, a) VALUES (?, ?, ?, ?, ?, ?)", ev, r, who, l, at, a || null),
    del: (ev, r, who) => sql.exec("DELETE FROM picks WHERE event = ? AND r = ? AND who = ?", ev, r, who),
    owns: (ev) => sql.exec("SELECT r, who, at FROM own WHERE event = ?", ev).toArray(),
    setOwn: (ev, r, who, at) => sql.exec("INSERT OR REPLACE INTO own (event, r, who, at) VALUES (?, ?, ?, ?)", ev, r, who, at),
    hons: (keys) => { const m = new Map(); for (const k of keys) { const x = sql.exec("SELECT m, t FROM hon WHERE k = ?", k).toArray()[0]; if (x) m.set(k, { m: x.m, t: x.t }); } return m; },
    addHon: (k, dm, dt, at) => {
      const x = sql.exec("SELECT m, t FROM hon WHERE k = ?", k).toArray()[0] || { m: 0, t: 0 };
      sql.exec("INSERT OR REPLACE INTO hon VALUES (?, ?, ?, ?)", k, Math.max(0, x.m + dm), Math.max(0, x.t + dt), at);
    },
    scored: (ev, r) => sql.exec("SELECT k, hit FROM hsc WHERE event = ? AND r = ?", ev, r).toArray(),
    setScore: (ev, r, k, hit) => sql.exec("INSERT OR REPLACE INTO hsc VALUES (?, ?, ?, ?)", ev, r, k, hit),
    delScore: (ev, r, k) => sql.exec("DELETE FROM hsc WHERE event = ? AND r = ? AND k = ?", ev, r, k),
    forget: (k) => { sql.exec("DELETE FROM hon WHERE k = ?", k); sql.exec("DELETE FROM hsc WHERE k = ?", k); sql.exec("UPDATE picks SET a = NULL WHERE a = ?", k); },
    delOwn: (ev, r) => sql.exec("DELETE FROM own WHERE event = ? AND r = ?", ev, r),
    event: (ev) => sql.exec("SELECT n, k, start FROM events WHERE event = ?", ev).toArray()[0] || null,
    setEvent: (ev, f) => sql.exec("INSERT OR REPLACE INTO events VALUES (?, ?, ?, ?)", ev, f.n, f.k, f.start),
    used: (key, day) => { const x = sql.exec("SELECT day, c FROM lim WHERE key = ?", key).toArray()[0]; return x && x.day === day ? x.c : 0; },
    use: (key, day, c) => sql.exec("INSERT OR REPLACE INTO lim VALUES (?, ?, ?)", key, day, c),
    prune: (cut, day) => {
      sql.exec("DELETE FROM picks WHERE event IN (SELECT event FROM events WHERE start < ?)", cut);
      sql.exec("DELETE FROM own WHERE event IN (SELECT event FROM events WHERE start < ?)", cut);
      sql.exec("DELETE FROM hsc WHERE event IN (SELECT event FROM events WHERE start < ?)", cut);
      sql.exec("DELETE FROM events WHERE start < ?", cut);
      sql.exec("DELETE FROM hon WHERE at < ?", cut - (HON_IDLE - DAYS_KEEP) * DAY);
      sql.exec("DELETE FROM lim WHERE day <> ?", day);
    }
  };
}
export function memStore() {
  let picks = [], events = new Map(), lim = new Map(), own = [], hon = new Map(), hsc = [];
  return {
    picks: (ev) => picks.filter((p) => p.event === ev).map((p) => ({ r: p.r, who: p.who, l: p.l, at: p.at, a: p.a || null })),
    put: (ev, r, who, l, at, a) => { picks = picks.filter((p) => !(p.event === ev && p.r === r && p.who === who)); picks.push({ event: ev, r: r, who: who, l: l, at: at, a: a || null }); },
    del: (ev, r, who) => { picks = picks.filter((p) => !(p.event === ev && p.r === r && p.who === who)); },
    owns: (ev) => own.filter((o) => o.event === ev).map((o) => ({ r: o.r, who: o.who, at: o.at })),
    setOwn: (ev, r, who, at) => { own = own.filter((o) => !(o.event === ev && o.r === r)); own.push({ event: ev, r: r, who: who, at: at }); },
    hons: (keys) => { const m = new Map(); for (const k of keys) { const x = hon.get(k); if (x) m.set(k, { m: x.m, t: x.t }); } return m; },
    addHon: (k, dm, dt, at) => { const x = hon.get(k) || { m: 0, t: 0 }; hon.set(k, { m: Math.max(0, x.m + dm), t: Math.max(0, x.t + dt), at: at }); },
    scored: (ev, r) => hsc.filter((x) => x.event === ev && x.r === r).map((x) => ({ k: x.k, hit: x.hit })),
    setScore: (ev, r, k, hit) => { hsc = hsc.filter((x) => !(x.event === ev && x.r === r && x.k === k)); hsc.push({ event: ev, r: r, k: k, hit: hit }); },
    delScore: (ev, r, k) => { hsc = hsc.filter((x) => !(x.event === ev && x.r === r && x.k === k)); },
    forget: (k) => { hon.delete(k); hsc = hsc.filter((x) => x.k !== k); picks.forEach((p) => { if (p.a === k) p.a = null; }); },
    delOwn: (ev, r) => { own = own.filter((o) => !(o.event === ev && o.r === r)); },
    event: (ev) => events.get(ev) || null,
    setEvent: (ev, f) => events.set(ev, { n: f.n, k: f.k, start: f.start }),
    used: (key, day) => { const x = lim.get(key); return x && x.day === day ? x.c : 0; },
    use: (key, day, c) => lim.set(key, { day: day, c: c }),
    prune: (cut, day) => {
      const gone = new Set(); events.forEach((f, ev) => { if (f.start < cut) gone.add(ev); });
      picks = picks.filter((p) => !gone.has(p.event)); own = own.filter((o) => !gone.has(o.event)); hsc = hsc.filter((x) => !gone.has(x.event)); gone.forEach((ev) => events.delete(ev));
      hon.forEach((x, k) => { if (x.at < cut - (HON_IDLE - DAYS_KEEP) * DAY) hon.delete(k); });
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
    // the weights for one event's linked picks
    honsOf(picks) {
      const keys = new Set();
      for (const p of picks) if (p.a) keys.add(p.a);
      return keys.size ? this.db.hons(Array.from(keys)) : new Map();
    }
    rows(ev) { const ps = this.db.picks(ev); return rowsOf(ps, this.db.owns(ev), this.honsOf(ps)); }
    view(ev) {
      const f = this.db.event(ev);
      return { v: 1, id: ev, n: f ? f.n : null, k: f ? f.k : null, rows: this.rows(ev) };
    }
    // score one placing again against the player's own pick: each linked pick made before the
    // own pick came is matched (1) or not (0); what changed since the last scoring moves the numbers
    rescore(ev, r, now) {
      const o = this.db.owns(ev).filter((x) => x.r === r)[0] || null;
      const row = this.db.picks(ev).filter((p) => p.r === r);
      const mine = o ? row.filter((p) => p.who === o.who)[0] : null;
      const want = new Map();
      if (o && mine && Number.isFinite(o.at)) {
        row.slice().sort((a, b) => a.at - b.at).forEach((p) => {
          if (!p.a || p.who === o.who || p.a === mine.a || !(p.at < o.at) || want.has(p.a)) return;
          want.set(p.a, p.l === mine.l ? 1 : 0);
        });
      }
      const had = new Map();
      for (const x of this.db.scored(ev, r)) had.set(x.k, x.hit);
      had.forEach((hit, k) => { if (!want.has(k)) { this.db.addHon(k, -hit, -1, now); this.db.delScore(ev, r, k); } });
      want.forEach((hit, k) => {
        if (!had.has(k)) { this.db.addHon(k, hit, 1, now); this.db.setScore(ev, r, k, hit); }
        else if (had.get(k) !== hit) { this.db.addHon(k, hit - had.get(k), 0, now); this.db.setScore(ev, r, k, hit); }
      });
    }
    async fetch(req) {
      const u = new URL(req.url);
      if (req.method === "GET" && u.pathname === "/list") {
        const ids = String(u.searchParams.get("ids") || "").split(",").map(cleanEvent).filter(Boolean).slice(0, 200);
        const out = {};
        for (const ev of new Set(ids)) {
          const f = this.db.event(ev);
          if (!f) continue;
          const s = this.rows(ev).filter((x) => x.l).map((x) => [x.r, x.l]);
          if (s.length) out[ev] = { n: f.n, k: f.k, s: s };
        }
        return reply({ v: 1, events: out });
      }
      // your own two numbers, and deleting them (only the worker sets X-Ravi-Acct, from the account's token)
      if (u.pathname === "/hon" || u.pathname === "/hon/del") {
        const acct = String(req.headers.get("X-Ravi-Acct") || "");
        if (!ACCT.test(acct)) return reply({ error: "signed out" }, 400);
        const k = await sha("hon:" + acct);
        if (u.pathname === "/hon" && req.method === "GET") {
          const h = this.db.hons([k]).get(k) || { m: 0, t: 0 };
          return reply({ v: 1, m: h.m, t: h.t });
        }
        if (u.pathname === "/hon/del" && req.method === "POST") { this.db.forget(k); return reply({ ok: true }); }
        return reply({ error: "not allowed" }, 405);
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
      // a saved account's pick carries a one-way stamp of the account (the honour weight)
      const acct = String(req.headers.get("X-Ravi-Acct") || "");
      const ak = ACCT.test(acct) ? await sha("hon:" + acct) : null;
      const was = this.db.owns(ev).filter((o) => o.r === r)[0] || null;
      if (l === null) {
        this.db.del(ev, r, who);
        if (was && was.who === who) this.db.delOwn(ev, r);
      } else {
        if (!owner && !row.some((p) => p.who === who) && row.length >= ROW_MAX) return reply({ error: "This placing has enough picks." }, 429);
        this.db.put(ev, r, who, l, now, ak);
        // the own pick keeps the moment it first came while the same phone holds it
        if (owner) this.db.setOwn(ev, r, who, was && was.who === who && Number.isFinite(was.at) ? was.at : now);
      }
      this.rescore(ev, r, now);
      this.db.use(key, day, used + 1);
      this.db.prune(now - DAYS_KEEP * DAY, day);
      return reply(this.view(ev));
    }
  };
}
