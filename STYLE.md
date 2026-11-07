# RAVI - the design rulebook

The one place the app's design rules live. One rule per line, each with its value. Every value, class and size below comes from app.css, pages.js or a page's own file.

MARKS: [D] drawn-test.js checks it. [A] audit.js checks it. [C] a check could catch it and none does yet (section 11). [T] a named test in rb-tools covers it. No mark: judged by eye on the phone.

## 0. How to use this file

- This file is the core: read it in full before any change Mako will see, then the notes of each page the change touches (style/<page>.md, listed in section 10). Both are short on purpose; never build a page part from memory or from scratch.
- Build from the Kit (section 5): name the Kit parts a change uses before writing it. A part the Kit lacks is built from Kit tokens (section 2) and surfaces (section 3), and its class goes into that page's notes under Page-local classes in the same commit. rb-tools style-lint fails a push that skips this, types a colour or size where a token or palette entry exists, puts type off the rungs, or drops a page's guard scripts.
- FIRM means breaking it would look wrong or break the app. Section 1 is all firm. Anything marked firm elsewhere is firm.
- Everything else is a default: follow it unless the page truly needs otherwise, and say so in one line in the commit.
- Pages place Kit parts (section 5); they never reshape them. Layout around a part is the page's own.

## 1. Firm rules

- Colour never carries meaning alone. Shape or words carry it too. (Mako is colourblind.)
- Dim means disabled: opacity .4, pointer-events none, and it holds its place. Never hide a control that moves its neighbours. [A]
- Price direction is an arrow, never a colour. Up and down look the same apart from the arrow.
- Store neutrality: no store's numbers, defaults or tilt anywhere in the UI.
- Target: current iOS Safari, run as an installed app. Existing fallbacks stay. color-mix() and :has() are allowed in new work.
- A browser tab shows only the install screen (section 5), on every page. Nothing else changes for it.
- Frosted surfaces declare a solid fallback inside @supports (backdrop-filter): blur on, the same colour at about .94 alpha off.
- Text inputs are a real 16px. No scale or zoom tricks to make them look smaller.
- A list that scrolls inside a plate or a menu clips 10px or more below the control above it. The gap is a margin outside the scroller, never padding inside it, so a card or row never touches the buttons as it scrolls under them (Decks' Edit search, Trade's results; a menu's .phead gives its 10). (Mako 2026-11-02)
- Hold to highlight is off app-wide (app.css, html). It is on only for typed fields and .sel text: an address, a Riot ID, a deck's export text, a recovery code, rules text. No tap-to-zoom anywhere: every page carries the double-tap guard. No page pinch-zoom either: pages.js cancels iOS's gesture events and a two-finger touchmove everywhere, except inside [data-pinch] (the Picture placer); iPhone's own Zoom still works. rb-tools p2m3b and p2m5 sweep every page. (Mako's phone yes 2026-11-02, pinch 2026-11-03)
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
- --sz-track 40: a sunken track, search and name fields; every control in a sticky plate
- --sz-sm 36: round buttons and compact pills
- --sz-seg 34: a segment inside a track, swatches
- --sz-seg-tall 38: a segment in a tall track (.seg.tall): the counter strip's Layout track, and a track stacked with row-height parts in a menu
- --sz-score 48, --sz-score-min 38, --sz-seam 50: counter only
- --r-cut 6, --gap-cut 3: the cut track
Other
- --ease cubic-bezier(.22,.72,.2,1)
- --top-clear safe-area top inset + 28: nothing sharp and unfrosted sits above it [C]
- No control height is a bare number; each reads a named size above. A page may add a token only in its own :root and only for its own part (counter: --over-deep, --mo-rise, --mo-travel, --mo-pulse, --mo-ease; trade and Trade board: --yc, --tc; trade: --ycr, --tcr). [A]

## 3. Surfaces and kinds

