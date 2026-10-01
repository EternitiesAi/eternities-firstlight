# The mill repair in the playable world

Base: PR24 `646d56f3a621e14a8cd3b69fe614bc66e96e4807`.
Implementation: `2bc753f70cff50738675c217a9bddb4c871fcd27`, on
`gameplay/mill-gate-craft`, stacked on `gameplay/traveler-silhouette-motion`.
Origin/PR24 were checked twice; no newer head, comments or reviews were found.
Read the [task](../development/MILL_GATE_TASK_2026-10-01.md) and
[actual evidence](../evidence/mill-gate/README.md).

The existing headrace gate now has original mortised uprights, capped lintel,
stone footings, iron guides, five separate grained leaf planks, straps, rivets,
a rack/crank and a visible repair brace. It projects the existing saved
`mill-gate` step. Jammed and repaired leaf centers differ by .74 m. The leaf's
grain follows local X into world vertical through positive-determinant matrices.
The rack remains engaged at both heights. Fixed parts: 23 instances; moving
parts: 23 jammed /25 repaired, below the 29-part budget. All details exclude camera
solids. The existing ground, pond and interaction stance remain authoritative.

The comparison distinguishes current and future work, then recognizes the
already-spent 2 timber. A local view button closes the panel through its usual
focus/pause path; remote review offers the real walk back. Viewing creates no
command receipt, payout, objective or cost. The existing wheel now reads
simulation time, so explicit pause and reduced motion freeze it. No gate-cycle
physics or water simulation is implied by this finite remembered repair.

World/key9, adventure10 and nested versions remain. There is no migration,
new reward, class/XP/gear change, forced camera framing or texture download.
Existing timer, equipment/socket/fitting, chapter/consent, housing/companion,
character, notebook/music/export owners remain intact. Personal profiles were
not inspected. Main is unmerged; no public deployment.

## Executed verification

`python build.py` regenerates identical 2,221,306-byte HTML outputs,
SHA256 `19dae01e07854d3bef5cef07ba3efacad4d77a81fa9a023938803cda3a236c52`.
`python tools/verify.py --browser --output <D artifact directory>` passed:
55 syntax modules, 651/651 Node tests, 53 Python passes plus 1 existing Windows
symlink-privilege skip, 24 command-earned journeys and 1,468 browser assertions
across 18 suites; zero failures. The implementation PR records final exact-head
remote-clone verification separately. Installed development runtimes were reused.

The Earth story suite now passes 157/157. It checks actual submitted leaf/hardware,
canonical and visible approach/pond boundaries, both cameras, the explicit
comparison/cost, local/remote view actions, focus/prior pause and immutable earned
state. Normal RAF animation samples use a separate storage context and their own
runtime-error listener. Walking setup is accelerated in that suite; its 300 ms
wheel samples use normal RAF. Source tests cover original cost/prerequisite,
retry/capacity, payment and strict save validation. Existing reload/character
tests remain. Timber checks retain the original 8 pieces and separately account
for the gate's 3 fixed + 5 moving mapped members, fallback, low quality and texture
lifetime. This is submitted geometry/control evidence, not a pixel-motion metric.

Early negatives are retained on D: two new unit assertions assumed exact decimal
and Float32 equality; they now use tight numerical tolerances. A browser assertion
incorrectly excluded the panel's legitimate 'Viewing' explanation; it now checks
the actual single repair button. Its failed run was 108/109. A source reviewer
identified shared-storage/error-listener hazards in the planned normal-time
probe; both were corrected before the full run. An out-of-duration frame extract
produced no image despite FFmpeg exit0; the selected 22 s frame was corrected and
inspected. These do not count as successful attempts. No acceptance was weakened.

## Actual hardware sample and gameplay

The 27.40 s silent 1280×720 MP4 is actual gameplay: 24 scripted normal-time accepted
walks/UI actions from the legitimate fresh-bow source checkpoint. Its older
adventure8 world migrates normally to10. The repair consumes 2 of 4 timber, remains
accepted/completed and unpaid, and both cameras appear. No objectives, materials
or position were planted. Complete video decode exited 0; encoded 25 fps is a media
format. Video SHA256:
`71edd7a6fba8e12b927005ddd33837320554355a319dc3dcaee959c4e5879492`.

Matched base/final hardware measurements were serialized after the full local
gate, without recording during sampling: RTX 3080 / 10 GB, driver 610.74,
Chromium headless shell 143.0.7499.4, ANGLE/D3D11 hardware, 1920×1080, balanced,
three cases of 360 normal-RAF intervals per build. Same command-earned fixture,
setup, browser, resolution and renderer; exact source/build hashes are recorded.

| Case | Before P95 ms | After P95 ms | Before → after instances | Before → after triangles |
|---|---:|---:|---:|---:|
| Jammed · third person |16.7|16.7|2662 →2704|111202 →114170|
| Repaired · third person |16.8|16.7|2663 →2706|111214 →114810|
| Repaired · diorama |16.7|16.8|2663 →2706|111214 →114810|

Worst interval 16.8 ms in both builds; none exceeded 33.333 ms. The extra dynamic
timber group adds one submission per geometry pass; mapped instances 8 →16 and
main/reflection mapped submissions 2 →4. Total sampled draw calls 31/45/31 before,
33/33/33 after include the existing shadow refresh cadence and do not imply a
draw-call reduction. Texture allocation is unchanged 1,747,625 estimated bytes.
These short quantized headless intervals cannot resolve small GPU costs or
qualify monitor presentation, comfort, sustained FPS or Unreal performance.

The source reviewer found no remaining blocking defect and separately ran 58
focused tests. This is a collaborating review, not outside certification.
Dom's fresh/returning outing, traveller, beauty/comfort and repair-readability
acceptance remains pending. Hosted execution has had an account-billing block;
the PR reports the new exact-head run status without rerunning that unchanged block.
