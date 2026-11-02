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
// any dispute they raised over one; per passkey a name the player gives it,
// per signed-in phone a coarse device name (iPhone, Android, Computer).
// Delete removes every row of the account at once.
//
// GUEST ACCOUNTS (Mako 2026-10-31): every phone gets an account on its first
// open, with no passkey and no prompt (POST /guest). Save your account adds
// a passkey and a recovery code; until then the account is a guest, which
// only that phone's token reaches. Signing in to another account from a
// guest moves the guest into it (its name, picture, username and Riot ID
// fill the other account's gaps) and removes the guest. A guest never saved
// and unused for GUEST_DAYS is deleted, which frees its Riot ID and username.
//
// SYNC (Mako 2026-10-31): the phone's stores (SYNC_KEYS), each split into
// items by the phone (account.js, SYNC), kept here as text the server never
// reads: per item its store, id, edit time and a running number for "what
// changed since". The newest edit of an item wins; a deleted item is kept as
// a mark for SYNC.keepGone days so the delete reaches every phone. Kept in
// this same object, so delete and the guest's move take its items at once
// (one object per account was the first plan; one object needs no calls
// between objects on the free plan, and can be split later).
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

import { BOARD_KEYS, rowsFrom, boardFor, handleOf } from "./board.js";
import { OFFER, settingsFrom, cleanLines, holds, cleanCash, shapeOf, fits, settle, live, newOffer, cleanEvent, viewOf } from "./offers.js";
import { REPORT, BLOCK, cleanWhy, closeFor, queueOf } from "./reports.js";

export const RP_ID = "ravi.tools";
export const ORIGINS = ["https://ravi.tools"];
export const CHALLENGE_MS = 5 * 60000;
export const SESSION_DAYS = 180;
export const KEYS_MAX = 10;
export const SYNC_KEYS = ["vir.decks.v1", "vir.coll.v1", "vir.counter.history.v1", "vir.trade.v1", "vir.trade.log.v1", "vir.follow.v1", "vir.hub.blocks.v1", "vir.hub.open.v1", "vir.board.v1"]; // vir.board.v1: what you share on the Trade board (plan 2 M2)
// an item's text at most, an account's whole text, its items, items per call, items per answer, calls a day, days a delete is kept
export const SYNC = { item: 262144, total: 5000000, items: 4000, put: 200, page: 300, day: 5000, keepGone: 120,
  guestTotal: 2000000 }; // an account never saved holds less (the security check, Mako's yes 2026-10-31: many throwaway guests must not fill the free plan)
