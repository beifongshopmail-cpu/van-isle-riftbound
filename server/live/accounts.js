// accounts.js -- RAVI's own accounts (plan 2 M1, 2026-10-30). One Durable
// Object ("all") on SQLite.
//
// SIGN-IN IS A PASSKEY (Mako 2026-10-30): Face ID, a fingerprint or the
// phone's lock. No password and no email: RAVI never holds a secret that
// unlocks the account, only each passkey's public key. A recovery code,
// shown once, is the way back in when every passkey is lost; RAVI keeps
// only its SHA-256.
//
// WHAT IS KEPT, and nothing else: a random account id, a random user
// handle for the passkeys, the day it was made, the recovery code's stamp;
// per passkey its id, public key, signature count and the days it was made
// and last used; per signed-in phone a stamp of its token and those two
// days; the profile the player fills in (display name, @username, one
// line about them, a home area, a picture: a legend's art by its hash, or a
// photo the phone shrank to 256 square JPEG); the Riot ID the player
// claimed (one account per Riot ID, first claim holds: Mako 2026-10-30) and
// any dispute they raised over one. Synced data arrives in a later block.
// Delete removes every row of the account at once.
//
// DISPUTES: a player whose Riot ID another account holds can say it is
// theirs. Mako (an account listed in the Worker variable ADMIN) sees each
// dispute in his account menu and gives the ID to the player who asked, or
// keeps it where it is. RAVI cannot check a Riot ID itself until Riot grants
// it Riot Sign-On (NEXT -- register RAVI with Riot). Addresses are kept only as one-way
// stamps with the day in them, for the day's limits.
//
// The passkey checks follow the WebAuthn Level 2 steps (w3.org/TR/webauthn-2,
// sections 7.1 and 7.2), checked against SimpleWebAuthn's server (MIT,
// github.com/MasterKale/SimpleWebAuthn) for the same order: the client data's
// type, challenge and origin, the relying party's hash, user presence, then
// the key and the signature. Attestation is not asked for ("none") and not
// trusted; RAVI does not care which maker built the passkey.
// No dependencies: CBOR and the key handling are written here.

export const RP_ID = "ravi.tools";
export const ORIGINS = ["https://ravi.tools"];
export const CHALLENGE_MS = 5 * 60000;
export const SESSION_DAYS = 180;
export const KEYS_MAX = 10;
export const LIMITS = { opt: 300, made: 30, code: 20, prof: 200, photo: 30, disp: 5 }; // per connection per day
export const PHOTO_MAX = 150000; // bytes of JPEG
export const AREAS = ["victoria", "island", "away"]; // Greater Victoria, Up Island, Somewhere else
const RESERVED = ["ravi", "admin", "administrator", "support", "help", "mod", "moderator", "staff", "official", "riot", "riotgames", "system", "root", "null", "undefined", "me", "you", "account", "settings"];
const DAY = 86400000;
const ALGS = [-7, -257]; // ES256, RS256
const CODE_ABC = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0 O 1 I L

