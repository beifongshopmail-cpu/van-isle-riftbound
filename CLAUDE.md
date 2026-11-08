# RAVI -- standing rules for Claude

This repo is RAVI (Rift App, Van Isle; the repo keeps the old name Van Isle
Riftbound), a free web app at https://ravi.tools on GitHub Pages, with its
server in server/live. One claude.ai chat, on either of Mako's accounts, does
a whole block (several while the chat stays quick; Mako 2026-11-02): design
with Mako, build, test, push, record. There is no relay
and no PC step. The method in full: mako-records
ravi/rule/how-a-build-runs-from-2026-10-04-agent-pushes-from-2026-10-07-ch.md.
Design rules: STYLE.md. These rules hold in every session.

## Never
- Never merge, never force-push, never rewrite pushed history. The only
  branches are main and wip (see "Wrap up").
- Never change a test, a check or a threshold to make it pass. Teach a test
  a new shape only when a looks change Mako approved breaks its assumption.
- Never retype tool output as if it were pasted. Quote it, or say it is
  missing. A fabricated line is worse than a gap.
- Never add a STYLE.md rule beyond what Mako signed off on the phone without
  his explicit yes to the quoted line. Lines that record a build he signed
  off go in without a separate yes, once checked against the shipped code
  and the latest records (STYLE.md section 12; Mako 2026-10-29).
- Never call a change done before Mako says so.
- If a tool or command is refused, stop and say so; never route around it.

## Always
- ASCII only in code, comments and commit messages.
- Clone the app and rb-tools side by side; work on main.
- Normalise CRLF before matching any search string (files may have either).
- Recon before editing any file not read in this chat.

## Before any change Mako will see (Mako 2026-11-03)
- Read STYLE.md in full (the core, under 500 lines) and style/<page>.md for
  every page the change touches. Every time, even for a small fix; never
  build a part from memory or from scratch.
- Build from the Kit (STYLE.md section 5): name the Kit parts the change uses
  before writing it. A part the Kit lacks uses Kit tokens and surfaces, and
  its class goes into that page's notes in the same commit.
- A new page gets its style/<page>.md in the same commit as the page.
- Run node style-lint.js (rb-tools, seconds) before the push. It fails on an
  unlisted class, a typed colour or size, type off the rungs or a missing
  guard script. Its baseline (style-baseline.json) only shrinks; never add
  to it.

## Checks (rb-tools, private, branch master)
- A logic change gets a test that fails on the unedited app and passes
  after; both counts go in the commit message.
- Before a push: the change's own test, and the suites of the pages and
  parts the change touches: node check.js <file> <file> ... They pass.
- The full sweep, node check.js (all suites, about 25 minutes, run in the
  background), runs once at the end of each milestone, before its
  close-out, and before anything goes to testers; not after every change
  (Mako 2026-11-01). A failing suite there is fixed before the milestone
  closes, except a check on the rule's SANDBOX-ONLY list that the
  milestone's changes do not touch.
- drawn-test.js measures what the phone draws (corners, type by height,
  overflow) with every menu open. It runs its own server and shuts it down.
- m4-test T29/T30 may fail once on a run that crosses midnight: rerun,
  never loosen.

## Push
Mako's call: on RAVI the session pushes. A bad push is undone with git revert.
- Stage by name. A STYLE.md rule is its own commit.
- The app: git pull --rebase origin main, then git push origin main, each
  its own command. 'cannot lock ref' means the data refresh landed in the
  same minute: pull and push once more, then stop if it fails again.
- rb-tools: git push origin master. One private remote, origin; never add
  another.
- After pushing the app, wait for the 'pages build and deployment' run for
  that commit to succeed, then tell Mako it is live and what to check on
  his phone (iPhone 17, 402 x 874).

## Wrap up
A cloud session loses anything not pushed when it expires. When Mako says
'wrap up', or before the chat ends: if the affected suites pass, push as above; if
not, commit to the branch wip and push wip, never main. Then update the
milestone's handoff record in mako-records ravi/next/ and MAP, and push
mako-records. The next chat starts from wip, finishes on main, then
deletes wip.

## Reviews and audits
- Run the review-code skill or a design review only when Mako asks; report
  findings and change nothing because of them without his say.
