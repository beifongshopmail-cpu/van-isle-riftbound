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
- --cg .30: the coloured glass, how much colour a coloured surface carries (section 4)
- --tint: the page colour inside glass, set by pages.js on a page marked glass:true, rgba(page rgb, --cg); transparent elsewhere
Type
- --disp "Poppins", system-ui, -apple-system, sans-serif
- --text "Nunito", system-ui, -apple-system, sans-serif
Sizes
- --barH 56
- --sz-row 44: menu rows, fields, full-width actions
- --sz-track 40: a sunken track, search and name fields
- --sz-sm 36: round buttons and compact pills
- --sz-seg 34: a segment inside a track, swatches
- --sz-seg-tall 38: a segment in the counter strip's Layout track, nowhere else
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
- Plate frost: the calendar's month card (.card), the trade control plate (.plate), the Decks plate (.plate) and the Rules search plate (.plate) are page-local sticky surfaces: fallback rgba(10,11,13,.94); with blur rgba(10,11,13,.5), blur 18 saturate 180%; shadow --glass-base then 0 8px 24px rgba(0,0,0,.45); corner 24.
- Bone: chosen in a track. A bone check on the right means chosen in a list.
- A fill means selected, never important.
- A glass surface is never its own scroller. A still glass wrapper holds a plain scrolling child.
- Crop with overflow, never clip-path, on anything holding a frosted surface. No drop shadow inside a crop.
Lists
- One thing is a pill: a button, a field, a track. A list of rows is one group: rows flat inside, no gap, a hairline rgba(255,255,255,.08) between rows inset 16 from the left. [A]
- Inside a card, sections are divided by a 1px solid line at rgba(255,255,255,.07) across the card's content width, never inset: the event card's open row (.evact), trade, counter and feedback cards. [C] (m95c-test.js checks the event card's; Mako's yes 2026-10-12)
- A group you press in is glass (.doors). A group you choose in is sunken (.pick); its chosen row wears an 18px bone check, 16 from the right.
- A pick-many list shows the same check on every row that is on (calendar .tyrow with .box).
- Follow (calendar) is one sunken group of rows you tap: a row marks itself with a bone bell once tapped, as a pick-many list marks a row with a check. (Mako's look, 2026-10-16)
- An on/off setting is a check row in a sunken group (.pick), never a switch.
Kinds (firm: every tappable carries data-k on itself or its nearest container) [A]
- do: acts once. Glass, or a side pill (.sidebtn) when it acts for one player. Arm-then-confirm is a do.
- deeper: a row that opens the next menu. Carries the right chevron (.cvr); nothing else may.
- pick: a choice that stays, in a sunken track (.seg) or group (.pick). Go to is a pick.
- type: a text field in a sunken shape.
- open: opens in place. Carries aria-expanded and a .chev that points at what a tap will do.
- slot: an icon slot on the bar or the counter's strip, nowhere else.
- play: the counter's field. grid: the calendar's day cells. view: the full-card viewer (counter, Decks). card: a card's picture or row on the Decks page, a holding's tile or row on the Collection page, and a legend's card on the Tier list (its shelf or its tier's menu); a tap opens it, or adds it in a card browser. Nowhere else. (Collection: Mako's yes 2026-10-25; Tier list: 2026-10-29)
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
- Named exemptions, nothing else: 16 text inputs; 16 counter score words at .06em; the counter numerals (column formula in .num, 40 on the slim banner); 26 trade ring amount; the wordmark, 22 at the page top (.wm) and 48 on the hub (.hubname), the size the launch intro's full name starts at; 40 on the install screen (.gwname); 34 Poppins 800 on the Collection's value (.cval .v; Mako's yes 2026-10-25). Go to tile labels are 12 with letter-spacing -.08em.
Sizes
- Control heights come from section 2. Measure the surface the eye sees, not the control inside it. [A]
- Size-exempt pictures carry a size-exempt comment on the line: trade card art, the counter's rune.
- Calendar day cells: circles, width min(46px, 100%) of the column.
- Icon sizes: bar 24, Go to tile 22, install step 24, round button 18 (a bare glyph such as a chevron, Close or Back at line 2.4; a drawn icon such as the gear, pin or Out at line 2), hub block 60 (line 1.5; smaller on a narrow phone so the block stays square), pact 17, row chevron 16 (line 2.2). (Mako 2026-10-16)
- Chevrons: one shape (12-unit arms), the same size in every direction: in a round button 18 at line 2.4, trailing in a row 16 at line 2.2. (Mako 2026-10-16)
Corners
- A shape whose corners differ uses real values (a pill end is half its height), never 999px: the browser shrinks every corner together and flattens the small ones. A plain pill with four equal round corners may use 999px. [D]
- Cut track (.seg.multi, counter score buttons, Decks' This deck row and Hand's New hand | Mulligan | Draw a card): round outer ends of half the height, 6 inner corners (--r-cut), 3 gaps (--gap-cut). [D]
- Surface corners: 24 for menus, the Go to track and the two sticky surfaces; 22 (half a row) for every group and card (.pick, .doors, .ev, saved-trade cards, the feedback form group); 20 for tiles (.gt Go to tiles, .blk hub blocks); a tray is 30 (24 plus its 6 padding).
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
- Event types: each has a mark shape, a hue and its name in words on every card. Order everywhere: Open Play, Learn-to-Play, Nexus Nights, Summoner Skirmish, Pre-Rift, Other.
  - Open Play 115,80,240, circle (s-circle)
  - Learn-to-Play 0,190,140, ring (s-ring)
  - Nexus Nights 255,200,40, triangle (s-tri): the Events page colour, the most common card
  - Summoner Skirmish 200,35,70, diamond (s-diamond)
  - Pre-Rift 205,220,240, pentagon (s-penta)
  - Other 90,96,106, outlined hexagon (s-hex). The filter row reads Other events; a card reads Event.
- Marks are one drawn set on a 12 grid with round joins, in a fixed square: 12 in a row (.mk), 10 on a card (.ev .l1 .mk), 9 on the month grid (.dots .mk).
- Event card body: coloured glass (below) in the type rgb.
- A page colour (hub block, event type) is given as an rgb triple; tints are computed in script (hub icon and name: toward white by .62; calendar lit: .40).
- The counter's domain runes are coloured glass (Mako 2026-10-16): Riot's rune file untouched, its white glyph over a disc of the domain colour at .90 with a lit top edge, a light rim and a soft shade at the foot. A named exception to the one-glass .30 rule.
- Coloured glass (Mako 2026-10-15): a coloured surface carries its colour at --cg (.30) inside the glass, with the usual rim and base glow, frosted (blur 20, saturate 160%), and no solid base. One recipe (.cg, colour as --c) for hub blocks, event cards, trade side cards, Rules sections and a coloured page's glass. Fallback without blur: the same colour over --frost-solid. Plain glass inside glass is not frosted again.
- See-through chrome stays clear unless it shows what it is about. Chrome is what moves you around or sets things: the bar, the strip, Go to, a page's settings menus, and the sticky plates (the calendar month card, the trade, Decks and Rules plates). A plate may wear its subject's colours (the open deck's two domains, on a 145-degree band 30 wide, at .32; the deck blocks at .44). A menu that shows a page's own content (a Rules article) is content, coloured as the page codes it. The bar's you-are-here pill wears the page colour. (Mako's yes 2026-10-24)
- Page colours (Crown, Mako 2026-10-14): Events 255,200,40; Game 200,35,70; Trade 115,80,240; Feedback 40,95,240; Rules 0,190,140; Settings 205,220,240; Decks 80,230,170 (Mint); Collection 220,90,30 (Rust; Mako's yes 2026-10-25); New here 70,185,235 (Sky; M15, 2026-10-27); Top cut 170,210,60 (Lime; M15, 2026-10-27, provisional until the colour refinement); Tier list 215,90,230 (Orchid; M17, 2026-10-28, provisional until the colour refinement). Feedback, Rules, New here and Settings colour their glass (glass:true in RAVI_PAGES); Events, Game, Trade, Decks, Collection, Top cut and Tier list keep clear glass; Collection's bars and bar pill wear Rust.
- Rules colours by section, never by the page: Current documents jade 0,190,140, Errata garnet 200,35,70, FAQs and rulings gold 255,200,40, wherever an entry shows (the page, search results, an opened article). A new section takes its own palette colour. Always beside the words that name it. (Mako's yes 2026-10-24)
- Reserved palette colours (Mako 2026-10-15, option B): Mint 80,230,170 is the Decks page (Mako 2026-10-17); Rust 220,90,30 is the Collection page (2026-10-25). A new page brings its own colour. Sky 70,185,235 is New here and Lime 170,210,60 is Top cut (2026-10-27); Orchid 215,90,230 is the Tier list (2026-10-28, provisional). The palette is these twelve plus the players' blue and pink; a new colour use picks from it first.
- A card with no domain (colourless) uses the palette's White, 240,240,245, so White is no longer spare. (Mako's yes 2026-10-24)
- Function before colour: no page colour where colour already means something (the counter, the players, the alarm, low spots).
- On a page colour, grey text inside glass is #DCDEE2, not --muted.

## 5. The Kit (shared parts)

Rule for every entry: a page may not set height, min-height, padding, border-radius or width on .door, .pact, .seg, .nf, .sf, .goto, .rec, .btn or .circ. [A]

Page-local classes named in this file (not in app.css; each lives in the page file shown, and is not a Kit part):
- index.html (hub): .blk .blk.allp .bi .bn .hubfoot .low, the All pages tray #pall
- calendar/index.html: .cell .dots .ev .evact .evhead .evlive .fhead .finfo .fmk .fsub .hemi .hl .hr .l1 .lab .lvl .mk .mrow .spots .stick .tyrow; the Live menu #plive: .lalnote .lclk .lempty .levn .lfind .lgrp .lhd .lme .lms .lmt .ln .lp .lrow .lseg .lsmall .lst .lt .me .mine .nm .omw .pts .rs .sv .wld .won
- counter/index.html: .lgppic .lgptile .num .pass .rail .res .spot .tmv .win
- trade/index.html: .bin .lbr .ln .lnh .rcpimgs .res .rrs .sidep .sidr .stp .tail .toast .trow .udb .vd
- feedback/index.html: .fbn .fbody .fgrp .lead .ship
- settings/index.html: .sts .starm .stwarn .stmsg (#stme, Your Riot name)
- cut/index.html: .csec .srows .srow .sv .cseg .cnote .fh .fr .flist .vd .fmore (the maths in cut/cut.js)
- tier/index.html: .lgtop .lgtx .nrows .nrow .pmsg .tc .tctl .tempty .tgrid .tleg .tlet .tlist .tnone .tnote .trow .tscope .tstrip .tph; menus #padd #pev #ppick (the maths in tier/tier.js; the data from fetch-tier.js and server/live/finishes.js)
- start/index.html: .nsec .ntx .gsel .guide (two guides on one track: New to Riftbound, New to RAVI; #ravi opens the second)
- rules/index.html: .empty .extl .new .old .plate .rbody .rlab .rnote .rpic .rsrc .rtx .srow .wrap
- collection/index.html: .armed .art .bhead .bin1 .bopts .boot .bsr .brw .camt .cards .cchg .cempty .cend .cgrid .chip .chw .ck .cmid .cmv .cnm .cnote .cpic .crow .cseg .csub .ctile .cval .dvrow .dvseg .dvsort .fchip .first .hchg .hfacts .hgain .hnow .hpic .hrow .isum .lpm .lq .lsteps .more .mvbox .mvh .mvsep .owd .plate .psf .rot .sel .selp .stk .stp .tcap .tnm .toast .tpr .ttot
- decks/index.html: .add .addt .art .aside .avg .bad .ban .bbody .bchips .bfa .bgrid .bhead .bin .bin1 .bmore .bnone .bnote .boot .brw .brwon .bsr .bstack .cbox .cg2 .cgrid .chart .chcol .chlab .cmid .cname .cnm .cols .cpic .cq .crb .crd .csb .ctile .ctx .cw .dcard .dcend .dchk .dcmid .dcname .dcnt .dcpic .dcrun .dcstat .dcsub .dgrip .dnone .dnote .dprice .dsec .dsub .dv .dvrow .dvseg .dvsort .dwrap .ed .epill .esf .fchip .gcell .ghost .gpic .gq .gsh .gstar .gstp .hacts .hc .hdrawn .hhd .hmark .hnone .hnote .hold .hrow .hsort .ires .kw .land .lcard .lcell .lift .low .lpm .lq .lrhd .lrow .lsteps .mban .mbox .menu .mpic .n .none .ochip .ochips .odds .okc .okmk .omull .open .otile .otiles .owh .pbar .pchk .pdrow .pfin .pfins .phd .plate .plist .pnone .pr .prb .pre .prow .pti .ptl .pv .pvrow .qrow .qrows .res .resw .rgl .rot .sall .sbtns .shut .sm .spot .spotpic .srow .star .stb .sth .stick .stile .stiles .stools .stp .toast .tokrow .trio .two .vbadge .vw .wmk .xbox .z

Page shell (feedback/index.html, settings/index.html)
- Head: charset, viewport (width=device-width, initial-scale=1, viewport-fit=cover), theme-color #08090A, apple-mobile-web-app-capable yes, status-bar-style black-translucent, apple-mobile-web-app-title RAVI, manifest ../manifest.webmanifest, apple-touch-icon ../icons/apple-touch-icon.png, title "<Page> - RAVI", then fonts.css, app.css, pages.js, account.js (every page with the wordmark row, and the hub), the page's own style block (in that order).
- Page style block starts: html{background:var(--ground)}, a{color:inherit;text-decoration:none}, body{-webkit-font-smoothing:antialiased;touch-action:manipulation}.
- Wordmark row (.wmrow, .wm, .logo1, .logo2): chrome, one thin row, scrolls away. Padding safe-area top + 30 / 18 / 16 / 18. Wordmark 22, Poppins 800, RA --p1, VI --p2. Plain RAVI everywhere else.
    <div class="wmrow"><h1 class="wm"><span class="logo1">RA</span><span class="logo2">VI</span></h1></div>
- Main wrapper (page-local id, e.g. #fb): max-width 480, margin 0 auto, padding 0 12px calc(max(4px,calc(env(safe-area-inset-bottom,0px) - 12px)) + var(--barH) + 40px). The calendar's wrapper is .body (calendar/index.html) and the trade page's is #trd with .tail (trade/index.html), with the same idea; scrollbar-gutter stable and body min-height 100vh come from app.css.
- Footer (.foot): 30 above, a dim hairline inset 24 from both ends, paragraphs 12 muted, links bone.
    <footer class="foot"><p>...</p><p>Built and maintained by <a href="https://beifonghithouse.com">Beifong's Hit-House</a>, Victoria BC.</p></footer>
- Every page with words ends in the footer credit; a page showing what others publish (Calendar, Trade, Rules) ends it with "Something wrong or missing? Tell us." (Mako's yes 2026-10-16)
- The support plate (.sup.glass, built by RAVI_SUPPORT in pages.js): who builds RAVI and the tip link, one copy on App settings (after Motion) and Feedback (at the bottom, under Recently shipped). Head Support RAVI, a 56 round picture (img/mako.webp, size-exempt), name and a muted line, two short paragraphs in Mako's words, a centred pill out to his Ko-fi with the out-arrow (.pact .extl). (Mako 2026-10-27)
- A page that shows prices (Trade, Decks, Collection) starts its footer with the one price source line (RAVI_STAMP in pages.js: tcgcsv.com, the day, the rate) and says "Market price is a public benchmark, not an offer from any store." (Mako's yes 2026-10-25)

Page head, section head, glass card (feedback/index.html)
- .lede: a text page opens with one plain line under the wordmark, 13 muted, no glass; its title is an h2.sr for screen readers (Mako 2026-10-15: the glass header block retired on Feedback, Rules and App settings). .pghead.glass stays in app.css for now, used on no page.
    <h2 class="sr">Feedback</h2><p class="lede">One line.</p>
- .shead: title left at 17, optional .sp and .cnt (12 muted) right. min-height 32, margin-bottom 10.
    <div class="shead"><h2>Recently shipped</h2></div>
- Glass card: any section with .glass and a page-local class that sets only margin and corner 22 (settings .sts). A group inside it is the Kit's own.

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
- Every search field clears with a round X at its right end (.fbtn.fx: the field's glass button made round, the bare X glyph), shown only while there is text; hidden, it keeps its place. A track never shares the search's row; it sits on the row under it (trade .plate, the counter's legend picker). (Mako's yes 2026-10-16; the round X 2026-10-24)

Buttons (calendar/index.html, app.css)
- .btn.glass: round glass pill, shade --glass-press on press. .circ: 36 round, icon 18. Use .circ.btn.glass for round icon buttons (close X, back, gear, chevron toggle).
    <button type="button" class="circ btn glass" aria-label="Close" data-k="do"><svg ...></svg></button>
- .hemi (calendar-local, with .hl and .hr): two halves of one pill, 36 square each, outer curve half of 36, 5 at the join, 4 overlap. Copy from calendar/index.html if a page needs a pair.

The account picture and its menus (account.js, app.css; plan 2 M1, Mako 2026-10-30)
- Every page with the wordmark row, and the hub, carries your picture (.acpic, glass, 36 round) in the row's top right corner, 18 in, level with the wordmark; it scrolls away with the row. None on the Game page. It shows a legend's art or your photo filling the circle; signed in with neither, a filled person; signed out, a person in outline (18, line 2).
- Its menus (.panel.acct) are built by account.js, never by a page; their heads keep 68 on the right for the picture. The root shows your name and @username; Profile shows the picture at 88. Saving keeps you in the menu you saved from (Mako 2026-10-30).
- Picture opens on a 176 circle you drag to move the picture and pinch to zoom (a legend keeps its placing; a photo is placed, then cut to 256 square); under it a Printing track for the chosen legend (its own art, then its overnumbered printing, never a signature); then Upload a photo, and one circle per legend, four across. A pick shows in the corner at once and is kept by Use this picture. (Mako's yes 2026-10-31)
- A button that saves says so in its own words for a moment: Saved, Claimed. (Mako 2026-10-31)
- Profile holds the Riot ID, one account per Riot ID, in two fields as Riot shows it, the name and the #tag (.rid), with Claim or Release as a full-width action under them; the root menu's second line reads @username and the Riot ID. An account in ADMIN also has Disputes. (Mako's yes 2026-10-31)

The bar (every page except the hub)
- .bar.frost: fixed pill, 56 high, 12 from the sides, max-width 456, bottom max(4px, safe-area bottom minus 12px), padding 5, four columns, gap 4, z-index 20. Round slots (.tab), 24 icon.
- Four slots, always in this order: Hub, Go to, the page's one action, Settings. Slots never move between pages; an unused slot is dimmed in place (disabled).
- Built by RAVI_BAR (pages.js), never written by hand: the page holds an empty nav and, straight after it, one line naming its four slots. "hub" is slot 1 (the Hub link). {go:"<page id>"} is slot 2 (button, id tabnav, class "tab on", its icon and name from RAVI_PAGES, filled while on; a: adds attributes after its id). Every other slot is {tag, icon, a}: "a" or "button", an icon name from the table, and its attributes in order ([name, null] writes a bare one such as disabled). Slot 4 opens the page's settings menu with data-fills, or is dimmed. [T]
- A bar slot may switch a mode instead of opening a menu (Decks' Edit): it is on, filled, while the mode is on, and dimmed where the mode has no use.
- .tab.on shows the pill --on and the filled drawing (.icf) instead of the outline (.ico). The active slot stays on while its menu or a deeper menu from it is open. [T]
    <nav class="bar frost" id="tabs"></nav>
    <script>RAVI_BAR(document.getElementById("tabs"), [
      "hub",
      {go:"feedback"},
      {tag:"a", icon:"out", a:[["class", "tab"], ["href", "https://tally.so/r/QKlGxX"], ["aria-label", "Open the form on its own page"], ["data-k", "slot"]]},
      {tag:"button", icon:"gear", a:[["class", "tab"], ["disabled", null], ["aria-label", "No settings on this page"], ["data-k", "slot"]]}
    ]);</script>
- The counter's strip is the same shell (.bar.strip.frost) with its own four controls, and no Hub slot, so its Go to keeps a Hub tile. Its Layout track is in the markup; RAVI_BAR adds Undo, Log and Game settings after it. The hub has no bar.
- The strip's Layout track is the one tall track: its options are --sz-seg-tall (38), so the track is 44 like the strip's slots and sits 6 from the strip's top and bottom. A named exception to the Kit rule. [T] (Mako's yes 2026-10-16)
- Every bar in every state, in one picture: rb-tools bar-sheet.js (out/bars/bars-sheet.png). node bar-sheet.js --compare <dirA> <dirB> proves two builds draw the same bars, pixel for pixel.

Menus
- .panel.frost: fixed, 12 from the sides, max-width 456, corner 24, padding 16, sits 8 above the bar; max-height counts the bar. Shown by .show. Order in the file: .scrim, then panels.
- Every overlay is a menu: .phead (title h4.ttl 20, X as .circ.btn.glass), .pbody (the only scroller), optional .pfoot. No full-screen sheets.
    <section class="panel frost" id="pset" aria-hidden="true" aria-label="Trade settings">
      <div class="phead"><h4 class="ttl">Trade settings</h4><button type="button" class="circ btn glass" data-close aria-label="Close" data-k="do"><svg ...></svg></button></div>
      <div class="pbody">...</div>
    </section>
- Head with a count: .ht holds an optional .back, h4 and .cnt (12 muted).
- Edges: while the body runs under the head or foot, pages.js adds .edge and the body fades out softly toward that edge over 24, with no line and no shadow. Nothing for a page to do. (Mako's yes 2026-10-16)
- Tray (.panel.tray): a menu holding one track and nothing else. No title, no X; padding 6, corner 30.
- .pnote (app.css): small print in a menu, 12 on 18, muted, 2 in from the content edge, the same in every menu. A page sets only the space above and below it; a page's own note class matches it. (Mako's yes 2026-10-16)
    <section class="panel frost tray" id="pnav" aria-hidden="true" aria-label="Pages"><div class="pbody"><div class="goto" id="pnavgoto"></div></div></section>
- Deeper menu: replaces the menu it came from. Shows .back (a .circ.btn.glass) and no X. Its title is the label of the row that opened it. Back returns; the scrim or the X on a root menu closes the whole stack. Moves: .fromr (arriving from the right), .froml, .tol, .tor (leaving); the page script sets one per move.
- Scrim (.scrim, .show): rgba(0,0,0,.35); the counter's full-card viewer uses .7.
- Open menu: add html.lock (overflow hidden at the root); remove it when the last menu closes.
- Never set opacity or pointer-events on a panel by id; those belong to .panel.show. [C] Style a panel by id or app.css classes only; the menu script rewrites its className.
- A menu with one page-level script: set(on) adds or removes .show on the panel and scrim, html.lock, and aria-hidden. See feedback/index.html. Counter and trade keep a stack (OPENP, STACK, show, deeper, back, syncBack).

Go to (pages.js)
- .goto: sunken track, corner 24, padding 4, gap 2, tiles .gt equal width, 60 high, icon 22, label 12. The current page is the chosen tile: a button with id="pnhere" and data-close.
- Never more than four tiles across (Mako 2026-10-27). Up to four share one row; five and six fill rows of three (3+2, 3+3); seven or more fill rows of four (7 as 4+3, 8 as 4+4, 9 as 4+4+1), each tile its usual size; app.css does this from the tile count, nothing for a page to do. [T] (Mako's yes 2026-10-10; four across 2026-10-27)
- Fill it with RAVI_GOTO(container, hereId, rel, withHub, withSettings). rel is "../" from a page folder. Pass withHub true only where the page has no Hub slot (the counter). Settings is never a tile, except in the hub's All pages tray (withSettings true), which lists every page.
    window.RAVI_GOTO(document.getElementById("pnavgoto"), "feedback", "../");
    document.getElementById("pnhere").addEventListener("click", function(){ set(false); });
- RAVI_GOTO lists Hub (if withHub), then every RAVI_PAGES entry with a path, in order. A new page appears with no other edit.

Confirm and motion helpers
- Two-tap confirm: first tap adds .armed (and shows the one-line prompt); a second tap within 3000 ms acts; the timer or a cancel removes .armed. Toggle the class; never rewrite className. The armed look is page-local (settings .tab.armed and .starm, counter .pact.armed, .sidebtn.armed) and uses --glass-press, or the side colour at .50 for a side control.
- The armed button's words become "Sure? Tap again"; "Sure?" alone only where that does not fit on one line (the counter's three-across row, Decks' This deck row, the timer's buttons). An icon slot shows its prompt as a line on the page. No standing note explains the second tap. (Mako's yes 2026-10-16)
- Flashes: .flash-n (bone, neutral) and .flash-p (--pc, the player colour), .42s. Apply after the render: find the fresh node, remove the class, force reflow, add it.
- .reveal: content a tap opens eases in (.26s, up 6 and fade). Add it after the tap; never on a render.
- [hidden] always wins (display none).

Icons (pages.js RAVI_ICON)
- 24 grid, 2-unit round lines, one corner size. RAVI_ICON(name) returns the svg for the page icons (hub, events, game, trade, feedback, rules, decks, collection, start, cut, soon, settings, allpages), the bar icons (gear, bell, saved, out, whatsnew, reset, undo, log, edit, add) and the info icon.
- M13 icon pass (Mako 2026-10-26): Collection is a safe on feet (hinges on the left wall, the dial with its centre marked, the bolt running to the wall, filled or not), after Phosphor's vault on the app's line; Collection's Add is a card with a plus; Decks' page icon is its fanned cards turned so they fan up like a hand. Decks' warning mark is a solid triangle with its mark cut out (Material Symbols warning, filled), red (--over), always beside its words.
- Each icon has an outline group (.ico) and a filled group (.icf); the filled one shows when its parent has .on. The hub drawing and the strip's two are one drawing in every state.
- Gaps in a filled icon are real holes cut by a mask, so every mask id on a page is unique. RAVI_ICON numbers its own (rvm1, rvm2, ...). Static markup names its own: rvs-<page>-<what>, e.g. rvs-fb-set.
- Every icon a page or a bar draws is one entry in the SVG table; RAVI_BAR and RAVI_GOTO take it by name. A new icon is added there first, never drawn into a page's bar.
- One line for every icon: 2-unit round lines on the 24 grid (1.5 on the hub). Shapes may be adapted from Lucide, Phosphor, Remix or Material Symbols and redrawn on this line; a family drawing kept as drawn uses the weight that matches (Material Symbols 600 in the bar, 400 on the hub as an .icb copy). (Mako 2026-10-16)
- Hub icons are drawn solid in their tint and faded to .82 as one piece (opacity on the svg), never in a see-through colour, which stacks where two lines meet. (Mako 2026-10-16)
- An icon may hold two masks: "@" for the filled drawing, "@b" for an outline cut; RAVI_ICON numbers both per copy.

The hub block (index.html)
- .blk (rendered from RAVI_PAGES into nav#grid.grid): three per row, square, corner 20, padding 11. Colour from --cl (page rgb) and --ci (tint). Icon .bi 60 centred above the name .bn (Poppins 700 15). Link with data-k="do".
    <a class="blk glass" href="calendar/" style="--cl:255,176,32;--ci:...;" data-k="do"><span class="bi">icon</span><span class="bn">Events</span></a>
- .blk.allp: All pages, a button in plain glass (no page colour), the nine-dot icon; it opens the All pages tray (#pall, the Go to tiles for every page, App settings last), sitting where a bar's tray would.
- The hub: eight blocks, so the hub icon (the 3-3-2 grid) stays true. Seven are the viewer's picks (App settings, Hub blocks; RAVI_HUB_PICKS in pages.js), in page order; All pages is always the eighth and last. Default picks: Events, Game, Trade, Rules, Decks, Collection, New here (App settings until 2026-10-27; it is always in All pages). A new page needs no hub slot: it is in All pages at once and can be picked. (Mako 2026-10-26) On a phone narrower than 390, block names track -.02em so Collection fits whole (Mako's yes 2026-10-25). Plate .low.glass under the name .hubname (34, Poppins 800); hub footer .hubfoot (12 muted, Riot notice).

The install screen (pages.js, app.css; signed off by Mako 2026-10-09)
- In a browser tab every page shows only #ravigate, first in the body; html.gate hides every other child of the body. The page's own markup and scripts are untouched.
- It stays out: installed (navigator.standalone, or display-mode standalone, fullscreen or minimal-ui); after Continue in the browser in this tab (session key ravi.web.v1); on a ?sim= link; under a test tool (navigator.webdriver). window.RAVI_GATE is true while it shows; the hub's launch intro waits for it.
- Layout: one block centred in the screen (min-height 100svh; top --top-clear + 8, bottom safe area + 84 so the Continue line clears Safari's floating bar): .gwtop (the name .gwname at 40 with RA --p1 and VI --p2, one line .gwline 17 muted), one glass card .gwcard (corner 22, .shead 20), then on a phone a 13 muted note (.gwnote) and the footer (13) with the Continue link.
- iPhone (#gwios): Add RAVI to your Home Screen, six numbered steps as Safari shows them (.gwstep: number .gwn 15 muted, icon 24, words .gwt 17, optional second line .gwsub 15 muted; at least 44 high, may wrap, hairline inset 16): the menu button (No menu button? Tap Share and go to step 3), Share, Scroll down or tap View More, Add to Home Screen, keep Open as Web App on then Add, Open RAVI (the app icon). Another browser on iOS starts at Share (five steps).
- Android (#gwand): Install RAVI. The .pact button (#gwinst) shows only once the browser offers its prompt; otherwise one line says to use the browser menu.
- A computer (#gwpc): RAVI is a phone app, one line, and Continue in the browser as a .pact.
- The app icon appears once, small, in the last iPhone step. It is the wordmark itself, so never above the name.

## 6. New page checklist (in this order)

1. pages.js: add the page to RAVI_PAGES: id, name, path ("<id>/"), icon getter (RAVI_ICON name), rgb "r,g,b". Keep Settings last. Add the icon to the SVG table first if it is new.
2. Make the folder <id>/ and index.html from the Kit: head as in section 5 (manifest link, theme-color #08090A, apple meta, fonts.css, app.css, pages.js), .wmrow, main wrapper, .lede or a glass plate, content, footer. The install screen comes with pages.js.
3. The bar: an empty nav and its RAVI_BAR line (section 5), four slots in order, unused one dimmed. A Go to tray (#pnav) with the .goto filled by RAVI_GOTO, its script, and the double-tap guard script (copy the last script block of feedback/index.html unchanged: touchend, 320ms, 30px, buttons and links skipped, passive false).
4. "Open the app to", Hub blocks (settings) and the hub's All pages read pages.js; nothing else to edit there. Add it to RAVI_HUB_DEFAULT only on Mako's say.
5. Tests: drawn-test.js PAGES list (add [id, "<id>/"]); audit.js DRIVERS (add a run<Page> function to the DRIVERS map, or the generic fallback runs closed-only); m2-test.js page lists (T1, T8, T9, T18); m8-test.js PAGES; m96-test.js BARS (its slots and icons); m14-test.js F5 pages (the whole-app fuzz); rb-tools design/sweep-shots.js PLAN (so the consistency sweep sees it, menus open); a new fail-first test for the page's own logic (pattern of m6-test.js and m7-test.js: node <name>-test.js <app root>), added to the DEFAULT list in check.js.
6. Run node check.js. Fix failures; never change a test or threshold to pass.
7. Mako phone-checks after the green tick on GitHub's Pages build.

## 7. Menus and the bar (rules)

- Every overlay is a menu: head (title, X), body, optional foot. Only the body scrolls. [T]
- While the body runs under the head or foot, the body fades out softly toward that edge (24, no line, no shadow); with nothing underneath it stays sharp. [T] (Mako's yes 2026-10-16)
- Going deeper replaces the menu: back arrow, no X. A deeper menu's title is the label of the row that opened it.
- A menu the bar or the strip opens is titled after the slot that opens it; a Settings slot's menu is "<Page> settings". (Mako's yes 2026-10-16)
- A menu opens from the control that opened it: from the bar it rises from the bottom and sits 8 above the bar.
- The account menu and its deeper menus open from your picture in the top right: the menu grows out of it (from a tenth, .34 in, .2 out), and the picture grows from 36 to 56 into the menu's top right corner, 16 in, where a tap closes it; they have no X. Every other menu sits above the bar. (Mako's yes 2026-10-30)
- The menu's height cap counts the bar. Menus and the counter's victory banner sit above the bar.
- One shared bar (.bar, .tab, .frost) unchanged on every page. Fully round, 12 in from the sides. Every bar is built by RAVI_BAR (pages.js) from the one icon table, so no page draws its own bar and a slot two pages share is the same copy. [T] (Mako's yes 2026-10-13)
- Four slots, always in order: Hub, Go to, the page's one action, Settings. An unused one dims in place. [D]
- Go to lists the pages, tiles sharing the track evenly, never more than four across: one row up to four, rows of three for five and six, rows of four past that. A page whose bar carries Hub leaves Hub out of Go to. App settings is reached from the hub (a block when picked, always in All pages) and is never in Go to. [T]
- App settings is a page: each section a glass card holding a sunken group. Its bar's third slot resets every setting with a two-tap confirm; its Settings slot is dimmed. Your Riot name takes the name and the #tag in two fields with Save under them; signed in, it points to Profile instead and keeps Send a test alert. (Mako's yes 2026-10-31)
- The Decks page is worked in, like the counter, and bends three defaults (Mako 2026-10-17): its card browser is a full-screen view, not a menu (the Collection page's too, the same bend; Mako's yes 2026-10-25); the page holds two screens, the list of decks and one deck; the add tile that ends a section in Edit wears a dashed outline.

## 8. Motion

- Motion confirms; it never decorates. One exception: the hub's launch intro.
- Nothing animates on first paint, apart from the launch intro.
- Press: scale .96 and the shade change (button:active). A row inside a group takes the shade only. Large surfaces (hub blocks, the event head) scale .97 with brightness 1.2.
- Tap flashes .42s: .flash-n neutral, .flash-p player colour. A control that already confirms itself twice gets no third.
- A chevron turns in .28s.
- Page to page: no motion. Pages switch instantly so the bar never changes between them.
- Menu arrives in .34s (transform) and leaves in .2s. A deeper menu slides 32px in from the right; Back slides it out; the menu it came from moves the other way.
- Content a tap opens eases in under its row in .26s (.reveal), added after the tap, never on a render. Its height changes in one frame.
- A month change: the new month's weeks slide 24 in from the side the arrow points and fade in, .26s; the list under it eases in (.reveal). A day tap eases the list in too. [T] (Mako's yes 2026-10-16)
- A number a tap changes settles from 1.06 (.settle, .32s), the point-land move: the trade's quantities, side totals, counts and percents. Never on a render. [T] (Mako's yes 2026-10-16)
- A pick-one track slides its chosen fill to the new option in .26s, as iPhone's segmented control does (pages.js). Not multi-select tracks, colour swatches or the legend's printing chips. [T] (Mako's yes 2026-10-16)
- Focus and Split: while the sides travel, their fresh contents fade in (.42s). The trade's Yours/Theirs eases both sides in. [T] (Mako's yes 2026-10-16)
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
- A sticky plate parks 10 above --top-clear, so its words start on it. The gap above it is never a scroller's padding (a sticky's top counts from inside that padding). A menu at its tallest stops at the same place. [C] (Mako's yes 2026-10-24)
- No member of a new class or function family is a prefix of another.
- An index written into markup comes from the source array, never the loop counter.
- A legend is a Riftbound character.
- Dates and times are written one way, by pages.js: RAVI_DATE gives "Sep 16, 2026" (short: "Sep 16"), RAVI_WHEN gives "Oct 15, 8:01 PM" in island time, with the year only when it is not this year. Riot's words on the Rules page stay as written. (Mako's yes 2026-10-16)
- Keys: vir.hub.open.v1 (page to open to), vir.hub.blocks.v1 (the hub's picks), vir.start.guide.v1 (New here's last guide), vir.cut.v1 (Top cut's numbers and event), ravi.intro.off.v1, vir.cal.filters.v1, vir.seen.v3, vir.follow.v1, vir.rules.seen.v1, vir.coll.v1 (binders, no binder, Wishlist), vir.coll.set.v1 (Collection's view and settings), vir.me.v1 (my Riot name, M16), vir.alerts.v1 (events with alerts on, M16); session: ravi.intro.v1, ravi.web.v1 (Continue in the browser).

## 10. Page notes

Hub (index.html)
- No bar. Name .hubname centred in .top (height max(260px, 42vh)); .low.glass plate with a curved top; nav#grid of up to eight blocks (the picks, then All pages); the middle blocks sit 14 up (nth-child 2 and 5). Open-to check at the top of the file reads vir.hub.open.v1; ?hub forces the hub.
Calendar (calendar/index.html)
- Sticky month card (.stick zero-height holder, .card, .hold spacer, arithmetic height), .mrow with month, year, the .hemi pair and the collapse chevron (#mtog).
- Day cells .cell (circles, data-k grid), dots under them; agenda of .ev cards with .evhead and .evact: under the in-card line, the street address (.evaddr 13 bone, .evend 12 muted when the feed has an end) left and round icon buttons right (.evbtns: .evdir Directions to the phone's maps, .evadd one event's file data/ev/<id>.ics, .evcut the Top cut page for that event (../cut/?ev=<id>, in the app; every kind but Learn-to-Play and Open Play; M15), .evlink the event page), each a .circ with an aria-label and no words; all but .evcut open outside the page. No Play here; the counter's ?ev= link stays a hidden entry.
- Live (M16, 2026-10-27): for today's events near their start (every kind but Learn-to-Play and Open Play) live.js asks RAVI's server once a minute. A running event's card adds one line under its name, a bone LIVE pill and where it stands in words (Round 2 of 3, 39 min left); its open row adds a .pact, Pairings and standings (Final standings once it ends), that opens #plive "Live": the event's name (13 muted), the round and its clock (Over time past zero, in --over with the words), my table in a glass card (tap it to change my Riot name; no name saved: a field, Name#TAG, with Find me), Pairings | Standings, a round track, then read-only rows (no kind, no surface, hairlines): table number, both players with their tag in 12 muted, each result in words (Won 2-1, Lost, Draw, Playing), the winner in bold, You on mine; standings as #, Player, Pts, W-L-D, OMW. Foot: Alert me when I'm paired (dimmed with a line saying why until a name is saved; Alerts on: tap to stop), Open the event page. Server away: nothing live shows. ?live=<id> opens the menu (an alert's link). The test event (?sim=1) plays pretend live data from live.js (never the server) so every live part can be tried; its foot sends a test alert instead.
- Menus: tray #pnav; #panel "Calendar settings" (Area .seg, Event types .pick, Stores .pick); #psub "Follow"; #plive "Live". Bar action: Follow (#subtab, the bell, data-fills psub). The bar's Settings (#tabset) is the one way into #panel; while its type or store rows hide events, the list head's count says so ("15 events, 4 hidden"), over the same days and area the list shows.
- Follow (#psub): an (i) in the head opens the note in place (.finfo). One sunken group (#fall), each feed row a webcal link to a file the refresh writes (ics.js: island.ics, victoria.ics, upisland.ics, store/<id>.ics): Whole Island, then Greater Victoria and Up Island as open rows (kind open, a chevron) that list their feeds under them, one area at a time: All stores, then each store A to Z, set in 16 more (.fsub). A row tapped on this phone shows a bone bell (.fmk) left of its count (vir.follow.v1); RAVI cannot see the phone's calendar, so the bell means tapped, not followed.
- NEW on a card means new since the last visit: badges stay while the page is open; leaving it (pagehide, or the page hidden) marks every listed event seen (vir.seen.v3).
Counter (counter/index.html)
- Fixed .stage with two sides (.side, data-role major, equal or minor), score numerals .num, .rail log, cut score buttons .acts, Pass turn .pass, round timer line .tmv, victory banner .win. Strip (.bar.strip.frost) of four controls; Go to has Hub (withHub true).
- The Match timer (M16): when the tagged event is live, a Round option ends the minutes track; it sets the timer to Riot's clock for the running round (start plus length) and follows the event into its next round; over a running timer it arms first, as the minutes do. The line under the track says which round and how long is left.
- Menus #pgame (Game settings), #pnew, #pleg, #pevt, #pend, #plog, #ppast with a stack (OPENP, STACK). Game settings and New match have no section labels and share #shared: the top group (.pcards.doors: Pause clock while the clock is on, Match timer, Event), then the player cards; Game settings adds Show on the field, and its foot holds Go to, then End game and New match side by side. The strip's Log opens #plog, titled Log. The legend picker (#pleg) holds its search (with Clear) on one row and the Release | A-Z track on the row under it. The Match timer, Show on the field and each player open in place (.pcard, .pchead), one at a time. End game (#pend) labels only Who concedes? and Time called: who won?; with no label between, Intentional draw is in the time-called group, 6 under its row (Mako 2026-10-16: Agreed went). Full-card viewer .spot (view kind, scrim .7).
Trade (trade/index.html)
- Sticky .plate (search .sf with Clear; on the row under it the .sides track with side colours and Undo .udb; results .res), ring .vd for the difference, side panels .sidep with .ln lines and steppers .stp (the minus is the bin at one copy), toast .toast.
- Bar: Hub, Go to, Saved trades (#psav, data-fills), Settings (#pset, data-fills). Menus #pnav, #pset, #psav, #phist, #ptrade, #prcp, #pundo (Undo).
- Trade settings (#pset): currency (no label), Price movement (Off, 7D, 30D, 1Y, All; Off hides the note and every movement mark; a stored 1D reads as 7D), Percent of market price with a small Reset (.rrs) at the label's end, then one row per side (.sidr, two equal columns): the name field (.nf.tall in the side's colour) and the percent in the cards' stepper (.stp), steps of 5 inside 0 to 200. Clear both sides is the menu's foot. Saved trades (#psav) carries no head count (its All saved trades row counts them); a saved trade (#ptrade) has its title field with no icon, and Receipt image is a foot button with no chevron.
Feedback (feedback/index.html)
- .lede, the form folded in one group under a Send feedback row (kind open; the Tally embed loads again when it opens), small print .fbn, "Recently shipped" list (.ship), footer. Bar action opens the form on its own page; Settings dimmed.
App settings (settings/index.html)
- .lede, then Your Riot name (#stme, M16; Mako 2026-10-27: the name is part of you, not each event): the name field (.nf, Name#TAG, Save), a note, Send a test alert (.pact). Saved on this phone (vir.me.v1); Reset leaves it. Then three glass cards (.sts) holding a .shead and a .pick: Hub blocks (a pick-many list of every page, App settings included; up to seven on, an eighth refused with a note under the count line), Open the app to (rows from RAVI_PAGES plus Hub) and Motion (Opening animation, a check row), then the support plate, then the footer credit. Reset in the bar's third slot, two taps, puts all three back; its fourth slot shows Soon, dimmed (Mako 2026-10-15).
Rules (rules/index.html)
- Reads data/rules.json (fetch-rules.js copies Riot's words; the page never rewrites them). .lede, a search field (.sf with a Clear .fbtn, dimmed while empty) in a sticky .plate, then Current documents (Riot's two PDFs as links with the out-arrow .extl; the two legality lists as deeper rows), Errata and FAQs and rulings (a .doors row per article, newest first, with its count).
- An article opens #part: Riot's warning first where it has one (.rnote), its entries grouped as Riot groups them (.lb), each a .door.rec of kind open with its body (.rbody, Riot's markup in .rtx) under it, then the source line (.rsrc). Pictures stay on Riot's page (a .rpic link). Search lists matching entries the same way, grouped by kind (Errata, then FAQs and rulings, each in its section's colour), names first, at most 40.
- Bar: Hub, Go to, the third slot dimmed (Soon) until it has a use, Settings dimmed. NEW on an entry, a document or an article's row means changed since the last visit (vir.rules.seen.v1, the newest 'changed' day; a first visit is the baseline), as the calendar's NEW: badges stay while the page is open, leaving it records the visit. Latest retired for it (Mako 2026-10-24). The footer ends with Tell us, as Calendar and Trade.
Collection (collection/index.html)
- Prices from data/prices.json; the bars from data/hist (hist.js, one file a month, rebuilt daily). A sticky plate as Decks': the binder pill (Collection, each binder, Wishlist), the search ('Search your collection', 'Search this binder'), the view row (Grid | List, Select, Sort). Then the value, the change line (the arrow on the percent only), the bars, 7D 30D 1Y All, a note; Movers; the cards. Bar: Hub, Go to, Add cards (the full-screen browser), Collection settings.
- The bars are one piece of glass in Rust inside a glass card, edge to edge, each step one smooth curve, a faint rim on top; one bar a day, a week a bar past 62 days. Market movement by default, Total value in settings. (Mako 2026-10-25)
- Movers: one glass row that opens in place into one block: Gains, a line, Losses, each titled with its arrow; no colour (the firm rule). Closed on every visit; Show Movers in settings. (Mako's yes 2026-10-25)
- Collection is the whole: every binder and the cards in no binder; the Wishlist never counts. A tap under Collection adds into no binder; minus only takes from what the view itself holds. Grid by default (the count pill at the picture's foot, the price of one, the total past one copy); List without glass.
- The browser: the same three-row plate (close and the binder pill, the search, Sets and Held here); Sets is a menu (each set with its day, held and worth; Organized Play promos; Other promos; sealed in its set); a tap on a picture adds one; minus (the bin at one) and plus on the picture.
- Collection: a tile and a List row word a total the same way, "$x for 3"; Edit binders is reached only from the binder pill's menu. (Mako's yes 2026-10-25)
Decks (decks/index.html)
- Owned (M13): its own block at the foot of the deck, under Notes, only when the Collection holds something; closed until its round chevron is tapped, as every folding section; inside, Any printing | This printing, the count by section, the missing cards, and Add missing cards to (a menu as Collection's Move menu: No binder, each binder, the Wishlist). No warning when cards are missing. (Mako 2026-10-25)
- Two screens: the list of decks, and one deck: a sticky .plate (Back, name and price, Undo; Deck, Stats, Hand), Legend beside Runes, Battlefields, then Main, Side and Considering, each with its own view and sort, and Notes. Edit (the bar's third slot, a mode) adds steppers and add tiles; the card browser is full screen; the card menu (#pcard) opens from a card. Logic and formats in decks/deck.js.
- On Decks, the view (List, Grid, Text), the size and the sort sit in one row in the plate. A section's gear overrides them for that section. (Mako's yes 2026-10-24)
- On a card's picture, the count is one pill centred at its foot; Edit adds minus (a bin at one copy) and plus beside it, and the pill does not move. A row keeps the stepper (Trade's lines, Decks' List). (Mako's yes 2026-10-24)
- A card picture carries at most two badges, centred low, in capitals: BANNED and PROMO. (Mako's yes 2026-10-24)
- Undo sits in the plate: on Decks at the right of the head, on Trade at the end of the Yours | Theirs row. It opens a list of changes, newest first, in short words ('+1 Gust'). A row undoes only that change. (Mako's yes 2026-10-24)
- Stats are tiles. A tapped tile opens in place to the full row with its chart, and Open all and Close all sit above them. (Mako's yes 2026-10-24)
- A change updates the page in place; pictures that stay are never rebuilt (paint() in decks/index.html). (Mako's yes 2026-10-24)

Top cut (cut/index.html; M15, 2026-10-27)
- The maths is cut/cut.js (shared with the tests): Swiss pairing modelled top down by points, a win 3, a draw 1, a bye a win; every finish still open, best first, each with Worst case (the other tables' last two rounds fall the worst way for you) and Likely (the player ahead wins); a tie on points reads Tiebreakers. Verdicts carry a word and a mark (In with a tick, Tiebreakers with =, Out with x); the tint only helps.
- Three glass cards (.csec): The event (the Event row opening #pev, Players and Swiss rounds steppers, the Top cut track None to Top 16, a note), Your record (Wins, Losses, Draws steppers; After round N of R), Your finishes (head row, rows, rows below the first two outs folded into one line). Steppers are .circ buttons either side of the value; nothing is typed.
- Live (M16): on the event's day, RAVI's server fills the players still in, the store's Swiss rounds and, with a Riot name saved, the record so far, each note saying it is from the event page; the cut stays the usual one. Server away: as below. On the day the live file's structure also sets the cut, as below (M17 block 4).
- An event (the menu, or ?ev=<id> from the calendar card's .evcut and the Game page's Top cut row) fills the players (its registrations on its day, its spots before), the rounds and cut, and the record from Game matches tagged to it. Rounds and cut (M17 block 4, Mako's yes 2026-10-30): the store's Swiss rounds from the event's page (data/events.json swiss); the cut from its page (cut): Swiss only opens on None, a cut on the usual size for the players (Riot gives its size only on the day); a Summoner Skirmish opens on Top 8 from 9 players (None under) whatever the page says, as stores list Skirmishes as Swiss and add the cut; nothing known, the usual rounds and cut. The note says what came from the event page ('From the event page: 4 Swiss rounds and no top cut.'); a hand-set track or stepper wins and drops the claim. The Event row names the event as the Game page's Event row does (kind, then the store's short name); its label stays whole, the value is trimmed only if needed, the chevron always shows. The Event menu ends with No event, and the Event row says No event when none is picked, as the Game page. Bar: Hub, Go to, How it's worked out (#phow, the info icon, data-fills: Worst case, Likely, Tiebreakers, a guide; no standing note under Your finishes, only 'Every finish below these is out.'), Settings dimmed. (M17 sweep, Mako's yes 2026-10-30)

Tier list (tier/index.html; M17, 2026-10-28)
- The maths is tier/tier.js (shared with the fetcher and the tests); the data is data/tier.json, written daily by fetch-tier.js from TopDeck.gg: each event's date, size, cut and placings with Riot's legend names only, never a player. TopDeck is credited in the footer.
- Five rows always, S, A, B, C, Rogue, each named in words; an empty tier keeps its row, says No legend here right now and dims its block. Each row is a shelf of whole legend cards, never cropped, scrolling sideways card by card with a fade at an edge that has more. The letter block (letter and count) opens the whole tier, best conversion first; a card opens its legend (the card, its tier, one sentence, Played, Top cut, Conversion), one deeper from a tier's menu. Search above the board. No second view of the board. (Mako's yes 2026-10-29)
- Global | Local (Mako 2026-10-29): a track under the search, remembered. Local is the viewer's Events area; its decks are added by players on the honour system: the legend most picks name stands, a tie says Contested and is left out. Counts only (whole cards, 'n decks', most played first) until 100 decks, then the same five shelves.
- Add decks: a full-width button under Local's line. Each menu goes one deeper: finished events from the last 14 days, an event's final standings (placing, Riot name, record, legend), a legend picker (search, whole cards, your pick ringed in bone, Take back my pick). A Riot name is written as the Live menu writes it (the tag 12 muted, You 12 bone on mine) and a record as wins-losses-draws, all three (3-0-0). (M17 sweep, Mako's yes 2026-10-30)
- Bar: Hub, Go to, How it's counted (#phow, the info icon, data-fills), Settings dimmed.

## 11. Checks

- check.js: runs icons-test, drawn-test, m5c, m5d, m5e, m5f, m5g, m5b, m5, m4, m3, audit, m2, m6, m7, m8, m9, m9k, m9l, m9m, m9n, m9p, m95, m95c, m96, m96f, m96c, m96t, m96s, m96w, colour-test, m11, m11d, m11p (34; check.js itself is the count). Run it once before every commit; node check.js <file> while working. Warns if ports 8900 to 8999 are in use.
- drawn-test.js: with every menu open on all seven pages at 390x844, checks corners [D], type by height [D], and sideways overflow [D].
- audit.js: over every page, state and width (375, 390, 430); Chromium from check.js, node audit.js --engine both adds WebKit. A sizes, B alignment, C bare px sizes, D control kinds, E layout safety, plus a scan that pages do not reshape Kit parts. [A]
- m2-test.js: pages load cleanly (T1), links and manifest resolve (T8), the Riot notice on the hub only (T9), theme colour (T18).
- m3-test.js: events carry round and store; calendar card buttons, store filter, remembered filters; counter event tag, past-match filter, round timer.
- m4-test.js: counter time called and agreed draw, end events, the log.
- m5-test.js: Go to tiles, hub notice, calendar subscribe, trade rows as deeper and do kinds.
- m5b-test.js: counter Game settings shape (no section labels, three groups, the foot), End game, the Match timer in place, player cards, Show on the field as check rows, New match, Past matches.
- m5c-test.js: counter End game labels, short confirm text, the Match timer's Start and Stop on one line, Pass turn name.
- m5d-test.js: a match is logged the moment it is decided; New match keeps the timer.
- m5e-test.js: Time called between games; the counter's hidden ?ev= link opens New match with the event picked.
- m5f-test.js: a saved trade's title can change; nothing else on it does.
- m5g-test.js: a bar slot stays on while its menu or a deeper one is open; menu edges (a fade, no line).
- m6-test.js: counter sides update in place; trade lists rewrite only when their markup changes.
- m7-test.js: App settings page and its rows, reset, Go to without Hub where the bar has it, the calendar gear fills.
- m8-test.js: the install screen on all seven pages in a browser tab, never installed; iPhone steps, Android Install, computer; Continue for the tab only; the intro waits; ?sim= and test tools skip it; fit at 402 and 360, type on the rungs (40 for the name), the Continue line clear of Safari's bar. Every other suite runs past the screen (navigator.webdriver).
- m9-test.js: the counter takes event ids as text (Event menu, ?ev= link, past-matches filter).
- m9k-test.js: the rules watcher against Riot's saved pages: counts, word for word, RAVI's name on every request, no change leaves the file alone, a missing or halved page fails the run.
- m9l-test.js: the Rules page (documents, articles newest first, an entry opening in place, Riot's warning, search, What's new deeper), its hub block, Go to in one row of five and two rows past five.
- m95-test.js: the counter's menus after M9.5: a timer set in New match survives Start match, Best of 3 by default, the Match timer in place, the top group, End game and New match the same size and evenly placed, every row's chevron at the right.
- m95c-test.js: the calendar's event card after M9.5: no Play here, the address and its end, three round buttons in one row at the card's padding at 402 and 360, the in-card line, the one-event calendar files (ics.js, written on every refresh, unchanged files left alone), and PlayRiftbound links in the area feeds.
- m96f-test.js: the Follow feeds: one per store (never removed) and Up Island; notes say spots left, feeds say when they were checked.
- m96c-test.js: the calendar's Follow menu (one sunken group, areas in place with their rows set in, links to files that exist, the bell remembered) and NEW since the last visit.
- m96t-test.js: Trade settings after M9.6 (no Names, Currency or This trade label; Off; side rows half and half; steps of 5; Reset) and the counter strip (icons 24, the Layout track 6 from its top and bottom).
- m96-test.js: the bar system: no page draws its own bar, RAVI_BAR fills it, the icon table holds every bar icon, every page keeps its four slots in order, every slot is an exact copy of its table entry, mask ids unique.
- m96s-test.js: the motion sweep: the form, a month change and a day tap ease in; pick-one tracks slide their fill; numbers a tap changes settle; the trade's Undo turns on in place and Yours/Theirs eases in; the counter's Focus and Split.
- m96w-test.js: the consistency sweep: Calendar settings has one way in and hidden events show in words; one confirm wording; every search clears with Clear; menu small print is one style; dates and times are written one way; no pencil, no head count and no foot chevron in Trade's saved trades; Log is titled Log; the footers.
- colour-test.js: the colour system: each page's glass takes its colour at .30, a glass group carries the tint once, the counter's side buttons keep no page colour, grey text on tinted glass is lifted, the bar's pill wears the page colour.
- icons-test.js: the icon table read as data: every name an svg, no placeholder left, ids unique within a copy and across copies, every url() inside its copy, outline lines inherit the svg's line.
- m11d-test.js: the deck logic (Piltover Archive's golden codes, six formats in, three out, Riot's deck rules in words, the ban list, stats, the hand).
- m11p-test.js: the Decks page's flow in a browser.
- m13-test.js: the price history (data/hist). m13p-test.js to m13w-test.js: the Collection page and Mako's five rounds, and Owned and Missing on Decks.
- m11zd-test.js to m11zh-test.js: the M11 consistency sweep and Mako's phone checks (Rules by section and NEW in place of Latest, clear chrome; Export in Deck settings as a cut track, round X, hub wordmark 48; Trade's undo as Decks', the bin at one copy, one Export, bare counts, search words, Rules' sticky search, Printing).
- m11r-test.js to m11zc-test.js: the Decks refinement, one per round of Mako's notes (2026-10-18 to 23): the list plate, view row and section menus, printings from the price feed, Stats tiles, odds, Undo, runes at 12, badges, battlefields, counts, deck colours, the safe zone on every sticky plate, the Add cards plate, and changes painted in place.
- m15-test.js: the hub picks: seven picks then All pages, bad saved values never break the hub, the All pages tray with every page, App settings' Hub blocks card and Reset; the New here page; Top cut (cut/cut.js's maths, the page, the calendar's button, the Game page's row).
- m16-test.js: the live event server (server/live): the parser on Riot's pages from a live and a finished event, hostile input rebuilt, one upstream read per event per 15 seconds, the request surface. m16b-test.js: live.js and live data on the Events page (the card line, the Live menu). m16c-test.js: the Game page's Round timer and Top cut's prefill. m16d-test.js: pairing alerts (the push code, the alerts store, the routes, the alerts-only worker, the button).
- m17-test.js: the Tier list: tier/tier.js's maths, the page (five rows, shelves, search, the tier and legend menus), fetch-tier.js on TopDeck's real reply (names removed).
- m17c-test.js: the M17 sweep: footers ending with Tell us (New here, Top cut, Tier list), New here's page list and match timer, the Tier list's names and records as the Live menu, Top cut's No event and How it's worked out.
- m17d-test.js: M17 block 4: the events fetcher's once-per-event read of each event's Swiss rounds and cut (two captured pages), Top cut's rounds and cut from the event (Swiss only, a cut, a Skirmish's Top 8, hand-set values winning, the live file's structure), the Event row as the Game page's.
- bar-sheet.js (not in check.js): every bar in every state at 402 into one picture; --compare checks two runs pixel for pixel.
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

- A line that records a build Mako signed off on the phone goes in without a separate yes, once checked against the code as shipped and the latest decisions in the records (MAP, the milestone's handoff, LOG); its commit names the build and his sign-off. A rule beyond what was built still needs his yes. Either way it is its own commit, never inside a fix. (Mako 2026-10-29)
- Mako's eye on the phone outranks any value here. Anything he names becomes a rule with a check.
- If the code and this file disagree, one of them is a bug. Report it; do not pick.
- To break a default on purpose, say so in one line in the commit message.
- ASCII only, this file included. Under 500 lines.
