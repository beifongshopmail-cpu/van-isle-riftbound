// fetch-core-rules.js (plan 2 M6 block 5; both documents and the daily copy: plan 2 M10 block 3 part 2)
// Riot's two rules PDFs, the Core Rules and the Tournament Rules, kept in the app byte for byte so the
// Rules page opens RAVI's own copy, with no signal too (the worker saves docs/ with the offline copy).
// Zero dependencies. The links are never typed here: they are the ones the Rules page already shows,
// data/rules.json's two document items, written by fetch-rules.js from Riot's Rules Hub. Only a PDF
// from Riot's own file host is accepted.
//
// Writes DOCS_OUT (default docs): core-rules.pdf and tournament-rules.pdf, and DOCS_JSON (default
// data/docs.json): for each, Riot's link, Riot's "last updated" date, the size and the SHA-256. Nothing
// is written unless both documents arrive as PDFs, so a bad run leaves the last good copy. The file
// holds no time of its own, so an unchanged document makes no commit (.github/workflows/core-rules.yml).
//     node fetch-core-rules.js
'use strict';
var https = require('https');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var UA = 'VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)';
var OUT = process.env.DOCS_OUT || 'docs';
var JSON_OUT = process.env.DOCS_JSON || path.join('data', 'docs.json');
var HOST = 'cmsassets.rgpub.io';
// the documents kept: the file name in docs/ and the data/rules.json item it comes from
var DOCS = [{ id: 'core-rules', item: 'hub#core-rules' }, { id: 'tournament-rules', item: 'hub#tournament-rules' }];

// ---- pure parts (rb-tools p2m6j-test and p2m10f-test check these offline) ----

// a document item of data/rules.json: its link (Riot's host, a .pdf), its title and Riot's date
function docOf(rules, itemId) {
  var items = (rules && rules.items) || [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || it.id !== itemId) { continue; }
    var u = null;
    try { u = new URL(String(it.url || '')); } catch (e) { u = null; }
    if (!u || u.protocol !== 'https:' || u.hostname !== HOST || !/\.pdf$/i.test(u.pathname)) { return null; }
    var m = String(it.html || '').match(/last updated:\s*([A-Za-z]+ \d{1,2}, \d{4})/i);
    return { url: u.href, updated: m ? m[1] : '', title: String(it.title || '') };
  }
  return null;
}
function coreRules(rules) { return docOf(rules, 'hub#core-rules'); }

// a PDF: the %PDF- header, an %%EOF near the end, a plausible size
function isPdf(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 1000 || buf.length > 50 * 1024 * 1024) { return false; }
  if (buf.slice(0, 5).toString('latin1') !== '%PDF-') { return false; }
  return buf.slice(-1024).toString('latin1').indexOf('%%EOF') >= 0;
}

// data/docs.json from what arrived: [{ id, doc: docOf's answer, buf }]
function record(got) {
  return {
    note: 'Riot\'s rules documents as RAVI keeps them in docs/. Written by fetch-core-rules.js; never by hand.',
    docs: got.map(function (g) {
      return { id: g.id, title: g.doc.title, file: 'docs/' + g.id + '.pdf', url: g.doc.url,
        updated: g.doc.updated, size: g.buf.length, sha256: crypto.createHash('sha256').update(g.buf).digest('hex') };
    })
  };
}

// ---- the network part (GitHub Actions only) ----

function get(url) {
  return new Promise(function (resolve, reject) {
    var req = https.get(url, { headers: { 'User-Agent': UA } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        var next = new URL(res.headers.location, url);
        if (next.hostname !== HOST) { reject(new Error('redirected off Riot\'s host')); return; }
        resolve(get(next.href));
        return;
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve(Buffer.concat(chunks)); });
    });
    req.on('error', reject);
    req.setTimeout(60000, function () { req.destroy(new Error('timeout')); });
  });
}

async function main() {
  var rules = JSON.parse(fs.readFileSync(path.join('data', 'rules.json'), 'utf8'));
  var got = [];
  for (var i = 0; i < DOCS.length; i++) {
    var d = DOCS[i], doc = docOf(rules, d.item);
    if (!doc) { throw new Error('no ' + d.item + ' link from Riot\'s host in data/rules.json'); }
    var buf = await get(doc.url);
    if (!isPdf(buf)) { throw new Error(d.id + ': the answer is not a PDF'); }
    got.push({ id: d.id, doc: doc, buf: buf });
  }
  fs.mkdirSync(OUT, { recursive: true });
  got.forEach(function (g) { fs.writeFileSync(path.join(OUT, g.id + '.pdf'), g.buf); });
  var rec = record(got);
  fs.writeFileSync(JSON_OUT, JSON.stringify(rec, null, 1) + '\n');
  var rep = ['# Riot\'s rules documents', ''];
  rec.docs.forEach(function (x) {
    rep.push('- ' + x.title + ': ' + x.file + ', last updated (Riot) ' + (x.updated || 'not given') + ', ' + x.size + ' bytes, sha256 ' + x.sha256);
    rep.push('  ' + x.url);
  });
  console.log(rep.join('\n'));
}

module.exports = { coreRules: coreRules, docOf: docOf, isPdf: isPdf, record: record, DOCS: DOCS };
if (require.main === module) { main().catch(function (e) { console.error(e.message); process.exit(1); }); }
