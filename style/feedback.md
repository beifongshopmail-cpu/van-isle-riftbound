# RAVI style notes: Feedback

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Feedback (feedback/index.html)
- No lede (Mako 2026-11-07). Every line of Planned and Recently shipped is one short title on one row (.door.cr, kind deeper, the chevron) beside its page's icon chip in the page's colour (.ci; the whole app wears white and the hub icon); a tap opens #pitem: the page's chip and name (.cpg), when it shipped (or planned), the line in a sentence (.cds) (Mako 2026-11-07 19:41: less wall of text). Planned: one .doors group. Recently shipped: the three newest updates, a .doors group each under its date (.cdl; a version once testers start); All updates (.callg, a row with the count) opens #pall with every update. Then Send feedback: the form shown on arrival in one group (.fgrp; no fold row); the support plate; footer. Both lists come from data/changes.json (t a few words, d a sentence), kept by hand (records: RULE -- keep the feedback page's Planned and Recently shipped current). One way to the form: the bar's third slot is the dimmed Soon; Settings dimmed. (Mako's phone yes 2026-11-03)

Page-local classes (not in app.css; not Kit parts):
- feedback/index.html: .callg .cdl .cds .ci .cpg .cr .fbody .fgrp
