# Portable actual media

**Nine native-resolution A/V clips are encoded and fully decoded successfully.** Every final source/output video and audio decode exited 0, all final warning logs are empty, every source frame is retained and all raw hashes are unchanged. The ninth Atlantis take uses the repaired-gallery 846e epoch; the earlier eight source epochs remain unchanged.

These are portable copies of actual recorded Firstlight canvas and app audio. They preserve each named capture's recorded source epoch. The `final` in a take name is the recording label, not a claim that it used the final delivery runtime.

The full A/V source streams combine the real game canvas and opted-in app master in one browser MediaRecorder stream. They omit the DOM HUD, menus and dialogs. Corresponding UI screenshots, reports and final saved outcomes remain in the adjacent `screens/` and `captures/` directories. Any later whole-UI example is separately labelled **silent**; app audio is never grafted onto that different recording.

## Capture scope and epochs

| Portable A/V clip | Recorded HTML SHA256 | Disclosed import/start |
| --- | --- | --- |
| [Starter blade](media/starter-blade-window-01.mp4) | `cd532619e777f06e3d86a2430b0a387ad446dbdbbd3ab24b807756cb9046f54c` | Command-earned initial blade/coat, XP0; Oren outing not yet accepted. |
| [Starter bow](media/starter-bow-window-01.mp4) | `cd532619e777f06e3d86a2430b0a387ad446dbdbbd3ab24b807756cb9046f54c` | Command-earned and crafted trail bow/coat, XP0; Oren outing not yet accepted. |
| [Layered bridge](media/bridge-layered-final-01.mp4) | `cd532619e777f06e3d86a2430b0a387ad446dbdbbd3ab24b807756cb9046f54c` | Command-earned initial blade/coat, XP0; native Roads, walking and camera controls. |
| [Coastward work](media/coastward-work-final-01.mp4) | `ceb0ed0eaa357fa2f0483151c902bc39276513050693299d71a1e62e052a18fa` | Command-earned initial kit; realm trail not yet accepted. |
| [Heaven maintenance](media/heaven-feel-final-01.mp4) | `ceb0ed0eaa357fa2f0483151c902bc39276513050693299d71a1e62e052a18fa` | Already accepted; west relay recorded. Earlier acceptance/west interaction belongs to the inherited earned fixture. |
| [Hell rescue/return](media/hell-rescue-final-01.mp4) | `ceb0ed0eaa357fa2f0483151c902bc39276513050693299d71a1e62e052a18fa` | Contact, cooling, paired clamps and Reeve defeat already recorded; this capture resumes the physical escort and return. Prior Heaven claim is retained. |
| [Cosmos alignment](media/cosmos-alignment-final-01.mp4) | `ceb0ed0eaa357fa2f0483151c902bc39276513050693299d71a1e62e052a18fa` | Command-earned initial kit; no trail accepted. |
| [Returning finite fitting](media/returning-fit-final-01.mp4) | `ceb0ed0eaa357fa2f0483151c902bc39276513050693299d71a1e62e052a18fa` | Returning character with owned Dawn's edge, earlier socket/fittings, XP588 and Cosmos already paid. The new action is deliberate one-time fitting and real practice. |
| [Atlantis repaired gallery](media/atlantis-aperture-final-04.mp4) | `846eb86b9533cc878c79d5e189f12a4f2ea2aac6725d67e07bd95893b83e30c5` | Already accepted command-earned Atlantis snapshot; no chart actions completed at import. Initial acceptance belongs to the inherited fixture. This capture uses the repaired gallery roof/aperture runtime. |

These imported fixtures were earned through production commands in accelerated automated setup, rather than by a human playing these clips from a blank character. The recordings themselves use ordinary RAF and native input/UI, with no artificial ticks, player-position edits, manual damage or inventory/reward grants during filming. Setup sets time, quality and camera for labelled presentation. Menus pause through normal UI. The reports declare balanced 1280×900 and ANGLE RTX3080/D3D11; this packaging pass does not rerun or independently certify those hardware measurements.

## Encoding and verification

