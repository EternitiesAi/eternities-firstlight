# Coastward woodland canopy art, 2026-10-03

This bounded original scenery slice replaces Coastward's thirty stacked cones with a mixed, overlapping woodland canopy on the same ten standing-tree solids. It adds shallow timber bark faces, close buttress-root detail and attached rising branches. It creates no ground, movement, interaction, resource node, inventory, tree consumption, story state, fauna or asset import.

The module was authored on `agent/coastward-woodland-art-20261003`, based on `ca6522d7eebc8358164466a14da3757425b23305`, preserving the preceding skitter, companion and settlement commits. It owns only [the new woodland module](../../src/coastward-woodland-art.js), [its focused CPU tests](../../tests/coastward_woodland_art.test.cjs), and this note. Root owns the actual decoration caller, build, matched camera/hardware views and full integration verification. No existing shared source/test files were edited.

## Source direction and interpretation

The [founder realm charter](../design/FIRSTLIGHT_REALM_CHARTER_2026-09-11.md), section 1, preserves Dom's direction for Earth's forest/grass greens, wood/ground browns, natural life and rough/soft living textures. Section 2 extracts that direction; later recommendations are separately authored. The recovered local `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/EARTH_COMPLETE_DESIGN.md` describes heavy canopy beyond tended woods at E03, line 262. Its visual direction at lines 1204 and 1230 asks for readable canopy landmarks and distinctions among mixed woodland, old growth, managed coppice, tangled wet ground and settlement.

Those recommendations guide this small original presentation change. The rounded/angular/sheltering profiles are deterministic shape descriptions, not new species, recovered canonical tree designs or founder-approved final forestry. Coastward remains provisional local geography; these ten trees do not claim that Elderweald or a whole forest province has been built. Existing Hearthwater/Wildwood geography remains separate. Standing-tree art does not harvest or pay the Coastward fallen-bough commission, which remains owned by the finite trail rules.

## Pure API and integration

`globalThis.RealmCoastwardWoodlandArt` and CommonJS export the same frozen `{parts, decorate}` API.

- `parts(def, {height})` derives each tree from exactly one parent for each existing ID `woodland-trunk-0` through `woodland-trunk-9`. It queries supplied floor height at that parent's center; default floor is 1.57. Non-Earth definitions return an empty array. All parents are resolved before producing geometry. Missing/duplicate IDs, nonfinite data, unsuitable bounded dimensions or nonfinite height refuse before writer mutation.
- `decorate(art, def, context)` computes all geometry first, calls only `art.add(...)`, and returns the count. It does not read the simulation, progression or saves; begin/commit, state dispatch and scene construction stay with Root.
- Root replaces **only** the old `trees.forEach` block that emitted three cones per tree in `world-atlantis-earth.js`. Retain the authoritative generic trunk boxes, canonical solid data and all other realm decoration. Do not overlay both versions or remove/reposition the original trunks.
- Only existing `timber-panel`, `round` and `octa` kinds are used. No new mesh/material registration or acquired assets are needed. Timber grain follows each beam's actual local-X axis via a positive orthonormal matrix.

Every part carries `cameraSolid:false`, `cutaway:false`, `appearanceOnly:true`, and matching `solidId`, `structureId` and `worldSolidId`. No new `worldSolid` authority is introduced. Original trunk boxes retain their existing body/camera ownership and support height. Bark faces shallowly intersect those boxes; they do not conceal an incompatible smaller round collider.

## Geometry and render budget

There are **140 total replacement instances**, 14 per tree, within the authorized 220-instance ceiling and preferred 120–180 range:

| Detail | Per tree | Total |
| --- | ---: | ---: |
| Shallow bark faces | 4 | 40 |
| Close buttress roots | 3 | 30 |
| Rising branches | 3 | 30 |
| Lower crown lobes and upper crown | 4 | 40 |
| Total | **14** | **140** |

Replacing the old 30 cones adds 110 instances rather than retaining duplicate crowns. At the current engine meshes, 28 round instances, 12 octa instances and 100 timber-panel instances emit **30,768 vertices / 10,256 triangles per geometry pass**, versus 1,080 vertices for the old cones. These are deterministic source geometry counts, not observed frame timing or total-scene GPU work. The three existing kinds reuse their current batching paths; Root must measure actual draw/pass cost and low-mode/mobile suitability after integration.

Spread derives from the actual parent footprint with a bounded factor and restrained per-index variation. Branches start within the upper trunk and rise into their corresponding crown lobes. The overlapping upper crown joins the three lower lobes; rounded and angular profiles break the repeated cone silhouette. Actual high opaque mesh bounds clear the canonical 1.7-metre actor envelope by more than 0.2 metres at the current parents. Low root detail remains above supported ground and within 0.15 metres of the original trunk footprint, less than the existing 0.31 actor radius. This is presentation detail, not a new collision surface.

Only crown lobes use existing `wind:2`. The current engine vertex shader translates those instances by at most 0.095 metres in world X and 0.05 metres in Y. The CPU route checks reserve the entire displacement envelope, including the fixed reduced-motion shader sample. Rigid wood has no wind. CPU rest-pose branch/crown intersections and analytic displacement margins establish bounded volume overlap; they do **not** prove a rigid leaf/branch joint through actual GPU rendering. No leaf-stem skinning or new wind system is claimed.

## Focused checks and remaining limits

Commands run in the owned worktree:

```text
node --check src/coastward-woodland-art.js
node --test tests/coastward_woodland_art.test.cjs
```

The focused suite passed **12 tests, 0 failures, 0 skips**. It checks isolated global/CommonJS exposure, exact budget/profile determinism, positive finite actual-mesh transforms, parent tags/camera exclusion, bark intersection, supported root extents, branch endpoint/grain alignment, actual convex crown overlap, conservative wind displacement, bounded parent-derived spread, supplied floor/relocation behavior, fresh output/no simulation access and refusal before partial writes.

Clearance checks inspect every current authored Earth route segment with the full 1.7-metre body and 0.31 radius, plus all foundation NPC/objective/return/view anchors, the optional enemy point, and the Earth supply trail's giver/step anchors. Current shader amplitudes are checked against the exact source path; changing that shader requires reassessing the envelope. The module itself leaves all canonical routes, trunk solids and task/reward identities untouched.

No browser, GPU, build, full suite, personal save, protected resident-world operation or new worker was used. Root still needs matched diorama/third-person views, original route/target visibility, normal/reduced-motion rendering, integrated shadow/water cost and actual performance evidence. Canopy readability, camera occlusion, woodland feel and human acceptance remain unverified. Self-authored CPU geometry checks are not independent runtime or rendered acceptance.
