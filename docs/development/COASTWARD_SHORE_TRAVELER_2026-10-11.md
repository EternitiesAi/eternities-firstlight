# A softer shoreline and traveler silhouette

This is a bounded exploration and graphics milestone on `gameplay/coastward-shore-and-traveler-20261011`, stacked on PR55's normally pushed `11cbea03e264eca945fb85e1d49d6f1a001d216e`. It follows the existing Earth travel polish and graphics recovery. The larger production goal remains unfinished; this work does not create a seamless continent or qualify AAA presentation.

The player can walk onto a gently angled apron at the existing Coastward overlook, see the same shoreline on the map and in 3D, and keep using either camera. The traveler receives a shaped waist and split coat hems. Weapon models, equipment colours, motion, controls and every progression system retain their owners.

## Stable ownership and compatibility

The existing `earthlands` / `shore-overlook` definition owns one convex nine-point footprint: `[22,-28], [30,-30], [38,-30], [40,-28], [41,-20], [40,-12], [38,-10], [30,-10], [22,-12]`. It expands the old 256-square-metre rectangle to 348 square metres. Every point of the old rectangle remains supported; height 1.57, overlap priority 256, the original spur overlap, actors, routes, solids, bridge and scene bounds stay unchanged. No quest, reward, encounter, run, item or story identity changes.

| Source owner | Responsibility |
| --- | --- |
| `world-atlantis-earth.js` | One authored footprint on the existing patch |
| `world-foundations.js` | Convex containment, ground height, segments, movement and picking; rectangle fallback for every other patch |
| `world-foundations-ui.js` | The same nine points in SVG and Canvas maps |
| `world.js` | Existing generic scene ground/picking consumers use canonical convex containment |
| `engine.js` | Original packed apron, bank and cloth meshes; normal batch lifecycle |
| `world-foundations-art.js` | The existing 64 floor matrices, two new non-solid shoreline instances and all other retained bank identities |
| `traveler-art.js` | Exactly three cloth part kinds, retaining their old transforms/materials/poses |

World 9, Adventure 12 and optional WildSigns 1 do not change. No migration, XP reset, automatic equipment change, socket loss, story replay or new consent occurs. Existing personal browser keys and saves are not inspected. Old saves can occupy all formerly valid ground; the expansion adds support. Existing Adventure/Arsenal consumers delegate to the canonical ground owner for line of sight and projectiles.

## Geometry and material rules

The apron covers only the new 92 square metres outside the old cap, with no duplicate top triangles. Its closed bank extends below the water. Three old banks, `coast-bank-20`, `coast-bank-24`, and `coast-bank-69`, now lie inside supported land and are replaced; every other old bank ID and order remains exact. Their original route, normal, height and bounded-count assertions remain. The apron must carry the same explicit terrain material flag as the old cap, so the actual packed shader parameters use the same grass path at their shared edge. The bank remains stone, decorative, non-solid and outside camera authority.

The three cloth parts retain centered-box envelopes, palette, matrices, names and all 49 body instances. Original beveled cloth uses 64 triangles per shared mesh. Head, limbs, faces, joints, attack motion, all seven canonical weapon families and socket markers remain unchanged.

Combined cost relative to PR55: three additional mesh batches/draws per active geometry pass; 12,672 bytes of new shared mesh data; 140 fewer submitted triangles overall; one fewer static bank instance and 96 fewer static instance bytes. The body itself gains 156 triangles (8,280 to 8,436), with unchanged instance count. These are source/packed-geometry counts, not a frame-rate measurement.

## Review and checks

Two existing Sol colleagues independently reviewed the shoreline, continuous old-ground preservation, exact top coverage, cloth envelope and GL ownership. Small D-drive patches compose without full repository copies. Parent's RAM composition passed 14 portable cases before installation. An additional source audit found the missing apron terrain flag; the narrow material repair and its actual packed-parameter regression precede rendered acceptance. A targeted installed run passed 91 of 92 checks: its single old bank-count expectation still asserted 70 after the deliberate removal of exactly three internal banks. The corrected existing check enumerates all 67 retained IDs rather than relaxing the original upper budget or any route/normal assertion.

Installed build/source/current-head command-earned journeys, native primary/boundary/aftermath, actual shoreline walking and both-camera rendering are pending at this integration note. PR55's 765d697 qualification remains historical: source 2,022 Node passes / two skips, Python 442 tests / ten reported skips; primary 1,981, boundary 2,837, footsteps 44 and controlled recovery 42. Those receipts are not rebound to this geometry.

Independent STATION remains owned by the live original remoteFull03 at 765. Its source/homecoming/onboarding passed; it remains at consignment with a known stale later Art admission and is not a full gate pass. Do not mutate it while live. The active Art expectation correction is already reviewed in 11cbea0 and retains detecting negative tests, historical raw fields and the original validator.

After current gates pass, record one short actual gameplay clip and bounded screenshots, then reuse the released independent checkout for exact normally fetched verification. Check grass joins, water contact, edge picking/walking, coat silhouette and both cameras. Human route clarity, camera comfort, audio balance, combat/reward enjoyment and performance remain separate pending acceptance. No merge, deployment, paid work, personal-save read, unrelated shutdown, extra full game, asset download or blocked deletion occurs.
