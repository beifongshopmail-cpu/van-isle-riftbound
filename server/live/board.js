// board.js -- the Trade board (plan 2 M2, Mako 2026-11-01). It lives inside the
// Accounts Durable Object (accounts.js), because it is built from what sync
// already keeps: a phone's binders and Wishlist reach the server as sync items,
// and the board reads them there. There is nothing separate to publish.
//
// WHAT A PLAYER SHARES: a binder marked For trade (its "trade" field is true)
// is their HAVE list; their Wishlist, when Share your Wishlist is on (the
// synced store vir.board.v1, { wish: true }), is their WANT list. Only a saved
// account (one with a passkey) is shown to others: an unsaved one costs
// nothing to make. Others see the card, its printing and the count; never the
// price paid, condition, grade or dates.
//
// WHAT A PLAYER SEES: the board matches both ways (prior art: Steam Trade
// Matcher and WeWard's reverse matching, where a match that runs both ways is
// far more likely to become a trade). "They have" is what others share that is
// on your Wishlist; "they want" is what others want from your For trade
// binders. Your own lists count for your matches whether or not you share
// them. The same card in another printing counts as Other printing. Players
// matching both ways come first, then those in your home area, then the most
// cards. Never a rank, rating or record of a player: the board lists cards.
//
// ON THE SERVER: table board (acct, s side h or w, i product id, f finish, q
// count, pub 1 when others may see it), rebuilt for an account whenever sync
// changes its collection or vir.board.v1, and when the account is saved. The
// match is two indexed joins against the viewer's own rows. A trader is named
// to others by a handle (24 hex, from the account id and a fixed word), never
// the account id.

export const BOARD_KEYS = ["vir.coll.v1", "vir.board.v1"];
export const BOARD = { side: 2000, traders: 100, browse: 3000, perCard: 40 };

function J(s) { try { return JSON.parse(s); } catch (e) { return null; } }

// a printing's name (Normal, Foil): letters, digits, spaces and hyphens only (the security scan, 2026-11-01)
function cleanFinish(f) {
  return typeof f === "string" && f.length <= 60 && /^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(f) ? f : null;
}
// one list of holdings into { "i|f": q }, adding counts; anything not a checked holding is dropped
function addList(into, list) {
  (Array.isArray(list) ? list : []).forEach((h) => {
    if (!h || typeof h !== "object") return;
    const i = typeof h.i === "string" && /^\d{1,12}$/.test(h.i) ? Number(h.i) : h.i;
    const q = typeof h.q === "string" && /^\d{1,6}$/.test(h.q) ? Number(h.q) : h.q;
    const f = cleanFinish(h.f);
    if (!(Number.isSafeInteger(i) && i > 0) || !(Number.isSafeInteger(q) && q >= 1) || !f) return;
    const k = i + "|" + f;
    into[k] = Math.min(9999, (into[k] || 0) + q);
  });
}

// An account's synced items -> its board rows. items: [{ k, id, d }] (d is the item's text).
// saved: the account has a passkey. Returns [{ s, i, f, q, pub }], each side capped at BOARD.side.
export function rowsFrom(items, saved) {
  const have = {}, want = {};
  let shareWish = false;
  (items || []).forEach((x) => {
    if (!x || typeof x.d !== "string") return;
    if (x.k === "vir.board.v1" && x.id === "all") { const v = J(x.d); shareWish = !!(v && v.wish === true); }
    if (x.k !== "vir.coll.v1") return;
    if (/^p:/.test(x.id)) { const p = J(x.d); if (p && p.trade === true) addList(have, p.items); }
    else if (x.id === "wish") addList(want, J(x.d));
  });
  const out = [];
  function put(s, o, pub) {
    Object.keys(o).slice(0, BOARD.side).forEach((k) => {
      const at = k.indexOf("|");
      out.push({ s: s, i: Number(k.slice(0, at)), f: k.slice(at + 1), q: o[k], pub: pub ? 1 : 0 });
    });
  }
  put("h", have, saved);
  put("w", want, saved && shareWish);
  return out;
}

