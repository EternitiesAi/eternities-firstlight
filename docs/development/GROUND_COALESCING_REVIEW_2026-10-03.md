# Ground coalescing: control fidelity and rendering limits

2026-10-03. Independent bounded CPU/source review by the southern geography/art colleague. Root owns runtime, presentation harness, browser/GPU measurements and any fixes. This receipt adds no runtime or test changes.

The Earth `raw-ground` control faithfully reconstructs the production raw floor and shore-mass submissions. I found no metadata, material, ordering, physical-coverage or mutation defect in that control. **It does not preserve rendered pixel appearance.** Coalescing changes tessellation and removes internal box faces; the reflection clip can expose those internal faces in the raw construction. Main-view differences remain causally unresolved after this review.

## Source and evidence epochs

The reviewed checkout was `D:/07-GAMES/Firstlight/authoring/bridge-moment`. The CPU probes ran after Root committed the presentation tool at `7a173861da0f2e1059af1ea70f686bed70b6851c`. Root subsequently advanced documentation while this review ran; the hashes below identify the reviewed runtime and control more precisely than a moving branch name.

| Reviewed file | SHA-256 |
| --- | --- |
| `src/world-foundations-art.js` | `46c3b38e2a73213512b8e2ade2d389361be8747ac7a199d4de8fcacb14c17520` |
| `src/world-ground-coalescing.js` | `c31024794d5b5db2c28d9aab9ecf8fd0acdf55c2630ff5edf93b988151e5d63d` |
| `src/world.js` | `f45b1f869488d33c1e2385f4a804721843c91a7443c29cbb85fde3ffedc2a3d5` |
| `src/engine.js` | `6978e7a4b4405bd544d21c3599c97ff2c4fda285109507ad37f10c85ebf282c7` |
| `tools/inspect_earth_expedition_presentation.py` | `cae5ef6c9ecacd9798efc86328de96e0b31b32674c1add14f8fc4124026c2302` |

The private balanced report is `D:/07-GAMES/Firstlight/artifacts/coastward-expedition-20261003/presentation-03/REPORT.json`, SHA-256 `83de320d841110ae1e0d29a388971150b3d1b5630ae10147107a74e3be743043`. It records source head `0c4f0301859faa54e878408ddaad7ad6b99b1497`, assembled HTML `ce2ee8b7efc491fc241685c82a3bdff9409d23f9a5ed58b467fd4363fa3027fa` and earlier harness `c8b03a59f41c93d51559f543eaa0c6aca27980fd1be723d15a2a6e1828a74552`. Comparing its entire source inventory to the reviewed checkout found differences only in `earth-expedition-ui.js`, `rpg-ui.js` and `rpg.css`; the renderer, partition/coalescer and static art reviewed here match that report's runtime sources.

The private low report is `D:/07-GAMES/Firstlight/artifacts/coastward-expedition-20261003/presentation-low-01/REPORT.json`, SHA-256 `b48626887086badcf201c6c523439a42f0c1a069270764286bffffac47930f80`. It records head `7a173861da0f2e1059af1ea70f686bed70b6851c`, HTML `f507c14985138791dd6f905357e11658ce318f602d734b2e6fd9243f910b2315` and the current harness hash above. Its complete source inventory matches the reviewed checkout. That HTML is 2,606,071 bytes. These two assembled-source epochs are distinct.

## Control fidelity and physical coverage

The first CPU probe executed the exact raw-ground branch extracted from the current Python tool, rather than a handwritten substitute. It used the actual `RealmWorldFoundationsArt.make`, actual `WorldArt.begin/add/commit` (including the separate bridge-rail batch), and actual `Engine.updateBatch`. A minimal buffer-upload recorder replaced GL calls; no browser or graphics context ran.

For an independent expected submission, the same production art source ran in a VM with only its appearance coalescer dependency replaced by `cells => cells`. Everything else used actual production definitions, painters and writer methods. Fresh simulation objects supplied ordinary low/balanced/high quality settings; their complete persistent state was asserted unchanged. These are synthetic CPU submission fixtures, not command-earned gameplay.

