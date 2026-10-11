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

console.log(failures ? failures + " FAILED" : "all feed checks passed");
process.exit(failures ? 1 : 0);