// ---- bytes ----
export function b64u(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function unb64u(text) {
  if (typeof text !== "string" || !/^[A-Za-z0-9_-]*$/.test(text) || text.length > 20000) return null;
  const s = text.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const bin = atob(s + "===".slice((s.length + 3) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch (e) { return null; }
}
function rand(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
function hex(b) { return Array.from(b).map(function (x) { return x.toString(16).padStart(2, "0"); }).join(""); }
async function digest(bytes) { return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)); }
export async function sha(text) { return hex(await digest(new TextEncoder().encode(text))); }
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
function join(a, b) { const o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; }

// ---- CBOR (RFC 8949), the part WebAuthn uses: definite lengths only ----
export function cbor(bytes, at) {
  let p = at || 0;
  function need(n) { if (p + n > bytes.length) throw new Error("cbor: short"); }
  function len(info) {
    if (info < 24) return info;
    if (info === 24) { need(1); return bytes[p++]; }
    if (info === 25) { need(2); const v = (bytes[p] << 8) | bytes[p + 1]; p += 2; return v; }
    if (info === 26) { need(4); const v = ((bytes[p] << 24) >>> 0) + (bytes[p + 1] << 16) + (bytes[p + 2] << 8) + bytes[p + 3]; p += 4; return v; }
    if (info === 27) {
      need(8);
      let v = 0;
      for (let i = 0; i < 8; i++) v = v * 256 + bytes[p + i];
      p += 8;
      if (!Number.isSafeInteger(v)) throw new Error("cbor: too big");
      return v;
    }
    throw new Error("cbor: indefinite or reserved length");
  }
  function item(depth) {
    if (depth > 16) throw new Error("cbor: too deep");
    need(1);
    const ib = bytes[p++], major = ib >> 5, info = ib & 31;
    if (major === 0) return len(info);
    if (major === 1) return -1 - len(info);
    if (major === 2) { const n = len(info); need(n); const v = bytes.slice(p, p + n); p += n; return v; }
    if (major === 3) { const n = len(info); need(n); const v = new TextDecoder().decode(bytes.slice(p, p + n)); p += n; return v; }
    if (major === 4) { const n = len(info); if (n > 1000) throw new Error("cbor: long"); const a = []; for (let i = 0; i < n; i++) a.push(item(depth + 1)); return a; }
    if (major === 5) {
      const n = len(info); if (n > 1000) throw new Error("cbor: long");
      const m = new Map();
      for (let i = 0; i < n; i++) { const k = item(depth + 1); m.set(k, item(depth + 1)); }
      return m;
    }
    if (major === 6) { len(info); return item(depth + 1); }
    if (info === 20) return false;
    if (info === 21) return true;
    if (info === 22) return null;
    if (info === 23) return undefined;
    if (info === 25) { need(2); p += 2; return 0; } // half floats never matter here
    if (info === 26) { need(4); const v = new DataView(bytes.buffer, bytes.byteOffset + p, 4).getFloat32(0); p += 4; return v; }
    if (info === 27) { need(8); const v = new DataView(bytes.buffer, bytes.byteOffset + p, 8).getFloat64(0); p += 8; return v; }
    throw new Error("cbor: unknown simple value");
  }
  const value = item(0);
  return { value: value, end: p };
}

// ---- authenticator data (WebAuthn 6.1) ----
export function parseAuthData(b) {
  if (!(b instanceof Uint8Array) || b.length < 37) return null;
  const flags = b[32];
  const out = {
    rpIdHash: b.slice(0, 32),
    up: !!(flags & 1), uv: !!(flags & 4), at: !!(flags & 64), ed: !!(flags & 128),
    count: ((b[33] << 24) >>> 0) + (b[34] << 16) + (b[35] << 8) + b[36],
    credId: null, key: null
  };
  if (out.at) {
    if (b.length < 55) return null;
    const n = (b[53] << 8) | b[54];
    if (n < 16 || n > 1023 || b.length < 55 + n + 1) return null;
    out.credId = b.slice(55, 55 + n);
    try {
      const k = cbor(b, 55 + n);
      out.key = k.value;
      if (!out.ed && k.end !== b.length) return null;
    } catch (e) { return null; }
  }
  return out;
}

// a COSE key (RFC 9053) as a JWK WebCrypto can import, or null
export function coseToJwk(m) {
  if (!(m instanceof Map)) return null;
  const kty = m.get(1), alg = m.get(3);
  if (alg === -7 && kty === 2 && m.get(-1) === 1) {
    const x = m.get(-2), y = m.get(-3);
    if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== 32 || y.length !== 32) return null;
    return { alg: -7, jwk: { kty: "EC", crv: "P-256", x: b64u(x), y: b64u(y), ext: true } };
  }
  if (alg === -257 && kty === 3) {
    const n = m.get(-1), e = m.get(-2);
    if (!(n instanceof Uint8Array) || !(e instanceof Uint8Array) || n.length < 256 || n.length > 512 || e.length > 8) return null;
    return { alg: -257, jwk: { kty: "RSA", n: b64u(n), e: b64u(e), alg: "RS256", ext: true } };
  }
  return null;
}

// an ECDSA signature in DER (what authenticators send) as raw r || s
export function derToRaw(sig) {
  if (!(sig instanceof Uint8Array) || sig.length < 8 || sig[0] !== 0x30) return null;
  let p = 2;
  if (sig[1] & 0x80) p = 2 + (sig[1] & 0x7f);
  function int() {
    if (sig[p] !== 0x02) return null;
    const n = sig[p + 1];
    let v = sig.slice(p + 2, p + 2 + n);
    p += 2 + n;
    while (v.length > 32 && v[0] === 0) v = v.slice(1);
    if (v.length > 32) return null;
    const o = new Uint8Array(32); o.set(v, 32 - v.length);
    return o;
  }
  const r = int(); if (!r) return null;
  const s = int(); if (!s) return null;
  return join(r, s);
}

async function verifySig(alg, jwk, data, sig) {
  try {
    if (alg === -7) {
      const raw = derToRaw(sig);
      if (!raw) return false;
      const k = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, k, raw, data);
    }
    if (alg === -257) {
      const k = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", k, sig, data);
    }
  } catch (e) { return false; }
  return false;
}

// the client data (WebAuthn 5.8.1): type, challenge and origin, all checked
function clientData(b64, type, challenge, origins) {
  const raw = unb64u(b64);
  if (!raw || raw.length > 4096) return { error: "bad client data" };
  let c;
  try { c = JSON.parse(new TextDecoder().decode(raw)); } catch (e) { return { error: "bad client data" }; }
  if (!c || c.type !== type) return { error: "wrong kind of passkey request" };
  if (typeof c.challenge !== "string" || c.challenge !== challenge) return { error: "this sign-in has run out; try again" };
  if (origins.indexOf(c.origin) < 0 || c.crossOrigin === true) return { error: "not RAVI's page" };
  return { raw: raw };
}

