# Village residents: qualified animation and commons camera repair

[PR76](https://github.com/EternitiesAi/eternities-firstlight/pull/76) remains open,
stacked on PR75 at708411ebe85d9bca75b0e13964564174ec1b61cb. Runtime/test commit:
`d8d07ad8d34afc1371e13c39e0a685c2a4a61d94`. Tested remote checkpoint:
`890d409c3f1610aad923d7b30d00384425230152`. Later delivery records are on separate
[PR77](https://github.com/EternitiesAi/eternities-firstlight/pull/77); its helper
source commit is a66756433601fbac90521ce9dbb37e9727e94957.

Ilan, Mara and Oren use distance-driven articulated walking and settling in their
existing routines. Instrument, notebook and folding rule attach to solved hands.
The adapter preserves palettes, scene membership and transient per-resident/world/
scene ownership. No quest, reward or resident intelligence change. Four commons
seats now fit the existing navigation footprint and keep their padded backs below
the follow-camera pivot; this repairs the reproduced close-up without changing
Core obstacles or invalidating old positions. Other seats remain unchanged.

## Current evidence at clean remote890d409

| Check | Actual result |
|---|---|
| Complete Source04 | 224 commands passed;151 syntax modules;160 Node files |
| Node rules | 2257 passed,0 failed,2 skipped (2259 total) |
| Python | 490 run,8 skipped,no failures |
| Earned journeys | Both ten-chapter variants and all five Briar cases passed |
| Native04 | 168 checks passed;both requested cameras,all three residents |
| Mara CORRIDOR03 | 28 checks passed;32 ordinary RAF frames,26 inside the repaired corridor;minimum camera distance4.327875m |
| Final gameplay clip | 44 seconds;1100 frames fully decoded;5,325,769 bytes;no retiming |

Commands: `python -B tools/verify.py --rule-workers 4 --output <REMOTE_SOURCE04>
--cpu-temp C:/Users/Dom/AppData/Local/Temp`, then `python -B qualify_family04.py`
and `python -B qualify_corridor03.py` from the external task artifact directory.
Exact argument, source, controller, admission and closure receipts are published.
Original Node180/Python600 deadlines remain. Source admission was6,340,208KiB;
the three Native04 browser admissions were8,504,240/8,132,448/8,606,628KiB; corridor
admissions were7,366,168/7,302,496KiB. All exceed the6,291,456KiB floor. Browser
admission occurs after driver startup. All owned browsers/drivers/servers closed.

Both regenerated HTML files are3,415,558 bytes, SHA256
`6e4bc861f4f55267f57a397fc442ff26a75af36d2cfb9a56fb8c03b664ce8afe`.
STATION is reused and clean at the tested remote commit; no new clone was created.

## What the browser evidence demonstrates

Actual Settings, People, Follow, P and home controls exercised three residents in
both Adventure and diorama views, their settled poses and home anchors, reduced
motion and exact nonempty production-save readback after closing and restarting
the whole browser. Preparation, settled and interior checks use labelled accepted
accelerated Core ticks. Moving samples and recording use ordinary RAF, without
actor/phase/item/reward injection. Render-only observation preserves saved state.

Paused images retain full before/after simulation and submitted geometry operands;
camera easing can continue, so its brackets remain explicit. Actual pixels were
inspected. Corridor03 separately crosses the previously troublesome bench route;
it does not certify every camera angle or place. Deep camera snapshots retain
each sampled frame. A legitimate nonwalking waypoint frame is accepted only with
canonical route membership, remaining path and actual next-frame continuation.

Chrome155 at1280x800 uses software WebGL2/SwiftShader and Low quality. The primary
recorder lifetime was67.3303s through browser/driver closure; its100s acceptance
cap is not an OS hard watchdog. The final44s clip trims raw seconds20–64 and includes
UI and paused observation as well as real movement. VP8 encoding used one CPU
thread. Full decoding emitted1100 frames through the supported image2/PNG path.
Bundled ffmpeg lacks fps/tile filters and the null muxer; failed first processing
attempt logs remain. No human feel, GPU frame-time or RTX qualification follows.

## Preserved failures and repairs

- The first full source run's homecoming host omitted the new module. Its loader
  was repaired without weakening assertions. Earlier Source02 at166550d passed
  224 commands/Node2256/2skips/Python490/8skips; Source04 supersedes that epoch for
  the current runtime. Source03 refused RAM admission and ran no suite.
- Source review rejected Mara's long closed hem; she keeps the shared short jacket.
  Actual thigh-triangle clipping rejected Oren's first apron. Raising its lower
  edge to local y=.87 passes120 gait phases per motion setting; not cloth simulation.
- Native01 failed browser launch; observed owned PIDs were subsequently absent.
  Native02 refused admission. Native03 at166550d failed one of65 checks when Oren
  legitimately arrived home, and actual pixels exposed Mara's bench close-up.
  Its earlier camera sample was not the screenshot's exact frame. CPU reproduction
  found padded bench-back containment and the conservative .45m fallback.
- Current seats fit Core's existing .65m reservations and have back tops atworldY2.46,
  below2.8 focus after .3m padding. Enlarging obstacles was rejected to preserve old
  saved coordinates. Actual corners and outward/homeward route checks pass, both
  motion settings. Native04 and Corridor03 now supply current rendered evidence.
- CORRIDOR01 remains failed: it incorrectly demanded walking:true at every frame.
  All28 observed corridor scalar distances were>=4.32748m, but this does not turn
  the failed run green. Its buffered camera.center arrays alias the later live
  center; do not treat those centers as exact historical per-frame positions.
  CORRIDOR02 retains that old trace implementation and refused its second browser
  at6,263,180KiB. Its first preparation was accepted; no moving witness completed.
  All resources closed. CORRIDOR03 corrects snapshots/waypoint expectations, explicitly
  selects Low through actual settings and passes the unchanged camera boundary.

## Compatibility, storage and remaining gates

World9/Adventure12 and persistence owners remain unchanged. Core, Adventure,
Arsenal, Characters, Creative, RealmGiversArt and generic person() are preserved.
No personal save was inspected. Family submitted geometry changes from78 to146
instances and22,184 to25,948 triangles without a new mesh type/dynamic batch;
this is a CPU geometry budget, not a performance measurement.

Current receipts, selected images and the final clip are under
`docs/evidence/village-resident-2026-10-13/current-890d409/`. Byte-exact gzip reports
and a ZIP of227 top-level source logs avoid plaintext/whole-game duplication.
Raw videos, nested earned-journey output and the reused synthetic profile remain
local. Earlier checkpoint-d8d07ad receipts and negative footage are preserved.
The source log ZIP is not a claim to include the nested journey output trees.

The complete current `--browser` gate remains pending on PR77's reviewed epoch05
helper branch;34 focused local/remote CPU passes do not establish it. Resident
Source04 does not count as full-source execution at that later tooling head.
Hosted run38473931523 failed before jobs began: GitHub reports an account billing
lock. No billing action was taken. Dom's recognition, stride/prop connection and
camera-comfort questions remain pending in the human playtest route. Production
is unfinished. VM/Claude/personal profiles and unrelated workers remain excluded;
no new game checkout, cleanup, merge, deployment, paid work or heartbeat resume.

Full local evidence: `D:/07-GAMES/Firstlight/artifacts/village-resident-articulation-20261013`.
