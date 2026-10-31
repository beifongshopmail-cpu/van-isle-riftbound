// account.js -- RAVI's own accounts on the phone (plan 2 M1, 2026-10-30).
// window.RAVI_ACCT. Sign-in is a passkey (Face ID, a fingerprint or the
// phone's lock); the server is ravi-live (server/live/accounts.js), the
// same server live.js reads. Every page works the same with no signal.
//
// EVERY PHONE HAS AN ACCOUNT (Mako 2026-10-31): on its first open (the app,
// not the install screen, and never a test tool) the phone asks for a guest
// account with no prompt: one quiet call, tried again later with no signal.
// Save your account adds a passkey and a recovery code. Sign in to another
// account moves this phone's guest into that one. There is no signed-out
// state: signing out or deleting the account leaves the phone on a new guest.
//
// ON THIS PHONE: vir.acct.v1 { t: the sign-in token, id, made, a: the
// account as the server last described it (profile and passkey days, so
// every page can draw your picture with no signal), at: when }. The token
// goes in the Authorization header. Sign out forgets it all, even when
// there is no signal.
//
// THE TAP: Safari from iOS 17.4 lets a page ask for a passkey after a
// network wait (an older Safari wanted the ask straight after the tap, with
// one fetch at most between; that is all RAVI does). So nothing is fetched
// until a tap: a page with the Account section makes no call on load.
// (simplewebauthn.dev/docs/advanced/browser-quirks)
(function (root) {
  "use strict";
  var BASE = "https://ravi-live.beifongshopmail.workers.dev";
  var KEY = "vir.acct.v1";
  var TIMEOUT = 10000;
  var RETRY = 60000; // a failed guest call is tried again at most once a minute
  var guestAt = 0, guestBusy = false, onChange = [];

  function b64u(buf) {
    var b = new Uint8Array(buf), s = "";
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function unb64u(t) {
    var s = String(t).replace(/-/g, "+").replace(/_/g, "/");
    var bin = atob(s + "===".slice((s.length + 3) % 4)), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function saved() {
    try {
      var v = JSON.parse(root.localStorage.getItem(KEY) || "null");
      return v && typeof v.t === "string" && /^[A-Za-z0-9_-]{43}$/.test(v.t) ? v : null;
    } catch (e) { return null; }
  }
  function keep(token, account) {
    try { root.localStorage.setItem(KEY, JSON.stringify({ t: token, id: account && account.id || null, made: account && account.made || null, a: account || null, at: Date.now() })); } catch (e) {}
    meFrom(account);
  }
  // the account as last described, kept with the token
  function setView(account) {
    var s = saved();
    if (!s || !account || typeof account !== "object") return;
    keep(s.t, account);
    meFrom(account);
  }
  // a claimed Riot ID is this phone's Riot name too (live.js reads vir.me.v1 for tables and alerts)
  function meFrom(a) {
    if (!a || !a.riot || typeof a.riot.n !== "string") return;
    try { root.localStorage.setItem("vir.me.v1", JSON.stringify({ n: a.riot.n, tag: a.riot.tag || "" })); } catch (e) {}
  }
  function view() { var s = saved(); return s && s.a && typeof s.a === "object" ? s.a : null; }
  function forget() { try { root.localStorage.removeItem(KEY); } catch (e) {} }
  function signedIn() { return !!saved(); }
  function isGuest() { var a = view(); return !!(a && a.guest); }
  function changed() { onChange.forEach(function (f) { try { f(); } catch (e) {} }); }
  // the phone's coarse name for Signed-in devices (the server keeps only these)
  function devName() {
    var ua = root.navigator && root.navigator.userAgent || "", nav = root.navigator || {};
    if (/iPad/.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1)) return "iPad";
    if (/iPhone|iPod/.test(ua)) return "iPhone";
    if (/Android/.test(ua)) return "Android";
    if (/Macintosh|Mac OS X/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows";
    return "Computer";
  }
  // a guest account for a phone with none: quiet, once, and again later when it failed
  function makeGuest(cb, force) {
    cb = cb || function () {};
    if (signedIn()) return cb(null);
    if (guestBusy || (!force && Date.now() - guestAt < RETRY)) return cb("busy");
    if (root.RAVI_GATE || (root.navigator && root.navigator.webdriver)) return cb("off"); // the install screen and test tools make no accounts
    guestBusy = true; guestAt = Date.now();
    var here = null;
    try { here = JSON.parse(root.localStorage.getItem("vir.me.v1") || "null"); } catch (e) {}
    call("POST", "/guest", { dev: devName(), riot: here && here.n ? { n: here.n, tag: here.tag || "" } : null }, function (err, j) {
      guestBusy = false;
      if (!err && j && j.token) { keep(j.token, j.account); changed(); }
      cb(err);
    });
  }

  function supported() {
    return !!(root.PublicKeyCredential && root.navigator && root.navigator.credentials && typeof root.navigator.credentials.create === "function");
  }

  // one call to the server: cb(err words or null, reply, status)
  function call(method, path, body, cb) {
    var s = saved(), done = false, ctl = root.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); finish("No answer from RAVI's server. Try again with signal.", null, 0); }, TIMEOUT);
    function finish(err, j, st) { if (done) return; done = true; clearTimeout(timer); cb(err, j, st); }
    var h = { "Content-Type": "application/json" };
    if (s) h.Authorization = "Bearer " + s.t;
    var init = { method: method, headers: h, cache: "no-store" };
    if (ctl) init.signal = ctl.signal;
    if (method === "POST") init.body = JSON.stringify(body || {});
    root.fetch(BASE + "/acct" + path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401 && s) { forget(); finish("You were signed out on RAVI's server, so this phone has a new account. Sign in to get yours back.", j, 401); makeGuest(null, true); return; }
        if (!r.ok) return finish(words(j && j.error) || "RAVI's server could not do that. Try again later.", j, r.status);
        if (j && j.account && !j.token) setView(j.account);
        finish(null, j, r.status);
      });
    }).catch(function () { finish("No connection. Try again with signal.", null, 0); });
  }
  // the server's words, made a sentence for the page
  function words(e) {
    if (typeof e !== "string" || !e) return "";
    var s = e.replace(/[\u0000-\u001f<>]/g, "").slice(0, 160);
    return s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? "" : ".");
  }
  // what a browser's refusal means, in words
  function refusal(e) {
    var n = e && e.name;
    if (n === "NotAllowedError" || n === "AbortError") return "Cancelled, or the passkey timed out. Tap to try again.";
    if (n === "InvalidStateError") return "This phone already has a passkey for this account.";
    if (n === "SecurityError") return "Passkeys work only in the installed RAVI app at ravi.tools.";
    if (n === "NotSupportedError") return "This phone can't make a passkey RAVI can use.";
    return "The passkey did not work. Try again.";
  }

  // a fresh challenge from the server, fetched on the tap
  function options(kind, cb) { call("POST", kind === "create" ? "/reg/options" : "/auth/options", {}, cb); }

  function createAsk(o) {
    return {
      challenge: unb64u(o.challenge),
      rp: { id: o.rp.id, name: o.rp.name },
      user: { id: unb64u(o.user), name: "RAVI", displayName: "RAVI" },
      pubKeyCredParams: (o.algs || [-7, -257]).map(function (a) { return { type: "public-key", alg: a }; }),
      excludeCredentials: (o.exclude || []).map(function (id) { return { type: "public-key", id: unb64u(id) }; }),
      authenticatorSelection: { residentKey: "required", requireResidentKey: true, userVerification: "preferred" },
      attestation: "none",
      timeout: o.timeout || 60000
    };
  }
  function regBody(o, c) {
    return { challenge: o.challenge, name: devName(), dev: devName(), cred: { id: c.id, type: c.type,
      response: { clientDataJSON: b64u(c.response.clientDataJSON), attestationObject: b64u(c.response.attestationObject) } } };
  }

  // make a new passkey: Save your account for a guest, another passkey on a saved one
  // (and a new account when the phone has none yet)
  function newKey(cb) {
    if (!supported()) return cb("This phone can't make passkeys. Update iOS, or use another device.");
    var adding = signedIn();
    options("create", function (err, o) {
      if (err) return cb(err);
      root.navigator.credentials.create({ publicKey: createAsk(o) }).then(function (c) {
        call("POST", "/reg/verify", regBody(o, c), function (err2, j) {
          if (err2) return cb(err2);
          if (!adding && j.token) keep(j.token, j.account);
          cb(null, j);
        });
      }).catch(function (e) { cb(refusal(e)); });
    });
  }
  function create(cb) { if (signedIn()) return cb("Already signed in."); newKey(cb); }
  function addKey(cb) { if (!signedIn()) return cb("RAVI sets up your account the first time this phone has a connection. Try again with signal."); newKey(cb); }

  function signIn(cb) {
    if (!supported()) return cb("This phone can't use passkeys. Update iOS, or use a recovery code.");
    options("get", function (err, o) {
      if (err) return cb(err);
      root.navigator.credentials.get({ publicKey: { challenge: unb64u(o.challenge), rpId: o.rpId, userVerification: "preferred", timeout: o.timeout || 60000 } }).then(function (c) {
        var r = c.response;
        // a guest token rides along, so the server moves this phone's guest into the account
        call("POST", "/auth/verify", { challenge: o.challenge, dev: devName(), cred: { id: c.id, type: c.type, response: {
          clientDataJSON: b64u(r.clientDataJSON), authenticatorData: b64u(r.authenticatorData), signature: b64u(r.signature),
          userHandle: r.userHandle ? b64u(r.userHandle) : null } } }, function (err2, j) {
          if (err2) return cb(err2);
          keep(j.token, j.account); changed();
          cb(null, j);
        });
      }).catch(function (e) { cb(refusal(e)); });
    });
  }

  function recover(code, cb) {
    call("POST", "/recover", { code: String(code || "").slice(0, 64), dev: devName() }, function (err, j) {
      if (err) return cb(err);
      keep(j.token, j.account); changed();
      cb(null, j);
    });
  }
  function me(cb) { if (!signedIn()) return cb("Signed out."); call("GET", "/me", null, function (err, j, st) { if (!err && j) setView(j); cb(err, j, st); }); }
  function saveProfile(o, cb) { call("POST", "/profile", { name: o.name, user: o.user, about: o.about }, cb); }
  function setPic(o, cb) { call("POST", "/pic", o, cb); }
  function uploadPhoto(jpgB64, cb) { call("POST", "/photo", { jpg: jpgB64 }, cb); }
  // a Riot ID in its two parts, as Riot shows them: the name, and the tag after the #
  function claimRiot(n, tag, cb) { call("POST", "/riot", { n: String(n || "").trim(), tag: String(tag || "").trim().replace(/^#/, "") }, cb); }
  function releaseRiot(cb) { call("POST", "/riot", { off: true }, cb); }
  function disputeRiot(n, tag, cb) { call("POST", "/riot/dispute", { n: String(n || "").trim(), tag: String(tag || "").trim().replace(/^#/, "") }, cb); }
  function setArea(area, cb) { call("POST", "/area", { area: area }, cb); }
  function disputes(cb) { call("GET", "/admin/disputes", null, cb); }
  function decide(id, give, cb) { call("POST", "/admin/decide", { id: id, give: !!give }, cb); }
  // how a picture sits in its circle: x, y as CSS background-position, z circle-widths wide
  // (a legend's card art is portrait, so its width sets the size); a photo is already square
  var CROP = { x: 50, y: 20, z: 1.9 };
  function picFit(a) {
    var p = a && a.pic;
    if (!p || p.k !== "l") return { size: "cover", pos: "50% 50%" };
    var x = isFinite(p.x) ? +p.x : CROP.x, y = isFinite(p.y) ? +p.y : CROP.y, z = isFinite(p.z) ? +p.z : CROP.z;
    return { size: Math.round(z * 1000) / 10 + "% auto", pos: x + "% " + y + "%" };
  }
  // where a picture is drawn from: a legend's art (rel: "" on the hub, "../" in a page folder) or a photo
  function picUrl(a, rel) {
    if (!a || !a.pic) return "";
    if (a.pic.k === "l" && /^[0-9a-f]{40}$/.test(a.pic.h)) return (rel || "") + "cards/art/" + a.pic.h + ".t.webp";
    if (a.pic.k === "p" && /^[0-9a-f]{24}$/.test(a.id || "")) return BASE + "/acct/pic/" + a.id + "?v=" + (+a.pic.v || 0);
    return "";
  }
  function newCode(cb) { call("POST", "/code", {}, cb); }
  // passkeys: a name for each, and remove one (never the last)
  function keyName(id, name, cb) { call("POST", "/key/name", { id: id, name: String(name || "").slice(0, 32) }, cb); }
  function keyOff(id, cb) { call("POST", "/key/off", { id: id }, cb); }
  // signed-in devices: each phone's session, sign one out, or every other
  function devices(cb) { call("GET", "/devices", null, cb); }
  function deviceOut(id, cb) { call("POST", "/devices/out", { id: id }, cb); }
  function othersOut(cb) { call("POST", "/devices/others", {}, cb); }
  function exportData(cb) { call("GET", "/export", null, cb); }
  function syncCall(body, cb) { call("POST", "/sync", body, cb); }
  function signOut(cb) {
    // forgotten on the phone whatever the server says; the phone then gets a new guest
    call("POST", "/out", {}, function () { forget(); changed(); makeGuest(function () { if (cb) cb(null); }, true); });
  }
  function remove(cb) {
    call("POST", "/delete", {}, function (err) {
      if (err) return cb(err);
      forget(); changed();
      makeGuest(function () { cb(null); }, true);
    });
  }

  root.RAVI_ACCT = { BASE: BASE, KEY: KEY, supported: supported, signedIn: signedIn, saved: saved, view: view,
    isGuest: isGuest, makeGuest: makeGuest, devName: devName, onChange: function (f) { onChange.push(f); },
    keyName: keyName, keyOff: keyOff, devices: devices, deviceOut: deviceOut, othersOut: othersOut, exportData: exportData, syncCall: syncCall,
    create: create, addKey: addKey, signIn: signIn, recover: recover, me: me, newCode: newCode, signOut: signOut, remove: remove,
    saveProfile: saveProfile, setPic: setPic, uploadPhoto: uploadPhoto, picUrl: picUrl, picFit: picFit, CROP: CROP,
    claimRiot: claimRiot, releaseRiot: releaseRiot, disputeRiot: disputeRiot, setArea: setArea, disputes: disputes, decide: decide };
})(window);

// THE PICTURE AND ITS MENUS (plan 2 M1 block 2; Mako 2026-10-30). Every page
// with the wordmark row, and the hub, gets your picture in its top right
// corner (a filled person until a picture is picked). Tapped, the account menu
// grows out of it and the picture itself grows from 36 to 56 into the
// menu's top right corner, where a tap closes it. Deeper menus (Profile,
// Picture, Passkeys, Signed-in devices, Recovery code, Your data, Sign in)
// slide in place under the picture. Styles: app.css, THE
// ACCOUNT PICTURE AND ITS MENUS. The Game page has no wordmark row, so no
// picture: its play field keeps the whole screen.
(function (root) {
  "use strict";
  var doc = root.document;
  if (!doc || !root.RAVI_ACCT) return;
  var A = root.RAVI_ACCT;
  var REL = /\/[a-z]+\/(index\.html)?$/.test(root.location.pathname) ? "../" : "";
  var SVG_ME = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M3.5 21.5c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5z"/></svg>';
  var CV = '<svg class="cvr" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';
  var BACK = '<button type="button" class="circ btn glass back" data-acback aria-label="Back" data-k="do"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg></button>';
  var REFRESH = 3600000; // the account is reread at most once an hour per phone
  var pic, scrim, P = {}, stack = [], lifted = false, legends = null, preview = null, work = null, nextMsg = "";

  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function $(id) { return doc.getElementById(id); }
  function day(d) {
    try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); } catch (e) { return d; }
  }

  // draw a picture into a circle: art, the photo, or a filled person (every phone has an account)
  function paint(node, a, over) {
    var url = over ? over.url : A.picUrl(a, REL), fit = over ? over.fit : A.picFit(a);
    node.style.backgroundImage = url ? "url(\"" + url.replace(/["\\]/g, "") + "\")" : "";
    node.style.backgroundSize = url && fit ? fit.size : "";
    node.style.backgroundPosition = url && fit ? fit.pos : "";
    node.classList.toggle("art", !!url);
    node.classList.toggle("me", !url);
    node.innerHTML = url ? "" : SVG_ME;
  }
  function paintAll() {
    var a = A.view();
    paint(pic, a, preview);
    var big = $("acbig");
    if (big) paint(big, a, preview);
    pic.setAttribute("aria-label", "Your account");
  }

  function headTitle(t) { return '<div class="phead"><div class="ht">' + BACK + '<h4 class="ttl">' + t + '</h4></div></div>'; }
  function build() {
    scrim = el("div", "scrim"); scrim.id = "acscrim";
    doc.body.appendChild(scrim);
    var defs = {
      acm: '<div class="phead" id="achead"></div><div class="pbody" id="acmbody"></div>',
      acprof: headTitle("Profile") + '<div class="pbody"><span class="acav acbig" id="acbig"></span>' +
        '<div class="doors acgap" data-k="deeper"><button type="button" class="door" data-acgo="acpicm"><span class="t">Picture</span><span class="sp"></span>' + CV + '</button></div>' +
        '<p class="lb">Display name</p><div class="nf"><input type="text" id="acname" maxlength="32" autocomplete="nickname" enterkeyhint="next" aria-label="Display name" data-k="type"></div>' +
        '<p class="lb">Username</p><div class="nf"><span class="acat">@</span><input type="text" id="acuser" maxlength="20" autocomplete="username" autocapitalize="off" spellcheck="false" enterkeyhint="next" aria-label="Username" data-k="type"></div>' +
        '<p class="pnote">Yours alone on RAVI: 3 to 20 letters, numbers or _.</p>' +
        '<p class="lb">Riot ID</p><div class="rid"><div class="ridn"><div class="nf"><input type="text" id="acriotn" maxlength="16" placeholder="Riot name" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="next" aria-label="Riot name" data-k="type"></div></div>' +
        '<div class="ridt"><div class="nf"><span class="acat">#</span><input type="text" id="acriott" maxlength="5" placeholder="tag" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done" aria-label="Riot tag" data-k="type"></div></div></div>' +
        '<button type="button" class="pact btn glass" id="acclaim" data-k="do">Claim</button>' +
        '<p class="pnote">One RAVI account per Riot ID. It finds your table and your alerts at live events.</p>' +
        '<p class="acmsg" id="acriotmsg" aria-live="polite"></p>' +
        '<div class="doors acrow" id="acdispw" data-k="do" hidden><button type="button" class="door act" id="acdisp"><span class="t">This is my Riot ID</span></button></div>' +
        '<p class="lb">Home area</p><div class="doors" data-k="deeper"><button type="button" class="door" data-acgo="acarea"><span class="t" id="acareat">Not set</span><span class="sp"></span>' + CV + '</button></div>' +
        '<p class="lb">About you</p><div class="nf"><input type="text" id="acabout" maxlength="80" placeholder="One line, shown on your profile" enterkeyhint="done" aria-label="About you" data-k="type"></div>' +
        '<p class="pnote">Only you see your profile for now. The trade board will show it to the players you trade with.</p>' +
        '<p class="acmsg" id="acprofmsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acsave" data-k="do">Save</button></div>',
      acpicm: headTitle("Picture") + '<div class="pbody"><span class="acav acadj" id="acadj" aria-label="Your picture: drag to move it, pinch to zoom"></span>' +
        '<p class="pnote acadjn" id="acadjn">Drag to move it, pinch to zoom.</p>' +
        '<div class="seg acrow" id="acprint" role="group" aria-label="Printing" data-k="pick" hidden></div>' +
        '<div class="doors acrow" id="acpicrows"></div>' +
        '<p class="lb">Or pick a legend</p><div class="aclg" id="aclg" data-k="pick"></div><p class="acmsg" id="acpicmsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acuse" data-k="do" disabled>Use this picture</button></div>',
      ackeys: headTitle("Passkeys") + '<div class="pbody"><div class="doors" id="ackeylist" data-k="deeper"></div><p class="pnote">A passkey is Face ID, a fingerprint or a phone\'s lock, kept by your phone or your password manager. Add one on each phone you use, or keep them synced in iCloud Keychain.</p><p class="acmsg" id="ackeymsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acaddkey" data-k="do">Add a passkey</button></div>',
      ackey: headTitle("Passkey") + '<div class="pbody"><p class="lb">Name</p><div class="nf"><input type="text" id="ackeyname" maxlength="32" autocomplete="off" enterkeyhint="done" aria-label="Passkey name" data-k="type"></div>' +
        '<p class="pnote" id="ackeydays"></p>' +
        '<div class="doors acgap" data-k="do"><button type="button" class="door act" id="ackeyoff"><span class="t">Remove this passkey</span></button></div>' +
        '<p class="acmsg" id="ackeyonemsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="ackeysave" data-k="do">Save</button></div>',
      acdev: headTitle("Signed-in devices") + '<div class="pbody"><p class="pnote" id="acdevhere"></p><div class="doors acgap" id="acdevlist" data-k="do"></div>' +
        '<div class="doors" id="acdevallw" data-k="do"><button type="button" class="door act" id="acdevall"><span class="t">Sign out every other device</span></button></div>' +
        '<p class="acmsg" id="acdevmsg" aria-live="polite"></p></div>',
      acin: headTitle("Sign in") + '<div class="pbody"><div class="doors">' +
        '<button type="button" class="door act" id="acsign" data-k="do"><span class="t">Use a passkey</span></button>' +
        '<button type="button" class="door" data-acgo="acrec" data-k="deeper"><span class="t">Use a recovery code</span><span class="sp"></span>' + CV + '</button></div>' +
        '<p class="pnote" id="acinnote"></p><p class="acmsg" id="acinmsg" aria-live="polite"></p></div>',
      accode: headTitle("Recovery code") + '<div class="pbody" id="accodebody"></div><div class="pfoot" id="accodefoot"></div>',
      acarea: headTitle("Home area") + '<div class="pbody"><div class="pick" id="acareas" data-k="pick"></div><p class="pnote">Where you mostly play.</p><p class="acmsg" id="acareamsg" aria-live="polite"></p></div>',
      acdispm: headTitle("Disputes") + '<div class="pbody"><div id="acdisplist"></div><p class="acmsg" id="acdispmsg" aria-live="polite"></p></div>',
      acdata: headTitle("Your data") + '<div class="pbody"><p class="pnote">Every phone that opens RAVI gets an account, so your things can follow you once you save it. RAVI keeps for it: your decks, collection, games, saved trades, Follow marks and hub picks, so they follow you to every phone signed in to it; your profile, picture, Riot ID and home area; each signed-in device (iPhone, Android or Computer) and the days it was used; once saved, your passkeys\' public keys and a scrambled copy of your recovery code. Never a password or an email. An account never saved and unused for 90 days is deleted.</p>' +
        '<p class="pnote" id="acnum"></p>' +
        '<div class="doors acgap" data-k="do"><button type="button" class="door act" id="acdl"><span class="t">Download your data</span></button>' +
        '<button type="button" class="door act" id="acdel"><span class="t">Delete account</span></button></div>' +
        '<p class="acmsg" id="acdatamsg" aria-live="polite"></p></div>',
      acrec: headTitle("Use a recovery code") + '<div class="pbody"><div class="nf tall"><input type="text" id="acrecin" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" aria-label="Recovery code" data-k="type"></div>' +
        '<p class="pnote">The code RAVI showed you when you saved your account. It signs you in once; you get a new one straight after.</p><p class="acmsg" id="acrecmsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acrecgo" data-k="do">Sign in</button></div>'
    };
    var labels = { acm: "Your account", acprof: "Profile", acpicm: "Picture", ackeys: "Passkeys", ackey: "Passkey", acdev: "Signed-in devices", acin: "Sign in", accode: "Recovery code", acdata: "Your data", acrec: "Use a recovery code", acarea: "Home area", acdispm: "Disputes" };
    Object.keys(defs).forEach(function (id) {
      var p = el("section", "panel frost acct", defs[id]);
      p.id = id; p.setAttribute("aria-hidden", "true"); p.setAttribute("aria-label", labels[id]);
      doc.body.appendChild(p);
      P[id] = p;
    });
    if (root.RAVI_WATCH) root.RAVI_WATCH(Object.keys(P).map(function (k) { return P[k]; }));
  }

  // ---- the root menu: a saved account, a guest (never saved), or a phone still waiting for its account ----
  function headOf(h, a, fallback) {
    var name = a && a.name ? a.name : "Your account", bits = [];
    if (a && a.user) bits.push("@" + a.user);
    if (a && a.riot) bits.push(a.riot.n + "#" + a.riot.tag);
    h.innerHTML = '<div class="acn"><b></b><span></span></div>';
    h.querySelector("b").textContent = name;
    h.querySelector("span").textContent = bits.length ? bits.join(" \u00b7 ") : fallback;
  }
  function renderRoot(msg) {
    var a = A.view(), h = $("achead"), b = $("acmbody");
    var signIn = '<div class="doors" data-k="deeper"><button type="button" class="door" data-acgo="acin"><span class="t">Sign in to another account</span><span class="sp"></span>' + CV + '</button></div>';
    if (!A.signedIn()) {
      headOf(h, null, "Not set up yet");
      b.innerHTML = '<p class="pnote acfirst">RAVI sets up your account the first time this phone has a connection. Everything works without it.</p>' + signIn +
        '<p class="acmsg" id="acmsg" aria-live="polite"></p>';
    } else if (A.isGuest()) {
      headOf(h, a, "Add your name and picture");
      var can = A.supported();
      b.innerHTML = '<div class="doors" data-k="do"><button type="button" class="door act" id="acsaveacct"' + (can ? '' : ' disabled') + '><span class="t">Save your account</span></button></div>' +
        '<p class="pnote acsavenote">' + (can ? "Not saved yet: only this phone can reach it. Saving adds a passkey (Face ID or your phone's lock), so it is yours on any phone."
          : "Not saved yet: only this phone can reach it. This phone can't make passkeys, so it can't save it. Update iOS, or sign in to an account saved on another phone.") + '</p>' +
        '<div class="doors" data-k="deeper">' +
        '<button type="button" class="door" data-acgo="acprof"><span class="t">Profile</span><span class="sp"></span>' + CV + '</button>' +
        '<button type="button" class="door" data-acgo="acdata"><span class="t">Your data</span><span class="sp"></span>' + CV + '</button></div>' +
        signIn + '<p class="acmsg" id="acmsg" aria-live="polite"></p>';
    } else {
      headOf(h, a, "Add your name and picture");
      var n = a && a.keys ? a.keys.length : 0;
      b.innerHTML = '<div class="doors" data-k="deeper">' +
        '<button type="button" class="door" data-acgo="acprof"><span class="t">Profile</span><span class="sp"></span>' + CV + '</button>' +
        '<button type="button" class="door" data-acgo="ackeys"><span class="t">Passkeys</span><span class="sp"></span>' + (n ? '<small>' + n + '</small>' : '') + CV + '</button>' +
        '<button type="button" class="door" data-acgo="acdev"><span class="t">Signed-in devices</span><span class="sp"></span>' + CV + '</button>' +
        '<button type="button" class="door" data-acgo="accode"><span class="t">Recovery code</span><span class="sp"></span>' + CV + '</button>' +
        '<button type="button" class="door" data-acgo="acdata"><span class="t">Your data</span><span class="sp"></span>' + CV + '</button>' +
        (a && a.admin ? '<button type="button" class="door" data-acgo="acdispm"><span class="t">Disputes</span><span class="sp"></span>' + (a.disputes ? '<small>' + a.disputes + '</small>' : '') + CV + '</button>' : '') + '</div>' +
        '<div class="doors" data-k="do"><button type="button" class="door act" id="acout"><span class="t">Sign out</span></button></div>' +
        '<p class="acmsg" id="acmsg" aria-live="polite"></p>';
    }
    if (msg) $("acmsg").textContent = msg;
  }
  function say(id, t) { var m = $(id); if (m) m.textContent = t || ""; }

  // ---- placing: the menu hangs from the picture; the picture moves into its corner ----
  function place() {
    var r = pic.getBoundingClientRect();
    var top = Math.max(r.top - 12, 8);
    P.acm.style.top = top + "px";
    // the menu's own box, untouched by its scale (offset sizes ignore transforms)
    var left = P.acm.offsetLeft, right = left + P.acm.offsetWidth;
    var bar = doc.querySelector(".bar");
    var floor = bar ? bar.getBoundingClientRect().top - 8 : root.innerHeight - 12;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    Object.keys(P).forEach(function (k) {
      P[k].style.top = top + "px";
      P[k].style.maxHeight = Math.max(240, floor - top) + "px";
      P[k].style.transformOrigin = (cx - left) + "px " + (cy - top) + "px";
    });
    return { r: r, move: "translate(" + ((right - 16 - 28) - cx) + "px," + ((top + 16 + 28) - cy) + "px) scale(" + (56 / r.width) + ")" };
  }
  function lift(on) {
    if (on && !lifted) {
      var m = place();
      pic.style.left = m.r.left + "px"; pic.style.top = m.r.top + "px";
      pic.classList.remove("drop"); pic.classList.add("lift");
      pic.style.setProperty("--acmove", m.move);
      void pic.offsetWidth;
      pic.style.transform = m.move;
      lifted = true;
    } else if (!on && lifted) {
      lifted = false;
      pic.classList.add("drop");
      pic.style.transform = "";
      setTimeout(function () {
        if (lifted) return;
        pic.classList.remove("lift", "drop");
        pic.style.left = ""; pic.style.top = "";
      }, 220);
    }
  }

  // ---- the stack ----
  function cls(p, extra) { p.className = "panel frost acct" + (extra ? " " + extra : ""); p.setAttribute("aria-hidden", /show/.test(extra || "") ? "false" : "true"); }
  function open(msg) {
    if (stack.length) return closeAll();
    renderRoot(msg);
    lift(true);
    stack = [P.acm];
    cls(P.acm, "show");
    scrim.classList.add("show");
    doc.documentElement.classList.add("lock");
    if (A.signedIn()) refresh(true); else A.makeGuest(null, true);
  }
  function closeAll() {
    var t = stack[stack.length - 1];
    stack = [];
    if (t) cls(t, "");
    scrim.classList.remove("show");
    doc.documentElement.classList.remove("lock");
    if (preview || work) { preview = null; work = null; paintAll(); }
    lift(false);
  }
  function deeper(id) {
    var from = stack[stack.length - 1], to = P[id];
    if (!from || !to) return;
    enter(id);
    cls(from, "tol"); cls(to, "fromr");
    void to.offsetWidth;
    cls(to, "show");
    stack.push(to);
  }
  function back() {
    if (stack.length < 2) return closeAll();
    var from = stack.pop(), to = stack[stack.length - 1];
    if (from === P.acpicm && (preview || work)) { preview = null; work = null; paintAll(); }
    if (to === P.acm) { renderRoot(nextMsg); nextMsg = ""; }
    cls(from, "tor"); cls(to, "froml");
    void to.offsetWidth;
    cls(to, "show");
  }
  // swap the top menu for another, as one step (after a sign-in that shows a code)
  function swapTo(id) {
    var from = stack[stack.length - 1], to = P[id];
    cls(from, "tol"); cls(to, "fromr"); void to.offsetWidth; cls(to, "show");
    stack[stack.length - 1] = to;
  }

  // ---- what each deeper menu shows when it opens ----
  function enter(id) {
    var a = A.view();
    if (id === "acprof") {
      $("acname").value = a && a.name || ""; $("acuser").value = a && a.user || ""; $("acabout").value = a && a.about || "";
      riotFill(a);
      say("acprofmsg", ""); say("acriotmsg", ""); $("acdispw").hidden = true;
      claimState(); areaText(); paintAll();
    }
    else if (id === "acarea") { renderAreas(); say("acareamsg", ""); }
    else if (id === "acdispm") { renderDisputes(); }
    else if (id === "acpicm") { work = null; renderPics(); say("acpicmsg", ""); }
    else if (id === "ackeys") { renderKeys(); say("ackeymsg", ""); }
    else if (id === "ackey") { keyInfo(); }
    else if (id === "acdev") { renderDevices(); }
    else if (id === "acin") {
      say("acinmsg", "");
      $("acinnote").textContent = A.isGuest() ? "Everything this phone has on RAVI moves into that account: its name, picture and Riot ID fill any gaps there, and this phone's unsaved account is removed."
        : "For an account you saved on another phone.";
      $("acsign").disabled = !A.supported();
    } else if (id === "accode") { codeInfo(); }
    else if (id === "acdata") { say("acdatamsg", ""); $("acnum").textContent = a && a.id ? "Account number: " + a.id : ""; }
    else if (id === "acrec") { $("acrecin").value = ""; say("acrecmsg", ""); }
  }

  // ---- Passkeys: each one named, renamed or removed (never the last) ----
  var keyId = "";
  function keyLabel(k, i) { return k.name || "Passkey " + (i + 1); }
  function renderKeys() {
    var a = A.view(), list = $("ackeylist"), keys = a && a.keys || [];
    list.innerHTML = "";
    keys.forEach(function (k, i) {
      var b = el("button", "door", '<span class="t"></span><span class="sp"></span><small></small>' + CV);
      b.type = "button"; b.setAttribute("data-key", k.id || "");
      b.querySelector(".t").textContent = keyLabel(k, i);
      b.querySelector("small").textContent = day(k.last);
      list.appendChild(b);
    });
    list.hidden = !keys.length;
  }
  function keyOf(id) { var a = A.view(), keys = a && a.keys || []; for (var i = 0; i < keys.length; i++) if (keys[i].id === id) return { k: keys[i], i: i, n: keys.length }; return null; }
  function keyInfo() {
    var x = keyOf(keyId);
    if (!x) return;
    $("ackeyname").value = x.k.name || "";
    $("ackeyname").placeholder = "Passkey " + (x.i + 1);
    $("ackeydays").textContent = "Added " + day(x.k.made) + ". Last used " + day(x.k.last) + "." + (x.n < 2 ? " It is your only passkey, so it can't be removed: add another first." : "");
    $("ackeyoff").disabled = x.n < 2;
    say("ackeyonemsg", "");
  }
  // ---- Signed-in devices: this phone, then each other one, signed out one at a time or all at once ----
  function renderDevices() {
    var list = $("acdevlist"), here = $("acdevhere"), all = $("acdevallw");
    list.innerHTML = ""; here.textContent = "Loading..."; all.hidden = true; say("acdevmsg", "");
    A.devices(function (err, j) {
      if (err) { here.textContent = ""; return say("acdevmsg", err); }
      var ds = j && j.devices || [], others = ds.filter(function (d) { return !d.here; }), mine = ds.filter(function (d) { return d.here; })[0];
      here.textContent = (mine ? "This phone: " + mine.dev + ", signed in " + day(mine.made) + ". " : "") +
        (others.length ? "Tap another to sign it out." : "No other device is signed in.");
      others.forEach(function (d) {
        var b = el("button", "door act", '<span class="t"></span><span class="sp"></span><small></small>');
        b.type = "button";
        b.querySelector(".t").textContent = d.dev;
        b.querySelector("small").textContent = "used " + day(d.last);
        armed(b, "acdevmsg", "Signs out that " + d.dev + ". It gets a new account until it signs in again.", function () {
          A.deviceOut(d.id, function (err2) { if (err2) return say("acdevmsg", err2); renderDevices(); setTimeout(function () { say("acdevmsg", "Signed out."); }, 0); });
        });
        list.appendChild(b);
      });
      list.hidden = !others.length;
      all.hidden = others.length < 2;
    });
  }

  // ---- Your data: a file of everything RAVI's server keeps for this account ----
  function download() {
    say("acdatamsg", "Getting your data...");
    A.exportData(function (err, j) {
      if (err) return say("acdatamsg", err);
      try {
        var blob = new root.Blob([JSON.stringify(j, null, 2)], { type: "application/json" }), url = root.URL.createObjectURL(blob);
        var link = doc.createElement("a");
        link.href = url; link.download = "ravi-account-" + new Date().toISOString().slice(0, 10) + ".json";
        doc.body.appendChild(link); link.click(); link.remove();
        setTimeout(function () { root.URL.revokeObjectURL(url); }, 60000);
        say("acdatamsg", "Downloaded.");
      } catch (e) { say("acdatamsg", "This phone could not save the file. Try again."); }
    });
  }

  // ---- Recovery code: what it is, or a new one shown once ----
  function codeInfo() {
    $("accodebody").innerHTML = '<p class="pnote">Your recovery code signs you in if every passkey is lost. RAVI keeps only a scrambled copy, so it can\'t show you the one you have. Making a new one stops the old one working.</p><p class="acmsg" id="accodemsg" aria-live="polite"></p>';
    $("accodefoot").innerHTML = '<button type="button" class="pact btn glass" id="acnewcode" data-k="do">Make a new code</button>';
    armed($("acnewcode"), "accodemsg", "Your old recovery code stops working.", function () {
      A.newCode(function (err, j) { if (err) return say("accodemsg", err); showCode(j.recovery, "Your old code no longer works."); });
    });
  }
  function showCode(code, note) {
    var g = String(code || "").split("-");
    $("accodebody").innerHTML = '<p class="accode" id="accode" aria-label="Your recovery code"><span></span><span></span></p>' +
      '<button type="button" class="pact btn glass acgap" id="accopy" data-k="do">Copy code</button>' +
      '<p class="pnote">' + (note ? note + " " : "") + "Keep it in Passwords or Notes. If you ever lose your passkey, this code is the only way back in. RAVI can't show it again.</p>";
    var sp = $("accode").querySelectorAll("span");
    sp[0].textContent = g.slice(0, 2).join("-"); sp[1].textContent = g.slice(2).join("-");
    $("accode").setAttribute("data-code", code);
    $("accodefoot").innerHTML = '<button type="button" class="pact btn glass" data-acback data-k="do">Done</button>';
    $("accopy").addEventListener("click", function () {
      var b = this;
      function pick() { try { var r = doc.createRange(); r.selectNodeContents($("accode")); var s = root.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {} }
      try { root.navigator.clipboard.writeText(code).then(function () { b.textContent = "Copied"; }, pick); } catch (e) { pick(); }
    });
  }

  // a second tap within 3 seconds acts; the line says what it does (STYLE.md, Confirm)
  function armed(btn, msgId, line, act) {
    var lab = btn.querySelector(".t") || btn, words = lab.textContent, on = false, t = 0;
    function off() { on = false; clearTimeout(t); btn.classList.remove("armed"); lab.textContent = words; var m = $(msgId); if (m && m.textContent === line) say(msgId, ""); }
    btn.addEventListener("click", function () {
      if (!on) { on = true; btn.classList.add("armed"); lab.textContent = "Sure? Tap again"; say(msgId, line); t = setTimeout(off, 3000); return; }
      off(); act();
    });
  }

  // ---- Riot ID: claim, remove, or say it is yours (two fields: the name and the #tag) ----
  function riotText(a) { return a && a.riot ? a.riot.n + "#" + a.riot.tag : ""; }
  function riotFill(a) {
    var here = null;
    try { here = JSON.parse(root.localStorage.getItem("vir.me.v1") || "null"); } catch (e) {}
    var r = a && a.riot ? a.riot : (here && here.n ? { n: here.n, tag: here.tag || "" } : { n: "", tag: "" });
    $("acriotn").value = r.n; $("acriott").value = r.tag;
  }
  // Claim, or Remove Riot ID when the fields show the Riot ID this account holds
  function claimState() {
    var b = $("acclaim"), a = A.view(), r = a && a.riot;
    var same = !!r && $("acriotn").value.trim().toLowerCase() === r.n.toLowerCase() && $("acriott").value.trim().replace(/^#/, "").toLowerCase() === r.tag.toLowerCase();
    if (!b.classList.contains("armed") && !b.classList.contains("done")) b.textContent = same ? "Remove Riot ID" : "Claim"; // not 'Release' (Mako 2026-10-31)
    b.setAttribute("data-mode", same ? "off" : "on");
  }
  var relArm = false, relT = 0;
  function claimTap() {
    var b = $("acclaim"), n = $("acriotn").value, tag = $("acriott").value;
    $("acdispw").hidden = true;
    if (b.getAttribute("data-mode") === "off") {
      // removing asks for a second tap (STYLE.md, Confirm)
      if (!relArm) {
        relArm = true; b.classList.add("armed"); b.textContent = "Sure? Tap again"; say("acriotmsg", "Another account could then claim it.");
        relT = setTimeout(function () { relArm = false; b.classList.remove("armed"); claimState(); say("acriotmsg", ""); }, 3000);
        return;
      }
      relArm = false; clearTimeout(relT); b.classList.remove("armed");
      return A.releaseRiot(function (err) { if (err) return say("acriotmsg", err); $("acriotn").value = ""; $("acriott").value = ""; claimState(); say("acriotmsg", "Removed. Another account can claim it now."); });
    }
    if (!n.trim() || !tag.trim()) return say("acriotmsg", "Type your Riot name and its tag, as Riot shows them.");
    say("acriotmsg", "Claiming...");
    A.claimRiot(n, tag, function (err, j, st) {
      if (err) {
        say("acriotmsg", err + (st === 409 ? " If it is yours, tell RAVI." : ""));
        $("acdispw").hidden = st !== 409;
        return;
      }
      riotFill(A.view()); done(b, "Claimed", claimState); say("acriotmsg", "Claimed. It is yours on RAVI.");
    });
  }
  function disputeTap() {
    say("acriotmsg", "Sending...");
    A.disputeRiot($("acriotn").value, $("acriott").value, function (err) {
      if (err) return say("acriotmsg", err);
      $("acdispw").hidden = true;
      say("acriotmsg", "Sent to RAVI to check. Send a screenshot of your Riot account page through Feedback, with your @username, and RAVI will settle it.");
    });
  }
  // a button says it worked, in place, for a moment (Mako 2026-10-31: saving shows it saved)
  function done(btn, words, after) {
    var was = btn.getAttribute("data-words") || btn.textContent;
    btn.setAttribute("data-words", was);
    btn.classList.add("done"); btn.textContent = words;
    clearTimeout(btn._doneT);
    btn._doneT = setTimeout(function () { btn.classList.remove("done"); btn.textContent = btn.getAttribute("data-words"); btn.removeAttribute("data-words"); if (after) after(); }, 1800);
  }

  // ---- Home area ----
  var AREAS = [["", "Not set"], ["victoria", "Greater Victoria"], ["island", "Up Island"], ["away", "Somewhere else"]];
  function areaName(code) { for (var i = 0; i < AREAS.length; i++) if (AREAS[i][0] === (code || "")) return AREAS[i][1]; return "Not set"; }
  function areaText() { var a = A.view(); $("acareat").textContent = areaName(a && a.area); }
  function renderAreas() {
    var a = A.view(), cur = a && a.area || "", g = $("acareas");
    g.innerHTML = "";
    AREAS.forEach(function (x) {
      var b = el("button", x[0] === cur ? "on" : "");
      b.type = "button"; b.textContent = x[1]; b.setAttribute("data-area", x[0]);
      g.appendChild(b);
    });
  }
  function pickArea(code) {
    say("acareamsg", "Saving...");
    A.setArea(code || null, function (err) {
      if (err) return say("acareamsg", err);
      renderAreas(); areaText(); say("acareamsg", "Saved.");
    });
  }

  // ---- Disputes (Mako's account only) ----
  function renderDisputes() {
    var list = $("acdisplist");
    list.innerHTML = '<p class="pnote">Loading...</p>';
    say("acdispmsg", "");
    A.disputes(function (err, j) {
      if (err) { list.innerHTML = ""; return say("acdispmsg", err); }
      list.innerHTML = "";
      var ds = j && j.disputes || [];
      if (!ds.length) { var e = el("p", "pnote"); e.textContent = "No disputes. A player who finds their Riot ID claimed by another account can send one."; list.appendChild(e); }
      ds.forEach(function (d) {
        function who(x) { return x && x.user ? "@" + x.user : (x && x.name ? x.name : "an account with no username"); }
        var head = el("p", "lb"); head.textContent = d.riot;
        var note = el("p", "pnote");
        note.textContent = (d.holder ? "Held by " + who(d.holder) + " since " + day(d.holder.since) + ". " : "Nobody holds it now. ") + who(d.asker) + " says it is theirs (" + day(d.at) + "). Check their screenshot in Feedback first.";
        var rows = el("div", "doors acgap");
        rows.setAttribute("data-k", "do");
        rows.innerHTML = '<button type="button" class="door act" data-give="1"><span class="t"></span></button><button type="button" class="door act" data-give="0"><span class="t"></span></button>';
        rows.children[0].querySelector(".t").textContent = "Give it to " + who(d.asker);
        rows.children[1].querySelector(".t").textContent = d.holder ? "Keep it with " + who(d.holder) : "Dismiss";
        [0, 1].forEach(function (i) {
          armed(rows.children[i], "acdispmsg", i === 0 ? "Moves " + d.riot + " to " + who(d.asker) + "." : "Closes the dispute; nothing moves.", function () {
            A.decide(d.id, i === 0, function (err2) {
              if (err2) return say("acdispmsg", err2);
              A.me(function () { renderDisputes(); say("acdispmsg", i === 0 ? "Given." : "Kept."); });
            });
          });
        });
        list.appendChild(head); list.appendChild(note); list.appendChild(rows);
      });
    });
  }

  // ---- Picture: upload a photo, or pick a legend ----
  function loadLegends(cb) {
    if (root.VIR_LEGENDS) return cb(root.VIR_LEGENDS);
    if (legends) return cb(legends);
    var s = doc.createElement("script");
    s.src = REL + "cards/legends.js";
    s.onload = function () { legends = root.VIR_LEGENDS || []; cb(legends); };
    s.onerror = function () { cb([]); };
    doc.head.appendChild(s);
  }
  // a legend's printings on offer: its own art first, then each overnumbered printing
  // (numbered past the set, such as OGN 299/298); never a signature (a star in its number),
  // whose signature would not show in a circle (Mako 2026-10-30)
  function printsOf(lg) {
    var base = [], over = [];
    (lg && lg.v || []).forEach(function (v) {
      var m = /-(\d+)(\*?)\/(\d+)$/.exec(v && v.c || "");
      if (!m || m[2] || !/^[0-9a-f]{40}$/.test(v.h || "")) return;
      (+m[1] > +m[3] ? over : base).push({ h: v.h, l: v.l || v.c });
    });
    return base.slice(0, 1).concat(over);
  }
  function legendOf(h) {
    var L = legends || root.VIR_LEGENDS || [];
    for (var i = 0; i < L.length; i++) { var p = printsOf(L[i]); for (var j = 0; j < p.length; j++) if (p[j].h === h) return { lg: L[i], prints: p }; }
    return null;
  }
  var CARD = 744 / 1039; // a card's width over its height
  // work: the picture being placed, { k, h or src, url, aspect, x, y, z, saved }
  function workFromSaved() {
    var a = A.view(), p = a && a.pic;
    if (p && p.k === "l") return { k: "l", h: p.h, url: REL + "cards/art/" + p.h + ".t.webp", aspect: CARD, x: isFinite(p.x) ? +p.x : A.CROP.x, y: isFinite(p.y) ? +p.y : A.CROP.y, z: isFinite(p.z) ? +p.z : A.CROP.z, saved: true };
    if (p && p.k === "p") return { k: "p", url: A.picUrl(a, REL), aspect: 1, x: 50, y: 50, z: 1, saved: true };
    return null;
  }
  // a portrait image's width fills the circle at z 1, a landscape one's height
  function fitOf(w) {
    var base = w.aspect >= 1 ? w.aspect * 100 : 100;
    return { size: Math.round(base * w.z * 10) / 10 + "% auto", pos: Math.round(w.x * 10) / 10 + "% " + Math.round(w.y * 10) / 10 + "%" };
  }
  function showWork() {
    var adj = $("acadj");
    preview = work && !work.saved ? { url: work.url, fit: fitOf(work) } : null;
    if (work) {
      adj.style.backgroundImage = "url(\"" + String(work.url).replace(/["\\]/g, "") + "\")";
      var f = fitOf(work); adj.style.backgroundSize = f.size; adj.style.backgroundPosition = f.pos;
      adj.classList.add("art"); adj.innerHTML = "";
    } else { paint(adj, A.view(), null); }
    $("acadjn").style.visibility = work ? "visible" : "hidden";
    $("acuse").disabled = !(work && !work.saved);
    // the Printing track: the chosen legend's own art and its overnumbered printing(s)
    var tr = $("acprint"), info = work && work.k === "l" ? legendOf(work.h) : null;
    tr.hidden = !info;
    if (info) {
      tr.innerHTML = "";
      info.prints.forEach(function (p) {
        var b = el("button", "");
        b.type = "button"; b.textContent = p.l; b.setAttribute("data-ph", p.h);
        b.setAttribute("aria-pressed", p.h === work.h ? "true" : "false");
        b.disabled = info.prints.length < 2;
        tr.appendChild(b);
      });
    }
    var tiles = $("aclg").querySelectorAll("button"), lgName = info ? info.lg.n : "";
    for (var i = 0; i < tiles.length; i++) tiles[i].classList.toggle("on", tiles[i].getAttribute("data-n") === lgName);
    paintAll();
  }
  function renderPics() {
    var a = A.view(), rows = $("acpicrows");
    rows.innerHTML = '<label class="door act" data-k="do"><span class="t">Upload a photo</span><input type="file" class="acfile" id="acfile" accept="image/*"></label>' +
      (a && a.pic ? '<button type="button" class="door act" id="acnopic" data-k="do"><span class="t">Remove picture</span></button>' : '');
    $("acfile").addEventListener("change", function () { if (this.files && this.files[0]) photo(this.files[0]); this.value = ""; });
    if ($("acnopic")) $("acnopic").addEventListener("click", function () {
      A.setPic({ k: null }, function (err) { if (err) return say("acpicmsg", err); work = null; preview = null; renderPics(); say("acpicmsg", "Picture removed."); });
    });
    loadLegends(function (L) {
      var g = $("aclg");
      g.innerHTML = "";
      // one circle per legend, its own art; its overnumbered printing is on the Printing track (as the Game page's legend picker)
      L.forEach(function (lg) {
        var p = printsOf(lg);
        if (!p.length) return;
        var b = el("button", "", '<span class="acav art" style="background-image:url(' + REL + 'cards/art/' + p[0].h + '.t.webp)"></span>');
        b.type = "button"; b.setAttribute("aria-label", lg.n); b.setAttribute("data-h", p[0].h); b.setAttribute("data-n", lg.n);
        g.appendChild(b);
      });
      if (!work || work.saved) work = workFromSaved();
      showWork();
    });
  }
  function pickLegend(h) {
    work = { k: "l", h: h, url: REL + "cards/art/" + h + ".t.webp", aspect: CARD, x: A.CROP.x, y: A.CROP.y, z: A.CROP.z, saved: false };
    say("acpicmsg", ""); showWork();
  }
  function pickPrinting(h) {
    if (!work || work.k !== "l" || work.h === h) return;
    work = { k: "l", h: h, url: REL + "cards/art/" + h + ".t.webp", aspect: CARD, x: work.x, y: work.y, z: work.z, saved: false };
    showWork();
  }
  // a photo: shown whole in the circle to place, then cut to a 256 square JPEG on the phone
  function photo(file) {
    say("acpicmsg", "Getting your photo ready...");
    var url = root.URL.createObjectURL(file), img = new root.Image();
    img.onload = function () {
      try {
        // kept at 1024 at most on its long side, so the phone never holds a huge one
        var k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight)), c = doc.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        root.URL.revokeObjectURL(url);
        work = { k: "p", src: c, url: c.toDataURL("image/jpeg", 0.9), aspect: c.width / c.height, x: 50, y: 50, z: 1, saved: false };
        showWork();
        say("acpicmsg", "Place it, then tap Use this picture.");
      } catch (e) { say("acpicmsg", "That photo could not be used. Try another."); }
    };
    img.onerror = function () { root.URL.revokeObjectURL(url); say("acpicmsg", "That photo could not be read. Try another."); };
    img.src = url;
  }
  // the photo as placed in the circle, drawn into 256 square
  function cutPhoto(w) {
    var c = doc.createElement("canvas"), S = 256;
    c.width = S; c.height = S;
    var base = w.aspect >= 1 ? w.aspect : 1, iw = S * base * w.z, ih = iw / w.aspect;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#08090A"; ctx.fillRect(0, 0, S, S);
    ctx.drawImage(w.src, (S - iw) * w.x / 100, (S - ih) * w.y / 100, iw, ih);
    return c.toDataURL("image/jpeg", 0.85).split(",")[1].replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function usePic() {
    if (!work || work.saved) return;
    var btn = $("acuse");
    btn.disabled = true;
    function fin(err) {
      if (err) { btn.disabled = false; return say("acpicmsg", err); }
      work = null; preview = null; renderPics(); say("acpicmsg", "Picture saved.");
      btn.disabled = false; done(btn, "Saved", function () { btn.disabled = !(work && !work.saved); });
    }
    if (work.k === "l") A.setPic({ k: "l", h: work.h, x: work.x, y: work.y, z: work.z }, fin);
    else { say("acpicmsg", "Saving..."); A.uploadPhoto(cutPhoto(work), fin); }
  }
  // dragging moves the picture in the circle; two fingers (or a mouse wheel) zoom it
  function adjustable() {
    var adj = $("acadj"), pts = {}, start = null;
    function size() { return adj.getBoundingClientRect().width || 1; }
    function begin() {
      if (!work) return;
      if (work.saved) {
        if (work.k === "p") { say("acpicmsg", "To move a photo, upload it again and place it before Use this picture."); return; }
        work = Object.assign({}, work, { saved: false });
      }
      var ids = Object.keys(pts), a = pts[ids[0]], b = pts[ids[1]];
      start = { x: work.x, y: work.y, z: work.z, px: a.x, py: a.y, d: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0 };
    }
    function move() {
      if (!work || !start || work.saved) return;
      var ids = Object.keys(pts), a = pts[ids[0]], b = pts[ids[1]], S = size();
      if (b && start.d) work.z = Math.max(1, Math.min(4, start.z * Math.hypot(a.x - b.x, a.y - b.y) / start.d));
      var base = work.aspect >= 1 ? work.aspect : 1, iw = S * base * work.z, ih = iw / work.aspect;
      if (iw - S > 0.5) work.x = Math.max(0, Math.min(100, start.x - (a.x - start.px) / (iw - S) * 100));
      if (ih - S > 0.5) work.y = Math.max(0, Math.min(100, start.y - (a.y - start.py) / (ih - S) * 100));
      showWork();
    }
    adj.addEventListener("pointerdown", function (e) { pts[e.pointerId] = { x: e.clientX, y: e.clientY }; try { adj.setPointerCapture(e.pointerId); } catch (x) {} begin(); e.preventDefault(); });
    adj.addEventListener("pointermove", function (e) { if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY }; move(); e.preventDefault(); });
    function up(e) { delete pts[e.pointerId]; if (Object.keys(pts).length) begin(); else start = null; }
    adj.addEventListener("pointerup", up); adj.addEventListener("pointercancel", up);
    adj.addEventListener("wheel", function (e) {
      if (!work) return;
      e.preventDefault();
      if (work.saved) { if (work.k === "p") return; work = Object.assign({}, work, { saved: false }); }
      work.z = Math.max(1, Math.min(4, work.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
      showWork();
    }, { passive: false });
  }

  // ---- reread the account now and then, quietly ----
  function refresh(force) {
    var s = A.saved();
    if (!s) return;
    if (!force && s.a && s.at && Date.now() - s.at < REFRESH) return;
    A.me(function (err) {
      if (err && !A.signedIn()) { if (stack.length) { closeAll(); } }
      paintAll();
      if (stack[stack.length - 1] === P.acm) renderRoot();
    });
  }

  // ---- taps ----
  function wire() {
    pic.addEventListener("click", function () { if (stack.length) closeAll(); else open(); });
    scrim.addEventListener("click", closeAll);
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && stack.length) closeAll(); });
    doc.body.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-acgo],[data-acback],[data-key],#acsign,#acsaveacct,#acout,#acsave,#acuse,#acaddkey,#ackeysave,#acrecgo,#acdl,.aclg button,#acclaim,#acdisp,#acareas button,#acprint button") : null;
      if (!t || !stack.length) return;
      if (t.hasAttribute("data-acgo")) return deeper(t.getAttribute("data-acgo"));
      if (t.hasAttribute("data-acback")) return back();
      if (t.hasAttribute("data-key")) { keyId = t.getAttribute("data-key"); return deeper("ackey"); }
      if (t.id === "acsaveacct") {
        // Save your account: a passkey, then the recovery code shown once
        say("acmsg", "Making your passkey...");
        return A.addKey(function (err, j) {
          if (err) return say("acmsg", err);
          paintAll(); renderRoot();
          deeper("accode"); showCode(j.recovery, "Your account is saved.");
        });
      }
      if (t.id === "ackeysave") {
        say("ackeyonemsg", "Saving...");
        return A.keyName(keyId, $("ackeyname").value, function (err) {
          if (err) return say("ackeyonemsg", err);
          keyInfo(); renderKeys(); say("ackeyonemsg", "Saved."); done($("ackeysave"), "Saved");
        });
      }
      if (t.id === "acdl") return download();
      if (t.id === "acsign") {
        var was = A.isGuest();
        say("acinmsg", "");
        return A.signIn(function (err) {
          if (err) return say("acinmsg", err);
          paintAll(); nextMsg = was ? "Signed in. This phone's things are in this account now." : "Signed in."; back();
        });
      }
      if (t.id === "acout") return A.signOut(function () { paintAll(); renderRoot("Signed out. Everything on this phone stays, on a new account until you sign in again."); });
      if (t.id === "acsave") {
        say("acprofmsg", "Saving...");
        return A.saveProfile({ name: $("acname").value, user: $("acuser").value, about: $("acabout").value }, function (err) {
          if (err) return say("acprofmsg", err);
          var a = A.view();
          $("acuser").value = a && a.user || "";
          paintAll(); say("acprofmsg", "Saved."); done($("acsave"), "Saved"); // stays in Profile (Mako 2026-10-30), and the button says so (2026-10-31)
        });
      }
      if (t.id === "acuse") return usePic();
      if (t.parentNode && t.parentNode.id === "aclg") return pickLegend(t.getAttribute("data-h"));
      if (t.parentNode && t.parentNode.id === "acprint") return pickPrinting(t.getAttribute("data-ph"));
      if (t.id === "acaddkey") {
        say("ackeymsg", "Making your passkey...");
        return A.addKey(function (err) { if (err) return say("ackeymsg", err); enter("ackeys"); say("ackeymsg", "Passkey added."); });
      }
      if (t.id === "acrecgo") return recover();
      if (t.id === "acclaim") return claimTap();
      if (t.id === "acdisp") return disputeTap();
      if (t.parentNode && t.parentNode.id === "acareas") return pickArea(t.getAttribute("data-area"));
    });
    $("acrecin").addEventListener("keydown", function (e) { if (e.key === "Enter") recover(); });
    ["acriotn", "acriott"].forEach(function (id) { $(id).addEventListener("input", function () { $("acdispw").hidden = true; claimState(); }); });
    $("acriotn").addEventListener("keydown", function (e) { if (e.key === "Enter") $("acriott").focus(); });
    $("acriott").addEventListener("keydown", function (e) { if (e.key === "Enter") { $("acriott").blur(); claimTap(); } });
    adjustable();
    $("ackeyname").addEventListener("keydown", function (e) { if (e.key === "Enter") { $("ackeyname").blur(); $("ackeysave").click(); } });
    armed($("ackeyoff"), "ackeyonemsg", "This passkey stops signing in to RAVI. Delete it from your phone's Passwords too.", function () {
      A.keyOff(keyId, function (err) { if (err) return say("ackeyonemsg", err); renderKeys(); back(); say("ackeymsg", "Passkey removed."); });
    });
    armed($("acdevall"), "acdevmsg", "Every other device gets a new account until it signs in again.", function () {
      A.othersOut(function (err) { if (err) return say("acdevmsg", err); renderDevices(); setTimeout(function () { say("acdevmsg", "Every other device is signed out."); }, 0); });
    });
    armed($("acdel"), "acdatamsg", "Deletes your account on RAVI's server for good. This phone keeps everything it has.", function () {
      A.remove(function (err) {
        if (err) return say("acdatamsg", err);
        paintAll(); stack = [P.acm, P.acdata]; back(); renderRoot("Account deleted. Everything on this phone stays, on a new account.");
      });
    });
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) return; if (A.signedIn()) refresh(false); else A.makeGuest(); });
  }
  function recover() {
    var v = $("acrecin").value;
    if (!v.trim()) return say("acrecmsg", "Type your recovery code first.");
    say("acrecmsg", "Checking...");
    A.recover(v, function (err, j) {
      if (err) return say("acrecmsg", err);
      $("acrecin").blur();
      paintAll(); renderRoot();
      nextMsg = "Signed in with your recovery code. Add a passkey in Passkeys so next time it's Face ID.";
      // from Sign in, Back after the code returns to the account menu itself
      if (stack[stack.length - 2] === P.acin) { cls(P.acin, ""); stack.splice(stack.length - 2, 1); }
      swapTo("accode"); showCode(j.recovery, "That code is used up. This is your new one.");
    });
  }

  function boot() {
    var row = doc.querySelector(".wmrow"), hub = doc.querySelector(".hubname");
    if (!row && !hub) return;
    pic = el("button", "acpic glass"); // glass: it is pressed (STYLE.md, Surfaces)
    pic.type = "button"; pic.id = "acpic";
    pic.setAttribute("data-k", "do"); pic.setAttribute("data-fills", "acm");
    if (row) row.appendChild(pic); else doc.body.insertBefore(pic, doc.body.firstChild);
    build();
    paintAll();
    wire();
    A.onChange(function () { paintAll(); if (stack[stack.length - 1] === P.acm) renderRoot(); });
    if (A.signedIn()) refresh(false); else A.makeGuest();
    root.addEventListener("online", function () { if (!A.signedIn()) A.makeGuest(null, true); });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})(window);
// SYNC (plan 2 M1, Mako 2026-10-31). Your decks, collection, games, saved
// trades, Follow marks and hub picks follow your account to every phone it
// is signed in on. LOCAL FIRST: the phone's own copy is what every page
// reads and writes, as before; this layer watches the writes, and on open
// and a moment after a save (when there is signal) sends what changed and
// takes what the account has that this phone lacks. Each store is split
// into items (a deck, a binder, a game, a saved trade, a Follow mark, or the
// whole value for a setting); the newest edit of an item wins; a deleted
// item is kept as a mark for a while so the delete reaches every phone; a
// whole store is never overwritten. Not synced: a game in progress, the
// timer, test switches, seen marks and filters (only the stores below).
// The export and import files stay. A page already open when another
// phone's change arrives reloads once, if nothing was touched yet; if it
// was, its stale copy is never written back over the newer one.
// ON THIS PHONE: vir.sync.v1 { a: account id, c: the server's cursor,
// k: { store: { item id: [hash, edit time, 1 while unsent] } } }.
(function (root) {
  "use strict";
  var A = root.RAVI_ACCT, LS = null;
  try { LS = root.localStorage; } catch (e) { LS = null; }
  if (!A || !LS || !root.Storage) return;
  var MKEY = "vir.sync.v1", WAIT = 2500, AGAIN = 30000, MAXPUT = 150, MAXBODY = 900000;
  var proto = root.Storage.prototype, rawSet = proto.setItem, rawDel = proto.removeItem, rawGet = proto.getItem;
  function get(k) { try { return rawGet.call(LS, k); } catch (e) { return null; } }
  function set(k, v) { try { rawSet.call(LS, k, v); return true; } catch (e) { return false; } }
  function del(k) { try { rawDel.call(LS, k); } catch (e) {} }
  function J(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function S(v) { return JSON.stringify(v); }
  // FNV-1a over the item's text: enough to see that it changed
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + "." + s.length; }

  // ---- each store, as items: split(text) -> { id: item text }; join(items, the store as it is) -> text or null ----
  function byList(field, idOf, timeOf, order) {
    return {
      split: function (raw) {
        var v = J(raw), out = {}, a = field ? v && v[field] : v;
        (Array.isArray(a) ? a : []).forEach(function (x) { var id = x && idOf(x); if (id) out[id] = S(x); });
        return out;
      },
      join: function (items, raw) {
        var v = J(raw), a = field ? (v && Array.isArray(v[field]) ? v[field] : []) : (Array.isArray(v) ? v : []), seen = {}, out = [];
        a.forEach(function (x) { var id = x && idOf(x); if (id && items[id] != null && !seen[id]) { seen[id] = 1; out.push(J(items[id])); } });
        Object.keys(items).forEach(function (id) { if (!seen[id] && items[id] != null) out.push(J(items[id])); });
        if (order) out.sort(order);
        if (!field) return out.length ? S(out) : null;
        var o = v && typeof v === "object" && !Array.isArray(v) ? v : {};
        o[field] = out;
        return S(o);
      },
      t0: timeOf
    };
  }
  var whole = { split: function (raw) { return raw == null ? {} : { all: raw }; }, join: function (items) { return items.all == null ? null : items.all; }, t0: function () { return 1; } };
  var newest = function (a, b) { return (+b.at || 0) - (+a.at || 0); };
  var STORES = {
    "vir.decks.v1": byList("decks", function (d) { return typeof d.id === "string" && d.id.length <= 60 ? "d:" + d.id : ""; }, function (s) { var d = J(s); return d && +d.t > 0 ? +d.t : 1; }),
    "vir.coll.v1": {
      split: function (raw) {
        var v = J(raw), out = {};
        if (!v || typeof v !== "object") return out;
        (Array.isArray(v.ports) ? v.ports : []).forEach(function (p) { if (p && typeof p.id === "string" && p.id.length <= 60) out["p:" + p.id] = S(p); });
        if (Array.isArray(v.wish) && v.wish.length) out.wish = S(v.wish);
        if (Array.isArray(v.loose) && v.loose.length) out.loose = S(v.loose);
        return out;
      },
      join: function (items, raw) {
        var v = J(raw), o = v && typeof v === "object" && !Array.isArray(v) ? v : { v: 1, ports: [], wish: [], loose: [], last: "" }, seen = {}, ports = [];
        (Array.isArray(o.ports) ? o.ports : []).forEach(function (p) { var id = p && "p:" + p.id; if (id && items[id] != null && !seen[id]) { seen[id] = 1; ports.push(J(items[id])); } });
        Object.keys(items).forEach(function (id) { if (/^p:/.test(id) && !seen[id] && items[id] != null) ports.push(J(items[id])); });
        o.ports = ports; o.wish = items.wish != null ? J(items.wish) : []; o.loose = items.loose != null ? J(items.loose) : [];
        return S(o);
      },
      t0: function () { return 1; }
    },
    "vir.counter.history.v1": byList(null, function (m) { return +m.at > 0 ? "m:" + (+m.at) : ""; }, function (s) { var m = J(s); return m && +m.at > 0 ? +m.at : 1; }, newest),
    "vir.trade.v1": whole,
    "vir.trade.log.v1": byList(null, function (r) { return +r.at > 0 ? "t:" + (+r.at) : ""; }, function (s) { var r = J(s); return r && +r.at > 0 ? +r.at : 1; }, newest),
    "vir.follow.v1": {
      split: function (raw) { var v = J(raw), out = {}; if (v && typeof v === "object" && !Array.isArray(v)) Object.keys(v).forEach(function (f) { if (f.length <= 60 && v[f]) out["f:" + f] = S(v[f]); }); return out; },
      join: function (items) { var o = {}; Object.keys(items).forEach(function (id) { if (items[id] != null) o[id.slice(2)] = J(items[id]); }); return Object.keys(o).length ? S(o) : null; },
      t0: function () { return 1; }
    },
    "vir.hub.blocks.v1": whole,
    "vir.hub.open.v1": whole
  };
  var KEYS = Object.keys(STORES);

  // ---- the record of what was synced ----
  var M = null;
  function meta() {
    if (M) return M;
    var m = J(get(MKEY));
    M = m && typeof m === "object" && m.k && typeof m.k === "object" ? m : { a: null, c: 0, k: {} };
    return M;
  }
  function keepMeta() { set(MKEY, S(meta())); }
  function itemsOf(key) { var r = get(key); try { return r == null ? {} : STORES[key].split(r); } catch (e) { return {}; } }

  // what another phone's change left behind on a page that had already read its store:
  // stale[key][id] = { h: the item's hash before (or "" when it was absent), d: the newer item or null }
  var stale = {}, wrote = false, touched = false, loadedAt = Date.now();

  // compare a store with the record: changed items get this moment as their edit time
  function stamp(key, now) {
    var m = meta(), first = !m.k[key], km = m.k[key] || (m.k[key] = {}), items = itemsOf(key), fix = null, dirty = false;
    Object.keys(items).forEach(function (id) {
      var h = hash(items[id]), e = km[id], st = stale[key] && stale[key][id];
      if (e && e[0] === h) return;
      if (st && st.h === h) { (fix = fix || {})[id] = st.d; return; } // the page wrote back its old copy
      if (st) delete stale[key][id];
      km[id] = [h, first ? STORES[key].t0(items[id]) : now, 1]; dirty = true; // what was here before sync keeps its own time
    });
    Object.keys(km).forEach(function (id) {
      if (items[id] != null || km[id][0] === "") return;
      var st = stale[key] && stale[key][id];
      if (st && st.h === "") { (fix = fix || {})[id] = st.d; return; } // a page that never saw it left it out
      if (st) delete stale[key][id];
      km[id] = ["", now, 1]; dirty = true;
    });
    if (fix) {
      Object.keys(fix).forEach(function (id) { if (fix[id] == null) delete items[id]; else items[id] = fix[id]; });
      var out = STORES[key].join(items, get(key));
      if (out == null) del(key); else set(key, out);
    }
    return dirty;
  }

  // the pages' writes, watched (the page's own call is untouched)
  var timer = 0;
  function soon() { clearTimeout(timer); timer = setTimeout(run, WAIT); }
  function watched(key, write) {
    if (this !== LS || KEYS.indexOf(key) < 0) return write();
    var r = write();
    wrote = true;
    if (A.signedIn() && stamp(key, Date.now())) { keepMeta(); soon(); } else keepMeta();
    return r;
  }
  proto.setItem = function (k, v) { var self = this, args = arguments; return watched.call(this, String(k), function () { return rawSet.apply(self, args); }); };
  proto.removeItem = function (k) { var self = this, args = arguments; return watched.call(this, String(k), function () { return rawDel.apply(self, args); }); };
  // a page that reads a store again has the newer copy: its writes are its own from then on
  proto.getItem = function (k) { if (this === LS && stale[k]) delete stale[k]; return rawGet.apply(this, arguments); };

  // ---- one round with the server ----
  var busy = false, again = false, lastRun = 0, status = "";
  function run() {
    clearTimeout(timer);
    var s = A.saved();
    if (!s || !s.id) return;
    if (busy) { again = true; return; }
    var m = meta(), now = Date.now();
    if (m.a !== s.id) {
      // a new account on this phone (saved, signed in to another, or a new guest): it gets everything here
      M = m = { a: s.id, c: 0, k: {} };
      KEYS.forEach(function (key) { stamp(key, now); });
      KEYS.forEach(function (key) { var km = m.k[key]; Object.keys(km).forEach(function (id) { km[id][2] = 1; }); });
    } else KEYS.forEach(function (key) { stamp(key, now); });
    var put = [], sent = {}, size = 0;
    KEYS.forEach(function (key) {
      var km = m.k[key], items = null;
      Object.keys(km).forEach(function (id) {
        var e = km[id];
        if (!e[2] || put.length >= MAXPUT) return;
        items = items || itemsOf(key);
        var x = { k: key, id: id, t: e[1] };
        if (e[0] === "" || items[id] == null) x.x = 1; else x.d = items[id];
        var n = (x.d ? x.d.length : 0) + 120;
        if (size + n > MAXBODY && put.length) return;
        size += n; put.push(x); sent[key + "\n" + id] = e[1];
      });
    });
    keepMeta();
    busy = true; lastRun = now;
    A.syncCall({ since: m.c || 0, put: put }, function (err, j) {
      busy = false;
      if (err || !j || !Array.isArray(j.items)) { status = err || "No answer from RAVI's server."; return finish(false); }
      var mm = meta();
      if (mm.a !== s.id) return finish(false); // the account changed while this was on its way
      // what was sent and kept, or answered with a newer copy, is no longer unsent
      Object.keys(sent).forEach(function (kk) { var p = kk.split("\n"), e = mm.k[p[0]] && mm.k[p[0]][p[1]]; if (e && e[1] === sent[kk] && !j.full) e[2] = 0; });
      var changed = {};
      j.items.concat(Array.isArray(j.back) ? j.back : []).forEach(function (r) {
        if (!r || KEYS.indexOf(r.k) < 0 || typeof r.id !== "string") return;
        var km = mm.k[r.k] || (mm.k[r.k] = {}), e = km[r.id], d = r.x ? null : (typeof r.d === "string" ? r.d : null), h = d == null ? "" : hash(d);
        if (e && e[0] === h) { if (e[1] < r.t) e[1] = r.t; if (sent[r.k + "\n" + r.id] !== undefined) e[2] = 0; return; }
        if (e && e[2] && e[1] > r.t) return; // this phone's edit is newer; it goes up next
        (changed[r.k] = changed[r.k] || {})[r.id] = d;
        km[r.id] = [h, +r.t || 0, 0];
      });
      Object.keys(changed).forEach(function (key) {
        var items = itemsOf(key), ch = changed[key];
        stale[key] = stale[key] || {};
        Object.keys(ch).forEach(function (id) {
          stale[key][id] = { h: items[id] == null ? "" : hash(items[id]), d: ch[id] };
          if (ch[id] == null) delete items[id]; else items[id] = ch[id];
        });
        var out = STORES[key].join(items, get(key));
        if (out == null) del(key); else set(key, out);
        // the join can tidy an item (order, defaults); the record follows what is now stored
        var now2 = itemsOf(key), km = mm.k[key];
        Object.keys(ch).forEach(function (id) { if (km[id]) km[id][0] = now2[id] == null ? "" : hash(now2[id]); });
      });
      if (+j.cur >= 0) mm.c = +j.cur;
      keepMeta();
      status = j.full ? "full" : "";
      var any = Object.keys(changed).length > 0;
      if (any) fresh(Object.keys(changed));
      finish(j.more || again);
    });
    function finish(more) { again = false; if (more) setTimeout(run, 50); }
  }
  // a page that has read a store another phone just changed: shown again once, if it was not touched yet
  var PAGES = { decks: ["vir.decks.v1", "vir.coll.v1", "vir.trade.v1"], collection: ["vir.coll.v1", "vir.decks.v1", "vir.trade.v1"], trade: ["vir.trade.v1", "vir.trade.log.v1"],
    calendar: ["vir.follow.v1"], settings: ["vir.hub.blocks.v1", "vir.hub.open.v1"], cut: ["vir.counter.history.v1"], "": ["vir.hub.blocks.v1"] };
  function fresh(keys) {
    var m = /\/([a-z]+)\/(index\.html)?$/.exec(root.location.pathname), page = m ? m[1] : "", reads = PAGES[page] || [];
    if (!keys.some(function (k) { return reads.indexOf(k) >= 0; })) return;
    if (wrote || touched || Date.now() - loadedAt > 15000) return;
    try { if (+root.sessionStorage.getItem("ravi.sync.reload") > Date.now() - 30000) return; root.sessionStorage.setItem("ravi.sync.reload", String(Date.now())); } catch (e) { return; }
    root.location.reload();
  }

  function kick() { if (A.signedIn() && Date.now() - lastRun > AGAIN) run(); }
  root.RAVI_SYNC = { run: run, status: function () { return status; }, KEYS: KEYS, STORES: STORES, hash: hash };
  root.addEventListener("pointerdown", function () { touched = true; }, true);
  root.addEventListener("keydown", function () { touched = true; }, true);
  A.onChange(function () { if (A.signedIn()) setTimeout(run, 0); });
  function start() { if (A.signedIn()) run(); }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 0); }); else setTimeout(start, 0);
  root.document.addEventListener("visibilitychange", function () { if (!root.document.hidden) kick(); });
  root.addEventListener("online", function () { if (A.signedIn()) run(); });
})(window);