// A new passkey. cred is the browser's answer, as account.js sends it.
export async function verifyRegistration(cred, challenge, rp) {
  if (!cred || typeof cred !== "object" || !cred.response || typeof cred.id !== "string") return { error: "bad passkey" };
  const cd = clientData(cred.response.clientDataJSON, "webauthn.create", challenge, rp.origins);
  if (cd.error) return cd;
  const ao = unb64u(cred.response.attestationObject);
  if (!ao || ao.length > 8192) return { error: "bad passkey" };
  let att;
  try { att = cbor(ao).value; } catch (e) { return { error: "bad passkey" }; }
  if (!(att instanceof Map) || !(att.get("authData") instanceof Uint8Array)) return { error: "bad passkey" };
  const ad = parseAuthData(att.get("authData"));
  if (!ad || !ad.at || !ad.credId || !ad.key) return { error: "bad passkey" };
  if (!same(ad.rpIdHash, await digest(new TextEncoder().encode(rp.id)))) return { error: "not RAVI's passkey" };
  if (!ad.up) return { error: "the passkey did not check you were there" };
  const key = coseToJwk(ad.key);
  if (!key) return { error: "this kind of passkey is not supported" };
  const id = b64u(ad.credId);
  if (id !== cred.id) return { error: "bad passkey" };
  return { id: id, alg: key.alg, jwk: key.jwk, count: ad.count };
}

// A sign-in with a passkey RAVI holds (stored: { alg, jwk, count }).
export async function verifyAssertion(cred, challenge, rp, stored) {
  if (!cred || typeof cred !== "object" || !cred.response) return { error: "bad passkey" };
  const cd = clientData(cred.response.clientDataJSON, "webauthn.get", challenge, rp.origins);
  if (cd.error) return cd;
  const adb = unb64u(cred.response.authenticatorData), sig = unb64u(cred.response.signature);
  if (!adb || !sig || adb.length > 4096 || sig.length > 1024) return { error: "bad passkey" };
  const ad = parseAuthData(adb);
  if (!ad) return { error: "bad passkey" };
  if (!same(ad.rpIdHash, await digest(new TextEncoder().encode(rp.id)))) return { error: "not RAVI's passkey" };
  if (!ad.up) return { error: "the passkey did not check you were there" };
  const ok = await verifySig(stored.alg, stored.jwk, join(adb, await digest(cd.raw)), sig);
  if (!ok) return { error: "that passkey did not match" };
  // a count that goes backwards means a copied key (passkeys that sync send 0 every time)
  if (ad.count > 0 && stored.count > 0 && ad.count <= stored.count) return { error: "this passkey looks copied; sign in with another or your recovery code" };
  return { count: ad.count };
}

// ---- recovery codes: 20 letters and digits in four groups, about 99 bits ----
export function newCode() {
  const b = rand(20);
  let s = "";
  for (let i = 0; i < 20; i++) { s += CODE_ABC[b[i] % 31]; if (i % 5 === 4 && i < 19) s += "-"; }
  return s; // b[i] % 31 leans a hair to the first 8 letters; 98 bits either way
}
export function cleanCode(v) {
  const s = typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1") : "";
  return /^[2-9A-HJKMNP-Z]{20}$/.test(s) ? s : null;
}

