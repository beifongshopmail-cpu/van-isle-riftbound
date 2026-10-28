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

  function get(evId, cb) {
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
  // the round to show first: the one running, else the newest
  function current(live) {
    if (!valid(live) || !live.rounds.length) return null;
    for (var i = 0; i < live.rounds.length; i++) if (live.rounds[i].st === "live") return live.rounds[i];
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
    return "Round " + r.n + of + " done, next pairings soon";
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
  function alertStop(evId, cb) {
    var id = tid(evId);
    mark(id, false);
    if (!alertsSupported()) { cb(null); return; }
    root.navigator.serviceWorker.getRegistration().then(function (reg) { return reg && reg.pushManager.getSubscription(); })
      .then(function (s) { return s ? post("/alerts/off", { event: id, endpoint: s.endpoint }) : null; })
      .then(function () { cb(null); }, function () { cb(null); });
  }

  var api = { BASE: BASE, ME_KEY: ME_KEY, tid: tid, valid: valid, get: get, parseName: parseName, nameText: nameText, me: me, setMe: setMe, isMe: isMe, current: current, clock: clock, mmss: mmss, myTable: myTable, resultFor: resultFor, myRecord: myRecord, standings: standings, line: line, alertsSupported: alertsSupported, alertOn: alertOn, alertStart: alertStart, alertStop: alertStop };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RAVI_LIVE = api;
})(typeof window !== "undefined" ? window : globalThis);
