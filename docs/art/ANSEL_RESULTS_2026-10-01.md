# Ansel at the repaired mill

Base: PR 25 `4126edad7d65265e93389409520dae2d28c10d26`. Implementation: `1864aed88703b28cb3149ffe525c29700512cf36` on
`gameplay/ansel-millwright`, stacked on `gameplay/mill-gate-craft`.
Origin and PR 25 were inspected; no newer head/comments/reviews were present.
Read the [task](../development/ANSEL_TASK_2026-10-01.md) and
[actual evidence](../evidence/ansel-millwright/README.md).

Ansel now has an original fitted teal shirt, rolled sleeves, contrasting leather
apron, cap/beard, grounded boots and a carpenter's try square held across both
hands. The square and palms share one frame; connected 3D segments join shoulders,
elbows and hands. A gentle inspection gesture follows simulation time. Dialog
pause and explicit pause hold the current pose; reduced motion holds a neutral
stance. This gesture does not claim contact with the distant sluice or complete
work. The existing anchor `(8.7,-6.6)` and yaw `-1` remain; floor height is
1.767835 m. The gate stance `(7,-7)` is reachable with clear line, 1.746 m away.

The helper submits 53 instances (36 box,14 round,3 octa), below the 64 budget.
The old generic body submitted 25; the new silhouette adds 28 instances while
reducing the body from 7,384 to 4,936 triangles. Existing batches, maps, reflections,
shadows and actor policies remain; no new batch, texture, shader or render pass.
All parts explicitly exclude camera solids and actor cutaway. WorldArt clears
the transient frame on scene rebuild. The test API copies actual submitted
matrices; it has no save or quest authority.

World/key 9, adventure 10 and nested versions remain. No migration, reward,
NPC schedule, class/XP/gear change or forced camera framing is introduced.
The original acceptance, root prerequisite,2 timber repair and once-only payment
remain in Earth story rules. Other residents, player palettes/equipment and
release/motion owners are unchanged. Personal profiles were not inspected.

## Executed checks

`python build.py` produces identical 2,227,652-byte HTML outputs,
SHA-256 `cea685600e29dfffd6ac68f18e6e1364ff89bc57adba98382792fdbb6b6abe68`. The full current
`python tools/verify.py --browser --output <D artifact directory>` passed
56 syntax modules,657/657 Node tests,53 Python passes plus 1 existing Windows
symlink-privilege skip,24 command-earned journeys and 1,486 browser assertions
across 18 suites; zero failures. The PR records exact final-head remote-clone
verification separately. Installed development runtimes were reused.

Earth story passes 175/175. Six new pure source tests cover matrices, ground,
both hand/tool anchors, connected limbs, bounded count and reduced motion.
The browser uses actual submitted parts and isolated framebuffers: the held
square changes 222 perspective /825 orthographic color channels, with GL error 0.
Normal-time samples await 300 ms of RAF, foreground the separate page, assert
visibility and record hidden/pause/reduced state. Ten actual hand/arm/tool parts
move together; dialog pause, explicit pause and reduced motion freeze them.
Normal-time transforms are not a pixel-motion or GPU-completion measurement.
Both full-scene front/rear images and the isolated silhouette were inspected.
Existing repair/cost/retry/capacity/reload/character checks remain intact.

Failed focused attempts stay on D:116/117 failed because new photo walking
advanced the clock between the original immutable-state snapshots; photos now
follow that unchanged assertion. One quoting edit failed Python syntax and was
corrected. A later 131/132 run observed no actor change during a timeout sample;
the probe now awaits actual normal RAF and explicitly verifies page visibility.
Subsequent focused runs passed 169/169 then 174/174, and the final full run 175/175.
These earlier failures do not count as passes; no criterion was weakened.

## Actual hardware and gameplay

The silent 35.08 s 1280×720 MP4 contains 30 scripted
accepted real-time walks/UI actions from the legitimate fresh-bow checkpoint.
Its older adventure 8 world migrates normally to 10. The root is cleared and
the repair spends 2 of 4 timber, then both views and Ansel's stance are shown.
The earned repair remains unpaid. No position, material or objective was planted.
Complete video decode exited 0. Encoded frame rate is a media format, not game FPS.
Video SHA-256: `bcb3d1d9a29d16c8b48fd470641e28f828f88c250e946e29e5072b9985f4d551`.

Matched base/final hardware samples were serialized after the local full gate,
with no video capture during sampling: RTX 3080/10 GB, driver 610.74, Chromium headless
shell 143.0.7499.4, ANGLE/D3D 11 hardware,1920×1080, balanced. Three cases×360 normal
RAF intervals per build; identical fixture/setup/renderer/resolution/browser.
Exact source/build hashes are recorded.

| Case | Before P 95 ms | After P 95 ms | Instances | Triangles |
|---|---:|---:|---:|---:|
| Ansel with jammed gate · third person | 16.7 | 16.7 | 2704 → 2732 | 114170 → 111722 |
| Ansel with repaired gate · third person | 16.7 | 16.8 | 2706 → 2734 | 114810 → 112362 |
| Ansel with repaired gate · diorama | 16.8 | 16.8 | 2706 → 2734 | 114810 → 112362 |

Worst interval 16.8 ms in both builds; no interval exceeded 33.333 ms. Mapped
instances remain 16 and mapped main/reflection submissions 4. Total sampled calls
48/33/33 before versus 33/33/33 after include the existing shadow cadence; this
does not establish a draw-call reduction. Estimated texture allocation remains
1,747,625 bytes. These short quantized headless intervals do not qualify small
GPU costs, monitor timing, sustained FPS, human comfort or Unreal performance.
The diorama GPU/video case uses its ordinary scene framing; separate low-quality
browser front/rear images explicitly use a closer view.

A collaborating reviewer reported 54 focused source tests passing and inspected
the full diff, actual framebuffers, normal-time report and front/rear captures.
No remaining source/geometry/visual blocker was found. This is collaborating
review, not outside certification. No new Dom playtest was observed; recognition,
beauty, comfort and earlier outing/combat/reward acceptance remain pending.
Main is unmerged; no public deployment. Hosted execution has an account-billing
block; the PR reports the new actual run separately without rerunning that block.
