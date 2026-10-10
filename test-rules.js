"use strict";

// Fixture checks for the rules watcher (from M9). Runs before every rules fetch.
// The snippets below copy the shapes Riot's rules articles use (2025-10 to
// 2026-10): bold or heading labels around errata, accordion questions, bold
// questions in running text, the Rules Hub's sections. A failure here means
// the parsing changed underneath us.

const assert = require("assert");
const fr = require("./fetch-rules");

let failures = 0;
function check(name, fn) {
  try { fn(); console.log("PASS " + name); }
  catch (err) { failures += 1; console.log("FAIL " + name + ": " + err.message); }
}
function rich(html) { return [{ type: "rich", html: fr.sanitize(html) }]; }

check("sanitize keeps words and drops styles, editor links and empty tags", function () {
  const s = fr.sanitize('<p><a target="_blank" href="https://cms.riotgames.com/news/intent/edit/x"><meta></a></p>' +
    '<h2 style="text-align:center;">Elnuk Herd</h2><p class="x">Give <strong>+3 [M]</strong>.<em> </em>Then go.</p>' +
    '<script>bad()</script><p><a href="https://playriftbound.com/en-us/rules-hub/">Rules Hub</a><a href="https://x.io/a.pdf"> </a>(updated)</p>');
  assert.strictEqual(s, '<h2>Elnuk Herd</h2><p>Give <strong>+3 [M]</strong>. Then go.</p>' +
    '<p><a href="https://playriftbound.com/en-us/rules-hub/">Rules Hub</a> (updated)</p>');
});

check("errata with bold labels and the up marker in one paragraph", function () {
  const e = fr.parseErrata(rich('<p>Hey Riftbounders!</p><h1>Radiance Cards</h1><h2>Elnuk Herd</h2>' +
    '<p><strong>[NEW TEXT]&nbsp;</strong></p><p>[Hidden] (Hide now for [A].)</p><p>Give a friendly unit +3 [M].</p>' +
    '<p>\u25b2<br><strong>[OLD TEXT]</strong></p><p>[Hidden] (Hide now for [A].)</p><p>Give another friendly unit +3 [M].</p><hr>' +
    '<h2>Last Caress</h2><p><strong>[NEW TEXT]</strong></p><p>New words.</p><p>\u25b2<br><strong>[OLD TEXT]</strong></p><p>Old words.</p>'));
  assert.strictEqual(e.length, 2);
  assert.deepStrictEqual(e[0], { group: "Radiance Cards", card: "Elnuk Herd",
    new: "<p>[Hidden] (Hide now for [A].)</p><p>Give a friendly unit +3 [M].</p>",
    old: "<p>[Hidden] (Hide now for [A].)</p><p>Give another friendly unit +3 [M].</p>" });
  assert.strictEqual(e[1].card, "Last Caress");
  assert.strictEqual(e[1].old, "<p>Old words.</p>");
});

check("errata with heading labels and a heading up marker", function () {
  const e = fr.parseErrata(rich('<h1>Origins Cards</h1><h1>Falling Star</h1><h5>[NEW TEXT]</h5><p>Deal 3 to a unit.</p>' +
    '<h4>\u25b2</h4><h5>[OLD TEXT]</h5><p>Do this twice:</p><hr><h1>Spiritforged Cards</h1><h1>Arise!</h1>' +
    '<h5>[NEW TEXT]</h5><p>Play a token.</p><h4>\u25b2</h4><h5>[OLD TEXT]</h5><p>Play tokens.</p>'));
  assert.deepStrictEqual(e.map(function (x) { return x.group + "/" + x.card + "/" + x.new + "/" + x.old; }), [
    "Origins Cards/Falling Star/<p>Deal 3 to a unit.</p>/<p>Do this twice:</p>",
    "Spiritforged Cards/Arise!/<p>Play a token.</p>/<p>Play tokens.</p>"]);
});

check("FAQ: accordion questions keep their section and group", function () {
  const f = fr.parseFaq([{ type: "acc", title: "SECTION 1", subtitle: "Scoring",
    groups: [{ q: "Q: How do I score?", a: "<p>You score 1 point.</p>" }] },
    { type: "acc", title: null, subtitle: "Movement", groups: [{ q: "Q: Can I move?", a: "<p>Yes.</p>" }] }]);
  assert.deepStrictEqual(f, [
    { kind: "faq", section: "SECTION 1", group: "Scoring", q: "Q: How do I score?", a: "<p>You score 1 point.</p>" },
    { kind: "faq", section: "SECTION 1", group: "Movement", q: "Q: Can I move?", a: "<p>Yes.</p>" }]);
});