// per connection per day, unless named per account. riot: Riot ID claims, so throwaway guests can't
// sweep up popular Riot IDs; synccall and syncw: sync calls and items written, so one connection
// can't spend the free plan's writes for everyone (the security check, Mako's yes 2026-10-31)
export const LIMITS = { opt: 300, made: 30, code: 20, prof: 200, photo: 30, disp: 5, guest: 200, riot: 20, sync: SYNC.day, synccall: 6000, syncw: 20000, board: 1500, offers: 3000, offer: 300, offersend: 60, report: 10, block: 100 }; // offersend: per account (Trade board offers, plan 2 M2 block 2); report, block: per account (block 3) // per connection per day (guest: a store's wifi)
export const GUEST_DAYS = 90;
export const DEVS = ["iPhone", "iPad", "Android", "Mac", "Windows", "Computer"]; // the only device names kept
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
// max: the longest text taken (a passkey's parts by default; a photo passes its own)
export function unb64u(text, max) {
  if (typeof text !== "string" || !/^[A-Za-z0-9_-]*$/.test(text) || text.length > (max || 20000)) return null;
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
// a device name the phone gives: one of DEVS, or Computer
export function cleanDev(v) { return DEVS.indexOf(v) >= 0 ? v : "Computer"; }
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
// how a legend's art sits in the circle: x and y place it (0 to 100, as CSS
// background-position), z is how many circle-widths wide the card is drawn
// (1 to 4). Player-set by dragging and pinching (Mako 2026-10-31).
export function cleanCrop(c) {
  if (!c || typeof c !== "object") return null;
  const x = +c.x, y = +c.y, z = +c.z;
  if (![x, y, z].every(isFinite) || x < 0 || x > 100 || y < 0 || y > 100 || z < 1 || z > 4) return null;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, z: Math.round(z * 100) / 100 };
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
  try { sql.exec("ALTER TABLE prof ADD COLUMN pcrop TEXT"); } catch (e) { /* already there */ }
  sql.exec("CREATE TABLE IF NOT EXISTS riot (k TEXT PRIMARY KEY, acct TEXT UNIQUE, n TEXT, tag TEXT, at INTEGER)");
  sql.exec("CREATE TABLE IF NOT EXISTS disp (id TEXT PRIMARY KEY, k TEXT, acct TEXT, n TEXT, tag TEXT, at INTEGER, UNIQUE (k, acct))");
  try { sql.exec("ALTER TABLE acct ADD COLUMN guest INTEGER"); } catch (e) { /* already there */ }
  try { sql.exec("ALTER TABLE cred ADD COLUMN name TEXT"); } catch (e) { /* already there */ }
  try { sql.exec("ALTER TABLE sess ADD COLUMN dev TEXT"); } catch (e) { /* already there */ }
  sql.exec("CREATE TABLE IF NOT EXISTS item (acct TEXT, k TEXT, id TEXT, t INTEGER, d TEXT, s INTEGER, PRIMARY KEY (acct, k, id))");
  sql.exec("CREATE INDEX IF NOT EXISTS item_s ON item (acct, s)");
  // the Trade board (board.js, plan 2 M2): an account's have (h) and want (w) rows, pub 1 when others may see them
  sql.exec("CREATE TABLE IF NOT EXISTS board (acct TEXT, s TEXT, i INTEGER, f TEXT, q INTEGER, pub INTEGER, PRIMARY KEY (acct, s, i, f))");
  sql.exec("CREATE INDEX IF NOT EXISTS board_si ON board (s, i)");
  sql.exec("CREATE TABLE IF NOT EXISTS bh (h TEXT PRIMARY KEY, acct TEXT UNIQUE)");
  // offers (offers.js): a sends, b answers; d the cards and cash; ma, mb where each meets; da, dbb each marked done
  sql.exec("CREATE TABLE IF NOT EXISTS offer (id TEXT PRIMARY KEY, a TEXT, b TEXT, st TEXT, d TEXT, made INTEGER, upd INTEGER, exp INTEGER, re TEXT, ma TEXT, mb TEXT, da INTEGER, dbb INTEGER)");
  sql.exec("CREATE INDEX IF NOT EXISTS offer_a ON offer (a)");
  sql.exec("CREATE INDEX IF NOT EXISTS offer_b ON offer (b)");
  sql.exec("CREATE TABLE IF NOT EXISTS bset (acct TEXT PRIMARY KEY, open TEXT, pct INTEGER)");
  // report and block (reports.js, block 3): one report per reporter per player; who blocked whom; Mako's calls on a player
  sql.exec("CREATE TABLE IF NOT EXISTS rep (by TEXT, who TEXT, why TEXT, at INTEGER, PRIMARY KEY (by, who))");
  sql.exec("CREATE INDEX IF NOT EXISTS rep_who ON rep (who)");
  sql.exec("CREATE TABLE IF NOT EXISTS blk (by TEXT, who TEXT, at INTEGER, PRIMARY KEY (by, who))");
  sql.exec("CREATE INDEX IF NOT EXISTS blk_who ON blk (who)");
  sql.exec("CREATE TABLE IF NOT EXISTS modr (acct TEXT PRIMARY KEY, off INTEGER, pich INTEGER, at INTEGER)");
  function one(q) { const a = sql.exec.apply(sql, [q].concat(Array.prototype.slice.call(arguments, 1))).toArray(); return a[0] || null; }
  return {
    acct: (id) => one("SELECT id, uh, made, code, guest FROM acct WHERE id = ?", id),
    acctByCode: (code) => one("SELECT id, uh, made, code, guest FROM acct WHERE code = ?", code),
    putAcct: (a) => sql.exec("INSERT OR REPLACE INTO acct (id, uh, made, code, guest) VALUES (?, ?, ?, ?, ?)", a.id, a.uh, a.made, a.code || null, a.guest ? 1 : 0),
    cred: (id) => { const c = one("SELECT id, acct, alg, jwk, count, made, last, name FROM cred WHERE id = ?", id); if (c) c.jwk = JSON.parse(c.jwk); return c; },
    creds: (acct) => sql.exec("SELECT id, name, made, last FROM cred WHERE acct = ? ORDER BY made", acct).toArray(),
    credsFull: (acct) => sql.exec("SELECT id, alg, jwk, name, made, last FROM cred WHERE acct = ? ORDER BY made", acct).toArray().map((c) => Object.assign(c, { jwk: JSON.parse(c.jwk) })),
    putCred: (c) => sql.exec("INSERT OR REPLACE INTO cred (id, acct, alg, jwk, count, made, last, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", c.id, c.acct, c.alg, JSON.stringify(c.jwk), c.count, c.made, c.last, c.name || null),
    delCred: (id) => sql.exec("DELETE FROM cred WHERE id = ?", id),
    sess: (tok) => one("SELECT tok, acct, made, last, dev FROM sess WHERE tok = ?", tok),
    sessions: (acct) => sql.exec("SELECT tok, made, last, dev FROM sess WHERE acct = ? ORDER BY made", acct).toArray(),
    putSess: (s) => sql.exec("INSERT OR REPLACE INTO sess (tok, acct, made, last, dev) VALUES (?, ?, ?, ?, ?)", s.tok, s.acct, s.made, s.last, s.dev || null),
    delSess: (tok) => sql.exec("DELETE FROM sess WHERE tok = ?", tok),
    item: (acct, k, id) => one("SELECT k, id, t, d, s FROM item WHERE acct = ? AND k = ? AND id = ?", acct, k, id),
    items: (acct, since, max) => sql.exec("SELECT k, id, t, d, s FROM item WHERE acct = ? AND s > ? ORDER BY s LIMIT ?", acct, since, max).toArray(),
    allItems: (acct) => sql.exec("SELECT k, id, t, d FROM item WHERE acct = ? AND d IS NOT NULL ORDER BY k, id", acct).toArray(),
    putItem: (x) => sql.exec("INSERT OR REPLACE INTO item (acct, k, id, t, d, s) VALUES (?, ?, ?, ?, ?, ?)", x.acct, x.k, x.id, x.t, x.d, x.s),
    itemSize: (acct) => { const x = one("SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(d)), 0) AS b FROM item WHERE acct = ?", acct); return { n: x.n, b: x.b }; },
    maxSeq: () => one("SELECT COALESCE(MAX(s), 0) AS s FROM item").s,
    purgeGone: (cut) => sql.exec("DELETE FROM item WHERE d IS NULL AND t < ?", cut),
    boardItems: (acct) => sql.exec("SELECT k, id, d FROM item WHERE acct = ? AND d IS NOT NULL AND k IN ('vir.coll.v1', 'vir.board.v1')", acct).toArray(),
    putBoard: (acct, rows) => { sql.exec("DELETE FROM board WHERE acct = ?", acct); rows.forEach((r) => sql.exec("INSERT OR REPLACE INTO board VALUES (?, ?, ?, ?, ?, ?)", acct, r.s, r.i, r.f, r.q, r.pub)); },
    boardRows: (acct) => sql.exec("SELECT s, i, f, q, pub FROM board WHERE acct = ?", acct).toArray(),
    boardMatch: (theirs, mine, me) => sql.exec("SELECT o.acct AS acct, o.i AS i, o.f AS f, o.q AS q FROM board o WHERE o.s = ? AND o.pub = 1 AND o.acct <> ? AND EXISTS (SELECT 1 FROM board m WHERE m.acct = ? AND m.s = ? AND m.i = o.i) LIMIT 6000", theirs, me, me, mine).toArray(),
    boardShared: (me, max) => sql.exec("SELECT acct, i, f, q FROM board WHERE s = 'h' AND pub = 1 AND acct <> ? ORDER BY acct LIMIT ?", me, max).toArray(),
    boardWanted: (me, max) => sql.exec("SELECT i, f, COUNT(*) AS n FROM board WHERE s = 'w' AND pub = 1 AND acct <> ? GROUP BY i, f ORDER BY n DESC LIMIT ?", me, max).toArray(),
    putHandle: (h, acct) => sql.exec("INSERT OR REPLACE INTO bh VALUES (?, ?)", h, acct),
    byHandle: (h) => { const x = one("SELECT acct FROM bh WHERE h = ?", h); return x ? x.acct : null; },
    bset: (acct) => one("SELECT open, pct FROM bset WHERE acct = ?", acct),
    putBset: (acct, x) => sql.exec("INSERT OR REPLACE INTO bset VALUES (?, ?, ?)", acct, x.open, x.pct),
    offer: (id) => one("SELECT * FROM offer WHERE id = ?", id),
    offersOf: (acct) => sql.exec("SELECT * FROM offer WHERE a = ? OR b = ? ORDER BY upd DESC LIMIT 400", acct, acct).toArray(),
    putOffer: (o) => sql.exec("INSERT OR REPLACE INTO offer (id, a, b, st, d, made, upd, exp, re, ma, mb, da, dbb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", o.id, o.a, o.b, o.st, o.d, o.made, o.upd, o.exp, o.re, o.ma, o.mb, o.da, o.dbb),
    pruneOffers: (cut) => sql.exec("DELETE FROM offer WHERE st NOT IN ('open', 'accepted') AND upd < ?", cut),
    reps: () => sql.exec("SELECT by, who, why, at FROM rep ORDER BY at").toArray(),
    repsOf: (who) => sql.exec("SELECT by, who, why, at FROM rep WHERE who = ?", who).toArray(),
    repsBy: (by) => sql.exec("SELECT by, who, why, at FROM rep WHERE by = ? ORDER BY at", by).toArray(),
    putRep: (x) => sql.exec("INSERT OR REPLACE INTO rep VALUES (?, ?, ?, ?)", x.by, x.who, x.why, x.at),
    delReps: (who, why) => why ? sql.exec("DELETE FROM rep WHERE who = ? AND why = ?", who, why) : sql.exec("DELETE FROM rep WHERE who = ?", who),
    pruneReps: (cut) => sql.exec("DELETE FROM rep WHERE at < ?", cut),
    blocks: (by) => sql.exec("SELECT by, who, at FROM blk WHERE by = ? ORDER BY at DESC", by).toArray(),
    blockers: (who) => sql.exec("SELECT by FROM blk WHERE who = ?", who).toArray().map((x) => x.by),
    putBlk: (x) => sql.exec("INSERT OR REPLACE INTO blk VALUES (?, ?, ?)", x.by, x.who, x.at),
    delBlk: (by, who) => sql.exec("DELETE FROM blk WHERE by = ? AND who = ?", by, who),
    mod: (acct) => one("SELECT off, pich, at FROM modr WHERE acct = ?", acct),
    putMod: (acct, x) => (x.off || x.pich) ? sql.exec("INSERT OR REPLACE INTO modr VALUES (?, ?, ?, ?)", acct, x.off ? 1 : 0, x.pich ? 1 : 0, x.at || 0) : sql.exec("DELETE FROM modr WHERE acct = ?", acct),
    offAccts: () => sql.exec("SELECT acct, at FROM modr WHERE off = 1 ORDER BY at DESC").toArray(),
    oldGuests: (cut, max) => sql.exec("SELECT id FROM acct WHERE guest = 1 AND made < ? AND NOT EXISTS (SELECT 1 FROM sess WHERE sess.acct = acct.id AND sess.last >= ?) AND NOT EXISTS (SELECT 1 FROM cred WHERE cred.acct = acct.id) LIMIT ?", cut, cut, max).toArray().map((x) => x.id),
    takeChal: (c) => { const x = one("SELECT c, kind, acct, uh, exp FROM chal WHERE c = ?", c); if (x) sql.exec("DELETE FROM chal WHERE c = ?", c); return x; },
    putChal: (x) => sql.exec("INSERT OR REPLACE INTO chal VALUES (?, ?, ?, ?, ?)", x.c, x.kind, x.acct, x.uh, x.exp),
    prof: (acct) => one("SELECT acct, name, user, about, pk, ph, pv, area, pcrop FROM prof WHERE acct = ?", acct),
    profByUser: (u) => one("SELECT acct FROM prof WHERE user = ?", u),
    putProf: (x) => sql.exec("INSERT OR REPLACE INTO prof (acct, name, user, about, pk, ph, pv, area, pcrop) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", x.acct, x.name, x.user, x.about, x.pk, x.ph, x.pv, x.area || null, x.pcrop || null),
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
      sql.exec("DELETE FROM item WHERE acct = ?", id);
      sql.exec("DELETE FROM board WHERE acct = ?", id);
      sql.exec("DELETE FROM bh WHERE acct = ?", id);
      sql.exec("DELETE FROM offer WHERE a = ? OR b = ?", id, id);
      sql.exec("DELETE FROM bset WHERE acct = ?", id);
      sql.exec("DELETE FROM rep WHERE by = ? OR who = ?", id, id);
      sql.exec("DELETE FROM blk WHERE by = ? OR who = ?", id, id);
      sql.exec("DELETE FROM modr WHERE acct = ?", id);
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
  const T = { acct: new Map(), cred: new Map(), sess: new Map(), chal: new Map(), lim: new Map(), prof: new Map(), photo: new Map(), riot: new Map(), disp: new Map(), item: new Map(), board: new Map(), bh: new Map(), offer: new Map(), bset: new Map(), rep: new Map(), blk: new Map(), modr: new Map() };
  const rk = (by, who) => by + "\n" + who;
  const ik = (a, k, id) => a + "\n" + k + "\n" + id;
  function copy(x) { return x ? JSON.parse(JSON.stringify(x)) : null; }
  return {
    tables: T, // the tests read every row from here
    acct: (id) => copy(T.acct.get(id)),
    acctByCode: (code) => { let f = null; T.acct.forEach((a) => { if (a.code === code) f = a; }); return copy(f); },
    putAcct: (a) => T.acct.set(a.id, copy(a)),
    cred: (id) => copy(T.cred.get(id)),
    creds: (acct) => Array.from(T.cred.values()).filter((c) => c.acct === acct).sort((a, b) => a.made - b.made).map((c) => ({ id: c.id, name: c.name || null, made: c.made, last: c.last })),
    credsFull: (acct) => Array.from(T.cred.values()).filter((c) => c.acct === acct).sort((a, b) => a.made - b.made).map((c) => copy({ id: c.id, alg: c.alg, jwk: c.jwk, name: c.name || null, made: c.made, last: c.last })),
    putCred: (c) => T.cred.set(c.id, copy(c)),
    delCred: (id) => T.cred.delete(id),
    sess: (tok) => copy(T.sess.get(tok)),
    sessions: (acct) => Array.from(T.sess.values()).filter((s) => s.acct === acct).sort((a, b) => a.made - b.made).map((s) => copy({ tok: s.tok, made: s.made, last: s.last, dev: s.dev || null })),
    putSess: (s) => T.sess.set(s.tok, copy(s)),
    delSess: (tok) => T.sess.delete(tok),
    item: (acct, k, id) => { const x = T.item.get(ik(acct, k, id)); return x ? copy({ k: x.k, id: x.id, t: x.t, d: x.d, s: x.s }) : null; },
    items: (acct, since, max) => Array.from(T.item.values()).filter((x) => x.acct === acct && x.s > since).sort((a, b) => a.s - b.s).slice(0, max).map((x) => copy({ k: x.k, id: x.id, t: x.t, d: x.d, s: x.s })),
    allItems: (acct) => Array.from(T.item.values()).filter((x) => x.acct === acct && x.d !== null).map((x) => copy({ k: x.k, id: x.id, t: x.t, d: x.d })),
    putItem: (x) => T.item.set(ik(x.acct, x.k, x.id), copy(x)),
    itemSize: (acct) => { let n = 0, b = 0; T.item.forEach((x) => { if (x.acct === acct) { n++; b += x.d ? x.d.length : 0; } }); return { n: n, b: b }; },
    maxSeq: () => { let m = 0; T.item.forEach((x) => { if (x.s > m) m = x.s; }); return m; },
    purgeGone: (cut) => T.item.forEach((x, key) => { if (x.d === null && x.t < cut) T.item.delete(key); }),
    boardItems: (acct) => Array.from(T.item.values()).filter((x) => x.acct === acct && x.d !== null && (x.k === "vir.coll.v1" || x.k === "vir.board.v1")).map((x) => copy({ k: x.k, id: x.id, d: x.d })),
    putBoard: (acct, rows) => { T.board.set(acct, rows.map(copy)); },
    boardRows: (acct) => (T.board.get(acct) || []).map((r) => ({ s: r.s, i: r.i, f: r.f, q: r.q, pub: r.pub })),
    boardMatch: (theirs, mine, me) => { const ids = new Set((T.board.get(me) || []).filter((r) => r.s === mine).map((r) => r.i)), out = [];
      T.board.forEach((rows, acct) => { if (acct !== me) rows.forEach((r) => { if (r.s === theirs && r.pub === 1 && ids.has(r.i)) out.push({ acct: acct, i: r.i, f: r.f, q: r.q }); }); });
      return out.slice(0, 6000); },
    boardShared: (me, max) => { const out = []; Array.from(T.board.keys()).sort().forEach((acct) => { if (acct !== me) T.board.get(acct).forEach((r) => { if (r.s === "h" && r.pub === 1) out.push({ acct: acct, i: r.i, f: r.f, q: r.q }); }); }); return out.slice(0, max); },
    boardWanted: (me, max) => { const m = new Map(); T.board.forEach((rows, acct) => { if (acct !== me) rows.forEach((r) => { if (r.s === "w" && r.pub === 1) { const k = r.i + "|" + r.f; m.set(k, (m.get(k) || 0) + 1); } }); });
      return Array.from(m.entries()).map(([k, n]) => ({ i: Number(k.split("|")[0]), f: k.slice(k.indexOf("|") + 1), n: n })).sort((a, b) => b.n - a.n).slice(0, max); },
    putHandle: (h, acct) => T.bh.set(h, acct),
    byHandle: (h) => T.bh.has(h) ? T.bh.get(h) : null,
    bset: (acct) => copy(T.bset.get(acct)),
    putBset: (acct, x) => T.bset.set(acct, copy(x)),
    offer: (id) => copy(T.offer.get(id)),
    offersOf: (acct) => Array.from(T.offer.values()).filter((o) => o.a === acct || o.b === acct).sort((x, y) => y.upd - x.upd).slice(0, 400).map(copy),
    putOffer: (o) => T.offer.set(o.id, copy(o)),
    pruneOffers: (cut) => T.offer.forEach((o, k) => { if (o.st !== "open" && o.st !== "accepted" && o.upd < cut) T.offer.delete(k); }),
    reps: () => Array.from(T.rep.values()).sort((a, b) => a.at - b.at).map(copy),
    repsOf: (who) => Array.from(T.rep.values()).filter((x) => x.who === who).map(copy),
    repsBy: (by) => Array.from(T.rep.values()).filter((x) => x.by === by).sort((a, b) => a.at - b.at).map(copy),
    putRep: (x) => T.rep.set(rk(x.by, x.who), copy(x)),
    delReps: (who, why) => T.rep.forEach((x, k) => { if (x.who === who && (!why || x.why === why)) T.rep.delete(k); }),
    pruneReps: (cut) => T.rep.forEach((x, k) => { if (x.at < cut) T.rep.delete(k); }),
    blocks: (by) => Array.from(T.blk.values()).filter((x) => x.by === by).sort((a, b) => b.at - a.at).map(copy),
    blockers: (who) => Array.from(T.blk.values()).filter((x) => x.who === who).map((x) => x.by),
    putBlk: (x) => T.blk.set(rk(x.by, x.who), copy(x)),
    delBlk: (by, who) => T.blk.delete(rk(by, who)),
    mod: (acct) => copy(T.modr.get(acct)),
    putMod: (acct, x) => (x.off || x.pich) ? T.modr.set(acct, { off: x.off ? 1 : 0, pich: x.pich ? 1 : 0, at: x.at || 0 }) : T.modr.delete(acct),
    offAccts: () => Array.from(T.modr.entries()).filter(([, x]) => x.off).sort((a, b) => b[1].at - a[1].at).map(([acct, x]) => ({ acct: acct, at: x.at })),
    oldGuests: (cut, max) => Array.from(T.acct.values()).filter((a) => a.guest && a.made < cut &&
      !Array.from(T.sess.values()).some((s) => s.acct === a.id && s.last >= cut) && !Array.from(T.cred.values()).some((c) => c.acct === a.id)).slice(0, max).map((a) => a.id),
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
      T.item.forEach((x, key) => { if (x.acct === id) T.item.delete(key); });
      T.board.delete(id); T.bh.forEach((a, h) => { if (a === id) T.bh.delete(h); });
      T.offer.forEach((o, k) => { if (o.a === id || o.b === id) T.offer.delete(k); }); T.bset.delete(id);
      ["rep", "blk"].forEach((t) => T[t].forEach((x, k) => { if (x.by === id || x.who === id) T[t].delete(k); })); T.modr.delete(id);
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
    // up to n of a day's allowance per connection; how many were granted
    async spendUpTo(what, ip, n) {
      const day = dayOf(this.now()), key = what + ":" + (await sha(String(ip || "") + "|" + day));
      const c = this.db.used(key, day), got = Math.max(0, Math.min(n, LIMITS[what] - c));
      if (got) this.db.use(key, day, c + got);
      return got;
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
      let crop = null;
      try { crop = p && p.pcrop ? cleanCrop(JSON.parse(p.pcrop)) : null; } catch (e) { crop = null; }
      const pic = p && p.pk === "l" && p.ph ? Object.assign({ k: "l", h: p.ph }, crop || {}) : p && p.pk === "p" ? { k: "p", v: p.pv } : null;
      const r = this.db.riotOf(a.id);
      const mine = this.db.disps().filter((d) => d.acct === a.id).map((d) => ({ n: d.n, tag: d.tag, at: dayOf(d.at) }));
      const out = { v: 1, id: a.id, made: dayOf(a.made), keys: this.db.creds(a.id).map((c) => ({ id: c.id, name: c.name || "", made: dayOf(c.made), last: dayOf(c.last), mt: c.made, lt: c.last })), // the times too: the phone writes the day in its own time zone (sweep, 2026-10-31)
        name: p && p.name || "", user: p && p.user || "", about: p && p.about || "", area: p && p.area || "", pic: pic,
        riot: r ? { n: r.n, tag: r.tag } : null, asked: mine };
      if (a.guest) out.guest = true;
      if (this.isAdmin(a.id)) { out.admin = true; out.disputes = this.db.disps().length; out.reports = queueOf(this.db.reps()).length; }
      return out;
    }
    isAdmin(id) { return String(this.env.ADMIN || "").split(/[\s,]+/).indexOf(id) >= 0; }
    profOf(id) { return this.db.prof(id) || { acct: id, name: "", user: null, about: "", pk: null, ph: null, pv: 0, area: null }; }
    who2(acct) { const p = this.db.prof(acct); return { user: p && p.user || "", name: p && p.name || "" }; }
    async session(acctId, dev) {
      const t = b64u(rand(32)), now = this.now();
      this.db.putSess({ tok: await sha(t), acct: acctId, made: now, last: now, dev: cleanDev(dev) });
      return t;
    }
    // a guest moves into the account it signs in to: the other account's
    // profile, picture, username and Riot ID win where both have one; the
    // guest's fill its gaps; then the guest is removed (Mako 2026-10-31)
    merge(gid, tid) {
      const G = this.db.prof(gid), gr = this.db.riotOf(gid), gph = this.db.photo(gid);
      const gd = this.db.disps().filter((d) => d.acct === gid), gb = this.db.blocks(gid);
      this.db.delAcct(gid); // frees the guest's username and Riot ID first
      const T = this.profOf(tid);
      if (G) {
        let changed = false;
        ["name", "about", "area"].forEach((f) => { if (!T[f] && G[f]) { T[f] = G[f]; changed = true; } });
        if (!T.user && G.user && !this.db.profByUser(G.user)) { T.user = G.user; changed = true; }
        if (!T.pk && G.pk) {
          T.pk = G.pk; T.ph = G.ph; T.pv = G.pv; T.pcrop = G.pcrop; changed = true;
          if (G.pk === "p" && gph) this.db.putPhoto(tid, gph);
        }
        if (changed) this.db.putProf(T);
      }
      if (gr && !this.db.riotOf(tid) && !this.db.riotByKey(gr.k)) this.db.putRiot({ k: gr.k, acct: tid, n: gr.n, tag: gr.tag, at: gr.at });
      const mine = this.db.riotOf(tid);
      gd.forEach((d) => {
        if (mine && mine.k === d.k) return;
        if (this.db.disps().some((x) => x.acct === tid && x.k === d.k)) return;
        this.db.putDisp({ id: d.id, k: d.k, acct: tid, n: d.n, tag: d.tag, at: d.at });
      });
      gb.forEach((x) => { if (x.who !== tid && this.db.acct(x.who)) this.db.putBlk({ by: tid, who: x.who, at: x.at }); }); // the guest's blocks hold in the account it moved into
    }
    // signing in from a guest moves the guest in; from anything else, nothing moves
    into(me, a) { if (me && me.acct.guest && me.acct.id !== a.id) this.merge(me.acct.id, a.id); }
    // THE TRADE BOARD (board.js): an account's rows from its synced collection, shown to others once it is saved
    async rebuild(acctId) {
      const a = this.db.acct(acctId);
      if (!a) return;
      const items = this.db.boardItems(acctId);
      this.db.putBoard(acctId, rowsFrom(items, !a.guest && !this.isOff(acctId))); // taken off the board (reports.js): nothing shown
      const sx = items.filter((x) => x.k === "vir.board.v1" && x.id === "all")[0];
      this.db.putBset(acctId, settingsFrom(sx ? sx.d : "{}"));
      this.db.putHandle(await handleOf(acctId), acctId);
    }
    // REPORT AND BLOCK (reports.js)
    isOff(acctId) { const m = this.db.mod(acctId); return !!(m && m.off); }
    picHidden(acctId) { const m = this.db.mod(acctId); return !!(m && m.pich); }
    // everyone this account never sees on the board, nor they it: whom it blocked and who blocked it
    apart(acctId) { return new Set(this.db.blocks(acctId).map((x) => x.who).concat(this.db.blockers(acctId))); }
    blocked(x, y) { return this.apart(x).has(y); }
    // every live offer of one account ends, as if it walked away (with: only those with this player)
    closeOffers(acctId, with_) {
      const now = this.now();
      this.db.offersOf(acctId).map((o) => settle(o, now)).forEach((o) => {
        if (with_ && o.a !== with_ && o.b !== with_) return;
        const x = closeFor(o, acctId, now);
        if (x) this.db.putOffer(x);
      });
    }
    // what others see of a trader: name, @username, home area, picture (never the account id or Riot ID)
    face(acctId) {
      const p = this.db.prof(acctId);
      let crop = null;
      try { crop = p && p.pcrop ? cleanCrop(JSON.parse(p.pcrop)) : null; } catch (e) { crop = null; }
      let pic = p && p.pk === "l" && p.ph ? Object.assign({ k: "l", h: p.ph }, crop || {}) : p && p.pk === "p" ? { k: "p", v: p.pv || 0 } : null;
      if (this.picHidden(acctId)) pic = null; // reported by REPORT.hide players: hidden until Mako decides
      const bs = this.db.bset(acctId) || settingsFrom("{}");
      return { name: p && p.name || "", user: p && p.user || "", area: p && p.area || "", pic: pic, open: bs.open, pct: bs.pct };
    }
    // OFFERS (offers.js): every offer an account is in, as it sees them, expired ones marked as read
    async offersFor(acct) {
      const now = this.now(), list = this.db.offersOf(acct).map((o) => {
        const x = settle(o, now);
        if (x.st !== o.st) this.db.putOffer(x);
        return x;
      });
      const hs = new Map();
      for (const o of list) { const other = o.a === acct ? o.b : o.a; if (!hs.has(other)) hs.set(other, await handleOf(other)); }
      const apart = this.apart(acct); // a block hides the Riot ID even on a finished trade (the security scan, Mako's yes 2026-11-01)
      const out = list.map((o) => viewOf(o, acct, hs.get(o.a === acct ? o.b : o.a), (id) => this.face(id), (id) => apart.has(id) ? null : this.db.riotOf(id)));
      return { v: 1, offers: out, wait: out.filter((x) => x.turn).length };
    }
    // a new offer or a counter from me; body: { to: handle, give, get, cash, re }
    async offerSend(me, body) {
      const now = this.now(), mine = me.acct.id;
      if (me.acct.guest) return [409, { error: "save your account first: offers are between saved accounts" }];
      let to = null, old = null;
      if (body.re !== undefined) {
        old = typeof body.re === "string" && /^[0-9a-f]{16}$/.test(body.re) ? this.db.offer(body.re) : null;
        if (old) old = settle(old, now);
        if (!old || old.b !== mine) return [404, { error: "that offer is not one you can counter" }];
        if (old.st !== "open") return [409, { error: "that offer is no longer open" }];
        to = old.a;
      } else {
        to = typeof body.to === "string" && /^[0-9a-f]{24}$/.test(body.to) ? this.db.byHandle(body.to) : null;
      }
      const ta = to ? this.db.acct(to) : null;
      if (!ta || ta.guest || to === mine || this.isOff(to) || this.blocked(mine, to)) return [404, { error: "that player is not on the board" }];
      if (this.isOff(mine)) return [409, { error: "your account is off the Trade board, so it can't send offers; ask in Feedback" }];
      const ga = cleanLines(body.give), gb = cleanLines(body.get), cash = cleanCash(body.cash);
      if (!ga || !gb || cash === undefined) return [400, { error: "bad offer" }];
      if (!ga.length && !gb.length) return [400, { error: "an offer needs at least one card" }];
      if (!holds(this.db.boardRows(mine), ga, false)) return [409, { error: "some of your cards are no longer in a For trade binder" }];
      if (!holds(this.db.boardRows(to), gb, true)) return [409, { error: "some of their cards are no longer for trade" }];
      if (!old) {
        const open = (this.db.bset(to) || settingsFrom("{}")).open, shape = shapeOf(ga, gb, cash);
        if (!fits(open, shape)) return [409, { error: open === "sale" ? "they are open to sales only: offer cash for their cards" : open === "trade" ? "they are open to trades only: add a card of yours" : "an offer asks for cards of theirs" }];
      }
      const all = this.db.offersOf(mine).map((o) => settle(o, now));
      if (all.some((o) => o.st === "open" && (o.a === to || o.b === to) && (!old || o.id !== old.id))) return [409, { error: "you already have an offer open with this player: answer or withdraw it first" }];
      if (all.filter(live).length >= OFFER.live || this.db.offersOf(to).map((o) => settle(o, now)).filter(live).length >= OFFER.live) return [409, { error: "too many offers open; finish or withdraw some first" }];
      if (!(await this.spend("offersend", "acct:" + mine))) return [429, { error: "too many offers today; try again tomorrow" }];
      const o = newOffer(hex(rand(8)), mine, to, ga, gb, cash, now, old ? old.id : null);
      if (old) { o.ma = old.mb; o.mb = old.ma; old.st = "countered"; old.upd = now; this.db.putOffer(old); }
      this.db.putOffer(o);
      return [200, { ok: true, id: o.id }];
    }
    // accept, decline, withdraw, cancel, meet, done
    offerAct(me, p, body) {
      const now = this.now(), mine = me.acct.id;
      let o = typeof body.id === "string" && /^[0-9a-f]{16}$/.test(body.id) ? this.db.offer(body.id) : null;
      if (!o || (o.a !== mine && o.b !== mine)) return [404, { error: "that offer is not yours" }];
      o = settle(o, now);
      const isA = o.a === mine, gone = { error: "that offer is no longer open" };
      if (p === "/offer/answer") {
        const act = body.act;
        if (act === "accept" || act === "decline") {
          if (isA || o.st !== "open") return [409, gone];
          if (act === "accept") {
            if (this.isOff(o.a) || this.isOff(o.b) || this.blocked(o.a, o.b)) return [409, gone];
            const d = JSON.parse(o.d);
            if (!holds(this.db.boardRows(o.a), d.ga, false) || !holds(this.db.boardRows(o.b), d.gb, false)) return [409, { error: "some of these cards are no longer for trade; counter with what is left" }];
          }
          o.st = act === "accept" ? "accepted" : "declined";
        } else if (act === "withdraw") {
          if (!isA || o.st !== "open") return [409, gone];
          o.st = "withdrawn";
        } else if (act === "cancel") {
          if (o.st !== "accepted") return [409, { error: "only an agreed trade can be called off" }];
          o.st = "cancelled";
        } else return [400, { error: "bad request" }];
        o.upd = now; this.db.putOffer(o);
        return [200, { ok: true, st: o.st }];
      }
      if (p === "/offer/meet") {
        if (o.st !== "open" && o.st !== "accepted") return [409, gone];
        const ev = cleanEvent(body.ev);
        if (ev === null) return [400, { error: "bad event" }];
        if (isA) o.ma = ev || null; else o.mb = ev || null;
        this.db.putOffer(o);
        return [200, { ok: true }];
      }
      if (p === "/offer/done") {
        if (o.st !== "accepted" && o.st !== "done") return [409, { error: "only an agreed trade can be marked done" }];
        const first = isA ? !o.da : !o.dbb;
        if (isA) o.da = 1; else o.dbb = 1;
        if (o.da && o.dbb) o.st = "done";
        o.upd = now; this.db.putOffer(o);
        return [200, { ok: true, first: first, st: o.st }];
      }
      return [404, { error: "not found" }];
    }
    // a report from me about another player: one per player, reporting again changes the reason
    async reportSend(me, body) {
      if (me.acct.guest) return [409, { error: "save your account first: only saved accounts can report" }];
      const why = cleanWhy(body.why);
      if (!why) return [400, { error: "bad request" }];
      const who = typeof body.h === "string" && /^[0-9a-f]{24}$/.test(body.h) ? this.db.byHandle(body.h) : null;
      if (!who || who === me.acct.id || !this.db.acct(who)) return [404, { error: "that player is not on the board" }];
      if (!(await this.spend("report", "acct:" + me.acct.id))) return [429, { error: "that is plenty of reports for today; try again tomorrow" }];
      const now = this.now();
      this.db.putRep({ by: me.acct.id, who: who, why: why, at: now });
      // the instant hide counts only reporters whose accounts are REPORT.oldDays old (the security scan, Mako's yes
      // 2026-11-01): fresh accounts can't hide a picture; every report still reaches Mako's queue
      const old = (r) => { const x = this.db.acct(r.by); return !!x && now - x.made >= REPORT.oldDays * DAY; };
      if (why === "pic" && this.db.repsOf(who).filter((r) => r.why === "pic" && old(r)).length >= REPORT.hide) {
        const m = this.db.mod(who) || { off: 0, at: now };
        this.db.putMod(who, { off: m.off, pich: 1, at: m.at });
      }
      return [200, { ok: true }];
    }
    // block another player, or unblock them ({ h, off: true })
    async blockSet(me, body) {
      const mine = me.acct.id;
      const who = typeof body.h === "string" && /^[0-9a-f]{24}$/.test(body.h) ? this.db.byHandle(body.h) : null;
      if (body.off === true) { if (who) this.db.delBlk(mine, who); return [200, { ok: true }]; }
      if (!who || who === mine || !this.db.acct(who)) return [404, { error: "that player is not on the board" }];
      const mineB = this.db.blocks(mine);
      if (mineB.some((x) => x.who === who)) return [200, { ok: true }];
      if (mineB.length >= BLOCK.max) return [409, { error: "you have blocked " + BLOCK.max + " players; unblock some first" }];
      if (!(await this.spend("block", "acct:" + mine))) return [429, { error: "too many blocks today; try again tomorrow" }];
      this.db.putBlk({ by: mine, who: who, at: this.now() });
      this.closeOffers(mine, who);
      return [200, { ok: true }];
    }
    async blocksOf(acctId) {
      const out = [];
      for (const x of this.db.blocks(acctId)) {
        const f = this.face(x.who);
        out.push({ h: await handleOf(x.who), name: f.name, user: f.user, area: f.area, pic: f.pic, at: dayOf(x.at), atT: x.at });
      }
      return { v: 1, blocks: out };
    }
    // MAKO'S QUEUE: each reported player once, then those taken off the board with nothing waiting
    async adminReports() {
      const q = queueOf(this.db.reps()), done = new Set(q.map((x) => x.who)), rows = [];
      const one = async (who, x) => {
        const p = this.db.prof(who);
        let crop = null;
        try { crop = p && p.pcrop ? cleanCrop(JSON.parse(p.pcrop)) : null; } catch (e) { crop = null; }
        const pic = p && p.pk === "l" && p.ph ? Object.assign({ k: "l", h: p.ph }, crop || {}) : p && p.pk === "p" ? { k: "p", v: p.pv || 0 } : null;
        const m = this.db.mod(who) || {};
        rows.push({ h: await handleOf(who), id: who, name: p && p.name || "", user: p && p.user || "", area: p && p.area || "", pic: pic,
          why: x ? x.why : {}, from: x ? x.from.map((b) => this.who2(b)) : [], at: x ? dayOf(x.at) : dayOf(m.at || 0), atT: x ? x.at : (m.at || 0),
          off: !!m.off, pich: !!m.pich });
      };
      for (const x of q) { if (this.db.acct(x.who)) await one(x.who, x); }
      for (const o of this.db.offAccts()) { if (!done.has(o.acct) && this.db.acct(o.acct)) await one(o.acct, null); }
      return { v: 1, players: rows };
    }
    // Mako's call on a player: pic (remove picture), name (clear name and username), off (take off the board), on (put back), dismiss
    async adminAct(body) {
      const who = typeof body.h === "string" && /^[0-9a-f]{24}$/.test(body.h) ? this.db.byHandle(body.h) : null;
      if (!who || !this.db.acct(who)) return [404, { error: "that player is gone" }];
      const now = this.now(), m = this.db.mod(who) || { off: 0, pich: 0, at: 0 }, act = body.act;
      if (act === "pic") {
        const x = this.profOf(who); x.pk = null; x.ph = null; x.pcrop = null; this.db.putProf(x); this.db.delPhoto(who);
        m.pich = 0; this.db.delReps(who, "pic");
      } else if (act === "name") {
        const x = this.profOf(who); x.name = ""; x.user = null; this.db.putProf(x);
        this.db.delReps(who, "name");
      } else if (act === "off") {
        m.off = 1; m.at = now; this.db.putMod(who, m);
        this.closeOffers(who); this.db.delReps(who);
      } else if (act === "on") {
        m.off = 0; m.at = now;
      } else if (act === "dismiss") {
        m.pich = 0; this.db.delReps(who);
      } else return [400, { error: "bad request" }];
      this.db.putMod(who, m);
      if (act === "off" || act === "on") await this.rebuild(who);
      return [200, { ok: true, left: queueOf(this.db.reps()).length }];
    }
    // everything the server keeps for an account, for Download your data
    exportOf(a) {
      const p = this.db.prof(a.id), r = this.db.riotOf(a.id), ph = p && p.pk === "p" ? this.db.photo(a.id) : null;
      const v = this.view(a);
      return { v: 1, what: "Everything RAVI's server keeps for this account", on: dayOf(this.now()),
        account: { id: a.id, made: dayOf(a.made), saved: !a.guest },
        recoveryCode: a.code ? "set: RAVI keeps only a scrambled copy (SHA-256) and can't show it" : "none yet",
        passkeys: this.db.credsFull(a.id).map((c) => ({ name: c.name || "", made: dayOf(c.made), lastUsed: dayOf(c.last), kind: c.alg === -7 ? "ES256" : "RS256", publicKey: c.jwk })),
        devices: this.db.sessions(a.id).map((x) => ({ device: x.dev || "Computer", signedIn: dayOf(x.made), lastUsed: dayOf(x.last) })),
        profile: { name: v.name, username: v.user, about: v.about, homeArea: v.area, picture: v.pic },
        photo: ph ? "data:image/jpeg;base64," + btoa(Array.from(ph, (x) => String.fromCharCode(x)).join("")) : null,
        riotId: r ? { name: r.n, tag: r.tag, claimed: dayOf(r.at) } : null,
        disputes: v.asked,
        tradeBoard: { what: "what others see on the Trade board: card (TCGplayer product id), printing and count", shown: !a.guest,
          have: this.db.boardRows(a.id).filter((r) => r.s === "h" && r.pub === 1).map((r) => ({ card: r.i, printing: r.f, count: r.q })),
          want: this.db.boardRows(a.id).filter((r) => r.s === "w" && r.pub === 1).map((r) => ({ card: r.i, printing: r.f, count: r.q })) },
        offers: this.db.offersOf(a.id).map((o) => { const d = JSON.parse(o.d), mine = o.a === a.id; return { sent: mine, status: o.st, made: dayOf(o.made), changed: dayOf(o.upd),
          youGive: mine ? d.ga : d.gb, youGet: mine ? d.gb : d.ga, cash: d.c ? { dollars: Math.abs(d.c), currency: d.cur, paidBy: (d.c > 0) === mine ? "you" : "them" } : null, youMeetAt: (mine ? o.ma : o.mb) || null }; }),
        tradeBoardSettings: this.db.bset(a.id) || null,
        blocked: this.db.blocks(a.id).map((x) => ({ player: this.who2(x.who), since: dayOf(x.at) })),
        reportsYouSent: this.db.repsBy(a.id).map((x) => ({ player: this.who2(x.who), reason: x.why, on: dayOf(x.at) })),
        reportsAboutYou: this.db.repsOf(a.id).map((x) => ({ reason: x.why, on: dayOf(x.at) })), // who sent them stays with RAVI
        offTradeBoard: this.isOff(a.id), pictureHidden: this.picHidden(a.id),
        synced: this.db.allItems(a.id).reduce((o, x) => { let d; try { d = JSON.parse(x.d); } catch (e) { d = x.d; } (o[x.k] = o[x.k] || {})[x.id] = d; return o; }, {}) };
    }
    // the next running number for an item's change
    next() { if (this.seq === undefined) this.seq = this.db.maxSeq(); return ++this.seq; }
    // one sync: the phone's changes in, then what changed since its cursor out
    syncWith(acct, body, room, guest) {
      const now = this.now(), total = guest ? SYNC.guestTotal : SYNC.total;
      let wait = false;
      const since = Number.isSafeInteger(body.since) && body.since >= 0 ? body.since : 0;
      const put = Array.isArray(body.put) ? body.put.slice(0, SYNC.put) : [];
      let size = this.db.itemSize(acct), full = false;
      const back = [];
      put.forEach((x) => {
        if (!x || typeof x !== "object" || SYNC_KEYS.indexOf(x.k) < 0 || typeof x.id !== "string" || !/^[A-Za-z0-9_:.-]{1,64}$/.test(x.id)) return;
        const t = Math.min(Math.floor(+x.t), now + 60000); // a phone's clock running ahead never wins for good
        if (!isFinite(t) || t < 0) return;
        const d = x.x === 1 ? null : typeof x.d === "string" && x.d.length <= SYNC.item ? x.d : undefined;
        if (d === undefined) return;
        const e = this.db.item(acct, x.k, x.id);
        if (e && e.t >= t) { back.push(e); return; } // the account's copy is as new or newer: sent back
        const b = size.b - (e && e.d ? e.d.length : 0) + (d ? d.length : 0), n = size.n + (e ? 0 : 1);
        if ((d && b > total) || n > SYNC.items) { full = true; return; }
        if (room <= 0) { wait = true; return; } // this connection's writes for today are spent: the phone keeps it and tries later
        room--;
        this.db.putItem({ acct: acct, k: x.k, id: x.id, t: t, d: d, s: this.next() });
        size = { n: n, b: b };
      });
      const rows = this.db.items(acct, since, SYNC.page);
      const out = (r) => r.d === null ? { k: r.k, id: r.id, t: r.t, x: 1 } : { k: r.k, id: r.id, t: r.t, d: r.d };
      return { v: 1, cur: rows.length ? rows[rows.length - 1].s : since, more: rows.length === SYNC.page, items: rows.map(out), back: back.map(out), full: full, wait: wait };
    }
    async fetch(req) {
      const u = new URL(req.url), ip = req.headers.get("X-Ravi-Ip") || "", now = this.now();
      this.db.prune(now, now - SESSION_DAYS * DAY, dayOf(now));
      if (this.db.used("prune:guest", dayOf(now)) === 0) {
        // once a day: guests never saved and unused for GUEST_DAYS are deleted (1000 a day at most: about 8000 rows written)
        this.db.use("prune:guest", dayOf(now), 1);
        this.db.oldGuests(now - GUEST_DAYS * DAY, 1000).forEach((id) => this.db.delAcct(id));
        this.db.purgeGone(now - SYNC.keepGone * DAY); // deletes old enough to have reached every phone
        this.db.pruneOffers(now - OFFER.keepDays * DAY); // finished offers are kept OFFER.keepDays, then gone
        this.db.pruneReps(now - REPORT.keepDays * DAY); // reports Mako has not decided are gone after REPORT.keepDays
      }
      const me = await this.who(req);
      if (req.method === "GET" && u.pathname === "/admin/reports") {
        if (!me || !this.isAdmin(me.acct.id)) return reply({ error: "not allowed" }, 403);
        return reply(await this.adminReports());
      }
      if (req.method === "GET" && u.pathname === "/admin/disputes") {
        if (!me || !this.isAdmin(me.acct.id)) return reply({ error: "not allowed" }, 403);
        return reply({ v: 1, disputes: this.db.disps().map((d) => {
          const held = this.db.riotByKey(d.k);
          // the Riot ID as its holder wrote it (Riot IDs ignore case); the asker's own spelling is kept if it is given to them
          return { id: d.id, riot: held ? held.n + "#" + held.tag : d.n + "#" + d.tag, at: dayOf(d.at), atT: d.at, asker: this.who2(d.acct),
            holder: held ? Object.assign(this.who2(held.acct), { since: dayOf(held.at), sinceT: held.at }) : null };
        }) });
      }
      if (req.method === "GET") {
        const pm = /^\/pic\/([0-9a-f]{24})$/.exec(u.pathname);
        if (pm) {
          const img = this.db.photo(pm[1]);
          if (!img) return reply({ error: "no picture" }, 404);
          return new Response(img, { headers: { "Content-Type": "image/jpeg" } });
        }
        const bm = /^\/bpic\/([0-9a-f]{24})$/.exec(u.pathname);
        if (bm) {
          // a trader's photo on the Trade board, by their board handle; only while they share something
          const id = this.db.byHandle(bm[1]), p = id ? this.db.prof(id) : null, img = p && p.pk === "p" && !this.picHidden(id) && this.db.boardRows(id).some((r) => r.pub === 1) ? this.db.photo(id) : null;
          if (!img) return reply({ error: "no picture" }, 404);
          return new Response(img, { headers: { "Content-Type": "image/jpeg" } });
        }
        if (u.pathname === "/board") {
          if (!me) return reply({ error: "signed out" }, 401);
          if (!(await this.spend("board", ip))) return reply({ error: "the board has been opened too often from this connection today; try again tomorrow" }, 429);
          const bd = await boardFor(this.db, me.acct.id, (id) => this.face(id), this.apart(me.acct.id));
          Object.assign(bd.me, { off: this.isOff(me.acct.id), pich: this.picHidden(me.acct.id), blocked: this.db.blocks(me.acct.id).length });
          return reply(Object.assign(bd, { saved: !me.acct.guest }));
        }
        if (u.pathname === "/offers") {
          if (!me) return reply({ error: "signed out" }, 401);
          if (!(await this.spend("offers", ip))) return reply({ error: "offers have been opened too often from this connection today; try again tomorrow" }, 429);
          return reply(await this.offersFor(me.acct.id));
        }
        if (u.pathname === "/blocks") return me ? reply(await this.blocksOf(me.acct.id)) : reply({ error: "signed out" }, 401);
        if (u.pathname === "/me") return me ? reply(this.view(me.acct)) : reply({ error: "signed out" }, 401);
        if (u.pathname === "/devices") {
          if (!me) return reply({ error: "signed out" }, 401);
          return reply({ v: 1, devices: this.db.sessions(me.acct.id).map((x) => ({ id: x.tok.slice(0, 12), dev: x.dev || "Computer", made: dayOf(x.made), last: dayOf(x.last), mt: x.made, lt: x.last, here: x.tok === me.tok })) });
        }
        if (u.pathname === "/export") return me ? reply(this.exportOf(me.acct)) : reply({ error: "signed out" }, 401);
        return reply({ error: "not found" }, 404);
      }
      if (req.method !== "POST") return reply({ error: "not allowed" }, 405);
      let body = {};
      try { body = JSON.parse((await req.text()) || "{}") || {}; } catch (e) { return reply({ error: "bad request" }, 400); }
      if (typeof body !== "object") return reply({ error: "bad request" }, 400);
      const p = u.pathname;

      if (p === "/guest") {
        // this phone's account, made on its first open with no prompt
        if (me) return reply({ error: "this phone already has an account" }, 409);
        if (!(await this.spend("guest", ip))) return reply({ error: "too many new accounts from this connection today; try again tomorrow" }, 429);
        const a = { id: hex(rand(12)), uh: b64u(rand(16)), made: now, code: null, guest: 1 };
        this.db.putAcct(a);
        const token = await this.session(a.id, body.dev);
        // the Riot name this phone already had becomes the guest's Riot ID, when nobody holds it
        const rr = body.riot && typeof body.riot === "object" ? cleanRiot(body.riot.n, body.riot.tag) : null;
        if (rr && !rr.error && !this.db.riotByKey(rr.k) && (await this.spend("riot", ip))) {
          try { this.db.putRiot({ k: rr.k, acct: a.id, n: rr.n, tag: rr.tag, at: now }); } catch (e) { /* claimed a moment ago */ }
        }
        return reply({ token: token, account: this.view(a) });
      }

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
          this.into(me, a);
          return reply({ token: await this.session(a.id, body.dev), account: this.view(a) });
        }
        const r = await verifyRegistration(body.cred, ch.c, this.rp);
        if (r.error) return reply({ error: r.error }, 400);
        if (this.db.cred(r.id)) return reply({ error: "this passkey is already on an account" }, 409);
        if (ch.acct) {
          const a = this.db.acct(ch.acct);
          if (!a || !me || me.acct.id !== a.id) return reply({ error: "signed out" }, 401);
          if (a.guest && !(await this.spend("made", ip))) return reply({ error: "too many new accounts from this connection today; try again tomorrow" }, 429);
          this.db.putCred({ id: r.id, acct: a.id, alg: r.alg, jwk: r.jwk, count: r.count, made: now, last: now, name: cleanText(body.name, 32) });
          if (a.guest) {
            // Save your account: the first passkey makes the guest a saved account, with its recovery code.
            // It counts as a new account toward the day's limit (the security scan, Mako's yes 2026-11-01:
            // throwaway saved accounts must not be cheaper than new ones; spent above, before the passkey is kept)
            const code = newCode();
            a.guest = 0; a.code = await sha(cleanCode(code));
            this.db.putAcct(a);
            await this.rebuild(a.id); // what it marked For trade now shows on the board
            return reply({ account: this.view(a), recovery: code });
          }
          return reply({ account: this.view(a) });
        }
        if (!(await this.spend("made", ip))) return reply({ error: "too many new accounts from this connection today; try again tomorrow" }, 429);
        const code = newCode();
        const a = { id: hex(rand(12)), uh: ch.uh, made: now, code: await sha(cleanCode(code)) };
        this.db.putAcct(a);
        this.db.putCred({ id: r.id, acct: a.id, alg: r.alg, jwk: r.jwk, count: r.count, made: now, last: now, name: cleanText(body.name, 32) });
        this.into(me, a);
        return reply({ token: await this.session(a.id, body.dev), recovery: code, account: this.view(a) });
      }

      if (p === "/recover") {
        if (!(await this.spend("code", ip))) return reply({ error: "too many tries today; try again tomorrow" }, 429);
        const c = cleanCode(body.code);
        const a = c ? this.db.acctByCode(await sha(c)) : null;
        if (!a) return reply({ error: "that code does not match an account" }, 404);
        const code = newCode(); // a used code is spent; the new one replaces it
        a.code = await sha(cleanCode(code));
        this.db.putAcct(a);
        this.into(me, a);
        return reply({ token: await this.session(a.id, body.dev), recovery: code, account: this.view(a) });
      }

      if (!me) return reply({ error: "signed out" }, 401);
      if (p === "/code") {
        if (me.acct.guest) return reply({ error: "save your account first: it adds a passkey and a recovery code" }, 409);
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
          const crop = cleanCrop(body);
          x.pk = "l"; x.ph = body.h; x.pcrop = crop ? JSON.stringify(crop) : null; this.db.delPhoto(me.acct.id);
        } else if (body.k === null) { x.pk = null; x.ph = null; x.pcrop = null; this.db.delPhoto(me.acct.id); }
        else return reply({ error: "bad request" }, 400);
        this.db.putProf(x);
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/photo") {
        if (!(await this.spend("photo", ip))) return reply({ error: "too many pictures today; try again tomorrow" }, 429);
        const img = typeof body.jpg === "string" && body.jpg.length < PHOTO_MAX * 1.4 ? unb64u(body.jpg, PHOTO_MAX * 1.4) : null; // a 256 square photo is 20 to 33K characters (the security scan, 2026-11-01)
        if (!img || !checkJpeg(img)) return reply({ error: "that picture could not be used; try another" }, 400);
        const x = this.profOf(me.acct.id);
        this.db.putPhoto(me.acct.id, img);
        x.pk = "p"; x.ph = null; x.pv = now; x.pcrop = null;
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
        if (body.off === true) {
          if (!(await this.spend("prof", ip))) return reply({ error: "too many changes today; try again tomorrow" }, 429);
          this.db.delRiot(me.acct.id); return reply({ account: this.view(me.acct) });
        }
        if (!(await this.spend("riot", ip))) return reply({ error: "too many Riot ID claims from this connection today; try again tomorrow" }, 429);
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
      if (p === "/sync") {
        if (!(await this.spend("sync", "acct:" + me.acct.id)) || !(await this.spend("synccall", ip))) return reply({ error: "too many syncs today; your things stay on this phone and go up tomorrow" }, 429);
        const want = Array.isArray(body.put) ? Math.min(body.put.length, SYNC.put) : 0;
        const room = want ? await this.spendUpTo("syncw", ip, want) : 0;
        const done = this.syncWith(me.acct.id, body, room, !!me.acct.guest);
        if ((Array.isArray(body.put) ? body.put : []).some((x) => x && BOARD_KEYS.indexOf(x.k) >= 0)) await this.rebuild(me.acct.id);
        return reply(done);
      }
      if (p === "/offer/send" || p === "/offer/answer" || p === "/offer/meet" || p === "/offer/done") {
        if (!(await this.spend("offer", ip))) return reply({ error: "too many changes to offers today; try again tomorrow" }, 429);
        const r = p === "/offer/send" ? await this.offerSend(me, body) : this.offerAct(me, p, body);
        return reply(r[1], r[0]);
      }
      if (p === "/report" || p === "/block") {
        if (!(await this.spend("offer", ip))) return reply({ error: "too many changes today; try again tomorrow" }, 429);
        const r = p === "/report" ? await this.reportSend(me, body) : await this.blockSet(me, body);
        return reply(r[1], r[0]);
      }
      if (p === "/admin/act") {
        if (!this.isAdmin(me.acct.id)) return reply({ error: "not allowed" }, 403);
        const r = await this.adminAct(body);
        return reply(r[1], r[0]);
      }
      if (p === "/key/name" || p === "/key/off") {
        const c = typeof body.id === "string" && body.id.length < 1400 ? this.db.cred(body.id) : null;
        if (!c || c.acct !== me.acct.id) return reply({ error: "that passkey is not on this account" }, 404);
        if (p === "/key/name") { c.name = cleanText(body.name, 32); this.db.putCred(c); return reply({ account: this.view(me.acct) }); }
        if (this.db.creds(me.acct.id).length <= 1) return reply({ error: "this is your only passkey; add another before removing it" }, 409);
        this.db.delCred(c.id);
        return reply({ account: this.view(me.acct) });
      }
      if (p === "/devices/out") {
        const id = typeof body.id === "string" && /^[0-9a-f]{12}$/.test(body.id) ? body.id : "";
        const s = id ? this.db.sessions(me.acct.id).filter((x) => x.tok.slice(0, 12) === id)[0] : null;
        if (!s) return reply({ error: "that device is already signed out" }, 404);
        this.db.delSess(s.tok);
        return reply({ ok: true, here: s.tok === me.tok });
      }
      if (p === "/devices/others") {
        let n = 0;
        this.db.sessions(me.acct.id).forEach((x) => { if (x.tok !== me.tok) { this.db.delSess(x.tok); n++; } });
        return reply({ ok: true, out: n });
      }
      if (p === "/out") { this.db.delSess(me.tok); return reply({ ok: true }); }
      if (p === "/delete") { this.db.delAcct(me.acct.id); return reply({ ok: true }); }
      return reply({ error: "not found" }, 404);
    }
  };
}
