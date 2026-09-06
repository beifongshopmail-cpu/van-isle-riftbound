# Van Isle Riftbound - visual style contract

Every rule here states a value AND a reason. The reason matters as much as the
value: most of these exist to stop one specific mistake happening again, and a
bare number invites a later reader to simplify it away.

If this file and the code disagree, the code is wrong. Fix the code.

WHO THIS IS FOR: anyone adding a page, a panel or a control to this app,
including someone who has never opened the repo before.

WHAT THIS IS NOT: a changelog, a milestone history, or a record of what went
wrong. Those live on the project's task list. This is the current rules only.

THE APP IS FOUR PAGES, each a single self-contained HTML file carrying its own
CSS and its own script:

    index.html            the event calendar
    counter/index.html    the in-game point counter
    trade/index.html      the trade calculator
    feedback/index.html   the feedback form

There is no shared stylesheet, no framework and no build step. Tokens are
declared once per file and duplicated across files on purpose - see section 8.

ASCII only, everywhere in this repo. PowerShell reads .ps1 files as ANSI and an
em dash causes a parse failure, so the whole project stays ASCII for
consistency, this file included.

## 1. The ground

THE GROUND IS BLACK, #000000 (--ground). It is also why depth is done with
hairlines rather than shadows: a drop shadow does nothing on black.

ALL INTERFACE CHROME IS MONOCHROME - black, bone and two greys.

    --bone     #F2F3F5   a label that is active, current or selected
    --dim      #828A97   a label at rest
    --mute     #4E5561   quieter still: captions, source lines, empty states
    --rule     #212429   a hairline at rest
    --rule-hi  #343A44   a hairline that is open, focused or pressed
    --warn     #FFB020   a stale-data stamp, and nothing else

THE DATA CARRIES THE COLOUR. The only coloured things on a page are things that
mean something: an event's category, a player's side, which side of a trade a
card sits on. That is what lets the calendar grid carry the visual weight, and
it stops a UI accent competing with the category hues.

THE CALENDAR'S FOUR CATEGORY HUES:

    nexus     #3FA9F5   Nexus Nights
    skirmish  #FFB020   Summoner Skirmish
    open      #FF4F9A   Open Play
    learn     #EDEFF2   Learn-to-Play

Green and violet are deliberately absent. THE SHIPPED PALETTE STAYS AS IT IS.

THREE ARGUED EXCEPTIONS to monochrome chrome. Each one was argued on its own
merits and written down; ANY NEW HUE NEEDS THE SAME.

1. --over #FF453A and --over-deep #8C1F19, the round timer past zero. It is
   chrome, but it is an alarm.
2. The six domain colours on the counter's rune glyphs. The colour IS the data.
3. The per-side colours: --p1 / --s1 #3FA9F5 and --p2 / --s2 #FF4F9A. One hue
   per player on the counter, per side on the trade page. Same two values, two
   names, because the pages do not share a stylesheet.

DIRECTION IS CARRIED BY SHAPE, NEVER BY COLOUR. A price rising is good news for
a seller and bad news for a buyer, and this app must not take that side. The
price-movement signal uses an arrow. Green-and-red would assert an opinion the
tool has no business having, on a page whose neutrality is load-bearing.

DIM MEANS DISABLED. A resting opacity below full, on an element still meant to
be used, reads as unavailable. Two exceptions: a scrim over a modal, and
opacity moving inside an animation. Neither is a resting state.

Scrim alpha cannot be tuned in small steps on this ground. Anything under
roughly 15 points of alpha is unjudgeable. The modal scrim is rgba(0,0,0,.7).

ON COLOUR AND ACCESSIBILITY: the palette was chosen with a colourblind reader
present, and that shaped it. But accessibility here is a last consideration,
never a blocker and never grounds to veto a palette that otherwise works. The
test is "looks good for a general audience". Keeping a text label beside every
colour block is worth doing on its own merits - small blocks, dim screens,
outdoor light - and not as an accessibility argument.

## 2. Surfaces

