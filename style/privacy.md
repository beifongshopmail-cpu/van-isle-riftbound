# RAVI style notes: Privacy and terms

Pattern: Rows (after App settings)

Read with STYLE.md (the core) before touching this page. Built plan 2 M9 block 10 (Mako's yes 2026-11-12: 'Good to build as recommended'); waits on his phone check.

Privacy and terms (privacy/index.html, privacy/words.js)
- Not a page in RAVI_PAGES: no Go to tile, no hub block, no page colour, no icon. It sits under App settings, whose About rows draw the same words in menus, so its bar's Go to slot is App settings' ({go:"settings"}); its third slot and its gear dim in place.
- The one page a browser tab may read: data-read on its html, and pages.js leaves the install screen out (window.RAVI_TAB true), so Riot, a store's review or anyone can read it without installing. account.js makes no account for a reader in a tab. The install screen's footer links here.
- The words live once, in privacy/words.js (RAVI_LEGAL: day, privacy, terms; rows() draws a press group, bind() opens and closes a row). Each Privacy line is checked against the code it describes (server/live, account.js Your data): change the line when the code changes, and move the day. Wording after Basecamp's open-source policies (CC BY 4.0). Plain words, not legal advice.
- Parts: the sticky search plate (.srow.plate.glass, .sf 'Search privacy and terms', the round X: as App settings), then Privacy and Terms each under its label (.lb.lglb), a press group of rows (.doors.glass) that open their words in place (.lgb; STYLE 7, an explanation menu's rows). Every row starts open here, since the page is for reading; a tap folds one. Under each group, the day the words last changed (.pnote.lgday). The footer with Tell us.
- Search: every typed word starts a word of a row's title or its words; rows that match stay and open, a group with none left goes with its label; 'Nothing matches.' (.lgnone) when none do.
- In the app the ways in go to App settings' menus, not here: About's two rows, and Your data's Privacy row (settings/?open=pprivacy). No footer carries a link (Mako 2026-11-12 20:44: not in the footers).

Page-local classes (not in app.css; not Kit parts):
- privacy/index.html: .lgb .lgday .lggrp .lglb .lgnone .srow
