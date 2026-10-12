# Reuse unchanged specimen geometry in acceptance checks

Base: 54ad4b1021f9876531cfe58ea8c1d621fdeb1b3f / draft PR68.
Branch: verification/geometry-oracle-work-20261012. Parent implements; the
existing colleague independently reviews source without product execution.

The complete Source03 rule attempt still FAILED at its original 180-second
limit. Its partial TAP has no footer; later Python/journeys did not run. No
cause is established. Timing review identified two geometric acceptance
oracles repeatedly regenerating identical part meshes and transformed bounds
for every route and anchor. This change removes only that redundant work.
It is not a runtime, renderer, game-performance or companion-policy change.

Elderweald composes one matrix per vertex traversal. Within each freshly
generated quality specimen, a lazy bounds map keeps the complete default
wind-expanded bounds per part while preserving the original assertion order.
Fieldcraft reuses the bounds already computed for that part in its current
pose/state. Both helpers keep the exact original full-body interval arithmetic,
.31 radius, 1.7 height, floor+.03 and thresholds. No global/cross-pose cache.
Fresh bounds remain available for the lowered-root, wrong-roll, detached band
and other mutated counterexamples. Every original 48-pose, vertex, normal,
route, anchor, contact and ownership assertion remains.

Evidence: D:/07-GAMES/Firstlight/artifacts/geometry-oracle-work-20261012.
The same delegating operation observer ran the original and changed two files;
it wraps actual geometry/matrix/assert calls and returns their original results,
with no mock geometry or acceptance substitution. BASE_OPS01 closed34pass /
0fail / 0skip, 10,196.6932ms; AFTER_OPS01 closed34/0/0, 2,148.2472ms. Host
conditions were not controlled. These two timings are observations, not a
general throughput or CPU-memory guarantee.

PAIR01 verifies exact equal per-method assertion counts in each file:
**251,433 observed assertions**, all34 methods retained. Operation counts:

| Component | Operation | Before | After |
| --- | --- | ---: | ---: |
| Elderweald | geometry requests | 64,474 | 8,308 |
| Elderweald | matrix compositions | 3,609,275 | 4,865 |
| Elderweald | vertex transforms | 5,028,625 | 453,649 |
| Fieldcraft | geometry requests | 81,419 | 5,258 |
| Fieldcraft | matrix compositions | 23,735 | 2,959 |
| Fieldcraft | vertex transforms | 2,926,982 | 185,186 |

Plain GREEN01 then ran the actual two components without any observer:
**34 pass / 0 fail / 0 skip**, 1,673.9453ms. The actual builder closed exit0;
both existing pages remained unchanged and byte-identical, 3,319,540bytes,
SHA2567855015a4ec987795b94b1a6644bad5fd123cdf98f95e7b0905a72f63455b55d.
No HTML update, additional full build copy, media, profile or asset is added.

The source reviewer independently reversed only these intended helper/loop
edits in memory and reproduced both clean54ad hashes exactly. All other bytes,
34 test declarations and original assertion/counterexample statements remain.
The colleague executed no product module, test, benchmark, Git or browser.
Parent execution results and source-only review remain distinct.

## Fresh remote and complete Source04 attempt

Pushed94189d5f31de29b2049ef25776ddde5f47d6773b was normally fetched into the
reused independent clean qualification clone. The two components passed34 /
0 / 0 in21,796.4325ms; actual build exit0 kept identical pages and clean Git.
Host conditions differ from the paired observation; no controlled speed claim.

Complete REMOTE_SOURCE04 was admitted immediately after Git/network preparation
at10,405,800KiB free host memory. Build/all142 syntax passed. The complete
main Node suite passed2107 / 0 / 2 existing skips,2109 total,51,765.4825ms.
Python then FAILED:469 tests in86.811s,4fail / 1error / 10skip. All five
failures were tests/test_roadkeeper_expectations.py: its historical helper
pin refused the later reviewed consignment diagnostic helper before the
intended ART guard. Later command-earned journeys did not run. The closed
receipt retains exit1, same94189 head and clean Git; cause of the older
timeouts remains UNKNOWN. Raw failure evidence is unchanged under
D:/07-GAMES/Firstlight/artifacts/bounded-rule-workers-20261012/REMOTE_SOURCE04.

