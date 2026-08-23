// fetch-legends.js
// Pulls the Riftbound legend roster and card art from the TCGCSV mirror of
// the TCGplayer catalog, writes counter/legends.js, and caches the art under
// counter/art/. Zero dependencies. Run by hand when a set drops:
//     node fetch-legends.js
// This is NOT on cron and has nothing to do with the event fetcher. It never
// reads or writes data/, index.html, or counter/index.html.

var https = require('https');
var fs = require('fs');
var path = require('path');

var CATEGORY = 89;
var UA = 'VanIsleRiftbound/1.0 (+https://github.com/beifongshopmail-cpu/van-isle-riftbound)';
var BASE = 'https://tcgcsv.com/tcgplayer/' + CATEGORY;
var CDN = 'https://tcgplayer-cdn.tcgplayer.com/product/';
var ART_DIR = path.join('counter', 'art');
var OUT_FILE = path.join('counter', 'legends.js');
var SLEEP_MS = 200;

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function get(url, binary) {
  return new Promise(function (resolve, reject) {
    var req = https.get(url, { headers: { 'User-Agent': UA } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(get(res.headers.location, binary));
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
        if (binary) { resolve(buf); return; }
        try { resolve(JSON.parse(buf.toString('utf8'))); }
        catch (e) { reject(new Error('bad JSON from ' + url + ': ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, function () { req.destroy(new Error('timeout for ' + url)); });
  });
}

// A product is a legend when any extendedData value is the literal 'Legend'.
function isLegend(p) {
  var ed = p.extendedData || [];
  for (var i = 0; i < ed.length; i++) {
    if (ed[i].value === 'Legend') { return true; }
  }
  return false;
}

// A legend's two domains arrive as one semicolon-separated extendedData
// value, e.g. "Fury;Mind". Returns an array of names, possibly empty.
function domainsOf(p) {
  var ed = p.extendedData || [];
  for (var i = 0; i < ed.length; i++) {
    if (ed[i].name === 'Domain' && ed[i].value) {
      return String(ed[i].value).split(';').map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
    }
  }
  return [];
}

// "Ahri, Nine-Tailed Fox (Metal) (Best Of)" -> name plus ordered tag list.
function splitName(raw) {
  var name = String(raw);
  var tags = [];
  var re = /\s*\(([^()]+)\)\s*$/;
  var m = name.match(re);
  while (m) {
    tags.unshift(m[1].trim());
    name = name.slice(0, m.index);
    m = name.match(re);
  }
  return { name: name.trim(), tags: tags };
}

function hasTag(tags, t) {
  for (var i = 0; i < tags.length; i++) { if (tags[i] === t) { return true; } }
  return false;
}

function labelOf(row) {
  return row.tags.length ? (row.set + ' ' + row.tags.join(' ')) : row.set;
}

function main() {
  var groups, order = {}, rows = [];

  return get(BASE + '/groups', false).then(function (g) {
    groups = g.results || [];
    // Promo, judge and side sets sort AFTER main sets regardless of date, so
    // a legend's default printing is the main set it debuted in. Secret
    // Garden is dated before Unleashed but reprints it, which put Ivern and
    // Lillia on the wrong default.
    var SIDE = { OPP: 1, PR: 1, JDG: 1, RWB: 1, SGN: 1, OGS: 1 };
    groups.sort(function (a, b) {
      var sa = SIDE[a.abbreviation] ? 1 : 0, sb = SIDE[b.abbreviation] ? 1 : 0;
      if (sa !== sb) { return sa - sb; }
      return String(a.publishedOn).localeCompare(String(b.publishedOn));
    });
    for (var i = 0; i < groups.length; i++) { order[groups[i].abbreviation] = i; }
    console.log('groups: ' + groups.length);

    var chain = Promise.resolve();
    groups.forEach(function (grp) {
      chain = chain.then(function () {
        return sleep(SLEEP_MS);
      }).then(function () {
        return get(BASE + '/' + grp.groupId + '/products', false);
      }).then(function (res) {
        var prods = res.results || [];
        var n = 0;
        for (var j = 0; j < prods.length; j++) {
          if (!isLegend(prods[j])) { continue; }
          var sp = splitName(prods[j].name);
          rows.push({
            name: sp.name,
            tags: sp.tags,
            set: grp.abbreviation,
            id: String(prods[j].productId),
            dom: domainsOf(prods[j])
          });
          n++;
        }
        console.log('  ' + grp.abbreviation + ': ' + n + ' legend rows of ' + prods.length);
      });
    });
    return chain;
  }).then(function () {
    console.log('legend rows before signature rule: ' + rows.length);

    // SIGNATURE RULE. Within one legend name and one set, a Signature printing
    // is the same art as the Overnumbered one with a signature added, so keep
    // only the Signature. Sets that printed an Overnumbered and no Signature
    // keep the Overnumbered.
    var sigKeys = {};
    rows.forEach(function (r) {
      if (hasTag(r.tags, 'Signature')) { sigKeys[r.name + '|' + r.set] = true; }
    });
    var before = rows.length;
    rows = rows.filter(function (r) {
      if (!hasTag(r.tags, 'Overnumbered')) { return true; }
      if (hasTag(r.tags, 'Signature')) { return true; }
      return !sigKeys[r.name + '|' + r.set];
    });
    console.log('dropped as signature duplicates: ' + (before - rows.length));

    // Group into legends.
    var byName = {};
    rows.forEach(function (r) {
      if (!byName[r.name]) { byName[r.name] = []; }
      byName[r.name].push(r);
    });

    var names = Object.keys(byName).sort(function (a, b) { return a.localeCompare(b); });
    var legends = names.map(function (nm) {
      var list = byName[nm].slice();
      list.sort(function (a, b) {
        var oa = order[a.set], ob = order[b.set];
        if (oa !== ob) { return oa - ob; }
        if (a.tags.length !== b.tags.length) { return a.tags.length - b.tags.length; }
        return labelOf(a).localeCompare(labelOf(b));
      });
      return { n: nm, v: list };
    });

    var printings = 0;
    legends.forEach(function (L) { printings += L.v.length; });
    console.log('legends: ' + legends.length + ', printings: ' + printings);

    // Cache the art. Only fetches what is missing, so a re-run after a new set
    // downloads only the new cards.
    fs.mkdirSync(ART_DIR, { recursive: true });
    var todo = [];
    legends.forEach(function (L) {
      L.v.forEach(function (r) {
        var dest = path.join(ART_DIR, r.id + '.jpg');
        if (!fs.existsSync(dest)) { todo.push({ id: r.id, dest: dest }); }
      });
    });
    console.log('images already cached: ' + (printings - todo.length));
    console.log('images to fetch: ' + todo.length);

    var got = 0, failed = [];
    var chain = Promise.resolve();
    todo.forEach(function (t) {
      chain = chain.then(function () {
        return sleep(SLEEP_MS);
      }).then(function () {
        return get(CDN + t.id + '_200w.jpg', true);
      }).then(function (buf) {
        fs.writeFileSync(t.dest, buf);
        got++;
        if (got % 25 === 0) { console.log('  fetched ' + got + '/' + todo.length); }
      }).catch(function (e) {
        failed.push(t.id + ': ' + e.message);
      });
    });
    return chain.then(function () {
      console.log('images fetched: ' + got);
      console.log('image failures: ' + failed.length);
      failed.forEach(function (f) { console.log('  FAIL ' + f); });

      // The roster is written LAST so every printing can record whether its
      // art actually landed on disk. A printing with no art stays in the
      // roster and stays selectable -- the picker renders it name-only.
      // Some product IDs, chiefly the Organized Play promos, have no image on
      // the CDN at any size and return 403 permanently. Re-running does not
      // recover them.
      // A printing is a choice of picture and nothing else, so one with no
      // cached image has nothing to offer. Dropped here rather than in the
      // picker, so counter/index.html never has to reason about it.
      var kept = 0, cut = 0;
      legends.forEach(function (L) {
        var keep = L.v.filter(function (r) {
          return fs.existsSync(path.join(ART_DIR, r.id + '.jpg'));
        });
        cut += L.v.length - keep.length;
        if (keep.length) { L.v = keep; }
        kept += L.v.length;
      });
      console.log('printings dropped for having no art: ' + cut);
      console.log('printings kept: ' + kept);

      var withArt = 0;
      var out = '';
      out += '/* GENERATED by fetch-legends.js -- do not edit by hand. */\n';
      out += '/* ' + legends.length + ' legends, ' + kept + ' printings. */\n';
      out += '/* d is the legend two domains. Every printing listed has art. */\n';
      out += 'var VIR_LEGENDS = [\n';
      legends.forEach(function (L) {
        var dom = [];
        L.v.forEach(function (r) {
          if (!dom.length && r.dom && r.dom.length) { dom = r.dom; }
        });
        var parts = L.v.map(function (r) {
          var art = fs.existsSync(path.join(ART_DIR, r.id + '.jpg'));
          if (art) { withArt++; }
          return '{"l":' + JSON.stringify(labelOf(r))
            + ',"i":' + JSON.stringify(r.id)
            + (art ? ',"a":1' : '') + '}';
        });
        out += '{"n":' + JSON.stringify(L.n)
          + ',"d":' + JSON.stringify(dom)
          + ',"v":[' + parts.join(',') + ']},\n';
      });
      out += '];\n';
      fs.writeFileSync(OUT_FILE, out, 'utf8');
      console.log('wrote ' + OUT_FILE);
      console.log('printings with art: ' + withArt + ' of ' + kept);

      var noDom = 0;
      legends.forEach(function (L) {
        var any = false;
        L.v.forEach(function (r) { if (r.dom && r.dom.length) { any = true; } });
        if (!any) { noDom++; console.log('  NO DOMAIN: ' + L.n); }
      });
      console.log('legends with no domain: ' + noDom);

      // The six domain symbols, straight from Riot's public glyph CDN, in the
      // same folder the official card gallery loads its card-type icons from.
      // Cached in the repo like the card art -- hot-linking would break
      // offline, which is the entire point of the counter.
      var GLYPH = 'https://assetcdn.rgpub.io/public/live/riot-shared/' +
        'player-experiences/riot-glyphs/rb/latest/';
      var DOMS = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'];
      var gGot = 0, gFail = [];
      var gChain = Promise.resolve();
      DOMS.forEach(function (d) {
        var dest = path.join(ART_DIR, 'rune_' + d + '.svg');
        gChain = gChain.then(function () {
          if (fs.existsSync(dest)) { return null; }
          return sleep(SLEEP_MS).then(function () {
            return get(GLYPH + 'rune_' + d + '.svg', true);
          }).then(function (buf) {
            fs.writeFileSync(dest, buf);
            gGot++;
          }).catch(function (e) {
            gFail.push(d + ': ' + e.message);
          });
        });
      });
      return gChain.then(function () {
        console.log('domain glyphs fetched: ' + gGot);
        console.log('domain glyph failures: ' + gFail.length);
        gFail.forEach(function (f) { console.log('  FAIL ' + f); });
      });
    });
  });
}

main().then(function () {
  console.log('done');
}).catch(function (e) {
  console.error('FAILED: ' + e.message);
  process.exit(1);
});
