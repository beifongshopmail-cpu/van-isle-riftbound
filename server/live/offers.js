// offers.js -- offers on the Trade board (plan 2 M2 block 2, Mako 2026-11-01). Inside the Accounts
// Durable Object (accounts.js), beside the board it builds on (board.js).
//
// AN OFFER (prior art: Steam's trade offers, item lists both ways with accept, decline and counter,
// and an expiry; OfferUp's MeetUp Spots for where to meet; Grimoria's settle step) is cards both
// ways, an optional amount of cash on either side, and nothing else: no free text, no chat. The
// sender (a) offers cards from their own For trade binders for cards the other player (b) shares,
// or cash for b's cards ("I'd buy this"). b accepts, declines or counters (a counter is a new offer
// the other way; the first is marked countered). An open offer lapses after OFFER.days.
// Once proposed or agreed, each player picks the local event they plan to be at (Meet at, from
// Events: only the event's id is kept). After an accepted offer each sees the other's Riot ID.
// Trade done: each player marks it on their own phone, which moves the cards in their Collection;
// when both have, it is done. RAVI never handles money: cash is only a number the two agree on.
//
// PER PLAYER (Trade board settings, synced in vir.board.v1): Open to trades, sales or both, and My
// price, a percent of market shown on their cards. A new offer must fit what its receiver is open
// to: a card swap needs trades, cash for their cards needs sales. A counter is a reply and may take
// any shape with at least one card in it.
//
// LIMITS: one open offer between two players at a time; OFFER.live offers open or agreed per
// account; OFFER.lines card lines a side; cash whole dollars up to OFFER.cash; sends per account a
// day (LIMITS.offer in accounts.js). Never a rating, a count of finished trades or a record shown
// of a player: an offer is between two people and only they see it.

export const OFFER = { days: 7, agreedDays: 60, keepDays: 30, live: 50, lines: 30, cash: 9999 };
export const OPEN = ["trade", "sale", "both"];
export const PCT = { min: 50, max: 150, step: 5, dflt: 100 };

const DAY = 86400000;

// the per-player settings from the synced vir.board.v1 item's text
export function settingsFrom(d) {
  let v = null;
  try { v = JSON.parse(d); } catch (e) { v = null; }
  v = v && typeof v === "object" ? v : {};
  const open = OPEN.indexOf(v.open) >= 0 ? v.open : "trade";
  let pct = Number.isSafeInteger(v.pct) ? v.pct : PCT.dflt;
  pct = Math.max(PCT.min, Math.min(PCT.max, Math.round(pct / PCT.step) * PCT.step));
  return { open: open, pct: pct };
}

function cleanFinish(f) {
  return typeof f === "string" && f && f.length <= 60 && !/[\u0000-\u001f\u007f<>]/.test(f) ? f : null;
}
// a side's cards from the phone: [{ i, f, q }], same card and printing added together; null when any line is bad
export function cleanLines(list) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list) || list.length > OFFER.lines) return null;
  const o = new Map();
  for (const x of list) {
    if (!x || typeof x !== "object") return null;
    const i = x.i, q = x.q, f = cleanFinish(x.f);
    if (!(Number.isSafeInteger(i) && i > 0) || !(Number.isSafeInteger(q) && q >= 1 && q <= 999) || !f) return null;
    const k = i + "|" + f;
    o.set(k, { i: i, f: f, q: (o.has(k) ? o.get(k).q : 0) + q });
  }
  return Array.from(o.values());
}
// does an account's have rows hold these lines? pubOnly: only what it shows others
export function holds(rows, lines, pubOnly) {
  const have = new Map();
  (rows || []).forEach((r) => { if (r.s === "h" && (!pubOnly || r.pub === 1)) have.set(r.i + "|" + r.f, r.q); });
  return lines.every((x) => (have.get(x.i + "|" + x.f) || 0) >= x.q);
}
// the cash from the phone: { n: whole dollars, by: "me" or "them", cur } or null for none; undefined when bad
export function cleanCash(c) {
  if (c === undefined || c === null) return null;
  if (typeof c !== "object") return undefined;
  if (!Number.isSafeInteger(c.n) || c.n < 0 || c.n > OFFER.cash) return undefined;
  if (c.n === 0) return null;
  if (c.by !== "me" && c.by !== "them") return undefined;
  return { n: c.n, by: c.by, cur: c.cur === "USD" ? "USD" : "CAD" };
}
// what a new offer is, by what each side puts in: "swap" (cards both ways), "buy" (cash for b's cards), or another shape
export function shapeOf(ga, gb, cash) {
  if (ga.length && gb.length) return "swap";
  if (!ga.length && gb.length && cash && cash.by === "me") return "buy";
  return "other";
}
// does b's Open to take an offer of this shape?
export function fits(open, shape) {
  if (shape === "swap") return open === "trade" || open === "both";
  if (shape === "buy") return open === "sale" || open === "both";
  return false;
}
// an open offer past its day is expired, an agreed one left too long has lapsed: worked out when read, not by a timer
export function settle(o, now) {
  if (o.st === "open" && o.exp <= now) return Object.assign({}, o, { st: "expired", upd: o.exp });
  if (o.st === "accepted" && o.upd + OFFER.agreedDays * DAY <= now) return Object.assign({}, o, { st: "lapsed", upd: o.upd + OFFER.agreedDays * DAY });
  return o;
}
export function live(o) { return o.st === "open" || o.st === "accepted"; }
export function newOffer(id, a, b, ga, gb, cash, now, re) {
  // cash is kept from a's side: c > 0 means a pays b, c < 0 means b pays a
  const c = cash ? (cash.by === "me" ? cash.n : -cash.n) : 0;
  return { id: id, a: a, b: b, st: "open", d: JSON.stringify({ ga: ga, gb: gb, c: c, cur: cash ? cash.cur : "CAD" }), made: now, upd: now, exp: now + OFFER.days * DAY, re: re || null, ma: null, mb: null, da: 0, dbb: 0 };
}
// an event's id from Events (PlayRiftbound's, as data/events.json has it), or "" to clear
export function cleanEvent(v) {
  if (v === "" || v === null) return "";
  return typeof v === "string" && /^[a-z]{0,4}\d{6,24}$/.test(v) ? v : null;
}
// one offer as one of its two players sees it. face(acct) is the other's public face; h their handle;
// riot(acct) their Riot ID once agreed.
export function viewOf(o, me, h, face, riot) {
  const d = JSON.parse(o.d), mine = o.a === me, other = mine ? o.b : o.a;
  const give = mine ? d.ga : d.gb, get = mine ? d.gb : d.ga;
  const c = mine ? d.c : -d.c; // > 0: I pay them
  const agreed = o.st === "accepted" || o.st === "done";
  const rid = agreed ? riot(other) : null;
  return {
    id: o.id, st: o.st, sent: mine, h: h, who: face(other),
    give: give, get: get, cash: c ? { n: Math.abs(c), by: c > 0 ? "me" : "them", cur: d.cur || "CAD" } : null,
    made: o.made, upd: o.upd, exp: o.exp,
    meet: { me: (mine ? o.ma : o.mb) || "", them: (mine ? o.mb : o.ma) || "" },
    done: { me: !!(mine ? o.da : o.dbb), them: !!(mine ? o.dbb : o.da) },
    riot: rid ? rid.n + "#" + rid.tag : "",
    turn: o.st === "open" && !mine ? 1 : 0
  };
}
