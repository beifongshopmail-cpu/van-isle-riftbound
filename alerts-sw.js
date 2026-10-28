/* alerts-sw.js -- RAVI's alerts-only service worker (M16).
   It shows a pairing alert sent by RAVI's server and opens the event's Live
   menu when tapped. It has NO fetch handler on purpose: it never caches or
   serves a page, so the app always loads fresh from the network and the
   offline worker's update problems (NEXT 09 [M12]) do not arise. */
"use strict";
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

var HOME = new URL("./", self.location.href).href;

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
