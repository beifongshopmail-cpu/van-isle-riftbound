// account.js -- RAVI's own accounts on the phone (plan 2 M1, 2026-10-30).
// window.RAVI_ACCT. Sign-in is a passkey (Face ID, a fingerprint or the
// phone's lock); the server is ravi-live (server/live/accounts.js), the
// same server live.js reads. Accounts are optional: every page works the
// same signed out.
//
// ON THIS PHONE: vir.acct.v1 { t: the sign-in token, id, made }. The token
// goes in the Authorization header; nothing else about the account is kept
// here. Sign out forgets it even when there is no signal.
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
    try { root.localStorage.setItem(KEY, JSON.stringify({ t: token, id: account && account.id || null, made: account && account.made || null })); } catch (e) {}
  }
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
  function me(cb) { if (!signedIn()) return cb("Signed out."); call("GET", "/me", null, cb); }
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

  root.RAVI_ACCT = { BASE: BASE, KEY: KEY, supported: supported, signedIn: signedIn, saved: saved,
    create: create, addKey: addKey, signIn: signIn, recover: recover, me: me, newCode: newCode, signOut: signOut, remove: remove };
})(window);
