// hubedit.js -- Hub layout, the one copy (plan 2 M6 block 6, 2026-11-03): App settings' Hub layout
// menu and the first-time setup's Your hub step both draw it. Moved unchanged from
// settings/index.html (Mako's phone sign-off 2026-11-03: the hub's own blocks at the hub's size,
// dragged or tapped into place; rb-tools p2m6b to p2m6g). Its styles are app.css, HUB LAYOUT.
//   var H = RAVI_HUBEDIT({ grid: el, shelf: el, off: button, onSave: fn }); H.draw();
// grid holds the hub's copy (.hlg), shelf the pages not on the hub (.hls), off is Take off the hub;
// onSave runs after each change is saved (RAVI_HUB_SAVE in pages.js keeps the order).
(function (root) {
  "use strict";
  root.RAVI_HUBEDIT = function (o) {
    var hl = o.grid, hs = o.shelf, hoff = o.off;
    function PAGES() { return root.RAVI_PAGES || []; }
    // every block in this copy, the hub's and the shelf's
    function q(sel) { return Array.prototype.slice.call(hl.querySelectorAll(sel)).concat(Array.prototype.slice.call(hs.querySelectorAll(sel))); }
    var ORDER = [], PICK = null, D = null, noClick = false;
    function pageOf(id){ for (var i = 0; i < PAGES().length; i++) { if (PAGES()[i].id === id && PAGES()[i].path) { return PAGES()[i]; } } return null; }
    function tint(rgb){ return window.RAVI_TINT(rgb, .62, .84, .93); }
    // the hub's own block (app.css THE HUB BLOCK: .blk, .bi, .bn), the same on the hub copy and the shelf (plan 2 M8.7, Mako 2026-11-08)
    function blk(p){ return '<button type="button" class="blk hlb glass cg" data-id="' + p.id + '" style="--cl:' + p.rgb + ';--c:' + p.rgb + ';--ci:' + tint(p.rgb) + '"><span class="bi">' + p.icon + '</span><span class="bn">' + p.name + '</span></button>'; }
    function drawHub(){
      ORDER = window.RAVI_HUB_PICKS();
      var h = "", e;
      ORDER.forEach(function(id){ var p = pageOf(id); if (p) { h += blk(p); } });
      for (e = ORDER.length; e < window.RAVI_HUB_MAX; e++) { h += '<div class="blk hlb hle" aria-label="An empty place"></div>'; }
      h += '<div class="blk allp hlb glass hla" aria-label="All pages, always last"><span class="bi">' + window.RAVI_ICON("allpages") + '</span><span class="bn">All pages</span></div>';
      hl.innerHTML = h;
      var sh = "";
      PAGES().forEach(function(p){ if (p.path && ORDER.indexOf(p.id) < 0) { sh += blk(p); } });
      hs.innerHTML = sh;
      PICK = null; marks();
    }
    function marks(){
      q(".hlb[data-id]").forEach(function(b){
        b.classList.toggle("picked", !!PICK && b.getAttribute("data-id") === PICK.id && hl.contains(b) === PICK.hub);
      });
      hoff.disabled = !(PICK && PICK.hub);
    }
    function saveHub(list){ window.RAVI_HUB_SAVE(list.slice(0, window.RAVI_HUB_MAX)); if (o.onSave) { o.onSave(); } drawHub(); }
    // a tap that moves blocks lets them glide to their new places, as the drag does (plan 2 M8.7 motion
    // polish): each block moves from where it was, by its centre and its size, .3s on the settle curve
    function glide(list){
      var was = {};
      q(".hlb[data-id]").forEach(function(b){ was[b.getAttribute("data-id")] = b.getBoundingClientRect(); });
      saveHub(list);
      if (still()) { return; }
      q(".hlb[data-id]").forEach(function(b){
        var r0 = was[b.getAttribute("data-id")], r = b.getBoundingClientRect();
        if (!r0 || !b.animate || !r.width) { return; }
        var dx = r0.left + r0.width / 2 - (r.left + r.width / 2), dy = r0.top + r0.height / 2 - (r.top + r.height / 2), k = r0.width / r.width;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(k - 1) < .01) { return; }
        b.animate([{ transform: "translate(" + Math.round(dx) + "px," + Math.round(dy) + "px) scale(" + k.toFixed(3) + ")" }, { transform: "none" }], { duration: 300, easing: "cubic-bezier(.22,.72,.2,1)" });
      });
    }
    // tap one, then another: two on the hub swap; a page from below takes a hub block's place;
    // a page from below and an empty place adds it; the same block again puts it down
    function tapHub(el){
      var id = el.getAttribute("data-id"), inHub = hl.contains(el), empty = el.classList.contains("hle"), list = ORDER.slice();
      if (el.classList.contains("hla")) { return; }
      if (!PICK) { if (id) { PICK = { id: id, hub: inHub }; marks(); } return; }
      var a = PICK; PICK = null;
      if (a.id === id && a.hub === inHub) { marks(); return; }
      var ai = list.indexOf(a.id), bi = id ? list.indexOf(id) : -1;
      if (a.hub && inHub && id) { list[ai] = id; list[bi] = a.id; }
      else if (a.hub && empty) { list.splice(ai, 1); list.push(a.id); }
      else if (a.hub && !inHub && id) { list[ai] = id; }
      else if (!a.hub && inHub && id) { list[bi] = a.id; }
      else if (!a.hub && empty) { list.push(a.id); }
      else { PICK = { id: id, hub: false }; marks(); return; }
      glide(list);
    }
    hl.addEventListener("click", function(e){ if (noClick) { noClick = false; return; } var el = e.target.closest(".hlb"); if (el) { tapHub(el); } });
    hs.addEventListener("click", function(e){ if (noClick) { noClick = false; return; } var el = e.target.closest(".hlb"); if (el) { tapHub(el); } });
    hoff.addEventListener("click", function(){ if (PICK && PICK.hub) { var list = ORDER.filter(function(x){ return x !== PICK.id; }); PICK = null; glide(list); } });
    // the drag (rebuilt after Mako's phone check, 2026-11-03: it was glitchy): a copy of the block
    // follows the finger (fixed, no transition), its place dims in the grid. Where it would go is
    // read from the places' boxes as they were when the drag began, never from a moving box, so a
    // block sliding aside can never send the drag back. On the hub the others make room as it
    // passes; dropped on a block, a page from below swaps in; a hub block dropped below comes off.
    function still(){ return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    function cellsOf(){ return Array.prototype.slice.call(hl.querySelectorAll(".hlb[data-id]")); }
    function slotAt(x, y){
      for (var k = 0; k < D.slots.length; k++) { var r = D.slots[k]; if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { return k; } }
      return -1;
    }
    function inShelf(x, y){ var r = D.shelfBox; return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
    function flip(fn){
      var cells = Array.prototype.slice.call(hl.children), first = cells.map(function(c){ return c.getBoundingClientRect(); });
      fn();
      if (still()) { return; }
      cells.forEach(function(c, i){
        if (c === D.el || !c.animate) { return; }
        var l = c.getBoundingClientRect(), dx = first[i].left - l.left, dy = first[i].top - l.top;
        if (dx || dy) { c.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 200, easing: "cubic-bezier(.22,.72,.2,1)" }); }
      });
    }
    function overMarks(k, shelf){
      q(".hlb.over").forEach(function(c){ c.classList.remove("over"); });
      hs.classList.toggle("over", !!shelf);
      if (k >= 0 && !D.hub) { var c = hl.children[k]; if (c && !c.classList.contains("hla")) { c.classList.add("over"); } }
    }
    function down(e){
      var el = e.target.closest ? e.target.closest(".hlb[data-id]") : null;
      if (!el || (e.button && e.button > 0)) { return; }
      noClick = false; // a new touch is never the click a drag left behind
      D = { el: el, id: el.getAttribute("data-id"), hub: hl.contains(el), x: e.clientX, y: e.clientY, on: false, pid: e.pointerId, k: -1 };
    }
    function moved(e){
      if (!D || e.pointerId !== D.pid) { return; }
      if (!D.on) {
        if (Math.abs(e.clientX - D.x) + Math.abs(e.clientY - D.y) < 8) { return; }
        D.on = true; PICK = null; marks();
        try { D.el.setPointerCapture(D.pid); } catch (x) {}
        var r = D.el.getBoundingClientRect();
        D.gx = D.x - r.left; D.gy = D.y - r.top;
        // every movable place on the hub (its blocks, then any empty ones), as it stands now
        D.slots = Array.prototype.filter.call(hl.children, function(c){ return !c.classList.contains("hla"); }).map(function(c){ return c.getBoundingClientRect(); });
        D.shelfBox = hs.getBoundingClientRect();
        var g = D.el.cloneNode(true);
        g.classList.add("hlghost"); g.removeAttribute("data-id"); g.setAttribute("aria-hidden", "true");
        g.style.width = r.width + "px"; g.style.height = r.height + "px"; g.style.left = r.left + "px"; g.style.top = r.top + "px";
        document.body.appendChild(g);
        D.ghost = g;
        D.el.classList.add("hlhold");
      }
      if (e.cancelable) { e.preventDefault(); }
      D.ghost.style.left = (e.clientX - D.gx) + "px"; D.ghost.style.top = (e.clientY - D.gy) + "px";
      var k = slotAt(e.clientX, e.clientY), shelf = D.hub && inShelf(e.clientX, e.clientY);
      if (D.hub && k >= 0) {
        var cells = cellsOf(), n = cells.length, want = Math.min(k, n - 1), at = cells.indexOf(D.el);
        if (want !== at) {
          flip(function(){
            var rest = cells.filter(function(c){ return c !== D.el; });
            if (want < rest.length) { hl.insertBefore(D.el, rest[want]); }
            else { hl.insertBefore(D.el, rest[rest.length - 1].nextSibling); }
          });
        }
      }
      D.k = k;
      overMarks(D.hub ? -1 : k, shelf);
    }
    function up(e){
      if (!D || e.pointerId !== D.pid) { return; }
      var d = D;
      if (!d.on) { D = null; return; }
      noClick = true; setTimeout(function(){ noClick = false; }, 400);
      var k = slotAt(e.clientX, e.clientY), shelf = d.hub && inShelf(e.clientX, e.clientY);
      overMarks(-1, false);
      if (d.ghost && d.ghost.parentNode) { d.ghost.parentNode.removeChild(d.ghost); }
      d.el.classList.remove("hlhold");
      D = null;
      var list = ORDER.slice(), ai = list.indexOf(d.id), target = k >= 0 ? hl.children[k] : null;
      if (d.hub && shelf) { list.splice(ai, 1); }
      else if (d.hub) { list = cellsOf().map(function(c){ return c.getAttribute("data-id"); }); }
      else if (target && target.hasAttribute("data-id")) { list[list.indexOf(target.getAttribute("data-id"))] = d.id; }
      else if (target && target.classList.contains("hle")) { list.push(d.id); }
      else { drawHub(); return; }
      saveHub(list);
    }
    function lost(){ if (D && D.ghost && D.ghost.parentNode) { D.ghost.parentNode.removeChild(D.ghost); } D = null; drawHub(); }
    // iOS: while a block is dragged, the menu never scrolls under it
    document.addEventListener("touchmove", function(e){ if (D && D.on && e.cancelable) { e.preventDefault(); } }, { passive: false });
    [hl, hs].forEach(function(g){
      g.addEventListener("pointerdown", down);
      g.addEventListener("pointermove", moved);
      g.addEventListener("pointerup", up);
      g.addEventListener("pointercancel", lost);
    });
    return { draw: drawHub };
  };
})(window);
