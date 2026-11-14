# RAVI style notes: Feedback

Pattern: Rows (reference page: App settings)

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

Feedback (feedback/index.html)
- Its two lists (Planned, Recently shipped) are sections of the page, so they carry section heads (.shead, 17), not App settings' small group labels (.lb): a bend of the Rows pattern on purpose (Mako 2026-11-13).
- No lede (Mako 2026-11-07). Every line of Planned and Recently shipped is one short title on one row (.door.rec.cr) beside its page's icon chip in the page's colour (.ci; the whole app wears white and the hub icon), kind open with the chevron; a tap opens its detail under it, in place (.cx, lined up with the title at 60: the line in a sentence first (.cds), then the page's name lit and when it shipped or Planned in small print (.cpg)); no hairline between an open row and its detail, the hairline goes under the detail (app.css; the same for Rules' entries); a second tap closes it (Mako 2026-11-07 19:41: less wall of text; 20:24: open in place, not a menu; 20:37: no hairline, laid out as Rules' entries). Planned: one .doors group. Recently shipped: the three newest updates, a .doors group each under its date (.cdl; a version once testers start); All updates (.callg, a row with the count) opens #pall with every update. Then Send feedback: the form shown on arrival in one group (.fgrp; no fold row); the support plate; footer. Both lists come from data/changes.json (t a few words, d a sentence), kept by hand (records: RULE -- keep the feedback page's Planned and Recently shipped current). The bar's third slot is Send feedback (the pencil, as built, not chosen: the icon round picks it), which scrolls the form on screen (plan 2 M8.7 D1); Settings dimmed. (Mako's phone yes 2026-11-03)

Page-local classes (not in app.css; not Kit parts):
- feedback/index.html: .callg .cdl .cds .ci .cpg .cr .cx .fbody .fgrp
