# Portable MP4 complete decode review — 2026-10-02

All seven complete compressed clips were independently decoded sequentially through FFmpeg to its null muxer, using CPU only. Decoder threads were capped at2 and output/filter threads at1. No source or media file was changed. Exact container duration and frame rate come from MP4 timing tables, not source normal_time_seconds.

Result: **PASSED**. Every listed input SHA/byte-size remained unchanged after decode.

| Clip | Bytes | Resolution | Codec | Container duration | Average frame rate | Decoded/expected frames | Exit | Errors |
|---|---:|---|---|---:|---:|---:|---:|---|
|atlantis-chart.mp4|7892672|1280×720|h264 / avc1|66.84s|25 fps|1671/1671|0|none|
|bow-fitting.mp4|6371374|1280×720|h264 / avc1|38.0s|25 fps|950/950|0|none|
|coastward-materials.mp4|18742199|1280×720|h264 / avc1|147.2s|25 fps|3680/3680|0|none|
|cosmos-comparator.mp4|11223333|1280×800|h264 / avc1|68.52s|25 fps|1713/1713|0|none|
|heaven-repair-bow.mp4|6130869|1280×720|h264 / avc1|51.72s|25 fps|1293/1293|0|none|
|hell-walked-rescue.mp4|7230195|1280×720|h264 / avc1|70.4s|25 fps|1759/1759|0|none|
|veteran-fitting.mp4|6565033|1280×720|h264 / avc1|38.52s|25 fps|963/963|0|none|


## Input SHA256 receipts

- D:\07-GAMES\Firstlight\authoring\bridge-moment\docs\evidence\realm-outings-2026-10-02\atlantis-chart.mp4
  - SHA256: 1c385effb4ce2cbc135178d1ca4c541a3b7864dc71d50892bc71f877e2e63256

- D:\07-GAMES\Firstlight\authoring\bridge-moment\docs\evidence\realm-outings-2026-10-02\bow-fitting.mp4
  - SHA256: 716c54fe8a3dd2f2367e58a9ecc2489eea7f8d3f30ea07876c5aa54798ebb463

- D:\07-GAMES\Firstlight\authoring\bridge-moment\docs\evidence\realm-outings-2026-10-02\coastward-materials.mp4
  - SHA256: 2e902b6ff59a5ef540d3b428cc6c0e9dc46a00cca386f087107a87de60cbb681

- D:\07-GAMES\Firstlight\authoring\bridge-moment\docs\evidence\realm-outings-2026-10-02\cosmos-comparator.mp4
  - SHA256: dfffe94d2f6145d84382c6e4e290900705c2bd1854b037555e5e961faaf2497f

- D:\07-GAMES\Firstlight\authoring\bridge-moment\docs\evidence\realm-outings-2026-10-02\heaven-repair-bow.mp4
  - SHA256: 4d9754272c585f97f2282fe566e451079f6011f873dad94190d6be56ab852b93

- D:\07-GAMES\Firstlight\authoring\bridge-moment\docs\evidence\realm-outings-2026-10-02\hell-walked-rescue.mp4
  - SHA256: 785b022f1997d226f1475ec291b25960001a470bd5748dddfb56dd220f413db3

- D:\07-GAMES\Firstlight\authoring\bridge-moment\docs\evidence\realm-outings-2026-10-02\veteran-fitting.mp4
  - SHA256: 788deaad355ef7401c3e0cf92dde28437223f30d22dd3f15c0632433f1f51bce

## Scope

The final progress record is end for successful complete decodes. FFmpeg decoded-frame counts equal the MP4 sample-table video counts. Audio streams, when present, were also mapped and decoded; subtitles/data were excluded. Metadata probe exit1 is expected because that read-only inspection deliberately names no output, and is not the complete-decode exit. Full command lines, errors and exact rational timing metadata are preserved in VIDEO_DECODE_REVIEW.json.

Complete decode verifies that these exact compressed clips can be read without reported decode errors. It does not independently qualify visual quality, game logic, playback on every platform, human enjoyment, original gameplay pacing, audio experience or sustained renderer performance. Earlier still-image review remains separate.

FFmpeg: ffmpeg version 7.1-essentials_build-www.gyan.dev Copyright (c) 2000-2024 the FFmpeg developers
