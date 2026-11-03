# RAVI style notes: the install screen (pages.js, app.css)

Read with STYLE.md (the core) before touching the install screen. Lines moved verbatim from STYLE.md section 5 on 2026-11-03.

The install screen (pages.js, app.css; signed off by Mako 2026-10-09)
- In a browser tab every page shows only #ravigate, first in the body; html.gate hides every other child of the body. The page's own markup and scripts are untouched.
- It stays out: installed (navigator.standalone, or display-mode standalone, fullscreen or minimal-ui); after Continue in the browser in this tab (session key ravi.web.v1); on a ?sim= link; under a test tool (navigator.webdriver). window.RAVI_GATE is true while it shows; the hub's launch intro waits for it.
- Layout: one block centred in the screen (min-height 100svh; top --top-clear + 8, bottom safe area + 84 so the Continue line clears Safari's floating bar): .gwtop (the badge, 72, in .gwname; one line .gwline 17 muted), one glass card .gwcard (corner 22, .shead 20), then on a phone a 13 muted note (.gwnote) and the footer (13) with the Continue link.
- iPhone (#gwios): Add RAVI to your Home Screen, six numbered steps as Safari shows them (.gwstep: number .gwn 15 muted, icon 24, words .gwt 17, optional second line .gwsub 15 muted; at least 44 high, may wrap, hairline inset 16): the menu button (No menu button? Tap Share and go to step 3), Share, Scroll down or tap View More, Add to Home Screen, keep Open as Web App on then Add, Open RAVI (the app icon). Another browser on iOS starts at Share (five steps).
- Android (#gwand): Install RAVI. The .pact button (#gwinst) shows only once the browser offers its prompt; otherwise one line says to use the browser menu.
- A computer (#gwpc): RAVI is a phone app, one line, and Continue in the browser as a .pact.
- The app icon appears once, small, in the last iPhone step. It is the wordmark itself, so never above the name. The icon (rb-tools render-icons.js from design/wordmark/icon.py; Mako 2026-11-01) is the glass badge filling the whole icon: RAVI .74 of the width, the blue-to-pink rim just inside the icon's rounded edge, a dark glass ground lit from the top.
