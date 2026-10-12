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

The original142 rule files,214 ordered source commands and180/600-second
budgets remain unchanged. Fresh exact remote focused checks and one complete
gate with immediate at-least6GiB host free memory are still required. Neither
the operation reduction nor the paired results waive complete acceptance.
Retain Source01/Source03 timeout, Source02 false admission, native startup and
garden-framing failures. VM/Claude/personal saves remain untouched. Source
schema World9 / Adventure12 / WildSigns1 and all runtime systems/both cameras
are unchanged. Goal ACTIVE unfinished; heartbeat PAUSED; no merge/deployment.
