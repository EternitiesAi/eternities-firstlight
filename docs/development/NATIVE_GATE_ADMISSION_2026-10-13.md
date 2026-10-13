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

## Fresh remote execution and the first complete attempt

The reused checkout was freshly fetched and switched to exact implementation
`1ca07f7b9179f925575f0ccf3e63dc14cfad1e81`. Its narrow historical refspec did not
populate the new remote-tracking branch on a generic fetch; the first readback
therefore failed before switching. An explicit branch fetch verified FETCH_HEAD
and the remote branch identity, then installed the exact clean checkout. The
existing remote/refspec configuration was preserved.

At that head, 38 relevant CPU checks passed again. Real native-origin persistence
passed 11 checks across two whole-browser launches, with exact served page,
Map/Character controls and a labelled synthetic notebook event through production
save/restart/load. The real nested Python Earth presentation caller passed 46
checks. Its earned state and synthetic camera/body placement retain their original
labels; this does not qualify an ordinary-control outing or a follow-camera UI
selection. Selected actual pixels were inspected.

Three actual browser allocations recorded 9,392,276 / 9,151,100 / 9,097,816 KiB
free host RAM, each above the floor. Parent and child admission logs terminated
with zero process status; the existing native cleanup code executed, and the
checkout remained clean. These traces do not independently prove descendant
closure. No new video or full game copy was made.

The first complete attempt, REMOTE_BROWSER01 at the same head, was admitted with
9,207,212 KiB free host memory. Its unchanged game rules passed 2,257 tests with
zero failures and two skips. Python ran 538 tests and stopped with two failures,
three errors and eight skips. All five affected cases were older synthetic
`test_verify_onboarding.py` callers that pre-created the log directory now
correctly refused by fresh storage admission. No native command ran in that
complete attempt. Its failed receipt and full Python output are retained alongside
the successful targeted smoke, without relabelling it as a complete pass.

The follow-up repairs only those synthetic callers: stage their exact input bytes
until the source transport publishes them, use explicit existing CPU temp, and
observe unchanged target argv after verifying the new wrapper fields. Keep every
ordering, cohort, timing and failure-propagation requirement. Complete current
qualification remains pending until the rerun's final receipt.

The bounded published [evidence index](../evidence/native-budget-2026-10-13/EVIDENCE_INDEX.json)
contains exact receipts, CPU logs and a byte-preserving gzip of the Earth report
and failed Python output. Raw screenshots and temporary native state remain local.
Hosted run38480170971 again failed before starting because GitHub reported an
account billing lock. No billing action was taken.

## Repair and deferred fresh run

The test-only repair is pushed at04fd08ce768cb886abdffa788d8148c0a9068b3d. Its
19 focused onboarding cases and86 verifier cases passed (the86 include one
existing Windows platform-fixture skip). A separate read-only review checked
preserved ordering, cohort, timeout, suite-count and intended failure injection.
The clean reused remote checkout now contains that exact commit.

REMOTE_BROWSER02 was refused before launching verification at23:03:25Z:
5,403,692KiB free host memory, below6,291,456KiB. No native/source worker ran and
no02 output directory exists. Preserve the admission receipt and original failed
01 result. Continue independent lightweight product work; another full attempt
needs fresh paths and fresh admission. No VM or unrelated process was inspected
or stopped. Complete qualification remains pending.
