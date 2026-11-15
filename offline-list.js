// offline-list.js -- writes offline.json, the list of files the service worker (alerts-sw.js) keeps
// as the app's offline copy (plan 2 M10 block 3). Run it after adding a page, a script, a font, an
// icon, a picture or a data file:  node offline-list.js     (rb-tools p2m10d checks it is current).
// The list: the hub and every page folder (by its slash form), every local file their pages load
// (script src, link href, img src), and the files pages read by script: data/*.json, data/marks,
// cards/*.json and *.js, cards/backs, glyphs and runes, docs (Riot's rules PDFs, fetch-core-rules.js), fonts,
// icons, img, and the scripts pages load
// on demand (tour.js, qr.js, qrscan.js). Never data/log, data/hist,
// the .ics feeds, card art (the worker saves art as it is seen), the worker itself or this list.
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = __dirname;

function exists(rel) { try { return fs.statSync(path.join(ROOT, rel)).isFile(); } catch (e) { return false; } }
function walk(dir) {
  const out = [];
  let names = [];
  try { names = fs.readdirSync(path.join(ROOT, dir)); } catch (e) { return out; }
  names.forEach(function (n) {
    if (n[0] === ".") { return; }
    const rel = dir ? dir + "/" + n : n, st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) { walk(rel).forEach(function (x) { out.push(x); }); } else { out.push(rel); }
  });
  return out;
}
function skip(rel) {
  return /^data\/(log|hist|ev|store|town)\//.test(rel) || /\.ics$/.test(rel) || /^cards\/art\//.test(rel)
    || rel === "alerts-sw.js" || rel === "offline.json";
}

function build() {
  const pages = [""];
  fs.readdirSync(ROOT).sort().forEach(function (n) {
    if (n[0] !== "." && fs.statSync(path.join(ROOT, n)).isDirectory() && exists(n + "/index.html")) { pages.push(n + "/"); }
  });
  const files = {};
  pages.forEach(function (p) {
    files[p] = 1;
    const html = fs.readFileSync(path.join(ROOT, p + "index.html"), "utf8");
    const re = /(?:src|href)\s*=\s*"([^"#?]+)(?:[?#][^"]*)?"/g;
    let m;
    while ((m = re.exec(html))) {
      const ref = m[1];
      if (/^[a-z]+:/i.test(ref) || ref.indexOf("//") === 0) { continue; }
      const rel = path.posix.normalize(path.posix.join(p, ref)).replace(/^\.\//, "");
      if (rel.indexOf("..") === 0) { continue; }
      if (/\/$/.test(rel) || rel === ".") { continue; }   // a link to a page: the pages are listed already
      if (exists(rel) && !skip(rel)) { files[rel] = 1; }
    }
  });
  fs.readdirSync(path.join(ROOT, "data")).forEach(function (n) { if (/\.json$/.test(n)) { files["data/" + n] = 1; } });
  ["data/marks", "cards/backs", "cards/glyphs", "cards/runes", "docs", "fonts", "icons", "img"].forEach(function (d) {
    walk(d).forEach(function (rel) { if (!skip(rel)) { files[rel] = 1; } });
  });
  fs.readdirSync(path.join(ROOT, "cards")).forEach(function (n) { if (/\.(json|js)$/.test(n)) { files["cards/" + n] = 1; } });
  ["manifest.webmanifest", "fonts.css", "app.css", "pages.js", "account.js", "tour.js", "qr.js", "qrscan.js"].forEach(function (rel) { if (exists(rel)) { files[rel] = 1; } });
  const list = Object.keys(files).sort(function (a, b) {
    const pa = pages.indexOf(a) > -1 ? 0 : 1, pb = pages.indexOf(b) > -1 ? 0 : 1;
    return (pa - pb) || (a < b ? -1 : a > b ? 1 : 0);
  });
  return { note: "The files the service worker keeps as the offline copy. Written by offline-list.js; never by hand.", files: list };
}

if (require.main === module) {
  const out = JSON.stringify(build(), null, 1) + "\n";
  fs.writeFileSync(path.join(ROOT, "offline.json"), out);
  console.log("offline.json: " + build().files.length + " files");
} else {
  module.exports = { build: build };
}
