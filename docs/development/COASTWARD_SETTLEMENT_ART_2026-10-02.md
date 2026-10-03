# Coastward settlement exterior art, 2026-10-02

This bounded original art slice dresses the existing `west-house`, `east-house` and `field-store` solids. It replaces their previous roof/front decoration with attached roof framing, shallow eaves, low stone facing, timber joinery, closed doors and shutters. A secured stack of packing boards gives the store a small ordinary work detail. The generic wall boxes, collision footprints, supported ground, people, task positions and rewards remain owned by the existing realm/runtime modules.

The implementation was authored on `agent/coastward-settlement-20261002`, based on `25d932057bc91305a5c16c3291432a2351e7dfbf`, in the dedicated Earth/Atlantis worktree. It owns only [the new art module](../../src/coastward-settlement-art.js), [its focused CPU tests](../../tests/coastward_settlement_art.test.cjs), and this note. Root owns integration, build registration, matched browser/hardware views and subsequent acceptance. Root's separate `9dd555f50ce104e1d49494ce0ee9207d0d1e0c24` coast-bank/woodland change was not edited or verified by this slice.

## Attribution and interpretation

The [realm charter](../design/FIRSTLIGHT_REALM_CHARTER_2026-09-11.md), section 1, preserves Dom's founder direction for Earth's greens, water blues, wood/ground browns, stone roads, towns, ordinary people and rough/soft living textures. Section 2 extracts that direction; later recommendations are separately authored. This module interprets those material and ordinary-life themes through original exterior geometry. It does not make its particular roof proportions or shutter design a founder decision.

The recovered local source `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/EARTH_COMPLETE_DESIGN.md` describes Crownfields' working farms and market villages at E02, lines 246–248, and Reedmere's layered green/blue water landscape at E05, lines 288–292. Its material direction at lines 1222–1232 includes pale dust, personal spaces, weathered wood and practical water-side construction. These are source recommendations rather than evidence that a whole province exists. Coastward Road, Merren and Vessa remain provisional original names from the existing foundation. These three buildings are not identified as canonical Crownfields or Reedmere buildings. The [environment art sheet](../design/REALM_ENVIRONMENT_ART_2026-10-02.md) is a concept target, not a gameplay screenshot or final architecture approval.

## Pure interface and integration contract

`globalThis.RealmCoastwardSettlementArt` and CommonJS export the same frozen API: `{parts, decorate}`.

- `parts(def, {height})` returns fresh instance records `{kind,p,s,c,opt}`. It derives placement and dimensions from the three parent solids and queries `height(x,z)` at each building center. The default floor is 1.57. Non-Earth definitions return an empty array. Missing/duplicate parent IDs, nonfinite dimensions, undersized buildings or nonfinite supplied heights refuse before any writer mutation.
- `decorate(art, def, context)` computes all parts first, calls only `art.add(...)`, and returns the emitted count. It does not call begin/commit/dispatch or read/write simulation state, progression, saves, input or camera preferences.
- Root calls this decorator **in place of** the old three `roof(...)` calls and the old house-front loop in `world-atlantis-earth.js`. Retain all generic parent wall boxes and all other realm decoration. Overlaying both versions would duplicate the roof/front surfaces.
- New instance kinds are only existing `roof`, `box` and `timber-panel`. No geometry/material registration, acquired assets or image generation is needed. Timber uses the already approved renderer/material path; joinery's positive orthonormal matrix places the local-X texture grain along each actual beam.

All opaque parts carry `cutaway:true`, `cameraSolid:false`, `appearanceOnly:true`, and matching `solidId`, `structureId` and `worldSolidId`. The generic parent boxes keep their original collision/camera authority. New parts deliberately omit `worldSolid` and `worldRoof`: the existing settlement roofs used ordinary focus cutaway, while `worldRoof` is a separate shelter-removal mechanism. The renderer's actual instance encoder gives every new part the ordinary cutaway marker. The module does not force cutaway on or alter the user's preference.

## Geometry and budget

| Parent | Existing center | Existing dimensions w × d × h | Replacement instances |
| --- | --- | --- | ---: |
| west-house | (-17, -77) | 9 × 9 × 4.2 | 57 |
| east-house | (16, -77) | 8 × 8 × 4 | 57 |
| field-store | (-7, -79) | 8 × 7 × 3.6 | 63 |
| Total | | | **177** |

This is 177 total instances for the replacement decoration, within the authorized 180-instance ceiling. Removing the replaced details avoids counting both versions. They join the existing three mesh batches; actual draw calls, frame timing and final scene totals require Root's integration measurements.

The roof shell starts at parent top +0.03, rises by parent height ×0.28 and overhangs by 0.28 on each X side and 0.25 on each Z end. Fascias, barge boards, king posts, ridge and rafter tails meet the authored roof profile; there is no additional flat foundation platform or walkable cap. Roof/framing mesh extents remain within 0.42 of the parent footprint and well above actor head height.

Body-height facing stays within 0.16 of the original solid footprint, less than the existing 0.31 actor clearance radius. Stone begins above the supported floor. Store packing boards are secured at the front wall, separated from the door and outer brace, and remain within that collision clearance. They create no loose stock to walk through or collect. Closed door/shutter metadata is presentation only: no entrance, interior, interactable icon, resident schedule, item or harvesting entitlement is created.

The actual new mesh bounds are clear of every authored public route segment and all existing realm point anchors, including Merren (-6,-68), the register (8,-69), and the approach/field-work loop. No street, field-water catch, produce task, delivery record or bridge rail changes are included.

## Focused verification and limits

Commands run in the owned worktree:

```text
node --check src/coastward-settlement-art.js
node --test tests/coastward_settlement_art.test.cjs
```

The focused suite passed **10 tests, 0 failures, 0 skips**. It exercises browser-global/CommonJS exposure in an isolated VM, finite/deterministic counts, actual production-mesh transformed bounds, roof/rafter attachments, positive timber bases and grain endpoints, actor/route/point clearance, actual production cutaway instance encoding through a synthetic GL sink, relocated parent/floor derivation, mutation isolation and refusal before partial output. The GL sink does not render pixels or certify camera behavior.

The existing `world_atlantis_earth.test.cjs` roof equality assertion must recognize this bounded settlement contract when Root replaces the old decorator. The three replacement shells intentionally overhang and use the documented +0.03 base; other realm roof/canopy checks should retain their current meaning.

No browser, GPU, full suite, build, persistence exercise, personal save or protected resident-world operation was run for this slice. Matched diorama/third-person visibility, texture read, roof scale, shadow behavior, integrated render cost and human feel remain Root's subsequent review/acceptance work. The CPU clearance proof is a bounded geometry check, not independent runtime certification or human acceptance.
