# RAVI style notes: Collection

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Collection (collection/index.html)
- Prices from data/prices.json; the bars from data/hist (hist.js, one file a month, rebuilt daily). A sticky plate as Decks': the binder pill (Collection, each binder, Wishlist), the search ('Search your collection', 'Search this binder'), the view row (Grid | List, Select, Sort). Then the value, the change line (the arrow on the percent only), the bars, 7D 30D 1Y All, a note; Movers; the cards. Bar: Hub, Go to, Add cards (the full-screen browser), Collection settings.
- The bars are one piece of glass in Rust inside a glass card, edge to edge, each step one smooth curve, a faint rim on top; one bar a day, a week a bar past 62 days. Market movement by default, Total value in settings. (Mako 2026-10-25)
- Movers: one glass row that opens in place into one block: Gains, a line, Losses, each titled with its arrow; no colour (the firm rule). Closed on every visit; Show Movers in settings. (Mako's yes 2026-10-25)
- Collection is the whole: every binder and the cards in no binder; the Wishlist never counts. A tap under Collection adds into no binder; minus only takes from what the view itself holds. Grid by default (the count pill at the picture's foot, the price of one, the total past one copy); List without glass.
- The browser: the same three-row plate (close and the binder pill, the search, Sets and Held here); Sets is a menu (each set with its day, held and worth; Organized Play promos; Other promos; sealed in its set); a tap on a picture adds one; minus (the bin at one) and plus on the picture.
- Collection: a tile and a List row word a total the same way, "$x for 3"; Edit binders is reached only from the binder pill's menu. (Mako's yes 2026-10-25)

Page-local classes (not in app.css; not Kit parts):
- collection/index.html: .armed .art .bhead .bin1 .bopts .boot .bsr .brw .camt .cards .cchg .cempty .cend .cgrid .chip .chw .ck .cmid .cmv .cnm .cnote .cpic .crow .cseg .csub .ctile .cval .dvrow .dvseg .dvsort .fchip .first .hchg .hfacts .hgain .hnow .hpic .hrow .isum .lpm .lq .lsteps .more .mvbox .mvh .mvsep .owd .plate .psf .rot .sel .selp .stk .stp .tcap .tnm .toast .tpr .ttot
