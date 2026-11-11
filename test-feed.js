"use strict";

// Fixture checks for the source scanner (from M9). Runs before every feed
// read. The messages below copy the shapes Discord's API gives (2026-10):
// a followed post (a crosspost, flag 2), a post forwarded by hand
// (message_snapshots), and a plain message. A failure here means the
// parsing changed underneath us.

const assert = require("assert");
const ff = require("./fetch-feed");

let failures = 0;
function check(name, fn) {
  try { fn(); console.log("PASS " + name); }
  catch (err) { failures += 1; console.log("FAIL " + name + ": " + err.message); }
}

const followed = { id: "3", timestamp: "2026-10-10T17:00:00.000+00:00", flags: 2,
  content: "Server news! Radiance errata is out: https://playriftbound.com/en-US/news/announcements/radiance-errata-updates?utm=x and our own stream https://twitch.tv/someone",
  embeds: [{ url: "https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/" }] };
const forwarded = { id: "2", timestamp: "2026-10-11T07:44:00.000+00:00", flags: 16384, content: "",
  message_reference: { type: 1 },
  message_snapshots: [{ message: { content: "Pre-Rifts start soon https://riot.com/4hPddsy.", timestamp: "2026-10-09T03:00:00.000+00:00", embeds: [] } }] };
const plain = { id: "1", timestamp: "2026-10-01T20:00:00.000+00:00", flags: 0, content: "hello https://www.facebook.com/playriftbound/posts/abc" };

check("links: punctuation trimmed, each once", function () {
  assert.deepStrictEqual(ff.linksOf("see https://riot.com/a. and (https://riot.com/a) and https://x.io/b!"), ["https://riot.com/a", "https://x.io/b"]);
});

check("norm: one spelling per page", function () {
  assert.strictEqual(ff.norm("https://www.PlayRiftbound.com/en-US/News/x?y=1#z"), "https://playriftbound.com/en-us/news/x/");
  assert.strictEqual(ff.norm("https://m.facebook.com/playriftbound/posts/abc/"), "https://facebook.com/playriftbound/posts/abc");
});

check("only Riot's own places count", function () {
  assert.ok(ff.isRiot("https://playriftbound.com/en-us/news/"));
  assert.ok(ff.isRiot("https://riot.com/3Umpltb"));
  assert.ok(ff.isRiot("https://www.facebook.com/playriftbound/posts/abc"));
  assert.ok(!ff.isRiot("https://www.facebook.com/someoneelse/posts/abc"));
  assert.ok(!ff.isRiot("https://twitch.tv/someone"));
  assert.ok(!ff.isRiot("https://notplayriftbound.com/x"));
});

check("shapes: followed, forwarded, plain", function () {
  assert.deepStrictEqual([followed, forwarded, plain].map(ff.shapeOf), ["followed", "forwarded", "plain"]);
});

check("Discord gives Riot links and the day, never the server's words", function () {
  const items = ff.itemsFromDiscord([followed, forwarded, plain]);
  assert.deepStrictEqual(items.map(function (i) { return i.kind + "|" + i.url + "|" + i.posted + "|" + i.shape; }), [
    "rules|https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/|2026-10-10|followed",
    "announcement|https://riot.com/4hPddsy|2026-10-08|forwarded",
    "announcement|https://facebook.com/playriftbound/posts/abc|2026-10-01|plain"]);
  assert.ok(JSON.stringify(items).indexOf("Server news") === -1);
});

check("Muse: the agreed shape is checked", function () {
  assert.strictEqual(ff.checkMuse({ run: "2026-10-10", posts: [] }), "");
  assert.ok(ff.checkMuse({ run: "2026-10-10" }));
  assert.ok(ff.checkMuse({ run: "2026-10-10", posts: [{ source: "Riftbound", url: "u", text: "t", kind: "meme" }] }));
});

check("Muse: posts kept word for word and credited, with their Riot links", function () {
  const it = ff.itemsFromMuse({ run: "2026-10-10", posts: [{ source: "Riftbound", url: "https://www.facebook.com/playriftbound/posts/pfbid0X",
    posted: "2026-10-09", kind: "product", text: "Pre-Rifts start October 16! Find one: https://riot.com/4hPddsy" }] });
  assert.deepStrictEqual(it, [{ id: "fb:https://facebook.com/playriftbound/posts/pfbid0X", kind: "product", url: "https://facebook.com/playriftbound/posts/pfbid0X",
    posted: "2026-10-09", source: "Riftbound", credit: "Riot, on Facebook", text: "Pre-Rifts start October 16! Find one: https://riot.com/4hPddsy",
    via: ["muse"], links: ["https://riot.com/4hPddsy"] }]);
});

check("digest (ravi-news, 2026-11-08): tier and reveal pass, local left out, links and credit kept", function () {
  const d = { run: "2026-11-08", posts: [
    { source: "Riftbound", url: "https://www.instagram.com/p/DfX2L-YgTqu/", posted: "2026-11-05", tier: "official", kind: "reveal", text: "swipe for a Mech surprise",
      links: ["https://www.instagram.com/p/DfX2L-YgTqu/", "https://www.facebook.com/playriftbound/posts/pfbid0R"] },
    { source: "Skyhaven", url: "https://facebook.com/groups/1289633928950754/permalink/1", posted: "2026-11-07", tier: "local", kind: "event", text: "Nexus Night" }] };
  assert.strictEqual(ff.checkMuse(d), "");
  assert.ok(ff.checkMuse({ run: "2026-11-08", posts: [{ source: "x", url: "u", text: "t", kind: "event", tier: "rumour" }] }));
  assert.deepStrictEqual(ff.itemsFromMuse(d), [{ id: "fb:https://instagram.com/p/DfX2L-YgTqu", kind: "reveal", url: "https://instagram.com/p/DfX2L-YgTqu",
    posted: "2026-11-05", source: "Riftbound", credit: "Riot, on Instagram", text: "swipe for a Mech surprise", via: ["muse"],
    links: ["https://facebook.com/playriftbound/posts/pfbid0R"] }]);
});

