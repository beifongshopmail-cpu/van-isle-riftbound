---
name: ravi-design
description: How RAVI design work is done - icons, page looks, hub and bar changes, any visual review for Mako. Load before drawing or changing anything Mako will see on the phone, and before building any new feature (prior art first). Points to STYLE.md, the icon rule, the review tools in rb-tools/design, and the critique pass that runs before Mako sees anything.
---

# RAVI design work

Written 2026-10-15 in the icon chat, after Mako rejected two hand-drawn alternative icon sets.
The lesson: good-looking work came from a proven base plus rounds of Mako's picks, never from
inventing a system in one pass.

## Before anything

1. Read STYLE.md (app repo root) sections 1 and 4, and the records' RULE -- icons
   (mako-records ravi/rule/icons-how-they-are-drawn-and-how-they-ship-from-2026-10-07.md).
   STYLE.md is the rulebook; a rule may be challenged when Mako asks, but a change enters
   STYLE.md only with his yes to the quoted line, as its own commit.
2. Load the frontend-design skill for any visual direction or page design.
3. Mako is colourblind (red-green, some blue-yellow): shape or words always carry meaning;
   colour never does it alone.

## Prior art first (every feature, not only design)

Before building a feature or drawing an icon set, look for one that already exists:
- WebSearch with site:github.com and the feature in plain words; npm view <package> for
  packages (the sandbox reaches the npm registry; most other hosts are blocked from the shell).
- Keep only permissive licences: MIT, ISC, Apache-2.0, BSD. Never GPL code in the app.
- RAVI has zero runtime dependencies: adapt the code or drawings into the app's own files,
  with a one-line credit (source, licence) beside them. Never add a runtime package or CDN.
- Say what was found (or that nothing fit) in the design pass, in one line.

## Icons

- Start from a proven icon family, then adapt. Today's set is built on Lucide's construction
  (lucide-static, ISC): 24 grid, 2-unit round lines, round joins, art inside 2..22.
  Candidate families when a set is redone: Phosphor (@phosphor-icons/core, MIT; regular, bold,
  fill and duotone weights), Material Symbols Rounded (@material-symbols/svg-400, Apache-2.0;
  an outline and a filled form of every icon), Tabler (@tabler/icons, MIT), Iconoir (MIT).
  Fetch with npm into the scratchpad, never into the app.
- Hand-draw only the icons a family lacks (the hub grid, the scroll), in that family's style.
- Every icon has an outline and a filled twin; the filled one's inner details are real holes cut
  by an SVG mask (mask rects stroke=none, unique mask ids), never lines painted in a background
  colour. Icons live in pages.js's one SVG table (RAVI_ICON); bars are built by RAVI_BAR.
- One drawing should serve 22 to 24 in bars and 60 on the hub; a separate big version only
  when one drawing cannot do both.
- Each icon reads by shape alone and differs from every other icon in its bar.
- Riot's own art (runes, card symbols) comes only from Riot's CDN, unchanged as a file; how it
  is drawn may change (RULE -- Riot's policies). Mako, M5: no Riot Might symbol as an app icon.

## How a round runs

1. Draft on a sheet: node design/shoot.js design/icon-sheet.html out.png 402 "#A"
   (rb-tools). The sheet shows a set as the phone would: hub blocks, three bars with the
   you-are-here pill, then every icon outline and filled, big and small. Candidates use the
   schema in design/candidates.js.
2. Critique before Mako sees it: run the design-critique skill on the sheet (and
   accessibility-review where contrast or size is in question), fix what it finds, look at
   every icon at real size, and drop anything weak. Mako has caught faults chat called clean
   (M5: a stray mask frame; icons that did not stay filled).
3. Carry forward what Mako already chose. When a round redraws or rebuilds something he picked
   (a gear, a wrench, a weight), measure the new drawing against the chosen one: line, widths,
   sizes, holes, gaps, and the proportions between parts (a head to its handle), not one measure
   at a time. Keep every part he did not ask to change, and name every difference on the review
   page. When a rebuild drifts, go back to the picked drawing as drawn. (Icon chat, 2026-10-16: a
   rebuilt wrench came out with a handle half as wide as the one he picked; fixing the handle
   alone left its head too small; the round-head wrench replaced his pick without saying so.)
4. In place: put the picks into the real files on a local copy and shoot every affected page
   before and after with design/page-shots.js (402 x 874, installed-app mode; 360 where a
   rule asks). Measure, do not eyeball: gaps, squareness, sizes.
5. Sweep before every icon push (measure, do not eyeball): grep the whole app for every drawing
   of each changed icon (static markup, script strings, CSS masks), so no stray copy stays old;
   rb-tools design/icon-probe.js lists every icon the phone draws with its box and line, and each
   must match its kind: bar 24 / line 2; Go to 22; hub 60 / line 1.5, faded as one piece; a bare
   glyph in a round button 18 / 2.4; a drawn icon in a round button 18 / 2; a row chevron 16 / 2.2.
   Measure the hub icons as a set (box about 19.5 to 22 units, centred at 12). A family's
   "regular" weight is not the app's line: measure it at 24 first. Lessons behind this: records
   LEARN -- icon chat (2026-10-15/16).
6. Show Mako one review page (an Artifact, phone-first): before and after, what to look at,
   one recommendation, and only the picks that are genuinely his.
7. Nothing reaches main until he says yes; unfinished work parks on the branch wip.
