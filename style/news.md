# RAVI style notes: News

Read with STYLE.md (the core) before touching this page. A class this page defines that app.css does not is listed under Page-local classes (rb-tools style-lint checks it).

News (news/index.html; plan 2 M8.7 block 1, built 2026-11-07, waiting on Mako's phone yes)
- Reads data/feed.json (fetch-feed.js: Riot's Facebook posts through Muse, word for word; Riot's own playriftbound.com articles, cleaned as the rules watcher cleans them; RAVI's summary of each, written by Claude Haiku, else Riot's first sentence). Mako 2026-11-07: everything is read without leaving the app; only a video leaves, to be watched.
- .lede, then This week (when its data is there): one glass card (.wk) with two lists you read, no taps (.wkl): the three biggest price moves over 7 days (single cards at $5 or more, the arrow and the percent, never a colour), a line (.wkd), the top three legends from the Tier list's own maths (tier/tier.js); under it a Tier list action (.pact). Then From Riot with a count: one glass group of .door.rec rows (.nrow, kind deeper with the chevron), newest first: the day and the kind (12), RAVI's summary (15, up to three lines), Riot's article picture on the right (.nthumb, 64, corner 12) when there is one; NEW as Rules and Events (vir.news.seen.v1).
- A post opens its menu (#ppost), titled by Riot's article title, else the kind: RAVI's summary, Riot's picture (.npic, 16:9, corner 14), Riot's post (plain text, no links made), Riot's article (.rtx, cleaned a second time in the page; pictures only from Riot's CDN), the source line (.rsrc); a video post adds Watch on Facebook (or YouTube) with the out-arrow.
- The footer starts with the price source line (RAVI_STAMP) and the benchmark sentence, says whose words these are, and ends with Tell us.
- Bar: Hub, Go to, the third slot dimmed (Soon), Settings dimmed. Page colour Lilac 170,140,255, coloured glass (glass:true): as built, not chosen; the M8.7 colour pass settles it. Icon: the megaphone (whatsnew) Rules' Latest wore.

Page-local classes (not in app.css; not Kit parts):
- news/index.html: .empty .extl .mv .new .npic .nrow .ns .nsum .nt .nthumb .nm .nwatch .rlab .rsrc .rtx .wk .wkd .wkgo .wkl
