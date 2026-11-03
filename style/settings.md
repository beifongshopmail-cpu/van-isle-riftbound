# RAVI style notes: App settings

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

App settings (settings/index.html)
- A sticky search plate (.srow.plate, as Rules and Decks: .sf, Search settings, the round X), then two press groups of rows (.doors.stgrp; Mako's yes 2026-11-03, plan 2 M6): Riot name and alerts (Live alerts once the phone has its account) and Local decks; then Hub blocks, Open the app to and Motion. Each row shows what it is set to as its grey value (a Riot ID or Not set, On or Off, 7 of 7, the page) and opens its own menu above the bar, titled as the row, with an X. No line at the top (Mako 2026-11-03). A search keeps the rows whose name, choices or subject start with every typed word; a group with none left goes, and No setting matches shows when nothing does. Then the support plate, then the footer credit.
- The menus: Riot name and alerts (#pme, M16; Mako 2026-10-27: the name is part of you, not each event): a note first (.stmenote), the name field (.rid, the name and the #tag, Save), then Send a test alert (.pact) under the label Alerts; signed in, the fields go and the note points to Profile. Saved on this phone (vir.me.v1); Reset leaves it. Local decks (#plocal): Fill in my deck, a check row. Hub blocks (#phub): a pick-many list of every page, App settings included; up to seven on, an eighth refused with a note under the count line. Open the app to (#popen): rows from RAVI_PAGES plus Hub. Motion (#pmotion): Opening animation, a check row. Reset in the bar's third slot, two taps, puts all but the Riot name back; its fourth slot shows Soon, dimmed (Mako 2026-10-15).

Page-local classes (not in app.css; not Kit parts):
- settings/index.html: .plate .srow .starm .stgrp .stmenote .stmsg .stn .stnone .stwarn
