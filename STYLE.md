# RAVI - the design rulebook

The one place the app's design rules live. One rule per line, each with its value. Every value, class and size below comes from app.css, pages.js or a page's own file.

MARKS: [D] drawn-test.js checks it. [A] audit.js checks it. [C] a check could catch it and none does yet (section 11). [T] a named test in rb-tools covers it. No mark: judged by eye on the phone.

## 0. How to use this file

- Read sections 1 to 5 before building anything. Section 6 is the order to build a new page in.
- FIRM means breaking it would look wrong or break the app. Section 1 is all firm. Anything marked firm elsewhere is firm.
- Everything else is a default: follow it unless the page truly needs otherwise, and say so in one line in the commit.
- Pages place Kit parts (section 5); they never reshape them. Layout around a part is the page's own.
- A page may add a part of its own, built from Kit tokens (section 2) and surfaces (section 3). List it in section 5 in the same commit.

## 1. Firm rules

- Colour never carries meaning alone. Shape or words carry it too. (Mako is colourblind.)
- Dim means disabled: opacity .4, pointer-events none, and it holds its place. Never hide a control that moves its neighbours. [A]
- Price direction is an arrow, never a colour. Up and down look the same apart from the arrow.
- Store neutrality: no store's numbers, defaults or tilt anywhere in the UI.
- Target: current iOS Safari, run as an installed app. Existing fallbacks stay. color-mix() and :has() are allowed in new work.
- A browser tab shows only the install screen (section 5), on every page. Nothing else changes for it.
- Frosted surfaces declare a solid fallback inside @supports (backdrop-filter): blur on, the same colour at about .94 alpha off.
- Text inputs are a real 16px. No scale or zoom tricks to make them look smaller.
- 12px is the type floor. An element that needs smaller is redesigned, not shrunk.
- A new hue anywhere needs Mako's yes.
- Never pin the body with position:fixed to lock the page. Use html.lock.

## 2. Tokens (app.css :root; a page reads these and never types the value)

Colour
- --ground #08090A: page ground
- --bone #EDEAE3: main text, chosen fill
- --ink #121316: text on a bone or colour fill
- --muted #A4A7AD: secondary text
- --faint #4A4E55: out-of-range text, dim marks
- --track #2A2D32: unchosen dots and tracks
- --hi #34383E: a pressed row in a sunken surface
- --p1 #5DA5EE: player 1 and Yours (blue)
- --p2 #EE5F9C: player 2 and Theirs (pink)
- --p1t, --p2t rgba(93,165,238,.14) and rgba(238,95,156,.14): side stain
- --p1r, --p2r the same two at .50: side pressed or armed
- --over #E5484D: round timer past zero
Glass and frost
- --glass rgba(255,255,255,.045): glass body
- --glass-press rgba(255,255,255,.14): glass pressed
- --glass-base inset 0 -10px 18px -14px rgba(255,255,255,.14): glow inside the base
- --rim-light: 1px rim, white .45 at the top, .10 at 30%, 0 at 55%, .10 at the base
- --frost rgba(36,37,38,.22), --frost-solid rgba(36,37,38,.94), --frost-rim rgba(255,255,255,.10)
- --on rgba(255,255,255,.14): the bar's you-are-here pill
- --recess rgba(0,0,0,.35): sunken surfaces
- --scrim rgba(0,0,0,.35): menu scrim
Type
- --disp "Poppins", system-ui, -apple-system, sans-serif
- --text "Nunito", system-ui, -apple-system, sans-serif
Sizes
- --barH 56
- --sz-row 44: menu rows, fields, full-width actions
- --sz-track 40: a sunken track, search and name fields
- --sz-sm 36: round buttons and compact pills
- --sz-seg 34: a segment inside a track, swatches
- --sz-score 48, --sz-score-min 38, --sz-seam 50: counter only
- --r-cut 6, --gap-cut 3: the cut track
Other
- --ease cubic-bezier(.22,.72,.2,1)
- --top-clear safe-area top inset + 28: nothing sharp and unfrosted sits above it [C]
- No control height is a bare number; each reads a named size above. A page may add a token only in its own :root and only for its own part (counter: --over-deep, --mo-rise, --mo-travel, --mo-pulse, --mo-ease; trade: --yc, --tc). [A]

## 3. Surfaces and kinds

