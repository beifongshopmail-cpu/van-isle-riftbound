# RAVI - the design rulebook

The one place the app's design rules live. One rule per line, each with its value.

STATUS: PROVISIONAL until the pages are final (M7). Mako accepted this draft on 2026-10-04 without re-checking each call. Any rule outside section 1 may change as pages are finished, with his yes, as its own commit.

- A new rule enters only with Mako's yes, as its own commit, never inside a fix.
- Mako's eye on the phone outranks any value here. Anything he names becomes a rule with a check.
- If the code and this file disagree, one of them is a bug. Report it; do not pick.
- This is a starting point, not a cage. To break a rule on purpose, say so in one line and note the break on that page's LOG item.
- ASCII only, this file included.

CHECK MARKS: [D] drawn-test.js checks it (proven on a planted defect). [A] audit.js checks it (UNPROVEN: its menu walk misses menus). [C] a check could catch it and none does yet (see the last section). No mark: judged by eye on the phone.

## 1. Hard rules (not style, never broken on purpose)

- Colour never carries meaning alone. Shape or words carry it too. (Mako is colourblind.)
- Dim means disabled: opacity .4, pointer-events none, and it holds its place. Never hide a control that moves its neighbours.
- Price direction is an arrow, never a colour. Up and down look the same apart from the arrow.
- Store neutrality: no store's numbers, defaults or tilt anywhere in the UI.
- The device floor: an iPhone 7 on iOS 15 must run it. The cheap version is the baseline, the costly one the enhancement.
- Blur only inside @supports (backdrop-filter); without it, the same colour at .94 alpha.
- No color-mix() and no :has() in anything the page depends on. Compute tints in script.
- Text inputs are a real 16px. No scale or zoom tricks to make them look smaller.
- 12px is the type floor. An element that needs smaller is redesigned, not shrunk.
- Every call on "RULE -- settled calls, do not re-propose" stands.

## 2. Ground and colour

- Ground #08090A (--ground). Bone #EDEAE3 (--bone). Ink on bone #121316 (--ink).
- Muted text #A4A7AD (--muted). Faint #4A4E55 (--faint). Track #2A2D32 (--track). Pressed in a track #34383E (--hi).
- Player 1 and Yours: blue #5DA5EE. Player 2 and Theirs: pink #EE5F9C.
- Round timer past zero: #E5484D (--over). The only alarm colour.
- Event types, each with its own mark shape AND its name in words on every card:
  - Nexus Nights 63,169,245, circle
  - Summoner Skirmish 255,176,32, diamond
  - Learn-to-Play 203,166,255, square
  - Open Play 255,79,154, bar
  - Other events 138,148,163, ring
- The counter's six swatches are the player's choice for one match; the first two are the player defaults.
- A new hue anywhere needs Mako's yes.

## 3. Surfaces

- Glass means press. Sunken means choose or type. Bone fill means chosen.
- A fill means selected, never "important".
- One glass recipe (.glass) for buttons, surfaces and event cards: body rgba(255,255,255,.045), 1px rim lit at the top fading down the sides, faint glow inside the base. No full outline on any button.
- Glass pressed: rgba(255,255,255,.14) (--glass-press).
- Sunken track: rgba(0,0,0,.35) (--recess). Chosen option inside it: bone fill, ink text.
- A chosen picture or colour wears a bone ring instead of a fill: inset 0 0 0 2px bone, then 2px ground.
- Frosted chrome (bar, strip, menus): rgba(36,37,38,.22), blur 20 on bar and strip, 24 on menus, saturate 160%, rim rgba(255,255,255,.10).
- A control that acts for one side is glass, with that side's colour as its text, and that colour at .50 when pressed or armed.
- Event cards are glass with the type colour as the body.
- A glass surface is never its own scroller. A still glass wrapper holds a plain scrolling child.
- Crop with overflow, never clip-path, on anything holding a frosted surface. No drop shadow inside a crop.