Surfaces
- Glass (.glass): means press. Body --glass, a 1px rim lit at the top fading down the sides, --glass-base inside. No full outline on any button. Used for buttons, cards, event cards, the page head. [D]
- Glass pressed: --glass-press.
- One layer of glass (plan 2 M8, after Apple's Liquid Glass guidance; Mako's yes 2026-11-04): glass is for what floats: the bar, menus, the sticky plates, cards and buttons on the page, the hub's blocks. A glass part inside a glass surface, a menu or a plate is flat: --flat (white .08), no rim light, no base glow, the same shape, size and press shade (app.css ONE LAYER OF GLASS). A coloured surface inside one keeps its colour, flat. [T]
- Sunken (--recess): means choose or type. Tracks (.seg, .goto), groups (.pick), fields (.nf, .sf). Chosen option: bone fill, ink text. A track whose options own a colour (trade .sides) fills the chosen one in that colour, with ink text.
- Chosen picture or colour: a bone ring, inset 0 0 0 2px bone then 2px ground (.seg.swatch).
- Frost (.frost): chrome that blurs what passes behind it. Fallback --frost-solid; with blur, --frost, blur 20 saturate 160% on the bar and strip, blur 24 saturate 160% on menus, 1px rim --frost-rim.
- Plate frost: the trade control plate (.plate), the Decks plate (.plate), the Rules search plate (.plate), the Trade board plate (.plate), Collection's plate and select plate (.selp) and Settings' search plate are page-local sticky surfaces in one dark grey (Mako's pick 2026-11-06, so the sunken tracks and searches read on it; the page colours were tried and clashed with colours that mean something on the page): app.css --plate-glass rgba(42,44,48,.62), blur 18 saturate 180%; fallback --plate-solid rgba(42,44,48,.94); shadow --glass-base then 0 8px 24px rgba(0,0,0,.45); corner 24. A deck's plate and its card browser carry the deck's two colours (.plate.cg2) instead. The calendar's month card (.card) keeps the old plate: fallback rgba(10,11,13,.94); with blur rgba(10,11,13,.5), blur 18 saturate 180%; the same shadow and corner.
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
- play: the counter's field. grid: the calendar's day cells. view: the full-card viewer (counter, Decks). card: a card's picture or row on the Decks page, a holding's tile or row on the Collection page, a legend's card on the Tier list (its shelf or its tier's menu), and a card on the Trade board (a shelf, a Players preview, All cards, a player's menu); a tap opens it, or adds it in a card browser. Nowhere else. (Collection: Mako's yes 2026-10-25; Tier list: 2026-10-29; Trade board: 2026-11-01)
- Text you only read carries no data-k and is not tappable.
- Every control that opens a menu carries data-fills="<menu id>" and fills (shows its .icf drawing) while that menu or a deeper one is open. [T]
- Pressed: a glass or sunken-group row takes the shade only; a free-standing button also scales to .96 (button:active). A large tappable surface (hub block, event card head) scales to .97 with brightness 1.2.

## 4. Type, sizes, corners, spacing, colour

