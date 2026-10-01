# A connected traveller in the playable browser

Prepared 2026-09-30, final execution 2026-10-01. Branch
`gameplay/traveler-silhouette-motion` starts from PR23 at
`f5c0211348668a37e7e5efc038ed5bf610bf0e9d`, stacked against
`gameplay/timber-material-proof`. Main is unchanged. See the
[task note](../development/TRAVELER_ART_TASK_2026-09-30.md).

## Visible result

The playable visitor has an original fitted jacket, narrow waist, belt, boots,
smaller head, articulated arms/legs and short split cloak. Blade and bow have
different anticipation/recovery/guard poses. The blade meets the right palm;
the bow meets the left, and both string segments meet the moving right palm.
Travel stows the blade at the hip or the bow on the back. A quiver is decoration,
not a new ammunition economy. The mine's hand-held lantern remains.

Actual owned/equipped catalogue identity controls weapon family, silhouette
and material. Saved skin/hair/cloak and equipped armor colors are retained;
socket gems, the one-time Oren temper and two finite fittings have distinct
visible markers. No equipment is granted, auto-equipped or recalculated.
All seven canonical weapons are covered. NPC models keep their existing owner.
These are prototype art choices, not approved final founder character canon.

The new pure `traveler-art.js` owns motion, analytic two-bone joints and body
instances. `traveler-equipment-art.js` reads canonical equipment into the same
frame. WorldArt owns integration and transient motion. Adventure/Arsenal art
retains encounters, arrows, range props and hit feedback; only their old held
weapon blocks are removed. The updated starter art regression checks its
original reward-material and no-mutation conditions through the new owner.
Rule, camera, UI-control and save modules are unchanged; app.js adds only a
test-mode read-only submitted-traveller snapshot.

## Animation and ownership

Accepted horizontal displacement drives gait phase at a 1.35m stride; intent
alone cannot shuffle feet. Blend settles on stopping. Pause and repeated draw
cannot advance the accepted animation clock. Simulation/scene/clock/teleport
discontinuities reset the motion owner. Reduced motion removes secondary bob,
breathing, cloak drift and bow recoil while preserving essential walking and
hand connections. Actor instances have no camera-collision/cutaway authority.

Combat anticipation comes from the current accepted autoattack windup. Recovery
uses actual release objects, not the input press, and cannot claim a successful
hit. Existing successful equip/attack/scene-entry receipts establish ordering:
old releases stay fenced after changing/re-equipping weapons or re-entering a
scene; a new accepted attack before the first draw retains its own recovery.
The first scene sample also retains a new arrow release after the arrow has
already hit. No runtime rule module or serialized receipt format changes.
Confirmed damage, projectile collision, cooldown, stamina, facing, range,
guard/death/retreat and menu input remain under their original owners.

Body submission is **49 instances: 33 box, 12 round, 3 octa, 1 disc**. Equipment
peaks at **27**, total76 below the declared65+40 budget. This uses existing
instanced primitive batches, no new mesh kind, render pass, texture, network
fetch or runtime dependency. It is not imported Blender skinning or a general
mesh/animation pipeline. Both generated HTML files are identical **2,216,075
bytes**, SHA256
`19ce36ab88a87d24114c9d11dd4190c7aaaf0d8c75ae96694705822b22a110b9`.
Increase over PR23 is **24,586 bytes** per standalone output.

## Browser and source evidence

The two pure module suites pass **28/28** checks: distance subdivision, limb
length/connection, finite transforms, actor authority, no mutation, actual
root/palm matrices, all catalogue materials/families, sockets/temper/fittings,
stowage and bounded counts. The updated starter material suite passes3/3.

The current actual-browser traveller suite passes **116/116**, zero runtime
errors. It exercises accepted kit acquisition, movement/autoattack/manual
blade/bow/pulse/guard, both native camera projections, pause, reduced motion,
low quality, scene/weapon changes and releases batched before one frame.
It checks submitted grip centers and both bow-string endpoints throughout
attack poses. A separate, explicitly synthetic framebuffer probe renders only
the actual submitted avatar and gear: scenery cannot satisfy its pixel test.
Finite/submitted geometry claims are kept distinct from that pixel evidence.

The historic command-earned bow fixture
`examples/REALM09_BOW_CHAPTER_II_COMPLETE_EARNED.json`, SHA256
`25e42a82b3b0e4302900fc3c68a19c76fbaa521ded901248e52b4a88cfb553bf`,
passes the existing native migration to adventure10 without changing XP367,
defeats or its trail bow/courier mantle/amber. The legitimately command-earned
strongest fixture uses Dawn's edge, keeper coat, chime clasp, XP563, one Oren
temper and both finite fittings. Accepted appearance changes, real UI character
creation/switching and a native managed reload preserve its whole-world history
and actual palette/gear. These are labelled fixtures, never Dom's personal saves.

## Actual footage and desktop sample

[Gameplay recording](../evidence/traveler/TRAVELER_GAMEPLAY.mp4) is a silent
**32.68-second, 1280x720** actual browser recording, encoded25fps. Twenty-three
normal-time UI/accepted-command actions walk a command-earned fresh bow
checkpoint, deliberately equip blade/bow, enter riverbank practice, use the
existing skill bar and switch cameras. No grants, teleports or accelerated ticks
occur during recording. [Recording receipt](../evidence/traveler/RECORDING_REPORT.json),
[actions](../evidence/traveler/GAMEPLAY_ACTIONS.json) and
[earned checkpoint](../evidence/traveler/BOW_CRAFTED_EARNED.json) make the source
explicit. Encoding and full MP4 decode pass. MP4 SHA256
`9db7dbeb8bd8935cccde0a697465e11e2db7accf1e7e8203e952fc5fd9358919`.
Inspected [blade](../evidence/traveler/BLADE_PRACTICE.png),
[bow](../evidence/traveler/BOW_PRACTICE.png) and
[diorama](../evidence/traveler/DIORAMA.png) frames show actual gameplay.

