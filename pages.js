// THE ICONS. One drawing per name, signed off 2026-10-07: 24 grid, 2-unit round lines,
// one corner size. Most carry an outline (.ico) and a filled (.icf) drawing (the hub grid
// and the strip's two are one drawing in every state); app.css
// shows the filled one while the slot is on. A filled drawing's gaps are cut by a mask,
// and mask ids must be unique on a page, so RAVI_ICON numbers each copy it hands out.
window.RAVI_ICON = (function(){
  var n = 0;
  var SVG = {
    hub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.45" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="1.85" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="2.45" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="8.95" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="6.00" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.10" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><g><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4M3 10h18"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><g fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="0" y="9" width="24" height="2" fill="#000" stroke="none"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M14.5 6.5 18 3h3v3l-3.5 3.5M13 19l6-6M16 16l4 4M19 21l2-2M5 14l4 4M7 17l-3 3M3 19l2 2"/></g><g class="icf"><path d="M14.5 17.5 3 6V3h3l11.5 11.5z" fill="currentColor"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5z" fill="currentColor"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2M5 14l4 4M7 17l-3 3M3 19l2 2"/></g></svg>',
    trade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></g><g class="icf"><path d="M8.5 7H20M15.5 17H4"/><path d="M8 3.5 4 7l4 3.5zM16 13.5l4 3.5-4 3.5z" fill="currentColor"/></g></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7.5L7.5 20.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></g><g class="icf"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7.5L7.5 20.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="currentColor"/></g></svg>',
    soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9h6L12 12z" fill="currentColor" stroke="none"/><path d="M7 21.5V18.6Q12 16.4 17 18.6V21.5z" fill="currentColor" stroke="none"/><path d="M5 22h14M5 2h14"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M14.83 15.99 17.08 17.00 16.03 19.55 13.73 18.66 12.46 19.93 13.35 22.23 10.80 23.28 9.79 21.03 8.01 21.03 7.00 23.28 4.45 22.23 5.34 19.93 4.07 18.66 1.77 19.55 0.72 17.00 2.97 15.99 2.97 14.21 0.72 13.20 1.77 10.65 4.07 11.54 5.34 10.27 4.45 7.97 7.00 6.92 8.01 9.17 9.79 9.17 10.80 6.92 13.35 7.97 12.46 10.27 13.73 11.54 16.03 10.65 17.08 13.20 14.83 14.21ZM6.10 15.10a2.80 2.80 0 1 0 5.60 0a2.80 2.80 0 1 0 -5.60 0Z" fill="currentColor" fill-rule="evenodd" stroke="none"/><path d="M21.94 4.88 23.48 5.06 23.29 6.92 21.75 6.79 21.13 7.81 21.95 9.12 20.38 10.13 19.52 8.85 18.34 9.00 17.82 10.45 16.05 9.86 16.52 8.38 15.67 7.55 14.20 8.06 13.56 6.30 15.01 5.75 15.13 4.56 13.82 3.74 14.80 2.14 16.13 2.92 17.13 2.28 16.96 0.74 18.82 0.51 19.04 2.04 20.16 2.42 21.26 1.33 22.60 2.64 21.54 3.76ZM16.90 5.50a1.60 1.60 0 1 0 3.20 0a1.60 1.60 0 1 0 -3.20 0Z" fill="currentColor" fill-rule="evenodd" stroke="none"/></g><g class="icf"><path d="M14.83 15.99 17.08 17.00 16.03 19.55 13.73 18.66 12.46 19.93 13.35 22.23 10.80 23.28 9.79 21.03 8.01 21.03 7.00 23.28 4.45 22.23 5.34 19.93 4.07 18.66 1.77 19.55 0.72 17.00 2.97 15.99 2.97 14.21 0.72 13.20 1.77 10.65 4.07 11.54 5.34 10.27 4.45 7.97 7.00 6.92 8.01 9.17 9.79 9.17 10.80 6.92 13.35 7.97 12.46 10.27 13.73 11.54 16.03 10.65 17.08 13.20 14.83 14.21ZM6.10 15.10a2.80 2.80 0 1 0 5.60 0a2.80 2.80 0 1 0 -5.60 0Z" fill="currentColor" fill-rule="evenodd" stroke="none"/><path d="M21.94 4.88 23.48 5.06 23.29 6.92 21.75 6.79 21.13 7.81 21.95 9.12 20.38 10.13 19.52 8.85 18.34 9.00 17.82 10.45 16.05 9.86 16.52 8.38 15.67 7.55 14.20 8.06 13.56 6.30 15.01 5.75 15.13 4.56 13.82 3.74 14.80 2.14 16.13 2.92 17.13 2.28 16.96 0.74 18.82 0.51 19.04 2.04 20.16 2.42 21.26 1.33 22.60 2.64 21.54 3.76ZM16.90 5.50a1.60 1.60 0 1 0 3.20 0a1.60 1.60 0 1 0 -3.20 0Z" fill="currentColor" fill-rule="evenodd" stroke="none"/></g></svg>'
  };
  return function(name){
    var s = SVG[name] || '';
    if (s.indexOf('"@"') === -1) { return s; }
    n += 1;
    return s.split('id="@"').join('id="rvm' + n + '"').split('url(#@)').join('url(#rvm' + n + ')');
  };
})();