NO GRADIENTS ANYWHERE. Depth comes from a flat fill plus a 1px hairline, and
nothing else. The calendar once used a top-lit gradient with an inset white
bevel; matching the counter meant deleting all of it, and "make these pages
match" turned out to be one subtraction rather than a repaint. Expect that
shape again.

PLATE FILLS CELLS AND INPUTS, NEVER CONTAINERS. --plate #14171D is the fill for
a small repeated cell (a calendar day) or a text input. A CONTAINER IS A 1px
HAIRLINE ON THE GROUND WITH NO FILL AT ALL. The trade page once filled nearly
every container with plate and read as a stack of grey boxes; the counter fills
almost nothing and reads correctly. The plate value is the lever for grid
legibility - not the gap, not an outline.

A HAIRLINE IS --rule AT REST AND --rule-hi WHEN OPEN, FOCUSED OR PRESSED. An
open disclosure panel is --rule-hi. That is the whole state system.

COLOUR BLOOM IS FOR DATA ONLY. An event bar and a legend swatch throw a small
glow in their own colour via box-shadow. It survived the flattening pass
because it is data, not chrome. Nothing in chrome glows.

RADII BY THE JOB THE THING DOES:

    9px  (--r)       a container or a disclosure panel
    6px              a bar or a text control
    5px  (--r-cell)  a segmented box, an icon button, a calendar cell -
                     deliberately tighter than chrome so the grid still
                     reads as a grid
    2px  (--r-xs)    an event bar or a chip

The counter writes all of these as literals rather than tokens. That is
consistent within that file; see section 8.

## 3. Type

TWO FACES, AND ONLY TWO.

    Archivo        (--display)  section headers and display numbers
    IBM Plex Mono  (--mono)     everything else, including card and event names

IBM PLEX SANS (--body) IS RETIRED AS A TEXT FACE. The token is still declared in
all four files and the woff2 still ships; nothing should reference it for type.

WEIGHT 800 IS DISPLAY, WEIGHT 600 IS STRUCTURE, MONO IS EVERYTHING ELSE.
800 belongs on the counter's big score, the verdict number and the mastheads,
where mass is the point. A SECTION HEADER IS ARCHIVO 600, 15px, UPPERCASE,
.1em. It was 800 once and shouted over the 10px mono two lines below it, because
three amplifiers - weight, caps and wide tracking - were stacked on one element.
The felt problem was mass, not size.

MONO IS ALWAYS 500 UNLESS A RULE SAYS OTHERWISE. A rule that sets --mono with no
font-weight renders at 400 and reads as a different face on the same page.

THREE SIZES OUTSIDE DISPLAY TYPE, AND NO OTHERS:

    10px   captions and small labels
    13px   controls and content
    16px   text inputs (a floor, not a choice - see section 7)

WHOLE PIXELS ONLY. A half-pixel size renders softer and heavier at the same
nominal size and reads as a different font.

TRACKING: .1em on uppercase controls and headers, .08em on data and values.
.04em is a stray and must not be reintroduced.

Mono runs wider per character than sans, so 13px mono occupies roughly the same
measure as 14px sans. A size change on paper is not always one on screen.

## 4. Buttons and controls

THE LADDER, THREE HEIGHTS:

    44px   a primary commit, and anything full-width or in a stacked row
    38px   a segmented control, and any button sitting BESIDE a bar rather
           than acting as one
    32px   a single-line control inside a row of content - a quantity
           stepper, a move or delete button on a card line

A SEGMENTED CONTROL IS ONE SHARED BORDER BOX WITH DIVIDERS INSIDE IT. If the
buttons have a gap between them and a border each, it is a STACKED ROW and it is
44px. Reading a stacked row as segmented once made a whole sheet alternate 44
and 38 down its length, and both complaints it produced traced to that one
misreading.

44px IS ALSO THE TAP FLOOR (--tap). A text-only link acting as a control still
takes min-height:var(--tap).

A FILL MEANS SELECTED, NEVER "IMPORTANT". A pressed segment carries a bone fill
because it indicates selection. A bar that merely wanted emphasis lost its fill
for exactly this reason. Content-state indicators - today's date marker, a NEW
badge - are not controls and keep their fills.

