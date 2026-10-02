# Bounded realm-outing visual review — 2026-10-02

Reviewed ten unique saved PNG paths, using local image inspection only. Root regenerated several live paths during the review, so affected images were re-read and epochs are separated below. This reviewer did not launch Chromium, a renderer, GPU work, suites or workers, and made no source/test edits. The only authored artifact is this note.

## Epochs and supported scope

- **North d234:** `realm-trails-north-browser/attempt03/REPORT.json` records HTML SHA256 `d234d765c22433126a1f93265af5bfcd9fce3dc685f7d33dda9836c1c6228423`, 257 checks and 28 PNGs, completed 18:47 UTC. The three inspected north frames are from that run, not a later build.
- **Cosmos d234, initially inspected:** its original report at 18:42 UTC recorded the same d234 build and 34 checks. The original map and comparator were visibly reduced to icon size. At the first source inspection the current HTML was **7c119726ae6bdb5393af4a40cea1184efb28efc562a21262d4111d2771f58781**; the 7c source still contained the CSS cause. A replacement 7c report was observed at 19:06 UTC with failed status and ten checks; its exact failure text was not retained before the next regeneration. That was a separate test epoch, not the epoch of the original PNGs.
- **South 7c, re-inspected:** Root's in-flight verification replaced the initially viewed ef355fec stills. The three southern paths were re-read after their report recorded 7c1197, 95 checks, completed 19:05 UTC. The fitting observations below use those replacement 7c images.
- **Cosmos d5dc, follow-up:** Root applied the scoped SVG fix and generated HTML SHA256 `d5dc1c743d7dfde3b946b343306e08a87065ee073600f57f3840856d1e24fb7b`. Its report recorded 38 checks at 19:07 UTC. The regenerated west map, east aligned UI and east world view were re-inspected. The west world PNG retained its original byte hash. These follow-up views support the specific visible size correction; they do not certify every consumer or the full verification run.

All paths below are rooted at `D:/07-GAMES/Firstlight/authoring/bridge-moment/evidence10/`. The browser directories are live output locations. Hashes identify the inspected bytes; later regeneration can invalidate a path's earlier image attribution.

## Findings

1. **Resolved in the inspected d5dc frames: map and comparator were icon-sized.** In the original d234 `west-sight-map.png`, the entire physical map occupied roughly 24 × 28 pixels, leaving route numbers and action letters unreadable. `east-sight-aligned-ui.png` reduced the comparator to a tiny arc. The 7c source cause was `src/rpg.css:18`: `#rpg-window svg` set 28-pixel width/height with greater specificity than `.world-atlas svg` and `.trail-instrument svg`. Root added `#rpg-window .world-atlas svg` and `#rpg-window .trail-instrument svg` overrides and bounding-box assertions. The d5dc west map visibly fills its roughly 420 × 500 area; the comparator is visibly full size. The earlier images are negative evidence, not evidence of a present d5dc failure.

2. **Remaining d5dc map detail: the white player dot covers the west action letter.** On the corrected west map, B is legible, but the western action ring has a white center where A should be. The player and action occupy the same station, and the player dot draws over its text. Preserve the action letter above the dot, or use an outer player outline when coincident. This is a small visible marker-legibility issue; the map's physical route and numbered civic stops are now readable.

3. **The blade core masks the player in the d234 close-combat frame.** `heaven-blade-recovery.png` clearly shows “Recovery opening · 2.6s,” a selected full-health core and the free home control. The large core occupies the player's screen position, leaving only fragments of the hero visible. This obstructs judging the player's weapon pose and spacing from that frame. A side angle during actual input, or a brief ordinary step clear, would make the hardware combat recording more legible. The still does not establish a movement, hit-window or save defect.

4. **Neris and the player overlap at the exact d234 arrival endpoint.** In `hell-neris-actual-refuge.png`, Istra is readable, the tracker has advanced to returning to her, but Neris cannot be visually distinguished from the player at their shared arrival position. The corresponding recorded actor coordinates/ledger establish arrival; the image alone is weak evidence of two separate people. After arrival, physically move the player to an existing supported offset before the presentation still. `hell-blade-diorama.png` separates all three figures and exposes the Refuge interior, so neither removing the shelter nor relocating Neris is indicated by this evidence.