The existing `inspect_actual_media.py` completely decoded each source video and audio stream, encoded native 1280×900 H264 (`libx264` medium/CRF25) and AAC 128k with `-fps_mode passthrough`, then completely decoded the compressed MP4. Work was sequential CPU encoding with two decoder/four encoder threads. There is no frame interpolation, synthetic gameplay, replacement soundtrack, event speedup, trimming or raw-file modification.

**Package size: 115,769,592 bytes (115.8 MB); all nine files individually remain below100 MB.** Root explicitly accepted native-resolution clarity instead of the approximate 50 MB preference. Each file retains1280×900, H264 High/yuv420p and stereo AAC at 48 kHz.

| Clip | MP4 bytes | Container duration | Average encoded fps | Full video frames | Decoded video/audio endpoints(s) |
| --- | ---: | --- | ---: | ---: | --- |
| [starter-blade-window-01](media/starter-blade-window-01.mp4) | 10,599,637 | 00:01:47.15 | 9.24 | 979 | 106.242/106.709 |
| [starter-bow-window-01](media/starter-bow-window-01.mp4) | 9,477,167 | 00:00:48.66 | 29.07 | 1,413 | 48.628/48.640 |
| [bridge-layered-final-01](media/bridge-layered-final-01.mp4) | 10,589,050 | 00:02:22.54 | 9.28 | 1,294 | 139.788/142.229 |
| [coastward-work-final-01](media/coastward-work-final-01.mp4) | 25,436,195 | 00:02:19.80 | 29.31 | 4,096 | 139.746/139.776 |
| [heaven-feel-final-01](media/heaven-feel-final-01.mp4) | 16,494,693 | 00:01:39.11 | 29.76 | 2,950 | 99.079/99.029 |
| [hell-rescue-final-01](media/hell-rescue-final-01.mp4) | 15,852,772 | 00:01:51.84 | 29.82 | 3,334 | 111.855/111.808 |
| [cosmos-alignment-final-01](media/cosmos-alignment-final-01.mp4) | 11,681,369 | 00:01:06.50 | 29.64 | 1,970 | 66.448/66.515 |
| [returning-fit-final-01](media/returning-fit-final-01.mp4) | 8,194,607 | 00:00:37.05 | 29.19 | 1,080 | 37.008/37.056 |
| [atlantis-aperture-final-04](media/atlantis-aperture-final-04.mp4) | 7,444,102 | 00:01:04.90 | 29.76 | 1,932 | 64.880/64.896 |

Container durations above are actual header values rounded to centiseconds; decoded endpoints are separate media values. Video can end earlier than audio when a recorded static scene holds without new frames. The container/player holds the last recorded image; no added gameplay frames were generated. Average encoded frame rates describe these MediaRecorder streams and their paused/static frames, not sustained RTX rendering throughput. AAC priming/padding and codec timestamp quantization can shift decoded endpoints slightly; complete receipts retain every source/output comparison.

**Preserved negative evidence:** the original helper guessed a 1/60 encoder timebase for Heaven and returning fitting, causing two Heaven and five returning duplicate-timestamp warnings. Both first-pass MP4s and every original log/receipt remain unchanged onD. A new D-only helper `inspect_actual_media_millisecond_mp4.py` changes only encoder precision to `-enc_time_base:v1:1000`; it retains all 2,950/1,080 frames, CRF25, dimensions and actual audio. Final encode/source/MP4decode warning logs are empty. Decoded-progress endpoint differences are +1 ms (not frame-presentation timestamp drift); decoded audio padding differences are +29.3/+36 ms. The original helper and raw recordings were not overwritten.

FFmpeg executable: `C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe`. Detailed local logs/commands: `D:/07-GAMES/Firstlight/artifacts/world-production-2026-10-03/portable-media-delivery-20261003/FINAL_NINE_PACKAGE_REVIEW.json`, `PACKAGE_REVIEW.json` and `PLAN_PRECISION_REPAIR_REVIEW.json`. The `-i` header-only inspection deliberately exits 1 for missing output; the complete decode and encoding commands all exit 0.

