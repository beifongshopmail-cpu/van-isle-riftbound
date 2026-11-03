# RAVI style notes: Counter (Game)

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Counter (counter/index.html)
- Fixed .stage with two sides (.side, data-role major, equal or minor), score numerals .num, .rail log, cut score buttons .acts, Pass turn .pass, round timer line .tmv, victory banner .win. Strip (.bar.strip.frost) of four controls; Go to has Hub (withHub true).
- The Match timer (M16): when the tagged event is live, a Round option ends the minutes track; it sets the timer to Riot's clock for the running round (start plus length) and follows the event into its next round; over a running timer it arms first, as the minutes do. The line under the track says which round and how long is left.
- Menus #pgame (Game settings), #pnew, #pleg, #pevt, #pend, #plog, #ppast with a stack (OPENP, STACK). Game settings and New match have no section labels and share #shared: the top group (.pcards.doors: Pause clock while the clock is on, Match timer, Event), then the player cards; Game settings adds Show on the field, and its foot holds Go to, then End game and New match side by side. The strip's Log opens #plog, titled Log. The legend picker (#pleg) holds its search (with Clear) on one row and the Release | A-Z track on the row under it. The Match timer, Show on the field and each player open in place (.pcard, .pchead), one at a time. End game (#pend) labels only Who concedes? and Time called: who won?; with no label between, Intentional draw is in the time-called group, 6 under its row (Mako 2026-10-16: Agreed went). Full-card viewer .spot (view kind, scrim .7).

Page-local classes (not in app.css; not Kit parts):
- counter/index.html: .lgppic .lgptile .num .pass .rail .res .spot .tmv .win
