/* live.js -- live event data for RAVI's pages (M16). No dependencies.
   Reads the small live file from RAVI's server (ravi-live, server/live in
   this repo), which reads Riot's public event page politely. Shared by the
   Events page (the live line and the Live menu), the Game page (the round
   clock) and Top cut (the prefill). Pure helpers are exported for the tests
   in Node as module.exports; in a page they hang on window.RAVI_LIVE.
   Names from outside are only ever written with textContent. */
(function (root) {
  "use strict";

  var BASE = "https://ravi-live.beifongshopmail.workers.dev";
  var ME_KEY = "vir.me.v1";
  var TIMEOUT = 8000;

  // "rb117458478959403271" or "117458478959403271" -> the digits, or null
  function tid(evId) {
    var m = /^(?:rb)?(\d{6,24})$/.exec(String(evId == null ? "" : evId));
    return m ? m[1] : null;
  }

  // a live file is trusted only in RAVI's own shape
  function valid(j) {
    return !!(j && typeof j === "object" && j.v === 1 && typeof j.id === "string" && Array.isArray(j.rounds));
  }

  // THE TEST EVENT (?sim=1, id 1) plays a pretend event so every live part can be
  // tried without a real one: 8 players, best of 3, round 1 done, round 2 running
  // (its clock started 12 minutes before the first look this session), my name at
  // table 2 when one is saved. Made here; it never reaches the server.
  var DEMO_ID = "1";
  function isDemo(evId) { return String(evId) === DEMO_ID; }
  function demo() {
    var now = Date.now(), start = now - 12 * 60000;
    try {
      var ss = root.sessionStorage, k = "ravi.demo.start.v1", v = +ss.getItem(k);
      if (v && now - v < 50 * 60000) start = v; else ss.setItem(k, String(start));
    } catch (e) {}
    var mine = me() || { n: "You", tag: "TEST" };
    var P = [mine, { n: "Ashwind", tag: "NA1" }, { n: "Kelpie", tag: "0420" }, { n: "Brightforge", tag: "NA1" },
      { n: "Moss Lantern", tag: "VIC" }, { n: "Tidecaller", tag: "NA1" }, { n: "Quill", tag: "7781" }, { n: "Orchard", tag: "NA1" }];
    function t(n, a, b, res, games, st) { return { t: n, st: st || "done", a: P[a], b: P[b], res: res, games: games }; }
    var r1 = { stage: 1, n: 1, st: "done", start: new Date(start - 65 * 60000).toISOString(), min: 50, byes: [],
      tables: [t(1, 1, 0, "L", ["W", "L", "L"]), t(2, 2, 3, "W", ["W", "W", null]), t(3, 4, 5, "D", ["W", "L", null]), t(4, 6, 7, "W", ["L", "W", "W"])],
      standings: [
        { rank: 1, n: P[2].n, tag: P[2].tag, pts: 3, w: 1, l: 0, d: 0, omw: 0, gw: 1, ogw: 0 },
        { rank: 2, n: P[0].n, tag: P[0].tag, pts: 3, w: 1, l: 0, d: 0, omw: 0, gw: 0.667, ogw: 0.333 },
        { rank: 3, n: P[6].n, tag: P[6].tag, pts: 3, w: 1, l: 0, d: 0, omw: 0, gw: 0.667, ogw: 0.333 },
        { rank: 4, n: P[4].n, tag: P[4].tag, pts: 1, w: 0, l: 0, d: 1, omw: 0.333, gw: 0.5, ogw: 0.5 },
        { rank: 5, n: P[5].n, tag: P[5].tag, pts: 1, w: 0, l: 0, d: 1, omw: 0.333, gw: 0.5, ogw: 0.5 },
        { rank: 6, n: P[1].n, tag: P[1].tag, pts: 0, w: 0, l: 1, d: 0, omw: 1, gw: 0.333, ogw: 0.667 },
        { rank: 7, n: P[7].n, tag: P[7].tag, pts: 0, w: 0, l: 1, d: 0, omw: 1, gw: 0.333, ogw: 0.667 },
        { rank: 8, n: P[3].n, tag: P[3].tag, pts: 0, w: 0, l: 1, d: 0, omw: 1, gw: 0, ogw: 1 }] };
    var r2 = { stage: 1, n: 2, st: "live", start: new Date(start).toISOString(), min: 50, byes: [],
      tables: [t(1, 2, 6, "W", ["W", "W", null]), t(2, 0, 4, null, ["W", null, null], "playing"), t(3, 5, 1, null, [null, null, null], "playing"), t(4, 7, 3, "L", ["L", "L", null])],
      standings: null };
    return { v: 1, id: DEMO_ID, name: "Test event (pretend live data)", startsAt: r1.start, endsAt: null, updatedAt: new Date(now).toISOString(), fetchedAt: new Date(now).toISOString(),
      type: "NEXUS_NIGHT", format: "CONSTRUCTED", structure: "SWISS", bestOf: 3, roundCount: 3, capacity: 8, players: 8, dropped: 0, status: "live", rounds: [r1, r2], demo: true };
  }

  function get(evId, cb) {
    if (isDemo(evId)) { setTimeout(function () { cb(demo()); }, 0); return; }
    var id = tid(evId);
    if (!id || typeof fetch !== "function") { cb(null); return; }
    var done = false;
    var t = setTimeout(function () { if (!done) { done = true; cb(null); } }, TIMEOUT);
    fetch(BASE + "/event/" + id, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (done) return; done = true; clearTimeout(t); cb(valid(j) && j.id === id ? j : null); })
      .catch(function () { if (done) return; done = true; clearTimeout(t); cb(null); });
  }

  // ---- my Riot name, on this phone only ----
  function parseName(s) {
    s = String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (!s) return null;
    var i = s.lastIndexOf("#");
    var n = (i >= 0 ? s.slice(0, i) : s).trim().slice(0, 40);
    var tag = (i >= 0 ? s.slice(i + 1) : "").trim().slice(0, 12);
    return n ? { n: n, tag: tag } : null;
  }
  function nameText(p) { return p ? p.n + (p.tag ? "#" + p.tag : "") : ""; }
  function me(store) {
    try { var v = JSON.parse((store || root.localStorage).getItem(ME_KEY) || "null"); return v && typeof v.n === "string" ? parseName(nameText(v)) : null; }
    catch (e) { return null; }
  }
  function setMe(s, store) {
    var p = parseName(s);
    try {
      var st = store || root.localStorage;
      if (p) st.setItem(ME_KEY, JSON.stringify(p)); else st.removeItem(ME_KEY);
    } catch (e) {}
    return p;
  }
  // A typed tag must match; with no tag typed, the name alone does.
  function isMe(p, mine) {
    if (!p || !mine) return false;
    if (String(p.n).toLowerCase() !== mine.n.toLowerCase()) return false;
    return !mine.tag || String(p.tag || "").toLowerCase() === mine.tag.toLowerCase();
  }

  // ---- reading the file ----
  // a round whose pairings are out (tables or byes)
  function paired(r) { return !!(r && ((r.tables && r.tables.length) || (r.byes && r.byes.length))); }
  // the round to show first: the one running, else the newest with pairings
  // out (posted before its clock, or the one just played), else the newest
  function current(live) {
    if (!valid(live) || !live.rounds.length) return null;
    for (var i = 0; i < live.rounds.length; i++) if (live.rounds[i].st === "live") return live.rounds[i];
    for (var j = live.rounds.length - 1; j >= 0; j--) if (paired(live.rounds[j])) return live.rounds[j];
    return live.rounds[live.rounds.length - 1];
  }
  // time left on a running round, from Riot's start and length
  function clock(round, now) {
    if (!round || round.st !== "live" || !round.start || !round.min) return null;
    var end = Date.parse(round.start) + round.min * 60000;
    if (!isFinite(end)) return null;
    var left = end - (now == null ? Date.now() : now);
    return { end: end, left: left, over: left < 0 };
  }
  function mmss(ms) {
    var s = Math.max(0, Math.floor(Math.abs(ms) / 1000));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  // my table in a round: { table, mine: "a" or "b", opp } or { bye: true }
  function myTable(round, mine) {
    if (!round || !mine) return null;
    for (var i = 0; i < round.tables.length; i++) {
      var t = round.tables[i];
      if (isMe(t.a, mine)) return { table: t, mine: "a", opp: t.b };
      if (isMe(t.b, mine)) return { table: t, mine: "b", opp: t.a };
    }
    for (var j = 0; j < (round.byes || []).length; j++) if (isMe(round.byes[j], mine)) return { bye: true };
    return null;
  }
  // a table's result for one side: W, L, D or null
  function resultFor(t, side) {
    if (!t || !t.res) return null;
    if (side === "a" || t.res === "D") return t.res;
    return t.res === "W" ? "L" : "W";
  }
  // my record over finished rounds: wins, losses, draws (a bye is a win)
  function myRecord(live, mine) {
    var rec = { w: 0, l: 0, d: 0, rounds: 0 };
    if (!valid(live) || !mine) return null;
    var found = false;
    for (var i = 0; i < live.rounds.length; i++) {
      var r = live.rounds[i];
      if (r.st !== "done") continue;
      var m = myTable(r, mine);
      if (!m) continue;
      found = true; rec.rounds++;
      var x = m.bye ? "W" : resultFor(m.table, m.mine);
      if (x === "W") rec.w++; else if (x === "L") rec.l++; else if (x === "D") rec.d++;
    }
    return found ? rec : null;
  }
  // standings to show: the newest finished round's
  function standings(live) {
    if (!valid(live)) return null;
    for (var i = live.rounds.length - 1; i >= 0; i--) if (live.rounds[i].standings) return { round: live.rounds[i], rows: live.rounds[i].standings };
    return null;
  }
  // one short line for the event card
  function line(live, now) {
    if (!valid(live)) return "";
    var r = current(live), of = live.roundCount ? " of " + live.roundCount : "";
    if (live.status === "done") return "Finished";
    if (!r) return "";
    if (r.st === "live") {
      var c = clock(r, now);
      return "Round " + r.n + of + (c ? (c.over ? ", over time" : ", " + Math.ceil(c.left / 60000) + " min left") : "");
    }
    if (r.st === "next") return paired(r) ? "Round " + r.n + of + ": pairings are up" : "";
    return "Round " + r.n + of + " done" + (live.roundCount && r.n >= live.roundCount ? "" : ", next pairings soon");
  }

  // ---- pairing alerts (the alerts-only worker, alerts-sw.js) ----
  var AL_KEY = "vir.alerts.v1";
  function alertsSupported() {
    return !!(root.navigator && "serviceWorker" in root.navigator && "PushManager" in root && "Notification" in root);
  }
  function alertsSet(store) { try { var o = JSON.parse((store || root.localStorage).getItem(AL_KEY) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function alertOn(evId) { var id = tid(evId); return !!(id && alertsSet()[id]); }
  function mark(id, on) {
    var o = alertsSet();
    if (on) o[id] = Date.now(); else delete o[id];
    // forget alerts for events more than a day old
    for (var k in o) if (o.hasOwnProperty(k) && Date.now() - o[k] > 86400000) delete o[k];
    try { root.localStorage.setItem(AL_KEY, JSON.stringify(o)); } catch (e) {}
  }
  function b64uBytes(s) {
    s = String(s).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function post(path, body) {
    return fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error("server " + r.status); return r.json(); });
  }
  // Turns alerts on for one event: asks the phone, then tells the server.
  // cb(null) when on; cb("words") when not, said plainly.
  function alertStart(evId, mine, swUrl, cb) {
    var id = tid(evId);
    if (!id || !mine) { cb("Save your Riot name first."); return; }
    if (!alertsSupported()) { cb("Alerts need RAVI opened from your Home Screen."); return; }
    root.Notification.requestPermission().then(function (p) {
      if (p !== "granted") throw new Error("denied");
      return root.navigator.serviceWorker.register(swUrl).then(function () { return root.navigator.serviceWorker.ready; });
    }).then(function (reg) {
      return fetch(BASE + "/vapid").then(function (r) { if (!r.ok) throw new Error("server " + r.status); return r.json(); }).then(function (v) {
        return reg.pushManager.getSubscription().then(function (s) {
          return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(v.key) });
        });
      });
    }).then(function (sub) {
      var j = sub.toJSON();
      return post("/alerts", { event: id, sub: { endpoint: j.endpoint, keys: j.keys }, me: mine });
    }).then(function () { mark(id, true); cb(null); })
      .catch(function (e) { cb(e && e.message === "denied" ? "Alerts are off for RAVI in your phone's Settings." : "Alerts did not turn on. Try again in a minute."); });
  }
  // One test alert to this phone, any time (App settings, and the test event).
  function alertTest(swUrl, cb) {
    if (!alertsSupported()) { cb("Alerts need RAVI opened from your Home Screen."); return; }
    root.Notification.requestPermission().then(function (p) {
      if (p !== "granted") throw new Error("denied");
      return root.navigator.serviceWorker.register(swUrl).then(function () { return root.navigator.serviceWorker.ready; });
    }).then(function (reg) {
      return fetch(BASE + "/vapid").then(function (r) { if (!r.ok) throw new Error("server " + r.status); return r.json(); }).then(function (v) {
        return reg.pushManager.getSubscription().then(function (s) {
          return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(v.key) });
        });
      });
    }).then(function (sub) {
      var j = sub.toJSON();
      return post("/alerts/test", { sub: { endpoint: j.endpoint, keys: j.keys } });
    }).then(function () { cb(null); })
      .catch(function (e) { cb(e && e.message === "denied" ? "Alerts are off for RAVI in your phone's Settings." : "The test alert did not send. Try again in a minute."); });
  }
  function alertStop(evId, cb) {
    var id = tid(evId);
    mark(id, false);
    if (!alertsSupported()) { cb(null); return; }
    root.navigator.serviceWorker.getRegistration().then(function (reg) { return reg && reg.pushManager.getSubscription(); })
      .then(function (s) { return s ? post("/alerts/off", { event: id, endpoint: s.endpoint }) : null; })
      .then(function () { cb(null); }, function () { cb(null); });
  }

  // ---- visiting a real event anywhere (the test switch ?visit=<id>) ----
  // ?visit=<PlayRiftbound event id> on the Events page adds that one real
  // event to today's list ON THIS PHONE ONLY (localStorage; nothing in data/,
  // nobody else sees it), so every live part can be tried on any event in the
  // world. ?visit=0 removes it, and it lapses by itself after its day. The
  // Events page, the Game page and Top cut all read it through withVisit.
  // An id the server cannot read is refused and nothing is kept.
  var VISIT_KEY = "vir.visit.v1";
  var VISIT_TYPES = { OPEN_PLAY: "open", LEARN_TO_PLAY: "learn", NEXUS_NIGHT: "nexus", SUMMONER_SKIRMISH: "skirmish", PRE_RIFT: "prerift" };
  // today as the app's pages key it (the island's day)
  function vanToday(now) {
    var o = {};
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(now == null ? Date.now() : now)).forEach(function (p) { o[p.type] = p.value; });
    return o.year + "-" + o.month + "-" + o.day;
  }
  // a live file -> one event in data/events.json's shape, on today's list; its
  // store is the event's own name, so the Game page's list names it (Mako 2026-10-29)
  function visitEvent(live, now) {
    if (!valid(live) || !tid(live.id)) return null;
    var start = typeof live.startsAt === "string" && isFinite(Date.parse(live.startsAt)) ? live.startsAt : "";
    var time = "";
    if (start) { try { time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(start)); } catch (e) {} }
    var min = null;
    for (var i = 0; i < live.rounds.length; i++) if (live.rounds[i].min) { min = live.rounds[i].min; break; }
    var cnt = function (v) { return typeof v === "number" && isFinite(v) && v >= 0 ? v : null; };
    return {
      id: "rb" + tid(live.id), name: String(live.name || "Event").slice(0, 120), type: VISIT_TYPES[live.type] || "other",
      start: start, end: typeof live.endsAt === "string" ? live.endsAt : null, day: vanToday(now), time: time,
      venue: "Visiting (test)", city: "", address: "", region: "victoria",
      cap: cnt(live.capacity), reg: cnt(live.players), cents: 0, currency: "", updated: null,
      round: min, wins: live.bestOf === 3 ? 2 : (live.bestOf === 1 ? 1 : null), sid: null, store: String(live.name || "Event").slice(0, 60), visit: true
    };
  }
  // the visited event, or null; one from an earlier day is dropped
  function visit(store, now) {
    var st = store || root.localStorage, o = null;
    try { o = JSON.parse(st.getItem(VISIT_KEY) || "null"); } catch (e) { o = null; }
    if (!o) return null;
    var ok = o && typeof o === "object" && o.ev && typeof o.ev === "object" && o.day === vanToday(now) && o.ev.day === o.day && /^rb\d{6,24}$/.test(String(o.ev.id));
    if (!ok) { try { st.removeItem(VISIT_KEY); } catch (e) {} return null; }
    o.ev.visit = true;
    return o.ev;
  }
  function visitClear(store) { try { (store || root.localStorage).removeItem(VISIT_KEY); } catch (e) {} }
  // a list of events plus the visited one (once; an event already listed stays as listed)
  function withVisit(list, store, now) {
    var v = visit(store, now);
    list = Array.isArray(list) ? list : [];
    if (!v) return list;
    for (var i = 0; i < list.length; i++) if (list[i] && String(list[i].id) === v.id) return list;
    return list.concat([v]);
  }
  // Reads ?visit= from a page's query. Returns false when there is none;
  // otherwise true, and later cb("added", ev), cb("cleared") or cb("refused").
  function visitQuery(search, cb, store) {
    var q = null;
    try { q = new URLSearchParams(search || "").get("visit"); } catch (e) { q = null; }
    if (q === null) return false;
    var st = store || root.localStorage;
    if (q === "0") { visitClear(st); setTimeout(function () { cb("cleared"); }, 0); return true; }
    var id = tid(String(q).trim());
    if (!id) { setTimeout(function () { cb("refused"); }, 0); return true; }
    get(id, function (live) {
      var ev = live ? visitEvent(live) : null;
      if (!ev) { cb("refused"); return; }
      try { st.setItem(VISIT_KEY, JSON.stringify({ v: 1, day: ev.day, ev: ev })); } catch (e) { cb("refused"); return; }
      cb("added", ev);
    });
    return true;
  }

  var api = { BASE: BASE, ME_KEY: ME_KEY, VISIT_KEY: VISIT_KEY, vanToday: vanToday, visitEvent: visitEvent, visit: visit, visitClear: visitClear, withVisit: withVisit, visitQuery: visitQuery, tid: tid, valid: valid, get: get, parseName: parseName, nameText: nameText, me: me, setMe: setMe, isMe: isMe, current: current, paired: paired, clock: clock, mmss: mmss, myTable: myTable, resultFor: resultFor, myRecord: myRecord, standings: standings, line: line, alertsSupported: alertsSupported, alertOn: alertOn, alertStart: alertStart, alertStop: alertStop, alertTest: alertTest, isDemo: isDemo, demo: demo };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RAVI_LIVE = api;
})(typeof window !== "undefined" ? window : globalThis);
