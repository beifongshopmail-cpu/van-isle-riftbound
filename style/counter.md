# RAVI style notes: Counter (Game)

Pattern: Tool

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Counter (counter/index.html)
- Fixed .stage with two sides (.side, data-role major, equal or minor), score numerals .num, .rail log, cut score buttons .acts, Pass turn .pass, round timer line .tmv, victory banner .win. Strip (.bar.strip.frost) of four controls; Go to has Hub (withHub true).
- The Match timer (M16): when the tagged event is live, a Round option ends the minutes track; it sets the timer to Riot's clock for the running round (start plus length) and follows the event into its next round; over a running timer it arms first, as the minutes do. The line under the track says which round and how long is left.
- Menus #pgame (Game settings), #pgoto (Go to), #pnew, #pleg, #pevt, #pend, #plog, #ppast with a stack (OPENP, STACK). Game settings and New match have no section labels and share #shared: the top group (.pcards.doors: Pause clock while the clock is on, Match timer, Event), then the player cards; Game settings opens with a Go to row (.pgo, one deeper to #pgoto, the Go to tiles with Hub; plan 2 M8.7 A2), adds Show on the field, and its foot holds End game and New match side by side. The strip's Log opens #plog, titled Log. The legend picker (#pleg) holds its search (with Clear) on one row and the Release | A-Z track on the row under it. The Match timer, Show on the field and each player open in place (.pcard, .pchead), one at a time. End game (#pend) labels only Who concedes? and Time called: who won?; with no label between, Intentional draw is in the time-called group, 6 under its row (Mako 2026-10-16: Agreed went). Full-card viewer .spot (view kind, scrim .7).

The strip and the Tracker's motion (moved from STYLE.md sections 5 and 8, 2026-11-11)
- The counter's strip is the same shell (.bar.strip.frost) with its own four controls, and no Hub slot, so its Go to keeps a Hub tile. Its Layout track is in the markup; RAVI_BAR adds Undo, Log and Game settings after it. The hub has no bar.
- The strip's Layout track is a tall track (.seg.tall): its options are --sz-seg-tall (38), so the track is 44 like the strip's slots and sits 6 from the strip's top and bottom. A named exception to the Kit rule. [T]
- A point lands: the numeral settles from 1.06 and the newest rail line draws in (--mo-rise .32s).
- Pass turn: the button flashes the incoming player's colour, its turn line rolls up, and a glow fades in across the button into their half, .56s.
- The victory banner rises where a menu does, when a game ends in front of you; never on first paint.
- The counter updates its sides in place, so the next render never cuts a motion off. [T]

Page-local classes (not in app.css; not Kit parts):
- counter/index.html: .lgppic .lgptile .num .pass .pgo .rail .res .spot .tmv .win
- counter/index.html, listed in M7 from the style-lint baseline (2026-11-04): .clearpast .cred .dash .dtl .dv .e .e1 .e2 .empty .et .f .far .field .fmt .fpair .g1 .g2 .ghead .gsub .ic .legend .legrow .lgarune .lgathumb .lgpchips .lgpempty .lgpgrid .lgpn .lgppr .lgpprh .lgpq .lgpsub .lpf .lt .mbody .mday .mrow .name .nextbox .nlab .nm .nnm .nsuf .open .opp .passglow .pcbody .pcrow .pdot .pgrp .pips .pl1 .plegh .pn .pnm .pval .rdnf .rdraw .rgl .rloss .rt .rwin .s1 .s2 .sco .seamghost .seamwrap .sidebtn .spotpic .them .three .tmclock .tmfar .tmnm .tmover .tmp .tmp2 .tmpause .tmr .tmsplit .two .vs .who1 .winrow
