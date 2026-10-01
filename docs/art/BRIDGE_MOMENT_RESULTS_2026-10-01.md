# A bridge moment you can actually cross

Dom's side-view bridge, water, mountains and cloudy-sky vision authorizes this
bounded playable interpretation. The original generated image is aspirational;
the evidence here comes from the game. Branch `gameplay/bridge-moment` is stacked
on PR 27 `gameplay/fenna-drover` at `ac1533ac48c70a065d28ce0745a055c5d15899ef`. Source implementation `e8ab7228b465b1a728304ddbee297d1a78d5f4b2`.
The delivery PR records final pushed head, clean remote-clone results, hosted
status and the stable 8780 preview receipt. Main remains unmerged.

## Playable changes and source ownership

The existing Hearthwater lake-to-orchard route now crosses a 15 m thin stone deck
over visible water with four actual open elliptic vaults, five piers/cutwaters,
120 paving slabs, open rails and a small arrival abutment. `earth.js` shares one
frozen definition with art: physical width 3.7 m, supported corridor 3.22 m,
span z12–27 and deck height 1.57 m. Existing entry/return/bridge anchors and north
routes retain their coordinates. Manual segments, pathfinding and ground picking
all reject flanking water; this is supported traversal, not swimming/falling.

Pure `bridge-art.js` owns 317 bridge pieces and 54 backdrop pieces, below the
420/90 budget. `earth-art.js` omits filled terrain under the span and path discs
over its deck. The generic center post was removed; its visible rail-mounted
marker clears the supported corridor, with interaction still at (0,16).
All authored bridge/backdrop parts exclude camera solids and cutaway; they cannot
create saves, quests or payouts. Two original bounded meshes add two batch kinds:
100-triangle vault and 336-triangle asymmetric mountain ridge. Layered mountains
are visual backdrop only, not a new navigable range or realm.

Earth-only renderer changes add fine current normals/pier wakes, a small reflection
breakup adjustment and world-oriented procedural clouds. The cloud ray basis uses
the existing reflected P×V×H transform rather than guessing a mirrored camera;
physical water stays y0.01. Shared bridge channel uniforms choose the local wake
positions. Existing non-Earth sky/water, low-quality fallback and the reduced-motion
time contract remain. No extra texture, network fetch, renderer replacement or
render pass; this is not fluid simulation, full PBR or photorealism.

At the bridge marker, the explicit “Frame the bridge from the side” action closes
the ordinary dialog/focus/pause path and retains the current camera style. Third
person uses 14.5 m distance; diorama uses half-width 9. V switches, R resets and
dragging still orbits. The action is local and optional, with no automatic camera
trigger or FOV change. Both existing camera preferences survive reload.

No migration: world/key 9, adventure 10 and all nested schemas remain. No quest,
reward, XP cap, class, consent/history or equipment owner changed. Stored XP,
sockets/fittings, companion, complete character worlds, housing/crafting and
personal notes/scores/exports keep their owners. Earth still resumes at its
disclosed Firstlight lake checkpoint; personal saves/profiles were not used.

## Executed verification and actual captures

Complete local verifier on a clean exact-source-commit temporary C sparse checkout: **58 syntax modules, 672/672 Node tests, 53 Python
passes + 1 existing Windows symlink skip, 24 command-earned journeys, and
1,590 browser assertions across 19 suites; zero failures**.
Commands: `python build.py`, focused source/browser checks and
`python tools/verify.py --browser`. Regenerated checked HTML outputs are identical:
2,245,939 bytes, SHA-256 `7b2a49fb38c49d660c391debe109f4eaddd31d74c363f6da98d2f84f118c2851`.

Seven new source tests cover supported floor/edges, complete movement segments,
fresh entry ownership, bounded submitted art, exact vault mesh/normal orientation,
whole-scene rail/marker clearance, finite mountain mesh and reflected cloud bases.
The bridge browser passes 46/46 assertions through production
walking/entry/UI, menu V consumption, both camera styles/R/reload, unsupported
water, saved-history preservation, low/reduced motion and actual framebuffers.
Returning coverage uses the labelled command-earned bow checkpoint
`docs/evidence/classes/HUNTER_SOURCE.json`, SHA
`405247931795051c08a1daaedf47aeda7c13df7c72080ec625b00d42f41989f6`.
Earlier campaign journeys and all combat/equipment/creative/companion/roster/map/
cutaway/reflection/native-persistence suites remain in the full gate.

Actual isolated framebuffer differences: clouds main 262,840 changed
channels, reflected clouds 830,926, new current alone
199,556 with clouds disabled and time unchanged. Reduced motion
freezes added motion exactly; GL error 0. These synthetic engine probes
establish rendered contribution, not physical realism or playtesting.
Separately, at least 30 visible ordinary app RAF samples over at least 400 ms advance
accepted bridge position and submitted local leg joints. Explicit visible pause
retains both; resume reaches the bank, and the actual reduced-motion control reaches
the traveller. That software normal-walk page explicitly selects Low through the
real graphics control; balanced effects have separate pixel probes. The main UI coverage remains accelerated and
labelled; normal-time evidence is separate.

