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
    soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M5 22h14M5 2h14"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/></g><g class="icf"><path d="M5 22h14M5 2h14"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2z" fill="currentColor"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22z" fill="currentColor"/></g></svg>'
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
  {id:"soon4", name:"Soon", path:"", get icon(){ return window.RAVI_ICON("soon"); }, rgb:""}
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
window.RAVI_GOTO = function(container, hereId, rel){
  if (!container) { return; }
  var HUB_ICON = window.RAVI_ICON("hub");
  var pages = window.RAVI_PAGES || [];
  var h = '<a class="gt' + (hereId === "hub" ? " on" : "") + '" href="' + rel + '?hub">' + HUB_ICON + '<span>Hub</span></a>';
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    if (!p.path) { continue; }
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
    var active = null, i;
    function edges(p){
      var b = p.querySelector(".pbody"), h = p.querySelector(".phead"), f = p.querySelector(".pfoot");
      if (!b) { return; }
      if (h) { h.classList.toggle("edge", b.scrollTop > 0); }
      if (f) { f.classList.toggle("edge", b.scrollTop + b.clientHeight < b.scrollHeight - 1); }
    }
    function sync(){
      var shown = document.querySelector(".panel.show"), j;
      if (!shown) { active = null; }
      else {
        for (j = 0; j < slots.length; j++) { if (slots[j].getAttribute("data-fills") === shown.id) { active = slots[j]; } }
        edges(shown);
      }
      for (j = 0; j < slots.length; j++) { slots[j].classList.toggle("on", slots[j] === active); }
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
