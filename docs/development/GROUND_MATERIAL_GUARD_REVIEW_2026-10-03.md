# Explicit ground material: independent follow-up

2026-10-03, reviewed at Root `9abfa87f10bcfd6005e0b43ccc0092ffd205ae02`. This read-only source/report review follows [the original coalescing review](GROUND_COALESCING_REVIEW_2026-10-03.md); it preserves that earlier epoch and its reflection witness. No new browser, GPU, journey, suite or runtime mutation ran here.

**The guard addresses the measured main-image instability.** The eight matched low-quality comparisons show a 95.71–97.83% reduction in summed absolute RGB-channel difference between raw and coalesced ground. Residual differences remain. The current regression bounds reject every recorded pre-fix pair and accept every recorded guarded pair when evaluated offline. This is not pixel parity or a fresh execution of the registered browser suite.

## Matched evidence

The reports are under `D:/07-GAMES/Firstlight/artifacts/coastward-expedition-20261003/`:

| Receipt | Original material | Guarded material |
| --- | --- | --- |
| Folder | `presentation-low-01` | `presentation-low-material-02` |
| `REPORT.json` SHA-256 | `b48626887086badcf201c6c523439a42f0c1a069270764286bffffac47930f80` | `847311323c6125a7c72d72b477bb9912270b0a48e5e695405ccae1f944356b93` |
| Recorded HEAD | `7a173861da0f2e1059af1ea70f686bed70b6851c` | `c6d60994618194afa4581925d2a5eb4db0e2537f` |
| Actual HTML SHA-256 | `f507c14985138791dd6f905357e11658ce318f602d734b2e6fd9243f910b2315` | `d89919b6fcd220caacabce21c3e17a0d4124380d4821356f91a3e217b3c59c0f` |
| Actual engine SHA-256 | `6978e7a4b4405bd544d21c3599c97ff2c4fda285109507ad37f10c85ebf282c7` | `8f0bd5cbb29fab646b2db513784e9d04646554c3a541ac19a207bf2fb2e76702` |

The guarded capture recorded the then-current Git HEAD before the guard commit. Its actual source hashes and HTML identify the tested modified source; do not treat that HEAD alone as proof the committed tree already contained the guard. Root later committed the correction as `8f8fe12e69488d05bc9623500ae524038495743f`.

Both reports use harness SHA-256 `cae5ef6c9ecacd9798efc86328de96e0b31b32674c1add14f8fc4124026c2302` and the same command-earned fresh-blade completed/bound fixture SHA-256 `119136d0f89724a0932880ac01831951159f428219ca4ca045df27205255bbfb`. Their entire source inventories differ only in `engine.js`. Labels, recorded camera/parts, static/dynamic counts, fog/focus and render arguments `[11,17,false]` match. Texture decode/upload wall timings differ between runs and are not performance evidence. Both have 38/38 recorded checks, 18 comparisons, no recorded browser errors and exact state/camera/collision/batch/fog restoration for every comparison. Placements are explicitly synthetic; these are software-WebGL appearance controls, not normal-time traversal or native-storage proof.

All raw-ground images are 1224×816. Changed pixels mean summed RGB-channel difference greater than six. Mean channel difference divides the main sum by width × height × three.

| Place/view | Changed pixels before → guarded | Mean absolute channel difference before → guarded |
| --- | ---: | ---: |
| Camp adventure | 130,723 → 2,674 | 1.03688 → 0.04411 |
| Camp follow | 170,914 → 3,891 | 1.24133 → 0.05321 |
| Wetland adventure | 95,522 → 1,099 | 0.64957 → 0.02349 |
| Wetland follow | 151,577 → 2,469 | 1.05425 → 0.04137 |
| Brace adventure | 149,022 → 1,643 | 1.09749 → 0.03334 |
| Brace follow | 189,895 → 1,356 | 1.32232 → 0.02873 |
| Glade adventure | 177,366 → 3,033 | 1.41498 → 0.03719 |
| Glade follow | 122,767 → 3,130 | 0.94124 → 0.03815 |

