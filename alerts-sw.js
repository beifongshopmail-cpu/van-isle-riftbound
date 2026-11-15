/* alerts-sw.js -- RAVI's one service worker: alerts (M16) and the offline copy (plan 2 M10 block 3).
   One worker, not two: pages.js registers it on every page (the installed app and a Safari tab), and
   the alert switches register the same file, so an alert subscription carries over.

   THE OFFLINE COPY (Mako's yes 2026-11-15; records: NEXT -- M10 handoff, BLOCK 3 DESIGN).
   - Fresh first. With a connection every page, script and data file comes from the network exactly
     as before, so a new version arrives the way it always has and nobody is stuck on an old copy:
     no 'update available' step, no version to bump. With no connection, or no answer in 3 seconds,
     the worker serves the copy it saved. Only same-origin GETs are touched; the server, Riot's hosts
     and anything else pass straight through, never saved.
   - What is saved: on an open with a connection (at most every 10 minutes; pages.js asks a few
     seconds after the page has loaded, so it never competes with the page itself) the worker re-reads its
     whole list (offline.json, written by offline-list.js) into a fresh copy and switches to it only
     once every file has arrived, so the saved copy is one consistent snapshot. Each file is asked
     for with no-cache, so an unchanged file costs a short answer. Pages and data read since are kept
     in the current copy too. Never data/log or data/hist.
   - Card pictures (cards/art, named by content, so a saved one never goes stale) are saved as they
     are seen, newest kept (about 60 MB at most), plus the legends' small pictures up front so a
     first match with no signal has its art.
   - A saved data file served to a page is told to that page (a message), and pages.js shows one line
     in place of the late-data line: 'No connection. Showing what was saved Nov 14.'
   - A page never saved, opened with no signal, gets one plain screen saying RAVI saves itself the
     first time it opens with signal.
   Anything that goes wrong inside the handler falls through to the network, so a broken copy can
   never keep a page from loading. */
"use strict";
var HOME = new URL("./", self.location.href).href;
var META = "ravi-meta", COPY_A = "ravi-copy-a", COPY_B = "ravi-copy-b", ART_S = "ravi-art-s", ART_F = "ravi-art-f";
var WAIT = 3000, EVERY = 10 * 60000, SMALL_MAX = 1500, FULL_MAX = 500;   // 1,500 x ~14 KB + 500 x ~80 KB: about 60 MB

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    var mine = [META, COPY_A, COPY_B, ART_S, ART_F];
    return Promise.all(ks.filter(function (k) { return /^ravi-/.test(k) && mine.indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).catch(function () {}).then(function () { return self.clients.claim(); }));
});

// ---- the copy's bookkeeping: which copy is current, when the list was last read ----
var CUR = null;
function meta() {
  return caches.open(META).then(function (c) { return c.match(HOME + "__meta"); })
    .then(function (r) { return r ? r.json() : {}; }).catch(function () { return {}; })
    .then(function (m) { m.cur = m.cur === COPY_B ? COPY_B : COPY_A; m.tried = +m.tried || 0; CUR = m.cur; return m; });
}
function setMeta(m) {
  CUR = m.cur;
  return caches.open(META).then(function (c) { return c.put(HOME + "__meta", new Response(JSON.stringify(m), { headers: { "Content-Type": "application/json" } })); });
}
function current() { return CUR ? Promise.resolve(CUR) : meta().then(function (m) { return m.cur; }); }

