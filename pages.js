// THE ICONS. One drawing per name: 24 grid, 2-unit round lines, one corner size. Signed off
// 2026-10-07 (M5); the icon pass (2026-10-15/16) redrew Game (block pommels), Trade (handshake),
// Feedback (dots), Rules (a scroll), App settings (two gears), the bar's gear, Out, Latest (a
// megaphone; its key is still whatsnew), Reset, Undo and Info. Shapes adapted from Phosphor (MIT),
// Remix Icon (Apache-2.0), Material Symbols (Apache-2.0) and Lucide (ISC); Trade is Material's
// handshake as drawn (weight 600 = the 2-unit line; its .icb copy, weight 400, is the hub's).
// Every page icon and every bar icon lives here (RAVI_BAR draws the bars from it). Most carry an
// outline (.ico) and a filled (.icf) drawing (the hub grid, Soon, Reset and the strip's Undo and
// Log are one drawing in every state); app.css shows the filled one while the slot is on.
// Outline lines set no width of their own, so the hub's thinner line reaches them all. A filled
// drawing's gaps are cut by a mask ("@"), an outline overlap by a second one ("@b"); mask ids
// must be unique on a page, so RAVI_ICON numbers each copy it hands out.
window.RAVI_ICON = (function(){
  var n = 0;
  var SVG = {
    hub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.45" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="1.85" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="3.05" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="2.45" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="9.55" y="8.95" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="16.65" y="10.15" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="6.00" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/><rect x="13.10" y="17.25" width="4.9" height="4.9" rx="1.4" fill="currentColor" stroke="none"/></svg>',
    events: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><g><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4M3 10h18"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><g fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/></g><path d="M8 2v4M16 2v4" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="0" y="9" width="24" height="2" fill="#000" stroke="none"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M18.95 18.95h1.5v1.5h-1.5z"/><path d="M3.55 18.95h1.5v1.5h-1.5z"/><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="M13 19l6-6"/><path d="M5 14l4 4"/><path d="M16 16l2.95 2.95"/><path d="M7 17 5.05 18.95"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M14.5 17.5 3 6V3h3l11.5 11.5z" fill="#fff" stroke="none"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5z" fill="#fff" stroke="none"/><path d="M18.95 18.95h1.5v1.5h-1.5z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.55 18.95h1.5v1.5h-1.5z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 17.5 3 6V3h3l11.5 11.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 19l6-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14l4 4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16l2.95 2.95" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 17 5.05 18.95" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    trade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M474.06-140q4.81 0 11.31-2.22 6.5-2.21 11.06-6.78l334.74-335.74q14.11-14.14 21.75-32.77 7.65-18.63 7.65-38.89 0-19.87-7.65-39.33-7.64-19.46-21.75-34.1L667-794q-13.56-13-31.43-19.5-17.86-6.5-35.82-6.5-17.89 0-35.15 6.22-17.25 6.21-29.69 18.08l-14.04 14.61 77.61 78.05q14.69 16.26 26.11 37.3Q636-644.7 636-619.27q0 42.49-33.5 75.44-33.51 32.96-76.69 32.96-28.2 0-46.96-8.63t-35.02-24.89l-71.87-71.87-170.83 170.83q-5 4.55-7 10.19t-2 11.81q0 13 8.36 21.21 8.36 8.22 21.17 8.22 5.91 0 11.63-3 5.73-3 9.84-7l111.19-111.14q9.16-9.21 21.16-9.21t21 9.29q9 9.28 9 21.06 0 11.79-9 20.65l-110.3 110.29q-5.05 5.06-7.05 11.45-2 6.38-2 12.18 0 12.22 8.44 20.83Q294-310 306-310q6 0 11.85-2.54 5.86-2.53 10.46-6.57l109.84-110.47q9.2-9.2 21.2-8.92 12 .28 21 8.72 9 9 9 21t-9 21L369.5-277.48q-3.5 4.05-6.28 10.55-2.79 6.5-2.79 12.5 0 12 9 21t21 9q6 0 11.2-2.29 5.2-2.28 9.8-6.71l111.35-111.92q8.86-9 20.93-8.71 12.07.28 21.07 8.71 9 9.57 9 21.35 0 11.79-9 20.65L453.43-192q-4.43 5-6.71 11.39-2.29 6.38-2.29 11.18 0 14.22 8 21.83 8 7.6 21.63 7.6Zm.37 73q-35.82 0-64.37-24.78-28.54-24.78-35.8-62.48-32.87-5.57-56.15-29.13-23.28-23.57-28.85-55.87-31.74-6.13-54.52-29.35-22.78-23.22-28.91-54.52-37.57-7.26-62.42-35.38-24.85-28.13-24.85-65.95 0-19.24 7.54-38.46 7.53-19.23 21.86-33.99l168.43-168.44Q339.43-688 372.15-688t55.94 22.65L490.43-603q8 8 17.69 12.78 9.69 4.79 19.45 4.79 12.51 0 23.69-11.38 11.17-11.37 11.17-24.15 0-5.91-4.06-13.97-4.07-8.07-11.54-16.09L402.7-795.17q-12.4-12.4-30.83-18.61-18.44-6.22-37.5-6.22-19.69 0-36.62 6.22-16.92 6.21-28.69 18.51L122.61-649.91q-17.18 17.74-21.11 43.69-3.93 25.96 5.93 49.13 3.31 13.83-3.67 26.46t-21.09 17.06q-14.11 4.44-27.52-3.39-13.41-7.82-17.56-22.22-14.46-43.3-6.89-86.1 7.56-42.81 40.87-76.22l144.78-145.24q23.13-23.13 55.15-34.2Q303.52-892 335.35-892q33.53 0 64.2 11.06 30.67 11.07 53.54 33.07l14.61 14.04 14.04-14.04q22.56-21.43 54.44-32.78Q568.05-892 600.61-892q32.39 0 63.56 11.91 31.18 11.92 54.31 35.05l167.13 166.56q23.71 23.48 35.55 56.39Q933-589.17 933-556.4q0 32.78-12.7 65.83-12.69 33.05-36.39 57.31L547.48-97.39q-14.7 14.69-33.46 22.54T474.43-67ZM362.17-636.17Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g><g class="icf"><path d="M479.48-96.82q-17 0-29.57-12.29-12.56-12.28-12.56-29.28 0-9.26 3.56-17.89 3.57-8.63 10.7-16.33l169.35-168.78q4.43-4.43 4.43-9.93t-4.43-10.5q-5-4.44-10.5-5-5.5-.57-10.5 4.43L430.61-193.04q-7.13 7.13-15.55 10.13-8.41 3-18.1 3-16.44 0-28.5-11.78-12.07-11.79-12.07-28.79 0-11.13 3-19.04 3-7.91 10.26-14.61l168.22-168.78q5-4.44 5-10.22t-5-10.78q-4.44-4.44-10.22-4.44t-10.78 4.44L351.48-278.96q-6.57 6.57-15.26 10.13-8.7 3.57-19.39 3.57-16 0-28.29-12.28-12.28-12.29-12.28-28.85 0-9.7 3.57-17.83 3.56-8.13 10.13-15.26l166.52-167.08q5-4.44 5-9.94 0-5.5-4.72-10.22-4.72-4.71-10.5-4.71T435.48-527L269.96-360.48q-6.13 6.7-14.55 9.7-8.41 3-19.54 3-17 0-29.07-11.57-12.06-11.56-12.06-28 0-9.69 4.13-18.95 4.13-9.27 11.26-16.4l187.61-188.17q13.65-13.65 32.78-12.02 19.13 1.63 33.91 15.85l74.79 75.34q14.39 14.4 29.3 23.03t38.44 8.63q35.95 0 59.08-22.2 23.13-22.2 23.13-59.46 0-19.08-7.48-33.43-7.47-14.35-22.73-29.61l-113.31-113.3q-17.95-17.96-19.67-42.9-1.72-24.93 16.8-40.76 12.7-9.43 26.26-13.93 13.57-4.5 28.7-4.5 25.26 0 50.46 11.85 25.19 11.84 45.32 31.98l157.7 158.12q21.39 21.96 32.43 48.48 11.05 26.53 11.05 60.61 0 28.48-11.83 54.35t-31.65 46.26L513.7-110.52q-8.57 8.56-16.55 11.13-7.98 2.57-17.67 2.57ZM113.52-453.3q-25.82-20-39.3-47.98-13.48-27.98-13.48-58.81 0-27.69 10.63-53.45Q82-639.31 103.7-661L258-816.3q18.13-17.57 40.61-27.98 22.48-10.42 47.74-10.42 27.26 0 52.74 9.85 25.47 9.85 44.74 28.55l193.13 192.56q9.26 9.26 15.45 19.52 6.2 10.26 6.2 22.52 0 21.83-15.2 37.03-15.19 15.19-37.02 15.19-13.26 0-24.8-6.69-11.55-6.7-21.24-16.96l-76.05-76.04q-23.21-23.22-55.84-23.22-32.64 0-55.85 23.22L196.13-452.7q-16.26 16.26-39.8 15.11-23.55-1.15-42.81-15.71Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g><g class="icb"><path d="M475-140q5 0 11.5-2.5T497-149l337-338q13-13 19.5-29.5T860-550q0-17-6.5-34T834-614L654-794q-13-13-30-19.5t-34-6.5q-17 0-33.5 6.5T527-794l-18 18 81 82q13 14 23 32.5t10 40.5q0 38-29.5 67T526-525q-25 0-41.5-7.5T454-554l-73-73-181 181q-5 5-7 10.5t-2 11.5q0 13 8.5 21.5T221-394q6 0 11.5-3t9.5-7l117-117q9-9 21-9t21 9q9 9 9 21t-9 21L285-363q-5 5-7 11t-2 12q0 12 9 21t21 9q6 0 11.5-2.5t9.5-6.5l117-117q9-9 21-9t21 9q9 9 9 21t-9 21L370-278q-4 4-6.5 10.5T361-255q0 12 9 21t21 9q6 0 11-2t10-7l117-117q9-9 21-9t21 9q9 9 9 21t-9 21L454-192q-5 5-7 11t-2 11q0 14 8 22t22 8Zm0 60q-33 0-59-24.5T385-165q-34-5-57-28t-28-57q-34-5-56.5-28.5T216-335q-37-5-61-30t-24-60q0-17 6.5-34t19.5-30l182-182q17-17 42-17t42 17l68 68q8 8 17.5 12.5T527-586q13 0 24.5-11.5T563-622q0-6-3.5-13.5T548-651L405-794q-13-13-30-19.5t-34-6.5q-17 0-33.5 6.5T278-794L126-642q-20 20-24.5 48.5T108-539q5 11 0 22.5T92-500q-11 5-23 0t-17-16q-17-45-10-89.5T84-685l151-151q22-22 50-32.5t57-10.5q29 0 56.5 10.5T448-836l18 18 18-18q22-22 50-32.5t57-10.5q29 0 56.5 10.5T697-836l179 179q22 22 33 50t11 57q0 29-11 56.5T876-444L539-107q-13 13-29.5 20T475-80Zm-97-546Z" transform="matrix(.025 0 0 .025 0 24)" fill="currentColor" stroke="none"/></g></svg>',
    feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.5L7.5 21V17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 10h.01M12 10h.01M16 10h.01" style="stroke-width:calc(var(--sw,2)*1.3)"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.5L7.5 21V17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10h.01M12 10h.01M16 10h.01" fill="none" stroke="#000" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    rules: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/><path d="M15 7h-5M15 10h-5M13 13h-3"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M6 3h11a2 2 0 0 1 2 2v12h-8a1 1 0 0 0-1 1v1a2 2 0 0 1-4 0z" fill="#fff" stroke="none"/><path d="M19 17V5a2 2 0 0 0-2-2H4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h-5M15 10h-5M13 13h-3" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
    decks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><rect x="8" y="6" width="12" height="16" rx="2"/><path d="M5 18V4a2 2 0 0 1 2-2h9"/><path d="M14 10.5l2.5 3.5-2.5 3.5-2.5-3.5z"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><rect x="8" y="6" width="12" height="16" rx="2" fill="#fff" stroke="#fff" stroke-width="2"/><path d="M5 18V4a2 2 0 0 1 2-2h9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 10.5l2.5 3.5-2.5 3.5-2.5-3.5z" fill="#000" stroke="#000" stroke-width="1" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>',
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
    // a menu head's explanation, opened in place (calendar Follow)
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ico"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0z"/><path d="M12 11v5.5"/><path d="M12 7.6h.01" style="stroke-width:calc(var(--sw,2)*1.4)"/></g><g class="icf"><mask id="@" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#000" stroke="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11v5.5" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7.6h.01" fill="none" stroke="#000" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></mask><rect width="24" height="24" fill="currentColor" stroke="none" mask="url(#@)"/></g></svg>'
  };
  return function(name){
    var s = SVG[name] || '';
    if (s.indexOf('"@') === -1) { return s; }
    n += 1;
    // "@" is the filled drawing's mask, "@b" an outline cut; each copy gets its own pair
    return s.replace(/id="@(b?)"/g, 'id="rvm' + n + '$1"').replace(/url\(#@(b?)\)/g, 'url(#rvm' + n + '$1)');
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
  {id:"decks", name:"Decks", path:"decks/", get icon(){ return window.RAVI_ICON("decks"); }, rgb:"80,230,170"},
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
    return MON[p.m - 1] + " " + p.d + (p.y !== now.y ? ", " + p.y : "") + ", " + p.h + ":" + p.mi + " " + p.ap;
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
    // does not count), so it is positioned from here until the slide ends
    var stat = getComputedStyle(seg).position === "static";
    if (stat) { seg.style.position = "relative"; }
    var cs = getComputedStyle(bs[from]);
    var was = { at: box(bs[from]), bg: cs.backgroundColor, r: cs.borderRadius, n: bs.length, stat: stat,
      col: bs.map(function(x){ return getComputedStyle(x).color; }) };
    requestAnimationFrame(function(){ if (!slide(seg, from, was) && stat) { seg.style.position = ""; } });
  }, true);
  function slide(seg, from, was){
    if (!seg.isConnected) { return false; }
    var bs = picks(seg), to = chosen(bs);
    if (to < 0 || to === from || bs.length !== was.n) { return false; }
    var A = bs[from], B = bs[to];
    A.style.transition = "none"; B.style.transition = "none";
    var bc = getComputedStyle(B), fill = bc.backgroundColor, rad = bc.borderRadius;
    var stat = was.stat;
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
      bs.forEach(function(x){ x.style.position = ""; x.style.zIndex = ""; });
      if (stat) { seg.style.position = ""; }
      requestAnimationFrame(function(){ A.style.transition = ""; B.style.transition = ""; });
    }
    an.onfinish = done; an.oncancel = done;
    return true;
  }
})();
