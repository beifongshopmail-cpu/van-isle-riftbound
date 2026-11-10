# RAVI style notes: Collection

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Collection (collection/index.html)
- Prices from data/prices.json; the bars from data/hist (hist.js, one file a month, rebuilt daily). A sticky plate as Decks': the binder pill (Collection, each binder, Wishlist), the search ('Search your collection', 'Search this binder'), the view row (Grid | List, Select, Sort). Then the value, the change line (the arrow on the percent only), the bars, 7D 30D 1Y All, a note; Movers; the cards. Bar: Hub, Go to, Add cards (the full-screen browser), Collection settings.
- The bars are one piece of glass in Rust inside a glass card, edge to edge, each step one smooth curve, a faint rim on top; one bar a day, a week a bar past 62 days. Market movement by default, Total value in settings. (Mako 2026-10-25)
- Movers: one glass row that opens in place into one block: Gains, a line, Losses, each titled with its arrow; no colour (the firm rule). Closed on every visit; Show Movers in settings. (Mako's yes 2026-10-25)
- Movers in Grid (plan 2 M8.5; Mako's phone yes 2026-11-07): Gains and Losses are each the page's grid (.cgrid) three across inside Movers' glass block, a touch smaller than the grid below, wrapping to a second row; never sliding sideways. List keeps rows.
- Collection is the whole: every binder and the cards in no binder; the Wishlist never counts. A tap under Collection adds into no binder; minus only takes from what the view itself holds. Grid by default (the count pill at the picture's foot, the price of one, the total past one copy); List without glass.
- The browser: the same three-row plate (close and the binder pill, the search, then Decks' chip row: Set and a chip for what the pill holds, In this binder, Owned or On Wishlist; M7 B7); Sets is a menu (each set with its day, held and worth; Organized Play promos; Other promos; sealed in its set); a tap on a picture adds one; minus (the bin at one) and plus on the picture.
- An empty Collection offers Add cards, Add a deck and Import from Collectr as one glass group of action rows (.doors .door.act; plan 2 M8.7 B6).
- Collection: a tile and a List row word a total the same way, "$x for 3"; Edit binders is reached only from the binder pill's menu. (Mako's yes 2026-10-25)

- Empty states (plan 2 M8.7 A6, A7; Mako's yes 2026-11-10): Add a deck with no decks is one row, Build a deck (No decks yet at its right), that goes to Decks; the empty Wishlist leaves Import from Collectr out, since Collectr brings in owned cards.
Page-local classes (not in app.css; not Kit parts):
- collection/index.html: .armed .art .bhead .bin1 .bopts .boot .bsr .brw .camt .cards .cchg .cempty .cend .cgrid .chip .chw .ck .cmid .cmv .cnm .cnote .cpic .crow .cseg .csub .ctile .cval .dvrow .dvseg .dvsort .fchip .first .hchg .hfacts .hgain .hnow .hpic .hrow .isum .lpm .lq .lsteps .more .mvbox .mvh .mvsep .owd .plate .psf .rot .sel .selp .stk .stp .tcap .tnm .toast .tpr .ttot
- collection/index.html, listed in M7 from the style-lint baseline (2026-11-04): .bbody .bin .bnone .bnote .brwon .cbox .dot .land .lbl .mk .n .none .plain .selon .sq .u .unit .v .w