check("FAQ: bold questions in running text, rulings under headings, the introduction left out", function () {
  const f = fr.parseFaq(rich('<p>Welcome to the FAQ.</p><h1>Revised and Clarified Rulings</h1><h2>Legion</h2>' +
    '<p>Legion now works like this.</p><p><strong>Before</strong></p><p>Old way.</p>' +
    '<h1>Frequently Asked Questions</h1><p><strong>What happens if you Brush a Brush?</strong></p><p>Nothing new.</p>' +
    '<p><strong>Q:</strong> Can I do it twice?</p><p>A: No.</p>'));
  assert.deepStrictEqual(f.map(function (x) { return x.kind + "|" + x.section + "|" + (x.title || x.q) + "|" + (x.html || x.a); }), [
    "ruling|Revised and Clarified Rulings|Legion|<p>Legion now works like this.</p><p><strong>Before</strong></p><p>Old way.</p>",
    "faq|Frequently Asked Questions|What happens if you Brush a Brush?|<p>Nothing new.</p>",
    "faq|Frequently Asked Questions|Q: Can I do it twice?|<p>A: No.</p>"]);
});

check("notice: Riot's own warning is kept", function () {
  const n = fr.notice(rich('<p><em>The below document may no longer reflect the rules.</em></p><p>Hi.</p>'));
  assert.strictEqual(n, "<p><em>The below document may no longer reflect the rules.</em></p>");
});

check("Rules Hub: legality lists and the two documents, other sections skipped", function () {
  const h = fr.parseHub(rich('<p>Intro.</p><h3>Constructed Format Legality</h3><p><i>Last updated: September 18, 2026</i></p>' +
    '<figure class="table"><table><tbody><tr><td><h4>Cards</h4><ul><li>Called Shot</li></ul></td></tr></tbody></table></figure>' +
    '<h3>Core Rules</h3><p><a href="https://cmsassets.rgpub.io/sanity/files/x/core.pdf">Core Rules</a> (<i>last updated: October 9, 2026</i>)</p>' +
    '<h3>Patch Notes</h3><ul><li><a href="https://playriftbound.com/en-us/news/x/">Notes</a></li></ul>'));
  assert.deepStrictEqual(h.map(function (x) { return x.kind + "|" + x.title + "|" + (x.url || ""); }), [
    "legal|Constructed Format Legality|", "doc|Core Rules|https://cmsassets.rgpub.io/sanity/files/x/core.pdf"]);
  assert.ok(h[0].html.indexOf("<table><tbody><tr><td><h4>Cards</h4><ul><li>Called Shot</li></ul></td></tr></tbody></table>") !== -1);
});

check("listings: errata and FAQ load, patch notes and ban lists wait, the rest is ignored", function () {
  function item(t, u) { return { title: t, publishedAt: "2026-10-09T16:00:00.000Z", action: { payload: { url: u } } }; }
  const p = fr.pickSources([{ blades: [{ items: [
    item("Radiance Errata Updates", "/en-us/news/announcements/radiance-errata-updates"),
    item("Vendetta Rules FAQ and Clarifications", "/en-us/news/rules-and-releases/vendetta-rules-faq-and-clarifications"),
    item("Riftbound: Origins Card Errata", "/en-us/news/rules-and-releases/riftbound-origins-card-errata"),
    item("Riftbound Radiance Drawing FAQ", "/en-us/news/announcements/product-drawing-faq/"),
    item("Core Rules: Vendetta Patch Notes", "/en-us/news/announcements/core-rules-vendetta-patch-notes"),
    item("Riftbound Tournament Rules", "/en-us/rules-hub/"),
    item("Deckbuilding Primer", "/en-us/news/rules-and-releases/deckbuilding-primer")] }] },
    { blades: [{ items: [item("Radiance Errata Updates", "https://playriftbound.com/en-us/news/announcements/radiance-errata-updates/")] }] }]);
  assert.deepStrictEqual(p.load.map(function (s) { return s.id + " " + s.path; }), [
    "errata-radiance /en-us/news/announcements/radiance-errata-updates/",
    "faq-vendetta /en-us/news/rules-and-releases/vendetta-rules-faq-and-clarifications/",
    "errata-origins /en-us/news/rules-and-releases/riftbound-origins-card-errata/"]);
  assert.deepStrictEqual(p.later.map(function (s) { return s.title; }), ["Core Rules: Vendetta Patch Notes"]);
});

check("ids are stable and unique; seen survives, changed moves only when the words do", function () {
  const src = { id: "faq-x", kind: "faq", set: "x" };
  const a = fr.itemsFor(src, [{ kind: "faq", group: "Combat", q: "Q: Same?", a: "<p>1</p>" }, { kind: "faq", group: "Combat", q: "Q: Same?", a: "<p>2</p>" }]);
  assert.deepStrictEqual(a.map(function (x) { return x.id; }), ["faq-x#combat~q-same", "faq-x#combat~q-same-2"]);
  const first = fr.stamp(a, null, "2026-10-10");
  const prev = { items: JSON.parse(JSON.stringify(first)) };
  const b = fr.itemsFor(src, [{ kind: "faq", group: "Combat", q: "Q: Same?", a: "<p>1</p>" }, { kind: "faq", group: "Combat", q: "Q: Same?", a: "<p>2, now changed</p>" }]);
  const second = fr.stamp(b, prev, "2026-10-20");
  assert.deepStrictEqual(second.map(function (x) { return x.seen + "/" + x.changed; }), ["2026-10-10/2026-10-10", "2026-10-10/2026-10-20"]);
});

console.log(failures ? failures + " FAILED" : "all rules checks passed");
process.exit(failures ? 1 : 0);