// the address a file is kept under: no query, and a folder by its slash form
function keyOf(url) { return url.origin + url.pathname; }
function rel(url) { return url.href.indexOf(HOME) === 0 ? url.href.slice(HOME.length).split("?")[0].split("#")[0] : null; }
function isArt(r) { return /^cards\/art\/[^\/]+\.webp$/.test(r); }
function skip(r) { return r === null || /^data\/(log|hist)\//.test(r) || /\.ics$/.test(r) || r === "alerts-sw.js"; }
function isData(r) { return /\.json$/.test(r); }

// a response as kept: the same answer, with the time it was saved
function stamped(res) {
  return res.blob().then(function (b) {
    var h = new Headers(res.headers); h.set("X-Ravi-Saved", String(Date.now()));
    return new Response(b, { status: res.status, statusText: res.statusText, headers: h });
  });
}
function keep(key, res) {
  if (!res || res.status !== 200 || res.type !== "basic") { return Promise.resolve(); }
  return current().then(function (name) { return Promise.all([caches.open(name), stamped(res)]); })
    .then(function (a) { return a[0].put(key, a[1]); }).catch(function () {});
}
function saved(url) {
  return current().then(function (name) { return caches.open(name); }).then(function (c) {
    var k = keyOf(url);
    return c.match(k).then(function (hit) {
      if (hit) { return hit; }
      if (/\/index\.html$/.test(k)) { return c.match(k.replace(/index\.html$/, "")); }
      if (/\/$/.test(k)) { return c.match(k + "index.html"); }
      return null;
    });
  }).catch(function () { return null; });
}

// ---- reading the whole list into a fresh copy, then switching to it ----
var BUSY = null;
function refresh(force) {
  if (BUSY) { return BUSY; }
  BUSY = meta().then(function (m) {
    var now = Date.now();
    if (!force && now - m.tried < EVERY && now >= m.tried) { return; }
    var next = m.cur === COPY_A ? COPY_B : COPY_A;
    return setMeta({ cur: m.cur, at: m.at || 0, tried: now })
      .then(function () { return fetch(HOME + "offline.json", { cache: "no-cache" }); })
      .then(function (r) { if (!r.ok) { throw new Error("list " + r.status); } return r.json(); })
      .then(function (list) {
        var files = (list.files || []).filter(function (f) { return typeof f === "string" && !skip(f); });
        return caches.delete(next).then(function () { return caches.open(next); }).then(function (c) {
          var i = 0;
          function one() {
            if (i >= files.length) { return Promise.resolve(); }
            var u = HOME + files[i++];
            return fetch(u, { cache: "no-cache" }).then(function (r) {
              if (!r.ok || r.type !== "basic") { throw new Error(u + " " + r.status); }
              return stamped(r).then(function (s) { return c.put(u, s); });
            }).then(one);
          }
          return Promise.all([one(), one(), one(), one()]);   // four at a time
        }).then(function () { return setMeta({ cur: next, at: now, tried: now }); })
          .then(function () { return caches.delete(next === COPY_A ? COPY_B : COPY_A); })
          .then(legends);
      });
  }).catch(function () {}).then(function () { BUSY = null; });
  return BUSY;
}
// the legends' small pictures, up front, read from the saved catalogue
function legends() {
  return saved(new URL(HOME + "cards/catalogue.json")).then(function (r) { return r ? r.json() : null; }).then(function (cat) {
    if (!cat || !cat.cards) { return; }
    var urls = [];
    cat.cards.forEach(function (x) { if (x && x.t === "legend" && x.h && /^[0-9a-f]+$/.test(x.h)) { urls.push(HOME + "cards/art/" + x.h + ".t.webp"); } });
    return caches.open(ART_S).then(function (c) {
      var i = 0;
      function one() {
        if (i >= urls.length) { return Promise.resolve(); }
        var u = urls[i++];
        return c.match(u).then(function (hit) {
          if (hit) { return; }
          return fetch(u).then(function (r) { if (r.ok && r.type === "basic") { return c.put(u, r); } });
        }).catch(function () {}).then(one);
      }
      return Promise.all([one(), one(), one(), one()]).then(function () { return trim(c, SMALL_MAX); });
    });
  }).catch(function () {});
}
function trim(c, max) {
  return c.keys().then(function (ks) {
    if (ks.length <= max) { return; }
    return Promise.all(ks.slice(0, ks.length - max).map(function (k) { return c.delete(k); }));
  });
}

// ---- answering the page ----
function race(p, ms) {
  return new Promise(function (ok) {
    var t = setTimeout(function () { ok(null); }, ms);
    p.then(function (r) { clearTimeout(t); ok(r); }, function () { clearTimeout(t); ok(null); });
  });
}
function tell(e, res, r) {
  var id = e.clientId;
  if (!id || !isData(r)) { return Promise.resolve(); }
  var at = +res.headers.get("X-Ravi-Saved") || 0;
  return self.clients.get(id).then(function (c) { if (c) { c.postMessage({ ravi: "saved", path: r, at: at }); } }).catch(function () {});
}
function offlinePage() {
  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#08090A">'
    + '<title>No connection - RAVI</title><style>html{background:#08090A}body{margin:0;min-height:100vh;display:grid;place-items:center;'
    + 'font-family:"Nunito",system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.4;color:#EDEAE3;-webkit-font-smoothing:antialiased}'
    + 'p{max-width:300px;margin:0 24px;text-align:center}b{display:block;font-family:"Poppins",system-ui,-apple-system,sans-serif;font-size:20px;font-weight:700;margin-bottom:6px}</style></head>'
    + '<body><p role="status"><b>No connection</b>RAVI saves itself the first time it opens with signal.</p></body></html>';
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
function fresh(e, req, url, r) {
  var nav = req.mode === "navigate";
  var net = fetch(req).then(function (res) {
    if (res && res.ok && res.type === "basic" && !res.redirected) { e.waitUntil(keep(keyOf(url), res.clone())); }
    return res;
  });
  return race(net, WAIT).then(function (res) {
    if (res) { return res; }
    return saved(url).then(function (s) {
      if (s) { e.waitUntil(tell(e, s, r)); return s; }
      return net.catch(function () { return nav ? offlinePage() : Response.error(); });
    });
  });
}
function art(e, req, url) {
  var name = /\.t\.webp$/.test(url.pathname) ? ART_S : ART_F, max = name === ART_S ? SMALL_MAX : FULL_MAX;
  return caches.open(name).then(function (c) {
    return c.match(keyOf(url)).then(function (hit) {
      if (hit) { return hit; }
      return fetch(req).then(function (res) {
        if (res.ok && res.type === "basic") { e.waitUntil(c.put(keyOf(url), res.clone()).then(function () { return trim(c, max); }).catch(function () {})); }
        return res;
      });
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") { return; }
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) { return; }
  var r = rel(url);
  if (skip(r) || req.headers.get("range")) { return; }
  // a folder without its slash: answer with the slash form, which is what is saved
  if (req.mode === "navigate" && r !== "" && !/\/$/.test(r) && !/\.[a-z0-9]+$/i.test(r)) {
    e.respondWith(Response.redirect(url.origin + url.pathname + "/" + url.search, 301));
    return;
  }
  var p = isArt(r) ? art(e, req, url) : fresh(e, req, url, r);
  e.respondWith(p.catch(function () { return fetch(req); }));
});

// a page asks for the copy to be read (its first open, before the worker controlled it)
self.addEventListener("message", function (e) {
  if (e.data && e.data.ravi === "save") { e.waitUntil(refresh(false)); }
});

// ---- alerts (M16) ----
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {}; }
  var title = typeof d.title === "string" ? d.title.slice(0, 80) : "RAVI";
  var body = typeof d.body === "string" ? d.body.slice(0, 160) : "";
  var url = typeof d.url === "string" && d.url.indexOf(HOME) === 0 ? d.url : HOME + "calendar/";
  e.waitUntil(self.registration.showNotification(title, {
    body: body, tag: typeof d.tag === "string" ? d.tag.slice(0, 40) : "ravi", renotify: true,
    icon: HOME + "icons/apple-touch-icon.png", data: { url: url }
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || HOME + "calendar/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(HOME) === 0 && "navigate" in list[i]) return list[i].navigate(url).then(function (c) { return c && c.focus(); });
    }
    return self.clients.openWindow(url);
  }));
});