5. **The Cosmos station/tool is concealed in the selected world views; the aligned screenshot is scrolled past the top of the diagram.** In the west world frame the hero stands over the station and the multi-line instruction toast covers the lower scene. The east view likewise does not reveal the comparator clearly beside the hero. These world views establish arrival and readable instructions, but not the physical instrument's affordance. For hardware evidence, use an ordinary supported offset within interaction range and a side camera angle. In the d5dc aligned UI frame, the enlarged diagram's top is still cropped by the current scroll position while the slider, selected angle, tolerance and explicit recording button are readable. Scroll slightly upward before that presentation frame; no invented mechanic or terrain is required.

6. **The fitting's terms are clear; its band is not established by these default camera stills.** The re-inspected 7c preview clearly declares 15 → 18 attack, 11 reach, 0.75-second cooldown, 6 stamina, the full 3-ore/8-sunmark cost and an explicit spend button. Both fitted world camera views show the traveler at the workshop, but the carried bow/band is too small in the diorama and difficult to distinguish through the third-person cutaway stippling. These frames do not justify saying the band is absent, nor do they demonstrate that its material change is readable in both cameras. A closer third-person and zoomed follow view after physically stepping onto clear supported ground would provide that specific visual evidence. Stored fitting/attack/identity tests remain separate evidence.

No additional definite UI obstruction or false reward/consent statement was visible in this bounded selection. The bright combat warning/recovery text, explicit fitting cost and clear free-home controls remain readable at the inspected 1280 × 800 size.

## Inspected image receipts

| Image path under evidence10 | Final inspected epoch | SHA256 of inspected bytes |
| --- | --- | --- |
| `realm-trails-north-browser/attempt03/heaven-blade-recovery.png` | d234 | `2e0cfc27314923f2c9931daa9a16923b22af6d7978c7bb03d5ce1ec0f14a1298` |
| `realm-trails-north-browser/attempt03/hell-neris-actual-refuge.png` | d234 | `0308ae77dd06ad0799e9bf6235c6e8c2027ed4bce7fa2ef424e56bdf8370b007` |
| `realm-trails-north-browser/attempt03/hell-blade-diorama.png` | d234 | `00d3e9285afdfbf06ea0d400868e306eef816a12bd24a251d929e880ad117c0b` |
| `realm-trails-cosmos-browser/west-sight-map.png` | d5dc replacement | `50e05851ccb6afe0c88a83eee3d1f3d31618a2dd61f9fc079f061bf82262dce3` |
| `realm-trails-cosmos-browser/east-sight-aligned-ui.png` | d5dc replacement | `d14a8a2338b8a030b3468925dfc4775530d58f1715b24e3fa0521a6aa6798446` |
| `realm-trails-cosmos-browser/east-sight-world.png` | d5dc replacement | `73b04b7a57df044bc489543a442276c2d190b4f0b4077d477c558b92fb301ea8` |
| `realm-trails-cosmos-browser/west-sight-world.png` | d234; byte-identical d5dc replacement | `37beb4b9d5f95c71dc3c0e24a43c5fd0e2940f8d4259740ee8234722c09d4b60` |
| `realm-trails-browser/earned-bow-fitting-preview.png` | 7c replacement | `48cea11f73c97e5cce31598a8ce9e31db50c50e97ec270c735e7fa51fc34175c` |
| `realm-trails-browser/fitted-bow-diorama.png` | 7c replacement | `48ed437aee1224d13317b78119d87e47ad423fa6ba8ef11d9187f2cb4925aa1c` |
| `realm-trails-browser/fitted-bow-third.png` | 7c replacement | `e505427f42b0501c1153540dcbdcaaf2fb896492c228fd50edd4a27167ba3733` |

Original d234 negative Cosmos receipts, recorded before Root regenerated the paths: map `9a8c53d01d692422bd14e3b0cf8e8c50f2d0df1ebcf27d79073ef89877fc21e3`; aligned UI `349e3119a0432a9b8fdadb540fc7302833bc25f276ada2dc2e0b07b3304c71c4`; east world `3ed616f5cd03d4e240d2c7a4739ee8f252382403c593ddc664444c3f025fac20`. Those bytes are no longer assumed to reside at the live paths.

## Limits

This is a static software-image and targeted-source review. It does not infer human feel, pacing, whole-video behavior, normal RAF, hardware frame rate, audio quality, controller/touch accessibility, all resolutions, full-country completeness, save safety beyond the separately identified tests, or final fresh-clone/CI status. No RTX footage was inspected. Root owns runtime fixes, regression execution, the final build and hardware presentation.