The bounded fixture repair changes only tests/test_roadkeeper_expectations.py.
It transports a copied expectation document in RAM with the single literal
reviewed consignment LF pin079b8d4efb5179a0e4d55e2fb47d3988878b7bb54ccef5a4bb0b2e52a8474c8b
from the independent actual-diff checkpoint in NATIVE_RESTART_EVIDENCE_2026-10-12.md.
The original JSON/driver/raw helper pin and all ART pins remain unchanged.
It adds detecting controls: real frozen JSON still refuses the newer helper;
unreviewed actual helper bytes and an unreviewed helper pin both refuse under
the declared view. All four original ART negative errors stay exact. These
synthetic expectations confer no native/source admission. No accepted digest
is derived from unknown current bytes. Component PIN_COMPONENT01 passed all
eight tests in4.326s; final explicit synthetic naming and nonnested contexts
then passed all eight in0.840s (PIN_COMPONENT02). Independent source review
found the single-pin design sound and
verified the remaining real source/page/hook operands without execution.

The original142 rule files,214 ordered source commands and180/600-second
budgets remain unchanged; Python gains three strict detecting cases. A fresh
exact pushed clone and complete gate with immediate at-least6GiB host free
memory are still required after this repair. Neither operation reduction nor
focused successes waive complete acceptance. Actual native remains separately
unqualified and its older frozen expectations continue to refuse newer callers.

## Complete Source05 passes at the pushed implementation head

Draft PR69 stacks against PR68/54ad. Its implementation head
49cd5d6adbe4029147cbaa14dd0cc7788b3c3561 was normally fetched into the reused
clean independent clone. The final eight-case fixture passed there in11.508s.
Independent source review accepted the actual final adapter bytes
(6275B /SHA2560d6fb4e19c7acaa49965de7a1f09b637bddad54ab4e52c5b12dcbf5c8fda57ae)
without executing tests, Git, product code or browser.

The unchanged complete command then CLOSED PASSED/exit0 at that exact49cd
head, same head afterward and clean Git: all214 launched source commands
passed. Admission free host RAM8,030,164KiB; closure8,414,564KiB. Scope is
host-only; this is not a measured total-memory or VM-performance guarantee.
Build/all142syntax pass, checked-in matching pages remain3,319,540B /SHA256
7855015a4ec987795b94b1a6644bad5fd123cdf98f95e7b0905a72f63455b55d, staleInput false.
Main Node2107pass /0fail /2existing skips,2109total,53,302.3624ms.
Python472tests in83.461s, OK with10skips. The road-account CPU preflight
passes14tests with1 explicitly missing-native-input skip. All later original
command-earned journey/cohort/preflight stages completed, including the
whole-draft earned stage7/0/0 with2variants. These counts are per-stage,
not a deduplicated aggregate across wrapped journeys.

Exact command: Python313/python.exe -B tools/verify.py --rule-workers 4
--output D:/07-GAMES/Firstlight/artifacts/bounded-rule-workers-20261012/REMOTE_SOURCE05
--cpu-temp C:/Users/Dom/AppData/Local/Temp. Controller9fac3fe170a72d3bbd045f08484e3ee38cb88656a11cf5e9adee101d8b6d5e0a;
rule command record ee919d4d28cd8dc6836f91de1ffcb59aa974173718220c2319b7166bcdd295f9.
Closure receipt REMOTE_SOURCE05_EXIT.json; console14150B /SHA256
211b1ad61c4b563a2de3084fa3459a9f33a1011b7fbdf3f1fdb0069900cd76fa.
Start23:39:26.7193210Z, close23:44:36.7665544Z. All own tool sessions closed.

This later record update is documentation only; the full gate above is at49cd,
not any subsequent record commit. Current browser/native/GPU/actual footage/
human acceptance remains unqualified and must not reuse stale sealed epochs.
No runtime change or new playable system is claimed by this repair. Preserve
all previous failures. Goal ACTIVE unfinished; heartbeat remains PAUSED.
Retain Source01/Source03 timeout, Source02 false admission, native startup and
garden-framing failures. VM/Claude/personal saves remain untouched. Source
schema World9 / Adventure12 / WildSigns1 and all runtime systems/both cameras
are unchanged. Goal ACTIVE unfinished; heartbeat PAUSED; no merge/deployment.
