# Fresh browser allocations and evidence, 2026-10-13

The complete source gate passed at remote `c8525743f25e739f00ed441b8dcdd62a8cfccad9`
in the reused qualification checkout: 224 commands, 151 JavaScript syntax checks,
160 Node test files, 2,257 Node passes / zero failures / two skips; Python ran 500
tests with eight skips and no failures. Both ten-chapter journeys and all five
Briar cases passed. No browser ran as part of that source-only command.

Exact local receipts are under
`D:/07-GAMES/Firstlight/artifacts/village-resident-articulation-20261013`:
`REMOTE_SOURCE05_EXIT.json`, `SOURCE05_ADMISSION01.json`,
`REMOTE_SOURCE05_CONSOLE.log`, and `REMOTE_SOURCE05/`. Source admission observed
10,285,744 KiB free host RAM; the checkout remained clean at the same head.

## Why the next gate needs this change

The full verifier schedules 52 native commands. Its older callers did not all
check host RAM at each actual browser launch, and 26 legacy suites wrote into
fixed evidence directories. This change adds execution admission and fresh
output routing before the broad regression run. It changes no gameplay, save
schema, generated HTML, native assertion, timing bound or pinned source epoch.

`tools/browser_budget.py` wraps only individual native commands. The existing
suite starts its normal synchronous Playwright driver. Immediately before each
`launch` or `launch_persistent_context`, the wrapper probes fresh host available
memory and requires at least 6,291,456 KiB. Unavailable/invalid observations and
receipt failures refuse allocation. A caught refusal still makes the command
fail. Browser/context ownership remains with the suite; if logging fails after
allocation but before handing it over, the wrapper closes that exact allocation.

The five current Python-wrapper routes retain their interpreter, script, argv,
environment and cwd while recursively applying admission. Node earned-fixture
commands are unchanged. Only explicit in-repository Python scripts are admitted;
unknown interpreter/`-m`/`-c`/shell dispatch fails closed. This is deliberately
limited to the current synchronous caller topology, not a claim about arbitrary
future async, remote or external browser launchers. The whole verifier is not a
valid target: it owns separate CPU checks and temporary-file policy.

No post-spawn disk write prevents a suite from receiving its owned Python child.
At suite exit an unfinished tracked child is a failure. Cleanup waits five
seconds, then terminates only that exact owned child, waits five seconds, and as
a last step kills that exact child and waits five seconds. It never enumerates
or stops unrelated processes. Failure to record or clean one child does not
abandon the next. This does not certify descendant browser/driver closure;
existing native closure and persistence assertions remain responsible for that.

`SESSION.json` and per-process JSONL record the source head, runner hash,
requested target, parent/process identities, admissions and outcomes. These are
execution records, not gameplay success or performance measurements. They must
be read alongside the unchanged suite reports and command exit status.

## Evidence and temporary storage

The complete browser gate uses supported output contracts for every suite.
Legacy callers now share `tests/browser_support.py::browser_output`: configured
outputs must be absolute, bounded, fresh, and on D on Windows. Unconfigured
standalone callers preserve their legacy default. Reflection's image and report
derive from the same chosen directory. No source/fixture input is redirected.

Browser TEMP/TMP/TMPDIR are configured to an existing bounded D directory before
Playwright import/driver startup. Lightweight Python unit tests retain the
explicit `--cpu-temp` exception. No VM, Claude Code, personal save/profile,
service, billing or machine configuration is accessed. Reuse the existing game
and qualification checkouts; retain old negative evidence.

Example complete gate, using new output names for each real attempt:

```powershell
python -B tools/verify.py --browser --rule-workers 4 `
  --output D:/07-GAMES/Firstlight/artifacts/current-gate/logs `
  --browser-output D:/07-GAMES/Firstlight/artifacts/current-gate/browser `
  --browser-output-mode supported `
  --browser-temp D:/07-GAMES/Firstlight/cache/browser-temp `
  --cpu-temp C:/Users/Dom/AppData/Local/Temp
```

The full source controller must still observe the same fresh RAM floor before
launch. Four Node file workers and the original 180-second Node / 600-second
Python deadlines remain. A targeted runner smoke does not replace this complete
gate. GPU performance, human enjoyment and production acceptance remain open.

## Qualification at the implementation checkpoint

- Parent CPU run: 28 tests passed, no failures/skips, covering admission, caught
  receipt failure, exact owned-resource cleanup, child routing and all 26 actual
  legacy output initializers. Fake allocation/process cases are labelled CPU
  checks, not native-browser evidence.
- Integration CPU run: 44 tests passed, no failures/skips, including ten new
  tests and the existing storage, worker-budget and Earth cohort routing cases.
  Actual verifier dispatch was intercepted to confirm all 52 native commands
  receive the guard, CPU calls remain separate, arguments/cohort hashes survive,
  native timeouts are unchanged and refusal/timeout stops later native work.
- Separate source review checked the guard lifecycle and confirmed the 26 suite
  edits are import/output substitutions, preserving gameplay actions, timings
  and assertions. Pinned `tools/browser_support.py` and epochs04/05 are unchanged.

These are focused source/transport results. Fresh remote native smoke and the
complete current browser gate are still required; no result is inferred from
the earlier source-only pass or from this review.
