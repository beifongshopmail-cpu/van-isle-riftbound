// REDUCE MOTION (App settings, Motion; plan 2 M6, Mako's yes 2026-11-03): vir.motion.v1 "less" does
// what the phone's own Reduce Motion does, for RAVI alone. html.rm turns every transition and
// animation off (app.css), and every script that asks for prefers-reduced-motion hears "reduce",
// so the hub's intro, glow and rim, the sliding fills and the counter's moves stay still too.
(function(){
  if (typeof document === "undefined" || typeof window === "undefined") { return; }
  var less = false;
  try { less = localStorage.getItem("vir.motion.v1") === "less"; } catch (e) {}
  window.RAVI_LESS = less;
  if (!less) { return; }
  document.documentElement.classList.add("rm");
  var mm = window.matchMedia;
  if (!mm) { return; }
  function fixed(q, on){ var f = function(){}; return { matches: on, media: q, onchange: null, addListener: f, removeListener: f, addEventListener: f, removeEventListener: f, dispatchEvent: function(){ return false; } }; }
  window.matchMedia = function(q){
    var t = String(q);
    if (/prefers-reduced-motion\s*:\s*reduce/.test(t)) { return fixed(t, true); }
    if (/prefers-reduced-motion\s*:\s*no-preference/.test(t)) { return fixed(t, false); }
    return mm.call(window, q);
  };
})();

