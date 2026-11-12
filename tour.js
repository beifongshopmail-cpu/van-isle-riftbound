// THE TOUR (plan 2 M9 block 7; Mako's yes 2026-11-12 10:33: per-page tours the player starts).
// A tour never starts by itself. A link that carries data-tour="<id>" (Guide's page rows, Getting
// around's Show me the bar, the first-time setup's Show me around) asks for one: pages.js keeps the
// ask for the next page (session key ravi.tour.v1) and loads this file there, and only there.
// On the real page: the page dims, one control is lit (a cut-out with a bone ring, never colour
// alone), two or three lines sit beside it with 'n of m' in words, and Next goes on. Where a stop
// says so the player taps the real control instead, and the tour follows it into its menu. The
// light glides between stops (reduced motion: it steps). Skip or Done takes it away.
// The approach (a dim, a lit cut-out, an anchored note) follows driver.js (MIT, Kamran Ahmed);
// no code of it is used.
//
// A tour: { page: "<folder>/", stops: [ ... ] }. A stop:
//   s    the control to light: a selector, or a list tried in order; the first one drawn wins
//   t    its words: two or three lines at 402, in the app's voice (STYLE.md section 4, Words); a page's
//        name goes between stars and is drawn bold (*Events*)
//   tap  true: the player goes on by tapping the real control (Next taps it for them)
//   in   true: the control is inside the menu the stop before opened, so it is not looked for
//        until then
//   pre  the name of a function the page offers (on window) that sets the stop up before its
//        control is looked for: Decks opens a deck, the player's own or the example (RAVI_DECK_TOUR)
//   when the name of a function the page offers that says whether this stop belongs at all
// A tour may name an end function the same way, called when the tour ends (Done or Skip).
// A stop whose control is not on the page is left out, and the count is of the stops there are.
(function(){
  "use strict";
  if (typeof document === "undefined" || window.RAVI_TOUR) { return; }
  var KEY = "ravi.tour.v1";

  window.RAVI_TOURS = {
    bar: { page: "calendar/", stops: [
      { s: "#tabs > a.tab", t: "This is *Hub*. It takes you back to your blocks from any page." },
      { s: "#tabnav", t: "*Go to* lists every page, so you never need the hub to get around." },
      { s: "#subtab", t: "The third slot is the page's own action. Here on *Events* it is Follow." },
      { s: "#tabset", t: "The gear is this page's settings. It dims on a page that has none." },
      { s: "#acpic", t: "Your picture is your account: your profile and your Riot ID." }
    ] },
    calendar: { page: "calendar/", stops: [
      { s: ".ev .evhead", tap: true, t: "Tap an event to open it up." },
      { s: ".evact:not([hidden]) .evbtns", "in": true, t: "From here you can get directions, add it to your phone's calendar, or open its own page to register." },
      { s: ".ev .lvl:not([hidden])", t: "A running event says LIVE, with its round and time left. Open it for pairings and standings." },
      { s: "#subtab", t: "Follow puts a store's or an area's events in your phone's calendar and keeps them current." },
      { s: "#tabset", t: "Settings picks the areas, types and stores you see. *Stores* and the *Tier list*'s Local use your areas too." }
    ] },
    stores: { page: "stores/", stops: [
      { s: [".stg", ".stl"], tap: true, t: "Each store shows if it is open and what it runs next. Tap one to see more." },
      { s: "#sfollow", "in": true, t: "Follow their events adds this store's events to your phone's calendar." },
      { s: "#tabset", t: "Settings picks your areas, the same ones *Events* uses." }
    ] },
    counter: { page: "counter/", stops: [
      { s: ["#sideBot .acts", ".seat .acts"], t: "Conquer, Hold and Other each add a point for you. The log remembers which." },
      { s: ["#seam", ".seat .pass"], t: "Pass turn when your turn ends. The log times every turn for you." },
      { s: "#modes", t: "Focus is for your own phone, with your score large. Split shares one phone between two players." },
      { s: "#setupbtn", tap: true, t: "Settings holds the Match timer, the event and each player's legend. Tap it to have a look." },
      { s: "#evbtn", "in": true, t: "Event ties this match to an event today, so *Top cut* already knows your record." }
    ] },
    cut: { page: "cut/", stops: [
      { s: "#evbtn", t: "Pick your event, and its players, rounds and cut fill in for you." },
      { s: "#srec", t: "Set your record so far. Matches the *Tracker* tied to the event are counted already." },
      { s: "#sfin", t: "Every finish still open to you. Worst case: other tables fall against you. Chance: how often it makes the cut." }
    ] },
    tier: { page: "tier/", stops: [
      { s: "#tscope", t: "Global counts every event TopDeck.gg lists, worldwide. Local counts only your areas, from decks players add." },
      { s: ".tlet", t: "Tap a letter to see its whole tier, best conversion first." },
      { s: ".tleg", t: "Tap a legend for its numbers, its top-cut lists and its most played cards." }
    ] },
    trade: { page: "trade/", stops: [
      { s: "#sides", t: "Yours or Theirs: pick the side your next card goes to." },
      { s: ".plate .sf", t: "Search for a card, then tap it to add it to that side." },
      { s: "#tabset", t: "Settings sets the percent of market price each side trades at." },
      { s: "#tabsav", t: "Saved trades keeps a trade so you can come back to it." }
    ] },
    board: { page: "board/", stops: [
      { s: "#bview", t: "Matches are players who have cards on your Wishlist and want cards in your binders set For trade." },
      { s: "#taboff", t: "Your offers, sent and received, live here. The ones waiting on you are counted." },
      { s: "#tabset", t: "Settings is where you choose what you share and how other players see you." }
    ] },
    collection: { page: "collection/", stops: [
      { s: "#portbtn", t: "Your binders live here. Collection is every card you own; the Wishlist is not counted." },
      { s: "#first [data-act=import]", t: "Coming from Collectr? Bring your export in here." },
      { s: "#mvtog", t: "Movers shows your biggest gains and losses." },
      { s: "#tabadd", t: "Add cards shows every card. Tap a picture to add one." }
    ] },
    decks: { page: "decks/", end: "RAVI_DECK_TOUR_END", stops: [
      { s: "#hplate [data-act=imp]", t: "Import brings a deck over from Piltover Archive, Riftmana or another builder." },
      { s: "#hview", t: "Public shows decks other players share. Copy one to make it yours." },
      { s: ".rocard", pre: "RAVI_DECK_TOUR", when: "RAVI_DECKS_NONE", t: "This is an example deck, here just for the tour. It goes away when you finish." },
      { s: "#vw", pre: "RAVI_DECK_TOUR", t: "Deck is the list, checked against Riot's deck rules. Stats breaks it down, and Hand deals you a sample hand." },
      { s: "#tabedit", pre: "RAVI_DECK_TOUR", t: "Edit lets you change a deck of your own: steppers on each card, and tiles to add more." }
    ] },
    cards: { page: "cards/", stops: [
      { s: ".plate .sf", t: "Search by name, number, tag or type. Cards that match only in their text come after." },
      { s: "#flsb", t: "Filters narrows things down by set, type, domain, rarity and Energy." },
      { s: ".cpic", tap: true, t: "Tap a card to see its text, printings, prices and rulings." },
      { s: "#pcard .pfoot .pact", "in": true, t: "Add to puts it on your Wishlist, in a binder or in a deck." }
    ] },
    rules: { page: "rules/", stops: [
      { s: ".plate .sf", t: "Search every erratum, FAQ and ruling. Typos are forgiven." },
      { s: ".plate .fchip", t: "Filters narrows things down by kind and by set." },
      { s: "#docs", t: "These are Riot's own documents. NEW marks what changed since your last visit." },
      { s: "#tabupd", t: "Updates lists Riot's patch notes, ban list posts and Tournament Rules changes, newest first." }
    ] },
    news: { page: "news/", stops: [
      { s: "#snow", t: "Happening now holds drawings and entries still open, the soonest to close first." },
      { s: "#wktog", t: "This week has the biggest price moves and the top legends." },
      { s: "#kchip", t: "Kinds lets you turn each kind of post on or off." }
    ] },
    feedback: { page: "feedback/", stops: [
      { s: "#planned", t: "Planned is what is coming. Tap a line to read more." },
      { s: "#tabsend", t: "Found a bug, a wrong or missing event, or have an idea? Send it here." }
    ] },
    settings: { page: "settings/", stops: [
      { s: "#stalert", t: "Your alerts, each kind on or off for this phone." },
      { s: "#sthubg", t: "Hub layout picks your seven blocks. Open the app to picks the page RAVI starts on." },
      { s: "#streset", t: "Reset puts every setting back as it was." }
    ] }
  };

  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';
  var el = null, hole, pop, words, count, foot, blocks = [], mid;
  var stops = [], at = -1, target = null, cur = null, from = null, t0 = 0, raf = 0, busy = false, done = "", GLIDE = 340;

  function still(){
    if (window.RAVI_LESS) { return true; }
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; }
  }
  function drawn(e){
    if (!e || (e.closest && e.closest("[hidden]"))) { return false; }
    var b = e.getBoundingClientRect();
    return b.width > 1 && b.height > 1;
  }
  function find(s){
    var list = typeof s === "string" ? [s] : s, i, j, got;
    for (i = 0; i < list.length; i++) {
      try { got = document.querySelectorAll(list[i]); } catch (e) { got = []; }
      for (j = 0; j < got.length; j++) { if (drawn(got[j])) { return got[j]; } }
    }
    return null;
  }
  function ease(x){ return 1 - Math.pow(1 - x, 3); }

  function build(){
    var i, d;
    el = document.createElement("div"); el.className = "tour"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Tour");
    // four blockers round the cut-out and one over it: the dimmed page takes no taps
    for (i = 0; i < 5; i++) { d = document.createElement("div"); d.className = "tourk"; el.appendChild(d); blocks.push(d); }
    mid = blocks[4];
    hole = document.createElement("div"); hole.className = "tourh"; el.appendChild(hole);
    pop = document.createElement("div"); pop.className = "tourp";
    pop.innerHTML = '<p class="tourt" aria-live="polite"></p><div class="tourf"><span class="tourc"></span><span class="sp"></span></div>';
    el.appendChild(pop);
    words = pop.querySelector(".tourt"); count = pop.querySelector(".tourc"); foot = pop.querySelector(".tourf");
    el.addEventListener("click", function(e){
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b) { return; }
      if (b.hasAttribute("data-tour-skip") || b.hasAttribute("data-tour-done")) { return end(); }
      if (b.hasAttribute("data-tour-next")) {
        if (busy) { return; }
        if (stops[at].tap && target) { busy = true; target.click(); return; }   // the real control's own tap goes on (below)
        go(at + 1);
      }
    });
    // a held or dragged finger on the dim never scrolls the page under it
    el.addEventListener("touchmove", function(e){ if (!(e.target.closest && e.target.closest(".tourp"))) { e.preventDefault(); } }, { passive: false });
    document.body.appendChild(el);
    document.addEventListener("click", tapped, true);
  }
  // a tap stop: the player's tap on the real control goes on, once what it opens has arrived
  function tapped(e){
    if (!el || at < 0 || !stops[at].tap || !target || !target.contains(e.target)) { return; }
    // go on as soon as what the tap opens is drawn (the light then follows it as it settles), not
    // after a fixed wait: checked every 40 ms, for .7 s at most
    var n = at + 1, tries = 0;
    busy = true;
    (function look(){
      if (!el || at !== n - 1) { busy = false; return; }
      if (n >= stops.length || find(stops[n].s) || tries++ > 17) { busy = false; go(n); return; }
      setTimeout(look, 40);
    })();
  }
  function btn(attr, label, lead){
    var b = document.createElement("button");
    b.type = "button"; b.className = "tourb"; b.setAttribute(attr, ""); b.setAttribute("data-k", "do");
    b.innerHTML = "<span>" + label + "</span>" + (lead ? CHEV : "");
    return b;
  }
  function rectOf(e){
    var b = e.getBoundingClientRect(), pad = 6, r = parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0;
    var x = Math.max(4, b.left - pad), y = Math.max(4, b.top - pad);
    var w = Math.min(window.innerWidth - 4, b.right + pad) - x, h = Math.min(window.innerHeight - 4, b.bottom + pad) - y;
    return { x: x, y: y, w: w, h: h, r: Math.max(12, Math.min(r + pad, Math.min(w, h) / 2)) };
  }
  function place(r){
    var W = window.innerWidth, H = window.innerHeight, px = function(n){ return Math.round(n * 100) / 100 + "px"; };
    hole.style.left = px(r.x); hole.style.top = px(r.y); hole.style.width = px(r.w); hole.style.height = px(r.h); hole.style.borderRadius = px(r.r);
    // the blockers: above, below, left and right of the cut-out, and the cut-out itself unless this stop is tapped
    blocks[0].style.cssText = "left:0;top:0;width:100%;height:" + px(Math.max(0, r.y));
    blocks[1].style.cssText = "left:0;top:" + px(r.y + r.h) + ";width:100%;height:" + px(Math.max(0, H - r.y - r.h));
    blocks[2].style.cssText = "left:0;top:" + px(r.y) + ";width:" + px(Math.max(0, r.x)) + ";height:" + px(r.h);
    blocks[3].style.cssText = "left:" + px(r.x + r.w) + ";top:" + px(r.y) + ";width:" + px(Math.max(0, W - r.x - r.w)) + ";height:" + px(r.h);
    mid.style.cssText = "left:" + px(r.x) + ";top:" + px(r.y) + ";width:" + px(r.w) + ";height:" + px(r.h) + (at >= 0 && stops[at].tap ? ";display:none" : "");
  }
  // the words sit under the control where they fit, else over it, else at the foot of the screen
  function seat(r){
    var H = window.innerHeight, ph = pop.offsetHeight, gap = 12, top;
    if (r.y + r.h + gap + ph <= H - 8) { top = r.y + r.h + gap; }
    else if (r.y - gap - ph >= 8) { top = r.y - gap - ph; }
    else { top = H - ph - 12; }
    pop.style.top = Math.round(top) + "px";
  }
  function frame(now){
    raf = 0;
    if (!el || !target) { return; }
    if (!document.documentElement.contains(target) || !drawn(target)) {   // the page redrew it: find it again, or go on
      target.removeAttribute && target.removeAttribute("data-tour-on");
      target = find(stops[at].s);
      if (!target) { return go(at + 1); }
      target.setAttribute("data-tour-on", "");
    }
    var to = rectOf(target), k = from ? Math.min(1, (now - t0) / GLIDE) : 1, e = ease(k), r = to;
    if (k < 1) { r = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e, r: from.r + (to.r - from.r) * e }; }
    else { from = null; }
    cur = r; place(r); seat(to);
    raf = requestAnimationFrame(frame);
  }
  function shut(e){
    // a menu the tour opened, or one left open, closes before a stop outside it
    var open = document.querySelector(".panel.show"), sc, x;
    if (!open || (e && open.contains(e))) { return false; }
    sc = document.querySelector(".scrim.show");
    if (sc) { sc.click(); }
    if (document.querySelector(".panel.show")) { x = document.querySelector(".panel.show [data-close]"); if (x) { x.click(); } }
    return true;
  }
  function fn(name){ return name && typeof window[name] === "function" ? window[name] : null; }
  function go(n){
    busy = false;
    if (target) { target.removeAttribute("data-tour-on"); target = null; }
    seek(n, 0);
  }
  // the next stop that is on the page; one the page sets up, or one inside what the last tap
  // opened, is waited for (2.4 s at most)
  function seek(n, tries){
    var s, e;
    if (!el) { return; }
    if (n >= stops.length) { return end(); }
    s = stops[n];
    if (s.pre && !tries && fn(s.pre)) { try { fn(s.pre)(); } catch (x) {} }
    e = find(s.s);
    if (!e) {
      if ((s.pre || s["in"]) && tries < 60) { busy = true; setTimeout(function(){ seek(n, tries + 1); }, 40); return; }
      return seek(n + 1, 0);
    }
    busy = false;
    show(n, e);
  }
  function show(n, e){
    var s = stops[n], last = n === stops.length - 1, wait = 0;
    if (shut(e)) { wait = still() ? 60 : 240; }
    at = n; target = e; e.setAttribute("data-tour-on", "");
    // the words, a page's name between stars drawn bold; built as nodes, never as markup
    words.textContent = "";
    s.t.split("*").forEach(function(part, i){
      if (!part) { return; }
      var nd = i % 2 ? document.createElement("b") : document.createTextNode(part);
      if (i % 2) { nd.textContent = part; }
      words.appendChild(nd);
    });
    count.textContent = s.num + " of " + stops.total;
    while (foot.lastChild && foot.lastChild.tagName === "BUTTON") { foot.removeChild(foot.lastChild); }
    if (last) { foot.appendChild(btn("data-tour-done", "Done")); }
    else { foot.appendChild(btn("data-tour-skip", "Skip")); foot.appendChild(btn("data-tour-next", "Next", true)); }
    setTimeout(function(){
      if (!el || at !== n) { return; }
      var b = e.getBoundingClientRect(), H = window.innerHeight;
      // bring it to the middle of the screen unless it is the bar's, which never moves
      if (!e.closest(".bar") && (b.top < 80 || b.bottom > H - 150)) { try { e.scrollIntoView({ block: "center" }); } catch (x) {} }
      from = cur && !still() ? cur : null; t0 = performance.now();
      el.classList.add("on");
      if (!raf) { raf = requestAnimationFrame(frame); }
    }, wait);
  }
  function end(){
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (target) { target.removeAttribute("data-tour-on"); }
    document.removeEventListener("click", tapped, true);
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    el = null; target = null; cur = null; at = -1; blocks = [];
    if (fn(done)) { try { fn(done)(); } catch (e) {} }   // the page puts back what it set up for the tour
    done = "";
  }
  function start(id){
    var t = window.RAVI_TOURS[id], i, n = 0, s;
    if (!t || el) { return false; }
    stops = t.stops.map(function(x){ return { s: x.s, t: x.t, tap: !!x.tap, "in": !!x["in"], pre: x.pre || "", when: x.when || "" }; });
    done = t.end || "";
    // the stops there are: a control on the page now, or one inside the menu a counted stop opens
    for (i = 0; i < stops.length; i++) {
      s = stops[i];
      if (s.when && !(fn(s.when) && fn(s.when)())) { s.live = false; }
      else if (s.pre) { s.live = !!fn(s.pre); }
      else if (s["in"]) { s.live = i > 0 && stops[i - 1].live && stops[i - 1].tap; }
      else { s.live = !!find(s.s); }
      if (s.live) { n++; s.num = n; }
    }
    stops = stops.filter(function(x){ return x.live; });
    stops.total = n;
    if (!n) { return false; }
    build();
    go(0);
    return true;
  }
  // the page fills itself from its data: wait for the first stop's control, a few seconds at most
  function boot(){
    var id = null, t, tries = 0;
    try { id = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); } catch (e) {}
    t = id && window.RAVI_TOURS[id];
    if (!t || window.RAVI_GATE) { return; }
    if (!new RegExp("/" + t.page.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(index\\.html)?$").test(location.pathname)) { return; }
    (function wait(){
      var ready = document.readyState === "complete" && find(t.stops[0].s);
      if (ready || tries++ > 30) { setTimeout(function(){ start(id); }, ready ? 350 : 0); return; }
      setTimeout(wait, 100);
    })();
  }
  window.RAVI_TOUR = { start: start, end: end, boot: boot };
  boot();
})();
