# Coastward and Bellglass finite outing terms

These two original local commissions deepen the existing playable openings. They
do not replace the Earth delivery, resolve the Atlantis harbour campaign, or add
another equipment authority. The implementation base is
`56d4c25b389d6f93941f32aafc0469a14e89cf32`; the isolated branch is
`agent/realm-trails-south-20261002`.

## Ownership and implemented scope

`src/realm-trails-south.js` exports the deeply frozen array `definitions` through
`globalThis.RealmTrailsSouth` and CommonJS. It contains authored terms only:
stable identities, dialogue, exact physical anchors, step dependencies, a chart
choice and the approved fixed rewards. It does not accept work, inspect a
simulation, mutate a save, grant materials, build scenery or dispatch an action.

Root owns the separate `realmTrails` version 1 record, state validation and old-save
acceptance, input/UI/art, physical proximity and medium checks, durable accepted
steps, atomic claims and the globally finite fitting. This commit supplies no
fitting entitlement item or new weapon stat. Root's approved fitting rule is a
separate once-per-character service unlocked by any trail claim: 3 ore and 8
sunmarks for +3 attack on an explicitly selected owned canonical blade or bow,
preserving its identity and socket. That service is not implemented here.

Only these files belong to this agent change:

- `src/realm-trails-south.js`
- `tests/realm_trails_south.test.cjs`
- `docs/development/REALM_TRAILS_SOUTH_2026-10-02.md`

## Atlantis: A Chart With Room for Depth

Stable identity: `atlantis-bellglass-chart-v1`. Accept and claim at existing Sahra
`(-5,-10)` on the supported civic deck. The approved once-only payment is 30 XP,
12 sunmarks and 2 ore. The job asks for actual depth readings, a correct chart,
and a modern marker that preserves the older masonry record.

| Step ID | X | Foot Y | Z | Required medium | Dependencies |
|---|---:|---:|---:|---|---|
| `upper-gauge` | 8 | -1.05 | -22 | water | none |
| `lower-masonry` | 8 | -2.55 | -28 | water | none |
| `depth-chart` | 8 | -2.7 | -35 | Bellglass air court | both readings |
| `modern-marker` | 12 | -1.4 | -38.4 | water | corrected chart |

The first two readings may be collected in either order. At the air-court desk,
`depth-layers` is the correct choice: show two measured layers, their connection,
the court doorway and the east wet lane. `one-flat-line` hides the depth change;
`erase-old-road` discards useful historical evidence. The wrong options explain
the defect and allow correction without cost or step completion. The accepted
choice then permits the modern landing marker. No dialogue accuses a named
official of fraud or awards the later harbour story outcome.

The table gives **player-foot target coordinates**, consistent with
`worldDive.y`. It does not declare a new floor or the location of a tall visual
object's centre. Root's interaction owner must compare actual physical XYZ and
body/court medium, not overhead deck XZ alone. A player walking above the gallery
cannot record a submerged reading. Camera medium cannot substitute for character
medium. In the air court, `worldDive` still exists while the character body is in
air; the old opening owner deliberately rejects this state and remains separate.

The tested traversal follows the current entry, the two readings, the real split
court doorway, the desk, the doorway again and the east wet lane to the marker
and existing landing. No gallery enlargement, altered wall/ceiling, submerged
combat or new recovery mode is implied. F/G, held depth, the free visitor
envelope, dry quay and free passage home retain their existing owners.

## Earth: Wood, Reed and a Road Home

Stable identity: `earthlands-coastward-materials-v1`. Accept and claim at existing
Vessa `(-7,97)`. The approved once-only payment is 25 XP, 10 sunmarks, 0 ore and
the existing inventory items `{wood:6,fiber:4,stone:2}`. That material bundle is
exactly the existing `arsenal` trail-bow recipe; the player may instead use it
for another current recipe. An already equipped veteran keeps their build and
chooses whether these materials are useful.

| Step ID | X | Foot Y | Z | Dependencies |
|---|---:|---:|---:|---|
| `fallen-bough` | -25 | 1.57 | -11 | none |
| `shore-reeds` | 28 | 1.57 | -16 | none |
| `shore-stone` | 30 | 1.57 | -25 | none |
| `road-pack` | -3 | 1.57 | 97 | all three prepared supplies |

These are finite supplies of the accepted commission. Recording a supply and
packing it creates no inventory grant. The full declared material bundle enters
ordinary inventory only through Root's successful atomic claim, with capacity
checks for every item and currency. Existing sandbox node identities, regrowth,
standing trees, crops, Darric's reserved public stone and earlier rewards are
unaffected. The terms contain no repeat payout or material reset.

