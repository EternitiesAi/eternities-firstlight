# Fenna and the remembered delivery load

Dom was away and requested screenshots while development continued. This is an
original bounded presentation pass on `gameplay/fenna-drover`, stacked on PR 26
`gameplay/ansel-millwright` at `fd56ca00c0b66e65e3df05bdb0326918fa6c72b7`.
Source implementation: `927ca4eead04844da6c717c8db923083d685209e`. The delivery PR carries final pushed-head,
fresh remote-clone and hosted-run receipts; this source checkpoint is separate.

## What is playable

Fenna has a rust weather coat, scarf, satchel, stout boots and an actual hand-held
rope coil. Proper 3D limb segments connect shoulders, elbows and hands. She stays
at (8.8,5), yaw -0.6, until the existing explicit dispatch moves her to (2,-43).
The cart keeps (9.3,7) / (-3,-43). Its slatted bed, rails, axles, wheel rims/spokes,
flour sacks and apple crate use existing box/round/octa groups only.

The four wheels meet actual Earth height at their footprints; the old wheels
floated 14.3–16.6 cm. Short front shafts stay clear of Fenna and the established
gathering cloth approach. The actor uses 66 parts; complete actor/cart submission
is 139 before arrival and 130 afterward, under the declared 160-part budget.

`earth-story.js` remains the sole acceptance/dispatch/arrival/payment owner.
Dispatch relocates the still-loaded cart without confirming arrival. Accepted
arrival shows two remaining sacks, an empty apple crate and a folded cover,
beside the existing prepared table. The sack count is authored visual shorthand,
not an inventory rule or claim about canonical quantities. Claiming payment
does not reset or repay the scene. Fenna holds her own coil; no rein to an
unseen animal, pushing contact, schedule or physical escort is implied.

Motion reads simulation time, freezes through dialogs/explicit pause and holds
one complete reduced-motion pose. A read-only diagnostic copies actually
submitted parts and clears on scene departure. No texture, shader, pass,
renderer, navigation solid, player palette/equipment or saved state was added.
World/key 9, adventure 10 and nested save versions stay unchanged: no migration.
Stored XP, choices, gear/sockets/fittings, complete character worlds, companion,
housing/crafting, personal scores/exports and once-only payments keep their owners.

## Executed checks

Full local verifier: **57 syntax modules, 665/665 Node tests, 53 Python passes + 1 existing Windows skip, 24 command-earned journeys and 1,544 browser assertions across 18 suites; zero failures**. Earth-story browser: 233/233. Eight new geometry
tests cover anchors, real wheel ground, shared coil grip, connected transforms,
state projection, reduced motion, gathering clearance and actor/shaft separation.
After the local full run, the complete Node gate was refreshed once to include
the reviewer-requested exact octahedral test bounds; those results are recorded
separately. The implementation HTML was unchanged by that test-only refinement.

Commands actually executed: `python build.py`, focused Node/browser checks,
`python tools/verify.py --browser`, and the complete Node test gate. Both generated
HTML files are byte-identical: 2,236,278 bytes, SHA-256
`80acee81727b5a030f6569e41ff1966cc3330400223bfda2df1d1155774fe079`. Current full verification covers 24 earned journeys, both
weapon families and returning fixtures, native isolated persistence, all campaign
paths, camera/control/modal boundaries, music/exports, construction, companion,
map/cutaway/reflections, classes/characters, observations and gathering.

The browser verifies unaccepted, accepted, dispatched but unconfirmed, reload,
arrived unpaid, arrived reload and paid states against real UI/rules. Normal-time
frames record visible page, running/pause/reduced state and actual submitted coil
and hand motion; capture-mode acceleration remains labelled separately.
Isolated production actor/coil pixels: perspective 17,460/977 changed channels,
orthographic 55,087/3,024, WebGL error 0. The isolated image is not gameplay.

Actual screenshot files in [evidence](../evidence/fenna-drover/README.md) show
loaded departure and confirmed arrival, in both cameras. The silent
45.12-second 1280×720 video uses 36 normal-time
accepted walks/UI actions from an earned fresh-bow source, spends exactly 2 of 4
timber, explicitly dispatches/confirms arrival and leaves payment unclaimed.
Full MP4 decode exited 0. Encoded frame rate is not game FPS.

## Measured desktop cost

Matched old/new source builds, serialized after browser gates: NVIDIA GeForce RTX 3080, 610.74, 10240,
Chromium headless 143.0.7499.4, confirmed ANGLE/D3D11 hardware WebGL2,
1920×1080 drawing buffer, balanced quality. Four cases ×360 normal RAF intervals
per build, same earned fixture/setup; no video or accelerated ticks during samples.
Diorama uses the explicit close half-width 8 in both builds.

| Scene | Before P95 ms | After P95 ms | After maximum ms | After >33.333 ms |
|---|---:|---:|---:|---:|
| Fenna loaded at the mill fork · third person | 16.8 | 16.7 | 16.8 | 0 |
| Fenna loaded at the mill fork · diorama | 16.7 | 16.8 | 16.8 | 0 |
| Fenna delivered at the west road · third person | 16.7 | 16.7 | 16.8 | 0 |
| Fenna delivered at the west road · diorama | 16.7 | 16.7 | 16.8 | 0 |

Exact geometry metrics, raw intervals, driver/acceleration and fixture/setup/build
hashes are retained in GPU_BEFORE/AFTER/COMPARISON. Existing shadow cadence may
change total draw calls; do not infer a render-pass reduction. Existing 16 mapped
timber instances, texture storage and material/pass families remain unchanged.
These short quantized headless intervals are not GPU completion time, monitor
presentation, sustained 60 FPS, comfort or Unreal qualification.

## Failures, review and limits

Initial focused source/browser runs passed 41 source tests, then 228/228 and 233/233 browser checks, but did
not detect a waiting shaft intersecting Fenna's coat/thigh. Parent found it;
the reviewer independently confirmed exact 3D intersection. The added regression
passed 7/8 before shortening the shaft; the clearance test failed. The initial full verifier was stopped
while running Cosmos, retaining partial logs/STOP/INTERRUPTED receipts on D; it
is not counted as final verification. Corrected source reran the complete gate.
The collaborating reviewer checked 1,500 state/pose samples with full shape
bounds: zero shaft/actor intersections, no remaining source/math blocker. This
is collaborating review, not outside certification. The completed wider
1920×1080 departure/arrival screenshots were also reviewed: full cart extent and
changed cargo were readable in both views, no remaining art blocker. The lower
HUD slightly overlaps the nearest departure wheel; human taste is still pending.

Early departure third-person screenshots cropped much of the cart. Final wider
hardware captures resolve that framing; old photos remain labelled historical.
The report aggregation helper initially expected 460 rather than the commanded
360 samples due to an overbroad helper replacement. Both measurement commands
had succeeded; the expected count was corrected to 360 and aggregation/video
resumed in new receipts without remeasuring. The original failed receipt remains.
The initial incorrect filename lookups caused no writes. Failures and raw logs
remain in `D:/07-GAMES/Firstlight/artifacts/fenna-drover-2026-10-01`.

Human recognition, beauty, camera comfort and earlier combat/reward/discovery/
gathering acceptance remain pending. Dom has not supplied a new playtest here.
The cast remains primitive prototype geometry; no mesh/skin import, escort
simulation or final costume/canon approval is claimed. No main merge, public
deployment, paid-provider use, account billing change or personal-profile access.
