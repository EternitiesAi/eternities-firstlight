# Heaven and Hell opening foundations, 2026-10-02

Original realm content for the authorized Firstlight overnight integration.
This is a data/art delivery for the integration owner, with focused geometry
proof. It is not an independently built or browser-qualified game release.

Base: `4b5f3c7a7a7672ccefbf2ef8501507f017ec06d3`.
Worker branch: `agent/world-heaven-hell`.
Isolated worktree: `D:/07-GAMES/Firstlight/authoring/world-heaven-hell`.

Owned files are `src/world-heaven-hell.js`,
`tests/world_heaven_hell.test.cjs`, and this note. Root owns shared world rules,
save schema, travel/checkpoints, quest commands, combat, UI, module loading and
actual browser/target-device acceptance. There are no shared-file changes in
this delivery.

## Player promise and authored scope

Heaven offers sincere welcome and useful craft below an extraordinary skyline.
The Garden of Voices, Ruby Arcade and Mirror Causeway form a continuous grounded
opening. Rielle is a precise public bellwright, Calen knows the lower routes,
and Yselle tends cultivated public beds. A visitor can compare three response
plates without fighting, hear useful authored dialogue, reach the northern
overlook and return home at any stage.

Hell offers an honest warm refuge within coal/iron country. Istra keeps the
return promise; Tovan knows the claim machinery because he once maintained it.
The exposed Tithe Mile and sheltered Moth Cut pass different sides of a solid
industrial spine and join at Slag Quay before Bell Yard. A dry service path
runs beside a closed culvert mouth. Three route inspections form the opening
survey. A single salvage sentinel occupies the eastern side pocket, apart
from required survey anchors and the ordinary return routes.

The realm and character names from the design packages remain provisional
game-fiction labels. The dialogue is newly authored from their stated motives
and knowledge; it is not a quoted original manuscript or an inferred private
resident history. Canonical person bodies belong to shared dynamic world art;
`decorate` supplies no duplicate person bodies or fake online visitors.

The large northern buildings are explicitly distant artwork behind closed
works/terraces. Their geometry does not create advertised playable interiors
or summit destinations. The old Heaven01 source is untouched. Neither opening
completes the Broken Choir, Bell-Bearer, witness/Veyr expedition, local
allegiance choice or main saga. Earth remains the home anchor. A free standard
return never depends on a survey, combat victory, payment or pledge.

## Canonical source basis

The current repository `AGENTS.md`, comprehensive vision index and continuation
records were inspected before authoring. The historical realm handoffs were
read as source recommendations under Dom's present connected-realm authority.
No archive scripts were executed, and no archived game was imported.

The complete Heaven reader supplies the world bible, prototype specification,
art direction, story/event atlas, handoff and source limitations. Their
individual design documents remain at the following canonical location:

- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/heaven-design/HEAVEN_COMPLETE_READER.md`
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/heaven-design/design/HEAVEN_WORLD_BIBLE.md`
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/heaven-design/design/HEAVEN_PROTOTYPE_SPEC.md`
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/heaven-design/design/HEAVEN_STORY_AND_EVENT_ATLAS.md`
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/heaven-design/CODEX_HEAVEN_NEXT_TASK.md`

The Hell complete design supplies the world bible, first-expedition spec,
story/event atlas, progression/recovery boundaries, art direction and handoff:

- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/hell-design-2026-09-14/HELL_COMPLETE_DESIGN_2026-09-14.md`
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/hell-design-2026-09-14/design/HELL_WORLD_BIBLE.md`
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/hell-design-2026-09-14/design/HELL_PROTOTYPE_SPEC.md`
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/hell-design-2026-09-14/CODEX_HELL_NEXT_TASK.md`

Concrete adaptations preserve the Heaven bone/gold/ruby/sage palette, Rielle's
usable instrument, visible route alternatives, a closed summit, and evidence
distinct from complete restoration. Hell preserves coal/iron/ember contrast,
real refuge, Istra's bounded truthful knowledge, Tovan's responsibility,
two approaches, actual cover and a guaranteed free home route. The source's
blackwater, fluid preparation, larger encounter and main disposition proposals
remain future work. This flat opening has `water:false` rather than misleading
walking-water, depth, drowning or cooling mechanics.

## Shared integration contract

The module exposes `globalThis.RealmWorldHeavenHell` and CommonJS
`module.exports = {realms, decorate}`. Realm data is deeply frozen. Entry,
ground patches, solids and interaction anchors are finite canonical values.
Ground remains flat at `1.57` throughout. Coordinates are compressed browser
layout units, not measured real-world acreage or calibrated metres.

| Field | Heaven | Hell |
|---|---|---|
| Room | `world-heaven` | `world-hell` |
| Bounds | X -60..60, Z -120..40 | X -60..60, Z -116..44 |
| Entry | X 0, Z 27, yaw PI | X 0, Z 31, yaw PI |
| Ground patches | 2 connected overlapping rectangles | 3 connected overlapping rectangles |
| Physical boxes | 56 | 41 |
| Named interaction/view points | 9 | 8 |
| Interactive local people | Rielle, Calen, Yselle | Istra, Tovan |
| Quest ID | `heaven-opening-v1` | `hell-opening-v1` |
| Objectives | `first`, `second`, `third`, all interact | `first`, `second`, `third`, all interact |
| Declared first fee | 18 XP, 7 coins, 0 ore | 22 XP, 9 coins, 2 ore |
| Optional enemies | None | One 90-HP, 9-base-damage sentinel |

Root requested the exact three-objective identifiers for its bounded optional
`journeys` owner. It also approved optional per-solid `color`, which shared
generic box rendering must honor; otherwise warm timber, iron and refuge walls
would revert to undifferentiated realm stone. Person points include optional
`color` and `role` under the shared dynamic-person caller.

`decorate(art, def, {height, rng, sim})` uses the existing `add` API and existing
engine mesh kinds. It never calls `begin`/`commit`, dispatches a scene, mutates
the definition/simulation, writes inventory, grants a reward or creates durable
state. `height` is provided by the shared ground owner. With the same seeded
`rng`, static output is deterministic; an internal per-realm seed is used when
the caller supplies none.

Only `sim.state.journeys.realms[def.id]?.firstClaimed === true` changes
presentation: one thin record appears on Rielle's or Tovan's existing bench.
Every other submitted part is identical. Root must rebuild static decoration
after a claim to show it immediately; save/reload builds can read the same flag.
No repeat run identity or payout logic is authored here.

The sentinel is `hell-salvage-sentinel` at X 44, Z -94 and has `xp`, `ore` and
`coins` all zero. Its real selection, attack timing, line of sight, leash,
damage, defeat, recovery and any separately declared contract belong to Root.
Required points and both intended approach/return routes are physically
reachable even when an eleven-unit exclusion disc is placed around its home.
This geometric separation is not a test of the integrated combat runtime.

## Physical and visual ownership

Root renders each ground patch and physical box. Decoration adds narrow
surface inlays to those supplied boxes, flush paving, solid-backed instrument
ornaments, roofs/lintels above the body corridor, foliage and distant geometry.
All significant foreground cover, furniture, building masses and tree trunks
have canonical physical boxes. Closed building doors remain closed faces;
there are no claimed playable interiors behind them.

Surface inlays protrude at most `0.025` layout units beyond a supplied physical
box to remain visible over its opaque base. They are cosmetic, with no new
movement or camera authority. Actual pivotal body corridors are checked at
radius `0.7`; this tiny material margin is disclosed rather than described as
an exact collision extent. Overhead roofs/lintels have an actual mesh lower
bound above ground +3.9 and join their physical wall/support tops. They have
`cameraSolid:false`, with cutaway enabled to expose nearby occupants. Cosmetic
foliage and all distant artwork have both `cameraSolid:false` and
`cutaway:false`. Static ground/cover camera participation stays with Root's
generic physical boxes.

Paving is flush and checked at actual transformed vertices against supported
ground and physical solids. It does not add a raised floor. Two lamps and the
west loading block initially intersected proposed straight route segments;
the lamps were moved and the west approach now passes around the loading
apron. These failures were detected before delivery, without weakening the
traveller clearance requirement. The initial roof test assumed a centered box
for a base-origin roof mesh; it was repaired to inspect actual engine vertices.

## Focused verification and cost

Fresh focused commands on this worker's final source:

- `node --check src/world-heaven-hell.js` — passed.
- `node --check tests/world_heaven_hell.test.cjs` — passed.
- `node --test tests/world_heaven_hell.test.cjs` — 13 passed, 0 failed, 0 skipped.
- `git diff --check` — passed.

The tests check finite/stable IDs and reward terms; actual supporting solid
footprints; all interaction/enemy anchors; connected supported walking cells;
sampled intended routes with body clearance; safe required routes excluding
the enemy pocket; actual roof/paving vertices; cosmetic box matching;
determinism; coherent supplied-height changes; claim-only visual change;
browser/CommonJS exports; no duplicate canonical person bodies; and no
simulation/inventory/source mutation.

Default internal RNG, no survey record, current existing mesh definitions:

| Static geometry | Heaven | Hell |
|---|---:|---:|
| Local decoration instances | 702 | 546 |
| Local plus generic physical/ground boxes | 760 | 590 |
| Local decoration triangles | 24,874 | 7,070 |
| Distant instances | 74 | 106 |
| Distant triangles | 7,812 | 17,284 |

There are ten existing mesh kinds in Heaven and eight in Hell. Distant and
local kinds reuse engine instancing; there is no new material upload, texture,
renderer pass, network fetch, downloaded asset or external dependency.
The claimed record adds one local box. Supplied seeded RNG changes grass
acceptance/count; focused tests also use an independent seed and enforce fewer
than 1,500 local static instances including generic ground/solid boxes and
fewer than 45,000 local decoration triangles. Counts exclude dynamic canonical
people, the traveller/companion, real enemies and integrated UI/effects.

No browser suites, GPU sessions, full inherited verifier, generated HTML,
personal save access, main merge, push/PR, network request, paid service,
unrelated server stop or subagent were performed by this worker. Geometry/data
checks do not establish rendered readability, actual integrated control/save
behavior, sustained device cost, human comfort, balance or enjoyment.

Root's next acceptance is to load the module with the shared world owner,
render the supplied material colors, walk each intended loop and return in
both cameras, confirm actual dialogue/proximity and optional sentinel behavior,
exercise the first claim and saved record, then inspect actual integrated
screenshots. Final source integration and evidence remain owned by Root.
