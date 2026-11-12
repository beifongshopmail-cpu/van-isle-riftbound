// notify.js -- the scheduled alerts for ravi-live (plan 2 M9 block 6; Mako's yes 2026-11-12).
// Once an hour the Worker's schedule asks the Accounts object to run (accounts.js tick). It reads
// RAVI's own data files on ravi.tools and tells a saved account's phones, each by the kinds it
// turned on: a Wishlist card's price move (w), a new event from a store or area it follows (f),
// a new Notice on the admin's account (n). Trade offers (o) go at once from accounts.js, as before.
// Nothing here goes out in quiet hours (QUIET, island time); the next run after them sends what
// waited. Each thing is told once: the prices told are kept per account and card, the events and
// notices seen are kept once for everyone. Pure functions here; the storage is accounts.js's.

export const KINDS = ["o", "w", "f", "n"]; // trade offers, Wishlist prices, stores you follow, Notices
export const QUIET = { from: 22, to: 9 }; // 10 PM to 9 AM on the island
export const WISH = { pct: 0.10, min: 1, show: 3 }; // a move of 10% and at least $1; three cards named in one alert
export const SEND_MAX = 40; // pushes per run or alarm (the free plan's subrequests; the rest go on the alarm)
const TZ = "America/Vancouver";

// the hour on the island, 0 to 23
export function islandHour(now) {
  const h = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date(now));
  return parseInt(h, 10) % 24;
}
export function islandDay(now) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}
export function quiet(now) { const h = islandHour(now); return h >= QUIET.from || h < QUIET.to; }

// the calendar feed file an event belongs to (calendar/index.html storeFile)
export function storeFile(e) {
  return String(e.sid !== null && e.sid !== undefined ? e.sid : (e.venue + "-" + e.city)).replace(/[^A-Za-z0-9_-]/g, "") + ".ics";
}
// files: the calendar feeds an account follows (vir.follow.v1's item ids without "f:")
export function follows(files, e) {
  if (!files || !files.length) return false;
  if (files.indexOf("island.ics") >= 0) return true;
  if (e.region === "victoria" && files.indexOf("victoria.ics") >= 0) return true;
  if (e.region === "island" && files.indexOf("upisland.ics") >= 0) return true;
  return files.indexOf("store/" + storeFile(e)) >= 0;
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dayWords(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ""));
  if (!m) return "";
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return WD[d.getUTCDay()] + ", " + MO[+m[2] - 1] + " " + (+m[3]);
}

// the events in this file that the last run had not seen and have not passed
export function freshEvents(list, seen, today) {
  const had = new Set(seen || []);
  return (Array.isArray(list) ? list : []).filter((e) => e && typeof e.id === "string" && !e.sim && !e.visit && typeof e.day === "string" && e.day >= today && !had.has(e.id));
}
export function eventMsg(list, site) {
  if (!list.length) return null;
  if (list.length === 1) {
    const e = list[0];
    return { title: "New event at " + e.venue, body: [e.name, dayWords(e.day), e.time].filter(Boolean).join(", "), url: site + "calendar/?day=" + e.day, tag: "ravi-events" };
  }
  const names = [];
  list.forEach((e) => { if (names.indexOf(e.venue) < 0) names.push(e.venue); });
  const shown = names.length > 3 ? names.slice(0, 2).join(", ") + " and " + (names.length - 2) + " more" : names.join(", ");
  return { title: list.length + " new events at stores you follow", body: shown, url: site + "calendar/", tag: "ravi-events" };
}

function money(v, cur) {
  return "$" + (v >= 100 ? String(Math.round(v)) : v.toFixed(2));
}
// the account's Wishlist against the prices file. told: { "<i>|<f>": usd } as told before.
// Returns the moves to tell and the prices to keep as told (a card seen first keeps yesterday's
// price, so its first alert is a real day's move).
export function wishMoves(wish, prices, told, cur) {
  const byId = new Map();
  ((prices && prices.cards) || []).forEach((c) => { if (c && c.i != null) byId.set(Number(c.i), c); });
  const fx = cur === "USD" ? 1 : Number(prices && prices.fx && prices.fx.rate) || 1;
  const moves = [], keep = {}, seen = new Set();
  (Array.isArray(wish) ? wish : []).forEach((h) => {
    const c = h && byId.get(Number(h.i)), f = h && typeof h.f === "string" ? h.f : "Normal";
    const key = (h && h.i) + "|" + f;
    if (!c || seen.has(key)) return;
    seen.add(key);
    const p = c.p && Number(c.p[f]);
    if (!(p > 0)) return;
    let was = told[key];
    if (!(was > 0)) { const y = c.a && c.a["1"] && Number(c.a["1"][f]); was = y > 0 ? y : p; keep[key] = was; }
    const pct = (p - was) / was;
    if (Math.abs(pct) >= WISH.pct && Math.abs(p - was) * fx >= WISH.min) {
      moves.push({ name: c.n + (f !== "Normal" ? " (" + f + ")" : ""), pct: pct, now: p * fx });
      keep[key] = p;
    }
  });
  moves.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  return { moves: moves, keep: keep, cards: Array.from(seen) };
}
export function wishMsg(moves, cur, site) {
  if (!moves.length) return null;
  const lines = moves.slice(0, WISH.show).map((m) => m.name + " " + (m.pct < 0 ? "down" : "up") + " " + Math.round(Math.abs(m.pct) * 100) + "% to " + money(m.now, cur) + ".");
  if (moves.length > WISH.show) lines.push("And " + (moves.length - WISH.show) + " more.");
  return { title: "Wishlist: " + moves.length + (moves.length === 1 ? " price moved" : " prices moved"), body: lines.join(" "), url: site + "collection/?view=wish", tag: "ravi-wish" };
}

export function noticeMsg(items, site) {
  if (!items.length) return null;
  return { title: items.length === 1 ? "RAVI notice" : items.length + " RAVI notices", body: String(items[0].text || "").slice(0, 160), url: site + "?notices=1", tag: "ravi-notice" };
}
