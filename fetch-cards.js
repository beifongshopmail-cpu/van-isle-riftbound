// fetch-cards.js
// Pulls the Riftbound card catalogue from Riot's official card gallery and
// writes cards/catalogue.json plus cards/art.json. Zero dependencies.
//
// This step writes DATA ONLY. It downloads no images. Image caching and
// pruning land in a later step, keyed on the content hash recorded here.
//
// Riot's Riftbound tools policy requires that card assets come from Riot
// rather than an external mirror, which is why this replaces the TCGCSV
// image route in fetch-legends.js. It never reads or writes data/,
// index.html, counter/index.html or trade/index.html.
//     node fetch-cards.js

var https = require('https');
var fs = require('fs');
var path = require('path');

var UA = 'VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)';
var GALLERY = 'https://riftbound.leagueoflegends.com/en-us/card-gallery';
var OUT_DIR = 'cards';
var CATALOGUE = path.join(OUT_DIR, 'catalogue.json');
var ARTMAP = path.join(OUT_DIR, 'art.json');
var PRICES = path.join('data', 'prices.json');

// Safety floor, same idea as MIN_EVENTS and MIN_PRICED. A gallery that
// returns implausibly few cards must not overwrite a good catalogue.
var MIN_CARDS = 900;

function get(url, binary) {
  return new Promise(function (resolve, reject) {
    var req = https.get(url, { headers: { 'User-Agent': UA } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        // The gallery answers with a relative Location ("/en-us/card-gallery/"),
        // which https.get cannot parse on its own. Resolve it against the URL
        // that was actually requested before following.
        resolve(get(new URL(res.headers.location, url).href, binary));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        return;
      }
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () {
        var buf = Buffer.concat(chunks);
        resolve(binary ? buf : buf.toString('utf8'));
      });
    });
    req.on('error', reject);
    req.setTimeout(45000, function () { req.destroy(new Error('timeout for ' + url)); });
  });
}

// The gallery is a Next.js page. Its data route carries a build id that
// changes on every site deploy, so it is read from the page each run
// rather than stored. A deploy mid-run is the one failure mode: it shows
// up as a 404 on the data route, and re-running fixes it.
function buildIdFrom(html) {
  var m = String(html).match(/"buildId":"([^"]+)"/);
  return m ? m[1] : '';
}

// The card array is nested inside a list of page blades whose order is not
// guaranteed, so it is searched for by shape rather than by index.
function findItems(node, depth) {
  if (depth > 8 || !node || typeof node !== 'object') { return null; }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) {
      var r = findItems(node[i], depth + 1);
      if (r) { return r; }
    }
    return null;
  }
  if (node.cards && Array.isArray(node.cards.items) && node.cards.items.length > 100) {
    return node.cards.items;
  }
  var ks = Object.keys(node);
  for (var j = 0; j < ks.length; j++) {
    var r2 = findItems(node[ks[j]], depth + 1);
    if (r2) { return r2; }
  }
  return null;
}

// Riot's CDN puts a content hash in every image path. That hash is the
// cache key: unchanged art keeps its filename, redrawn art gets a new one,
// so a refresh run downloads only what actually changed.
function hashOf(u) {
  var m = String(u || '').match(/\/([0-9a-f]{16,})-\d+x\d+\.[a-z]+/i);
  return m ? m[1] : '';
}

function textOf(v) {
  if (typeof v === 'string') { return v; }
  return '';
}

function shape(c) {
  var img = c.cardImage || {};
  var set = (c.set && c.set.value) || {};
  var ct = (c.cardType && c.cardType.type && c.cardType.type[0]) || {};
  var rar = (c.rarity && c.rarity.value) || {};
  var dv = (c.domain && c.domain.values) || [];
  var doms = [];
  for (var i = 0; i < dv.length; i++) {
    if (dv[i] && dv[i].id) { doms.push(String(dv[i].id)); }
  }
  var o = {
    c: String(c.publicCode || ''),
    n: String(c.name || ''),
    s: String(set.id || ''),
    t: String(ct.id || ''),
    r: String(rar.id || ''),
    d: doms,
    h: hashOf(img.url)
  };
  if (typeof c.energy === 'number') { o.e = c.energy; }
  if (typeof c.might === 'number') { o.p = c.might; }
  // Riot's policy requires official card text to be displayed wherever a
  // card is shown. Nothing renders it yet; it is captured now so a later
  // surface does not need a second pass over the catalogue.
  var tx = textOf(c.text) || textOf(img.accessibilityText);
  if (tx) { o.x = tx; }
  return o;
}