## 4. Type

- Two faces. Poppins for display and every tappable label. Nunito for text and data.
- Poppins ships 600, 700 and 800 only. Any other Poppins weight is synthesised and wrong. [C]
- Six rungs: 12, 13, 15, 17, 20, 28. Whole pixels only. [C]
- Titles: Poppins 700, sentence case. Menu title 20; section head 17; wordmark 17.
- Buttons and tappable labels: Poppins 600.
- Numerals: Poppins 800.
- Body: Nunito 400 at 15. Passive metadata: 12, muted.
- The grey value in a row: Nunito 600, 12, muted.
- Tabular figures on body, inherited by every number.
- Type follows height: a 44px control carries 15px; a 34, 36 or 38px control carries 13px. Inputs, play and grid are exempt. [D]
- Named exemptions to the rungs, nothing else: 16 text inputs; 16 counter score words at .06em; the counter numerals (column formula); 40 slim-banner numeral; 26 trade ring amount. [C]

## 5. Sizes

- No control height is a bare number. Every one reads a named size from app.css :root. [A]
  - --sz-row 44: menu rows, fields, full-width actions
  - --sz-track 40: a sunken track, and search fields
  - --sz-sm 36: round buttons and compact pills
  - --sz-seg 34: a segment inside a track, and swatches
  - --sz-score 48: counter score buttons
  - --sz-score-min 38: counter slim-banner score buttons
  - --sz-seam 50: counter Pass turn
- Measure the surface the eye sees, not the control inside it. [A]
- A tray holding one row takes .solo, so the visible pill is the 44 row.
- Calendar day cells: 46 circles where there is room, never under 40.
- Size-exempt pictures carry a size-exempt comment on the line: trade card art, the counter's rune.
- The bar is 56 high (--barH).

## 6. Corners

- A shape whose corners differ uses real values (a pill end is half its height), never 999px: the browser shrinks every corner together and flattens the small ones. A plain pill with four equal round corners may use 999px. [D] [C]
- A cut track (counter score pills, .seg.multi): round outer ends, 6px inner corners (--r-cut), 3px gaps (--gap-cut). [D]
- Menus 24. Tracks that hold rows (.pick, Go to) 24. A tray 30 (24 plus its 6 padding). Go to tiles 20.

## 7. Spacing and alignment

- 6 within a group, 14 between groups.
- A menu or section title sits 10 above what it heads.
- Inside a track: 2 between options, 3 to 4 padding.
- Menu padding 16; tray padding 6.
- Controls side by side share top and bottom within 0.5px. [A]
- Nothing overflows sideways. [D]
- A one-line row clips its text with an ellipsis; it never wraps.

## 8. Control kinds

- Every tappable carries data-k, on itself or its nearest container, naming one kind. [A]
- do: acts once. Glass, or a side pill (.sidebtn) when it acts for one player. Arm-then-confirm is a do.
- deeper: a row inside a menu that opens the next menu. Always carries the right chevron (.cvr); nothing else may. [A]
- pick: a choice that stays, inside a sunken track. Go to is a pick; the page you are on is the chosen tile.
- type: a text field in a sunken shape, background --recess on its visible shape.
- open: opens in place. Carries aria-expanded and a .chev that points at what a tap will do.
- slot: an icon slot on the bar or the counter's strip, nowhere else. [A]
- play: the counter's field (score buttons, Pass turn, legend thumbnail), nowhere else.
- grid: the calendar's day cells, nowhere else.
- view: the counter's full-card viewer: tap anywhere dismisses it. Nowhere else.
- Text you only read carries no data-k and is not tappable.
- A deeper row is one line at 44, its value in grey small on the right. Only records (.rec: saved trades, past matches, event rows) may grow past one line. [A]
- In a stack of rows an action is a .door.act. A centred .pact stands alone or sits in a menu foot.
- A label never repeats its only row.
- Pages place components; they never reshape them. A page may not set height, min-height, padding, border-radius or width on .door, .pact, .seg, .nf/.sf, .goto, .rec, .btn or .circ. Layout around them is the page's own. [A]

