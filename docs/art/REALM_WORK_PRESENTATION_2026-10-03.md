# Visible material work in Coastward and Bellglass

This bounded art change replaces generic Southern job boxes with original work props that show the existing, once-only commissions. It starts from `2b2d27ca3a5fb1dd8e4b7faebc06ed5c9db32491` on `agent/realm-work-presentation-20261003`, in the isolated `D:/07-GAMES/Firstlight/authoring/realm-work-presentation` worktree. Only `src/realm-trails-art.js`, `tests/realm_trails_art.test.cjs` and this note are owned by the slice.

## What becomes visible

Coastward's fallen bough has a low forked bole and cream cut faces. Recording `fallen-bough` replaces it with six cut pieces, resting on spacers and held by cord. Cut reeds retain stems and seed heads; recording `shore-reeds` adds a binding and knot. Loose irregular stones become two sorted pieces on a small board after `shore-stone`. The existing `road-pack` shows an empty tray and loose cords before packing, then the combined wood, reed and stone load with its lashing and job seal. This is reserved commission material. Art does not put any material into inventory; the existing successful claim owns that transfer. The seal changes from pale green to brass only on the recorded paid claim.

Bellglass's upper reading is a bronze plate suspended from the actual public deck underside. Its older, lower companion has three distinct scale notches and a bed-mounted stone foot. Each recorded reading adds a small copied tab. An inclined, supported chart desk in the air court shows separate reading slips as those readings are recorded. Its two contrasting layers, depth connection and doorway schematic appear only after the correctly chosen `depth-chart` step is committed. The modern landing marker has a bed-mounted frame before fitting; its pale plate and directional arrow appear only after `modern-marker`. The older scale remains in place. The arrow uses the existing exit's Z direction; it does not create a walkable or swimmable extension beyond the gallery bounds.

There is no new successful-work animation or floating label. These South props are static under simulation time, pause, reduced motion and camera preference. Existing availability rings remain the ordinary action cues. Heaven, Hell and Cosmos retain their current props; six pinned initial/accepted projections cover those unchanged branches.

## Attribution and interpretation

The recovered local design sources are research and canon direction, rather than executed archive code or asset imports:

- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/EARTH_COMPLETE_DESIGN.md`, particularly lines 238–256, 765–767, 1218 and 1242: ordinary forest and farm work, timber/fibre/stone identity, stormfall alternatives, warm timber and working coastal materials.
- `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/atlantis-design-2026-09-14/ATLANTIS_COMPLETE_DESIGN.md`, particularly lines 155, 201, 205, 219, 227 and 671: depth calibration, furniture suited to its medium, layered history, an older stair beyond a modern landing, a usable Bellglass visitor route, and a chart retained by a named finite commission.
- Current implementation anchors are [realm-trails-south.js](../../src/realm-trails-south.js), [realm-trails.js](../../src/realm-trails.js), [world-atlantis-earth.js](../../src/world-atlantis-earth.js), [world-foundations-art.js](../../src/world-foundations-art.js) and the dynamic batches in [world.js](../../src/world.js).

Coastward, Merren and Vessa remain provisional local opening terms. Bellglass and Farwake derive from the Atlantis design; this small task does not represent the complete settlements or resolve their larger story. Prop shapes, palette, binding details, chart schematic and working-side offsets are original implementation art. No standing tree, homestead resource node, protected resident, new profession, allegiance or class is altered.

## Physical placement and authority

The immutable step IDs, XYZ coordinates, prerequisites and reward owners stay unchanged. The following are working-side prop centres, not moved interactions:

| Existing step | Main prop centre | Support |
| --- | --- | --- |
| `fallen-bough` | `(-23.9, -11)` | Canonical coppice ground at Y `1.57` |
| `shore-reeds` | `(29.1, -16)` | Canonical shore ground at Y `1.57` |
| `shore-stone` | `(31.1, -25)` | Canonical shore ground at Y `1.57` |
| `road-pack` | `(-4.15, 97)` | Arrival bank at Y `1.57`; all load meshes stay within the tray's XZ extent |
| `upper-gauge` | `(9.25, -22)` | Actual deck underside at Y `1.46` |
| `lower-masonry` | `(9.25, -28)` | Actual gallery bed top at Y `-3` |
| `depth-chart` | `(9.75, -36.1)` | Bellglass air court floor at Y `-2.7` |
| `modern-marker` | `(12.65, -38.4)` | Actual gallery bed top at Y `-3` |

The desk stays behind the real visitor turn `(9, -35)`, clear of the bench, lamps and split entrance. Its four legs meet the floor and tabletop; the front board edge meets the tabletop, while two rear props reach the inclined board underside. Paper and chart marks occupy successive thin layers on that board. Cut-face inserts have thickness and overlap their wood ends instead of duplicating a coplanar box end face. Beam bases use positive orthonormal matrices. Gauge feet and the suspended anchor are checked against geometry emitted by the actual generic scene writer, not only matching constants in this module.

All new work parts carry `appearanceOnly:true`, stable quest/step/part metadata, `cameraSolid:false` and `cutaway:false`. The function only appends appearance records to existing dynamic `box`, `octa` and `disc` lists. It does not dispatch commands, save, mutate definitions, change support, add collisions, move actors or alter camera state. The Coastward renderer has no active dynamic timber-material batch, so these props use the established plain-color geometry path rather than claiming licensed timber-texture rendering.

## Geometry budget and checks

Counts include the existing availability rings and claim receipt. Vertex counts use the actual engine meshes; they are submitted geometry quantities, not performance measurements.

| Realm/state | Instances | Box / octa / disc | Submitted vertices |
| --- | ---: | --- | ---: |
| Coastward unaccepted | 33 | 20 / 13 / 0 | 1,032 |
| Coastward accepted, no steps | 36 | 20 / 13 / 3 | 1,176 |
| Coastward all steps, unpaid | 96 | 77 / 18 / 1 | 3,252 |
| Coastward paid | 97 | 78 / 18 / 1 | 3,288 |
| Atlantis unaccepted | 26 | 26 / 0 / 0 | 936 |
| Atlantis accepted, no steps | 28 | 26 / 0 / 2 | 1,032 |
| Atlantis all steps, unpaid | 42 | 40 / 0 / 2 | 1,536 |
| Atlantis paid | 43 | 41 / 0 / 2 | 1,572 |

The maximum is below the slice's 120-instance ceiling in every legal Southern progress snapshot. These replace the previous job props; the paid-state increases are 88 Coastward instances and 34 Atlantis instances. No new geometry kind or renderer batch is introduced. Actual draw cost still requires Root's integrated measurement.

Executed checks:

```text
node --check src/realm-trails-art.js
node --test tests/realm_trails_art.test.cjs
git diff --check
```

The focused file has eleven tests with no skips. It covers every legal Southern progress snapshot, finite transformed production vertices and positive matrices, material-specific before/after forms, recorded-state gating, full-body route and interaction clearances, canonical Earth support/solid separation, gallery bounds and actual Atlantis XYZ route/solid separation, support attachment and actual generic floor/deck emission, static pause/reduced-motion/camera behaviour, input mutation, and portable Northern/Cosmos projection baselines. Route probes use a radius `0.31`, body height `1.7` and actual supplied foot heights, including the court at `-2.7`.

A production command test uses the real initial kit, Roads preview/enter, accept and step commands with explicitly assigned synthetic proximity/depth positions and in-memory save results. It proves that a wrong chart choice and a refused save leave state and geometry unchanged; a committed correction reveals the chart connection without paying XP or currency. It is not a command-earned walking journey or native browser persistence proof. Other progress snapshots are labelled synthetic ledger fixtures and checked through the production trail validator.

One intermediate support test accidentally selected the court's same-sized ceiling as its floor. It failed, and the selector was corrected to the actual non-solid floor emitted by the generic writer; the support requirement was retained. Browser/GPU visibility, medium fog, interaction comprehension, hardware cost, human satisfaction and exact integrated build verification remain Root's acceptance work. This commit makes no claim that either camera has already been visually accepted.
