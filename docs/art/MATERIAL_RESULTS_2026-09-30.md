# Executed material intake, Blender proof and storage migration

This authoring follow-up starts at PR #21 gameplay head
`f85bd690466b6be9b2b438f4e06eddb264f3ec13`. The branch is
`art/cc0-material-proof`; its review PR records the exact pushed head and fresh
remote-clone source verification. This record covers work actually executed on
Dom's Windows desktop on 2026-09-30.

## Acquired materials

The [library](MATERIAL_LIBRARY.md) freezes five official Poly Haven CC0 surfaces,
three 1k maps each. All **15 files / 30,448,169 bytes** match their publisher's
advertised size and MD5. SHA256 is recorded locally per file. Replays verify
all 15 with zero downloads and no overwrites. Original metadata and maps are at
`D:/07-GAMES/Firstlight/assets/sources/polyhaven`; full maps are outside Git.
No website example renders, paid assets, installers or acquired scripts were used.

Four normal PNGs are 16-bit and the mud normal is 8-bit; all maps reopened at
1024 x 1024. Browser derivatives will need a deliberate format/memory decision.
Source-map size does not establish decoded GPU allocation or frame cost.

## Actual Blender proof

Original script-authored Hearthwater mill corner: timber frame, pale stone
courses, plaster infill, clay roof, entrance/window, static waterwheel, bench,
channel and five labelled swatches. This is an editable material study, not a
game-ready kit, gameplay screenshot or founder approval.

| Corrected output | Dimensions | Actual render seconds |
|---|---|---:|
| [Daylight](material-proof-2026-09-30/HEARTHWATER_DAYLIGHT.png) | 1400 x 1000 | 29.675 |
| [Evening](material-proof-2026-09-30/HEARTHWATER_EVENING.png) | 1400 x 1000 | 30.702 |
| [Swatches](material-proof-2026-09-30/MATERIAL_SWATCHES_DAYLIGHT.png) | 1600 x 600 | 23.033 |

Blender **5.2.1 LTS**, build `9e2066aef7ef`, Cycles **CPU / 4 threads**, maximum
48 samples, adaptive sampling and denoising; total build/render/save 84.526 s.
The scene has 168 mesh objects and 12 text objects. It uses sRGB color,
Non-Color normal/roughness, UV-mapped surfaces and restrained normal strengths.
Displacement, imported geometry and external HDRIs are absent. These CPU study
timings do not qualify browser or RTX performance.

The final packed scene is
`D:/07-GAMES/Firstlight/authoring/blender/final/HEARTHWATER_MATERIAL_PROOF.blend`,
**30,638,327 bytes**, SHA256
`649d87f43f0cc85ab1ec94d7493b8703f677a44433efd7f4280b2160ea2193ff`.
All 15 packed images reopen with exact source bytes and correct color spaces.
Both roof fields have outward upward normals. Seven readback/refusal checks
pass; existing output files remain unchanged during verification.

The first 84.562-second render remains preserved on D. Inspection found a title
overlapping the house and a reversed roof face; both were corrected in a fresh
output directory. Initial evidence was retained instead of overwritten.

[REPORT](material-proof-2026-09-30/REPORT.json) names the exact executed render
source `6cd4bd70450871e31060bccd9d797e22d9f64e07da4940003234b004cf6043f4`,
preserved as [EXECUTED_RENDER_SCRIPT](material-proof-2026-09-30/EXECUTED_RENDER_SCRIPT.py).
The reusable tool is
`92cc3ca55a3d98dd628d9b176b1793852c1d467722fd4b8079c283e1fb3ebdb3`.
Its only post-render change refuses any loaded input .blend even when
factory-startup is present. [VALIDATION](material-proof-2026-09-30/VALIDATION.json)
records the distinction and checks that existing scenes/outputs are preserved.

Three captured JSON receipts have CRLF in their original D files. Their review
copies follow the repository's LF convention, with unchanged JSON values.
[Representation hashes](material-proof-2026-09-30/REVIEW_RECEIPT_REPRESENTATIONS.json)
record original and review bytes separately. Hashes inside captured receipts
describe original D artifacts; scripts and PNGs remain byte-identical.

To make a new proof, choose fresh output and blend directories:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --factory-startup --python tools/authoring/build_material_proof.py -- --source-root D:/07-GAMES/Firstlight/assets/sources/polyhaven --output-root D:/07-GAMES/Firstlight/renders/material-proof-next --blend-root D:/07-GAMES/Firstlight/authoring/blender/next
```

The optional `--replace-proof` is only for an intentional rerender of an owned
proof; default output conflicts refuse before loading maps or scene mutation.
Never supply a personal input .blend to this builder.

## Storage executed

**42 selected completed directories** moved to
`D:/07-GAMES/Firstlight/firstlight-artifacts`: 19 standalone verification clones
and 23 media/render leaves. Frozen membership is **9,352 files, 1,152 directories,
2,857,406,525 bytes** (2.66 GiB). Each C path is a verified junction to D.
All clones retain the expected HEAD and clean status. Replay reverified 42/42
with zero copies/moves/new junctions; six negative scope/conflict/integrity guards
passed. A root follow-up checker rehashed every file and rechecked all 19 clone
identities and the preview. This is same-task verification, not third-party review.

Native Windows cross-drive cleanup initially refused hidden/read-only Git files
on all 19 clones. Full staging copies had already been hash-verified. A matching
fixture proved guarded `Move-Item -Force`; recovery retained each clone's original
files as two verified D fragments, whose union exactly matches frozen membership.
The authoritative D clones are complete verified recovery copies. The 23 media
originals remain intact on D. No original bytes were discarded or overwritten.
Initial failure receipts remain available alongside the recovered report.

Observed C free space grew from **21,435,076,608** to **24,167,804,928 bytes**;
D free space went from **296,687,968,256** to **290,874,376,192 bytes** at completion.
The observed C increase is 2.55 GiB; allocation and unrelated machine activity
can affect these measurements. Recovery data intentionally occupies D as well.

Private complete manifests, fragments, scripts and replay receipts are under
`D:/07-GAMES/Firstlight/storage-receipts/migration-42-20260930`. Frozen manifest
SHA256 is `2e820e9725f2067404cd709db29bc8b0d890bc502d7402e9e23c7c22b11c05bf`.
The small [storage summary](material-proof-2026-09-30/STORAGE_SUMMARY.json) and
[root check](material-proof-2026-09-30/STORAGE_ROOT_VERIFICATION.json) are committed.
Active linked worktrees, shared browser tools, canonical repository, ZIPs and
personal browser data were excluded. No processes were stopped.

## Gameplay and remaining acceptance

No runtime module, generated HTML, renderer, gameplay control or save schema
changes in this branch. The live preview is still PID 24708 at port 8780, serving
2,054,945 bytes with SHA256
`adc2137a2635a5302276a021cfa8f33781f8ad9559eb5b4c2275fc59fafcd0c8`.
The previous gameplay source/browser checks belong to PR #21; delivery of this
branch records new remote-clone source and authoring checks separately. Browser
suites and GPU measurements are not repeated for this authoring-only change.

The surface shader still lacks material maps/UV/tangents. Prove one timber panel
through the real offline renderer before expanding the library. Measure upload,
memory and frame cost and preserve both cameras, reflection, cutaway, low quality
and reduced motion. All saved progress, stored XP, equipment/sockets/fittings,
companion, housing and creative work remain unchanged. Human material taste and
playable beauty remain pending. No automatic main merge or public deployment.
