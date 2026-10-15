// THE ICONS. One drawing per name: 24 grid, 2-unit round lines, one corner size. Signed off
// 2026-10-07 (M5); the icon pass (2026-10-15) redrew Rules (a scale), Latest (two stars; its
// key is still whatsnew) and App settings (sliders). Every page icon and every bar icon lives
// here (RAVI_BAR draws the bars from it). Most carry an outline (.ico) and a filled (.icf)
// drawing (the hub grid, Soon, Reset, info and the strip's Undo and Log are one drawing in
// every state); app.css shows the filled one while the slot is on. A filled drawing's gaps
// are cut by a mask, and mask ids must be unique on a page, so RAVI_ICON numbers each copy.
window.RAVI_ICON = (function(){
  var n = 0;
  var SVG = {
    hub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.45" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="1.85" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="2.45" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="8.95" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="6.00" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.10" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><g><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4M3 10h18"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><g fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="0" y="9" width="24" height="2" fill="#000" stroke="none"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M14.5 6.5 18 3h3v3l-3.5 3.5M13 19l6-6M16 16l4 4M19 21l2-2M5 14l4 4M7 17l-3 3M3 19l2 2"/></g><g class="icf"><path d="M14.5 17.5 3 6V3h3l11.5 11.5z" fill="currentColor"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5z" fill="currentColor"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2M5 14l4 4M7 17l-3 3M3 19l2 2"/></g></svg>',
    trade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></g><g class="icf"><path d="M8.5 7H20M15.5 17H4"/><path d="M8 3.5 4 7l4 3.5zM16 13.5l4 3.5-4 3.5z" fill="currentColor"/></g></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7.5L7.5 20.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></g><g class="icf"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7.5L7.5 20.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="currentColor"/></g></svg>',
    rules: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M12 4v16M7.5 20h9M4.5 6.5Q12 4.5 19.5 6.5M5 6.6V11M19 6.6V11"/><path d="M2 11h6a3 3 0 0 1-6 0z"/><path d="M16 11h6a3 3 0 0 1-6 0z"/></g><g class="icf"><path d="M12 4v16M7.5 20h9M4.5 6.5Q12 4.5 19.5 6.5M5 6.6V11M19 6.6V11"/><path d="M2 11h6a3 3 0 0 1-6 0z" fill="currentColor"/><path d="M16 11h6a3 3 0 0 1-6 0z" fill="currentColor"/></g></svg>',
    soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9h6L12 12z" fill="currentColor" stroke="none"/><path d="M7 21.5V18.6Q12 16.4 17 18.6V21.5z" fill="currentColor" stroke="none"/><path d="M5 22h14M5 2h14"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M3 5h9.5M17.5 5H21M3 12h2.5M10.5 12H21M3 19h10.5M18.5 19H21"/><circle cx="15" cy="5" r="2.5"/><circle cx="8" cy="12" r="2.5"/><circle cx="16" cy="19" r="2.5"/></g><g class="icf"><path d="M3 5h18M3 12h18M3 19h18"/><circle cx="15" cy="5" r="2.5" fill="currentColor"/><circle cx="8" cy="12" r="2.5" fill="currentColor"/><circle cx="16" cy="19" r="2.5" fill="currentColor"/></g></svg>',
    // bar slots (RAVI_BAR below): gear is the bar's Settings slot; the strip's three are the counter's
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M19.32 13.10 21.72 14.33 20.53 17.22 17.95 16.40 16.40 17.95 17.22 20.53 14.33 21.72 13.10 19.32 10.90 19.32 9.67 21.72 6.78 20.53 7.60 17.95 6.05 16.40 3.47 17.22 2.28 14.33 4.68 13.10 4.68 10.90 2.28 9.67 3.47 6.78 6.05 7.60 7.60 6.05 6.78 3.47 9.67 2.28 10.90 4.68 13.10 4.68 14.33 2.28 17.22 3.47 16.40 6.05 17.95 7.60 20.53 6.78 21.72 9.67 19.32 10.90Z"/><circle cx="12" cy="12" r="3"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M19.32 13.10 21.72 14.33 20.53 17.22 17.95 16.40 16.40 17.95 17.22 20.53 14.33 21.72 13.10 19.32 10.90 19.32 9.67 21.72 6.78 20.53 7.60 17.95 6.05 16.40 3.47 17.22 2.28 14.33 4.68 13.10 4.68 10.90 2.28 9.67 3.47 6.78 6.05 7.60 7.60 6.05 6.78 3.47 9.67 2.28 10.90 4.68 13.10 4.68 14.33 2.28 17.22 3.47 16.40 6.05 17.95 7.60 20.53 6.78 21.72 9.67 19.32 10.90Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="#000" stroke="none"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M3.3 15.3C4.6 14 6 12.5 6 8a6 6 0 0 1 12 0c0 4.5 1.4 6 2.7 7.3A1 1 0 0 1 20 17H4a1 1 0 0 1-.7-1.7z"/><path d="M10.27 21a2 2 0 0 0 3.46 0"/></g><g class="icf"><path d="M3.3 15.3C4.6 14 6 12.5 6 8a6 6 0 0 1 12 0c0 4.5 1.4 6 2.7 7.3A1 1 0 0 1 20 17H4a1 1 0 0 1-.7-1.7z" fill="currentColor"/><path d="M10.27 21a2 2 0 0 0 3.46 0"/></g></svg>',
    saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></g><g class="icf"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"/></g></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6M21 3l-9 9M15 3h6v6"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><rect x="3" y="3" width="18" height="18" rx="2" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="13" y="0" width="11" height="11" fill="#000" stroke="none"/><path d="M21 3l-9 9" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/><path d="M21 3l-9 9M15 3h6v6"/></g></svg>',
    whatsnew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M10 6Q10.7 13.3 18 14Q10.7 14.7 10 22Q9.3 14.7 2 14Q9.3 13.3 10 6z"/><path d="M18 2Q18.3 5.2 21.5 5.5Q18.3 5.8 18 9Q17.7 5.8 14.5 5.5Q17.7 5.2 18 2z" fill="currentColor"/></g><g class="icf"><path d="M10 6Q10.7 13.3 18 14Q10.7 14.7 10 22Q9.3 14.7 2 14Q9.3 13.3 10 6z" fill="currentColor"/><path d="M18 2Q18.3 5.2 21.5 5.5Q18.3 5.8 18 9Q17.7 5.8 14.5 5.5Q17.7 5.2 18 2z" fill="currentColor"/></g></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.6C10.2 5.2 7 4.5 3 4.9v13.2c4-.4 7.2.3 9 1.7 1.8-1.4 5-2.1 9-1.7V4.9c-4-.4-7.2.3-9 1.7z"/><path d="M12 6.6v13.2"/></svg>',
    // a menu head's explanation, opened in place (calendar Follow)
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5h.01" stroke-width="2.6"/></svg>'
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
  {id:"calendar", name:"Events", path:"calendar/", get icon(){ return window.RAVI_ICON("events"); }, rgb:"255,200,40"},
  {id:"counter", name:"Game", path:"counter/", get icon(){ return window.RAVI_ICON("game"); }, rgb:"200,35,70"},
  {id:"trade", name:"Trade", path:"trade/", get icon(){ return window.RAVI_ICON("trade"); }, rgb:"115,80,240"},
  {id:"feedback", name:"Feedback", path:"feedback/", get icon(){ return window.RAVI_ICON("feedback"); }, rgb:"40,95,240", glass:true},
  {id:"rules", name:"Rules", path:"rules/", get icon(){ return window.RAVI_ICON("rules"); }, rgb:"0,190,140", glass:true},
  {id:"soon2", name:"Soon", path:"", get icon(){ return window.RAVI_ICON("soon"); }, rgb:""},
  {id:"soon3", name:"Soon", path:"", get icon(){ return window.RAVI_ICON("soon"); }, rgb:""},
  {id:"settings", name:"Settings", path:"settings/", get icon(){ return window.RAVI_ICON("settings"); }, rgb:"205,220,240", glass:true}
];

// THE PAGE COLOUR (colour system, 2026-10-14). Every page's bar pill takes its RAVI_PAGES colour;
// a page marked glass:true (Feedback, Rules, Settings) also tints its glass.
// pages.js finds the page from its folder and sets --page (the rgb triple), --tint (the glass
// tint, at --cg), --on-pc / --on-ink (the bar's you-are-here pill and its icon) and the class
// paged (app.css lifts grey text on tinted glass so it stays readable). The hub sets
// nothing: its plate stays clear and each block carries its own colour.
(function(){
  if (typeof document === "undefined" || typeof location === "undefined") { return; }
  var m = /\/([a-z]+)\/(index\.html)?$/.exec(location.pathname), pages = window.RAVI_PAGES, i, c, r;
  if (!m) { return; }
  for (i = 0; i < pages.length; i++) {
    if (pages[i].path === m[1] + "/" && pages[i].rgb) {
      c = pages[i].rgb.split(",");
      for (r = []; r.length < 3;) { r.push(Math.round(+c[r.length] + (255 - +c[r.length]) * .62)); }
      var st = document.documentElement.style;
      st.setProperty("--page", pages[i].rgb);
      st.setProperty("--on-pc", "rgba(" + pages[i].rgb + ",.54)");
      st.setProperty("--on-ink", "rgb(" + r.join(",") + ")");
      if (pages[i].glass) {
        st.setProperty("--tint", "rgba(" + pages[i].rgb + ",var(--cg))");
        document.documentElement.classList.add("paged");
      }
      return;
    }
  }
})();

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

// THE BAR (from M9.6). Every page's bar is built here, so a slot two pages share is the same
// copy, and every bar icon comes from the SVG table above by name. A page holds an empty
// <nav class="bar frost" id="tabs"></nav> (the counter's strip holds only its Layout track)
// and, straight after it, one line: RAVI_BAR(nav, slots). The slots are added in bar order:
//   "hub"              the Hub link, slot 1 on every page that has one
//   {go:"<page id>"}   the page's own Go to slot, on, its icon and name from RAVI_PAGES;
//                      a:[[name, value], ...] adds attributes after its id
//   {tag, icon, a}     any other slot: "a" or "button", an icon name from the SVG table,
//                      and its attributes in order ([name, null] writes a bare attribute)
// It runs before the page's own script, so a page binds its slots by id as before.
window.RAVI_BAR = function(nav, slots){
  if (!nav) { return; }
  function esc(v){ return String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function attrs(list){
    var s = "", k;
    for (k = 0; k < list.length; k++) { s += " " + list[k][0] + (list[k][1] === null ? "" : '="' + esc(list[k][1]) + '"'); }
    return s;
  }
  var pages = window.RAVI_PAGES || [], h = "", i, j, sl, p;
  for (i = 0; i < slots.length; i++) {
    sl = slots[i];
    if (sl === "hub") {
      h += '<a class="tab" href="../?hub" aria-label="Hub" data-k="slot">' + window.RAVI_ICON("hub") + '</a>';
    } else if (sl.go) {
      p = null;
      for (j = 0; j < pages.length; j++) { if (pages[j].id === sl.go) { p = pages[j]; } }
      if (!p) { continue; }
      h += '<button type="button" class="tab on" id="tabnav"' + attrs(sl.a || []) + ' aria-label="Pages, you are on ' + esc(p.name) + '" data-k="slot">' + p.icon + '</button>';
    } else {
      h += '<' + sl.tag + (sl.tag === "button" ? ' type="button"' : '') + attrs(sl.a || []) + '>' + window.RAVI_ICON(sl.icon) + '</' + sl.tag + '>';
    }
  }
  nav.insertAdjacentHTML("beforeend", h);
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
  var MORE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 10.5l4 4 4-4"/></svg>';
  var MENU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>';
  var TOGGLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/></svg>';
  var TOP = '<div class="gwtop"><h1 class="gwname"><span class="logo1">RA</span><span class="logo2">VI</span></h1>' +
    '<p class="gwline">Events, Game and Trade for Riftbound on Vancouver Island.</p></div>';
  var NOTE = '<p class="gwnote">RAVI is built to run as an app. Your matches and saved trades stay on this phone.</p>' +
    '<footer class="foot"><p>On a computer, or just looking? <a href="#" data-web data-k="do">Continue in the browser</a></p></footer>';
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
      h += step(++k, MORE, 'Scroll down, or tap <b>View More</b>');
      h += step(++k, PLUS, 'Tap <b>Add to Home Screen</b>');
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