Surfaces
- Glass (.glass): means press. Body --glass, a 1px rim lit at the top fading down the sides, --glass-base inside. No full outline on any button. Used for buttons, cards, event cards, the page head. [D]
- Glass pressed: --glass-press.
- Sunken (--recess): means choose or type. Tracks (.seg, .goto), groups (.pick), fields (.nf, .sf). Chosen option: bone fill, ink text. A track whose options own a colour (trade .sides) fills the chosen one in that colour, with ink text.
- Chosen picture or colour: a bone ring, inset 0 0 0 2px bone then 2px ground (.seg.swatch).
- Frost (.frost): chrome that blurs what passes behind it. Fallback --frost-solid; with blur, --frost, blur 20 saturate 160% on the bar and strip, blur 24 saturate 160% on menus, 1px rim --frost-rim.
- Plate frost: the calendar's month card (.card) and the trade control plate (.plate) are page-local sticky surfaces: fallback rgba(10,11,13,.94); with blur rgba(10,11,13,.5), blur 18 saturate 180%; shadow --glass-base then 0 8px 24px rgba(0,0,0,.45); corner 24.
- Bone: chosen in a track. A bone check on the right means chosen in a list.
- A fill means selected, never important.
- A glass surface is never its own scroller. A still glass wrapper holds a plain scrolling child.
- Crop with overflow, never clip-path, on anything holding a frosted surface. No drop shadow inside a crop.
Lists
- One thing is a pill: a button, a field, a track. A list of rows is one group: rows flat inside, no gap, a hairline rgba(255,255,255,.08) between rows inset 16 from the left. [A]
- A group you press in is glass (.doors). A group you choose in is sunken (.pick); its chosen row wears an 18px bone check, 16 from the right.
- A pick-many list shows the same check on every row that is on (calendar .tyrow with .box).
- An on/off setting is a check row in a sunken group (.pick), never a switch.
Kinds (firm: every tappable carries data-k on itself or its nearest container) [A]
- do: acts once. Glass, or a side pill (.sidebtn) when it acts for one player. Arm-then-confirm is a do.
- deeper: a row that opens the next menu. Carries the right chevron (.cvr); nothing else may.
- pick: a choice that stays, in a sunken track (.seg) or group (.pick). Go to is a pick.
- type: a text field in a sunken shape.
- open: opens in place. Carries aria-expanded and a .chev that points at what a tap will do.
- slot: an icon slot on the bar or the counter's strip, nowhere else.
- play: the counter's field. grid: the calendar's day cells. view: the counter's full-card viewer. Nowhere else.
- Text you only read carries no data-k and is not tappable.
- Every control that opens a menu carries data-fills="<menu id>" and fills (shows its .icf drawing) while that menu or a deeper one is open. [T]
- Pressed: a glass or sunken-group row takes the shade only; a free-standing button also scales to .96 (button:active). A large tappable surface (hub block, event card head) scales to .97 with brightness 1.2.

## 4. Type, sizes, corners, spacing, colour

