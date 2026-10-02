# Earth and Atlantis world foundations, 2026-10-02

This candidate adds two original, pure realm catalogues and basic procedural
decoration. It is the Earth/Atlantis lane of Dom's connected-world authorization.
Root owns the shared travel, UI, work/reward state, save validation, physics,
camera, dynamic people and integration. These files alone do not establish a
playable integrated release, underwater comfort or a GPU performance result.

## Ownership and source

Base: `4b5f3c7a7a7672ccefbf2ef8501507f017ec06d3`.
Branch: `agent/world-atlantis-earth`.
Worktree: `D:/07-GAMES/Firstlight/authoring/world-atlantis-earth`.
First source checkpoint: `c87b7c64916fb3c51b9baa2820f9144825d4c8d0`.

Owned files are `src/world-atlantis-earth.js`,
`tests/world_atlantis_earth.test.cjs`, and this note. No existing Earth region,
resident, sanctuary, combat, class, equipment, music, housing or save owner was
edited. No archive script, acquisition, network service, paid provider, browser
profile, personal save, server shutdown, main merge, push or PR was used.

The repository's `AGENTS.md`, current project records and
`docs/design/COMPREHENSIVE_VISION_INDEX.md` were inspected. Primary local design
sources are under
`C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/`:

- `earth-design-2026-09-14/design/EARTH_WORLD_BIBLE.md`,
  `EARTH_PROTOTYPE_SPEC.md`, `EARTH_STORY_EVENT_ATLAS.md` and
  `CODEX_EARTH_NEXT_TASK.md`.
- `atlantis-design-2026-09-14/ATLANTIS_COMPLETE_DESIGN.md` and its constituent
  civilization, prototype, campaign/culture, story/event and systems/art readers,
  plus `CODEX_ATLANTIS_NEXT_TASK.md` and the reader's research/validation boundaries.

The archived stage ordering is historical design guidance. Dom's current
authorization supplies the scope for this connected-world implementation. The
sources do not authorize execution of archive tools or copying external media.

## What is authored

`RealmWorldAtlantisEarth` and CommonJS expose `{realms,decorate}`. The frozen array
contains exactly `earthlands` / `world-earthlands` and `atlantis` /
`world-atlantis`. Data has explicit supported patches, colliders, reachable
anchors, three stable work objectives, finite candidate rewards and test-only
intended route waypoints. Optional patch/solid color is presentation metadata.

Earth's provisional **Coastward Road** extends the source ideas of Crownfields,
Reedmere and Rainward. A 76-unit timber channel bridge links an arrival bank to
two distinct woodland approaches, working fields and a roadside settlement.
The source does not establish these units as metres. **Vessa** and **Merren** are
original provisional locals. The opening commission checks field water, packs a
named produce load and records it; its identity is separate from Fenna's older
delivery. A coppice skitter occupies an optional side pocket, with zero direct
loot/XP in this catalogue. The free main road and return do not require fighting.

Atlantis retains the source identities of **Farwake**, **Bellglass**, **Nereme**
and **Sahra**. A dry pier joins the surface landing, a sheltered civic court and
the far quay through a public dry causeway. The civic back wall has a real
four-unit opening centered at X -3. The three opening objectives are surface
route-lamp, tide-dial and register checks. They do not settle Vaelor, Damar, the
Custodian, the Second Opening or the Regent's saga. Distant towers are scenery.

Both work definitions use `${realm.id}-opening-v1` with objective IDs `first`,
`second`, `third`. Candidate rewards are Earth 28 XP / 12 coins / 2 ore and
Atlantis 24 XP / 10 coins / 1 ore. The catalogue does not grant or claim anything;
the root's accepted work caller owns eligibility, capacity checks, claim identity,
replay and persistence. These values are implementation starting points, not
human balance approval or a new maximum-level curve.

## Dive geometry contract

All ordinary Atlantis patches remain at Y 1.57. The shared caller draws the
separate gallery bed, the lower court floor and every supplied ordinary/dive
solid. Decoration does not add another floor or a thick underwater shore mass.

- Water surface Y .01; permitted foot depth Y -2.7 through -.25.
- Contained volume X 8 / Z -29 / width 10 / depth 22, covering X 3..13 and
  Z -40..-18.
- Dry `tide-steps` interaction at X 8 / Z -16; explicit wet entry at
  X 8 / Y -.5 / Z -19.5, yaw pi.
- `gallery-landing` interaction at X 12 / Z -40.1; explicit dry destination at
  X 8 / Z -43, yaw zero. The wet route ends at X 12 / Y -1.4 / Z -39.3,
  0.8 horizontal units from the landing anchor.
- Bellglass visitor air court centered X 8 / Z -34, width/depth 7, dry vertical
  range Y -2.7..+.5, floor Y -2.7. Side/back walls, a split north entrance,
  entrance lintel, ceiling, bench and lamp posts are explicit `dive.solids` with
  base Y and height. The north doorway's physical gap is 3.32 units wide.
- The route enters the court at floor height, returns through its doorway,
  then passes east of its wall at X 12 to the far landing. It never passes
  through a wall or relies on a scenic floor for movement.

The root owns explicit entry/exit, rollback-safe checkpoint recovery, F/G depth
controls, hold-depth, full-body collision, independent body/camera medium and
dry-volume handling. Their existence is not proved by this catalogue. The
source requires free route-limited visitor protection and no surprise drowning
timer or allegiance prerequisite.

## Decoration and focused evidence

`decorate` emits only original geometry through `art.add` / `art.box`. It never
calls begin, commit, dispatch or a save service, configures an engine, draws
duplicate dynamic NPCs or writes the caller's simulation. Persistent visual
detail reads only `journeys.realms[id].firstClaimed === true`. The bridge has
plank seams, rails/posts and supports below its actual floor; houses and the
pilot school have roofs matching their supplied solid footprints. Field plants
leave the work loop clear. The civic canopy is above full body clearance and
meets its supporting walls. Gallery rocks/plants remain outside the navigable
volume. Scenic shapes have `cameraSolid:false`, with distant scenery also
`cutaway:false`; tall nearby roofs have cutaway enabled.

Actual decoration emissions are **233 Earth / 98 Atlantis**, including 2 / 14
distant scenic instances respectively. These counts exclude shared ground,
generic collider geometry, dynamic actors and UI. They are a finite authoring
budget receipt, not total integrated draw calls or a hardware timing claim.

Fresh checks for this candidate:

- `node --check src/world-atlantis-earth.js`: passed.
- `node --test tests/world_atlantis_earth.test.cjs`: 9 tests passed, zero failures,
  zero skips. Tests cover finite unique IDs, frozen canonical data, side-effect
  free module load, all dry anchors, analytic complete-segment support and
  collider clearance, both Earth approaches, ordinary work identity, dry Atlantis
  continuity, full-body XYZ gallery clearance, reachable entry/exit, actual
  emitted geometry/roof footprints, deterministic budget and no caller mutation.
- An initial direct dense-route probe failed because a route turned sideways
  through the bridge rail. The route now reaches Z 16 before turning; the retained
  test rejects the original shortcut. The initially closed civic back wall was
  also split before the source checkpoint. Both failures informed real geometry
  corrections rather than weaker acceptance tests.

The second checkpoint additionally aligns the civic canopy's depth and the
column decoration with the actual walls. Root must cherry-pick the disjoint
commits and qualify the production callers, browser journeys, both camera views,
rendered dry/wet geometry, saved/reloaded characters and required integrated
regression gates. No browser, GPU, full-suite, human-feel or deployment result is
claimed by this agent's focused checks.