OUTLINE STATES: border --rule at rest, --rule-hi when open, focused or pressed;
label --dim at rest, --bone when open.

ANY BUTTON MUST DECLARE ITS BACKGROUND EXPLICITLY, even background:none.
Otherwise iOS Safari paints a light grey native bar over it.

FOUR EXCEPTIONS TO THE LADDER, each with its reason:

1. START MATCH on the counter keeps its bone fill. It is the app's ONLY primary
   commit button, and a fill means selected everywhere else. Deliberate.
2. The trade page's add buttons on a search result stay 38px despite sitting
   inside a content row. Each one stacks a price, a printing label and a delta
   chip across two lines, and 32px cannot hold two lines of type.
3. The counter's colour swatches are content-state indicators, not ladder
   members. The button keeps a 44px box as the tap target and the colour is
   painted by a 30px ::after chip inside it, with the selected ring on the CHIP
   so it hugs the colour rather than the tap target.
4. The counter's in-game controls are exempt wholesale - see section 9.

## 5. Blocks and spacing

ONE BLOCK INSET OF 14px. Every stacked block indents its contents 14px from the
block edge.

14px BETWEEN STACKED BLOCKS, AND ONE MARGIN PER BLOCK - never both. A block that
declared both made one gap 28px where every other gap on the page was 14.

A BLOCK SITTING BETWEEN TWO OTHERS OWES A MARGIN ON BOTH SIDES if either
neighbour carries none. Some blocks here carry no margin at all and rely
entirely on the block above.

WHEN A BLOCK MOVES OUT OF A PARENT IT INHERITS NONE OF THE PARENT'S SPACING
CONTRACT - and the parent may have been spacing its NEIGHBOURS too. Check what
the parent supplied to what sat below it, not only to the block being moved.

WHEN SEVERAL UNRELATED-LOOKING SPACING COMPLAINTS APPEAR ON ONE COMPONENT,
SUSPECT ITS BOX, NOT ITS NUMBERS. One component nested a level too deep produced
a bordered box inside a bordered box, an inherited centring and a stray gap all
at once, and no value change could have fixed any of them.

THE DISCLOSURE IS ONE SHAPE, USED FOUR TIMES:

    bar       full width, min-height 44px, padding 0 14px, background none,
              1px --rule, radius 6px, Archivo 600 15px .1em uppercase in --dim
    open      border --rule-hi, label --bone
    chevron   a 12px SVG at margin-left:auto, inheriting currentColor so it
              brightens with the bar, rotating 180deg off aria-expanded in
              pure CSS, transition --mo-fast --mo-ease
    summary   sits before the chevron, pushed right by margin-left:auto,
              mono 500 13px .08em, and follows the bar's open state
    panel     margin-top 6px, padding 14px, 1px --rule-hi, radius var(--r)

The navigation panel is the one variation: it holds a list of full-bleed 44px
rows, so it takes overflow:hidden, radius 6px and NO padding, with a 1px --rule
between rows.

OPEN STATE IS NEVER PERSISTED on any disclosure. A page reopening with a panel
already open reads as a page that failed to reset.

margin-left:auto BELONGS TO WHATEVER IS ACTUALLY LAST IN THE BAR. Twice, deleting
an element silently collapsed the indicator inward because the auto margin went
with it. Move it, do not just delete it.

## 6. Motion

MOTION CONFIRMS, IT NEVER DECORATES. Every moving thing answers "did that
register?" or "something changed that you did not do". Anything else gets
deleted, and this rule has removed things already built and shipped, twice.

NOTHING ANIMATES ON FIRST PAINT. Absolute, no exceptions. A load cascade was
designed, tuned over two mockup rounds, shipped, and removed one commit later
because the calendar's agenda sits below the fold: it played where nobody could
see it. Animating on scroll-into-view is not the fix - it fires while the reader
is mid-scroll, which is decoration.

SHARED TOKENS, duplicated per file:

    --mo-fast    .16s   a colour or border state change
    --mo-tap     .22s   the tap flash
    --mo-rise    .32s
    --mo-seam    .42s   the agenda rise
    --mo-settle  .7s
    --mo-pulse   1.8s   the over-time clock, the only loop in the app,
                        which is what makes looping itself mean "attention"
    --mo-ease    cubic-bezier(.22,.72,.2,1)
    --mo-travel  .42s   counter only, the focus-to-split move

