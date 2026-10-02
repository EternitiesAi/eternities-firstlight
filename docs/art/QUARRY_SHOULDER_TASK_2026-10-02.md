# Quarry eastern shoulder

Base: PR33, 906d9af2f60e040650754c02859d86ac266fcccc. Branch:
gameplay/quarry-natural-shoulder. Fetch found no newer gameplay or review comments.

Player promise: the familiar quarry road has a connected irregular rock-and-earth
side rather than a rectangular extrusion. Browser prototype; both diorama and
third person. This is scenery below/outside existing support, with no new route,
collectible, reward, profession, terrain authority or claim of open-world scale.

Scope: eastern lip X18, nominal Z-24..-6; exclude patch joins near -26/-4 and the
inner pond (local water1.36 is distinct from world water.01). Keep road, residents,
stock, task signs and the twelve paving stones visible and reachable. Existing
Earth ground/solids, save/XP/equipment/story/music/crafting/companion owners stay.
World/key9, adventure10 and nested versions unchanged; no migration.

Ownership: pure earth-shoulder-art projects the actual submitted grass matrices.
Earth art supplies those strips after its unchanged terrain loop. Reuse the
existing bank-slope mesh and batch, with orthogonal rotation/positive scale only;
the renderer's normal convention does not support arbitrary shear. Stable art
IDs quarry-east-shoulder-1..9. WorldArt/test inspection remains transient.

Upper seam: rendered underside at local(.5,-.5,+/- .5). Group only the two
matching strip planes: sampleX13 for Z-24..-10, sampleX9.5 for -10..-6. Check
every strip against the actual slope seam, not only canonical height or endpoints.
Lower profile stays submerged below world Y.01, including pitch and end extents.
Measure actual outward bounds and a small pitch margin. No horizontal cap or
new camera-solid/cutaway/terrain/wind/mountain authority. Initial two-instance /
144-triangle trial passed geometry/104 browser checks but actual images still
read as two long slabs with abrupt ends. Refine into nine two-metre sections /
648 triangles in the same existing mesh batch, widths .2..1.35.. .2 metres.
Preserve every original strip and the two height profiles; no extra join stones.
Keep the first images and source-check record as superseded evidence.

Acceptance: immutable baseline terrain/camera solids; finite positive orthogonal
matrices, seam continuity, outward geometry and submerged feet; supported road
walk/picking accepted, outboard ground refused. Both-camera matched before/after
stills and normal-time real browser walk. Preserve all existing verifier suites,
fresh exact-head remote build/test proof and failure/skip records. Synthetic or
accelerated setup is distinct from gameplay, GPU timings and human acceptance.

Human questions remain pending: does the shoulder look grounded, is the route
clear in both views, and does any scenery suggest reachable land that is absent?
No paid/provider/billing action, personal profile, main merge or deployment.
Heavy capture/proof data stays on D; bounded small C proof allowed for measured I/O.