Across all eight pairs the summed main difference falls from 26,242,215 to 897,682 channel units. Guarded changed-pixel fractions are 0.1100–0.3896%; rare maximum per-pixel summed differences remain 326–535. These localized residuals should stay visible in receipts.

## Actual guard and regression scope

`engine.js:139` now restricts the legacy height-selected multiplier to `vParams.w>=-.5`. `Engine.updateBatch` encodes explicit terrain as `-1`; its existing terrain multiplier still uses `<-.5`. The two rules therefore cannot both shade the same explicit terrain fragment. Untagged surfaces retain the old height rule. The diff changes no geometry, clipping, camera, fog, shadow/reflection dispatch or persistence. Other explicitly tagged Earth/Cosmos surfaces share this shader; this receipt directly measures only the visited Earth low-quality ground controls.

Current engine hash is `d7101150dc15942e83ff31c8fc01310576b88ff11defb7d64049ea2c5dbba4d9`, and current HTML is `b692e1e43648d2a91aff8d05c63a37de2ce124af620ed13fcc1b5e755fba4682`. Removing exactly the two explanatory comment lines from their bytes recovers the guarded report's engine and HTML hashes respectively. That proves this later difference is comment-only; it does not supply another render run.

`tests/earth_ground_material_browser.py` regenerates command-earned journey fixtures, then runs the actual presentation tool at low quality/fresh blade. The tool now requires every raw-ground main comparison to satisfy **changed fraction ≤0.005 and mean absolute channel difference ≤0.1**, in addition to exact restoration and other positive contribution controls. All eight pre-fix pairs fail both bounds; all eight guarded pairs satisfy both. The bounds leave headroom for measured residual raster differences rather than claiming exact equality. The test and child tool use normal subprocess failure propagation; low disables shadows/reflections and the docstring expressly preserves reflection-surface differences.

The current tool hash is `28a36c7f371b84beeb43b1052d87b92f3d8d4eb53351dcd224b77cbf35edf8d4`; wrapper hash is `5c1d3f7d2e1eb7b954654841f2567dbd7077a899491243703ad81f8045d7c2e3`. The measured reports predate the eight added bound assertions. An actual fresh successful child run should therefore record 46 checks, not retrospectively relabel these 38-check receipts. No existing strict-suite report was present at `evidence10/earth-ground-material-browser/frames/REPORT.json` when reviewed.

Low's zero reflection delta follows its disabled reflection pass. The original balanced reflection negatives and CPU internal-wall/clip witness remain applicable. No guard measurement here qualifies reflection parity, arbitrary views/quality tiers, sustained device performance or human readability. I found no concrete blocker in the guard or these regression thresholds.

## Human guide correction

The companion guide now names the actual on-screen **Living road** tracker button, visible after acceptance, and its title's expedition-page action (`rpg-ui.js:44,63,79`; `earth-expedition-ui.js:114–124`). It also distinguishes Rill's terms/payment from Sela's optional wetland advice. Near Sela, ordinary E opens the local reading and source-derived dialogue; dialogue alone records no step or claim (`world-foundations-ui.js:68–70`). No reward, route, character/class requirement, provisional canon attribution or human-answer claim changes.

## Subsequent actual strict receipt

After the preceding review, Root supplied a completed strict run at `D:/07-GAMES/Firstlight/artifacts/coastward-expedition-20261003/ground-strict-01/frames/REPORT.json`. I independently read status `passed`, **46/46** checks, eight passing measured raster bounds and no recorded browser errors at exact source `9abfa87f10bcfd6005e0b43ccc0092ffd205ae02` / HTML `b692e1e43648d2a91aff8d05c63a37de2ce124af620ed13fcc1b5e755fba4682`. Its report SHA-256 is `6e96accf87ef51ab3a3dd1afe815c03959460331f923eec44549005f846c28e6`; harness hash matches the current strict tool above. All eight raw-ground main measurements exactly reproduce the guarded low comparison table. Parent process exit 0 is Root-observed evidence supplied separately. This later receipt supersedes only the earlier pending strict-run status, not the preserved historical source epochs, residual pixels or reflection limitation. I did not rerun it.