Not every file declares every token. Declare what the file uses.

A RISE IS FOR CONTENT ARRIVING IN RESPONSE TO A TAP: 16px over --mo-seam, 60ms
stagger, capped at seven groups. It fires when a tap REPLACES a list's contents.
It does NOT fire when a filter merely THINS a list - rising a thinned list reads
as the page redrawing itself rather than as an answer to the tap.

A FLASH IS FOR THE TAPPED CONTROL CONFIRMING ITSELF: a 30 percent wash plus a
24px glow in the control's own colour, over --mo-tap. Adopting it on a new page
is copying two keyframes and calling the one helper. There are no values to
rediscover, and that is deliberate.

THE FLASH IS APPLIED AFTER THE RENDER, NOT BEFORE. Both the calendar and the
counter rebuild their contents on every interaction, so the tapped element is
destroyed by its own tap. Render first, then find the fresh node and apply the
class with remove, forced reflow, add. Where the node survives its render, pass
the live node directly. Both call shapes are correct and neither should be
unified into the other.

A CONTROL THAT ALREADY CONFIRMS ITSELF TWICE DOES NOT GET A THIRD. Worked
example: the calendar's day cell takes a bone border AND pushes a panel open
beneath it on tap. A flash there is decoration. It was wired, judged on device,
and unwired.

A FILL MEANS SELECTED, AND THAT OUTRANKS MOTION CONSISTENCY. Worked example: the
calendar's scope toggle is permanently excluded from the flash, because its
pressed segment carries a bone fill and a flash ending at any other value fights
it. Its confirmation is the fill moving.

EVERY MOTION RULE LIVES INSIDE @media (prefers-reduced-motion:no-preference), so
the reduced case is disabled by construction rather than by a second block that
can drift out of step.

WHEN PORTING A MOTION RULE BETWEEN PAGES, VERIFY EVERY CUSTOM PROPERTY IT READS
RESOLVES ON THE NEW ELEMENT. The flash keys on var(--c); on the calendar that
was set on the inner swatch and never on the button. color-mix against an
undefined custom property is an INVALID DECLARATION, so the animation runs and
paints nothing - no console error, no visible cause, nothing in the diff.

## 7. Building for the phone

EVERY VISUAL JUDGEMENT ON THIS APP IS MADE ON A REAL PHONE. A screenshot shows
one component out of its context; a mockup inherits the viewport it was built
in. Both have produced confidently wrong decisions here.

16px IS A FLOOR ON ANY TEXT INPUT, NOT A PREFERENCE. iOS Safari zooms the
viewport when a focused input's font-size is under 16px.

TO MAKE AN INPUT LOOK 13px ANYWAY: a wrapper div with an explicit height and
overflow:hidden, holding an input that is genuinely 16px and oversized -
123.0769% wide, 54.1538px tall, 17.2px padding, the 13/16 factor applied in
reverse - scaled by transform:scale(.8125) with transform-origin:top left. The
input stays 16px so iOS never intervenes; the wrapper's box is honest so nothing
overflows. THE WRAPPER NEEDS ITS OWN border-radius or it clips the input's
rounded corners square.

THREE THINGS THAT DO NOT WORK, all tried on device:
  - transform on the input alone. It affects PAINT ONLY; the layout box stays
    oversized and overflows its container.
  - zoom. Layout comes out right, but iOS reads the rendered size and zooms.
  - -webkit-text-size-adjust. A no-op here.

The counter's inputs are deliberately NOT wrapped. That page is read at arm's
length across a table, where 16px is the right size anyway.

DOUBLE-TAP ZOOM IS HELD OFF BY A SCRIPT, NOT BY CSS. Each page carries a
document-level touchend listener: a second touch within 320ms and 30px of the
previous one is the zoom gesture, and preventDefault on that touchend cancels
it. It must be attached with {passive:false} or the preventDefault is ignored.
It skips button, a, input, select, textarea, label, summary and [role=button],
AND RESETS ITS TIMER WHEN IT SKIPS - without the reset, a tap on a button
followed by a tap on nearby text is measured against the button tap and
swallowed. A scroll is a move, not a tap, and never reaches it; a pinch carries
more than one touch point and returns early.