function pad3(n) {
  var s = String(Number(n));
  while (s.length < 3) { s = '0' + s; }
  return s;
}

function main() {
  var buildId = '';
  var list = [];

  return get(GALLERY, false).then(function (html) {
    buildId = buildIdFrom(html);
    if (!buildId) { throw new Error('no build id on the gallery page'); }
    console.log('build id: ' + buildId);
    return get('https://riftbound.leagueoflegends.com/_next/data/' + buildId +
      '/en-us/card-gallery.json', false);
  }).then(function (raw) {
    var j = JSON.parse(raw);
    var items = findItems(j, 0);
    if (!items) { throw new Error('no card array found in the gallery payload'); }
    console.log('gallery cards: ' + items.length);
    if (items.length < MIN_CARDS) {
      throw new Error('only ' + items.length + ' cards, floor is ' + MIN_CARDS +
        '; refusing to overwrite');
    }

    var seen = {}, noHash = [];
    for (var i = 0; i < items.length; i++) {
      var o = shape(items[i]);
      if (!o.c) { continue; }
      if (seen[o.c]) { continue; }
      seen[o.c] = true;
      if (!o.h) { noHash.push(o.c); }
      list.push(o);
    }
    console.log('shaped cards: ' + list.length);
    console.log('cards with no image hash: ' + noHash.length);
    for (var q = 0; q < Math.min(noHash.length, 8); q++) {
      console.log('  NO IMAGE: ' + noHash[q]);
    }

    var types = {};
    for (var t = 0; t < list.length; t++) {
      types[list[t].t] = (types[list[t].t] || 0) + 1;
    }
    console.log('cards by type: ' + Object.keys(types).sort().map(function (k) {
      return k + '=' + types[k];
    }).join(' '));

    // Denominator to set prefix. Every code shares one denominator per set,
    // which is what lets a price row carrying only "066/298" be rebuilt
    // into the gallery's "OGN-066/298".
    var denom = {}, clash = [];
    for (var d = 0; d < list.length; d++) {
      var cm = list[d].c.toUpperCase().match(/^([A-Z]+)-\d+[A-Z]*\*?\/(\d+)$/);
      if (!cm) { continue; }
      if (!denom[cm[2]]) { denom[cm[2]] = cm[1]; }
      else if (denom[cm[2]] !== cm[1]) { clash.push(cm[2] + ' ' + denom[cm[2]] + '/' + cm[1]); }
    }
    console.log('denominators: ' + Object.keys(denom).sort().map(function (k) {
      return k + '=' + denom[k];
    }).join(' '));
    console.log('denominator clashes: ' + clash.length + (clash.length ? ' ' + clash.join(' ') : ''));

    var byCode = {};
    for (var b = 0; b < list.length; b++) { byCode[list[b].c.toUpperCase()] = list[b]; }

    // Some price rows carry no usable card number at all -- runes are filed
    // as "R04" with no set, split cards as "T01 // T02". Riot's own data is
    // unambiguous; the gap is entirely on the price side, so those rows are
    // matched on name plus set instead. Within one set a card name is
    // unique, which is what makes this exact rather than approximate. Any
    // name that resolves to more than one card in its set is dropped rather
    // than guessed at.
    var byName = {}, nameDupes = 0;
    for (var nb = 0; nb < list.length; nb++) {
      var nk = list[nb].s.toUpperCase() + '|' + list[nb].n.toUpperCase().replace(/\s+/g, ' ').trim();
      if (byName[nk]) { byName[nk] = 'DUPE'; nameDupes++; continue; }
      byName[nk] = list[nb];
    }
    console.log('name index entries: ' + Object.keys(byName).length + ', ambiguous names: ' + nameDupes);

    var prices = JSON.parse(fs.readFileSync(PRICES, 'utf8'));
    var pcards = prices.cards || [];
    console.log('price rows: ' + pcards.length);

    // Every mapping records HOW it was found. Without this an exact code
    // match and a fallback to the base card's picture look identical in the
    // data, so a future join defect would read as success rather than as a
    // gap. m: 1 exact code, 2 base-art fallback, 3 name and set.
    var map = {};
    var stat = { exact: 0, base: 0, name: 0, sealed: 0, split: 0, odd: 0, noPrefix: 0, miss: 0 };
    var oddSamples = [], missSamples = [], nameSamples = [];

    var setAbbr = {};
    var psets = prices.sets || [];
    for (var sa = 0; sa < psets.length; sa++) {
      setAbbr[String(psets[sa].g)] = String(psets[sa].a || '');
    }

    // Falls back to name and set for any row whose number cannot be parsed.
    function byNameSet(r) {
      var ab = (setAbbr[String(r.g)] || '').toUpperCase();
      if (!ab) { return null; }
      var nk = ab + '|' + String(r.n || '').toUpperCase().replace(/\s+/g, ' ').trim();
      var c = byName[nk];
      if (!c || c === 'DUPE') { return null; }
      return c;
    }

    for (var p = 0; p < pcards.length; p++) {
      var r = pcards[p];
      var rawc = String(r.c || '');
      var viaName = null;

      if (!rawc) { stat.sealed++; continue; }

      var pm = rawc.indexOf('//') === -1
        ? rawc.toUpperCase().match(/^(\d+)([A-Z]*)(\*?)\/(\d+)$/)
        : null;

      if (!pm) {
        viaName = byNameSet(r);
        if (!viaName) {
          if (rawc.indexOf('//') !== -1) { stat.split++; }
          else {
            stat.odd++;
            if (oddSamples.length < 8) { oddSamples.push(rawc + ' ' + r.n); }
          }
          continue;
        }
        if (!viaName.h) { stat.miss++; continue; }
        map[String(r.i)] = { h: viaName.h, m: 3 };
        stat.name++;
        if (nameSamples.length < 8) { nameSamples.push(rawc + ' -> ' + viaName.c + ' ' + viaName.n); }
        continue;
      }

      var pref = denom[pm[4]];
      if (!pref) { stat.noPrefix++; continue; }
      var stem = pref + '-' + pad3(pm[1]);
      var base = stem + '/' + pm[4];
      var tries = [];
      if (pm[3]) { tries.push(stem + '*/' + pm[4]); }
      if (pm[2]) { tries.push(stem + pm[2] + '/' + pm[4]); }
      var exact = null;
      for (var y = 0; y < tries.length; y++) {
        if (byCode[tries[y]]) { exact = tries[y]; break; }
      }
      var hit = exact || (byCode[base] ? base : null);
      if (!hit) {
        stat.miss++;
        if (missSamples.length < 8) { missSamples.push(rawc + ' want ' + base + ' ' + r.n); }
        continue;
      }
      if (!byCode[hit].h) { stat.miss++; continue; }
      map[String(r.i)] = { h: byCode[hit].h, m: exact ? 1 : 2 };
      if (exact) { stat.exact++; } else { stat.base++; }
    }

    console.log('matched on exact code: ' + stat.exact);
    console.log('matched to base art, no separate variant published: ' + stat.base);
    console.log('matched on name and set: ' + stat.name);
    for (var ns = 0; ns < nameSamples.length; ns++) { console.log('  BY NAME: ' + nameSamples[ns]); }
    console.log('sealed rows with no card number: ' + stat.sealed);
    console.log('split cards still unmatched: ' + stat.split);
    console.log('unparsable and unmatched by name: ' + stat.odd);
    for (var os = 0; os < oddSamples.length; os++) { console.log('  ODD: ' + oddSamples[os]); }
    console.log('no prefix for denominator: ' + stat.noPrefix);
    console.log('unmatched: ' + stat.miss);
    for (var ms = 0; ms < missSamples.length; ms++) { console.log('  MISS: ' + missSamples[ms]); }
    console.log('product ids mapped to art: ' + Object.keys(map).length);

    var hashes = {};
    for (var hh = 0; hh < list.length; hh++) {
      if (list[hh].h) { hashes[list[hh].h] = true; }
    }
    console.log('distinct image hashes: ' + Object.keys(hashes).length);

    var now = new Date().toISOString();
    fs.mkdirSync(OUT_DIR, { recursive: true });

    fs.writeFileSync(CATALOGUE, JSON.stringify({
      generated_at: now,
      build_id: buildId,
      source: 'riftbound.leagueoflegends.com card gallery',
      totals: { cards: list.length, images: Object.keys(hashes).length },
      cards: list
    }), 'utf8');

    fs.writeFileSync(ARTMAP, JSON.stringify({
      generated_at: now,
      source: 'riftbound.leagueoflegends.com card gallery',
      totals: {
        mapped: Object.keys(map).length,
        exact: stat.exact,
        base_fallback: stat.base,
        by_name: stat.name,
        unmatched: stat.miss
      },
      art: map
    }), 'utf8');

    console.log('wrote ' + CATALOGUE + ' (' + fs.statSync(CATALOGUE).size + ' bytes)');
    console.log('wrote ' + ARTMAP + ' (' + fs.statSync(ARTMAP).size + ' bytes)');
  });
}

main().then(function () {
  console.log('done');
}).catch(function (e) {
  console.error('FAILED: ' + e.message);
  process.exit(1);
});