Type
- Two faces. Poppins (--disp) for display and every tappable label. Nunito (--text) for text and data.
- Poppins ships 600, 700, 800 only. Any other Poppins weight is synthesised and wrong. [C]
- Five rungs: 12, 13, 15, 17, 20. Whole pixels only. [C]
- Page title and menu title 20, Poppins 700 (.ttl). Section head 17, Poppins 700 (.shead h2). Sentence case.
- Buttons and tappable labels: Poppins 600. Body: Nunito 400 at 15, line-height 1.4. Passive metadata: 12, muted.
- The grey value in a row: Nunito 600, 12, muted (small in .door and .pick).
- Numerals: Poppins 800 for scores and money (counter, trade). Calendar day numbers (.cell .d): Poppins 15 at 600, 700 when selected.
- Tabular figures on body, inherited by every number.
- Type follows height: a 44px control carries 15; a 34, 36 or 38px control carries 13. Text inputs, play and grid are exempt. [D]
- Named exemptions, nothing else: 16 text inputs; 16 counter score words at .06em; the counter numerals (column formula in .num, 40 on the slim banner); 26 trade ring amount; the wordmark, 22 at the page top (.wm) and 34 on the hub (.hubname); 40 on the install screen (.gwname). Go to tile labels are 12 with letter-spacing -.08em.
Sizes
- Control heights come from section 2. Measure the surface the eye sees, not the control inside it. [A]
- Size-exempt pictures carry a size-exempt comment on the line: trade card art, the counter's rune.
- Calendar day cells: circles, width min(46px, 100%) of the column.
- Icon sizes: bar 24, Go to tile 22, install step 24, round button 18, hub block 52 (stroke 1.5), pact 17, chevron 16.
Corners
- A shape whose corners differ uses real values (a pill end is half its height), never 999px: the browser shrinks every corner together and flattens the small ones. A plain pill with four equal round corners may use 999px. [D]
- Cut track (.seg.multi, counter score buttons): round outer ends of half the height, 6 inner corners (--r-cut), 3 gaps (--gap-cut). [D]
- Surface corners: 24 for menus, the Go to track and the two sticky surfaces; 22 (half a row) for every group and card (.pick, .doors, .pghead, .ev, saved-trade cards, feedback form); 20 for tiles (.gt Go to tiles, .blk hub blocks); a tray is 30 (24 plus its 6 padding).
- Pictures and inner joins may use smaller page-local corners: trade .lnh 14 and .rcpimgs img 12, counter .lgptile 10 and .lgppic 8, the calendar .hl and .hr join 5, the install step icon .gwstep img 6. A new surface uses one of the three.
Spacing
- 6 within a group, 14 between groups (.row margin-bottom 14, .lb label 6 above its control).
- A menu or section title sits 10 above what it heads (.phead and .shead margin-bottom 10).
- Inside a track: 2 between options, 3 padding (.seg), 4 padding (.goto). Inside a group: no gap, no padding; row content 16 in from each side.
- Menu padding 16; tray padding 6; event card padding 12 14.
- Controls side by side share top and bottom within 0.5px. [A]
- Nothing overflows sideways. [D]
- A one-line row clips its text with an ellipsis; it never wraps.
Colour
- Players: Yours/P1 blue --p1, Theirs/P2 pink --p2. The counter's six swatches are the player's choice for one match; the first two are the defaults.
- The only alarm colour is --over (the counter's --over-deep #8C1F19 is its pressed shade). The calendar's amber #FFC24D on low spots is a caution, always with words.
- Event types: each has a mark shape, a hue and its name in words on every card. Order everywhere: Open Play, Learn-to-Play, Nexus Nights, Summoner Skirmish, Other.
  - Open Play 180,90,255, circle (s-circle)
  - Learn-to-Play 40,220,130, ring (s-ring)
  - Nexus Nights 63,169,245, triangle (s-tri)
  - Summoner Skirmish 255,176,32, diamond (s-diamond)
  - Other 90,96,106, pentagon (s-penta). The filter row reads Other events; a card reads Event.
- Marks are one drawn set on a 12 grid with round joins, in a fixed square: 12 in a row (.mk), 10 on a card (.ev .l1 .mk), 9 on the month grid (.dots .mk).
- Event card body: glass with rgba(type rgb, .25); Nexus .26, Skirmish .24 (--ga).
- A page colour (hub block, event type) is given as an rgb triple; tints are computed in script (hub icon and name: toward white by .62; calendar lit: .40).

## 5. The Kit (shared parts)

Rule for every entry: a page may not set height, min-height, padding, border-radius or width on .door, .pact, .seg, .nf, .sf, .goto, .rec, .btn or .circ. [A]

Page-local classes named in this file (not in app.css; each lives in the page file shown, and is not a Kit part):
- index.html (hub): .blk .bi .bn .hubfoot .low
- calendar/index.html: .cell .dots .ev .evact .evhead .filtered .hemi .hl .hr .l1 .lab .mk .mrow .spots .stick .tyrow
- counter/index.html: .lgppic .lgptile .num .pass .rail .res .spot .tmv .win
- trade/index.html: .ln .lnh .rcpimgs .res .sidep .stp .tail .toast .ud .vd
- feedback/index.html: .fbn .fcard .ship
- settings/index.html: .sts .starm

Page shell (feedback/index.html, settings/index.html)
- Head: charset, viewport (width=device-width, initial-scale=1, viewport-fit=cover), theme-color #08090A, apple-mobile-web-app-capable yes, status-bar-style black-translucent, apple-mobile-web-app-title RAVI, manifest ../manifest.webmanifest, apple-touch-icon ../icons/apple-touch-icon.png, title "<Page> - RAVI", then fonts.css, app.css, pages.js, the page's own style block (in that order).
- Page style block starts: html{background:var(--ground)}, a{color:inherit;text-decoration:none}, body{-webkit-font-smoothing:antialiased;touch-action:manipulation}.
- Wordmark row (.wmrow, .wm, .logo1, .logo2): chrome, one thin row, scrolls away. Padding safe-area top + 30 / 18 / 16 / 18. Wordmark 22, Poppins 800, RA --p1, VI --p2. Plain RAVI everywhere else.
    <div class="wmrow"><h1 class="wm"><span class="logo1">RA</span><span class="logo2">VI</span></h1></div>
- Main wrapper (page-local id, e.g. #fb): max-width 480, margin 0 auto, padding 0 12px calc(max(4px,calc(env(safe-area-inset-bottom,0px) - 12px)) + var(--barH) + 40px). The calendar's wrapper is .body (calendar/index.html) and the trade page's is #trd with .tail (trade/index.html), with the same idea; scrollbar-gutter stable and body min-height 100vh come from app.css.
- Footer (.foot): 30 above, a dim hairline inset 24 from both ends, paragraphs 12 muted, links bone.
    <footer class="foot"><p>...</p><p>Built and maintained by <a href="https://beifonghithouse.com">Beifong's Hit-House</a>, Victoria BC.</p></footer>

Page head, section head, glass card (feedback/index.html)
- .pghead.glass: a text page's title and one line, in a glass plate. Corner 22, padding 14 16 15, h2 20 (.ttl), p 13 muted. Use once, first in the main wrapper.
    <header class="pghead glass"><h2 class="ttl">Feedback</h2><p>One line.</p></header>
- .shead: title left at 17, optional .sp and .cnt (12 muted) right. min-height 32, margin-bottom 10.
    <div class="shead"><h2>Recently shipped</h2></div>
- Glass card: any section with .glass and a page-local class that sets only margin and corner 22 (feedback .fcard, settings .sts). A group inside it is the Kit's own.

Choose lists (settings/index.html, calendar/index.html)
- .pick: sunken group; rows are button or a, 44 high, Poppins 600 15, padding 0 16. Add .on for a chosen row (bone check). A row may hold small (grey value) or .sp.
    <div class="pick" id="opento" data-k="pick"><button type="button" class="on">Hub</button><button type="button">Events</button></div>
- Pick-many: rows carry aria-pressed; each row holds its own check (calendar .tyrow, .box, .lab, .n are page-local).
- .rec: a record row (saved trade, past match, event row, store row). The one row allowed past one line: min-height 44, 7 above and below. In a .pick it is button.rec; in .doors it is .door.rec.

Press lists (trade/index.html)
- .doors: glass group (corner 22, rows flat). .door: 44 high, Poppins 600 15, .t clipped, .sp, small grey value, .cvr right chevron (16, muted).
    <div class="doors" data-k="deeper"><button type="button" class="door"><span class="t">All saved trades</span><span class="sp"></span><small>12</small><svg class="cvr" ...></svg></button></div>
- .door.act: the same row for a plain action, data-k="do", no .cvr. In a stack of rows an action is this.
- .pact.btn.glass: a centred full-width action (44 high, Poppins 600 15). Stands alone or sits in a menu foot. Never in a stack of rows.
    <button type="button" class="pact btn glass" data-k="do">Clear both sides</button>

Tracks and fields (app.css; calendar and trade menus)
- .seg: sunken pill track, padding 3, gap 2; options are buttons 34 high, Poppins 600 13; chosen is aria-pressed="true" (or .on) in bone.
    <div class="seg" role="group" aria-label="Area" data-k="pick"><button type="button" aria-pressed="true">A</button><button type="button" aria-pressed="false">B</button></div>
- .seg.multi: each option is its own on/off (aria-pressed). Cut track: gap --gap-cut, inner corners --r-cut, outer ends half of --sz-seg.
- .seg.swatch: each option is the colour, set inline as --sw; chosen wears the double ring.
- .nf and .sf: sunken field, 40 high (.tall: 44), padding 0 6 0 16, input a real 16px Nunito, optional icon 18 muted, optional .fbtn at the right end (13, Poppins 600; .armed shades it --hi). .nf is the canonical class; .sf is its alias for search.
    <div class="sf"><svg ...></svg><input type="search" placeholder="Search" data-k="type"></div>

Buttons (calendar/index.html, app.css)
- .btn.glass: round glass pill, shade --glass-press on press. .circ: 36 round, icon 18. Use .circ.btn.glass for round icon buttons (close X, back, gear, chevron toggle).
    <button type="button" class="circ btn glass" aria-label="Close" data-k="do"><svg ...></svg></button>
- .hemi (calendar-local, with .hl and .hr): two halves of one pill, 36 square each, outer curve half of 36, 5 at the join, 4 overlap. Copy from calendar/index.html if a page needs a pair.

The bar (every page except the hub)
- .bar.frost: fixed pill, 56 high, 12 from the sides, max-width 456, bottom max(4px, safe-area bottom minus 12px), padding 5, four columns, gap 4, z-index 20. Round slots (.tab), 24 icon.
- Four slots, always in this order: Hub, Go to, the page's one action, Settings. Slots never move between pages; an unused slot is dimmed in place (disabled).
- Slot 1 is a link: a href="../?hub" aria-label="Hub" data-k="slot". Slot 2 is a button with id="tabnav" and class "tab on"; its icon is the page's own, filled while on. Slot 4 opens the page's settings menu with data-fills, or is dimmed.
- .tab.on shows the pill --on and the filled drawing (.icf) instead of the outline (.ico). The active slot stays on while its menu or a deeper menu from it is open. [T]
    <nav class="bar frost" id="tabs">
      <a class="tab" href="../?hub" aria-label="Hub" data-k="slot"><svg>Hub drawing</svg></a>
      <button type="button" class="tab on" id="tabnav" aria-label="Pages, you are on Feedback" data-k="slot"><svg>page icon</svg></button>
      <a class="tab" href="..." aria-label="..." data-k="slot"><svg>action</svg></a>
      <button type="button" class="tab" disabled aria-label="No settings on this page" data-k="slot"><svg>Settings</svg></button>
    </nav>
- The counter's strip is the same shell (.bar.strip.frost) with its own four controls, and no Hub slot, so its Go to keeps a Hub tile. The hub has no bar.

Menus
- .panel.frost: fixed, 12 from the sides, max-width 456, corner 24, padding 16, sits 8 above the bar; max-height counts the bar. Shown by .show. Order in the file: .scrim, then panels.
- Every overlay is a menu: .phead (title h4.ttl 20, X as .circ.btn.glass), .pbody (the only scroller), optional .pfoot. No full-screen sheets.
    <section class="panel frost" id="pset" aria-hidden="true" aria-label="Trade settings">
      <div class="phead"><h4 class="ttl">Trade settings</h4><button type="button" class="circ btn glass" data-close aria-label="Close" data-k="do"><svg ...></svg></button></div>
      <div class="pbody">...</div>
    </section>
- Head with a count: .ht holds an optional .back, h4 and .cnt (12 muted).
- Edges: while the body runs under the head or foot, pages.js adds .edge and that edge shows a hairline and soft shadow. Nothing for a page to do.
- Tray (.panel.tray): a menu holding one track and nothing else. No title, no X; padding 6, corner 30.
    <section class="panel frost tray" id="pnav" aria-hidden="true" aria-label="Pages"><div class="pbody"><div class="goto" id="pnavgoto"></div></div></section>
- Deeper menu: replaces the menu it came from. Shows .back (a .circ.btn.glass) and no X. Its title is the label of the row that opened it. Back returns; the scrim or the X on a root menu closes the whole stack. Moves: .fromr (arriving from the right), .froml, .tol, .tor (leaving); the page script sets one per move.
- Scrim (.scrim, .show): rgba(0,0,0,.35); the counter's full-card viewer uses .7.
- Open menu: add html.lock (overflow hidden at the root); remove it when the last menu closes.
- Never set opacity or pointer-events on a panel by id; those belong to .panel.show. [C] Style a panel by id or app.css classes only; the menu script rewrites its className.
- A menu with one page-level script: set(on) adds or removes .show on the panel and scrim, html.lock, and aria-hidden. See feedback/index.html. Counter and trade keep a stack (OPENP, STACK, show, deeper, back, syncBack).

Go to (pages.js)
- .goto: sunken track, corner 24, padding 4, gap 2, tiles .gt equal width, 60 high, icon 22, label 12. The current page is the chosen tile: a button with id="pnhere" and data-close.
- Fill it with RAVI_GOTO(container, hereId, rel, withHub). rel is "../" from a page folder. Pass withHub true only where the page has no Hub slot (the counter). Settings is never a tile.
    window.RAVI_GOTO(document.getElementById("pnavgoto"), "feedback", "../");
    document.getElementById("pnhere").addEventListener("click", function(){ set(false); });
- RAVI_GOTO lists Hub (if withHub), then every RAVI_PAGES entry with a path, in order. A new page appears with no other edit.

Confirm and motion helpers
- Two-tap confirm: first tap adds .armed (and shows the one-line prompt); a second tap within 3000 ms acts; the timer or a cancel removes .armed. Toggle the class; never rewrite className. The armed look is page-local (settings .tab.armed and .starm, counter .pact.armed, .sidebtn.armed) and uses --glass-press, or the side colour at .50 for a side control.
- Flashes: .flash-n (bone, neutral) and .flash-p (--pc, the player colour), .42s. Apply after the render: find the fresh node, remove the class, force reflow, add it.
- .reveal: content a tap opens eases in (.26s, up 6 and fade). Add it after the tap; never on a render.
- [hidden] always wins (display none).

Icons (pages.js RAVI_ICON)
- 24 grid, 2-unit round lines, one corner size. RAVI_ICON(name) returns the svg for hub, events, game, trade, feedback, soon, settings.
- Each icon has an outline group (.ico) and a filled group (.icf); the filled one shows when its parent has .on. The hub drawing and the strip's two are one drawing in every state.
- Gaps in a filled icon are real holes cut by a mask, so every mask id on a page is unique. RAVI_ICON numbers its own (rvm1, rvm2, ...). Static markup names its own: rvs-<page>-<what>, e.g. rvs-fb-set.
- A page icon is added to pages.js as one more entry in the SVG table; the bar copies it inline.

The hub block (index.html)
- .blk (rendered from RAVI_PAGES into nav#grid.grid): three per row, square, corner 20, padding 11. Colour from --cl (page rgb) and --ci (tint). Icon .bi 52 centred above the name .bn (Poppins 700 15). Link with data-k="do".
    <a class="blk glass" href="calendar/" style="--cl:255,176,32;--ci:...;" data-k="do"><span class="bi">icon</span><span class="bn">Events</span></a>
- .blk.dead: a Soon slot, a div, dimmed (.4), inert.
- The hub: eight blocks; a new page takes the first Soon slot; App settings stays last. Plate .low.glass under the name .hubname (34, Poppins 800); hub footer .hubfoot (12 muted, Riot notice).

The install screen (pages.js, app.css; signed off by Mako 2026-10-09)
- In a browser tab every page shows only #ravigate, first in the body; html.gate hides every other child of the body. The page's own markup and scripts are untouched.
- It stays out: installed (navigator.standalone, or display-mode standalone, fullscreen or minimal-ui); after Continue in the browser in this tab (session key ravi.web.v1); on a ?sim= link; under a test tool (navigator.webdriver). window.RAVI_GATE is true while it shows; the hub's launch intro waits for it.
- Layout: one block centred in the screen (min-height 100svh; top --top-clear + 8, bottom safe area + 84 so the Continue line clears Safari's floating bar): .gwtop (the name .gwname at 40 with RA --p1 and VI --p2, one line .gwline 17 muted), one glass card .gwcard (corner 22, .shead 20), then on a phone a 13 muted note (.gwnote) and the footer (13) with the Continue link.
- iPhone (#gwios): Add RAVI to your Home Screen, six numbered steps as Safari shows them (.gwstep: number .gwn 15 muted, icon 24, words .gwt 17, optional second line .gwsub 15 muted; at least 44 high, may wrap, hairline inset 16): the menu button (No menu button? Tap Share and go to step 3), Share, Scroll down or tap View More, Add to Home Screen, keep Open as Web App on then Add, Open RAVI (the app icon). Another browser on iOS starts at Share (five steps).
- Android (#gwand): Install RAVI. The .pact button (#gwinst) shows only once the browser offers its prompt; otherwise one line says to use the browser menu.
- A computer (#gwpc): RAVI is a phone app, one line, and Continue in the browser as a .pact.
- The app icon appears once, small, in the last iPhone step. It is the wordmark itself, so never above the name.

## 6. New page checklist (in this order)

1. pages.js: edit the first Soon entry of RAVI_PAGES: id, name, path ("<id>/"), icon getter (RAVI_ICON name), rgb "r,g,b". Keep Settings last. Add the icon to the SVG table first if it is new.
2. Make the folder <id>/ and index.html from the Kit: head as in section 5 (manifest link, theme-color #08090A, apple meta, fonts.css, app.css, pages.js), .wmrow, main wrapper, .pghead or a glass plate, content, footer. The install screen comes with pages.js.
3. The bar: four slots in order, unused one dimmed. A Go to tray (#pnav) with the .goto filled by RAVI_GOTO, its script, and the double-tap guard script (copy the last script block of feedback/index.html unchanged: touchend, 320ms, 30px, buttons and links skipped, passive false).
4. "Open the app to" (settings) and the hub read pages.js; nothing else to edit there.
5. Tests: drawn-test.js PAGES list (add [id, "<id>/"]); audit.js DRIVERS (add a run<Page> function to the DRIVERS map, or the generic fallback runs closed-only); m2-test.js page lists (T1, T8, T9, T18); m8-test.js PAGES; a new fail-first test for the page's own logic (pattern of m6-test.js and m7-test.js: node <name>-test.js <app root>), added to the DEFAULT list in check.js.
6. Run node check.js. Fix failures; never change a test or threshold to pass.
7. Mako phone-checks after the green tick on GitHub's Pages build.

## 7. Menus and the bar (rules)

- Every overlay is a menu: head (title, X), body, optional foot. Only the body scrolls. [T]
- While the body runs under the head or foot, that edge shows a hairline and a soft shadow; with nothing underneath it shows none. [T]
- Going deeper replaces the menu: back arrow, no X. A deeper menu's title is the label of the row that opened it.
- A menu opens from the control that opened it: from the bar it rises from the bottom and sits 8 above the bar.
- The menu's height cap counts the bar. Menus and the counter's victory banner sit above the bar.
- One shared bar (.bar, .tab, .frost) unchanged on every page. Fully round, 12 in from the sides.
- Four slots, always in order: Hub, Go to, the page's one action, Settings. An unused one dims in place. [D]
- Go to lists the pages, tiles sharing the track evenly. A page whose bar carries Hub leaves Hub out of Go to. App settings is reached from the hub and is never in Go to. [T]
- App settings is a page: each section a glass card holding a sunken group. Its bar's third slot resets every setting with a two-tap confirm; its Settings slot is dimmed.

## 8. Motion

- Motion confirms; it never decorates. One exception: the hub's launch intro.
- Nothing animates on first paint, apart from the launch intro.
- Press: scale .96 and the shade change (button:active). A row inside a group takes the shade only. Large surfaces (hub blocks, the event head) scale .97 with brightness 1.2.
- Tap flashes .42s: .flash-n neutral, .flash-p player colour. A control that already confirms itself twice gets no third.
- A chevron turns in .28s.
- Page to page: no motion. Pages switch instantly so the bar never changes between them.
- Menu arrives in .34s (transform) and leaves in .2s. A deeper menu slides 32px in from the right; Back slides it out; the menu it came from moves the other way.
- Content a tap opens eases in under its row in .26s (.reveal), added after the tap, never on a render. Its height changes in one frame.
- A point lands: the numeral settles from 1.06 and the newest rail line draws in (--mo-rise .32s).
- Pass turn: the button flashes the incoming player's colour, its turn line rolls up, and a glow fades in across the button into their half, .56s.
- The victory banner rises where a menu does, when a game ends in front of you; never on first paint.
- The launch intro: once per launch, the first time the hub shows (session flag ravi.intro.v1; off with ravi.intro.off.v1). 'Rift App' in blue over 'Van Isle' in pink turns into RAVI in about 1.9s; the hub's blocks rise in while the name is read. Any tap finishes it. No other page has one.
- The counter updates its sides in place, so the next render never cuts a motion off. [T]
- Reduced motion turns every transition and animation off.
- Never animate layout from script while the page scrolls. Never tween or scroll-correct a height above the screen.

## 9. Phone mechanics and names

- Double-tap zoom is held off by a touchend script on every page: a second touch within 320ms and 30px is cancelled, passive:false, buttons and links skipped, and the timer resets on every skip. [T]
- Anything tappable is a button, or an a, or carries role=button.
- A disabled control drops out of hit-testing.
- Every button declares its background, even none (app.css sets background none on button).
- Links that act as tiles show no long-press preview (-webkit-touch-callout none, user-select none).
- Every page is at least one screen tall (body min-height 100vh). The scrollbar stays put (scrollbar-gutter stable, overflow-y scroll). [C]
- The wordmark row starts at safe-area top + 30, where the counter's stage starts. The hub's name is centred in its top area from --top-clear + 36.
- No member of a new class or function family is a prefix of another.
- An index written into markup comes from the source array, never the loop counter.
- A legend is a Riftbound character.
- Keys: vir.hub.open.v1 (page to open to), ravi.intro.off.v1, vir.cal.filters.v1, vir.seen.v3; session: ravi.intro.v1, ravi.web.v1 (Continue in the browser).

## 10. Page notes

Hub (index.html)
- No bar. Name .hubname centred in .top (height max(260px, 42vh)); .low.glass plate with a curved top; nav#grid of eight blocks; the middle blocks sit 14 up (nth-child 2 and 5). Open-to check at the top of the file reads vir.hub.open.v1; ?hub forces the hub.
Calendar (calendar/index.html)
- Sticky month card (.stick zero-height holder, .card, .hold spacer, arithmetic height), .mrow with month, year and the .hemi pair, gear (#filt, data-fills panel; .filtered marks hidden filters) and collapse chevron (#mtog).
- Day cells .cell (circles, data-k grid), dots under them; agenda of .ev cards with .evhead and .evact (Play here on today, locator link).
- Menus: tray #pnav; #panel "Calendar settings" (Area .seg, Event types .pick, Stores .pick). Bar action: subscribe (#subtab). Two controls fill with #panel.
Counter (counter/index.html)
- Fixed .stage with two sides (.side, data-role major, equal or minor), score numerals .num, .rail log, cut score buttons .acts, Pass turn .pass, round timer line .tmv, victory banner .win. Strip (.bar.strip.frost) of four controls; Go to has Hub (withHub true).
- Menus #pgame, #pnew, #ptimer, #pleg, #pevt, #pend, #plog, #ppast with a stack (OPENP, STACK). Full-card viewer .spot (view kind, scrim .7).
Trade (trade/index.html)
- Sticky .plate (search .sf, .sides track with side colours, results .res), ring .vd for the difference, side panels .sidep with .ln lines and steppers .stp, undo bar .ud, toast .toast.
- Bar: Hub, Go to, Saved trades (#psav, data-fills), Settings (#pset, data-fills). Menus #pnav, #pset, #psav, #phist, #ptrade, #prcp.
Feedback (feedback/index.html)
- .pghead, a glass form card (.fcard, Tally embed), small print .fbn, "Recently shipped" list (.ship), footer. Bar action opens the form on its own page; Settings dimmed.
App settings (settings/index.html)
- .pghead, two glass cards (.sts) holding a .shead and a .pick: Open the app to (rows from RAVI_PAGES plus Hub) and Motion (Opening animation, a check row). Reset in the bar's third slot, two taps; Settings slot dimmed.

## 11. Checks

- check.js: runs drawn-test, m5c, m5d, m5e, m5f, m5g, m5b, m5, m4, m3, audit, m2, m6, m7, m8. Run it once before every commit; node check.js <file> while working. Warns if ports 8900 to 8999 are in use.
- drawn-test.js: with every menu open on all six pages at 390x844, checks corners [D], type by height [D], and sideways overflow [D].
- audit.js: over every page, state and width (375, 390, 430); Chromium from check.js, node audit.js --engine both adds WebKit. A sizes, B alignment, C bare px sizes, D control kinds, E layout safety, plus a scan that pages do not reshape Kit parts. [A]
- m2-test.js: pages load cleanly (T1), links and manifest resolve (T8), the Riot notice on the hub only (T9), theme colour (T18).
- m3-test.js: events carry round and store; calendar Play here, store filter, remembered filters; counter event tag, past-match filter, round timer.
- m4-test.js: counter time called and agreed draw, end events, the log.
- m5-test.js: Go to tiles, hub notice, calendar subscribe, trade rows as deeper and do kinds.
- m5b-test.js: counter Game menu order, End this game and Round timer menus, player cards, New match, Past matches.
- m5c-test.js: counter End this game labels, short confirm text, Round timer Stop in the foot, Pass turn name.
- m5d-test.js: a match is logged the moment it is decided; New match keeps the timer.
- m5e-test.js: Time called between games; Play here opens New match with the event picked.
- m5f-test.js: a saved trade's title can change; nothing else on it does.
- m5g-test.js: a bar slot stays on while its menu or a deeper one is open; menu edges.
- m6-test.js: counter sides update in place; trade lists rewrite only when their markup changes.
- m7-test.js: App settings page and its rows, reset, Go to without Hub where the bar has it, the calendar gear fills.
- m8-test.js: the install screen on all six pages in a browser tab, never installed; iPhone steps, Android Install, computer; Continue for the tab only; the intro waits; ?sim= and test tools skip it; fit at 402 and 360, type on the rungs (40 for the name), the Continue line clear of Safari's bar. Every other suite runs past the screen (navigator.webdriver).
- Candidate checks, not built:
  1. No 999px in a border-radius whose corners differ (static).
  2. Any font-size off the rungs carries an exempt comment (static).
  3. Poppins used only at 600, 700 or 800 (static).
  4. Every open menu is visible and tappable: opacity 1, pointer-events auto, its centre inside it.
  5. No panel sets opacity or pointer-events by id (static).
  6. Every page's body is at least the viewport height.
  7. No unfrosted fixed or sticky element sits above --top-clear.
  8. Prove each audit.js check on a planted defect, or move it into drawn-test.js.

## 12. Changing this file

- A new rule enters only with Mako's yes, as its own commit, never inside a fix.
- Mako's eye on the phone outranks any value here. Anything he names becomes a rule with a check.
- If the code and this file disagree, one of them is a bug. Report it; do not pick.
- To break a default on purpose, say so in one line in the commit message.
- ASCII only, this file included. Under 500 lines.