**Every-frame timestamp check:** warning-free encoding did not by itself prove native timing. A complete decoded `showinfo` comparison multiplied each integer PTS by its actual decoder timebase and compared exact rational seconds, without forced fps or mocked frames. Cosmos’s initially warning-free output silently rounded 1,786/1,970 timestamps, by up to 7.667 ms. That MP4, source/output frame arrays and logs are preserved on D. Only Cosmos was re-encoded with the explicit 1:1000 precision setting and fully decoded again. All **19,048 frames across the nine final clips** now have exactly the same presentation timestamps as their raw sources, with zero constant mux offset, zero variable deviation and strictly increasing frame order. AAC remains a lossy encoded derivative with separately disclosed priming/padding; no audio-bit identity or sustained-render-fps claim is made. Full exact-rational evidence is in `FINAL_NINE_FRAME_PTS_REVIEW.json`, with the original negative check in `ALL_FRAME_PTS_REVIEW.json`.

### Exact MP4 and raw-source hashes

| Clip | MP4 SHA256 | Original A/V SHA256 |
| --- | --- | --- |
| starter-blade-window-01 | `61f68befe82d1a9d7bd23a91d467ed63e895ffb5ecf3728bb70e547b8c1627e3` | `34380c08eeb157076d852769a8f4843ae5d8a33c5cd8d940031b7cc2511d7318` |
| starter-bow-window-01 | `4cbe1adf0fe6b780ca7c5345f6d86c01e90f9fb3ef857012e28c3ef49b7a66a1` | `c6c4390b1a8e5668375348a4bba6caf1ede8bb63cabc2821a34df5fb442046aa` |
| bridge-layered-final-01 | `5e7f4f2447e7bd8265e3b4fae9b2ed4d829985b60572998995006619d5ce05de` | `39b32b54977884329d61f1f5adca55bc32ce661e122dee613618aa6383c40264` |
| coastward-work-final-01 | `707e7a37691c6a191cc875c58ef78c0d1f013a6a21783cae541ac681e8ad2983` | `d15e1e241f5864c0bde400be4d60d3f52f7ccb125898f4da0375cb629445441c` |
| heaven-feel-final-01 | `351bed2d1df3dc590bbab97c857103f409b0cf7417435a55045ab7d480f3097b` | `baf8fedd6a2cd080e7204ea92067b83dbe586886eb96c20bc6e7cebd0f0291ea` |
| hell-rescue-final-01 | `0440137e658c735d76e3a5b54d6c03678f4155a91c314c8e147769e147c93d2a` | `09efab5061e2ec2afec9505f15be821c40892dfcb5f9d00fce8061e238fe6384` |
| cosmos-alignment-final-01 | `8b8ff4f1dffd2d1b29d7745d4eff81ee0d56b35a48420e78e43bdae183e25f9f` | `7d3840a19488ae13bda1ae7311705d7f47a909ca23678fc85d6dca2e4c9e27a2` |
| returning-fit-final-01 | `d8109b392308a0f0b3179469f3fa0d9a665dec0cc6da8a0c7ce96698d70acf23` | `9b76e08936e8ad35e2f75ffbfefd582bbf2730035536e3ac58ce94689de950dc` |
| atlantis-aperture-final-04 | `996cf95194e4a9ae645046f62903ac8f2e7b62b7138e2c8fa92aff56921d1b45` | `63a0c20b01a8eeae941c88ae2a9988cca4025a066cd76f33650e4bc1bb9a9f72` |

## Limits

These compact clips and automation receipts do not establish human enjoyment, human pacing, accessibility acceptance, controller acceptance, sustained throughput or complete countries. Browser wall-clock `normal_time_seconds`, saved simulation elapsed, canvas recording elapsed and actual compressed-container/decoded durations are separate quantities. We report media duration from the file/decode, not by relabelling the browser wall time. Full-stream successful decode establishes decodability, not semantic correctness of every frame, audio quality or timing feel. Original raw sources, warnings and negative receipts remain on D.
