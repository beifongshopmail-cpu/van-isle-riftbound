# RAVI style notes: New here

Read with STYLE.md (the core) before touching this page. Lines moved verbatim from STYLE.md sections 5 and 10 on 2026-11-03. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

New here (start/index.html)
- Two guides on one track (.gsel: New to Riftbound, New to RAVI; #ravi opens the second; vir.start.guide.v1 keeps the last one).
- New to Riftbound runs: What Riftbound is, then How to play, then At the store (Try it first, Your first deck, Signing up, Kinds of events, What to bring, The rules). How to play and At the store are labels over their cards (.lb.nprt, muted). (plan 2 M6 block 5; Mako's yes 2026-11-03)
- How to play is eight glass cards (.nsec): Your deck, The board, Setting up, A turn, Runes, Units and moving, Fights, Scoring. Each is a section head, a summary of one or two sentences, one picture (.nfig), then the detail under More: a quiet row under the card's divider (.nfo, data-k open, 44 high, Poppins 600 15, the chevron turning; the line is the event card's 1px at .07), opening .nmore in place with .reveal. Setting up is steps only, with no fold.
- Steps are a list (.nst) with a 34 by 26 marker (.nmk, --track, Poppins 700 12): numbers, or A, B, C, D, Act and End for a turn.
- Pictures are drawn in Kit tokens and words: every zone carries its name, and yours and theirs are written (.nsl), never shown by colour alone (yours --p1t with --p1r lines, theirs --p2t with --p2r, .nzy and .nzt). Corners inside a picture are page-local (5 to 12).
- The board is Riot's official mat (Mako 2026-11-03: his preferred layout, without the score track: points are kept on paper, dice, a dial or an app): Battlefield Zone, Legend Zone, Champion Zone; Base: Units + Gears, Main Deck; Rune Deck, Base: Runes, Trash, with the mat's own zone names (.nbd, a grid; zones .nz at 12, Poppins 600). Every name whole at 360.
- Card pictures are Riot's own, from cards/art (.ncd, .nrj, .nrr): Jinx, Loose Cannon; Jinx, Demolitionist; a Fury Rune; Grove of the God-Willow, all five deck pictures one width (Mako 2026-11-03). Domain symbols are Riot's rune files from cards/runes, unchanged: inline beside a Power cost (.nsy, 20) and the six domains under Runes' More (.ndom, 28).
- Units and moving is one grid (.nmv): the two battlefields with Ganking only between them, an arrow under the middle of each, then Your base across (.nmb). A card whose picture carries Riot's BANNED stamp is never used. An exhausted rune is the rune card turned 90 degrees (.nx).
- Facts come from Riot's own documents (the Core Rules and its How to Play booklets); a rule number shows (.nref, 12 muted) only where two sources agree.

Page-local classes (not in app.css; not Kit parts):
- start/index.html: .nsec .ntx .gsel .guide (two guides on one track: New to Riftbound, New to RAVI; #ravi opens the second)
- start/index.html, How to play (plan 2 M6 block 5): .nprt .nfo .nmore .nref .nfig .nst .nmk .nrw .nz .nb .nzt .nzy .nsl .nbd .ndk .ncd .nstk .nrn .nrj .nrp .nrs .nrr .nx .nad .nrd .nmv .nmg .nmb .nah .nar .ncb .ncs .nus .nu .ncn .ncr .ndots .nlast .ntk .nsy .ndom