// The hub's page list. Add a line here to add a page to the hub.
// A line with an empty path is a dead placeholder. Replace one to add a page.
// icon is a getter so each use gets its own mask ids (see THE ICONS above).
window.RAVI_PAGES = [
  {id:"calendar", name:"Events", path:"calendar/", get icon(){ return window.RAVI_ICON("events"); }, rgb:"255,176,32"},
  {id:"counter", name:"Game", path:"counter/", get icon(){ return window.RAVI_ICON("game"); }, rgb:"93,165,238"},
  {id:"trade", name:"Trade", path:"trade/", get icon(){ return window.RAVI_ICON("trade"); }, rgb:"94,210,170"},
  {id:"feedback", name:"Feedback", path:"feedback/", get icon(){ return window.RAVI_ICON("feedback"); }, rgb:"238,95,156"},
  {id:"soon1", name:"Soon", path:"", get icon(){ return window.RAVI_ICON("soon"); }, rgb:""},
  {id:"soon2", name:"Soon", path:"", get icon(){ return window.RAVI_ICON("soon"); }, rgb:""},
  {id:"soon3", name:"Soon", path:"", get icon(){ return window.RAVI_ICON("soon"); }, rgb:""},
  {id:"settings", name:"Settings", path:"settings/", get icon(){ return window.RAVI_ICON("settings"); }, rgb:"150,158,172"}
];

// THE GO TO TILES. One function, shared by the calendar, trade and
// feedback Go to menus (the hub keeps rendering its own grid straight
// from RAVI_PAGES above, unchanged). Renders a Hub tile first, then every
// RAVI_PAGES entry with a path, in list order, skipping the empty-path
// placeholders. rel is the same relative prefix each page already uses
// for its other Go to links ("../" from calendar/trade/feedback).
//
// The tile whose id === hereId is the current page: a <button>, not a
// link, carrying BOTH id="pnhere" and data-close, so it closes the menu
// through whichever mechanism that page already wired -- calendar and
// feedback bind directly to #pnhere, trade delegates on [data-close].
// Harmless on the page that does not use one of the two.
window.RAVI_GOTO = function(container, hereId, rel, withHub){
  if (!container) { return; }
  var HUB_ICON = window.RAVI_ICON("hub");
  var pages = window.RAVI_PAGES || [];
  // A page whose bar already carries Hub leaves it out of Go to; only the
  // counter, whose strip has no Hub slot, passes withHub.
  var h = withHub ? '<a class="gt' + (hereId === "hub" ? " on" : "") + '" href="' + rel + '?hub">' + HUB_ICON + '<span>Hub</span></a>' : '';
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    if (!p.path || p.id === "settings") { continue; }
    if (p.id === hereId) {
      h += '<button type="button" class="gt on" id="pnhere" data-close>' + p.icon + '<span>' + p.name + '</span></button>';
    } else {
      h += '<a class="gt" href="' + rel + p.path + '">' + p.icon + '<span>' + p.name + '</span></a>';
    }
  }
  container.innerHTML = h;
  container.setAttribute("data-k", "pick");
};

