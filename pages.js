// The hub's page list. Add a line here to add a page to the hub.
// A line with an empty path is a dead placeholder. Replace one to add a page.
window.RAVI_PAGES = [
  {id:"calendar", name:"Events", path:"calendar/", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect class="fillon" x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4" stroke-linecap="round"/><path d="M3 9h18" stroke="#3A3B3C"/></svg>', rgb:"255,176,32"},
  {id:"counter", name:"Game", path:"counter/", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/></svg>', rgb:"93,165,238"},
  {id:"trade", name:"Trade", path:"trade/", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="11" height="15" rx="2.5"/><rect class="fillon" x="10" y="3" width="11" height="15" rx="2.5"/></svg>', rgb:"94,210,170"},
  {id:"feedback", name:"Feedback", path:"feedback/", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path class="fillon" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17h0A1.5 1.5 0 0 1 4 15.5z"/></svg>', rgb:"238,95,156"},
  {id:"soon1", name:"Soon", path:"", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/></svg>', rgb:""},
  {id:"soon2", name:"Soon", path:"", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/></svg>', rgb:""},
  {id:"soon3", name:"Soon", path:"", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/></svg>', rgb:""},
  {id:"soon4", name:"Soon", path:"", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="5"/></svg>', rgb:""}
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
  var HUB_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11l8-7 8 7v8a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z"/></svg>';
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