THE CONSEQUENCE FOR ANYTHING NEW: a tappable that is not a button is not in the
skip list and becomes double-tap-zoomable. Make it a button, or give it
role=button.

touch-action IS NOT THE LEVER FOR THIS. Six rounds of on-device testing found
every touch-action treatment identical, including declaring it on every element
and every pseudo box. The gesture targets TEXT. The counter was always clean
because nearly everything on it is a button, and buttons are immune.

A DISABLED CONTROL STILL ABSORBS A TAP. The calendar's empty day cells are
disabled buttons and needed pointer-events:none to drop them out of hit-testing.

GIVE THE TOP SAFE-AREA INSET BACK ON THE PAGE WRAPPER, or the masthead sits
under the status bar when the app is launched from the home screen. A page
tested only in Safari looks correct and clips when installed. RUN EVERY PAGE
BOTH WAYS.

## 8. Names and tokens

TOKENS ARE DECLARED PER FILE AND DUPLICATED DELIBERATELY. There is no shared
stylesheet and every page must stand alone.

NOT EVERY TOKEN EXISTS IN EVERY FILE, and assuming otherwise has stopped a build
block already. --plate is on the calendar and the trade page only. --tap,
--ground, --r and --gut are on the calendar, trade and feedback pages and NOT on
the counter, which writes every height and radius as a literal. The motion set
is partial too: the trade page declares four tokens and the feedback page two.
CHECK THE FILE BEFORE USING A TOKEN, and do not add a token to a file for the
sake of one control.

WHEN NAMING A NEW FAMILY, NO MEMBER MAY BE A PREFIX OF ANOTHER. Each page is one
script in one function scope, so a collision is silent - a new function has been
overwritten here by a pre-existing variable of the same name. Prefix new
identifiers, and check the prefix does not swallow a sibling.

AN INDEX WRITTEN INTO MARKUP MUST SURVIVE THE LIST BEING FILTERED OR REORDERED.
Write the index into the source array, never the loop counter. The failure is
silent: the wrong item is selected and nothing throws.

VOCABULARY. Two names in this codebase mean more than one thing. New code should
not extend either.

  A LEGEND IS A RIFTBOUND CHARACTER. On the counter, a legend is the character a
  player has chosen. On the calendar, the colour key for event types is ALSO
  called the legend in the source. New calendar code should call that one the
  KEY or the FILTERS. The overlap has already cost a round trip.

  THE CHEVRON IS ONE COMPONENT UNDER THREE NAMES. .rcar, .tlcar and .nvcar are
  the identical 12px glyph with identical behaviour. New code should use one
  name for it.

ASCII ONLY, in every file in this repo.

## 9. Where a page is deliberately different

THE COUNTER IS NOT THE REFERENCE PAGE, AND ITS DIFFERENCES ARE NOT DRIFT. It is
read at arm's length, across a table, under time pressure, by two people at
once. It has its own ladder and its own type rule, and neither should be swept
into the ones above.

    seam           58px
    score words    48px, 32px in the minor role
    mode bar       32px, 24px settled
    strip icons    34px, 28px settled

THE COUNTER'S OWN TYPE RULE, ONE LINE: BUTTONS ARE ARCHIVO 600, CONTENT AND DATA
ARE MONO. Anything pressed during a game is Archivo, because it is read at
distance under time pressure. Everything in a sheet, a log or a picker is mono.

The counter has NO MASTHEAD AND NO DISCLOSURE. Its navigation is a set of rows
inside the setup sheet, which is already a full-screen surface opened on
purpose. A menu inside a sheet would mean three taps to leave instead of two.

Its setup sheet scrolls, and that is accepted. A sheet that HIDES A CONTROL to
avoid scrolling is worse than one that scrolls.

THE TRADE PAGE IS WHERE THE LADDER CAME FROM. When in doubt about a control
height, look there first.
