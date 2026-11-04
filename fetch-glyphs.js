// fetch-glyphs.js (plan 2 M6 block 5, Mako's notes 2026-11-03)
// Riot's own symbols for card text: the Energy numbers in a circle (:rb_energy_1:), each domain's
// Power (:rb_rune_fury:), the rainbow any-domain Power (:rb_rune_rainbow:), Might (:rb_might:),
// Exhaust (:rb_exhaust:), and whatever else Riot's card gallery links from its glyph set. Zero
// dependencies. Riot's Riftbound tools policy requires card assets to come from Riot, so every
// file is downloaded from Riot's CDN and kept byte for byte.
//
// Where the names come from, so none is guessed:
//   1. every glyph URL written in Riot's card gallery page and its scripts, and
//   2. every :rb_<name>: token in the card text of cards/catalogue.json (the gallery draws token
//      <name> from <glyph set>/<name>.svg, as cards/runes already does for the domains).
// A name that answers with anything but a plain SVG is reported and skipped.
//
// Writes the files and a report (glyphs.md: each name, where it was found, its size) into
// GLYPHS_OUT (default cards/glyphs). It never writes data/ or any page.
//     node fetch-glyphs.js
'use strict';
var https = require('https');
var fs = require('fs');
var path = require('path');

var UA = 'VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)';
var GALLERY = 'https://riftbound.leagueoflegends.com/en-us/card-gallery';
var ORIGIN = 'https://riftbound.leagueoflegends.com';
var GLYPH_BASE = 'https://assetcdn.rgpub.io/public/live/riot-shared/player-experiences/riot-glyphs/rb/latest/';
var OUT = process.env.GLYPHS_OUT || path.join('cards', 'glyphs');
var MAX_SCRIPTS = 80;
var SLEEP_MS = 120;

// ---- pure parts (rb-tools p2m6i-test checks these offline) ----

// :rb_<name>: tokens in card text, as glyph names (no "rb_")
function tokenNames(cards) {
  var seen = {}, out = [];
  (cards || []).forEach(function (c) {
    var t = String((c && c.q) || '') + ' ' + String((c && c.x) || '');
    var re = /:rb_([a-z0-9_]+):/g, m;
    while ((m = re.exec(t))) { if (!seen[m[1]]) { seen[m[1]] = 1; out.push(m[1]); } }
  });
  return out.sort();
}

// glyph file names written in a page or script: <glyph set>/<name>.svg or .png
function glyphNames(text) {
  var seen = {}, out = [];
  var re = /riot-glyphs\/rb\/latest\/([A-Za-z0-9_-]+)\.(svg|png)/g, m;
  while ((m = re.exec(String(text || '')))) {
    var k = m[1] + '.' + m[2];
    if (!seen[k]) { seen[k] = 1; out.push(k); }
  }
  return out.sort();
}

// the scripts a Next.js page loads, as absolute URLs on Riot's own site
function scriptUrls(html) {
  var seen = {}, out = [];
  var re = /(?:src|href)="(\/_next\/static\/[^"]+\.js)"/g, m;
  while ((m = re.exec(String(html || '')))) {
    if (!seen[m[1]]) { seen[m[1]] = 1; out.push(ORIGIN + m[1]); }
  }
  return out;
}

// a plain SVG: starts as one, ends as one, no script, no external reference
function safeSvg(buf) {
  var s = Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf || '');
  if (s.length < 60 || s.length > 200000) { return false; }
  if (!/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(s) || !/<\/svg>\s*$/i.test(s)) { return false; }
  if (/<script|on[a-z]+\s*=|javascript:|<foreignObject|xlink:href\s*=\s*"(?!#)|href\s*=\s*"(?!#)/i.test(s)) { return false; }
  return true;
}

// ---- the network part (GitHub Actions only) ----

function get(url, binary) {
  return new Promise(function (resolve, reject) {
    var req = https.get(url, { headers: { 'User-Agent': UA } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(get(new URL(res.headers.location, url).href, binary));
        return;
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { var b = Buffer.concat(chunks); resolve(binary ? b : b.toString('utf8')); });
    });
    req.on('error', reject);
    req.setTimeout(45000, function () { req.destroy(new Error('timeout')); });
  });
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function main() {
  var found = {}; // name.ext -> where it was seen
  function note(list, where) { list.forEach(function (k) { (found[k] = found[k] || []).push(where); }); }
  var html = await get(GALLERY);
  note(glyphNames(html), 'gallery page');
  var scripts = scriptUrls(html).slice(0, MAX_SCRIPTS), read = 0;
  for (var i = 0; i < scripts.length; i++) {
    await sleep(SLEEP_MS);
    try { note(glyphNames(await get(scripts[i])), 'gallery script'); read++; } catch (e) {}
  }
  var cards = [];
  try { cards = JSON.parse(fs.readFileSync(path.join('cards', 'catalogue.json'), 'utf8')).cards || []; } catch (e) {}
  note(tokenNames(cards).map(function (n) { return n + '.svg'; }), 'card text token');

  fs.mkdirSync(OUT, { recursive: true });
  var rows = [], got = 0, skipped = 0;
  var names = Object.keys(found).sort();
  for (var j = 0; j < names.length; j++) {
    var k = names[j];
    if (!/^[A-Za-z0-9_-]+\.(svg|png)$/.test(k)) { continue; }
    await sleep(SLEEP_MS);
    var buf = null, why = '';
    try { buf = await get(GLYPH_BASE + k, true); } catch (e) { why = e.message; }
    var ok = !!buf && (/\.svg$/.test(k) ? safeSvg(buf) : buf.length > 60 && buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a');
    if (ok) { fs.writeFileSync(path.join(OUT, k), buf); got++; }
    else { skipped++; why = why || (buf ? 'not a plain file' : 'no answer'); }
    rows.push('| ' + k + ' | ' + found[k].filter(function (w, x, a) { return a.indexOf(w) === x; }).join(', ') + ' | ' + (ok ? buf.length + ' bytes' : 'skipped: ' + why) + ' |');
  }
  var rep = ['# Riot glyphs', '', 'From ' + GLYPH_BASE, '', 'Gallery scripts read: ' + read + ' of ' + scripts.length + '. Kept: ' + got + '. Skipped: ' + skipped + '.', '',
    '| file | found in | result |', '| --- | --- | --- |'].concat(rows);
  fs.writeFileSync(path.join(OUT, 'glyphs.md'), rep.join('\n') + '\n');
  console.log(rep.join('\n'));
  if (!got) { throw new Error('no glyph kept'); }
}

module.exports = { tokenNames: tokenNames, glyphNames: glyphNames, scriptUrls: scriptUrls, safeSvg: safeSvg };
if (require.main === module) { main().catch(function (e) { console.error(e.message); process.exit(1); }); }
