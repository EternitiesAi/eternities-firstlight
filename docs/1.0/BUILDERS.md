# rules for every builder lane

read `docs/1.0/BRIEF.md` and `docs/1.0/SAGA.md` first. you own one lane, listed in `docs/1.0/LANES.md`.

## where you work

- your worktree is `D:/firstlight/lanes/<lane>` on branch `lane/<lane>`, cut from `build/whole-20261113`. work only there.
- docs/evidence is not checked out on purpose. never add files under docs/evidence.
- edit only the files your lane owns. if you must touch a shared file (`src/app.js`, `src/shell.html`, `build.py`,
  `src/core.js`, `src/rpg-ui.js`), keep the edit small and self-contained (a new hook line, a new case, a new entry),
  and name it in your report. never reformat or reorder lines you did not need to change.
- code with a backslash goes through the edit or write tool, never through a shell string or heredoc.

## how the code works (short)

- every src file is `(function(G){ ... G.RealmX = api; if (typeof module!=='undefined') module.exports = api; })(globalThis);`
  and imports with `G.RealmY || require('./y.js')`. a new module needs an entry in `build.py` (the list near line 162)
  and a placeholder in `src/shell.html`, in dependency order. a missing placeholder fails the build; a missing build
  entry is silently skipped, so check it.
- state changes go through commands (`sim.act`, `sim.adventureCommand`, module `command(ctx,type,payload,io)`), never
  direct UI writes. saves are validated strictly; a new persisted field needs `fresh`, `validate` and a migration that
  keeps old saves loading.
- the code style is dense. match it. no tutorial comments. a short comment only where the reason is not obvious.

## how you test (memory is tight on this pc: luna lives here)

- locally: `python build.py`, then `node --test tests/<your files>.test.cjs tests/core.test.cjs` (at most ~6 files at a
  time). never run `tools/verify.py` or any browser suite locally.
- on the aws box (8 cores, 30 GB, nvidia l4), through the door `bash D:/firstlight/box/fl-box.sh`:
  1. commit on your branch, then `bash D:/firstlight/box/fl-box.sh push lane/<lane>`
  2. `bash D:/firstlight/box/fl-box.sh run lane/<lane> <lane>-v<n> -- flock /work/verify.lock python3 tools/verify.py --output verification`
  3. `bash D:/firstlight/box/fl-box.sh status <lane>-v<n>` until it shows `exit=`; read the summary lines.
  the full verifier takes a while and is queued behind others by the lock; run it once your lane is complete, then
  again after fixes. read the pass/fail counts from the log. a skip is not a pass.
- tests that encode the OLD design (old story text, old gating, the 168 hp regent, fees on the main path) are updated to
  the new design when your lane changes that design on purpose. say which assertions changed and why in the commit
  message. never delete or weaken a test of save safety, migration, duplicate-command refusal or transactions. never
  remove a test to get green.

## the voice of the game

- characters talk like people. warm, plain, a little wry. no compliance prose ("this records a victory, not a claim"),
  no disclaimers, no fees on story beats, no developer words (prototype, provisional, epoch, realm 10, luna, fixture).
- ui labels and buttons in sentence case. names as written (Briar, Oren, Tessa, the Regent of Ash).
- the envoy's first lines (`src/adventure.js` near 389) are the tone to match.

## commits and reports

- small commits on `lane/<lane>`, each message saying what changed. end every commit message with
  `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>`.
- do not push to github, do not merge, do not touch other lanes' worktrees. the lead integrates.
- your final report (your last message) is at most 300 words: what you built (file:line), what tests ran where and their
  exact counts, the box run name and its result, shared-file edits, and anything unfinished. never claim what you did
  not run.
