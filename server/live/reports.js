// reports.js -- report, block and Mako's Reports queue on the Trade board (plan 2 M2 block 3, Mako
// 2026-11-01: 'Everything sounds good! You can probably drop it to 2 blocks to hide'). Inside the
// Accounts Durable Object (accounts.js), beside the board and offers it guards.
//
// REPORT (prior art: Mastodon's report flow, a reason and a block in the same step, and a moderator
// queue grouped by player; patterns only): a saved account picks what is wrong with another player,
// one of REPORT.why, with no free text. One report per reporter per player: reporting again changes
// the reason. Nobody but Mako sees a report or any count of them; it is never a rating. A picture
// reported by REPORT.hide different players (accounts REPORT.oldDays old) is hidden from everyone else at once, until Mako decides.
// Reports Mako has not decided are gone after REPORT.keepDays. "deck" (plan 2 M3): a shared deck, its name or
// note; Mako can take the player's shared decks down (decks.js).
//
// BLOCK (Instagram's and OfferUp's silent block): the two players leave each other's board, no offer
// goes either way, an open offer between them closes and an agreed one is called off. The blocked
// player is not told: to them the other is simply not on the board. Unblock from Trade board
// settings. At most BLOCK.max blocks an account.
//
// MAKO'S QUEUE (an account in the Worker variable ADMIN, as Disputes): each reported player once,
// with the reasons and who sent them. Remove picture, Clear name and username, Take off the board
// (their shares are hidden, they cannot send offers and their open offers close; their Trade board
// tells them), Put back, Dismiss.

// oldDays: a report counts toward the instant hide only from an account this many days old (the security scan, 2026-11-01)
export const REPORT = { why: ["pic", "name", "offers", "trade", "other", "deck"], hide: 2, oldDays: 3, keepDays: 90 };
export const BLOCK = { max: 500 };

export function cleanWhy(v) { return REPORT.why.indexOf(v) >= 0 ? v : null; }

// how an offer ends when one of its players (who) walks away from it: by a block, or by being taken off
// the board. An open offer they sent is withdrawn, one sent to them declined; an agreed trade is called off.
export function closeFor(o, who, now) {
  if (o.st === "open") return Object.assign({}, o, { st: o.a === who ? "withdrawn" : "declined", upd: now });
  if (o.st === "accepted") return Object.assign({}, o, { st: "cancelled", upd: now });
  return null;
}

// the queue: reports grouped by the player reported, newest first. reps: [{ by, who, why, at }]
export function queueOf(reps) {
  const by = new Map();
  reps.forEach((r) => {
    let x = by.get(r.who);
    if (!x) { x = { who: r.who, why: {}, from: [], at: 0 }; by.set(r.who, x); }
    x.why[r.why] = (x.why[r.why] || 0) + 1;
    x.from.push(r.by);
    if (r.at > x.at) x.at = r.at;
  });
  return Array.from(by.values()).sort((a, b) => b.at - a.at);
}
