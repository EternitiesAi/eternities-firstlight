# Tapered quarry shoulder, 2026-10-02

The eastern quarry ridge now has a continuous tapered rock-and-earth face under
the unchanged grass lip. Nine short sections blend into the original wall at
both ends. The road, twelve paving stones, Darric, stock and task signs stay
visible and reachable in diorama and third person. This is a small improvement
to familiar country, not an expansion of supported land or open-world scale.

Review branch: `gameplay/quarry-natural-shoulder`, stacked on PR33 at
`906d9af2f60e040650754c02859d86ac266fcccc`. Tested source:
`05977dae56f4a87be314657b2f57cc915e1e8caf`. Final delivery head, independent
remote verification, hosted checks and preview/attachment receipts are recorded
separately in the PR and local delivery artifacts, avoiding a post-proof commit.

## Geometry and ownership

`earth-shoulder-art` reads the actual submitted grass matrices along X18,
nominal Z-24..-6. The upper seam follows all 36 rendered strip undersides.
At the mill merge the grass uses a different plane; canonical height would
misplace the seam by 12.5-29.5 mm. Grouping retains both planes and their small
existing overlap/height step. Nine two-metre pieces have outward widths
0.2, 0.64, 1.08, 1.35, 1.24, 1.1, 0.97, 0.58 and 0.2 metres.

Positive orthogonal bases reuse the existing `bank-slope` mesh and normal
convention. Every lower-profile vertex remains under world water Y0.01.
All eight actual cap-plane joins retain overlap throughout their exposed
height. Actual vertices stay outside the supported edge and below the lip;
actual non-cap world normals face outward/up without a horizontal walking shelf.
Nine instances / 648 triangles add zero draw calls in six matched rendered
comparisons. Counts measure geometry, not GPU execution cost.

Engine, Earth ground/solids, combat, rewards, story, XP, equipment and renderer
owners are unchanged. The golden probe preserves all 2,550 captured preexisting
static add/box parts byte-for-byte, including terrain and camera flags; that mock
omits beam, bench and dynamic residents, so it is not a whole-scene count.
Real renderer deltas are recorded separately. World/key9, adventure10,
earthStory1 and nested save versions are unchanged; there is no migration.
Stored XP, equipment identity/sockets/fittings, explicit class/soul/story choices,
companion, housing, crafting and music remain covered by existing suites.

## Verification

`python tools/verify.py` passed in the authoring checkout. The full command
`python tools/verify.py --browser` then passed at the clean exact-source commit
above: 60 syntax checks, 729 Node tests, 53 Python passes plus one existing
Windows symlink-privilege skip, 24 command-earned journeys, and 1,839 browser
assertions across 20 suites. Zero final failures. The Earth suite has 104
assertions, including actual submitted seam/camera checks in both views and
supported road walking/outboard movement and picking refusal. The nine new
geometry tests cover actual world normals and cap planes as well as seams.

Both regenerated checked-in HTML files are identical: 2,267,932 bytes, SHA256
`d1f76dc5a7685de15344beb01f765879e70053da50bb423d7faee2493ddb7e09`.
Full source logs and receipt live under
`D:/07-GAMES/Firstlight/artifacts/quarry-shoulder-2026-10-02/`.
The small clean C proof checkout excludes only documentation raster/video;
runtime assets, source, tests and fixtures remain. Heavy generated proof evidence
stays on D. Exact final remote-head verification and media blob checks are
separate delivery gates, not implied by the source result.

Independent read-only source review ran the then-eight geometry tests and checked
actual normals/cap-plane joins. Its suggested regression gap was subsequently
closed with the ninth test. Independent visual review inspected six final matched
views, all five actual-walk stills and three extracted video frames. Neither
reviewer ran the full verifier/GPU gates or watched the full recording. Source
and sampled images have no remaining blocking finding; human acceptance is pending.

## Actual footage and measurements

[Actual quarry walk](../evidence/quarry-shoulder/actual-quarry-shoulder-walk.mp4):
18.0 seconds, 450 fully decoded frames, 1280x720, silent, 25 fps encoding. The
recorded normal-time browser run has 15 checkpoints. It loads a labelled
command-earned fresh-bow quarry checkpoint: two public-work steps packed, task
undispatched and unpaid. Accepted navigation, actual confirmation and V camera
switching use ordinary animation frames; there is no stepping, capture-mode
time manipulation, grant, new quest change, payout or personal profile.

Adventure fields except legitimate elapsed time, housing, notes, music score and
revision are preserved. The existing production sandbox tick applied to a copy
accounts for ordinary depletion regrowth without new commands/inventory changes.
The full run, trim times, source/build hashes and event details are in
[capture evidence](../evidence/quarry-shoulder/ACTUAL_CAPTURE_REPORT.json).
Wall-clock trim is not frame-exact event alignment. Static matched views use
paused accelerated software-WebGL setup and are distinct from actual gameplay.

Actual hardware: Chromium143.0.7499.4, ANGLE NVIDIA RTX3080 D3D11, Windows driver
32.0.16.1074, balanced quality, 1280x720 drawing buffer. Two short 180-interval
visible RAF samples at the packed road/third person and north shoulder/diorama
give median about16.7ms, P95 about16.7-16.8ms, max16.8ms and zero intervals over
33.333ms. Software browser verification shared the CPU. These 360 intervals do
not qualify sustained FPS, GPU execution/monitor timing, human comfort or Unreal.

## Failures and remaining limits

The first two-section /144-triangle trial passed geometry and 104 browser checks
but visual review found abrupt full-width ends reading as attached slabs. The
final nine-section taper resolves that finding; superseded images remain on D.
An initial targeted test failure was a direct Earth-art mock discarding submitted
box records; the mock now retains them and its original assertions remain. Two
capture attempts failed on an incorrect canvas selector and an overstrict
sandbox-revision equality that ignored legitimate regrowth. Correct selector
and production-tick projection repaired the evidence probe. Failed raw reports
remain under `actual-walk` and `actual-walk-final`; only `actual-walk-verified`
is the successful recording. No gameplay rules were changed to get a pass.

The existing mesh still reads as a stylized cliff with repeated bright teeth and
vertical ribs. This is a bounded art-polish limit. Some world labels overlap the
Story panel in the sampled views, also present before this patch. Sampled still
review does not settle temporal shimmer. Ask Dom: does this edge look grounded,
is the route clear in both cameras, and does any scenery suggest walkable land
that is not supported? Earlier equipment/combat/bridge questions remain open.

Launch `PLAY_FIRSTLIGHT_WINDOWS.cmd` or `python tools/play_local.py --no-browser`,
then use `http://127.0.0.1:8780/` in the usual browser. The stable preview is checked
and refreshed separately during delivery; these records do not imply it already
serves the new build. No automatic main merge, public deployment, paid/billing
action, personal-profile access or unrelated service shutdown.