At each quality, the tool's control and the identity-coalescer production submission had exactly equal static item records, all metadata, complete 24-float-per-instance GPU buffers, kinds, counts and ordering. Unaffected batches and dynamic empty batches matched. The control removed exactly 126 merged floor/mass instances and inserted 1,904 raw floor/mass instances. Restoring original item/data references through the actual upload method retained their original counts and records.

| Quality | Merged static instances | Raw-control static instances | Difference |
| --- | ---: | ---: | ---: |
| Low | 1,235 | 3,013 | 1,778 |
| Balanced | 1,453 | 3,231 | 1,778 |
| High | 1,578 | 3,356 | 1,778 |

Those are static submissions for the fresh synthetic CPU fixture. They are not the earned report's combined static/dynamic count or a frame-rate measurement. Each removed box uses 36 vertices/12 triangles, so the reduction is 64,008 submitted vertices/21,336 triangles per geometry pass.

A separate exact-cell probe compared every elementary rectangle induced by the raw partition boundaries: 1,548 cells, of which 955 are ground and 593 are holes. Each covered cell has exactly one equal owner, color, height and gallery classification before/after coalescing. All holes remain empty. Both areas are exactly 18,379.5 square metres. The 955 raw rectangles become 64 rectangles, with six raw bridge cells becoming two bridge rectangles. All Earth cells have `gallery:false`. Raw-derived coast banks remain exactly 70; the same bank records also match in the complete expected/control submission. Input records, actual simulation state and replay output remain unchanged/deterministic.

Source anchors: `world-foundations-art.js:3–10` selects canonical ownership before coalescing; `:47–54` renders floors/masses and derives banks from **raw** cells. `world.js:5–11` adds metadata, separates rail batches and commits static records. `engine.js:357` encodes matrices, colors/alpha and rough/emission/wind/terrain parameters. `inspect_earth_expedition_presentation.py:29–33` reconstructs the raw boxes; `:38–41` restores items/data/fog/shadow-cache state.

The control is Earth-specific. Reusing it for Atlantis would require preserving `gallery` cutaway and omitting gallery shore mass, as the real caller does. Its immediate-next-record shore identification also assumes the verified current floor/mass order. Neither is a current Earth failure.

## Preserved rendered negative evidence

I recomputed the following directly from both JSON reports. The balanced report has 108/108 checks and 54 comparisons; low has 38/38 checks and 18 comparisons. Both have no recorded browser errors. Every comparison records zero main/reflection restoration delta, unchanged canonical state/camera/collision signature, restored batches/fog, and GL error zero. The checks assert restoration and selected visible contributions, **not raw-ground parity**.

| Raw-ground measurements | Balanced: 24 pairs, 1440×960 | Low: 8 pairs, 1224×816 |
| --- | ---: | ---: |
| Changed main pixels | 96,070–256,868 | 95,522–189,895 |
| Main sum of absolute RGB-channel deltas | 1,950,917–5,970,265 | 1,946,326–4,239,767 |
| Main maximum per-pixel sum of three channel deltas | 256–543 | 338–535 |
| Mean absolute main channel delta over the whole frame | 0.4704–1.4396 | 0.6496–1.4150 |
| Changed reflection pixels | 65,303–244,366 | 0 |
| Reflection sum of absolute RGB-channel deltas | 19,890,008–72,076,781 | 0 |

“Changed” means the per-pixel sum of three channel differences exceeds six. Mean channel deltas divide the reported main sum by width × height × three; they do not establish perceptual equivalence. Balanced pairs span three character fixtures, four places and both views. Low spans only fresh blade at four places/both views. Low disables reflection and shadow sampling in the actual renderer, so its zero reflection deltas provide no reflection-parity evidence. Its substantial main deltas rule out shadow sampling as the sole explanation. No full causal decomposition follows from the different-quality comparison, which also changes resolution and available passes.

## Concrete reflection mechanism