[Evidence](../evidence/bridge-moment/README.md) includes both hardware views, the
normal-time running frame and a **32.52-second actual silent 1280×720 gameplay clip**.
It uses a fresh production-created character, 17 accepted normal-time walking/UI
actions, no teleports, planted objectives or inventory grants. Full MP4 decode
exited 0. Encoded frame rate is a container property, not game FPS.

## Matched desktop measurement

Serialized baseline/candidate runs: RTX 3080 10 GB, driver 610.74, headless
Chromium 143.0.7499.4, confirmed ANGLE NVIDIA D3D11 hardware WebGL2,
1920×1080 drawing buffer, DPR 1, balanced quality. Same fresh production-character
setup, entry/walk and explicit matched camera coordinates; two cases ×360 ordinary
RAF intervals per build, 1.5-second warmup excluded. No video or accelerated ticks
during sampling. Baseline HTML `80acee81727b5a030f6569e41ff1966cc3330400223bfda2df1d1155774fe079`.

| View | Before P95 ms | After P95 ms | After maximum ms | After >33.333 ms |
|---|---:|---:|---:|---:|
| Hearthwater bridge side view · third person | 16.7 | 16.8 | 16.8 | 0 |
| Hearthwater bridge side view · diorama | 16.7 | 16.7 | 16.8 | 0 |

Scene cost: +137 instances, +19,848 triangles, texture storage unchanged at
1,747,625 bytes. Raw draw calls differ with the existing shadow-update cadence
(+4 third person, −11 diorama); this is not a new-pass count or fixed performance
improvement. These short stationary, quantized headless intervals are not GPU
completion time, monitor presentation, sustained FPS, comfort or Unreal qualification.

## Corrected failures, review and remaining limits

Early source/browser greens missed a generic center post and reversed vault
normals. The collaborating read-only reviewer reproduced both; the parent moved
the marker onto the rail and corrected winding. Whole-scene source tests now
check the actual renderer submission and all outward side normals. The reviewer
independently captured 2,549 Earth parts, 317 bridge parts, zero intersections
within the supported corridor, marker nearest X 1.638, and 100 correctly oriented
vault triangles; focused checks 33/33. This is collaborating review, not outside
certification or a colleague-run full/browser/GPU gate.

The owned preliminary full gate was stopped after verified process ancestry for
those corrections; its partial logs are excluded from final counts. Initial UTF-8
helper/missing diagnostic and nonexistent framebuffer-dispose failures were fixed,
retained and followed by the final complete run. A boundary check needed 1e-7
arithmetic tolerance for a 1e-16 touching-boundary discrepancy. Review helper
batch-map setup was corrected separately. PRIOR_FAILURES identifies retained raw
receipts on D. Nothing is reported as passed from that interrupted gate.

A later completed full gate passed all 18 older browser suites but failed the new
ordinary-RAF wait: a string-expression helper conflicted with CSP. Function-form
waits fixed it without policy changes. One focused second-page navigation then
timed out at 30 seconds; bounded 60-second navigation completed, with the cause
unproven. The reviewer tightened destination/paused/visibility/elapsed-time/local
joint evidence. The final complete gate includes those assertions and explicit
Low selected through the UI for ordinary software walking. Slow successful test
cleanup and the refused interruption after its process had exited are recorded
separately; no other process was stopped or success fabricated.

The next full run timed out after 180 s in an unchanged import-helper Python test.
A diagnostic single case passed in 226.243 s on queued D storage; the same tiny Git
init in disposable C scratch took 36.9586 ms while D queue depth was 32.
Moving only scratch did not resolve a later D build-output write timeout. The
final same verifier uses a clean 24.8 MB temporary C sparse Git checkout at the exact
implementation commit, omitting only historical evidence images/videos. All source,
tests, required fixtures and runtime assets are present; Git status/build identity
are checked. It uses C disposable test/profile scratch and unchanged assertions/
timeouts. Full source/objects and heavy historical media remain on D; generated
software-suite evidence is byte-copied from this temporary checkout to D. The game checkout, committed
evidence, raw videos, archives and verification clone remain on D.
STORAGE_DIAGNOSTIC records scope; this is not a disk-health diagnosis or permission
to stop other writers, move projects or touch personal data.

Actual screenshot review confirms a larger traveller, separated-leg running pose,
offset sign, ridge-shaped mountains and visibly broken reflections. Remaining
visual limits are concrete: the near rail overlaps some lower-leg/foot silhouette,
the arrival bank is too rectangular/abrupt, arch/mountain reflections remain
mirror-like, and mountains are densely faceted with limited atmospheric softening.
No definite actor floating or geometry penetration is visible in the reviewed
stills. The concept's photorealism and memorability have not been achieved or
qualified by these tests.

Dom is away: no new human playtest, beauty or camera-comfort approval was observed.
Screenshot questions: does the crossing invite you to stop and look? Is the running
silhouette readable in both cameras? When available, walk it with fresh and returning
characters and retain older combat/reward/discovery/gathering questions. Next bounded
art work is a natural bank transition and gentler water/atmospheric materials,
following feedback; Darric's earlier cast proposal remains separate.
Heavy assets/logs/clones stay on D. No automatic merge, public deployment,
paid-provider use, billing change, personal-profile access or sanctuary changes.
