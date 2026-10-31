// account.js -- RAVI's own accounts on the phone (plan 2 M1, 2026-10-30).
// window.RAVI_ACCT. Sign-in is a passkey (Face ID, a fingerprint or the
// phone's lock); the server is ravi-live (server/live/accounts.js), the
// same server live.js reads. Accounts are optional: every page works the
// same signed out.
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
        if (r.status === 401 && s) { forget(); return finish("You were signed out on RAVI's server. Sign in again.", j, 401); }
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
    return { challenge: o.challenge, cred: { id: c.id, type: c.type,
      response: { clientDataJSON: b64u(c.response.clientDataJSON), attestationObject: b64u(c.response.attestationObject) } } };
  }

  // make a new passkey: a new account when signed out, another passkey on this account when signed in
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
  function addKey(cb) { if (!signedIn()) return cb("Sign in first."); newKey(cb); }

  function signIn(cb) {
    if (!supported()) return cb("This phone can't use passkeys. Update iOS, or use a recovery code.");
    options("get", function (err, o) {
      if (err) return cb(err);
      root.navigator.credentials.get({ publicKey: { challenge: unb64u(o.challenge), rpId: o.rpId, userVerification: "preferred", timeout: o.timeout || 60000 } }).then(function (c) {
        var r = c.response;
        call("POST", "/auth/verify", { challenge: o.challenge, cred: { id: c.id, type: c.type, response: {
          clientDataJSON: b64u(r.clientDataJSON), authenticatorData: b64u(r.authenticatorData), signature: b64u(r.signature),
          userHandle: r.userHandle ? b64u(r.userHandle) : null } } }, function (err2, j) {
          if (err2) return cb(err2);
          keep(j.token, j.account);
          cb(null, j);
        });
      }).catch(function (e) { cb(refusal(e)); });
    });
  }

  function recover(code, cb) {
    call("POST", "/recover", { code: String(code || "").slice(0, 64) }, function (err, j) {
      if (err) return cb(err);
      keep(j.token, j.account);
      cb(null, j);
    });
  }
  function me(cb) { if (!signedIn()) return cb("Signed out."); call("GET", "/me", null, function (err, j, st) { if (!err && j) setView(j); cb(err, j, st); }); }
  function saveProfile(o, cb) { call("POST", "/profile", { name: o.name, user: o.user, about: o.about }, cb); }
  function setPic(o, cb) { call("POST", "/pic", o, cb); }
  function uploadPhoto(jpgB64, cb) { call("POST", "/photo", { jpg: jpgB64 }, cb); }
  // "Name#TAG" -> { n, tag } (the tag is everything after the last #)
  function splitRiot(text) {
    var s = String(text || "").trim(), i = s.lastIndexOf("#");
    return { n: (i >= 0 ? s.slice(0, i) : s).trim(), tag: i >= 0 ? s.slice(i + 1).trim() : "" };
  }
  function claimRiot(text, cb) { var r = splitRiot(text); call("POST", "/riot", { n: r.n, tag: r.tag }, cb); }
  function releaseRiot(cb) { call("POST", "/riot", { off: true }, cb); }
  function disputeRiot(text, cb) { var r = splitRiot(text); call("POST", "/riot/dispute", { n: r.n, tag: r.tag }, cb); }
  function setArea(area, cb) { call("POST", "/area", { area: area }, cb); }
  function disputes(cb) { call("GET", "/admin/disputes", null, cb); }
  function decide(id, give, cb) { call("POST", "/admin/decide", { id: id, give: !!give }, cb); }
  // where a picture is drawn from: a legend's art (rel: "" on the hub, "../" in a page folder) or a photo
  function picUrl(a, rel) {
    if (!a || !a.pic) return "";
    if (a.pic.k === "l" && /^[0-9a-f]{40}$/.test(a.pic.h)) return (rel || "") + "cards/art/" + a.pic.h + ".t.webp";
    if (a.pic.k === "p" && /^[0-9a-f]{24}$/.test(a.id || "")) return BASE + "/acct/pic/" + a.id + "?v=" + (+a.pic.v || 0);
    return "";
  }
  function newCode(cb) { call("POST", "/code", {}, cb); }
  function signOut(cb) {
    // forgotten on the phone whatever the server says
    call("POST", "/out", {}, function () { forget(); if (cb) cb(null); });
  }
  function remove(cb) {
    call("POST", "/delete", {}, function (err) {
      if (err) return cb(err);
      forget();
      cb(null);
    });
  }

  root.RAVI_ACCT = { BASE: BASE, KEY: KEY, supported: supported, signedIn: signedIn, saved: saved, view: view,
    create: create, addKey: addKey, signIn: signIn, recover: recover, me: me, newCode: newCode, signOut: signOut, remove: remove,
    saveProfile: saveProfile, setPic: setPic, uploadPhoto: uploadPhoto, picUrl: picUrl,
    claimRiot: claimRiot, releaseRiot: releaseRiot, disputeRiot: disputeRiot, setArea: setArea, disputes: disputes, decide: decide };
})(window);

