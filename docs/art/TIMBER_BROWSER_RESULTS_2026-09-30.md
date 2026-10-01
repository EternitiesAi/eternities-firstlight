# Weathered timber in the playable mill

This graphics slice starts from PR22 at
`f6e41b62addda91ba50a93cbca60e6aac009de18` and is stacked against
`art/cc0-material-proof`. The branch is `gameplay/timber-material-proof`.
It uses the existing custom renderer and authored geometry. Nothing merges or
deploys automatically. Final source/clone counts and pushed identity are in the
implementation PR and its delivery receipt.

## Visible result and scope

Seven existing landing boards and the existing tool chest beside Hearthwater's
mill now use verified Poly Haven weathered timber. Their positions, sizes,
box triangles and navigation/camera ownership are unchanged. One instanced
`timber-panel` group adds one submission per geometry pass compared with the
previous box-only grouping. Grain follows a narrow `.10..20` strip across the
source map, running along each landing board's long axis. This first strip is
also used on the chest; bespoke joinery/end-grain remains future art work.

This is one proven color/roughness surface, not a general model importer or a
complete physically based renderer. No normal/displacement map, tangent
pipeline, mesh streaming or Unreal rewrite is claimed. Painterly palette
modulation uses the measured linear strip mean, bounded to `.45..1.65`, so the
scan's dark color does not multiply the authored brown into near-black.

The original 1k maps stay on D. The committed 512px RGB JPEG is 33,138 bytes,
SHA256 `5f88f449fc017a78efdd07b3e3358788350a9132a438246e948cb0ada052c80a`.
The 8-bit grayscale PNG is 61,548 bytes, SHA256
`020f6844c6232cfc7b060bbead37b6a173cda077ad0960cea59a8932d35c6994`.
Combined **94,686 bytes**, below the declared 180KiB budget. See
[provenance](../../assets/materials/timber/provenance.json) for source authors,
CC0 license, source hashes, Blender preparation and derivative checks. Roughness
has no gamma/display metadata; all 262,144 exported samples match the resized
scalar source, maximum error zero steps in 8-bit values.

`build.py` embeds both maps before the engine, checks image headers/dimensions,
receipt hashes and size bounds, and refuses unresolved placeholders or external
resource markup. The generated HTML pair is identical **2,191,489 bytes**,
SHA256 `5d60dc44290caef667ab30e2ddb715cf951406da21853fc1c47d7c10c7102131`.
Increase over the baseline is 136,544 bytes per standalone output. Windows JSON evidence is normalized to LF in Git under the existing attributes; [representation receipts](../evidence/timber-material/RECEIPT_REPRESENTATIONS.json) distinguish retained original bytes from review-copy hashes, with identical JSON values. Normal game
build/play needs no Blender or third-party Python package.

## Ownership and failure behavior

Each Engine decodes/uploads one pair after both images are valid. Scene `clear()`
preserves these maps; missing/invalid images keep the prior flat material.
Disposal and context loss invalidate outstanding callbacks. Context loss keeps
the existing app's map fallback; this slice does not implement restoration.
The presentation-only test toggle does not write saves or player settings.

Color storage uses SRGB8_ALPHA8 with native linear sampling; roughness uses R8.
Estimated two-map storage is **1,747,625 bytes (1.67MiB)** including the complete
mipmap chains. Driver allocation overhead is unknown. Decoded-image peak is an
estimated 2,097,152 bytes and images are retired after upload. Reported decode
wall time includes asynchronous waiting; upload CPU time measures submission,
not GPU completion. The captured hardware run reported 48.2ms and 4.3ms
respectively, as one sample, not an optimization guarantee.

## Executed browser and desktop evidence

[Software-WebGL report](../evidence/timber-material/BROWSER_REPORT.json) passes
40 actual-browser checks. These include accepted physical travel, both cameras,
low mode, same-geometry fallback, three Earth rebuilds, reload/history, pixels
in main/reflection passes, cutaway and untextured pixel identity. Fault cases
include truncated PNG decode, a decoded 1px JPEG, visible flat-material fallback,
pending context-loss retirement and the production app's map/save/export path.
Independent texel readback obtains roughness red bytes 188/186/187 at three known
points. Encoded JPEG 79/66/57 samples as linear 20/14/10 in an RGBA8 test target,
matching the explicit sRGB transfer. Synthetic probes are not quest progress.