check("local (plan 2 M9): a store's post by the store's name, standings never read, no words kept", function () {
  const d = { run: "2026-11-09", posts: [
    { source: "Skyhaven Games Riftbound (League of Legends) Group", url: "https://facebook.com/groups/1/permalink/2/", posted: "2026-11-09", tier: "local", kind: "announcement", text: "Deck submissions are open." },
    { source: "Skyhaven Games Riftbound (League of Legends) Group", url: "https://facebook.com/groups/1/permalink/3/", tier: "local", kind: "event", text: "Nexus Night Standings 1st - A B (3-0) 2nd - C D (2-1)" },
    { source: "Riftbound", url: "https://www.facebook.com/playriftbound/posts/x", kind: "product", text: "official" }] };
  const l = ff.localFromMuse(d);
  assert.deepStrictEqual(l, [{ id: "fb:https://facebook.com/groups/1/permalink/2", kind: "local", tier: "local", url: "https://facebook.com/groups/1/permalink/2",
    posted: "2026-11-09", source: "Skyhaven Games", credit: "Skyhaven Games, on Facebook", text: "Deck submissions are open.", via: ["muse"] }]);
  assert.strictEqual(ff.storeOf("Colossal Cards and Collectables Victoria"), "Colossal Cards and Collectables Victoria");
  assert.strictEqual(ff.isStandings("Our first Radiance Skirmish is on the 15th at 5 PM"), false);
  assert.deepStrictEqual(ff.strip(l), [], "no summary and no hold: not written");
  l[0].sum = "A summary.";
  assert.strictEqual(ff.strip(l)[0].text, undefined);
  assert.deepStrictEqual(ff.readLocal('{"skip": true}'), { skip: true });
  assert.deepStrictEqual(ff.readLocal('{"title": "A", "summary": "B.", "until": null}'), { title: "A", sum: "B." });
  assert.deepStrictEqual(ff.readLocal('{"title": "A", "summary": "B.", "until": "2026-11-15"}'), { title: "A", sum: "B.", until: "2026-11-15" });
  assert.deepStrictEqual(ff.readLocal('{"title": "A", "summary": "B.", "until": "soon"}'), { title: "A", sum: "B." });
  assert.throws(function () { ff.readLocal('{"title": "A"}'); });
});

check("merge: the same Riot post from both places is one item, newest first", function () {
  const d = ff.itemsFromDiscord([forwarded, plain]);
  const m = ff.itemsFromMuse({ run: "2026-10-10", posts: [{ source: "Riftbound", url: "https://www.facebook.com/playriftbound/posts/pfbid0X",
    posted: "2026-10-09", kind: "product", text: "Find one: https://riot.com/4hPddsy" }] });
  const out = ff.merge([], d.concat(m));
  assert.deepStrictEqual(out.map(function (i) { return i.id + "|" + i.via.join("+"); }), [
    "fb:https://facebook.com/playriftbound/posts/pfbid0X|discord+muse",
    "link:https://facebook.com/playriftbound/posts/abc|discord"]);
  assert.deepStrictEqual(ff.merge(out, d.concat(m)), out);
});

check("a summary cut off at the cap keeps its headline, summary and the dates that arrived whole (plan 2 M8.7 C2)", function () {
  const cut = '{"title": "Riftbound 2026 Drawings and Bundles Coming Soon", "summary": "Riot is holding online drawings for the K/DA bundle. Entries open November 12.", "dates": [' +
    '{"what": "entries open", "label": "K/DA drawing opens", "from": "2026-11-12", "to": null}, ' +
    '{"what": "entries close", "label": "K/DA drawing closes", "from": "2026-11-16", "to": null}, ' +
    '{"what": "drawing", "label": "Winners dra';
  const r = ff.readPartial(cut);
  assert.strictEqual(r.title, "Riftbound 2026 Drawings and Bundles Coming Soon");
  assert.strictEqual(r.sum, "Riot is holding online drawings for the K/DA bundle. Entries open November 12.");
  assert.deepStrictEqual(r.dates, [{ what: "entries open", label: "K/DA drawing opens", from: "2026-11-12" }, { what: "entries close", label: "K/DA drawing closes", from: "2026-11-16" }]);
  const many = '{"title": "T", "summary": "S with a \\"quote\\" inside.", "dates": [' +
    [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '{"what": "event", "label": "E' + n + '", "from": "2026-12-0' + n + '", "to": null}'; }).join(", ") + ', {"what": "ev';
  const m = ff.readPartial(many);
  assert.strictEqual(m.sum, 'S with a "quote" inside.');
  assert.strictEqual(m.dates.length, 6, "six dates at most, the soonest first");
  assert.strictEqual(m.dates[5].from, "2026-12-06");
  assert.throws(function () { ff.readPartial('{"title": "Only a headline", "summary": "Cut off bef'); }, /no title or summary/);
  assert.throws(function () { ff.readPartial("Sorry, I cannot"); });
  assert.deepStrictEqual(ff.readPartial('{"title": "A", "summary": "B.", "dates": []}'), ff.readReply('{"title": "A", "summary": "B.", "dates": []}'), "a whole reply reads the same");
});

console.log(failures ? failures + " FAILED" : "all feed checks passed");
process.exit(failures ? 1 : 0);