## 9. Menus

- Every overlay is a menu: a head (title, X), a body, an optional foot. Only the body scrolls. No full-screen sheets.
- Going deeper replaces the menu: it shows a back arrow and no X. Back returns where you were. The X on a menu opened directly, or the scrim, closes the whole stack.
- A menu holding one track and nothing else is a tray: no title, no X.
- A menu opens from the control that opened it: from the bar it rises from the bottom and sits 8 above the bar; on the hub it hangs from the gear.
- The menu's height cap counts the bar.
- An open menu locks the page at the root (html.lock). Never pin the body with position:fixed.
- Never set opacity or pointer-events on a panel by id. Those belong to .panel.show. [C]
- Style a panel by id or by app.css classes only; the menu script rewrites its className.
- A two-tap confirm adds and removes .armed; it never rewrites className.
- Menu scrim rgba(0,0,0,.35). The full-card viewer's scrim .7.

## 10. The bar

- One shared bar: .bar, .tab and .frost in app.css, unchanged on every page. Each page carries its own four buttons.
- Fully round, 12 in from the sides, bottom max(4px, safe-area inset minus 12px).
- Four slots, always in this order: Hub, Go to, the page's one action, Settings. Slots never move between pages; an unused one dims in place.
- The active slot: a see-through pill (rgba(255,255,255,.14)) and its icon filled.
- The counter's strip is the same shell with its own four controls. The hub has no bar.
- Menus and the counter's victory banner sit above the bar.

## 11. The page

- Every page is at least one screen tall (body min-height 100vh). [C]
- The scrollbar stays put (scrollbar-gutter stable, overflow-y scroll).
- The top clear line: nothing sharp and unfrosted sits above the safe-area inset plus 28px (--top-clear). [C]
- Give the top safe-area inset back on the page wrapper.
- The wordmark row is chrome: one thin row, name only, scrolls away.
- The footer: 30 above, a short dim hairline inset 24 from both ends.

## 12. Motion

- Motion confirms; it never decorates.
- Nothing animates on first paint.
- Press: scale .96, and the shade change.
- Tap flashes, .42s: bone for neutral controls (.flash-n), the player's colour for side controls (.flash-p).
- Apply a flash after the render: find the fresh node, remove the class, force reflow, add it.
- A control that already confirms itself twice gets no third.
- A chevron turns in .28s.
- Reduced motion turns every transition and animation off.
- Never animate layout from script while the page scrolls. Sticky, transitions and the browser's own scroll anchoring first.
- Never tween or scroll-correct a height above the screen. Change it in one frame and let the browser hold the view.

## 13. Phone mechanics

- Double-tap zoom is held off by a touchend script on every page: a second touch within 320ms and 30px is cancelled, passive:false, buttons and links skipped, and the timer resets on every skip.
- Anything tappable is a button, or carries role=button.
- A disabled control drops out of hit-testing (pointer-events none).
- Every button declares its background, even none.
- Links that act as tiles show no long-press preview.

## 14. Names

- No member of a new class or function family is a prefix of another.
- An index written into markup comes from the source array, never the loop counter.
- A legend is a Riftbound character. The calendar's colour key is the key or the filters.

## 15. Candidate checks (not built)

1. No 999px in a border-radius whose corners differ (static).
2. Any font-size off the six rungs carries an exempt comment (static).
3. Poppins used only at 600, 700 or 800 (static).
4. Every open menu is visible and tappable: opacity 1, pointer-events auto, its centre lands inside it.
5. No panel sets opacity or pointer-events by id (static).
6. Every page's body is at least the viewport height.
7. No unfrosted fixed or sticky element sits above --top-clear.
8. Move audit.js's checks (sizes, alignment, bare heights, kinds, no reshaping) into drawn-test.js, or prove each on a planted defect.
