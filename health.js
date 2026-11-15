// health.js -- the heartbeat of the data refreshes (plan 2 M10 block 2, 2026-11-14).
//
// A file's own stamp cannot say a refresh is down: News, Rules and the Tier list commit only when
// something changed, so their stamps look old on a good day. This asks GitHub for each refresh's
// last successful run and writes data/health.json:
//   { v: 1, at: <when this ran>, feeds: { events, prices, feed, rules, tier, cards: <ISO time> } }
// The pages read it through pages.js RAVI_STALE. Run by .github/workflows/health.yml once a day.
//
// Never a false alarm: if GitHub cannot be read for any refresh, nothing is written and the run
// fails, the last good file stays, and once that file is two days old the pages stop trusting it.
// A refresh's time never goes backwards.
//
// Usage: node health.js            (in Actions: GITHUB_REPOSITORY and GITHUB_TOKEN are set)
"use strict";
const fs = require("fs");
const path = require("path");

// each feed and the workflow file that refreshes it
const FEEDS = { events: "fetch.yml", prices: "prices.yml", feed: "feed.yml", rules: "rules.yml", tier: "tier.yml", cards: "cards.yml" };
const OUT = path.join(__dirname, "data", "health.json");

function iso(x) {
  if (typeof x !== "string" || !x) { return null; }
  const t = Date.parse(x);
  return isNaN(t) ? null : new Date(t).toISOString();
}

// The time of the last good run in one answer from
// GET /repos/<repo>/actions/workflows/<file>/runs?status=success&per_page=5
// (when the run ended; its start if GitHub gives no end). null when the answer holds none.
function lastGood(answer) {
  const runs = answer && Array.isArray(answer.workflow_runs) ? answer.workflow_runs : null;
  if (!runs) { return null; }
  let best = null;
  runs.forEach(function (r) {
    if (!r || r.status !== "completed" || r.conclusion !== "success") { return; }
    const t = iso(r.updated_at) || iso(r.run_started_at) || iso(r.created_at);
    if (t && (!best || t > best)) { best = t; }
  });
  return best;
}

// answers: { <feed>: GitHub's answer }; now: a Date; prev: the health file as it stands, or null.
// Returns the new file, or throws when a feed's answer is missing or unreadable.
function build(answers, now, prev) {
  const feeds = {};
  const was = prev && prev.feeds && typeof prev.feeds === "object" ? prev.feeds : {};
  Object.keys(FEEDS).forEach(function (k) {
    const a = answers ? answers[k] : null;
    if (!a || !Array.isArray(a.workflow_runs)) { throw new Error("no answer for " + k + " (" + FEEDS[k] + ")"); }
    let t = lastGood(a);
    const old = iso(was[k]);
    if (old && (!t || old > t)) { t = old; }           // never backwards; a refresh with no good run yet keeps what was known
    if (t) { feeds[k] = t; }
  });
  return { v: 1, at: now.toISOString(), feeds: feeds };
}

async function ask(repo, file, token) {
  const url = "https://api.github.com/repos/" + repo + "/actions/workflows/" + file + "/runs?status=success&per_page=5";
  const h = { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "ravi-health" };
  if (token) { h.Authorization = "Bearer " + token; }
  const r = await fetch(url, { headers: h });
  if (!r.ok) { throw new Error(file + ": GitHub answered " + r.status); }
  return r.json();
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY || "beifongshopmail-cpu/van-isle-riftbound";
  const token = process.env.GITHUB_TOKEN || "";
  const answers = {};
  for (const k of Object.keys(FEEDS)) { answers[k] = await ask(repo, FEEDS[k], token); }
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) { prev = null; }
  const out = build(answers, new Date(), prev);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
  Object.keys(out.feeds).forEach(function (k) { console.log(k + ": last good run " + out.feeds[k]); });
}

module.exports = { FEEDS: FEEDS, lastGood: lastGood, build: build };

if (require.main === module) {
  main().catch(function (e) { console.error("health: " + e.message + "; data/health.json left as it was"); process.exit(1); });
}
