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
Initial focused-test checkpoint: `db02c27d51d3081c69005222685785bbcfb0d60e`.

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

Actual decoration emissions after the source polish are **308 Earth / 98 Atlantis**, including 3 / 14
distant scenic instances respectively. These counts exclude shared ground,
generic collider geometry, dynamic actors and UI. They are a finite authoring
budget receipt, not total integrated draw calls or a hardware timing claim.

Fresh checks for this candidate:

- `node --check src/world-atlantis-earth.js`: passed.
- `node --test tests/world_atlantis_earth.test.cjs`: 13 tests passed, zero failures,
  zero skips. Tests cover finite unique IDs, frozen canonical data, side-effect
  free module load, all dry anchors, analytic complete-segment support and
  collider clearance, both Earth approaches, ordinary work identity, dry Atlantis
  continuity, full-body XYZ gallery clearance, reachable entry/exit, actual
  emitted geometry/roof footprints, deterministic budget and no caller mutation.
  Four additional checks qualify canopy support contact, native timber UV mesh /
  bridge skin/joint separation, actual rotated path/door vertices, and native
  mountain-ridge geometry outside Earth bounds.
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

## Source polish after the integrated visual review

Root supplied the genuine production browser captures under
`D:/07-GAMES/Firstlight/authoring/bridge-moment/evidence10/world-foundations-browser/`.
The read-only review inspected `earthlands-third.png`, `earthlands-diorama.png`,
`atlantis-third.png`, `atlantis-diorama.png`, `atlantis-swim.png` and
`atlantis-air-court.png`, plus the root's actual generic art emitter. These are
software Chromium development captures; hardware captures and human comfort
remain separate. The requested spelling `atlantis-swimming.png` was not present;
the actual wet-view filename is `atlantis-swim.png`.

The production-art recorder emitted 376 Atlantis static instances at that review
checkpoint. No box intersected the intended XYZ body route above a .061-unit
surface-trim tolerance. This is a bounded box/route check, not a complete mesh,
camera or arbitrary-swim qualification. The generic deck underside was Y 1.46,
compared with permitted maximum foot Y -.25 plus body 1.7 = head Y 1.45.

Three review priorities were dry-court feedback/overlapping HUD messages, civic
canopy support and Earth working-settlement readability. Root owns the HUD,
controls, build and subsequent captures. The newly authorized source refinement:

- Raises only the existing civic side-wall heights from 3.6 to 4.0 in their
  identical XZ footprint, aligning columns and caps at Y 5.57 with the actual
  canopy underside. The former cap top was Y 5.38, leaving a .19-unit gap.
- Adds eight narrow, .12-wide inset path seams from the fields through Merren
  to the register, with short branches to the water check and produce load.
  Actual transformed vertices stay on supported clear ground. These are art,
  not additional ground or a navigation permission.
- Adds three closed timber door faces and modest casing/handles. Vertical grain
  uses the existing `timber-panel` mesh rotated in the facade plane. No new door
  point or enterable interior is advertised.
- Adds 51 separated `timber-panel` bridge skins, top Y 1.590, above the existing
  supported deck plane Y 1.57 by .020. Their bounds leave every original
  .045-wide joint strip uncovered and preserve every rail/post transform.
  Native UVs retain the approved one-board strip U .1.. .2 / V 0..1. Earth now
  emits 54 timber-panel instances including the three door faces. No renderer,
  texture asset, material lifetime or licensing owner changed.
- Corrects an authoring error in the initial source: unknown geometry kind
  `mountain` silently fell back to the engine's cylinder mesh. Both northern
  vistas now use actual `mountain-ridge`; a third ridge across the channel at
  X 103 / Z 54 adds the requested side view. Every complete ridge footprint lies
  outside Earth bounds; there is no collider, destination or supported path.
  Retained tests inspect the native mesh's varying ridge heights so a fallback
  cannot satisfy the same check.

The four new geometry checks first failed against the unrefined source, then
passed after the implementation. A UV test initially assumed a full-square U
range; inspecting the existing engine showed its deliberately selected board
strip, and the test now verifies that actual approved mapping rather than
changing it. Final focused result: 13 passed, zero failed or skipped, plus source
syntax and whitespace checks. No new browser/GPU/full-suite run or material
activation/performance claim is made for this source-polish checkpoint.