// MENU STATE. Two things every page's menus share, kept here so a page only needs markup.
// (1) A bar slot with data-fills="<menu id>" is on (its icon filled) while that menu, or a
//     deeper menu opened from it, is showing. It goes off when every menu is closed.
// (2) A menu's fixed header and footer show an edge (a hairline and a soft shadow, app.css)
//     while its scrolling body runs underneath them.
(function(){
  if (typeof document === "undefined") { return; }  // pages.js is also read as plain data (audit.js)
  function boot(){
    var panels = document.querySelectorAll(".panel");
    var slots = document.querySelectorAll("[data-fills]");
    var activeId = null, i;
    function edges(p){
      var b = p.querySelector(".pbody"), h = p.querySelector(".phead"), f = p.querySelector(".pfoot");
      if (!b) { return; }
      if (h) { h.classList.toggle("edge", b.scrollTop > 0); }
      if (f) { f.classList.toggle("edge", b.scrollTop + b.clientHeight < b.scrollHeight - 1); }
    }
    function sync(){
      var shown = document.querySelector(".panel.show"), j;
      // Every slot that opens the shown menu fills (the calendar's bar gear
      // and its card gear open the same menu); a deeper menu keeps them on.
      if (!shown) { activeId = null; }
      else {
        for (j = 0; j < slots.length; j++) { if (slots[j].getAttribute("data-fills") === shown.id) { activeId = shown.id; } }
        edges(shown);
      }
      for (j = 0; j < slots.length; j++) { slots[j].classList.toggle("on", activeId !== null && slots[j].getAttribute("data-fills") === activeId); }
    }
    var mo = new MutationObserver(sync);
    for (i = 0; i < panels.length; i++) {
      mo.observe(panels[i], { attributes: true, attributeFilter: ["class"] });
      (function(p){
        var b = p.querySelector(".pbody");
        if (!b) { return; }
        var later = function(){ window.requestAnimationFrame(function(){ edges(p); }); };
        b.addEventListener("scroll", function(){ edges(p); }, { passive: true });
        b.addEventListener("transitionend", later);
        new MutationObserver(later).observe(b, { subtree: true, childList: true, attributes: true });
      })(panels[i]);
    }
    window.addEventListener("resize", function(){ var s = document.querySelector(".panel.show"); if (s) { edges(s); } });
    sync();
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", boot); } else { boot(); }
})();

// THE INSTALL SCREEN (STYLE.md, The install screen). RAVI runs as an
// installed app. In a browser tab every page shows only the install screen
// (#ravigate), and app.css hides the rest (html.gate); the page's own markup
// and scripts are left as they are. The screen stays out when the app is
// installed (navigator.standalone on iOS, a standalone display elsewhere),
// when "Continue in the browser" was tapped in this tab (session key
// ravi.web.v1, gone when the tab closes), on a ?sim= test link, or when a
// test tool drives the page (navigator.webdriver; rb-tools m8-test.js proves
// the screen by turning that off). window.RAVI_GATE is true while it shows.
(function(){
  if (typeof document === "undefined" || typeof navigator === "undefined") { return; }  // read as plain data (audit.js)
  window.RAVI_GATE = false;
  function mm(q){ try { return !!(window.matchMedia && window.matchMedia(q).matches); } catch (e) { return false; } }
  if (navigator.standalone === true || mm("(display-mode: standalone)") || mm("(display-mode: fullscreen)") || mm("(display-mode: minimal-ui)")) { return; }
  if (navigator.webdriver) { return; }
  if (/[?&]sim=/.test(location.search)) { return; }
  try { if (sessionStorage.getItem("ravi.web.v1") === "1") { return; } } catch (e) {}
  window.RAVI_GATE = true;
  document.documentElement.classList.add("gate");
  var me = document.currentScript;
  var base = me && me.src ? me.src.replace(/pages\.js(\?.*)?$/, "") : "";
  var ua = navigator.userAgent || "";
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var android = !ios && /Android/.test(ua);
  var safari = ios && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  var ask = null, box = null;
  var SHARE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M8 10H6.5A2.5 2.5 0 0 0 4 12.5v6A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-6a2.5 2.5 0 0 0-2.5-2.5H16"/></svg>';
  var PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  var MENU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
  var TOGGLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>';
  var TOP = '<div class="gwtop"><h1 class="gwname"><span class="logo1">RA</span><span class="logo2">VI</span></h1>' +
    '<p class="gwline">Events, Game and Trade for Riftbound on Vancouver Island.</p></div>';
  var NOTE = '<p class="gwnote">RAVI is built to run as an app. Your matches and saved trades stay on this phone.</p>' +
    '<div class="gwsp"></div><footer class="foot"><p>On a computer, or just looking? <a href="#" data-web data-k="do">Continue in the browser</a></p></footer>';
  // One numbered step; sub is an optional second line, 13 muted.
  function step(n, icon, words, sub){
    return '<div class="gwstep"><span class="gwn">' + n + '</span>' + icon + '<span class="gwt">' + words +
      (sub ? '<small class="gwsub">' + sub + '</small>' : '') + '</span></div>';
  }
  // iPhone: the taps as Safari shows them (signed off from Mako's screenshots,
  // 2026-10-09). Safari's compact bar hides Share behind the menu button;
  // another browser on iOS starts at Share.
  function markup(){
    if (ios) {
      var ICON = '<img src="' + base + 'icons/apple-touch-icon.png" alt="">', h = '', k = 0;
      if (safari) { h += step(++k, MENU, 'Tap the <b>menu button</b> next to the address bar', 'No menu button? Tap Share and go to step 3.'); }
      h += step(++k, SHARE, safari ? 'Tap <b>Share</b>' : 'Tap <b>Share</b> in the address bar or menu');
      h += step(++k, PLUS, 'Tap <b>View More</b>, scroll down, then tap <b>Add to Home Screen</b>');
      h += step(++k, TOGGLE, 'Keep <b>Open as Web App</b> on, then tap <b>Add</b>');
      h += step(++k, ICON, 'Open <b>RAVI</b> from your Home Screen');
      return TOP + '<section class="gwcard glass" id="gwios"><div class="shead"><h2>Add RAVI to your Home Screen</h2></div>' + h + '</section>' + NOTE;
    }
    if (android) {
      return TOP + '<section class="gwcard glass" id="gwand"><div class="shead"><h2>Install RAVI</h2></div>' +
        '<button type="button" class="pact btn glass" id="gwinst" data-k="do" hidden>Install RAVI</button>' +
        '<p class="gwor" id="gwhow">Tap the browser menu, then Install app.</p></section>' + NOTE;
    }
    return TOP + '<section class="gwcard glass" id="gwpc"><div class="shead"><h2>RAVI is a phone app</h2></div>' +
      '<p class="gwtxt">Open this page on your phone, then add it to your Home Screen.</p>' +
      '<button type="button" class="pact btn glass" data-web data-k="do">Continue in the browser</button></section>';
  }
  // Android: the browser offers its own Install prompt once it is ready.
  function offer(){
    var b = document.getElementById("gwinst"), w = document.getElementById("gwhow");
    if (!b || !w || !ask) { return; }
    b.hidden = false;
    w.textContent = "or use the browser menu: Install app";
  }
  function installed(){
    var b = document.getElementById("gwinst"), w = document.getElementById("gwhow");
    if (b) { b.hidden = true; }
    if (w) { w.textContent = "Installed. Open RAVI from your home screen."; }
  }
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); ask = e; offer(); });
  window.addEventListener("appinstalled", function(){ ask = null; installed(); });
  function render(){
    box = document.createElement("div");
    box.id = "ravigate";
    box.innerHTML = markup();
    document.body.insertBefore(box, document.body.firstChild);
    box.addEventListener("click", function(e){
      var t = e.target.closest ? e.target.closest("[data-web], #gwinst") : null;
      if (!t) { return; }
      e.preventDefault();
      if (t.id === "gwinst") {
        if (!ask) { return; }
        // The browser's prompt can be shown once; after a No, the menu is the way.
        var a = ask; ask = null;
        t.hidden = true;
        document.getElementById("gwhow").textContent = "Tap the browser menu, then Install app.";
        a.prompt();
        if (a.userChoice && a.userChoice.then) { a.userChoice.then(function(r){ if (r && r.outcome === "accepted") { installed(); } }); }
        return;
      }
      // Continue in the browser: remembered for this tab, then the page
      // loads again as itself (so the hub's opening plays then, not hidden).
      try { sessionStorage.setItem("ravi.web.v1", "1"); location.reload(); return; } catch (x) {}
      document.documentElement.classList.remove("gate");
      box.parentNode.removeChild(box);
      window.RAVI_GATE = false;
    });
    offer();
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", render); } else { render(); }
})();
