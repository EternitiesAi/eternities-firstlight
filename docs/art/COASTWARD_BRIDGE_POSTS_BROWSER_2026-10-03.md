# Coastward foreground post and lamp qualification

This independently authored browser probe qualifies the narrow main-view change at source `a69d6fdffad9821675e240d04f692f78e79d844b`, frozen HTML SHA-256 `83d035fd7bda9359da0f80e08349fa52d2899eb2a23d73441f147400770900ed` (2,504,210 bytes). It does not claim that the earlier RTX photographs were rerendered or that a software run measures hardware performance or human feel.

`tests/coastward_bridge_posts_browser.py` uses a temporary native Chromium profile, an ephemeral loopback server and software SwiftShader WebGL2 at 1280×800. The actual Import character / Confirm import controls add the checked-in command-earned Chapter I checkpoint `examples/CHAPTER_COMPLETED_EARNED.json`, SHA-256 `27cb70f57c3584f7de69f667544c8215c6fbc5f7f3d45d7fb7bc241f1cabce49`. Visible Roads controls save the home checkpoint and cross to Coastward. The visible local-map button walks to Channel Bridge, E opens its actual interaction, and the explicit bridge-side-view button frames each camera. V exchanges third person and diorama.

The edge (-2.9,55) and bank (0,19) legs invoke the same accepted production `Simulation.moveTo` used by the UI and finish through ordinary application RAF. No test mode, capture mode, accelerated ticks, coordinate writes, gear/HP/damage grants or quest commands are used. Low graphics aids the approach; the measured frame comparisons use Balanced with water/reflection rendering enabled. P pauses actual simulation time for the comparisons. Native Settings controls exercise reduced motion and disabled camera cutaway, and are restored before the real free-home button returns to Firstlight.

The observer captures the actual `WorldArt.commit` owner and restores its prototype immediately. It records actual submitted instance matrices, transformed production mesh bounds, source identities, collision classification and canonical bridge definitions. Exactly 22 existing posts and 12 parts of the four lamps at (±7,19)/(±7,98) opt in. Post coordinates, sizes, rail solid IDs and ground contact remain unchanged; all 34 pieces retain `cameraSolid:false`. The canonical bridge remains walkable at x0 and x3.15 and refuses x3.5 and x4.1 at z55.

The appearance comparison runs synchronously inside one ordinary render callback. It compares the actual traveler scene with the current 34 flags enabled against precisely those flags made opaque, using identical render arguments and geometry. It restores all items, matrices, renderer writers, camera, collision data and canonical state before RAF/play continues. Each pair also disables the global preference to show that the tags then make no image difference. `actualOn`/`actualOff` PNGs are full main-framebuffer images before the application postprocess; `native-ui` PNGs are the ordinary composited page screenshots.

A separately labelled synthetic blue box uses the actual current camera and the unchanged submitted post/lamp meshes in a separate software WebGL context. It measures whether an occluded known subject is revealed; it is not a photograph of a player or evidence of gameplay success. Every actual reflection comparison executes six fresh reflection geometry passes with `noWater:false`; every synthetic comparison executes five (six for the reduced-motion time control). Geometry-absent synthetic controls change thousands of reflected color channels, so equal on/off reflection assertions cannot pass by comparing an untouched prior texture. The opted-in flags change main pixels and preserve reflected geometry byte for byte. Shadow framebuffer depth was not separately read; this gate makes no independent shadow-byte assertion.

The initial receipt in `D:/07-GAMES/Firstlight/artifacts/world-production-2026-10-03/bridge-posts-browser-a69-attempt01/REPORT.json` passed 61/61 checks, exit 0, 67 PNGs, approximately 208.7 seconds. It is retained unchanged. The strengthened final run adds exact embedded-source/fixture checks, broader canonical history preservation, final writer/flag/matrix restoration and exact reduced-motion pixel freezing over render times 1→9. **It passed 66/66 checks, exit 0, 67 PNGs, in 216.688 seconds**, with zero application/browser errors or external requests. Its receipt is `D:/07-GAMES/Firstlight/artifacts/world-production-2026-10-03/bridge-posts-browser-a69-attempt02/REPORT.json`, SHA-256 `a30aec0a0937f816fa883f06eba4e73dadaa5ecc485e09d454cf08b52bab592d`.

| Actual position / camera | Changed actual main pixels, RGB sum >6 | Visible synthetic blue pixels, opaque→cutaway | Geometry-absent reflection control, changed RGB channels |
| --- | ---: | ---: | ---: |
| Center (0,55), third person | 707 | 424→574 | 8,526 |
| Center, diorama | 119 | 576→576 | 6,361 |
| Edge (-2.9,55), diorama | 270 | 396→418 | 6,440 |
| Edge, third person | 612 | 328→352 | 5,424 |
| Bank (0,19), third person | 2,892 | 138→502 | 5,934 |
| Bank, diorama | 257 | 570→575 | 4,854 |
| Bank, reduced-motion diorama | 260 | 570→575 | 4,855 |
| Bank, reduced-motion third person | 2,908 | 138→502 | 5,934 |

These final-run numeric observations are camera/fixture specific. No synthetic improvement is required in the already readable center diorama. The original obstruction cases instead require a positive blue-subject gain and an actual traveler-scene pixel change. The final run retains those acceptance thresholds.

Direct inspection of the initial center-third on/off stills shows the aligned z55 post becoming the existing dither aperture, exposing the lower leg. The bank-third pair shows the previously opaque light and shaft revealing the traveler's head and torso; the upper lamp remains recognizable. The bank diorama retains an ordinary readable full-body view. **The edge-third photograph still hides most lower body behind the close near rail**, while exposing the head and arms. Its positive 24-pixel known-subject gain is a limited improvement, not complete body clearance. The shallow side view and existing close-rail aperture remain a presentation limit. No actor or camera was moved to conceal that limit.

The source-change trigger remains the old `b39255cb47b3ac03e38c52a85f49c647b4a4c39c5eb120a837835286d721389c` RTX stills in `D:/07-GAMES/Firstlight/artifacts/world-production-2026-10-03/bridge-moment-rtx-01/`: `supported-bridge-third-side.png` and `normal-crossing-third-far-bank.png`. Those files remain historical observations; this a69 qualification does not retrospectively repair them. No whole-video, audio, accessibility, novice timing or final hardware-capture claim is made.

## Reproduce

From the matching checkout:

```powershell
& 'C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe' tests/coastward_bridge_posts_browser.py --output D:/07-GAMES/Firstlight/artifacts/world-production-2026-10-03/bridge-posts-browser-a69-attempt02
```

The default output is portable at `evidence10/coastward-bridge-posts-browser`; only Windows enforces D-drive evidence. `FIRSTLIGHT_TEST_ROOT`, `FIRSTLIGHT_EXPECT_HEAD` and `FIRSTLIGHT_EXPECT_HTML_SHA` support source-pinned verifier runs. No runtime file or existing test is edited by this slice.
