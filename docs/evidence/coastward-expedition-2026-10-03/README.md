# Stormfall and the Living Road: evidence index

This directory contains selected exact-byte receipts, synthetic earned worlds, rendered controls, actual normal-time gameplay and one bounded real-GPU measurement. The implementation is on `gameplay/coastward-expedition-20261003`, stacked against PR37/base `88aa1feaca4023064aed4ef5c9d77d59e958e353`. At this packaging checkpoint the final pushed-head fresh-clone gate is pending; its eventual result belongs to the delivery PR and external clone receipt.

[Production result](../../development/COASTWARD_EXPEDITION_RESULTS_2026-10-03.md) describes gameplay, reward matrix, save migration, limits and commands. [Human play guide](../../playtests/STORMFALL_LIVING_ROAD_2026-10-03.md) explains the real route. Earlier receipts retain their original epochs and failures.

## Watch actual gameplay

- [67-second bow excerpt](mobile/MOBILE_GAMEPLAY_TAKE05.mp4): selected real frames from the native bow take, with declared cuts and separate verification. Silent, no speed changes or generated imagery.
- [Full blade outing](captures/native-blade-take02/GAMEPLAY_PORTABLE.mp4): story, one intentional paid patrol, finite edge binding, practice18→20 and native reload.
- [Full bow outing](captures/native-bow-take01/GAMEPLAY_PORTABLE.mp4): managed allocation, shelter binding, practice15→15, guard1→2/maxHP110→120 without healing, and native reload.
- [Full returning-character outing](captures/native-veteran-take01/GAMEPLAY_PORTABLE.mp4): retained strongest gear/socket/fittings and companion, story, finite edge binding, practice51→53, earned XP588→633 and native reload.

The three full recordings use actual production UI, accepted walking/combat events and ordinary RAF. No test surface, accelerated ticks, direct game commands, grants, position/HP writes or personal browser profile are used. The initial characters are labelled command-earned synthetic imports. The route is automated and already known, so these349.351/250.380/239.838-second takes do not establish novice pacing or human enjoyment. Their4758/3393/2791 condition evaluations include repeated polls rather than that many unique assertions.

Every full original WebM and portable1440×900 silent H264/yuv420p stream was decoded completely, retaining8711/6247/5992 consecutive frames and strictly increasing matching timestamps. Encoding is intentionally lossy. Original WebMs and higher-bitrate MP4s remain on D; the portable files preserve the whole recordings, not only excerpts.25fps footage does not measure monitor or game performance. Raw media `sha256` is authoritative; a report's optional newline-normalized `lf_sha256` is not a media-integrity hash.

## Receipts and epochs

| Evidence | Actual result | Scope |
| --- | --- | --- |
| `source/source-final-02/` |88 syntax,1081 Node passes,57 Python cases:56 pass/one existing Windows symlink skip,37 command-earned journeys |Current identical2,606,682-byte HTML, SHA256 `fa596e6ee108e5e3b3e8a3c6ba02bd043975940025c6230faa9b03404b6b1333` |
| `browser/REPORT.json` and `earned/` |528 passing native expedition checks |Current HTML; blade/bow/veteran whole-browser restarts, accepted/partial/ready/paid/bound, original key and separate slot; accelerated walking/combat is explicitly labelled |
| `camera/REPORT.json` |55 passing checks |Current HTML; real keyboard/orbit and camera aria/focus/hover, with labelled accelerated command walking |
| `controls/ground-strict/` |46 passing controlled appearance checks |Earlier9abfa87 / HTML `b692e1e4…4682`; raw/merged geometry, eight image bounds, negative controls, exact restoration, work/binding pixels; current physical/render modules are unchanged, but this is not a current-HTML run |
| `controls/presentation-03/` |108 passing variant appearance checks |Earlier presentation epoch; synthetic poses and positive render contributions, not human readability |
| `gpu/gpu-balanced-03/` |Ten scenes/6000 normal-RAF intervals, max16.8ms, none above33.333/50ms |Current HTML, actual RTX3080 hardware WebGL2,1920×1080/DPR1, balanced, Chromium143.0.7499.4, driver610.74 |

GPU03 includes actual scene screenshots, CDP hardware/WebGL receipts, raw intervals, setup and hashes. Setup combat earns the required crossing before root inspection. Warmup and traveler-HP reads lie outside timing; both live-root samples retain positive HP105→75 and75→45. The measure is headless browser cadence with diagnostics overhead, not GPU render time, monitor presentation, sustained RTX qualification or human comfort. No video capture or accelerated ticks run during samples. Software-WebGL CI remains distinct.

`historical/` retains the superseded first native blade receipt and exact old harness bytes. `negative/`, `logs/` and early appearance/GPU reports retain source expectation errors, harness selector/CSP/camera-ID mistakes, the actual veteran tracker defect, the incomplete GPU prerequisite and pre-guard terrain differences. Optional excerpt attempts also retain their failed frame-count/container checks; final mobile delivery has its own strict all-selected-frame receipt. No failure is rewritten as a current pass.

## Provenance and reproduction

`COPY_RECEIPT.json` records original exact copies and source locations. Paths inside copied reports are retained rather than rewritten. `COPY_SOURCE_AFTER_RECEIPT.json` identifies any originally copied log whose source later grew; final failed excerpt logs are separately packaged. `MANIFEST.json` records every packaged file's raw bytes and SHA256, excluding only itself. Source receipts are evidence, not instructions or installs. No personal saves, browser profiles or authentication stores are packaged.

`harnesses/` contains exact current inspection/capture/measurement snapshots. Media-encoding helpers are preserved with their actual commands. PNG controls and restored images remain lossless; H264 is lossy. Inspect a receipt's HTML/harness hash before associating it with a build. The final delivery clone must check manifest bytes as well as source/build identity.

Reproduction uses `python tools/verify.py --browser --output <new-evidence-directory>` with the documented development environment. Native recording uses `tools/capture_earth_expedition.py` and labelled earned imports; measurement uses `tools/measure_gpu_browser.py`, packaged source world and setup. Keep personal profiles and the existing8780 save origin untouched. The blocked old-preview replacement is not bypassed: close that old preview manually before using `PLAY_FIRSTLIGHT_WINDOWS.cmd` on the delivery checkout.

Human acceptance remains open: Did you know where to go? Did fights feel better? Did the reward make you want another outing? Both camera comfort, diorama actor overlap, small binding visibility and larger-world/main-saga completeness remain honest limits. No main merge or public deployment occurred.