Equal closed-box solid union is weaker than equal visible surfaces after clipping. The raw boxes include many internal vertical walls. Coalescing removes those walls, while `engine.js:112` discards reflected fragments below `y=.025`. The reflection pass uses `P*V*H` and disables face culling (`:362–363`). Discarding below-water entry/bottom fragments can expose internal raw walls above the clip plane; the merged box has no wall at those internal boundaries.

I checked 81 ground-only rays per camera for the first eight recorded camera snapshots (fresh blade, four places, both views). Rays derive from the recorded eye/target/projection/FOV/half/aspect, mirror the actual world Y plane at `.01`, and intersect actual Float32-composed box faces. The first-hit comparison uses face orientation/material and hit position. It omits all other art, shading, shadows, rasterization and water sampling. All 648 unclipped first hits match. With the actual `.025` clip, 233 first hits differ:

| Recorded camera | Different first ground hits with clip /81 |
| --- | ---: |
| Camp adventure / follow | 35 /54 |
| Wetland adventure / follow | 17 /32 |
| Brace adventure / follow | 16 /31 |
| Glade adventure / follow | 24 /24 |

A reproducible witness comes from `fresh-blade-camp-adventure`, normalized screen sample `[-.4,-.8]`. Reflected origin is `[-72.73676843131686,-4.050768560602502,-10.128146096121494]`; normalized direction is `[-.7860346039565664,.6091942800113349,-.10503299759749384]`.

The raw first hit is an internal `elderweald-tended-edge` shore-mass Z face at `[-79.26145451777279,1.0060081038484343,-11]`, distance `8.300761892178055`, stone color `0x938e78`. The merged first hit is the same owner's floor underside at `[-79.84723370347737,1.4599999859929085,-11.078274090599923]`, distance `9.045995222563276`, ground color `0x728064`. This is a source/CPU-demonstrated geometric mechanism; it does not assign the measured reflection delta or prove those surfaces survive every other scene occluder.

The raw control therefore is a faithful old-submission reference, but the old rendering includes internal walls that can appear after reflection clipping. Restoring such walls solely to claim parity would preserve their visual artifacts and much of the removed render cost. A cleaner exterior-surface reference would be a different, explicitly labelled control and would need its own rendered qualification.

## Main-view candidate and bounded next checks

`engine.js:137` applies a height-selected terrain multiplier when `n.y>.8 && vPos.y>1.16 && vPos.y<1.57 && rough>.84`, then a separate terrain-tag multiplier. The floor top sits directly on the strict upper boundary. Actual `Engine.updateBatch` packs center Y `1.5149999856948853` and scale Y `.10999999940395355`; a CPU Float32 vertex calculation yields `1.5699999332427979`, while Float32 literal `1.57` is `1.5700000524520874`—one ULP apart. Different triangle sizes can change interpolated rounding near this predicate. The world-position grain and noise grid boundaries are additional candidates. Terrain noise hashes grid corners and interpolates inside each cell, so attributing broad differences simply to its sine hash is not yet demonstrated.

The priority diagnostic is an explicitly temporary render intervention that isolates this strict height predicate at identical view/resolution/time and restores the original shader. A stable material-tag rule, if supported by that result, would be more coherent than relying on a floor height at a floating-point branch boundary. This review does **not** establish that such a change fixes the measured main deltas. Pixel parity should stay unclaimed until a suitable actual-render comparison exists.

After receiving these findings, Root announced a bounded material correction: apply the legacy height heuristic only to untagged surfaces (`vParams.w>=-.5`), while explicitly terrain-tagged floors keep their existing terrain multiplier. Root plans a same-pose low-quality comparison to measure its effect and accepts reflection changes as removal of the internal shore-wall grid. This receipt qualifies the original hashes above; it does not certify that announced shader change or its later comparison.

For reflection, isolate the clipping/internal-wall mechanism separately from noise/shadow changes; the ground-only ray witness supplies a precise target. Keep canonical patches/solids, collision, support, saves, rewards, fog focus, both camera styles and raw-derived shore banks unchanged. No runtime edit, browser/GPU run, heavy suite, personal save action or rendered-pixel certification was performed by this reviewer.
