# RAVI's skills (from 2026-10-15)

These load in every chat or session that attaches this repo, on either of Mako's accounts.
RAVI's own rules come first: CLAUDE.md, STYLE.md and mako-records "RULE -- how a build runs"
win over anything a copied skill says.

| Skill | Use it for | RAVI's limits |
| --- | --- | --- |
| ravi-design | Any icon, page looks, hub or bar change; prior art first for any feature | Ours. Load first for looks work. |
| design-critique | Critique a sheet or page before Mako sees it | Fix what it finds; Mako sees the result, not the critique. |
| accessibility-review | Contrast, touch size, screen-reader checks | Mako is colourblind: shape or words always carry meaning. |
| design-system | Checking a change against STYLE.md, finding hardcoded values | STYLE.md is the system; a new rule only with Mako's yes. |
| ux-copy | Any words Mako or players read: labels, menu titles, empty states, errors | Plain, short, sentence case; no em dashes in anything Mako sends as himself. |
| write-spec | Turning a milestone or feature idea into a spec before design | The spec goes in mako-records ravi/next, not a doc elsewhere. |
| architecture | A data or structure decision (M10 tracking, M11 deckbuilder) | Zero runtime dependencies, static site, no recurring paid services. |
| debugging | A bug: reproduce, isolate, fix | The fix ships with a fail-first test (CLAUDE.md). |
| review-code | Reviewing a diff | Only when Mako asks (CLAUDE.md); report, change nothing without his say. |

Copied skills keep their licence (LICENSE.txt) and say where they came from (SOURCE.md).
Considered and not added (2026-10-15): obra/superpowers (its own plan, test and agent workflow
would compete with the build rule), security-guidance (calls an API on every edit),
claude-security (official deep security scan: a block of its own, see mako-records NEXT --
security scan of the app).