// THE PICTURE AND ITS MENUS (plan 2 M1 block 2; Mako 2026-10-30). Every page
// with the wordmark row, and the hub, gets your picture in its top right
// corner (a person in glass when signed out). Tapped, the account menu
// grows out of it and the picture itself grows from 36 to 56 into the
// menu's top right corner, where a tap closes it. Deeper menus (Profile,
// Picture, Passkeys, Recovery code, Your data; Use a recovery code when
// signed out) slide in place under the picture. Styles: app.css, THE
// ACCOUNT PICTURE AND ITS MENUS. The Game page has no wordmark row, so no
// picture: its play field keeps the whole screen.
(function (root) {
  "use strict";
  var doc = root.document;
  if (!doc || !root.RAVI_ACCT) return;
  var A = root.RAVI_ACCT;
  var REL = /\/[a-z]+\/(index\.html)?$/.test(root.location.pathname) ? "../" : "";
  var SVG_P = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4.5"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5"/></svg>';
  var SVG_ME = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path d="M3.5 21.5c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5z"/></svg>';
  var CV = '<svg class="cvr" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';
  var BACK = '<button type="button" class="circ btn glass back" data-acback aria-label="Back" data-k="do"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"/></svg></button>';
  var REFRESH = 3600000; // the account is reread at most once an hour per phone
  var pic, scrim, P = {}, stack = [], lifted = false, legends = null, choice = null, preview = null, nextMsg = "";

  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function $(id) { return doc.getElementById(id); }
  function day(d) {
    try { return new Date(d + "T12:00:00Z").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); } catch (e) { return d; }
  }

  // draw a picture into a circle: art, the photo, or a person (filled when signed in)
  function paint(node, a, over) {
    var url = over ? over.url : A.picUrl(a, REL);
    node.style.backgroundImage = url ? "url(\"" + url.replace(/["\\]/g, "") + "\")" : "";
    node.classList.toggle("art", !!url);
    node.classList.toggle("me", !url && A.signedIn());
    node.innerHTML = url ? "" : (A.signedIn() ? SVG_ME : SVG_P);
  }
  function paintAll() {
    var a = A.view();
    paint(pic, a, preview);
    var big = $("acbig");
    if (big) paint(big, a, preview);
    pic.setAttribute("aria-label", A.signedIn() ? "Your account" : "Sign in or create an account");
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
        '<p class="lb">Riot ID</p><div class="nf"><input type="text" id="acriot" maxlength="24" placeholder="Name#TAG" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" aria-label="Riot ID" data-k="type"><button type="button" class="fbtn glass" id="acclaim" data-k="do">Claim</button></div>' +
        '<p class="pnote">One RAVI account per Riot ID. It finds your table and your alerts at live events.</p>' +
        '<p class="acmsg" id="acriotmsg" aria-live="polite"></p>' +
        '<div class="doors acgap" id="acdispw" data-k="do" hidden><button type="button" class="door act" id="acdisp"><span class="t">This is my Riot ID</span></button></div>' +
        '<p class="lb">Home area</p><div class="doors" data-k="deeper"><button type="button" class="door" data-acgo="acarea"><span class="t" id="acareat">Not set</span><span class="sp"></span>' + CV + '</button></div>' +
        '<p class="lb">About you</p><div class="nf"><input type="text" id="acabout" maxlength="80" placeholder="One line, shown on your profile" enterkeyhint="done" aria-label="About you" data-k="type"></div>' +
        '<p class="pnote">Only you see your profile for now. The trade board will show it to the players you trade with.</p>' +
        '<p class="acmsg" id="acprofmsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acsave" data-k="do">Save</button></div>',
      acpicm: headTitle("Picture") + '<div class="pbody"><div class="doors" id="acpicrows"></div>' +
        '<p class="lb">Or pick a legend</p><div class="aclg" id="aclg" data-k="pick"></div><p class="acmsg" id="acpicmsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acuse" data-k="do" disabled>Use this picture</button></div>',
      ackeys: headTitle("Passkeys") + '<div class="pbody"><div id="ackeylist"></div><p class="pnote">A passkey is Face ID, a fingerprint or a phone\'s lock, kept by your phone or your password manager. Add one on each phone you use, or keep them synced in iCloud Keychain.</p><p class="acmsg" id="ackeymsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acaddkey" data-k="do">Add a passkey</button></div>',
      accode: headTitle("Recovery code") + '<div class="pbody" id="accodebody"></div><div class="pfoot" id="accodefoot"></div>',
      acarea: headTitle("Home area") + '<div class="pbody"><div class="pick" id="acareas" data-k="pick"></div><p class="pnote">Where you mostly play.</p><p class="acmsg" id="acareamsg" aria-live="polite"></p></div>',
      acdispm: headTitle("Disputes") + '<div class="pbody"><div id="acdisplist"></div><p class="acmsg" id="acdispmsg" aria-live="polite"></p></div>',
      acdata: headTitle("Your data") + '<div class="pbody"><p class="pnote">What RAVI keeps for your account: your passkeys\' public keys and the days they were added and used, your profile, picture, Riot ID and home area, the days you signed in, and a scrambled copy of your recovery code. Never a password or an email.</p>' +
        '<p class="pnote" id="acnum"></p>' +
        '<div class="doors acgap" data-k="do"><button type="button" class="door act" id="acdel"><span class="t">Delete account</span></button></div>' +
        '<p class="acmsg" id="acdatamsg" aria-live="polite"></p></div>',
      acrec: headTitle("Use a recovery code") + '<div class="pbody"><div class="nf tall"><input type="text" id="acrecin" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" aria-label="Recovery code" data-k="type"></div>' +
        '<p class="pnote">The code RAVI showed you when you made your account. It signs you in once; you get a new one straight after.</p><p class="acmsg" id="acrecmsg" aria-live="polite"></p></div>' +
        '<div class="pfoot"><button type="button" class="pact btn glass" id="acrecgo" data-k="do">Sign in</button></div>'
    };
    var labels = { acm: "Your account", acprof: "Profile", acpicm: "Picture", ackeys: "Passkeys", accode: "Recovery code", acdata: "Your data", acrec: "Use a recovery code", acarea: "Home area", acdispm: "Disputes" };
    Object.keys(defs).forEach(function (id) {
      var p = el("section", "panel frost acct", defs[id]);
      p.id = id; p.setAttribute("aria-hidden", "true"); p.setAttribute("aria-label", labels[id]);
      doc.body.appendChild(p);
      P[id] = p;
    });
    if (root.RAVI_WATCH) root.RAVI_WATCH(Object.keys(P).map(function (k) { return P[k]; }));
  }

  // ---- the root menu ----
  function renderRoot(msg) {
    var a = A.view(), h = $("achead"), b = $("acmbody");
    if (A.signedIn()) {
      var name = a && a.name ? a.name : "Your account";
      var bits = [];
      if (a && a.user) bits.push("@" + a.user);
      if (a && a.riot) bits.push(a.riot.n + "#" + a.riot.tag);
      var sub = bits.length ? bits.join(" \u00b7 ") : "Add your name and picture";
      h.innerHTML = '<div class="acn"><b></b><span></span></div>';
      h.querySelector("b").textContent = name;
      h.querySelector("span").textContent = sub;
      var n = a && a.keys ? a.keys.length : 0;
      b.innerHTML = '<div class="doors" data-k="deeper">' +
        '<button type="button" class="door" data-acgo="acprof"><span class="t">Profile</span><span class="sp"></span>' + CV + '</button>' +
        '<button type="button" class="door" data-acgo="ackeys"><span class="t">Passkeys</span><span class="sp"></span>' + (n ? '<small>' + n + '</small>' : '') + CV + '</button>' +
        '<button type="button" class="door" data-acgo="accode"><span class="t">Recovery code</span><span class="sp"></span>' + CV + '</button>' +
        '<button type="button" class="door" data-acgo="acdata"><span class="t">Your data</span><span class="sp"></span>' + CV + '</button>' +
        (a && a.admin ? '<button type="button" class="door" data-acgo="acdispm"><span class="t">Disputes</span><span class="sp"></span>' + (a.disputes ? '<small>' + a.disputes + '</small>' : '') + CV + '</button>' : '') + '</div>' +
        '<div class="doors" data-k="do"><button type="button" class="door act" id="acout"><span class="t">Sign out</span></button></div>' +
        '<p class="acmsg" id="acmsg" aria-live="polite"></p>';
    } else {
      h.innerHTML = '<h4 class="ttl">Account</h4>';
      var can = A.supported();
      b.innerHTML = '<div class="doors">' +
        '<button type="button" class="door act" id="acnew" data-k="do"' + (can ? '' : ' disabled') + '><span class="t">Create an account</span></button>' +
        '<button type="button" class="door act" id="acsign" data-k="do"' + (can ? '' : ' disabled') + '><span class="t">Sign in</span></button>' +
        '<button type="button" class="door" data-acgo="acrec" data-k="deeper"><span class="t">Use a recovery code</span><span class="sp"></span>' + CV + '</button></div>' +
        '<p class="pnote">' + (can ? "Optional: RAVI works the same without one. You sign in with a passkey, so Face ID or your phone's lock, with no password and no email. Next, your decks, collection and games follow your account to any phone you sign in on."
          : "This phone can't use passkeys, so it can't make an account. Update iOS, or sign in with a recovery code from an account you made elsewhere.") + '</p>' +
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
    if (A.signedIn()) refresh(true);
  }
  function closeAll() {
    var t = stack[stack.length - 1];
    stack = [];
    if (t) cls(t, "");
    scrim.classList.remove("show");
    doc.documentElement.classList.remove("lock");
    if (preview) { preview = null; choice = null; paintAll(); }
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
    if (from === P.acpicm && preview) { preview = null; choice = null; paintAll(); }
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
      var here = null;
      try { here = JSON.parse(root.localStorage.getItem("vir.me.v1") || "null"); } catch (e) {}
      $("acriot").value = a && a.riot ? a.riot.n + "#" + a.riot.tag : (here && here.n ? here.n + (here.tag ? "#" + here.tag : "") : "");
      say("acprofmsg", ""); say("acriotmsg", ""); $("acdispw").hidden = true;
      claimState(); areaText(); paintAll();
    }
    else if (id === "acarea") { renderAreas(); say("acareamsg", ""); }
    else if (id === "acdispm") { renderDisputes(); } else if (id === "acpicm") { choice = null; renderPics(); say("acpicmsg", ""); }
    else if (id === "ackeys") {
      var list = $("ackeylist"), keys = a && a.keys || [];
      list.innerHTML = "";
      keys.forEach(function (k, i) {
        var p = el("p", "pnote"); p.textContent = "Passkey " + (i + 1) + ": added " + day(k.made) + ", last used " + day(k.last) + ".";
        list.appendChild(p);
      });
      if (!keys.length) { var q = el("p", "pnote"); q.textContent = "Your passkeys show here."; list.appendChild(q); }
      say("ackeymsg", "");
    } else if (id === "accode") { codeInfo(); }
    else if (id === "acdata") { say("acdatamsg", ""); $("acnum").textContent = a && a.id ? "Account number: " + a.id : ""; }
    else if (id === "acrec") { $("acrecin").value = ""; say("acrecmsg", ""); }
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

  // ---- Riot ID: claim, release, or say it is yours ----
  function riotText(a) { return a && a.riot ? a.riot.n + "#" + a.riot.tag : ""; }
  // Claim, or Release when the field shows the Riot ID this account holds
  function claimState() {
    var b = $("acclaim"), a = A.view(), held = riotText(a);
    var same = held && $("acriot").value.trim().toLowerCase() === held.toLowerCase();
    if (!b.classList.contains("armed")) b.textContent = same ? "Release" : "Claim";
    b.setAttribute("data-mode", same ? "off" : "on");
  }
  var relArm = false, relT = 0;
  function claimTap() {
    var b = $("acclaim"), v = $("acriot").value;
    $("acdispw").hidden = true;
    if (b.getAttribute("data-mode") === "off") {
      // releasing asks for a second tap (STYLE.md, Confirm: Sure? where the words do not fit)
      if (!relArm) {
        relArm = true; b.classList.add("armed"); b.textContent = "Sure?"; say("acriotmsg", "Another account could then claim it.");
        relT = setTimeout(function () { relArm = false; b.classList.remove("armed"); claimState(); say("acriotmsg", ""); }, 3000);
        return;
      }
      relArm = false; clearTimeout(relT); b.classList.remove("armed");
      return A.releaseRiot(function (err) { if (err) return say("acriotmsg", err); $("acriot").value = ""; claimState(); say("acriotmsg", "Released."); });
    }
    if (!v.trim()) return say("acriotmsg", "Type your Riot ID first, with its #tag.");
    say("acriotmsg", "Claiming...");
    A.claimRiot(v, function (err, j, st) {
      if (err) {
        say("acriotmsg", err + (st === 409 ? " If it is yours, tell RAVI." : ""));
        $("acdispw").hidden = st !== 409;
        return;
      }
      var a = A.view();
      $("acriot").value = riotText(a); claimState(); say("acriotmsg", "Claimed. It is yours on RAVI.");
    });
  }
  function disputeTap() {
    say("acriotmsg", "Sending...");
    A.disputeRiot($("acriot").value, function (err) {
      if (err) return say("acriotmsg", err);
      $("acdispw").hidden = true;
      say("acriotmsg", "Sent to RAVI to check. Send a screenshot of your Riot account page through Feedback, with your @username, and RAVI will settle it.");
    });
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
  // the pictures on offer: each legend's own art, then its overnumbered printing (numbered
  // past the set, such as OGN 299/298); never a signature printing (a star in its number),
  // whose signature would not show in a circle (Mako 2026-10-30)
  function artOf(L) {
    var out = [];
    L.forEach(function (lg) {
      var base = [], over = [];
      (lg && lg.v || []).forEach(function (v) {
        var m = /-(\d+)(\*?)\/(\d+)$/.exec(v && v.c || "");
        if (!m || m[2] || !/^[0-9a-f]{40}$/.test(v.h || "")) return;
        (+m[1] > +m[3] ? over : base).push(v.h);
      });
      if (base.length) out.push({ h: base[0], label: lg.n });
      over.forEach(function (h) { out.push({ h: h, label: lg.n + ", overnumbered" }); });
    });
    return out;
  }
  function renderPics() {
    var a = A.view(), rows = $("acpicrows");
    rows.innerHTML = '<label class="door act" data-k="do"><span class="t">Upload a photo</span><input type="file" class="acfile" id="acfile" accept="image/*"></label>' +
      (a && a.pic ? '<button type="button" class="door act" id="acnopic" data-k="do"><span class="t">Remove picture</span></button>' : '');
    $("acfile").addEventListener("change", function () { if (this.files && this.files[0]) photo(this.files[0]); this.value = ""; });
    if ($("acnopic")) $("acnopic").addEventListener("click", function () {
      A.setPic({ k: null }, function (err) { if (err) return say("acpicmsg", err); preview = null; choice = null; paintAll(); renderPics(); say("acpicmsg", "Picture removed."); });
    });
    $("acuse").disabled = !choice;
    loadLegends(function (L) {
      var g = $("aclg"), cur = choice && choice.k === "l" ? choice.h : (!choice && a && a.pic && a.pic.k === "l" ? a.pic.h : "");
      g.innerHTML = "";
      artOf(L).forEach(function (x) {
        var b = el("button", x.h === cur ? "on" : "", '<span class="acav art" style="background-image:url(' + REL + 'cards/art/' + x.h + '.t.webp)"></span>');
        b.type = "button"; b.setAttribute("aria-label", x.label); b.setAttribute("data-h", x.h);
        g.appendChild(b);
      });
    });
  }
  function pickLegend(h) {
    choice = { k: "l", h: h };
    preview = { url: REL + "cards/art/" + h + ".t.webp" };
    var b = $("aclg").querySelectorAll("button");
    for (var i = 0; i < b.length; i++) b[i].classList.toggle("on", b[i].getAttribute("data-h") === h);
    $("acuse").disabled = false;
    paintAll();
  }
  // a photo, shrunk on the phone to 256 square (the middle of it) as a JPEG
  function photo(file) {
    say("acpicmsg", "Getting your photo ready...");
    var url = root.URL.createObjectURL(file), img = new root.Image();
    img.onload = function () {
      try {
        var s = Math.min(img.naturalWidth, img.naturalHeight), c = doc.createElement("canvas");
        c.width = 256; c.height = 256;
        c.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 256, 256);
        var data = c.toDataURL("image/jpeg", 0.85);
        root.URL.revokeObjectURL(url);
        choice = { k: "p", jpg: data.split(",")[1].replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") };
        preview = { url: data };
        var on = $("aclg").querySelectorAll("button.on");
        for (var i = 0; i < on.length; i++) on[i].classList.remove("on");
        $("acuse").disabled = false;
        paintAll();
        say("acpicmsg", "Tap Use this picture to keep it.");
      } catch (e) { say("acpicmsg", "That photo could not be used. Try another."); }
    };
    img.onerror = function () { root.URL.revokeObjectURL(url); say("acpicmsg", "That photo could not be read. Try another."); };
    img.src = url;
  }
  function usePic() {
    if (!choice) return;
    var btn = $("acuse");
    btn.disabled = true;
    function done(err) {
      if (err) { btn.disabled = false; return say("acpicmsg", err); }
      preview = null; choice = null; paintAll(); renderPics(); say("acpicmsg", "Picture saved."); // stays in Picture
    }
    if (choice.k === "l") A.setPic({ k: "l", h: choice.h }, done);
    else { say("acpicmsg", "Saving..."); A.uploadPhoto(choice.jpg, done); }
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
      var t = e.target.closest ? e.target.closest("[data-acgo],[data-acback],#acnew,#acsign,#acout,#acsave,#acuse,#acaddkey,#acrecgo,.aclg button,#acclaim,#acdisp,#acareas button") : null;
      if (!t || !stack.length) return;
      if (t.hasAttribute("data-acgo")) return deeper(t.getAttribute("data-acgo"));
      if (t.hasAttribute("data-acback")) return back();
      if (t.id === "acnew") {
        say("acmsg", "Making your passkey...");
        return A.create(function (err, j) {
          if (err) return say("acmsg", err);
          paintAll(); renderRoot();
          deeper("accode"); showCode(j.recovery, "");
        });
      }
      if (t.id === "acsign") {
        say("acmsg", "");
        return A.signIn(function (err) { if (err) return say("acmsg", err); paintAll(); renderRoot("Signed in."); });
      }
      if (t.id === "acout") return A.signOut(function () { paintAll(); renderRoot("Signed out. Everything on this phone stays."); });
      if (t.id === "acsave") {
        say("acprofmsg", "Saving...");
        return A.saveProfile({ name: $("acname").value, user: $("acuser").value, about: $("acabout").value }, function (err) {
          if (err) return say("acprofmsg", err);
          var a = A.view();
          $("acuser").value = a && a.user || "";
          paintAll(); say("acprofmsg", "Saved."); // stays in Profile (Mako 2026-10-30)
        });
      }
      if (t.id === "acuse") return usePic();
      if (t.parentNode && t.parentNode.id === "aclg") return pickLegend(t.getAttribute("data-h"));
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
    $("acriot").addEventListener("input", function () { $("acdispw").hidden = true; claimState(); });
    $("acriot").addEventListener("keydown", function (e) { if (e.key === "Enter") { $("acriot").blur(); claimTap(); } });
    armed($("acdel"), "acdatamsg", "Deletes your account on RAVI's server for good. This phone keeps everything it has.", function () {
      A.remove(function (err) {
        if (err) return say("acdatamsg", err);
        paintAll(); stack = [P.acm, P.acdata]; back(); renderRoot("Account deleted.");
      });
    });
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) refresh(false); });
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
    refresh(false);
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})(window);