// ---- the profile ----
function cleanText(v, max) {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f\u2028\u2029\u202a-\u202e\u2066-\u2069<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}
export function cleanUser(v) {
  const u = typeof v === "string" ? v.trim().replace(/^@/, "").toLowerCase() : "";
  if (!/^[a-z0-9_]{3,20}$/.test(u)) return { error: "a username is 3 to 20 letters, numbers or _" };
  if (RESERVED.indexOf(u) >= 0) return { error: "@" + u + " is kept for RAVI; pick another" };
  return { u: u };
}
// a Riot ID as Riot writes it: a name of 3 to 16 letters, digits or spaces and a
// tag of 3 to 5 letters or digits; the key that makes it one (Riot IDs ignore case)
export function cleanRiot(n, tag) {
  const name = typeof n === "string" ? n.normalize("NFC").replace(/[\u0000-\u001f\u007f<>#]/g, "").replace(/\s+/g, " ").trim() : "";
  const t = typeof tag === "string" ? tag.trim().replace(/^#/, "") : "";
  if (name.length < 3 || name.length > 16 || !/^[\p{L}\p{N} ._]+$/u.test(name)) return { error: "a Riot name is 3 to 16 letters, numbers or spaces" };
  if (!/^[\p{L}\p{N}]{3,5}$/u.test(t)) return { error: "a Riot tag is the 3 to 5 letters or numbers after the #" };
  return { n: name, tag: t, k: name.toLowerCase().replace(/ /g, "") + "#" + t.toLowerCase() };
}
// a JPEG the phone made: its first and last markers, and a frame no bigger than 1024 square
export function checkJpeg(b) {
  if (!(b instanceof Uint8Array) || b.length < 200 || b.length > PHOTO_MAX) return false;
  if (b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff || b[b.length - 2] !== 0xff || b[b.length - 1] !== 0xd9) return false;
  let p = 2;
  while (p + 9 < b.length) {
    if (b[p] !== 0xff) return false;
    const m = b[p + 1], len = (b[p + 2] << 8) | b[p + 3];
    if (m >= 0xc0 && m <= 0xc3) {
      const h = (b[p + 5] << 8) | b[p + 6], w = (b[p + 7] << 8) | b[p + 8];
      return h > 0 && w > 0 && h <= 1024 && w <= 1024;
    }
    if (m === 0xda) return false; // pixels before any frame size
    p += 2 + len;
  }
  return false;
}

// ---- storage: SQLite in the Durable Object, plain lists in the tests ----
function sqlStore(sql) {
  sql.exec("CREATE TABLE IF NOT EXISTS acct (id TEXT PRIMARY KEY, uh TEXT, made INTEGER, code TEXT)");
  sql.exec("CREATE INDEX IF NOT EXISTS acct_code ON acct (code)");
  sql.exec("CREATE TABLE IF NOT EXISTS cred (id TEXT PRIMARY KEY, acct TEXT, alg INTEGER, jwk TEXT, count INTEGER, made INTEGER, last INTEGER)");
  sql.exec("CREATE INDEX IF NOT EXISTS cred_acct ON cred (acct)");
  sql.exec("CREATE TABLE IF NOT EXISTS sess (tok TEXT PRIMARY KEY, acct TEXT, made INTEGER, last INTEGER)");
  sql.exec("CREATE INDEX IF NOT EXISTS sess_acct ON sess (acct)");
  sql.exec("CREATE TABLE IF NOT EXISTS chal (c TEXT PRIMARY KEY, kind TEXT, acct TEXT, uh TEXT, exp INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS lim (key TEXT PRIMARY KEY, day TEXT, c INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS prof (acct TEXT PRIMARY KEY, name TEXT, user TEXT UNIQUE, about TEXT, pk TEXT, ph TEXT, pv INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS photo (acct TEXT PRIMARY KEY, img BLOB)");
  try { sql.exec("ALTER TABLE prof ADD COLUMN area TEXT"); } catch (e) { /* already there */ }
  sql.exec("CREATE TABLE IF NOT EXISTS riot (k TEXT PRIMARY KEY, acct TEXT UNIQUE, n TEXT, tag TEXT, at INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS disp (id TEXT PRIMARY KEY, k TEXT, acct TEXT, n TEXT, tag TEXT, at INTEGER, UNIQUE (k, acct))");
  function one(q) { const a = sql.exec.apply(sql, [q].concat(Array.prototype.slice.call(arguments, 1))).toArray(); return a[0] || null; }
  return {
    acct: (id) => one("SELECT id, uh, made, code FROM acct WHERE id = ?", id),
    acctByCode: (code) => one("SELECT id, uh, made, code FROM acct WHERE code = ?", code),
    putAcct: (a) => sql.exec("INSERT OR REPLACE INTO acct VALUES (?, ?, ?, ?)", a.id, a.uh, a.made, a.code),
    cred: (id) => { const c = one("SELECT id, acct, alg, jwk, count, made, last FROM cred WHERE id = ?", id); if (c) c.jwk = JSON.parse(c.jwk); return c; },
    creds: (acct) => sql.exec("SELECT id, made, last FROM cred WHERE acct = ? ORDER BY made", acct).toArray(),
    putCred: (c) => sql.exec("INSERT OR REPLACE INTO cred VALUES (?, ?, ?, ?, ?, ?, ?)", c.id, c.acct, c.alg, JSON.stringify(c.jwk), c.count, c.made, c.last),
    sess: (tok) => one("SELECT tok, acct, made, last FROM sess WHERE tok = ?", tok),
    putSess: (s) => sql.exec("INSERT OR REPLACE INTO sess VALUES (?, ?, ?, ?)", s.tok, s.acct, s.made, s.last),
    delSess: (tok) => sql.exec("DELETE FROM sess WHERE tok = ?", tok),
    takeChal: (c) => { const x = one("SELECT c, kind, acct, uh, exp FROM chal WHERE c = ?", c); if (x) sql.exec("DELETE FROM chal WHERE c = ?", c); return x; },
    putChal: (x) => sql.exec("INSERT OR REPLACE INTO chal VALUES (?, ?, ?, ?, ?)", x.c, x.kind, x.acct, x.uh, x.exp),
    prof: (acct) => one("SELECT acct, name, user, about, pk, ph, pv, area FROM prof WHERE acct = ?", acct),
    profByUser: (u) => one("SELECT acct FROM prof WHERE user = ?", u),
    putProf: (x) => sql.exec("INSERT OR REPLACE INTO prof (acct, name, user, about, pk, ph, pv, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", x.acct, x.name, x.user, x.about, x.pk, x.ph, x.pv, x.area || null),
    riotOf: (acct) => one("SELECT k, acct, n, tag, at FROM riot WHERE acct = ?", acct),
    riotByKey: (k) => one("SELECT k, acct, n, tag, at FROM riot WHERE k = ?", k),
    putRiot: (x) => { sql.exec("DELETE FROM riot WHERE acct = ?", x.acct); sql.exec("INSERT INTO riot VALUES (?, ?, ?, ?, ?)", x.k, x.acct, x.n, x.tag, x.at); },
    delRiot: (acct) => sql.exec("DELETE FROM riot WHERE acct = ?", acct),
    disps: () => sql.exec("SELECT id, k, acct, n, tag, at FROM disp ORDER BY at").toArray(),
    disp: (id) => one("SELECT id, k, acct, n, tag, at FROM disp WHERE id = ?", id),
    putDisp: (x) => sql.exec("INSERT OR REPLACE INTO disp VALUES (?, ?, ?, ?, ?, ?)", x.id, x.k, x.acct, x.n, x.tag, x.at),
    delDisp: (id) => sql.exec("DELETE FROM disp WHERE id = ?", id),
    photo: (acct) => { const x = one("SELECT img FROM photo WHERE acct = ?", acct); return x ? new Uint8Array(x.img) : null; },
    putPhoto: (acct, img) => sql.exec("INSERT OR REPLACE INTO photo VALUES (?, ?)", acct, img.buffer.slice(img.byteOffset, img.byteOffset + img.byteLength)),
    delPhoto: (acct) => sql.exec("DELETE FROM photo WHERE acct = ?", acct),
    delAcct: (id) => {
      sql.exec("DELETE FROM riot WHERE acct = ?", id);
      sql.exec("DELETE FROM disp WHERE acct = ?", id);
      sql.exec("DELETE FROM prof WHERE acct = ?", id);
      sql.exec("DELETE FROM photo WHERE acct = ?", id);
      sql.exec("DELETE FROM cred WHERE acct = ?", id);
      sql.exec("DELETE FROM sess WHERE acct = ?", id);
      sql.exec("DELETE FROM chal WHERE acct = ?", id);
      sql.exec("DELETE FROM acct WHERE id = ?", id);
    },
    used: (key, day) => { const x = one("SELECT day, c FROM lim WHERE key = ?", key); return x && x.day === day ? x.c : 0; },
    use: (key, day, c) => sql.exec("INSERT OR REPLACE INTO lim VALUES (?, ?, ?)", key, day, c),
    prune: (now, sessCut, day) => {
      sql.exec("DELETE FROM chal WHERE exp < ?", now);
      sql.exec("DELETE FROM sess WHERE last < ?", sessCut);
      sql.exec("DELETE FROM lim WHERE day <> ?", day);
    }
  };
}
export function memStore() {
  const T = { acct: new Map(), cred: new Map(), sess: new Map(), chal: new Map(), lim: new Map(), prof: new Map(), photo: new Map(), riot: new Map(), disp: new Map() };
  function copy(x) { return x ? JSON.parse(JSON.stringify(x)) : null; }
  return {
    tables: T, // the tests read every row from here
    acct: (id) => copy(T.acct.get(id)),
    acctByCode: (code) => { let f = null; T.acct.forEach((a) => { if (a.code === code) f = a; }); return copy(f); },
    putAcct: (a) => T.acct.set(a.id, copy(a)),
    cred: (id) => copy(T.cred.get(id)),
    creds: (acct) => Array.from(T.cred.values()).filter((c) => c.acct === acct).sort((a, b) => a.made - b.made).map((c) => ({ id: c.id, made: c.made, last: c.last })),
    putCred: (c) => T.cred.set(c.id, copy(c)),
    sess: (tok) => copy(T.sess.get(tok)),
    putSess: (s) => T.sess.set(s.tok, copy(s)),
    delSess: (tok) => T.sess.delete(tok),
    takeChal: (c) => { const x = copy(T.chal.get(c)); T.chal.delete(c); return x; },
    putChal: (x) => T.chal.set(x.c, copy(x)),
    prof: (acct) => copy(T.prof.get(acct)),
    profByUser: (u) => { let f = null; T.prof.forEach((x) => { if (x.user === u) f = { acct: x.acct }; }); return f; },
    putProf: (x) => {
      let clash = false; T.prof.forEach((y) => { if (x.user && y.user === x.user && y.acct !== x.acct) clash = true; });
      if (clash) throw new Error("UNIQUE constraint failed: prof.user");
      T.prof.set(x.acct, copy(x));
    },
    riotOf: (acct) => { let f = null; T.riot.forEach((x) => { if (x.acct === acct) f = x; }); return copy(f); },
    riotByKey: (k) => copy(T.riot.get(k)),
    putRiot: (x) => {
      T.riot.forEach((y, k) => { if (y.acct === x.acct) T.riot.delete(k); });
      if (T.riot.has(x.k)) throw new Error("UNIQUE constraint failed: riot.k");
      T.riot.set(x.k, copy(x));
    },
    delRiot: (acct) => T.riot.forEach((y, k) => { if (y.acct === acct) T.riot.delete(k); }),
    disps: () => Array.from(T.disp.values()).sort((a, b) => a.at - b.at).map(copy),
    disp: (id) => copy(T.disp.get(id)),
    putDisp: (x) => { T.disp.forEach((y, k) => { if (y.k === x.k && y.acct === x.acct) T.disp.delete(k); }); T.disp.set(x.id, copy(x)); },
    delDisp: (id) => T.disp.delete(id),
    photo: (acct) => T.photo.has(acct) ? new Uint8Array(T.photo.get(acct)) : null,
    putPhoto: (acct, img) => T.photo.set(acct, new Uint8Array(img)),
    delPhoto: (acct) => T.photo.delete(acct),
    delAcct: (id) => {
      T.prof.delete(id); T.photo.delete(id);
      T.riot.forEach((y, k) => { if (y.acct === id) T.riot.delete(k); });
      T.disp.forEach((y, k) => { if (y.acct === id) T.disp.delete(k); });
      ["cred", "sess"].forEach((t) => T[t].forEach((v, k) => { if (v.acct === id) T[t].delete(k); }));
      T.chal.forEach((v, k) => { if (v.acct === id) T.chal.delete(k); });
      T.acct.delete(id);
    },
    used: (key, day) => { const x = T.lim.get(key); return x && x.day === day ? x.c : 0; },
    use: (key, day, c) => T.lim.set(key, { day: day, c: c }),
    prune: (now, sessCut, day) => {
      T.chal.forEach((v, k) => { if (v.exp < now) T.chal.delete(k); });
      T.sess.forEach((v, k) => { if (v.last < sessCut) T.sess.delete(k); });
      T.lim.forEach((v, k) => { if (v.day !== day) T.lim.delete(k); });
    }
  };
}

function reply(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
function dayOf(t) { return new Date(t).toISOString().slice(0, 10); }

export function makeAccounts() {
  return class Accounts {
    constructor(state, env) {
      this.state = state;
      this.env = env || {};
      this.db = state.db || sqlStore(state.storage.sql);
      this.now = state.now || (() => Date.now());
      this.rp = state.rp || { id: RP_ID, origins: ORIGINS };
    }
    // a day's allowance per connection; true while there is some left
    async spend(what, ip) {
      const day = dayOf(this.now()), key = what + ":" + (await sha(String(ip || "") + "|" + day));
      const c = this.db.used(key, day);
      if (c >= LIMITS[what]) return false;
      this.db.use(key, day, c + 1);
      return true;
    }
    // the signed-in account from "Authorization: Bearer <token>", or null
    async who(req) {
      const m = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.get("Authorization") || "");
      if (!m) return null;
      const s = this.db.sess(await sha(m[1]));
      if (!s || this.now() - s.last > SESSION_DAYS * DAY) return null;
      const a = this.db.acct(s.acct);
      if (!a) return null;
      if (dayOf(s.last) !== dayOf(this.now())) { s.last = this.now(); this.db.putSess(s); } // touched once a day, not every call
      return { acct: a, tok: s.tok };
    }
    view(a) {
      const p = this.db.prof(a.id);
      const pic = p && p.pk === "l" && p.ph ? { k: "l", h: p.ph } : p && p.pk === "p" ? { k: "p", v: p.pv } : null;
      const r = this.db.riotOf(a.id);
      const mine = this.db.disps().filter((d) => d.acct === a.id).map((d) => ({ n: d.n, tag: d.tag, at: dayOf(d.at) }));
      const out = { v: 1, id: a.id, made: dayOf(a.made), keys: this.db.creds(a.id).map((c) => ({ made: dayOf(c.made), last: dayOf(c.last) })),
        name: p && p.name || "", user: p && p.user || "", about: p && p.about || "", area: p && p.area || "", pic: pic,
        riot: r ? { n: r.n, tag: r.tag } : null, asked: mine };
      if (this.isAdmin(a.id)) { out.admin = true; out.disputes = this.db.disps().length; }
      return out;
    }
    isAdmin(id) { return String(this.env.ADMIN || "").split(/[\s,]+/).indexOf(id) >= 0; }
    profOf(id) { return this.db.prof(id) || { acct: id, name: "", user: null, about: "", pk: null, ph: null, pv: 0, area: null }; }
    who2(acct) { const p = this.db.prof(acct); return { user: p && p.user || "", name: p && p.name || "" }; }
    async session(acctId) {
      const t = b64u(rand(32)), now = this.now();
      this.db.putSess({ tok: await sha(t), acct: acctId, made: now, last: now });
      return t;
    }
    async fetch(req) {
      const u = new URL(req.url), ip = req.headers.get("X-Ravi-Ip") || "", now = this.now();
      this.db.prune(now, now - SESSION_DAYS * DAY, dayOf(now));
      const me = await this.who(req);
      if (req.method === "GET" && u.pathname === "/admin/disputes") {
        if (!me || !this.isAdmin(me.acct.id)) return reply({ error: "not allowed" }, 403);
        return reply({ v: 1, disputes: this.db.disps().map((d) => {
          const held = this.db.riotByKey(d.k);
          // the Riot ID as its holder wrote it (Riot IDs ignore case); the asker's own spelling is kept if it is given to them
          return { id: d.id, riot: held ? held.n + "#" + held.tag : d.n + "#" + d.tag, at: dayOf(d.at), asker: this.who2(d.acct),
            holder: held ? Object.assign(this.who2(held.acct), { since: dayOf(held.at) }) : null };
        }) });
      }
      if (req.method === "GET") {
        const pm = /^\/pic\/([0-9a-f]{24})$/.exec(u.pathname);
        if (pm) {
          const img = this.db.photo(pm[1]);
          if (!img) return reply({ error: "no picture" }, 404);
          return new Response(img, { headers: { "Content-Type": "image/jpeg" } });
        }
        if (u.pathname === "/me") return me ? reply(this.view(me.acct)) : reply({ error: "signed out" }, 401);
        return reply({ error: "not found" }, 404);
      }
      if (req.method !== "POST") return reply({ error: "not allowed" }, 405);
      let body = {};
      try { body = JSON.parse((await req.text()) || "{}") || {}; } catch (e) { return reply({ error: "bad request" }, 400); }
      if (typeof body !== "object") return reply({ error: "bad request" }, 400);
      const p = u.pathname;

      if (p === "/reg/options" || p === "/auth/options") {
        if (!(await this.spend("opt", ip))) return reply({ error: "too many tries today; try again tomorrow" }, 429);
        const c = b64u(rand(32));
        if (p === "/auth/options") {
          this.db.putChal({ c: c, kind: "get", acct: null, uh: null, exp: now + CHALLENGE_MS });
          return reply({ challenge: c, rpId: this.rp.id, timeout: CHALLENGE_MS - 30000 });
        }
        // a passkey for a new account, or another one for the signed-in account
        const uh = me ? me.acct.uh : b64u(rand(16));
        const have = me ? this.db.creds(me.acct.id).map((x) => x.id) : [];
        if (me && have.length >= KEYS_MAX) return reply({ error: "this account has " + KEYS_MAX + " passkeys already" }, 409);
        this.db.putChal({ c: c, kind: "create", acct: me ? me.acct.id : null, uh: uh, exp: now + CHALLENGE_MS });
        return reply({ challenge: c, rp: { id: this.rp.id, name: "RAVI" }, user: uh, algs: ALGS, exclude: have, timeout: CHALLENGE_MS - 30000 });
      }

      if (p === "/reg/verify" || p === "/auth/verify") {
        const ch = typeof body.challenge === "string" && body.challenge.length < 100 ? this.db.takeChal(body.challenge) : null;
        const kind = p === "/reg/verify" ? "create" : "get";
        if (!ch || ch.kind !== kind || ch.exp < now) return reply({ error: "this sign-in has run out; try again" }, 400);
        if (kind === "get") {
          const id = body.cred && typeof body.cred.id === "string" ? body.cred.id : "";
          const stored = id.length < 1400 ? this.db.cred(id) : null;
          if (!stored) return reply({ error: "RAVI does not know this passkey; its account may have been deleted" }, 404);
          const r = await verifyAssertion(body.cred, ch.c, this.rp, stored);
          if (r.error) return reply({ error: r.error }, 400);
          const a = this.db.acct(stored.acct);
          if (!a) return reply({ error: "RAVI does not know this passkey; its account may have been deleted" }, 404);
          stored.count = r.count; stored.last = now;
          this.db.putCred(stored);
          return reply({ token: await this.session(a.id), account: this.view(a) });
        }
        const r = await verifyRegistration(body.cred, ch.c, this.rp);
        if (r.error) return reply({ error: r.error }, 400);
        if (this.db.cred(r.id)) return reply({ error: "this passkey is already on an account" }, 409);
        if (ch.acct) {
          const a = this.db.acct(ch.acct);
          if (!a || !me || me.acct.id !== a.id) return reply({ error: "signed out" }, 401);
          this.db.putCred({ id: r.id, acct: a.id, alg: r.alg, jwk: r.jwk, count: r.count, made: now, last: now });
          return reply({ account: this.view(a) });
        }
        if (!(await this.spend("made", ip))) return reply({ error: "too many new accounts from this connection today; try again tomorrow" }, 429);
        const code = newCode();
        const a = { id: hex(rand(12)), uh: ch.uh, made: now, code: await sha(cleanCode(code)) };
        this.db.putAcct(a);
        this.db.putCred({ id: r.id, acct: a.id, alg: r.alg, jwk: r.jwk, count: r.count, made: now, last: now });
        return reply({ token: await this.session(a.id), recovery: code, account: this.view(a) });
      }

      if (p === "/recover") {
        if (!(await this.spend("code", ip))) return reply({ error: "too many tries today; try again tomorrow" }, 429);
        const c = cleanCode(body.code);
        const a = c ? this.db.acctByCode(await sha(c)) : null;
        if (!a) return reply({ error: "that code does not match an account" }, 404);
        const code = newCode(); // a used code is spent; the new one replaces it
        a.code = await sha(cleanCode(code));
        this.db.putAcct(a);
        return reply({ token: await this.session(a.id), recovery: code, account: this.view(a) });
      }

      if (!me) return reply({ error: "signed out" }, 401);
      if (p === "/code") {
        const code = newCode();
        me.acct.code = await sha(cleanCode(code));
        this.db.putAcct(me.acct);
        return reply({ recovery: code, account: this.view(me.acct) });
      }
      if (p === "/profile") {
        if (!(await this.spend("prof", ip))) return reply({ error: "too many changes today; try again tomorrow" }, 429);
        const x = this.profOf(me.acct.id);
        x.name = cleanText(body.name, 32);
        x.about = cleanText(body.about, 80);
        if (body.user === "" || body.user === null) x.user = null;
        else {
          const c = cleanUser(body.user);
          if (c.error) return reply({ error: c.error }, 400);
          const owner = this.db.profByUser(c.u);
          if (owner && owner.acct !== me.acct.id) return reply({ error: "@" + c.u + " is taken; pick another" }, 409);
          x.user = c.u;
        }
        try { this.db.putProf(x); } catch (e) { return reply({ error: "that username was just taken; pick another" }, 409); }
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/pic") {
        if (!(await this.spend("prof", ip))) return reply({ error: "too many changes today; try again tomorrow" }, 429);
        const x = this.profOf(me.acct.id);
        if (body.k === "l") {
          if (typeof body.h !== "string" || !/^[0-9a-f]{40}$/.test(body.h)) return reply({ error: "not a legend picture" }, 400);
          x.pk = "l"; x.ph = body.h; this.db.delPhoto(me.acct.id);
        } else if (body.k === null) { x.pk = null; x.ph = null; this.db.delPhoto(me.acct.id); }
        else return reply({ error: "bad request" }, 400);
        this.db.putProf(x);
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/photo") {
        if (!(await this.spend("photo", ip))) return reply({ error: "too many pictures today; try again tomorrow" }, 429);
        const img = typeof body.jpg === "string" && body.jpg.length < PHOTO_MAX * 1.4 ? unb64u(body.jpg) : null;
        if (!img || !checkJpeg(img)) return reply({ error: "that picture could not be used; try another" }, 400);
        const x = this.profOf(me.acct.id);
        this.db.putPhoto(me.acct.id, img);
        x.pk = "p"; x.ph = null; x.pv = now;
        this.db.putProf(x);
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/area") {
        if (!(await this.spend("prof", ip))) return reply({ error: "too many changes today; try again tomorrow" }, 429);
        if (body.area !== null && AREAS.indexOf(body.area) < 0) return reply({ error: "not an area RAVI knows" }, 400);
        const x = this.profOf(me.acct.id);
        x.area = body.area;
        this.db.putProf(x);
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/riot") {
        if (!(await this.spend("prof", ip))) return reply({ error: "too many changes today; try again tomorrow" }, 429);
        if (body.off === true) { this.db.delRiot(me.acct.id); return reply({ account: this.view(me.acct) }); }
        const c = cleanRiot(body.n, body.tag);
        if (c.error) return reply({ error: c.error }, 400);
        const held = this.db.riotByKey(c.k);
        if (held && held.acct !== me.acct.id) return reply({ error: c.n + "#" + c.tag + " is claimed by another RAVI account", taken: true }, 409);
        try { this.db.putRiot({ k: c.k, acct: me.acct.id, n: c.n, tag: c.tag, at: held ? held.at : now }); }
        catch (e) { return reply({ error: c.n + "#" + c.tag + " was just claimed by another RAVI account", taken: true }, 409); }
        // a dispute this account raised over the same Riot ID is settled by the claim
        this.db.disps().forEach((d) => { if (d.acct === me.acct.id && d.k === c.k) this.db.delDisp(d.id); });
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/riot/dispute") {
        const c = cleanRiot(body.n, body.tag);
        if (c.error) return reply({ error: c.error }, 400);
        const held = this.db.riotByKey(c.k);
        if (!held || held.acct === me.acct.id) return reply({ error: "nobody else holds " + c.n + "#" + c.tag + "; claim it" }, 409);
        if (!(await this.spend("disp", ip))) return reply({ error: "too many disputes today; try again tomorrow" }, 429);
        this.db.putDisp({ id: hex(rand(8)), k: c.k, acct: me.acct.id, n: c.n, tag: c.tag, at: now });
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/admin/decide") {
        if (!this.isAdmin(me.acct.id)) return reply({ error: "not allowed" }, 403);
        const d = typeof body.id === "string" ? this.db.disp(body.id) : null;
        if (!d) return reply({ error: "that dispute is already settled" }, 404);
        if (body.give === true) {
          this.db.delRiot(d.acct);
          const held = this.db.riotByKey(d.k);
          if (held) this.db.delRiot(held.acct);
          this.db.putRiot({ k: d.k, acct: d.acct, n: d.n, tag: d.tag, at: now });
        }
        this.db.disps().forEach((x) => { if (x.k === d.k && (body.give === true || x.id === d.id)) this.db.delDisp(x.id); });
        return reply({ ok: true, left: this.db.disps().length });
      }
      if (p === "/out") { this.db.delSess(me.tok); return reply({ ok: true }); }
      if (p === "/delete") { this.db.delAcct(me.acct.id); return reply({ ok: true }); }
      return reply({ error: "not found" }, 404);
    }
  };
}