[Desktop report](../evidence/timber-material/GPU_REPORT.json) confirms Chrome
154.0.8037.58, NVIDIA RTX 3080 10GB, driver 610.74, ANGLE/D3D11 hardware rendering,
1920x1080 drawing buffer, device scale 1 and balanced quality. Six controlled
mill cases alternate mapped/plain shading in third person and diorama,
360 normal RAF intervals each, 2,160 total. All P95 values are 7.0 ms; worst
observed 7.1 ms; zero intervals exceed 33.333 ms or 50 ms. No video or accelerated
simulation runs during sampling; warmup is excluded. This short headless sample
does not resolve small costs, measure GPU render time/monitor presentation, or
qualify 60FPS/human comfort. The toggle retains texture allocation and the new
batch grouping, so it is a sampling-cost comparison, not a complete old/new
renderer benchmark. Ambient desktop workloads were not shut down.

Both toggle states submit 2,620 instances and 110,722 triangles at this fresh
mill checkpoint. The observed 31 draw calls vary with shadow refresh cadence;
two color draws use the eight timber instances when enabled. These are submitted
counts, not visibility or measured memory. Both camera screenshots were inspected. The initial measurement setup inverted camera names; the final run checks each name against its actual projection. Initial reports/setup remain on D with the corrected fresh run.

[Actual gameplay](../evidence/timber-material/TIMBER_GAMEPLAY.mp4) is a silent
44.40-second 1280x720 browser recording, 25 encoded frames per second. Seventeen
normal-time commands/UI actions walk a fresh production-created character to
the mill and switch both cameras; no fixture, teleports, grants or accelerated
ticks. [Recording report](../evidence/timber-material/RECORDING_REPORT.json) gives
actions and hashes. Encoding/readback succeeded; MP4 SHA256
`9d8ad5f3f18e2644ba98b34c232c14472e46063db18b2b59cd55b6c809395209`.
The first recording stopped at unsupported (7,-10.5); the retry used supported
(10,-10.5). The initial video, progress and error log remain in the D artifact
folder. No route rule was weakened to make a capture pass.

## Full local gate

`python tools/verify.py --browser` passed against regenerated, checked-in
identical HTML: **52 source syntax checks, 617 Node tests, 53 Python passes,
one existing Windows symlink skip, 24 command-earned journeys, 1,337 browser
assertions in 17 suites**. No failures. Python 3.13.15, Node 24.18.0. See
[local receipt](../evidence/timber-material/LOCAL_VERIFICATION.json). Existing
campaign/equipment/classes/characters, music/exports, home building,
companion, maps, both cameras, cutaway/reflections, native origin persistence,
Earth/Cosmos travel, delivery/discovery and gathering gates all remain.
The exact pushed-head remote clone is verified separately and its receipt
is linked in the final PR; local green alone does not prove that clone.

## Compatibility, play and remaining acceptance

World/key 9, adventure 10 and nested versions stay unchanged. No migration is
needed. XP, class/story choices, gear/socket/fittings, companion, complete
character worlds, construction, crafting, crops, notebooks, scores and exports
remain under their existing owners. Personal browser data was not used.

New checkout: `D:/07-GAMES/Firstlight/authoring/texture-intake-review`.
Heavy captures, logs and fresh clone:
`D:/07-GAMES/Firstlight/artifacts/timber-material-2026-09-30`.
The existing live preview at 127.0.0.1:8780 remains the older PR21 build. Use
this branch's identical `index.html` for an isolated file-origin preview, or
launch `python tools/play_local.py` after the owner has closed the older server.
The launcher refuses conflicting builds and does not silently move save origins.
Walk to the lake marker, explicitly enter Hearthwater, follow the eastern mill
road and inspect the boards/chest next to Ansel. **V** swaps cameras.

Pending Dom: does the grain feel natural in the third-person view, and does it
stay quiet/readable in the diorama? Existing fresh/returning combat, upgrade,
delivery, discovery and gathering questions remain unanswered. The other four
surfaces are acquired/studied but not installed in gameplay. Next bounded art
work can extend the proven surface to a useful door or refine the traveler's
silhouette; choose through actual visual/play feedback. Hosted CI currently has
an account-billing block; no billing change, merge or public deployment is
authorized by this graphics slice.
