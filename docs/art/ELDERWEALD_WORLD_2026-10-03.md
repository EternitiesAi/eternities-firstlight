# A connected Elderweald-facing Earth circuit

This original geography appends one woodland circuit to the existing Coastward Earth scene. It keeps the current home road, bridge, people, fields, jobs and save identities. The new country has two physical junctions with the older country; it has no room transition, teleport, new home checkpoint or independent reward service.

The accepted source baseline is PR37 commit `88aa1feaca4023064aed4ef5c9d77d59e958e353`. The isolated branch is `agent/elderweald-geography-20261003`, worktree `D:/07-GAMES/Firstlight/authoring/elderweald-geography-20261003`. This slice owns only the geography/art module, its focused CPU test and this note. Root owns concatenation into production Earth, the art caller, maps, camera framing, collision/pathfinding integration, schemas, work/combat rules, build and browser/GPU qualification. The expedition colleague owns the accepted quest and patrol definitions. No personal saves or acquired scripts were used.

## Source direction and original choices

The recovered `C:/dev/firstlight-artifacts/cosmos-2026-09-15/design/realms/earth-design-2026-09-14/design/EARTH_WORLD_BIBLE.md` describes E03 Elderweald at lines 76–88. Its westward sequence goes from managed woodland into canopy, wetland, old root halls and glades (line 78). Masonry incorporated into living forms and a supported damaged passage appear at lines 80 and 88. Bounded territorial encounters and designated or naturally shed materials appear at lines 82–84. The same bible preserves ordinary local life as the map grows (line 10) and suggests minor tracks looping a principal road (line 54).

Those are attributed design directions, not evidence that the whole province exists. This module's exact terrain, metres, timber shelter, arch, river gap, colors, working stations, names Rill/Sela and route are original provisional Firstlight adaptations. The result is an Elderweald-facing local circuit, not a full canonical Elderweald map. It adds no rare fox event, new companion, living biosphere simulation, faction allegiance, forestry economy or saga resolution. `EARTH_PROTOTYPE_SPEC.md` lines 65–77 inform the separation of inventory ownership, persistent identities and rendering; scenery neither consumes standing trees nor invents targetable landmarks.

## Frozen geometry contract

`RealmElderwealdWorld` and CommonJS export the same frozen `{extension, parts}` API. `extension` is recursively frozen, containing bounds, ten flat ground patches, forty solids, eleven intended routes, nine public person/work points, five landmarks and two clear encounter locations. All floor and anchor heights are **1.57m**. Root appends these definitions to `world-earthlands`; it renders the ground and solid boxes. The pure `parts({quality, height})` factory returns fresh `{kind,p,s,c,opt}` records. It neither draws ground nor adds colliders, save/progression data, inventory, grants or controls.

The extension bounds are X `[-170,-24]`, Z `[-118,7]`. Six broad basins have widths at least 40m and depths at least 28m, with overlapping physical support between them. The full intended circuit, including the existing Coastward return road, measures **409.179889m** along its supplied segments. This is a designed route length, not a timed human journey.

| Anchor | X | Z | Purpose |
| --- | ---: | ---: | --- |
| North junction | -29 | -15 | Existing coppice connection |
| South junction | -26 | -61.5 | Existing fields/settlement connection |
| Camp landmark | -70 | -8 | Working shelter and route landmark |
| Rill · forestkeeper | -67 | -4 | Optional invitation/giver approach |
| Sela · herbalist | -103 | -23 | Optional local person |
| Preparation | -76 | -12 | Open load-reading station |
| Stormfall | -82 | -18 | Storm-fallen timber allocation |
| Managed growth | -78 | -2 | Separate designated work stand |
| Wetland check | -109 | -28 | Firm approach before crossing |
| Bridge north approach | -125 | -44 | Align before entering between rails |
| Footbridge center | -125 | -49 | Supported six-metre-wide crossing |
| Crossing encounter clearing | -119 | -44 | Open side pocket, separate from deck |
| Root load reading | -148 | -66 | Supported approach north of wall tips |
| Root passage center | -148 | -75 | 6.6m clear between masonry flanks |
| Root encounter clearing | -134 | -70 | Open side pocket east of passage |
| Alternate support | -145 | -84 | Beyond both flank walls |
| Return delivery | -106 | -105 | Open working space in return glade |

