// decks.js -- public decks and sharing (plan 2 M3 block 1, Mako's yes 2026-11-02). It lives inside the
// Accounts Durable Object (accounts.js), as the Trade board does, because it is built from what sync
// already keeps: a phone's decks reach the server as sync items (vir.decks.v1, one item "d:<id>" per
// deck), and a deck marked to share carries its own setting there. There is nothing separate to publish.
//
// WHO SEES WHAT (Deck settings, Who sees it): Private (the default) is never shown. Link: anyone with
// the deck's link sees it, and it is listed nowhere. Public: listed on Decks' Public view too, where
// anyone may search it and copy it. Only a saved account (one with a passkey) shares: an unsaved one
// costs nothing to make. Link and Public together count toward DECKS.max per account; past it, the
// decks shared first stay shared. Others see the deck's cards, its name and note, and the player's
// display name, @username and picture; never the printings priced, the deck's history or anything else.
//
// PRIOR ART (patterns only, no code): Moxfield and Archidekt (Private, Unlisted, Public; a Copy or
// Clone button on anyone's deck); Piltover Archive's Riftbound list (a row is the legend's portrait,
// deck name, by @user, a relative date, the two domains and a count; filters Legend and Domain).
//
// ON THE SERVER: table pdeck (acct, id, vis link or pub, vt when it was first shared, t its last edit,
// name, note, legend, d the cards as checked JSON), rebuilt for an account whenever sync changes its
// decks, when it is saved, and when Mako takes its decks down or puts them back; table pcopy (acct, id,
// by), one row per account that copied a deck, so Most copied counts each account once; table plike
// (acct, id, by, at), one row per saved account that likes a deck (plan 2 M9 block 2, Mako's go
// 2026-11-10): a like per account per deck, taken back by a second tap, never your own deck. Only the
// count is public: nobody is told who liked a deck, the owner included, and no player carries a total
// (likes order decks, never players: RAVI ranks no one). Every field
// is rebuilt from checked parts; the page escapes what it shows. A deck is named in links by its
// owner's handle (board.js handleOf: 24 hex, never the account id) and the deck's own id.

export const DECK_KEY = "vir.decks.v1";
// max: shared decks per account; name, note: characters kept; page: decks per page of the Public view;
// list: public decks the server reads to search (the whole Public view); copies per connection a day
export const DECKS = { max: 6, name: 40, note: 2000, page: 40, list: 6000, cards: 99, bf: 3 };

function J(s) { try { return JSON.parse(s); } catch (e) { return null; } }
export const CODE = /^[A-Z]+-(R|SP|T)?\d{1,4}[a-z*]?$/; // a card's code, as the catalogue's (every card passes, 2026-11-02)
export const DECK_ID = /^[A-Za-z0-9_-]{1,40}$/;

// text a player wrote: control characters out (a note keeps its line breaks), trimmed, capped
export function cleanText(v, max, lines) {
  if (typeof v !== "string") return "";
  let s = lines ? v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]/g, "")
    : v.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return Array.from(s).slice(0, max).join("");
}
function code(c) { return typeof c === "string" && CODE.test(c) ? c : ""; }
function counts(m) {
  const out = {};
  if (!m || typeof m !== "object" || Array.isArray(m)) return out;
  Object.keys(m).slice(0, 200).forEach((k) => {
    const n = m[k];
    if (code(k) && Number.isSafeInteger(n) && n >= 1 && n <= DECKS.cards) out[k] = n;
  });
  return out;
}

// A deck as the phone keeps it -> the cards others may see, or null when it isn't a deck.
export function cleanDeck(d) {
  if (!d || typeof d !== "object" || typeof d.id !== "string" || !DECK_ID.test(d.id)) return null;
  const bf = (Array.isArray(d.bf) ? d.bf : []).map(code).filter(Boolean).slice(0, DECKS.bf);
  return { legend: code(d.legend), champ: code(d.champ), main: counts(d.main), side: counts(d.side), maybe: counts(d.maybe), runes: counts(d.runes), bf: bf };
}

// An account's synced items -> its shared decks. items: [{ k, id, d }]; saved: the account has a passkey;
// off: Mako took its decks down. Returns [{ id, vis, vt, t, name, note, legend, d }], at most DECKS.max.
export function rowsFrom(items, saved, off) {
  if (!saved || off) return [];
  const out = [];
  (items || []).forEach((x) => {
    if (!x || x.k !== DECK_KEY || typeof x.d !== "string" || !/^d:/.test(x.id)) return;
    const v = J(x.d);
    if (!v || (v.vis !== "link" && v.vis !== "pub") || "d:" + v.id !== x.id) return;
    const c = cleanDeck(v);
    if (!c) return;
    const t = Number.isSafeInteger(v.t) && v.t > 0 ? v.t : 0;
    const vt = Number.isSafeInteger(v.vt) && v.vt > 0 ? v.vt : t;
    out.push({ id: v.id, vis: v.vis, vt: vt, t: t, name: cleanText(v.name, DECKS.name), note: cleanText(v.note, DECKS.note, true), legend: c.legend, d: JSON.stringify(c) });
  });
  // past the limit, the decks shared first stay shared
  out.sort((a, b) => a.vt - b.vt || (a.id < b.id ? -1 : 1));
  return out.slice(0, DECKS.max);
}

// what a list row shows of a deck (no cards: the Public view's rows are light)
export function rowOf(r, h, face, copies, likes) {
  return { h: h, id: r.id, vis: r.vis, name: r.name, legend: r.legend, t: r.t, vt: r.vt, copies: copies || 0, likes: likes || 0,
    who: { name: face.name, user: face.user, pic: face.pic } };
}

// The Public view. rows: every public deck [{ acct, id, ... }]; q: words typed (matched to the deck's
// name and the player's name and @username); ql: legends whose names match the words (the phone
// knows the cards, the server does not); f: the Legend and Domain filters as legend codes (empty: any);
// sort: "new" (first shared, newest first), "copied" or "liked"; only: a Set of "acct\nid" to keep (the
// decks this account liked), or null. Returns the matching rows in order.
export function search(rows, opt, faceOf, copiesOf, likesOf) {
  const q = cleanText(opt.q || "", 60).toLowerCase().replace(/^@/, "");
  const ql = new Set((opt.ql || []).filter(code)), f = new Set((opt.f || []).filter(code));
  const hit = rows.filter((r) => {
    if (opt.only && !opt.only.has(r.acct + "\n" + r.id)) return false;
    if (f.size && !f.has(r.legend)) return false;
    if (!q) return true;
    if (ql.has(r.legend)) return true;
    const w = faceOf(r.acct);
    return r.name.toLowerCase().indexOf(q) >= 0 || (w.user || "").toLowerCase().indexOf(q) === 0 || (w.name || "").toLowerCase().indexOf(q) >= 0;
  });
  const n = (r) => copiesOf(r.acct, r.id);
  const l = (r) => (likesOf ? likesOf(r.acct, r.id) : 0);
  if (opt.sort === "liked") hit.sort((a, b) => l(b) - l(a) || b.vt - a.vt || (a.id < b.id ? -1 : 1));
  else if (opt.sort === "copied") hit.sort((a, b) => n(b) - n(a) || b.vt - a.vt || (a.id < b.id ? -1 : 1));
  else hit.sort((a, b) => b.vt - a.vt || (a.id < b.id ? -1 : 1));
  return hit;
}

// a list of legend codes from a query string ("OGN-247,SFD-001"), checked; at most 300
export function codesFrom(s) {
  return typeof s === "string" ? s.split(",").slice(0, 300).filter((x) => CODE.test(x)) : [];
}
