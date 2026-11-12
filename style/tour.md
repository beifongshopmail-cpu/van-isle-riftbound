# RAVI style notes: The tour

Pattern: Own design (a shared part any page can carry, drawn by tour.js)

Read with STYLE.md (the core) before touching tour.js or a tour's stops.

The tour (tour.js, app.css THE TOUR; plan 2 M9 block 7, direction agreed with Mako 2026-11-12: per-page tours the player starts; his phone check pending)
- Never starts by itself. A link carrying data-tour="<id>" asks for one: the rows in Guide's Getting around (The bar, then each page's own tour) and the first-time setup's Show me around (the bar's tour, on Events). pages.js keeps the ask for the next page (session key ravi.tour.v1) and loads tour.js there; with nothing asked it is never loaded.
- On the real page: the page dims (black .62), one control is lit by a cut-out the control's own shape, 6 out from it, with a 2 bone ring (never colour alone), and the dimmed page takes no taps. The words sit under the control where they fit, else over it, 12 away: a card on the menus' grey (.tourp: --plate-glass, blur 24, corner 22, 12 from the sides, at most 456), the words at 15 (.tourt), then one row: 'n of m' in words (.tourc, 12 muted), Skip and Next (.tourb: flat pills, 36 high, 13; Next with the row chevron); the last stop reads Done alone.
- Where a stop says so, the player goes on by tapping the real control (an event card, a store, a card, Tracker settings) and the tour follows it into its menu as soon as that is drawn; Next taps it for them. A menu the tour opened closes before a stop outside it.
- The light glides from one control to the next in .34s on the settle curve; with reduced motion it steps. The tour fades in over .2s.
- A stop whose control is not on the page (no live event, no Movers yet) is left out, and the count is of the stops there are.
- Stops: two to five a page, the less obvious parts only, each two or three lines at 402 in the app's words (STYLE.md section 4, Words), spoken to the player (you, your); a page's name is bold (.tourt b, Poppins 600; written between stars in tour.js). Every tour's stops are in tour.js (RAVI_TOURS), one list per page; rb-tools p2m9h walks every tour at 402 and 360.
- Prior art, the approach only: driver.js (MIT), Apple's TipKit and NN/g's findings on tutorials (records: NEXT -- a guided tour of RAVI).

Page-local classes: none; the tour's classes (.tour .tourk .tourh .tourp .tourt .tourf .tourc .tourb) live in app.css.