// Plan 2 M8 icon pass (Mako's picks 2026-11-05): Trade board (users-three), Tier list
// (chart-bar-horizontal) and All pages (stack) are Phosphor (MIT) as drawn: bold in the bar, fill when
// on, regular on the hub (.icb).
// THE ICONS. One drawing per name: 24 grid, 2-unit round lines, one corner size. Signed off
// 2026-10-07 (M5); the icon pass (2026-10-15/16) redrew Game (block pommels), Trade (handshake),
// Feedback (dots), Rules (a scroll), App settings (two gears), the bar's gear, Out, Latest (a
// megaphone; its key is still whatsnew), Reset, Undo and Info. Shapes adapted from Phosphor (MIT),
// Remix Icon (Apache-2.0), Material Symbols (Apache-2.0) and Lucide (ISC); Trade is Material's
// handshake as drawn (weight 600 = the 2-unit line; its .icb copy, weight 400, is the hub's).
// Every page icon and every bar icon lives here (RAVI_BAR draws the bars from it). Most carry an
// outline (.ico) and a filled (.icf) drawing (the hub grid, All pages, Soon, Reset and the strip's
// Undo and Log are one drawing in every state); app.css shows the filled one while the slot is on.
// Outline lines set no width of their own, so the hub's thinner line reaches them all. A filled
// drawing's gaps are cut by a mask ("@"), an outline overlap by a second one ("@b"); mask ids
// must be unique on a page, so RAVI_ICON numbers each copy it hands out.
// ONE ARROW (plan 2 M8 block 7, Mako's notes 2026-11-05): Lucide's arrow (ISC) in four directions, the path's d
// only; every arrow the app draws is this one (the sort chip, Trade's move and verdict, the Trade board's verdict,
// Collection's Movers and its price-change chips). Beside words, a small arrow uses the arrow's own box,
// viewBox "4 4 16 16", line 2.
window.RAVI_ARROW = function(dir){ return { up: "M12 19V5M5 12l7-7 7 7", dn: "M12 5v14M19 12l-7 7-7-7", l: "M19 12H5M12 19l-7-7 7-7", r: "M5 12h14M12 5l7 7-7 7" }[dir]; };
window.RAVI_ICON = (function(){
  var n = 0;
  var SVG = {
    hub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.45" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="1.85" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="2.45" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="8.95" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="6.00" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.10" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><g><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4M3 10h18"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><g fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="0" y="9" width="24" height="2" fill="#000" stroke="none"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M18.95 18.95h1.5v1.5h-1.5z"/><path d="M3.55 18.95h1.5v1.5h-1.5z"/><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="M13 19l6-6"/><path d="M5 14l4 4"/><path d="M16 16l2.95 2.95"/><path d="M7 17 5.05 18.95"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M14.5 17.5 3 6V3h3l11.5 11.5z" fill="#fff" stroke="none"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5z" fill="#fff" stroke="none"/><path d="M18.95 18.95h1.5v1.5h-1.5z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.55 18.95h1.5v1.5h-1.5z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 17.5 3 6V3h3l11.5 11.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 19l6-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14l4 4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16l2.95 2.95" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 17 5.05 18.95" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    trade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M474.06-140q4.81 0 11.31-2.22 6.5-2.21 11.06-6.78l334.74-335.74q14.11-14.14 21.75-32.77 7.65-18.63 7.65-38.89 0-19.87-7.65-39.33-7.64-19.46-21.75-34.1L667-794q-13.56-13-31.43-19.5-17.86-6.5-35.82-6.5-17.89 0-35.15 6.22-17.25 6.21-29.69 18.08l-14.04 14.61 77.61 78.05q14.69 16.26 26.11 37.3Q636-644.7 636-619.27q0 42.49-33.5 75.44-33.51 32.96-76.69 32.96-28.2 0-46.96-8.63t-35.02-24.89l-71.87-71.87-170.83 170.83q-5 4.55-7 10.19t-2 11.81q0 13 8.36 21.21 8.36 8.22 21.17 8.22 5.91 0 11.63-3 5.73-3 9.84-7l111.19-111.14q9.16-9.21 21.16-9.21t21 9.29q9 9.28 9 21.06 0 11.79-9 20.65l-110.3 110.29q-5.05 5.06-7.05 11.45-2 6.38-2 12.18 0 12.22 8.44 20.83Q294-310 306-310q6 0 11.85-2.54 5.86-2.53 10.46-6.57l109.84-110.47q9.2-9.2 21.2-8.92 12 .28 21 8.72 9 9 9 21t-9 21L369.5-277.48q-3.5 4.05-6.28 10.55-2.79 6.5-2.79 12.5 0 12 9 21t21 9q6 0 11.2-2.29 5.2-2.28 9.8-6.71l111.35-111.92q8.86-9 20.93-8.71 12.07.28 21.07 8.71 9 9.57 9 21.35 0 11.79-9 20.65L453.43-192q-4.43 5-6.71 11.39-2.29 6.38-2.29 11.18 0 14.22 8 21.83 8 7.6 21.63 7.6Zm.37 73q-35.82 0-64.37-24.78-28.54-24.78-35.8-62.48-32.87-5.57-56.15-29.13-23.28-23.57-28.85-55.87-31.74-6.13-54.52-29.35-22.78-23.22-28.91-54.52-37.57-7.26-62.42-35.38-24.85-28.13-24.85-65.95 0-19.24 7.54-38.46 7.53-19.23 21.86-33.99l168.43-168.44Q339.43-688 372.15-688t55.94 22.65L490.43-603q8 8 17.69 12.78 9.69 4.79 19.45 4.79 12.51 0 23.69-11.38 11.17-11.37 11.17-24.15 0-5.91-4.06-13.97-4.07-8.07-11.54-16.09L402.7-795.17q-12.4-12.4-30.83-18.61-18.44-6.22-37.5-6.22-19.69 0-36.62 6.22-16.92 6.21-28.69 18.51L122.61-649.91q-17.18 17.74-21.11 43.69-3.93 25.96 5.93 49.13 3.31 13.83-3.67 26.46t-21.09 17.06q-14.11 4.44-27.52-3.39-13.41-7.82-17.56-22.22-14.46-43.3-6.89-86.1 7.56-42.81 40.87-76.22l144.78-145.24q23.13-23.13 55.15-34.2Q303.52-892 335.35-892q33.53 0 64.2 11.06 30.67 11.07 53.54 33.07l14.61 14.04 14.04-14.04q22.56-21.43 54.44-32.78Q568.05-892 600.61-892q32.39 0 63.56 11.91 31.18 11.92 54.31 35.05l167.13 166.56q23.71 23.48 35.55 56.39Q933-589.17 933-556.4q0 32.78-12.7 65.83-12.69 33.05-36.39 57.31L547.48-97.39q-14.7 14.69-33.46 22.54T474.43-67ZM362.17-636.17Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g><g class="icf"><path d="M479.48-96.82q-17 0-29.57-12.29-12.56-12.28-12.56-29.28 0-9.26 3.56-17.89 3.57-8.63 10.7-16.33l169.35-168.78q4.43-4.43 4.43-9.93t-4.43-10.5q-5-4.44-10.5-5-5.5-.57-10.5 4.43L430.61-193.04q-7.13 7.13-15.55 10.13-8.41 3-18.1 3-16.44 0-28.5-11.78-12.07-11.79-12.07-28.79 0-11.13 3-19.04 3-7.91 10.26-14.61l168.22-168.78q5-4.44 5-10.22t-5-10.78q-4.44-4.44-10.22-4.44t-10.78 4.44L351.48-278.96q-6.57 6.57-15.26 10.13-8.7 3.57-19.39 3.57-16 0-28.29-12.28-12.28-12.29-12.28-28.85 0-9.7 3.57-17.83 3.56-8.13 10.13-15.26l166.52-167.08q5-4.44 5-9.94 0-5.5-4.72-10.22-4.72-4.71-10.5-4.71T435.48-527L269.96-360.48q-6.13 6.7-14.55 9.7-8.41 3-19.54 3-17 0-29.07-11.57-12.06-11.56-12.06-28 0-9.69 4.13-18.95 4.13-9.27 11.26-16.4l187.61-188.17q13.65-13.65 32.78-12.02 19.13 1.63 33.91 15.85l74.79 75.34q14.39 14.4 29.3 23.03t38.44 8.63q35.95 0 59.08-22.2 23.13-22.2 23.13-59.46 0-19.08-7.48-33.43-7.47-14.35-22.73-29.61l-113.31-113.3q-17.95-17.96-19.67-42.9-1.72-24.93 16.8-40.76 12.7-9.43 26.26-13.93 13.57-4.5 28.7-4.5 25.26 0 50.46 11.85 25.19 11.84 45.32 31.98l157.7 158.12q21.39 21.96 32.43 48.48 11.05 26.53 11.05 60.61 0 28.48-11.83 54.35t-31.65 46.26L513.7-110.52q-8.57 8.56-16.55 11.13-7.98 2.57-17.67 2.57ZM113.52-453.3q-25.82-20-39.3-47.98-13.48-27.98-13.48-58.81 0-27.69 10.63-53.45Q82-639.31 103.7-661L258-816.3q18.13-17.57 40.61-27.98 22.48-10.42 47.74-10.42 27.26 0 52.74 9.85 25.47 9.85 44.74 28.55l193.13 192.56q9.26 9.26 15.45 19.52 6.2 10.26 6.2 22.52 0 21.83-15.2 37.03-15.19 15.19-37.02 15.19-13.26 0-24.8-6.69-11.55-6.7-21.24-16.96l-76.05-76.04q-23.21-23.22-55.84-23.22-32.64 0-55.85 23.22L196.13-452.7q-16.26 16.26-39.8 15.11-23.55-1.15-42.81-15.71Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g><g class="icb"><path d="M475-140q5 0 11.5-2.5T497-149l337-338q13-13 19.5-29.5T860-550q0-17-6.5-34T834-614L654-794q-13-13-30-19.5t-34-6.5q-17 0-33.5 6.5T527-794l-18 18 81 82q13 14 23 32.5t10 40.5q0 38-29.5 67T526-525q-25 0-41.5-7.5T454-554l-73-73-181 181q-5 5-7 10.5t-2 11.5q0 13 8.5 21.5T221-394q6 0 11.5-3t9.5-7l117-117q9-9 21-9t21 9q9 9 9 21t-9 21L285-363q-5 5-7 11t-2 12q0 12 9 21t21 9q6 0 11.5-2.5t9.5-6.5l117-117q9-9 21-9t21 9q9 9 9 21t-9 21L370-278q-4 4-6.5 10.5T361-255q0 12 9 21t21 9q6 0 11-2t10-7l117-117q9-9 21-9t21 9q9 9 9 21t-9 21L454-192q-5 5-7 11t-2 11q0 14 8 22t22 8Zm0 60q-33 0-59-24.5T385-165q-34-5-57-28t-28-57q-34-5-56.5-28.5T216-335q-37-5-61-30t-24-60q0-17 6.5-34t19.5-30l182-182q17-17 42-17t42 17l68 68q8 8 17.5 12.5T527-586q13 0 24.5-11.5T563-622q0-6-3.5-13.5T548-651L405-794q-13-13-30-19.5t-34-6.5q-17 0-33.5 6.5T278-794L126-642q-20 20-24.5 48.5T108-539q5 11 0 22.5T92-500q-11 5-23 0t-17-16q-17-45-10-89.5T84-685l151-151q22-22 50-32.5t57-10.5q29 0 56.5 10.5T448-836l18 18 18-18q22-22 50-32.5t57-10.5q29 0 56.5 10.5T697-836l179 179q22 22 33 50t11 57q0 29-11 56.5T876-444L539-107q-13 13-29.5 20T475-80Zm-97-546Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.5L7.5 21V17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 10h.01M12 10h.01M16 10h.01" style="stroke-width:calc(var(--sw,2)*1.3)"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.5L7.5 21V17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10h.01M12 10h.01M16 10h.01" fill="none" stroke="#000" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    rules: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/><path d="M15 7h-5M15 10h-5M13 13h-3"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M6 3h11a2 2 0 0 1 2 2v12h-8a1 1 0 0 0-1 1v1a2 2 0 0 1-4 0z" fill="#fff" stroke="none"/><path d="M19 17V5a2 2 0 0 0-2-2H4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h-5M15 10h-5M13 13h-3" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    // Decks: Material's fanned cards, turned upside down so they fan up like a hand (Mako 2026-10-26),
    // raised half a unit so the ink stays centred on 12
    decks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M140.78-200.78l-33.56-14.87q-31-13-41.72-44.69-10.72-31.69 3.28-62.88l72-156v278.44Zm160.28 87.56q-33.28 0-56.78-23.83t-23.5-56.6v-239.57l106.45 294q2.99 7 5.55 13.5 2.57 6.5 7.57 12.5h-39.29Zm236.24 4.61q-41.73 14.96-81.5-3.28-39.76-18.24-54.71-59.98L226.91-650.13q-14.95-41.74 3.57-81.28 18.52-39.55 60.26-54.5l289.69-106.05q41.74-14.95 81.29 3.57 39.54 18.52 54.5 60.26l174.04 477.69q14.96 41.74-3.28 81.29-18.24 39.54-59.98 54.5L537.3-108.61Zm-36.47-99.87 289-106.04-173.92-477-288.56 106.04 173.48 477ZM558.87-500Z" transform="matrix(-.025 0 0 -.025 24 -.5)" fill="currentColor" stroke="none"/></g><g class="icf"><path d="M140.78-200.78l-33.56-14.87q-31-13-41.72-44.78-10.72-31.79 3.28-62.79l72-156v278.44Zm160 87.56q-33 0-56.5-23.71-23.5-23.72-23.5-56.72v-239.57l106.44 294q3 7 5.56 13.5 2.57 6.5 7.57 12.5h-39.57Zm236.52 4.61q-41.73 14.96-81.5-3.28-39.76-18.24-54.71-59.98L226.91-650.13q-14.95-41.74 3.57-81.28 18.52-39.55 60.26-54.5l289.69-106.05q41.74-14.95 81.29 3.57 39.54 18.52 54.5 60.26l174.04 477.69q14.96 41.74-3.28 81.29-18.24 39.54-59.98 54.5L537.3-108.61Z" transform="matrix(-.025 0 0 -.025 24 -.5)" fill="currentColor" stroke="none"/></g><g class="icb"><path d="M160-207l-33-16q-31-13-42-44.5t3-62.5l72-156v279Zm160 87q-33 0-56.5-24T240-201v-239l107 294q3 7 5 13.5t7 12.5h-39Zm206-5q-31 11-62-3t-42-45L245-662q-11-31 3-61.5t45-41.5l301-110q31-11 61.5 3t41.5 45l178 489q11 31-3 61.5T827-235L526-125Zm-28-75 302-110-179-490-301 110 178 490Zm62-300Z" transform="matrix(-.025 0 0 -.025 24 -.5)" fill="currentColor" stroke="none"/></g></svg>',
    // Collection: a safe on feet, hinges on the left wall, its dial and bolt (M13 icon pass, Mako's
    // pick 2026-10-26: after Phosphor's vault, MIT, redrawn on the app's line and centred on 12)
    collection: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><rect width="19" height="16" x="3" y="3" rx="2"/><path d="M6.5 19v2M18.5 19v2M2 7v2M2 13v2"/><circle cx="13.5" cy="11" r="3.5"/><path d="M17 11h5"/><path d="M13.5 11h.01" style="stroke-width:calc(var(--sw,2)*1.3)"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><rect width="19" height="16" x="3" y="3" rx="2" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 19v2M18.5 19v2M2 7v2M2 13v2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="13.5" cy="11" r="3.5" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 11h5" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 11h.01" fill="none" stroke="#000" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    // Tier list (M17, 2026-10-28): a tier chart, a letter square and a bar per row, shortening down;
    // drawn for RAVI, provisional until the next icon pass. The filled twin fills the three squares.
    // Trade board (plan 2 M2): two arrows passing each other, after Lucide's arrow-right-left on the app's
    // line; the filled twin gives the arrows solid heads. Provisional until the icon pass (plan 2 M8).
    board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M164.38,181.1a52,52,0,1,0-72.76,0,75.89,75.89,0,0,0-30,28.89,12,12,0,0,0,20.78,12,53,53,0,0,1,91.22,0,12,12,0,1,0,20.78-12A75.89,75.89,0,0,0,164.38,181.1ZM100,144a28,28,0,1,1,28,28A28,28,0,0,1,100,144Zm147.21,9.59a12,12,0,0,1-16.81-2.39c-8.33-11.09-19.85-19.59-29.33-21.64a12,12,0,0,1-1.82-22.91,20,20,0,1,0-24.78-28.3,12,12,0,1,1-21-11.6,44,44,0,1,1,73.28,48.35,92.18,92.18,0,0,1,22.85,21.69A12,12,0,0,1,247.21,153.59Zm-192.28-24c-9.48,2.05-21,10.55-29.33,21.65A12,12,0,0,1,6.41,136.79,92.37,92.37,0,0,1,29.26,115.1a44,44,0,1,1,73.28-48.35,12,12,0,1,1-21,11.6,20,20,0,1,0-24.78,28.3,12,12,0,0,1-1.82,22.91Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g><g class="icf"><path d="M64.12,147.8a4,4,0,0,1-4,4.2H16a8,8,0,0,1-7.8-6.17,8.35,8.35,0,0,1,1.62-6.93A67.79,67.79,0,0,1,37,117.51a40,40,0,1,1,66.46-35.8,3.94,3.94,0,0,1-2.27,4.18A64.08,64.08,0,0,0,64,144C64,145.28,64,146.54,64.12,147.8Zm182-8.91A67.76,67.76,0,0,0,219,117.51a40,40,0,1,0-66.46-35.8,3.94,3.94,0,0,0,2.27,4.18A64.08,64.08,0,0,1,192,144c0,1.28,0,2.54-.12,3.8a4,4,0,0,0,4,4.2H240a8,8,0,0,0,7.8-6.17A8.33,8.33,0,0,0,246.17,138.89Zm-89,43.18a48,48,0,1,0-58.37,0A72.13,72.13,0,0,0,65.07,212,8,8,0,0,0,72,224H184a8,8,0,0,0,6.93-12A72.15,72.15,0,0,0,157.19,182.07Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g><g class="icb"><path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g></svg>',
    // Offers (plan 2 M2): an inbox tray, after Lucide's inbox; the filled twin fills the tray around its slot
    offers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 12h-6l-2 3h-4l-2-3H2" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    tier: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M224,92H188V56a12,12,0,0,0-12-12H60V40a12,12,0,0,0-24,0V216a12,12,0,0,0,24,0v-4h84a12,12,0,0,0,12-12V164h68a12,12,0,0,0,12-12V104A12,12,0,0,0,224,92ZM164,68V92H60V68ZM132,188H60V164h72Zm80-48H60V116H212Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g><g class="icf"><path d="M232,112v32a8,8,0,0,1-8,8H56v16h88a8,8,0,0,1,8,8v24a8,8,0,0,1-8,8H56v8a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0v8H176a8,8,0,0,1,8,8V80a8,8,0,0,1-8,8H56v16H224A8,8,0,0,1,232,112Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g><g class="icb"><path d="M224,96H184V56a8,8,0,0,0-8-8H56V40a8,8,0,0,0-16,0V216a8,8,0,0,0,16,0v-8h88a8,8,0,0,0,8-8V160h72a8,8,0,0,0,8-8V104A8,8,0,0,0,224,96ZM168,64V96H56V64ZM136,192H56V160h80Zm80-48H56V112H216Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g></svg>',
    // New here (M15, 2026-10-27): Lucide's sprout (ISC), provisional until the next icon pass;
    // the filled twin fills both leaves.
    start: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/></g><g class="icf"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4z" fill="currentColor"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4z" fill="currentColor"/><path d="M16 9a4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M5 21h14"/></g></svg>',
    // Top cut (M15, 2026-10-27): Lucide's trophy (ISC), provisional until the next icon pass; the
    // filled twin fills the cup.
    cut: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/></g><g class="icf"><path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2"/><path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2"/><path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" fill="currentColor"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/></g></svg>',
    // All pages (M15, 2026-10-26): nine dots, the hub's eighth block; one drawing in every state,
    // round where the hub grid is square, so the two never read alike.
    allpages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M234.36,170A12,12,0,0,1,230,186.37l-96,56a12,12,0,0,1-12.1,0l-96-56a12,12,0,0,1,12.09-20.74l90,52.48L218,165.63A12,12,0,0,1,234.36,170ZM218,117.63,128,170.11,38.05,117.63A12,12,0,0,0,26,138.37l96,56a12,12,0,0,0,12.1,0l96-56A12,12,0,0,0,218,117.63ZM20,80a12,12,0,0,1,6-10.37l96-56a12.06,12.06,0,0,1,12.1,0l96,56a12,12,0,0,1,0,20.74l-96,56a12,12,0,0,1-12.1,0l-96-56A12,12,0,0,1,20,80Zm35.82,0L128,122.11,200.18,80,128,37.89Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g><g class="icf"><path d="M220,169.09l-92,53.65L36,169.09A8,8,0,0,0,28,182.91l96,56a8,8,0,0,0,8.06,0l96-56A8,8,0,1,0,220,169.09Z" transform="scale(.09375)" fill="currentColor" stroke="none"/><path d="M220,121.09l-92,53.65L36,121.09A8,8,0,0,0,28,134.91l96,56a8,8,0,0,0,8.06,0l96-56A8,8,0,1,0,220,121.09Z" transform="scale(.09375)" fill="currentColor" stroke="none"/><path d="M28,86.91l96,56a8,8,0,0,0,8.06,0l96-56a8,8,0,0,0,0-13.82l-96-56a8,8,0,0,0-8.06,0l-96,56a8,8,0,0,0,0,13.82Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g><g class="icb"><path d="M230.91,172A8,8,0,0,1,228,182.91l-96,56a8,8,0,0,1-8.06,0l-96-56A8,8,0,0,1,36,169.09l92,53.65,92-53.65A8,8,0,0,1,230.91,172ZM220,121.09l-92,53.65L36,121.09A8,8,0,0,0,28,134.91l96,56a8,8,0,0,0,8.06,0l96-56A8,8,0,1,0,220,121.09ZM24,80a8,8,0,0,1,4-6.91l96-56a8,8,0,0,1,8.06,0l96,56a8,8,0,0,1,0,13.82l-96,56a8,8,0,0,1-8.06,0l-96-56A8,8,0,0,1,24,80Zm23.88,0L128,126.74,208.12,80,128,33.26Z" transform="scale(.09375)" fill="currentColor" stroke="none"/></g></svg>',
    soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9h6L12 12z" fill="currentColor" stroke="none"/><path d="M7 21.5V18.6Q12 16.4 17 18.6V21.5z" fill="currentColor" stroke="none"/><path d="M5 22h14M5 2h14"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><mask id="@b" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><path d="M14.04 5.99a0.97 0.97 0 0 0 0 1.36l1.55 1.55a0.97 0.97 0 0 0 1.36 0l3.01 -3.01c0.31 -0.31 0.84 -0.21 0.95 0.21a5.81 5.81 0 0 1 -8 6.84l-7.67 7.67a0.97 0.97 0 0 1 -2.91 -2.91l7.67 -7.67a5.81 5.81 0 0 1 6.84 -8c0.42 0.12 0.52 0.64 0.21 0.95 z" fill="#000" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></mask><g mask="url(#@b)"><path d="M22.16 16.32A6.4 6.4 0 0 1 21.53 18.68Q17.48 17.57 18.58 21.62A6.4 6.4 0 0 1 16.23 22.25Q15.16 18.19 12.2 21.18A6.4 6.4 0 0 1 10.48 19.45Q13.46 16.5 9.4 15.43A6.4 6.4 0 0 1 10.03 13.08Q14.08 14.18 12.98 10.13A6.4 6.4 0 0 1 15.33 9.5Q16.4 13.56 19.36 10.58A6.4 6.4 0 0 1 21.08 12.3Q18.1 15.26 22.16 16.32 z"/><path d="M14.47 15.88a1.31 1.31 0 1 0 2.62 0a1.31 1.31 0 1 0 -2.62 0 z"/></g><path d="M14.04 5.99a0.97 0.97 0 0 0 0 1.36l1.55 1.55a0.97 0.97 0 0 0 1.36 0l3.01 -3.01c0.31 -0.31 0.84 -0.21 0.95 0.21a5.81 5.81 0 0 1 -8 6.84l-7.67 7.67a0.97 0.97 0 0 1 -2.91 -2.91l7.67 -7.67a5.81 5.81 0 0 1 6.84 -8c0.42 0.12 0.52 0.64 0.21 0.95 z"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M22.16 16.32A6.4 6.4 0 0 1 21.53 18.68Q17.48 17.57 18.58 21.62A6.4 6.4 0 0 1 16.23 22.25Q15.16 18.19 12.2 21.18A6.4 6.4 0 0 1 10.48 19.45Q13.46 16.5 9.4 15.43A6.4 6.4 0 0 1 10.03 13.08Q14.08 14.18 12.98 10.13A6.4 6.4 0 0 1 15.33 9.5Q16.4 13.56 19.36 10.58A6.4 6.4 0 0 1 21.08 12.3Q18.1 15.26 22.16 16.32 z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.47 15.88a1.31 1.31 0 1 0 2.62 0a1.31 1.31 0 1 0 -2.62 0 z" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.04 5.99a0.97 0.97 0 0 0 0 1.36l1.55 1.55a0.97 0.97 0 0 0 1.36 0l3.01 -3.01c0.31 -0.31 0.84 -0.21 0.95 0.21a5.81 5.81 0 0 1 -8 6.84l-7.67 7.67a0.97 0.97 0 0 1 -2.91 -2.91l7.67 -7.67a5.81 5.81 0 0 1 6.84 -8c0.42 0.12 0.52 0.64 0.21 0.95 z" fill="#000" stroke="#000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.04 5.99a0.97 0.97 0 0 0 0 1.36l1.55 1.55a0.97 0.97 0 0 0 1.36 0l3.01 -3.01c0.31 -0.31 0.84 -0.21 0.95 0.21a5.81 5.81 0 0 1 -8 6.84l-7.67 7.67a0.97 0.97 0 0 1 -2.91 -2.91l7.67 -7.67a5.81 5.81 0 0 1 6.84 -8c0.42 0.12 0.52 0.64 0.21 0.95 z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    // bar slots (RAVI_BAR below): gear is the bar's Settings slot; the strip's three are the counter's
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M21.23 10.21A9.4 9.4 0 0 1 21.23 13.79Q15.05 13.76 18.17 19.09A9.4 9.4 0 0 1 15.06 20.89Q12 15.52 8.94 20.89A9.4 9.4 0 0 1 5.83 19.09Q8.95 13.76 2.77 13.79A9.4 9.4 0 0 1 2.77 10.21Q8.95 10.24 5.83 4.91A9.4 9.4 0 0 1 8.94 3.11Q12 8.48 15.06 3.11A9.4 9.4 0 0 1 18.17 4.91Q15.05 10.24 21.23 10.21z"/><path d="M9.8 12a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0z"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M21.23 10.21A9.4 9.4 0 0 1 21.23 13.79Q15.05 13.76 18.17 19.09A9.4 9.4 0 0 1 15.06 20.89Q12 15.52 8.94 20.89A9.4 9.4 0 0 1 5.83 19.09Q8.95 13.76 2.77 13.79A9.4 9.4 0 0 1 2.77 10.21Q8.95 10.24 5.83 4.91A9.4 9.4 0 0 1 8.94 3.11Q12 8.48 15.06 3.11A9.4 9.4 0 0 1 18.17 4.91Q15.05 10.24 21.23 10.21z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.8 12a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0z" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M3.3 15.3C4.6 14 6 12.5 6 8a6 6 0 0 1 12 0c0 4.5 1.4 6 2.7 7.3A1 1 0 0 1 20 17H4a1 1 0 0 1-.7-1.7z"/><path d="M10.27 21a2 2 0 0 0 3.46 0"/></g><g class="icf"><path d="M3.3 15.3C4.6 14 6 12.5 6 8a6 6 0 0 1 12 0c0 4.5 1.4 6 2.7 7.3A1 1 0 0 1 20 17H4a1 1 0 0 1-.7-1.7z" fill="currentColor"/><path d="M10.27 21a2 2 0 0 0 3.46 0"/></g></svg>',
    saved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></g><g class="icf"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"/></g></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><mask id="@b" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff" stroke="none"/><path d="M21 3l-9 9" fill="#000" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></mask><g mask="url(#@b)"><path d="M11 6.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-6"/></g><path d="M15 3h6v6"/><path d="M21 3l-9 9"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M5 6.5H12V12H17.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2z" fill="#fff" stroke="none"/><path d="M11 6.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3l-9 9" fill="#000" stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 3h6v6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3l-9 9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    whatsnew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M5 8.5h3.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1 -1.5 1.5h-3.5a1.5 1.5 0 0 1 -1.5 -1.5v-4a1.5 1.5 0 0 1 1.5 -1.5z"/><path d="M10 8.5C13.5 8 16.5 6.5 18.5 4.5V19.5C16.5 17.5 13.5 16 10 15.5z"/><path d="M6 15.5l1 5h2.5v-5z"/><path d="M18.5 10a2 2 0 0 1 0 4"/><path d="M10 9.5v5"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M5 8.5h3.5a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1 -1.5 1.5h-3.5a1.5 1.5 0 0 1 -1.5 -1.5v-4a1.5 1.5 0 0 1 1.5 -1.5z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 8.5C13.5 8 16.5 6.5 18.5 4.5V19.5C16.5 17.5 13.5 16 10 15.5z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 15.5l1 5h2.5v-5z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 10a2 2 0 0 1 0 4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 9.5v5" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 18A8.49 8.49 0 1 0 6 6L3 9.6"/><path d="M3 4.6v5h5"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 3.5 3 8l4.5 4.5"/><path d="M3 8h12.5a5.5 5.5 0 0 1 0 11H8"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.6C10.2 5.2 7 4.5 3 4.9v13.2c4-.4 7.2.3 9 1.7 1.8-1.4 5-2.1 9-1.7V4.9c-4-.4-7.2.3-9 1.7z"/><path d="M12 6.6v13.2"/></svg>',
    // the Decks page's Edit slot (M11; working drawing, Lucide's pencil, ISC, until the icon round)
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M206.22-206.78h57.56l352.57-352.57-56.44-57-353.69 353.7v55.87Zm-52.44 106q-22.08 0-37.54-15.46t-15.46-37.54v-109.44q0-21.08 7.98-40.39 7.98-19.3 22.94-34.26l495.95-495.52q13.13-12.7 29.33-19.26 16.19-6.57 33.89-6.57 17.13 0 33.83 6.57 16.69 6.56 29.95 19.69l79.31 78.61q13.13 12.7 19.48 29.68 6.34 16.97 6.34 34.24 0 17.69-6.34 34.17-6.35 16.48-19.48 29.61L339-131.7q-14.96 14.96-34.26 22.94-19.3 7.98-40.39 7.98H153.78Zm593.78-589.65L691-747.56l56.56 57.13ZM587.91-587.91l-28-28.44 56.44 57-28.44-28.56Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g><g class="icf"><path d="M153.78-100.78q-22.08 0-37.54-15.46t-15.46-37.54v-109.44q0-21.08 7.98-40.39 7.98-19.3 22.94-34.26l495.95-495.52q13.13-12.7 29.33-19.26 16.19-6.57 33.89-6.57 17.13 0 33.83 6.57 16.69 6.56 29.95 19.69l79.31 78.61q13.13 12.7 19.48 29.68 6.34 16.97 6.34 34.24 0 17.69-6.34 34.17-6.35 16.48-19.48 29.61L339-131.7q-14.96 14.96-34.26 22.94-19.3 7.98-40.39 7.98H153.78ZM691.56-635l56-55.43L691-747.56l-56.57 56L691.56-635Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g><g class="icb"><path d="M200-200h57l391-391-57-57-391 391v57Zm-40 80q-17 0-28.5-11.5T120-160v-97q0-16 6-30.5t17-25.5l505-504q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L313-143q-11 11-25.5 17t-30.5 6h-97Zm600-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g></svg>',
    // the Collection page's Add cards slot: a card with a plus (M13 icon pass, 2026-10-26; Lucide's square-plus, ISC, card-shaped)
    // Add cards (plan 2 M8 round 3, Mako's pick A1 card-shaped): Material Symbols library_add (Apache-2.0) redrawn
    // on the app's line with Now's card proportions: a card with a plus over the edge of the one behind it
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M4 6v14a2 2 0 0 0 2 2h11"/><rect width="13.5" height="17" x="7.5" y="2" rx="2"/><path d="M11.25 10.5h6M14.25 7.5v6"/></g><g class="icf"><path d="M4 6v14a2 2 0 0 0 2 2h11"/><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><rect width="13.5" height="17" x="7.5" y="2" rx="2" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.25 10.5h6M14.25 7.5v6" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    // a menu head's explanation, opened in place (calendar Follow)
    // THE SORT ARROW (plan 2 M8, Mako 2026-11-05: an arrow and the sort's name, as Apple's Files and Mail
    // do): up for ascending (A to Z, low to high, oldest first), down for descending. RAVI_ARROW, Lucide (ISC) as
    // drawn. class srt: 16 in a sort chip, 18 in the chosen row of a Sort menu (app.css).
    sortup: '<svg class="srt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + window.RAVI_ARROW("up") + '"/></svg>',
    sortdn: '<svg class="srt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + window.RAVI_ARROW("dn") + '"/></svg>',
    // Info (plan 2 M8 round 5, Mako's pick I2): Phosphor info, bold (MIT); filled, the same bold i cut from a solid disc (Mako 2026-11-06:
    // Phosphor's own fill drew a thinner i); drawn 22.5 across, not 20.25, so the round icon reads as big as its square
    // neighbours on the bar (Mako 2026-11-06)
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path transform="matrix(.10417 0 0 .10417 -1.333 -1.333)" d="M108,84a16,16,0,1,1,16,16A16,16,0,0,1,108,84Zm128,44A108,108,0,1,1,128,20,108.12,108.12,0,0,1,236,128Zm-24,0a84,84,0,1,0-84,84A84.09,84.09,0,0,0,212,128Zm-72,36.68V132a20,20,0,0,0-20-20,12,12,0,0,0-4,23.32V168a20,20,0,0,0,20,20,12,12,0,0,0,4-23.32Z" fill="currentColor" stroke="none"/></g><g class="icf"><path transform="matrix(.10417 0 0 .10417 -1.333 -1.333)" d="M20,128a108,108,0,1,0,216,0a108,108,0,1,0,-216,0Z M108,84a16,16,0,1,1,16,16A16,16,0,0,1,108,84Z M140,164.68V132a20,20,0,0,0-20-20,12,12,0,0,0-4,23.32V168a20,20,0,0,0,20,20,12,12,0,0,0,4-23.32Z" fill="currentColor" stroke="none" fill-rule="evenodd"/></g></svg>',
  };
  return function(name){
    var s = SVG[name] || '';
    if (s.indexOf('"@') === -1) { return s; }
    n += 1;
    // "@" is the filled drawing's mask, "@b" an outline cut; each copy gets its own pair
    return s.replace(/id="@(b?)"/g, 'id="rvm' + n + '$1"').replace(/url\(#@(b?)\)/g, 'url(#rvm' + n + '$1)');
  };

})();
// ONE SORT, EVERY PAGE (plan 2 M8, Mako 2026-11-05). A sort is stored as its key, with "-" on the end
// when the player flipped it ("price-"). Each sort has a natural way (up or down); choosing it again in
// its menu flips it, unless it is fixed (My order; Public decks, which the server orders).
window.RAVI_SORT = {
  key: function(v){ return String(v || "").replace(/-$/, ""); },
  flip: function(v){ return /-$/.test(String(v || "")); },
  dir: function(v, natural){ return (natural === "up") !== /-$/.test(String(v || "")) ? "up" : "down"; },
  next: function(cur, k, fixed){ return !fixed && window.RAVI_SORT.key(cur) === k && !window.RAVI_SORT.flip(cur) ? k + "-" : k; },
  arrow: function(dir){ return window.RAVI_ICON(dir === "up" ? "sortup" : "sortdn"); },
  words: function(dir){ return dir === "up" ? "ascending" : "descending"; },
  // a cmp for the natural way, turned round when flipped
  cmp: function(v, f){ return window.RAVI_SORT.flip(v) ? function(a, b){ return -f(a, b); } : f; },
  // the chip's insides: the arrow (none for a sort with no way) and the name
  chip: function(name, dir){ return (dir ? window.RAVI_SORT.arrow(dir) : "") + '<span>' + name + '</span>'; },
  label: function(name, dir){ return "Sort: " + name + (dir ? ", " + window.RAVI_SORT.words(dir) : ""); },
  // a Sort menu row: the name; the chosen one shows its arrow where the check would be
  row: function(attrs, name, on, dir){ return '<button type="button" ' + attrs + ' aria-pressed="' + on + '"' + (on ? ' class="on"' : '') + (on && dir ? ' aria-label="' + name + ', ' + window.RAVI_SORT.words(dir) + '"' : '') + '>' + name + (on && dir ? window.RAVI_SORT.arrow(dir) : '') + '</button>'; }
};

// BACK TO TOP (plan 2 M8.5, Mako's notes of 2026-11-05): a web app gets no tap on the status bar, so a
// long card list gets a round Top button, 8 above the bar at its right end (app.css .totop), once it is
// scrolled two screens down; a tap scrolls back to the top. scroller: the element that scrolls (a card
// browser), or null for the page; on: optional, whether the list it serves is showing.
window.RAVI_TOTOP = function(scroller, on){
  var b = document.createElement("button");
  b.type = "button"; b.className = "totop frost"; b.setAttribute("aria-label", "Back to top"); b.setAttribute("aria-hidden", "true"); b.setAttribute("data-k", "do");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + window.RAVI_ARROW("up") + '"/></svg>';
  (scroller || document.body).appendChild(b);
  function y(){ return scroller ? scroller.scrollTop : (window.pageYOffset || document.documentElement.scrollTop || 0); }
  function update(){ var s = y() > window.innerHeight * 2 && (!on || on()); b.classList.toggle("show", s); b.setAttribute("aria-hidden", s ? "false" : "true"); }
  (scroller || window).addEventListener("scroll", update, { passive: true });
  // a view switch (a track, a tab) may leave the page far down: look again after any tap
  document.addEventListener("click", function(){ requestAnimationFrame(update); }, true);
  b.addEventListener("click", function(){
    var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    (scroller || window).scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  });
  return { update: update };
};

// The hub's page list. Add a line here to add a page to the hub.
// A line with an empty path is a dead placeholder. Replace one to add a page.
// icon is a getter so each use gets its own mask ids (see THE ICONS above).
window.RAVI_PAGES = [
  {id:"calendar", name:"Events", path:"calendar/", get icon(){ return window.RAVI_ICON("events"); }, rgb:"255,200,40"},
  {id:"counter", name:"Game", path:"counter/", get icon(){ return window.RAVI_ICON("game"); }, rgb:"200,35,70"},
  {id:"trade", name:"Trade", path:"trade/", get icon(){ return window.RAVI_ICON("trade"); }, rgb:"115,80,240"},
  {id:"board", name:"Trade board", path:"board/", get icon(){ return window.RAVI_ICON("board"); }, rgb:"255,150,40"}, // Tangerine (plan 2 M8, Mako's yes 2026-11-04; was Trade's violet)
  {id:"feedback", name:"Feedback", path:"feedback/", get icon(){ return window.RAVI_ICON("feedback"); }, rgb:"134,143,162", glass:true}, // Slate (plan 2 M8, Mako 2026-11-04: a dull colour; was Cobalt, too close to Trade)
  {id:"rules", name:"Rules", path:"rules/", get icon(){ return window.RAVI_ICON("rules"); }, rgb:"0,190,140", glass:true},
  {id:"decks", name:"Decks", path:"decks/", get icon(){ return window.RAVI_ICON("decks"); }, rgb:"80,230,170"},
  {id:"collection", name:"Collection", path:"collection/", get icon(){ return window.RAVI_ICON("collection"); }, rgb:"220,90,30"},
  {id:"start", name:"New here", path:"start/", get icon(){ return window.RAVI_ICON("start"); }, rgb:"30,205,230", glass:true}, // Sky, brightened (plan 2 M8: 70,185,235 sat on the players' blue)
  {id:"cut", name:"Top cut", path:"cut/", get icon(){ return window.RAVI_ICON("cut"); }, rgb:"170,210,60"},
  {id:"tier", name:"Tier list", path:"tier/", get icon(){ return window.RAVI_ICON("tier"); }, rgb:"215,90,230"},
  {id:"news", name:"News", path:"news/", get icon(){ return window.RAVI_ICON("whatsnew"); }, rgb:"170,140,255"}, // Lilac (plan 2 M8.7, as built, not chosen: the colour pass settles it); clear glass, its posts coloured by kind (as the calendar); the megaphone Rules' Latest wore
  {id:"settings", name:"Settings", path:"settings/", get icon(){ return window.RAVI_ICON("settings"); }, rgb:"205,220,240", glass:true}
];

// PAGE TO PAGE (plan 2 M8.7 motion block, Mako 2026-11-08: "Motion for switching between pages").
// The browser's own cross-document view transitions (app.css @view-transition; Safari 18.2+, no
// script library). This part only tells the next page where you came from, so its CSS can pick the
// motion: data-vt on <html> is "zoom" between pages when a tile or link was tapped (the page zooms out
// of it, as from the hub), "fwd" when nothing was (it grows from the middle), "back" on a return
// through history (it shrinks away), "open" from the hub (the page zooms out of the block you tapped:
// its centre's offset from the screen's rides along as --vt-dx/--vt-dy, its width over the screen's as
// --vt-s) and "close" back to the hub (the page zooms back into its block, if this launch opened it).
// Mako 2026-11-08 17:26 on the trial: page to page good; the hub's open "so choppy/quick that it
// doesn't really read"; wanted "a touch less 'snappy' and a touch more 'flowy'" without slowing
// pages down; no switches. So one version for everyone, moved by transform and opacity only (the
// phone's graphics chip), as iOS's zoom; app.css PAGE TO PAGE holds the timings.
// A tap on a same-site link writes {from, to, rect, at} to sessionStorage; leaving any other way
// (Back, a script) writes "from" when the page hides. The new page reads it in its head, before its
// first paint, and again on a return from the back-forward cache. Without support, nothing changes.
(function(){
  if (typeof document === "undefined") { return; }   // pages.js read outside a page (rb-tools' checks)
  var KEY = "ravi.vt.v1", BLK = "ravi.vt.blk.v1";
  var doc = document.documentElement;
  function idOf(u){
    var m;
    try { m = new URL(u, location.href).pathname.replace(/index\.html$/, "").match(/([^\/]+)\/$/); } catch (e) { return ""; }
    var pages = window.RAVI_PAGES, i, seg = m ? m[1] + "/" : "";
    for (i = 0; i < pages.length; i++) { if (pages[i].path === seg) { return pages[i].id; } }
    return "hub";
  }
  function read(k){ try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function write(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function arrive(){
    var me = idOf(location.href), m = read(KEY), dir = "", r = null, blk;
    doc.removeAttribute("data-vt");
    if (!m || !m.from || Date.now() - (m.at || 0) > 8000 || m.from === me) { return; }
    // a return through history (Back, a swipe) moves as back
    var act = window.navigation && window.navigation.activation, nt = "", hist = false;
    if (act && act.navigationType === "traverse") { hist = true; }
    else { try { nt = performance.getEntriesByType("navigation")[0].type; } catch (e) {} hist = nt === "back_forward"; }
    if (m.from === "hub" && !hist) {
      dir = "open"; r = m.rect;
      if (r) { blk = read(BLK) || {}; blk[me] = r; write(BLK, blk); }
    } else if (me === "hub") {
      dir = "close"; r = (read(BLK) || {})[m.from] || null;
      if (!r) { dir = "back"; }
    } else if (hist) {
      dir = "back";
    } else {
      // page to page (Mako 2026-11-08 18:44: the hub's zoom is "perfect", page to page should be
      // "a bit more akin to that"): out of what was tapped (a Go to tile, a link), else from the middle
      dir = m.rect ? "zoom" : "fwd"; r = m.rect;
    }
    if (dir === "open" && !r) { dir = "fwd"; }
    if (r) {
      doc.style.setProperty("--vt-dx", Math.round(r.l + r.w / 2 - innerWidth / 2) + "px");
      doc.style.setProperty("--vt-dy", Math.round(r.t + r.h / 2 - innerHeight / 2) + "px");
      doc.style.setProperty("--vt-s", Math.max(.2, Math.min(1, r.w / innerWidth)).toFixed(3));
    }
    doc.setAttribute("data-vt", dir);
  }
  arrive();
  addEventListener("pageshow", function(e){ if (e.persisted) { arrive(); } });
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("a[href]"), h, b, from;
    if (!a || a.target === "_blank" || e.defaultPrevented) { return; }
    h = a.getAttribute("href");
    try { if (new URL(h, location.href).origin !== location.origin) { return; } } catch (x) { return; }
    from = idOf(location.href);
    b = a.getBoundingClientRect();
    write(KEY, { from: from, to: idOf(a.href), at: Date.now(), rect: b.width && !a.closest(".bar") ? { t: b.top, l: b.left, w: b.width, h: b.height } : null });
  }, true);
  function leave(){
    var m = read(KEY), me = idOf(location.href);
    if (!m || m.from !== me || Date.now() - (m.at || 0) > 8000) { write(KEY, { from: me, at: Date.now() }); }
  }
  addEventListener("pageswap", leave);
  addEventListener("pagehide", leave);
})();

// LOADING BLOCKS (plan 2 M8.7 motion block, Mako 2026-11-08: "the 'blank' blocks that WILL make up
// the page be there as the page loads"; on the trial, 17:26: good, and it should 'know' what it is
// loading a touch more, e.g. News' grid or list: so each page builds its blocks from what this phone
// already holds, its view and its counts). RAVI_SKEL(parts) returns the page's shape in
// placeholder blocks, built from the Kit's surfaces (app.css LOADING BLOCKS), for a page to show
// while its data comes. Parts, top to bottom:
//   "plate:<field|track|pair>,..."  the sticky plate, one track-high block per entry (pair: two halves)
//   "big"   a large number          "head"  a section head          "lede:<n>[:mid]"  n lines of text (centred)
//   "card:<n>:<height>[:pic|deck]"  n glass cards; a square picture on the left (pic), or a card's (deck)
//   "ntiles:<n>"                    News' grid: n tiles two a row, a 16:9 picture over two lines
//   "block:<height>"                one glass block (a chart)      "track"  a full-width track
//   "sort"                          a lede with a glass pill at its right (a sort)
//   "rows:<n>"                      a group of n rows              "tiles:<n>"  n card pictures, three a row
// The blocks stay hidden for the first .15s, so a quick load never flashes them. Hidden from
// screen readers, which hear "Loading" once.
window.RAVI_SKEL = function(parts){
  var h = '<div class="skel" aria-hidden="true">', i, k, p, n, ln = '<i class="sk skl"></i><i class="sk skl skl2"></i>';
  for (i = 0; i < parts.length; i++) {
    p = parts[i].split(":"); n = Math.max(1, +p[1] || 1);
    if (p[0] === "plate") {
      h += '<div class="skplate">';
      (p[1] || "field").split(",").forEach(function(x){ h += x === "pair" ? '<span class="skpair"><i class="sk skp"></i><i class="sk skp"></i></span>' : '<i class="sk skp' + (x === "track" ? ' skt' : '') + '"></i>'; });
      h += '</div>';
    } else if (p[0] === "big") { h += '<i class="sk skbig"></i>';
    } else if (p[0] === "head") { h += '<i class="sk skhead"></i>';
    } else if (p[0] === "lede") { for (k = 0; k < n; k++) { h += '<i class="sk skl skled' + (k === n - 1 ? ' skl2' : '') + (p[2] === "mid" ? ' skmid' : '') + '"></i>'; }
    } else if (p[0] === "card") {
      for (k = 0; k < n; k++) { h += '<span class="skc" style="height:' + (+p[2] || 72) + 'px">' + (p[3] === "pic" ? '<i class="sk skpic"></i>' : p[3] === "deck" ? '<i class="sk skpic skdeck"></i>' : '') + '<span class="sklines">' + ln + '</span></span>'; }
    } else if (p[0] === "ntiles") {
      h += '<span class="skgrid">'; for (k = 0; k < n; k++) { h += '<span class="sktl"><i class="sk sk169"></i>' + ln + '</span>'; } h += '</span>';
    } else if (p[0] === "block") { h += '<span class="skc" style="height:' + (+p[1] || 160) + 'px"></span>';
    } else if (p[0] === "track") { h += '<i class="sk skp skt skw"></i>';
    } else if (p[0] === "sort") { h += '<span class="sksort"><i class="sk skl"></i><i class="sk skpill"></i></span>';
    } else if (p[0] === "rows") {
      h += '<span class="skrows">'; for (k = 0; k < n; k++) { h += '<span class="skrow"><i class="sk skl"></i></span>'; } h += '</span>';
    } else if (p[0] === "tiles") {
      h += '<span class="sktiles">'; for (k = 0; k < n; k++) { h += '<i class="sk sktile"></i>'; } h += '</span>';
    }
  }
  return h + '</div><span class="sr">Loading</span>';
};

// THE HUB PICKS (M15, Mako 2026-10-26). The hub holds eight blocks, so its icon stays true: seven
// are the viewer's picks, set in App settings, and the eighth is always All pages, a tray with
// every page. The picks live on this phone (vir.hub.blocks.v1, a list of page ids). No key: the
// default seven. A saved value is rebuilt from checked fields on every read (M14's rule): only
// ids of pages with a path count, once each, the first seven; anything that is not a list falls
// back to the default. RAVI_HUB_PICKS() returns the ids in page order, whatever order was saved.
// THE PLAYER COLOURS (plan 2 M8 block 2): your colour on your Profile, the counter's swatches, a
// player's card on the Trade board. Eight from the palette that read as text on the ground (contrast
// 6 or more); blue and pink first, the counter's defaults. Keys match the server's COLOURS.
window.RAVI_PLAYER_COLOURS = [
  {k:"blue", name:"Blue", rgb:"93,165,238", hex:"#5DA5EE"},
  {k:"pink", name:"Pink", rgb:"238,95,156", hex:"#EE5F9C"},
  {k:"gold", name:"Gold", rgb:"255,200,40", hex:"#FFC828"},
  {k:"tangerine", name:"Tangerine", rgb:"255,150,40", hex:"#FF9628"},
  {k:"lime", name:"Lime", rgb:"170,210,60", hex:"#AAD23C"},
  {k:"mint", name:"Mint", rgb:"80,230,170", hex:"#50E6AA"},
  {k:"orchid", name:"Orchid", rgb:"215,90,230", hex:"#D75AE6"},
  {k:"white", name:"White", rgb:"240,240,245", hex:"#F0F0F5"}
];
// one colour by its key (null when it is not one); RAVI_MY_COLOUR(): your own, from your account
window.RAVI_COLOUR = function(k){
  var l = window.RAVI_PLAYER_COLOURS;
  for (var i = 0; i < l.length; i++) { if (l[i].k === k) { return l[i]; } }
  return null;
};
window.RAVI_MY_COLOUR = function(){
  try { var a = window.RAVI_ACCT && window.RAVI_ACCT.view(); return a ? window.RAVI_COLOUR(a.col) : null; } catch (e) { return null; }
};
// THE TWO SIDES of a trade or a game (plan 2 M8): yours is your colour (blue with none); theirs is
// pink, or blue when yours is pink. Each is a player colour entry.
window.RAVI_SIDES = function(){
  var l = window.RAVI_PLAYER_COLOURS, mine = window.RAVI_MY_COLOUR() || l[0];
  return { yours: mine, theirs: mine.k === "pink" ? l[0] : l[1] };
};
// paints the sides on a page that shows them (Trade, the Trade board's offers): --yc and --tc, each
// colour's hex, and --ycr and --tcr, its rgb, on the root; again whenever your account changes
window.RAVI_SIDES_PAINT = function(){
  function go(){
    var s = window.RAVI_SIDES(), st = document.documentElement.style;
    st.setProperty("--yc", s.yours.hex); st.setProperty("--tc", s.theirs.hex);
    st.setProperty("--ycr", s.yours.rgb); st.setProperty("--tcr", s.theirs.rgb);
  }
  go();
  if (window.RAVI_ACCT && window.RAVI_ACCT.onChange) { window.RAVI_ACCT.onChange(go); }
};
window.RAVI_HUB_KEY = "vir.hub.blocks.v1";
window.RAVI_HUB_MAX = 7;
// New here took App settings' default place (2026-10-27): a newcomer sees it first; App settings
// stays in All pages and can be picked back.
window.RAVI_HUB_DEFAULT = ["calendar", "counter", "trade", "rules", "decks", "collection", "start"];
window.RAVI_HUB_PICKS = function(){
  var pages = window.RAVI_PAGES || [], raw = null, list, want = {}, out = [], i;
  try { raw = localStorage.getItem(window.RAVI_HUB_KEY); } catch (e) {}
  if (raw !== null) { try { list = JSON.parse(raw); } catch (e) { list = null; } }
  if (!Array.isArray(list)) { list = window.RAVI_HUB_DEFAULT; }
  // in the saved order (App settings' Hub layout, plan 2 M6, Mako 2026-11-03): pages that still
  // exist, each once, up to the hub's seven
  for (i = 0; i < pages.length; i++) { if (pages[i].path) { want[pages[i].id] = true; } }
  for (i = 0; i < list.length && out.length < window.RAVI_HUB_MAX; i++) {
    if (typeof list[i] === "string" && want[list[i]] && out.indexOf(list[i]) < 0) { out.push(list[i]); }
  }
  return out;
};
// Saves a list of ids (the hub's order), or clears the key with null.
window.RAVI_HUB_SAVE = function(ids){
  try {
    if (ids === null) { localStorage.removeItem(window.RAVI_HUB_KEY); }
    else { localStorage.setItem(window.RAVI_HUB_KEY, JSON.stringify(ids)); }
  } catch (e) {}
};

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
// App settings is never a Go to tile, except in the hub's All pages tray, which lists every
// page (withSettings true; M15).
window.RAVI_GOTO = function(container, hereId, rel, withHub, withSettings){
  if (!container) { return; }
  var HUB_ICON = window.RAVI_ICON("hub");
  var pages = window.RAVI_PAGES || [];
  // plan 2 M8 (Mako's yes 2026-11-04, note 6 of 2026-11-02): each tile's icon wears its page colour,
  // lifted .30 toward white so it reads on the sunken track; the words and the chosen tile stay as
  // they were, and the icon's shape still names the page
  function lift(rgb){
    var c = String(rgb).split(","), o = [];
    for (var t = 0; t < 3; t++) { o.push(Math.round(+c[t] + (255 - +c[t]) * .30)); }
    return "rgb(" + o.join(",") + ")";
  }
  // A page whose bar already carries Hub leaves it out of Go to; only the
  // counter, whose strip has no Hub slot, passes withHub.
  var h = withHub ? '<a class="gt' + (hereId === "hub" ? " on" : "") + '" href="' + rel + '?hub">' + HUB_ICON + '<span>Hub</span></a>' : '';
  for (var i = 0; i < pages.length; i++) {
    var p = pages[i];
    if (!p.path || (p.id === "settings" && !withSettings)) { continue; }
    if (p.id === hereId) {
      h += '<button type="button" class="gt on" id="pnhere" data-close>' + p.icon + '<span>' + p.name + '</span></button>';
    } else {
      h += '<a class="gt" href="' + rel + p.path + '" style="--gi:' + lift(p.rgb) + '">' + p.icon + '<span>' + p.name + '</span></a>';
    }
  }
  container.innerHTML = h;
  container.setAttribute("data-k", "pick");
};

// THE SUPPORT PLATE (M15, Mako 2026-10-27): who builds RAVI and a tip link, the same on App
// settings and Feedback. Mako's words, lightly tidied; his picture (img/mako.webp, cropped to him
// alone). The tip goes to his own Ko-fi, outside the app (Riot's policies: a link to a tip page
// is fine). A page holds <section class="sup glass" id="support"></section> and calls
// RAVI_SUPPORT(el, rel), rel "../" from a page folder.
window.RAVI_SUPPORT_URL = "https://ko-fi.com/makosravi";
window.RAVI_SUPPORT = function(el, rel){
  if (!el) { return; }
  // folded by default (Mako 2026-11-03): one row, Mako's picture and the name, that opens in place
  el.innerHTML = '<button type="button" class="suphd" id="suphd" aria-expanded="false" aria-controls="supbody" data-k="open">' +
    '<img src="' + rel + 'img/mako.webp" alt="" width="56" height="56"><span class="supwho"><b>Support RAVI</b><small>Mako builds it on Vancouver Island</small></span>' +
    '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15"/></svg></button>' +
    '<div class="supbody" id="supbody" hidden>' +
    '<p class="suptx">Hello, Mako here! I play Riftbound on Vancouver Island, and I build RAVI in my spare time so the local scene has one place for events, decks, trades and more.</p>' +
    '<p class="suptx">RAVI is free, and always will be for the Island. If it helps you, a tip keeps it going. Always appreciated, never expected!</p>' +
    '<a class="pact btn glass" href="' + window.RAVI_SUPPORT_URL + '" target="_blank" rel="noopener" data-k="do">Leave a tip on Ko-fi<svg class="extl" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 6.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-6M15 3h6v6M21 3l-9 9"/></svg></a></div>';
  var hd = el.querySelector(".suphd"), body = el.querySelector(".supbody");
  hd.addEventListener("click", function(){
    var open = hd.getAttribute("aria-expanded") !== "true";
    hd.setAttribute("aria-expanded", open ? "true" : "false");
    body.hidden = !open;
    body.classList.remove("reveal");
    if (open) { void body.offsetWidth; body.classList.add("reveal"); }
  });
};

// DATES AND TIMES, written one way on every page (M9.6 consistency sweep, 2026-10-16):
// RAVI_DATE("2026-09-16") is "Sep 16, 2026"; RAVI_DATE(x, true) is the short "Sep 16".
// RAVI_WHEN(ms) is "Oct 15, 8:01 PM", with the year after the day when it is not this year.
// Island time and US-style AM/PM whatever the phone's language, so no page reads "p.m.".
// A "YYYY-MM-DD" string is split, never run through Date, so no time zone can shift its day.
(function(){
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var TZ = "America/Vancouver";
  function parts(ms){
    var o = {};
    new Intl.DateTimeFormat("en-US", { timeZone:TZ, year:"numeric", month:"numeric", day:"numeric",
      hour:"numeric", minute:"2-digit", hour12:true }).formatToParts(new Date(ms)).forEach(function(p){ o[p.type] = p.value; });
    return { y:+o.year, m:+o.month, d:+o.day, h:o.hour, mi:o.minute, ap:String(o.dayPeriod || "").toUpperCase() };
  }
  function ymd(x){
    var s = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof x === "string" ? x : "");
    if (s) { return { y:+s[1], m:+s[2], d:+s[3] }; }
    var ms = x instanceof Date ? x.getTime() : (typeof x === "number" ? x : NaN);
    return isFinite(ms) ? parts(ms) : {};
  }
  window.RAVI_DATE = function(x, short){
    var p = ymd(x);
    if (!p.m) { return ""; }
    return MON[p.m - 1] + " " + p.d + (short ? "" : ", " + p.y);
  };
  window.RAVI_WHEN = function(x){
    var ms = x instanceof Date ? x.getTime() : +x;
    if (!isFinite(ms)) { return ""; }
    var p = parts(ms), now = parts(Date.now());
    return MON[p.m - 1] + " " + p.d + (p.y !== now.y ? ", " + p.y : "") + ", " + window.RAVI_TIME(p.h + ":" + p.mi + " " + p.ap);
  };
  // DATES AND PRICES (App settings, Display; plan 2 M6, Mako's yes 2026-11-03), on this phone:
  //   vir.clock.v1 "24" writes every time 24-hour ("19:05"); none, 12-hour ("7:05 PM")
  //   vir.week.v1  "mon" starts the calendar's weeks on Monday; none, Sunday
  //   prices: the currency Trade, Decks, Collection and the Trade board already share, CAD or USD
  //     (vir.trade.v1's cur, with Collection's own copy in vir.coll.set.v1); none, CAD
  function got(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  window.RAVI_CLOCK24 = function(){ return got("vir.clock.v1") === "24"; };
  // a clock time as text ("7:05 PM", "12:00 AM") in this phone's clock; anything else as it was
  window.RAVI_TIME = function(t){
    var m = /^\s*(\d{1,2}):(\d{2})\s*([AaPp])\.?\s*[Mm]\.?\s*$/.exec(String(t == null ? "" : t));
    if (!m || !window.RAVI_CLOCK24()) { return t == null ? "" : String(t); }
    var h = +m[1] % 12 + (/[Pp]/.test(m[3]) ? 12 : 0);
    return (h < 10 ? "0" : "") + h + ":" + m[2];
  };
  window.RAVI_WEEK = function(){ return got("vir.week.v1") === "mon" ? 1 : 0; };
  window.RAVI_CUR = function(){ try { var t = JSON.parse(got("vir.trade.v1") || "null"); if (t && (t.cur === "USD" || t.cur === "CAD")) { return t.cur; } } catch (e) {} return "CAD"; };
  window.RAVI_SETCUR = function(c){
    if (c !== "USD" && c !== "CAD") { return; }
    [["vir.trade.v1", true], ["vir.coll.set.v1", false]].forEach(function(k){
      var o = null;
      try { o = JSON.parse(got(k[0]) || "null"); } catch (e) { o = null; }
      if (!o || typeof o !== "object" || Array.isArray(o)) { if (!k[1]) { return; } o = {}; }
      o.cur = c;
      try { localStorage.setItem(k[0], JSON.stringify(o)); } catch (e) {}
    });
  };
  // THE PRICE SOURCE LINE (M13 sweep, Mako 2026-10-25): one wording on every page that shows prices
  // (Trade, Decks, Collection), built from data/prices.json. Returns HTML; the benchmark sentence is
  // each page's own paragraph.
  window.RAVI_STAMP = function(D){
    if (!D || !D.generated_at) { return ""; }
    function e(v){ return String(v).replace(/[&<>"]/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]; }); }
    var gen = new Date(D.generated_at), age = (Date.now() - gen.getTime()) / 3600000;
    var s = "Prices are TCGplayer market price via tcgcsv.com, updated <b>" + e(window.RAVI_DATE(gen, true)) + "</b>";
    s += (age > 48) ? ". These may be out of date." : ".";
    if (D.fx && D.fx.rate) { s += " 1 USD = <b>" + e(String(D.fx.rate)) + "</b> CAD, Bank of Canada, " + e(window.RAVI_DATE(D.fx.date) || D.fx.date || "") + "."; }
    if (D.totals) { s += " " + D.totals.priced + " products priced across " + D.totals.sets + " sets."; }
    return s;
  };
})();

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

// MENUS OPEN FROM WHAT YOU TAPPED (plan 2 M8.7 motion block; NEXT -- menus that open from their
// control, Mako 2026-10-30; built 2026-11-08 18:44 on his word "feel free to handle the menu changes in
// that pass"). The account menu's grow-and-shrink (account.js), for every menu: a menu that opens from
// nothing within half a second of a tap on a control outside it grows out of that control (from .2,
// its corner nearest the control first) in .34s on the settle curve, and shrinks back into it in .2s
// when it closes to nothing. A deeper menu (it slides in from a side), a switch from one menu to
// another, a menu a page opens by itself, and the account menus keep their own motion. Transform and
// opacity only; reduced motion turns it off. Each page's own open and close code is untouched: this
// watches the menus' class.
(function(){
  if (typeof document === "undefined" || !window.Element || !Element.prototype.animate) { return; }
  var last = null, ORIG = typeof WeakMap === "function" ? new WeakMap() : null;
  document.addEventListener("click", function(e){
    var c = e.target && e.target.closest ? e.target.closest("button, a, [role=button], [data-act]") : null;
    last = c && !c.closest(".panel") ? { el: c, at: Date.now() } : null;
  }, true);
  function still(){ return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function other(p){ var a = document.querySelectorAll(".panel.show"), i; for (i = 0; i < a.length; i++) { if (a[i] !== p) { return true; } } return false; }
  function side(p){ return /(^| )(fromr|froml|tol|tor)( |$)/.test(p.className); }
  function play(p, open){
    var o = ORIG && ORIG.get(p);
    if (!o) { return; }
    p.style.transformOrigin = o;
    p.style.transition = "none";
    var a = p.animate(open ? [{ transform: "scale(.2)", opacity: 0 }, { transform: "none", opacity: 1 }]
                          : [{ transform: "none", opacity: 1 }, { transform: "scale(.2)", opacity: 0 }],
      open ? { duration: 340, easing: "cubic-bezier(.05,.7,.1,1)" } : { duration: 200, easing: "cubic-bezier(.3,0,.8,.15)" });
    var done = function(){ p.style.transition = ""; p.style.transformOrigin = ""; };
    a.onfinish = done; a.oncancel = done;
  }
  var mo = new MutationObserver(function(list){
    list.forEach(function(m){
      var p = m.target, was = /(^| )show( |$)/.test(m.oldValue || ""), is = p.classList.contains("show");
      if (was === is || p.classList.contains("acct") || still()) { return; }
      if (is) {
        if (ORIG) { ORIG.delete(p); }
        if (!last || Date.now() - last.at > 500 || !document.contains(last.el) || side(p) || other(p) || !ORIG) { return; }
        var r = last.el.getBoundingClientRect();   // the menu's resting box: a fixed menu's offsets, untouched by its motion
        if (!r.width) { return; }
        ORIG.set(p, Math.round(r.left + r.width / 2 - p.offsetLeft) + "px " + Math.round(r.top + r.height / 2 - p.offsetTop) + "px");
        play(p, true);
      } else if (!other(p) && !side(p)) {
        play(p, false);
      }
    });
  });
  function boot(){
    var a = document.querySelectorAll(".panel"), i;
    for (i = 0; i < a.length; i++) { mo.observe(a[i], { attributes: true, attributeFilter: ["class"], attributeOldValue: true }); }
    var w = window.RAVI_WATCH;   // menus added later (RAVI_WATCH) join too
    if (w && !w.__grow) {
      window.RAVI_WATCH = function(list){ for (var k = 0; k < list.length; k++) { mo.observe(list[k], { attributes: true, attributeFilter: ["class"], attributeOldValue: true }); } return w(list); };
      window.RAVI_WATCH.__grow = true;
    }
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", function(){ setTimeout(boot, 0); }); } else { setTimeout(boot, 0); }
})();

// MENU STATE. Two things every page's menus share, kept here so a page only needs markup.
// (1) A bar slot with data-fills="<menu id>" is on (its icon filled) while that menu, or a
//     deeper menu opened from it, is showing. It goes off when every menu is closed.
// (2) A menu's fixed header and footer carry .edge while its scrolling body runs underneath
//     them; app.css fades the body out softly toward that edge.
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
    function watch(p){
      mo.observe(p, { attributes: true, attributeFilter: ["class"] });
      var b = p.querySelector(".pbody");
      if (!b) { return; }
      var later = function(){ window.requestAnimationFrame(function(){ edges(p); }); };
      b.addEventListener("scroll", function(){ edges(p); }, { passive: true });
      b.addEventListener("transitionend", later);
      new MutationObserver(later).observe(b, { subtree: true, childList: true, attributes: true });
    }
    for (i = 0; i < panels.length; i++) { watch(panels[i]); }
    // A menu added after the page has loaded (the account menus, account.js)
    // joins in here: its body edges, and the control that opens it.
    window.RAVI_WATCH = function(list){
      for (var k = 0; k < list.length; k++) { watch(list[k]); }
      slots = document.querySelectorAll("[data-fills]");
      sync();
    };
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
  // a ?visit= test link (live.js) opens this tab as the browser version, so
  // the Game page and Top cut can be reached from it too
  if (/[?&]visit=/.test(location.search)) { try { sessionStorage.setItem("ravi.web.v1", "1"); } catch (e) {} return; }
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
  var TOP = '<div class="gwtop"><h1 class="gwname"><span class="rb"><span class="rbg"></span><svg class="rbs" viewBox="0 0 5828.4 2351.8" aria-hidden="true" focusable="false"><defs><linearGradient id="rbr72" gradientUnits="userSpaceOnUse" x1="1091.6" y1="-646.8" x2="4736.9" y2="2998.5"><stop offset="0" stop-color="#5DA5EE"/><stop offset=".5" stop-color="#5DA5EE" stop-opacity=".35"/><stop offset=".5" stop-color="#EE5F9C" stop-opacity=".35"/><stop offset="1" stop-color="#EE5F9C"/></linearGradient></defs><path class="rbt" d="M274 1175.9A923.4 923.4 0 0 1 1197.4 252.5H4631.1A923.4 923.4 0 0 1 5554.5 1175.9" fill="none" stroke="url(#rbr72)" stroke-width="81.7" pathLength="1" stroke-dasharray="1 1"/><path class="rbb" d="M274 1175.9A923.4 923.4 0 0 0 1197.4 2099.3H4631.1A923.4 923.4 0 0 0 5554.5 1175.9" fill="none" stroke="url(#rbr72)" stroke-width="81.7" pathLength="1" stroke-dasharray="1 1"/><g class="rbl" transform="translate(1064.7 602.3) scale(.8)"><path class="c1" transform="translate(0 0)" d="M420 287V861H707Q766 861 818 838Q870 816 909 777Q948 738 970 686Q993 633 993 574Q993 515 970 462Q948 410 909 371Q870 332 818 310Q766 287 707 287ZM420 1434H133V0H707Q786 0 859 20Q932 41 996 78Q1059 116 1112 168Q1164 221 1202 285Q1239 349 1260 422Q1280 495 1280 574Q1280 648 1262 718Q1243 788 1208 851Q1174 914 1124 967Q1074 1020 1012 1059L1171 1434H866L741 1145L420 1147Z"/><path class="c1" transform="translate(1376 0)" d="M977 861V574Q977 515 954 462Q932 410 893 371Q854 332 802 310Q749 287 690 287Q631 287 578 310Q526 332 487 371Q448 410 426 462Q403 515 403 574V861ZM1264 1434H977V1147H403V1434H117V574Q117 455 162 350Q207 246 284 168Q362 90 466 45Q571 0 690 0Q809 0 914 45Q1018 90 1096 168Q1174 246 1219 350Q1264 455 1264 574Z"/><path class="c2" transform="translate(2796.9 0)" d="M1229 0 758 1434H471L2 0H328L614 957L901 0Z"/><path class="c2" transform="translate(4070.9 0)" d="M420 1434H133V0H420Z"/></g></svg></span><span class="sr">RAVI</span></h1>' +
    '<p class="gwline">The all-in-one Riftbound app.</p></div>';
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

// A PICK-ONE TRACK SLIDES (STYLE.md, Motion; motion sweep, 2026-10-16). When a tap moves the
// choice in a .seg, the chosen fill slides from the old option to the new one in .26s, as
// iPhone's own segmented control does, instead of fading. The page's own handler changes the
// choice as before; this only watches. Before the page handles the tap (capture), it notes the
// chosen option's box, fill and every option's text colour; on the next frame, before it is
// drawn, it lays a fill (.sgth, app.css) over the old box, clears the new option's own fill,
// slides the fill to the new box and hands it back. Taps that do not move the choice (an armed
// 'Sure?', the same option) and renders change nothing here. Skips .multi, .swatch and the
// wrapping .lgpchips, a track the page rebuilt with a different count, and reduced motion.
(function(){
  if (!window.matchMedia || !document.addEventListener || !Element.prototype.animate) { return; }
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)");
  var EASE = "cubic-bezier(.22,.72,.2,1)", MS = 260;
  function picks(seg){ return Array.prototype.filter.call(seg.children, function(b){ return b.tagName === "BUTTON"; }); }
  function chosen(bs){
    for (var i = 0; i < bs.length; i++) { if (bs[i].classList.contains("on") || bs[i].getAttribute("aria-pressed") === "true") { return i; } }
    return -1;
  }
  function box(b){ return { left: b.offsetLeft + "px", top: b.offsetTop + "px", width: b.offsetWidth + "px", height: b.offsetHeight + "px" }; }
  document.addEventListener("click", function(e){
    if (RM.matches) { return; }
    var b = e.target.closest ? e.target.closest(".seg > button") : null, seg = b ? b.parentNode : null;
    if (!seg || seg.matches(".multi, .swatch, .lgpchips") || !seg.offsetWidth) { return; }
    var bs = picks(seg), from = chosen(bs);
    if (from < 0 || bs[from] === b) { return; }
    // the track is the box every option is measured in (offsets, so a pressed option's scale
    // does not count), so it is positioned from here until the last slide on it ends. A second
    // tap while one slides must not clear it under the new fill (M13, Mako 2026-10-25: two quick
    // taps on Collection's range sent the fill to the top of the screen): the track counts its
    // slides and keeps what it was before the first
    if (!seg.__rvSlides) { seg.__rvStat = getComputedStyle(seg).position === "static"; }
    var stat = seg.__rvStat;
    if (stat) { seg.style.position = "relative"; }
    var cs = getComputedStyle(bs[from]);
    var was = { at: box(bs[from]), bg: cs.backgroundColor, r: cs.borderRadius, n: bs.length,
      col: bs.map(function(x){ return getComputedStyle(x).color; }) };
    seg.__rvSlides = (seg.__rvSlides || 0) + 1;
    requestAnimationFrame(function(){ if (!slide(seg, from, was)) { ended(seg); } });
  }, true);
  // the last slide on a track to end hands the track and its options back
  function ended(seg){
    seg.__rvSlides = Math.max((seg.__rvSlides || 1) - 1, 0);
    if (seg.__rvSlides) { return; }
    picks(seg).forEach(function(x){ x.style.position = ""; x.style.zIndex = ""; });
    if (seg.__rvStat) { seg.style.position = ""; }
  }
  function slide(seg, from, was){
    if (!seg.isConnected) { return false; }
    var bs = picks(seg), to = chosen(bs);
    if (to < 0 || to === from || bs.length !== was.n) { return false; }
    var A = bs[from], B = bs[to];
    A.style.transition = "none"; B.style.transition = "none";
    var bc = getComputedStyle(B), fill = bc.backgroundColor, rad = bc.borderRadius;
    bs.forEach(function(x){ x.style.position = "relative"; x.style.zIndex = "1"; });
    var g = document.createElement("i");
    g.className = "sgth"; g.setAttribute("aria-hidden", "true");
    seg.insertBefore(g, seg.firstChild);
    var end = box(B), k0 = was.at, k1 = end;
    k0.backgroundColor = was.bg; k0.borderRadius = was.r;
    k1.backgroundColor = fill; k1.borderRadius = rad;
    B.style.backgroundColor = "transparent";
    var an = g.animate([k0, k1], { duration: MS, easing: EASE, fill: "forwards" });
    A.animate([{ color: was.col[from] }, { color: getComputedStyle(A).color }], { duration: MS, easing: EASE });
    B.animate([{ color: was.col[to] }, { color: bc.color }], { duration: MS, easing: EASE });
    var over = false;
    function done(){
      if (over) { return; }
      over = true;
      B.style.backgroundColor = "";
      void B.offsetWidth;
      if (g.parentNode) { g.parentNode.removeChild(g); }
      ended(seg);
      requestAnimationFrame(function(){ A.style.transition = ""; B.style.transition = ""; });
    }
    an.onfinish = done; an.oncancel = done;
    return true;
  }
})();

// NO PAGE ZOOM (Mako 2026-11-02: 'the rest of the app should also not accidentally zoom in and
// out ... possibly throughout the entire app'). The installed app never pinch-zooms its pages, as
// no native app does; iPhone's own Zoom (Settings, Accessibility) still works everywhere. iOS
// ignores user-scalable=no, so its pinch gesture events are cancelled everywhere (pointer events,
// which the Picture placer reads, still arrive), and a two-finger touchmove is cancelled unless it
// starts inside [data-pinch], the one place a pinch means something. Double-tap is held off by each
// page's own touchend guard (ARCH -- the double-tap zoom guard).
(function(){
  if (typeof document === "undefined") { return; }
  function hold(e){ e.preventDefault(); }
  document.addEventListener("gesturestart", hold, { passive: false });
  document.addEventListener("gesturechange", hold, { passive: false });
  document.addEventListener("touchmove", function(e){
    if (e.touches && e.touches.length > 1 && !(e.target && e.target.closest && e.target.closest("[data-pinch]"))) { e.preventDefault(); }
  }, { passive: false });
})();

// BACK (plan 2 M8.7 A1; Mako's yes 2026-11-08 to the sweep's finding): a page reached by a link
// inside another page (an event's Top cut, a Tier list list opening in Decks, New here's rows, the
// Trade board's Open Collection) shows a round Back in the wordmark row's top left, level with your
// picture; it returns where you were (history, so the scroll comes back too). A page reached from
// the bar, Go to or the hub shows none, as iOS: a screen you were sent to has Back, a tab never.
// RAVI_BACK_MARK(url) marks a move made from script (the Trade board's Price this trade).
(function(){
  var KEY = "ravi.back.v1";
  function path(u){ try { return new URL(u, location.href).pathname.replace(/index\.html$/, ""); } catch (e) { return ""; } }
  function ours(u){ try { var x = new URL(u, location.href); return x.origin === location.origin && x.pathname !== location.pathname; } catch (e) { return false; } }
  window.RAVI_BACK_MARK = function(u){ try { sessionStorage.setItem(KEY, JSON.stringify({ to: path(u) })); } catch (e) {} };
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target === "_blank" || !ours(a.href)) return;
    if (a.closest(".bar, .goto, .panel.tray, #grid, .hubname")) { try { sessionStorage.removeItem(KEY); } catch (er) {} return; }
    window.RAVI_BACK_MARK(a.href);
  }, true);
  function boot(){
    var row = document.querySelector(".wmrow"), m = null;
    if (!row) return;
    try { m = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}
    if (!m || m.to !== path(location.href) || history.length < 2) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "circ btn glass rvback"; b.setAttribute("aria-label", "Back"); b.setAttribute("data-k", "do");
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18"/></svg>';
    b.addEventListener("click", function(){ try { sessionStorage.removeItem(KEY); } catch (e) {} history.back(); });
    row.appendChild(b);
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", boot); } else { boot(); }
})();