The circuit crosses the real timber bridge, takes the west woodland road, uses
the **north lip at Z -12** to reach the fallen bough, connects through the field
approach to the east shore spur, and returns by the east woodland road and bridge.
The optional coppice skitter's current detection radius is 8.5 units. This
authored circuit stays at least `sqrt(80)` (about 8.944) units from its initial
position. A southern approach at Z -15 would enter that detection radius and is
not the tested noncombat route. This geometric result does not promise immunity
after a player deliberately draws the moving foe elsewhere.

All work sites and the complete intended segments lie on existing dry ground
and clear current solids. The shore sites confer no wading, swimming, boat
physics, additional supported land or access to distant mountains.

## Canon attribution and local naming

The following preserved packages are design sources, not executable policy or
proof that their complete campaigns are implemented:

- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/atlantis-design-2026-09-14/design/02_FIRST_PROTOTYPE.md`
  supplies Sahra's instrument-maker role (section 3), the three traversal states
  and free visitor protection (section 4), and the practical chart/instrument
  comparison before larger events (section 8). Its proposed long expedition,
  Damar rescue, Vaelor decision and Tideglass Fitting are not completed here.
- The same package's `design/03_STORIES_AND_EVENTS.md`, **AT01, The Stair That
  Kept Going**, supplies preservation of the older submerged mark alongside a
  modern safety marker. **AT17, The Route That Would Not Lie Flat**, supplies
  depth-aware route explanation. Those are inspirations for this small visitor
  commission; the actual AT17 province or story is not moved into Farwake or
  claimed complete.
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/design/EARTH_WORLD_BIBLE.md`,
  **E02 Crownfields**, **E05 Reedmere Basin** and **E08 Rainward Coast**, supplies
  ordinary hinterland work, reed craft, and a distinct mortal shore with useful
  plants/minerals. Elderweald's tended woods inform leaving shelter trees intact.
- The same Earth package's `design/EARTH_PROTOTYPE_SPEC.md`, sections 6 and 9,
  supplies separate later-work identities, bounded ordinary materials, explicit
  durable claim ownership and preservation of old character history. Its old
  schema/version statements are historical; current source is authoritative.
- Current physical placement and prior source interpretation are in
  `src/world-atlantis-earth.js`. Current collision, body medium, depth movement
  and opening reward ownership are in `src/world-foundations.js`. Actual material
  and recipe identities come from `src/sandbox.js` and `src/arsenal.js`.

Sahra, Nereme, Farwake and Bellglass come from the recovered Atlantis proposal;
their use is not a claim of founder-approved final branding. **Coastward Road,
Vessa, Merren and both new outing titles are source-local provisional names.**
None rebrands Hearthwater or claims the whole canonical Earth province exists.

## Focused verification and integration acceptance

Commands run in this agent worktree:

```text
node --check src/realm-trails-south.js
node --test tests/realm_trails_south.test.cjs
```

Result: syntax passed; **8 focused tests passed, 0 failed, 0 skipped**. They check
the browser/CommonJS export and deep freezing, exact terms and dependency
topology, existing giver ownership, complete supported Earth segments and foe
separation, full actor-interval gallery collision and body/court medium, actual
production `World.swim` traversal and exit, and compatibility with real inventory
items and the trail-bow recipe. Geometry samples are at most 0.05 units apart;
the depth movement probe uses unaccelerated bounded simulation deltas on labelled
synthetic state. Neither establishes human comfort, duration or native persistence.

Root's still-required integration acceptance is distinct from these data tests:

1. Old saves acquire empty unaccepted trail records while preserving every
   opening, gear/socket/fitting, character, home, music and story field. Future,
   malformed, impossible, stale and cross-character trail states are refused.
2. Inspecting never accepts. Physical XYZ and body medium govern each step;
   pause/death/menu ownership stays valid. Air-court interaction works while
   `worldDive` exists. Wrong chart choices leave progress and balances intact.
3. Partial work, corrected choice and packed-but-unclaimed supplies survive
   save/load, departure and character switching. Reload uses the disclosed home
   checkpoint; no scene/depth coordinate becomes a new home save.
4. Claim saves the full validated candidate before mutation. Duplicate claims,
   changed request IDs, replay, re-entry and later survey claims cannot pay the
   finite trail again. Quota/ownership refusal and full pouches preserve the
   entire unclaimed entitlement, including every material item.
5. Both cameras show actual sites, supported routes, readable wet/court depth
   markers and a single correct interaction owner. Decorative markers do not
   introduce collision or interfere with doorway/landing/bridge clearance.
6. Command-earned fresh blade/bow and strongest veteran journeys preserve prior
   services and demonstrate both trails, choices, one atomic claim and the
   separately owned finite fitting without weakening older tests.

No browser, GPU, build, full suite, remote verification, paid service, personal
save or deployment was run by this agent for this commit. No human acceptance or
completed realm campaign is asserted.
