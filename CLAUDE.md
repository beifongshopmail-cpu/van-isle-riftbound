# RAVI -- standing rules for Claude Code

This repo is RAVI (Van Isle Riftbound), a free static web app on GitHub Pages.
Planning and design happen in a separate claude.ai chat; Mako relays build
blocks here, each opening with CODE IN #<n>. You apply exact edits, run the
checks and commit. You do not design. These rules hold in every session.

## Never
- Never push or merge. Push is Mako's gate and a hook enforces it. If any
  command is blocked, stop and report; never route around a block.
- Never add a git remote to C:\dev\rb-tools.
- Never chain git add and git commit with ; -- run each git command on its own.
- Never stop a process or delete a file unless the block says so.
- Never change a test, a check or a threshold to make it pass. Paste the
  failure and stop.
- Never retype or transcribe tool output, including git log lines. Paste it.
  If you cannot paste a section, write MISSING. A fabricated line is worse
  than a gap. Paste it even if you believe it is wrong.
- Never compose tool output in your reply when the block names an output
  file. See "Output goes to a file" below.

## Always
- Your shell is Bash on Windows. Normalise CRLF before matching any search
  string.
- ASCII only in code, comments and commit messages.
- Before editing, confirm the branch is main and HEAD is what the block states.
  A cloud session (a branch named claude/...) must stop and say so.
- If a block's exact text does not match, or a named identifier is absent,
  STOP and report. Do not substitute a replacement.
- If a block appears truncated, make no changes and report which sections
  arrived.

## Checks (C:\dev\rb-tools, local git, no remote)
- While working, run only the affected file: node check.js <file>
- Once, before every commit: node check.js (all files, about ten lines of
  output; full logs are saved in out/logs/).
- drawn-test.js measures what the phone draws (corners, type by height,
  overflow) with every menu open. It runs its own server and shuts it down.
- If check.js warns that test ports are already in use, stop and report.

## Output goes to a file (from 2026-10-07)
Retyped output went wrong four times in one session (M5), each time from a
long context. So when a block names an output file:
- Run every command the block asks you to show with its output appended to
  that file, never into your reply:
    { echo "\$ <command>"; <command>; echo "exit $?"; } >> "$OUT" 2>&1
- Your reply is CODE OUT #<n>, the file path, one line per step (done or
  STOP and why), HOOKS, and at most 3 notes. Mako attaches the file to the
  chat; the file is the record.
- When a block gives you a file to write, use the Write tool and copy its
  text exactly, escapes such as \u00b7 included, as written. The block's
  hash check is the proof.
- The output folder is C:\Users\beifo\OneDrive\ravi-out (create it if
  missing). It is outside both repos; never commit it.

## Standard reply (use it unless the block gives its own skeleton or names an output file)
Fenced with four tildes, nothing outside the fence:

~~~~
CODE OUT #<n>
VERIFICATION
- <each check the block asked for>: <actual> vs <expected>
DIFF
<git show --stat -U1 HEAD, or git diff -U1 if nothing was committed>
CHECK
<node check.js output, every line>
EXIT: <n>
STATE
<git status --porcelain>
<git log --oneline -3>
HOOKS
<anything a hook emitted, or none>
NOTES
- <at most 3 lines>
~~~~