// the name a trader goes by on the board: a handle made from the account id, never the id itself
export async function handleOf(acctId) {
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ravi-board|" + acctId)));
  return Array.from(b.slice(0, 12)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

// What one viewer sees. db: the accounts store; me: the viewer's account id.
// pub(acct): the public face of a trader { name, user, area, col, pic } (accounts.js builds it; col: their colour, plan 2 M8).
// skip: accounts this viewer never sees, both ways (a block, reports.js).
export async function boardFor(db, me, face, skip) {
  const out = (r) => !(skip && skip.has(r.acct));
  const mine = db.boardRows(me);
  const myHave = {}, myWant = {};
  mine.forEach((r) => { (r.s === "h" ? myHave : myWant)[r.i + "|" + r.f] = r.q; });
  const wantIds = {}, haveIds = {};
  mine.forEach((r) => { (r.s === "h" ? haveIds : wantIds)[r.i] = 1; });
  const T = new Map(); // acct -> { has: [], wants: [] }
  function t(acct) { let x = T.get(acct); if (!x) { x = { has: [], wants: [] }; T.set(acct, x); } return x; }
  // they have what you want: exact printing, or the same card in another printing
  db.boardMatch("h", "w", me).filter(out).forEach((r) => { t(r.acct).has.push({ i: r.i, f: r.f, q: r.q, alt: myWant[r.i + "|" + r.f] ? 0 : 1 }); });
  // they want what you have
  db.boardMatch("w", "h", me).filter(out).forEach((r) => { t(r.acct).wants.push({ i: r.i, f: r.f, q: r.q, alt: myHave[r.i + "|" + r.f] ? 0 : 1 }); });
  // Browse: everything others share for trade, a capped page
  const browse = db.boardShared(me, BOARD.browse).filter(out);
  browse.forEach((r) => { if (!T.has(r.acct)) T.set(r.acct, { has: [], wants: [], browseOnly: true }); });

  const myArea = face(me).area || "";
  const exact = (l) => l.filter((x) => !x.alt).length;
  const traders = [];
  for (const [acct, x] of T) {
    const f = face(acct);
    const two = exact(x.has) > 0 && exact(x.wants) > 0 ? 1 : 0;
    traders.push({ acct: acct, h: await handleOf(acct), name: f.name, user: f.user, area: f.area, col: f.col || "", pic: f.pic, open: f.open || "trade", pct: f.pct || 100, dk: f.dk || 0, nx: f.nx || null,
      has: x.has, wants: x.wants, two: two, near: myArea && f.area === myArea ? 1 : 0, n: x.has.length + x.wants.length });
  }
  traders.sort((a, b) => b.two - a.two || b.near - a.near || b.n - a.n || (a.h < b.h ? -1 : 1));
  const keep = traders.slice(0, BOARD.traders + 400); // matches first, then those only in Browse
  const hOf = new Map(keep.map((x) => [x.acct, x.h]));
  return {
    v: 1,
    me: { area: myArea, have: Object.keys(myHave).length, want: Object.keys(myWant).length },
    traders: keep.filter((x) => x.n > 0).slice(0, BOARD.traders).map((x) => ({ h: x.h, name: x.name, user: x.user, area: x.area, col: x.col, pic: x.pic, open: x.open, pct: x.pct, two: x.two, near: x.near, has: x.has, wants: x.wants })),
    people: keep.map((x) => ({ h: x.h, name: x.name, user: x.user, area: x.area, col: x.col, pic: x.pic, open: x.open, pct: x.pct, dk: x.dk, nx: x.nx })), // dk: their Public decks (decks.js, plan 2 M3); nx: their next event (block 5)
    browse: browse.filter((r) => hOf.has(r.acct)).map((r) => ({ h: hOf.get(r.acct), i: r.i, f: r.f, q: r.q })),
    // how many other players want each card (a shared Wishlist): demand that is RAVI's own (board/demand.js)
    wanted: db.boardWanted(me, BOARD.browse).map((r) => ({ i: r.i, f: r.f, n: r.n }))
  };
}