Type
- Two faces. Poppins (--disp) for display and every tappable label. Nunito (--text) for text and data.
- Poppins ships 600, 700, 800 only. Any other Poppins weight is synthesised and wrong. [C]
- Five rungs: 12, 13, 15, 17, 20. Whole pixels only. [C]
- Words: as few plain words as do the job. A label names the thing or the action; no sentence under it repeats the label. A note only when the control cannot say it: one short sentence on what happens, at most one per menu. Never how the app works inside, and never directions to another control: a way somewhere is a row or button that goes there. No please, no exclamation marks. Explanations live in New here. (Mako's yes 2026-11-03, refined 2026-11-04, M7 S2)
- Hold is the scoring word only (holding a battlefield). A long press is press; having cards is own or have; a Riot ID is claimed. (Mako's yes 2026-11-04, M7 S1)
- Page title and menu title 20, Poppins 700 (.ttl). Section head 17, Poppins 700 (.shead h2). Sentence case.
- Buttons and tappable labels: Poppins 600. Body: Nunito 400 at 15, line-height 1.4. Passive metadata: 12, muted.
- The grey value in a row: Nunito 600, 12, muted (small in .door and .pick).
- Numerals: Poppins 800 for scores and money (counter, trade). Calendar day numbers (.cell .d): Poppins 15 at 600, 700 when selected.
- Tabular figures on body, inherited by every number.
- Type follows height: a 44px control carries 15; a 34, 36 or 38px control carries 13; a sticky plate's 40px actions and row-pills carry 13, as its track does. Text inputs, play and grid are exempt. [D]
- Parts that sit together share one height (plan 2 M8 block 7, Mako's yes 2026-11-06): in a sticky plate every control is --sz-track 40 (fields, tracks, .pact, a lone .doors row-pill, chips, a round button sharing a row with a field: .circ.trk); in a menu, parts stacked together are --sz-row 44 (a field over a full-width action is .nf.tall; a track over one is .seg.tall). A title row with round buttons over a track, cards and tiles, and steppers in their own pill are different kinds and keep their sizes. [A]
- Named exemptions, nothing else: 16 text inputs; 16 counter score words at .06em; the counter numerals (column formula in .num, 40 on the slim banner); 26 trade ring amount; 34 Poppins 800 on the Collection's value (.cval .v; Mako's yes 2026-10-25). Go to tile labels are 12 with letter-spacing -.08em. The wordmark is a drawing (the badge, section 5), not type, so no rung binds it.
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
- Players (plan 2 M8, Mako's phone yes 2026-11-04): the eight player colours (pages.js RAVI_PLAYER_COLOURS: Blue, Pink, Gold, Tangerine, Lime, Mint, Orchid, White) are the counter's swatches and the choices for Your colour on Profile. Yours, side 1 and P1 are your colour (blue with none); Theirs and side 2 are pink, or blue when yours is pink (RAVI_SIDES): the counter, the Trade page and an offer's verdict. A counter pick holds while your Profile colour stays the one it was made against. A player's picture (yours in the corner and on Profile, every player's on the Trade board) wears their colour as its 1 wide rim (.accol), their Trade board card and menu head are coloured glass in it, and their name always says who it is. [T]
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
- Card keywords (plan 2 M8, Mako's yes 2026-11-04): where the app's own words name a keyword, it is drawn as the cards print it, a slanted tag with the word in capitals (New here .nkw), in Riot's printed colours, a named exception to the palette: teal 14,116,94 (Accelerate, Action, Reaction), crimson 204,44,104 (Tank, Assault), lime 146,176,44 with ink text (Ganking). A new keyword's colour is sampled from its card. Riot's quoted words keep their text. [T]
- The counter's domain runes are coloured glass (Mako 2026-10-16): Riot's rune file untouched, its white glyph over a disc of the domain colour at .90 with a lit top edge, a light rim and a soft shade at the foot. A named exception to the one-glass .30 rule.
- Coloured glass (Mako 2026-10-15): a coloured surface carries its colour at --cg (.30) inside the glass, with the usual rim and base glow, frosted (blur 20, saturate 160%), and no solid base. One recipe (.cg, colour as --c) for hub blocks, event cards, trade side cards, Rules sections and a coloured page's glass. Fallback without blur: the same colour over --frost-solid. Plain glass inside glass is not frosted again.
- See-through chrome stays clear unless it shows what it is about. Chrome is what moves you around or sets things: the bar, the strip, Go to, a page's settings menus, and the sticky plates (the calendar month card, the trade, Decks, Rules and Trade board plates). A plate may wear its subject's colours (the open deck's two domains, on a 145-degree band 30 wide, at .32; the deck blocks at .44). A menu that shows a page's own content (a Rules article) is content, coloured as the page codes it. The bar's you-are-here pill wears the page colour. (Mako's yes 2026-10-24)
- Page colours (Crown, Mako 2026-10-14; refined in plan 2 M8, Mako's phone yes 2026-11-04): Events 255,200,40; Game 200,35,70; Trade 115,80,240; Trade board 255,150,40 (Tangerine); Feedback 134,143,162 (Slate, a dull colour; Cobalt 40,95,240 sat on Trade); Rules 0,190,140; Settings 205,220,240; Decks 80,230,170 (Mint); Collection 220,90,30 (Rust; Mako's yes 2026-10-25); New here 30,205,230 (Sky; M15, brightened in plan 2 M8 off the players' blue); Top cut 170,210,60 (Lime; M15, 2026-10-27); Tier list 215,90,230 (Orchid; M17, 2026-10-28). Every page colour stands .10 or more (OKLab) from every other and from the players' blue and pink [T]. Feedback, Rules, New here and Settings colour their glass (glass:true in RAVI_PAGES); Events, Game, Trade, Decks, Collection, Top cut, Tier list and Trade board keep clear glass; Collection's bars and bar pill wear Rust.
- Rules colours by section, never by the page: Current documents jade 0,190,140, Errata garnet 200,35,70, FAQs and rulings gold 255,200,40, wherever an entry shows (the page, search results, an opened article). A new section takes its own palette colour. Always beside the words that name it. (Mako's yes 2026-10-24)
- The palette is the twelve page colours above, White 240,240,245 (colourless cards) and the players' blue and pink; a new colour use picks from it first, and a new page brings its own colour (Mako's yes needed). Cobalt 40,95,240 left the palette in plan 2 M8.
- A card with no domain (colourless) uses the palette's White, 240,240,245, so White is no longer spare. (Mako's yes 2026-10-24)
- Function before colour: no page colour where colour already means something (the counter, the players, the alarm, low spots).
- On a page colour, grey text inside glass is #DCDEE2, not --muted.
- A card picture's ground before it loads is --recess, on every card page (Decks, Collection, the counter's .lgathumb and .lgppic; Mako's phone yes 2026-11-04, M7 D2).

## 5. The Kit (shared parts)

Rule for every entry: a page may not set height, min-height, padding, border-radius or width on .door, .pact, .seg, .nf, .sf, .goto, .rec, .btn or .circ. [A]

Page-local classes live in each page's notes (style/<page>.md, section 10), not here. They are not Kit parts.

Page shell (feedback/index.html, settings/index.html)
- Head: charset, viewport (width=device-width, initial-scale=1, viewport-fit=cover), theme-color #08090A, apple-mobile-web-app-capable yes, status-bar-style black-translucent, apple-mobile-web-app-title RAVI, manifest ../manifest.webmanifest, apple-touch-icon ../icons/apple-touch-icon.png, title "<Page> - RAVI", then fonts.css, app.css, pages.js, account.js (every page with the wordmark row, and the hub), the page's own style block (in that order).
- Page style block starts: html{background:var(--ground)}, a{color:inherit;text-decoration:none}, body{-webkit-font-smoothing:antialiased;touch-action:manipulation}.
- The badge (.rb; app.css THE BADGE; Mako's pick J, 2026-10-31): the RAVI wordmark. RAVI in Righteous outlines (OFL; p, n and a softened in the intro), RA --p1, VI --p2, tracking .02 em, at .8 of the pill's inner box; a pill of clear frosted glass (.rbg: white .025, blur 3, saturate 160%, the app's rim light, the glass base and drop shadow); a blue-to-pink rim inside it (inset 9% top and bottom, 4% left and right, 2.5 px, the 135deg gradient #5DA5EE to .35 at the middle to #EE5F9C). 2.4783 wide per tall; height --rbh: 36 on the wordmark row, 88 on the hub, 72 on the install screen. One inline SVG holds the rim and the letters; the name is .sr text for screen readers. Written into every page by rb-tools design/wordmark/badge.py, never by hand. No font file. Plain RAVI everywhere else.
- Wordmark row (.wmrow, .wm): chrome, one thin row, scrolls away. Padding safe-area top + 25 / 18 / 16 / 18, so the 36 badge's middle is level with your picture's. Its markup comes from badge.py:
    <div class="wmrow"><h1 class="wm"><span class="rb">...</span><span class="sr">RAVI</span></h1></div>
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
- .pact.btn.glass: a centred full-width action (44 high, Poppins 600 15; in a sticky plate 40 and 13). Stands alone or sits in a menu foot. Never in a stack of rows.
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
- .btn.glass: round glass pill, shade --glass-press on press. .circ: 36 round, icon 18. Use .circ.btn.glass for round icon buttons (close X, back, gear, chevron toggle). .circ.trk: 40 round, for a round button sharing a row with a field or a pill (a card browser's Close).
    <button type="button" class="circ btn glass" aria-label="Close" data-k="do"><svg ...></svg></button>
- .hemi (calendar-local, with .hl and .hr): two halves of one pill, 36 square each, outer curve half of 36, 5 at the join, 4 overlap. Copy from calendar/index.html if a page needs a pair.

The account picture and its menus (account.js, app.css; plan 2 M1, Mako 2026-10-30)
- Every page with the wordmark row, and the hub, carries your picture (.acpic, glass, 36 round) in the row's top right corner, 18 in, level with the badge; it scrolls away with the row. None on the Game page. It shows a legend's art or your photo filling the circle (class acart, never art: the card pages style .art as card art; Mako 2026-11-01); with neither, a filled person (every phone has an account, so there is no signed-out outline; plan 2 M1, 2026-10-31).
- Its menus (.panel.acct) are built by account.js, never by a page; their heads keep 68 on the right for the picture. The root shows your name and @username; Profile shows the picture at 88. Saving keeps you in the menu you saved from (Mako 2026-10-30).
- Picture opens on a 176 circle you drag to move the picture and pinch to zoom, the gesture read across the menu's whole width around it (#acstage, data-pinch; Mako's phone yes 2026-11-03) (a card keeps its placing; a photo is placed, then cut to 256 square); under it a Printing track for the chosen card (a legend's own art, then its overnumbered printing; any other card, each of its printings; never a signature); then Upload a photo, then Or pick a card: a search (Search every card, the round X) over every card in cards/pics.js; with no search, one circle per legend, four across; with one, each matching printing as a circle with its name under it (12, muted), names that start with the search first, 40 at most with a count. A landscape battlefield is placed to fill the circle. A pick shows in the corner at once, is ringed in the grid, and is kept by Use this picture. (Mako's yes 2026-10-31; any card, signed off 2026-11-02)
- A button that saves says so in its own words for a moment: Saved, Claimed. (Mako 2026-10-31)
- Profile holds Your colour, a .seg.swatch of the eight player colours kept by Save, previewed on Profile's picture before Save (plan 2 M8, Mako's phone yes 2026-11-04).
- Profile holds the Riot ID, one account per Riot ID, in two fields as Riot shows it, the name and the #tag (.rid), with Claim or Remove Riot ID as a full-width action under them (not Release; Mako 2026-10-31); the root menu's second line reads @username and the Riot ID. An account in ADMIN also has Disputes, whose two actions are Give it to @user and Keep it where it is. (Mako's yes 2026-10-31)
- The root menu (Mako's sign-off 2026-10-31; regrouped in M7, his phone yes 2026-11-04): an account never saved shows Save your account first, a note that only this phone reaches it, then Profile and Your data, then Sign in to another account; a saved one shows Profile, Link a new device, Sign-in and security (Passkeys, Devices, Recovery code, as Apple Account's Sign-In and Security), Your data (and Disputes, Reports), then Sign out alone. Sign in to another account opens Use a passkey and Another phone, then Recovery code under the label Lost all your devices?
- Wherever a page needs a saved account it shows a Save your account row (RAVI_SAVEROW in account.js), which opens the account menu; never directions such as 'tap your picture'. RAVI_ACCT_OPEN(menu) opens it at a deeper menu (the Riot ID's one home, Profile). (Mako's phone yes 2026-11-04, M7 C2 and C3)
- Linking a phone (plan 2 M6; Mako's phone yes 2026-11-03): Another phone shows a six-letter code in two threes (.accode at 20) over its QR, dark on a white 176 plate (.aclkqr, corner 12, the code alone in it), one centred line on what to do, and how long it lasts; a code that runs out dims both and wakes New code in the foot. Link a new device is a field (Code on the new phone) with Scan as its .fbtn; Scan opens the camera in a 240 square (.aclkcam, corner 22) under the field and closes it once read; the note names the waiting phone; the foot's action reads Link this iPhone (or the phone's name) and stays dim until a code is found.
- Lists inside the account menus are rows: a passkey by its name with its last-used day (it opens a Passkey menu: Name, Remove this passkey, dim while it is the only one); another device by its name with its last-used day, a two-tap row that signs it out, and Sign out every other device under them once there are two. Days are the phone's own, never the server's UTC day. Download your data hands the file to the phone's share sheet where there is one.
- The first-time setup (plan 2 M6; Mako's phone sign-off 2026-11-03) is in these menus, opening from your picture: once, on the installed app's first hub as the intro ends (never behind the install screen or for a test tool; vir.setup.v1), and again from New here's Set up RAVI. Four steps, each head counting it (.cnt, 1 of 4): Your account (Save your account, then the recovery code shown once), Riot ID (Claim), Alerts (Trade offers), Your hub (Hub layout); then All set, with a row to New here. Each foot reads Not now until its step is done, then Next; Back returns a step; closing it counts as done.

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
- The strip's Layout track is a tall track (.seg.tall): its options are --sz-seg-tall (38), so the track is 44 like the strip's slots and sits 6 from the strip's top and bottom. A named exception to the Kit rule. [T] (Mako's yes 2026-10-16)
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
- Each tile's icon wears its page colour lifted .30 toward white (--gi, set by RAVI_GOTO); the chosen tile, the counter's Hub tile and every label keep their own colour. The icon's shape still names the page. [T] (Mako's phone yes 2026-11-04, plan 2 M8)
- Fill it with RAVI_GOTO(container, hereId, rel, withHub, withSettings). rel is "../" from a page folder. Pass withHub true only where the page has no Hub slot (the counter). Settings is never a tile, except in the hub's All pages tray (withSettings true), which lists every page.
    window.RAVI_GOTO(document.getElementById("pnavgoto"), "feedback", "../");
    document.getElementById("pnhere").addEventListener("click", function(){ set(false); });
- RAVI_GOTO lists Hub (if withHub), then every RAVI_PAGES entry with a path, in order. A new page appears with no other edit.

Confirm and motion helpers
- Two-tap confirm: first tap adds .armed (and shows the one-line prompt); a second tap within 3000 ms acts; the timer or a cancel removes .armed. Toggle the class; never rewrite className. The armed look is page-local (settings .tab.armed and .starm, counter .pact.armed, .sidebtn.armed) and uses --glass-press, or the side colour at .50 for a side control.
- The armed button's words become "Sure? Tap again"; "Sure?" alone only where that does not fit on one line (the counter's three-across row, Decks' This deck row, the timer's buttons). No standing note explains the second tap. (Mako's yes 2026-10-16)
- An icon slot that resets or clears opens a small menu from the slot: its title, one line on what it puts back, and the action as a full-width button, which takes the two-tap confirm (Sure? Tap again). (Mako 2026-11-03; it replaces the prompt line on the page)
- Flashes: .flash-n (bone, neutral) and .flash-p (--pc, the player colour), .42s. Apply after the render: find the fresh node, remove the class, force reflow, add it.
- .reveal: content a tap opens eases in (.26s, up 6 and fade). Add it after the tap; never on a render.
- [hidden] always wins (display none).

Icons (pages.js RAVI_ICON)
- 24 grid, 2-unit round lines, one corner size. RAVI_ICON(name) returns the svg for the page icons (hub, events, game, trade, feedback, rules, decks, collection, start, cut, soon, settings, allpages), the bar icons (gear, bell, saved, out, whatsnew, reset, undo, log, edit, add) and the info icon.
- M13 icon pass (Mako 2026-10-26): Collection is a safe on feet (hinges on the left wall, the dial with its centre marked, the bolt running to the wall, filled or not), after Phosphor's vault on the app's line; Collection's Add was a card with a plus (two cards from M8 round 3, below); Decks' page icon is its fanned cards turned so they fan up like a hand. Decks' warning mark is a solid triangle with its mark cut out (Material Symbols warning, filled), red (--over), always beside its words.
- Each icon has an outline group (.ico) and a filled group (.icf); the filled one shows when its parent has .on. The hub drawing and the strip's two are one drawing in every state.
- Gaps in a filled icon are real holes cut by a mask, so every mask id on a page is unique. RAVI_ICON numbers its own (rvm1, rvm2, ...). Static markup names its own: rvs-<page>-<what>, e.g. rvs-fb-set.
- Every icon a page or a bar draws is one entry in the SVG table; RAVI_BAR and RAVI_GOTO take it by name. A new icon is added there first, never drawn into a page's bar.
- One line for every icon: 2-unit round lines on the 24 grid (1.5 on the hub). Shapes may be adapted from Lucide, Phosphor, Remix or Material Symbols and redrawn on this line; a family drawing kept as drawn uses the weight that matches (Material Symbols 600 in the bar, 400 on the hub as an .icb copy). (Mako 2026-10-16)
- Hub icons are drawn solid in their tint and faded to .82 as one piece (opacity on the svg), never in a see-through colour, which stacks where two lines meet. (Mako 2026-10-16)
- An icon may hold two masks: "@" for the filled drawing, "@b" for an outline cut; RAVI_ICON numbers both per copy.
- M8 page icons (Mako's rounds 1 and 2, 2026-11-05): Tier list is Phosphor's chart-bar-horizontal, Trade board Phosphor's users-three, All pages Phosphor's stack, each as drawn (bold in the bar, filled when on, regular on the hub as an .icb copy); New here, Top cut and Offers stayed.
- M8 round 3 (Mako's picks 2026-11-05, phone yes 2026-11-06): Collection's Add is two cards, the front one card-shaped (Material library_add on the app's line); the no-picture person is Phosphor's user, filled, one drawing in the corner, the Trade board and Decks; I'm going and Going are Phosphor's user-plus and user-check, a touch smaller than Directions and Calendar beside them and on their line (Mako 2026-11-06: level, it read larger); the bin is Lucide's trash-2 with its sides drawn in, line 2, one drawing on every page; Decks' Ready is a solid circle with the app's check cut out, its Chosen Champion star Phosphor's, its handle six dots (Material drag_indicator). Every drawn check is the list's (4 12 10 18 20 6); Top cut's plus and minus span 12 (as built, not chosen).
- M8 round 5 (Mako's picks and phone yes 2026-11-06): Info is Phosphor's info, bold, drawn 22.5 across so the round icon reads as big as its square neighbours; its filled twin is the same bold i cut from a solid disc. The view chips (Decks, Collection): Grid and Text are Phosphor's squares-four and text-align-left, bold; List is two of Grid's squares with lines on the same bold line, one drawing on both pages. Open the event page keeps its drawing; the pairings menu's Open the event page wears the out-arrow (.extl) too; links inside a line of text stay plain.
- One arrow (plan 2 M8 block 7, Mako's yes 2026-11-06): every arrow the app draws is RAVI_ARROW (pages.js; Lucide's arrow, ISC) in four directions: the sort chip, Trade's move and verdict, the Trade board's verdict, Collection's Movers, and the price chips beside words (viewBox 4 4 16 16, line 2). Decks' printing-row check is the list's check.
- Sorts (pages.js RAVI_SORT; Mako's yes 2026-11-05): a sort chip shows an up or down arrow and the sort's name; the sort menu is words only, the arrow on the chosen row; a second tap on the chosen row flips it (not My order, not Public). One name per idea on every page, named in RAVI_SORT.

Hub layout (hubedit.js, app.css HUB LAYOUT; Mako's phone sign-off 2026-11-03): the hub's own blocks at the hub's size, dragged or tapped into place, the pages not on the hub below; one copy, drawn by App settings and the first-time setup (RAVI_HUBEDIT).

The hub block and the install screen: style/hub.md and style/install.md.

## 6. New page checklist (in this order)

1. pages.js: add the page to RAVI_PAGES: id, name, path ("<id>/"), icon getter (RAVI_ICON name), rgb "r,g,b". Keep Settings last. Add the icon to the SVG table first if it is new.
2. Make the folder <id>/ and index.html from the Kit, and its notes style/<id>.md (section 10): head as in section 5 (manifest link, theme-color #08090A, apple meta, fonts.css, app.css, pages.js), .wmrow, main wrapper, .lede or a glass plate, content, footer. The install screen comes with pages.js.
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
- App settings is a page of rows, as iPhone Settings: a sticky search plate, then glass press groups under labels naming what they affect (Alerts, Hub, Tier list, Display), each row showing its setting as its grey value and opening its own menu above the bar, titled as the row; a lone on/off (Trade offers, Share my legend) is a check row on the page instead, in a sunken group under the same label (M7 B1, Mako's phone yes 2026-11-04); then the support plate, folded. Its bar's third slot opens Reset settings from the slot (two taps: Sure? Tap again); its Settings slot is the dimmed gear. Live event pairings takes the Riot name and #tag in two fields with Save under them; signed in, a Your Riot ID row shows it and opens Profile (M7 C3), and Send a test alert stays. Hub layout is the hub's own blocks, the hub's size, dragged or tapped into place. The rest: style/settings.md. (Mako's phone sign-off 2026-11-03, app b111830 and aba965a)
- The Decks page is worked in, like the counter, and bends three defaults (Mako 2026-10-17): its card browser is a full-screen view, not a menu (the Collection page's too, the same bend; Mako's yes 2026-10-25); the page holds two screens, the list of decks and one deck; the add tile that ends a section in Edit wears a dashed outline.

## 8. Motion

- Motion confirms; it never decorates. Three exceptions, all on the hub: the launch intro, the glow (section 10; Mako 2026-10-31), and the badge's flowing rim (section 10; Mako 2026-11-01).
- Nothing animates on first paint, apart from the hub's three exceptions.
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
- The launch intro: once per launch, the first time the hub shows (session flag ravi.intro.v1; off with ravi.intro.off.v1). 'Rift App' in blue over 'Van Isle' in pink, in the badge's own letters at their size, comes in and is read; the small letters fade while the four capitals travel into the badge; the glass opens out from behind them, the rim draws round from the left end both ways, meeting at the right, and the glass catches the light once. About 2.6s (Mako 2026-10-31). The letters live inside the badge, so they move with it if the top area settles; at the end the badge is rebuilt from its markup. The hub's blocks rise in while the name is read. Any tap finishes it. No other page has one.
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
- The wordmark row starts at safe-area top + 25, so its 36 badge is level with your picture (centre at safe-area top + 43). The hub's badge is centred in its top area from --top-clear + 36.
- A sticky plate parks 10 above --top-clear, so its words start on it. The gap above it is never a scroller's padding (a sticky's top counts from inside that padding). A menu at its tallest stops at the same place. [C] (Mako's yes 2026-10-24)
- No member of a new class or function family is a prefix of another.
- An index written into markup comes from the source array, never the loop counter.
- A legend is a Riftbound character.
- Dates and times are written one way, by pages.js: RAVI_DATE gives "Sep 16, 2026" (short: "Sep 16"), RAVI_WHEN gives "Oct 15, 8:01 PM" in island time, with the year only when it is not this year. Riot's words on the Rules page stay as written. (Mako's yes 2026-10-16)
- Keys: vir.hub.open.v1 (page to open to), vir.hub.blocks.v1 (the hub's picks), vir.start.guide.v1 (New here's last guide), vir.cut.v1 (Top cut's numbers and event), ravi.intro.off.v1, vir.cal.filters.v1, vir.seen.v3, vir.follow.v1, vir.rules.seen.v1, vir.coll.v1 (binders, no binder, Wishlist), vir.coll.set.v1 (Collection's view and settings), vir.me.v1 (my Riot name, M16), vir.alerts.v1 (events with alerts on, M16), vir.setup.v1 (the first-time setup has opened; plan 2 M6); session: ravi.intro.v1, ravi.web.v1 (Continue in the browser), ravi.glow.v1 (the hub has been seen; later hubs pick their glow).

## 10. Page notes

Each page's own rules, its menus and its page-local classes, one file per page in style/. Read the file of every page a change touches, with this core. A new page gets its file in the same commit as the page (section 6).
- style/hub.md: The hub (index.html)
- style/calendar.md: Calendar (calendar/)
- style/counter.md: Counter, the Game page (counter/)
- style/trade.md: Trade (trade/)
- style/board.md: Trade board (board/)
- style/decks.md: Decks (decks/)
- style/collection.md: Collection (collection/)
- style/tier.md: Tier list (tier/)
- style/cut.md: Top cut (cut/)
- style/rules.md: Rules (rules/)
- style/start.md: New here (start/)
- style/feedback.md: Feedback (feedback/)
- style/settings.md: App settings (settings/)
- style/install.md: The install screen (pages.js)

## 11. Checks

- Marks: [D] drawn-test.js, [A] audit.js, [T] a named suite, [C] a check could catch it and none does yet. Every suite and what it proves: rb-tools SUITES.md (a new suite adds its line there).
- style-lint.js (rb-tools, static, seconds): this file and the page notes against the code: each page's own classes listed in its notes (classes from before 2026-11-03 are in style-baseline.json until M7 lists or retires them), font sizes on the rungs or a named exemption, Poppins at 600, 700 or 800, typed colours only tokens and palette entries named here, the guard scripts and shared files on every page, this file under 500 lines and ASCII. Run it before every push that touches a page.

## 12. Changing this file

- A line that records a build Mako signed off on the phone goes in without a separate yes, once checked against the code as shipped and the latest decisions in the records (MAP, the milestone's handoff, LOG); its commit names the build and his sign-off. A rule beyond what was built still needs his yes. Either way it is its own commit, never inside a fix. (Mako 2026-10-29)
- Mako's sign-off on a build is not a choice of every value in it: he judges what he sees, not each detail (Mako 2026-11-03). A value recorded from a build that he did not name is marked 'as built, not chosen' and stays open to the next sweep; only values he named count as his.
- Mako's eye on the phone outranks any value here. Anything he names becomes a rule with a check.
- If the code and this file disagree, one of them is a bug. Report it; do not pick.
- To break a default on purpose, say so in one line in the commit message.
- ASCII only, this file and style/ included. This file under 500 lines: a page's rules go in its notes file, a suite's description in rb-tools SUITES.md. style-lint checks both.