[Before](../evidence/traveler/GPU_BEFORE.json) and
[after](../evidence/traveler/GPU_AFTER.json) measurements use exactly the same
[three scene setups](../evidence/traveler/GPU_SCENES.json), at PR23 and the final
HTML respectively. Both confirm **Chromium headless shell143.0.7499.4, NVIDIA
RTX3080 10GB, driver610.74, ANGLE/D3D11 hardware acceleration**, 1920x1080 drawing
buffer, device scale1, balanced quality. Each report samples360 normal RAF
intervals per case, 1,080 total; 1.5s warmup is excluded. No video or accelerated
ticks run during sampling. Other ambient desktop workloads are not shut down.

Before P95 values are16.7/16.8/16.7ms; after16.8/16.7/16.7ms. Worst interval in
each report is16.8ms; neither has an interval over33.333ms or50ms. This short
synchronized headless sample cannot resolve small cost differences and is not
GPU render time, monitor presentation, a60FPS claim or human comfort evidence.
At this matched kit checkpoint, submitted scene instances increase
**6,832→6,861**, triangles decrease **168,472→165,420**. Sampled draw-call totals
are27 before and39/27/27 after, with existing shadow-refresh cadence; no new
batch kind/pass is introduced. Counts are submitted geometry, not visibility.

At Oren, existing camera collision constrains the requested5.2m third-person
distance to1.1545m in both reports. The comparison is valid for matched cost,
but these cropped captures do not establish a full-silhouette aesthetic
comparison. Open-ground practice footage is the separate visual evidence.

Original capture bytes/logs stay on D. Review JSON is normalized to UTF-8/LF
under existing Git attributes; [representation receipts](../evidence/traveler/RECEIPT_REPRESENTATIONS.json)
give both original/review hashes with verified equal JSON values. Media is
byte-identical. Browser intervals and encoded video frames are different clocks.

## Retained negative evidence

Initial recording refused unwalkable(10,6); the corrected route uses the existing
walkable gate(15,7), without changing navigation. Early browser walking checks
read the serialized source-return position instead of the actual live scene
position, then used the live diagnostics. A paused auto-toggle was correctly
refused and became an atomicity assertion. Batched tests initially reused a
timestamp request ID for two equips; explicit per-batch indices fixed the
harness, preserving the production duplicate-request safeguard.

Source review and regression probes exposed stale manual/auto recovery crossing
scene/weapon changes, new releases fenced after between-frame equip, and an
initial scene sample losing an already-hit arrow's recovery. Those presentation
defects are fixed and covered; two collaborating reviewers checked their bounded
reproductions. This is review within the Codex team, not outside certification.
The initial full gate failed its old held-weapon material owner test; its original
material/no-grant conditions now run against the traveller. The subsequent full
gate was interrupted during Crossing, after source/journeys, and was not called
a pass. Raw failed/interrupted logs and earlier capture variants remain on D.

## Compatibility and play

Final local `python tools/verify.py --browser` completed with exit0: **54 source
syntax checks, 645 Node passes, 53 Python passes and one existing Windows
symlink skip, 24 command-earned journeys, 1,453 browser assertions in18 suites**,
zero failures. Python3.13.15, Node24.18.0. The
[local receipt](../evidence/traveler/LOCAL_VERIFICATION.json) retains completion
and the pre-integration-commit HEAD separately from the built source hash.
Campaign, creative/music exports, housing/crafting, companion, map, both cameras,
cutaway/reflection, native save origin and Earth/Cosmos continuations all pass.
The final pushed-head remote clone is verified separately in the implementation
PR and external delivery receipt; local green does not imply that result.

**World/key9, adventure10 and every nested version remain unchanged. No new
migration.** Animation is transient. XP, class/story choices, gear/socket/temper/
fittings, companion, per-character worlds, construction, crops, crafting, notes,
music scores/exports and old browser keys remain under existing owners.

Checkout: `D:/07-GAMES/Firstlight/authoring/texture-intake-review`.
New heavy sources/captures/logs/clone:
`D:/07-GAMES/Firstlight/artifacts/traveler-art-2026-09-30`.
The older PR21 preview was absent after session resumption; port8780 was free.
The standard launcher now serves this exact HTML at `http://127.0.0.1:8780/`,
confirmed by response SHA256 and build header. No existing server was stopped,
save origin changed, personal browser opened or storage inspected.
Open this checkout's `index.html` for a separate file-origin preview, or use
`python tools/play_local.py` if the current server has stopped. The launcher
refuses conflicts and preserves the established origin.
Take Oren's kit, explicitly enter the nearby riverbank, try practice and craft
a bow through the existing workbench. **V** switches both views, **R** resets.

Pending Dom: one fresh blade/bow and one returning case. Does the body feel like
your traveller? Do walking/guard/recovery read clearly? Does either view hide
movement or feel uncomfortable? Earlier outing/reward/discovery/gathering/timber
questions remain pending. Primitive-based prototype faces/clothing, NPC rigs,
authored mesh imports and wider camera comfort remain future measured work.
No automatic main merge, public deployment, new class/economy/XP, paid service,
Unreal rewrite or personal-data access occurred.
