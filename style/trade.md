# RAVI style notes: Trade

The page is named Appraise (Mako 2026-11-10: Trade read too close to Exchange, and four T names sat in a row). Its id, folder, storage keys and these notes keep trade; a trade is still a trade (Save this trade, Trade done).

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Trade (trade/index.html)
- Sticky .plate (search .sf with Clear; on the row under it the .sides track with side colours and Undo .udb; results .res), ring .vd for the difference, side panels .sidep with .ln lines and steppers .stp (the minus is the bin at one copy), toast .toast.
- Bar: Hub, Go to, Saved trades (#psav, data-fills), Settings (#pset, data-fills). Menus #pnav, #pset, #psav, #phist, #ptrade, #prcp, #pundo (Undo).
- Trade settings (#pset): currency (no label), Price movement (Off, 7D, 30D, 1Y, All; Off hides the note and every movement mark; a stored 1D reads as 7D), Percent of market price with a small Reset (.rrs) at the label's end, then one row per side (.sidr, two equal columns): the name field (.nf.tall in the side's colour) and the percent in the cards' stepper (.stp), steps of 5 inside 0 to 200. Clear both sides is the menu's foot. Saved trades (#psav) carries no head count (its All saved trades row counts them); a saved trade (#ptrade) has its title field with no icon, and Receipt image is a foot button with no chevron.

- The sides (plan 2 M8; Mako's phone yes 2026-11-04): Yours is your colour and Theirs pink, or blue when yours is pink (STYLE.md 4, Players): page tokens --yc and --tc (hex) and --ycr and --tcr (rgb), set by pages.js RAVI_SIDES_PAINT and repainted when your colour changes; the side cards, totals, ring, names and the receipt image all read them.

Page-local classes (not in app.css; not Kit parts):
- trade/index.html: .bin .lbr .ln .lnh .rcpimgs .res .rrs .sidep .sidr .stp .tail .toast .trow .udb .vd
- trade/index.html, listed in M7 from the style-lint baseline (2026-11-04): .a .art .b .bad .boot .buy .chip .cntx .d .d1 .d2 .f1 .f2 .fk .flank .frozen .fv .g1 .g2 .gap .glassr .gs .h2 .hold .k .l1 .l2 .lact .lamt .ld .lmid .lnm .lnow .lrow .lsub .mvp .n .nmf .now .open .pcx .r1 .r2 .rate .rates .rc .rcphint .resw .ringw .rmeta .rnm .rnone .rrow .rset .rsub .s1 .s2 .sempty .stick .sum .svempty .thd .tld .tlname .to2 .tog .tot .two .v
