// fetch-core-rules.js (plan 2 M6 block 5, Mako 2026-11-03)
// Riot's Core Rules PDF, for New here's rule quotes. Zero dependencies. The link is never typed
// here: it is the one the Rules page already shows, data/rules.json's Core Rules item, written by
// fetch-rules.js from Riot's Rules Hub. Only a PDF from Riot's own file host is accepted, and it
// is kept byte for byte.
//
// Writes CORE_OUT (default riot): core-rules.pdf and core-rules.md (the link, Riot's "last
// updated" date, the size and the SHA-256). It never writes data/ or any page.
//     node fetch-core-rules.js
'use strict';
var https = require('https');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var UA = 'VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)';
var OUT = process.env.CORE_OUT || 'riot';
var HOST = 'cmsassets.rgpub.io';

// ---- pure parts (rb-tools p2m6j-test checks these offline) ----

// the Core Rules item of data/rules.json: its link (Riot's host, a .pdf) and Riot's date
function coreRules(rules) {
  var items = (rules && rules.items) || [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    if (!it || it.id !== 'hub#core-rules') { continue; }
    var u = null;
    try { u = new URL(String(it.url || '')); } catch (e) { u = null; }
    if (!u || u.protocol !== 'https:' || u.hostname !== HOST || !/\.pdf$/i.test(u.pathname)) { return null; }
    var m = String(it.html || '').match(/last updated:\s*([A-Za-z]+ \d{1,2}, \d{4})/i);
    return { url: u.href, updated: m ? m[1] : '' };
  }
  return null;
}

// a PDF: the %PDF- header, an %%EOF near the end, a plausible size
function isPdf(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 1000 || buf.length > 50 * 1024 * 1024) { return false; }
  if (buf.slice(0, 5).toString('latin1') !== '%PDF-') { return false; }
  return buf.slice(-1024).toString('latin1').indexOf('%%EOF') >= 0;
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
  var cr = coreRules(rules);
  if (!cr) { throw new Error('no Core Rules link from Riot\'s host in data/rules.json'); }
  var buf = await get(cr.url);
  if (!isPdf(buf)) { throw new Error('the answer is not a PDF'); }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'core-rules.pdf'), buf);
  var rep = ['# Riot Core Rules', '', '- link: ' + cr.url, '- last updated (Riot): ' + (cr.updated || 'not given'),
    '- size: ' + buf.length + ' bytes', '- sha256: ' + crypto.createHash('sha256').update(buf).digest('hex'), ''];
  fs.writeFileSync(path.join(OUT, 'core-rules.md'), rep.join('\n'));
  console.log(rep.join('\n'));
}

module.exports = { coreRules: coreRules, isPdf: isPdf };
if (require.main === module) { main().catch(function (e) { console.error(e.message); process.exit(1); }); }