The river has a real four-metre floor gap between Z -47 and -51. The patch `elderweald-footbridge` connects its banks; it is not a water-painted solid plaza. Its two authority rails remain outside the centered walking line and open at both ends. Textured planks occupy Y 1.57–1.594m, follow the actual deck and have separate joints. The diagonal wetland-to-deck shortcut correctly fails production collision against the east rail; the authored route first reaches the northern alignment point.

Root-channel walls occupy X -152/-144, Z -75, with 1.4m × 14m footprints and 2.35m heights. The supported route enters at X -148 and continues beyond the walls. Their cap, rooted arch and keystone appearance clear a 1.7m standing body. The optional support and enemy clearings are not in that corridor. Camp posts are the only new low shelter authority; its open-sided pitched roof and packing stock are appearance only and clear the approach routes.

## Art, costs and camera ownership

Thirty-two grounded authority trunks carry connected branching and overlapping dark crown volumes, replacing empty open basins with an original mixed woodland canopy. High quality adds small buttress roots within 15cm of each trunk footprint. Timber bark panels reuse the renderer's existing embedded timber material. The working shelter, crossing, old masonry, stormfall stock, reeds and glade bundles form distinct landmarks rather than extra decorative platforms.

| Factory quality | Appearance records | Submitted vertices per geometry pass |
| --- | ---: | ---: |
| Low | 287 | 9,072 |
| Balanced | 419 | 43,344 |
| High | 515 | 46,800 |

The factory ceiling is 620 records; these counts exclude Root-rendered ground, forty solid boxes, coast-bank meshes, existing Earth and dynamic people/enemies. They are CPU geometry counts, not draw-call, GPU timing, total-scene or performance certification. Identical frozen ground/solids apply at every quality tier.

Every appearance record has `cameraSolid:false` and `appearanceOnly:true`; parent-derived tree/wall/rail records retain matching solid IDs without declaring `worldSolid`. Opaque overhead branches/crowns, shelter beams/roof and root arch use the existing ordinary `cutaway:true` path. That respects the renderer's cutaway preference and does not grant roof-removal, collision, line-of-sight or special gallery authority. Other ground detail stays `cutaway:false`. No universal camera behavior is changed.

Foliage uses the existing wind2 shader. CPU checks reserve its current ±0.095m X/±0.05m Y envelope for route clearance and branch/crown volume overlap. This proves neither shader-time rigid attachment nor rendered visual comfort. The existing renderer supplies paused/reduced-motion timing; this pure factory reads no time or state.

## Focused qualification and remaining integration

Run `node --check src/elderweald-world.js` and `node --test tests/elderweald_world.test.cjs`. The focused suite uses actual production `Engine.geometry`/matrix transforms and actual `WorldFoundations.land`, `walkable` and `segment` functions in an isolated composed catalogue fixture. It checks finite frozen data, stable unique IDs, existing route preservation, all 31 new intended route legs, all sixteen anchors, bridge gap/rails/joints, root approach/corridor, positive orthogonal transforms, actual mesh ground support, full-body route/anchor clearance, bounded low roots, branch and crown rest-volume continuity, cutaway/camera authority, deterministic fresh returns and refusal of unsupported quality/height before output.

That composition is labelled synthetic data integration; it grants no character progress and does not demonstrate a played journey. Two initial submitted-mesh failures were repaired: camp stock projected into the preparation envelope, so it moved 0.6m under the shelter; the actual octa mesh's ±0.65 vertical extent buried reed tips, so they rose 0.05m. The physical definitions and quest anchors did not change. The earlier bridge diagonal failure led to the centered northern approach before the first source commit.

Root must include `elderweald-footbridge` in the coast-bank bridge exclusion and relocate the previous northwest distant mountain so it does not become opaque scenery across this real new ground. The module requires no new texture pipeline. Actual caller/load order, production partitions/banks, whole-scene draw costs, click/keyboard pathfinding, native persistence, both camera presentations and hardware/browser evidence remain Root integration work. Human route readability and feel remain unclaimed.
