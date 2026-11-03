# RAVI style notes: Trade

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Trade (trade/index.html)
- Sticky .plate (search .sf with Clear; on the row under it the .sides track with side colours and Undo .udb; results .res), ring .vd for the difference, side panels .sidep with .ln lines and steppers .stp (the minus is the bin at one copy), toast .toast.
- Bar: Hub, Go to, Saved trades (#psav, data-fills), Settings (#pset, data-fills). Menus #pnav, #pset, #psav, #phist, #ptrade, #prcp, #pundo (Undo).
- Trade settings (#pset): currency (no label), Price movement (Off, 7D, 30D, 1Y, All; Off hides the note and every movement mark; a stored 1D reads as 7D), Percent of market price with a small Reset (.rrs) at the label's end, then one row per side (.sidr, two equal columns): the name field (.nf.tall in the side's colour) and the percent in the cards' stepper (.stp), steps of 5 inside 0 to 200. Clear both sides is the menu's foot. Saved trades (#psav) carries no head count (its All saved trades row counts them); a saved trade (#ptrade) has its title field with no icon, and Receipt image is a foot button with no chevron.

Page-local classes (not in app.css; not Kit parts):
- trade/index.html: .bin .lbr .ln .lnh .rcpimgs .res .rrs .sidep .sidr .stp .tail .toast .trow .udb .vd
